template "start.html" as start;

namespace app;

App = function(config){
	config.canvas.innerHTML = start;
};
App.prototype.start = function() {
	
};