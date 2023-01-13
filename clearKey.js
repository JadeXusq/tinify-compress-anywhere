const fs = require('fs')
const path = require('path')

const keyFile = path.join(__dirname, '/key.js')

fs.writeFileSync(keyFile, `module.exports = ''`) // 清空key