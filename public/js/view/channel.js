define([
    'jquery',
    'underscore',
    'backbone',
    'text!template/channel.html',
    'socket',
    'string'
], function($, _, Backbone, ChannelTemplate) {
    return ChannelView = Backbone.View.extend({
        className: 'channel',

        initialize: function(options) {
            _.extend(this, options);
        },

        render: function() {
            var html = this.$el.html(_.template(ChannelTemplate));
            $('#main').html(html);
            return this;
        },

        setUp: function() {
            var self = this;

            this.socket.on('chat', function(data) { self.chat(data); });
            this.socket.on('addUser', function(data) { self.addUser(data); });
            this.socket.on('removeUser', function(data) { self.removeUser(data); });

            if (!this.nick && !(this.nick = prompt('Choose a nickname'))) {
                this.nick = 'NewUser' +  Math.floor((Math.random() * 1000) + 1);
            }

            this.socket.emit('join', { channel: this.channel, nick: this.nick });

            this.$el.find('input[type="text"]').keypress(function(e) {
                if (e.keyCode == 13) {
                    e.preventDefault();
                    self.socket.emit('chat', { message: $(this).val().sanitize(), channel: self.channel });
                    $(this).val('');
                }
            });
            return this;
        },

        tearDown: function() {
            this.socket.emit('leave', { channel: this.channel });
            return this;
        },

        chat: function(data) {
            if (data.channel != this.channel) return;

            var message = '<span>' + data.nick.sanitize() + '</span>';
            message += this.getTimestamp() + ': ' + data.message.sanitize() + "<br />";
            this.$el.find('.chat').append(message);
            this.scrollToLatest();
        },

        addUser: function(data) {
            if (data.channel != this.channel) return;

            var user = "<div id='user-" + data.userId + "'>" + data.nick.sanitize() + "</div>";
            this.$el.find('.users').append(user);
        },

        removeUser: function(data) {
            if (data.channel != this.channel) return;

            this.$el.find('.users #user-' + data.userId).remove();
        },

        getTimestamp: function() {
            var date = new Date()
            , hours = ('0' + date.getHours()).slice(-2)
            , minutes = ('0' + date.getMinutes()).slice(-2)
            , seconds = ('0' + date.getSeconds()).slice(-2);
            return ' (' + hours + ':' + minutes + ':' + seconds + ')';
        },

        scrollToLatest: function() {
            var $chat = this.$el.find('.chat');
            $chat.scrollTop($chat[0].scrollHeight);
        }
    });
});