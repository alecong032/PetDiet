/**
 * PetDiet 存储初始化云函数
 * 一次性运行：创建 3 个存储文件夹（通过上传占位文件）
 *
 * 注意：存储操作使用 @cloudbase/node-sdk，与数据库类型无关
 */

const cloudbase = require('@cloudbase/node-sdk')

const app = cloudbase.init({ env: cloudbase.SYMBOL_DEFAULT_ENV })

exports.main = async (event, context) => {
  const results = []
  const folders = ['food-images', 'pet-avatars', 'user-avatars']

  for (const folder of folders) {
    try {
      const fileName = `${folder}/.keep`
      const fileContent = Buffer.from('placeholder')

      const result = await app.uploadFile({
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
