/**
 * PetDiet 宠物云函数 (CloudBase PostgreSQL 版)
 * 超时配置: 5s（控制台手动设置）
 *
 * Actions:
 *   - get:    获取宠物当前状态
 *   - feed:   喂食宠物（触发属性计算）
 *   - update: 更新宠物信息
 */

const cloudbase = require('@cloudbase/node-sdk')

const app = cloudbase.init({
  env: cloudbase.SYMBOL_DEFAULT_ENV
})

const db = app.rdb()

exports.main = async (event, context) => {
  const { action, data } = event

  switch (action) {
    case 'get':
      // TODO: T3.8.1 实现获取宠物状态
      // db.from('pets').select('*').eq('user_id', userId)
      return { code: 501, msg: 'Not implemented - 待 T3.8.1 实现' }

    case 'feed':
      // TODO: T3.8.2 实现喂食逻辑
      // db.from('pets').update({ hunger, last_fed_at }).eq('id', petId)
      return { code: 501, msg: 'Not implemented - 待 T3.8.2 实现' }

    case 'update':
      // TODO: T3.8.3 实现更新宠物信息
      // db.from('pets').update({ name, status }).eq('id', petId)
      return { code: 501, msg: 'Not implemented - 待 T3.8.3 实现' }

    default:
      return { code: 400, msg: `Unknown action: ${action}` }
  }
}
