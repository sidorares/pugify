var jade      = require('jade');
var through   = require('through');

var SourceMapGenerator = require('source-map').SourceMapGenerator;
var convert   = require('convert-source-map');

var PREFIX = "var jade = require('jade/lib/runtime.js');\nmodule.exports=\n";

module.exports = function (file) {
    if (!/\.jade$/.test(file)) return through();

    var data = '';
    return through(write, end);

    function write (buf) {
      data += buf;
    }
    function end () {
        var result = compile(file, data);
        this.queue(result);
        this.queue(null);
    }
};

module.exports.root = null;

function withSourceMap(src, compiled, name) {

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
    if (l.match(/^jade\.debug/)) {
      compiledLines[lineno] = '';
    }
  });
  compiled = compiledLines.join('\n');
  generator.setSourceContent(name, src);

  var map = convert.fromJSON(generator.toString());
  compiledLines.push(map.toComment());

  return compiledLines.join('\n');
}

function compile(file, template) {
    var fn =  jade.compile(template, {
        client: true
        ,filename:file
        ,path: __dirname
        ,compileDebug: true
        ,pretty: true
    });
    var generated = fn.toString();
    return PREFIX + withSourceMap(template, generated, file);
}
