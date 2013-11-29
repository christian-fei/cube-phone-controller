/*
	MODULES
*/
var http = require('http').createServer( httpHandler ),
	io = require('socket.io').listen( http, { log: false } ),
	fs = require('fs'),
	httpHost = '10.130.164.155',
	httpPort = 3000;

var rooms = {};

http.listen( process.env.HTTP_PORT || httpPort, process.env.HTTP_HOST || '10.130.164.155' );

function httpHandler(req,res){
	if( req.url === '/' ){
		res.writeHead(200, {
			'Content-Type': 'text/html'
		});
		res.write( fs.readFileSync( __dirname + '/client/index.html' , 'utf8') );
	}
	else{
		var f;
		try{
			f = fs.readFileSync( __dirname + req.url , 'utf8');
		}catch(e){
		}
		if(f)
			res.write( f.toString() );
		else
			res.writeHead(404);
	}
	res.end();
}

io.sockets.on('connection', function (socket) {
	socket.on('canIHazPassphrasePlz?', function(){
		var passphrase = getNewPassphrase();
		socket.join( passphrase );
		socket.store.data = {
			"room" : passphrase,
			"controller" : false
		};
		socket.emit('passphraseFreshFromTheOven', passphrase);
	});

	socket.on('attemptControllerRoom',function(roomAttempt){
		if(roomAttempt)
			roomAttempt = roomAttempt.toUpperCase();
		var exists = rooms[roomAttempt] ? true : false;

		if( exists ){
			socket.join( roomAttempt );
			socket.store.data = {
				"room" : roomAttempt,
				"controller" : true
			};
			socket.broadcast.to(roomAttempt).emit('controllerConnected');
		}

		socket.emit('responseAttemptControllerRoom', exists );
	});
	socket.on('controllerChanged', function(orientation){
		socket.broadcast.to( socket.store.data.room ).emit('controllerInstruction', orientation);
	});

	socket.on('windowUnloadControllerLeft',function(){
		gracefulRoomLeaving(socket);
	});
	socket.on('disconnect',function(){
		gracefulRoomLeaving(socket);
	});
});

function gracefulRoomLeaving(socket){
	console.log('socket left ' + socket.id);
	var leftRoom = socket.store.data.room;
	socket.leave( leftRoom );
	console.log( socket.store.data );
	if( socket.store.data.controller === true )
		socket.broadcast.to( leftRoom ).emit('controllerLeft', io.sockets.manager.rooms[ '/'+leftRoom ] );
}

function getNewPassphrase(){
	//a string of 5 uppercase characters
	var alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	function generatePassphrase(){
		var p = '';
		for(var i = 0; i < 3; i++){
			p += alphabet[ Math.floor(Math.random() * alphabet.length)];
		}
		return p;
	}
	var passphrase = generatePassphrase();

	while( rooms[passphrase] ){
		passphrase = generatePassphrase();
	}
	rooms[ passphrase.toString() ] = true;

	console.log( rooms );

	return passphrase;
}