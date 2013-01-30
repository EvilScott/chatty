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
    chat: function(userId, message) {
        var messageObject = {
            userId: userId,
            nick: userId == 0 ? 'SYSTEM' : Chatty.users[userId],
            message: message
        };
        Chatty.messages.push(messageObject);
        io.sockets.emit('chat', messageObject);
    },
    init: function() {
        io.sockets.on('connection', function(socket) {

            // all current users
            Chatty.users.forEach(function(nick, userId) {
                socket.emit('addUser', { userId: userId, nick: nick });
            });

            // history of messages
            Chatty.messages.forEach(function(messageObject){
                socket.emit('chat', messageObject);
            });

            // set default nick and userId
            socket.userId = Math.floor((Math.random()*10000)+1);
            Chatty.users[socket.userId] = 'StupidNoob' + socket.userId;
            socket.nick = function() { return Chatty.users[this.userId]; };

            // add user to list
            io.sockets.emit('addUser', { userId: socket.userId, nick: socket.nick() });

            // connection message
            Chatty.chat(0, socket.nick() + ' connected');

            // change nick
            socket.on('nick', function(newNick) {
                var oldNick = Chatty.users[socket.userId];
                Chatty.users[socket.userId] = newNick;
                io.sockets.emit('changeNick', { userId: socket.userId, nick: socket.nick() });
                Chatty.chat(0, oldNick + ' changed nick to ' + newNick);
            });

            // broadcast chat
            socket.on('chat', function(message) {
                Chatty.chat(this.userId, message);
            });

            // disconnect
            socket.on('disconnect', function() {
                io.sockets.emit('removeUser', { userId: socket.userId, nick: socket.nick() });
                delete Chatty.users[socket.userId];
                Chatty.chat(0, socket.nick() + ' disconnected');
            });
        });
    }
};

Chatty.init();
