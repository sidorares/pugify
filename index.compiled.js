'use strict';

var pug = require('pug');
var xtend = require('xtend');
var through = require('through');

function pugify(file) {
  var opts = this || {};

  if (!/\.(pug|jade)$/.test(file)) return through();

  var buffer = '';

  return through(function (chunk) {
    return buffer += chunk.toString();
  }, function end() {
    var _this = this;

    var parsed = undefined;

    try {
      parsed = pug.compile(buffer, opts);
    } catch (e) {
      this.emit('error', e);
      return this.queue(null);
    }

    parsed.dependencies.forEach(function (dep) {
      return _this.emit('file', dep);
    });

    this.queue('var jade=require(\'pug-runtime\');module.exports=' + parsed.toString());
    this.queue(null);
  });
}

module.exports = function (opts) {
  return pugify.bind(xtend({
    // Default options
    pretty: true,
    compileDebug: true
  }, opts));
};

