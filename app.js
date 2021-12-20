const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const bodyparser = require('body-parser');
const fileUpload = require('express-fileupload');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const User = require('./schema/User');
const Message = require('./schema/Message');

const app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(bodyparser());
app.use("/image", express.static(path.join(__dirname, 'image')));
app.use("/avatar", express.static(path.join(__dirname, 'avatar')));
app.use(session({ secret: 'HogeFuga' }));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://root:password123@localhost:27017/chatapp?authSource=admin', function (err) {
  if (err) {
    console.error(err);
  } else {
    console.log('successfully connect to MongoDB.');
  }
});

app.get("/", function (req, res, next) {
  Message.find({}, {}, { sort: { date: -1 } }, function (err, msgs) {
    if (err) throw err;
    return res.render('index', { messages: msgs });
  });
});

app.get("/signin", function (req, res, next) {
  return res.render('signin');
});
app.post("/signin", fileUpload(), function (req, res, next) {
  console.log(req.files);
  const avatar = req.files.avatar;
  avatar.mv('./avatar/' + avatar.name, function (err) {
    if (err) throw err;
    const newUser = new User({
      username: req.body.username,
      password: req.body.password,
      avatar_path: '/avatar/' + avatar.name,
    });
    newUser.save((err) => {
      if (err) throw err;
      return res.redirect("/");
    });
  });
});

app.get("/login", function (req, res, next) {
  return res.render('login');
});

app.post("/login", passport.authenticate('local', {
  successRedirect: "/",
  failureRedirect: "/login"
}));

passport.use(new LocalStrategy(
  function (username, password, done) {
    User.findOne({ username: username }, function (err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (user.password != password) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    });
  }
));

passport.serializeUser(function (user, done) {
  done(null, user._id);
});
passport.deserializeUser(function (id, done) {
  User.findOne({ _id: id }, function (err, user) {
    done(err, user);
  });
});

app.get("/update", function (req, res, next) {
  return res.render('update');
});

app.post("/update", fileUpload(), function (req, res, next) {
  if (req.files && req.files.image) {
    req.files.image.mv('./image/' + req.files.image.name, function (err) {
      if (err) throw err;
      const newMessage = new Message({
        username: req.body.username,
        message: req.body.message,
        image_path: '/image/' + req.files.image.name
      });
      newMessage.save((err) => {
        if (err) throw err;
        return res.redirect("/");
      });
    });
  } else {
    const newMessage = new Message({
      username: req.body.username,
      message: req.body.message
    });
    newMessage.save((err) => {
      if (err) throw err;
      return res.redirect("/");
    });
  }
});

app.listen('3000', function () {
  console.log("listen!");
});