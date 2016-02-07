'use strict'

const pug = require('pug')
const xtend = require('xtend')
const through = require('through')
const convert = require('convert-source-map')
const tools = require('browserify-transform-tools')
const SourceMapGenerator = require('source-map').SourceMapGenerator

const defaultOptions = {
  pretty: false,
  compileDebug: true
}

// RegEx
const FILE_EXTENSION_REGEX = /\.(pug|jade)$/
const LINE_NUMBER_REGEX = /^;jade_debug_line = ([0-9]+)/

function generateSourceMaps (src, compiled, file) {
  const lines = compiled.split('\n')
  const generator = new SourceMapGenerator({ file: `${file}.js` })

  lines.forEach((line, num) => {
    const match = line.match(LINE_NUMBER_REGEX)
    if (!match || match[1] < 1) return

    generator.addMapping({
      source: file,
      generated: { column: 0, line: num + 2 },
      original: { column: 0, line: Number(match[1]) }
    })
  })

  generator.setSourceContent(file, src)

  const map = convert.fromJSON(generator.toString())
  lines.push(map.toComment())

  return lines.join('\n')
}

function pugify (file, opts) {
  if (!FILE_EXTENSION_REGEX.test(file)) return through()

  let buffer = ''

  return through(
    chunk => buffer += chunk.toString(),
    function end () {
      // Load config from package.json
      tools.loadTransformConfig('pugify', file, (err, data) => {
        if (err) throw new Error(err)
        else opts = xtend(defaultOptions, opts || {}, data ? data.config : {})

        let parsed, sourceMapped

        try {
          parsed = pug.compile(buffer, opts)
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

// Return new transform with custom options
pugify.configure = (userOptions) => (file, opts) => pugify(file, xtend(opts, userOptions))

module.exports = pugify
