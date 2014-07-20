
module.exports = function (grunt) {
  "use strict";

  require('load-grunt-tasks')(grunt);


  grunt.initConfig({
    'node-inspector': {
      dev: {
        options: {
          'hidden': ['node_modules']
        }
      }
    },
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
          ext: 'js,less',
          // nodeArgs: ['--debug-brk']
        }
      }
    },
    concurrent: {
      default: {
        tasks: ['nodemon:server', 'watch:project', 'node-inspector'],
        options: {
          logConcurrentOutput: true
        }
      },
    }

  });


  grunt.registerTask('default', 'Default task will be executed if no task was called', [
    'concurrent:default'
  ]);

};