var app = require('./restServer');

app().then(function(server) {
    console.log('%s listening at %s', server.name, server.url);
});
