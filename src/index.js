'use strict';

const superagent = require('superagent');
const Base64 = require('./Base64');
const url = require('url');

const optionDefaults = {
    designDoc: 'flavor'
};


/**
 * General options object
 * @typedef {object} options
 * @property {String} username - The target username to which to clone the flavor
 * @property {String} designDoc - The design doc to use for views and list queries - Defaults to 'flavor'
 * @property {string} flavor - The name of the flavor in the target
 * @property {string} couchUrl - Couchdb root url of the target. It can contain username + password if but will be overriden if couchUsername and couchPassword are defined
 * @property {string} couchDatabase - the name of the target couchdb database
 * @property {string} couchUsername - the username with which to connect to the couchdb database
 * @property {string} couchPassword - the password with which to connect to the couchdb database
 */

/**
 * This is a description of the MyClass constructor function.
 * @class
 * @classdesc FlavorUtils class
 */
class FlavorUtils {
    /**
     * Constructor
     * @param {options} defaultOpts - Default options
     */
    constructor(defaultOpts) {
        this.defaultOptions = defaultOpts;
    }

    /**
     * Get options object
     * @param {options} opts - An option object to override default options with
     * @returns {object}
     */
    getOptions(opts) {
        const options = Object.assign({}, optionDefaults, this.defaultOptions, opts);

        // Add auth to url
        var auth = '';
        if (options.couchUsername) {
            auth += options.couchUsername;
            if (options.couchPassword) {
                auth += ':' + options.couchPassword;
            }
        }
        if (options.couchUrl) {
            var parsedUrl = url.parse(options.couchUrl);
            if (auth) {
                parsedUrl.auth = auth;
            }
            options.couchUrl = parsedUrl.format();
        }

        // Remove trailing slash from url
        if (options.couchUrl) options.couchUrl = options.couchUrl.replace(/\/$/, '');
        if (options.couchUrl && options.couchDatabase) {
            options.databaseUrl = options.couchUrl + '/' + options.couchDatabase;
        }
        return options;
    }

    getFlavors(opts) {
        opts = this.getOptions(opts);
        return getView(opts, `${opts.designDoc}/list`, opts.username);
    }

    /**
     *
     * @param {object} opts - An option object to override default options with
     * @param {options} opts.source - An option object to override default options with
     * @param {options} opts.target - An option object to override default options with
     * @returns {Promise} A promise that resolves with `undefined` if success, or rejects with an error if failure
     */
    clone(opts) {
        opts.source = this.getOptions(opts.source);
        opts.target = this.getOptions(opts.target);
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
    }

    /**
     * Delete all views associated to a flavor
     * @param {options} opts - A promise that resolves with `undefined` if success, or rejects with an error if failure
     * @returns {Promise}
     */
    del(opts) {
        opts = this.getOptions(opts);
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
    }

    /**
     * Get meta info about documents in a flavor
     * @param {options} opts - An option object to override default options with
     * @param {boolean} sorted - Set to true if documents should be sorted by flavors
     */
    getFlavor(opts, sorted) {
        opts = this.getOptions(opts);
        sorted = sorted === undefined ? true : sorted;
        var key = [opts.flavor, opts.username];
        if (sorted) {
            return getList(opts, `${opts.designDoc}/sort`, 'docs', key);
        }
        return getView(opts, `${opts.designDoc}/docs`, key);
    }

    /**
     * Check if this flavor has views associated with it
     * @param {options} opts - An option object to override default options with
     * @returns {Promise}
     */
    hasViews(opts) {
        opts = this.getOptions(opts);
        var key = [opts.flavor, opts.username];
        return getView(opts, `${opts.designDoc}/docs`, key).then(function (res) {
            return !(res.rows && res.rows.length === 0);
        });
    }

    /**
     * Get views tree for a flavor
     * @param {options} opts - An option object to override default options with
     * @returns {Promise}
     */
    getTree(opts) {
        if (opts.couchUrl) {
            return this.getFlavor(opts).then(function (views) {
                if (views.rows) views = views.rows;
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
                current.__id = row._id;
                current.__rev = row._rev;
                current.__version = row.version;
                current.__keywords = row.keywords;
                current.__meta = row.meta;
                current.__title = row.title;
                return;
            }

            var flavor = flavors.shift();
            if (!current[flavor]) {
                current[flavor] = {
                    __name: flavor,
                    __parents: current.__parents ? current.__parents.slice() : [],
                    __parent: current
                };
                if (current.__name) current[flavor].__parents.push(current.__name);
            }

            return doElement(flavors, current[flavor], row);
        }
    }

    /**
     * Traverse a tree
     * @param {object} tree - A tree such as returned by getTree
     * @param {function} viewCb - A callback called on each view
     * @param {function} dirCb - A callback called on each 'directory'
     * @returns {Promise}
     */
    traverseTree(tree, viewCb, dirCb) {
        let promise = Promise.resolve();
        for (let key in tree) {
            if (key.startsWith('__')) continue;
            let el = tree[key];
            if (el.__id) { // Element is a view
                if (viewCb) promise = promise.then(function () {
                    return viewCb(el);
                });
            } else if (key !== '__root') { // Element is a directory
                if (dirCb) promise = promise.then(function () {
                    return dirCb(el);
                });
                promise = promise.then(() => {
                    return this.traverseTree(el, viewCb, dirCb);
                });
            }
        }
        return promise;
    }


}

module.exports = FlavorUtils;

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

function deleteDoc(opts, doc) {
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
