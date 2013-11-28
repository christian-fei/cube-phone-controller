/*
	MODULES
*/
var http = require('http').createServer( httpHandler ),
	io = require('socket.io').listen( http, { log: false } ),
	fs = require('fs'),
	_l = require('./logger.js'),
	httpHost = '10.130.164.155',
	httpPort = 3000;

_l.setup({toConsole : true});
_l.setup({off : true});

http.listen( process.env.HTTP_PORT || httpPort, process.env.HTTP_HOST || '10.130.164.155' );

function httpHandler(req,res){
	_l.log( req.url );
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
	}
	res.end();
}

io.sockets.on('connection', function (socket) {
	_l.log( socket.id + ' connected' );
	socket.on('subscribe',function(room,controller){
		socket.join( room );

		socket.store.data = {
			"room" : room,
			"controller" : controller
		};

		io.sockets.in( room ).emit( 'updateRoomParticipants', io.sockets.manager.rooms[ '/'+room ] );
	});
	socket.on('controllerChanged', function(orientation){
		//io.sockets.in( socket.store.data.room ).emit('controllerInstruction', orientation)
		socket.broadcast.to( socket.store.data.room ).emit('controllerInstruction', orientation);
	});
	socket.on('disconnect',function(){
		//console.log( socket.id );
		var leftRoom = socket.store.data.room;
		socket.leave( leftRoom );
		
		socket.broadcast.to( leftRoom ).emit('updateRoomParticipants', io.sockets.manager.rooms[ '/'+leftRoom ] );
		//console.log( 'someone left room ' + leftRoom );
	});
});