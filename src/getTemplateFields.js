module.exports = function getTemplateFields (layers) {
  const fields = {}

  layers.forEach(layer => {
    Object.keys(layer.feature ?? {})
      .filter(styleId => styleId === 'style' || styleId.match(/^style:/))
      .forEach(styleId => {
        const style = layer.feature[styleId]
        Object.entries(style).forEach(([f, v]) => {
          console.log(styleId, f, v)
          if (typeof v === 'string' && v.includes('{')) {
            fields[f] = true
          }
        })
      })
  })

  return Object.keys(fields)
}
