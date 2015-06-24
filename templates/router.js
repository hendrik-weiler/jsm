namespace app;

Router = function(routes, authcallback) {
	this.routes = routes;
	window.onhashchange = function() {
		for(var i in routes) {
			if(routes[i].route == window.location.hash) {
				routes[i].controller.run();
			}
		}
	}
}
Router.prototype.check = function() {
	if(window.location.hash == '') {
		this.navigate(this.routes[0].route);
	} else {
		window.onhashchange();
	}
};
Router.prototype.navigate = function(to) {
	window.location.hash = to;
};