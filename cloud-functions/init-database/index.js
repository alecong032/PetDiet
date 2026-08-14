/**
 * PetDiet 数据库初始化云函数
 * 一次性运行：创建 6 个核心集合 + 索引
 *
 * 使用方式：在 CloudBase 控制台 → 云函数 → init-database → 点击「运行」
 */

const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

/**
 * 集合定义（含索引）
 * 索引设计依据 PRD §5 查询场景：
 * - users.openId: 登录时按 openId 查用户（唯一）
 * - pets.userId: 按 userId 查宠物（唯一，1:1）
 * - foodRecords.userId+createdAt: 按用户查饮食记录，按时间倒序
 * - weightRecords.userId+recordedAt: 按用户查体重历史，按时间倒序
 * - userProfiles.userId: 按 userId 查资料（唯一，1:1）
 * - calorieGoals.userId: 按 userId 查目标（唯一，1:1）
 */
const collections = [
  { name: 'users', indexes: [{ name: 'idx_openId', keys: { openId: 1 }, unique: true }] },
  { name: 'pets', indexes: [{ name: 'idx_userId', keys: { userId: 1 }, unique: true }] },
  { name: 'foodRecords', indexes: [{ name: 'idx_user_createdAt', keys: { userId: 1, createdAt: -1 } }] },
  { name: 'weightRecords', indexes: [{ name: 'idx_user_recordedAt', keys: { userId: 1, recordedAt: -1 } }] },
  { name: 'userProfiles', indexes: [{ name: 'idx_userId', keys: { userId: 1 }, unique: true }] },
  { name: 'calorieGoals', indexes: [{ name: 'idx_userId', keys: { userId: 1 }, unique: true }] }
]

exports.main = async (event, context) => {
  const results = []

  for (const col of collections) {
    try {
      try {
        await db.createCollection(col.name)
        results.push(`[集合] ${col.name} 创建成功`)
      } catch (e) {
        results.push(`[集合] ${col.name} 已存在或跳过`)
      }

      const collection = db.collection(col.name)
      for (const idx of col.indexes) {
        try {
          await collection.createIndex(idx.name, idx.keys, { unique: idx.unique || false })
          results.push(`  [索引] ${idx.name} 创建成功`)
        } catch (e) {
          results.push(`  [索引] ${idx.name} 已存在或跳过`)
        }
      }
    } catch (err) {
      results.push(`[错误] ${col.name}: ${err.message}`)
    }
  }

  return { code: 0, msg: '数据库初始化完成', details: results }
}
