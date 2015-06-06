(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
var Form = require('../')
var examples = require('./examples')

var Vue = require('vue')
Vue.config.debug = true

Vue.component('select-js', require('vue-select-js'))
Vue.component('vf-form', Form)

var demo = new Vue({
  el: '#demo',
  data: {
    examples: examples.map(function(ex){
      return { text: ex.schema.title || ex.schema.description
               || ex.schema.type || JSON.stringify(ex.schema),
               value: ex }
    }),
    example: examples[0]
  }
})

global.demo = module.exports = demo
global.Vue = Vue
global.Form = Form
global.templates = require('../src/templates')

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../":90,"../src/templates":92,"./examples":81,"vue":66,"vue-select-js":5}],2:[function(require,module,exports){

},{}],3:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            currentQueue[queueIndex].run();
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],4:[function(require,module,exports){
/*!
Copyright (C) 2013 by WebReflection

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/
var
  // should be a not so common char
  // possibly one JSON does not encode
  // possibly one encodeURIComponent does not encode
  // right now this char is '~' but this might change in the future
  specialChar = '~',
  safeSpecialChar = '\\x' + (
    '0' + specialChar.charCodeAt(0).toString(16)
  ).slice(-2),
  escapedSafeSpecialChar = '\\' + safeSpecialChar,
  specialCharRG = new RegExp(safeSpecialChar, 'g'),
  safeSpecialCharRG = new RegExp(escapedSafeSpecialChar, 'g'),

  safeStartWithSpecialCharRG = new RegExp('(?:^|[^\\\\])' + escapedSafeSpecialChar),

  indexOf = [].indexOf || function(v){
    for(var i=this.length;i--&&this[i]!==v;);
    return i;
  },
  $String = String  // there's no way to drop warnings in JSHint
                    // about new String ... well, I need that here!
                    // faked, and happy linter!
;

function generateReplacer(value, replacer, resolve) {
  var
    path = [],
    all  = [value],
    seen = [value],
    mapp = [resolve ? specialChar : '[Circular]'],
    last = value,
    lvl  = 1,
    i
  ;
  return function(key, value) {
    // the replacer has rights to decide
    // if a new object should be returned
    // or if there's some key to drop
    // let's call it here rather than "too late"
    if (replacer) value = replacer.call(this, key, value);

    // did you know ? Safari passes keys as integers for arrays
    // which means if (key) when key === 0 won't pass the check
    if (key !== '') {
      if (last !== this) {
        i = lvl - indexOf.call(all, this) - 1;
        lvl -= i;
        all.splice(lvl, all.length);
        path.splice(lvl - 1, path.length);
        last = this;
      }
      // console.log(lvl, key, path);
      if (typeof value === 'object' && value) {
        lvl = all.push(last = value);
        i = indexOf.call(seen, value);
        if (i < 0) {
          i = seen.push(value) - 1;
          if (resolve) {
            // key cannot contain specialChar but could be not a string
            path.push(('' + key).replace(specialCharRG, safeSpecialChar));
            mapp[i] = specialChar + path.join(specialChar);
          } else {
            mapp[i] = mapp[0];
          }
        } else {
          value = mapp[i];
        }
      } else {
        if (typeof value === 'string' && resolve) {
          // ensure no special char involved on deserialization
          // in this case only first char is important
          // no need to replace all value (better performance)
          value = value .replace(safeSpecialChar, escapedSafeSpecialChar)
                        .replace(specialChar, safeSpecialChar);
        }
      }
    }
    return value;
  };
}

function retrieveFromPath(current, keys) {
  for(var i = 0, length = keys.length; i < length; current = current[
    // keys should be normalized back here
    keys[i++].replace(safeSpecialCharRG, specialChar)
  ]);
  return current;
}

function generateReviver(reviver) {
  return function(key, value) {
    var isString = typeof value === 'string';
    if (isString && value.charAt(0) === specialChar) {
      return new $String(value.slice(1));
    }
    if (key === '') value = regenerate(value, value, {});
    // again, only one needed, do not use the RegExp for this replacement
    // only keys need the RegExp
    if (isString) value = value .replace(safeStartWithSpecialCharRG, specialChar)
                                .replace(escapedSafeSpecialChar, safeSpecialChar);
    return reviver ? reviver.call(this, key, value) : value;
  };
}

function regenerateArray(root, current, retrieve) {
  for (var i = 0, length = current.length; i < length; i++) {
    current[i] = regenerate(root, current[i], retrieve);
  }
  return current;
}

function regenerateObject(root, current, retrieve) {
  for (var key in current) {
    if (current.hasOwnProperty(key)) {
      current[key] = regenerate(root, current[key], retrieve);
    }
  }
  return current;
}

function regenerate(root, current, retrieve) {
  return current instanceof Array ?
    // fast Array reconstruction
    regenerateArray(root, current, retrieve) :
    (
      current instanceof $String ?
        (
          // root is an empty string
          current.length ?
            (
              retrieve.hasOwnProperty(current) ?
                retrieve[current] :
                retrieve[current] = retrieveFromPath(
                  root, current.split(specialChar)
                )
            ) :
            root
        ) :
        (
          current instanceof Object ?
            // dedicated Object parser
            regenerateObject(root, current, retrieve) :
            // value as it is
            current
        )
    )
  ;
}

function stringifyRecursion(value, replacer, space, doNotResolve) {
  return JSON.stringify(value, generateReplacer(value, replacer, !doNotResolve), space);
}

function parseRecursion(text, reviver) {
  return JSON.parse(text, generateReviver(reviver));
}
this.stringify = stringifyRecursion;
this.parse = parseRecursion;
},{}],5:[function(require,module,exports){

module.exports = {

  replace: true,

  // an 'options' prop would conflict with attribute on the template root node
  props: ['opts', 'value', 'value-index', 'placeholder'],

  template: '<select v-model="valueIndex" options="indexedOptions"></select>',

  computed: {

    indexedOptions: function(){
      var idx = 0,
          values = [],
          idxOpts = []

      if (this.placeholder){
        values.push(undefined)
        idxOpts.push({ value: idx++,
                       disabled: true,
                       text: this.placeholder })
      }
      if (this.opts){
        this.opts.forEach(function(op){
          idxOpts.push(op.options
                       ? { label: op.label, options: op.options.map(index) }
                       : index(op))
        })
      }
      idxOpts.values = values

      return idxOpts

      function index(op){
        if (typeof op === 'object' && 'value' in op){
          values.push(op.value)
          return {value: idx++, text: op.text || op.value}
        } else {
          values.push(op)
          return {value: idx++, text: op}
        }
      }

    },

    value: {
      get: function(){
        return this.$data.value
      },
      set: function(value){
        var vals = this.indexedOptions.values
        this.valueIndex = this.$el.multiple && Array.isArray(value)
          ? value.map(function(v){
            return indexOf(vals, v)
          })
          : indexOf(vals, value)
      }
    },

    valueIndex: {
      get: function(){
        return this.$data.valueIndex
      },
      set: function(idx){
        this.$data.valueIndex = idx
        var vals = this.indexedOptions.values
        this.$data.value = Array.isArray(idx)
          ? idx.map(function(i){
            return vals[i]
          })
          : vals[idx]
      }

    }
  },

  watch: {

    indexedOptions: function(){
      // updates valueIndex
      this.value = this.$data.value
    }

  }

}


function indexOf(arr, x){
  var i, l = arr.length
  for (i = 0; i < l; i++) if (arr[i] === x) return i
  for (i = 0; i < l; i++) if (equal(arr[i], x)) return i
  return -1
}



var hop = Object.prototype.hasOwnProperty,
    ipo = Object.prototype.isPrototypeOf

// typed equal
// http://stackoverflow.com/questions/1068834/object-comparison-in-javascript/1144249#1144249
function equal(){
  if (arguments.length < 1) throw "Need two or more arguments to compare"

  var i, l, leftChain, rightChain
  for (i = 1, l = arguments.length; i < l; i++){
    leftChain = []
    rightChain = []
    if (!_equal(arguments[0], arguments[i])) return false
  }

  return true

  function _equal(x, y){
    // remember that NaN === NaN returns false
    // and isNaN(undefined) returns true
    if (Number.isNaN(x) && Number.isNaN(y) &&
        typeof x === 'number' && typeof y === 'number'){
      return true
    }

    // Compare primitives and functions.
    // Check if both arguments link to the same object.
    // Especially useful on step when comparing prototypes
    if (x === y) return true

    // Works in case when functions are created in constructor.
    // Comparing dates is a common scenario. Another built-ins?
    // We can even handle functions passed across iframes
    if ((typeof x === 'function' && typeof y === 'function') ||
        (x instanceof Date && y instanceof Date) ||
        (x instanceof RegExp && y instanceof RegExp) ||
        (x instanceof String && y instanceof String) ||
        (x instanceof Number && y instanceof Number)){
      return x.toString() === y.toString()
    }

    // At last checking prototypes as good a we can
    if (!(x instanceof Object && y instanceof Object) ||
        ipo.call(x,y) || ipo.call(y,x) ||
        x.constructor !== y.constructor ||
        x.prototype !== y.prototype){
      return false
    }

    // Check for infinite linking loops
    if (leftChain.indexOf(x) > -1 || rightChain.indexOf(y) > -1) return false

    // Quick checking of one object beeing a subset of another.
    // todo: cache the structure of arguments[0] for performance
    var p
    for (p in y){
      if (hop.call(y,p) !== hop.call(x,p) || typeof y[p] !== typeof x[p]) return false
    }

    for (p in x){
      if (hop.call(y,p) !== hop.call(x,p) || typeof y[p] !== typeof x[p]) return false

      switch (typeof x[p]){
      case 'object':
      case 'function':
        leftChain.push(x)
        rightChain.push(y)
        if (!_equal(x[p], y[p])) return false
        leftChain.pop()
        rightChain.pop()
        break

      default:
        if (x[p] !== y[p]) return false
      }
    }

    return true
  }

}

},{}],6:[function(require,module,exports){
var _ = require('../util')

/**
 * Create a child instance that prototypally inehrits
 * data on parent. To achieve that we create an intermediate
 * constructor with its prototype pointing to parent.
 *
 * @param {Object} opts
 * @param {Function} [BaseCtor]
 * @return {Vue}
 * @public
 */

exports.$addChild = function (opts, BaseCtor) {
  BaseCtor = BaseCtor || _.Vue
  opts = opts || {}
  var parent = this
  var ChildVue
  var inherit = opts.inherit !== undefined
    ? opts.inherit
    : BaseCtor.options.inherit
  if (inherit) {
    var ctors = parent._childCtors
    ChildVue = ctors[BaseCtor.cid]
    if (!ChildVue) {
      var optionName = BaseCtor.options.name
      var className = optionName
        ? _.classify(optionName)
        : 'VueComponent'
      ChildVue = new Function(
        'return function ' + className + ' (options) {' +
        'this.constructor = ' + className + ';' +
        'this._init(options) }'
      )()
      ChildVue.options = BaseCtor.options
      ChildVue.prototype = this
      ctors[BaseCtor.cid] = ChildVue
    }
  } else {
    ChildVue = BaseCtor
  }
  opts._parent = parent
  opts._root = parent.$root
  var child = new ChildVue(opts)
  return child
}
},{"../util":62}],7:[function(require,module,exports){
var Watcher = require('../watcher')
var Path = require('../parsers/path')
var textParser = require('../parsers/text')
var dirParser = require('../parsers/directive')
var expParser = require('../parsers/expression')
var filterRE = /[^|]\|[^|]/

/**
 * Get the value from an expression on this vm.
 *
 * @param {String} exp
 * @return {*}
 */

exports.$get = function (exp) {
  var res = expParser.parse(exp)
  if (res) {
    return res.get.call(this, this)
  }
}

/**
 * Set the value from an expression on this vm.
 * The expression must be a valid left-hand
 * expression in an assignment.
 *
 * @param {String} exp
 * @param {*} val
 */

exports.$set = function (exp, val) {
  var res = expParser.parse(exp, true)
  if (res && res.set) {
    res.set.call(this, this, val)
  }
}

/**
 * Add a property on the VM
 *
 * @param {String} key
 * @param {*} val
 */

exports.$add = function (key, val) {
  this._data.$add(key, val)
}

/**
 * Delete a property on the VM
 *
 * @param {String} key
 */

exports.$delete = function (key) {
  this._data.$delete(key)
}

/**
 * Watch an expression, trigger callback when its
 * value changes.
 *
 * @param {String} exp
 * @param {Function} cb
 * @param {Boolean} [deep]
 * @param {Boolean} [immediate]
 * @return {Function} - unwatchFn
 */

exports.$watch = function (exp, cb, deep, immediate) {
  var vm = this
  var wrappedCb = function (val, oldVal) {
    cb.call(vm, val, oldVal)
  }
  var watcher = new Watcher(vm, exp, wrappedCb, {
    deep: deep,
    user: true
  })
  if (immediate) {
    wrappedCb(watcher.value)
  }
  return function unwatchFn () {
    watcher.teardown()
  }
}

/**
 * Evaluate a text directive, including filters.
 *
 * @param {String} text
 * @return {String}
 */

exports.$eval = function (text) {
  // check for filters.
  if (filterRE.test(text)) {
    var dir = dirParser.parse(text)[0]
    // the filter regex check might give false positive
    // for pipes inside strings, so it's possible that
    // we don't get any filters here
    var val = this.$get(dir.expression)
    return dir.filters
      ? this._applyFilters(val, null, dir.filters)
      : val
  } else {
    // no filter
    return this.$get(text)
  }
}

/**
 * Interpolate a piece of template text.
 *
 * @param {String} text
 * @return {String}
 */

exports.$interpolate = function (text) {
  var tokens = textParser.parse(text)
  var vm = this
  if (tokens) {
    return tokens.length === 1
      ? vm.$eval(tokens[0].value)
      : tokens.map(function (token) {
          return token.tag
            ? vm.$eval(token.value)
            : token.value
        }).join('')
  } else {
    return text
  }
}

/**
 * Log instance data as a plain JS object
 * so that it is easier to inspect in console.
 * This method assumes console is available.
 *
 * @param {String} [path]
 */

exports.$log = function (path) {
  var data = path
    ? Path.get(this._data, path)
    : this._data
  if (data) {
    data = JSON.parse(JSON.stringify(data))
  }
  console.log(data)
}
},{"../parsers/directive":51,"../parsers/expression":52,"../parsers/path":53,"../parsers/text":55,"../watcher":67}],8:[function(require,module,exports){
var _ = require('../util')
var transition = require('../transition')

/**
 * Convenience on-instance nextTick. The callback is
 * auto-bound to the instance, and this avoids component
 * modules having to rely on the global Vue.
 *
 * @param {Function} fn
 */

exports.$nextTick = function (fn) {
  _.nextTick(fn, this)
}

/**
 * Append instance to target
 *
 * @param {Node} target
 * @param {Function} [cb]
 * @param {Boolean} [withTransition] - defaults to true
 */

exports.$appendTo = function (target, cb, withTransition) {
  return insert(
    this, target, cb, withTransition,
    append, transition.append
  )
}

/**
 * Prepend instance to target
 *
 * @param {Node} target
 * @param {Function} [cb]
 * @param {Boolean} [withTransition] - defaults to true
 */

exports.$prependTo = function (target, cb, withTransition) {
  target = query(target)
  if (target.hasChildNodes()) {
    this.$before(target.firstChild, cb, withTransition)
  } else {
    this.$appendTo(target, cb, withTransition)
  }
  return this
}

/**
 * Insert instance before target
 *
 * @param {Node} target
 * @param {Function} [cb]
 * @param {Boolean} [withTransition] - defaults to true
 */

exports.$before = function (target, cb, withTransition) {
  return insert(
    this, target, cb, withTransition,
    before, transition.before
  )
}

/**
 * Insert instance after target
 *
 * @param {Node} target
 * @param {Function} [cb]
 * @param {Boolean} [withTransition] - defaults to true
 */

exports.$after = function (target, cb, withTransition) {
  target = query(target)
  if (target.nextSibling) {
    this.$before(target.nextSibling, cb, withTransition)
  } else {
    this.$appendTo(target.parentNode, cb, withTransition)
  }
  return this
}

/**
 * Remove instance from DOM
 *
 * @param {Function} [cb]
 * @param {Boolean} [withTransition] - defaults to true
 */

exports.$remove = function (cb, withTransition) {
  var inDoc = this._isAttached && _.inDoc(this.$el)
  // if we are not in document, no need to check
  // for transitions
  if (!inDoc) withTransition = false
  var op
  var self = this
  var realCb = function () {
    if (inDoc) self._callHook('detached')
    if (cb) cb()
  }
  if (
    this._isBlock &&
    !this._blockFragment.hasChildNodes()
  ) {
    op = withTransition === false
      ? append
      : transition.removeThenAppend
    blockOp(this, this._blockFragment, op, realCb)
  } else {
    op = withTransition === false
      ? remove
      : transition.remove
    op(this.$el, this, realCb)
  }
  return this
}

/**
 * Shared DOM insertion function.
 *
 * @param {Vue} vm
 * @param {Element} target
 * @param {Function} [cb]
 * @param {Boolean} [withTransition]
 * @param {Function} op1 - op for non-transition insert
 * @param {Function} op2 - op for transition insert
 * @return vm
 */

function insert (vm, target, cb, withTransition, op1, op2) {
  target = query(target)
  var targetIsDetached = !_.inDoc(target)
  var op = withTransition === false || targetIsDetached
    ? op1
    : op2
  var shouldCallHook =
    !targetIsDetached &&
    !vm._isAttached &&
    !_.inDoc(vm.$el)
  if (vm._isBlock) {
    blockOp(vm, target, op, cb)
  } else {
    op(vm.$el, target, vm, cb)
  }
  if (shouldCallHook) {
    vm._callHook('attached')
  }
  return vm
}

/**
 * Execute a transition operation on a block instance,
 * iterating through all its block nodes.
 *
 * @param {Vue} vm
 * @param {Node} target
 * @param {Function} op
 * @param {Function} cb
 */

function blockOp (vm, target, op, cb) {
  var current = vm._blockStart
  var end = vm._blockEnd
  var next
  while (next !== end) {
    next = current.nextSibling
    op(current, target, vm)
    current = next
  }
  op(end, target, vm, cb)
}

/**
 * Check for selectors
 *
 * @param {String|Element} el
 */

function query (el) {
  return typeof el === 'string'
    ? document.querySelector(el)
    : el
}

/**
 * Append operation that takes a callback.
 *
 * @param {Node} el
 * @param {Node} target
 * @param {Vue} vm - unused
 * @param {Function} [cb]
 */

function append (el, target, vm, cb) {
  target.appendChild(el)
  if (cb) cb()
}

/**
 * InsertBefore operation that takes a callback.
 *
 * @param {Node} el
 * @param {Node} target
 * @param {Vue} vm - unused
 * @param {Function} [cb]
 */

function before (el, target, vm, cb) {
  _.before(el, target)
  if (cb) cb()
}

/**
 * Remove operation that takes a callback.
 *
 * @param {Node} el
 * @param {Vue} vm - unused
 * @param {Function} [cb]
 */

function remove (el, vm, cb) {
  _.remove(el)
  if (cb) cb()
}
},{"../transition":56,"../util":62}],9:[function(require,module,exports){
var _ = require('../util')

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 */

exports.$on = function (event, fn) {
  (this._events[event] || (this._events[event] = []))
    .push(fn)
  modifyListenerCount(this, event, 1)
  return this
}

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 */

exports.$once = function (event, fn) {
  var self = this
  function on () {
    self.$off(event, on)
    fn.apply(this, arguments)
  }
  on.fn = fn
  this.$on(event, on)
  return this
}

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 */

exports.$off = function (event, fn) {
  var cbs
  // all
  if (!arguments.length) {
    if (this.$parent) {
      for (event in this._events) {
        cbs = this._events[event]
        if (cbs) {
          modifyListenerCount(this, event, -cbs.length)
        }
      }
    }
    this._events = {}
    return this
  }
  // specific event
  cbs = this._events[event]
  if (!cbs) {
    return this
  }
  if (arguments.length === 1) {
    modifyListenerCount(this, event, -cbs.length)
    this._events[event] = null
    return this
  }
  // specific handler
  var cb
  var i = cbs.length
  while (i--) {
    cb = cbs[i]
    if (cb === fn || cb.fn === fn) {
      modifyListenerCount(this, event, -1)
      cbs.splice(i, 1)
      break
    }
  }
  return this
}

/**
 * Trigger an event on self.
 *
 * @param {String} event
 */

exports.$emit = function (event) {
  this._eventCancelled = false
  var cbs = this._events[event]
  if (cbs) {
    // avoid leaking arguments:
    // http://jsperf.com/closure-with-arguments
    var i = arguments.length - 1
    var args = new Array(i)
    while (i--) {
      args[i] = arguments[i + 1]
    }
    i = 0
    cbs = cbs.length > 1
      ? _.toArray(cbs)
      : cbs
    for (var l = cbs.length; i < l; i++) {
      if (cbs[i].apply(this, args) === false) {
        this._eventCancelled = true
      }
    }
  }
  return this
}

/**
 * Recursively broadcast an event to all children instances.
 *
 * @param {String} event
 * @param {...*} additional arguments
 */

exports.$broadcast = function (event) {
  // if no child has registered for this event,
  // then there's no need to broadcast.
  if (!this._eventsCount[event]) return
  var children = this._children
  for (var i = 0, l = children.length; i < l; i++) {
    var child = children[i]
    child.$emit.apply(child, arguments)
    if (!child._eventCancelled) {
      child.$broadcast.apply(child, arguments)
    }
  }
  return this
}

/**
 * Recursively propagate an event up the parent chain.
 *
 * @param {String} event
 * @param {...*} additional arguments
 */

exports.$dispatch = function () {
  var parent = this.$parent
  while (parent) {
    parent.$emit.apply(parent, arguments)
    parent = parent._eventCancelled
      ? null
      : parent.$parent
  }
  return this
}

/**
 * Modify the listener counts on all parents.
 * This bookkeeping allows $broadcast to return early when
 * no child has listened to a certain event.
 *
 * @param {Vue} vm
 * @param {String} event
 * @param {Number} count
 */

var hookRE = /^hook:/
function modifyListenerCount (vm, event, count) {
  var parent = vm.$parent
  // hooks do not get broadcasted so no need
  // to do bookkeeping for them
  if (!parent || !count || hookRE.test(event)) return
  while (parent) {
    parent._eventsCount[event] =
      (parent._eventsCount[event] || 0) + count
    parent = parent.$parent
  }
}
},{"../util":62}],10:[function(require,module,exports){
var _ = require('../util')
var config = require('../config')

/**
 * Expose useful internals
 */

exports.util = _
exports.nextTick = _.nextTick
exports.config = require('../config')

exports.compiler = {
  compile: require('../compiler/compile'),
  transclude: require('../compiler/transclude')
}

exports.parsers = {
  path: require('../parsers/path'),
  text: require('../parsers/text'),
  template: require('../parsers/template'),
  directive: require('../parsers/directive'),
  expression: require('../parsers/expression')
}

/**
 * Each instance constructor, including Vue, has a unique
 * cid. This enables us to create wrapped "child
 * constructors" for prototypal inheritance and cache them.
 */

exports.cid = 0
var cid = 1

/**
 * Class inehritance
 *
 * @param {Object} extendOptions
 */

exports.extend = function (extendOptions) {
  extendOptions = extendOptions || {}
  var Super = this
  var Sub = createClass(
    extendOptions.name ||
    Super.options.name ||
    'VueComponent'
  )
  Sub.prototype = Object.create(Super.prototype)
  Sub.prototype.constructor = Sub
  Sub.cid = cid++
  Sub.options = _.mergeOptions(
    Super.options,
    extendOptions
  )
  Sub['super'] = Super
  // allow further extension
  Sub.extend = Super.extend
  // create asset registers, so extended classes
  // can have their private assets too.
  createAssetRegisters(Sub)
  return Sub
}

/**
 * A function that returns a sub-class constructor with the
 * given name. This gives us much nicer output when
 * logging instances in the console.
 *
 * @param {String} name
 * @return {Function}
 */

function createClass (name) {
  return new Function(
    'return function ' + _.classify(name) +
    ' (options) { this._init(options) }'
  )()
}

/**
 * Plugin system
 *
 * @param {Object} plugin
 */

exports.use = function (plugin) {
  // additional parameters
  var args = _.toArray(arguments, 1)
  args.unshift(this)
  if (typeof plugin.install === 'function') {
    plugin.install.apply(plugin, args)
  } else {
    plugin.apply(null, args)
  }
  return this
}

/**
 * Define asset registration methods on a constructor.
 *
 * @param {Function} Constructor
 */

function createAssetRegisters (Constructor) {

  /* Asset registration methods share the same signature:
   *
   * @param {String} id
   * @param {*} definition
   */

  config._assetTypes.forEach(function (type) {
    Constructor[type] = function (id, definition) {
      if (!definition) {
        return this.options[type + 's'][id]
      } else {
        this.options[type + 's'][id] = definition
      }
    }
  })

  /**
   * Component registration needs to automatically invoke
   * Vue.extend on object values.
   *
   * @param {String} id
   * @param {Object|Function} definition
   */

  Constructor.component = function (id, definition) {
    if (!definition) {
      return this.options.components[id]
    } else {
      if (_.isPlainObject(definition)) {
        definition.name = id
        definition = _.Vue.extend(definition)
      }
      this.options.components[id] = definition
    }
  }
}

createAssetRegisters(exports)
},{"../compiler/compile":14,"../compiler/transclude":15,"../config":16,"../parsers/directive":51,"../parsers/expression":52,"../parsers/path":53,"../parsers/template":54,"../parsers/text":55,"../util":62}],11:[function(require,module,exports){
var _ = require('../util')
var compile = require('../compiler/compile')

/**
 * Set instance target element and kick off the compilation
 * process. The passed in `el` can be a selector string, an
 * existing Element, or a DocumentFragment (for block
 * instances).
 *
 * @param {Element|DocumentFragment|string} el
 * @public
 */

exports.$mount = function (el) {
  if (this._isCompiled) {
    _.warn('$mount() should be called only once.')
    return
  }
  if (!el) {
    el = document.createElement('div')
  } else if (typeof el === 'string') {
    var selector = el
    el = document.querySelector(el)
    if (!el) {
      _.warn('Cannot find element: ' + selector)
      return
    }
  }
  this._compile(el)
  this._isCompiled = true
  this._callHook('compiled')
  if (_.inDoc(this.$el)) {
    this._callHook('attached')
    this._initDOMHooks()
    ready.call(this)
  } else {
    this._initDOMHooks()
    this.$once('hook:attached', ready)
  }
  return this
}

/**
 * Mark an instance as ready.
 */

function ready () {
  this._isAttached = true
  this._isReady = true
  this._callHook('ready')
}

/**
 * Teardown the instance, simply delegate to the internal
 * _destroy.
 */

exports.$destroy = function (remove, deferCleanup) {
  this._destroy(remove, deferCleanup)
}

/**
 * Partially compile a piece of DOM and return a
 * decompile function.
 *
 * @param {Element|DocumentFragment} el
 * @return {Function}
 */

exports.$compile = function (el) {
  return compile(el, this.$options, true)(this, el)
}
},{"../compiler/compile":14,"../util":62}],12:[function(require,module,exports){
var _ = require('./util')
var MAX_UPDATE_COUNT = 10

// we have two separate queues: one for directive updates
// and one for user watcher registered via $watch().
// we want to guarantee directive updates to be called
// before user watchers so that when user watchers are
// triggered, the DOM would have already been in updated
// state.
var queue = []
var userQueue = []
var has = {}
var waiting = false
var flushing = false

/**
 * Reset the batcher's state.
 */

function reset () {
  queue = []
  userQueue = []
  has = {}
  waiting = false
  flushing = false
}

/**
 * Flush both queues and run the jobs.
 */

function flush () {
  flushing = true
  run(queue)
  run(userQueue)
  reset()
}

/**
 * Run the jobs in a single queue.
 *
 * @param {Array} queue
 */

function run (queue) {
  // do not cache length because more jobs might be pushed
  // as we run existing jobs
  for (var i = 0; i < queue.length; i++) {
    queue[i].run()
  }
}

/**
 * Push a job into the job queue.
 * Jobs with duplicate IDs will be skipped unless it's
 * pushed when the queue is being flushed.
 *
 * @param {Object} job
 *   properties:
 *   - {String|Number} id
 *   - {Function}      run
 */

exports.push = function (job) {
  var id = job.id
  if (!id || !has[id] || flushing) {
    if (!has[id]) {
      has[id] = 1
    } else {
      has[id]++
      // detect possible infinite update loops
      if (has[id] > MAX_UPDATE_COUNT) {
        _.warn(
          'You may have an infinite update loop for the ' +
          'watcher with expression: "' + job.expression + '".'
        )
        return
      }
    }
    // A user watcher callback could trigger another
    // directive update during the flushing; at that time
    // the directive queue would already have been run, so
    // we call that update immediately as it is pushed.
    if (flushing && !job.user) {
      job.run()
      return
    }
    ;(job.user ? userQueue : queue).push(job)
    if (!waiting) {
      waiting = true
      _.nextTick(flush)
    }
  }
}
},{"./util":62}],13:[function(require,module,exports){
/**
 * A doubly linked list-based Least Recently Used (LRU)
 * cache. Will keep most recently used items while
 * discarding least recently used items when its limit is
 * reached. This is a bare-bone version of
 * Rasmus Andersson's js-lru:
 *
 *   https://github.com/rsms/js-lru
 *
 * @param {Number} limit
 * @constructor
 */

function Cache (limit) {
  this.size = 0
  this.limit = limit
  this.head = this.tail = undefined
  this._keymap = {}
}

var p = Cache.prototype

/**
 * Put <value> into the cache associated with <key>.
 * Returns the entry which was removed to make room for
 * the new entry. Otherwise undefined is returned.
 * (i.e. if there was enough room already).
 *
 * @param {String} key
 * @param {*} value
 * @return {Entry|undefined}
 */

p.put = function (key, value) {
  var entry = {
    key:key,
    value:value
  }
  this._keymap[key] = entry
  if (this.tail) {
    this.tail.newer = entry
    entry.older = this.tail
  } else {
    this.head = entry
  }
  this.tail = entry
  if (this.size === this.limit) {
    return this.shift()
  } else {
    this.size++
  }
}

/**
 * Purge the least recently used (oldest) entry from the
 * cache. Returns the removed entry or undefined if the
 * cache was empty.
 */

p.shift = function () {
  var entry = this.head
  if (entry) {
    this.head = this.head.newer
    this.head.older = undefined
    entry.newer = entry.older = undefined
    this._keymap[entry.key] = undefined
  }
  return entry
}

/**
 * Get and register recent use of <key>. Returns the value
 * associated with <key> or undefined if not in cache.
 *
 * @param {String} key
 * @param {Boolean} returnEntry
 * @return {Entry|*}
 */

p.get = function (key, returnEntry) {
  var entry = this._keymap[key]
  if (entry === undefined) return
  if (entry === this.tail) {
    return returnEntry
      ? entry
      : entry.value
  }
  // HEAD--------------TAIL
  //   <.older   .newer>
  //  <--- add direction --
  //   A  B  C  <D>  E
  if (entry.newer) {
    if (entry === this.head) {
      this.head = entry.newer
    }
    entry.newer.older = entry.older // C <-- E.
  }
  if (entry.older) {
    entry.older.newer = entry.newer // C. --> E
  }
  entry.newer = undefined // D --x
  entry.older = this.tail // D. --> E
  if (this.tail) {
    this.tail.newer = entry // E. <-- D
  }
  this.tail = entry
  return returnEntry
    ? entry
    : entry.value
}

module.exports = Cache
},{}],14:[function(require,module,exports){
var _ = require('../util')
var config = require('../config')
var textParser = require('../parsers/text')
var dirParser = require('../parsers/directive')
var templateParser = require('../parsers/template')
var resolveAsset = _.resolveAsset

// internal directives
var propDef = require('../directives/prop')
var componentDef = require('../directives/component')

// terminal directives
var terminalDirectives = [
  'repeat',
  'if'
]

module.exports = compile

/**
 * Compile a template and return a reusable composite link
 * function, which recursively contains more link functions
 * inside. This top level compile function should only be
 * called on instance root nodes.
 *
 * @param {Element|DocumentFragment} el
 * @param {Object} options
 * @param {Boolean} partial
 * @param {Boolean} transcluded
 * @return {Function}
 */

function compile (el, options, partial, transcluded) {
  // link function for the node itself.
  var nodeLinkFn = !partial
    ? compileRoot(el, options)
    : compileNode(el, options)
  // link function for the childNodes
  var childLinkFn =
    !(nodeLinkFn && nodeLinkFn.terminal) &&
    el.tagName !== 'SCRIPT' &&
    el.hasChildNodes()
      ? compileNodeList(el.childNodes, options)
      : null

  /**
   * A composite linker function to be called on a already
   * compiled piece of DOM, which instantiates all directive
   * instances.
   *
   * @param {Vue} vm
   * @param {Element|DocumentFragment} el
   * @return {Function|undefined}
   */

  function compositeLinkFn (vm, el) {
    // save original directive count before linking
    // so we can capture the directives created during a
    // partial compilation.
    var originalDirCount = vm._directives.length
    var parentOriginalDirCount =
      vm.$parent && vm.$parent._directives.length
    // cache childNodes before linking parent, fix #657
    var childNodes = _.toArray(el.childNodes)
    // if this is a transcluded compile, linkers need to be
    // called in source scope, and the host needs to be
    // passed down.
    var source = transcluded ? vm.$parent : vm
    var host = transcluded ? vm : undefined
    // link
    if (nodeLinkFn) nodeLinkFn(source, el, host)
    if (childLinkFn) childLinkFn(source, childNodes, host)

    var selfDirs = vm._directives.slice(originalDirCount)
    var parentDirs = vm.$parent &&
      vm.$parent._directives.slice(parentOriginalDirCount)

    /**
     * The linker function returns an unlink function that
     * tearsdown all directives instances generated during
     * the process.
     *
     * @param {Boolean} destroying
     */
    return function unlink (destroying) {
      teardownDirs(vm, selfDirs, destroying)
      if (parentDirs) {
        teardownDirs(vm.$parent, parentDirs)
      }
    }
  }

  // transcluded linkFns are terminal, because it takes
  // over the entire sub-tree.
  if (transcluded) {
    compositeLinkFn.terminal = true
  }

  return compositeLinkFn
}

/**
 * Teardown a subset of directives on a vm.
 *
 * @param {Vue} vm
 * @param {Array} dirs
 * @param {Boolean} destroying
 */

function teardownDirs (vm, dirs, destroying) {
  var i = dirs.length
  while (i--) {
    dirs[i]._teardown()
    if (!destroying) {
      vm._directives.$remove(dirs[i])
    }
  }
}

/**
 * Compile the root element of an instance. There are
 * 3 types of things to process here:
 *
 * 1. props on parent container (child scope)
 * 2. other attrs on parent container (parent scope)
 * 3. attrs on the component template root node, if
 *    replace:true (child scope)
 *
 * Also, if this is a block instance, we only need to
 * compile 1 & 2 here.
 *
 * @param {Element} el
 * @param {Object} options
 * @return {Function}
 */

function compileRoot (el, options) {
  var containerAttrs = options._containerAttrs
  var replacerAttrs = options._replacerAttrs
  var props = options.props
  var propsLinkFn, parentLinkFn, replacerLinkFn
  // 1. props
  propsLinkFn = props && containerAttrs
    ? compileProps(el, containerAttrs, props)
    : null
  // only need to compile other attributes for
  // non-block instances
  if (el.nodeType !== 11) {
    // for components, container and replacer need to be
    // compiled separately and linked in different scopes.
    if (options._asComponent) {
      // 2. container attributes
      if (containerAttrs) {
        parentLinkFn = compileDirectives(containerAttrs, options)
      }
      if (replacerAttrs) {
        // 3. replacer attributes
        replacerLinkFn = compileDirectives(replacerAttrs, options)
      }
    } else {
      // non-component, just compile as a normal element.
      replacerLinkFn = compileDirectives(el, options)
    }
  }
  return function rootLinkFn (vm, el, host) {
    // explicitly passing null to props
    // linkers because they don't need a real element
    if (propsLinkFn) propsLinkFn(vm, null)
    if (parentLinkFn) parentLinkFn(vm.$parent, el, host)
    if (replacerLinkFn) replacerLinkFn(vm, el, host)
  }
}

/**
 * Compile a node and return a nodeLinkFn based on the
 * node type.
 *
 * @param {Node} node
 * @param {Object} options
 * @return {Function|null}
 */

function compileNode (node, options) {
  var type = node.nodeType
  if (type === 1 && node.tagName !== 'SCRIPT') {
    return compileElement(node, options)
  } else if (type === 3 && config.interpolate && node.data.trim()) {
    return compileTextNode(node, options)
  } else {
    return null
  }
}

/**
 * Compile an element and return a nodeLinkFn.
 *
 * @param {Element} el
 * @param {Object} options
 * @return {Function|null}
 */

function compileElement (el, options) {
  var hasAttrs = el.hasAttributes()
  if (hasAttrs && checkTransclusion(el)) {
    // unwrap textNode
    if (el.hasAttribute('__vue__wrap')) {
      el = el.firstChild
    }
    return compile(el, options._parent.$options, true, true)
  }
  // check element directives
  var linkFn = checkElementDirectives(el, options)
  // check terminal direcitves (repeat & if)
  if (!linkFn && hasAttrs) {
    linkFn = checkTerminalDirectives(el, options)
  }
  // check component
  if (!linkFn) {
    linkFn = checkComponent(el, options)
  }
  // normal directives
  if (!linkFn && hasAttrs) {
    linkFn = compileDirectives(el, options)
  }
  // if the element is a textarea, we need to interpolate
  // its content on initial render.
  if (el.tagName === 'TEXTAREA') {
    var realLinkFn = linkFn
    linkFn = function (vm, el) {
      el.value = vm.$interpolate(el.value)
      if (realLinkFn) realLinkFn(vm, el)
    }
    linkFn.terminal = true
  }
  return linkFn
}

/**
 * Compile a textNode and return a nodeLinkFn.
 *
 * @param {TextNode} node
 * @param {Object} options
 * @return {Function|null} textNodeLinkFn
 */

function compileTextNode (node, options) {
  var tokens = textParser.parse(node.data)
  if (!tokens) {
    return null
  }
  var frag = document.createDocumentFragment()
  var el, token
  for (var i = 0, l = tokens.length; i < l; i++) {
    token = tokens[i]
    el = token.tag
      ? processTextToken(token, options)
      : document.createTextNode(token.value)
    frag.appendChild(el)
  }
  return makeTextNodeLinkFn(tokens, frag, options)
}

/**
 * Process a single text token.
 *
 * @param {Object} token
 * @param {Object} options
 * @return {Node}
 */

function processTextToken (token, options) {
  var el
  if (token.oneTime) {
    el = document.createTextNode(token.value)
  } else {
    if (token.html) {
      el = document.createComment('v-html')
      setTokenType('html')
    } else {
      // IE will clean up empty textNodes during
      // frag.cloneNode(true), so we have to give it
      // something here...
      el = document.createTextNode(' ')
      setTokenType('text')
    }
  }
  function setTokenType (type) {
    token.type = type
    token.def = resolveAsset(options, 'directives', type)
    token.descriptor = dirParser.parse(token.value)[0]
  }
  return el
}

/**
 * Build a function that processes a textNode.
 *
 * @param {Array<Object>} tokens
 * @param {DocumentFragment} frag
 */

function makeTextNodeLinkFn (tokens, frag) {
  return function textNodeLinkFn (vm, el) {
    var fragClone = frag.cloneNode(true)
    var childNodes = _.toArray(fragClone.childNodes)
    var token, value, node
    for (var i = 0, l = tokens.length; i < l; i++) {
      token = tokens[i]
      value = token.value
      if (token.tag) {
        node = childNodes[i]
        if (token.oneTime) {
          value = vm.$eval(value)
          if (token.html) {
            _.replace(node, templateParser.parse(value, true))
          } else {
            node.data = value
          }
        } else {
          vm._bindDir(token.type, node,
                      token.descriptor, token.def)
        }
      }
    }
    _.replace(el, fragClone)
  }
}

/**
 * Compile a node list and return a childLinkFn.
 *
 * @param {NodeList} nodeList
 * @param {Object} options
 * @return {Function|undefined}
 */

function compileNodeList (nodeList, options) {
  var linkFns = []
  var nodeLinkFn, childLinkFn, node
  for (var i = 0, l = nodeList.length; i < l; i++) {
    node = nodeList[i]
    nodeLinkFn = compileNode(node, options)
    childLinkFn =
      !(nodeLinkFn && nodeLinkFn.terminal) &&
      node.tagName !== 'SCRIPT' &&
      node.hasChildNodes()
        ? compileNodeList(node.childNodes, options)
        : null
    linkFns.push(nodeLinkFn, childLinkFn)
  }
  return linkFns.length
    ? makeChildLinkFn(linkFns)
    : null
}

/**
 * Make a child link function for a node's childNodes.
 *
 * @param {Array<Function>} linkFns
 * @return {Function} childLinkFn
 */

function makeChildLinkFn (linkFns) {
  return function childLinkFn (vm, nodes, host) {
    var node, nodeLinkFn, childrenLinkFn
    for (var i = 0, n = 0, l = linkFns.length; i < l; n++) {
      node = nodes[n]
      nodeLinkFn = linkFns[i++]
      childrenLinkFn = linkFns[i++]
      // cache childNodes before linking parent, fix #657
      var childNodes = _.toArray(node.childNodes)
      if (nodeLinkFn) {
        nodeLinkFn(vm, node, host)
      }
      if (childrenLinkFn) {
        childrenLinkFn(vm, childNodes, host)
      }
    }
  }
}

/**
 * Compile param attributes on a root element and return
 * a props link function.
 *
 * @param {Element|DocumentFragment} el
 * @param {Object} attrs
 * @param {Array} propNames
 * @return {Function} propsLinkFn
 */

// regex to test if a path is "settable"
// if not the prop binding is automatically one-way.
var settablePathRE = /^[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*|\[[^\[\]]+\])*$/
var literalValueRE = /^true|false|\d+$/

function compileProps (el, attrs, propNames) {
  var props = []
  var i = propNames.length
  var name, value, prop
  while (i--) {
    name = propNames[i]
    if (/[A-Z]/.test(name)) {
      _.warn(
        'You seem to be using camelCase for a component prop, ' +
        'but HTML doesn\'t differentiate between upper and ' +
        'lower case. You should use hyphen-delimited ' +
        'attribute names. For more info see ' +
        'http://vuejs.org/api/options.html#props'
      )
    }
    value = attrs[name]
    /* jshint eqeqeq:false */
    if (value != null) {
      prop = {
        name: name,
        raw: value
      }
      var tokens = textParser.parse(value)
      if (tokens) {
        if (el && el.nodeType === 1) {
          el.removeAttribute(name)
        }
        attrs[name] = null
        prop.dynamic = true
        prop.value = textParser.tokensToExp(tokens)
        prop.oneTime =
          tokens.length > 1 ||
          tokens[0].oneTime ||
          !settablePathRE.test(prop.value) ||
          literalValueRE.test(prop.value)
      }
      props.push(prop)
    }
  }
  return makePropsLinkFn(props)
}

/**
 * Build a function that applies props to a vm.
 *
 * @param {Array} props
 * @return {Function} propsLinkFn
 */

var dataAttrRE = /^data-/

function makePropsLinkFn (props) {
  return function propsLinkFn (vm, el) {
    var i = props.length
    var prop, path
    while (i--) {
      prop = props[i]
      // props could contain dashes, which will be
      // interpreted as minus calculations by the parser
      // so we need to wrap the path here
      path = _.camelize(prop.name.replace(dataAttrRE, ''))
      if (prop.dynamic) {
        if (vm.$parent) {
          vm._bindDir('prop', el, {
            arg: path,
            expression: prop.value,
            oneWay: prop.oneTime
          }, propDef)
        } else {
          _.warn(
            'Cannot bind dynamic prop on a root instance' +
            ' with no parent: ' + prop.name + '="' +
            prop.raw + '"'
          )
        }
      } else {
        // just set once
        vm.$set(path, _.toNumber(prop.raw))
      }
    }
  }
}

/**
 * Check for element directives (custom elements that should
 * be resovled as terminal directives).
 *
 * @param {Element} el
 * @param {Object} options
 */

function checkElementDirectives (el, options) {
  var tag = el.tagName.toLowerCase()
  var def = resolveAsset(options, 'elementDirectives', tag)
  if (def) {
    return makeTerminalNodeLinkFn(el, tag, '', options, def)
  }
}

/**
 * Check if an element is a component. If yes, return
 * a component link function.
 *
 * @param {Element} el
 * @param {Object} options
 * @return {Function|undefined}
 */

function checkComponent (el, options) {
  var componentId = _.checkComponent(el, options)
  if (componentId) {
    var componentLinkFn = function (vm, el, host) {
      vm._bindDir('component', el, {
        expression: componentId
      }, componentDef, host)
    }
    componentLinkFn.terminal = true
    return componentLinkFn
  }
}

/**
 * Check an element for terminal directives in fixed order.
 * If it finds one, return a terminal link function.
 *
 * @param {Element} el
 * @param {Object} options
 * @return {Function} terminalLinkFn
 */

function checkTerminalDirectives (el, options) {
  if (_.attr(el, 'pre') !== null) {
    return skip
  }
  var value, dirName
  /* jshint boss: true */
  for (var i = 0, l = terminalDirectives.length; i < l; i++) {
    dirName = terminalDirectives[i]
    if ((value = _.attr(el, dirName)) !== null) {
      return makeTerminalNodeLinkFn(el, dirName, value, options)
    }
  }
}

function skip () {}
skip.terminal = true

/**
 * Build a node link function for a terminal directive.
 * A terminal link function terminates the current
 * compilation recursion and handles compilation of the
 * subtree in the directive.
 *
 * @param {Element} el
 * @param {String} dirName
 * @param {String} value
 * @param {Object} options
 * @param {Object} [def]
 * @return {Function} terminalLinkFn
 */

function makeTerminalNodeLinkFn (el, dirName, value, options, def) {
  var descriptor = dirParser.parse(value)[0]
  // no need to call resolveAsset since terminal directives
  // are always internal
  def = def || options.directives[dirName]
  var fn = function terminalNodeLinkFn (vm, el, host) {
    vm._bindDir(dirName, el, descriptor, def, host)
  }
  fn.terminal = true
  return fn
}

/**
 * Compile the directives on an element and return a linker.
 *
 * @param {Element|Object} elOrAttrs
 *        - could be an object of already-extracted
 *          container attributes.
 * @param {Object} options
 * @return {Function}
 */

function compileDirectives (elOrAttrs, options) {
  var attrs = _.isPlainObject(elOrAttrs)
    ? mapToList(elOrAttrs)
    : elOrAttrs.attributes
  var i = attrs.length
  var dirs = []
  var attr, name, value, dir, dirName, dirDef
  while (i--) {
    attr = attrs[i]
    name = attr.name
    value = attr.value
    if (value === null) continue
    if (name.indexOf(config.prefix) === 0) {
      dirName = name.slice(config.prefix.length)
      dirDef = resolveAsset(options, 'directives', dirName)
      _.assertAsset(dirDef, 'directive', dirName)
      if (dirDef) {
        dirs.push({
          name: dirName,
          descriptors: dirParser.parse(value),
          def: dirDef
        })
      }
    } else if (config.interpolate) {
      dir = collectAttrDirective(name, value, options)
      if (dir) {
        dirs.push(dir)
      }
    }
  }
  // sort by priority, LOW to HIGH
  if (dirs.length) {
    dirs.sort(directiveComparator)
    return makeNodeLinkFn(dirs)
  }
}

/**
 * Convert a map (Object) of attributes to an Array.
 *
 * @param {Object} map
 * @return {Array}
 */

function mapToList (map) {
  var list = []
  for (var key in map) {
    list.push({
      name: key,
      value: map[key]
    })
  }
  return list
}

/**
 * Build a link function for all directives on a single node.
 *
 * @param {Array} directives
 * @return {Function} directivesLinkFn
 */

function makeNodeLinkFn (directives) {
  return function nodeLinkFn (vm, el, host) {
    // reverse apply because it's sorted low to high
    var i = directives.length
    var dir, j, k
    while (i--) {
      dir = directives[i]
      if (dir._link) {
        // custom link fn
        dir._link(vm, el)
      } else {
        k = dir.descriptors.length
        for (j = 0; j < k; j++) {
          vm._bindDir(dir.name, el,
            dir.descriptors[j], dir.def, host)
        }
      }
    }
  }
}

/**
 * Check an attribute for potential dynamic bindings,
 * and return a directive object.
 *
 * @param {String} name
 * @param {String} value
 * @param {Object} options
 * @return {Object}
 */

function collectAttrDirective (name, value, options) {
  var tokens = textParser.parse(value)
  if (tokens) {
    var def = options.directives.attr
    var i = tokens.length
    var allOneTime = true
    while (i--) {
      var token = tokens[i]
      if (token.tag && !token.oneTime) {
        allOneTime = false
      }
    }
    return {
      def: def,
      _link: allOneTime
        ? function (vm, el) {
            el.setAttribute(name, vm.$interpolate(value))
          }
        : function (vm, el) {
            var value = textParser.tokensToExp(tokens, vm)
            var desc = dirParser.parse(name + ':' + value)[0]
            vm._bindDir('attr', el, desc, def)
          }
    }
  }
}

/**
 * Directive priority sort comparator
 *
 * @param {Object} a
 * @param {Object} b
 */

function directiveComparator (a, b) {
  a = a.def.priority || 0
  b = b.def.priority || 0
  return a > b ? 1 : -1
}

/**
 * Check whether an element is transcluded
 *
 * @param {Element} el
 * @return {Boolean}
 */

var transcludedFlagAttr = '__vue__transcluded'
function checkTransclusion (el) {
  if (el.nodeType === 1 && el.hasAttribute(transcludedFlagAttr)) {
    el.removeAttribute(transcludedFlagAttr)
    return true
  }
}

},{"../config":16,"../directives/component":21,"../directives/prop":33,"../parsers/directive":51,"../parsers/template":54,"../parsers/text":55,"../util":62}],15:[function(require,module,exports){
var _ = require('../util')
var config = require('../config')
var templateParser = require('../parsers/template')
var transcludedFlagAttr = '__vue__transcluded'

/**
 * Process an element or a DocumentFragment based on a
 * instance option object. This allows us to transclude
 * a template node/fragment before the instance is created,
 * so the processed fragment can then be cloned and reused
 * in v-repeat.
 *
 * @param {Element} el
 * @param {Object} options
 * @return {Element|DocumentFragment}
 */

module.exports = function transclude (el, options) {
  // extract container attributes to pass them down
  // to compiler, because they need to be compiled in
  // parent scope. we are mutating the options object here
  // assuming the same object will be used for compile
  // right after this.
  if (options) {
    options._containerAttrs = extractAttrs(el)
  }
  // Mark content nodes and attrs so that the compiler
  // knows they should be compiled in parent scope.
  if (options && options._asComponent) {
    var i = el.childNodes.length
    while (i--) {
      var node = el.childNodes[i]
      if (node.nodeType === 1) {
        node.setAttribute(transcludedFlagAttr, '')
      } else if (node.nodeType === 3 && node.data.trim()) {
        // wrap transcluded textNodes in spans, because
        // raw textNodes can't be persisted through clones
        // by attaching attributes.
        var wrapper = document.createElement('span')
        wrapper.textContent = node.data
        wrapper.setAttribute('__vue__wrap', '')
        wrapper.setAttribute(transcludedFlagAttr, '')
        el.replaceChild(wrapper, node)
      }
    }
  }
  // for template tags, what we want is its content as
  // a documentFragment (for block instances)
  if (el.tagName === 'TEMPLATE') {
    el = templateParser.parse(el)
  }
  if (options && options.template) {
    el = transcludeTemplate(el, options)
  }
  if (el instanceof DocumentFragment) {
    // anchors for block instance
    // passing in `persist: true` to avoid them being
    // discarded by IE during template cloning
    _.prepend(_.createAnchor('v-start', true), el)
    el.appendChild(_.createAnchor('v-end', true))
  }
  return el
}

/**
 * Process the template option.
 * If the replace option is true this will swap the $el.
 *
 * @param {Element} el
 * @param {Object} options
 * @return {Element|DocumentFragment}
 */

function transcludeTemplate (el, options) {
  var template = options.template
  var frag = templateParser.parse(template, true)
  if (!frag) {
    _.warn('Invalid template option: ' + template)
  } else {
    var rawContent = options._content || _.extractContent(el)
    var replacer = frag.firstChild
    if (options.replace) {
      if (
        frag.childNodes.length > 1 ||
        replacer.nodeType !== 1 ||
        // when root node has v-repeat, the instance ends up
        // having multiple top-level nodes, thus becoming a
        // block instance. (#835)
        replacer.hasAttribute(config.prefix + 'repeat')
      ) {
        transcludeContent(frag, rawContent)
        return frag
      } else {
        options._replacerAttrs = extractAttrs(replacer)
        mergeAttrs(el, replacer)
        transcludeContent(replacer, rawContent)
        return replacer
      }
    } else {
      el.appendChild(frag)
      transcludeContent(el, rawContent)
      return el
    }
  }
}

/**
 * Resolve <content> insertion points mimicking the behavior
 * of the Shadow DOM spec:
 *
 *   http://w3c.github.io/webcomponents/spec/shadow/#insertion-points
 *
 * @param {Element|DocumentFragment} el
 * @param {Element} raw
 */

function transcludeContent (el, raw) {
  var outlets = getOutlets(el)
  var i = outlets.length
  if (!i) return
  var outlet, select, selected, j, main

  function isDirectChild (node) {
    return node.parentNode === raw
  }

  // first pass, collect corresponding content
  // for each outlet.
  while (i--) {
    outlet = outlets[i]
    if (raw) {
      select = outlet.getAttribute('select')
      if (select) {  // select content
        selected = raw.querySelectorAll(select)
        if (selected.length) {
          // according to Shadow DOM spec, `select` can
          // only select direct children of the host node.
          // enforcing this also fixes #786.
          selected = [].filter.call(selected, isDirectChild)
        }
        outlet.content = selected.length
          ? selected
          : _.toArray(outlet.childNodes)
      } else { // default content
        main = outlet
      }
    } else { // fallback content
      outlet.content = _.toArray(outlet.childNodes)
    }
  }
  // second pass, actually insert the contents
  for (i = 0, j = outlets.length; i < j; i++) {
    outlet = outlets[i]
    if (outlet !== main) {
      insertContentAt(outlet, outlet.content)
    }
  }
  // finally insert the main content
  if (main) {
    insertContentAt(main, _.toArray(raw.childNodes))
  }
}

/**
 * Get <content> outlets from the element/list
 *
 * @param {Element|Array} el
 * @return {Array}
 */

var concat = [].concat
function getOutlets (el) {
  return _.isArray(el)
    ? concat.apply([], el.map(getOutlets))
    : el.querySelectorAll
      ? _.toArray(el.querySelectorAll('content'))
      : []
}

/**
 * Insert an array of nodes at outlet,
 * then remove the outlet.
 *
 * @param {Element} outlet
 * @param {Array} contents
 */

function insertContentAt (outlet, contents) {
  // not using util DOM methods here because
  // parentNode can be cached
  var parent = outlet.parentNode
  for (var i = 0, j = contents.length; i < j; i++) {
    parent.insertBefore(contents[i], outlet)
  }
  parent.removeChild(outlet)
}

/**
 * Helper to extract a component container's attribute names
 * into a map. The resulting map will be used in compiler to
 * determine whether an attribute is transcluded.
 *
 * @param {Element} el
 * @return {Object}
 */

function extractAttrs (el) {
  if (el.nodeType === 1 && el.hasAttributes()) {
    var attrs = el.attributes
    var res = {}
    var i = attrs.length
    while (i--) {
      res[attrs[i].name] = attrs[i].value
    }
    return res
  }
}

/**
 * Merge the attributes of two elements, and make sure
 * the class names are merged properly.
 *
 * @param {Element} from
 * @param {Element} to
 */

function mergeAttrs (from, to) {
  var attrs = from.attributes
  var i = attrs.length
  var name, value
  while (i--) {
    name = attrs[i].name
    value = attrs[i].value
    if (!to.hasAttribute(name)) {
      to.setAttribute(name, value)
    } else if (name === 'class') {
      to.className = to.className + ' ' + value
    }
  }
}
},{"../config":16,"../parsers/template":54,"../util":62}],16:[function(require,module,exports){
module.exports = {

  /**
   * The prefix to look for when parsing directives.
   *
   * @type {String}
   */

  prefix: 'v-',

  /**
   * Whether to print debug messages.
   * Also enables stack trace for warnings.
   *
   * @type {Boolean}
   */

  debug: false,

  /**
   * Whether to suppress warnings.
   *
   * @type {Boolean}
   */

  silent: false,

  /**
   * Whether allow observer to alter data objects'
   * __proto__.
   *
   * @type {Boolean}
   */

  proto: true,

  /**
   * Whether to parse mustache tags in templates.
   *
   * @type {Boolean}
   */

  interpolate: true,

  /**
   * Whether to use async rendering.
   */

  async: true,

  /**
   * Whether to warn against errors caught when evaluating
   * expressions.
   */

  warnExpressionErrors: true,

  /**
   * Internal flag to indicate the delimiters have been
   * changed.
   *
   * @type {Boolean}
   */

  _delimitersChanged: true,

  /**
   * List of asset types that a component can own.
   *
   * @type {Array}
   */

  _assetTypes: [
    'directive',
    'elementDirective',
    'filter',
    'transition'
  ]

}

/**
 * Interpolation delimiters.
 * We need to mark the changed flag so that the text parser
 * knows it needs to recompile the regex.
 *
 * @type {Array<String>}
 */

var delimiters = ['{{', '}}']
Object.defineProperty(module.exports, 'delimiters', {
  get: function () {
    return delimiters
  },
  set: function (val) {
    delimiters = val
    this._delimitersChanged = true
  }
})
},{}],17:[function(require,module,exports){
var _ = require('./util')
var config = require('./config')
var Watcher = require('./watcher')
var textParser = require('./parsers/text')
var expParser = require('./parsers/expression')

/**
 * A directive links a DOM element with a piece of data,
 * which is the result of evaluating an expression.
 * It registers a watcher with the expression and calls
 * the DOM update function when a change is triggered.
 *
 * @param {String} name
 * @param {Node} el
 * @param {Vue} vm
 * @param {Object} descriptor
 *                 - {String} expression
 *                 - {String} [arg]
 *                 - {Array<Object>} [filters]
 * @param {Object} def - directive definition object
 * @param {Vue|undefined} host - transclusion host target
 * @constructor
 */

function Directive (name, el, vm, descriptor, def, host) {
  // public
  this.name = name
  this.el = el
  this.vm = vm
  // copy descriptor props
  this.raw = descriptor.raw
  this.expression = descriptor.expression
  this.arg = descriptor.arg
  this.filters = descriptor.filters
  // private
  this._descriptor = descriptor
  this._host = host
  this._locked = false
  this._bound = false
  // init
  this._bind(def)
}

var p = Directive.prototype

/**
 * Initialize the directive, mixin definition properties,
 * setup the watcher, call definition bind() and update()
 * if present.
 *
 * @param {Object} def
 */

p._bind = function (def) {
  if (this.name !== 'cloak' && this.el && this.el.removeAttribute) {
    this.el.removeAttribute(config.prefix + this.name)
  }
  if (typeof def === 'function') {
    this.update = def
  } else {
    _.extend(this, def)
  }
  this._watcherExp = this.expression
  this._checkDynamicLiteral()
  if (this.bind) {
    this.bind()
  }
  if (this._watcherExp &&
      (this.update || this.twoWay) &&
      (!this.isLiteral || this._isDynamicLiteral) &&
      !this._checkStatement()) {
    // wrapped updater for context
    var dir = this
    var update = this._update = this.update
      ? function (val, oldVal) {
          if (!dir._locked) {
            dir.update(val, oldVal)
          }
        }
      : function () {} // noop if no update is provided
    // pre-process hook called before the value is piped
    // through the filters. used in v-repeat.
    var preProcess = this._preProcess
      ? _.bind(this._preProcess, this)
      : null
    var watcher = this._watcher = new Watcher(
      this.vm,
      this._watcherExp,
      update, // callback
      {
        filters: this.filters,
        twoWay: this.twoWay,
        deep: this.deep,
        preProcess: preProcess
      }
    )
    if (this._initValue != null) {
      watcher.set(this._initValue)
    } else if (this.update) {
      this.update(watcher.value)
    }
  }
  this._bound = true
}

/**
 * check if this is a dynamic literal binding.
 *
 * e.g. v-component="{{currentView}}"
 */

p._checkDynamicLiteral = function () {
  var expression = this.expression
  if (expression && this.isLiteral) {
    var tokens = textParser.parse(expression)
    if (tokens) {
      var exp = textParser.tokensToExp(tokens)
      this.expression = this.vm.$get(exp)
      this._watcherExp = exp
      this._isDynamicLiteral = true
    }
  }
}

/**
 * Check if the directive is a function caller
 * and if the expression is a callable one. If both true,
 * we wrap up the expression and use it as the event
 * handler.
 *
 * e.g. v-on="click: a++"
 *
 * @return {Boolean}
 */

p._checkStatement = function () {
  var expression = this.expression
  if (
    expression && this.acceptStatement &&
    !expParser.isSimplePath(expression)
  ) {
    var fn = expParser.parse(expression).get
    var vm = this.vm
    var handler = function () {
      fn.call(vm, vm)
    }
    if (this.filters) {
      handler = vm._applyFilters(handler, null, this.filters)
    }
    this.update(handler)
    return true
  }
}

/**
 * Check for an attribute directive param, e.g. lazy
 *
 * @param {String} name
 * @return {String}
 */

p._checkParam = function (name) {
  var param = this.el.getAttribute(name)
  if (param !== null) {
    this.el.removeAttribute(name)
  }
  return param
}

/**
 * Teardown the watcher and call unbind.
 */

p._teardown = function () {
  if (this._bound) {
    this._bound = false
    if (this.unbind) {
      this.unbind()
    }
    if (this._watcher) {
      this._watcher.teardown()
    }
    this.vm = this.el = this._watcher = null
  }
}

/**
 * Set the corresponding value with the setter.
 * This should only be used in two-way directives
 * e.g. v-model.
 *
 * @param {*} value
 * @public
 */

p.set = function (value) {
  if (this.twoWay) {
    this._withLock(function () {
      this._watcher.set(value)
    })
  }
}

/**
 * Execute a function while preventing that function from
 * triggering updates on this directive instance.
 *
 * @param {Function} fn
 */

p._withLock = function (fn) {
  var self = this
  self._locked = true
  fn.call(self)
  _.nextTick(function () {
    self._locked = false
  })
}

module.exports = Directive
},{"./config":16,"./parsers/expression":52,"./parsers/text":55,"./util":62,"./watcher":67}],18:[function(require,module,exports){
// xlink
var xlinkNS = 'http://www.w3.org/1999/xlink'
var xlinkRE = /^xlink:/

module.exports = {

  priority: 850,

  bind: function () {
    var name = this.arg
    this.update = xlinkRE.test(name)
      ? xlinkHandler
      : defaultHandler
  }

}

function defaultHandler (value) {
  if (value || value === 0) {
    this.el.setAttribute(this.arg, value)
  } else {
    this.el.removeAttribute(this.arg)
  }
}

function xlinkHandler (value) {
  if (value != null) {
    this.el.setAttributeNS(xlinkNS, this.arg, value)
  } else {
    this.el.removeAttributeNS(xlinkNS, 'href')
  }
}
},{}],19:[function(require,module,exports){
var _ = require('../util')
var addClass = _.addClass
var removeClass = _.removeClass

module.exports = {
  
  update: function (value) {
    if (this.arg) {
      // single toggle
      var method = value ? addClass : removeClass
      method(this.el, this.arg)
    } else {
      this.cleanup()
      if (value && typeof value === 'string') {
        // raw CSSText
        addClass(this.el, value)
        this.lastVal = value
      } else if (_.isPlainObject(value)) {
        // object toggle
        for (var key in value) {
          if (value[key]) {
            addClass(this.el, key)
          } else {
            removeClass(this.el, key)
          }
        }
        this.prevKeys = Object.keys(value)
      }
    }
  },

  cleanup: function (value) {
    if (this.lastVal) {
      removeClass(this.el, this.lastVal)
    }
    if (this.prevKeys) {
      var i = this.prevKeys.length
      while (i--) {
        if (!value || !value[this.prevKeys[i]]) {
          removeClass(this.el, this.prevKeys[i])
        }
      }
    }
  }
}
},{"../util":62}],20:[function(require,module,exports){
var config = require('../config')

module.exports = {

  bind: function () {
    var el = this.el
    this.vm.$once('hook:compiled', function () {
      el.removeAttribute(config.prefix + 'cloak')
    })
  }

}
},{"../config":16}],21:[function(require,module,exports){
var _ = require('../util')
var templateParser = require('../parsers/template')

module.exports = {

  isLiteral: true,

  /**
   * Setup. Two possible usages:
   *
   * - static:
   *   v-component="comp"
   *
   * - dynamic:
   *   v-component="{{currentView}}"
   */

  bind: function () {
    if (!this.el.__vue__) {
      // create a ref anchor
      this.anchor = _.createAnchor('v-component')
      _.replace(this.el, this.anchor)
      // check keep-alive options.
      // If yes, instead of destroying the active vm when
      // hiding (v-if) or switching (dynamic literal) it,
      // we simply remove it from the DOM and save it in a
      // cache object, with its constructor id as the key.
      this.keepAlive = this._checkParam('keep-alive') != null
      // check ref
      this.refID = _.attr(this.el, 'ref')
      if (this.keepAlive) {
        this.cache = {}
      }
      // check inline-template
      if (this._checkParam('inline-template') !== null) {
        // extract inline template as a DocumentFragment
        this.template = _.extractContent(this.el, true)
      }
      // component resolution related state
      this._pendingCb =
      this.ctorId =
      this.Ctor = null
      // if static, build right now.
      if (!this._isDynamicLiteral) {
        this.resolveCtor(this.expression, _.bind(function () {
          var child = this.build()
          child.$before(this.anchor)
          this.setCurrent(child)
        }, this))
      } else {
        // check dynamic component params
        this.readyEvent = this._checkParam('wait-for')
        this.transMode = this._checkParam('transition-mode')
      }
    } else {
      _.warn(
        'v-component="' + this.expression + '" cannot be ' +
        'used on an already mounted instance.'
      )
    }
  },

  /**
   * Public update, called by the watcher in the dynamic
   * literal scenario, e.g. v-component="{{view}}"
   */

  update: function (value) {
    this.realUpdate(value)
  },

  /**
   * Switch dynamic components. May resolve the component
   * asynchronously, and perform transition based on
   * specified transition mode. Accepts an async callback
   * which is called when the transition ends. (This is
   * exposed for vue-router)
   *
   * @param {String} value
   * @param {Function} [cb]
   */

  realUpdate: function (value, cb) {
    this.invalidatePending()
    if (!value) {
      // just remove current
      this.unbuild()
      this.remove(this.childVM, cb)
      this.unsetCurrent()
    } else {
      this.resolveCtor(value, _.bind(function () {
        this.unbuild()
        var newComponent = this.build()
        var self = this
        if (this.readyEvent) {
          newComponent.$once(this.readyEvent, function () {
            self.swapTo(newComponent, cb)
          })
        } else {
          this.swapTo(newComponent, cb)
        }
      }, this))
    }
  },

  /**
   * Resolve the component constructor to use when creating
   * the child vm.
   */

  resolveCtor: function (id, cb) {
    var self = this
    this._pendingCb = _.cancellable(function (ctor) {
      self.ctorId = id
      self.Ctor = ctor
      cb()
    })
    this.vm._resolveComponent(id, this._pendingCb)
  },

  /**
   * When the component changes or unbinds before an async
   * constructor is resolved, we need to invalidate its
   * pending callback.
   */

  invalidatePending: function () {
    if (this._pendingCb) {
      this._pendingCb.cancel()
      this._pendingCb = null
    }
  },

  /**
   * Instantiate/insert a new child vm.
   * If keep alive and has cached instance, insert that
   * instance; otherwise build a new one and cache it.
   *
   * @return {Vue} - the created instance
   */

  build: function () {
    if (this.keepAlive) {
      var cached = this.cache[this.ctorId]
      if (cached) {
        return cached
      }
    }
    var vm = this.vm
    var el = templateParser.clone(this.el)
    if (this.Ctor) {
      var child = vm.$addChild({
        el: el,
        template: this.template,
        _asComponent: true,
        _host: this._host
      }, this.Ctor)
      if (this.keepAlive) {
        this.cache[this.ctorId] = child
      }
      return child
    }
  },

  /**
   * Teardown the current child, but defers cleanup so
   * that we can separate the destroy and removal steps.
   */

  unbuild: function () {
    var child = this.childVM
    if (!child || this.keepAlive) {
      return
    }
    // the sole purpose of `deferCleanup` is so that we can
    // "deactivate" the vm right now and perform DOM removal
    // later.
    child.$destroy(false, true)
  },

  /**
   * Remove current destroyed child and manually do
   * the cleanup after removal.
   *
   * @param {Function} cb
   */

  remove: function (child, cb) {
    var keepAlive = this.keepAlive
    if (child) {
      child.$remove(function () {
        if (!keepAlive) child._cleanup()
        if (cb) cb()
      })
    } else if (cb) {
      cb()
    }
  },

  /**
   * Actually swap the components, depending on the
   * transition mode. Defaults to simultaneous.
   *
   * @param {Vue} target
   * @param {Function} [cb]
   */

  swapTo: function (target, cb) {
    var self = this
    var current = this.childVM
    this.unsetCurrent()
    this.setCurrent(target)
    switch (self.transMode) {
      case 'in-out':
        target.$before(self.anchor, function () {
          self.remove(current, cb)
        })
        break
      case 'out-in':
        self.remove(current, function () {
          target.$before(self.anchor, cb)
        })
        break
      default:
        self.remove(current)
        target.$before(self.anchor, cb)
    }
  },

  /**
   * Set childVM and parent ref
   */
  
  setCurrent: function (child) {
    this.childVM = child
    var refID = child._refID || this.refID
    if (refID) {
      this.vm.$[refID] = child
    }
  },

  /**
   * Unset childVM and parent ref
   */

  unsetCurrent: function () {
    var child = this.childVM
    this.childVM = null
    var refID = (child && child._refID) || this.refID
    if (refID) {
      this.vm.$[refID] = null
    }
  },

  /**
   * Unbind.
   */

  unbind: function () {
    this.invalidatePending()
    this.unbuild()
    // destroy all keep-alive cached instances
    if (this.cache) {
      for (var key in this.cache) {
        this.cache[key].$destroy()
      }
      this.cache = null
    }
  }

}
},{"../parsers/template":54,"../util":62}],22:[function(require,module,exports){
module.exports = {

  isLiteral: true,

  bind: function () {
    this.vm.$$[this.expression] = this.el
  },

  unbind: function () {
    delete this.vm.$$[this.expression]
  }
  
}
},{}],23:[function(require,module,exports){
var _ = require('../util')

module.exports = {

  acceptStatement: true,

  bind: function () {
    var child = this.el.__vue__
    if (!child || this.vm !== child.$parent) {
      _.warn(
        '`v-events` should only be used on a child component ' +
        'from the parent template.'
      )
      return
    }
  },

  update: function (handler, oldHandler) {
    if (typeof handler !== 'function') {
      _.warn(
        'Directive "v-events:' + this.expression + '" ' +
        'expects a function value.'
      )
      return
    }
    var child = this.el.__vue__
    if (oldHandler) {
      child.$off(this.arg, oldHandler)
    }
    child.$on(this.arg, handler)
  }

  // when child is destroyed, all events are turned off,
  // so no need for unbind here.

}
},{"../util":62}],24:[function(require,module,exports){
var _ = require('../util')
var templateParser = require('../parsers/template')

module.exports = {

  bind: function () {
    // a comment node means this is a binding for
    // {{{ inline unescaped html }}}
    if (this.el.nodeType === 8) {
      // hold nodes
      this.nodes = []
      // replace the placeholder with proper anchor
      this.anchor = _.createAnchor('v-html')
      _.replace(this.el, this.anchor)
    }
  },

  update: function (value) {
    value = _.toString(value)
    if (this.nodes) {
      this.swap(value)
    } else {
      this.el.innerHTML = value
    }
  },

  swap: function (value) {
    // remove old nodes
    var i = this.nodes.length
    while (i--) {
      _.remove(this.nodes[i])
    }
    // convert new value to a fragment
    // do not attempt to retrieve from id selector
    var frag = templateParser.parse(value, true, true)
    // save a reference to these nodes so we can remove later
    this.nodes = _.toArray(frag.childNodes)
    _.before(frag, this.anchor)
  }

}
},{"../parsers/template":54,"../util":62}],25:[function(require,module,exports){
var _ = require('../util')
var compile = require('../compiler/compile')
var templateParser = require('../parsers/template')
var transition = require('../transition')

module.exports = {

  bind: function () {
    var el = this.el
    if (!el.__vue__) {
      this.start = _.createAnchor('v-if-start')
      this.end = _.createAnchor('v-if-end')
      _.replace(el, this.end)
      _.before(this.start, this.end)
      if (el.tagName === 'TEMPLATE') {
        this.template = templateParser.parse(el, true)
      } else {
        this.template = document.createDocumentFragment()
        this.template.appendChild(templateParser.clone(el))
      }
      // compile the nested partial
      this.linker = compile(
        this.template,
        this.vm.$options,
        true
      )
    } else {
      this.invalid = true
      _.warn(
        'v-if="' + this.expression + '" cannot be ' +
        'used on an already mounted instance.'
      )
    }
  },

  update: function (value) {
    if (this.invalid) return
    if (value) {
      // avoid duplicate compiles, since update() can be
      // called with different truthy values
      if (!this.unlink) {
        this.compile()
      }
    } else {
      this.teardown()
    }
  },

  compile: function () {
    var vm = this.vm
    var frag = templateParser.clone(this.template)
    // the linker is not guaranteed to be present because
    // this function might get called by v-partial 
    this.unlink = this.linker(vm, frag)
    transition.blockAppend(frag, this.end, vm)
    // call attached for all the child components created
    // during the compilation
    if (_.inDoc(vm.$el)) {
      var children = this.getContainedComponents()
      if (children) children.forEach(callAttach)
    }
  },

  teardown: function () {
    if (!this.unlink) return
    // collect children beforehand
    var children
    if (_.inDoc(this.vm.$el)) {
      children = this.getContainedComponents()
    }
    transition.blockRemove(this.start, this.end, this.vm)
    if (children) children.forEach(callDetach)
    this.unlink()
    this.unlink = null
  },

  getContainedComponents: function () {
    var vm = this.vm
    var start = this.start.nextSibling
    var end = this.end
    var selfCompoents =
      vm._children.length &&
      vm._children.filter(contains)
    var transComponents =
      vm._transCpnts &&
      vm._transCpnts.filter(contains)

    function contains (c) {
      var cur = start
      var next
      while (next !== end) {
        next = cur.nextSibling
        if (cur.contains(c.$el)) {
          return true
        }
        cur = next
      }
      return false
    }

    return selfCompoents
      ? transComponents
        ? selfCompoents.concat(transComponents)
        : selfCompoents
      : transComponents
  },

  unbind: function () {
    if (this.unlink) this.unlink()
  }

}

function callAttach (child) {
  if (!child._isAttached) {
    child._callHook('attached')
  }
}

function callDetach (child) {
  if (child._isAttached) {
    child._callHook('detached')
  }
}
},{"../compiler/compile":14,"../parsers/template":54,"../transition":56,"../util":62}],26:[function(require,module,exports){
// manipulation directives
exports.text       = require('./text')
exports.html       = require('./html')
exports.attr       = require('./attr')
exports.show       = require('./show')
exports['class']   = require('./class')
exports.el         = require('./el')
exports.ref        = require('./ref')
exports.cloak      = require('./cloak')
exports.style      = require('./style')
exports.transition = require('./transition')

// event listener directives
exports.on         = require('./on')
exports.model      = require('./model')

// logic control directives
exports.repeat     = require('./repeat')
exports['if']      = require('./if')

// child vm communication directives
exports.events     = require('./events')

// internal directives that should not be used directly
// but we still want to expose them for advanced usage.
exports._component = require('./component')
exports._prop      = require('./prop')
},{"./attr":18,"./class":19,"./cloak":20,"./component":21,"./el":22,"./events":23,"./html":24,"./if":25,"./model":28,"./on":32,"./prop":33,"./ref":34,"./repeat":35,"./show":36,"./style":37,"./text":38,"./transition":39}],27:[function(require,module,exports){
var _ = require('../../util')

module.exports = {

  bind: function () {
    var self = this
    var el = this.el
    this.listener = function () {
      self.set(el.checked)
    }
    _.on(el, 'change', this.listener)
    if (el.checked) {
      this._initValue = el.checked
    }
  },

  update: function (value) {
    this.el.checked = !!value
  },

  unbind: function () {
    _.off(this.el, 'change', this.listener)
  }

}
},{"../../util":62}],28:[function(require,module,exports){
var _ = require('../../util')

var handlers = {
  text: require('./text'),
  radio: require('./radio'),
  select: require('./select'),
  checkbox: require('./checkbox')
}

module.exports = {

  priority: 800,
  twoWay: true,
  handlers: handlers,

  /**
   * Possible elements:
   *   <select>
   *   <textarea>
   *   <input type="*">
   *     - text
   *     - checkbox
   *     - radio
   *     - number
   *     - TODO: more types may be supplied as a plugin
   */

  bind: function () {
    // friendly warning...
    this.checkFilters()
    if (this.hasRead && !this.hasWrite) {
      _.warn(
        'It seems you are using a read-only filter with ' +
        'v-model. You might want to use a two-way filter ' +
        'to ensure correct behavior.'
      )
    }
    var el = this.el
    var tag = el.tagName
    var handler
    if (tag === 'INPUT') {
      handler = handlers[el.type] || handlers.text
    } else if (tag === 'SELECT') {
      handler = handlers.select
    } else if (tag === 'TEXTAREA') {
      handler = handlers.text
    } else {
      _.warn('v-model does not support element type: ' + tag)
      return
    }
    handler.bind.call(this)
    this.update = handler.update
    this.unbind = handler.unbind
  },

  /**
   * Check read/write filter stats.
   */

  checkFilters: function () {
    var filters = this.filters
    if (!filters) return
    var i = filters.length
    while (i--) {
      var filter = _.resolveAsset(this.vm.$options, 'filters', filters[i].name)
      if (typeof filter === 'function' || filter.read) {
        this.hasRead = true
      }
      if (filter.write) {
        this.hasWrite = true
      }
    }
  }

}
},{"../../util":62,"./checkbox":27,"./radio":29,"./select":30,"./text":31}],29:[function(require,module,exports){
var _ = require('../../util')

module.exports = {

  bind: function () {
    var self = this
    var el = this.el
    this.listener = function () {
      self.set(el.value)
    }
    _.on(el, 'change', this.listener)
    if (el.checked) {
      this._initValue = el.value
    }
  },

  update: function (value) {
    /* jshint eqeqeq: false */
    this.el.checked = value == this.el.value
  },

  unbind: function () {
    _.off(this.el, 'change', this.listener)
  }

}
},{"../../util":62}],30:[function(require,module,exports){
var _ = require('../../util')
var Watcher = require('../../watcher')
var dirParser = require('../../parsers/directive')

module.exports = {

  bind: function () {
    var self = this
    var el = this.el
    // check options param
    var optionsParam = this._checkParam('options')
    if (optionsParam) {
      initOptions.call(this, optionsParam)
    }
    this.number = this._checkParam('number') != null
    this.multiple = el.hasAttribute('multiple')
    this.listener = function () {
      var value = self.multiple
        ? getMultiValue(el)
        : el.value
      value = self.number
        ? _.isArray(value)
          ? value.map(_.toNumber)
          : _.toNumber(value)
        : value
      self.set(value)
    }
    _.on(el, 'change', this.listener)
    checkInitialValue.call(this)
  },

  update: function (value) {
    /* jshint eqeqeq: false */
    var el = this.el
    el.selectedIndex = -1
    var multi = this.multiple && _.isArray(value)
    var options = el.options
    var i = options.length
    var option
    while (i--) {
      option = options[i]
      option.selected = multi
        ? indexOf(value, option.value) > -1
        : value == option.value
    }
  },

  unbind: function () {
    _.off(this.el, 'change', this.listener)
    if (this.optionWatcher) {
      this.optionWatcher.teardown()
    }
  }

}

/**
 * Initialize the option list from the param.
 *
 * @param {String} expression
 */

function initOptions (expression) {
  var self = this
  var descriptor = dirParser.parse(expression)[0]
  function optionUpdateWatcher (value) {
    if (_.isArray(value)) {
      self.el.innerHTML = ''
      buildOptions(self.el, value)
      if (self._watcher) {
        self.update(self._watcher.value)
      }
    } else {
      _.warn('Invalid options value for v-model: ' + value)
    }
  }
  this.optionWatcher = new Watcher(
    this.vm,
    descriptor.expression,
    optionUpdateWatcher,
    {
      deep: true,
      filters: descriptor.filters
    }
  )
  // update with initial value
  optionUpdateWatcher(this.optionWatcher.value)
}

/**
 * Build up option elements. IE9 doesn't create options
 * when setting innerHTML on <select> elements, so we have
 * to use DOM API here.
 *
 * @param {Element} parent - a <select> or an <optgroup>
 * @param {Array} options
 */

function buildOptions (parent, options) {
  var op, el
  for (var i = 0, l = options.length; i < l; i++) {
    op = options[i]
    if (!op.options) {
      el = document.createElement('option')
      if (typeof op === 'string') {
        el.text = el.value = op
      } else {
        /* jshint eqeqeq: false */
        if (op.value != null) {
          el.value = op.value
        }
        el.text = op.text || op.value || ''
        if (op.disabled) {
          el.disabled = true
        }
      }
    } else {
      el = document.createElement('optgroup')
      el.label = op.label
      buildOptions(el, op.options)
    }
    parent.appendChild(el)
  }
}

/**
 * Check the initial value for selected options.
 */

function checkInitialValue () {
  var initValue
  var options = this.el.options
  for (var i = 0, l = options.length; i < l; i++) {
    if (options[i].hasAttribute('selected')) {
      if (this.multiple) {
        (initValue || (initValue = []))
          .push(options[i].value)
      } else {
        initValue = options[i].value
      }
    }
  }
  if (typeof initValue !== 'undefined') {
    this._initValue = this.number
      ? _.toNumber(initValue)
      : initValue
  }
}

/**
 * Helper to extract a value array for select[multiple]
 *
 * @param {SelectElement} el
 * @return {Array}
 */

function getMultiValue (el) {
  return Array.prototype.filter
    .call(el.options, filterSelected)
    .map(getOptionValue)
}

function filterSelected (op) {
  return op.selected
}

function getOptionValue (op) {
  return op.value || op.text
}

/**
 * Native Array.indexOf uses strict equal, but in this
 * case we need to match string/numbers with soft equal.
 *
 * @param {Array} arr
 * @param {*} val
 */

function indexOf (arr, val) {
  /* jshint eqeqeq: false */
  var i = arr.length
  while (i--) {
    if (arr[i] == val) return i
  }
  return -1
}
},{"../../parsers/directive":51,"../../util":62,"../../watcher":67}],31:[function(require,module,exports){
var _ = require('../../util')

module.exports = {

  bind: function () {
    var self = this
    var el = this.el

    // check params
    // - lazy: update model on "change" instead of "input"
    var lazy = this._checkParam('lazy') != null
    // - number: cast value into number when updating model.
    var number = this._checkParam('number') != null
    // - debounce: debounce the input listener
    var debounce = parseInt(this._checkParam('debounce'), 10)

    // handle composition events.
    //   http://blog.evanyou.me/2014/01/03/composition-event/
    // skip this for Android because it handles composition
    // events quite differently. Android doesn't trigger
    // composition events for language input methods e.g.
    // Chinese, but instead triggers them for spelling
    // suggestions... (see Discussion/#162)
    var composing = false
    if (!_.isAndroid) {
      this.onComposeStart = function () {
        composing = true
      }
      this.onComposeEnd = function () {
        composing = false
        // in IE11 the "compositionend" event fires AFTER
        // the "input" event, so the input handler is blocked
        // at the end... have to call it here.
        self.listener()
      }
      _.on(el,'compositionstart', this.onComposeStart)
      _.on(el,'compositionend', this.onComposeEnd)
    }

    function syncToModel () {
      var val = number
        ? _.toNumber(el.value)
        : el.value
      self.set(val)
    }

    // if the directive has filters, we need to
    // record cursor position and restore it after updating
    // the input with the filtered value.
    // also force update for type="range" inputs to enable
    // "lock in range" (see #506)
    if (this.hasRead || el.type === 'range') {
      this.listener = function () {
        if (composing) return
        var charsOffset
        // some HTML5 input types throw error here
        try {
          // record how many chars from the end of input
          // the cursor was at
          charsOffset = el.value.length - el.selectionStart
        } catch (e) {}
        // Fix IE10/11 infinite update cycle
        // https://github.com/yyx990803/vue/issues/592
        /* istanbul ignore if */
        if (charsOffset < 0) {
          return
        }
        syncToModel()
        _.nextTick(function () {
          // force a value update, because in
          // certain cases the write filters output the
          // same result for different input values, and
          // the Observer set events won't be triggered.
          var newVal = self._watcher.value
          self.update(newVal)
          if (charsOffset != null) {
            var cursorPos =
              _.toString(newVal).length - charsOffset
            el.setSelectionRange(cursorPos, cursorPos)
          }
        })
      }
    } else {
      this.listener = function () {
        if (composing) return
        syncToModel()
      }
    }

    if (debounce) {
      this.listener = _.debounce(this.listener, debounce)
    }

    // Now attach the main listener

    this.event = lazy ? 'change' : 'input'
    // Support jQuery events, since jQuery.trigger() doesn't
    // trigger native events in some cases and some plugins
    // rely on $.trigger()
    // 
    // We want to make sure if a listener is attached using
    // jQuery, it is also removed with jQuery, that's why
    // we do the check for each directive instance and
    // store that check result on itself. This also allows
    // easier test coverage control by unsetting the global
    // jQuery variable in tests.
    this.hasjQuery = typeof jQuery === 'function'
    if (this.hasjQuery) {
      jQuery(el).on(this.event, this.listener)
    } else {
      _.on(el, this.event, this.listener)
    }

    // IE9 doesn't fire input event on backspace/del/cut
    if (!lazy && _.isIE9) {
      this.onCut = function () {
        _.nextTick(self.listener)
      }
      this.onDel = function (e) {
        if (e.keyCode === 46 || e.keyCode === 8) {
          self.listener()
        }
      }
      _.on(el, 'cut', this.onCut)
      _.on(el, 'keyup', this.onDel)
    }

    // set initial value if present
    if (
      el.hasAttribute('value') ||
      (el.tagName === 'TEXTAREA' && el.value.trim())
    ) {
      this._initValue = number
        ? _.toNumber(el.value)
        : el.value
    }
  },

  update: function (value) {
    this.el.value = _.toString(value)
  },

  unbind: function () {
    var el = this.el
    if (this.hasjQuery) {
      jQuery(el).off(this.event, this.listener)
    } else {
      _.off(el, this.event, this.listener)
    }
    if (this.onComposeStart) {
      _.off(el, 'compositionstart', this.onComposeStart)
      _.off(el, 'compositionend', this.onComposeEnd)
    }
    if (this.onCut) {
      _.off(el,'cut', this.onCut)
      _.off(el,'keyup', this.onDel)
    }
  }
}
},{"../../util":62}],32:[function(require,module,exports){
var _ = require('../util')

module.exports = {

  acceptStatement: true,
  priority: 700,

  bind: function () {
    // deal with iframes
    if (
      this.el.tagName === 'IFRAME' &&
      this.arg !== 'load'
    ) {
      var self = this
      this.iframeBind = function () {
        _.on(self.el.contentWindow, self.arg, self.handler)
      }
      _.on(this.el, 'load', this.iframeBind)
    }
  },

  update: function (handler) {
    if (typeof handler !== 'function') {
      _.warn(
        'Directive "v-on:' + this.expression + '" ' +
        'expects a function value.'
      )
      return
    }
    this.reset()
    var vm = this.vm
    this.handler = function (e) {
      e.targetVM = vm
      vm.$event = e
      var res = handler(e)
      vm.$event = null
      return res
    }
    if (this.iframeBind) {
      this.iframeBind()
    } else {
      _.on(this.el, this.arg, this.handler)
    }
  },

  reset: function () {
    var el = this.iframeBind
      ? this.el.contentWindow
      : this.el
    if (this.handler) {
      _.off(el, this.arg, this.handler)
    }
  },

  unbind: function () {
    this.reset()
    _.off(this.el, 'load', this.iframeBind)
  }
}
},{"../util":62}],33:[function(require,module,exports){
var _ = require('../util')
var Watcher = require('../watcher')
var identRE = require('../parsers/path').identRE

module.exports = {

  bind: function () {

    var child = this.vm
    var parent = child.$parent
    var childKey = this.arg
    var parentKey = this.expression

    if (!identRE.test(childKey)) {
      _.warn(
        'Invalid prop key: "' + childKey + '". Prop keys ' +
        'must be valid identifiers.'
      )
    }

    // simple lock to avoid circular updates.
    // without this it would stabilize too, but this makes
    // sure it doesn't cause other watchers to re-evaluate.
    var locked = false
    var lock = function () {
      locked = true
      _.nextTick(unlock)
    }
    var unlock = function () {
      locked = false
    }

    this.parentWatcher = new Watcher(
      parent,
      parentKey,
      function (val) {
        if (!locked) {
          lock()
          // all props have been initialized already
          child[childKey] = val
        }
      }
    )

    // only setup two-way binding if this is not a one-way
    // binding.
    if (!this._descriptor.oneWay) {
      this.childWatcher = new Watcher(
        child,
        childKey,
        function (val) {
          if (!locked) {
            lock()
            parent.$set(parentKey, val)
          }
        }
      )
    }

    // set the child initial value, maybe triggering the
    // child watcher immediately.
    child.$set(childKey, this.parentWatcher.value)

  },

  unbind: function () {
    if (this.parentWatcher) {
      this.parentWatcher.teardown()
    }
    if (this.childWatcher) {
      this.childWatcher.teardown()
    }
  }

}

},{"../parsers/path":53,"../util":62,"../watcher":67}],34:[function(require,module,exports){
var _ = require('../util')

module.exports = {

  isLiteral: true,

  bind: function () {
    var vm = this.el.__vue__
    if (!vm) {
      _.warn(
        'v-ref should only be used on a component root element.'
      )
      return
    }
    // If we get here, it means this is a `v-ref` on a
    // child, because parent scope `v-ref` is stripped in
    // `v-component` already. So we just record our own ref
    // here - it will overwrite parent ref in `v-component`,
    // if any.
    vm._refID = this.expression
  }
  
}
},{"../util":62}],35:[function(require,module,exports){
var _ = require('../util')
var isObject = _.isObject
var isPlainObject = _.isPlainObject
var textParser = require('../parsers/text')
var expParser = require('../parsers/expression')
var templateParser = require('../parsers/template')
var compile = require('../compiler/compile')
var transclude = require('../compiler/transclude')
var uid = 0

// async component resolution states
var UNRESOLVED = 0
var PENDING = 1
var RESOLVED = 2
var ABORTED = 3

module.exports = {

  /**
   * Setup.
   */

  bind: function () {
    // uid as a cache identifier
    this.id = '__v_repeat_' + (++uid)
    // setup anchor nodes
    this.start = _.createAnchor('v-repeat-start')
    this.end = _.createAnchor('v-repeat')
    _.replace(this.el, this.end)
    _.before(this.start, this.end)
    // check if this is a block repeat
    this.template = this.el.tagName === 'TEMPLATE'
      ? templateParser.parse(this.el, true)
      : this.el
    // check other directives that need to be handled
    // at v-repeat level
    this.checkIf()
    this.checkRef()
    this.checkComponent()
    // check for trackby param
    this.idKey =
      this._checkParam('track-by') ||
      this._checkParam('trackby') // 0.11.0 compat
    // check for transition stagger
    var stagger = +this._checkParam('stagger')
    this.enterStagger = +this._checkParam('enter-stagger') || stagger
    this.leaveStagger = +this._checkParam('leave-stagger') || stagger
    this.cache = Object.create(null)
  },

  /**
   * Warn against v-if usage.
   */

  checkIf: function () {
    if (_.attr(this.el, 'if') !== null) {
      _.warn(
        'Don\'t use v-if with v-repeat. ' +
        'Use v-show or the "filterBy" filter instead.'
      )
    }
  },

  /**
   * Check if v-ref/ v-el is also present.
   */

  checkRef: function () {
    var refID = _.attr(this.el, 'ref')
    this.refID = refID
      ? this.vm.$interpolate(refID)
      : null
    var elId = _.attr(this.el, 'el')
    this.elId = elId
      ? this.vm.$interpolate(elId)
      : null
  },

  /**
   * Check the component constructor to use for repeated
   * instances. If static we resolve it now, otherwise it
   * needs to be resolved at build time with actual data.
   */

  checkComponent: function () {
    this.componentState = UNRESOLVED
    var options = this.vm.$options
    var id = _.checkComponent(this.el, options)
    if (!id) {
      // default constructor
      this.Ctor = _.Vue
      // inline repeats should inherit
      this.inherit = true
      // important: transclude with no options, just
      // to ensure block start and block end
      this.template = transclude(this.template)
      var copy = _.extend({}, options)
      copy._asComponent = false
      this._linkFn = compile(this.template, copy)
    } else {
      this.Ctor = null
      this.asComponent = true
      // check inline-template
      if (this._checkParam('inline-template') !== null) {
        // extract inline template as a DocumentFragment
        this.inlineTempalte = _.extractContent(this.el, true)
      }
      var tokens = textParser.parse(id)
      if (tokens) {
        // dynamic component to be resolved later
        var ctorExp = textParser.tokensToExp(tokens)
        this.ctorGetter = expParser.parse(ctorExp).get
      } else {
        // static
        this.componentId = id
        this.pendingData = null
      }
    }
  },

  resolveComponent: function () {
    this.componentState = PENDING
    this.vm._resolveComponent(this.componentId, _.bind(function (Ctor) {
      if (this.componentState === ABORTED) {
        return
      }
      this.Ctor = Ctor
      var merged = _.mergeOptions(Ctor.options, {}, {
        $parent: this.vm
      })
      merged.template = this.inlineTempalte || merged.template
      merged._asComponent = true
      merged._parent = this.vm
      this.template = transclude(this.template, merged)
      // Important: mark the template as a root node so that
      // custom element components don't get compiled twice.
      // fixes #822
      this.template.__vue__ = true
      this._linkFn = compile(this.template, merged)
      this.componentState = RESOLVED
      this.realUpdate(this.pendingData)
      this.pendingData = null
    }, this))
  },

    /**
   * Resolve a dynamic component to use for an instance.
   * The tricky part here is that there could be dynamic
   * components depending on instance data.
   *
   * @param {Object} data
   * @param {Object} meta
   * @return {Function}
   */

  resolveDynamicComponent: function (data, meta) {
    // create a temporary context object and copy data
    // and meta properties onto it.
    // use _.define to avoid accidentally overwriting scope
    // properties.
    var context = Object.create(this.vm)
    var key
    for (key in data) {
      _.define(context, key, data[key])
    }
    for (key in meta) {
      _.define(context, key, meta[key])
    }
    var id = this.ctorGetter.call(context, context)
    var Ctor = _.resolveAsset(this.vm.$options, 'components', id)
    _.assertAsset(Ctor, 'component', id)
    if (!Ctor.options) {
      _.warn(
        'Async resolution is not supported for v-repeat ' +
        '+ dynamic component. (component: ' + id + ')'
      )
      return _.Vue
    }
    return Ctor
  },

  /**
   * Update.
   * This is called whenever the Array mutates. If we have
   * a component, we might need to wait for it to resolve
   * asynchronously.
   *
   * @param {Array|Number|String} data
   */

  update: function (data) {
    if (this.componentId) {
      var state = this.componentState
      if (state === UNRESOLVED) {
        this.pendingData = data
        // once resolved, it will call realUpdate
        this.resolveComponent()
      } else if (state === PENDING) {
        this.pendingData = data
      } else if (state === RESOLVED) {
        this.realUpdate(data)
      }
    } else {
      this.realUpdate(data)
    }
  },

  /**
   * The real update that actually modifies the DOM.
   *
   * @param {Array|Number|String} data
   */

  realUpdate: function (data) {
    this.vms = this.diff(data, this.vms)
    // update v-ref
    if (this.refID) {
      this.vm.$[this.refID] = this.converted
        ? toRefObject(this.vms)
        : this.vms
    }
    if (this.elId) {
      this.vm.$$[this.elId] = this.vms.map(function (vm) {
        return vm.$el
      })
    }
  },

  /**
   * Diff, based on new data and old data, determine the
   * minimum amount of DOM manipulations needed to make the
   * DOM reflect the new data Array.
   *
   * The algorithm diffs the new data Array by storing a
   * hidden reference to an owner vm instance on previously
   * seen data. This allows us to achieve O(n) which is
   * better than a levenshtein distance based algorithm,
   * which is O(m * n).
   *
   * @param {Array} data
   * @param {Array} oldVms
   * @return {Array}
   */

  diff: function (data, oldVms) {
    var idKey = this.idKey
    var converted = this.converted
    var start = this.start
    var end = this.end
    var inDoc = _.inDoc(start)
    var alias = this.arg
    var init = !oldVms
    var vms = new Array(data.length)
    var obj, raw, vm, i, l, primitive
    // First pass, go through the new Array and fill up
    // the new vms array. If a piece of data has a cached
    // instance for it, we reuse it. Otherwise build a new
    // instance.
    for (i = 0, l = data.length; i < l; i++) {
      obj = data[i]
      raw = converted ? obj.$value : obj
      primitive = !isObject(raw)
      vm = !init && this.getVm(raw, i, converted ? obj.$key : null)
      if (vm) { // reusable instance
        vm._reused = true
        vm.$index = i // update $index
        // update data for track-by or object repeat,
        // since in these two cases the data is replaced
        // rather than mutated.
        if (idKey || converted || primitive) {
          if (alias) {
            vm[alias] = raw
          } else if (_.isPlainObject(raw)) {
            vm.$data = raw
          } else {
            vm.$value = raw
          }
        }
      } else { // new instance
        vm = this.build(obj, i, true)
        vm._reused = false
      }
      vms[i] = vm
      // insert if this is first run
      if (init) {
        vm.$before(end)
      }
    }
    // if this is the first run, we're done.
    if (init) {
      return vms
    }
    // Second pass, go through the old vm instances and
    // destroy those who are not reused (and remove them
    // from cache)
    var removalIndex = 0
    var totalRemoved = oldVms.length - vms.length
    for (i = 0, l = oldVms.length; i < l; i++) {
      vm = oldVms[i]
      if (!vm._reused) {
        this.uncacheVm(vm)
        vm.$destroy(false, true) // defer cleanup until removal
        this.remove(vm, removalIndex++, totalRemoved, inDoc)
      }
    }
    // final pass, move/insert new instances into the
    // right place.
    var targetPrev, prevEl, currentPrev
    var insertionIndex = 0
    for (i = 0, l = vms.length; i < l; i++) {
      vm = vms[i]
      // this is the vm that we should be after
      targetPrev = vms[i - 1]
      prevEl = targetPrev
        ? targetPrev._staggerCb
          ? targetPrev._staggerAnchor
          : targetPrev._blockEnd || targetPrev.$el
        : start
      if (vm._reused && !vm._staggerCb) {
        currentPrev = findPrevVm(vm, start)
        if (currentPrev !== targetPrev) {
          this.move(vm, prevEl)
        }
      } else {
        // new instance, or still in stagger.
        // insert with updated stagger index.
        this.insert(vm, insertionIndex++, prevEl, inDoc)
      }
      vm._reused = false
    }
    return vms
  },

  /**
   * Build a new instance and cache it.
   *
   * @param {Object} data
   * @param {Number} index
   * @param {Boolean} needCache
   */

  build: function (data, index, needCache) {
    var meta = { $index: index }
    if (this.converted) {
      meta.$key = data.$key
    }
    var raw = this.converted ? data.$value : data
    var alias = this.arg
    if (alias) {
      data = {}
      data[alias] = raw
    } else if (!isPlainObject(raw)) {
      // non-object values
      data = {}
      meta.$value = raw
    } else {
      // default
      data = raw
    }
    // resolve constructor
    var Ctor = this.Ctor || this.resolveDynamicComponent(data, meta)
    var vm = this.vm.$addChild({
      el: templateParser.clone(this.template),
      _asComponent: this.asComponent,
      _host: this._host,
      _linkFn: this._linkFn,
      _meta: meta,
      data: data,
      inherit: this.inherit,
      template: this.inlineTempalte
    }, Ctor)
    // cache instance
    if (needCache) {
      this.cacheVm(raw, vm, index, this.converted ? meta.$key : null)
    }
    // sync back changes for two-way bindings of primitive values
    var type = typeof raw
    var dir = this
    if (
      this.rawType === 'object' &&
      (type === 'string' || type === 'number')
    ) {
      vm.$watch(alias || '$value', function (val) {
        if (dir.filters) {
          _.warn(
            'You seem to be mutating the $value reference of ' +
            'a v-repeat instance (likely through v-model) ' +
            'and filtering the v-repeat at the same time. ' +
            'This will not work properly with an Array of ' +
            'primitive values. Please use an Array of ' +
            'Objects instead.'
          )
        }
        dir._withLock(function () {
          if (dir.converted) {
            dir.rawValue[vm.$key] = val
          } else {
            dir.rawValue.$set(vm.$index, val)
          }
        })
      })
    }
    return vm
  },

  /**
   * Unbind, teardown everything
   */

  unbind: function () {
    this.componentState = ABORTED
    if (this.refID) {
      this.vm.$[this.refID] = null
    }
    if (this.vms) {
      var i = this.vms.length
      var vm
      while (i--) {
        vm = this.vms[i]
        this.uncacheVm(vm)
        vm.$destroy()
      }
    }
  },

  /**
   * Cache a vm instance based on its data.
   *
   * If the data is an object, we save the vm's reference on
   * the data object as a hidden property. Otherwise we
   * cache them in an object and for each primitive value
   * there is an array in case there are duplicates.
   *
   * @param {Object} data
   * @param {Vue} vm
   * @param {Number} index
   * @param {String} [key]
   */

  cacheVm: function (data, vm, index, key) {
    var idKey = this.idKey
    var cache = this.cache
    var primitive = !isObject(data)
    var id
    if (key || idKey || primitive) {
      id = idKey
        ? idKey === '$index'
          ? index
          : data[idKey]
        : (key || index)
      if (!cache[id]) {
        cache[id] = vm
      } else if (!primitive && idKey !== '$index') {
        _.warn('Duplicate track-by key in v-repeat: ' + id)
      }
    } else {
      id = this.id
      if (data.hasOwnProperty(id)) {
        if (data[id] === null) {
          data[id] = vm
        } else {
          _.warn(
            'Duplicate objects are not supported in v-repeat ' +
            'when using components or transitions.'
          )
        }
      } else {
        _.define(data, id, vm)
      }
    }
    vm._raw = data
  },

  /**
   * Try to get a cached instance from a piece of data.
   *
   * @param {Object} data
   * @param {Number} index
   * @param {String} [key]
   * @return {Vue|undefined}
   */

  getVm: function (data, index, key) {
    var idKey = this.idKey
    var primitive = !isObject(data)
    if (key || idKey || primitive) {
      var id = idKey
        ? idKey === '$index'
          ? index
          : data[idKey]
        : (key || index)
      return this.cache[id]
    } else {
      return data[this.id]
    }
  },

  /**
   * Delete a cached vm instance.
   *
   * @param {Vue} vm
   */

  uncacheVm: function (vm) {
    var data = vm._raw
    var idKey = this.idKey
    var index = vm.$index
    var key = vm.$key
    var primitive = !isObject(data)
    if (idKey || key || primitive) {
      var id = idKey
        ? idKey === '$index'
          ? index
          : data[idKey]
        : (key || index)
      this.cache[id] = null
    } else {
      data[this.id] = null
      vm._raw = null
    }
  },

  /**
   * Pre-process the value before piping it through the
   * filters, and convert non-Array objects to arrays.
   *
   * This function will be bound to this directive instance
   * and passed into the watcher.
   *
   * @param {*} value
   * @return {Array}
   * @private
   */

  _preProcess: function (value) {
    // regardless of type, store the un-filtered raw value.
    this.rawValue = value
    var type = this.rawType = typeof value
    if (!isPlainObject(value)) {
      this.converted = false
      if (type === 'number') {
        value = range(value)
      } else if (type === 'string') {
        value = _.toArray(value)
      }
      return value || []
    } else {
      // convert plain object to array.
      var keys = Object.keys(value)
      var i = keys.length
      var res = new Array(i)
      var key
      while (i--) {
        key = keys[i]
        res[i] = {
          $key: key,
          $value: value[key]
        }
      }
      this.converted = true
      return res
    }
  },

  /**
   * Insert an instance.
   *
   * @param {Vue} vm
   * @param {Number} index
   * @param {Node} prevEl
   * @param {Boolean} inDoc
   */

  insert: function (vm, index, prevEl, inDoc) {
    if (vm._staggerCb) {
      vm._staggerCb.cancel()
      vm._staggerCb = null
    }
    var staggerAmount = this.getStagger(vm, index, null, 'enter')
    if (inDoc && staggerAmount) {
      // create an anchor and insert it synchronously,
      // so that we can resolve the correct order without
      // worrying about some elements not inserted yet
      var anchor = vm._staggerAnchor
      if (!anchor) {
        anchor = vm._staggerAnchor = _.createAnchor('stagger-anchor')
        anchor.__vue__ = vm
      }
      _.after(anchor, prevEl)
      var op = vm._staggerCb = _.cancellable(function () {
        vm._staggerCb = null
        vm.$before(anchor)
        _.remove(anchor)
      })
      setTimeout(op, staggerAmount)
    } else {
      vm.$after(prevEl)
    }
  },

  /**
   * Move an already inserted instance.
   *
   * @param {Vue} vm
   * @param {Node} prevEl
   */

  move: function (vm, prevEl) {
    vm.$after(prevEl, null, false)
  },

  /**
   * Remove an instance.
   *
   * @param {Vue} vm
   * @param {Number} index
   * @param {Boolean} inDoc
   */

  remove: function (vm, index, total, inDoc) {
    if (vm._staggerCb) {
      vm._staggerCb.cancel()
      vm._staggerCb = null
      // it's not possible for the same vm to be removed
      // twice, so if we have a pending stagger callback,
      // it means this vm is queued for enter but removed
      // before its transition started. Since it is already
      // destroyed, we can just leave it in detached state.
      return
    }
    var staggerAmount = this.getStagger(vm, index, total, 'leave')
    if (inDoc && staggerAmount) {
      var op = vm._staggerCb = _.cancellable(function () {
        vm._staggerCb = null
        remove()
      })
      setTimeout(op, staggerAmount)
    } else {
      remove()
    }
    function remove () {
      vm.$remove(function () {
        vm._cleanup()
      })
    }
  },

  /**
   * Get the stagger amount for an insertion/removal.
   *
   * @param {Vue} vm
   * @param {Number} index
   * @param {String} type
   * @param {Number} total
   */

  getStagger: function (vm, index, total, type) {
    type = type + 'Stagger'
    var transition = vm.$el.__v_trans
    var hooks = transition && transition.hooks
    var hook = hooks && (hooks[type] || hooks.stagger)
    return hook
      ? hook.call(vm, index, total)
      : index * this[type]
  }

}

/**
 * Helper to find the previous element that is an instance
 * root node. This is necessary because a destroyed vm's
 * element could still be lingering in the DOM before its
 * leaving transition finishes, but its __vue__ reference
 * should have been removed so we can skip them.
 *
 * @param {Vue} vm
 * @param {Comment|Text} anchor
 * @return {Vue}
 */

function findPrevVm (vm, anchor) {
  var el = vm.$el.previousSibling
  while (!el.__vue__ && el !== anchor) {
    el = el.previousSibling
  }
  return el.__vue__
}

/**
 * Create a range array from given number.
 *
 * @param {Number} n
 * @return {Array}
 */

function range (n) {
  var i = -1
  var ret = new Array(n)
  while (++i < n) {
    ret[i] = i
  }
  return ret
}

/**
 * Convert a vms array to an object ref for v-ref on an
 * Object value.
 *
 * @param {Array} vms
 * @return {Object}
 */

function toRefObject (vms) {
  var ref = {}
  for (var i = 0, l = vms.length; i < l; i++) {
    ref[vms[i].$key] = vms[i]
  }
  return ref
}
},{"../compiler/compile":14,"../compiler/transclude":15,"../parsers/expression":52,"../parsers/template":54,"../parsers/text":55,"../util":62}],36:[function(require,module,exports){
var transition = require('../transition')

module.exports = function (value) {
  var el = this.el
  transition.apply(el, value ? 1 : -1, function () {
    el.style.display = value ? '' : 'none'
  }, this.vm)
}
},{"../transition":56}],37:[function(require,module,exports){
var _ = require('../util')
var prefixes = ['-webkit-', '-moz-', '-ms-']
var camelPrefixes = ['Webkit', 'Moz', 'ms']
var importantRE = /!important;?$/
var camelRE = /([a-z])([A-Z])/g
var testEl = null
var propCache = {}

module.exports = {

  deep: true,

  update: function (value) {
    if (this.arg) {
      this.setProp(this.arg, value)
    } else {
      if (typeof value === 'object') {
        // cache object styles so that only changed props
        // are actually updated.
        if (!this.cache) this.cache = {}
        for (var prop in value) {
          this.setProp(prop, value[prop])
          /* jshint eqeqeq: false */
          if (value[prop] != this.cache[prop]) {
            this.cache[prop] = value[prop]
            this.setProp(prop, value[prop])
          }
        }
      } else {
        this.el.style.cssText = value
      }
    }
  },

  setProp: function (prop, value) {
    prop = normalize(prop)
    if (!prop) return // unsupported prop
    // cast possible numbers/booleans into strings
    if (value != null) value += ''
    if (value) {
      var isImportant = importantRE.test(value)
        ? 'important'
        : ''
      if (isImportant) {
        value = value.replace(importantRE, '').trim()
      }
      this.el.style.setProperty(prop, value, isImportant)
    } else {
      this.el.style.removeProperty(prop)
    }
  }

}

/**
 * Normalize a CSS property name.
 * - cache result
 * - auto prefix
 * - camelCase -> dash-case
 *
 * @param {String} prop
 * @return {String}
 */

function normalize (prop) {
  if (propCache[prop]) {
    return propCache[prop]
  }
  var res = prefix(prop)
  propCache[prop] = propCache[res] = res
  return res
}

/**
 * Auto detect the appropriate prefix for a CSS property.
 * https://gist.github.com/paulirish/523692
 *
 * @param {String} prop
 * @return {String}
 */

function prefix (prop) {
  prop = prop.replace(camelRE, '$1-$2').toLowerCase()
  var camel = _.camelize(prop)
  var upper = camel.charAt(0).toUpperCase() + camel.slice(1)
  if (!testEl) {
    testEl = document.createElement('div')
  }
  if (camel in testEl.style) {
    return prop
  }
  var i = prefixes.length
  var prefixed
  while (i--) {
    prefixed = camelPrefixes[i] + upper
    if (prefixed in testEl.style) {
      return prefixes[i] + prop
    }
  }
}
},{"../util":62}],38:[function(require,module,exports){
var _ = require('../util')

module.exports = {

  bind: function () {
    this.attr = this.el.nodeType === 3
      ? 'nodeValue'
      : 'textContent'
  },

  update: function (value) {
    this.el[this.attr] = _.toString(value)
  }
  
}
},{"../util":62}],39:[function(require,module,exports){
var _ = require('../util')
var Transition = require('../transition/transition')

module.exports = {

  priority: 1000,
  isLiteral: true,

  bind: function () {
    if (!this._isDynamicLiteral) {
      this.update(this.expression)
    }
  },

  update: function (id, oldId) {
    var el = this.el
    var vm = this.el.__vue__ || this.vm
    var hooks = _.resolveAsset(vm.$options, 'transitions', id)
    id = id || 'v'
    el.__v_trans = new Transition(el, id, hooks, vm)
    if (oldId) {
      _.removeClass(el, oldId + '-transition')
    }
    _.addClass(el, id + '-transition')
  }

}
},{"../transition/transition":58,"../util":62}],40:[function(require,module,exports){
var _ = require('../util')
var Path = require('../parsers/path')

/**
 * Filter filter for v-repeat
 *
 * @param {String} searchKey
 * @param {String} [delimiter]
 * @param {String} dataKey
 */

exports.filterBy = function (arr, search, delimiter, dataKey) {
  // allow optional `in` delimiter
  // because why not
  if (delimiter && delimiter !== 'in') {
    dataKey = delimiter
  }
  if (!search) {
    return arr
  }
  // cast to lowercase string
  search = ('' + search).toLowerCase()
  return arr.filter(function (item) {
    return dataKey
      ? contains(Path.get(item, dataKey), search)
      : contains(item, search)
  })
}

/**
 * Filter filter for v-repeat
 *
 * @param {String} sortKey
 * @param {String} reverse
 */

exports.orderBy = function (arr, sortKey, reverse) {
  if (!sortKey) {
    return arr
  }
  var order = 1
  if (arguments.length > 2) {
    if (reverse === '-1') {
      order = -1
    } else {
      order = reverse ? -1 : 1
    }
  }
  // sort on a copy to avoid mutating original array
  return arr.slice().sort(function (a, b) {
    if (sortKey !== '$key' && sortKey !== '$value') {
      if (a && '$value' in a) a = a.$value
      if (b && '$value' in b) b = b.$value
    }
    a = _.isObject(a) ? Path.get(a, sortKey) : a
    b = _.isObject(b) ? Path.get(b, sortKey) : b
    return a === b ? 0 : a > b ? order : -order
  })
}

/**
 * String contain helper
 *
 * @param {*} val
 * @param {String} search
 */

function contains (val, search) {
  if (_.isPlainObject(val)) {
    for (var key in val) {
      if (contains(val[key], search)) {
        return true
      }
    }
  } else if (_.isArray(val)) {
    var i = val.length
    while (i--) {
      if (contains(val[i], search)) {
        return true
      }
    }
  } else if (val != null) {
    return val.toString().toLowerCase().indexOf(search) > -1
  }
}
},{"../parsers/path":53,"../util":62}],41:[function(require,module,exports){
var _ = require('../util')

/**
 * Stringify value.
 *
 * @param {Number} indent
 */

exports.json = {
  read: function (value, indent) {
    return typeof value === 'string'
      ? value
      : JSON.stringify(value, null, Number(indent) || 2)
  },
  write: function (value) {
    try {
      return JSON.parse(value)
    } catch (e) {
      return value
    }
  }
}

/**
 * 'abc' => 'Abc'
 */

exports.capitalize = function (value) {
  if (!value && value !== 0) return ''
  value = value.toString()
  return value.charAt(0).toUpperCase() + value.slice(1)
}

/**
 * 'abc' => 'ABC'
 */

exports.uppercase = function (value) {
  return (value || value === 0)
    ? value.toString().toUpperCase()
    : ''
}

/**
 * 'AbC' => 'abc'
 */

exports.lowercase = function (value) {
  return (value || value === 0)
    ? value.toString().toLowerCase()
    : ''
}

/**
 * 12345 => $12,345.00
 *
 * @param {String} sign
 */

var digitsRE = /(\d{3})(?=\d)/g

exports.currency = function (value, sign) {
  value = parseFloat(value)
  if (!isFinite(value) || (!value && value !== 0)) return ''
  sign = sign || '$'
  var s = Math.floor(Math.abs(value)).toString(),
    i = s.length % 3,
    h = i > 0
      ? (s.slice(0, i) + (s.length > 3 ? ',' : ''))
      : '',
    v = Math.abs(parseInt((value * 100) % 100, 10)),
    f = '.' + (v < 10 ? ('0' + v) : v)
  return (value < 0 ? '-' : '') +
    sign + h + s.slice(i).replace(digitsRE, '$1,') + f
}

/**
 * 'item' => 'items'
 *
 * @params
 *  an array of strings corresponding to
 *  the single, double, triple ... forms of the word to
 *  be pluralized. When the number to be pluralized
 *  exceeds the length of the args, it will use the last
 *  entry in the array.
 *
 *  e.g. ['single', 'double', 'triple', 'multiple']
 */

exports.pluralize = function (value) {
  var args = _.toArray(arguments, 1)
  return args.length > 1
    ? (args[value % 10 - 1] || args[args.length - 1])
    : (args[0] + (value === 1 ? '' : 's'))
}

/**
 * A special filter that takes a handler function,
 * wraps it so it only gets triggered on specific
 * keypresses. v-on only.
 *
 * @param {String} key
 */

var keyCodes = {
  enter    : 13,
  tab      : 9,
  'delete' : 46,
  up       : 38,
  left     : 37,
  right    : 39,
  down     : 40,
  esc      : 27
}

exports.key = function (handler, key) {
  if (!handler) return
  var code = keyCodes[key]
  if (!code) {
    code = parseInt(key, 10)
  }
  return function (e) {
    if (e.keyCode === code) {
      return handler.call(this, e)
    }
  }
}

// expose keycode hash
exports.key.keyCodes = keyCodes

/**
 * Install special array filters
 */

_.extend(exports, require('./array-filters'))

},{"../util":62,"./array-filters":40}],42:[function(require,module,exports){
var _ = require('../util')
var Directive = require('../directive')
var compile = require('../compiler/compile')
var transclude = require('../compiler/transclude')

/**
 * Transclude, compile and link element.
 *
 * If a pre-compiled linker is available, that means the
 * passed in element will be pre-transcluded and compiled
 * as well - all we need to do is to call the linker.
 *
 * Otherwise we need to call transclude/compile/link here.
 *
 * @param {Element} el
 * @return {Element}
 */

exports._compile = function (el) {
  var options = this.$options
  if (options._linkFn) {
    // pre-transcluded with linker, just use it
    this._initElement(el)
    this._unlinkFn = options._linkFn(this, el)
  } else {
    // transclude and init element
    // transclude can potentially replace original
    // so we need to keep reference
    var original = el
    el = transclude(el, options)
    this._initElement(el)
    // compile and link the rest
    this._unlinkFn = compile(el, options)(this, el)
    // finally replace original
    if (options.replace) {
      _.replace(original, el)
    }
  }
  return el
}

/**
 * Initialize instance element. Called in the public
 * $mount() method.
 *
 * @param {Element} el
 */

exports._initElement = function (el) {
  if (el instanceof DocumentFragment) {
    this._isBlock = true
    this.$el = this._blockStart = el.firstChild
    this._blockEnd = el.lastChild
    // set persisted text anchors to empty
    if (this._blockStart.nodeType === 3) {
      this._blockStart.data = this._blockEnd.data = ''
    }
    this._blockFragment = el
  } else {
    this.$el = el
  }
  this.$el.__vue__ = this
  this._callHook('beforeCompile')
}

/**
 * Create and bind a directive to an element.
 *
 * @param {String} name - directive name
 * @param {Node} node   - target node
 * @param {Object} desc - parsed directive descriptor
 * @param {Object} def  - directive definition object
 * @param {Vue|undefined} host - transclusion host component
 */

exports._bindDir = function (name, node, desc, def, host) {
  this._directives.push(
    new Directive(name, node, this, desc, def, host)
  )
}

/**
 * Teardown an instance, unobserves the data, unbind all the
 * directives, turn off all the event listeners, etc.
 *
 * @param {Boolean} remove - whether to remove the DOM node.
 * @param {Boolean} deferCleanup - if true, defer cleanup to
 *                                 be called later
 */

exports._destroy = function (remove, deferCleanup) {
  if (this._isBeingDestroyed) {
    return
  }
  this._callHook('beforeDestroy')
  this._isBeingDestroyed = true
  var i
  // remove self from parent. only necessary
  // if parent is not being destroyed as well.
  var parent = this.$parent
  if (parent && !parent._isBeingDestroyed) {
    parent._children.$remove(this)
  }
  // same for transclusion host.
  var host = this._host
  if (host && !host._isBeingDestroyed) {
    host._transCpnts.$remove(this)
  }
  // destroy all children.
  i = this._children.length
  while (i--) {
    this._children[i].$destroy()
  }
  // teardown all directives. this also tearsdown all
  // directive-owned watchers.
  if (this._unlinkFn) {
    // passing destroying: true to avoid searching and
    // splicing the directives
    this._unlinkFn(true)
  }
  i = this._watchers.length
  while (i--) {
    this._watchers[i].teardown()
  }
  // remove reference to self on $el
  if (this.$el) {
    this.$el.__vue__ = null
  }
  // remove DOM element
  var self = this
  if (remove && this.$el) {
    this.$remove(function () {
      self._cleanup()
    })
  } else if (!deferCleanup) {
    this._cleanup()
  }
}

/**
 * Clean up to ensure garbage collection.
 * This is called after the leave transition if there
 * is any.
 */

exports._cleanup = function () {
  // remove reference from data ob
  this._data.__ob__.removeVm(this)
  this._data =
  this._watchers =
  this.$el =
  this.$parent =
  this.$root =
  this._children =
  this._transCpnts =
  this._directives = null
  // call the last hook...
  this._isDestroyed = true
  this._callHook('destroyed')
  // turn off all instance listeners.
  this.$off()
}
},{"../compiler/compile":14,"../compiler/transclude":15,"../directive":17,"../util":62}],43:[function(require,module,exports){
var _ = require('../util')
var inDoc = _.inDoc

/**
 * Setup the instance's option events & watchers.
 * If the value is a string, we pull it from the
 * instance's methods by name.
 */

exports._initEvents = function () {
  var options = this.$options
  registerCallbacks(this, '$on', options.events)
  registerCallbacks(this, '$watch', options.watch)
}

/**
 * Register callbacks for option events and watchers.
 *
 * @param {Vue} vm
 * @param {String} action
 * @param {Object} hash
 */

function registerCallbacks (vm, action, hash) {
  if (!hash) return
  var handlers, key, i, j
  for (key in hash) {
    handlers = hash[key]
    if (_.isArray(handlers)) {
      for (i = 0, j = handlers.length; i < j; i++) {
        register(vm, action, key, handlers[i])
      }
    } else {
      register(vm, action, key, handlers)
    }
  }
}

/**
 * Helper to register an event/watch callback.
 *
 * @param {Vue} vm
 * @param {String} action
 * @param {String} key
 * @param {*} handler
 */

function register (vm, action, key, handler) {
  var type = typeof handler
  if (type === 'function') {
    vm[action](key, handler)
  } else if (type === 'string') {
    var methods = vm.$options.methods
    var method = methods && methods[handler]
    if (method) {
      vm[action](key, method)
    } else {
      _.warn(
        'Unknown method: "' + handler + '" when ' +
        'registering callback for ' + action +
        ': "' + key + '".'
      )
    }
  }
}

/**
 * Setup recursive attached/detached calls
 */

exports._initDOMHooks = function () {
  this.$on('hook:attached', onAttached)
  this.$on('hook:detached', onDetached)
}

/**
 * Callback to recursively call attached hook on children
 */

function onAttached () {
  this._isAttached = true
  this._children.forEach(callAttach)
  if (this._transCpnts.length) {
    this._transCpnts.forEach(callAttach)
  }
}

/**
 * Iterator to call attached hook
 * 
 * @param {Vue} child
 */

function callAttach (child) {
  if (!child._isAttached && inDoc(child.$el)) {
    child._callHook('attached')
  }
}

/**
 * Callback to recursively call detached hook on children
 */

function onDetached () {
  this._isAttached = false
  this._children.forEach(callDetach)
  if (this._transCpnts.length) {
    this._transCpnts.forEach(callDetach)
  }
}

/**
 * Iterator to call detached hook
 * 
 * @param {Vue} child
 */

function callDetach (child) {
  if (child._isAttached && !inDoc(child.$el)) {
    child._callHook('detached')
  }
}

/**
 * Trigger all handlers for a hook
 *
 * @param {String} hook
 */

exports._callHook = function (hook) {
  var handlers = this.$options[hook]
  if (handlers) {
    for (var i = 0, j = handlers.length; i < j; i++) {
      handlers[i].call(this)
    }
  }
  this.$emit('hook:' + hook)
}
},{"../util":62}],44:[function(require,module,exports){
var mergeOptions = require('../util').mergeOptions

/**
 * The main init sequence. This is called for every
 * instance, including ones that are created from extended
 * constructors.
 *
 * @param {Object} options - this options object should be
 *                           the result of merging class
 *                           options and the options passed
 *                           in to the constructor.
 */

exports._init = function (options) {

  options = options || {}

  this.$el           = null
  this.$parent       = options._parent
  this.$root         = options._root || this
  this.$             = {} // child vm references
  this.$$            = {} // element references
  this._watchers     = [] // all watchers as an array
  this._directives   = [] // all directives

  // a flag to avoid this being observed
  this._isVue = true

  // events bookkeeping
  this._events         = {}    // registered callbacks
  this._eventsCount    = {}    // for $broadcast optimization
  this._eventCancelled = false // for event cancellation

  // block instance properties
  this._isBlock     = false
  this._blockStart  =          // @type {CommentNode}
  this._blockEnd    = null     // @type {CommentNode}

  // lifecycle state
  this._isCompiled  =
  this._isDestroyed =
  this._isReady     =
  this._isAttached  =
  this._isBeingDestroyed = false
  this._unlinkFn    = null

  // children
  this._children = []
  this._childCtors = {}

  // transcluded components that belong to the parent.
  // need to keep track of them so that we can call
  // attached/detached hooks on them.
  this._transCpnts = []
  this._host = options._host

  // push self into parent / transclusion host
  if (this.$parent) {
    this.$parent._children.push(this)
  }
  if (this._host) {
    this._host._transCpnts.push(this)
  }

  // props used in v-repeat diffing
  this._reused = false
  this._staggerOp = null

  // merge options.
  options = this.$options = mergeOptions(
    this.constructor.options,
    options,
    this
  )

  // set data after merge.
  this._data = options.data || {}

  // initialize data observation and scope inheritance.
  this._initScope()

  // setup event system and option events.
  this._initEvents()

  // call created hook
  this._callHook('created')

  // if `el` option is passed, start compilation.
  if (options.el) {
    this.$mount(options.el)
  }
}
},{"../util":62}],45:[function(require,module,exports){
var _ = require('../util')

/**
 * Apply a list of filter (descriptors) to a value.
 * Using plain for loops here because this will be called in
 * the getter of any watcher with filters so it is very
 * performance sensitive.
 *
 * @param {*} value
 * @param {*} [oldValue]
 * @param {Array} filters
 * @param {Boolean} write
 * @return {*}
 */

exports._applyFilters = function (value, oldValue, filters, write) {
  var filter, fn, args, arg, offset, i, l, j, k
  for (i = 0, l = filters.length; i < l; i++) {
    filter = filters[i]
    fn = _.resolveAsset(this.$options, 'filters', filter.name)
    _.assertAsset(fn, 'filter', filter.name)
    if (!fn) continue
    fn = write ? fn.write : (fn.read || fn)
    if (typeof fn !== 'function') continue
    args = write ? [value, oldValue] : [value]
    offset = write ? 2 : 1
    if (filter.args) {
      for (j = 0, k = filter.args.length; j < k; j++) {
        arg = filter.args[j]
        args[j + offset] = arg.dynamic
          ? this.$get(arg.value)
          : arg.value
      }
    }
    value = fn.apply(this, args)
  }
  return value
}

/**
 * Resolve a component, depending on whether the component
 * is defined normally or using an async factory function.
 * Resolves synchronously if already resolved, otherwise
 * resolves asynchronously and caches the resolved
 * constructor on the factory.
 *
 * @param {String} id
 * @param {Function} cb
 */

exports._resolveComponent = function (id, cb) {
  var factory = _.resolveAsset(this.$options, 'components', id)
  _.assertAsset(factory, 'component', id)
  // async component factory
  if (!factory.options) {
    if (factory.resolved) {
      // cached
      cb(factory.resolved)
    } else if (factory.requested) {
      // pool callbacks
      factory.pendingCallbacks.push(cb)
    } else {
      factory.requested = true
      var cbs = factory.pendingCallbacks = [cb]
      factory(function resolve (res) {
        if (_.isPlainObject(res)) {
          res = _.Vue.extend(res)
        }
        // cache resolved
        factory.resolved = res
        // invoke callbacks
        for (var i = 0, l = cbs.length; i < l; i++) {
          cbs[i](res)
        }
      }, function reject (reason) {
        _.warn(
          'Failed to resolve async component: ' + id + '. ' +
          (reason ? '\nReason: ' + reason : '')
        )
      })
    }
  } else {
    // normal component
    cb(factory)
  }
}
},{"../util":62}],46:[function(require,module,exports){
var _ = require('../util')
var Observer = require('../observer')
var Dep = require('../observer/dep')

/**
 * Setup the scope of an instance, which contains:
 * - observed data
 * - computed properties
 * - user methods
 * - meta properties
 */

exports._initScope = function () {
  this._initData()
  this._initComputed()
  this._initMethods()
  this._initMeta()
}

/**
 * Initialize the data.
 */

exports._initData = function () {
  // proxy data on instance
  var data = this._data
  var i, key
  // make sure all props properties are observed
  var props = this.$options.props
  if (props) {
    i = props.length
    while (i--) {
      key = _.camelize(props[i])
      if (!(key in data)) {
        data[key] = undefined
      }
    }
  }
  var keys = Object.keys(data)
  i = keys.length
  while (i--) {
    key = keys[i]
    if (!_.isReserved(key)) {
      this._proxy(key)
    }
  }
  // observe data
  Observer.create(data).addVm(this)
}

/**
 * Swap the isntance's $data. Called in $data's setter.
 *
 * @param {Object} newData
 */

exports._setData = function (newData) {
  newData = newData || {}
  var oldData = this._data
  this._data = newData
  var keys, key, i
  // copy props
  var props = this.$options.props
  if (props) {
    i = props.length
    while (i--) {
      key = props[i]
      newData.$set(key, oldData[key])
    }
  }
  // unproxy keys not present in new data
  keys = Object.keys(oldData)
  i = keys.length
  while (i--) {
    key = keys[i]
    if (!_.isReserved(key) && !(key in newData)) {
      this._unproxy(key)
    }
  }
  // proxy keys not already proxied,
  // and trigger change for changed values
  keys = Object.keys(newData)
  i = keys.length
  while (i--) {
    key = keys[i]
    if (!this.hasOwnProperty(key) && !_.isReserved(key)) {
      // new property
      this._proxy(key)
    }
  }
  oldData.__ob__.removeVm(this)
  Observer.create(newData).addVm(this)
  this._digest()
}

/**
 * Proxy a property, so that
 * vm.prop === vm._data.prop
 *
 * @param {String} key
 */

exports._proxy = function (key) {
  // need to store ref to self here
  // because these getter/setters might
  // be called by child instances!
  var self = this
  Object.defineProperty(self, key, {
    configurable: true,
    enumerable: true,
    get: function proxyGetter () {
      return self._data[key]
    },
    set: function proxySetter (val) {
      self._data[key] = val
    }
  })
}

/**
 * Unproxy a property.
 *
 * @param {String} key
 */

exports._unproxy = function (key) {
  delete this[key]
}

/**
 * Force update on every watcher in scope.
 */

exports._digest = function () {
  var i = this._watchers.length
  while (i--) {
    this._watchers[i].update()
  }
  var children = this._children
  i = children.length
  while (i--) {
    var child = children[i]
    if (child.$options.inherit) {
      child._digest()
    }
  }
}

/**
 * Setup computed properties. They are essentially
 * special getter/setters
 */

function noop () {}
exports._initComputed = function () {
  var computed = this.$options.computed
  if (computed) {
    for (var key in computed) {
      var userDef = computed[key]
      var def = {
        enumerable: true,
        configurable: true
      }
      if (typeof userDef === 'function') {
        def.get = _.bind(userDef, this)
        def.set = noop
      } else {
        def.get = userDef.get
          ? _.bind(userDef.get, this)
          : noop
        def.set = userDef.set
          ? _.bind(userDef.set, this)
          : noop
      }
      Object.defineProperty(this, key, def)
    }
  }
}

/**
 * Setup instance methods. Methods must be bound to the
 * instance since they might be called by children
 * inheriting them.
 */

exports._initMethods = function () {
  var methods = this.$options.methods
  if (methods) {
    for (var key in methods) {
      this[key] = _.bind(methods[key], this)
    }
  }
}

/**
 * Initialize meta information like $index, $key & $value.
 */

exports._initMeta = function () {
  var metas = this.$options._meta
  if (metas) {
    for (var key in metas) {
      this._defineMeta(key, metas[key])
    }
  }
}

/**
 * Define a meta property, e.g $index, $key, $value
 * which only exists on the vm instance but not in $data.
 *
 * @param {String} key
 * @param {*} value
 */

exports._defineMeta = function (key, value) {
  var dep = new Dep()
  Object.defineProperty(this, key, {
    enumerable: true,
    configurable: true,
    get: function metaGetter () {
      if (Observer.target) {
        Observer.target.addDep(dep)
      }
      return value
    },
    set: function metaSetter (val) {
      if (val !== value) {
        value = val
        dep.notify()
      }
    }
  })
}

},{"../observer":49,"../observer/dep":48,"../util":62}],47:[function(require,module,exports){
var _ = require('../util')
var arrayProto = Array.prototype
var arrayMethods = Object.create(arrayProto)

/**
 * Intercept mutating methods and emit events
 */

;[
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]
.forEach(function (method) {
  // cache original method
  var original = arrayProto[method]
  _.define(arrayMethods, method, function mutator () {
    // avoid leaking arguments:
    // http://jsperf.com/closure-with-arguments
    var i = arguments.length
    var args = new Array(i)
    while (i--) {
      args[i] = arguments[i]
    }
    var result = original.apply(this, args)
    var ob = this.__ob__
    var inserted
    switch (method) {
      case 'push':
        inserted = args
        break
      case 'unshift':
        inserted = args
        break
      case 'splice':
        inserted = args.slice(2)
        break
    }
    if (inserted) ob.observeArray(inserted)
    // notify change
    ob.notify()
    return result
  })
})

/**
 * Swap the element at the given index with a new value
 * and emits corresponding event.
 *
 * @param {Number} index
 * @param {*} val
 * @return {*} - replaced element
 */

_.define(
  arrayProto,
  '$set',
  function $set (index, val) {
    if (index >= this.length) {
      this.length = index + 1
    }
    return this.splice(index, 1, val)[0]
  }
)

/**
 * Convenience method to remove the element at given index.
 *
 * @param {Number} index
 * @param {*} val
 */

_.define(
  arrayProto,
  '$remove',
  function $remove (index) {
    /* istanbul ignore if */
    if (!this.length) return
    if (typeof index !== 'number') {
      index = _.indexOf(this, index)
    }
    if (index > -1) {
      this.splice(index, 1)
    }
  }
)

module.exports = arrayMethods
},{"../util":62}],48:[function(require,module,exports){
var _ = require('../util')

/**
 * A dep is an observable that can have multiple
 * directives subscribing to it.
 *
 * @constructor
 */

function Dep () {
  this.subs = []
}

var p = Dep.prototype

/**
 * Add a directive subscriber.
 *
 * @param {Directive} sub
 */

p.addSub = function (sub) {
  this.subs.push(sub)
}

/**
 * Remove a directive subscriber.
 *
 * @param {Directive} sub
 */

p.removeSub = function (sub) {
  this.subs.$remove(sub)
}

/**
 * Notify all subscribers of a new value.
 */

p.notify = function () {
  // stablize the subscriber list first
  var subs = _.toArray(this.subs)
  for (var i = 0, l = subs.length; i < l; i++) {
    subs[i].update()
  }
}

module.exports = Dep
},{"../util":62}],49:[function(require,module,exports){
var _ = require('../util')
var config = require('../config')
var Dep = require('./dep')
var arrayMethods = require('./array')
var arrayKeys = Object.getOwnPropertyNames(arrayMethods)
require('./object')

var uid = 0

/**
 * Type enums
 */

var ARRAY  = 0
var OBJECT = 1

/**
 * Augment an target Object or Array by intercepting
 * the prototype chain using __proto__
 *
 * @param {Object|Array} target
 * @param {Object} proto
 */

function protoAugment (target, src) {
  target.__proto__ = src
}

/**
 * Augment an target Object or Array by defining
 * hidden properties.
 *
 * @param {Object|Array} target
 * @param {Object} proto
 */

function copyAugment (target, src, keys) {
  var i = keys.length
  var key
  while (i--) {
    key = keys[i]
    _.define(target, key, src[key])
  }
}

/**
 * Observer class that are attached to each observed
 * object. Once attached, the observer converts target
 * object's property keys into getter/setters that
 * collect dependencies and dispatches updates.
 *
 * @param {Array|Object} value
 * @param {Number} type
 * @constructor
 */

function Observer (value, type) {
  this.id = ++uid
  this.value = value
  this.active = true
  this.deps = []
  _.define(value, '__ob__', this)
  if (type === ARRAY) {
    var augment = config.proto && _.hasProto
      ? protoAugment
      : copyAugment
    augment(value, arrayMethods, arrayKeys)
    this.observeArray(value)
  } else if (type === OBJECT) {
    this.walk(value)
  }
}

Observer.target = null

var p = Observer.prototype

/**
 * Attempt to create an observer instance for a value,
 * returns the new observer if successfully observed,
 * or the existing observer if the value already has one.
 *
 * @param {*} value
 * @return {Observer|undefined}
 * @static
 */

Observer.create = function (value) {
  if (
    value &&
    value.hasOwnProperty('__ob__') &&
    value.__ob__ instanceof Observer
  ) {
    return value.__ob__
  } else if (_.isArray(value)) {
    return new Observer(value, ARRAY)
  } else if (
    _.isPlainObject(value) &&
    !value._isVue // avoid Vue instance
  ) {
    return new Observer(value, OBJECT)
  }
}

/**
 * Walk through each property and convert them into
 * getter/setters. This method should only be called when
 * value type is Object. Properties prefixed with `$` or `_`
 * and accessor properties are ignored.
 *
 * @param {Object} obj
 */

p.walk = function (obj) {
  var keys = Object.keys(obj)
  var i = keys.length
  var key, prefix
  while (i--) {
    key = keys[i]
    prefix = key.charCodeAt(0)
    if (prefix !== 0x24 && prefix !== 0x5F) { // skip $ or _
      this.convert(key, obj[key])
    }
  }
}

/**
 * Try to carete an observer for a child value,
 * and if value is array, link dep to the array.
 *
 * @param {*} val
 * @return {Dep|undefined}
 */

p.observe = function (val) {
  return Observer.create(val)
}

/**
 * Observe a list of Array items.
 *
 * @param {Array} items
 */

p.observeArray = function (items) {
  var i = items.length
  while (i--) {
    this.observe(items[i])
  }
}

/**
 * Convert a property into getter/setter so we can emit
 * the events when the property is accessed/changed.
 *
 * @param {String} key
 * @param {*} val
 */

p.convert = function (key, val) {
  var ob = this
  var childOb = ob.observe(val)
  var dep = new Dep()
  if (childOb) {
    childOb.deps.push(dep)
  }
  Object.defineProperty(ob.value, key, {
    enumerable: true,
    configurable: true,
    get: function () {
      // Observer.target is a watcher whose getter is
      // currently being evaluated.
      if (ob.active && Observer.target) {
        Observer.target.addDep(dep)
      }
      return val
    },
    set: function (newVal) {
      if (newVal === val) return
      // remove dep from old value
      var oldChildOb = val && val.__ob__
      if (oldChildOb) {
        oldChildOb.deps.$remove(dep)
      }
      val = newVal
      // add dep to new value
      var newChildOb = ob.observe(newVal)
      if (newChildOb) {
        newChildOb.deps.push(dep)
      }
      dep.notify()
    }
  })
}

/**
 * Notify change on all self deps on an observer.
 * This is called when a mutable value mutates. e.g.
 * when an Array's mutating methods are called, or an
 * Object's $add/$delete are called.
 */

p.notify = function () {
  var deps = this.deps
  for (var i = 0, l = deps.length; i < l; i++) {
    deps[i].notify()
  }
}

/**
 * Add an owner vm, so that when $add/$delete mutations
 * happen we can notify owner vms to proxy the keys and
 * digest the watchers. This is only called when the object
 * is observed as an instance's root $data.
 *
 * @param {Vue} vm
 */

p.addVm = function (vm) {
  (this.vms = this.vms || []).push(vm)
}

/**
 * Remove an owner vm. This is called when the object is
 * swapped out as an instance's $data object.
 *
 * @param {Vue} vm
 */

p.removeVm = function (vm) {
  this.vms.$remove(vm)
}

module.exports = Observer

},{"../config":16,"../util":62,"./array":47,"./dep":48,"./object":50}],50:[function(require,module,exports){
var _ = require('../util')
var objProto = Object.prototype

/**
 * Add a new property to an observed object
 * and emits corresponding event
 *
 * @param {String} key
 * @param {*} val
 * @public
 */

_.define(
  objProto,
  '$add',
  function $add (key, val) {
    if (this.hasOwnProperty(key)) return
    var ob = this.__ob__
    if (!ob || _.isReserved(key)) {
      this[key] = val
      return
    }
    ob.convert(key, val)
    ob.notify()
    if (ob.vms) {
      var i = ob.vms.length
      while (i--) {
        var vm = ob.vms[i]
        vm._proxy(key)
        vm._digest()
      }
    }
  }
)

/**
 * Set a property on an observed object, calling add to
 * ensure the property is observed.
 *
 * @param {String} key
 * @param {*} val
 * @public
 */

_.define(
  objProto,
  '$set',
  function $set (key, val) {
    this.$add(key, val)
    this[key] = val
  }
)

/**
 * Deletes a property from an observed object
 * and emits corresponding event
 *
 * @param {String} key
 * @public
 */

_.define(
  objProto,
  '$delete',
  function $delete (key) {
    if (!this.hasOwnProperty(key)) return
    delete this[key]
    var ob = this.__ob__
    if (!ob || _.isReserved(key)) {
      return
    }
    ob.notify()
    if (ob.vms) {
      var i = ob.vms.length
      while (i--) {
        var vm = ob.vms[i]
        vm._unproxy(key)
        vm._digest()
      }
    }
  }
)
},{"../util":62}],51:[function(require,module,exports){
var _ = require('../util')
var Cache = require('../cache')
var cache = new Cache(1000)
var argRE = /^[^\{\?]+$|^'[^']*'$|^"[^"]*"$/
var filterTokenRE = /[^\s'"]+|'[^']+'|"[^"]+"/g
var reservedArgRE = /^in$|^-?\d+/

/**
 * Parser state
 */

var str
var c, i, l
var inSingle
var inDouble
var curly
var square
var paren
var begin
var argIndex
var dirs
var dir
var lastFilterIndex
var arg

/**
 * Push a directive object into the result Array
 */

function pushDir () {
  dir.raw = str.slice(begin, i).trim()
  if (dir.expression === undefined) {
    dir.expression = str.slice(argIndex, i).trim()
  } else if (lastFilterIndex !== begin) {
    pushFilter()
  }
  if (i === 0 || dir.expression) {
    dirs.push(dir)
  }
}

/**
 * Push a filter to the current directive object
 */

function pushFilter () {
  var exp = str.slice(lastFilterIndex, i).trim()
  var filter
  if (exp) {
    filter = {}
    var tokens = exp.match(filterTokenRE)
    filter.name = tokens[0]
    if (tokens.length > 1) {
      filter.args = tokens.slice(1).map(processFilterArg)
    }
  }
  if (filter) {
    (dir.filters = dir.filters || []).push(filter)
  }
  lastFilterIndex = i + 1
}

/**
 * Check if an argument is dynamic and strip quotes.
 *
 * @param {String} arg
 * @return {Object}
 */

function processFilterArg (arg) {
  var stripped = reservedArgRE.test(arg)
    ? arg
    : _.stripQuotes(arg)
  return {
    value: stripped || arg,
    dynamic: !stripped
  }
}

/**
 * Parse a directive string into an Array of AST-like
 * objects representing directives.
 *
 * Example:
 *
 * "click: a = a + 1 | uppercase" will yield:
 * {
 *   arg: 'click',
 *   expression: 'a = a + 1',
 *   filters: [
 *     { name: 'uppercase', args: null }
 *   ]
 * }
 *
 * @param {String} str
 * @return {Array<Object>}
 */

exports.parse = function (s) {

  var hit = cache.get(s)
  if (hit) {
    return hit
  }

  // reset parser state
  str = s
  inSingle = inDouble = false
  curly = square = paren = begin = argIndex = 0
  lastFilterIndex = 0
  dirs = []
  dir = {}
  arg = null

  for (i = 0, l = str.length; i < l; i++) {
    c = str.charCodeAt(i)
    if (inSingle) {
      // check single quote
      if (c === 0x27) inSingle = !inSingle
    } else if (inDouble) {
      // check double quote
      if (c === 0x22) inDouble = !inDouble
    } else if (
      c === 0x2C && // comma
      !paren && !curly && !square
    ) {
      // reached the end of a directive
      pushDir()
      // reset & skip the comma
      dir = {}
      begin = argIndex = lastFilterIndex = i + 1
    } else if (
      c === 0x3A && // colon
      !dir.expression &&
      !dir.arg
    ) {
      // argument
      arg = str.slice(begin, i).trim()
      // test for valid argument here
      // since we may have caught stuff like first half of
      // an object literal or a ternary expression.
      if (argRE.test(arg)) {
        argIndex = i + 1
        dir.arg = _.stripQuotes(arg) || arg
      }
    } else if (
      c === 0x7C && // pipe
      str.charCodeAt(i + 1) !== 0x7C &&
      str.charCodeAt(i - 1) !== 0x7C
    ) {
      if (dir.expression === undefined) {
        // first filter, end of expression
        lastFilterIndex = i + 1
        dir.expression = str.slice(argIndex, i).trim()
      } else {
        // already has filter
        pushFilter()
      }
    } else {
      switch (c) {
        case 0x22: inDouble = true; break // "
        case 0x27: inSingle = true; break // '
        case 0x28: paren++; break         // (
        case 0x29: paren--; break         // )
        case 0x5B: square++; break        // [
        case 0x5D: square--; break        // ]
        case 0x7B: curly++; break         // {
        case 0x7D: curly--; break         // }
      }
    }
  }

  if (i === 0 || begin !== i) {
    pushDir()
  }

  cache.put(s, dirs)
  return dirs
}
},{"../cache":13,"../util":62}],52:[function(require,module,exports){
var _ = require('../util')
var Path = require('./path')
var Cache = require('../cache')
var expressionCache = new Cache(1000)

var allowedKeywords =
  'Math,Date,this,true,false,null,undefined,Infinity,NaN,' +
  'isNaN,isFinite,decodeURI,decodeURIComponent,encodeURI,' +
  'encodeURIComponent,parseInt,parseFloat'
var allowedKeywordsRE =
  new RegExp('^(' + allowedKeywords.replace(/,/g, '\\b|') + '\\b)')

// keywords that don't make sense inside expressions
var improperKeywords =
  'break,case,class,catch,const,continue,debugger,default,' +
  'delete,do,else,export,extends,finally,for,function,if,' +
  'import,in,instanceof,let,return,super,switch,throw,try,' +
  'var,while,with,yield,enum,await,implements,package,' +
  'proctected,static,interface,private,public'
var improperKeywordsRE =
  new RegExp('^(' + improperKeywords.replace(/,/g, '\\b|') + '\\b)')

var wsRE = /\s/g
var newlineRE = /\n/g
var saveRE = /[\{,]\s*[\w\$_]+\s*:|('[^']*'|"[^"]*")|new |typeof |void /g
var restoreRE = /"(\d+)"/g
var pathTestRE = /^[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*|\['.*?'\]|\[".*?"\]|\[\d+\]|\[[A-Za-z_$][\w$]*\])*$/
var pathReplaceRE = /[^\w$\.]([A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*|\['.*?'\]|\[".*?"\])*)/g
var booleanLiteralRE = /^(true|false)$/

/**
 * Save / Rewrite / Restore
 *
 * When rewriting paths found in an expression, it is
 * possible for the same letter sequences to be found in
 * strings and Object literal property keys. Therefore we
 * remove and store these parts in a temporary array, and
 * restore them after the path rewrite.
 */

var saved = []

/**
 * Save replacer
 *
 * The save regex can match two possible cases:
 * 1. An opening object literal
 * 2. A string
 * If matched as a plain string, we need to escape its
 * newlines, since the string needs to be preserved when
 * generating the function body.
 *
 * @param {String} str
 * @param {String} isString - str if matched as a string
 * @return {String} - placeholder with index
 */

function save (str, isString) {
  var i = saved.length
  saved[i] = isString
    ? str.replace(newlineRE, '\\n')
    : str
  return '"' + i + '"'
}

/**
 * Path rewrite replacer
 *
 * @param {String} raw
 * @return {String}
 */

function rewrite (raw) {
  var c = raw.charAt(0)
  var path = raw.slice(1)
  if (allowedKeywordsRE.test(path)) {
    return raw
  } else {
    path = path.indexOf('"') > -1
      ? path.replace(restoreRE, restore)
      : path
    return c + 'scope.' + path
  }
}

/**
 * Restore replacer
 *
 * @param {String} str
 * @param {String} i - matched save index
 * @return {String}
 */

function restore (str, i) {
  return saved[i]
}

/**
 * Rewrite an expression, prefixing all path accessors with
 * `scope.` and generate getter/setter functions.
 *
 * @param {String} exp
 * @param {Boolean} needSet
 * @return {Function}
 */

function compileExpFns (exp, needSet) {
  if (improperKeywordsRE.test(exp)) {
    _.warn(
      'Avoid using reserved keywords in expression: '
      + exp
    )
  }
  // reset state
  saved.length = 0
  // save strings and object literal keys
  var body = exp
    .replace(saveRE, save)
    .replace(wsRE, '')
  // rewrite all paths
  // pad 1 space here becaue the regex matches 1 extra char
  body = (' ' + body)
    .replace(pathReplaceRE, rewrite)
    .replace(restoreRE, restore)
  var getter = makeGetter(body)
  if (getter) {
    return {
      get: getter,
      body: body,
      set: needSet
        ? makeSetter(body)
        : null
    }
  }
}

/**
 * Compile getter setters for a simple path.
 *
 * @param {String} exp
 * @return {Function}
 */

function compilePathFns (exp) {
  var getter, path
  if (exp.indexOf('[') < 0) {
    // really simple path
    path = exp.split('.')
    path.raw = exp
    getter = Path.compileGetter(path)
  } else {
    // do the real parsing
    path = Path.parse(exp)
    getter = path.get
  }
  return {
    get: getter,
    // always generate setter for simple paths
    set: function (obj, val) {
      Path.set(obj, path, val)
    }
  }
}

/**
 * Build a getter function. Requires eval.
 *
 * We isolate the try/catch so it doesn't affect the
 * optimization of the parse function when it is not called.
 *
 * @param {String} body
 * @return {Function|undefined}
 */

function makeGetter (body) {
  try {
    return new Function('scope', 'return ' + body + ';')
  } catch (e) {
    _.warn(
      'Invalid expression. ' +
      'Generated function body: ' + body
    )
  }
}

/**
 * Build a setter function.
 *
 * This is only needed in rare situations like "a[b]" where
 * a settable path requires dynamic evaluation.
 *
 * This setter function may throw error when called if the
 * expression body is not a valid left-hand expression in
 * assignment.
 *
 * @param {String} body
 * @return {Function|undefined}
 */

function makeSetter (body) {
  try {
    return new Function('scope', 'value', body + '=value;')
  } catch (e) {
    _.warn('Invalid setter function body: ' + body)
  }
}

/**
 * Check for setter existence on a cache hit.
 *
 * @param {Function} hit
 */

function checkSetter (hit) {
  if (!hit.set) {
    hit.set = makeSetter(hit.body)
  }
}

/**
 * Parse an expression into re-written getter/setters.
 *
 * @param {String} exp
 * @param {Boolean} needSet
 * @return {Function}
 */

exports.parse = function (exp, needSet) {
  exp = exp.trim()
  // try cache
  var hit = expressionCache.get(exp)
  if (hit) {
    if (needSet) {
      checkSetter(hit)
    }
    return hit
  }
  // we do a simple path check to optimize for them.
  // the check fails valid paths with unusal whitespaces,
  // but that's too rare and we don't care.
  // also skip boolean literals and paths that start with
  // global "Math"
  var res = exports.isSimplePath(exp)
    ? compilePathFns(exp)
    : compileExpFns(exp, needSet)
  expressionCache.put(exp, res)
  return res
}

/**
 * Check if an expression is a simple path.
 *
 * @param {String} exp
 * @return {Boolean}
 */

exports.isSimplePath = function (exp) {
  return pathTestRE.test(exp) &&
    // don't treat true/false as paths
    !booleanLiteralRE.test(exp) &&
    // Math constants e.g. Math.PI, Math.E etc.
    exp.slice(0, 5) !== 'Math.'
}
},{"../cache":13,"../util":62,"./path":53}],53:[function(require,module,exports){
var _ = require('../util')
var Cache = require('../cache')
var pathCache = new Cache(1000)
var identRE = exports.identRE = /^[$_a-zA-Z]+[\w$]*$/

/**
 * Path-parsing algorithm scooped from Polymer/observe-js
 */

var pathStateMachine = {
  'beforePath': {
    'ws': ['beforePath'],
    'ident': ['inIdent', 'append'],
    '[': ['beforeElement'],
    'eof': ['afterPath']
  },

  'inPath': {
    'ws': ['inPath'],
    '.': ['beforeIdent'],
    '[': ['beforeElement'],
    'eof': ['afterPath']
  },

  'beforeIdent': {
    'ws': ['beforeIdent'],
    'ident': ['inIdent', 'append']
  },

  'inIdent': {
    'ident': ['inIdent', 'append'],
    '0': ['inIdent', 'append'],
    'number': ['inIdent', 'append'],
    'ws': ['inPath', 'push'],
    '.': ['beforeIdent', 'push'],
    '[': ['beforeElement', 'push'],
    'eof': ['afterPath', 'push'],
    ']': ['inPath', 'push']
  },

  'beforeElement': {
    'ws': ['beforeElement'],
    '0': ['afterZero', 'append'],
    'number': ['inIndex', 'append'],
    "'": ['inSingleQuote', 'append', ''],
    '"': ['inDoubleQuote', 'append', ''],
    "ident": ['inIdent', 'append', '*']
  },

  'afterZero': {
    'ws': ['afterElement', 'push'],
    ']': ['inPath', 'push']
  },

  'inIndex': {
    '0': ['inIndex', 'append'],
    'number': ['inIndex', 'append'],
    'ws': ['afterElement'],
    ']': ['inPath', 'push']
  },

  'inSingleQuote': {
    "'": ['afterElement'],
    'eof': 'error',
    'else': ['inSingleQuote', 'append']
  },

  'inDoubleQuote': {
    '"': ['afterElement'],
    'eof': 'error',
    'else': ['inDoubleQuote', 'append']
  },

  'afterElement': {
    'ws': ['afterElement'],
    ']': ['inPath', 'push']
  }
}

function noop () {}

/**
 * Determine the type of a character in a keypath.
 *
 * @param {Char} char
 * @return {String} type
 */

function getPathCharType (char) {
  if (char === undefined) {
    return 'eof'
  }

  var code = char.charCodeAt(0)

  switch(code) {
    case 0x5B: // [
    case 0x5D: // ]
    case 0x2E: // .
    case 0x22: // "
    case 0x27: // '
    case 0x30: // 0
      return char

    case 0x5F: // _
    case 0x24: // $
      return 'ident'

    case 0x20: // Space
    case 0x09: // Tab
    case 0x0A: // Newline
    case 0x0D: // Return
    case 0xA0:  // No-break space
    case 0xFEFF:  // Byte Order Mark
    case 0x2028:  // Line Separator
    case 0x2029:  // Paragraph Separator
      return 'ws'
  }

  // a-z, A-Z
  if ((0x61 <= code && code <= 0x7A) ||
      (0x41 <= code && code <= 0x5A)) {
    return 'ident'
  }

  // 1-9
  if (0x31 <= code && code <= 0x39) {
    return 'number'
  }

  return 'else'
}

/**
 * Parse a string path into an array of segments
 * Todo implement cache
 *
 * @param {String} path
 * @return {Array|undefined}
 */

function parsePath (path) {
  var keys = []
  var index = -1
  var mode = 'beforePath'
  var c, newChar, key, type, transition, action, typeMap

  var actions = {
    push: function() {
      if (key === undefined) {
        return
      }
      keys.push(key)
      key = undefined
    },
    append: function() {
      if (key === undefined) {
        key = newChar
      } else {
        key += newChar
      }
    }
  }

  function maybeUnescapeQuote () {
    var nextChar = path[index + 1]
    if ((mode === 'inSingleQuote' && nextChar === "'") ||
        (mode === 'inDoubleQuote' && nextChar === '"')) {
      index++
      newChar = nextChar
      actions.append()
      return true
    }
  }

  while (mode) {
    index++
    c = path[index]

    if (c === '\\' && maybeUnescapeQuote()) {
      continue
    }

    type = getPathCharType(c)
    typeMap = pathStateMachine[mode]
    transition = typeMap[type] || typeMap['else'] || 'error'

    if (transition === 'error') {
      return // parse error
    }

    mode = transition[0]
    action = actions[transition[1]] || noop
    newChar = transition[2]
    newChar = newChar === undefined
      ? c
      : newChar === '*'
        ? newChar + c
        : newChar
    action()

    if (mode === 'afterPath') {
      keys.raw = path
      return keys
    }
  }
}

/**
 * Format a accessor segment based on its type.
 *
 * @param {String} key
 * @return {Boolean}
 */

function formatAccessor (key) {
  if (identRE.test(key)) { // identifier
    return '.' + key
  } else if (+key === key >>> 0) { // bracket index
    return '[' + key + ']'
  } else if (key.charAt(0) === '*') {
    return '[o' + formatAccessor(key.slice(1)) + ']'
  } else { // bracket string
    return '["' + key.replace(/"/g, '\\"') + '"]'
  }
}

/**
 * Compiles a getter function with a fixed path.
 * The fixed path getter supresses errors.
 *
 * @param {Array} path
 * @return {Function}
 */

exports.compileGetter = function (path) {
  var body = 'return o' + path.map(formatAccessor).join('')
  return new Function('o', 'try {' + body + '} catch (e) {}')
}

/**
 * External parse that check for a cache hit first
 *
 * @param {String} path
 * @return {Array|undefined}
 */

exports.parse = function (path) {
  var hit = pathCache.get(path)
  if (!hit) {
    hit = parsePath(path)
    if (hit) {
      hit.get = exports.compileGetter(hit)
      pathCache.put(path, hit)
    }
  }
  return hit
}

/**
 * Get from an object from a path string
 *
 * @param {Object} obj
 * @param {String} path
 */

exports.get = function (obj, path) {
  path = exports.parse(path)
  if (path) {
    return path.get(obj)
  }
}

/**
 * Set on an object from a path
 *
 * @param {Object} obj
 * @param {String | Array} path
 * @param {*} val
 */

exports.set = function (obj, path, val) {
  var original = obj
  if (typeof path === 'string') {
    path = exports.parse(path)
  }
  if (!path || !_.isObject(obj)) {
    return false
  }
  var last, key
  for (var i = 0, l = path.length; i < l; i++) {
    last = obj
    key = path[i]
    if (key.charAt(0) === '*') {
      key = original[key.slice(1)]
    }
    if (i < l - 1) {
      obj = obj[key]
      if (!_.isObject(obj)) {
        obj = {}
        last.$add(key, obj)
        warnNonExistent(path)
      }
    } else {
      if (_.isArray(obj)) {
        obj.$set(key, val)
      } else if (key in obj) {
        obj[key] = val
      } else {
        obj.$add(key, val)
        warnNonExistent(path)
      }
    }
  }
  return true
}

function warnNonExistent (path) {
  _.warn(
    'You are setting a non-existent path "' + path.raw + '" ' +
    'on a vm instance. Consider pre-initializing the property ' +
    'with the "data" option for more reliable reactivity ' +
    'and better performance.'
  )
}
},{"../cache":13,"../util":62}],54:[function(require,module,exports){
var _ = require('../util')
var Cache = require('../cache')
var templateCache = new Cache(1000)
var idSelectorCache = new Cache(1000)

var map = {
  _default : [0, '', ''],
  legend   : [1, '<fieldset>', '</fieldset>'],
  tr       : [2, '<table><tbody>', '</tbody></table>'],
  col      : [
    2,
    '<table><tbody></tbody><colgroup>',
    '</colgroup></table>'
  ]
}

map.td =
map.th = [
  3,
  '<table><tbody><tr>',
  '</tr></tbody></table>'
]

map.option =
map.optgroup = [
  1,
  '<select multiple="multiple">',
  '</select>'
]

map.thead =
map.tbody =
map.colgroup =
map.caption =
map.tfoot = [1, '<table>', '</table>']

map.g =
map.defs =
map.symbol =
map.use =
map.image =
map.text =
map.circle =
map.ellipse =
map.line =
map.path =
map.polygon =
map.polyline =
map.rect = [
  1,
  '<svg ' +
    'xmlns="http://www.w3.org/2000/svg" ' +
    'xmlns:xlink="http://www.w3.org/1999/xlink" ' +
    'xmlns:ev="http://www.w3.org/2001/xml-events"' +
    'version="1.1">',
  '</svg>'
]

var tagRE = /<([\w:]+)/
var entityRE = /&\w+;/

/**
 * Convert a string template to a DocumentFragment.
 * Determines correct wrapping by tag types. Wrapping
 * strategy found in jQuery & component/domify.
 *
 * @param {String} templateString
 * @return {DocumentFragment}
 */

function stringToFragment (templateString) {
  // try a cache hit first
  var hit = templateCache.get(templateString)
  if (hit) {
    return hit
  }

  var frag = document.createDocumentFragment()
  var tagMatch = templateString.match(tagRE)
  var entityMatch = entityRE.test(templateString)

  if (!tagMatch && !entityMatch) {
    // text only, return a single text node.
    frag.appendChild(
      document.createTextNode(templateString)
    )
  } else {

    var tag    = tagMatch && tagMatch[1]
    var wrap   = map[tag] || map._default
    var depth  = wrap[0]
    var prefix = wrap[1]
    var suffix = wrap[2]
    var node   = document.createElement('div')

    node.innerHTML = prefix + templateString.trim() + suffix
    while (depth--) {
      node = node.lastChild
    }

    var child
    /* jshint boss:true */
    while (child = node.firstChild) {
      frag.appendChild(child)
    }
  }

  templateCache.put(templateString, frag)
  return frag
}

/**
 * Convert a template node to a DocumentFragment.
 *
 * @param {Node} node
 * @return {DocumentFragment}
 */

function nodeToFragment (node) {
  var tag = node.tagName
  // if its a template tag and the browser supports it,
  // its content is already a document fragment.
  if (
    tag === 'TEMPLATE' &&
    node.content instanceof DocumentFragment
  ) {
    return node.content
  }
  // script template
  if (tag === 'SCRIPT') {
    return stringToFragment(node.textContent)
  }
  // normal node, clone it to avoid mutating the original
  var clone = exports.clone(node)
  var frag = document.createDocumentFragment()
  var child
  /* jshint boss:true */
  while (child = clone.firstChild) {
    frag.appendChild(child)
  }
  return frag
}

// Test for the presence of the Safari template cloning bug
// https://bugs.webkit.org/show_bug.cgi?id=137755
var hasBrokenTemplate = _.inBrowser
  ? (function () {
      var a = document.createElement('div')
      a.innerHTML = '<template>1</template>'
      return !a.cloneNode(true).firstChild.innerHTML
    })()
  : false

// Test for IE10/11 textarea placeholder clone bug
var hasTextareaCloneBug = _.inBrowser
  ? (function () {
      var t = document.createElement('textarea')
      t.placeholder = 't'
      return t.cloneNode(true).value === 't'
    })()
  : false

/**
 * 1. Deal with Safari cloning nested <template> bug by
 *    manually cloning all template instances.
 * 2. Deal with IE10/11 textarea placeholder bug by setting
 *    the correct value after cloning.
 *
 * @param {Element|DocumentFragment} node
 * @return {Element|DocumentFragment}
 */

exports.clone = function (node) {
  var res = node.cloneNode(true)
  var i, original, cloned
  /* istanbul ignore if */
  if (hasBrokenTemplate) {
    original = node.querySelectorAll('template')
    if (original.length) {
      cloned = res.querySelectorAll('template')
      i = cloned.length
      while (i--) {
        cloned[i].parentNode.replaceChild(
          original[i].cloneNode(true),
          cloned[i]
        )
      }
    }
  }
  /* istanbul ignore if */
  if (hasTextareaCloneBug) {
    if (node.tagName === 'TEXTAREA') {
      res.value = node.value
    } else {
      original = node.querySelectorAll('textarea')
      if (original.length) {
        cloned = res.querySelectorAll('textarea')
        i = cloned.length
        while (i--) {
          cloned[i].value = original[i].value
        }
      }
    }
  }
  return res
}

/**
 * Process the template option and normalizes it into a
 * a DocumentFragment that can be used as a partial or a
 * instance template.
 *
 * @param {*} template
 *    Possible values include:
 *    - DocumentFragment object
 *    - Node object of type Template
 *    - id selector: '#some-template-id'
 *    - template string: '<div><span>{{msg}}</span></div>'
 * @param {Boolean} clone
 * @param {Boolean} noSelector
 * @return {DocumentFragment|undefined}
 */

exports.parse = function (template, clone, noSelector) {
  var node, frag

  // if the template is already a document fragment,
  // do nothing
  if (template instanceof DocumentFragment) {
    return clone
      ? template.cloneNode(true)
      : template
  }

  if (typeof template === 'string') {
    // id selector
    if (!noSelector && template.charAt(0) === '#') {
      // id selector can be cached too
      frag = idSelectorCache.get(template)
      if (!frag) {
        node = document.getElementById(template.slice(1))
        if (node) {
          frag = nodeToFragment(node)
          // save selector to cache
          idSelectorCache.put(template, frag)
        }
      }
    } else {
      // normal string template
      frag = stringToFragment(template)
    }
  } else if (template.nodeType) {
    // a direct node
    frag = nodeToFragment(template)
  }

  return frag && clone
    ? exports.clone(frag)
    : frag
}
},{"../cache":13,"../util":62}],55:[function(require,module,exports){
var Cache = require('../cache')
var config = require('../config')
var dirParser = require('./directive')
var regexEscapeRE = /[-.*+?^${}()|[\]\/\\]/g
var cache, tagRE, htmlRE, firstChar, lastChar

/**
 * Escape a string so it can be used in a RegExp
 * constructor.
 *
 * @param {String} str
 */

function escapeRegex (str) {
  return str.replace(regexEscapeRE, '\\$&')
}

/**
 * Compile the interpolation tag regex.
 *
 * @return {RegExp}
 */

function compileRegex () {
  config._delimitersChanged = false
  var open = config.delimiters[0]
  var close = config.delimiters[1]
  firstChar = open.charAt(0)
  lastChar = close.charAt(close.length - 1)
  var firstCharRE = escapeRegex(firstChar)
  var lastCharRE = escapeRegex(lastChar)
  var openRE = escapeRegex(open)
  var closeRE = escapeRegex(close)
  tagRE = new RegExp(
    firstCharRE + '?' + openRE +
    '(.+?)' +
    closeRE + lastCharRE + '?',
    'g'
  )
  htmlRE = new RegExp(
    '^' + firstCharRE + openRE +
    '.*' +
    closeRE + lastCharRE + '$'
  )
  // reset cache
  cache = new Cache(1000)
}

/**
 * Parse a template text string into an array of tokens.
 *
 * @param {String} text
 * @return {Array<Object> | null}
 *               - {String} type
 *               - {String} value
 *               - {Boolean} [html]
 *               - {Boolean} [oneTime]
 */

exports.parse = function (text) {
  if (config._delimitersChanged) {
    compileRegex()
  }
  var hit = cache.get(text)
  if (hit) {
    return hit
  }
  if (!tagRE.test(text)) {
    return null
  }
  var tokens = []
  var lastIndex = tagRE.lastIndex = 0
  var match, index, value, first, oneTime
  /* jshint boss:true */
  while (match = tagRE.exec(text)) {
    index = match.index
    // push text token
    if (index > lastIndex) {
      tokens.push({
        value: text.slice(lastIndex, index)
      })
    }
    // tag token
    first = match[1].charCodeAt(0)
    oneTime = first === 0x2A // *
    value = oneTime
      ? match[1].slice(1)
      : match[1]
    tokens.push({
      tag: true,
      value: value.trim(),
      html: htmlRE.test(match[0]),
      oneTime: oneTime
    })
    lastIndex = index + match[0].length
  }
  if (lastIndex < text.length) {
    tokens.push({
      value: text.slice(lastIndex)
    })
  }
  cache.put(text, tokens)
  return tokens
}

/**
 * Format a list of tokens into an expression.
 * e.g. tokens parsed from 'a {{b}} c' can be serialized
 * into one single expression as '"a " + b + " c"'.
 *
 * @param {Array} tokens
 * @param {Vue} [vm]
 * @return {String}
 */

exports.tokensToExp = function (tokens, vm) {
  return tokens.length > 1
    ? tokens.map(function (token) {
        return formatToken(token, vm)
      }).join('+')
    : formatToken(tokens[0], vm, true)
}

/**
 * Format a single token.
 *
 * @param {Object} token
 * @param {Vue} [vm]
 * @param {Boolean} single
 * @return {String}
 */

function formatToken (token, vm, single) {
  return token.tag
    ? vm && token.oneTime
      ? '"' + vm.$eval(token.value) + '"'
      : inlineFilters(token.value, single)
    : '"' + token.value + '"'
}

/**
 * For an attribute with multiple interpolation tags,
 * e.g. attr="some-{{thing | filter}}", in order to combine
 * the whole thing into a single watchable expression, we
 * have to inline those filters. This function does exactly
 * that. This is a bit hacky but it avoids heavy changes
 * to directive parser and watcher mechanism.
 *
 * @param {String} exp
 * @param {Boolean} single
 * @return {String}
 */

var filterRE = /[^|]\|[^|]/
function inlineFilters (exp, single) {
  if (!filterRE.test(exp)) {
    return single
      ? exp
      : '(' + exp + ')'
  } else {
    var dir = dirParser.parse(exp)[0]
    if (!dir.filters) {
      return '(' + exp + ')'
    } else {
      return 'this._applyFilters(' +
        dir.expression + // value
        ',null,' +       // oldValue (null for read)
        JSON.stringify(dir.filters) + // filter descriptors
        ',false)'        // write?
    }
  }
}
},{"../cache":13,"../config":16,"./directive":51}],56:[function(require,module,exports){
var _ = require('../util')

/**
 * Append with transition.
 *
 * @oaram {Element} el
 * @param {Element} target
 * @param {Vue} vm
 * @param {Function} [cb]
 */

exports.append = function (el, target, vm, cb) {
  apply(el, 1, function () {
    target.appendChild(el)
  }, vm, cb)
}

/**
 * InsertBefore with transition.
 *
 * @oaram {Element} el
 * @param {Element} target
 * @param {Vue} vm
 * @param {Function} [cb]
 */

exports.before = function (el, target, vm, cb) {
  apply(el, 1, function () {
    _.before(el, target)
  }, vm, cb)
}

/**
 * Remove with transition.
 *
 * @oaram {Element} el
 * @param {Vue} vm
 * @param {Function} [cb]
 */

exports.remove = function (el, vm, cb) {
  apply(el, -1, function () {
    _.remove(el)
  }, vm, cb)
}

/**
 * Remove by appending to another parent with transition.
 * This is only used in block operations.
 *
 * @oaram {Element} el
 * @param {Element} target
 * @param {Vue} vm
 * @param {Function} [cb]
 */

exports.removeThenAppend = function (el, target, vm, cb) {
  apply(el, -1, function () {
    target.appendChild(el)
  }, vm, cb)
}

/**
 * Append the childNodes of a fragment to target.
 *
 * @param {DocumentFragment} block
 * @param {Node} target
 * @param {Vue} vm
 */

exports.blockAppend = function (block, target, vm) {
  var nodes = _.toArray(block.childNodes)
  for (var i = 0, l = nodes.length; i < l; i++) {
    exports.before(nodes[i], target, vm)
  }
}

/**
 * Remove a block of nodes between two edge nodes.
 *
 * @param {Node} start
 * @param {Node} end
 * @param {Vue} vm
 */

exports.blockRemove = function (start, end, vm) {
  var node = start.nextSibling
  var next
  while (node !== end) {
    next = node.nextSibling
    exports.remove(node, vm)
    node = next
  }
}

/**
 * Apply transitions with an operation callback.
 *
 * @oaram {Element} el
 * @param {Number} direction
 *                  1: enter
 *                 -1: leave
 * @param {Function} op - the actual DOM operation
 * @param {Vue} vm
 * @param {Function} [cb]
 */

var apply = exports.apply = function (el, direction, op, vm, cb) {
  var transition = el.__v_trans
  if (
    !transition ||
    // skip if there are no js hooks and CSS transition is
    // not supported
    (!transition.hooks && !_.transitionEndEvent) ||
    // skip transitions for initial compile
    !vm._isCompiled ||
    // if the vm is being manipulated by a parent directive
    // during the parent's compilation phase, skip the
    // animation.
    (vm.$parent && !vm.$parent._isCompiled)
  ) {
    op()
    if (cb) cb()
    return
  }
  var action = direction > 0 ? 'enter' : 'leave'
  transition[action](op, cb)
}
},{"../util":62}],57:[function(require,module,exports){
var _ = require('../util')
var queue = []
var queued = false

/**
 * Push a job into the queue.
 *
 * @param {Function} job
 */

exports.push = function (job) {
  queue.push(job)
  if (!queued) {
    queued = true
    _.nextTick(flush)
  }
}

/**
 * Flush the queue, and do one forced reflow before
 * triggering transitions.
 */

function flush () {
  // Force layout
  var f = document.documentElement.offsetHeight
  for (var i = 0; i < queue.length; i++) {
    queue[i]()
  }
  queue = []
  queued = false
  // dummy return, so js linters don't complain about
  // unused variable f
  return f
}
},{"../util":62}],58:[function(require,module,exports){
var _ = require('../util')
var queue = require('./queue')
var addClass = _.addClass
var removeClass = _.removeClass
var transitionEndEvent = _.transitionEndEvent
var animationEndEvent = _.animationEndEvent
var transDurationProp = _.transitionProp + 'Duration'
var animDurationProp = _.animationProp + 'Duration'

var TYPE_TRANSITION = 1
var TYPE_ANIMATION = 2

/**
 * A Transition object that encapsulates the state and logic
 * of the transition.
 *
 * @param {Element} el
 * @param {String} id
 * @param {Object} hooks
 * @param {Vue} vm
 */

function Transition (el, id, hooks, vm) {
  this.el = el
  this.enterClass = id + '-enter'
  this.leaveClass = id + '-leave'
  this.hooks = hooks
  this.vm = vm
  // async state
  this.pendingCssEvent =
  this.pendingCssCb =
  this.cancel =
  this.pendingJsCb =
  this.op =
  this.cb = null
  this.typeCache = {}
  // bind
  var self = this
  ;['enterNextTick', 'enterDone', 'leaveNextTick', 'leaveDone']
    .forEach(function (m) {
      self[m] = _.bind(self[m], self)
    })
}

var p = Transition.prototype

/**
 * Start an entering transition.
 *
 * 1. enter transition triggered
 * 2. call beforeEnter hook
 * 3. add enter class
 * 4. insert/show element
 * 5. call enter hook (with possible explicit js callback)
 * 6. reflow
 * 7. based on transition type:
 *    - transition:
 *        remove class now, wait for transitionend,
 *        then done if there's no explicit js callback.
 *    - animation:
 *        wait for animationend, remove class,
 *        then done if there's no explicit js callback.
 *    - no css transition:
 *        done now if there's no explicit js callback.
 * 8. wait for either done or js callback, then call
 *    afterEnter hook.
 *
 * @param {Function} op - insert/show the element
 * @param {Function} [cb]
 */

p.enter = function (op, cb) {
  this.cancelPending()
  this.callHook('beforeEnter')
  this.cb = cb
  addClass(this.el, this.enterClass)
  op()
  this.callHookWithCb('enter')
  this.cancel = this.hooks && this.hooks.enterCancelled
  queue.push(this.enterNextTick)
}

/**
 * The "nextTick" phase of an entering transition, which is
 * to be pushed into a queue and executed after a reflow so
 * that removing the class can trigger a CSS transition.
 */

p.enterNextTick = function () {
  var type = this.getCssTransitionType(this.enterClass)
  var enterDone = this.enterDone
  if (type === TYPE_TRANSITION) {
    // trigger transition by removing enter class now
    removeClass(this.el, this.enterClass)
    this.setupCssCb(transitionEndEvent, enterDone)
  } else if (type === TYPE_ANIMATION) {
    this.setupCssCb(animationEndEvent, enterDone)
  } else if (!this.pendingJsCb) {
    enterDone()
  }
}

/**
 * The "cleanup" phase of an entering transition.
 */

p.enterDone = function () {
  this.cancel = this.pendingJsCb = null
  removeClass(this.el, this.enterClass)
  this.callHook('afterEnter')
  if (this.cb) this.cb()
}

/**
 * Start a leaving transition.
 *
 * 1. leave transition triggered.
 * 2. call beforeLeave hook
 * 3. add leave class (trigger css transition)
 * 4. call leave hook (with possible explicit js callback)
 * 5. reflow if no explicit js callback is provided
 * 6. based on transition type:
 *    - transition or animation:
 *        wait for end event, remove class, then done if
 *        there's no explicit js callback.
 *    - no css transition: 
 *        done if there's no explicit js callback.
 * 7. wait for either done or js callback, then call
 *    afterLeave hook.
 *
 * @param {Function} op - remove/hide the element
 * @param {Function} [cb]
 */

p.leave = function (op, cb) {
  this.cancelPending()
  this.callHook('beforeLeave')
  this.op = op
  this.cb = cb
  addClass(this.el, this.leaveClass)
  this.callHookWithCb('leave')
  this.cancel = this.hooks && this.hooks.enterCancelled
  // only need to do leaveNextTick if there's no explicit
  // js callback
  if (!this.pendingJsCb) {
    queue.push(this.leaveNextTick)
  }
}

/**
 * The "nextTick" phase of a leaving transition.
 */

p.leaveNextTick = function () {
  var type = this.getCssTransitionType(this.leaveClass)
  if (type) {
    var event = type === TYPE_TRANSITION
      ? transitionEndEvent
      : animationEndEvent
    this.setupCssCb(event, this.leaveDone)
  } else {
    this.leaveDone()
  }
}

/**
 * The "cleanup" phase of a leaving transition.
 */

p.leaveDone = function () {
  this.cancel = this.pendingJsCb = null
  this.op()
  removeClass(this.el, this.leaveClass)
  this.callHook('afterLeave')
  if (this.cb) this.cb()
}

/**
 * Cancel any pending callbacks from a previously running
 * but not finished transition.
 */

p.cancelPending = function () {
  this.op = this.cb = null
  var hasPending = false
  if (this.pendingCssCb) {
    hasPending = true
    _.off(this.el, this.pendingCssEvent, this.pendingCssCb)
    this.pendingCssEvent = this.pendingCssCb = null
  }
  if (this.pendingJsCb) {
    hasPending = true
    this.pendingJsCb.cancel()
    this.pendingJsCb = null
  }
  if (hasPending) {
    removeClass(this.el, this.enterClass)
    removeClass(this.el, this.leaveClass)
  }
  if (this.cancel) {
    this.cancel.call(this.vm, this.el)
    this.cancel = null
  }
}

/**
 * Call a user-provided synchronous hook function.
 *
 * @param {String} type
 */

p.callHook = function (type) {
  if (this.hooks && this.hooks[type]) {
    this.hooks[type].call(this.vm, this.el)
  }
}

/**
 * Call a user-provided, potentially-async hook function.
 * We check for the length of arguments to see if the hook
 * expects a `done` callback. If true, the transition's end
 * will be determined by when the user calls that callback;
 * otherwise, the end is determined by the CSS transition or
 * animation.
 *
 * @param {String} type
 */

p.callHookWithCb = function (type) {
  var hook = this.hooks && this.hooks[type]
  if (hook) {
    if (hook.length > 1) {
      this.pendingJsCb = _.cancellable(this[type + 'Done'])
    }
    hook.call(this.vm, this.el, this.pendingJsCb)
  }
}

/**
 * Get an element's transition type based on the
 * calculated styles.
 *
 * @param {String} className
 * @return {Number}
 */

p.getCssTransitionType = function (className) {
  // skip CSS transitions if page is not visible -
  // this solves the issue of transitionend events not
  // firing until the page is visible again.
  // pageVisibility API is supported in IE10+, same as
  // CSS transitions.
  /* istanbul ignore if */
  if (!transitionEndEvent || document.hidden) {
    return
  }
  var type = this.typeCache[className]
  if (type) return type
  var inlineStyles = this.el.style
  var computedStyles = window.getComputedStyle(this.el)
  var transDuration =
    inlineStyles[transDurationProp] ||
    computedStyles[transDurationProp]
  if (transDuration && transDuration !== '0s') {
    type = TYPE_TRANSITION
  } else {
    var animDuration =
      inlineStyles[animDurationProp] ||
      computedStyles[animDurationProp]
    if (animDuration && animDuration !== '0s') {
      type = TYPE_ANIMATION
    }
  }
  if (type) {
    this.typeCache[className] = type
  }
  return type
}

/**
 * Setup a CSS transitionend/animationend callback.
 *
 * @param {String} event
 * @param {Function} cb
 */

p.setupCssCb = function (event, cb) {
  this.pendingCssEvent = event
  var self = this
  var el = this.el
  var onEnd = this.pendingCssCb = function (e) {
    if (e.target === el) {
      _.off(el, event, onEnd)
      self.pendingCssEvent = self.pendingCssCb = null
      if (!self.pendingJsCb && cb) {
        cb()
      }
    }
  }
  _.on(el, event, onEnd)
}

module.exports = Transition
},{"../util":62,"./queue":57}],59:[function(require,module,exports){
var config = require('../config')

/**
 * Enable debug utilities. The enableDebug() function and
 * all _.log() & _.warn() calls will be dropped in the
 * minified production build.
 */

enableDebug()

function enableDebug () {

  var hasConsole = typeof console !== 'undefined'
  
  /**
   * Log a message.
   *
   * @param {String} msg
   */

  exports.log = function (msg) {
    if (hasConsole && config.debug) {
      console.log('[Vue info]: ' + msg)
    }
  }

  /**
   * We've got a problem here.
   *
   * @param {String} msg
   */

  exports.warn = function (msg, e) {
    if (hasConsole && (!config.silent || config.debug)) {
      console.warn('[Vue warn]: ' + msg)
      /* istanbul ignore if */
      if (config.debug) {
        /* jshint debug: true */
        console.warn((e || new Error('Warning Stack Trace')).stack)
      }
    }
  }

  /**
   * Assert asset exists
   */

  exports.assertAsset = function (val, type, id) {
    /* istanbul ignore if */
    if (type === 'directive') {
      if (id === 'component') {
        exports.warn(
          'v-component has been deprecated in 0.12. ' +
          'Use custom element syntax instead.'
        )
        return
      }
      if (id === 'with') {
        exports.warn(
          'v-with has been deprecated in 0.12. ' +
          'Use props instead.'
        )
        return
      }
    }
    if (!val) {
      exports.warn('Failed to resolve ' + type + ': ' + id)
    }
  }
}
},{"../config":16}],60:[function(require,module,exports){
var config = require('../config')

/**
 * Check if a node is in the document.
 * Note: document.documentElement.contains should work here
 * but always returns false for comment nodes in phantomjs,
 * making unit tests difficult. This is fixed byy doing the
 * contains() check on the node's parentNode instead of
 * the node itself.
 *
 * @param {Node} node
 * @return {Boolean}
 */

exports.inDoc = function (node) {
  var doc = document.documentElement
  var parent = node && node.parentNode
  return doc === node ||
    doc === parent ||
    !!(parent && parent.nodeType === 1 && (doc.contains(parent)))
}

/**
 * Extract an attribute from a node.
 *
 * @param {Node} node
 * @param {String} attr
 */

exports.attr = function (node, attr) {
  attr = config.prefix + attr
  var val = node.getAttribute(attr)
  if (val !== null) {
    node.removeAttribute(attr)
  }
  return val
}

/**
 * Insert el before target
 *
 * @param {Element} el
 * @param {Element} target
 */

exports.before = function (el, target) {
  target.parentNode.insertBefore(el, target)
}

/**
 * Insert el after target
 *
 * @param {Element} el
 * @param {Element} target
 */

exports.after = function (el, target) {
  if (target.nextSibling) {
    exports.before(el, target.nextSibling)
  } else {
    target.parentNode.appendChild(el)
  }
}

/**
 * Remove el from DOM
 *
 * @param {Element} el
 */

exports.remove = function (el) {
  el.parentNode.removeChild(el)
}

/**
 * Prepend el to target
 *
 * @param {Element} el
 * @param {Element} target
 */

exports.prepend = function (el, target) {
  if (target.firstChild) {
    exports.before(el, target.firstChild)
  } else {
    target.appendChild(el)
  }
}

/**
 * Replace target with el
 *
 * @param {Element} target
 * @param {Element} el
 */

exports.replace = function (target, el) {
  var parent = target.parentNode
  if (parent) {
    parent.replaceChild(el, target)
  }
}

/**
 * Add event listener shorthand.
 *
 * @param {Element} el
 * @param {String} event
 * @param {Function} cb
 */

exports.on = function (el, event, cb) {
  el.addEventListener(event, cb)
}

/**
 * Remove event listener shorthand.
 *
 * @param {Element} el
 * @param {String} event
 * @param {Function} cb
 */

exports.off = function (el, event, cb) {
  el.removeEventListener(event, cb)
}

/**
 * Add class with compatibility for IE & SVG
 *
 * @param {Element} el
 * @param {Strong} cls
 */

exports.addClass = function (el, cls) {
  if (el.classList) {
    el.classList.add(cls)
  } else {
    var cur = ' ' + (el.getAttribute('class') || '') + ' '
    if (cur.indexOf(' ' + cls + ' ') < 0) {
      el.setAttribute('class', (cur + cls).trim())
    }
  }
}

/**
 * Remove class with compatibility for IE & SVG
 *
 * @param {Element} el
 * @param {Strong} cls
 */

exports.removeClass = function (el, cls) {
  if (el.classList) {
    el.classList.remove(cls)
  } else {
    var cur = ' ' + (el.getAttribute('class') || '') + ' '
    var tar = ' ' + cls + ' '
    while (cur.indexOf(tar) >= 0) {
      cur = cur.replace(tar, ' ')
    }
    el.setAttribute('class', cur.trim())
  }
}

/**
 * Extract raw content inside an element into a temporary
 * container div
 *
 * @param {Element} el
 * @param {Boolean} asFragment
 * @return {Element}
 */

exports.extractContent = function (el, asFragment) {
  var child
  var rawContent
  /* istanbul ignore if */
  if (
    el.tagName === 'TEMPLATE' &&
    el.content instanceof DocumentFragment
  ) {
    el = el.content
  }
  if (el.hasChildNodes()) {
    rawContent = asFragment
      ? document.createDocumentFragment()
      : document.createElement('div')
    /* jshint boss:true */
    while (child = el.firstChild) {
      rawContent.appendChild(child)
    }
  }
  return rawContent
}

},{"../config":16}],61:[function(require,module,exports){
// can we use __proto__?
exports.hasProto = '__proto__' in {}

// Browser environment sniffing
var inBrowser = exports.inBrowser =
  typeof window !== 'undefined' &&
  Object.prototype.toString.call(window) !== '[object Object]'

exports.isIE9 =
  inBrowser &&
  navigator.userAgent.toLowerCase().indexOf('msie 9.0') > 0

exports.isAndroid =
  inBrowser &&
  navigator.userAgent.toLowerCase().indexOf('android') > 0

// Transition property/event sniffing
if (inBrowser && !exports.isIE9) {
  var isWebkitTrans =
    window.ontransitionend === undefined &&
    window.onwebkittransitionend !== undefined
  var isWebkitAnim =
    window.onanimationend === undefined &&
    window.onwebkitanimationend !== undefined
  exports.transitionProp = isWebkitTrans
    ? 'WebkitTransition'
    : 'transition'
  exports.transitionEndEvent = isWebkitTrans
    ? 'webkitTransitionEnd'
    : 'transitionend'
  exports.animationProp = isWebkitAnim
    ? 'WebkitAnimation'
    : 'animation'
  exports.animationEndEvent = isWebkitAnim
    ? 'webkitAnimationEnd'
    : 'animationend'
}

/**
 * Defer a task to execute it asynchronously. Ideally this
 * should be executed as a microtask, so we leverage
 * MutationObserver if it's available, and fallback to
 * setTimeout(0).
 *
 * @param {Function} cb
 * @param {Object} ctx
 */

exports.nextTick = (function () {
  var callbacks = []
  var pending = false
  var timerFunc
  function handle () {
    pending = false
    var copies = callbacks.slice(0)
    callbacks = []
    for (var i = 0; i < copies.length; i++) {
      copies[i]()
    }
  }
  /* istanbul ignore if */
  if (typeof MutationObserver !== 'undefined') {
    var counter = 1
    var observer = new MutationObserver(handle)
    var textNode = document.createTextNode(counter)
    observer.observe(textNode, {
      characterData: true
    })
    timerFunc = function () {
      counter = (counter + 1) % 2
      textNode.data = counter
    }
  } else {
    timerFunc = setTimeout
  }
  return function (cb, ctx) {
    var func = ctx
      ? function () { cb.call(ctx) }
      : cb
    callbacks.push(func)
    if (pending) return
    pending = true
    timerFunc(handle, 0)
  }
})()
},{}],62:[function(require,module,exports){
var lang   = require('./lang')
var extend = lang.extend

extend(exports, lang)
extend(exports, require('./env'))
extend(exports, require('./dom'))
extend(exports, require('./misc'))
extend(exports, require('./debug'))
extend(exports, require('./options'))
},{"./debug":59,"./dom":60,"./env":61,"./lang":63,"./misc":64,"./options":65}],63:[function(require,module,exports){
/**
 * Check is a string starts with $ or _
 *
 * @param {String} str
 * @return {Boolean}
 */

exports.isReserved = function (str) {
  var c = (str + '').charCodeAt(0)
  return c === 0x24 || c === 0x5F
}

/**
 * Guard text output, make sure undefined outputs
 * empty string
 *
 * @param {*} value
 * @return {String}
 */

exports.toString = function (value) {
  return value == null
    ? ''
    : value.toString()
}

/**
 * Check and convert possible numeric numbers before
 * setting back to data
 *
 * @param {*} value
 * @return {*|Number}
 */

exports.toNumber = function (value) {
  return (
    isNaN(value) ||
    value === null ||
    typeof value === 'boolean'
  ) ? value
    : Number(value)
}

/**
 * Strip quotes from a string
 *
 * @param {String} str
 * @return {String | false}
 */

exports.stripQuotes = function (str) {
  var a = str.charCodeAt(0)
  var b = str.charCodeAt(str.length - 1)
  return a === b && (a === 0x22 || a === 0x27)
    ? str.slice(1, -1)
    : false
}

/**
 * Replace helper
 *
 * @param {String} _ - matched delimiter
 * @param {String} c - matched char
 * @return {String}
 */
function toUpper (_, c) {
  return c ? c.toUpperCase () : ''
}

/**
 * Camelize a hyphen-delmited string.
 *
 * @param {String} str
 * @return {String}
 */

var camelRE = /-(\w)/g
exports.camelize = function (str) {
  return str.replace(camelRE, toUpper)
}

/**
 * Converts hyphen/underscore/slash delimitered names into
 * camelized classNames.
 *
 * e.g. my-component => MyComponent
 *      some_else    => SomeElse
 *      some/comp    => SomeComp
 *
 * @param {String} str
 * @return {String}
 */

var classifyRE = /(?:^|[-_\/])(\w)/g
exports.classify = function (str) {
  return str.replace(classifyRE, toUpper)
}

/**
 * Simple bind, faster than native
 *
 * @param {Function} fn
 * @param {Object} ctx
 * @return {Function}
 */

exports.bind = function (fn, ctx) {
  return function (a) {
    var l = arguments.length
    return l
      ? l > 1
        ? fn.apply(ctx, arguments)
        : fn.call(ctx, a)
      : fn.call(ctx)
  }
}

/**
 * Convert an Array-like object to a real Array.
 *
 * @param {Array-like} list
 * @param {Number} [start] - start index
 * @return {Array}
 */

exports.toArray = function (list, start) {
  start = start || 0
  var i = list.length - start
  var ret = new Array(i)
  while (i--) {
    ret[i] = list[i + start]
  }
  return ret
}

/**
 * Mix properties into target object.
 *
 * @param {Object} to
 * @param {Object} from
 */

exports.extend = function (to, from) {
  for (var key in from) {
    to[key] = from[key]
  }
  return to
}

/**
 * Quick object check - this is primarily used to tell
 * Objects from primitive values when we know the value
 * is a JSON-compliant type.
 *
 * @param {*} obj
 * @return {Boolean}
 */

exports.isObject = function (obj) {
  return obj && typeof obj === 'object'
}

/**
 * Strict object type check. Only returns true
 * for plain JavaScript objects.
 *
 * @param {*} obj
 * @return {Boolean}
 */

var toString = Object.prototype.toString
exports.isPlainObject = function (obj) {
  return toString.call(obj) === '[object Object]'
}

/**
 * Array type check.
 *
 * @param {*} obj
 * @return {Boolean}
 */

exports.isArray = function (obj) {
  return Array.isArray(obj)
}

/**
 * Define a non-enumerable property
 *
 * @param {Object} obj
 * @param {String} key
 * @param {*} val
 * @param {Boolean} [enumerable]
 */

exports.define = function (obj, key, val, enumerable) {
  Object.defineProperty(obj, key, {
    value        : val,
    enumerable   : !!enumerable,
    writable     : true,
    configurable : true
  })
}

/**
 * Debounce a function so it only gets called after the
 * input stops arriving after the given wait period.
 *
 * @param {Function} func
 * @param {Number} wait
 * @return {Function} - the debounced function
 */

exports.debounce = function(func, wait) {
  var timeout, args, context, timestamp, result
  var later = function() {
    var last = Date.now() - timestamp
    if (last < wait && last >= 0) {
      timeout = setTimeout(later, wait - last)
    } else {
      timeout = null
      result = func.apply(context, args)
      if (!timeout) context = args = null
    }
  }
  return function() {
    context = this
    args = arguments
    timestamp = Date.now()
    if (!timeout) {
      timeout = setTimeout(later, wait)
    }
    return result
  }
}

/**
 * Manual indexOf because it's slightly faster than
 * native.
 *
 * @param {Array} arr
 * @param {*} obj
 */

exports.indexOf = function (arr, obj) {
  for (var i = 0, l = arr.length; i < l; i++) {
    if (arr[i] === obj) return i
  }
  return -1
}

/**
 * Make a cancellable version of an async callback.
 *
 * @param {Function} fn
 * @return {Function}
 */

exports.cancellable = function (fn) {
  var cb = function () {
    if (!cb.cancelled) {
      return fn.apply(this, arguments)
    }
  }
  cb.cancel = function () {
    cb.cancelled = true
  }
  return cb
}
},{}],64:[function(require,module,exports){
var _ = require('./index')
var config = require('../config')
var commonTagRE = /^(div|p|span|img|a|br|ul|ol|li|h1|h2|h3|h4|h5|table|tbody|tr|td|pre)$/

/**
 * Check if an element is a component, if yes return its
 * component id.
 *
 * @param {Element} el
 * @param {Object} options
 * @return {String|undefined}
 */

exports.checkComponent = function (el, options) {
  var tag = el.tagName.toLowerCase()
  if (tag === 'component') {
    // dynamic syntax
    var exp = el.getAttribute('is')
    el.removeAttribute('is')
    return exp
  } else if (
    !commonTagRE.test(tag) &&
    _.resolveAsset(options, 'components', tag)
  ) {
    return tag
  }
}

/**
 * Create an "anchor" for performing dom insertion/removals.
 * This is used in a number of scenarios:
 * - block instance
 * - v-html
 * - v-if
 * - component
 * - repeat
 *
 * @param {String} content
 * @param {Boolean} persist - IE trashes empty textNodes on
 *                            cloneNode(true), so in certain
 *                            cases the anchor needs to be
 *                            non-empty to be persisted in
 *                            templates.
 * @return {Comment|Text}
 */

exports.createAnchor = function (content, persist) {
  return config.debug
    ? document.createComment(content)
    : document.createTextNode(persist ? ' ' : '')
}
},{"../config":16,"./index":62}],65:[function(require,module,exports){
var _ = require('./index')
var extend = _.extend

/**
 * Option overwriting strategies are functions that handle
 * how to merge a parent option value and a child option
 * value into the final value.
 *
 * All strategy functions follow the same signature:
 *
 * @param {*} parentVal
 * @param {*} childVal
 * @param {Vue} [vm]
 */

var strats = Object.create(null)

/**
 * Helper that recursively merges two data objects together.
 */

function mergeData (to, from) {
  var key, toVal, fromVal
  for (key in from) {
    toVal = to[key]
    fromVal = from[key]
    if (!to.hasOwnProperty(key)) {
      to.$add(key, fromVal)
    } else if (_.isObject(toVal) && _.isObject(fromVal)) {
      mergeData(toVal, fromVal)
    }
  }
  return to
}

/**
 * Data
 */

strats.data = function (parentVal, childVal, vm) {
  if (!vm) {
    // in a Vue.extend merge, both should be functions
    if (!childVal) {
      return parentVal
    }
    if (typeof childVal !== 'function') {
      _.warn(
        'The "data" option should be a function ' +
        'that returns a per-instance value in component ' +
        'definitions.'
      )
      return parentVal
    }
    if (!parentVal) {
      return childVal
    }
    // when parentVal & childVal are both present,
    // we need to return a function that returns the
    // merged result of both functions... no need to
    // check if parentVal is a function here because
    // it has to be a function to pass previous merges.
    return function mergedDataFn () {
      return mergeData(
        childVal.call(this),
        parentVal.call(this)
      )
    }
  } else {
    // instance merge, return raw object
    var instanceData = typeof childVal === 'function'
      ? childVal.call(vm)
      : childVal
    var defaultData = typeof parentVal === 'function'
      ? parentVal.call(vm)
      : undefined
    if (instanceData) {
      return mergeData(instanceData, defaultData)
    } else {
      return defaultData
    }
  }
}

/**
 * El
 */

strats.el = function (parentVal, childVal, vm) {
  if (!vm && childVal && typeof childVal !== 'function') {
    _.warn(
      'The "el" option should be a function ' +
      'that returns a per-instance value in component ' +
      'definitions.'
    )
    return
  }
  var ret = childVal || parentVal
  // invoke the element factory if this is instance merge
  return vm && typeof ret === 'function'
    ? ret.call(vm)
    : ret
}

/**
 * Hooks and param attributes are merged as arrays.
 */

strats.created =
strats.ready =
strats.attached =
strats.detached =
strats.beforeCompile =
strats.compiled =
strats.beforeDestroy =
strats.destroyed =
strats.props = function (parentVal, childVal) {
  return childVal
    ? parentVal
      ? parentVal.concat(childVal)
      : _.isArray(childVal)
        ? childVal
        : [childVal]
    : parentVal
}

/**
 * 0.11 deprecation warning
 */

strats.paramAttributes = function () {
  /* istanbul ignore next */
  _.warn(
    '"paramAttributes" option has been deprecated in 0.12. ' +
    'Use "props" instead.'
  )
}

/**
 * Assets
 *
 * When a vm is present (instance creation), we need to do
 * a three-way merge between constructor options, instance
 * options and parent options.
 */

strats.directives =
strats.filters =
strats.transitions =
strats.components =
strats.elementDirectives = function (parentVal, childVal) {
  var res = Object.create(parentVal)
  return childVal
    ? extend(res, childVal)
    : res
}

/**
 * Events & Watchers.
 *
 * Events & watchers hashes should not overwrite one
 * another, so we merge them as arrays.
 */

strats.watch =
strats.events = function (parentVal, childVal) {
  if (!childVal) return parentVal
  if (!parentVal) return childVal
  var ret = {}
  extend(ret, parentVal)
  for (var key in childVal) {
    var parent = ret[key]
    var child = childVal[key]
    if (parent && !_.isArray(parent)) {
      parent = [parent]
    }
    ret[key] = parent
      ? parent.concat(child)
      : [child]
  }
  return ret
}

/**
 * Other object hashes.
 */

strats.methods =
strats.computed = function (parentVal, childVal) {
  if (!childVal) return parentVal
  if (!parentVal) return childVal
  var ret = Object.create(parentVal)
  extend(ret, childVal)
  return ret
}

/**
 * Default strategy.
 */

var defaultStrat = function (parentVal, childVal) {
  return childVal === undefined
    ? parentVal
    : childVal
}

/**
 * Make sure component options get converted to actual
 * constructors.
 *
 * @param {Object} components
 */

function guardComponents (components) {
  if (components) {
    var def
    for (var key in components) {
      def = components[key]
      if (_.isPlainObject(def)) {
        def.name = key
        components[key] = _.Vue.extend(def)
      }
    }
  }
}

/**
 * Merge two option objects into a new one.
 * Core utility used in both instantiation and inheritance.
 *
 * @param {Object} parent
 * @param {Object} child
 * @param {Vue} [vm] - if vm is present, indicates this is
 *                     an instantiation merge.
 */

exports.mergeOptions = function merge (parent, child, vm) {
  guardComponents(child.components)
  var options = {}
  var key
  if (child.mixins) {
    for (var i = 0, l = child.mixins.length; i < l; i++) {
      parent = merge(parent, child.mixins[i], vm)
    }
  }
  for (key in parent) {
    mergeField(key)
  }
  for (key in child) {
    if (!(parent.hasOwnProperty(key))) {
      mergeField(key)
    }
  }
  function mergeField (key) {
    var strat = strats[key] || defaultStrat
    options[key] = strat(parent[key], child[key], vm, key)
  }
  return options
}

/**
 * Resolve an asset.
 * This function is used because child instances need access
 * to assets defined in its ancestor chain.
 *
 * @param {Object} options
 * @param {String} type
 * @param {String} id
 * @return {Object|Function}
 */

exports.resolveAsset = function resolve (options, type, id) {
  var asset = options[type][id]
  while (!asset && options._parent) {
    options = options._parent.$options
    asset = options[type][id]
  }
  return asset
}
},{"./index":62}],66:[function(require,module,exports){
var _ = require('./util')
var extend = _.extend

/**
 * The exposed Vue constructor.
 *
 * API conventions:
 * - public API methods/properties are prefiexed with `$`
 * - internal methods/properties are prefixed with `_`
 * - non-prefixed properties are assumed to be proxied user
 *   data.
 *
 * @constructor
 * @param {Object} [options]
 * @public
 */

function Vue (options) {
  this._init(options)
}

/**
 * Mixin global API
 */

extend(Vue, require('./api/global'))

/**
 * Vue and every constructor that extends Vue has an
 * associated options object, which can be accessed during
 * compilation steps as `this.constructor.options`.
 *
 * These can be seen as the default options of every
 * Vue instance.
 */

Vue.options = {
  directives  : require('./directives'),
  filters     : require('./filters'),
  transitions : {},
  components  : {},
  elementDirectives: {}
}

/**
 * Build up the prototype
 */

var p = Vue.prototype

/**
 * $data has a setter which does a bunch of
 * teardown/setup work
 */

Object.defineProperty(p, '$data', {
  get: function () {
    return this._data
  },
  set: function (newData) {
    if (newData !== this._data) {
      this._setData(newData)
    }
  }
})

/**
 * Mixin internal instance methods
 */

extend(p, require('./instance/init'))
extend(p, require('./instance/events'))
extend(p, require('./instance/scope'))
extend(p, require('./instance/compile'))
extend(p, require('./instance/misc'))

/**
 * Mixin public API methods
 */

extend(p, require('./api/data'))
extend(p, require('./api/dom'))
extend(p, require('./api/events'))
extend(p, require('./api/child'))
extend(p, require('./api/lifecycle'))

module.exports = _.Vue = Vue
},{"./api/child":6,"./api/data":7,"./api/dom":8,"./api/events":9,"./api/global":10,"./api/lifecycle":11,"./directives":26,"./filters":41,"./instance/compile":42,"./instance/events":43,"./instance/init":44,"./instance/misc":45,"./instance/scope":46,"./util":62}],67:[function(require,module,exports){
var _ = require('./util')
var config = require('./config')
var Observer = require('./observer')
var expParser = require('./parsers/expression')
var batcher = require('./batcher')
var uid = 0

/**
 * A watcher parses an expression, collects dependencies,
 * and fires callback when the expression value changes.
 * This is used for both the $watch() api and directives.
 *
 * @param {Vue} vm
 * @param {String} expression
 * @param {Function} cb
 * @param {Object} options
 *                 - {Array} filters
 *                 - {Boolean} twoWay
 *                 - {Boolean} deep
 *                 - {Boolean} user
 *                 - {Function} [preProcess]
 * @constructor
 */

function Watcher (vm, expression, cb, options) {
  this.vm = vm
  vm._watchers.push(this)
  this.expression = expression
  this.cb = cb
  this.id = ++uid // uid for batching
  this.active = true
  options = options || {}
  this.deep = !!options.deep
  this.user = !!options.user
  this.twoWay = !!options.twoWay
  this.filters = options.filters
  this.preProcess = options.preProcess
  this.deps = []
  this.newDeps = []
  // parse expression for getter/setter
  var res = expParser.parse(expression, options.twoWay)
  this.getter = res.get
  this.setter = res.set
  this.value = this.get()
}

var p = Watcher.prototype

/**
 * Add a dependency to this directive.
 *
 * @param {Dep} dep
 */

p.addDep = function (dep) {
  var newDeps = this.newDeps
  var old = this.deps
  if (_.indexOf(newDeps, dep) < 0) {
    newDeps.push(dep)
    var i = _.indexOf(old, dep)
    if (i < 0) {
      dep.addSub(this)
    } else {
      old[i] = null
    }
  }
}

/**
 * Evaluate the getter, and re-collect dependencies.
 */

p.get = function () {
  this.beforeGet()
  var vm = this.vm
  var value
  try {
    value = this.getter.call(vm, vm)
  } catch (e) {
    if (config.warnExpressionErrors) {
      _.warn(
        'Error when evaluating expression "' +
        this.expression + '"', e
      )
    }
  }
  // "touch" every property so they are all tracked as
  // dependencies for deep watching
  if (this.deep) {
    traverse(value)
  }
  if (this.preProcess) {
    value = this.preProcess(value)
  }
  if (this.filters) {
    value = vm._applyFilters(value, null, this.filters, false)
  }
  this.afterGet()
  return value
}

/**
 * Set the corresponding value with the setter.
 *
 * @param {*} value
 */

p.set = function (value) {
  var vm = this.vm
  if (this.filters) {
    value = vm._applyFilters(
      value, this.value, this.filters, true)
  }
  try {
    this.setter.call(vm, vm, value)
  } catch (e) {
    if (config.warnExpressionErrors) {
      _.warn(
        'Error when evaluating setter "' +
        this.expression + '"', e
      )
    }
  }
}

/**
 * Prepare for dependency collection.
 */

p.beforeGet = function () {
  Observer.target = this
}

/**
 * Clean up for dependency collection.
 */

p.afterGet = function () {
  Observer.target = null
  var i = this.deps.length
  while (i--) {
    var dep = this.deps[i]
    if (dep) {
      dep.removeSub(this)
    }
  }
  this.deps = this.newDeps
  this.newDeps = []
}

/**
 * Subscriber interface.
 * Will be called when a dependency changes.
 */

p.update = function () {
  if (!config.async || config.debug) {
    this.run()
  } else {
    batcher.push(this)
  }
}

/**
 * Batcher job interface.
 * Will be called by the batcher.
 */

p.run = function () {
  if (this.active) {
    var value = this.get()
    if (
      value !== this.value ||
      Array.isArray(value) ||
      this.deep
    ) {
      var oldValue = this.value
      this.value = value
      this.cb(value, oldValue)
    }
  }
}

/**
 * Remove self from all dependencies' subcriber list.
 */

p.teardown = function () {
  if (this.active) {
    // remove self from vm's watcher list
    // we can skip this if the vm if being destroyed
    // which can improve teardown performance.
    if (!this.vm._isBeingDestroyed) {
      this.vm._watchers.$remove(this)
    }
    var i = this.deps.length
    while (i--) {
      this.deps[i].removeSub(this)
    }
    this.active = false
    this.vm = this.cb = this.value = null
  }
}


/**
 * Recrusively traverse an object to evoke all converted
 * getters, so that every nested property inside the object
 * is collected as a "deep" dependency.
 *
 * @param {Object} obj
 */

function traverse (obj) {
  var key, val, i
  for (key in obj) {
    val = obj[key]
    if (_.isArray(val)) {
      i = val.length
      while (i--) traverse(val[i])
    } else if (_.isObject(val)) {
      traverse(val)
    }
  }
}

module.exports = Watcher
},{"./batcher":12,"./config":16,"./observer":49,"./parsers/expression":52,"./util":62}],68:[function(require,module,exports){
/*!
 * Copyright (c) 2014 Chris O'Hara <cohara87@gmail.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

(function (name, definition) {
    if (typeof exports !== 'undefined' && typeof module !== 'undefined') {
        module.exports = definition();
    } else if (typeof define === 'function' && typeof define.amd === 'object') {
        define(definition);
    } else {
        this[name] = definition();
    }
})('validator', function (validator) {

    'use strict';

    validator = { version: '3.39.0' };

    var emailUser = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e])|(\\[\x01-\x09\x0b\x0c\x0d-\x7f])))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))$/i;

    var emailUserUtf8 = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))$/i;

    var displayName = /^(?:[a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~\.]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(?:[a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~\.]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|\s)*<(.+)>$/i;

    var creditCard = /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})$/;

    var isin = /^[A-Z]{2}[0-9A-Z]{9}[0-9]$/;

    var isbn10Maybe = /^(?:[0-9]{9}X|[0-9]{10})$/
      , isbn13Maybe = /^(?:[0-9]{13})$/;

    var ipv4Maybe = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/
      , ipv6Block = /^[0-9A-F]{1,4}$/i;

    var uuid = {
        '3': /^[0-9A-F]{8}-[0-9A-F]{4}-3[0-9A-F]{3}-[0-9A-F]{4}-[0-9A-F]{12}$/i
      , '4': /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i
      , '5': /^[0-9A-F]{8}-[0-9A-F]{4}-5[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i
      , all: /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i
    };

    var alpha = /^[A-Z]+$/i
      , alphanumeric = /^[0-9A-Z]+$/i
      , numeric = /^[-+]?[0-9]+$/
      , int = /^(?:[-+]?(?:0|[1-9][0-9]*))$/
      , float = /^(?:[-+]?(?:[0-9]+))?(?:\.[0-9]*)?(?:[eE][\+\-]?(?:[0-9]+))?$/
      , hexadecimal = /^[0-9A-F]+$/i
      , hexcolor = /^#?([0-9A-F]{3}|[0-9A-F]{6})$/i;

    var ascii = /^[\x00-\x7F]+$/
      , multibyte = /[^\x00-\x7F]/
      , fullWidth = /[^\u0020-\u007E\uFF61-\uFF9F\uFFA0-\uFFDC\uFFE8-\uFFEE0-9a-zA-Z]/
      , halfWidth = /[\u0020-\u007E\uFF61-\uFF9F\uFFA0-\uFFDC\uFFE8-\uFFEE0-9a-zA-Z]/;

    var surrogatePair = /[\uD800-\uDBFF][\uDC00-\uDFFF]/;

    var base64 = /^(?:[A-Z0-9+\/]{4})*(?:[A-Z0-9+\/]{2}==|[A-Z0-9+\/]{3}=|[A-Z0-9+\/]{4})$/i;

    var phones = {
      'zh-CN': /^(\+?0?86\-?)?1[345789]\d{9}$/,
      'en-ZA': /^(\+?27|0)\d{9}$/,
      'en-AU': /^(\+?61|0)4\d{8}$/,
      'en-HK': /^(\+?852\-?)?[569]\d{3}\-?\d{4}$/,
      'fr-FR': /^(\+?33|0)[67]\d{8}$/,
      'pt-PT': /^(\+351)?9[1236]\d{7}$/,
      'el-GR': /^(\+30)?((2\d{9})|(69\d{8}))$/,
      'en-GB': /^(\+?44|0)7\d{9}$/,
      'en-US': /^(\+?1)?[2-9]\d{2}[2-9](?!11)\d{6}$/,
      'en-ZM': /^(\+26)?09[567]\d{7}$/
    };

    validator.extend = function (name, fn) {
        validator[name] = function () {
            var args = Array.prototype.slice.call(arguments);
            args[0] = validator.toString(args[0]);
            return fn.apply(validator, args);
        };
    };

    //Right before exporting the validator object, pass each of the builtins
    //through extend() so that their first argument is coerced to a string
    validator.init = function () {
        for (var name in validator) {
            if (typeof validator[name] !== 'function' || name === 'toString' ||
                    name === 'toDate' || name === 'extend' || name === 'init') {
                continue;
            }
            validator.extend(name, validator[name]);
        }
    };

    validator.toString = function (input) {
        if (typeof input === 'object' && input !== null && input.toString) {
            input = input.toString();
        } else if (input === null || typeof input === 'undefined' || (isNaN(input) && !input.length)) {
            input = '';
        } else if (typeof input !== 'string') {
            input += '';
        }
        return input;
    };

    validator.toDate = function (date) {
        if (Object.prototype.toString.call(date) === '[object Date]') {
            return date;
        }
        date = Date.parse(date);
        return !isNaN(date) ? new Date(date) : null;
    };

    validator.toFloat = function (str) {
        return parseFloat(str);
    };

    validator.toInt = function (str, radix) {
        return parseInt(str, radix || 10);
    };

    validator.toBoolean = function (str, strict) {
        if (strict) {
            return str === '1' || str === 'true';
        }
        return str !== '0' && str !== 'false' && str !== '';
    };

    validator.equals = function (str, comparison) {
        return str === validator.toString(comparison);
    };

    validator.contains = function (str, elem) {
        return str.indexOf(validator.toString(elem)) >= 0;
    };

    validator.matches = function (str, pattern, modifiers) {
        if (Object.prototype.toString.call(pattern) !== '[object RegExp]') {
            pattern = new RegExp(pattern, modifiers);
        }
        return pattern.test(str);
    };

    var default_email_options = {
        allow_display_name: false,
        allow_utf8_local_part: true,
        require_tld: true
    };

    validator.isEmail = function (str, options) {
        options = merge(options, default_email_options);

        if (options.allow_display_name) {
            var display_email = str.match(displayName);
            if (display_email) {
                str = display_email[1];
            }
        } else if (/\s/.test(str)) {
            return false;
        }

        var parts = str.split('@')
          , domain = parts.pop()
          , user = parts.join('@');

        if (!validator.isFQDN(domain, {require_tld: options.require_tld})) {
            return false;
        }

        return options.allow_utf8_local_part ?
            emailUserUtf8.test(user) :
            emailUser.test(user);
    };

    var default_url_options = {
        protocols: [ 'http', 'https', 'ftp' ]
      , require_tld: true
      , require_protocol: false
      , allow_underscores: false
      , allow_trailing_dot: false
      , allow_protocol_relative_urls: false
    };

    validator.isURL = function (url, options) {
        if (!url || url.length >= 2083 || /\s/.test(url)) {
            return false;
        }
        if (url.indexOf('mailto:') === 0) {
            return false;
        }
        options = merge(options, default_url_options);
        var protocol, auth, host, hostname, port,
            port_str, split;
        split = url.split('://');
        if (split.length > 1) {
            protocol = split.shift();
            if (options.protocols.indexOf(protocol) === -1) {
                return false;
            }
        } else if (options.require_protocol) {
            return false;
        }  else if (options.allow_protocol_relative_urls && url.substr(0, 2) === '//') {
            split[0] = url.substr(2);
        }
        url = split.join('://');
        split = url.split('#');
        url = split.shift();

        split = url.split('?');
        url = split.shift();

        split = url.split('/');
        url = split.shift();
        split = url.split('@');
        if (split.length > 1) {
            auth = split.shift();
            if (auth.indexOf(':') >= 0 && auth.split(':').length > 2) {
                return false;
            }
        }
        hostname = split.join('@');
        split = hostname.split(':');
        host = split.shift();
        if (split.length) {
            port_str = split.join(':');
            port = parseInt(port_str, 10);
            if (!/^[0-9]+$/.test(port_str) || port <= 0 || port > 65535) {
                return false;
            }
        }
        if (!validator.isIP(host) && !validator.isFQDN(host, options) &&
                host !== 'localhost') {
            return false;
        }
        if (options.host_whitelist &&
                options.host_whitelist.indexOf(host) === -1) {
            return false;
        }
        if (options.host_blacklist &&
                options.host_blacklist.indexOf(host) !== -1) {
            return false;
        }
        return true;
    };

    validator.isIP = function (str, version) {
        version = validator.toString(version);
        if (!version) {
            return validator.isIP(str, 4) || validator.isIP(str, 6);
        } else if (version === '4') {
            if (!ipv4Maybe.test(str)) {
                return false;
            }
            var parts = str.split('.').sort(function (a, b) {
                return a - b;
            });
            return parts[3] <= 255;
        } else if (version === '6') {
            var blocks = str.split(':');
            var foundOmissionBlock = false; // marker to indicate ::

            if (blocks.length > 8)
                return false;

            // initial or final ::
            if (str === '::') {
                return true;
            } else if (str.substr(0, 2) === '::') {
                blocks.shift();
                blocks.shift();
                foundOmissionBlock = true;
            } else if (str.substr(str.length - 2) === '::') {
                blocks.pop();
                blocks.pop();
                foundOmissionBlock = true;
            }

            for (var i = 0; i < blocks.length; ++i) {
                // test for a :: which can not be at the string start/end
                // since those cases have been handled above
                if (blocks[i] === '' && i > 0 && i < blocks.length -1) {
                    if (foundOmissionBlock)
                        return false; // multiple :: in address
                    foundOmissionBlock = true;
                } else if (!ipv6Block.test(blocks[i])) {
                    return false;
                }
            }

            if (foundOmissionBlock) {
                return blocks.length >= 1;
            } else {
                return blocks.length === 8;
            }
        }
        return false;
    };

    var default_fqdn_options = {
        require_tld: true
      , allow_underscores: false
      , allow_trailing_dot: false
    };

    validator.isFQDN = function (str, options) {
        options = merge(options, default_fqdn_options);

        /* Remove the optional trailing dot before checking validity */
        if (options.allow_trailing_dot && str[str.length - 1] === '.') {
            str = str.substring(0, str.length - 1);
        }
        var parts = str.split('.');
        if (options.require_tld) {
            var tld = parts.pop();
            if (!parts.length || !/^([a-z\u00a1-\uffff]{2,}|xn[a-z0-9-]{2,})$/i.test(tld)) {
                return false;
            }
        }
        for (var part, i = 0; i < parts.length; i++) {
            part = parts[i];
            if (options.allow_underscores) {
                if (part.indexOf('__') >= 0) {
                    return false;
                }
                part = part.replace(/_/g, '');
            }
            if (!/^[a-z\u00a1-\uffff0-9-]+$/i.test(part)) {
                return false;
            }
            if (part[0] === '-' || part[part.length - 1] === '-' ||
                    part.indexOf('---') >= 0) {
                return false;
            }
        }
        return true;
    };

    validator.isAlpha = function (str) {
        return alpha.test(str);
    };

    validator.isAlphanumeric = function (str) {
        return alphanumeric.test(str);
    };

    validator.isNumeric = function (str) {
        return numeric.test(str);
    };

    validator.isHexadecimal = function (str) {
        return hexadecimal.test(str);
    };

    validator.isHexColor = function (str) {
        return hexcolor.test(str);
    };

    validator.isLowercase = function (str) {
        return str === str.toLowerCase();
    };

    validator.isUppercase = function (str) {
        return str === str.toUpperCase();
    };

    validator.isInt = function (str, options) {
        options = options || {};
        return int.test(str) && (!options.hasOwnProperty('min') || str >= options.min) && (!options.hasOwnProperty('max') || str <= options.max);
    };

    validator.isFloat = function (str, options) {
        options = options || {};
        return str !== '' && float.test(str) && (!options.hasOwnProperty('min') || str >= options.min) && (!options.hasOwnProperty('max') || str <= options.max);
    };

    validator.isDivisibleBy = function (str, num) {
        return validator.toFloat(str) % validator.toInt(num) === 0;
    };

    validator.isNull = function (str) {
        return str.length === 0;
    };

    validator.isLength = function (str, min, max) {
        var surrogatePairs = str.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g) || [];
        var len = str.length - surrogatePairs.length;
        return len >= min && (typeof max === 'undefined' || len <= max);
    };

    validator.isByteLength = function (str, min, max) {
        return str.length >= min && (typeof max === 'undefined' || str.length <= max);
    };

    validator.isUUID = function (str, version) {
        var pattern = uuid[version ? version : 'all'];
        return pattern && pattern.test(str);
    };

    validator.isDate = function (str) {
        return !isNaN(Date.parse(str));
    };

    validator.isAfter = function (str, date) {
        var comparison = validator.toDate(date || new Date())
          , original = validator.toDate(str);
        return !!(original && comparison && original > comparison);
    };

    validator.isBefore = function (str, date) {
        var comparison = validator.toDate(date || new Date())
          , original = validator.toDate(str);
        return original && comparison && original < comparison;
    };

    validator.isIn = function (str, options) {
        var i;
        if (Object.prototype.toString.call(options) === '[object Array]') {
            var array = [];
            for (i in options) {
                array[i] = validator.toString(options[i]);
            }
            return array.indexOf(str) >= 0;
        } else if (typeof options === 'object') {
            return options.hasOwnProperty(str);
        } else if (options && typeof options.indexOf === 'function') {
            return options.indexOf(str) >= 0;
        }
        return false;
    };

    validator.isCreditCard = function (str) {
        var sanitized = str.replace(/[^0-9]+/g, '');
        if (!creditCard.test(sanitized)) {
            return false;
        }
        var sum = 0, digit, tmpNum, shouldDouble;
        for (var i = sanitized.length - 1; i >= 0; i--) {
            digit = sanitized.substring(i, (i + 1));
            tmpNum = parseInt(digit, 10);
            if (shouldDouble) {
                tmpNum *= 2;
                if (tmpNum >= 10) {
                    sum += ((tmpNum % 10) + 1);
                } else {
                    sum += tmpNum;
                }
            } else {
                sum += tmpNum;
            }
            shouldDouble = !shouldDouble;
        }
        return !!((sum % 10) === 0 ? sanitized : false);
    };

    validator.isISIN = function (str) {
        if (!isin.test(str)) {
            return false;
        }

        var checksumStr = str.replace(/[A-Z]/g, function(character) {
            return parseInt(character, 36);
        });

        var sum = 0, digit, tmpNum, shouldDouble = true;
        for (var i = checksumStr.length - 2; i >= 0; i--) {
            digit = checksumStr.substring(i, (i + 1));
            tmpNum = parseInt(digit, 10);
            if (shouldDouble) {
                tmpNum *= 2;
                if (tmpNum >= 10) {
                    sum += tmpNum + 1;
                } else {
                    sum += tmpNum;
                }
            } else {
                sum += tmpNum;
            }
            shouldDouble = !shouldDouble;
        }

        return parseInt(str.substr(str.length - 1), 10) === (10000 - sum) % 10;
    };

    validator.isISBN = function (str, version) {
        version = validator.toString(version);
        if (!version) {
            return validator.isISBN(str, 10) || validator.isISBN(str, 13);
        }
        var sanitized = str.replace(/[\s-]+/g, '')
          , checksum = 0, i;
        if (version === '10') {
            if (!isbn10Maybe.test(sanitized)) {
                return false;
            }
            for (i = 0; i < 9; i++) {
                checksum += (i + 1) * sanitized.charAt(i);
            }
            if (sanitized.charAt(9) === 'X') {
                checksum += 10 * 10;
            } else {
                checksum += 10 * sanitized.charAt(9);
            }
            if ((checksum % 11) === 0) {
                return !!sanitized;
            }
        } else  if (version === '13') {
            if (!isbn13Maybe.test(sanitized)) {
                return false;
            }
            var factor = [ 1, 3 ];
            for (i = 0; i < 12; i++) {
                checksum += factor[i % 2] * sanitized.charAt(i);
            }
            if (sanitized.charAt(12) - ((10 - (checksum % 10)) % 10) === 0) {
                return !!sanitized;
            }
        }
        return false;
    };

    validator.isMobilePhone = function(str, locale) {
        if (locale in phones) {
            return phones[locale].test(str);
        }
        return false;
    };

    var default_currency_options = {
        symbol: '$'
      , require_symbol: false
      , allow_space_after_symbol: false
      , symbol_after_digits: false
      , allow_negatives: true
      , parens_for_negatives: false
      , negative_sign_before_digits: false
      , negative_sign_after_digits: false
      , allow_negative_sign_placeholder: false
      , thousands_separator: ','
      , decimal_separator: '.'
      , allow_space_after_digits: false
    };

    validator.isCurrency = function (str, options) {
        options = merge(options, default_currency_options);

        return currencyRegex(options).test(str);
    };

    validator.isJSON = function (str) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    };

    validator.isMultibyte = function (str) {
        return multibyte.test(str);
    };

    validator.isAscii = function (str) {
        return ascii.test(str);
    };

    validator.isFullWidth = function (str) {
        return fullWidth.test(str);
    };

    validator.isHalfWidth = function (str) {
        return halfWidth.test(str);
    };

    validator.isVariableWidth = function (str) {
        return fullWidth.test(str) && halfWidth.test(str);
    };

    validator.isSurrogatePair = function (str) {
        return surrogatePair.test(str);
    };

    validator.isBase64 = function (str) {
        return base64.test(str);
    };

    validator.isMongoId = function (str) {
        return validator.isHexadecimal(str) && str.length === 24;
    };

    validator.ltrim = function (str, chars) {
        var pattern = chars ? new RegExp('^[' + chars + ']+', 'g') : /^\s+/g;
        return str.replace(pattern, '');
    };

    validator.rtrim = function (str, chars) {
        var pattern = chars ? new RegExp('[' + chars + ']+$', 'g') : /\s+$/g;
        return str.replace(pattern, '');
    };

    validator.trim = function (str, chars) {
        var pattern = chars ? new RegExp('^[' + chars + ']+|[' + chars + ']+$', 'g') : /^\s+|\s+$/g;
        return str.replace(pattern, '');
    };

    validator.escape = function (str) {
        return (str.replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\//g, '&#x2F;')
            .replace(/\`/g, '&#96;'));
    };

    validator.stripLow = function (str, keep_new_lines) {
        var chars = keep_new_lines ? '\\x00-\\x09\\x0B\\x0C\\x0E-\\x1F\\x7F' : '\\x00-\\x1F\\x7F';
        return validator.blacklist(str, chars);
    };

    validator.whitelist = function (str, chars) {
        return str.replace(new RegExp('[^' + chars + ']+', 'g'), '');
    };

    validator.blacklist = function (str, chars) {
        return str.replace(new RegExp('[' + chars + ']+', 'g'), '');
    };

    var default_normalize_email_options = {
        lowercase: true
    };

    validator.normalizeEmail = function (email, options) {
        options = merge(options, default_normalize_email_options);
        if (!validator.isEmail(email)) {
            return false;
        }
        var parts = email.split('@', 2);
        parts[1] = parts[1].toLowerCase();
        if (parts[1] === 'gmail.com' || parts[1] === 'googlemail.com') {
            parts[0] = parts[0].toLowerCase().replace(/\./g, '');
            if (parts[0][0] === '+') {
                return false;
            }
            parts[0] = parts[0].split('+')[0];
            parts[1] = 'gmail.com';
        } else if (options.lowercase) {
            parts[0] = parts[0].toLowerCase();
        }
        return parts.join('@');
    };

    function merge(obj, defaults) {
        obj = obj || {};
        for (var key in defaults) {
            if (typeof obj[key] === 'undefined') {
                obj[key] = defaults[key];
            }
        }
        return obj;
    }

    function currencyRegex(options) {
        var symbol = '(\\' + options.symbol.replace(/\./g, '\\.') + ')' + (options.require_symbol ? '' : '?')
            , negative = '-?'
            , whole_dollar_amount_without_sep = '[1-9]\\d*'
            , whole_dollar_amount_with_sep = '[1-9]\\d{0,2}(\\' + options.thousands_separator + '\\d{3})*'
            , valid_whole_dollar_amounts = ['0', whole_dollar_amount_without_sep, whole_dollar_amount_with_sep]
            , whole_dollar_amount = '(' + valid_whole_dollar_amounts.join('|') + ')?'
            , decimal_amount = '(\\' + options.decimal_separator + '\\d{2})?';
        var pattern = whole_dollar_amount + decimal_amount;
        // default is negative sign before symbol, but there are two other options (besides parens)
        if (options.allow_negatives && !options.parens_for_negatives) {
            if (options.negative_sign_after_digits) {
                pattern += negative;
            }
            else if (options.negative_sign_before_digits) {
                pattern = negative + pattern;
            }
        }
        // South African Rand, for example, uses R 123 (space) and R-123 (no space)
        if (options.allow_negative_sign_placeholder) {
            pattern = '( (?!\\-))?' + pattern;
        }
        else if (options.allow_space_after_symbol) {
            pattern = ' ?' + pattern;
        }
        else if (options.allow_space_after_digits) {
            pattern += '( (?!$))?';
        }
        if (options.symbol_after_digits) {
            pattern += symbol;
        } else {
            pattern = symbol + pattern;
        }
        if (options.allow_negatives) {
            if (options.parens_for_negatives) {
                pattern = '(\\(' + pattern + '\\)|' + pattern + ')';
            }
            else if (!(options.negative_sign_before_digits || options.negative_sign_after_digits)) {
                pattern = negative + pattern;
            }
        }
        return new RegExp(
            '^' +
            // ensure there's a dollar and/or decimal amount, and that it doesn't start with a space or a negative sign followed by a space
            '(?!-? )(?=.*\\d)' +
            pattern +
            '$'
        );
    }

    validator.init();

    return validator;

});

},{}],69:[function(require,module,exports){
"use strict";

module.exports = {

    INVALID_TYPE:                           "Expected type {0} but found type {1}",
    INVALID_FORMAT:                         "Object didn't pass validation for format {0}: {1}",
    ENUM_MISMATCH:                          "No enum match for: {0}",
    ANY_OF_MISSING:                         "Data does not match any schemas from 'anyOf'",
    ONE_OF_MISSING:                         "Data does not match any schemas from 'oneOf'",
    ONE_OF_MULTIPLE:                        "Data is valid against more than one schema from 'oneOf'",
    NOT_PASSED:                             "Data matches schema from 'not'",

    // Array errors
    ARRAY_LENGTH_SHORT:                     "Array is too short ({0}), minimum {1}",
    ARRAY_LENGTH_LONG:                      "Array is too long ({0}), maximum {1}",
    ARRAY_UNIQUE:                           "Array items are not unique (indexes {0} and {1})",
    ARRAY_ADDITIONAL_ITEMS:                 "Additional items not allowed",

    // Numeric errors
    MULTIPLE_OF:                            "Value {0} is not a multiple of {1}",
    MINIMUM:                                "Value {0} is less than minimum {1}",
    MINIMUM_EXCLUSIVE:                      "Value {0} is equal or less than exclusive minimum {1}",
    MAXIMUM:                                "Value {0} is greater than maximum {1}",
    MAXIMUM_EXCLUSIVE:                      "Value {0} is equal or greater than exclusive maximum {1}",

    // Object errors
    OBJECT_PROPERTIES_MINIMUM:              "Too few properties defined ({0}), minimum {1}",
    OBJECT_PROPERTIES_MAXIMUM:              "Too many properties defined ({0}), maximum {1}",
    OBJECT_MISSING_REQUIRED_PROPERTY:       "Missing required property: {0}",
    OBJECT_ADDITIONAL_PROPERTIES:           "Additional properties not allowed: {0}",
    OBJECT_DEPENDENCY_KEY:                  "Dependency failed - key must exist: {0} (due to key: {1})",

    // String errors
    MIN_LENGTH:                             "String is too short ({0} chars), minimum {1}",
    MAX_LENGTH:                             "String is too long ({0} chars), maximum {1}",
    PATTERN:                                "String does not match pattern {0}: {1}",

    // Schema validation errors
    KEYWORD_TYPE_EXPECTED:                  "Keyword '{0}' is expected to be of type '{1}'",
    KEYWORD_UNDEFINED_STRICT:               "Keyword '{0}' must be defined in strict mode",
    KEYWORD_UNEXPECTED:                     "Keyword '{0}' is not expected to appear in the schema",
    KEYWORD_MUST_BE:                        "Keyword '{0}' must be {1}",
    KEYWORD_DEPENDENCY:                     "Keyword '{0}' requires keyword '{1}'",
    KEYWORD_PATTERN:                        "Keyword '{0}' is not a valid RegExp pattern: {1}",
    KEYWORD_VALUE_TYPE:                     "Each element of keyword '{0}' array must be a '{1}'",
    UNKNOWN_FORMAT:                         "There is no validation function for format '{0}'",
    CUSTOM_MODE_FORCE_PROPERTIES:           "{0} must define at least one property if present",

    // Remote errors
    REF_UNRESOLVED:                         "Reference has not been resolved during compilation: {0}",
    UNRESOLVABLE_REFERENCE:                 "Reference could not be resolved: {0}",
    SCHEMA_NOT_REACHABLE:                   "Validator was not able to read schema with uri: {0}",
    SCHEMA_TYPE_EXPECTED:                   "Schema is expected to be of type 'object'",
    SCHEMA_NOT_AN_OBJECT:                   "Schema is not an object: {0}",
    ASYNC_TIMEOUT:                          "{0} asynchronous task(s) have timed out after {1} ms",
    PARENT_SCHEMA_VALIDATION_FAILED:        "Schema failed to validate against its parent schema, see inner errors for details.",
    REMOTE_NOT_VALID:                       "Remote reference didn't compile successfully: {0}"

};

},{}],70:[function(require,module,exports){
/*jshint maxlen: false*/

var validator = require("validator");

var FormatValidators = {
    "date": function (date) {
        if (typeof date !== "string") {
            return true;
        }
        // full-date from http://tools.ietf.org/html/rfc3339#section-5.6
        var matches = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(date);
        if (matches === null) {
            return false;
        }
        // var year = matches[1];
        // var month = matches[2];
        // var day = matches[3];
        if (matches[2] < "01" || matches[2] > "12" || matches[3] < "01" || matches[3] > "31") {
            return false;
        }
        return true;
    },
    "date-time": function (dateTime) {
        if (typeof dateTime !== "string") {
            return true;
        }
        // date-time from http://tools.ietf.org/html/rfc3339#section-5.6
        var s = dateTime.toLowerCase().split("t");
        if (!FormatValidators.date(s[0])) {
            return false;
        }
        var matches = /^([0-9]{2}):([0-9]{2}):([0-9]{2})(.[0-9]+)?(z|([+-][0-9]{2}:[0-9]{2}))$/.exec(s[1]);
        if (matches === null) {
            return false;
        }
        // var hour = matches[1];
        // var minute = matches[2];
        // var second = matches[3];
        // var fraction = matches[4];
        // var timezone = matches[5];
        if (matches[1] > "23" || matches[2] > "59" || matches[3] > "59") {
            return false;
        }
        return true;
    },
    "email": function (email) {
        if (typeof email !== "string") {
            return true;
        }
        return validator.isEmail(email, { "require_tld": true });
    },
    "hostname": function (hostname) {
        if (typeof hostname !== "string") {
            return true;
        }
        /*
            http://json-schema.org/latest/json-schema-validation.html#anchor114
            A string instance is valid against this attribute if it is a valid
            representation for an Internet host name, as defined by RFC 1034, section 3.1 [RFC1034].

            http://tools.ietf.org/html/rfc1034#section-3.5

            <digit> ::= any one of the ten digits 0 through 9
            var digit = /[0-9]/;

            <letter> ::= any one of the 52 alphabetic characters A through Z in upper case and a through z in lower case
            var letter = /[a-zA-Z]/;

            <let-dig> ::= <letter> | <digit>
            var letDig = /[0-9a-zA-Z]/;

            <let-dig-hyp> ::= <let-dig> | "-"
            var letDigHyp = /[-0-9a-zA-Z]/;

            <ldh-str> ::= <let-dig-hyp> | <let-dig-hyp> <ldh-str>
            var ldhStr = /[-0-9a-zA-Z]+/;

            <label> ::= <letter> [ [ <ldh-str> ] <let-dig> ]
            var label = /[a-zA-Z](([-0-9a-zA-Z]+)?[0-9a-zA-Z])?/;

            <subdomain> ::= <label> | <subdomain> "." <label>
            var subdomain = /^[a-zA-Z](([-0-9a-zA-Z]+)?[0-9a-zA-Z])?(\.[a-zA-Z](([-0-9a-zA-Z]+)?[0-9a-zA-Z])?)*$/;

            <domain> ::= <subdomain> | " "
            var domain = null;
        */
        var valid = /^[a-zA-Z](([-0-9a-zA-Z]+)?[0-9a-zA-Z])?(\.[a-zA-Z](([-0-9a-zA-Z]+)?[0-9a-zA-Z])?)*$/.test(hostname);
        if (valid) {
            // the sum of all label octets and label lengths is limited to 255.
            if (hostname.length > 255) { return false; }
            // Each node has a label, which is zero to 63 octets in length
            var labels = hostname.split(".");
            for (var i = 0; i < labels.length; i++) { if (labels[i].length > 63) { return false; } }
        }
        return valid;
    },
    "host-name": function (hostname) {
        return FormatValidators.hostname.call(this, hostname);
    },
    "ipv4": function (ipv4) {
        if (typeof ipv4 !== "string") { return true; }
        return validator.isIP(ipv4, 4);
    },
    "ipv6": function (ipv6) {
        if (typeof ipv6 !== "string") { return true; }
        return validator.isIP(ipv6, 6);
    },
    "regex": function (str) {
        try {
            RegExp(str);
            return true;
        } catch (e) {
            return false;
        }
    },
    "uri": function (uri) {
        if (this.options.strictUris) {
            return FormatValidators["strict-uri"].apply(this, arguments);
        }
        // https://github.com/zaggino/z-schema/issues/18
        // RegExp from http://tools.ietf.org/html/rfc3986#appendix-B
        return typeof uri !== "string" || RegExp("^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?").test(uri);
    },
    "strict-uri": function (uri) {
        return typeof uri !== "string" || validator.isURL(uri);
    }
};

module.exports = FormatValidators;

},{"validator":68}],71:[function(require,module,exports){
"use strict";

var FormatValidators  = require("./FormatValidators"),
    Report            = require("./Report"),
    Utils             = require("./Utils");

var JsonValidators = {
    multipleOf: function (report, schema, json) {
        // http://json-schema.org/latest/json-schema-validation.html#rfc.section.5.1.1.2
        if (typeof json !== "number") {
            return;
        }
        if (Utils.whatIs(json / schema.multipleOf) !== "integer") {
            report.addError("MULTIPLE_OF", [json, schema.multipleOf], null, schema.description);
        }
    },
    maximum: function (report, schema, json) {
        // http://json-schema.org/latest/json-schema-validation.html#rfc.section.5.1.2.2
        if (typeof json !== "number") {
            return;
        }
        if (schema.exclusiveMaximum !== true) {
            if (json > schema.maximum) {
                report.addError("MAXIMUM", [json, schema.maximum], null, schema.description);
            }
        } else {
            if (json >= schema.maximum) {
                report.addError("MAXIMUM_EXCLUSIVE", [json, schema.maximum], null, schema.description);
            }
        }
    },
    exclusiveMaximum: function () {
        // covered in maximum
    },
    minimum: function (report, schema, json) {
        // http://json-schema.org/latest/json-schema-validation.html#rfc.section.5.1.3.2
        if (typeof json !== "number") {
            return;
        }
        if (schema.exclusiveMinimum !== true) {
            if (json < schema.minimum) {
                report.addError("MINIMUM", [json, schema.minimum], null, schema.description);
            }
        } else {
            if (json <= schema.minimum) {
                report.addError("MINIMUM_EXCLUSIVE", [json, schema.minimum], null, schema.description);
            }
        }
    },
    exclusiveMinimum: function () {
        // covered in minimum
    },
    maxLength: function (report, schema, json) {
        // http://json-schema.org/latest/json-schema-validation.html#rfc.section.5.2.1.2
        if (typeof json !== "string") {
            return;
        }
        if (Utils.ucs2decode(json).length > schema.maxLength) {
            report.addError("MAX_LENGTH", [json.length, schema.maxLength], null, schema.description);
        }
    },
    minLength: function (report, schema, json) {
        // http://json-schema.org/latest/json-schema-validation.html#rfc.section.5.2.2.2
        if (typeof json !== "string") {
            return;
        }
        if (Utils.ucs2decode(json).length < schema.minLength) {
            report.addError("MIN_LENGTH", [json.length, schema.minLength], null, schema.description);
        }
    },
    pattern: function (report, schema, json) {
        // http://json-schema.org/latest/json-schema-validation.html#rfc.section.5.2.3.2
        if (typeof json !== "string") {
            return;
        }
        if (RegExp(schema.pattern).test(json) === false) {
            report.addError("PATTERN", [schema.pattern, json], null, schema.description);
        }
    },
    additionalItems: function (report, schema, json) {
        // http://json-schema.org/latest/json-schema-validation.html#rfc.section.5.3.1.2
        if (!Array.isArray(json)) {
            return;
        }
        // if the value of "additionalItems" is boolean value false and the value of "items" is an array,
        // the json is valid if its size is less than, or equal to, the size of "items".
        if (schema.additionalItems === false && Array.isArray(schema.items)) {
            if (json.length > schema.items.length) {
                report.addError("ARRAY_ADDITIONAL_ITEMS", null, null, schema.description);
            }
        }
    },
    items: function () { /*report, schema, json*/
        // covered in additionalItems
    },
    maxItems: function (report, schema, json) {
        // http://json-schema.org/latest/json-schema-validation.html#rfc.section.5.3.2.2
        if (!Array.isArray(json)) {
            return;
        }
        if (json.length > schema.maxItems) {
            report.addError("ARRAY_LENGTH_LONG", [json.length, schema.maxItems], null, schema.description);
        }
    },
    minItems: function (report, schema, json) {
        // http://json-schema.org/latest/json-schema-validation.html#rfc.section.5.3.3.2
        if (!Array.isArray(json)) {
            return;
        }
        if (json.length < schema.minItems) {
            report.addError("ARRAY_LENGTH_SHORT", [json.length, schema.minItems], null, schema.description);
        }
    },
    uniqueItems: function (report, schema, json) {
        // http://json-schema.org/latest/json-schema-validation.html#rfc.section.5.3.4.2
        if (!Array.isArray(json)) {
            return;
        }
        if (schema.uniqueItems === true) {
            var matches = [];
            if (Utils.isUniqueArray(json, matches) === false) {
                report.addError("ARRAY_UNIQUE", matches, null, schema.description);
            }
        }
    },
    maxProperties: function (report, schema, json) {
        // http://json-schema.org/latest/json-schema-validation.html#rfc.section.5.4.1.2
        if (Utils.whatIs(json) !== "object") {
            return;
        }
        var keysCount = Object.keys(json).length;
        if (keysCount > schema.maxProperties) {
            report.addError("OBJECT_PROPERTIES_MAXIMUM", [keysCount, schema.maxProperties], null, schema.description);
        }
    },
    minProperties: function (report, schema, json) {
        // http://json-schema.org/latest/json-schema-validation.html#rfc.section.5.4.2.2
        if (Utils.whatIs(json) !== "object") {
            return;
        }
        var keysCount = Object.keys(json).length;
        if (keysCount < schema.minProperties) {
            report.addError("OBJECT_PROPERTIES_MINIMUM", [keysCount, schema.minProperties], null, schema.description);
        }
    },
    required: function (report, schema, json) {
        // http://json-schema.org/latest/json-schema-validation.html#rfc.section.5.4.3.2
        if (Utils.whatIs(json) !== "object") {
            return;
        }
        var idx = schema.required.length;
        while (idx--) {
            var requiredPropertyName = schema.required[idx];
            if (json[requiredPropertyName] === undefined) {
                report.addError("OBJECT_MISSING_REQUIRED_PROPERTY", [requiredPropertyName], null, schema.description);
            }
        }
    },
    additionalProperties: function (report, schema, json) {
        // covered in properties and patternProperties
        if (schema.properties === undefined && schema.patternProperties === undefined) {
            return JsonValidators.properties.call(this, report, schema, json);
        }
    },
    patternProperties: function (report, schema, json) {
        // covered in properties
        if (schema.properties === undefined) {
            return JsonValidators.properties.call(this, report, schema, json);
        }
    },
    properties: function (report, schema, json) {
        // http://json-schema.org/latest/json-schema-validation.html#rfc.section.5.4.4.2
        if (Utils.whatIs(json) !== "object") {
            return;
        }
        var properties = schema.properties !== undefined ? schema.properties : {};
        var patternProperties = schema.patternProperties !== undefined ? schema.patternProperties : {};
        if (schema.additionalProperties === false) {
            // The property set of the json to validate.
            var s = Object.keys(json);
            // The property set from "properties".
            var p = Object.keys(properties);
            // The property set from "patternProperties".
            var pp = Object.keys(patternProperties);
            // remove from "s" all elements of "p", if any;
            s = Utils.difference(s, p);
            // for each regex in "pp", remove all elements of "s" which this regex matches.
            var idx = pp.length;
            while (idx--) {
                var regExp = RegExp(pp[idx]),
                    idx2 = s.length;
                while (idx2--) {
                    if (regExp.test(s[idx2]) === true) {
                        s.splice(idx2, 1);
                    }
                }
            }
            // Validation of the json succeeds if, after these two steps, set "s" is empty.
            if (s.length > 0) {
                report.addError("OBJECT_ADDITIONAL_PROPERTIES", [s], null, schema.description);
            }
        }
    },
    dependencies: function (report, schema, json) {
        // http://json-schema.org/latest/json-schema-validation.html#rfc.section.5.4.5.2
        if (Utils.whatIs(json) !== "object") {
            return;
        }

        var keys = Object.keys(schema.dependencies),
            idx = keys.length;

        while (idx--) {
            // iterate all dependencies
            var dependencyName = keys[idx];
            if (json[dependencyName]) {
                var dependencyDefinition = schema.dependencies[dependencyName];
                if (Utils.whatIs(dependencyDefinition) === "object") {
                    // if dependency is a schema, validate against this schema
                    exports.validate.call(this, report, dependencyDefinition, json);
                } else { // Array
                    // if dependency is an array, object needs to have all properties in this array
                    var idx2 = dependencyDefinition.length;
                    while (idx2--) {
                        var requiredPropertyName = dependencyDefinition[idx2];
                        if (json[requiredPropertyName] === undefined) {
                            report.addError("OBJECT_DEPENDENCY_KEY", [requiredPropertyName, dependencyName], null, schema.description);
                        }
                    }
                }
            }
        }
    },
    enum: function (report, schema, json) {
        // http://json-schema.org/latest/json-schema-validation.html#rfc.section.5.5.1.2
        var match = false,
            idx = schema.enum.length;
        while (idx--) {
            if (Utils.areEqual(json, schema.enum[idx])) {
                match = true;
                break;
            }
        }
        if (match === false) {
            report.addError("ENUM_MISMATCH", [json], null, schema.description);
        }
    },
    /*
    type: function (report, schema, json) {
        // http://json-schema.org/latest/json-schema-validation.html#rfc.section.5.5.2.2
        // type is handled before this is called so ignore
    },
    */
    allOf: function (report, schema, json) {
        // http://json-schema.org/latest/json-schema-validation.html#rfc.section.5.5.3.2
        var idx = schema.allOf.length;
        while (idx--) {
            if (exports.validate.call(this, report, schema.allOf[idx], json) === false) {
                break;
            }
        }
    },
    anyOf: function (report, schema, json) {
        // http://json-schema.org/latest/json-schema-validation.html#rfc.section.5.5.4.2
        var subReports = [],
            passed = false,
            idx = schema.anyOf.length;

        while (idx-- && passed === false) {
            var subReport = new Report(report);
            subReports.push(subReport);
            passed = exports.validate.call(this, subReport, schema.anyOf[idx], json);
        }

        if (passed === false) {
            report.addError("ANY_OF_MISSING", undefined, subReports, schema.description);
        }
    },
    oneOf: function (report, schema, json) {
        // http://json-schema.org/latest/json-schema-validation.html#rfc.section.5.5.5.2
        var passes = 0,
            subReports = [],
            idx = schema.oneOf.length;

        while (idx--) {
            var subReport = new Report(report, { maxErrors: 1 });
            subReports.push(subReport);
            if (exports.validate.call(this, subReport, schema.oneOf[idx], json) === true) {
                passes++;
            }
        }

        if (passes === 0) {
            report.addError("ONE_OF_MISSING", undefined, subReports, schema.description);
        } else if (passes > 1) {
            report.addError("ONE_OF_MULTIPLE", null, null, schema.description);
        }
    },
    not: function (report, schema, json) {
        // http://json-schema.org/latest/json-schema-validation.html#rfc.section.5.5.6.2
        var subReport = new Report(report);
        if (exports.validate.call(this, subReport, schema.not, json) === true) {
            report.addError("NOT_PASSED", null, null, schema.description);
        }
    },
    definitions: function () { /*report, schema, json*/
        // http://json-schema.org/latest/json-schema-validation.html#rfc.section.5.5.7.2
        // nothing to do here
    },
    format: function (report, schema, json) {
        // http://json-schema.org/latest/json-schema-validation.html#rfc.section.7.2
        var formatValidatorFn = FormatValidators[schema.format];
        if (typeof formatValidatorFn === "function") {
            if (formatValidatorFn.length === 2) {
                // async
                report.addAsyncTask(formatValidatorFn, [json], function (result) {
                    if (result !== true) {
                        report.addError("INVALID_FORMAT", [schema.format, json], null, schema.description);
                    }
                });
            } else {
                // sync
                if (formatValidatorFn.call(this, json) !== true) {
                    report.addError("INVALID_FORMAT", [schema.format, json], null, schema.description);
                }
            }
        } else {
            report.addError("UNKNOWN_FORMAT", [schema.format], null, schema.description);
        }
    }
};

var recurseArray = function (report, schema, json) {
    // http://json-schema.org/latest/json-schema-validation.html#rfc.section.8.2

    var idx = json.length;

    // If "items" is an array, this situation, the schema depends on the index:
    // if the index is less than, or equal to, the size of "items",
    // the child instance must be valid against the corresponding schema in the "items" array;
    // otherwise, it must be valid against the schema defined by "additionalItems".
    if (Array.isArray(schema.items)) {

        while (idx--) {
            // equal to doesnt make sense here
            if (idx < schema.items.length) {
                report.path.push(idx.toString());
                exports.validate.call(this, report, schema.items[idx], json[idx]);
                report.path.pop();
            } else {
                // might be boolean, so check that it's an object
                if (typeof schema.additionalItems === "object") {
                    report.path.push(idx.toString());
                    exports.validate.call(this, report, schema.additionalItems, json[idx]);
                    report.path.pop();
                }
            }
        }

    } else if (typeof schema.items === "object") {

        // If items is a schema, then the child instance must be valid against this schema,
        // regardless of its index, and regardless of the value of "additionalItems".
        while (idx--) {
            report.path.push(idx.toString());
            exports.validate.call(this, report, schema.items, json[idx]);
            report.path.pop();
        }

    }
};

var recurseObject = function (report, schema, json) {
    // http://json-schema.org/latest/json-schema-validation.html#rfc.section.8.3

    // If "additionalProperties" is absent, it is considered present with an empty schema as a value.
    // In addition, boolean value true is considered equivalent to an empty schema.
    var additionalProperties = schema.additionalProperties;
    if (additionalProperties === true || additionalProperties === undefined) {
        additionalProperties = {};
    }

    // p - The property set from "properties".
    var p = schema.properties ? Object.keys(schema.properties) : [];

    // pp - The property set from "patternProperties". Elements of this set will be called regexes for convenience.
    var pp = schema.patternProperties ? Object.keys(schema.patternProperties) : [];

    // m - The property name of the child.
    var keys = Object.keys(json),
        idx = keys.length;

    while (idx--) {
        var m = keys[idx],
            propertyValue = json[m];

        // s - The set of schemas for the child instance.
        var s = [];

        // 1. If set "p" contains value "m", then the corresponding schema in "properties" is added to "s".
        if (p.indexOf(m) !== -1) {
            s.push(schema.properties[m]);
        }

        // 2. For each regex in "pp", if it matches "m" successfully, the corresponding schema in "patternProperties" is added to "s".
        var idx2 = pp.length;
        while (idx2--) {
            var regexString = pp[idx2];
            if (RegExp(regexString).test(m) === true) {
                s.push(schema.patternProperties[regexString]);
            }
        }

        // 3. The schema defined by "additionalProperties" is added to "s" if and only if, at this stage, "s" is empty.
        if (s.length === 0 && additionalProperties !== false) {
            s.push(additionalProperties);
        }

        // we are passing tests even without this assert because this is covered by properties check
        // if s is empty in this stage, no additionalProperties are allowed
        // report.expect(s.length !== 0, 'E001', m);

        // Instance property value must pass all schemas from s
        idx2 = s.length;
        while (idx2--) {
            report.path.push(m);
            exports.validate.call(this, report, s[idx2], propertyValue);
            report.path.pop();
        }
    }
};

exports.validate = function (report, schema, json) {

    report.commonErrorMessage = "JSON_OBJECT_VALIDATION_FAILED";

    // check if schema is an object
    var to = Utils.whatIs(schema);
    if (to !== "object") {
        report.addError("SCHEMA_NOT_AN_OBJECT", [to], null, schema.description);
        return false;
    }

    // check if schema is empty, everything is valid against empty schema
    var keys = Object.keys(schema);
    if (keys.length === 0) {
        return true;
    }

    // this method can be called recursively, so we need to remember our root
    var isRoot = false;
    if (!report.rootSchema) {
        report.rootSchema = schema;
        isRoot = true;
    }

    // follow schema.$ref keys
    if (schema.$ref !== undefined) {
        // avoid infinite loop with maxRefs
        var maxRefs = 99;
        while (schema.$ref && maxRefs > 0) {
            if (!schema.__$refResolved) {
                report.addError("REF_UNRESOLVED", [schema.$ref], null, schema.description);
                break;
            } else if (schema.__$refResolved === schema) {
                break;
            } else {
                schema = schema.__$refResolved;
                keys = Object.keys(schema);
            }
            maxRefs--;
        }
        if (maxRefs === 0) {
            throw new Error("Circular dependency by $ref references!");
        }
    }

    // type checking first
    // http://json-schema.org/latest/json-schema-validation.html#rfc.section.5.5.2.2
    var jsonType = Utils.whatIs(json);
    if (schema.type) {
        if (typeof schema.type === "string") {
            if (jsonType !== schema.type && (jsonType !== "integer" || schema.type !== "number")) {
                report.addError("INVALID_TYPE", [schema.type, jsonType], null, schema.description);
                if (this.options.breakOnFirstError) {
                    return false;
                }
            }
        } else {
            if (schema.type.indexOf(jsonType) === -1 && (jsonType !== "integer" || schema.type.indexOf("number") === -1)) {
                report.addError("INVALID_TYPE", [schema.type, jsonType], null, schema.description);
                if (this.options.breakOnFirstError) {
                    return false;
                }
            }
        }
    }

    // now iterate all the keys in schema and execute validation methods
    var idx = keys.length;
    while (idx--) {
        if (JsonValidators[keys[idx]]) {
            JsonValidators[keys[idx]].call(this, report, schema, json);
            if (report.errors.length && this.options.breakOnFirstError) { break; }
        }
    }

    if (report.errors.length === 0 || this.options.breakOnFirstError === false) {
        if (jsonType === "array") {
            recurseArray.call(this, report, schema, json);
        } else if (jsonType === "object") {
            recurseObject.call(this, report, schema, json);
        }
    }

    // we don't need the root pointer anymore
    if (isRoot) {
        report.rootSchema = undefined;
    }

    // return valid just to be able to break at some code points
    return report.errors.length === 0;

};

},{"./FormatValidators":70,"./Report":73,"./Utils":77}],72:[function(require,module,exports){
// Number.isFinite polyfill
// http://people.mozilla.org/~jorendorff/es6-draft.html#sec-number.isfinite
if (typeof Number.isFinite !== "function") {
    Number.isFinite = function isFinite(value) {
        // 1. If Type(number) is not Number, return false.
        if (typeof value !== "number") {
            return false;
        }
        // 2. If number is NaN, +∞, or −∞, return false.
        if (value !== value || value === Infinity || value === -Infinity) {
            return false;
        }
        // 3. Otherwise, return true.
        return true;
    };
}

},{}],73:[function(require,module,exports){
(function (process){
"use strict";

var Errors = require("./Errors");
var Utils  = require("./Utils");

function Report(parentOrOptions, reportOptions) {
    this.parentReport = parentOrOptions instanceof Report ?
                            parentOrOptions :
                            undefined;

    this.options = parentOrOptions instanceof Report ?
                       parentOrOptions.options :
                       parentOrOptions || {};

    this.reportOptions = reportOptions || {};

    this.errors = [];
    this.path = [];
    this.asyncTasks = [];
}

Report.prototype.isValid = function () {
    if (this.asyncTasks.length > 0) {
        throw new Error("Async tasks pending, can't answer isValid");
    }
    return this.errors.length === 0;
};

Report.prototype.addAsyncTask = function (fn, args, asyncTaskResultProcessFn) {
    this.asyncTasks.push([fn, args, asyncTaskResultProcessFn]);
};

Report.prototype.processAsyncTasks = function (timeout, callback) {

    var validationTimeout = timeout || 2000,
        tasksCount        = this.asyncTasks.length,
        idx               = tasksCount,
        timedOut          = false,
        self              = this;

    function finish() {
        process.nextTick(function () {
            var valid = self.errors.length === 0,
                err   = valid ? undefined : self.errors;
            callback(err, valid);
        });
    }

    function respond(asyncTaskResultProcessFn) {
        return function (asyncTaskResult) {
            if (timedOut) { return; }
            asyncTaskResultProcessFn(asyncTaskResult);
            if (--tasksCount === 0) {
                finish();
            }
        };
    }

    if (tasksCount === 0 || this.errors.length > 0) {
        finish();
        return;
    }

    while (idx--) {
        var task = this.asyncTasks[idx];
        task[0].apply(null, task[1].concat(respond(task[2])));
    }

    setTimeout(function () {
        if (tasksCount > 0) {
            timedOut = true;
            self.addError("ASYNC_TIMEOUT", [tasksCount, validationTimeout]);
            callback(self.errors, false);
        }
    }, validationTimeout);

};

Report.prototype.getPath = function () {
    var path = [];
    if (this.parentReport) {
        path = path.concat(this.parentReport.path);
    }
    path = path.concat(this.path);

    if (this.options.reportPathAsArray !== true) {
        // Sanitize the path segments (http://tools.ietf.org/html/rfc6901#section-4)
        path = "#/" + path.map(function (segment) {

            if (Utils.isAbsoluteUri(segment)) {
                return "uri(" + segment + ")";
            }

            return segment.replace("~", "~0").replace("/", "~1");
        }).join("/");
    }
    return path;
};

Report.prototype.addError = function (errorCode, params, subReports, schemaDescription) {
    if (this.errors.length >= this.reportOptions.maxErrors) {
        return;
    }

    if (!errorCode) { throw new Error("No errorCode passed into addError()"); }
    if (!Errors[errorCode]) { throw new Error("No errorMessage known for code " + errorCode); }

    params = params || [];

    var idx = params.length,
        errorMessage = Errors[errorCode];
    while (idx--) {
        var whatIs = Utils.whatIs(params[idx]);
        var param = (whatIs === "object" || whatIs === "null") ? JSON.stringify(params[idx]) : params[idx];
        errorMessage = errorMessage.replace("{" + idx + "}", param);
    }

    var err = {
        code: errorCode,
        params: params,
        message: errorMessage,
        path: this.getPath()
    };

    if (schemaDescription) {
        err.description = schemaDescription;
    }

    if (subReports != null) {
        if (!Array.isArray(subReports)) {
            subReports = [subReports];
        }
        err.inner = [];
        idx = subReports.length;
        while (idx--) {
            var subReport = subReports[idx],
                idx2 = subReport.errors.length;
            while (idx2--) {
                err.inner.push(subReport.errors[idx2]);
            }
        }
        if (err.inner.length === 0) {
            err.inner = undefined;
        }
    }

    this.errors.push(err);
};

module.exports = Report;

}).call(this,require('_process'))

},{"./Errors":69,"./Utils":77,"_process":3}],74:[function(require,module,exports){
"use strict";

var Report              = require("./Report");
var SchemaCompilation   = require("./SchemaCompilation");
var SchemaValidation    = require("./SchemaValidation");
var Utils               = require("./Utils");

function decodeJSONPointer(str) {
    // http://tools.ietf.org/html/draft-ietf-appsawg-json-pointer-07#section-3
    return decodeURIComponent(str).replace(/~[0-1]/g, function (x) {
        return x === "~1" ? "/" : "~";
    });
}

function getRemotePath(uri) {
    var io = uri.indexOf("#");
    return io === -1 ? uri : uri.slice(0, io);
}

function getQueryPath(uri) {
    var io = uri.indexOf("#");
    var res = io === -1 ? undefined : uri.slice(io + 1);
    // WARN: do not slice slash, #/ means take root and go down from it
    // if (res && res[0] === "/") { res = res.slice(1); }
    return res;
}

function findId(schema, id) {
    // process only arrays and objects
    if (typeof schema !== "object" || schema === null) {
        return;
    }

    // no id means root so return itself
    if (!id) {
        return schema;
    }

    if (schema.id) {
        if (schema.id === id || schema.id[0] === "#" && schema.id.substring(1) === id) {
            return schema;
        }
    }

    var idx, result;
    if (Array.isArray(schema)) {
        idx = schema.length;
        while (idx--) {
            result = findId(schema[idx], id);
            if (result) { return result; }
        }
    } else {
        var keys = Object.keys(schema);
        idx = keys.length;
        while (idx--) {
            var k = keys[idx];
            if (k.indexOf("__$") === 0) {
                continue;
            }
            result = findId(schema[k], id);
            if (result) { return result; }
        }
    }
}

exports.cacheSchemaByUri = function (uri, schema) {
    var remotePath = getRemotePath(uri);
    if (remotePath) {
        this.cache[remotePath] = schema;
    }
};

exports.removeFromCacheByUri = function (uri) {
    var remotePath = getRemotePath(uri);
    if (remotePath) {
        this.cache[remotePath] = undefined;
    }
};

exports.checkCacheForUri = function (uri) {
    var remotePath = getRemotePath(uri);
    return remotePath ? this.cache[remotePath] != null : false;
};

exports.getSchema = function (report, schema) {
    if (typeof schema === "object") {
        schema = exports.getSchemaByReference.call(this, report, schema);
    }
    if (typeof schema === "string") {
        schema = exports.getSchemaByUri.call(this, report, schema);
    }
    return schema;
};

exports.getSchemaByReference = function (report, key) {
    var i = this.referenceCache.length;
    while (i--) {
        if (this.referenceCache[i][0] === key) {
            return this.referenceCache[i][1];
        }
    }
    // not found
    var schema = Utils.cloneDeep(key);
    this.referenceCache.push([key, schema]);
    return schema;
};

exports.getSchemaByUri = function (report, uri, root) {
    var remotePath = getRemotePath(uri),
        queryPath = getQueryPath(uri),
        result = remotePath ? this.cache[remotePath] : root;

    if (result && remotePath) {
        // we need to avoid compiling schemas in a recursive loop
        var compileRemote = result !== root;
        // now we need to compile and validate resolved schema (in case it's not already)
        if (compileRemote) {

            report.path.push(remotePath);

            var remoteReport = new Report(report);
            if (SchemaCompilation.compileSchema.call(this, remoteReport, result)) {
                SchemaValidation.validateSchema.call(this, remoteReport, result);
            }
            var remoteReportIsValid = remoteReport.isValid();
            if (!remoteReportIsValid) {
                report.addError("REMOTE_NOT_VALID", [uri], remoteReport);
            }

            report.path.pop();

            if (!remoteReportIsValid) {
                return undefined;
            }
        }
    }

    if (result && queryPath) {
        var parts = queryPath.split("/");
        for (var idx = 0, lim = parts.length; idx < lim; idx++) {
            var key = decodeJSONPointer(parts[idx]);
            if (idx === 0) { // it's an id
                result = findId(result, key);
            } else { // it's a path behind id
                result = result[key];
            }
        }
    }

    return result;
};

exports.getRemotePath = getRemotePath;

},{"./Report":73,"./SchemaCompilation":75,"./SchemaValidation":76,"./Utils":77}],75:[function(require,module,exports){
"use strict";

var Report      = require("./Report");
var SchemaCache = require("./SchemaCache");
var Utils       = require("./Utils");

function mergeReference(scope, ref) {
    if (Utils.isAbsoluteUri(ref)) {
        return ref;
    }

    var joinedScope = scope.join(""),
        isScopeAbsolute = Utils.isAbsoluteUri(joinedScope),
        isScopeRelative = Utils.isRelativeUri(joinedScope),
        isRefRelative = Utils.isRelativeUri(ref),
        toRemove;

    if (isScopeAbsolute && isRefRelative) {
        toRemove = joinedScope.match(/\/[^\/]*$/);
        if (toRemove) {
            joinedScope = joinedScope.slice(0, toRemove.index + 1);
        }
    } else if (isScopeRelative && isRefRelative) {
        joinedScope = "";
    } else {
        toRemove = joinedScope.match(/[^#/]+$/);
        if (toRemove) {
            joinedScope = joinedScope.slice(0, toRemove.index);
        }
    }

    var res = joinedScope + ref;
    res = res.replace(/##/, "#");
    return res;
}

function collectReferences(obj, results, scope, path) {
    results = results || [];
    scope = scope || [];
    path = path || [];

    if (typeof obj !== "object" || obj === null) {
        return results;
    }

    if (typeof obj.id === "string") {
        scope.push(obj.id);
    }

    if (typeof obj.$ref === "string" && typeof obj.__$refResolved === "undefined") {
        results.push({
            ref: mergeReference(scope, obj.$ref),
            key: "$ref",
            obj: obj,
            path: path.slice(0)
        });
    }
    if (typeof obj.$schema === "string" && typeof obj.__$schemaResolved === "undefined") {
        results.push({
            ref: mergeReference(scope, obj.$schema),
            key: "$schema",
            obj: obj,
            path: path.slice(0)
        });
    }

    var idx;
    if (Array.isArray(obj)) {
        idx = obj.length;
        while (idx--) {
            path.push(idx.toString());
            collectReferences(obj[idx], results, scope, path);
            path.pop();
        }
    } else {
        var keys = Object.keys(obj);
        idx = keys.length;
        while (idx--) {
            // do not recurse through resolved references and other z-schema props
            if (keys[idx].indexOf("__$") === 0) { continue; }
            path.push(keys[idx]);
            collectReferences(obj[keys[idx]], results, scope, path);
            path.pop();
        }
    }

    if (typeof obj.id === "string") {
        scope.pop();
    }

    return results;
}

var compileArrayOfSchemasLoop = function (mainReport, arr) {
    var idx = arr.length,
        compiledCount = 0;

    while (idx--) {

        // try to compile each schema separately
        var report = new Report(mainReport);
        var isValid = exports.compileSchema.call(this, report, arr[idx]);
        if (isValid) { compiledCount++; }

        // copy errors to report
        mainReport.errors = mainReport.errors.concat(report.errors);

    }

    return compiledCount;
};

function findId(arr, id) {
    var idx = arr.length;
    while (idx--) {
        if (arr[idx].id === id) {
            return arr[idx];
        }
    }
    return null;
}

var compileArrayOfSchemas = function (report, arr) {

    var compiled = 0,
        lastLoopCompiled;

    do {

        // remove all UNRESOLVABLE_REFERENCE errors before compiling array again
        var idx = report.errors.length;
        while (idx--) {
            if (report.errors[idx].code === "UNRESOLVABLE_REFERENCE") {
                report.errors.splice(idx, 1);
            }
        }

        // remember how many were compiled in the last loop
        lastLoopCompiled = compiled;

        // count how many are compiled now
        compiled = compileArrayOfSchemasLoop.call(this, report, arr);

        // fix __$missingReferences if possible
        idx = arr.length;
        while (idx--) {
            var sch = arr[idx];
            if (sch.__$missingReferences) {
                var idx2 = sch.__$missingReferences.length;
                while (idx2--) {
                    var refObj = sch.__$missingReferences[idx2];
                    var response = findId(arr, refObj.ref);
                    if (response) {
                        // this might create circular references
                        refObj.obj["__" + refObj.key + "Resolved"] = response;
                        // it's resolved now so delete it
                        sch.__$missingReferences.splice(idx2, 1);
                    }
                }
                if (sch.__$missingReferences.length === 0) {
                    delete sch.__$missingReferences;
                }
            }
        }

        // keep repeating if not all compiled and at least one more was compiled in the last loop
    } while (compiled !== arr.length && compiled !== lastLoopCompiled);

    return report.isValid();

};

exports.compileSchema = function (report, schema) {

    report.commonErrorMessage = "SCHEMA_COMPILATION_FAILED";

    // if schema is a string, assume it's a uri
    if (typeof schema === "string") {
        var loadedSchema = SchemaCache.getSchemaByUri.call(this, report, schema);
        if (!loadedSchema) {
            report.addError("SCHEMA_NOT_REACHABLE", [schema]);
            return false;
        }
        schema = loadedSchema;
    }

    // if schema is an array, assume it's an array of schemas
    if (Array.isArray(schema)) {
        return compileArrayOfSchemas.call(this, report, schema);
    }

    // if we have an id than it should be cached already (if this instance has compiled it)
    if (schema.__$compiled && schema.id && SchemaCache.checkCacheForUri.call(this, schema.id) === false) {
        schema.__$compiled = undefined;
    }

    // do not re-compile schemas
    if (schema.__$compiled) {
        return true;
    }

    if (schema.id) {
        // add this to our schemaCache (before compilation in case we have references including id)
        SchemaCache.cacheSchemaByUri.call(this, schema.id, schema);
    }

    // delete all __$missingReferences from previous compilation attempts
    var isValidExceptReferences = report.isValid();
    delete schema.__$missingReferences;

    // collect all references that need to be resolved - $ref and $schema
    var refs = collectReferences.call(this, schema),
        idx = refs.length;
    while (idx--) {
        // resolve all the collected references into __xxxResolved pointer
        var refObj = refs[idx];
        var response = SchemaCache.getSchemaByUri.call(this, report, refObj.ref, schema);

        // we can try to use custom schemaReader if available
        if (!response) {
            var schemaReader = this.getSchemaReader();
            if (schemaReader) {
                // it's supposed to return a valid schema
                var s = schemaReader(refObj.ref);
                if (s) {
                    // it needs to have the id
                    s.id = refObj.ref;
                    // try to compile the schema
                    var subreport = new Report(report);
                    if (!exports.compileSchema.call(this, subreport, s)) {
                        // copy errors to report
                        report.errors = report.errors.concat(subreport.errors);
                    } else {
                        response = SchemaCache.getSchemaByUri.call(this, report, refObj.ref, schema);
                    }
                }
            }
        }

        if (!response) {

            var isAbsolute = Utils.isAbsoluteUri(refObj.ref);
            var isDownloaded = false;
            var ignoreUnresolvableRemotes = this.options.ignoreUnresolvableReferences === true;

            if (isAbsolute) {
                // we shouldn't add UNRESOLVABLE_REFERENCE for schemas we already have downloaded
                // and set through setRemoteReference method
                isDownloaded = SchemaCache.checkCacheForUri.call(this, refObj.ref);
            }

            if (!isAbsolute || !isDownloaded && !ignoreUnresolvableRemotes) {
                Array.prototype.push.apply(report.path, refObj.path);
                report.addError("UNRESOLVABLE_REFERENCE", [refObj.ref]);
                report.path.slice(0, -refObj.path.length);

                // pusblish unresolved references out
                if (isValidExceptReferences) {
                    schema.__$missingReferences = schema.__$missingReferences || [];
                    schema.__$missingReferences.push(refObj);
                }
            }
        }
        // this might create circular references
        refObj.obj["__" + refObj.key + "Resolved"] = response;
    }

    var isValid = report.isValid();
    if (isValid) {
        schema.__$compiled = true;
    } else {
        if (schema.id) {
            // remove this schema from schemaCache because it failed to compile
            SchemaCache.removeFromCacheByUri.call(this, schema.id);
        }
    }
    return isValid;

};

},{"./Report":73,"./SchemaCache":74,"./Utils":77}],76:[function(require,module,exports){
"use strict";

var FormatValidators = require("./FormatValidators"),
    JsonValidation   = require("./JsonValidation"),
    Report           = require("./Report"),
    Utils            = require("./Utils");

var SchemaValidators = {
    $ref: function (report, schema) {
        // http://tools.ietf.org/html/draft-ietf-appsawg-json-pointer-07
        // http://tools.ietf.org/html/draft-pbryan-zyp-json-ref-03
        if (typeof schema.$ref !== "string") {
            report.addError("KEYWORD_TYPE_EXPECTED", ["$ref", "string"]);
        }
    },
    $schema: function (report, schema) {
        // http://json-schema.org/latest/json-schema-core.html#rfc.section.6
        if (typeof schema.$schema !== "string") {
            report.addError("KEYWORD_TYPE_EXPECTED", ["$schema", "string"]);
        }
    },
    multipleOf: function (report, schema) {
        // http://json-schema.org/latest/json-schema-validation.html#rfc.section.5.1.1.1
        if (typeof schema.multipleOf !== "number") {
            report.addError("KEYWORD_TYPE_EXPECTED", ["multipleOf", "number"]);
        } else if (schema.multipleOf <= 0) {
            report.addError("KEYWORD_MUST_BE", ["multipleOf", "strictly greater than 0"]);
        }
    },
    maximum: function (report, schema) {
        // http://json-schema.org/latest/json-schema-validation.html#rfc.section.5.1.2.1
        if (typeof schema.maximum !== "number") {
            report.addError("KEYWORD_TYPE_EXPECTED", ["maximum", "number"]);
        }
    },
    exclusiveMaximum: function (report, schema) {
        // http://json-schema.org/latest/json-schema-validation.html#rfc.section.5.1.2.1
        if (typeof schema.exclusiveMaximum !== "boolean") {
            report.addError("KEYWORD_TYPE_EXPECTED", ["exclusiveMaximum", "boolean"]);
        } else if (schema.maximum === undefined) {
            report.addError("KEYWORD_DEPENDENCY", ["exclusiveMaximum", "maximum"]);
        }
    },
    minimum: function (report, schema) {
        // http://json-schema.org/latest/json-schema-validation.html#rfc.section.5.1.3.1
        if (typeof schema.minimum !== "number") {
            report.addError("KEYWORD_TYPE_EXPECTED", ["minimum", "number"]);
        }
    },
    exclusiveMinimum: function (report, schema) {
        // http://json-schema.org/latest/json-schema-validation.html#rfc.section.5.1.3.1
        if (typeof schema.exclusiveMinimum !== "boolean") {
            report.addError("KEYWORD_TYPE_EXPECTED", ["exclusiveMinimum", "boolean"]);
        } else if (schema.minimum === undefined) {
            report.addError("KEYWORD_DEPENDENCY", ["exclusiveMinimum", "minimum"]);
        }
    },
    maxLength: function (report, schema) {
        // http://json-schema.org/latest/json-schema-validation.html#rfc.section.5.2.1.1
        if (Utils.whatIs(schema.maxLength) !== "integer") {
            report.addError("KEYWORD_TYPE_EXPECTED", ["maxLength", "integer"]);
        } else if (schema.maxLength < 0) {
            report.addError("KEYWORD_MUST_BE", ["maxLength", "greater than, or equal to 0"]);
        }
    },
    minLength: function (report, schema) {
        // http://json-schema.org/latest/json-schema-validation.html#rfc.section.5.2.2.1
        if (Utils.whatIs(schema.minLength) !== "integer") {
            report.addError("KEYWORD_TYPE_EXPECTED", ["minLength", "integer"]);
        } else if (schema.minLength < 0) {
            report.addError("KEYWORD_MUST_BE", ["minLength", "greater than, or equal to 0"]);
        }
    },
    pattern: function (report, schema) {
        // http://json-schema.org/latest/json-schema-validation.html#rfc.section.5.2.3.1
        if (typeof schema.pattern !== "string") {
            report.addError("KEYWORD_TYPE_EXPECTED", ["pattern", "string"]);
        } else {
            try {
                RegExp(schema.pattern);
            } catch (e) {
                report.addError("KEYWORD_PATTERN", ["pattern", schema.pattern]);
            }
        }
    },
    additionalItems: function (report, schema) {
        // http://json-schema.org/latest/json-schema-validation.html#rfc.section.5.3.1.1
        var type = Utils.whatIs(schema.additionalItems);
        if (type !== "boolean" && type !== "object") {
            report.addError("KEYWORD_TYPE_EXPECTED", ["additionalItems", ["boolean", "object"]]);
        } else if (type === "object") {
            report.path.push("additionalItems");
            exports.validateSchema.call(this, report, schema.additionalItems);
            report.path.pop();
        }
    },
    items: function (report, schema) {
        // http://json-schema.org/latest/json-schema-validation.html#rfc.section.5.3.1.1
        var type = Utils.whatIs(schema.items);

        if (type === "object") {
            report.path.push("items");
            exports.validateSchema.call(this, report, schema.items);
            report.path.pop();
        } else if (type === "array") {
            var idx = schema.items.length;
            while (idx--) {
                report.path.push("items");
                report.path.push(idx.toString());
                exports.validateSchema.call(this, report, schema.items[idx]);
                report.path.pop();
                report.path.pop();
            }
        } else {
            report.addError("KEYWORD_TYPE_EXPECTED", ["items", ["array", "object"]]);
        }

        // custom - strict mode
        if (this.options.forceAdditional === true && schema.additionalItems === undefined && Array.isArray(schema.items)) {
            report.addError("KEYWORD_UNDEFINED_STRICT", ["additionalItems"]);
        }
        // custome - assume defined false mode
        if (this.options.assumeAdditional === true && schema.additionalItems === undefined && Array.isArray(schema.items)) {
            schema.additionalItems = false;
        }
    },
    maxItems: function (report, schema) {
        // http://json-schema.org/latest/json-schema-validation.html#rfc.section.5.3.2.1
        if (typeof schema.maxItems !== "number") {
            report.addError("KEYWORD_TYPE_EXPECTED", ["maxItems", "integer"]);
        } else if (schema.maxItems < 0) {
            report.addError("KEYWORD_MUST_BE", ["maxItems", "greater than, or equal to 0"]);
        }
    },
    minItems: function (report, schema) {
        // http://json-schema.org/latest/json-schema-validation.html#rfc.section.5.3.3.1
        if (Utils.whatIs(schema.minItems) !== "integer") {
            report.addError("KEYWORD_TYPE_EXPECTED", ["minItems", "integer"]);
        } else if (schema.minItems < 0) {
            report.addError("KEYWORD_MUST_BE", ["minItems", "greater than, or equal to 0"]);
        }
    },
    uniqueItems: function (report, schema) {
        // http://json-schema.org/latest/json-schema-validation.html#rfc.section.5.3.4.1
        if (typeof schema.uniqueItems !== "boolean") {
            report.addError("KEYWORD_TYPE_EXPECTED", ["uniqueItems", "boolean"]);
        }
    },
    maxProperties: function (report, schema) {
        // http://json-schema.org/latest/json-schema-validation.html#rfc.section.5.4.1.1
        if (Utils.whatIs(schema.maxProperties) !== "integer") {
            report.addError("KEYWORD_TYPE_EXPECTED", ["maxProperties", "integer"]);
        } else if (schema.maxProperties < 0) {
            report.addError("KEYWORD_MUST_BE", ["maxProperties", "greater than, or equal to 0"]);
        }
    },
    minProperties: function (report, schema) {
        // http://json-schema.org/latest/json-schema-validation.html#rfc.section.5.4.2.1
        if (Utils.whatIs(schema.minProperties) !== "integer") {
            report.addError("KEYWORD_TYPE_EXPECTED", ["minProperties", "integer"]);
        } else if (schema.minProperties < 0) {
            report.addError("KEYWORD_MUST_BE", ["minProperties", "greater than, or equal to 0"]);
        }
    },
    required: function (report, schema) {
        // http://json-schema.org/latest/json-schema-validation.html#rfc.section.5.4.3.1
        if (Utils.whatIs(schema.required) !== "array") {
            report.addError("KEYWORD_TYPE_EXPECTED", ["required", "array"]);
        } else if (schema.required.length === 0) {
            report.addError("KEYWORD_MUST_BE", ["required", "an array with at least one element"]);
        } else {
            var idx = schema.required.length;
            while (idx--) {
                if (typeof schema.required[idx] !== "string") {
                    report.addError("KEYWORD_VALUE_TYPE", ["required", "string"]);
                }
            }
            if (Utils.isUniqueArray(schema.required) === false) {
                report.addError("KEYWORD_MUST_BE", ["required", "an array with unique items"]);
            }
        }
    },
    additionalProperties: function (report, schema) {
        // http://json-schema.org/latest/json-schema-validation.html#rfc.section.5.4.4.1
        var type = Utils.whatIs(schema.additionalProperties);
        if (type !== "boolean" && type !== "object") {
            report.addError("KEYWORD_TYPE_EXPECTED", ["additionalProperties", ["boolean", "object"]]);
        } else if (type === "object") {
            report.path.push("additionalProperties");
            exports.validateSchema.call(this, report, schema.additionalProperties);
            report.path.pop();
        }
    },
    properties: function (report, schema) {
        // http://json-schema.org/latest/json-schema-validation.html#rfc.section.5.4.4.1
        if (Utils.whatIs(schema.properties) !== "object") {
            report.addError("KEYWORD_TYPE_EXPECTED", ["properties", "object"]);
            return;
        }

        var keys = Object.keys(schema.properties),
            idx = keys.length;
        while (idx--) {
            var key = keys[idx],
                val = schema.properties[key];
            report.path.push("properties");
            report.path.push(key);
            exports.validateSchema.call(this, report, val);
            report.path.pop();
            report.path.pop();
        }

        // custom - strict mode
        if (this.options.forceAdditional === true && schema.additionalProperties === undefined) {
            report.addError("KEYWORD_UNDEFINED_STRICT", ["additionalProperties"]);
        }
        // custome - assume defined false mode
        if (this.options.assumeAdditional === true && schema.additionalProperties === undefined) {
            schema.additionalProperties = false;
        }
        // custom - forceProperties
        if (this.options.forceProperties === true && keys.length === 0) {
            report.addError("CUSTOM_MODE_FORCE_PROPERTIES", ["properties"]);
        }
    },
    patternProperties: function (report, schema) {
        // http://json-schema.org/latest/json-schema-validation.html#rfc.section.5.4.4.1
        if (Utils.whatIs(schema.patternProperties) !== "object") {
            report.addError("KEYWORD_TYPE_EXPECTED", ["patternProperties", "object"]);
            return;
        }

        var keys = Object.keys(schema.patternProperties),
            idx = keys.length;
        while (idx--) {
            var key = keys[idx],
                val = schema.patternProperties[key];
            try {
                RegExp(key);
            } catch (e) {
                report.addError("KEYWORD_PATTERN", ["patternProperties", key]);
            }
            report.path.push("patternProperties");
            report.path.push(key.toString());
            exports.validateSchema.call(this, report, val);
            report.path.pop();
            report.path.pop();
        }

        // custom - forceProperties
        if (this.options.forceProperties === true && keys.length === 0) {
            report.addError("CUSTOM_MODE_FORCE_PROPERTIES", ["patternProperties"]);
        }
    },
    dependencies: function (report, schema) {
        // http://json-schema.org/latest/json-schema-validation.html#rfc.section.5.4.5.1
        if (Utils.whatIs(schema.dependencies) !== "object") {
            report.addError("KEYWORD_TYPE_EXPECTED", ["dependencies", "object"]);
        } else {
            var keys = Object.keys(schema.dependencies),
                idx = keys.length;
            while (idx--) {
                var schemaKey = keys[idx],
                    schemaDependency = schema.dependencies[schemaKey],
                    type = Utils.whatIs(schemaDependency);

                if (type === "object") {
                    report.path.push("dependencies");
                    report.path.push(schemaKey);
                    exports.validateSchema.call(this, report, schemaDependency);
                    report.path.pop();
                    report.path.pop();
                } else if (type === "array") {
                    var idx2 = schemaDependency.length;
                    if (idx2 === 0) {
                        report.addError("KEYWORD_MUST_BE", ["dependencies", "not empty array"]);
                    }
                    while (idx2--) {
                        if (typeof schemaDependency[idx2] !== "string") {
                            report.addError("KEYWORD_VALUE_TYPE", ["dependensices", "string"]);
                        }
                    }
                    if (Utils.isUniqueArray(schemaDependency) === false) {
                        report.addError("KEYWORD_MUST_BE", ["dependencies", "an array with unique items"]);
                    }
                } else {
                    report.addError("KEYWORD_VALUE_TYPE", ["dependencies", "object or array"]);
                }
            }
        }
    },
    enum: function (report, schema) {
        // http://json-schema.org/latest/json-schema-validation.html#rfc.section.5.5.1.1
        if (Array.isArray(schema.enum) === false) {
            report.addError("KEYWORD_TYPE_EXPECTED", ["enum", "array"]);
        } else if (schema.enum.length === 0) {
            report.addError("KEYWORD_MUST_BE", ["enum", "an array with at least one element"]);
        } else if (Utils.isUniqueArray(schema.enum) === false) {
            report.addError("KEYWORD_MUST_BE", ["enum", "an array with unique elements"]);
        }
    },
    type: function (report, schema) {
        // http://json-schema.org/latest/json-schema-validation.html#rfc.section.5.5.2.1
        var primitiveTypes = ["array", "boolean", "integer", "number", "null", "object", "string"],
            primitiveTypeStr = primitiveTypes.join(","),
            isArray = Array.isArray(schema.type);

        if (isArray) {
            var idx = schema.type.length;
            while (idx--) {
                if (primitiveTypes.indexOf(schema.type[idx]) === -1) {
                    report.addError("KEYWORD_TYPE_EXPECTED", ["type", primitiveTypeStr]);
                }
            }
            if (Utils.isUniqueArray(schema.type) === false) {
                report.addError("KEYWORD_MUST_BE", ["type", "an object with unique properties"]);
            }
        } else if (typeof schema.type === "string") {
            if (primitiveTypes.indexOf(schema.type) === -1) {
                report.addError("KEYWORD_TYPE_EXPECTED", ["type", primitiveTypeStr]);
            }
        } else {
            report.addError("KEYWORD_TYPE_EXPECTED", ["type", ["string", "array"]]);
        }

        if (this.options.noEmptyStrings === true) {
            if (schema.type === "string" || isArray && schema.type.indexOf("string") !== -1) {
                if (schema.minLength === undefined &&
                    schema.enum === undefined &&
                    schema.format === undefined) {

                    schema.minLength = 1;
                }
            }
        }
        if (this.options.noEmptyArrays === true) {
            if (schema.type === "array" || isArray && schema.type.indexOf("array") !== -1) {
                if (schema.minItems === undefined) {
                    schema.minItems = 1;
                }
            }
        }
        if (this.options.forceProperties === true) {
            if (schema.type === "object" || isArray && schema.type.indexOf("object") !== -1) {
                if (schema.properties === undefined && schema.patternProperties === undefined) {
                    report.addError("KEYWORD_UNDEFINED_STRICT", ["properties"]);
                }
            }
        }
        if (this.options.forceItems === true) {
            if (schema.type === "array" || isArray && schema.type.indexOf("array") !== -1) {
                if (schema.items === undefined) {
                    report.addError("KEYWORD_UNDEFINED_STRICT", ["items"]);
                }
            }
        }
        if (this.options.forceMinItems === true) {
            if (schema.type === "array" || isArray && schema.type.indexOf("array") !== -1) {
                if (schema.minItems === undefined) {
                    report.addError("KEYWORD_UNDEFINED_STRICT", ["minItems"]);
                }
            }
        }
        if (this.options.forceMaxItems === true) {
            if (schema.type === "array" || isArray && schema.type.indexOf("array") !== -1) {
                if (schema.maxItems === undefined) {
                    report.addError("KEYWORD_UNDEFINED_STRICT", ["maxItems"]);
                }
            }
        }
        if (this.options.forceMinLength === true) {
            if (schema.type === "string" || isArray && schema.type.indexOf("string") !== -1) {
                if (schema.minLength === undefined &&
                    schema.format === undefined &&
                    schema.enum === undefined &&
                    schema.pattern === undefined) {
                    report.addError("KEYWORD_UNDEFINED_STRICT", ["minLength"]);
                }
            }
        }
        if (this.options.forceMaxLength === true) {
            if (schema.type === "string" || isArray && schema.type.indexOf("string") !== -1) {
                if (schema.maxLength === undefined &&
                    schema.format === undefined &&
                    schema.enum === undefined &&
                    schema.pattern === undefined) {
                    report.addError("KEYWORD_UNDEFINED_STRICT", ["maxLength"]);
                }
            }
        }
    },
    allOf: function (report, schema) {
        // http://json-schema.org/latest/json-schema-validation.html#rfc.section.5.5.3.1
        if (Array.isArray(schema.allOf) === false) {
            report.addError("KEYWORD_TYPE_EXPECTED", ["allOf", "array"]);
        } else if (schema.allOf.length === 0) {
            report.addError("KEYWORD_MUST_BE", ["allOf", "an array with at least one element"]);
        } else {
            var idx = schema.allOf.length;
            while (idx--) {
                report.path.push("allOf");
                report.path.push(idx.toString());
                exports.validateSchema.call(this, report, schema.allOf[idx]);
                report.path.pop();
                report.path.pop();
            }
        }
    },
    anyOf: function (report, schema) {
        // http://json-schema.org/latest/json-schema-validation.html#rfc.section.5.5.4.1
        if (Array.isArray(schema.anyOf) === false) {
            report.addError("KEYWORD_TYPE_EXPECTED", ["anyOf", "array"]);
        } else if (schema.anyOf.length === 0) {
            report.addError("KEYWORD_MUST_BE", ["anyOf", "an array with at least one element"]);
        } else {
            var idx = schema.anyOf.length;
            while (idx--) {
                report.path.push("anyOf");
                report.path.push(idx.toString());
                exports.validateSchema.call(this, report, schema.anyOf[idx]);
                report.path.pop();
                report.path.pop();
            }
        }
    },
    oneOf: function (report, schema) {
        // http://json-schema.org/latest/json-schema-validation.html#rfc.section.5.5.5.1
        if (Array.isArray(schema.oneOf) === false) {
            report.addError("KEYWORD_TYPE_EXPECTED", ["oneOf", "array"]);
        } else if (schema.oneOf.length === 0) {
            report.addError("KEYWORD_MUST_BE", ["oneOf", "an array with at least one element"]);
        } else {
            var idx = schema.oneOf.length;
            while (idx--) {
                report.path.push("oneOf");
                report.path.push(idx.toString());
                exports.validateSchema.call(this, report, schema.oneOf[idx]);
                report.path.pop();
                report.path.pop();
            }
        }
    },
    not: function (report, schema) {
        // http://json-schema.org/latest/json-schema-validation.html#rfc.section.5.5.6.1
        if (Utils.whatIs(schema.not) !== "object") {
            report.addError("KEYWORD_TYPE_EXPECTED", ["not", "object"]);
        } else {
            report.path.push("not");
            exports.validateSchema.call(this, report, schema.not);
            report.path.pop();
        }
    },
    definitions: function (report, schema) {
        // http://json-schema.org/latest/json-schema-validation.html#rfc.section.5.5.7.1
        if (Utils.whatIs(schema.definitions) !== "object") {
            report.addError("KEYWORD_TYPE_EXPECTED", ["definitions", "object"]);
        } else {
            var keys = Object.keys(schema.definitions),
                idx = keys.length;
            while (idx--) {
                var key = keys[idx],
                    val = schema.definitions[key];
                report.path.push("definitions");
                report.path.push(key);
                exports.validateSchema.call(this, report, val);
                report.path.pop();
                report.path.pop();
            }
        }
    },
    format: function (report, schema) {
        if (typeof schema.format !== "string") {
            report.addError("KEYWORD_TYPE_EXPECTED", ["format", "string"]);
        } else {
            if (FormatValidators[schema.format] === undefined) {
                report.addError("UNKNOWN_FORMAT", [schema.format]);
            }
        }
    },
    id: function (report, schema) {
        // http://json-schema.org/latest/json-schema-core.html#rfc.section.7.2
        if (typeof schema.id !== "string") {
            report.addError("KEYWORD_TYPE_EXPECTED", ["id", "string"]);
        }
    },
    title: function (report, schema) {
        // http://json-schema.org/latest/json-schema-validation.html#rfc.section.6.1
        if (typeof schema.title !== "string") {
            report.addError("KEYWORD_TYPE_EXPECTED", ["title", "string"]);
        }
    },
    description: function (report, schema) {
        // http://json-schema.org/latest/json-schema-validation.html#rfc.section.6.1
        if (typeof schema.description !== "string") {
            report.addError("KEYWORD_TYPE_EXPECTED", ["description", "string"]);
        }
    },
    "default": function (/* report, schema */) {
        // http://json-schema.org/latest/json-schema-validation.html#rfc.section.6.2
        // There are no restrictions placed on the value of this keyword.
    }
};

var validateArrayOfSchemas = function (report, arr) {
    var idx = arr.length;
    while (idx--) {
        exports.validateSchema.call(this, report, arr[idx]);
    }
    return report.isValid();
};

exports.validateSchema = function (report, schema) {

    report.commonErrorMessage = "SCHEMA_VALIDATION_FAILED";

    // if schema is an array, assume it's an array of schemas
    if (Array.isArray(schema)) {
        return validateArrayOfSchemas.call(this, report, schema);
    }

    // do not revalidate schema that has already been validated once
    if (schema.__$validated) {
        return true;
    }

    // if $schema is present, this schema should validate against that $schema
    var hasParentSchema = schema.$schema && schema.id !== schema.$schema;
    if (hasParentSchema) {
        if (schema.__$schemaResolved && schema.__$schemaResolved !== schema) {
            var subReport = new Report(report);
            var valid = JsonValidation.validate.call(this, subReport, schema.__$schemaResolved, schema);
            if (valid === false) {
                report.addError("PARENT_SCHEMA_VALIDATION_FAILED", null, subReport);
            }
        } else {
            if (this.options.ignoreUnresolvableReferences !== true) {
                report.addError("REF_UNRESOLVED", [schema.$schema]);
            }
        }
    }

    if (this.options.noTypeless === true) {
        // issue #36 - inherit type to anyOf, oneOf, allOf if noTypeless is defined
        if (schema.type !== undefined) {
            var schemas = [];
            if (Array.isArray(schema.anyOf)) { schemas = schemas.concat(schema.anyOf); }
            if (Array.isArray(schema.oneOf)) { schemas = schemas.concat(schema.oneOf); }
            if (Array.isArray(schema.allOf)) { schemas = schemas.concat(schema.allOf); }
            schemas.forEach(function (sch) {
                if (!sch.type) { sch.type = schema.type; }
            });
        }
        // end issue #36
        if (schema.enum === undefined &&
            schema.type === undefined &&
            schema.anyOf === undefined &&
            schema.oneOf === undefined &&
            schema.not === undefined &&
            schema.$ref === undefined) {
            report.addError("KEYWORD_UNDEFINED_STRICT", ["type"]);
        }
    }

    var keys = Object.keys(schema),
        idx = keys.length;
    while (idx--) {
        var key = keys[idx];
        if (key.indexOf("__") === 0) { continue; }
        if (SchemaValidators[key] !== undefined) {
            SchemaValidators[key].call(this, report, schema);
        } else if (!hasParentSchema) {
            if (this.options.noExtraKeywords === true) {
                report.addError("KEYWORD_UNEXPECTED", [key]);
            }
        }
    }

    var isValid = report.isValid();
    if (isValid) {
        schema.__$validated = true;
    }
    return isValid;

};

},{"./FormatValidators":70,"./JsonValidation":71,"./Report":73,"./Utils":77}],77:[function(require,module,exports){
"use strict";

exports.isAbsoluteUri = function (uri) {
    return /^https?:\/\//.test(uri);
};

exports.isRelativeUri = function (uri) {
    // relative URIs that end with a hash sign, issue #56
    return /.+#/.test(uri);
};

exports.whatIs = function (what) {

    var to = typeof what;

    if (to === "object") {
        if (what === null) {
            return "null";
        }
        if (Array.isArray(what)) {
            return "array";
        }
        return "object"; // typeof what === 'object' && what === Object(what) && !Array.isArray(what);
    }

    if (to === "number") {
        if (Number.isFinite(what)) {
            if (what % 1 === 0) {
                return "integer";
            } else {
                return "number";
            }
        }
        if (Number.isNaN(what)) {
            return "not-a-number";
        }
        return "unknown-number";
    }

    return to; // undefined, boolean, string, function

};

exports.areEqual = function areEqual(json1, json2) {
    // http://json-schema.org/latest/json-schema-core.html#rfc.section.3.6

    // Two JSON values are said to be equal if and only if:
    // both are nulls; or
    // both are booleans, and have the same value; or
    // both are strings, and have the same value; or
    // both are numbers, and have the same mathematical value; or
    if (json1 === json2) {
        return true;
    }

    var i, len;

    // both are arrays, and:
    if (Array.isArray(json1) && Array.isArray(json2)) {
        // have the same number of items; and
        if (json1.length !== json2.length) {
            return false;
        }
        // items at the same index are equal according to this definition; or
        len = json1.length;
        for (i = 0; i < len; i++) {
            if (!areEqual(json1[i], json2[i])) {
                return false;
            }
        }
        return true;
    }

    // both are objects, and:
    if (exports.whatIs(json1) === "object" && exports.whatIs(json2) === "object") {
        // have the same set of property names; and
        var keys1 = Object.keys(json1);
        var keys2 = Object.keys(json2);
        if (!areEqual(keys1, keys2)) {
            return false;
        }
        // values for a same property name are equal according to this definition.
        len = keys1.length;
        for (i = 0; i < len; i++) {
            if (!areEqual(json1[keys1[i]], json2[keys1[i]])) {
                return false;
            }
        }
        return true;
    }

    return false;
};

exports.isUniqueArray = function (arr, indexes) {
    var i, j, l = arr.length;
    for (i = 0; i < l; i++) {
        for (j = i + 1; j < l; j++) {
            if (exports.areEqual(arr[i], arr[j])) {
                if (indexes) { indexes.push(i, j); }
                return false;
            }
        }
    }
    return true;
};

exports.difference = function (bigSet, subSet) {
    var arr = [],
        idx = bigSet.length;
    while (idx--) {
        if (subSet.indexOf(bigSet[idx]) === -1) {
            arr.push(bigSet[idx]);
        }
    }
    return arr;
};

// NOT a deep version of clone
exports.clone = function (src) {
    if (typeof src !== "object" || src === null) { return src; }
    var res, idx;
    if (Array.isArray(src)) {
        res = [];
        idx = src.length;
        while (idx--) {
            res[idx] = src[idx];
        }
    } else {
        res = {};
        var keys = Object.keys(src);
        idx = keys.length;
        while (idx--) {
            var key = keys[idx];
            res[key] = src[key];
        }
    }
    return res;
};

exports.cloneDeep = function (src) {
    var visited = [], cloned = [];
    function cloneDeep(src) {
        if (typeof src !== "object" || src === null) { return src; }
        var res, idx, cidx;

        cidx = visited.indexOf(src);
        if (cidx !== -1) { return cloned[cidx]; }

        visited.push(src);
        if (Array.isArray(src)) {
            res = [];
            cloned.push(res);
            idx = src.length;
            while (idx--) {
                res[idx] = cloneDeep(src[idx]);
            }
        } else {
            res = {};
            cloned.push(res);
            var keys = Object.keys(src);
            idx = keys.length;
            while (idx--) {
                var key = keys[idx];
                res[key] = cloneDeep(src[key]);
            }
        }
        return res;
    }
    return cloneDeep(src);
};

/*
  following function comes from punycode.js library
  see: https://github.com/bestiejs/punycode.js
*/
/*jshint -W016*/
/**
 * Creates an array containing the numeric code points of each Unicode
 * character in the string. While JavaScript uses UCS-2 internally,
 * this function will convert a pair of surrogate halves (each of which
 * UCS-2 exposes as separate characters) into a single code point,
 * matching UTF-16.
 * @see `punycode.ucs2.encode`
 * @see <https://mathiasbynens.be/notes/javascript-encoding>
 * @memberOf punycode.ucs2
 * @name decode
 * @param {String} string The Unicode input string (UCS-2).
 * @returns {Array} The new array of code points.
 */
exports.ucs2decode = function (string) {
    var output = [],
        counter = 0,
        length = string.length,
        value,
        extra;
    while (counter < length) {
        value = string.charCodeAt(counter++);
        if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
            // high surrogate, and there is a next character
            extra = string.charCodeAt(counter++);
            if ((extra & 0xFC00) == 0xDC00) { // low surrogate
                output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
            } else {
                // unmatched surrogate; only append this code unit, in case the next
                // code unit is the high surrogate of a surrogate pair
                output.push(value);
                counter--;
            }
        } else {
            output.push(value);
        }
    }
    return output;
};
/*jshint +W016*/

},{}],78:[function(require,module,exports){
(function (process){
"use strict";

require("./Polyfills");
var Report            = require("./Report");
var FormatValidators  = require("./FormatValidators");
var JsonValidation    = require("./JsonValidation");
var SchemaCache       = require("./SchemaCache");
var SchemaCompilation = require("./SchemaCompilation");
var SchemaValidation  = require("./SchemaValidation");
var Utils             = require("./Utils");
var Draft4Schema      = require("./schemas/schema.json");
var Draft4HyperSchema = require("./schemas/hyper-schema.json");

/*
    default options
*/
var defaultOptions = {
    // default timeout for all async tasks
    asyncTimeout: 2000,
    // force additionalProperties and additionalItems to be defined on "object" and "array" types
    forceAdditional: false,
    // assume additionalProperties and additionalItems are defined as "false" where appropriate
    assumeAdditional: false,
    // force items to be defined on "array" types
    forceItems: false,
    // force minItems to be defined on "array" types
    forceMinItems: false,
    // force maxItems to be defined on "array" types
    forceMaxItems: false,
    // force minLength to be defined on "string" types
    forceMinLength: false,
    // force maxLength to be defined on "string" types
    forceMaxLength: false,
    // force properties or patternProperties to be defined on "object" types
    forceProperties: false,
    // ignore references that cannot be resolved (remote schemas) // TODO: make sure this is only for remote schemas, not local ones
    ignoreUnresolvableReferences: false,
    // disallow usage of keywords that this validator can't handle
    noExtraKeywords: false,
    // disallow usage of schema's without "type" defined
    noTypeless: false,
    // disallow zero length strings in validated objects
    noEmptyStrings: false,
    // disallow zero length arrays in validated objects
    noEmptyArrays: false,
    // forces "uri" format to be in fully rfc3986 compliant
    strictUris: false,
    // turn on some of the above
    strictMode: false,
    // report error paths as an array of path segments to get to the offending node
    reportPathAsArray: false,
    // stops validation as soon as an error is found, true by default but can be turned off
    breakOnFirstError: true
};

/*
    constructor
*/
function ZSchema(options) {
    this.cache = {};
    this.referenceCache = [];

    this.setRemoteReference("http://json-schema.org/draft-04/schema", Draft4Schema);
    this.setRemoteReference("http://json-schema.org/draft-04/hyper-schema", Draft4HyperSchema);

    // options
    if (typeof options === "object") {
        var keys = Object.keys(options),
            idx = keys.length;
        while (idx--) {
            var key = keys[idx];
            if (defaultOptions[key] === undefined) {
                throw new Error("Unexpected option passed to constructor: " + key);
            }
        }
        this.options = options;
    } else {
        this.options = Utils.clone(defaultOptions);
    }

    if (this.options.strictMode === true) {
        this.options.forceAdditional  = true;
        this.options.forceItems       = true;
        this.options.forceMaxLength   = true;
        this.options.forceProperties  = true;
        this.options.noExtraKeywords  = true;
        this.options.noTypeless       = true;
        this.options.noEmptyStrings   = true;
        this.options.noEmptyArrays    = true;
    }

}

/*
    instance methods
*/
ZSchema.prototype.compileSchema = function (schema) {
    var report = new Report(this.options);

    schema = SchemaCache.getSchema.call(this, report, schema);

    SchemaCompilation.compileSchema.call(this, report, schema);

    this.lastReport = report;
    return report.isValid();
};
ZSchema.prototype.validateSchema = function (schema) {
    if (Array.isArray(schema) && schema.length === 0) {
        throw new Error(".validateSchema was called with an empty array");
    }

    var report = new Report(this.options);

    schema = SchemaCache.getSchema.call(this, report, schema);

    var compiled = SchemaCompilation.compileSchema.call(this, report, schema);
    if (compiled) { SchemaValidation.validateSchema.call(this, report, schema); }

    this.lastReport = report;
    return report.isValid();
};
ZSchema.prototype.validate = function (json, schema, callback) {
    var whatIs = Utils.whatIs(schema);
    if (whatIs !== "string" && whatIs !== "object") {
        var e = new Error("Invalid .validate call - schema must be an string or object but " + whatIs + " was passed!");
        if (callback) {
            process.nextTick(function () {
                callback(e, false);
            });
            return;
        }
        throw e;
    }

    var foundError = false;
    var report = new Report(this.options);

    schema = SchemaCache.getSchema.call(this, report, schema);

    var compiled = false;
    if (!foundError) {
        compiled = SchemaCompilation.compileSchema.call(this, report, schema);
    }
    if (!compiled) {
        this.lastReport = report;
        foundError = true;
    }

    var validated = false;
    if (!foundError) {
        validated = SchemaValidation.validateSchema.call(this, report, schema);
    }
    if (!validated) {
        this.lastReport = report;
        foundError = true;
    }

    if (!foundError) {
        JsonValidation.validate.call(this, report, schema, json);
    }

    if (callback) {
        report.processAsyncTasks(this.options.asyncTimeout, callback);
        return;
    } else if (report.asyncTasks.length > 0) {
        throw new Error("This validation has async tasks and cannot be done in sync mode, please provide callback argument.");
    }

    // assign lastReport so errors are retrievable in sync mode
    this.lastReport = report;
    return report.isValid();
};
ZSchema.prototype.getLastError = function () {
    if (this.lastReport.errors.length === 0) {
        return null;
    }
    var e = new Error();
    e.name = "z-schema validation error";
    e.message = this.lastReport.commonErrorMessage;
    e.details = this.lastReport.errors;
    return e;
};
ZSchema.prototype.getLastErrors = function () {
    return this.lastReport.errors.length > 0 ? this.lastReport.errors : undefined;
};
ZSchema.prototype.getMissingReferences = function () {
    var res = [],
        idx = this.lastReport.errors.length;
    while (idx--) {
        var error = this.lastReport.errors[idx];
        if (error.code === "UNRESOLVABLE_REFERENCE") {
            var reference = error.params[0];
            if (res.indexOf(reference) === -1) {
                res.push(reference);
            }
        }
    }
    return res;
};
ZSchema.prototype.getMissingRemoteReferences = function () {
    var missingReferences = this.getMissingReferences(),
        missingRemoteReferences = [],
        idx = missingReferences.length;
    while (idx--) {
        var remoteReference = SchemaCache.getRemotePath(missingReferences[idx]);
        if (remoteReference && missingRemoteReferences.indexOf(remoteReference) === -1) {
            missingRemoteReferences.push(remoteReference);
        }
    }
    return missingRemoteReferences;
};
ZSchema.prototype.setRemoteReference = function (uri, schema) {
    if (typeof schema === "string") {
        schema = JSON.parse(schema);
    }
    SchemaCache.cacheSchemaByUri.call(this, uri, schema);
};
ZSchema.prototype.getResolvedSchema = function (schema) {
    var report = new Report(this.options);
    schema = SchemaCache.getSchema.call(this, report, schema);

    // clone before making any modifications
    schema = Utils.cloneDeep(schema);

    var visited = [];

    // clean-up the schema and resolve references
    var cleanup = function (schema) {
        var key,
            typeOf = Utils.whatIs(schema);
        if (typeOf !== "object" && typeOf !== "array") {
            return;
        }

        if (schema.___$visited) {
            return;
        }

        schema.___$visited = true;
        visited.push(schema);

        if (schema.$ref && schema.__$refResolved) {
            var from = schema.__$refResolved;
            var to = schema;
            delete schema.$ref;
            delete schema.__$refResolved;
            for (key in from) {
                if (from.hasOwnProperty(key)) {
                    to[key] = from[key];
                }
            }
        }
        for (key in schema) {
            if (schema.hasOwnProperty(key)) {
                if (key.indexOf("__$") === 0) {
                    delete schema[key];
                } else {
                    cleanup(schema[key]);
                }
            }
        }
    };

    cleanup(schema);
    visited.forEach(function (s) {
        delete s.___$visited;
    });

    this.lastReport = report;
    if (report.isValid()) {
        return schema;
    } else {
        throw this.getLastError();
    }
};
ZSchema.prototype.setSchemaReader = function (schemaReader) {
    return ZSchema.setSchemaReader(schemaReader);
};
ZSchema.prototype.getSchemaReader = function () {
    return ZSchema.schemaReader;
};

/*
    static methods
*/
ZSchema.setSchemaReader = function (schemaReader) {
    ZSchema.schemaReader = schemaReader;
};
ZSchema.registerFormat = function (formatName, validatorFunction) {
    FormatValidators[formatName] = validatorFunction;
};
ZSchema.getDefaultOptions = function () {
    return Utils.cloneDeep(defaultOptions);
};

module.exports = ZSchema;

}).call(this,require('_process'))

},{"./FormatValidators":70,"./JsonValidation":71,"./Polyfills":72,"./Report":73,"./SchemaCache":74,"./SchemaCompilation":75,"./SchemaValidation":76,"./Utils":77,"./schemas/hyper-schema.json":79,"./schemas/schema.json":80,"_process":3}],79:[function(require,module,exports){
module.exports={
    "$schema": "http://json-schema.org/draft-04/hyper-schema#",
    "id": "http://json-schema.org/draft-04/hyper-schema#",
    "title": "JSON Hyper-Schema",
    "allOf": [
        {
            "$ref": "http://json-schema.org/draft-04/schema#"
        }
    ],
    "properties": {
        "additionalItems": {
            "anyOf": [
                {
                    "type": "boolean"
                },
                {
                    "$ref": "#"
                }
            ]
        },
        "additionalProperties": {
            "anyOf": [
                {
                    "type": "boolean"
                },
                {
                    "$ref": "#"
                }
            ]
        },
        "dependencies": {
            "additionalProperties": {
                "anyOf": [
                    {
                        "$ref": "#"
                    },
                    {
                        "type": "array"
                    }
                ]
            }
        },
        "items": {
            "anyOf": [
                {
                    "$ref": "#"
                },
                {
                    "$ref": "#/definitions/schemaArray"
                }
            ]
        },
        "definitions": {
            "additionalProperties": {
                "$ref": "#"
            }
        },
        "patternProperties": {
            "additionalProperties": {
                "$ref": "#"
            }
        },
        "properties": {
            "additionalProperties": {
                "$ref": "#"
            }
        },
        "allOf": {
            "$ref": "#/definitions/schemaArray"
        },
        "anyOf": {
            "$ref": "#/definitions/schemaArray"
        },
        "oneOf": {
            "$ref": "#/definitions/schemaArray"
        },
        "not": {
            "$ref": "#"
        },

        "links": {
            "type": "array",
            "items": {
                "$ref": "#/definitions/linkDescription"
            }
        },
        "fragmentResolution": {
            "type": "string"
        },
        "media": {
            "type": "object",
            "properties": {
                "type": {
                    "description": "A media type, as described in RFC 2046",
                    "type": "string"
                },
                "binaryEncoding": {
                    "description": "A content encoding scheme, as described in RFC 2045",
                    "type": "string"
                }
            }
        },
        "pathStart": {
            "description": "Instances' URIs must start with this value for this schema to apply to them",
            "type": "string",
            "format": "uri"
        }
    },
    "definitions": {
        "schemaArray": {
            "type": "array",
            "items": {
                "$ref": "#"
            }
        },
        "linkDescription": {
            "title": "Link Description Object",
            "type": "object",
            "required": [ "href", "rel" ],
            "properties": {
                "href": {
                    "description": "a URI template, as defined by RFC 6570, with the addition of the $, ( and ) characters for pre-processing",
                    "type": "string"
                },
                "rel": {
                    "description": "relation to the target resource of the link",
                    "type": "string"
                },
                "title": {
                    "description": "a title for the link",
                    "type": "string"
                },
                "targetSchema": {
                    "description": "JSON Schema describing the link target",
                    "$ref": "#"
                },
                "mediaType": {
                    "description": "media type (as defined by RFC 2046) describing the link target",
                    "type": "string"
                },
                "method": {
                    "description": "method for requesting the target of the link (e.g. for HTTP this might be \"GET\" or \"DELETE\")",
                    "type": "string"
                },
                "encType": {
                    "description": "The media type in which to submit data along with the request",
                    "type": "string",
                    "default": "application/json"
                },
                "schema": {
                    "description": "Schema describing the data to submit along with the request",
                    "$ref": "#"
                }
            }
        }
    }
}


},{}],80:[function(require,module,exports){
module.exports={
    "id": "http://json-schema.org/draft-04/schema#",
    "$schema": "http://json-schema.org/draft-04/schema#",
    "description": "Core schema meta-schema",
    "definitions": {
        "schemaArray": {
            "type": "array",
            "minItems": 1,
            "items": { "$ref": "#" }
        },
        "positiveInteger": {
            "type": "integer",
            "minimum": 0
        },
        "positiveIntegerDefault0": {
            "allOf": [ { "$ref": "#/definitions/positiveInteger" }, { "default": 0 } ]
        },
        "simpleTypes": {
            "enum": [ "array", "boolean", "integer", "null", "number", "object", "string" ]
        },
        "stringArray": {
            "type": "array",
            "items": { "type": "string" },
            "minItems": 1,
            "uniqueItems": true
        }
    },
    "type": "object",
    "properties": {
        "id": {
            "type": "string",
            "format": "uri"
        },
        "$schema": {
            "type": "string",
            "format": "uri"
        },
        "title": {
            "type": "string"
        },
        "description": {
            "type": "string"
        },
        "default": {},
        "multipleOf": {
            "type": "number",
            "minimum": 0,
            "exclusiveMinimum": true
        },
        "maximum": {
            "type": "number"
        },
        "exclusiveMaximum": {
            "type": "boolean",
            "default": false
        },
        "minimum": {
            "type": "number"
        },
        "exclusiveMinimum": {
            "type": "boolean",
            "default": false
        },
        "maxLength": { "$ref": "#/definitions/positiveInteger" },
        "minLength": { "$ref": "#/definitions/positiveIntegerDefault0" },
        "pattern": {
            "type": "string",
            "format": "regex"
        },
        "additionalItems": {
            "anyOf": [
                { "type": "boolean" },
                { "$ref": "#" }
            ],
            "default": {}
        },
        "items": {
            "anyOf": [
                { "$ref": "#" },
                { "$ref": "#/definitions/schemaArray" }
            ],
            "default": {}
        },
        "maxItems": { "$ref": "#/definitions/positiveInteger" },
        "minItems": { "$ref": "#/definitions/positiveIntegerDefault0" },
        "uniqueItems": {
            "type": "boolean",
            "default": false
        },
        "maxProperties": { "$ref": "#/definitions/positiveInteger" },
        "minProperties": { "$ref": "#/definitions/positiveIntegerDefault0" },
        "required": { "$ref": "#/definitions/stringArray" },
        "additionalProperties": {
            "anyOf": [
                { "type": "boolean" },
                { "$ref": "#" }
            ],
            "default": {}
        },
        "definitions": {
            "type": "object",
            "additionalProperties": { "$ref": "#" },
            "default": {}
        },
        "properties": {
            "type": "object",
            "additionalProperties": { "$ref": "#" },
            "default": {}
        },
        "patternProperties": {
            "type": "object",
            "additionalProperties": { "$ref": "#" },
            "default": {}
        },
        "dependencies": {
            "type": "object",
            "additionalProperties": {
                "anyOf": [
                    { "$ref": "#" },
                    { "$ref": "#/definitions/stringArray" }
                ]
            }
        },
        "enum": {
            "type": "array",
            "minItems": 1,
            "uniqueItems": true
        },
        "type": {
            "anyOf": [
                { "$ref": "#/definitions/simpleTypes" },
                {
                    "type": "array",
                    "items": { "$ref": "#/definitions/simpleTypes" },
                    "minItems": 1,
                    "uniqueItems": true
                }
            ]
        },
        "allOf": { "$ref": "#/definitions/schemaArray" },
        "anyOf": { "$ref": "#/definitions/schemaArray" },
        "oneOf": { "$ref": "#/definitions/schemaArray" },
        "not": { "$ref": "#" }
    },
    "dependencies": {
        "exclusiveMaximum": [ "maximum" ],
        "exclusiveMinimum": [ "minimum" ]
    },
    "default": {}
}

},{}],81:[function(require,module,exports){
var draft = require('./schemas/core-metaschema-draft-04')

var schemas = [

  {
    title: 'Default components for primitive types',
    type: 'object',
    properties: {
      aString: { type: 'string', title: 'This is a string' },
      aRequiredNumber: { type: 'number', default: 42 },
      aInteger: { type: 'integer',
                  description: 'An integer is a kind of number like 1, 2, and 3.' },
      aDate: { type: 'string', format: 'date'},
      aBoolean: { type: 'boolean' },
      anEnum: { title: 'an enum', enum: [ 1, null, 's', true ] },
      anArrayOfStrings: {
        type: 'array', items: { type: 'string' }, minItems: 2
      },
      theNull: { title: 'null', type: 'null' }
    },
    required: ['aRequiredNumber']
  },

  {
    title: '{}: anything goes'
  },

  {
    title: 'Support for $ref',
    type: 'object',
    defs: {
      a: { type: 'boolean' }
    },
    properties: {
      ref_to_def: { $ref: '#/defs/a' }
    }
  },

  {
    title: 'oneOf / anyOf',
    oneOf: [ {type: 'string', title: 'A string'}, {type: 'number'} ],
    anyOf: [ { minimum: 2, placeholder: 3}, {type: 'number'} ]
  },

  {
    type: 'array',
    title: 'Array of mutable objects',
    maxItems: 2,
    items: {
      type: 'object',
      properties: {
        email: {
          title: 'Email',
          type: 'string',
          pattern: '^\\S+@\\S+$',
          description: 'Email will be used for evil.'
        },
        spam: {
          title: 'Spam',
          type: 'boolean',
          default: true
        }
      }
    }
  },

  {
    title: 'Book',
    description: 'Test circular references',
    type: 'object',
    properties: {
      booktitle: { type: 'string' },
      cites: {
        oneOf: [
          { title: 'Bibliography', $ref: '#/definitions/cites' },
          { type: 'string' }
          // { title: 'Bibliography', $ref: '#' },
        ]
      }
    },
    required: ['booktitle'],
    definitions: {
      cites: {
        type: 'array',
        minItems: 0,
        items: { $ref: '#' }
      }
    }
  },

  draft
]


module.exports = schemas.map(function(s){
  return { schema: s,
           value: undefined,
           form: undefined}
})

},{"./schemas/core-metaschema-draft-04":82}],82:[function(require,module,exports){
arguments[4][80][0].apply(exports,arguments)
},{"dup":80}],83:[function(require,module,exports){
var Vue = require('vue')
var templates = require('../templates')
var base = require('./base-mixin')
var _ = require('../util')

// 5.3.  Validation keywords for arrays
//    additionalItems and items
//    maxItems minItems
//    uniqueItems


exports['vf-array'] = {

  template: templates.array,

  mixins: [base],

  data: function(){
    return { subfields: [] }
  },

  computed: {

    minLength: function(){
      return this.schema.minItems || 0
    },
    maxLength: function(){
      var s = this.schema, x = Infinity
      if (Number.isInteger(s.maxItems)) x = s.maxItems
      if (s.additionalItems === false && Array.isArray(s.items)){
        x = Math.min(x, s.items.length)
      }
      return x
    },

    valueLength: function(){
      return this.value.length
    }

  },

  methods: {

    castValue: function(x){
      return Array.isArray(x) ? x : getDefault(this.schema)
    },

    addItem: function(){
      this.value.push(undefined)
      // TODO: set focus on last field
    },

    removeItem: function(i){
      if (this.value.length > (this.schema.minItems||0)) this.value.$remove(i)
      else this.value.$set(i, null)
    },

    updateSubfields: function(){
      this.subfields = getSubfields(this.schema, this.form, this.value)
    }


  },

  watch: {

    valueLength: function(){
      this.updateSubfields()
    }

  },

  events: {

    valueChanged: function(child){
      var val = child.value, key = child.key
      if (typeof key !== 'undefined' && _.isNot(val, this.value[key])){
        this.value.$set(key, val)
      }
      return false
    }

  }
}


function getDefault(schema){
  var d = schema && schema.default
  if (Array.isArray(d)) d = _.copy(d)
  else {
    var i = schema.minItems || 0
    d = []
    while (i--) d.push(null)
  }
  return d
}


function getSubfields(schema, form, value){
  if (typeof value === 'undefined') return []

  var minItems = schema.minItems || 0,
      nbFields = Math.max(minItems, Array.isArray(value) ? value.length : 0)

  if (nbFields === 0) return []

  var itemsSchema = schema.items || {},
      itemsForm = form ? form.items : null

  if (Array.isArray(itemsSchema)){
    var len = itemsSchema.length,
        rest = schema.additionalItems
    if (typeof rest !== 'object') rest = {}
    function ithSchema(i){
      return i<len ? itemsSchema[i] : rest
    }
  } else {
    function ithSchema(i){
      return itemsSchema
    }
  }

  function makeField(i){
    return { schema: ithSchema(i),
             form: itemsForm,
             required: i < minItems }
  }

  var res = []
  for (var i=0; i<nbFields; i++){
    res.push(makeField(i))
  }

  return res
}

},{"../templates":92,"../util":93,"./base-mixin":84,"vue":66}],84:[function(require,module,exports){
var templates = require('../templates')
var _ = require('../util')
var resolveComponent = require('../resolve-component')


module.exports = {

  replace: true,

  props: [ 'schema', 'form', 'value', 'path', 'key', 'required' ],

  // data: function(){
  //   return { errors: [] }
  // },

  computed: {

    value: {
      get: function(){
        return this.$data.value
      },
      set: function(x){
        this.$data.value = this.castValue ? this.castValue(x) : x
      }
    },

    // FIXME: use form param or add properties to schema?
    title: _.fromForm('title', true),
    description: _.fromForm('description', true),
    readonly: _.fromForm('readonly'),
    disabled: _.fromForm('disabled'),
    hidden: _.fromForm('hidden'),
    placeholder: _.fromForm('placeholder', true)

  },

  methods: {

    resolveComponent: resolveComponent

    // idempotent function implemented in concrete classes
    // castValue: function(x){
    //   return x
    // }

  },

  watch: {

    value: function(val, previous){
      if (_.isNot(val, previous)){
        this.$dispatch('validationRequest')
        // FIXME: events paralleling props bindings, needed (?) to support:
        // 1. array of primitive values (OK in vue 0.12)
        // 2. setting default value from child vm
        // dispatch after initial binding
        // var vm = this
        // _.nextTick(function(){
        //   vm.$dispatch('valueChanged', vm)
        // })
      }
    }

  },

  events: {

    // validationStart: function(){
    //   this.errors = []
    // }

  }

}

},{"../resolve-component":91,"../templates":92,"../util":93}],85:[function(require,module,exports){
var templates = require('../templates')
var base = require('./base-mixin')


exports.button = exports.submit = {

  template: templates.button,

  mixins: [base],

  computed: {

    title: function(){
      return this.form.title || this.form.type
    },

    type: function(){
      return (this.form.type === 'submit') ? 'submit' : 'button'
    }

  },

  methods: {

    click: function(){
      this.$dispatch(this.form.event || 'submit', this)
    }

  }
}

},{"../templates":92,"./base-mixin":84}],86:[function(require,module,exports){
var templates = require('../templates')
var base = require('./base-mixin')
var _ = require('../util')
require('vue-select-js')

var TYPES = ['object', 'array', 'string', 'number', 'integer', 'null', 'boolean']


exports['vf-generic'] = {

  name: 'FormidableGeneric',

  template: templates.generic,

  mixins: [base],

  data: function(){
    return {
      selectedType: undefined,
      selectedOneOfs: [],
      selectedAnyOfs: []// ,
      // typedValues: {}
    }
  },

  computed: {

    // hasSelection: function(){
    //   return !!this.selectedType || this.selectedOneOfs.some(function(x){return x})
    // },

    hasOptions: function(){
      var o
      return (o = this.oneOfOptions) && o.length ||
        (o = this.anyOfOptions) && o.length
    },

    combinedSchema: function(){
      return _.combineAll(this.schema)
    },

    typeOptions: function(){
      var t = this.combinedSchema.type
      if (!t && !this.hasOptions) return TYPES
      else return t
    },

    oneOfOptions: function(){
      var blocks = this.combinedSchema.oneOfs
      return blocks.map(function(block){
        return block.map(function(a){
          return { value: a,
                   text: a.title || a.description || a.type || JSON.stringify(a) }
        })
      })
    },

    anyOfOptions: function(){
      var blocks = this.combinedSchema.anyOfs
      return blocks.map(function(block){
        return block.map(function(a){
          return { value: a,
                   text: a.title || a.description || a.type || JSON.stringify(a) }
        })
      })
    },

    // TODO: check selected schemas for compatibility,
    // cross-filter options in select fields
    currentSchema: function(){
      if (!this.selectedType &&
          !this.selectedOneOfs.some(function(x){return x}) &&
          !this.selectedAnyOfs.some(function(x){return x.length})) return

      var s = _.combineAll({ type: this.selectedType },
                           this.combinedSchema,
                           this.selectedOneOfs,
                           this.selectedAnyOfs)
      if (Array.isArray(s.type) && s.type.length === 1) s.type = s.type[0]
      s.oneOf = s.oneOfs = s.anyOf = s.anyOfs = undefined
      return s
    },

    // currentForm: function(){ return {} },

    currentComponent: function(){
      var s = this.currentSchema
      return s && this.resolveComponent(s, this.currentForm)
    }

  },

  watch: {

    oneOfOptions: function(blocks){
      var l = blocks.length
      if (this.selectedOneOfs.length !== l){
        this.selectedOneOfs.length = l
      }
    },

    typeOptions: function(opts){
      if (!opts) this.selectedType = undefined
    }

  }

}

},{"../templates":92,"../util":93,"./base-mixin":84,"vue-select-js":5}],87:[function(require,module,exports){
var _ = require('../util')

exports['select-js'] = require('vue-select-js')

_.merge(
  exports,
  require('./inputs'),
  require('./object'),
  require('./array'),
  require('./generic'),
  require('./buttons')
)

},{"../util":93,"./array":83,"./buttons":85,"./generic":86,"./inputs":88,"./object":89,"vue-select-js":5}],88:[function(require,module,exports){
var templates = require('../templates')
var base = require('./base-mixin')
var _ = require('../util')
require('vue-select-js')


// Map JSON Schema formats to HTML input types
var F2T = {
  'date-time': 'datetime',
  uri: 'url',
  email: 'email',
  hostname: 'text',
  ipv4: 'text',
  ipv6: 'text'
}

// accept HTML input types as JSON schema formats
;[ 'text', 'password', 'email', 'url', 'tel', 'color', 'search',
   'datetime', 'datetime-local', 'date', 'month', 'time', 'week',
   'number', 'range',
   'checkbox' ].forEach(function(f){
     F2T[f] = f
   })


exports['vf-text'] = {
  name: 'formidableText',
  template: templates.string,
  mixins: [base],
  computed: {
    inputType: function(){
      var f = this.schema.format
      return F2T[f] || 'text'
    }
  },
  methods: {
    castValue: stringify
  }
}


exports['vf-textarea'] = {
  template: templates.textarea,
  mixins: [base],
  computed: {
    rows: _.fromForm('rows'),
    cols: _.fromForm('cols'),
    wrap: _.fromForm('wrap')
  },
  methods: {
    castValue: stringify
  }
}


function stringify(x){
  return (x || x === 0) ? x + '' : ''
}


exports['vf-number'] = /*exports['vf-integer'] =*/ {
  name: 'formidableNumber',
  template: templates.number,
  mixins: [base],
  methods: {
    castValue: function(x){
      return Number(x)
    }
  },
  computed: {
    inputType: function(){
      var f = this.schema.format
      return F2T[f] || 'number'
    },
    min: function(){
      // TODO: this.schema.exclusiveMinimum
      return this.schema.minimum
    },
    max: function(){
      // TODO: this.schema.exclusiveMaximum
      return this.schema.maximum
    },
    step: function(){
      // this.schema.multipleOf
    }
  }
}


exports['vf-checkbox'] = {
  template: templates.checkbox,
  mixins: [base],
  methods: {
    castValue: function(x){
      return !!x
    }
  }
}


exports['vf-select'] = {
  template: templates.select,
  mixins: [base],
  computed: {
    options: function(){
      // TODO: form.enumTitles ?
      return (this.schema['enum'] || []).map(function(x, i){
        return { text: JSON.stringify(x), value: x }
      })
    }
  }
}


exports['vf-null'] = {
  template: '(null)',
  mixins: [base],
  methods: {
    castValue: function(x){
      // FIXME: vue inits props to null
      return null
    }
  }
}

},{"../templates":92,"../util":93,"./base-mixin":84,"vue-select-js":5}],89:[function(require,module,exports){
var templates = require('../templates')
var base = require('./base-mixin')
var _ = require('../util')

// 5.4. Validation keywords for objects
// maxProperties minProperties required
// additionalProperties, properties, patternProperties
// dependencies


exports['vf-object'] = {

  template: templates.object,

  mixins: [base],

  data: function(){
    return { subfields: [] }
  },

  computed: {

    minProperties: function(){
      return this.schema.minProperties || 0
    },
    maxProperties: function(){
      return this.schema.maxProperties || Infinity
    },

    valueKeys: function(){
      return Object.keys(this.value)
    }

  },

  methods: {

    castValue: function(x){
      return _.isPlainObject(x) ? x : getDefault(this.schema)
    },

    hasProp: function(key){
      return this.value.hasOwnProperty(key)
    },
    addProp: function(key){
      if (key === null){
        key = prompt('Add a property named:')
      }
      if (key !== null){
        // FIXME: support vue-reserved keys ($_)
        this.value.$add(key)
      }
    },
    deleteProp: function(key){
      this.value.$delete(key)
    },
    toggleProp: function(key){
      if (this.hasProp(key)) this.deleteProp(key)
      else this.addProp(key)
    },

    updateSubfields: function(){
      this.subfields = getSubfields(this.schema, this.form, this.value)
    }

  },

  watch: {

    valueKeys: function(){
      this.updateSubfields()
    }

  },


  events: {

    // valueChanged: function(child){
    //   var newVal = child.value, key = child.key
    //   if (typeof key !== 'undefined' && _.isNot(newVal, this.value[key])){
    //     this.value.$add(key)
    //     this.value[key] = newVal
    //   }
    //   return false
    // }

  }

}


function getDefault(schema){
  var d = schema && schema.default
  return d ? _.copy(d) : {}
}


function getSubfields(schema, form, value){

  if (!value) return []

  // used to list subfield keys
  var schemaProps = schema.properties || {},
      required = schema.required || []


  // TODO: accept form.fields option?
  // var fields = form && form.fields || ['*']
  var fields = _.unionKeys(schemaProps, value/*, required*/)

  // used to build subschemas
  var patternProps = schema.patternProperties,
      addProps = schema.additionalProperties
  // default is to accept any additional property
  if (!addProps && addProps !== false) addProps = {}

  var _uid = 0
  return iterFields(fields, Object.keys(schemaProps), zipField)

  function zipField(field){
    if (_.isString(field)) field = { key: field }

    var key = field.key

    if (typeof key === 'undefined'){
      // action, etc.
      // ~unique key for track-by
      key = '___'+_uid+++'__'+JSON.stringify(field)
      return { form: field, key: key, isAction: true }
    }

    // ensure this property is observed (noop if key pre-exists as normal property)
    if (required.indexOf(key) !== -1) value.$add(key)

    // build schema for subfield
    var subschema = (key in schemaProps) ? [schemaProps[key]] : []
    if (patternProps) {
      Object.keys(patternProps).forEach(function(pk){
        if (RegExp(pk).test(key)) subschema.push(patternProps[pk])
      })
    }
    subschema = (subschema.length > 1) ? { allOf: subschema } : subschema[0] || addProps

    if (subschema === false){
      // TODO: handle disallowed additional properties
      // render as readonly, marked invalid?
      handleInvalid()
    }

    return { schema: subschema,
             form: field,
             key: key,
             // val: value[key],
             required: (required && required.indexOf(key)>-1) ? true : null }
  }
}


function iterFields(fields, defaults, cb, initVal){
  return fields.reduce(function(acc, f){
    if (f === '*'){
      defaults.forEach(function(x){
        acc.push(cb(x))
      })
    } else {
      acc.push(cb(f))
    }
    return acc
  }, initVal || [])
}

},{"../templates":92,"../util":93,"./base-mixin":84}],90:[function(require,module,exports){
var ZSchema = require('z-schema')

var templates = require('./templates')
var _ = require('./util')
var resolveComponent = require('./resolve-component')
var components = require('./components')


module.exports = {

  name: 'VueFormidable',

  replace: false,

  template: templates.form,

  props: [ 'schema', 'form', 'value', 'path' ],

  data: function(){
    return { value: undefined,
             resolvedSchema: undefined, errors: [] }
  },

  computed: { },

  methods: {

    resolveComponent: resolveComponent,

    validate: function(){
      this.$broadcast('validationStart')
      this.validator.validate(this.value, this.schema)
      var errors = this.validator.getLastErrors()
      // TODO: broadcast or publish as nested errors object
      // this.$broadcast()
      this.errors = errors
    }

  },

  components: components,

  watch: {

    schema: function(s){
      var v = this.validator = new ZSchema()
      v.compileSchema(s)
      this.resolvedSchema = v.getResolvedSchema(s)
    }

  },

  events: {

    // valueChanged: function(child){
    //   var newVal = child.value
    //   if (_.isNot(newVal, this.value)) this.value = newVal
    //   return false
    // },

    validationRequest: function(){
      var vm = this
      _.nextTick(function(){
        vm.validate()
      })
      return false
    }

  }

}

},{"./components":87,"./resolve-component":91,"./templates":92,"./util":93,"z-schema":78}],91:[function(require,module,exports){

/**
 * Mapping of JSON Schema primitive types to component names
 * */

var T2C = {
  boolean: 'checkbox',
  string: 'text',
  integer: 'number'
  // number: 'number', object: 'object', array: 'array', null: 'null'
}


module.exports = function resolveComponent(schema, form){
  var t

  // TODO: resolver func API?
  if (form && (t = form.type)) return t

  // if (!schema) return undefined

  if ('enum' in schema) return 'vf-select'

  if (schema.oneOf || schema.anyOf || schema.oneOfs || schema.anyOfs ||
      Array.isArray(t = schema.type) || !t) return 'vf-generic'

  t = T2C[t] || t
  if (t) return 'vf-' + t
  console.warn('Invalid JSON Schema type ', t)
}

},{}],92:[function(require,module,exports){
var fs = require('fs')
var templates = "\n<template id=\"string\">\n  <div class=\"vf-input-group\">\n    <label>{{ title || key }}</label>\n    <input v-model=\"value\"\n           v-attr=\"type: inputType, name: path, required: required,\n                   maxlength: schema.maxLength, pattern: schema.pattern,\n                   placeholder: placeholder,\n                   readonly: readonly, disabled: disabled\"\n           v-el=\"input\"/>\n    <div v-if=\"description\" class=\"vf-desc\">{{ description }}</div>\n  </div>\n</template>\n\n\n<template id=\"textarea\">\n  <div class=\"vf-input-group\">\n    <label>{{ title || key }}</label>\n    <textarea v-model=\"value\"\n              v-attr=\"name: path, required: required,\n                      maxlength: schema.maxLength,\n                      placeholder: placeholder,\n                      readonly: readonly, disabled: disabled,\n                      rows: rows, cols: cols, wrap: wrap\"\n              v-el=\"input\"></textarea>\n    <div v-if=\"description\" class=\"vf-desc\">{{ description }}</div>\n  </div>\n</template>\n\n\n<template id=\"number\">\n  <div class=\"vf-input-group\">\n    <label>{{ title || key }}</label>\n    <input v-model=\"value\"\n           v-attr=\"type: inputType, name: path, required: required,\n                   min: min, max: max, step: step,\n                   placeholder: placeholder,\n                   readonly: readonly, disabled: disabled\"\n           v-el=\"input\" number/>\n    <div v-if=\"description\" class=\"vf-desc\">{{ description }}</div>\n  </div>\n</template>\n\n\n<template id=\"checkbox\">\n  <div class=\"vf-input-group\">\n    <label>{{ title || key }}</label>\n    <input type=\"checkbox\" v-model=\"value\" v-el=\"input\"\n           v-attr=\"name: path\"/>\n    <div v-if=\"description\" class=\"vf-desc\">{{ description }}</div>\n  </div>\n</template>\n\n\n<template id=\"select\">\n  <div class=\"vf-input-group\">\n    <label>{{ title || key }}</label>\n    <select-js value=\"{{value}}\" opts=\"{{options}}\" v-el=\"input\"\n               v-attr=\"name: path\"></select-js>\n    <div v-if=\"description\" class=\"vf-desc\">{{ description }}</div>\n  </div>\n</template>\n\n\n<template id=\"object\">\n  <fieldset class=\"vf-object\">\n    <legend>{{ title || key }}</legend>\n    <div v-if=\"description\" class=\"vf-desc\">{{ description }}</div>\n    <input type=\"button\" disabled=\"{{ nProperties >= maxProperties }}\"\n           v-on=\"click: addProp(null)\" value=\"➕\" title=\"Add property\"/>\n    <ul>\n      <template v-repeat=\"subfields\" v-ref=\"sub\" track-by=\"key\">\n        <li class=\"vf-item\" v-class=\"inactive: !required && !hasProp(key)\">\n          <template v-if=\"!isAction\">\n            <input type=\"button\" disabled=\"{{ required }}\"\n                   v-on=\"click: toggleProp(key)\"\n                   value=\"{{ hasProp(key) ? '❌' : '➕ '+key }}\"\n                   title=\"{{ hasProp(key) ? 'Remove' : 'Add' }} {{ key }}\"\n                   class=\"vf-add-remove-item\"/>\n          </template>\n          <component v-if=\"required || hasProp(key) || isAction\"\n                     is=\"{{ resolveComponent(schema, form) }}\"\n                     schema=\"{{schema}}\" form=\"{{form}}\" value=\"{{value[key]}}\"\n                     key=\"{{key}}\" path=\"{{ path ? path+'['+key+']' : key }}\"\n                     required=\"{{required}}\"\n                     v-ref=\"c\"></component>\n        </li>\n      </template>\n    </ul>\n  </fieldset>\n</template>\n\n\n<template id=\"array\">\n  <fieldset class=\"vf-array\">\n    <legend>{{ title || key }}</legend>\n    <div v-if=\"description\" class=\"vf-desc\">{{ description }}</div>\n    <ol>\n      <li class=\"vf-item\" v-repeat=\"subfields\" v-ref=\"sub\" track-by=\"$index\">\n        <input type=\"button\" disabled=\"{{ value.length <= minLength }}\"\n               v-on=\"click: removeItem($index)\" value=\"❌\"\n               title=\"Remove this item ({{ $index }})\"\n               class=\"vf-add-remove-item\"/>\n        <component is=\"{{ resolveComponent(schema, form) }}\"\n                   schema=\"{{schema}}\" form=\"{{form}}\" value=\"{{value[$index]}}\"\n                   key=\"{{$index}}\" path=\"{{ path ? path+'['+$index+']' : $index }}\"\n                   required=\"{{required}}\" v-ref=\"c\"></component>\n      </li>\n    </ol>\n    <input type=\"button\" disabled=\"{{ value.length >= maxLength }}\"\n           v-on=\"click: addItem\" value=\"➕\" title=\"Add item\"/>\n  </fieldset>\n</template>\n\n\n<template id=\"generic\">\n  <header>{{ title || description || key }}</header>\n\n  <div v-if=\"typeOptions\">\n    <select title=\"type\" v-model=\"selectedType\">\n      <option value disabled selected>--type--</option>\n      <option v-repeat=\"typeOptions\">{{$value}}</option>\n    </select>\n  </div>\n\n  <div v-if=\"oneOfOptions\">\n    <template v-repeat=\"oneOfOptions\">\n      <select-js title=\"oneOf-{{$index}}\"\n                 value=\"{{selectedOneOfs[$index]}}\"\n                 opts=\"{{$value}}\"\n                 placeholder=\"--oneOf--\"></select-js>\n    </template>\n  </div>\n\n  <div v-if=\"anyOfOptions\">\n    <template v-repeat=\"anyOfOptions\">\n      <select-js title=\"anyOf-{{$index}}\"\n                 value=\"{{selectedAnyOfs[$index]}}\"\n                 opts=\"{{$value}}\"\n                 placeholder=\"--anyOf--\" multiple></select-js>\n    </template>\n  </div>\n\n  <component v-if=\"currentComponent\"\n             is=\"{{ currentComponent }}\"\n             schema=\"{{currentSchema}}\" form=\"{{currentForm}}\"\n             value=\"{{value}}\"\n             key=\"{{key}}\" required=\"{{required}}\"\n             v-ref=\"c\"></component>\n\n</template>\n\n\n<template id=\"form\">\n  <div class=\"validation\" v-class=\"hasErrors: errors\">\n    <div v-if=\"!errors\">✓</div>\n    <div v-repeat=\"errors\">\n      {{path}}: {{message}}\n    </div>\n    <component is=\"{{ resolveComponent(resolvedSchema, form) }}\"\n               schema=\"{{resolvedSchema}}\" form=\"{{form}}\" value=\"{{value}}\"\n               v-ref=\"c\"></component>\n  </div>\n</template>\n\n\n\n<template id=\"button\">\n  <input v-attr=\"type: type, value: title, title: description\" v-on=\"click: click\"/>\n</template>\n"

// document.write(templates)
var el = document.createElement('template')
el.innerHTML = templates
Array.prototype.forEach.call(
  el.content.querySelectorAll('template,script[type="x-vue"]'),
  function(t){
    if (t.id) exports[t.id] = t
  })


// var css = fs.readFileSync(__dirname + '/styles.css', 'utf8')
// var insertCss = require('insert-css')
// insertCss(css)

},{"fs":2}],93:[function(require,module,exports){
var _ = require('./lang')

_.merge(
  exports,
  _,
  require('./schema'),
  require('./vue')
)

},{"./lang":94,"./schema":95,"./vue":96}],94:[function(require,module,exports){

exports.merge = function merge(acc){
  for (var i = 1; i<arguments.length; i++){
    var from = arguments[i]
    for (var k in from) acc[k] = from[k]
  }
  return acc
}


if (!Number.isNaN){
  Number.isNaN = function isNaN(value) {
    return typeof value === "number" && value !== value
  }
}

exports.isNot = function isNot(x, y){
  return x !== y && !(Number.isNaN(x) && Number.isNaN(y))
}


var toString = Object.prototype.toString

exports.isPlainObject = function (obj) {
  return toString.call(obj) === '[object Object]'
}


exports.copy = function copy(x){
  return x ? JSON.parse(JSON.stringify(x)) : x
}


var S = "[object String]"

exports.isString = function isString(x){
  return typeof x === 'string' || toString.call(x) === S
}


if (!String.prototype.startsWith){
  String.prototype.startsWith = function(searchString, position){
    position = position || 0
    return this.indexOf(searchString, position) === position
  }
}
if (!String.prototype.endsWith){
  String.prototype.endsWith = function(searchString, position){
    var subjectString = this.toString()
    if (position === undefined || position > subjectString.length){
      position = subjectString.length
    }
    position -= searchString.length
    var lastIndex = subjectString.indexOf(searchString, position)
    return lastIndex !== -1 && lastIndex === position
  }
}


var hop = Object.prototype.hasOwnProperty

exports.unionKeys = function unionKeys(){
  var arg, i, k, l = arguments.length, keys = [], hash = {}
  for (i=0; i<l; i++){
    arg = arguments[i]
    if (!Array.isArray(arg)) arg = Object.keys(arg)
    arg.forEach(addKey)
  }
  function addKey(k){
    if (!hop.call(hash, k)){
      keys.push(k)
      hash[k] = true
    }
  }
  return keys
}

},{}],95:[function(require,module,exports){
// JSON SCHEMA algebra

/**
 * Walk along allOf
 */
function walkAllOfs(schema, emit){
  emit(schema)
  if (schema.allOf) schema.allOf.forEach(function(s){
    walkAllOfs(s, emit)
  })
}

/**
 * Walk along allOf and combine properties used in forms
 */
exports.combineAll = function combineAll(/*...schemas*/){
  var res = {}
  Array.prototype.concat.apply([], arguments)
    .forEach(function(schema){
      if ('$ref' in schema) console.warn('Schema contains unresolved $ref', schema)
      walkAllOfs(schema, function(s){
        combine(res, s)
      })
    })
  return res
}


function combine(dest/*, ...sources*/){
  if (!dest) dest = {}
  if (!dest.anyOfs) dest.anyOfs = []
  if (!dest.oneOfs) dest.oneOfs = []

  Array.prototype.concat.apply([], Array.prototype.slice.call(arguments, 1))
    .forEach(function(src){
      for (var p in src){
        if (typeof src[p] === 'undefined') continue
        if (p === 'oneOf') dest.oneOfs.push(src.oneOf)
        else if (p === 'anyOf') dest.anyOfs.push(src.anyOf)
        else if (dest[p] === undefined){
          dest[p] = src[p] // deepcopy?
        } else {
          var m = combiners[p]
          if (m) dest[p] = m(dest[p], src[p])
          // else console.debug('No combiner for property ', p)
        }
      }
    })
  return dest
}

var combiners = {
  multipleOf: lcm,

  maximum: Math.min,
  exclusiveMaximum: Math.min,
  minimum: Math.max,
  exclusiveMinimum: Math.max,

  maxLength: Math.min,
  minLength: Math.max,
  pattern: andRegExps,

  maxItems: Math.min,
  minItems: Math.max,
  // TODO: additionalItems and items

  maxProperties: Math.min, minProperties: Math.max,
  required: union,
  // TODO: additionalProperties, properties and patternProperties
  // dependencies

  enum: intersection,
  type: intersection,
  // anyOf, oneOf: hard-coded in combine,
  oneOfs: concat,
  anyOfs: concat
  // not
}

function concat(a, b){
  return a.concat(b)
}

function intersection(a, b){
  if (!Array.isArray(a)) a = [a]
  if (!Array.isArray(b)) b = [b]
  return a.filter(function(y){
    return b.indexOf(y) !== -1
  })
}

function union(a,b){
  var u = {}, p
  for (p in a) u[p] = true
  for (p in b) u[p] = true
  return Object.keys(u)
}

function lcm(a, b){
  return Math.abs(a*b / gcd(a, b))
}

function gcd(a, b){
  return b ? gcd(b, a % b) : a
}

function andRegExps(a,b){
  return '(?='+a+')(?='+b+')'
}



// var jp = require('jsonpatch')
// exports.resolveJSONPointer = function resolveJSONPointer(doc, pointer){
//   console.debug('resolving', pointer, 'in', doc)
//   if (pointer[0] !== '#') throw 'Full URI resolution is not implemented: ' + pointer
//   return (new jp.JSONPointer(pointer.slice(1))).get(doc)
// }

},{}],96:[function(require,module,exports){
var Vue = require('vue')

exports.nextTick = Vue.nextTick

// var yaml = require('js-yaml')
// Vue.filter('yaml', function(x){
//   return yaml.safeDump(x, { flowLevel: 1, skipInvalid: true })
// })

var CircularJSON = require('circular-json')
Vue.filter('json', function(x){
  return CircularJSON.stringify(x, null, 2)
})

exports.fromForm = function fromForm(key, orSchema){
  return function(){
    var t
    return (t = this.form) && t[key] || orSchema && (t = this.schema) && t[key]
  }
}

},{"circular-json":4,"vue":66}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9saWIvX2VtcHR5LmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9jaXJjdWxhci1qc29uL2J1aWxkL2NpcmN1bGFyLWpzb24ubm9kZS5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy92dWUtc2VsZWN0LWpzL3NlbGVjdC5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy92dWUvc3JjL2FwaS9jaGlsZC5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy92dWUvc3JjL2FwaS9kYXRhLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS9zcmMvYXBpL2RvbS5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy92dWUvc3JjL2FwaS9ldmVudHMuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvdnVlL3NyYy9hcGkvZ2xvYmFsLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS9zcmMvYXBpL2xpZmVjeWNsZS5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy92dWUvc3JjL2JhdGNoZXIuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvdnVlL3NyYy9jYWNoZS5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy92dWUvc3JjL2NvbXBpbGVyL2NvbXBpbGUuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvdnVlL3NyYy9jb21waWxlci90cmFuc2NsdWRlLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS9zcmMvY29uZmlnLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS9zcmMvZGlyZWN0aXZlLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS9zcmMvZGlyZWN0aXZlcy9hdHRyLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS9zcmMvZGlyZWN0aXZlcy9jbGFzcy5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy92dWUvc3JjL2RpcmVjdGl2ZXMvY2xvYWsuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvdnVlL3NyYy9kaXJlY3RpdmVzL2NvbXBvbmVudC5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy92dWUvc3JjL2RpcmVjdGl2ZXMvZWwuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvdnVlL3NyYy9kaXJlY3RpdmVzL2V2ZW50cy5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy92dWUvc3JjL2RpcmVjdGl2ZXMvaHRtbC5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy92dWUvc3JjL2RpcmVjdGl2ZXMvaWYuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvdnVlL3NyYy9kaXJlY3RpdmVzL2luZGV4LmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS9zcmMvZGlyZWN0aXZlcy9tb2RlbC9jaGVja2JveC5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy92dWUvc3JjL2RpcmVjdGl2ZXMvbW9kZWwvaW5kZXguanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvdnVlL3NyYy9kaXJlY3RpdmVzL21vZGVsL3JhZGlvLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS9zcmMvZGlyZWN0aXZlcy9tb2RlbC9zZWxlY3QuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvdnVlL3NyYy9kaXJlY3RpdmVzL21vZGVsL3RleHQuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvdnVlL3NyYy9kaXJlY3RpdmVzL29uLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS9zcmMvZGlyZWN0aXZlcy9wcm9wLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS9zcmMvZGlyZWN0aXZlcy9yZWYuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvdnVlL3NyYy9kaXJlY3RpdmVzL3JlcGVhdC5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy92dWUvc3JjL2RpcmVjdGl2ZXMvc2hvdy5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy92dWUvc3JjL2RpcmVjdGl2ZXMvc3R5bGUuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvdnVlL3NyYy9kaXJlY3RpdmVzL3RleHQuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvdnVlL3NyYy9kaXJlY3RpdmVzL3RyYW5zaXRpb24uanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvdnVlL3NyYy9maWx0ZXJzL2FycmF5LWZpbHRlcnMuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvdnVlL3NyYy9maWx0ZXJzL2luZGV4LmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS9zcmMvaW5zdGFuY2UvY29tcGlsZS5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy92dWUvc3JjL2luc3RhbmNlL2V2ZW50cy5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy92dWUvc3JjL2luc3RhbmNlL2luaXQuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvdnVlL3NyYy9pbnN0YW5jZS9taXNjLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS9zcmMvaW5zdGFuY2Uvc2NvcGUuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvdnVlL3NyYy9vYnNlcnZlci9hcnJheS5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy92dWUvc3JjL29ic2VydmVyL2RlcC5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy92dWUvc3JjL29ic2VydmVyL2luZGV4LmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS9zcmMvb2JzZXJ2ZXIvb2JqZWN0LmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS9zcmMvcGFyc2Vycy9kaXJlY3RpdmUuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvdnVlL3NyYy9wYXJzZXJzL2V4cHJlc3Npb24uanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvdnVlL3NyYy9wYXJzZXJzL3BhdGguanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvdnVlL3NyYy9wYXJzZXJzL3RlbXBsYXRlLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS9zcmMvcGFyc2Vycy90ZXh0LmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS9zcmMvdHJhbnNpdGlvbi9pbmRleC5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy92dWUvc3JjL3RyYW5zaXRpb24vcXVldWUuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvdnVlL3NyYy90cmFuc2l0aW9uL3RyYW5zaXRpb24uanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvdnVlL3NyYy91dGlsL2RlYnVnLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS9zcmMvdXRpbC9kb20uanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvdnVlL3NyYy91dGlsL2Vudi5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy92dWUvc3JjL3V0aWwvaW5kZXguanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvdnVlL3NyYy91dGlsL2xhbmcuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvdnVlL3NyYy91dGlsL21pc2MuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvdnVlL3NyYy91dGlsL29wdGlvbnMuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvdnVlL3NyYy92dWUuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvdnVlL3NyYy93YXRjaGVyLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL3otc2NoZW1hL25vZGVfbW9kdWxlcy92YWxpZGF0b3IvdmFsaWRhdG9yLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL3otc2NoZW1hL3NyYy9FcnJvcnMuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvei1zY2hlbWEvc3JjL0Zvcm1hdFZhbGlkYXRvcnMuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvei1zY2hlbWEvc3JjL0pzb25WYWxpZGF0aW9uLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL3otc2NoZW1hL3NyYy9Qb2x5ZmlsbHMuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvei1zY2hlbWEvc3JjL1JlcG9ydC5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy96LXNjaGVtYS9zcmMvU2NoZW1hQ2FjaGUuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvei1zY2hlbWEvc3JjL1NjaGVtYUNvbXBpbGF0aW9uLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL3otc2NoZW1hL3NyYy9TY2hlbWFWYWxpZGF0aW9uLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL3otc2NoZW1hL3NyYy9VdGlscy5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy96LXNjaGVtYS9zcmMvWlNjaGVtYS5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy96LXNjaGVtYS9zcmMvc2NoZW1hcy9oeXBlci1zY2hlbWEuanNvbiIsIi4uLy4uL25vZGVfbW9kdWxlcy96LXNjaGVtYS9zcmMvc2NoZW1hcy9zY2hlbWEuanNvbiIsImV4YW1wbGVzLmpzIiwiLi4vc3JjL2NvbXBvbmVudHMvYXJyYXkuanMiLCIuLi9zcmMvY29tcG9uZW50cy9iYXNlLW1peGluLmpzIiwiLi4vc3JjL2NvbXBvbmVudHMvYnV0dG9ucy5qcyIsIi4uL3NyYy9jb21wb25lbnRzL2dlbmVyaWMuanMiLCIuLi9zcmMvY29tcG9uZW50cy9pbmRleC5qcyIsIi4uL3NyYy9jb21wb25lbnRzL2lucHV0cy5qcyIsIi4uL3NyYy9jb21wb25lbnRzL29iamVjdC5qcyIsIi4uL3NyYy9mb3JtLmpzIiwiLi4vc3JjL3Jlc29sdmUtY29tcG9uZW50LmpzIiwiLi4vc3JjL3RlbXBsYXRlcy9pbmRleC5qcyIsIi4uL3NyYy91dGlsL2luZGV4LmpzIiwiLi4vc3JjL3V0aWwvbGFuZy5qcyIsIi4uL3NyYy91dGlsL3NjaGVtYS5qcyIsIi4uL3NyYy91dGlsL3Z1ZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ0FBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOU5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3R0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9PQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5UUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOXNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0UUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcFVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDblFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOVNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDclJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNXRCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNWdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN0SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeGtCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDeE5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3hTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ25HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIixudWxsLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcblxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gc2V0VGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBzZXRUaW1lb3V0KGRyYWluUXVldWUsIDApO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxuLy8gVE9ETyhzaHR5bG1hbilcbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsIi8qIVxuQ29weXJpZ2h0IChDKSAyMDEzIGJ5IFdlYlJlZmxlY3Rpb25cblxuUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxub2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xudG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG5mdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuXG5UaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG5cblRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbklNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG5BVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG5MSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuVEhFIFNPRlRXQVJFLlxuXG4qL1xudmFyXG4gIC8vIHNob3VsZCBiZSBhIG5vdCBzbyBjb21tb24gY2hhclxuICAvLyBwb3NzaWJseSBvbmUgSlNPTiBkb2VzIG5vdCBlbmNvZGVcbiAgLy8gcG9zc2libHkgb25lIGVuY29kZVVSSUNvbXBvbmVudCBkb2VzIG5vdCBlbmNvZGVcbiAgLy8gcmlnaHQgbm93IHRoaXMgY2hhciBpcyAnficgYnV0IHRoaXMgbWlnaHQgY2hhbmdlIGluIHRoZSBmdXR1cmVcbiAgc3BlY2lhbENoYXIgPSAnficsXG4gIHNhZmVTcGVjaWFsQ2hhciA9ICdcXFxceCcgKyAoXG4gICAgJzAnICsgc3BlY2lhbENoYXIuY2hhckNvZGVBdCgwKS50b1N0cmluZygxNilcbiAgKS5zbGljZSgtMiksXG4gIGVzY2FwZWRTYWZlU3BlY2lhbENoYXIgPSAnXFxcXCcgKyBzYWZlU3BlY2lhbENoYXIsXG4gIHNwZWNpYWxDaGFyUkcgPSBuZXcgUmVnRXhwKHNhZmVTcGVjaWFsQ2hhciwgJ2cnKSxcbiAgc2FmZVNwZWNpYWxDaGFyUkcgPSBuZXcgUmVnRXhwKGVzY2FwZWRTYWZlU3BlY2lhbENoYXIsICdnJyksXG5cbiAgc2FmZVN0YXJ0V2l0aFNwZWNpYWxDaGFyUkcgPSBuZXcgUmVnRXhwKCcoPzpefFteXFxcXFxcXFxdKScgKyBlc2NhcGVkU2FmZVNwZWNpYWxDaGFyKSxcblxuICBpbmRleE9mID0gW10uaW5kZXhPZiB8fCBmdW5jdGlvbih2KXtcbiAgICBmb3IodmFyIGk9dGhpcy5sZW5ndGg7aS0tJiZ0aGlzW2ldIT09djspO1xuICAgIHJldHVybiBpO1xuICB9LFxuICAkU3RyaW5nID0gU3RyaW5nICAvLyB0aGVyZSdzIG5vIHdheSB0byBkcm9wIHdhcm5pbmdzIGluIEpTSGludFxuICAgICAgICAgICAgICAgICAgICAvLyBhYm91dCBuZXcgU3RyaW5nIC4uLiB3ZWxsLCBJIG5lZWQgdGhhdCBoZXJlIVxuICAgICAgICAgICAgICAgICAgICAvLyBmYWtlZCwgYW5kIGhhcHB5IGxpbnRlciFcbjtcblxuZnVuY3Rpb24gZ2VuZXJhdGVSZXBsYWNlcih2YWx1ZSwgcmVwbGFjZXIsIHJlc29sdmUpIHtcbiAgdmFyXG4gICAgcGF0aCA9IFtdLFxuICAgIGFsbCAgPSBbdmFsdWVdLFxuICAgIHNlZW4gPSBbdmFsdWVdLFxuICAgIG1hcHAgPSBbcmVzb2x2ZSA/IHNwZWNpYWxDaGFyIDogJ1tDaXJjdWxhcl0nXSxcbiAgICBsYXN0ID0gdmFsdWUsXG4gICAgbHZsICA9IDEsXG4gICAgaVxuICA7XG4gIHJldHVybiBmdW5jdGlvbihrZXksIHZhbHVlKSB7XG4gICAgLy8gdGhlIHJlcGxhY2VyIGhhcyByaWdodHMgdG8gZGVjaWRlXG4gICAgLy8gaWYgYSBuZXcgb2JqZWN0IHNob3VsZCBiZSByZXR1cm5lZFxuICAgIC8vIG9yIGlmIHRoZXJlJ3Mgc29tZSBrZXkgdG8gZHJvcFxuICAgIC8vIGxldCdzIGNhbGwgaXQgaGVyZSByYXRoZXIgdGhhbiBcInRvbyBsYXRlXCJcbiAgICBpZiAocmVwbGFjZXIpIHZhbHVlID0gcmVwbGFjZXIuY2FsbCh0aGlzLCBrZXksIHZhbHVlKTtcblxuICAgIC8vIGRpZCB5b3Uga25vdyA/IFNhZmFyaSBwYXNzZXMga2V5cyBhcyBpbnRlZ2VycyBmb3IgYXJyYXlzXG4gICAgLy8gd2hpY2ggbWVhbnMgaWYgKGtleSkgd2hlbiBrZXkgPT09IDAgd29uJ3QgcGFzcyB0aGUgY2hlY2tcbiAgICBpZiAoa2V5ICE9PSAnJykge1xuICAgICAgaWYgKGxhc3QgIT09IHRoaXMpIHtcbiAgICAgICAgaSA9IGx2bCAtIGluZGV4T2YuY2FsbChhbGwsIHRoaXMpIC0gMTtcbiAgICAgICAgbHZsIC09IGk7XG4gICAgICAgIGFsbC5zcGxpY2UobHZsLCBhbGwubGVuZ3RoKTtcbiAgICAgICAgcGF0aC5zcGxpY2UobHZsIC0gMSwgcGF0aC5sZW5ndGgpO1xuICAgICAgICBsYXN0ID0gdGhpcztcbiAgICAgIH1cbiAgICAgIC8vIGNvbnNvbGUubG9nKGx2bCwga2V5LCBwYXRoKTtcbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlKSB7XG4gICAgICAgIGx2bCA9IGFsbC5wdXNoKGxhc3QgPSB2YWx1ZSk7XG4gICAgICAgIGkgPSBpbmRleE9mLmNhbGwoc2VlbiwgdmFsdWUpO1xuICAgICAgICBpZiAoaSA8IDApIHtcbiAgICAgICAgICBpID0gc2Vlbi5wdXNoKHZhbHVlKSAtIDE7XG4gICAgICAgICAgaWYgKHJlc29sdmUpIHtcbiAgICAgICAgICAgIC8vIGtleSBjYW5ub3QgY29udGFpbiBzcGVjaWFsQ2hhciBidXQgY291bGQgYmUgbm90IGEgc3RyaW5nXG4gICAgICAgICAgICBwYXRoLnB1c2goKCcnICsga2V5KS5yZXBsYWNlKHNwZWNpYWxDaGFyUkcsIHNhZmVTcGVjaWFsQ2hhcikpO1xuICAgICAgICAgICAgbWFwcFtpXSA9IHNwZWNpYWxDaGFyICsgcGF0aC5qb2luKHNwZWNpYWxDaGFyKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbWFwcFtpXSA9IG1hcHBbMF07XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhbHVlID0gbWFwcFtpXTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgJiYgcmVzb2x2ZSkge1xuICAgICAgICAgIC8vIGVuc3VyZSBubyBzcGVjaWFsIGNoYXIgaW52b2x2ZWQgb24gZGVzZXJpYWxpemF0aW9uXG4gICAgICAgICAgLy8gaW4gdGhpcyBjYXNlIG9ubHkgZmlyc3QgY2hhciBpcyBpbXBvcnRhbnRcbiAgICAgICAgICAvLyBubyBuZWVkIHRvIHJlcGxhY2UgYWxsIHZhbHVlIChiZXR0ZXIgcGVyZm9ybWFuY2UpXG4gICAgICAgICAgdmFsdWUgPSB2YWx1ZSAucmVwbGFjZShzYWZlU3BlY2lhbENoYXIsIGVzY2FwZWRTYWZlU3BlY2lhbENoYXIpXG4gICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZShzcGVjaWFsQ2hhciwgc2FmZVNwZWNpYWxDaGFyKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdmFsdWU7XG4gIH07XG59XG5cbmZ1bmN0aW9uIHJldHJpZXZlRnJvbVBhdGgoY3VycmVudCwga2V5cykge1xuICBmb3IodmFyIGkgPSAwLCBsZW5ndGggPSBrZXlzLmxlbmd0aDsgaSA8IGxlbmd0aDsgY3VycmVudCA9IGN1cnJlbnRbXG4gICAgLy8ga2V5cyBzaG91bGQgYmUgbm9ybWFsaXplZCBiYWNrIGhlcmVcbiAgICBrZXlzW2krK10ucmVwbGFjZShzYWZlU3BlY2lhbENoYXJSRywgc3BlY2lhbENoYXIpXG4gIF0pO1xuICByZXR1cm4gY3VycmVudDtcbn1cblxuZnVuY3Rpb24gZ2VuZXJhdGVSZXZpdmVyKHJldml2ZXIpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcbiAgICB2YXIgaXNTdHJpbmcgPSB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnO1xuICAgIGlmIChpc1N0cmluZyAmJiB2YWx1ZS5jaGFyQXQoMCkgPT09IHNwZWNpYWxDaGFyKSB7XG4gICAgICByZXR1cm4gbmV3ICRTdHJpbmcodmFsdWUuc2xpY2UoMSkpO1xuICAgIH1cbiAgICBpZiAoa2V5ID09PSAnJykgdmFsdWUgPSByZWdlbmVyYXRlKHZhbHVlLCB2YWx1ZSwge30pO1xuICAgIC8vIGFnYWluLCBvbmx5IG9uZSBuZWVkZWQsIGRvIG5vdCB1c2UgdGhlIFJlZ0V4cCBmb3IgdGhpcyByZXBsYWNlbWVudFxuICAgIC8vIG9ubHkga2V5cyBuZWVkIHRoZSBSZWdFeHBcbiAgICBpZiAoaXNTdHJpbmcpIHZhbHVlID0gdmFsdWUgLnJlcGxhY2Uoc2FmZVN0YXJ0V2l0aFNwZWNpYWxDaGFyUkcsIHNwZWNpYWxDaGFyKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZShlc2NhcGVkU2FmZVNwZWNpYWxDaGFyLCBzYWZlU3BlY2lhbENoYXIpO1xuICAgIHJldHVybiByZXZpdmVyID8gcmV2aXZlci5jYWxsKHRoaXMsIGtleSwgdmFsdWUpIDogdmFsdWU7XG4gIH07XG59XG5cbmZ1bmN0aW9uIHJlZ2VuZXJhdGVBcnJheShyb290LCBjdXJyZW50LCByZXRyaWV2ZSkge1xuICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0gY3VycmVudC5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIGN1cnJlbnRbaV0gPSByZWdlbmVyYXRlKHJvb3QsIGN1cnJlbnRbaV0sIHJldHJpZXZlKTtcbiAgfVxuICByZXR1cm4gY3VycmVudDtcbn1cblxuZnVuY3Rpb24gcmVnZW5lcmF0ZU9iamVjdChyb290LCBjdXJyZW50LCByZXRyaWV2ZSkge1xuICBmb3IgKHZhciBrZXkgaW4gY3VycmVudCkge1xuICAgIGlmIChjdXJyZW50Lmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgIGN1cnJlbnRba2V5XSA9IHJlZ2VuZXJhdGUocm9vdCwgY3VycmVudFtrZXldLCByZXRyaWV2ZSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBjdXJyZW50O1xufVxuXG5mdW5jdGlvbiByZWdlbmVyYXRlKHJvb3QsIGN1cnJlbnQsIHJldHJpZXZlKSB7XG4gIHJldHVybiBjdXJyZW50IGluc3RhbmNlb2YgQXJyYXkgP1xuICAgIC8vIGZhc3QgQXJyYXkgcmVjb25zdHJ1Y3Rpb25cbiAgICByZWdlbmVyYXRlQXJyYXkocm9vdCwgY3VycmVudCwgcmV0cmlldmUpIDpcbiAgICAoXG4gICAgICBjdXJyZW50IGluc3RhbmNlb2YgJFN0cmluZyA/XG4gICAgICAgIChcbiAgICAgICAgICAvLyByb290IGlzIGFuIGVtcHR5IHN0cmluZ1xuICAgICAgICAgIGN1cnJlbnQubGVuZ3RoID9cbiAgICAgICAgICAgIChcbiAgICAgICAgICAgICAgcmV0cmlldmUuaGFzT3duUHJvcGVydHkoY3VycmVudCkgP1xuICAgICAgICAgICAgICAgIHJldHJpZXZlW2N1cnJlbnRdIDpcbiAgICAgICAgICAgICAgICByZXRyaWV2ZVtjdXJyZW50XSA9IHJldHJpZXZlRnJvbVBhdGgoXG4gICAgICAgICAgICAgICAgICByb290LCBjdXJyZW50LnNwbGl0KHNwZWNpYWxDaGFyKVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICkgOlxuICAgICAgICAgICAgcm9vdFxuICAgICAgICApIDpcbiAgICAgICAgKFxuICAgICAgICAgIGN1cnJlbnQgaW5zdGFuY2VvZiBPYmplY3QgP1xuICAgICAgICAgICAgLy8gZGVkaWNhdGVkIE9iamVjdCBwYXJzZXJcbiAgICAgICAgICAgIHJlZ2VuZXJhdGVPYmplY3Qocm9vdCwgY3VycmVudCwgcmV0cmlldmUpIDpcbiAgICAgICAgICAgIC8vIHZhbHVlIGFzIGl0IGlzXG4gICAgICAgICAgICBjdXJyZW50XG4gICAgICAgIClcbiAgICApXG4gIDtcbn1cblxuZnVuY3Rpb24gc3RyaW5naWZ5UmVjdXJzaW9uKHZhbHVlLCByZXBsYWNlciwgc3BhY2UsIGRvTm90UmVzb2x2ZSkge1xuICByZXR1cm4gSlNPTi5zdHJpbmdpZnkodmFsdWUsIGdlbmVyYXRlUmVwbGFjZXIodmFsdWUsIHJlcGxhY2VyLCAhZG9Ob3RSZXNvbHZlKSwgc3BhY2UpO1xufVxuXG5mdW5jdGlvbiBwYXJzZVJlY3Vyc2lvbih0ZXh0LCByZXZpdmVyKSB7XG4gIHJldHVybiBKU09OLnBhcnNlKHRleHQsIGdlbmVyYXRlUmV2aXZlcihyZXZpdmVyKSk7XG59XG50aGlzLnN0cmluZ2lmeSA9IHN0cmluZ2lmeVJlY3Vyc2lvbjtcbnRoaXMucGFyc2UgPSBwYXJzZVJlY3Vyc2lvbjsiLCJcbm1vZHVsZS5leHBvcnRzID0ge1xuXG4gIHJlcGxhY2U6IHRydWUsXG5cbiAgLy8gYW4gJ29wdGlvbnMnIHByb3Agd291bGQgY29uZmxpY3Qgd2l0aCBhdHRyaWJ1dGUgb24gdGhlIHRlbXBsYXRlIHJvb3Qgbm9kZVxuICBwcm9wczogWydvcHRzJywgJ3ZhbHVlJywgJ3ZhbHVlLWluZGV4JywgJ3BsYWNlaG9sZGVyJ10sXG5cbiAgdGVtcGxhdGU6ICc8c2VsZWN0IHYtbW9kZWw9XCJ2YWx1ZUluZGV4XCIgb3B0aW9ucz1cImluZGV4ZWRPcHRpb25zXCI+PC9zZWxlY3Q+JyxcblxuICBjb21wdXRlZDoge1xuXG4gICAgaW5kZXhlZE9wdGlvbnM6IGZ1bmN0aW9uKCl7XG4gICAgICB2YXIgaWR4ID0gMCxcbiAgICAgICAgICB2YWx1ZXMgPSBbXSxcbiAgICAgICAgICBpZHhPcHRzID0gW11cblxuICAgICAgaWYgKHRoaXMucGxhY2Vob2xkZXIpe1xuICAgICAgICB2YWx1ZXMucHVzaCh1bmRlZmluZWQpXG4gICAgICAgIGlkeE9wdHMucHVzaCh7IHZhbHVlOiBpZHgrKyxcbiAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IHRoaXMucGxhY2Vob2xkZXIgfSlcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLm9wdHMpe1xuICAgICAgICB0aGlzLm9wdHMuZm9yRWFjaChmdW5jdGlvbihvcCl7XG4gICAgICAgICAgaWR4T3B0cy5wdXNoKG9wLm9wdGlvbnNcbiAgICAgICAgICAgICAgICAgICAgICAgPyB7IGxhYmVsOiBvcC5sYWJlbCwgb3B0aW9uczogb3Aub3B0aW9ucy5tYXAoaW5kZXgpIH1cbiAgICAgICAgICAgICAgICAgICAgICAgOiBpbmRleChvcCkpXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgICBpZHhPcHRzLnZhbHVlcyA9IHZhbHVlc1xuXG4gICAgICByZXR1cm4gaWR4T3B0c1xuXG4gICAgICBmdW5jdGlvbiBpbmRleChvcCl7XG4gICAgICAgIGlmICh0eXBlb2Ygb3AgPT09ICdvYmplY3QnICYmICd2YWx1ZScgaW4gb3Ape1xuICAgICAgICAgIHZhbHVlcy5wdXNoKG9wLnZhbHVlKVxuICAgICAgICAgIHJldHVybiB7dmFsdWU6IGlkeCsrLCB0ZXh0OiBvcC50ZXh0IHx8IG9wLnZhbHVlfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhbHVlcy5wdXNoKG9wKVxuICAgICAgICAgIHJldHVybiB7dmFsdWU6IGlkeCsrLCB0ZXh0OiBvcH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgfSxcblxuICAgIHZhbHVlOiB7XG4gICAgICBnZXQ6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHJldHVybiB0aGlzLiRkYXRhLnZhbHVlXG4gICAgICB9LFxuICAgICAgc2V0OiBmdW5jdGlvbih2YWx1ZSl7XG4gICAgICAgIHZhciB2YWxzID0gdGhpcy5pbmRleGVkT3B0aW9ucy52YWx1ZXNcbiAgICAgICAgdGhpcy52YWx1ZUluZGV4ID0gdGhpcy4kZWwubXVsdGlwbGUgJiYgQXJyYXkuaXNBcnJheSh2YWx1ZSlcbiAgICAgICAgICA/IHZhbHVlLm1hcChmdW5jdGlvbih2KXtcbiAgICAgICAgICAgIHJldHVybiBpbmRleE9mKHZhbHMsIHYpXG4gICAgICAgICAgfSlcbiAgICAgICAgICA6IGluZGV4T2YodmFscywgdmFsdWUpXG4gICAgICB9XG4gICAgfSxcblxuICAgIHZhbHVlSW5kZXg6IHtcbiAgICAgIGdldDogZnVuY3Rpb24oKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuJGRhdGEudmFsdWVJbmRleFxuICAgICAgfSxcbiAgICAgIHNldDogZnVuY3Rpb24oaWR4KXtcbiAgICAgICAgdGhpcy4kZGF0YS52YWx1ZUluZGV4ID0gaWR4XG4gICAgICAgIHZhciB2YWxzID0gdGhpcy5pbmRleGVkT3B0aW9ucy52YWx1ZXNcbiAgICAgICAgdGhpcy4kZGF0YS52YWx1ZSA9IEFycmF5LmlzQXJyYXkoaWR4KVxuICAgICAgICAgID8gaWR4Lm1hcChmdW5jdGlvbihpKXtcbiAgICAgICAgICAgIHJldHVybiB2YWxzW2ldXG4gICAgICAgICAgfSlcbiAgICAgICAgICA6IHZhbHNbaWR4XVxuICAgICAgfVxuXG4gICAgfVxuICB9LFxuXG4gIHdhdGNoOiB7XG5cbiAgICBpbmRleGVkT3B0aW9uczogZnVuY3Rpb24oKXtcbiAgICAgIC8vIHVwZGF0ZXMgdmFsdWVJbmRleFxuICAgICAgdGhpcy52YWx1ZSA9IHRoaXMuJGRhdGEudmFsdWVcbiAgICB9XG5cbiAgfVxuXG59XG5cblxuZnVuY3Rpb24gaW5kZXhPZihhcnIsIHgpe1xuICB2YXIgaSwgbCA9IGFyci5sZW5ndGhcbiAgZm9yIChpID0gMDsgaSA8IGw7IGkrKykgaWYgKGFycltpXSA9PT0geCkgcmV0dXJuIGlcbiAgZm9yIChpID0gMDsgaSA8IGw7IGkrKykgaWYgKGVxdWFsKGFycltpXSwgeCkpIHJldHVybiBpXG4gIHJldHVybiAtMVxufVxuXG5cblxudmFyIGhvcCA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHksXG4gICAgaXBvID0gT2JqZWN0LnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mXG5cbi8vIHR5cGVkIGVxdWFsXG4vLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzEwNjg4MzQvb2JqZWN0LWNvbXBhcmlzb24taW4tamF2YXNjcmlwdC8xMTQ0MjQ5IzExNDQyNDlcbmZ1bmN0aW9uIGVxdWFsKCl7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoIDwgMSkgdGhyb3cgXCJOZWVkIHR3byBvciBtb3JlIGFyZ3VtZW50cyB0byBjb21wYXJlXCJcblxuICB2YXIgaSwgbCwgbGVmdENoYWluLCByaWdodENoYWluXG4gIGZvciAoaSA9IDEsIGwgPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbDsgaSsrKXtcbiAgICBsZWZ0Q2hhaW4gPSBbXVxuICAgIHJpZ2h0Q2hhaW4gPSBbXVxuICAgIGlmICghX2VxdWFsKGFyZ3VtZW50c1swXSwgYXJndW1lbnRzW2ldKSkgcmV0dXJuIGZhbHNlXG4gIH1cblxuICByZXR1cm4gdHJ1ZVxuXG4gIGZ1bmN0aW9uIF9lcXVhbCh4LCB5KXtcbiAgICAvLyByZW1lbWJlciB0aGF0IE5hTiA9PT0gTmFOIHJldHVybnMgZmFsc2VcbiAgICAvLyBhbmQgaXNOYU4odW5kZWZpbmVkKSByZXR1cm5zIHRydWVcbiAgICBpZiAoTnVtYmVyLmlzTmFOKHgpICYmIE51bWJlci5pc05hTih5KSAmJlxuICAgICAgICB0eXBlb2YgeCA9PT0gJ251bWJlcicgJiYgdHlwZW9mIHkgPT09ICdudW1iZXInKXtcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuXG4gICAgLy8gQ29tcGFyZSBwcmltaXRpdmVzIGFuZCBmdW5jdGlvbnMuXG4gICAgLy8gQ2hlY2sgaWYgYm90aCBhcmd1bWVudHMgbGluayB0byB0aGUgc2FtZSBvYmplY3QuXG4gICAgLy8gRXNwZWNpYWxseSB1c2VmdWwgb24gc3RlcCB3aGVuIGNvbXBhcmluZyBwcm90b3R5cGVzXG4gICAgaWYgKHggPT09IHkpIHJldHVybiB0cnVlXG5cbiAgICAvLyBXb3JrcyBpbiBjYXNlIHdoZW4gZnVuY3Rpb25zIGFyZSBjcmVhdGVkIGluIGNvbnN0cnVjdG9yLlxuICAgIC8vIENvbXBhcmluZyBkYXRlcyBpcyBhIGNvbW1vbiBzY2VuYXJpby4gQW5vdGhlciBidWlsdC1pbnM/XG4gICAgLy8gV2UgY2FuIGV2ZW4gaGFuZGxlIGZ1bmN0aW9ucyBwYXNzZWQgYWNyb3NzIGlmcmFtZXNcbiAgICBpZiAoKHR5cGVvZiB4ID09PSAnZnVuY3Rpb24nICYmIHR5cGVvZiB5ID09PSAnZnVuY3Rpb24nKSB8fFxuICAgICAgICAoeCBpbnN0YW5jZW9mIERhdGUgJiYgeSBpbnN0YW5jZW9mIERhdGUpIHx8XG4gICAgICAgICh4IGluc3RhbmNlb2YgUmVnRXhwICYmIHkgaW5zdGFuY2VvZiBSZWdFeHApIHx8XG4gICAgICAgICh4IGluc3RhbmNlb2YgU3RyaW5nICYmIHkgaW5zdGFuY2VvZiBTdHJpbmcpIHx8XG4gICAgICAgICh4IGluc3RhbmNlb2YgTnVtYmVyICYmIHkgaW5zdGFuY2VvZiBOdW1iZXIpKXtcbiAgICAgIHJldHVybiB4LnRvU3RyaW5nKCkgPT09IHkudG9TdHJpbmcoKVxuICAgIH1cblxuICAgIC8vIEF0IGxhc3QgY2hlY2tpbmcgcHJvdG90eXBlcyBhcyBnb29kIGEgd2UgY2FuXG4gICAgaWYgKCEoeCBpbnN0YW5jZW9mIE9iamVjdCAmJiB5IGluc3RhbmNlb2YgT2JqZWN0KSB8fFxuICAgICAgICBpcG8uY2FsbCh4LHkpIHx8IGlwby5jYWxsKHkseCkgfHxcbiAgICAgICAgeC5jb25zdHJ1Y3RvciAhPT0geS5jb25zdHJ1Y3RvciB8fFxuICAgICAgICB4LnByb3RvdHlwZSAhPT0geS5wcm90b3R5cGUpe1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgZm9yIGluZmluaXRlIGxpbmtpbmcgbG9vcHNcbiAgICBpZiAobGVmdENoYWluLmluZGV4T2YoeCkgPiAtMSB8fCByaWdodENoYWluLmluZGV4T2YoeSkgPiAtMSkgcmV0dXJuIGZhbHNlXG5cbiAgICAvLyBRdWljayBjaGVja2luZyBvZiBvbmUgb2JqZWN0IGJlZWluZyBhIHN1YnNldCBvZiBhbm90aGVyLlxuICAgIC8vIHRvZG86IGNhY2hlIHRoZSBzdHJ1Y3R1cmUgb2YgYXJndW1lbnRzWzBdIGZvciBwZXJmb3JtYW5jZVxuICAgIHZhciBwXG4gICAgZm9yIChwIGluIHkpe1xuICAgICAgaWYgKGhvcC5jYWxsKHkscCkgIT09IGhvcC5jYWxsKHgscCkgfHwgdHlwZW9mIHlbcF0gIT09IHR5cGVvZiB4W3BdKSByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICBmb3IgKHAgaW4geCl7XG4gICAgICBpZiAoaG9wLmNhbGwoeSxwKSAhPT0gaG9wLmNhbGwoeCxwKSB8fCB0eXBlb2YgeVtwXSAhPT0gdHlwZW9mIHhbcF0pIHJldHVybiBmYWxzZVxuXG4gICAgICBzd2l0Y2ggKHR5cGVvZiB4W3BdKXtcbiAgICAgIGNhc2UgJ29iamVjdCc6XG4gICAgICBjYXNlICdmdW5jdGlvbic6XG4gICAgICAgIGxlZnRDaGFpbi5wdXNoKHgpXG4gICAgICAgIHJpZ2h0Q2hhaW4ucHVzaCh5KVxuICAgICAgICBpZiAoIV9lcXVhbCh4W3BdLCB5W3BdKSkgcmV0dXJuIGZhbHNlXG4gICAgICAgIGxlZnRDaGFpbi5wb3AoKVxuICAgICAgICByaWdodENoYWluLnBvcCgpXG4gICAgICAgIGJyZWFrXG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmICh4W3BdICE9PSB5W3BdKSByZXR1cm4gZmFsc2VcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZVxuICB9XG5cbn1cbiIsInZhciBfID0gcmVxdWlyZSgnLi4vdXRpbCcpXG5cbi8qKlxuICogQ3JlYXRlIGEgY2hpbGQgaW5zdGFuY2UgdGhhdCBwcm90b3R5cGFsbHkgaW5laHJpdHNcbiAqIGRhdGEgb24gcGFyZW50LiBUbyBhY2hpZXZlIHRoYXQgd2UgY3JlYXRlIGFuIGludGVybWVkaWF0ZVxuICogY29uc3RydWN0b3Igd2l0aCBpdHMgcHJvdG90eXBlIHBvaW50aW5nIHRvIHBhcmVudC5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0c1xuICogQHBhcmFtIHtGdW5jdGlvbn0gW0Jhc2VDdG9yXVxuICogQHJldHVybiB7VnVlfVxuICogQHB1YmxpY1xuICovXG5cbmV4cG9ydHMuJGFkZENoaWxkID0gZnVuY3Rpb24gKG9wdHMsIEJhc2VDdG9yKSB7XG4gIEJhc2VDdG9yID0gQmFzZUN0b3IgfHwgXy5WdWVcbiAgb3B0cyA9IG9wdHMgfHwge31cbiAgdmFyIHBhcmVudCA9IHRoaXNcbiAgdmFyIENoaWxkVnVlXG4gIHZhciBpbmhlcml0ID0gb3B0cy5pbmhlcml0ICE9PSB1bmRlZmluZWRcbiAgICA/IG9wdHMuaW5oZXJpdFxuICAgIDogQmFzZUN0b3Iub3B0aW9ucy5pbmhlcml0XG4gIGlmIChpbmhlcml0KSB7XG4gICAgdmFyIGN0b3JzID0gcGFyZW50Ll9jaGlsZEN0b3JzXG4gICAgQ2hpbGRWdWUgPSBjdG9yc1tCYXNlQ3Rvci5jaWRdXG4gICAgaWYgKCFDaGlsZFZ1ZSkge1xuICAgICAgdmFyIG9wdGlvbk5hbWUgPSBCYXNlQ3Rvci5vcHRpb25zLm5hbWVcbiAgICAgIHZhciBjbGFzc05hbWUgPSBvcHRpb25OYW1lXG4gICAgICAgID8gXy5jbGFzc2lmeShvcHRpb25OYW1lKVxuICAgICAgICA6ICdWdWVDb21wb25lbnQnXG4gICAgICBDaGlsZFZ1ZSA9IG5ldyBGdW5jdGlvbihcbiAgICAgICAgJ3JldHVybiBmdW5jdGlvbiAnICsgY2xhc3NOYW1lICsgJyAob3B0aW9ucykgeycgK1xuICAgICAgICAndGhpcy5jb25zdHJ1Y3RvciA9ICcgKyBjbGFzc05hbWUgKyAnOycgK1xuICAgICAgICAndGhpcy5faW5pdChvcHRpb25zKSB9J1xuICAgICAgKSgpXG4gICAgICBDaGlsZFZ1ZS5vcHRpb25zID0gQmFzZUN0b3Iub3B0aW9uc1xuICAgICAgQ2hpbGRWdWUucHJvdG90eXBlID0gdGhpc1xuICAgICAgY3RvcnNbQmFzZUN0b3IuY2lkXSA9IENoaWxkVnVlXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIENoaWxkVnVlID0gQmFzZUN0b3JcbiAgfVxuICBvcHRzLl9wYXJlbnQgPSBwYXJlbnRcbiAgb3B0cy5fcm9vdCA9IHBhcmVudC4kcm9vdFxuICB2YXIgY2hpbGQgPSBuZXcgQ2hpbGRWdWUob3B0cylcbiAgcmV0dXJuIGNoaWxkXG59IiwidmFyIFdhdGNoZXIgPSByZXF1aXJlKCcuLi93YXRjaGVyJylcbnZhciBQYXRoID0gcmVxdWlyZSgnLi4vcGFyc2Vycy9wYXRoJylcbnZhciB0ZXh0UGFyc2VyID0gcmVxdWlyZSgnLi4vcGFyc2Vycy90ZXh0JylcbnZhciBkaXJQYXJzZXIgPSByZXF1aXJlKCcuLi9wYXJzZXJzL2RpcmVjdGl2ZScpXG52YXIgZXhwUGFyc2VyID0gcmVxdWlyZSgnLi4vcGFyc2Vycy9leHByZXNzaW9uJylcbnZhciBmaWx0ZXJSRSA9IC9bXnxdXFx8W158XS9cblxuLyoqXG4gKiBHZXQgdGhlIHZhbHVlIGZyb20gYW4gZXhwcmVzc2lvbiBvbiB0aGlzIHZtLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBleHBcbiAqIEByZXR1cm4geyp9XG4gKi9cblxuZXhwb3J0cy4kZ2V0ID0gZnVuY3Rpb24gKGV4cCkge1xuICB2YXIgcmVzID0gZXhwUGFyc2VyLnBhcnNlKGV4cClcbiAgaWYgKHJlcykge1xuICAgIHJldHVybiByZXMuZ2V0LmNhbGwodGhpcywgdGhpcylcbiAgfVxufVxuXG4vKipcbiAqIFNldCB0aGUgdmFsdWUgZnJvbSBhbiBleHByZXNzaW9uIG9uIHRoaXMgdm0uXG4gKiBUaGUgZXhwcmVzc2lvbiBtdXN0IGJlIGEgdmFsaWQgbGVmdC1oYW5kXG4gKiBleHByZXNzaW9uIGluIGFuIGFzc2lnbm1lbnQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV4cFxuICogQHBhcmFtIHsqfSB2YWxcbiAqL1xuXG5leHBvcnRzLiRzZXQgPSBmdW5jdGlvbiAoZXhwLCB2YWwpIHtcbiAgdmFyIHJlcyA9IGV4cFBhcnNlci5wYXJzZShleHAsIHRydWUpXG4gIGlmIChyZXMgJiYgcmVzLnNldCkge1xuICAgIHJlcy5zZXQuY2FsbCh0aGlzLCB0aGlzLCB2YWwpXG4gIH1cbn1cblxuLyoqXG4gKiBBZGQgYSBwcm9wZXJ0eSBvbiB0aGUgVk1cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30ga2V5XG4gKiBAcGFyYW0geyp9IHZhbFxuICovXG5cbmV4cG9ydHMuJGFkZCA9IGZ1bmN0aW9uIChrZXksIHZhbCkge1xuICB0aGlzLl9kYXRhLiRhZGQoa2V5LCB2YWwpXG59XG5cbi8qKlxuICogRGVsZXRlIGEgcHJvcGVydHkgb24gdGhlIFZNXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGtleVxuICovXG5cbmV4cG9ydHMuJGRlbGV0ZSA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgdGhpcy5fZGF0YS4kZGVsZXRlKGtleSlcbn1cblxuLyoqXG4gKiBXYXRjaCBhbiBleHByZXNzaW9uLCB0cmlnZ2VyIGNhbGxiYWNrIHdoZW4gaXRzXG4gKiB2YWx1ZSBjaGFuZ2VzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBleHBcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNiXG4gKiBAcGFyYW0ge0Jvb2xlYW59IFtkZWVwXVxuICogQHBhcmFtIHtCb29sZWFufSBbaW1tZWRpYXRlXVxuICogQHJldHVybiB7RnVuY3Rpb259IC0gdW53YXRjaEZuXG4gKi9cblxuZXhwb3J0cy4kd2F0Y2ggPSBmdW5jdGlvbiAoZXhwLCBjYiwgZGVlcCwgaW1tZWRpYXRlKSB7XG4gIHZhciB2bSA9IHRoaXNcbiAgdmFyIHdyYXBwZWRDYiA9IGZ1bmN0aW9uICh2YWwsIG9sZFZhbCkge1xuICAgIGNiLmNhbGwodm0sIHZhbCwgb2xkVmFsKVxuICB9XG4gIHZhciB3YXRjaGVyID0gbmV3IFdhdGNoZXIodm0sIGV4cCwgd3JhcHBlZENiLCB7XG4gICAgZGVlcDogZGVlcCxcbiAgICB1c2VyOiB0cnVlXG4gIH0pXG4gIGlmIChpbW1lZGlhdGUpIHtcbiAgICB3cmFwcGVkQ2Iod2F0Y2hlci52YWx1ZSlcbiAgfVxuICByZXR1cm4gZnVuY3Rpb24gdW53YXRjaEZuICgpIHtcbiAgICB3YXRjaGVyLnRlYXJkb3duKClcbiAgfVxufVxuXG4vKipcbiAqIEV2YWx1YXRlIGEgdGV4dCBkaXJlY3RpdmUsIGluY2x1ZGluZyBmaWx0ZXJzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSB0ZXh0XG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKi9cblxuZXhwb3J0cy4kZXZhbCA9IGZ1bmN0aW9uICh0ZXh0KSB7XG4gIC8vIGNoZWNrIGZvciBmaWx0ZXJzLlxuICBpZiAoZmlsdGVyUkUudGVzdCh0ZXh0KSkge1xuICAgIHZhciBkaXIgPSBkaXJQYXJzZXIucGFyc2UodGV4dClbMF1cbiAgICAvLyB0aGUgZmlsdGVyIHJlZ2V4IGNoZWNrIG1pZ2h0IGdpdmUgZmFsc2UgcG9zaXRpdmVcbiAgICAvLyBmb3IgcGlwZXMgaW5zaWRlIHN0cmluZ3MsIHNvIGl0J3MgcG9zc2libGUgdGhhdFxuICAgIC8vIHdlIGRvbid0IGdldCBhbnkgZmlsdGVycyBoZXJlXG4gICAgdmFyIHZhbCA9IHRoaXMuJGdldChkaXIuZXhwcmVzc2lvbilcbiAgICByZXR1cm4gZGlyLmZpbHRlcnNcbiAgICAgID8gdGhpcy5fYXBwbHlGaWx0ZXJzKHZhbCwgbnVsbCwgZGlyLmZpbHRlcnMpXG4gICAgICA6IHZhbFxuICB9IGVsc2Uge1xuICAgIC8vIG5vIGZpbHRlclxuICAgIHJldHVybiB0aGlzLiRnZXQodGV4dClcbiAgfVxufVxuXG4vKipcbiAqIEludGVycG9sYXRlIGEgcGllY2Ugb2YgdGVtcGxhdGUgdGV4dC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdGV4dFxuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5cbmV4cG9ydHMuJGludGVycG9sYXRlID0gZnVuY3Rpb24gKHRleHQpIHtcbiAgdmFyIHRva2VucyA9IHRleHRQYXJzZXIucGFyc2UodGV4dClcbiAgdmFyIHZtID0gdGhpc1xuICBpZiAodG9rZW5zKSB7XG4gICAgcmV0dXJuIHRva2Vucy5sZW5ndGggPT09IDFcbiAgICAgID8gdm0uJGV2YWwodG9rZW5zWzBdLnZhbHVlKVxuICAgICAgOiB0b2tlbnMubWFwKGZ1bmN0aW9uICh0b2tlbikge1xuICAgICAgICAgIHJldHVybiB0b2tlbi50YWdcbiAgICAgICAgICAgID8gdm0uJGV2YWwodG9rZW4udmFsdWUpXG4gICAgICAgICAgICA6IHRva2VuLnZhbHVlXG4gICAgICAgIH0pLmpvaW4oJycpXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHRleHRcbiAgfVxufVxuXG4vKipcbiAqIExvZyBpbnN0YW5jZSBkYXRhIGFzIGEgcGxhaW4gSlMgb2JqZWN0XG4gKiBzbyB0aGF0IGl0IGlzIGVhc2llciB0byBpbnNwZWN0IGluIGNvbnNvbGUuXG4gKiBUaGlzIG1ldGhvZCBhc3N1bWVzIGNvbnNvbGUgaXMgYXZhaWxhYmxlLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBbcGF0aF1cbiAqL1xuXG5leHBvcnRzLiRsb2cgPSBmdW5jdGlvbiAocGF0aCkge1xuICB2YXIgZGF0YSA9IHBhdGhcbiAgICA/IFBhdGguZ2V0KHRoaXMuX2RhdGEsIHBhdGgpXG4gICAgOiB0aGlzLl9kYXRhXG4gIGlmIChkYXRhKSB7XG4gICAgZGF0YSA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoZGF0YSkpXG4gIH1cbiAgY29uc29sZS5sb2coZGF0YSlcbn0iLCJ2YXIgXyA9IHJlcXVpcmUoJy4uL3V0aWwnKVxudmFyIHRyYW5zaXRpb24gPSByZXF1aXJlKCcuLi90cmFuc2l0aW9uJylcblxuLyoqXG4gKiBDb252ZW5pZW5jZSBvbi1pbnN0YW5jZSBuZXh0VGljay4gVGhlIGNhbGxiYWNrIGlzXG4gKiBhdXRvLWJvdW5kIHRvIHRoZSBpbnN0YW5jZSwgYW5kIHRoaXMgYXZvaWRzIGNvbXBvbmVudFxuICogbW9kdWxlcyBoYXZpbmcgdG8gcmVseSBvbiB0aGUgZ2xvYmFsIFZ1ZS5cbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICovXG5cbmV4cG9ydHMuJG5leHRUaWNrID0gZnVuY3Rpb24gKGZuKSB7XG4gIF8ubmV4dFRpY2soZm4sIHRoaXMpXG59XG5cbi8qKlxuICogQXBwZW5kIGluc3RhbmNlIHRvIHRhcmdldFxuICpcbiAqIEBwYXJhbSB7Tm9kZX0gdGFyZ2V0XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY2JdXG4gKiBAcGFyYW0ge0Jvb2xlYW59IFt3aXRoVHJhbnNpdGlvbl0gLSBkZWZhdWx0cyB0byB0cnVlXG4gKi9cblxuZXhwb3J0cy4kYXBwZW5kVG8gPSBmdW5jdGlvbiAodGFyZ2V0LCBjYiwgd2l0aFRyYW5zaXRpb24pIHtcbiAgcmV0dXJuIGluc2VydChcbiAgICB0aGlzLCB0YXJnZXQsIGNiLCB3aXRoVHJhbnNpdGlvbixcbiAgICBhcHBlbmQsIHRyYW5zaXRpb24uYXBwZW5kXG4gIClcbn1cblxuLyoqXG4gKiBQcmVwZW5kIGluc3RhbmNlIHRvIHRhcmdldFxuICpcbiAqIEBwYXJhbSB7Tm9kZX0gdGFyZ2V0XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY2JdXG4gKiBAcGFyYW0ge0Jvb2xlYW59IFt3aXRoVHJhbnNpdGlvbl0gLSBkZWZhdWx0cyB0byB0cnVlXG4gKi9cblxuZXhwb3J0cy4kcHJlcGVuZFRvID0gZnVuY3Rpb24gKHRhcmdldCwgY2IsIHdpdGhUcmFuc2l0aW9uKSB7XG4gIHRhcmdldCA9IHF1ZXJ5KHRhcmdldClcbiAgaWYgKHRhcmdldC5oYXNDaGlsZE5vZGVzKCkpIHtcbiAgICB0aGlzLiRiZWZvcmUodGFyZ2V0LmZpcnN0Q2hpbGQsIGNiLCB3aXRoVHJhbnNpdGlvbilcbiAgfSBlbHNlIHtcbiAgICB0aGlzLiRhcHBlbmRUbyh0YXJnZXQsIGNiLCB3aXRoVHJhbnNpdGlvbilcbiAgfVxuICByZXR1cm4gdGhpc1xufVxuXG4vKipcbiAqIEluc2VydCBpbnN0YW5jZSBiZWZvcmUgdGFyZ2V0XG4gKlxuICogQHBhcmFtIHtOb2RlfSB0YXJnZXRcbiAqIEBwYXJhbSB7RnVuY3Rpb259IFtjYl1cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gW3dpdGhUcmFuc2l0aW9uXSAtIGRlZmF1bHRzIHRvIHRydWVcbiAqL1xuXG5leHBvcnRzLiRiZWZvcmUgPSBmdW5jdGlvbiAodGFyZ2V0LCBjYiwgd2l0aFRyYW5zaXRpb24pIHtcbiAgcmV0dXJuIGluc2VydChcbiAgICB0aGlzLCB0YXJnZXQsIGNiLCB3aXRoVHJhbnNpdGlvbixcbiAgICBiZWZvcmUsIHRyYW5zaXRpb24uYmVmb3JlXG4gIClcbn1cblxuLyoqXG4gKiBJbnNlcnQgaW5zdGFuY2UgYWZ0ZXIgdGFyZ2V0XG4gKlxuICogQHBhcmFtIHtOb2RlfSB0YXJnZXRcbiAqIEBwYXJhbSB7RnVuY3Rpb259IFtjYl1cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gW3dpdGhUcmFuc2l0aW9uXSAtIGRlZmF1bHRzIHRvIHRydWVcbiAqL1xuXG5leHBvcnRzLiRhZnRlciA9IGZ1bmN0aW9uICh0YXJnZXQsIGNiLCB3aXRoVHJhbnNpdGlvbikge1xuICB0YXJnZXQgPSBxdWVyeSh0YXJnZXQpXG4gIGlmICh0YXJnZXQubmV4dFNpYmxpbmcpIHtcbiAgICB0aGlzLiRiZWZvcmUodGFyZ2V0Lm5leHRTaWJsaW5nLCBjYiwgd2l0aFRyYW5zaXRpb24pXG4gIH0gZWxzZSB7XG4gICAgdGhpcy4kYXBwZW5kVG8odGFyZ2V0LnBhcmVudE5vZGUsIGNiLCB3aXRoVHJhbnNpdGlvbilcbiAgfVxuICByZXR1cm4gdGhpc1xufVxuXG4vKipcbiAqIFJlbW92ZSBpbnN0YW5jZSBmcm9tIERPTVxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IFtjYl1cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gW3dpdGhUcmFuc2l0aW9uXSAtIGRlZmF1bHRzIHRvIHRydWVcbiAqL1xuXG5leHBvcnRzLiRyZW1vdmUgPSBmdW5jdGlvbiAoY2IsIHdpdGhUcmFuc2l0aW9uKSB7XG4gIHZhciBpbkRvYyA9IHRoaXMuX2lzQXR0YWNoZWQgJiYgXy5pbkRvYyh0aGlzLiRlbClcbiAgLy8gaWYgd2UgYXJlIG5vdCBpbiBkb2N1bWVudCwgbm8gbmVlZCB0byBjaGVja1xuICAvLyBmb3IgdHJhbnNpdGlvbnNcbiAgaWYgKCFpbkRvYykgd2l0aFRyYW5zaXRpb24gPSBmYWxzZVxuICB2YXIgb3BcbiAgdmFyIHNlbGYgPSB0aGlzXG4gIHZhciByZWFsQ2IgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKGluRG9jKSBzZWxmLl9jYWxsSG9vaygnZGV0YWNoZWQnKVxuICAgIGlmIChjYikgY2IoKVxuICB9XG4gIGlmIChcbiAgICB0aGlzLl9pc0Jsb2NrICYmXG4gICAgIXRoaXMuX2Jsb2NrRnJhZ21lbnQuaGFzQ2hpbGROb2RlcygpXG4gICkge1xuICAgIG9wID0gd2l0aFRyYW5zaXRpb24gPT09IGZhbHNlXG4gICAgICA/IGFwcGVuZFxuICAgICAgOiB0cmFuc2l0aW9uLnJlbW92ZVRoZW5BcHBlbmRcbiAgICBibG9ja09wKHRoaXMsIHRoaXMuX2Jsb2NrRnJhZ21lbnQsIG9wLCByZWFsQ2IpXG4gIH0gZWxzZSB7XG4gICAgb3AgPSB3aXRoVHJhbnNpdGlvbiA9PT0gZmFsc2VcbiAgICAgID8gcmVtb3ZlXG4gICAgICA6IHRyYW5zaXRpb24ucmVtb3ZlXG4gICAgb3AodGhpcy4kZWwsIHRoaXMsIHJlYWxDYilcbiAgfVxuICByZXR1cm4gdGhpc1xufVxuXG4vKipcbiAqIFNoYXJlZCBET00gaW5zZXJ0aW9uIGZ1bmN0aW9uLlxuICpcbiAqIEBwYXJhbSB7VnVlfSB2bVxuICogQHBhcmFtIHtFbGVtZW50fSB0YXJnZXRcbiAqIEBwYXJhbSB7RnVuY3Rpb259IFtjYl1cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gW3dpdGhUcmFuc2l0aW9uXVxuICogQHBhcmFtIHtGdW5jdGlvbn0gb3AxIC0gb3AgZm9yIG5vbi10cmFuc2l0aW9uIGluc2VydFxuICogQHBhcmFtIHtGdW5jdGlvbn0gb3AyIC0gb3AgZm9yIHRyYW5zaXRpb24gaW5zZXJ0XG4gKiBAcmV0dXJuIHZtXG4gKi9cblxuZnVuY3Rpb24gaW5zZXJ0ICh2bSwgdGFyZ2V0LCBjYiwgd2l0aFRyYW5zaXRpb24sIG9wMSwgb3AyKSB7XG4gIHRhcmdldCA9IHF1ZXJ5KHRhcmdldClcbiAgdmFyIHRhcmdldElzRGV0YWNoZWQgPSAhXy5pbkRvYyh0YXJnZXQpXG4gIHZhciBvcCA9IHdpdGhUcmFuc2l0aW9uID09PSBmYWxzZSB8fCB0YXJnZXRJc0RldGFjaGVkXG4gICAgPyBvcDFcbiAgICA6IG9wMlxuICB2YXIgc2hvdWxkQ2FsbEhvb2sgPVxuICAgICF0YXJnZXRJc0RldGFjaGVkICYmXG4gICAgIXZtLl9pc0F0dGFjaGVkICYmXG4gICAgIV8uaW5Eb2Modm0uJGVsKVxuICBpZiAodm0uX2lzQmxvY2spIHtcbiAgICBibG9ja09wKHZtLCB0YXJnZXQsIG9wLCBjYilcbiAgfSBlbHNlIHtcbiAgICBvcCh2bS4kZWwsIHRhcmdldCwgdm0sIGNiKVxuICB9XG4gIGlmIChzaG91bGRDYWxsSG9vaykge1xuICAgIHZtLl9jYWxsSG9vaygnYXR0YWNoZWQnKVxuICB9XG4gIHJldHVybiB2bVxufVxuXG4vKipcbiAqIEV4ZWN1dGUgYSB0cmFuc2l0aW9uIG9wZXJhdGlvbiBvbiBhIGJsb2NrIGluc3RhbmNlLFxuICogaXRlcmF0aW5nIHRocm91Z2ggYWxsIGl0cyBibG9jayBub2Rlcy5cbiAqXG4gKiBAcGFyYW0ge1Z1ZX0gdm1cbiAqIEBwYXJhbSB7Tm9kZX0gdGFyZ2V0XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBvcFxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2JcbiAqL1xuXG5mdW5jdGlvbiBibG9ja09wICh2bSwgdGFyZ2V0LCBvcCwgY2IpIHtcbiAgdmFyIGN1cnJlbnQgPSB2bS5fYmxvY2tTdGFydFxuICB2YXIgZW5kID0gdm0uX2Jsb2NrRW5kXG4gIHZhciBuZXh0XG4gIHdoaWxlIChuZXh0ICE9PSBlbmQpIHtcbiAgICBuZXh0ID0gY3VycmVudC5uZXh0U2libGluZ1xuICAgIG9wKGN1cnJlbnQsIHRhcmdldCwgdm0pXG4gICAgY3VycmVudCA9IG5leHRcbiAgfVxuICBvcChlbmQsIHRhcmdldCwgdm0sIGNiKVxufVxuXG4vKipcbiAqIENoZWNrIGZvciBzZWxlY3RvcnNcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xFbGVtZW50fSBlbFxuICovXG5cbmZ1bmN0aW9uIHF1ZXJ5IChlbCkge1xuICByZXR1cm4gdHlwZW9mIGVsID09PSAnc3RyaW5nJ1xuICAgID8gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihlbClcbiAgICA6IGVsXG59XG5cbi8qKlxuICogQXBwZW5kIG9wZXJhdGlvbiB0aGF0IHRha2VzIGEgY2FsbGJhY2suXG4gKlxuICogQHBhcmFtIHtOb2RlfSBlbFxuICogQHBhcmFtIHtOb2RlfSB0YXJnZXRcbiAqIEBwYXJhbSB7VnVlfSB2bSAtIHVudXNlZFxuICogQHBhcmFtIHtGdW5jdGlvbn0gW2NiXVxuICovXG5cbmZ1bmN0aW9uIGFwcGVuZCAoZWwsIHRhcmdldCwgdm0sIGNiKSB7XG4gIHRhcmdldC5hcHBlbmRDaGlsZChlbClcbiAgaWYgKGNiKSBjYigpXG59XG5cbi8qKlxuICogSW5zZXJ0QmVmb3JlIG9wZXJhdGlvbiB0aGF0IHRha2VzIGEgY2FsbGJhY2suXG4gKlxuICogQHBhcmFtIHtOb2RlfSBlbFxuICogQHBhcmFtIHtOb2RlfSB0YXJnZXRcbiAqIEBwYXJhbSB7VnVlfSB2bSAtIHVudXNlZFxuICogQHBhcmFtIHtGdW5jdGlvbn0gW2NiXVxuICovXG5cbmZ1bmN0aW9uIGJlZm9yZSAoZWwsIHRhcmdldCwgdm0sIGNiKSB7XG4gIF8uYmVmb3JlKGVsLCB0YXJnZXQpXG4gIGlmIChjYikgY2IoKVxufVxuXG4vKipcbiAqIFJlbW92ZSBvcGVyYXRpb24gdGhhdCB0YWtlcyBhIGNhbGxiYWNrLlxuICpcbiAqIEBwYXJhbSB7Tm9kZX0gZWxcbiAqIEBwYXJhbSB7VnVlfSB2bSAtIHVudXNlZFxuICogQHBhcmFtIHtGdW5jdGlvbn0gW2NiXVxuICovXG5cbmZ1bmN0aW9uIHJlbW92ZSAoZWwsIHZtLCBjYikge1xuICBfLnJlbW92ZShlbClcbiAgaWYgKGNiKSBjYigpXG59IiwidmFyIF8gPSByZXF1aXJlKCcuLi91dGlsJylcblxuLyoqXG4gKiBMaXN0ZW4gb24gdGhlIGdpdmVuIGBldmVudGAgd2l0aCBgZm5gLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqL1xuXG5leHBvcnRzLiRvbiA9IGZ1bmN0aW9uIChldmVudCwgZm4pIHtcbiAgKHRoaXMuX2V2ZW50c1tldmVudF0gfHwgKHRoaXMuX2V2ZW50c1tldmVudF0gPSBbXSkpXG4gICAgLnB1c2goZm4pXG4gIG1vZGlmeUxpc3RlbmVyQ291bnQodGhpcywgZXZlbnQsIDEpXG4gIHJldHVybiB0aGlzXG59XG5cbi8qKlxuICogQWRkcyBhbiBgZXZlbnRgIGxpc3RlbmVyIHRoYXQgd2lsbCBiZSBpbnZva2VkIGEgc2luZ2xlXG4gKiB0aW1lIHRoZW4gYXV0b21hdGljYWxseSByZW1vdmVkLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqL1xuXG5leHBvcnRzLiRvbmNlID0gZnVuY3Rpb24gKGV2ZW50LCBmbikge1xuICB2YXIgc2VsZiA9IHRoaXNcbiAgZnVuY3Rpb24gb24gKCkge1xuICAgIHNlbGYuJG9mZihldmVudCwgb24pXG4gICAgZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICB9XG4gIG9uLmZuID0gZm5cbiAgdGhpcy4kb24oZXZlbnQsIG9uKVxuICByZXR1cm4gdGhpc1xufVxuXG4vKipcbiAqIFJlbW92ZSB0aGUgZ2l2ZW4gY2FsbGJhY2sgZm9yIGBldmVudGAgb3IgYWxsXG4gKiByZWdpc3RlcmVkIGNhbGxiYWNrcy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKi9cblxuZXhwb3J0cy4kb2ZmID0gZnVuY3Rpb24gKGV2ZW50LCBmbikge1xuICB2YXIgY2JzXG4gIC8vIGFsbFxuICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICBpZiAodGhpcy4kcGFyZW50KSB7XG4gICAgICBmb3IgKGV2ZW50IGluIHRoaXMuX2V2ZW50cykge1xuICAgICAgICBjYnMgPSB0aGlzLl9ldmVudHNbZXZlbnRdXG4gICAgICAgIGlmIChjYnMpIHtcbiAgICAgICAgICBtb2RpZnlMaXN0ZW5lckNvdW50KHRoaXMsIGV2ZW50LCAtY2JzLmxlbmd0aClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLl9ldmVudHMgPSB7fVxuICAgIHJldHVybiB0aGlzXG4gIH1cbiAgLy8gc3BlY2lmaWMgZXZlbnRcbiAgY2JzID0gdGhpcy5fZXZlbnRzW2V2ZW50XVxuICBpZiAoIWNicykge1xuICAgIHJldHVybiB0aGlzXG4gIH1cbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcbiAgICBtb2RpZnlMaXN0ZW5lckNvdW50KHRoaXMsIGV2ZW50LCAtY2JzLmxlbmd0aClcbiAgICB0aGlzLl9ldmVudHNbZXZlbnRdID0gbnVsbFxuICAgIHJldHVybiB0aGlzXG4gIH1cbiAgLy8gc3BlY2lmaWMgaGFuZGxlclxuICB2YXIgY2JcbiAgdmFyIGkgPSBjYnMubGVuZ3RoXG4gIHdoaWxlIChpLS0pIHtcbiAgICBjYiA9IGNic1tpXVxuICAgIGlmIChjYiA9PT0gZm4gfHwgY2IuZm4gPT09IGZuKSB7XG4gICAgICBtb2RpZnlMaXN0ZW5lckNvdW50KHRoaXMsIGV2ZW50LCAtMSlcbiAgICAgIGNicy5zcGxpY2UoaSwgMSlcbiAgICAgIGJyZWFrXG4gICAgfVxuICB9XG4gIHJldHVybiB0aGlzXG59XG5cbi8qKlxuICogVHJpZ2dlciBhbiBldmVudCBvbiBzZWxmLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxuICovXG5cbmV4cG9ydHMuJGVtaXQgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgdGhpcy5fZXZlbnRDYW5jZWxsZWQgPSBmYWxzZVxuICB2YXIgY2JzID0gdGhpcy5fZXZlbnRzW2V2ZW50XVxuICBpZiAoY2JzKSB7XG4gICAgLy8gYXZvaWQgbGVha2luZyBhcmd1bWVudHM6XG4gICAgLy8gaHR0cDovL2pzcGVyZi5jb20vY2xvc3VyZS13aXRoLWFyZ3VtZW50c1xuICAgIHZhciBpID0gYXJndW1lbnRzLmxlbmd0aCAtIDFcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShpKVxuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgIGFyZ3NbaV0gPSBhcmd1bWVudHNbaSArIDFdXG4gICAgfVxuICAgIGkgPSAwXG4gICAgY2JzID0gY2JzLmxlbmd0aCA+IDFcbiAgICAgID8gXy50b0FycmF5KGNicylcbiAgICAgIDogY2JzXG4gICAgZm9yICh2YXIgbCA9IGNicy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIGlmIChjYnNbaV0uYXBwbHkodGhpcywgYXJncykgPT09IGZhbHNlKSB7XG4gICAgICAgIHRoaXMuX2V2ZW50Q2FuY2VsbGVkID0gdHJ1ZVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gdGhpc1xufVxuXG4vKipcbiAqIFJlY3Vyc2l2ZWx5IGJyb2FkY2FzdCBhbiBldmVudCB0byBhbGwgY2hpbGRyZW4gaW5zdGFuY2VzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxuICogQHBhcmFtIHsuLi4qfSBhZGRpdGlvbmFsIGFyZ3VtZW50c1xuICovXG5cbmV4cG9ydHMuJGJyb2FkY2FzdCA9IGZ1bmN0aW9uIChldmVudCkge1xuICAvLyBpZiBubyBjaGlsZCBoYXMgcmVnaXN0ZXJlZCBmb3IgdGhpcyBldmVudCxcbiAgLy8gdGhlbiB0aGVyZSdzIG5vIG5lZWQgdG8gYnJvYWRjYXN0LlxuICBpZiAoIXRoaXMuX2V2ZW50c0NvdW50W2V2ZW50XSkgcmV0dXJuXG4gIHZhciBjaGlsZHJlbiA9IHRoaXMuX2NoaWxkcmVuXG4gIGZvciAodmFyIGkgPSAwLCBsID0gY2hpbGRyZW4ubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgdmFyIGNoaWxkID0gY2hpbGRyZW5baV1cbiAgICBjaGlsZC4kZW1pdC5hcHBseShjaGlsZCwgYXJndW1lbnRzKVxuICAgIGlmICghY2hpbGQuX2V2ZW50Q2FuY2VsbGVkKSB7XG4gICAgICBjaGlsZC4kYnJvYWRjYXN0LmFwcGx5KGNoaWxkLCBhcmd1bWVudHMpXG4gICAgfVxuICB9XG4gIHJldHVybiB0aGlzXG59XG5cbi8qKlxuICogUmVjdXJzaXZlbHkgcHJvcGFnYXRlIGFuIGV2ZW50IHVwIHRoZSBwYXJlbnQgY2hhaW4uXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gKiBAcGFyYW0gey4uLip9IGFkZGl0aW9uYWwgYXJndW1lbnRzXG4gKi9cblxuZXhwb3J0cy4kZGlzcGF0Y2ggPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBwYXJlbnQgPSB0aGlzLiRwYXJlbnRcbiAgd2hpbGUgKHBhcmVudCkge1xuICAgIHBhcmVudC4kZW1pdC5hcHBseShwYXJlbnQsIGFyZ3VtZW50cylcbiAgICBwYXJlbnQgPSBwYXJlbnQuX2V2ZW50Q2FuY2VsbGVkXG4gICAgICA/IG51bGxcbiAgICAgIDogcGFyZW50LiRwYXJlbnRcbiAgfVxuICByZXR1cm4gdGhpc1xufVxuXG4vKipcbiAqIE1vZGlmeSB0aGUgbGlzdGVuZXIgY291bnRzIG9uIGFsbCBwYXJlbnRzLlxuICogVGhpcyBib29ra2VlcGluZyBhbGxvd3MgJGJyb2FkY2FzdCB0byByZXR1cm4gZWFybHkgd2hlblxuICogbm8gY2hpbGQgaGFzIGxpc3RlbmVkIHRvIGEgY2VydGFpbiBldmVudC5cbiAqXG4gKiBAcGFyYW0ge1Z1ZX0gdm1cbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxuICogQHBhcmFtIHtOdW1iZXJ9IGNvdW50XG4gKi9cblxudmFyIGhvb2tSRSA9IC9eaG9vazovXG5mdW5jdGlvbiBtb2RpZnlMaXN0ZW5lckNvdW50ICh2bSwgZXZlbnQsIGNvdW50KSB7XG4gIHZhciBwYXJlbnQgPSB2bS4kcGFyZW50XG4gIC8vIGhvb2tzIGRvIG5vdCBnZXQgYnJvYWRjYXN0ZWQgc28gbm8gbmVlZFxuICAvLyB0byBkbyBib29ra2VlcGluZyBmb3IgdGhlbVxuICBpZiAoIXBhcmVudCB8fCAhY291bnQgfHwgaG9va1JFLnRlc3QoZXZlbnQpKSByZXR1cm5cbiAgd2hpbGUgKHBhcmVudCkge1xuICAgIHBhcmVudC5fZXZlbnRzQ291bnRbZXZlbnRdID1cbiAgICAgIChwYXJlbnQuX2V2ZW50c0NvdW50W2V2ZW50XSB8fCAwKSArIGNvdW50XG4gICAgcGFyZW50ID0gcGFyZW50LiRwYXJlbnRcbiAgfVxufSIsInZhciBfID0gcmVxdWlyZSgnLi4vdXRpbCcpXG52YXIgY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlnJylcblxuLyoqXG4gKiBFeHBvc2UgdXNlZnVsIGludGVybmFsc1xuICovXG5cbmV4cG9ydHMudXRpbCA9IF9cbmV4cG9ydHMubmV4dFRpY2sgPSBfLm5leHRUaWNrXG5leHBvcnRzLmNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZycpXG5cbmV4cG9ydHMuY29tcGlsZXIgPSB7XG4gIGNvbXBpbGU6IHJlcXVpcmUoJy4uL2NvbXBpbGVyL2NvbXBpbGUnKSxcbiAgdHJhbnNjbHVkZTogcmVxdWlyZSgnLi4vY29tcGlsZXIvdHJhbnNjbHVkZScpXG59XG5cbmV4cG9ydHMucGFyc2VycyA9IHtcbiAgcGF0aDogcmVxdWlyZSgnLi4vcGFyc2Vycy9wYXRoJyksXG4gIHRleHQ6IHJlcXVpcmUoJy4uL3BhcnNlcnMvdGV4dCcpLFxuICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vcGFyc2Vycy90ZW1wbGF0ZScpLFxuICBkaXJlY3RpdmU6IHJlcXVpcmUoJy4uL3BhcnNlcnMvZGlyZWN0aXZlJyksXG4gIGV4cHJlc3Npb246IHJlcXVpcmUoJy4uL3BhcnNlcnMvZXhwcmVzc2lvbicpXG59XG5cbi8qKlxuICogRWFjaCBpbnN0YW5jZSBjb25zdHJ1Y3RvciwgaW5jbHVkaW5nIFZ1ZSwgaGFzIGEgdW5pcXVlXG4gKiBjaWQuIFRoaXMgZW5hYmxlcyB1cyB0byBjcmVhdGUgd3JhcHBlZCBcImNoaWxkXG4gKiBjb25zdHJ1Y3RvcnNcIiBmb3IgcHJvdG90eXBhbCBpbmhlcml0YW5jZSBhbmQgY2FjaGUgdGhlbS5cbiAqL1xuXG5leHBvcnRzLmNpZCA9IDBcbnZhciBjaWQgPSAxXG5cbi8qKlxuICogQ2xhc3MgaW5laHJpdGFuY2VcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gZXh0ZW5kT3B0aW9uc1xuICovXG5cbmV4cG9ydHMuZXh0ZW5kID0gZnVuY3Rpb24gKGV4dGVuZE9wdGlvbnMpIHtcbiAgZXh0ZW5kT3B0aW9ucyA9IGV4dGVuZE9wdGlvbnMgfHwge31cbiAgdmFyIFN1cGVyID0gdGhpc1xuICB2YXIgU3ViID0gY3JlYXRlQ2xhc3MoXG4gICAgZXh0ZW5kT3B0aW9ucy5uYW1lIHx8XG4gICAgU3VwZXIub3B0aW9ucy5uYW1lIHx8XG4gICAgJ1Z1ZUNvbXBvbmVudCdcbiAgKVxuICBTdWIucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShTdXBlci5wcm90b3R5cGUpXG4gIFN1Yi5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBTdWJcbiAgU3ViLmNpZCA9IGNpZCsrXG4gIFN1Yi5vcHRpb25zID0gXy5tZXJnZU9wdGlvbnMoXG4gICAgU3VwZXIub3B0aW9ucyxcbiAgICBleHRlbmRPcHRpb25zXG4gIClcbiAgU3ViWydzdXBlciddID0gU3VwZXJcbiAgLy8gYWxsb3cgZnVydGhlciBleHRlbnNpb25cbiAgU3ViLmV4dGVuZCA9IFN1cGVyLmV4dGVuZFxuICAvLyBjcmVhdGUgYXNzZXQgcmVnaXN0ZXJzLCBzbyBleHRlbmRlZCBjbGFzc2VzXG4gIC8vIGNhbiBoYXZlIHRoZWlyIHByaXZhdGUgYXNzZXRzIHRvby5cbiAgY3JlYXRlQXNzZXRSZWdpc3RlcnMoU3ViKVxuICByZXR1cm4gU3ViXG59XG5cbi8qKlxuICogQSBmdW5jdGlvbiB0aGF0IHJldHVybnMgYSBzdWItY2xhc3MgY29uc3RydWN0b3Igd2l0aCB0aGVcbiAqIGdpdmVuIG5hbWUuIFRoaXMgZ2l2ZXMgdXMgbXVjaCBuaWNlciBvdXRwdXQgd2hlblxuICogbG9nZ2luZyBpbnN0YW5jZXMgaW4gdGhlIGNvbnNvbGUuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICovXG5cbmZ1bmN0aW9uIGNyZWF0ZUNsYXNzIChuYW1lKSB7XG4gIHJldHVybiBuZXcgRnVuY3Rpb24oXG4gICAgJ3JldHVybiBmdW5jdGlvbiAnICsgXy5jbGFzc2lmeShuYW1lKSArXG4gICAgJyAob3B0aW9ucykgeyB0aGlzLl9pbml0KG9wdGlvbnMpIH0nXG4gICkoKVxufVxuXG4vKipcbiAqIFBsdWdpbiBzeXN0ZW1cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gcGx1Z2luXG4gKi9cblxuZXhwb3J0cy51c2UgPSBmdW5jdGlvbiAocGx1Z2luKSB7XG4gIC8vIGFkZGl0aW9uYWwgcGFyYW1ldGVyc1xuICB2YXIgYXJncyA9IF8udG9BcnJheShhcmd1bWVudHMsIDEpXG4gIGFyZ3MudW5zaGlmdCh0aGlzKVxuICBpZiAodHlwZW9mIHBsdWdpbi5pbnN0YWxsID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcGx1Z2luLmluc3RhbGwuYXBwbHkocGx1Z2luLCBhcmdzKVxuICB9IGVsc2Uge1xuICAgIHBsdWdpbi5hcHBseShudWxsLCBhcmdzKVxuICB9XG4gIHJldHVybiB0aGlzXG59XG5cbi8qKlxuICogRGVmaW5lIGFzc2V0IHJlZ2lzdHJhdGlvbiBtZXRob2RzIG9uIGEgY29uc3RydWN0b3IuXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gQ29uc3RydWN0b3JcbiAqL1xuXG5mdW5jdGlvbiBjcmVhdGVBc3NldFJlZ2lzdGVycyAoQ29uc3RydWN0b3IpIHtcblxuICAvKiBBc3NldCByZWdpc3RyYXRpb24gbWV0aG9kcyBzaGFyZSB0aGUgc2FtZSBzaWduYXR1cmU6XG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBpZFxuICAgKiBAcGFyYW0geyp9IGRlZmluaXRpb25cbiAgICovXG5cbiAgY29uZmlnLl9hc3NldFR5cGVzLmZvckVhY2goZnVuY3Rpb24gKHR5cGUpIHtcbiAgICBDb25zdHJ1Y3Rvclt0eXBlXSA9IGZ1bmN0aW9uIChpZCwgZGVmaW5pdGlvbikge1xuICAgICAgaWYgKCFkZWZpbml0aW9uKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnNbdHlwZSArICdzJ11baWRdXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLm9wdGlvbnNbdHlwZSArICdzJ11baWRdID0gZGVmaW5pdGlvblxuICAgICAgfVxuICAgIH1cbiAgfSlcblxuICAvKipcbiAgICogQ29tcG9uZW50IHJlZ2lzdHJhdGlvbiBuZWVkcyB0byBhdXRvbWF0aWNhbGx5IGludm9rZVxuICAgKiBWdWUuZXh0ZW5kIG9uIG9iamVjdCB2YWx1ZXMuXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBpZFxuICAgKiBAcGFyYW0ge09iamVjdHxGdW5jdGlvbn0gZGVmaW5pdGlvblxuICAgKi9cblxuICBDb25zdHJ1Y3Rvci5jb21wb25lbnQgPSBmdW5jdGlvbiAoaWQsIGRlZmluaXRpb24pIHtcbiAgICBpZiAoIWRlZmluaXRpb24pIHtcbiAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMuY29tcG9uZW50c1tpZF1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKF8uaXNQbGFpbk9iamVjdChkZWZpbml0aW9uKSkge1xuICAgICAgICBkZWZpbml0aW9uLm5hbWUgPSBpZFxuICAgICAgICBkZWZpbml0aW9uID0gXy5WdWUuZXh0ZW5kKGRlZmluaXRpb24pXG4gICAgICB9XG4gICAgICB0aGlzLm9wdGlvbnMuY29tcG9uZW50c1tpZF0gPSBkZWZpbml0aW9uXG4gICAgfVxuICB9XG59XG5cbmNyZWF0ZUFzc2V0UmVnaXN0ZXJzKGV4cG9ydHMpIiwidmFyIF8gPSByZXF1aXJlKCcuLi91dGlsJylcbnZhciBjb21waWxlID0gcmVxdWlyZSgnLi4vY29tcGlsZXIvY29tcGlsZScpXG5cbi8qKlxuICogU2V0IGluc3RhbmNlIHRhcmdldCBlbGVtZW50IGFuZCBraWNrIG9mZiB0aGUgY29tcGlsYXRpb25cbiAqIHByb2Nlc3MuIFRoZSBwYXNzZWQgaW4gYGVsYCBjYW4gYmUgYSBzZWxlY3RvciBzdHJpbmcsIGFuXG4gKiBleGlzdGluZyBFbGVtZW50LCBvciBhIERvY3VtZW50RnJhZ21lbnQgKGZvciBibG9ja1xuICogaW5zdGFuY2VzKS5cbiAqXG4gKiBAcGFyYW0ge0VsZW1lbnR8RG9jdW1lbnRGcmFnbWVudHxzdHJpbmd9IGVsXG4gKiBAcHVibGljXG4gKi9cblxuZXhwb3J0cy4kbW91bnQgPSBmdW5jdGlvbiAoZWwpIHtcbiAgaWYgKHRoaXMuX2lzQ29tcGlsZWQpIHtcbiAgICBfLndhcm4oJyRtb3VudCgpIHNob3VsZCBiZSBjYWxsZWQgb25seSBvbmNlLicpXG4gICAgcmV0dXJuXG4gIH1cbiAgaWYgKCFlbCkge1xuICAgIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgfSBlbHNlIGlmICh0eXBlb2YgZWwgPT09ICdzdHJpbmcnKSB7XG4gICAgdmFyIHNlbGVjdG9yID0gZWxcbiAgICBlbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoZWwpXG4gICAgaWYgKCFlbCkge1xuICAgICAgXy53YXJuKCdDYW5ub3QgZmluZCBlbGVtZW50OiAnICsgc2VsZWN0b3IpXG4gICAgICByZXR1cm5cbiAgICB9XG4gIH1cbiAgdGhpcy5fY29tcGlsZShlbClcbiAgdGhpcy5faXNDb21waWxlZCA9IHRydWVcbiAgdGhpcy5fY2FsbEhvb2soJ2NvbXBpbGVkJylcbiAgaWYgKF8uaW5Eb2ModGhpcy4kZWwpKSB7XG4gICAgdGhpcy5fY2FsbEhvb2soJ2F0dGFjaGVkJylcbiAgICB0aGlzLl9pbml0RE9NSG9va3MoKVxuICAgIHJlYWR5LmNhbGwodGhpcylcbiAgfSBlbHNlIHtcbiAgICB0aGlzLl9pbml0RE9NSG9va3MoKVxuICAgIHRoaXMuJG9uY2UoJ2hvb2s6YXR0YWNoZWQnLCByZWFkeSlcbiAgfVxuICByZXR1cm4gdGhpc1xufVxuXG4vKipcbiAqIE1hcmsgYW4gaW5zdGFuY2UgYXMgcmVhZHkuXG4gKi9cblxuZnVuY3Rpb24gcmVhZHkgKCkge1xuICB0aGlzLl9pc0F0dGFjaGVkID0gdHJ1ZVxuICB0aGlzLl9pc1JlYWR5ID0gdHJ1ZVxuICB0aGlzLl9jYWxsSG9vaygncmVhZHknKVxufVxuXG4vKipcbiAqIFRlYXJkb3duIHRoZSBpbnN0YW5jZSwgc2ltcGx5IGRlbGVnYXRlIHRvIHRoZSBpbnRlcm5hbFxuICogX2Rlc3Ryb3kuXG4gKi9cblxuZXhwb3J0cy4kZGVzdHJveSA9IGZ1bmN0aW9uIChyZW1vdmUsIGRlZmVyQ2xlYW51cCkge1xuICB0aGlzLl9kZXN0cm95KHJlbW92ZSwgZGVmZXJDbGVhbnVwKVxufVxuXG4vKipcbiAqIFBhcnRpYWxseSBjb21waWxlIGEgcGllY2Ugb2YgRE9NIGFuZCByZXR1cm4gYVxuICogZGVjb21waWxlIGZ1bmN0aW9uLlxuICpcbiAqIEBwYXJhbSB7RWxlbWVudHxEb2N1bWVudEZyYWdtZW50fSBlbFxuICogQHJldHVybiB7RnVuY3Rpb259XG4gKi9cblxuZXhwb3J0cy4kY29tcGlsZSA9IGZ1bmN0aW9uIChlbCkge1xuICByZXR1cm4gY29tcGlsZShlbCwgdGhpcy4kb3B0aW9ucywgdHJ1ZSkodGhpcywgZWwpXG59IiwidmFyIF8gPSByZXF1aXJlKCcuL3V0aWwnKVxudmFyIE1BWF9VUERBVEVfQ09VTlQgPSAxMFxuXG4vLyB3ZSBoYXZlIHR3byBzZXBhcmF0ZSBxdWV1ZXM6IG9uZSBmb3IgZGlyZWN0aXZlIHVwZGF0ZXNcbi8vIGFuZCBvbmUgZm9yIHVzZXIgd2F0Y2hlciByZWdpc3RlcmVkIHZpYSAkd2F0Y2goKS5cbi8vIHdlIHdhbnQgdG8gZ3VhcmFudGVlIGRpcmVjdGl2ZSB1cGRhdGVzIHRvIGJlIGNhbGxlZFxuLy8gYmVmb3JlIHVzZXIgd2F0Y2hlcnMgc28gdGhhdCB3aGVuIHVzZXIgd2F0Y2hlcnMgYXJlXG4vLyB0cmlnZ2VyZWQsIHRoZSBET00gd291bGQgaGF2ZSBhbHJlYWR5IGJlZW4gaW4gdXBkYXRlZFxuLy8gc3RhdGUuXG52YXIgcXVldWUgPSBbXVxudmFyIHVzZXJRdWV1ZSA9IFtdXG52YXIgaGFzID0ge31cbnZhciB3YWl0aW5nID0gZmFsc2VcbnZhciBmbHVzaGluZyA9IGZhbHNlXG5cbi8qKlxuICogUmVzZXQgdGhlIGJhdGNoZXIncyBzdGF0ZS5cbiAqL1xuXG5mdW5jdGlvbiByZXNldCAoKSB7XG4gIHF1ZXVlID0gW11cbiAgdXNlclF1ZXVlID0gW11cbiAgaGFzID0ge31cbiAgd2FpdGluZyA9IGZhbHNlXG4gIGZsdXNoaW5nID0gZmFsc2Vcbn1cblxuLyoqXG4gKiBGbHVzaCBib3RoIHF1ZXVlcyBhbmQgcnVuIHRoZSBqb2JzLlxuICovXG5cbmZ1bmN0aW9uIGZsdXNoICgpIHtcbiAgZmx1c2hpbmcgPSB0cnVlXG4gIHJ1bihxdWV1ZSlcbiAgcnVuKHVzZXJRdWV1ZSlcbiAgcmVzZXQoKVxufVxuXG4vKipcbiAqIFJ1biB0aGUgam9icyBpbiBhIHNpbmdsZSBxdWV1ZS5cbiAqXG4gKiBAcGFyYW0ge0FycmF5fSBxdWV1ZVxuICovXG5cbmZ1bmN0aW9uIHJ1biAocXVldWUpIHtcbiAgLy8gZG8gbm90IGNhY2hlIGxlbmd0aCBiZWNhdXNlIG1vcmUgam9icyBtaWdodCBiZSBwdXNoZWRcbiAgLy8gYXMgd2UgcnVuIGV4aXN0aW5nIGpvYnNcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBxdWV1ZS5sZW5ndGg7IGkrKykge1xuICAgIHF1ZXVlW2ldLnJ1bigpXG4gIH1cbn1cblxuLyoqXG4gKiBQdXNoIGEgam9iIGludG8gdGhlIGpvYiBxdWV1ZS5cbiAqIEpvYnMgd2l0aCBkdXBsaWNhdGUgSURzIHdpbGwgYmUgc2tpcHBlZCB1bmxlc3MgaXQnc1xuICogcHVzaGVkIHdoZW4gdGhlIHF1ZXVlIGlzIGJlaW5nIGZsdXNoZWQuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGpvYlxuICogICBwcm9wZXJ0aWVzOlxuICogICAtIHtTdHJpbmd8TnVtYmVyfSBpZFxuICogICAtIHtGdW5jdGlvbn0gICAgICBydW5cbiAqL1xuXG5leHBvcnRzLnB1c2ggPSBmdW5jdGlvbiAoam9iKSB7XG4gIHZhciBpZCA9IGpvYi5pZFxuICBpZiAoIWlkIHx8ICFoYXNbaWRdIHx8IGZsdXNoaW5nKSB7XG4gICAgaWYgKCFoYXNbaWRdKSB7XG4gICAgICBoYXNbaWRdID0gMVxuICAgIH0gZWxzZSB7XG4gICAgICBoYXNbaWRdKytcbiAgICAgIC8vIGRldGVjdCBwb3NzaWJsZSBpbmZpbml0ZSB1cGRhdGUgbG9vcHNcbiAgICAgIGlmIChoYXNbaWRdID4gTUFYX1VQREFURV9DT1VOVCkge1xuICAgICAgICBfLndhcm4oXG4gICAgICAgICAgJ1lvdSBtYXkgaGF2ZSBhbiBpbmZpbml0ZSB1cGRhdGUgbG9vcCBmb3IgdGhlICcgK1xuICAgICAgICAgICd3YXRjaGVyIHdpdGggZXhwcmVzc2lvbjogXCInICsgam9iLmV4cHJlc3Npb24gKyAnXCIuJ1xuICAgICAgICApXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuICAgIH1cbiAgICAvLyBBIHVzZXIgd2F0Y2hlciBjYWxsYmFjayBjb3VsZCB0cmlnZ2VyIGFub3RoZXJcbiAgICAvLyBkaXJlY3RpdmUgdXBkYXRlIGR1cmluZyB0aGUgZmx1c2hpbmc7IGF0IHRoYXQgdGltZVxuICAgIC8vIHRoZSBkaXJlY3RpdmUgcXVldWUgd291bGQgYWxyZWFkeSBoYXZlIGJlZW4gcnVuLCBzb1xuICAgIC8vIHdlIGNhbGwgdGhhdCB1cGRhdGUgaW1tZWRpYXRlbHkgYXMgaXQgaXMgcHVzaGVkLlxuICAgIGlmIChmbHVzaGluZyAmJiAham9iLnVzZXIpIHtcbiAgICAgIGpvYi5ydW4oKVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIDsoam9iLnVzZXIgPyB1c2VyUXVldWUgOiBxdWV1ZSkucHVzaChqb2IpXG4gICAgaWYgKCF3YWl0aW5nKSB7XG4gICAgICB3YWl0aW5nID0gdHJ1ZVxuICAgICAgXy5uZXh0VGljayhmbHVzaClcbiAgICB9XG4gIH1cbn0iLCIvKipcbiAqIEEgZG91Ymx5IGxpbmtlZCBsaXN0LWJhc2VkIExlYXN0IFJlY2VudGx5IFVzZWQgKExSVSlcbiAqIGNhY2hlLiBXaWxsIGtlZXAgbW9zdCByZWNlbnRseSB1c2VkIGl0ZW1zIHdoaWxlXG4gKiBkaXNjYXJkaW5nIGxlYXN0IHJlY2VudGx5IHVzZWQgaXRlbXMgd2hlbiBpdHMgbGltaXQgaXNcbiAqIHJlYWNoZWQuIFRoaXMgaXMgYSBiYXJlLWJvbmUgdmVyc2lvbiBvZlxuICogUmFzbXVzIEFuZGVyc3NvbidzIGpzLWxydTpcbiAqXG4gKiAgIGh0dHBzOi8vZ2l0aHViLmNvbS9yc21zL2pzLWxydVxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBsaW1pdFxuICogQGNvbnN0cnVjdG9yXG4gKi9cblxuZnVuY3Rpb24gQ2FjaGUgKGxpbWl0KSB7XG4gIHRoaXMuc2l6ZSA9IDBcbiAgdGhpcy5saW1pdCA9IGxpbWl0XG4gIHRoaXMuaGVhZCA9IHRoaXMudGFpbCA9IHVuZGVmaW5lZFxuICB0aGlzLl9rZXltYXAgPSB7fVxufVxuXG52YXIgcCA9IENhY2hlLnByb3RvdHlwZVxuXG4vKipcbiAqIFB1dCA8dmFsdWU+IGludG8gdGhlIGNhY2hlIGFzc29jaWF0ZWQgd2l0aCA8a2V5Pi5cbiAqIFJldHVybnMgdGhlIGVudHJ5IHdoaWNoIHdhcyByZW1vdmVkIHRvIG1ha2Ugcm9vbSBmb3JcbiAqIHRoZSBuZXcgZW50cnkuIE90aGVyd2lzZSB1bmRlZmluZWQgaXMgcmV0dXJuZWQuXG4gKiAoaS5lLiBpZiB0aGVyZSB3YXMgZW5vdWdoIHJvb20gYWxyZWFkeSkuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGtleVxuICogQHBhcmFtIHsqfSB2YWx1ZVxuICogQHJldHVybiB7RW50cnl8dW5kZWZpbmVkfVxuICovXG5cbnAucHV0ID0gZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgdmFyIGVudHJ5ID0ge1xuICAgIGtleTprZXksXG4gICAgdmFsdWU6dmFsdWVcbiAgfVxuICB0aGlzLl9rZXltYXBba2V5XSA9IGVudHJ5XG4gIGlmICh0aGlzLnRhaWwpIHtcbiAgICB0aGlzLnRhaWwubmV3ZXIgPSBlbnRyeVxuICAgIGVudHJ5Lm9sZGVyID0gdGhpcy50YWlsXG4gIH0gZWxzZSB7XG4gICAgdGhpcy5oZWFkID0gZW50cnlcbiAgfVxuICB0aGlzLnRhaWwgPSBlbnRyeVxuICBpZiAodGhpcy5zaXplID09PSB0aGlzLmxpbWl0KSB7XG4gICAgcmV0dXJuIHRoaXMuc2hpZnQoKVxuICB9IGVsc2Uge1xuICAgIHRoaXMuc2l6ZSsrXG4gIH1cbn1cblxuLyoqXG4gKiBQdXJnZSB0aGUgbGVhc3QgcmVjZW50bHkgdXNlZCAob2xkZXN0KSBlbnRyeSBmcm9tIHRoZVxuICogY2FjaGUuIFJldHVybnMgdGhlIHJlbW92ZWQgZW50cnkgb3IgdW5kZWZpbmVkIGlmIHRoZVxuICogY2FjaGUgd2FzIGVtcHR5LlxuICovXG5cbnAuc2hpZnQgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBlbnRyeSA9IHRoaXMuaGVhZFxuICBpZiAoZW50cnkpIHtcbiAgICB0aGlzLmhlYWQgPSB0aGlzLmhlYWQubmV3ZXJcbiAgICB0aGlzLmhlYWQub2xkZXIgPSB1bmRlZmluZWRcbiAgICBlbnRyeS5uZXdlciA9IGVudHJ5Lm9sZGVyID0gdW5kZWZpbmVkXG4gICAgdGhpcy5fa2V5bWFwW2VudHJ5LmtleV0gPSB1bmRlZmluZWRcbiAgfVxuICByZXR1cm4gZW50cnlcbn1cblxuLyoqXG4gKiBHZXQgYW5kIHJlZ2lzdGVyIHJlY2VudCB1c2Ugb2YgPGtleT4uIFJldHVybnMgdGhlIHZhbHVlXG4gKiBhc3NvY2lhdGVkIHdpdGggPGtleT4gb3IgdW5kZWZpbmVkIGlmIG5vdCBpbiBjYWNoZS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30ga2V5XG4gKiBAcGFyYW0ge0Jvb2xlYW59IHJldHVybkVudHJ5XG4gKiBAcmV0dXJuIHtFbnRyeXwqfVxuICovXG5cbnAuZ2V0ID0gZnVuY3Rpb24gKGtleSwgcmV0dXJuRW50cnkpIHtcbiAgdmFyIGVudHJ5ID0gdGhpcy5fa2V5bWFwW2tleV1cbiAgaWYgKGVudHJ5ID09PSB1bmRlZmluZWQpIHJldHVyblxuICBpZiAoZW50cnkgPT09IHRoaXMudGFpbCkge1xuICAgIHJldHVybiByZXR1cm5FbnRyeVxuICAgICAgPyBlbnRyeVxuICAgICAgOiBlbnRyeS52YWx1ZVxuICB9XG4gIC8vIEhFQUQtLS0tLS0tLS0tLS0tLVRBSUxcbiAgLy8gICA8Lm9sZGVyICAgLm5ld2VyPlxuICAvLyAgPC0tLSBhZGQgZGlyZWN0aW9uIC0tXG4gIC8vICAgQSAgQiAgQyAgPEQ+ICBFXG4gIGlmIChlbnRyeS5uZXdlcikge1xuICAgIGlmIChlbnRyeSA9PT0gdGhpcy5oZWFkKSB7XG4gICAgICB0aGlzLmhlYWQgPSBlbnRyeS5uZXdlclxuICAgIH1cbiAgICBlbnRyeS5uZXdlci5vbGRlciA9IGVudHJ5Lm9sZGVyIC8vIEMgPC0tIEUuXG4gIH1cbiAgaWYgKGVudHJ5Lm9sZGVyKSB7XG4gICAgZW50cnkub2xkZXIubmV3ZXIgPSBlbnRyeS5uZXdlciAvLyBDLiAtLT4gRVxuICB9XG4gIGVudHJ5Lm5ld2VyID0gdW5kZWZpbmVkIC8vIEQgLS14XG4gIGVudHJ5Lm9sZGVyID0gdGhpcy50YWlsIC8vIEQuIC0tPiBFXG4gIGlmICh0aGlzLnRhaWwpIHtcbiAgICB0aGlzLnRhaWwubmV3ZXIgPSBlbnRyeSAvLyBFLiA8LS0gRFxuICB9XG4gIHRoaXMudGFpbCA9IGVudHJ5XG4gIHJldHVybiByZXR1cm5FbnRyeVxuICAgID8gZW50cnlcbiAgICA6IGVudHJ5LnZhbHVlXG59XG5cbm1vZHVsZS5leHBvcnRzID0gQ2FjaGUiLCJ2YXIgXyA9IHJlcXVpcmUoJy4uL3V0aWwnKVxudmFyIGNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZycpXG52YXIgdGV4dFBhcnNlciA9IHJlcXVpcmUoJy4uL3BhcnNlcnMvdGV4dCcpXG52YXIgZGlyUGFyc2VyID0gcmVxdWlyZSgnLi4vcGFyc2Vycy9kaXJlY3RpdmUnKVxudmFyIHRlbXBsYXRlUGFyc2VyID0gcmVxdWlyZSgnLi4vcGFyc2Vycy90ZW1wbGF0ZScpXG52YXIgcmVzb2x2ZUFzc2V0ID0gXy5yZXNvbHZlQXNzZXRcblxuLy8gaW50ZXJuYWwgZGlyZWN0aXZlc1xudmFyIHByb3BEZWYgPSByZXF1aXJlKCcuLi9kaXJlY3RpdmVzL3Byb3AnKVxudmFyIGNvbXBvbmVudERlZiA9IHJlcXVpcmUoJy4uL2RpcmVjdGl2ZXMvY29tcG9uZW50JylcblxuLy8gdGVybWluYWwgZGlyZWN0aXZlc1xudmFyIHRlcm1pbmFsRGlyZWN0aXZlcyA9IFtcbiAgJ3JlcGVhdCcsXG4gICdpZidcbl1cblxubW9kdWxlLmV4cG9ydHMgPSBjb21waWxlXG5cbi8qKlxuICogQ29tcGlsZSBhIHRlbXBsYXRlIGFuZCByZXR1cm4gYSByZXVzYWJsZSBjb21wb3NpdGUgbGlua1xuICogZnVuY3Rpb24sIHdoaWNoIHJlY3Vyc2l2ZWx5IGNvbnRhaW5zIG1vcmUgbGluayBmdW5jdGlvbnNcbiAqIGluc2lkZS4gVGhpcyB0b3AgbGV2ZWwgY29tcGlsZSBmdW5jdGlvbiBzaG91bGQgb25seSBiZVxuICogY2FsbGVkIG9uIGluc3RhbmNlIHJvb3Qgbm9kZXMuXG4gKlxuICogQHBhcmFtIHtFbGVtZW50fERvY3VtZW50RnJhZ21lbnR9IGVsXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICogQHBhcmFtIHtCb29sZWFufSBwYXJ0aWFsXG4gKiBAcGFyYW0ge0Jvb2xlYW59IHRyYW5zY2x1ZGVkXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAqL1xuXG5mdW5jdGlvbiBjb21waWxlIChlbCwgb3B0aW9ucywgcGFydGlhbCwgdHJhbnNjbHVkZWQpIHtcbiAgLy8gbGluayBmdW5jdGlvbiBmb3IgdGhlIG5vZGUgaXRzZWxmLlxuICB2YXIgbm9kZUxpbmtGbiA9ICFwYXJ0aWFsXG4gICAgPyBjb21waWxlUm9vdChlbCwgb3B0aW9ucylcbiAgICA6IGNvbXBpbGVOb2RlKGVsLCBvcHRpb25zKVxuICAvLyBsaW5rIGZ1bmN0aW9uIGZvciB0aGUgY2hpbGROb2Rlc1xuICB2YXIgY2hpbGRMaW5rRm4gPVxuICAgICEobm9kZUxpbmtGbiAmJiBub2RlTGlua0ZuLnRlcm1pbmFsKSAmJlxuICAgIGVsLnRhZ05hbWUgIT09ICdTQ1JJUFQnICYmXG4gICAgZWwuaGFzQ2hpbGROb2RlcygpXG4gICAgICA/IGNvbXBpbGVOb2RlTGlzdChlbC5jaGlsZE5vZGVzLCBvcHRpb25zKVxuICAgICAgOiBudWxsXG5cbiAgLyoqXG4gICAqIEEgY29tcG9zaXRlIGxpbmtlciBmdW5jdGlvbiB0byBiZSBjYWxsZWQgb24gYSBhbHJlYWR5XG4gICAqIGNvbXBpbGVkIHBpZWNlIG9mIERPTSwgd2hpY2ggaW5zdGFudGlhdGVzIGFsbCBkaXJlY3RpdmVcbiAgICogaW5zdGFuY2VzLlxuICAgKlxuICAgKiBAcGFyYW0ge1Z1ZX0gdm1cbiAgICogQHBhcmFtIHtFbGVtZW50fERvY3VtZW50RnJhZ21lbnR9IGVsXG4gICAqIEByZXR1cm4ge0Z1bmN0aW9ufHVuZGVmaW5lZH1cbiAgICovXG5cbiAgZnVuY3Rpb24gY29tcG9zaXRlTGlua0ZuICh2bSwgZWwpIHtcbiAgICAvLyBzYXZlIG9yaWdpbmFsIGRpcmVjdGl2ZSBjb3VudCBiZWZvcmUgbGlua2luZ1xuICAgIC8vIHNvIHdlIGNhbiBjYXB0dXJlIHRoZSBkaXJlY3RpdmVzIGNyZWF0ZWQgZHVyaW5nIGFcbiAgICAvLyBwYXJ0aWFsIGNvbXBpbGF0aW9uLlxuICAgIHZhciBvcmlnaW5hbERpckNvdW50ID0gdm0uX2RpcmVjdGl2ZXMubGVuZ3RoXG4gICAgdmFyIHBhcmVudE9yaWdpbmFsRGlyQ291bnQgPVxuICAgICAgdm0uJHBhcmVudCAmJiB2bS4kcGFyZW50Ll9kaXJlY3RpdmVzLmxlbmd0aFxuICAgIC8vIGNhY2hlIGNoaWxkTm9kZXMgYmVmb3JlIGxpbmtpbmcgcGFyZW50LCBmaXggIzY1N1xuICAgIHZhciBjaGlsZE5vZGVzID0gXy50b0FycmF5KGVsLmNoaWxkTm9kZXMpXG4gICAgLy8gaWYgdGhpcyBpcyBhIHRyYW5zY2x1ZGVkIGNvbXBpbGUsIGxpbmtlcnMgbmVlZCB0byBiZVxuICAgIC8vIGNhbGxlZCBpbiBzb3VyY2Ugc2NvcGUsIGFuZCB0aGUgaG9zdCBuZWVkcyB0byBiZVxuICAgIC8vIHBhc3NlZCBkb3duLlxuICAgIHZhciBzb3VyY2UgPSB0cmFuc2NsdWRlZCA/IHZtLiRwYXJlbnQgOiB2bVxuICAgIHZhciBob3N0ID0gdHJhbnNjbHVkZWQgPyB2bSA6IHVuZGVmaW5lZFxuICAgIC8vIGxpbmtcbiAgICBpZiAobm9kZUxpbmtGbikgbm9kZUxpbmtGbihzb3VyY2UsIGVsLCBob3N0KVxuICAgIGlmIChjaGlsZExpbmtGbikgY2hpbGRMaW5rRm4oc291cmNlLCBjaGlsZE5vZGVzLCBob3N0KVxuXG4gICAgdmFyIHNlbGZEaXJzID0gdm0uX2RpcmVjdGl2ZXMuc2xpY2Uob3JpZ2luYWxEaXJDb3VudClcbiAgICB2YXIgcGFyZW50RGlycyA9IHZtLiRwYXJlbnQgJiZcbiAgICAgIHZtLiRwYXJlbnQuX2RpcmVjdGl2ZXMuc2xpY2UocGFyZW50T3JpZ2luYWxEaXJDb3VudClcblxuICAgIC8qKlxuICAgICAqIFRoZSBsaW5rZXIgZnVuY3Rpb24gcmV0dXJucyBhbiB1bmxpbmsgZnVuY3Rpb24gdGhhdFxuICAgICAqIHRlYXJzZG93biBhbGwgZGlyZWN0aXZlcyBpbnN0YW5jZXMgZ2VuZXJhdGVkIGR1cmluZ1xuICAgICAqIHRoZSBwcm9jZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtCb29sZWFufSBkZXN0cm95aW5nXG4gICAgICovXG4gICAgcmV0dXJuIGZ1bmN0aW9uIHVubGluayAoZGVzdHJveWluZykge1xuICAgICAgdGVhcmRvd25EaXJzKHZtLCBzZWxmRGlycywgZGVzdHJveWluZylcbiAgICAgIGlmIChwYXJlbnREaXJzKSB7XG4gICAgICAgIHRlYXJkb3duRGlycyh2bS4kcGFyZW50LCBwYXJlbnREaXJzKVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIHRyYW5zY2x1ZGVkIGxpbmtGbnMgYXJlIHRlcm1pbmFsLCBiZWNhdXNlIGl0IHRha2VzXG4gIC8vIG92ZXIgdGhlIGVudGlyZSBzdWItdHJlZS5cbiAgaWYgKHRyYW5zY2x1ZGVkKSB7XG4gICAgY29tcG9zaXRlTGlua0ZuLnRlcm1pbmFsID0gdHJ1ZVxuICB9XG5cbiAgcmV0dXJuIGNvbXBvc2l0ZUxpbmtGblxufVxuXG4vKipcbiAqIFRlYXJkb3duIGEgc3Vic2V0IG9mIGRpcmVjdGl2ZXMgb24gYSB2bS5cbiAqXG4gKiBAcGFyYW0ge1Z1ZX0gdm1cbiAqIEBwYXJhbSB7QXJyYXl9IGRpcnNcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gZGVzdHJveWluZ1xuICovXG5cbmZ1bmN0aW9uIHRlYXJkb3duRGlycyAodm0sIGRpcnMsIGRlc3Ryb3lpbmcpIHtcbiAgdmFyIGkgPSBkaXJzLmxlbmd0aFxuICB3aGlsZSAoaS0tKSB7XG4gICAgZGlyc1tpXS5fdGVhcmRvd24oKVxuICAgIGlmICghZGVzdHJveWluZykge1xuICAgICAgdm0uX2RpcmVjdGl2ZXMuJHJlbW92ZShkaXJzW2ldKVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIENvbXBpbGUgdGhlIHJvb3QgZWxlbWVudCBvZiBhbiBpbnN0YW5jZS4gVGhlcmUgYXJlXG4gKiAzIHR5cGVzIG9mIHRoaW5ncyB0byBwcm9jZXNzIGhlcmU6XG4gKlxuICogMS4gcHJvcHMgb24gcGFyZW50IGNvbnRhaW5lciAoY2hpbGQgc2NvcGUpXG4gKiAyLiBvdGhlciBhdHRycyBvbiBwYXJlbnQgY29udGFpbmVyIChwYXJlbnQgc2NvcGUpXG4gKiAzLiBhdHRycyBvbiB0aGUgY29tcG9uZW50IHRlbXBsYXRlIHJvb3Qgbm9kZSwgaWZcbiAqICAgIHJlcGxhY2U6dHJ1ZSAoY2hpbGQgc2NvcGUpXG4gKlxuICogQWxzbywgaWYgdGhpcyBpcyBhIGJsb2NrIGluc3RhbmNlLCB3ZSBvbmx5IG5lZWQgdG9cbiAqIGNvbXBpbGUgMSAmIDIgaGVyZS5cbiAqXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGVsXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICogQHJldHVybiB7RnVuY3Rpb259XG4gKi9cblxuZnVuY3Rpb24gY29tcGlsZVJvb3QgKGVsLCBvcHRpb25zKSB7XG4gIHZhciBjb250YWluZXJBdHRycyA9IG9wdGlvbnMuX2NvbnRhaW5lckF0dHJzXG4gIHZhciByZXBsYWNlckF0dHJzID0gb3B0aW9ucy5fcmVwbGFjZXJBdHRyc1xuICB2YXIgcHJvcHMgPSBvcHRpb25zLnByb3BzXG4gIHZhciBwcm9wc0xpbmtGbiwgcGFyZW50TGlua0ZuLCByZXBsYWNlckxpbmtGblxuICAvLyAxLiBwcm9wc1xuICBwcm9wc0xpbmtGbiA9IHByb3BzICYmIGNvbnRhaW5lckF0dHJzXG4gICAgPyBjb21waWxlUHJvcHMoZWwsIGNvbnRhaW5lckF0dHJzLCBwcm9wcylcbiAgICA6IG51bGxcbiAgLy8gb25seSBuZWVkIHRvIGNvbXBpbGUgb3RoZXIgYXR0cmlidXRlcyBmb3JcbiAgLy8gbm9uLWJsb2NrIGluc3RhbmNlc1xuICBpZiAoZWwubm9kZVR5cGUgIT09IDExKSB7XG4gICAgLy8gZm9yIGNvbXBvbmVudHMsIGNvbnRhaW5lciBhbmQgcmVwbGFjZXIgbmVlZCB0byBiZVxuICAgIC8vIGNvbXBpbGVkIHNlcGFyYXRlbHkgYW5kIGxpbmtlZCBpbiBkaWZmZXJlbnQgc2NvcGVzLlxuICAgIGlmIChvcHRpb25zLl9hc0NvbXBvbmVudCkge1xuICAgICAgLy8gMi4gY29udGFpbmVyIGF0dHJpYnV0ZXNcbiAgICAgIGlmIChjb250YWluZXJBdHRycykge1xuICAgICAgICBwYXJlbnRMaW5rRm4gPSBjb21waWxlRGlyZWN0aXZlcyhjb250YWluZXJBdHRycywgb3B0aW9ucylcbiAgICAgIH1cbiAgICAgIGlmIChyZXBsYWNlckF0dHJzKSB7XG4gICAgICAgIC8vIDMuIHJlcGxhY2VyIGF0dHJpYnV0ZXNcbiAgICAgICAgcmVwbGFjZXJMaW5rRm4gPSBjb21waWxlRGlyZWN0aXZlcyhyZXBsYWNlckF0dHJzLCBvcHRpb25zKVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBub24tY29tcG9uZW50LCBqdXN0IGNvbXBpbGUgYXMgYSBub3JtYWwgZWxlbWVudC5cbiAgICAgIHJlcGxhY2VyTGlua0ZuID0gY29tcGlsZURpcmVjdGl2ZXMoZWwsIG9wdGlvbnMpXG4gICAgfVxuICB9XG4gIHJldHVybiBmdW5jdGlvbiByb290TGlua0ZuICh2bSwgZWwsIGhvc3QpIHtcbiAgICAvLyBleHBsaWNpdGx5IHBhc3NpbmcgbnVsbCB0byBwcm9wc1xuICAgIC8vIGxpbmtlcnMgYmVjYXVzZSB0aGV5IGRvbid0IG5lZWQgYSByZWFsIGVsZW1lbnRcbiAgICBpZiAocHJvcHNMaW5rRm4pIHByb3BzTGlua0ZuKHZtLCBudWxsKVxuICAgIGlmIChwYXJlbnRMaW5rRm4pIHBhcmVudExpbmtGbih2bS4kcGFyZW50LCBlbCwgaG9zdClcbiAgICBpZiAocmVwbGFjZXJMaW5rRm4pIHJlcGxhY2VyTGlua0ZuKHZtLCBlbCwgaG9zdClcbiAgfVxufVxuXG4vKipcbiAqIENvbXBpbGUgYSBub2RlIGFuZCByZXR1cm4gYSBub2RlTGlua0ZuIGJhc2VkIG9uIHRoZVxuICogbm9kZSB0eXBlLlxuICpcbiAqIEBwYXJhbSB7Tm9kZX0gbm9kZVxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufG51bGx9XG4gKi9cblxuZnVuY3Rpb24gY29tcGlsZU5vZGUgKG5vZGUsIG9wdGlvbnMpIHtcbiAgdmFyIHR5cGUgPSBub2RlLm5vZGVUeXBlXG4gIGlmICh0eXBlID09PSAxICYmIG5vZGUudGFnTmFtZSAhPT0gJ1NDUklQVCcpIHtcbiAgICByZXR1cm4gY29tcGlsZUVsZW1lbnQobm9kZSwgb3B0aW9ucylcbiAgfSBlbHNlIGlmICh0eXBlID09PSAzICYmIGNvbmZpZy5pbnRlcnBvbGF0ZSAmJiBub2RlLmRhdGEudHJpbSgpKSB7XG4gICAgcmV0dXJuIGNvbXBpbGVUZXh0Tm9kZShub2RlLCBvcHRpb25zKVxuICB9IGVsc2Uge1xuICAgIHJldHVybiBudWxsXG4gIH1cbn1cblxuLyoqXG4gKiBDb21waWxlIGFuIGVsZW1lbnQgYW5kIHJldHVybiBhIG5vZGVMaW5rRm4uXG4gKlxuICogQHBhcmFtIHtFbGVtZW50fSBlbFxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufG51bGx9XG4gKi9cblxuZnVuY3Rpb24gY29tcGlsZUVsZW1lbnQgKGVsLCBvcHRpb25zKSB7XG4gIHZhciBoYXNBdHRycyA9IGVsLmhhc0F0dHJpYnV0ZXMoKVxuICBpZiAoaGFzQXR0cnMgJiYgY2hlY2tUcmFuc2NsdXNpb24oZWwpKSB7XG4gICAgLy8gdW53cmFwIHRleHROb2RlXG4gICAgaWYgKGVsLmhhc0F0dHJpYnV0ZSgnX192dWVfX3dyYXAnKSkge1xuICAgICAgZWwgPSBlbC5maXJzdENoaWxkXG4gICAgfVxuICAgIHJldHVybiBjb21waWxlKGVsLCBvcHRpb25zLl9wYXJlbnQuJG9wdGlvbnMsIHRydWUsIHRydWUpXG4gIH1cbiAgLy8gY2hlY2sgZWxlbWVudCBkaXJlY3RpdmVzXG4gIHZhciBsaW5rRm4gPSBjaGVja0VsZW1lbnREaXJlY3RpdmVzKGVsLCBvcHRpb25zKVxuICAvLyBjaGVjayB0ZXJtaW5hbCBkaXJlY2l0dmVzIChyZXBlYXQgJiBpZilcbiAgaWYgKCFsaW5rRm4gJiYgaGFzQXR0cnMpIHtcbiAgICBsaW5rRm4gPSBjaGVja1Rlcm1pbmFsRGlyZWN0aXZlcyhlbCwgb3B0aW9ucylcbiAgfVxuICAvLyBjaGVjayBjb21wb25lbnRcbiAgaWYgKCFsaW5rRm4pIHtcbiAgICBsaW5rRm4gPSBjaGVja0NvbXBvbmVudChlbCwgb3B0aW9ucylcbiAgfVxuICAvLyBub3JtYWwgZGlyZWN0aXZlc1xuICBpZiAoIWxpbmtGbiAmJiBoYXNBdHRycykge1xuICAgIGxpbmtGbiA9IGNvbXBpbGVEaXJlY3RpdmVzKGVsLCBvcHRpb25zKVxuICB9XG4gIC8vIGlmIHRoZSBlbGVtZW50IGlzIGEgdGV4dGFyZWEsIHdlIG5lZWQgdG8gaW50ZXJwb2xhdGVcbiAgLy8gaXRzIGNvbnRlbnQgb24gaW5pdGlhbCByZW5kZXIuXG4gIGlmIChlbC50YWdOYW1lID09PSAnVEVYVEFSRUEnKSB7XG4gICAgdmFyIHJlYWxMaW5rRm4gPSBsaW5rRm5cbiAgICBsaW5rRm4gPSBmdW5jdGlvbiAodm0sIGVsKSB7XG4gICAgICBlbC52YWx1ZSA9IHZtLiRpbnRlcnBvbGF0ZShlbC52YWx1ZSlcbiAgICAgIGlmIChyZWFsTGlua0ZuKSByZWFsTGlua0ZuKHZtLCBlbClcbiAgICB9XG4gICAgbGlua0ZuLnRlcm1pbmFsID0gdHJ1ZVxuICB9XG4gIHJldHVybiBsaW5rRm5cbn1cblxuLyoqXG4gKiBDb21waWxlIGEgdGV4dE5vZGUgYW5kIHJldHVybiBhIG5vZGVMaW5rRm4uXG4gKlxuICogQHBhcmFtIHtUZXh0Tm9kZX0gbm9kZVxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufG51bGx9IHRleHROb2RlTGlua0ZuXG4gKi9cblxuZnVuY3Rpb24gY29tcGlsZVRleHROb2RlIChub2RlLCBvcHRpb25zKSB7XG4gIHZhciB0b2tlbnMgPSB0ZXh0UGFyc2VyLnBhcnNlKG5vZGUuZGF0YSlcbiAgaWYgKCF0b2tlbnMpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG4gIHZhciBmcmFnID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpXG4gIHZhciBlbCwgdG9rZW5cbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB0b2tlbnMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgdG9rZW4gPSB0b2tlbnNbaV1cbiAgICBlbCA9IHRva2VuLnRhZ1xuICAgICAgPyBwcm9jZXNzVGV4dFRva2VuKHRva2VuLCBvcHRpb25zKVxuICAgICAgOiBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0b2tlbi52YWx1ZSlcbiAgICBmcmFnLmFwcGVuZENoaWxkKGVsKVxuICB9XG4gIHJldHVybiBtYWtlVGV4dE5vZGVMaW5rRm4odG9rZW5zLCBmcmFnLCBvcHRpb25zKVxufVxuXG4vKipcbiAqIFByb2Nlc3MgYSBzaW5nbGUgdGV4dCB0b2tlbi5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gdG9rZW5cbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKiBAcmV0dXJuIHtOb2RlfVxuICovXG5cbmZ1bmN0aW9uIHByb2Nlc3NUZXh0VG9rZW4gKHRva2VuLCBvcHRpb25zKSB7XG4gIHZhciBlbFxuICBpZiAodG9rZW4ub25lVGltZSkge1xuICAgIGVsID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodG9rZW4udmFsdWUpXG4gIH0gZWxzZSB7XG4gICAgaWYgKHRva2VuLmh0bWwpIHtcbiAgICAgIGVsID0gZG9jdW1lbnQuY3JlYXRlQ29tbWVudCgndi1odG1sJylcbiAgICAgIHNldFRva2VuVHlwZSgnaHRtbCcpXG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIElFIHdpbGwgY2xlYW4gdXAgZW1wdHkgdGV4dE5vZGVzIGR1cmluZ1xuICAgICAgLy8gZnJhZy5jbG9uZU5vZGUodHJ1ZSksIHNvIHdlIGhhdmUgdG8gZ2l2ZSBpdFxuICAgICAgLy8gc29tZXRoaW5nIGhlcmUuLi5cbiAgICAgIGVsID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoJyAnKVxuICAgICAgc2V0VG9rZW5UeXBlKCd0ZXh0JylcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gc2V0VG9rZW5UeXBlICh0eXBlKSB7XG4gICAgdG9rZW4udHlwZSA9IHR5cGVcbiAgICB0b2tlbi5kZWYgPSByZXNvbHZlQXNzZXQob3B0aW9ucywgJ2RpcmVjdGl2ZXMnLCB0eXBlKVxuICAgIHRva2VuLmRlc2NyaXB0b3IgPSBkaXJQYXJzZXIucGFyc2UodG9rZW4udmFsdWUpWzBdXG4gIH1cbiAgcmV0dXJuIGVsXG59XG5cbi8qKlxuICogQnVpbGQgYSBmdW5jdGlvbiB0aGF0IHByb2Nlc3NlcyBhIHRleHROb2RlLlxuICpcbiAqIEBwYXJhbSB7QXJyYXk8T2JqZWN0Pn0gdG9rZW5zXG4gKiBAcGFyYW0ge0RvY3VtZW50RnJhZ21lbnR9IGZyYWdcbiAqL1xuXG5mdW5jdGlvbiBtYWtlVGV4dE5vZGVMaW5rRm4gKHRva2VucywgZnJhZykge1xuICByZXR1cm4gZnVuY3Rpb24gdGV4dE5vZGVMaW5rRm4gKHZtLCBlbCkge1xuICAgIHZhciBmcmFnQ2xvbmUgPSBmcmFnLmNsb25lTm9kZSh0cnVlKVxuICAgIHZhciBjaGlsZE5vZGVzID0gXy50b0FycmF5KGZyYWdDbG9uZS5jaGlsZE5vZGVzKVxuICAgIHZhciB0b2tlbiwgdmFsdWUsIG5vZGVcbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IHRva2Vucy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIHRva2VuID0gdG9rZW5zW2ldXG4gICAgICB2YWx1ZSA9IHRva2VuLnZhbHVlXG4gICAgICBpZiAodG9rZW4udGFnKSB7XG4gICAgICAgIG5vZGUgPSBjaGlsZE5vZGVzW2ldXG4gICAgICAgIGlmICh0b2tlbi5vbmVUaW1lKSB7XG4gICAgICAgICAgdmFsdWUgPSB2bS4kZXZhbCh2YWx1ZSlcbiAgICAgICAgICBpZiAodG9rZW4uaHRtbCkge1xuICAgICAgICAgICAgXy5yZXBsYWNlKG5vZGUsIHRlbXBsYXRlUGFyc2VyLnBhcnNlKHZhbHVlLCB0cnVlKSlcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbm9kZS5kYXRhID0gdmFsdWVcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdm0uX2JpbmREaXIodG9rZW4udHlwZSwgbm9kZSxcbiAgICAgICAgICAgICAgICAgICAgICB0b2tlbi5kZXNjcmlwdG9yLCB0b2tlbi5kZWYpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgXy5yZXBsYWNlKGVsLCBmcmFnQ2xvbmUpXG4gIH1cbn1cblxuLyoqXG4gKiBDb21waWxlIGEgbm9kZSBsaXN0IGFuZCByZXR1cm4gYSBjaGlsZExpbmtGbi5cbiAqXG4gKiBAcGFyYW0ge05vZGVMaXN0fSBub2RlTGlzdFxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufHVuZGVmaW5lZH1cbiAqL1xuXG5mdW5jdGlvbiBjb21waWxlTm9kZUxpc3QgKG5vZGVMaXN0LCBvcHRpb25zKSB7XG4gIHZhciBsaW5rRm5zID0gW11cbiAgdmFyIG5vZGVMaW5rRm4sIGNoaWxkTGlua0ZuLCBub2RlXG4gIGZvciAodmFyIGkgPSAwLCBsID0gbm9kZUxpc3QubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgbm9kZSA9IG5vZGVMaXN0W2ldXG4gICAgbm9kZUxpbmtGbiA9IGNvbXBpbGVOb2RlKG5vZGUsIG9wdGlvbnMpXG4gICAgY2hpbGRMaW5rRm4gPVxuICAgICAgIShub2RlTGlua0ZuICYmIG5vZGVMaW5rRm4udGVybWluYWwpICYmXG4gICAgICBub2RlLnRhZ05hbWUgIT09ICdTQ1JJUFQnICYmXG4gICAgICBub2RlLmhhc0NoaWxkTm9kZXMoKVxuICAgICAgICA/IGNvbXBpbGVOb2RlTGlzdChub2RlLmNoaWxkTm9kZXMsIG9wdGlvbnMpXG4gICAgICAgIDogbnVsbFxuICAgIGxpbmtGbnMucHVzaChub2RlTGlua0ZuLCBjaGlsZExpbmtGbilcbiAgfVxuICByZXR1cm4gbGlua0Zucy5sZW5ndGhcbiAgICA/IG1ha2VDaGlsZExpbmtGbihsaW5rRm5zKVxuICAgIDogbnVsbFxufVxuXG4vKipcbiAqIE1ha2UgYSBjaGlsZCBsaW5rIGZ1bmN0aW9uIGZvciBhIG5vZGUncyBjaGlsZE5vZGVzLlxuICpcbiAqIEBwYXJhbSB7QXJyYXk8RnVuY3Rpb24+fSBsaW5rRm5zXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn0gY2hpbGRMaW5rRm5cbiAqL1xuXG5mdW5jdGlvbiBtYWtlQ2hpbGRMaW5rRm4gKGxpbmtGbnMpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIGNoaWxkTGlua0ZuICh2bSwgbm9kZXMsIGhvc3QpIHtcbiAgICB2YXIgbm9kZSwgbm9kZUxpbmtGbiwgY2hpbGRyZW5MaW5rRm5cbiAgICBmb3IgKHZhciBpID0gMCwgbiA9IDAsIGwgPSBsaW5rRm5zLmxlbmd0aDsgaSA8IGw7IG4rKykge1xuICAgICAgbm9kZSA9IG5vZGVzW25dXG4gICAgICBub2RlTGlua0ZuID0gbGlua0Zuc1tpKytdXG4gICAgICBjaGlsZHJlbkxpbmtGbiA9IGxpbmtGbnNbaSsrXVxuICAgICAgLy8gY2FjaGUgY2hpbGROb2RlcyBiZWZvcmUgbGlua2luZyBwYXJlbnQsIGZpeCAjNjU3XG4gICAgICB2YXIgY2hpbGROb2RlcyA9IF8udG9BcnJheShub2RlLmNoaWxkTm9kZXMpXG4gICAgICBpZiAobm9kZUxpbmtGbikge1xuICAgICAgICBub2RlTGlua0ZuKHZtLCBub2RlLCBob3N0KVxuICAgICAgfVxuICAgICAgaWYgKGNoaWxkcmVuTGlua0ZuKSB7XG4gICAgICAgIGNoaWxkcmVuTGlua0ZuKHZtLCBjaGlsZE5vZGVzLCBob3N0KVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIENvbXBpbGUgcGFyYW0gYXR0cmlidXRlcyBvbiBhIHJvb3QgZWxlbWVudCBhbmQgcmV0dXJuXG4gKiBhIHByb3BzIGxpbmsgZnVuY3Rpb24uXG4gKlxuICogQHBhcmFtIHtFbGVtZW50fERvY3VtZW50RnJhZ21lbnR9IGVsXG4gKiBAcGFyYW0ge09iamVjdH0gYXR0cnNcbiAqIEBwYXJhbSB7QXJyYXl9IHByb3BOYW1lc1xuICogQHJldHVybiB7RnVuY3Rpb259IHByb3BzTGlua0ZuXG4gKi9cblxuLy8gcmVnZXggdG8gdGVzdCBpZiBhIHBhdGggaXMgXCJzZXR0YWJsZVwiXG4vLyBpZiBub3QgdGhlIHByb3AgYmluZGluZyBpcyBhdXRvbWF0aWNhbGx5IG9uZS13YXkuXG52YXIgc2V0dGFibGVQYXRoUkUgPSAvXltBLVphLXpfJF1bXFx3JF0qKFxcLltBLVphLXpfJF1bXFx3JF0qfFxcW1teXFxbXFxdXStcXF0pKiQvXG52YXIgbGl0ZXJhbFZhbHVlUkUgPSAvXnRydWV8ZmFsc2V8XFxkKyQvXG5cbmZ1bmN0aW9uIGNvbXBpbGVQcm9wcyAoZWwsIGF0dHJzLCBwcm9wTmFtZXMpIHtcbiAgdmFyIHByb3BzID0gW11cbiAgdmFyIGkgPSBwcm9wTmFtZXMubGVuZ3RoXG4gIHZhciBuYW1lLCB2YWx1ZSwgcHJvcFxuICB3aGlsZSAoaS0tKSB7XG4gICAgbmFtZSA9IHByb3BOYW1lc1tpXVxuICAgIGlmICgvW0EtWl0vLnRlc3QobmFtZSkpIHtcbiAgICAgIF8ud2FybihcbiAgICAgICAgJ1lvdSBzZWVtIHRvIGJlIHVzaW5nIGNhbWVsQ2FzZSBmb3IgYSBjb21wb25lbnQgcHJvcCwgJyArXG4gICAgICAgICdidXQgSFRNTCBkb2VzblxcJ3QgZGlmZmVyZW50aWF0ZSBiZXR3ZWVuIHVwcGVyIGFuZCAnICtcbiAgICAgICAgJ2xvd2VyIGNhc2UuIFlvdSBzaG91bGQgdXNlIGh5cGhlbi1kZWxpbWl0ZWQgJyArXG4gICAgICAgICdhdHRyaWJ1dGUgbmFtZXMuIEZvciBtb3JlIGluZm8gc2VlICcgK1xuICAgICAgICAnaHR0cDovL3Z1ZWpzLm9yZy9hcGkvb3B0aW9ucy5odG1sI3Byb3BzJ1xuICAgICAgKVxuICAgIH1cbiAgICB2YWx1ZSA9IGF0dHJzW25hbWVdXG4gICAgLyoganNoaW50IGVxZXFlcTpmYWxzZSAqL1xuICAgIGlmICh2YWx1ZSAhPSBudWxsKSB7XG4gICAgICBwcm9wID0ge1xuICAgICAgICBuYW1lOiBuYW1lLFxuICAgICAgICByYXc6IHZhbHVlXG4gICAgICB9XG4gICAgICB2YXIgdG9rZW5zID0gdGV4dFBhcnNlci5wYXJzZSh2YWx1ZSlcbiAgICAgIGlmICh0b2tlbnMpIHtcbiAgICAgICAgaWYgKGVsICYmIGVsLm5vZGVUeXBlID09PSAxKSB7XG4gICAgICAgICAgZWwucmVtb3ZlQXR0cmlidXRlKG5hbWUpXG4gICAgICAgIH1cbiAgICAgICAgYXR0cnNbbmFtZV0gPSBudWxsXG4gICAgICAgIHByb3AuZHluYW1pYyA9IHRydWVcbiAgICAgICAgcHJvcC52YWx1ZSA9IHRleHRQYXJzZXIudG9rZW5zVG9FeHAodG9rZW5zKVxuICAgICAgICBwcm9wLm9uZVRpbWUgPVxuICAgICAgICAgIHRva2Vucy5sZW5ndGggPiAxIHx8XG4gICAgICAgICAgdG9rZW5zWzBdLm9uZVRpbWUgfHxcbiAgICAgICAgICAhc2V0dGFibGVQYXRoUkUudGVzdChwcm9wLnZhbHVlKSB8fFxuICAgICAgICAgIGxpdGVyYWxWYWx1ZVJFLnRlc3QocHJvcC52YWx1ZSlcbiAgICAgIH1cbiAgICAgIHByb3BzLnB1c2gocHJvcClcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG1ha2VQcm9wc0xpbmtGbihwcm9wcylcbn1cblxuLyoqXG4gKiBCdWlsZCBhIGZ1bmN0aW9uIHRoYXQgYXBwbGllcyBwcm9wcyB0byBhIHZtLlxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IHByb3BzXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn0gcHJvcHNMaW5rRm5cbiAqL1xuXG52YXIgZGF0YUF0dHJSRSA9IC9eZGF0YS0vXG5cbmZ1bmN0aW9uIG1ha2VQcm9wc0xpbmtGbiAocHJvcHMpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIHByb3BzTGlua0ZuICh2bSwgZWwpIHtcbiAgICB2YXIgaSA9IHByb3BzLmxlbmd0aFxuICAgIHZhciBwcm9wLCBwYXRoXG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgcHJvcCA9IHByb3BzW2ldXG4gICAgICAvLyBwcm9wcyBjb3VsZCBjb250YWluIGRhc2hlcywgd2hpY2ggd2lsbCBiZVxuICAgICAgLy8gaW50ZXJwcmV0ZWQgYXMgbWludXMgY2FsY3VsYXRpb25zIGJ5IHRoZSBwYXJzZXJcbiAgICAgIC8vIHNvIHdlIG5lZWQgdG8gd3JhcCB0aGUgcGF0aCBoZXJlXG4gICAgICBwYXRoID0gXy5jYW1lbGl6ZShwcm9wLm5hbWUucmVwbGFjZShkYXRhQXR0clJFLCAnJykpXG4gICAgICBpZiAocHJvcC5keW5hbWljKSB7XG4gICAgICAgIGlmICh2bS4kcGFyZW50KSB7XG4gICAgICAgICAgdm0uX2JpbmREaXIoJ3Byb3AnLCBlbCwge1xuICAgICAgICAgICAgYXJnOiBwYXRoLFxuICAgICAgICAgICAgZXhwcmVzc2lvbjogcHJvcC52YWx1ZSxcbiAgICAgICAgICAgIG9uZVdheTogcHJvcC5vbmVUaW1lXG4gICAgICAgICAgfSwgcHJvcERlZilcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBfLndhcm4oXG4gICAgICAgICAgICAnQ2Fubm90IGJpbmQgZHluYW1pYyBwcm9wIG9uIGEgcm9vdCBpbnN0YW5jZScgK1xuICAgICAgICAgICAgJyB3aXRoIG5vIHBhcmVudDogJyArIHByb3AubmFtZSArICc9XCInICtcbiAgICAgICAgICAgIHByb3AucmF3ICsgJ1wiJ1xuICAgICAgICAgIClcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8ganVzdCBzZXQgb25jZVxuICAgICAgICB2bS4kc2V0KHBhdGgsIF8udG9OdW1iZXIocHJvcC5yYXcpKVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIENoZWNrIGZvciBlbGVtZW50IGRpcmVjdGl2ZXMgKGN1c3RvbSBlbGVtZW50cyB0aGF0IHNob3VsZFxuICogYmUgcmVzb3ZsZWQgYXMgdGVybWluYWwgZGlyZWN0aXZlcykuXG4gKlxuICogQHBhcmFtIHtFbGVtZW50fSBlbFxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqL1xuXG5mdW5jdGlvbiBjaGVja0VsZW1lbnREaXJlY3RpdmVzIChlbCwgb3B0aW9ucykge1xuICB2YXIgdGFnID0gZWwudGFnTmFtZS50b0xvd2VyQ2FzZSgpXG4gIHZhciBkZWYgPSByZXNvbHZlQXNzZXQob3B0aW9ucywgJ2VsZW1lbnREaXJlY3RpdmVzJywgdGFnKVxuICBpZiAoZGVmKSB7XG4gICAgcmV0dXJuIG1ha2VUZXJtaW5hbE5vZGVMaW5rRm4oZWwsIHRhZywgJycsIG9wdGlvbnMsIGRlZilcbiAgfVxufVxuXG4vKipcbiAqIENoZWNrIGlmIGFuIGVsZW1lbnQgaXMgYSBjb21wb25lbnQuIElmIHllcywgcmV0dXJuXG4gKiBhIGNvbXBvbmVudCBsaW5rIGZ1bmN0aW9uLlxuICpcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKiBAcmV0dXJuIHtGdW5jdGlvbnx1bmRlZmluZWR9XG4gKi9cblxuZnVuY3Rpb24gY2hlY2tDb21wb25lbnQgKGVsLCBvcHRpb25zKSB7XG4gIHZhciBjb21wb25lbnRJZCA9IF8uY2hlY2tDb21wb25lbnQoZWwsIG9wdGlvbnMpXG4gIGlmIChjb21wb25lbnRJZCkge1xuICAgIHZhciBjb21wb25lbnRMaW5rRm4gPSBmdW5jdGlvbiAodm0sIGVsLCBob3N0KSB7XG4gICAgICB2bS5fYmluZERpcignY29tcG9uZW50JywgZWwsIHtcbiAgICAgICAgZXhwcmVzc2lvbjogY29tcG9uZW50SWRcbiAgICAgIH0sIGNvbXBvbmVudERlZiwgaG9zdClcbiAgICB9XG4gICAgY29tcG9uZW50TGlua0ZuLnRlcm1pbmFsID0gdHJ1ZVxuICAgIHJldHVybiBjb21wb25lbnRMaW5rRm5cbiAgfVxufVxuXG4vKipcbiAqIENoZWNrIGFuIGVsZW1lbnQgZm9yIHRlcm1pbmFsIGRpcmVjdGl2ZXMgaW4gZml4ZWQgb3JkZXIuXG4gKiBJZiBpdCBmaW5kcyBvbmUsIHJldHVybiBhIHRlcm1pbmFsIGxpbmsgZnVuY3Rpb24uXG4gKlxuICogQHBhcmFtIHtFbGVtZW50fSBlbFxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufSB0ZXJtaW5hbExpbmtGblxuICovXG5cbmZ1bmN0aW9uIGNoZWNrVGVybWluYWxEaXJlY3RpdmVzIChlbCwgb3B0aW9ucykge1xuICBpZiAoXy5hdHRyKGVsLCAncHJlJykgIT09IG51bGwpIHtcbiAgICByZXR1cm4gc2tpcFxuICB9XG4gIHZhciB2YWx1ZSwgZGlyTmFtZVxuICAvKiBqc2hpbnQgYm9zczogdHJ1ZSAqL1xuICBmb3IgKHZhciBpID0gMCwgbCA9IHRlcm1pbmFsRGlyZWN0aXZlcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBkaXJOYW1lID0gdGVybWluYWxEaXJlY3RpdmVzW2ldXG4gICAgaWYgKCh2YWx1ZSA9IF8uYXR0cihlbCwgZGlyTmFtZSkpICE9PSBudWxsKSB7XG4gICAgICByZXR1cm4gbWFrZVRlcm1pbmFsTm9kZUxpbmtGbihlbCwgZGlyTmFtZSwgdmFsdWUsIG9wdGlvbnMpXG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHNraXAgKCkge31cbnNraXAudGVybWluYWwgPSB0cnVlXG5cbi8qKlxuICogQnVpbGQgYSBub2RlIGxpbmsgZnVuY3Rpb24gZm9yIGEgdGVybWluYWwgZGlyZWN0aXZlLlxuICogQSB0ZXJtaW5hbCBsaW5rIGZ1bmN0aW9uIHRlcm1pbmF0ZXMgdGhlIGN1cnJlbnRcbiAqIGNvbXBpbGF0aW9uIHJlY3Vyc2lvbiBhbmQgaGFuZGxlcyBjb21waWxhdGlvbiBvZiB0aGVcbiAqIHN1YnRyZWUgaW4gdGhlIGRpcmVjdGl2ZS5cbiAqXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGVsXG4gKiBAcGFyYW0ge1N0cmluZ30gZGlyTmFtZVxuICogQHBhcmFtIHtTdHJpbmd9IHZhbHVlXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICogQHBhcmFtIHtPYmplY3R9IFtkZWZdXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn0gdGVybWluYWxMaW5rRm5cbiAqL1xuXG5mdW5jdGlvbiBtYWtlVGVybWluYWxOb2RlTGlua0ZuIChlbCwgZGlyTmFtZSwgdmFsdWUsIG9wdGlvbnMsIGRlZikge1xuICB2YXIgZGVzY3JpcHRvciA9IGRpclBhcnNlci5wYXJzZSh2YWx1ZSlbMF1cbiAgLy8gbm8gbmVlZCB0byBjYWxsIHJlc29sdmVBc3NldCBzaW5jZSB0ZXJtaW5hbCBkaXJlY3RpdmVzXG4gIC8vIGFyZSBhbHdheXMgaW50ZXJuYWxcbiAgZGVmID0gZGVmIHx8IG9wdGlvbnMuZGlyZWN0aXZlc1tkaXJOYW1lXVxuICB2YXIgZm4gPSBmdW5jdGlvbiB0ZXJtaW5hbE5vZGVMaW5rRm4gKHZtLCBlbCwgaG9zdCkge1xuICAgIHZtLl9iaW5kRGlyKGRpck5hbWUsIGVsLCBkZXNjcmlwdG9yLCBkZWYsIGhvc3QpXG4gIH1cbiAgZm4udGVybWluYWwgPSB0cnVlXG4gIHJldHVybiBmblxufVxuXG4vKipcbiAqIENvbXBpbGUgdGhlIGRpcmVjdGl2ZXMgb24gYW4gZWxlbWVudCBhbmQgcmV0dXJuIGEgbGlua2VyLlxuICpcbiAqIEBwYXJhbSB7RWxlbWVudHxPYmplY3R9IGVsT3JBdHRyc1xuICogICAgICAgIC0gY291bGQgYmUgYW4gb2JqZWN0IG9mIGFscmVhZHktZXh0cmFjdGVkXG4gKiAgICAgICAgICBjb250YWluZXIgYXR0cmlidXRlcy5cbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAqL1xuXG5mdW5jdGlvbiBjb21waWxlRGlyZWN0aXZlcyAoZWxPckF0dHJzLCBvcHRpb25zKSB7XG4gIHZhciBhdHRycyA9IF8uaXNQbGFpbk9iamVjdChlbE9yQXR0cnMpXG4gICAgPyBtYXBUb0xpc3QoZWxPckF0dHJzKVxuICAgIDogZWxPckF0dHJzLmF0dHJpYnV0ZXNcbiAgdmFyIGkgPSBhdHRycy5sZW5ndGhcbiAgdmFyIGRpcnMgPSBbXVxuICB2YXIgYXR0ciwgbmFtZSwgdmFsdWUsIGRpciwgZGlyTmFtZSwgZGlyRGVmXG4gIHdoaWxlIChpLS0pIHtcbiAgICBhdHRyID0gYXR0cnNbaV1cbiAgICBuYW1lID0gYXR0ci5uYW1lXG4gICAgdmFsdWUgPSBhdHRyLnZhbHVlXG4gICAgaWYgKHZhbHVlID09PSBudWxsKSBjb250aW51ZVxuICAgIGlmIChuYW1lLmluZGV4T2YoY29uZmlnLnByZWZpeCkgPT09IDApIHtcbiAgICAgIGRpck5hbWUgPSBuYW1lLnNsaWNlKGNvbmZpZy5wcmVmaXgubGVuZ3RoKVxuICAgICAgZGlyRGVmID0gcmVzb2x2ZUFzc2V0KG9wdGlvbnMsICdkaXJlY3RpdmVzJywgZGlyTmFtZSlcbiAgICAgIF8uYXNzZXJ0QXNzZXQoZGlyRGVmLCAnZGlyZWN0aXZlJywgZGlyTmFtZSlcbiAgICAgIGlmIChkaXJEZWYpIHtcbiAgICAgICAgZGlycy5wdXNoKHtcbiAgICAgICAgICBuYW1lOiBkaXJOYW1lLFxuICAgICAgICAgIGRlc2NyaXB0b3JzOiBkaXJQYXJzZXIucGFyc2UodmFsdWUpLFxuICAgICAgICAgIGRlZjogZGlyRGVmXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChjb25maWcuaW50ZXJwb2xhdGUpIHtcbiAgICAgIGRpciA9IGNvbGxlY3RBdHRyRGlyZWN0aXZlKG5hbWUsIHZhbHVlLCBvcHRpb25zKVxuICAgICAgaWYgKGRpcikge1xuICAgICAgICBkaXJzLnB1c2goZGlyKVxuICAgICAgfVxuICAgIH1cbiAgfVxuICAvLyBzb3J0IGJ5IHByaW9yaXR5LCBMT1cgdG8gSElHSFxuICBpZiAoZGlycy5sZW5ndGgpIHtcbiAgICBkaXJzLnNvcnQoZGlyZWN0aXZlQ29tcGFyYXRvcilcbiAgICByZXR1cm4gbWFrZU5vZGVMaW5rRm4oZGlycylcbiAgfVxufVxuXG4vKipcbiAqIENvbnZlcnQgYSBtYXAgKE9iamVjdCkgb2YgYXR0cmlidXRlcyB0byBhbiBBcnJheS5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gbWFwXG4gKiBAcmV0dXJuIHtBcnJheX1cbiAqL1xuXG5mdW5jdGlvbiBtYXBUb0xpc3QgKG1hcCkge1xuICB2YXIgbGlzdCA9IFtdXG4gIGZvciAodmFyIGtleSBpbiBtYXApIHtcbiAgICBsaXN0LnB1c2goe1xuICAgICAgbmFtZToga2V5LFxuICAgICAgdmFsdWU6IG1hcFtrZXldXG4gICAgfSlcbiAgfVxuICByZXR1cm4gbGlzdFxufVxuXG4vKipcbiAqIEJ1aWxkIGEgbGluayBmdW5jdGlvbiBmb3IgYWxsIGRpcmVjdGl2ZXMgb24gYSBzaW5nbGUgbm9kZS5cbiAqXG4gKiBAcGFyYW0ge0FycmF5fSBkaXJlY3RpdmVzXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn0gZGlyZWN0aXZlc0xpbmtGblxuICovXG5cbmZ1bmN0aW9uIG1ha2VOb2RlTGlua0ZuIChkaXJlY3RpdmVzKSB7XG4gIHJldHVybiBmdW5jdGlvbiBub2RlTGlua0ZuICh2bSwgZWwsIGhvc3QpIHtcbiAgICAvLyByZXZlcnNlIGFwcGx5IGJlY2F1c2UgaXQncyBzb3J0ZWQgbG93IHRvIGhpZ2hcbiAgICB2YXIgaSA9IGRpcmVjdGl2ZXMubGVuZ3RoXG4gICAgdmFyIGRpciwgaiwga1xuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgIGRpciA9IGRpcmVjdGl2ZXNbaV1cbiAgICAgIGlmIChkaXIuX2xpbmspIHtcbiAgICAgICAgLy8gY3VzdG9tIGxpbmsgZm5cbiAgICAgICAgZGlyLl9saW5rKHZtLCBlbClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGsgPSBkaXIuZGVzY3JpcHRvcnMubGVuZ3RoXG4gICAgICAgIGZvciAoaiA9IDA7IGogPCBrOyBqKyspIHtcbiAgICAgICAgICB2bS5fYmluZERpcihkaXIubmFtZSwgZWwsXG4gICAgICAgICAgICBkaXIuZGVzY3JpcHRvcnNbal0sIGRpci5kZWYsIGhvc3QpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBDaGVjayBhbiBhdHRyaWJ1dGUgZm9yIHBvdGVudGlhbCBkeW5hbWljIGJpbmRpbmdzLFxuICogYW5kIHJldHVybiBhIGRpcmVjdGl2ZSBvYmplY3QuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVcbiAqIEBwYXJhbSB7U3RyaW5nfSB2YWx1ZVxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqIEByZXR1cm4ge09iamVjdH1cbiAqL1xuXG5mdW5jdGlvbiBjb2xsZWN0QXR0ckRpcmVjdGl2ZSAobmFtZSwgdmFsdWUsIG9wdGlvbnMpIHtcbiAgdmFyIHRva2VucyA9IHRleHRQYXJzZXIucGFyc2UodmFsdWUpXG4gIGlmICh0b2tlbnMpIHtcbiAgICB2YXIgZGVmID0gb3B0aW9ucy5kaXJlY3RpdmVzLmF0dHJcbiAgICB2YXIgaSA9IHRva2Vucy5sZW5ndGhcbiAgICB2YXIgYWxsT25lVGltZSA9IHRydWVcbiAgICB3aGlsZSAoaS0tKSB7XG4gICAgICB2YXIgdG9rZW4gPSB0b2tlbnNbaV1cbiAgICAgIGlmICh0b2tlbi50YWcgJiYgIXRva2VuLm9uZVRpbWUpIHtcbiAgICAgICAgYWxsT25lVGltZSA9IGZhbHNlXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICBkZWY6IGRlZixcbiAgICAgIF9saW5rOiBhbGxPbmVUaW1lXG4gICAgICAgID8gZnVuY3Rpb24gKHZtLCBlbCkge1xuICAgICAgICAgICAgZWwuc2V0QXR0cmlidXRlKG5hbWUsIHZtLiRpbnRlcnBvbGF0ZSh2YWx1ZSkpXG4gICAgICAgICAgfVxuICAgICAgICA6IGZ1bmN0aW9uICh2bSwgZWwpIHtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IHRleHRQYXJzZXIudG9rZW5zVG9FeHAodG9rZW5zLCB2bSlcbiAgICAgICAgICAgIHZhciBkZXNjID0gZGlyUGFyc2VyLnBhcnNlKG5hbWUgKyAnOicgKyB2YWx1ZSlbMF1cbiAgICAgICAgICAgIHZtLl9iaW5kRGlyKCdhdHRyJywgZWwsIGRlc2MsIGRlZilcbiAgICAgICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogRGlyZWN0aXZlIHByaW9yaXR5IHNvcnQgY29tcGFyYXRvclxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBhXG4gKiBAcGFyYW0ge09iamVjdH0gYlxuICovXG5cbmZ1bmN0aW9uIGRpcmVjdGl2ZUNvbXBhcmF0b3IgKGEsIGIpIHtcbiAgYSA9IGEuZGVmLnByaW9yaXR5IHx8IDBcbiAgYiA9IGIuZGVmLnByaW9yaXR5IHx8IDBcbiAgcmV0dXJuIGEgPiBiID8gMSA6IC0xXG59XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciBhbiBlbGVtZW50IGlzIHRyYW5zY2x1ZGVkXG4gKlxuICogQHBhcmFtIHtFbGVtZW50fSBlbFxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqL1xuXG52YXIgdHJhbnNjbHVkZWRGbGFnQXR0ciA9ICdfX3Z1ZV9fdHJhbnNjbHVkZWQnXG5mdW5jdGlvbiBjaGVja1RyYW5zY2x1c2lvbiAoZWwpIHtcbiAgaWYgKGVsLm5vZGVUeXBlID09PSAxICYmIGVsLmhhc0F0dHJpYnV0ZSh0cmFuc2NsdWRlZEZsYWdBdHRyKSkge1xuICAgIGVsLnJlbW92ZUF0dHJpYnV0ZSh0cmFuc2NsdWRlZEZsYWdBdHRyKVxuICAgIHJldHVybiB0cnVlXG4gIH1cbn1cbiIsInZhciBfID0gcmVxdWlyZSgnLi4vdXRpbCcpXG52YXIgY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlnJylcbnZhciB0ZW1wbGF0ZVBhcnNlciA9IHJlcXVpcmUoJy4uL3BhcnNlcnMvdGVtcGxhdGUnKVxudmFyIHRyYW5zY2x1ZGVkRmxhZ0F0dHIgPSAnX192dWVfX3RyYW5zY2x1ZGVkJ1xuXG4vKipcbiAqIFByb2Nlc3MgYW4gZWxlbWVudCBvciBhIERvY3VtZW50RnJhZ21lbnQgYmFzZWQgb24gYVxuICogaW5zdGFuY2Ugb3B0aW9uIG9iamVjdC4gVGhpcyBhbGxvd3MgdXMgdG8gdHJhbnNjbHVkZVxuICogYSB0ZW1wbGF0ZSBub2RlL2ZyYWdtZW50IGJlZm9yZSB0aGUgaW5zdGFuY2UgaXMgY3JlYXRlZCxcbiAqIHNvIHRoZSBwcm9jZXNzZWQgZnJhZ21lbnQgY2FuIHRoZW4gYmUgY2xvbmVkIGFuZCByZXVzZWRcbiAqIGluIHYtcmVwZWF0LlxuICpcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKiBAcmV0dXJuIHtFbGVtZW50fERvY3VtZW50RnJhZ21lbnR9XG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiB0cmFuc2NsdWRlIChlbCwgb3B0aW9ucykge1xuICAvLyBleHRyYWN0IGNvbnRhaW5lciBhdHRyaWJ1dGVzIHRvIHBhc3MgdGhlbSBkb3duXG4gIC8vIHRvIGNvbXBpbGVyLCBiZWNhdXNlIHRoZXkgbmVlZCB0byBiZSBjb21waWxlZCBpblxuICAvLyBwYXJlbnQgc2NvcGUuIHdlIGFyZSBtdXRhdGluZyB0aGUgb3B0aW9ucyBvYmplY3QgaGVyZVxuICAvLyBhc3N1bWluZyB0aGUgc2FtZSBvYmplY3Qgd2lsbCBiZSB1c2VkIGZvciBjb21waWxlXG4gIC8vIHJpZ2h0IGFmdGVyIHRoaXMuXG4gIGlmIChvcHRpb25zKSB7XG4gICAgb3B0aW9ucy5fY29udGFpbmVyQXR0cnMgPSBleHRyYWN0QXR0cnMoZWwpXG4gIH1cbiAgLy8gTWFyayBjb250ZW50IG5vZGVzIGFuZCBhdHRycyBzbyB0aGF0IHRoZSBjb21waWxlclxuICAvLyBrbm93cyB0aGV5IHNob3VsZCBiZSBjb21waWxlZCBpbiBwYXJlbnQgc2NvcGUuXG4gIGlmIChvcHRpb25zICYmIG9wdGlvbnMuX2FzQ29tcG9uZW50KSB7XG4gICAgdmFyIGkgPSBlbC5jaGlsZE5vZGVzLmxlbmd0aFxuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgIHZhciBub2RlID0gZWwuY2hpbGROb2Rlc1tpXVxuICAgICAgaWYgKG5vZGUubm9kZVR5cGUgPT09IDEpIHtcbiAgICAgICAgbm9kZS5zZXRBdHRyaWJ1dGUodHJhbnNjbHVkZWRGbGFnQXR0ciwgJycpXG4gICAgICB9IGVsc2UgaWYgKG5vZGUubm9kZVR5cGUgPT09IDMgJiYgbm9kZS5kYXRhLnRyaW0oKSkge1xuICAgICAgICAvLyB3cmFwIHRyYW5zY2x1ZGVkIHRleHROb2RlcyBpbiBzcGFucywgYmVjYXVzZVxuICAgICAgICAvLyByYXcgdGV4dE5vZGVzIGNhbid0IGJlIHBlcnNpc3RlZCB0aHJvdWdoIGNsb25lc1xuICAgICAgICAvLyBieSBhdHRhY2hpbmcgYXR0cmlidXRlcy5cbiAgICAgICAgdmFyIHdyYXBwZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJylcbiAgICAgICAgd3JhcHBlci50ZXh0Q29udGVudCA9IG5vZGUuZGF0YVxuICAgICAgICB3cmFwcGVyLnNldEF0dHJpYnV0ZSgnX192dWVfX3dyYXAnLCAnJylcbiAgICAgICAgd3JhcHBlci5zZXRBdHRyaWJ1dGUodHJhbnNjbHVkZWRGbGFnQXR0ciwgJycpXG4gICAgICAgIGVsLnJlcGxhY2VDaGlsZCh3cmFwcGVyLCBub2RlKVxuICAgICAgfVxuICAgIH1cbiAgfVxuICAvLyBmb3IgdGVtcGxhdGUgdGFncywgd2hhdCB3ZSB3YW50IGlzIGl0cyBjb250ZW50IGFzXG4gIC8vIGEgZG9jdW1lbnRGcmFnbWVudCAoZm9yIGJsb2NrIGluc3RhbmNlcylcbiAgaWYgKGVsLnRhZ05hbWUgPT09ICdURU1QTEFURScpIHtcbiAgICBlbCA9IHRlbXBsYXRlUGFyc2VyLnBhcnNlKGVsKVxuICB9XG4gIGlmIChvcHRpb25zICYmIG9wdGlvbnMudGVtcGxhdGUpIHtcbiAgICBlbCA9IHRyYW5zY2x1ZGVUZW1wbGF0ZShlbCwgb3B0aW9ucylcbiAgfVxuICBpZiAoZWwgaW5zdGFuY2VvZiBEb2N1bWVudEZyYWdtZW50KSB7XG4gICAgLy8gYW5jaG9ycyBmb3IgYmxvY2sgaW5zdGFuY2VcbiAgICAvLyBwYXNzaW5nIGluIGBwZXJzaXN0OiB0cnVlYCB0byBhdm9pZCB0aGVtIGJlaW5nXG4gICAgLy8gZGlzY2FyZGVkIGJ5IElFIGR1cmluZyB0ZW1wbGF0ZSBjbG9uaW5nXG4gICAgXy5wcmVwZW5kKF8uY3JlYXRlQW5jaG9yKCd2LXN0YXJ0JywgdHJ1ZSksIGVsKVxuICAgIGVsLmFwcGVuZENoaWxkKF8uY3JlYXRlQW5jaG9yKCd2LWVuZCcsIHRydWUpKVxuICB9XG4gIHJldHVybiBlbFxufVxuXG4vKipcbiAqIFByb2Nlc3MgdGhlIHRlbXBsYXRlIG9wdGlvbi5cbiAqIElmIHRoZSByZXBsYWNlIG9wdGlvbiBpcyB0cnVlIHRoaXMgd2lsbCBzd2FwIHRoZSAkZWwuXG4gKlxuICogQHBhcmFtIHtFbGVtZW50fSBlbFxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqIEByZXR1cm4ge0VsZW1lbnR8RG9jdW1lbnRGcmFnbWVudH1cbiAqL1xuXG5mdW5jdGlvbiB0cmFuc2NsdWRlVGVtcGxhdGUgKGVsLCBvcHRpb25zKSB7XG4gIHZhciB0ZW1wbGF0ZSA9IG9wdGlvbnMudGVtcGxhdGVcbiAgdmFyIGZyYWcgPSB0ZW1wbGF0ZVBhcnNlci5wYXJzZSh0ZW1wbGF0ZSwgdHJ1ZSlcbiAgaWYgKCFmcmFnKSB7XG4gICAgXy53YXJuKCdJbnZhbGlkIHRlbXBsYXRlIG9wdGlvbjogJyArIHRlbXBsYXRlKVxuICB9IGVsc2Uge1xuICAgIHZhciByYXdDb250ZW50ID0gb3B0aW9ucy5fY29udGVudCB8fCBfLmV4dHJhY3RDb250ZW50KGVsKVxuICAgIHZhciByZXBsYWNlciA9IGZyYWcuZmlyc3RDaGlsZFxuICAgIGlmIChvcHRpb25zLnJlcGxhY2UpIHtcbiAgICAgIGlmIChcbiAgICAgICAgZnJhZy5jaGlsZE5vZGVzLmxlbmd0aCA+IDEgfHxcbiAgICAgICAgcmVwbGFjZXIubm9kZVR5cGUgIT09IDEgfHxcbiAgICAgICAgLy8gd2hlbiByb290IG5vZGUgaGFzIHYtcmVwZWF0LCB0aGUgaW5zdGFuY2UgZW5kcyB1cFxuICAgICAgICAvLyBoYXZpbmcgbXVsdGlwbGUgdG9wLWxldmVsIG5vZGVzLCB0aHVzIGJlY29taW5nIGFcbiAgICAgICAgLy8gYmxvY2sgaW5zdGFuY2UuICgjODM1KVxuICAgICAgICByZXBsYWNlci5oYXNBdHRyaWJ1dGUoY29uZmlnLnByZWZpeCArICdyZXBlYXQnKVxuICAgICAgKSB7XG4gICAgICAgIHRyYW5zY2x1ZGVDb250ZW50KGZyYWcsIHJhd0NvbnRlbnQpXG4gICAgICAgIHJldHVybiBmcmFnXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvcHRpb25zLl9yZXBsYWNlckF0dHJzID0gZXh0cmFjdEF0dHJzKHJlcGxhY2VyKVxuICAgICAgICBtZXJnZUF0dHJzKGVsLCByZXBsYWNlcilcbiAgICAgICAgdHJhbnNjbHVkZUNvbnRlbnQocmVwbGFjZXIsIHJhd0NvbnRlbnQpXG4gICAgICAgIHJldHVybiByZXBsYWNlclxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBlbC5hcHBlbmRDaGlsZChmcmFnKVxuICAgICAgdHJhbnNjbHVkZUNvbnRlbnQoZWwsIHJhd0NvbnRlbnQpXG4gICAgICByZXR1cm4gZWxcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBSZXNvbHZlIDxjb250ZW50PiBpbnNlcnRpb24gcG9pbnRzIG1pbWlja2luZyB0aGUgYmVoYXZpb3JcbiAqIG9mIHRoZSBTaGFkb3cgRE9NIHNwZWM6XG4gKlxuICogICBodHRwOi8vdzNjLmdpdGh1Yi5pby93ZWJjb21wb25lbnRzL3NwZWMvc2hhZG93LyNpbnNlcnRpb24tcG9pbnRzXG4gKlxuICogQHBhcmFtIHtFbGVtZW50fERvY3VtZW50RnJhZ21lbnR9IGVsXG4gKiBAcGFyYW0ge0VsZW1lbnR9IHJhd1xuICovXG5cbmZ1bmN0aW9uIHRyYW5zY2x1ZGVDb250ZW50IChlbCwgcmF3KSB7XG4gIHZhciBvdXRsZXRzID0gZ2V0T3V0bGV0cyhlbClcbiAgdmFyIGkgPSBvdXRsZXRzLmxlbmd0aFxuICBpZiAoIWkpIHJldHVyblxuICB2YXIgb3V0bGV0LCBzZWxlY3QsIHNlbGVjdGVkLCBqLCBtYWluXG5cbiAgZnVuY3Rpb24gaXNEaXJlY3RDaGlsZCAobm9kZSkge1xuICAgIHJldHVybiBub2RlLnBhcmVudE5vZGUgPT09IHJhd1xuICB9XG5cbiAgLy8gZmlyc3QgcGFzcywgY29sbGVjdCBjb3JyZXNwb25kaW5nIGNvbnRlbnRcbiAgLy8gZm9yIGVhY2ggb3V0bGV0LlxuICB3aGlsZSAoaS0tKSB7XG4gICAgb3V0bGV0ID0gb3V0bGV0c1tpXVxuICAgIGlmIChyYXcpIHtcbiAgICAgIHNlbGVjdCA9IG91dGxldC5nZXRBdHRyaWJ1dGUoJ3NlbGVjdCcpXG4gICAgICBpZiAoc2VsZWN0KSB7ICAvLyBzZWxlY3QgY29udGVudFxuICAgICAgICBzZWxlY3RlZCA9IHJhdy5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdClcbiAgICAgICAgaWYgKHNlbGVjdGVkLmxlbmd0aCkge1xuICAgICAgICAgIC8vIGFjY29yZGluZyB0byBTaGFkb3cgRE9NIHNwZWMsIGBzZWxlY3RgIGNhblxuICAgICAgICAgIC8vIG9ubHkgc2VsZWN0IGRpcmVjdCBjaGlsZHJlbiBvZiB0aGUgaG9zdCBub2RlLlxuICAgICAgICAgIC8vIGVuZm9yY2luZyB0aGlzIGFsc28gZml4ZXMgIzc4Ni5cbiAgICAgICAgICBzZWxlY3RlZCA9IFtdLmZpbHRlci5jYWxsKHNlbGVjdGVkLCBpc0RpcmVjdENoaWxkKVxuICAgICAgICB9XG4gICAgICAgIG91dGxldC5jb250ZW50ID0gc2VsZWN0ZWQubGVuZ3RoXG4gICAgICAgICAgPyBzZWxlY3RlZFxuICAgICAgICAgIDogXy50b0FycmF5KG91dGxldC5jaGlsZE5vZGVzKVxuICAgICAgfSBlbHNlIHsgLy8gZGVmYXVsdCBjb250ZW50XG4gICAgICAgIG1haW4gPSBvdXRsZXRcbiAgICAgIH1cbiAgICB9IGVsc2UgeyAvLyBmYWxsYmFjayBjb250ZW50XG4gICAgICBvdXRsZXQuY29udGVudCA9IF8udG9BcnJheShvdXRsZXQuY2hpbGROb2RlcylcbiAgICB9XG4gIH1cbiAgLy8gc2Vjb25kIHBhc3MsIGFjdHVhbGx5IGluc2VydCB0aGUgY29udGVudHNcbiAgZm9yIChpID0gMCwgaiA9IG91dGxldHMubGVuZ3RoOyBpIDwgajsgaSsrKSB7XG4gICAgb3V0bGV0ID0gb3V0bGV0c1tpXVxuICAgIGlmIChvdXRsZXQgIT09IG1haW4pIHtcbiAgICAgIGluc2VydENvbnRlbnRBdChvdXRsZXQsIG91dGxldC5jb250ZW50KVxuICAgIH1cbiAgfVxuICAvLyBmaW5hbGx5IGluc2VydCB0aGUgbWFpbiBjb250ZW50XG4gIGlmIChtYWluKSB7XG4gICAgaW5zZXJ0Q29udGVudEF0KG1haW4sIF8udG9BcnJheShyYXcuY2hpbGROb2RlcykpXG4gIH1cbn1cblxuLyoqXG4gKiBHZXQgPGNvbnRlbnQ+IG91dGxldHMgZnJvbSB0aGUgZWxlbWVudC9saXN0XG4gKlxuICogQHBhcmFtIHtFbGVtZW50fEFycmF5fSBlbFxuICogQHJldHVybiB7QXJyYXl9XG4gKi9cblxudmFyIGNvbmNhdCA9IFtdLmNvbmNhdFxuZnVuY3Rpb24gZ2V0T3V0bGV0cyAoZWwpIHtcbiAgcmV0dXJuIF8uaXNBcnJheShlbClcbiAgICA/IGNvbmNhdC5hcHBseShbXSwgZWwubWFwKGdldE91dGxldHMpKVxuICAgIDogZWwucXVlcnlTZWxlY3RvckFsbFxuICAgICAgPyBfLnRvQXJyYXkoZWwucXVlcnlTZWxlY3RvckFsbCgnY29udGVudCcpKVxuICAgICAgOiBbXVxufVxuXG4vKipcbiAqIEluc2VydCBhbiBhcnJheSBvZiBub2RlcyBhdCBvdXRsZXQsXG4gKiB0aGVuIHJlbW92ZSB0aGUgb3V0bGV0LlxuICpcbiAqIEBwYXJhbSB7RWxlbWVudH0gb3V0bGV0XG4gKiBAcGFyYW0ge0FycmF5fSBjb250ZW50c1xuICovXG5cbmZ1bmN0aW9uIGluc2VydENvbnRlbnRBdCAob3V0bGV0LCBjb250ZW50cykge1xuICAvLyBub3QgdXNpbmcgdXRpbCBET00gbWV0aG9kcyBoZXJlIGJlY2F1c2VcbiAgLy8gcGFyZW50Tm9kZSBjYW4gYmUgY2FjaGVkXG4gIHZhciBwYXJlbnQgPSBvdXRsZXQucGFyZW50Tm9kZVxuICBmb3IgKHZhciBpID0gMCwgaiA9IGNvbnRlbnRzLmxlbmd0aDsgaSA8IGo7IGkrKykge1xuICAgIHBhcmVudC5pbnNlcnRCZWZvcmUoY29udGVudHNbaV0sIG91dGxldClcbiAgfVxuICBwYXJlbnQucmVtb3ZlQ2hpbGQob3V0bGV0KVxufVxuXG4vKipcbiAqIEhlbHBlciB0byBleHRyYWN0IGEgY29tcG9uZW50IGNvbnRhaW5lcidzIGF0dHJpYnV0ZSBuYW1lc1xuICogaW50byBhIG1hcC4gVGhlIHJlc3VsdGluZyBtYXAgd2lsbCBiZSB1c2VkIGluIGNvbXBpbGVyIHRvXG4gKiBkZXRlcm1pbmUgd2hldGhlciBhbiBhdHRyaWJ1dGUgaXMgdHJhbnNjbHVkZWQuXG4gKlxuICogQHBhcmFtIHtFbGVtZW50fSBlbFxuICogQHJldHVybiB7T2JqZWN0fVxuICovXG5cbmZ1bmN0aW9uIGV4dHJhY3RBdHRycyAoZWwpIHtcbiAgaWYgKGVsLm5vZGVUeXBlID09PSAxICYmIGVsLmhhc0F0dHJpYnV0ZXMoKSkge1xuICAgIHZhciBhdHRycyA9IGVsLmF0dHJpYnV0ZXNcbiAgICB2YXIgcmVzID0ge31cbiAgICB2YXIgaSA9IGF0dHJzLmxlbmd0aFxuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgIHJlc1thdHRyc1tpXS5uYW1lXSA9IGF0dHJzW2ldLnZhbHVlXG4gICAgfVxuICAgIHJldHVybiByZXNcbiAgfVxufVxuXG4vKipcbiAqIE1lcmdlIHRoZSBhdHRyaWJ1dGVzIG9mIHR3byBlbGVtZW50cywgYW5kIG1ha2Ugc3VyZVxuICogdGhlIGNsYXNzIG5hbWVzIGFyZSBtZXJnZWQgcHJvcGVybHkuXG4gKlxuICogQHBhcmFtIHtFbGVtZW50fSBmcm9tXG4gKiBAcGFyYW0ge0VsZW1lbnR9IHRvXG4gKi9cblxuZnVuY3Rpb24gbWVyZ2VBdHRycyAoZnJvbSwgdG8pIHtcbiAgdmFyIGF0dHJzID0gZnJvbS5hdHRyaWJ1dGVzXG4gIHZhciBpID0gYXR0cnMubGVuZ3RoXG4gIHZhciBuYW1lLCB2YWx1ZVxuICB3aGlsZSAoaS0tKSB7XG4gICAgbmFtZSA9IGF0dHJzW2ldLm5hbWVcbiAgICB2YWx1ZSA9IGF0dHJzW2ldLnZhbHVlXG4gICAgaWYgKCF0by5oYXNBdHRyaWJ1dGUobmFtZSkpIHtcbiAgICAgIHRvLnNldEF0dHJpYnV0ZShuYW1lLCB2YWx1ZSlcbiAgICB9IGVsc2UgaWYgKG5hbWUgPT09ICdjbGFzcycpIHtcbiAgICAgIHRvLmNsYXNzTmFtZSA9IHRvLmNsYXNzTmFtZSArICcgJyArIHZhbHVlXG4gICAgfVxuICB9XG59IiwibW9kdWxlLmV4cG9ydHMgPSB7XG5cbiAgLyoqXG4gICAqIFRoZSBwcmVmaXggdG8gbG9vayBmb3Igd2hlbiBwYXJzaW5nIGRpcmVjdGl2ZXMuXG4gICAqXG4gICAqIEB0eXBlIHtTdHJpbmd9XG4gICAqL1xuXG4gIHByZWZpeDogJ3YtJyxcblxuICAvKipcbiAgICogV2hldGhlciB0byBwcmludCBkZWJ1ZyBtZXNzYWdlcy5cbiAgICogQWxzbyBlbmFibGVzIHN0YWNrIHRyYWNlIGZvciB3YXJuaW5ncy5cbiAgICpcbiAgICogQHR5cGUge0Jvb2xlYW59XG4gICAqL1xuXG4gIGRlYnVnOiBmYWxzZSxcblxuICAvKipcbiAgICogV2hldGhlciB0byBzdXBwcmVzcyB3YXJuaW5ncy5cbiAgICpcbiAgICogQHR5cGUge0Jvb2xlYW59XG4gICAqL1xuXG4gIHNpbGVudDogZmFsc2UsXG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgYWxsb3cgb2JzZXJ2ZXIgdG8gYWx0ZXIgZGF0YSBvYmplY3RzJ1xuICAgKiBfX3Byb3RvX18uXG4gICAqXG4gICAqIEB0eXBlIHtCb29sZWFufVxuICAgKi9cblxuICBwcm90bzogdHJ1ZSxcblxuICAvKipcbiAgICogV2hldGhlciB0byBwYXJzZSBtdXN0YWNoZSB0YWdzIGluIHRlbXBsYXRlcy5cbiAgICpcbiAgICogQHR5cGUge0Jvb2xlYW59XG4gICAqL1xuXG4gIGludGVycG9sYXRlOiB0cnVlLFxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRvIHVzZSBhc3luYyByZW5kZXJpbmcuXG4gICAqL1xuXG4gIGFzeW5jOiB0cnVlLFxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRvIHdhcm4gYWdhaW5zdCBlcnJvcnMgY2F1Z2h0IHdoZW4gZXZhbHVhdGluZ1xuICAgKiBleHByZXNzaW9ucy5cbiAgICovXG5cbiAgd2FybkV4cHJlc3Npb25FcnJvcnM6IHRydWUsXG5cbiAgLyoqXG4gICAqIEludGVybmFsIGZsYWcgdG8gaW5kaWNhdGUgdGhlIGRlbGltaXRlcnMgaGF2ZSBiZWVuXG4gICAqIGNoYW5nZWQuXG4gICAqXG4gICAqIEB0eXBlIHtCb29sZWFufVxuICAgKi9cblxuICBfZGVsaW1pdGVyc0NoYW5nZWQ6IHRydWUsXG5cbiAgLyoqXG4gICAqIExpc3Qgb2YgYXNzZXQgdHlwZXMgdGhhdCBhIGNvbXBvbmVudCBjYW4gb3duLlxuICAgKlxuICAgKiBAdHlwZSB7QXJyYXl9XG4gICAqL1xuXG4gIF9hc3NldFR5cGVzOiBbXG4gICAgJ2RpcmVjdGl2ZScsXG4gICAgJ2VsZW1lbnREaXJlY3RpdmUnLFxuICAgICdmaWx0ZXInLFxuICAgICd0cmFuc2l0aW9uJ1xuICBdXG5cbn1cblxuLyoqXG4gKiBJbnRlcnBvbGF0aW9uIGRlbGltaXRlcnMuXG4gKiBXZSBuZWVkIHRvIG1hcmsgdGhlIGNoYW5nZWQgZmxhZyBzbyB0aGF0IHRoZSB0ZXh0IHBhcnNlclxuICoga25vd3MgaXQgbmVlZHMgdG8gcmVjb21waWxlIHRoZSByZWdleC5cbiAqXG4gKiBAdHlwZSB7QXJyYXk8U3RyaW5nPn1cbiAqL1xuXG52YXIgZGVsaW1pdGVycyA9IFsne3snLCAnfX0nXVxuT2JqZWN0LmRlZmluZVByb3BlcnR5KG1vZHVsZS5leHBvcnRzLCAnZGVsaW1pdGVycycsIHtcbiAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGRlbGltaXRlcnNcbiAgfSxcbiAgc2V0OiBmdW5jdGlvbiAodmFsKSB7XG4gICAgZGVsaW1pdGVycyA9IHZhbFxuICAgIHRoaXMuX2RlbGltaXRlcnNDaGFuZ2VkID0gdHJ1ZVxuICB9XG59KSIsInZhciBfID0gcmVxdWlyZSgnLi91dGlsJylcbnZhciBjb25maWcgPSByZXF1aXJlKCcuL2NvbmZpZycpXG52YXIgV2F0Y2hlciA9IHJlcXVpcmUoJy4vd2F0Y2hlcicpXG52YXIgdGV4dFBhcnNlciA9IHJlcXVpcmUoJy4vcGFyc2Vycy90ZXh0JylcbnZhciBleHBQYXJzZXIgPSByZXF1aXJlKCcuL3BhcnNlcnMvZXhwcmVzc2lvbicpXG5cbi8qKlxuICogQSBkaXJlY3RpdmUgbGlua3MgYSBET00gZWxlbWVudCB3aXRoIGEgcGllY2Ugb2YgZGF0YSxcbiAqIHdoaWNoIGlzIHRoZSByZXN1bHQgb2YgZXZhbHVhdGluZyBhbiBleHByZXNzaW9uLlxuICogSXQgcmVnaXN0ZXJzIGEgd2F0Y2hlciB3aXRoIHRoZSBleHByZXNzaW9uIGFuZCBjYWxsc1xuICogdGhlIERPTSB1cGRhdGUgZnVuY3Rpb24gd2hlbiBhIGNoYW5nZSBpcyB0cmlnZ2VyZWQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVcbiAqIEBwYXJhbSB7Tm9kZX0gZWxcbiAqIEBwYXJhbSB7VnVlfSB2bVxuICogQHBhcmFtIHtPYmplY3R9IGRlc2NyaXB0b3JcbiAqICAgICAgICAgICAgICAgICAtIHtTdHJpbmd9IGV4cHJlc3Npb25cbiAqICAgICAgICAgICAgICAgICAtIHtTdHJpbmd9IFthcmddXG4gKiAgICAgICAgICAgICAgICAgLSB7QXJyYXk8T2JqZWN0Pn0gW2ZpbHRlcnNdXG4gKiBAcGFyYW0ge09iamVjdH0gZGVmIC0gZGlyZWN0aXZlIGRlZmluaXRpb24gb2JqZWN0XG4gKiBAcGFyYW0ge1Z1ZXx1bmRlZmluZWR9IGhvc3QgLSB0cmFuc2NsdXNpb24gaG9zdCB0YXJnZXRcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5cbmZ1bmN0aW9uIERpcmVjdGl2ZSAobmFtZSwgZWwsIHZtLCBkZXNjcmlwdG9yLCBkZWYsIGhvc3QpIHtcbiAgLy8gcHVibGljXG4gIHRoaXMubmFtZSA9IG5hbWVcbiAgdGhpcy5lbCA9IGVsXG4gIHRoaXMudm0gPSB2bVxuICAvLyBjb3B5IGRlc2NyaXB0b3IgcHJvcHNcbiAgdGhpcy5yYXcgPSBkZXNjcmlwdG9yLnJhd1xuICB0aGlzLmV4cHJlc3Npb24gPSBkZXNjcmlwdG9yLmV4cHJlc3Npb25cbiAgdGhpcy5hcmcgPSBkZXNjcmlwdG9yLmFyZ1xuICB0aGlzLmZpbHRlcnMgPSBkZXNjcmlwdG9yLmZpbHRlcnNcbiAgLy8gcHJpdmF0ZVxuICB0aGlzLl9kZXNjcmlwdG9yID0gZGVzY3JpcHRvclxuICB0aGlzLl9ob3N0ID0gaG9zdFxuICB0aGlzLl9sb2NrZWQgPSBmYWxzZVxuICB0aGlzLl9ib3VuZCA9IGZhbHNlXG4gIC8vIGluaXRcbiAgdGhpcy5fYmluZChkZWYpXG59XG5cbnZhciBwID0gRGlyZWN0aXZlLnByb3RvdHlwZVxuXG4vKipcbiAqIEluaXRpYWxpemUgdGhlIGRpcmVjdGl2ZSwgbWl4aW4gZGVmaW5pdGlvbiBwcm9wZXJ0aWVzLFxuICogc2V0dXAgdGhlIHdhdGNoZXIsIGNhbGwgZGVmaW5pdGlvbiBiaW5kKCkgYW5kIHVwZGF0ZSgpXG4gKiBpZiBwcmVzZW50LlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBkZWZcbiAqL1xuXG5wLl9iaW5kID0gZnVuY3Rpb24gKGRlZikge1xuICBpZiAodGhpcy5uYW1lICE9PSAnY2xvYWsnICYmIHRoaXMuZWwgJiYgdGhpcy5lbC5yZW1vdmVBdHRyaWJ1dGUpIHtcbiAgICB0aGlzLmVsLnJlbW92ZUF0dHJpYnV0ZShjb25maWcucHJlZml4ICsgdGhpcy5uYW1lKVxuICB9XG4gIGlmICh0eXBlb2YgZGVmID09PSAnZnVuY3Rpb24nKSB7XG4gICAgdGhpcy51cGRhdGUgPSBkZWZcbiAgfSBlbHNlIHtcbiAgICBfLmV4dGVuZCh0aGlzLCBkZWYpXG4gIH1cbiAgdGhpcy5fd2F0Y2hlckV4cCA9IHRoaXMuZXhwcmVzc2lvblxuICB0aGlzLl9jaGVja0R5bmFtaWNMaXRlcmFsKClcbiAgaWYgKHRoaXMuYmluZCkge1xuICAgIHRoaXMuYmluZCgpXG4gIH1cbiAgaWYgKHRoaXMuX3dhdGNoZXJFeHAgJiZcbiAgICAgICh0aGlzLnVwZGF0ZSB8fCB0aGlzLnR3b1dheSkgJiZcbiAgICAgICghdGhpcy5pc0xpdGVyYWwgfHwgdGhpcy5faXNEeW5hbWljTGl0ZXJhbCkgJiZcbiAgICAgICF0aGlzLl9jaGVja1N0YXRlbWVudCgpKSB7XG4gICAgLy8gd3JhcHBlZCB1cGRhdGVyIGZvciBjb250ZXh0XG4gICAgdmFyIGRpciA9IHRoaXNcbiAgICB2YXIgdXBkYXRlID0gdGhpcy5fdXBkYXRlID0gdGhpcy51cGRhdGVcbiAgICAgID8gZnVuY3Rpb24gKHZhbCwgb2xkVmFsKSB7XG4gICAgICAgICAgaWYgKCFkaXIuX2xvY2tlZCkge1xuICAgICAgICAgICAgZGlyLnVwZGF0ZSh2YWwsIG9sZFZhbClcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIDogZnVuY3Rpb24gKCkge30gLy8gbm9vcCBpZiBubyB1cGRhdGUgaXMgcHJvdmlkZWRcbiAgICAvLyBwcmUtcHJvY2VzcyBob29rIGNhbGxlZCBiZWZvcmUgdGhlIHZhbHVlIGlzIHBpcGVkXG4gICAgLy8gdGhyb3VnaCB0aGUgZmlsdGVycy4gdXNlZCBpbiB2LXJlcGVhdC5cbiAgICB2YXIgcHJlUHJvY2VzcyA9IHRoaXMuX3ByZVByb2Nlc3NcbiAgICAgID8gXy5iaW5kKHRoaXMuX3ByZVByb2Nlc3MsIHRoaXMpXG4gICAgICA6IG51bGxcbiAgICB2YXIgd2F0Y2hlciA9IHRoaXMuX3dhdGNoZXIgPSBuZXcgV2F0Y2hlcihcbiAgICAgIHRoaXMudm0sXG4gICAgICB0aGlzLl93YXRjaGVyRXhwLFxuICAgICAgdXBkYXRlLCAvLyBjYWxsYmFja1xuICAgICAge1xuICAgICAgICBmaWx0ZXJzOiB0aGlzLmZpbHRlcnMsXG4gICAgICAgIHR3b1dheTogdGhpcy50d29XYXksXG4gICAgICAgIGRlZXA6IHRoaXMuZGVlcCxcbiAgICAgICAgcHJlUHJvY2VzczogcHJlUHJvY2Vzc1xuICAgICAgfVxuICAgIClcbiAgICBpZiAodGhpcy5faW5pdFZhbHVlICE9IG51bGwpIHtcbiAgICAgIHdhdGNoZXIuc2V0KHRoaXMuX2luaXRWYWx1ZSlcbiAgICB9IGVsc2UgaWYgKHRoaXMudXBkYXRlKSB7XG4gICAgICB0aGlzLnVwZGF0ZSh3YXRjaGVyLnZhbHVlKVxuICAgIH1cbiAgfVxuICB0aGlzLl9ib3VuZCA9IHRydWVcbn1cblxuLyoqXG4gKiBjaGVjayBpZiB0aGlzIGlzIGEgZHluYW1pYyBsaXRlcmFsIGJpbmRpbmcuXG4gKlxuICogZS5nLiB2LWNvbXBvbmVudD1cInt7Y3VycmVudFZpZXd9fVwiXG4gKi9cblxucC5fY2hlY2tEeW5hbWljTGl0ZXJhbCA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIGV4cHJlc3Npb24gPSB0aGlzLmV4cHJlc3Npb25cbiAgaWYgKGV4cHJlc3Npb24gJiYgdGhpcy5pc0xpdGVyYWwpIHtcbiAgICB2YXIgdG9rZW5zID0gdGV4dFBhcnNlci5wYXJzZShleHByZXNzaW9uKVxuICAgIGlmICh0b2tlbnMpIHtcbiAgICAgIHZhciBleHAgPSB0ZXh0UGFyc2VyLnRva2Vuc1RvRXhwKHRva2VucylcbiAgICAgIHRoaXMuZXhwcmVzc2lvbiA9IHRoaXMudm0uJGdldChleHApXG4gICAgICB0aGlzLl93YXRjaGVyRXhwID0gZXhwXG4gICAgICB0aGlzLl9pc0R5bmFtaWNMaXRlcmFsID0gdHJ1ZVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIENoZWNrIGlmIHRoZSBkaXJlY3RpdmUgaXMgYSBmdW5jdGlvbiBjYWxsZXJcbiAqIGFuZCBpZiB0aGUgZXhwcmVzc2lvbiBpcyBhIGNhbGxhYmxlIG9uZS4gSWYgYm90aCB0cnVlLFxuICogd2Ugd3JhcCB1cCB0aGUgZXhwcmVzc2lvbiBhbmQgdXNlIGl0IGFzIHRoZSBldmVudFxuICogaGFuZGxlci5cbiAqXG4gKiBlLmcuIHYtb249XCJjbGljazogYSsrXCJcbiAqXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICovXG5cbnAuX2NoZWNrU3RhdGVtZW50ID0gZnVuY3Rpb24gKCkge1xuICB2YXIgZXhwcmVzc2lvbiA9IHRoaXMuZXhwcmVzc2lvblxuICBpZiAoXG4gICAgZXhwcmVzc2lvbiAmJiB0aGlzLmFjY2VwdFN0YXRlbWVudCAmJlxuICAgICFleHBQYXJzZXIuaXNTaW1wbGVQYXRoKGV4cHJlc3Npb24pXG4gICkge1xuICAgIHZhciBmbiA9IGV4cFBhcnNlci5wYXJzZShleHByZXNzaW9uKS5nZXRcbiAgICB2YXIgdm0gPSB0aGlzLnZtXG4gICAgdmFyIGhhbmRsZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBmbi5jYWxsKHZtLCB2bSlcbiAgICB9XG4gICAgaWYgKHRoaXMuZmlsdGVycykge1xuICAgICAgaGFuZGxlciA9IHZtLl9hcHBseUZpbHRlcnMoaGFuZGxlciwgbnVsbCwgdGhpcy5maWx0ZXJzKVxuICAgIH1cbiAgICB0aGlzLnVwZGF0ZShoYW5kbGVyKVxuICAgIHJldHVybiB0cnVlXG4gIH1cbn1cblxuLyoqXG4gKiBDaGVjayBmb3IgYW4gYXR0cmlidXRlIGRpcmVjdGl2ZSBwYXJhbSwgZS5nLiBsYXp5XG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqL1xuXG5wLl9jaGVja1BhcmFtID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgdmFyIHBhcmFtID0gdGhpcy5lbC5nZXRBdHRyaWJ1dGUobmFtZSlcbiAgaWYgKHBhcmFtICE9PSBudWxsKSB7XG4gICAgdGhpcy5lbC5yZW1vdmVBdHRyaWJ1dGUobmFtZSlcbiAgfVxuICByZXR1cm4gcGFyYW1cbn1cblxuLyoqXG4gKiBUZWFyZG93biB0aGUgd2F0Y2hlciBhbmQgY2FsbCB1bmJpbmQuXG4gKi9cblxucC5fdGVhcmRvd24gPSBmdW5jdGlvbiAoKSB7XG4gIGlmICh0aGlzLl9ib3VuZCkge1xuICAgIHRoaXMuX2JvdW5kID0gZmFsc2VcbiAgICBpZiAodGhpcy51bmJpbmQpIHtcbiAgICAgIHRoaXMudW5iaW5kKClcbiAgICB9XG4gICAgaWYgKHRoaXMuX3dhdGNoZXIpIHtcbiAgICAgIHRoaXMuX3dhdGNoZXIudGVhcmRvd24oKVxuICAgIH1cbiAgICB0aGlzLnZtID0gdGhpcy5lbCA9IHRoaXMuX3dhdGNoZXIgPSBudWxsXG4gIH1cbn1cblxuLyoqXG4gKiBTZXQgdGhlIGNvcnJlc3BvbmRpbmcgdmFsdWUgd2l0aCB0aGUgc2V0dGVyLlxuICogVGhpcyBzaG91bGQgb25seSBiZSB1c2VkIGluIHR3by13YXkgZGlyZWN0aXZlc1xuICogZS5nLiB2LW1vZGVsLlxuICpcbiAqIEBwYXJhbSB7Kn0gdmFsdWVcbiAqIEBwdWJsaWNcbiAqL1xuXG5wLnNldCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICBpZiAodGhpcy50d29XYXkpIHtcbiAgICB0aGlzLl93aXRoTG9jayhmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLl93YXRjaGVyLnNldCh2YWx1ZSlcbiAgICB9KVxuICB9XG59XG5cbi8qKlxuICogRXhlY3V0ZSBhIGZ1bmN0aW9uIHdoaWxlIHByZXZlbnRpbmcgdGhhdCBmdW5jdGlvbiBmcm9tXG4gKiB0cmlnZ2VyaW5nIHVwZGF0ZXMgb24gdGhpcyBkaXJlY3RpdmUgaW5zdGFuY2UuXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqL1xuXG5wLl93aXRoTG9jayA9IGZ1bmN0aW9uIChmbikge1xuICB2YXIgc2VsZiA9IHRoaXNcbiAgc2VsZi5fbG9ja2VkID0gdHJ1ZVxuICBmbi5jYWxsKHNlbGYpXG4gIF8ubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgIHNlbGYuX2xvY2tlZCA9IGZhbHNlXG4gIH0pXG59XG5cbm1vZHVsZS5leHBvcnRzID0gRGlyZWN0aXZlIiwiLy8geGxpbmtcbnZhciB4bGlua05TID0gJ2h0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsnXG52YXIgeGxpbmtSRSA9IC9eeGxpbms6L1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuICBwcmlvcml0eTogODUwLFxuXG4gIGJpbmQ6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbmFtZSA9IHRoaXMuYXJnXG4gICAgdGhpcy51cGRhdGUgPSB4bGlua1JFLnRlc3QobmFtZSlcbiAgICAgID8geGxpbmtIYW5kbGVyXG4gICAgICA6IGRlZmF1bHRIYW5kbGVyXG4gIH1cblxufVxuXG5mdW5jdGlvbiBkZWZhdWx0SGFuZGxlciAodmFsdWUpIHtcbiAgaWYgKHZhbHVlIHx8IHZhbHVlID09PSAwKSB7XG4gICAgdGhpcy5lbC5zZXRBdHRyaWJ1dGUodGhpcy5hcmcsIHZhbHVlKVxuICB9IGVsc2Uge1xuICAgIHRoaXMuZWwucmVtb3ZlQXR0cmlidXRlKHRoaXMuYXJnKVxuICB9XG59XG5cbmZ1bmN0aW9uIHhsaW5rSGFuZGxlciAodmFsdWUpIHtcbiAgaWYgKHZhbHVlICE9IG51bGwpIHtcbiAgICB0aGlzLmVsLnNldEF0dHJpYnV0ZU5TKHhsaW5rTlMsIHRoaXMuYXJnLCB2YWx1ZSlcbiAgfSBlbHNlIHtcbiAgICB0aGlzLmVsLnJlbW92ZUF0dHJpYnV0ZU5TKHhsaW5rTlMsICdocmVmJylcbiAgfVxufSIsInZhciBfID0gcmVxdWlyZSgnLi4vdXRpbCcpXG52YXIgYWRkQ2xhc3MgPSBfLmFkZENsYXNzXG52YXIgcmVtb3ZlQ2xhc3MgPSBfLnJlbW92ZUNsYXNzXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBcbiAgdXBkYXRlOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICBpZiAodGhpcy5hcmcpIHtcbiAgICAgIC8vIHNpbmdsZSB0b2dnbGVcbiAgICAgIHZhciBtZXRob2QgPSB2YWx1ZSA/IGFkZENsYXNzIDogcmVtb3ZlQ2xhc3NcbiAgICAgIG1ldGhvZCh0aGlzLmVsLCB0aGlzLmFyZylcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5jbGVhbnVwKClcbiAgICAgIGlmICh2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIC8vIHJhdyBDU1NUZXh0XG4gICAgICAgIGFkZENsYXNzKHRoaXMuZWwsIHZhbHVlKVxuICAgICAgICB0aGlzLmxhc3RWYWwgPSB2YWx1ZVxuICAgICAgfSBlbHNlIGlmIChfLmlzUGxhaW5PYmplY3QodmFsdWUpKSB7XG4gICAgICAgIC8vIG9iamVjdCB0b2dnbGVcbiAgICAgICAgZm9yICh2YXIga2V5IGluIHZhbHVlKSB7XG4gICAgICAgICAgaWYgKHZhbHVlW2tleV0pIHtcbiAgICAgICAgICAgIGFkZENsYXNzKHRoaXMuZWwsIGtleSlcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVtb3ZlQ2xhc3ModGhpcy5lbCwga2V5KVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLnByZXZLZXlzID0gT2JqZWN0LmtleXModmFsdWUpXG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIGNsZWFudXA6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIGlmICh0aGlzLmxhc3RWYWwpIHtcbiAgICAgIHJlbW92ZUNsYXNzKHRoaXMuZWwsIHRoaXMubGFzdFZhbClcbiAgICB9XG4gICAgaWYgKHRoaXMucHJldktleXMpIHtcbiAgICAgIHZhciBpID0gdGhpcy5wcmV2S2V5cy5sZW5ndGhcbiAgICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgaWYgKCF2YWx1ZSB8fCAhdmFsdWVbdGhpcy5wcmV2S2V5c1tpXV0pIHtcbiAgICAgICAgICByZW1vdmVDbGFzcyh0aGlzLmVsLCB0aGlzLnByZXZLZXlzW2ldKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59IiwidmFyIGNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZycpXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXG4gIGJpbmQ6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZWwgPSB0aGlzLmVsXG4gICAgdGhpcy52bS4kb25jZSgnaG9vazpjb21waWxlZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGVsLnJlbW92ZUF0dHJpYnV0ZShjb25maWcucHJlZml4ICsgJ2Nsb2FrJylcbiAgICB9KVxuICB9XG5cbn0iLCJ2YXIgXyA9IHJlcXVpcmUoJy4uL3V0aWwnKVxudmFyIHRlbXBsYXRlUGFyc2VyID0gcmVxdWlyZSgnLi4vcGFyc2Vycy90ZW1wbGF0ZScpXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXG4gIGlzTGl0ZXJhbDogdHJ1ZSxcblxuICAvKipcbiAgICogU2V0dXAuIFR3byBwb3NzaWJsZSB1c2FnZXM6XG4gICAqXG4gICAqIC0gc3RhdGljOlxuICAgKiAgIHYtY29tcG9uZW50PVwiY29tcFwiXG4gICAqXG4gICAqIC0gZHluYW1pYzpcbiAgICogICB2LWNvbXBvbmVudD1cInt7Y3VycmVudFZpZXd9fVwiXG4gICAqL1xuXG4gIGJpbmQ6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMuZWwuX192dWVfXykge1xuICAgICAgLy8gY3JlYXRlIGEgcmVmIGFuY2hvclxuICAgICAgdGhpcy5hbmNob3IgPSBfLmNyZWF0ZUFuY2hvcigndi1jb21wb25lbnQnKVxuICAgICAgXy5yZXBsYWNlKHRoaXMuZWwsIHRoaXMuYW5jaG9yKVxuICAgICAgLy8gY2hlY2sga2VlcC1hbGl2ZSBvcHRpb25zLlxuICAgICAgLy8gSWYgeWVzLCBpbnN0ZWFkIG9mIGRlc3Ryb3lpbmcgdGhlIGFjdGl2ZSB2bSB3aGVuXG4gICAgICAvLyBoaWRpbmcgKHYtaWYpIG9yIHN3aXRjaGluZyAoZHluYW1pYyBsaXRlcmFsKSBpdCxcbiAgICAgIC8vIHdlIHNpbXBseSByZW1vdmUgaXQgZnJvbSB0aGUgRE9NIGFuZCBzYXZlIGl0IGluIGFcbiAgICAgIC8vIGNhY2hlIG9iamVjdCwgd2l0aCBpdHMgY29uc3RydWN0b3IgaWQgYXMgdGhlIGtleS5cbiAgICAgIHRoaXMua2VlcEFsaXZlID0gdGhpcy5fY2hlY2tQYXJhbSgna2VlcC1hbGl2ZScpICE9IG51bGxcbiAgICAgIC8vIGNoZWNrIHJlZlxuICAgICAgdGhpcy5yZWZJRCA9IF8uYXR0cih0aGlzLmVsLCAncmVmJylcbiAgICAgIGlmICh0aGlzLmtlZXBBbGl2ZSkge1xuICAgICAgICB0aGlzLmNhY2hlID0ge31cbiAgICAgIH1cbiAgICAgIC8vIGNoZWNrIGlubGluZS10ZW1wbGF0ZVxuICAgICAgaWYgKHRoaXMuX2NoZWNrUGFyYW0oJ2lubGluZS10ZW1wbGF0ZScpICE9PSBudWxsKSB7XG4gICAgICAgIC8vIGV4dHJhY3QgaW5saW5lIHRlbXBsYXRlIGFzIGEgRG9jdW1lbnRGcmFnbWVudFxuICAgICAgICB0aGlzLnRlbXBsYXRlID0gXy5leHRyYWN0Q29udGVudCh0aGlzLmVsLCB0cnVlKVxuICAgICAgfVxuICAgICAgLy8gY29tcG9uZW50IHJlc29sdXRpb24gcmVsYXRlZCBzdGF0ZVxuICAgICAgdGhpcy5fcGVuZGluZ0NiID1cbiAgICAgIHRoaXMuY3RvcklkID1cbiAgICAgIHRoaXMuQ3RvciA9IG51bGxcbiAgICAgIC8vIGlmIHN0YXRpYywgYnVpbGQgcmlnaHQgbm93LlxuICAgICAgaWYgKCF0aGlzLl9pc0R5bmFtaWNMaXRlcmFsKSB7XG4gICAgICAgIHRoaXMucmVzb2x2ZUN0b3IodGhpcy5leHByZXNzaW9uLCBfLmJpbmQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHZhciBjaGlsZCA9IHRoaXMuYnVpbGQoKVxuICAgICAgICAgIGNoaWxkLiRiZWZvcmUodGhpcy5hbmNob3IpXG4gICAgICAgICAgdGhpcy5zZXRDdXJyZW50KGNoaWxkKVxuICAgICAgICB9LCB0aGlzKSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGNoZWNrIGR5bmFtaWMgY29tcG9uZW50IHBhcmFtc1xuICAgICAgICB0aGlzLnJlYWR5RXZlbnQgPSB0aGlzLl9jaGVja1BhcmFtKCd3YWl0LWZvcicpXG4gICAgICAgIHRoaXMudHJhbnNNb2RlID0gdGhpcy5fY2hlY2tQYXJhbSgndHJhbnNpdGlvbi1tb2RlJylcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgXy53YXJuKFxuICAgICAgICAndi1jb21wb25lbnQ9XCInICsgdGhpcy5leHByZXNzaW9uICsgJ1wiIGNhbm5vdCBiZSAnICtcbiAgICAgICAgJ3VzZWQgb24gYW4gYWxyZWFkeSBtb3VudGVkIGluc3RhbmNlLidcbiAgICAgIClcbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIFB1YmxpYyB1cGRhdGUsIGNhbGxlZCBieSB0aGUgd2F0Y2hlciBpbiB0aGUgZHluYW1pY1xuICAgKiBsaXRlcmFsIHNjZW5hcmlvLCBlLmcuIHYtY29tcG9uZW50PVwie3t2aWV3fX1cIlxuICAgKi9cblxuICB1cGRhdGU6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHRoaXMucmVhbFVwZGF0ZSh2YWx1ZSlcbiAgfSxcblxuICAvKipcbiAgICogU3dpdGNoIGR5bmFtaWMgY29tcG9uZW50cy4gTWF5IHJlc29sdmUgdGhlIGNvbXBvbmVudFxuICAgKiBhc3luY2hyb25vdXNseSwgYW5kIHBlcmZvcm0gdHJhbnNpdGlvbiBiYXNlZCBvblxuICAgKiBzcGVjaWZpZWQgdHJhbnNpdGlvbiBtb2RlLiBBY2NlcHRzIGFuIGFzeW5jIGNhbGxiYWNrXG4gICAqIHdoaWNoIGlzIGNhbGxlZCB3aGVuIHRoZSB0cmFuc2l0aW9uIGVuZHMuIChUaGlzIGlzXG4gICAqIGV4cG9zZWQgZm9yIHZ1ZS1yb3V0ZXIpXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSB2YWx1ZVxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY2JdXG4gICAqL1xuXG4gIHJlYWxVcGRhdGU6IGZ1bmN0aW9uICh2YWx1ZSwgY2IpIHtcbiAgICB0aGlzLmludmFsaWRhdGVQZW5kaW5nKClcbiAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAvLyBqdXN0IHJlbW92ZSBjdXJyZW50XG4gICAgICB0aGlzLnVuYnVpbGQoKVxuICAgICAgdGhpcy5yZW1vdmUodGhpcy5jaGlsZFZNLCBjYilcbiAgICAgIHRoaXMudW5zZXRDdXJyZW50KClcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5yZXNvbHZlQ3Rvcih2YWx1ZSwgXy5iaW5kKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy51bmJ1aWxkKClcbiAgICAgICAgdmFyIG5ld0NvbXBvbmVudCA9IHRoaXMuYnVpbGQoKVxuICAgICAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICAgICAgaWYgKHRoaXMucmVhZHlFdmVudCkge1xuICAgICAgICAgIG5ld0NvbXBvbmVudC4kb25jZSh0aGlzLnJlYWR5RXZlbnQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlbGYuc3dhcFRvKG5ld0NvbXBvbmVudCwgY2IpXG4gICAgICAgICAgfSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLnN3YXBUbyhuZXdDb21wb25lbnQsIGNiKVxuICAgICAgICB9XG4gICAgICB9LCB0aGlzKSlcbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIFJlc29sdmUgdGhlIGNvbXBvbmVudCBjb25zdHJ1Y3RvciB0byB1c2Ugd2hlbiBjcmVhdGluZ1xuICAgKiB0aGUgY2hpbGQgdm0uXG4gICAqL1xuXG4gIHJlc29sdmVDdG9yOiBmdW5jdGlvbiAoaWQsIGNiKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgdGhpcy5fcGVuZGluZ0NiID0gXy5jYW5jZWxsYWJsZShmdW5jdGlvbiAoY3Rvcikge1xuICAgICAgc2VsZi5jdG9ySWQgPSBpZFxuICAgICAgc2VsZi5DdG9yID0gY3RvclxuICAgICAgY2IoKVxuICAgIH0pXG4gICAgdGhpcy52bS5fcmVzb2x2ZUNvbXBvbmVudChpZCwgdGhpcy5fcGVuZGluZ0NiKVxuICB9LFxuXG4gIC8qKlxuICAgKiBXaGVuIHRoZSBjb21wb25lbnQgY2hhbmdlcyBvciB1bmJpbmRzIGJlZm9yZSBhbiBhc3luY1xuICAgKiBjb25zdHJ1Y3RvciBpcyByZXNvbHZlZCwgd2UgbmVlZCB0byBpbnZhbGlkYXRlIGl0c1xuICAgKiBwZW5kaW5nIGNhbGxiYWNrLlxuICAgKi9cblxuICBpbnZhbGlkYXRlUGVuZGluZzogZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLl9wZW5kaW5nQ2IpIHtcbiAgICAgIHRoaXMuX3BlbmRpbmdDYi5jYW5jZWwoKVxuICAgICAgdGhpcy5fcGVuZGluZ0NiID0gbnVsbFxuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogSW5zdGFudGlhdGUvaW5zZXJ0IGEgbmV3IGNoaWxkIHZtLlxuICAgKiBJZiBrZWVwIGFsaXZlIGFuZCBoYXMgY2FjaGVkIGluc3RhbmNlLCBpbnNlcnQgdGhhdFxuICAgKiBpbnN0YW5jZTsgb3RoZXJ3aXNlIGJ1aWxkIGEgbmV3IG9uZSBhbmQgY2FjaGUgaXQuXG4gICAqXG4gICAqIEByZXR1cm4ge1Z1ZX0gLSB0aGUgY3JlYXRlZCBpbnN0YW5jZVxuICAgKi9cblxuICBidWlsZDogZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLmtlZXBBbGl2ZSkge1xuICAgICAgdmFyIGNhY2hlZCA9IHRoaXMuY2FjaGVbdGhpcy5jdG9ySWRdXG4gICAgICBpZiAoY2FjaGVkKSB7XG4gICAgICAgIHJldHVybiBjYWNoZWRcbiAgICAgIH1cbiAgICB9XG4gICAgdmFyIHZtID0gdGhpcy52bVxuICAgIHZhciBlbCA9IHRlbXBsYXRlUGFyc2VyLmNsb25lKHRoaXMuZWwpXG4gICAgaWYgKHRoaXMuQ3Rvcikge1xuICAgICAgdmFyIGNoaWxkID0gdm0uJGFkZENoaWxkKHtcbiAgICAgICAgZWw6IGVsLFxuICAgICAgICB0ZW1wbGF0ZTogdGhpcy50ZW1wbGF0ZSxcbiAgICAgICAgX2FzQ29tcG9uZW50OiB0cnVlLFxuICAgICAgICBfaG9zdDogdGhpcy5faG9zdFxuICAgICAgfSwgdGhpcy5DdG9yKVxuICAgICAgaWYgKHRoaXMua2VlcEFsaXZlKSB7XG4gICAgICAgIHRoaXMuY2FjaGVbdGhpcy5jdG9ySWRdID0gY2hpbGRcbiAgICAgIH1cbiAgICAgIHJldHVybiBjaGlsZFxuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogVGVhcmRvd24gdGhlIGN1cnJlbnQgY2hpbGQsIGJ1dCBkZWZlcnMgY2xlYW51cCBzb1xuICAgKiB0aGF0IHdlIGNhbiBzZXBhcmF0ZSB0aGUgZGVzdHJveSBhbmQgcmVtb3ZhbCBzdGVwcy5cbiAgICovXG5cbiAgdW5idWlsZDogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjaGlsZCA9IHRoaXMuY2hpbGRWTVxuICAgIGlmICghY2hpbGQgfHwgdGhpcy5rZWVwQWxpdmUpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICAvLyB0aGUgc29sZSBwdXJwb3NlIG9mIGBkZWZlckNsZWFudXBgIGlzIHNvIHRoYXQgd2UgY2FuXG4gICAgLy8gXCJkZWFjdGl2YXRlXCIgdGhlIHZtIHJpZ2h0IG5vdyBhbmQgcGVyZm9ybSBET00gcmVtb3ZhbFxuICAgIC8vIGxhdGVyLlxuICAgIGNoaWxkLiRkZXN0cm95KGZhbHNlLCB0cnVlKVxuICB9LFxuXG4gIC8qKlxuICAgKiBSZW1vdmUgY3VycmVudCBkZXN0cm95ZWQgY2hpbGQgYW5kIG1hbnVhbGx5IGRvXG4gICAqIHRoZSBjbGVhbnVwIGFmdGVyIHJlbW92YWwuXG4gICAqXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNiXG4gICAqL1xuXG4gIHJlbW92ZTogZnVuY3Rpb24gKGNoaWxkLCBjYikge1xuICAgIHZhciBrZWVwQWxpdmUgPSB0aGlzLmtlZXBBbGl2ZVxuICAgIGlmIChjaGlsZCkge1xuICAgICAgY2hpbGQuJHJlbW92ZShmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICgha2VlcEFsaXZlKSBjaGlsZC5fY2xlYW51cCgpXG4gICAgICAgIGlmIChjYikgY2IoKVxuICAgICAgfSlcbiAgICB9IGVsc2UgaWYgKGNiKSB7XG4gICAgICBjYigpXG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBBY3R1YWxseSBzd2FwIHRoZSBjb21wb25lbnRzLCBkZXBlbmRpbmcgb24gdGhlXG4gICAqIHRyYW5zaXRpb24gbW9kZS4gRGVmYXVsdHMgdG8gc2ltdWx0YW5lb3VzLlxuICAgKlxuICAgKiBAcGFyYW0ge1Z1ZX0gdGFyZ2V0XG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IFtjYl1cbiAgICovXG5cbiAgc3dhcFRvOiBmdW5jdGlvbiAodGFyZ2V0LCBjYikge1xuICAgIHZhciBzZWxmID0gdGhpc1xuICAgIHZhciBjdXJyZW50ID0gdGhpcy5jaGlsZFZNXG4gICAgdGhpcy51bnNldEN1cnJlbnQoKVxuICAgIHRoaXMuc2V0Q3VycmVudCh0YXJnZXQpXG4gICAgc3dpdGNoIChzZWxmLnRyYW5zTW9kZSkge1xuICAgICAgY2FzZSAnaW4tb3V0JzpcbiAgICAgICAgdGFyZ2V0LiRiZWZvcmUoc2VsZi5hbmNob3IsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBzZWxmLnJlbW92ZShjdXJyZW50LCBjYilcbiAgICAgICAgfSlcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJ291dC1pbic6XG4gICAgICAgIHNlbGYucmVtb3ZlKGN1cnJlbnQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICB0YXJnZXQuJGJlZm9yZShzZWxmLmFuY2hvciwgY2IpXG4gICAgICAgIH0pXG4gICAgICAgIGJyZWFrXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBzZWxmLnJlbW92ZShjdXJyZW50KVxuICAgICAgICB0YXJnZXQuJGJlZm9yZShzZWxmLmFuY2hvciwgY2IpXG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBTZXQgY2hpbGRWTSBhbmQgcGFyZW50IHJlZlxuICAgKi9cbiAgXG4gIHNldEN1cnJlbnQ6IGZ1bmN0aW9uIChjaGlsZCkge1xuICAgIHRoaXMuY2hpbGRWTSA9IGNoaWxkXG4gICAgdmFyIHJlZklEID0gY2hpbGQuX3JlZklEIHx8IHRoaXMucmVmSURcbiAgICBpZiAocmVmSUQpIHtcbiAgICAgIHRoaXMudm0uJFtyZWZJRF0gPSBjaGlsZFxuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogVW5zZXQgY2hpbGRWTSBhbmQgcGFyZW50IHJlZlxuICAgKi9cblxuICB1bnNldEN1cnJlbnQ6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2hpbGQgPSB0aGlzLmNoaWxkVk1cbiAgICB0aGlzLmNoaWxkVk0gPSBudWxsXG4gICAgdmFyIHJlZklEID0gKGNoaWxkICYmIGNoaWxkLl9yZWZJRCkgfHwgdGhpcy5yZWZJRFxuICAgIGlmIChyZWZJRCkge1xuICAgICAgdGhpcy52bS4kW3JlZklEXSA9IG51bGxcbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIFVuYmluZC5cbiAgICovXG5cbiAgdW5iaW5kOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5pbnZhbGlkYXRlUGVuZGluZygpXG4gICAgdGhpcy51bmJ1aWxkKClcbiAgICAvLyBkZXN0cm95IGFsbCBrZWVwLWFsaXZlIGNhY2hlZCBpbnN0YW5jZXNcbiAgICBpZiAodGhpcy5jYWNoZSkge1xuICAgICAgZm9yICh2YXIga2V5IGluIHRoaXMuY2FjaGUpIHtcbiAgICAgICAgdGhpcy5jYWNoZVtrZXldLiRkZXN0cm95KClcbiAgICAgIH1cbiAgICAgIHRoaXMuY2FjaGUgPSBudWxsXG4gICAgfVxuICB9XG5cbn0iLCJtb2R1bGUuZXhwb3J0cyA9IHtcblxuICBpc0xpdGVyYWw6IHRydWUsXG5cbiAgYmluZDogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMudm0uJCRbdGhpcy5leHByZXNzaW9uXSA9IHRoaXMuZWxcbiAgfSxcblxuICB1bmJpbmQ6IGZ1bmN0aW9uICgpIHtcbiAgICBkZWxldGUgdGhpcy52bS4kJFt0aGlzLmV4cHJlc3Npb25dXG4gIH1cbiAgXG59IiwidmFyIF8gPSByZXF1aXJlKCcuLi91dGlsJylcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cbiAgYWNjZXB0U3RhdGVtZW50OiB0cnVlLFxuXG4gIGJpbmQ6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2hpbGQgPSB0aGlzLmVsLl9fdnVlX19cbiAgICBpZiAoIWNoaWxkIHx8IHRoaXMudm0gIT09IGNoaWxkLiRwYXJlbnQpIHtcbiAgICAgIF8ud2FybihcbiAgICAgICAgJ2B2LWV2ZW50c2Agc2hvdWxkIG9ubHkgYmUgdXNlZCBvbiBhIGNoaWxkIGNvbXBvbmVudCAnICtcbiAgICAgICAgJ2Zyb20gdGhlIHBhcmVudCB0ZW1wbGF0ZS4nXG4gICAgICApXG4gICAgICByZXR1cm5cbiAgICB9XG4gIH0sXG5cbiAgdXBkYXRlOiBmdW5jdGlvbiAoaGFuZGxlciwgb2xkSGFuZGxlcikge1xuICAgIGlmICh0eXBlb2YgaGFuZGxlciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgXy53YXJuKFxuICAgICAgICAnRGlyZWN0aXZlIFwidi1ldmVudHM6JyArIHRoaXMuZXhwcmVzc2lvbiArICdcIiAnICtcbiAgICAgICAgJ2V4cGVjdHMgYSBmdW5jdGlvbiB2YWx1ZS4nXG4gICAgICApXG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgdmFyIGNoaWxkID0gdGhpcy5lbC5fX3Z1ZV9fXG4gICAgaWYgKG9sZEhhbmRsZXIpIHtcbiAgICAgIGNoaWxkLiRvZmYodGhpcy5hcmcsIG9sZEhhbmRsZXIpXG4gICAgfVxuICAgIGNoaWxkLiRvbih0aGlzLmFyZywgaGFuZGxlcilcbiAgfVxuXG4gIC8vIHdoZW4gY2hpbGQgaXMgZGVzdHJveWVkLCBhbGwgZXZlbnRzIGFyZSB0dXJuZWQgb2ZmLFxuICAvLyBzbyBubyBuZWVkIGZvciB1bmJpbmQgaGVyZS5cblxufSIsInZhciBfID0gcmVxdWlyZSgnLi4vdXRpbCcpXG52YXIgdGVtcGxhdGVQYXJzZXIgPSByZXF1aXJlKCcuLi9wYXJzZXJzL3RlbXBsYXRlJylcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cbiAgYmluZDogZnVuY3Rpb24gKCkge1xuICAgIC8vIGEgY29tbWVudCBub2RlIG1lYW5zIHRoaXMgaXMgYSBiaW5kaW5nIGZvclxuICAgIC8vIHt7eyBpbmxpbmUgdW5lc2NhcGVkIGh0bWwgfX19XG4gICAgaWYgKHRoaXMuZWwubm9kZVR5cGUgPT09IDgpIHtcbiAgICAgIC8vIGhvbGQgbm9kZXNcbiAgICAgIHRoaXMubm9kZXMgPSBbXVxuICAgICAgLy8gcmVwbGFjZSB0aGUgcGxhY2Vob2xkZXIgd2l0aCBwcm9wZXIgYW5jaG9yXG4gICAgICB0aGlzLmFuY2hvciA9IF8uY3JlYXRlQW5jaG9yKCd2LWh0bWwnKVxuICAgICAgXy5yZXBsYWNlKHRoaXMuZWwsIHRoaXMuYW5jaG9yKVxuICAgIH1cbiAgfSxcblxuICB1cGRhdGU6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHZhbHVlID0gXy50b1N0cmluZyh2YWx1ZSlcbiAgICBpZiAodGhpcy5ub2Rlcykge1xuICAgICAgdGhpcy5zd2FwKHZhbHVlKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmVsLmlubmVySFRNTCA9IHZhbHVlXG4gICAgfVxuICB9LFxuXG4gIHN3YXA6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIC8vIHJlbW92ZSBvbGQgbm9kZXNcbiAgICB2YXIgaSA9IHRoaXMubm9kZXMubGVuZ3RoXG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgXy5yZW1vdmUodGhpcy5ub2Rlc1tpXSlcbiAgICB9XG4gICAgLy8gY29udmVydCBuZXcgdmFsdWUgdG8gYSBmcmFnbWVudFxuICAgIC8vIGRvIG5vdCBhdHRlbXB0IHRvIHJldHJpZXZlIGZyb20gaWQgc2VsZWN0b3JcbiAgICB2YXIgZnJhZyA9IHRlbXBsYXRlUGFyc2VyLnBhcnNlKHZhbHVlLCB0cnVlLCB0cnVlKVxuICAgIC8vIHNhdmUgYSByZWZlcmVuY2UgdG8gdGhlc2Ugbm9kZXMgc28gd2UgY2FuIHJlbW92ZSBsYXRlclxuICAgIHRoaXMubm9kZXMgPSBfLnRvQXJyYXkoZnJhZy5jaGlsZE5vZGVzKVxuICAgIF8uYmVmb3JlKGZyYWcsIHRoaXMuYW5jaG9yKVxuICB9XG5cbn0iLCJ2YXIgXyA9IHJlcXVpcmUoJy4uL3V0aWwnKVxudmFyIGNvbXBpbGUgPSByZXF1aXJlKCcuLi9jb21waWxlci9jb21waWxlJylcbnZhciB0ZW1wbGF0ZVBhcnNlciA9IHJlcXVpcmUoJy4uL3BhcnNlcnMvdGVtcGxhdGUnKVxudmFyIHRyYW5zaXRpb24gPSByZXF1aXJlKCcuLi90cmFuc2l0aW9uJylcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cbiAgYmluZDogZnVuY3Rpb24gKCkge1xuICAgIHZhciBlbCA9IHRoaXMuZWxcbiAgICBpZiAoIWVsLl9fdnVlX18pIHtcbiAgICAgIHRoaXMuc3RhcnQgPSBfLmNyZWF0ZUFuY2hvcigndi1pZi1zdGFydCcpXG4gICAgICB0aGlzLmVuZCA9IF8uY3JlYXRlQW5jaG9yKCd2LWlmLWVuZCcpXG4gICAgICBfLnJlcGxhY2UoZWwsIHRoaXMuZW5kKVxuICAgICAgXy5iZWZvcmUodGhpcy5zdGFydCwgdGhpcy5lbmQpXG4gICAgICBpZiAoZWwudGFnTmFtZSA9PT0gJ1RFTVBMQVRFJykge1xuICAgICAgICB0aGlzLnRlbXBsYXRlID0gdGVtcGxhdGVQYXJzZXIucGFyc2UoZWwsIHRydWUpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnRlbXBsYXRlID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpXG4gICAgICAgIHRoaXMudGVtcGxhdGUuYXBwZW5kQ2hpbGQodGVtcGxhdGVQYXJzZXIuY2xvbmUoZWwpKVxuICAgICAgfVxuICAgICAgLy8gY29tcGlsZSB0aGUgbmVzdGVkIHBhcnRpYWxcbiAgICAgIHRoaXMubGlua2VyID0gY29tcGlsZShcbiAgICAgICAgdGhpcy50ZW1wbGF0ZSxcbiAgICAgICAgdGhpcy52bS4kb3B0aW9ucyxcbiAgICAgICAgdHJ1ZVxuICAgICAgKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmludmFsaWQgPSB0cnVlXG4gICAgICBfLndhcm4oXG4gICAgICAgICd2LWlmPVwiJyArIHRoaXMuZXhwcmVzc2lvbiArICdcIiBjYW5ub3QgYmUgJyArXG4gICAgICAgICd1c2VkIG9uIGFuIGFscmVhZHkgbW91bnRlZCBpbnN0YW5jZS4nXG4gICAgICApXG4gICAgfVxuICB9LFxuXG4gIHVwZGF0ZTogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgaWYgKHRoaXMuaW52YWxpZCkgcmV0dXJuXG4gICAgaWYgKHZhbHVlKSB7XG4gICAgICAvLyBhdm9pZCBkdXBsaWNhdGUgY29tcGlsZXMsIHNpbmNlIHVwZGF0ZSgpIGNhbiBiZVxuICAgICAgLy8gY2FsbGVkIHdpdGggZGlmZmVyZW50IHRydXRoeSB2YWx1ZXNcbiAgICAgIGlmICghdGhpcy51bmxpbmspIHtcbiAgICAgICAgdGhpcy5jb21waWxlKClcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy50ZWFyZG93bigpXG4gICAgfVxuICB9LFxuXG4gIGNvbXBpbGU6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgdm0gPSB0aGlzLnZtXG4gICAgdmFyIGZyYWcgPSB0ZW1wbGF0ZVBhcnNlci5jbG9uZSh0aGlzLnRlbXBsYXRlKVxuICAgIC8vIHRoZSBsaW5rZXIgaXMgbm90IGd1YXJhbnRlZWQgdG8gYmUgcHJlc2VudCBiZWNhdXNlXG4gICAgLy8gdGhpcyBmdW5jdGlvbiBtaWdodCBnZXQgY2FsbGVkIGJ5IHYtcGFydGlhbCBcbiAgICB0aGlzLnVubGluayA9IHRoaXMubGlua2VyKHZtLCBmcmFnKVxuICAgIHRyYW5zaXRpb24uYmxvY2tBcHBlbmQoZnJhZywgdGhpcy5lbmQsIHZtKVxuICAgIC8vIGNhbGwgYXR0YWNoZWQgZm9yIGFsbCB0aGUgY2hpbGQgY29tcG9uZW50cyBjcmVhdGVkXG4gICAgLy8gZHVyaW5nIHRoZSBjb21waWxhdGlvblxuICAgIGlmIChfLmluRG9jKHZtLiRlbCkpIHtcbiAgICAgIHZhciBjaGlsZHJlbiA9IHRoaXMuZ2V0Q29udGFpbmVkQ29tcG9uZW50cygpXG4gICAgICBpZiAoY2hpbGRyZW4pIGNoaWxkcmVuLmZvckVhY2goY2FsbEF0dGFjaClcbiAgICB9XG4gIH0sXG5cbiAgdGVhcmRvd246IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMudW5saW5rKSByZXR1cm5cbiAgICAvLyBjb2xsZWN0IGNoaWxkcmVuIGJlZm9yZWhhbmRcbiAgICB2YXIgY2hpbGRyZW5cbiAgICBpZiAoXy5pbkRvYyh0aGlzLnZtLiRlbCkpIHtcbiAgICAgIGNoaWxkcmVuID0gdGhpcy5nZXRDb250YWluZWRDb21wb25lbnRzKClcbiAgICB9XG4gICAgdHJhbnNpdGlvbi5ibG9ja1JlbW92ZSh0aGlzLnN0YXJ0LCB0aGlzLmVuZCwgdGhpcy52bSlcbiAgICBpZiAoY2hpbGRyZW4pIGNoaWxkcmVuLmZvckVhY2goY2FsbERldGFjaClcbiAgICB0aGlzLnVubGluaygpXG4gICAgdGhpcy51bmxpbmsgPSBudWxsXG4gIH0sXG5cbiAgZ2V0Q29udGFpbmVkQ29tcG9uZW50czogZnVuY3Rpb24gKCkge1xuICAgIHZhciB2bSA9IHRoaXMudm1cbiAgICB2YXIgc3RhcnQgPSB0aGlzLnN0YXJ0Lm5leHRTaWJsaW5nXG4gICAgdmFyIGVuZCA9IHRoaXMuZW5kXG4gICAgdmFyIHNlbGZDb21wb2VudHMgPVxuICAgICAgdm0uX2NoaWxkcmVuLmxlbmd0aCAmJlxuICAgICAgdm0uX2NoaWxkcmVuLmZpbHRlcihjb250YWlucylcbiAgICB2YXIgdHJhbnNDb21wb25lbnRzID1cbiAgICAgIHZtLl90cmFuc0NwbnRzICYmXG4gICAgICB2bS5fdHJhbnNDcG50cy5maWx0ZXIoY29udGFpbnMpXG5cbiAgICBmdW5jdGlvbiBjb250YWlucyAoYykge1xuICAgICAgdmFyIGN1ciA9IHN0YXJ0XG4gICAgICB2YXIgbmV4dFxuICAgICAgd2hpbGUgKG5leHQgIT09IGVuZCkge1xuICAgICAgICBuZXh0ID0gY3VyLm5leHRTaWJsaW5nXG4gICAgICAgIGlmIChjdXIuY29udGFpbnMoYy4kZWwpKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgfVxuICAgICAgICBjdXIgPSBuZXh0XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICByZXR1cm4gc2VsZkNvbXBvZW50c1xuICAgICAgPyB0cmFuc0NvbXBvbmVudHNcbiAgICAgICAgPyBzZWxmQ29tcG9lbnRzLmNvbmNhdCh0cmFuc0NvbXBvbmVudHMpXG4gICAgICAgIDogc2VsZkNvbXBvZW50c1xuICAgICAgOiB0cmFuc0NvbXBvbmVudHNcbiAgfSxcblxuICB1bmJpbmQ6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy51bmxpbmspIHRoaXMudW5saW5rKClcbiAgfVxuXG59XG5cbmZ1bmN0aW9uIGNhbGxBdHRhY2ggKGNoaWxkKSB7XG4gIGlmICghY2hpbGQuX2lzQXR0YWNoZWQpIHtcbiAgICBjaGlsZC5fY2FsbEhvb2soJ2F0dGFjaGVkJylcbiAgfVxufVxuXG5mdW5jdGlvbiBjYWxsRGV0YWNoIChjaGlsZCkge1xuICBpZiAoY2hpbGQuX2lzQXR0YWNoZWQpIHtcbiAgICBjaGlsZC5fY2FsbEhvb2soJ2RldGFjaGVkJylcbiAgfVxufSIsIi8vIG1hbmlwdWxhdGlvbiBkaXJlY3RpdmVzXG5leHBvcnRzLnRleHQgICAgICAgPSByZXF1aXJlKCcuL3RleHQnKVxuZXhwb3J0cy5odG1sICAgICAgID0gcmVxdWlyZSgnLi9odG1sJylcbmV4cG9ydHMuYXR0ciAgICAgICA9IHJlcXVpcmUoJy4vYXR0cicpXG5leHBvcnRzLnNob3cgICAgICAgPSByZXF1aXJlKCcuL3Nob3cnKVxuZXhwb3J0c1snY2xhc3MnXSAgID0gcmVxdWlyZSgnLi9jbGFzcycpXG5leHBvcnRzLmVsICAgICAgICAgPSByZXF1aXJlKCcuL2VsJylcbmV4cG9ydHMucmVmICAgICAgICA9IHJlcXVpcmUoJy4vcmVmJylcbmV4cG9ydHMuY2xvYWsgICAgICA9IHJlcXVpcmUoJy4vY2xvYWsnKVxuZXhwb3J0cy5zdHlsZSAgICAgID0gcmVxdWlyZSgnLi9zdHlsZScpXG5leHBvcnRzLnRyYW5zaXRpb24gPSByZXF1aXJlKCcuL3RyYW5zaXRpb24nKVxuXG4vLyBldmVudCBsaXN0ZW5lciBkaXJlY3RpdmVzXG5leHBvcnRzLm9uICAgICAgICAgPSByZXF1aXJlKCcuL29uJylcbmV4cG9ydHMubW9kZWwgICAgICA9IHJlcXVpcmUoJy4vbW9kZWwnKVxuXG4vLyBsb2dpYyBjb250cm9sIGRpcmVjdGl2ZXNcbmV4cG9ydHMucmVwZWF0ICAgICA9IHJlcXVpcmUoJy4vcmVwZWF0JylcbmV4cG9ydHNbJ2lmJ10gICAgICA9IHJlcXVpcmUoJy4vaWYnKVxuXG4vLyBjaGlsZCB2bSBjb21tdW5pY2F0aW9uIGRpcmVjdGl2ZXNcbmV4cG9ydHMuZXZlbnRzICAgICA9IHJlcXVpcmUoJy4vZXZlbnRzJylcblxuLy8gaW50ZXJuYWwgZGlyZWN0aXZlcyB0aGF0IHNob3VsZCBub3QgYmUgdXNlZCBkaXJlY3RseVxuLy8gYnV0IHdlIHN0aWxsIHdhbnQgdG8gZXhwb3NlIHRoZW0gZm9yIGFkdmFuY2VkIHVzYWdlLlxuZXhwb3J0cy5fY29tcG9uZW50ID0gcmVxdWlyZSgnLi9jb21wb25lbnQnKVxuZXhwb3J0cy5fcHJvcCAgICAgID0gcmVxdWlyZSgnLi9wcm9wJykiLCJ2YXIgXyA9IHJlcXVpcmUoJy4uLy4uL3V0aWwnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuICBiaW5kOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgdmFyIGVsID0gdGhpcy5lbFxuICAgIHRoaXMubGlzdGVuZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBzZWxmLnNldChlbC5jaGVja2VkKVxuICAgIH1cbiAgICBfLm9uKGVsLCAnY2hhbmdlJywgdGhpcy5saXN0ZW5lcilcbiAgICBpZiAoZWwuY2hlY2tlZCkge1xuICAgICAgdGhpcy5faW5pdFZhbHVlID0gZWwuY2hlY2tlZFxuICAgIH1cbiAgfSxcblxuICB1cGRhdGU6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHRoaXMuZWwuY2hlY2tlZCA9ICEhdmFsdWVcbiAgfSxcblxuICB1bmJpbmQ6IGZ1bmN0aW9uICgpIHtcbiAgICBfLm9mZih0aGlzLmVsLCAnY2hhbmdlJywgdGhpcy5saXN0ZW5lcilcbiAgfVxuXG59IiwidmFyIF8gPSByZXF1aXJlKCcuLi8uLi91dGlsJylcblxudmFyIGhhbmRsZXJzID0ge1xuICB0ZXh0OiByZXF1aXJlKCcuL3RleHQnKSxcbiAgcmFkaW86IHJlcXVpcmUoJy4vcmFkaW8nKSxcbiAgc2VsZWN0OiByZXF1aXJlKCcuL3NlbGVjdCcpLFxuICBjaGVja2JveDogcmVxdWlyZSgnLi9jaGVja2JveCcpXG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXG4gIHByaW9yaXR5OiA4MDAsXG4gIHR3b1dheTogdHJ1ZSxcbiAgaGFuZGxlcnM6IGhhbmRsZXJzLFxuXG4gIC8qKlxuICAgKiBQb3NzaWJsZSBlbGVtZW50czpcbiAgICogICA8c2VsZWN0PlxuICAgKiAgIDx0ZXh0YXJlYT5cbiAgICogICA8aW5wdXQgdHlwZT1cIipcIj5cbiAgICogICAgIC0gdGV4dFxuICAgKiAgICAgLSBjaGVja2JveFxuICAgKiAgICAgLSByYWRpb1xuICAgKiAgICAgLSBudW1iZXJcbiAgICogICAgIC0gVE9ETzogbW9yZSB0eXBlcyBtYXkgYmUgc3VwcGxpZWQgYXMgYSBwbHVnaW5cbiAgICovXG5cbiAgYmluZDogZnVuY3Rpb24gKCkge1xuICAgIC8vIGZyaWVuZGx5IHdhcm5pbmcuLi5cbiAgICB0aGlzLmNoZWNrRmlsdGVycygpXG4gICAgaWYgKHRoaXMuaGFzUmVhZCAmJiAhdGhpcy5oYXNXcml0ZSkge1xuICAgICAgXy53YXJuKFxuICAgICAgICAnSXQgc2VlbXMgeW91IGFyZSB1c2luZyBhIHJlYWQtb25seSBmaWx0ZXIgd2l0aCAnICtcbiAgICAgICAgJ3YtbW9kZWwuIFlvdSBtaWdodCB3YW50IHRvIHVzZSBhIHR3by13YXkgZmlsdGVyICcgK1xuICAgICAgICAndG8gZW5zdXJlIGNvcnJlY3QgYmVoYXZpb3IuJ1xuICAgICAgKVxuICAgIH1cbiAgICB2YXIgZWwgPSB0aGlzLmVsXG4gICAgdmFyIHRhZyA9IGVsLnRhZ05hbWVcbiAgICB2YXIgaGFuZGxlclxuICAgIGlmICh0YWcgPT09ICdJTlBVVCcpIHtcbiAgICAgIGhhbmRsZXIgPSBoYW5kbGVyc1tlbC50eXBlXSB8fCBoYW5kbGVycy50ZXh0XG4gICAgfSBlbHNlIGlmICh0YWcgPT09ICdTRUxFQ1QnKSB7XG4gICAgICBoYW5kbGVyID0gaGFuZGxlcnMuc2VsZWN0XG4gICAgfSBlbHNlIGlmICh0YWcgPT09ICdURVhUQVJFQScpIHtcbiAgICAgIGhhbmRsZXIgPSBoYW5kbGVycy50ZXh0XG4gICAgfSBlbHNlIHtcbiAgICAgIF8ud2Fybigndi1tb2RlbCBkb2VzIG5vdCBzdXBwb3J0IGVsZW1lbnQgdHlwZTogJyArIHRhZylcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBoYW5kbGVyLmJpbmQuY2FsbCh0aGlzKVxuICAgIHRoaXMudXBkYXRlID0gaGFuZGxlci51cGRhdGVcbiAgICB0aGlzLnVuYmluZCA9IGhhbmRsZXIudW5iaW5kXG4gIH0sXG5cbiAgLyoqXG4gICAqIENoZWNrIHJlYWQvd3JpdGUgZmlsdGVyIHN0YXRzLlxuICAgKi9cblxuICBjaGVja0ZpbHRlcnM6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZmlsdGVycyA9IHRoaXMuZmlsdGVyc1xuICAgIGlmICghZmlsdGVycykgcmV0dXJuXG4gICAgdmFyIGkgPSBmaWx0ZXJzLmxlbmd0aFxuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgIHZhciBmaWx0ZXIgPSBfLnJlc29sdmVBc3NldCh0aGlzLnZtLiRvcHRpb25zLCAnZmlsdGVycycsIGZpbHRlcnNbaV0ubmFtZSlcbiAgICAgIGlmICh0eXBlb2YgZmlsdGVyID09PSAnZnVuY3Rpb24nIHx8IGZpbHRlci5yZWFkKSB7XG4gICAgICAgIHRoaXMuaGFzUmVhZCA9IHRydWVcbiAgICAgIH1cbiAgICAgIGlmIChmaWx0ZXIud3JpdGUpIHtcbiAgICAgICAgdGhpcy5oYXNXcml0ZSA9IHRydWVcbiAgICAgIH1cbiAgICB9XG4gIH1cblxufSIsInZhciBfID0gcmVxdWlyZSgnLi4vLi4vdXRpbCcpXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXG4gIGJpbmQ6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICB2YXIgZWwgPSB0aGlzLmVsXG4gICAgdGhpcy5saXN0ZW5lciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHNlbGYuc2V0KGVsLnZhbHVlKVxuICAgIH1cbiAgICBfLm9uKGVsLCAnY2hhbmdlJywgdGhpcy5saXN0ZW5lcilcbiAgICBpZiAoZWwuY2hlY2tlZCkge1xuICAgICAgdGhpcy5faW5pdFZhbHVlID0gZWwudmFsdWVcbiAgICB9XG4gIH0sXG5cbiAgdXBkYXRlOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAvKiBqc2hpbnQgZXFlcWVxOiBmYWxzZSAqL1xuICAgIHRoaXMuZWwuY2hlY2tlZCA9IHZhbHVlID09IHRoaXMuZWwudmFsdWVcbiAgfSxcblxuICB1bmJpbmQ6IGZ1bmN0aW9uICgpIHtcbiAgICBfLm9mZih0aGlzLmVsLCAnY2hhbmdlJywgdGhpcy5saXN0ZW5lcilcbiAgfVxuXG59IiwidmFyIF8gPSByZXF1aXJlKCcuLi8uLi91dGlsJylcbnZhciBXYXRjaGVyID0gcmVxdWlyZSgnLi4vLi4vd2F0Y2hlcicpXG52YXIgZGlyUGFyc2VyID0gcmVxdWlyZSgnLi4vLi4vcGFyc2Vycy9kaXJlY3RpdmUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuICBiaW5kOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgdmFyIGVsID0gdGhpcy5lbFxuICAgIC8vIGNoZWNrIG9wdGlvbnMgcGFyYW1cbiAgICB2YXIgb3B0aW9uc1BhcmFtID0gdGhpcy5fY2hlY2tQYXJhbSgnb3B0aW9ucycpXG4gICAgaWYgKG9wdGlvbnNQYXJhbSkge1xuICAgICAgaW5pdE9wdGlvbnMuY2FsbCh0aGlzLCBvcHRpb25zUGFyYW0pXG4gICAgfVxuICAgIHRoaXMubnVtYmVyID0gdGhpcy5fY2hlY2tQYXJhbSgnbnVtYmVyJykgIT0gbnVsbFxuICAgIHRoaXMubXVsdGlwbGUgPSBlbC5oYXNBdHRyaWJ1dGUoJ211bHRpcGxlJylcbiAgICB0aGlzLmxpc3RlbmVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIHZhbHVlID0gc2VsZi5tdWx0aXBsZVxuICAgICAgICA/IGdldE11bHRpVmFsdWUoZWwpXG4gICAgICAgIDogZWwudmFsdWVcbiAgICAgIHZhbHVlID0gc2VsZi5udW1iZXJcbiAgICAgICAgPyBfLmlzQXJyYXkodmFsdWUpXG4gICAgICAgICAgPyB2YWx1ZS5tYXAoXy50b051bWJlcilcbiAgICAgICAgICA6IF8udG9OdW1iZXIodmFsdWUpXG4gICAgICAgIDogdmFsdWVcbiAgICAgIHNlbGYuc2V0KHZhbHVlKVxuICAgIH1cbiAgICBfLm9uKGVsLCAnY2hhbmdlJywgdGhpcy5saXN0ZW5lcilcbiAgICBjaGVja0luaXRpYWxWYWx1ZS5jYWxsKHRoaXMpXG4gIH0sXG5cbiAgdXBkYXRlOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAvKiBqc2hpbnQgZXFlcWVxOiBmYWxzZSAqL1xuICAgIHZhciBlbCA9IHRoaXMuZWxcbiAgICBlbC5zZWxlY3RlZEluZGV4ID0gLTFcbiAgICB2YXIgbXVsdGkgPSB0aGlzLm11bHRpcGxlICYmIF8uaXNBcnJheSh2YWx1ZSlcbiAgICB2YXIgb3B0aW9ucyA9IGVsLm9wdGlvbnNcbiAgICB2YXIgaSA9IG9wdGlvbnMubGVuZ3RoXG4gICAgdmFyIG9wdGlvblxuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgIG9wdGlvbiA9IG9wdGlvbnNbaV1cbiAgICAgIG9wdGlvbi5zZWxlY3RlZCA9IG11bHRpXG4gICAgICAgID8gaW5kZXhPZih2YWx1ZSwgb3B0aW9uLnZhbHVlKSA+IC0xXG4gICAgICAgIDogdmFsdWUgPT0gb3B0aW9uLnZhbHVlXG4gICAgfVxuICB9LFxuXG4gIHVuYmluZDogZnVuY3Rpb24gKCkge1xuICAgIF8ub2ZmKHRoaXMuZWwsICdjaGFuZ2UnLCB0aGlzLmxpc3RlbmVyKVxuICAgIGlmICh0aGlzLm9wdGlvbldhdGNoZXIpIHtcbiAgICAgIHRoaXMub3B0aW9uV2F0Y2hlci50ZWFyZG93bigpXG4gICAgfVxuICB9XG5cbn1cblxuLyoqXG4gKiBJbml0aWFsaXplIHRoZSBvcHRpb24gbGlzdCBmcm9tIHRoZSBwYXJhbS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXhwcmVzc2lvblxuICovXG5cbmZ1bmN0aW9uIGluaXRPcHRpb25zIChleHByZXNzaW9uKSB7XG4gIHZhciBzZWxmID0gdGhpc1xuICB2YXIgZGVzY3JpcHRvciA9IGRpclBhcnNlci5wYXJzZShleHByZXNzaW9uKVswXVxuICBmdW5jdGlvbiBvcHRpb25VcGRhdGVXYXRjaGVyICh2YWx1ZSkge1xuICAgIGlmIChfLmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICBzZWxmLmVsLmlubmVySFRNTCA9ICcnXG4gICAgICBidWlsZE9wdGlvbnMoc2VsZi5lbCwgdmFsdWUpXG4gICAgICBpZiAoc2VsZi5fd2F0Y2hlcikge1xuICAgICAgICBzZWxmLnVwZGF0ZShzZWxmLl93YXRjaGVyLnZhbHVlKVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBfLndhcm4oJ0ludmFsaWQgb3B0aW9ucyB2YWx1ZSBmb3Igdi1tb2RlbDogJyArIHZhbHVlKVxuICAgIH1cbiAgfVxuICB0aGlzLm9wdGlvbldhdGNoZXIgPSBuZXcgV2F0Y2hlcihcbiAgICB0aGlzLnZtLFxuICAgIGRlc2NyaXB0b3IuZXhwcmVzc2lvbixcbiAgICBvcHRpb25VcGRhdGVXYXRjaGVyLFxuICAgIHtcbiAgICAgIGRlZXA6IHRydWUsXG4gICAgICBmaWx0ZXJzOiBkZXNjcmlwdG9yLmZpbHRlcnNcbiAgICB9XG4gIClcbiAgLy8gdXBkYXRlIHdpdGggaW5pdGlhbCB2YWx1ZVxuICBvcHRpb25VcGRhdGVXYXRjaGVyKHRoaXMub3B0aW9uV2F0Y2hlci52YWx1ZSlcbn1cblxuLyoqXG4gKiBCdWlsZCB1cCBvcHRpb24gZWxlbWVudHMuIElFOSBkb2Vzbid0IGNyZWF0ZSBvcHRpb25zXG4gKiB3aGVuIHNldHRpbmcgaW5uZXJIVE1MIG9uIDxzZWxlY3Q+IGVsZW1lbnRzLCBzbyB3ZSBoYXZlXG4gKiB0byB1c2UgRE9NIEFQSSBoZXJlLlxuICpcbiAqIEBwYXJhbSB7RWxlbWVudH0gcGFyZW50IC0gYSA8c2VsZWN0PiBvciBhbiA8b3B0Z3JvdXA+XG4gKiBAcGFyYW0ge0FycmF5fSBvcHRpb25zXG4gKi9cblxuZnVuY3Rpb24gYnVpbGRPcHRpb25zIChwYXJlbnQsIG9wdGlvbnMpIHtcbiAgdmFyIG9wLCBlbFxuICBmb3IgKHZhciBpID0gMCwgbCA9IG9wdGlvbnMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgb3AgPSBvcHRpb25zW2ldXG4gICAgaWYgKCFvcC5vcHRpb25zKSB7XG4gICAgICBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ29wdGlvbicpXG4gICAgICBpZiAodHlwZW9mIG9wID09PSAnc3RyaW5nJykge1xuICAgICAgICBlbC50ZXh0ID0gZWwudmFsdWUgPSBvcFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLyoganNoaW50IGVxZXFlcTogZmFsc2UgKi9cbiAgICAgICAgaWYgKG9wLnZhbHVlICE9IG51bGwpIHtcbiAgICAgICAgICBlbC52YWx1ZSA9IG9wLnZhbHVlXG4gICAgICAgIH1cbiAgICAgICAgZWwudGV4dCA9IG9wLnRleHQgfHwgb3AudmFsdWUgfHwgJydcbiAgICAgICAgaWYgKG9wLmRpc2FibGVkKSB7XG4gICAgICAgICAgZWwuZGlzYWJsZWQgPSB0cnVlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdvcHRncm91cCcpXG4gICAgICBlbC5sYWJlbCA9IG9wLmxhYmVsXG4gICAgICBidWlsZE9wdGlvbnMoZWwsIG9wLm9wdGlvbnMpXG4gICAgfVxuICAgIHBhcmVudC5hcHBlbmRDaGlsZChlbClcbiAgfVxufVxuXG4vKipcbiAqIENoZWNrIHRoZSBpbml0aWFsIHZhbHVlIGZvciBzZWxlY3RlZCBvcHRpb25zLlxuICovXG5cbmZ1bmN0aW9uIGNoZWNrSW5pdGlhbFZhbHVlICgpIHtcbiAgdmFyIGluaXRWYWx1ZVxuICB2YXIgb3B0aW9ucyA9IHRoaXMuZWwub3B0aW9uc1xuICBmb3IgKHZhciBpID0gMCwgbCA9IG9wdGlvbnMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgaWYgKG9wdGlvbnNbaV0uaGFzQXR0cmlidXRlKCdzZWxlY3RlZCcpKSB7XG4gICAgICBpZiAodGhpcy5tdWx0aXBsZSkge1xuICAgICAgICAoaW5pdFZhbHVlIHx8IChpbml0VmFsdWUgPSBbXSkpXG4gICAgICAgICAgLnB1c2gob3B0aW9uc1tpXS52YWx1ZSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGluaXRWYWx1ZSA9IG9wdGlvbnNbaV0udmFsdWVcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgaWYgKHR5cGVvZiBpbml0VmFsdWUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgdGhpcy5faW5pdFZhbHVlID0gdGhpcy5udW1iZXJcbiAgICAgID8gXy50b051bWJlcihpbml0VmFsdWUpXG4gICAgICA6IGluaXRWYWx1ZVxuICB9XG59XG5cbi8qKlxuICogSGVscGVyIHRvIGV4dHJhY3QgYSB2YWx1ZSBhcnJheSBmb3Igc2VsZWN0W211bHRpcGxlXVxuICpcbiAqIEBwYXJhbSB7U2VsZWN0RWxlbWVudH0gZWxcbiAqIEByZXR1cm4ge0FycmF5fVxuICovXG5cbmZ1bmN0aW9uIGdldE11bHRpVmFsdWUgKGVsKSB7XG4gIHJldHVybiBBcnJheS5wcm90b3R5cGUuZmlsdGVyXG4gICAgLmNhbGwoZWwub3B0aW9ucywgZmlsdGVyU2VsZWN0ZWQpXG4gICAgLm1hcChnZXRPcHRpb25WYWx1ZSlcbn1cblxuZnVuY3Rpb24gZmlsdGVyU2VsZWN0ZWQgKG9wKSB7XG4gIHJldHVybiBvcC5zZWxlY3RlZFxufVxuXG5mdW5jdGlvbiBnZXRPcHRpb25WYWx1ZSAob3ApIHtcbiAgcmV0dXJuIG9wLnZhbHVlIHx8IG9wLnRleHRcbn1cblxuLyoqXG4gKiBOYXRpdmUgQXJyYXkuaW5kZXhPZiB1c2VzIHN0cmljdCBlcXVhbCwgYnV0IGluIHRoaXNcbiAqIGNhc2Ugd2UgbmVlZCB0byBtYXRjaCBzdHJpbmcvbnVtYmVycyB3aXRoIHNvZnQgZXF1YWwuXG4gKlxuICogQHBhcmFtIHtBcnJheX0gYXJyXG4gKiBAcGFyYW0geyp9IHZhbFxuICovXG5cbmZ1bmN0aW9uIGluZGV4T2YgKGFyciwgdmFsKSB7XG4gIC8qIGpzaGludCBlcWVxZXE6IGZhbHNlICovXG4gIHZhciBpID0gYXJyLmxlbmd0aFxuICB3aGlsZSAoaS0tKSB7XG4gICAgaWYgKGFycltpXSA9PSB2YWwpIHJldHVybiBpXG4gIH1cbiAgcmV0dXJuIC0xXG59IiwidmFyIF8gPSByZXF1aXJlKCcuLi8uLi91dGlsJylcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cbiAgYmluZDogZnVuY3Rpb24gKCkge1xuICAgIHZhciBzZWxmID0gdGhpc1xuICAgIHZhciBlbCA9IHRoaXMuZWxcblxuICAgIC8vIGNoZWNrIHBhcmFtc1xuICAgIC8vIC0gbGF6eTogdXBkYXRlIG1vZGVsIG9uIFwiY2hhbmdlXCIgaW5zdGVhZCBvZiBcImlucHV0XCJcbiAgICB2YXIgbGF6eSA9IHRoaXMuX2NoZWNrUGFyYW0oJ2xhenknKSAhPSBudWxsXG4gICAgLy8gLSBudW1iZXI6IGNhc3QgdmFsdWUgaW50byBudW1iZXIgd2hlbiB1cGRhdGluZyBtb2RlbC5cbiAgICB2YXIgbnVtYmVyID0gdGhpcy5fY2hlY2tQYXJhbSgnbnVtYmVyJykgIT0gbnVsbFxuICAgIC8vIC0gZGVib3VuY2U6IGRlYm91bmNlIHRoZSBpbnB1dCBsaXN0ZW5lclxuICAgIHZhciBkZWJvdW5jZSA9IHBhcnNlSW50KHRoaXMuX2NoZWNrUGFyYW0oJ2RlYm91bmNlJyksIDEwKVxuXG4gICAgLy8gaGFuZGxlIGNvbXBvc2l0aW9uIGV2ZW50cy5cbiAgICAvLyAgIGh0dHA6Ly9ibG9nLmV2YW55b3UubWUvMjAxNC8wMS8wMy9jb21wb3NpdGlvbi1ldmVudC9cbiAgICAvLyBza2lwIHRoaXMgZm9yIEFuZHJvaWQgYmVjYXVzZSBpdCBoYW5kbGVzIGNvbXBvc2l0aW9uXG4gICAgLy8gZXZlbnRzIHF1aXRlIGRpZmZlcmVudGx5LiBBbmRyb2lkIGRvZXNuJ3QgdHJpZ2dlclxuICAgIC8vIGNvbXBvc2l0aW9uIGV2ZW50cyBmb3IgbGFuZ3VhZ2UgaW5wdXQgbWV0aG9kcyBlLmcuXG4gICAgLy8gQ2hpbmVzZSwgYnV0IGluc3RlYWQgdHJpZ2dlcnMgdGhlbSBmb3Igc3BlbGxpbmdcbiAgICAvLyBzdWdnZXN0aW9ucy4uLiAoc2VlIERpc2N1c3Npb24vIzE2MilcbiAgICB2YXIgY29tcG9zaW5nID0gZmFsc2VcbiAgICBpZiAoIV8uaXNBbmRyb2lkKSB7XG4gICAgICB0aGlzLm9uQ29tcG9zZVN0YXJ0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBjb21wb3NpbmcgPSB0cnVlXG4gICAgICB9XG4gICAgICB0aGlzLm9uQ29tcG9zZUVuZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29tcG9zaW5nID0gZmFsc2VcbiAgICAgICAgLy8gaW4gSUUxMSB0aGUgXCJjb21wb3NpdGlvbmVuZFwiIGV2ZW50IGZpcmVzIEFGVEVSXG4gICAgICAgIC8vIHRoZSBcImlucHV0XCIgZXZlbnQsIHNvIHRoZSBpbnB1dCBoYW5kbGVyIGlzIGJsb2NrZWRcbiAgICAgICAgLy8gYXQgdGhlIGVuZC4uLiBoYXZlIHRvIGNhbGwgaXQgaGVyZS5cbiAgICAgICAgc2VsZi5saXN0ZW5lcigpXG4gICAgICB9XG4gICAgICBfLm9uKGVsLCdjb21wb3NpdGlvbnN0YXJ0JywgdGhpcy5vbkNvbXBvc2VTdGFydClcbiAgICAgIF8ub24oZWwsJ2NvbXBvc2l0aW9uZW5kJywgdGhpcy5vbkNvbXBvc2VFbmQpXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc3luY1RvTW9kZWwgKCkge1xuICAgICAgdmFyIHZhbCA9IG51bWJlclxuICAgICAgICA/IF8udG9OdW1iZXIoZWwudmFsdWUpXG4gICAgICAgIDogZWwudmFsdWVcbiAgICAgIHNlbGYuc2V0KHZhbClcbiAgICB9XG5cbiAgICAvLyBpZiB0aGUgZGlyZWN0aXZlIGhhcyBmaWx0ZXJzLCB3ZSBuZWVkIHRvXG4gICAgLy8gcmVjb3JkIGN1cnNvciBwb3NpdGlvbiBhbmQgcmVzdG9yZSBpdCBhZnRlciB1cGRhdGluZ1xuICAgIC8vIHRoZSBpbnB1dCB3aXRoIHRoZSBmaWx0ZXJlZCB2YWx1ZS5cbiAgICAvLyBhbHNvIGZvcmNlIHVwZGF0ZSBmb3IgdHlwZT1cInJhbmdlXCIgaW5wdXRzIHRvIGVuYWJsZVxuICAgIC8vIFwibG9jayBpbiByYW5nZVwiIChzZWUgIzUwNilcbiAgICBpZiAodGhpcy5oYXNSZWFkIHx8IGVsLnR5cGUgPT09ICdyYW5nZScpIHtcbiAgICAgIHRoaXMubGlzdGVuZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChjb21wb3NpbmcpIHJldHVyblxuICAgICAgICB2YXIgY2hhcnNPZmZzZXRcbiAgICAgICAgLy8gc29tZSBIVE1MNSBpbnB1dCB0eXBlcyB0aHJvdyBlcnJvciBoZXJlXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgLy8gcmVjb3JkIGhvdyBtYW55IGNoYXJzIGZyb20gdGhlIGVuZCBvZiBpbnB1dFxuICAgICAgICAgIC8vIHRoZSBjdXJzb3Igd2FzIGF0XG4gICAgICAgICAgY2hhcnNPZmZzZXQgPSBlbC52YWx1ZS5sZW5ndGggLSBlbC5zZWxlY3Rpb25TdGFydFxuICAgICAgICB9IGNhdGNoIChlKSB7fVxuICAgICAgICAvLyBGaXggSUUxMC8xMSBpbmZpbml0ZSB1cGRhdGUgY3ljbGVcbiAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3l5eDk5MDgwMy92dWUvaXNzdWVzLzU5MlxuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cbiAgICAgICAgaWYgKGNoYXJzT2Zmc2V0IDwgMCkge1xuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIHN5bmNUb01vZGVsKClcbiAgICAgICAgXy5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgLy8gZm9yY2UgYSB2YWx1ZSB1cGRhdGUsIGJlY2F1c2UgaW5cbiAgICAgICAgICAvLyBjZXJ0YWluIGNhc2VzIHRoZSB3cml0ZSBmaWx0ZXJzIG91dHB1dCB0aGVcbiAgICAgICAgICAvLyBzYW1lIHJlc3VsdCBmb3IgZGlmZmVyZW50IGlucHV0IHZhbHVlcywgYW5kXG4gICAgICAgICAgLy8gdGhlIE9ic2VydmVyIHNldCBldmVudHMgd29uJ3QgYmUgdHJpZ2dlcmVkLlxuICAgICAgICAgIHZhciBuZXdWYWwgPSBzZWxmLl93YXRjaGVyLnZhbHVlXG4gICAgICAgICAgc2VsZi51cGRhdGUobmV3VmFsKVxuICAgICAgICAgIGlmIChjaGFyc09mZnNldCAhPSBudWxsKSB7XG4gICAgICAgICAgICB2YXIgY3Vyc29yUG9zID1cbiAgICAgICAgICAgICAgXy50b1N0cmluZyhuZXdWYWwpLmxlbmd0aCAtIGNoYXJzT2Zmc2V0XG4gICAgICAgICAgICBlbC5zZXRTZWxlY3Rpb25SYW5nZShjdXJzb3JQb3MsIGN1cnNvclBvcylcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMubGlzdGVuZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChjb21wb3NpbmcpIHJldHVyblxuICAgICAgICBzeW5jVG9Nb2RlbCgpXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGRlYm91bmNlKSB7XG4gICAgICB0aGlzLmxpc3RlbmVyID0gXy5kZWJvdW5jZSh0aGlzLmxpc3RlbmVyLCBkZWJvdW5jZSlcbiAgICB9XG5cbiAgICAvLyBOb3cgYXR0YWNoIHRoZSBtYWluIGxpc3RlbmVyXG5cbiAgICB0aGlzLmV2ZW50ID0gbGF6eSA/ICdjaGFuZ2UnIDogJ2lucHV0J1xuICAgIC8vIFN1cHBvcnQgalF1ZXJ5IGV2ZW50cywgc2luY2UgalF1ZXJ5LnRyaWdnZXIoKSBkb2Vzbid0XG4gICAgLy8gdHJpZ2dlciBuYXRpdmUgZXZlbnRzIGluIHNvbWUgY2FzZXMgYW5kIHNvbWUgcGx1Z2luc1xuICAgIC8vIHJlbHkgb24gJC50cmlnZ2VyKClcbiAgICAvLyBcbiAgICAvLyBXZSB3YW50IHRvIG1ha2Ugc3VyZSBpZiBhIGxpc3RlbmVyIGlzIGF0dGFjaGVkIHVzaW5nXG4gICAgLy8galF1ZXJ5LCBpdCBpcyBhbHNvIHJlbW92ZWQgd2l0aCBqUXVlcnksIHRoYXQncyB3aHlcbiAgICAvLyB3ZSBkbyB0aGUgY2hlY2sgZm9yIGVhY2ggZGlyZWN0aXZlIGluc3RhbmNlIGFuZFxuICAgIC8vIHN0b3JlIHRoYXQgY2hlY2sgcmVzdWx0IG9uIGl0c2VsZi4gVGhpcyBhbHNvIGFsbG93c1xuICAgIC8vIGVhc2llciB0ZXN0IGNvdmVyYWdlIGNvbnRyb2wgYnkgdW5zZXR0aW5nIHRoZSBnbG9iYWxcbiAgICAvLyBqUXVlcnkgdmFyaWFibGUgaW4gdGVzdHMuXG4gICAgdGhpcy5oYXNqUXVlcnkgPSB0eXBlb2YgalF1ZXJ5ID09PSAnZnVuY3Rpb24nXG4gICAgaWYgKHRoaXMuaGFzalF1ZXJ5KSB7XG4gICAgICBqUXVlcnkoZWwpLm9uKHRoaXMuZXZlbnQsIHRoaXMubGlzdGVuZXIpXG4gICAgfSBlbHNlIHtcbiAgICAgIF8ub24oZWwsIHRoaXMuZXZlbnQsIHRoaXMubGlzdGVuZXIpXG4gICAgfVxuXG4gICAgLy8gSUU5IGRvZXNuJ3QgZmlyZSBpbnB1dCBldmVudCBvbiBiYWNrc3BhY2UvZGVsL2N1dFxuICAgIGlmICghbGF6eSAmJiBfLmlzSUU5KSB7XG4gICAgICB0aGlzLm9uQ3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBfLm5leHRUaWNrKHNlbGYubGlzdGVuZXIpXG4gICAgICB9XG4gICAgICB0aGlzLm9uRGVsID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgaWYgKGUua2V5Q29kZSA9PT0gNDYgfHwgZS5rZXlDb2RlID09PSA4KSB7XG4gICAgICAgICAgc2VsZi5saXN0ZW5lcigpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIF8ub24oZWwsICdjdXQnLCB0aGlzLm9uQ3V0KVxuICAgICAgXy5vbihlbCwgJ2tleXVwJywgdGhpcy5vbkRlbClcbiAgICB9XG5cbiAgICAvLyBzZXQgaW5pdGlhbCB2YWx1ZSBpZiBwcmVzZW50XG4gICAgaWYgKFxuICAgICAgZWwuaGFzQXR0cmlidXRlKCd2YWx1ZScpIHx8XG4gICAgICAoZWwudGFnTmFtZSA9PT0gJ1RFWFRBUkVBJyAmJiBlbC52YWx1ZS50cmltKCkpXG4gICAgKSB7XG4gICAgICB0aGlzLl9pbml0VmFsdWUgPSBudW1iZXJcbiAgICAgICAgPyBfLnRvTnVtYmVyKGVsLnZhbHVlKVxuICAgICAgICA6IGVsLnZhbHVlXG4gICAgfVxuICB9LFxuXG4gIHVwZGF0ZTogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgdGhpcy5lbC52YWx1ZSA9IF8udG9TdHJpbmcodmFsdWUpXG4gIH0sXG5cbiAgdW5iaW5kOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGVsID0gdGhpcy5lbFxuICAgIGlmICh0aGlzLmhhc2pRdWVyeSkge1xuICAgICAgalF1ZXJ5KGVsKS5vZmYodGhpcy5ldmVudCwgdGhpcy5saXN0ZW5lcilcbiAgICB9IGVsc2Uge1xuICAgICAgXy5vZmYoZWwsIHRoaXMuZXZlbnQsIHRoaXMubGlzdGVuZXIpXG4gICAgfVxuICAgIGlmICh0aGlzLm9uQ29tcG9zZVN0YXJ0KSB7XG4gICAgICBfLm9mZihlbCwgJ2NvbXBvc2l0aW9uc3RhcnQnLCB0aGlzLm9uQ29tcG9zZVN0YXJ0KVxuICAgICAgXy5vZmYoZWwsICdjb21wb3NpdGlvbmVuZCcsIHRoaXMub25Db21wb3NlRW5kKVxuICAgIH1cbiAgICBpZiAodGhpcy5vbkN1dCkge1xuICAgICAgXy5vZmYoZWwsJ2N1dCcsIHRoaXMub25DdXQpXG4gICAgICBfLm9mZihlbCwna2V5dXAnLCB0aGlzLm9uRGVsKVxuICAgIH1cbiAgfVxufSIsInZhciBfID0gcmVxdWlyZSgnLi4vdXRpbCcpXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXG4gIGFjY2VwdFN0YXRlbWVudDogdHJ1ZSxcbiAgcHJpb3JpdHk6IDcwMCxcblxuICBiaW5kOiBmdW5jdGlvbiAoKSB7XG4gICAgLy8gZGVhbCB3aXRoIGlmcmFtZXNcbiAgICBpZiAoXG4gICAgICB0aGlzLmVsLnRhZ05hbWUgPT09ICdJRlJBTUUnICYmXG4gICAgICB0aGlzLmFyZyAhPT0gJ2xvYWQnXG4gICAgKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICAgIHRoaXMuaWZyYW1lQmluZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgXy5vbihzZWxmLmVsLmNvbnRlbnRXaW5kb3csIHNlbGYuYXJnLCBzZWxmLmhhbmRsZXIpXG4gICAgICB9XG4gICAgICBfLm9uKHRoaXMuZWwsICdsb2FkJywgdGhpcy5pZnJhbWVCaW5kKVxuICAgIH1cbiAgfSxcblxuICB1cGRhdGU6IGZ1bmN0aW9uIChoYW5kbGVyKSB7XG4gICAgaWYgKHR5cGVvZiBoYW5kbGVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICBfLndhcm4oXG4gICAgICAgICdEaXJlY3RpdmUgXCJ2LW9uOicgKyB0aGlzLmV4cHJlc3Npb24gKyAnXCIgJyArXG4gICAgICAgICdleHBlY3RzIGEgZnVuY3Rpb24gdmFsdWUuJ1xuICAgICAgKVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIHRoaXMucmVzZXQoKVxuICAgIHZhciB2bSA9IHRoaXMudm1cbiAgICB0aGlzLmhhbmRsZXIgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgZS50YXJnZXRWTSA9IHZtXG4gICAgICB2bS4kZXZlbnQgPSBlXG4gICAgICB2YXIgcmVzID0gaGFuZGxlcihlKVxuICAgICAgdm0uJGV2ZW50ID0gbnVsbFxuICAgICAgcmV0dXJuIHJlc1xuICAgIH1cbiAgICBpZiAodGhpcy5pZnJhbWVCaW5kKSB7XG4gICAgICB0aGlzLmlmcmFtZUJpbmQoKVxuICAgIH0gZWxzZSB7XG4gICAgICBfLm9uKHRoaXMuZWwsIHRoaXMuYXJnLCB0aGlzLmhhbmRsZXIpXG4gICAgfVxuICB9LFxuXG4gIHJlc2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGVsID0gdGhpcy5pZnJhbWVCaW5kXG4gICAgICA/IHRoaXMuZWwuY29udGVudFdpbmRvd1xuICAgICAgOiB0aGlzLmVsXG4gICAgaWYgKHRoaXMuaGFuZGxlcikge1xuICAgICAgXy5vZmYoZWwsIHRoaXMuYXJnLCB0aGlzLmhhbmRsZXIpXG4gICAgfVxuICB9LFxuXG4gIHVuYmluZDogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMucmVzZXQoKVxuICAgIF8ub2ZmKHRoaXMuZWwsICdsb2FkJywgdGhpcy5pZnJhbWVCaW5kKVxuICB9XG59IiwidmFyIF8gPSByZXF1aXJlKCcuLi91dGlsJylcbnZhciBXYXRjaGVyID0gcmVxdWlyZSgnLi4vd2F0Y2hlcicpXG52YXIgaWRlbnRSRSA9IHJlcXVpcmUoJy4uL3BhcnNlcnMvcGF0aCcpLmlkZW50UkVcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cbiAgYmluZDogZnVuY3Rpb24gKCkge1xuXG4gICAgdmFyIGNoaWxkID0gdGhpcy52bVxuICAgIHZhciBwYXJlbnQgPSBjaGlsZC4kcGFyZW50XG4gICAgdmFyIGNoaWxkS2V5ID0gdGhpcy5hcmdcbiAgICB2YXIgcGFyZW50S2V5ID0gdGhpcy5leHByZXNzaW9uXG5cbiAgICBpZiAoIWlkZW50UkUudGVzdChjaGlsZEtleSkpIHtcbiAgICAgIF8ud2FybihcbiAgICAgICAgJ0ludmFsaWQgcHJvcCBrZXk6IFwiJyArIGNoaWxkS2V5ICsgJ1wiLiBQcm9wIGtleXMgJyArXG4gICAgICAgICdtdXN0IGJlIHZhbGlkIGlkZW50aWZpZXJzLidcbiAgICAgIClcbiAgICB9XG5cbiAgICAvLyBzaW1wbGUgbG9jayB0byBhdm9pZCBjaXJjdWxhciB1cGRhdGVzLlxuICAgIC8vIHdpdGhvdXQgdGhpcyBpdCB3b3VsZCBzdGFiaWxpemUgdG9vLCBidXQgdGhpcyBtYWtlc1xuICAgIC8vIHN1cmUgaXQgZG9lc24ndCBjYXVzZSBvdGhlciB3YXRjaGVycyB0byByZS1ldmFsdWF0ZS5cbiAgICB2YXIgbG9ja2VkID0gZmFsc2VcbiAgICB2YXIgbG9jayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGxvY2tlZCA9IHRydWVcbiAgICAgIF8ubmV4dFRpY2sodW5sb2NrKVxuICAgIH1cbiAgICB2YXIgdW5sb2NrID0gZnVuY3Rpb24gKCkge1xuICAgICAgbG9ja2VkID0gZmFsc2VcbiAgICB9XG5cbiAgICB0aGlzLnBhcmVudFdhdGNoZXIgPSBuZXcgV2F0Y2hlcihcbiAgICAgIHBhcmVudCxcbiAgICAgIHBhcmVudEtleSxcbiAgICAgIGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgICAgaWYgKCFsb2NrZWQpIHtcbiAgICAgICAgICBsb2NrKClcbiAgICAgICAgICAvLyBhbGwgcHJvcHMgaGF2ZSBiZWVuIGluaXRpYWxpemVkIGFscmVhZHlcbiAgICAgICAgICBjaGlsZFtjaGlsZEtleV0gPSB2YWxcbiAgICAgICAgfVxuICAgICAgfVxuICAgIClcblxuICAgIC8vIG9ubHkgc2V0dXAgdHdvLXdheSBiaW5kaW5nIGlmIHRoaXMgaXMgbm90IGEgb25lLXdheVxuICAgIC8vIGJpbmRpbmcuXG4gICAgaWYgKCF0aGlzLl9kZXNjcmlwdG9yLm9uZVdheSkge1xuICAgICAgdGhpcy5jaGlsZFdhdGNoZXIgPSBuZXcgV2F0Y2hlcihcbiAgICAgICAgY2hpbGQsXG4gICAgICAgIGNoaWxkS2V5LFxuICAgICAgICBmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgICAgaWYgKCFsb2NrZWQpIHtcbiAgICAgICAgICAgIGxvY2soKVxuICAgICAgICAgICAgcGFyZW50LiRzZXQocGFyZW50S2V5LCB2YWwpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICApXG4gICAgfVxuXG4gICAgLy8gc2V0IHRoZSBjaGlsZCBpbml0aWFsIHZhbHVlLCBtYXliZSB0cmlnZ2VyaW5nIHRoZVxuICAgIC8vIGNoaWxkIHdhdGNoZXIgaW1tZWRpYXRlbHkuXG4gICAgY2hpbGQuJHNldChjaGlsZEtleSwgdGhpcy5wYXJlbnRXYXRjaGVyLnZhbHVlKVxuXG4gIH0sXG5cbiAgdW5iaW5kOiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMucGFyZW50V2F0Y2hlcikge1xuICAgICAgdGhpcy5wYXJlbnRXYXRjaGVyLnRlYXJkb3duKClcbiAgICB9XG4gICAgaWYgKHRoaXMuY2hpbGRXYXRjaGVyKSB7XG4gICAgICB0aGlzLmNoaWxkV2F0Y2hlci50ZWFyZG93bigpXG4gICAgfVxuICB9XG5cbn1cbiIsInZhciBfID0gcmVxdWlyZSgnLi4vdXRpbCcpXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXG4gIGlzTGl0ZXJhbDogdHJ1ZSxcblxuICBiaW5kOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHZtID0gdGhpcy5lbC5fX3Z1ZV9fXG4gICAgaWYgKCF2bSkge1xuICAgICAgXy53YXJuKFxuICAgICAgICAndi1yZWYgc2hvdWxkIG9ubHkgYmUgdXNlZCBvbiBhIGNvbXBvbmVudCByb290IGVsZW1lbnQuJ1xuICAgICAgKVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIC8vIElmIHdlIGdldCBoZXJlLCBpdCBtZWFucyB0aGlzIGlzIGEgYHYtcmVmYCBvbiBhXG4gICAgLy8gY2hpbGQsIGJlY2F1c2UgcGFyZW50IHNjb3BlIGB2LXJlZmAgaXMgc3RyaXBwZWQgaW5cbiAgICAvLyBgdi1jb21wb25lbnRgIGFscmVhZHkuIFNvIHdlIGp1c3QgcmVjb3JkIG91ciBvd24gcmVmXG4gICAgLy8gaGVyZSAtIGl0IHdpbGwgb3ZlcndyaXRlIHBhcmVudCByZWYgaW4gYHYtY29tcG9uZW50YCxcbiAgICAvLyBpZiBhbnkuXG4gICAgdm0uX3JlZklEID0gdGhpcy5leHByZXNzaW9uXG4gIH1cbiAgXG59IiwidmFyIF8gPSByZXF1aXJlKCcuLi91dGlsJylcbnZhciBpc09iamVjdCA9IF8uaXNPYmplY3RcbnZhciBpc1BsYWluT2JqZWN0ID0gXy5pc1BsYWluT2JqZWN0XG52YXIgdGV4dFBhcnNlciA9IHJlcXVpcmUoJy4uL3BhcnNlcnMvdGV4dCcpXG52YXIgZXhwUGFyc2VyID0gcmVxdWlyZSgnLi4vcGFyc2Vycy9leHByZXNzaW9uJylcbnZhciB0ZW1wbGF0ZVBhcnNlciA9IHJlcXVpcmUoJy4uL3BhcnNlcnMvdGVtcGxhdGUnKVxudmFyIGNvbXBpbGUgPSByZXF1aXJlKCcuLi9jb21waWxlci9jb21waWxlJylcbnZhciB0cmFuc2NsdWRlID0gcmVxdWlyZSgnLi4vY29tcGlsZXIvdHJhbnNjbHVkZScpXG52YXIgdWlkID0gMFxuXG4vLyBhc3luYyBjb21wb25lbnQgcmVzb2x1dGlvbiBzdGF0ZXNcbnZhciBVTlJFU09MVkVEID0gMFxudmFyIFBFTkRJTkcgPSAxXG52YXIgUkVTT0xWRUQgPSAyXG52YXIgQUJPUlRFRCA9IDNcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cbiAgLyoqXG4gICAqIFNldHVwLlxuICAgKi9cblxuICBiaW5kOiBmdW5jdGlvbiAoKSB7XG4gICAgLy8gdWlkIGFzIGEgY2FjaGUgaWRlbnRpZmllclxuICAgIHRoaXMuaWQgPSAnX192X3JlcGVhdF8nICsgKCsrdWlkKVxuICAgIC8vIHNldHVwIGFuY2hvciBub2Rlc1xuICAgIHRoaXMuc3RhcnQgPSBfLmNyZWF0ZUFuY2hvcigndi1yZXBlYXQtc3RhcnQnKVxuICAgIHRoaXMuZW5kID0gXy5jcmVhdGVBbmNob3IoJ3YtcmVwZWF0JylcbiAgICBfLnJlcGxhY2UodGhpcy5lbCwgdGhpcy5lbmQpXG4gICAgXy5iZWZvcmUodGhpcy5zdGFydCwgdGhpcy5lbmQpXG4gICAgLy8gY2hlY2sgaWYgdGhpcyBpcyBhIGJsb2NrIHJlcGVhdFxuICAgIHRoaXMudGVtcGxhdGUgPSB0aGlzLmVsLnRhZ05hbWUgPT09ICdURU1QTEFURSdcbiAgICAgID8gdGVtcGxhdGVQYXJzZXIucGFyc2UodGhpcy5lbCwgdHJ1ZSlcbiAgICAgIDogdGhpcy5lbFxuICAgIC8vIGNoZWNrIG90aGVyIGRpcmVjdGl2ZXMgdGhhdCBuZWVkIHRvIGJlIGhhbmRsZWRcbiAgICAvLyBhdCB2LXJlcGVhdCBsZXZlbFxuICAgIHRoaXMuY2hlY2tJZigpXG4gICAgdGhpcy5jaGVja1JlZigpXG4gICAgdGhpcy5jaGVja0NvbXBvbmVudCgpXG4gICAgLy8gY2hlY2sgZm9yIHRyYWNrYnkgcGFyYW1cbiAgICB0aGlzLmlkS2V5ID1cbiAgICAgIHRoaXMuX2NoZWNrUGFyYW0oJ3RyYWNrLWJ5JykgfHxcbiAgICAgIHRoaXMuX2NoZWNrUGFyYW0oJ3RyYWNrYnknKSAvLyAwLjExLjAgY29tcGF0XG4gICAgLy8gY2hlY2sgZm9yIHRyYW5zaXRpb24gc3RhZ2dlclxuICAgIHZhciBzdGFnZ2VyID0gK3RoaXMuX2NoZWNrUGFyYW0oJ3N0YWdnZXInKVxuICAgIHRoaXMuZW50ZXJTdGFnZ2VyID0gK3RoaXMuX2NoZWNrUGFyYW0oJ2VudGVyLXN0YWdnZXInKSB8fCBzdGFnZ2VyXG4gICAgdGhpcy5sZWF2ZVN0YWdnZXIgPSArdGhpcy5fY2hlY2tQYXJhbSgnbGVhdmUtc3RhZ2dlcicpIHx8IHN0YWdnZXJcbiAgICB0aGlzLmNhY2hlID0gT2JqZWN0LmNyZWF0ZShudWxsKVxuICB9LFxuXG4gIC8qKlxuICAgKiBXYXJuIGFnYWluc3Qgdi1pZiB1c2FnZS5cbiAgICovXG5cbiAgY2hlY2tJZjogZnVuY3Rpb24gKCkge1xuICAgIGlmIChfLmF0dHIodGhpcy5lbCwgJ2lmJykgIT09IG51bGwpIHtcbiAgICAgIF8ud2FybihcbiAgICAgICAgJ0RvblxcJ3QgdXNlIHYtaWYgd2l0aCB2LXJlcGVhdC4gJyArXG4gICAgICAgICdVc2Ugdi1zaG93IG9yIHRoZSBcImZpbHRlckJ5XCIgZmlsdGVyIGluc3RlYWQuJ1xuICAgICAgKVxuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogQ2hlY2sgaWYgdi1yZWYvIHYtZWwgaXMgYWxzbyBwcmVzZW50LlxuICAgKi9cblxuICBjaGVja1JlZjogZnVuY3Rpb24gKCkge1xuICAgIHZhciByZWZJRCA9IF8uYXR0cih0aGlzLmVsLCAncmVmJylcbiAgICB0aGlzLnJlZklEID0gcmVmSURcbiAgICAgID8gdGhpcy52bS4kaW50ZXJwb2xhdGUocmVmSUQpXG4gICAgICA6IG51bGxcbiAgICB2YXIgZWxJZCA9IF8uYXR0cih0aGlzLmVsLCAnZWwnKVxuICAgIHRoaXMuZWxJZCA9IGVsSWRcbiAgICAgID8gdGhpcy52bS4kaW50ZXJwb2xhdGUoZWxJZClcbiAgICAgIDogbnVsbFxuICB9LFxuXG4gIC8qKlxuICAgKiBDaGVjayB0aGUgY29tcG9uZW50IGNvbnN0cnVjdG9yIHRvIHVzZSBmb3IgcmVwZWF0ZWRcbiAgICogaW5zdGFuY2VzLiBJZiBzdGF0aWMgd2UgcmVzb2x2ZSBpdCBub3csIG90aGVyd2lzZSBpdFxuICAgKiBuZWVkcyB0byBiZSByZXNvbHZlZCBhdCBidWlsZCB0aW1lIHdpdGggYWN0dWFsIGRhdGEuXG4gICAqL1xuXG4gIGNoZWNrQ29tcG9uZW50OiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5jb21wb25lbnRTdGF0ZSA9IFVOUkVTT0xWRURcbiAgICB2YXIgb3B0aW9ucyA9IHRoaXMudm0uJG9wdGlvbnNcbiAgICB2YXIgaWQgPSBfLmNoZWNrQ29tcG9uZW50KHRoaXMuZWwsIG9wdGlvbnMpXG4gICAgaWYgKCFpZCkge1xuICAgICAgLy8gZGVmYXVsdCBjb25zdHJ1Y3RvclxuICAgICAgdGhpcy5DdG9yID0gXy5WdWVcbiAgICAgIC8vIGlubGluZSByZXBlYXRzIHNob3VsZCBpbmhlcml0XG4gICAgICB0aGlzLmluaGVyaXQgPSB0cnVlXG4gICAgICAvLyBpbXBvcnRhbnQ6IHRyYW5zY2x1ZGUgd2l0aCBubyBvcHRpb25zLCBqdXN0XG4gICAgICAvLyB0byBlbnN1cmUgYmxvY2sgc3RhcnQgYW5kIGJsb2NrIGVuZFxuICAgICAgdGhpcy50ZW1wbGF0ZSA9IHRyYW5zY2x1ZGUodGhpcy50ZW1wbGF0ZSlcbiAgICAgIHZhciBjb3B5ID0gXy5leHRlbmQoe30sIG9wdGlvbnMpXG4gICAgICBjb3B5Ll9hc0NvbXBvbmVudCA9IGZhbHNlXG4gICAgICB0aGlzLl9saW5rRm4gPSBjb21waWxlKHRoaXMudGVtcGxhdGUsIGNvcHkpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuQ3RvciA9IG51bGxcbiAgICAgIHRoaXMuYXNDb21wb25lbnQgPSB0cnVlXG4gICAgICAvLyBjaGVjayBpbmxpbmUtdGVtcGxhdGVcbiAgICAgIGlmICh0aGlzLl9jaGVja1BhcmFtKCdpbmxpbmUtdGVtcGxhdGUnKSAhPT0gbnVsbCkge1xuICAgICAgICAvLyBleHRyYWN0IGlubGluZSB0ZW1wbGF0ZSBhcyBhIERvY3VtZW50RnJhZ21lbnRcbiAgICAgICAgdGhpcy5pbmxpbmVUZW1wYWx0ZSA9IF8uZXh0cmFjdENvbnRlbnQodGhpcy5lbCwgdHJ1ZSlcbiAgICAgIH1cbiAgICAgIHZhciB0b2tlbnMgPSB0ZXh0UGFyc2VyLnBhcnNlKGlkKVxuICAgICAgaWYgKHRva2Vucykge1xuICAgICAgICAvLyBkeW5hbWljIGNvbXBvbmVudCB0byBiZSByZXNvbHZlZCBsYXRlclxuICAgICAgICB2YXIgY3RvckV4cCA9IHRleHRQYXJzZXIudG9rZW5zVG9FeHAodG9rZW5zKVxuICAgICAgICB0aGlzLmN0b3JHZXR0ZXIgPSBleHBQYXJzZXIucGFyc2UoY3RvckV4cCkuZ2V0XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBzdGF0aWNcbiAgICAgICAgdGhpcy5jb21wb25lbnRJZCA9IGlkXG4gICAgICAgIHRoaXMucGVuZGluZ0RhdGEgPSBudWxsXG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIHJlc29sdmVDb21wb25lbnQ6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmNvbXBvbmVudFN0YXRlID0gUEVORElOR1xuICAgIHRoaXMudm0uX3Jlc29sdmVDb21wb25lbnQodGhpcy5jb21wb25lbnRJZCwgXy5iaW5kKGZ1bmN0aW9uIChDdG9yKSB7XG4gICAgICBpZiAodGhpcy5jb21wb25lbnRTdGF0ZSA9PT0gQUJPUlRFRCkge1xuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICAgIHRoaXMuQ3RvciA9IEN0b3JcbiAgICAgIHZhciBtZXJnZWQgPSBfLm1lcmdlT3B0aW9ucyhDdG9yLm9wdGlvbnMsIHt9LCB7XG4gICAgICAgICRwYXJlbnQ6IHRoaXMudm1cbiAgICAgIH0pXG4gICAgICBtZXJnZWQudGVtcGxhdGUgPSB0aGlzLmlubGluZVRlbXBhbHRlIHx8IG1lcmdlZC50ZW1wbGF0ZVxuICAgICAgbWVyZ2VkLl9hc0NvbXBvbmVudCA9IHRydWVcbiAgICAgIG1lcmdlZC5fcGFyZW50ID0gdGhpcy52bVxuICAgICAgdGhpcy50ZW1wbGF0ZSA9IHRyYW5zY2x1ZGUodGhpcy50ZW1wbGF0ZSwgbWVyZ2VkKVxuICAgICAgLy8gSW1wb3J0YW50OiBtYXJrIHRoZSB0ZW1wbGF0ZSBhcyBhIHJvb3Qgbm9kZSBzbyB0aGF0XG4gICAgICAvLyBjdXN0b20gZWxlbWVudCBjb21wb25lbnRzIGRvbid0IGdldCBjb21waWxlZCB0d2ljZS5cbiAgICAgIC8vIGZpeGVzICM4MjJcbiAgICAgIHRoaXMudGVtcGxhdGUuX192dWVfXyA9IHRydWVcbiAgICAgIHRoaXMuX2xpbmtGbiA9IGNvbXBpbGUodGhpcy50ZW1wbGF0ZSwgbWVyZ2VkKVxuICAgICAgdGhpcy5jb21wb25lbnRTdGF0ZSA9IFJFU09MVkVEXG4gICAgICB0aGlzLnJlYWxVcGRhdGUodGhpcy5wZW5kaW5nRGF0YSlcbiAgICAgIHRoaXMucGVuZGluZ0RhdGEgPSBudWxsXG4gICAgfSwgdGhpcykpXG4gIH0sXG5cbiAgICAvKipcbiAgICogUmVzb2x2ZSBhIGR5bmFtaWMgY29tcG9uZW50IHRvIHVzZSBmb3IgYW4gaW5zdGFuY2UuXG4gICAqIFRoZSB0cmlja3kgcGFydCBoZXJlIGlzIHRoYXQgdGhlcmUgY291bGQgYmUgZHluYW1pY1xuICAgKiBjb21wb25lbnRzIGRlcGVuZGluZyBvbiBpbnN0YW5jZSBkYXRhLlxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YVxuICAgKiBAcGFyYW0ge09iamVjdH0gbWV0YVxuICAgKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAgICovXG5cbiAgcmVzb2x2ZUR5bmFtaWNDb21wb25lbnQ6IGZ1bmN0aW9uIChkYXRhLCBtZXRhKSB7XG4gICAgLy8gY3JlYXRlIGEgdGVtcG9yYXJ5IGNvbnRleHQgb2JqZWN0IGFuZCBjb3B5IGRhdGFcbiAgICAvLyBhbmQgbWV0YSBwcm9wZXJ0aWVzIG9udG8gaXQuXG4gICAgLy8gdXNlIF8uZGVmaW5lIHRvIGF2b2lkIGFjY2lkZW50YWxseSBvdmVyd3JpdGluZyBzY29wZVxuICAgIC8vIHByb3BlcnRpZXMuXG4gICAgdmFyIGNvbnRleHQgPSBPYmplY3QuY3JlYXRlKHRoaXMudm0pXG4gICAgdmFyIGtleVxuICAgIGZvciAoa2V5IGluIGRhdGEpIHtcbiAgICAgIF8uZGVmaW5lKGNvbnRleHQsIGtleSwgZGF0YVtrZXldKVxuICAgIH1cbiAgICBmb3IgKGtleSBpbiBtZXRhKSB7XG4gICAgICBfLmRlZmluZShjb250ZXh0LCBrZXksIG1ldGFba2V5XSlcbiAgICB9XG4gICAgdmFyIGlkID0gdGhpcy5jdG9yR2V0dGVyLmNhbGwoY29udGV4dCwgY29udGV4dClcbiAgICB2YXIgQ3RvciA9IF8ucmVzb2x2ZUFzc2V0KHRoaXMudm0uJG9wdGlvbnMsICdjb21wb25lbnRzJywgaWQpXG4gICAgXy5hc3NlcnRBc3NldChDdG9yLCAnY29tcG9uZW50JywgaWQpXG4gICAgaWYgKCFDdG9yLm9wdGlvbnMpIHtcbiAgICAgIF8ud2FybihcbiAgICAgICAgJ0FzeW5jIHJlc29sdXRpb24gaXMgbm90IHN1cHBvcnRlZCBmb3Igdi1yZXBlYXQgJyArXG4gICAgICAgICcrIGR5bmFtaWMgY29tcG9uZW50LiAoY29tcG9uZW50OiAnICsgaWQgKyAnKSdcbiAgICAgIClcbiAgICAgIHJldHVybiBfLlZ1ZVxuICAgIH1cbiAgICByZXR1cm4gQ3RvclxuICB9LFxuXG4gIC8qKlxuICAgKiBVcGRhdGUuXG4gICAqIFRoaXMgaXMgY2FsbGVkIHdoZW5ldmVyIHRoZSBBcnJheSBtdXRhdGVzLiBJZiB3ZSBoYXZlXG4gICAqIGEgY29tcG9uZW50LCB3ZSBtaWdodCBuZWVkIHRvIHdhaXQgZm9yIGl0IHRvIHJlc29sdmVcbiAgICogYXN5bmNocm9ub3VzbHkuXG4gICAqXG4gICAqIEBwYXJhbSB7QXJyYXl8TnVtYmVyfFN0cmluZ30gZGF0YVxuICAgKi9cblxuICB1cGRhdGU6IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgaWYgKHRoaXMuY29tcG9uZW50SWQpIHtcbiAgICAgIHZhciBzdGF0ZSA9IHRoaXMuY29tcG9uZW50U3RhdGVcbiAgICAgIGlmIChzdGF0ZSA9PT0gVU5SRVNPTFZFRCkge1xuICAgICAgICB0aGlzLnBlbmRpbmdEYXRhID0gZGF0YVxuICAgICAgICAvLyBvbmNlIHJlc29sdmVkLCBpdCB3aWxsIGNhbGwgcmVhbFVwZGF0ZVxuICAgICAgICB0aGlzLnJlc29sdmVDb21wb25lbnQoKVxuICAgICAgfSBlbHNlIGlmIChzdGF0ZSA9PT0gUEVORElORykge1xuICAgICAgICB0aGlzLnBlbmRpbmdEYXRhID0gZGF0YVxuICAgICAgfSBlbHNlIGlmIChzdGF0ZSA9PT0gUkVTT0xWRUQpIHtcbiAgICAgICAgdGhpcy5yZWFsVXBkYXRlKGRhdGEpXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucmVhbFVwZGF0ZShkYXRhKVxuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogVGhlIHJlYWwgdXBkYXRlIHRoYXQgYWN0dWFsbHkgbW9kaWZpZXMgdGhlIERPTS5cbiAgICpcbiAgICogQHBhcmFtIHtBcnJheXxOdW1iZXJ8U3RyaW5nfSBkYXRhXG4gICAqL1xuXG4gIHJlYWxVcGRhdGU6IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgdGhpcy52bXMgPSB0aGlzLmRpZmYoZGF0YSwgdGhpcy52bXMpXG4gICAgLy8gdXBkYXRlIHYtcmVmXG4gICAgaWYgKHRoaXMucmVmSUQpIHtcbiAgICAgIHRoaXMudm0uJFt0aGlzLnJlZklEXSA9IHRoaXMuY29udmVydGVkXG4gICAgICAgID8gdG9SZWZPYmplY3QodGhpcy52bXMpXG4gICAgICAgIDogdGhpcy52bXNcbiAgICB9XG4gICAgaWYgKHRoaXMuZWxJZCkge1xuICAgICAgdGhpcy52bS4kJFt0aGlzLmVsSWRdID0gdGhpcy52bXMubWFwKGZ1bmN0aW9uICh2bSkge1xuICAgICAgICByZXR1cm4gdm0uJGVsXG4gICAgICB9KVxuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogRGlmZiwgYmFzZWQgb24gbmV3IGRhdGEgYW5kIG9sZCBkYXRhLCBkZXRlcm1pbmUgdGhlXG4gICAqIG1pbmltdW0gYW1vdW50IG9mIERPTSBtYW5pcHVsYXRpb25zIG5lZWRlZCB0byBtYWtlIHRoZVxuICAgKiBET00gcmVmbGVjdCB0aGUgbmV3IGRhdGEgQXJyYXkuXG4gICAqXG4gICAqIFRoZSBhbGdvcml0aG0gZGlmZnMgdGhlIG5ldyBkYXRhIEFycmF5IGJ5IHN0b3JpbmcgYVxuICAgKiBoaWRkZW4gcmVmZXJlbmNlIHRvIGFuIG93bmVyIHZtIGluc3RhbmNlIG9uIHByZXZpb3VzbHlcbiAgICogc2VlbiBkYXRhLiBUaGlzIGFsbG93cyB1cyB0byBhY2hpZXZlIE8obikgd2hpY2ggaXNcbiAgICogYmV0dGVyIHRoYW4gYSBsZXZlbnNodGVpbiBkaXN0YW5jZSBiYXNlZCBhbGdvcml0aG0sXG4gICAqIHdoaWNoIGlzIE8obSAqIG4pLlxuICAgKlxuICAgKiBAcGFyYW0ge0FycmF5fSBkYXRhXG4gICAqIEBwYXJhbSB7QXJyYXl9IG9sZFZtc1xuICAgKiBAcmV0dXJuIHtBcnJheX1cbiAgICovXG5cbiAgZGlmZjogZnVuY3Rpb24gKGRhdGEsIG9sZFZtcykge1xuICAgIHZhciBpZEtleSA9IHRoaXMuaWRLZXlcbiAgICB2YXIgY29udmVydGVkID0gdGhpcy5jb252ZXJ0ZWRcbiAgICB2YXIgc3RhcnQgPSB0aGlzLnN0YXJ0XG4gICAgdmFyIGVuZCA9IHRoaXMuZW5kXG4gICAgdmFyIGluRG9jID0gXy5pbkRvYyhzdGFydClcbiAgICB2YXIgYWxpYXMgPSB0aGlzLmFyZ1xuICAgIHZhciBpbml0ID0gIW9sZFZtc1xuICAgIHZhciB2bXMgPSBuZXcgQXJyYXkoZGF0YS5sZW5ndGgpXG4gICAgdmFyIG9iaiwgcmF3LCB2bSwgaSwgbCwgcHJpbWl0aXZlXG4gICAgLy8gRmlyc3QgcGFzcywgZ28gdGhyb3VnaCB0aGUgbmV3IEFycmF5IGFuZCBmaWxsIHVwXG4gICAgLy8gdGhlIG5ldyB2bXMgYXJyYXkuIElmIGEgcGllY2Ugb2YgZGF0YSBoYXMgYSBjYWNoZWRcbiAgICAvLyBpbnN0YW5jZSBmb3IgaXQsIHdlIHJldXNlIGl0LiBPdGhlcndpc2UgYnVpbGQgYSBuZXdcbiAgICAvLyBpbnN0YW5jZS5cbiAgICBmb3IgKGkgPSAwLCBsID0gZGF0YS5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIG9iaiA9IGRhdGFbaV1cbiAgICAgIHJhdyA9IGNvbnZlcnRlZCA/IG9iai4kdmFsdWUgOiBvYmpcbiAgICAgIHByaW1pdGl2ZSA9ICFpc09iamVjdChyYXcpXG4gICAgICB2bSA9ICFpbml0ICYmIHRoaXMuZ2V0Vm0ocmF3LCBpLCBjb252ZXJ0ZWQgPyBvYmouJGtleSA6IG51bGwpXG4gICAgICBpZiAodm0pIHsgLy8gcmV1c2FibGUgaW5zdGFuY2VcbiAgICAgICAgdm0uX3JldXNlZCA9IHRydWVcbiAgICAgICAgdm0uJGluZGV4ID0gaSAvLyB1cGRhdGUgJGluZGV4XG4gICAgICAgIC8vIHVwZGF0ZSBkYXRhIGZvciB0cmFjay1ieSBvciBvYmplY3QgcmVwZWF0LFxuICAgICAgICAvLyBzaW5jZSBpbiB0aGVzZSB0d28gY2FzZXMgdGhlIGRhdGEgaXMgcmVwbGFjZWRcbiAgICAgICAgLy8gcmF0aGVyIHRoYW4gbXV0YXRlZC5cbiAgICAgICAgaWYgKGlkS2V5IHx8IGNvbnZlcnRlZCB8fCBwcmltaXRpdmUpIHtcbiAgICAgICAgICBpZiAoYWxpYXMpIHtcbiAgICAgICAgICAgIHZtW2FsaWFzXSA9IHJhd1xuICAgICAgICAgIH0gZWxzZSBpZiAoXy5pc1BsYWluT2JqZWN0KHJhdykpIHtcbiAgICAgICAgICAgIHZtLiRkYXRhID0gcmF3XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZtLiR2YWx1ZSA9IHJhd1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHsgLy8gbmV3IGluc3RhbmNlXG4gICAgICAgIHZtID0gdGhpcy5idWlsZChvYmosIGksIHRydWUpXG4gICAgICAgIHZtLl9yZXVzZWQgPSBmYWxzZVxuICAgICAgfVxuICAgICAgdm1zW2ldID0gdm1cbiAgICAgIC8vIGluc2VydCBpZiB0aGlzIGlzIGZpcnN0IHJ1blxuICAgICAgaWYgKGluaXQpIHtcbiAgICAgICAgdm0uJGJlZm9yZShlbmQpXG4gICAgICB9XG4gICAgfVxuICAgIC8vIGlmIHRoaXMgaXMgdGhlIGZpcnN0IHJ1biwgd2UncmUgZG9uZS5cbiAgICBpZiAoaW5pdCkge1xuICAgICAgcmV0dXJuIHZtc1xuICAgIH1cbiAgICAvLyBTZWNvbmQgcGFzcywgZ28gdGhyb3VnaCB0aGUgb2xkIHZtIGluc3RhbmNlcyBhbmRcbiAgICAvLyBkZXN0cm95IHRob3NlIHdobyBhcmUgbm90IHJldXNlZCAoYW5kIHJlbW92ZSB0aGVtXG4gICAgLy8gZnJvbSBjYWNoZSlcbiAgICB2YXIgcmVtb3ZhbEluZGV4ID0gMFxuICAgIHZhciB0b3RhbFJlbW92ZWQgPSBvbGRWbXMubGVuZ3RoIC0gdm1zLmxlbmd0aFxuICAgIGZvciAoaSA9IDAsIGwgPSBvbGRWbXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICB2bSA9IG9sZFZtc1tpXVxuICAgICAgaWYgKCF2bS5fcmV1c2VkKSB7XG4gICAgICAgIHRoaXMudW5jYWNoZVZtKHZtKVxuICAgICAgICB2bS4kZGVzdHJveShmYWxzZSwgdHJ1ZSkgLy8gZGVmZXIgY2xlYW51cCB1bnRpbCByZW1vdmFsXG4gICAgICAgIHRoaXMucmVtb3ZlKHZtLCByZW1vdmFsSW5kZXgrKywgdG90YWxSZW1vdmVkLCBpbkRvYylcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gZmluYWwgcGFzcywgbW92ZS9pbnNlcnQgbmV3IGluc3RhbmNlcyBpbnRvIHRoZVxuICAgIC8vIHJpZ2h0IHBsYWNlLlxuICAgIHZhciB0YXJnZXRQcmV2LCBwcmV2RWwsIGN1cnJlbnRQcmV2XG4gICAgdmFyIGluc2VydGlvbkluZGV4ID0gMFxuICAgIGZvciAoaSA9IDAsIGwgPSB2bXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICB2bSA9IHZtc1tpXVxuICAgICAgLy8gdGhpcyBpcyB0aGUgdm0gdGhhdCB3ZSBzaG91bGQgYmUgYWZ0ZXJcbiAgICAgIHRhcmdldFByZXYgPSB2bXNbaSAtIDFdXG4gICAgICBwcmV2RWwgPSB0YXJnZXRQcmV2XG4gICAgICAgID8gdGFyZ2V0UHJldi5fc3RhZ2dlckNiXG4gICAgICAgICAgPyB0YXJnZXRQcmV2Ll9zdGFnZ2VyQW5jaG9yXG4gICAgICAgICAgOiB0YXJnZXRQcmV2Ll9ibG9ja0VuZCB8fCB0YXJnZXRQcmV2LiRlbFxuICAgICAgICA6IHN0YXJ0XG4gICAgICBpZiAodm0uX3JldXNlZCAmJiAhdm0uX3N0YWdnZXJDYikge1xuICAgICAgICBjdXJyZW50UHJldiA9IGZpbmRQcmV2Vm0odm0sIHN0YXJ0KVxuICAgICAgICBpZiAoY3VycmVudFByZXYgIT09IHRhcmdldFByZXYpIHtcbiAgICAgICAgICB0aGlzLm1vdmUodm0sIHByZXZFbClcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gbmV3IGluc3RhbmNlLCBvciBzdGlsbCBpbiBzdGFnZ2VyLlxuICAgICAgICAvLyBpbnNlcnQgd2l0aCB1cGRhdGVkIHN0YWdnZXIgaW5kZXguXG4gICAgICAgIHRoaXMuaW5zZXJ0KHZtLCBpbnNlcnRpb25JbmRleCsrLCBwcmV2RWwsIGluRG9jKVxuICAgICAgfVxuICAgICAgdm0uX3JldXNlZCA9IGZhbHNlXG4gICAgfVxuICAgIHJldHVybiB2bXNcbiAgfSxcblxuICAvKipcbiAgICogQnVpbGQgYSBuZXcgaW5zdGFuY2UgYW5kIGNhY2hlIGl0LlxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YVxuICAgKiBAcGFyYW0ge051bWJlcn0gaW5kZXhcbiAgICogQHBhcmFtIHtCb29sZWFufSBuZWVkQ2FjaGVcbiAgICovXG5cbiAgYnVpbGQ6IGZ1bmN0aW9uIChkYXRhLCBpbmRleCwgbmVlZENhY2hlKSB7XG4gICAgdmFyIG1ldGEgPSB7ICRpbmRleDogaW5kZXggfVxuICAgIGlmICh0aGlzLmNvbnZlcnRlZCkge1xuICAgICAgbWV0YS4ka2V5ID0gZGF0YS4ka2V5XG4gICAgfVxuICAgIHZhciByYXcgPSB0aGlzLmNvbnZlcnRlZCA/IGRhdGEuJHZhbHVlIDogZGF0YVxuICAgIHZhciBhbGlhcyA9IHRoaXMuYXJnXG4gICAgaWYgKGFsaWFzKSB7XG4gICAgICBkYXRhID0ge31cbiAgICAgIGRhdGFbYWxpYXNdID0gcmF3XG4gICAgfSBlbHNlIGlmICghaXNQbGFpbk9iamVjdChyYXcpKSB7XG4gICAgICAvLyBub24tb2JqZWN0IHZhbHVlc1xuICAgICAgZGF0YSA9IHt9XG4gICAgICBtZXRhLiR2YWx1ZSA9IHJhd1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBkZWZhdWx0XG4gICAgICBkYXRhID0gcmF3XG4gICAgfVxuICAgIC8vIHJlc29sdmUgY29uc3RydWN0b3JcbiAgICB2YXIgQ3RvciA9IHRoaXMuQ3RvciB8fCB0aGlzLnJlc29sdmVEeW5hbWljQ29tcG9uZW50KGRhdGEsIG1ldGEpXG4gICAgdmFyIHZtID0gdGhpcy52bS4kYWRkQ2hpbGQoe1xuICAgICAgZWw6IHRlbXBsYXRlUGFyc2VyLmNsb25lKHRoaXMudGVtcGxhdGUpLFxuICAgICAgX2FzQ29tcG9uZW50OiB0aGlzLmFzQ29tcG9uZW50LFxuICAgICAgX2hvc3Q6IHRoaXMuX2hvc3QsXG4gICAgICBfbGlua0ZuOiB0aGlzLl9saW5rRm4sXG4gICAgICBfbWV0YTogbWV0YSxcbiAgICAgIGRhdGE6IGRhdGEsXG4gICAgICBpbmhlcml0OiB0aGlzLmluaGVyaXQsXG4gICAgICB0ZW1wbGF0ZTogdGhpcy5pbmxpbmVUZW1wYWx0ZVxuICAgIH0sIEN0b3IpXG4gICAgLy8gY2FjaGUgaW5zdGFuY2VcbiAgICBpZiAobmVlZENhY2hlKSB7XG4gICAgICB0aGlzLmNhY2hlVm0ocmF3LCB2bSwgaW5kZXgsIHRoaXMuY29udmVydGVkID8gbWV0YS4ka2V5IDogbnVsbClcbiAgICB9XG4gICAgLy8gc3luYyBiYWNrIGNoYW5nZXMgZm9yIHR3by13YXkgYmluZGluZ3Mgb2YgcHJpbWl0aXZlIHZhbHVlc1xuICAgIHZhciB0eXBlID0gdHlwZW9mIHJhd1xuICAgIHZhciBkaXIgPSB0aGlzXG4gICAgaWYgKFxuICAgICAgdGhpcy5yYXdUeXBlID09PSAnb2JqZWN0JyAmJlxuICAgICAgKHR5cGUgPT09ICdzdHJpbmcnIHx8IHR5cGUgPT09ICdudW1iZXInKVxuICAgICkge1xuICAgICAgdm0uJHdhdGNoKGFsaWFzIHx8ICckdmFsdWUnLCBmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgIGlmIChkaXIuZmlsdGVycykge1xuICAgICAgICAgIF8ud2FybihcbiAgICAgICAgICAgICdZb3Ugc2VlbSB0byBiZSBtdXRhdGluZyB0aGUgJHZhbHVlIHJlZmVyZW5jZSBvZiAnICtcbiAgICAgICAgICAgICdhIHYtcmVwZWF0IGluc3RhbmNlIChsaWtlbHkgdGhyb3VnaCB2LW1vZGVsKSAnICtcbiAgICAgICAgICAgICdhbmQgZmlsdGVyaW5nIHRoZSB2LXJlcGVhdCBhdCB0aGUgc2FtZSB0aW1lLiAnICtcbiAgICAgICAgICAgICdUaGlzIHdpbGwgbm90IHdvcmsgcHJvcGVybHkgd2l0aCBhbiBBcnJheSBvZiAnICtcbiAgICAgICAgICAgICdwcmltaXRpdmUgdmFsdWVzLiBQbGVhc2UgdXNlIGFuIEFycmF5IG9mICcgK1xuICAgICAgICAgICAgJ09iamVjdHMgaW5zdGVhZC4nXG4gICAgICAgICAgKVxuICAgICAgICB9XG4gICAgICAgIGRpci5fd2l0aExvY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGlmIChkaXIuY29udmVydGVkKSB7XG4gICAgICAgICAgICBkaXIucmF3VmFsdWVbdm0uJGtleV0gPSB2YWxcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGlyLnJhd1ZhbHVlLiRzZXQodm0uJGluZGV4LCB2YWwpXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgfSlcbiAgICB9XG4gICAgcmV0dXJuIHZtXG4gIH0sXG5cbiAgLyoqXG4gICAqIFVuYmluZCwgdGVhcmRvd24gZXZlcnl0aGluZ1xuICAgKi9cblxuICB1bmJpbmQ6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmNvbXBvbmVudFN0YXRlID0gQUJPUlRFRFxuICAgIGlmICh0aGlzLnJlZklEKSB7XG4gICAgICB0aGlzLnZtLiRbdGhpcy5yZWZJRF0gPSBudWxsXG4gICAgfVxuICAgIGlmICh0aGlzLnZtcykge1xuICAgICAgdmFyIGkgPSB0aGlzLnZtcy5sZW5ndGhcbiAgICAgIHZhciB2bVxuICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICB2bSA9IHRoaXMudm1zW2ldXG4gICAgICAgIHRoaXMudW5jYWNoZVZtKHZtKVxuICAgICAgICB2bS4kZGVzdHJveSgpXG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBDYWNoZSBhIHZtIGluc3RhbmNlIGJhc2VkIG9uIGl0cyBkYXRhLlxuICAgKlxuICAgKiBJZiB0aGUgZGF0YSBpcyBhbiBvYmplY3QsIHdlIHNhdmUgdGhlIHZtJ3MgcmVmZXJlbmNlIG9uXG4gICAqIHRoZSBkYXRhIG9iamVjdCBhcyBhIGhpZGRlbiBwcm9wZXJ0eS4gT3RoZXJ3aXNlIHdlXG4gICAqIGNhY2hlIHRoZW0gaW4gYW4gb2JqZWN0IGFuZCBmb3IgZWFjaCBwcmltaXRpdmUgdmFsdWVcbiAgICogdGhlcmUgaXMgYW4gYXJyYXkgaW4gY2FzZSB0aGVyZSBhcmUgZHVwbGljYXRlcy5cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IGRhdGFcbiAgICogQHBhcmFtIHtWdWV9IHZtXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBpbmRleFxuICAgKiBAcGFyYW0ge1N0cmluZ30gW2tleV1cbiAgICovXG5cbiAgY2FjaGVWbTogZnVuY3Rpb24gKGRhdGEsIHZtLCBpbmRleCwga2V5KSB7XG4gICAgdmFyIGlkS2V5ID0gdGhpcy5pZEtleVxuICAgIHZhciBjYWNoZSA9IHRoaXMuY2FjaGVcbiAgICB2YXIgcHJpbWl0aXZlID0gIWlzT2JqZWN0KGRhdGEpXG4gICAgdmFyIGlkXG4gICAgaWYgKGtleSB8fCBpZEtleSB8fCBwcmltaXRpdmUpIHtcbiAgICAgIGlkID0gaWRLZXlcbiAgICAgICAgPyBpZEtleSA9PT0gJyRpbmRleCdcbiAgICAgICAgICA/IGluZGV4XG4gICAgICAgICAgOiBkYXRhW2lkS2V5XVxuICAgICAgICA6IChrZXkgfHwgaW5kZXgpXG4gICAgICBpZiAoIWNhY2hlW2lkXSkge1xuICAgICAgICBjYWNoZVtpZF0gPSB2bVxuICAgICAgfSBlbHNlIGlmICghcHJpbWl0aXZlICYmIGlkS2V5ICE9PSAnJGluZGV4Jykge1xuICAgICAgICBfLndhcm4oJ0R1cGxpY2F0ZSB0cmFjay1ieSBrZXkgaW4gdi1yZXBlYXQ6ICcgKyBpZClcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWQgPSB0aGlzLmlkXG4gICAgICBpZiAoZGF0YS5oYXNPd25Qcm9wZXJ0eShpZCkpIHtcbiAgICAgICAgaWYgKGRhdGFbaWRdID09PSBudWxsKSB7XG4gICAgICAgICAgZGF0YVtpZF0gPSB2bVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIF8ud2FybihcbiAgICAgICAgICAgICdEdXBsaWNhdGUgb2JqZWN0cyBhcmUgbm90IHN1cHBvcnRlZCBpbiB2LXJlcGVhdCAnICtcbiAgICAgICAgICAgICd3aGVuIHVzaW5nIGNvbXBvbmVudHMgb3IgdHJhbnNpdGlvbnMuJ1xuICAgICAgICAgIClcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgXy5kZWZpbmUoZGF0YSwgaWQsIHZtKVxuICAgICAgfVxuICAgIH1cbiAgICB2bS5fcmF3ID0gZGF0YVxuICB9LFxuXG4gIC8qKlxuICAgKiBUcnkgdG8gZ2V0IGEgY2FjaGVkIGluc3RhbmNlIGZyb20gYSBwaWVjZSBvZiBkYXRhLlxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YVxuICAgKiBAcGFyYW0ge051bWJlcn0gaW5kZXhcbiAgICogQHBhcmFtIHtTdHJpbmd9IFtrZXldXG4gICAqIEByZXR1cm4ge1Z1ZXx1bmRlZmluZWR9XG4gICAqL1xuXG4gIGdldFZtOiBmdW5jdGlvbiAoZGF0YSwgaW5kZXgsIGtleSkge1xuICAgIHZhciBpZEtleSA9IHRoaXMuaWRLZXlcbiAgICB2YXIgcHJpbWl0aXZlID0gIWlzT2JqZWN0KGRhdGEpXG4gICAgaWYgKGtleSB8fCBpZEtleSB8fCBwcmltaXRpdmUpIHtcbiAgICAgIHZhciBpZCA9IGlkS2V5XG4gICAgICAgID8gaWRLZXkgPT09ICckaW5kZXgnXG4gICAgICAgICAgPyBpbmRleFxuICAgICAgICAgIDogZGF0YVtpZEtleV1cbiAgICAgICAgOiAoa2V5IHx8IGluZGV4KVxuICAgICAgcmV0dXJuIHRoaXMuY2FjaGVbaWRdXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBkYXRhW3RoaXMuaWRdXG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBEZWxldGUgYSBjYWNoZWQgdm0gaW5zdGFuY2UuXG4gICAqXG4gICAqIEBwYXJhbSB7VnVlfSB2bVxuICAgKi9cblxuICB1bmNhY2hlVm06IGZ1bmN0aW9uICh2bSkge1xuICAgIHZhciBkYXRhID0gdm0uX3Jhd1xuICAgIHZhciBpZEtleSA9IHRoaXMuaWRLZXlcbiAgICB2YXIgaW5kZXggPSB2bS4kaW5kZXhcbiAgICB2YXIga2V5ID0gdm0uJGtleVxuICAgIHZhciBwcmltaXRpdmUgPSAhaXNPYmplY3QoZGF0YSlcbiAgICBpZiAoaWRLZXkgfHwga2V5IHx8IHByaW1pdGl2ZSkge1xuICAgICAgdmFyIGlkID0gaWRLZXlcbiAgICAgICAgPyBpZEtleSA9PT0gJyRpbmRleCdcbiAgICAgICAgICA/IGluZGV4XG4gICAgICAgICAgOiBkYXRhW2lkS2V5XVxuICAgICAgICA6IChrZXkgfHwgaW5kZXgpXG4gICAgICB0aGlzLmNhY2hlW2lkXSA9IG51bGxcbiAgICB9IGVsc2Uge1xuICAgICAgZGF0YVt0aGlzLmlkXSA9IG51bGxcbiAgICAgIHZtLl9yYXcgPSBudWxsXG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBQcmUtcHJvY2VzcyB0aGUgdmFsdWUgYmVmb3JlIHBpcGluZyBpdCB0aHJvdWdoIHRoZVxuICAgKiBmaWx0ZXJzLCBhbmQgY29udmVydCBub24tQXJyYXkgb2JqZWN0cyB0byBhcnJheXMuXG4gICAqXG4gICAqIFRoaXMgZnVuY3Rpb24gd2lsbCBiZSBib3VuZCB0byB0aGlzIGRpcmVjdGl2ZSBpbnN0YW5jZVxuICAgKiBhbmQgcGFzc2VkIGludG8gdGhlIHdhdGNoZXIuXG4gICAqXG4gICAqIEBwYXJhbSB7Kn0gdmFsdWVcbiAgICogQHJldHVybiB7QXJyYXl9XG4gICAqIEBwcml2YXRlXG4gICAqL1xuXG4gIF9wcmVQcm9jZXNzOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAvLyByZWdhcmRsZXNzIG9mIHR5cGUsIHN0b3JlIHRoZSB1bi1maWx0ZXJlZCByYXcgdmFsdWUuXG4gICAgdGhpcy5yYXdWYWx1ZSA9IHZhbHVlXG4gICAgdmFyIHR5cGUgPSB0aGlzLnJhd1R5cGUgPSB0eXBlb2YgdmFsdWVcbiAgICBpZiAoIWlzUGxhaW5PYmplY3QodmFsdWUpKSB7XG4gICAgICB0aGlzLmNvbnZlcnRlZCA9IGZhbHNlXG4gICAgICBpZiAodHlwZSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgdmFsdWUgPSByYW5nZSh2YWx1ZSlcbiAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgdmFsdWUgPSBfLnRvQXJyYXkodmFsdWUpXG4gICAgICB9XG4gICAgICByZXR1cm4gdmFsdWUgfHwgW11cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gY29udmVydCBwbGFpbiBvYmplY3QgdG8gYXJyYXkuXG4gICAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKHZhbHVlKVxuICAgICAgdmFyIGkgPSBrZXlzLmxlbmd0aFxuICAgICAgdmFyIHJlcyA9IG5ldyBBcnJheShpKVxuICAgICAgdmFyIGtleVxuICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICBrZXkgPSBrZXlzW2ldXG4gICAgICAgIHJlc1tpXSA9IHtcbiAgICAgICAgICAka2V5OiBrZXksXG4gICAgICAgICAgJHZhbHVlOiB2YWx1ZVtrZXldXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMuY29udmVydGVkID0gdHJ1ZVxuICAgICAgcmV0dXJuIHJlc1xuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogSW5zZXJ0IGFuIGluc3RhbmNlLlxuICAgKlxuICAgKiBAcGFyYW0ge1Z1ZX0gdm1cbiAgICogQHBhcmFtIHtOdW1iZXJ9IGluZGV4XG4gICAqIEBwYXJhbSB7Tm9kZX0gcHJldkVsXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gaW5Eb2NcbiAgICovXG5cbiAgaW5zZXJ0OiBmdW5jdGlvbiAodm0sIGluZGV4LCBwcmV2RWwsIGluRG9jKSB7XG4gICAgaWYgKHZtLl9zdGFnZ2VyQ2IpIHtcbiAgICAgIHZtLl9zdGFnZ2VyQ2IuY2FuY2VsKClcbiAgICAgIHZtLl9zdGFnZ2VyQ2IgPSBudWxsXG4gICAgfVxuICAgIHZhciBzdGFnZ2VyQW1vdW50ID0gdGhpcy5nZXRTdGFnZ2VyKHZtLCBpbmRleCwgbnVsbCwgJ2VudGVyJylcbiAgICBpZiAoaW5Eb2MgJiYgc3RhZ2dlckFtb3VudCkge1xuICAgICAgLy8gY3JlYXRlIGFuIGFuY2hvciBhbmQgaW5zZXJ0IGl0IHN5bmNocm9ub3VzbHksXG4gICAgICAvLyBzbyB0aGF0IHdlIGNhbiByZXNvbHZlIHRoZSBjb3JyZWN0IG9yZGVyIHdpdGhvdXRcbiAgICAgIC8vIHdvcnJ5aW5nIGFib3V0IHNvbWUgZWxlbWVudHMgbm90IGluc2VydGVkIHlldFxuICAgICAgdmFyIGFuY2hvciA9IHZtLl9zdGFnZ2VyQW5jaG9yXG4gICAgICBpZiAoIWFuY2hvcikge1xuICAgICAgICBhbmNob3IgPSB2bS5fc3RhZ2dlckFuY2hvciA9IF8uY3JlYXRlQW5jaG9yKCdzdGFnZ2VyLWFuY2hvcicpXG4gICAgICAgIGFuY2hvci5fX3Z1ZV9fID0gdm1cbiAgICAgIH1cbiAgICAgIF8uYWZ0ZXIoYW5jaG9yLCBwcmV2RWwpXG4gICAgICB2YXIgb3AgPSB2bS5fc3RhZ2dlckNiID0gXy5jYW5jZWxsYWJsZShmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZtLl9zdGFnZ2VyQ2IgPSBudWxsXG4gICAgICAgIHZtLiRiZWZvcmUoYW5jaG9yKVxuICAgICAgICBfLnJlbW92ZShhbmNob3IpXG4gICAgICB9KVxuICAgICAgc2V0VGltZW91dChvcCwgc3RhZ2dlckFtb3VudClcbiAgICB9IGVsc2Uge1xuICAgICAgdm0uJGFmdGVyKHByZXZFbClcbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIE1vdmUgYW4gYWxyZWFkeSBpbnNlcnRlZCBpbnN0YW5jZS5cbiAgICpcbiAgICogQHBhcmFtIHtWdWV9IHZtXG4gICAqIEBwYXJhbSB7Tm9kZX0gcHJldkVsXG4gICAqL1xuXG4gIG1vdmU6IGZ1bmN0aW9uICh2bSwgcHJldkVsKSB7XG4gICAgdm0uJGFmdGVyKHByZXZFbCwgbnVsbCwgZmFsc2UpXG4gIH0sXG5cbiAgLyoqXG4gICAqIFJlbW92ZSBhbiBpbnN0YW5jZS5cbiAgICpcbiAgICogQHBhcmFtIHtWdWV9IHZtXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBpbmRleFxuICAgKiBAcGFyYW0ge0Jvb2xlYW59IGluRG9jXG4gICAqL1xuXG4gIHJlbW92ZTogZnVuY3Rpb24gKHZtLCBpbmRleCwgdG90YWwsIGluRG9jKSB7XG4gICAgaWYgKHZtLl9zdGFnZ2VyQ2IpIHtcbiAgICAgIHZtLl9zdGFnZ2VyQ2IuY2FuY2VsKClcbiAgICAgIHZtLl9zdGFnZ2VyQ2IgPSBudWxsXG4gICAgICAvLyBpdCdzIG5vdCBwb3NzaWJsZSBmb3IgdGhlIHNhbWUgdm0gdG8gYmUgcmVtb3ZlZFxuICAgICAgLy8gdHdpY2UsIHNvIGlmIHdlIGhhdmUgYSBwZW5kaW5nIHN0YWdnZXIgY2FsbGJhY2ssXG4gICAgICAvLyBpdCBtZWFucyB0aGlzIHZtIGlzIHF1ZXVlZCBmb3IgZW50ZXIgYnV0IHJlbW92ZWRcbiAgICAgIC8vIGJlZm9yZSBpdHMgdHJhbnNpdGlvbiBzdGFydGVkLiBTaW5jZSBpdCBpcyBhbHJlYWR5XG4gICAgICAvLyBkZXN0cm95ZWQsIHdlIGNhbiBqdXN0IGxlYXZlIGl0IGluIGRldGFjaGVkIHN0YXRlLlxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIHZhciBzdGFnZ2VyQW1vdW50ID0gdGhpcy5nZXRTdGFnZ2VyKHZtLCBpbmRleCwgdG90YWwsICdsZWF2ZScpXG4gICAgaWYgKGluRG9jICYmIHN0YWdnZXJBbW91bnQpIHtcbiAgICAgIHZhciBvcCA9IHZtLl9zdGFnZ2VyQ2IgPSBfLmNhbmNlbGxhYmxlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdm0uX3N0YWdnZXJDYiA9IG51bGxcbiAgICAgICAgcmVtb3ZlKClcbiAgICAgIH0pXG4gICAgICBzZXRUaW1lb3V0KG9wLCBzdGFnZ2VyQW1vdW50KVxuICAgIH0gZWxzZSB7XG4gICAgICByZW1vdmUoKVxuICAgIH1cbiAgICBmdW5jdGlvbiByZW1vdmUgKCkge1xuICAgICAgdm0uJHJlbW92ZShmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZtLl9jbGVhbnVwKClcbiAgICAgIH0pXG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIHN0YWdnZXIgYW1vdW50IGZvciBhbiBpbnNlcnRpb24vcmVtb3ZhbC5cbiAgICpcbiAgICogQHBhcmFtIHtWdWV9IHZtXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBpbmRleFxuICAgKiBAcGFyYW0ge1N0cmluZ30gdHlwZVxuICAgKiBAcGFyYW0ge051bWJlcn0gdG90YWxcbiAgICovXG5cbiAgZ2V0U3RhZ2dlcjogZnVuY3Rpb24gKHZtLCBpbmRleCwgdG90YWwsIHR5cGUpIHtcbiAgICB0eXBlID0gdHlwZSArICdTdGFnZ2VyJ1xuICAgIHZhciB0cmFuc2l0aW9uID0gdm0uJGVsLl9fdl90cmFuc1xuICAgIHZhciBob29rcyA9IHRyYW5zaXRpb24gJiYgdHJhbnNpdGlvbi5ob29rc1xuICAgIHZhciBob29rID0gaG9va3MgJiYgKGhvb2tzW3R5cGVdIHx8IGhvb2tzLnN0YWdnZXIpXG4gICAgcmV0dXJuIGhvb2tcbiAgICAgID8gaG9vay5jYWxsKHZtLCBpbmRleCwgdG90YWwpXG4gICAgICA6IGluZGV4ICogdGhpc1t0eXBlXVxuICB9XG5cbn1cblxuLyoqXG4gKiBIZWxwZXIgdG8gZmluZCB0aGUgcHJldmlvdXMgZWxlbWVudCB0aGF0IGlzIGFuIGluc3RhbmNlXG4gKiByb290IG5vZGUuIFRoaXMgaXMgbmVjZXNzYXJ5IGJlY2F1c2UgYSBkZXN0cm95ZWQgdm0nc1xuICogZWxlbWVudCBjb3VsZCBzdGlsbCBiZSBsaW5nZXJpbmcgaW4gdGhlIERPTSBiZWZvcmUgaXRzXG4gKiBsZWF2aW5nIHRyYW5zaXRpb24gZmluaXNoZXMsIGJ1dCBpdHMgX192dWVfXyByZWZlcmVuY2VcbiAqIHNob3VsZCBoYXZlIGJlZW4gcmVtb3ZlZCBzbyB3ZSBjYW4gc2tpcCB0aGVtLlxuICpcbiAqIEBwYXJhbSB7VnVlfSB2bVxuICogQHBhcmFtIHtDb21tZW50fFRleHR9IGFuY2hvclxuICogQHJldHVybiB7VnVlfVxuICovXG5cbmZ1bmN0aW9uIGZpbmRQcmV2Vm0gKHZtLCBhbmNob3IpIHtcbiAgdmFyIGVsID0gdm0uJGVsLnByZXZpb3VzU2libGluZ1xuICB3aGlsZSAoIWVsLl9fdnVlX18gJiYgZWwgIT09IGFuY2hvcikge1xuICAgIGVsID0gZWwucHJldmlvdXNTaWJsaW5nXG4gIH1cbiAgcmV0dXJuIGVsLl9fdnVlX19cbn1cblxuLyoqXG4gKiBDcmVhdGUgYSByYW5nZSBhcnJheSBmcm9tIGdpdmVuIG51bWJlci5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gblxuICogQHJldHVybiB7QXJyYXl9XG4gKi9cblxuZnVuY3Rpb24gcmFuZ2UgKG4pIHtcbiAgdmFyIGkgPSAtMVxuICB2YXIgcmV0ID0gbmV3IEFycmF5KG4pXG4gIHdoaWxlICgrK2kgPCBuKSB7XG4gICAgcmV0W2ldID0gaVxuICB9XG4gIHJldHVybiByZXRcbn1cblxuLyoqXG4gKiBDb252ZXJ0IGEgdm1zIGFycmF5IHRvIGFuIG9iamVjdCByZWYgZm9yIHYtcmVmIG9uIGFuXG4gKiBPYmplY3QgdmFsdWUuXG4gKlxuICogQHBhcmFtIHtBcnJheX0gdm1zXG4gKiBAcmV0dXJuIHtPYmplY3R9XG4gKi9cblxuZnVuY3Rpb24gdG9SZWZPYmplY3QgKHZtcykge1xuICB2YXIgcmVmID0ge31cbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB2bXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgcmVmW3Ztc1tpXS4ka2V5XSA9IHZtc1tpXVxuICB9XG4gIHJldHVybiByZWZcbn0iLCJ2YXIgdHJhbnNpdGlvbiA9IHJlcXVpcmUoJy4uL3RyYW5zaXRpb24nKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICB2YXIgZWwgPSB0aGlzLmVsXG4gIHRyYW5zaXRpb24uYXBwbHkoZWwsIHZhbHVlID8gMSA6IC0xLCBmdW5jdGlvbiAoKSB7XG4gICAgZWwuc3R5bGUuZGlzcGxheSA9IHZhbHVlID8gJycgOiAnbm9uZSdcbiAgfSwgdGhpcy52bSlcbn0iLCJ2YXIgXyA9IHJlcXVpcmUoJy4uL3V0aWwnKVxudmFyIHByZWZpeGVzID0gWyctd2Via2l0LScsICctbW96LScsICctbXMtJ11cbnZhciBjYW1lbFByZWZpeGVzID0gWydXZWJraXQnLCAnTW96JywgJ21zJ11cbnZhciBpbXBvcnRhbnRSRSA9IC8haW1wb3J0YW50Oz8kL1xudmFyIGNhbWVsUkUgPSAvKFthLXpdKShbQS1aXSkvZ1xudmFyIHRlc3RFbCA9IG51bGxcbnZhciBwcm9wQ2FjaGUgPSB7fVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuICBkZWVwOiB0cnVlLFxuXG4gIHVwZGF0ZTogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgaWYgKHRoaXMuYXJnKSB7XG4gICAgICB0aGlzLnNldFByb3AodGhpcy5hcmcsIHZhbHVlKVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAvLyBjYWNoZSBvYmplY3Qgc3R5bGVzIHNvIHRoYXQgb25seSBjaGFuZ2VkIHByb3BzXG4gICAgICAgIC8vIGFyZSBhY3R1YWxseSB1cGRhdGVkLlxuICAgICAgICBpZiAoIXRoaXMuY2FjaGUpIHRoaXMuY2FjaGUgPSB7fVxuICAgICAgICBmb3IgKHZhciBwcm9wIGluIHZhbHVlKSB7XG4gICAgICAgICAgdGhpcy5zZXRQcm9wKHByb3AsIHZhbHVlW3Byb3BdKVxuICAgICAgICAgIC8qIGpzaGludCBlcWVxZXE6IGZhbHNlICovXG4gICAgICAgICAgaWYgKHZhbHVlW3Byb3BdICE9IHRoaXMuY2FjaGVbcHJvcF0pIHtcbiAgICAgICAgICAgIHRoaXMuY2FjaGVbcHJvcF0gPSB2YWx1ZVtwcm9wXVxuICAgICAgICAgICAgdGhpcy5zZXRQcm9wKHByb3AsIHZhbHVlW3Byb3BdKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5lbC5zdHlsZS5jc3NUZXh0ID0gdmFsdWVcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgc2V0UHJvcDogZnVuY3Rpb24gKHByb3AsIHZhbHVlKSB7XG4gICAgcHJvcCA9IG5vcm1hbGl6ZShwcm9wKVxuICAgIGlmICghcHJvcCkgcmV0dXJuIC8vIHVuc3VwcG9ydGVkIHByb3BcbiAgICAvLyBjYXN0IHBvc3NpYmxlIG51bWJlcnMvYm9vbGVhbnMgaW50byBzdHJpbmdzXG4gICAgaWYgKHZhbHVlICE9IG51bGwpIHZhbHVlICs9ICcnXG4gICAgaWYgKHZhbHVlKSB7XG4gICAgICB2YXIgaXNJbXBvcnRhbnQgPSBpbXBvcnRhbnRSRS50ZXN0KHZhbHVlKVxuICAgICAgICA/ICdpbXBvcnRhbnQnXG4gICAgICAgIDogJydcbiAgICAgIGlmIChpc0ltcG9ydGFudCkge1xuICAgICAgICB2YWx1ZSA9IHZhbHVlLnJlcGxhY2UoaW1wb3J0YW50UkUsICcnKS50cmltKClcbiAgICAgIH1cbiAgICAgIHRoaXMuZWwuc3R5bGUuc2V0UHJvcGVydHkocHJvcCwgdmFsdWUsIGlzSW1wb3J0YW50KVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmVsLnN0eWxlLnJlbW92ZVByb3BlcnR5KHByb3ApXG4gICAgfVxuICB9XG5cbn1cblxuLyoqXG4gKiBOb3JtYWxpemUgYSBDU1MgcHJvcGVydHkgbmFtZS5cbiAqIC0gY2FjaGUgcmVzdWx0XG4gKiAtIGF1dG8gcHJlZml4XG4gKiAtIGNhbWVsQ2FzZSAtPiBkYXNoLWNhc2VcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gcHJvcFxuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZSAocHJvcCkge1xuICBpZiAocHJvcENhY2hlW3Byb3BdKSB7XG4gICAgcmV0dXJuIHByb3BDYWNoZVtwcm9wXVxuICB9XG4gIHZhciByZXMgPSBwcmVmaXgocHJvcClcbiAgcHJvcENhY2hlW3Byb3BdID0gcHJvcENhY2hlW3Jlc10gPSByZXNcbiAgcmV0dXJuIHJlc1xufVxuXG4vKipcbiAqIEF1dG8gZGV0ZWN0IHRoZSBhcHByb3ByaWF0ZSBwcmVmaXggZm9yIGEgQ1NTIHByb3BlcnR5LlxuICogaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20vcGF1bGlyaXNoLzUyMzY5MlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBwcm9wXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKi9cblxuZnVuY3Rpb24gcHJlZml4IChwcm9wKSB7XG4gIHByb3AgPSBwcm9wLnJlcGxhY2UoY2FtZWxSRSwgJyQxLSQyJykudG9Mb3dlckNhc2UoKVxuICB2YXIgY2FtZWwgPSBfLmNhbWVsaXplKHByb3ApXG4gIHZhciB1cHBlciA9IGNhbWVsLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgY2FtZWwuc2xpY2UoMSlcbiAgaWYgKCF0ZXN0RWwpIHtcbiAgICB0ZXN0RWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICB9XG4gIGlmIChjYW1lbCBpbiB0ZXN0RWwuc3R5bGUpIHtcbiAgICByZXR1cm4gcHJvcFxuICB9XG4gIHZhciBpID0gcHJlZml4ZXMubGVuZ3RoXG4gIHZhciBwcmVmaXhlZFxuICB3aGlsZSAoaS0tKSB7XG4gICAgcHJlZml4ZWQgPSBjYW1lbFByZWZpeGVzW2ldICsgdXBwZXJcbiAgICBpZiAocHJlZml4ZWQgaW4gdGVzdEVsLnN0eWxlKSB7XG4gICAgICByZXR1cm4gcHJlZml4ZXNbaV0gKyBwcm9wXG4gICAgfVxuICB9XG59IiwidmFyIF8gPSByZXF1aXJlKCcuLi91dGlsJylcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cbiAgYmluZDogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuYXR0ciA9IHRoaXMuZWwubm9kZVR5cGUgPT09IDNcbiAgICAgID8gJ25vZGVWYWx1ZSdcbiAgICAgIDogJ3RleHRDb250ZW50J1xuICB9LFxuXG4gIHVwZGF0ZTogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgdGhpcy5lbFt0aGlzLmF0dHJdID0gXy50b1N0cmluZyh2YWx1ZSlcbiAgfVxuICBcbn0iLCJ2YXIgXyA9IHJlcXVpcmUoJy4uL3V0aWwnKVxudmFyIFRyYW5zaXRpb24gPSByZXF1aXJlKCcuLi90cmFuc2l0aW9uL3RyYW5zaXRpb24nKVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuICBwcmlvcml0eTogMTAwMCxcbiAgaXNMaXRlcmFsOiB0cnVlLFxuXG4gIGJpbmQ6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMuX2lzRHluYW1pY0xpdGVyYWwpIHtcbiAgICAgIHRoaXMudXBkYXRlKHRoaXMuZXhwcmVzc2lvbilcbiAgICB9XG4gIH0sXG5cbiAgdXBkYXRlOiBmdW5jdGlvbiAoaWQsIG9sZElkKSB7XG4gICAgdmFyIGVsID0gdGhpcy5lbFxuICAgIHZhciB2bSA9IHRoaXMuZWwuX192dWVfXyB8fCB0aGlzLnZtXG4gICAgdmFyIGhvb2tzID0gXy5yZXNvbHZlQXNzZXQodm0uJG9wdGlvbnMsICd0cmFuc2l0aW9ucycsIGlkKVxuICAgIGlkID0gaWQgfHwgJ3YnXG4gICAgZWwuX192X3RyYW5zID0gbmV3IFRyYW5zaXRpb24oZWwsIGlkLCBob29rcywgdm0pXG4gICAgaWYgKG9sZElkKSB7XG4gICAgICBfLnJlbW92ZUNsYXNzKGVsLCBvbGRJZCArICctdHJhbnNpdGlvbicpXG4gICAgfVxuICAgIF8uYWRkQ2xhc3MoZWwsIGlkICsgJy10cmFuc2l0aW9uJylcbiAgfVxuXG59IiwidmFyIF8gPSByZXF1aXJlKCcuLi91dGlsJylcbnZhciBQYXRoID0gcmVxdWlyZSgnLi4vcGFyc2Vycy9wYXRoJylcblxuLyoqXG4gKiBGaWx0ZXIgZmlsdGVyIGZvciB2LXJlcGVhdFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzZWFyY2hLZXlcbiAqIEBwYXJhbSB7U3RyaW5nfSBbZGVsaW1pdGVyXVxuICogQHBhcmFtIHtTdHJpbmd9IGRhdGFLZXlcbiAqL1xuXG5leHBvcnRzLmZpbHRlckJ5ID0gZnVuY3Rpb24gKGFyciwgc2VhcmNoLCBkZWxpbWl0ZXIsIGRhdGFLZXkpIHtcbiAgLy8gYWxsb3cgb3B0aW9uYWwgYGluYCBkZWxpbWl0ZXJcbiAgLy8gYmVjYXVzZSB3aHkgbm90XG4gIGlmIChkZWxpbWl0ZXIgJiYgZGVsaW1pdGVyICE9PSAnaW4nKSB7XG4gICAgZGF0YUtleSA9IGRlbGltaXRlclxuICB9XG4gIGlmICghc2VhcmNoKSB7XG4gICAgcmV0dXJuIGFyclxuICB9XG4gIC8vIGNhc3QgdG8gbG93ZXJjYXNlIHN0cmluZ1xuICBzZWFyY2ggPSAoJycgKyBzZWFyY2gpLnRvTG93ZXJDYXNlKClcbiAgcmV0dXJuIGFyci5maWx0ZXIoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICByZXR1cm4gZGF0YUtleVxuICAgICAgPyBjb250YWlucyhQYXRoLmdldChpdGVtLCBkYXRhS2V5KSwgc2VhcmNoKVxuICAgICAgOiBjb250YWlucyhpdGVtLCBzZWFyY2gpXG4gIH0pXG59XG5cbi8qKlxuICogRmlsdGVyIGZpbHRlciBmb3Igdi1yZXBlYXRcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc29ydEtleVxuICogQHBhcmFtIHtTdHJpbmd9IHJldmVyc2VcbiAqL1xuXG5leHBvcnRzLm9yZGVyQnkgPSBmdW5jdGlvbiAoYXJyLCBzb3J0S2V5LCByZXZlcnNlKSB7XG4gIGlmICghc29ydEtleSkge1xuICAgIHJldHVybiBhcnJcbiAgfVxuICB2YXIgb3JkZXIgPSAxXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMikge1xuICAgIGlmIChyZXZlcnNlID09PSAnLTEnKSB7XG4gICAgICBvcmRlciA9IC0xXG4gICAgfSBlbHNlIHtcbiAgICAgIG9yZGVyID0gcmV2ZXJzZSA/IC0xIDogMVxuICAgIH1cbiAgfVxuICAvLyBzb3J0IG9uIGEgY29weSB0byBhdm9pZCBtdXRhdGluZyBvcmlnaW5hbCBhcnJheVxuICByZXR1cm4gYXJyLnNsaWNlKCkuc29ydChmdW5jdGlvbiAoYSwgYikge1xuICAgIGlmIChzb3J0S2V5ICE9PSAnJGtleScgJiYgc29ydEtleSAhPT0gJyR2YWx1ZScpIHtcbiAgICAgIGlmIChhICYmICckdmFsdWUnIGluIGEpIGEgPSBhLiR2YWx1ZVxuICAgICAgaWYgKGIgJiYgJyR2YWx1ZScgaW4gYikgYiA9IGIuJHZhbHVlXG4gICAgfVxuICAgIGEgPSBfLmlzT2JqZWN0KGEpID8gUGF0aC5nZXQoYSwgc29ydEtleSkgOiBhXG4gICAgYiA9IF8uaXNPYmplY3QoYikgPyBQYXRoLmdldChiLCBzb3J0S2V5KSA6IGJcbiAgICByZXR1cm4gYSA9PT0gYiA/IDAgOiBhID4gYiA/IG9yZGVyIDogLW9yZGVyXG4gIH0pXG59XG5cbi8qKlxuICogU3RyaW5nIGNvbnRhaW4gaGVscGVyXG4gKlxuICogQHBhcmFtIHsqfSB2YWxcbiAqIEBwYXJhbSB7U3RyaW5nfSBzZWFyY2hcbiAqL1xuXG5mdW5jdGlvbiBjb250YWlucyAodmFsLCBzZWFyY2gpIHtcbiAgaWYgKF8uaXNQbGFpbk9iamVjdCh2YWwpKSB7XG4gICAgZm9yICh2YXIga2V5IGluIHZhbCkge1xuICAgICAgaWYgKGNvbnRhaW5zKHZhbFtrZXldLCBzZWFyY2gpKSB7XG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgICB9XG4gICAgfVxuICB9IGVsc2UgaWYgKF8uaXNBcnJheSh2YWwpKSB7XG4gICAgdmFyIGkgPSB2YWwubGVuZ3RoXG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgaWYgKGNvbnRhaW5zKHZhbFtpXSwgc2VhcmNoKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIGlmICh2YWwgIT0gbnVsbCkge1xuICAgIHJldHVybiB2YWwudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpLmluZGV4T2Yoc2VhcmNoKSA+IC0xXG4gIH1cbn0iLCJ2YXIgXyA9IHJlcXVpcmUoJy4uL3V0aWwnKVxuXG4vKipcbiAqIFN0cmluZ2lmeSB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gaW5kZW50XG4gKi9cblxuZXhwb3J0cy5qc29uID0ge1xuICByZWFkOiBmdW5jdGlvbiAodmFsdWUsIGluZGVudCkge1xuICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnXG4gICAgICA/IHZhbHVlXG4gICAgICA6IEpTT04uc3RyaW5naWZ5KHZhbHVlLCBudWxsLCBOdW1iZXIoaW5kZW50KSB8fCAyKVxuICB9LFxuICB3cml0ZTogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBKU09OLnBhcnNlKHZhbHVlKVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybiB2YWx1ZVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqICdhYmMnID0+ICdBYmMnXG4gKi9cblxuZXhwb3J0cy5jYXBpdGFsaXplID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIGlmICghdmFsdWUgJiYgdmFsdWUgIT09IDApIHJldHVybiAnJ1xuICB2YWx1ZSA9IHZhbHVlLnRvU3RyaW5nKClcbiAgcmV0dXJuIHZhbHVlLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgdmFsdWUuc2xpY2UoMSlcbn1cblxuLyoqXG4gKiAnYWJjJyA9PiAnQUJDJ1xuICovXG5cbmV4cG9ydHMudXBwZXJjYXNlID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIHJldHVybiAodmFsdWUgfHwgdmFsdWUgPT09IDApXG4gICAgPyB2YWx1ZS50b1N0cmluZygpLnRvVXBwZXJDYXNlKClcbiAgICA6ICcnXG59XG5cbi8qKlxuICogJ0FiQycgPT4gJ2FiYydcbiAqL1xuXG5leHBvcnRzLmxvd2VyY2FzZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICByZXR1cm4gKHZhbHVlIHx8IHZhbHVlID09PSAwKVxuICAgID8gdmFsdWUudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpXG4gICAgOiAnJ1xufVxuXG4vKipcbiAqIDEyMzQ1ID0+ICQxMiwzNDUuMDBcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc2lnblxuICovXG5cbnZhciBkaWdpdHNSRSA9IC8oXFxkezN9KSg/PVxcZCkvZ1xuXG5leHBvcnRzLmN1cnJlbmN5ID0gZnVuY3Rpb24gKHZhbHVlLCBzaWduKSB7XG4gIHZhbHVlID0gcGFyc2VGbG9hdCh2YWx1ZSlcbiAgaWYgKCFpc0Zpbml0ZSh2YWx1ZSkgfHwgKCF2YWx1ZSAmJiB2YWx1ZSAhPT0gMCkpIHJldHVybiAnJ1xuICBzaWduID0gc2lnbiB8fCAnJCdcbiAgdmFyIHMgPSBNYXRoLmZsb29yKE1hdGguYWJzKHZhbHVlKSkudG9TdHJpbmcoKSxcbiAgICBpID0gcy5sZW5ndGggJSAzLFxuICAgIGggPSBpID4gMFxuICAgICAgPyAocy5zbGljZSgwLCBpKSArIChzLmxlbmd0aCA+IDMgPyAnLCcgOiAnJykpXG4gICAgICA6ICcnLFxuICAgIHYgPSBNYXRoLmFicyhwYXJzZUludCgodmFsdWUgKiAxMDApICUgMTAwLCAxMCkpLFxuICAgIGYgPSAnLicgKyAodiA8IDEwID8gKCcwJyArIHYpIDogdilcbiAgcmV0dXJuICh2YWx1ZSA8IDAgPyAnLScgOiAnJykgK1xuICAgIHNpZ24gKyBoICsgcy5zbGljZShpKS5yZXBsYWNlKGRpZ2l0c1JFLCAnJDEsJykgKyBmXG59XG5cbi8qKlxuICogJ2l0ZW0nID0+ICdpdGVtcydcbiAqXG4gKiBAcGFyYW1zXG4gKiAgYW4gYXJyYXkgb2Ygc3RyaW5ncyBjb3JyZXNwb25kaW5nIHRvXG4gKiAgdGhlIHNpbmdsZSwgZG91YmxlLCB0cmlwbGUgLi4uIGZvcm1zIG9mIHRoZSB3b3JkIHRvXG4gKiAgYmUgcGx1cmFsaXplZC4gV2hlbiB0aGUgbnVtYmVyIHRvIGJlIHBsdXJhbGl6ZWRcbiAqICBleGNlZWRzIHRoZSBsZW5ndGggb2YgdGhlIGFyZ3MsIGl0IHdpbGwgdXNlIHRoZSBsYXN0XG4gKiAgZW50cnkgaW4gdGhlIGFycmF5LlxuICpcbiAqICBlLmcuIFsnc2luZ2xlJywgJ2RvdWJsZScsICd0cmlwbGUnLCAnbXVsdGlwbGUnXVxuICovXG5cbmV4cG9ydHMucGx1cmFsaXplID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIHZhciBhcmdzID0gXy50b0FycmF5KGFyZ3VtZW50cywgMSlcbiAgcmV0dXJuIGFyZ3MubGVuZ3RoID4gMVxuICAgID8gKGFyZ3NbdmFsdWUgJSAxMCAtIDFdIHx8IGFyZ3NbYXJncy5sZW5ndGggLSAxXSlcbiAgICA6IChhcmdzWzBdICsgKHZhbHVlID09PSAxID8gJycgOiAncycpKVxufVxuXG4vKipcbiAqIEEgc3BlY2lhbCBmaWx0ZXIgdGhhdCB0YWtlcyBhIGhhbmRsZXIgZnVuY3Rpb24sXG4gKiB3cmFwcyBpdCBzbyBpdCBvbmx5IGdldHMgdHJpZ2dlcmVkIG9uIHNwZWNpZmljXG4gKiBrZXlwcmVzc2VzLiB2LW9uIG9ubHkuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGtleVxuICovXG5cbnZhciBrZXlDb2RlcyA9IHtcbiAgZW50ZXIgICAgOiAxMyxcbiAgdGFiICAgICAgOiA5LFxuICAnZGVsZXRlJyA6IDQ2LFxuICB1cCAgICAgICA6IDM4LFxuICBsZWZ0ICAgICA6IDM3LFxuICByaWdodCAgICA6IDM5LFxuICBkb3duICAgICA6IDQwLFxuICBlc2MgICAgICA6IDI3XG59XG5cbmV4cG9ydHMua2V5ID0gZnVuY3Rpb24gKGhhbmRsZXIsIGtleSkge1xuICBpZiAoIWhhbmRsZXIpIHJldHVyblxuICB2YXIgY29kZSA9IGtleUNvZGVzW2tleV1cbiAgaWYgKCFjb2RlKSB7XG4gICAgY29kZSA9IHBhcnNlSW50KGtleSwgMTApXG4gIH1cbiAgcmV0dXJuIGZ1bmN0aW9uIChlKSB7XG4gICAgaWYgKGUua2V5Q29kZSA9PT0gY29kZSkge1xuICAgICAgcmV0dXJuIGhhbmRsZXIuY2FsbCh0aGlzLCBlKVxuICAgIH1cbiAgfVxufVxuXG4vLyBleHBvc2Uga2V5Y29kZSBoYXNoXG5leHBvcnRzLmtleS5rZXlDb2RlcyA9IGtleUNvZGVzXG5cbi8qKlxuICogSW5zdGFsbCBzcGVjaWFsIGFycmF5IGZpbHRlcnNcbiAqL1xuXG5fLmV4dGVuZChleHBvcnRzLCByZXF1aXJlKCcuL2FycmF5LWZpbHRlcnMnKSlcbiIsInZhciBfID0gcmVxdWlyZSgnLi4vdXRpbCcpXG52YXIgRGlyZWN0aXZlID0gcmVxdWlyZSgnLi4vZGlyZWN0aXZlJylcbnZhciBjb21waWxlID0gcmVxdWlyZSgnLi4vY29tcGlsZXIvY29tcGlsZScpXG52YXIgdHJhbnNjbHVkZSA9IHJlcXVpcmUoJy4uL2NvbXBpbGVyL3RyYW5zY2x1ZGUnKVxuXG4vKipcbiAqIFRyYW5zY2x1ZGUsIGNvbXBpbGUgYW5kIGxpbmsgZWxlbWVudC5cbiAqXG4gKiBJZiBhIHByZS1jb21waWxlZCBsaW5rZXIgaXMgYXZhaWxhYmxlLCB0aGF0IG1lYW5zIHRoZVxuICogcGFzc2VkIGluIGVsZW1lbnQgd2lsbCBiZSBwcmUtdHJhbnNjbHVkZWQgYW5kIGNvbXBpbGVkXG4gKiBhcyB3ZWxsIC0gYWxsIHdlIG5lZWQgdG8gZG8gaXMgdG8gY2FsbCB0aGUgbGlua2VyLlxuICpcbiAqIE90aGVyd2lzZSB3ZSBuZWVkIHRvIGNhbGwgdHJhbnNjbHVkZS9jb21waWxlL2xpbmsgaGVyZS5cbiAqXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGVsXG4gKiBAcmV0dXJuIHtFbGVtZW50fVxuICovXG5cbmV4cG9ydHMuX2NvbXBpbGUgPSBmdW5jdGlvbiAoZWwpIHtcbiAgdmFyIG9wdGlvbnMgPSB0aGlzLiRvcHRpb25zXG4gIGlmIChvcHRpb25zLl9saW5rRm4pIHtcbiAgICAvLyBwcmUtdHJhbnNjbHVkZWQgd2l0aCBsaW5rZXIsIGp1c3QgdXNlIGl0XG4gICAgdGhpcy5faW5pdEVsZW1lbnQoZWwpXG4gICAgdGhpcy5fdW5saW5rRm4gPSBvcHRpb25zLl9saW5rRm4odGhpcywgZWwpXG4gIH0gZWxzZSB7XG4gICAgLy8gdHJhbnNjbHVkZSBhbmQgaW5pdCBlbGVtZW50XG4gICAgLy8gdHJhbnNjbHVkZSBjYW4gcG90ZW50aWFsbHkgcmVwbGFjZSBvcmlnaW5hbFxuICAgIC8vIHNvIHdlIG5lZWQgdG8ga2VlcCByZWZlcmVuY2VcbiAgICB2YXIgb3JpZ2luYWwgPSBlbFxuICAgIGVsID0gdHJhbnNjbHVkZShlbCwgb3B0aW9ucylcbiAgICB0aGlzLl9pbml0RWxlbWVudChlbClcbiAgICAvLyBjb21waWxlIGFuZCBsaW5rIHRoZSByZXN0XG4gICAgdGhpcy5fdW5saW5rRm4gPSBjb21waWxlKGVsLCBvcHRpb25zKSh0aGlzLCBlbClcbiAgICAvLyBmaW5hbGx5IHJlcGxhY2Ugb3JpZ2luYWxcbiAgICBpZiAob3B0aW9ucy5yZXBsYWNlKSB7XG4gICAgICBfLnJlcGxhY2Uob3JpZ2luYWwsIGVsKVxuICAgIH1cbiAgfVxuICByZXR1cm4gZWxcbn1cblxuLyoqXG4gKiBJbml0aWFsaXplIGluc3RhbmNlIGVsZW1lbnQuIENhbGxlZCBpbiB0aGUgcHVibGljXG4gKiAkbW91bnQoKSBtZXRob2QuXG4gKlxuICogQHBhcmFtIHtFbGVtZW50fSBlbFxuICovXG5cbmV4cG9ydHMuX2luaXRFbGVtZW50ID0gZnVuY3Rpb24gKGVsKSB7XG4gIGlmIChlbCBpbnN0YW5jZW9mIERvY3VtZW50RnJhZ21lbnQpIHtcbiAgICB0aGlzLl9pc0Jsb2NrID0gdHJ1ZVxuICAgIHRoaXMuJGVsID0gdGhpcy5fYmxvY2tTdGFydCA9IGVsLmZpcnN0Q2hpbGRcbiAgICB0aGlzLl9ibG9ja0VuZCA9IGVsLmxhc3RDaGlsZFxuICAgIC8vIHNldCBwZXJzaXN0ZWQgdGV4dCBhbmNob3JzIHRvIGVtcHR5XG4gICAgaWYgKHRoaXMuX2Jsb2NrU3RhcnQubm9kZVR5cGUgPT09IDMpIHtcbiAgICAgIHRoaXMuX2Jsb2NrU3RhcnQuZGF0YSA9IHRoaXMuX2Jsb2NrRW5kLmRhdGEgPSAnJ1xuICAgIH1cbiAgICB0aGlzLl9ibG9ja0ZyYWdtZW50ID0gZWxcbiAgfSBlbHNlIHtcbiAgICB0aGlzLiRlbCA9IGVsXG4gIH1cbiAgdGhpcy4kZWwuX192dWVfXyA9IHRoaXNcbiAgdGhpcy5fY2FsbEhvb2soJ2JlZm9yZUNvbXBpbGUnKVxufVxuXG4vKipcbiAqIENyZWF0ZSBhbmQgYmluZCBhIGRpcmVjdGl2ZSB0byBhbiBlbGVtZW50LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIC0gZGlyZWN0aXZlIG5hbWVcbiAqIEBwYXJhbSB7Tm9kZX0gbm9kZSAgIC0gdGFyZ2V0IG5vZGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBkZXNjIC0gcGFyc2VkIGRpcmVjdGl2ZSBkZXNjcmlwdG9yXG4gKiBAcGFyYW0ge09iamVjdH0gZGVmICAtIGRpcmVjdGl2ZSBkZWZpbml0aW9uIG9iamVjdFxuICogQHBhcmFtIHtWdWV8dW5kZWZpbmVkfSBob3N0IC0gdHJhbnNjbHVzaW9uIGhvc3QgY29tcG9uZW50XG4gKi9cblxuZXhwb3J0cy5fYmluZERpciA9IGZ1bmN0aW9uIChuYW1lLCBub2RlLCBkZXNjLCBkZWYsIGhvc3QpIHtcbiAgdGhpcy5fZGlyZWN0aXZlcy5wdXNoKFxuICAgIG5ldyBEaXJlY3RpdmUobmFtZSwgbm9kZSwgdGhpcywgZGVzYywgZGVmLCBob3N0KVxuICApXG59XG5cbi8qKlxuICogVGVhcmRvd24gYW4gaW5zdGFuY2UsIHVub2JzZXJ2ZXMgdGhlIGRhdGEsIHVuYmluZCBhbGwgdGhlXG4gKiBkaXJlY3RpdmVzLCB0dXJuIG9mZiBhbGwgdGhlIGV2ZW50IGxpc3RlbmVycywgZXRjLlxuICpcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gcmVtb3ZlIC0gd2hldGhlciB0byByZW1vdmUgdGhlIERPTSBub2RlLlxuICogQHBhcmFtIHtCb29sZWFufSBkZWZlckNsZWFudXAgLSBpZiB0cnVlLCBkZWZlciBjbGVhbnVwIHRvXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJlIGNhbGxlZCBsYXRlclxuICovXG5cbmV4cG9ydHMuX2Rlc3Ryb3kgPSBmdW5jdGlvbiAocmVtb3ZlLCBkZWZlckNsZWFudXApIHtcbiAgaWYgKHRoaXMuX2lzQmVpbmdEZXN0cm95ZWQpIHtcbiAgICByZXR1cm5cbiAgfVxuICB0aGlzLl9jYWxsSG9vaygnYmVmb3JlRGVzdHJveScpXG4gIHRoaXMuX2lzQmVpbmdEZXN0cm95ZWQgPSB0cnVlXG4gIHZhciBpXG4gIC8vIHJlbW92ZSBzZWxmIGZyb20gcGFyZW50LiBvbmx5IG5lY2Vzc2FyeVxuICAvLyBpZiBwYXJlbnQgaXMgbm90IGJlaW5nIGRlc3Ryb3llZCBhcyB3ZWxsLlxuICB2YXIgcGFyZW50ID0gdGhpcy4kcGFyZW50XG4gIGlmIChwYXJlbnQgJiYgIXBhcmVudC5faXNCZWluZ0Rlc3Ryb3llZCkge1xuICAgIHBhcmVudC5fY2hpbGRyZW4uJHJlbW92ZSh0aGlzKVxuICB9XG4gIC8vIHNhbWUgZm9yIHRyYW5zY2x1c2lvbiBob3N0LlxuICB2YXIgaG9zdCA9IHRoaXMuX2hvc3RcbiAgaWYgKGhvc3QgJiYgIWhvc3QuX2lzQmVpbmdEZXN0cm95ZWQpIHtcbiAgICBob3N0Ll90cmFuc0NwbnRzLiRyZW1vdmUodGhpcylcbiAgfVxuICAvLyBkZXN0cm95IGFsbCBjaGlsZHJlbi5cbiAgaSA9IHRoaXMuX2NoaWxkcmVuLmxlbmd0aFxuICB3aGlsZSAoaS0tKSB7XG4gICAgdGhpcy5fY2hpbGRyZW5baV0uJGRlc3Ryb3koKVxuICB9XG4gIC8vIHRlYXJkb3duIGFsbCBkaXJlY3RpdmVzLiB0aGlzIGFsc28gdGVhcnNkb3duIGFsbFxuICAvLyBkaXJlY3RpdmUtb3duZWQgd2F0Y2hlcnMuXG4gIGlmICh0aGlzLl91bmxpbmtGbikge1xuICAgIC8vIHBhc3NpbmcgZGVzdHJveWluZzogdHJ1ZSB0byBhdm9pZCBzZWFyY2hpbmcgYW5kXG4gICAgLy8gc3BsaWNpbmcgdGhlIGRpcmVjdGl2ZXNcbiAgICB0aGlzLl91bmxpbmtGbih0cnVlKVxuICB9XG4gIGkgPSB0aGlzLl93YXRjaGVycy5sZW5ndGhcbiAgd2hpbGUgKGktLSkge1xuICAgIHRoaXMuX3dhdGNoZXJzW2ldLnRlYXJkb3duKClcbiAgfVxuICAvLyByZW1vdmUgcmVmZXJlbmNlIHRvIHNlbGYgb24gJGVsXG4gIGlmICh0aGlzLiRlbCkge1xuICAgIHRoaXMuJGVsLl9fdnVlX18gPSBudWxsXG4gIH1cbiAgLy8gcmVtb3ZlIERPTSBlbGVtZW50XG4gIHZhciBzZWxmID0gdGhpc1xuICBpZiAocmVtb3ZlICYmIHRoaXMuJGVsKSB7XG4gICAgdGhpcy4kcmVtb3ZlKGZ1bmN0aW9uICgpIHtcbiAgICAgIHNlbGYuX2NsZWFudXAoKVxuICAgIH0pXG4gIH0gZWxzZSBpZiAoIWRlZmVyQ2xlYW51cCkge1xuICAgIHRoaXMuX2NsZWFudXAoKVxuICB9XG59XG5cbi8qKlxuICogQ2xlYW4gdXAgdG8gZW5zdXJlIGdhcmJhZ2UgY29sbGVjdGlvbi5cbiAqIFRoaXMgaXMgY2FsbGVkIGFmdGVyIHRoZSBsZWF2ZSB0cmFuc2l0aW9uIGlmIHRoZXJlXG4gKiBpcyBhbnkuXG4gKi9cblxuZXhwb3J0cy5fY2xlYW51cCA9IGZ1bmN0aW9uICgpIHtcbiAgLy8gcmVtb3ZlIHJlZmVyZW5jZSBmcm9tIGRhdGEgb2JcbiAgdGhpcy5fZGF0YS5fX29iX18ucmVtb3ZlVm0odGhpcylcbiAgdGhpcy5fZGF0YSA9XG4gIHRoaXMuX3dhdGNoZXJzID1cbiAgdGhpcy4kZWwgPVxuICB0aGlzLiRwYXJlbnQgPVxuICB0aGlzLiRyb290ID1cbiAgdGhpcy5fY2hpbGRyZW4gPVxuICB0aGlzLl90cmFuc0NwbnRzID1cbiAgdGhpcy5fZGlyZWN0aXZlcyA9IG51bGxcbiAgLy8gY2FsbCB0aGUgbGFzdCBob29rLi4uXG4gIHRoaXMuX2lzRGVzdHJveWVkID0gdHJ1ZVxuICB0aGlzLl9jYWxsSG9vaygnZGVzdHJveWVkJylcbiAgLy8gdHVybiBvZmYgYWxsIGluc3RhbmNlIGxpc3RlbmVycy5cbiAgdGhpcy4kb2ZmKClcbn0iLCJ2YXIgXyA9IHJlcXVpcmUoJy4uL3V0aWwnKVxudmFyIGluRG9jID0gXy5pbkRvY1xuXG4vKipcbiAqIFNldHVwIHRoZSBpbnN0YW5jZSdzIG9wdGlvbiBldmVudHMgJiB3YXRjaGVycy5cbiAqIElmIHRoZSB2YWx1ZSBpcyBhIHN0cmluZywgd2UgcHVsbCBpdCBmcm9tIHRoZVxuICogaW5zdGFuY2UncyBtZXRob2RzIGJ5IG5hbWUuXG4gKi9cblxuZXhwb3J0cy5faW5pdEV2ZW50cyA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIG9wdGlvbnMgPSB0aGlzLiRvcHRpb25zXG4gIHJlZ2lzdGVyQ2FsbGJhY2tzKHRoaXMsICckb24nLCBvcHRpb25zLmV2ZW50cylcbiAgcmVnaXN0ZXJDYWxsYmFja3ModGhpcywgJyR3YXRjaCcsIG9wdGlvbnMud2F0Y2gpXG59XG5cbi8qKlxuICogUmVnaXN0ZXIgY2FsbGJhY2tzIGZvciBvcHRpb24gZXZlbnRzIGFuZCB3YXRjaGVycy5cbiAqXG4gKiBAcGFyYW0ge1Z1ZX0gdm1cbiAqIEBwYXJhbSB7U3RyaW5nfSBhY3Rpb25cbiAqIEBwYXJhbSB7T2JqZWN0fSBoYXNoXG4gKi9cblxuZnVuY3Rpb24gcmVnaXN0ZXJDYWxsYmFja3MgKHZtLCBhY3Rpb24sIGhhc2gpIHtcbiAgaWYgKCFoYXNoKSByZXR1cm5cbiAgdmFyIGhhbmRsZXJzLCBrZXksIGksIGpcbiAgZm9yIChrZXkgaW4gaGFzaCkge1xuICAgIGhhbmRsZXJzID0gaGFzaFtrZXldXG4gICAgaWYgKF8uaXNBcnJheShoYW5kbGVycykpIHtcbiAgICAgIGZvciAoaSA9IDAsIGogPSBoYW5kbGVycy5sZW5ndGg7IGkgPCBqOyBpKyspIHtcbiAgICAgICAgcmVnaXN0ZXIodm0sIGFjdGlvbiwga2V5LCBoYW5kbGVyc1tpXSlcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmVnaXN0ZXIodm0sIGFjdGlvbiwga2V5LCBoYW5kbGVycylcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBIZWxwZXIgdG8gcmVnaXN0ZXIgYW4gZXZlbnQvd2F0Y2ggY2FsbGJhY2suXG4gKlxuICogQHBhcmFtIHtWdWV9IHZtXG4gKiBAcGFyYW0ge1N0cmluZ30gYWN0aW9uXG4gKiBAcGFyYW0ge1N0cmluZ30ga2V5XG4gKiBAcGFyYW0geyp9IGhhbmRsZXJcbiAqL1xuXG5mdW5jdGlvbiByZWdpc3RlciAodm0sIGFjdGlvbiwga2V5LCBoYW5kbGVyKSB7XG4gIHZhciB0eXBlID0gdHlwZW9mIGhhbmRsZXJcbiAgaWYgKHR5cGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICB2bVthY3Rpb25dKGtleSwgaGFuZGxlcilcbiAgfSBlbHNlIGlmICh0eXBlID09PSAnc3RyaW5nJykge1xuICAgIHZhciBtZXRob2RzID0gdm0uJG9wdGlvbnMubWV0aG9kc1xuICAgIHZhciBtZXRob2QgPSBtZXRob2RzICYmIG1ldGhvZHNbaGFuZGxlcl1cbiAgICBpZiAobWV0aG9kKSB7XG4gICAgICB2bVthY3Rpb25dKGtleSwgbWV0aG9kKVxuICAgIH0gZWxzZSB7XG4gICAgICBfLndhcm4oXG4gICAgICAgICdVbmtub3duIG1ldGhvZDogXCInICsgaGFuZGxlciArICdcIiB3aGVuICcgK1xuICAgICAgICAncmVnaXN0ZXJpbmcgY2FsbGJhY2sgZm9yICcgKyBhY3Rpb24gK1xuICAgICAgICAnOiBcIicgKyBrZXkgKyAnXCIuJ1xuICAgICAgKVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFNldHVwIHJlY3Vyc2l2ZSBhdHRhY2hlZC9kZXRhY2hlZCBjYWxsc1xuICovXG5cbmV4cG9ydHMuX2luaXRET01Ib29rcyA9IGZ1bmN0aW9uICgpIHtcbiAgdGhpcy4kb24oJ2hvb2s6YXR0YWNoZWQnLCBvbkF0dGFjaGVkKVxuICB0aGlzLiRvbignaG9vazpkZXRhY2hlZCcsIG9uRGV0YWNoZWQpXG59XG5cbi8qKlxuICogQ2FsbGJhY2sgdG8gcmVjdXJzaXZlbHkgY2FsbCBhdHRhY2hlZCBob29rIG9uIGNoaWxkcmVuXG4gKi9cblxuZnVuY3Rpb24gb25BdHRhY2hlZCAoKSB7XG4gIHRoaXMuX2lzQXR0YWNoZWQgPSB0cnVlXG4gIHRoaXMuX2NoaWxkcmVuLmZvckVhY2goY2FsbEF0dGFjaClcbiAgaWYgKHRoaXMuX3RyYW5zQ3BudHMubGVuZ3RoKSB7XG4gICAgdGhpcy5fdHJhbnNDcG50cy5mb3JFYWNoKGNhbGxBdHRhY2gpXG4gIH1cbn1cblxuLyoqXG4gKiBJdGVyYXRvciB0byBjYWxsIGF0dGFjaGVkIGhvb2tcbiAqIFxuICogQHBhcmFtIHtWdWV9IGNoaWxkXG4gKi9cblxuZnVuY3Rpb24gY2FsbEF0dGFjaCAoY2hpbGQpIHtcbiAgaWYgKCFjaGlsZC5faXNBdHRhY2hlZCAmJiBpbkRvYyhjaGlsZC4kZWwpKSB7XG4gICAgY2hpbGQuX2NhbGxIb29rKCdhdHRhY2hlZCcpXG4gIH1cbn1cblxuLyoqXG4gKiBDYWxsYmFjayB0byByZWN1cnNpdmVseSBjYWxsIGRldGFjaGVkIGhvb2sgb24gY2hpbGRyZW5cbiAqL1xuXG5mdW5jdGlvbiBvbkRldGFjaGVkICgpIHtcbiAgdGhpcy5faXNBdHRhY2hlZCA9IGZhbHNlXG4gIHRoaXMuX2NoaWxkcmVuLmZvckVhY2goY2FsbERldGFjaClcbiAgaWYgKHRoaXMuX3RyYW5zQ3BudHMubGVuZ3RoKSB7XG4gICAgdGhpcy5fdHJhbnNDcG50cy5mb3JFYWNoKGNhbGxEZXRhY2gpXG4gIH1cbn1cblxuLyoqXG4gKiBJdGVyYXRvciB0byBjYWxsIGRldGFjaGVkIGhvb2tcbiAqIFxuICogQHBhcmFtIHtWdWV9IGNoaWxkXG4gKi9cblxuZnVuY3Rpb24gY2FsbERldGFjaCAoY2hpbGQpIHtcbiAgaWYgKGNoaWxkLl9pc0F0dGFjaGVkICYmICFpbkRvYyhjaGlsZC4kZWwpKSB7XG4gICAgY2hpbGQuX2NhbGxIb29rKCdkZXRhY2hlZCcpXG4gIH1cbn1cblxuLyoqXG4gKiBUcmlnZ2VyIGFsbCBoYW5kbGVycyBmb3IgYSBob29rXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGhvb2tcbiAqL1xuXG5leHBvcnRzLl9jYWxsSG9vayA9IGZ1bmN0aW9uIChob29rKSB7XG4gIHZhciBoYW5kbGVycyA9IHRoaXMuJG9wdGlvbnNbaG9va11cbiAgaWYgKGhhbmRsZXJzKSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGogPSBoYW5kbGVycy5sZW5ndGg7IGkgPCBqOyBpKyspIHtcbiAgICAgIGhhbmRsZXJzW2ldLmNhbGwodGhpcylcbiAgICB9XG4gIH1cbiAgdGhpcy4kZW1pdCgnaG9vazonICsgaG9vaylcbn0iLCJ2YXIgbWVyZ2VPcHRpb25zID0gcmVxdWlyZSgnLi4vdXRpbCcpLm1lcmdlT3B0aW9uc1xuXG4vKipcbiAqIFRoZSBtYWluIGluaXQgc2VxdWVuY2UuIFRoaXMgaXMgY2FsbGVkIGZvciBldmVyeVxuICogaW5zdGFuY2UsIGluY2x1ZGluZyBvbmVzIHRoYXQgYXJlIGNyZWF0ZWQgZnJvbSBleHRlbmRlZFxuICogY29uc3RydWN0b3JzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gdGhpcyBvcHRpb25zIG9iamVjdCBzaG91bGQgYmVcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlIHJlc3VsdCBvZiBtZXJnaW5nIGNsYXNzXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnMgYW5kIHRoZSBvcHRpb25zIHBhc3NlZFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICBpbiB0byB0aGUgY29uc3RydWN0b3IuXG4gKi9cblxuZXhwb3J0cy5faW5pdCA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG5cbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge31cblxuICB0aGlzLiRlbCAgICAgICAgICAgPSBudWxsXG4gIHRoaXMuJHBhcmVudCAgICAgICA9IG9wdGlvbnMuX3BhcmVudFxuICB0aGlzLiRyb290ICAgICAgICAgPSBvcHRpb25zLl9yb290IHx8IHRoaXNcbiAgdGhpcy4kICAgICAgICAgICAgID0ge30gLy8gY2hpbGQgdm0gcmVmZXJlbmNlc1xuICB0aGlzLiQkICAgICAgICAgICAgPSB7fSAvLyBlbGVtZW50IHJlZmVyZW5jZXNcbiAgdGhpcy5fd2F0Y2hlcnMgICAgID0gW10gLy8gYWxsIHdhdGNoZXJzIGFzIGFuIGFycmF5XG4gIHRoaXMuX2RpcmVjdGl2ZXMgICA9IFtdIC8vIGFsbCBkaXJlY3RpdmVzXG5cbiAgLy8gYSBmbGFnIHRvIGF2b2lkIHRoaXMgYmVpbmcgb2JzZXJ2ZWRcbiAgdGhpcy5faXNWdWUgPSB0cnVlXG5cbiAgLy8gZXZlbnRzIGJvb2trZWVwaW5nXG4gIHRoaXMuX2V2ZW50cyAgICAgICAgID0ge30gICAgLy8gcmVnaXN0ZXJlZCBjYWxsYmFja3NcbiAgdGhpcy5fZXZlbnRzQ291bnQgICAgPSB7fSAgICAvLyBmb3IgJGJyb2FkY2FzdCBvcHRpbWl6YXRpb25cbiAgdGhpcy5fZXZlbnRDYW5jZWxsZWQgPSBmYWxzZSAvLyBmb3IgZXZlbnQgY2FuY2VsbGF0aW9uXG5cbiAgLy8gYmxvY2sgaW5zdGFuY2UgcHJvcGVydGllc1xuICB0aGlzLl9pc0Jsb2NrICAgICA9IGZhbHNlXG4gIHRoaXMuX2Jsb2NrU3RhcnQgID0gICAgICAgICAgLy8gQHR5cGUge0NvbW1lbnROb2RlfVxuICB0aGlzLl9ibG9ja0VuZCAgICA9IG51bGwgICAgIC8vIEB0eXBlIHtDb21tZW50Tm9kZX1cblxuICAvLyBsaWZlY3ljbGUgc3RhdGVcbiAgdGhpcy5faXNDb21waWxlZCAgPVxuICB0aGlzLl9pc0Rlc3Ryb3llZCA9XG4gIHRoaXMuX2lzUmVhZHkgICAgID1cbiAgdGhpcy5faXNBdHRhY2hlZCAgPVxuICB0aGlzLl9pc0JlaW5nRGVzdHJveWVkID0gZmFsc2VcbiAgdGhpcy5fdW5saW5rRm4gICAgPSBudWxsXG5cbiAgLy8gY2hpbGRyZW5cbiAgdGhpcy5fY2hpbGRyZW4gPSBbXVxuICB0aGlzLl9jaGlsZEN0b3JzID0ge31cblxuICAvLyB0cmFuc2NsdWRlZCBjb21wb25lbnRzIHRoYXQgYmVsb25nIHRvIHRoZSBwYXJlbnQuXG4gIC8vIG5lZWQgdG8ga2VlcCB0cmFjayBvZiB0aGVtIHNvIHRoYXQgd2UgY2FuIGNhbGxcbiAgLy8gYXR0YWNoZWQvZGV0YWNoZWQgaG9va3Mgb24gdGhlbS5cbiAgdGhpcy5fdHJhbnNDcG50cyA9IFtdXG4gIHRoaXMuX2hvc3QgPSBvcHRpb25zLl9ob3N0XG5cbiAgLy8gcHVzaCBzZWxmIGludG8gcGFyZW50IC8gdHJhbnNjbHVzaW9uIGhvc3RcbiAgaWYgKHRoaXMuJHBhcmVudCkge1xuICAgIHRoaXMuJHBhcmVudC5fY2hpbGRyZW4ucHVzaCh0aGlzKVxuICB9XG4gIGlmICh0aGlzLl9ob3N0KSB7XG4gICAgdGhpcy5faG9zdC5fdHJhbnNDcG50cy5wdXNoKHRoaXMpXG4gIH1cblxuICAvLyBwcm9wcyB1c2VkIGluIHYtcmVwZWF0IGRpZmZpbmdcbiAgdGhpcy5fcmV1c2VkID0gZmFsc2VcbiAgdGhpcy5fc3RhZ2dlck9wID0gbnVsbFxuXG4gIC8vIG1lcmdlIG9wdGlvbnMuXG4gIG9wdGlvbnMgPSB0aGlzLiRvcHRpb25zID0gbWVyZ2VPcHRpb25zKFxuICAgIHRoaXMuY29uc3RydWN0b3Iub3B0aW9ucyxcbiAgICBvcHRpb25zLFxuICAgIHRoaXNcbiAgKVxuXG4gIC8vIHNldCBkYXRhIGFmdGVyIG1lcmdlLlxuICB0aGlzLl9kYXRhID0gb3B0aW9ucy5kYXRhIHx8IHt9XG5cbiAgLy8gaW5pdGlhbGl6ZSBkYXRhIG9ic2VydmF0aW9uIGFuZCBzY29wZSBpbmhlcml0YW5jZS5cbiAgdGhpcy5faW5pdFNjb3BlKClcblxuICAvLyBzZXR1cCBldmVudCBzeXN0ZW0gYW5kIG9wdGlvbiBldmVudHMuXG4gIHRoaXMuX2luaXRFdmVudHMoKVxuXG4gIC8vIGNhbGwgY3JlYXRlZCBob29rXG4gIHRoaXMuX2NhbGxIb29rKCdjcmVhdGVkJylcblxuICAvLyBpZiBgZWxgIG9wdGlvbiBpcyBwYXNzZWQsIHN0YXJ0IGNvbXBpbGF0aW9uLlxuICBpZiAob3B0aW9ucy5lbCkge1xuICAgIHRoaXMuJG1vdW50KG9wdGlvbnMuZWwpXG4gIH1cbn0iLCJ2YXIgXyA9IHJlcXVpcmUoJy4uL3V0aWwnKVxuXG4vKipcbiAqIEFwcGx5IGEgbGlzdCBvZiBmaWx0ZXIgKGRlc2NyaXB0b3JzKSB0byBhIHZhbHVlLlxuICogVXNpbmcgcGxhaW4gZm9yIGxvb3BzIGhlcmUgYmVjYXVzZSB0aGlzIHdpbGwgYmUgY2FsbGVkIGluXG4gKiB0aGUgZ2V0dGVyIG9mIGFueSB3YXRjaGVyIHdpdGggZmlsdGVycyBzbyBpdCBpcyB2ZXJ5XG4gKiBwZXJmb3JtYW5jZSBzZW5zaXRpdmUuXG4gKlxuICogQHBhcmFtIHsqfSB2YWx1ZVxuICogQHBhcmFtIHsqfSBbb2xkVmFsdWVdXG4gKiBAcGFyYW0ge0FycmF5fSBmaWx0ZXJzXG4gKiBAcGFyYW0ge0Jvb2xlYW59IHdyaXRlXG4gKiBAcmV0dXJuIHsqfVxuICovXG5cbmV4cG9ydHMuX2FwcGx5RmlsdGVycyA9IGZ1bmN0aW9uICh2YWx1ZSwgb2xkVmFsdWUsIGZpbHRlcnMsIHdyaXRlKSB7XG4gIHZhciBmaWx0ZXIsIGZuLCBhcmdzLCBhcmcsIG9mZnNldCwgaSwgbCwgaiwga1xuICBmb3IgKGkgPSAwLCBsID0gZmlsdGVycy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBmaWx0ZXIgPSBmaWx0ZXJzW2ldXG4gICAgZm4gPSBfLnJlc29sdmVBc3NldCh0aGlzLiRvcHRpb25zLCAnZmlsdGVycycsIGZpbHRlci5uYW1lKVxuICAgIF8uYXNzZXJ0QXNzZXQoZm4sICdmaWx0ZXInLCBmaWx0ZXIubmFtZSlcbiAgICBpZiAoIWZuKSBjb250aW51ZVxuICAgIGZuID0gd3JpdGUgPyBmbi53cml0ZSA6IChmbi5yZWFkIHx8IGZuKVxuICAgIGlmICh0eXBlb2YgZm4gIT09ICdmdW5jdGlvbicpIGNvbnRpbnVlXG4gICAgYXJncyA9IHdyaXRlID8gW3ZhbHVlLCBvbGRWYWx1ZV0gOiBbdmFsdWVdXG4gICAgb2Zmc2V0ID0gd3JpdGUgPyAyIDogMVxuICAgIGlmIChmaWx0ZXIuYXJncykge1xuICAgICAgZm9yIChqID0gMCwgayA9IGZpbHRlci5hcmdzLmxlbmd0aDsgaiA8IGs7IGorKykge1xuICAgICAgICBhcmcgPSBmaWx0ZXIuYXJnc1tqXVxuICAgICAgICBhcmdzW2ogKyBvZmZzZXRdID0gYXJnLmR5bmFtaWNcbiAgICAgICAgICA/IHRoaXMuJGdldChhcmcudmFsdWUpXG4gICAgICAgICAgOiBhcmcudmFsdWVcbiAgICAgIH1cbiAgICB9XG4gICAgdmFsdWUgPSBmbi5hcHBseSh0aGlzLCBhcmdzKVxuICB9XG4gIHJldHVybiB2YWx1ZVxufVxuXG4vKipcbiAqIFJlc29sdmUgYSBjb21wb25lbnQsIGRlcGVuZGluZyBvbiB3aGV0aGVyIHRoZSBjb21wb25lbnRcbiAqIGlzIGRlZmluZWQgbm9ybWFsbHkgb3IgdXNpbmcgYW4gYXN5bmMgZmFjdG9yeSBmdW5jdGlvbi5cbiAqIFJlc29sdmVzIHN5bmNocm9ub3VzbHkgaWYgYWxyZWFkeSByZXNvbHZlZCwgb3RoZXJ3aXNlXG4gKiByZXNvbHZlcyBhc3luY2hyb25vdXNseSBhbmQgY2FjaGVzIHRoZSByZXNvbHZlZFxuICogY29uc3RydWN0b3Igb24gdGhlIGZhY3RvcnkuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGlkXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYlxuICovXG5cbmV4cG9ydHMuX3Jlc29sdmVDb21wb25lbnQgPSBmdW5jdGlvbiAoaWQsIGNiKSB7XG4gIHZhciBmYWN0b3J5ID0gXy5yZXNvbHZlQXNzZXQodGhpcy4kb3B0aW9ucywgJ2NvbXBvbmVudHMnLCBpZClcbiAgXy5hc3NlcnRBc3NldChmYWN0b3J5LCAnY29tcG9uZW50JywgaWQpXG4gIC8vIGFzeW5jIGNvbXBvbmVudCBmYWN0b3J5XG4gIGlmICghZmFjdG9yeS5vcHRpb25zKSB7XG4gICAgaWYgKGZhY3RvcnkucmVzb2x2ZWQpIHtcbiAgICAgIC8vIGNhY2hlZFxuICAgICAgY2IoZmFjdG9yeS5yZXNvbHZlZClcbiAgICB9IGVsc2UgaWYgKGZhY3RvcnkucmVxdWVzdGVkKSB7XG4gICAgICAvLyBwb29sIGNhbGxiYWNrc1xuICAgICAgZmFjdG9yeS5wZW5kaW5nQ2FsbGJhY2tzLnB1c2goY2IpXG4gICAgfSBlbHNlIHtcbiAgICAgIGZhY3RvcnkucmVxdWVzdGVkID0gdHJ1ZVxuICAgICAgdmFyIGNicyA9IGZhY3RvcnkucGVuZGluZ0NhbGxiYWNrcyA9IFtjYl1cbiAgICAgIGZhY3RvcnkoZnVuY3Rpb24gcmVzb2x2ZSAocmVzKSB7XG4gICAgICAgIGlmIChfLmlzUGxhaW5PYmplY3QocmVzKSkge1xuICAgICAgICAgIHJlcyA9IF8uVnVlLmV4dGVuZChyZXMpXG4gICAgICAgIH1cbiAgICAgICAgLy8gY2FjaGUgcmVzb2x2ZWRcbiAgICAgICAgZmFjdG9yeS5yZXNvbHZlZCA9IHJlc1xuICAgICAgICAvLyBpbnZva2UgY2FsbGJhY2tzXG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gY2JzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgIGNic1tpXShyZXMpXG4gICAgICAgIH1cbiAgICAgIH0sIGZ1bmN0aW9uIHJlamVjdCAocmVhc29uKSB7XG4gICAgICAgIF8ud2FybihcbiAgICAgICAgICAnRmFpbGVkIHRvIHJlc29sdmUgYXN5bmMgY29tcG9uZW50OiAnICsgaWQgKyAnLiAnICtcbiAgICAgICAgICAocmVhc29uID8gJ1xcblJlYXNvbjogJyArIHJlYXNvbiA6ICcnKVxuICAgICAgICApXG4gICAgICB9KVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICAvLyBub3JtYWwgY29tcG9uZW50XG4gICAgY2IoZmFjdG9yeSlcbiAgfVxufSIsInZhciBfID0gcmVxdWlyZSgnLi4vdXRpbCcpXG52YXIgT2JzZXJ2ZXIgPSByZXF1aXJlKCcuLi9vYnNlcnZlcicpXG52YXIgRGVwID0gcmVxdWlyZSgnLi4vb2JzZXJ2ZXIvZGVwJylcblxuLyoqXG4gKiBTZXR1cCB0aGUgc2NvcGUgb2YgYW4gaW5zdGFuY2UsIHdoaWNoIGNvbnRhaW5zOlxuICogLSBvYnNlcnZlZCBkYXRhXG4gKiAtIGNvbXB1dGVkIHByb3BlcnRpZXNcbiAqIC0gdXNlciBtZXRob2RzXG4gKiAtIG1ldGEgcHJvcGVydGllc1xuICovXG5cbmV4cG9ydHMuX2luaXRTY29wZSA9IGZ1bmN0aW9uICgpIHtcbiAgdGhpcy5faW5pdERhdGEoKVxuICB0aGlzLl9pbml0Q29tcHV0ZWQoKVxuICB0aGlzLl9pbml0TWV0aG9kcygpXG4gIHRoaXMuX2luaXRNZXRhKClcbn1cblxuLyoqXG4gKiBJbml0aWFsaXplIHRoZSBkYXRhLlxuICovXG5cbmV4cG9ydHMuX2luaXREYXRhID0gZnVuY3Rpb24gKCkge1xuICAvLyBwcm94eSBkYXRhIG9uIGluc3RhbmNlXG4gIHZhciBkYXRhID0gdGhpcy5fZGF0YVxuICB2YXIgaSwga2V5XG4gIC8vIG1ha2Ugc3VyZSBhbGwgcHJvcHMgcHJvcGVydGllcyBhcmUgb2JzZXJ2ZWRcbiAgdmFyIHByb3BzID0gdGhpcy4kb3B0aW9ucy5wcm9wc1xuICBpZiAocHJvcHMpIHtcbiAgICBpID0gcHJvcHMubGVuZ3RoXG4gICAgd2hpbGUgKGktLSkge1xuICAgICAga2V5ID0gXy5jYW1lbGl6ZShwcm9wc1tpXSlcbiAgICAgIGlmICghKGtleSBpbiBkYXRhKSkge1xuICAgICAgICBkYXRhW2tleV0gPSB1bmRlZmluZWRcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhkYXRhKVxuICBpID0ga2V5cy5sZW5ndGhcbiAgd2hpbGUgKGktLSkge1xuICAgIGtleSA9IGtleXNbaV1cbiAgICBpZiAoIV8uaXNSZXNlcnZlZChrZXkpKSB7XG4gICAgICB0aGlzLl9wcm94eShrZXkpXG4gICAgfVxuICB9XG4gIC8vIG9ic2VydmUgZGF0YVxuICBPYnNlcnZlci5jcmVhdGUoZGF0YSkuYWRkVm0odGhpcylcbn1cblxuLyoqXG4gKiBTd2FwIHRoZSBpc250YW5jZSdzICRkYXRhLiBDYWxsZWQgaW4gJGRhdGEncyBzZXR0ZXIuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG5ld0RhdGFcbiAqL1xuXG5leHBvcnRzLl9zZXREYXRhID0gZnVuY3Rpb24gKG5ld0RhdGEpIHtcbiAgbmV3RGF0YSA9IG5ld0RhdGEgfHwge31cbiAgdmFyIG9sZERhdGEgPSB0aGlzLl9kYXRhXG4gIHRoaXMuX2RhdGEgPSBuZXdEYXRhXG4gIHZhciBrZXlzLCBrZXksIGlcbiAgLy8gY29weSBwcm9wc1xuICB2YXIgcHJvcHMgPSB0aGlzLiRvcHRpb25zLnByb3BzXG4gIGlmIChwcm9wcykge1xuICAgIGkgPSBwcm9wcy5sZW5ndGhcbiAgICB3aGlsZSAoaS0tKSB7XG4gICAgICBrZXkgPSBwcm9wc1tpXVxuICAgICAgbmV3RGF0YS4kc2V0KGtleSwgb2xkRGF0YVtrZXldKVxuICAgIH1cbiAgfVxuICAvLyB1bnByb3h5IGtleXMgbm90IHByZXNlbnQgaW4gbmV3IGRhdGFcbiAga2V5cyA9IE9iamVjdC5rZXlzKG9sZERhdGEpXG4gIGkgPSBrZXlzLmxlbmd0aFxuICB3aGlsZSAoaS0tKSB7XG4gICAga2V5ID0ga2V5c1tpXVxuICAgIGlmICghXy5pc1Jlc2VydmVkKGtleSkgJiYgIShrZXkgaW4gbmV3RGF0YSkpIHtcbiAgICAgIHRoaXMuX3VucHJveHkoa2V5KVxuICAgIH1cbiAgfVxuICAvLyBwcm94eSBrZXlzIG5vdCBhbHJlYWR5IHByb3hpZWQsXG4gIC8vIGFuZCB0cmlnZ2VyIGNoYW5nZSBmb3IgY2hhbmdlZCB2YWx1ZXNcbiAga2V5cyA9IE9iamVjdC5rZXlzKG5ld0RhdGEpXG4gIGkgPSBrZXlzLmxlbmd0aFxuICB3aGlsZSAoaS0tKSB7XG4gICAga2V5ID0ga2V5c1tpXVxuICAgIGlmICghdGhpcy5oYXNPd25Qcm9wZXJ0eShrZXkpICYmICFfLmlzUmVzZXJ2ZWQoa2V5KSkge1xuICAgICAgLy8gbmV3IHByb3BlcnR5XG4gICAgICB0aGlzLl9wcm94eShrZXkpXG4gICAgfVxuICB9XG4gIG9sZERhdGEuX19vYl9fLnJlbW92ZVZtKHRoaXMpXG4gIE9ic2VydmVyLmNyZWF0ZShuZXdEYXRhKS5hZGRWbSh0aGlzKVxuICB0aGlzLl9kaWdlc3QoKVxufVxuXG4vKipcbiAqIFByb3h5IGEgcHJvcGVydHksIHNvIHRoYXRcbiAqIHZtLnByb3AgPT09IHZtLl9kYXRhLnByb3BcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30ga2V5XG4gKi9cblxuZXhwb3J0cy5fcHJveHkgPSBmdW5jdGlvbiAoa2V5KSB7XG4gIC8vIG5lZWQgdG8gc3RvcmUgcmVmIHRvIHNlbGYgaGVyZVxuICAvLyBiZWNhdXNlIHRoZXNlIGdldHRlci9zZXR0ZXJzIG1pZ2h0XG4gIC8vIGJlIGNhbGxlZCBieSBjaGlsZCBpbnN0YW5jZXMhXG4gIHZhciBzZWxmID0gdGhpc1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoc2VsZiwga2V5LCB7XG4gICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgZ2V0OiBmdW5jdGlvbiBwcm94eUdldHRlciAoKSB7XG4gICAgICByZXR1cm4gc2VsZi5fZGF0YVtrZXldXG4gICAgfSxcbiAgICBzZXQ6IGZ1bmN0aW9uIHByb3h5U2V0dGVyICh2YWwpIHtcbiAgICAgIHNlbGYuX2RhdGFba2V5XSA9IHZhbFxuICAgIH1cbiAgfSlcbn1cblxuLyoqXG4gKiBVbnByb3h5IGEgcHJvcGVydHkuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGtleVxuICovXG5cbmV4cG9ydHMuX3VucHJveHkgPSBmdW5jdGlvbiAoa2V5KSB7XG4gIGRlbGV0ZSB0aGlzW2tleV1cbn1cblxuLyoqXG4gKiBGb3JjZSB1cGRhdGUgb24gZXZlcnkgd2F0Y2hlciBpbiBzY29wZS5cbiAqL1xuXG5leHBvcnRzLl9kaWdlc3QgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBpID0gdGhpcy5fd2F0Y2hlcnMubGVuZ3RoXG4gIHdoaWxlIChpLS0pIHtcbiAgICB0aGlzLl93YXRjaGVyc1tpXS51cGRhdGUoKVxuICB9XG4gIHZhciBjaGlsZHJlbiA9IHRoaXMuX2NoaWxkcmVuXG4gIGkgPSBjaGlsZHJlbi5sZW5ndGhcbiAgd2hpbGUgKGktLSkge1xuICAgIHZhciBjaGlsZCA9IGNoaWxkcmVuW2ldXG4gICAgaWYgKGNoaWxkLiRvcHRpb25zLmluaGVyaXQpIHtcbiAgICAgIGNoaWxkLl9kaWdlc3QoKVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFNldHVwIGNvbXB1dGVkIHByb3BlcnRpZXMuIFRoZXkgYXJlIGVzc2VudGlhbGx5XG4gKiBzcGVjaWFsIGdldHRlci9zZXR0ZXJzXG4gKi9cblxuZnVuY3Rpb24gbm9vcCAoKSB7fVxuZXhwb3J0cy5faW5pdENvbXB1dGVkID0gZnVuY3Rpb24gKCkge1xuICB2YXIgY29tcHV0ZWQgPSB0aGlzLiRvcHRpb25zLmNvbXB1dGVkXG4gIGlmIChjb21wdXRlZCkge1xuICAgIGZvciAodmFyIGtleSBpbiBjb21wdXRlZCkge1xuICAgICAgdmFyIHVzZXJEZWYgPSBjb21wdXRlZFtrZXldXG4gICAgICB2YXIgZGVmID0ge1xuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgIH1cbiAgICAgIGlmICh0eXBlb2YgdXNlckRlZiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBkZWYuZ2V0ID0gXy5iaW5kKHVzZXJEZWYsIHRoaXMpXG4gICAgICAgIGRlZi5zZXQgPSBub29wXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkZWYuZ2V0ID0gdXNlckRlZi5nZXRcbiAgICAgICAgICA/IF8uYmluZCh1c2VyRGVmLmdldCwgdGhpcylcbiAgICAgICAgICA6IG5vb3BcbiAgICAgICAgZGVmLnNldCA9IHVzZXJEZWYuc2V0XG4gICAgICAgICAgPyBfLmJpbmQodXNlckRlZi5zZXQsIHRoaXMpXG4gICAgICAgICAgOiBub29wXG4gICAgICB9XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywga2V5LCBkZWYpXG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogU2V0dXAgaW5zdGFuY2UgbWV0aG9kcy4gTWV0aG9kcyBtdXN0IGJlIGJvdW5kIHRvIHRoZVxuICogaW5zdGFuY2Ugc2luY2UgdGhleSBtaWdodCBiZSBjYWxsZWQgYnkgY2hpbGRyZW5cbiAqIGluaGVyaXRpbmcgdGhlbS5cbiAqL1xuXG5leHBvcnRzLl9pbml0TWV0aG9kcyA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIG1ldGhvZHMgPSB0aGlzLiRvcHRpb25zLm1ldGhvZHNcbiAgaWYgKG1ldGhvZHMpIHtcbiAgICBmb3IgKHZhciBrZXkgaW4gbWV0aG9kcykge1xuICAgICAgdGhpc1trZXldID0gXy5iaW5kKG1ldGhvZHNba2V5XSwgdGhpcylcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBJbml0aWFsaXplIG1ldGEgaW5mb3JtYXRpb24gbGlrZSAkaW5kZXgsICRrZXkgJiAkdmFsdWUuXG4gKi9cblxuZXhwb3J0cy5faW5pdE1ldGEgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBtZXRhcyA9IHRoaXMuJG9wdGlvbnMuX21ldGFcbiAgaWYgKG1ldGFzKSB7XG4gICAgZm9yICh2YXIga2V5IGluIG1ldGFzKSB7XG4gICAgICB0aGlzLl9kZWZpbmVNZXRhKGtleSwgbWV0YXNba2V5XSlcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBEZWZpbmUgYSBtZXRhIHByb3BlcnR5LCBlLmcgJGluZGV4LCAka2V5LCAkdmFsdWVcbiAqIHdoaWNoIG9ubHkgZXhpc3RzIG9uIHRoZSB2bSBpbnN0YW5jZSBidXQgbm90IGluICRkYXRhLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBrZXlcbiAqIEBwYXJhbSB7Kn0gdmFsdWVcbiAqL1xuXG5leHBvcnRzLl9kZWZpbmVNZXRhID0gZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgdmFyIGRlcCA9IG5ldyBEZXAoKVxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywga2V5LCB7XG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgZ2V0OiBmdW5jdGlvbiBtZXRhR2V0dGVyICgpIHtcbiAgICAgIGlmIChPYnNlcnZlci50YXJnZXQpIHtcbiAgICAgICAgT2JzZXJ2ZXIudGFyZ2V0LmFkZERlcChkZXApXG4gICAgICB9XG4gICAgICByZXR1cm4gdmFsdWVcbiAgICB9LFxuICAgIHNldDogZnVuY3Rpb24gbWV0YVNldHRlciAodmFsKSB7XG4gICAgICBpZiAodmFsICE9PSB2YWx1ZSkge1xuICAgICAgICB2YWx1ZSA9IHZhbFxuICAgICAgICBkZXAubm90aWZ5KClcbiAgICAgIH1cbiAgICB9XG4gIH0pXG59XG4iLCJ2YXIgXyA9IHJlcXVpcmUoJy4uL3V0aWwnKVxudmFyIGFycmF5UHJvdG8gPSBBcnJheS5wcm90b3R5cGVcbnZhciBhcnJheU1ldGhvZHMgPSBPYmplY3QuY3JlYXRlKGFycmF5UHJvdG8pXG5cbi8qKlxuICogSW50ZXJjZXB0IG11dGF0aW5nIG1ldGhvZHMgYW5kIGVtaXQgZXZlbnRzXG4gKi9cblxuO1tcbiAgJ3B1c2gnLFxuICAncG9wJyxcbiAgJ3NoaWZ0JyxcbiAgJ3Vuc2hpZnQnLFxuICAnc3BsaWNlJyxcbiAgJ3NvcnQnLFxuICAncmV2ZXJzZSdcbl1cbi5mb3JFYWNoKGZ1bmN0aW9uIChtZXRob2QpIHtcbiAgLy8gY2FjaGUgb3JpZ2luYWwgbWV0aG9kXG4gIHZhciBvcmlnaW5hbCA9IGFycmF5UHJvdG9bbWV0aG9kXVxuICBfLmRlZmluZShhcnJheU1ldGhvZHMsIG1ldGhvZCwgZnVuY3Rpb24gbXV0YXRvciAoKSB7XG4gICAgLy8gYXZvaWQgbGVha2luZyBhcmd1bWVudHM6XG4gICAgLy8gaHR0cDovL2pzcGVyZi5jb20vY2xvc3VyZS13aXRoLWFyZ3VtZW50c1xuICAgIHZhciBpID0gYXJndW1lbnRzLmxlbmd0aFxuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGkpXG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgYXJnc1tpXSA9IGFyZ3VtZW50c1tpXVxuICAgIH1cbiAgICB2YXIgcmVzdWx0ID0gb3JpZ2luYWwuYXBwbHkodGhpcywgYXJncylcbiAgICB2YXIgb2IgPSB0aGlzLl9fb2JfX1xuICAgIHZhciBpbnNlcnRlZFxuICAgIHN3aXRjaCAobWV0aG9kKSB7XG4gICAgICBjYXNlICdwdXNoJzpcbiAgICAgICAgaW5zZXJ0ZWQgPSBhcmdzXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICd1bnNoaWZ0JzpcbiAgICAgICAgaW5zZXJ0ZWQgPSBhcmdzXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICdzcGxpY2UnOlxuICAgICAgICBpbnNlcnRlZCA9IGFyZ3Muc2xpY2UoMilcbiAgICAgICAgYnJlYWtcbiAgICB9XG4gICAgaWYgKGluc2VydGVkKSBvYi5vYnNlcnZlQXJyYXkoaW5zZXJ0ZWQpXG4gICAgLy8gbm90aWZ5IGNoYW5nZVxuICAgIG9iLm5vdGlmeSgpXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9KVxufSlcblxuLyoqXG4gKiBTd2FwIHRoZSBlbGVtZW50IGF0IHRoZSBnaXZlbiBpbmRleCB3aXRoIGEgbmV3IHZhbHVlXG4gKiBhbmQgZW1pdHMgY29ycmVzcG9uZGluZyBldmVudC5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gaW5kZXhcbiAqIEBwYXJhbSB7Kn0gdmFsXG4gKiBAcmV0dXJuIHsqfSAtIHJlcGxhY2VkIGVsZW1lbnRcbiAqL1xuXG5fLmRlZmluZShcbiAgYXJyYXlQcm90byxcbiAgJyRzZXQnLFxuICBmdW5jdGlvbiAkc2V0IChpbmRleCwgdmFsKSB7XG4gICAgaWYgKGluZGV4ID49IHRoaXMubGVuZ3RoKSB7XG4gICAgICB0aGlzLmxlbmd0aCA9IGluZGV4ICsgMVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy5zcGxpY2UoaW5kZXgsIDEsIHZhbClbMF1cbiAgfVxuKVxuXG4vKipcbiAqIENvbnZlbmllbmNlIG1ldGhvZCB0byByZW1vdmUgdGhlIGVsZW1lbnQgYXQgZ2l2ZW4gaW5kZXguXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IGluZGV4XG4gKiBAcGFyYW0geyp9IHZhbFxuICovXG5cbl8uZGVmaW5lKFxuICBhcnJheVByb3RvLFxuICAnJHJlbW92ZScsXG4gIGZ1bmN0aW9uICRyZW1vdmUgKGluZGV4KSB7XG4gICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gICAgaWYgKCF0aGlzLmxlbmd0aCkgcmV0dXJuXG4gICAgaWYgKHR5cGVvZiBpbmRleCAhPT0gJ251bWJlcicpIHtcbiAgICAgIGluZGV4ID0gXy5pbmRleE9mKHRoaXMsIGluZGV4KVxuICAgIH1cbiAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgdGhpcy5zcGxpY2UoaW5kZXgsIDEpXG4gICAgfVxuICB9XG4pXG5cbm1vZHVsZS5leHBvcnRzID0gYXJyYXlNZXRob2RzIiwidmFyIF8gPSByZXF1aXJlKCcuLi91dGlsJylcblxuLyoqXG4gKiBBIGRlcCBpcyBhbiBvYnNlcnZhYmxlIHRoYXQgY2FuIGhhdmUgbXVsdGlwbGVcbiAqIGRpcmVjdGl2ZXMgc3Vic2NyaWJpbmcgdG8gaXQuXG4gKlxuICogQGNvbnN0cnVjdG9yXG4gKi9cblxuZnVuY3Rpb24gRGVwICgpIHtcbiAgdGhpcy5zdWJzID0gW11cbn1cblxudmFyIHAgPSBEZXAucHJvdG90eXBlXG5cbi8qKlxuICogQWRkIGEgZGlyZWN0aXZlIHN1YnNjcmliZXIuXG4gKlxuICogQHBhcmFtIHtEaXJlY3RpdmV9IHN1YlxuICovXG5cbnAuYWRkU3ViID0gZnVuY3Rpb24gKHN1Yikge1xuICB0aGlzLnN1YnMucHVzaChzdWIpXG59XG5cbi8qKlxuICogUmVtb3ZlIGEgZGlyZWN0aXZlIHN1YnNjcmliZXIuXG4gKlxuICogQHBhcmFtIHtEaXJlY3RpdmV9IHN1YlxuICovXG5cbnAucmVtb3ZlU3ViID0gZnVuY3Rpb24gKHN1Yikge1xuICB0aGlzLnN1YnMuJHJlbW92ZShzdWIpXG59XG5cbi8qKlxuICogTm90aWZ5IGFsbCBzdWJzY3JpYmVycyBvZiBhIG5ldyB2YWx1ZS5cbiAqL1xuXG5wLm5vdGlmeSA9IGZ1bmN0aW9uICgpIHtcbiAgLy8gc3RhYmxpemUgdGhlIHN1YnNjcmliZXIgbGlzdCBmaXJzdFxuICB2YXIgc3VicyA9IF8udG9BcnJheSh0aGlzLnN1YnMpXG4gIGZvciAodmFyIGkgPSAwLCBsID0gc3Vicy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBzdWJzW2ldLnVwZGF0ZSgpXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBEZXAiLCJ2YXIgXyA9IHJlcXVpcmUoJy4uL3V0aWwnKVxudmFyIGNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZycpXG52YXIgRGVwID0gcmVxdWlyZSgnLi9kZXAnKVxudmFyIGFycmF5TWV0aG9kcyA9IHJlcXVpcmUoJy4vYXJyYXknKVxudmFyIGFycmF5S2V5cyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKGFycmF5TWV0aG9kcylcbnJlcXVpcmUoJy4vb2JqZWN0JylcblxudmFyIHVpZCA9IDBcblxuLyoqXG4gKiBUeXBlIGVudW1zXG4gKi9cblxudmFyIEFSUkFZICA9IDBcbnZhciBPQkpFQ1QgPSAxXG5cbi8qKlxuICogQXVnbWVudCBhbiB0YXJnZXQgT2JqZWN0IG9yIEFycmF5IGJ5IGludGVyY2VwdGluZ1xuICogdGhlIHByb3RvdHlwZSBjaGFpbiB1c2luZyBfX3Byb3RvX19cbiAqXG4gKiBAcGFyYW0ge09iamVjdHxBcnJheX0gdGFyZ2V0XG4gKiBAcGFyYW0ge09iamVjdH0gcHJvdG9cbiAqL1xuXG5mdW5jdGlvbiBwcm90b0F1Z21lbnQgKHRhcmdldCwgc3JjKSB7XG4gIHRhcmdldC5fX3Byb3RvX18gPSBzcmNcbn1cblxuLyoqXG4gKiBBdWdtZW50IGFuIHRhcmdldCBPYmplY3Qgb3IgQXJyYXkgYnkgZGVmaW5pbmdcbiAqIGhpZGRlbiBwcm9wZXJ0aWVzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fEFycmF5fSB0YXJnZXRcbiAqIEBwYXJhbSB7T2JqZWN0fSBwcm90b1xuICovXG5cbmZ1bmN0aW9uIGNvcHlBdWdtZW50ICh0YXJnZXQsIHNyYywga2V5cykge1xuICB2YXIgaSA9IGtleXMubGVuZ3RoXG4gIHZhciBrZXlcbiAgd2hpbGUgKGktLSkge1xuICAgIGtleSA9IGtleXNbaV1cbiAgICBfLmRlZmluZSh0YXJnZXQsIGtleSwgc3JjW2tleV0pXG4gIH1cbn1cblxuLyoqXG4gKiBPYnNlcnZlciBjbGFzcyB0aGF0IGFyZSBhdHRhY2hlZCB0byBlYWNoIG9ic2VydmVkXG4gKiBvYmplY3QuIE9uY2UgYXR0YWNoZWQsIHRoZSBvYnNlcnZlciBjb252ZXJ0cyB0YXJnZXRcbiAqIG9iamVjdCdzIHByb3BlcnR5IGtleXMgaW50byBnZXR0ZXIvc2V0dGVycyB0aGF0XG4gKiBjb2xsZWN0IGRlcGVuZGVuY2llcyBhbmQgZGlzcGF0Y2hlcyB1cGRhdGVzLlxuICpcbiAqIEBwYXJhbSB7QXJyYXl8T2JqZWN0fSB2YWx1ZVxuICogQHBhcmFtIHtOdW1iZXJ9IHR5cGVcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5cbmZ1bmN0aW9uIE9ic2VydmVyICh2YWx1ZSwgdHlwZSkge1xuICB0aGlzLmlkID0gKyt1aWRcbiAgdGhpcy52YWx1ZSA9IHZhbHVlXG4gIHRoaXMuYWN0aXZlID0gdHJ1ZVxuICB0aGlzLmRlcHMgPSBbXVxuICBfLmRlZmluZSh2YWx1ZSwgJ19fb2JfXycsIHRoaXMpXG4gIGlmICh0eXBlID09PSBBUlJBWSkge1xuICAgIHZhciBhdWdtZW50ID0gY29uZmlnLnByb3RvICYmIF8uaGFzUHJvdG9cbiAgICAgID8gcHJvdG9BdWdtZW50XG4gICAgICA6IGNvcHlBdWdtZW50XG4gICAgYXVnbWVudCh2YWx1ZSwgYXJyYXlNZXRob2RzLCBhcnJheUtleXMpXG4gICAgdGhpcy5vYnNlcnZlQXJyYXkodmFsdWUpXG4gIH0gZWxzZSBpZiAodHlwZSA9PT0gT0JKRUNUKSB7XG4gICAgdGhpcy53YWxrKHZhbHVlKVxuICB9XG59XG5cbk9ic2VydmVyLnRhcmdldCA9IG51bGxcblxudmFyIHAgPSBPYnNlcnZlci5wcm90b3R5cGVcblxuLyoqXG4gKiBBdHRlbXB0IHRvIGNyZWF0ZSBhbiBvYnNlcnZlciBpbnN0YW5jZSBmb3IgYSB2YWx1ZSxcbiAqIHJldHVybnMgdGhlIG5ldyBvYnNlcnZlciBpZiBzdWNjZXNzZnVsbHkgb2JzZXJ2ZWQsXG4gKiBvciB0aGUgZXhpc3Rpbmcgb2JzZXJ2ZXIgaWYgdGhlIHZhbHVlIGFscmVhZHkgaGFzIG9uZS5cbiAqXG4gKiBAcGFyYW0geyp9IHZhbHVlXG4gKiBAcmV0dXJuIHtPYnNlcnZlcnx1bmRlZmluZWR9XG4gKiBAc3RhdGljXG4gKi9cblxuT2JzZXJ2ZXIuY3JlYXRlID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIGlmIChcbiAgICB2YWx1ZSAmJlxuICAgIHZhbHVlLmhhc093blByb3BlcnR5KCdfX29iX18nKSAmJlxuICAgIHZhbHVlLl9fb2JfXyBpbnN0YW5jZW9mIE9ic2VydmVyXG4gICkge1xuICAgIHJldHVybiB2YWx1ZS5fX29iX19cbiAgfSBlbHNlIGlmIChfLmlzQXJyYXkodmFsdWUpKSB7XG4gICAgcmV0dXJuIG5ldyBPYnNlcnZlcih2YWx1ZSwgQVJSQVkpXG4gIH0gZWxzZSBpZiAoXG4gICAgXy5pc1BsYWluT2JqZWN0KHZhbHVlKSAmJlxuICAgICF2YWx1ZS5faXNWdWUgLy8gYXZvaWQgVnVlIGluc3RhbmNlXG4gICkge1xuICAgIHJldHVybiBuZXcgT2JzZXJ2ZXIodmFsdWUsIE9CSkVDVClcbiAgfVxufVxuXG4vKipcbiAqIFdhbGsgdGhyb3VnaCBlYWNoIHByb3BlcnR5IGFuZCBjb252ZXJ0IHRoZW0gaW50b1xuICogZ2V0dGVyL3NldHRlcnMuIFRoaXMgbWV0aG9kIHNob3VsZCBvbmx5IGJlIGNhbGxlZCB3aGVuXG4gKiB2YWx1ZSB0eXBlIGlzIE9iamVjdC4gUHJvcGVydGllcyBwcmVmaXhlZCB3aXRoIGAkYCBvciBgX2BcbiAqIGFuZCBhY2Nlc3NvciBwcm9wZXJ0aWVzIGFyZSBpZ25vcmVkLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmpcbiAqL1xuXG5wLndhbGsgPSBmdW5jdGlvbiAob2JqKSB7XG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXMob2JqKVxuICB2YXIgaSA9IGtleXMubGVuZ3RoXG4gIHZhciBrZXksIHByZWZpeFxuICB3aGlsZSAoaS0tKSB7XG4gICAga2V5ID0ga2V5c1tpXVxuICAgIHByZWZpeCA9IGtleS5jaGFyQ29kZUF0KDApXG4gICAgaWYgKHByZWZpeCAhPT0gMHgyNCAmJiBwcmVmaXggIT09IDB4NUYpIHsgLy8gc2tpcCAkIG9yIF9cbiAgICAgIHRoaXMuY29udmVydChrZXksIG9ialtrZXldKVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFRyeSB0byBjYXJldGUgYW4gb2JzZXJ2ZXIgZm9yIGEgY2hpbGQgdmFsdWUsXG4gKiBhbmQgaWYgdmFsdWUgaXMgYXJyYXksIGxpbmsgZGVwIHRvIHRoZSBhcnJheS5cbiAqXG4gKiBAcGFyYW0geyp9IHZhbFxuICogQHJldHVybiB7RGVwfHVuZGVmaW5lZH1cbiAqL1xuXG5wLm9ic2VydmUgPSBmdW5jdGlvbiAodmFsKSB7XG4gIHJldHVybiBPYnNlcnZlci5jcmVhdGUodmFsKVxufVxuXG4vKipcbiAqIE9ic2VydmUgYSBsaXN0IG9mIEFycmF5IGl0ZW1zLlxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IGl0ZW1zXG4gKi9cblxucC5vYnNlcnZlQXJyYXkgPSBmdW5jdGlvbiAoaXRlbXMpIHtcbiAgdmFyIGkgPSBpdGVtcy5sZW5ndGhcbiAgd2hpbGUgKGktLSkge1xuICAgIHRoaXMub2JzZXJ2ZShpdGVtc1tpXSlcbiAgfVxufVxuXG4vKipcbiAqIENvbnZlcnQgYSBwcm9wZXJ0eSBpbnRvIGdldHRlci9zZXR0ZXIgc28gd2UgY2FuIGVtaXRcbiAqIHRoZSBldmVudHMgd2hlbiB0aGUgcHJvcGVydHkgaXMgYWNjZXNzZWQvY2hhbmdlZC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30ga2V5XG4gKiBAcGFyYW0geyp9IHZhbFxuICovXG5cbnAuY29udmVydCA9IGZ1bmN0aW9uIChrZXksIHZhbCkge1xuICB2YXIgb2IgPSB0aGlzXG4gIHZhciBjaGlsZE9iID0gb2Iub2JzZXJ2ZSh2YWwpXG4gIHZhciBkZXAgPSBuZXcgRGVwKClcbiAgaWYgKGNoaWxkT2IpIHtcbiAgICBjaGlsZE9iLmRlcHMucHVzaChkZXApXG4gIH1cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iLnZhbHVlLCBrZXksIHtcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIC8vIE9ic2VydmVyLnRhcmdldCBpcyBhIHdhdGNoZXIgd2hvc2UgZ2V0dGVyIGlzXG4gICAgICAvLyBjdXJyZW50bHkgYmVpbmcgZXZhbHVhdGVkLlxuICAgICAgaWYgKG9iLmFjdGl2ZSAmJiBPYnNlcnZlci50YXJnZXQpIHtcbiAgICAgICAgT2JzZXJ2ZXIudGFyZ2V0LmFkZERlcChkZXApXG4gICAgICB9XG4gICAgICByZXR1cm4gdmFsXG4gICAgfSxcbiAgICBzZXQ6IGZ1bmN0aW9uIChuZXdWYWwpIHtcbiAgICAgIGlmIChuZXdWYWwgPT09IHZhbCkgcmV0dXJuXG4gICAgICAvLyByZW1vdmUgZGVwIGZyb20gb2xkIHZhbHVlXG4gICAgICB2YXIgb2xkQ2hpbGRPYiA9IHZhbCAmJiB2YWwuX19vYl9fXG4gICAgICBpZiAob2xkQ2hpbGRPYikge1xuICAgICAgICBvbGRDaGlsZE9iLmRlcHMuJHJlbW92ZShkZXApXG4gICAgICB9XG4gICAgICB2YWwgPSBuZXdWYWxcbiAgICAgIC8vIGFkZCBkZXAgdG8gbmV3IHZhbHVlXG4gICAgICB2YXIgbmV3Q2hpbGRPYiA9IG9iLm9ic2VydmUobmV3VmFsKVxuICAgICAgaWYgKG5ld0NoaWxkT2IpIHtcbiAgICAgICAgbmV3Q2hpbGRPYi5kZXBzLnB1c2goZGVwKVxuICAgICAgfVxuICAgICAgZGVwLm5vdGlmeSgpXG4gICAgfVxuICB9KVxufVxuXG4vKipcbiAqIE5vdGlmeSBjaGFuZ2Ugb24gYWxsIHNlbGYgZGVwcyBvbiBhbiBvYnNlcnZlci5cbiAqIFRoaXMgaXMgY2FsbGVkIHdoZW4gYSBtdXRhYmxlIHZhbHVlIG11dGF0ZXMuIGUuZy5cbiAqIHdoZW4gYW4gQXJyYXkncyBtdXRhdGluZyBtZXRob2RzIGFyZSBjYWxsZWQsIG9yIGFuXG4gKiBPYmplY3QncyAkYWRkLyRkZWxldGUgYXJlIGNhbGxlZC5cbiAqL1xuXG5wLm5vdGlmeSA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIGRlcHMgPSB0aGlzLmRlcHNcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBkZXBzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIGRlcHNbaV0ubm90aWZ5KClcbiAgfVxufVxuXG4vKipcbiAqIEFkZCBhbiBvd25lciB2bSwgc28gdGhhdCB3aGVuICRhZGQvJGRlbGV0ZSBtdXRhdGlvbnNcbiAqIGhhcHBlbiB3ZSBjYW4gbm90aWZ5IG93bmVyIHZtcyB0byBwcm94eSB0aGUga2V5cyBhbmRcbiAqIGRpZ2VzdCB0aGUgd2F0Y2hlcnMuIFRoaXMgaXMgb25seSBjYWxsZWQgd2hlbiB0aGUgb2JqZWN0XG4gKiBpcyBvYnNlcnZlZCBhcyBhbiBpbnN0YW5jZSdzIHJvb3QgJGRhdGEuXG4gKlxuICogQHBhcmFtIHtWdWV9IHZtXG4gKi9cblxucC5hZGRWbSA9IGZ1bmN0aW9uICh2bSkge1xuICAodGhpcy52bXMgPSB0aGlzLnZtcyB8fCBbXSkucHVzaCh2bSlcbn1cblxuLyoqXG4gKiBSZW1vdmUgYW4gb3duZXIgdm0uIFRoaXMgaXMgY2FsbGVkIHdoZW4gdGhlIG9iamVjdCBpc1xuICogc3dhcHBlZCBvdXQgYXMgYW4gaW5zdGFuY2UncyAkZGF0YSBvYmplY3QuXG4gKlxuICogQHBhcmFtIHtWdWV9IHZtXG4gKi9cblxucC5yZW1vdmVWbSA9IGZ1bmN0aW9uICh2bSkge1xuICB0aGlzLnZtcy4kcmVtb3ZlKHZtKVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IE9ic2VydmVyXG4iLCJ2YXIgXyA9IHJlcXVpcmUoJy4uL3V0aWwnKVxudmFyIG9ialByb3RvID0gT2JqZWN0LnByb3RvdHlwZVxuXG4vKipcbiAqIEFkZCBhIG5ldyBwcm9wZXJ0eSB0byBhbiBvYnNlcnZlZCBvYmplY3RcbiAqIGFuZCBlbWl0cyBjb3JyZXNwb25kaW5nIGV2ZW50XG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGtleVxuICogQHBhcmFtIHsqfSB2YWxcbiAqIEBwdWJsaWNcbiAqL1xuXG5fLmRlZmluZShcbiAgb2JqUHJvdG8sXG4gICckYWRkJyxcbiAgZnVuY3Rpb24gJGFkZCAoa2V5LCB2YWwpIHtcbiAgICBpZiAodGhpcy5oYXNPd25Qcm9wZXJ0eShrZXkpKSByZXR1cm5cbiAgICB2YXIgb2IgPSB0aGlzLl9fb2JfX1xuICAgIGlmICghb2IgfHwgXy5pc1Jlc2VydmVkKGtleSkpIHtcbiAgICAgIHRoaXNba2V5XSA9IHZhbFxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIG9iLmNvbnZlcnQoa2V5LCB2YWwpXG4gICAgb2Iubm90aWZ5KClcbiAgICBpZiAob2Iudm1zKSB7XG4gICAgICB2YXIgaSA9IG9iLnZtcy5sZW5ndGhcbiAgICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgdmFyIHZtID0gb2Iudm1zW2ldXG4gICAgICAgIHZtLl9wcm94eShrZXkpXG4gICAgICAgIHZtLl9kaWdlc3QoKVxuICAgICAgfVxuICAgIH1cbiAgfVxuKVxuXG4vKipcbiAqIFNldCBhIHByb3BlcnR5IG9uIGFuIG9ic2VydmVkIG9iamVjdCwgY2FsbGluZyBhZGQgdG9cbiAqIGVuc3VyZSB0aGUgcHJvcGVydHkgaXMgb2JzZXJ2ZWQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGtleVxuICogQHBhcmFtIHsqfSB2YWxcbiAqIEBwdWJsaWNcbiAqL1xuXG5fLmRlZmluZShcbiAgb2JqUHJvdG8sXG4gICckc2V0JyxcbiAgZnVuY3Rpb24gJHNldCAoa2V5LCB2YWwpIHtcbiAgICB0aGlzLiRhZGQoa2V5LCB2YWwpXG4gICAgdGhpc1trZXldID0gdmFsXG4gIH1cbilcblxuLyoqXG4gKiBEZWxldGVzIGEgcHJvcGVydHkgZnJvbSBhbiBvYnNlcnZlZCBvYmplY3RcbiAqIGFuZCBlbWl0cyBjb3JyZXNwb25kaW5nIGV2ZW50XG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGtleVxuICogQHB1YmxpY1xuICovXG5cbl8uZGVmaW5lKFxuICBvYmpQcm90byxcbiAgJyRkZWxldGUnLFxuICBmdW5jdGlvbiAkZGVsZXRlIChrZXkpIHtcbiAgICBpZiAoIXRoaXMuaGFzT3duUHJvcGVydHkoa2V5KSkgcmV0dXJuXG4gICAgZGVsZXRlIHRoaXNba2V5XVxuICAgIHZhciBvYiA9IHRoaXMuX19vYl9fXG4gICAgaWYgKCFvYiB8fCBfLmlzUmVzZXJ2ZWQoa2V5KSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIG9iLm5vdGlmeSgpXG4gICAgaWYgKG9iLnZtcykge1xuICAgICAgdmFyIGkgPSBvYi52bXMubGVuZ3RoXG4gICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgIHZhciB2bSA9IG9iLnZtc1tpXVxuICAgICAgICB2bS5fdW5wcm94eShrZXkpXG4gICAgICAgIHZtLl9kaWdlc3QoKVxuICAgICAgfVxuICAgIH1cbiAgfVxuKSIsInZhciBfID0gcmVxdWlyZSgnLi4vdXRpbCcpXG52YXIgQ2FjaGUgPSByZXF1aXJlKCcuLi9jYWNoZScpXG52YXIgY2FjaGUgPSBuZXcgQ2FjaGUoMTAwMClcbnZhciBhcmdSRSA9IC9eW15cXHtcXD9dKyR8XidbXiddKickfF5cIlteXCJdKlwiJC9cbnZhciBmaWx0ZXJUb2tlblJFID0gL1teXFxzJ1wiXSt8J1teJ10rJ3xcIlteXCJdK1wiL2dcbnZhciByZXNlcnZlZEFyZ1JFID0gL15pbiR8Xi0/XFxkKy9cblxuLyoqXG4gKiBQYXJzZXIgc3RhdGVcbiAqL1xuXG52YXIgc3RyXG52YXIgYywgaSwgbFxudmFyIGluU2luZ2xlXG52YXIgaW5Eb3VibGVcbnZhciBjdXJseVxudmFyIHNxdWFyZVxudmFyIHBhcmVuXG52YXIgYmVnaW5cbnZhciBhcmdJbmRleFxudmFyIGRpcnNcbnZhciBkaXJcbnZhciBsYXN0RmlsdGVySW5kZXhcbnZhciBhcmdcblxuLyoqXG4gKiBQdXNoIGEgZGlyZWN0aXZlIG9iamVjdCBpbnRvIHRoZSByZXN1bHQgQXJyYXlcbiAqL1xuXG5mdW5jdGlvbiBwdXNoRGlyICgpIHtcbiAgZGlyLnJhdyA9IHN0ci5zbGljZShiZWdpbiwgaSkudHJpbSgpXG4gIGlmIChkaXIuZXhwcmVzc2lvbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgZGlyLmV4cHJlc3Npb24gPSBzdHIuc2xpY2UoYXJnSW5kZXgsIGkpLnRyaW0oKVxuICB9IGVsc2UgaWYgKGxhc3RGaWx0ZXJJbmRleCAhPT0gYmVnaW4pIHtcbiAgICBwdXNoRmlsdGVyKClcbiAgfVxuICBpZiAoaSA9PT0gMCB8fCBkaXIuZXhwcmVzc2lvbikge1xuICAgIGRpcnMucHVzaChkaXIpXG4gIH1cbn1cblxuLyoqXG4gKiBQdXNoIGEgZmlsdGVyIHRvIHRoZSBjdXJyZW50IGRpcmVjdGl2ZSBvYmplY3RcbiAqL1xuXG5mdW5jdGlvbiBwdXNoRmlsdGVyICgpIHtcbiAgdmFyIGV4cCA9IHN0ci5zbGljZShsYXN0RmlsdGVySW5kZXgsIGkpLnRyaW0oKVxuICB2YXIgZmlsdGVyXG4gIGlmIChleHApIHtcbiAgICBmaWx0ZXIgPSB7fVxuICAgIHZhciB0b2tlbnMgPSBleHAubWF0Y2goZmlsdGVyVG9rZW5SRSlcbiAgICBmaWx0ZXIubmFtZSA9IHRva2Vuc1swXVxuICAgIGlmICh0b2tlbnMubGVuZ3RoID4gMSkge1xuICAgICAgZmlsdGVyLmFyZ3MgPSB0b2tlbnMuc2xpY2UoMSkubWFwKHByb2Nlc3NGaWx0ZXJBcmcpXG4gICAgfVxuICB9XG4gIGlmIChmaWx0ZXIpIHtcbiAgICAoZGlyLmZpbHRlcnMgPSBkaXIuZmlsdGVycyB8fCBbXSkucHVzaChmaWx0ZXIpXG4gIH1cbiAgbGFzdEZpbHRlckluZGV4ID0gaSArIDFcbn1cblxuLyoqXG4gKiBDaGVjayBpZiBhbiBhcmd1bWVudCBpcyBkeW5hbWljIGFuZCBzdHJpcCBxdW90ZXMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGFyZ1xuICogQHJldHVybiB7T2JqZWN0fVxuICovXG5cbmZ1bmN0aW9uIHByb2Nlc3NGaWx0ZXJBcmcgKGFyZykge1xuICB2YXIgc3RyaXBwZWQgPSByZXNlcnZlZEFyZ1JFLnRlc3QoYXJnKVxuICAgID8gYXJnXG4gICAgOiBfLnN0cmlwUXVvdGVzKGFyZylcbiAgcmV0dXJuIHtcbiAgICB2YWx1ZTogc3RyaXBwZWQgfHwgYXJnLFxuICAgIGR5bmFtaWM6ICFzdHJpcHBlZFxuICB9XG59XG5cbi8qKlxuICogUGFyc2UgYSBkaXJlY3RpdmUgc3RyaW5nIGludG8gYW4gQXJyYXkgb2YgQVNULWxpa2VcbiAqIG9iamVjdHMgcmVwcmVzZW50aW5nIGRpcmVjdGl2ZXMuXG4gKlxuICogRXhhbXBsZTpcbiAqXG4gKiBcImNsaWNrOiBhID0gYSArIDEgfCB1cHBlcmNhc2VcIiB3aWxsIHlpZWxkOlxuICoge1xuICogICBhcmc6ICdjbGljaycsXG4gKiAgIGV4cHJlc3Npb246ICdhID0gYSArIDEnLFxuICogICBmaWx0ZXJzOiBbXG4gKiAgICAgeyBuYW1lOiAndXBwZXJjYXNlJywgYXJnczogbnVsbCB9XG4gKiAgIF1cbiAqIH1cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gKiBAcmV0dXJuIHtBcnJheTxPYmplY3Q+fVxuICovXG5cbmV4cG9ydHMucGFyc2UgPSBmdW5jdGlvbiAocykge1xuXG4gIHZhciBoaXQgPSBjYWNoZS5nZXQocylcbiAgaWYgKGhpdCkge1xuICAgIHJldHVybiBoaXRcbiAgfVxuXG4gIC8vIHJlc2V0IHBhcnNlciBzdGF0ZVxuICBzdHIgPSBzXG4gIGluU2luZ2xlID0gaW5Eb3VibGUgPSBmYWxzZVxuICBjdXJseSA9IHNxdWFyZSA9IHBhcmVuID0gYmVnaW4gPSBhcmdJbmRleCA9IDBcbiAgbGFzdEZpbHRlckluZGV4ID0gMFxuICBkaXJzID0gW11cbiAgZGlyID0ge31cbiAgYXJnID0gbnVsbFxuXG4gIGZvciAoaSA9IDAsIGwgPSBzdHIubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgYyA9IHN0ci5jaGFyQ29kZUF0KGkpXG4gICAgaWYgKGluU2luZ2xlKSB7XG4gICAgICAvLyBjaGVjayBzaW5nbGUgcXVvdGVcbiAgICAgIGlmIChjID09PSAweDI3KSBpblNpbmdsZSA9ICFpblNpbmdsZVxuICAgIH0gZWxzZSBpZiAoaW5Eb3VibGUpIHtcbiAgICAgIC8vIGNoZWNrIGRvdWJsZSBxdW90ZVxuICAgICAgaWYgKGMgPT09IDB4MjIpIGluRG91YmxlID0gIWluRG91YmxlXG4gICAgfSBlbHNlIGlmIChcbiAgICAgIGMgPT09IDB4MkMgJiYgLy8gY29tbWFcbiAgICAgICFwYXJlbiAmJiAhY3VybHkgJiYgIXNxdWFyZVxuICAgICkge1xuICAgICAgLy8gcmVhY2hlZCB0aGUgZW5kIG9mIGEgZGlyZWN0aXZlXG4gICAgICBwdXNoRGlyKClcbiAgICAgIC8vIHJlc2V0ICYgc2tpcCB0aGUgY29tbWFcbiAgICAgIGRpciA9IHt9XG4gICAgICBiZWdpbiA9IGFyZ0luZGV4ID0gbGFzdEZpbHRlckluZGV4ID0gaSArIDFcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgYyA9PT0gMHgzQSAmJiAvLyBjb2xvblxuICAgICAgIWRpci5leHByZXNzaW9uICYmXG4gICAgICAhZGlyLmFyZ1xuICAgICkge1xuICAgICAgLy8gYXJndW1lbnRcbiAgICAgIGFyZyA9IHN0ci5zbGljZShiZWdpbiwgaSkudHJpbSgpXG4gICAgICAvLyB0ZXN0IGZvciB2YWxpZCBhcmd1bWVudCBoZXJlXG4gICAgICAvLyBzaW5jZSB3ZSBtYXkgaGF2ZSBjYXVnaHQgc3R1ZmYgbGlrZSBmaXJzdCBoYWxmIG9mXG4gICAgICAvLyBhbiBvYmplY3QgbGl0ZXJhbCBvciBhIHRlcm5hcnkgZXhwcmVzc2lvbi5cbiAgICAgIGlmIChhcmdSRS50ZXN0KGFyZykpIHtcbiAgICAgICAgYXJnSW5kZXggPSBpICsgMVxuICAgICAgICBkaXIuYXJnID0gXy5zdHJpcFF1b3RlcyhhcmcpIHx8IGFyZ1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoXG4gICAgICBjID09PSAweDdDICYmIC8vIHBpcGVcbiAgICAgIHN0ci5jaGFyQ29kZUF0KGkgKyAxKSAhPT0gMHg3QyAmJlxuICAgICAgc3RyLmNoYXJDb2RlQXQoaSAtIDEpICE9PSAweDdDXG4gICAgKSB7XG4gICAgICBpZiAoZGlyLmV4cHJlc3Npb24gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvLyBmaXJzdCBmaWx0ZXIsIGVuZCBvZiBleHByZXNzaW9uXG4gICAgICAgIGxhc3RGaWx0ZXJJbmRleCA9IGkgKyAxXG4gICAgICAgIGRpci5leHByZXNzaW9uID0gc3RyLnNsaWNlKGFyZ0luZGV4LCBpKS50cmltKClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGFscmVhZHkgaGFzIGZpbHRlclxuICAgICAgICBwdXNoRmlsdGVyKClcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3dpdGNoIChjKSB7XG4gICAgICAgIGNhc2UgMHgyMjogaW5Eb3VibGUgPSB0cnVlOyBicmVhayAvLyBcIlxuICAgICAgICBjYXNlIDB4Mjc6IGluU2luZ2xlID0gdHJ1ZTsgYnJlYWsgLy8gJ1xuICAgICAgICBjYXNlIDB4Mjg6IHBhcmVuKys7IGJyZWFrICAgICAgICAgLy8gKFxuICAgICAgICBjYXNlIDB4Mjk6IHBhcmVuLS07IGJyZWFrICAgICAgICAgLy8gKVxuICAgICAgICBjYXNlIDB4NUI6IHNxdWFyZSsrOyBicmVhayAgICAgICAgLy8gW1xuICAgICAgICBjYXNlIDB4NUQ6IHNxdWFyZS0tOyBicmVhayAgICAgICAgLy8gXVxuICAgICAgICBjYXNlIDB4N0I6IGN1cmx5Kys7IGJyZWFrICAgICAgICAgLy8ge1xuICAgICAgICBjYXNlIDB4N0Q6IGN1cmx5LS07IGJyZWFrICAgICAgICAgLy8gfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmIChpID09PSAwIHx8IGJlZ2luICE9PSBpKSB7XG4gICAgcHVzaERpcigpXG4gIH1cblxuICBjYWNoZS5wdXQocywgZGlycylcbiAgcmV0dXJuIGRpcnNcbn0iLCJ2YXIgXyA9IHJlcXVpcmUoJy4uL3V0aWwnKVxudmFyIFBhdGggPSByZXF1aXJlKCcuL3BhdGgnKVxudmFyIENhY2hlID0gcmVxdWlyZSgnLi4vY2FjaGUnKVxudmFyIGV4cHJlc3Npb25DYWNoZSA9IG5ldyBDYWNoZSgxMDAwKVxuXG52YXIgYWxsb3dlZEtleXdvcmRzID1cbiAgJ01hdGgsRGF0ZSx0aGlzLHRydWUsZmFsc2UsbnVsbCx1bmRlZmluZWQsSW5maW5pdHksTmFOLCcgK1xuICAnaXNOYU4saXNGaW5pdGUsZGVjb2RlVVJJLGRlY29kZVVSSUNvbXBvbmVudCxlbmNvZGVVUkksJyArXG4gICdlbmNvZGVVUklDb21wb25lbnQscGFyc2VJbnQscGFyc2VGbG9hdCdcbnZhciBhbGxvd2VkS2V5d29yZHNSRSA9XG4gIG5ldyBSZWdFeHAoJ14oJyArIGFsbG93ZWRLZXl3b3Jkcy5yZXBsYWNlKC8sL2csICdcXFxcYnwnKSArICdcXFxcYiknKVxuXG4vLyBrZXl3b3JkcyB0aGF0IGRvbid0IG1ha2Ugc2Vuc2UgaW5zaWRlIGV4cHJlc3Npb25zXG52YXIgaW1wcm9wZXJLZXl3b3JkcyA9XG4gICdicmVhayxjYXNlLGNsYXNzLGNhdGNoLGNvbnN0LGNvbnRpbnVlLGRlYnVnZ2VyLGRlZmF1bHQsJyArXG4gICdkZWxldGUsZG8sZWxzZSxleHBvcnQsZXh0ZW5kcyxmaW5hbGx5LGZvcixmdW5jdGlvbixpZiwnICtcbiAgJ2ltcG9ydCxpbixpbnN0YW5jZW9mLGxldCxyZXR1cm4sc3VwZXIsc3dpdGNoLHRocm93LHRyeSwnICtcbiAgJ3Zhcix3aGlsZSx3aXRoLHlpZWxkLGVudW0sYXdhaXQsaW1wbGVtZW50cyxwYWNrYWdlLCcgK1xuICAncHJvY3RlY3RlZCxzdGF0aWMsaW50ZXJmYWNlLHByaXZhdGUscHVibGljJ1xudmFyIGltcHJvcGVyS2V5d29yZHNSRSA9XG4gIG5ldyBSZWdFeHAoJ14oJyArIGltcHJvcGVyS2V5d29yZHMucmVwbGFjZSgvLC9nLCAnXFxcXGJ8JykgKyAnXFxcXGIpJylcblxudmFyIHdzUkUgPSAvXFxzL2dcbnZhciBuZXdsaW5lUkUgPSAvXFxuL2dcbnZhciBzYXZlUkUgPSAvW1xceyxdXFxzKltcXHdcXCRfXStcXHMqOnwoJ1teJ10qJ3xcIlteXCJdKlwiKXxuZXcgfHR5cGVvZiB8dm9pZCAvZ1xudmFyIHJlc3RvcmVSRSA9IC9cIihcXGQrKVwiL2dcbnZhciBwYXRoVGVzdFJFID0gL15bQS1aYS16XyRdW1xcdyRdKihcXC5bQS1aYS16XyRdW1xcdyRdKnxcXFsnLio/J1xcXXxcXFtcIi4qP1wiXFxdfFxcW1xcZCtcXF18XFxbW0EtWmEtel8kXVtcXHckXSpcXF0pKiQvXG52YXIgcGF0aFJlcGxhY2VSRSA9IC9bXlxcdyRcXC5dKFtBLVphLXpfJF1bXFx3JF0qKFxcLltBLVphLXpfJF1bXFx3JF0qfFxcWycuKj8nXFxdfFxcW1wiLio/XCJcXF0pKikvZ1xudmFyIGJvb2xlYW5MaXRlcmFsUkUgPSAvXih0cnVlfGZhbHNlKSQvXG5cbi8qKlxuICogU2F2ZSAvIFJld3JpdGUgLyBSZXN0b3JlXG4gKlxuICogV2hlbiByZXdyaXRpbmcgcGF0aHMgZm91bmQgaW4gYW4gZXhwcmVzc2lvbiwgaXQgaXNcbiAqIHBvc3NpYmxlIGZvciB0aGUgc2FtZSBsZXR0ZXIgc2VxdWVuY2VzIHRvIGJlIGZvdW5kIGluXG4gKiBzdHJpbmdzIGFuZCBPYmplY3QgbGl0ZXJhbCBwcm9wZXJ0eSBrZXlzLiBUaGVyZWZvcmUgd2VcbiAqIHJlbW92ZSBhbmQgc3RvcmUgdGhlc2UgcGFydHMgaW4gYSB0ZW1wb3JhcnkgYXJyYXksIGFuZFxuICogcmVzdG9yZSB0aGVtIGFmdGVyIHRoZSBwYXRoIHJld3JpdGUuXG4gKi9cblxudmFyIHNhdmVkID0gW11cblxuLyoqXG4gKiBTYXZlIHJlcGxhY2VyXG4gKlxuICogVGhlIHNhdmUgcmVnZXggY2FuIG1hdGNoIHR3byBwb3NzaWJsZSBjYXNlczpcbiAqIDEuIEFuIG9wZW5pbmcgb2JqZWN0IGxpdGVyYWxcbiAqIDIuIEEgc3RyaW5nXG4gKiBJZiBtYXRjaGVkIGFzIGEgcGxhaW4gc3RyaW5nLCB3ZSBuZWVkIHRvIGVzY2FwZSBpdHNcbiAqIG5ld2xpbmVzLCBzaW5jZSB0aGUgc3RyaW5nIG5lZWRzIHRvIGJlIHByZXNlcnZlZCB3aGVuXG4gKiBnZW5lcmF0aW5nIHRoZSBmdW5jdGlvbiBib2R5LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBpc1N0cmluZyAtIHN0ciBpZiBtYXRjaGVkIGFzIGEgc3RyaW5nXG4gKiBAcmV0dXJuIHtTdHJpbmd9IC0gcGxhY2Vob2xkZXIgd2l0aCBpbmRleFxuICovXG5cbmZ1bmN0aW9uIHNhdmUgKHN0ciwgaXNTdHJpbmcpIHtcbiAgdmFyIGkgPSBzYXZlZC5sZW5ndGhcbiAgc2F2ZWRbaV0gPSBpc1N0cmluZ1xuICAgID8gc3RyLnJlcGxhY2UobmV3bGluZVJFLCAnXFxcXG4nKVxuICAgIDogc3RyXG4gIHJldHVybiAnXCInICsgaSArICdcIidcbn1cblxuLyoqXG4gKiBQYXRoIHJld3JpdGUgcmVwbGFjZXJcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gcmF3XG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKi9cblxuZnVuY3Rpb24gcmV3cml0ZSAocmF3KSB7XG4gIHZhciBjID0gcmF3LmNoYXJBdCgwKVxuICB2YXIgcGF0aCA9IHJhdy5zbGljZSgxKVxuICBpZiAoYWxsb3dlZEtleXdvcmRzUkUudGVzdChwYXRoKSkge1xuICAgIHJldHVybiByYXdcbiAgfSBlbHNlIHtcbiAgICBwYXRoID0gcGF0aC5pbmRleE9mKCdcIicpID4gLTFcbiAgICAgID8gcGF0aC5yZXBsYWNlKHJlc3RvcmVSRSwgcmVzdG9yZSlcbiAgICAgIDogcGF0aFxuICAgIHJldHVybiBjICsgJ3Njb3BlLicgKyBwYXRoXG4gIH1cbn1cblxuLyoqXG4gKiBSZXN0b3JlIHJlcGxhY2VyXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICogQHBhcmFtIHtTdHJpbmd9IGkgLSBtYXRjaGVkIHNhdmUgaW5kZXhcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqL1xuXG5mdW5jdGlvbiByZXN0b3JlIChzdHIsIGkpIHtcbiAgcmV0dXJuIHNhdmVkW2ldXG59XG5cbi8qKlxuICogUmV3cml0ZSBhbiBleHByZXNzaW9uLCBwcmVmaXhpbmcgYWxsIHBhdGggYWNjZXNzb3JzIHdpdGhcbiAqIGBzY29wZS5gIGFuZCBnZW5lcmF0ZSBnZXR0ZXIvc2V0dGVyIGZ1bmN0aW9ucy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXhwXG4gKiBAcGFyYW0ge0Jvb2xlYW59IG5lZWRTZXRcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICovXG5cbmZ1bmN0aW9uIGNvbXBpbGVFeHBGbnMgKGV4cCwgbmVlZFNldCkge1xuICBpZiAoaW1wcm9wZXJLZXl3b3Jkc1JFLnRlc3QoZXhwKSkge1xuICAgIF8ud2FybihcbiAgICAgICdBdm9pZCB1c2luZyByZXNlcnZlZCBrZXl3b3JkcyBpbiBleHByZXNzaW9uOiAnXG4gICAgICArIGV4cFxuICAgIClcbiAgfVxuICAvLyByZXNldCBzdGF0ZVxuICBzYXZlZC5sZW5ndGggPSAwXG4gIC8vIHNhdmUgc3RyaW5ncyBhbmQgb2JqZWN0IGxpdGVyYWwga2V5c1xuICB2YXIgYm9keSA9IGV4cFxuICAgIC5yZXBsYWNlKHNhdmVSRSwgc2F2ZSlcbiAgICAucmVwbGFjZSh3c1JFLCAnJylcbiAgLy8gcmV3cml0ZSBhbGwgcGF0aHNcbiAgLy8gcGFkIDEgc3BhY2UgaGVyZSBiZWNhdWUgdGhlIHJlZ2V4IG1hdGNoZXMgMSBleHRyYSBjaGFyXG4gIGJvZHkgPSAoJyAnICsgYm9keSlcbiAgICAucmVwbGFjZShwYXRoUmVwbGFjZVJFLCByZXdyaXRlKVxuICAgIC5yZXBsYWNlKHJlc3RvcmVSRSwgcmVzdG9yZSlcbiAgdmFyIGdldHRlciA9IG1ha2VHZXR0ZXIoYm9keSlcbiAgaWYgKGdldHRlcikge1xuICAgIHJldHVybiB7XG4gICAgICBnZXQ6IGdldHRlcixcbiAgICAgIGJvZHk6IGJvZHksXG4gICAgICBzZXQ6IG5lZWRTZXRcbiAgICAgICAgPyBtYWtlU2V0dGVyKGJvZHkpXG4gICAgICAgIDogbnVsbFxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIENvbXBpbGUgZ2V0dGVyIHNldHRlcnMgZm9yIGEgc2ltcGxlIHBhdGguXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV4cFxuICogQHJldHVybiB7RnVuY3Rpb259XG4gKi9cblxuZnVuY3Rpb24gY29tcGlsZVBhdGhGbnMgKGV4cCkge1xuICB2YXIgZ2V0dGVyLCBwYXRoXG4gIGlmIChleHAuaW5kZXhPZignWycpIDwgMCkge1xuICAgIC8vIHJlYWxseSBzaW1wbGUgcGF0aFxuICAgIHBhdGggPSBleHAuc3BsaXQoJy4nKVxuICAgIHBhdGgucmF3ID0gZXhwXG4gICAgZ2V0dGVyID0gUGF0aC5jb21waWxlR2V0dGVyKHBhdGgpXG4gIH0gZWxzZSB7XG4gICAgLy8gZG8gdGhlIHJlYWwgcGFyc2luZ1xuICAgIHBhdGggPSBQYXRoLnBhcnNlKGV4cClcbiAgICBnZXR0ZXIgPSBwYXRoLmdldFxuICB9XG4gIHJldHVybiB7XG4gICAgZ2V0OiBnZXR0ZXIsXG4gICAgLy8gYWx3YXlzIGdlbmVyYXRlIHNldHRlciBmb3Igc2ltcGxlIHBhdGhzXG4gICAgc2V0OiBmdW5jdGlvbiAob2JqLCB2YWwpIHtcbiAgICAgIFBhdGguc2V0KG9iaiwgcGF0aCwgdmFsKVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEJ1aWxkIGEgZ2V0dGVyIGZ1bmN0aW9uLiBSZXF1aXJlcyBldmFsLlxuICpcbiAqIFdlIGlzb2xhdGUgdGhlIHRyeS9jYXRjaCBzbyBpdCBkb2Vzbid0IGFmZmVjdCB0aGVcbiAqIG9wdGltaXphdGlvbiBvZiB0aGUgcGFyc2UgZnVuY3Rpb24gd2hlbiBpdCBpcyBub3QgY2FsbGVkLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBib2R5XG4gKiBAcmV0dXJuIHtGdW5jdGlvbnx1bmRlZmluZWR9XG4gKi9cblxuZnVuY3Rpb24gbWFrZUdldHRlciAoYm9keSkge1xuICB0cnkge1xuICAgIHJldHVybiBuZXcgRnVuY3Rpb24oJ3Njb3BlJywgJ3JldHVybiAnICsgYm9keSArICc7JylcbiAgfSBjYXRjaCAoZSkge1xuICAgIF8ud2FybihcbiAgICAgICdJbnZhbGlkIGV4cHJlc3Npb24uICcgK1xuICAgICAgJ0dlbmVyYXRlZCBmdW5jdGlvbiBib2R5OiAnICsgYm9keVxuICAgIClcbiAgfVxufVxuXG4vKipcbiAqIEJ1aWxkIGEgc2V0dGVyIGZ1bmN0aW9uLlxuICpcbiAqIFRoaXMgaXMgb25seSBuZWVkZWQgaW4gcmFyZSBzaXR1YXRpb25zIGxpa2UgXCJhW2JdXCIgd2hlcmVcbiAqIGEgc2V0dGFibGUgcGF0aCByZXF1aXJlcyBkeW5hbWljIGV2YWx1YXRpb24uXG4gKlxuICogVGhpcyBzZXR0ZXIgZnVuY3Rpb24gbWF5IHRocm93IGVycm9yIHdoZW4gY2FsbGVkIGlmIHRoZVxuICogZXhwcmVzc2lvbiBib2R5IGlzIG5vdCBhIHZhbGlkIGxlZnQtaGFuZCBleHByZXNzaW9uIGluXG4gKiBhc3NpZ25tZW50LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBib2R5XG4gKiBAcmV0dXJuIHtGdW5jdGlvbnx1bmRlZmluZWR9XG4gKi9cblxuZnVuY3Rpb24gbWFrZVNldHRlciAoYm9keSkge1xuICB0cnkge1xuICAgIHJldHVybiBuZXcgRnVuY3Rpb24oJ3Njb3BlJywgJ3ZhbHVlJywgYm9keSArICc9dmFsdWU7JylcbiAgfSBjYXRjaCAoZSkge1xuICAgIF8ud2FybignSW52YWxpZCBzZXR0ZXIgZnVuY3Rpb24gYm9keTogJyArIGJvZHkpXG4gIH1cbn1cblxuLyoqXG4gKiBDaGVjayBmb3Igc2V0dGVyIGV4aXN0ZW5jZSBvbiBhIGNhY2hlIGhpdC5cbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBoaXRcbiAqL1xuXG5mdW5jdGlvbiBjaGVja1NldHRlciAoaGl0KSB7XG4gIGlmICghaGl0LnNldCkge1xuICAgIGhpdC5zZXQgPSBtYWtlU2V0dGVyKGhpdC5ib2R5KVxuICB9XG59XG5cbi8qKlxuICogUGFyc2UgYW4gZXhwcmVzc2lvbiBpbnRvIHJlLXdyaXR0ZW4gZ2V0dGVyL3NldHRlcnMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV4cFxuICogQHBhcmFtIHtCb29sZWFufSBuZWVkU2V0XG4gKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAqL1xuXG5leHBvcnRzLnBhcnNlID0gZnVuY3Rpb24gKGV4cCwgbmVlZFNldCkge1xuICBleHAgPSBleHAudHJpbSgpXG4gIC8vIHRyeSBjYWNoZVxuICB2YXIgaGl0ID0gZXhwcmVzc2lvbkNhY2hlLmdldChleHApXG4gIGlmIChoaXQpIHtcbiAgICBpZiAobmVlZFNldCkge1xuICAgICAgY2hlY2tTZXR0ZXIoaGl0KVxuICAgIH1cbiAgICByZXR1cm4gaGl0XG4gIH1cbiAgLy8gd2UgZG8gYSBzaW1wbGUgcGF0aCBjaGVjayB0byBvcHRpbWl6ZSBmb3IgdGhlbS5cbiAgLy8gdGhlIGNoZWNrIGZhaWxzIHZhbGlkIHBhdGhzIHdpdGggdW51c2FsIHdoaXRlc3BhY2VzLFxuICAvLyBidXQgdGhhdCdzIHRvbyByYXJlIGFuZCB3ZSBkb24ndCBjYXJlLlxuICAvLyBhbHNvIHNraXAgYm9vbGVhbiBsaXRlcmFscyBhbmQgcGF0aHMgdGhhdCBzdGFydCB3aXRoXG4gIC8vIGdsb2JhbCBcIk1hdGhcIlxuICB2YXIgcmVzID0gZXhwb3J0cy5pc1NpbXBsZVBhdGgoZXhwKVxuICAgID8gY29tcGlsZVBhdGhGbnMoZXhwKVxuICAgIDogY29tcGlsZUV4cEZucyhleHAsIG5lZWRTZXQpXG4gIGV4cHJlc3Npb25DYWNoZS5wdXQoZXhwLCByZXMpXG4gIHJldHVybiByZXNcbn1cblxuLyoqXG4gKiBDaGVjayBpZiBhbiBleHByZXNzaW9uIGlzIGEgc2ltcGxlIHBhdGguXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV4cFxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqL1xuXG5leHBvcnRzLmlzU2ltcGxlUGF0aCA9IGZ1bmN0aW9uIChleHApIHtcbiAgcmV0dXJuIHBhdGhUZXN0UkUudGVzdChleHApICYmXG4gICAgLy8gZG9uJ3QgdHJlYXQgdHJ1ZS9mYWxzZSBhcyBwYXRoc1xuICAgICFib29sZWFuTGl0ZXJhbFJFLnRlc3QoZXhwKSAmJlxuICAgIC8vIE1hdGggY29uc3RhbnRzIGUuZy4gTWF0aC5QSSwgTWF0aC5FIGV0Yy5cbiAgICBleHAuc2xpY2UoMCwgNSkgIT09ICdNYXRoLidcbn0iLCJ2YXIgXyA9IHJlcXVpcmUoJy4uL3V0aWwnKVxudmFyIENhY2hlID0gcmVxdWlyZSgnLi4vY2FjaGUnKVxudmFyIHBhdGhDYWNoZSA9IG5ldyBDYWNoZSgxMDAwKVxudmFyIGlkZW50UkUgPSBleHBvcnRzLmlkZW50UkUgPSAvXlskX2EtekEtWl0rW1xcdyRdKiQvXG5cbi8qKlxuICogUGF0aC1wYXJzaW5nIGFsZ29yaXRobSBzY29vcGVkIGZyb20gUG9seW1lci9vYnNlcnZlLWpzXG4gKi9cblxudmFyIHBhdGhTdGF0ZU1hY2hpbmUgPSB7XG4gICdiZWZvcmVQYXRoJzoge1xuICAgICd3cyc6IFsnYmVmb3JlUGF0aCddLFxuICAgICdpZGVudCc6IFsnaW5JZGVudCcsICdhcHBlbmQnXSxcbiAgICAnWyc6IFsnYmVmb3JlRWxlbWVudCddLFxuICAgICdlb2YnOiBbJ2FmdGVyUGF0aCddXG4gIH0sXG5cbiAgJ2luUGF0aCc6IHtcbiAgICAnd3MnOiBbJ2luUGF0aCddLFxuICAgICcuJzogWydiZWZvcmVJZGVudCddLFxuICAgICdbJzogWydiZWZvcmVFbGVtZW50J10sXG4gICAgJ2VvZic6IFsnYWZ0ZXJQYXRoJ11cbiAgfSxcblxuICAnYmVmb3JlSWRlbnQnOiB7XG4gICAgJ3dzJzogWydiZWZvcmVJZGVudCddLFxuICAgICdpZGVudCc6IFsnaW5JZGVudCcsICdhcHBlbmQnXVxuICB9LFxuXG4gICdpbklkZW50Jzoge1xuICAgICdpZGVudCc6IFsnaW5JZGVudCcsICdhcHBlbmQnXSxcbiAgICAnMCc6IFsnaW5JZGVudCcsICdhcHBlbmQnXSxcbiAgICAnbnVtYmVyJzogWydpbklkZW50JywgJ2FwcGVuZCddLFxuICAgICd3cyc6IFsnaW5QYXRoJywgJ3B1c2gnXSxcbiAgICAnLic6IFsnYmVmb3JlSWRlbnQnLCAncHVzaCddLFxuICAgICdbJzogWydiZWZvcmVFbGVtZW50JywgJ3B1c2gnXSxcbiAgICAnZW9mJzogWydhZnRlclBhdGgnLCAncHVzaCddLFxuICAgICddJzogWydpblBhdGgnLCAncHVzaCddXG4gIH0sXG5cbiAgJ2JlZm9yZUVsZW1lbnQnOiB7XG4gICAgJ3dzJzogWydiZWZvcmVFbGVtZW50J10sXG4gICAgJzAnOiBbJ2FmdGVyWmVybycsICdhcHBlbmQnXSxcbiAgICAnbnVtYmVyJzogWydpbkluZGV4JywgJ2FwcGVuZCddLFxuICAgIFwiJ1wiOiBbJ2luU2luZ2xlUXVvdGUnLCAnYXBwZW5kJywgJyddLFxuICAgICdcIic6IFsnaW5Eb3VibGVRdW90ZScsICdhcHBlbmQnLCAnJ10sXG4gICAgXCJpZGVudFwiOiBbJ2luSWRlbnQnLCAnYXBwZW5kJywgJyonXVxuICB9LFxuXG4gICdhZnRlclplcm8nOiB7XG4gICAgJ3dzJzogWydhZnRlckVsZW1lbnQnLCAncHVzaCddLFxuICAgICddJzogWydpblBhdGgnLCAncHVzaCddXG4gIH0sXG5cbiAgJ2luSW5kZXgnOiB7XG4gICAgJzAnOiBbJ2luSW5kZXgnLCAnYXBwZW5kJ10sXG4gICAgJ251bWJlcic6IFsnaW5JbmRleCcsICdhcHBlbmQnXSxcbiAgICAnd3MnOiBbJ2FmdGVyRWxlbWVudCddLFxuICAgICddJzogWydpblBhdGgnLCAncHVzaCddXG4gIH0sXG5cbiAgJ2luU2luZ2xlUXVvdGUnOiB7XG4gICAgXCInXCI6IFsnYWZ0ZXJFbGVtZW50J10sXG4gICAgJ2VvZic6ICdlcnJvcicsXG4gICAgJ2Vsc2UnOiBbJ2luU2luZ2xlUXVvdGUnLCAnYXBwZW5kJ11cbiAgfSxcblxuICAnaW5Eb3VibGVRdW90ZSc6IHtcbiAgICAnXCInOiBbJ2FmdGVyRWxlbWVudCddLFxuICAgICdlb2YnOiAnZXJyb3InLFxuICAgICdlbHNlJzogWydpbkRvdWJsZVF1b3RlJywgJ2FwcGVuZCddXG4gIH0sXG5cbiAgJ2FmdGVyRWxlbWVudCc6IHtcbiAgICAnd3MnOiBbJ2FmdGVyRWxlbWVudCddLFxuICAgICddJzogWydpblBhdGgnLCAncHVzaCddXG4gIH1cbn1cblxuZnVuY3Rpb24gbm9vcCAoKSB7fVxuXG4vKipcbiAqIERldGVybWluZSB0aGUgdHlwZSBvZiBhIGNoYXJhY3RlciBpbiBhIGtleXBhdGguXG4gKlxuICogQHBhcmFtIHtDaGFyfSBjaGFyXG4gKiBAcmV0dXJuIHtTdHJpbmd9IHR5cGVcbiAqL1xuXG5mdW5jdGlvbiBnZXRQYXRoQ2hhclR5cGUgKGNoYXIpIHtcbiAgaWYgKGNoYXIgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiAnZW9mJ1xuICB9XG5cbiAgdmFyIGNvZGUgPSBjaGFyLmNoYXJDb2RlQXQoMClcblxuICBzd2l0Y2goY29kZSkge1xuICAgIGNhc2UgMHg1QjogLy8gW1xuICAgIGNhc2UgMHg1RDogLy8gXVxuICAgIGNhc2UgMHgyRTogLy8gLlxuICAgIGNhc2UgMHgyMjogLy8gXCJcbiAgICBjYXNlIDB4Mjc6IC8vICdcbiAgICBjYXNlIDB4MzA6IC8vIDBcbiAgICAgIHJldHVybiBjaGFyXG5cbiAgICBjYXNlIDB4NUY6IC8vIF9cbiAgICBjYXNlIDB4MjQ6IC8vICRcbiAgICAgIHJldHVybiAnaWRlbnQnXG5cbiAgICBjYXNlIDB4MjA6IC8vIFNwYWNlXG4gICAgY2FzZSAweDA5OiAvLyBUYWJcbiAgICBjYXNlIDB4MEE6IC8vIE5ld2xpbmVcbiAgICBjYXNlIDB4MEQ6IC8vIFJldHVyblxuICAgIGNhc2UgMHhBMDogIC8vIE5vLWJyZWFrIHNwYWNlXG4gICAgY2FzZSAweEZFRkY6ICAvLyBCeXRlIE9yZGVyIE1hcmtcbiAgICBjYXNlIDB4MjAyODogIC8vIExpbmUgU2VwYXJhdG9yXG4gICAgY2FzZSAweDIwMjk6ICAvLyBQYXJhZ3JhcGggU2VwYXJhdG9yXG4gICAgICByZXR1cm4gJ3dzJ1xuICB9XG5cbiAgLy8gYS16LCBBLVpcbiAgaWYgKCgweDYxIDw9IGNvZGUgJiYgY29kZSA8PSAweDdBKSB8fFxuICAgICAgKDB4NDEgPD0gY29kZSAmJiBjb2RlIDw9IDB4NUEpKSB7XG4gICAgcmV0dXJuICdpZGVudCdcbiAgfVxuXG4gIC8vIDEtOVxuICBpZiAoMHgzMSA8PSBjb2RlICYmIGNvZGUgPD0gMHgzOSkge1xuICAgIHJldHVybiAnbnVtYmVyJ1xuICB9XG5cbiAgcmV0dXJuICdlbHNlJ1xufVxuXG4vKipcbiAqIFBhcnNlIGEgc3RyaW5nIHBhdGggaW50byBhbiBhcnJheSBvZiBzZWdtZW50c1xuICogVG9kbyBpbXBsZW1lbnQgY2FjaGVcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gcGF0aFxuICogQHJldHVybiB7QXJyYXl8dW5kZWZpbmVkfVxuICovXG5cbmZ1bmN0aW9uIHBhcnNlUGF0aCAocGF0aCkge1xuICB2YXIga2V5cyA9IFtdXG4gIHZhciBpbmRleCA9IC0xXG4gIHZhciBtb2RlID0gJ2JlZm9yZVBhdGgnXG4gIHZhciBjLCBuZXdDaGFyLCBrZXksIHR5cGUsIHRyYW5zaXRpb24sIGFjdGlvbiwgdHlwZU1hcFxuXG4gIHZhciBhY3Rpb25zID0ge1xuICAgIHB1c2g6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKGtleSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVyblxuICAgICAgfVxuICAgICAga2V5cy5wdXNoKGtleSlcbiAgICAgIGtleSA9IHVuZGVmaW5lZFxuICAgIH0sXG4gICAgYXBwZW5kOiBmdW5jdGlvbigpIHtcbiAgICAgIGlmIChrZXkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBrZXkgPSBuZXdDaGFyXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBrZXkgKz0gbmV3Q2hhclxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIG1heWJlVW5lc2NhcGVRdW90ZSAoKSB7XG4gICAgdmFyIG5leHRDaGFyID0gcGF0aFtpbmRleCArIDFdXG4gICAgaWYgKChtb2RlID09PSAnaW5TaW5nbGVRdW90ZScgJiYgbmV4dENoYXIgPT09IFwiJ1wiKSB8fFxuICAgICAgICAobW9kZSA9PT0gJ2luRG91YmxlUXVvdGUnICYmIG5leHRDaGFyID09PSAnXCInKSkge1xuICAgICAgaW5kZXgrK1xuICAgICAgbmV3Q2hhciA9IG5leHRDaGFyXG4gICAgICBhY3Rpb25zLmFwcGVuZCgpXG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgfVxuXG4gIHdoaWxlIChtb2RlKSB7XG4gICAgaW5kZXgrK1xuICAgIGMgPSBwYXRoW2luZGV4XVxuXG4gICAgaWYgKGMgPT09ICdcXFxcJyAmJiBtYXliZVVuZXNjYXBlUXVvdGUoKSkge1xuICAgICAgY29udGludWVcbiAgICB9XG5cbiAgICB0eXBlID0gZ2V0UGF0aENoYXJUeXBlKGMpXG4gICAgdHlwZU1hcCA9IHBhdGhTdGF0ZU1hY2hpbmVbbW9kZV1cbiAgICB0cmFuc2l0aW9uID0gdHlwZU1hcFt0eXBlXSB8fCB0eXBlTWFwWydlbHNlJ10gfHwgJ2Vycm9yJ1xuXG4gICAgaWYgKHRyYW5zaXRpb24gPT09ICdlcnJvcicpIHtcbiAgICAgIHJldHVybiAvLyBwYXJzZSBlcnJvclxuICAgIH1cblxuICAgIG1vZGUgPSB0cmFuc2l0aW9uWzBdXG4gICAgYWN0aW9uID0gYWN0aW9uc1t0cmFuc2l0aW9uWzFdXSB8fCBub29wXG4gICAgbmV3Q2hhciA9IHRyYW5zaXRpb25bMl1cbiAgICBuZXdDaGFyID0gbmV3Q2hhciA9PT0gdW5kZWZpbmVkXG4gICAgICA/IGNcbiAgICAgIDogbmV3Q2hhciA9PT0gJyonXG4gICAgICAgID8gbmV3Q2hhciArIGNcbiAgICAgICAgOiBuZXdDaGFyXG4gICAgYWN0aW9uKClcblxuICAgIGlmIChtb2RlID09PSAnYWZ0ZXJQYXRoJykge1xuICAgICAga2V5cy5yYXcgPSBwYXRoXG4gICAgICByZXR1cm4ga2V5c1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEZvcm1hdCBhIGFjY2Vzc29yIHNlZ21lbnQgYmFzZWQgb24gaXRzIHR5cGUuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGtleVxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqL1xuXG5mdW5jdGlvbiBmb3JtYXRBY2Nlc3NvciAoa2V5KSB7XG4gIGlmIChpZGVudFJFLnRlc3Qoa2V5KSkgeyAvLyBpZGVudGlmaWVyXG4gICAgcmV0dXJuICcuJyArIGtleVxuICB9IGVsc2UgaWYgKCtrZXkgPT09IGtleSA+Pj4gMCkgeyAvLyBicmFja2V0IGluZGV4XG4gICAgcmV0dXJuICdbJyArIGtleSArICddJ1xuICB9IGVsc2UgaWYgKGtleS5jaGFyQXQoMCkgPT09ICcqJykge1xuICAgIHJldHVybiAnW28nICsgZm9ybWF0QWNjZXNzb3Ioa2V5LnNsaWNlKDEpKSArICddJ1xuICB9IGVsc2UgeyAvLyBicmFja2V0IHN0cmluZ1xuICAgIHJldHVybiAnW1wiJyArIGtleS5yZXBsYWNlKC9cIi9nLCAnXFxcXFwiJykgKyAnXCJdJ1xuICB9XG59XG5cbi8qKlxuICogQ29tcGlsZXMgYSBnZXR0ZXIgZnVuY3Rpb24gd2l0aCBhIGZpeGVkIHBhdGguXG4gKiBUaGUgZml4ZWQgcGF0aCBnZXR0ZXIgc3VwcmVzc2VzIGVycm9ycy5cbiAqXG4gKiBAcGFyYW0ge0FycmF5fSBwYXRoXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAqL1xuXG5leHBvcnRzLmNvbXBpbGVHZXR0ZXIgPSBmdW5jdGlvbiAocGF0aCkge1xuICB2YXIgYm9keSA9ICdyZXR1cm4gbycgKyBwYXRoLm1hcChmb3JtYXRBY2Nlc3Nvcikuam9pbignJylcbiAgcmV0dXJuIG5ldyBGdW5jdGlvbignbycsICd0cnkgeycgKyBib2R5ICsgJ30gY2F0Y2ggKGUpIHt9Jylcbn1cblxuLyoqXG4gKiBFeHRlcm5hbCBwYXJzZSB0aGF0IGNoZWNrIGZvciBhIGNhY2hlIGhpdCBmaXJzdFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoXG4gKiBAcmV0dXJuIHtBcnJheXx1bmRlZmluZWR9XG4gKi9cblxuZXhwb3J0cy5wYXJzZSA9IGZ1bmN0aW9uIChwYXRoKSB7XG4gIHZhciBoaXQgPSBwYXRoQ2FjaGUuZ2V0KHBhdGgpXG4gIGlmICghaGl0KSB7XG4gICAgaGl0ID0gcGFyc2VQYXRoKHBhdGgpXG4gICAgaWYgKGhpdCkge1xuICAgICAgaGl0LmdldCA9IGV4cG9ydHMuY29tcGlsZUdldHRlcihoaXQpXG4gICAgICBwYXRoQ2FjaGUucHV0KHBhdGgsIGhpdClcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGhpdFxufVxuXG4vKipcbiAqIEdldCBmcm9tIGFuIG9iamVjdCBmcm9tIGEgcGF0aCBzdHJpbmdcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKiBAcGFyYW0ge1N0cmluZ30gcGF0aFxuICovXG5cbmV4cG9ydHMuZ2V0ID0gZnVuY3Rpb24gKG9iaiwgcGF0aCkge1xuICBwYXRoID0gZXhwb3J0cy5wYXJzZShwYXRoKVxuICBpZiAocGF0aCkge1xuICAgIHJldHVybiBwYXRoLmdldChvYmopXG4gIH1cbn1cblxuLyoqXG4gKiBTZXQgb24gYW4gb2JqZWN0IGZyb20gYSBwYXRoXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9ialxuICogQHBhcmFtIHtTdHJpbmcgfCBBcnJheX0gcGF0aFxuICogQHBhcmFtIHsqfSB2YWxcbiAqL1xuXG5leHBvcnRzLnNldCA9IGZ1bmN0aW9uIChvYmosIHBhdGgsIHZhbCkge1xuICB2YXIgb3JpZ2luYWwgPSBvYmpcbiAgaWYgKHR5cGVvZiBwYXRoID09PSAnc3RyaW5nJykge1xuICAgIHBhdGggPSBleHBvcnRzLnBhcnNlKHBhdGgpXG4gIH1cbiAgaWYgKCFwYXRoIHx8ICFfLmlzT2JqZWN0KG9iaikpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuICB2YXIgbGFzdCwga2V5XG4gIGZvciAodmFyIGkgPSAwLCBsID0gcGF0aC5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBsYXN0ID0gb2JqXG4gICAga2V5ID0gcGF0aFtpXVxuICAgIGlmIChrZXkuY2hhckF0KDApID09PSAnKicpIHtcbiAgICAgIGtleSA9IG9yaWdpbmFsW2tleS5zbGljZSgxKV1cbiAgICB9XG4gICAgaWYgKGkgPCBsIC0gMSkge1xuICAgICAgb2JqID0gb2JqW2tleV1cbiAgICAgIGlmICghXy5pc09iamVjdChvYmopKSB7XG4gICAgICAgIG9iaiA9IHt9XG4gICAgICAgIGxhc3QuJGFkZChrZXksIG9iailcbiAgICAgICAgd2Fybk5vbkV4aXN0ZW50KHBhdGgpXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChfLmlzQXJyYXkob2JqKSkge1xuICAgICAgICBvYmouJHNldChrZXksIHZhbClcbiAgICAgIH0gZWxzZSBpZiAoa2V5IGluIG9iaikge1xuICAgICAgICBvYmpba2V5XSA9IHZhbFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb2JqLiRhZGQoa2V5LCB2YWwpXG4gICAgICAgIHdhcm5Ob25FeGlzdGVudChwYXRoKVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZVxufVxuXG5mdW5jdGlvbiB3YXJuTm9uRXhpc3RlbnQgKHBhdGgpIHtcbiAgXy53YXJuKFxuICAgICdZb3UgYXJlIHNldHRpbmcgYSBub24tZXhpc3RlbnQgcGF0aCBcIicgKyBwYXRoLnJhdyArICdcIiAnICtcbiAgICAnb24gYSB2bSBpbnN0YW5jZS4gQ29uc2lkZXIgcHJlLWluaXRpYWxpemluZyB0aGUgcHJvcGVydHkgJyArXG4gICAgJ3dpdGggdGhlIFwiZGF0YVwiIG9wdGlvbiBmb3IgbW9yZSByZWxpYWJsZSByZWFjdGl2aXR5ICcgK1xuICAgICdhbmQgYmV0dGVyIHBlcmZvcm1hbmNlLidcbiAgKVxufSIsInZhciBfID0gcmVxdWlyZSgnLi4vdXRpbCcpXG52YXIgQ2FjaGUgPSByZXF1aXJlKCcuLi9jYWNoZScpXG52YXIgdGVtcGxhdGVDYWNoZSA9IG5ldyBDYWNoZSgxMDAwKVxudmFyIGlkU2VsZWN0b3JDYWNoZSA9IG5ldyBDYWNoZSgxMDAwKVxuXG52YXIgbWFwID0ge1xuICBfZGVmYXVsdCA6IFswLCAnJywgJyddLFxuICBsZWdlbmQgICA6IFsxLCAnPGZpZWxkc2V0PicsICc8L2ZpZWxkc2V0PiddLFxuICB0ciAgICAgICA6IFsyLCAnPHRhYmxlPjx0Ym9keT4nLCAnPC90Ym9keT48L3RhYmxlPiddLFxuICBjb2wgICAgICA6IFtcbiAgICAyLFxuICAgICc8dGFibGU+PHRib2R5PjwvdGJvZHk+PGNvbGdyb3VwPicsXG4gICAgJzwvY29sZ3JvdXA+PC90YWJsZT4nXG4gIF1cbn1cblxubWFwLnRkID1cbm1hcC50aCA9IFtcbiAgMyxcbiAgJzx0YWJsZT48dGJvZHk+PHRyPicsXG4gICc8L3RyPjwvdGJvZHk+PC90YWJsZT4nXG5dXG5cbm1hcC5vcHRpb24gPVxubWFwLm9wdGdyb3VwID0gW1xuICAxLFxuICAnPHNlbGVjdCBtdWx0aXBsZT1cIm11bHRpcGxlXCI+JyxcbiAgJzwvc2VsZWN0Pidcbl1cblxubWFwLnRoZWFkID1cbm1hcC50Ym9keSA9XG5tYXAuY29sZ3JvdXAgPVxubWFwLmNhcHRpb24gPVxubWFwLnRmb290ID0gWzEsICc8dGFibGU+JywgJzwvdGFibGU+J11cblxubWFwLmcgPVxubWFwLmRlZnMgPVxubWFwLnN5bWJvbCA9XG5tYXAudXNlID1cbm1hcC5pbWFnZSA9XG5tYXAudGV4dCA9XG5tYXAuY2lyY2xlID1cbm1hcC5lbGxpcHNlID1cbm1hcC5saW5lID1cbm1hcC5wYXRoID1cbm1hcC5wb2x5Z29uID1cbm1hcC5wb2x5bGluZSA9XG5tYXAucmVjdCA9IFtcbiAgMSxcbiAgJzxzdmcgJyArXG4gICAgJ3htbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiAnICtcbiAgICAneG1sbnM6eGxpbms9XCJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rXCIgJyArXG4gICAgJ3htbG5zOmV2PVwiaHR0cDovL3d3dy53My5vcmcvMjAwMS94bWwtZXZlbnRzXCInICtcbiAgICAndmVyc2lvbj1cIjEuMVwiPicsXG4gICc8L3N2Zz4nXG5dXG5cbnZhciB0YWdSRSA9IC88KFtcXHc6XSspL1xudmFyIGVudGl0eVJFID0gLyZcXHcrOy9cblxuLyoqXG4gKiBDb252ZXJ0IGEgc3RyaW5nIHRlbXBsYXRlIHRvIGEgRG9jdW1lbnRGcmFnbWVudC5cbiAqIERldGVybWluZXMgY29ycmVjdCB3cmFwcGluZyBieSB0YWcgdHlwZXMuIFdyYXBwaW5nXG4gKiBzdHJhdGVneSBmb3VuZCBpbiBqUXVlcnkgJiBjb21wb25lbnQvZG9taWZ5LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSB0ZW1wbGF0ZVN0cmluZ1xuICogQHJldHVybiB7RG9jdW1lbnRGcmFnbWVudH1cbiAqL1xuXG5mdW5jdGlvbiBzdHJpbmdUb0ZyYWdtZW50ICh0ZW1wbGF0ZVN0cmluZykge1xuICAvLyB0cnkgYSBjYWNoZSBoaXQgZmlyc3RcbiAgdmFyIGhpdCA9IHRlbXBsYXRlQ2FjaGUuZ2V0KHRlbXBsYXRlU3RyaW5nKVxuICBpZiAoaGl0KSB7XG4gICAgcmV0dXJuIGhpdFxuICB9XG5cbiAgdmFyIGZyYWcgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KClcbiAgdmFyIHRhZ01hdGNoID0gdGVtcGxhdGVTdHJpbmcubWF0Y2godGFnUkUpXG4gIHZhciBlbnRpdHlNYXRjaCA9IGVudGl0eVJFLnRlc3QodGVtcGxhdGVTdHJpbmcpXG5cbiAgaWYgKCF0YWdNYXRjaCAmJiAhZW50aXR5TWF0Y2gpIHtcbiAgICAvLyB0ZXh0IG9ubHksIHJldHVybiBhIHNpbmdsZSB0ZXh0IG5vZGUuXG4gICAgZnJhZy5hcHBlbmRDaGlsZChcbiAgICAgIGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRlbXBsYXRlU3RyaW5nKVxuICAgIClcbiAgfSBlbHNlIHtcblxuICAgIHZhciB0YWcgICAgPSB0YWdNYXRjaCAmJiB0YWdNYXRjaFsxXVxuICAgIHZhciB3cmFwICAgPSBtYXBbdGFnXSB8fCBtYXAuX2RlZmF1bHRcbiAgICB2YXIgZGVwdGggID0gd3JhcFswXVxuICAgIHZhciBwcmVmaXggPSB3cmFwWzFdXG4gICAgdmFyIHN1ZmZpeCA9IHdyYXBbMl1cbiAgICB2YXIgbm9kZSAgID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcblxuICAgIG5vZGUuaW5uZXJIVE1MID0gcHJlZml4ICsgdGVtcGxhdGVTdHJpbmcudHJpbSgpICsgc3VmZml4XG4gICAgd2hpbGUgKGRlcHRoLS0pIHtcbiAgICAgIG5vZGUgPSBub2RlLmxhc3RDaGlsZFxuICAgIH1cblxuICAgIHZhciBjaGlsZFxuICAgIC8qIGpzaGludCBib3NzOnRydWUgKi9cbiAgICB3aGlsZSAoY2hpbGQgPSBub2RlLmZpcnN0Q2hpbGQpIHtcbiAgICAgIGZyYWcuYXBwZW5kQ2hpbGQoY2hpbGQpXG4gICAgfVxuICB9XG5cbiAgdGVtcGxhdGVDYWNoZS5wdXQodGVtcGxhdGVTdHJpbmcsIGZyYWcpXG4gIHJldHVybiBmcmFnXG59XG5cbi8qKlxuICogQ29udmVydCBhIHRlbXBsYXRlIG5vZGUgdG8gYSBEb2N1bWVudEZyYWdtZW50LlxuICpcbiAqIEBwYXJhbSB7Tm9kZX0gbm9kZVxuICogQHJldHVybiB7RG9jdW1lbnRGcmFnbWVudH1cbiAqL1xuXG5mdW5jdGlvbiBub2RlVG9GcmFnbWVudCAobm9kZSkge1xuICB2YXIgdGFnID0gbm9kZS50YWdOYW1lXG4gIC8vIGlmIGl0cyBhIHRlbXBsYXRlIHRhZyBhbmQgdGhlIGJyb3dzZXIgc3VwcG9ydHMgaXQsXG4gIC8vIGl0cyBjb250ZW50IGlzIGFscmVhZHkgYSBkb2N1bWVudCBmcmFnbWVudC5cbiAgaWYgKFxuICAgIHRhZyA9PT0gJ1RFTVBMQVRFJyAmJlxuICAgIG5vZGUuY29udGVudCBpbnN0YW5jZW9mIERvY3VtZW50RnJhZ21lbnRcbiAgKSB7XG4gICAgcmV0dXJuIG5vZGUuY29udGVudFxuICB9XG4gIC8vIHNjcmlwdCB0ZW1wbGF0ZVxuICBpZiAodGFnID09PSAnU0NSSVBUJykge1xuICAgIHJldHVybiBzdHJpbmdUb0ZyYWdtZW50KG5vZGUudGV4dENvbnRlbnQpXG4gIH1cbiAgLy8gbm9ybWFsIG5vZGUsIGNsb25lIGl0IHRvIGF2b2lkIG11dGF0aW5nIHRoZSBvcmlnaW5hbFxuICB2YXIgY2xvbmUgPSBleHBvcnRzLmNsb25lKG5vZGUpXG4gIHZhciBmcmFnID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpXG4gIHZhciBjaGlsZFxuICAvKiBqc2hpbnQgYm9zczp0cnVlICovXG4gIHdoaWxlIChjaGlsZCA9IGNsb25lLmZpcnN0Q2hpbGQpIHtcbiAgICBmcmFnLmFwcGVuZENoaWxkKGNoaWxkKVxuICB9XG4gIHJldHVybiBmcmFnXG59XG5cbi8vIFRlc3QgZm9yIHRoZSBwcmVzZW5jZSBvZiB0aGUgU2FmYXJpIHRlbXBsYXRlIGNsb25pbmcgYnVnXG4vLyBodHRwczovL2J1Z3Mud2Via2l0Lm9yZy9zaG93X2J1Zy5jZ2k/aWQ9MTM3NzU1XG52YXIgaGFzQnJva2VuVGVtcGxhdGUgPSBfLmluQnJvd3NlclxuICA/IChmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgICBhLmlubmVySFRNTCA9ICc8dGVtcGxhdGU+MTwvdGVtcGxhdGU+J1xuICAgICAgcmV0dXJuICFhLmNsb25lTm9kZSh0cnVlKS5maXJzdENoaWxkLmlubmVySFRNTFxuICAgIH0pKClcbiAgOiBmYWxzZVxuXG4vLyBUZXN0IGZvciBJRTEwLzExIHRleHRhcmVhIHBsYWNlaG9sZGVyIGNsb25lIGJ1Z1xudmFyIGhhc1RleHRhcmVhQ2xvbmVCdWcgPSBfLmluQnJvd3NlclxuICA/IChmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RleHRhcmVhJylcbiAgICAgIHQucGxhY2Vob2xkZXIgPSAndCdcbiAgICAgIHJldHVybiB0LmNsb25lTm9kZSh0cnVlKS52YWx1ZSA9PT0gJ3QnXG4gICAgfSkoKVxuICA6IGZhbHNlXG5cbi8qKlxuICogMS4gRGVhbCB3aXRoIFNhZmFyaSBjbG9uaW5nIG5lc3RlZCA8dGVtcGxhdGU+IGJ1ZyBieVxuICogICAgbWFudWFsbHkgY2xvbmluZyBhbGwgdGVtcGxhdGUgaW5zdGFuY2VzLlxuICogMi4gRGVhbCB3aXRoIElFMTAvMTEgdGV4dGFyZWEgcGxhY2Vob2xkZXIgYnVnIGJ5IHNldHRpbmdcbiAqICAgIHRoZSBjb3JyZWN0IHZhbHVlIGFmdGVyIGNsb25pbmcuXG4gKlxuICogQHBhcmFtIHtFbGVtZW50fERvY3VtZW50RnJhZ21lbnR9IG5vZGVcbiAqIEByZXR1cm4ge0VsZW1lbnR8RG9jdW1lbnRGcmFnbWVudH1cbiAqL1xuXG5leHBvcnRzLmNsb25lID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgdmFyIHJlcyA9IG5vZGUuY2xvbmVOb2RlKHRydWUpXG4gIHZhciBpLCBvcmlnaW5hbCwgY2xvbmVkXG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xuICBpZiAoaGFzQnJva2VuVGVtcGxhdGUpIHtcbiAgICBvcmlnaW5hbCA9IG5vZGUucXVlcnlTZWxlY3RvckFsbCgndGVtcGxhdGUnKVxuICAgIGlmIChvcmlnaW5hbC5sZW5ndGgpIHtcbiAgICAgIGNsb25lZCA9IHJlcy5xdWVyeVNlbGVjdG9yQWxsKCd0ZW1wbGF0ZScpXG4gICAgICBpID0gY2xvbmVkLmxlbmd0aFxuICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICBjbG9uZWRbaV0ucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQoXG4gICAgICAgICAgb3JpZ2luYWxbaV0uY2xvbmVOb2RlKHRydWUpLFxuICAgICAgICAgIGNsb25lZFtpXVxuICAgICAgICApXG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xuICBpZiAoaGFzVGV4dGFyZWFDbG9uZUJ1Zykge1xuICAgIGlmIChub2RlLnRhZ05hbWUgPT09ICdURVhUQVJFQScpIHtcbiAgICAgIHJlcy52YWx1ZSA9IG5vZGUudmFsdWVcbiAgICB9IGVsc2Uge1xuICAgICAgb3JpZ2luYWwgPSBub2RlLnF1ZXJ5U2VsZWN0b3JBbGwoJ3RleHRhcmVhJylcbiAgICAgIGlmIChvcmlnaW5hbC5sZW5ndGgpIHtcbiAgICAgICAgY2xvbmVkID0gcmVzLnF1ZXJ5U2VsZWN0b3JBbGwoJ3RleHRhcmVhJylcbiAgICAgICAgaSA9IGNsb25lZC5sZW5ndGhcbiAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgIGNsb25lZFtpXS52YWx1ZSA9IG9yaWdpbmFsW2ldLnZhbHVlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuXG4vKipcbiAqIFByb2Nlc3MgdGhlIHRlbXBsYXRlIG9wdGlvbiBhbmQgbm9ybWFsaXplcyBpdCBpbnRvIGFcbiAqIGEgRG9jdW1lbnRGcmFnbWVudCB0aGF0IGNhbiBiZSB1c2VkIGFzIGEgcGFydGlhbCBvciBhXG4gKiBpbnN0YW5jZSB0ZW1wbGF0ZS5cbiAqXG4gKiBAcGFyYW0geyp9IHRlbXBsYXRlXG4gKiAgICBQb3NzaWJsZSB2YWx1ZXMgaW5jbHVkZTpcbiAqICAgIC0gRG9jdW1lbnRGcmFnbWVudCBvYmplY3RcbiAqICAgIC0gTm9kZSBvYmplY3Qgb2YgdHlwZSBUZW1wbGF0ZVxuICogICAgLSBpZCBzZWxlY3RvcjogJyNzb21lLXRlbXBsYXRlLWlkJ1xuICogICAgLSB0ZW1wbGF0ZSBzdHJpbmc6ICc8ZGl2PjxzcGFuPnt7bXNnfX08L3NwYW4+PC9kaXY+J1xuICogQHBhcmFtIHtCb29sZWFufSBjbG9uZVxuICogQHBhcmFtIHtCb29sZWFufSBub1NlbGVjdG9yXG4gKiBAcmV0dXJuIHtEb2N1bWVudEZyYWdtZW50fHVuZGVmaW5lZH1cbiAqL1xuXG5leHBvcnRzLnBhcnNlID0gZnVuY3Rpb24gKHRlbXBsYXRlLCBjbG9uZSwgbm9TZWxlY3Rvcikge1xuICB2YXIgbm9kZSwgZnJhZ1xuXG4gIC8vIGlmIHRoZSB0ZW1wbGF0ZSBpcyBhbHJlYWR5IGEgZG9jdW1lbnQgZnJhZ21lbnQsXG4gIC8vIGRvIG5vdGhpbmdcbiAgaWYgKHRlbXBsYXRlIGluc3RhbmNlb2YgRG9jdW1lbnRGcmFnbWVudCkge1xuICAgIHJldHVybiBjbG9uZVxuICAgICAgPyB0ZW1wbGF0ZS5jbG9uZU5vZGUodHJ1ZSlcbiAgICAgIDogdGVtcGxhdGVcbiAgfVxuXG4gIGlmICh0eXBlb2YgdGVtcGxhdGUgPT09ICdzdHJpbmcnKSB7XG4gICAgLy8gaWQgc2VsZWN0b3JcbiAgICBpZiAoIW5vU2VsZWN0b3IgJiYgdGVtcGxhdGUuY2hhckF0KDApID09PSAnIycpIHtcbiAgICAgIC8vIGlkIHNlbGVjdG9yIGNhbiBiZSBjYWNoZWQgdG9vXG4gICAgICBmcmFnID0gaWRTZWxlY3RvckNhY2hlLmdldCh0ZW1wbGF0ZSlcbiAgICAgIGlmICghZnJhZykge1xuICAgICAgICBub2RlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodGVtcGxhdGUuc2xpY2UoMSkpXG4gICAgICAgIGlmIChub2RlKSB7XG4gICAgICAgICAgZnJhZyA9IG5vZGVUb0ZyYWdtZW50KG5vZGUpXG4gICAgICAgICAgLy8gc2F2ZSBzZWxlY3RvciB0byBjYWNoZVxuICAgICAgICAgIGlkU2VsZWN0b3JDYWNoZS5wdXQodGVtcGxhdGUsIGZyYWcpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gbm9ybWFsIHN0cmluZyB0ZW1wbGF0ZVxuICAgICAgZnJhZyA9IHN0cmluZ1RvRnJhZ21lbnQodGVtcGxhdGUpXG4gICAgfVxuICB9IGVsc2UgaWYgKHRlbXBsYXRlLm5vZGVUeXBlKSB7XG4gICAgLy8gYSBkaXJlY3Qgbm9kZVxuICAgIGZyYWcgPSBub2RlVG9GcmFnbWVudCh0ZW1wbGF0ZSlcbiAgfVxuXG4gIHJldHVybiBmcmFnICYmIGNsb25lXG4gICAgPyBleHBvcnRzLmNsb25lKGZyYWcpXG4gICAgOiBmcmFnXG59IiwidmFyIENhY2hlID0gcmVxdWlyZSgnLi4vY2FjaGUnKVxudmFyIGNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZycpXG52YXIgZGlyUGFyc2VyID0gcmVxdWlyZSgnLi9kaXJlY3RpdmUnKVxudmFyIHJlZ2V4RXNjYXBlUkUgPSAvWy0uKis/XiR7fSgpfFtcXF1cXC9cXFxcXS9nXG52YXIgY2FjaGUsIHRhZ1JFLCBodG1sUkUsIGZpcnN0Q2hhciwgbGFzdENoYXJcblxuLyoqXG4gKiBFc2NhcGUgYSBzdHJpbmcgc28gaXQgY2FuIGJlIHVzZWQgaW4gYSBSZWdFeHBcbiAqIGNvbnN0cnVjdG9yLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqL1xuXG5mdW5jdGlvbiBlc2NhcGVSZWdleCAoc3RyKSB7XG4gIHJldHVybiBzdHIucmVwbGFjZShyZWdleEVzY2FwZVJFLCAnXFxcXCQmJylcbn1cblxuLyoqXG4gKiBDb21waWxlIHRoZSBpbnRlcnBvbGF0aW9uIHRhZyByZWdleC5cbiAqXG4gKiBAcmV0dXJuIHtSZWdFeHB9XG4gKi9cblxuZnVuY3Rpb24gY29tcGlsZVJlZ2V4ICgpIHtcbiAgY29uZmlnLl9kZWxpbWl0ZXJzQ2hhbmdlZCA9IGZhbHNlXG4gIHZhciBvcGVuID0gY29uZmlnLmRlbGltaXRlcnNbMF1cbiAgdmFyIGNsb3NlID0gY29uZmlnLmRlbGltaXRlcnNbMV1cbiAgZmlyc3RDaGFyID0gb3Blbi5jaGFyQXQoMClcbiAgbGFzdENoYXIgPSBjbG9zZS5jaGFyQXQoY2xvc2UubGVuZ3RoIC0gMSlcbiAgdmFyIGZpcnN0Q2hhclJFID0gZXNjYXBlUmVnZXgoZmlyc3RDaGFyKVxuICB2YXIgbGFzdENoYXJSRSA9IGVzY2FwZVJlZ2V4KGxhc3RDaGFyKVxuICB2YXIgb3BlblJFID0gZXNjYXBlUmVnZXgob3BlbilcbiAgdmFyIGNsb3NlUkUgPSBlc2NhcGVSZWdleChjbG9zZSlcbiAgdGFnUkUgPSBuZXcgUmVnRXhwKFxuICAgIGZpcnN0Q2hhclJFICsgJz8nICsgb3BlblJFICtcbiAgICAnKC4rPyknICtcbiAgICBjbG9zZVJFICsgbGFzdENoYXJSRSArICc/JyxcbiAgICAnZydcbiAgKVxuICBodG1sUkUgPSBuZXcgUmVnRXhwKFxuICAgICdeJyArIGZpcnN0Q2hhclJFICsgb3BlblJFICtcbiAgICAnLionICtcbiAgICBjbG9zZVJFICsgbGFzdENoYXJSRSArICckJ1xuICApXG4gIC8vIHJlc2V0IGNhY2hlXG4gIGNhY2hlID0gbmV3IENhY2hlKDEwMDApXG59XG5cbi8qKlxuICogUGFyc2UgYSB0ZW1wbGF0ZSB0ZXh0IHN0cmluZyBpbnRvIGFuIGFycmF5IG9mIHRva2Vucy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdGV4dFxuICogQHJldHVybiB7QXJyYXk8T2JqZWN0PiB8IG51bGx9XG4gKiAgICAgICAgICAgICAgIC0ge1N0cmluZ30gdHlwZVxuICogICAgICAgICAgICAgICAtIHtTdHJpbmd9IHZhbHVlXG4gKiAgICAgICAgICAgICAgIC0ge0Jvb2xlYW59IFtodG1sXVxuICogICAgICAgICAgICAgICAtIHtCb29sZWFufSBbb25lVGltZV1cbiAqL1xuXG5leHBvcnRzLnBhcnNlID0gZnVuY3Rpb24gKHRleHQpIHtcbiAgaWYgKGNvbmZpZy5fZGVsaW1pdGVyc0NoYW5nZWQpIHtcbiAgICBjb21waWxlUmVnZXgoKVxuICB9XG4gIHZhciBoaXQgPSBjYWNoZS5nZXQodGV4dClcbiAgaWYgKGhpdCkge1xuICAgIHJldHVybiBoaXRcbiAgfVxuICBpZiAoIXRhZ1JFLnRlc3QodGV4dCkpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG4gIHZhciB0b2tlbnMgPSBbXVxuICB2YXIgbGFzdEluZGV4ID0gdGFnUkUubGFzdEluZGV4ID0gMFxuICB2YXIgbWF0Y2gsIGluZGV4LCB2YWx1ZSwgZmlyc3QsIG9uZVRpbWVcbiAgLyoganNoaW50IGJvc3M6dHJ1ZSAqL1xuICB3aGlsZSAobWF0Y2ggPSB0YWdSRS5leGVjKHRleHQpKSB7XG4gICAgaW5kZXggPSBtYXRjaC5pbmRleFxuICAgIC8vIHB1c2ggdGV4dCB0b2tlblxuICAgIGlmIChpbmRleCA+IGxhc3RJbmRleCkge1xuICAgICAgdG9rZW5zLnB1c2goe1xuICAgICAgICB2YWx1ZTogdGV4dC5zbGljZShsYXN0SW5kZXgsIGluZGV4KVxuICAgICAgfSlcbiAgICB9XG4gICAgLy8gdGFnIHRva2VuXG4gICAgZmlyc3QgPSBtYXRjaFsxXS5jaGFyQ29kZUF0KDApXG4gICAgb25lVGltZSA9IGZpcnN0ID09PSAweDJBIC8vICpcbiAgICB2YWx1ZSA9IG9uZVRpbWVcbiAgICAgID8gbWF0Y2hbMV0uc2xpY2UoMSlcbiAgICAgIDogbWF0Y2hbMV1cbiAgICB0b2tlbnMucHVzaCh7XG4gICAgICB0YWc6IHRydWUsXG4gICAgICB2YWx1ZTogdmFsdWUudHJpbSgpLFxuICAgICAgaHRtbDogaHRtbFJFLnRlc3QobWF0Y2hbMF0pLFxuICAgICAgb25lVGltZTogb25lVGltZVxuICAgIH0pXG4gICAgbGFzdEluZGV4ID0gaW5kZXggKyBtYXRjaFswXS5sZW5ndGhcbiAgfVxuICBpZiAobGFzdEluZGV4IDwgdGV4dC5sZW5ndGgpIHtcbiAgICB0b2tlbnMucHVzaCh7XG4gICAgICB2YWx1ZTogdGV4dC5zbGljZShsYXN0SW5kZXgpXG4gICAgfSlcbiAgfVxuICBjYWNoZS5wdXQodGV4dCwgdG9rZW5zKVxuICByZXR1cm4gdG9rZW5zXG59XG5cbi8qKlxuICogRm9ybWF0IGEgbGlzdCBvZiB0b2tlbnMgaW50byBhbiBleHByZXNzaW9uLlxuICogZS5nLiB0b2tlbnMgcGFyc2VkIGZyb20gJ2Ege3tifX0gYycgY2FuIGJlIHNlcmlhbGl6ZWRcbiAqIGludG8gb25lIHNpbmdsZSBleHByZXNzaW9uIGFzICdcImEgXCIgKyBiICsgXCIgY1wiJy5cbiAqXG4gKiBAcGFyYW0ge0FycmF5fSB0b2tlbnNcbiAqIEBwYXJhbSB7VnVlfSBbdm1dXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKi9cblxuZXhwb3J0cy50b2tlbnNUb0V4cCA9IGZ1bmN0aW9uICh0b2tlbnMsIHZtKSB7XG4gIHJldHVybiB0b2tlbnMubGVuZ3RoID4gMVxuICAgID8gdG9rZW5zLm1hcChmdW5jdGlvbiAodG9rZW4pIHtcbiAgICAgICAgcmV0dXJuIGZvcm1hdFRva2VuKHRva2VuLCB2bSlcbiAgICAgIH0pLmpvaW4oJysnKVxuICAgIDogZm9ybWF0VG9rZW4odG9rZW5zWzBdLCB2bSwgdHJ1ZSlcbn1cblxuLyoqXG4gKiBGb3JtYXQgYSBzaW5nbGUgdG9rZW4uXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHRva2VuXG4gKiBAcGFyYW0ge1Z1ZX0gW3ZtXVxuICogQHBhcmFtIHtCb29sZWFufSBzaW5nbGVcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqL1xuXG5mdW5jdGlvbiBmb3JtYXRUb2tlbiAodG9rZW4sIHZtLCBzaW5nbGUpIHtcbiAgcmV0dXJuIHRva2VuLnRhZ1xuICAgID8gdm0gJiYgdG9rZW4ub25lVGltZVxuICAgICAgPyAnXCInICsgdm0uJGV2YWwodG9rZW4udmFsdWUpICsgJ1wiJ1xuICAgICAgOiBpbmxpbmVGaWx0ZXJzKHRva2VuLnZhbHVlLCBzaW5nbGUpXG4gICAgOiAnXCInICsgdG9rZW4udmFsdWUgKyAnXCInXG59XG5cbi8qKlxuICogRm9yIGFuIGF0dHJpYnV0ZSB3aXRoIG11bHRpcGxlIGludGVycG9sYXRpb24gdGFncyxcbiAqIGUuZy4gYXR0cj1cInNvbWUte3t0aGluZyB8IGZpbHRlcn19XCIsIGluIG9yZGVyIHRvIGNvbWJpbmVcbiAqIHRoZSB3aG9sZSB0aGluZyBpbnRvIGEgc2luZ2xlIHdhdGNoYWJsZSBleHByZXNzaW9uLCB3ZVxuICogaGF2ZSB0byBpbmxpbmUgdGhvc2UgZmlsdGVycy4gVGhpcyBmdW5jdGlvbiBkb2VzIGV4YWN0bHlcbiAqIHRoYXQuIFRoaXMgaXMgYSBiaXQgaGFja3kgYnV0IGl0IGF2b2lkcyBoZWF2eSBjaGFuZ2VzXG4gKiB0byBkaXJlY3RpdmUgcGFyc2VyIGFuZCB3YXRjaGVyIG1lY2hhbmlzbS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXhwXG4gKiBAcGFyYW0ge0Jvb2xlYW59IHNpbmdsZVxuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5cbnZhciBmaWx0ZXJSRSA9IC9bXnxdXFx8W158XS9cbmZ1bmN0aW9uIGlubGluZUZpbHRlcnMgKGV4cCwgc2luZ2xlKSB7XG4gIGlmICghZmlsdGVyUkUudGVzdChleHApKSB7XG4gICAgcmV0dXJuIHNpbmdsZVxuICAgICAgPyBleHBcbiAgICAgIDogJygnICsgZXhwICsgJyknXG4gIH0gZWxzZSB7XG4gICAgdmFyIGRpciA9IGRpclBhcnNlci5wYXJzZShleHApWzBdXG4gICAgaWYgKCFkaXIuZmlsdGVycykge1xuICAgICAgcmV0dXJuICcoJyArIGV4cCArICcpJ1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gJ3RoaXMuX2FwcGx5RmlsdGVycygnICtcbiAgICAgICAgZGlyLmV4cHJlc3Npb24gKyAvLyB2YWx1ZVxuICAgICAgICAnLG51bGwsJyArICAgICAgIC8vIG9sZFZhbHVlIChudWxsIGZvciByZWFkKVxuICAgICAgICBKU09OLnN0cmluZ2lmeShkaXIuZmlsdGVycykgKyAvLyBmaWx0ZXIgZGVzY3JpcHRvcnNcbiAgICAgICAgJyxmYWxzZSknICAgICAgICAvLyB3cml0ZT9cbiAgICB9XG4gIH1cbn0iLCJ2YXIgXyA9IHJlcXVpcmUoJy4uL3V0aWwnKVxuXG4vKipcbiAqIEFwcGVuZCB3aXRoIHRyYW5zaXRpb24uXG4gKlxuICogQG9hcmFtIHtFbGVtZW50fSBlbFxuICogQHBhcmFtIHtFbGVtZW50fSB0YXJnZXRcbiAqIEBwYXJhbSB7VnVlfSB2bVxuICogQHBhcmFtIHtGdW5jdGlvbn0gW2NiXVxuICovXG5cbmV4cG9ydHMuYXBwZW5kID0gZnVuY3Rpb24gKGVsLCB0YXJnZXQsIHZtLCBjYikge1xuICBhcHBseShlbCwgMSwgZnVuY3Rpb24gKCkge1xuICAgIHRhcmdldC5hcHBlbmRDaGlsZChlbClcbiAgfSwgdm0sIGNiKVxufVxuXG4vKipcbiAqIEluc2VydEJlZm9yZSB3aXRoIHRyYW5zaXRpb24uXG4gKlxuICogQG9hcmFtIHtFbGVtZW50fSBlbFxuICogQHBhcmFtIHtFbGVtZW50fSB0YXJnZXRcbiAqIEBwYXJhbSB7VnVlfSB2bVxuICogQHBhcmFtIHtGdW5jdGlvbn0gW2NiXVxuICovXG5cbmV4cG9ydHMuYmVmb3JlID0gZnVuY3Rpb24gKGVsLCB0YXJnZXQsIHZtLCBjYikge1xuICBhcHBseShlbCwgMSwgZnVuY3Rpb24gKCkge1xuICAgIF8uYmVmb3JlKGVsLCB0YXJnZXQpXG4gIH0sIHZtLCBjYilcbn1cblxuLyoqXG4gKiBSZW1vdmUgd2l0aCB0cmFuc2l0aW9uLlxuICpcbiAqIEBvYXJhbSB7RWxlbWVudH0gZWxcbiAqIEBwYXJhbSB7VnVlfSB2bVxuICogQHBhcmFtIHtGdW5jdGlvbn0gW2NiXVxuICovXG5cbmV4cG9ydHMucmVtb3ZlID0gZnVuY3Rpb24gKGVsLCB2bSwgY2IpIHtcbiAgYXBwbHkoZWwsIC0xLCBmdW5jdGlvbiAoKSB7XG4gICAgXy5yZW1vdmUoZWwpXG4gIH0sIHZtLCBjYilcbn1cblxuLyoqXG4gKiBSZW1vdmUgYnkgYXBwZW5kaW5nIHRvIGFub3RoZXIgcGFyZW50IHdpdGggdHJhbnNpdGlvbi5cbiAqIFRoaXMgaXMgb25seSB1c2VkIGluIGJsb2NrIG9wZXJhdGlvbnMuXG4gKlxuICogQG9hcmFtIHtFbGVtZW50fSBlbFxuICogQHBhcmFtIHtFbGVtZW50fSB0YXJnZXRcbiAqIEBwYXJhbSB7VnVlfSB2bVxuICogQHBhcmFtIHtGdW5jdGlvbn0gW2NiXVxuICovXG5cbmV4cG9ydHMucmVtb3ZlVGhlbkFwcGVuZCA9IGZ1bmN0aW9uIChlbCwgdGFyZ2V0LCB2bSwgY2IpIHtcbiAgYXBwbHkoZWwsIC0xLCBmdW5jdGlvbiAoKSB7XG4gICAgdGFyZ2V0LmFwcGVuZENoaWxkKGVsKVxuICB9LCB2bSwgY2IpXG59XG5cbi8qKlxuICogQXBwZW5kIHRoZSBjaGlsZE5vZGVzIG9mIGEgZnJhZ21lbnQgdG8gdGFyZ2V0LlxuICpcbiAqIEBwYXJhbSB7RG9jdW1lbnRGcmFnbWVudH0gYmxvY2tcbiAqIEBwYXJhbSB7Tm9kZX0gdGFyZ2V0XG4gKiBAcGFyYW0ge1Z1ZX0gdm1cbiAqL1xuXG5leHBvcnRzLmJsb2NrQXBwZW5kID0gZnVuY3Rpb24gKGJsb2NrLCB0YXJnZXQsIHZtKSB7XG4gIHZhciBub2RlcyA9IF8udG9BcnJheShibG9jay5jaGlsZE5vZGVzKVxuICBmb3IgKHZhciBpID0gMCwgbCA9IG5vZGVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIGV4cG9ydHMuYmVmb3JlKG5vZGVzW2ldLCB0YXJnZXQsIHZtKVxuICB9XG59XG5cbi8qKlxuICogUmVtb3ZlIGEgYmxvY2sgb2Ygbm9kZXMgYmV0d2VlbiB0d28gZWRnZSBub2Rlcy5cbiAqXG4gKiBAcGFyYW0ge05vZGV9IHN0YXJ0XG4gKiBAcGFyYW0ge05vZGV9IGVuZFxuICogQHBhcmFtIHtWdWV9IHZtXG4gKi9cblxuZXhwb3J0cy5ibG9ja1JlbW92ZSA9IGZ1bmN0aW9uIChzdGFydCwgZW5kLCB2bSkge1xuICB2YXIgbm9kZSA9IHN0YXJ0Lm5leHRTaWJsaW5nXG4gIHZhciBuZXh0XG4gIHdoaWxlIChub2RlICE9PSBlbmQpIHtcbiAgICBuZXh0ID0gbm9kZS5uZXh0U2libGluZ1xuICAgIGV4cG9ydHMucmVtb3ZlKG5vZGUsIHZtKVxuICAgIG5vZGUgPSBuZXh0XG4gIH1cbn1cblxuLyoqXG4gKiBBcHBseSB0cmFuc2l0aW9ucyB3aXRoIGFuIG9wZXJhdGlvbiBjYWxsYmFjay5cbiAqXG4gKiBAb2FyYW0ge0VsZW1lbnR9IGVsXG4gKiBAcGFyYW0ge051bWJlcn0gZGlyZWN0aW9uXG4gKiAgICAgICAgICAgICAgICAgIDE6IGVudGVyXG4gKiAgICAgICAgICAgICAgICAgLTE6IGxlYXZlXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBvcCAtIHRoZSBhY3R1YWwgRE9NIG9wZXJhdGlvblxuICogQHBhcmFtIHtWdWV9IHZtXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY2JdXG4gKi9cblxudmFyIGFwcGx5ID0gZXhwb3J0cy5hcHBseSA9IGZ1bmN0aW9uIChlbCwgZGlyZWN0aW9uLCBvcCwgdm0sIGNiKSB7XG4gIHZhciB0cmFuc2l0aW9uID0gZWwuX192X3RyYW5zXG4gIGlmIChcbiAgICAhdHJhbnNpdGlvbiB8fFxuICAgIC8vIHNraXAgaWYgdGhlcmUgYXJlIG5vIGpzIGhvb2tzIGFuZCBDU1MgdHJhbnNpdGlvbiBpc1xuICAgIC8vIG5vdCBzdXBwb3J0ZWRcbiAgICAoIXRyYW5zaXRpb24uaG9va3MgJiYgIV8udHJhbnNpdGlvbkVuZEV2ZW50KSB8fFxuICAgIC8vIHNraXAgdHJhbnNpdGlvbnMgZm9yIGluaXRpYWwgY29tcGlsZVxuICAgICF2bS5faXNDb21waWxlZCB8fFxuICAgIC8vIGlmIHRoZSB2bSBpcyBiZWluZyBtYW5pcHVsYXRlZCBieSBhIHBhcmVudCBkaXJlY3RpdmVcbiAgICAvLyBkdXJpbmcgdGhlIHBhcmVudCdzIGNvbXBpbGF0aW9uIHBoYXNlLCBza2lwIHRoZVxuICAgIC8vIGFuaW1hdGlvbi5cbiAgICAodm0uJHBhcmVudCAmJiAhdm0uJHBhcmVudC5faXNDb21waWxlZClcbiAgKSB7XG4gICAgb3AoKVxuICAgIGlmIChjYikgY2IoKVxuICAgIHJldHVyblxuICB9XG4gIHZhciBhY3Rpb24gPSBkaXJlY3Rpb24gPiAwID8gJ2VudGVyJyA6ICdsZWF2ZSdcbiAgdHJhbnNpdGlvblthY3Rpb25dKG9wLCBjYilcbn0iLCJ2YXIgXyA9IHJlcXVpcmUoJy4uL3V0aWwnKVxudmFyIHF1ZXVlID0gW11cbnZhciBxdWV1ZWQgPSBmYWxzZVxuXG4vKipcbiAqIFB1c2ggYSBqb2IgaW50byB0aGUgcXVldWUuXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gam9iXG4gKi9cblxuZXhwb3J0cy5wdXNoID0gZnVuY3Rpb24gKGpvYikge1xuICBxdWV1ZS5wdXNoKGpvYilcbiAgaWYgKCFxdWV1ZWQpIHtcbiAgICBxdWV1ZWQgPSB0cnVlXG4gICAgXy5uZXh0VGljayhmbHVzaClcbiAgfVxufVxuXG4vKipcbiAqIEZsdXNoIHRoZSBxdWV1ZSwgYW5kIGRvIG9uZSBmb3JjZWQgcmVmbG93IGJlZm9yZVxuICogdHJpZ2dlcmluZyB0cmFuc2l0aW9ucy5cbiAqL1xuXG5mdW5jdGlvbiBmbHVzaCAoKSB7XG4gIC8vIEZvcmNlIGxheW91dFxuICB2YXIgZiA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5vZmZzZXRIZWlnaHRcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBxdWV1ZS5sZW5ndGg7IGkrKykge1xuICAgIHF1ZXVlW2ldKClcbiAgfVxuICBxdWV1ZSA9IFtdXG4gIHF1ZXVlZCA9IGZhbHNlXG4gIC8vIGR1bW15IHJldHVybiwgc28ganMgbGludGVycyBkb24ndCBjb21wbGFpbiBhYm91dFxuICAvLyB1bnVzZWQgdmFyaWFibGUgZlxuICByZXR1cm4gZlxufSIsInZhciBfID0gcmVxdWlyZSgnLi4vdXRpbCcpXG52YXIgcXVldWUgPSByZXF1aXJlKCcuL3F1ZXVlJylcbnZhciBhZGRDbGFzcyA9IF8uYWRkQ2xhc3NcbnZhciByZW1vdmVDbGFzcyA9IF8ucmVtb3ZlQ2xhc3NcbnZhciB0cmFuc2l0aW9uRW5kRXZlbnQgPSBfLnRyYW5zaXRpb25FbmRFdmVudFxudmFyIGFuaW1hdGlvbkVuZEV2ZW50ID0gXy5hbmltYXRpb25FbmRFdmVudFxudmFyIHRyYW5zRHVyYXRpb25Qcm9wID0gXy50cmFuc2l0aW9uUHJvcCArICdEdXJhdGlvbidcbnZhciBhbmltRHVyYXRpb25Qcm9wID0gXy5hbmltYXRpb25Qcm9wICsgJ0R1cmF0aW9uJ1xuXG52YXIgVFlQRV9UUkFOU0lUSU9OID0gMVxudmFyIFRZUEVfQU5JTUFUSU9OID0gMlxuXG4vKipcbiAqIEEgVHJhbnNpdGlvbiBvYmplY3QgdGhhdCBlbmNhcHN1bGF0ZXMgdGhlIHN0YXRlIGFuZCBsb2dpY1xuICogb2YgdGhlIHRyYW5zaXRpb24uXG4gKlxuICogQHBhcmFtIHtFbGVtZW50fSBlbFxuICogQHBhcmFtIHtTdHJpbmd9IGlkXG4gKiBAcGFyYW0ge09iamVjdH0gaG9va3NcbiAqIEBwYXJhbSB7VnVlfSB2bVxuICovXG5cbmZ1bmN0aW9uIFRyYW5zaXRpb24gKGVsLCBpZCwgaG9va3MsIHZtKSB7XG4gIHRoaXMuZWwgPSBlbFxuICB0aGlzLmVudGVyQ2xhc3MgPSBpZCArICctZW50ZXInXG4gIHRoaXMubGVhdmVDbGFzcyA9IGlkICsgJy1sZWF2ZSdcbiAgdGhpcy5ob29rcyA9IGhvb2tzXG4gIHRoaXMudm0gPSB2bVxuICAvLyBhc3luYyBzdGF0ZVxuICB0aGlzLnBlbmRpbmdDc3NFdmVudCA9XG4gIHRoaXMucGVuZGluZ0Nzc0NiID1cbiAgdGhpcy5jYW5jZWwgPVxuICB0aGlzLnBlbmRpbmdKc0NiID1cbiAgdGhpcy5vcCA9XG4gIHRoaXMuY2IgPSBudWxsXG4gIHRoaXMudHlwZUNhY2hlID0ge31cbiAgLy8gYmluZFxuICB2YXIgc2VsZiA9IHRoaXNcbiAgO1snZW50ZXJOZXh0VGljaycsICdlbnRlckRvbmUnLCAnbGVhdmVOZXh0VGljaycsICdsZWF2ZURvbmUnXVxuICAgIC5mb3JFYWNoKGZ1bmN0aW9uIChtKSB7XG4gICAgICBzZWxmW21dID0gXy5iaW5kKHNlbGZbbV0sIHNlbGYpXG4gICAgfSlcbn1cblxudmFyIHAgPSBUcmFuc2l0aW9uLnByb3RvdHlwZVxuXG4vKipcbiAqIFN0YXJ0IGFuIGVudGVyaW5nIHRyYW5zaXRpb24uXG4gKlxuICogMS4gZW50ZXIgdHJhbnNpdGlvbiB0cmlnZ2VyZWRcbiAqIDIuIGNhbGwgYmVmb3JlRW50ZXIgaG9va1xuICogMy4gYWRkIGVudGVyIGNsYXNzXG4gKiA0LiBpbnNlcnQvc2hvdyBlbGVtZW50XG4gKiA1LiBjYWxsIGVudGVyIGhvb2sgKHdpdGggcG9zc2libGUgZXhwbGljaXQganMgY2FsbGJhY2spXG4gKiA2LiByZWZsb3dcbiAqIDcuIGJhc2VkIG9uIHRyYW5zaXRpb24gdHlwZTpcbiAqICAgIC0gdHJhbnNpdGlvbjpcbiAqICAgICAgICByZW1vdmUgY2xhc3Mgbm93LCB3YWl0IGZvciB0cmFuc2l0aW9uZW5kLFxuICogICAgICAgIHRoZW4gZG9uZSBpZiB0aGVyZSdzIG5vIGV4cGxpY2l0IGpzIGNhbGxiYWNrLlxuICogICAgLSBhbmltYXRpb246XG4gKiAgICAgICAgd2FpdCBmb3IgYW5pbWF0aW9uZW5kLCByZW1vdmUgY2xhc3MsXG4gKiAgICAgICAgdGhlbiBkb25lIGlmIHRoZXJlJ3Mgbm8gZXhwbGljaXQganMgY2FsbGJhY2suXG4gKiAgICAtIG5vIGNzcyB0cmFuc2l0aW9uOlxuICogICAgICAgIGRvbmUgbm93IGlmIHRoZXJlJ3Mgbm8gZXhwbGljaXQganMgY2FsbGJhY2suXG4gKiA4LiB3YWl0IGZvciBlaXRoZXIgZG9uZSBvciBqcyBjYWxsYmFjaywgdGhlbiBjYWxsXG4gKiAgICBhZnRlckVudGVyIGhvb2suXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gb3AgLSBpbnNlcnQvc2hvdyB0aGUgZWxlbWVudFxuICogQHBhcmFtIHtGdW5jdGlvbn0gW2NiXVxuICovXG5cbnAuZW50ZXIgPSBmdW5jdGlvbiAob3AsIGNiKSB7XG4gIHRoaXMuY2FuY2VsUGVuZGluZygpXG4gIHRoaXMuY2FsbEhvb2soJ2JlZm9yZUVudGVyJylcbiAgdGhpcy5jYiA9IGNiXG4gIGFkZENsYXNzKHRoaXMuZWwsIHRoaXMuZW50ZXJDbGFzcylcbiAgb3AoKVxuICB0aGlzLmNhbGxIb29rV2l0aENiKCdlbnRlcicpXG4gIHRoaXMuY2FuY2VsID0gdGhpcy5ob29rcyAmJiB0aGlzLmhvb2tzLmVudGVyQ2FuY2VsbGVkXG4gIHF1ZXVlLnB1c2godGhpcy5lbnRlck5leHRUaWNrKVxufVxuXG4vKipcbiAqIFRoZSBcIm5leHRUaWNrXCIgcGhhc2Ugb2YgYW4gZW50ZXJpbmcgdHJhbnNpdGlvbiwgd2hpY2ggaXNcbiAqIHRvIGJlIHB1c2hlZCBpbnRvIGEgcXVldWUgYW5kIGV4ZWN1dGVkIGFmdGVyIGEgcmVmbG93IHNvXG4gKiB0aGF0IHJlbW92aW5nIHRoZSBjbGFzcyBjYW4gdHJpZ2dlciBhIENTUyB0cmFuc2l0aW9uLlxuICovXG5cbnAuZW50ZXJOZXh0VGljayA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIHR5cGUgPSB0aGlzLmdldENzc1RyYW5zaXRpb25UeXBlKHRoaXMuZW50ZXJDbGFzcylcbiAgdmFyIGVudGVyRG9uZSA9IHRoaXMuZW50ZXJEb25lXG4gIGlmICh0eXBlID09PSBUWVBFX1RSQU5TSVRJT04pIHtcbiAgICAvLyB0cmlnZ2VyIHRyYW5zaXRpb24gYnkgcmVtb3ZpbmcgZW50ZXIgY2xhc3Mgbm93XG4gICAgcmVtb3ZlQ2xhc3ModGhpcy5lbCwgdGhpcy5lbnRlckNsYXNzKVxuICAgIHRoaXMuc2V0dXBDc3NDYih0cmFuc2l0aW9uRW5kRXZlbnQsIGVudGVyRG9uZSlcbiAgfSBlbHNlIGlmICh0eXBlID09PSBUWVBFX0FOSU1BVElPTikge1xuICAgIHRoaXMuc2V0dXBDc3NDYihhbmltYXRpb25FbmRFdmVudCwgZW50ZXJEb25lKVxuICB9IGVsc2UgaWYgKCF0aGlzLnBlbmRpbmdKc0NiKSB7XG4gICAgZW50ZXJEb25lKClcbiAgfVxufVxuXG4vKipcbiAqIFRoZSBcImNsZWFudXBcIiBwaGFzZSBvZiBhbiBlbnRlcmluZyB0cmFuc2l0aW9uLlxuICovXG5cbnAuZW50ZXJEb25lID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLmNhbmNlbCA9IHRoaXMucGVuZGluZ0pzQ2IgPSBudWxsXG4gIHJlbW92ZUNsYXNzKHRoaXMuZWwsIHRoaXMuZW50ZXJDbGFzcylcbiAgdGhpcy5jYWxsSG9vaygnYWZ0ZXJFbnRlcicpXG4gIGlmICh0aGlzLmNiKSB0aGlzLmNiKClcbn1cblxuLyoqXG4gKiBTdGFydCBhIGxlYXZpbmcgdHJhbnNpdGlvbi5cbiAqXG4gKiAxLiBsZWF2ZSB0cmFuc2l0aW9uIHRyaWdnZXJlZC5cbiAqIDIuIGNhbGwgYmVmb3JlTGVhdmUgaG9va1xuICogMy4gYWRkIGxlYXZlIGNsYXNzICh0cmlnZ2VyIGNzcyB0cmFuc2l0aW9uKVxuICogNC4gY2FsbCBsZWF2ZSBob29rICh3aXRoIHBvc3NpYmxlIGV4cGxpY2l0IGpzIGNhbGxiYWNrKVxuICogNS4gcmVmbG93IGlmIG5vIGV4cGxpY2l0IGpzIGNhbGxiYWNrIGlzIHByb3ZpZGVkXG4gKiA2LiBiYXNlZCBvbiB0cmFuc2l0aW9uIHR5cGU6XG4gKiAgICAtIHRyYW5zaXRpb24gb3IgYW5pbWF0aW9uOlxuICogICAgICAgIHdhaXQgZm9yIGVuZCBldmVudCwgcmVtb3ZlIGNsYXNzLCB0aGVuIGRvbmUgaWZcbiAqICAgICAgICB0aGVyZSdzIG5vIGV4cGxpY2l0IGpzIGNhbGxiYWNrLlxuICogICAgLSBubyBjc3MgdHJhbnNpdGlvbjogXG4gKiAgICAgICAgZG9uZSBpZiB0aGVyZSdzIG5vIGV4cGxpY2l0IGpzIGNhbGxiYWNrLlxuICogNy4gd2FpdCBmb3IgZWl0aGVyIGRvbmUgb3IganMgY2FsbGJhY2ssIHRoZW4gY2FsbFxuICogICAgYWZ0ZXJMZWF2ZSBob29rLlxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IG9wIC0gcmVtb3ZlL2hpZGUgdGhlIGVsZW1lbnRcbiAqIEBwYXJhbSB7RnVuY3Rpb259IFtjYl1cbiAqL1xuXG5wLmxlYXZlID0gZnVuY3Rpb24gKG9wLCBjYikge1xuICB0aGlzLmNhbmNlbFBlbmRpbmcoKVxuICB0aGlzLmNhbGxIb29rKCdiZWZvcmVMZWF2ZScpXG4gIHRoaXMub3AgPSBvcFxuICB0aGlzLmNiID0gY2JcbiAgYWRkQ2xhc3ModGhpcy5lbCwgdGhpcy5sZWF2ZUNsYXNzKVxuICB0aGlzLmNhbGxIb29rV2l0aENiKCdsZWF2ZScpXG4gIHRoaXMuY2FuY2VsID0gdGhpcy5ob29rcyAmJiB0aGlzLmhvb2tzLmVudGVyQ2FuY2VsbGVkXG4gIC8vIG9ubHkgbmVlZCB0byBkbyBsZWF2ZU5leHRUaWNrIGlmIHRoZXJlJ3Mgbm8gZXhwbGljaXRcbiAgLy8ganMgY2FsbGJhY2tcbiAgaWYgKCF0aGlzLnBlbmRpbmdKc0NiKSB7XG4gICAgcXVldWUucHVzaCh0aGlzLmxlYXZlTmV4dFRpY2spXG4gIH1cbn1cblxuLyoqXG4gKiBUaGUgXCJuZXh0VGlja1wiIHBoYXNlIG9mIGEgbGVhdmluZyB0cmFuc2l0aW9uLlxuICovXG5cbnAubGVhdmVOZXh0VGljayA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIHR5cGUgPSB0aGlzLmdldENzc1RyYW5zaXRpb25UeXBlKHRoaXMubGVhdmVDbGFzcylcbiAgaWYgKHR5cGUpIHtcbiAgICB2YXIgZXZlbnQgPSB0eXBlID09PSBUWVBFX1RSQU5TSVRJT05cbiAgICAgID8gdHJhbnNpdGlvbkVuZEV2ZW50XG4gICAgICA6IGFuaW1hdGlvbkVuZEV2ZW50XG4gICAgdGhpcy5zZXR1cENzc0NiKGV2ZW50LCB0aGlzLmxlYXZlRG9uZSlcbiAgfSBlbHNlIHtcbiAgICB0aGlzLmxlYXZlRG9uZSgpXG4gIH1cbn1cblxuLyoqXG4gKiBUaGUgXCJjbGVhbnVwXCIgcGhhc2Ugb2YgYSBsZWF2aW5nIHRyYW5zaXRpb24uXG4gKi9cblxucC5sZWF2ZURvbmUgPSBmdW5jdGlvbiAoKSB7XG4gIHRoaXMuY2FuY2VsID0gdGhpcy5wZW5kaW5nSnNDYiA9IG51bGxcbiAgdGhpcy5vcCgpXG4gIHJlbW92ZUNsYXNzKHRoaXMuZWwsIHRoaXMubGVhdmVDbGFzcylcbiAgdGhpcy5jYWxsSG9vaygnYWZ0ZXJMZWF2ZScpXG4gIGlmICh0aGlzLmNiKSB0aGlzLmNiKClcbn1cblxuLyoqXG4gKiBDYW5jZWwgYW55IHBlbmRpbmcgY2FsbGJhY2tzIGZyb20gYSBwcmV2aW91c2x5IHJ1bm5pbmdcbiAqIGJ1dCBub3QgZmluaXNoZWQgdHJhbnNpdGlvbi5cbiAqL1xuXG5wLmNhbmNlbFBlbmRpbmcgPSBmdW5jdGlvbiAoKSB7XG4gIHRoaXMub3AgPSB0aGlzLmNiID0gbnVsbFxuICB2YXIgaGFzUGVuZGluZyA9IGZhbHNlXG4gIGlmICh0aGlzLnBlbmRpbmdDc3NDYikge1xuICAgIGhhc1BlbmRpbmcgPSB0cnVlXG4gICAgXy5vZmYodGhpcy5lbCwgdGhpcy5wZW5kaW5nQ3NzRXZlbnQsIHRoaXMucGVuZGluZ0Nzc0NiKVxuICAgIHRoaXMucGVuZGluZ0Nzc0V2ZW50ID0gdGhpcy5wZW5kaW5nQ3NzQ2IgPSBudWxsXG4gIH1cbiAgaWYgKHRoaXMucGVuZGluZ0pzQ2IpIHtcbiAgICBoYXNQZW5kaW5nID0gdHJ1ZVxuICAgIHRoaXMucGVuZGluZ0pzQ2IuY2FuY2VsKClcbiAgICB0aGlzLnBlbmRpbmdKc0NiID0gbnVsbFxuICB9XG4gIGlmIChoYXNQZW5kaW5nKSB7XG4gICAgcmVtb3ZlQ2xhc3ModGhpcy5lbCwgdGhpcy5lbnRlckNsYXNzKVxuICAgIHJlbW92ZUNsYXNzKHRoaXMuZWwsIHRoaXMubGVhdmVDbGFzcylcbiAgfVxuICBpZiAodGhpcy5jYW5jZWwpIHtcbiAgICB0aGlzLmNhbmNlbC5jYWxsKHRoaXMudm0sIHRoaXMuZWwpXG4gICAgdGhpcy5jYW5jZWwgPSBudWxsXG4gIH1cbn1cblxuLyoqXG4gKiBDYWxsIGEgdXNlci1wcm92aWRlZCBzeW5jaHJvbm91cyBob29rIGZ1bmN0aW9uLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlXG4gKi9cblxucC5jYWxsSG9vayA9IGZ1bmN0aW9uICh0eXBlKSB7XG4gIGlmICh0aGlzLmhvb2tzICYmIHRoaXMuaG9va3NbdHlwZV0pIHtcbiAgICB0aGlzLmhvb2tzW3R5cGVdLmNhbGwodGhpcy52bSwgdGhpcy5lbClcbiAgfVxufVxuXG4vKipcbiAqIENhbGwgYSB1c2VyLXByb3ZpZGVkLCBwb3RlbnRpYWxseS1hc3luYyBob29rIGZ1bmN0aW9uLlxuICogV2UgY2hlY2sgZm9yIHRoZSBsZW5ndGggb2YgYXJndW1lbnRzIHRvIHNlZSBpZiB0aGUgaG9va1xuICogZXhwZWN0cyBhIGBkb25lYCBjYWxsYmFjay4gSWYgdHJ1ZSwgdGhlIHRyYW5zaXRpb24ncyBlbmRcbiAqIHdpbGwgYmUgZGV0ZXJtaW5lZCBieSB3aGVuIHRoZSB1c2VyIGNhbGxzIHRoYXQgY2FsbGJhY2s7XG4gKiBvdGhlcndpc2UsIHRoZSBlbmQgaXMgZGV0ZXJtaW5lZCBieSB0aGUgQ1NTIHRyYW5zaXRpb24gb3JcbiAqIGFuaW1hdGlvbi5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdHlwZVxuICovXG5cbnAuY2FsbEhvb2tXaXRoQ2IgPSBmdW5jdGlvbiAodHlwZSkge1xuICB2YXIgaG9vayA9IHRoaXMuaG9va3MgJiYgdGhpcy5ob29rc1t0eXBlXVxuICBpZiAoaG9vaykge1xuICAgIGlmIChob29rLmxlbmd0aCA+IDEpIHtcbiAgICAgIHRoaXMucGVuZGluZ0pzQ2IgPSBfLmNhbmNlbGxhYmxlKHRoaXNbdHlwZSArICdEb25lJ10pXG4gICAgfVxuICAgIGhvb2suY2FsbCh0aGlzLnZtLCB0aGlzLmVsLCB0aGlzLnBlbmRpbmdKc0NiKVxuICB9XG59XG5cbi8qKlxuICogR2V0IGFuIGVsZW1lbnQncyB0cmFuc2l0aW9uIHR5cGUgYmFzZWQgb24gdGhlXG4gKiBjYWxjdWxhdGVkIHN0eWxlcy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gY2xhc3NOYW1lXG4gKiBAcmV0dXJuIHtOdW1iZXJ9XG4gKi9cblxucC5nZXRDc3NUcmFuc2l0aW9uVHlwZSA9IGZ1bmN0aW9uIChjbGFzc05hbWUpIHtcbiAgLy8gc2tpcCBDU1MgdHJhbnNpdGlvbnMgaWYgcGFnZSBpcyBub3QgdmlzaWJsZSAtXG4gIC8vIHRoaXMgc29sdmVzIHRoZSBpc3N1ZSBvZiB0cmFuc2l0aW9uZW5kIGV2ZW50cyBub3RcbiAgLy8gZmlyaW5nIHVudGlsIHRoZSBwYWdlIGlzIHZpc2libGUgYWdhaW4uXG4gIC8vIHBhZ2VWaXNpYmlsaXR5IEFQSSBpcyBzdXBwb3J0ZWQgaW4gSUUxMCssIHNhbWUgYXNcbiAgLy8gQ1NTIHRyYW5zaXRpb25zLlxuICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cbiAgaWYgKCF0cmFuc2l0aW9uRW5kRXZlbnQgfHwgZG9jdW1lbnQuaGlkZGVuKSB7XG4gICAgcmV0dXJuXG4gIH1cbiAgdmFyIHR5cGUgPSB0aGlzLnR5cGVDYWNoZVtjbGFzc05hbWVdXG4gIGlmICh0eXBlKSByZXR1cm4gdHlwZVxuICB2YXIgaW5saW5lU3R5bGVzID0gdGhpcy5lbC5zdHlsZVxuICB2YXIgY29tcHV0ZWRTdHlsZXMgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSh0aGlzLmVsKVxuICB2YXIgdHJhbnNEdXJhdGlvbiA9XG4gICAgaW5saW5lU3R5bGVzW3RyYW5zRHVyYXRpb25Qcm9wXSB8fFxuICAgIGNvbXB1dGVkU3R5bGVzW3RyYW5zRHVyYXRpb25Qcm9wXVxuICBpZiAodHJhbnNEdXJhdGlvbiAmJiB0cmFuc0R1cmF0aW9uICE9PSAnMHMnKSB7XG4gICAgdHlwZSA9IFRZUEVfVFJBTlNJVElPTlxuICB9IGVsc2Uge1xuICAgIHZhciBhbmltRHVyYXRpb24gPVxuICAgICAgaW5saW5lU3R5bGVzW2FuaW1EdXJhdGlvblByb3BdIHx8XG4gICAgICBjb21wdXRlZFN0eWxlc1thbmltRHVyYXRpb25Qcm9wXVxuICAgIGlmIChhbmltRHVyYXRpb24gJiYgYW5pbUR1cmF0aW9uICE9PSAnMHMnKSB7XG4gICAgICB0eXBlID0gVFlQRV9BTklNQVRJT05cbiAgICB9XG4gIH1cbiAgaWYgKHR5cGUpIHtcbiAgICB0aGlzLnR5cGVDYWNoZVtjbGFzc05hbWVdID0gdHlwZVxuICB9XG4gIHJldHVybiB0eXBlXG59XG5cbi8qKlxuICogU2V0dXAgYSBDU1MgdHJhbnNpdGlvbmVuZC9hbmltYXRpb25lbmQgY2FsbGJhY2suXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYlxuICovXG5cbnAuc2V0dXBDc3NDYiA9IGZ1bmN0aW9uIChldmVudCwgY2IpIHtcbiAgdGhpcy5wZW5kaW5nQ3NzRXZlbnQgPSBldmVudFxuICB2YXIgc2VsZiA9IHRoaXNcbiAgdmFyIGVsID0gdGhpcy5lbFxuICB2YXIgb25FbmQgPSB0aGlzLnBlbmRpbmdDc3NDYiA9IGZ1bmN0aW9uIChlKSB7XG4gICAgaWYgKGUudGFyZ2V0ID09PSBlbCkge1xuICAgICAgXy5vZmYoZWwsIGV2ZW50LCBvbkVuZClcbiAgICAgIHNlbGYucGVuZGluZ0Nzc0V2ZW50ID0gc2VsZi5wZW5kaW5nQ3NzQ2IgPSBudWxsXG4gICAgICBpZiAoIXNlbGYucGVuZGluZ0pzQ2IgJiYgY2IpIHtcbiAgICAgICAgY2IoKVxuICAgICAgfVxuICAgIH1cbiAgfVxuICBfLm9uKGVsLCBldmVudCwgb25FbmQpXG59XG5cbm1vZHVsZS5leHBvcnRzID0gVHJhbnNpdGlvbiIsInZhciBjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWcnKVxuXG4vKipcbiAqIEVuYWJsZSBkZWJ1ZyB1dGlsaXRpZXMuIFRoZSBlbmFibGVEZWJ1ZygpIGZ1bmN0aW9uIGFuZFxuICogYWxsIF8ubG9nKCkgJiBfLndhcm4oKSBjYWxscyB3aWxsIGJlIGRyb3BwZWQgaW4gdGhlXG4gKiBtaW5pZmllZCBwcm9kdWN0aW9uIGJ1aWxkLlxuICovXG5cbmVuYWJsZURlYnVnKClcblxuZnVuY3Rpb24gZW5hYmxlRGVidWcgKCkge1xuXG4gIHZhciBoYXNDb25zb2xlID0gdHlwZW9mIGNvbnNvbGUgIT09ICd1bmRlZmluZWQnXG4gIFxuICAvKipcbiAgICogTG9nIGEgbWVzc2FnZS5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IG1zZ1xuICAgKi9cblxuICBleHBvcnRzLmxvZyA9IGZ1bmN0aW9uIChtc2cpIHtcbiAgICBpZiAoaGFzQ29uc29sZSAmJiBjb25maWcuZGVidWcpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdbVnVlIGluZm9dOiAnICsgbXNnKVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBXZSd2ZSBnb3QgYSBwcm9ibGVtIGhlcmUuXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBtc2dcbiAgICovXG5cbiAgZXhwb3J0cy53YXJuID0gZnVuY3Rpb24gKG1zZywgZSkge1xuICAgIGlmIChoYXNDb25zb2xlICYmICghY29uZmlnLnNpbGVudCB8fCBjb25maWcuZGVidWcpKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ1tWdWUgd2Fybl06ICcgKyBtc2cpXG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cbiAgICAgIGlmIChjb25maWcuZGVidWcpIHtcbiAgICAgICAgLyoganNoaW50IGRlYnVnOiB0cnVlICovXG4gICAgICAgIGNvbnNvbGUud2FybigoZSB8fCBuZXcgRXJyb3IoJ1dhcm5pbmcgU3RhY2sgVHJhY2UnKSkuc3RhY2spXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFzc2VydCBhc3NldCBleGlzdHNcbiAgICovXG5cbiAgZXhwb3J0cy5hc3NlcnRBc3NldCA9IGZ1bmN0aW9uICh2YWwsIHR5cGUsIGlkKSB7XG4gICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gICAgaWYgKHR5cGUgPT09ICdkaXJlY3RpdmUnKSB7XG4gICAgICBpZiAoaWQgPT09ICdjb21wb25lbnQnKSB7XG4gICAgICAgIGV4cG9ydHMud2FybihcbiAgICAgICAgICAndi1jb21wb25lbnQgaGFzIGJlZW4gZGVwcmVjYXRlZCBpbiAwLjEyLiAnICtcbiAgICAgICAgICAnVXNlIGN1c3RvbSBlbGVtZW50IHN5bnRheCBpbnN0ZWFkLidcbiAgICAgICAgKVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICAgIGlmIChpZCA9PT0gJ3dpdGgnKSB7XG4gICAgICAgIGV4cG9ydHMud2FybihcbiAgICAgICAgICAndi13aXRoIGhhcyBiZWVuIGRlcHJlY2F0ZWQgaW4gMC4xMi4gJyArXG4gICAgICAgICAgJ1VzZSBwcm9wcyBpbnN0ZWFkLidcbiAgICAgICAgKVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCF2YWwpIHtcbiAgICAgIGV4cG9ydHMud2FybignRmFpbGVkIHRvIHJlc29sdmUgJyArIHR5cGUgKyAnOiAnICsgaWQpXG4gICAgfVxuICB9XG59IiwidmFyIGNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZycpXG5cbi8qKlxuICogQ2hlY2sgaWYgYSBub2RlIGlzIGluIHRoZSBkb2N1bWVudC5cbiAqIE5vdGU6IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jb250YWlucyBzaG91bGQgd29yayBoZXJlXG4gKiBidXQgYWx3YXlzIHJldHVybnMgZmFsc2UgZm9yIGNvbW1lbnQgbm9kZXMgaW4gcGhhbnRvbWpzLFxuICogbWFraW5nIHVuaXQgdGVzdHMgZGlmZmljdWx0LiBUaGlzIGlzIGZpeGVkIGJ5eSBkb2luZyB0aGVcbiAqIGNvbnRhaW5zKCkgY2hlY2sgb24gdGhlIG5vZGUncyBwYXJlbnROb2RlIGluc3RlYWQgb2ZcbiAqIHRoZSBub2RlIGl0c2VsZi5cbiAqXG4gKiBAcGFyYW0ge05vZGV9IG5vZGVcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKi9cblxuZXhwb3J0cy5pbkRvYyA9IGZ1bmN0aW9uIChub2RlKSB7XG4gIHZhciBkb2MgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnRcbiAgdmFyIHBhcmVudCA9IG5vZGUgJiYgbm9kZS5wYXJlbnROb2RlXG4gIHJldHVybiBkb2MgPT09IG5vZGUgfHxcbiAgICBkb2MgPT09IHBhcmVudCB8fFxuICAgICEhKHBhcmVudCAmJiBwYXJlbnQubm9kZVR5cGUgPT09IDEgJiYgKGRvYy5jb250YWlucyhwYXJlbnQpKSlcbn1cblxuLyoqXG4gKiBFeHRyYWN0IGFuIGF0dHJpYnV0ZSBmcm9tIGEgbm9kZS5cbiAqXG4gKiBAcGFyYW0ge05vZGV9IG5vZGVcbiAqIEBwYXJhbSB7U3RyaW5nfSBhdHRyXG4gKi9cblxuZXhwb3J0cy5hdHRyID0gZnVuY3Rpb24gKG5vZGUsIGF0dHIpIHtcbiAgYXR0ciA9IGNvbmZpZy5wcmVmaXggKyBhdHRyXG4gIHZhciB2YWwgPSBub2RlLmdldEF0dHJpYnV0ZShhdHRyKVxuICBpZiAodmFsICE9PSBudWxsKSB7XG4gICAgbm9kZS5yZW1vdmVBdHRyaWJ1dGUoYXR0cilcbiAgfVxuICByZXR1cm4gdmFsXG59XG5cbi8qKlxuICogSW5zZXJ0IGVsIGJlZm9yZSB0YXJnZXRcbiAqXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGVsXG4gKiBAcGFyYW0ge0VsZW1lbnR9IHRhcmdldFxuICovXG5cbmV4cG9ydHMuYmVmb3JlID0gZnVuY3Rpb24gKGVsLCB0YXJnZXQpIHtcbiAgdGFyZ2V0LnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGVsLCB0YXJnZXQpXG59XG5cbi8qKlxuICogSW5zZXJ0IGVsIGFmdGVyIHRhcmdldFxuICpcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxcbiAqIEBwYXJhbSB7RWxlbWVudH0gdGFyZ2V0XG4gKi9cblxuZXhwb3J0cy5hZnRlciA9IGZ1bmN0aW9uIChlbCwgdGFyZ2V0KSB7XG4gIGlmICh0YXJnZXQubmV4dFNpYmxpbmcpIHtcbiAgICBleHBvcnRzLmJlZm9yZShlbCwgdGFyZ2V0Lm5leHRTaWJsaW5nKVxuICB9IGVsc2Uge1xuICAgIHRhcmdldC5wYXJlbnROb2RlLmFwcGVuZENoaWxkKGVsKVxuICB9XG59XG5cbi8qKlxuICogUmVtb3ZlIGVsIGZyb20gRE9NXG4gKlxuICogQHBhcmFtIHtFbGVtZW50fSBlbFxuICovXG5cbmV4cG9ydHMucmVtb3ZlID0gZnVuY3Rpb24gKGVsKSB7XG4gIGVsLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoZWwpXG59XG5cbi8qKlxuICogUHJlcGVuZCBlbCB0byB0YXJnZXRcbiAqXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGVsXG4gKiBAcGFyYW0ge0VsZW1lbnR9IHRhcmdldFxuICovXG5cbmV4cG9ydHMucHJlcGVuZCA9IGZ1bmN0aW9uIChlbCwgdGFyZ2V0KSB7XG4gIGlmICh0YXJnZXQuZmlyc3RDaGlsZCkge1xuICAgIGV4cG9ydHMuYmVmb3JlKGVsLCB0YXJnZXQuZmlyc3RDaGlsZClcbiAgfSBlbHNlIHtcbiAgICB0YXJnZXQuYXBwZW5kQ2hpbGQoZWwpXG4gIH1cbn1cblxuLyoqXG4gKiBSZXBsYWNlIHRhcmdldCB3aXRoIGVsXG4gKlxuICogQHBhcmFtIHtFbGVtZW50fSB0YXJnZXRcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxcbiAqL1xuXG5leHBvcnRzLnJlcGxhY2UgPSBmdW5jdGlvbiAodGFyZ2V0LCBlbCkge1xuICB2YXIgcGFyZW50ID0gdGFyZ2V0LnBhcmVudE5vZGVcbiAgaWYgKHBhcmVudCkge1xuICAgIHBhcmVudC5yZXBsYWNlQ2hpbGQoZWwsIHRhcmdldClcbiAgfVxufVxuXG4vKipcbiAqIEFkZCBldmVudCBsaXN0ZW5lciBzaG9ydGhhbmQuXG4gKlxuICogQHBhcmFtIHtFbGVtZW50fSBlbFxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYlxuICovXG5cbmV4cG9ydHMub24gPSBmdW5jdGlvbiAoZWwsIGV2ZW50LCBjYikge1xuICBlbC5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBjYilcbn1cblxuLyoqXG4gKiBSZW1vdmUgZXZlbnQgbGlzdGVuZXIgc2hvcnRoYW5kLlxuICpcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2JcbiAqL1xuXG5leHBvcnRzLm9mZiA9IGZ1bmN0aW9uIChlbCwgZXZlbnQsIGNiKSB7XG4gIGVsLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnQsIGNiKVxufVxuXG4vKipcbiAqIEFkZCBjbGFzcyB3aXRoIGNvbXBhdGliaWxpdHkgZm9yIElFICYgU1ZHXG4gKlxuICogQHBhcmFtIHtFbGVtZW50fSBlbFxuICogQHBhcmFtIHtTdHJvbmd9IGNsc1xuICovXG5cbmV4cG9ydHMuYWRkQ2xhc3MgPSBmdW5jdGlvbiAoZWwsIGNscykge1xuICBpZiAoZWwuY2xhc3NMaXN0KSB7XG4gICAgZWwuY2xhc3NMaXN0LmFkZChjbHMpXG4gIH0gZWxzZSB7XG4gICAgdmFyIGN1ciA9ICcgJyArIChlbC5nZXRBdHRyaWJ1dGUoJ2NsYXNzJykgfHwgJycpICsgJyAnXG4gICAgaWYgKGN1ci5pbmRleE9mKCcgJyArIGNscyArICcgJykgPCAwKSB7XG4gICAgICBlbC5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgKGN1ciArIGNscykudHJpbSgpKVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFJlbW92ZSBjbGFzcyB3aXRoIGNvbXBhdGliaWxpdHkgZm9yIElFICYgU1ZHXG4gKlxuICogQHBhcmFtIHtFbGVtZW50fSBlbFxuICogQHBhcmFtIHtTdHJvbmd9IGNsc1xuICovXG5cbmV4cG9ydHMucmVtb3ZlQ2xhc3MgPSBmdW5jdGlvbiAoZWwsIGNscykge1xuICBpZiAoZWwuY2xhc3NMaXN0KSB7XG4gICAgZWwuY2xhc3NMaXN0LnJlbW92ZShjbHMpXG4gIH0gZWxzZSB7XG4gICAgdmFyIGN1ciA9ICcgJyArIChlbC5nZXRBdHRyaWJ1dGUoJ2NsYXNzJykgfHwgJycpICsgJyAnXG4gICAgdmFyIHRhciA9ICcgJyArIGNscyArICcgJ1xuICAgIHdoaWxlIChjdXIuaW5kZXhPZih0YXIpID49IDApIHtcbiAgICAgIGN1ciA9IGN1ci5yZXBsYWNlKHRhciwgJyAnKVxuICAgIH1cbiAgICBlbC5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgY3VyLnRyaW0oKSlcbiAgfVxufVxuXG4vKipcbiAqIEV4dHJhY3QgcmF3IGNvbnRlbnQgaW5zaWRlIGFuIGVsZW1lbnQgaW50byBhIHRlbXBvcmFyeVxuICogY29udGFpbmVyIGRpdlxuICpcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gYXNGcmFnbWVudFxuICogQHJldHVybiB7RWxlbWVudH1cbiAqL1xuXG5leHBvcnRzLmV4dHJhY3RDb250ZW50ID0gZnVuY3Rpb24gKGVsLCBhc0ZyYWdtZW50KSB7XG4gIHZhciBjaGlsZFxuICB2YXIgcmF3Q29udGVudFxuICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cbiAgaWYgKFxuICAgIGVsLnRhZ05hbWUgPT09ICdURU1QTEFURScgJiZcbiAgICBlbC5jb250ZW50IGluc3RhbmNlb2YgRG9jdW1lbnRGcmFnbWVudFxuICApIHtcbiAgICBlbCA9IGVsLmNvbnRlbnRcbiAgfVxuICBpZiAoZWwuaGFzQ2hpbGROb2RlcygpKSB7XG4gICAgcmF3Q29udGVudCA9IGFzRnJhZ21lbnRcbiAgICAgID8gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpXG4gICAgICA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgLyoganNoaW50IGJvc3M6dHJ1ZSAqL1xuICAgIHdoaWxlIChjaGlsZCA9IGVsLmZpcnN0Q2hpbGQpIHtcbiAgICAgIHJhd0NvbnRlbnQuYXBwZW5kQ2hpbGQoY2hpbGQpXG4gICAgfVxuICB9XG4gIHJldHVybiByYXdDb250ZW50XG59XG4iLCIvLyBjYW4gd2UgdXNlIF9fcHJvdG9fXz9cbmV4cG9ydHMuaGFzUHJvdG8gPSAnX19wcm90b19fJyBpbiB7fVxuXG4vLyBCcm93c2VyIGVudmlyb25tZW50IHNuaWZmaW5nXG52YXIgaW5Ccm93c2VyID0gZXhwb3J0cy5pbkJyb3dzZXIgPVxuICB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJlxuICBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwod2luZG93KSAhPT0gJ1tvYmplY3QgT2JqZWN0XSdcblxuZXhwb3J0cy5pc0lFOSA9XG4gIGluQnJvd3NlciAmJlxuICBuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkuaW5kZXhPZignbXNpZSA5LjAnKSA+IDBcblxuZXhwb3J0cy5pc0FuZHJvaWQgPVxuICBpbkJyb3dzZXIgJiZcbiAgbmF2aWdhdG9yLnVzZXJBZ2VudC50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJ2FuZHJvaWQnKSA+IDBcblxuLy8gVHJhbnNpdGlvbiBwcm9wZXJ0eS9ldmVudCBzbmlmZmluZ1xuaWYgKGluQnJvd3NlciAmJiAhZXhwb3J0cy5pc0lFOSkge1xuICB2YXIgaXNXZWJraXRUcmFucyA9XG4gICAgd2luZG93Lm9udHJhbnNpdGlvbmVuZCA9PT0gdW5kZWZpbmVkICYmXG4gICAgd2luZG93Lm9ud2Via2l0dHJhbnNpdGlvbmVuZCAhPT0gdW5kZWZpbmVkXG4gIHZhciBpc1dlYmtpdEFuaW0gPVxuICAgIHdpbmRvdy5vbmFuaW1hdGlvbmVuZCA9PT0gdW5kZWZpbmVkICYmXG4gICAgd2luZG93Lm9ud2Via2l0YW5pbWF0aW9uZW5kICE9PSB1bmRlZmluZWRcbiAgZXhwb3J0cy50cmFuc2l0aW9uUHJvcCA9IGlzV2Via2l0VHJhbnNcbiAgICA/ICdXZWJraXRUcmFuc2l0aW9uJ1xuICAgIDogJ3RyYW5zaXRpb24nXG4gIGV4cG9ydHMudHJhbnNpdGlvbkVuZEV2ZW50ID0gaXNXZWJraXRUcmFuc1xuICAgID8gJ3dlYmtpdFRyYW5zaXRpb25FbmQnXG4gICAgOiAndHJhbnNpdGlvbmVuZCdcbiAgZXhwb3J0cy5hbmltYXRpb25Qcm9wID0gaXNXZWJraXRBbmltXG4gICAgPyAnV2Via2l0QW5pbWF0aW9uJ1xuICAgIDogJ2FuaW1hdGlvbidcbiAgZXhwb3J0cy5hbmltYXRpb25FbmRFdmVudCA9IGlzV2Via2l0QW5pbVxuICAgID8gJ3dlYmtpdEFuaW1hdGlvbkVuZCdcbiAgICA6ICdhbmltYXRpb25lbmQnXG59XG5cbi8qKlxuICogRGVmZXIgYSB0YXNrIHRvIGV4ZWN1dGUgaXQgYXN5bmNocm9ub3VzbHkuIElkZWFsbHkgdGhpc1xuICogc2hvdWxkIGJlIGV4ZWN1dGVkIGFzIGEgbWljcm90YXNrLCBzbyB3ZSBsZXZlcmFnZVxuICogTXV0YXRpb25PYnNlcnZlciBpZiBpdCdzIGF2YWlsYWJsZSwgYW5kIGZhbGxiYWNrIHRvXG4gKiBzZXRUaW1lb3V0KDApLlxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNiXG4gKiBAcGFyYW0ge09iamVjdH0gY3R4XG4gKi9cblxuZXhwb3J0cy5uZXh0VGljayA9IChmdW5jdGlvbiAoKSB7XG4gIHZhciBjYWxsYmFja3MgPSBbXVxuICB2YXIgcGVuZGluZyA9IGZhbHNlXG4gIHZhciB0aW1lckZ1bmNcbiAgZnVuY3Rpb24gaGFuZGxlICgpIHtcbiAgICBwZW5kaW5nID0gZmFsc2VcbiAgICB2YXIgY29waWVzID0gY2FsbGJhY2tzLnNsaWNlKDApXG4gICAgY2FsbGJhY2tzID0gW11cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvcGllcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29waWVzW2ldKClcbiAgICB9XG4gIH1cbiAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gIGlmICh0eXBlb2YgTXV0YXRpb25PYnNlcnZlciAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICB2YXIgY291bnRlciA9IDFcbiAgICB2YXIgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihoYW5kbGUpXG4gICAgdmFyIHRleHROb2RlID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoY291bnRlcilcbiAgICBvYnNlcnZlci5vYnNlcnZlKHRleHROb2RlLCB7XG4gICAgICBjaGFyYWN0ZXJEYXRhOiB0cnVlXG4gICAgfSlcbiAgICB0aW1lckZ1bmMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBjb3VudGVyID0gKGNvdW50ZXIgKyAxKSAlIDJcbiAgICAgIHRleHROb2RlLmRhdGEgPSBjb3VudGVyXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRpbWVyRnVuYyA9IHNldFRpbWVvdXRcbiAgfVxuICByZXR1cm4gZnVuY3Rpb24gKGNiLCBjdHgpIHtcbiAgICB2YXIgZnVuYyA9IGN0eFxuICAgICAgPyBmdW5jdGlvbiAoKSB7IGNiLmNhbGwoY3R4KSB9XG4gICAgICA6IGNiXG4gICAgY2FsbGJhY2tzLnB1c2goZnVuYylcbiAgICBpZiAocGVuZGluZykgcmV0dXJuXG4gICAgcGVuZGluZyA9IHRydWVcbiAgICB0aW1lckZ1bmMoaGFuZGxlLCAwKVxuICB9XG59KSgpIiwidmFyIGxhbmcgICA9IHJlcXVpcmUoJy4vbGFuZycpXG52YXIgZXh0ZW5kID0gbGFuZy5leHRlbmRcblxuZXh0ZW5kKGV4cG9ydHMsIGxhbmcpXG5leHRlbmQoZXhwb3J0cywgcmVxdWlyZSgnLi9lbnYnKSlcbmV4dGVuZChleHBvcnRzLCByZXF1aXJlKCcuL2RvbScpKVxuZXh0ZW5kKGV4cG9ydHMsIHJlcXVpcmUoJy4vbWlzYycpKVxuZXh0ZW5kKGV4cG9ydHMsIHJlcXVpcmUoJy4vZGVidWcnKSlcbmV4dGVuZChleHBvcnRzLCByZXF1aXJlKCcuL29wdGlvbnMnKSkiLCIvKipcbiAqIENoZWNrIGlzIGEgc3RyaW5nIHN0YXJ0cyB3aXRoICQgb3IgX1xuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKi9cblxuZXhwb3J0cy5pc1Jlc2VydmVkID0gZnVuY3Rpb24gKHN0cikge1xuICB2YXIgYyA9IChzdHIgKyAnJykuY2hhckNvZGVBdCgwKVxuICByZXR1cm4gYyA9PT0gMHgyNCB8fCBjID09PSAweDVGXG59XG5cbi8qKlxuICogR3VhcmQgdGV4dCBvdXRwdXQsIG1ha2Ugc3VyZSB1bmRlZmluZWQgb3V0cHV0c1xuICogZW1wdHkgc3RyaW5nXG4gKlxuICogQHBhcmFtIHsqfSB2YWx1ZVxuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5cbmV4cG9ydHMudG9TdHJpbmcgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlID09IG51bGxcbiAgICA/ICcnXG4gICAgOiB2YWx1ZS50b1N0cmluZygpXG59XG5cbi8qKlxuICogQ2hlY2sgYW5kIGNvbnZlcnQgcG9zc2libGUgbnVtZXJpYyBudW1iZXJzIGJlZm9yZVxuICogc2V0dGluZyBiYWNrIHRvIGRhdGFcbiAqXG4gKiBAcGFyYW0geyp9IHZhbHVlXG4gKiBAcmV0dXJuIHsqfE51bWJlcn1cbiAqL1xuXG5leHBvcnRzLnRvTnVtYmVyID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIHJldHVybiAoXG4gICAgaXNOYU4odmFsdWUpIHx8XG4gICAgdmFsdWUgPT09IG51bGwgfHxcbiAgICB0eXBlb2YgdmFsdWUgPT09ICdib29sZWFuJ1xuICApID8gdmFsdWVcbiAgICA6IE51bWJlcih2YWx1ZSlcbn1cblxuLyoqXG4gKiBTdHJpcCBxdW90ZXMgZnJvbSBhIHN0cmluZ1xuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEByZXR1cm4ge1N0cmluZyB8IGZhbHNlfVxuICovXG5cbmV4cG9ydHMuc3RyaXBRdW90ZXMgPSBmdW5jdGlvbiAoc3RyKSB7XG4gIHZhciBhID0gc3RyLmNoYXJDb2RlQXQoMClcbiAgdmFyIGIgPSBzdHIuY2hhckNvZGVBdChzdHIubGVuZ3RoIC0gMSlcbiAgcmV0dXJuIGEgPT09IGIgJiYgKGEgPT09IDB4MjIgfHwgYSA9PT0gMHgyNylcbiAgICA/IHN0ci5zbGljZSgxLCAtMSlcbiAgICA6IGZhbHNlXG59XG5cbi8qKlxuICogUmVwbGFjZSBoZWxwZXJcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gXyAtIG1hdGNoZWQgZGVsaW1pdGVyXG4gKiBAcGFyYW0ge1N0cmluZ30gYyAtIG1hdGNoZWQgY2hhclxuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5mdW5jdGlvbiB0b1VwcGVyIChfLCBjKSB7XG4gIHJldHVybiBjID8gYy50b1VwcGVyQ2FzZSAoKSA6ICcnXG59XG5cbi8qKlxuICogQ2FtZWxpemUgYSBoeXBoZW4tZGVsbWl0ZWQgc3RyaW5nLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqL1xuXG52YXIgY2FtZWxSRSA9IC8tKFxcdykvZ1xuZXhwb3J0cy5jYW1lbGl6ZSA9IGZ1bmN0aW9uIChzdHIpIHtcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKGNhbWVsUkUsIHRvVXBwZXIpXG59XG5cbi8qKlxuICogQ29udmVydHMgaHlwaGVuL3VuZGVyc2NvcmUvc2xhc2ggZGVsaW1pdGVyZWQgbmFtZXMgaW50b1xuICogY2FtZWxpemVkIGNsYXNzTmFtZXMuXG4gKlxuICogZS5nLiBteS1jb21wb25lbnQgPT4gTXlDb21wb25lbnRcbiAqICAgICAgc29tZV9lbHNlICAgID0+IFNvbWVFbHNlXG4gKiAgICAgIHNvbWUvY29tcCAgICA9PiBTb21lQ29tcFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqL1xuXG52YXIgY2xhc3NpZnlSRSA9IC8oPzpefFstX1xcL10pKFxcdykvZ1xuZXhwb3J0cy5jbGFzc2lmeSA9IGZ1bmN0aW9uIChzdHIpIHtcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKGNsYXNzaWZ5UkUsIHRvVXBwZXIpXG59XG5cbi8qKlxuICogU2ltcGxlIGJpbmQsIGZhc3RlciB0aGFuIG5hdGl2ZVxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcGFyYW0ge09iamVjdH0gY3R4XG4gKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAqL1xuXG5leHBvcnRzLmJpbmQgPSBmdW5jdGlvbiAoZm4sIGN0eCkge1xuICByZXR1cm4gZnVuY3Rpb24gKGEpIHtcbiAgICB2YXIgbCA9IGFyZ3VtZW50cy5sZW5ndGhcbiAgICByZXR1cm4gbFxuICAgICAgPyBsID4gMVxuICAgICAgICA/IGZuLmFwcGx5KGN0eCwgYXJndW1lbnRzKVxuICAgICAgICA6IGZuLmNhbGwoY3R4LCBhKVxuICAgICAgOiBmbi5jYWxsKGN0eClcbiAgfVxufVxuXG4vKipcbiAqIENvbnZlcnQgYW4gQXJyYXktbGlrZSBvYmplY3QgdG8gYSByZWFsIEFycmF5LlxuICpcbiAqIEBwYXJhbSB7QXJyYXktbGlrZX0gbGlzdFxuICogQHBhcmFtIHtOdW1iZXJ9IFtzdGFydF0gLSBzdGFydCBpbmRleFxuICogQHJldHVybiB7QXJyYXl9XG4gKi9cblxuZXhwb3J0cy50b0FycmF5ID0gZnVuY3Rpb24gKGxpc3QsIHN0YXJ0KSB7XG4gIHN0YXJ0ID0gc3RhcnQgfHwgMFxuICB2YXIgaSA9IGxpc3QubGVuZ3RoIC0gc3RhcnRcbiAgdmFyIHJldCA9IG5ldyBBcnJheShpKVxuICB3aGlsZSAoaS0tKSB7XG4gICAgcmV0W2ldID0gbGlzdFtpICsgc3RhcnRdXG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG4vKipcbiAqIE1peCBwcm9wZXJ0aWVzIGludG8gdGFyZ2V0IG9iamVjdC5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gdG9cbiAqIEBwYXJhbSB7T2JqZWN0fSBmcm9tXG4gKi9cblxuZXhwb3J0cy5leHRlbmQgPSBmdW5jdGlvbiAodG8sIGZyb20pIHtcbiAgZm9yICh2YXIga2V5IGluIGZyb20pIHtcbiAgICB0b1trZXldID0gZnJvbVtrZXldXG4gIH1cbiAgcmV0dXJuIHRvXG59XG5cbi8qKlxuICogUXVpY2sgb2JqZWN0IGNoZWNrIC0gdGhpcyBpcyBwcmltYXJpbHkgdXNlZCB0byB0ZWxsXG4gKiBPYmplY3RzIGZyb20gcHJpbWl0aXZlIHZhbHVlcyB3aGVuIHdlIGtub3cgdGhlIHZhbHVlXG4gKiBpcyBhIEpTT04tY29tcGxpYW50IHR5cGUuXG4gKlxuICogQHBhcmFtIHsqfSBvYmpcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKi9cblxuZXhwb3J0cy5pc09iamVjdCA9IGZ1bmN0aW9uIChvYmopIHtcbiAgcmV0dXJuIG9iaiAmJiB0eXBlb2Ygb2JqID09PSAnb2JqZWN0J1xufVxuXG4vKipcbiAqIFN0cmljdCBvYmplY3QgdHlwZSBjaGVjay4gT25seSByZXR1cm5zIHRydWVcbiAqIGZvciBwbGFpbiBKYXZhU2NyaXB0IG9iamVjdHMuXG4gKlxuICogQHBhcmFtIHsqfSBvYmpcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKi9cblxudmFyIHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZ1xuZXhwb3J0cy5pc1BsYWluT2JqZWN0ID0gZnVuY3Rpb24gKG9iaikge1xuICByZXR1cm4gdG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBPYmplY3RdJ1xufVxuXG4vKipcbiAqIEFycmF5IHR5cGUgY2hlY2suXG4gKlxuICogQHBhcmFtIHsqfSBvYmpcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKi9cblxuZXhwb3J0cy5pc0FycmF5ID0gZnVuY3Rpb24gKG9iaikge1xuICByZXR1cm4gQXJyYXkuaXNBcnJheShvYmopXG59XG5cbi8qKlxuICogRGVmaW5lIGEgbm9uLWVudW1lcmFibGUgcHJvcGVydHlcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKiBAcGFyYW0ge1N0cmluZ30ga2V5XG4gKiBAcGFyYW0geyp9IHZhbFxuICogQHBhcmFtIHtCb29sZWFufSBbZW51bWVyYWJsZV1cbiAqL1xuXG5leHBvcnRzLmRlZmluZSA9IGZ1bmN0aW9uIChvYmosIGtleSwgdmFsLCBlbnVtZXJhYmxlKSB7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmosIGtleSwge1xuICAgIHZhbHVlICAgICAgICA6IHZhbCxcbiAgICBlbnVtZXJhYmxlICAgOiAhIWVudW1lcmFibGUsXG4gICAgd3JpdGFibGUgICAgIDogdHJ1ZSxcbiAgICBjb25maWd1cmFibGUgOiB0cnVlXG4gIH0pXG59XG5cbi8qKlxuICogRGVib3VuY2UgYSBmdW5jdGlvbiBzbyBpdCBvbmx5IGdldHMgY2FsbGVkIGFmdGVyIHRoZVxuICogaW5wdXQgc3RvcHMgYXJyaXZpbmcgYWZ0ZXIgdGhlIGdpdmVuIHdhaXQgcGVyaW9kLlxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmNcbiAqIEBwYXJhbSB7TnVtYmVyfSB3YWl0XG4gKiBAcmV0dXJuIHtGdW5jdGlvbn0gLSB0aGUgZGVib3VuY2VkIGZ1bmN0aW9uXG4gKi9cblxuZXhwb3J0cy5kZWJvdW5jZSA9IGZ1bmN0aW9uKGZ1bmMsIHdhaXQpIHtcbiAgdmFyIHRpbWVvdXQsIGFyZ3MsIGNvbnRleHQsIHRpbWVzdGFtcCwgcmVzdWx0XG4gIHZhciBsYXRlciA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBsYXN0ID0gRGF0ZS5ub3coKSAtIHRpbWVzdGFtcFxuICAgIGlmIChsYXN0IDwgd2FpdCAmJiBsYXN0ID49IDApIHtcbiAgICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGxhdGVyLCB3YWl0IC0gbGFzdClcbiAgICB9IGVsc2Uge1xuICAgICAgdGltZW91dCA9IG51bGxcbiAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncylcbiAgICAgIGlmICghdGltZW91dCkgY29udGV4dCA9IGFyZ3MgPSBudWxsXG4gICAgfVxuICB9XG4gIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICBjb250ZXh0ID0gdGhpc1xuICAgIGFyZ3MgPSBhcmd1bWVudHNcbiAgICB0aW1lc3RhbXAgPSBEYXRlLm5vdygpXG4gICAgaWYgKCF0aW1lb3V0KSB7XG4gICAgICB0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgd2FpdClcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG59XG5cbi8qKlxuICogTWFudWFsIGluZGV4T2YgYmVjYXVzZSBpdCdzIHNsaWdodGx5IGZhc3RlciB0aGFuXG4gKiBuYXRpdmUuXG4gKlxuICogQHBhcmFtIHtBcnJheX0gYXJyXG4gKiBAcGFyYW0geyp9IG9ialxuICovXG5cbmV4cG9ydHMuaW5kZXhPZiA9IGZ1bmN0aW9uIChhcnIsIG9iaikge1xuICBmb3IgKHZhciBpID0gMCwgbCA9IGFyci5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBpZiAoYXJyW2ldID09PSBvYmopIHJldHVybiBpXG4gIH1cbiAgcmV0dXJuIC0xXG59XG5cbi8qKlxuICogTWFrZSBhIGNhbmNlbGxhYmxlIHZlcnNpb24gb2YgYW4gYXN5bmMgY2FsbGJhY2suXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICovXG5cbmV4cG9ydHMuY2FuY2VsbGFibGUgPSBmdW5jdGlvbiAoZm4pIHtcbiAgdmFyIGNiID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICghY2IuY2FuY2VsbGVkKSB7XG4gICAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICAgIH1cbiAgfVxuICBjYi5jYW5jZWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgY2IuY2FuY2VsbGVkID0gdHJ1ZVxuICB9XG4gIHJldHVybiBjYlxufSIsInZhciBfID0gcmVxdWlyZSgnLi9pbmRleCcpXG52YXIgY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlnJylcbnZhciBjb21tb25UYWdSRSA9IC9eKGRpdnxwfHNwYW58aW1nfGF8YnJ8dWx8b2x8bGl8aDF8aDJ8aDN8aDR8aDV8dGFibGV8dGJvZHl8dHJ8dGR8cHJlKSQvXG5cbi8qKlxuICogQ2hlY2sgaWYgYW4gZWxlbWVudCBpcyBhIGNvbXBvbmVudCwgaWYgeWVzIHJldHVybiBpdHNcbiAqIGNvbXBvbmVudCBpZC5cbiAqXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGVsXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICogQHJldHVybiB7U3RyaW5nfHVuZGVmaW5lZH1cbiAqL1xuXG5leHBvcnRzLmNoZWNrQ29tcG9uZW50ID0gZnVuY3Rpb24gKGVsLCBvcHRpb25zKSB7XG4gIHZhciB0YWcgPSBlbC50YWdOYW1lLnRvTG93ZXJDYXNlKClcbiAgaWYgKHRhZyA9PT0gJ2NvbXBvbmVudCcpIHtcbiAgICAvLyBkeW5hbWljIHN5bnRheFxuICAgIHZhciBleHAgPSBlbC5nZXRBdHRyaWJ1dGUoJ2lzJylcbiAgICBlbC5yZW1vdmVBdHRyaWJ1dGUoJ2lzJylcbiAgICByZXR1cm4gZXhwXG4gIH0gZWxzZSBpZiAoXG4gICAgIWNvbW1vblRhZ1JFLnRlc3QodGFnKSAmJlxuICAgIF8ucmVzb2x2ZUFzc2V0KG9wdGlvbnMsICdjb21wb25lbnRzJywgdGFnKVxuICApIHtcbiAgICByZXR1cm4gdGFnXG4gIH1cbn1cblxuLyoqXG4gKiBDcmVhdGUgYW4gXCJhbmNob3JcIiBmb3IgcGVyZm9ybWluZyBkb20gaW5zZXJ0aW9uL3JlbW92YWxzLlxuICogVGhpcyBpcyB1c2VkIGluIGEgbnVtYmVyIG9mIHNjZW5hcmlvczpcbiAqIC0gYmxvY2sgaW5zdGFuY2VcbiAqIC0gdi1odG1sXG4gKiAtIHYtaWZcbiAqIC0gY29tcG9uZW50XG4gKiAtIHJlcGVhdFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBjb250ZW50XG4gKiBAcGFyYW0ge0Jvb2xlYW59IHBlcnNpc3QgLSBJRSB0cmFzaGVzIGVtcHR5IHRleHROb2RlcyBvblxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmVOb2RlKHRydWUpLCBzbyBpbiBjZXJ0YWluXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlcyB0aGUgYW5jaG9yIG5lZWRzIHRvIGJlXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub24tZW1wdHkgdG8gYmUgcGVyc2lzdGVkIGluXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZXMuXG4gKiBAcmV0dXJuIHtDb21tZW50fFRleHR9XG4gKi9cblxuZXhwb3J0cy5jcmVhdGVBbmNob3IgPSBmdW5jdGlvbiAoY29udGVudCwgcGVyc2lzdCkge1xuICByZXR1cm4gY29uZmlnLmRlYnVnXG4gICAgPyBkb2N1bWVudC5jcmVhdGVDb21tZW50KGNvbnRlbnQpXG4gICAgOiBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShwZXJzaXN0ID8gJyAnIDogJycpXG59IiwidmFyIF8gPSByZXF1aXJlKCcuL2luZGV4JylcbnZhciBleHRlbmQgPSBfLmV4dGVuZFxuXG4vKipcbiAqIE9wdGlvbiBvdmVyd3JpdGluZyBzdHJhdGVnaWVzIGFyZSBmdW5jdGlvbnMgdGhhdCBoYW5kbGVcbiAqIGhvdyB0byBtZXJnZSBhIHBhcmVudCBvcHRpb24gdmFsdWUgYW5kIGEgY2hpbGQgb3B0aW9uXG4gKiB2YWx1ZSBpbnRvIHRoZSBmaW5hbCB2YWx1ZS5cbiAqXG4gKiBBbGwgc3RyYXRlZ3kgZnVuY3Rpb25zIGZvbGxvdyB0aGUgc2FtZSBzaWduYXR1cmU6XG4gKlxuICogQHBhcmFtIHsqfSBwYXJlbnRWYWxcbiAqIEBwYXJhbSB7Kn0gY2hpbGRWYWxcbiAqIEBwYXJhbSB7VnVlfSBbdm1dXG4gKi9cblxudmFyIHN0cmF0cyA9IE9iamVjdC5jcmVhdGUobnVsbClcblxuLyoqXG4gKiBIZWxwZXIgdGhhdCByZWN1cnNpdmVseSBtZXJnZXMgdHdvIGRhdGEgb2JqZWN0cyB0b2dldGhlci5cbiAqL1xuXG5mdW5jdGlvbiBtZXJnZURhdGEgKHRvLCBmcm9tKSB7XG4gIHZhciBrZXksIHRvVmFsLCBmcm9tVmFsXG4gIGZvciAoa2V5IGluIGZyb20pIHtcbiAgICB0b1ZhbCA9IHRvW2tleV1cbiAgICBmcm9tVmFsID0gZnJvbVtrZXldXG4gICAgaWYgKCF0by5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICB0by4kYWRkKGtleSwgZnJvbVZhbClcbiAgICB9IGVsc2UgaWYgKF8uaXNPYmplY3QodG9WYWwpICYmIF8uaXNPYmplY3QoZnJvbVZhbCkpIHtcbiAgICAgIG1lcmdlRGF0YSh0b1ZhbCwgZnJvbVZhbClcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRvXG59XG5cbi8qKlxuICogRGF0YVxuICovXG5cbnN0cmF0cy5kYXRhID0gZnVuY3Rpb24gKHBhcmVudFZhbCwgY2hpbGRWYWwsIHZtKSB7XG4gIGlmICghdm0pIHtcbiAgICAvLyBpbiBhIFZ1ZS5leHRlbmQgbWVyZ2UsIGJvdGggc2hvdWxkIGJlIGZ1bmN0aW9uc1xuICAgIGlmICghY2hpbGRWYWwpIHtcbiAgICAgIHJldHVybiBwYXJlbnRWYWxcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBjaGlsZFZhbCAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgXy53YXJuKFxuICAgICAgICAnVGhlIFwiZGF0YVwiIG9wdGlvbiBzaG91bGQgYmUgYSBmdW5jdGlvbiAnICtcbiAgICAgICAgJ3RoYXQgcmV0dXJucyBhIHBlci1pbnN0YW5jZSB2YWx1ZSBpbiBjb21wb25lbnQgJyArXG4gICAgICAgICdkZWZpbml0aW9ucy4nXG4gICAgICApXG4gICAgICByZXR1cm4gcGFyZW50VmFsXG4gICAgfVxuICAgIGlmICghcGFyZW50VmFsKSB7XG4gICAgICByZXR1cm4gY2hpbGRWYWxcbiAgICB9XG4gICAgLy8gd2hlbiBwYXJlbnRWYWwgJiBjaGlsZFZhbCBhcmUgYm90aCBwcmVzZW50LFxuICAgIC8vIHdlIG5lZWQgdG8gcmV0dXJuIGEgZnVuY3Rpb24gdGhhdCByZXR1cm5zIHRoZVxuICAgIC8vIG1lcmdlZCByZXN1bHQgb2YgYm90aCBmdW5jdGlvbnMuLi4gbm8gbmVlZCB0b1xuICAgIC8vIGNoZWNrIGlmIHBhcmVudFZhbCBpcyBhIGZ1bmN0aW9uIGhlcmUgYmVjYXVzZVxuICAgIC8vIGl0IGhhcyB0byBiZSBhIGZ1bmN0aW9uIHRvIHBhc3MgcHJldmlvdXMgbWVyZ2VzLlxuICAgIHJldHVybiBmdW5jdGlvbiBtZXJnZWREYXRhRm4gKCkge1xuICAgICAgcmV0dXJuIG1lcmdlRGF0YShcbiAgICAgICAgY2hpbGRWYWwuY2FsbCh0aGlzKSxcbiAgICAgICAgcGFyZW50VmFsLmNhbGwodGhpcylcbiAgICAgIClcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgLy8gaW5zdGFuY2UgbWVyZ2UsIHJldHVybiByYXcgb2JqZWN0XG4gICAgdmFyIGluc3RhbmNlRGF0YSA9IHR5cGVvZiBjaGlsZFZhbCA9PT0gJ2Z1bmN0aW9uJ1xuICAgICAgPyBjaGlsZFZhbC5jYWxsKHZtKVxuICAgICAgOiBjaGlsZFZhbFxuICAgIHZhciBkZWZhdWx0RGF0YSA9IHR5cGVvZiBwYXJlbnRWYWwgPT09ICdmdW5jdGlvbidcbiAgICAgID8gcGFyZW50VmFsLmNhbGwodm0pXG4gICAgICA6IHVuZGVmaW5lZFxuICAgIGlmIChpbnN0YW5jZURhdGEpIHtcbiAgICAgIHJldHVybiBtZXJnZURhdGEoaW5zdGFuY2VEYXRhLCBkZWZhdWx0RGF0YSlcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGRlZmF1bHREYXRhXG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogRWxcbiAqL1xuXG5zdHJhdHMuZWwgPSBmdW5jdGlvbiAocGFyZW50VmFsLCBjaGlsZFZhbCwgdm0pIHtcbiAgaWYgKCF2bSAmJiBjaGlsZFZhbCAmJiB0eXBlb2YgY2hpbGRWYWwgIT09ICdmdW5jdGlvbicpIHtcbiAgICBfLndhcm4oXG4gICAgICAnVGhlIFwiZWxcIiBvcHRpb24gc2hvdWxkIGJlIGEgZnVuY3Rpb24gJyArXG4gICAgICAndGhhdCByZXR1cm5zIGEgcGVyLWluc3RhbmNlIHZhbHVlIGluIGNvbXBvbmVudCAnICtcbiAgICAgICdkZWZpbml0aW9ucy4nXG4gICAgKVxuICAgIHJldHVyblxuICB9XG4gIHZhciByZXQgPSBjaGlsZFZhbCB8fCBwYXJlbnRWYWxcbiAgLy8gaW52b2tlIHRoZSBlbGVtZW50IGZhY3RvcnkgaWYgdGhpcyBpcyBpbnN0YW5jZSBtZXJnZVxuICByZXR1cm4gdm0gJiYgdHlwZW9mIHJldCA9PT0gJ2Z1bmN0aW9uJ1xuICAgID8gcmV0LmNhbGwodm0pXG4gICAgOiByZXRcbn1cblxuLyoqXG4gKiBIb29rcyBhbmQgcGFyYW0gYXR0cmlidXRlcyBhcmUgbWVyZ2VkIGFzIGFycmF5cy5cbiAqL1xuXG5zdHJhdHMuY3JlYXRlZCA9XG5zdHJhdHMucmVhZHkgPVxuc3RyYXRzLmF0dGFjaGVkID1cbnN0cmF0cy5kZXRhY2hlZCA9XG5zdHJhdHMuYmVmb3JlQ29tcGlsZSA9XG5zdHJhdHMuY29tcGlsZWQgPVxuc3RyYXRzLmJlZm9yZURlc3Ryb3kgPVxuc3RyYXRzLmRlc3Ryb3llZCA9XG5zdHJhdHMucHJvcHMgPSBmdW5jdGlvbiAocGFyZW50VmFsLCBjaGlsZFZhbCkge1xuICByZXR1cm4gY2hpbGRWYWxcbiAgICA/IHBhcmVudFZhbFxuICAgICAgPyBwYXJlbnRWYWwuY29uY2F0KGNoaWxkVmFsKVxuICAgICAgOiBfLmlzQXJyYXkoY2hpbGRWYWwpXG4gICAgICAgID8gY2hpbGRWYWxcbiAgICAgICAgOiBbY2hpbGRWYWxdXG4gICAgOiBwYXJlbnRWYWxcbn1cblxuLyoqXG4gKiAwLjExIGRlcHJlY2F0aW9uIHdhcm5pbmdcbiAqL1xuXG5zdHJhdHMucGFyYW1BdHRyaWJ1dGVzID0gZnVuY3Rpb24gKCkge1xuICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICBfLndhcm4oXG4gICAgJ1wicGFyYW1BdHRyaWJ1dGVzXCIgb3B0aW9uIGhhcyBiZWVuIGRlcHJlY2F0ZWQgaW4gMC4xMi4gJyArXG4gICAgJ1VzZSBcInByb3BzXCIgaW5zdGVhZC4nXG4gIClcbn1cblxuLyoqXG4gKiBBc3NldHNcbiAqXG4gKiBXaGVuIGEgdm0gaXMgcHJlc2VudCAoaW5zdGFuY2UgY3JlYXRpb24pLCB3ZSBuZWVkIHRvIGRvXG4gKiBhIHRocmVlLXdheSBtZXJnZSBiZXR3ZWVuIGNvbnN0cnVjdG9yIG9wdGlvbnMsIGluc3RhbmNlXG4gKiBvcHRpb25zIGFuZCBwYXJlbnQgb3B0aW9ucy5cbiAqL1xuXG5zdHJhdHMuZGlyZWN0aXZlcyA9XG5zdHJhdHMuZmlsdGVycyA9XG5zdHJhdHMudHJhbnNpdGlvbnMgPVxuc3RyYXRzLmNvbXBvbmVudHMgPVxuc3RyYXRzLmVsZW1lbnREaXJlY3RpdmVzID0gZnVuY3Rpb24gKHBhcmVudFZhbCwgY2hpbGRWYWwpIHtcbiAgdmFyIHJlcyA9IE9iamVjdC5jcmVhdGUocGFyZW50VmFsKVxuICByZXR1cm4gY2hpbGRWYWxcbiAgICA/IGV4dGVuZChyZXMsIGNoaWxkVmFsKVxuICAgIDogcmVzXG59XG5cbi8qKlxuICogRXZlbnRzICYgV2F0Y2hlcnMuXG4gKlxuICogRXZlbnRzICYgd2F0Y2hlcnMgaGFzaGVzIHNob3VsZCBub3Qgb3ZlcndyaXRlIG9uZVxuICogYW5vdGhlciwgc28gd2UgbWVyZ2UgdGhlbSBhcyBhcnJheXMuXG4gKi9cblxuc3RyYXRzLndhdGNoID1cbnN0cmF0cy5ldmVudHMgPSBmdW5jdGlvbiAocGFyZW50VmFsLCBjaGlsZFZhbCkge1xuICBpZiAoIWNoaWxkVmFsKSByZXR1cm4gcGFyZW50VmFsXG4gIGlmICghcGFyZW50VmFsKSByZXR1cm4gY2hpbGRWYWxcbiAgdmFyIHJldCA9IHt9XG4gIGV4dGVuZChyZXQsIHBhcmVudFZhbClcbiAgZm9yICh2YXIga2V5IGluIGNoaWxkVmFsKSB7XG4gICAgdmFyIHBhcmVudCA9IHJldFtrZXldXG4gICAgdmFyIGNoaWxkID0gY2hpbGRWYWxba2V5XVxuICAgIGlmIChwYXJlbnQgJiYgIV8uaXNBcnJheShwYXJlbnQpKSB7XG4gICAgICBwYXJlbnQgPSBbcGFyZW50XVxuICAgIH1cbiAgICByZXRba2V5XSA9IHBhcmVudFxuICAgICAgPyBwYXJlbnQuY29uY2F0KGNoaWxkKVxuICAgICAgOiBbY2hpbGRdXG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG4vKipcbiAqIE90aGVyIG9iamVjdCBoYXNoZXMuXG4gKi9cblxuc3RyYXRzLm1ldGhvZHMgPVxuc3RyYXRzLmNvbXB1dGVkID0gZnVuY3Rpb24gKHBhcmVudFZhbCwgY2hpbGRWYWwpIHtcbiAgaWYgKCFjaGlsZFZhbCkgcmV0dXJuIHBhcmVudFZhbFxuICBpZiAoIXBhcmVudFZhbCkgcmV0dXJuIGNoaWxkVmFsXG4gIHZhciByZXQgPSBPYmplY3QuY3JlYXRlKHBhcmVudFZhbClcbiAgZXh0ZW5kKHJldCwgY2hpbGRWYWwpXG4gIHJldHVybiByZXRcbn1cblxuLyoqXG4gKiBEZWZhdWx0IHN0cmF0ZWd5LlxuICovXG5cbnZhciBkZWZhdWx0U3RyYXQgPSBmdW5jdGlvbiAocGFyZW50VmFsLCBjaGlsZFZhbCkge1xuICByZXR1cm4gY2hpbGRWYWwgPT09IHVuZGVmaW5lZFxuICAgID8gcGFyZW50VmFsXG4gICAgOiBjaGlsZFZhbFxufVxuXG4vKipcbiAqIE1ha2Ugc3VyZSBjb21wb25lbnQgb3B0aW9ucyBnZXQgY29udmVydGVkIHRvIGFjdHVhbFxuICogY29uc3RydWN0b3JzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBjb21wb25lbnRzXG4gKi9cblxuZnVuY3Rpb24gZ3VhcmRDb21wb25lbnRzIChjb21wb25lbnRzKSB7XG4gIGlmIChjb21wb25lbnRzKSB7XG4gICAgdmFyIGRlZlxuICAgIGZvciAodmFyIGtleSBpbiBjb21wb25lbnRzKSB7XG4gICAgICBkZWYgPSBjb21wb25lbnRzW2tleV1cbiAgICAgIGlmIChfLmlzUGxhaW5PYmplY3QoZGVmKSkge1xuICAgICAgICBkZWYubmFtZSA9IGtleVxuICAgICAgICBjb21wb25lbnRzW2tleV0gPSBfLlZ1ZS5leHRlbmQoZGVmKVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIE1lcmdlIHR3byBvcHRpb24gb2JqZWN0cyBpbnRvIGEgbmV3IG9uZS5cbiAqIENvcmUgdXRpbGl0eSB1c2VkIGluIGJvdGggaW5zdGFudGlhdGlvbiBhbmQgaW5oZXJpdGFuY2UuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHBhcmVudFxuICogQHBhcmFtIHtPYmplY3R9IGNoaWxkXG4gKiBAcGFyYW0ge1Z1ZX0gW3ZtXSAtIGlmIHZtIGlzIHByZXNlbnQsIGluZGljYXRlcyB0aGlzIGlzXG4gKiAgICAgICAgICAgICAgICAgICAgIGFuIGluc3RhbnRpYXRpb24gbWVyZ2UuXG4gKi9cblxuZXhwb3J0cy5tZXJnZU9wdGlvbnMgPSBmdW5jdGlvbiBtZXJnZSAocGFyZW50LCBjaGlsZCwgdm0pIHtcbiAgZ3VhcmRDb21wb25lbnRzKGNoaWxkLmNvbXBvbmVudHMpXG4gIHZhciBvcHRpb25zID0ge31cbiAgdmFyIGtleVxuICBpZiAoY2hpbGQubWl4aW5zKSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBjaGlsZC5taXhpbnMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICBwYXJlbnQgPSBtZXJnZShwYXJlbnQsIGNoaWxkLm1peGluc1tpXSwgdm0pXG4gICAgfVxuICB9XG4gIGZvciAoa2V5IGluIHBhcmVudCkge1xuICAgIG1lcmdlRmllbGQoa2V5KVxuICB9XG4gIGZvciAoa2V5IGluIGNoaWxkKSB7XG4gICAgaWYgKCEocGFyZW50Lmhhc093blByb3BlcnR5KGtleSkpKSB7XG4gICAgICBtZXJnZUZpZWxkKGtleSlcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gbWVyZ2VGaWVsZCAoa2V5KSB7XG4gICAgdmFyIHN0cmF0ID0gc3RyYXRzW2tleV0gfHwgZGVmYXVsdFN0cmF0XG4gICAgb3B0aW9uc1trZXldID0gc3RyYXQocGFyZW50W2tleV0sIGNoaWxkW2tleV0sIHZtLCBrZXkpXG4gIH1cbiAgcmV0dXJuIG9wdGlvbnNcbn1cblxuLyoqXG4gKiBSZXNvbHZlIGFuIGFzc2V0LlxuICogVGhpcyBmdW5jdGlvbiBpcyB1c2VkIGJlY2F1c2UgY2hpbGQgaW5zdGFuY2VzIG5lZWQgYWNjZXNzXG4gKiB0byBhc3NldHMgZGVmaW5lZCBpbiBpdHMgYW5jZXN0b3IgY2hhaW4uXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlXG4gKiBAcGFyYW0ge1N0cmluZ30gaWRcbiAqIEByZXR1cm4ge09iamVjdHxGdW5jdGlvbn1cbiAqL1xuXG5leHBvcnRzLnJlc29sdmVBc3NldCA9IGZ1bmN0aW9uIHJlc29sdmUgKG9wdGlvbnMsIHR5cGUsIGlkKSB7XG4gIHZhciBhc3NldCA9IG9wdGlvbnNbdHlwZV1baWRdXG4gIHdoaWxlICghYXNzZXQgJiYgb3B0aW9ucy5fcGFyZW50KSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMuX3BhcmVudC4kb3B0aW9uc1xuICAgIGFzc2V0ID0gb3B0aW9uc1t0eXBlXVtpZF1cbiAgfVxuICByZXR1cm4gYXNzZXRcbn0iLCJ2YXIgXyA9IHJlcXVpcmUoJy4vdXRpbCcpXG52YXIgZXh0ZW5kID0gXy5leHRlbmRcblxuLyoqXG4gKiBUaGUgZXhwb3NlZCBWdWUgY29uc3RydWN0b3IuXG4gKlxuICogQVBJIGNvbnZlbnRpb25zOlxuICogLSBwdWJsaWMgQVBJIG1ldGhvZHMvcHJvcGVydGllcyBhcmUgcHJlZmlleGVkIHdpdGggYCRgXG4gKiAtIGludGVybmFsIG1ldGhvZHMvcHJvcGVydGllcyBhcmUgcHJlZml4ZWQgd2l0aCBgX2BcbiAqIC0gbm9uLXByZWZpeGVkIHByb3BlcnRpZXMgYXJlIGFzc3VtZWQgdG8gYmUgcHJveGllZCB1c2VyXG4gKiAgIGRhdGEuXG4gKlxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdXG4gKiBAcHVibGljXG4gKi9cblxuZnVuY3Rpb24gVnVlIChvcHRpb25zKSB7XG4gIHRoaXMuX2luaXQob3B0aW9ucylcbn1cblxuLyoqXG4gKiBNaXhpbiBnbG9iYWwgQVBJXG4gKi9cblxuZXh0ZW5kKFZ1ZSwgcmVxdWlyZSgnLi9hcGkvZ2xvYmFsJykpXG5cbi8qKlxuICogVnVlIGFuZCBldmVyeSBjb25zdHJ1Y3RvciB0aGF0IGV4dGVuZHMgVnVlIGhhcyBhblxuICogYXNzb2NpYXRlZCBvcHRpb25zIG9iamVjdCwgd2hpY2ggY2FuIGJlIGFjY2Vzc2VkIGR1cmluZ1xuICogY29tcGlsYXRpb24gc3RlcHMgYXMgYHRoaXMuY29uc3RydWN0b3Iub3B0aW9uc2AuXG4gKlxuICogVGhlc2UgY2FuIGJlIHNlZW4gYXMgdGhlIGRlZmF1bHQgb3B0aW9ucyBvZiBldmVyeVxuICogVnVlIGluc3RhbmNlLlxuICovXG5cblZ1ZS5vcHRpb25zID0ge1xuICBkaXJlY3RpdmVzICA6IHJlcXVpcmUoJy4vZGlyZWN0aXZlcycpLFxuICBmaWx0ZXJzICAgICA6IHJlcXVpcmUoJy4vZmlsdGVycycpLFxuICB0cmFuc2l0aW9ucyA6IHt9LFxuICBjb21wb25lbnRzICA6IHt9LFxuICBlbGVtZW50RGlyZWN0aXZlczoge31cbn1cblxuLyoqXG4gKiBCdWlsZCB1cCB0aGUgcHJvdG90eXBlXG4gKi9cblxudmFyIHAgPSBWdWUucHJvdG90eXBlXG5cbi8qKlxuICogJGRhdGEgaGFzIGEgc2V0dGVyIHdoaWNoIGRvZXMgYSBidW5jaCBvZlxuICogdGVhcmRvd24vc2V0dXAgd29ya1xuICovXG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShwLCAnJGRhdGEnLCB7XG4gIGdldDogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLl9kYXRhXG4gIH0sXG4gIHNldDogZnVuY3Rpb24gKG5ld0RhdGEpIHtcbiAgICBpZiAobmV3RGF0YSAhPT0gdGhpcy5fZGF0YSkge1xuICAgICAgdGhpcy5fc2V0RGF0YShuZXdEYXRhKVxuICAgIH1cbiAgfVxufSlcblxuLyoqXG4gKiBNaXhpbiBpbnRlcm5hbCBpbnN0YW5jZSBtZXRob2RzXG4gKi9cblxuZXh0ZW5kKHAsIHJlcXVpcmUoJy4vaW5zdGFuY2UvaW5pdCcpKVxuZXh0ZW5kKHAsIHJlcXVpcmUoJy4vaW5zdGFuY2UvZXZlbnRzJykpXG5leHRlbmQocCwgcmVxdWlyZSgnLi9pbnN0YW5jZS9zY29wZScpKVxuZXh0ZW5kKHAsIHJlcXVpcmUoJy4vaW5zdGFuY2UvY29tcGlsZScpKVxuZXh0ZW5kKHAsIHJlcXVpcmUoJy4vaW5zdGFuY2UvbWlzYycpKVxuXG4vKipcbiAqIE1peGluIHB1YmxpYyBBUEkgbWV0aG9kc1xuICovXG5cbmV4dGVuZChwLCByZXF1aXJlKCcuL2FwaS9kYXRhJykpXG5leHRlbmQocCwgcmVxdWlyZSgnLi9hcGkvZG9tJykpXG5leHRlbmQocCwgcmVxdWlyZSgnLi9hcGkvZXZlbnRzJykpXG5leHRlbmQocCwgcmVxdWlyZSgnLi9hcGkvY2hpbGQnKSlcbmV4dGVuZChwLCByZXF1aXJlKCcuL2FwaS9saWZlY3ljbGUnKSlcblxubW9kdWxlLmV4cG9ydHMgPSBfLlZ1ZSA9IFZ1ZSIsInZhciBfID0gcmVxdWlyZSgnLi91dGlsJylcbnZhciBjb25maWcgPSByZXF1aXJlKCcuL2NvbmZpZycpXG52YXIgT2JzZXJ2ZXIgPSByZXF1aXJlKCcuL29ic2VydmVyJylcbnZhciBleHBQYXJzZXIgPSByZXF1aXJlKCcuL3BhcnNlcnMvZXhwcmVzc2lvbicpXG52YXIgYmF0Y2hlciA9IHJlcXVpcmUoJy4vYmF0Y2hlcicpXG52YXIgdWlkID0gMFxuXG4vKipcbiAqIEEgd2F0Y2hlciBwYXJzZXMgYW4gZXhwcmVzc2lvbiwgY29sbGVjdHMgZGVwZW5kZW5jaWVzLFxuICogYW5kIGZpcmVzIGNhbGxiYWNrIHdoZW4gdGhlIGV4cHJlc3Npb24gdmFsdWUgY2hhbmdlcy5cbiAqIFRoaXMgaXMgdXNlZCBmb3IgYm90aCB0aGUgJHdhdGNoKCkgYXBpIGFuZCBkaXJlY3RpdmVzLlxuICpcbiAqIEBwYXJhbSB7VnVlfSB2bVxuICogQHBhcmFtIHtTdHJpbmd9IGV4cHJlc3Npb25cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNiXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICogICAgICAgICAgICAgICAgIC0ge0FycmF5fSBmaWx0ZXJzXG4gKiAgICAgICAgICAgICAgICAgLSB7Qm9vbGVhbn0gdHdvV2F5XG4gKiAgICAgICAgICAgICAgICAgLSB7Qm9vbGVhbn0gZGVlcFxuICogICAgICAgICAgICAgICAgIC0ge0Jvb2xlYW59IHVzZXJcbiAqICAgICAgICAgICAgICAgICAtIHtGdW5jdGlvbn0gW3ByZVByb2Nlc3NdXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuXG5mdW5jdGlvbiBXYXRjaGVyICh2bSwgZXhwcmVzc2lvbiwgY2IsIG9wdGlvbnMpIHtcbiAgdGhpcy52bSA9IHZtXG4gIHZtLl93YXRjaGVycy5wdXNoKHRoaXMpXG4gIHRoaXMuZXhwcmVzc2lvbiA9IGV4cHJlc3Npb25cbiAgdGhpcy5jYiA9IGNiXG4gIHRoaXMuaWQgPSArK3VpZCAvLyB1aWQgZm9yIGJhdGNoaW5nXG4gIHRoaXMuYWN0aXZlID0gdHJ1ZVxuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fVxuICB0aGlzLmRlZXAgPSAhIW9wdGlvbnMuZGVlcFxuICB0aGlzLnVzZXIgPSAhIW9wdGlvbnMudXNlclxuICB0aGlzLnR3b1dheSA9ICEhb3B0aW9ucy50d29XYXlcbiAgdGhpcy5maWx0ZXJzID0gb3B0aW9ucy5maWx0ZXJzXG4gIHRoaXMucHJlUHJvY2VzcyA9IG9wdGlvbnMucHJlUHJvY2Vzc1xuICB0aGlzLmRlcHMgPSBbXVxuICB0aGlzLm5ld0RlcHMgPSBbXVxuICAvLyBwYXJzZSBleHByZXNzaW9uIGZvciBnZXR0ZXIvc2V0dGVyXG4gIHZhciByZXMgPSBleHBQYXJzZXIucGFyc2UoZXhwcmVzc2lvbiwgb3B0aW9ucy50d29XYXkpXG4gIHRoaXMuZ2V0dGVyID0gcmVzLmdldFxuICB0aGlzLnNldHRlciA9IHJlcy5zZXRcbiAgdGhpcy52YWx1ZSA9IHRoaXMuZ2V0KClcbn1cblxudmFyIHAgPSBXYXRjaGVyLnByb3RvdHlwZVxuXG4vKipcbiAqIEFkZCBhIGRlcGVuZGVuY3kgdG8gdGhpcyBkaXJlY3RpdmUuXG4gKlxuICogQHBhcmFtIHtEZXB9IGRlcFxuICovXG5cbnAuYWRkRGVwID0gZnVuY3Rpb24gKGRlcCkge1xuICB2YXIgbmV3RGVwcyA9IHRoaXMubmV3RGVwc1xuICB2YXIgb2xkID0gdGhpcy5kZXBzXG4gIGlmIChfLmluZGV4T2YobmV3RGVwcywgZGVwKSA8IDApIHtcbiAgICBuZXdEZXBzLnB1c2goZGVwKVxuICAgIHZhciBpID0gXy5pbmRleE9mKG9sZCwgZGVwKVxuICAgIGlmIChpIDwgMCkge1xuICAgICAgZGVwLmFkZFN1Yih0aGlzKVxuICAgIH0gZWxzZSB7XG4gICAgICBvbGRbaV0gPSBudWxsXG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogRXZhbHVhdGUgdGhlIGdldHRlciwgYW5kIHJlLWNvbGxlY3QgZGVwZW5kZW5jaWVzLlxuICovXG5cbnAuZ2V0ID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLmJlZm9yZUdldCgpXG4gIHZhciB2bSA9IHRoaXMudm1cbiAgdmFyIHZhbHVlXG4gIHRyeSB7XG4gICAgdmFsdWUgPSB0aGlzLmdldHRlci5jYWxsKHZtLCB2bSlcbiAgfSBjYXRjaCAoZSkge1xuICAgIGlmIChjb25maWcud2FybkV4cHJlc3Npb25FcnJvcnMpIHtcbiAgICAgIF8ud2FybihcbiAgICAgICAgJ0Vycm9yIHdoZW4gZXZhbHVhdGluZyBleHByZXNzaW9uIFwiJyArXG4gICAgICAgIHRoaXMuZXhwcmVzc2lvbiArICdcIicsIGVcbiAgICAgIClcbiAgICB9XG4gIH1cbiAgLy8gXCJ0b3VjaFwiIGV2ZXJ5IHByb3BlcnR5IHNvIHRoZXkgYXJlIGFsbCB0cmFja2VkIGFzXG4gIC8vIGRlcGVuZGVuY2llcyBmb3IgZGVlcCB3YXRjaGluZ1xuICBpZiAodGhpcy5kZWVwKSB7XG4gICAgdHJhdmVyc2UodmFsdWUpXG4gIH1cbiAgaWYgKHRoaXMucHJlUHJvY2Vzcykge1xuICAgIHZhbHVlID0gdGhpcy5wcmVQcm9jZXNzKHZhbHVlKVxuICB9XG4gIGlmICh0aGlzLmZpbHRlcnMpIHtcbiAgICB2YWx1ZSA9IHZtLl9hcHBseUZpbHRlcnModmFsdWUsIG51bGwsIHRoaXMuZmlsdGVycywgZmFsc2UpXG4gIH1cbiAgdGhpcy5hZnRlckdldCgpXG4gIHJldHVybiB2YWx1ZVxufVxuXG4vKipcbiAqIFNldCB0aGUgY29ycmVzcG9uZGluZyB2YWx1ZSB3aXRoIHRoZSBzZXR0ZXIuXG4gKlxuICogQHBhcmFtIHsqfSB2YWx1ZVxuICovXG5cbnAuc2V0ID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIHZhciB2bSA9IHRoaXMudm1cbiAgaWYgKHRoaXMuZmlsdGVycykge1xuICAgIHZhbHVlID0gdm0uX2FwcGx5RmlsdGVycyhcbiAgICAgIHZhbHVlLCB0aGlzLnZhbHVlLCB0aGlzLmZpbHRlcnMsIHRydWUpXG4gIH1cbiAgdHJ5IHtcbiAgICB0aGlzLnNldHRlci5jYWxsKHZtLCB2bSwgdmFsdWUpXG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBpZiAoY29uZmlnLndhcm5FeHByZXNzaW9uRXJyb3JzKSB7XG4gICAgICBfLndhcm4oXG4gICAgICAgICdFcnJvciB3aGVuIGV2YWx1YXRpbmcgc2V0dGVyIFwiJyArXG4gICAgICAgIHRoaXMuZXhwcmVzc2lvbiArICdcIicsIGVcbiAgICAgIClcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBQcmVwYXJlIGZvciBkZXBlbmRlbmN5IGNvbGxlY3Rpb24uXG4gKi9cblxucC5iZWZvcmVHZXQgPSBmdW5jdGlvbiAoKSB7XG4gIE9ic2VydmVyLnRhcmdldCA9IHRoaXNcbn1cblxuLyoqXG4gKiBDbGVhbiB1cCBmb3IgZGVwZW5kZW5jeSBjb2xsZWN0aW9uLlxuICovXG5cbnAuYWZ0ZXJHZXQgPSBmdW5jdGlvbiAoKSB7XG4gIE9ic2VydmVyLnRhcmdldCA9IG51bGxcbiAgdmFyIGkgPSB0aGlzLmRlcHMubGVuZ3RoXG4gIHdoaWxlIChpLS0pIHtcbiAgICB2YXIgZGVwID0gdGhpcy5kZXBzW2ldXG4gICAgaWYgKGRlcCkge1xuICAgICAgZGVwLnJlbW92ZVN1Yih0aGlzKVxuICAgIH1cbiAgfVxuICB0aGlzLmRlcHMgPSB0aGlzLm5ld0RlcHNcbiAgdGhpcy5uZXdEZXBzID0gW11cbn1cblxuLyoqXG4gKiBTdWJzY3JpYmVyIGludGVyZmFjZS5cbiAqIFdpbGwgYmUgY2FsbGVkIHdoZW4gYSBkZXBlbmRlbmN5IGNoYW5nZXMuXG4gKi9cblxucC51cGRhdGUgPSBmdW5jdGlvbiAoKSB7XG4gIGlmICghY29uZmlnLmFzeW5jIHx8IGNvbmZpZy5kZWJ1Zykge1xuICAgIHRoaXMucnVuKClcbiAgfSBlbHNlIHtcbiAgICBiYXRjaGVyLnB1c2godGhpcylcbiAgfVxufVxuXG4vKipcbiAqIEJhdGNoZXIgam9iIGludGVyZmFjZS5cbiAqIFdpbGwgYmUgY2FsbGVkIGJ5IHRoZSBiYXRjaGVyLlxuICovXG5cbnAucnVuID0gZnVuY3Rpb24gKCkge1xuICBpZiAodGhpcy5hY3RpdmUpIHtcbiAgICB2YXIgdmFsdWUgPSB0aGlzLmdldCgpXG4gICAgaWYgKFxuICAgICAgdmFsdWUgIT09IHRoaXMudmFsdWUgfHxcbiAgICAgIEFycmF5LmlzQXJyYXkodmFsdWUpIHx8XG4gICAgICB0aGlzLmRlZXBcbiAgICApIHtcbiAgICAgIHZhciBvbGRWYWx1ZSA9IHRoaXMudmFsdWVcbiAgICAgIHRoaXMudmFsdWUgPSB2YWx1ZVxuICAgICAgdGhpcy5jYih2YWx1ZSwgb2xkVmFsdWUpXG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogUmVtb3ZlIHNlbGYgZnJvbSBhbGwgZGVwZW5kZW5jaWVzJyBzdWJjcmliZXIgbGlzdC5cbiAqL1xuXG5wLnRlYXJkb3duID0gZnVuY3Rpb24gKCkge1xuICBpZiAodGhpcy5hY3RpdmUpIHtcbiAgICAvLyByZW1vdmUgc2VsZiBmcm9tIHZtJ3Mgd2F0Y2hlciBsaXN0XG4gICAgLy8gd2UgY2FuIHNraXAgdGhpcyBpZiB0aGUgdm0gaWYgYmVpbmcgZGVzdHJveWVkXG4gICAgLy8gd2hpY2ggY2FuIGltcHJvdmUgdGVhcmRvd24gcGVyZm9ybWFuY2UuXG4gICAgaWYgKCF0aGlzLnZtLl9pc0JlaW5nRGVzdHJveWVkKSB7XG4gICAgICB0aGlzLnZtLl93YXRjaGVycy4kcmVtb3ZlKHRoaXMpXG4gICAgfVxuICAgIHZhciBpID0gdGhpcy5kZXBzLmxlbmd0aFxuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgIHRoaXMuZGVwc1tpXS5yZW1vdmVTdWIodGhpcylcbiAgICB9XG4gICAgdGhpcy5hY3RpdmUgPSBmYWxzZVxuICAgIHRoaXMudm0gPSB0aGlzLmNiID0gdGhpcy52YWx1ZSA9IG51bGxcbiAgfVxufVxuXG5cbi8qKlxuICogUmVjcnVzaXZlbHkgdHJhdmVyc2UgYW4gb2JqZWN0IHRvIGV2b2tlIGFsbCBjb252ZXJ0ZWRcbiAqIGdldHRlcnMsIHNvIHRoYXQgZXZlcnkgbmVzdGVkIHByb3BlcnR5IGluc2lkZSB0aGUgb2JqZWN0XG4gKiBpcyBjb2xsZWN0ZWQgYXMgYSBcImRlZXBcIiBkZXBlbmRlbmN5LlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmpcbiAqL1xuXG5mdW5jdGlvbiB0cmF2ZXJzZSAob2JqKSB7XG4gIHZhciBrZXksIHZhbCwgaVxuICBmb3IgKGtleSBpbiBvYmopIHtcbiAgICB2YWwgPSBvYmpba2V5XVxuICAgIGlmIChfLmlzQXJyYXkodmFsKSkge1xuICAgICAgaSA9IHZhbC5sZW5ndGhcbiAgICAgIHdoaWxlIChpLS0pIHRyYXZlcnNlKHZhbFtpXSlcbiAgICB9IGVsc2UgaWYgKF8uaXNPYmplY3QodmFsKSkge1xuICAgICAgdHJhdmVyc2UodmFsKVxuICAgIH1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFdhdGNoZXIiLCIvKiFcbiAqIENvcHlyaWdodCAoYykgMjAxNCBDaHJpcyBPJ0hhcmEgPGNvaGFyYTg3QGdtYWlsLmNvbT5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmdcbiAqIGEgY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuICogXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4gKiB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4gKiBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG9cbiAqIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0b1xuICogdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlXG4gKiBpbmNsdWRlZCBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELFxuICogRVhQUkVTUyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4gKiBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORFxuICogTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRVxuICogTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTlxuICogT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OXG4gKiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG4oZnVuY3Rpb24gKG5hbWUsIGRlZmluaXRpb24pIHtcbiAgICBpZiAodHlwZW9mIGV4cG9ydHMgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZGVmaW5pdGlvbigpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgZGVmaW5lLmFtZCA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgZGVmaW5lKGRlZmluaXRpb24pO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXNbbmFtZV0gPSBkZWZpbml0aW9uKCk7XG4gICAgfVxufSkoJ3ZhbGlkYXRvcicsIGZ1bmN0aW9uICh2YWxpZGF0b3IpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhbGlkYXRvciA9IHsgdmVyc2lvbjogJzMuMzkuMCcgfTtcblxuICAgIHZhciBlbWFpbFVzZXIgPSAvXigoKFthLXpdfFxcZHxbISNcXCQlJidcXCpcXCtcXC1cXC89XFw/XFxeX2B7XFx8fX5dKSsoXFwuKFthLXpdfFxcZHxbISNcXCQlJidcXCpcXCtcXC1cXC89XFw/XFxeX2B7XFx8fX5dKSspKil8KChcXHgyMikoKCgoXFx4MjB8XFx4MDkpKihcXHgwZFxceDBhKSk/KFxceDIwfFxceDA5KSspPygoW1xceDAxLVxceDA4XFx4MGJcXHgwY1xceDBlLVxceDFmXFx4N2ZdfFxceDIxfFtcXHgyMy1cXHg1Yl18W1xceDVkLVxceDdlXSl8KFxcXFxbXFx4MDEtXFx4MDlcXHgwYlxceDBjXFx4MGQtXFx4N2ZdKSkpKigoKFxceDIwfFxceDA5KSooXFx4MGRcXHgwYSkpPyhcXHgyMHxcXHgwOSkrKT8oXFx4MjIpKSkkL2k7XG5cbiAgICB2YXIgZW1haWxVc2VyVXRmOCA9IC9eKCgoW2Etel18XFxkfFshI1xcJCUmJ1xcKlxcK1xcLVxcLz1cXD9cXF5fYHtcXHx9fl18W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pKyhcXC4oW2Etel18XFxkfFshI1xcJCUmJ1xcKlxcK1xcLVxcLz1cXD9cXF5fYHtcXHx9fl18W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pKykqKXwoKFxceDIyKSgoKChcXHgyMHxcXHgwOSkqKFxceDBkXFx4MGEpKT8oXFx4MjB8XFx4MDkpKyk/KChbXFx4MDEtXFx4MDhcXHgwYlxceDBjXFx4MGUtXFx4MWZcXHg3Zl18XFx4MjF8W1xceDIzLVxceDViXXxbXFx4NWQtXFx4N2VdfFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKXwoXFxcXChbXFx4MDEtXFx4MDlcXHgwYlxceDBjXFx4MGQtXFx4N2ZdfFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKSkpKSooKChcXHgyMHxcXHgwOSkqKFxceDBkXFx4MGEpKT8oXFx4MjB8XFx4MDkpKyk/KFxceDIyKSkpJC9pO1xuXG4gICAgdmFyIGRpc3BsYXlOYW1lID0gL14oPzpbYS16XXxcXGR8WyEjXFwkJSYnXFwqXFwrXFwtXFwvPVxcP1xcXl9ge1xcfH1+XFwuXXxbXFx1MDBBMC1cXHVEN0ZGXFx1RjkwMC1cXHVGRENGXFx1RkRGMC1cXHVGRkVGXSkrKD86W2Etel18XFxkfFshI1xcJCUmJ1xcKlxcK1xcLVxcLz1cXD9cXF5fYHtcXHx9flxcLl18W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl18XFxzKSo8KC4rKT4kL2k7XG5cbiAgICB2YXIgY3JlZGl0Q2FyZCA9IC9eKD86NFswLTldezEyfSg/OlswLTldezN9KT98NVsxLTVdWzAtOV17MTR9fDYoPzowMTF8NVswLTldWzAtOV0pWzAtOV17MTJ9fDNbNDddWzAtOV17MTN9fDMoPzowWzAtNV18WzY4XVswLTldKVswLTldezExfXwoPzoyMTMxfDE4MDB8MzVcXGR7M30pXFxkezExfSkkLztcblxuICAgIHZhciBpc2luID0gL15bQS1aXXsyfVswLTlBLVpdezl9WzAtOV0kLztcblxuICAgIHZhciBpc2JuMTBNYXliZSA9IC9eKD86WzAtOV17OX1YfFswLTldezEwfSkkL1xuICAgICAgLCBpc2JuMTNNYXliZSA9IC9eKD86WzAtOV17MTN9KSQvO1xuXG4gICAgdmFyIGlwdjRNYXliZSA9IC9eKFxcZCspXFwuKFxcZCspXFwuKFxcZCspXFwuKFxcZCspJC9cbiAgICAgICwgaXB2NkJsb2NrID0gL15bMC05QS1GXXsxLDR9JC9pO1xuXG4gICAgdmFyIHV1aWQgPSB7XG4gICAgICAgICczJzogL15bMC05QS1GXXs4fS1bMC05QS1GXXs0fS0zWzAtOUEtRl17M30tWzAtOUEtRl17NH0tWzAtOUEtRl17MTJ9JC9pXG4gICAgICAsICc0JzogL15bMC05QS1GXXs4fS1bMC05QS1GXXs0fS00WzAtOUEtRl17M30tWzg5QUJdWzAtOUEtRl17M30tWzAtOUEtRl17MTJ9JC9pXG4gICAgICAsICc1JzogL15bMC05QS1GXXs4fS1bMC05QS1GXXs0fS01WzAtOUEtRl17M30tWzg5QUJdWzAtOUEtRl17M30tWzAtOUEtRl17MTJ9JC9pXG4gICAgICAsIGFsbDogL15bMC05QS1GXXs4fS1bMC05QS1GXXs0fS1bMC05QS1GXXs0fS1bMC05QS1GXXs0fS1bMC05QS1GXXsxMn0kL2lcbiAgICB9O1xuXG4gICAgdmFyIGFscGhhID0gL15bQS1aXSskL2lcbiAgICAgICwgYWxwaGFudW1lcmljID0gL15bMC05QS1aXSskL2lcbiAgICAgICwgbnVtZXJpYyA9IC9eWy0rXT9bMC05XSskL1xuICAgICAgLCBpbnQgPSAvXig/OlstK10/KD86MHxbMS05XVswLTldKikpJC9cbiAgICAgICwgZmxvYXQgPSAvXig/OlstK10/KD86WzAtOV0rKSk/KD86XFwuWzAtOV0qKT8oPzpbZUVdW1xcK1xcLV0/KD86WzAtOV0rKSk/JC9cbiAgICAgICwgaGV4YWRlY2ltYWwgPSAvXlswLTlBLUZdKyQvaVxuICAgICAgLCBoZXhjb2xvciA9IC9eIz8oWzAtOUEtRl17M318WzAtOUEtRl17Nn0pJC9pO1xuXG4gICAgdmFyIGFzY2lpID0gL15bXFx4MDAtXFx4N0ZdKyQvXG4gICAgICAsIG11bHRpYnl0ZSA9IC9bXlxceDAwLVxceDdGXS9cbiAgICAgICwgZnVsbFdpZHRoID0gL1teXFx1MDAyMC1cXHUwMDdFXFx1RkY2MS1cXHVGRjlGXFx1RkZBMC1cXHVGRkRDXFx1RkZFOC1cXHVGRkVFMC05YS16QS1aXS9cbiAgICAgICwgaGFsZldpZHRoID0gL1tcXHUwMDIwLVxcdTAwN0VcXHVGRjYxLVxcdUZGOUZcXHVGRkEwLVxcdUZGRENcXHVGRkU4LVxcdUZGRUUwLTlhLXpBLVpdLztcblxuICAgIHZhciBzdXJyb2dhdGVQYWlyID0gL1tcXHVEODAwLVxcdURCRkZdW1xcdURDMDAtXFx1REZGRl0vO1xuXG4gICAgdmFyIGJhc2U2NCA9IC9eKD86W0EtWjAtOStcXC9dezR9KSooPzpbQS1aMC05K1xcL117Mn09PXxbQS1aMC05K1xcL117M309fFtBLVowLTkrXFwvXXs0fSkkL2k7XG5cbiAgICB2YXIgcGhvbmVzID0ge1xuICAgICAgJ3poLUNOJzogL14oXFwrPzA/ODZcXC0/KT8xWzM0NTc4OV1cXGR7OX0kLyxcbiAgICAgICdlbi1aQSc6IC9eKFxcKz8yN3wwKVxcZHs5fSQvLFxuICAgICAgJ2VuLUFVJzogL14oXFwrPzYxfDApNFxcZHs4fSQvLFxuICAgICAgJ2VuLUhLJzogL14oXFwrPzg1MlxcLT8pP1s1NjldXFxkezN9XFwtP1xcZHs0fSQvLFxuICAgICAgJ2ZyLUZSJzogL14oXFwrPzMzfDApWzY3XVxcZHs4fSQvLFxuICAgICAgJ3B0LVBUJzogL14oXFwrMzUxKT85WzEyMzZdXFxkezd9JC8sXG4gICAgICAnZWwtR1InOiAvXihcXCszMCk/KCgyXFxkezl9KXwoNjlcXGR7OH0pKSQvLFxuICAgICAgJ2VuLUdCJzogL14oXFwrPzQ0fDApN1xcZHs5fSQvLFxuICAgICAgJ2VuLVVTJzogL14oXFwrPzEpP1syLTldXFxkezJ9WzItOV0oPyExMSlcXGR7Nn0kLyxcbiAgICAgICdlbi1aTSc6IC9eKFxcKzI2KT8wOVs1NjddXFxkezd9JC9cbiAgICB9O1xuXG4gICAgdmFsaWRhdG9yLmV4dGVuZCA9IGZ1bmN0aW9uIChuYW1lLCBmbikge1xuICAgICAgICB2YWxpZGF0b3JbbmFtZV0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgICAgICAgICBhcmdzWzBdID0gdmFsaWRhdG9yLnRvU3RyaW5nKGFyZ3NbMF0pO1xuICAgICAgICAgICAgcmV0dXJuIGZuLmFwcGx5KHZhbGlkYXRvciwgYXJncyk7XG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIC8vUmlnaHQgYmVmb3JlIGV4cG9ydGluZyB0aGUgdmFsaWRhdG9yIG9iamVjdCwgcGFzcyBlYWNoIG9mIHRoZSBidWlsdGluc1xuICAgIC8vdGhyb3VnaCBleHRlbmQoKSBzbyB0aGF0IHRoZWlyIGZpcnN0IGFyZ3VtZW50IGlzIGNvZXJjZWQgdG8gYSBzdHJpbmdcbiAgICB2YWxpZGF0b3IuaW5pdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZm9yICh2YXIgbmFtZSBpbiB2YWxpZGF0b3IpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsaWRhdG9yW25hbWVdICE9PSAnZnVuY3Rpb24nIHx8IG5hbWUgPT09ICd0b1N0cmluZycgfHxcbiAgICAgICAgICAgICAgICAgICAgbmFtZSA9PT0gJ3RvRGF0ZScgfHwgbmFtZSA9PT0gJ2V4dGVuZCcgfHwgbmFtZSA9PT0gJ2luaXQnKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YWxpZGF0b3IuZXh0ZW5kKG5hbWUsIHZhbGlkYXRvcltuYW1lXSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFsaWRhdG9yLnRvU3RyaW5nID0gZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICAgIGlmICh0eXBlb2YgaW5wdXQgPT09ICdvYmplY3QnICYmIGlucHV0ICE9PSBudWxsICYmIGlucHV0LnRvU3RyaW5nKSB7XG4gICAgICAgICAgICBpbnB1dCA9IGlucHV0LnRvU3RyaW5nKCk7XG4gICAgICAgIH0gZWxzZSBpZiAoaW5wdXQgPT09IG51bGwgfHwgdHlwZW9mIGlucHV0ID09PSAndW5kZWZpbmVkJyB8fCAoaXNOYU4oaW5wdXQpICYmICFpbnB1dC5sZW5ndGgpKSB7XG4gICAgICAgICAgICBpbnB1dCA9ICcnO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBpbnB1dCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGlucHV0ICs9ICcnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpbnB1dDtcbiAgICB9O1xuXG4gICAgdmFsaWRhdG9yLnRvRGF0ZSA9IGZ1bmN0aW9uIChkYXRlKSB7XG4gICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoZGF0ZSkgPT09ICdbb2JqZWN0IERhdGVdJykge1xuICAgICAgICAgICAgcmV0dXJuIGRhdGU7XG4gICAgICAgIH1cbiAgICAgICAgZGF0ZSA9IERhdGUucGFyc2UoZGF0ZSk7XG4gICAgICAgIHJldHVybiAhaXNOYU4oZGF0ZSkgPyBuZXcgRGF0ZShkYXRlKSA6IG51bGw7XG4gICAgfTtcblxuICAgIHZhbGlkYXRvci50b0Zsb2F0ID0gZnVuY3Rpb24gKHN0cikge1xuICAgICAgICByZXR1cm4gcGFyc2VGbG9hdChzdHIpO1xuICAgIH07XG5cbiAgICB2YWxpZGF0b3IudG9JbnQgPSBmdW5jdGlvbiAoc3RyLCByYWRpeCkge1xuICAgICAgICByZXR1cm4gcGFyc2VJbnQoc3RyLCByYWRpeCB8fCAxMCk7XG4gICAgfTtcblxuICAgIHZhbGlkYXRvci50b0Jvb2xlYW4gPSBmdW5jdGlvbiAoc3RyLCBzdHJpY3QpIHtcbiAgICAgICAgaWYgKHN0cmljdCkge1xuICAgICAgICAgICAgcmV0dXJuIHN0ciA9PT0gJzEnIHx8IHN0ciA9PT0gJ3RydWUnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzdHIgIT09ICcwJyAmJiBzdHIgIT09ICdmYWxzZScgJiYgc3RyICE9PSAnJztcbiAgICB9O1xuXG4gICAgdmFsaWRhdG9yLmVxdWFscyA9IGZ1bmN0aW9uIChzdHIsIGNvbXBhcmlzb24pIHtcbiAgICAgICAgcmV0dXJuIHN0ciA9PT0gdmFsaWRhdG9yLnRvU3RyaW5nKGNvbXBhcmlzb24pO1xuICAgIH07XG5cbiAgICB2YWxpZGF0b3IuY29udGFpbnMgPSBmdW5jdGlvbiAoc3RyLCBlbGVtKSB7XG4gICAgICAgIHJldHVybiBzdHIuaW5kZXhPZih2YWxpZGF0b3IudG9TdHJpbmcoZWxlbSkpID49IDA7XG4gICAgfTtcblxuICAgIHZhbGlkYXRvci5tYXRjaGVzID0gZnVuY3Rpb24gKHN0ciwgcGF0dGVybiwgbW9kaWZpZXJzKSB7XG4gICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwocGF0dGVybikgIT09ICdbb2JqZWN0IFJlZ0V4cF0nKSB7XG4gICAgICAgICAgICBwYXR0ZXJuID0gbmV3IFJlZ0V4cChwYXR0ZXJuLCBtb2RpZmllcnMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwYXR0ZXJuLnRlc3Qoc3RyKTtcbiAgICB9O1xuXG4gICAgdmFyIGRlZmF1bHRfZW1haWxfb3B0aW9ucyA9IHtcbiAgICAgICAgYWxsb3dfZGlzcGxheV9uYW1lOiBmYWxzZSxcbiAgICAgICAgYWxsb3dfdXRmOF9sb2NhbF9wYXJ0OiB0cnVlLFxuICAgICAgICByZXF1aXJlX3RsZDogdHJ1ZVxuICAgIH07XG5cbiAgICB2YWxpZGF0b3IuaXNFbWFpbCA9IGZ1bmN0aW9uIChzdHIsIG9wdGlvbnMpIHtcbiAgICAgICAgb3B0aW9ucyA9IG1lcmdlKG9wdGlvbnMsIGRlZmF1bHRfZW1haWxfb3B0aW9ucyk7XG5cbiAgICAgICAgaWYgKG9wdGlvbnMuYWxsb3dfZGlzcGxheV9uYW1lKSB7XG4gICAgICAgICAgICB2YXIgZGlzcGxheV9lbWFpbCA9IHN0ci5tYXRjaChkaXNwbGF5TmFtZSk7XG4gICAgICAgICAgICBpZiAoZGlzcGxheV9lbWFpbCkge1xuICAgICAgICAgICAgICAgIHN0ciA9IGRpc3BsYXlfZW1haWxbMV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoL1xccy8udGVzdChzdHIpKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcGFydHMgPSBzdHIuc3BsaXQoJ0AnKVxuICAgICAgICAgICwgZG9tYWluID0gcGFydHMucG9wKClcbiAgICAgICAgICAsIHVzZXIgPSBwYXJ0cy5qb2luKCdAJyk7XG5cbiAgICAgICAgaWYgKCF2YWxpZGF0b3IuaXNGUUROKGRvbWFpbiwge3JlcXVpcmVfdGxkOiBvcHRpb25zLnJlcXVpcmVfdGxkfSkpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBvcHRpb25zLmFsbG93X3V0ZjhfbG9jYWxfcGFydCA/XG4gICAgICAgICAgICBlbWFpbFVzZXJVdGY4LnRlc3QodXNlcikgOlxuICAgICAgICAgICAgZW1haWxVc2VyLnRlc3QodXNlcik7XG4gICAgfTtcblxuICAgIHZhciBkZWZhdWx0X3VybF9vcHRpb25zID0ge1xuICAgICAgICBwcm90b2NvbHM6IFsgJ2h0dHAnLCAnaHR0cHMnLCAnZnRwJyBdXG4gICAgICAsIHJlcXVpcmVfdGxkOiB0cnVlXG4gICAgICAsIHJlcXVpcmVfcHJvdG9jb2w6IGZhbHNlXG4gICAgICAsIGFsbG93X3VuZGVyc2NvcmVzOiBmYWxzZVxuICAgICAgLCBhbGxvd190cmFpbGluZ19kb3Q6IGZhbHNlXG4gICAgICAsIGFsbG93X3Byb3RvY29sX3JlbGF0aXZlX3VybHM6IGZhbHNlXG4gICAgfTtcblxuICAgIHZhbGlkYXRvci5pc1VSTCA9IGZ1bmN0aW9uICh1cmwsIG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKCF1cmwgfHwgdXJsLmxlbmd0aCA+PSAyMDgzIHx8IC9cXHMvLnRlc3QodXJsKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmICh1cmwuaW5kZXhPZignbWFpbHRvOicpID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgb3B0aW9ucyA9IG1lcmdlKG9wdGlvbnMsIGRlZmF1bHRfdXJsX29wdGlvbnMpO1xuICAgICAgICB2YXIgcHJvdG9jb2wsIGF1dGgsIGhvc3QsIGhvc3RuYW1lLCBwb3J0LFxuICAgICAgICAgICAgcG9ydF9zdHIsIHNwbGl0O1xuICAgICAgICBzcGxpdCA9IHVybC5zcGxpdCgnOi8vJyk7XG4gICAgICAgIGlmIChzcGxpdC5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICBwcm90b2NvbCA9IHNwbGl0LnNoaWZ0KCk7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5wcm90b2NvbHMuaW5kZXhPZihwcm90b2NvbCkgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKG9wdGlvbnMucmVxdWlyZV9wcm90b2NvbCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9ICBlbHNlIGlmIChvcHRpb25zLmFsbG93X3Byb3RvY29sX3JlbGF0aXZlX3VybHMgJiYgdXJsLnN1YnN0cigwLCAyKSA9PT0gJy8vJykge1xuICAgICAgICAgICAgc3BsaXRbMF0gPSB1cmwuc3Vic3RyKDIpO1xuICAgICAgICB9XG4gICAgICAgIHVybCA9IHNwbGl0LmpvaW4oJzovLycpO1xuICAgICAgICBzcGxpdCA9IHVybC5zcGxpdCgnIycpO1xuICAgICAgICB1cmwgPSBzcGxpdC5zaGlmdCgpO1xuXG4gICAgICAgIHNwbGl0ID0gdXJsLnNwbGl0KCc/Jyk7XG4gICAgICAgIHVybCA9IHNwbGl0LnNoaWZ0KCk7XG5cbiAgICAgICAgc3BsaXQgPSB1cmwuc3BsaXQoJy8nKTtcbiAgICAgICAgdXJsID0gc3BsaXQuc2hpZnQoKTtcbiAgICAgICAgc3BsaXQgPSB1cmwuc3BsaXQoJ0AnKTtcbiAgICAgICAgaWYgKHNwbGl0Lmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgIGF1dGggPSBzcGxpdC5zaGlmdCgpO1xuICAgICAgICAgICAgaWYgKGF1dGguaW5kZXhPZignOicpID49IDAgJiYgYXV0aC5zcGxpdCgnOicpLmxlbmd0aCA+IDIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaG9zdG5hbWUgPSBzcGxpdC5qb2luKCdAJyk7XG4gICAgICAgIHNwbGl0ID0gaG9zdG5hbWUuc3BsaXQoJzonKTtcbiAgICAgICAgaG9zdCA9IHNwbGl0LnNoaWZ0KCk7XG4gICAgICAgIGlmIChzcGxpdC5sZW5ndGgpIHtcbiAgICAgICAgICAgIHBvcnRfc3RyID0gc3BsaXQuam9pbignOicpO1xuICAgICAgICAgICAgcG9ydCA9IHBhcnNlSW50KHBvcnRfc3RyLCAxMCk7XG4gICAgICAgICAgICBpZiAoIS9eWzAtOV0rJC8udGVzdChwb3J0X3N0cikgfHwgcG9ydCA8PSAwIHx8IHBvcnQgPiA2NTUzNSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIXZhbGlkYXRvci5pc0lQKGhvc3QpICYmICF2YWxpZGF0b3IuaXNGUUROKGhvc3QsIG9wdGlvbnMpICYmXG4gICAgICAgICAgICAgICAgaG9zdCAhPT0gJ2xvY2FsaG9zdCcpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAob3B0aW9ucy5ob3N0X3doaXRlbGlzdCAmJlxuICAgICAgICAgICAgICAgIG9wdGlvbnMuaG9zdF93aGl0ZWxpc3QuaW5kZXhPZihob3N0KSA9PT0gLTEpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAob3B0aW9ucy5ob3N0X2JsYWNrbGlzdCAmJlxuICAgICAgICAgICAgICAgIG9wdGlvbnMuaG9zdF9ibGFja2xpc3QuaW5kZXhPZihob3N0KSAhPT0gLTEpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xuXG4gICAgdmFsaWRhdG9yLmlzSVAgPSBmdW5jdGlvbiAoc3RyLCB2ZXJzaW9uKSB7XG4gICAgICAgIHZlcnNpb24gPSB2YWxpZGF0b3IudG9TdHJpbmcodmVyc2lvbik7XG4gICAgICAgIGlmICghdmVyc2lvbikge1xuICAgICAgICAgICAgcmV0dXJuIHZhbGlkYXRvci5pc0lQKHN0ciwgNCkgfHwgdmFsaWRhdG9yLmlzSVAoc3RyLCA2KTtcbiAgICAgICAgfSBlbHNlIGlmICh2ZXJzaW9uID09PSAnNCcpIHtcbiAgICAgICAgICAgIGlmICghaXB2NE1heWJlLnRlc3Qoc3RyKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBwYXJ0cyA9IHN0ci5zcGxpdCgnLicpLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYSAtIGI7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBwYXJ0c1szXSA8PSAyNTU7XG4gICAgICAgIH0gZWxzZSBpZiAodmVyc2lvbiA9PT0gJzYnKSB7XG4gICAgICAgICAgICB2YXIgYmxvY2tzID0gc3RyLnNwbGl0KCc6Jyk7XG4gICAgICAgICAgICB2YXIgZm91bmRPbWlzc2lvbkJsb2NrID0gZmFsc2U7IC8vIG1hcmtlciB0byBpbmRpY2F0ZSA6OlxuXG4gICAgICAgICAgICBpZiAoYmxvY2tzLmxlbmd0aCA+IDgpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgICAgICAvLyBpbml0aWFsIG9yIGZpbmFsIDo6XG4gICAgICAgICAgICBpZiAoc3RyID09PSAnOjonKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHN0ci5zdWJzdHIoMCwgMikgPT09ICc6OicpIHtcbiAgICAgICAgICAgICAgICBibG9ja3Muc2hpZnQoKTtcbiAgICAgICAgICAgICAgICBibG9ja3Muc2hpZnQoKTtcbiAgICAgICAgICAgICAgICBmb3VuZE9taXNzaW9uQmxvY2sgPSB0cnVlO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChzdHIuc3Vic3RyKHN0ci5sZW5ndGggLSAyKSA9PT0gJzo6Jykge1xuICAgICAgICAgICAgICAgIGJsb2Nrcy5wb3AoKTtcbiAgICAgICAgICAgICAgICBibG9ja3MucG9wKCk7XG4gICAgICAgICAgICAgICAgZm91bmRPbWlzc2lvbkJsb2NrID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBibG9ja3MubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICAvLyB0ZXN0IGZvciBhIDo6IHdoaWNoIGNhbiBub3QgYmUgYXQgdGhlIHN0cmluZyBzdGFydC9lbmRcbiAgICAgICAgICAgICAgICAvLyBzaW5jZSB0aG9zZSBjYXNlcyBoYXZlIGJlZW4gaGFuZGxlZCBhYm92ZVxuICAgICAgICAgICAgICAgIGlmIChibG9ja3NbaV0gPT09ICcnICYmIGkgPiAwICYmIGkgPCBibG9ja3MubGVuZ3RoIC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChmb3VuZE9taXNzaW9uQmxvY2spXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7IC8vIG11bHRpcGxlIDo6IGluIGFkZHJlc3NcbiAgICAgICAgICAgICAgICAgICAgZm91bmRPbWlzc2lvbkJsb2NrID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFpcHY2QmxvY2sudGVzdChibG9ja3NbaV0pKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChmb3VuZE9taXNzaW9uQmxvY2spIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYmxvY2tzLmxlbmd0aCA+PSAxO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYmxvY2tzLmxlbmd0aCA9PT0gODtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcblxuICAgIHZhciBkZWZhdWx0X2ZxZG5fb3B0aW9ucyA9IHtcbiAgICAgICAgcmVxdWlyZV90bGQ6IHRydWVcbiAgICAgICwgYWxsb3dfdW5kZXJzY29yZXM6IGZhbHNlXG4gICAgICAsIGFsbG93X3RyYWlsaW5nX2RvdDogZmFsc2VcbiAgICB9O1xuXG4gICAgdmFsaWRhdG9yLmlzRlFETiA9IGZ1bmN0aW9uIChzdHIsIG9wdGlvbnMpIHtcbiAgICAgICAgb3B0aW9ucyA9IG1lcmdlKG9wdGlvbnMsIGRlZmF1bHRfZnFkbl9vcHRpb25zKTtcblxuICAgICAgICAvKiBSZW1vdmUgdGhlIG9wdGlvbmFsIHRyYWlsaW5nIGRvdCBiZWZvcmUgY2hlY2tpbmcgdmFsaWRpdHkgKi9cbiAgICAgICAgaWYgKG9wdGlvbnMuYWxsb3dfdHJhaWxpbmdfZG90ICYmIHN0cltzdHIubGVuZ3RoIC0gMV0gPT09ICcuJykge1xuICAgICAgICAgICAgc3RyID0gc3RyLnN1YnN0cmluZygwLCBzdHIubGVuZ3RoIC0gMSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHBhcnRzID0gc3RyLnNwbGl0KCcuJyk7XG4gICAgICAgIGlmIChvcHRpb25zLnJlcXVpcmVfdGxkKSB7XG4gICAgICAgICAgICB2YXIgdGxkID0gcGFydHMucG9wKCk7XG4gICAgICAgICAgICBpZiAoIXBhcnRzLmxlbmd0aCB8fCAhL14oW2EtelxcdTAwYTEtXFx1ZmZmZl17Mix9fHhuW2EtejAtOS1dezIsfSkkL2kudGVzdCh0bGQpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIHBhcnQsIGkgPSAwOyBpIDwgcGFydHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHBhcnQgPSBwYXJ0c1tpXTtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmFsbG93X3VuZGVyc2NvcmVzKSB7XG4gICAgICAgICAgICAgICAgaWYgKHBhcnQuaW5kZXhPZignX18nKSA+PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcGFydCA9IHBhcnQucmVwbGFjZSgvXy9nLCAnJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIS9eW2EtelxcdTAwYTEtXFx1ZmZmZjAtOS1dKyQvaS50ZXN0KHBhcnQpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHBhcnRbMF0gPT09ICctJyB8fCBwYXJ0W3BhcnQubGVuZ3RoIC0gMV0gPT09ICctJyB8fFxuICAgICAgICAgICAgICAgICAgICBwYXJ0LmluZGV4T2YoJy0tLScpID49IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcblxuICAgIHZhbGlkYXRvci5pc0FscGhhID0gZnVuY3Rpb24gKHN0cikge1xuICAgICAgICByZXR1cm4gYWxwaGEudGVzdChzdHIpO1xuICAgIH07XG5cbiAgICB2YWxpZGF0b3IuaXNBbHBoYW51bWVyaWMgPSBmdW5jdGlvbiAoc3RyKSB7XG4gICAgICAgIHJldHVybiBhbHBoYW51bWVyaWMudGVzdChzdHIpO1xuICAgIH07XG5cbiAgICB2YWxpZGF0b3IuaXNOdW1lcmljID0gZnVuY3Rpb24gKHN0cikge1xuICAgICAgICByZXR1cm4gbnVtZXJpYy50ZXN0KHN0cik7XG4gICAgfTtcblxuICAgIHZhbGlkYXRvci5pc0hleGFkZWNpbWFsID0gZnVuY3Rpb24gKHN0cikge1xuICAgICAgICByZXR1cm4gaGV4YWRlY2ltYWwudGVzdChzdHIpO1xuICAgIH07XG5cbiAgICB2YWxpZGF0b3IuaXNIZXhDb2xvciA9IGZ1bmN0aW9uIChzdHIpIHtcbiAgICAgICAgcmV0dXJuIGhleGNvbG9yLnRlc3Qoc3RyKTtcbiAgICB9O1xuXG4gICAgdmFsaWRhdG9yLmlzTG93ZXJjYXNlID0gZnVuY3Rpb24gKHN0cikge1xuICAgICAgICByZXR1cm4gc3RyID09PSBzdHIudG9Mb3dlckNhc2UoKTtcbiAgICB9O1xuXG4gICAgdmFsaWRhdG9yLmlzVXBwZXJjYXNlID0gZnVuY3Rpb24gKHN0cikge1xuICAgICAgICByZXR1cm4gc3RyID09PSBzdHIudG9VcHBlckNhc2UoKTtcbiAgICB9O1xuXG4gICAgdmFsaWRhdG9yLmlzSW50ID0gZnVuY3Rpb24gKHN0ciwgb3B0aW9ucykge1xuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICAgICAgcmV0dXJuIGludC50ZXN0KHN0cikgJiYgKCFvcHRpb25zLmhhc093blByb3BlcnR5KCdtaW4nKSB8fCBzdHIgPj0gb3B0aW9ucy5taW4pICYmICghb3B0aW9ucy5oYXNPd25Qcm9wZXJ0eSgnbWF4JykgfHwgc3RyIDw9IG9wdGlvbnMubWF4KTtcbiAgICB9O1xuXG4gICAgdmFsaWRhdG9yLmlzRmxvYXQgPSBmdW5jdGlvbiAoc3RyLCBvcHRpb25zKSB7XG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgICAgICByZXR1cm4gc3RyICE9PSAnJyAmJiBmbG9hdC50ZXN0KHN0cikgJiYgKCFvcHRpb25zLmhhc093blByb3BlcnR5KCdtaW4nKSB8fCBzdHIgPj0gb3B0aW9ucy5taW4pICYmICghb3B0aW9ucy5oYXNPd25Qcm9wZXJ0eSgnbWF4JykgfHwgc3RyIDw9IG9wdGlvbnMubWF4KTtcbiAgICB9O1xuXG4gICAgdmFsaWRhdG9yLmlzRGl2aXNpYmxlQnkgPSBmdW5jdGlvbiAoc3RyLCBudW0pIHtcbiAgICAgICAgcmV0dXJuIHZhbGlkYXRvci50b0Zsb2F0KHN0cikgJSB2YWxpZGF0b3IudG9JbnQobnVtKSA9PT0gMDtcbiAgICB9O1xuXG4gICAgdmFsaWRhdG9yLmlzTnVsbCA9IGZ1bmN0aW9uIChzdHIpIHtcbiAgICAgICAgcmV0dXJuIHN0ci5sZW5ndGggPT09IDA7XG4gICAgfTtcblxuICAgIHZhbGlkYXRvci5pc0xlbmd0aCA9IGZ1bmN0aW9uIChzdHIsIG1pbiwgbWF4KSB7XG4gICAgICAgIHZhciBzdXJyb2dhdGVQYWlycyA9IHN0ci5tYXRjaCgvW1xcdUQ4MDAtXFx1REJGRl1bXFx1REMwMC1cXHVERkZGXS9nKSB8fCBbXTtcbiAgICAgICAgdmFyIGxlbiA9IHN0ci5sZW5ndGggLSBzdXJyb2dhdGVQYWlycy5sZW5ndGg7XG4gICAgICAgIHJldHVybiBsZW4gPj0gbWluICYmICh0eXBlb2YgbWF4ID09PSAndW5kZWZpbmVkJyB8fCBsZW4gPD0gbWF4KTtcbiAgICB9O1xuXG4gICAgdmFsaWRhdG9yLmlzQnl0ZUxlbmd0aCA9IGZ1bmN0aW9uIChzdHIsIG1pbiwgbWF4KSB7XG4gICAgICAgIHJldHVybiBzdHIubGVuZ3RoID49IG1pbiAmJiAodHlwZW9mIG1heCA9PT0gJ3VuZGVmaW5lZCcgfHwgc3RyLmxlbmd0aCA8PSBtYXgpO1xuICAgIH07XG5cbiAgICB2YWxpZGF0b3IuaXNVVUlEID0gZnVuY3Rpb24gKHN0ciwgdmVyc2lvbikge1xuICAgICAgICB2YXIgcGF0dGVybiA9IHV1aWRbdmVyc2lvbiA/IHZlcnNpb24gOiAnYWxsJ107XG4gICAgICAgIHJldHVybiBwYXR0ZXJuICYmIHBhdHRlcm4udGVzdChzdHIpO1xuICAgIH07XG5cbiAgICB2YWxpZGF0b3IuaXNEYXRlID0gZnVuY3Rpb24gKHN0cikge1xuICAgICAgICByZXR1cm4gIWlzTmFOKERhdGUucGFyc2Uoc3RyKSk7XG4gICAgfTtcblxuICAgIHZhbGlkYXRvci5pc0FmdGVyID0gZnVuY3Rpb24gKHN0ciwgZGF0ZSkge1xuICAgICAgICB2YXIgY29tcGFyaXNvbiA9IHZhbGlkYXRvci50b0RhdGUoZGF0ZSB8fCBuZXcgRGF0ZSgpKVxuICAgICAgICAgICwgb3JpZ2luYWwgPSB2YWxpZGF0b3IudG9EYXRlKHN0cik7XG4gICAgICAgIHJldHVybiAhIShvcmlnaW5hbCAmJiBjb21wYXJpc29uICYmIG9yaWdpbmFsID4gY29tcGFyaXNvbik7XG4gICAgfTtcblxuICAgIHZhbGlkYXRvci5pc0JlZm9yZSA9IGZ1bmN0aW9uIChzdHIsIGRhdGUpIHtcbiAgICAgICAgdmFyIGNvbXBhcmlzb24gPSB2YWxpZGF0b3IudG9EYXRlKGRhdGUgfHwgbmV3IERhdGUoKSlcbiAgICAgICAgICAsIG9yaWdpbmFsID0gdmFsaWRhdG9yLnRvRGF0ZShzdHIpO1xuICAgICAgICByZXR1cm4gb3JpZ2luYWwgJiYgY29tcGFyaXNvbiAmJiBvcmlnaW5hbCA8IGNvbXBhcmlzb247XG4gICAgfTtcblxuICAgIHZhbGlkYXRvci5pc0luID0gZnVuY3Rpb24gKHN0ciwgb3B0aW9ucykge1xuICAgICAgICB2YXIgaTtcbiAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvcHRpb25zKSA9PT0gJ1tvYmplY3QgQXJyYXldJykge1xuICAgICAgICAgICAgdmFyIGFycmF5ID0gW107XG4gICAgICAgICAgICBmb3IgKGkgaW4gb3B0aW9ucykge1xuICAgICAgICAgICAgICAgIGFycmF5W2ldID0gdmFsaWRhdG9yLnRvU3RyaW5nKG9wdGlvbnNbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGFycmF5LmluZGV4T2Yoc3RyKSA+PSAwO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBvcHRpb25zID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgcmV0dXJuIG9wdGlvbnMuaGFzT3duUHJvcGVydHkoc3RyKTtcbiAgICAgICAgfSBlbHNlIGlmIChvcHRpb25zICYmIHR5cGVvZiBvcHRpb25zLmluZGV4T2YgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHJldHVybiBvcHRpb25zLmluZGV4T2Yoc3RyKSA+PSAwO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuXG4gICAgdmFsaWRhdG9yLmlzQ3JlZGl0Q2FyZCA9IGZ1bmN0aW9uIChzdHIpIHtcbiAgICAgICAgdmFyIHNhbml0aXplZCA9IHN0ci5yZXBsYWNlKC9bXjAtOV0rL2csICcnKTtcbiAgICAgICAgaWYgKCFjcmVkaXRDYXJkLnRlc3Qoc2FuaXRpemVkKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHZhciBzdW0gPSAwLCBkaWdpdCwgdG1wTnVtLCBzaG91bGREb3VibGU7XG4gICAgICAgIGZvciAodmFyIGkgPSBzYW5pdGl6ZWQubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgIGRpZ2l0ID0gc2FuaXRpemVkLnN1YnN0cmluZyhpLCAoaSArIDEpKTtcbiAgICAgICAgICAgIHRtcE51bSA9IHBhcnNlSW50KGRpZ2l0LCAxMCk7XG4gICAgICAgICAgICBpZiAoc2hvdWxkRG91YmxlKSB7XG4gICAgICAgICAgICAgICAgdG1wTnVtICo9IDI7XG4gICAgICAgICAgICAgICAgaWYgKHRtcE51bSA+PSAxMCkge1xuICAgICAgICAgICAgICAgICAgICBzdW0gKz0gKCh0bXBOdW0gJSAxMCkgKyAxKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzdW0gKz0gdG1wTnVtO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc3VtICs9IHRtcE51bTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNob3VsZERvdWJsZSA9ICFzaG91bGREb3VibGU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICEhKChzdW0gJSAxMCkgPT09IDAgPyBzYW5pdGl6ZWQgOiBmYWxzZSk7XG4gICAgfTtcblxuICAgIHZhbGlkYXRvci5pc0lTSU4gPSBmdW5jdGlvbiAoc3RyKSB7XG4gICAgICAgIGlmICghaXNpbi50ZXN0KHN0cikpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBjaGVja3N1bVN0ciA9IHN0ci5yZXBsYWNlKC9bQS1aXS9nLCBmdW5jdGlvbihjaGFyYWN0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBwYXJzZUludChjaGFyYWN0ZXIsIDM2KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIHN1bSA9IDAsIGRpZ2l0LCB0bXBOdW0sIHNob3VsZERvdWJsZSA9IHRydWU7XG4gICAgICAgIGZvciAodmFyIGkgPSBjaGVja3N1bVN0ci5sZW5ndGggLSAyOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgZGlnaXQgPSBjaGVja3N1bVN0ci5zdWJzdHJpbmcoaSwgKGkgKyAxKSk7XG4gICAgICAgICAgICB0bXBOdW0gPSBwYXJzZUludChkaWdpdCwgMTApO1xuICAgICAgICAgICAgaWYgKHNob3VsZERvdWJsZSkge1xuICAgICAgICAgICAgICAgIHRtcE51bSAqPSAyO1xuICAgICAgICAgICAgICAgIGlmICh0bXBOdW0gPj0gMTApIHtcbiAgICAgICAgICAgICAgICAgICAgc3VtICs9IHRtcE51bSArIDE7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc3VtICs9IHRtcE51bTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHN1bSArPSB0bXBOdW07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzaG91bGREb3VibGUgPSAhc2hvdWxkRG91YmxlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHBhcnNlSW50KHN0ci5zdWJzdHIoc3RyLmxlbmd0aCAtIDEpLCAxMCkgPT09ICgxMDAwMCAtIHN1bSkgJSAxMDtcbiAgICB9O1xuXG4gICAgdmFsaWRhdG9yLmlzSVNCTiA9IGZ1bmN0aW9uIChzdHIsIHZlcnNpb24pIHtcbiAgICAgICAgdmVyc2lvbiA9IHZhbGlkYXRvci50b1N0cmluZyh2ZXJzaW9uKTtcbiAgICAgICAgaWYgKCF2ZXJzaW9uKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsaWRhdG9yLmlzSVNCTihzdHIsIDEwKSB8fCB2YWxpZGF0b3IuaXNJU0JOKHN0ciwgMTMpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBzYW5pdGl6ZWQgPSBzdHIucmVwbGFjZSgvW1xccy1dKy9nLCAnJylcbiAgICAgICAgICAsIGNoZWNrc3VtID0gMCwgaTtcbiAgICAgICAgaWYgKHZlcnNpb24gPT09ICcxMCcpIHtcbiAgICAgICAgICAgIGlmICghaXNibjEwTWF5YmUudGVzdChzYW5pdGl6ZWQpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IDk7IGkrKykge1xuICAgICAgICAgICAgICAgIGNoZWNrc3VtICs9IChpICsgMSkgKiBzYW5pdGl6ZWQuY2hhckF0KGkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHNhbml0aXplZC5jaGFyQXQoOSkgPT09ICdYJykge1xuICAgICAgICAgICAgICAgIGNoZWNrc3VtICs9IDEwICogMTA7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNoZWNrc3VtICs9IDEwICogc2FuaXRpemVkLmNoYXJBdCg5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICgoY2hlY2tzdW0gJSAxMSkgPT09IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gISFzYW5pdGl6ZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSAgaWYgKHZlcnNpb24gPT09ICcxMycpIHtcbiAgICAgICAgICAgIGlmICghaXNibjEzTWF5YmUudGVzdChzYW5pdGl6ZWQpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGZhY3RvciA9IFsgMSwgMyBdO1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IDEyOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjaGVja3N1bSArPSBmYWN0b3JbaSAlIDJdICogc2FuaXRpemVkLmNoYXJBdChpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzYW5pdGl6ZWQuY2hhckF0KDEyKSAtICgoMTAgLSAoY2hlY2tzdW0gJSAxMCkpICUgMTApID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICEhc2FuaXRpemVkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuXG4gICAgdmFsaWRhdG9yLmlzTW9iaWxlUGhvbmUgPSBmdW5jdGlvbihzdHIsIGxvY2FsZSkge1xuICAgICAgICBpZiAobG9jYWxlIGluIHBob25lcykge1xuICAgICAgICAgICAgcmV0dXJuIHBob25lc1tsb2NhbGVdLnRlc3Qoc3RyKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcblxuICAgIHZhciBkZWZhdWx0X2N1cnJlbmN5X29wdGlvbnMgPSB7XG4gICAgICAgIHN5bWJvbDogJyQnXG4gICAgICAsIHJlcXVpcmVfc3ltYm9sOiBmYWxzZVxuICAgICAgLCBhbGxvd19zcGFjZV9hZnRlcl9zeW1ib2w6IGZhbHNlXG4gICAgICAsIHN5bWJvbF9hZnRlcl9kaWdpdHM6IGZhbHNlXG4gICAgICAsIGFsbG93X25lZ2F0aXZlczogdHJ1ZVxuICAgICAgLCBwYXJlbnNfZm9yX25lZ2F0aXZlczogZmFsc2VcbiAgICAgICwgbmVnYXRpdmVfc2lnbl9iZWZvcmVfZGlnaXRzOiBmYWxzZVxuICAgICAgLCBuZWdhdGl2ZV9zaWduX2FmdGVyX2RpZ2l0czogZmFsc2VcbiAgICAgICwgYWxsb3dfbmVnYXRpdmVfc2lnbl9wbGFjZWhvbGRlcjogZmFsc2VcbiAgICAgICwgdGhvdXNhbmRzX3NlcGFyYXRvcjogJywnXG4gICAgICAsIGRlY2ltYWxfc2VwYXJhdG9yOiAnLidcbiAgICAgICwgYWxsb3dfc3BhY2VfYWZ0ZXJfZGlnaXRzOiBmYWxzZVxuICAgIH07XG5cbiAgICB2YWxpZGF0b3IuaXNDdXJyZW5jeSA9IGZ1bmN0aW9uIChzdHIsIG9wdGlvbnMpIHtcbiAgICAgICAgb3B0aW9ucyA9IG1lcmdlKG9wdGlvbnMsIGRlZmF1bHRfY3VycmVuY3lfb3B0aW9ucyk7XG5cbiAgICAgICAgcmV0dXJuIGN1cnJlbmN5UmVnZXgob3B0aW9ucykudGVzdChzdHIpO1xuICAgIH07XG5cbiAgICB2YWxpZGF0b3IuaXNKU09OID0gZnVuY3Rpb24gKHN0cikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgSlNPTi5wYXJzZShzdHIpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcblxuICAgIHZhbGlkYXRvci5pc011bHRpYnl0ZSA9IGZ1bmN0aW9uIChzdHIpIHtcbiAgICAgICAgcmV0dXJuIG11bHRpYnl0ZS50ZXN0KHN0cik7XG4gICAgfTtcblxuICAgIHZhbGlkYXRvci5pc0FzY2lpID0gZnVuY3Rpb24gKHN0cikge1xuICAgICAgICByZXR1cm4gYXNjaWkudGVzdChzdHIpO1xuICAgIH07XG5cbiAgICB2YWxpZGF0b3IuaXNGdWxsV2lkdGggPSBmdW5jdGlvbiAoc3RyKSB7XG4gICAgICAgIHJldHVybiBmdWxsV2lkdGgudGVzdChzdHIpO1xuICAgIH07XG5cbiAgICB2YWxpZGF0b3IuaXNIYWxmV2lkdGggPSBmdW5jdGlvbiAoc3RyKSB7XG4gICAgICAgIHJldHVybiBoYWxmV2lkdGgudGVzdChzdHIpO1xuICAgIH07XG5cbiAgICB2YWxpZGF0b3IuaXNWYXJpYWJsZVdpZHRoID0gZnVuY3Rpb24gKHN0cikge1xuICAgICAgICByZXR1cm4gZnVsbFdpZHRoLnRlc3Qoc3RyKSAmJiBoYWxmV2lkdGgudGVzdChzdHIpO1xuICAgIH07XG5cbiAgICB2YWxpZGF0b3IuaXNTdXJyb2dhdGVQYWlyID0gZnVuY3Rpb24gKHN0cikge1xuICAgICAgICByZXR1cm4gc3Vycm9nYXRlUGFpci50ZXN0KHN0cik7XG4gICAgfTtcblxuICAgIHZhbGlkYXRvci5pc0Jhc2U2NCA9IGZ1bmN0aW9uIChzdHIpIHtcbiAgICAgICAgcmV0dXJuIGJhc2U2NC50ZXN0KHN0cik7XG4gICAgfTtcblxuICAgIHZhbGlkYXRvci5pc01vbmdvSWQgPSBmdW5jdGlvbiAoc3RyKSB7XG4gICAgICAgIHJldHVybiB2YWxpZGF0b3IuaXNIZXhhZGVjaW1hbChzdHIpICYmIHN0ci5sZW5ndGggPT09IDI0O1xuICAgIH07XG5cbiAgICB2YWxpZGF0b3IubHRyaW0gPSBmdW5jdGlvbiAoc3RyLCBjaGFycykge1xuICAgICAgICB2YXIgcGF0dGVybiA9IGNoYXJzID8gbmV3IFJlZ0V4cCgnXlsnICsgY2hhcnMgKyAnXSsnLCAnZycpIDogL15cXHMrL2c7XG4gICAgICAgIHJldHVybiBzdHIucmVwbGFjZShwYXR0ZXJuLCAnJyk7XG4gICAgfTtcblxuICAgIHZhbGlkYXRvci5ydHJpbSA9IGZ1bmN0aW9uIChzdHIsIGNoYXJzKSB7XG4gICAgICAgIHZhciBwYXR0ZXJuID0gY2hhcnMgPyBuZXcgUmVnRXhwKCdbJyArIGNoYXJzICsgJ10rJCcsICdnJykgOiAvXFxzKyQvZztcbiAgICAgICAgcmV0dXJuIHN0ci5yZXBsYWNlKHBhdHRlcm4sICcnKTtcbiAgICB9O1xuXG4gICAgdmFsaWRhdG9yLnRyaW0gPSBmdW5jdGlvbiAoc3RyLCBjaGFycykge1xuICAgICAgICB2YXIgcGF0dGVybiA9IGNoYXJzID8gbmV3IFJlZ0V4cCgnXlsnICsgY2hhcnMgKyAnXSt8WycgKyBjaGFycyArICddKyQnLCAnZycpIDogL15cXHMrfFxccyskL2c7XG4gICAgICAgIHJldHVybiBzdHIucmVwbGFjZShwYXR0ZXJuLCAnJyk7XG4gICAgfTtcblxuICAgIHZhbGlkYXRvci5lc2NhcGUgPSBmdW5jdGlvbiAoc3RyKSB7XG4gICAgICAgIHJldHVybiAoc3RyLnJlcGxhY2UoLyYvZywgJyZhbXA7JylcbiAgICAgICAgICAgIC5yZXBsYWNlKC9cIi9nLCAnJnF1b3Q7JylcbiAgICAgICAgICAgIC5yZXBsYWNlKC8nL2csICcmI3gyNzsnKVxuICAgICAgICAgICAgLnJlcGxhY2UoLzwvZywgJyZsdDsnKVxuICAgICAgICAgICAgLnJlcGxhY2UoLz4vZywgJyZndDsnKVxuICAgICAgICAgICAgLnJlcGxhY2UoL1xcLy9nLCAnJiN4MkY7JylcbiAgICAgICAgICAgIC5yZXBsYWNlKC9cXGAvZywgJyYjOTY7JykpO1xuICAgIH07XG5cbiAgICB2YWxpZGF0b3Iuc3RyaXBMb3cgPSBmdW5jdGlvbiAoc3RyLCBrZWVwX25ld19saW5lcykge1xuICAgICAgICB2YXIgY2hhcnMgPSBrZWVwX25ld19saW5lcyA/ICdcXFxceDAwLVxcXFx4MDlcXFxceDBCXFxcXHgwQ1xcXFx4MEUtXFxcXHgxRlxcXFx4N0YnIDogJ1xcXFx4MDAtXFxcXHgxRlxcXFx4N0YnO1xuICAgICAgICByZXR1cm4gdmFsaWRhdG9yLmJsYWNrbGlzdChzdHIsIGNoYXJzKTtcbiAgICB9O1xuXG4gICAgdmFsaWRhdG9yLndoaXRlbGlzdCA9IGZ1bmN0aW9uIChzdHIsIGNoYXJzKSB7XG4gICAgICAgIHJldHVybiBzdHIucmVwbGFjZShuZXcgUmVnRXhwKCdbXicgKyBjaGFycyArICddKycsICdnJyksICcnKTtcbiAgICB9O1xuXG4gICAgdmFsaWRhdG9yLmJsYWNrbGlzdCA9IGZ1bmN0aW9uIChzdHIsIGNoYXJzKSB7XG4gICAgICAgIHJldHVybiBzdHIucmVwbGFjZShuZXcgUmVnRXhwKCdbJyArIGNoYXJzICsgJ10rJywgJ2cnKSwgJycpO1xuICAgIH07XG5cbiAgICB2YXIgZGVmYXVsdF9ub3JtYWxpemVfZW1haWxfb3B0aW9ucyA9IHtcbiAgICAgICAgbG93ZXJjYXNlOiB0cnVlXG4gICAgfTtcblxuICAgIHZhbGlkYXRvci5ub3JtYWxpemVFbWFpbCA9IGZ1bmN0aW9uIChlbWFpbCwgb3B0aW9ucykge1xuICAgICAgICBvcHRpb25zID0gbWVyZ2Uob3B0aW9ucywgZGVmYXVsdF9ub3JtYWxpemVfZW1haWxfb3B0aW9ucyk7XG4gICAgICAgIGlmICghdmFsaWRhdG9yLmlzRW1haWwoZW1haWwpKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHBhcnRzID0gZW1haWwuc3BsaXQoJ0AnLCAyKTtcbiAgICAgICAgcGFydHNbMV0gPSBwYXJ0c1sxXS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICBpZiAocGFydHNbMV0gPT09ICdnbWFpbC5jb20nIHx8IHBhcnRzWzFdID09PSAnZ29vZ2xlbWFpbC5jb20nKSB7XG4gICAgICAgICAgICBwYXJ0c1swXSA9IHBhcnRzWzBdLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXFwuL2csICcnKTtcbiAgICAgICAgICAgIGlmIChwYXJ0c1swXVswXSA9PT0gJysnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcGFydHNbMF0gPSBwYXJ0c1swXS5zcGxpdCgnKycpWzBdO1xuICAgICAgICAgICAgcGFydHNbMV0gPSAnZ21haWwuY29tJztcbiAgICAgICAgfSBlbHNlIGlmIChvcHRpb25zLmxvd2VyY2FzZSkge1xuICAgICAgICAgICAgcGFydHNbMF0gPSBwYXJ0c1swXS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwYXJ0cy5qb2luKCdAJyk7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIG1lcmdlKG9iaiwgZGVmYXVsdHMpIHtcbiAgICAgICAgb2JqID0gb2JqIHx8IHt9O1xuICAgICAgICBmb3IgKHZhciBrZXkgaW4gZGVmYXVsdHMpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqW2tleV0gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgb2JqW2tleV0gPSBkZWZhdWx0c1trZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvYmo7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3VycmVuY3lSZWdleChvcHRpb25zKSB7XG4gICAgICAgIHZhciBzeW1ib2wgPSAnKFxcXFwnICsgb3B0aW9ucy5zeW1ib2wucmVwbGFjZSgvXFwuL2csICdcXFxcLicpICsgJyknICsgKG9wdGlvbnMucmVxdWlyZV9zeW1ib2wgPyAnJyA6ICc/JylcbiAgICAgICAgICAgICwgbmVnYXRpdmUgPSAnLT8nXG4gICAgICAgICAgICAsIHdob2xlX2RvbGxhcl9hbW91bnRfd2l0aG91dF9zZXAgPSAnWzEtOV1cXFxcZConXG4gICAgICAgICAgICAsIHdob2xlX2RvbGxhcl9hbW91bnRfd2l0aF9zZXAgPSAnWzEtOV1cXFxcZHswLDJ9KFxcXFwnICsgb3B0aW9ucy50aG91c2FuZHNfc2VwYXJhdG9yICsgJ1xcXFxkezN9KSonXG4gICAgICAgICAgICAsIHZhbGlkX3dob2xlX2RvbGxhcl9hbW91bnRzID0gWycwJywgd2hvbGVfZG9sbGFyX2Ftb3VudF93aXRob3V0X3NlcCwgd2hvbGVfZG9sbGFyX2Ftb3VudF93aXRoX3NlcF1cbiAgICAgICAgICAgICwgd2hvbGVfZG9sbGFyX2Ftb3VudCA9ICcoJyArIHZhbGlkX3dob2xlX2RvbGxhcl9hbW91bnRzLmpvaW4oJ3wnKSArICcpPydcbiAgICAgICAgICAgICwgZGVjaW1hbF9hbW91bnQgPSAnKFxcXFwnICsgb3B0aW9ucy5kZWNpbWFsX3NlcGFyYXRvciArICdcXFxcZHsyfSk/JztcbiAgICAgICAgdmFyIHBhdHRlcm4gPSB3aG9sZV9kb2xsYXJfYW1vdW50ICsgZGVjaW1hbF9hbW91bnQ7XG4gICAgICAgIC8vIGRlZmF1bHQgaXMgbmVnYXRpdmUgc2lnbiBiZWZvcmUgc3ltYm9sLCBidXQgdGhlcmUgYXJlIHR3byBvdGhlciBvcHRpb25zIChiZXNpZGVzIHBhcmVucylcbiAgICAgICAgaWYgKG9wdGlvbnMuYWxsb3dfbmVnYXRpdmVzICYmICFvcHRpb25zLnBhcmVuc19mb3JfbmVnYXRpdmVzKSB7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5uZWdhdGl2ZV9zaWduX2FmdGVyX2RpZ2l0cykge1xuICAgICAgICAgICAgICAgIHBhdHRlcm4gKz0gbmVnYXRpdmU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChvcHRpb25zLm5lZ2F0aXZlX3NpZ25fYmVmb3JlX2RpZ2l0cykge1xuICAgICAgICAgICAgICAgIHBhdHRlcm4gPSBuZWdhdGl2ZSArIHBhdHRlcm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gU291dGggQWZyaWNhbiBSYW5kLCBmb3IgZXhhbXBsZSwgdXNlcyBSIDEyMyAoc3BhY2UpIGFuZCBSLTEyMyAobm8gc3BhY2UpXG4gICAgICAgIGlmIChvcHRpb25zLmFsbG93X25lZ2F0aXZlX3NpZ25fcGxhY2Vob2xkZXIpIHtcbiAgICAgICAgICAgIHBhdHRlcm4gPSAnKCAoPyFcXFxcLSkpPycgKyBwYXR0ZXJuO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG9wdGlvbnMuYWxsb3dfc3BhY2VfYWZ0ZXJfc3ltYm9sKSB7XG4gICAgICAgICAgICBwYXR0ZXJuID0gJyA/JyArIHBhdHRlcm47XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAob3B0aW9ucy5hbGxvd19zcGFjZV9hZnRlcl9kaWdpdHMpIHtcbiAgICAgICAgICAgIHBhdHRlcm4gKz0gJyggKD8hJCkpPyc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9wdGlvbnMuc3ltYm9sX2FmdGVyX2RpZ2l0cykge1xuICAgICAgICAgICAgcGF0dGVybiArPSBzeW1ib2w7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwYXR0ZXJuID0gc3ltYm9sICsgcGF0dGVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAob3B0aW9ucy5hbGxvd19uZWdhdGl2ZXMpIHtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLnBhcmVuc19mb3JfbmVnYXRpdmVzKSB7XG4gICAgICAgICAgICAgICAgcGF0dGVybiA9ICcoXFxcXCgnICsgcGF0dGVybiArICdcXFxcKXwnICsgcGF0dGVybiArICcpJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKCEob3B0aW9ucy5uZWdhdGl2ZV9zaWduX2JlZm9yZV9kaWdpdHMgfHwgb3B0aW9ucy5uZWdhdGl2ZV9zaWduX2FmdGVyX2RpZ2l0cykpIHtcbiAgICAgICAgICAgICAgICBwYXR0ZXJuID0gbmVnYXRpdmUgKyBwYXR0ZXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgUmVnRXhwKFxuICAgICAgICAgICAgJ14nICtcbiAgICAgICAgICAgIC8vIGVuc3VyZSB0aGVyZSdzIGEgZG9sbGFyIGFuZC9vciBkZWNpbWFsIGFtb3VudCwgYW5kIHRoYXQgaXQgZG9lc24ndCBzdGFydCB3aXRoIGEgc3BhY2Ugb3IgYSBuZWdhdGl2ZSBzaWduIGZvbGxvd2VkIGJ5IGEgc3BhY2VcbiAgICAgICAgICAgICcoPyEtPyApKD89LipcXFxcZCknICtcbiAgICAgICAgICAgIHBhdHRlcm4gK1xuICAgICAgICAgICAgJyQnXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgdmFsaWRhdG9yLmluaXQoKTtcblxuICAgIHJldHVybiB2YWxpZGF0b3I7XG5cbn0pO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXG4gICAgSU5WQUxJRF9UWVBFOiAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiRXhwZWN0ZWQgdHlwZSB7MH0gYnV0IGZvdW5kIHR5cGUgezF9XCIsXG4gICAgSU5WQUxJRF9GT1JNQVQ6ICAgICAgICAgICAgICAgICAgICAgICAgIFwiT2JqZWN0IGRpZG4ndCBwYXNzIHZhbGlkYXRpb24gZm9yIGZvcm1hdCB7MH06IHsxfVwiLFxuICAgIEVOVU1fTUlTTUFUQ0g6ICAgICAgICAgICAgICAgICAgICAgICAgICBcIk5vIGVudW0gbWF0Y2ggZm9yOiB7MH1cIixcbiAgICBBTllfT0ZfTUlTU0lORzogICAgICAgICAgICAgICAgICAgICAgICAgXCJEYXRhIGRvZXMgbm90IG1hdGNoIGFueSBzY2hlbWFzIGZyb20gJ2FueU9mJ1wiLFxuICAgIE9ORV9PRl9NSVNTSU5HOiAgICAgICAgICAgICAgICAgICAgICAgICBcIkRhdGEgZG9lcyBub3QgbWF0Y2ggYW55IHNjaGVtYXMgZnJvbSAnb25lT2YnXCIsXG4gICAgT05FX09GX01VTFRJUExFOiAgICAgICAgICAgICAgICAgICAgICAgIFwiRGF0YSBpcyB2YWxpZCBhZ2FpbnN0IG1vcmUgdGhhbiBvbmUgc2NoZW1hIGZyb20gJ29uZU9mJ1wiLFxuICAgIE5PVF9QQVNTRUQ6ICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIkRhdGEgbWF0Y2hlcyBzY2hlbWEgZnJvbSAnbm90J1wiLFxuXG4gICAgLy8gQXJyYXkgZXJyb3JzXG4gICAgQVJSQVlfTEVOR1RIX1NIT1JUOiAgICAgICAgICAgICAgICAgICAgIFwiQXJyYXkgaXMgdG9vIHNob3J0ICh7MH0pLCBtaW5pbXVtIHsxfVwiLFxuICAgIEFSUkFZX0xFTkdUSF9MT05HOiAgICAgICAgICAgICAgICAgICAgICBcIkFycmF5IGlzIHRvbyBsb25nICh7MH0pLCBtYXhpbXVtIHsxfVwiLFxuICAgIEFSUkFZX1VOSVFVRTogICAgICAgICAgICAgICAgICAgICAgICAgICBcIkFycmF5IGl0ZW1zIGFyZSBub3QgdW5pcXVlIChpbmRleGVzIHswfSBhbmQgezF9KVwiLFxuICAgIEFSUkFZX0FERElUSU9OQUxfSVRFTVM6ICAgICAgICAgICAgICAgICBcIkFkZGl0aW9uYWwgaXRlbXMgbm90IGFsbG93ZWRcIixcblxuICAgIC8vIE51bWVyaWMgZXJyb3JzXG4gICAgTVVMVElQTEVfT0Y6ICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiVmFsdWUgezB9IGlzIG5vdCBhIG11bHRpcGxlIG9mIHsxfVwiLFxuICAgIE1JTklNVU06ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIlZhbHVlIHswfSBpcyBsZXNzIHRoYW4gbWluaW11bSB7MX1cIixcbiAgICBNSU5JTVVNX0VYQ0xVU0lWRTogICAgICAgICAgICAgICAgICAgICAgXCJWYWx1ZSB7MH0gaXMgZXF1YWwgb3IgbGVzcyB0aGFuIGV4Y2x1c2l2ZSBtaW5pbXVtIHsxfVwiLFxuICAgIE1BWElNVU06ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIlZhbHVlIHswfSBpcyBncmVhdGVyIHRoYW4gbWF4aW11bSB7MX1cIixcbiAgICBNQVhJTVVNX0VYQ0xVU0lWRTogICAgICAgICAgICAgICAgICAgICAgXCJWYWx1ZSB7MH0gaXMgZXF1YWwgb3IgZ3JlYXRlciB0aGFuIGV4Y2x1c2l2ZSBtYXhpbXVtIHsxfVwiLFxuXG4gICAgLy8gT2JqZWN0IGVycm9yc1xuICAgIE9CSkVDVF9QUk9QRVJUSUVTX01JTklNVU06ICAgICAgICAgICAgICBcIlRvbyBmZXcgcHJvcGVydGllcyBkZWZpbmVkICh7MH0pLCBtaW5pbXVtIHsxfVwiLFxuICAgIE9CSkVDVF9QUk9QRVJUSUVTX01BWElNVU06ICAgICAgICAgICAgICBcIlRvbyBtYW55IHByb3BlcnRpZXMgZGVmaW5lZCAoezB9KSwgbWF4aW11bSB7MX1cIixcbiAgICBPQkpFQ1RfTUlTU0lOR19SRVFVSVJFRF9QUk9QRVJUWTogICAgICAgXCJNaXNzaW5nIHJlcXVpcmVkIHByb3BlcnR5OiB7MH1cIixcbiAgICBPQkpFQ1RfQURESVRJT05BTF9QUk9QRVJUSUVTOiAgICAgICAgICAgXCJBZGRpdGlvbmFsIHByb3BlcnRpZXMgbm90IGFsbG93ZWQ6IHswfVwiLFxuICAgIE9CSkVDVF9ERVBFTkRFTkNZX0tFWTogICAgICAgICAgICAgICAgICBcIkRlcGVuZGVuY3kgZmFpbGVkIC0ga2V5IG11c3QgZXhpc3Q6IHswfSAoZHVlIHRvIGtleTogezF9KVwiLFxuXG4gICAgLy8gU3RyaW5nIGVycm9yc1xuICAgIE1JTl9MRU5HVEg6ICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIlN0cmluZyBpcyB0b28gc2hvcnQgKHswfSBjaGFycyksIG1pbmltdW0gezF9XCIsXG4gICAgTUFYX0xFTkdUSDogICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiU3RyaW5nIGlzIHRvbyBsb25nICh7MH0gY2hhcnMpLCBtYXhpbXVtIHsxfVwiLFxuICAgIFBBVFRFUk46ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIlN0cmluZyBkb2VzIG5vdCBtYXRjaCBwYXR0ZXJuIHswfTogezF9XCIsXG5cbiAgICAvLyBTY2hlbWEgdmFsaWRhdGlvbiBlcnJvcnNcbiAgICBLRVlXT1JEX1RZUEVfRVhQRUNURUQ6ICAgICAgICAgICAgICAgICAgXCJLZXl3b3JkICd7MH0nIGlzIGV4cGVjdGVkIHRvIGJlIG9mIHR5cGUgJ3sxfSdcIixcbiAgICBLRVlXT1JEX1VOREVGSU5FRF9TVFJJQ1Q6ICAgICAgICAgICAgICAgXCJLZXl3b3JkICd7MH0nIG11c3QgYmUgZGVmaW5lZCBpbiBzdHJpY3QgbW9kZVwiLFxuICAgIEtFWVdPUkRfVU5FWFBFQ1RFRDogICAgICAgICAgICAgICAgICAgICBcIktleXdvcmQgJ3swfScgaXMgbm90IGV4cGVjdGVkIHRvIGFwcGVhciBpbiB0aGUgc2NoZW1hXCIsXG4gICAgS0VZV09SRF9NVVNUX0JFOiAgICAgICAgICAgICAgICAgICAgICAgIFwiS2V5d29yZCAnezB9JyBtdXN0IGJlIHsxfVwiLFxuICAgIEtFWVdPUkRfREVQRU5ERU5DWTogICAgICAgICAgICAgICAgICAgICBcIktleXdvcmQgJ3swfScgcmVxdWlyZXMga2V5d29yZCAnezF9J1wiLFxuICAgIEtFWVdPUkRfUEFUVEVSTjogICAgICAgICAgICAgICAgICAgICAgICBcIktleXdvcmQgJ3swfScgaXMgbm90IGEgdmFsaWQgUmVnRXhwIHBhdHRlcm46IHsxfVwiLFxuICAgIEtFWVdPUkRfVkFMVUVfVFlQRTogICAgICAgICAgICAgICAgICAgICBcIkVhY2ggZWxlbWVudCBvZiBrZXl3b3JkICd7MH0nIGFycmF5IG11c3QgYmUgYSAnezF9J1wiLFxuICAgIFVOS05PV05fRk9STUFUOiAgICAgICAgICAgICAgICAgICAgICAgICBcIlRoZXJlIGlzIG5vIHZhbGlkYXRpb24gZnVuY3Rpb24gZm9yIGZvcm1hdCAnezB9J1wiLFxuICAgIENVU1RPTV9NT0RFX0ZPUkNFX1BST1BFUlRJRVM6ICAgICAgICAgICBcInswfSBtdXN0IGRlZmluZSBhdCBsZWFzdCBvbmUgcHJvcGVydHkgaWYgcHJlc2VudFwiLFxuXG4gICAgLy8gUmVtb3RlIGVycm9yc1xuICAgIFJFRl9VTlJFU09MVkVEOiAgICAgICAgICAgICAgICAgICAgICAgICBcIlJlZmVyZW5jZSBoYXMgbm90IGJlZW4gcmVzb2x2ZWQgZHVyaW5nIGNvbXBpbGF0aW9uOiB7MH1cIixcbiAgICBVTlJFU09MVkFCTEVfUkVGRVJFTkNFOiAgICAgICAgICAgICAgICAgXCJSZWZlcmVuY2UgY291bGQgbm90IGJlIHJlc29sdmVkOiB7MH1cIixcbiAgICBTQ0hFTUFfTk9UX1JFQUNIQUJMRTogICAgICAgICAgICAgICAgICAgXCJWYWxpZGF0b3Igd2FzIG5vdCBhYmxlIHRvIHJlYWQgc2NoZW1hIHdpdGggdXJpOiB7MH1cIixcbiAgICBTQ0hFTUFfVFlQRV9FWFBFQ1RFRDogICAgICAgICAgICAgICAgICAgXCJTY2hlbWEgaXMgZXhwZWN0ZWQgdG8gYmUgb2YgdHlwZSAnb2JqZWN0J1wiLFxuICAgIFNDSEVNQV9OT1RfQU5fT0JKRUNUOiAgICAgICAgICAgICAgICAgICBcIlNjaGVtYSBpcyBub3QgYW4gb2JqZWN0OiB7MH1cIixcbiAgICBBU1lOQ19USU1FT1VUOiAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ7MH0gYXN5bmNocm9ub3VzIHRhc2socykgaGF2ZSB0aW1lZCBvdXQgYWZ0ZXIgezF9IG1zXCIsXG4gICAgUEFSRU5UX1NDSEVNQV9WQUxJREFUSU9OX0ZBSUxFRDogICAgICAgIFwiU2NoZW1hIGZhaWxlZCB0byB2YWxpZGF0ZSBhZ2FpbnN0IGl0cyBwYXJlbnQgc2NoZW1hLCBzZWUgaW5uZXIgZXJyb3JzIGZvciBkZXRhaWxzLlwiLFxuICAgIFJFTU9URV9OT1RfVkFMSUQ6ICAgICAgICAgICAgICAgICAgICAgICBcIlJlbW90ZSByZWZlcmVuY2UgZGlkbid0IGNvbXBpbGUgc3VjY2Vzc2Z1bGx5OiB7MH1cIlxuXG59O1xuIiwiLypqc2hpbnQgbWF4bGVuOiBmYWxzZSovXG5cbnZhciB2YWxpZGF0b3IgPSByZXF1aXJlKFwidmFsaWRhdG9yXCIpO1xuXG52YXIgRm9ybWF0VmFsaWRhdG9ycyA9IHtcbiAgICBcImRhdGVcIjogZnVuY3Rpb24gKGRhdGUpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBkYXRlICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICAvLyBmdWxsLWRhdGUgZnJvbSBodHRwOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmMzMzM5I3NlY3Rpb24tNS42XG4gICAgICAgIHZhciBtYXRjaGVzID0gL14oWzAtOV17NH0pLShbMC05XXsyfSktKFswLTldezJ9KSQvLmV4ZWMoZGF0ZSk7XG4gICAgICAgIGlmIChtYXRjaGVzID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgLy8gdmFyIHllYXIgPSBtYXRjaGVzWzFdO1xuICAgICAgICAvLyB2YXIgbW9udGggPSBtYXRjaGVzWzJdO1xuICAgICAgICAvLyB2YXIgZGF5ID0gbWF0Y2hlc1szXTtcbiAgICAgICAgaWYgKG1hdGNoZXNbMl0gPCBcIjAxXCIgfHwgbWF0Y2hlc1syXSA+IFwiMTJcIiB8fCBtYXRjaGVzWzNdIDwgXCIwMVwiIHx8IG1hdGNoZXNbM10gPiBcIjMxXCIpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9LFxuICAgIFwiZGF0ZS10aW1lXCI6IGZ1bmN0aW9uIChkYXRlVGltZSkge1xuICAgICAgICBpZiAodHlwZW9mIGRhdGVUaW1lICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICAvLyBkYXRlLXRpbWUgZnJvbSBodHRwOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmMzMzM5I3NlY3Rpb24tNS42XG4gICAgICAgIHZhciBzID0gZGF0ZVRpbWUudG9Mb3dlckNhc2UoKS5zcGxpdChcInRcIik7XG4gICAgICAgIGlmICghRm9ybWF0VmFsaWRhdG9ycy5kYXRlKHNbMF0pKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG1hdGNoZXMgPSAvXihbMC05XXsyfSk6KFswLTldezJ9KTooWzAtOV17Mn0pKC5bMC05XSspPyh6fChbKy1dWzAtOV17Mn06WzAtOV17Mn0pKSQvLmV4ZWMoc1sxXSk7XG4gICAgICAgIGlmIChtYXRjaGVzID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgLy8gdmFyIGhvdXIgPSBtYXRjaGVzWzFdO1xuICAgICAgICAvLyB2YXIgbWludXRlID0gbWF0Y2hlc1syXTtcbiAgICAgICAgLy8gdmFyIHNlY29uZCA9IG1hdGNoZXNbM107XG4gICAgICAgIC8vIHZhciBmcmFjdGlvbiA9IG1hdGNoZXNbNF07XG4gICAgICAgIC8vIHZhciB0aW1lem9uZSA9IG1hdGNoZXNbNV07XG4gICAgICAgIGlmIChtYXRjaGVzWzFdID4gXCIyM1wiIHx8IG1hdGNoZXNbMl0gPiBcIjU5XCIgfHwgbWF0Y2hlc1szXSA+IFwiNTlcIikge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH0sXG4gICAgXCJlbWFpbFwiOiBmdW5jdGlvbiAoZW1haWwpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBlbWFpbCAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZhbGlkYXRvci5pc0VtYWlsKGVtYWlsLCB7IFwicmVxdWlyZV90bGRcIjogdHJ1ZSB9KTtcbiAgICB9LFxuICAgIFwiaG9zdG5hbWVcIjogZnVuY3Rpb24gKGhvc3RuYW1lKSB7XG4gICAgICAgIGlmICh0eXBlb2YgaG9zdG5hbWUgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIC8qXG4gICAgICAgICAgICBodHRwOi8vanNvbi1zY2hlbWEub3JnL2xhdGVzdC9qc29uLXNjaGVtYS12YWxpZGF0aW9uLmh0bWwjYW5jaG9yMTE0XG4gICAgICAgICAgICBBIHN0cmluZyBpbnN0YW5jZSBpcyB2YWxpZCBhZ2FpbnN0IHRoaXMgYXR0cmlidXRlIGlmIGl0IGlzIGEgdmFsaWRcbiAgICAgICAgICAgIHJlcHJlc2VudGF0aW9uIGZvciBhbiBJbnRlcm5ldCBob3N0IG5hbWUsIGFzIGRlZmluZWQgYnkgUkZDIDEwMzQsIHNlY3Rpb24gMy4xIFtSRkMxMDM0XS5cblxuICAgICAgICAgICAgaHR0cDovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjMTAzNCNzZWN0aW9uLTMuNVxuXG4gICAgICAgICAgICA8ZGlnaXQ+IDo6PSBhbnkgb25lIG9mIHRoZSB0ZW4gZGlnaXRzIDAgdGhyb3VnaCA5XG4gICAgICAgICAgICB2YXIgZGlnaXQgPSAvWzAtOV0vO1xuXG4gICAgICAgICAgICA8bGV0dGVyPiA6Oj0gYW55IG9uZSBvZiB0aGUgNTIgYWxwaGFiZXRpYyBjaGFyYWN0ZXJzIEEgdGhyb3VnaCBaIGluIHVwcGVyIGNhc2UgYW5kIGEgdGhyb3VnaCB6IGluIGxvd2VyIGNhc2VcbiAgICAgICAgICAgIHZhciBsZXR0ZXIgPSAvW2EtekEtWl0vO1xuXG4gICAgICAgICAgICA8bGV0LWRpZz4gOjo9IDxsZXR0ZXI+IHwgPGRpZ2l0PlxuICAgICAgICAgICAgdmFyIGxldERpZyA9IC9bMC05YS16QS1aXS87XG5cbiAgICAgICAgICAgIDxsZXQtZGlnLWh5cD4gOjo9IDxsZXQtZGlnPiB8IFwiLVwiXG4gICAgICAgICAgICB2YXIgbGV0RGlnSHlwID0gL1stMC05YS16QS1aXS87XG5cbiAgICAgICAgICAgIDxsZGgtc3RyPiA6Oj0gPGxldC1kaWctaHlwPiB8IDxsZXQtZGlnLWh5cD4gPGxkaC1zdHI+XG4gICAgICAgICAgICB2YXIgbGRoU3RyID0gL1stMC05YS16QS1aXSsvO1xuXG4gICAgICAgICAgICA8bGFiZWw+IDo6PSA8bGV0dGVyPiBbIFsgPGxkaC1zdHI+IF0gPGxldC1kaWc+IF1cbiAgICAgICAgICAgIHZhciBsYWJlbCA9IC9bYS16QS1aXSgoWy0wLTlhLXpBLVpdKyk/WzAtOWEtekEtWl0pPy87XG5cbiAgICAgICAgICAgIDxzdWJkb21haW4+IDo6PSA8bGFiZWw+IHwgPHN1YmRvbWFpbj4gXCIuXCIgPGxhYmVsPlxuICAgICAgICAgICAgdmFyIHN1YmRvbWFpbiA9IC9eW2EtekEtWl0oKFstMC05YS16QS1aXSspP1swLTlhLXpBLVpdKT8oXFwuW2EtekEtWl0oKFstMC05YS16QS1aXSspP1swLTlhLXpBLVpdKT8pKiQvO1xuXG4gICAgICAgICAgICA8ZG9tYWluPiA6Oj0gPHN1YmRvbWFpbj4gfCBcIiBcIlxuICAgICAgICAgICAgdmFyIGRvbWFpbiA9IG51bGw7XG4gICAgICAgICovXG4gICAgICAgIHZhciB2YWxpZCA9IC9eW2EtekEtWl0oKFstMC05YS16QS1aXSspP1swLTlhLXpBLVpdKT8oXFwuW2EtekEtWl0oKFstMC05YS16QS1aXSspP1swLTlhLXpBLVpdKT8pKiQvLnRlc3QoaG9zdG5hbWUpO1xuICAgICAgICBpZiAodmFsaWQpIHtcbiAgICAgICAgICAgIC8vIHRoZSBzdW0gb2YgYWxsIGxhYmVsIG9jdGV0cyBhbmQgbGFiZWwgbGVuZ3RocyBpcyBsaW1pdGVkIHRvIDI1NS5cbiAgICAgICAgICAgIGlmIChob3N0bmFtZS5sZW5ndGggPiAyNTUpIHsgcmV0dXJuIGZhbHNlOyB9XG4gICAgICAgICAgICAvLyBFYWNoIG5vZGUgaGFzIGEgbGFiZWwsIHdoaWNoIGlzIHplcm8gdG8gNjMgb2N0ZXRzIGluIGxlbmd0aFxuICAgICAgICAgICAgdmFyIGxhYmVscyA9IGhvc3RuYW1lLnNwbGl0KFwiLlwiKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGFiZWxzLmxlbmd0aDsgaSsrKSB7IGlmIChsYWJlbHNbaV0ubGVuZ3RoID4gNjMpIHsgcmV0dXJuIGZhbHNlOyB9IH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdmFsaWQ7XG4gICAgfSxcbiAgICBcImhvc3QtbmFtZVwiOiBmdW5jdGlvbiAoaG9zdG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIEZvcm1hdFZhbGlkYXRvcnMuaG9zdG5hbWUuY2FsbCh0aGlzLCBob3N0bmFtZSk7XG4gICAgfSxcbiAgICBcImlwdjRcIjogZnVuY3Rpb24gKGlwdjQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBpcHY0ICE9PSBcInN0cmluZ1wiKSB7IHJldHVybiB0cnVlOyB9XG4gICAgICAgIHJldHVybiB2YWxpZGF0b3IuaXNJUChpcHY0LCA0KTtcbiAgICB9LFxuICAgIFwiaXB2NlwiOiBmdW5jdGlvbiAoaXB2Nikge1xuICAgICAgICBpZiAodHlwZW9mIGlwdjYgIT09IFwic3RyaW5nXCIpIHsgcmV0dXJuIHRydWU7IH1cbiAgICAgICAgcmV0dXJuIHZhbGlkYXRvci5pc0lQKGlwdjYsIDYpO1xuICAgIH0sXG4gICAgXCJyZWdleFwiOiBmdW5jdGlvbiAoc3RyKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBSZWdFeHAoc3RyKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIFwidXJpXCI6IGZ1bmN0aW9uICh1cmkpIHtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5zdHJpY3RVcmlzKSB7XG4gICAgICAgICAgICByZXR1cm4gRm9ybWF0VmFsaWRhdG9yc1tcInN0cmljdC11cmlcIl0uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vemFnZ2luby96LXNjaGVtYS9pc3N1ZXMvMThcbiAgICAgICAgLy8gUmVnRXhwIGZyb20gaHR0cDovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjMzk4NiNhcHBlbmRpeC1CXG4gICAgICAgIHJldHVybiB0eXBlb2YgdXJpICE9PSBcInN0cmluZ1wiIHx8IFJlZ0V4cChcIl4oKFteOi8/I10rKTopPygvLyhbXi8/I10qKSk/KFtePyNdKikoXFxcXD8oW14jXSopKT8oIyguKikpP1wiKS50ZXN0KHVyaSk7XG4gICAgfSxcbiAgICBcInN0cmljdC11cmlcIjogZnVuY3Rpb24gKHVyaSkge1xuICAgICAgICByZXR1cm4gdHlwZW9mIHVyaSAhPT0gXCJzdHJpbmdcIiB8fCB2YWxpZGF0b3IuaXNVUkwodXJpKTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZvcm1hdFZhbGlkYXRvcnM7XG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIEZvcm1hdFZhbGlkYXRvcnMgID0gcmVxdWlyZShcIi4vRm9ybWF0VmFsaWRhdG9yc1wiKSxcbiAgICBSZXBvcnQgICAgICAgICAgICA9IHJlcXVpcmUoXCIuL1JlcG9ydFwiKSxcbiAgICBVdGlscyAgICAgICAgICAgICA9IHJlcXVpcmUoXCIuL1V0aWxzXCIpO1xuXG52YXIgSnNvblZhbGlkYXRvcnMgPSB7XG4gICAgbXVsdGlwbGVPZjogZnVuY3Rpb24gKHJlcG9ydCwgc2NoZW1hLCBqc29uKSB7XG4gICAgICAgIC8vIGh0dHA6Ly9qc29uLXNjaGVtYS5vcmcvbGF0ZXN0L2pzb24tc2NoZW1hLXZhbGlkYXRpb24uaHRtbCNyZmMuc2VjdGlvbi41LjEuMS4yXG4gICAgICAgIGlmICh0eXBlb2YganNvbiAhPT0gXCJudW1iZXJcIikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChVdGlscy53aGF0SXMoanNvbiAvIHNjaGVtYS5tdWx0aXBsZU9mKSAhPT0gXCJpbnRlZ2VyXCIpIHtcbiAgICAgICAgICAgIHJlcG9ydC5hZGRFcnJvcihcIk1VTFRJUExFX09GXCIsIFtqc29uLCBzY2hlbWEubXVsdGlwbGVPZl0sIG51bGwsIHNjaGVtYS5kZXNjcmlwdGlvbik7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIG1heGltdW06IGZ1bmN0aW9uIChyZXBvcnQsIHNjaGVtYSwganNvbikge1xuICAgICAgICAvLyBodHRwOi8vanNvbi1zY2hlbWEub3JnL2xhdGVzdC9qc29uLXNjaGVtYS12YWxpZGF0aW9uLmh0bWwjcmZjLnNlY3Rpb24uNS4xLjIuMlxuICAgICAgICBpZiAodHlwZW9mIGpzb24gIT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc2NoZW1hLmV4Y2x1c2l2ZU1heGltdW0gIT09IHRydWUpIHtcbiAgICAgICAgICAgIGlmIChqc29uID4gc2NoZW1hLm1heGltdW0pIHtcbiAgICAgICAgICAgICAgICByZXBvcnQuYWRkRXJyb3IoXCJNQVhJTVVNXCIsIFtqc29uLCBzY2hlbWEubWF4aW11bV0sIG51bGwsIHNjaGVtYS5kZXNjcmlwdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoanNvbiA+PSBzY2hlbWEubWF4aW11bSkge1xuICAgICAgICAgICAgICAgIHJlcG9ydC5hZGRFcnJvcihcIk1BWElNVU1fRVhDTFVTSVZFXCIsIFtqc29uLCBzY2hlbWEubWF4aW11bV0sIG51bGwsIHNjaGVtYS5kZXNjcmlwdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGV4Y2x1c2l2ZU1heGltdW06IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gY292ZXJlZCBpbiBtYXhpbXVtXG4gICAgfSxcbiAgICBtaW5pbXVtOiBmdW5jdGlvbiAocmVwb3J0LCBzY2hlbWEsIGpzb24pIHtcbiAgICAgICAgLy8gaHR0cDovL2pzb24tc2NoZW1hLm9yZy9sYXRlc3QvanNvbi1zY2hlbWEtdmFsaWRhdGlvbi5odG1sI3JmYy5zZWN0aW9uLjUuMS4zLjJcbiAgICAgICAgaWYgKHR5cGVvZiBqc29uICE9PSBcIm51bWJlclwiKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNjaGVtYS5leGNsdXNpdmVNaW5pbXVtICE9PSB0cnVlKSB7XG4gICAgICAgICAgICBpZiAoanNvbiA8IHNjaGVtYS5taW5pbXVtKSB7XG4gICAgICAgICAgICAgICAgcmVwb3J0LmFkZEVycm9yKFwiTUlOSU1VTVwiLCBbanNvbiwgc2NoZW1hLm1pbmltdW1dLCBudWxsLCBzY2hlbWEuZGVzY3JpcHRpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKGpzb24gPD0gc2NoZW1hLm1pbmltdW0pIHtcbiAgICAgICAgICAgICAgICByZXBvcnQuYWRkRXJyb3IoXCJNSU5JTVVNX0VYQ0xVU0lWRVwiLCBbanNvbiwgc2NoZW1hLm1pbmltdW1dLCBudWxsLCBzY2hlbWEuZGVzY3JpcHRpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcbiAgICBleGNsdXNpdmVNaW5pbXVtOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vIGNvdmVyZWQgaW4gbWluaW11bVxuICAgIH0sXG4gICAgbWF4TGVuZ3RoOiBmdW5jdGlvbiAocmVwb3J0LCBzY2hlbWEsIGpzb24pIHtcbiAgICAgICAgLy8gaHR0cDovL2pzb24tc2NoZW1hLm9yZy9sYXRlc3QvanNvbi1zY2hlbWEtdmFsaWRhdGlvbi5odG1sI3JmYy5zZWN0aW9uLjUuMi4xLjJcbiAgICAgICAgaWYgKHR5cGVvZiBqc29uICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKFV0aWxzLnVjczJkZWNvZGUoanNvbikubGVuZ3RoID4gc2NoZW1hLm1heExlbmd0aCkge1xuICAgICAgICAgICAgcmVwb3J0LmFkZEVycm9yKFwiTUFYX0xFTkdUSFwiLCBbanNvbi5sZW5ndGgsIHNjaGVtYS5tYXhMZW5ndGhdLCBudWxsLCBzY2hlbWEuZGVzY3JpcHRpb24pO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBtaW5MZW5ndGg6IGZ1bmN0aW9uIChyZXBvcnQsIHNjaGVtYSwganNvbikge1xuICAgICAgICAvLyBodHRwOi8vanNvbi1zY2hlbWEub3JnL2xhdGVzdC9qc29uLXNjaGVtYS12YWxpZGF0aW9uLmh0bWwjcmZjLnNlY3Rpb24uNS4yLjIuMlxuICAgICAgICBpZiAodHlwZW9mIGpzb24gIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoVXRpbHMudWNzMmRlY29kZShqc29uKS5sZW5ndGggPCBzY2hlbWEubWluTGVuZ3RoKSB7XG4gICAgICAgICAgICByZXBvcnQuYWRkRXJyb3IoXCJNSU5fTEVOR1RIXCIsIFtqc29uLmxlbmd0aCwgc2NoZW1hLm1pbkxlbmd0aF0sIG51bGwsIHNjaGVtYS5kZXNjcmlwdGlvbik7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIHBhdHRlcm46IGZ1bmN0aW9uIChyZXBvcnQsIHNjaGVtYSwganNvbikge1xuICAgICAgICAvLyBodHRwOi8vanNvbi1zY2hlbWEub3JnL2xhdGVzdC9qc29uLXNjaGVtYS12YWxpZGF0aW9uLmh0bWwjcmZjLnNlY3Rpb24uNS4yLjMuMlxuICAgICAgICBpZiAodHlwZW9mIGpzb24gIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoUmVnRXhwKHNjaGVtYS5wYXR0ZXJuKS50ZXN0KGpzb24pID09PSBmYWxzZSkge1xuICAgICAgICAgICAgcmVwb3J0LmFkZEVycm9yKFwiUEFUVEVSTlwiLCBbc2NoZW1hLnBhdHRlcm4sIGpzb25dLCBudWxsLCBzY2hlbWEuZGVzY3JpcHRpb24pO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBhZGRpdGlvbmFsSXRlbXM6IGZ1bmN0aW9uIChyZXBvcnQsIHNjaGVtYSwganNvbikge1xuICAgICAgICAvLyBodHRwOi8vanNvbi1zY2hlbWEub3JnL2xhdGVzdC9qc29uLXNjaGVtYS12YWxpZGF0aW9uLmh0bWwjcmZjLnNlY3Rpb24uNS4zLjEuMlxuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoanNvbikpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvLyBpZiB0aGUgdmFsdWUgb2YgXCJhZGRpdGlvbmFsSXRlbXNcIiBpcyBib29sZWFuIHZhbHVlIGZhbHNlIGFuZCB0aGUgdmFsdWUgb2YgXCJpdGVtc1wiIGlzIGFuIGFycmF5LFxuICAgICAgICAvLyB0aGUganNvbiBpcyB2YWxpZCBpZiBpdHMgc2l6ZSBpcyBsZXNzIHRoYW4sIG9yIGVxdWFsIHRvLCB0aGUgc2l6ZSBvZiBcIml0ZW1zXCIuXG4gICAgICAgIGlmIChzY2hlbWEuYWRkaXRpb25hbEl0ZW1zID09PSBmYWxzZSAmJiBBcnJheS5pc0FycmF5KHNjaGVtYS5pdGVtcykpIHtcbiAgICAgICAgICAgIGlmIChqc29uLmxlbmd0aCA+IHNjaGVtYS5pdGVtcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICByZXBvcnQuYWRkRXJyb3IoXCJBUlJBWV9BRERJVElPTkFMX0lURU1TXCIsIG51bGwsIG51bGwsIHNjaGVtYS5kZXNjcmlwdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGl0ZW1zOiBmdW5jdGlvbiAoKSB7IC8qcmVwb3J0LCBzY2hlbWEsIGpzb24qL1xuICAgICAgICAvLyBjb3ZlcmVkIGluIGFkZGl0aW9uYWxJdGVtc1xuICAgIH0sXG4gICAgbWF4SXRlbXM6IGZ1bmN0aW9uIChyZXBvcnQsIHNjaGVtYSwganNvbikge1xuICAgICAgICAvLyBodHRwOi8vanNvbi1zY2hlbWEub3JnL2xhdGVzdC9qc29uLXNjaGVtYS12YWxpZGF0aW9uLmh0bWwjcmZjLnNlY3Rpb24uNS4zLjIuMlxuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoanNvbikpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoanNvbi5sZW5ndGggPiBzY2hlbWEubWF4SXRlbXMpIHtcbiAgICAgICAgICAgIHJlcG9ydC5hZGRFcnJvcihcIkFSUkFZX0xFTkdUSF9MT05HXCIsIFtqc29uLmxlbmd0aCwgc2NoZW1hLm1heEl0ZW1zXSwgbnVsbCwgc2NoZW1hLmRlc2NyaXB0aW9uKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgbWluSXRlbXM6IGZ1bmN0aW9uIChyZXBvcnQsIHNjaGVtYSwganNvbikge1xuICAgICAgICAvLyBodHRwOi8vanNvbi1zY2hlbWEub3JnL2xhdGVzdC9qc29uLXNjaGVtYS12YWxpZGF0aW9uLmh0bWwjcmZjLnNlY3Rpb24uNS4zLjMuMlxuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoanNvbikpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoanNvbi5sZW5ndGggPCBzY2hlbWEubWluSXRlbXMpIHtcbiAgICAgICAgICAgIHJlcG9ydC5hZGRFcnJvcihcIkFSUkFZX0xFTkdUSF9TSE9SVFwiLCBbanNvbi5sZW5ndGgsIHNjaGVtYS5taW5JdGVtc10sIG51bGwsIHNjaGVtYS5kZXNjcmlwdGlvbik7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIHVuaXF1ZUl0ZW1zOiBmdW5jdGlvbiAocmVwb3J0LCBzY2hlbWEsIGpzb24pIHtcbiAgICAgICAgLy8gaHR0cDovL2pzb24tc2NoZW1hLm9yZy9sYXRlc3QvanNvbi1zY2hlbWEtdmFsaWRhdGlvbi5odG1sI3JmYy5zZWN0aW9uLjUuMy40LjJcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGpzb24pKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNjaGVtYS51bmlxdWVJdGVtcyA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgdmFyIG1hdGNoZXMgPSBbXTtcbiAgICAgICAgICAgIGlmIChVdGlscy5pc1VuaXF1ZUFycmF5KGpzb24sIG1hdGNoZXMpID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIHJlcG9ydC5hZGRFcnJvcihcIkFSUkFZX1VOSVFVRVwiLCBtYXRjaGVzLCBudWxsLCBzY2hlbWEuZGVzY3JpcHRpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcbiAgICBtYXhQcm9wZXJ0aWVzOiBmdW5jdGlvbiAocmVwb3J0LCBzY2hlbWEsIGpzb24pIHtcbiAgICAgICAgLy8gaHR0cDovL2pzb24tc2NoZW1hLm9yZy9sYXRlc3QvanNvbi1zY2hlbWEtdmFsaWRhdGlvbi5odG1sI3JmYy5zZWN0aW9uLjUuNC4xLjJcbiAgICAgICAgaWYgKFV0aWxzLndoYXRJcyhqc29uKSAhPT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciBrZXlzQ291bnQgPSBPYmplY3Qua2V5cyhqc29uKS5sZW5ndGg7XG4gICAgICAgIGlmIChrZXlzQ291bnQgPiBzY2hlbWEubWF4UHJvcGVydGllcykge1xuICAgICAgICAgICAgcmVwb3J0LmFkZEVycm9yKFwiT0JKRUNUX1BST1BFUlRJRVNfTUFYSU1VTVwiLCBba2V5c0NvdW50LCBzY2hlbWEubWF4UHJvcGVydGllc10sIG51bGwsIHNjaGVtYS5kZXNjcmlwdGlvbik7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIG1pblByb3BlcnRpZXM6IGZ1bmN0aW9uIChyZXBvcnQsIHNjaGVtYSwganNvbikge1xuICAgICAgICAvLyBodHRwOi8vanNvbi1zY2hlbWEub3JnL2xhdGVzdC9qc29uLXNjaGVtYS12YWxpZGF0aW9uLmh0bWwjcmZjLnNlY3Rpb24uNS40LjIuMlxuICAgICAgICBpZiAoVXRpbHMud2hhdElzKGpzb24pICE9PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGtleXNDb3VudCA9IE9iamVjdC5rZXlzKGpzb24pLmxlbmd0aDtcbiAgICAgICAgaWYgKGtleXNDb3VudCA8IHNjaGVtYS5taW5Qcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgICByZXBvcnQuYWRkRXJyb3IoXCJPQkpFQ1RfUFJPUEVSVElFU19NSU5JTVVNXCIsIFtrZXlzQ291bnQsIHNjaGVtYS5taW5Qcm9wZXJ0aWVzXSwgbnVsbCwgc2NoZW1hLmRlc2NyaXB0aW9uKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgcmVxdWlyZWQ6IGZ1bmN0aW9uIChyZXBvcnQsIHNjaGVtYSwganNvbikge1xuICAgICAgICAvLyBodHRwOi8vanNvbi1zY2hlbWEub3JnL2xhdGVzdC9qc29uLXNjaGVtYS12YWxpZGF0aW9uLmh0bWwjcmZjLnNlY3Rpb24uNS40LjMuMlxuICAgICAgICBpZiAoVXRpbHMud2hhdElzKGpzb24pICE9PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGlkeCA9IHNjaGVtYS5yZXF1aXJlZC5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChpZHgtLSkge1xuICAgICAgICAgICAgdmFyIHJlcXVpcmVkUHJvcGVydHlOYW1lID0gc2NoZW1hLnJlcXVpcmVkW2lkeF07XG4gICAgICAgICAgICBpZiAoanNvbltyZXF1aXJlZFByb3BlcnR5TmFtZV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHJlcG9ydC5hZGRFcnJvcihcIk9CSkVDVF9NSVNTSU5HX1JFUVVJUkVEX1BST1BFUlRZXCIsIFtyZXF1aXJlZFByb3BlcnR5TmFtZV0sIG51bGwsIHNjaGVtYS5kZXNjcmlwdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGFkZGl0aW9uYWxQcm9wZXJ0aWVzOiBmdW5jdGlvbiAocmVwb3J0LCBzY2hlbWEsIGpzb24pIHtcbiAgICAgICAgLy8gY292ZXJlZCBpbiBwcm9wZXJ0aWVzIGFuZCBwYXR0ZXJuUHJvcGVydGllc1xuICAgICAgICBpZiAoc2NoZW1hLnByb3BlcnRpZXMgPT09IHVuZGVmaW5lZCAmJiBzY2hlbWEucGF0dGVyblByb3BlcnRpZXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIEpzb25WYWxpZGF0b3JzLnByb3BlcnRpZXMuY2FsbCh0aGlzLCByZXBvcnQsIHNjaGVtYSwganNvbik7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIHBhdHRlcm5Qcm9wZXJ0aWVzOiBmdW5jdGlvbiAocmVwb3J0LCBzY2hlbWEsIGpzb24pIHtcbiAgICAgICAgLy8gY292ZXJlZCBpbiBwcm9wZXJ0aWVzXG4gICAgICAgIGlmIChzY2hlbWEucHJvcGVydGllcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gSnNvblZhbGlkYXRvcnMucHJvcGVydGllcy5jYWxsKHRoaXMsIHJlcG9ydCwgc2NoZW1hLCBqc29uKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgcHJvcGVydGllczogZnVuY3Rpb24gKHJlcG9ydCwgc2NoZW1hLCBqc29uKSB7XG4gICAgICAgIC8vIGh0dHA6Ly9qc29uLXNjaGVtYS5vcmcvbGF0ZXN0L2pzb24tc2NoZW1hLXZhbGlkYXRpb24uaHRtbCNyZmMuc2VjdGlvbi41LjQuNC4yXG4gICAgICAgIGlmIChVdGlscy53aGF0SXMoanNvbikgIT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcHJvcGVydGllcyA9IHNjaGVtYS5wcm9wZXJ0aWVzICE9PSB1bmRlZmluZWQgPyBzY2hlbWEucHJvcGVydGllcyA6IHt9O1xuICAgICAgICB2YXIgcGF0dGVyblByb3BlcnRpZXMgPSBzY2hlbWEucGF0dGVyblByb3BlcnRpZXMgIT09IHVuZGVmaW5lZCA/IHNjaGVtYS5wYXR0ZXJuUHJvcGVydGllcyA6IHt9O1xuICAgICAgICBpZiAoc2NoZW1hLmFkZGl0aW9uYWxQcm9wZXJ0aWVzID09PSBmYWxzZSkge1xuICAgICAgICAgICAgLy8gVGhlIHByb3BlcnR5IHNldCBvZiB0aGUganNvbiB0byB2YWxpZGF0ZS5cbiAgICAgICAgICAgIHZhciBzID0gT2JqZWN0LmtleXMoanNvbik7XG4gICAgICAgICAgICAvLyBUaGUgcHJvcGVydHkgc2V0IGZyb20gXCJwcm9wZXJ0aWVzXCIuXG4gICAgICAgICAgICB2YXIgcCA9IE9iamVjdC5rZXlzKHByb3BlcnRpZXMpO1xuICAgICAgICAgICAgLy8gVGhlIHByb3BlcnR5IHNldCBmcm9tIFwicGF0dGVyblByb3BlcnRpZXNcIi5cbiAgICAgICAgICAgIHZhciBwcCA9IE9iamVjdC5rZXlzKHBhdHRlcm5Qcm9wZXJ0aWVzKTtcbiAgICAgICAgICAgIC8vIHJlbW92ZSBmcm9tIFwic1wiIGFsbCBlbGVtZW50cyBvZiBcInBcIiwgaWYgYW55O1xuICAgICAgICAgICAgcyA9IFV0aWxzLmRpZmZlcmVuY2UocywgcCk7XG4gICAgICAgICAgICAvLyBmb3IgZWFjaCByZWdleCBpbiBcInBwXCIsIHJlbW92ZSBhbGwgZWxlbWVudHMgb2YgXCJzXCIgd2hpY2ggdGhpcyByZWdleCBtYXRjaGVzLlxuICAgICAgICAgICAgdmFyIGlkeCA9IHBwLmxlbmd0aDtcbiAgICAgICAgICAgIHdoaWxlIChpZHgtLSkge1xuICAgICAgICAgICAgICAgIHZhciByZWdFeHAgPSBSZWdFeHAocHBbaWR4XSksXG4gICAgICAgICAgICAgICAgICAgIGlkeDIgPSBzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICB3aGlsZSAoaWR4Mi0tKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZWdFeHAudGVzdChzW2lkeDJdKSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcy5zcGxpY2UoaWR4MiwgMSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBWYWxpZGF0aW9uIG9mIHRoZSBqc29uIHN1Y2NlZWRzIGlmLCBhZnRlciB0aGVzZSB0d28gc3RlcHMsIHNldCBcInNcIiBpcyBlbXB0eS5cbiAgICAgICAgICAgIGlmIChzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICByZXBvcnQuYWRkRXJyb3IoXCJPQkpFQ1RfQURESVRJT05BTF9QUk9QRVJUSUVTXCIsIFtzXSwgbnVsbCwgc2NoZW1hLmRlc2NyaXB0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG4gICAgZGVwZW5kZW5jaWVzOiBmdW5jdGlvbiAocmVwb3J0LCBzY2hlbWEsIGpzb24pIHtcbiAgICAgICAgLy8gaHR0cDovL2pzb24tc2NoZW1hLm9yZy9sYXRlc3QvanNvbi1zY2hlbWEtdmFsaWRhdGlvbi5odG1sI3JmYy5zZWN0aW9uLjUuNC41LjJcbiAgICAgICAgaWYgKFV0aWxzLndoYXRJcyhqc29uKSAhPT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhzY2hlbWEuZGVwZW5kZW5jaWVzKSxcbiAgICAgICAgICAgIGlkeCA9IGtleXMubGVuZ3RoO1xuXG4gICAgICAgIHdoaWxlIChpZHgtLSkge1xuICAgICAgICAgICAgLy8gaXRlcmF0ZSBhbGwgZGVwZW5kZW5jaWVzXG4gICAgICAgICAgICB2YXIgZGVwZW5kZW5jeU5hbWUgPSBrZXlzW2lkeF07XG4gICAgICAgICAgICBpZiAoanNvbltkZXBlbmRlbmN5TmFtZV0pIHtcbiAgICAgICAgICAgICAgICB2YXIgZGVwZW5kZW5jeURlZmluaXRpb24gPSBzY2hlbWEuZGVwZW5kZW5jaWVzW2RlcGVuZGVuY3lOYW1lXTtcbiAgICAgICAgICAgICAgICBpZiAoVXRpbHMud2hhdElzKGRlcGVuZGVuY3lEZWZpbml0aW9uKSA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgICAgICAgICAvLyBpZiBkZXBlbmRlbmN5IGlzIGEgc2NoZW1hLCB2YWxpZGF0ZSBhZ2FpbnN0IHRoaXMgc2NoZW1hXG4gICAgICAgICAgICAgICAgICAgIGV4cG9ydHMudmFsaWRhdGUuY2FsbCh0aGlzLCByZXBvcnQsIGRlcGVuZGVuY3lEZWZpbml0aW9uLCBqc29uKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgeyAvLyBBcnJheVxuICAgICAgICAgICAgICAgICAgICAvLyBpZiBkZXBlbmRlbmN5IGlzIGFuIGFycmF5LCBvYmplY3QgbmVlZHMgdG8gaGF2ZSBhbGwgcHJvcGVydGllcyBpbiB0aGlzIGFycmF5XG4gICAgICAgICAgICAgICAgICAgIHZhciBpZHgyID0gZGVwZW5kZW5jeURlZmluaXRpb24ubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoaWR4Mi0tKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVxdWlyZWRQcm9wZXJ0eU5hbWUgPSBkZXBlbmRlbmN5RGVmaW5pdGlvbltpZHgyXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChqc29uW3JlcXVpcmVkUHJvcGVydHlOYW1lXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVwb3J0LmFkZEVycm9yKFwiT0JKRUNUX0RFUEVOREVOQ1lfS0VZXCIsIFtyZXF1aXJlZFByb3BlcnR5TmFtZSwgZGVwZW5kZW5jeU5hbWVdLCBudWxsLCBzY2hlbWEuZGVzY3JpcHRpb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcbiAgICBlbnVtOiBmdW5jdGlvbiAocmVwb3J0LCBzY2hlbWEsIGpzb24pIHtcbiAgICAgICAgLy8gaHR0cDovL2pzb24tc2NoZW1hLm9yZy9sYXRlc3QvanNvbi1zY2hlbWEtdmFsaWRhdGlvbi5odG1sI3JmYy5zZWN0aW9uLjUuNS4xLjJcbiAgICAgICAgdmFyIG1hdGNoID0gZmFsc2UsXG4gICAgICAgICAgICBpZHggPSBzY2hlbWEuZW51bS5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChpZHgtLSkge1xuICAgICAgICAgICAgaWYgKFV0aWxzLmFyZUVxdWFsKGpzb24sIHNjaGVtYS5lbnVtW2lkeF0pKSB7XG4gICAgICAgICAgICAgICAgbWF0Y2ggPSB0cnVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChtYXRjaCA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIHJlcG9ydC5hZGRFcnJvcihcIkVOVU1fTUlTTUFUQ0hcIiwgW2pzb25dLCBudWxsLCBzY2hlbWEuZGVzY3JpcHRpb24pO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvKlxuICAgIHR5cGU6IGZ1bmN0aW9uIChyZXBvcnQsIHNjaGVtYSwganNvbikge1xuICAgICAgICAvLyBodHRwOi8vanNvbi1zY2hlbWEub3JnL2xhdGVzdC9qc29uLXNjaGVtYS12YWxpZGF0aW9uLmh0bWwjcmZjLnNlY3Rpb24uNS41LjIuMlxuICAgICAgICAvLyB0eXBlIGlzIGhhbmRsZWQgYmVmb3JlIHRoaXMgaXMgY2FsbGVkIHNvIGlnbm9yZVxuICAgIH0sXG4gICAgKi9cbiAgICBhbGxPZjogZnVuY3Rpb24gKHJlcG9ydCwgc2NoZW1hLCBqc29uKSB7XG4gICAgICAgIC8vIGh0dHA6Ly9qc29uLXNjaGVtYS5vcmcvbGF0ZXN0L2pzb24tc2NoZW1hLXZhbGlkYXRpb24uaHRtbCNyZmMuc2VjdGlvbi41LjUuMy4yXG4gICAgICAgIHZhciBpZHggPSBzY2hlbWEuYWxsT2YubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoaWR4LS0pIHtcbiAgICAgICAgICAgIGlmIChleHBvcnRzLnZhbGlkYXRlLmNhbGwodGhpcywgcmVwb3J0LCBzY2hlbWEuYWxsT2ZbaWR4XSwganNvbikgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGFueU9mOiBmdW5jdGlvbiAocmVwb3J0LCBzY2hlbWEsIGpzb24pIHtcbiAgICAgICAgLy8gaHR0cDovL2pzb24tc2NoZW1hLm9yZy9sYXRlc3QvanNvbi1zY2hlbWEtdmFsaWRhdGlvbi5odG1sI3JmYy5zZWN0aW9uLjUuNS40LjJcbiAgICAgICAgdmFyIHN1YlJlcG9ydHMgPSBbXSxcbiAgICAgICAgICAgIHBhc3NlZCA9IGZhbHNlLFxuICAgICAgICAgICAgaWR4ID0gc2NoZW1hLmFueU9mLmxlbmd0aDtcblxuICAgICAgICB3aGlsZSAoaWR4LS0gJiYgcGFzc2VkID09PSBmYWxzZSkge1xuICAgICAgICAgICAgdmFyIHN1YlJlcG9ydCA9IG5ldyBSZXBvcnQocmVwb3J0KTtcbiAgICAgICAgICAgIHN1YlJlcG9ydHMucHVzaChzdWJSZXBvcnQpO1xuICAgICAgICAgICAgcGFzc2VkID0gZXhwb3J0cy52YWxpZGF0ZS5jYWxsKHRoaXMsIHN1YlJlcG9ydCwgc2NoZW1hLmFueU9mW2lkeF0sIGpzb24pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHBhc3NlZCA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIHJlcG9ydC5hZGRFcnJvcihcIkFOWV9PRl9NSVNTSU5HXCIsIHVuZGVmaW5lZCwgc3ViUmVwb3J0cywgc2NoZW1hLmRlc2NyaXB0aW9uKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgb25lT2Y6IGZ1bmN0aW9uIChyZXBvcnQsIHNjaGVtYSwganNvbikge1xuICAgICAgICAvLyBodHRwOi8vanNvbi1zY2hlbWEub3JnL2xhdGVzdC9qc29uLXNjaGVtYS12YWxpZGF0aW9uLmh0bWwjcmZjLnNlY3Rpb24uNS41LjUuMlxuICAgICAgICB2YXIgcGFzc2VzID0gMCxcbiAgICAgICAgICAgIHN1YlJlcG9ydHMgPSBbXSxcbiAgICAgICAgICAgIGlkeCA9IHNjaGVtYS5vbmVPZi5sZW5ndGg7XG5cbiAgICAgICAgd2hpbGUgKGlkeC0tKSB7XG4gICAgICAgICAgICB2YXIgc3ViUmVwb3J0ID0gbmV3IFJlcG9ydChyZXBvcnQsIHsgbWF4RXJyb3JzOiAxIH0pO1xuICAgICAgICAgICAgc3ViUmVwb3J0cy5wdXNoKHN1YlJlcG9ydCk7XG4gICAgICAgICAgICBpZiAoZXhwb3J0cy52YWxpZGF0ZS5jYWxsKHRoaXMsIHN1YlJlcG9ydCwgc2NoZW1hLm9uZU9mW2lkeF0sIGpzb24pID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgcGFzc2VzKys7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocGFzc2VzID09PSAwKSB7XG4gICAgICAgICAgICByZXBvcnQuYWRkRXJyb3IoXCJPTkVfT0ZfTUlTU0lOR1wiLCB1bmRlZmluZWQsIHN1YlJlcG9ydHMsIHNjaGVtYS5kZXNjcmlwdGlvbik7XG4gICAgICAgIH0gZWxzZSBpZiAocGFzc2VzID4gMSkge1xuICAgICAgICAgICAgcmVwb3J0LmFkZEVycm9yKFwiT05FX09GX01VTFRJUExFXCIsIG51bGwsIG51bGwsIHNjaGVtYS5kZXNjcmlwdGlvbik7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIG5vdDogZnVuY3Rpb24gKHJlcG9ydCwgc2NoZW1hLCBqc29uKSB7XG4gICAgICAgIC8vIGh0dHA6Ly9qc29uLXNjaGVtYS5vcmcvbGF0ZXN0L2pzb24tc2NoZW1hLXZhbGlkYXRpb24uaHRtbCNyZmMuc2VjdGlvbi41LjUuNi4yXG4gICAgICAgIHZhciBzdWJSZXBvcnQgPSBuZXcgUmVwb3J0KHJlcG9ydCk7XG4gICAgICAgIGlmIChleHBvcnRzLnZhbGlkYXRlLmNhbGwodGhpcywgc3ViUmVwb3J0LCBzY2hlbWEubm90LCBqc29uKSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgcmVwb3J0LmFkZEVycm9yKFwiTk9UX1BBU1NFRFwiLCBudWxsLCBudWxsLCBzY2hlbWEuZGVzY3JpcHRpb24pO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBkZWZpbml0aW9uczogZnVuY3Rpb24gKCkgeyAvKnJlcG9ydCwgc2NoZW1hLCBqc29uKi9cbiAgICAgICAgLy8gaHR0cDovL2pzb24tc2NoZW1hLm9yZy9sYXRlc3QvanNvbi1zY2hlbWEtdmFsaWRhdGlvbi5odG1sI3JmYy5zZWN0aW9uLjUuNS43LjJcbiAgICAgICAgLy8gbm90aGluZyB0byBkbyBoZXJlXG4gICAgfSxcbiAgICBmb3JtYXQ6IGZ1bmN0aW9uIChyZXBvcnQsIHNjaGVtYSwganNvbikge1xuICAgICAgICAvLyBodHRwOi8vanNvbi1zY2hlbWEub3JnL2xhdGVzdC9qc29uLXNjaGVtYS12YWxpZGF0aW9uLmh0bWwjcmZjLnNlY3Rpb24uNy4yXG4gICAgICAgIHZhciBmb3JtYXRWYWxpZGF0b3JGbiA9IEZvcm1hdFZhbGlkYXRvcnNbc2NoZW1hLmZvcm1hdF07XG4gICAgICAgIGlmICh0eXBlb2YgZm9ybWF0VmFsaWRhdG9yRm4gPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgaWYgKGZvcm1hdFZhbGlkYXRvckZuLmxlbmd0aCA9PT0gMikge1xuICAgICAgICAgICAgICAgIC8vIGFzeW5jXG4gICAgICAgICAgICAgICAgcmVwb3J0LmFkZEFzeW5jVGFzayhmb3JtYXRWYWxpZGF0b3JGbiwgW2pzb25dLCBmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQgIT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcG9ydC5hZGRFcnJvcihcIklOVkFMSURfRk9STUFUXCIsIFtzY2hlbWEuZm9ybWF0LCBqc29uXSwgbnVsbCwgc2NoZW1hLmRlc2NyaXB0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBzeW5jXG4gICAgICAgICAgICAgICAgaWYgKGZvcm1hdFZhbGlkYXRvckZuLmNhbGwodGhpcywganNvbikgIT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVwb3J0LmFkZEVycm9yKFwiSU5WQUxJRF9GT1JNQVRcIiwgW3NjaGVtYS5mb3JtYXQsIGpzb25dLCBudWxsLCBzY2hlbWEuZGVzY3JpcHRpb24pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlcG9ydC5hZGRFcnJvcihcIlVOS05PV05fRk9STUFUXCIsIFtzY2hlbWEuZm9ybWF0XSwgbnVsbCwgc2NoZW1hLmRlc2NyaXB0aW9uKTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbnZhciByZWN1cnNlQXJyYXkgPSBmdW5jdGlvbiAocmVwb3J0LCBzY2hlbWEsIGpzb24pIHtcbiAgICAvLyBodHRwOi8vanNvbi1zY2hlbWEub3JnL2xhdGVzdC9qc29uLXNjaGVtYS12YWxpZGF0aW9uLmh0bWwjcmZjLnNlY3Rpb24uOC4yXG5cbiAgICB2YXIgaWR4ID0ganNvbi5sZW5ndGg7XG5cbiAgICAvLyBJZiBcIml0ZW1zXCIgaXMgYW4gYXJyYXksIHRoaXMgc2l0dWF0aW9uLCB0aGUgc2NoZW1hIGRlcGVuZHMgb24gdGhlIGluZGV4OlxuICAgIC8vIGlmIHRoZSBpbmRleCBpcyBsZXNzIHRoYW4sIG9yIGVxdWFsIHRvLCB0aGUgc2l6ZSBvZiBcIml0ZW1zXCIsXG4gICAgLy8gdGhlIGNoaWxkIGluc3RhbmNlIG11c3QgYmUgdmFsaWQgYWdhaW5zdCB0aGUgY29ycmVzcG9uZGluZyBzY2hlbWEgaW4gdGhlIFwiaXRlbXNcIiBhcnJheTtcbiAgICAvLyBvdGhlcndpc2UsIGl0IG11c3QgYmUgdmFsaWQgYWdhaW5zdCB0aGUgc2NoZW1hIGRlZmluZWQgYnkgXCJhZGRpdGlvbmFsSXRlbXNcIi5cbiAgICBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEuaXRlbXMpKSB7XG5cbiAgICAgICAgd2hpbGUgKGlkeC0tKSB7XG4gICAgICAgICAgICAvLyBlcXVhbCB0byBkb2VzbnQgbWFrZSBzZW5zZSBoZXJlXG4gICAgICAgICAgICBpZiAoaWR4IDwgc2NoZW1hLml0ZW1zLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHJlcG9ydC5wYXRoLnB1c2goaWR4LnRvU3RyaW5nKCkpO1xuICAgICAgICAgICAgICAgIGV4cG9ydHMudmFsaWRhdGUuY2FsbCh0aGlzLCByZXBvcnQsIHNjaGVtYS5pdGVtc1tpZHhdLCBqc29uW2lkeF0pO1xuICAgICAgICAgICAgICAgIHJlcG9ydC5wYXRoLnBvcCgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBtaWdodCBiZSBib29sZWFuLCBzbyBjaGVjayB0aGF0IGl0J3MgYW4gb2JqZWN0XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBzY2hlbWEuYWRkaXRpb25hbEl0ZW1zID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcG9ydC5wYXRoLnB1c2goaWR4LnRvU3RyaW5nKCkpO1xuICAgICAgICAgICAgICAgICAgICBleHBvcnRzLnZhbGlkYXRlLmNhbGwodGhpcywgcmVwb3J0LCBzY2hlbWEuYWRkaXRpb25hbEl0ZW1zLCBqc29uW2lkeF0pO1xuICAgICAgICAgICAgICAgICAgICByZXBvcnQucGF0aC5wb3AoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHNjaGVtYS5pdGVtcyA9PT0gXCJvYmplY3RcIikge1xuXG4gICAgICAgIC8vIElmIGl0ZW1zIGlzIGEgc2NoZW1hLCB0aGVuIHRoZSBjaGlsZCBpbnN0YW5jZSBtdXN0IGJlIHZhbGlkIGFnYWluc3QgdGhpcyBzY2hlbWEsXG4gICAgICAgIC8vIHJlZ2FyZGxlc3Mgb2YgaXRzIGluZGV4LCBhbmQgcmVnYXJkbGVzcyBvZiB0aGUgdmFsdWUgb2YgXCJhZGRpdGlvbmFsSXRlbXNcIi5cbiAgICAgICAgd2hpbGUgKGlkeC0tKSB7XG4gICAgICAgICAgICByZXBvcnQucGF0aC5wdXNoKGlkeC50b1N0cmluZygpKTtcbiAgICAgICAgICAgIGV4cG9ydHMudmFsaWRhdGUuY2FsbCh0aGlzLCByZXBvcnQsIHNjaGVtYS5pdGVtcywganNvbltpZHhdKTtcbiAgICAgICAgICAgIHJlcG9ydC5wYXRoLnBvcCgpO1xuICAgICAgICB9XG5cbiAgICB9XG59O1xuXG52YXIgcmVjdXJzZU9iamVjdCA9IGZ1bmN0aW9uIChyZXBvcnQsIHNjaGVtYSwganNvbikge1xuICAgIC8vIGh0dHA6Ly9qc29uLXNjaGVtYS5vcmcvbGF0ZXN0L2pzb24tc2NoZW1hLXZhbGlkYXRpb24uaHRtbCNyZmMuc2VjdGlvbi44LjNcblxuICAgIC8vIElmIFwiYWRkaXRpb25hbFByb3BlcnRpZXNcIiBpcyBhYnNlbnQsIGl0IGlzIGNvbnNpZGVyZWQgcHJlc2VudCB3aXRoIGFuIGVtcHR5IHNjaGVtYSBhcyBhIHZhbHVlLlxuICAgIC8vIEluIGFkZGl0aW9uLCBib29sZWFuIHZhbHVlIHRydWUgaXMgY29uc2lkZXJlZCBlcXVpdmFsZW50IHRvIGFuIGVtcHR5IHNjaGVtYS5cbiAgICB2YXIgYWRkaXRpb25hbFByb3BlcnRpZXMgPSBzY2hlbWEuYWRkaXRpb25hbFByb3BlcnRpZXM7XG4gICAgaWYgKGFkZGl0aW9uYWxQcm9wZXJ0aWVzID09PSB0cnVlIHx8IGFkZGl0aW9uYWxQcm9wZXJ0aWVzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgYWRkaXRpb25hbFByb3BlcnRpZXMgPSB7fTtcbiAgICB9XG5cbiAgICAvLyBwIC0gVGhlIHByb3BlcnR5IHNldCBmcm9tIFwicHJvcGVydGllc1wiLlxuICAgIHZhciBwID0gc2NoZW1hLnByb3BlcnRpZXMgPyBPYmplY3Qua2V5cyhzY2hlbWEucHJvcGVydGllcykgOiBbXTtcblxuICAgIC8vIHBwIC0gVGhlIHByb3BlcnR5IHNldCBmcm9tIFwicGF0dGVyblByb3BlcnRpZXNcIi4gRWxlbWVudHMgb2YgdGhpcyBzZXQgd2lsbCBiZSBjYWxsZWQgcmVnZXhlcyBmb3IgY29udmVuaWVuY2UuXG4gICAgdmFyIHBwID0gc2NoZW1hLnBhdHRlcm5Qcm9wZXJ0aWVzID8gT2JqZWN0LmtleXMoc2NoZW1hLnBhdHRlcm5Qcm9wZXJ0aWVzKSA6IFtdO1xuXG4gICAgLy8gbSAtIFRoZSBwcm9wZXJ0eSBuYW1lIG9mIHRoZSBjaGlsZC5cbiAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKGpzb24pLFxuICAgICAgICBpZHggPSBrZXlzLmxlbmd0aDtcblxuICAgIHdoaWxlIChpZHgtLSkge1xuICAgICAgICB2YXIgbSA9IGtleXNbaWR4XSxcbiAgICAgICAgICAgIHByb3BlcnR5VmFsdWUgPSBqc29uW21dO1xuXG4gICAgICAgIC8vIHMgLSBUaGUgc2V0IG9mIHNjaGVtYXMgZm9yIHRoZSBjaGlsZCBpbnN0YW5jZS5cbiAgICAgICAgdmFyIHMgPSBbXTtcblxuICAgICAgICAvLyAxLiBJZiBzZXQgXCJwXCIgY29udGFpbnMgdmFsdWUgXCJtXCIsIHRoZW4gdGhlIGNvcnJlc3BvbmRpbmcgc2NoZW1hIGluIFwicHJvcGVydGllc1wiIGlzIGFkZGVkIHRvIFwic1wiLlxuICAgICAgICBpZiAocC5pbmRleE9mKG0pICE9PSAtMSkge1xuICAgICAgICAgICAgcy5wdXNoKHNjaGVtYS5wcm9wZXJ0aWVzW21dKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIDIuIEZvciBlYWNoIHJlZ2V4IGluIFwicHBcIiwgaWYgaXQgbWF0Y2hlcyBcIm1cIiBzdWNjZXNzZnVsbHksIHRoZSBjb3JyZXNwb25kaW5nIHNjaGVtYSBpbiBcInBhdHRlcm5Qcm9wZXJ0aWVzXCIgaXMgYWRkZWQgdG8gXCJzXCIuXG4gICAgICAgIHZhciBpZHgyID0gcHAubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoaWR4Mi0tKSB7XG4gICAgICAgICAgICB2YXIgcmVnZXhTdHJpbmcgPSBwcFtpZHgyXTtcbiAgICAgICAgICAgIGlmIChSZWdFeHAocmVnZXhTdHJpbmcpLnRlc3QobSkgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICBzLnB1c2goc2NoZW1hLnBhdHRlcm5Qcm9wZXJ0aWVzW3JlZ2V4U3RyaW5nXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyAzLiBUaGUgc2NoZW1hIGRlZmluZWQgYnkgXCJhZGRpdGlvbmFsUHJvcGVydGllc1wiIGlzIGFkZGVkIHRvIFwic1wiIGlmIGFuZCBvbmx5IGlmLCBhdCB0aGlzIHN0YWdlLCBcInNcIiBpcyBlbXB0eS5cbiAgICAgICAgaWYgKHMubGVuZ3RoID09PSAwICYmIGFkZGl0aW9uYWxQcm9wZXJ0aWVzICE9PSBmYWxzZSkge1xuICAgICAgICAgICAgcy5wdXNoKGFkZGl0aW9uYWxQcm9wZXJ0aWVzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHdlIGFyZSBwYXNzaW5nIHRlc3RzIGV2ZW4gd2l0aG91dCB0aGlzIGFzc2VydCBiZWNhdXNlIHRoaXMgaXMgY292ZXJlZCBieSBwcm9wZXJ0aWVzIGNoZWNrXG4gICAgICAgIC8vIGlmIHMgaXMgZW1wdHkgaW4gdGhpcyBzdGFnZSwgbm8gYWRkaXRpb25hbFByb3BlcnRpZXMgYXJlIGFsbG93ZWRcbiAgICAgICAgLy8gcmVwb3J0LmV4cGVjdChzLmxlbmd0aCAhPT0gMCwgJ0UwMDEnLCBtKTtcblxuICAgICAgICAvLyBJbnN0YW5jZSBwcm9wZXJ0eSB2YWx1ZSBtdXN0IHBhc3MgYWxsIHNjaGVtYXMgZnJvbSBzXG4gICAgICAgIGlkeDIgPSBzLmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGlkeDItLSkge1xuICAgICAgICAgICAgcmVwb3J0LnBhdGgucHVzaChtKTtcbiAgICAgICAgICAgIGV4cG9ydHMudmFsaWRhdGUuY2FsbCh0aGlzLCByZXBvcnQsIHNbaWR4Ml0sIHByb3BlcnR5VmFsdWUpO1xuICAgICAgICAgICAgcmVwb3J0LnBhdGgucG9wKCk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5leHBvcnRzLnZhbGlkYXRlID0gZnVuY3Rpb24gKHJlcG9ydCwgc2NoZW1hLCBqc29uKSB7XG5cbiAgICByZXBvcnQuY29tbW9uRXJyb3JNZXNzYWdlID0gXCJKU09OX09CSkVDVF9WQUxJREFUSU9OX0ZBSUxFRFwiO1xuXG4gICAgLy8gY2hlY2sgaWYgc2NoZW1hIGlzIGFuIG9iamVjdFxuICAgIHZhciB0byA9IFV0aWxzLndoYXRJcyhzY2hlbWEpO1xuICAgIGlmICh0byAhPT0gXCJvYmplY3RcIikge1xuICAgICAgICByZXBvcnQuYWRkRXJyb3IoXCJTQ0hFTUFfTk9UX0FOX09CSkVDVFwiLCBbdG9dLCBudWxsLCBzY2hlbWEuZGVzY3JpcHRpb24pO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gY2hlY2sgaWYgc2NoZW1hIGlzIGVtcHR5LCBldmVyeXRoaW5nIGlzIHZhbGlkIGFnYWluc3QgZW1wdHkgc2NoZW1hXG4gICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhzY2hlbWEpO1xuICAgIGlmIChrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyB0aGlzIG1ldGhvZCBjYW4gYmUgY2FsbGVkIHJlY3Vyc2l2ZWx5LCBzbyB3ZSBuZWVkIHRvIHJlbWVtYmVyIG91ciByb290XG4gICAgdmFyIGlzUm9vdCA9IGZhbHNlO1xuICAgIGlmICghcmVwb3J0LnJvb3RTY2hlbWEpIHtcbiAgICAgICAgcmVwb3J0LnJvb3RTY2hlbWEgPSBzY2hlbWE7XG4gICAgICAgIGlzUm9vdCA9IHRydWU7XG4gICAgfVxuXG4gICAgLy8gZm9sbG93IHNjaGVtYS4kcmVmIGtleXNcbiAgICBpZiAoc2NoZW1hLiRyZWYgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvLyBhdm9pZCBpbmZpbml0ZSBsb29wIHdpdGggbWF4UmVmc1xuICAgICAgICB2YXIgbWF4UmVmcyA9IDk5O1xuICAgICAgICB3aGlsZSAoc2NoZW1hLiRyZWYgJiYgbWF4UmVmcyA+IDApIHtcbiAgICAgICAgICAgIGlmICghc2NoZW1hLl9fJHJlZlJlc29sdmVkKSB7XG4gICAgICAgICAgICAgICAgcmVwb3J0LmFkZEVycm9yKFwiUkVGX1VOUkVTT0xWRURcIiwgW3NjaGVtYS4kcmVmXSwgbnVsbCwgc2NoZW1hLmRlc2NyaXB0aW9uKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc2NoZW1hLl9fJHJlZlJlc29sdmVkID09PSBzY2hlbWEpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc2NoZW1hID0gc2NoZW1hLl9fJHJlZlJlc29sdmVkO1xuICAgICAgICAgICAgICAgIGtleXMgPSBPYmplY3Qua2V5cyhzY2hlbWEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbWF4UmVmcy0tO1xuICAgICAgICB9XG4gICAgICAgIGlmIChtYXhSZWZzID09PSAwKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDaXJjdWxhciBkZXBlbmRlbmN5IGJ5ICRyZWYgcmVmZXJlbmNlcyFcIik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyB0eXBlIGNoZWNraW5nIGZpcnN0XG4gICAgLy8gaHR0cDovL2pzb24tc2NoZW1hLm9yZy9sYXRlc3QvanNvbi1zY2hlbWEtdmFsaWRhdGlvbi5odG1sI3JmYy5zZWN0aW9uLjUuNS4yLjJcbiAgICB2YXIganNvblR5cGUgPSBVdGlscy53aGF0SXMoanNvbik7XG4gICAgaWYgKHNjaGVtYS50eXBlKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc2NoZW1hLnR5cGUgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIGlmIChqc29uVHlwZSAhPT0gc2NoZW1hLnR5cGUgJiYgKGpzb25UeXBlICE9PSBcImludGVnZXJcIiB8fCBzY2hlbWEudHlwZSAhPT0gXCJudW1iZXJcIikpIHtcbiAgICAgICAgICAgICAgICByZXBvcnQuYWRkRXJyb3IoXCJJTlZBTElEX1RZUEVcIiwgW3NjaGVtYS50eXBlLCBqc29uVHlwZV0sIG51bGwsIHNjaGVtYS5kZXNjcmlwdGlvbik7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5icmVha09uRmlyc3RFcnJvcikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKHNjaGVtYS50eXBlLmluZGV4T2YoanNvblR5cGUpID09PSAtMSAmJiAoanNvblR5cGUgIT09IFwiaW50ZWdlclwiIHx8IHNjaGVtYS50eXBlLmluZGV4T2YoXCJudW1iZXJcIikgPT09IC0xKSkge1xuICAgICAgICAgICAgICAgIHJlcG9ydC5hZGRFcnJvcihcIklOVkFMSURfVFlQRVwiLCBbc2NoZW1hLnR5cGUsIGpzb25UeXBlXSwgbnVsbCwgc2NoZW1hLmRlc2NyaXB0aW9uKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmJyZWFrT25GaXJzdEVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBub3cgaXRlcmF0ZSBhbGwgdGhlIGtleXMgaW4gc2NoZW1hIGFuZCBleGVjdXRlIHZhbGlkYXRpb24gbWV0aG9kc1xuICAgIHZhciBpZHggPSBrZXlzLmxlbmd0aDtcbiAgICB3aGlsZSAoaWR4LS0pIHtcbiAgICAgICAgaWYgKEpzb25WYWxpZGF0b3JzW2tleXNbaWR4XV0pIHtcbiAgICAgICAgICAgIEpzb25WYWxpZGF0b3JzW2tleXNbaWR4XV0uY2FsbCh0aGlzLCByZXBvcnQsIHNjaGVtYSwganNvbik7XG4gICAgICAgICAgICBpZiAocmVwb3J0LmVycm9ycy5sZW5ndGggJiYgdGhpcy5vcHRpb25zLmJyZWFrT25GaXJzdEVycm9yKSB7IGJyZWFrOyB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocmVwb3J0LmVycm9ycy5sZW5ndGggPT09IDAgfHwgdGhpcy5vcHRpb25zLmJyZWFrT25GaXJzdEVycm9yID09PSBmYWxzZSkge1xuICAgICAgICBpZiAoanNvblR5cGUgPT09IFwiYXJyYXlcIikge1xuICAgICAgICAgICAgcmVjdXJzZUFycmF5LmNhbGwodGhpcywgcmVwb3J0LCBzY2hlbWEsIGpzb24pO1xuICAgICAgICB9IGVsc2UgaWYgKGpzb25UeXBlID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgICByZWN1cnNlT2JqZWN0LmNhbGwodGhpcywgcmVwb3J0LCBzY2hlbWEsIGpzb24pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gd2UgZG9uJ3QgbmVlZCB0aGUgcm9vdCBwb2ludGVyIGFueW1vcmVcbiAgICBpZiAoaXNSb290KSB7XG4gICAgICAgIHJlcG9ydC5yb290U2NoZW1hID0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIC8vIHJldHVybiB2YWxpZCBqdXN0IHRvIGJlIGFibGUgdG8gYnJlYWsgYXQgc29tZSBjb2RlIHBvaW50c1xuICAgIHJldHVybiByZXBvcnQuZXJyb3JzLmxlbmd0aCA9PT0gMDtcblxufTtcbiIsIi8vIE51bWJlci5pc0Zpbml0ZSBwb2x5ZmlsbFxuLy8gaHR0cDovL3Blb3BsZS5tb3ppbGxhLm9yZy9+am9yZW5kb3JmZi9lczYtZHJhZnQuaHRtbCNzZWMtbnVtYmVyLmlzZmluaXRlXG5pZiAodHlwZW9mIE51bWJlci5pc0Zpbml0ZSAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgTnVtYmVyLmlzRmluaXRlID0gZnVuY3Rpb24gaXNGaW5pdGUodmFsdWUpIHtcbiAgICAgICAgLy8gMS4gSWYgVHlwZShudW1iZXIpIGlzIG5vdCBOdW1iZXIsIHJldHVybiBmYWxzZS5cbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJudW1iZXJcIikge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIC8vIDIuIElmIG51bWJlciBpcyBOYU4sICviiJ4sIG9yIOKIkuKIniwgcmV0dXJuIGZhbHNlLlxuICAgICAgICBpZiAodmFsdWUgIT09IHZhbHVlIHx8IHZhbHVlID09PSBJbmZpbml0eSB8fCB2YWx1ZSA9PT0gLUluZmluaXR5KSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgLy8gMy4gT3RoZXJ3aXNlLCByZXR1cm4gdHJ1ZS5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcbn1cbiIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgRXJyb3JzID0gcmVxdWlyZShcIi4vRXJyb3JzXCIpO1xudmFyIFV0aWxzICA9IHJlcXVpcmUoXCIuL1V0aWxzXCIpO1xuXG5mdW5jdGlvbiBSZXBvcnQocGFyZW50T3JPcHRpb25zLCByZXBvcnRPcHRpb25zKSB7XG4gICAgdGhpcy5wYXJlbnRSZXBvcnQgPSBwYXJlbnRPck9wdGlvbnMgaW5zdGFuY2VvZiBSZXBvcnQgP1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudE9yT3B0aW9ucyA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5kZWZpbmVkO1xuXG4gICAgdGhpcy5vcHRpb25zID0gcGFyZW50T3JPcHRpb25zIGluc3RhbmNlb2YgUmVwb3J0ID9cbiAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50T3JPcHRpb25zLm9wdGlvbnMgOlxuICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnRPck9wdGlvbnMgfHwge307XG5cbiAgICB0aGlzLnJlcG9ydE9wdGlvbnMgPSByZXBvcnRPcHRpb25zIHx8IHt9O1xuXG4gICAgdGhpcy5lcnJvcnMgPSBbXTtcbiAgICB0aGlzLnBhdGggPSBbXTtcbiAgICB0aGlzLmFzeW5jVGFza3MgPSBbXTtcbn1cblxuUmVwb3J0LnByb3RvdHlwZS5pc1ZhbGlkID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLmFzeW5jVGFza3MubGVuZ3RoID4gMCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBc3luYyB0YXNrcyBwZW5kaW5nLCBjYW4ndCBhbnN3ZXIgaXNWYWxpZFwiKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZXJyb3JzLmxlbmd0aCA9PT0gMDtcbn07XG5cblJlcG9ydC5wcm90b3R5cGUuYWRkQXN5bmNUYXNrID0gZnVuY3Rpb24gKGZuLCBhcmdzLCBhc3luY1Rhc2tSZXN1bHRQcm9jZXNzRm4pIHtcbiAgICB0aGlzLmFzeW5jVGFza3MucHVzaChbZm4sIGFyZ3MsIGFzeW5jVGFza1Jlc3VsdFByb2Nlc3NGbl0pO1xufTtcblxuUmVwb3J0LnByb3RvdHlwZS5wcm9jZXNzQXN5bmNUYXNrcyA9IGZ1bmN0aW9uICh0aW1lb3V0LCBjYWxsYmFjaykge1xuXG4gICAgdmFyIHZhbGlkYXRpb25UaW1lb3V0ID0gdGltZW91dCB8fCAyMDAwLFxuICAgICAgICB0YXNrc0NvdW50ICAgICAgICA9IHRoaXMuYXN5bmNUYXNrcy5sZW5ndGgsXG4gICAgICAgIGlkeCAgICAgICAgICAgICAgID0gdGFza3NDb3VudCxcbiAgICAgICAgdGltZWRPdXQgICAgICAgICAgPSBmYWxzZSxcbiAgICAgICAgc2VsZiAgICAgICAgICAgICAgPSB0aGlzO1xuXG4gICAgZnVuY3Rpb24gZmluaXNoKCkge1xuICAgICAgICBwcm9jZXNzLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciB2YWxpZCA9IHNlbGYuZXJyb3JzLmxlbmd0aCA9PT0gMCxcbiAgICAgICAgICAgICAgICBlcnIgICA9IHZhbGlkID8gdW5kZWZpbmVkIDogc2VsZi5lcnJvcnM7XG4gICAgICAgICAgICBjYWxsYmFjayhlcnIsIHZhbGlkKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVzcG9uZChhc3luY1Rhc2tSZXN1bHRQcm9jZXNzRm4pIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChhc3luY1Rhc2tSZXN1bHQpIHtcbiAgICAgICAgICAgIGlmICh0aW1lZE91dCkgeyByZXR1cm47IH1cbiAgICAgICAgICAgIGFzeW5jVGFza1Jlc3VsdFByb2Nlc3NGbihhc3luY1Rhc2tSZXN1bHQpO1xuICAgICAgICAgICAgaWYgKC0tdGFza3NDb3VudCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGZpbmlzaCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGlmICh0YXNrc0NvdW50ID09PSAwIHx8IHRoaXMuZXJyb3JzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgZmluaXNoKCk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB3aGlsZSAoaWR4LS0pIHtcbiAgICAgICAgdmFyIHRhc2sgPSB0aGlzLmFzeW5jVGFza3NbaWR4XTtcbiAgICAgICAgdGFza1swXS5hcHBseShudWxsLCB0YXNrWzFdLmNvbmNhdChyZXNwb25kKHRhc2tbMl0pKSk7XG4gICAgfVxuXG4gICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0YXNrc0NvdW50ID4gMCkge1xuICAgICAgICAgICAgdGltZWRPdXQgPSB0cnVlO1xuICAgICAgICAgICAgc2VsZi5hZGRFcnJvcihcIkFTWU5DX1RJTUVPVVRcIiwgW3Rhc2tzQ291bnQsIHZhbGlkYXRpb25UaW1lb3V0XSk7XG4gICAgICAgICAgICBjYWxsYmFjayhzZWxmLmVycm9ycywgZmFsc2UpO1xuICAgICAgICB9XG4gICAgfSwgdmFsaWRhdGlvblRpbWVvdXQpO1xuXG59O1xuXG5SZXBvcnQucHJvdG90eXBlLmdldFBhdGggPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHBhdGggPSBbXTtcbiAgICBpZiAodGhpcy5wYXJlbnRSZXBvcnQpIHtcbiAgICAgICAgcGF0aCA9IHBhdGguY29uY2F0KHRoaXMucGFyZW50UmVwb3J0LnBhdGgpO1xuICAgIH1cbiAgICBwYXRoID0gcGF0aC5jb25jYXQodGhpcy5wYXRoKTtcblxuICAgIGlmICh0aGlzLm9wdGlvbnMucmVwb3J0UGF0aEFzQXJyYXkgIT09IHRydWUpIHtcbiAgICAgICAgLy8gU2FuaXRpemUgdGhlIHBhdGggc2VnbWVudHMgKGh0dHA6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzY5MDEjc2VjdGlvbi00KVxuICAgICAgICBwYXRoID0gXCIjL1wiICsgcGF0aC5tYXAoZnVuY3Rpb24gKHNlZ21lbnQpIHtcblxuICAgICAgICAgICAgaWYgKFV0aWxzLmlzQWJzb2x1dGVVcmkoc2VnbWVudCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJ1cmkoXCIgKyBzZWdtZW50ICsgXCIpXCI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBzZWdtZW50LnJlcGxhY2UoXCJ+XCIsIFwifjBcIikucmVwbGFjZShcIi9cIiwgXCJ+MVwiKTtcbiAgICAgICAgfSkuam9pbihcIi9cIik7XG4gICAgfVxuICAgIHJldHVybiBwYXRoO1xufTtcblxuUmVwb3J0LnByb3RvdHlwZS5hZGRFcnJvciA9IGZ1bmN0aW9uIChlcnJvckNvZGUsIHBhcmFtcywgc3ViUmVwb3J0cywgc2NoZW1hRGVzY3JpcHRpb24pIHtcbiAgICBpZiAodGhpcy5lcnJvcnMubGVuZ3RoID49IHRoaXMucmVwb3J0T3B0aW9ucy5tYXhFcnJvcnMpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICghZXJyb3JDb2RlKSB7IHRocm93IG5ldyBFcnJvcihcIk5vIGVycm9yQ29kZSBwYXNzZWQgaW50byBhZGRFcnJvcigpXCIpOyB9XG4gICAgaWYgKCFFcnJvcnNbZXJyb3JDb2RlXSkgeyB0aHJvdyBuZXcgRXJyb3IoXCJObyBlcnJvck1lc3NhZ2Uga25vd24gZm9yIGNvZGUgXCIgKyBlcnJvckNvZGUpOyB9XG5cbiAgICBwYXJhbXMgPSBwYXJhbXMgfHwgW107XG5cbiAgICB2YXIgaWR4ID0gcGFyYW1zLmxlbmd0aCxcbiAgICAgICAgZXJyb3JNZXNzYWdlID0gRXJyb3JzW2Vycm9yQ29kZV07XG4gICAgd2hpbGUgKGlkeC0tKSB7XG4gICAgICAgIHZhciB3aGF0SXMgPSBVdGlscy53aGF0SXMocGFyYW1zW2lkeF0pO1xuICAgICAgICB2YXIgcGFyYW0gPSAod2hhdElzID09PSBcIm9iamVjdFwiIHx8IHdoYXRJcyA9PT0gXCJudWxsXCIpID8gSlNPTi5zdHJpbmdpZnkocGFyYW1zW2lkeF0pIDogcGFyYW1zW2lkeF07XG4gICAgICAgIGVycm9yTWVzc2FnZSA9IGVycm9yTWVzc2FnZS5yZXBsYWNlKFwie1wiICsgaWR4ICsgXCJ9XCIsIHBhcmFtKTtcbiAgICB9XG5cbiAgICB2YXIgZXJyID0ge1xuICAgICAgICBjb2RlOiBlcnJvckNvZGUsXG4gICAgICAgIHBhcmFtczogcGFyYW1zLFxuICAgICAgICBtZXNzYWdlOiBlcnJvck1lc3NhZ2UsXG4gICAgICAgIHBhdGg6IHRoaXMuZ2V0UGF0aCgpXG4gICAgfTtcblxuICAgIGlmIChzY2hlbWFEZXNjcmlwdGlvbikge1xuICAgICAgICBlcnIuZGVzY3JpcHRpb24gPSBzY2hlbWFEZXNjcmlwdGlvbjtcbiAgICB9XG5cbiAgICBpZiAoc3ViUmVwb3J0cyAhPSBudWxsKSB7XG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShzdWJSZXBvcnRzKSkge1xuICAgICAgICAgICAgc3ViUmVwb3J0cyA9IFtzdWJSZXBvcnRzXTtcbiAgICAgICAgfVxuICAgICAgICBlcnIuaW5uZXIgPSBbXTtcbiAgICAgICAgaWR4ID0gc3ViUmVwb3J0cy5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChpZHgtLSkge1xuICAgICAgICAgICAgdmFyIHN1YlJlcG9ydCA9IHN1YlJlcG9ydHNbaWR4XSxcbiAgICAgICAgICAgICAgICBpZHgyID0gc3ViUmVwb3J0LmVycm9ycy5sZW5ndGg7XG4gICAgICAgICAgICB3aGlsZSAoaWR4Mi0tKSB7XG4gICAgICAgICAgICAgICAgZXJyLmlubmVyLnB1c2goc3ViUmVwb3J0LmVycm9yc1tpZHgyXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGVyci5pbm5lci5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIGVyci5pbm5lciA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuZXJyb3JzLnB1c2goZXJyKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUmVwb3J0O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBSZXBvcnQgICAgICAgICAgICAgID0gcmVxdWlyZShcIi4vUmVwb3J0XCIpO1xudmFyIFNjaGVtYUNvbXBpbGF0aW9uICAgPSByZXF1aXJlKFwiLi9TY2hlbWFDb21waWxhdGlvblwiKTtcbnZhciBTY2hlbWFWYWxpZGF0aW9uICAgID0gcmVxdWlyZShcIi4vU2NoZW1hVmFsaWRhdGlvblwiKTtcbnZhciBVdGlscyAgICAgICAgICAgICAgID0gcmVxdWlyZShcIi4vVXRpbHNcIik7XG5cbmZ1bmN0aW9uIGRlY29kZUpTT05Qb2ludGVyKHN0cikge1xuICAgIC8vIGh0dHA6Ly90b29scy5pZXRmLm9yZy9odG1sL2RyYWZ0LWlldGYtYXBwc2F3Zy1qc29uLXBvaW50ZXItMDcjc2VjdGlvbi0zXG4gICAgcmV0dXJuIGRlY29kZVVSSUNvbXBvbmVudChzdHIpLnJlcGxhY2UoL35bMC0xXS9nLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4geCA9PT0gXCJ+MVwiID8gXCIvXCIgOiBcIn5cIjtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gZ2V0UmVtb3RlUGF0aCh1cmkpIHtcbiAgICB2YXIgaW8gPSB1cmkuaW5kZXhPZihcIiNcIik7XG4gICAgcmV0dXJuIGlvID09PSAtMSA/IHVyaSA6IHVyaS5zbGljZSgwLCBpbyk7XG59XG5cbmZ1bmN0aW9uIGdldFF1ZXJ5UGF0aCh1cmkpIHtcbiAgICB2YXIgaW8gPSB1cmkuaW5kZXhPZihcIiNcIik7XG4gICAgdmFyIHJlcyA9IGlvID09PSAtMSA/IHVuZGVmaW5lZCA6IHVyaS5zbGljZShpbyArIDEpO1xuICAgIC8vIFdBUk46IGRvIG5vdCBzbGljZSBzbGFzaCwgIy8gbWVhbnMgdGFrZSByb290IGFuZCBnbyBkb3duIGZyb20gaXRcbiAgICAvLyBpZiAocmVzICYmIHJlc1swXSA9PT0gXCIvXCIpIHsgcmVzID0gcmVzLnNsaWNlKDEpOyB9XG4gICAgcmV0dXJuIHJlcztcbn1cblxuZnVuY3Rpb24gZmluZElkKHNjaGVtYSwgaWQpIHtcbiAgICAvLyBwcm9jZXNzIG9ubHkgYXJyYXlzIGFuZCBvYmplY3RzXG4gICAgaWYgKHR5cGVvZiBzY2hlbWEgIT09IFwib2JqZWN0XCIgfHwgc2NoZW1hID09PSBudWxsKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBubyBpZCBtZWFucyByb290IHNvIHJldHVybiBpdHNlbGZcbiAgICBpZiAoIWlkKSB7XG4gICAgICAgIHJldHVybiBzY2hlbWE7XG4gICAgfVxuXG4gICAgaWYgKHNjaGVtYS5pZCkge1xuICAgICAgICBpZiAoc2NoZW1hLmlkID09PSBpZCB8fCBzY2hlbWEuaWRbMF0gPT09IFwiI1wiICYmIHNjaGVtYS5pZC5zdWJzdHJpbmcoMSkgPT09IGlkKSB7XG4gICAgICAgICAgICByZXR1cm4gc2NoZW1hO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdmFyIGlkeCwgcmVzdWx0O1xuICAgIGlmIChBcnJheS5pc0FycmF5KHNjaGVtYSkpIHtcbiAgICAgICAgaWR4ID0gc2NoZW1hLmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGlkeC0tKSB7XG4gICAgICAgICAgICByZXN1bHQgPSBmaW5kSWQoc2NoZW1hW2lkeF0sIGlkKTtcbiAgICAgICAgICAgIGlmIChyZXN1bHQpIHsgcmV0dXJuIHJlc3VsdDsgfVxuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhzY2hlbWEpO1xuICAgICAgICBpZHggPSBrZXlzLmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGlkeC0tKSB7XG4gICAgICAgICAgICB2YXIgayA9IGtleXNbaWR4XTtcbiAgICAgICAgICAgIGlmIChrLmluZGV4T2YoXCJfXyRcIikgPT09IDApIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc3VsdCA9IGZpbmRJZChzY2hlbWFba10sIGlkKTtcbiAgICAgICAgICAgIGlmIChyZXN1bHQpIHsgcmV0dXJuIHJlc3VsdDsgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnRzLmNhY2hlU2NoZW1hQnlVcmkgPSBmdW5jdGlvbiAodXJpLCBzY2hlbWEpIHtcbiAgICB2YXIgcmVtb3RlUGF0aCA9IGdldFJlbW90ZVBhdGgodXJpKTtcbiAgICBpZiAocmVtb3RlUGF0aCkge1xuICAgICAgICB0aGlzLmNhY2hlW3JlbW90ZVBhdGhdID0gc2NoZW1hO1xuICAgIH1cbn07XG5cbmV4cG9ydHMucmVtb3ZlRnJvbUNhY2hlQnlVcmkgPSBmdW5jdGlvbiAodXJpKSB7XG4gICAgdmFyIHJlbW90ZVBhdGggPSBnZXRSZW1vdGVQYXRoKHVyaSk7XG4gICAgaWYgKHJlbW90ZVBhdGgpIHtcbiAgICAgICAgdGhpcy5jYWNoZVtyZW1vdGVQYXRoXSA9IHVuZGVmaW5lZDtcbiAgICB9XG59O1xuXG5leHBvcnRzLmNoZWNrQ2FjaGVGb3JVcmkgPSBmdW5jdGlvbiAodXJpKSB7XG4gICAgdmFyIHJlbW90ZVBhdGggPSBnZXRSZW1vdGVQYXRoKHVyaSk7XG4gICAgcmV0dXJuIHJlbW90ZVBhdGggPyB0aGlzLmNhY2hlW3JlbW90ZVBhdGhdICE9IG51bGwgOiBmYWxzZTtcbn07XG5cbmV4cG9ydHMuZ2V0U2NoZW1hID0gZnVuY3Rpb24gKHJlcG9ydCwgc2NoZW1hKSB7XG4gICAgaWYgKHR5cGVvZiBzY2hlbWEgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgc2NoZW1hID0gZXhwb3J0cy5nZXRTY2hlbWFCeVJlZmVyZW5jZS5jYWxsKHRoaXMsIHJlcG9ydCwgc2NoZW1hKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBzY2hlbWEgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgc2NoZW1hID0gZXhwb3J0cy5nZXRTY2hlbWFCeVVyaS5jYWxsKHRoaXMsIHJlcG9ydCwgc2NoZW1hKTtcbiAgICB9XG4gICAgcmV0dXJuIHNjaGVtYTtcbn07XG5cbmV4cG9ydHMuZ2V0U2NoZW1hQnlSZWZlcmVuY2UgPSBmdW5jdGlvbiAocmVwb3J0LCBrZXkpIHtcbiAgICB2YXIgaSA9IHRoaXMucmVmZXJlbmNlQ2FjaGUubGVuZ3RoO1xuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgaWYgKHRoaXMucmVmZXJlbmNlQ2FjaGVbaV1bMF0gPT09IGtleSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVmZXJlbmNlQ2FjaGVbaV1bMV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gbm90IGZvdW5kXG4gICAgdmFyIHNjaGVtYSA9IFV0aWxzLmNsb25lRGVlcChrZXkpO1xuICAgIHRoaXMucmVmZXJlbmNlQ2FjaGUucHVzaChba2V5LCBzY2hlbWFdKTtcbiAgICByZXR1cm4gc2NoZW1hO1xufTtcblxuZXhwb3J0cy5nZXRTY2hlbWFCeVVyaSA9IGZ1bmN0aW9uIChyZXBvcnQsIHVyaSwgcm9vdCkge1xuICAgIHZhciByZW1vdGVQYXRoID0gZ2V0UmVtb3RlUGF0aCh1cmkpLFxuICAgICAgICBxdWVyeVBhdGggPSBnZXRRdWVyeVBhdGgodXJpKSxcbiAgICAgICAgcmVzdWx0ID0gcmVtb3RlUGF0aCA/IHRoaXMuY2FjaGVbcmVtb3RlUGF0aF0gOiByb290O1xuXG4gICAgaWYgKHJlc3VsdCAmJiByZW1vdGVQYXRoKSB7XG4gICAgICAgIC8vIHdlIG5lZWQgdG8gYXZvaWQgY29tcGlsaW5nIHNjaGVtYXMgaW4gYSByZWN1cnNpdmUgbG9vcFxuICAgICAgICB2YXIgY29tcGlsZVJlbW90ZSA9IHJlc3VsdCAhPT0gcm9vdDtcbiAgICAgICAgLy8gbm93IHdlIG5lZWQgdG8gY29tcGlsZSBhbmQgdmFsaWRhdGUgcmVzb2x2ZWQgc2NoZW1hIChpbiBjYXNlIGl0J3Mgbm90IGFscmVhZHkpXG4gICAgICAgIGlmIChjb21waWxlUmVtb3RlKSB7XG5cbiAgICAgICAgICAgIHJlcG9ydC5wYXRoLnB1c2gocmVtb3RlUGF0aCk7XG5cbiAgICAgICAgICAgIHZhciByZW1vdGVSZXBvcnQgPSBuZXcgUmVwb3J0KHJlcG9ydCk7XG4gICAgICAgICAgICBpZiAoU2NoZW1hQ29tcGlsYXRpb24uY29tcGlsZVNjaGVtYS5jYWxsKHRoaXMsIHJlbW90ZVJlcG9ydCwgcmVzdWx0KSkge1xuICAgICAgICAgICAgICAgIFNjaGVtYVZhbGlkYXRpb24udmFsaWRhdGVTY2hlbWEuY2FsbCh0aGlzLCByZW1vdGVSZXBvcnQsIHJlc3VsdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgcmVtb3RlUmVwb3J0SXNWYWxpZCA9IHJlbW90ZVJlcG9ydC5pc1ZhbGlkKCk7XG4gICAgICAgICAgICBpZiAoIXJlbW90ZVJlcG9ydElzVmFsaWQpIHtcbiAgICAgICAgICAgICAgICByZXBvcnQuYWRkRXJyb3IoXCJSRU1PVEVfTk9UX1ZBTElEXCIsIFt1cmldLCByZW1vdGVSZXBvcnQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXBvcnQucGF0aC5wb3AoKTtcblxuICAgICAgICAgICAgaWYgKCFyZW1vdGVSZXBvcnRJc1ZhbGlkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChyZXN1bHQgJiYgcXVlcnlQYXRoKSB7XG4gICAgICAgIHZhciBwYXJ0cyA9IHF1ZXJ5UGF0aC5zcGxpdChcIi9cIik7XG4gICAgICAgIGZvciAodmFyIGlkeCA9IDAsIGxpbSA9IHBhcnRzLmxlbmd0aDsgaWR4IDwgbGltOyBpZHgrKykge1xuICAgICAgICAgICAgdmFyIGtleSA9IGRlY29kZUpTT05Qb2ludGVyKHBhcnRzW2lkeF0pO1xuICAgICAgICAgICAgaWYgKGlkeCA9PT0gMCkgeyAvLyBpdCdzIGFuIGlkXG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gZmluZElkKHJlc3VsdCwga2V5KTtcbiAgICAgICAgICAgIH0gZWxzZSB7IC8vIGl0J3MgYSBwYXRoIGJlaGluZCBpZFxuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdFtrZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbn07XG5cbmV4cG9ydHMuZ2V0UmVtb3RlUGF0aCA9IGdldFJlbW90ZVBhdGg7XG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIFJlcG9ydCAgICAgID0gcmVxdWlyZShcIi4vUmVwb3J0XCIpO1xudmFyIFNjaGVtYUNhY2hlID0gcmVxdWlyZShcIi4vU2NoZW1hQ2FjaGVcIik7XG52YXIgVXRpbHMgICAgICAgPSByZXF1aXJlKFwiLi9VdGlsc1wiKTtcblxuZnVuY3Rpb24gbWVyZ2VSZWZlcmVuY2Uoc2NvcGUsIHJlZikge1xuICAgIGlmIChVdGlscy5pc0Fic29sdXRlVXJpKHJlZikpIHtcbiAgICAgICAgcmV0dXJuIHJlZjtcbiAgICB9XG5cbiAgICB2YXIgam9pbmVkU2NvcGUgPSBzY29wZS5qb2luKFwiXCIpLFxuICAgICAgICBpc1Njb3BlQWJzb2x1dGUgPSBVdGlscy5pc0Fic29sdXRlVXJpKGpvaW5lZFNjb3BlKSxcbiAgICAgICAgaXNTY29wZVJlbGF0aXZlID0gVXRpbHMuaXNSZWxhdGl2ZVVyaShqb2luZWRTY29wZSksXG4gICAgICAgIGlzUmVmUmVsYXRpdmUgPSBVdGlscy5pc1JlbGF0aXZlVXJpKHJlZiksXG4gICAgICAgIHRvUmVtb3ZlO1xuXG4gICAgaWYgKGlzU2NvcGVBYnNvbHV0ZSAmJiBpc1JlZlJlbGF0aXZlKSB7XG4gICAgICAgIHRvUmVtb3ZlID0gam9pbmVkU2NvcGUubWF0Y2goL1xcL1teXFwvXSokLyk7XG4gICAgICAgIGlmICh0b1JlbW92ZSkge1xuICAgICAgICAgICAgam9pbmVkU2NvcGUgPSBqb2luZWRTY29wZS5zbGljZSgwLCB0b1JlbW92ZS5pbmRleCArIDEpO1xuICAgICAgICB9XG4gICAgfSBlbHNlIGlmIChpc1Njb3BlUmVsYXRpdmUgJiYgaXNSZWZSZWxhdGl2ZSkge1xuICAgICAgICBqb2luZWRTY29wZSA9IFwiXCI7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdG9SZW1vdmUgPSBqb2luZWRTY29wZS5tYXRjaCgvW14jL10rJC8pO1xuICAgICAgICBpZiAodG9SZW1vdmUpIHtcbiAgICAgICAgICAgIGpvaW5lZFNjb3BlID0gam9pbmVkU2NvcGUuc2xpY2UoMCwgdG9SZW1vdmUuaW5kZXgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdmFyIHJlcyA9IGpvaW5lZFNjb3BlICsgcmVmO1xuICAgIHJlcyA9IHJlcy5yZXBsYWNlKC8jIy8sIFwiI1wiKTtcbiAgICByZXR1cm4gcmVzO1xufVxuXG5mdW5jdGlvbiBjb2xsZWN0UmVmZXJlbmNlcyhvYmosIHJlc3VsdHMsIHNjb3BlLCBwYXRoKSB7XG4gICAgcmVzdWx0cyA9IHJlc3VsdHMgfHwgW107XG4gICAgc2NvcGUgPSBzY29wZSB8fCBbXTtcbiAgICBwYXRoID0gcGF0aCB8fCBbXTtcblxuICAgIGlmICh0eXBlb2Ygb2JqICE9PSBcIm9iamVjdFwiIHx8IG9iaiA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIG9iai5pZCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICBzY29wZS5wdXNoKG9iai5pZCk7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBvYmouJHJlZiA9PT0gXCJzdHJpbmdcIiAmJiB0eXBlb2Ygb2JqLl9fJHJlZlJlc29sdmVkID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIHJlc3VsdHMucHVzaCh7XG4gICAgICAgICAgICByZWY6IG1lcmdlUmVmZXJlbmNlKHNjb3BlLCBvYmouJHJlZiksXG4gICAgICAgICAgICBrZXk6IFwiJHJlZlwiLFxuICAgICAgICAgICAgb2JqOiBvYmosXG4gICAgICAgICAgICBwYXRoOiBwYXRoLnNsaWNlKDApXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIG9iai4kc2NoZW1hID09PSBcInN0cmluZ1wiICYmIHR5cGVvZiBvYmouX18kc2NoZW1hUmVzb2x2ZWQgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgcmVzdWx0cy5wdXNoKHtcbiAgICAgICAgICAgIHJlZjogbWVyZ2VSZWZlcmVuY2Uoc2NvcGUsIG9iai4kc2NoZW1hKSxcbiAgICAgICAgICAgIGtleTogXCIkc2NoZW1hXCIsXG4gICAgICAgICAgICBvYmo6IG9iaixcbiAgICAgICAgICAgIHBhdGg6IHBhdGguc2xpY2UoMClcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgdmFyIGlkeDtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShvYmopKSB7XG4gICAgICAgIGlkeCA9IG9iai5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChpZHgtLSkge1xuICAgICAgICAgICAgcGF0aC5wdXNoKGlkeC50b1N0cmluZygpKTtcbiAgICAgICAgICAgIGNvbGxlY3RSZWZlcmVuY2VzKG9ialtpZHhdLCByZXN1bHRzLCBzY29wZSwgcGF0aCk7XG4gICAgICAgICAgICBwYXRoLnBvcCgpO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhvYmopO1xuICAgICAgICBpZHggPSBrZXlzLmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGlkeC0tKSB7XG4gICAgICAgICAgICAvLyBkbyBub3QgcmVjdXJzZSB0aHJvdWdoIHJlc29sdmVkIHJlZmVyZW5jZXMgYW5kIG90aGVyIHotc2NoZW1hIHByb3BzXG4gICAgICAgICAgICBpZiAoa2V5c1tpZHhdLmluZGV4T2YoXCJfXyRcIikgPT09IDApIHsgY29udGludWU7IH1cbiAgICAgICAgICAgIHBhdGgucHVzaChrZXlzW2lkeF0pO1xuICAgICAgICAgICAgY29sbGVjdFJlZmVyZW5jZXMob2JqW2tleXNbaWR4XV0sIHJlc3VsdHMsIHNjb3BlLCBwYXRoKTtcbiAgICAgICAgICAgIHBhdGgucG9wKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIG9iai5pZCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICBzY29wZS5wb3AoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0cztcbn1cblxudmFyIGNvbXBpbGVBcnJheU9mU2NoZW1hc0xvb3AgPSBmdW5jdGlvbiAobWFpblJlcG9ydCwgYXJyKSB7XG4gICAgdmFyIGlkeCA9IGFyci5sZW5ndGgsXG4gICAgICAgIGNvbXBpbGVkQ291bnQgPSAwO1xuXG4gICAgd2hpbGUgKGlkeC0tKSB7XG5cbiAgICAgICAgLy8gdHJ5IHRvIGNvbXBpbGUgZWFjaCBzY2hlbWEgc2VwYXJhdGVseVxuICAgICAgICB2YXIgcmVwb3J0ID0gbmV3IFJlcG9ydChtYWluUmVwb3J0KTtcbiAgICAgICAgdmFyIGlzVmFsaWQgPSBleHBvcnRzLmNvbXBpbGVTY2hlbWEuY2FsbCh0aGlzLCByZXBvcnQsIGFycltpZHhdKTtcbiAgICAgICAgaWYgKGlzVmFsaWQpIHsgY29tcGlsZWRDb3VudCsrOyB9XG5cbiAgICAgICAgLy8gY29weSBlcnJvcnMgdG8gcmVwb3J0XG4gICAgICAgIG1haW5SZXBvcnQuZXJyb3JzID0gbWFpblJlcG9ydC5lcnJvcnMuY29uY2F0KHJlcG9ydC5lcnJvcnMpO1xuXG4gICAgfVxuXG4gICAgcmV0dXJuIGNvbXBpbGVkQ291bnQ7XG59O1xuXG5mdW5jdGlvbiBmaW5kSWQoYXJyLCBpZCkge1xuICAgIHZhciBpZHggPSBhcnIubGVuZ3RoO1xuICAgIHdoaWxlIChpZHgtLSkge1xuICAgICAgICBpZiAoYXJyW2lkeF0uaWQgPT09IGlkKSB7XG4gICAgICAgICAgICByZXR1cm4gYXJyW2lkeF07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG59XG5cbnZhciBjb21waWxlQXJyYXlPZlNjaGVtYXMgPSBmdW5jdGlvbiAocmVwb3J0LCBhcnIpIHtcblxuICAgIHZhciBjb21waWxlZCA9IDAsXG4gICAgICAgIGxhc3RMb29wQ29tcGlsZWQ7XG5cbiAgICBkbyB7XG5cbiAgICAgICAgLy8gcmVtb3ZlIGFsbCBVTlJFU09MVkFCTEVfUkVGRVJFTkNFIGVycm9ycyBiZWZvcmUgY29tcGlsaW5nIGFycmF5IGFnYWluXG4gICAgICAgIHZhciBpZHggPSByZXBvcnQuZXJyb3JzLmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGlkeC0tKSB7XG4gICAgICAgICAgICBpZiAocmVwb3J0LmVycm9yc1tpZHhdLmNvZGUgPT09IFwiVU5SRVNPTFZBQkxFX1JFRkVSRU5DRVwiKSB7XG4gICAgICAgICAgICAgICAgcmVwb3J0LmVycm9ycy5zcGxpY2UoaWR4LCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHJlbWVtYmVyIGhvdyBtYW55IHdlcmUgY29tcGlsZWQgaW4gdGhlIGxhc3QgbG9vcFxuICAgICAgICBsYXN0TG9vcENvbXBpbGVkID0gY29tcGlsZWQ7XG5cbiAgICAgICAgLy8gY291bnQgaG93IG1hbnkgYXJlIGNvbXBpbGVkIG5vd1xuICAgICAgICBjb21waWxlZCA9IGNvbXBpbGVBcnJheU9mU2NoZW1hc0xvb3AuY2FsbCh0aGlzLCByZXBvcnQsIGFycik7XG5cbiAgICAgICAgLy8gZml4IF9fJG1pc3NpbmdSZWZlcmVuY2VzIGlmIHBvc3NpYmxlXG4gICAgICAgIGlkeCA9IGFyci5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChpZHgtLSkge1xuICAgICAgICAgICAgdmFyIHNjaCA9IGFycltpZHhdO1xuICAgICAgICAgICAgaWYgKHNjaC5fXyRtaXNzaW5nUmVmZXJlbmNlcykge1xuICAgICAgICAgICAgICAgIHZhciBpZHgyID0gc2NoLl9fJG1pc3NpbmdSZWZlcmVuY2VzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICB3aGlsZSAoaWR4Mi0tKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciByZWZPYmogPSBzY2guX18kbWlzc2luZ1JlZmVyZW5jZXNbaWR4Ml07XG4gICAgICAgICAgICAgICAgICAgIHZhciByZXNwb25zZSA9IGZpbmRJZChhcnIsIHJlZk9iai5yZWYpO1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoaXMgbWlnaHQgY3JlYXRlIGNpcmN1bGFyIHJlZmVyZW5jZXNcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlZk9iai5vYmpbXCJfX1wiICsgcmVmT2JqLmtleSArIFwiUmVzb2x2ZWRcIl0gPSByZXNwb25zZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGl0J3MgcmVzb2x2ZWQgbm93IHNvIGRlbGV0ZSBpdFxuICAgICAgICAgICAgICAgICAgICAgICAgc2NoLl9fJG1pc3NpbmdSZWZlcmVuY2VzLnNwbGljZShpZHgyLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoc2NoLl9fJG1pc3NpbmdSZWZlcmVuY2VzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgc2NoLl9fJG1pc3NpbmdSZWZlcmVuY2VzO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGtlZXAgcmVwZWF0aW5nIGlmIG5vdCBhbGwgY29tcGlsZWQgYW5kIGF0IGxlYXN0IG9uZSBtb3JlIHdhcyBjb21waWxlZCBpbiB0aGUgbGFzdCBsb29wXG4gICAgfSB3aGlsZSAoY29tcGlsZWQgIT09IGFyci5sZW5ndGggJiYgY29tcGlsZWQgIT09IGxhc3RMb29wQ29tcGlsZWQpO1xuXG4gICAgcmV0dXJuIHJlcG9ydC5pc1ZhbGlkKCk7XG5cbn07XG5cbmV4cG9ydHMuY29tcGlsZVNjaGVtYSA9IGZ1bmN0aW9uIChyZXBvcnQsIHNjaGVtYSkge1xuXG4gICAgcmVwb3J0LmNvbW1vbkVycm9yTWVzc2FnZSA9IFwiU0NIRU1BX0NPTVBJTEFUSU9OX0ZBSUxFRFwiO1xuXG4gICAgLy8gaWYgc2NoZW1hIGlzIGEgc3RyaW5nLCBhc3N1bWUgaXQncyBhIHVyaVxuICAgIGlmICh0eXBlb2Ygc2NoZW1hID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHZhciBsb2FkZWRTY2hlbWEgPSBTY2hlbWFDYWNoZS5nZXRTY2hlbWFCeVVyaS5jYWxsKHRoaXMsIHJlcG9ydCwgc2NoZW1hKTtcbiAgICAgICAgaWYgKCFsb2FkZWRTY2hlbWEpIHtcbiAgICAgICAgICAgIHJlcG9ydC5hZGRFcnJvcihcIlNDSEVNQV9OT1RfUkVBQ0hBQkxFXCIsIFtzY2hlbWFdKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBzY2hlbWEgPSBsb2FkZWRTY2hlbWE7XG4gICAgfVxuXG4gICAgLy8gaWYgc2NoZW1hIGlzIGFuIGFycmF5LCBhc3N1bWUgaXQncyBhbiBhcnJheSBvZiBzY2hlbWFzXG4gICAgaWYgKEFycmF5LmlzQXJyYXkoc2NoZW1hKSkge1xuICAgICAgICByZXR1cm4gY29tcGlsZUFycmF5T2ZTY2hlbWFzLmNhbGwodGhpcywgcmVwb3J0LCBzY2hlbWEpO1xuICAgIH1cblxuICAgIC8vIGlmIHdlIGhhdmUgYW4gaWQgdGhhbiBpdCBzaG91bGQgYmUgY2FjaGVkIGFscmVhZHkgKGlmIHRoaXMgaW5zdGFuY2UgaGFzIGNvbXBpbGVkIGl0KVxuICAgIGlmIChzY2hlbWEuX18kY29tcGlsZWQgJiYgc2NoZW1hLmlkICYmIFNjaGVtYUNhY2hlLmNoZWNrQ2FjaGVGb3JVcmkuY2FsbCh0aGlzLCBzY2hlbWEuaWQpID09PSBmYWxzZSkge1xuICAgICAgICBzY2hlbWEuX18kY29tcGlsZWQgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgLy8gZG8gbm90IHJlLWNvbXBpbGUgc2NoZW1hc1xuICAgIGlmIChzY2hlbWEuX18kY29tcGlsZWQpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgaWYgKHNjaGVtYS5pZCkge1xuICAgICAgICAvLyBhZGQgdGhpcyB0byBvdXIgc2NoZW1hQ2FjaGUgKGJlZm9yZSBjb21waWxhdGlvbiBpbiBjYXNlIHdlIGhhdmUgcmVmZXJlbmNlcyBpbmNsdWRpbmcgaWQpXG4gICAgICAgIFNjaGVtYUNhY2hlLmNhY2hlU2NoZW1hQnlVcmkuY2FsbCh0aGlzLCBzY2hlbWEuaWQsIHNjaGVtYSk7XG4gICAgfVxuXG4gICAgLy8gZGVsZXRlIGFsbCBfXyRtaXNzaW5nUmVmZXJlbmNlcyBmcm9tIHByZXZpb3VzIGNvbXBpbGF0aW9uIGF0dGVtcHRzXG4gICAgdmFyIGlzVmFsaWRFeGNlcHRSZWZlcmVuY2VzID0gcmVwb3J0LmlzVmFsaWQoKTtcbiAgICBkZWxldGUgc2NoZW1hLl9fJG1pc3NpbmdSZWZlcmVuY2VzO1xuXG4gICAgLy8gY29sbGVjdCBhbGwgcmVmZXJlbmNlcyB0aGF0IG5lZWQgdG8gYmUgcmVzb2x2ZWQgLSAkcmVmIGFuZCAkc2NoZW1hXG4gICAgdmFyIHJlZnMgPSBjb2xsZWN0UmVmZXJlbmNlcy5jYWxsKHRoaXMsIHNjaGVtYSksXG4gICAgICAgIGlkeCA9IHJlZnMubGVuZ3RoO1xuICAgIHdoaWxlIChpZHgtLSkge1xuICAgICAgICAvLyByZXNvbHZlIGFsbCB0aGUgY29sbGVjdGVkIHJlZmVyZW5jZXMgaW50byBfX3h4eFJlc29sdmVkIHBvaW50ZXJcbiAgICAgICAgdmFyIHJlZk9iaiA9IHJlZnNbaWR4XTtcbiAgICAgICAgdmFyIHJlc3BvbnNlID0gU2NoZW1hQ2FjaGUuZ2V0U2NoZW1hQnlVcmkuY2FsbCh0aGlzLCByZXBvcnQsIHJlZk9iai5yZWYsIHNjaGVtYSk7XG5cbiAgICAgICAgLy8gd2UgY2FuIHRyeSB0byB1c2UgY3VzdG9tIHNjaGVtYVJlYWRlciBpZiBhdmFpbGFibGVcbiAgICAgICAgaWYgKCFyZXNwb25zZSkge1xuICAgICAgICAgICAgdmFyIHNjaGVtYVJlYWRlciA9IHRoaXMuZ2V0U2NoZW1hUmVhZGVyKCk7XG4gICAgICAgICAgICBpZiAoc2NoZW1hUmVhZGVyKSB7XG4gICAgICAgICAgICAgICAgLy8gaXQncyBzdXBwb3NlZCB0byByZXR1cm4gYSB2YWxpZCBzY2hlbWFcbiAgICAgICAgICAgICAgICB2YXIgcyA9IHNjaGVtYVJlYWRlcihyZWZPYmoucmVmKTtcbiAgICAgICAgICAgICAgICBpZiAocykge1xuICAgICAgICAgICAgICAgICAgICAvLyBpdCBuZWVkcyB0byBoYXZlIHRoZSBpZFxuICAgICAgICAgICAgICAgICAgICBzLmlkID0gcmVmT2JqLnJlZjtcbiAgICAgICAgICAgICAgICAgICAgLy8gdHJ5IHRvIGNvbXBpbGUgdGhlIHNjaGVtYVxuICAgICAgICAgICAgICAgICAgICB2YXIgc3VicmVwb3J0ID0gbmV3IFJlcG9ydChyZXBvcnQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWV4cG9ydHMuY29tcGlsZVNjaGVtYS5jYWxsKHRoaXMsIHN1YnJlcG9ydCwgcykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvcHkgZXJyb3JzIHRvIHJlcG9ydFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVwb3J0LmVycm9ycyA9IHJlcG9ydC5lcnJvcnMuY29uY2F0KHN1YnJlcG9ydC5lcnJvcnMpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2UgPSBTY2hlbWFDYWNoZS5nZXRTY2hlbWFCeVVyaS5jYWxsKHRoaXMsIHJlcG9ydCwgcmVmT2JqLnJlZiwgc2NoZW1hKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghcmVzcG9uc2UpIHtcblxuICAgICAgICAgICAgdmFyIGlzQWJzb2x1dGUgPSBVdGlscy5pc0Fic29sdXRlVXJpKHJlZk9iai5yZWYpO1xuICAgICAgICAgICAgdmFyIGlzRG93bmxvYWRlZCA9IGZhbHNlO1xuICAgICAgICAgICAgdmFyIGlnbm9yZVVucmVzb2x2YWJsZVJlbW90ZXMgPSB0aGlzLm9wdGlvbnMuaWdub3JlVW5yZXNvbHZhYmxlUmVmZXJlbmNlcyA9PT0gdHJ1ZTtcblxuICAgICAgICAgICAgaWYgKGlzQWJzb2x1dGUpIHtcbiAgICAgICAgICAgICAgICAvLyB3ZSBzaG91bGRuJ3QgYWRkIFVOUkVTT0xWQUJMRV9SRUZFUkVOQ0UgZm9yIHNjaGVtYXMgd2UgYWxyZWFkeSBoYXZlIGRvd25sb2FkZWRcbiAgICAgICAgICAgICAgICAvLyBhbmQgc2V0IHRocm91Z2ggc2V0UmVtb3RlUmVmZXJlbmNlIG1ldGhvZFxuICAgICAgICAgICAgICAgIGlzRG93bmxvYWRlZCA9IFNjaGVtYUNhY2hlLmNoZWNrQ2FjaGVGb3JVcmkuY2FsbCh0aGlzLCByZWZPYmoucmVmKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFpc0Fic29sdXRlIHx8ICFpc0Rvd25sb2FkZWQgJiYgIWlnbm9yZVVucmVzb2x2YWJsZVJlbW90ZXMpIHtcbiAgICAgICAgICAgICAgICBBcnJheS5wcm90b3R5cGUucHVzaC5hcHBseShyZXBvcnQucGF0aCwgcmVmT2JqLnBhdGgpO1xuICAgICAgICAgICAgICAgIHJlcG9ydC5hZGRFcnJvcihcIlVOUkVTT0xWQUJMRV9SRUZFUkVOQ0VcIiwgW3JlZk9iai5yZWZdKTtcbiAgICAgICAgICAgICAgICByZXBvcnQucGF0aC5zbGljZSgwLCAtcmVmT2JqLnBhdGgubGVuZ3RoKTtcblxuICAgICAgICAgICAgICAgIC8vIHB1c2JsaXNoIHVucmVzb2x2ZWQgcmVmZXJlbmNlcyBvdXRcbiAgICAgICAgICAgICAgICBpZiAoaXNWYWxpZEV4Y2VwdFJlZmVyZW5jZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgc2NoZW1hLl9fJG1pc3NpbmdSZWZlcmVuY2VzID0gc2NoZW1hLl9fJG1pc3NpbmdSZWZlcmVuY2VzIHx8IFtdO1xuICAgICAgICAgICAgICAgICAgICBzY2hlbWEuX18kbWlzc2luZ1JlZmVyZW5jZXMucHVzaChyZWZPYmopO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyB0aGlzIG1pZ2h0IGNyZWF0ZSBjaXJjdWxhciByZWZlcmVuY2VzXG4gICAgICAgIHJlZk9iai5vYmpbXCJfX1wiICsgcmVmT2JqLmtleSArIFwiUmVzb2x2ZWRcIl0gPSByZXNwb25zZTtcbiAgICB9XG5cbiAgICB2YXIgaXNWYWxpZCA9IHJlcG9ydC5pc1ZhbGlkKCk7XG4gICAgaWYgKGlzVmFsaWQpIHtcbiAgICAgICAgc2NoZW1hLl9fJGNvbXBpbGVkID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoc2NoZW1hLmlkKSB7XG4gICAgICAgICAgICAvLyByZW1vdmUgdGhpcyBzY2hlbWEgZnJvbSBzY2hlbWFDYWNoZSBiZWNhdXNlIGl0IGZhaWxlZCB0byBjb21waWxlXG4gICAgICAgICAgICBTY2hlbWFDYWNoZS5yZW1vdmVGcm9tQ2FjaGVCeVVyaS5jYWxsKHRoaXMsIHNjaGVtYS5pZCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGlzVmFsaWQ7XG5cbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIEZvcm1hdFZhbGlkYXRvcnMgPSByZXF1aXJlKFwiLi9Gb3JtYXRWYWxpZGF0b3JzXCIpLFxuICAgIEpzb25WYWxpZGF0aW9uICAgPSByZXF1aXJlKFwiLi9Kc29uVmFsaWRhdGlvblwiKSxcbiAgICBSZXBvcnQgICAgICAgICAgID0gcmVxdWlyZShcIi4vUmVwb3J0XCIpLFxuICAgIFV0aWxzICAgICAgICAgICAgPSByZXF1aXJlKFwiLi9VdGlsc1wiKTtcblxudmFyIFNjaGVtYVZhbGlkYXRvcnMgPSB7XG4gICAgJHJlZjogZnVuY3Rpb24gKHJlcG9ydCwgc2NoZW1hKSB7XG4gICAgICAgIC8vIGh0dHA6Ly90b29scy5pZXRmLm9yZy9odG1sL2RyYWZ0LWlldGYtYXBwc2F3Zy1qc29uLXBvaW50ZXItMDdcbiAgICAgICAgLy8gaHR0cDovL3Rvb2xzLmlldGYub3JnL2h0bWwvZHJhZnQtcGJyeWFuLXp5cC1qc29uLXJlZi0wM1xuICAgICAgICBpZiAodHlwZW9mIHNjaGVtYS4kcmVmICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICByZXBvcnQuYWRkRXJyb3IoXCJLRVlXT1JEX1RZUEVfRVhQRUNURURcIiwgW1wiJHJlZlwiLCBcInN0cmluZ1wiXSk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgICRzY2hlbWE6IGZ1bmN0aW9uIChyZXBvcnQsIHNjaGVtYSkge1xuICAgICAgICAvLyBodHRwOi8vanNvbi1zY2hlbWEub3JnL2xhdGVzdC9qc29uLXNjaGVtYS1jb3JlLmh0bWwjcmZjLnNlY3Rpb24uNlxuICAgICAgICBpZiAodHlwZW9mIHNjaGVtYS4kc2NoZW1hICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICByZXBvcnQuYWRkRXJyb3IoXCJLRVlXT1JEX1RZUEVfRVhQRUNURURcIiwgW1wiJHNjaGVtYVwiLCBcInN0cmluZ1wiXSk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIG11bHRpcGxlT2Y6IGZ1bmN0aW9uIChyZXBvcnQsIHNjaGVtYSkge1xuICAgICAgICAvLyBodHRwOi8vanNvbi1zY2hlbWEub3JnL2xhdGVzdC9qc29uLXNjaGVtYS12YWxpZGF0aW9uLmh0bWwjcmZjLnNlY3Rpb24uNS4xLjEuMVxuICAgICAgICBpZiAodHlwZW9mIHNjaGVtYS5tdWx0aXBsZU9mICE9PSBcIm51bWJlclwiKSB7XG4gICAgICAgICAgICByZXBvcnQuYWRkRXJyb3IoXCJLRVlXT1JEX1RZUEVfRVhQRUNURURcIiwgW1wibXVsdGlwbGVPZlwiLCBcIm51bWJlclwiXSk7XG4gICAgICAgIH0gZWxzZSBpZiAoc2NoZW1hLm11bHRpcGxlT2YgPD0gMCkge1xuICAgICAgICAgICAgcmVwb3J0LmFkZEVycm9yKFwiS0VZV09SRF9NVVNUX0JFXCIsIFtcIm11bHRpcGxlT2ZcIiwgXCJzdHJpY3RseSBncmVhdGVyIHRoYW4gMFwiXSk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIG1heGltdW06IGZ1bmN0aW9uIChyZXBvcnQsIHNjaGVtYSkge1xuICAgICAgICAvLyBodHRwOi8vanNvbi1zY2hlbWEub3JnL2xhdGVzdC9qc29uLXNjaGVtYS12YWxpZGF0aW9uLmh0bWwjcmZjLnNlY3Rpb24uNS4xLjIuMVxuICAgICAgICBpZiAodHlwZW9mIHNjaGVtYS5tYXhpbXVtICE9PSBcIm51bWJlclwiKSB7XG4gICAgICAgICAgICByZXBvcnQuYWRkRXJyb3IoXCJLRVlXT1JEX1RZUEVfRVhQRUNURURcIiwgW1wibWF4aW11bVwiLCBcIm51bWJlclwiXSk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGV4Y2x1c2l2ZU1heGltdW06IGZ1bmN0aW9uIChyZXBvcnQsIHNjaGVtYSkge1xuICAgICAgICAvLyBodHRwOi8vanNvbi1zY2hlbWEub3JnL2xhdGVzdC9qc29uLXNjaGVtYS12YWxpZGF0aW9uLmh0bWwjcmZjLnNlY3Rpb24uNS4xLjIuMVxuICAgICAgICBpZiAodHlwZW9mIHNjaGVtYS5leGNsdXNpdmVNYXhpbXVtICE9PSBcImJvb2xlYW5cIikge1xuICAgICAgICAgICAgcmVwb3J0LmFkZEVycm9yKFwiS0VZV09SRF9UWVBFX0VYUEVDVEVEXCIsIFtcImV4Y2x1c2l2ZU1heGltdW1cIiwgXCJib29sZWFuXCJdKTtcbiAgICAgICAgfSBlbHNlIGlmIChzY2hlbWEubWF4aW11bSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXBvcnQuYWRkRXJyb3IoXCJLRVlXT1JEX0RFUEVOREVOQ1lcIiwgW1wiZXhjbHVzaXZlTWF4aW11bVwiLCBcIm1heGltdW1cIl0pO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBtaW5pbXVtOiBmdW5jdGlvbiAocmVwb3J0LCBzY2hlbWEpIHtcbiAgICAgICAgLy8gaHR0cDovL2pzb24tc2NoZW1hLm9yZy9sYXRlc3QvanNvbi1zY2hlbWEtdmFsaWRhdGlvbi5odG1sI3JmYy5zZWN0aW9uLjUuMS4zLjFcbiAgICAgICAgaWYgKHR5cGVvZiBzY2hlbWEubWluaW11bSAhPT0gXCJudW1iZXJcIikge1xuICAgICAgICAgICAgcmVwb3J0LmFkZEVycm9yKFwiS0VZV09SRF9UWVBFX0VYUEVDVEVEXCIsIFtcIm1pbmltdW1cIiwgXCJudW1iZXJcIl0pO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBleGNsdXNpdmVNaW5pbXVtOiBmdW5jdGlvbiAocmVwb3J0LCBzY2hlbWEpIHtcbiAgICAgICAgLy8gaHR0cDovL2pzb24tc2NoZW1hLm9yZy9sYXRlc3QvanNvbi1zY2hlbWEtdmFsaWRhdGlvbi5odG1sI3JmYy5zZWN0aW9uLjUuMS4zLjFcbiAgICAgICAgaWYgKHR5cGVvZiBzY2hlbWEuZXhjbHVzaXZlTWluaW11bSAhPT0gXCJib29sZWFuXCIpIHtcbiAgICAgICAgICAgIHJlcG9ydC5hZGRFcnJvcihcIktFWVdPUkRfVFlQRV9FWFBFQ1RFRFwiLCBbXCJleGNsdXNpdmVNaW5pbXVtXCIsIFwiYm9vbGVhblwiXSk7XG4gICAgICAgIH0gZWxzZSBpZiAoc2NoZW1hLm1pbmltdW0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmVwb3J0LmFkZEVycm9yKFwiS0VZV09SRF9ERVBFTkRFTkNZXCIsIFtcImV4Y2x1c2l2ZU1pbmltdW1cIiwgXCJtaW5pbXVtXCJdKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgbWF4TGVuZ3RoOiBmdW5jdGlvbiAocmVwb3J0LCBzY2hlbWEpIHtcbiAgICAgICAgLy8gaHR0cDovL2pzb24tc2NoZW1hLm9yZy9sYXRlc3QvanNvbi1zY2hlbWEtdmFsaWRhdGlvbi5odG1sI3JmYy5zZWN0aW9uLjUuMi4xLjFcbiAgICAgICAgaWYgKFV0aWxzLndoYXRJcyhzY2hlbWEubWF4TGVuZ3RoKSAhPT0gXCJpbnRlZ2VyXCIpIHtcbiAgICAgICAgICAgIHJlcG9ydC5hZGRFcnJvcihcIktFWVdPUkRfVFlQRV9FWFBFQ1RFRFwiLCBbXCJtYXhMZW5ndGhcIiwgXCJpbnRlZ2VyXCJdKTtcbiAgICAgICAgfSBlbHNlIGlmIChzY2hlbWEubWF4TGVuZ3RoIDwgMCkge1xuICAgICAgICAgICAgcmVwb3J0LmFkZEVycm9yKFwiS0VZV09SRF9NVVNUX0JFXCIsIFtcIm1heExlbmd0aFwiLCBcImdyZWF0ZXIgdGhhbiwgb3IgZXF1YWwgdG8gMFwiXSk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIG1pbkxlbmd0aDogZnVuY3Rpb24gKHJlcG9ydCwgc2NoZW1hKSB7XG4gICAgICAgIC8vIGh0dHA6Ly9qc29uLXNjaGVtYS5vcmcvbGF0ZXN0L2pzb24tc2NoZW1hLXZhbGlkYXRpb24uaHRtbCNyZmMuc2VjdGlvbi41LjIuMi4xXG4gICAgICAgIGlmIChVdGlscy53aGF0SXMoc2NoZW1hLm1pbkxlbmd0aCkgIT09IFwiaW50ZWdlclwiKSB7XG4gICAgICAgICAgICByZXBvcnQuYWRkRXJyb3IoXCJLRVlXT1JEX1RZUEVfRVhQRUNURURcIiwgW1wibWluTGVuZ3RoXCIsIFwiaW50ZWdlclwiXSk7XG4gICAgICAgIH0gZWxzZSBpZiAoc2NoZW1hLm1pbkxlbmd0aCA8IDApIHtcbiAgICAgICAgICAgIHJlcG9ydC5hZGRFcnJvcihcIktFWVdPUkRfTVVTVF9CRVwiLCBbXCJtaW5MZW5ndGhcIiwgXCJncmVhdGVyIHRoYW4sIG9yIGVxdWFsIHRvIDBcIl0pO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBwYXR0ZXJuOiBmdW5jdGlvbiAocmVwb3J0LCBzY2hlbWEpIHtcbiAgICAgICAgLy8gaHR0cDovL2pzb24tc2NoZW1hLm9yZy9sYXRlc3QvanNvbi1zY2hlbWEtdmFsaWRhdGlvbi5odG1sI3JmYy5zZWN0aW9uLjUuMi4zLjFcbiAgICAgICAgaWYgKHR5cGVvZiBzY2hlbWEucGF0dGVybiAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgcmVwb3J0LmFkZEVycm9yKFwiS0VZV09SRF9UWVBFX0VYUEVDVEVEXCIsIFtcInBhdHRlcm5cIiwgXCJzdHJpbmdcIl0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBSZWdFeHAoc2NoZW1hLnBhdHRlcm4pO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIHJlcG9ydC5hZGRFcnJvcihcIktFWVdPUkRfUEFUVEVSTlwiLCBbXCJwYXR0ZXJuXCIsIHNjaGVtYS5wYXR0ZXJuXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGFkZGl0aW9uYWxJdGVtczogZnVuY3Rpb24gKHJlcG9ydCwgc2NoZW1hKSB7XG4gICAgICAgIC8vIGh0dHA6Ly9qc29uLXNjaGVtYS5vcmcvbGF0ZXN0L2pzb24tc2NoZW1hLXZhbGlkYXRpb24uaHRtbCNyZmMuc2VjdGlvbi41LjMuMS4xXG4gICAgICAgIHZhciB0eXBlID0gVXRpbHMud2hhdElzKHNjaGVtYS5hZGRpdGlvbmFsSXRlbXMpO1xuICAgICAgICBpZiAodHlwZSAhPT0gXCJib29sZWFuXCIgJiYgdHlwZSAhPT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgcmVwb3J0LmFkZEVycm9yKFwiS0VZV09SRF9UWVBFX0VYUEVDVEVEXCIsIFtcImFkZGl0aW9uYWxJdGVtc1wiLCBbXCJib29sZWFuXCIsIFwib2JqZWN0XCJdXSk7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgcmVwb3J0LnBhdGgucHVzaChcImFkZGl0aW9uYWxJdGVtc1wiKTtcbiAgICAgICAgICAgIGV4cG9ydHMudmFsaWRhdGVTY2hlbWEuY2FsbCh0aGlzLCByZXBvcnQsIHNjaGVtYS5hZGRpdGlvbmFsSXRlbXMpO1xuICAgICAgICAgICAgcmVwb3J0LnBhdGgucG9wKCk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGl0ZW1zOiBmdW5jdGlvbiAocmVwb3J0LCBzY2hlbWEpIHtcbiAgICAgICAgLy8gaHR0cDovL2pzb24tc2NoZW1hLm9yZy9sYXRlc3QvanNvbi1zY2hlbWEtdmFsaWRhdGlvbi5odG1sI3JmYy5zZWN0aW9uLjUuMy4xLjFcbiAgICAgICAgdmFyIHR5cGUgPSBVdGlscy53aGF0SXMoc2NoZW1hLml0ZW1zKTtcblxuICAgICAgICBpZiAodHlwZSA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgcmVwb3J0LnBhdGgucHVzaChcIml0ZW1zXCIpO1xuICAgICAgICAgICAgZXhwb3J0cy52YWxpZGF0ZVNjaGVtYS5jYWxsKHRoaXMsIHJlcG9ydCwgc2NoZW1hLml0ZW1zKTtcbiAgICAgICAgICAgIHJlcG9ydC5wYXRoLnBvcCgpO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGUgPT09IFwiYXJyYXlcIikge1xuICAgICAgICAgICAgdmFyIGlkeCA9IHNjaGVtYS5pdGVtcy5sZW5ndGg7XG4gICAgICAgICAgICB3aGlsZSAoaWR4LS0pIHtcbiAgICAgICAgICAgICAgICByZXBvcnQucGF0aC5wdXNoKFwiaXRlbXNcIik7XG4gICAgICAgICAgICAgICAgcmVwb3J0LnBhdGgucHVzaChpZHgudG9TdHJpbmcoKSk7XG4gICAgICAgICAgICAgICAgZXhwb3J0cy52YWxpZGF0ZVNjaGVtYS5jYWxsKHRoaXMsIHJlcG9ydCwgc2NoZW1hLml0ZW1zW2lkeF0pO1xuICAgICAgICAgICAgICAgIHJlcG9ydC5wYXRoLnBvcCgpO1xuICAgICAgICAgICAgICAgIHJlcG9ydC5wYXRoLnBvcCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVwb3J0LmFkZEVycm9yKFwiS0VZV09SRF9UWVBFX0VYUEVDVEVEXCIsIFtcIml0ZW1zXCIsIFtcImFycmF5XCIsIFwib2JqZWN0XCJdXSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjdXN0b20gLSBzdHJpY3QgbW9kZVxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmZvcmNlQWRkaXRpb25hbCA9PT0gdHJ1ZSAmJiBzY2hlbWEuYWRkaXRpb25hbEl0ZW1zID09PSB1bmRlZmluZWQgJiYgQXJyYXkuaXNBcnJheShzY2hlbWEuaXRlbXMpKSB7XG4gICAgICAgICAgICByZXBvcnQuYWRkRXJyb3IoXCJLRVlXT1JEX1VOREVGSU5FRF9TVFJJQ1RcIiwgW1wiYWRkaXRpb25hbEl0ZW1zXCJdKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBjdXN0b21lIC0gYXNzdW1lIGRlZmluZWQgZmFsc2UgbW9kZVxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmFzc3VtZUFkZGl0aW9uYWwgPT09IHRydWUgJiYgc2NoZW1hLmFkZGl0aW9uYWxJdGVtcyA9PT0gdW5kZWZpbmVkICYmIEFycmF5LmlzQXJyYXkoc2NoZW1hLml0ZW1zKSkge1xuICAgICAgICAgICAgc2NoZW1hLmFkZGl0aW9uYWxJdGVtcyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBtYXhJdGVtczogZnVuY3Rpb24gKHJlcG9ydCwgc2NoZW1hKSB7XG4gICAgICAgIC8vIGh0dHA6Ly9qc29uLXNjaGVtYS5vcmcvbGF0ZXN0L2pzb24tc2NoZW1hLXZhbGlkYXRpb24uaHRtbCNyZmMuc2VjdGlvbi41LjMuMi4xXG4gICAgICAgIGlmICh0eXBlb2Ygc2NoZW1hLm1heEl0ZW1zICE9PSBcIm51bWJlclwiKSB7XG4gICAgICAgICAgICByZXBvcnQuYWRkRXJyb3IoXCJLRVlXT1JEX1RZUEVfRVhQRUNURURcIiwgW1wibWF4SXRlbXNcIiwgXCJpbnRlZ2VyXCJdKTtcbiAgICAgICAgfSBlbHNlIGlmIChzY2hlbWEubWF4SXRlbXMgPCAwKSB7XG4gICAgICAgICAgICByZXBvcnQuYWRkRXJyb3IoXCJLRVlXT1JEX01VU1RfQkVcIiwgW1wibWF4SXRlbXNcIiwgXCJncmVhdGVyIHRoYW4sIG9yIGVxdWFsIHRvIDBcIl0pO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBtaW5JdGVtczogZnVuY3Rpb24gKHJlcG9ydCwgc2NoZW1hKSB7XG4gICAgICAgIC8vIGh0dHA6Ly9qc29uLXNjaGVtYS5vcmcvbGF0ZXN0L2pzb24tc2NoZW1hLXZhbGlkYXRpb24uaHRtbCNyZmMuc2VjdGlvbi41LjMuMy4xXG4gICAgICAgIGlmIChVdGlscy53aGF0SXMoc2NoZW1hLm1pbkl0ZW1zKSAhPT0gXCJpbnRlZ2VyXCIpIHtcbiAgICAgICAgICAgIHJlcG9ydC5hZGRFcnJvcihcIktFWVdPUkRfVFlQRV9FWFBFQ1RFRFwiLCBbXCJtaW5JdGVtc1wiLCBcImludGVnZXJcIl0pO1xuICAgICAgICB9IGVsc2UgaWYgKHNjaGVtYS5taW5JdGVtcyA8IDApIHtcbiAgICAgICAgICAgIHJlcG9ydC5hZGRFcnJvcihcIktFWVdPUkRfTVVTVF9CRVwiLCBbXCJtaW5JdGVtc1wiLCBcImdyZWF0ZXIgdGhhbiwgb3IgZXF1YWwgdG8gMFwiXSk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIHVuaXF1ZUl0ZW1zOiBmdW5jdGlvbiAocmVwb3J0LCBzY2hlbWEpIHtcbiAgICAgICAgLy8gaHR0cDovL2pzb24tc2NoZW1hLm9yZy9sYXRlc3QvanNvbi1zY2hlbWEtdmFsaWRhdGlvbi5odG1sI3JmYy5zZWN0aW9uLjUuMy40LjFcbiAgICAgICAgaWYgKHR5cGVvZiBzY2hlbWEudW5pcXVlSXRlbXMgIT09IFwiYm9vbGVhblwiKSB7XG4gICAgICAgICAgICByZXBvcnQuYWRkRXJyb3IoXCJLRVlXT1JEX1RZUEVfRVhQRUNURURcIiwgW1widW5pcXVlSXRlbXNcIiwgXCJib29sZWFuXCJdKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgbWF4UHJvcGVydGllczogZnVuY3Rpb24gKHJlcG9ydCwgc2NoZW1hKSB7XG4gICAgICAgIC8vIGh0dHA6Ly9qc29uLXNjaGVtYS5vcmcvbGF0ZXN0L2pzb24tc2NoZW1hLXZhbGlkYXRpb24uaHRtbCNyZmMuc2VjdGlvbi41LjQuMS4xXG4gICAgICAgIGlmIChVdGlscy53aGF0SXMoc2NoZW1hLm1heFByb3BlcnRpZXMpICE9PSBcImludGVnZXJcIikge1xuICAgICAgICAgICAgcmVwb3J0LmFkZEVycm9yKFwiS0VZV09SRF9UWVBFX0VYUEVDVEVEXCIsIFtcIm1heFByb3BlcnRpZXNcIiwgXCJpbnRlZ2VyXCJdKTtcbiAgICAgICAgfSBlbHNlIGlmIChzY2hlbWEubWF4UHJvcGVydGllcyA8IDApIHtcbiAgICAgICAgICAgIHJlcG9ydC5hZGRFcnJvcihcIktFWVdPUkRfTVVTVF9CRVwiLCBbXCJtYXhQcm9wZXJ0aWVzXCIsIFwiZ3JlYXRlciB0aGFuLCBvciBlcXVhbCB0byAwXCJdKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgbWluUHJvcGVydGllczogZnVuY3Rpb24gKHJlcG9ydCwgc2NoZW1hKSB7XG4gICAgICAgIC8vIGh0dHA6Ly9qc29uLXNjaGVtYS5vcmcvbGF0ZXN0L2pzb24tc2NoZW1hLXZhbGlkYXRpb24uaHRtbCNyZmMuc2VjdGlvbi41LjQuMi4xXG4gICAgICAgIGlmIChVdGlscy53aGF0SXMoc2NoZW1hLm1pblByb3BlcnRpZXMpICE9PSBcImludGVnZXJcIikge1xuICAgICAgICAgICAgcmVwb3J0LmFkZEVycm9yKFwiS0VZV09SRF9UWVBFX0VYUEVDVEVEXCIsIFtcIm1pblByb3BlcnRpZXNcIiwgXCJpbnRlZ2VyXCJdKTtcbiAgICAgICAgfSBlbHNlIGlmIChzY2hlbWEubWluUHJvcGVydGllcyA8IDApIHtcbiAgICAgICAgICAgIHJlcG9ydC5hZGRFcnJvcihcIktFWVdPUkRfTVVTVF9CRVwiLCBbXCJtaW5Qcm9wZXJ0aWVzXCIsIFwiZ3JlYXRlciB0aGFuLCBvciBlcXVhbCB0byAwXCJdKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgcmVxdWlyZWQ6IGZ1bmN0aW9uIChyZXBvcnQsIHNjaGVtYSkge1xuICAgICAgICAvLyBodHRwOi8vanNvbi1zY2hlbWEub3JnL2xhdGVzdC9qc29uLXNjaGVtYS12YWxpZGF0aW9uLmh0bWwjcmZjLnNlY3Rpb24uNS40LjMuMVxuICAgICAgICBpZiAoVXRpbHMud2hhdElzKHNjaGVtYS5yZXF1aXJlZCkgIT09IFwiYXJyYXlcIikge1xuICAgICAgICAgICAgcmVwb3J0LmFkZEVycm9yKFwiS0VZV09SRF9UWVBFX0VYUEVDVEVEXCIsIFtcInJlcXVpcmVkXCIsIFwiYXJyYXlcIl0pO1xuICAgICAgICB9IGVsc2UgaWYgKHNjaGVtYS5yZXF1aXJlZC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJlcG9ydC5hZGRFcnJvcihcIktFWVdPUkRfTVVTVF9CRVwiLCBbXCJyZXF1aXJlZFwiLCBcImFuIGFycmF5IHdpdGggYXQgbGVhc3Qgb25lIGVsZW1lbnRcIl0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIGlkeCA9IHNjaGVtYS5yZXF1aXJlZC5sZW5ndGg7XG4gICAgICAgICAgICB3aGlsZSAoaWR4LS0pIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHNjaGVtYS5yZXF1aXJlZFtpZHhdICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcG9ydC5hZGRFcnJvcihcIktFWVdPUkRfVkFMVUVfVFlQRVwiLCBbXCJyZXF1aXJlZFwiLCBcInN0cmluZ1wiXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKFV0aWxzLmlzVW5pcXVlQXJyYXkoc2NoZW1hLnJlcXVpcmVkKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICByZXBvcnQuYWRkRXJyb3IoXCJLRVlXT1JEX01VU1RfQkVcIiwgW1wicmVxdWlyZWRcIiwgXCJhbiBhcnJheSB3aXRoIHVuaXF1ZSBpdGVtc1wiXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGFkZGl0aW9uYWxQcm9wZXJ0aWVzOiBmdW5jdGlvbiAocmVwb3J0LCBzY2hlbWEpIHtcbiAgICAgICAgLy8gaHR0cDovL2pzb24tc2NoZW1hLm9yZy9sYXRlc3QvanNvbi1zY2hlbWEtdmFsaWRhdGlvbi5odG1sI3JmYy5zZWN0aW9uLjUuNC40LjFcbiAgICAgICAgdmFyIHR5cGUgPSBVdGlscy53aGF0SXMoc2NoZW1hLmFkZGl0aW9uYWxQcm9wZXJ0aWVzKTtcbiAgICAgICAgaWYgKHR5cGUgIT09IFwiYm9vbGVhblwiICYmIHR5cGUgIT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgIHJlcG9ydC5hZGRFcnJvcihcIktFWVdPUkRfVFlQRV9FWFBFQ1RFRFwiLCBbXCJhZGRpdGlvbmFsUHJvcGVydGllc1wiLCBbXCJib29sZWFuXCIsIFwib2JqZWN0XCJdXSk7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgcmVwb3J0LnBhdGgucHVzaChcImFkZGl0aW9uYWxQcm9wZXJ0aWVzXCIpO1xuICAgICAgICAgICAgZXhwb3J0cy52YWxpZGF0ZVNjaGVtYS5jYWxsKHRoaXMsIHJlcG9ydCwgc2NoZW1hLmFkZGl0aW9uYWxQcm9wZXJ0aWVzKTtcbiAgICAgICAgICAgIHJlcG9ydC5wYXRoLnBvcCgpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBwcm9wZXJ0aWVzOiBmdW5jdGlvbiAocmVwb3J0LCBzY2hlbWEpIHtcbiAgICAgICAgLy8gaHR0cDovL2pzb24tc2NoZW1hLm9yZy9sYXRlc3QvanNvbi1zY2hlbWEtdmFsaWRhdGlvbi5odG1sI3JmYy5zZWN0aW9uLjUuNC40LjFcbiAgICAgICAgaWYgKFV0aWxzLndoYXRJcyhzY2hlbWEucHJvcGVydGllcykgIT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgIHJlcG9ydC5hZGRFcnJvcihcIktFWVdPUkRfVFlQRV9FWFBFQ1RFRFwiLCBbXCJwcm9wZXJ0aWVzXCIsIFwib2JqZWN0XCJdKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMoc2NoZW1hLnByb3BlcnRpZXMpLFxuICAgICAgICAgICAgaWR4ID0ga2V5cy5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChpZHgtLSkge1xuICAgICAgICAgICAgdmFyIGtleSA9IGtleXNbaWR4XSxcbiAgICAgICAgICAgICAgICB2YWwgPSBzY2hlbWEucHJvcGVydGllc1trZXldO1xuICAgICAgICAgICAgcmVwb3J0LnBhdGgucHVzaChcInByb3BlcnRpZXNcIik7XG4gICAgICAgICAgICByZXBvcnQucGF0aC5wdXNoKGtleSk7XG4gICAgICAgICAgICBleHBvcnRzLnZhbGlkYXRlU2NoZW1hLmNhbGwodGhpcywgcmVwb3J0LCB2YWwpO1xuICAgICAgICAgICAgcmVwb3J0LnBhdGgucG9wKCk7XG4gICAgICAgICAgICByZXBvcnQucGF0aC5wb3AoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGN1c3RvbSAtIHN0cmljdCBtb2RlXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuZm9yY2VBZGRpdGlvbmFsID09PSB0cnVlICYmIHNjaGVtYS5hZGRpdGlvbmFsUHJvcGVydGllcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXBvcnQuYWRkRXJyb3IoXCJLRVlXT1JEX1VOREVGSU5FRF9TVFJJQ1RcIiwgW1wiYWRkaXRpb25hbFByb3BlcnRpZXNcIl0pO1xuICAgICAgICB9XG4gICAgICAgIC8vIGN1c3RvbWUgLSBhc3N1bWUgZGVmaW5lZCBmYWxzZSBtb2RlXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuYXNzdW1lQWRkaXRpb25hbCA9PT0gdHJ1ZSAmJiBzY2hlbWEuYWRkaXRpb25hbFByb3BlcnRpZXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgc2NoZW1hLmFkZGl0aW9uYWxQcm9wZXJ0aWVzID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgLy8gY3VzdG9tIC0gZm9yY2VQcm9wZXJ0aWVzXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuZm9yY2VQcm9wZXJ0aWVzID09PSB0cnVlICYmIGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXBvcnQuYWRkRXJyb3IoXCJDVVNUT01fTU9ERV9GT1JDRV9QUk9QRVJUSUVTXCIsIFtcInByb3BlcnRpZXNcIl0pO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBwYXR0ZXJuUHJvcGVydGllczogZnVuY3Rpb24gKHJlcG9ydCwgc2NoZW1hKSB7XG4gICAgICAgIC8vIGh0dHA6Ly9qc29uLXNjaGVtYS5vcmcvbGF0ZXN0L2pzb24tc2NoZW1hLXZhbGlkYXRpb24uaHRtbCNyZmMuc2VjdGlvbi41LjQuNC4xXG4gICAgICAgIGlmIChVdGlscy53aGF0SXMoc2NoZW1hLnBhdHRlcm5Qcm9wZXJ0aWVzKSAhPT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgcmVwb3J0LmFkZEVycm9yKFwiS0VZV09SRF9UWVBFX0VYUEVDVEVEXCIsIFtcInBhdHRlcm5Qcm9wZXJ0aWVzXCIsIFwib2JqZWN0XCJdKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMoc2NoZW1hLnBhdHRlcm5Qcm9wZXJ0aWVzKSxcbiAgICAgICAgICAgIGlkeCA9IGtleXMubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoaWR4LS0pIHtcbiAgICAgICAgICAgIHZhciBrZXkgPSBrZXlzW2lkeF0sXG4gICAgICAgICAgICAgICAgdmFsID0gc2NoZW1hLnBhdHRlcm5Qcm9wZXJ0aWVzW2tleV07XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIFJlZ0V4cChrZXkpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIHJlcG9ydC5hZGRFcnJvcihcIktFWVdPUkRfUEFUVEVSTlwiLCBbXCJwYXR0ZXJuUHJvcGVydGllc1wiLCBrZXldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlcG9ydC5wYXRoLnB1c2goXCJwYXR0ZXJuUHJvcGVydGllc1wiKTtcbiAgICAgICAgICAgIHJlcG9ydC5wYXRoLnB1c2goa2V5LnRvU3RyaW5nKCkpO1xuICAgICAgICAgICAgZXhwb3J0cy52YWxpZGF0ZVNjaGVtYS5jYWxsKHRoaXMsIHJlcG9ydCwgdmFsKTtcbiAgICAgICAgICAgIHJlcG9ydC5wYXRoLnBvcCgpO1xuICAgICAgICAgICAgcmVwb3J0LnBhdGgucG9wKCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjdXN0b20gLSBmb3JjZVByb3BlcnRpZXNcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5mb3JjZVByb3BlcnRpZXMgPT09IHRydWUgJiYga2V5cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJlcG9ydC5hZGRFcnJvcihcIkNVU1RPTV9NT0RFX0ZPUkNFX1BST1BFUlRJRVNcIiwgW1wicGF0dGVyblByb3BlcnRpZXNcIl0pO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBkZXBlbmRlbmNpZXM6IGZ1bmN0aW9uIChyZXBvcnQsIHNjaGVtYSkge1xuICAgICAgICAvLyBodHRwOi8vanNvbi1zY2hlbWEub3JnL2xhdGVzdC9qc29uLXNjaGVtYS12YWxpZGF0aW9uLmh0bWwjcmZjLnNlY3Rpb24uNS40LjUuMVxuICAgICAgICBpZiAoVXRpbHMud2hhdElzKHNjaGVtYS5kZXBlbmRlbmNpZXMpICE9PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgICByZXBvcnQuYWRkRXJyb3IoXCJLRVlXT1JEX1RZUEVfRVhQRUNURURcIiwgW1wiZGVwZW5kZW5jaWVzXCIsIFwib2JqZWN0XCJdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMoc2NoZW1hLmRlcGVuZGVuY2llcyksXG4gICAgICAgICAgICAgICAgaWR4ID0ga2V5cy5sZW5ndGg7XG4gICAgICAgICAgICB3aGlsZSAoaWR4LS0pIHtcbiAgICAgICAgICAgICAgICB2YXIgc2NoZW1hS2V5ID0ga2V5c1tpZHhdLFxuICAgICAgICAgICAgICAgICAgICBzY2hlbWFEZXBlbmRlbmN5ID0gc2NoZW1hLmRlcGVuZGVuY2llc1tzY2hlbWFLZXldLFxuICAgICAgICAgICAgICAgICAgICB0eXBlID0gVXRpbHMud2hhdElzKHNjaGVtYURlcGVuZGVuY3kpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHR5cGUgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVwb3J0LnBhdGgucHVzaChcImRlcGVuZGVuY2llc1wiKTtcbiAgICAgICAgICAgICAgICAgICAgcmVwb3J0LnBhdGgucHVzaChzY2hlbWFLZXkpO1xuICAgICAgICAgICAgICAgICAgICBleHBvcnRzLnZhbGlkYXRlU2NoZW1hLmNhbGwodGhpcywgcmVwb3J0LCBzY2hlbWFEZXBlbmRlbmN5KTtcbiAgICAgICAgICAgICAgICAgICAgcmVwb3J0LnBhdGgucG9wKCk7XG4gICAgICAgICAgICAgICAgICAgIHJlcG9ydC5wYXRoLnBvcCgpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gXCJhcnJheVwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpZHgyID0gc2NoZW1hRGVwZW5kZW5jeS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpZHgyID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXBvcnQuYWRkRXJyb3IoXCJLRVlXT1JEX01VU1RfQkVcIiwgW1wiZGVwZW5kZW5jaWVzXCIsIFwibm90IGVtcHR5IGFycmF5XCJdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoaWR4Mi0tKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHNjaGVtYURlcGVuZGVuY3lbaWR4Ml0gIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXBvcnQuYWRkRXJyb3IoXCJLRVlXT1JEX1ZBTFVFX1RZUEVcIiwgW1wiZGVwZW5kZW5zaWNlc1wiLCBcInN0cmluZ1wiXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKFV0aWxzLmlzVW5pcXVlQXJyYXkoc2NoZW1hRGVwZW5kZW5jeSkgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXBvcnQuYWRkRXJyb3IoXCJLRVlXT1JEX01VU1RfQkVcIiwgW1wiZGVwZW5kZW5jaWVzXCIsIFwiYW4gYXJyYXkgd2l0aCB1bmlxdWUgaXRlbXNcIl0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVwb3J0LmFkZEVycm9yKFwiS0VZV09SRF9WQUxVRV9UWVBFXCIsIFtcImRlcGVuZGVuY2llc1wiLCBcIm9iamVjdCBvciBhcnJheVwiXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcbiAgICBlbnVtOiBmdW5jdGlvbiAocmVwb3J0LCBzY2hlbWEpIHtcbiAgICAgICAgLy8gaHR0cDovL2pzb24tc2NoZW1hLm9yZy9sYXRlc3QvanNvbi1zY2hlbWEtdmFsaWRhdGlvbi5odG1sI3JmYy5zZWN0aW9uLjUuNS4xLjFcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoc2NoZW1hLmVudW0pID09PSBmYWxzZSkge1xuICAgICAgICAgICAgcmVwb3J0LmFkZEVycm9yKFwiS0VZV09SRF9UWVBFX0VYUEVDVEVEXCIsIFtcImVudW1cIiwgXCJhcnJheVwiXSk7XG4gICAgICAgIH0gZWxzZSBpZiAoc2NoZW1hLmVudW0ubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXBvcnQuYWRkRXJyb3IoXCJLRVlXT1JEX01VU1RfQkVcIiwgW1wiZW51bVwiLCBcImFuIGFycmF5IHdpdGggYXQgbGVhc3Qgb25lIGVsZW1lbnRcIl0pO1xuICAgICAgICB9IGVsc2UgaWYgKFV0aWxzLmlzVW5pcXVlQXJyYXkoc2NoZW1hLmVudW0pID09PSBmYWxzZSkge1xuICAgICAgICAgICAgcmVwb3J0LmFkZEVycm9yKFwiS0VZV09SRF9NVVNUX0JFXCIsIFtcImVudW1cIiwgXCJhbiBhcnJheSB3aXRoIHVuaXF1ZSBlbGVtZW50c1wiXSk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIHR5cGU6IGZ1bmN0aW9uIChyZXBvcnQsIHNjaGVtYSkge1xuICAgICAgICAvLyBodHRwOi8vanNvbi1zY2hlbWEub3JnL2xhdGVzdC9qc29uLXNjaGVtYS12YWxpZGF0aW9uLmh0bWwjcmZjLnNlY3Rpb24uNS41LjIuMVxuICAgICAgICB2YXIgcHJpbWl0aXZlVHlwZXMgPSBbXCJhcnJheVwiLCBcImJvb2xlYW5cIiwgXCJpbnRlZ2VyXCIsIFwibnVtYmVyXCIsIFwibnVsbFwiLCBcIm9iamVjdFwiLCBcInN0cmluZ1wiXSxcbiAgICAgICAgICAgIHByaW1pdGl2ZVR5cGVTdHIgPSBwcmltaXRpdmVUeXBlcy5qb2luKFwiLFwiKSxcbiAgICAgICAgICAgIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5KHNjaGVtYS50eXBlKTtcblxuICAgICAgICBpZiAoaXNBcnJheSkge1xuICAgICAgICAgICAgdmFyIGlkeCA9IHNjaGVtYS50eXBlLmxlbmd0aDtcbiAgICAgICAgICAgIHdoaWxlIChpZHgtLSkge1xuICAgICAgICAgICAgICAgIGlmIChwcmltaXRpdmVUeXBlcy5pbmRleE9mKHNjaGVtYS50eXBlW2lkeF0pID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICByZXBvcnQuYWRkRXJyb3IoXCJLRVlXT1JEX1RZUEVfRVhQRUNURURcIiwgW1widHlwZVwiLCBwcmltaXRpdmVUeXBlU3RyXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKFV0aWxzLmlzVW5pcXVlQXJyYXkoc2NoZW1hLnR5cGUpID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIHJlcG9ydC5hZGRFcnJvcihcIktFWVdPUkRfTVVTVF9CRVwiLCBbXCJ0eXBlXCIsIFwiYW4gb2JqZWN0IHdpdGggdW5pcXVlIHByb3BlcnRpZXNcIl0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBzY2hlbWEudHlwZSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgaWYgKHByaW1pdGl2ZVR5cGVzLmluZGV4T2Yoc2NoZW1hLnR5cGUpID09PSAtMSkge1xuICAgICAgICAgICAgICAgIHJlcG9ydC5hZGRFcnJvcihcIktFWVdPUkRfVFlQRV9FWFBFQ1RFRFwiLCBbXCJ0eXBlXCIsIHByaW1pdGl2ZVR5cGVTdHJdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlcG9ydC5hZGRFcnJvcihcIktFWVdPUkRfVFlQRV9FWFBFQ1RFRFwiLCBbXCJ0eXBlXCIsIFtcInN0cmluZ1wiLCBcImFycmF5XCJdXSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLm5vRW1wdHlTdHJpbmdzID09PSB0cnVlKSB7XG4gICAgICAgICAgICBpZiAoc2NoZW1hLnR5cGUgPT09IFwic3RyaW5nXCIgfHwgaXNBcnJheSAmJiBzY2hlbWEudHlwZS5pbmRleE9mKFwic3RyaW5nXCIpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIGlmIChzY2hlbWEubWluTGVuZ3RoID09PSB1bmRlZmluZWQgJiZcbiAgICAgICAgICAgICAgICAgICAgc2NoZW1hLmVudW0gPT09IHVuZGVmaW5lZCAmJlxuICAgICAgICAgICAgICAgICAgICBzY2hlbWEuZm9ybWF0ID09PSB1bmRlZmluZWQpIHtcblxuICAgICAgICAgICAgICAgICAgICBzY2hlbWEubWluTGVuZ3RoID0gMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5ub0VtcHR5QXJyYXlzID09PSB0cnVlKSB7XG4gICAgICAgICAgICBpZiAoc2NoZW1hLnR5cGUgPT09IFwiYXJyYXlcIiB8fCBpc0FycmF5ICYmIHNjaGVtYS50eXBlLmluZGV4T2YoXCJhcnJheVwiKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2NoZW1hLm1pbkl0ZW1zID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgc2NoZW1hLm1pbkl0ZW1zID0gMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5mb3JjZVByb3BlcnRpZXMgPT09IHRydWUpIHtcbiAgICAgICAgICAgIGlmIChzY2hlbWEudHlwZSA9PT0gXCJvYmplY3RcIiB8fCBpc0FycmF5ICYmIHNjaGVtYS50eXBlLmluZGV4T2YoXCJvYmplY3RcIikgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNjaGVtYS5wcm9wZXJ0aWVzID09PSB1bmRlZmluZWQgJiYgc2NoZW1hLnBhdHRlcm5Qcm9wZXJ0aWVzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVwb3J0LmFkZEVycm9yKFwiS0VZV09SRF9VTkRFRklORURfU1RSSUNUXCIsIFtcInByb3BlcnRpZXNcIl0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmZvcmNlSXRlbXMgPT09IHRydWUpIHtcbiAgICAgICAgICAgIGlmIChzY2hlbWEudHlwZSA9PT0gXCJhcnJheVwiIHx8IGlzQXJyYXkgJiYgc2NoZW1hLnR5cGUuaW5kZXhPZihcImFycmF5XCIpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIGlmIChzY2hlbWEuaXRlbXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICByZXBvcnQuYWRkRXJyb3IoXCJLRVlXT1JEX1VOREVGSU5FRF9TVFJJQ1RcIiwgW1wiaXRlbXNcIl0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmZvcmNlTWluSXRlbXMgPT09IHRydWUpIHtcbiAgICAgICAgICAgIGlmIChzY2hlbWEudHlwZSA9PT0gXCJhcnJheVwiIHx8IGlzQXJyYXkgJiYgc2NoZW1hLnR5cGUuaW5kZXhPZihcImFycmF5XCIpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIGlmIChzY2hlbWEubWluSXRlbXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICByZXBvcnQuYWRkRXJyb3IoXCJLRVlXT1JEX1VOREVGSU5FRF9TVFJJQ1RcIiwgW1wibWluSXRlbXNcIl0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmZvcmNlTWF4SXRlbXMgPT09IHRydWUpIHtcbiAgICAgICAgICAgIGlmIChzY2hlbWEudHlwZSA9PT0gXCJhcnJheVwiIHx8IGlzQXJyYXkgJiYgc2NoZW1hLnR5cGUuaW5kZXhPZihcImFycmF5XCIpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIGlmIChzY2hlbWEubWF4SXRlbXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICByZXBvcnQuYWRkRXJyb3IoXCJLRVlXT1JEX1VOREVGSU5FRF9TVFJJQ1RcIiwgW1wibWF4SXRlbXNcIl0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmZvcmNlTWluTGVuZ3RoID09PSB0cnVlKSB7XG4gICAgICAgICAgICBpZiAoc2NoZW1hLnR5cGUgPT09IFwic3RyaW5nXCIgfHwgaXNBcnJheSAmJiBzY2hlbWEudHlwZS5pbmRleE9mKFwic3RyaW5nXCIpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIGlmIChzY2hlbWEubWluTGVuZ3RoID09PSB1bmRlZmluZWQgJiZcbiAgICAgICAgICAgICAgICAgICAgc2NoZW1hLmZvcm1hdCA9PT0gdW5kZWZpbmVkICYmXG4gICAgICAgICAgICAgICAgICAgIHNjaGVtYS5lbnVtID09PSB1bmRlZmluZWQgJiZcbiAgICAgICAgICAgICAgICAgICAgc2NoZW1hLnBhdHRlcm4gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICByZXBvcnQuYWRkRXJyb3IoXCJLRVlXT1JEX1VOREVGSU5FRF9TVFJJQ1RcIiwgW1wibWluTGVuZ3RoXCJdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5mb3JjZU1heExlbmd0aCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgaWYgKHNjaGVtYS50eXBlID09PSBcInN0cmluZ1wiIHx8IGlzQXJyYXkgJiYgc2NoZW1hLnR5cGUuaW5kZXhPZihcInN0cmluZ1wiKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2NoZW1hLm1heExlbmd0aCA9PT0gdW5kZWZpbmVkICYmXG4gICAgICAgICAgICAgICAgICAgIHNjaGVtYS5mb3JtYXQgPT09IHVuZGVmaW5lZCAmJlxuICAgICAgICAgICAgICAgICAgICBzY2hlbWEuZW51bSA9PT0gdW5kZWZpbmVkICYmXG4gICAgICAgICAgICAgICAgICAgIHNjaGVtYS5wYXR0ZXJuID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVwb3J0LmFkZEVycm9yKFwiS0VZV09SRF9VTkRFRklORURfU1RSSUNUXCIsIFtcIm1heExlbmd0aFwiXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcbiAgICBhbGxPZjogZnVuY3Rpb24gKHJlcG9ydCwgc2NoZW1hKSB7XG4gICAgICAgIC8vIGh0dHA6Ly9qc29uLXNjaGVtYS5vcmcvbGF0ZXN0L2pzb24tc2NoZW1hLXZhbGlkYXRpb24uaHRtbCNyZmMuc2VjdGlvbi41LjUuMy4xXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHNjaGVtYS5hbGxPZikgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICByZXBvcnQuYWRkRXJyb3IoXCJLRVlXT1JEX1RZUEVfRVhQRUNURURcIiwgW1wiYWxsT2ZcIiwgXCJhcnJheVwiXSk7XG4gICAgICAgIH0gZWxzZSBpZiAoc2NoZW1hLmFsbE9mLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmVwb3J0LmFkZEVycm9yKFwiS0VZV09SRF9NVVNUX0JFXCIsIFtcImFsbE9mXCIsIFwiYW4gYXJyYXkgd2l0aCBhdCBsZWFzdCBvbmUgZWxlbWVudFwiXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgaWR4ID0gc2NoZW1hLmFsbE9mLmxlbmd0aDtcbiAgICAgICAgICAgIHdoaWxlIChpZHgtLSkge1xuICAgICAgICAgICAgICAgIHJlcG9ydC5wYXRoLnB1c2goXCJhbGxPZlwiKTtcbiAgICAgICAgICAgICAgICByZXBvcnQucGF0aC5wdXNoKGlkeC50b1N0cmluZygpKTtcbiAgICAgICAgICAgICAgICBleHBvcnRzLnZhbGlkYXRlU2NoZW1hLmNhbGwodGhpcywgcmVwb3J0LCBzY2hlbWEuYWxsT2ZbaWR4XSk7XG4gICAgICAgICAgICAgICAgcmVwb3J0LnBhdGgucG9wKCk7XG4gICAgICAgICAgICAgICAgcmVwb3J0LnBhdGgucG9wKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGFueU9mOiBmdW5jdGlvbiAocmVwb3J0LCBzY2hlbWEpIHtcbiAgICAgICAgLy8gaHR0cDovL2pzb24tc2NoZW1hLm9yZy9sYXRlc3QvanNvbi1zY2hlbWEtdmFsaWRhdGlvbi5odG1sI3JmYy5zZWN0aW9uLjUuNS40LjFcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoc2NoZW1hLmFueU9mKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIHJlcG9ydC5hZGRFcnJvcihcIktFWVdPUkRfVFlQRV9FWFBFQ1RFRFwiLCBbXCJhbnlPZlwiLCBcImFycmF5XCJdKTtcbiAgICAgICAgfSBlbHNlIGlmIChzY2hlbWEuYW55T2YubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXBvcnQuYWRkRXJyb3IoXCJLRVlXT1JEX01VU1RfQkVcIiwgW1wiYW55T2ZcIiwgXCJhbiBhcnJheSB3aXRoIGF0IGxlYXN0IG9uZSBlbGVtZW50XCJdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBpZHggPSBzY2hlbWEuYW55T2YubGVuZ3RoO1xuICAgICAgICAgICAgd2hpbGUgKGlkeC0tKSB7XG4gICAgICAgICAgICAgICAgcmVwb3J0LnBhdGgucHVzaChcImFueU9mXCIpO1xuICAgICAgICAgICAgICAgIHJlcG9ydC5wYXRoLnB1c2goaWR4LnRvU3RyaW5nKCkpO1xuICAgICAgICAgICAgICAgIGV4cG9ydHMudmFsaWRhdGVTY2hlbWEuY2FsbCh0aGlzLCByZXBvcnQsIHNjaGVtYS5hbnlPZltpZHhdKTtcbiAgICAgICAgICAgICAgICByZXBvcnQucGF0aC5wb3AoKTtcbiAgICAgICAgICAgICAgICByZXBvcnQucGF0aC5wb3AoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG4gICAgb25lT2Y6IGZ1bmN0aW9uIChyZXBvcnQsIHNjaGVtYSkge1xuICAgICAgICAvLyBodHRwOi8vanNvbi1zY2hlbWEub3JnL2xhdGVzdC9qc29uLXNjaGVtYS12YWxpZGF0aW9uLmh0bWwjcmZjLnNlY3Rpb24uNS41LjUuMVxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEub25lT2YpID09PSBmYWxzZSkge1xuICAgICAgICAgICAgcmVwb3J0LmFkZEVycm9yKFwiS0VZV09SRF9UWVBFX0VYUEVDVEVEXCIsIFtcIm9uZU9mXCIsIFwiYXJyYXlcIl0pO1xuICAgICAgICB9IGVsc2UgaWYgKHNjaGVtYS5vbmVPZi5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJlcG9ydC5hZGRFcnJvcihcIktFWVdPUkRfTVVTVF9CRVwiLCBbXCJvbmVPZlwiLCBcImFuIGFycmF5IHdpdGggYXQgbGVhc3Qgb25lIGVsZW1lbnRcIl0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIGlkeCA9IHNjaGVtYS5vbmVPZi5sZW5ndGg7XG4gICAgICAgICAgICB3aGlsZSAoaWR4LS0pIHtcbiAgICAgICAgICAgICAgICByZXBvcnQucGF0aC5wdXNoKFwib25lT2ZcIik7XG4gICAgICAgICAgICAgICAgcmVwb3J0LnBhdGgucHVzaChpZHgudG9TdHJpbmcoKSk7XG4gICAgICAgICAgICAgICAgZXhwb3J0cy52YWxpZGF0ZVNjaGVtYS5jYWxsKHRoaXMsIHJlcG9ydCwgc2NoZW1hLm9uZU9mW2lkeF0pO1xuICAgICAgICAgICAgICAgIHJlcG9ydC5wYXRoLnBvcCgpO1xuICAgICAgICAgICAgICAgIHJlcG9ydC5wYXRoLnBvcCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcbiAgICBub3Q6IGZ1bmN0aW9uIChyZXBvcnQsIHNjaGVtYSkge1xuICAgICAgICAvLyBodHRwOi8vanNvbi1zY2hlbWEub3JnL2xhdGVzdC9qc29uLXNjaGVtYS12YWxpZGF0aW9uLmh0bWwjcmZjLnNlY3Rpb24uNS41LjYuMVxuICAgICAgICBpZiAoVXRpbHMud2hhdElzKHNjaGVtYS5ub3QpICE9PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgICByZXBvcnQuYWRkRXJyb3IoXCJLRVlXT1JEX1RZUEVfRVhQRUNURURcIiwgW1wibm90XCIsIFwib2JqZWN0XCJdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlcG9ydC5wYXRoLnB1c2goXCJub3RcIik7XG4gICAgICAgICAgICBleHBvcnRzLnZhbGlkYXRlU2NoZW1hLmNhbGwodGhpcywgcmVwb3J0LCBzY2hlbWEubm90KTtcbiAgICAgICAgICAgIHJlcG9ydC5wYXRoLnBvcCgpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBkZWZpbml0aW9uczogZnVuY3Rpb24gKHJlcG9ydCwgc2NoZW1hKSB7XG4gICAgICAgIC8vIGh0dHA6Ly9qc29uLXNjaGVtYS5vcmcvbGF0ZXN0L2pzb24tc2NoZW1hLXZhbGlkYXRpb24uaHRtbCNyZmMuc2VjdGlvbi41LjUuNy4xXG4gICAgICAgIGlmIChVdGlscy53aGF0SXMoc2NoZW1hLmRlZmluaXRpb25zKSAhPT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgcmVwb3J0LmFkZEVycm9yKFwiS0VZV09SRF9UWVBFX0VYUEVDVEVEXCIsIFtcImRlZmluaXRpb25zXCIsIFwib2JqZWN0XCJdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMoc2NoZW1hLmRlZmluaXRpb25zKSxcbiAgICAgICAgICAgICAgICBpZHggPSBrZXlzLmxlbmd0aDtcbiAgICAgICAgICAgIHdoaWxlIChpZHgtLSkge1xuICAgICAgICAgICAgICAgIHZhciBrZXkgPSBrZXlzW2lkeF0sXG4gICAgICAgICAgICAgICAgICAgIHZhbCA9IHNjaGVtYS5kZWZpbml0aW9uc1trZXldO1xuICAgICAgICAgICAgICAgIHJlcG9ydC5wYXRoLnB1c2goXCJkZWZpbml0aW9uc1wiKTtcbiAgICAgICAgICAgICAgICByZXBvcnQucGF0aC5wdXNoKGtleSk7XG4gICAgICAgICAgICAgICAgZXhwb3J0cy52YWxpZGF0ZVNjaGVtYS5jYWxsKHRoaXMsIHJlcG9ydCwgdmFsKTtcbiAgICAgICAgICAgICAgICByZXBvcnQucGF0aC5wb3AoKTtcbiAgICAgICAgICAgICAgICByZXBvcnQucGF0aC5wb3AoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG4gICAgZm9ybWF0OiBmdW5jdGlvbiAocmVwb3J0LCBzY2hlbWEpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBzY2hlbWEuZm9ybWF0ICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICByZXBvcnQuYWRkRXJyb3IoXCJLRVlXT1JEX1RZUEVfRVhQRUNURURcIiwgW1wiZm9ybWF0XCIsIFwic3RyaW5nXCJdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChGb3JtYXRWYWxpZGF0b3JzW3NjaGVtYS5mb3JtYXRdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICByZXBvcnQuYWRkRXJyb3IoXCJVTktOT1dOX0ZPUk1BVFwiLCBbc2NoZW1hLmZvcm1hdF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcbiAgICBpZDogZnVuY3Rpb24gKHJlcG9ydCwgc2NoZW1hKSB7XG4gICAgICAgIC8vIGh0dHA6Ly9qc29uLXNjaGVtYS5vcmcvbGF0ZXN0L2pzb24tc2NoZW1hLWNvcmUuaHRtbCNyZmMuc2VjdGlvbi43LjJcbiAgICAgICAgaWYgKHR5cGVvZiBzY2hlbWEuaWQgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHJlcG9ydC5hZGRFcnJvcihcIktFWVdPUkRfVFlQRV9FWFBFQ1RFRFwiLCBbXCJpZFwiLCBcInN0cmluZ1wiXSk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIHRpdGxlOiBmdW5jdGlvbiAocmVwb3J0LCBzY2hlbWEpIHtcbiAgICAgICAgLy8gaHR0cDovL2pzb24tc2NoZW1hLm9yZy9sYXRlc3QvanNvbi1zY2hlbWEtdmFsaWRhdGlvbi5odG1sI3JmYy5zZWN0aW9uLjYuMVxuICAgICAgICBpZiAodHlwZW9mIHNjaGVtYS50aXRsZSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgcmVwb3J0LmFkZEVycm9yKFwiS0VZV09SRF9UWVBFX0VYUEVDVEVEXCIsIFtcInRpdGxlXCIsIFwic3RyaW5nXCJdKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgZGVzY3JpcHRpb246IGZ1bmN0aW9uIChyZXBvcnQsIHNjaGVtYSkge1xuICAgICAgICAvLyBodHRwOi8vanNvbi1zY2hlbWEub3JnL2xhdGVzdC9qc29uLXNjaGVtYS12YWxpZGF0aW9uLmh0bWwjcmZjLnNlY3Rpb24uNi4xXG4gICAgICAgIGlmICh0eXBlb2Ygc2NoZW1hLmRlc2NyaXB0aW9uICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICByZXBvcnQuYWRkRXJyb3IoXCJLRVlXT1JEX1RZUEVfRVhQRUNURURcIiwgW1wiZGVzY3JpcHRpb25cIiwgXCJzdHJpbmdcIl0pO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBcImRlZmF1bHRcIjogZnVuY3Rpb24gKC8qIHJlcG9ydCwgc2NoZW1hICovKSB7XG4gICAgICAgIC8vIGh0dHA6Ly9qc29uLXNjaGVtYS5vcmcvbGF0ZXN0L2pzb24tc2NoZW1hLXZhbGlkYXRpb24uaHRtbCNyZmMuc2VjdGlvbi42LjJcbiAgICAgICAgLy8gVGhlcmUgYXJlIG5vIHJlc3RyaWN0aW9ucyBwbGFjZWQgb24gdGhlIHZhbHVlIG9mIHRoaXMga2V5d29yZC5cbiAgICB9XG59O1xuXG52YXIgdmFsaWRhdGVBcnJheU9mU2NoZW1hcyA9IGZ1bmN0aW9uIChyZXBvcnQsIGFycikge1xuICAgIHZhciBpZHggPSBhcnIubGVuZ3RoO1xuICAgIHdoaWxlIChpZHgtLSkge1xuICAgICAgICBleHBvcnRzLnZhbGlkYXRlU2NoZW1hLmNhbGwodGhpcywgcmVwb3J0LCBhcnJbaWR4XSk7XG4gICAgfVxuICAgIHJldHVybiByZXBvcnQuaXNWYWxpZCgpO1xufTtcblxuZXhwb3J0cy52YWxpZGF0ZVNjaGVtYSA9IGZ1bmN0aW9uIChyZXBvcnQsIHNjaGVtYSkge1xuXG4gICAgcmVwb3J0LmNvbW1vbkVycm9yTWVzc2FnZSA9IFwiU0NIRU1BX1ZBTElEQVRJT05fRkFJTEVEXCI7XG5cbiAgICAvLyBpZiBzY2hlbWEgaXMgYW4gYXJyYXksIGFzc3VtZSBpdCdzIGFuIGFycmF5IG9mIHNjaGVtYXNcbiAgICBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEpKSB7XG4gICAgICAgIHJldHVybiB2YWxpZGF0ZUFycmF5T2ZTY2hlbWFzLmNhbGwodGhpcywgcmVwb3J0LCBzY2hlbWEpO1xuICAgIH1cblxuICAgIC8vIGRvIG5vdCByZXZhbGlkYXRlIHNjaGVtYSB0aGF0IGhhcyBhbHJlYWR5IGJlZW4gdmFsaWRhdGVkIG9uY2VcbiAgICBpZiAoc2NoZW1hLl9fJHZhbGlkYXRlZCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBpZiAkc2NoZW1hIGlzIHByZXNlbnQsIHRoaXMgc2NoZW1hIHNob3VsZCB2YWxpZGF0ZSBhZ2FpbnN0IHRoYXQgJHNjaGVtYVxuICAgIHZhciBoYXNQYXJlbnRTY2hlbWEgPSBzY2hlbWEuJHNjaGVtYSAmJiBzY2hlbWEuaWQgIT09IHNjaGVtYS4kc2NoZW1hO1xuICAgIGlmIChoYXNQYXJlbnRTY2hlbWEpIHtcbiAgICAgICAgaWYgKHNjaGVtYS5fXyRzY2hlbWFSZXNvbHZlZCAmJiBzY2hlbWEuX18kc2NoZW1hUmVzb2x2ZWQgIT09IHNjaGVtYSkge1xuICAgICAgICAgICAgdmFyIHN1YlJlcG9ydCA9IG5ldyBSZXBvcnQocmVwb3J0KTtcbiAgICAgICAgICAgIHZhciB2YWxpZCA9IEpzb25WYWxpZGF0aW9uLnZhbGlkYXRlLmNhbGwodGhpcywgc3ViUmVwb3J0LCBzY2hlbWEuX18kc2NoZW1hUmVzb2x2ZWQsIHNjaGVtYSk7XG4gICAgICAgICAgICBpZiAodmFsaWQgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgcmVwb3J0LmFkZEVycm9yKFwiUEFSRU5UX1NDSEVNQV9WQUxJREFUSU9OX0ZBSUxFRFwiLCBudWxsLCBzdWJSZXBvcnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5pZ25vcmVVbnJlc29sdmFibGVSZWZlcmVuY2VzICE9PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgcmVwb3J0LmFkZEVycm9yKFwiUkVGX1VOUkVTT0xWRURcIiwgW3NjaGVtYS4kc2NoZW1hXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLm5vVHlwZWxlc3MgPT09IHRydWUpIHtcbiAgICAgICAgLy8gaXNzdWUgIzM2IC0gaW5oZXJpdCB0eXBlIHRvIGFueU9mLCBvbmVPZiwgYWxsT2YgaWYgbm9UeXBlbGVzcyBpcyBkZWZpbmVkXG4gICAgICAgIGlmIChzY2hlbWEudHlwZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB2YXIgc2NoZW1hcyA9IFtdO1xuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoc2NoZW1hLmFueU9mKSkgeyBzY2hlbWFzID0gc2NoZW1hcy5jb25jYXQoc2NoZW1hLmFueU9mKTsgfVxuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoc2NoZW1hLm9uZU9mKSkgeyBzY2hlbWFzID0gc2NoZW1hcy5jb25jYXQoc2NoZW1hLm9uZU9mKTsgfVxuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoc2NoZW1hLmFsbE9mKSkgeyBzY2hlbWFzID0gc2NoZW1hcy5jb25jYXQoc2NoZW1hLmFsbE9mKTsgfVxuICAgICAgICAgICAgc2NoZW1hcy5mb3JFYWNoKGZ1bmN0aW9uIChzY2gpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXNjaC50eXBlKSB7IHNjaC50eXBlID0gc2NoZW1hLnR5cGU7IH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIC8vIGVuZCBpc3N1ZSAjMzZcbiAgICAgICAgaWYgKHNjaGVtYS5lbnVtID09PSB1bmRlZmluZWQgJiZcbiAgICAgICAgICAgIHNjaGVtYS50eXBlID09PSB1bmRlZmluZWQgJiZcbiAgICAgICAgICAgIHNjaGVtYS5hbnlPZiA9PT0gdW5kZWZpbmVkICYmXG4gICAgICAgICAgICBzY2hlbWEub25lT2YgPT09IHVuZGVmaW5lZCAmJlxuICAgICAgICAgICAgc2NoZW1hLm5vdCA9PT0gdW5kZWZpbmVkICYmXG4gICAgICAgICAgICBzY2hlbWEuJHJlZiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXBvcnQuYWRkRXJyb3IoXCJLRVlXT1JEX1VOREVGSU5FRF9TVFJJQ1RcIiwgW1widHlwZVwiXSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKHNjaGVtYSksXG4gICAgICAgIGlkeCA9IGtleXMubGVuZ3RoO1xuICAgIHdoaWxlIChpZHgtLSkge1xuICAgICAgICB2YXIga2V5ID0ga2V5c1tpZHhdO1xuICAgICAgICBpZiAoa2V5LmluZGV4T2YoXCJfX1wiKSA9PT0gMCkgeyBjb250aW51ZTsgfVxuICAgICAgICBpZiAoU2NoZW1hVmFsaWRhdG9yc1trZXldICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIFNjaGVtYVZhbGlkYXRvcnNba2V5XS5jYWxsKHRoaXMsIHJlcG9ydCwgc2NoZW1hKTtcbiAgICAgICAgfSBlbHNlIGlmICghaGFzUGFyZW50U2NoZW1hKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLm5vRXh0cmFLZXl3b3JkcyA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIHJlcG9ydC5hZGRFcnJvcihcIktFWVdPUkRfVU5FWFBFQ1RFRFwiLCBba2V5XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgaXNWYWxpZCA9IHJlcG9ydC5pc1ZhbGlkKCk7XG4gICAgaWYgKGlzVmFsaWQpIHtcbiAgICAgICAgc2NoZW1hLl9fJHZhbGlkYXRlZCA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiBpc1ZhbGlkO1xuXG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbmV4cG9ydHMuaXNBYnNvbHV0ZVVyaSA9IGZ1bmN0aW9uICh1cmkpIHtcbiAgICByZXR1cm4gL15odHRwcz86XFwvXFwvLy50ZXN0KHVyaSk7XG59O1xuXG5leHBvcnRzLmlzUmVsYXRpdmVVcmkgPSBmdW5jdGlvbiAodXJpKSB7XG4gICAgLy8gcmVsYXRpdmUgVVJJcyB0aGF0IGVuZCB3aXRoIGEgaGFzaCBzaWduLCBpc3N1ZSAjNTZcbiAgICByZXR1cm4gLy4rIy8udGVzdCh1cmkpO1xufTtcblxuZXhwb3J0cy53aGF0SXMgPSBmdW5jdGlvbiAod2hhdCkge1xuXG4gICAgdmFyIHRvID0gdHlwZW9mIHdoYXQ7XG5cbiAgICBpZiAodG8gPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgaWYgKHdoYXQgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBcIm51bGxcIjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh3aGF0KSkge1xuICAgICAgICAgICAgcmV0dXJuIFwiYXJyYXlcIjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gXCJvYmplY3RcIjsgLy8gdHlwZW9mIHdoYXQgPT09ICdvYmplY3QnICYmIHdoYXQgPT09IE9iamVjdCh3aGF0KSAmJiAhQXJyYXkuaXNBcnJheSh3aGF0KTtcbiAgICB9XG5cbiAgICBpZiAodG8gPT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgaWYgKE51bWJlci5pc0Zpbml0ZSh3aGF0KSkge1xuICAgICAgICAgICAgaWYgKHdoYXQgJSAxID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiaW50ZWdlclwiO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJudW1iZXJcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoTnVtYmVyLmlzTmFOKHdoYXQpKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJub3QtYS1udW1iZXJcIjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gXCJ1bmtub3duLW51bWJlclwiO1xuICAgIH1cblxuICAgIHJldHVybiB0bzsgLy8gdW5kZWZpbmVkLCBib29sZWFuLCBzdHJpbmcsIGZ1bmN0aW9uXG5cbn07XG5cbmV4cG9ydHMuYXJlRXF1YWwgPSBmdW5jdGlvbiBhcmVFcXVhbChqc29uMSwganNvbjIpIHtcbiAgICAvLyBodHRwOi8vanNvbi1zY2hlbWEub3JnL2xhdGVzdC9qc29uLXNjaGVtYS1jb3JlLmh0bWwjcmZjLnNlY3Rpb24uMy42XG5cbiAgICAvLyBUd28gSlNPTiB2YWx1ZXMgYXJlIHNhaWQgdG8gYmUgZXF1YWwgaWYgYW5kIG9ubHkgaWY6XG4gICAgLy8gYm90aCBhcmUgbnVsbHM7IG9yXG4gICAgLy8gYm90aCBhcmUgYm9vbGVhbnMsIGFuZCBoYXZlIHRoZSBzYW1lIHZhbHVlOyBvclxuICAgIC8vIGJvdGggYXJlIHN0cmluZ3MsIGFuZCBoYXZlIHRoZSBzYW1lIHZhbHVlOyBvclxuICAgIC8vIGJvdGggYXJlIG51bWJlcnMsIGFuZCBoYXZlIHRoZSBzYW1lIG1hdGhlbWF0aWNhbCB2YWx1ZTsgb3JcbiAgICBpZiAoanNvbjEgPT09IGpzb24yKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHZhciBpLCBsZW47XG5cbiAgICAvLyBib3RoIGFyZSBhcnJheXMsIGFuZDpcbiAgICBpZiAoQXJyYXkuaXNBcnJheShqc29uMSkgJiYgQXJyYXkuaXNBcnJheShqc29uMikpIHtcbiAgICAgICAgLy8gaGF2ZSB0aGUgc2FtZSBudW1iZXIgb2YgaXRlbXM7IGFuZFxuICAgICAgICBpZiAoanNvbjEubGVuZ3RoICE9PSBqc29uMi5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICAvLyBpdGVtcyBhdCB0aGUgc2FtZSBpbmRleCBhcmUgZXF1YWwgYWNjb3JkaW5nIHRvIHRoaXMgZGVmaW5pdGlvbjsgb3JcbiAgICAgICAgbGVuID0ganNvbjEubGVuZ3RoO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIGlmICghYXJlRXF1YWwoanNvbjFbaV0sIGpzb24yW2ldKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBib3RoIGFyZSBvYmplY3RzLCBhbmQ6XG4gICAgaWYgKGV4cG9ydHMud2hhdElzKGpzb24xKSA9PT0gXCJvYmplY3RcIiAmJiBleHBvcnRzLndoYXRJcyhqc29uMikgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgLy8gaGF2ZSB0aGUgc2FtZSBzZXQgb2YgcHJvcGVydHkgbmFtZXM7IGFuZFxuICAgICAgICB2YXIga2V5czEgPSBPYmplY3Qua2V5cyhqc29uMSk7XG4gICAgICAgIHZhciBrZXlzMiA9IE9iamVjdC5rZXlzKGpzb24yKTtcbiAgICAgICAgaWYgKCFhcmVFcXVhbChrZXlzMSwga2V5czIpKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgLy8gdmFsdWVzIGZvciBhIHNhbWUgcHJvcGVydHkgbmFtZSBhcmUgZXF1YWwgYWNjb3JkaW5nIHRvIHRoaXMgZGVmaW5pdGlvbi5cbiAgICAgICAgbGVuID0ga2V5czEubGVuZ3RoO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIGlmICghYXJlRXF1YWwoanNvbjFba2V5czFbaV1dLCBqc29uMltrZXlzMVtpXV0pKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbn07XG5cbmV4cG9ydHMuaXNVbmlxdWVBcnJheSA9IGZ1bmN0aW9uIChhcnIsIGluZGV4ZXMpIHtcbiAgICB2YXIgaSwgaiwgbCA9IGFyci5sZW5ndGg7XG4gICAgZm9yIChpID0gMDsgaSA8IGw7IGkrKykge1xuICAgICAgICBmb3IgKGogPSBpICsgMTsgaiA8IGw7IGorKykge1xuICAgICAgICAgICAgaWYgKGV4cG9ydHMuYXJlRXF1YWwoYXJyW2ldLCBhcnJbal0pKSB7XG4gICAgICAgICAgICAgICAgaWYgKGluZGV4ZXMpIHsgaW5kZXhlcy5wdXNoKGksIGopOyB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xufTtcblxuZXhwb3J0cy5kaWZmZXJlbmNlID0gZnVuY3Rpb24gKGJpZ1NldCwgc3ViU2V0KSB7XG4gICAgdmFyIGFyciA9IFtdLFxuICAgICAgICBpZHggPSBiaWdTZXQubGVuZ3RoO1xuICAgIHdoaWxlIChpZHgtLSkge1xuICAgICAgICBpZiAoc3ViU2V0LmluZGV4T2YoYmlnU2V0W2lkeF0pID09PSAtMSkge1xuICAgICAgICAgICAgYXJyLnB1c2goYmlnU2V0W2lkeF0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBhcnI7XG59O1xuXG4vLyBOT1QgYSBkZWVwIHZlcnNpb24gb2YgY2xvbmVcbmV4cG9ydHMuY2xvbmUgPSBmdW5jdGlvbiAoc3JjKSB7XG4gICAgaWYgKHR5cGVvZiBzcmMgIT09IFwib2JqZWN0XCIgfHwgc3JjID09PSBudWxsKSB7IHJldHVybiBzcmM7IH1cbiAgICB2YXIgcmVzLCBpZHg7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoc3JjKSkge1xuICAgICAgICByZXMgPSBbXTtcbiAgICAgICAgaWR4ID0gc3JjLmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGlkeC0tKSB7XG4gICAgICAgICAgICByZXNbaWR4XSA9IHNyY1tpZHhdO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmVzID0ge307XG4gICAgICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMoc3JjKTtcbiAgICAgICAgaWR4ID0ga2V5cy5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChpZHgtLSkge1xuICAgICAgICAgICAgdmFyIGtleSA9IGtleXNbaWR4XTtcbiAgICAgICAgICAgIHJlc1trZXldID0gc3JjW2tleV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbn07XG5cbmV4cG9ydHMuY2xvbmVEZWVwID0gZnVuY3Rpb24gKHNyYykge1xuICAgIHZhciB2aXNpdGVkID0gW10sIGNsb25lZCA9IFtdO1xuICAgIGZ1bmN0aW9uIGNsb25lRGVlcChzcmMpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBzcmMgIT09IFwib2JqZWN0XCIgfHwgc3JjID09PSBudWxsKSB7IHJldHVybiBzcmM7IH1cbiAgICAgICAgdmFyIHJlcywgaWR4LCBjaWR4O1xuXG4gICAgICAgIGNpZHggPSB2aXNpdGVkLmluZGV4T2Yoc3JjKTtcbiAgICAgICAgaWYgKGNpZHggIT09IC0xKSB7IHJldHVybiBjbG9uZWRbY2lkeF07IH1cblxuICAgICAgICB2aXNpdGVkLnB1c2goc3JjKTtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoc3JjKSkge1xuICAgICAgICAgICAgcmVzID0gW107XG4gICAgICAgICAgICBjbG9uZWQucHVzaChyZXMpO1xuICAgICAgICAgICAgaWR4ID0gc3JjLmxlbmd0aDtcbiAgICAgICAgICAgIHdoaWxlIChpZHgtLSkge1xuICAgICAgICAgICAgICAgIHJlc1tpZHhdID0gY2xvbmVEZWVwKHNyY1tpZHhdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlcyA9IHt9O1xuICAgICAgICAgICAgY2xvbmVkLnB1c2gocmVzKTtcbiAgICAgICAgICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMoc3JjKTtcbiAgICAgICAgICAgIGlkeCA9IGtleXMubGVuZ3RoO1xuICAgICAgICAgICAgd2hpbGUgKGlkeC0tKSB7XG4gICAgICAgICAgICAgICAgdmFyIGtleSA9IGtleXNbaWR4XTtcbiAgICAgICAgICAgICAgICByZXNba2V5XSA9IGNsb25lRGVlcChzcmNba2V5XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG4gICAgcmV0dXJuIGNsb25lRGVlcChzcmMpO1xufTtcblxuLypcbiAgZm9sbG93aW5nIGZ1bmN0aW9uIGNvbWVzIGZyb20gcHVueWNvZGUuanMgbGlicmFyeVxuICBzZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9iZXN0aWVqcy9wdW55Y29kZS5qc1xuKi9cbi8qanNoaW50IC1XMDE2Ki9cbi8qKlxuICogQ3JlYXRlcyBhbiBhcnJheSBjb250YWluaW5nIHRoZSBudW1lcmljIGNvZGUgcG9pbnRzIG9mIGVhY2ggVW5pY29kZVxuICogY2hhcmFjdGVyIGluIHRoZSBzdHJpbmcuIFdoaWxlIEphdmFTY3JpcHQgdXNlcyBVQ1MtMiBpbnRlcm5hbGx5LFxuICogdGhpcyBmdW5jdGlvbiB3aWxsIGNvbnZlcnQgYSBwYWlyIG9mIHN1cnJvZ2F0ZSBoYWx2ZXMgKGVhY2ggb2Ygd2hpY2hcbiAqIFVDUy0yIGV4cG9zZXMgYXMgc2VwYXJhdGUgY2hhcmFjdGVycykgaW50byBhIHNpbmdsZSBjb2RlIHBvaW50LFxuICogbWF0Y2hpbmcgVVRGLTE2LlxuICogQHNlZSBgcHVueWNvZGUudWNzMi5lbmNvZGVgXG4gKiBAc2VlIDxodHRwczovL21hdGhpYXNieW5lbnMuYmUvbm90ZXMvamF2YXNjcmlwdC1lbmNvZGluZz5cbiAqIEBtZW1iZXJPZiBwdW55Y29kZS51Y3MyXG4gKiBAbmFtZSBkZWNvZGVcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJpbmcgVGhlIFVuaWNvZGUgaW5wdXQgc3RyaW5nIChVQ1MtMikuXG4gKiBAcmV0dXJucyB7QXJyYXl9IFRoZSBuZXcgYXJyYXkgb2YgY29kZSBwb2ludHMuXG4gKi9cbmV4cG9ydHMudWNzMmRlY29kZSA9IGZ1bmN0aW9uIChzdHJpbmcpIHtcbiAgICB2YXIgb3V0cHV0ID0gW10sXG4gICAgICAgIGNvdW50ZXIgPSAwLFxuICAgICAgICBsZW5ndGggPSBzdHJpbmcubGVuZ3RoLFxuICAgICAgICB2YWx1ZSxcbiAgICAgICAgZXh0cmE7XG4gICAgd2hpbGUgKGNvdW50ZXIgPCBsZW5ndGgpIHtcbiAgICAgICAgdmFsdWUgPSBzdHJpbmcuY2hhckNvZGVBdChjb3VudGVyKyspO1xuICAgICAgICBpZiAodmFsdWUgPj0gMHhEODAwICYmIHZhbHVlIDw9IDB4REJGRiAmJiBjb3VudGVyIDwgbGVuZ3RoKSB7XG4gICAgICAgICAgICAvLyBoaWdoIHN1cnJvZ2F0ZSwgYW5kIHRoZXJlIGlzIGEgbmV4dCBjaGFyYWN0ZXJcbiAgICAgICAgICAgIGV4dHJhID0gc3RyaW5nLmNoYXJDb2RlQXQoY291bnRlcisrKTtcbiAgICAgICAgICAgIGlmICgoZXh0cmEgJiAweEZDMDApID09IDB4REMwMCkgeyAvLyBsb3cgc3Vycm9nYXRlXG4gICAgICAgICAgICAgICAgb3V0cHV0LnB1c2goKCh2YWx1ZSAmIDB4M0ZGKSA8PCAxMCkgKyAoZXh0cmEgJiAweDNGRikgKyAweDEwMDAwKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gdW5tYXRjaGVkIHN1cnJvZ2F0ZTsgb25seSBhcHBlbmQgdGhpcyBjb2RlIHVuaXQsIGluIGNhc2UgdGhlIG5leHRcbiAgICAgICAgICAgICAgICAvLyBjb2RlIHVuaXQgaXMgdGhlIGhpZ2ggc3Vycm9nYXRlIG9mIGEgc3Vycm9nYXRlIHBhaXJcbiAgICAgICAgICAgICAgICBvdXRwdXQucHVzaCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgY291bnRlci0tO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb3V0cHV0LnB1c2godmFsdWUpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBvdXRwdXQ7XG59O1xuLypqc2hpbnQgK1cwMTYqL1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnJlcXVpcmUoXCIuL1BvbHlmaWxsc1wiKTtcbnZhciBSZXBvcnQgICAgICAgICAgICA9IHJlcXVpcmUoXCIuL1JlcG9ydFwiKTtcbnZhciBGb3JtYXRWYWxpZGF0b3JzICA9IHJlcXVpcmUoXCIuL0Zvcm1hdFZhbGlkYXRvcnNcIik7XG52YXIgSnNvblZhbGlkYXRpb24gICAgPSByZXF1aXJlKFwiLi9Kc29uVmFsaWRhdGlvblwiKTtcbnZhciBTY2hlbWFDYWNoZSAgICAgICA9IHJlcXVpcmUoXCIuL1NjaGVtYUNhY2hlXCIpO1xudmFyIFNjaGVtYUNvbXBpbGF0aW9uID0gcmVxdWlyZShcIi4vU2NoZW1hQ29tcGlsYXRpb25cIik7XG52YXIgU2NoZW1hVmFsaWRhdGlvbiAgPSByZXF1aXJlKFwiLi9TY2hlbWFWYWxpZGF0aW9uXCIpO1xudmFyIFV0aWxzICAgICAgICAgICAgID0gcmVxdWlyZShcIi4vVXRpbHNcIik7XG52YXIgRHJhZnQ0U2NoZW1hICAgICAgPSByZXF1aXJlKFwiLi9zY2hlbWFzL3NjaGVtYS5qc29uXCIpO1xudmFyIERyYWZ0NEh5cGVyU2NoZW1hID0gcmVxdWlyZShcIi4vc2NoZW1hcy9oeXBlci1zY2hlbWEuanNvblwiKTtcblxuLypcbiAgICBkZWZhdWx0IG9wdGlvbnNcbiovXG52YXIgZGVmYXVsdE9wdGlvbnMgPSB7XG4gICAgLy8gZGVmYXVsdCB0aW1lb3V0IGZvciBhbGwgYXN5bmMgdGFza3NcbiAgICBhc3luY1RpbWVvdXQ6IDIwMDAsXG4gICAgLy8gZm9yY2UgYWRkaXRpb25hbFByb3BlcnRpZXMgYW5kIGFkZGl0aW9uYWxJdGVtcyB0byBiZSBkZWZpbmVkIG9uIFwib2JqZWN0XCIgYW5kIFwiYXJyYXlcIiB0eXBlc1xuICAgIGZvcmNlQWRkaXRpb25hbDogZmFsc2UsXG4gICAgLy8gYXNzdW1lIGFkZGl0aW9uYWxQcm9wZXJ0aWVzIGFuZCBhZGRpdGlvbmFsSXRlbXMgYXJlIGRlZmluZWQgYXMgXCJmYWxzZVwiIHdoZXJlIGFwcHJvcHJpYXRlXG4gICAgYXNzdW1lQWRkaXRpb25hbDogZmFsc2UsXG4gICAgLy8gZm9yY2UgaXRlbXMgdG8gYmUgZGVmaW5lZCBvbiBcImFycmF5XCIgdHlwZXNcbiAgICBmb3JjZUl0ZW1zOiBmYWxzZSxcbiAgICAvLyBmb3JjZSBtaW5JdGVtcyB0byBiZSBkZWZpbmVkIG9uIFwiYXJyYXlcIiB0eXBlc1xuICAgIGZvcmNlTWluSXRlbXM6IGZhbHNlLFxuICAgIC8vIGZvcmNlIG1heEl0ZW1zIHRvIGJlIGRlZmluZWQgb24gXCJhcnJheVwiIHR5cGVzXG4gICAgZm9yY2VNYXhJdGVtczogZmFsc2UsXG4gICAgLy8gZm9yY2UgbWluTGVuZ3RoIHRvIGJlIGRlZmluZWQgb24gXCJzdHJpbmdcIiB0eXBlc1xuICAgIGZvcmNlTWluTGVuZ3RoOiBmYWxzZSxcbiAgICAvLyBmb3JjZSBtYXhMZW5ndGggdG8gYmUgZGVmaW5lZCBvbiBcInN0cmluZ1wiIHR5cGVzXG4gICAgZm9yY2VNYXhMZW5ndGg6IGZhbHNlLFxuICAgIC8vIGZvcmNlIHByb3BlcnRpZXMgb3IgcGF0dGVyblByb3BlcnRpZXMgdG8gYmUgZGVmaW5lZCBvbiBcIm9iamVjdFwiIHR5cGVzXG4gICAgZm9yY2VQcm9wZXJ0aWVzOiBmYWxzZSxcbiAgICAvLyBpZ25vcmUgcmVmZXJlbmNlcyB0aGF0IGNhbm5vdCBiZSByZXNvbHZlZCAocmVtb3RlIHNjaGVtYXMpIC8vIFRPRE86IG1ha2Ugc3VyZSB0aGlzIGlzIG9ubHkgZm9yIHJlbW90ZSBzY2hlbWFzLCBub3QgbG9jYWwgb25lc1xuICAgIGlnbm9yZVVucmVzb2x2YWJsZVJlZmVyZW5jZXM6IGZhbHNlLFxuICAgIC8vIGRpc2FsbG93IHVzYWdlIG9mIGtleXdvcmRzIHRoYXQgdGhpcyB2YWxpZGF0b3IgY2FuJ3QgaGFuZGxlXG4gICAgbm9FeHRyYUtleXdvcmRzOiBmYWxzZSxcbiAgICAvLyBkaXNhbGxvdyB1c2FnZSBvZiBzY2hlbWEncyB3aXRob3V0IFwidHlwZVwiIGRlZmluZWRcbiAgICBub1R5cGVsZXNzOiBmYWxzZSxcbiAgICAvLyBkaXNhbGxvdyB6ZXJvIGxlbmd0aCBzdHJpbmdzIGluIHZhbGlkYXRlZCBvYmplY3RzXG4gICAgbm9FbXB0eVN0cmluZ3M6IGZhbHNlLFxuICAgIC8vIGRpc2FsbG93IHplcm8gbGVuZ3RoIGFycmF5cyBpbiB2YWxpZGF0ZWQgb2JqZWN0c1xuICAgIG5vRW1wdHlBcnJheXM6IGZhbHNlLFxuICAgIC8vIGZvcmNlcyBcInVyaVwiIGZvcm1hdCB0byBiZSBpbiBmdWxseSByZmMzOTg2IGNvbXBsaWFudFxuICAgIHN0cmljdFVyaXM6IGZhbHNlLFxuICAgIC8vIHR1cm4gb24gc29tZSBvZiB0aGUgYWJvdmVcbiAgICBzdHJpY3RNb2RlOiBmYWxzZSxcbiAgICAvLyByZXBvcnQgZXJyb3IgcGF0aHMgYXMgYW4gYXJyYXkgb2YgcGF0aCBzZWdtZW50cyB0byBnZXQgdG8gdGhlIG9mZmVuZGluZyBub2RlXG4gICAgcmVwb3J0UGF0aEFzQXJyYXk6IGZhbHNlLFxuICAgIC8vIHN0b3BzIHZhbGlkYXRpb24gYXMgc29vbiBhcyBhbiBlcnJvciBpcyBmb3VuZCwgdHJ1ZSBieSBkZWZhdWx0IGJ1dCBjYW4gYmUgdHVybmVkIG9mZlxuICAgIGJyZWFrT25GaXJzdEVycm9yOiB0cnVlXG59O1xuXG4vKlxuICAgIGNvbnN0cnVjdG9yXG4qL1xuZnVuY3Rpb24gWlNjaGVtYShvcHRpb25zKSB7XG4gICAgdGhpcy5jYWNoZSA9IHt9O1xuICAgIHRoaXMucmVmZXJlbmNlQ2FjaGUgPSBbXTtcblxuICAgIHRoaXMuc2V0UmVtb3RlUmVmZXJlbmNlKFwiaHR0cDovL2pzb24tc2NoZW1hLm9yZy9kcmFmdC0wNC9zY2hlbWFcIiwgRHJhZnQ0U2NoZW1hKTtcbiAgICB0aGlzLnNldFJlbW90ZVJlZmVyZW5jZShcImh0dHA6Ly9qc29uLXNjaGVtYS5vcmcvZHJhZnQtMDQvaHlwZXItc2NoZW1hXCIsIERyYWZ0NEh5cGVyU2NoZW1hKTtcblxuICAgIC8vIG9wdGlvbnNcbiAgICBpZiAodHlwZW9mIG9wdGlvbnMgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhvcHRpb25zKSxcbiAgICAgICAgICAgIGlkeCA9IGtleXMubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoaWR4LS0pIHtcbiAgICAgICAgICAgIHZhciBrZXkgPSBrZXlzW2lkeF07XG4gICAgICAgICAgICBpZiAoZGVmYXVsdE9wdGlvbnNba2V5XSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5leHBlY3RlZCBvcHRpb24gcGFzc2VkIHRvIGNvbnN0cnVjdG9yOiBcIiArIGtleSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSBVdGlscy5jbG9uZShkZWZhdWx0T3B0aW9ucyk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5zdHJpY3RNb2RlID09PSB0cnVlKSB7XG4gICAgICAgIHRoaXMub3B0aW9ucy5mb3JjZUFkZGl0aW9uYWwgID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5vcHRpb25zLmZvcmNlSXRlbXMgICAgICAgPSB0cnVlO1xuICAgICAgICB0aGlzLm9wdGlvbnMuZm9yY2VNYXhMZW5ndGggICA9IHRydWU7XG4gICAgICAgIHRoaXMub3B0aW9ucy5mb3JjZVByb3BlcnRpZXMgID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5vcHRpb25zLm5vRXh0cmFLZXl3b3JkcyAgPSB0cnVlO1xuICAgICAgICB0aGlzLm9wdGlvbnMubm9UeXBlbGVzcyAgICAgICA9IHRydWU7XG4gICAgICAgIHRoaXMub3B0aW9ucy5ub0VtcHR5U3RyaW5ncyAgID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5vcHRpb25zLm5vRW1wdHlBcnJheXMgICAgPSB0cnVlO1xuICAgIH1cblxufVxuXG4vKlxuICAgIGluc3RhbmNlIG1ldGhvZHNcbiovXG5aU2NoZW1hLnByb3RvdHlwZS5jb21waWxlU2NoZW1hID0gZnVuY3Rpb24gKHNjaGVtYSkge1xuICAgIHZhciByZXBvcnQgPSBuZXcgUmVwb3J0KHRoaXMub3B0aW9ucyk7XG5cbiAgICBzY2hlbWEgPSBTY2hlbWFDYWNoZS5nZXRTY2hlbWEuY2FsbCh0aGlzLCByZXBvcnQsIHNjaGVtYSk7XG5cbiAgICBTY2hlbWFDb21waWxhdGlvbi5jb21waWxlU2NoZW1hLmNhbGwodGhpcywgcmVwb3J0LCBzY2hlbWEpO1xuXG4gICAgdGhpcy5sYXN0UmVwb3J0ID0gcmVwb3J0O1xuICAgIHJldHVybiByZXBvcnQuaXNWYWxpZCgpO1xufTtcblpTY2hlbWEucHJvdG90eXBlLnZhbGlkYXRlU2NoZW1hID0gZnVuY3Rpb24gKHNjaGVtYSkge1xuICAgIGlmIChBcnJheS5pc0FycmF5KHNjaGVtYSkgJiYgc2NoZW1hLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCIudmFsaWRhdGVTY2hlbWEgd2FzIGNhbGxlZCB3aXRoIGFuIGVtcHR5IGFycmF5XCIpO1xuICAgIH1cblxuICAgIHZhciByZXBvcnQgPSBuZXcgUmVwb3J0KHRoaXMub3B0aW9ucyk7XG5cbiAgICBzY2hlbWEgPSBTY2hlbWFDYWNoZS5nZXRTY2hlbWEuY2FsbCh0aGlzLCByZXBvcnQsIHNjaGVtYSk7XG5cbiAgICB2YXIgY29tcGlsZWQgPSBTY2hlbWFDb21waWxhdGlvbi5jb21waWxlU2NoZW1hLmNhbGwodGhpcywgcmVwb3J0LCBzY2hlbWEpO1xuICAgIGlmIChjb21waWxlZCkgeyBTY2hlbWFWYWxpZGF0aW9uLnZhbGlkYXRlU2NoZW1hLmNhbGwodGhpcywgcmVwb3J0LCBzY2hlbWEpOyB9XG5cbiAgICB0aGlzLmxhc3RSZXBvcnQgPSByZXBvcnQ7XG4gICAgcmV0dXJuIHJlcG9ydC5pc1ZhbGlkKCk7XG59O1xuWlNjaGVtYS5wcm90b3R5cGUudmFsaWRhdGUgPSBmdW5jdGlvbiAoanNvbiwgc2NoZW1hLCBjYWxsYmFjaykge1xuICAgIHZhciB3aGF0SXMgPSBVdGlscy53aGF0SXMoc2NoZW1hKTtcbiAgICBpZiAod2hhdElzICE9PSBcInN0cmluZ1wiICYmIHdoYXRJcyAhPT0gXCJvYmplY3RcIikge1xuICAgICAgICB2YXIgZSA9IG5ldyBFcnJvcihcIkludmFsaWQgLnZhbGlkYXRlIGNhbGwgLSBzY2hlbWEgbXVzdCBiZSBhbiBzdHJpbmcgb3Igb2JqZWN0IGJ1dCBcIiArIHdoYXRJcyArIFwiIHdhcyBwYXNzZWQhXCIpO1xuICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHByb2Nlc3MubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGUsIGZhbHNlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRocm93IGU7XG4gICAgfVxuXG4gICAgdmFyIGZvdW5kRXJyb3IgPSBmYWxzZTtcbiAgICB2YXIgcmVwb3J0ID0gbmV3IFJlcG9ydCh0aGlzLm9wdGlvbnMpO1xuXG4gICAgc2NoZW1hID0gU2NoZW1hQ2FjaGUuZ2V0U2NoZW1hLmNhbGwodGhpcywgcmVwb3J0LCBzY2hlbWEpO1xuXG4gICAgdmFyIGNvbXBpbGVkID0gZmFsc2U7XG4gICAgaWYgKCFmb3VuZEVycm9yKSB7XG4gICAgICAgIGNvbXBpbGVkID0gU2NoZW1hQ29tcGlsYXRpb24uY29tcGlsZVNjaGVtYS5jYWxsKHRoaXMsIHJlcG9ydCwgc2NoZW1hKTtcbiAgICB9XG4gICAgaWYgKCFjb21waWxlZCkge1xuICAgICAgICB0aGlzLmxhc3RSZXBvcnQgPSByZXBvcnQ7XG4gICAgICAgIGZvdW5kRXJyb3IgPSB0cnVlO1xuICAgIH1cblxuICAgIHZhciB2YWxpZGF0ZWQgPSBmYWxzZTtcbiAgICBpZiAoIWZvdW5kRXJyb3IpIHtcbiAgICAgICAgdmFsaWRhdGVkID0gU2NoZW1hVmFsaWRhdGlvbi52YWxpZGF0ZVNjaGVtYS5jYWxsKHRoaXMsIHJlcG9ydCwgc2NoZW1hKTtcbiAgICB9XG4gICAgaWYgKCF2YWxpZGF0ZWQpIHtcbiAgICAgICAgdGhpcy5sYXN0UmVwb3J0ID0gcmVwb3J0O1xuICAgICAgICBmb3VuZEVycm9yID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoIWZvdW5kRXJyb3IpIHtcbiAgICAgICAgSnNvblZhbGlkYXRpb24udmFsaWRhdGUuY2FsbCh0aGlzLCByZXBvcnQsIHNjaGVtYSwganNvbik7XG4gICAgfVxuXG4gICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgIHJlcG9ydC5wcm9jZXNzQXN5bmNUYXNrcyh0aGlzLm9wdGlvbnMuYXN5bmNUaW1lb3V0LCBjYWxsYmFjayk7XG4gICAgICAgIHJldHVybjtcbiAgICB9IGVsc2UgaWYgKHJlcG9ydC5hc3luY1Rhc2tzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVGhpcyB2YWxpZGF0aW9uIGhhcyBhc3luYyB0YXNrcyBhbmQgY2Fubm90IGJlIGRvbmUgaW4gc3luYyBtb2RlLCBwbGVhc2UgcHJvdmlkZSBjYWxsYmFjayBhcmd1bWVudC5cIik7XG4gICAgfVxuXG4gICAgLy8gYXNzaWduIGxhc3RSZXBvcnQgc28gZXJyb3JzIGFyZSByZXRyaWV2YWJsZSBpbiBzeW5jIG1vZGVcbiAgICB0aGlzLmxhc3RSZXBvcnQgPSByZXBvcnQ7XG4gICAgcmV0dXJuIHJlcG9ydC5pc1ZhbGlkKCk7XG59O1xuWlNjaGVtYS5wcm90b3R5cGUuZ2V0TGFzdEVycm9yID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLmxhc3RSZXBvcnQuZXJyb3JzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgdmFyIGUgPSBuZXcgRXJyb3IoKTtcbiAgICBlLm5hbWUgPSBcInotc2NoZW1hIHZhbGlkYXRpb24gZXJyb3JcIjtcbiAgICBlLm1lc3NhZ2UgPSB0aGlzLmxhc3RSZXBvcnQuY29tbW9uRXJyb3JNZXNzYWdlO1xuICAgIGUuZGV0YWlscyA9IHRoaXMubGFzdFJlcG9ydC5lcnJvcnM7XG4gICAgcmV0dXJuIGU7XG59O1xuWlNjaGVtYS5wcm90b3R5cGUuZ2V0TGFzdEVycm9ycyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5sYXN0UmVwb3J0LmVycm9ycy5sZW5ndGggPiAwID8gdGhpcy5sYXN0UmVwb3J0LmVycm9ycyA6IHVuZGVmaW5lZDtcbn07XG5aU2NoZW1hLnByb3RvdHlwZS5nZXRNaXNzaW5nUmVmZXJlbmNlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcmVzID0gW10sXG4gICAgICAgIGlkeCA9IHRoaXMubGFzdFJlcG9ydC5lcnJvcnMubGVuZ3RoO1xuICAgIHdoaWxlIChpZHgtLSkge1xuICAgICAgICB2YXIgZXJyb3IgPSB0aGlzLmxhc3RSZXBvcnQuZXJyb3JzW2lkeF07XG4gICAgICAgIGlmIChlcnJvci5jb2RlID09PSBcIlVOUkVTT0xWQUJMRV9SRUZFUkVOQ0VcIikge1xuICAgICAgICAgICAgdmFyIHJlZmVyZW5jZSA9IGVycm9yLnBhcmFtc1swXTtcbiAgICAgICAgICAgIGlmIChyZXMuaW5kZXhPZihyZWZlcmVuY2UpID09PSAtMSkge1xuICAgICAgICAgICAgICAgIHJlcy5wdXNoKHJlZmVyZW5jZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbn07XG5aU2NoZW1hLnByb3RvdHlwZS5nZXRNaXNzaW5nUmVtb3RlUmVmZXJlbmNlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbWlzc2luZ1JlZmVyZW5jZXMgPSB0aGlzLmdldE1pc3NpbmdSZWZlcmVuY2VzKCksXG4gICAgICAgIG1pc3NpbmdSZW1vdGVSZWZlcmVuY2VzID0gW10sXG4gICAgICAgIGlkeCA9IG1pc3NpbmdSZWZlcmVuY2VzLmxlbmd0aDtcbiAgICB3aGlsZSAoaWR4LS0pIHtcbiAgICAgICAgdmFyIHJlbW90ZVJlZmVyZW5jZSA9IFNjaGVtYUNhY2hlLmdldFJlbW90ZVBhdGgobWlzc2luZ1JlZmVyZW5jZXNbaWR4XSk7XG4gICAgICAgIGlmIChyZW1vdGVSZWZlcmVuY2UgJiYgbWlzc2luZ1JlbW90ZVJlZmVyZW5jZXMuaW5kZXhPZihyZW1vdGVSZWZlcmVuY2UpID09PSAtMSkge1xuICAgICAgICAgICAgbWlzc2luZ1JlbW90ZVJlZmVyZW5jZXMucHVzaChyZW1vdGVSZWZlcmVuY2UpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBtaXNzaW5nUmVtb3RlUmVmZXJlbmNlcztcbn07XG5aU2NoZW1hLnByb3RvdHlwZS5zZXRSZW1vdGVSZWZlcmVuY2UgPSBmdW5jdGlvbiAodXJpLCBzY2hlbWEpIHtcbiAgICBpZiAodHlwZW9mIHNjaGVtYSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICBzY2hlbWEgPSBKU09OLnBhcnNlKHNjaGVtYSk7XG4gICAgfVxuICAgIFNjaGVtYUNhY2hlLmNhY2hlU2NoZW1hQnlVcmkuY2FsbCh0aGlzLCB1cmksIHNjaGVtYSk7XG59O1xuWlNjaGVtYS5wcm90b3R5cGUuZ2V0UmVzb2x2ZWRTY2hlbWEgPSBmdW5jdGlvbiAoc2NoZW1hKSB7XG4gICAgdmFyIHJlcG9ydCA9IG5ldyBSZXBvcnQodGhpcy5vcHRpb25zKTtcbiAgICBzY2hlbWEgPSBTY2hlbWFDYWNoZS5nZXRTY2hlbWEuY2FsbCh0aGlzLCByZXBvcnQsIHNjaGVtYSk7XG5cbiAgICAvLyBjbG9uZSBiZWZvcmUgbWFraW5nIGFueSBtb2RpZmljYXRpb25zXG4gICAgc2NoZW1hID0gVXRpbHMuY2xvbmVEZWVwKHNjaGVtYSk7XG5cbiAgICB2YXIgdmlzaXRlZCA9IFtdO1xuXG4gICAgLy8gY2xlYW4tdXAgdGhlIHNjaGVtYSBhbmQgcmVzb2x2ZSByZWZlcmVuY2VzXG4gICAgdmFyIGNsZWFudXAgPSBmdW5jdGlvbiAoc2NoZW1hKSB7XG4gICAgICAgIHZhciBrZXksXG4gICAgICAgICAgICB0eXBlT2YgPSBVdGlscy53aGF0SXMoc2NoZW1hKTtcbiAgICAgICAgaWYgKHR5cGVPZiAhPT0gXCJvYmplY3RcIiAmJiB0eXBlT2YgIT09IFwiYXJyYXlcIikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNjaGVtYS5fX18kdmlzaXRlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgc2NoZW1hLl9fXyR2aXNpdGVkID0gdHJ1ZTtcbiAgICAgICAgdmlzaXRlZC5wdXNoKHNjaGVtYSk7XG5cbiAgICAgICAgaWYgKHNjaGVtYS4kcmVmICYmIHNjaGVtYS5fXyRyZWZSZXNvbHZlZCkge1xuICAgICAgICAgICAgdmFyIGZyb20gPSBzY2hlbWEuX18kcmVmUmVzb2x2ZWQ7XG4gICAgICAgICAgICB2YXIgdG8gPSBzY2hlbWE7XG4gICAgICAgICAgICBkZWxldGUgc2NoZW1hLiRyZWY7XG4gICAgICAgICAgICBkZWxldGUgc2NoZW1hLl9fJHJlZlJlc29sdmVkO1xuICAgICAgICAgICAgZm9yIChrZXkgaW4gZnJvbSkge1xuICAgICAgICAgICAgICAgIGlmIChmcm9tLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdG9ba2V5XSA9IGZyb21ba2V5XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChrZXkgaW4gc2NoZW1hKSB7XG4gICAgICAgICAgICBpZiAoc2NoZW1hLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoa2V5LmluZGV4T2YoXCJfXyRcIikgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHNjaGVtYVtrZXldO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNsZWFudXAoc2NoZW1hW2tleV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBjbGVhbnVwKHNjaGVtYSk7XG4gICAgdmlzaXRlZC5mb3JFYWNoKGZ1bmN0aW9uIChzKSB7XG4gICAgICAgIGRlbGV0ZSBzLl9fXyR2aXNpdGVkO1xuICAgIH0pO1xuXG4gICAgdGhpcy5sYXN0UmVwb3J0ID0gcmVwb3J0O1xuICAgIGlmIChyZXBvcnQuaXNWYWxpZCgpKSB7XG4gICAgICAgIHJldHVybiBzY2hlbWE7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgdGhpcy5nZXRMYXN0RXJyb3IoKTtcbiAgICB9XG59O1xuWlNjaGVtYS5wcm90b3R5cGUuc2V0U2NoZW1hUmVhZGVyID0gZnVuY3Rpb24gKHNjaGVtYVJlYWRlcikge1xuICAgIHJldHVybiBaU2NoZW1hLnNldFNjaGVtYVJlYWRlcihzY2hlbWFSZWFkZXIpO1xufTtcblpTY2hlbWEucHJvdG90eXBlLmdldFNjaGVtYVJlYWRlciA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gWlNjaGVtYS5zY2hlbWFSZWFkZXI7XG59O1xuXG4vKlxuICAgIHN0YXRpYyBtZXRob2RzXG4qL1xuWlNjaGVtYS5zZXRTY2hlbWFSZWFkZXIgPSBmdW5jdGlvbiAoc2NoZW1hUmVhZGVyKSB7XG4gICAgWlNjaGVtYS5zY2hlbWFSZWFkZXIgPSBzY2hlbWFSZWFkZXI7XG59O1xuWlNjaGVtYS5yZWdpc3RlckZvcm1hdCA9IGZ1bmN0aW9uIChmb3JtYXROYW1lLCB2YWxpZGF0b3JGdW5jdGlvbikge1xuICAgIEZvcm1hdFZhbGlkYXRvcnNbZm9ybWF0TmFtZV0gPSB2YWxpZGF0b3JGdW5jdGlvbjtcbn07XG5aU2NoZW1hLmdldERlZmF1bHRPcHRpb25zID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBVdGlscy5jbG9uZURlZXAoZGVmYXVsdE9wdGlvbnMpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBaU2NoZW1hO1xuIiwibW9kdWxlLmV4cG9ydHM9e1xuICAgIFwiJHNjaGVtYVwiOiBcImh0dHA6Ly9qc29uLXNjaGVtYS5vcmcvZHJhZnQtMDQvaHlwZXItc2NoZW1hI1wiLFxuICAgIFwiaWRcIjogXCJodHRwOi8vanNvbi1zY2hlbWEub3JnL2RyYWZ0LTA0L2h5cGVyLXNjaGVtYSNcIixcbiAgICBcInRpdGxlXCI6IFwiSlNPTiBIeXBlci1TY2hlbWFcIixcbiAgICBcImFsbE9mXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgICAgXCIkcmVmXCI6IFwiaHR0cDovL2pzb24tc2NoZW1hLm9yZy9kcmFmdC0wNC9zY2hlbWEjXCJcbiAgICAgICAgfVxuICAgIF0sXG4gICAgXCJwcm9wZXJ0aWVzXCI6IHtcbiAgICAgICAgXCJhZGRpdGlvbmFsSXRlbXNcIjoge1xuICAgICAgICAgICAgXCJhbnlPZlwiOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJib29sZWFuXCJcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgXCIkcmVmXCI6IFwiI1wiXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9LFxuICAgICAgICBcImFkZGl0aW9uYWxQcm9wZXJ0aWVzXCI6IHtcbiAgICAgICAgICAgIFwiYW55T2ZcIjogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIFwiJHJlZlwiOiBcIiNcIlxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfSxcbiAgICAgICAgXCJkZXBlbmRlbmNpZXNcIjoge1xuICAgICAgICAgICAgXCJhZGRpdGlvbmFsUHJvcGVydGllc1wiOiB7XG4gICAgICAgICAgICAgICAgXCJhbnlPZlwiOiBbXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiJHJlZlwiOiBcIiNcIlxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJhcnJheVwiXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwiaXRlbXNcIjoge1xuICAgICAgICAgICAgXCJhbnlPZlwiOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBcIiRyZWZcIjogXCIjXCJcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9zY2hlbWFBcnJheVwiXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9LFxuICAgICAgICBcImRlZmluaXRpb25zXCI6IHtcbiAgICAgICAgICAgIFwiYWRkaXRpb25hbFByb3BlcnRpZXNcIjoge1xuICAgICAgICAgICAgICAgIFwiJHJlZlwiOiBcIiNcIlxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcInBhdHRlcm5Qcm9wZXJ0aWVzXCI6IHtcbiAgICAgICAgICAgIFwiYWRkaXRpb25hbFByb3BlcnRpZXNcIjoge1xuICAgICAgICAgICAgICAgIFwiJHJlZlwiOiBcIiNcIlxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcInByb3BlcnRpZXNcIjoge1xuICAgICAgICAgICAgXCJhZGRpdGlvbmFsUHJvcGVydGllc1wiOiB7XG4gICAgICAgICAgICAgICAgXCIkcmVmXCI6IFwiI1wiXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwiYWxsT2ZcIjoge1xuICAgICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9zY2hlbWFBcnJheVwiXG4gICAgICAgIH0sXG4gICAgICAgIFwiYW55T2ZcIjoge1xuICAgICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9zY2hlbWFBcnJheVwiXG4gICAgICAgIH0sXG4gICAgICAgIFwib25lT2ZcIjoge1xuICAgICAgICAgICAgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9zY2hlbWFBcnJheVwiXG4gICAgICAgIH0sXG4gICAgICAgIFwibm90XCI6IHtcbiAgICAgICAgICAgIFwiJHJlZlwiOiBcIiNcIlxuICAgICAgICB9LFxuXG4gICAgICAgIFwibGlua3NcIjoge1xuICAgICAgICAgICAgXCJ0eXBlXCI6IFwiYXJyYXlcIixcbiAgICAgICAgICAgIFwiaXRlbXNcIjoge1xuICAgICAgICAgICAgICAgIFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvbGlua0Rlc2NyaXB0aW9uXCJcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJmcmFnbWVudFJlc29sdXRpb25cIjoge1xuICAgICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJtZWRpYVwiOiB7XG4gICAgICAgICAgICBcInR5cGVcIjogXCJvYmplY3RcIixcbiAgICAgICAgICAgIFwicHJvcGVydGllc1wiOiB7XG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkEgbWVkaWEgdHlwZSwgYXMgZGVzY3JpYmVkIGluIFJGQyAyMDQ2XCIsXG4gICAgICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBcImJpbmFyeUVuY29kaW5nXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkEgY29udGVudCBlbmNvZGluZyBzY2hlbWUsIGFzIGRlc2NyaWJlZCBpbiBSRkMgMjA0NVwiLFxuICAgICAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJwYXRoU3RhcnRcIjoge1xuICAgICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkluc3RhbmNlcycgVVJJcyBtdXN0IHN0YXJ0IHdpdGggdGhpcyB2YWx1ZSBmb3IgdGhpcyBzY2hlbWEgdG8gYXBwbHkgdG8gdGhlbVwiLFxuICAgICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCIsXG4gICAgICAgICAgICBcImZvcm1hdFwiOiBcInVyaVwiXG4gICAgICAgIH1cbiAgICB9LFxuICAgIFwiZGVmaW5pdGlvbnNcIjoge1xuICAgICAgICBcInNjaGVtYUFycmF5XCI6IHtcbiAgICAgICAgICAgIFwidHlwZVwiOiBcImFycmF5XCIsXG4gICAgICAgICAgICBcIml0ZW1zXCI6IHtcbiAgICAgICAgICAgICAgICBcIiRyZWZcIjogXCIjXCJcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJsaW5rRGVzY3JpcHRpb25cIjoge1xuICAgICAgICAgICAgXCJ0aXRsZVwiOiBcIkxpbmsgRGVzY3JpcHRpb24gT2JqZWN0XCIsXG4gICAgICAgICAgICBcInR5cGVcIjogXCJvYmplY3RcIixcbiAgICAgICAgICAgIFwicmVxdWlyZWRcIjogWyBcImhyZWZcIiwgXCJyZWxcIiBdLFxuICAgICAgICAgICAgXCJwcm9wZXJ0aWVzXCI6IHtcbiAgICAgICAgICAgICAgICBcImhyZWZcIjoge1xuICAgICAgICAgICAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiYSBVUkkgdGVtcGxhdGUsIGFzIGRlZmluZWQgYnkgUkZDIDY1NzAsIHdpdGggdGhlIGFkZGl0aW9uIG9mIHRoZSAkLCAoIGFuZCApIGNoYXJhY3RlcnMgZm9yIHByZS1wcm9jZXNzaW5nXCIsXG4gICAgICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBcInJlbFwiOiB7XG4gICAgICAgICAgICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJyZWxhdGlvbiB0byB0aGUgdGFyZ2V0IHJlc291cmNlIG9mIHRoZSBsaW5rXCIsXG4gICAgICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBcInRpdGxlXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcImEgdGl0bGUgZm9yIHRoZSBsaW5rXCIsXG4gICAgICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBcInRhcmdldFNjaGVtYVwiOiB7XG4gICAgICAgICAgICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJKU09OIFNjaGVtYSBkZXNjcmliaW5nIHRoZSBsaW5rIHRhcmdldFwiLFxuICAgICAgICAgICAgICAgICAgICBcIiRyZWZcIjogXCIjXCJcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIFwibWVkaWFUeXBlXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIm1lZGlhIHR5cGUgKGFzIGRlZmluZWQgYnkgUkZDIDIwNDYpIGRlc2NyaWJpbmcgdGhlIGxpbmsgdGFyZ2V0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBcIm1ldGhvZFwiOiB7XG4gICAgICAgICAgICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJtZXRob2QgZm9yIHJlcXVlc3RpbmcgdGhlIHRhcmdldCBvZiB0aGUgbGluayAoZS5nLiBmb3IgSFRUUCB0aGlzIG1pZ2h0IGJlIFxcXCJHRVRcXFwiIG9yIFxcXCJERUxFVEVcXFwiKVwiLFxuICAgICAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgXCJlbmNUeXBlXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIlRoZSBtZWRpYSB0eXBlIGluIHdoaWNoIHRvIHN1Ym1pdCBkYXRhIGFsb25nIHdpdGggdGhlIHJlcXVlc3RcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZGVmYXVsdFwiOiBcImFwcGxpY2F0aW9uL2pzb25cIlxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgXCJzY2hlbWFcIjoge1xuICAgICAgICAgICAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiU2NoZW1hIGRlc2NyaWJpbmcgdGhlIGRhdGEgdG8gc3VibWl0IGFsb25nIHdpdGggdGhlIHJlcXVlc3RcIixcbiAgICAgICAgICAgICAgICAgICAgXCIkcmVmXCI6IFwiI1wiXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG4iLCJtb2R1bGUuZXhwb3J0cz17XG4gICAgXCJpZFwiOiBcImh0dHA6Ly9qc29uLXNjaGVtYS5vcmcvZHJhZnQtMDQvc2NoZW1hI1wiLFxuICAgIFwiJHNjaGVtYVwiOiBcImh0dHA6Ly9qc29uLXNjaGVtYS5vcmcvZHJhZnQtMDQvc2NoZW1hI1wiLFxuICAgIFwiZGVzY3JpcHRpb25cIjogXCJDb3JlIHNjaGVtYSBtZXRhLXNjaGVtYVwiLFxuICAgIFwiZGVmaW5pdGlvbnNcIjoge1xuICAgICAgICBcInNjaGVtYUFycmF5XCI6IHtcbiAgICAgICAgICAgIFwidHlwZVwiOiBcImFycmF5XCIsXG4gICAgICAgICAgICBcIm1pbkl0ZW1zXCI6IDEsXG4gICAgICAgICAgICBcIml0ZW1zXCI6IHsgXCIkcmVmXCI6IFwiI1wiIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJwb3NpdGl2ZUludGVnZXJcIjoge1xuICAgICAgICAgICAgXCJ0eXBlXCI6IFwiaW50ZWdlclwiLFxuICAgICAgICAgICAgXCJtaW5pbXVtXCI6IDBcbiAgICAgICAgfSxcbiAgICAgICAgXCJwb3NpdGl2ZUludGVnZXJEZWZhdWx0MFwiOiB7XG4gICAgICAgICAgICBcImFsbE9mXCI6IFsgeyBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL3Bvc2l0aXZlSW50ZWdlclwiIH0sIHsgXCJkZWZhdWx0XCI6IDAgfSBdXG4gICAgICAgIH0sXG4gICAgICAgIFwic2ltcGxlVHlwZXNcIjoge1xuICAgICAgICAgICAgXCJlbnVtXCI6IFsgXCJhcnJheVwiLCBcImJvb2xlYW5cIiwgXCJpbnRlZ2VyXCIsIFwibnVsbFwiLCBcIm51bWJlclwiLCBcIm9iamVjdFwiLCBcInN0cmluZ1wiIF1cbiAgICAgICAgfSxcbiAgICAgICAgXCJzdHJpbmdBcnJheVwiOiB7XG4gICAgICAgICAgICBcInR5cGVcIjogXCJhcnJheVwiLFxuICAgICAgICAgICAgXCJpdGVtc1wiOiB7IFwidHlwZVwiOiBcInN0cmluZ1wiIH0sXG4gICAgICAgICAgICBcIm1pbkl0ZW1zXCI6IDEsXG4gICAgICAgICAgICBcInVuaXF1ZUl0ZW1zXCI6IHRydWVcbiAgICAgICAgfVxuICAgIH0sXG4gICAgXCJ0eXBlXCI6IFwib2JqZWN0XCIsXG4gICAgXCJwcm9wZXJ0aWVzXCI6IHtcbiAgICAgICAgXCJpZFwiOiB7XG4gICAgICAgICAgICBcInR5cGVcIjogXCJzdHJpbmdcIixcbiAgICAgICAgICAgIFwiZm9ybWF0XCI6IFwidXJpXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCIkc2NoZW1hXCI6IHtcbiAgICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiLFxuICAgICAgICAgICAgXCJmb3JtYXRcIjogXCJ1cmlcIlxuICAgICAgICB9LFxuICAgICAgICBcInRpdGxlXCI6IHtcbiAgICAgICAgICAgIFwidHlwZVwiOiBcInN0cmluZ1wiXG4gICAgICAgIH0sXG4gICAgICAgIFwiZGVzY3JpcHRpb25cIjoge1xuICAgICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJkZWZhdWx0XCI6IHt9LFxuICAgICAgICBcIm11bHRpcGxlT2ZcIjoge1xuICAgICAgICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCIsXG4gICAgICAgICAgICBcIm1pbmltdW1cIjogMCxcbiAgICAgICAgICAgIFwiZXhjbHVzaXZlTWluaW11bVwiOiB0cnVlXG4gICAgICAgIH0sXG4gICAgICAgIFwibWF4aW11bVwiOiB7XG4gICAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxuICAgICAgICB9LFxuICAgICAgICBcImV4Y2x1c2l2ZU1heGltdW1cIjoge1xuICAgICAgICAgICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgXCJkZWZhdWx0XCI6IGZhbHNlXG4gICAgICAgIH0sXG4gICAgICAgIFwibWluaW11bVwiOiB7XG4gICAgICAgICAgICBcInR5cGVcIjogXCJudW1iZXJcIlxuICAgICAgICB9LFxuICAgICAgICBcImV4Y2x1c2l2ZU1pbmltdW1cIjoge1xuICAgICAgICAgICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgXCJkZWZhdWx0XCI6IGZhbHNlXG4gICAgICAgIH0sXG4gICAgICAgIFwibWF4TGVuZ3RoXCI6IHsgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9wb3NpdGl2ZUludGVnZXJcIiB9LFxuICAgICAgICBcIm1pbkxlbmd0aFwiOiB7IFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvcG9zaXRpdmVJbnRlZ2VyRGVmYXVsdDBcIiB9LFxuICAgICAgICBcInBhdHRlcm5cIjoge1xuICAgICAgICAgICAgXCJ0eXBlXCI6IFwic3RyaW5nXCIsXG4gICAgICAgICAgICBcImZvcm1hdFwiOiBcInJlZ2V4XCJcbiAgICAgICAgfSxcbiAgICAgICAgXCJhZGRpdGlvbmFsSXRlbXNcIjoge1xuICAgICAgICAgICAgXCJhbnlPZlwiOiBbXG4gICAgICAgICAgICAgICAgeyBcInR5cGVcIjogXCJib29sZWFuXCIgfSxcbiAgICAgICAgICAgICAgICB7IFwiJHJlZlwiOiBcIiNcIiB9XG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgXCJkZWZhdWx0XCI6IHt9XG4gICAgICAgIH0sXG4gICAgICAgIFwiaXRlbXNcIjoge1xuICAgICAgICAgICAgXCJhbnlPZlwiOiBbXG4gICAgICAgICAgICAgICAgeyBcIiRyZWZcIjogXCIjXCIgfSxcbiAgICAgICAgICAgICAgICB7IFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvc2NoZW1hQXJyYXlcIiB9XG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgXCJkZWZhdWx0XCI6IHt9XG4gICAgICAgIH0sXG4gICAgICAgIFwibWF4SXRlbXNcIjogeyBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL3Bvc2l0aXZlSW50ZWdlclwiIH0sXG4gICAgICAgIFwibWluSXRlbXNcIjogeyBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL3Bvc2l0aXZlSW50ZWdlckRlZmF1bHQwXCIgfSxcbiAgICAgICAgXCJ1bmlxdWVJdGVtc1wiOiB7XG4gICAgICAgICAgICBcInR5cGVcIjogXCJib29sZWFuXCIsXG4gICAgICAgICAgICBcImRlZmF1bHRcIjogZmFsc2VcbiAgICAgICAgfSxcbiAgICAgICAgXCJtYXhQcm9wZXJ0aWVzXCI6IHsgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9wb3NpdGl2ZUludGVnZXJcIiB9LFxuICAgICAgICBcIm1pblByb3BlcnRpZXNcIjogeyBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL3Bvc2l0aXZlSW50ZWdlckRlZmF1bHQwXCIgfSxcbiAgICAgICAgXCJyZXF1aXJlZFwiOiB7IFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvc3RyaW5nQXJyYXlcIiB9LFxuICAgICAgICBcImFkZGl0aW9uYWxQcm9wZXJ0aWVzXCI6IHtcbiAgICAgICAgICAgIFwiYW55T2ZcIjogW1xuICAgICAgICAgICAgICAgIHsgXCJ0eXBlXCI6IFwiYm9vbGVhblwiIH0sXG4gICAgICAgICAgICAgICAgeyBcIiRyZWZcIjogXCIjXCIgfVxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIFwiZGVmYXVsdFwiOiB7fVxuICAgICAgICB9LFxuICAgICAgICBcImRlZmluaXRpb25zXCI6IHtcbiAgICAgICAgICAgIFwidHlwZVwiOiBcIm9iamVjdFwiLFxuICAgICAgICAgICAgXCJhZGRpdGlvbmFsUHJvcGVydGllc1wiOiB7IFwiJHJlZlwiOiBcIiNcIiB9LFxuICAgICAgICAgICAgXCJkZWZhdWx0XCI6IHt9XG4gICAgICAgIH0sXG4gICAgICAgIFwicHJvcGVydGllc1wiOiB7XG4gICAgICAgICAgICBcInR5cGVcIjogXCJvYmplY3RcIixcbiAgICAgICAgICAgIFwiYWRkaXRpb25hbFByb3BlcnRpZXNcIjogeyBcIiRyZWZcIjogXCIjXCIgfSxcbiAgICAgICAgICAgIFwiZGVmYXVsdFwiOiB7fVxuICAgICAgICB9LFxuICAgICAgICBcInBhdHRlcm5Qcm9wZXJ0aWVzXCI6IHtcbiAgICAgICAgICAgIFwidHlwZVwiOiBcIm9iamVjdFwiLFxuICAgICAgICAgICAgXCJhZGRpdGlvbmFsUHJvcGVydGllc1wiOiB7IFwiJHJlZlwiOiBcIiNcIiB9LFxuICAgICAgICAgICAgXCJkZWZhdWx0XCI6IHt9XG4gICAgICAgIH0sXG4gICAgICAgIFwiZGVwZW5kZW5jaWVzXCI6IHtcbiAgICAgICAgICAgIFwidHlwZVwiOiBcIm9iamVjdFwiLFxuICAgICAgICAgICAgXCJhZGRpdGlvbmFsUHJvcGVydGllc1wiOiB7XG4gICAgICAgICAgICAgICAgXCJhbnlPZlwiOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgXCIkcmVmXCI6IFwiI1wiIH0sXG4gICAgICAgICAgICAgICAgICAgIHsgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9zdHJpbmdBcnJheVwiIH1cbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwiZW51bVwiOiB7XG4gICAgICAgICAgICBcInR5cGVcIjogXCJhcnJheVwiLFxuICAgICAgICAgICAgXCJtaW5JdGVtc1wiOiAxLFxuICAgICAgICAgICAgXCJ1bmlxdWVJdGVtc1wiOiB0cnVlXG4gICAgICAgIH0sXG4gICAgICAgIFwidHlwZVwiOiB7XG4gICAgICAgICAgICBcImFueU9mXCI6IFtcbiAgICAgICAgICAgICAgICB7IFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvc2ltcGxlVHlwZXNcIiB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiYXJyYXlcIixcbiAgICAgICAgICAgICAgICAgICAgXCJpdGVtc1wiOiB7IFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvc2ltcGxlVHlwZXNcIiB9LFxuICAgICAgICAgICAgICAgICAgICBcIm1pbkl0ZW1zXCI6IDEsXG4gICAgICAgICAgICAgICAgICAgIFwidW5pcXVlSXRlbXNcIjogdHJ1ZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfSxcbiAgICAgICAgXCJhbGxPZlwiOiB7IFwiJHJlZlwiOiBcIiMvZGVmaW5pdGlvbnMvc2NoZW1hQXJyYXlcIiB9LFxuICAgICAgICBcImFueU9mXCI6IHsgXCIkcmVmXCI6IFwiIy9kZWZpbml0aW9ucy9zY2hlbWFBcnJheVwiIH0sXG4gICAgICAgIFwib25lT2ZcIjogeyBcIiRyZWZcIjogXCIjL2RlZmluaXRpb25zL3NjaGVtYUFycmF5XCIgfSxcbiAgICAgICAgXCJub3RcIjogeyBcIiRyZWZcIjogXCIjXCIgfVxuICAgIH0sXG4gICAgXCJkZXBlbmRlbmNpZXNcIjoge1xuICAgICAgICBcImV4Y2x1c2l2ZU1heGltdW1cIjogWyBcIm1heGltdW1cIiBdLFxuICAgICAgICBcImV4Y2x1c2l2ZU1pbmltdW1cIjogWyBcIm1pbmltdW1cIiBdXG4gICAgfSxcbiAgICBcImRlZmF1bHRcIjoge31cbn1cbiIsInZhciBkcmFmdCA9IHJlcXVpcmUoJy4vc2NoZW1hcy9jb3JlLW1ldGFzY2hlbWEtZHJhZnQtMDQnKVxuXG52YXIgc2NoZW1hcyA9IFtcblxuICB7XG4gICAgdGl0bGU6ICdEZWZhdWx0IGNvbXBvbmVudHMgZm9yIHByaW1pdGl2ZSB0eXBlcycsXG4gICAgdHlwZTogJ29iamVjdCcsXG4gICAgcHJvcGVydGllczoge1xuICAgICAgYVN0cmluZzogeyB0eXBlOiAnc3RyaW5nJywgdGl0bGU6ICdUaGlzIGlzIGEgc3RyaW5nJyB9LFxuICAgICAgYVJlcXVpcmVkTnVtYmVyOiB7IHR5cGU6ICdudW1iZXInLCBkZWZhdWx0OiA0MiB9LFxuICAgICAgYUludGVnZXI6IHsgdHlwZTogJ2ludGVnZXInLFxuICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBbiBpbnRlZ2VyIGlzIGEga2luZCBvZiBudW1iZXIgbGlrZSAxLCAyLCBhbmQgMy4nIH0sXG4gICAgICBhRGF0ZTogeyB0eXBlOiAnc3RyaW5nJywgZm9ybWF0OiAnZGF0ZSd9LFxuICAgICAgYUJvb2xlYW46IHsgdHlwZTogJ2Jvb2xlYW4nIH0sXG4gICAgICBhbkVudW06IHsgdGl0bGU6ICdhbiBlbnVtJywgZW51bTogWyAxLCBudWxsLCAncycsIHRydWUgXSB9LFxuICAgICAgYW5BcnJheU9mU3RyaW5nczoge1xuICAgICAgICB0eXBlOiAnYXJyYXknLCBpdGVtczogeyB0eXBlOiAnc3RyaW5nJyB9LCBtaW5JdGVtczogMlxuICAgICAgfSxcbiAgICAgIHRoZU51bGw6IHsgdGl0bGU6ICdudWxsJywgdHlwZTogJ251bGwnIH1cbiAgICB9LFxuICAgIHJlcXVpcmVkOiBbJ2FSZXF1aXJlZE51bWJlciddXG4gIH0sXG5cbiAge1xuICAgIHRpdGxlOiAne306IGFueXRoaW5nIGdvZXMnXG4gIH0sXG5cbiAge1xuICAgIHRpdGxlOiAnU3VwcG9ydCBmb3IgJHJlZicsXG4gICAgdHlwZTogJ29iamVjdCcsXG4gICAgZGVmczoge1xuICAgICAgYTogeyB0eXBlOiAnYm9vbGVhbicgfVxuICAgIH0sXG4gICAgcHJvcGVydGllczoge1xuICAgICAgcmVmX3RvX2RlZjogeyAkcmVmOiAnIy9kZWZzL2EnIH1cbiAgICB9XG4gIH0sXG5cbiAge1xuICAgIHRpdGxlOiAnb25lT2YgLyBhbnlPZicsXG4gICAgb25lT2Y6IFsge3R5cGU6ICdzdHJpbmcnLCB0aXRsZTogJ0Egc3RyaW5nJ30sIHt0eXBlOiAnbnVtYmVyJ30gXSxcbiAgICBhbnlPZjogWyB7IG1pbmltdW06IDIsIHBsYWNlaG9sZGVyOiAzfSwge3R5cGU6ICdudW1iZXInfSBdXG4gIH0sXG5cbiAge1xuICAgIHR5cGU6ICdhcnJheScsXG4gICAgdGl0bGU6ICdBcnJheSBvZiBtdXRhYmxlIG9iamVjdHMnLFxuICAgIG1heEl0ZW1zOiAyLFxuICAgIGl0ZW1zOiB7XG4gICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgZW1haWw6IHtcbiAgICAgICAgICB0aXRsZTogJ0VtYWlsJyxcbiAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICBwYXR0ZXJuOiAnXlxcXFxTK0BcXFxcUyskJyxcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ0VtYWlsIHdpbGwgYmUgdXNlZCBmb3IgZXZpbC4nXG4gICAgICAgIH0sXG4gICAgICAgIHNwYW06IHtcbiAgICAgICAgICB0aXRsZTogJ1NwYW0nLFxuICAgICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgICBkZWZhdWx0OiB0cnVlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAge1xuICAgIHRpdGxlOiAnQm9vaycsXG4gICAgZGVzY3JpcHRpb246ICdUZXN0IGNpcmN1bGFyIHJlZmVyZW5jZXMnLFxuICAgIHR5cGU6ICdvYmplY3QnLFxuICAgIHByb3BlcnRpZXM6IHtcbiAgICAgIGJvb2t0aXRsZTogeyB0eXBlOiAnc3RyaW5nJyB9LFxuICAgICAgY2l0ZXM6IHtcbiAgICAgICAgb25lT2Y6IFtcbiAgICAgICAgICB7IHRpdGxlOiAnQmlibGlvZ3JhcGh5JywgJHJlZjogJyMvZGVmaW5pdGlvbnMvY2l0ZXMnIH0sXG4gICAgICAgICAgeyB0eXBlOiAnc3RyaW5nJyB9XG4gICAgICAgICAgLy8geyB0aXRsZTogJ0JpYmxpb2dyYXBoeScsICRyZWY6ICcjJyB9LFxuICAgICAgICBdXG4gICAgICB9XG4gICAgfSxcbiAgICByZXF1aXJlZDogWydib29rdGl0bGUnXSxcbiAgICBkZWZpbml0aW9uczoge1xuICAgICAgY2l0ZXM6IHtcbiAgICAgICAgdHlwZTogJ2FycmF5JyxcbiAgICAgICAgbWluSXRlbXM6IDAsXG4gICAgICAgIGl0ZW1zOiB7ICRyZWY6ICcjJyB9XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIGRyYWZ0XG5dXG5cblxubW9kdWxlLmV4cG9ydHMgPSBzY2hlbWFzLm1hcChmdW5jdGlvbihzKXtcbiAgcmV0dXJuIHsgc2NoZW1hOiBzLFxuICAgICAgICAgICB2YWx1ZTogdW5kZWZpbmVkLFxuICAgICAgICAgICBmb3JtOiB1bmRlZmluZWR9XG59KVxuIiwidmFyIFZ1ZSA9IHJlcXVpcmUoJ3Z1ZScpXG52YXIgdGVtcGxhdGVzID0gcmVxdWlyZSgnLi4vdGVtcGxhdGVzJylcbnZhciBiYXNlID0gcmVxdWlyZSgnLi9iYXNlLW1peGluJylcbnZhciBfID0gcmVxdWlyZSgnLi4vdXRpbCcpXG5cbi8vIDUuMy4gIFZhbGlkYXRpb24ga2V5d29yZHMgZm9yIGFycmF5c1xuLy8gICAgYWRkaXRpb25hbEl0ZW1zIGFuZCBpdGVtc1xuLy8gICAgbWF4SXRlbXMgbWluSXRlbXNcbi8vICAgIHVuaXF1ZUl0ZW1zXG5cblxuZXhwb3J0c1sndmYtYXJyYXknXSA9IHtcblxuICB0ZW1wbGF0ZTogdGVtcGxhdGVzLmFycmF5LFxuXG4gIG1peGluczogW2Jhc2VdLFxuXG4gIGRhdGE6IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIHsgc3ViZmllbGRzOiBbXSB9XG4gIH0sXG5cbiAgY29tcHV0ZWQ6IHtcblxuICAgIG1pbkxlbmd0aDogZnVuY3Rpb24oKXtcbiAgICAgIHJldHVybiB0aGlzLnNjaGVtYS5taW5JdGVtcyB8fCAwXG4gICAgfSxcbiAgICBtYXhMZW5ndGg6IGZ1bmN0aW9uKCl7XG4gICAgICB2YXIgcyA9IHRoaXMuc2NoZW1hLCB4ID0gSW5maW5pdHlcbiAgICAgIGlmIChOdW1iZXIuaXNJbnRlZ2VyKHMubWF4SXRlbXMpKSB4ID0gcy5tYXhJdGVtc1xuICAgICAgaWYgKHMuYWRkaXRpb25hbEl0ZW1zID09PSBmYWxzZSAmJiBBcnJheS5pc0FycmF5KHMuaXRlbXMpKXtcbiAgICAgICAgeCA9IE1hdGgubWluKHgsIHMuaXRlbXMubGVuZ3RoKVxuICAgICAgfVxuICAgICAgcmV0dXJuIHhcbiAgICB9LFxuXG4gICAgdmFsdWVMZW5ndGg6IGZ1bmN0aW9uKCl7XG4gICAgICByZXR1cm4gdGhpcy52YWx1ZS5sZW5ndGhcbiAgICB9XG5cbiAgfSxcblxuICBtZXRob2RzOiB7XG5cbiAgICBjYXN0VmFsdWU6IGZ1bmN0aW9uKHgpe1xuICAgICAgcmV0dXJuIEFycmF5LmlzQXJyYXkoeCkgPyB4IDogZ2V0RGVmYXVsdCh0aGlzLnNjaGVtYSlcbiAgICB9LFxuXG4gICAgYWRkSXRlbTogZnVuY3Rpb24oKXtcbiAgICAgIHRoaXMudmFsdWUucHVzaCh1bmRlZmluZWQpXG4gICAgICAvLyBUT0RPOiBzZXQgZm9jdXMgb24gbGFzdCBmaWVsZFxuICAgIH0sXG5cbiAgICByZW1vdmVJdGVtOiBmdW5jdGlvbihpKXtcbiAgICAgIGlmICh0aGlzLnZhbHVlLmxlbmd0aCA+ICh0aGlzLnNjaGVtYS5taW5JdGVtc3x8MCkpIHRoaXMudmFsdWUuJHJlbW92ZShpKVxuICAgICAgZWxzZSB0aGlzLnZhbHVlLiRzZXQoaSwgbnVsbClcbiAgICB9LFxuXG4gICAgdXBkYXRlU3ViZmllbGRzOiBmdW5jdGlvbigpe1xuICAgICAgdGhpcy5zdWJmaWVsZHMgPSBnZXRTdWJmaWVsZHModGhpcy5zY2hlbWEsIHRoaXMuZm9ybSwgdGhpcy52YWx1ZSlcbiAgICB9XG5cblxuICB9LFxuXG4gIHdhdGNoOiB7XG5cbiAgICB2YWx1ZUxlbmd0aDogZnVuY3Rpb24oKXtcbiAgICAgIHRoaXMudXBkYXRlU3ViZmllbGRzKClcbiAgICB9XG5cbiAgfSxcblxuICBldmVudHM6IHtcblxuICAgIHZhbHVlQ2hhbmdlZDogZnVuY3Rpb24oY2hpbGQpe1xuICAgICAgdmFyIHZhbCA9IGNoaWxkLnZhbHVlLCBrZXkgPSBjaGlsZC5rZXlcbiAgICAgIGlmICh0eXBlb2Yga2V5ICE9PSAndW5kZWZpbmVkJyAmJiBfLmlzTm90KHZhbCwgdGhpcy52YWx1ZVtrZXldKSl7XG4gICAgICAgIHRoaXMudmFsdWUuJHNldChrZXksIHZhbClcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cblxuICB9XG59XG5cblxuZnVuY3Rpb24gZ2V0RGVmYXVsdChzY2hlbWEpe1xuICB2YXIgZCA9IHNjaGVtYSAmJiBzY2hlbWEuZGVmYXVsdFxuICBpZiAoQXJyYXkuaXNBcnJheShkKSkgZCA9IF8uY29weShkKVxuICBlbHNlIHtcbiAgICB2YXIgaSA9IHNjaGVtYS5taW5JdGVtcyB8fCAwXG4gICAgZCA9IFtdXG4gICAgd2hpbGUgKGktLSkgZC5wdXNoKG51bGwpXG4gIH1cbiAgcmV0dXJuIGRcbn1cblxuXG5mdW5jdGlvbiBnZXRTdWJmaWVsZHMoc2NoZW1hLCBmb3JtLCB2YWx1ZSl7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICd1bmRlZmluZWQnKSByZXR1cm4gW11cblxuICB2YXIgbWluSXRlbXMgPSBzY2hlbWEubWluSXRlbXMgfHwgMCxcbiAgICAgIG5iRmllbGRzID0gTWF0aC5tYXgobWluSXRlbXMsIEFycmF5LmlzQXJyYXkodmFsdWUpID8gdmFsdWUubGVuZ3RoIDogMClcblxuICBpZiAobmJGaWVsZHMgPT09IDApIHJldHVybiBbXVxuXG4gIHZhciBpdGVtc1NjaGVtYSA9IHNjaGVtYS5pdGVtcyB8fCB7fSxcbiAgICAgIGl0ZW1zRm9ybSA9IGZvcm0gPyBmb3JtLml0ZW1zIDogbnVsbFxuXG4gIGlmIChBcnJheS5pc0FycmF5KGl0ZW1zU2NoZW1hKSl7XG4gICAgdmFyIGxlbiA9IGl0ZW1zU2NoZW1hLmxlbmd0aCxcbiAgICAgICAgcmVzdCA9IHNjaGVtYS5hZGRpdGlvbmFsSXRlbXNcbiAgICBpZiAodHlwZW9mIHJlc3QgIT09ICdvYmplY3QnKSByZXN0ID0ge31cbiAgICBmdW5jdGlvbiBpdGhTY2hlbWEoaSl7XG4gICAgICByZXR1cm4gaTxsZW4gPyBpdGVtc1NjaGVtYVtpXSA6IHJlc3RcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgZnVuY3Rpb24gaXRoU2NoZW1hKGkpe1xuICAgICAgcmV0dXJuIGl0ZW1zU2NoZW1hXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gbWFrZUZpZWxkKGkpe1xuICAgIHJldHVybiB7IHNjaGVtYTogaXRoU2NoZW1hKGkpLFxuICAgICAgICAgICAgIGZvcm06IGl0ZW1zRm9ybSxcbiAgICAgICAgICAgICByZXF1aXJlZDogaSA8IG1pbkl0ZW1zIH1cbiAgfVxuXG4gIHZhciByZXMgPSBbXVxuICBmb3IgKHZhciBpPTA7IGk8bmJGaWVsZHM7IGkrKyl7XG4gICAgcmVzLnB1c2gobWFrZUZpZWxkKGkpKVxuICB9XG5cbiAgcmV0dXJuIHJlc1xufVxuIiwidmFyIHRlbXBsYXRlcyA9IHJlcXVpcmUoJy4uL3RlbXBsYXRlcycpXG52YXIgXyA9IHJlcXVpcmUoJy4uL3V0aWwnKVxudmFyIHJlc29sdmVDb21wb25lbnQgPSByZXF1aXJlKCcuLi9yZXNvbHZlLWNvbXBvbmVudCcpXG5cblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cbiAgcmVwbGFjZTogdHJ1ZSxcblxuICBwcm9wczogWyAnc2NoZW1hJywgJ2Zvcm0nLCAndmFsdWUnLCAncGF0aCcsICdrZXknLCAncmVxdWlyZWQnIF0sXG5cbiAgLy8gZGF0YTogZnVuY3Rpb24oKXtcbiAgLy8gICByZXR1cm4geyBlcnJvcnM6IFtdIH1cbiAgLy8gfSxcblxuICBjb21wdXRlZDoge1xuXG4gICAgdmFsdWU6IHtcbiAgICAgIGdldDogZnVuY3Rpb24oKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuJGRhdGEudmFsdWVcbiAgICAgIH0sXG4gICAgICBzZXQ6IGZ1bmN0aW9uKHgpe1xuICAgICAgICB0aGlzLiRkYXRhLnZhbHVlID0gdGhpcy5jYXN0VmFsdWUgPyB0aGlzLmNhc3RWYWx1ZSh4KSA6IHhcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8gRklYTUU6IHVzZSBmb3JtIHBhcmFtIG9yIGFkZCBwcm9wZXJ0aWVzIHRvIHNjaGVtYT9cbiAgICB0aXRsZTogXy5mcm9tRm9ybSgndGl0bGUnLCB0cnVlKSxcbiAgICBkZXNjcmlwdGlvbjogXy5mcm9tRm9ybSgnZGVzY3JpcHRpb24nLCB0cnVlKSxcbiAgICByZWFkb25seTogXy5mcm9tRm9ybSgncmVhZG9ubHknKSxcbiAgICBkaXNhYmxlZDogXy5mcm9tRm9ybSgnZGlzYWJsZWQnKSxcbiAgICBoaWRkZW46IF8uZnJvbUZvcm0oJ2hpZGRlbicpLFxuICAgIHBsYWNlaG9sZGVyOiBfLmZyb21Gb3JtKCdwbGFjZWhvbGRlcicsIHRydWUpXG5cbiAgfSxcblxuICBtZXRob2RzOiB7XG5cbiAgICByZXNvbHZlQ29tcG9uZW50OiByZXNvbHZlQ29tcG9uZW50XG5cbiAgICAvLyBpZGVtcG90ZW50IGZ1bmN0aW9uIGltcGxlbWVudGVkIGluIGNvbmNyZXRlIGNsYXNzZXNcbiAgICAvLyBjYXN0VmFsdWU6IGZ1bmN0aW9uKHgpe1xuICAgIC8vICAgcmV0dXJuIHhcbiAgICAvLyB9XG5cbiAgfSxcblxuICB3YXRjaDoge1xuXG4gICAgdmFsdWU6IGZ1bmN0aW9uKHZhbCwgcHJldmlvdXMpe1xuICAgICAgaWYgKF8uaXNOb3QodmFsLCBwcmV2aW91cykpe1xuICAgICAgICB0aGlzLiRkaXNwYXRjaCgndmFsaWRhdGlvblJlcXVlc3QnKVxuICAgICAgICAvLyBGSVhNRTogZXZlbnRzIHBhcmFsbGVsaW5nIHByb3BzIGJpbmRpbmdzLCBuZWVkZWQgKD8pIHRvIHN1cHBvcnQ6XG4gICAgICAgIC8vIDEuIGFycmF5IG9mIHByaW1pdGl2ZSB2YWx1ZXMgKE9LIGluIHZ1ZSAwLjEyKVxuICAgICAgICAvLyAyLiBzZXR0aW5nIGRlZmF1bHQgdmFsdWUgZnJvbSBjaGlsZCB2bVxuICAgICAgICAvLyBkaXNwYXRjaCBhZnRlciBpbml0aWFsIGJpbmRpbmdcbiAgICAgICAgLy8gdmFyIHZtID0gdGhpc1xuICAgICAgICAvLyBfLm5leHRUaWNrKGZ1bmN0aW9uKCl7XG4gICAgICAgIC8vICAgdm0uJGRpc3BhdGNoKCd2YWx1ZUNoYW5nZWQnLCB2bSlcbiAgICAgICAgLy8gfSlcbiAgICAgIH1cbiAgICB9XG5cbiAgfSxcblxuICBldmVudHM6IHtcblxuICAgIC8vIHZhbGlkYXRpb25TdGFydDogZnVuY3Rpb24oKXtcbiAgICAvLyAgIHRoaXMuZXJyb3JzID0gW11cbiAgICAvLyB9XG5cbiAgfVxuXG59XG4iLCJ2YXIgdGVtcGxhdGVzID0gcmVxdWlyZSgnLi4vdGVtcGxhdGVzJylcbnZhciBiYXNlID0gcmVxdWlyZSgnLi9iYXNlLW1peGluJylcblxuXG5leHBvcnRzLmJ1dHRvbiA9IGV4cG9ydHMuc3VibWl0ID0ge1xuXG4gIHRlbXBsYXRlOiB0ZW1wbGF0ZXMuYnV0dG9uLFxuXG4gIG1peGluczogW2Jhc2VdLFxuXG4gIGNvbXB1dGVkOiB7XG5cbiAgICB0aXRsZTogZnVuY3Rpb24oKXtcbiAgICAgIHJldHVybiB0aGlzLmZvcm0udGl0bGUgfHwgdGhpcy5mb3JtLnR5cGVcbiAgICB9LFxuXG4gICAgdHlwZTogZnVuY3Rpb24oKXtcbiAgICAgIHJldHVybiAodGhpcy5mb3JtLnR5cGUgPT09ICdzdWJtaXQnKSA/ICdzdWJtaXQnIDogJ2J1dHRvbidcbiAgICB9XG5cbiAgfSxcblxuICBtZXRob2RzOiB7XG5cbiAgICBjbGljazogZnVuY3Rpb24oKXtcbiAgICAgIHRoaXMuJGRpc3BhdGNoKHRoaXMuZm9ybS5ldmVudCB8fCAnc3VibWl0JywgdGhpcylcbiAgICB9XG5cbiAgfVxufVxuIiwidmFyIHRlbXBsYXRlcyA9IHJlcXVpcmUoJy4uL3RlbXBsYXRlcycpXG52YXIgYmFzZSA9IHJlcXVpcmUoJy4vYmFzZS1taXhpbicpXG52YXIgXyA9IHJlcXVpcmUoJy4uL3V0aWwnKVxucmVxdWlyZSgndnVlLXNlbGVjdC1qcycpXG5cbnZhciBUWVBFUyA9IFsnb2JqZWN0JywgJ2FycmF5JywgJ3N0cmluZycsICdudW1iZXInLCAnaW50ZWdlcicsICdudWxsJywgJ2Jvb2xlYW4nXVxuXG5cbmV4cG9ydHNbJ3ZmLWdlbmVyaWMnXSA9IHtcblxuICBuYW1lOiAnRm9ybWlkYWJsZUdlbmVyaWMnLFxuXG4gIHRlbXBsYXRlOiB0ZW1wbGF0ZXMuZ2VuZXJpYyxcblxuICBtaXhpbnM6IFtiYXNlXSxcblxuICBkYXRhOiBmdW5jdGlvbigpe1xuICAgIHJldHVybiB7XG4gICAgICBzZWxlY3RlZFR5cGU6IHVuZGVmaW5lZCxcbiAgICAgIHNlbGVjdGVkT25lT2ZzOiBbXSxcbiAgICAgIHNlbGVjdGVkQW55T2ZzOiBbXS8vICxcbiAgICAgIC8vIHR5cGVkVmFsdWVzOiB7fVxuICAgIH1cbiAgfSxcblxuICBjb21wdXRlZDoge1xuXG4gICAgLy8gaGFzU2VsZWN0aW9uOiBmdW5jdGlvbigpe1xuICAgIC8vICAgcmV0dXJuICEhdGhpcy5zZWxlY3RlZFR5cGUgfHwgdGhpcy5zZWxlY3RlZE9uZU9mcy5zb21lKGZ1bmN0aW9uKHgpe3JldHVybiB4fSlcbiAgICAvLyB9LFxuXG4gICAgaGFzT3B0aW9uczogZnVuY3Rpb24oKXtcbiAgICAgIHZhciBvXG4gICAgICByZXR1cm4gKG8gPSB0aGlzLm9uZU9mT3B0aW9ucykgJiYgby5sZW5ndGggfHxcbiAgICAgICAgKG8gPSB0aGlzLmFueU9mT3B0aW9ucykgJiYgby5sZW5ndGhcbiAgICB9LFxuXG4gICAgY29tYmluZWRTY2hlbWE6IGZ1bmN0aW9uKCl7XG4gICAgICByZXR1cm4gXy5jb21iaW5lQWxsKHRoaXMuc2NoZW1hKVxuICAgIH0sXG5cbiAgICB0eXBlT3B0aW9uczogZnVuY3Rpb24oKXtcbiAgICAgIHZhciB0ID0gdGhpcy5jb21iaW5lZFNjaGVtYS50eXBlXG4gICAgICBpZiAoIXQgJiYgIXRoaXMuaGFzT3B0aW9ucykgcmV0dXJuIFRZUEVTXG4gICAgICBlbHNlIHJldHVybiB0XG4gICAgfSxcblxuICAgIG9uZU9mT3B0aW9uczogZnVuY3Rpb24oKXtcbiAgICAgIHZhciBibG9ja3MgPSB0aGlzLmNvbWJpbmVkU2NoZW1hLm9uZU9mc1xuICAgICAgcmV0dXJuIGJsb2Nrcy5tYXAoZnVuY3Rpb24oYmxvY2spe1xuICAgICAgICByZXR1cm4gYmxvY2subWFwKGZ1bmN0aW9uKGEpe1xuICAgICAgICAgIHJldHVybiB7IHZhbHVlOiBhLFxuICAgICAgICAgICAgICAgICAgIHRleHQ6IGEudGl0bGUgfHwgYS5kZXNjcmlwdGlvbiB8fCBhLnR5cGUgfHwgSlNPTi5zdHJpbmdpZnkoYSkgfVxuICAgICAgICB9KVxuICAgICAgfSlcbiAgICB9LFxuXG4gICAgYW55T2ZPcHRpb25zOiBmdW5jdGlvbigpe1xuICAgICAgdmFyIGJsb2NrcyA9IHRoaXMuY29tYmluZWRTY2hlbWEuYW55T2ZzXG4gICAgICByZXR1cm4gYmxvY2tzLm1hcChmdW5jdGlvbihibG9jayl7XG4gICAgICAgIHJldHVybiBibG9jay5tYXAoZnVuY3Rpb24oYSl7XG4gICAgICAgICAgcmV0dXJuIHsgdmFsdWU6IGEsXG4gICAgICAgICAgICAgICAgICAgdGV4dDogYS50aXRsZSB8fCBhLmRlc2NyaXB0aW9uIHx8IGEudHlwZSB8fCBKU09OLnN0cmluZ2lmeShhKSB9XG4gICAgICAgIH0pXG4gICAgICB9KVxuICAgIH0sXG5cbiAgICAvLyBUT0RPOiBjaGVjayBzZWxlY3RlZCBzY2hlbWFzIGZvciBjb21wYXRpYmlsaXR5LFxuICAgIC8vIGNyb3NzLWZpbHRlciBvcHRpb25zIGluIHNlbGVjdCBmaWVsZHNcbiAgICBjdXJyZW50U2NoZW1hOiBmdW5jdGlvbigpe1xuICAgICAgaWYgKCF0aGlzLnNlbGVjdGVkVHlwZSAmJlxuICAgICAgICAgICF0aGlzLnNlbGVjdGVkT25lT2ZzLnNvbWUoZnVuY3Rpb24oeCl7cmV0dXJuIHh9KSAmJlxuICAgICAgICAgICF0aGlzLnNlbGVjdGVkQW55T2ZzLnNvbWUoZnVuY3Rpb24oeCl7cmV0dXJuIHgubGVuZ3RofSkpIHJldHVyblxuXG4gICAgICB2YXIgcyA9IF8uY29tYmluZUFsbCh7IHR5cGU6IHRoaXMuc2VsZWN0ZWRUeXBlIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbWJpbmVkU2NoZW1hLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZWxlY3RlZE9uZU9mcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRBbnlPZnMpXG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShzLnR5cGUpICYmIHMudHlwZS5sZW5ndGggPT09IDEpIHMudHlwZSA9IHMudHlwZVswXVxuICAgICAgcy5vbmVPZiA9IHMub25lT2ZzID0gcy5hbnlPZiA9IHMuYW55T2ZzID0gdW5kZWZpbmVkXG4gICAgICByZXR1cm4gc1xuICAgIH0sXG5cbiAgICAvLyBjdXJyZW50Rm9ybTogZnVuY3Rpb24oKXsgcmV0dXJuIHt9IH0sXG5cbiAgICBjdXJyZW50Q29tcG9uZW50OiBmdW5jdGlvbigpe1xuICAgICAgdmFyIHMgPSB0aGlzLmN1cnJlbnRTY2hlbWFcbiAgICAgIHJldHVybiBzICYmIHRoaXMucmVzb2x2ZUNvbXBvbmVudChzLCB0aGlzLmN1cnJlbnRGb3JtKVxuICAgIH1cblxuICB9LFxuXG4gIHdhdGNoOiB7XG5cbiAgICBvbmVPZk9wdGlvbnM6IGZ1bmN0aW9uKGJsb2Nrcyl7XG4gICAgICB2YXIgbCA9IGJsb2Nrcy5sZW5ndGhcbiAgICAgIGlmICh0aGlzLnNlbGVjdGVkT25lT2ZzLmxlbmd0aCAhPT0gbCl7XG4gICAgICAgIHRoaXMuc2VsZWN0ZWRPbmVPZnMubGVuZ3RoID0gbFxuICAgICAgfVxuICAgIH0sXG5cbiAgICB0eXBlT3B0aW9uczogZnVuY3Rpb24ob3B0cyl7XG4gICAgICBpZiAoIW9wdHMpIHRoaXMuc2VsZWN0ZWRUeXBlID0gdW5kZWZpbmVkXG4gICAgfVxuXG4gIH1cblxufVxuIiwidmFyIF8gPSByZXF1aXJlKCcuLi91dGlsJylcblxuZXhwb3J0c1snc2VsZWN0LWpzJ10gPSByZXF1aXJlKCd2dWUtc2VsZWN0LWpzJylcblxuXy5tZXJnZShcbiAgZXhwb3J0cyxcbiAgcmVxdWlyZSgnLi9pbnB1dHMnKSxcbiAgcmVxdWlyZSgnLi9vYmplY3QnKSxcbiAgcmVxdWlyZSgnLi9hcnJheScpLFxuICByZXF1aXJlKCcuL2dlbmVyaWMnKSxcbiAgcmVxdWlyZSgnLi9idXR0b25zJylcbilcbiIsInZhciB0ZW1wbGF0ZXMgPSByZXF1aXJlKCcuLi90ZW1wbGF0ZXMnKVxudmFyIGJhc2UgPSByZXF1aXJlKCcuL2Jhc2UtbWl4aW4nKVxudmFyIF8gPSByZXF1aXJlKCcuLi91dGlsJylcbnJlcXVpcmUoJ3Z1ZS1zZWxlY3QtanMnKVxuXG5cbi8vIE1hcCBKU09OIFNjaGVtYSBmb3JtYXRzIHRvIEhUTUwgaW5wdXQgdHlwZXNcbnZhciBGMlQgPSB7XG4gICdkYXRlLXRpbWUnOiAnZGF0ZXRpbWUnLFxuICB1cmk6ICd1cmwnLFxuICBlbWFpbDogJ2VtYWlsJyxcbiAgaG9zdG5hbWU6ICd0ZXh0JyxcbiAgaXB2NDogJ3RleHQnLFxuICBpcHY2OiAndGV4dCdcbn1cblxuLy8gYWNjZXB0IEhUTUwgaW5wdXQgdHlwZXMgYXMgSlNPTiBzY2hlbWEgZm9ybWF0c1xuO1sgJ3RleHQnLCAncGFzc3dvcmQnLCAnZW1haWwnLCAndXJsJywgJ3RlbCcsICdjb2xvcicsICdzZWFyY2gnLFxuICAgJ2RhdGV0aW1lJywgJ2RhdGV0aW1lLWxvY2FsJywgJ2RhdGUnLCAnbW9udGgnLCAndGltZScsICd3ZWVrJyxcbiAgICdudW1iZXInLCAncmFuZ2UnLFxuICAgJ2NoZWNrYm94JyBdLmZvckVhY2goZnVuY3Rpb24oZil7XG4gICAgIEYyVFtmXSA9IGZcbiAgIH0pXG5cblxuZXhwb3J0c1sndmYtdGV4dCddID0ge1xuICBuYW1lOiAnZm9ybWlkYWJsZVRleHQnLFxuICB0ZW1wbGF0ZTogdGVtcGxhdGVzLnN0cmluZyxcbiAgbWl4aW5zOiBbYmFzZV0sXG4gIGNvbXB1dGVkOiB7XG4gICAgaW5wdXRUeXBlOiBmdW5jdGlvbigpe1xuICAgICAgdmFyIGYgPSB0aGlzLnNjaGVtYS5mb3JtYXRcbiAgICAgIHJldHVybiBGMlRbZl0gfHwgJ3RleHQnXG4gICAgfVxuICB9LFxuICBtZXRob2RzOiB7XG4gICAgY2FzdFZhbHVlOiBzdHJpbmdpZnlcbiAgfVxufVxuXG5cbmV4cG9ydHNbJ3ZmLXRleHRhcmVhJ10gPSB7XG4gIHRlbXBsYXRlOiB0ZW1wbGF0ZXMudGV4dGFyZWEsXG4gIG1peGluczogW2Jhc2VdLFxuICBjb21wdXRlZDoge1xuICAgIHJvd3M6IF8uZnJvbUZvcm0oJ3Jvd3MnKSxcbiAgICBjb2xzOiBfLmZyb21Gb3JtKCdjb2xzJyksXG4gICAgd3JhcDogXy5mcm9tRm9ybSgnd3JhcCcpXG4gIH0sXG4gIG1ldGhvZHM6IHtcbiAgICBjYXN0VmFsdWU6IHN0cmluZ2lmeVxuICB9XG59XG5cblxuZnVuY3Rpb24gc3RyaW5naWZ5KHgpe1xuICByZXR1cm4gKHggfHwgeCA9PT0gMCkgPyB4ICsgJycgOiAnJ1xufVxuXG5cbmV4cG9ydHNbJ3ZmLW51bWJlciddID0gLypleHBvcnRzWyd2Zi1pbnRlZ2VyJ10gPSovIHtcbiAgbmFtZTogJ2Zvcm1pZGFibGVOdW1iZXInLFxuICB0ZW1wbGF0ZTogdGVtcGxhdGVzLm51bWJlcixcbiAgbWl4aW5zOiBbYmFzZV0sXG4gIG1ldGhvZHM6IHtcbiAgICBjYXN0VmFsdWU6IGZ1bmN0aW9uKHgpe1xuICAgICAgcmV0dXJuIE51bWJlcih4KVxuICAgIH1cbiAgfSxcbiAgY29tcHV0ZWQ6IHtcbiAgICBpbnB1dFR5cGU6IGZ1bmN0aW9uKCl7XG4gICAgICB2YXIgZiA9IHRoaXMuc2NoZW1hLmZvcm1hdFxuICAgICAgcmV0dXJuIEYyVFtmXSB8fCAnbnVtYmVyJ1xuICAgIH0sXG4gICAgbWluOiBmdW5jdGlvbigpe1xuICAgICAgLy8gVE9ETzogdGhpcy5zY2hlbWEuZXhjbHVzaXZlTWluaW11bVxuICAgICAgcmV0dXJuIHRoaXMuc2NoZW1hLm1pbmltdW1cbiAgICB9LFxuICAgIG1heDogZnVuY3Rpb24oKXtcbiAgICAgIC8vIFRPRE86IHRoaXMuc2NoZW1hLmV4Y2x1c2l2ZU1heGltdW1cbiAgICAgIHJldHVybiB0aGlzLnNjaGVtYS5tYXhpbXVtXG4gICAgfSxcbiAgICBzdGVwOiBmdW5jdGlvbigpe1xuICAgICAgLy8gdGhpcy5zY2hlbWEubXVsdGlwbGVPZlxuICAgIH1cbiAgfVxufVxuXG5cbmV4cG9ydHNbJ3ZmLWNoZWNrYm94J10gPSB7XG4gIHRlbXBsYXRlOiB0ZW1wbGF0ZXMuY2hlY2tib3gsXG4gIG1peGluczogW2Jhc2VdLFxuICBtZXRob2RzOiB7XG4gICAgY2FzdFZhbHVlOiBmdW5jdGlvbih4KXtcbiAgICAgIHJldHVybiAhIXhcbiAgICB9XG4gIH1cbn1cblxuXG5leHBvcnRzWyd2Zi1zZWxlY3QnXSA9IHtcbiAgdGVtcGxhdGU6IHRlbXBsYXRlcy5zZWxlY3QsXG4gIG1peGluczogW2Jhc2VdLFxuICBjb21wdXRlZDoge1xuICAgIG9wdGlvbnM6IGZ1bmN0aW9uKCl7XG4gICAgICAvLyBUT0RPOiBmb3JtLmVudW1UaXRsZXMgP1xuICAgICAgcmV0dXJuICh0aGlzLnNjaGVtYVsnZW51bSddIHx8IFtdKS5tYXAoZnVuY3Rpb24oeCwgaSl7XG4gICAgICAgIHJldHVybiB7IHRleHQ6IEpTT04uc3RyaW5naWZ5KHgpLCB2YWx1ZTogeCB9XG4gICAgICB9KVxuICAgIH1cbiAgfVxufVxuXG5cbmV4cG9ydHNbJ3ZmLW51bGwnXSA9IHtcbiAgdGVtcGxhdGU6ICcobnVsbCknLFxuICBtaXhpbnM6IFtiYXNlXSxcbiAgbWV0aG9kczoge1xuICAgIGNhc3RWYWx1ZTogZnVuY3Rpb24oeCl7XG4gICAgICAvLyBGSVhNRTogdnVlIGluaXRzIHByb3BzIHRvIG51bGxcbiAgICAgIHJldHVybiBudWxsXG4gICAgfVxuICB9XG59XG4iLCJ2YXIgdGVtcGxhdGVzID0gcmVxdWlyZSgnLi4vdGVtcGxhdGVzJylcbnZhciBiYXNlID0gcmVxdWlyZSgnLi9iYXNlLW1peGluJylcbnZhciBfID0gcmVxdWlyZSgnLi4vdXRpbCcpXG5cbi8vIDUuNC4gVmFsaWRhdGlvbiBrZXl3b3JkcyBmb3Igb2JqZWN0c1xuLy8gbWF4UHJvcGVydGllcyBtaW5Qcm9wZXJ0aWVzIHJlcXVpcmVkXG4vLyBhZGRpdGlvbmFsUHJvcGVydGllcywgcHJvcGVydGllcywgcGF0dGVyblByb3BlcnRpZXNcbi8vIGRlcGVuZGVuY2llc1xuXG5cbmV4cG9ydHNbJ3ZmLW9iamVjdCddID0ge1xuXG4gIHRlbXBsYXRlOiB0ZW1wbGF0ZXMub2JqZWN0LFxuXG4gIG1peGluczogW2Jhc2VdLFxuXG4gIGRhdGE6IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIHsgc3ViZmllbGRzOiBbXSB9XG4gIH0sXG5cbiAgY29tcHV0ZWQ6IHtcblxuICAgIG1pblByb3BlcnRpZXM6IGZ1bmN0aW9uKCl7XG4gICAgICByZXR1cm4gdGhpcy5zY2hlbWEubWluUHJvcGVydGllcyB8fCAwXG4gICAgfSxcbiAgICBtYXhQcm9wZXJ0aWVzOiBmdW5jdGlvbigpe1xuICAgICAgcmV0dXJuIHRoaXMuc2NoZW1hLm1heFByb3BlcnRpZXMgfHwgSW5maW5pdHlcbiAgICB9LFxuXG4gICAgdmFsdWVLZXlzOiBmdW5jdGlvbigpe1xuICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMudmFsdWUpXG4gICAgfVxuXG4gIH0sXG5cbiAgbWV0aG9kczoge1xuXG4gICAgY2FzdFZhbHVlOiBmdW5jdGlvbih4KXtcbiAgICAgIHJldHVybiBfLmlzUGxhaW5PYmplY3QoeCkgPyB4IDogZ2V0RGVmYXVsdCh0aGlzLnNjaGVtYSlcbiAgICB9LFxuXG4gICAgaGFzUHJvcDogZnVuY3Rpb24oa2V5KXtcbiAgICAgIHJldHVybiB0aGlzLnZhbHVlLmhhc093blByb3BlcnR5KGtleSlcbiAgICB9LFxuICAgIGFkZFByb3A6IGZ1bmN0aW9uKGtleSl7XG4gICAgICBpZiAoa2V5ID09PSBudWxsKXtcbiAgICAgICAga2V5ID0gcHJvbXB0KCdBZGQgYSBwcm9wZXJ0eSBuYW1lZDonKVxuICAgICAgfVxuICAgICAgaWYgKGtleSAhPT0gbnVsbCl7XG4gICAgICAgIC8vIEZJWE1FOiBzdXBwb3J0IHZ1ZS1yZXNlcnZlZCBrZXlzICgkXylcbiAgICAgICAgdGhpcy52YWx1ZS4kYWRkKGtleSlcbiAgICAgIH1cbiAgICB9LFxuICAgIGRlbGV0ZVByb3A6IGZ1bmN0aW9uKGtleSl7XG4gICAgICB0aGlzLnZhbHVlLiRkZWxldGUoa2V5KVxuICAgIH0sXG4gICAgdG9nZ2xlUHJvcDogZnVuY3Rpb24oa2V5KXtcbiAgICAgIGlmICh0aGlzLmhhc1Byb3Aoa2V5KSkgdGhpcy5kZWxldGVQcm9wKGtleSlcbiAgICAgIGVsc2UgdGhpcy5hZGRQcm9wKGtleSlcbiAgICB9LFxuXG4gICAgdXBkYXRlU3ViZmllbGRzOiBmdW5jdGlvbigpe1xuICAgICAgdGhpcy5zdWJmaWVsZHMgPSBnZXRTdWJmaWVsZHModGhpcy5zY2hlbWEsIHRoaXMuZm9ybSwgdGhpcy52YWx1ZSlcbiAgICB9XG5cbiAgfSxcblxuICB3YXRjaDoge1xuXG4gICAgdmFsdWVLZXlzOiBmdW5jdGlvbigpe1xuICAgICAgdGhpcy51cGRhdGVTdWJmaWVsZHMoKVxuICAgIH1cblxuICB9LFxuXG5cbiAgZXZlbnRzOiB7XG5cbiAgICAvLyB2YWx1ZUNoYW5nZWQ6IGZ1bmN0aW9uKGNoaWxkKXtcbiAgICAvLyAgIHZhciBuZXdWYWwgPSBjaGlsZC52YWx1ZSwga2V5ID0gY2hpbGQua2V5XG4gICAgLy8gICBpZiAodHlwZW9mIGtleSAhPT0gJ3VuZGVmaW5lZCcgJiYgXy5pc05vdChuZXdWYWwsIHRoaXMudmFsdWVba2V5XSkpe1xuICAgIC8vICAgICB0aGlzLnZhbHVlLiRhZGQoa2V5KVxuICAgIC8vICAgICB0aGlzLnZhbHVlW2tleV0gPSBuZXdWYWxcbiAgICAvLyAgIH1cbiAgICAvLyAgIHJldHVybiBmYWxzZVxuICAgIC8vIH1cblxuICB9XG5cbn1cblxuXG5mdW5jdGlvbiBnZXREZWZhdWx0KHNjaGVtYSl7XG4gIHZhciBkID0gc2NoZW1hICYmIHNjaGVtYS5kZWZhdWx0XG4gIHJldHVybiBkID8gXy5jb3B5KGQpIDoge31cbn1cblxuXG5mdW5jdGlvbiBnZXRTdWJmaWVsZHMoc2NoZW1hLCBmb3JtLCB2YWx1ZSl7XG5cbiAgaWYgKCF2YWx1ZSkgcmV0dXJuIFtdXG5cbiAgLy8gdXNlZCB0byBsaXN0IHN1YmZpZWxkIGtleXNcbiAgdmFyIHNjaGVtYVByb3BzID0gc2NoZW1hLnByb3BlcnRpZXMgfHwge30sXG4gICAgICByZXF1aXJlZCA9IHNjaGVtYS5yZXF1aXJlZCB8fCBbXVxuXG5cbiAgLy8gVE9ETzogYWNjZXB0IGZvcm0uZmllbGRzIG9wdGlvbj9cbiAgLy8gdmFyIGZpZWxkcyA9IGZvcm0gJiYgZm9ybS5maWVsZHMgfHwgWycqJ11cbiAgdmFyIGZpZWxkcyA9IF8udW5pb25LZXlzKHNjaGVtYVByb3BzLCB2YWx1ZS8qLCByZXF1aXJlZCovKVxuXG4gIC8vIHVzZWQgdG8gYnVpbGQgc3Vic2NoZW1hc1xuICB2YXIgcGF0dGVyblByb3BzID0gc2NoZW1hLnBhdHRlcm5Qcm9wZXJ0aWVzLFxuICAgICAgYWRkUHJvcHMgPSBzY2hlbWEuYWRkaXRpb25hbFByb3BlcnRpZXNcbiAgLy8gZGVmYXVsdCBpcyB0byBhY2NlcHQgYW55IGFkZGl0aW9uYWwgcHJvcGVydHlcbiAgaWYgKCFhZGRQcm9wcyAmJiBhZGRQcm9wcyAhPT0gZmFsc2UpIGFkZFByb3BzID0ge31cblxuICB2YXIgX3VpZCA9IDBcbiAgcmV0dXJuIGl0ZXJGaWVsZHMoZmllbGRzLCBPYmplY3Qua2V5cyhzY2hlbWFQcm9wcyksIHppcEZpZWxkKVxuXG4gIGZ1bmN0aW9uIHppcEZpZWxkKGZpZWxkKXtcbiAgICBpZiAoXy5pc1N0cmluZyhmaWVsZCkpIGZpZWxkID0geyBrZXk6IGZpZWxkIH1cblxuICAgIHZhciBrZXkgPSBmaWVsZC5rZXlcblxuICAgIGlmICh0eXBlb2Yga2V5ID09PSAndW5kZWZpbmVkJyl7XG4gICAgICAvLyBhY3Rpb24sIGV0Yy5cbiAgICAgIC8vIH51bmlxdWUga2V5IGZvciB0cmFjay1ieVxuICAgICAga2V5ID0gJ19fXycrX3VpZCsrKydfXycrSlNPTi5zdHJpbmdpZnkoZmllbGQpXG4gICAgICByZXR1cm4geyBmb3JtOiBmaWVsZCwga2V5OiBrZXksIGlzQWN0aW9uOiB0cnVlIH1cbiAgICB9XG5cbiAgICAvLyBlbnN1cmUgdGhpcyBwcm9wZXJ0eSBpcyBvYnNlcnZlZCAobm9vcCBpZiBrZXkgcHJlLWV4aXN0cyBhcyBub3JtYWwgcHJvcGVydHkpXG4gICAgaWYgKHJlcXVpcmVkLmluZGV4T2Yoa2V5KSAhPT0gLTEpIHZhbHVlLiRhZGQoa2V5KVxuXG4gICAgLy8gYnVpbGQgc2NoZW1hIGZvciBzdWJmaWVsZFxuICAgIHZhciBzdWJzY2hlbWEgPSAoa2V5IGluIHNjaGVtYVByb3BzKSA/IFtzY2hlbWFQcm9wc1trZXldXSA6IFtdXG4gICAgaWYgKHBhdHRlcm5Qcm9wcykge1xuICAgICAgT2JqZWN0LmtleXMocGF0dGVyblByb3BzKS5mb3JFYWNoKGZ1bmN0aW9uKHBrKXtcbiAgICAgICAgaWYgKFJlZ0V4cChwaykudGVzdChrZXkpKSBzdWJzY2hlbWEucHVzaChwYXR0ZXJuUHJvcHNbcGtdKVxuICAgICAgfSlcbiAgICB9XG4gICAgc3Vic2NoZW1hID0gKHN1YnNjaGVtYS5sZW5ndGggPiAxKSA/IHsgYWxsT2Y6IHN1YnNjaGVtYSB9IDogc3Vic2NoZW1hWzBdIHx8IGFkZFByb3BzXG5cbiAgICBpZiAoc3Vic2NoZW1hID09PSBmYWxzZSl7XG4gICAgICAvLyBUT0RPOiBoYW5kbGUgZGlzYWxsb3dlZCBhZGRpdGlvbmFsIHByb3BlcnRpZXNcbiAgICAgIC8vIHJlbmRlciBhcyByZWFkb25seSwgbWFya2VkIGludmFsaWQ/XG4gICAgICBoYW5kbGVJbnZhbGlkKClcbiAgICB9XG5cbiAgICByZXR1cm4geyBzY2hlbWE6IHN1YnNjaGVtYSxcbiAgICAgICAgICAgICBmb3JtOiBmaWVsZCxcbiAgICAgICAgICAgICBrZXk6IGtleSxcbiAgICAgICAgICAgICAvLyB2YWw6IHZhbHVlW2tleV0sXG4gICAgICAgICAgICAgcmVxdWlyZWQ6IChyZXF1aXJlZCAmJiByZXF1aXJlZC5pbmRleE9mKGtleSk+LTEpID8gdHJ1ZSA6IG51bGwgfVxuICB9XG59XG5cblxuZnVuY3Rpb24gaXRlckZpZWxkcyhmaWVsZHMsIGRlZmF1bHRzLCBjYiwgaW5pdFZhbCl7XG4gIHJldHVybiBmaWVsZHMucmVkdWNlKGZ1bmN0aW9uKGFjYywgZil7XG4gICAgaWYgKGYgPT09ICcqJyl7XG4gICAgICBkZWZhdWx0cy5mb3JFYWNoKGZ1bmN0aW9uKHgpe1xuICAgICAgICBhY2MucHVzaChjYih4KSlcbiAgICAgIH0pXG4gICAgfSBlbHNlIHtcbiAgICAgIGFjYy5wdXNoKGNiKGYpKVxuICAgIH1cbiAgICByZXR1cm4gYWNjXG4gIH0sIGluaXRWYWwgfHwgW10pXG59XG4iLCJ2YXIgWlNjaGVtYSA9IHJlcXVpcmUoJ3otc2NoZW1hJylcblxudmFyIHRlbXBsYXRlcyA9IHJlcXVpcmUoJy4vdGVtcGxhdGVzJylcbnZhciBfID0gcmVxdWlyZSgnLi91dGlsJylcbnZhciByZXNvbHZlQ29tcG9uZW50ID0gcmVxdWlyZSgnLi9yZXNvbHZlLWNvbXBvbmVudCcpXG52YXIgY29tcG9uZW50cyA9IHJlcXVpcmUoJy4vY29tcG9uZW50cycpXG5cblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cbiAgbmFtZTogJ1Z1ZUZvcm1pZGFibGUnLFxuXG4gIHJlcGxhY2U6IGZhbHNlLFxuXG4gIHRlbXBsYXRlOiB0ZW1wbGF0ZXMuZm9ybSxcblxuICBwcm9wczogWyAnc2NoZW1hJywgJ2Zvcm0nLCAndmFsdWUnLCAncGF0aCcgXSxcblxuICBkYXRhOiBmdW5jdGlvbigpe1xuICAgIHJldHVybiB7IHZhbHVlOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgcmVzb2x2ZWRTY2hlbWE6IHVuZGVmaW5lZCwgZXJyb3JzOiBbXSB9XG4gIH0sXG5cbiAgY29tcHV0ZWQ6IHsgfSxcblxuICBtZXRob2RzOiB7XG5cbiAgICByZXNvbHZlQ29tcG9uZW50OiByZXNvbHZlQ29tcG9uZW50LFxuXG4gICAgdmFsaWRhdGU6IGZ1bmN0aW9uKCl7XG4gICAgICB0aGlzLiRicm9hZGNhc3QoJ3ZhbGlkYXRpb25TdGFydCcpXG4gICAgICB0aGlzLnZhbGlkYXRvci52YWxpZGF0ZSh0aGlzLnZhbHVlLCB0aGlzLnNjaGVtYSlcbiAgICAgIHZhciBlcnJvcnMgPSB0aGlzLnZhbGlkYXRvci5nZXRMYXN0RXJyb3JzKClcbiAgICAgIC8vIFRPRE86IGJyb2FkY2FzdCBvciBwdWJsaXNoIGFzIG5lc3RlZCBlcnJvcnMgb2JqZWN0XG4gICAgICAvLyB0aGlzLiRicm9hZGNhc3QoKVxuICAgICAgdGhpcy5lcnJvcnMgPSBlcnJvcnNcbiAgICB9XG5cbiAgfSxcblxuICBjb21wb25lbnRzOiBjb21wb25lbnRzLFxuXG4gIHdhdGNoOiB7XG5cbiAgICBzY2hlbWE6IGZ1bmN0aW9uKHMpe1xuICAgICAgdmFyIHYgPSB0aGlzLnZhbGlkYXRvciA9IG5ldyBaU2NoZW1hKClcbiAgICAgIHYuY29tcGlsZVNjaGVtYShzKVxuICAgICAgdGhpcy5yZXNvbHZlZFNjaGVtYSA9IHYuZ2V0UmVzb2x2ZWRTY2hlbWEocylcbiAgICB9XG5cbiAgfSxcblxuICBldmVudHM6IHtcblxuICAgIC8vIHZhbHVlQ2hhbmdlZDogZnVuY3Rpb24oY2hpbGQpe1xuICAgIC8vICAgdmFyIG5ld1ZhbCA9IGNoaWxkLnZhbHVlXG4gICAgLy8gICBpZiAoXy5pc05vdChuZXdWYWwsIHRoaXMudmFsdWUpKSB0aGlzLnZhbHVlID0gbmV3VmFsXG4gICAgLy8gICByZXR1cm4gZmFsc2VcbiAgICAvLyB9LFxuXG4gICAgdmFsaWRhdGlvblJlcXVlc3Q6IGZ1bmN0aW9uKCl7XG4gICAgICB2YXIgdm0gPSB0aGlzXG4gICAgICBfLm5leHRUaWNrKGZ1bmN0aW9uKCl7XG4gICAgICAgIHZtLnZhbGlkYXRlKClcbiAgICAgIH0pXG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgfVxuXG59XG4iLCJcbi8qKlxuICogTWFwcGluZyBvZiBKU09OIFNjaGVtYSBwcmltaXRpdmUgdHlwZXMgdG8gY29tcG9uZW50IG5hbWVzXG4gKiAqL1xuXG52YXIgVDJDID0ge1xuICBib29sZWFuOiAnY2hlY2tib3gnLFxuICBzdHJpbmc6ICd0ZXh0JyxcbiAgaW50ZWdlcjogJ251bWJlcidcbiAgLy8gbnVtYmVyOiAnbnVtYmVyJywgb2JqZWN0OiAnb2JqZWN0JywgYXJyYXk6ICdhcnJheScsIG51bGw6ICdudWxsJ1xufVxuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gcmVzb2x2ZUNvbXBvbmVudChzY2hlbWEsIGZvcm0pe1xuICB2YXIgdFxuXG4gIC8vIFRPRE86IHJlc29sdmVyIGZ1bmMgQVBJP1xuICBpZiAoZm9ybSAmJiAodCA9IGZvcm0udHlwZSkpIHJldHVybiB0XG5cbiAgLy8gaWYgKCFzY2hlbWEpIHJldHVybiB1bmRlZmluZWRcblxuICBpZiAoJ2VudW0nIGluIHNjaGVtYSkgcmV0dXJuICd2Zi1zZWxlY3QnXG5cbiAgaWYgKHNjaGVtYS5vbmVPZiB8fCBzY2hlbWEuYW55T2YgfHwgc2NoZW1hLm9uZU9mcyB8fCBzY2hlbWEuYW55T2ZzIHx8XG4gICAgICBBcnJheS5pc0FycmF5KHQgPSBzY2hlbWEudHlwZSkgfHwgIXQpIHJldHVybiAndmYtZ2VuZXJpYydcblxuICB0ID0gVDJDW3RdIHx8IHRcbiAgaWYgKHQpIHJldHVybiAndmYtJyArIHRcbiAgY29uc29sZS53YXJuKCdJbnZhbGlkIEpTT04gU2NoZW1hIHR5cGUgJywgdClcbn1cbiIsInZhciBmcyA9IHJlcXVpcmUoJ2ZzJylcbnZhciB0ZW1wbGF0ZXMgPSBcIlxcbjx0ZW1wbGF0ZSBpZD1cXFwic3RyaW5nXFxcIj5cXG4gIDxkaXYgY2xhc3M9XFxcInZmLWlucHV0LWdyb3VwXFxcIj5cXG4gICAgPGxhYmVsPnt7IHRpdGxlIHx8IGtleSB9fTwvbGFiZWw+XFxuICAgIDxpbnB1dCB2LW1vZGVsPVxcXCJ2YWx1ZVxcXCJcXG4gICAgICAgICAgIHYtYXR0cj1cXFwidHlwZTogaW5wdXRUeXBlLCBuYW1lOiBwYXRoLCByZXF1aXJlZDogcmVxdWlyZWQsXFxuICAgICAgICAgICAgICAgICAgIG1heGxlbmd0aDogc2NoZW1hLm1heExlbmd0aCwgcGF0dGVybjogc2NoZW1hLnBhdHRlcm4sXFxuICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyOiBwbGFjZWhvbGRlcixcXG4gICAgICAgICAgICAgICAgICAgcmVhZG9ubHk6IHJlYWRvbmx5LCBkaXNhYmxlZDogZGlzYWJsZWRcXFwiXFxuICAgICAgICAgICB2LWVsPVxcXCJpbnB1dFxcXCIvPlxcbiAgICA8ZGl2IHYtaWY9XFxcImRlc2NyaXB0aW9uXFxcIiBjbGFzcz1cXFwidmYtZGVzY1xcXCI+e3sgZGVzY3JpcHRpb24gfX08L2Rpdj5cXG4gIDwvZGl2PlxcbjwvdGVtcGxhdGU+XFxuXFxuXFxuPHRlbXBsYXRlIGlkPVxcXCJ0ZXh0YXJlYVxcXCI+XFxuICA8ZGl2IGNsYXNzPVxcXCJ2Zi1pbnB1dC1ncm91cFxcXCI+XFxuICAgIDxsYWJlbD57eyB0aXRsZSB8fCBrZXkgfX08L2xhYmVsPlxcbiAgICA8dGV4dGFyZWEgdi1tb2RlbD1cXFwidmFsdWVcXFwiXFxuICAgICAgICAgICAgICB2LWF0dHI9XFxcIm5hbWU6IHBhdGgsIHJlcXVpcmVkOiByZXF1aXJlZCxcXG4gICAgICAgICAgICAgICAgICAgICAgbWF4bGVuZ3RoOiBzY2hlbWEubWF4TGVuZ3RoLFxcbiAgICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcjogcGxhY2Vob2xkZXIsXFxuICAgICAgICAgICAgICAgICAgICAgIHJlYWRvbmx5OiByZWFkb25seSwgZGlzYWJsZWQ6IGRpc2FibGVkLFxcbiAgICAgICAgICAgICAgICAgICAgICByb3dzOiByb3dzLCBjb2xzOiBjb2xzLCB3cmFwOiB3cmFwXFxcIlxcbiAgICAgICAgICAgICAgdi1lbD1cXFwiaW5wdXRcXFwiPjwvdGV4dGFyZWE+XFxuICAgIDxkaXYgdi1pZj1cXFwiZGVzY3JpcHRpb25cXFwiIGNsYXNzPVxcXCJ2Zi1kZXNjXFxcIj57eyBkZXNjcmlwdGlvbiB9fTwvZGl2PlxcbiAgPC9kaXY+XFxuPC90ZW1wbGF0ZT5cXG5cXG5cXG48dGVtcGxhdGUgaWQ9XFxcIm51bWJlclxcXCI+XFxuICA8ZGl2IGNsYXNzPVxcXCJ2Zi1pbnB1dC1ncm91cFxcXCI+XFxuICAgIDxsYWJlbD57eyB0aXRsZSB8fCBrZXkgfX08L2xhYmVsPlxcbiAgICA8aW5wdXQgdi1tb2RlbD1cXFwidmFsdWVcXFwiXFxuICAgICAgICAgICB2LWF0dHI9XFxcInR5cGU6IGlucHV0VHlwZSwgbmFtZTogcGF0aCwgcmVxdWlyZWQ6IHJlcXVpcmVkLFxcbiAgICAgICAgICAgICAgICAgICBtaW46IG1pbiwgbWF4OiBtYXgsIHN0ZXA6IHN0ZXAsXFxuICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyOiBwbGFjZWhvbGRlcixcXG4gICAgICAgICAgICAgICAgICAgcmVhZG9ubHk6IHJlYWRvbmx5LCBkaXNhYmxlZDogZGlzYWJsZWRcXFwiXFxuICAgICAgICAgICB2LWVsPVxcXCJpbnB1dFxcXCIgbnVtYmVyLz5cXG4gICAgPGRpdiB2LWlmPVxcXCJkZXNjcmlwdGlvblxcXCIgY2xhc3M9XFxcInZmLWRlc2NcXFwiPnt7IGRlc2NyaXB0aW9uIH19PC9kaXY+XFxuICA8L2Rpdj5cXG48L3RlbXBsYXRlPlxcblxcblxcbjx0ZW1wbGF0ZSBpZD1cXFwiY2hlY2tib3hcXFwiPlxcbiAgPGRpdiBjbGFzcz1cXFwidmYtaW5wdXQtZ3JvdXBcXFwiPlxcbiAgICA8bGFiZWw+e3sgdGl0bGUgfHwga2V5IH19PC9sYWJlbD5cXG4gICAgPGlucHV0IHR5cGU9XFxcImNoZWNrYm94XFxcIiB2LW1vZGVsPVxcXCJ2YWx1ZVxcXCIgdi1lbD1cXFwiaW5wdXRcXFwiXFxuICAgICAgICAgICB2LWF0dHI9XFxcIm5hbWU6IHBhdGhcXFwiLz5cXG4gICAgPGRpdiB2LWlmPVxcXCJkZXNjcmlwdGlvblxcXCIgY2xhc3M9XFxcInZmLWRlc2NcXFwiPnt7IGRlc2NyaXB0aW9uIH19PC9kaXY+XFxuICA8L2Rpdj5cXG48L3RlbXBsYXRlPlxcblxcblxcbjx0ZW1wbGF0ZSBpZD1cXFwic2VsZWN0XFxcIj5cXG4gIDxkaXYgY2xhc3M9XFxcInZmLWlucHV0LWdyb3VwXFxcIj5cXG4gICAgPGxhYmVsPnt7IHRpdGxlIHx8IGtleSB9fTwvbGFiZWw+XFxuICAgIDxzZWxlY3QtanMgdmFsdWU9XFxcInt7dmFsdWV9fVxcXCIgb3B0cz1cXFwie3tvcHRpb25zfX1cXFwiIHYtZWw9XFxcImlucHV0XFxcIlxcbiAgICAgICAgICAgICAgIHYtYXR0cj1cXFwibmFtZTogcGF0aFxcXCI+PC9zZWxlY3QtanM+XFxuICAgIDxkaXYgdi1pZj1cXFwiZGVzY3JpcHRpb25cXFwiIGNsYXNzPVxcXCJ2Zi1kZXNjXFxcIj57eyBkZXNjcmlwdGlvbiB9fTwvZGl2PlxcbiAgPC9kaXY+XFxuPC90ZW1wbGF0ZT5cXG5cXG5cXG48dGVtcGxhdGUgaWQ9XFxcIm9iamVjdFxcXCI+XFxuICA8ZmllbGRzZXQgY2xhc3M9XFxcInZmLW9iamVjdFxcXCI+XFxuICAgIDxsZWdlbmQ+e3sgdGl0bGUgfHwga2V5IH19PC9sZWdlbmQ+XFxuICAgIDxkaXYgdi1pZj1cXFwiZGVzY3JpcHRpb25cXFwiIGNsYXNzPVxcXCJ2Zi1kZXNjXFxcIj57eyBkZXNjcmlwdGlvbiB9fTwvZGl2PlxcbiAgICA8aW5wdXQgdHlwZT1cXFwiYnV0dG9uXFxcIiBkaXNhYmxlZD1cXFwie3sgblByb3BlcnRpZXMgPj0gbWF4UHJvcGVydGllcyB9fVxcXCJcXG4gICAgICAgICAgIHYtb249XFxcImNsaWNrOiBhZGRQcm9wKG51bGwpXFxcIiB2YWx1ZT1cXFwi4p6VXFxcIiB0aXRsZT1cXFwiQWRkIHByb3BlcnR5XFxcIi8+XFxuICAgIDx1bD5cXG4gICAgICA8dGVtcGxhdGUgdi1yZXBlYXQ9XFxcInN1YmZpZWxkc1xcXCIgdi1yZWY9XFxcInN1YlxcXCIgdHJhY2stYnk9XFxcImtleVxcXCI+XFxuICAgICAgICA8bGkgY2xhc3M9XFxcInZmLWl0ZW1cXFwiIHYtY2xhc3M9XFxcImluYWN0aXZlOiAhcmVxdWlyZWQgJiYgIWhhc1Byb3Aoa2V5KVxcXCI+XFxuICAgICAgICAgIDx0ZW1wbGF0ZSB2LWlmPVxcXCIhaXNBY3Rpb25cXFwiPlxcbiAgICAgICAgICAgIDxpbnB1dCB0eXBlPVxcXCJidXR0b25cXFwiIGRpc2FibGVkPVxcXCJ7eyByZXF1aXJlZCB9fVxcXCJcXG4gICAgICAgICAgICAgICAgICAgdi1vbj1cXFwiY2xpY2s6IHRvZ2dsZVByb3Aoa2V5KVxcXCJcXG4gICAgICAgICAgICAgICAgICAgdmFsdWU9XFxcInt7IGhhc1Byb3Aoa2V5KSA/ICfinYwnIDogJ+KelSAnK2tleSB9fVxcXCJcXG4gICAgICAgICAgICAgICAgICAgdGl0bGU9XFxcInt7IGhhc1Byb3Aoa2V5KSA/ICdSZW1vdmUnIDogJ0FkZCcgfX0ge3sga2V5IH19XFxcIlxcbiAgICAgICAgICAgICAgICAgICBjbGFzcz1cXFwidmYtYWRkLXJlbW92ZS1pdGVtXFxcIi8+XFxuICAgICAgICAgIDwvdGVtcGxhdGU+XFxuICAgICAgICAgIDxjb21wb25lbnQgdi1pZj1cXFwicmVxdWlyZWQgfHwgaGFzUHJvcChrZXkpIHx8IGlzQWN0aW9uXFxcIlxcbiAgICAgICAgICAgICAgICAgICAgIGlzPVxcXCJ7eyByZXNvbHZlQ29tcG9uZW50KHNjaGVtYSwgZm9ybSkgfX1cXFwiXFxuICAgICAgICAgICAgICAgICAgICAgc2NoZW1hPVxcXCJ7e3NjaGVtYX19XFxcIiBmb3JtPVxcXCJ7e2Zvcm19fVxcXCIgdmFsdWU9XFxcInt7dmFsdWVba2V5XX19XFxcIlxcbiAgICAgICAgICAgICAgICAgICAgIGtleT1cXFwie3trZXl9fVxcXCIgcGF0aD1cXFwie3sgcGF0aCA/IHBhdGgrJ1snK2tleSsnXScgOiBrZXkgfX1cXFwiXFxuICAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ9XFxcInt7cmVxdWlyZWR9fVxcXCJcXG4gICAgICAgICAgICAgICAgICAgICB2LXJlZj1cXFwiY1xcXCI+PC9jb21wb25lbnQ+XFxuICAgICAgICA8L2xpPlxcbiAgICAgIDwvdGVtcGxhdGU+XFxuICAgIDwvdWw+XFxuICA8L2ZpZWxkc2V0PlxcbjwvdGVtcGxhdGU+XFxuXFxuXFxuPHRlbXBsYXRlIGlkPVxcXCJhcnJheVxcXCI+XFxuICA8ZmllbGRzZXQgY2xhc3M9XFxcInZmLWFycmF5XFxcIj5cXG4gICAgPGxlZ2VuZD57eyB0aXRsZSB8fCBrZXkgfX08L2xlZ2VuZD5cXG4gICAgPGRpdiB2LWlmPVxcXCJkZXNjcmlwdGlvblxcXCIgY2xhc3M9XFxcInZmLWRlc2NcXFwiPnt7IGRlc2NyaXB0aW9uIH19PC9kaXY+XFxuICAgIDxvbD5cXG4gICAgICA8bGkgY2xhc3M9XFxcInZmLWl0ZW1cXFwiIHYtcmVwZWF0PVxcXCJzdWJmaWVsZHNcXFwiIHYtcmVmPVxcXCJzdWJcXFwiIHRyYWNrLWJ5PVxcXCIkaW5kZXhcXFwiPlxcbiAgICAgICAgPGlucHV0IHR5cGU9XFxcImJ1dHRvblxcXCIgZGlzYWJsZWQ9XFxcInt7IHZhbHVlLmxlbmd0aCA8PSBtaW5MZW5ndGggfX1cXFwiXFxuICAgICAgICAgICAgICAgdi1vbj1cXFwiY2xpY2s6IHJlbW92ZUl0ZW0oJGluZGV4KVxcXCIgdmFsdWU9XFxcIuKdjFxcXCJcXG4gICAgICAgICAgICAgICB0aXRsZT1cXFwiUmVtb3ZlIHRoaXMgaXRlbSAoe3sgJGluZGV4IH19KVxcXCJcXG4gICAgICAgICAgICAgICBjbGFzcz1cXFwidmYtYWRkLXJlbW92ZS1pdGVtXFxcIi8+XFxuICAgICAgICA8Y29tcG9uZW50IGlzPVxcXCJ7eyByZXNvbHZlQ29tcG9uZW50KHNjaGVtYSwgZm9ybSkgfX1cXFwiXFxuICAgICAgICAgICAgICAgICAgIHNjaGVtYT1cXFwie3tzY2hlbWF9fVxcXCIgZm9ybT1cXFwie3tmb3JtfX1cXFwiIHZhbHVlPVxcXCJ7e3ZhbHVlWyRpbmRleF19fVxcXCJcXG4gICAgICAgICAgICAgICAgICAga2V5PVxcXCJ7eyRpbmRleH19XFxcIiBwYXRoPVxcXCJ7eyBwYXRoID8gcGF0aCsnWycrJGluZGV4KyddJyA6ICRpbmRleCB9fVxcXCJcXG4gICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ9XFxcInt7cmVxdWlyZWR9fVxcXCIgdi1yZWY9XFxcImNcXFwiPjwvY29tcG9uZW50PlxcbiAgICAgIDwvbGk+XFxuICAgIDwvb2w+XFxuICAgIDxpbnB1dCB0eXBlPVxcXCJidXR0b25cXFwiIGRpc2FibGVkPVxcXCJ7eyB2YWx1ZS5sZW5ndGggPj0gbWF4TGVuZ3RoIH19XFxcIlxcbiAgICAgICAgICAgdi1vbj1cXFwiY2xpY2s6IGFkZEl0ZW1cXFwiIHZhbHVlPVxcXCLinpVcXFwiIHRpdGxlPVxcXCJBZGQgaXRlbVxcXCIvPlxcbiAgPC9maWVsZHNldD5cXG48L3RlbXBsYXRlPlxcblxcblxcbjx0ZW1wbGF0ZSBpZD1cXFwiZ2VuZXJpY1xcXCI+XFxuICA8aGVhZGVyPnt7IHRpdGxlIHx8IGRlc2NyaXB0aW9uIHx8IGtleSB9fTwvaGVhZGVyPlxcblxcbiAgPGRpdiB2LWlmPVxcXCJ0eXBlT3B0aW9uc1xcXCI+XFxuICAgIDxzZWxlY3QgdGl0bGU9XFxcInR5cGVcXFwiIHYtbW9kZWw9XFxcInNlbGVjdGVkVHlwZVxcXCI+XFxuICAgICAgPG9wdGlvbiB2YWx1ZSBkaXNhYmxlZCBzZWxlY3RlZD4tLXR5cGUtLTwvb3B0aW9uPlxcbiAgICAgIDxvcHRpb24gdi1yZXBlYXQ9XFxcInR5cGVPcHRpb25zXFxcIj57eyR2YWx1ZX19PC9vcHRpb24+XFxuICAgIDwvc2VsZWN0PlxcbiAgPC9kaXY+XFxuXFxuICA8ZGl2IHYtaWY9XFxcIm9uZU9mT3B0aW9uc1xcXCI+XFxuICAgIDx0ZW1wbGF0ZSB2LXJlcGVhdD1cXFwib25lT2ZPcHRpb25zXFxcIj5cXG4gICAgICA8c2VsZWN0LWpzIHRpdGxlPVxcXCJvbmVPZi17eyRpbmRleH19XFxcIlxcbiAgICAgICAgICAgICAgICAgdmFsdWU9XFxcInt7c2VsZWN0ZWRPbmVPZnNbJGluZGV4XX19XFxcIlxcbiAgICAgICAgICAgICAgICAgb3B0cz1cXFwie3skdmFsdWV9fVxcXCJcXG4gICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVxcXCItLW9uZU9mLS1cXFwiPjwvc2VsZWN0LWpzPlxcbiAgICA8L3RlbXBsYXRlPlxcbiAgPC9kaXY+XFxuXFxuICA8ZGl2IHYtaWY9XFxcImFueU9mT3B0aW9uc1xcXCI+XFxuICAgIDx0ZW1wbGF0ZSB2LXJlcGVhdD1cXFwiYW55T2ZPcHRpb25zXFxcIj5cXG4gICAgICA8c2VsZWN0LWpzIHRpdGxlPVxcXCJhbnlPZi17eyRpbmRleH19XFxcIlxcbiAgICAgICAgICAgICAgICAgdmFsdWU9XFxcInt7c2VsZWN0ZWRBbnlPZnNbJGluZGV4XX19XFxcIlxcbiAgICAgICAgICAgICAgICAgb3B0cz1cXFwie3skdmFsdWV9fVxcXCJcXG4gICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVxcXCItLWFueU9mLS1cXFwiIG11bHRpcGxlPjwvc2VsZWN0LWpzPlxcbiAgICA8L3RlbXBsYXRlPlxcbiAgPC9kaXY+XFxuXFxuICA8Y29tcG9uZW50IHYtaWY9XFxcImN1cnJlbnRDb21wb25lbnRcXFwiXFxuICAgICAgICAgICAgIGlzPVxcXCJ7eyBjdXJyZW50Q29tcG9uZW50IH19XFxcIlxcbiAgICAgICAgICAgICBzY2hlbWE9XFxcInt7Y3VycmVudFNjaGVtYX19XFxcIiBmb3JtPVxcXCJ7e2N1cnJlbnRGb3JtfX1cXFwiXFxuICAgICAgICAgICAgIHZhbHVlPVxcXCJ7e3ZhbHVlfX1cXFwiXFxuICAgICAgICAgICAgIGtleT1cXFwie3trZXl9fVxcXCIgcmVxdWlyZWQ9XFxcInt7cmVxdWlyZWR9fVxcXCJcXG4gICAgICAgICAgICAgdi1yZWY9XFxcImNcXFwiPjwvY29tcG9uZW50PlxcblxcbjwvdGVtcGxhdGU+XFxuXFxuXFxuPHRlbXBsYXRlIGlkPVxcXCJmb3JtXFxcIj5cXG4gIDxkaXYgY2xhc3M9XFxcInZhbGlkYXRpb25cXFwiIHYtY2xhc3M9XFxcImhhc0Vycm9yczogZXJyb3JzXFxcIj5cXG4gICAgPGRpdiB2LWlmPVxcXCIhZXJyb3JzXFxcIj7inJM8L2Rpdj5cXG4gICAgPGRpdiB2LXJlcGVhdD1cXFwiZXJyb3JzXFxcIj5cXG4gICAgICB7e3BhdGh9fToge3ttZXNzYWdlfX1cXG4gICAgPC9kaXY+XFxuICAgIDxjb21wb25lbnQgaXM9XFxcInt7IHJlc29sdmVDb21wb25lbnQocmVzb2x2ZWRTY2hlbWEsIGZvcm0pIH19XFxcIlxcbiAgICAgICAgICAgICAgIHNjaGVtYT1cXFwie3tyZXNvbHZlZFNjaGVtYX19XFxcIiBmb3JtPVxcXCJ7e2Zvcm19fVxcXCIgdmFsdWU9XFxcInt7dmFsdWV9fVxcXCJcXG4gICAgICAgICAgICAgICB2LXJlZj1cXFwiY1xcXCI+PC9jb21wb25lbnQ+XFxuICA8L2Rpdj5cXG48L3RlbXBsYXRlPlxcblxcblxcblxcbjx0ZW1wbGF0ZSBpZD1cXFwiYnV0dG9uXFxcIj5cXG4gIDxpbnB1dCB2LWF0dHI9XFxcInR5cGU6IHR5cGUsIHZhbHVlOiB0aXRsZSwgdGl0bGU6IGRlc2NyaXB0aW9uXFxcIiB2LW9uPVxcXCJjbGljazogY2xpY2tcXFwiLz5cXG48L3RlbXBsYXRlPlxcblwiXG5cbi8vIGRvY3VtZW50LndyaXRlKHRlbXBsYXRlcylcbnZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RlbXBsYXRlJylcbmVsLmlubmVySFRNTCA9IHRlbXBsYXRlc1xuQXJyYXkucHJvdG90eXBlLmZvckVhY2guY2FsbChcbiAgZWwuY29udGVudC5xdWVyeVNlbGVjdG9yQWxsKCd0ZW1wbGF0ZSxzY3JpcHRbdHlwZT1cIngtdnVlXCJdJyksXG4gIGZ1bmN0aW9uKHQpe1xuICAgIGlmICh0LmlkKSBleHBvcnRzW3QuaWRdID0gdFxuICB9KVxuXG5cbi8vIHZhciBjc3MgPSBmcy5yZWFkRmlsZVN5bmMoX19kaXJuYW1lICsgJy9zdHlsZXMuY3NzJywgJ3V0ZjgnKVxuLy8gdmFyIGluc2VydENzcyA9IHJlcXVpcmUoJ2luc2VydC1jc3MnKVxuLy8gaW5zZXJ0Q3NzKGNzcylcbiIsInZhciBfID0gcmVxdWlyZSgnLi9sYW5nJylcblxuXy5tZXJnZShcbiAgZXhwb3J0cyxcbiAgXyxcbiAgcmVxdWlyZSgnLi9zY2hlbWEnKSxcbiAgcmVxdWlyZSgnLi92dWUnKVxuKVxuIiwiXG5leHBvcnRzLm1lcmdlID0gZnVuY3Rpb24gbWVyZ2UoYWNjKXtcbiAgZm9yICh2YXIgaSA9IDE7IGk8YXJndW1lbnRzLmxlbmd0aDsgaSsrKXtcbiAgICB2YXIgZnJvbSA9IGFyZ3VtZW50c1tpXVxuICAgIGZvciAodmFyIGsgaW4gZnJvbSkgYWNjW2tdID0gZnJvbVtrXVxuICB9XG4gIHJldHVybiBhY2Ncbn1cblxuXG5pZiAoIU51bWJlci5pc05hTil7XG4gIE51bWJlci5pc05hTiA9IGZ1bmN0aW9uIGlzTmFOKHZhbHVlKSB7XG4gICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gXCJudW1iZXJcIiAmJiB2YWx1ZSAhPT0gdmFsdWVcbiAgfVxufVxuXG5leHBvcnRzLmlzTm90ID0gZnVuY3Rpb24gaXNOb3QoeCwgeSl7XG4gIHJldHVybiB4ICE9PSB5ICYmICEoTnVtYmVyLmlzTmFOKHgpICYmIE51bWJlci5pc05hTih5KSlcbn1cblxuXG52YXIgdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nXG5cbmV4cG9ydHMuaXNQbGFpbk9iamVjdCA9IGZ1bmN0aW9uIChvYmopIHtcbiAgcmV0dXJuIHRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgT2JqZWN0XSdcbn1cblxuXG5leHBvcnRzLmNvcHkgPSBmdW5jdGlvbiBjb3B5KHgpe1xuICByZXR1cm4geCA/IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoeCkpIDogeFxufVxuXG5cbnZhciBTID0gXCJbb2JqZWN0IFN0cmluZ11cIlxuXG5leHBvcnRzLmlzU3RyaW5nID0gZnVuY3Rpb24gaXNTdHJpbmcoeCl7XG4gIHJldHVybiB0eXBlb2YgeCA9PT0gJ3N0cmluZycgfHwgdG9TdHJpbmcuY2FsbCh4KSA9PT0gU1xufVxuXG5cbmlmICghU3RyaW5nLnByb3RvdHlwZS5zdGFydHNXaXRoKXtcbiAgU3RyaW5nLnByb3RvdHlwZS5zdGFydHNXaXRoID0gZnVuY3Rpb24oc2VhcmNoU3RyaW5nLCBwb3NpdGlvbil7XG4gICAgcG9zaXRpb24gPSBwb3NpdGlvbiB8fCAwXG4gICAgcmV0dXJuIHRoaXMuaW5kZXhPZihzZWFyY2hTdHJpbmcsIHBvc2l0aW9uKSA9PT0gcG9zaXRpb25cbiAgfVxufVxuaWYgKCFTdHJpbmcucHJvdG90eXBlLmVuZHNXaXRoKXtcbiAgU3RyaW5nLnByb3RvdHlwZS5lbmRzV2l0aCA9IGZ1bmN0aW9uKHNlYXJjaFN0cmluZywgcG9zaXRpb24pe1xuICAgIHZhciBzdWJqZWN0U3RyaW5nID0gdGhpcy50b1N0cmluZygpXG4gICAgaWYgKHBvc2l0aW9uID09PSB1bmRlZmluZWQgfHwgcG9zaXRpb24gPiBzdWJqZWN0U3RyaW5nLmxlbmd0aCl7XG4gICAgICBwb3NpdGlvbiA9IHN1YmplY3RTdHJpbmcubGVuZ3RoXG4gICAgfVxuICAgIHBvc2l0aW9uIC09IHNlYXJjaFN0cmluZy5sZW5ndGhcbiAgICB2YXIgbGFzdEluZGV4ID0gc3ViamVjdFN0cmluZy5pbmRleE9mKHNlYXJjaFN0cmluZywgcG9zaXRpb24pXG4gICAgcmV0dXJuIGxhc3RJbmRleCAhPT0gLTEgJiYgbGFzdEluZGV4ID09PSBwb3NpdGlvblxuICB9XG59XG5cblxudmFyIGhvcCA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHlcblxuZXhwb3J0cy51bmlvbktleXMgPSBmdW5jdGlvbiB1bmlvbktleXMoKXtcbiAgdmFyIGFyZywgaSwgaywgbCA9IGFyZ3VtZW50cy5sZW5ndGgsIGtleXMgPSBbXSwgaGFzaCA9IHt9XG4gIGZvciAoaT0wOyBpPGw7IGkrKyl7XG4gICAgYXJnID0gYXJndW1lbnRzW2ldXG4gICAgaWYgKCFBcnJheS5pc0FycmF5KGFyZykpIGFyZyA9IE9iamVjdC5rZXlzKGFyZylcbiAgICBhcmcuZm9yRWFjaChhZGRLZXkpXG4gIH1cbiAgZnVuY3Rpb24gYWRkS2V5KGspe1xuICAgIGlmICghaG9wLmNhbGwoaGFzaCwgaykpe1xuICAgICAga2V5cy5wdXNoKGspXG4gICAgICBoYXNoW2tdID0gdHJ1ZVxuICAgIH1cbiAgfVxuICByZXR1cm4ga2V5c1xufVxuIiwiLy8gSlNPTiBTQ0hFTUEgYWxnZWJyYVxuXG4vKipcbiAqIFdhbGsgYWxvbmcgYWxsT2ZcbiAqL1xuZnVuY3Rpb24gd2Fsa0FsbE9mcyhzY2hlbWEsIGVtaXQpe1xuICBlbWl0KHNjaGVtYSlcbiAgaWYgKHNjaGVtYS5hbGxPZikgc2NoZW1hLmFsbE9mLmZvckVhY2goZnVuY3Rpb24ocyl7XG4gICAgd2Fsa0FsbE9mcyhzLCBlbWl0KVxuICB9KVxufVxuXG4vKipcbiAqIFdhbGsgYWxvbmcgYWxsT2YgYW5kIGNvbWJpbmUgcHJvcGVydGllcyB1c2VkIGluIGZvcm1zXG4gKi9cbmV4cG9ydHMuY29tYmluZUFsbCA9IGZ1bmN0aW9uIGNvbWJpbmVBbGwoLyouLi5zY2hlbWFzKi8pe1xuICB2YXIgcmVzID0ge31cbiAgQXJyYXkucHJvdG90eXBlLmNvbmNhdC5hcHBseShbXSwgYXJndW1lbnRzKVxuICAgIC5mb3JFYWNoKGZ1bmN0aW9uKHNjaGVtYSl7XG4gICAgICBpZiAoJyRyZWYnIGluIHNjaGVtYSkgY29uc29sZS53YXJuKCdTY2hlbWEgY29udGFpbnMgdW5yZXNvbHZlZCAkcmVmJywgc2NoZW1hKVxuICAgICAgd2Fsa0FsbE9mcyhzY2hlbWEsIGZ1bmN0aW9uKHMpe1xuICAgICAgICBjb21iaW5lKHJlcywgcylcbiAgICAgIH0pXG4gICAgfSlcbiAgcmV0dXJuIHJlc1xufVxuXG5cbmZ1bmN0aW9uIGNvbWJpbmUoZGVzdC8qLCAuLi5zb3VyY2VzKi8pe1xuICBpZiAoIWRlc3QpIGRlc3QgPSB7fVxuICBpZiAoIWRlc3QuYW55T2ZzKSBkZXN0LmFueU9mcyA9IFtdXG4gIGlmICghZGVzdC5vbmVPZnMpIGRlc3Qub25lT2ZzID0gW11cblxuICBBcnJheS5wcm90b3R5cGUuY29uY2F0LmFwcGx5KFtdLCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKVxuICAgIC5mb3JFYWNoKGZ1bmN0aW9uKHNyYyl7XG4gICAgICBmb3IgKHZhciBwIGluIHNyYyl7XG4gICAgICAgIGlmICh0eXBlb2Ygc3JjW3BdID09PSAndW5kZWZpbmVkJykgY29udGludWVcbiAgICAgICAgaWYgKHAgPT09ICdvbmVPZicpIGRlc3Qub25lT2ZzLnB1c2goc3JjLm9uZU9mKVxuICAgICAgICBlbHNlIGlmIChwID09PSAnYW55T2YnKSBkZXN0LmFueU9mcy5wdXNoKHNyYy5hbnlPZilcbiAgICAgICAgZWxzZSBpZiAoZGVzdFtwXSA9PT0gdW5kZWZpbmVkKXtcbiAgICAgICAgICBkZXN0W3BdID0gc3JjW3BdIC8vIGRlZXBjb3B5P1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBtID0gY29tYmluZXJzW3BdXG4gICAgICAgICAgaWYgKG0pIGRlc3RbcF0gPSBtKGRlc3RbcF0sIHNyY1twXSlcbiAgICAgICAgICAvLyBlbHNlIGNvbnNvbGUuZGVidWcoJ05vIGNvbWJpbmVyIGZvciBwcm9wZXJ0eSAnLCBwKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSlcbiAgcmV0dXJuIGRlc3Rcbn1cblxudmFyIGNvbWJpbmVycyA9IHtcbiAgbXVsdGlwbGVPZjogbGNtLFxuXG4gIG1heGltdW06IE1hdGgubWluLFxuICBleGNsdXNpdmVNYXhpbXVtOiBNYXRoLm1pbixcbiAgbWluaW11bTogTWF0aC5tYXgsXG4gIGV4Y2x1c2l2ZU1pbmltdW06IE1hdGgubWF4LFxuXG4gIG1heExlbmd0aDogTWF0aC5taW4sXG4gIG1pbkxlbmd0aDogTWF0aC5tYXgsXG4gIHBhdHRlcm46IGFuZFJlZ0V4cHMsXG5cbiAgbWF4SXRlbXM6IE1hdGgubWluLFxuICBtaW5JdGVtczogTWF0aC5tYXgsXG4gIC8vIFRPRE86IGFkZGl0aW9uYWxJdGVtcyBhbmQgaXRlbXNcblxuICBtYXhQcm9wZXJ0aWVzOiBNYXRoLm1pbiwgbWluUHJvcGVydGllczogTWF0aC5tYXgsXG4gIHJlcXVpcmVkOiB1bmlvbixcbiAgLy8gVE9ETzogYWRkaXRpb25hbFByb3BlcnRpZXMsIHByb3BlcnRpZXMgYW5kIHBhdHRlcm5Qcm9wZXJ0aWVzXG4gIC8vIGRlcGVuZGVuY2llc1xuXG4gIGVudW06IGludGVyc2VjdGlvbixcbiAgdHlwZTogaW50ZXJzZWN0aW9uLFxuICAvLyBhbnlPZiwgb25lT2Y6IGhhcmQtY29kZWQgaW4gY29tYmluZSxcbiAgb25lT2ZzOiBjb25jYXQsXG4gIGFueU9mczogY29uY2F0XG4gIC8vIG5vdFxufVxuXG5mdW5jdGlvbiBjb25jYXQoYSwgYil7XG4gIHJldHVybiBhLmNvbmNhdChiKVxufVxuXG5mdW5jdGlvbiBpbnRlcnNlY3Rpb24oYSwgYil7XG4gIGlmICghQXJyYXkuaXNBcnJheShhKSkgYSA9IFthXVxuICBpZiAoIUFycmF5LmlzQXJyYXkoYikpIGIgPSBbYl1cbiAgcmV0dXJuIGEuZmlsdGVyKGZ1bmN0aW9uKHkpe1xuICAgIHJldHVybiBiLmluZGV4T2YoeSkgIT09IC0xXG4gIH0pXG59XG5cbmZ1bmN0aW9uIHVuaW9uKGEsYil7XG4gIHZhciB1ID0ge30sIHBcbiAgZm9yIChwIGluIGEpIHVbcF0gPSB0cnVlXG4gIGZvciAocCBpbiBiKSB1W3BdID0gdHJ1ZVxuICByZXR1cm4gT2JqZWN0LmtleXModSlcbn1cblxuZnVuY3Rpb24gbGNtKGEsIGIpe1xuICByZXR1cm4gTWF0aC5hYnMoYSpiIC8gZ2NkKGEsIGIpKVxufVxuXG5mdW5jdGlvbiBnY2QoYSwgYil7XG4gIHJldHVybiBiID8gZ2NkKGIsIGEgJSBiKSA6IGFcbn1cblxuZnVuY3Rpb24gYW5kUmVnRXhwcyhhLGIpe1xuICByZXR1cm4gJyg/PScrYSsnKSg/PScrYisnKSdcbn1cblxuXG5cbi8vIHZhciBqcCA9IHJlcXVpcmUoJ2pzb25wYXRjaCcpXG4vLyBleHBvcnRzLnJlc29sdmVKU09OUG9pbnRlciA9IGZ1bmN0aW9uIHJlc29sdmVKU09OUG9pbnRlcihkb2MsIHBvaW50ZXIpe1xuLy8gICBjb25zb2xlLmRlYnVnKCdyZXNvbHZpbmcnLCBwb2ludGVyLCAnaW4nLCBkb2MpXG4vLyAgIGlmIChwb2ludGVyWzBdICE9PSAnIycpIHRocm93ICdGdWxsIFVSSSByZXNvbHV0aW9uIGlzIG5vdCBpbXBsZW1lbnRlZDogJyArIHBvaW50ZXJcbi8vICAgcmV0dXJuIChuZXcganAuSlNPTlBvaW50ZXIocG9pbnRlci5zbGljZSgxKSkpLmdldChkb2MpXG4vLyB9XG4iLCJ2YXIgVnVlID0gcmVxdWlyZSgndnVlJylcblxuZXhwb3J0cy5uZXh0VGljayA9IFZ1ZS5uZXh0VGlja1xuXG4vLyB2YXIgeWFtbCA9IHJlcXVpcmUoJ2pzLXlhbWwnKVxuLy8gVnVlLmZpbHRlcigneWFtbCcsIGZ1bmN0aW9uKHgpe1xuLy8gICByZXR1cm4geWFtbC5zYWZlRHVtcCh4LCB7IGZsb3dMZXZlbDogMSwgc2tpcEludmFsaWQ6IHRydWUgfSlcbi8vIH0pXG5cbnZhciBDaXJjdWxhckpTT04gPSByZXF1aXJlKCdjaXJjdWxhci1qc29uJylcblZ1ZS5maWx0ZXIoJ2pzb24nLCBmdW5jdGlvbih4KXtcbiAgcmV0dXJuIENpcmN1bGFySlNPTi5zdHJpbmdpZnkoeCwgbnVsbCwgMilcbn0pXG5cbmV4cG9ydHMuZnJvbUZvcm0gPSBmdW5jdGlvbiBmcm9tRm9ybShrZXksIG9yU2NoZW1hKXtcbiAgcmV0dXJuIGZ1bmN0aW9uKCl7XG4gICAgdmFyIHRcbiAgICByZXR1cm4gKHQgPSB0aGlzLmZvcm0pICYmIHRba2V5XSB8fCBvclNjaGVtYSAmJiAodCA9IHRoaXMuc2NoZW1hKSAmJiB0W2tleV1cbiAgfVxufVxuIl19
