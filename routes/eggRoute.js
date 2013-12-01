module.exports = function(server, Egg) {
    server.get('/egg/:name', function(req, res, next) {
        Egg.findOne({name: name}, function(err, egg) {
            if (err) {
                throw err;
            }

            res.json(egg);
            return next();
        })
    });

    server.get('/egg', function(req, res, next) {
        if (req.query.name) {

        }
    });
}