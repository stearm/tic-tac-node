var http = require('http');
var fs = require('fs');
var path = require('path');
var mime = require('mime');
var cache = {};

function send404(response){
	response.writeHead(400, {'Content-Type': 'text/plain'});
	response.write('File not found.');
	response.end();
}

function sendFile(response, filePath, fileContents){
	response.writeHead(200,
		{'Content-Type': mime.lookup(path.basename(filePath))}
	);
	response.end(fileContents);
}

function serveStaticFile(response, cache, absPath){
	if(cache[absPath]){
		sendFile(response,absPath,cache[absPath]);
	} else {
		fs.exists(absPath, function(exists){
			if(exists){
				fs.readFile(absPath, function(err,data){
					if(err){
						send404(response);
					} else {
						cache[absPath] = data;
						sendFile(response,absPath,data);
					}
				});
			} else {
				send404(response);
			}
		});
	}
}

var server = http.createServer(function(request,response){
	if(request.url == '/'){
		filePath =  'public/index.html';
	} else {
		filePath = 'public' + request.url;
	}
	var absPath = './' + filePath;
	serveStaticFile(response, cache, absPath);	
});

server.listen(3000, function(){
	console.log('Server listen on port 3000');
});

var playManager = require('./lib/play-manager');
playManager.listen(server);