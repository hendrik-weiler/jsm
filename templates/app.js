namespace app;

App = function(config){
	this.config = config;
};
App.prototype.start = function() {
	var self = this;
	var router = new app.Router([
		{
			route : '#start',
			controller : new app.Controller(function() {
				template "start.html" as start;
				self.config.canvas.innerHTML = start;
			})
		},
		{
			route : '#test',
			controller : new app.Controller(function() {
				template "test.html" as test;
				self.config.canvas.innerHTML = test;
			})
		}
	]);
	router.check();

};