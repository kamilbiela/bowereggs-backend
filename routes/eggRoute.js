var _ = require('lodash');
var when = require('when');
var parallel = require('when/parallel');

module.exports = function(server, Egg) {
    server.get('egg/:name', function(req, res, next) {
        Egg.findOne({name: req.params.name}, function(err, egg) {
            if (err) {
                throw err;
            }

            if (egg === null) {
                res.json(404, {code: "Not found"});
            } else {
                res.json(egg);
            }

            return next();
        })
    });

    server.get('egg', function(req, res, next) {

        var page = parseInt(req.query.page) || 1;
        var limit = 50;

        function cleanText(text) {
            text = text.replace(/[^\w\ \-\*]/i, '');
            text = text.replace(/\*/g, '.*');
            return text;
        };

        function buildOrCondition(text, byName, byDescription, byKeywords) {
            var or = [];
            if (byName && byName === 'true') {
                or.push({name: new RegExp('^' + text + '$')});
            }

            if (byDescription && byDescription === 'true') {
                or.push({description: new RegExp(text)});
            }

            if (byKeywords && byKeywords === 'true') {
                or.push({keywords: text});
            }

            return or;
        }

        function buildSearchConditions() {
            var conditions = {
                existsOnGithub: true
            };

            if (req.query.search) {
                var text = cleanText(req.query.search);

                var or = buildOrCondition(text, req.query.byName, req.query.byDescription, req.query.byKeywords);
                if (or.length > 1) {
                    conditions["$or"] = or;
                } else if (or.length === 1) {
                    _.assign(conditions, or[0]);
                }
            }

            return conditions;   
        }

        function getResponseSkeleton() {
            return {
                meta: {
                    count: 0,
                    page: page,
                    totalPages: 0
                },
                data: null
            };
        }

        function buildFindPromise() {
            return when.promise(function(resolve, reject) {
                Egg.find(conditions).skip(limit * (page - 1)).sort({stargazersCount: -1}).limit(limit).exec(function(err, eggs) {
                    if (err) {
                        return reject(err);
                    }

                    response.data = eggs;
                    return resolve();
                });
            });            
        }

        function buildCountPromise() {
            return when.promise(function(resolve, reject) {
                Egg.count(conditions).exec(function(err, count) {
                    if (err) {
                        return reject(err)
                    }

                    response.meta.count = count;
                    response.meta.totalPages = Math.ceil(count / limit);
                    return resolve();
                });
            });
        }

        var conditions = buildSearchConditions();
        var response = getResponseSkeleton();
        
        parallel([
            function() {
                return buildFindPromise();
            }, function() {
                return buildCountPromise();
            }
        ]).done(function() {
            res.json(response);
            next(); 
        }, function(err) {
            next(err);
        });
    });
}