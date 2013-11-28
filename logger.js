var fs = require('fs'),
	off = false,
	logFile = 'log.txt',
	toConsole = false;

/*
	Log messages to file and/or console
*/
function setup(){
	var options = arguments[0] ? arguments[0] : {};
	logFile = options.logFile ? options.logFile : logFile;
	toConsole = options.toConsole ? options.toConsole : toConsole;
	off = options.off ? options.off : off;
	checkFile(logFile);
	if(options.clear)
		clear();
}
function log(l){
	if(off) return;
	var options = arguments[1] ? arguments[1] : {};

	var tmpToConsole = options.toConsole ? options.toConsole : toConsole;

	var tmpLogfile = options.logFile ? options.logFile : logFile;

	checkFile(logFile);

	/*pretty print that shit*/
	l = l instanceof Object ? JSON.stringify(l) : l;

	fs.appendFile(tmpLogfile, l.toString() + '\n', function (err) {
		if (err) throw err;
	});
	if(tmpToConsole)
		console.log(l.toString());
}
function checkFile(file){
	fs.exists(file,function(exists){
		if(!exists){
			fs.writeFile(file, '', function (err) {
				if (err) throw err;
			});
		}
	});
}
function clear(){
	var tmpLogfile = arguments[0] ? arguments[0] : logFile;
	fs.writeFile(tmpLogfile, '', function(){console.log('cleared ' + tmpLogfile)});
}
module.exports = {
	log: log,
	clear: clear,
	setup: setup
}