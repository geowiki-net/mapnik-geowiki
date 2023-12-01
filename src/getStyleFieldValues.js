const defaultStyle = require('./defaultStyle.json')

module.exports = function getStyleFieldValues (layers) {
  const fieldValues = {}
  const templateFields = []

  layers.forEach(layer => {
    Object.keys(layer.feature ?? {})
      .filter(styleId => styleId === 'style' || styleId.match(/^style:/))
      .forEach(styleId => {
        const style = { ...defaultStyle, ...layer.feature[styleId] }

        Object.entries(style).forEach(([k, v]) => {
          if (!(k in fieldValues)) {
            fieldValues[k] = []
          }

          const value = typeof v === 'string' && v.includes('{') ? undefined : v
          if (!fieldValues[k].includes(value)) {
            fieldValues[k].push(value)
          }
        })
      })
  })

  return fieldValues
}
