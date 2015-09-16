define('main', [
    'src/ffmpegserver',
  ], function(
    ffmpegserver
  ) {
    return ffmpegserver;
})

require(['main'], function(main) {
  return main;
}, undefined, true);   // forceSync = true




