const defaultStyle = require('./defaultStyle.json')
const fieldConfig = require('./fieldConfig.json')

module.exports = function getStyleFieldValues (layers, options) {
  const fieldValues = {}

  layers.forEach(layer => {
    Object.keys(layer.feature ?? {})
      .filter(styleId => styleId === 'style' || styleId.match(/^style:/))
      .forEach(styleId => {
        const style = { ...defaultStyle, ...layer.feature[styleId] }

        Object.entries(style).forEach(([k, v]) => {
          const fConfig = fieldConfig[k] ?? {}

          if (!(k in fieldValues)) {
            fieldValues[k] = []
          }

          let value = typeof v === 'string' && v.includes('{') ? undefined : v
          if (fConfig.valueMapping) {
            value = value in fConfig.valueMapping ? fConfig.valueMapping[value] : value
          }

          if (!fieldValues[k].includes(value)) {
            fieldValues[k].push(value)
          }
        })
      })
  })

  return fieldValues
}
