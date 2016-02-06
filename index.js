'use strict'

const pug = require('pug')
const xtend = require('xtend')
const through = require('through')

function pugify (file) {
  const opts = this || {}

  if (!/\.(pug|jade)$/.test(file)) return through()

  let buffer = ''

  return through(
    chunk => buffer += chunk.toString(),
    function end () {
      let parsed

      try {
        parsed = pug.compile(buffer, opts)
      } catch (e) {
        this.emit('error', e)
        return this.queue(null)
      }

      parsed.dependencies.forEach(dep => this.emit('file', dep))

      this.queue(`var jade=require('pug-runtime');module.exports=${parsed.toString()}`)
      this.queue(null)
    }
  )
}

module.exports = (opts) => pugify.bind(xtend({
  // Default options
  pretty: true,
  compileDebug: true
}, opts))
