/**
 * PetDiet 用户认证云函数 (CloudBase PostgreSQL 版)
 * 超时配置: 5s（控制台手动设置）
 *
 * Actions:
 *   - register: 用户注册
 *   - login: 用户登录
 */

const cloudbase = require('@cloudbase/node-sdk')

const app = cloudbase.init({
  env: cloudbase.SYMBOL_DEFAULT_ENV
})

const db = app.rdb()

exports.main = async (event, context) => {
  const { action, data } = event

  switch (action) {
    case 'register':
      // TODO: T3.3.1 实现注册逻辑
      // 1. 校验入参（nickname, openId/phone）
      // 2. db.from('users').insert({ open_id, nickname })
      // 3. db.from('pets').insert({ user_id })
      // 4. db.from('user_profiles').insert({ user_id })
      // 5. db.from('calorie_goals').insert({ user_id })
      return { code: 501, msg: 'Not implemented - 待 T3.3.1 实现' }

    case 'login':
      // TODO: T3.3.2 实现登录逻辑
      // 1. db.from('users').select('*').eq('open_id', openId)
      // 2. db.from('pets').select('*').eq('user_id', userId)
      // 3. 返回用户信息 + 宠物状态
      return { code: 501, msg: 'Not implemented - 待 T3.3.2 实现' }

    default:
      return { code: 400, msg: `Unknown action: ${action}` }
  }
}
