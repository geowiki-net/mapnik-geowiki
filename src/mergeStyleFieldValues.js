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

  return result
}
