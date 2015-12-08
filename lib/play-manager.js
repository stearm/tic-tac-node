var socketio = require('socket.io');
var io;
var players = {};
var playerCount = 0;
var waitForConnections = true;
var lastMove;
var schema = ['_','_','_','_','_','_','_','_','_'];

exports.listen = function(server){
	io = socketio.listen(server);

	io.sockets.on('connection', function(socket){
		handlePlayerConnection(socket);
		handleAction(socket);
		handlePlayerDisconnection(socket);
	});
};

function handlePlayerConnection(socket){
	if(playerCount >= 2){
		socket.emit('fullMatch');
	} else {
		playerCount++;
		players[socket.id] = 'Player' + playerCount;
		console.log(players);
		// 2 players connected
		if(playerCount == 2){
			waitForConnections = false;
		}
	}
	return playerCount;
}

function handleAction(socket){
	socket.on('action', function(message){
		if(!waitForConnections && schema[message.position] == '_' && lastMove != socket.id) {
			if (players[socket.id] == 'Player1') {
				schema[message.position] = 'X';
			} else if (players[socket.id] == 'Player2') {
				schema[message.position] = 'O';
			}
			// save who's the actor of last move
			lastMove = socket.id;
			// send message to all the clients
			io.sockets.emit('actionPerformed',
					{'who': players[socket.id], 'what': message.position});
		}
	});
}

function handlePlayerDisconnection(socket){
	socket.on('disconnect', function(){
		io.sockets.emit('playerDisconnected');
		console.log(players[socket.id] + ' disconnected.');
		delete players[socket.id];
		playerCount--;
		// re-wait for connections
		waitForConnections = true;
		// re-initialize schema
		schema = ['_','_','_','_','_','_','_','_','_'];
	});
	return playerCount;
}