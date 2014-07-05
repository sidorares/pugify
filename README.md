browserify-jade
===============

jade transform for browserify v2. Sourcemaps generation included.

![screen shot 2013-08-28 at 5 02 16 pm](https://f.cloud.github.com/assets/173025/1040229/e0555b3e-0faf-11e3-919a-b9c0b1489077.png)


[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/sidorares/browserify-jade/trend.png)](https://bitdeli.com/free "Bitdeli Badge")

### Configuration

If you are using browserify-jade programatically, you can pass options to the Jade compiler by
calling `jade()` on the browserify-jade transform:

    var b = browserify();
    b.transform(require('browserify-jade').jade({
        pretty: false
    }));

If you are using browserify-jade in a command line build, you can pass parameters by adding a
"browserify-jade" section to your package.json.  You can either include parameters directly:

    "browserify-jade": {
        "pretty": false
    }

or for more complicated cases you can reference a .js file:

    "browserify-jade": "./assets/browserify-jade-config.js"

And then in browserify-jade-config.js:

    module.exports = {
        pretty: (process.env.NODE_ENV == 'production')?true:false
    };