"""T2.4.4 数值平衡边界测试 v2 — 修正用例精度 + 记录两项发现"""
import json

def compute_hunger(ratio):
    if ratio < 0.60: return ratio * 50
    elif ratio < 0.90: return 30 + (ratio - 0.60) * 133
    elif ratio < 1.10: return 70 + (ratio - 0.90) * 100
    elif ratio < 1.20: return 90 + (ratio - 1.10) * 100
    return 100

def compute_mood(hunger, health):
    if 70 <= hunger <= 90 and health >= 60: return 90
    elif hunger > 90 or health < 30: return 25
    elif hunger < 30: return 20
    return 50

def map_status(mood, health, hunger):
    if health < 30: return "SICK"
    if hunger >= 90: return "OVERFULL"
    if hunger < 30 or mood < 35: return "HUNGRY"
    if mood >= 70: return "HAPPY"
    return "NORMAL"

def evaluate_intake(ratio):
    if 0.90 <= ratio <= 1.10: return +3
    elif 1.10 < ratio <= 1.20: return -1
    elif ratio > 1.20: return -4
    elif ratio < 0.60: return -2
    return 0

def evaluate_nutrition(cal, p, c, f):
    if cal <= 0: return 0
    pr, fr, cr = (p*4)/cal, (f*9)/cal, (c*4)/cal
    if pr >= 0.15 and fr <= 0.35: return +2
    elif fr > 0.40 or (pr < 0.05 and cr > 0.70): return -3
    return 0

def clamp(v, lo=0, hi=100): return max(lo, min(v, hi))

def apply_decay(health, hunger, dt):
    if hunger < 20 and dt >= 6: return max(0, health - min(5.0, (dt - 6) * 0.5))
    elif hunger > 95 and dt >= 4: return max(0, health - min(3.0, (dt - 4) * 0.5))
    return health

results = []
def check(group, case, got, expect):
    if isinstance(expect, float) or isinstance(got, float):
        ok = abs(got - expect) < 1e-9
    else:
        ok = got == expect
    results.append((group, case, got, expect, ok))

# A. ratio 边界（hunger 连续性）
for r, exp in [(0.5999,29.995),(0.60,30.0),(0.8999,69.8867),(0.8999999,69.9),(0.90,70.0),(1.0999,89.99),
               (1.10,90.0),(1.1999,99.99),(1.20,100.0),(1.2001,100.0)]:
    check("A", f"ratio={r} → hunger", round(compute_hunger(r),4), round(exp,4))

# B. mood 边界
check("B","hunger=70,health=60 → mood", compute_mood(70,60), 90)
check("B","hunger=90,health=60 → mood", compute_mood(90,60), 90)
check("B","hunger=90.01,health=88 → mood", compute_mood(90.01,88), 25)
check("B","hunger=80,health=59.99 → mood", compute_mood(80,59.99), 50)
check("B","hunger=80,health=30 → mood", compute_mood(80,30), 50)
check("B","hunger=80,health=29.99 → mood", compute_mood(80,29.99), 25)
check("B","hunger=29.99,health=80 → mood", compute_mood(29.99,80), 20)
check("B","hunger=30,health=80 → mood", compute_mood(30,80), 50)

# C. 状态映射边界与优先级
check("C","health=29.99,hunger=95 → SICK（优先于过饱）", map_status(compute_mood(95,29.99),29.99,95), "SICK")
check("C","health=30,hunger=100 → OVERFULL", map_status(compute_mood(100,30),30,100), "OVERFULL")
check("C","health=80,hunger=90 → OVERFULL（过饱压过开心）", map_status(compute_mood(90,80),80,90), "OVERFULL")
check("C","health=60,hunger=70 → HAPPY", map_status(compute_mood(70,60),60,70), "HAPPY")
check("C","health=59.99,hunger=70 → NORMAL", map_status(compute_mood(70,59.99),59.99,70), "NORMAL")
check("C","health=70,hunger=29.99 → HUNGRY", map_status(compute_mood(29.99,70),70,29.99), "HUNGRY")
check("C","health=70,hunger=30 → NORMAL", map_status(compute_mood(30,70),70,30), "NORMAL")
check("C","health=80,hunger=50 → NORMAL", map_status(compute_mood(50,80),80,50), "NORMAL")

# D. intake / clamp / nutrition
check("D","ratio=1.10 → intake", evaluate_intake(1.10), 3)
check("D","ratio=1.20 → intake", evaluate_intake(1.20), -1)
check("D","ratio=1.2001 → intake", evaluate_intake(1.2001), -4)
check("D","ratio=0.5999 → intake", evaluate_intake(0.5999), -2)
check("D","ratio=0.60 → intake", evaluate_intake(0.60), 0)
check("D","clamp(100+3+2) → 100", clamp(100+3+2), 100)
check("D","clamp(0-4-3) → 0", clamp(0-4-3), 0)
check("D","nutrition calories=0 → 0（除零防护）", evaluate_nutrition(0,5,10,3), 0)
check("D","nutrition 均衡 p=0.20/f=0.27 → +2", evaluate_nutrition(100,5,10,3), 2)
check("D","nutrition 高脂 f=0.45 → -3", evaluate_nutrition(100,5,5,5), -3)
check("D","nutrition 低蛋白高碳水 → -3", evaluate_nutrition(100,1,20,2), -3)
# 精确 35/9 g 脂肪 → fatRatio 恰 0.35
f_exact = 35/9
check("D","nutrition fatRatio=0.35 精确 → +2", evaluate_nutrition(100,5,12,f_exact), 2)
# 精确等值边界（倍数构造，180 kcal 使 0.15/0.40/0.05 等值可精确表达）
check("D","nutrition pr=0.15 精确(6.75g/180) 且 fr=0.35 → +2", evaluate_nutrition(180,6.75,20,7), 2)
check("D","nutrition fr=0.40 精确(8g/180) 且 pr=0.10 → 0（>0.40 为严格）", evaluate_nutrition(180,4.5,20,8), 0)
check("D","nutrition pr=0.05 精确(2.25g/180) 且 cr=0.75 → 0（<0.05 为严格）", evaluate_nutrition(180,2.25,33.75,4), 0)
check("D","intake ratio=0.90 精确边界 → +3", evaluate_intake(0.90), 3)

# E. 时间衰减边界
check("E","hunger=19.99,dt=6h → 不衰减（min(5,0)=0）", apply_decay(50,19.99,6.0), 50.0)
check("E","hunger=19.99,dt=8h → -1", apply_decay(50,19.99,8.0), 49.0)
check("E","hunger=20,dt=8h → 不触发（需<20）", apply_decay(50,20,8.0), 50.0)
check("E","hunger=95,dt=8h → 不触发（需>95）", apply_decay(50,95,8.0), 50.0)
check("E","hunger=95.01,dt=4h → 不衰减（min(3,0)=0）", apply_decay(50,95.01,4.0), 50.0)
check("E","hunger=95.01,dt=8h → -2", apply_decay(50,95.01,8.0), 48.0)
check("E","hunger=100,dt=20h → 上限 -3", apply_decay(50,100,20.0), 47.0)
check("E","hunger=0,dt=30h → 上限 -5", apply_decay(50,0,30.0), 45.0)

# F. 端到端（与已推送线框对齐验证）
def feed_step(cur_health, today_intake, goal, cal, p, c, f):
    ratio = (today_intake+cal)/goal
    hunger = compute_hunger(ratio)
    h = clamp(cur_health + evaluate_intake(ratio) + evaluate_nutrition(cal,p,c,f))
    mood = compute_mood(hunger, h)
    return dict(ratio=round(ratio,4), hunger=round(hunger,2), health=h, mood=mood,
                status=map_status(mood,h,hunger),
                intake_health=evaluate_intake(ratio), nutrition_health=evaluate_nutrition(cal,p,c,f))

sc_n0 = feed_step(88,1240,2000,650,16.25,87.75,26)        # 营养中性：pr=0.10(<0.15), fr=0.36(>0.35 且 ≤0.40) → 0
sc_real = feed_step(88,1240,2000,650,30,80,20)            # 合理中餐营养值
check("F","1240+650/2000 → hunger", sc_real["hunger"], 74.5)
check("F","1240+650/2000 → status", sc_real["status"], "HAPPY")
check("F","营养中性(pr0.10/fr0.36) → health 91", sc_n0["health"], 91)
check("F","真实营养(P30/C80/F20) → health 93", sc_real["health"], 93)

# G. 浮点边界观察（记录，不计入判定）
fr = (20*9)/650
obs = {
    "fatRatio_20g_650kcal": fr,
    "leq_0p35_strict": fr <= 0.35,
    "note": "fatRatio 为浮点结果；等值比较在浮点误差下可能翻转（如 3.8888889*9/100=0.350000001>0.35）",
}

fails = [r for r in results if not r[4]]
print(f"TOTAL={len(results)} PASS={len(results)-len(fails)} FAIL={len(fails)}")
for g,case,got,exp,ok in results:
    if not ok: print(f"  FAIL [{g}] {case}: got={got} expect={exp}")
print("SC_REAL:", json.dumps(sc_real, ensure_ascii=False))
print("SC_N0  :", json.dumps(sc_n0, ensure_ascii=False))
print("OBS    :", json.dumps(obs, ensure_ascii=False))
