var fs = require('fs');

var pug = require('pug');
var through = require('through');
var transformTools = require('browserify-transform-tools');

var SourceMapGenerator = require('source-map').SourceMapGenerator;
var convert = require('convert-source-map');

var PREFIX = "var pug = require('pug-runtime');\nmodule.exports=template;";

var defaultPugOptions = {
    path: __dirname,
    compileDebug: true,
    pretty: true,
};

function getTransformFn(options) {
    var key;
    var opts = {};
    for (key in defaultPugOptions) {
        opts[key] = defaultPugOptions[key];
    }

    options = options || {};
    for (key in options) {
        opts[key] = options[key];
    }

    return function (file) {
        if (!/\.(pug|jade)$/.test(file)) return through();

        var data = '';
        return through(write, end);

        function write(buf) {
            data += buf;
        }

        function end() {
            var _this = this;
            configData = transformTools.loadTransformConfig('pugify', file, { fromSourceFileDir: true }, function (err, configData) {
                if (configData) {
                    var config = configData.config || {};
                    for (key in config) {
                        opts[key] = config[key];
                    }
                }

                try {
                    var result = compile(file, data, opts);
                    result.dependencies.forEach(function (dep) {
                        _this.emit('file', dep);
                    });
                    _this.queue(result.body);
                } catch (e) {
                    _this.emit("error", e);
                }
                _this.queue(null);
            });
        }
    };
}

module.exports = getTransformFn();
module.exports.pug = getTransformFn;
module.exports.jade = getTransformFn;
module.exports.root = null;
module.exports.register = register;

function register() {
    require.extensions['.pug'] = require.extensions['.jade'] = function (module, filename) {
        var result = compile(filename, fs.readFileSync(filename, 'utf-8'), { compileDebug: true });
        return module._compile(result.body, filename);
    };
}

function replaceMatchWith(match, newContent) {
    var src = match.input;
    return src.slice(0, match.index) + newContent + src.slice(match.index + match[0].length);
}

function withSourceMap(src, compiled, name) {

    var compiledLines = compiled.split('\n');
    var generator = new SourceMapGenerator({ file: name + '.js' });

    compiledLines.forEach(function (l, lineno) {
        var oldFormat = false;
        var generatedLine;
        var linesMatched = {};
        linesMatched[name] = {};

        var m = l.match(/;pug_debug_line = ([0-9]+);/);
        if (m) {
            var originalLine = Number(m[1]);

            if (originalLine > 0) {
                var fname = "";
                m = l.match(/;pug_debug_filename = \"(.*)\";/);
                if (m) {
                    fname = m[1].replace(/\\u002F/g, "/");
                } else {
                    fname = name;
                }
                if (!linesMatched[fname]) {
                    // new include file - add to sourcemap
                    linesMatched[fname] = {};
                    try {
                        var srcContent = fs.readFileSync(fname);
                        generator.setSourceContent(fname, srcContent);
                    } catch (e) {}
                }
                var alreadyMatched = linesMatched[fname][originalLine];

                if (!alreadyMatched &&
                    (!/^;pug_debug/.test(compiledLines[lineno + 1])))
                    generatedLine = lineno + 3; // 1-based and allow for PREFIX extra line

                if (generatedLine) {
                    linesMatched[fname][originalLine] = true;

                    generator.addMapping({
                        generated: {
                            line: generatedLine,
                            column: 0
                        },
                        source: fname,
                        original: {
                            line: originalLine,
                            column: 0
                        }
                    });
                }
            }
        }

        //remove pug debug lines from within generated code
        var debugRe = /;pug_debug_line = [0-9]+;pug_debug_filename = ".*";/;
        var match;
        while (match = l.match(debugRe)) {
            l = replaceMatchWith(match, '');
        }
        compiledLines[lineno] = l;
    });

    // Remove pug debug lines at beginning and end of compiled version
    // could be in a number of first few lines depending on source content
    var found = false;
    var line = 0;
    while (!found && line < compiledLines.length) {
        var lnDebug = compiledLines[line];
        if (/^function pug_rethrow/.test(lnDebug)) {
            found = true;
            var re = /var\spug_debug_filename.*/;
            compiledLines[line] = lnDebug.replace(re, '');
        }
        line++;
    }
    if (found) {
        var ln = compiledLines.length;
        compiledLines[ln - 1] = compiledLines[ln - 1].replace(/\} catch \(err\)[^}]*};/, '');
    }

    generator.setSourceContent(name, src);

    var map = convert.fromJSON(generator.toString());
    compiledLines.push(map.toComment());
    return compiledLines.join('\n');
}

function compile(file, template, options) {
    options.filename = file;
    var result;
    result = pug.compileClientWithDependenciesTracked(template, options);
    if (options.compileDebug)
        result.body = withSourceMap(template, result.body, file);

    result.body = PREFIX + result.body;
    return result;
}
