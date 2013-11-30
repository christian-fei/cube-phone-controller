var HOST = '192.168.0.106',
	socket = io.connect('http://' + HOST);


var room = '';

var lastOrientationState = {
	alpha: 0,
	beta: 0,
	gamma: 0
};

/*
variables for the controller
*/
var lastUpdate = Date.now(),
	minInterval = 1000/60, //towards 60 fps, the imaginary 60fps, and also to avoid flooding the socket
	canHandleOrientation;

$(document).ready(function() {
	
	var $cube = $('.cube'),
		$hostView = $('.host-specific-view'),
		$controllerView = $('.controller-specific-view'),
		$statusText = $('.status-text'),
		$instance = $('.instance');

	/*
		UI handlers
	*/
	$('.choice, .menu .item a').on('click',function(e){
		var choice;
		if( choice = $(this).data('choice') ){
			//don't follow the link, it's a trap
			e.preventDefault();
			/*
				remove the splash screen if any
				and also dismiss the menu
			*/
			if( $('.splash-screen') )
				$('.splash-screen').remove();
			$('.menu').removeClass('show');

			resetListeners();

			//remove old modals, coz below I create them again
			if( $('.room-input-dialog-wrapper') )
				$('.room-input-dialog-wrapper').remove();
			if( $('.passphrase-dialog-wrapper') )
				$('.passphrase-dialog-wrapper').remove();


			if( choice === 'controller' ){
				setupController();
			}else{
				setupHost();
			}
		}
	});

	$('.toggler').on('click',function(){
		$('.menu').toggleClass('show');
	});


	function resetListeners(){
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


	/*
		Detect if it can handle device orientation
	*/
	if (window.DeviceOrientationEvent) {
		window.addEventListener("deviceorientation", checkDeviceOrientation, true);
	}

	function checkDeviceOrientation(event){
		//console.log( event );
		window.removeEventListener('deviceorientation',checkDeviceOrientation);
		/*
			event.alpha will be null if not supported, so a simple if(canHandleOrientation)
			is enough to detect wether a browser supports deviceorientation or not
		*/
		canHandleOrientation = event.alpha;
	}


	/*
		*About* every minInterval ms (instead of every time the
		orientation changes) send information about the device 
		orientation to the server
	*/
	function handleDeviceOrientation(event){
		if( Date.now() - minInterval > lastUpdate ){
			sendOrientatioonUpdate(event);
		}
		lastUpdate = Date.now();
	}

	function sendOrientatioonUpdate(data){
		if( data.alpha ){
			socket.emit('controllerChanged',{
				alpha : data.alpha,
				beta : data.beta,
				gamma : data.gamma
			});
		}else{
			if( data.alphaKeyboard ){
				lastOrientationState.alpha += data.alphaKeyboard;
			}
			if( data.betaKeyboard ){
				lastOrientationState.beta += data.betaKeyboard;
			}
			if( data.gammaKeyboard ){
				lastOrientationState.gamma += data.gammaKeyboard;
			}

			socket.emit('controllerChanged',{
				alpha : lastOrientationState.alpha,
				beta : lastOrientationState.beta,
				gamma : lastOrientationState.gamma
			});
		}
	}
	function setupController(){
		/*
			once the user typed in the passphrase that he/she got from the host,
			the callback will be executed and the controller starts to send
			infos about the device orientation
		*/
		showRoomInput(trackController);

		/*
			starts tracking information about the device orientation and sends 
			this information to the server which routes it to the host computer
		*/
		function trackController(){
			$hostView.hide();
			$controllerView.show();

			notify('successfully connected to the host computer');
			$statusText.html('<h3>controlling instance ' + room + '</h3>');
			$instance.html(room);

			if( canHandleOrientation ){
				notify('your device supports deviceorientation');
				window.addEventListener("deviceorientation",handleDeviceOrientation);			
			}else{
				notify('your device doesn\'t support deviceorientation, use your keyboard to control the host');
				$(document).on('keydown',function(e){
					console.log(e.which);
					switch(e.which){
						case 37:
							/*left*/
							sendOrientatioonUpdate({gammaKeyboard:3});
							break;
						case 38:
							/*up*/
							sendOrientatioonUpdate({betaKeyboard:3});
							break;
						case 39:
							/*right*/
							sendOrientatioonUpdate({gammaKeyboard:-3});
							break;
						case 40:
							/*down*/
							sendOrientatioonUpdate({betaKeyboard:-3});
							break;
					}
				});
			}
		}
	}
	function showRoomInput(callback){
		var dialog = $( $('#room-input-dialog-template').html() );

		setTimeout(function(){
			dialog.find('.room-input').focus();		
		},100);

		dialog.find('.room-confirm, .room-input').on('click keyup',function(e){
			var roomAttempt = $('.room-input').val().trim();
			console.log( roomAttempt && ( e.target.nodeName === 'BUTTON' || e.which && e.which == 13) );
			if( roomAttempt && ( e.target.nodeName === 'BUTTON' || e.which && e.which == 13) ){
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
			$hostView.show();
			$controllerView.hide();

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

		socket.emit('requestPassphrase');
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