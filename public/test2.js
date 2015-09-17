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
  var numFrames = framesPerSecond * 5; // a 5 second 60fps video
  var frameNum = 0;

  var progressElem = document.getElementById("progress");
  var progressNode = document.createTextNode("");
  progressElem.appendChild(progressNode);

  function onProgress(progress) {
    progressNode.nodeValue = (progress * 100).toFixed(1) + "%";
  }

  function showVideoLink(url, size) {
    size = size ? (" [size: " + (size / 1024 / 1024).toFixed(1) + "meg]") : " [unknown size]";
    var a = document.createElement("a");
    a.href = url;
    var filename = url;
    var slashNdx = filename.lastIndexOf("/");
    if (slashNdx >= 0) {
      filename = filename.substr(slashNdx + 1);
    }
    a.download = filename;
    a.appendChild(document.createTextNode(url + size));
    document.body.insertBefore(a, progressElem);
  }

  var capturer = new CCapture( {
    format: 'ffmpegserver',
    //workersPath: "3rdparty/",
    //format: 'gif',
    //verbose: true,
    framerate: framesPerSecond,
    onProgress: onProgress,
    //extension: ".mp4",
    //codec: "libx264",
  } );
  capturer.start();

  var container, stats, permalink, hex, color;
  var camera, cameraTarget, scene, renderer;

  var group, textMesh1, textMesh2, textGeo, material;
  var targetRotation = 0;

  var renderModel;
  var then = Date.now() * 0.001;

  init();
  animate();

  function rand(min, max) {
    if (max === undefined) {
      max = min;
      min = 0;
    }
    return Math.random() * (max - min) + min;
  }

  function init() {
    container = document.body;

    // CAMERA

    camera = new THREE.PerspectiveCamera( 30, 1, 1, 1500 );
    camera.position.set( 0, 400, 700 );

    cameraTarget = new THREE.Vector3( 0, 150, 0 );

    scene = createCubeScene( false );

    // RENDERER

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    container.appendChild( renderer.domElement );
    renderer.setSize( 1280, 720, false );
  }

  function createCubeScene( wireframe ) {
    // SCENE

    var scene = new THREE.Scene();
    scene.fog = new THREE.Fog( 0x000000, 250, 1400 );

    // LIGHTS

    var dirLight = new THREE.DirectionalLight( 0xffffff, 0.725 );
    dirLight.position.set( 200, 100, 100 ).normalize();
    scene.add( dirLight );

    var pointLight = new THREE.HemisphereLight( 0xddeeff, 0x806040, 0.5 );
    pointLight.position.set( -120, 0, 50 );
    scene.add( pointLight );

    var group = new THREE.Group();
    group.position.y = 120;

    var size = 50;
    var spread = size * 2.5;
    var geometry = new THREE.BoxGeometry( size, size, size );

    var materials = [];
    var num = 4;
    for ( var xx = -num; xx <= num; ++xx ) {
      for ( var yy = -num; yy <= num; ++yy ) {
        for ( var zz = -num; zz <= num; ++zz ) {
          var color = ( (( (xx / num * 0.5 + 0.5 ) * 255 ) | 0 ) <<  0 ) |
                ( (( (yy / num * 0.5 + 0.5 ) * 255 ) | 0 ) <<  8 ) |
                ( (( (zz / num * 0.5 + 0.5 ) * 255 ) | 0 ) << 16 ) ;
          var mat = new THREE.MeshLambertMaterial( { color: color, shading: THREE.FlatShading, wireframe: wireframe } );
          var model = new THREE.Mesh( geometry, mat );
          materials.push( mat );
          model.position.x = xx * spread;
          model.position.y = yy * spread;
          model.position.z = zz * spread;
          group.add( model );
        }
      }
    }

    scene.add( group );

    return {

      resize: function() {

        var lineWidth = Math.max(1, renderer.domElement.clientHeight / 30);
        materials.forEach( function( mat ) {

          mat.wireframeLinewidth = lineWidth;

        });

      },

      update: function(deltaTime) {

        group.rotation.z += deltaTime * 0.2;
        group.rotation.y += deltaTime * 0.11;

      },

      getScene: function() {

        return scene;

      },

      getCamera: function( renderer ) {

        camera.aspect = renderer.domElement.clientWidth / renderer.domElement.clientHeight;
        camera.updateProjectionMatrix();
        camera.lookAt( cameraTarget );
        return camera;

      },

    };
  }

  //

  function animate() {

    render();

    requestAnimationFrame( animate );

  }

  function render() {

    var now = Date.now() * 0.001;
    var deltaTime = now - then;
    then = now;

    scene.update(deltaTime);
    var renderScene = scene.getScene();

    if ( renderScene.fog ) {

      renderer.setClearColor( renderScene.fog.color );

    }

    var cam = scene.getCamera( renderer )

    renderer.render( renderScene, cam );
    capturer.capture( renderer.domElement );
    ++frameNum;
    if (frameNum < numFrames) {
      progressNode.nodeValue = "rendered frame# " + frameNum + " of " + numFrames;
    } else if (frameNum === numFrames) {
      capturer.stop();
      capturer.save(showVideoLink);
    }
  }

}());

