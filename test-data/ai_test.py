#!/usr/bin/env python3
"""使用百度 AI 菜品识别接口批量测试食物图片。"""

import base64
import glob
import json
import os
import time
import urllib.parse
import urllib.request


ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMAGE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "food-images")
REPORT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ai_test_report.md")
ENV_PATH = os.path.join(ROOT_DIR, ".env.local")
MAX_IMAGE_SIZE = 5 * 1024 * 1024


def load_env_file(path):
    """手工读取简单的 .env 键值对。"""
    values = {}
    if not os.path.isfile(path):
        return values

    with open(path, "r", encoding="utf-8") as env_file:
        for raw_line in env_file:
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip()
            if value[:1] == value[-1:] and value[:1] in ("'", '"'):
                value = value[1:-1]
            values[key] = value
    return values


def get_config():
    """环境变量优先，其次读取项目根目录的 .env.local。"""
    file_values = load_env_file(ENV_PATH)
    names = (
        "BAIDU_AI_APP_ID",
        "BAIDU_AI_API_KEY",
        "BAIDU_AI_SECRET_KEY",
    )
    config = {name: os.environ.get(name) or file_values.get(name, "") for name in names}
    missing = [name for name, value in config.items() if not value]
    if missing:
        raise RuntimeError("缺少百度 AI 配置：" + ", ".join(missing))
    return config


def post_form(url, fields):
    """发送表单请求并解析 JSON 响应。"""
    data = urllib.parse.urlencode(fields).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def get_access_token(api_key, secret_key):
    """获取百度 AI access_token。"""
    query = urllib.parse.urlencode(
        {
            "grant_type": "client_credentials",
            "client_id": api_key,
            "client_secret": secret_key,
        }
    )
    url = "https://aip.baidubce.com/oauth/2.0/token?" + query
    request = urllib.request.Request(url, data=b"", method="POST")
    with urllib.request.urlopen(request, timeout=30) as response:
        payload = json.loads(response.read().decode("utf-8"))
    token = payload.get("access_token")
    if not token:
        detail = payload.get("error_description") or payload.get("error") or "未知错误"
        raise RuntimeError(str(detail))
    return token


def recognize_image(image_path, access_token):
    """识别单张图片并返回最多三个候选。"""
    with open(image_path, "rb") as image_file:
        encoded_image = base64.b64encode(image_file.read()).decode("ascii")

    url = (
        "https://aip.baidubce.com/rest/2.0/image-classify/v2/dish?"
        + urllib.parse.urlencode({"access_token": access_token})
    )
    payload = post_form(
        url,
        {
            "image": encoded_image,
            "top_num": 3,
            "filter_threshold": 0.5,
        },
    )
    if payload.get("error_code"):
        raise RuntimeError(
            "错误码 {}：{}".format(payload["error_code"], payload.get("error_msg", "未知错误"))
        )
    candidates = payload.get("result") or []
    if not candidates:
        raise RuntimeError("接口未返回候选结果")
    return candidates[:3]


def recognize_with_retry(image_path, access_token):
    """单张图片失败后等待 2 秒并重试一次。"""
    last_error = None
    for attempt in range(2):
        try:
            return recognize_image(image_path, access_token)
        except Exception as error:
            last_error = error
            if attempt == 0:
                print("  首次识别失败，2 秒后重试：{}".format(error))
                time.sleep(2)
    raise RuntimeError(str(last_error))


def find_images():
    """查找支持的图片文件并按路径排序。"""
    paths = []
    for pattern in ("*.jpg", "*.jpeg", "*.png", "*.JPG", "*.JPEG", "*.PNG"):
        paths.extend(glob.glob(os.path.join(IMAGE_DIR, pattern)))
    return sorted(set(paths), key=str.lower)


def markdown_text(value):
    """转义 Markdown 表格中的特殊字符。"""
    return str(value).replace("|", "\\|").replace("\n", " ")


def candidate_name(candidates, index):
    if len(candidates) <= index:
        return "-"
    return markdown_text(candidates[index].get("name", "-"))


def write_report(results, average_confidence, success_count, total_count):
    """生成 Markdown 测试报告。"""
    lines = [
        "# 百度 AI 菜品识别测试报告",
        "",
        "| 序号 | 文件名 | Top-1 候选 | Top-1 置信度 | Top-2 | Top-3 | 是否成功 |",
        "| ---: | --- | --- | ---: | --- | --- | :---: |",
    ]
    for index, result in enumerate(results, 1):
        candidates = result["candidates"]
        top_probability = float(candidates[0].get("probability", 0)) if candidates else 0
        top_confidence = "{:.2f}%".format(top_probability * 100) if candidates else "-"
        lines.append(
            "| {} | {} | {} | {} | {} | {} | {} |".format(
                index,
                markdown_text(result["filename"]),
                candidate_name(candidates, 0),
                top_confidence,
                candidate_name(candidates, 1),
                candidate_name(candidates, 2),
                "是" if result["success"] else "否",
            )
        )

    success_rate = success_count / total_count * 100 if total_count else 0
    conclusion = "PASS" if average_confidence > 75 else "FAIL"
    lines.extend(
        [
            "",
            "## 汇总",
            "",
            "- 百度 AI 平均置信度: {:.2f}% （阈值 75%）".format(average_confidence),
            "- 识别成功: {}/{}（{:.2f}%）".format(success_count, total_count, success_rate),
            "- 结论: {}".format(conclusion),
        ]
    )
    failures = [result for result in results if not result["success"]]
    if failures:
        lines.extend(["", "## 失败原因", ""])
        for result in failures:
            lines.append("- {}：{}".format(markdown_text(result["filename"]), result["error"]))

    with open(REPORT_PATH, "w", encoding="utf-8") as report_file:
        report_file.write("\n".join(lines) + "\n")


def main():
    try:
        config = get_config()
        access_token = get_access_token(
            config["BAIDU_AI_API_KEY"], config["BAIDU_AI_SECRET_KEY"]
        )
    except Exception as error:
        print("获取 access_token 失败：{}。请检查百度 AI 密钥配置。".format(error))
        return 1

    images = find_images()
    if not images:
        print("未在 {} 中找到 jpg/jpeg/png 图片。".format(IMAGE_DIR))
        return 1

    results = []
    top_probabilities = []
    for image_path in images:
        filename = os.path.basename(image_path)
        if os.path.getsize(image_path) > MAX_IMAGE_SIZE:
            error = "图片超过 5MB，已跳过"
            print("{} → 失败：{}".format(filename, error))
            results.append(
                {"filename": filename, "success": False, "candidates": [], "error": error}
            )
            continue

        try:
            candidates = recognize_with_retry(image_path, access_token)
            top_probability = float(candidates[0].get("probability", 0))
            top_probabilities.append(top_probability)
            display = "；".join(
                "{} ({:.2f}%)".format(item.get("name", "未知"), float(item.get("probability", 0)) * 100)
                for item in candidates
            )
            print("{} → {}".format(filename, display))
            results.append(
                {"filename": filename, "success": True, "candidates": candidates, "error": ""}
            )
        except Exception as error:
            print("{} → 失败：{}".format(filename, error))
            results.append(
                {
                    "filename": filename,
                    "success": False,
                    "candidates": [],
                    "error": str(error),
                }
            )

        # QPS 限速：百度免费额度约 2 QPS，逐张间隔避免触发限流（错误码 18）
        time.sleep(1)

    success_count = len(top_probabilities)
    total_count = len(images)
    average_confidence = (
        sum(top_probabilities) / success_count * 100 if success_count else 0
    )
    success_rate = success_count / total_count * 100 if total_count else 0
    write_report(results, average_confidence, success_count, total_count)

    print("\n汇总")
    print("平均 Top-1 置信度：{:.2f}%（基于识别成功的 {} 张）".format(average_confidence, success_count))
    print("识别成功：{}/{}（{:.2f}%）".format(success_count, total_count, success_rate))
    failures = [result for result in results if not result["success"]]
    if failures:
        print("失败原因：")
        for result in failures:
            print("- {}：{}".format(result["filename"], result["error"]))
    print("测试报告：{}".format(REPORT_PATH))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
