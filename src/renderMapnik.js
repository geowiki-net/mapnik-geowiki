const childProcess = require('child_process')

const BoundingBox = require('boundingbox')

module.exports = function renderMapnik (options, callback) {
  let param = []

  if ('bbox' in options) {
    const bounds = new BoundingBox(options.bbox)
    param = param.concat(['-b', bounds.minlon, bounds.minlat, bounds.maxlon, bounds.maxlat])
  }

  if ('zoom' in options) {
    param.push('-z')
    param.push(options.zoom)
  }

  param.push(options.id + '.xml')
  param.push(options.output)

  const p = childProcess.spawn('nik4', param)

  p.stdout.on('data', data => console.log(data.toString()))
  p.stderr.on('data', data => console.error(data.toString()))
  p.on('close', code => {
    console.log('closed with code ' + code)
    callback(code)
  })
}
