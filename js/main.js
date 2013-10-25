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

// inculde all domLib independent scripts here

require(['modernizr'], function(modernizr) {
});

require(['domLib', 'foundation'], function($){
	$(document).foundation();
});