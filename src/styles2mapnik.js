const isTrue = require('./isTrue')

const defaultStyle = require('./defaultStyle.json')

const valueMappingPolygon = {
  fill: 'fillColor',
  'fill-opacity': 'fillOpacity',
  gamma: 'gamma',
  'comp-op': 'compositingOperation'
}

const valueMappingLine = {
  stroke: 'color',
  'stroke-width': 'width',
  'stroke-opacity': 'opacity',
  'stroke-linejoin': 'lineJoin',
  'stroke-linecap': 'lineCap',
  'stroke-dasharray': 'dashArray',
  'comp-op': 'compositingOperation',
  smooth: 'smoothFactor'
}

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

  if (mightTrue(styleFieldValues.fill)) {
    result += '<Rule>\n'
    if (mightFalse(styleFieldValues.fill)) {
      result += '<Filter>[fill] = true</Filter>'
    }
    result += '<PolygonSymbolizer'
    result += compileParameter(styleFieldValues, valueMappingPolygon)
    result += '/>\n'
    result += '</Rule>\n'
  }

  if (mightTrue(styleFieldValues.stroke)) {
    result += '<Rule>\n'
    if (mightFalse(styleFieldValues.stroke)) {
      result += '<Filter>[stroke] = true</Filter>'
    }
    result += '<LineSymbolizer'
    result += compileParameter(styleFieldValues, valueMappingLine)
    result += '/>'
    result += '</Rule>\n'
  }

  return result
}

function compileParameter (style, def) {
  let result = ''

  Object.entries(def).forEach(([ mK, gK ]) => {
    if (style[gK].length > 1 || style[gK].includes(undefined)) {
      const escField = gK.replace('-', '_')
      result += ` ${mK}="[${escField}]"`
    } else if (style[gK][0] !== '') {
      result += ` ${mK}="` + style[gK][0] + '"'
    }
  })

  return result
}
