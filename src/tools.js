var concat = require('concat-stream')
var jsonist = require('jsonist')
var crypto = require('crypto')

function slurpJSON(handler){
  return function(req, res, next){
    req.pipe(concat(function(body){
      try {
        body = JSON.parse(body.toString())
      }
      catch(e) {
        res.statusCode = 500
        res.end(e.toString())
        return
      }
      req.jsonBody = body
      handler(req, res, next)
    }))
  }
}

// utility function for the backend storage url
function getStorageURL(opts, path) {
  return [
    'http://',
    opts.storagehost,
    ':',
    opts.storageport,
    opts.storagepath,
    path
  ].join('')
}

function jsonres(res, data, code){
  res.statusCode = code || 200
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
}

function loadUser(opts, queryParams, done){
  var query = loadUserQuery(queryParams)
  if(!query) return done('no query parameter given') 
  var storageURL = getStorageURL(opts, '?query=' + JSON.stringify(query))

  jsonist.get(storageURL, function(err, data, storageres){
    if(err) return done(err)

    var user = data ? data[0] : null

    if(storageres.statusCode != 200 || !user){
      user = null
    }

    done(null, user)
  })
}

// the vars with which we can look for a single user
var DATA_QUERY_PARAMS = [
  'id',
  'email',
  'username'
]

var DATA_QUERY_MAP = {
  id:'_id'
}

// extract email=bob etc to turn into a backend storage query
function loadUserQuery(queryParams){
  var useQueryParam = DATA_QUERY_PARAMS.filter(function(name){
    return queryParams[name]
  })[0]

  if(!useQueryParam) return null
  var query = {}
  var actualQueryParam = DATA_QUERY_MAP[useQueryParam] || useQueryParam
  query[actualQueryParam] = queryParams[useQueryParam]

  if(Object.keys(query || {}).length<=0) return null
  return query
}

function errorHandler(res, data, code){
  if(typeof(data) == 'string'){
    data = {
      error:data
    }
  }
  jsonres(res, data, code || 500)
}

function makeSalt() {
  return Math.round((new Date().valueOf() * Math.random())) + '';
}

function encryptPassword(password, salt) {
  if (!password) return '';
  try {
    return crypto
      .createHmac('sha1', salt)
      .update(password)
      .digest('hex');
  } catch (err) {
    return '';
  }
}

// replace the plain 'password' with a salt and hashed password
function processIncomingUser(user){
  var password = user.password
  var ret = Object.assign({}, user)
  delete(ret.password)
  ret.salt = makeSalt()
  ret.hashed_password = encryptPassword(password, ret.salt)
  if(!ret.hashed_password) return null
  return ret
}

function processOutgoingUser(user){
  var ret = Object.assign({}, user, {
    id:user._id
  })
  delete(ret._id)
  delete(ret.__v)
  delete(ret.salt)
  delete(ret.hashed_password)
  return ret
}

function checkPassword(plainTextPassword, encryptedPassword, salt){
  var hashedPlainText = encryptPassword(plainTextPassword, salt)
  return hashedPlainText == encryptedPassword
}

module.exports = {
  slurpJSON:slurpJSON,
  getStorageURL:getStorageURL,
  jsonres:jsonres,
  errorHandler:errorHandler,
  makeSalt:makeSalt,
  encryptPassword:encryptPassword,
  loadUserQuery:loadUserQuery,
  processIncomingUser:processIncomingUser,
  processOutgoingUser:processOutgoingUser,
  loadUser:loadUser,
  checkPassword:checkPassword
}