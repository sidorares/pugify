'use strict'

import pug from 'pug'
import xtend from 'xtend'
import through from 'through'
import convert from 'convert-source-map'
import tools from 'browserify-transform-tools'
import { SourceMapGenerator } from 'source-map'

// RegEx
const FILE_EXTENSION_REGEX = /\.(pug|jade)$/
const LINE_NUMBER_REGEX = /^;jade_debug_line = ([0-9]+)/

function pugify (file) {
  const opts = this || {}

  if (!FILE_EXTENSION_REGEX.test(file)) return through()

  let buffer = ''

  return through(
    chunk => buffer += chunk.toString(),
    function end () {
      // Load config from package.json
      tools.loadTransformConfig('pugify', file, (err, data) => {
        if (err) throw new Error(err)

        let parsed, sourceMapped

        try {
          parsed = pug.compile(buffer, xtend(opts, data ? data.config : {}))
          sourceMapped = generateSourceMaps(buffer, parsed.toString(), file)
        } catch (e) {
          this.emit('error', e)
          return this.queue(null)
        }

        parsed.dependencies.forEach(dep => this.emit('file', dep))

        this.queue(`var jade=require('pug-runtime');module.exports=${sourceMapped}`)
        this.queue(null)
      })
    }
  )
}

function generateSourceMaps (src, compiled, file) {
  const lines = compiled.split('\n')
  const generator = new SourceMapGenerator({ file: `${file}.js` })

  lines.forEach((line, i) => {
    const match = line.match(LINE_NUMBER_REGEX)
    if (!match || match[1] < 1) return

    generator.addMapping({
      source: file,
      generated: { column: 0, line: i + 2 },
      original: { column: 0, line: Number(match[1]) }
    })
  })

  generator.setSourceContent(file, src)

  const map = convert.fromJSON(generator.toString())
  lines.push(map.toComment())

  return lines.join('\n')
}

module.exports = (opts) => pugify.bind(xtend({
  // Default options
  pretty: true,
  compileDebug: true
}, opts))
