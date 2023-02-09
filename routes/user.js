var express = require('express');
var router = express.Router();
const multer = require('multer');
const bcrypt = require('bcrypt');
var nodemailer = require('nodemailer');
var User = require('../models/user.js')
var Transaction = require('../models/transaction.js')
const fs = require('fs');
const otpGenerator = require('otp-generator');
let otp = ''

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/images/cmnd')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now() + file.originalname)
  }
})

var upload = multer({ storage: storage })

var sessionChecker = (req, res, next) => {
  if (!req.session.email) {
    res.redirect("/user/login")
  }
  else {
    next()
  }
}

var loginChecker = (req, res, next) => {
  if (req.session.email) {
    res.redirect("/")
  }
  else {
    next()
  }
}

function randomUsername() {
  var username = '';
  var characters = '0123456789'
  for (var i = 0; i < 10; i++) {
    username += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return username
}

function randomPassword() {
  var password = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz'
  for (var i = 0; i < 6; i++) {
    password += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return password
}


//Đăng ký
router.get('/register', function (req, res, next) {
  res.render('register', { title: 'Đăng ký' })
});

router.post('/register', upload.fields([{ name: 'front' }, { name: 'back' }]), function (req, res, next) {
  var user = req.body
  User.findOne({ email: user.email }, (err, u) => {
    if (u) {
      return res.render('register', { err: 'Email này đã tồn tại' })
    }
    else {
      User.findOne({ phone: user.phone }, (err, u) => {
        if (u) {
          return res.render('register', { err: 'Số điện thoại này đã tồn tại' })
        }
        else {
          let username = randomUsername()
          let password = randomPassword()
          bcrypt.hash(password, 10, (err, hash) => {
            let newUser = new User({
              fullname: user.fullname,
              email: user.email,
              phone: user.phone,
              birthdate: user.birthdate,
              address: user.address,
              cmnd: {
                front: req.files.front[0].filename,
                back: req.files.back[0].filename,
              },
              username: username,
              password: hash,
              status: 'Chờ xác minh',
              fund: 0
            })
            newUser.save((err) => {
              if (err) {
                console.log(err)
              }
              else {
                var transporter = nodemailer.createTransport({
                  host: 'mail.phongdaotao.com',
                  secure: false,
                  ignoreTLS: true,
                  auth: {
                    user: 'sinhvien@phongdaotao.com',
                    pass: 'svtdtu'
                  }
                });
                
                // var transporter = nodemailer.createTransport({
                //   service: 'gmail',
                //   auth: {
                //     user: 'moneywalletwebsite@gmail.com',
                //     pass: 'admin123!'
                //   }
                // });

                var mailOptions = {
                  from: 'sinhvien@phongdaotao.com',
                  to: user.email,
                  subject: 'Thông tin tài khoản của bạn',
                  text: 'Tài khoản: ' + username + '\n' +
                    'Mật khẩu: ' + password
                };

                transporter.sendMail(mailOptions, function (error, info) {
                  if (error) {
                    console.log(error);
                  } else {
                    console.log('Email sent: ' + info.response);
                  }
                });
                return res.render('register', { success: 'Đăng ký tài khoàn thành công, mời kiểm tra email để nhận thông tin tài khoản của bạn' })
              }
            })
          })
        }
      })
    }
  })
})

//Đăng nhập
router.get('/login', loginChecker, function (req, res, next) {
  res.render('login', { title: 'Đăng nhập' })
});

router.post('/login', function (req, res, next) {
  User.findOne({ username: req.body.username }, (err, user) => {
    if (err || !user) {
      return res.render('login', { err: 'Tên đăng nhập không tồn tại!' })
    }
    if (user.status === 'Khóa vô thời hạn') {
      return res.render('login', { err: 'Tài khoản đã bị khóa do nhập sai mật khẩu nhiều lần, vui lòng liên hệ quản trị viên để được hỗ trợ' })
    }
    if (user.status === 'Đã vô hiệu hóa') {
      return res.render('login', { err: 'Tài khoản này đã bị vô hiệu hóa, vui lòng liên hệ tổng đài 18001008' })
    }
    bcrypt.compare(req.body.password, user.password, function (err, result) {
      if (result === true && user.admin === true) {
        req.session.username = user.username
        req.session.email = user.email
        req.session.admin = true
        return res.redirect('/admin/account/activated')
      }
      else if (result === false && user.admin === true) {
        return res.render('login', { err: 'Mật khẩu đăng nhập không chính xác!' })
      }
      else if (result === true && user.password_changed === true) {
        User.findOneAndUpdate({ username: req.body.username }, { $set: { login_failed: 0 } }, (err, user) => {
          if (err) {
            console.log(err)
          }
        })
        req.session.username = user.username
        req.session.email = user.email
        req.session.firstTime = false
        return res.redirect("/")
      }
      else if (result === true && user.password_changed === false) {
        User.findOneAndUpdate({ username: req.body.username }, { $set: { login_failed: 0 } }, (err, user) => {
          if (err) {
            console.log(err)
          }
        })
        req.session.username = user.username
        req.session.email = user.email
        req.session.firstTime = true
        req.session.msg = 'Quý khách cần đổi mật khẩu để có thể sử dụng các chức năng'
        return res.redirect('/user/changepassword')
      }
      else if (result === false && user.login_failed === 3) {
        User.findOneAndUpdate({ username: req.body.username }, { $inc: { login_failed: 1 } }, (err, user) => {
          if (err) {
            console.log(err)
          }
          return res.render('login', { err: 'Tài khoản hiện đang bị tạm khóa, vui lòng thử lại sau 1 phút', failed: true })
        })
      }
      else if (user.login_failed === 6) {
        User.findOneAndUpdate({ username: req.body.username }, { status: 'Khóa vô thời hạn', disableDate: Date.now() }, (err, user) => {
          if (err) {
            console.log(err)
          }
          return res.render('login', { err: 'Tài khoản đã bị khóa do nhập sai mật khẩu nhiều lần, vui lòng liên hệ quản trị viên để được hỗ trợ' })
        })
      }
      else {
        User.findOneAndUpdate({ username: req.body.username }, { $inc: { login_failed: 1 } }, (err, user) => {
          if (err) {
            console.log(err)
          }
        })
        return res.render('login', { err: 'Mật khẩu đăng nhập không chính xác!' })
      }
    })
  })
});

//Đổi mật khẩu
router.get('/changepassword', function (req, res, next) {
  if (req.session.firstTime == true) {
    let msg = req.session.msg
    req.session.msg = ''
    return res.render('changepassword', { title: 'Đổi mật khẩu', firstTime: true, loggedIn: true, email: req.session.email, msg: msg })
  }
  if (req.session.forgot == true) {
    return res.render('changepassword', { title: 'Đổi mật khẩu', firstTime: true })
  }
  else if (!req.session.email) {
    return res.redirect('/user/login')
  }
  return res.render('changepassword', { title: 'Đổi mật khẩu', firstTime: req.session.firstTime, loggedIn: true, email: req.session.email })
})

router.post('/changepassword', function (req, res, next) {
  if (req.body.password == req.body.repassword) {
    bcrypt.hash(req.body.password, 10, (err, hash) => {
      if (req.session.firstTime == false || req.session.forgot == false) {
        User.findOne({ username: req.session.username }, (err, u) => {
          bcrypt.compare(req.body.currentpassword, u.password, function (err, result) {
            if (result == true) {
              User.findOneAndUpdate({ username: req.session.username }, { password: hash }, (err, user) => {
                if (err) {
                  console.log(err)
                }
                else {
                  return res.render('changepassword', { success: 'Đổi mật khẩu thành công', loggedIn: true, email: req.session.email })
                }
              })
            }
            else {
              return res.render('changepassword', { err: 'Mật khẩu hiện tại không chính xác', loggedIn: true, email: req.session.email })
            }
          })
        })
      }
      if (req.session.forgot == true) {
        User.findOneAndUpdate({ username: req.session.username }, { password: hash, password_changed: true }, (err, user) => {
          if (err) {
            console.log(err)
          }
          else {
            req.session.firstTime = false
            req.session.forgot == false
            return res.redirect('/')
          }
        })
      }
      if (req.session.firstTime == true) {
        User.findOneAndUpdate({ username: req.session.username }, { password: hash, password_changed: true }, (err, user) => {
          if (err) {
            console.log(err)
          }
          else {
            req.session.firstTime = false
            return res.redirect('/')
          }
        })
      }
    })
  }
  else {
    return res.render('changepassword', { err: 'Hai mật khẩu không khớp' })
  }
})

//Quên mật khẩu
router.get('/forgotpassword', function (req, res, next) {
  res.render('forgotpassword', { title: 'Khôi phục mật khẩu' })
})

router.post('/forgotpassword', function (req, res, next) {
  User.findOne({ email: req.body.email, phone: req.body.phone }, (err, u) => {
    if (!u || err) {
      return res.render('forgotpassword', { err: 'Thông tin email hoặc số điện thoại không chính xác' })
    }
    else {
      otp = otpGenerator.generate(6, { digits: true, upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });
      var transporter = nodemailer.createTransport({
        host: 'mail.phongdaotao.com',
        secure: false,
        ignoreTLS: true,
        auth: {
          user: 'sinhvien@phongdaotao.com',
          pass: 'svtdtu'
        }
      });

      // var transporter = nodemailer.createTransport({
      //   service: 'gmail',
      //   auth: {
      //     user: 'moneywalletwebsite@gmail.com',
      //     pass: 'admin123!'
      //   }
      // });

      var mailOptions = {
        from: 'sinhvien@phongdaotao.com',
        to: u.email,
        subject: 'Khôi phục mật khẩu',
        text: 'Mã OTP xác thực hành vi khôi phục mật khẩu của bạn: ' + otp
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
      req.session.username = u.username
      return res.render('forgotpassword', { success: 'Vui lòng kiểm tra email để nhận mã OTP', verifyOTP: true })
    }
  })
})

//Xác nhận đổi mật khẩu bằng mã otp
router.post('/forgotpassword/confirmOTP', function (req, res, next) {
  if (otp === req.body.OTP) {
    req.session.forgot = true
    return res.redirect('/user/changepassword')
  }
  else {
    return res.render('forgotpassword', { title: 'Đổi mật khẩu', err: 'Mã OTP không chính xác', verifyOTP: true })
  }
})

//Thông tin tài khoản
router.get('/profile', sessionChecker, function (req, res, next) {
  User.findOne({ email: req.session.email }, (err, u) => {
    if (err) {
      console.log(err)
    }
    else if (u.status === 'Chờ cập nhật') {
      let msg = req.session.msg
      req.session.msg = ''
      let err = req.session.err
      req.session.err = ''
      return res.render('profile', { title: 'Thông tin cá nhân', loggedIn: true, email: req.session.email, needUpdate: true, user: u, msg: msg, err: err })
    }
    else {
      let msg = req.session.msg
      req.session.msg = ''
      let err = req.session.err
      req.session.err = ''
      return res.render('profile', { title: 'Thông tin cá nhân', loggedIn: true, email: req.session.email, user: u, msg: msg, err: err })
    }
  })
})

router.post('/profile', sessionChecker, upload.fields([{ name: 'front' }, { name: 'back' }]), function (req, res, next) {
  User.findOne({ username: req.session.username }, (err, u) => {
    if (!u || err) {
      console.log(err)
    }
    else {
      fs.unlink('public/images/cmnd/' + u.cmnd.front, (err) => {
        if (err) {
          console.log(err)
        }
      })
      fs.unlink('public/images/cmnd/' + u.cmnd.back, (err) => {
        if (err) {
          console.log(err)
        }
      })
      User.findOneAndUpdate({ username: req.session.username }, {
        cmnd: {
          front: req.files.front[0].filename,
          back: req.files.back[0].filename,
        }, status: 'Chờ xác minh', updateAt: Date.now()
      }, (err, result) => {
        if (err) {
          console.log(err)
        }
        else {
          req.session.msg = 'Bổ sung CMND thành công'
          res.redirect('/user/profile')
        }
      })
    }
  })
})

//Lịch sử giao dịch
router.get('/history', sessionChecker, function (req, res, next) {
  Transaction.find({ maker: req.session.email }, (err, tran) => {
    if (!tran || err) {
      console.log(err)
    }
    else {
      return res.render('transactionHistory', { title: 'Lịch sử giao dịch', loggedIn: true, email: req.session.email, list: tran })

    }
  }).sort({ createAt: -1 })
})

router.get('/history/detail/:id', sessionChecker, function (req, res, next) {
  Transaction.findOne({ _id: req.params.id }, (err, tran) => {
    if (!tran || err) {
      console.log(err)
    }
    if (tran.type === 'Mua thẻ điện thoại' || tran.type === 'Nạp tiền' || tran.type === 'Rút tiền') {
      return res.render('transactionDetail', { title: 'Thông tin chi tiết giao dịch', loggedIn: true, tran: tran, email: req.session.email })
    }
    else {
      User.findOne({ email: tran.sender }, (err, u1) => {
        if (!u1 || err) {
          console.log(err)
        }
        else {
          User.findOne({ email: tran.receiver }, (err, u2) => {
            if (!u2 || err) {
              console.log(err)
            }
            else {
              if (tran.feePayer === u1.email) {
                feePayer = u1.fullname
              }
              if (tran.feePayer === u2.email) {
                feePayer = u2.fullname
              }
              return res.render('transactionDetail', { title: 'Thông tin chi tiết giao dịch', loggedIn: true, tran: tran, email: req.session.email, sender: u1.fullname, receiver: u2.fullname, feePayer: feePayer })
            }
          })
        }
      })
    }
  })
})

//Đăng xuất
router.get('/logout', sessionChecker, function (req, res, next) {
  req.session.username = null
  req.session.email = null
  req.session.firstTime = null
  req.session.admin = null
  return res.redirect('/')
})

module.exports = router;
