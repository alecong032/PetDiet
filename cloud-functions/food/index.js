/**
 * PetDiet 食物云函数 (CloudBase PostgreSQL 版)
 * 超时配置: 15s（控制台手动设置，AI 识别需要 2-5s）
 *
 * Actions:
 *   - recognize: 调用百度 AI 识别食物
 *   - search:    搜索食物数据库
 *   - createRecord:  创建饮食记录
 *   - getRecords:    查询饮食记录（按日期）
 *   - deleteRecord:  删除饮食记录
 *
 * 环境变量（CloudBase 控制台配置）:
 *   - BAIDU_AI_APP_ID
 *   - BAIDU_AI_API_KEY
 *   - BAIDU_AI_SECRET_KEY
 */

const cloudbase = require('@cloudbase/node-sdk')

const app = cloudbase.init({
  env: cloudbase.SYMBOL_DEFAULT_ENV
})

const db = app.rdb()

exports.main = async (event, context) => {
  const { action, data } = event

  switch (action) {
    case 'recognize':
      // TODO: T3.5.1 实现 AI 识别
      return { code: 501, msg: 'Not implemented - 待 T3.5.1 实现' }

    case 'search':
      // TODO: T3.6.1 实现食物搜索
      return { code: 501, msg: 'Not implemented - 待 T3.6.1 实现' }

    case 'createRecord':
      // TODO: T3.7.1 实现创建记录
      // db.from('food_records').insert({ user_id, food_name, calories, ... })
      return { code: 501, msg: 'Not implemented - 待 T3.7.1 实现' }

    case 'getRecords':
      // TODO: T3.7.2 实现查询记录
      // db.from('food_records').select('*').eq('user_id', userId).order('created_at', { ascending: false })
      return { code: 501, msg: 'Not implemented - 待 T3.7.2 实现' }

    case 'deleteRecord':
      // TODO: T3.7.3 实现删除记录
      // db.from('food_records').delete().eq('id', recordId)
      return { code: 501, msg: 'Not implemented - 待 T3.7.3 实现' }

    default:
      return { code: 400, msg: `Unknown action: ${action}` }
  }
}
