/**
 * PetDiet 存储初始化云函数
 * 一次性运行：创建 3 个存储文件夹（通过上传占位文件）
 */

const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const results = []
  const folders = ['food-images', 'pet-avatars', 'user-avatars']

  for (const folder of folders) {
    try {
      // 在云存储中创建占位文件（相当于创建文件夹）
      const fileName = `${folder}/.keep`
      const fileContent = Buffer.from('placeholder')

      const result = await cloud.uploadFile({
        cloudPath: fileName,
        fileContent: fileContent
      })

      results.push(`[文件夹] /${folder}/ 创建成功 (fileID: ${result.fileID})`)
    } catch (e) {
      results.push(`[文件夹] /${folder}/ 创建失败: ${e.message}`)
    }
  }

  return {
    code: 0,
    msg: '存储初始化完成',
    details: results
  }
}
