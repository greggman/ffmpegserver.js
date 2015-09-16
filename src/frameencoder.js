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
    './virtualsocket',
  ], function(
     VirtualSocket) {
  'use strict';

  function FrameEncoder(options) {
    options = options || {};
    var log = options.quiet ? function() {} : console.log.bind(console);
    var _connected = false;
    var _socket;
    var _eventListeners = {};

    var emit_ = function(eventType, args) {
      var fn = _eventListeners[eventType];
      if (fn) {
        fn.apply(this, args);
      }
    }.bind(this);

    this.addEventListener = function(eventType, listener) {
      _eventListeners[eventType] = listener;
    };
    this.on = this.addEventListener;

    /**
     * @callback GameServer~Listener
     * @param {Object} data data from sender.
     */

    /**
     * Removes an eventListener
     * @param {string} eventType name of event
     */
    this.removeEventListener = function(eventType) {
      _eventListeners[eventType] = undefined;
    };

    this.start = function(options) {
      send_({
        cmd: 'start',
        data: options,
      })
    };

    this.add = function(canvas) {
      send_({
        cmd: 'frame',
        data: {
          dataURL: canvas.toDataURL(),
        }
      });
    };

    this.end = function() {
      send_({
        cmd: 'end',
      });
    }

    var disconnected_ = function() {
      log("disconnected");
      _connected = false;
      emit_('disconnect');
    };

    var connected_ = function() {
      log("connected");
      _connected = true;
      emit_('connect');
    }.bind(this);

    var processMessage_ = function(msg) {
      var fn = _eventListeners[msg.cmd];
      if (fn) {
        fn(msg.data);
      } else {
        console.error("Unknown Message: " + msg.cmd);
      }
    };

    _socket = options.socket || new VirtualSocket(options);
    _socket.on('connect', connected_.bind(this));  // eslint-disable-line
    _socket.on('message', processMessage_.bind(this));
    _socket.on('disconnect', disconnected_.bind(this));  // eslint-disable-line

    var send_ = function(msg) {
      if (_socket.isConnected()) {
        _socket.send(msg);
      }
    };

  };

  return FrameEncoder;

});

