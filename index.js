/*
	MODULES
*/
var http = require('http').createServer( httpHandler ),
	io = require('socket.io').listen( http, { log: false } ),
	fs = require('fs'),
	httpHost = '10.130.164.155',
	httpPort = 3000;

http.listen( process.env.HTTP_PORT || httpPort, process.env.HTTP_HOST || '10.130.164.155' );

function httpHandler(req,res){

	console.log( req.url );

	if( req.url === '/' ){
		console.log('new http connection');
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
	socket.on('subscribe',function(room,controller){

		console.log( socket.id + ' subscribed to room ' + room );

		socket.join( room );

		socket.store.data = {
			"room" : room,
			"controller" : controller
		};

		io.sockets.in( room ).emit( 'updateRoomParticipants', io.sockets.manager.rooms[ '/'+room ] );
	});
	socket.on('deviceOrientationChanged', function(orientation){
		//console.log( 'deviceOrientationChanged' );
		io.sockets.in( socket.store.data.room ).emit('deviceOrientationTriggered', orientation)
		//socket.broadcast.to( socket.store.data.room ).emit('deviceOrientationTriggered', orientation);
	});
	socket.on('disconnect',function(){
		//console.log( socket.id );
		var leftRoom = socket.store.data.room;
		socket.leave( leftRoom );
		
		io.sockets.in( leftRoom ).emit( 'updateRoomParticipants', io.sockets.manager.rooms[ '/'+leftRoom ] );
		console.log( 'someone left room ' + leftRoom );
	});
});