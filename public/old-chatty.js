String.prototype.sanitize = function() {
    return $('<div/>').text(this).html();
};

var Chatty = {
    socket: null,
    showTimestamp: true,
    init: function() {
        Chatty.socket = io.connect(window.location.href);

        Chatty.socket.on('chat', function(data) {
            var message = '<span>' + data.nick.sanitize() + '</span>';
            message += Chatty.getTimestamp() + ': ' + data.message.sanitize() + "<br />";
            $('#chat').append(message);
            Chatty.scrollToLatest();
        });

        Chatty.socket.on('addUser', function(data) {
            $('#users').append("<option id='user-" + data.userId + "'>" + data.nick.sanitize() + "</option>");
        });

        Chatty.socket.on('changeNick', function(data) {
            $('#users option#user-' + data.userId).text(data.nick.sanitize());
        });

        Chatty.socket.on('removeUser', function(data) {
            $('#users option#user-' + data.userId).remove();
        });

        $('input').keypress(function(e) {
            if (e.keyCode == 13) {
                e.preventDefault();
                Chatty.socket.emit('chat', $(this).val().sanitize());
                $(this).val('');
            }
        });

        Chatty.scrollToLatest();

        var nick = prompt('Choose a nickname');
        if (nick) {
            Chatty.socket.emit('nick', nick.sanitize());
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
    },
    scrollToLatest: function() {
        var $chat = $('#chat');
        $chat.scrollTop($chat[0].scrollHeight);
    }
};

$(document).ready(function() {
    Chatty.init();
});