var jade      = require('jade');
var through   = require('through');

var SourceMapGenerator = require('source-map').SourceMapGenerator;
var convert   = require('convert-source-map');

var PREFIX = "var jade = require('jade/lib/runtime.js');\nmodule.exports=function(params) { if (params) {params.require = require;} return (\n";
var SUFFIX = ")(params); }";

var defaultJadeOptions = {
  client: true,
  path: __dirname,
  compileDebug: true,
  pretty: true,
};

function getTransformFn(options) {
  var key;
  var opts = {};
  for(key in defaultJadeOptions) {
    opts[key] = defaultJadeOptions[key];
  }

  options = options || {};
  for(key in options) {
    opts[key] = options[key];
  }

  return function (file) {
    if (!/\.jade$/.test(file)) return through();

    var data = '';
    return through(write, end);

    function write (buf) {
      data += buf;
    }
    function end () {
        var result = compile(file, data, opts);
        this.queue(result);
        this.queue(null);
    }
} ;
}

module.exports = getTransformFn();
module.exports.jade = getTransformFn;
module.exports.root = null;

function replaceMatchWith(match, newContent)
{
  var src = match.input;
  return src.slice(0, match.index) + newContent + src.slice(match.index + match[0].length);
}

function withSourceMap(src, compiled, name) {

  //return compiled;

  var compiledLines = compiled.split('\n');
  var generator = new SourceMapGenerator({file: name + '.js'});

  compiledLines.forEach(function(l, lineno) {
    var m = l.match(/^jade\.debug\.unshift\(\{ lineno: ([0-9]+)/);
    if (m) {
      generator.addMapping({
        generated: {
          line: lineno+2,
          column: 0
        },
        source: name,
        original: {
          line: Number(m[1]),
          column: 0
        }
      });
    }
    var debugRe = /jade\.debug\.(shift|unshift)\([^)]*\);?/;
    var match;
    while(match = l.match(debugRe)) {
      l = replaceMatchWith(match, '');
    }
    compiledLines[lineno] =l;
  });
  generator.setSourceContent(name, src);

  var map = convert.fromJSON(generator.toString());
  compiledLines.push(SUFFIX);
  compiledLines.push(map.toComment());
  return compiledLines.join('\n');
}

function compile(file, template, options) {
    opts.filename= file;
    var fn =  jade.compile(template, opts);
    var generated = fn.toString();
    return PREFIX + withSourceMap(template, generated, file);
}
