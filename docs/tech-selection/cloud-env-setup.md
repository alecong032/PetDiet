# 云开发环境配置清单

> **任务**: T1.1.3 — 创建云开发项目，配置基础环境
> **创建日期**: 2026-08-12
> **更新日期**: 2026-08-17 (改为 app.rdb() API，表已通过 SQL 编辑器创建)
> **环境 ID**: `petdiet-0812`

---

## 一、环境信息

| 字段 | 值 | 说明 |
|------|-----|------|
| **环境 ID** | `petdiet-0812` | 腾讯云开发环境 |
| **地域** | `ap-shanghai` | 上海 |
| **套餐** | 个人版 19.9 元/月 | 40,000 资源点/月 |
| **附加套餐** | COS标准存储 100GB/1年 + 基础图片处理 1TB/1年 | 30.1 元一次性 |
| **数据库类型** | PostgreSQL | 关系型数据库 |
| **数据库 SDK** | `@cloudbase/node-sdk` ^3.0.0 | CloudBase 托管，通过 `app.rdb()` 访问 |
| **存储 SDK** | `@cloudbase/node-sdk` ^3.0.0 | 云存储操作 |

---

## 二、数据库表结构

### 2.1 表一览

| 表名 | 用途 | 数据模型来源 |
|------|------|-------------|
| `users` | 用户基本信息 | PRD §5.1 User |
| `pets` | 宠物数据 | PRD §5.1 Pet |
| `food_records` | 饮食记录 | PRD §5.1 FoodRecord |
| `weight_records` | 体重记录 | PRD §5.1 WeightRecord |
| `user_profiles` | 用户详细资料 | PRD §5.1 UserProfile |
| `calorie_goals` | 卡路里目标设置 | PRD §5.1 CalorieGoal |

### 2.2 表字段定义

#### users

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | SERIAL PK | 自增主键 |
| `open_id` | VARCHAR(128) UNIQUE | 登录凭证（微信/手机号） |
| `nickname` | VARCHAR(64) | 昵称 |
| `locale` | VARCHAR(16) | 语言偏好，默认 `zh-CN` |
| `created_at` | TIMESTAMPTZ | 注册时间 |

#### pets

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | SERIAL PK | 自增主键 |
| `user_id` | INTEGER FK→users | 关联用户 ID |
| `name` | VARCHAR(32) | 宠物名称，默认 "小可爱" |
| `hunger` | FLOAT | 饥饿值 (0-100) |
| `health` | FLOAT | 健康值 (0-100) |
| `mood` | FLOAT | 心情值 (0-100，派生) |
| `status` | VARCHAR(16) | 状态: happy/normal/sick |
| `last_fed_at` | TIMESTAMPTZ | 最后喂食时间 |
| `last_calculated_at` | TIMESTAMPTZ | 最后属性计算时间 |
| `created_at` | TIMESTAMPTZ | 创建时间 |

#### food_records

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | SERIAL PK | 自增主键 |
| `user_id` | INTEGER FK→users | 关联用户 ID |
| `pet_id` | INTEGER FK→pets | 关联宠物 ID |
| `food_name` | VARCHAR(128) | 食物名称 |
| `calories` | FLOAT | 热量 (kcal) |
| `protein` | FLOAT | 蛋白质 (g) |
| `carbs` | FLOAT | 碳水 (g) |
| `fat` | FLOAT | 脂肪 (g) |
| `confidence` | FLOAT | AI 置信度 |
| `image_url` | VARCHAR(512) | 食物照片 URL |
| `source` | VARCHAR(16) | 来源: ai/manual/favorite |
| `created_at` | TIMESTAMPTZ | 记录时间 |

#### weight_records

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | SERIAL PK | 自增主键 |
| `user_id` | INTEGER FK→users | 关联用户 ID |
| `weight` | FLOAT | 体重 (kg) |
| `recorded_at` | TIMESTAMPTZ | 记录时间 |

#### user_profiles

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | SERIAL PK | 自增主键 |
| `user_id` | INTEGER UNIQUE FK→users | 关联用户 ID (1:1) |
| `gender` | VARCHAR(16) | 性别: male/female |
| `birth_date` | DATE | 出生日期 |
| `height` | FLOAT | 身高 (cm) |
| `current_weight` | FLOAT | 当前体重 (kg) |
| `activity_level` | VARCHAR(32) | 活动量: sedentary/light/moderate/active/very_active |
| `updated_at` | TIMESTAMPTZ | 更新时间 |

#### calorie_goals

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | SERIAL PK | 自增主键 |
| `user_id` | INTEGER UNIQUE FK→users | 关联用户 ID (1:1) |
| `target_weight` | FLOAT | 目标体重 (kg) |
| `goal_type` | VARCHAR(16) | 目标类型: lose/maintain/gain |
| `daily_calorie_goal` | FLOAT | 每日卡路里目标 (kcal) |
| `bmr` | FLOAT | 基础代谢率 |
| `tdee` | FLOAT | 每日总消耗 |
| `is_auto_calculated` | BOOLEAN | 是否自动计算 |
| `updated_at` | TIMESTAMPTZ | 更新时间 |

### 2.3 索引设计

| 表 | 索引名 | 字段 | 类型 | 查询场景 |
|------|--------|------|------|---------|
| `users` | `idx_users_open_id` | `open_id` | 唯一 | 登录时按 open_id 查用户 |
| `pets` | `idx_pets_user_id` | `user_id` | 唯一 | 按 user_id 查宠物 (1:1) |
| `food_records` | `idx_food_records_user_created` | `user_id, created_at DESC` | 非唯一 | 按用户查饮食记录，时间倒序 |
| `weight_records` | `idx_weight_records_user_recorded` | `user_id, recorded_at DESC` | 非唯一 | 按用户查体重历史，时间倒序 |
| `user_profiles` | `idx_user_profiles_user_id` | `user_id` | 唯一 | 按 user_id 查资料 (1:1) |
| `calorie_goals` | `idx_calorie_goals_user_id` | `user_id` | 唯一 | 按 user_id 查目标 (1:1) |

> 索引创建方式：在 CloudBase 控制台 → PostgreSQL → SQL 编辑器中执行建表 SQL（包含索引）。

---

## 三、数据库连接

### 3.1 访问模型

CloudBase PostgreSQL 是托管式访问，**不需要数据库密码**。有 3 种访问方式：

| 方式 | SDK | 认证 | 适用场景 |
|------|-----|------|---------|
| 云函数 | `@cloudbase/node-sdk` | 自动（环境注入） | 后端业务逻辑 |
| 前端 JS | `@cloudbase/js-sdk` | Publishable Key + 登录态 | 前端直接查询 |
| HTTP API | REST API | Bearer Token | 其他语言/平台 |

### 3.2 云函数中使用 `app.rdb()`

```javascript
const cloudbase = require('@cloudbase/node-sdk')
const app = cloudbase.init({ env: cloudbase.SYMBOL_DEFAULT_ENV })
const db = app.rdb()

// 查询
const { data, error } = await db.from('users').select('*').eq('id', 1)

// 插入
await db.from('food_records').insert({ user_id: 1, food_name: '苹果', calories: 52 })

// 更新
await db.from('pets').update({ hunger: 80 }).eq('id', petId)

// 删除
await db.from('food_records').delete().eq('id', recordId)
```

### 3.3 前端使用 `app.rdb()`

```javascript
import cloudbase from '@cloudbase/js-sdk'
const app = cloudbase.init({ env: 'petdiet-0812' })
const db = app.rdb()
// 与云函数中用法完全一致
```

> ⚠️ 前端查询受 RLS（行级安全）策略限制，用户只能访问自己的数据。

### 3.4 凭证说明

| 凭证类型 | 角色 | 说明 |
|---------|------|------|
| Publishable Key | `anon` | 前端公开使用，受 RLS 限制 |
| 用户登录 Token | `authenticated` | 代表登录用户，受 RLS 限制 |
| API Key | `service_role` | 后端使用，绕过 RLS，**不能暴露给前端** |

---

## 四、云存储

### 4.1 存储桶信息

| 字段 | 值 |
|------|-----|
| **存储类型** | COS 标准存储 |
| **容量** | 100GB / 1年 |
| **地域** | ap-shanghai（与 CloudBase 环境一致） |
| **图片处理** | 基础图片处理 1TB/1年（缩略图、压缩、格式转换） |

### 4.2 文件夹结构

| 路径 | 用途 | 权限 |
|------|------|------|
| `/food-images/` | 食物照片 | 上传需鉴权 / 读取公开（CDN） |
| `/pet-avatars/` | 宠物头像 | 上传需鉴权 / 读取公开（CDN） |
| `/user-avatars/` | 用户头像 | 上传需鉴权 / 读取公开（CDN） |

### 4.3 图片处理模板

| 模板 | 用途 | 参数 |
|------|------|------|
| 缩略图 | 列表展示 | 宽 200px，质量 70% |
| 压缩图 | 原图展示 | 宽 1080px，质量 80% |
| 格式转换 | WebP 优化 | 自动转 WebP（减少 30% 体积） |

---

## 五、云函数

### 5.1 函数列表

| 函数名 | 路径 | 超时 | 内存 | SDK | 说明 | 状态 |
|--------|------|:----:|:----:|------|------|:----:|
| `auth` | `cloud-functions/auth/` | 5s | 256MB | `@cloudbase/node-sdk` | 注册/登录 | 骨架就绪 |
| `food` | `cloud-functions/food/` | **15s** | 256MB | `@cloudbase/node-sdk` | AI 识别/搜索/记录 CRUD | 骨架就绪 |
| `pet` | `cloud-functions/pet/` | 5s | 256MB | `@cloudbase/node-sdk` | 宠物查询/喂食/更新 | 骨架就绪 |
| `user` | `cloud-functions/user/` | 5s | 256MB | `@cloudbase/node-sdk` | 资料/目标/体重 | 骨架就绪 |
| `setup-storage` | `cloud-functions/setup-storage/` | 5s | 256MB | `@cloudbase/node-sdk` | 创建存储文件夹 | 骨架就绪 |

> 建表操作在 SQL 编辑器中完成，无需 `init-database` 云函数。

### 5.2 环境变量配置

在 CloudBase 控制台 → 云函数 → 对应函数 → 配置 → 环境变量中设置：

| 变量名 | 用于函数 | 说明 | 配置时机 |
|--------|---------|------|---------|
| `BAIDU_AI_APP_ID` | food | 百度 AI 应用 ID | T1.2.1 完成后 |
| `BAIDU_AI_API_KEY` | food | 百度 AI API Key | T1.2.1 完成后 |
| `BAIDU_AI_SECRET_KEY` | food | 百度 AI Secret Key | T1.2.1 完成后 |

> 数据库无需配置连接变量，`@cloudbase/node-sdk` 在云函数环境中自动获取鉴权。

---

## 六、安全规则

### 6.1 数据库权限

| 策略 | 说明 |
|------|------|
| **仅云函数可访问** | 前端不可直接操作数据库，所有操作通过云函数中转 |
| **行级安全 (RLS)** | PostgreSQL RLS 策略确保用户只能访问自己的数据 |

> **安全原则**: 前端直接访问数据库存在安全风险。所有数据操作必须通过云函数验证身份后执行。

### 6.2 存储权限

| 操作 | 权限 | 说明 |
|------|------|------|
| 上传 | 需鉴权 | 仅登录用户可上传，通过云函数生成临时上传凭证 |
| 读取 | 公开 | 图片 URL 可直接访问（CDN 加速） |
| 删除 | 需鉴权 | 仅通过云函数删除 |

---

## 七、部署操作清单

### 7.1 建表（通过 SQL 编辑器）

在 CloudBase 控制台 → 数据库 → PostgreSQL → SQL 编辑器中粘贴执行建表 SQL：

```
已完成 ✅ 2026-08-17
```

### 7.2 部署云函数

在 CloudBase 控制台 → 云函数 页面，逐个上传以下函数：

| # | 函数名 | 操作 | 超时 |
|---|--------|------|:----:|
| 1 | `auth` | 上传代码 → 安装依赖 | 5s |
| 2 | `food` | 上传代码 → 安装依赖 → 配置 AI 环境变量 | **15s** |
| 3 | `pet` | 上传代码 → 安装依赖 | 5s |
| 4 | `user` | 上传代码 → 安装依赖 | 5s |
| 5 | `setup-storage` | 上传代码 → 安装依赖 | 5s |

### 7.3 验证表结构

在控制台 → 数据库 → PostgreSQL → 数据表页面确认 6 张表均已创建：

- [ ] `users` + `idx_users_open_id`
- [ ] `pets` + `idx_pets_user_id`
- [ ] `food_records` + `idx_food_records_user_created`
- [ ] `weight_records` + `idx_weight_records_user_recorded`
- [ ] `user_profiles` + `idx_user_profiles_user_id`
- [ ] `calorie_goals` + `idx_calorie_goals_user_id`

### 7.4 配置存储文件夹

运行 `setup-storage` 函数（参数 `{}`），或手动在控制台 → 存储 页面创建 3 个文件夹：

- [ ] `/food-images/`
- [ ] `/pet-avatars/`
- [ ] `/user-avatars/`

---

## 八、本地项目结构

```
SideProject/
├── cloud-functions/
│   ├── auth/
│   │   ├── index.js          # 认证云函数 (app.rdb())
│   │   └── package.json
│   ├── food/
│   │   ├── index.js          # 食物云函数 (app.rdb(), AI 识别 15s 超时)
│   │   └── package.json
│   ├── pet/
│   │   ├── index.js          # 宠物云函数 (app.rdb())
│   │   └── package.json
│   ├── user/
│   │   ├── index.js          # 用户资料云函数 (app.rdb())
│   │   └── package.json
│   └── setup-storage/
│       ├── index.js          # 存储初始化 (@cloudbase/node-sdk)
│       └── package.json
├── docs/
│   └── tech-selection/
│       └── cloud-env-setup.md  # 本文档
└── .env.local                  # 环境变量（SecretId/Key）
```
