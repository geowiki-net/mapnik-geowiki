const fs = require('fs')
const browserify = require('browserify')
const async = require('async')

module.exports = function createPLV8Functions (functions, options, callback) {
  async.mapValues(functions, (fun, i, done) => {
    fs.writeFile('_tmp' + i + '.js', fun, (err) => {
      if (err) { return done(err) }
      const b = browserify('_tmp' + i + '.js', { standalone: 'Test' })
      b.bundle((err, buf) => {
        if (err) { return done(err) }

        const funcname = options.id + '_layer_' + i
        const str = `
create or replace function ${funcname}(type text, id bigint, tags json, map json)
  returns json[] as $$` + buf.toString() + '\n' +
        'return Test.layer' + i + '(type, id, tags, map)\n' +
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
