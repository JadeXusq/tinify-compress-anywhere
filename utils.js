const fs = require('fs')
const path = require('path')

/**
 * 递归创建目录 同步方法
 * @param {string} dirname 目录名
 * @returns 
 */
const mkdirsSync = (dirname) => {
  if (fs.existsSync(dirname)) {
    return true;
  } else {
    if (mkdirsSync(path.dirname(dirname))) {
      fs.mkdirSync(dirname);
      return true;
    }
  }
}

/**
 * 获取用户输入
 */
const userArgs = process.argv.slice(2);

const makeRow = (a, b, c, d) => {
  return ` ${a}\t ${b}\t ${c}\t ${d}\n`
}


module.exports = {
  mkdirsSync,
  userArgs,
  makeRow
}