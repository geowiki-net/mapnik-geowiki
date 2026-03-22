const fs = require('fs')

module.exports = {
  id: 'loadStyleCurrentPath',
  appInit: (app) => {
    app.on('get-style', (id, promises) => {
      promises.push(new Promise((resolve, reject) => {
        fs.readFile(id, (err, data) => {
          if (err) { return reject(err) }

          resolve({ id, data })
        })
      }))
    })
  }
}
