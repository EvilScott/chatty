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

io.sockets.on('connection', function(socket) {
    socket.set('nick', 'StupidNoob' + Math.floor((Math.random()*100)+1));

    socket.get('nick', function(err, nick) {
        io.sockets.emit('chat', { nick: 'SYSTEM', message: nick + ' connected' });
    });

    socket.on('nick', function(newNick) {
        socket.get('nick', function(err, oldNick){
            io.sockets.emit('chat', { nick: 'SYSTEM', message: oldNick + ' changed nick to ' + newNick });
            socket.set('nick', newNick);
        });
    });

    socket.on('chat', function(message) {
        socket.get('nick', function(err, nick) {
            io.sockets.emit('chat', { nick: nick, message: message });
        });
    });

    socket.on('disconnect', function() {
        socket.get('nick', function(err, nick) {
            io.sockets.emit('chat', { nick: 'SYSTEM', message: nick + ' disconnected' });
        });
    });
});