#!/usr/bin/env node
const fs = require('fs')
const yaml = require('js-yaml')
const compile = require('./src/compile')

const options = {
  id: 'example'
}

fs.readFile('example.yaml', (err, body) => {
  if (err) {
    return console.error(err)
  }

  const data = yaml.load(body)
  const stylesheet = compile(data, options)

  const filename = options.id + '.xml'
  console.log('create ' + filename)
  fs.writeFileSync(filename, stylesheet)
})
