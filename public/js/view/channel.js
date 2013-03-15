define([
    'jquery',
    'underscore',
    'backbone',
    'text!template/channel.html'
], function($, _, Backbone, ChannelTemplate) {
    return ChannelView = Backbone.View.extend({
        el: 'body',
        render: function() {
            this.$el.html(_.template(ChannelTemplate));
            return this;
        }
    });
});