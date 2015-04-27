var express = require('express');

var app = express();

// respond with "hello world" when a GET request is made to the homepage
app.get('/', function(req, res) {
    res.send('hello world');
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

app.listen(9099);

console.log('listening on 9099');
