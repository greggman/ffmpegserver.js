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

var debug        = require('debug')('video-encoder');
var ffmpeg       = require('ffmpeg-static');
var fs           = require('fs');
var path         = require('path');
var Promise      = require('bluebird');
var utils        = require('../lib/utils');

console.log(Promise.promisify);
console.log(utils.execute);
var executeP = Promise.promisify(utils.execute);

/**
 * @constructor
 * @param {!Client} client The websocket
 * @param {string} id a unique id
 */
function VideoEncoder(client, id, options) {
  var count = 0;
  var name;
  var frames = [];
  var sendCmd;

  debug("" + id + ": start encoder");

  function safeName(name) {
    return name.substr(0, 30).replace(/[^0-9a-zA-Z-]/g, '_');
  }

  var handleStart = function(data) {
    data = data || {};
// TODO: check it's not started
    count = 0;
    name = safeName((data.name || "untitled") + "-" + id);
    frames = [];
    debug("start: " + name);
  };

  var EXPECTED_HEADER = 'data:image/png;base64,';
  var handleFrame = function(data) {
    var dataURL = data.dataURL;
    if (dataURL.substr(0, EXPECTED_HEADER.length) !== EXPECTED_HEADER) {
      console.error("bad data URL");
      return;
    }
    var frameNum = count++;
    var filename = path.join(options.frameDir, name + "-" + frameNum + ".png");
    debug("write: " + filename);
    var image = dataURL.substr(EXPECTED_HEADER.length);
    fs.writeFile(filename, image, 'base64', function(err) {
      if (err) {
        console.error(err);
      } else {
        frames.push(filename);
        sendCmd("frame", { frameNum: frameNum })
        console.log('Saved Screenshot: ' + filename);
      }
    });
  };

  var handleEnd = function(data) {
    var videoname = path.join(options.videoDir, name + ".mp4");
    var framesname = path.join(options.frameDir, name + "-%d.png");
    console.log("converting " + framesname + " to " + videoname);
    var args = [
      "-framerate", "30",
      "-pattern_type", "sequence",
      "-start_number", "0",
      "-i", framesname,
      "-vcodec",
      "mpeg4",
      videoname,
    ];
    executeP(ffmpeg.path, args)
    .then(function(result) {
      console.log("converted frames to: " + videoname);
      sendCmd("end", { name: name });
// Delete frames!
    })
    .catch(function(result) {
    })
  };

  var messageHandlers = {
    start: handleStart,
    frame: handleFrame,
    end: handleEnd,
  };

  var onMessage = function(message) {
    var cmd = message.cmd;
    var handler = messageHandlers[cmd];
    if (!handler) {
      console.error("unknown message: " + cmd);
      return;
    }

    handler(message.data);
  };

  /**
   * Disconnect this player. Drop their WebSocket connection.
   */
  var disconnect = function() {
    client.on('message', undefined);
    client.on('disconnect', undefined);
    client.close();
  };

  /**
   * Sends a message to the browser
   * @param {object} msg data to send.
   */
  var send = function(msg) {
    try {
      client.send(msg);
    } catch (e) {
      console.error("error sending to client");
      console.error(e);
      console.error("disconnecting");
      disconnect();
    }
  };

  sendCmd = function(cmd, data) {
    send({cmd: cmd, data: data});
  };

  var onDisconnect = function() {
    debug("" + id + ": disconnected");
    disconnect();
  };

  client.on('message', onMessage);
  client.on('disconnect', onDisconnect);


};


module.exports = VideoEncoder;

