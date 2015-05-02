module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    component_tree: {
      source: {
        cwd: 'lib'
      }
    },
  });
  grunt.loadNpmTasks('grunt-component-tree');

};
