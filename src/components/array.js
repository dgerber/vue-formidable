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
