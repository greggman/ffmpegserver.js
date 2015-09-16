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
(function() {
  "use strict";

  var framesPerSecond = 60;
  var numFrames = 1000;  // framesPerSecond * 60 * 2;
  var thickness = 100;
  var speed = 4;
  var frameNum = 0;

  var canvas = document.getElementById("c");
  var ctx = canvas.getContext("2d");
  canvas.width = 1280;
  canvas.height = 720;

  var progressElem = document.getElementById("progress");
  var progressNode = document.createTextNode("");
  progressElem.appendChild(progressNode);

  function onProgress(progress) {
    progressNode.nodeValue = (progress * 100).toFixed(1) + "%";
  }

  function showVideoLink(url, size) {
    size = size || "unknown size";
    var a = document.createElement("a");
    a.href = url;
    var filename = url;
    var slashNdx = filename.lastIndexOf("/");
    if (slashNdx >= 0) {
      filename = filename.substr(slashNdx + 1);
    }
    a.download = filename;
    a.appendChild(document.createTextNode(url + " [" + size + "]"));
    document.body.appendChild(a);
  }

  var capturer = new CCapture( {
    format: 'ffmpegserver',
    //workersPath: "3rdparty/",
    //format: 'gif',
    verbose: false,
    framerate: framesPerSecond,
    maxQueuedFrames: 4000,
    onProgress: onProgress,
    extension: ".flv",
    codec: "flv1",
  } );
  capturer.start();

  function drawLines(ctx) {
    for (var xx = -canvas.width; xx < canvas.width; xx += 2) {
      var l = (xx - (-canvas.width)) / (canvas.width * 2);
      ctx.beginPath();
      ctx.moveTo(xx, -canvas.height);
      ctx.lineTo(xx,  canvas.height);
      ctx.strokeStyle = "hsla(" + ((l * 360 * 24) % 360) + ",100%,50%,0.5)";
      ctx.stroke();
    }
  }

  function render(time) {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#FFF";
    for (var xx = 0; xx < canvas.width + thickness * 2; xx += thickness * 2) {
      var x = xx - (frameNum * speed % (thickness * 2));
      ctx.fillRect(x, 0, thickness, canvas.height);
    }

    ctx.save();
    ctx.globalCompositeOperation = "difference";

    ctx.font = "400px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(frameNum, canvas.width / 2, canvas.height / 2);


    ctx.save();
    ctx.translate(canvas.width * 0.5, canvas.height * 0.5);
    ctx.rotate(frameNum * 0.01);
    ctx.translate(canvas.width * 0.25, 0);
    drawLines(ctx);
    ctx.restore();

    ctx.save();
    ctx.translate(canvas.width * 0.5, canvas.height * 0.5);
    ctx.rotate(frameNum * -0.013);
    ctx.translate(canvas.width * 0.37, 0);
    drawLines(ctx);
    ctx.restore();

    ctx.restore();

    capturer.capture(canvas);

    ++frameNum;
    if (frameNum === numFrames) {
      capturer.stop();
      capturer.save(showVideoLink);
    } else {
      requestAnimationFrame(render);
    }
  }
  requestAnimationFrame(render);
}());

