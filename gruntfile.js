module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		// CSS & Sass

		less: {
			development: {
				files: {
					"dist/css/click-on-jorge-main.css": "app/less/click-on-jorge-main.less"
				}
			},
			production: {
				options: {
					paths: ["assets/css"],
					cleancss: true,
				},
				files: {
					"dist/css/click-on-jorge-main.css": "app/less/click-on-jorge-main.less"
				}
			}
		},
		watch: {
			grunt: { files: ['Gruntfile.js'] },
			sass: {
				files: 'app/less/**/*.less',
				tasks: ['less:development']
			},
			watchify: {
				files: [
					'app/js/app/*.js',
					'app/js/classes/*.js',
				],
				tasks: ['watchify']
			},
			options: {
				livereload: true,
			},
		},

		// Javascript

		watchify: {
			header: {
				src: './app/js/app/header.js',
				dest: './dist/js/header.js',
			},
			footer: {
				src: './app/js/app/footer.js',
				dest: './dist/js/footer.js',
			}
		},
		browserify: {
			header: {
				src: './app/js/app/header.js',
				dest: './dist/js/header.js',
			},
			footer: {
				src: './app/js/app/footer.js',
				dest: './dist/js/footer.js',
			}
		},

		// For Production

		uglify: {
			dev: {
				options: {
					beautify: true,
					compress: false,
					preserveComments : 'all',
					banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
        				'<%= grunt.template.today("yyyy-mm-dd") %> */',
        			mangle: false,
				},
				files: {
					'dist/js/header.js': ['dist/js/header.js'],
					'dist/js/footer.js': ['dist/js/footer.js'],
				}
			},
			production: {
				options: {
					report : 'gzip',
					preserveComments : false,
					mangle: true,
				},
				files: {
					'dist/js/header.js': ['dist/js/header.js'],
					'dist/js/footer.js': ['dist/js/footer.js'],
				}
			}
		},
		cssmin: {
			minify: {
				expand: true,
				cwd: './',
				src: ['dist/css/click-on-jorge-main.css'],
				dest: './',
				ext: '.css'
			}
		},

		copy: {
			images: {
				files: [
					// includes files within path
					{ 
						expand: true, 
						src: ['app/img/**/*'], 
						dest: 'dist/', 
					},
				]
			}
		}
	});

	// CSS & Sass
	grunt.loadNpmTasks('grunt-contrib-less');

	// Javascript
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-watchify');
	grunt.loadNpmTasks('grunt-browserify');

	// Images
	grunt.loadNpmTasks('grunt-contrib-copy');

	// Production
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-cssmin');

	// Tasks
	grunt.registerTask('default', ['build','watch']);
	grunt.registerTask('build', ['sass', 'mustache', 'browserify', 'favicons', 'copy']);
	grunt.registerTask('staging', ['build', 'uglify:dependencies', 'uglify:dev']);
	grunt.registerTask('production', ['build', 'uglify', 'cssmin']);
}