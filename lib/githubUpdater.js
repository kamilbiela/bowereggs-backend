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
        this.ghClient = github.client();
    }

    this.api = {
        limitRemaining: undefined,
        resetTime: undefined
    };
}

GithubUpdater.prototype.updateApiLimitsFromHeaderResponse = function(headers) {
    if (!headers) {
        return;
    }

    var newLimitRemaining = parseInt(headers["x-ratelimit-remaining"]);
    var newResetTime = parseInt(headers['x-ratelimit-reset']);

    if (newLimitRemaining >= this.api.limitRemaining && this.api.resetTime !== undefined && this.api.resetTime >= newResetTime) {
        return;
    }
    this.api.limitRemaining = newLimitRemaining;
    this.api.resetTime = newResetTime;
}

GithubUpdater.prototype.delayAfterApiCallIfNeeded = function(promise) {
    console.log('---> rate limit: ', this.api.limitRemaining);
    if (this.api.limitRemaining <= 10) {
        var currentTime = Math.floor( (new Date()).getTime() / 1000 );
        var diff = (this.api.resetTime - currentTime) * 1000;

        if (diff > 0) {
            console.log('delay for ', diff / 1000 / 60, ' m');
            return delay(diff, promise);
        }
    }

    return promise;
};

GithubUpdater.prototype.getAllEggs = function() {
    return when.promise(function(resolve, reject) {

        var conditions = {
            $or: [
                {
                    existsOnGithub: true
                },
                {
                    existsOnGithub: {$exists: false}
                }
            ]
        };

        Egg.find(conditions, null, null, function(err, data) {
            if (err) {
                return reject(err);
            }
            return resolve(data);
        });
    });
}

GithubUpdater.prototype.getEggDataFromGithub = function(egg) {
    var _this = this;
    var promise = when.promise(function(resolve, reject) {

        var ghrepo = _this.ghClient.repo(egg.githubName);
        console.log('---> get repo info', egg.githubName);

        ghrepo.info(function(err, body, headers) {

            _this.updateApiLimitsFromHeaderResponse(headers);

            if (err) {
                if (parseInt(err.statusCode) === 404) {
                    egg.existsOnGithub = false;
                    resolve(egg);
                }
                return reject(err);
            }

            _.assign(egg, {
                existsOnGithub: true,
                url: body.url,
                htmlUrl: body.html_url,
                description: body.description,
                owner: body.owner.login,
                createdAt: body.created_at,
                updatedAt: body.updated_at,
                forksCount: body.forks_count,
                stargazersCount: body.stargazers_count,
                masterBranch: body.master_branch,
                owner: {
                    avatarUrl: body.owner.avatar_url
                }
            });

            return resolve(egg);
        });
    });

    return this.delayAfterApiCallIfNeeded(promise);
};

GithubUpdater.prototype.updateEggDataKeywords = function(egg) {
    var _this = this;
    var promise = when.promise(function(resolve, reject) {

        if (_.has(egg, "existsOnGithub") && egg.existsOnGithub === false) {
            return resolve(egg);
        }

        var ghrepo = _this.ghClient.repo(egg.githubName)
        console.log('---> Get bower.json from gh', egg.githubName);
        ghrepo.contents("bower.json", function(err, body, headers) {
            _this.updateApiLimitsFromHeaderResponse(headers);

            if (err) {
                if (parseInt(err.statusCode) === 404) {
                    // repo don't have bower.json file.
                    // well, I think it's valid?
                    console.log('---! No bower.json file');
                    return resolve(egg);
                }
                return reject(err);
            }

            if (body.encoding == 'base64') {
                var bower = JSON.parse(new Buffer(body.content || '', 'base64').toString('utf8'));
            } else {
                throw new Error("unsupported coding '" + body.enconding + "'");
            }

            if (_.isArray(bower.keywords)) {
                egg.keywords = bower.keywords;
            }

            return resolve(egg);
        });
    });

    return this.delayAfterApiCallIfNeeded(promise);
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
            return pipeline([
                function(egg) {
                    console.log('---> updating ', egg.name);
                    return egg;
                },
                _this.getEggDataFromGithub.bind(_this),
                _this.saveEgg.bind(_this),
                _this.updateEggDataKeywords.bind(_this),
                _this.saveEgg.bind(_this),
                function(egg) {
                    return egg;
                }
            ], egg);
        }
    };

    return pipeline([
        this.getAllEggs.bind(_this),
        function(eggs) {
            var tasks = [];

            eggs.forEach(function(egg) {
                tasks.push(createPipeline(egg));
            });

            return tasks;
        },
        function(tasks) {
            console.log('===> start update packages from github');
            sequence(tasks).done(function() {
                console.log('===> github update finised');
            });
        }
    ]);
};