var EventEmitter = require('events').EventEmitter
  , series = require('async-series')
  , funstance = require('funstance')
  , inherits = require('inherits')

function Oblige() {
  EventEmitter.call(this)
  this.tasks = {}
}
inherits(Oblige, EventEmitter)

var root = module.exports = createGroup()

var cache = {}
function createGroup(name) {
  if (name) return cache[name] || (cache[name] = createGroup())
  return funstance(new Oblige, createGroup)
}

Oblige.prototype.create = function(name, meta, taskfn) {
  if (typeof meta === 'function') {
    taskfn = meta
    meta = {}
  }

  meta = meta || {}

  meta.before = meta.before || []
  meta.before = Array.isArray(meta.before) ? meta.before : [meta.before]
  meta.description = meta.description || ''

  var task = this.tasks[name] = {
      name: name
    , meta: meta
    , taskfn: taskfn || function(done){
      return done()
    }
  }

  this.emit('data', task)
  if (this !== root) root.emit('data', task)

  return this
}

Oblige.prototype.run = function(name, ready) {
  var self = this
  process.nextTick(function() {
    self._run(name, ready, [])
  })
  return this
}

Oblige.prototype._run = function(name, ready, _ignore) {
  var self = this
    , task = this.tasks[name]
    , before = task.meta.before

  ready = ready || function(){}

  before = before.filter(function(name) {
    if (_ignore.indexOf(name) === -1) return _ignore.push(name) || true
  }).map(function(name) {
    return function doTask(done) {
      self._run(name, done, _ignore)
    }
  })

  series(before, function(err) {
    if (err) return ready(err)
    task.taskfn(ready)
  })

  return this
}
