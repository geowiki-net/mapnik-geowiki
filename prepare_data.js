#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')
const async = require('async')
const ArgumentParser = require('argparse').ArgumentParser
const OverpassFrontend = require('overpass-frontend')
const loadStyleFile = require('./src/loadStyleFile')
const evaluate = require('./src/evaluate')

const parser = new ArgumentParser({
  add_help: true,
  description: 'Convert a geowiki stylesheet into a Mapnik stylesheet'
})

parser.add_argument('filename', {
  help: 'The geowiki stylesheet to compile, e.g. "file.yaml"'
})

parser.add_argument('--id', '-i', {
  help: 'The ID to use. By default, the filename without extension will be used.',
  default: null
})

parser.add_argument('--source', '-s', {
  help: 'OpenStreetMap source, may be an Overpass API or a .osm file',
  default: '//overpass-api.de/api/interpreter'
})

parser.add_argument('--bbox', '-b', {
  help: 'Render map in this bounding box (lat,lon,lat,lon)'
})

const options = parser.parse_args()

const overpassFrontend = new OverpassFrontend(options.source)
if (options.bbox) {
  const b = options.bbox.split(',')
  options.bbox = {
    minlat: b[0],
    minlon: b[1],
    maxlat: b[2],
    maxlon: b[3]
  }
}

loadStyleFile(options, (err, data) => {
  if (err) {
    return console.error(err)
  }

  async.map(data.layers, (layerOptions, done) => {
    layerOptions.overpassFrontend = overpassFrontend
    evaluate(layerOptions, done)
  }, (err, result) => {
    const features = [...result]
    console.error(err)
    console.log(features)
    fs.writeFileSync('data.geojson', JSON.stringify({
      type: 'FeatureCollection',
      features
    }))
  })
})
