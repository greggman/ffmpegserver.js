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
 * THEORY OF2 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
define([
    './frameencoder',
  ], function(
     FrameEncoder
  ) {

  "use strict";

  function FFMpegServer( settings ) {

    settings = settings || {};
    settings.url = settings.url || getWebSocketURL();

    var _frameEncoder = new FrameEncoder(settings);
    var _highestFrameSubmitted = 0;
    var _highestFrameAcknowledged = 0;
    var _maxQueuedFrames = settings.maxQueuedFrames || 4;
    var _noop = function() {};
    var _connected = false;
    var _handlers = {};
    var _settings;

  // var FakeFrameEncoder = function() {
  //   var _handlers = {};
  //   this.start = noop;
  //   this.add = noop;
  //   this.end = noop;
  //   this.on = function(e, f) {
  //     _handlers[e] = f;
  //   };
  //   setTimeout(function() {
  //     _handlers.start();
  //   }, 2);
  // };
  // frameEncoder = new FakeFrameEncoder();

    function getWebSocketURL() {
      var scriptNames = {
        "ffmpegserver.js": true,
        "ffmpegserver.min.js": true,
      };
      var scripts = document.getElementsByTagName("script");
      for (var ii = 0; ii < scripts.length; ++ii) {
        var script = scripts[ii];
        var scriptName = script.src;
        var slashNdx = scriptName.lastIndexOf("/");
        if (slashNdx >= 0) {
          scriptName = scriptName.substr(slashNdx + 1);
        }
        if (scriptNames[scriptName]) {
          var u = new URL(script.src);
          var url = "ws://" + u.host;
          return url;
        }
      }
    }

    this.start = function( settings ) {
      _settings = settings || {};
    };

    this.add = function(canvas) {
      ++_highestFrameSubmitted;
      _frameEncoder.add(canvas);
    }

    this.end = function() {
      _frameEncoder.end();
    };

    this.on = function(event, handler) {
       _handlers[event] = handler;
    };

    function _safeToProceed() {
        var numPendingFrames = _highestFrameSubmitted - _highestFrameAcknowledged;
        return _connected && numPendingFrames < _maxQueuedFrames;
    }

    this.safeToProceed = _safeToProceed;

    function _emit(event) {
      var handler = _handlers[event];
      if (handler) {
        handler.apply(null, Array.prototype.slice.call(arguments, 1));
      }
    }

    function _checkProcess() {
      if (_safeToProceed()) {
        _emit('process');
      }
    }

    function _handleError(data) {
      console.error(data);
      _emit('error', data);
    }

    function _handleFrame(data) {
      // theoretically this should always be one more
      // then highestFrameAcknowledged.
      _highestFrameAcknowledged = Math.max(_highestFrameAcknowledged, data.frameNum);
      _checkProcess();
    }

    function _handleProgress(data) {
      _emit('progress', data.progress);
    }

    function _handleEnd(data) {
      _emit('finished', data.pathname, data.size);
    }

    function _handleStart(data) {
      _connected = true;
      _frameEncoder.start( _settings );
      _checkProcess();
    }

    _frameEncoder.on('start', _handleStart);
    _frameEncoder.on('error', _handleError);
    _frameEncoder.on('end', _handleEnd);
    _frameEncoder.on('frame', _handleFrame);
    _frameEncoder.on('progress', _handleProgress);

  }

  return FFMpegServer;
});


