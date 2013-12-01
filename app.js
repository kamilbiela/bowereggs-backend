var config = require('config');
var restify = require('restify');
var when = require('when');
var mongoose = require('mongoose');

var Egg = require('./model/egg');

module.exports = function() {
    return when.promise(function(resolve, reject) {
        var server = restify.createServer();
        server.use(restify.queryParser());
        // routes
        require('./routes/eggRoute')(server, Egg);

        // mongo
        mongoose.connect('mongodb://localhost/' + config.db.name);

        var db = mongoose.connection;
        db.on('error', function(error) {
            console.log('===> Database connection error');

            reject(error);
        });

        db.once('open', function() {
            console.log('===> Connected to mongodb');

            server.listen(config.server.port, function() {
                console.log('===> Server running on :' + config.server.port)
                resolve(server);
            });
        });
    });
};
