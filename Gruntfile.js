module.exports = function(grunt) {

	grunt.initConfig({
		browserify: {
			js: {
				files: {
					'public/infoamazonia-agua.js': 'app/theme/app.js'
				}
			}
		},
		uglify: {
			build: {
				options: {
					mangle: false
				},
				files: {
					'public/infoamazonia-agua.js': 'public/infoamazonia-agua.js'
				}
			}
		},
		less: {
			compile: {
				files: {
					'public/css/agua.css': 'css/agua.less',
					'public/css/main.css': 'css/main.less'
				}
			}
		},
		copy: {
			main: {
				files: [
					{ src: 'css/**/*.css', dest: 'public/' },
					{ src: 'img/**', dest: 'public/' },
					{ src: 'font/**', dest: 'public/' }
				]
			}
		},
		watch: {
			scripts: {
				files: 'app/**/*.js',
				tasks: ['browserify']
			},
			css: {
				files: 'css/**/*.less',
				tasks: ['less']
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-browserify');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.registerTask(
		'javascript',
		'Compile scripts.',
		['browserify', 'uglify']
	);

	grunt.registerTask(
		'css',
		'Compile css.',
		['less']
	);

	grunt.registerTask(
		'files',
		'Copy files.',
		['copy']
	);

	grunt.registerTask(
		'build',
		'Compiles everything.',
		['copy', 'javascript', 'css', 'files']
	);

	grunt.registerTask(
		'default', 
		'Build, start server and watch.', 
		['build', 'watch']
	);

}