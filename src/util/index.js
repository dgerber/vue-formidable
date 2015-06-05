var _ = require('./lang')

_.merge(
  exports,
  _,
  require('./schema'),
  require('./vue')
)
