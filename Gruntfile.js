/*
 * Gruntfile.js for Jekyll
 * @author Christian Fei
 * kudos to @toddmotto for the base
 */
'use strict';
module.exports = function ( grunt ) {
    pkg: grunt.file.readJSON('package.json'),
    require( 'matchdep' ).filterDev('grunt-*').forEach( grunt.loadNpmTasks );

    grunt.initConfig({
        /*
          COMPILE SCSS AND SASS FILES
            CHANGE cssDir and sassDir to your needs!
            optional: use the config.rb file 
              (by simply removing the options above and uncommentis config: ...)
        */
        compass: {
          compile: {
            options: {
              // cssDir: 'css/',
              // sassDir: 'css/',
              // outputStyle: 'compressed',
              config: 'config.rb'
            }
          }
        },
        /*
        auto prefixer
        */
        autoprefixer:{
            dist:{
                files:{
                    'client/css/main.css':'client/css/main.css'
                }
            },
        },
        /*
          UGLIFY and CONCAT YOUR JS FILES:
            YOU NEED TO CHANGE THE VALUES BELOW DEPENDING ON YOUR SETUP
            SYNTAX :
              'dest' : ['src']
        */
        uglify: {
            dist: {
                files: {
                    'client/js/built.min.js': [ 'client/js/jquery.js', 'client/js/notification.js', 'client/js/main.js' ]
                }
            },
            debug:{
                options: {
                    compress: false,
                    mangle: false,
                    beautify: true
                },
                files:{
                    'client/js/built.min.js': [ 'client/js/jquery.js', 'client/js/notification.js', 'client/js/main.js' ]
                }
            }
        },

        watch: {
            js_watch: {
                files: [
                    'client/js/{,*/}*.js',
                    '!client/js/built.min.js'
                ],
                tasks: [ 'uglify' ]
            },
            css_watch: {
                files: [
                    'client/scss/*'
                ],
                tasks: [ 'compass', 'autoprefixer' ]
            },
        }
    });
    
    grunt.registerTask( 'default' , [
        'uglify',
        'autoprefixer',
        'compass',
        'watch'
    ]);
    grunt.registerTask( 'debug' , [
        'uglify:debug',
        'autoprefixer',
        'compass',
        'watch'
    ]);
    grunt.registerTask( 'build' , [
        'uglify',
        'autoprefixer',
        'compass'
    ]);    
};