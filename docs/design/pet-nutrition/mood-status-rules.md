# 心情值（mood）衍生规则与状态阈值

> 参数来源：TDD §6.2.4 参数表（单一声明源）；计算步骤 TDD §6.2.2 第 7 步；平台无关实现 TDD §6.2.3 `computeMood` / `mapStatus`；状态定稿 DECISIONS D-009；饱食度映射 T2.4.1（`satiety-map.md`）；健康值公式 T2.4.2（`health-formula.md`）。

## 1. 派生关系

```
ratio  = 今日累计摄入 / 每日卡路里目标        → hunger（T2.4.1 映射）
health = 累积评估结果（T2.4.2 公式 A/B/C）    → 参与 mood 判定
mood   = f(hunger, health)                    → 纯派生值，无独立存储目标
status = g(health, hunger, mood)              → 6 状态之一（D-009）
```

`mood` 与 `hunger` 均为派生值：`PetState.mood` 标记为 computed，不随时间线性衰减，每次喂食或 App 回前台时按本节规则重算。

## 2. 心情值四档规则（TDD §6.2.2 步骤 7 / §6.2.3 `computeMood`）

按以下**顺序**判定，命中即返回；参数取自 §6.2.4（`happy_hunger_range` 70-90、`happy_health_min` 60、`mood_happy` 90、`mood_uncomfortable` 25、`mood_sad` 20、`mood_normal` 50）：

| 顺序 | 条件 | `mood` | 档位名 |
|---|---|---:|---|
| 1 | `70 ≤ hunger ≤ 90` 且 `health ≥ 60` | 90 | 开心 |
| 2 | `hunger > 90` 或 `health < 30` | 25 | 难受（吃撑或生病） |
| 3 | `hunger < 30` | 20 | 难过（饥饿） |
| 4 | 其余 | 50 | 正常 |

**边界归属**

| 边界 | 归属 | 说明 |
|---|---|---|
| `hunger = 70` | 条件 1 成立（闭区间下界） | 与 T2.4.1 满足区间下界一致 |
| `hunger = 90` | 条件 1 成立（闭区间上界） | 条件 2 要求严格 `> 90`，故 90 不落难受 |
| `health = 60` | 条件 1 成立（`≥ 60`） | — |
| `health = 30` | 不满足条件 2（要求 `< 30`） | 与 T2.4.2 `intake_health` 无关，仅作 mood 门槛 |
| `hunger = 30` | 不满足条件 3（要求 `< 30`） | 落入条件 4 |

`mood` 为**离散四档**取值 `90 / 50 / 25 / 20`，不存在中间值；因此任何基于 mood 的下游判定（含状态映射）都只能使用这四档。

## 3. 六状态阈值与优先级（D-009 / TDD §6.2.3 `mapStatus`）

状态集合（D-009 定稿）：`NORMAL`、`HAPPY`、`HUNGRY`、`EATING`、`OVERFULL`、`SICK`。

映射规则按以下**优先级顺序**判定，命中即返回：

| 顺序 | 条件 | 状态 |
|---|---|---|
| 1 | `health < 30` | `SICK` 生病 |
| 2 | `hunger ≥ 90` | `OVERFULL` 过饱（含 T2.4.1 的「过饱」与「吃撑」两档） |
| 3 | `hunger < 30` 或 `mood < 35` | `HUNGRY` 饥饿 |
| 4 | `mood ≥ 70` | `HAPPY` 开心 |
| 5 | 其余 | `NORMAL` 日常 |

**`EATING` 不由本映射产生**：它由喂食动作触发（TDD §6.2.3 `feed()` 返回 `status: .eating`），仅在喂食动画播放期间（1.5–2s，T2.7.2）使用，动画结束后按本表重新映射。

### 3.1 优先级含义

- 生病优先于一切：`health < 30` 时即使吃撑也显示 `SICK`。
- 过饱优先于开心：`hunger = 90` 时既满足 mood 开心档的条件 1（mood = 90），又满足 `hunger ≥ 90`，按优先级取 `OVERFULL`。这是本规则最易被实现反的错误点。
- 饥饿优先于开心：`hunger < 30` 时即使 mood 未低于 35 也显示 `HUNGRY`。

### 3.2 关于第 3 条中的 `mood < 35`

按第 2 节的四档取值推导，`mood < 35` 只能取 `25` 或 `20`，而这两档的产生前提分别是「`hunger > 90` 或 `health < 30`」与「`hunger < 30`」——均已被更高优先级条件覆盖。因此该子条件在当前参数下**不可单独触发**，属防御性冗余（若未来调整 mood 档位或阈值则可能生效）。保留以与 TDD §6.2.3 `mapStatus` 逐字一致。

## 4. 状态触发矩阵

| 状态 | 主触发量 | 触发条件 | 典型场景 |
|---|---|---|---|
| `SICK` | health | `health < 30` | 长期饥饿/过饱衰减或连续不均衡饮食后 |
| `OVERFULL` | hunger | `hunger ≥ 90`（ratio ≥ 1.10） | 今日摄入超过目标 110% |
| `HUNGRY` | hunger | `hunger < 30`（ratio < 0.60），或 `mood < 35`（防御性，见 §3.2） | 今日摄入不足目标 60% |
| `HAPPY` | mood | `mood ≥ 70`（即 mood = 90） | 摄入落在满足区间且 `health ≥ 60` |
| `NORMAL` | — | 以上均不满足 | 摄入处于正常区间且 health 中等 |
| `EATING` | 动作 | 喂食流程触发（非映射） | 喂食动画播放期间 |

## 5. 边界与典型用例验算

`hunger` 按 T2.4.1（`satiety-map.md` §2）计算，`health` 仅作输入，`mood` 按第 2 节判定。

| # | 场景 | ratio | hunger（映射） | health | mood（第 2 节） | status（第 3 节） |
|---:|---|---:|---:|---:|---:|---|
| 1 | 均衡满足 | 1.00 | 80 | 90 | 90（条件 1：70≤80≤90 且 90≥60） | `HAPPY`（mood ≥ 70） |
| 2 | 吃撑 | 1.25 | 100 | 88 | 25（条件 2：hunger > 90） | `OVERFULL`（优先级 2，health 88 ≥ 30 不落 sick） |
| 3 | 饥饿 | 0.50 | 25 | 70 | 20（条件 3：hunger < 30） | `HUNGRY`（hunger < 30） |
| 4 | 生病优先 | 1.00 | 80 | 25 | 25（条件 2：health < 30） | `SICK`（优先级 1 压过其余） |
| 5 | **过饱压过开心** | 1.10 | 90 | 80 | 90（条件 1：70≤90≤90 且 80≥60） | `OVERFULL`（优先级 2：hunger ≥ 90） |
| 6 | 满足下界 | 0.90 | 70 | 60 | 90（条件 1 边界成立） | `HAPPY`（mood ≥ 70） |
| 7 | health 恰好 30 | 0.50 | 25 | 30 | 20（条件 2 要求 `< 30`，不成立） | `HUNGRY`（hunger < 30，非 SICK） |
| 8 | 正常区间 | 0.75 | 49.95 → 50 | 80 | 50（条件 4） | `NORMAL`（不满足前四条） |
| 9 | 喂食动画中 | — | — | — | — | `EATING`（动作触发，不参与映射） |
| 10 | 吃撑且生病 | 1.30 | 100 | 20 | 25（条件 2） | `SICK`（优先级 1） |

> 注：`hunger` 用于判定的取值为映射原始值，**不取整**。用例 8 的判定按原始值 `49.95` 执行（表内「→ 50」仅为显示近似），取整与否不改变本用例的 `mood` / `status` 结果。

## 6. 与相关文档的一致性

| 文档 | 关系 | 状态 |
|---|---|---|
| `satiety-map.md` §4（T2.4.1） | 同优先级、同条件，本文补充 mood 判定与边界 | ✅ 一致 |
| `health-formula.md`（T2.4.2） | health 更新口径与衰减规则的来源 | ✅ 一致 |
| TDD §6.2.2 步骤 7 / §6.2.3 `computeMood` | mood 四档规则来源 | ✅ 一致 |
| TDD §6.2.3 `mapStatus` | 六状态映射来源（含 eating 说明） | ✅ 一致 |
| `core-flow.html` Lane 04 | 面向用户的摄入区间→状态对照（简化口径） | ✅ 一致（细口径见本文） |
| DECISIONS D-009 | 六状态定稿与映射优先级依据 | ✅ 一致 |

### ⚠️ 待确认：TDD §6.2.4 参数表 `map_status` 行未同步

TDD §6.2.4（自称数值参数**单一声明源**）中 `map_status` 行当前为：

```
health < 30 → sick；mood ≥ 70 → happy；mood < 35 → sad；否则 normal
```

该口径包含已废弃状态 `sad`、缺少 `overfull` 与 `hungry` 维度，与 D-009 定稿、TDD §6.2.3 `mapStatus` 实现、`satiety-map.md` §4 均不一致。D-009 变更说明已要求「§6.2 mapStatus 增加 hunger 维度」，§6.2.3 已更新、§6.2.4 漏改。

**处理建议**：将 §6.2.4 `map_status` 行修正为
`health < 30 → sick；hunger ≥ 90 → overfull；hunger < 30 或 mood < 35 → hungry；mood ≥ 70 → happy；否则 normal（eating 由喂食动作触发）`。
因 TDD 属冻结基线，修正需变更控制确认（`docs/CHANGE_CONTROL.md`），暂不在本文档内改动 TDD。

## 7. 单元测试用例（对接 T7 测试期）

| 用例名 | 输入（health、hunger、mood 前置） | 预期 status |
|---|---|---|
| 生病压过过饱 | health 20、hunger 95 | `SICK` |
| 过饱压过开心 | health 80、hunger 90 | `OVERFULL` |
| 饥饿优先 | health 70、hunger 29 | `HUNGRY` |
| 开心判定 | health 60、hunger 70 | `HAPPY` |
| 开心门槛外 | health 59、hunger 80 | `NORMAL`（mood = 50） |
| 日常 | health 80、hunger 50 | `NORMAL` |
| 喂食动画 | 喂食流程中 | `EATING` |

---

T2.4.3 · 心情值衍生规则与状态阈值 · 依据 TDD §6.2.2/§6.2.3/§6.2.4、D-009、T2.4.1 satiety-map、T2.4.2 health-formula
