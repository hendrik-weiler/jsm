var glob = require("glob");
var readline = require('readline');
var fs = require('fs');
var os = require('os');
var path = require('path');
var jsmin = require('jsmin').jsmin;
var watch = require('watch');

var importRegex = /^import( +)?([\w\$.]+);/i;
var namespaceRegex = /^namespace( +)?([\w.]+);/i;
var firstVariableRegex = /^(var)?( +)?([\w]+)(.prototype)?(.[\w]+)( {0,}?=)/;

var filesToImport = [];
var namespacesToGenerate = [];
var namespacesGenerated = [];

function inArray(needle, haystack) {
    var length = haystack.length;
    for(var i = 0; i < length; i++) {
        if(haystack[i] == needle) return true;
    }
    return false;
}

function addFileImport(file) {
	if(!inArray(file, filesToImport)) {
		filesToImport.push(file);
	}
}

function namespacesAdd(namespace) {
	if(!inArray(namespace, namespacesToGenerate)) {
		namespacesToGenerate.push(namespace);
	}
}

function finishedReading(srcfolder, buildpath) {
  var buildContent = '';

  for (var i = filesToImport.length - 1; i >= 0; i--) {
  	var fileToLoad = filesToImport[i].replace(/\./g,'/').replace(/\$/g,'..') + '.js';
  	var fileToLoadX = (srcfolder+'/'+fileToLoad).replace('//','/');
  	console.log(fileToLoadX)
		if (fs.existsSync(fileToLoadX)) { 
		  var contents = fs.readFileSync(fileToLoadX).toString();
		  buildContent += contents;
		} else {
			buildContent += 'console.log("Could not import file: '+fileToLoad+'");' + os.EOL;
		}
  };

  for (var i = namespacesToGenerate.length - 1; i >= 0; i--) {
  	var spacesSplit = namespacesToGenerate[i].namespace.split('.'),
  			toCreate = [];
  	for (var j = 0; j < spacesSplit.length; j++) {
  		toCreate.push(spacesSplit[j]);
  		var joined = toCreate.join('.');
  		if(!inArray(joined, namespacesGenerated)) {
  			buildContent += 'if(typeof '+joined+'=="undefined") ' + joined + ' = {};' + os.EOL;
  			namespacesGenerated.push(joined);
  		}
  	};
  	buildContent += namespacesToGenerate[i].content;
  };

  var minified = jsmin(buildContent);

  fs.truncate(buildpath, 0, function(){
    fs.writeFile(buildpath,minified, function(err) {
        if(err) {
            return console.log(err);
        }

        console.log("The file was saved!");
    }); 
  });

}

function readFileByLine(pathToFile, callback, endoffilecallback) {
  fs.readFile(pathToFile, function (err, data) {
    var bufferString = data.toString(); 
    var bufferStringSplit = bufferString.split('\n'); 
    for (var i = 0; i < bufferStringSplit.length; i++) {
    	callback(bufferStringSplit[i]);
    	if(i==bufferStringSplit.length-1) {
    		endoffilecallback();
    	}
    };
  });
}

function generate(srcfolder, buildpath) {

  glob(srcfolder+"/**/*.js", function (er, files) {
    for (var i = files.length - 1; i >= 0; i--) {

    	var linecounter = 0;
    	var filecounter = 0;
    	var currentNamespace = '';
    	var currentClassName = '';
    	var fileContent = '';
  		readFileByLine(files[i],function(line){
  				var toContent = true;
  			  linecounter++;
  		    if(importRegex.test(line)) {
  		    	var groups = importRegex.exec(line);
  		    	var string = groups[0].replace('import','').replace(';','').trim();
  		    	addFileImport(string);
  		    	toContent = false;
  		    }
  		    if(namespaceRegex.test(line)) {
  		    	var groups = namespaceRegex.exec(line);
  		    	var string = groups[0].replace('namespace','').replace(';','').trim();
  		    	currentNamespace = string;
  		    	toContent = false;
  		    }
  		    if(firstVariableRegex.test(line)) {
  		    	var groups = firstVariableRegex.exec(line);
  		    	var string = groups[3].trim();
  		    	currentClassName = string;
  		    	line = currentNamespace + '.' + line.replace('var ','');
  		    }
  		    if(toContent) fileContent += line + os.EOL;
  		}, function() {
  			filecounter++;
      	namespacesAdd({
      		namespace : currentNamespace,
      		className : currentClassName,
      		content : fileContent
      	});

      	fileContent = '';

  			if(filecounter==files.length) {
  				finishedReading(srcfolder, buildpath);
  			}
  		});

    };
  });

}

exports.jsmWatch = function(srcfolder, buildpath) {
console.log('Reading folder ' + srcfolder + ' ...');
  watch.watchTree(srcfolder, function (f, curr, prev) {
    if (typeof f == "object" && prev === null && curr === null) {
      console.log('Started watching ' + srcfolder);
    } else if (prev === null) {
      // f is a new file
      generate(srcfolder, buildpath);
    } else if (curr.nlink === 0) {
      // f was removed
      generate(srcfolder, buildpath);
    } else {
      // f was changed
      generate(srcfolder, buildpath);
    }
  });
}