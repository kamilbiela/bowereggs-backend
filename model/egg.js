var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var url = require('url');

var eggSchema = new Schema({
    name: String,
    url: String,
    existsOnGithub: {type: Boolean, default: true},
    htmlUrl: String,
    keywords: [String],
    description: String,
    createdAt: Date,
    updatedAt: Date,
    forksCount: Number,
    stargazersCount: Number,
    masterBranch: String,
    owner: {
        avatarUrl: String,
        login: String
    }
});

eggSchema.virtual('githubName').get(function() {
    var p = url.parse(this.url).pathname || "";

    if (p.substr(-4) === '.git') {
        p = p.substr(0, p.length - 4);
    }

    if (p.substr(0, 1) === '/') {
        p = p.substr(1);
    }

    if (p.substr(0, 1) === ':') {
        p = p.substr(1);
    }

    return p;
});

var Egg = mongoose.model('Egg', eggSchema);

module.exports = Egg;