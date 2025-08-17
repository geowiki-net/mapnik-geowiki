const async = require('async')
const fs = require('fs')
const assert = require('assert')

module.exports = function test (filename, callback) {
  async.parallel({
    expected: (done) => fs.readFile('test/data/' + filename, done),
    actual: (done) => fs.readFile('test/generated/' + filename, done),
  }, (err, result) => {
    if (err) { return callback(err) }
    assert.equal(result.actual.toString(), result.expected.toString())
    callback()
  })
}
