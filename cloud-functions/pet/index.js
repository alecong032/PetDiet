/**
 * PetDiet 宠物云函数
 * 超时配置: 5s（控制台手动设置）
 *
 * Actions:
 *   - get:    获取宠物当前状态
 *   - feed:   喂食宠物（触发属性计算）
 *   - update: 更新宠物信息
 */

const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { action, data } = event

  switch (action) {
    case 'get':
      // TODO: T3.8.1 实现获取宠物状态
      // 1. 根据 userId 查询 pets 集合
      // 2. 计算实时属性（基于 lastCalculatedAt 时间差）
      // 3. 返回宠物完整状态
      return { code: 501, msg: 'Not implemented - 待 T3.8.1 实现' }

    case 'feed':
      // TODO: T3.8.2 实现喂食逻辑
      // 1. 获取当前宠物状态
      // 2. 根据食物热量计算饱食度增量
      // 3. 更新 hunger / health / mood
      // 4. 更新 lastFedAt 和 lastCalculatedAt
      return { code: 501, msg: 'Not implemented - 待 T3.8.2 实现' }

    case 'update':
      // TODO: T3.8.3 实现更新宠物信息
      // 1. 校验可更新字段（name 等）
      // 2. 更新 pets 文档
      return { code: 501, msg: 'Not implemented - 待 T3.8.3 实现' }

    default:
      return { code: 400, msg: `Unknown action: ${action}` }
  }
}
