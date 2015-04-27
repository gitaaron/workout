var express = require('express');
var uuid = require('node-uuid');
var bodyParser = require('body-parser')
var _ = require('lodash');
var fs = require('fs');

var morgan = require('morgan');

// create a write stream (in append mode)
var accessLogStream = fs.createWriteStream(__dirname + '/access.log', {flags: 'a'})


var app = express();

// setup the logger
app.use(morgan('combined', {stream: accessLogStream}))

// create application/json parser 
var jsonParser = bodyParser.json()

// respond with "hello world" when a GET request is made to the homepage
app.get('/', function(req, res) {
    res.send('hello world');
});


var users = [{
    id:1,
    username:'one',
    phone_number:111
}];

app.post('/users', jsonParser, function(req, res) {
    var id = uuid.v1();
    var user = {
        id:id,
        phone_number:req.body.phone_number,
        username:req.body.username
    };

    users.push(user);
    res.end(JSON.stringify(user));
});

app.get('/users/:phone_number', function(req, res) {
    var user = _.find(users, function(user) {
        return user.phone_number===parseInt(req.params.phone_number);
    });
    if(user) {
        res.end(JSON.stringify(user));
    } else {
        res.status(404).end();
    }

});

var rep_count = 0;

app.get('/workout', function(req, res) {
    res.end(JSON.stringify({count:rep_count}));
});

app.get('/workout/reps/clear', function(req, res) {
    rep_count = 0;
    res.end(JSON.stringify({count:rep_count}));
});

app.get('/workout/reps/increment', function(req, res) {
    res.end(JSON.stringify({count:++rep_count}));
});


function Workout() {
    this.status = function() {
        return 'in_progress';
    }
    this.remainingActivities = [ 'situps', 'squats'];
    this.currentActivity = 'pushups';
    this.remainingReps = 10;
    this.logRep = function() {
        if(this.remainingReps = 1) {
            this.currentActivity = this.remainingActivities.pop();
        } else {
            this.remainingReps-=1;
        }

    }
}

app.listen(80);

console.log('listening on 80');
