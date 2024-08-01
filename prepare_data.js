#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')
const async = require('async')
const ArgumentParser = require('argparse').ArgumentParser
const OverpassFrontend = require('overpass-frontend')
const loadStyleFile = require('./src/loadStyleFile')

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

const options = parser.parse_args()

const overpassFrontend = new OverpassFrontend(options.source)

loadStyleFile(options, (err, data) => {
  if (err) {
    return console.error(err)
  }

  const features = []
  async.each(data.layers, (layer, done) => {
    overpassFrontend.BBoxQuery(
      layer.query,
      layer.bbox,
      {
        properties: OverpassFrontend.ALL
      },
      (err, item) => {
        const twigData = {
          tags: item.tags
        }

        const geojson = item.GeoJSON()
        geojson.properties = {color: '#00ff00'}
        features.push(geojson)
      },
      (err) => {
        done(err)
      }
    )
  }, (err) => {
    console.error(err)
    fs.writeFileSync('data.geojson', JSON.stringify({
      type: 'FeatureCollection',
      features
    }))
  })
})
