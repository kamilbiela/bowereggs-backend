var config = require('config');
var restify = require('restify');
var when = require('when'); 
var mongoose = require('mongoose');

module.exports = function() {
    return when.promise(function(resolve, reject){
        var server = restify.createServer();

        // routes
        require('./routes/egg')(server);

        // mongo
        mongoose.connect('mongodb://localhost/' + config.db.name);

        var db = mongoose.connection;
        db.on('error', function(error) {
            reject(error);
            throw error;
        });

        db.once('open', function callback () {
            server.listen(config.server.port, function() {
                resolve(server);
            });
        });
    });
};
