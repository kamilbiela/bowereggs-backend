var _ = require('lodash');

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

        var cleanText = function(text) {
            text = text.replace(/[^\w\ \-\*]/i, '');
            text = text.replace(/\*/g, '.*');
            return text;
        };

        var buildOrCondition = function(text, byName, byDescription, byKeywords) {
            var or = [];
            if (byName) {
                or.push({name: new RegExp('^' + text + '$')});
            }

            if (byDescription) {
                or.push({description: new RegExp(text)});
            }

            if (byKeywords) {
                or.push({keywords: text});
            }

            return or;
        }

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

        console.log(conditions)

        Egg.find(conditions).skip(limit * (page - 1)).limit(limit).exec(function(err, eggs) {
            if (err) {
                return next(err);
            }

            res.json(eggs);
            return next();
        });

    });
}