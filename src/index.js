var http = require('http')
var fs = require('fs')
var App = require('./app')

var args = require('minimist')(process.argv, {
  alias:{
    p:'port',
    m:'mountpoint'
  },
  default:{
    port:process.env.PORT || 80,
    mountpoint:process.env.MOUNTPOINT || '/userstorage/v1',
    storagehost:process.env.STORAGE_SERVICE_HOST,
    storageport:process.env.STORAGE_SERVICE_PORT || 80,
    storagepath:process.env.STORAGE_SERVICE_PATH || '/api/v1'
  }
})

var routes = App(args)

var httpserver = http.createServer(routes)
httpserver.listen(args.port)