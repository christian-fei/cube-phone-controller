/*
	MODULES
*/
var http = require('http').createServer( httpHandler ),
	io = require('socket.io').listen( http, { log: false } ),
	fs = require('fs'),
	mime = require('mime'),
	httpHost = '192.168.0.106', //my static IP in my home network
	httpPort = 3000;

var rooms = {};

http.listen( process.env.HTTP_PORT || httpPort, process.env.HTTP_HOST || httpHost );


/*
	H   H TTTTT TTTTT PPPPP    SSSSS EEEEE RRRRR V   V EEEEE RRRRR
	H   H   T     T   P   P    S     E     R   R V   V E     R   R
	HHHHH   T     T   PPPPP    SSSSS EEEE  RRRRR  V V  EEEE  RRRRR
	H   H   T     T   P            S E     R  R   V V  E     R  R
	H   H   T     T   P        SSSSS EEEEE R   R   V   EEEEE R   R
*/
function httpHandler(req,res){
	if( req.url === '/' ){
		res.writeHead(200, {
			'Content-Type': 'text/html'
		});
		res.write( fs.readFileSync( __dirname + '/client/index.html' , 'utf8') );
	}else if(req.url === '/about' || req.url === '/source'){
		res.writeHead(200, {
			'Content-Type': 'text/html'
		});
		res.write( fs.readFileSync( __dirname + '/client' + req.url + '.html' , 'utf8') );
	}else{
		var f;
		try{
			f = fs.readFileSync( __dirname + req.url , 'utf8');
		}catch(e){
		}

		if(f){
			/*
			serve with the right mime type
			*/
			var type = mime.lookup(req.url.substring(1));
			res.writeHead(200, {
				"Content-Type": type
			});
			res.write( f.toString() );
		}
		else
			res.writeHead(404);
	}
	res.end();
}


/*
	SSSSS OOOOO CCCCC K   K EEEEE TTTTT       I OOOOO
	S     O   O C     K  K  E       T         I O   O
	SSSSS O   O C     KKK   EEEE    T         I O   O
	    S O   O C     K  K  E       T    ..   I O   O
	SSSSS OOOOO CCCCC K   K EEEEE   T    ..   I OOOOO
*/
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

	socket.on('windowUnloadSocketLeft',function(){
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