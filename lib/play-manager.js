'use strict';

class Players {
	
	constructor(){
		this._player1 = {name:'Player1',id:''};
		this._player2 = {name:'Player2',id:''};
	}
	
	get player1(){
		return this._player1.id;
	}
	
	set player1(id){
		return this._player1.id = id;
	}
	
	get player2(){
		return this._player2.id;
	}
	
	set player2(id){
		return this._player2.id = id;
	}
	
	getPlayerNameById(id){
		if(this._player1.id == id)
			return this._player1.name;
		if(this._player2.id == id)
			return this._player2.name;
		return null;
	}
	
	disconnectPlayer(id){
		if(this._player1.id == id)
			this._player1.id = '';
		else
			this._player2.id = '';
	}
	
	getFreePlayer(){
		if(this._player1.id == '')
			return 1;
		if(this._player2.id == '')
			return 2;
		return 0;
	}

}

var socketio = require('socket.io');
var io;
var players = new Players();
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
	var freePlayer = players.getFreePlayer();
	if(freePlayer == 0){
		socket.emit('fullMatch');
	} else {
		if( players.getFreePlayer() == 1){
			players.player1 = socket.id;
			
			// player2 is connected. It occurs when there is a disconnection and reconnection of player1
			if(players.player2 != ''){
					io.sockets.emit('playerConnected', {'who': players.getPlayerNameById(players.player2)});
			}
		} else
			players.player2 = socket.id;
		
		console.log('Player1:' + players.player1);
		console.log('Player2:' + players.player2);
		
		io.sockets.emit('playerConnected', {'who': players.getPlayerNameById(socket.id)});
		
		// 2 players connected
		if(players.getFreePlayer() == 0){
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
			var playerName = players.getPlayerNameById(socket.id);
			if (playerName == 'Player1') {
				sign = 'X';
				schema[x][y] = 'X';
			} else if (playerName == 'Player2') {
				sign = 'O';
				schema[x][y] = 'O';
			}
			moveCount++;
			// save who's the player of last move
			lastMove = socket.id;
			// send message to all the clients
			io.sockets.emit('actionPerformed',
					{'who': playerName, 'what': message.position});
			console.log(moveCount);
			var result = action(x,y,sign);
			if(result >= 0){
				console.log('End');
				moveCount = 0;
				io.sockets.emit('end', {'lastmove': playerName, 'win': result});
			}
		}
	});
}

function handlePlayerDisconnection(socket){
	socket.on('disconnect', function(){
		var playerName = players.getPlayerNameById(socket.id);
		io.sockets.emit('playerDisconnected', {'who': playerName});
		console.log(playerName + ' disconnected.');
		players.disconnectPlayer(socket.id);
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