var socketio = require('socket.io');
var io;
var players = {};
var playerCount = 0;
var waitForConnections = true;
var lastMove;
var moveCount = 0;
var schema = [['_','_','_'],['_','_','_'],['_','_','_']];

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
		io.sockets.emit('playerConnected', {'who': players[socket.id]});
		// 2 players connected
		if(playerCount == 2){
			waitForConnections = false;
		}
	}
	return playerCount;
}

function handleAction(socket){
	socket.on('action', function(message){
		var x = message.position.split("_")[0];
		var y = message.position.split("_")[1];
		var sign;
		if(!waitForConnections && schema[x][y] == '_' && lastMove != socket.id) {
			if (players[socket.id] == 'Player1') {
				sign = 'X';
				schema[x][y] = 'X';
			} else if (players[socket.id] == 'Player2') {
				sign = 'O';
				schema[x][y] = 'O';
			}
			moveCount++;
			// save who's the actor of last move
			lastMove = socket.id;
			// send message to all the clients
			io.sockets.emit('actionPerformed',
					{'who': players[socket.id], 'what': message.position});
			console.log(moveCount);
			var result = action(x,y,sign);
			if(result >= 0){
				console.log('End');
				moveCount = 0;
				io.sockets.emit('end', {'lastmove': players[socket.id], 'win': result});
			}
		}
	});
}

function handlePlayerDisconnection(socket){
	socket.on('disconnect', function(){
		io.sockets.emit('playerDisconnected', {'who': players[socket.id]});
		console.log(players[socket.id] + ' disconnected.');
		delete players[socket.id];
		playerCount--;
		// re-wait for connections
		waitForConnections = true;
		// re-initialize schema
		schema = [['_','_','_'],['_','_','_'],['_','_','_']];
		moveCount = 0;
	});
	return playerCount;
}

function action(x,y,s){
	// columns
	var i;
	for(i = 0; i < 3; i++){
		if(schema[x][i] != s){
			break;
		}
		if(i == 2){
			return 1;
		}
	}
	// rows
	for(i = 0; i < 3; i++){
		if(schema[i][y] != s){
			break;
		}
		if(i == 2){
			return 1;
		}
	}
	// diagonal and anti-diagonal
	if(x == y){
		for(i = 0; i < 3; i++){
			if(schema[i][i] != s){
				break;
			}
			if(i == 2){
				return 1;
			}
		}
	}

	for(i = 0; i < 3; i++){
		if(schema[i][2-i] != s){
			break;
		}
		if(i == 2){
			return 1;
		}
	}

	// draw
	if(moveCount == 9) {
		return 0;
	}

	return -1;
}