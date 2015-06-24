namespace app;

Controller = function(cb) {
	this.template = '';
	this.cb = cb;
}
Controller.prototype.run = function() {
	console.log(this);
	this.cb();
};