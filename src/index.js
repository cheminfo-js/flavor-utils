'use strict';

var superagent= require('superagent');
var Promise = require('bluebird');
var Base64 = require('./Base64');

module.exports = {};

/**
 * FlavorUtils constructor
 * @param {Object} config - options
 * @param {string} config.couchUrl - couchdb root url. It should contain username + password if necessary
 * @param {string} config.couchDatabase - couchdb database
 */
module.exports = function FlavorUtils(config) {
    this.config = config;
    this.config.couchUrl = this.config.couchUrl.replace(/\/$/,'');
    this.dbUrl = this.config.couchUrl + '/' + this.config.couchDatabase;
};

/**
 * Clone a flavor from one user to another
 * @param {Object} opts - clone options
 * @param {Object} opts.source - source description
 * @param {string} opts.source.username - The name of the user's from which to clone
 * @param {string} opts.source.flavor - The name of the flavor to clone
 * @param {string} opts.target - target description
 * @param {String} opts.target.username - The target username to which to clone the flavor
 * @param {string} opts.target.flavor - The name of the flavor in the target
 */
module.exports.prototype.cloneFlavor = function(opts) {
    var that = this;
    var key = [opts.source.flavor, opts.source.username];
    var url = this.dbUrl + '/_design/flavor/_view/docs?key=' + encodeURIComponent(JSON.stringify(key));
    getJSON(url).then(function(res) {
        var result = res.rows;
        if(!result) return;
        var done = Promise.resolve();
        var i= 0;
        var uuids = [];
        done.then(function() {
            return that.getUUIDs(result.length)
        }).then(function(res) {
            uuids = res.uuids;
        });
        for(i=0; i<result.length; i++) {
            done = done.then(doEl(i));
        }
        done.then(function() {
            console.log('all done');
        });

        done.catch(function(err) {
            console.log('error', err);
        });

        function doEl(i) {
            return function () {
                var prom = [];
                var view, data, meta, doc, newDoc;
                prom.push(getJSON(that.dbUrl + '/' + result[i].id));
                if (result[i].value.view) {
                    view = getJSON(that.dbUrl + '/' + result[i].id + '/view.json');
                    prom.push(view);
                }
                else prom.push(undefined);
                if (result[i].value.data) {
                    data = getJSON(that.dbUrl + '/' + result[i].id + '/data.json');
                    prom.push(data);
                }
                else prom.push(undefined);
                if (result[i].value.meta) {
                    meta = getJSON(that.dbUrl + '/' + result[i].id + '/meta.json');
                    prom.push(meta);
                }
                else prom.push(undefined);
                var prom = Promise.all(prom);
                prom.then(function (arr) {
                    doc = arr[0];
                    newDoc = {};
                    var view = arr[1];
                    var data = arr[2];
                    var meta = arr[3];
                    newDoc._id = uuids[i];
                    delete doc._rev;

                    newDoc.flavors = {};
                    if(doc.flavors[opts.source.flavor]) {
                        newDoc.flavors[opts.target.flavor] = doc.flavors[opts.source.flavor];
                    }

                    newDoc.name = opts.target.username;

                    if(meta) {
                        newDoc._attachments = newDoc._attachments || {};
                        newDoc._attachments['meta.json'] = {
                            'content_type': 'application/json',
                            'data': Base64.encode(JSON.stringify(meta))
                        };
                    }
                    if(view) {
                        newDoc._attachments = newDoc._attachments || {};
                        newDoc._attachments['view.json'] = {
                            'content_type': 'application/json',
                            'data': Base64.encode(JSON.stringify(view))
                        };
                    }
                    if(data) {
                        newDoc._attachments = newDoc._attachments || {};
                        newDoc._attachments['data.json'] = {
                            'content_type': 'application/json',
                            'data': Base64.encode(JSON.stringify(data))
                        };
                    }
                });
                prom.catch(function(err) {
                    console.log('error!', err, err.stack);
                });
                return prom.then(function() {
                    return that.saveDoc(newDoc);
                });
            }
        }
    });
};

module.exports.prototype.saveDoc = function(doc) {
    var that = this;
    delete doc._id;
    var url = that.dbUrl;
        return new Promise(function(resolve, reject) {
            superagent
                .post(url)
                .set('Content-Type', 'application/json')
                .send(doc)
                .end(function(err, res) {
                    if(err) {
                        return reject(err);
                    }
                    resolve(res.body);
                })
        });
};
/**
 * Get couchdb uuids
 * @param {Object} count - the number of uuids needed
 *
 */
module.exports.prototype.getUUIDs = function(count) {
    var that = this;
    count = count || 1;
    return getJSON(that.config.couchUrl + '/_uuids?count=' + count);
};

function getJSON(url) {
    return new Promise(function(resolve, reject) {
        superagent
            .get(url)
            .set('Accept', 'application/json')
            .end(function(err, res) {
                if(err) {
                    return reject(err);
                }
                resolve(res.body);
            })
    });
}

