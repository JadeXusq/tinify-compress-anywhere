const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const ora = require('ora')
const ui = require('cliui')({ width: 100 })
const tinify = require('tinify')
const dayjs = require('dayjs')
const { mkdirsSync, makeRow } = require('./utils')

const supportExts = ['png', 'jpg', 'jpeg', 'webp'] // 支持文件拓展名

class TinifyCompress {
  copyTime = '' // 拷贝时间
  tinifyQueue = [] // 待压缩队列

  /**
   * @param {string} apiKey 注册https://tinify.com/dashboard/api，提供的apiKey
   * @param {string} sourceDirName 资源文件目录名
   * @param {string} outputDirName 输出文件目录名
   * @param {string} copyDirName 拷贝文件目录名
   * @param {boolean} coverSelf 覆盖自身
   */
  constructor({ apiKey, sourceDirName = 'source', outputDirName = 'output', copyDirName, coverSelf = false }) {
    if (!apiKey) {
      throw new Error('请传入tinify对应授权apiKey') // 没传apiKey，直接抛出异常，中断执行
    }
    tinify.key = apiKey
    this.sourceDirName = sourceDirName
    this.outputDirName = outputDirName
    this.copyDirName = copyDirName
    this.coverSelf = coverSelf
  }

  /**
   * 获取待压缩队列
   * @param string originPath 待压缩目录根路径
   */
  getTinifyQueue(originPath) {
    fs.readdirSync(originPath, { withFileTypes: true }).forEach(dirent => {
      if (dirent.isDirectory()) {
        this.getTinifyQueue(path.join(originPath, '/', dirent.name)) // 递归子目录
      } else if (dirent.isFile()) {
        const sourcePath = path.join(originPath, '/', dirent.name)

        // 目前只支持这几种拓展名，官方说明：Convert your images to other formats, like WebP, JPG or PNG. For more information read here.
        const extname = path.extname(sourcePath)
        if (!supportExts.includes(extname.replace('.', ''))) {
          return
        }

        this.copy(sourcePath) // 拷贝文件

        const filePath = path.join(this.coverSelf ? sourcePath : `${this.outputDirName}/${sourcePath.replace(path.join(this.sourceDirName), '')}`)
        mkdirsSync(path.dirname(filePath)) // 未创建目录，先创建目录

        // 放入待压缩队列
        this.tinifyQueue.push(this.compress(sourcePath, filePath))
      }
    })
  }

  /**
   * 压缩文件
   * @param {string} sourcePath 原始文件
   * @param {string} filePath 生成文件
   * @returns 
   */
  compress(sourcePath, filePath) {
    return new Promise(resolve => {
      const originSize = fs.statSync(sourcePath).size // 获取原始文件大小
      // console.log(`${sourcePath}压缩前: ${(originSize / 1024).toFixed(2)}kb.`)

      const source = tinify.fromFile(sourcePath) // 读取上传文件
      source.toFile(filePath, () => {
        const currentSize = fs.statSync(filePath).size // 获取原始文件大小
        // console.log(`${sourcePath} 压缩前:` + `${(originSize / 1024).toFixed(2)}kb`.green + ` 压缩后:`, `${(currentSize / 1024).toFixed(2)}kb`.green, ` 压缩比:`, `${((1 - currentSize / originSize) * 100).toFixed(2)}%`.green)

        resolve(makeRow(
          chalk.green(sourcePath),
          `${(originSize / 1024).toFixed(2)}kb`,
          `${(currentSize / 1024).toFixed(2)}kb`,
          `${((1 - currentSize / originSize) * 100).toFixed(2)}%`
        ))
      })
    })
  }

  /**
   * 拷贝文件
   * @param {string} sourcePath 原始文件
   */
  copy(sourcePath) {
    if (this.copyDirName) {
      const copyPth = path.join(`${this.copyDirName}/${this.copyTime}/${sourcePath.replace(path.join(this.sourceDirName), '')}`)
      mkdirsSync(path.dirname(copyPth)) // 未创建目录，先创建目录
      fs.copyFileSync(sourcePath, copyPth)
    }
  }

  /**
   * 批量压缩待压缩队列
   * @param string originPath 待压缩目录根路径
   */
  async batchTinifyQueue(originPath) {
    this.getTinifyQueue(originPath) // 获取待压缩队列

    if (!this.tinifyQueue.length) {
      throw new Error('待压缩列表为空')
    }

    console.log(chalk.green('\n开始压缩：', dayjs().format('YYYY-MM-DD HH:mm:ss')), '\n')

    const spinner = ora('压缩中...').start()
    spinner.start()

    Promise.all(this.tinifyQueue)
      .then(rows => {
        spinner.stop()
        ui.div(
          makeRow(
            chalk.cyan.bold(`File`),
            chalk.cyan.bold(`originSize`),
            chalk.cyan.bold(`currentSize`),
            chalk.cyan.bold(`ratio`)
          ) + `\n` + rows.join(`\n`)
        )
        console.log(ui.toString() + '\n')
        console.log('压缩完成：', dayjs().format('YYYY-MM-DD HH:mm:ss'), ` 共压缩了${chalk.green(this.tinifyQueue.length)}个文件`)
      }).catch(err => {
        console.log(chalk.red('压缩出错：', dayjs().format('YYYY-MM-DD HH:mm:ss')))
        console.log(err)
      })
  }

  /**
   * 开始压缩
   */
  start(originPath) {
    if (originPath)
      this.sourceDirName = originPath

    // 重置队列
    this.tinifyQueue = []
    this.copyTime = dayjs().format('YYYYMMDDHHmmss') // 记录拷贝时间
    this.batchTinifyQueue(this.sourceDirName)
  }
}

module.exports = TinifyCompress // 暴露外部实例

// // 参考
// const tinifyObj = new TinifyCompress({
//   apiKey: 'HvBn96BtgJK1SXPb4QCYYF0CMxxHN3wv',
//   // copyDirName: 'copyNew',
//   // outputDirName: 'outputNew',
//   // coverSelf: true
// }) // 初始化实例
// tinifyObj.start('input/test') // 压缩

