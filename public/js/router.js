define([
    'jquery',
    'underscore',
    'backbone',
    'socket',
    'view/channel'
], function($, _, Backbone, io, ChannelView) {
    var ChattyRouter = Backbone.Router.extend({
        routes: {
            ''           : 'general',
            ':channel'   : 'channel'
        },

        initialize: function() {
            this.socket = io.connect(window.location.href);
            var self = this;
            $('#other-channels').on('click', 'a', function(e) {
                e.preventDefault();
                self.navigate($(e.currentTarget).attr('href'), { trigger: true });
            });
        },

        general: function() {
            this.channel('general');
        },

        channel: function(channel) {
            if (_.has(this, 'channelView')) {
                var nick = this.channelView.nick;
                this.channelView.tearDown().remove();
            }
            var options = { channel: channel, socket: this.socket, nick: nick };
            this.channelView = new ChannelView(options);
            this.channelView.render().setUp();
        }
    });

    return {
        init: function() {
            var router = new ChattyRouter();
            Backbone.history.start({ pushState: true });
        }
    };
});