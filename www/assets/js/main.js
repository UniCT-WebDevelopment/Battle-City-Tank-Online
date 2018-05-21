function waitingPlayers() {
	let user = $('.username-input').val();
	if(user==""){
		window.alert("Insert an username");
		return;
	}
	$('#login-screen').hide();	
	$('#waiting-screen').show();
	login(user);
}

function initGame() {
	$('#waiting-screen').hide();
	$('#game-screen').show();
	$('#defaultCanvas0').show();
}

function showRestart(){
	console.log("elio");
	$('#restart').show();
}

function showDebug(){
	$('#login-screen').hide();
	$('#waiting-screen').hide();
	$('#game-screen').show();
	$('#defaultCanvas0').show();
}

function login(username) {
	console.log(username);
	socket.emit('login', username);
}

function full(){
	$('#waiting-screen').hide();
	$('#login-screen').show();
	window.alert("The room is full");
}

function win (data){
	if(data=="draw") $('#winner').html("Draw");
	else $('#winner').html(data + " wins");
	$('#winner').show();
	console.log(data);
}

function hideRestart(){
	$('#restart').hide();
}

function hide(){
	$('#winner').hide();
	$('#restart').hide();
}

function restart(){
	socket.emit('restart');
}

$(document).ready(function(){

	$(window).resize(function(){
		cnv.position((windowWidth - width) / 2, (windowHeight - height) / 2);
	});
	$('#btn-login').click(waitingPlayers);
	$('#input-login').keypress(function(event){
		if(event.which == 13) waitingPlayers();
	});
	$('.serverip-input').keypress(function(event){
		if(event.which == 13) waitingPlayers();
	});
	$('#btn-restart').click(restart);
})

function rank(data){
	data.sort(function(a,b){
        if(a.points<b.points) return 1;
        else return -1;
    })

	var table = document.createElement('table');

	var thead = document.createElement('thead');

	var tr = document.createElement('tr'); 

	var th1 = document.createElement('th');
	var th2 = document.createElement('th');
	var th3 = document.createElement('th');
	th1.appendChild(document.createTextNode('Position'));
	th2.appendChild(document.createTextNode('Username'));
	th3.appendChild(document.createTextNode('Points'));

	tr.appendChild(th1);
	tr.appendChild(th2);
	tr.appendChild(th3);
	thead.appendChild(tr);
	table.appendChild(thead);

	var tbody = document.createElement('tbody'); 
	for (var i = 0; i < data.length; i++) {
	   var tr = document.createElement('tr');   
	   var td1 = document.createElement('td');
	   var td2 = document.createElement('td');
	   var td3 = document.createElement('td');

	   var text1 = document.createTextNode(i+1);
	   var text2 = document.createTextNode(data[i].username);
	   var text3 = document.createTextNode(data[i].points);

	   td1.appendChild(text1);
	   td2.appendChild(text2);
	   td3.appendChild(text3);

	   tr.appendChild(td1);
	   tr.appendChild(td2);
	   tr.appendChild(td3);
	   tbody.appendChild(tr);

	}

	table.appendChild(tbody);
	$('#chart').html(table);

}

