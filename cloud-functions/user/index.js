/**
 * PetDiet 用户资料云函数 (CloudBase PostgreSQL 版)
 * 超时配置: 5s（控制台手动设置）
 *
 * Actions:
 *   - getProfile:    获取用户资料
 *   - updateProfile: 更新用户资料
 *   - getGoal:       获取卡路里目标
 *   - updateGoal:    更新卡路里目标
 *   - getWeight:     获取体重历史
 *   - addWeight:     添加体重记录
 */

const cloudbase = require('@cloudbase/node-sdk')

const app = cloudbase.init({
  env: cloudbase.SYMBOL_DEFAULT_ENV
})

const db = app.rdb()

exports.main = async (event, context) => {
  const { action, data } = event

  switch (action) {
    case 'getProfile':
      // TODO: T3.9.1 获取用户资料
      // db.from('user_profiles').select('*').eq('user_id', userId)
      return { code: 501, msg: 'Not implemented - 待 T3.9.1 实现' }

    case 'updateProfile':
      // TODO: T3.9.2 更新用户资料
      // db.from('user_profiles').update({ gender, height, ... }).eq('user_id', userId)
      return { code: 501, msg: 'Not implemented - 待 T3.9.2 实现' }

    case 'getGoal':
      // TODO: T3.9.3 获取卡路里目标
      // db.from('calorie_goals').select('*').eq('user_id', userId)
      return { code: 501, msg: 'Not implemented - 待 T3.9.3 实现' }

    case 'updateGoal':
      // TODO: T3.9.4 更新卡路里目标
      // db.from('calorie_goals').update({ daily_calorie_goal, ... }).eq('user_id', userId)
      return { code: 501, msg: 'Not implemented - 待 T3.9.4 实现' }

    case 'getWeight':
      // TODO: T3.9.5 获取体重历史
      // db.from('weight_records').select('*').eq('user_id', userId).order('recorded_at', { ascending: false })
      return { code: 501, msg: 'Not implemented - 待 T3.9.5 实现' }

    case 'addWeight':
      // TODO: T3.9.6 添加体重记录
      // db.from('weight_records').insert({ user_id, weight })
      return { code: 501, msg: 'Not implemented - 待 T3.9.6 实现' }

    default:
      return { code: 400, msg: `Unknown action: ${action}` }
  }
}
