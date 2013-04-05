var lessMiddleware = require('less-middleware')
, express = require('express')
, app = express()
, http = require('http')
, server = http.createServer(app)
, io = require('socket.io').listen(server)
, S = require('string')
, Channel = require('./lib/channel.js')
, User = require('./lib/user.js');

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
    users: {},
    channels: {},

    init: function() {
        io.sockets.on('connection', function(socket) {

            // create user if it does not exist
            var user = User({ socket: socket });
            if (Chatty.users[user.id]) {
                user = Chatty.users[user.id];
                Chatty.users[user.id].sockets.push(socket);
            } else {
                Chatty.users.push(user);
            }

            // join channel
            socket.on('join', function(data) {
                var channelName = data.channel
                , nick = data.nick;

                //TODO update user nick
                user.nick = 'NewUser' + ((Math.random() * 100) + 1)

                // create channel if it does not exist
                if (!Chatty.channels[channelName]) {
                    var channel = Channel({ name: channelName });
                    Chatty.channels[channelName] = channel;
                } else {
                    var channel = Chatty.channels[channelName];
                }

                // send all current users to client
                channel.users.forEach(function(user) {
                    socket.emit('addUser', { userId: user.id, nick: user.nick, channel: channelName });
                });

                // send history of messages to client
                channel.messages.forEach(function(messageObject){ socket.emit('chat', messageObject); });

                // add new user
                channel.addUser(user);
            });

            // broadcast chat
            socket.on('chat', function(data) { Chatty.channels[data.channel].chat(user, data.message); });

            // leave channel
            socket.on('leave', function(data) { Chatty.channels[data.channel].removeUser(user); });

            // disconnect
            socket.on('disconnect', function() { /* TODO disconnect from multiple channels? */ });
        });
    }
};

Chatty.init();
