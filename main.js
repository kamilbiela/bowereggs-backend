var app = require('./app');
var githubUpdater = require('./lib/githubUpdater');

app().done(function (server) {
    console.log('%s listening at %s', server.name, server.url);


    githubUpdater();

}, console.error);
