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

"use strict";

var debug        = require('debug')('socketserver');
var events       = require('events');
var fs           = require('fs');
var path         = require('path');
var VideoEncoder = require('./video-encoder');
var WSServer     = require('./websocketserver');

/**
 * SocketServer options
 * @typedef {Object} SocketServer~Options
 * @property {WebSocketServer?} WebSocketServer constructor for WebSocketServer (for testing)
 */

/**
 * @constructor
 * @params {HTTPServer} server. httpserver to run websocket servers.
 * @params {SocketServer~Options} options
 */
var SocketServer = function(server, options) {
  var eventEmitter = new events.EventEmitter();
  var nextSessionId = 0;
  var videoServer;

  this.on = eventEmitter.on.bind(eventEmitter);
  this.addListener = this.on;
  this.removeListener = eventEmitter.removeListener.bind(eventEmitter);

  var wsServer = options.WebSocketServer ? new options.WebSocketServer(server) : new WSServer(server);
  wsServer.on('connection', function(client) {
      return new VideoEncoder(client, videoServer, ++nextSessionId, {
        videoDir: options.videoDir,
        frameDir: options.frameDir,
        keepFrames: options.keepFrames,
        allowArbitraryFfmpegArguments: options.allowArbitraryFfmpegArguments,
      });
  }.bind(this));

  // This sucks and I hate the number of contortions I'd have to do to "do it right".
  this.setVideoServer = function(vs) {
    videoServer = vs;
  };

  /**
   * Close the socketserver
   * @todo make it no-op after it's closed?
   */
  this.close = function() {
    wsServer.close();
  };

  this.getSocketServer = function() {
    return wsServer;
  };
};

module.exports = SocketServer;

