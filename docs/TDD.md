# PetDiet — 技术设计文档 (TDD)

> 版本: v1.0  
> 日期: 2026-08-06  
> 作者: DietTrack Studio · 后端 + iOS + Android + AI 工程师  
> 状态: Draft  
> 关联文档: [PRD.md](./PRD.md)

> 🔒 **范围变更 (2026-08-17, D-007)**: 当前开发范围**仅 Android**。
> 第 2 章 iOS 技术设计整体**延后**（不删除，保留作后续参考）；双端设计
> （§6.2 Pet Engine 算法等）以 Android 实现为准、iOS 部分延后。

---

## 1. 技术架构总览

### 1.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────────┐
│                          客户端层 (Client Layer)                     │
│                                                                     │
│  ┌───────────────────────┐  ┌───────────────────────┐              │
│  │   iOS App             │  │   Android App         │              │
│  │   (SwiftUI)           │  │   (Jetpack Compose)   │              │
│  │                       │  │                       │              │
│  │  ┌─────────────────┐  │  │  ┌─────────────────┐  │              │
│  │  │ Camera / Photos  │  │  │  │ CameraX         │  │              │
│  │  └────────┬────────┘  │  │  └────────┬────────┘  │              │
│  │           │           │  │           │           │              │
│  │  ┌────────┴────────┐  │  │  ┌────────┴────────┐  │              │
│  │  │ Food Recognizer  │  │  │  │ Food Recognizer  │  │              │
│  │  │ (API Client)    │  │  │  │ (API Client)    │  │              │
│  │  └────────┬────────┘  │  │  └────────┬────────┘  │              │
│  │           │           │  │           │           │              │
│  │  ┌────────┴────────┐  │  │  ┌────────┴────────┐  │              │
│  │  │  Pet Engine     │  │  │  │  Pet Engine     │  │              │
│  │  │ (State Machine) │  │  │  │ (State Machine) │  │              │
│  │  └────────┬────────┘  │  │  └────────┬────────┘  │              │
│  │           │           │  │           │           │              │
│  │  ┌────────┴────────┐  │  │  ┌────────┴────────┐  │              │
│  │  │  Local DB       │  │  │  │  Local DB       │  │              │
│  │  │  (SwiftData)    │  │  │  │  (Room)         │  │              │
│  │  └────────┬────────┘  │  │  └────────┬────────┘  │              │
│  └───────────┼───────────┘  └───────────┼───────────┘              │
│              │                           │                          │
│              └─────────────┬─────────────┘                          │
│                            │                                        │
│                    HTTPS / WSS                                       │
└────────────────────────────┬────────────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────────────┐
│                     服务端层 (Server Layer)                           │
│                            │                                        │
│  ┌────────────────────────┴────────────────────────────────┐       │
│  │                    API Gateway                             │       │
│  │              (REST / WebSocket)                           │       │
│  └────────────────────────┬────────────────────────────────┘       │
│                           │                                         │
│  ┌────────────────────────┴────────────────────────────────┐       │
│  │                    AI Service                               │       │
│  │          (第三方食物识别 API 封装层)                        │       │
│  └────────────────────────┬────────────────────────────────┘       │
│                           │                                         │
│  ┌────────────────────────┴────────────────────────────────┐       │
│  │              Backend Application                          │       │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐                 │       │
│  │  │ Auth Svc │ │ Pet Svc  │ │ Food Svc │                 │       │
│  │  └──────────┘ └──────────┘ └──────────┘                 │       │
│  └────────────────────────┬────────────────────────────────┘       │
│                           │                                         │
│  ┌────────────────────────┴────────────────────────────────┐       │
│  │              Data Storage Layer                            │       │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐    │       │
│  │  │  PostgreSQL  │  │    Redis     │  │  Object Stg │    │       │
│  │  │  (主数据)     │  │  (缓存/会话) │  │ (图片存储)   │    │       │
│  │  └──────────────┘  └──────────────┘  └─────────────┘    │       │
│  └──────────────────────────────────────────────────────────┘       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 技术栈概览

| 层级 | 技术选型 |
|------|---------|
| **iOS** | Swift, SwiftUI, Combine, SwiftData, URLSession, Lottie |
| **Android** | Kotlin, Jetpack Compose, CameraX, Room, Retrofit, Lottie |
| **后端** | [待讨论 - 见第 5 节](#5-后端方案对比与建议) |
| **AI 识别** | 第三方 API (待定) |
| **数据库** | [待讨论 - 随后端方案确定] |
| **CI/CD** | GitHub Actions |

---

## 2. iOS 技术设计（🔒 延后：先 Android，iOS 后置）

### 2.1 架构模式

```
采用 MVVM + 依赖注入 (DI) 架构:

┌─────────────────────────────────────────────────┐
│                    Views (SwiftUI)               │
│  PetView / CameraView / FoodDetailView          │
└──────────────────────┬──────────────────────────┘
                       │ @Published
┌──────────────────────┴──────────────────────────┐
│                 ViewModels                       │
│  PetViewModel / CameraViewModel / FoodViewModel  │
└──────────────────────┬──────────────────────────┘
                       │ Protocol
┌──────────────────────┴──────────────────────────┐
│              Services / Repositories             │
│  ┌────────────┐ ┌────────────┐ ┌─────────────┐ │
│  │ APIService │ │ PetService │ │ FoodService │ │
│  └────────────┘ └────────────┘ └─────────────┘ │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────┐
│              Data Layer                          │
│  ┌────────────┐ ┌────────────┐                   │
│  │ SwiftData  │ │ URLSession │                   │
│  └────────────┘ └────────────┘                   │
└──────────────────────────────────────────────────┘
```

### 2.2 核心模块

| 模块 | 类/文件 | 职责 |
|------|--------|------|
| **相机模块** | `CameraManager.swift` | 相机权限管理、拍照、图片压缩 |
| **AI 识别** | `FoodRecognizer.swift` | 封装 AI API 调用、结果解析、置信度分级 |
| **宠物引擎** | `PetEngine.swift` | 宠物状态机、属性计算、状态持久化 |
| **数据层** | `FoodRecordStore.swift` | 食物记录 CRUD、SwiftData 操作 |
| **API 层** | `APIClient.swift` | HTTP 请求封装、错误处理、重试机制 |
| **动画层** | `PetAnimationView.swift` | Lottie 动画渲染、状态→动画映射 |

### 2.3 关键数据模型 (Swift)

```swift
// MARK: - Food Recognition

struct FoodRecognitionResult: Codable {
    let candidates: [FoodCandidate]
    let bestMatch: FoodCandidate?
}

struct FoodCandidate: Codable, Identifiable {
    let id: String
    let name: String
    let confidence: Double  // 0.0 - 1.0
    let caloriesPer100g: Double
    let proteinPer100g: Double?
    let carbsPer100g: Double?
    let fatPer100g: Double?
}

// MARK: - Pet

struct PetState: Codable {
    let id: String
    let name: String
    let hunger: Double      // 0-100
    let health: Double      // 0-100
    let mood: Double        // 0-100 (computed)
    let lastFedAt: Date?
    let status: PetStatus
}

enum PetStatus: String, Codable {
    // 6 状态定稿（2026-08-18 用户设计确认，D-009）：normal/happy/hungry/eating/overfull/sick
    case normal, happy, hungry, eating, overfull, sick
}

// MARK: - Feeding

struct FeedingResult {
    let petState: PetState
    let message: String
    let animation: PetStatus
}
```

### 2.4 AI 客户端流程

```
用户点击"识别"
      │
      ▼
  ┌────────────┐
  │ 图片压缩    │  压缩至 1MB 以内，分辨率 1080p
  └─────┬──────┘
        │
        ▼
  ┌────────────┐
  │ API 调用    │  POST /api/v1/food/recognize
  └─────┬──────┘
        │
        ▼
  ┌────────────┐
  │ 结果解析    │  解析 Top-K 候选
  └─────┬──────┘
        │
        ▼
  ┌─────────────────────────────────────┐
  │ 置信度分级                            │
  │                                      │
  │ >0.90 → 自动确认，调用喂食流程        │
  │ 0.70-0.90 → 显示候选列表供用户选择    │
  │ <0.70 → 提示不确定性，建议手动输入    │
  └─────────────────────────────────────┘
```

---

## 3. Android 技术设计

### 3.1 架构模式

```
采用 MVVM + 依赖注入 (Hilt) + Repository 架构:

┌─────────────────────────────────────────────────┐
│               Screens (Jetpack Compose)          │
│  PetScreen / CameraScreen / FoodDetailScreen     │
└──────────────────────┬──────────────────────────┘
                       │ StateFlow
┌──────────────────────┴──────────────────────────┐
│                 ViewModels                       │
│  PetViewModel / CameraViewModel / FoodViewModel  │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────┐
│              Repositories                        │
│  ┌────────────┐ ┌────────────┐ ┌─────────────┐ │
│  │ PetRepo    │ │ FoodRepo   │ │ UserRepo    │ │
│  └────────────┘ └────────────┘ └─────────────┘ │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────┐
│              Data Layer                          │
│  ┌────────────┐ ┌────────────┐                   │
│  │ Room DB    │ │ Retrofit   │                   │
│  └────────────┘ └────────────┘                   │
└──────────────────────────────────────────────────┘
```

### 3.2 核心模块

| 模块 | 类/文件 | 职责 |
|------|--------|------|
| **相机模块** | `CameraManager.kt` | CameraX 封装、拍照、图片压缩 |
| **AI 识别** | `FoodRecognizer.kt` | AI API 调用、结果解析、置信度分级 |
| **宠物引擎** | `PetEngine.kt` | 宠物状态机、属性计算、状态持久化 |
| **数据层** | `FoodRecordDao.kt` | Room DAO、数据库操作 |
| **网络层** | `ApiService.kt` | Retrofit 接口定义、请求/响应模型 |
| **动画层** | `PetAnimation.kt` | Lottie 动画管理、状态映射 |

### 3.3 关键数据模型 (Kotlin)

```kotlin
// MARK: - Food Recognition

@data class FoodRecognitionResult(
    val candidates: List<FoodCandidate>,
    val bestMatch: FoodCandidate?
)

@data class FoodCandidate(
    val id: String,
    val name: String,
    val confidence: Double,
    val caloriesPer100g: Double,
    val proteinPer100g: Double? = null,
    val carbsPer100g: Double? = null,
    val fatPer100g: Double? = null
)

// MARK: - Pet

@data class PetState(
    val id: String,
    val name: String,
    val hunger: Double,
    val health: Double,
    val mood: Double,
    val lastFedAt: Long? = null,
    val status: PetStatus
)

enum class PetStatus { NORMAL, HAPPY, HUNGRY, EATING, OVERFULL, SICK }

// MARK: - Feeding

@data class FeedingResult(
    val petState: PetState,
    val message: String,
    val animation: PetStatus
)
```

---

## 4. AI 食物识别接入

### 4.1 第三方 API 要求

| 需求 | 说明 |
|------|------|
| 输入 | 图片 (JPEG/PNG, 最大 5MB) |
| 输出 | Top-K 食物候选列表 (K=10)，每个包含名称、置信度、热量、营养素 |
| 响应时间 | < 3 秒 (P95) |
| 支持语言 | 中文食物名 |
| 覆盖范围 | 至少 500+ 种常见中餐、西餐、快餐 |

### 4.1.1 候选 AI API 对比

> 🧪 **MVP 建议**: 先用免费额度最大的 API 快速验证，后续根据准确率数据切换

| API | 提供商 | 中餐支持 | 热量估算 | 免费额度 | 付费价格 | 响应速度 | 推荐场景 |
|-----|--------|---------|---------|---------|---------|---------|---------|
| **百度AI 图像识别** | 百度 | ✅ 优秀 | ✅ | 500 次/天 | ¥0.0035/次 | < 2s | 中文食物多 |
| **讯飞 AI 图像识别** | 科大讯飞 | ✅ 良好 | ✅ | 1000 次/天 | ¥0.004/次 | < 2s | 中文生态好 |
| **LogMeal API** | LogMeal (瑞典) | ⚠️ 一般 | ✅ 精确 | 50 次/天 | €0.01-0.05/次 | < 1s | 西餐/健身餐 |
| **Calorie Mama** | Calorie Mama | ⚠️ 一般 | ✅ | 有限 | $0.01/次 | < 2s | 北美市场 |

#### 推荐方案: 百度AI

- **中餐识别准确率最高** — 百度在中文食物数据集上训练，覆盖 1000+ 种中餐
- **免费额度充足** — 500 次/天 ≈ 1.5 万次/月，足够 MVP
- **热量+营养素一体** — 直接返回完整营养数据，无需二次查询
- **国内部署** — API 服务器在国内，响应快

#### 备选方案: 讯飞 AI

- 与百度类似，中文食物识别良好
- 1000 次/天免费额度（比百度多一倍）
- 可作为百度的 fallback 备选

#### 建议的 API 策略

```
主 API: 百度AI (80% 流量)
  ↓ 失败/超时
备用 API: 讯飞AI (20% 流量)
  ↓ 全部失败
本地降级: 用户手动搜索
```

### 4.2 API 封装层设计

```
客户端
  │
  ▼
┌──────────────────────────────┐
│   AI Service Wrapper          │  ← 统一封装，便于后续切换
│                              │
│  ┌────────────────────────┐  │
│  │  第三方 API Adapter     │  │  ← 可替换为不同提供商
│  │  (API URL, Auth Key)    │  │
│  └────────────────────────┘  │
│                              │
│  + 置信度分级逻辑             │
│  + 图片预处理                 │
│  + 错误重试机制               │
└──────────────────────────────┘
```

### 4.3 错误处理策略

| 错误类型 | 处理 |
|---------|------|
| 网络超时 | 3 秒超时，自动重试 1 次，再失败则提示用户 |
| API 限流 | 指数退避重试 (1s, 2s, 4s) |
| 图片过大 | 客户端压缩后重新发送 |
| 无效结果 | 返回空结果时引导手动输入 |

---

## 5. 后端方案对比与建议

> ⚠️ **待决策**: 以下是三种候选后端方案的详细对比，请根据项目需求选择。

### 方案 A: 腾讯云开发 (🏆 国内首选推荐)

| 维度 | 详情 |
|------|------|
| **核心服务** | 云开发 (CloudBase), 云函数, 云数据库 (MongoDB 兼容), 云存储 |
| **实时能力** | 云数据库实时监听 ✅ |
| **免费额度** | 2GB 数据库, 5GB 存储, 5 万次/日云函数调用 |
| **国内访问** | ✅ CDN 加速，无 GFW 问题 |
| **优势** | <ul><li>国内 CDN 加速，访问快且稳定</li><li>微信生态集成（未来可做小程序版）</li><li>中文文档完善，国内社区活跃</li><li>免费额度大，5 万次/日云函数调用</li><li>零运维，腾讯托管</li></ul> |
| **劣势** | <ul><li>腾讯生态锁定</li><li>国际化支持弱（海外访问可能受限）</li><li>相比 Firebase 社区生态较小</li></ul> |
| **适用场景** | 面向国内市场、中文优先、需要快速 MVP |
| **推荐指数** | ⭐⭐⭐⭐⭐ |

#### 腾讯云开发架构示意

```
iOS/Android App
      │
      ▼
┌─────────────────────────────────┐
│       腾讯云开发 (CloudBase)     │
│                                  │
│  ┌────────────────────────────┐ │
│  │  云开发登录                 │ │
│  │  (手机号/邮箱/微信登录)     │ │
│  └────────────┬───────────────┘ │
│               │                  │
│  ┌────────────┴───────────────┐ │
│  │  云数据库 (MongoDB)         │ │
│  │  (用户/宠物/食物记录)       │ │
│  └────────────┬───────────────┘ │
│               │                  │
│  ┌────────────┴───────────────┐ │
│  │  云函数                     │ │
│  │  ┌──────────────────────┐  │ │
│  │  │ AI 识别代理            │  │ │
│  │  │ (调用第三方食物API)   │  │ │
│  │  └──────────────────────┘  │ │
│  │  ┌──────────────────────┐  │ │
│  │  │ 宠物逻辑服务           │  │ │
│  │  │ (属性计算/状态机)      │  │ │
│  │  └──────────────────────┘  │ │
│  └────────────┬───────────────┘ │
│               │                  │
│  ┌────────────┴───────────────┐ │
│  │  云存储                     │ │
│  │  (食物照片/头像存储)        │ │
│  └────────────────────────────┘ │
│                                  │
└──────────────────────────────────┘
```

---

### 方案 B: Firebase (海外市场备选)

| 维度 | 详情 |
|------|------|
| **核心服务** | Firebase Auth, Firestore, Cloud Functions, Cloud Storage |
| **实时能力** | Firestore 自带实时同步 ✅ |
| **免费额度** | 1GB Firestore, 5GB Storage, 2000 次/月 Functions 调用 |
| **国内访问** | ⚠️ 受 GFW 影响，国内访问不稳定 |
| **优势** | <ul><li>零运维，Google 托管</li><li>iOS/Android SDK 最成熟</li><li>全球 CDN，海外访问优秀</li><li>社区生态最大</li></ul> |
| **劣势** | <ul><li>国内访问不稳定（GFW）</li><li>云函数免费额度偏少</li><li>Google 生态锁定</li></ul> |
| **适用场景** | 面向海外市场、双语版本、后续国际化 |
| **推荐指数** | ⭐⭐⭐ (仅海外场景推荐) |

---

### 方案 C: 自建后端 (灵活但复杂)

| 维度 | 详情 |
|------|------|
| **核心服务** | Node.js (Fastify) + PostgreSQL + Redis + Docker |
| **实时能力** | WebSocket (Socket.IO) |
| **免费额度** | 取决于部署平台 (Vercel/Render/自建服务器) |
| **优势** | <ul><li>完全可控，无供应商锁定</li><li>PostgreSQL 查询能力强</li><li>可自定义任何逻辑</li><li>未来可自由迁移</li></ul> |
| **劣势** | <ul><li>运维成本高</li><li>需要自己处理扩展、备份、监控</li><li>上线周期长</li></ul> |
| **适用场景** | 有后端团队、需要复杂查询、长期运营 |

#### 自建后端架构示意

```
iOS/Android App
      │
      ▼
┌─────────────────────────────┐
│        API Gateway          │
│   (Cloudflare / Nginx)      │
└──────────────┬──────────────┘
               │
┌──────────────┴──────────────┐
│      Backend (Fastify)       │
│                              │
│  ┌────────────────────┐     │
│  │  Auth Route        │     │
│  │  /api/v1/auth/*    │     │
│  └────────────────────┘     │
│                              │
│  ┌────────────────────┐     │
│  │  Food Route        │     │
│  │  /api/v1/food/*    │     │
│  └────────────────────┘     │
│                              │
│  ┌────────────────────┐     │
│  │  Pet Route         │     │
│  │  /api/v1/pet/*     │     │
│  └────────────────────┘     │
│                              │
│  ┌────────────────────┐     │
│  │  AI Proxy          │     │
│  │  /api/v1/ai/*      │     │
│  └────────────────────┘     │
│                              │
└──────┬───────┬──────────────┘
       │       │
┌──────┴───┐ ┌─┴──────────┐
│PostgreSQL │ │   Redis    │
│(主数据)   │ │ (缓存/会话) │
└──────────┘ └────────────┘
       │
┌──────┴──────────┐
│  Object Storage  │
│  (图片存储)      │
└─────────────────┘
```

---

### 方案对比总结

| 对比维度 | 腾讯云开发 🏆 | Firebase 🌍 | 自建后端 🛠️ |
|---------|:-----------:|:-----------:|:-----------:|
| **国内访问速度** | ⭐⭐⭐⭐⭐ | ⭐⚠️ GFW | ⭐⭐⭐⭐ |
| **MVP 上线速度** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| **运维复杂度** | 零 | 零 | 高 |
| **扩展性** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **成本 (MVP)** | 免费 | 免费 | 服务器费 |
| **社区生态** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **供应商锁定** | 高 | 高 | 无 |
| **实时同步** | 内建 | 内建 | 需自建 |
| **微信生态** | ✅ 可集成 | ❌ | ⚠️ 需开发 |

### 推荐方案

根据你的情况（**国内市场、中文优先、全年龄段**）：

> 🏆 **推荐: 腾讯云开发 (方案 A)**
> 
> 选择依据:
> 1. **国内访问零障碍** — 不受 GFW 影响，CDN 加速
> 2. **微信生态** — 未来可无缝扩展小程序版本
> 3. **免费额度大** — 5 万次/日云函数调用，2GB 数据库
> 4. **中文友好** — 文档、社区、SDK 均为中文
> 5. **与 AI API 配合好** — 国内 AI 服务（百度/讯飞）可在云函数中直接调用
> 
> **何时考虑 Firebase**: 如果你计划同时做海外版本，或未来需要国际化

---

## 6. 数据模型设计 (后端)

### 6.1 后端数据结构 (NoSQL，腾讯云数据库 / Firestore 兼容)

```
/users/{userId}
{
  uid: "auth_uid",
  nickname: "小明",
  createdAt: Timestamp,
  locale: "zh-CN"
}

/pets/{petId}
{
  userId: "auth_uid",
  name: "小可爱",
  hunger: 75.0,
  health: 90.0,
  mood: 85.0,
  lastFedAt: Timestamp,
  lastCalculatedAt: Timestamp,
  status: "happy"
}

/foodRecords/{recordId}
{
  userId: "auth_uid",
  petId: "pet_id",
  foodName: "红烧肉",
  calories: 320.0,
  protein: 15.0,
  carbs: 10.0,
  fat: 22.0,
  confidence: 0.92,
  imageUrl: "/photos/recordId.jpg",
  source: "ai",
  createdAt: Timestamp
}

/foodDatabase/{foodId}     ← 本地 + 远程缓存
{
  name: "米饭",
  caloriesPer100g: 116.0,
  proteinPer100g: 2.6,
  carbsPer100g: 25.9,
  fatPer100g: 0.3,
  aliases: ["白饭", "大米饭"]
}
```

### 6.2 Pet Engine 共享算法规范 (iOS / Android 必须一致)

> ⚠️ **关键**: 以下算法逻辑必须在 iOS 和 Android 端实现完全相同，确保跨平台一致性。

#### 6.2.1 属性衰减策略

**策略**: 客户端计算 + 时间戳驱动

```
当 App 从后台回到前台时:
  1. 读取上次计算时间 lastCalculatedAt
  2. 计算时间差 Δt = now - lastCalculatedAt (小时)
  3. 应用衰减公式更新属性值
  4. 更新 lastCalculatedAt = now
  5. 同步最新状态到服务器
```

**衰减公式**:

```
健康值衰减 (时间因素):
  IF hunger < 20 AND Δt >= 6 (长期饥饿):
    health_penalty = min(5, (Δt - 6) * 0.5)
    new_health = max(0, current_health - health_penalty)
  IF hunger > 95 AND Δt >= 4 (长期过饱):
    health_penalty = min(3, (Δt - 4) * 0.5)
    new_health = max(0, current_health - health_penalty)
  ELSE:
    new_health = current_health (不衰减)

注意: 饱食度不再简单衰减，而是基于「今日累计摄入 vs 卡路里目标」实时计算
     (见 6.2.2 喂食计算逻辑)
```

#### 6.2.2 喂食计算逻辑（含卡路里目标联动）

```
输入:
  - food.calories (本次食物热量, kcal)
  - food.protein, food.carbs, food.fat (营养素, g)
  - calorieGoal.dailyCalorieGoal (每日卡路里目标)
  - todayIntake (今日已摄入热量, kcal)
  - current pet state

计算步骤:

  1. 更新今日累计摄入:
     newTodayIntake = todayIntake + food.calories

  2. 计算摄入比例:
     ratio = newTodayIntake / calorieGoal.dailyCalorieGoal

  3. 饱食度映射 (基于摄入比例):
     IF ratio < 0.60:
         hunger = ratio * 50                        // 饥饿区间 0-30
     ELSE IF ratio < 0.90:
         hunger = 30 + (ratio - 0.60) * 133         // 正常区间 30-70
     ELSE IF ratio < 1.10:
         hunger = 70 + (ratio - 0.90) * 100         // 满足区间 70-90 ← 理想
     ELSE IF ratio < 1.20:
         hunger = 90 + (ratio - 1.10) * 100         // 过饱区间 90-100
     ELSE:
         hunger = 100                                // 吃撑

  4. 健康值 - 摄入量评估:
     IF ratio >= 0.90 AND ratio <= 1.10:
         intakeHealth = +3   // 合理
     ELSE IF ratio > 1.10 AND ratio <= 1.20:
         intakeHealth = -1   // 略多
     ELSE IF ratio > 1.20:
         intakeHealth = -4   // 吃撑惩罚
     ELSE IF ratio < 0.60:
         intakeHealth = -2   // 节食
     ELSE:
         intakeHealth = 0

  5. 健康值 - 营养均衡评估:
     proteinRatio = (food.protein * 4) / food.calories
     fatRatio = (food.fat * 9) / food.calories
     carbRatio = (food.carbs * 4) / food.calories

     IF proteinRatio >= 0.15 AND fatRatio <= 0.35:
         nutritionHealth = +2   // 均衡
     ELSE IF fatRatio > 0.40 OR (proteinRatio < 0.05 AND carbRatio > 0.70):
         nutritionHealth = -3   // 不均衡
     ELSE:
         nutritionHealth = 0    // 普通

  6. 更新健康值:
     new_health = clamp(current_health + intakeHealth + nutritionHealth, 0, 100)

  7. 心情值 (衍生):
     IF hunger >= 70 AND hunger <= 90 AND new_health >= 60:
         mood = 90   // 开心
     ELSE IF hunger > 90 OR new_health < 30:
         mood = 25   // 难受 (吃撑或生病)
     ELSE IF hunger < 30:
         mood = 20   // 难过 (饥饿)
     ELSE:
         mood = 50   // 正常

  8. 更新时间戳:
     lastFedAt = now
     lastCalculatedAt = now

输出: 更新后的 PetState + newTodayIntake
```

> **注意**: 上述公式中的数值参数（ratio 阈值、映射系数、健康增量、mood 阈值）以 6.2.4 参数表为单一声明源。

#### 6.2.3 伪代码实现 (平台无关)

```
// MARK: - Pet Engine (Shared Spec)

class PetEngine {

    // MARK: - 属性衰减 (App 回到前台时调用)

    static func applyDecay(to pet: PetState, todayIntake: Double, dailyCalorieGoal: Double, now: Date) -> PetState {
        let deltaHours = (now.timeIntervalSince(pet.lastCalculatedAt)) / 3600

        // 饱食度为纯派生值：回前台时按 6.2.2 映射重算，不随时间线性衰减
        let ratio = todayIntake / dailyCalorieGoal
        let hunger = computeHunger(fromRatio: ratio)

        // 健康值衰减 (时间因素，仅长期饥饿/长期过饱)
        var health = pet.health
        if hunger < 20 && deltaHours >= 6 {
            let overHungerHours = deltaHours - 6
            let penalty = min(5.0, overHungerHours * 0.5)
            health = max(0, health - penalty)
        } else if hunger > 95 && deltaHours >= 4 {
            let overfedHours = deltaHours - 4
            let penalty = min(3.0, overfedHours * 0.5)
            health = max(0, health - penalty)
        }

        // 心情值 (衍生)
        let mood = computeMood(hunger: hunger, health: health)

        return PetState(
            id: pet.id,
            name: pet.name,
            hunger: hunger,
            health: health,
            mood: mood,
            lastFedAt: pet.lastFedAt,
            status: mapStatus(mood: mood, health: health),
            lastCalculatedAt: now
        )
    }

    // MARK: - 喂食计算

    static func feed(pet: PetState, food: FoodItem, todayIntake: Double, dailyCalorieGoal: Double) -> PetState {
        // 1. 更新今日累计摄入
        let newTodayIntake = todayIntake + food.calories

        // 2. 饱食度为纯派生值：按 6.2.2 映射重算
        let ratio = newTodayIntake / dailyCalorieGoal
        let hunger = computeHunger(fromRatio: ratio)

        // 3. 健康值 - 摄入量评估
        let intakeHealth = evaluateIntake(ratio: ratio)

        // 4. 营养均衡评估
        let nutritionHealth = evaluateNutrition(food)

        // 5. 更新健康值
        var health = clamp(pet.health + intakeHealth + nutritionHealth, min: 0, max: 100)

        // 6. 心情值
        let mood = computeMood(hunger: hunger, health: health)

        return PetState(
            id: pet.id,
            name: pet.name,
            hunger: hunger,
            health: health,
            mood: mood,
            lastFedAt: Date(),
            status: .eating,  // 进食中 (由动画层处理)
            lastCalculatedAt: Date()
        )
    }

    // MARK: - 饱食度计算 (6.2.2 第 3 步映射，参数见 6.2.4)

    private static func computeHunger(fromRatio ratio: Double) -> Double {
        if ratio < 0.60 {
            return ratio * 50
        } else if ratio < 0.90 {
            return 30 + (ratio - 0.60) * 133
        } else if ratio < 1.10 {
            return 70 + (ratio - 0.90) * 100
        } else if ratio < 1.20 {
            return 90 + (ratio - 1.10) * 100
        }
        return 100
    }

    // MARK: - 摄入量健康评估 (6.2.2 第 4 步，参数见 6.2.4)

    private static func evaluateIntake(ratio: Double) -> Double {
        if ratio >= 0.90 && ratio <= 1.10 {
            return +3
        } else if ratio > 1.10 && ratio <= 1.20 {
            return -1
        } else if ratio > 1.20 {
            return -4
        } else if ratio < 0.60 {
            return -2
        }
        return 0
    }

    // MARK: - 营养评估

    private static func evaluateNutrition(_ food: FoodItem) -> Double {
        guard food.calories > 0 else { return 0 }

        let proteinRatio = (food.protein * 4) / food.calories
        let fatRatio = (food.fat * 9) / food.calories
        let carbRatio = (food.carbs * 4) / food.calories

        if proteinRatio >= 0.15 && fatRatio <= 0.35 {
            return +2  // 均衡
        } else if fatRatio > 0.40 || (proteinRatio < 0.05 && carbRatio > 0.70) {
            return -3  // 不均衡
        }
        return 0  // 普通
    }

    // MARK: - 心情计算

    private static func computeMood(hunger: Double, health: Double) -> Double {
        if hunger >= 70 && hunger <= 90 && health >= 60 {
            return 90   // 开心
        } else if hunger > 90 || health < 30 {
            return 25   // 难受 (吃撑或生病)
        } else if hunger < 30 {
            return 20   // 难过 (饥饿)
        }
        return 50     // 正常
    }

    // MARK: - 状态映射

    static func mapStatus(mood: Double, health: Double, hunger: Double) -> PetStatus {
        if health < 30 { return .sick }
        if hunger >= 90 { return .overfull }
        if hunger < 30 || mood < 35 { return .hungry }
        if mood >= 70 { return .happy }
        return .normal
        // .eating 为喂食动作触发状态，由喂食流程设置，不在此映射
    }

    // MARK: - 工具方法

    private static func clamp(_ value: Double, min: Double, max: Double) -> Double {
        return max(min, min(value, max))
    }
}
```

#### 6.2.4 参数调优（单一声明源）

> ⚠️ **重要**: 本表是 Pet Engine 数值参数的**单一声明源**（Single Source of Truth）。6.2.2 公式与 6.2.3 伪代码中的数值均引用本表；调参只需修改此处。
> 以下参数在 MVP 阶段为初始值，上线后需根据用户数据调优：

**饱食度映射（hunger = f(ratio)，ratio = 今日累计摄入 / 每日卡路里目标）**

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `ratio_thresholds` | 0.60 / 0.90 / 1.10 / 1.20 | 饱食度映射分段边界 |
| `hunger_map_coeff_hungry` | 50 | ratio < 0.60: hunger = ratio × 50（饥饿 0-30） |
| `hunger_map_coeff_normal` | 133 | 0.60 ≤ ratio < 0.90: hunger = 30 + (ratio − 0.60) × 133（正常 30-70） |
| `hunger_map_coeff_satisfied` | 100 | 0.90 ≤ ratio < 1.10: hunger = 70 + (ratio − 0.90) × 100（满足 70-90）← 理想（系数由 200 调整为 100，保证 1.10 边界连续=90） |
| `hunger_map_coeff_overfed` | 100 | 1.10 ≤ ratio < 1.20: hunger = 90 + (ratio − 1.10) × 100（过饱 90-100） |
| `hunger_map_cap` | ratio ≥ 1.20 → hunger = 100 | 吃撑封顶 |

**健康值**

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `intake_health` | ratio 0.90-1.10 → +3；1.10-1.20 → −1；>1.20 → −4；<0.60 → −2；其余 0 | 摄入量评估（合理/略多/吃撑/节食） |
| `nutrition_health` | 蛋白占比≥0.15 且 脂肪占比≤0.35 → +2；脂肪占比>0.40 或 (蛋白<0.05 且 碳水>0.70) → −3；其余 0 | 营养均衡评估 |
| `health_range` | clamp(0, 100) | 健康值上下限 |

**心情值（衍生）**

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `happy_hunger_range` | 70-90 | 开心状态的饱食度范围 |
| `happy_health_min` | 60 | 开心状态需 health ≥ 60 |
| `mood_happy` | 90 | 开心 |
| `mood_uncomfortable` | 25 | 难受（hunger > 90 或 health < 30） |
| `mood_sad` | 20 | 难过（hunger < 30） |
| `mood_normal` | 50 | 正常 |

**健康值时间惩罚（仅回前台时计算）**

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `health_penalty_rate` | 0.5/hour | 饥饿/过饱状态下健康值衰减率 |
| `starvation_threshold` | hunger < 20 且 Δt ≥ 6h | 长期饥饿触发，penalty = min(5, (Δt − 6) × 0.5) |
| `overfed_threshold` | hunger > 95 且 Δt ≥ 4h | 长期过饱触发，penalty = min(3, (Δt − 4) × 0.5) |

**状态映射**

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `map_status` | health < 30 → sick；mood ≥ 70 → happy；mood < 35 → sad；否则 normal | 与 mood 离散档 90/50/25/20 兼容 |

**废弃参数（已从新模型移除）**

| 参数 | 原值 | 废弃原因 |
|------|------|---------|
| `hunger_decay_rate` | ~~1.5/hour~~ | 饱食度改为纯派生值，不再随时间线性衰减 |
| `hunger_increment_coeff` | ~~0.2~~ | 喂食不再按 kcal 增量，改为 6.2.2 比例映射 |

### 6.3 API 接口定义 (RESTful)

| 方法 | 端点 | 描述 |
|------|------|------|
| **用户认证** | | |
| POST | `/api/v1/auth/register` | 注册新用户 |
| POST | `/api/v1/auth/login` | 用户登录 |
| **食物识别** | | |
| POST | `/api/v1/food/recognize` | 上传图片获取识别结果 |
| GET | `/api/v1/food/search?q=keyword` | 手动搜索食物数据库 |
| **食物记录** | | |
| POST | `/api/v1/food-records` | 创建食物记录 |
| GET | `/api/v1/food-records?date=YYYY-MM-DD` | 获取指定日期记录 |
| DELETE | `/api/v1/food-records/{id}` | 删除食物记录 |
| **宠物** | | |
| GET | `/api/v1/pets/{id}` | 获取宠物当前状态 |
| POST | `/api/v1/pets/{id}/feed` | 喂食宠物（触发属性计算） |
| PATCH | `/api/v1/pets/{id}` | 更新宠物信息 |

#### 核心 API 示例

```
POST /api/v1/food/recognize

Request:
  Content-Type: multipart/form-data
  Body: image=<binary_jpeg_data>

Response:
{
  "candidates": [
    {
      "id": "food_001",
      "name": "红烧肉",
      "confidence": 0.92,
      "caloriesPer100g": 395,
      "proteinPer100g": 7.5,
      "carbsPer100g": 3.4,
      "fatPer100g": 38.5,
      "estimatedWeight": 150,
      "totalCalories": 592
    },
    {
      "id": "food_002",
      "name": "糖醋排骨",
      "confidence": 0.71,
      ...
    },
    {
      "id": "food_003",
      "name": "可乐鸡翅",
      "confidence": 0.58,
      ...
    }
  ],
  "bestMatch": { ... },
  "confidenceLevel": "high"  // high / medium / low
}
```

---

## 7. 客户端 ↔ 后端交互流程

### 7.1 核心: 拍照→识别→喂食

```
┌────────┐        ┌────────┐        ┌────────┐        ┌────────┐
│  iOS   │        │  后端   │        │ AI API │        │  数据库  │
│  App   │        │        │        │        │        │        │
└───┬────┘        └───┬────┘        └───┬────┘        └───┬────┘
    │ 1. 拍照/选图     │                 │                 │
    │─────────────────►│                 │                 │
    │                 │ 2. 转发图片      │                 │
    │                 │────────────────►│                 │
    │                 │                 │ 3. 识别+返回结果 │
    │                 │◄────────────────│                 │
    │                 │ 4. 解析+格式化   │                 │
    │                 │                 │                 │
    │ 5. 返回候选列表   │                 │                 │
    │◄─────────────────│                 │                 │
    │                 │                 │                 │
    │ 6. 用户确认选择   │                 │                 │
    │                 │                 │                 │
    │ 7. 创建食物记录   │                 │                 │
    │─────────────────►│                 │                 │
    │                 │ 8. 写入 DB       │                 │
    │                 │─────────────────────────────────►│
    │                 │                 │                 │
    │                 │ 9. 触发宠物属性计算│                 │
    │                 │─────────────────────────────────►│
    │                 │◄─────────────────────────────────│
    │                 │                 │                 │
    │ 10. 返回宠物新状态│                 │                 │
    │◄─────────────────│                 │                 │
    │                 │                 │                 │
    │ 11. 播放动画反馈  │                 │                 │
    │                 │                 │                 │
```

### 7.2 离线策略

| 场景 | 处理 |
|------|------|
| 离线拍照 | 照片保存在本地，联网后自动同步 |
| 离线喂食 | 客户端本地计算宠物状态，联网后同步到服务端 |
| 离线查看历史 | 从本地数据库读取 |

---

## 8. 安全与合规

### 8.1 数据安全

| 措施 | 实现 |
|------|------|
| 传输加密 | 全链路 HTTPS/TLS 1.3 |
| 存储加密 | 敏感数据 AES-256 加密 |
| 认证 | OAuth 2.0 / JWT Token |
| 图片处理 | 上传前压缩 + 模糊化处理人脸/位置信息 |

### 8.2 隐私合规

- 符合《个人信息保护法》
- 食物照片**仅用于 AI 识别**，不用于训练或其他用途
- 用户可随时导出/删除数据
- 隐私政策在 App 内可查阅

---

## 9. 开发环境与工具链

### 9.1 开发环境

| 角色 | 工具 |
|------|------|
| iOS 开发 | Xcode 15+, Swift 5.9+ |
| Android 开发 | Android Studio Iguana+, Kotlin 1.9+ |
| 后端开发 | VS Code / WebStorm, Node.js 20+ |
| 数据库 | Firebase Console / pgAdmin |
| 版本控制 | Git (GitHub) |
| CI/CD | GitHub Actions |
| 设计 | Figma |

### 9.2 项目结构 (建议)

```
PetDiet/
├── ios/                          # iOS 原生项目
│   ├── PetDiet/
│   │   ├── Models/
│   │   ├── ViewModels/
│   │   ├── Views/
│   │   ├── Services/
│   │   ├── Core/
│   │   └── Resources/
│   └── PetDiet.xcodeproj
│
├── android/                      # Android 原生项目
│   ├── app/
│   │   ├── src/main/java/com/petdiet/
│   │   │   ├── model/
│   │   │   ├── viewmodel/
│   │   │   ├── ui/
│   │   │   ├── data/
│   │   │   ├── service/
│   │   │   └── di/
│   │   └── src/main/res/
│   └── build.gradle.kts
│
├── backend/                      # 后端服务
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── models/
│   │   └── utils/
│   ├── package.json
│   └── Dockerfile
│
├── docs/                         # 文档
│   ├── PRD.md
│   ├── TDD.md
│   └── API.md
│
└── .github/                      # CI/CD
    └── workflows/
        ├── ios-ci.yml
        ├── android-ci.yml
        └── backend-ci.yml
```

---

## 10. 待决事项

| # | 事项 | 影响 | 建议 |
|---|------|------|------|
| 1 | **后端方案选型** | 架构、开发流程、部署方式 | 见第 5 节，🏆 推荐腾讯云开发 (国内首选) |
| 2 | **AI API 提供商** | 识别准确率、成本、响应速度 | 见第 4.1.1 节，推荐百度AI (中餐最佳) |
| 3 | **宠物形象设计** | 设计资源、动画制作 | MVP 用 emoji + 简单动画，后续迭代细化 |
| 4 | **推送通知策略** | 用户回访率、活跃度 | MVP 阶段先做本地通知 |
| 5 | **AI 兜底策略** | 用户体验 | 已定义三级置信度 + Top-K 候选 + 手动输入 |

---

## 附录

### A. 关键依赖库 (iOS)

| 库 | 用途 | 版本 |
|----|------|------|
| Lottie | 动画播放 | 4.x |
| Alamofire (或 URLSession) | HTTP 请求 | 5.x |
| SwiftData | 本地持久化 | (iOS 17+) |

### B. 关键依赖库 (Android)

| 库 | 用途 | 版本 |
|----|------|------|
| Lottie | 动画播放 | 6.x |
| Retrofit | HTTP 请求 | 2.9+ |
| OkHttp | 网络层 | 4.12+ |
| Room | 本地数据库 | 2.6+ |
| Hilt | 依赖注入 | 2.5+ |
| Coil | 图片加载 | 2.5+ |

### C. 成本估算 (MVP 阶段)

| 项目 | 费用 |
|------|------|
| AI API 调用 | ~$0.001-0.01/次 (按 1000 次/日估算 ≈ $30-300/月) |
| 后端基础设施 | 免费额度内 (Firebase/腾讯云) |
| App Store 开发者账号 | $99/年 |
| Google Play 开发者账号 | $25 (一次性) |
| 域名 (如需) | ~$10-15/年 |
