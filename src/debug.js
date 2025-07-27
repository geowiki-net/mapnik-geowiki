import twig from 'twig'

twig.extendFilter('debug', function (value) {
  console.log(value)
  return value
})
