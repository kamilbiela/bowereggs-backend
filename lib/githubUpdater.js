require('when/monitor/console');

var github = require('octonode');
var when = require('when');
var pipeline = require('when/pipeline');
var sequence = require('when/sequence');
var delay = require('when/delay');
var Egg = require('../model/egg');
var _ = require('lodash');

module.exports = GithubUpdater;

function GithubUpdater(optionalClient) {

    if (optionalClient) {
        this.ghClient = optionalClient;
    } else {
        this.ghClient = github.client({
            id: 'c128174b19acf6ae0747',
            secret: '7d77370d57fc5942f160aae44f788bbd0bd4eed4'
        });
    }

    this.api = {
        limitRemaining: undefined,
        resetTime: undefined
    };
}

GithubUpdater.prototype.updateApiLimitsFromHeaderResponse = function(headers) {
    var newLimitRemaining = parseInt(headers["x-ratelimit-remaining"]);
    var newResetTime = parseInt(headers['x-ratelimit-reset']);

    if (this.api.resetTime !== undefined && this.api.resetTime < newResetTime) {
        return;
    }
    this.api.limitRemaining = newLimitRemaining;
    this.api.resetTime = newResetTime;
}

GithubUpdater.prototype.delayApiCallIfNeeded = function(promise) {
    if (this.api.limitRemaining === 0) {
        var currentTime = Math.floor( (new Date()).getTime() / 1000 );
        var diff = this.resetTime - currentTime;

        if (diff > 0) {
            return delay(diff, promise);
        }
    }

    return promise;
};

GithubUpdater.prototype.getAllEggs = function() {
    return when.promise(function(resolve, reject) {
        Egg.find({}, null, {limit: 4}, function(err, data) {
            if (err) {
                return reject(err);
            }
            return resolve(data);
        });
    })
}

GithubUpdater.prototype.getEggDataFromGithub = function(egg) {
    var _this = this;
    return when.promise(function(resolve, reject) {

        var ghrepo = _this.ghClient.repo(egg.githubName);
        console.log('get repo info', egg.githubName);

        ghrepo.info(function(err, body, headers) {
            if (err) {
                return reject(err);
            }

            console.log(headers);

            egg = _.assign(egg, {
                url: body.url,
                htmlUrl: body.html_url,
                description: body.description,
                owner: body.owner.login,
                createdAt: body.created_at,
                updatedAt: body.updated_at,
                forksCount: body.forks_count,
                stargazersCount: body.stargazers_count,
                masterBranch: body.master_branch
            });

            return resolve(egg);
        });
    });
};

GithubUpdater.prototype.updateEggDataKeywords = function(egg) {
    var _this = this;
    return when.promise(function(resolve, reject) {
        var ghrepo = _this.ghClient.repo(egg.githubName)
        console.log('Get bower.json from gh', egg.githubName);
        ghrepo.contents("bower.json", function(err, body, headers) {

            console.log(headers);

            if (err) {
                if (parseInt(err.statusCode) === 404) {
                    // repo don't have bower.json file.
                    // well, I think it's valid?
                    console.log('No bower.json file');
                    return resolve(egg);
                }
                return reject(err);
            }

            if (body.encoding == 'base64') {
                var bower = JSON.parse(new Buffer(body.content || '', 'base64').toString('utf8'));
                console.log(bower);
            } else {
                throw new Error("unsupported coding '" + body.enconding + "'");
            }

            if (_.isArray(bower.keywords)) {
                egg.keywords = bower.keywords;
            }

            return resolve(egg);
        });
    });
};

GithubUpdater.prototype.saveEgg = function(egg) {
    return when.promise(function(resolve, reject) {
        if (!egg.isModified()) {
            return resolve(egg);
        }

        egg.save(function(err) {
            if (err) {
                return reject(err);
            }

            return resolve(egg);
        });
    });
};

GithubUpdater.prototype.warmEggs = function() {

    var _this = this;

    var createPipeline = function(egg) {
        return function() {
            pipeline([
                function(egg) {
                    console.log('pipeline', egg.name);
                    return egg;
                },
                _this.getEggDataFromGithub.bind(_this),
                _this.saveEgg.bind(_this),
                _this.updateEggDataKeywords.bind(_this),
                _this.saveEgg.bind(_this)
            ], egg);
        }
    };

    pipeline([
        this.getAllEggs.bind(_this),
        function(eggs) {
            var tasks = [];

            eggs.forEach(function(egg) {
                tasks.push(createPipeline(egg));
            });

            return tasks;
        },
        function(tasks) {
            sequence(tasks).done();
        }
    ]).done();
};