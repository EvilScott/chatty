define([
    'jquery',
    'underscore',
    'backbone',
    'view/channel'
], function($, _, Backbone, ChannelView) {
    var ChattyRouter = Backbone.Router.extend({
        routes: {
            ''           : 'general',
            ':channel'   : 'channel'
        },
        general: function() {
            this.channelView = new ChannelView({ channel: 'general' });
            this.channelView.render();
        },
        channel: function(channel) {
            this.channelView.remove();
            this.channelView = new ChannelView({ channel: channel });
            this.channelView.render();
        }
    });

    return {
        init: function() {
            var router = new ChattyRouter();
            Backbone.history.start({ pushState: true });
        }
    }
});