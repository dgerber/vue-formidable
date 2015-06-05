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
