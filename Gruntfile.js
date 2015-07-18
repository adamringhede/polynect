module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    component_tree: {
      source: {
        includeDir: true,
        cwd: ['lib/Models', 'lib/Models/Plugins', 'lib/API/Views', 'lib/Components', 'lib/Components/MatchQueryBuilder', 'lib/API/Controllers']
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
    }
  });
  grunt.loadNpmTasks('grunt-component-tree');
  grunt.loadNpmTasks('grunt-mocha-test');

  grunt.registerTask('test', ['mochaTest']);

};
