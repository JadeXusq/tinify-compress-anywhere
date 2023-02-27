#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const colors = require('colors')
const { program } = require('commander');
const tinify = require('tinify')
const TinifyCompress = require('./TinifyCompress')

const { userArgs } = require('./utils')
const { version } = require('./package.json')

const keyFile = path.join(__dirname, '/key.js')
const localKey = require('./key.js')
tinify.key = localKey

// 初始化命令行
program
  .version(version)
  .option('-s, --source <source>', 'source folder')
  .option('-o, --output <output>', 'output folder')
  .option('-c, --copy <copy>', 'copy folder')

switch (userArgs[0]) {
  // 设置用户自己的授权apiKey
  case 'setKey':
    const apiKey = userArgs[1]
    if (!apiKey) {
      console.log('apiKey不能为空！'.red)
      console.log(colors.yellow('获取地址：https://tinify.com/dashboard/api'))
      process.exit(1)
    }

    fs.writeFile(keyFile, `module.exports = '${apiKey}'`, err => {
      if (err) return console.log(err)
      console.log(colors.green(`apiKey已修改为：${apiKey}`))
      process.exit(1)
    })
    break

  // 查看apiKey对应配额信息
  case 'count':
    tinify.validate(err => {
      if (err) {
        console.log('Your apiKey is not yet set, or it\'s invalid'.red)
      } else {
        console.log(`The key ${localKey} has optimized ${tinify.compressionCount} images this month, max number of free images is 500`.green)
      }
      process.exit(1)
    })
    break

  default:
    program.parse()
    const options = program.opts();
    const sourceDirName = options.source || './source'
    const outputDirName = options.output || './output'
    const copyDirName = options.copy

    // 初始化实例
    const tinifyObj = new TinifyCompress({
      apiKey: localKey,
      copyDirName,
      outputDirName,
      sourceDirName,
      // coverSelf: true
    })
    tinifyObj.start() // 启动压缩
    break
}