var Chatty = {
    socket: null,
    init: function() {
        Chatty.socket = io.connect('http://www.vertsreis.dev:8080');

        var nick = prompt('Choose a nickname');
        if (nick) {
            Chatty.socket.emit('nick', nick);
        }

        Chatty.socket.on('chat', function(data) {
            var timestamp = (new Date()).toTimeString();
            $('div').append(data.nick + ' (' + timestamp + '): ' + data.message + "<br />");
        });

        Chatty.socket.on('disc', function(data) {
            $('div').append('SYSTEM (' + timestamp + '): ' + data.nick + " disconnected<br />");
        });

        $('input').keypress(function(e) {
            if (e.keyCode == 13) {
                e.preventDefault();
                Chatty.socket.emit('chat', $(this).val());
                $(this).val('');
            }
        });
    }
};

$(document).ready(function() {
    Chatty.init();
});