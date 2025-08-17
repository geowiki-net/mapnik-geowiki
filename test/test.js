import fs from 'fs'
import async from 'async'
import mapnikGeowiki from '../src/app.js'
import test from './src/test.js'

describe('Prepare', function () {
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

describe('Render from parameters', function () {
  it('Render buildings', function (done) {
    this.timeout(20000)
    mapnikGeowiki({
      size: '100x100',
      bbox: '48.19878,16.33585,48.19988,16.33743',
      style: 'test/buildings.yaml',
      source: 'test/data.osm.bz2',
      output: 'test/generated/1.svg',
    }, function (err, result) {
      if (err) { return done(err) }
      test('1.svg', done)
    })
  })
})
