var socket;
var cnv;
var rotAng = 0;

var PLAYER_LIST = {};
var BULLET_LIST = {};
var BLOCK_LIST = {};
var life = 3;

function preload(){	
	shotSound = loadSound("assets/audio/shot.mp3");
	explSound = loadSound("assets/audio/explosion.mp3");
}

function setup(){
	cnv = createCanvas(660,660);
	cnv.position((windowWidth - width) / 2, (windowHeight - height) / 2);

	background(0);	
	frameRate(60);
	imageMode(CENTER);
	imgTank = [];
	imgTank[0] = loadImage("assets/img/tank.png");
	imgTank[1] = loadImage("assets/img/tank2.png");
	imgTank[2] = loadImage("assets/img/tank3.png");
	imgTank[3] = loadImage("assets/img/tank4.png");
	imgLife = loadImage("assets/img/life.png");
	imgBlock = loadImage("assets//img/block.png");
	shotSound.setVolume(0.2);
	explSound.setVolume(0.2);
	socket=io();

	textSize(18);
	textAlign(CENTER);


	socket.on('newPositions', function(data){
		PLAYER_LIST = data.player;
		BULLET_LIST = data.bullet;
	})

	socket.on('blocksPositions', function(data){
		BLOCK_LIST = data;
	})

	socket.on("lives", function(data){
		life=data;
	})

	socket.on("chart", rank) //Updating the real-time ranking

	socket.on("start", initGame) //Show the game canvas

	socket.on("full", full) //Alert the user that the room is full

	socket.on("winner", win) //Show winner div

	socket.on("shot", function(){
		shotSound.play();
	})

	socket.on("expl", function(){
		explSound.play();
	})

	socket.on("showRestart", showRestart) //Show the button to restart the game

	socket.on("hideRestart", hideRestart) // Hide restart button

	socket.on("hide", hide) //Hides winner div and restart button
}


function draw(){

	noStroke();
	background(0);

	fill(255);

	/***SHOW BLOCKS***/
	for(var i=0; i<BLOCK_LIST.length; i++) {
		image(imgBlock, BLOCK_LIST[i].x, BLOCK_LIST[i].y);
	}

	/***SHOW ALL THE PLAYERS/TANKS***/
	for(var i=0; i<PLAYER_LIST.length; i++) {
		/***DIRECTION OF THE TANK***/
		switch (PLAYER_LIST[i].direction){
			case "up": {
				rotAng = 0;
				break;
			}
			case "down": {
				rotAng = 180;
				break;	
			}		
			case "right": {
				rotAng = 90;
				break;
			}
			case "left": {
				rotAng = 270;
				break;
			}
		}

		push();
		translate(PLAYER_LIST[i].x, PLAYER_LIST[i].y)
		rotate(radians(rotAng));
		image(imgTank[PLAYER_LIST[i].number], 0,0);
		pop();

		/***SHOW USERNAMES***/
		fill(color('#1cf5ff'));
		textSize(18);
		text(PLAYER_LIST[i].username, PLAYER_LIST[i].x,PLAYER_LIST[i].y-25);

		/***SHOW TANKS HP***/
		rectMode(CORNER);
		fill(color('#FFFFFF'));
		rect(PLAYER_LIST[i].x-26, PLAYER_LIST[i].y+24, 52, 5);

		if(PLAYER_LIST[i].hp<=10) fill(color('#FF0000'))
		else if(PLAYER_LIST[i].hp<=30) fill(color('#FFAF0A'))
		else fill(color('#00FF00'))
		rect(PLAYER_LIST[i].x-25, PLAYER_LIST[i].y+25, PLAYER_LIST[i].hp, 3);

	}

	/***SHOW BULLETS***/
	for(var i=0; i<BULLET_LIST.length; i++) {
		rectMode(CENTER);
		fill(255);
		rect(BULLET_LIST[i].x, BULLET_LIST[i].y, 5,5);
	}

	/***SHOW NUMBER OF LIVES***/
	image(imgLife, 15,15);
	fill(255);
	textSize(25);
	text(life, 35, 25);

}


function keyPressed() {
	if(keyCode === 87) socket.emit('move',{inputId:'up', state:true});
	if(keyCode === 65) socket.emit('move',{inputId:'left', state:true});
	if(keyCode === 68) socket.emit('move',{inputId:'right', state:true});
	if(keyCode === 83) socket.emit('move',{inputId:'down', state:true});	
	if(keyCode === 32) socket.emit('attack', true);
}

function keyReleased() {
	if(keyCode === 87) socket.emit('move',{inputId:'up', state:false});
	if(keyCode === 65) socket.emit('move',{inputId:'left', state:false});
	if(keyCode === 68) socket.emit('move',{inputId:'right', state:false});
	if(keyCode === 83) socket.emit('move',{inputId:'down', state:false});
	if(keyCode === 32) socket.emit('attack', false);

}