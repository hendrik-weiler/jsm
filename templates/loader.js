if(typeof jsm == 'undefined') jsm = {};

jsm.Loader = function() {

}
jsm.Loader.prototype.start = function(cb) {
	this.scriptTag('app.min.js', cb);
}
jsm.Loader.prototype.scriptTag = function(src, callback) {

    var s = document.createElement('script');
    s.type = 'text/' + (src.type || 'javascript');
    s.src = src.src || src;
    s.async = false;

    s.onreadystatechange = s.onload = function () {

        var state = s.readyState;

        if (!callback.done && (!state || /loaded|complete/.test(state))) {
            callback.done = true;
            callback();
        }
    };

    // use body if available. more safe in IE
    (document.body || head).appendChild(s);
}