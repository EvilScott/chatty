var lessMiddleware = require('less-middleware')
, express = require('express')
, app = express()
, http = require('http')
, server = http.createServer(app)
, io = require('socket.io').listen(server)
, S = require('string');

app.configure(function() {
    app.use(lessMiddleware({
        dest     : __dirname + '/public/css',
        src      : __dirname + '/public/less',
        prefix   : '/css',
        compress : true
    }));
    app.use(express.static(__dirname + '/public'));
});

server.listen(8080);

app.get('*', function(req, res) {
    res.sendfile(__dirname + '/public/index.html');
});

var Chatty = {
    users: [],
    messages: [],
    antiFlood: { maxMessages: 8, timestampWindow: 2000 },

    chat: function(userId, message, channel) {

        // create message object
        var user = userId == 0 ? null : Chatty.users[channel][userId]
        , now = new Date().getTime()
        , messageObject = {
            userId: userId,
            nick: userId == 0 ? 'SYSTEM' : user.nick,
            message: S(message).stripTags().toString(),
            channel: channel
        };

        // check for flooding
        if (userId != 0) {
            if (user.timestamps.length < Chatty.antiFlood.maxMessages) {
                user.timestamps.push(now);
            } else {
                var past = user.timestamps.shift();
                user.timestamps.push(now);
                if ((now - past) < Chatty.antiFlood.timestampWindow) return;
            }
        }

        // create channel messages if it does not exist
        if (!Chatty.messages[channel]) Chatty.messages[channel] = [];

        Chatty.messages[channel].push(messageObject);
        io.sockets.emit('chat', messageObject); //TODO only push to users in channels
    },

    addUser: function(userId, nick, channel) {

        // create channel users if it does not exist
        if (!Chatty.users[channel]) Chatty.users[channel] = [];

        // sanitize nick
        nick = S(nick).stripTags().toString();

        // do not add existing user
        if (Chatty.users[channel][userId]) {
            Chatty.changeNick(userId, nick, channel);

        // add new user
        } else {
            Chatty.users[channel][userId] = { nick: nick, timestamps: [] };
            io.sockets.emit('addUser', { userId: userId, nick: nick, channel: channel });
            Chatty.chat(0, nick + ' has joined', channel);
        }
    },

    changeNick: function(userId, newNick, channel) {
        var oldNick = Chatty.users[channel][userId].nick;
        newNick = S(newNick).stripTags().toString();
        Chatty.users[channel][userId].nick = newNick;
        io.sockets.emit('changeNick', { userId: userId, nick: newNick, channel: channel });
        Chatty.chat(0, oldNick + ' changed nick to ' + newNick, channel);
    },

    removeUser: function(userId, channel) {
        var oldNick = Chatty.users[channel][userId].nick;
        delete Chatty.users[channel][userId];
        io.sockets.emit('removeUser', { userId: userId, channel: channel });
        Chatty.chat(0, oldNick + ' has left', channel);
    },

    getUserId: function(socket) {
        return socket.handshake.address.address.replace(/\./g,'-');
    },

    init: function() {
        io.sockets.on('connection', function(socket) {

            socket.userId = Chatty.getUserId(socket);

            // join channel
            socket.on('join', function(data) {
                var channel = data.channel
                , nick = data.nick;

                // create channel messages if it does not exist
                if (!Chatty.messages[channel]) Chatty.messages[channel] = [];

                // create channel users if it does not exist
                if (!Chatty.users[channel]) Chatty.users[channel] = [];

                // send all current users to client
                for (var userId in Chatty.users[channel]) {
                    var userObject = { userId: userId, nick: Chatty.users[channel][userId].nick, channel: channel };
                    socket.emit('addUser', userObject);
                }

                // send history of messages to client
                Chatty.messages[channel].forEach(function(messageObject){
                    socket.emit('chat', messageObject);
                });

                // add new user
                if (!Chatty.users[channel][socket.userId]) Chatty.addUser(socket.userId, nick, channel);
            });

            // change nick
            socket.on('changeNick', function(data) { Chatty.changeNick(socket.userId, data.nick, data.channel); });

            // broadcast chat
            socket.on('chat', function(data) { Chatty.chat(socket.userId, data.message, data.channel); });

            // leave channel
            socket.on('leave', function(data) { Chatty.removeUser(socket.userId, data.channel); });

            // disconnect
            socket.on('disconnect', function() {
                Chatty.users.forEach(function(channel, channelName) {
                    if (channel[socket.userId]) Chatty.removeUser(socket.userId, channelName);
                });
            });
        });
    }
};

Chatty.init();
