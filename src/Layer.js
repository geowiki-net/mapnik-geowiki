const twigCompile = require('./twigCompile')
const compileQuery = require('./compileQuery')

const defaultStyle = require('./defaultStyle.json')
const fieldConfig = require('./fieldConfig.json')

module.exports = class Layer {
  constructor (id, layer, globalData, options) {
    this.id = id
    this.layer = layer
    this.globalData = globalData
    this.options = options
    this.setDefaultConfig()
  }

  setDefaultConfig () {
    if (!this.layer.feature) {
      this.layer.feature = {}
    }

    if (!this.layer.feature.style) {
      this.layer.feature.style = {}
    }

    for (let k in this.layer.feature) {
      if (k === 'style' || k.match(/^style:/)) {
        this.layer.feature[k] = { ...defaultStyle, ...this.layer.feature[k] }
      }
    }
  }

  zoomLevelActive (zoom) {
    if (typeof this.layer.query === 'string') {
      return true
    }

    if (Object.keys(this.layer.query).filter(z => z <= zoom).length) {
      return true
    }
  }

  getStyleFieldValues () {
    return mergeStyleFieldValues(this.featureDescriptors().map(featureId =>
      this.getFeatureStyleFieldValues(this.layer[featureId])
    ))
  }

  getFeatureStyleFieldValues (feature) {
    const fieldValues = {}

    Object.keys(feature)
      .filter(styleId => styleId === 'style' || styleId.match(/^style:/))
      .forEach(styleId => {
        const style = feature[styleId]

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

    return fieldValues
  }
}
