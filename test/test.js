import fs from 'fs'
import async from 'async'
import assert from 'assert'
import mapnikGeowiki from '../src/app.js'
import test from './src/test.js'

import GeowikiAPI from '@geowiki-net/geowiki-api'

let geowikiAPI

describe('Prepare', function () {
  it('Load database', function (done) {
    this.timeout(20000)
    geowikiAPI = new GeowikiAPI('test/data.osm.bz2')
    geowikiAPI.on('load', () => done())
  })

  it('Check that generated directory exists', function (done) {
    fs.mkdir('test/generated', (err) => {
      if (!err || (err && err.code === 'EEXIST')) {
        return done()
      }

      done(err)
    })
  })

  it('Remove generated images', function (done) {
    this.timeout(20000)
    fs.readdir('test/generated', (err, list) => {
      if (err) { return done(err) }

      if (!list.length) { return done() }

      async.each(list, (item, done) => fs.unlink('test/generated/' + item, done), done)
    })
  })
})

describe('Parameter handling', function () {
  it('center requires zoom', function (done) {
    mapnikGeowiki({
      size: '100x100',
      center: '48.19988,16.33743',
      style: 'test/buildings.yaml',
      source: geowikiAPI,
      output: 'test/generated/p1.png',
    }, function (err, result) {
      if (!err) { done('Should generate error') }
      assert.equal(err.message, 'Parameter --center requires zoom level')
      done()
    })
  })
})

describe('Render from parameters', function () {
  it('Render buildings with bbox', function (done) {
    mapnikGeowiki({
      size: '100x100',
      bbox: '48.19878,16.33585,48.19988,16.33743',
      style: 'test/buildings.yaml',
      source: geowikiAPI,
      output: 'test/generated/1.png',
    }, function (err, result) {
      if (err) { return done(err) }
      test('1.png', done)
    })
  })

  it('Render buildings with center', function (done) {
    mapnikGeowiki({
      size: '100x100',
      center: '48.19988,16.33743',
      zoom: 16,
      style: 'test/buildings.yaml',
      source: geowikiAPI,
      output: 'test/generated/2.png',
    }, function (err, result) {
      if (err) { return done(err) }
      test('2.png', done)
    })
  })

  it('Render with CircleMarker', function (done) {
    mapnikGeowiki({
      size: '100x100',
      bbox: '48.19878,16.33585,48.19988,16.33743',
      style: 'test/CircleMarker.yaml',
      source: geowikiAPI,
      output: 'test/generated/3.png',
    }, function (err, result) {
      if (err) { return done(err) }
      test('3.png', done)
    })
  })

  it('Render empty image with no buildings in bbox', function (done) {
    mapnikGeowiki({
      size: '100x100',
      center: '45.2,14.3',
      zoom: 16,
      style: 'test/buildings.yaml',
      source: geowikiAPI,
      output: 'test/generated/4.png',
    }, function (err, result) {
      if (err) { return done(err) }
      test('2.png', done)
    })
  })

  it('Render empty image with no query at zoom level', function (done) {
    mapnikGeowiki({
      size: '100x100',
      center: '45.2,14.3',
      zoom: 12,
      style: 'test/buildings.yaml',
      source: geowikiAPI,
      output: 'test/generated/5.png',
    }, function (err, result) {
      if (err) { return done(err) }
      test('2.png', done)
    })
  })

})
