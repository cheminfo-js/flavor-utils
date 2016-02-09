## Classes

<dl>
<dt><a href="#FlavorUtils">FlavorUtils</a></dt>
<dd><p>FlavorUtils class</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#options">options</a> : <code>object</code></dt>
<dd><p>General options object</p>
</dd>
</dl>

<a name="FlavorUtils"></a>
## FlavorUtils
FlavorUtils class

**Kind**: global class  

* [FlavorUtils](#FlavorUtils)
    * [new FlavorUtils(defaultOpts)](#new_FlavorUtils_new)
    * [.getOptions(opts)](#FlavorUtils+getOptions) ⇒ <code>object</code>
    * [.clone(opts)](#FlavorUtils+clone) ⇒ <code>Promise</code>
    * [.del(opts)](#FlavorUtils+del) ⇒ <code>Promise</code>
    * [.getFlavor(opts, sorted)](#FlavorUtils+getFlavor)
    * [.hasViews(opts)](#FlavorUtils+hasViews) ⇒ <code>Promise</code>
    * [.getTree(opts)](#FlavorUtils+getTree) ⇒ <code>Promise</code>
    * [.traverseTree(tree, viewCb, dirCb)](#FlavorUtils+traverseTree) ⇒ <code>Promise</code>

<a name="new_FlavorUtils_new"></a>
### new FlavorUtils(defaultOpts)
Constructor


| Param | Type | Description |
| --- | --- | --- |
| defaultOpts | <code>[options](#options)</code> | Default options |

<a name="FlavorUtils+getOptions"></a>
### flavorUtils.getOptions(opts) ⇒ <code>object</code>
Get options object

**Kind**: instance method of <code>[FlavorUtils](#FlavorUtils)</code>  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>[options](#options)</code> | An option object to override default options with |

<a name="FlavorUtils+clone"></a>
### flavorUtils.clone(opts) ⇒ <code>Promise</code>
**Kind**: instance method of <code>[FlavorUtils](#FlavorUtils)</code>  
**Returns**: <code>Promise</code> - A promise that resolves with `undefined` if success, or rejects with an error if failure  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | An option object to override default options with |
| opts.source | <code>[options](#options)</code> | An option object to override default options with |
| opts.target | <code>[options](#options)</code> | An option object to override default options with |

<a name="FlavorUtils+del"></a>
### flavorUtils.del(opts) ⇒ <code>Promise</code>
Delete all views associated to a flavor

**Kind**: instance method of <code>[FlavorUtils](#FlavorUtils)</code>  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>[options](#options)</code> | A promise that resolves with `undefined` if success, or rejects with an error if failure |

<a name="FlavorUtils+getFlavor"></a>
### flavorUtils.getFlavor(opts, sorted)
Get meta info about documents in a flavor

**Kind**: instance method of <code>[FlavorUtils](#FlavorUtils)</code>  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>[options](#options)</code> | An option object to override default options with |
| sorted | <code>boolean</code> | Set to true if documents should be sorted by flavors |

<a name="FlavorUtils+hasViews"></a>
### flavorUtils.hasViews(opts) ⇒ <code>Promise</code>
Check if this flavor has views associated with it

**Kind**: instance method of <code>[FlavorUtils](#FlavorUtils)</code>  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>[options](#options)</code> | An option object to override default options with |

<a name="FlavorUtils+getTree"></a>
### flavorUtils.getTree(opts) ⇒ <code>Promise</code>
Get views tree for a flavor

**Kind**: instance method of <code>[FlavorUtils](#FlavorUtils)</code>  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>[options](#options)</code> | An option object to override default options with |

<a name="FlavorUtils+traverseTree"></a>
### flavorUtils.traverseTree(tree, viewCb, dirCb) ⇒ <code>Promise</code>
Traverse a tree

**Kind**: instance method of <code>[FlavorUtils](#FlavorUtils)</code>  

| Param | Type | Description |
| --- | --- | --- |
| tree | <code>object</code> | A tree such as returned by getTree |
| viewCb | <code>function</code> | A callback called on each view |
| dirCb | <code>function</code> | A callback called on each 'directory' |

<a name="options"></a>
## options : <code>object</code>
General options object

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| opts.target | <code>string</code> | target description |
| username | <code>String</code> | The target username to which to clone the flavor |
| designDoc | <code>String</code> | The design doc to use for views and list queries - Defaults to 'flavor' |
| flavor | <code>string</code> | The name of the flavor in the target |
| couchUrl | <code>string</code> | Couchdb root url of the target. It can contain username + password if but will be overriden if couchUsername and couchPassword are defined |
| couchDatabase | <code>string</code> | the name of the target couchdb database |
| couchUsername | <code>string</code> | the username with which to connect to the couchdb database |
| couchPassword | <code>string</code> | the password with which to connect to the couchdb database |

