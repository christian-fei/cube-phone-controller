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

	function setupController(){
		//no need to have a cube in the markup now
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
				minInterval = 20;

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

	function setupHost(){
		$cube.show();

		socket.on('controllerInstruction',function(orientation){
			rotateCube( orientation.gamma , -orientation.beta );
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