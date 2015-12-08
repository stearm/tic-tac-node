var socket = io.connect();

$(document).ready(function(){
    $('li').click(function(){
        socket.emit('action', { 'position' : $(this).attr('id') } );
    });

    socket.on('actionPerformed', function(message){
        if(message.who == 'Player1'){
            $('li#' + message.what).css('background', '#D95B43');
        } else if(message.who == 'Player2'){
            $('li#' + message.what).css('background', '#53777A');
        }
    });

    socket.on('playerDisconnected', function(){
        $('li').css('background', '#ECD078');
    });
});