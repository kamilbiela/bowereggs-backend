var http = require('http');
var requestify = require('requestify');
var when = require('when');
var config = require('config')

module.exports = Nest;

function Nest() {

}

Nest.prototype.check = function() {

}

/**
 * Fetch packages json file from remote server
 * Promise is resolved with json response object
 *
 * @returns promise
 */
Nest.prototype.fetchData = function() {
    return when.promise(function(resolve, reject) {
        requestify.get(config.bower.packages.url).then(function(response) {
            try {
                if (response.getCode() !== 200) {
                    throw new Error('Unexpected response code, got ' + response.getCode());
                }

                resolve(JSON.parse(response.body));
            } catch (e) {
                console.log('reject', e);
                reject(e);
            }
        });

    });
}