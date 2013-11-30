var HOST = '192.168.0.106',
	socket = io.connect('http://' + HOST);


var room = '';


/*
variables for the controller
*/
var alpha,beta,gamma,absolute,debug,
		lastUpdate = Date.now(),
		minInterval = 10;

$(document).ready(function() {
	
	var $cube = $('.cube'),
		$statusText = $('.status-text'),
		$instance = $('.instance');

	/*
		UI handlers
	*/
	$('.choice, .menu .item a').on('click',function(e){
		if( $(this).data('choice') ){
			if( $('.splash-screen') )
				$('.splash-screen').remove();
			console.log( $(this).data('choice') );
			resetListeners();
			e.preventDefault();
			if( $(this).data('choice') === 'controller' ){
				setupController();
			}else{
				setupHost();
			}
		}
	});


	function resetListeners(){
		console.log( 'removing listeners' );
		window.removeEventListener('deviceorientation',handleDeviceOrientation);
		socket.removeListener('controllerConnected');
		socket.removeListener('controllerLeft');
		socket.removeListener('passphraseFreshFromTheOven');
		socket.removeListener('controllerInstruction');
		socket.removeListener('responseAttemptControllerRoom');

	}


	/*
	*	CCCCC OOOOO N   N TTTTT RRRRR OOOOO L     L     EEEEE RRRRR
	*	C     O   O NN  N   T   R   R O   O L     L     E     R   R
	*	C     O   O N N N   T   RRRRR O   O L     L     EEEE  RRRRR
	*	C     O   O N  NN   T   R  R  O   O L     L     E     R  R
	*	CCCCC OOOOO N   N   T   R   R OOOOO LLLLL LLLLL EEEEE R   R
	*/
	function handleDeviceOrientation(event){
		if( Date.now() - minInterval > lastUpdate ){
			alpha = event.alpha;
			beta = event.beta;
			gamma = event.gamma;

			socket.emit('controllerChanged',{
				alpha : alpha,
				beta : beta,
				gamma : gamma
			});
		}
		lastUpdate = Date.now();
	}
	function setupController(){

		$('.cube-perspective').hide();

		/*
			once the user typed in the passphrase that he/she got from the host,
			the callback will be executed and the controller starts to send
			infos about the device orientation
		*/
		showRoomInput(startTrackingDeviceOrientation);

		/*
			starts tracking information about the device orientation and sends 
			this information to the server which routes it to the host computer
		*/
		function startTrackingDeviceOrientation(){
			notify('controller for instance ' + room + ' set up');
			$statusText.html('<h3>controlling instance ' + room + '</h3>');
			$instance.html(room);
			/*
				*About* every minInterval ms (instead of every time the
				orientation changes) send information about the device 
				orientation to the server
			*/
			window.addEventListener("deviceorientation",handleDeviceOrientation);
		}
	}
	function showRoomInput(callback){
		var dialog = $( $('#room-input-dialog-template').html() );

		setTimeout(function(){
			dialog.find('.room-input').focus();		
		},100);

		dialog.find('.room-confirm, .room-input').on('click keyup',function(e){
			var roomAttempt = $('.room-input').val().trim();
			if( roomAttempt && e.which && e.which == 13 || e.target.nodeName === 'BUTTON' ){
				/*
					Follow the protocol:
						1) check if room exists (ask server)
						2) read the response and act accordingly
				*/
				socket.emit('attemptControllerRoom', roomAttempt);
				
				socket.on('responseAttemptControllerRoom',function(successful){
					if(successful){
						room = roomAttempt.toUpperCase();
						$('.room-input-dialog-wrapper').remove();
						callback();
					}else{
						notify('it seems like you mistyped the passphrase. try again.');
					}
				});

			}
		});
		$('body').append(dialog);
	}





	/*
	*	H   H OOOOO SSSSS TTTTT
	*	H   H O   O S       T
	*	HHHHH O   O SSSSS   T
	*	H   H O   O     S   T
	*	H   H OOOOO SSSSS   T
	*/
	function setupHost(){
		showRoomPassphrase(startMovingCube);

		function startMovingCube(){
			notify('controller connected to instance ' + room);
			$instance.html(room);
			$('.passphrase-dialog-wrapper').remove();
			$cube.show();

			socket.on('controllerInstruction',function(orientation){
				if(controllerAvailable){
					rotateCube( orientation.gamma , -orientation.beta );
				}
			});

			socket.on('controllerLeft',function(){
				controllerAvailable = false;
				$statusText.html('controller for instance ' + room + ' left');
				setupHost();
			});
		}
	}
	function showRoomPassphrase(callback){
		var dialog = $( $('#passphrase-dialog-template').html() );
		$('body').append(dialog);

		socket.emit('canIHazPassphrasePlz?');
		socket.on('passphraseFreshFromTheOven', function(passphrase){
			room = passphrase;
			dialog.find('.room-input').val(passphrase);
			notify('connect your smartphone as a controller');
		});
		socket.on('controllerConnected',function(){
			controllerAvailable = true;
			callback();
		});
	}
	
	function rotateCube(x,y){
		$cube.css('transform', 'rotateY('+x+'deg) rotateX('+y+'deg)');
	}

	/*
	doesn't work quite well, should send an event to the server, 
	because socket.io and Android have problems when disconnecting
	*/
	$(window).on('beforeunload unload', function(){
		socket.emit('windowUnloadSocketLeft');
	});
});