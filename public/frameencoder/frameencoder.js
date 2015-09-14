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
        fn(msg);
      } else {
        console.error("Unknown Message: " + msg.cmd);
      }
    };

    _socket = options.socket || new VirtualSocket();
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

