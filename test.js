var test = require('tape')
  , oblige = require('./')

test('emits events on creation', function(t) {
  t.plan(1)

  oblige().on('data', function(task) {
    t.equal(task.name, 'emitting')
  }).create('emitting', function(done) {})

})

test('root module captures all events', function(t) {
  t.plan(2)

  oblige.once('data', function(task) {
    t.equal(task.name, 'global')
  }).create('global', function(done) {
    done()
    oblige.once('data', function(task) {
      t.equal(task.name, 'local')
    })
    oblige().create('local', function(){})
  }).run('global')
})

test('emits "meta" objects', function(t) {
  var obj = {
    description: 'Lorem ipsum dolor sit amet'
  }

  oblige().on('data', function(task) {
    t.deepEqual(obj, task.meta)
  }).create('meta', obj, function(done) {
    t.end()
    done()
  }).run('meta')
})

test('runs "meta.before" properties in series, recursively', function(t) {
  t.plan(14)

  var a = false
    , b = false
    , c = false
    , d = false

  oblige().create('main', {
    before: ['one', 'three']
  }, function(done) {
    d = true
    done()
  }).create('one', function(done) {
    a = true
    t.equal(b, false)
    t.equal(c, false)
    t.equal(d, false)
    done()
  }).create('two', function(done) {
    b = true
    t.equal(a, true)
    t.equal(c, false)
    t.equal(d, false)
    done()
  }).create('three', {
    before: 'two'
  }, function(done) {
    c = true
    t.equal(a, true)
    t.equal(b, true)
    t.equal(d, false)
    done()
  }).run('main', function(err) {
    t.error(err)
    t.equal(a, true)
    t.equal(b, true)
    t.equal(c, true)
    t.equal(d, true)
  })
})

test('handles repeatedly referenced tasks', function(t) {
  var counter = 0

  t.plan(2)

  oblige().create('root', {
    before: ['one', 'multilevel', 'two']
  }, function(done) {
    done()
  }).create('one', {
    before: ['subchild', 'multilevel']
  }, function(done) {
    counter += 1
    setTimeout(done, 20)
  }).create('two', {
    before: ['subchild']
  }, function(done) {
    counter += 1
    setTimeout(done, 100)
  }).create('subchild', {
    before: ['multilevel']
  }, function(done) {
    counter += 1
    setTimeout(done, 150)
  }).create('multilevel', function(done) {
    counter += 1
    setTimeout(done, 90)
  }).run('root', function(err) {
    t.error(err)
    t.equal(counter, 4)
  })
})