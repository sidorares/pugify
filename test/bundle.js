var test = require('tap').test;
var browserify = require('browserify');
var vm = require('vm');
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
