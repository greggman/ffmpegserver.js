/*
 * Copyright 2014, Gregg Tavares.
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

"use strict";

var assert         = require('assert');
var debug          = require('debug')('test-ffmpegserver');
var LoopbackClient = require('../../server/loopbackclient');
var requirejs      = require('requirejs');
var path           = require('path');

requirejs.config({
  nodeRequire: require,
  baseUrl: path.join(__dirname, '../../src'),
});

var FFMpegServer = requirejs('ffmpegserver');

var TestFFMpegServer = function(options) {
  options = options || {};
  var wsclient = options.socket || new LoopbackClient();
  var ffpmegServer = new FFMpegServer({
    socket: wsclient,
    quiet: true,
    url: "anything-here-prevents-document-accces",
  });

  this.socket = wsclient;

  this.close = function() {
    wsclient.close();
  };

  this.getFFMpegServer = function() {
    return ffpmegServer;
  };

  setTimeout(function() {
    wsclient.connect();
    options.server.getSocketServer().emit('connection', wsclient.server);
  }, 1);
};

module.exports = TestFFMpegServer;

