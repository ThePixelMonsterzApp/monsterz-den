"use strict";

var restify = require('restify');
var monster = require('./monsterid.js');

var Logger = require('bunyan');
var log = new Logger({
    name: 'dnmonster',
    streams: [
        {
          stream: process.stdout,
          level: 'debug'
        }
    ],
    serializers: {
        req: Logger.stdSerializers.req,
        res: restify.bunyan.serializers.res,
    }
});

/*
 * TODO: bit more docs
 *       figure out debug and live-reloading
 *       tests (pretty easy, check get same binary for same string, check
 *       short strings, invalid URLs, sizes)
 *       ***NOT correctly 404ing currently***
 */
function respond(req, res, next) {

    var width = 20;
    var height = 20;

    if (req.params.size) {
        width = req.params.size;
        height = req.params.size;
    }
    if (req.params.width) {
        width = req.params.width;
    }
    if (req.params.height) {
        height = req.params.height;
    }

    var img = monster.getAvatar(req.params.name, width, height);
    res.setHeader('Content-Type', 'image/png');
    res.write(img);
    res.end();
    return next();
}

var server = restify.createServer({
    formatters: {
        'image/png': function formatPng(req, res, body) {
            if (body instanceof Error) {
                return body.stack;
            }
            //Just send the bytes - should be a Buffer
            return body;
        }
    },
    name: 'dnmonster',
    log: log
});

server.use(restify.queryParser());
server.get('/monster/:name', respond);

server.listen(8080, function() {
    console.log('%s listening at %s', server.name, server.url);
});

server.pre(function (request, response, next) {
    request.log.info({req: request}, 'started');
    return next();
});

server.on('after', function (req, res, route) {
    req.log.info({res: res}, 'finished');
});
