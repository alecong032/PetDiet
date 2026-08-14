/**
 * PetDiet 用户认证云函数
 * 超时配置: 5s（控制台手动设置）
 *
 * Actions:
 *   - register: 用户注册
 *   - login: 用户登录
 */

const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { action, data } = event

  switch (action) {
    case 'register':
      // TODO: T3.3.1 实现注册逻辑
      // 1. 校验入参（nickname, openId/phone）
      // 2. 检查 openId 是否已注册
      // 3. 创建 users 文档
      // 4. 初始化 pets 文档（默认宠物）
      // 5. 初始化 userProfiles 文档
      // 6. 初始化 calorieGoals 文档
      return { code: 501, msg: 'Not implemented - 待 T3.3.1 实现' }

    case 'login':
      // TODO: T3.3.2 实现登录逻辑
      // 1. 根据 openId 查询 users 集合
      // 2. 返回用户信息 + 宠物状态
      return { code: 501, msg: 'Not implemented - 待 T3.3.2 实现' }

    default:
      return { code: 400, msg: `Unknown action: ${action}` }
  }
}
