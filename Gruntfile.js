"use strict";

var fs     = require('fs');
var semver = require('semver');

var license = [
'/**                                                                                       ',
' * @license ffmpegserver.js %(version)s Copyright (c) 2015, Gregg Tavares All Rights Reserved.    ',
' * Available via the MIT license.                                                         ',
' * see: http://github.com/greggman/ffmpegserver.js for details                            ',
' */                                                                                       ',
'/**                                                                                       ',
' * @license almond 0.3.1 Copyright (c) 2011-2014, The Dojo Foundation All Rights Reserved.',
' * Available via the MIT or new BSD license.                                              ',
' * see: http://github.com/jrburke/almond for details                                      ',
' */                                                                                       ',
'',
].map(function(s) { return s.replace(/\s+$/, ''); }).join("\n");

var replaceHandlers = {};
function registerReplaceHandler(keyword, handler) {
  replaceHandlers[keyword] = handler;
}

/**
 * Replace %(id)s in strings with values in objects(s)
 *
 * Given a string like `"Hello %(name)s from %(user.country)s"`
 * and an object like `{name:"Joe",user:{country:"USA"}}` would
 * return `"Hello Joe from USA"`.
 *
 * @param {string} str string to do replacements in
 * @param {Object|Object[]} params one or more objects.
 * @returns {string} string with replaced parts
 */
var replaceParams = (function() {
  var replaceParamsRE = /%\(([^\)]+)\)s/g;

  return function(str, params) {
    if (!params.length) {
      params = [params];
    }

    return str.replace(replaceParamsRE, function(match, key) {
      var colonNdx = key.indexOf(":");
      if (colonNdx >= 0) {
        try {
          var args = hanson.parse("{" + key + "}");
          var handlerName = Object.keys(args)[0];
          var handler = replaceHandlers[handlerName];
          if (handler) {
            return handler(args[handlerName]);
          }
          console.error("unknown substition handler: " + handlerName);
        } catch (e) {
          console.error(e);
          console.error("bad substitution: %(" + key + ")s");
        }
      } else {
        // handle normal substitutions.
        var keys = key.split('.');
        for (var ii = 0; ii < params.length; ++ii) {
          var obj = params[ii];
          for (var jj = 0; jj < keys.length; ++jj) {
            var key = keys[jj];
            obj = obj[key];
            if (obj === undefined) {
              break;
            }
          }
          if (obj !== undefined) {
            return obj;
          }
        }
      }
      console.error("unknown key: " + key);
      return "%(" + key + ")s";
    });
  };
}());

var bower = JSON.parse(fs.readFileSync('bower.json', {encoding: "utf8"}));

module.exports = function(grunt) {

  function setLicense() {
    var s = replaceParams(license, bower);
    grunt.config.set('uglify.min.options.banner', s);
    var start = s + fs.readFileSync('build/js/start.js', {encoding: "utf8"})
    grunt.config.set('requirejs.full.options.wrap.start', start);
  }

  var srcFiles = [
    'src/ffmpegserver.js',
  ];
  var thirdPartyFiles = [
  ];

  var libFiles = srcFiles.concat(thirdPartyFiles);

  grunt.initConfig({
    requirejs: {
      full: {
        options: {
          baseUrl: "./",
          name: "node_modules/almond/almond.js",
          include: "build/js/includer",
          out: "dist/ffmpegserver.js",
          optimize: "none",
          wrap: {
            start: '<%= rsStart %>',
            endFile: 'build/js/end.js',
          },
          paths: {
            twgl: 'src',
          }
        },
      },
    },
    uglify: {
      min: {
        options: {
          mangle: true,
          //screwIE8: true,
          banner: '<%= license %>',
          compress: true,
        },
        files: {
          'dist/ffmpegserver.min.js': ['dist/ffmpegserver.js'],
        },
      },
    },
    eslint: {
      lib: {
        src: [
          'src/*',
        ],
        options: {
          config: 'build/conf/eslint.json',
          //rulesdir: ['build/rules'],
        },
      },
    },
    clean: {
      dist: [
        'dist/ffmpegserver.js',
        'dist/ffmpegserver.min.js',
      ],
    },
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('gruntify-eslint');

  function getHeaderVersion(filename) {
    var twglVersionRE = / (\d+\.\d+\.\d+) /;
    return twglVersionRE.exec(fs.readFileSync(filename, {encoding: "utf8"}))[1];
  }

  function getPackageVersion(filename) {
    return JSON.parse(fs.readFileSync(filename, {encoding: "utf8"})).version;
  }

  grunt.registerTask('bumpversion', function() {
    bower.version = semver.inc(bower.version, 'patch');
    fs.writeFileSync("bower.json", JSON.stringify(bower, null, 2));
    var filename = "package.json";
    var p = JSON.parse(fs.readFileSync(filename, {encoding: "utf8"}));
    p.version = bower.version;
    fs.writeFileSync(filename, JSON.stringify(p, null, 2));
    setLicense();
  });

  grunt.registerTask('versioncheck', function() {
    var fs = require('fs');
    var good = true;
    [
      { filename: 'dist/ffmpegserver.js',          fn: getHeaderVersion, },
      { filename: 'dist/ffmpegserver.min.js',      fn: getHeaderVersion, },
      { filename: 'package.json',                  fn: getPackageVersion, },
    ].forEach(function(file) {
      var version = file.fn(file.filename);
      if (version !== bower.version) {
        good = false;
        grunt.log.error("version mis-match in:", file.filename, " Expected:", bower.version, " Actual:", version);
      }
    });
    return good;
  });

  grunt.registerTask('build', ['eslint:lib', 'clean:dist', 'requirejs', /*'concat',*/ 'uglify']);
  grunt.registerTask('publish', ['bumpversion', 'build']);
  grunt.registerTask('default', 'build');

  setLicense();
};

