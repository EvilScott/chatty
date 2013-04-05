var S = require('string')
, system = { id: 0, nick: 'SYSTEM' };

Channel = function(attrs) {
    this.name = attrs.name;
    this.users = [];
    this.messages = [];
};

Channel.prototype = {
    addUser: function(user) {
        this.users.push(user);
        this.chat(system, user.nick + ' joined');
    },

    removeUser: function(user) {
        this.users.forEach(function(thisUser, i) {
            if (thisUser == user) delete this.users[i];
            this.chat(system, user.nick + ' left');
        }, this);
    },

    chat: function(user, message) {
        var messageObject = {
            userId: user.id,
            nick: user.nick,
            message: S(message).stripTags().toString(),
            channel: this.name
        };
        if(!user.isFlooding()) {
            this.messages.push(messageObject);
            this.users.forEach(function(thisUser) {
                thisUser.emit('chat', messageObject);
            });
        }
    },

    emit: function(event, data) {
        this.users.forEach(function(user) {
            user.emit(event, data);
        });
    }
};

module.exports = function(attrs) {
    return new Channels(attrs);
};