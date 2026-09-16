# 间距 / 圆角 / 阴影规范

> T2.5.3 · PetDiet · Android / Jetpack Compose / Material 3
> 以 8dp 网格为基础标尺，定义页面与组件的间距、圆角与海拔（elevation）token，供 T2.5.4 组件库与 T2.6.x 高保真稿统一引用。
> 色彩 token 见 `color-system.html`，字级见 `typography.md`，导航层级见 `navigation-scheme.md`。

## 一、基础网格与标尺

以 **8dp** 为基本单位；4dp 为半格，仅用于图标与文字之间的紧凑对齐。所有间距、尺寸取目标尺值，不写任意数值。

| Token | 值（dp） | 用途 | Compose 用法 |
|---|---:|---|---|
| `space-0` | 0 | 贴合（表头与首行、图标内联） | — |
| `space-1` | 4 | 图标与标签、数值与单位 | `4.dp` |
| `space-2` | 8 | 图标按钮内边距、chip 内边距 | `8.dp` |
| `space-3` | 12 | 卡片之间、列表项内边距 | `12.dp` |
| `space-4` | 16 | 页面水平内边距、卡片内边距 | `16.dp` |
| `space-5` | 24 | 区块之间、按钮水平内边距、对话框内边距 | `24.dp` |
| `space-6` | 32 | 大区块分隔、空态上下留白 | `32.dp` |
| `space-7` | 40 | 页面顶部留白（无顶栏场景） | `40.dp` |
| `space-8` | 48 | 触控目标最小边长 | `48.dp` |
| `space-9` | 64 | 全屏插画/空态留白 | `64.dp` |

**规则**：`4 / 8 / 12 / 16 / 24 / 32` 为日常用值；`40 / 48 / 64` 用于触控目标与空态。禁止出现 5、7、10、13、18 等非尺值（0.5dp 级误差除外）。几何导出尺寸（如环形内径 = 外径 − 2 × 环宽）允许落在 4dp 半格。

## 二、语义化间距

| 语义 | 值 | 说明 |
|---|---:|---|
| 页面水平内边距 | 16dp | 所有页面内容区左右各 16dp（顶部 App bar 与底部导航不适用） |
| 卡片内边距 | 16dp | 内容卡片、信息区块 |
| 紧凑卡片内边距 | 12dp | 列表型卡片（如食物条目） |
| 卡片之间间距 | 12dp | 同页多个卡片纵向间距 |
| 区块之间间距 | 24dp | 不同功能区（如「宠物区 → 属性区 → 摄入区」） |
| 列表行最小高度 | 56dp（单行）/ 72dp（两行） | Material 3 one-line / two-line 列表标准 |
| 主按钮高度 | 48dp | 首页「拍照喂食」、各页主操作 |
| 主按钮水平内边距 | 24dp | 文字按钮/胶囊按钮 |
| 图标尺寸 | 24dp | 导航栏图标、行内图标；强调图标 32dp |
| 顶栏高度 | 64dp | Material 3 TopAppBar（small） |
| 底部导航高度 | 80dp | Material 3 NavigationBar（图标 24 + 标签） |

## 三、圆角

采用 Material 3 `Shapes` 命名，附加 `full` 用于胶囊与圆形元素。

| Token | 值（dp） | 适用 | M3 Shapes 映射 |
|---|---:|---|---|
| `radius-none` | 0 | 全宽分隔线、贴边图片 | — |
| `radius-xs` | 4 | 标签内小元素、色块、代码片段 | extraSmall |
| `radius-sm` | 8 | 列表项、缩略图、小控件、提示条 | small |
| `radius-md` | 12 | 卡片、按钮、输入框、进度条容器 | medium |
| `radius-lg` | 16 | 大卡片、宠物形象容器、属性区容器 | large |
| `radius-xl` | 24 | 对话框、底部弹层 | extraLarge（覆盖 M3 默认 28dp） |
| `radius-full` | 999（半高） | 胶囊按钮、chip、进度条、头像 | CircleShape / RoundedCornerShape(50%) |

**嵌套规则**：内层元素圆角 ≤ 外层圆角；外层为 `radius-md` 时，内层图片建议 `radius-sm`，形成 12 → 8 的视觉层次。容器与内部图片之间不得出现 0 圆角突变。

## 四、海拔（Elevation）与阴影

Material 3 在 Android 上以 **tonal elevation**（表面着色）表达层级，阴影为辅；设计稿预览统一沿用下表预览阴影（`elevation-1` 复用既有 `--shadow`，`elevation-2` / `elevation-3` 为本规范新增）。

| Level | 用途 | 阴影（设计稿预览） | Android 实现 |
|---|---|---|---|
| `elevation-0` | 页面背景、列表项、嵌入式区块 | 无 | `0.dp` |
| `elevation-1` | 信息卡片、统计卡片 | `0 8px 24px rgba(56, 90, 53, 0.08)`（现有 `--shadow`） | `1.dp` + surfaceTint |
| `elevation-2` | 悬浮主操作（如需要）、可拖动元素 | `0 12px 28px rgba(56, 90, 53, 0.12)`（本规范新增） | `3.dp` + surfaceTint |
| `elevation-3` | 对话框、底部弹层、菜单 | `0 16px 40px rgba(0, 0, 0, 0.18)`（本规范新增） | `6.dp` + scrim |

**规则**
- `elevation-1` 复用 `color-system.html` 既有预览阴影 `--shadow`；`elevation-2` / `elevation-3` 的预览阴影为本规范新增（Android 端以 M3 elevation 表示，不依赖预览值）。
- 只使用上表 4 级；不得为表达「可点击」而加深阴影，交互状态改用色彩与形状（见 `color-system.html` 语义色）。
- 同一屏内相邻同层级卡片保持同一 elevation；卡片嵌套时不叠加阴影（内层用 `elevation-0`）。
- 深色模式下阴影不可见，层级靠 tonal elevation 与描边表达；描边使用 `color.outline`（1dp），分隔线使用 `color.divider`。
- 禁止使用超过 `0.20` 不透明度的黑色阴影，避免「浮起感」过强。

## 五、典型组件规格（对齐已审线框图）

| 组件 | 规格 |
|---|---|
| 页面内容区 | 水平内边距 16dp；区块间距 24dp |
| 信息卡片 | 圆角 12dp（`radius-md`）、内边距 16dp、`elevation-1` |
| 进度条（属性 / 摄入 / 营养 / 置信度） | 统一高度 8dp、`radius-full`；轨道与填充同高 |
| 卡路里环形 | 外径 84dp、环宽 8dp（内圈 68dp） |
| 主按钮 | 高度 48dp、圆角 12dp、水平内边距 24dp、`elevation-0` |
| 次级/幽灵按钮 | 高度 48dp、圆角 12dp、1dp 描边 |
| 列表行（食物/成员） | 最小高 56dp（单行）/ 72dp（两行）、内边距 12dp、分隔线 1dp（`color.divider`） |
| 搜索框 | 高度 48dp、圆角 12dp、内边距 12dp（左右 16dp）、1dp 描边、`elevation-0` |
| 分段筛选（搜索/收藏、日/周） | 高度 32dp、圆角 `radius-full`、内边距 12dp；选中态用主色填充 |
| 趋势柱状图 | 图表高 120dp、柱宽 16dp、柱间距 8dp、柱顶圆角 4dp（`radius-xs`） |
| 表单单行（设置页） | 最小高 56dp、左右内边距 16dp、行间分隔线 1dp |
| 快门按钮（拍照页） | 视觉外径 64dp、内环 48dp、描边 4dp；触控区外扩至 ≥ 88dp |
| 宠物形象容器 | 圆角 16dp（`radius-lg`）、内边距 12dp、最小 120×120dp |
| 反馈区容器（宠物反馈 / 轻提醒） | 圆角 12dp、内边距 16dp、1dp 描边、`elevation-0` |
| 底部导航 | 高 80dp、4 项等宽、图标 24dp + 标签 |
| 顶部 App bar | 高 64dp、标题左对齐、`elevation-0`（随内容滚动时可升为 `elevation-1`） |
| 对话框/弹层 | 圆角 24dp、内边距 24dp、`elevation-3` |
| 轻提醒条（CR-001） | 圆角 8dp、内边距 12dp、1dp 描边（非 `elevation` 表达） |

> **取代关系**：§五 数值为本规范定稿值。T2.3.x 线框（`wireframes/*.html`）中的同类尺寸为灰阶示意值（属性条 10px、营养条 5px、置信度条 7px、环形内圈 62px、卡片圆角 8px 等），实现与高保真稿一律以本表为准。本规范同时取代 `design-system.html`（T1.5.2）的圆角刻度（6 / 10 / 12 / 999）与按钮圆角（10px）。

## 六、无障碍与适配

| 项 | 要求 |
|---|---|
| 触控目标 | 可点击元素最小 48×48dp（含内边距）；图标按钮视觉 24dp 时点击区扩展至 48dp |
| 元素间距 | 相邻可点击元素间距 ≥ 8dp，避免误触 |
| 字体缩放 | 支持系统字体缩放至 200%；容器使用 `min-height` + 内边距而非固定高度，禁止以裁切文字换取布局稳定 |
| 大屏 / 折叠 | 内容列最大宽度 600dp 并水平居中；平板不拉伸卡片至全宽 |
| 横屏 | 保留纵向滚动；卡片改为单列或双列，间距沿用 `space-4` / `space-5` |
| 深浅模式 | 结构、间距、圆角完全一致，仅切换色彩与 elevation 表达方式 |

## 七、Compose 落地建议

```kotlin
object Space {
    val none = 0.dp
    val xs = 4.dp;  val s = 8.dp;   val m = 12.dp; val l = 16.dp
    val xl = 24.dp; val xxl = 32.dp
    val xxxl = 40.dp
    val touchTarget = 48.dp
    val hero = 64.dp
}

object Radius {
    val none = 0.dp; val xs = 4.dp; val sm = 8.dp
    val md = 12.dp; val lg = 16.dp; val xl = 24.dp
    val full = 999.dp
}

object Elevation {
    val level0 = 0.dp; val level1 = 1.dp; val level2 = 3.dp; val level3 = 6.dp
}
```

将 `Radius` 映射到 Material 3 `Shapes`：`extraSmall` 4dp、`small` 8dp、`medium` 12dp、`large` 16dp，并覆盖 `extraLarge` 为 24dp（M3 默认 28dp）；`radius-full` 使用 `CircleShape` / `RoundedCornerShape(50%)`。

## 八、验收核对（对照 T2.5.3）

| 验收项 | 结果 |
|---|---|
| 8dp 网格系统（业内俗称 8pt） | 基础单位 8dp，4dp 半格仅用于图标/数值对齐，标尺见 §一 |
| 间距规范 | §一 token 表 + §二 语义化间距 |
| 圆角规范 | §三 7 档（含 `radius-full`）并与 M3 Shapes 映射 |
| 阴影规范 | §四 4 级 elevation + 使用禁令 |
| 组件规格 | §五 覆盖 6 个已过审线框的主要组件（首页 / 拍照 / 喂食 / 统计 / 设置 / 搜索）；未列出的次要组件由 T2.5.4 组件库补齐 |
| 无障碍 | §六 触控目标、字体缩放、大屏适配 |

---

T2.5.3 · 间距/圆角/阴影规范 · 依据 color-system.html（T2.5.1）、typography.md（T2.5.2）、navigation-scheme.md（T2.1.2）、wireframes/*（T2.3.x）、Material 3 设计规范
