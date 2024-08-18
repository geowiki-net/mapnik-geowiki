const isTrue = require('./isTrue')

const SymbolizerConf = require('./mapnikSymbolizer.json')
const fieldConfig = require('./fieldConfig.json')

function mightTrue (values) {
  if (!values) { return false }
  return values
    .map(v => v === undefined || isTrue(v))
    .includes(true)
}

function mightFalse (values) {
  return values
    .map(v => v === undefined || !isTrue(v))
    .includes(true)
}

/*
 * @param {object} styleFieldValues list of fields and its possible values. If the field uses expressions, the list will contain 'undefined'.
 */
module.exports = function styles2mapnik (layers, styleFieldValues) {
  let result = ''

  Object.entries(SymbolizerConf).forEach(([symbolizer, conf]) => {
    if (conf.requireField && !(conf.requireField in styleFieldValues)) {
      return
    }

    if (!conf.filterField || mightTrue(styleFieldValues[conf.filterField])) {
      const ruleFieldValues = getRuleFieldValues(conf, styleFieldValues)

      allCombinations(ruleFieldValues).forEach(fieldFilter => {
        result += '<Rule>\n'
        let filter = []
        if (conf.filterField && mightFalse(styleFieldValues[conf.filterField])) {
          filter.push(`([${conf.filterField}] = true or [${conf.filterField}] = "true")`)
        }

        if (fieldFilter.filter.length) {
          filter.push(fieldFilter.filter.join(' and '))
        }

        if (filter.length) {
          filter = filter.join(' and ')
          result += `<Filter>${filter}</Filter>\n`
        }

        result += '<' + symbolizer
        result += compileParameter(styleFieldValues, conf.fieldMapping, fieldFilter.fields)

        if (conf.content) {
          result += `>${conf.content}</${symbolizer}>\n`
        } else {
          result += '/>\n'
        }

        result += '</Rule>\n'
      })
    }
  })

  return result
}

function compileParameter (style, def, filterFields) {
  let result = ''

  Object.entries(def).forEach(([mK, gK]) => {
    if (gK in filterFields) {
      result += ` ${mK}=${filterFields[gK]}`
    } else if (style[gK].length > 1 || style[gK].includes(undefined)) {
      const escField = gK.replace('-', '_')
      result += ` ${mK}="[${escField}]"`
    } else if (style[gK][0] !== '') {
      result += ` ${mK}="` + style[gK][0] + '"'
    }
  })

  return result
}

function getRuleFieldValues (conf, styleFieldValues) {
  const ruleFieldValues = {}

  Object.values(conf.fieldMapping).forEach(field => {
    const fConfig = fieldConfig[field] ?? {}
    if ('values' in fConfig) {
      if (styleFieldValues[field].includes(undefined)) {
        ruleFieldValues[field] = fConfig.values
      } else {
        ruleFieldValues[field] = styleFieldValues[field].filter(v => fConfig.values.includes(v))
      }
    }


    if (fConfig.otherValues) {
      ruleFieldValues[field] = ruleFieldValues[field].concat(styleFieldValues[field])

      if (styleFieldValues[field].includes(undefined) ||
        styleFieldValues[field].filter(v => v !== undefined && !fConfig.values.includes(v)).length) {
        ruleFieldValues[field].push(undefined)
      }
    }
  })

  return ruleFieldValues
}

function allCombinations (ruleFieldValues) {
  if (!Object.keys(ruleFieldValues).length) {
    return [{ filter: [], fields: {} }]
  }

  let result = [{ filter: [], fields: {} }]
  Object.entries(ruleFieldValues).forEach(([field, values]) => {
    const r1 = result
    result = []

    values.forEach(value => {
      r1.forEach(r => {
        if (value === undefined) {
          const s = {}
          s[field] = `"[${field}]"`

          let filter = r.filter
          if (values.length > 1) {
            filter = filter.concat([values
              .filter(v => v !== undefined)
              .map(v => `[${field}] != ` + JSON.stringify(v))
              .join(' and ')
            ])
          }

          result.push({
            filter,
            fields: { ...r.fields, ...s }
          })
        } else {
          const s = {}
          s[field] = JSON.stringify(value)

          let filter = r.filter
          if (values.length > 1) {
            filter = filter.concat([`[${field}] = ` + JSON.stringify(value)])
          }

          result.push({
            filter,
            fields: { ...r.fields, ...s }
          })
        }
      })
    })
  })

  return result
}
