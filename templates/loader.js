if(typeof jsm == 'undefined') jsm = {};

jsm.Loader = function() {

}
jsm.Loader.prototype.start = function(cb) {
	this.scriptTag('app.min.js', cb);
}
jsm.Loader.prototype.scriptTag = function(url,callback) {
    if(!url || !(typeof url === 'string')){return};
    var script = document.createElement('script');
    //if this is IE8 and below, handle onload differently
    if(typeof document.attachEvent === "object"){
        script.onreadystatechange = function(){
            //once the script is loaded, run the callback
            if (script.readyState === 'loaded'){
                if (callback){callback()};
            };
        };  
    } else {
        //this is not IE8 and below, so we can actually use onload
        script.onload = function(){
            //once the script is loaded, run the callback
            if (callback){callback()};
        };
    };
    //create the script and add it to the DOM
    script.src = url;
    document.getElementsByTagName('head')[0].appendChild(script);
}