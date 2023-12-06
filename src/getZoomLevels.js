module.exports = function getZoomLevels (layers, options) {
  const zoomLevels = {}

  layers.forEach(layer => {
    if (typeof layer.query === 'string') {
      zoomLevels[0] = true
    } else {
      Object.keys(layer.query).forEach(z => {
        zoomLevels[z] = true
      })
    }
  })

  return Object.keys(zoomLevels)
}
