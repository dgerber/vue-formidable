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
