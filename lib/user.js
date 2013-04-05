var maxMessages = 8
, timestampWindow = 2000;

User = function(attrs) {
    this.id = attrs.socket.handshake.address.address.replace(/\./g,'-');
    this.sockets = [attrs.socket];
    this.timestamps = [];
};

User.prototype = {
    isFlooding: function() {
        if (userId == 0) return false;
        if (user.timestamps.length < maxMessages) {
            user.timestamps.push(now);
            return false;
        } else {
            var past = user.timestamps.shift();
            user.timestamps.push(now);
            return (now - past) < timestampWindow;
        }
    },

    emit: function(event, data) {
        this.sockets.forEach(function(socket) {
            socket.emit(event, data);
        });
    }
};

module.exports = function(attrs) {
    return new User(attrs);
};