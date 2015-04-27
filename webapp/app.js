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


var users = [
    {
        id:'1',
        username:'one',
        phone_number:'111'
    },
    {
        id:'2',
        username:'henry',
        phone_number:'+12675064620'
    }
];

app.post('/users', jsonParser, function(req, res) {
    var id = uuid.v1();
    var user = {
        id:id,
        phone_number:req.body.phone_number,
        username:req.body.username
    };

    users.push(user);
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(user));
});

app.get('/users/:phone_number', function(req, res) {
    var user = _.find(users, function(user) {
        return user.phone_number===req.params.phone_number;
    });
    if(user) {
        res.end(JSON.stringify(user));
    } else {
        res.status(404).end();
    }

});


var defaultWorkout = new Workout();
var workouts = {
    1:defaultWorkout
};

function respondWithWorkout(res, workout) {
    res.end(JSON.stringify({
        activity:workout.currentActivity,
        total_remaining:workout.totalRemaining(),
        status:workout.status()
    }));
}

app.post('/workouts/:user_id/start', function(req, res) {

    var user = _.find(users, function(user) {
        return user.id===req.params.user_id
    });

    if(user) {
        var workout = new Workout(); 
        workouts[req.params.user_id] = workout;
        respondWithWorkout(res, workout);
    } else { 
        res.status(404).end('User not found.');
    }

});


app.get('/workouts/:user_id', function(req, res) {
    var user = _.find(users, function(user) {
        return user.id===req.params.user_id;
    }); 
    if(user) {
        var workout = workouts[req.params.user_id];
        if(workout) {
            respondWithWorkout(res, workout);
        } else {
            res.status(404).end('Workout not found.');
        }    
    } else {
        res.status(404).end('User not found.');
    }
});

app.post('/workouts/:user_id/rep', function(req, res) {

    var user = _.find(users, function(user) {
        return user.id===req.params.user_id;
    }); 

    if(user) {
        var workout = workouts[req.params.user_id];
        if(workout) {
            workout.logRep();
            respondWithWorkout(res, workout);
        } else {
            res.status(404).end('Workout not found.');
        }    

    } else {
        res.status(404).end('User not found.');
    }

});

function Workout() {
    this.repsPerActivity = 3;
    this.status = function() {
        if(this.currentActivity) {
            return 'in_progress';
        } else {
            return 'complete';
        }

    }
    this.totalRemaining = function() {
        if(this.currentActivity) {
            return this.remainingReps;
        } else {
            return undefined;
        }
    }
    this.remainingActivities = [ 'situps', 'squats'];
    this.currentActivity = 'pushups';
    this.remainingReps = this.repsPerActivity;;
    this.logRep = function() {
        if(this.remainingReps === 1) {
            this.currentActivity = this.remainingActivities.pop();
            this.remainingReps = this.repsPerActivity;
        } else {
            this.remainingReps--;
        }

    }
}

app.listen(80);

console.log('listening on 80');
