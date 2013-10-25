# How to [RequireJs](http://requirejs.org/) using zurb foundation 4

​At work we had a tricky problem implementing [Asynchronous Module Definition (AMD)](https://github.com/amdjs/amdjs-api/wiki/AMD), [content security policy (CSP)](http://www.html5rocks.com/en/tutorials/security/content-security-policy/) and [zurb foundation](http://foundation.zurb.com/). After searching the web, reading the docs of RequireJs back and forth I finally came up with the following solution.

Foundation is using [zepto js](http://zeptojs.com/) for modern browsers and [jQuery](http://jquery.com/) for old once. The challenge is to implement a development and productive work-flow. Our web application has a very special setting: **be fast at the very first page impression**, maybe load some extra in rare cases and for the following pages use the cached version. This means, we use all our modules separately when in development and compress everything into one file for production.

To better understand what we want to accomplish see this [question from stack overflow](http://stackoverflow.com/questions/17035609/most-efficient-multipage-requirejs-and-almond-setup) and the [example setup on github](https://github.com/cloudchen/requirejs-bundle-examples). In other words: Optimize one JS file for common modules, and then another for the specific DOM library. ([Almond](https://github.com/jrburke/almond) doesn't fit in with this way)


## Contents of foundation

Foundation consists of the following intervened modules: modernizr, a jQuery/zepto switch, the "foundation.main.js" and the foundation modules (alert, clearing etc.) In this very order. Our goal is to bundle and compress everything except the conditional Dom library jQuere or zepto. The switch only does the following browser feature detection: 

```javascript
'__proto__' in {} ? 'zepto' : 'jquery'
```

So to load whether jQuery or Zepto the switch needs to be executed as fast as possible and then load the vendor. Preferably this switch would be included in the request fetching modernizr and all other modules. But those modules depended on the library, wait for it to be fully loaded.

In compression theory we end up with two requests: one for the Library jQuere/zepto and one for our `main.min.js`.

 
## RequireJs basics

To use RequireJs we need two requests: RequireJs itself and a "controller" `main.js` file that manages and loads all other modules. For production every required module will be in there compressed. Here the dependencies will be defined and kept DRY. The compression algorithm as well in development our entry point will be the file `main.js`.


## The file list we require

For a basic setup we assume the following files to be loaded. Note that all `vendor/*.min.js` are untouched and downloaded from their various sources. 

	./js/main.js (config file)
	./js/vendor/custom.foundation.js (will be modified)
	./js/vendor/requires.min.js	
	./js/vendor/jquery.min.js
	./js/vendor/zepto.min.js
	./js/vendor/custom.modernizr.js

Lets concentrate on the first two. The main.js looks like the following:

```javascript
// ./js/main.js

requirejs.config({
	baseUrl: './js',
	shim: {
		'domLib': {
			exports: '$'
		},
		'foundation': {
			deps: ['domLib']
		}
	},
	paths: {
		'domLib': '__proto__' in {} ? 'vendor/zepto.min' : 'vendor/jquery.min',
		'modernizr': 'vendor/custom.modernizr',
		'foundation': 'vendor/custom.foundation',
	}
});

// inculde domLib independent scripts
require(['modernizr'], function() {
});

require(['domLib', 'foundation'], function($){
	$(document).foundation();
});
```

The `shim` section basically says, when including `domLib` it returns a `$` (jQuery/Zepto object) and that foundation depends on `domLib` - so it will wait to execute until `domLib` has been loaded. Modernizr we put first since it manipulates the DOM and doesn't rely on any other libraries. Finally the switch-method is called and foundation loaded. After the assets have been fetched foundation has to be appended to the document object ([see the docs](http://foundation.zurb.com/docs/javascript.html)).


## Wrapping foundation.min.js

Since foundation itself is not using AMD the components are meant to be loaded after one and another ([again, see the docs](http://foundation.zurb.com/docs/javascript.html)). I thought of many smart ways of including and defining the dependencies like [in this gist](https://gist.github.com/cheapsteak/5205777). But in the end, foundation is a vendor. You don't mess with the source - at least not after a certain stage in development. And zurb presets a decent way of getting only the components you want as a [simple download](http://foundation.zurb.com/download.php). Thus, we will be wrapping just a finalized `foundation.min.js` and reference it later on - you don't minify jQuery by hand, do you? 


```javascript
// ./js/foundation.min.js (modified)

define(function(require) {
	var $ = require('domLib');

	// content of foundation.min.js in here (from download)
})
```

That's it for the development. In your layout just do:

```html
// index.html
<!-- data-main attribute tells require.js to load js/main.js after require.js loads. -->
<script data-main="js/main" src="js/vendor/require.min.js"></script>
```


## To production

For production use, we incorporate the [RequireJS optimization tool](http://requirejs.org/docs/optimization.html). For this we need `nodeJs`, a build-script and the node-module `r.js`. Go for the docs and see how to install and setup. FYI, we only want to [compress to one file](http://requirejs.org/docs/optimization.html#onejs) and not copy out hole `./js` directory. Thus, we don't use the possibility to [optimize a project](http://requirejs.org/docs/optimization.html#wholeproject).

Put in your root the `./build.js` file. 

```javascript
// ./build.js

({
    baseUrl: "./js",
    paths: {
        'domLib': 'empty:',
    },
    name: "main",
	mainConfigFile: 'js/main.js',
	optimize: "uglify2",
    out: "js/main.min.js"
})
```

To run the optimization, type in your root folder:

	/> node r.j -o build.js 

This will output the new file `./js/main.min.js`, which will `uglify2` all our setup. Note the paths property sets the call `domLib` to `empty:` and the compressed file will then still require the DomLib dynamically. Now we only have to switch in your layout:

```html
// index.min.html

<script data-main="js/main.min" src="js/vendor/require.min.js"></script>
```

done.