$(document).ready(function() {
	var HOST = '192.168.0.106';
	var socket = io.connect('http://' + HOST);
	
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
				minInterval = 30;
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
			if( e.which && e.which == 13 || e.target.nodeName === 'BUTTON' ){
				$('.room-input-dialog-wrapper').remove();
				callback();
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
			$cube.show();

			socket.on('controllerInstruction',function(orientation){
				rotateCube( orientation.gamma , -orientation.beta );
			});
		}
	}
	function showRoomPassphrase(callback){
		var dialog = $( $('#passphrase-dialog-template').html() );
		$('body').append(dialog);

		socket.emit('gimmePassphrase');
		socket.on('thereYouGo', function(passphrase){
			dialog.find('.room-input').val(passphrase);
		});	
	}
	
	function rotateCube(x,y){
		$cube.css('transform', 'rotateY('+x+'deg) rotateX('+y+'deg)');
	}

	socket.on('updateRoomParticipants',function(others){
		var other = null,
			i = 0;
		var $others = $('.others');
		$others.empty();

		if(others){
			while( other = others[i++] ){
				$others.append('<li>' + other + '</li>');
			}
		}
	});
});