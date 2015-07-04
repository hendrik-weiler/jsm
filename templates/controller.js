namespace app;

Controller = function(cb) {
	this.template = '';
	this.cb = cb;
}
Controller.prototype.run = function() {
	this.cb();
};