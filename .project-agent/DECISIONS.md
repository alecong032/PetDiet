# Project Decisions — PetDiet

只记录影响未来工作的决策。格式：ID / 内容 / 理由 / 影响范围 / 日期。

D-001 后端选型：腾讯云开发 CloudBase（vs Firebase/自建）
  理由: 国内访问、免费额度、微信生态、T1.1.1 选型对比结论
  影响: 全部后端/云函数/存储；Android/iOS 通过云函数 HTTP API 对接
  日期: 2026-08

D-002 TDD 是标准：Codex/Worker 产出必须对齐 TDD；绝不改 TDD 迁就产出
  理由: 用户明确裁定（T1.4.2 模型偏差事件后）
  影响: 所有实现任务；Worker 任务包必须附 TDD 精确规格
  日期: 2026-08-17

D-003 ticket（LEDGER）状态只在功能实现 + push 成功后才更新，push 前不标记完成
  理由: 用户明确的操作规范
  影响: LEDGER.md 维护；Orchestrator 标记 DONE 时机
  日期: 2026-08-17

D-004 Android 骨架数据模型按 TDD §3.3 对齐（FoodCandidate/FoodRecognitionResult/
  PetState/PetStatus/FeedingResult）
  理由: 骨架须与设计基线一致，避免后续返工
  影响: android/app/src/main/java/com/petdiet/app/data/model/
  日期: 2026-08-17

D-005 T1.4.1 iOS 初始化：本机为 Windows（无 Xcode），任务延后/标记 NEEDS_USER
  理由: 环境不可验收（需 macOS/Xcode）
  影响: P1 任务排序；T1.6.1/T1.6.3 iOS 相关依赖同步延后
  日期: 2026-08-17

D-006 Android Studio 安装方式：官方 exe NSIS 静默安装不支持（exit 199），
  改用 7-Zip 解压安装包到 %LOCALAPPDATA%\Programs\AndroidStudio（解压即用）
  理由: 解压式安装可行，AS 自带 JBR JDK 21
  影响: 本机 Android 工具链；SDK 组件用 cmdline-tools/sdkmanager 安装
  日期: 2026-08-17

D-007 范围变更：**仅 Android**，iOS 全部延后（不删除，标注后置）
  理由: 用户明确决策（2026-08-17）；本机 Windows 无法做 iOS 验收
  影响: PRD/TDD/PROJECT_PLAN/LEDGER 已标注「(iOS 延后)/(iOS 部分延后)」；
    T1.4.1/T1.6.1/T3.x iOS 部分退出当前排程；双端任务先做 Android 部分
  日期: 2026-08-17
