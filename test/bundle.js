var test = require('tap').test;
var browserify = require('browserify');
var vm = require('vm');

function bundle (file) {
    test('bundle transform', function (t) {
        t.plan(1);

        var b = browserify();
        b.add(__dirname + file);
        b.transform(__dirname + '/..');
        b.bundle(function (err, src) {
            if (err) t.fail(err);
            testBundle(src, t);
        });
    });
}

bundle('/../example/bar.js');

function testBundle(src, t) {
    function log (msg) {
        t.equal(msg, 555);
    }
    vm.runInNewContext(src, {
        console: { log: log }
    });
}