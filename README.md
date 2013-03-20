# oblige #

Tiny task-based module for whipping up "hookable" build scripts, with
the intention of being used in decorated interfaces.

## Installation ##

``` bash
npm install oblige
```

## API ##

**tasks = require('oblige')**

The "root" oblige instance. Captures the events across all oblige instances.

**tasks.create(name, [meta], taskfn)**

Creates a new task. `meta` is optional, and handles two properties (also
optional):

* `meta.description`: defaults to an empty string.
* `meta.before`: A string or array of string task names - `task.run` will
  call these tasks in sequence before running the task.

`taskfn` is called when running the task, and is passed a `done` callback
to the first argument you should call when it's complete. If `done` is passed
an error, any parent tasks will stop running.

**tasks.run(name, callback)**

Runs a task, calling `callback(err)` when complete.

**tasks.on('data', callback)**

Every time a new task is created, `oblige` emits it as a data event with the
task that's been loaded.

**child = tasks()**

Similarly to [timber](http://npmjs.org/package/timber), you can create child
task handlers - these are almost totally independent, except the "root"
instance will capture events from these as well.

**child = tasks('namespaced')**

By supplying a string key to the function, you're returned a new instance
unique to that name - use it twice in different places and you'll receive the
same instance.

## Example ##

Take a simple task runner:

``` javascript
// runner.js
var oblige = require('oblige')

var command = process.argv[2]
  , taskName = process.argv[3]

if (command === 'list') {
  oblige.on('data', function(task) {
    console.log(task.name + ': ' + task.description)
  })
}

require('./tasks')

if (command === 'run') {
  oblige.run(taskName, function(err) {
    if (err) throw err
    console.log('ok!')
    process.exit()
  })
}
```

And a tasks file:

``` javascript
// tasks.js
var oblige = require('oblige')

oblige.task('minify', {
  description: 'Minifies frontend assets'
  before: [
      'minify-css'
    , 'minify-js'
  ]
})

oblige.task('minify-css', {
  description: 'Minifies CSS'
}, function(done) {
  console.log('minifying css...')
  // ...
  done()
})

oblige.task('minify-js', {
  description: 'Minifies JavaScript'
}, function(done) {
  console.log('minifying js...')
  // ...
  done()
})
```

You would be able to run the command and get this:

``` bash
$ node runner.js list
minify: Minifies frontend assets
minify-css: Minifies CSS
minify-js: Minifies JavaScript

$ node runner.js run minify
minifying css...
minifying js...
ok!

$ node runner.js run minify-js
minifying js...
ok!
```
