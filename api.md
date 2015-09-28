## Functions
<dl>
<dt><a href="#clone">clone(opts)</a> ⇒ <code><a href="#external_Promise">Promise</a></code></dt>
<dd><p>Clone a flavor from one user to another</p>
</dd>
<dt><a href="#del">del(opts)</a> ⇒ <code><a href="#external_Promise">Promise</a></code></dt>
<dd><p>Clone a flavor from one user to another</p>
</dd>
<dt><a href="#hasViews">hasViews(opts)</a> ⇒ <code>boolean</code></dt>
<dd><p>Check if a flavor has views</p>
</dd>
</dl>
## External
<dl>
<dt><a href="#external_Promise">Promise</a></dt>
<dd><p>ECMA6 Promise.</p>
</dd>
</dl>
<a name="clone"></a>
## clone(opts) ⇒ <code>[Promise](#external_Promise)</code>
Clone a flavor from one user to another

**Kind**: global function  
**Returns**: <code>[Promise](#external_Promise)</code> - A promise that resolves with `undefined` if success, or rejects with an error if failure  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> | clone options |
| opts.source | <code>Object</code> | source description |
| opts.source.username | <code>string</code> | The name of the user's from which to clone |
| opts.source.flavor | <code>string</code> | The name of the flavor to clone |
| opts.source.couchUrl | <code>string</code> | Couchdb root url of the source. It should contain username + password if necessary |
| opts.source.couchDatabase | <code>string</code> | the name of the target couchdb database |
| opts.target | <code>string</code> | target description |
| opts.target.username | <code>String</code> | The target username to which to clone the flavor |
| opts.target.flavor | <code>string</code> | The name of the flavor in the target |
| opts.target.couchUrl | <code>string</code> | Couchdb root url of the target. It should contain username + password if necessary |
| opts.target.couchDatabase | <code>string</code> | the name of the target couchdb database |

<a name="del"></a>
## del(opts) ⇒ <code>[Promise](#external_Promise)</code>
Clone a flavor from one user to another

**Kind**: global function  
**Returns**: <code>[Promise](#external_Promise)</code> - Promise that resolves with `undefined` if success, or rejects with an error if not  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> | options |
| opts.username | <code>string</code> | The name of the user's from which to clone |
| opts.flavor | <code>string</code> | The name of the flavor to clone |
| opts.couchUrl | <code>string</code> | Couchdb root url of the source. It should contain username + password if necessary |
| opts.couchDatabase | <code>string</code> | the name of the target couchdb database |

<a name="hasViews"></a>
## hasViews(opts) ⇒ <code>boolean</code>
Check if a flavor has views

**Kind**: global function  
**Returns**: <code>boolean</code> - true if the flavor exists and has views, false if the the flavor does not exist or does not have views  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> | options |
| opts.username | <code>string</code> | The name of the user's from which to clone |
| opts.flavor | <code>string</code> | The name of the flavor to clone |
| opts.couchUrl | <code>string</code> | Couchdb root url of the source. It should contain username + password if necessary |
| opts.couchDatabase | <code>string</code> | the name of the target couchdb database |

<a name="external_Promise"></a>
## Promise
ECMA6 Promise.

**Kind**: global external  
**See**: [https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)  
