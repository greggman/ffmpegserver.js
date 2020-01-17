/*
 * Copyright 2015, Gregg Tavares.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Gregg Tavares. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
"use strict";

var debug            = require('debug')('video-encode-test');
var assert           = require('assert');
var fs               = require('fs');
var LoopbackClient   = require('../server/loopbackclient');
var path             = require('path');
var should           = require('should');
var TestFFMpegServer = require('../lib/test/test-ffmpegserver');
var testFrames       = require('../lib/test/test-frames');
var testUtils        = require('../lib/test/test-utils');
var utils            = require('../lib/utils');

var makeServer = function(options) {
  return new Promise(function(fulfill, reject) {
    var server = testUtils.createServerWithMocks(options, function() {
      setTimeout(function() {
          fulfill(server);
      }, 1);
    });
  });
};

//var events = require('events');
//
//events.EventEmitter.prototype.emit = function(oldOn) {
//  return function(a) {
//    console.log("EVENT:", a);
//    console.log((new Error()).stack);
//    oldOn.apply(this, arguments);
//  }
//}(events.EventEmitter.prototype.emit);



describe('video-encode', function() {

  var server;
  var frameDir;
  var videoDir;
  var videoPath;
  var videoSize;

  before(function(done) {
    utils.getTempFolder().then(function(dir) {
      frameDir = dir;
      return utils.getTempFolder();
    }).then(function(dir) {
      videoDir = dir;
      debug(frameDir);
      debug(videoDir);
      return makeServer({
        frameDir: frameDir,
        videoDir: videoDir,
      });
    }).then(function(s) {
      server = s;
      return Promise.resolve();
    }).then(done)
    .catch(function(e) {
      throw e;
    });
  });

  it('responds to lib request', function(done) {
    server.getP("http://localhost:0/ffmpegserver/ffmpegserver.min.js").then(function(res) {
      var expected = fs.readFileSync(path.join(__dirname, "..", "dist", "ffmpegserver.min.js"), {encoding: "utf-8"});
      res.body.should.be.equal(expected);
    }).then(done, done);
  });

  it('should be able submit frames', function(done) {
    this.timeout(5000);
    var testFFMpegServer = new TestFFMpegServer({server: server});
    var ffmpegServer = testFFMpegServer.getFFMpegServer();
    var name = "test@#file";
    var size;
    var started = false;

    var handleProgress = function(progress) {
    };

    var handleFinished = function(url, size) {
      url.should.endWith("test__file-1.mp4");
      size.should.be.greaterThan(6000);  // was 6869
      videoPath = url;
      videoSize = size;
      done();
    };

    var handleError = function(data) {
      console.error(data);
      assert(false);
      done();
    };

    var handleProcess = function() {
      if (!started) {
        started = true;
        testFrames.forEach(function(dataUrl, ndx) {
          console.log("sending frame: " + ndx);
          ffmpegServer.add({
            toDataURL: function() {
              return dataUrl;
            },
          });
        });

        ffmpegServer.end();
      }
    };

    ffmpegServer.on('process', handleProcess);
    ffmpegServer.on('progress', handleProgress);
    ffmpegServer.on('finished', handleFinished);
    ffmpegServer.on('error', handleError);

    ffmpegServer.start({
      name: name,
    });
  });

  it('can download file', function(done) {
    this.timeout(5000);

    server.getP("http://localhost:0" + videoPath)
    .then(function(res) {
      res.body.length.should.equal(videoSize);
      done();
    })
    .catch(function(e) {
      console.error(e);
      throw e;
    });
  });

  function deleteFiles(dir, extensions) {
    if (fs.existsSync(dir)) {
      var files = fs.readdirSync(dir);
      files.forEach(function(file) {
        if (extensions.indexOf(path.extname(file)) >= 0) {
          file = path.join(dir, file);
          //debug("delete: " + file);
          utils.deleteNoFail(file);
        }
      });
      //debug("delete: " + dir);
      utils.deleteNoFail(dir);
    }
  }

  after(function(done) {
    if (server) {
      server.close();
    }
    if (videoDir) {
      deleteFiles(videoDir, [".mp4"]);
    }
    if (frameDir) {
      deleteFiles(frameDir, [".png"]);
    }
    done();
  });

});

