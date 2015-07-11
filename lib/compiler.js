var glob = require("glob");
var readline = require('readline');
var fs = require('fs');
var os = require('os');
var path = require('path');
var jsmin = require('jsmin').jsmin;
var watch = require('watch');
var ini = require('ini');
var chprocess = require('child_process');
var CleanCSS = require('clean-css');

var importRegex = /^import( +)?([\w\$.]+);/i;
var namespaceRegex = /^namespace( +)?([\w.]+);/i;
var firstVariableRegex = /^([\w]+)(.prototype)?(.[\w]+)( {0,}?=)/;
var templateRegex = /template( +)?\"([\w\$.\/]+)\"( +)?as( +)?([\w\$.\/]+);/i;

var filesToImport = [];
var namespacesToGenerate = [];
var namespacesGenerated = [];
var templatesReferences = [];

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

function finishedReading(srcfolder, buildpath, project) {
  var buildContent = '';

  var cwd = process.cwd();
  var header = fs.readFileSync(cwd + '/' + project.header, "utf-8");
  header = header.replace('{{version}}',project.version);
  header = header.replace('{{revision}}',project.revision);

  for (var i = filesToImport.length - 1; i >= 0; i--) {
  	var fileToLoad = filesToImport[i].replace(/\./g,'/').replace(/\$/g,'..') + '.js';
  	var fileToLoadX = (srcfolder+'/'+fileToLoad).replace('//','/');

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

  for (var i = templatesReferences.length - 1; i >= 0; i--) {
    var ref = templatesReferences[i];
    buildContent += ref.variable + ' = document.getElementById("'+ project.templatesFolder + '/' + ref.id +'").innerHTML;' + os.EOL;
  };

  var minified = jsmin(buildContent);
  if(project.debug) {
    minified = buildContent;
  }

  minified = header + os.EOL + minified + os.EOL;

  fs.truncate(buildpath, 0, function(){
    fs.writeFile(buildpath,minified, function(err) {
        if(err) {
            return console.log(err);
        }

        filesToImport = [];
        namespacesToGenerate = [];
        namespacesGenerated = [];
        templatesReferences = [];
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

function generate(srcfolder, buildpath , project) {

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
          if(templateRegex.test(line)) {
            var groups = templateRegex.exec(line);
            templatesReferences.push({
              id : groups[2],
              variable : groups[5]
            });
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
  				finishedReading(srcfolder, buildpath, project);
  			}
  		});

    };
  });

}

function updateRevision(cwd) {

  var iniResult = ini.parse(fs.readFileSync(cwd + '/jsm.ini','utf8'));
  if(typeof iniResult.revision == 'undefined') {
    iniResult.revision = 0;
  }
  iniResult.revision = parseInt(iniResult.revision) + 1;

  fs.writeFileSync(cwd + '/jsm.ini', ini.encode(iniResult), 'utf8');

  return iniResult;
}

function minifyHTML(html) {
    var search = [
        new RegExp(' {2,}','g'),  
        new RegExp('<!--.*?-->|\t|(?:\r?\n[ \t]*)+','g'),  
    ];

    var replace = [
        ' ',
        ''
    ];

    for (var i = 0; i < search.length; i++) {
      html = html.replace(search[i],replace[i]);
    };

    return html;
}

function generateHTML(srcfolder, buildpath, project,cwd) {
  var html = '';
  glob(srcfolder+"/**/*.html", function (er, files) {
    for (var i = files.length - 1; i >= 0; i--) {
      var id = files[i].replace(cwd.replace(/\\/g,'/'),'');
      id = id.slice( 1 );
      html += '<script type="template" id="'+id+'">';
      html += fs.readFileSync(files[i],'utf8');
      html += '</script>';
    }
    var main = fs.readFileSync(cwd + '/' + project.main,'utf8');
    main = main.replace('{{mainScript}}',project.mainScript);
    main = main.replace('{{templates}}',html);
    main = main.replace('{{version}}',project.version);
    main = main.replace('{{revision}}',project.revision);
    main = main.replace('{{images}}',project.imageFolder);
    main = main.replace('{{canvasId}}',project.canvasId);
    var result = minifyHTML(main);
    fs.truncate(buildpath, 0, function(){
      fs.writeFileSync(buildpath, result, 'utf8');
    });
  });
}

var copyRecursiveSync = function(src, dest) {
  var exists = fs.existsSync(src);
  var stats = exists && fs.statSync(src);
  var isDirectory = exists && stats.isDirectory();
  if (exists && isDirectory) {
    if(!fs.existsSync(dest)) { fs.mkdirSync(dest); }
    fs.readdirSync(src).forEach(function(childItemName) {
      copyRecursiveSync(path.join(src, childItemName),
                        path.join(dest, childItemName));
    });
  } else {
    if(fs.existsSync(dest)) {
      fs.unlinkSync(dest);
    }
    fs.linkSync(src, dest);
  }
};

var deleteFolderRecursive = function(path) {
  if( fs.existsSync(path) ) {
    fs.readdirSync(path).forEach(function(file,index){
      var curPath = path + "/" + file;
      if(fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};

function build(cwd, project) {
  project = updateRevision(cwd);
  var buildpath = cwd + '/' + project.buildPath;

  if (!fs.existsSync(buildpath)){
      fs.mkdirSync(buildpath);
  }

  var appMin = buildpath + '/app.min.js';
  var appFolder = cwd + '/' + project.appFolder;
  generate(appFolder,appMin, project);

  var templateFolder = cwd + '/' + project.templatesFolder;
  var templateMain = buildpath + '/' + project.main;
  generateHTML(templateFolder,templateMain, project,cwd);

  deleteFolderRecursive(buildpath + '/' + project.vendorFolder);
  deleteFolderRecursive(buildpath + '/' + project.cssFolder);
  deleteFolderRecursive(buildpath + '/' + project.imageFolder);
  copyRecursiveSync(cwd + '/' + project.vendorFolder, buildpath + '/' + project.vendorFolder);
  copyRecursiveSync(cwd + '/' + project.cssFolder, buildpath + '/' + project.cssFolder);
  copyRecursiveSync(cwd + '/' + project.imageFolder, buildpath + '/' + project.imageFolder);
  copyRecursiveSync(cwd + '/' + project.publicFolder, buildpath);

  var projloaderpath = cwd + '/' + project.vendorFolder + '/loader.js';
  var buildloaderpath = buildpath + '/' + project.vendorFolder + '/loader.js';
  if (fs.existsSync(projloaderpath) && !project.debug) {
    var loader = fs.readFileSync(projloaderpath, "utf-8");
    var minified = jsmin(loader.toString());
    fs.truncate(buildloaderpath, 0, function(){
      fs.writeFile(buildloaderpath,minified, function(err) {
          if(err) {
              return console.log(err);
          }

      });
    });
  }
  var files = glob.sync(cwd + '/' + project.cssFolder+"/**/*.css");
  for (var i = 0; i < files.length; i++) {

    var filepath = files[i].toString();
    var buildfilepath = filepath.replace(project.cssFolder, project.buildPath + '/' + project.cssFolder).toString();
    if(!/.min.css/.test(filepath)) {

      var filecontent = fs.readFileSync(filepath, { encoding: 'utf8' });
      filecontent = filecontent.toString('ascii', 0, filecontent.length);

      var minified = new CleanCSS().minify(filecontent).styles;
      fs.unlinkSync(buildfilepath);
      fs.writeFileSync(buildfilepath+'s',minified);
      fs.renameSync(buildfilepath+'s', buildfilepath);
    }
    
  }

  console.log("Project was build on revision " + project.revision);
}

exports.buildCLI = function() {
  var cwd = process.cwd();
  if (fs.existsSync( cwd + '/jsm.ini' )) {
    var iniResult = fs.readFileSync(cwd + '/jsm.ini', "utf-8");
    build(cwd, ini.parse(iniResult));
  } else {
    console.log('Current directory is not a jsm project');
  }
}

exports.create = function(folder) {
    var iniFile = 'jsm.ini';

    var file = {
      main : 'index.html',
      mainScript : 'app.App',
      appFolder : 'app',
      cssFolder : 'stylesheets',
      vendorFolder : 'vendor',
      imageFolder : 'image',
      buildPath : '_build',
      publicFolder : 'public',
      templatesFolder : 'templates',
      canvasId : 'canvas',
      header : 'header.txt',
      debug : true,
      version : 0.01,
      revision : 0
    }

    if (!fs.existsSync(folder)){
        fs.mkdirSync(folder);
    }

    folder = folder+'/';

    if (!fs.existsSync(folder+iniFile)) { 
      fs.writeFile(folder+iniFile,ini.encode(file), function(err) {
          if(err) {
              return console.log(err);
          }

          if (!fs.existsSync( folder+'/'+file.header ))
          {
              fs.writeFileSync(folder+'/'+file.header, fs.readFileSync(__dirname + '/../templates/'+file.header), 'utf8');
          }

          if (!fs.existsSync( folder+'/.htaccess' ))
          {
              fs.writeFileSync(folder+'/.htaccess', fs.readFileSync(__dirname + '/../templates/.htaccess'), 'utf8');
          }

          if (!fs.existsSync(folder+file.publicFolder)){
              fs.mkdirSync(folder+file.publicFolder);
          }

          if (!fs.existsSync(folder+file.appFolder)){
              fs.mkdirSync(folder+file.appFolder);

              if (!fs.existsSync( folder+file.appFolder+'/app.js' ))
              {
                  fs.writeFileSync(folder+file.appFolder+'/app.js', fs.readFileSync(__dirname + '/../templates/app.js'), 'utf8');
              }

              if (!fs.existsSync( folder+file.appFolder+'/router.js' ))
              {
                  fs.writeFileSync(folder+file.appFolder+'/router.js', fs.readFileSync(__dirname + '/../templates/router.js'), 'utf8');
              }

              if (!fs.existsSync( folder+file.appFolder+'/controller.js' ))
              {
                  fs.writeFileSync(folder+file.appFolder+'/controller.js', fs.readFileSync(__dirname + '/../templates/controller.js'), 'utf8');
              }

              if (!fs.existsSync( folder+file.appFolder+'/view.js' ))
              {
                  fs.writeFileSync(folder+file.appFolder+'/view.js', fs.readFileSync(__dirname + '/../templates/view.js'), 'utf8');
              }

          }

          if (!fs.existsSync(folder+file.cssFolder)){
              fs.mkdirSync(folder+file.cssFolder);

              if (!fs.existsSync( folder+file.cssFolder+'/jsm.css' ))
              {
                  fs.writeFileSync(folder+file.cssFolder+'/jsm.css', fs.readFileSync(__dirname + '/../templates/jsm.css'), 'utf8');
              }

              if (!fs.existsSync( folder+file.cssFolder+'/style.css' ))
              {
                  fs.writeFileSync(folder+file.cssFolder+'/style.css', fs.readFileSync(__dirname + '/../templates/style.css'), 'utf8');
              }

              if (!fs.existsSync( folder+file.cssFolder+'/bootstrap.min.css' ))
              {
                  fs.writeFileSync(folder+file.cssFolder+'/bootstrap.min.css', fs.readFileSync(__dirname + '/../templates/bootstrap.min.css'), 'utf8');
              }
          }

          if (!fs.existsSync(folder+file.imageFolder)){
              fs.mkdirSync(folder+file.imageFolder);

              fs.createReadStream(__dirname + '/../templates/loader.gif').pipe(fs.createWriteStream(folder+file.imageFolder+'/loader.gif'));
          }

          if (!fs.existsSync(folder+file.vendorFolder)){
              fs.mkdirSync(folder+file.vendorFolder);

              if (!fs.existsSync( folder+file.vendorFolder+'/loader.js' ))
              {
                  fs.writeFileSync(folder+file.vendorFolder+'/loader.js', fs.readFileSync(__dirname + '/../templates/loader.js'), 'utf8');
              }
          }

          if (!fs.existsSync(folder+file.templatesFolder)){
              fs.mkdirSync(folder+file.templatesFolder);

              if (!fs.existsSync( folder+file.templatesFolder+'/start.html' ))
              {
                  fs.writeFileSync(folder+file.templatesFolder+'/start.html', fs.readFileSync(__dirname + '/../templates/start.html'), 'utf8');
              }

              if (!fs.existsSync( folder+file.templatesFolder+'/test.html' ))
              {
                  fs.writeFileSync(folder+file.templatesFolder+'/test.html', fs.readFileSync(__dirname + '/../templates/test.html'), 'utf8');
              }
          }

          if (!fs.existsSync( folder+file.main ))
          {
              fs.writeFileSync(folder+file.main, fs.readFileSync(__dirname + '/../templates/index.html'), 'utf8');
          }

          console.log("The project was created.");
      }); 
    }
}

exports.jsmWatch = function() {
  var cwd = process.cwd();
  if (fs.existsSync( cwd + '/jsm.ini' )) {
    var iniResult = fs.readFileSync(cwd + '/jsm.ini', "utf-8");
    var project = ini.parse(iniResult);

    console.log('Watching project ' + cwd + ' ...');

    function watcher(f, curr, prev) {
      if (typeof f == "object" && prev === null && curr === null) {

      } else if (prev === null) {
        // f is a new file
        build(cwd,project);
      } else if (curr.nlink === 0) {
        // f was removed
        build(cwd,project);
      } else {
        // f was changed
        build(cwd,project);
      }
    }

    watch.watchTree(cwd + '/' + project.appFolder, watcher);
    watch.watchTree(cwd + '/' + project.templatesFolder, watcher);
    watch.watchTree(cwd + '/' + project.cssFolder, watcher);
    watch.watchTree(cwd + '/' + project.publicFolder, watcher);

    var ls = chprocess.exec('node '+__dirname+'/server.js '+ cwd + '/' + project.buildPath, function (error, stdout, stderr) {
     if (error) {
       console.log(error.stack);
       console.log('Error code: '+error.code);
       console.log('Signal received: '+error.signal);
     }
     console.log('stdout: ' + stdout);
     console.log('stderr: ' + stderr);
     
   });
  
   ls.on('exit', function (code) {
     console.log('Child process exited with exit code '+code);
   });
  } else {
    console.log(cwd + '/jsm.ini not found.');
  }
}