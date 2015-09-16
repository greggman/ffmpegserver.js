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
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
"use strict";

var debug     = require('debug')('test-utils');
var events    = require('events');
var Promise   = require('bluebird');
var request   = require('request');
var stream    = require('stream');
var util      = require('util');

var getP = function(url) {
  return new Promise(function(fulfill, reject) {
    request.get(url, function(err, res, body) {
      if (err || res.statusCode !== 200) {
        reject(err || res.body.msg);
      } else {
        fulfill(res, body);
      }
    });
  });
};

var createServer = function() {
  return new Promise(function(resolve, reject) {
    var server = new VideoServer({
      port: 8087,
    }, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(server);
      }
    });
  });
};

var createMockHTTPServer = function(callback) {
  var MockHTTPServer = function() {
    var eventEmitter = new events.EventEmitter();
    var self = this;

    this.once = eventEmitter.once.bind(eventEmitter);
    this.on = eventEmitter.on.bind(eventEmitter);
    this.removeListener = eventEmitter.removeListener.bind(eventEmitter);
    this.emit = eventEmitter.emit.bind(eventEmitter);

    this.listen = function() {
      eventEmitter.emit('listening', self, 0);
    };

    this.close = function() {
    };

    this.handleRequest = function(req, res) {
      callback(req, res);
    }
  };

  return new MockHTTPServer(callback);
};

var createServerWithMocks = function(options, callback) {

  var LocalWebSocketServer = require('../../server/localwebsocketserver');
  var VideoServer          = require('../../server/video-server');
  var SocketServer         = require('../../server/socket-server.js');

  var MockResponse = function(callback) {
    stream.Writable.call(this);
    this.headers = {};
    this.statusCode = -1;
    this.body = undefined;
//    this.emitter = new events.EventEmitter();
this.AAFUCK = "FUCK";
    this.setHeader = function(key, value) {
debug("set header:" + key + "=" + value);
      this.headers[key] = value;
    }.bind(this);

    this.writeHead = function(statusCode, headers) {
debug("write head");
      this.statusCode = statusCode;
      if (headers) {
        Object.keys(headers).forEach(function(key) {
          this.headers[key] = headers[key];
        }.bind(this));
      }
      return this;
    }.bind(this);

//    this.write = function(data, encoding) {
//debug("write data" + data.length);
//      if (this.body === undefined) {
//        this.body = "";
//      }
//      this.body += data.toString(encoding);
//      return this;
//    }.bind(this);
//
//    this.end = function(data, encoding) {
//debug("end");
//      if (data) {
//        this.write(data, encoding);
//      }
//      this.emitter.emit('finish');
//      var fn = callback;
//      callback = undefined;
//      setTimeout(function() {
//        fn(this);
//      }.bind(this), 0);
//    }.bind(this);

//    this.on = this.emitter.on.bind(this.emitter);
//    this.removeListener = this.emitter.removeListener.bind(this.emitter);
//    this.emit = this.emitter.emit.bind(this.emitter);
//    this.once = this.emitter.once.bind(this.emitter);
  };

  util.inherits(MockResponse, stream.Writable);

  MockResponse.prototype._write = function(chunk, encoding, done) {
    if (this.body === undefined) {
      this.body = "";
    }
    this.body += data.toString(encoding);
    done();
  };

  var MockedServer = function(callback) {
    var socketServer = new SocketServer(httpServer, {
      WebSocketServer: LocalWebSocketServer,
      frameDir: options.frameDir,
      videoDir: options.videoDir,
    });
    var videoServer = new VideoServer({
      port: 0, // should not be used.
      httpServerFactory: createMockHTTPServer,
      socketServer: socketServer,
      frameDir: options.frameDir,
      videoDir: options.videoDir,
    }, callback);
    socketServer.setVideoServer(videoServer);
    var httpServer = videoServer.getServer();

    this.close = function() {
      videoServer.close();
    };

    var request = function(req, callback) {
      var eventEmitter = new events.EventEmitter();
      req.on = eventEmitter.on.bind(eventEmitter);
      req.once = eventEmitter.once.bind(eventEmitter);
      req.addListener = eventEmitter.addListener.bind(eventEmitter);
      var res = new MockResponse(callback);
      httpServer.handleRequest(req, res);
      return eventEmitter;
    };

    var getP = function(url) {
      return new Promise(function(resolve /*, reject */) {
        request({
          url: url,
          method: 'GET',
          headers: {
          },
        }, resolve);
      });
    };

    var postP = function(url, body) {
      return new Promise(function(resolve /*, reject */) {
        var emitter = request({
          url: url,
          method: 'POST',
          headers: {
            "content-type": "application/json",
            "content-length": Buffer.byteLength(body, 'utf8'),
          },
        }, resolve);
        emitter.emit('data', body);
        emitter.emit('end');
        emitter.emit('close');
      });
    };

    var postJSONP = function(url, obj) {
      return postP(url, JSON.stringify(obj));
    };

    var getSocketServer = function() {
      return socketServer.getSocketServer();
    };

    this.getP = getP;
    this.postP = postP;
    this.postJSONP = postJSONP;
    this.request = request;
    this.getSocketServer = getSocketServer;
  };

  return new MockedServer(callback);
};

exports.getP = getP;
exports.createServer = createServer;
exports.createMockHTTPServer = createMockHTTPServer;
exports.createServerWithMocks = createServerWithMocks;


