'use strict';

var pug = require('pug');
var xtend = require('xtend');
var through = require('through');
var tools = require('browserify-transform-tools');

function pugify(file) {
  var opts = this || {};

  if (!/\.(pug|jade)$/.test(file)) return through();

  var buffer = '';

  return through(function (chunk) {
    return buffer += chunk.toString();
  }, function end() {
    var _this = this;

    // Load config from package.json
    tools.loadTransformConfig('pugify', file, function (err, data) {
      if (err) throw new Error('Loading transform config');

      var parsed = undefined;

      try {
        parsed = pug.compile(buffer, xtend(opts, data ? data.config : {}));
      } catch (e) {
        _this.emit('error', e);
        return _this.queue(null);
      }

      parsed.dependencies.forEach(function (dep) {
        return _this.emit('file', dep);
      });

      _this.queue('var jade=require(\'pug-runtime\');module.exports=' + parsed.toString());
      _this.queue(null);
    });
  });
}

module.exports = function (opts) {
  return pugify.bind(xtend({
    // Default options
    pretty: true,
    compileDebug: true
  }, opts));
};

