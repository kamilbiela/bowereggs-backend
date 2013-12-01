var assert = require('assert');
var nock = require('nock');
var _ = require('lodash');
var github = require('octonode');
var when = require('when');

var getReposResponse = require('./githubApiResponse/getRepos.js');
var headerResponseGenerator = require('./githubApiResponse/headers.js');
var getRepoContentsBowerResponse = require('./githubApiResponse/getRepoContentsBowerJson.js');

var Egg = require('../model/egg.js')
var Gu = require('../lib/githubUpdater');

nock.disableNetConnect();

describe('lib.githubUpdater', function() {
    describe('#getAllEggs()', function() {
        it('should ask for all eggs in database', function(done) {
            Egg.find = function(searchParams, x, y, callback) {
                assert.ok(searchParams);
                callback(undefined, []);
            }

            var gu = new Gu(github.client());
            gu.getAllEggs().done(function(data) {
                assert.equal(_.isArray(data) && data.length, 0);
                done();
            });
        })
    });

    describe('#updateApiLimitsFromHeaderResponse', function() {
        it ('should update limit values from response', function() {

            var timestamp = Math.floor( (new Date()).getTime() / 1000 );

            var headers = headerResponseGenerator(10, timestamp + 20);
            var gu = new Gu(github.client());
            gu.updateApiLimitsFromHeaderResponse(headers);

            assert.strictEqual(gu.api.resetTime, timestamp + 20);
            assert.strictEqual(gu.api.limitRemaining, 10);
        });

        it('should not overwrite values when new ones are older', function() {
            var timestamp = Math.floor( (new Date()).getTime() / 1000 );
            var gu = new Gu(github.client());

            gu.updateApiLimitsFromHeaderResponse(headerResponseGenerator(50, timestamp + 20));
            gu.updateApiLimitsFromHeaderResponse(headerResponseGenerator(51, timestamp))
            assert.strictEqual(gu.api.limitRemaining, 50);
        });

        it('should update api limits information', function() {
            var timestamp = Math.floor( (new Date()).getTime() / 1000 );
            var headers = headerResponseGenerator(10, timestamp);
            var gu = new Gu(github.client());

            gu.updateApiLimitsFromHeaderResponse(headers);

            assert.strictEqual(gu.api.resetTime, timestamp);
            assert.strictEqual(gu.api.limitRemaining, 10);
        });
    });

    describe('#delayAfterApiCallIfNeeded', function() {
        it ('should delay promise chain', function(done) {
            var time = (new Date()).getTime();
            var timestamp = Math.floor(time / 1000);

            var gu = new Gu(github.client());

            // couldn't get sinon js timers to work here.
            gu.updateApiLimitsFromHeaderResponse(headerResponseGenerator(0, timestamp + 1));
            var promise = gu.delayAfterApiCallIfNeeded(
                when.resolve(function() {
                    return 1;
                })
            );

            promise.done(function(){
                done();
            });
        });
    });

    describe('#getEggDataFromGithub()', function() {
        it('should ask for data from github api', function(done) {

            nock('https://api.github.com')
                .get('/repos/kamilbiela/bowereggs-backend')
                .reply(200, JSON.stringify(
                    getReposResponse
                ));

            var gu = new Gu(github.client());
            gu.getEggDataFromGithub({name: 'test', githubName: 'kamilbiela/bowereggs-backend'}).done(function(data) {
                assert(data.owner, 'kamilbiela');
                done();
            });
        });
    });

    describe('#updateEggDataKeywords', function() {
        it('should ask for keywords from bower.json file from github', function(done) {
            nock('https://api.github.com')
                .get('/repos/kamilbiela/bowereggs-backend/contents/bower.json?ref=master')
                .reply(200, JSON.stringify(
                    getRepoContentsBowerResponse
            ));

            var gu = new Gu(github.client());
            gu.updateEggDataKeywords({name: 'test', githubName: 'kamilbiela/bowereggs-backend'}).done(function(egg) {
                done();
            });
        });

        it('should handle lack of bower.json file', function(done) {
            nock('https://api.github.com')
                .get('/repos/kamilbiela/bowereggs-backend/contents/bower.json?ref=master')
                .reply(404, JSON.stringify(
                    {message: 'Not Found', statusCode: 404}
            ));

            var gu = new Gu(github.client());
            gu.updateEggDataKeywords({name: 'test', githubName: 'kamilbiela/bowereggs-backend'}).done(function(egg) {
                assert.equal(egg.name, 'test')
                done();
            });
        });
    });


    describe('#saveEgg', function() {
        it('should save egg', function(done) {
            var gu = new Gu();

            var isSaved = false;

            var egg = {
                name: "aName",
                githubName: 'kamilbiela/bowereggs-backend',
                save: function(callback) {
                    done();
                },
                isModified: function() {
                    return true;
                }
            }

            gu.saveEgg(egg);
        });
    });
})