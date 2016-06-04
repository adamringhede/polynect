module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    component_tree: {
      source: {
        includeDir: true,
        cwd: [
          'lib/Matchmaker',
          'lib/Templates',
          'lib/Models',
          'lib/Models/Plugins',
          'lib/Models/Schemas',
          'lib/API/Views',
          'lib/Components',
          'lib/Components/MatchQueryBuilder',
          'lib/API/Controllers'
        ]
      }
    },
    mochaTest: {
        test: {
            options: {
              reporter: 'spec',
              clearRequireCache: true
            },
            src: ['test/**/*Test.js']
        }
    },
    jade: {
      compile: {
        options: {
          data: {
            debug: false
          }
        },
        files: {
          "lib/Templates/email.html": ["lib/Templates/email.jade"]
        }
      }
    },
    watch: {
      jade: {
        files: ['**/*.jade'],
        tasks: ['jade'],
        options: {
          spawn: false,
        },
      },
    },
  });
  grunt.loadNpmTasks('grunt-component-tree');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-jade');

  grunt.registerTask('test', ['mochaTest']);

};
