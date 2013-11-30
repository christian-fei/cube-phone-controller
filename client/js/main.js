var room = '';

var orientationState = {
	alpha: 0,
	beta: 0,
	gamma: 0
};

/*
variables for the controller
*/
var lastUpdate = Date.now(),
	minInterval = 15,
	canHandleOrientation;

/*
variables for the host
*/
var cubeEnabled = true,
	compassEnabled = false;

$(document).ready(function() {
	/*
		inside here to hide them from the console
	*/
	var HOST = '192.168.0.106',
		socket = io.connect('http://' + HOST);
	





	/*		
		U   U II     SSSSS TTTTT U   U FFFFF FFFFF
		U   U II     S       T   U   U F     F
		U   U II     SSSSS   T   U   U FFFF  FFFF
		U   U II         S   T   U   U F     F
		UUUUU II     SSSSS   T   UUUUU F     F
	*/

	var $cube = $('.cube'),
		$hostView = $('.host-specific-view'),
		$controllerView = $('.controller-specific-view'),
		$instance = $('.instance'),
		$cubeWrapper = $('.cube-wrapper'),
		$compassWrapper = $('.compass-wrapper'),
		$compassPointer = $('.compass-pointer'),
		$debugAxisX = $('.debug-axis[data-axis="x"]'),
		$debugAxisY = $('.debug-axis[data-axis="y"]'),
		$debugAxisZ = $('.debug-axis[data-axis="z"]');


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

			/*
			essentially restore the UI
			*/
			cubeEnabled = true;
			compassEnabled = false;
			$('#option-cube').prop('checked',true);
			$('#option-compass').prop('checked',false);

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
	/*
	options used to toggle the view on the host
	*/
	$('.controller-options input[type="checkbox"]').on('change',function(){
		//reset all other options
		$('.controller-options input[type="checkbox"]').prop('checked',false);
		//restore check, because of previous operation
		$(this).prop('checked',true);

		socket.emit('controllerOption', $(this).data('option') );
	});








	function resetListeners(){
		window.removeEventListener('deviceorientation',handleDeviceOrientation);
		socket.removeListener('controllerConnected');
		socket.removeListener('controllerLeft');
		socket.removeListener('instanceCreated');
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
		Detect if the controller can handle device orientation
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

	var alpha=beta=gamma=0;
	function sendOrientatioonUpdate(data){
		/*
		make the data homogen
		*/
		alpha = data.alpha ? data.alpha : data.alphaKeyboard ? data.alphaKeyboard : 0;
		beta = data.beta ? data.beta : data.betaKeyboard ? data.betaKeyboard : 0;
		gamma = data.gamma ? data.gamma : data.gammaKeyboard ? data.gammaKeyboard : 0;

		/*
			keyboard = add value to current state
		*/
		if( data.alphaKeyboard )
			orientationState.alpha += data.alphaKeyboard;
		if( data.betaKeyboard )
			orientationState.beta += data.betaKeyboard;
		if( data.gammaKeyboard )
			orientationState.gamma += data.gammaKeyboard;
		
		/*
			no keyboard, but deviceorienttation = set value to current state
		*/
		if( data.alpha )
			orientationState.alpha = alpha;
		if( data.beta )
			orientationState.beta = beta;
		if( data.gamma )
			orientationState.gamma = gamma;

		socket.emit('controllerChanged',{
			alpha : orientationState.alpha,
			beta : orientationState.beta,
			gamma : orientationState.gamma
		});

		$debugAxisZ.text( alpha );
		/*
			gamma and beta are used, alpha is optional, for future ideas
		*/
		$debugAxisX.text( gamma );
		$debugAxisY.text( beta );
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
							$debugAxisX.text( orientationState.gamma );
							break;
						case 39:
							/*right*/
							sendOrientatioonUpdate({gammaKeyboard:-3});
							$debugAxisX.text( orientationState.gamma );
							break;
						case 38:
							/*up*/
							sendOrientatioonUpdate({betaKeyboard:3});
							$debugAxisY.text( orientationState.beta );
							break;
						case 40:
							/*down*/
							sendOrientatioonUpdate({betaKeyboard:-3});
							$debugAxisY.text( orientationState.beta );
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

			if( roomAttempt && ( e.target.nodeName === 'BUTTON' || e.which && e.which == 13) ){
				/*
					Follow the protocol:
						1) check if room exists (ask server)
						2) read the response and act accordingly
				*/
				socket.emit('attemptControllerRoom', roomAttempt);
				
				socket.on('responseAttemptControllerRoom',function(successful, controllerAlreadyConnected){
					if(successful && !controllerAlreadyConnected){
						room = roomAttempt.toUpperCase();
						$('.room-input-dialog-wrapper').remove();
						callback();
					}else if(controllerAlreadyConnected){
						notify('there is already someone controlling this instance');
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
				if(cubeEnabled){
					if( changedEnough(orientation.beta,orientationState.beta,5) || changedEnough(orientation.gamma,orientationState.gamma,5) ){
						handleCube( orientation.gamma , -orientation.beta );
					}
				}
				if(compassEnabled)
					handleCompass( orientation.alpha );

				$debugAxisZ.text( orientation.alpha );
				/*
				gamma and beta are used, alpha is optional, for future ideas
				*/
				$debugAxisX.text( orientation.gamma );
				$debugAxisY.text( orientation.beta );
			});

			socket.on('controllerLeft',function(){
				setupHost();
			});

			socket.on('controllerOptionInstruction',function(option){
				$cubeWrapper.hide();
				cubeEnabled = false;
				$compassWrapper.hide();
				compassEnabled = false;
				switch(option){
					case 'compass':
						$compassWrapper.show();
						compassEnabled = true;
						handleGeoLocation();
						break;
					case 'cube':
						$cubeWrapper.show();
						cubeEnabled = true;
						break;
				}
			});
		}
	}
	function showRoomPassphrase(callback){
		var dialog = $( $('#passphrase-dialog-template').html() );
		$('body').append(dialog);

		socket.emit('requestNewInstance');
		socket.on('instanceCreated', function(passphrase){
			room = passphrase;
			dialog.find('.room-input').val(passphrase);
			notify('connect your smartphone as a controller');
		});
		socket.on('controllerConnected',function(){
			callback();
		});
	}
	function changedEnough(a,b,amount){
		if( Math.abs(a) > Math.abs(b) + amount || Math.abs(a) < Math.abs(b) - amount )
			return true;
		return false;
	}
	function handleCube(x,y){
		x = Math.floor(x);
		y = Math.floor(y);
		$cube.css('transform', 'rotateY('+x+'deg) rotateX('+y+'deg)');
	}
	function handleCompass(z){
		z *= -1;
		$compassPointer.css('transform','rotateZ(' + z + 'deg)');
	}

	function handleGeoLocation(){
		if(navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(function(position) {
				var locationString = position.coords.latitude + ',' + position.coords.longitude;
				$compassWrapper.find('.map').css('background-image','url("http://maps.googleapis.com/maps/api/staticmap?zoom=15&sensor=true&size=800x800&markers=' + locationString + '")');
			}, function() {
				alert('problem with geoposition you');
			});
		}else{
			alert('no geolocation for you, sry');
		}
	}

	/*
	doesn't work quite well, should send an event to the server, 
	because socket.io and Android have problems when disconnecting
	*/
	$(window).on('beforeunload unload', function(){
		socket.emit('windowUnloadSocketLeft');
	});
});