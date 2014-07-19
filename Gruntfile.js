/* 
* @Author: Jens Böttcher
* @Date:   2014-07-19 15:41:38
* @Last Modified by:   Jens Böttcher
* @Last Modified time: 2014-07-19 16:27:59
*/

module.exports = function (grunt) {
  "use strict";

  require('load-grunt-tasks')(grunt);


  grunt.initConfig({
    watch: {
      project: {
        tasks: [],
        files: ['public/**/*.*', 'views/**/*.*'],
        options: {
          livereload: true,
        }
      }
    },
    nodemon: {
      server: {
        script: 'server.js',
        options: {
          ext: 'js,less'
        }
      }
    },
    concurrent: {
      default: {
        tasks: ['nodemon:server', 'watch:project'],
        options: {
          logConcurrentOutput: true
        }
      },
    },
    bower: {
      install: {
        options: {
          targetDir: 'public/resources',
          install: true,
          verbose: true,
          layout: 'byComponent',
          cleanTargetDir: true,
          cleanBowerDir: false,
          bowerOptions: {}
        }
      }
    },
    bower_concat: {
      all: {
        dest: 'build/_bower.js',
        bowerOptions: {
          relative: false
        }
      }
    }

  });


  grunt.registerTask('default', 'Default task will be executed if no task was called', [
    'concurrent:default'
  ]);

};