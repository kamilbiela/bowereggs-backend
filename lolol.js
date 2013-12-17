var app = require('./app');
var githubUpdater = require('./lib/githubUpdater');
var nest = require('./lib/nest.js');

app().done(function (server) {
    console.log('%s listening at %s', server.name, server.url);

//    nest.fetchAndSave().done(function() {
        var g = new githubUpdater();
        g = g.warmEggs();
//    }, console.error);

}, function(err) {
    console.log('===> Main app error <=== ');
    console.log(err);
});
