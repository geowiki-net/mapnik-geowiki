module.exports = function twigCompile (str) {
  if (typeof str === 'string' && str.includes('{')) {
    return 'twigRender(' + JSON.stringify(str) + ', data)'
  } else {
    return JSON.stringify(str)
  }
}
