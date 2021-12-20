const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const bodyparser = require('body-parser');
const fileUpload = require('express-fileupload');
const Message = require('./schema/Message');

const app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(bodyparser());
app.use("/image", express.static(path.join(__dirname, 'image')));


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