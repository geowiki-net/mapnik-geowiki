const fs = require('fs')
const { logMessage } = require('@geowiki-net/geowiki-lib-modules')

module.exports = {
  id: 'tmpDir',
  appInit: (app, callback) => {
    if (!app.config.tmpDir) {
      app.config.tmpDir = '/tmp/mapnik-geowiki-' + process.pid
    }

    fs.stat(app.config.tmpDir, (err, data) => {
      if (err && err.code === 'ENOENT') {
        logMessage('Creating temporary directory:' + app.config.tmpDir)
        return fs.mkdir(app.config.tmpDir, callback)
      }
      if (err) {
        return callback(err)
      }

      logMessage('Using temporary directory:' + app.config.tmpDir)
      callback(null)
    })
  }
}
