'use strict';

var _pug = require('pug');

var _pug2 = _interopRequireDefault(_pug);

var _xtend = require('xtend');

var _xtend2 = _interopRequireDefault(_xtend);

var _through = require('through');

var _through2 = _interopRequireDefault(_through);

var _convertSourceMap = require('convert-source-map');

var _convertSourceMap2 = _interopRequireDefault(_convertSourceMap);

var _browserifyTransformTools = require('browserify-transform-tools');

var _browserifyTransformTools2 = _interopRequireDefault(_browserifyTransformTools);

var _sourceMap = require('source-map');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// RegEx
var FILE_EXTENSION_REGEX = /\.(pug|jade)$/;
var LINE_NUMBER_REGEX = /^;jade_debug_line = ([0-9]+)/;

function pugify(file) {
  var opts = this || {};

  if (!FILE_EXTENSION_REGEX.test(file)) return (0, _through2.default)();

  var buffer = '';

  return (0, _through2.default)(function (chunk) {
    return buffer += chunk.toString();
  }, function end() {
    var _this = this;

    // Load config from package.json
    _browserifyTransformTools2.default.loadTransformConfig('pugify', file, function (err, data) {
      if (err) throw new Error(err);

      var parsed = undefined,
          sourceMapped = undefined;

      try {
        parsed = _pug2.default.compile(buffer, (0, _xtend2.default)(opts, data ? data.config : {}));
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

function generateSourceMaps(src, compiled, file) {
  var lines = compiled.split('\n');
  var generator = new _sourceMap.SourceMapGenerator({ file: file + '.js' });

  lines.forEach(function (line, i) {
    var match = line.match(LINE_NUMBER_REGEX);
    if (!match || match[1] < 1) return;

    generator.addMapping({
      source: file,
      generated: { column: 0, line: i + 2 },
      original: { column: 0, line: Number(match[1]) }
    });
  });

  generator.setSourceContent(file, src);

  var map = _convertSourceMap2.default.fromJSON(generator.toString());
  lines.push(map.toComment());

  return lines.join('\n');
}

module.exports = function (opts) {
  return pugify.bind((0, _xtend2.default)({
    // Default options
    pretty: true,
    compileDebug: true
  }, opts));
};

