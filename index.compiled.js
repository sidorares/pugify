'use strict';

var pug = require('pug');
var xtend = require('xtend');
var through = require('through');
var convert = require('convert-source-map');
var tools = require('browserify-transform-tools');
var SourceMapGenerator = require('source-map').SourceMapGenerator;

var defaultOptions = {
  pretty: false,
  compileDebug: true
};

// RegEx
var FILE_EXTENSION_REGEX = /\.(pug|jade)$/;
var LINE_NUMBER_REGEX = /^;jade_debug_line = ([0-9]+)/;

function generateSourceMaps(src, compiled, file) {
  var lines = compiled.split('\n');
  var generator = new SourceMapGenerator({ file: file + '.js' });

  lines.forEach(function (line, num) {
    var match = line.match(LINE_NUMBER_REGEX);
    if (!match || match[1] < 1) return;

    generator.addMapping({
      source: file,
      generated: { column: 0, line: num + 2 },
      original: { column: 0, line: Number(match[1]) }
    });
  });

  generator.setSourceContent(file, src);

  var map = convert.fromJSON(generator.toString());
  lines.push(map.toComment());

  return lines.join('\n');
}

function pugify(file, opts) {
  if (!FILE_EXTENSION_REGEX.test(file)) return through();

  var buffer = '';

  return through(function (chunk) {
    return buffer += chunk.toString();
  }, function end() {
    var _this = this;

    // Load config from package.json
    tools.loadTransformConfig('pugify', file, function (err, data) {
      if (err) throw new Error(err);else opts = xtend(defaultOptions, opts || {}, data ? data.config : {});

      var parsed = undefined,
          sourceMapped = undefined;

      try {
        parsed = pug.compile(buffer, opts);
        sourceMapped = generateSourceMaps(buffer, parsed.toString(), file);
      } catch (e) {
        _this.emit('error', e);
        return _this.queue(null);
      }

      parsed.dependencies.forEach(function (dep) {
        return _this.emit('file', dep);
      });

      _this.queue('var jade=require(\'pug-runtime\');module.exports=' + sourceMapped);
      _this.queue(null);
    });
  });
}

// Return new transform with custom options
pugify.configure = function (userOptions) {
  return function (file, opts) {
    return pugify(file, xtend(opts, userOptions));
  };
};

module.exports = pugify;

