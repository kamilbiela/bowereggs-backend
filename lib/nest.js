var requestify = require('requestify');
var when = require('when');
var sequence = require('when/sequence');
var pipeline = require('when/pipeline');
var config = require('config');
var Egg = require('../model/egg');

/**
 * Fetch packages json file from remote server
 * Promise is resolved with json response object
 *
 * @returns promise
 */
module.exports.fetchEggs = fetchEggs;
module.exports.saveEggs = saveEggs;
module.exports.fetchAndSave = fetchAndSave;

function fetchEggs() {
    return when.promise(function(resolve, reject) {
        requestify.get(config.bower.packages.url).then(function(response) {
            try {
                if (response.getCode() !== 200) {
                    throw new Error('Unexpected response code, got ' + response.getCode());
                }

                resolve(JSON.parse(response.body));
            } catch (e) {
                return reject(e);
            }
        });
    });
};


/**
 * Get insert new packages / update old in database
 * @param eggsData Array
 */
function saveEggs(eggsData) {
    if (!Array.isArray(eggsData)) {
        throw new Error("eggsData is not array");
    }

    var tasks = [];
    eggsData.forEach(function(eggData) {
        tasks.push(function() {
            return when.promise(function(resolve, reject) {
                Egg.findOneAndUpdate({
                    name: eggData.name
                }, {
                    name: eggData.name,
                    url: eggData.url
                }, {
                    upsert: true
                }, function(err, obj) {
                    if (err) {
                        return reject(err);
                    }
                    return resolve(obj);
                });
            });
        });
    });

    return sequence(tasks);
};

function fetchAndSave() {
    return pipeline([
        function() {
            return fetchEggs();
        },
        function(eggs) {
            return saveEggs(eggs);
        }
    ]);
}

