var Chatty = {
    socket: null,
    showTimestamp: true,
    init: function() {
        Chatty.socket = io.connect(window.location.href);

        Chatty.socket.on('chat', function(data) {
            var $chat = $('#chat');
            var message = '<span>' + data.nick + '</span>' + Chatty.getTimestamp() + ': ' + data.message + "<br />";
            $chat.append(message);
            $chat.scrollTop($chat.height());
        });

        Chatty.socket.on('addUser', function(data) {
            $('#users').append("<p id='" + data.nick + "'>" + data.nick + "</p>");
        });

        Chatty.socket.on('removeUser', function(data) {
            $('#users #' + data.nick).remove();
        });

        $('input').keypress(function(e) {
            if (e.keyCode == 13) {
                e.preventDefault();
                Chatty.socket.emit('chat', $(this).val());
                $(this).val('');
            }
        });

        var nick = prompt('Choose a nickname');
        if (nick) {
            Chatty.socket.emit('nick', nick);
        }
    },
    getTimestamp: function() {
        if (!Chatty.showTimestamp) {
            return '';
        }
        var date = new Date()
            , hours = ('0' + date.getHours()).slice(-2)
            , minutes = ('0' + date.getMinutes()).slice(-2)
            , seconds = ('0' + date.getSeconds()).slice(-2);
        return ' (' + hours + ':' + minutes + ':' + seconds + ')';
    }
};

$(document).ready(function() {
    Chatty.init();
});