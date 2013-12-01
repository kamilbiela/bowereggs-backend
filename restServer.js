var config = require('config');
var restify = require('restify');
var when = require('when'); 

module.exports = function() {
    var deferred = when.defer();
    var server = restify.createServer();

    require('./routes/egg')(server);

    server.listen(config.server.port, function() {
        deferred.resolve(server);
    });

    return deferred.promise;
};
