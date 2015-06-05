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
