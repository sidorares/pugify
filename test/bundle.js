var test = require('tap').test;
var browserify = require('browserify');
var fs = require('fs');
var vm = require('vm');
var path = require('path');
var SourceMapConsumer = require('source-map').SourceMapConsumer;
var convert = require('convert-source-map');
var pugify = require('../index.js');

test('no options bundle', function(t) {
    t.plan(1);
    var b = browserify();
    b.add(__dirname + '/../example/bar.js');
    b.transform(__dirname + '/..');
    b.bundle(function (err, src) {
        if (err) t.fail(err);
        testBundle(src, t);
    });
});

test('options bundle', function(t) {
    t.plan(1);
    var b = browserify();
    b.add(__dirname + '/../example/bar.js');
    b.transform(pugify.pug({
        pretty: false
    }));
    b.bundle(function (err, src) {
        if (err) t.fail(err);
        testBundle(src, t);
    });
});

test('with sourcemap', function (t) {

    async function checkSrcContainsSourceMapFor (src, filename) {
        var json = convert
            .fromSource(src.toString('utf8'))
            .toJSON();
        var consumer = await new SourceMapConsumer(json);
        try {
            var srcFile = path.join(__dirname, '../example', filename);
            var smSrc = consumer.sourceContentFor(srcFile);
            var fileSource = await fs.promises.readFile(srcFile, 'utf8');
            if (smSrc !== fileSource) throw new Error('Sourcemap does not match file content');
        } finally {
            consumer.destroy();
        }
    }

    t.plan(1);
    var b = browserify({debug:true});
    b.add(__dirname + '/../example/bar.js');
    b.transform(pugify.pug({
        pretty: true,
        compileDebug: true
    }));
    b.bundle(async function (err, src) {
        if (err) t.fail(err);
        try {
            await Promise.all([
                checkSrcContainsSourceMapFor(src, 'foo.pug'),
                checkSrcContainsSourceMapFor(src, 'fooinc.pug'),
            ]);
            testBundle(src, t);
        } catch (err) {
            t.fail(err);
        }
    });
});

test('bundle with babel transpiling options', function(t) {
    var b = browserify();
    b.add(__dirname + '/../example/es6.js');
    b.transform(pugify.pug({ pretty: false }, { presets: ['@babel/preset-env'] }));

    b.bundle(function (err, src) {
        if (err) t.fail(err);
        function log(msg) {
            // verify that there is no string template in the compiled javascript object, which is a feature of ES6
            t.notOk(/`/.test(msg));
        }
        vm.runInNewContext(src, {
            console: { log: log }
        });
        t.end();
    });
});

function testBundle(src, t) {
    function log (msg) {
        t.equal(msg, 555);
    }
    vm.runInNewContext(src, {
        console: { log: log }
    });
}
