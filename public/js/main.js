require.config({
    urlArgs: "bust=" + (new Date()).getTime(),
    packages: [
        {
            name: 'socket',
            location: '/socket.io',
            main: 'socket.io'
        }
    ],
    paths: {
        jquery: 'vendor/jquery',
        underscore: 'vendor/underscore',
        backbone: 'vendor/backbone',
        text: 'vendor/text',
        string: 'vendor/string',
        template: '../template'
    },
    shim: {
        underscore: {
            exports: '_'
        },
        backbone: {
            deps: ['underscore', 'jquery'],
            exports: 'Backbone'
        },
        string: {
            deps: ['jquery']
        }
    }
});

require([
    'app'
], function(App) {
    App.init();
});