const isTrue = require('./isTrue')

const defaultStyle = {
  "width": "3",
  "color": "#3388ff",
  "fillColor": "#3388ff",
  "fill": true,
  "stroke": true,
  "gamma": 1,
  "fillOpacity": 0.3,
  opacity: 1.0,
  lineCap: 'round',
  lineJoin: 'round',
  smoothFactor: 1,
  dashArray: '',
  compositingOperation: ''
}

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

module.exports = function style2mapnik (style) {
  let result = ''

  style = { ...defaultStyle, ...style }

  if (isTrue(style.fill)) {
    result += '<PolygonSymbolizer'

    Object.entries(valueMappingPolygon).forEach(([ mK, gK ]) => {
      if (style[gK] !== '') {
        result += ` ${mK}="` + style[gK] + '"'
      }
    })

    result += '/>'
  }

  if (isTrue(style.stroke)) {
    result += '<LineSymbolizer'

    Object.entries(valueMappingLine).forEach(([ mK, gK ]) => {
      if (style[gK] !== '') {
        result += ` ${mK}="` + style[gK] + '"'
      }
    })

    result += '/>'
  }

  return result
}
