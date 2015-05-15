module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    component_tree: {
      source: {
        includeDir: true,
        cwd: ['lib/Models', 'lib/API/Views', 'lib/Matchmaker']
      }
    },
  });
  grunt.loadNpmTasks('grunt-component-tree');

};
