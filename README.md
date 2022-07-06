# Express Response Hooks

Extend [Express.js](https://expressjs.com/) with response hooks, primarily aimed to manipulate the response before being sent to the client.

# Installation

```sh
npm install express-response-hooks
```

# Usage

```js
const responseHooks = require('express-response-hooks.js');

// activate the hooks
app.use(responseHooks());

// register a middleware that adds a "Cache-Control" header whenever the status code changes
app.use(function (req, res, next) {
    // hook on "statusCode" changes
    res.hooks.on('statusCode', ([ statusCode ]) => {
        if (req.method.toUpperCase() === 'GET') && (statusCode < 400)) {
            res.set('Cache-Control', 'public, max-age=5, s-maxage=31536000');
        }
    });
);
```

# API

### require('express-response-hooks.js')([options])
Creates a middleware that adds hooks to the response object

#### Options object
- `plugName`
  - Type: `string`
  - Default: `"hooks"`

  Controls under which key the hooks event emitter will be available in the response object. Default to `res.hooks`

### res.hooks
The hooks [`EventEmitter`](https://nodejs.org/docs/latest/api/events.html#events_class_eventemitter) that enables registration to the following events:

| Event Name   | Trigger          | Arguments Array                             | Trigger |
|--------------|------------------|---------------------------------------------|-------------|
| "statusCode" | `res.statusCode` | status code (int)                           | `statusCode` property is changed internally |
| "set"        | `res.set()`      | header name (string), header value (string) | `set()` is called internally or explicitly |
| "send"       | `res.send()`     | body (int / object / string)                | `send()` is called internally (e.g., `res.json()` calls it twice) or explicitly |

For example
```js
res.hooks.once('statusCode', ([ statusCode ]) => {
  // called once when the res.statusCode is changed for the first time
});
res.hooks.on('res', ([ name, value ]) => {
  // called whenever res.res() is called internally by express to set default headers or explicitly
});
```

#### Data manipulation

Changing the values in the arguments array will change the arguments passed to the original wrapped property/function

For example
```js
res.hooks.on('res', (args) => {
  const [ name, value ] = args;
  if (name === 'cache-control') {
    // change the value of the header
    args[1] = args[1].replace('public', 'private');
  }
});
```

### res.hooks.bypass
An object with references to the wrapped properties and functions for using them without triggering an event.

For example
```js
res.hooks.on('set', ([ name, value ]) => {
  if (name === 'cache-control') {
    // add additional header without triggering another 'set' event
    res.hooks.bypass.set('cdn-cache-control', value);
  }
});
```

# Notice
* You should take into consideration that Express internally calls some of the response functions right before the response gets sent to the client (e.g., adding default headers)
* `statusCode` manipulation will not work if the hook was triggered by `send()`
