#!/usr/bin/env node
const fs = require('fs')
const yaml = require('js-yaml')
const compile = require('./src/compile')

fs.readFile('example.yaml', (err, body) => {
  if (err) {
    return console.error(err)
  }

  const data = yaml.load(body)
  const stylesheet = compile(data)
  console.log(stylesheet)
})
