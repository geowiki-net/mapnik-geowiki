const isTrue = require('./isTrue')

module.exports = function twigCompile (str, fieldConfig = {}) {
  let result

  if (typeof str === 'string' && str.includes('{')) {
    result = 'twigRender(' + JSON.stringify(str) + ', data)'

    switch (fieldConfig.type) {
      case 'boolean':
        result = 'isTrue(' + result + ')'
        break
    }

    if (fieldConfig.valueMapping) {
      result = 'valueMap(' + result + ', ' + JSON.stringify(fieldConfig.valueMapping) + ')'
    }
  } else {
    switch (fieldConfig.type) {
      case 'boolean':
        result = isTrue(str) ? 'true' : 'false'
        break
      default:
        if (fieldConfig.valueMapping) {
          str = str in fieldConfig.valueMapping ? fieldConfig.valueMapping[str] : str
        }

        result = JSON.stringify(str)
    }
  }

  return result
}
