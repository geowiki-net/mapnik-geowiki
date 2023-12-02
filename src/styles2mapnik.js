const isTrue = require('./isTrue')

const SymbolizerConf = require('./mapnikSymbolizer.json')

function mightTrue (values) {
  return values
    .map(v => v === undefined || isTrue(v))
    .includes(true)
}

function mightFalse (values) {
  return values
    .map(v => v === undefined || !isTrue(v))
    .includes(true)
}

module.exports = function styles2mapnik (layers, styleFieldValues) {
  let result = ''

  Object.entries(SymbolizerConf).forEach(([symbolizer, conf]) => {
    if (mightTrue(styleFieldValues[conf.filterField])) {
      result += '<Rule>\n'
      if (mightFalse(styleFieldValues[conf.filterField])) {
        result += `<Filter>[${conf.filterField}] = true or [${conf.filterField}] = "true"</Filter>`
      }
      result += '<' + symbolizer
      result += compileParameter(styleFieldValues, conf.fieldMapping)
      result += '/>\n'
      result += '</Rule>\n'
    }
  })

  return result
}

function compileParameter (style, def) {
  let result = ''

  Object.entries(def).forEach(([mK, gK]) => {
    if (style[gK].length > 1 || style[gK].includes(undefined)) {
      const escField = gK.replace('-', '_')
      result += ` ${mK}="[${escField}]"`
    } else if (style[gK][0] !== '') {
      result += ` ${mK}="` + style[gK][0] + '"'
    }
  })

  return result
}
