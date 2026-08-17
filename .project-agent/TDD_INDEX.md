# TDD Index — PetDiet

用途：定位 TDD section 与模块/文件/任务的关系。Orchestrator 按需只读相关 section，禁止整篇读取。

| TDD section | 模块 | 相关文件/目录 | 相关任务 |
|-------------|------|--------------|----------|
| §1 技术架构总览 (L79-90) | 客户端/后端/存储分层 | android/ ios/ cloud-functions/ | 全局 |
| §2 iOS 技术设计 (L92-210) | SwiftUI MVVM+DI | ios/（待建） | T1.4.1, T3.x |
| §3 Android 技术设计 (L212-298) | Compose MVVM+Hilt+Repository | android/app/src/main/java/com/petdiet/app/ | T1.4.2, T3.x |
| §3.1 架构模式 (L214-242) | Screens/VM/Repo/Data | ui/ viewmodel/ data/ di/ | T1.4.2 |
| §3.2 核心模块 (L244-253) | CameraManager/FoodRecognizer/PetEngine/Dao/ApiService/PetAnimation | util/ domain/ data/local/ data/network/ | T3.x |
| §3.3 数据模型 Kotlin (L255-296) | FoodCandidate/PetState/PetStatus/FeedingResult/FoodRecognitionResult | data/model/ | T1.4.2（已对齐）, T3.x |
| §4 AI 食物识别接入 (L300-374) | 百度AI主/讯飞备选、封装层、错误处理 | 后端云函数 + FoodRecognizer | T1.2.x, T3.x |
| §5 后端方案 (L377-539) | 选型：腾讯云开发（已定） | cloud-functions/ docs/tech-selection/ | T1.1.x（完成） |
| §6 数据模型设计(后端) (L541-972) | NoSQL 集合结构、Pet Engine 算法规范、REST API | cloud-functions/（rdb） | T3.x |
| §6.2 Pet Engine 算法 (L592-911) | 饱食度/健康/心情状态机（双端一致） | domain/PetEngine.kt + 后端 | T3.x |
| §7 交互流程 (L974-1020) | 拍照→识别→喂食、离线策略 | 全端 | T3.x |
| §8 安全与合规 (L1022-1040) | 数据安全、隐私合规 | 全局 | T3.x |
| §9 开发环境/项目结构 (L1042-1104) | 双端目录建议 | 仓库根 | T1.4.x |
| §10 待决事项 (L1105+) | 未决项 | - | 评审时确认 |

关键约束（跨任务）:
- Pet Engine 算法 iOS/Android 必须一致（§6.2）
- Android minSdk 26（API 26, PRD §6）；包名 com.petdiet.app
- 后端 = 腾讯云开发 CloudBase（RDB 接口 @cloudbase/node-sdk）
- 数据模型以 TDD §3.3 为准（已 2026-08-17 对齐，见 DECISIONS D-004）
