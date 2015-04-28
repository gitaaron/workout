var express = require('express');
var uuid = require('node-uuid');
var bodyParser = require('body-parser')
var _ = require('lodash');
var fs = require('fs');

var morgan = require('morgan');
var mongoose = require('mongoose');

// create a write stream (in append mode)
var accessLogStream = fs.createWriteStream(__dirname + '/access.log', {flags: 'a'})

//=========
// Mongo
mongoose.connect('mongodb://localhost/workout');
var db = mongoose.connection;
var userModel;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function (callback) {
  console.log("mongo loaded");
  var userSchema = mongoose.Schema({
    userId: String,
    username: String,
    phoneNumber: String
  });
  userModel = mongoose.model('users', userSchema);
});
//===========

var app = express();

// setup the logger
app.use(morgan('combined', {stream: accessLogStream}))

// create application/json parser 
var jsonParser = bodyParser.json()


app.use(function(req, res, next) {
    res.setHeader('content-type', 'application/json');
    next();
});

// respond with "hello world" when a GET request is made to the homepage
app.get('/', function(req, res) {
    res.send('hello world');
});


var users = [
    {
        userId:'1',
        username:'one',
        phoneNumber:'111'
    },
    {
        userId:'2',
        username:'henry',
        phoneNumber:'+12675064620'
    }
];

app.post('/users', jsonParser, function(req, res) {
    var id = uuid.v1();
    console.log(JSON.stringify(req.body));

    userModel.find({phoneNumber: req.body.phoneNumber}, function (err, user) {
        if (err ) {
            res.status(503).end();
        } else if (user.length == 0) {
            var newuser = new userModel({
                userId:id,
                phoneNumber:req.body.phoneNumber,
                username:req.body.username
            });

            newuser.save(function(err,user_created) {
                if (err) return res.status(503).end();
                res.end(JSON.stringify(user_created));
            });
        }
        else {
            res.end(JSON.stringify(user));
        }
    });
});

app.get('/users/:phone_number', function(req, res) {
    userModel.find({phoneNumber: req.params.phone_number}, function (err, user) {
        if (err) {
            res.status(404).end();
        } 
        else if (user.length == 0) {
            res.status(404).end();
        }
        else {
            res.end(JSON.stringify(user[0]));
        }
    });
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

    userModel.find({userId: req.params.user_id}, function (err, user) {
        if (err) {
            res.status(404).end('User not found');
        } 
        else if (user.length == 0) {
            res.status(404).end('User not found');
        }
        else {
            var workout = new Workout(); 
            workouts[req.params.user_id] = workout;
            respondWithWorkout(res, workout);
        }
    });
});


app.get('/workouts/:user_id', function(req, res) {
    userModel.find({userId: req.params.user_id}, function (err, user) {
        if (err) {
            res.status(404).end('User not found');
        } 
        else if (user.length == 0) {
            res.status(404).end('User not found');
        }
        else {
            var workout = workouts[req.params.user_id];
            if(workout) {
                respondWithWorkout(res, workout);
            } else {
                res.status(404).end('Workout not found.');
            }  
        }
    });
});

app.post('/workouts/:user_id/rep', function(req, res) {
    userModel.find({userId: req.params.user_id}, function (err, user) {
        if (err) {
            res.status(404).end('User not found');
        } 
        else if (user.length == 0) {
            res.status(404).end('User not found');
        }
        else {
            var workout = workouts[req.params.user_id];
            if(workout) {
                workout.logRep();
                respondWithWorkout(res, workout);
            } else {
                res.status(404).end('Workout not found.');
            }    
        }
    });
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
