# 页面层级与导航方案

PetDiet · T2.1.2 · Android / Jetpack Compose / Material 3。以 T2.1.1 IA 为边界，定义页面归属、路由、返回栈及核心任务路径，不扩展界面与功能范围。

**结论：** 完成首次使用流后进入单一 Tab 宿主；宿主使用 4 项 Material 3 `NavigationBar`。拍照、识别、确认、喂食、反馈和体重记录作为全屏二级流程推入；短时选择与确认使用弹层。核心“拍照喂食”入口放在首页主内容区。

## 一、页面层级模型

### L0 · 独立首次使用流：Onboarding NavHost

注册 / 登录 → 个人资料 → 目标设置 → 首页 / 宠物页。未完成建档时作为启动图，不显示底部导航；完成后清空首次使用返回栈并进入 Tab 宿主。

### L1 · 顶层宿主页：App Tab Host

4 个同级、可持续访问的顶层目的地。宿主保留 `NavigationBar`，各 Tab 保留自身最近状态与返回栈。

| 顺序 | Tab | 对应内容 |
| --- | --- | --- |
| 1 | 宠物 | 首页 |
| 2 | 搜索 | 收藏 |
| 3 | 统计 | 体重 |
| 4 | 设置 | 资料 |

### L2 · 二级流程页：全屏推入

拍照 / 选图、AI 识别结果、确认食物、喂食、宠物反馈、体重记录。进入后隐藏底部导航，顶部提供返回；按任务顺序逐级入栈。

### Overlay · 弹层 / 对话框

短时决策，不改变层级。食物候选选择使用 Material 3 对话框；离开未完成流程等必要确认使用确认对话框。关闭弹层后回到原页面，底层 destination 不出栈。

**边界说明：** “返回首页”是导航结果，不是独立页面；“体重提醒间隔”位于既有设置 / 资料页中，不另建设置子页；食物候选选择是“确认食物”的必要弹层，不新增业务页面。

## 二、导航方式与返回栈

### 底部导航栏

- Compose 使用 Material 3 `NavigationBar` + `NavigationBarItem`（即需求中的 BottomNavigation）。
- 固定 4 项，每项同时显示图标与文字标签；顺序为：宠物 / 首页、搜索 / 收藏、统计 / 体重、设置 / 资料（与 IA 图一致）。
- 点击当前 Tab：回到该 Tab 根页面；切换 Tab：恢复该 Tab 最近状态，避免重复创建 destination。

### NavHost 组织

- 根 `NavHost` 先分流 onboarding 与 app host；app host 内承载 4 个顶层 graph 及二级流程。
- `NavController` 负责 destination、参数和返回栈；流程只传稳定 ID，不传大对象或图片数据。
- 弹层使用 `dialog()` destination；选中结果通过共享状态或 saved state 返回原页面。

### 返回规则

| 场景 | 系统返回键 / 返回手势 | 顶部返回 |
| --- | --- | --- |
| 弹层开启 | 先关闭弹层，底层页面不出栈 | 不适用 |
| 二级流程页 | 按栈逐级返回上一 destination | 与系统返回一致 |
| 非首页的顶层 Tab 根 | 回到首页 / 宠物 Tab | 顶层页不显示返回箭头 |
| 首页 / 宠物 Tab 根 | 退出 App 到桌面 / 交由系统处理 | 不显示返回箭头 |
| 首次使用流 | 回到上一步；注册 / 登录为根时退出 / 回桌面 | 除根页外与系统返回一致 |
| 完成首次使用 | 清除 onboarding 栈；之后返回不能回到建档页面 | 同左 |

## 三、路由表

路由覆盖 IA 中全部页面节点；参数均为可保存、可恢复的标量 ID。方括号表示可选参数。

| 层级 | Destination | Route | 参数 | 进入方式与返回目标 |
| --- | --- | --- | --- | --- |
| 首次使用 | 注册 / 登录 | `onboarding/auth` | 无 | 启动分流；下一步到个人资料 |
| 首次使用 | 个人资料 | `onboarding/profile` | 无 | 全屏 push；返回注册 / 登录 |
| 首次使用 | 目标设置 | `onboarding/goal` | 无 | 全屏 push；返回个人资料；完成后清栈进入首页 |
| 顶层 Tab | 首页 / 宠物页 | `app/home` | 无 | 默认 Tab；系统返回退出 / 回桌面 |
| 顶层 Tab | 统计 / 体重页 | `app/stats` | 无 | NavigationBar；返回首页 Tab |
| 顶层 Tab | 食物搜索 / 收藏页 | `app/search` | `[mode]`：browse / recognitionFallback | NavigationBar，或识别失败降级进入；选中食物后 push 确认食物 |
| 顶层 Tab | 设置 / 资料页 | `app/settings` | `[section]`：weightReminder | NavigationBar；可直接定位体重提醒间隔区 |
| 二级流程 | 拍照 / 选图 | `flow/capture` | 无 | 首页主按钮全屏 push；返回首页 |
| 二级流程 | AI 识别结果 | `flow/recognition/{sessionId}` | `sessionId` | 拍照 / 选图完成后 push；返回拍照 / 选图 |
| 二级流程 | 确认食物 | `flow/food-confirm/{draftId}` | `draftId` | 识别候选或搜索结果选中后 push；返回来源页 |
| 二级流程 | 喂食 | `flow/feeding/{draftId}` | `draftId` | 确认提交后 push；返回确认食物 |
| 二级流程 | 宠物反馈 | `flow/feedback/{recordId}` | `recordId` | 喂食写入完成后 push；完成时清除本次流程并回首页 |
| 二级流程 | 体重记录 | `weight/record?source={source}` | `source`：stats / feedback / settings | 从统计页、反馈轻提醒或设置页 push；保存后按来源返回统计页或原页面 |
| 弹层 | 食物候选选择 | `dialog/food-candidates/{sessionId}` | `sessionId` | AI 识别结果上打开；选定或关闭后回识别结果 |
| 弹层 | 确认对话框 | `dialog/confirm/{action}` | `action`：当前必要确认动作 | 当前页面上打开；确认执行动作，取消关闭弹层 |

## 四、核心闭环导航

```text
首页 / 宠物（点击“拍照喂食”）
→ 拍照 / 选图（拍摄或选择图片）
→ AI 识别结果（展示 Top-3；候选选择为弹层）
→ 确认食物（修正候选、分量与热量）
→ 喂食（保存摄入并播放 eating 状态）
→ 宠物反馈（展示状态及属性变化；轻提醒同页出现）
→ 返回首页（清除本次流程栈，刷新累计摄入与宠物状态）
```

各段导航类型依次为：全屏 push、全屏 push、全屏 + 对话框、全屏 push、全屏 push、全屏 push / 同页更新、pop 至首页。

**识别失败降级：** 从 AI 识别结果进入既有“搜索 / 收藏页”，选中食物后进入“确认食物”；不新增失败页面。喂食成功后的数值、动画与轻提醒均为当前页面状态更新，不另建 destination。

## 五、拍照入口设计

**推荐：首页内容区的显著“拍照喂食”主按钮。** 它与 IA 中“拍照识别为首页主动作”一致，也符合 Material 3 每屏突出一个主要动作的原则。按钮位于首页宠物状态与今日摄入信息之后；点击后进入 `flow/capture`。

- **不推荐中央 FAB：** 4 项 `NavigationBar` 中央加入 FAB 容易被误认为第五个顶层目的地；Material 3 的 NavigationBar 本身也不需要为 FAB 留槽。
- **一致性：** 拍照只属于首页主任务，不在其他 Tab 重复放入口，避免同一动作产生多个导航语义。
- **可达性：** 主按钮使用文字“拍照喂食”并配相机图标，不只依赖图标；颜色使用 `color.primaryAction` / `color.onPrimary`。

## 六、体重记录导航（CR-001）

### 路径 A · 喂食后轻提醒：反馈 → 体重记录

```text
宠物反馈 → 体重轻提醒 → 体重记录
```

距上次记录超过用户设置间隔时，在反馈页同页显示非打断式提醒。点击后 push `weight/record?source=feedback`；忽略则继续返回首页。保存后返回反馈页，再完成闭环回首页。

### 路径 B · 设置提醒间隔：设置 / 资料 → 体重提醒间隔

```text
设置 / 资料 → 提醒间隔区
```

从设置 Tab 进入既有设置 / 资料页，在同页调整体重提醒间隔；默认 7 天，可调。使用 `app/settings?section=weightReminder` 可定位该区，但不创建新页面。

**既有第三入口：** 统计 / 体重页的“新增体重记录”进入同一 `weight/record?source=stats`。保存后返回统计 / 体重页并刷新趋势。

## 七、转场与系统行为

| 项目 | 规则 |
| --- | --- |
| 页面转场 | 二级页面 push / pop 统一以 300ms 为当前基线；具体动效曲线与方向留待 T2.7.3。顶层 Tab 切换不模拟层级推入。 |
| 预测性返回 | Android 返回键、边缘返回手势与顶部返回共享同一出栈逻辑；支持系统预测性返回时，预览必须指向实际上一 destination。 |
| 任务中断 | 必要时用确认对话框保护未提交的分量或食物修正；确认离开才出栈，取消则停留。 |
| 旋转与进程恢复 | `NavController` 恢复当前位置；识别会话、草稿和选中项以 ID / 可保存状态恢复。旋转不重复提交喂食、不清空流程。 |
| 深色模式 | 导航结构与层级不变，仅切换 Material 3 主题 token；页面、对话框与导航分别使用 `background`、`surface`、`onSurface` 等语义色。 |
| 底部导航可见性 | 只在 4 个顶层 Tab 根页面显示；onboarding、二级流程页及覆盖其上的对话框不展示 NavigationBar。 |

---

PetDiet · T2.1.2 · 页面层级与导航方案 · 依据 T2.1.1 IA、TDD §3 与 Color System §8
