import mapnikGeowiki from '../src/app.js'
import test from './src/test.js'

//describe('Clear', function () {
//  it('Remove generated images', function (done) {
//  })
//})

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
