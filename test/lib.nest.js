var assert = require('assert');
var nock = require('nock');
var _ = require('lodash');

var Egg = require('../model/egg.js')
var nest = require('../lib/nest');

nock.disableNetConnect();

describe('lib.nest', function() {

    describe('#fetchEggs()', function() {
        it('should fetch remote server and return promise that resolve to json', function(done) {
            nock('https://bower.herokuapp.com')
                .get('/packages')
                .reply(200, JSON.stringify(
                    [{name: "test name 1"}, {name: '123'}]
                ));

            nest.fetchEggs().then(function(json) {
                assert.strictEqual(json.length, 2);
                assert.strictEqual(json[0].name, "test name 1");
                done();
            }).otherwise(done);
        })
    });

    describe('#saveEggs()', function() {
        it('should add and update package entries in database', function(done) {
            var eggs = [
                {"name": "zxcvbn", "url": "git://github.com/lowe/zxcvbn.git"},
                {"name": "zurb-reveal", "url": "git://github.com/zurb/reveal.git"},
                {"name": "ztree", "url": "git://github.com/blacktail/ztree.git"},
                {"name": "zoomy2", "url": "git://github.com/jameslouiz/Zoomy"}
            ];

            Egg.findOneAndUpdate = function(findBy, data) {
                var result = _.find(eggs, findBy);
                assert.ok(result, "Object " + findBy.name + " should be added to database");
            };

            nest.saveEggs(eggs).done(function() {
                done();
            });
        });
    });
})