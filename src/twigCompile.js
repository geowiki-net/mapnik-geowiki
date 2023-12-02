const isTrue = require('./isTrue')

module.exports = function twigCompile (str, type = 'text') {
  if (typeof str === 'string' && str.includes('{')) {
    const result = 'twigRender(' + JSON.stringify(str) + ', data)'

    switch (type) {
      case 'boolean':
        return 'isTrue(' + result + ')'
      default:
        return result
    }
  } else {
    switch (type) {
      case 'boolean':
        return isTrue(str) ? 'true' : 'false'
      default:
        return JSON.stringify(str)
    }
  }
}
