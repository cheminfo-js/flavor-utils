'use strict';

var superagent= require('superagent');
var Base64 = require('./Base64');
module.exports = {};

var FlavorUtils = module.exports = {};

/**
 * Clone a flavor from one user to another
 * @param {Object} opts - clone options
 * @param {Object} opts.source - source description
 * @param {string} opts.source.username - The name of the user's from which to clone
 * @param {string} opts.source.flavor - The name of the flavor to clone
 * @param {string} opts.source.couchUrl - Couchdb root url of the source. It should contain username + password if necessary
 * @param {string} opts.target.couchDatabase - the name of the target couchdb database
 * @param {string} opts.target - target description
 * @param {String} opts.target.username - The target username to which to clone the flavor
 * @param {string} opts.target.flavor - The name of the flavor in the target
 * @param {string} opts.target.couchUrl - Couchdb root url of the target. It should contain username + password if necessary
 * @param {string} opts.target.couchDatabase - the name of the target couchdb database
 */
FlavorUtils.cloneFlavor = function(opts) {
    processCommonParams(opts.source);
    processCommonParams(opts.target);
    var key = [opts.source.flavor, opts.source.username];
    return getView(opts.source, 'flavor/docs', key).then(function(res) {
        var result = res.rows;
        if(!result) return;
        var done = Promise.resolve();
        var i= 0;
        for(i=0; i<result.length; i++) {
            done = done.then(doEl(i));
        }
        done.then(function() {
            console.log('all done');
        }, function(err) {
            console.log('error:', err);
        });


        function doEl(i) {
            return function () {
                var prom = [];
                var view, data, meta, doc, newDoc;
                prom.push(getJSON(opts.source.databaseUrl + '/' + result[i].id));
                if (result[i].value.view) {
                    view = getJSON(opts.source.databaseUrl + '/' + result[i].id + '/view.json');
                    prom.push(view);
                }
                else prom.push(undefined);
                if (result[i].value.data) {
                    data = getJSON(opts.source.databaseUrl + '/' + result[i].id + '/data.json');
                    prom.push(data);
                }
                else prom.push(undefined);
                if (result[i].value.meta) {
                    meta = getJSON(opts.source.databaseUrl + '/' + result[i].id + '/meta.json');
                    prom.push(meta);
                }
                else prom.push(undefined);
                var prom = Promise.all(prom);
                prom = prom.then(function (arr) {
                    doc = arr[0];
                    newDoc = {};
                    var view = arr[1];
                    var data = arr[2];
                    var meta = arr[3];
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
                return prom.then(function() {
                    saveDoc(opts.target, newDoc);
                });
            }
        }
        return done;
    });
};

FlavorUtils.deleteFlavor = function(opts) {
    processCommonParams(opts);
    var key = [opts.flavor, opts.username];
    return getView(opts, 'flavor/docs', key).then(function(res) {
        var result = res.rows;
        var done = Promise.resolve();
        for(var i=0; i<result.length; i++) {
            done.then(doEl(i));
        }

        done.then(function() {
            console.log('delete flavor done');
        }, function(err) {
            console.log('Error!', err, err.stack);
        });

        function doEl(i) {
            var prom = getJSON(opts.databaseUrl + '/' + result[i].id);
            prom = prom.then(function(doc) {
                delete doc.flavors[opts.flavor];
                var keys = Object.keys(doc.flavors);
                if(keys.length === 0) {
                    return deleteDoc(opts, doc);
                }
                else {
                    return updateDoc(opts, doc);
                }
            });
            return prom;
        }
        return done;
    });
};

FlavorUtils.hasViews = function(opts) {
    processCommonParams(opts);
    var key = [opts.flavor, opts.username];
    return getView(opts, 'flavor/docs', key).then(function(res) {
        if(res.rows && res.rows.length === 0) return false;
        return true;
    });
};


function deleteDoc(opts, doc) {
    return new Promise(function(resolve, reject) {
        var url = opts.databaseUrl + '/' + doc._id;
        console.log(url);
        superagent
            .del(url)
            .query({rev: doc._rev})
            .end(function(err, res) {
                if(err) {
                    console.log(err);
                    return reject(err);
                }
                console.log(res)
                resolve(res);
            })
    });
}

function updateDoc(opts, doc) {
    return new Promise(function(resolve, reject) {
        console.log('update doc');
        var url = opts.databaseUrl + '/' + doc._id;
        superagent
            .put(url)
            .set('Content-Type', 'application/json')
            .send(doc)
            .end(function(err, res) {
                if(err) {
                    return reject(err);
                }
                resolve(res.body);
            })
    });
}

function saveDoc(opts, doc) {
    return new Promise(function(resolve, reject) {
        var url = opts.databaseUrl;
        delete doc._id;
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
}
/**
 * Get couchdb uuids
 * @param {Object} count - the number of uuids needed
 *
 */
function getUUIDs(opts, count) {
    count = count || 1;
    return getJSON(opts.couchUrl + '/_uuids?count=' + count);
}

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

function getView(opts, view, key) {
    var x = view.split('/');
    var designDoc = '_design/' + x[0];
    var viewName = x[1];

    return getJSON(opts.databaseUrl + '/' + designDoc + '/_view/' + viewName + '?key=' + encodeURIComponent(JSON.stringify(key)));
}

function processCommonParams(params) {
    if(!params) return;
    if(params.couchUrl) params.couchUrl = params.couchUrl.replace(/\/$/, '');
    if(params.couchUrl && params.couchDatabase) {
        params.databaseUrl =params.couchUrl + '/' + params.couchDatabase;
    }

}

