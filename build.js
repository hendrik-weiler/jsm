if(typeof test=="undefined")test={};if(typeof test.a=="undefined")test.a={};if(typeof test.a.b=="undefined")test.a.b={};if(typeof test.a.b.c=="undefined")test.a.b.c={};test.a.b.c.Test=function(){}
test.a.b.c.Test.prototype.hallo=function(){}
test.a.b.c.Help=function(){}
if(typeof test.view=="undefined")test.view={};test.view.Test=function(){}
if(typeof test.x=="undefined")test.x={};test.x.View=(function(window,document,undefined){return{test:1}})(window,document)