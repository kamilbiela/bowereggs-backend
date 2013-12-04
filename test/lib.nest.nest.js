var app = require('../restServer')
var assert = require('assert');
var nest = require('../lib/nest/nest');
var nock = require('nock');

nock.disableNetConnect();

describe('lib.nest.nest.js', function(){
    beforeEach(function(done) {
        app().then(function(){
            done();
        });
    });

    describe('#fetchEggs()', function(){
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
    })
})