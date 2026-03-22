const fs = require('fs')
const yaml = require('js-yaml')

module.exports = function (app, options, callback) {
  console.log('loadStyle', options)
  app.styleRegistry.get(options.style)
    .then(item => {
      const data = yaml.load(item.data)
      const dataConst = data.const

      if (data.layers) {
        data.layers.forEach(layer => {
          layer.const = dataConst
        })
      } else {
        data.layers = [data]
      }

      callback(null, data)
    })
}
