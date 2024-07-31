const fs = require('fs')
const yaml = require('js-yaml')

module.exports = function (options, callback) {
  fs.readFile(options.filename, (err, body) => {
    if (err) { return callback(err) }

    const data = yaml.load(body)

    callback(null, data)
  })
}
