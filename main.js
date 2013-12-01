var app = require('./app');
var githubUpdater = require('./lib/githubUpdater');
var config = require('config');
var nest = require('./lib/nest');
var github = require('octonode');

app().done(function (server) {
    console.log('%s listening at %s', server.name, server.url);

    // update eggs
    function updateEggs() {
        console.log('===> updating data');

        nest.fetchAndSave().done(function() {

            var ghClient = null;

            if (config.github.client.id && config.github.client.secret) {
                ghClient = github.client({
                    id: config.github.client.id,
                    secret: config.github.client.secret
                });
            }

            var g = new githubUpdater(ghClient);
            g.warmEggs();
        }, console.error);
    }
// settimeout wewnatrz updateeggs
    setInterval(updateEggs, 24 * 60 * 60 * 1000);
    updateEggs();

}, console.error);
