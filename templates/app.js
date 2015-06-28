namespace app;

App = function(config){
	this.config = config;
};
App.prototype.start = function() {
	document.title = 'Generated App';
	var self = this;
	var view = new app.View();
	var router = new app.Router([
		{
			route : '#start',
			public : true,
			controller : new app.Controller(function() {
				template "start.html" as start;
				self.config.canvas.innerHTML = view.render(start,{
					title : 'Welcome!'
				});
			})
		},
		{
			route : '#test',
			public : false,
			controller : new app.Controller(function() {
				template "test.html" as test;
				self.config.canvas.innerHTML = view.render(test,{
					
				});
			})
		}
	], function(cb) {
		// Authentication
		cb(true,0); // second parameter determines route index by failed auth redirection
	});
	router.check();

};