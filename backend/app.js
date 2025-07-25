var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var medicationsRouter = require('./routes/medications');
var remindersRouter = require('./routes/reminders');
var moodEntriesRouter = require('./routes/mood_entries');
var gameScoresRouter = require('./routes/game_scores');
var emergencyRouter = require('./routes/emergency');

var app = express();

app.use(cors({
  origin: true, // Allow all origins for development
  credentials: true
}));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/medications', medicationsRouter);
app.use('/reminders', remindersRouter);
app.use('/mood_entries', moodEntriesRouter);
app.use('/game_scores', gameScoresRouter);
app.use('/emergency', emergencyRouter);

module.exports = app;
