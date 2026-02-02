const mapnikSymbolizerFunctions = require('./mapnikSymbolizerFunctions.js')

module.exports = function mergeStyleFieldValues (list) {
  const result = {}

  list.forEach(fieldValues => Object.entries(fieldValues).forEach(([k, values]) => {
    if (!(k in result)) {
      result[k] = []
    }

    values.forEach(value => {
      if (!result[k].includes(value)) {
        result[k].push(value)
      }
    })
  }))

  Object.entries(mapnikSymbolizerFunctions).forEach(([key, def]) => {
    if (!def.depend) {
      def.depend = [key]
    }

    let list = [{}]
    def.depend.forEach(k => {
      let newlist = []

      list.forEach(l => {
        result[k].forEach(v => {
          let copy = JSON.parse(JSON.stringify(l))
          copy[k] = v
          newlist.push(copy)
        })
      })

      list = newlist
    })

    result[key] = list.map(p => def.fun(p))
  })

  return result
}
