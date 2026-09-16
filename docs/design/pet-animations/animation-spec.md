# 宠物动画规范 · 分镜 / 喂食时间轴 / 页面转场

> T2.7.1 + T2.7.2 + T2.7.3 · PetDiet · Android / Jetpack Compose / Material 3
> 依据：D-009（六状态定稿）、TDD §6.2（状态与引擎）、navigation-scheme.md §七（转场基线 300ms）、PRD §6.1（喂食动画 ≥30fps）、docs/design/pet-states/ 与 pet-animations/ 既有形象与动画资源。
> 依赖：T2.7.1 输入 T1.3.2（六状态形象）、依赖 T2.6.1（home.html 主页呈现）；T2.7.3 依赖 T2.2.1（core-flow.html 流程与导航语义）。

## 一、六状态动画分镜（T2.7.1）

### 1.1 资源现状

`docs/design/pet-animations/<state>/` 下每状态已有：`animation.webp`（动画预览）+ `frame-1.png` / `frame-2.png`（两个关键姿态帧）。`overfull` 另有 v2 / v3 两轮迭代，**v3 为定稿版本**（见 `docs/review/T1.7.1-需求评审材料.md`）。

| 状态 | 资源目录 | animation.webp | 关键帧 |
|---|---|---|---|
| NORMAL | `pet-animations/normal/` | ✅ | frame-1 / frame-2 |
| HAPPY | `pet-animations/happy/` | ✅ | frame-1 / frame-2 |
| HUNGRY | `pet-animations/hungry/` | ✅ | frame-1 / frame-2 |
| EATING | `pet-animations/eating/` | ✅ | frame-1 / frame-2 |
| OVERFULL | `pet-animations/overfull-v3/`（定稿） | ✅ | frame-1 / frame-2 |
| SICK | `pet-animations/sick/` | ✅ | frame-1 / frame-2 |

> ⚠️ 现有 `.webp` 体积为 0.8–1.3MB，仅作**视觉参照与分镜依据**；交付实现使用 T2.8 导出的 Lottie 资源（要求 < 50KB/个）。当前 webp 不直接进包。

### 1.2 分镜定义（每状态 3–5 秒）

分镜 = 两个关键姿态帧 + 中间插值（由 Lottie 生成），无额外新增帧。下表给出每状态的时长、循环方式、触发条件与动作意图；动作意图为设计说明，具体形变以实现资源为准。

| 状态 | 时长 | 循环方式 | 触发条件（D-009 / satiety-map §4） | 动作意图（基于 frame-1 ↔ frame-2 插值） |
|---|---:|---|---|---|
| NORMAL 日常 | 3.0s | 无限缓循环（loop） | 其余情况（`30 ≤ hunger < 90` 且 `mood = 50`，health ≥ 30） | 轻微起伏呼吸 + 眨眼；幅度最小，作为待机基准 |
| HAPPY 开心 | 3.0s | 无限循环 | 优先级 4：`mood ≥ 70`（mood = 90） | 上半身轻快弹跳 / 左右摆动，节奏最活跃 |
| HUNGRY 饥饿 | 3.5s | 无限循环 | 优先级 3：`hunger < 30` 或 `mood < 35` | 前倾、视线向下（朝向食盆方向），节奏偏慢且下沉 |
| EATING 进食 | **1.8s**（名义 2s） | 单次播放（喂食动画，见 §二） | 喂食动作触发（`PetEngine.feed(...)` 返回 `PetState(status = eating)`） | 低头进食循环；时长与 §2.1 时间轴同源 |
| OVERFULL 过饱 | 3.5s | 无限循环 | 优先级 2：`hunger ≥ 90` | 身体横向舒展（肚子鼓起）+ 缓慢呼吸，节奏迟滞 |
| SICK 生病 | 4.0s | 无限循环 | 优先级 1：`health < 30` | 虚弱低伏 + 轻微颤抖，节奏最慢、幅度小 |

**分镜规则**
- 六状态时长均落在 T2.7.1 验收区间 3–5 秒内；EATING 例外，按喂食动画时间轴取 **1.8s**（名义 2s，T2.7.2 验收 1.5–2s，见 §2.1）。
- 待机类状态（NORMAL / HAPPY / HUNGRY / OVERFULL / SICK）使用首尾姿态一致的**闭环循环**，避免切换到下一状态时出现跳帧。
- 状态切换时直接替换 Lottie 资源（不做交叉淡入），切换点选在循环首帧，保证姿态连续。
- 页面级同时只播放一个状态动画；`feedback` 屏停留期间继续播放最新状态动画，滚动/交互不打断（实现期较 T2.6.3 高保真稿的增强项——稿内反馈屏为静态形象图）。

## 二、喂食动画关键帧与时间轴（T2.7.2）

### 2.1 时间轴（总时长 1.8s，验收区间 1.5–2s）

| 时间 | 阶段 | 关键帧 / 动作 | 页面状态 |
|---|---|---|---|
| 0.00s | 起始 | 当前状态姿态（`frame-1`） | 进入 `flow/feeding`，`status = EATING` |
| 0.30s | 期待 | 姿态上扬（`frame-2`） | 动画播放中 |
| 0.30–1.20s | 进食主段 | `frame-2 → frame-1 → frame-2 → frame-1`（3 段 / 1.5 个往返周期，每段 0.3s） | 动画播放中（数值尚未提交） |
| 1.20–1.80s | 收尾停留 | 保持 `frame-1` 姿态 0.6s（为引擎写盘留缓冲） | 食物记录写入完成点 |
| 1.80s | 结束 | 动画停止 | 自动进入 `flow/feedback`，按引擎结果切状态动画 |

### 2.2 关键帧表

| 帧 | 相对时间 | 姿态来源 | 说明 |
|---|---|---|---|
| K1 | 0% | `eating/frame-1.png` | 起始姿态 |
| K2 | 17%（0.3s） | `eating/frame-2.png` | 期待/前倾 |
| K3 | 33%（0.6s） | `eating/frame-1.png` | 进食循环 1 |
| K4 | 50%（0.9s） | `eating/frame-2.png` | 进食循环 2 |
| K5 | 67%（1.2s） | `eating/frame-1.png` | 收尾回到起始姿态 |
| K6 | 100%（1.8s） | 状态动画接手 | 由新状态（HAPPY / OVERFULL / HUNGRY / SICK / NORMAL）动画接管；K5→K6 为保持帧-1 的停留段，不产生额外形变 |

### 2.3 与引擎、页面行为的对齐

| 项 | 规则 |
|---|---|
| 状态值 | 播放期间 `PetStatus = EATING`（D-009：由喂食动作触发，不参与饱食度映射） |
| 计算时机 | 食物记录写入 + PetEngine 计算在动画播放期间完成；动画结束即展示反馈结果（feeding.html S4/S5 口径） |
| 可中断性 | 写盘/播放期间**禁用返回与返回手势**，防止重复提交喂食（T2.6.3 feeding.html；navigation-scheme §七「旋转不重复提交喂食」同口径） |
| 帧率 | ≥ 30fps（PRD §6.1） |
| 弱化动效 | 系统「减少动效」开启时：跳过进食往返，播放 0.5s 静态 EATING 帧后直接进入反馈屏（与 `animation-fallback.md` §2.2 一致：该 0.5s 静态帧在降级 L1/L2 均保留） |
| 失败路径 | **本地写盘（Room）失败**：不进入流程，提示重试；**离线（非失败）**：正常播放进食动画并按本地计算宠物状态（TDD §7.2「离线喂食本地计算，联网后同步」），恢复后补同步 |

## 三、页面转场规范（T2.7.3）

### 3.1 转场时长与类型

| 场景 | 时长 | 转场方式 | 依据 |
|---|---:|---|---|
| 二级流程页 push（拍照→识别→确认→喂食→反馈） | **300ms** | M3 forward：新页面沿共享轴 X 由 100% 移入 + 旧页面 30% 移出，伴随淡入 | navigation-scheme §七（当前基线 300ms） |
| 二级流程页 pop（返回上一 destination） | 300ms | M3 backward：与 forward 反向 | 同上 |
| 顶层 Tab 切换（4 个 Tab 之间） | 300ms | M3 fade-through（先淡出后淡入），**不做层级推入** | navigation-scheme §七（Tab 切换不模拟层级）+ M3 动效 token |
| 对话框 / 弹层（候选选择、确认对话框） | 遮罩 150ms + 弹层 200ms | 遮罩淡入 + 弹层 scale 0.92 → 1.0 + 淡入 | M3 dialog 规范；navigation-scheme §七 overlay |
| 同页状态更新（喂食数值、轻提醒出现） | 无转场（数值过渡 200ms） | 不使用页面转场；数值可用 200ms 计数过渡，轻提醒以淡入出现 | navigation-scheme §四（当前页状态更新，不新建 destination） |
| 首次使用流各步（注册→资料→目标） | 300ms | 同二级流程 push/pop | navigation-scheme §一 |

### 3.2 缓动曲线（Material 3 标准）

| 用途 | 曲线 | 参数 |
|---|---|---|
| 进入（元素出现、页面移入） | M3 Decelerate | `cubic-bezier(0, 0, 0, 1)` |
| 离开（元素消失、页面移出） | M3 Accelerate | `cubic-bezier(0.3, 0, 1, 1)` |
| 位置移动 / 尺寸变化 | M3 Standard | `cubic-bezier(0.2, 0, 0, 1)` |
| 强调型转场（对话框、Feedback 呈现） | M3 Emphasized | `cubic-bezier(0.05, 0.7, 0.1, 1.0)`，时长 500ms |

> 曲线与时长 token 来源：Material 3 动效规范（`androidx.compose.animation.core` 的 `MotionTokens` / M3 easing & duration tokens）。上表四条与 M3 标准 token 一一对应，未引入自定义曲线。

### 3.3 无障碍与降级

| 项 | 规则 |
|---|---|
| 减少动效（系统开关） | 转场时长降至 ≤100ms 或改为直接切换；宠物状态动画改为静态帧 + 200ms 淡入；喂食动画跳过往返（见 §2.3） |
| 帧率下限 | 所有转场与动画 ≥ 30fps（PRD §6.1）；转场期间不触发新的动画叠加 |
| 预测性返回 | 返回手势预览须指向真实上一 destination（navigation-scheme §七） |
| 低端机降级 | 见 T2.8.3：低端设备用 CSS/静态帧替代 Lottie；转场保留但禁用阴影/模糊类效果 |
| 深浅模式 | 转场与动画时长、曲线完全一致，仅视觉资源随主题（宠物资源为同一套，不因主题替换） |

## 四、验收核对

| 任务 | 验收标准 | 本文对应 |
|---|---|---|
| T2.7.1 | 每种状态 3–5 秒分镜 | §1.2 六状态时长 3.0–4.0s（EATING 例外见 §二） |
| T2.7.2 | 喂食过程 1.5–2 秒 | §2.1 总时长 1.8s + 关键帧表 |
| T2.7.3 | 转场 300ms，符合平台规范 | §3.1 二级流程 300ms、Tab 300ms（fade-through）、弹层 150+200ms；缓动取 M3 标准曲线 |

---

T2.7.1 / T2.7.2 / T2.7.3 · 宠物动画规范 · 依据 D-009、TDD §6.2/§7.2、navigation-scheme.md §四/§七、PRD §6.1、pet-states/ 与 pet-animations/ 既有资源 · 交付实现使用 T2.8 Lottie 资源
