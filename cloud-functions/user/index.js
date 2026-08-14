/**
 * PetDiet 用户资料云函数
 * 超时配置: 5s（控制台手动设置）
 *
 * Actions:
 *   - getProfile:    获取用户资料
 *   - updateProfile: 更新用户资料
 *   - getGoal:       获取卡路里目标
 *   - updateGoal:    更新卡路里目标（含 BMR/TDEE 自动计算）
 *   - getWeight:     获取体重历史
 *   - addWeight:     添加体重记录
 */

const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { action, data } = event

  switch (action) {
    case 'getProfile':
      // TODO: T3.9.1 获取用户资料
      return { code: 501, msg: 'Not implemented - 待 T3.9.1 实现' }

    case 'updateProfile':
      // TODO: T3.9.2 更新用户资料
      // 1. 校验入参（gender, birthDate, height, currentWeight, activityLevel）
      // 2. 更新 userProfiles 文档
      return { code: 501, msg: 'Not implemented - 待 T3.9.2 实现' }

    case 'getGoal':
      // TODO: T3.9.3 获取卡路里目标
      return { code: 501, msg: 'Not implemented - 待 T3.9.3 实现' }

    case 'updateGoal':
      // TODO: T3.9.4 更新卡路里目标
      // 1. 如果 isAutoCalculated=true，根据 PRD §5.3 计算 BMR/TDEE
      //    BMR (Mifflin-St Jeor):
      //      男: 10*weight + 6.25*height - 5*age + 5
      //      女: 10*weight + 6.25*height - 5*age - 161
      //    TDEE = BMR × 活动系数
      //    目标热量 = TDEE ± 调整值（减重 -500 / 增重 +500）
      // 2. 更新 calorieGoals 文档
      return { code: 501, msg: 'Not implemented - 待 T3.9.4 实现' }

    case 'getWeight':
      // TODO: T3.9.5 获取体重历史
      // 1. 按 userId 查询 weightRecords，按 recordedAt 倒序
      return { code: 501, msg: 'Not implemented - 待 T3.9.5 实现' }

    case 'addWeight':
      // TODO: T3.9.6 添加体重记录
      // 1. 写入 weightRecords
      // 2. 同步更新 userProfiles.currentWeight
      return { code: 501, msg: 'Not implemented - 待 T3.9.6 实现' }

    default:
      return { code: 400, msg: `Unknown action: ${action}` }
  }
}
