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
    antiFlood: { maxMessages: 4, timestampWindow: 2000 },

    chat: function(userId, message) {
        var user = Chatty.users[userId]
        , now = new Date().getTime()
        , messageObject = {
            userId: userId,
            nick: userId == 0 ? 'SYSTEM' : user.nick,
            message: S(message).stripTags().toString()
        };
        if (userId != 0) {
            if (user.timestamps.length < Chatty.antiFlood.maxMessages) {
                user.timestamps.push(now);
            } else {
                var past = user.timestamps.shift();
                user.timestamps.push(now);
                if ((now - past) < Chatty.antiFlood.timestampWindow) {
                    return;
                }
            }
        }
        Chatty.messages.push(messageObject);
        io.sockets.emit('chat', messageObject);
    },

    addUser: function(userId, nick) {
        var nick = S(nick).stripTags().toString();
        Chatty.users[userId] = { nick: nick, timestamps: [] };
        io.sockets.emit('addUser', { userId: userId, nick: nick });
        Chatty.chat(0, nick + ' connected');
    },

    changeNick: function(userId, newNick) {
        var oldNick = Chatty.users[userId].nick
        , newNick = S(newNick).stripTags().toString();
        Chatty.users[userId].nick = newNick;
        io.sockets.emit('changeNick', { userId: userId, nick: newNick });
        Chatty.chat(0, oldNick + ' changed nick to ' + newNick);
    },

    removeUser: function(userId) {
        var oldNick = Chatty.users[userId].nick;
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
            Chatty.addUser(socket.userId, 'NewUser' + socket.userId);
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
