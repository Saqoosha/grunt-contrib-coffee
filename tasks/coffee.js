/*
 * grunt-contrib-coffee
 * http://gruntjs.com/
 *
 * Copyright (c) 2012 Eric Woroshow, contributors
 * Licensed under the MIT license.
 */

path = require('path');

module.exports = function(grunt) {
  'use strict';

  // TODO: ditch this when grunt v0.4 is released
  grunt.util = grunt.util || grunt.utils;

  grunt.registerMultiTask('coffee', 'Compile CoffeeScript files into JavaScript', function() {
    var path = require('path');

    var helpers = require('grunt-lib-contrib').init(grunt);

    var options = helpers.options(this, {
      bare: false,
      basePath: false,
      flatten: false
    });

    grunt.verbose.writeflags(options, 'Options');

    // TODO: ditch this when grunt v0.4 is released
    this.files = this.files || helpers.normalizeMultiTaskFiles(this.data, this.target);

    var basePath;
    var newFileDest;

    var srcFiles;
    var srcCompiled;
    var sourceMap;
    var taskOutput;

    this.files.forEach(function(file) {
      file.dest = path.normalize(file.dest);
      srcFiles = grunt.file.expandFiles(file.src);

      if (srcFiles.length === 0) {
        grunt.log.writeln('Unable to compile; no valid source files were found.');
        return;
      }

      taskOutput = [];

      srcFiles.forEach(function(srcFile) {
        srcCompiled = compileCoffee(srcFile, options);
        sourceMap = null;
        if (options.sourceMap) {
          sourceMap = srcCompiled.v3SourceMap;
          srcCompiled = srcCompiled.js
        }

        if (helpers.isIndividualDest(file.dest)) {
          basePath = helpers.findBasePath(srcFiles, options.basePath);
          newFileDest = helpers.buildIndividualDest(file.dest, srcFile, basePath, options.flatten);

          writeJs(srcFile, srcFile, srcCompiled, sourceMap);
          grunt.log.writeln('File ' + newFileDest.cyan + ' created.');
        } else {
          writeJs(srcFile, srcFile, srcCompiled, sourceMap);
        }
      });

      if (taskOutput.length > 0) {
        grunt.file.write(file.dest, taskOutput.join('\n') || '');
        grunt.log.writeln('File ' + file.dest.cyan + ' created.');
      }
    });
  });

  var compileCoffee = function(srcFile, options) {
    options = grunt.util._.extend({filename: srcFile}, options);
    delete options.basePath;
    delete options.flatten;

    var srcCode = grunt.file.read(srcFile);

    try {
      return require('coffee-script').compile(srcCode, options);
    } catch (e) {
      grunt.log.error(e);
      grunt.fail.warn('CoffeeScript failed to compile.');
    }
  };

  var baseFileName = function(file, stripExt) {
    var parts;
    if (stripExt == null) {
      stripExt = false;
    }
    parts = file.split('/');
    file = parts[parts.length - 1];
    if (!stripExt) {
      return file;
    }
    parts = file.split('.');
    parts.pop();
    if (parts[parts.length - 1] === 'coffee') {
      parts.pop();
    }
    return parts.join('.');
  };

  var outputPath = function(source, base, extension) {
    var baseDir, basename, dir, srcDir;
    if (extension == null) {
      extension = ".js";
    }
    basename = baseFileName(source, true);
    srcDir = path.dirname(source);
    baseDir = base === '.' ? srcDir : srcDir.substring(base.length);
    return path.join(srcDir, basename + extension);
  };

  var writeJs = function(base, sourcePath, js, generatedSourceMap) {
    var compile, jsDir, jsPath, sourceMapPath;
    if (generatedSourceMap == null) {
      generatedSourceMap = null;
    }
    jsPath = outputPath(sourcePath, base);
    sourceMapPath = outputPath(sourcePath, base, ".map");
    jsDir = path.dirname(jsPath);
    if (js.length <= 0) {
      js = ' ';
    }
    if (generatedSourceMap) {
      js = "//@ sourceMappingURL=" + (baseFileName(sourceMapPath)) + "\n" + js;
    }
    grunt.file.write(jsPath, js);
    if (generatedSourceMap) {
      grunt.file.write(sourceMapPath, generatedSourceMap);
    }
  };
};
