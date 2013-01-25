var Chatty = {
    socket: null,
    showTimestamp: true,
    init: function() {
        Chatty.socket = io.connect('http://www.vertsreis.dev:8080');

        var nick = prompt('Choose a nickname');
        if (nick) {
            Chatty.socket.emit('nick', nick);
        }

        Chatty.socket.on('chat', function(data) {
            $('div').append('<span>' + data.nick + '</span>' + Chatty.getTimestamp() + ': ' + data.message + "<br />");
        });

        $('input').keypress(function(e) {
            if (e.keyCode == 13) {
                e.preventDefault();
                Chatty.socket.emit('chat', $(this).val());
                $(this).val('');
            }
        });
    },
    getTimestamp: function() {
        if (!Chatty.showTimestamp) {
            return '';
        }
        var date = new Date();
        return ' (' + ('0' + date.getHours()).slice(-2) + ':' + ('0' + date.getMinutes()).slice(-2) + ':' + ('0' + date.getSeconds()).slice(-2) + ')';
    }
};

$(document).ready(function() {
    Chatty.init();
});