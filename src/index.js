'use strict';

/**
 * ECMA6 Promise.
 * @external Promise
 * @see {@link https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise}
 */

var superagent = require('superagent');
var Base64 = require('./Base64');

var DESIGN_DOC = 'flavor';

module.exports = function (defaultParameters) {
    defaultParameters = defaultParameters || {};
    defaultParameters = processCommonParams(defaultParameters, true);

    var api = {};

    /**
     * Clone a flavor from one user to another
     * @param {Object} opts - clone options
     * @param {String} opts.designDoc - design doc name, defaults to 'flavor'
     * @param {Object} opts.source - source description
     * @param {string} opts.source.username - The name of the user's from which to clone
     * @param {string} opts.source.flavor - The name of the flavor to clone
     * @param {string} opts.source.couchUrl - Couchdb root url of the source. It should contain username + password if necessary
     * @param {string} opts.source.couchDatabase - the name of the target couchdb database
     * @param {string} opts.target - target description
     * @param {String} opts.target.username - The target username to which to clone the flavor
     * @param {string} opts.target.flavor - The name of the flavor in the target
     * @param {string} opts.target.couchUrl - Couchdb root url of the target. It should contain username + password if necessary
     * @param {string} opts.target.couchDatabase - the name of the target couchdb database
     * @return {Promise} A promise that resolves with `undefined` if success, or rejects with an error if failure
     */
    api.clone = function (opts) {
        processCommonParams(opts.source);
        processCommonParams(opts.target);
        var key = [opts.source.flavor, opts.source.username];
        return getView(opts.source, `${opts.source.designDoc}/docs`, key).then(function (res) {
            var result = res.rows;
            if (!result) return;
            var done = Promise.resolve();
            var i = 0;
            for (i = 0; i < result.length; i++) {
                done = done.then(doEl(i));
            }
            done.then(function () {
                console.log('all done');
            }, function (err) {
                console.log('error:', err);
                return err;
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
                    prom = Promise.all(prom).then(function (arr) {
                        doc = arr[0];
                        newDoc = {};
                        var view = arr[1];
                        var data = arr[2];
                        var meta = arr[3];
                        delete doc._rev;

                        newDoc.flavors = {};
                        var sub = [];

                        if (opts.target.subFolder && typeof opts.target.subFolder === 'string') {
                            sub = opts.target.subFolder.split('/').filter(function (v) {
                                return v !== ""
                            });
                        }
                        if (sub.length > 0 && doc.flavors[opts.source.flavor]) {
                            if (doc.flavors[opts.source.flavor]) {
                                var arr = doc.flavors[opts.source.flavor];
                                for (var j = sub.length - 1; j >= 0; j--) {
                                    arr.unshift(sub[j]);
                                }
                                newDoc.flavors[opts.target.flavor] = arr;
                            }
                        }
                        else if (doc.flavors[opts.source.flavor]) {
                            newDoc.flavors[opts.target.flavor] = doc.flavors[opts.source.flavor];
                        }

                        newDoc.name = opts.target.username;

                        if (meta) {
                            newDoc._attachments = newDoc._attachments || {};
                            newDoc._attachments['meta.json'] = {
                                'content_type': 'application/json',
                                'data': Base64.encode(JSON.stringify(meta))
                            };
                        }
                        if (view) {
                            newDoc._attachments = newDoc._attachments || {};
                            newDoc._attachments['view.json'] = {
                                'content_type': 'application/json',
                                'data': Base64.encode(JSON.stringify(view))
                            };
                        }
                        if (data) {
                            newDoc._attachments = newDoc._attachments || {};
                            newDoc._attachments['data.json'] = {
                                'content_type': 'application/json',
                                'data': Base64.encode(JSON.stringify(data))
                            };
                        }
                    });
                    return prom.then(function () {
                        return saveDoc(opts.target, newDoc);
                    });
                }
            }

            return done;
        });
    };

    /**
     * Clone a flavor from one user to another
     * @param {Object} opts - options
     * @param {string} opts.username - The name of the user's from which to clone
     * @param {string} opts.flavor - The name of the flavor to clone
     * @param {string} opts.couchUrl - Couchdb root url of the source. It should contain username + password if necessary
     * @param {string} opts.couchDatabase - the name of the target couchdb database
     * @return {Promise} Promise that resolves with `undefined` if success, or rejects with an error if not
     */
    api.del = function (opts) {
        processCommonParams(opts);
        var key = [opts.flavor, opts.username];
        return getView(opts, `${opts.designDoc}/docs`, key).then(function (res) {
            var result = res.rows;
            var done = Promise.resolve();
            for (var i = 0; i < result.length; i++) {
                done = done.then(doEl(i));
            }

            done.then(function () {
                console.log('delete flavor done');
            }, function (err) {
                console.log('Error!', err, err.stack);
            });

            function doEl(i) {
                var prom = getJSON(opts.databaseUrl + '/' + result[i].id);
                prom = prom.then(function (doc) {
                    delete doc.flavors[opts.flavor];
                    var keys = Object.keys(doc.flavors);
                    if (keys.length === 0) {
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

    /**
     * Get a a flavor
     * @param {Object} opts - options
     * @param {string} opts.username - The user for which to search flavors
     * @param {string} opts.flavor - The name of the flavor
     * @param {string} opts.couchUrl - Couchdb root url of the source. It should contain username + password if necessary
     * @param {string} opts.couchDatabase - the name of the target couchdb database
     * @param {boolean} sorted - Should the result be sorted - Default is true
     * @return {Promise} A promise that resolves with true if the flavor exists and has views, false if the the
     * flavor does not exist or does not have views
     */
    api.getFlavor = function (opts, sorted) {
        processCommonParams(opts);
        sorted = sorted === undefined ? true : sorted;
        var key = [opts.flavor, opts.username];
        if(sorted) {
            return getList(opts, `${opts.designDoc}/sort`, 'docs', key);
        }
        return getView(opts, `${opts.designDoc}/docs`, key);
    };

    /**
     * Get the hierachical structure from a flavor
     * @param {Object} Expects either a view object such as returned by `getFlavor`, or the usual
     * parameters: username, flavor, couchUrl, couchDatabase to perform the request and then create the structure from
     * the result
     */
    api.getTree = function (opts) {
        if (opts.couchUrl) {
            return api.getFlavor(opts).then(function (views) {
                if(views.rows) views = views.rows;
                return getTree(views);
            });
        } else {
            return Promise.resolve(getTree(opts));
        }

        function getTree(rows) {
            var row, structure = {};
            Object.defineProperty(structure, '__root', {enumerable: false, writable: true, value: true});
            for (var i = 0; i < rows.length; i++) {
                row = rows[i];
                var flavors = row.value.flavors;
                doElement(flavors, structure, row.value);
            }
            return structure;
        }

        function doElement(flavors, current, row) {
            if (!flavors.length) {
                current.__data = row.data;
                current.__view = row.view;
                current.__meta = row.meta;
                current.__id = row._id;
                current.__rev = row._rev;
                return;
            }

            var flavor = flavors.shift();
            if (!current[flavor]) {
                current[flavor] = {
                    __name: flavor,
                    __parents: current.__parents ? current.__parents.slice() : [],
                    __parent: current
                };
                if(current.__name) current[flavor].__parents.push(current.__name);
                //if(current.__parents) console.log(current.__parents)
            }

            return doElement(flavors, current[flavor], row);
        }
    };
    api.traverseTree = function(structure, viewCb, dirCb) {
        let promise = Promise.resolve();
        for (let key in structure) {
            if (key.startsWith('__')) continue;
            let el = structure[key];
            if (el.__id) { // Element is a view
                if(viewCb) promise = promise.then(function() {
                    return viewCb(el);
                });
            } else if (key !== '__root') { // Element is a directory
                if(dirCb) promise = promise.then(function() {
                    return dirCb(el);
                });
                promise = promise.then(function() {
                    return api.traverseTree(el, viewCb, dirCb);
                });
            }
        }
        return promise;
    };

    /**
     * Check if a flavor has views
     * @param {Object} opts - options
     * @param {string} opts.username - The username for which to search the flavor
     * @param {string} opts.flavor - The name of the flavor
     * @param {string} opts.couchUrl - Couchdb root url of the source. It should contain username + password if necessary
     * @param {string} opts.couchDatabase - the name of the target couchdb database
     * @return {Promise} A promise that resolves with true if the flavor exists and has views, false if the flavor
     * does not exist or does not have views
     */
    api.hasViews = function (opts) {
        processCommonParams(opts);
        var key = [opts.flavor, opts.username];
        return getView(opts, `${opts.designDoc}/docs`, key).then(function (res) {
            return !(res.rows && res.rows.length === 0);
        });
    };


    function deleteDoc(opts, doc) {
        processCommonParams(opts);
        return new Promise(function (resolve, reject) {
            var url = opts.databaseUrl + '/' + doc._id;
            superagent
                .del(url)
                .query({rev: doc._rev})
                .end(function (err, res) {
                    if (err) {
                        return reject(err);
                    }
                    resolve(res);
                })
        });
    }

    function updateDoc(opts, doc) {
        return new Promise(function (resolve, reject) {
            var url = opts.databaseUrl + '/' + doc._id;
            superagent
                .put(url)
                .set('Content-Type', 'application/json')
                .send(doc)
                .end(function (err, res) {
                    if (err) {
                        return reject(err);
                    }
                    resolve(res.body);
                })
        });
    }

    /**
     * @private
     * @param opts - the usual options object
     * @param doc - The document to save
     * @return {Promise} - Promise that resolves with couchdb's response if success, or rejects with error if failure
     */
    function saveDoc(opts, doc) {
        return new Promise(function (resolve, reject) {
            var url = opts.databaseUrl;
            delete doc._id;
            superagent
                .post(url)
                .set('Content-Type', 'application/json')
                .send(doc)
                .end(function (err, res) {
                    if (err) {
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

    function getList(opts, list, view, key) {
        var x = list.split('/');
        var designDoc = '_design/' + x[0];
        var listName = x[1];

        return getJSON(opts.databaseUrl + '/' + designDoc + '/_list/' + listName + '/' + view + '?key=' + encodeURIComponent(JSON.stringify(key)));
    }

    function getUUIDs(opts, count) {
        count = count || 1;
        return getJSON(opts.couchUrl + '/_uuids?count=' + count);
    }

    function getJSON(url) {
        return new Promise(function (resolve, reject) {
            superagent
                .get(url)
                .set('Accept', 'application/json')
                .end(function (err, res) {
                    if (err) {
                        return reject(err);
                    }
                    resolve(res.body);
                })
        });
    }


    function processCommonParams(params, makeNew) {
        if (!params) return;
        if(makeNew) params = Object.assign({}, params);
        params.couchUrl = params.couchUrl || defaultParameters.couchUrl;
        params.couchDatabase = params.couchDatabase || defaultParameters.couchDatabase;
        params.designDoc = params.designDoc || defaultParameters.designDoc || DESIGN_DOC;
        params.username = params.username || defaultParameters.username;
        params.flavor = params.flavor || defaultParameters.flavor;

        if (params.couchUrl) params.couchUrl = params.couchUrl.replace(/\/$/, '');
        if (params.couchUrl && params.couchDatabase) {
            params.databaseUrl = params.couchUrl + '/' + params.couchDatabase;
        }
        return params;
    }

    return api;
};



