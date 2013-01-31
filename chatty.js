var app = require('express')()
, server = require('http').createServer(app)
, io = require('socket.io').listen(server)
, S = require('string');

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
            message: S(message).stripTags().toString()
        };
        Chatty.messages.push(messageObject);
        io.sockets.emit('chat', messageObject);
    },

    addUser: function(userId, nick) {
        Chatty.users[userId] = S(nick).stripTags().toString();
        io.sockets.emit('addUser', { userId: userId, nick: Chatty.users[userId] });
        Chatty.chat(0, Chatty.users[userId] + ' connected');
    },

    changeNick: function(userId, newNick) {
        var oldNick = Chatty.users[userId];
        Chatty.users[userId] = S(newNick).stripTags().toString();
        io.sockets.emit('changeNick', { userId: userId, nick: Chatty.users[userId] });
        Chatty.chat(0, oldNick + ' changed nick to ' + Chatty.users[userId]);
    },

    removeUser: function(userId) {
        var oldNick = Chatty.users[userId];
        delete Chatty.users[userId];
        io.sockets.emit('removeUser', { userId: userId });
        Chatty.chat(0, oldNick + ' disconnected');
    },

    init: function() {
        io.sockets.on('connection', function(socket) {

            // send all current users to client
            Chatty.users.forEach(function(nick, userId) {
                socket.emit('addUser', { userId: userId, nick: nick });
            });

            // send history of messages to client
            Chatty.messages.forEach(function(messageObject){
                socket.emit('chat', messageObject);
            });

            // add new user
            socket.userId = Math.floor((Math.random()*10000)+1);
            Chatty.addUser(socket.userId, 'StupidNoob' + socket.userId);
            socket.nick = function() { return Chatty.users[this.userId]; };

            // change nick
            socket.on('nick', function(newNick) { Chatty.changeNick(this.userId, newNick) });

            // broadcast chat
            socket.on('chat', function(message) { Chatty.chat(this.userId, message); });

            // disconnect
            socket.on('disconnect', function() { Chatty.removeUser(this.userId); });
        });
    }
};

Chatty.init();
