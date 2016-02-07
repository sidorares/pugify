Pugify
===============

**[Pug](https://github.com/pugjs/jade)** (formerly Jade) transform module for [Browserify](https://github.com/substack/node-browserify), now with **source maps**!

Use with Browserify to import `.pug` or `.jade` template files and convert them to HTML in your code.

## Usage

Install to your project:

    npm install --save pugify

You will need to install Pug:

    npm install --save pug

### Command Line

Use the `-t` flag with Browserify CLI tool

    browserify -t pugify --debug main.js > bundle.js

### Programmatically

Use the `configure` method to set options. See the section below for clarification. You must enable

    const browserify = require('browserify');
    const pugify = require('pugify');

    const b = browserify('./main.js', { debug: true });
    b.transform(pugify);
    b.bundle().pipe(fs.createWriteStream('./bundle.js'));

Note: Browserify's debug mode must be enabled to generate source maps.

An example `main.js`:

    import template from './template.pug'
    document.body.innerHTML = template({ title: 'Hello World!' })

And `template.pug`:

    section
      h1= title
## Options

If you're using Pugify programmatically, use the `configure` method to pass options to the Pug compiler:

    const pugify = require('pugify').configure({
      pretty: true
    });

    b.transform(pugify);

Otherwise, you can pass options by adding a `"pugify"` section to your `package.json`. You can either include parameters directly:

    "pugify": {
      "pretty": false
    }

Or for more complicated cases you can reference a `.js` file:

    "pugify": "/path/to/pugify.config.js"

And then in `pugify.config.js`:

    module.exports = {
        pretty: (process.env.NODE_ENV === 'production') ? true : false
    };

![screen shot 2013-08-28 at 5 02 16 pm](https://f.cloud.github.com/assets/173025/1040229/e0555b3e-0faf-11e3-919a-b9c0b1489077.png)


[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/sidorares/browserify-jade/trend.png)](https://bitdeli.com/free "Bitdeli Badge")
