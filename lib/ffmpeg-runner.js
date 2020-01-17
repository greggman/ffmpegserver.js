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

var debug        = require('debug')('ffmpeg-runner');
var EventEmitter = require('events').EventEmitter;
var ffmpeg       = require('ffmpeg-static');

function FFMpegRunner(args) {
  var emitter = new EventEmitter();
  var spawn = require('child_process').spawn;
  var cmd = ffmpeg;

  debug(cmd + '"' + args.join('" "') + '"');
  var proc = spawn(cmd, args);
  var stdout = [];
  var stderr = [];
  var highestFrameNumber = -1;
  var frameNumRE = /frame= *(\d+) /;

  proc.stdout.setEncoding('utf8');
  proc.stdout.on('data', function (data) {
      var str = data.toString()
      var lines = str.split(/(\r?\n)/g);
      stdout = stdout.concat(lines);
  });

  proc.stderr.setEncoding('utf8');
  proc.stderr.on('data', function (data) {
      var str = data.toString();
      var fndx = str.lastIndexOf("frame=");
      if (fndx >= 0) {
        var m = frameNumRE.exec(str.substr(fndx));
        if (m) {
          emitter.emit('frame', parseInt(m[1]));
        }
      }
      var lines = str.split(/(\r?\n)/g);
      stderr = stderr.concat(lines);
  });

  proc.on('close', function (code) {
    var code = parseInt(code);
    var result = {
      code: code,
      stdout: stdout.join(""),
      stderr: stderr.join(""),
    };
    if (code !== 0) {
      emitter.emit('error', result)
    } else {
      emitter.emit('done', result);
    }
  });

  this.on = emitter.on.bind(emitter);
}

module.exports = FFMpegRunner;


