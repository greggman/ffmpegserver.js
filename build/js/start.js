(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else {
        root.FFMpegServer = {
          Video: factory(),
        };
    }
}(this, function () {

