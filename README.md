pugify
======

pug transform for browserify v2. Sourcemaps generation included.

![screen shot 2013-08-28 at 5 02 16 pm](https://f.cloud.github.com/assets/173025/1040229/e0555b3e-0faf-11e3-919a-b9c0b1489077.png)


[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/sidorares/browserify-jade/trend.png)](https://bitdeli.com/free "Bitdeli Badge")

### Configuration

#### Format
```javascript
    var b = browserify();
    # these options are passed directly to pug compiler
    var pugConfig = {
        pretty: true,
        compileDebug: false
    };
    # if babelConfig is defined, the output will be transpiled using babel, and the options are passed into babel transpiler
    # this is useful when you need to support old browsers, since pug compiles into ES6 format.
    var babelConfig = {
        presets: ['es2015']
    };
    b.transform(require('pugify').pug(pugConfig, babelConfig));
```

If you are using pugify programatically, you can pass options to the Pug compiler by
calling `pug()` on the pugify transform:

```
    var b = browserify();
    b.transform(require('pugify').pug({
        pretty: true
    }));
```

If you are using pugify in a command line build, you can pass parameters by adding a
"pugify" section to your package.json.  You can either include parameters directly:

```
    "pugify": {
        "pretty": true
    }
```

or for more complicated cases you can reference a .js file:

```
    "pugify": "./assets/pugify-config.js"
```

And then in pugify-config.js:

```
    module.exports = {
        pretty: (process.env.NODE_ENV == 'production') ? false : true
    };
```

To disable sourcemap generation, which results in smaller compiled files for production builds,
set pug option `compileDebug` to false in the options:

```
    var b = browserify();
    b.transform(require('pugify').pug({
        compileDebug: false
    }));
```

 or in package.json:

```
     "pugify": {
        "compileDebug": false
    }
```
