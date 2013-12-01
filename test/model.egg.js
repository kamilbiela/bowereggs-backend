var assert = require('assert');
var nock = require('nock');
var _ = require('lodash');

var Egg = require('../model/egg.js')
var nest = require('../lib/nest');

nock.disableNetConnect();

describe('model.egg', function() {
    describe('#name.github', function() {
        it('should give valid github username/reponame 1', function() {
            var egg = new Egg();
            egg.url = 'git://github.com/jacoblwe20/zoomy-plugin.git';

            assert.equal(egg.githubName, 'jacoblwe20/zoomy-plugin');
        })

        it('should give valid github username/reponame 2', function() {
            var egg = new Egg();
            egg.url = 'git://github.com:dgileadi/zepto-page-transitions.git';

            assert.equal(egg.githubName, 'dgileadi/zepto-page-transitions');
        })
    });
})