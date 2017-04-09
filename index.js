var express = require('express')
var app = express()
var low = require('lowdb')
var geocoder = require('geocoder');
var uuid = require('uuid')


var bodyParser = require('body-parser')
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

const db = low('db.json')
var userID = 1
var walkID = 1

db.defaults({ users: [], walks: [] })
  .write()

app.post('/signup',function(req,res){
  var phonenum = req.param('phone')
  var fullname = req.param('name')

  db.get('users')
    .push({ id: uuid(), phone: phonenum, name: fullname})
    .write()
  userID++
  res.send("OK")
})

app.get('/users',function(req,res){
  res.send(db.get('users').value())
})

app.get('/walks/create',function(req,res){
  var startlocation, endlocation
  var time = req.param('time')
  geocoder.geocode(req.param('startLocation'), function ( err, data ) {
    startlocation = data.results[0].geometry.location
    geocoder.geocode(req.param('endLocation'), function ( err, data2 ) {
      endlocation = data2.results[0].geometry.location
      user = db.get('users')
        .find({ phone: req.param('phone') })
        .value()
      var walk = {
        id: uuid(),
        startLocation: req.param('startLocation'),
        endLocation: req.param('endLocation'),
        startLocationCoords: startlocation,
        endLocationCoords: endlocation,
        time: time,
        users: [user]
      }
      var walkid = walk.id
      db.get('walks').push(walk).write()
      console.log(walkid)
      walkID++
      res.send(walkid)
    })
  })
})

app.post('/walks/adduser', function(req,res){
  var user = db.get('users')
               .find({ phone: req.param('phone') })
               .value()
  var id = req.param('id')
  var walk = db.get('walks')
    .find({ id: id })
    .value()
  var walkusers = walk.users
  var old = walkusers.slice()
  var newwalkusers = walkusers.push(user)
  db.get('walks')
    .find({ id: req.param('id') })
    .assign({ users: walkusers })
    .write()
  res.send(old)
})

app.get('/walks/nearby', function(req,res){
  var lat = req.param('lat')
  var lng = req.param('lng')

  var walks = db.get('walks').value()
  var walkdistances = []
  for(var i = 0;i<walks.length; i++){
    var lat2 = walks[i].startLocationCoords.lat
    var lng2 = walks[i].startLocationCoords.lng
    var latdiff = lat-lat2
    var lngdiff = lng-lng2
    var distance = Math.sqrt(Math.pow(latdiff,2)+Math.pow(lngdiff,2)) * 68.703
    var startlocation, endlocation
    walkdistances.push({ dist: distance, walk: { id: walks[i].id, startLocation: walks[i].startLocation, endLocation: walks[i].endLocation, time: walks[i].time}})
  }
  walkdistances.sort(function(a, b) {
    return a.dist > b.dist
  });
  res.send(walkdistances.slice(0,5))
})

app.listen((process.env.PORT || 3000), function(){ console.log('listening')})
