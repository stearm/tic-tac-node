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

    socket.on('playerConnected', function(message){
        if(message.who == 'Player1') {
            $('#player1').css('visibility', 'visible');
        }
        if(message.who == 'Player2') {
            $('#player1').css('visibility', 'visible');
            $('#player2').css('visibility', 'visible');
        }
    });

    socket.on('playerDisconnected', function(message){
        $('li').css('background', '#ECD078');

        if(message.who == 'Player1') {
            $('#player1').css('visibility', 'hidden');
        }
        if(message.who == 'Player2') {
            $('#player2').css('visibility', 'hidden');
        }
    });
});