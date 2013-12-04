var http = require('http');
var requestify = require('requestify');
var when = require('when');
var sequence = require('when/sequence');
var config = require('config');
var Egg = require('../model/egg');

/**
 * Fetch packages json file from remote server
 * Promise is resolved with json response object
 *
 * @returns promise
 */
module.exports.fetchEggs = function() {
    return when.promise(function(resolve, reject) {
        requestify.get(config.bower.packages.url).then(function(response) {
            try {
                if (response.getCode() !== 200) {
                    throw new Error('Unexpected response code, got ' + response.getCode());
                }

                return resolve(JSON.parse(response.body));
            } catch (e) {
                return reject(e);
            }
        });
    });
};

module.exports.warmEggs = function(eggsData) {

    if (!Array.isArray(eggsData)) {
        throw new Error("eggsData is not array");
    }

    var tasks = [];

    eggsData.forEach(function(eggData) {
        tasks.push(when.promise(function(resolve, reject) {
            Egg.findOneAndUpdate({
                name: eggData.name
            }, {
                name: eggData.name,
                url: eggData.url
            }, {
                upsert: true
            }, function(err, doc) {
                if (err) {
                    reject(err);
                }
                resolve(true);
            })
        }));
    });

    sequence(tasks);
};