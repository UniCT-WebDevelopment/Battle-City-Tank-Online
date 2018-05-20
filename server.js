
var express = require('express');
var app = express();
var server = app.listen(3000);
app.use('/', express.static(__dirname + '/www'));

app.use(express.static('./public'));

var socket = require('socket.io')

var io = socket(server);
var start = false; //Variable to check if the game started
var end = false; //Variable to check if the game finished and if the player are still in game
 
var SOCKET_LIST = {};
var PLAYERS_LOGGED = [];
var playerNumber = 0;

var SpawnPoints = [];
SpawnPoints[0] = {x:40, y:65};
SpawnPoints[1] = {x:40, y:595};
SpawnPoints[2] = {x:620, y:65};
SpawnPoints[3] = {x:620, y:595};

var map = [ [0,0,1,0,0,0,0,0,0,0,0,0,1,0,0],
            [0,0,1,0,0,1,1,1,1,1,0,0,1,0,0],
            [0,0,1,0,0,0,0,1,0,0,0,0,1,0,0],
            [0,0,1,0,0,0,0,1,0,0,0,0,1,0,0],
            [0,0,1,0,0,0,0,1,0,0,0,0,1,0,0],
            [0,0,1,0,0,1,1,1,1,1,0,0,1,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [1,1,1,1,0,0,1,1,1,0,0,1,1,1,1],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,1,0,0,1,1,1,1,1,0,0,1,0,0],
            [0,0,1,0,0,0,0,1,0,0,0,0,1,0,0],
            [0,0,1,0,0,0,0,1,0,0,0,0,1,0,0],
            [0,0,1,0,0,0,0,1,0,0,0,0,1,0,0],
            [0,0,1,0,0,1,1,1,1,1,0,0,1,0,0],
            [0,0,1,0,0,0,0,0,0,0,0,0,1,0,0],
          ];
 
/***ENTIT***/
var Entity = function(){
    var self = {
        x:0,
        y:0,
        spdX:0,
        spdY:0,
        id:"",
    }
    self.update = function(){
        self.updatePosition();
    }
    self.updatePosition = function(){
        self.x += self.spdX;        
        self.y += self.spdY;      
    }
    self.getDistance = function(pt){
        return Math.sqrt(Math.pow(self.x-pt.x,2) + Math.pow(self.y-pt.y,2));
    }
    return self;
}

/***PLAYER***/
var Player = function(id, username, number){
    var self = Entity();
    self.id = id;
    self.username = username;
    self.playerN = number;
    self.spawnPointX = SpawnPoints[self.playerN].x; 
    self.spawnPointY = SpawnPoints[self.playerN].y;
    self.x = self.spawnPointX;
    self.y = self.spawnPointY;
    self.number = "" + Math.floor(10 * Math.random());
    self.pressingRight = false;
    self.pressingLeft = false;
    self.pressingUp = false;
    self.pressingDown = false;
    self.pressingAttack = false;
    self.attackDirection = "up";
    self.maxSpd = 1;

    self.attacked = false;
    self.counter = 30; //Handle Fire Shooting Rate
    self.life = 3;
    self.dead = false;
    self.hp = 50;
    self.points = 0;
   
    var super_update = self.update;

    self.update = function(){
        self.updateSpd();       
        super_update();
        self.counter++;

        if(self.counter >= 30) self.attacked = false;
     
        if(self.pressingAttack && !self.attacked){
        	self.counter=0;
        	self.attacked = true;           
          	self.shootBullet();
        }
    }

    self.shootBullet = function(){
        if(!self.dead){
            var b = Bullet(self.id);
            b.x = self.x;
            b.y = self.y;
            for(var i in PLAYERS_LOGGED) PLAYERS_LOGGED[i].sock.emit('shot');

            switch(self.attackDirection){
                case "up": 
                    b.spdY = -6;
                    b.spdX = 0;
                    break;
                case "down":
                    b.spdY = 6;
                    b.spdX = 0;
                    break;
                case "right":
                    b.spdX = 6;
                    b.spdY = 0;
                    break;

                case "left":
                    b.spdX = -6;
                    b.spdY = 0;
                    break;
            }
        }
    }
     
    self.updateSpd = function(){
        if(!self.dead){
            self.checkBorders();
            self.collide();
            
            if(self.pressingRight) {
                self.spdX = self.maxSpd;
                self.spdY = 0;
                self.attackDirection = "right";
            }

            else if(self.pressingLeft) {
                self.spdX = -self.maxSpd;
                self.spdY = 0;
                self.attackDirection = "left";
            }

            else if(self.pressingUp) {
                self.spdY = -self.maxSpd;
                self.spdX = 0;            
                self.attackDirection = "up";
            }

            else if(self.pressingDown) {
                self.spdY = self.maxSpd;
                self.spdX = 0;            
                self.attackDirection = "down";
            }

            else {
                self.spdX = 0;
                self.spdY = 0;
            }
        }
    }

    self.checkBorders = function(){       
        if(self.x <=20) self.pressingLeft =false;       
        if(self.y <=20) self.pressingUp =false;
        if(self.x >=640) self.pressingRight =false;     
        if(self.y >=640) self.pressingDown =false;
    }

    /***Handling the blocks collision with the player ***/
    self.collide = function(){

        for(let i in Block.list){
            let distanceX = self.x - Block.list[i].x;
            let distanceY = self.y - Block.list[i].y;
            if(distanceX>=0 && distanceX <= 42 && Math.abs(distanceY) < 42 ) self.pressingLeft=false;            
            if(distanceX<=0 && distanceX >= -42 && Math.abs(distanceY) < 42 ) self.pressingRight=false;

            if(distanceY>=0 && distanceY <= 42 && Math.abs(distanceX) < 42 ) self.pressingUp=false;            
            if(distanceY<=0 && distanceY >= -42 && Math.abs(distanceX) < 42 ) self.pressingDown=false;
        
        }       

    }

    /*** All the stats and attributes of the player come back to the starting one for a new game***/
    self.reset = function(){
        self.dead = false;
        self.x = self.spawnPointX;
        self.y = self.spawnPointY;
        self.points = 0;
        self.attackDirection = "up";
        self.life = 3;
        self.hp = 50;        
        self.pressingRight = false;
        self.pressingLeft = false;
        self.pressingUp = false;
        self.pressingDown = false;
        self.pressingAttack = false;
    }

    Player.list[id] = self;
    return self;
}

Player.list = {};

Player.onConnect = function(socket, username, number){
    var player = Player(socket.id, username, number);

    socket.on('move',function(data){
        if(data.inputId === 'left')
            player.pressingLeft = data.state;

        else if(data.inputId === 'right')
            player.pressingRight = data.state;

        else if(data.inputId === 'up')
            player.pressingUp = data.state;

        else if(data.inputId === 'down')
            player.pressingDown = data.state;
    });

    socket.on('attack',function(data){
        player.pressingAttack = data;
    });
}

Player.onDisconnect = function(socket){
    delete Player.list[socket.id];
}

Player.update = function(){
    let pack = [];
    for(let i in Player.list){
        let player = Player.list[i];
        player.update();
        pack.push({
            x:player.x,
            y:player.y,
            direction: player.attackDirection,
            number:player.playerN,
            username:player.username,
            hp: player.hp
        });    
    }
    return pack; //This pack contains all the information needed by the client
}

Player.restart = function(){
    for(let i in Player.list){
        let player = Player.list[i];
        player.reset();
    }
}

/*BULLET*/

var Bullet = function(parent){
    var self = Entity();
    self.id = Math.random();
    self.spdX;
    self.spdY;
    self.parent = parent;
    self.timer = 0;
    self.toRemove = false;
    var super_update = self.update;

    self.update = function(){
        if(self.timer++ > 300)
            self.toRemove = true;
        super_update();

        self.playerCollision();
        self.blockCollision();       
    }

    self.playerCollision = function(){
        for(let i in Player.list){
            let p = Player.list[i];
            if(self.getDistance(p) <20 && self.parent !== p.id){
                p.hp -= 10;
                self.checkHP(p,self.parent);
                self.toRemove = true;
            }
        }
    }

    self.checkHP = function(player, par){

        if(player.hp <=0){
            player.life--;          
            console.log(player.username + " lost a life");           
            for(var i in PLAYERS_LOGGED) PLAYERS_LOGGED[i].sock.emit('expl');
            SOCKET_LIST[player.id].emit("lives", player.life); //Sending the number of lives to the killed player
         
            var parent = getPlayer(par);
            self.updatePoints(parent);

            if(player.life>0){
                player.x = player.spawnPointX;
                player.y = player.spawnPointY;
                player.hp = 50;
            }
                    
            else{
                player.x= -100;
                player.y= -100;
                player.dead=true;
                checkEnd();
            }
            
        }
    }

    self.updatePoints = function(p){
        p.points++;
        for(var i in PLAYERS_LOGGED) PLAYERS_LOGGED[i].sock.emit('chart', chartUpdate());
        console.log(p.username + " earned a point")
    }


    self.blockCollision = function(){

        for(let i in Block.list){
            let b = Block.list[i];
            if(self.getDistance(b) <= 25) {
                delete Block.list[i];
                self.toRemove = true;
                io.sockets.emit('blocksPositions', Block.send());
                for(let j in PLAYERS_LOGGED) PLAYERS_LOGGED[j].sock.emit('blocksPositions', Block.send());
            }
        }

    }

    Bullet.list[self.id] = self;
    return self;
}

/***Function to get the player by his socket.id***/
var getPlayer = function(id){
    for(let i in Player.list){
        if(Player.list[i].id === id) return Player.list[i];
    }
}

Bullet.list = {};
 
Bullet.update = function(){
    let pack = [];
    for(let i in Bullet.list){
        let bullet = Bullet.list[i];
        bullet.update();
        if(bullet.toRemove)
            delete Bullet.list[i];
        else
            pack.push({
                x:bullet.x,
                y:bullet.y,
            });    
    }
    return pack;
}

/*BLOCK*/

var Block = function(){
    var self = Entity();
    var id = Math.random();
    return self;
}

Block.list = {};

Block.send = function(){
    let pack = [];
    for(let i in Block.list){
        let block = Block.list[i];
        pack.push({
            x: block.x,
            y: block.y
        });
    }
    return pack;
}

/***BLOCK INITIALIZATION***/

var blockInit = function(){
    let c = 0;
    for(let i = 0; i<15; i++){
        for(let j = 0; j<15; j++){
            if(map[j][i]===1){
                Block.list[c] = Block();
                Block.list[c].x=22+44*i;
                Block.list[c].y=22+44*j;
                c++;
            }
        }
    }
}


var startGame = function(){
    let c = 0;
    for(var i in PLAYERS_LOGGED){
        Player.onConnect(PLAYERS_LOGGED[i].sock, PLAYERS_LOGGED[i].user, c);
        c++;
    }
    end = false;

    blockInit();

    for(var i in PLAYERS_LOGGED) {
        PLAYERS_LOGGED[i].sock.emit('start',true);
        PLAYERS_LOGGED[i].sock.emit('chart', chartUpdate());
        PLAYERS_LOGGED[i].sock.emit('blocksPositions', Block.send());
        PLAYERS_LOGGED[i].sock.emit('lives', 3);

    }
}

var restartGame = function(){
    Player.restart(); 
    end = false;    
    blockInit();

    for(var i in PLAYERS_LOGGED) {
        PLAYERS_LOGGED[i].sock.emit('hide');
        PLAYERS_LOGGED[i].sock.emit('chart', chartUpdate());
        PLAYERS_LOGGED[i].sock.emit('blocksPositions', Block.send());
        PLAYERS_LOGGED[i].sock.emit('lives', 3);

    }

}

var checkEnd = function(){
    let c=0; 
    for(let i in Player.list){
        if(Player.list[i].dead === false) c++;
    }

    if(c<=1 && !end) {
        sendWinner();
        end=true;
        console.log("Game finished");
    }
}

var sendWinner = function(){
    let chart = [];
    for(let i in Player.list){
        var player = Player.list[i];
        chart.push({
            username: player.username,
            points: player.points
        })
    }

    chart.sort(function(a,b){
        if(a.points<b.points) return 1;
        else return -1;
    })

    console.log("ariprova");

    if(PLAYERS_LOGGED.length===1){
        console.log(chart[0].username);
        for(var i in PLAYERS_LOGGED) PLAYERS_LOGGED[i].sock.emit('winner',chart[0].username);
    }

    else if(chart[0].points>chart[1].points) {  
        for(var i in PLAYERS_LOGGED) PLAYERS_LOGGED[i].sock.emit('winner', chart[0].username);
    }
    else {
        for(var i in PLAYERS_LOGGED) PLAYERS_LOGGED[i].sock.emit('winner', "draw");
    }

    if(PLAYERS_LOGGED.length===4) {
        for(var i in PLAYERS_LOGGED) PLAYERS_LOGGED[i].sock.emit('showRestart');
    }

}

var chartUpdate = function(){
    let chart = [];
    for(let i in Player.list){
        let player = Player.list[i];
        chart.push({
            username: player.username,
            points: player.points
        })
    }

    return chart;
}

io.sockets.on('connection', function(socket){
    socket.id = Math.random();
    SOCKET_LIST[socket.id] = socket;



    socket.on('login', function(username){
        if(start) {
            socket.emit("full");
            return;
        }

        PLAYERS_LOGGED.push({sock: socket, user: username});
        console.log(username + " logged in");
               
        if(PLAYERS_LOGGED.length == 4) {
            
            start=true;
            startGame();
        }
    })

    socket.on('restart', restartGame)
   
    socket.on('disconnect',function(){
        for(let i in PLAYERS_LOGGED) {
            if(PLAYERS_LOGGED[i].sock===SOCKET_LIST[socket.id]) { //If he player disconnects and is logged in the game we have to delete him from the game
                console.log(PLAYERS_LOGGED[i].user + " disconnected");
                PLAYERS_LOGGED.splice(i,1);
                Player.onDisconnect(socket);
                if(start) checkEnd();
                if(PLAYERS_LOGGED.length===0) start = false; //With this we can make possible to start a new game after all logged players disconnects
            }
        }

        if(end == true) {
            for(var i in PLAYERS_LOGGED) PLAYERS_LOGGED[i].sock.emit('hideRestart');
        }

        delete SOCKET_LIST[socket.id];
    });
   
});

setInterval(function(){
    var pack = {
        player:Player.update(),
        bullet:Bullet.update(),
    }

    for(var i in PLAYERS_LOGGED){
        PLAYERS_LOGGED[i].sock.emit('newPositions',pack);
    }
},1000/60);
