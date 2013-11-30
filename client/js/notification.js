/*
	N   N OOOOO TTTTT I FFFFF I CCCCC AAAAA TTTTT I OOOOO N   N SSSSS
   NN  N O   O   T   I F     I C     A   A   T   I O   O NN  N S
   N N N O   O   T   I FFFF  I C     AAAAA   T   I O   O N N N SSSSS
   N  NN O   O   T   I F     I C     A   A   T   I O   O N  NN     S
   N   N OOOOO   T   I F     I CCCCC A   A   T   I OOOOO N   N SSSSS
*/
var lastNotificationText='';
function notify(text){
	//to avoid same notifications over and over again
	if(text === lastNotificationText){
		return;
	}
	lastNotificationText = text;
	var notificationID = Date.now();
	var $notification = $('<li id="id' + notificationID + '" class="notification">' + text + '</li>');

	$notification.on({
		'click tap': function(){
			$(this).slideUp(1000,function(){$(this).remove()});
			lastNotificationText = '';
		}
	});

	$('.notification-bar').append( $notification );

	/*
	dismiss the notification after x seconds
	*/
	(function(notificationID){
		setTimeout(function(){
			//it could have been removed in the meantime
			var n = $('#id' + notificationID);
			if( n )
				n.slideUp(1000,function(){$(this).remove()});
			//reset the text when the notification has been dismissed
			lastNotificationText = '';
		},7000);
	})(notificationID);
	
}