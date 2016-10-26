pugify
======

pug transform for browserify v2. Sourcemaps generation included.

![screen shot 2013-08-28 at 5 02 16 pm](https://f.cloud.github.com/assets/173025/1040229/e0555b3e-0faf-11e3-919a-b9c0b1489077.png)


[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/sidorares/browserify-jade/trend.png)](https://bitdeli.com/free "Bitdeli Badge")

### Configuration

If you are using pugify programatically, you can pass options to the Pug compiler by
calling `pug()` on the pugify transform:

```
    var b = browserify();
    b.transform(require('pugify').pug({
        pretty: false
    }));
```

If you are using pugify in a command line build, you can pass parameters by adding a
"pugify" section to your package.json.  You can either include parameters directly:

```
    "pugify": {
        "pretty": false
    }
```

or for more complicated cases you can reference a .js file:

```
    "pugify": "./assets/pugify-config.js"
```

And then in pugify-config.js:

```
    module.exports = {
        pretty: (process.env.NODE_ENV == 'production') ? true : false
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
