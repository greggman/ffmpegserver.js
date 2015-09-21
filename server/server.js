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

'use strict';

var path = require('path');

var optionSpec = {
  options: [
    { option: 'help', alias: 'h', type: 'Boolean',  description: 'displays help'},
    { option: 'port', alias: 'p', type: 'Int',      description: 'port',  default: '8080'},
    { option: 'base-dir',         type: 'String',   description: 'folder to serve', default: 'public'},
    { option: 'video-dir',        type: 'String',   description: 'folder to save video files to', default: 'output'},
    { option: 'frame-dir',        type: 'String',   description: 'folder to save frames to', default: 'output'},
    { option: 'keep-frames',      type: 'Boolean',  description: 'do not delete the frames after encoding'},
    { option: 'allow-arbitrary-ffmpeg-arguments',      type: 'Boolean',  description: 'allow arbitrary ffmpeg arguments passed from browser', default: "false"},
  ],
  helpStyle: {
    typeSeparator: '=',
    descriptionSeparator: ' : ',
    initialIndent: 4,
  },
};

var optionator = require('optionator')(optionSpec);

try {
  var args = optionator.parse(process.argv);
} catch (e) {
  console.error(e);
  process.exit(1);  // eslint-disable-line
}

var printHelp = function() {
  console.log(optionator.generateHelp());
  process.exit(0);  // eslint-disable-line
};

if (args.help) {
  printHelp();
}

function startServer() {
  var VideoServer = require('./video-server');
  args.videoDir = path.join(process.cwd(), args.videoDir);
  args.frameDir = path.join(process.cwd(), args.frameDir);
  var server = new VideoServer(args);
}

startServer();






