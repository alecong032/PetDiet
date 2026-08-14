/**
 * PetDiet 食物云函数
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

const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { action, data } = event

  switch (action) {
    case 'recognize':
      // TODO: T3.5.1 实现 AI 识别
      // 1. 从 event 获取图片 base64 或 fileID
      // 2. 获取百度 AI access_token（使用环境变量）
      // 3. 调用百度 AI 菜品识别 API
      // 4. 返回 Top-3 候选 + 置信度 + 营养信息
      return { code: 501, msg: 'Not implemented - 待 T3.5.1 实现' }

    case 'search':
      // TODO: T3.6.1 实现食物搜索
      // 1. 根据关键词搜索 foodDatabase 集合
      // 2. 返回匹配结果列表
      return { code: 501, msg: 'Not implemented - 待 T3.6.1 实现' }

    case 'createRecord':
      // TODO: T3.7.1 实现创建记录
      // 1. 校验入参（userId, foodName, calories...）
      // 2. 写入 foodRecords 集合
      // 3. 触发宠物属性更新（调用 pet 函数）
      return { code: 501, msg: 'Not implemented - 待 T3.7.1 实现' }

    case 'getRecords':
      // TODO: T3.7.2 实现查询记录
      // 1. 根据 userId + date 查询 foodRecords
      // 2. 返回当日所有饮食记录
      return { code: 501, msg: 'Not implemented - 待 T3.7.2 实现' }

    case 'deleteRecord':
      // TODO: T3.7.3 实现删除记录
      // 1. 校验记录归属权
      // 2. 删除 foodRecords 文档
      return { code: 501, msg: 'Not implemented - 待 T3.7.3 实现' }

    default:
      return { code: 400, msg: `Unknown action: ${action}` }
  }
}
