# 云开发环境配置清单

> **任务**: T1.1.3 — 创建云开发项目，配置基础环境
> **创建日期**: 2026-08-12
> **环境 ID**: `petdiet-0812`

---

## 一、环境信息

| 字段 | 值 | 说明 |
|------|-----|------|
| **环境 ID** | `petdiet-0812` | 腾讯云开发环境 |
| **地域** | `ap-shanghai` | 上海 |
| **套餐** | 个人版 19.9 元/月 | 40,000 资源点/月 |
| **附加套餐** | COS标准存储 100GB/1年 + 基础图片处理 1TB/1年 | 30.1 元一次性 |
| **SDK** | `wx-server-sdk` ^2.6.3 | 云函数 Node.js SDK |

---

## 二、数据库集合

### 2.1 集合一览

| 集合名 | 用途 | 数据模型来源 |
|--------|------|-------------|
| `users` | 用户基本信息 | PRD §5.1 User |
| `pets` | 宠物数据 | PRD §5.1 Pet |
| `foodRecords` | 饮食记录 | PRD §5.1 FoodRecord |
| `weightRecords` | 体重记录 | PRD §5.1 WeightRecord |
| `userProfiles` | 用户详细资料 | PRD §5.1 UserProfile |
| `calorieGoals` | 卡路里目标设置 | PRD §5.1 CalorieGoal |

### 2.2 集合字段定义

#### users

| 字段 | 类型 | 说明 |
|------|------|------|
| `_id` | String | 自动生成 |
| `openId` | String | 登录凭证（微信/手机号） |
| `nickname` | String | 昵称 |
| `createdAt` | Date | 注册时间 |
| `locale` | String | 语言偏好，默认 `zh-CN` |

#### pets

| 字段 | 类型 | 说明 |
|------|------|------|
| `_id` | String | 自动生成 |
| `userId` | String | 关联用户 ID |
| `name` | String | 宠物名称，默认 "小可爱" |
| `hunger` | Float | 饥饿值 (0-100) |
| `health` | Float | 健康值 (0-100) |
| `mood` | Float | 心情值 (0-100，派生) |
| `lastFedAt` | Date | 最后喂食时间 |
| `lastCalculatedAt` | Date | 最后属性计算时间 |
| `status` | String | 状态: happy/normal/sick |
| `createdAt` | Date | 创建时间 |

#### foodRecords

| 字段 | 类型 | 说明 |
|------|------|------|
| `_id` | String | 自动生成 |
| `userId` | String | 关联用户 ID |
| `petId` | String | 关联宠物 ID |
| `foodName` | String | 食物名称 |
| `calories` | Float | 热量 (kcal) |
| `protein` | Float? | 蛋白质 (g) |
| `carbs` | Float? | 碳水 (g) |
| `fat` | Float? | 脂肪 (g) |
| `confidence` | Float? | AI 置信度 |
| `imageUrl` | String? | 食物照片 URL |
| `source` | String | 来源: ai/manual/favorite |
| `createdAt` | Date | 记录时间 |

#### weightRecords

| 字段 | 类型 | 说明 |
|------|------|------|
| `_id` | String | 自动生成 |
| `userId` | String | 关联用户 ID |
| `weight` | Float | 体重 (kg) |
| `recordedAt` | Date | 记录时间 |

#### userProfiles

| 字段 | 类型 | 说明 |
|------|------|------|
| `_id` | String | 自动生成 |
| `userId` | String | 关联用户 ID |
| `gender` | String | 性别: male/female |
| `birthDate` | Date | 出生日期 |
| `height` | Float | 身高 (cm) |
| `currentWeight` | Float | 当前体重 (kg) |
| `activityLevel` | String | 活动量: sedentary/light/moderate/active/very_active |
| `updatedAt` | Date | 更新时间 |

#### calorieGoals

| 字段 | 类型 | 说明 |
|------|------|------|
| `_id` | String | 自动生成 |
| `userId` | String | 关联用户 ID |
| `targetWeight` | Float | 目标体重 (kg) |
| `goalType` | String | 目标类型: lose/maintain/gain |
| `dailyCalorieGoal` | Float | 每日卡路里目标 (kcal) |
| `bmr` | Float | 基础代谢率 |
| `tdee` | Float | 每日总消耗 |
| `isAutoCalculated` | Bool | 是否自动计算 |
| `updatedAt` | Date | 更新时间 |

### 2.3 索引设计

| 集合 | 索引名 | 字段 | 类型 | 查询场景 |
|------|--------|------|------|---------|
| `users` | `idx_openId` | `{ openId: 1 }` | 唯一 | 登录时按 openId 查用户 |
| `pets` | `idx_userId` | `{ userId: 1 }` | 唯一 | 按 userId 查宠物 (1:1) |
| `foodRecords` | `idx_user_createdAt` | `{ userId: 1, createdAt: -1 }` | 非唯一 | 按用户查饮食记录，时间倒序 |
| `weightRecords` | `idx_user_recordedAt` | `{ userId: 1, recordedAt: -1 }` | 非唯一 | 按用户查体重历史，时间倒序 |
| `userProfiles` | `idx_userId` | `{ userId: 1 }` | 唯一 | 按 userId 查资料 (1:1) |
| `calorieGoals` | `idx_userId` | `{ userId: 1 }` | 唯一 | 按 userId 查目标 (1:1) |

> 索引创建方式：部署 `init-database` 云函数并运行，或通过 CloudBase 控制台手动创建。

---

## 三、云存储

### 3.1 存储桶信息

| 字段 | 值 |
|------|-----|
| **存储类型** | COS 标准存储 |
| **容量** | 100GB / 1年 |
| **地域** | ap-shanghai（与 CloudBase 环境一致） |
| **图片处理** | 基础图片处理 1TB/1年（缩略图、压缩、格式转换） |

### 3.2 文件夹结构

| 路径 | 用途 | 权限 |
|------|------|------|
| `/food-images/` | 食物照片 | 上传需鉴权 / 读取公开（CDN） |
| `/pet-avatars/` | 宠物头像 | 上传需鉴权 / 读取公开（CDN） |
| `/user-avatars/` | 用户头像 | 上传需鉴权 / 读取公开（CDN） |

### 3.3 图片处理模板

| 模板 | 用途 | 参数 |
|------|------|------|
| 缩略图 | 列表展示 | 宽 200px，质量 70% |
| 压缩图 | 原图展示 | 宽 1080px，质量 80% |
| 格式转换 | WebP 优化 | 自动转 WebP（减少 30% 体积） |

---

## 四、云函数

### 4.1 函数列表

| 函数名 | 路径 | 超时 | 内存 | 说明 | 状态 |
|--------|------|:----:|:----:|------|:----:|
| `init-database` | `cloud-functions/init-database/` | 10s | 256MB | 一次性创建集合+索引 | ✅ 已运行 |
| `auth` | `cloud-functions/auth/` | 5s | 256MB | 注册/登录 | 骨架就绪 |
| `food` | `cloud-functions/food/` | **15s** | 256MB | AI 识别/搜索/记录 CRUD | 骨架就绪 |
| `pet` | `cloud-functions/pet/` | 5s | 256MB | 宠物查询/喂食/更新 | 骨架就绪 |
| `user` | `cloud-functions/user/` | 5s | 256MB | 资料/目标/体重 | 骨架就绪 |

> **超时配置说明**: `food` 函数调用百度 AI 识别需 2-5s，默认 3s 会超时，必须手动设为 15s。其他函数 5s 足够。

### 4.2 函数 Action 清单

#### auth

| Action | 说明 | 对应任务 | 端点 |
|--------|------|---------|------|
| `register` | 用户注册 | T3.3.1 | `POST /api/v1/auth/register` |
| `login` | 用户登录 | T3.3.2 | `POST /api/v1/auth/login` |

#### food

| Action | 说明 | 对应任务 | 端点 |
|--------|------|---------|------|
| `recognize` | AI 食物识别 | T3.5.1 | `POST /api/v1/food/recognize` |
| `search` | 搜索食物数据库 | T3.6.1 | `GET /api/v1/food/search` |
| `createRecord` | 创建饮食记录 | T3.7.1 | `POST /api/v1/food-records` |
| `getRecords` | 查询饮食记录 | T3.7.2 | `GET /api/v1/food-records` |
| `deleteRecord` | 删除饮食记录 | T3.7.3 | `DELETE /api/v1/food-records/{id}` |

#### pet

| Action | 说明 | 对应任务 | 端点 |
|--------|------|---------|------|
| `get` | 获取宠物状态 | T3.8.1 | `GET /api/v1/pets/{id}` |
| `feed` | 喂食宠物 | T3.8.2 | `POST /api/v1/pets/{id}/feed` |
| `update` | 更新宠物信息 | T3.8.3 | `PATCH /api/v1/pets/{id}` |

#### user

| Action | 说明 | 对应任务 | 端点 |
|--------|------|---------|------|
| `getProfile` | 获取用户资料 | T3.9.1 | - |
| `updateProfile` | 更新用户资料 | T3.9.2 | - |
| `getGoal` | 获取卡路里目标 | T3.9.3 | - |
| `updateGoal` | 更新卡路里目标 | T3.9.4 | - |
| `getWeight` | 获取体重历史 | T3.9.5 | - |
| `addWeight` | 添加体重记录 | T3.9.6 | - |

### 4.3 环境变量配置

在 CloudBase 控制台 → 云函数 → 对应函数 → 配置 → 环境变量 中设置：

| 变量名 | 用于函数 | 说明 | 配置时机 |
|--------|---------|------|---------|
| `BAIDU_AI_APP_ID` | food | 百度 AI 应用 ID | T1.2.1 完成后 |
| `BAIDU_AI_API_KEY` | food | 百度 AI API Key | T1.2.1 完成后 |
| `BAIDU_AI_SECRET_KEY` | food | 百度 AI Secret Key | T1.2.1 完成后 |

---

## 五、安全规则

### 5.1 数据库权限

| 集合 | 权限设置 | 说明 |
|------|---------|------|
| 所有集合 | **仅管理端可读写** | 前端不可直接操作数据库，所有操作通过云函数中转 |

> **安全原则**: 前端直接访问数据库存在安全风险。所有数据操作必须通过云函数验证身份后执行。

### 5.2 存储权限

| 操作 | 权限 | 说明 |
|------|------|------|
| 上传 | 需鉴权 | 仅登录用户可上传，通过云函数生成临时上传凭证 |
| 读取 | 公开 | 图片 URL 可直接访问（CDN 加速） |
| 删除 | 需鉴权 | 仅通过云函数删除 |

### 5.3 云函数 CORS

| 配置项 | 值 |
|--------|-----|
| 允许来源 | `*`（MVP 阶段，正式版改为具体域名） |
| 允许方法 | `GET, POST, PATCH, DELETE, OPTIONS` |
| 允许头 | `Content-Type, Authorization` |

---

## 六、部署操作清单

### 6.1 部署云函数

在 CloudBase 控制台 → 云函数 页面，逐个上传以下函数：

| # | 函数名 | 操作 | 超时设置 |
|---|--------|------|---------|
| 1 | `init-database` | 上传代码 → 安装依赖 → 运行 | 10s |
| 2 | `auth` | 上传代码 → 安装依赖 | 5s |
| 3 | `food` | 上传代码 → 安装依赖 | **15s** |
| 4 | `pet` | 上传代码 → 安装依赖 | 5s |
| 5 | `user` | 上传代码 → 安装依赖 | 5s |

### 6.2 确认数据库集合

运行 `init-database` 函数后，在控制台 → 数据库 页面确认 6 个集合均已创建：

- [ ] `users` 集合 + `idx_openId` 索引
- [ ] `pets` 集合 + `idx_userId` 索引
- [ ] `foodRecords` 集合 + `idx_user_createdAt` 索引
- [ ] `weightRecords` 集合 + `idx_user_recordedAt` 索引
- [ ] `userProfiles` 集合 + `idx_userId` 索引
- [ ] `calorieGoals` 集合 + `idx_userId` 索引

### 6.3 设置数据库权限

在控制台 → 数据库 → 每个集合 → 权限设置中，选择「仅管理端可读写」。

### 6.4 配置存储文件夹

在控制台 → 存储 页面，手动创建 3 个文件夹：

- [ ] `/food-images/`
- [ ] `/pet-avatars/`
- [ ] `/user-avatars/`

---

## 七、本地项目结构

```
SideProject/
├── cloud-functions/
│   ├── init-database/
│   │   ├── index.js          # 数据库初始化脚本
│   │   └── package.json
│   ├── auth/
│   │   ├── index.js          # 认证云函数骨架
│   │   └── package.json
│   ├── food/
│   │   ├── index.js          # 食物云函数骨架（AI 识别 15s 超时）
│   │   └── package.json
│   ├── pet/
│   │   ├── index.js          # 宠物云函数骨架
│   │   └── package.json
│   └── user/
│       ├── index.js          # 用户资料云函数骨架
│       └── package.json
├── docs/
│   └── tech-selection/
│       └── cloud-env-setup.md  # 本文档
└── .env.local                  # 环境变量（SecretId/Key）
```
