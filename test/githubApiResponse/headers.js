module.exports = function (remainingLimit, resetTime) {
    return {
        server: 'GitHub.com',
        date: 'Tue, 17 Dec 2013 18:50:22 GMT',
        'content-type': 'application/json; charset=utf-8',
        status: '200 OK',
        'x-ratelimit-limit': '5000',
        'x-ratelimit-remaining': new String(remainingLimit),
        'x-ratelimit-reset': new String(resetTime),
        'cache-control': 'public, max-age=60, s-maxage=60',
        'last-modified': 'Tue, 17 Dec 2013 18:49:27 GMT',
        etag: '"e3e2787ac74418e64088383553bc4d8e"',
        vary: 'Accept',
        'x-github-media-type': 'github.beta; format=json',
        'x-content-type-options': 'nosniff',
        'content-length': '4809',
        'access-control-allow-credentials': 'true',
        'access-control-expose-headers': 'ETag, Link, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
        'access-control-allow-origin': '*',
        'x-github-request-id': '5CE1065C:6DAC:901E652:52B09CEE'
    }
}