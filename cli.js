#!/usr/bin/env node
const ArgumentParser = require('argparse').ArgumentParser
const mapnikGeowiki = require('./src/app.js')

const parser = new ArgumentParser({
  add_help: true,
  description: 'Render a Geowiki stylesheet with Mapnik to an image'
})

parser.add_argument('--style', '-S', {
  help: 'The geowiki stylesheet to compile, e.g. "file.yaml"',
  default: 'default.yaml'
})

parser.add_argument('--id', '-i', {
  help: 'The ID to use. By default, the filename without extension will be used.',
  default: null
})

parser.add_argument('--source', '-s', {
  help: 'OpenStreetMap source, may be an Overpass API or a .osm file',
  default: '//overpass-api.de/api/interpreter'
})

parser.add_argument('--schema', {
  help: 'When calling the SQL functions, append the optional schema.',
  default: null
})

parser.add_argument('--bbox', '-b', {
  help: 'Render map in this bounding box (lat,lon,lat,lon)'
})

parser.add_argument('--center', '-c', {
  help: 'Center map on this coordinate (lat,lon)'
})

parser.add_argument('--size', {
  help: 'Render map in this final output size (e.g. 1920x1080) (Attention: SVG is using pt, so output seems 25% larger)'
})

parser.add_argument('--margin', {
  help: 'Increase the final output size by n pixels to either side by increasing the bounding box accordingly (e.g. "200" resp. "200x300").'
})

parser.add_argument('--zoom', '-z', {
  help: 'Render map for this zoom level'
})

parser.add_argument('--output', '-o', {
  help: 'Output image file (default: image.svg)',
  default: 'image.svg'
})

parser.add_argument('--language', '-l', {
  help: 'Which translation to use (default: en), e.g. "de" or "pt-br".',
  default: 'en'
})

parser.add_argument('--parameters', {
  help: 'Additional parameters as JSON object which can be evaluated in twig templates by using "{{ parameters. }}".',
  default: 'null'
})

const options = parser.parse_args()

options.parameters = JSON.parse(options.parameters)

mapnikGeowiki(options, function (err) {
  if (err) {
    console.error(err.message)
    process.exit(1)
  }
})
