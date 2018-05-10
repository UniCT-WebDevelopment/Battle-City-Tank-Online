
var express = require('express');
var app = express();
var server = app.listen(3000);
app.use('/', express.static(__dirname + '/www'));

app.use(express.static('./public'));

console.log("My server is running");

var socket = require('socket.io')

var io = socket(server);
 
var SOCKET_LIST = {};
var playerNumber = 0;

var SpawnPoints = [];
SpawnPoints[0] = {x:20, y:20};
SpawnPoints[1] = {x:20, y:640};
SpawnPoints[2] = {x:640, y:20};
SpawnPoints[3] = {x:640, y:640};

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
          ] 

function getRandomInt(min, max){
    return Math.floor(Math.random()*(max - min + 1) + min);
}
 
var Entity = function(){
    var self = {
        x:getRandomInt(20,580),
        y:getRandomInt(20,580),
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
 
var Player = function(id, username){
    var self = Entity();
    self.id = id;
    self.username = username;
    self.playerN = playerNumber;
    self.spawnPointX = SpawnPoints[self.playerN-1].x; 
    self.spawnPointY = SpawnPoints[self.playerN-1].y;
    console.log(SpawnPoints[self.playerN-1].x + " " + SpawnPoints[self.playerN-1].y);
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
    self.counter = 60;
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
        var b = Bullet(self.id);
        b.x = self.x;
        b.y = self.y;
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
     
    self.updateSpd = function(){
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

    self.checkBorders = function(){       
        if(self.x <=20) self.pressingLeft =false;       
        if(self.y <=20) self.pressingUp =false;
        if(self.x >=640) self.pressingRight =false;     
        if(self.y >=640) self.pressingDown =false;
    }

    self.collide = function(){

        for(var i in Block.list){
            let distanceX = self.x - Block.list[i].x;
            let distanceY = self.y - Block.list[i].y;
            if(distanceX>=0 && distanceX <= 42 && Math.abs(distanceY) < 42 ) self.pressingLeft=false;            
            if(distanceX<=0 && distanceX >= -42 && Math.abs(distanceY) < 42 ) self.pressingRight=false;

            if(distanceY>=0 && distanceY <= 42 && Math.abs(distanceX) < 42 ) self.pressingUp=false;            
            if(distanceY<=0 && distanceY >= -42 && Math.abs(distanceX) < 42 ) self.pressingDown=false;
        
        }       

    }

    Player.list[id] = self;
    return self;
}

Player.list = {};

Player.onConnect = function(socket, username){
    var player = Player(socket.id, username);
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
    var pack = [];
    for(var i in Player.list){
        var player = Player.list[i];
        player.update();
        pack.push({
            x:player.x,
            y:player.y,
            direction: player.attackDirection,
            number:player.playerN,
            username:player.username
        });    
    }
    return pack;
}

 
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
        for(var i in Player.list){
            var p = Player.list[i];
            if(self.getDistance(p) <20 && self.parent !== p.id){
                p.hp -= 10;

                if(p.hp <=0){
                    p.x = p.spawnPointX;
                    p.y = p.spawnPointY;
                    p.hp = 50;
                    var parent = getPlayer(self.parent);
                    parent.points++;
                    for(var i in SOCKET_LIST){
                        var socket = SOCKET_LIST[i];                    
                        socket.emit('chart', chartUpdate());
                    }
                    
                }

                self.toRemove = true;
            }
        }
    }

    self.blockCollision = function(){

        for(var i in Block.list){
            var b = Block.list[i];
            if(self.getDistance(b) <= 25) {
                delete Block.list[i];
                self.toRemove = true;
                for(var i in SOCKET_LIST){
                    var socket = SOCKET_LIST[i];                    
                    socket.emit('blocksPositions', Block.send());
                }
            }
        }

    }

    Bullet.list[self.id] = self;
    return self;
}

getPlayer = function(id){
    for(var i in Player.list){
        if(Player.list[i].id === id) return Player.list[i];
    }
}

Bullet.list = {};
 
Bullet.update = function(){
    var pack = [];
    for(var i in Bullet.list){
        var bullet = Bullet.list[i];
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

var Block = function(){
    var self = Entity();
    var id = Math.random();
    return self;
}

Block.list = {};

var c = 0;
for(var i = 0; i<15; i++){
    for(var j = 0; j<15; j++){
        if(map[j][i]===1){
            Block.list[c] = Block();
            Block.list[c].x=22+44*i;
            Block.list[c].y=22+44*j;
            c++;
        }
    }
}

Block.send = function(){
    var pack = [];
    for(var i in Block.list){
        var block = Block.list[i];
        pack.push({
            x: block.x,
            y: block.y
        });
    }
    return pack;
}

io.sockets.on('connection', function(socket){
    socket.id = Math.random();
    SOCKET_LIST[socket.id] = socket;

    socket.on('login', function(username){
        playerNumber++;
        if(playerNumber <5) Player.onConnect(socket, username);
        console.log(playerNumber)
        
        socket.emit('blocksPositions', Block.send());

        socket.emit('chart', chartUpdate());
    })
   
    socket.on('disconnect',function(){
        playerNumber--;
        delete SOCKET_LIST[socket.id];
        Player.onDisconnect(socket);
    });
   
});

chartUpdate = function(){
    var chart = [];
    for(var i in Player.list){
        var player = Player.list[i];
        chart.push({
            username: player.username,
            points: player.points
        })
    }

    /*chart.sort(function(a,b){
        if(a.points<b.points) return 1;
        else return -1;
    })*/

    return chart;
}
 
setInterval(function(){
    var pack = {
        player:Player.update(),
        bullet:Bullet.update(),
    }
   
    for(var i in SOCKET_LIST){
        var socket = SOCKET_LIST[i];
        socket.emit('newPositions',pack);
    }
},1000/60);
