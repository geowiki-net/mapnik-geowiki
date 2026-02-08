const fs = require('fs')

module.exports = {
  id: 'tmpDir',
  appInit: (app, callback) => {
    if (!app.config.tmpDir) {
      app.config.tmpDir = '/tmp/mapnik-geowiki-' + process.pid
    }

    fs.stat(app.config.tmpDir, (err, data) => {
      if (err && err.code === 'ENOENT') {
        console.log('Creating temporary directory', app.config.tmpDir)
        return fs.mkdir(app.config.tmpDir, callback)
      }
      if (err) {
        return callback(err)
      }

      console.log('Using temporary directory', app.config.tmpDir)
    })
  }
}
