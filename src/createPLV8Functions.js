const fs = require('fs')
const browserify = require('browserify')
const async = require('async')

module.exports = function createPLV8Functions (functions, callback) {
  async.mapValues(functions, (fun, i, done) => {
    fs.writeFile('_tmp' + i + '.js', fun, (err) => {
      if (err) { return done(err) }
      const b = browserify('_tmp' + i + '.js', { standalone: 'Test' })
      b.bundle((err, buf) => {
        if (err) { return done(err) }

        const str = `
create or replace function Test_layer${i}(type text, id bigint, tags json)
  returns json as $$` + buf.toString() + '\n' +
        'return Test.layer' + i + '(type, id, tags)\n' +
        '$$ language plv8 IMMUTABLE STRICT;'

        done(null, str)
      })
    })
  },
  (err, list) => {
    if (err) { return callback(err) }

    callback(null, Object.values(list).join('\n'))
  })
}
