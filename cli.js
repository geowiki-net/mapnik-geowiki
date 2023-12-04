#!/usr/bin/env node
const fs = require('fs')
const yaml = require('js-yaml')
const ArgumentParser = require('argparse').ArgumentParser
const compile = require('./src/compile')

const parser = new ArgumentParser({
  add_help: true,
  description: 'Convert a geowiki stylesheet into a Mapnik stylesheet'
})

parser.add_argument('filename', {
  help: 'The geowiki stylesheet to compile, e.g. "file.yaml"'
})

const args = parser.parse_args()

const options = {
  id: 'example'
}

fs.readFile(args.filename, (err, body) => {
  if (err) {
    return console.error(err)
  }

  const data = yaml.load(body)
  const stylesheet = compile(data, options)

  const filename = options.id + '.xml'
  console.log('create ' + filename)
  fs.writeFileSync(filename, stylesheet)
})
