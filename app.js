var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mongoose = require('mongoose')
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/user');
var adminRouter = require('./routes/admin');
var hbs = require('hbs');
var moment = require("moment");
require('dotenv').config()

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

hbs.registerHelper('dateFormat', function (date, options) {
  const formatToUse = (arguments[1] && arguments[1].hash && arguments[1].hash.format) || "DD/MM/YYYY"
  return moment(date).format(formatToUse)
});

hbs.registerHelper('currencyFormat', function (x) {
  x = x.toLocaleString('vi-VN')
  return x
});

hbs.registerHelper('check', function (x) {
  let type = x
  if(type === 'Chuyển tiền' || type === 'Nhận tiền'){
    return true
  }
  return false
});

hbs.registerHelper('card', function (x) {
  let type = x
  if(type === 'Mua thẻ điện thoại'){
    return true
  }
  return false
});

hbs.registerHelper('statusColor', function (x) {
  let html = ''
  let status = x
  
  if(status === 'admin'){
    html = `<span class="badge badge-info">${x}</span>`
  }
  if(status === 'Chờ xác minh'){
    html = `<span class="badge badge-secondary">${x}</span>`
  }
  if(status === 'Chờ cập nhật' || status === 'Chờ duyệt'){
    html = `<span class="badge badge-primary">${x}</span>`
  }
  if(status === 'Đã xác minh' || status === 'Thành công'){
    html = `<span class="badge badge-success">${x}</span>`  
  }
  if(status === 'Đã vô hiệu hóa'){
    html = `<span class="badge badge-warning">${x}</span>`
  }
  if(status === 'Khóa vô thời hạn' || status === 'Thất bại'){
    html = `<span class="badge badge-danger">${x}</span>`
  }
  return html
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require('express-session')({ secret: 'abc123', resave: true, saveUninitialized: true }))
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/user', usersRouter);
app.use('/admin', adminRouter);

// connect database
mongoose.connect(process.env.DB_CONNECT, (err) => {
  if (!err) console.log('DB connect successfully')
  else console.log('DB connect failed')
})

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
