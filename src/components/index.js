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
