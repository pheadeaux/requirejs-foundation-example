({
    baseUrl: "./js",
    paths: {
        'domLib': 'empty:',
    },
    name: "main",
	mainConfigFile: 'js/main.js',
	optimize: "uglify2",
	preserveLicenseComments: false,
//	generateSourceMaps: true,
    out: "js/main.min.js"
})