var urlparse = require('url').parse
var jsonist = require('jsonist')
var async = require('async')
var concat = require('concat-stream')
var path = require('path')
var Logger = require('./logger')
var HttpHashRouter = require('http-hash-router')

var tools = require('./tools')

var VERSION = require(path.join(__dirname, '..', 'package.json')).version

module.exports = function(opts){

  opts = opts || {}

  if(!opts.mountpoint) throw new Error('routes needs a mountpoint option')

  var router = HttpHashRouter()

  router.set(opts.mountpoint + '/version', {
    GET:function(req, res){
      res.end(VERSION)
    }
  })

  router.set(opts.mountpoint + '/data', {
    GET:function(req, res){
      tools.loadUser(opts, urlparse(req.url, true).query, function(err, user){
        if(err) return tools.errorHandler(res, err.toString())
        if(!user){
          res.statusCode = 404
          res.end()
          return
        }

        tools.jsonres(res, tools.processOutgoingUser(user), 200)
      })
    }
  })

  router.set(opts.mountpoint + '/authenticate', {
    POST:tools.slurpJSON(function(req, res){

      var userDeets = Object.assign({}, req.jsonBody)

      var plainTextPassword = userDeets.password
      delete(userDeets.password)

      // how we have {email:'xxx'} or {username:'xxx'}
      // we can use the same flow as a processed query string to load the user

      async.waterfall([

        // first we load the raw user from the storage
        function(next){
          tools.loadUser(opts, userDeets, function(err, user){
            if(err) return next(err)
            next(null, user)
          })
        }

      ], function(err, user){
        if(err) return tools.errorHandler(res, {error:err.toString(),authenticated:false})

        if(!user || !tools.checkPassword(plainTextPassword, user.hashed_password, user.salt)){
          return tools.errorHandler(res, {error:'incorrect details',authenticated:false}, 401)
        }
        tools.jsonres(res, {
          authenticated:true,
          id:user._id
        }, 200)
      })

    })
  })

  router.set(opts.mountpoint + '/create', {
    POST:tools.slurpJSON(function(req, res){
      var storageURL = tools.getStorageURL(opts, '')
      var newUser = tools.processIncomingUser(req.jsonBody)

      if(!newUser){
        return tools.errorHandler(res, {error:'password error',created:false})
      }

      jsonist.post(storageURL, newUser, function(err, data, storageres){
        if(err) return tools.errorHandler(res, {error:err.toString(),created:false})
        if(storageres.statusCode != 201){
          return tools.errorHandler(res, {error:data.error,created:false}, storageres.statusCode)
        }
        
        tools.jsonres(res, {
          created:true,
          id:data._id
        }, 201)
      })

    })
  })

  var logger = Logger({
    name:'passport-slim-instant-mongo'
  })

  function handler(req, res) {

    logger(req, res)

    function onError(err) {
      if (err) {
        req.log.error(err)
        res.statusCode = err.statusCode || 500;
        res.end(err.message);
      }
    }

    router(req, res, {}, onError)
  }

  return handler
}