String.prototype.sanitize = function() {
    return $('<div/>').text(this).html();
};