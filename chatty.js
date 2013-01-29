var app = require('express')()
, server = require('http').createServer(app)
, io = require('socket.io').listen(server);

server.listen(8080);

app.get('/', function(req, res) {
    res.sendfile(__dirname + '/public/index.html');
});

app.get('/:filename', function(req, res) {
    res.sendfile(__dirname + '/public/' + req.params.filename);
});

var Chatty = {
    users: [],
    messages: [],
    init: function() {
        io.sockets.on('connection', function(socket) {

            // history of messages
            Chatty.messages.forEach(function(messageObject){
                io.sockets.emit('chat', messageObject);
            });

            // set default nick and userId
            socket.userId = Math.floor((Math.random()*10000)+1);
            Chatty.users[socket.userId] = 'StupidNoob' + socket.userId;;
            socket.nick = Chatty.users[socket.userId];

            // connection message
            io.sockets.emit('chat', { userId: 0, nick: 'SYSTEM', message: socket.nick + ' connected' });

            // change nick
            socket.on('nick', function(newNick) {
                io.sockets.emit('chat', { userId: 0, nick: 'SYSTEM', message: socket.nick + ' changed nick to ' + newNick });
                Chatty.users[socket.userId] = newNick;
            });

            // broadcast chat
            socket.on('chat', function(message) {
                var messageObject = { userId: socket.userId, nick: socket.nick, message: message };
                Chatty.messages.push(messageObject);
                io.sockets.emit('chat', messageObject);
            });

            // disconnect
            socket.on('disconnect', function() {
                delete Chatty.users[socket.userId];
                io.sockets.emit('chat', { userId: 0, nick: 'SYSTEM', message: socket.nick + ' disconnected' });
            });
        });
    }
};

Chatty.init();
