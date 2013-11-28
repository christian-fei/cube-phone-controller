$(document).ready(function() {
	var HOST = '192.168.0.106';
	socket = io.connect('http://' + HOST);
	
	var controller =  false
	var $cube = $('.cube');

	/*
		UI handlers
	*/
	$('.choice').on('click',function(){
		$('.splash-screen').remove();
		if( $(this).data('choice') === 'controller' ){
			setupController();
		}else{
			setupHost();
		}
	});



	/*
	*	CCCCC OOOOO N   N TTTTT RRRRR OOOOO L     L     EEEEE RRRRR
	*	C     O   O NN  N   T   R   R O   O L     L     E     R   R
	*	C     O   O N N N   T   RRRRR O   O L     L     EEEE  RRRRR
	*	C     O   O N  NN   T   R  R  O   O L     L     E     R  R
	*	CCCCC OOOOO N   N   T   R   R OOOOO LLLLL LLLLL EEEEE R   R
	*/
	function setupController(){
		/*
			no need to have a cube in the markup now, 
			because we are the controller in this case
		*/
		$('.cube-perspective').remove();

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
			var alpha,
				beta,
				gamma,
				absolute,
				debug,
				lastUpdate = Date.now(),
				minInterval = 10;
			/*
				*About* every minInterval ms (instead of every time the
				orientation changes) send information about the device 
				orientation to the server
			*/
			window.addEventListener("deviceorientation",function(event) {
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
			});
		}
	}
	function showRoomInput(callback){
		var dialog = $( $('#room-input-dialog-template').html() );
		dialog.find('.room-confirm, .room-input').on('click keyup',function(e){
			var roomAttempt = $('.room-input').val().trim();
			if( roomAttempt && e.which && e.which == 13 || e.target.nodeName === 'BUTTON' ){
				
				socket.emit('attemptControllerRoom', roomAttempt);
				
				socket.on('responseAttemptControllerRoom',function(successful){
					if(successful){
						$('.room-input-dialog-wrapper').remove();
						callback();
					}else{
						alert('it seems like there is no such room available. try again. (you shall not pass)');
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
			$('.passphrase-dialog-wrapper').remove();
			$cube.show();

			socket.on('controllerInstruction',function(orientation){
				if(controllerAvailable)
					rotateCube( orientation.gamma , -orientation.beta );
			});

			socket.on('controllerLeft',function(){
				controllerAvailable = false;
				setupHost();
			});
		}
	}
	function showRoomPassphrase(callback){
		var dialog = $( $('#passphrase-dialog-template').html() );
		$('body').append(dialog);

		socket.emit('canIHazPassphrasePlz?');
		socket.on('passphraseFreshFromTheOven', function(passphrase){
			dialog.find('.room-input').val(passphrase);
			notify('got passphrase ' + passphrase);
		});
		socket.on('controllerConnected',function(){
			controllerAvailable = true;
			callback();
		});
	}
	
	function rotateCube(x,y){
		$cube.css('transform', 'rotateY('+x+'deg) rotateX('+y+'deg)');
	}

	$(window).on('beforeunload unload', function(){
		socket.emit('windowUnloadControllerLeft');
		//return true;
	});

	function notify(text){
		var notificationID = Date.now();
		var $notification = $('<li id="id' + notificationID + '" class="notification">' + text + '</li>').on('click',function(){
			$(this).remove();
		});

		(function(notificationID){
			setTimeout(function(){
				//it could have been removed in the meantime
				var n = $('#id' + notificationID);
				if( n )
					n.slideUp(1500,function(){$(this).remove()});
			},5000);
		})(notificationID);
		$('.notification-bar').append( $notification );
	}
});