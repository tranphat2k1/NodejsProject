var express = require('express');
var router = express.Router();
var moment = require('moment');
var User = require('../models/user.js')
var CreditCard = require('../models/creditcard.js')
var Transaction = require('../models/transaction.js')
var nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');
let otp = ''

var loginChecker = (req, res, next) => {
  if (!req.session.email) {
    res.redirect('/user/login')
  }
  User.findOne({ email: req.session.email }, (err, u) => {
    if (!u || err) {
      console.log(err)
    }
    else {
      if (u.password_changed == false) {
        req.session.msg = 'Quý khách cần đổi mật khẩu để có thể sử dụng các chức năng'
        return res.redirect('/user/changepassword')
      }
      if (u.status === 'Chờ cập nhật') {
        req.session.err = 'Tài khoản của quý khách cần cập nhật lại thông tin CMND trước khi thực hiện các giao dịch'
        return res.redirect('/user/profile')
      }
      if (u.status === 'Chờ xác minh') {
        req.session.err = 'Tài khoản của quý khách chưa được xác minh'
        return res.redirect('/user/profile')
      }
      else {
        req.session.fund = u.fund
        next()
      }
    }
  })
}

function tranIDCreate(type) {
  var id = '';
  var characters = '0123456789'
  if (type === 'Nạp tiền') {
    id = 'ADD'
  }
  if (type === 'Rút tiền') {
    id = 'WIT'
  }
  if (type === 'Chuyển tiền') {
    id = 'SEN'
  }
  if (type === 'Nhận tiền') {
    id = 'REC'
  }
  if (type === 'Mua thẻ điện thoại') {
    id = 'MOB'
  }
  for (var i = 0; i < 5; i++) {
    id += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return id
}

function cardCreate(brand) {
  var card = '';
  var characters = '0123456789'
  if (brand === 'Viettel') {
    card = '11111'
  }
  if (brand === 'Mobiphone') {
    card = '22222'
  }
  if (brand === 'Vinaphone') {
    card = '33333'
  }
  for (var i = 0; i < 5; i++) {
    card += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return card
}

//Trang chủ
router.get('/', function (req, res, next) {
  if (req.session.email) {
    return res.render('index', { title: 'Trang chủ', loggedIn: true, email: req.session.email });
  }
  else {
    return res.render('index', { title: 'Trang chủ', loggedIn: false });
  }
});

//Nạp tiền
router.get('/recharge', loginChecker, function (req, res, next) {
  let msg = req.session.msg
  req.session.msg = ''
  let success = req.session.success
  req.session.success = ''
  return res.render('recharge', { title: 'Nạp tiền', loggedIn: true, email: req.session.email, fund: req.session.fund, msg: msg, success: success })
});

router.post('/recharge', function (req, res, next) {
  let info = req.body
  CreditCard.findOne({ cardNumber: info.cardID }, (err, card) => {
    if (!card || err) {
      req.session.msg = 'Thẻ này không được hỗ trợ'
      return res.redirect('/recharge')
    }
    if (moment(card.expirationDate).format('YYYY-MM-DD') != info.expireDate) {
      console.log(card.expirationDate)
      console.log(info.expireDate)
      req.session.msg = 'Ngày hết hạn không chính xác'
      return res.redirect('/recharge')
    }
    if (card.CVV != info.CVV) {
      req.session.msg = 'Mã CVV không chính xác'
      return res.redirect('/recharge')
    }
    if (info.cardID === '222222' && info.money > 1000000) {
      req.session.msg = 'Thẻ này chỉ được nạp tối đa 1 triệu/lần'
      return res.redirect('/recharge')
    }
    if (info.cardID === '333333') {
      req.session.msg = 'Thẻ hết tiền'
      return res.redirect('/recharge')
    }
    else {
      User.findOneAndUpdate({ email: req.session.email }, { $inc: { fund: info.money } }, (err, result) => {
        if (err) {
          console.log(err)
        }
        else {
          let tran = new Transaction({
            id: tranIDCreate('Nạp tiền'),
            maker: req.session.email,
            type: 'Nạp tiền',
            amount: info.money,
            createAt: Date.now(),
            status: 'Thành công',
          }).save()
          req.session.success = 'Nạp tiền thành công'
          return res.redirect('/recharge')
        }
      })
    }
  })
})

//Rút tiền
router.get('/withdraw', loginChecker, function (req, res, next) {
  let msg = req.session.msg
  req.session.msg = ''
  let success = req.session.success
  req.session.success = ''
  return res.render('withdraw', { title: 'Rút tiền', loggedIn: true, email: req.session.email, fund: req.session.fund, msg: msg, success: success })
})

router.post('/withdraw', function (req, res, next) {
  User.findOne({ email: req.session.email }, (err, user) => {
    if (!user || err) {
      console.log(err)
    }
    else {
      let info = req.body
      CreditCard.findOne({ cardNumber: info.cardID }, (err, card) => {
        if (!card || err) {
          req.session.msg = 'Thông tin thẻ không hợp lệ'
          return res.redirect('/withdraw')
        }
        if (info.cardID != '111111') {
          req.session.msg = 'Thẻ này không hỗ trợ rút tiền'
          return res.redirect('/withdraw')
        }
        if (user.fund < info.money) {
          req.session.msg = 'Số dư không đủ để rút'
          return res.redirect('/withdraw')
        }
        if (moment(card.expirationDate).format('YYYY-MM-DD') != info.expireDate) {
          req.session.msg = 'Ngày hết hạn không chính xác'
          return res.redirect('/withdraw')
        }
        if (card.CVV != info.CVV) {
          req.session.msg = 'Mã CVV không chính xác'
          return res.redirect('/withdraw')
        }
        else {
          let fee = info.money * 0.05
          let money = parseInt(info.money)
          if (money > 5000000) {
            let tran = new Transaction({
              id: tranIDCreate('Rút tiền'),
              maker: req.session.email,
              type: 'Rút tiền',
              amount: money,
              fee: fee,
              createAt: Date.now(),
              status: 'Chờ duyệt',
              note: info.note
            }).save()
            req.session.success = 'Số tiền cần rút nhiều hơn 5 triệu đồng, khách hàng vui lòng đợi admin phê duyệt'
            return res.redirect('/withdraw')
          }
          Transaction.find({ maker: req.session.email, type: 'Rút tiền' }, (err, tran) => {
            if (!tran || err) {
              console.log(err)
            }
            else {
              var count = 0
              for (var i = 0; i < tran.length; i++) {
                if (moment(tran[i].createAt).format('YYYY-MM-DD') === moment(Date.now()).format('YYYY-MM-DD')) {
                  count++
                }
              }
              if (count >= 2) {
                req.session.msg = 'Quý khách chỉ có thể rút tiền tối đa 2 lần 1 ngày'
                return res.redirect('/withdraw')
              }
              else {
                let fund = parseInt(user.fund - (money + fee))
                let tran = new Transaction({
                  id: tranIDCreate('Rút tiền'),
                  maker: req.session.email,
                  type: 'Rút tiền',
                  amount: money,
                  fee: fee,
                  createAt: Date.now(),
                  status: 'Thành công',
                  note: info.note
                }).save()
                User.findOneAndUpdate({ email: req.session.email }, { fund: fund }, (err, result) => {
                  if (err) {
                    console.log(err)
                  }
                  else {
                    req.session.success = 'Rút tiền thành công'
                    return res.redirect('/withdraw')
                  }
                })
              }
            }
          })
        }
      })

    }
  })
})

//Chuyển tiền
router.get('/send', loginChecker, function (req, res, next) {
  let msg = req.session.msg
  req.session.msg = ''
  let success = req.session.success
  req.session.success = ''
  return res.render('sendMoney', { title: 'Chuyển tiền', loggedIn: true, email: req.session.email, fund: req.session.fund, msg: msg, success: success })
})

router.post('/send', function (req, res, next) {
  let info = req.body
  let fee = parseInt(req.body.money * 0.05)
  User.findOne({ email: req.session.email }, (err, u1) => {
    if (!u1 || err) {
      console.log(err)
    }
    if (u1.phone === info.phone) {
      req.session.msg = 'Bạn không thể chuyển tiền cho chính mình'
      return res.redirect('/send')
    }
    else {
      User.findOne({ phone: info.phone }, (err, u2) => {
        if (!u2 || err) {
          req.session.msg = 'Người dùng này không tồn tại'
          return res.redirect('/send')
        }
        if((u2.status).localeCompare('Đã xác minh') == -1){
          req.session.msg = 'Tài khoản người nhận chưa được xác minh'
          return res.redirect('/send')
        }
        if (u1.fund < info.money) {
          req.session.msg = 'Số dư không đủ để thực hiện chuyển tiền'
          return res.redirect('/send')
        }
        if (info.fee === 'Người nhận' && u2.fund < fee) {
          req.session.msg = 'Số dư của người nhận hiện tại không đủ để trả phí giao dịch'
          return res.redirect('/send')
        }
        else {
          req.session.money = info.money
          req.session.receiver = u2.email
          req.session.note = info.note
          otp = otpGenerator.generate(6, { digits: true, upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });
          if (info.fee === 'Người gửi') {
            req.session.payer = 'Người gửi'
          }
          else {
            req.session.payer = 'Người nhận'
          }
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
            to: u1.email,
            subject: 'Xác nhận chuyển tiền',
            text: 'Mã OTP xác thực yêu cầu chuyển tiền của bạn: ' + otp
          };

          transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
              console.log(error);
            } else {
              console.log('Email sent: ' + info.response);
            }
          });
          req.session.success = 'Vui lòng kiểm tra email để nhận mã OTP'
          return res.redirect('/send/confirm')
        }
      })
    }
  })
})

//Xác nhận chuyển tiền
router.get('/send/confirm', loginChecker, function (req, res, next) {
  let msg = req.session.msg
  req.session.msg = ''
  let success = req.session.success
  req.session.success = ''
  return res.render('confirmSendMoney', { title: 'Xác nhận', loggedIn: true, email: req.session.email, msg: msg, success: success });
})

router.post('/send/confirm', function (req, res, next) {
  let payer = req.session.payer
  let fee = req.session.money * 0.05
  let money = parseInt(req.session.money)
  let note = req.session.note
  if (otp === req.body.OTP) {
    User.findOne({ email: req.session.email }, (err, u1) => {
      if (!u1 || err) {
        console.log(err)
      }
      else {
        User.findOne({ email: req.session.receiver }, (err, u2) => {
          if (!u2 || err) {
            console.log(err)
          }
          if (money > 5000000) {
            if (payer === 'Người gửi') {
              let tran = new Transaction({
                id: tranIDCreate('Chuyển tiền'),
                maker: u1.email,
                sender: u1.email,
                receiver: u2.email,
                type: 'Chuyển tiền',
                amount: money,
                fee: fee,
                feePayer: u1.email,
                createAt: Date.now(),
                status: 'Chờ duyệt',
                note: note
              }).save()
              req.session.success = 'Số tiền cần chuyển nhiều hơn 5 triệu đồng, khách hàng vui lòng đợi admin phê duyệt'
              return res.redirect('/send')
            }
            else {
              let tran = new Transaction({
                id: tranIDCreate('Chuyển tiền'),
                maker: u1.email,
                sender: u1.email,
                receiver: u2.email,
                type: 'Chuyển tiền',
                amount: money,
                fee: fee,
                feePayer: u2.email,
                createAt: Date.now(),
                status: 'Chờ duyệt',
                note: note
              }).save()
              req.session.success = 'Số tiền cần chuyển nhiều hơn 5 triệu đồng, khách hàng vui lòng đợi admin phê duyệt'
              return res.redirect('/send')
            }
          }
          else {
            if (payer === 'Người gửi') {
              let tran = new Transaction({
                id: tranIDCreate('Chuyển tiền'),
                maker: u1.email,
                sender: u1.email,
                receiver: u2.email,
                type: 'Chuyển tiền',
                amount: money,
                fee: fee,
                feePayer: u1.email,
                createAt: Date.now(),
                status: 'Thành công',
                note: note
              }).save()
              let tran2 = new Transaction({
                id: tranIDCreate('Nhận tiền'),
                maker: u2.email,
                sender: u1.email,
                receiver: u2.email,
                type: 'Nhận tiền',
                amount: money,
                fee: fee,
                feePayer: u1.email,
                createAt: Date.now(),
                status: 'Thành công',
                note: note
              }).save()
              User.findOneAndUpdate({ _id: u1._id }, { fund: u1.fund - (money + fee) }, (err, result) => {
                if (result == false || err) {
                  console.log(err)
                }
              })
              User.findOneAndUpdate({ _id: u2._id }, { fund: u2.fund + money }, (err, result) => {
                if (result == false || err) {
                  console.log(err)
                }
              })
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
                to: u2.email,
                subject: 'Thông báo biến động số dư',
                text: 'Bạn vừa nhận được số tiền từ ' + u1.fullname + '\n' +
                  'Người trả phí gửi: ' + u1.fullname + '\n' +
                  'Ghi chú: ' + note + '\n' +
                  'Biến động số dư: +' + money.toLocaleString('vi-VN') + 'đ\n' +
                  'Số dư hiện tại: ' + (u2.fund + money).toLocaleString('vi-VN') + 'đ'
              };

              transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                  console.log(error);
                } else {
                  console.log('Email sent: ' + info.response);
                }
              });
              req.session.success = 'Đã chuyền tiền thành công cho ' + u2.fullname
              return res.redirect('/send')
            }
            else {
              let tran = new Transaction({
                id: tranIDCreate('Chuyển tiền'),
                maker: u1.email,
                sender: u1.email,
                receiver: u2.email,
                type: 'Chuyển tiền',
                amount: money,
                fee: fee,
                feePayer: u2.email,
                createAt: Date.now(),
                status: 'Thành công',
                note: note
              }).save()
              let tran2 = new Transaction({
                id: tranIDCreate('Nhận tiền'),
                maker: u2.email,
                sender: u1.email,
                receiver: u2.email,
                type: 'Nhận tiền',
                amount: money,
                fee: fee,
                feePayer: u2.email,
                createAt: Date.now(),
                status: 'Thành công',
                note: note
              }).save()
              User.findOneAndUpdate({ _id: u1._id }, { fund: u1.fund - money }, (err, result) => {
                if (result == false || err) {
                  console.log(err)
                }
              })
              User.findOneAndUpdate({ _id: u2._id }, { fund: (u2.fund + money) - fee }, (err, result) => {
                if (result == false || err) {
                  console.log(err)
                }
              })
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
                to: u2.email,
                subject: 'Thông báo biến động số dư',
                text: 'Bạn vừa nhận được số tiền từ ' + u1.fullname + '\n' +
                  'Người trả phí gửi: bạn\n' +
                  'Ghi chú: ' + note + '\n' +
                  'Biến động số dư: +' + money.toLocaleString('vi-VN') + 'đ\n' +
                  'Số dư hiện tại: ' + (u2.fund + money).toLocaleString('vi-VN') + 'đ'
              };

              transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                  console.log(error);
                } else {
                  console.log('Email sent: ' + info.response);
                }
              });
              req.session.success = 'Đã chuyền tiền thành công cho ' + u2.fullname
              return res.redirect('/send')
            }
          }
        })
      }
    })
  }
  else {
    req.session.msg = 'Mã OTP không chính xác'
    return res.redirect('/send/confirm')
  }
})

//Mua thẻ điện thoại
router.get('/card', loginChecker, function (req, res, next) {
  let msg = req.session.msg
  req.session.msg = ''
  return res.render('buyCard', { title: 'Mua thẻ điện thoại', loggedIn: true, email: req.session.email, fund: req.session.fund, msg: msg });
})

router.post('/card', function (req, res, next) {
  let info = req.body
  let i = 0
  let tranID = tranIDCreate('Mua thẻ điện thoại')
  let total = parseInt(info.amount * info.price)
  let cardList = []
  let newFund = parseInt(req.session.fund - total)
  User.findOne({ email: req.session.email }, (err, u) => {
    if (!u || err) {
      console.log(err)
    }
    if (u.fund < total) {
      req.session.msg = 'Số dư hiện tại không đủ để thực hiện giao dịch'
      return res.redirect('/card')
    }
    else {
      do {
        let cardID = cardCreate(info.network)
        cardList.push(cardID)
        i++
      } while (i < info.amount)
      let tran = new Transaction({
        id: tranID,
        maker: req.session.email,
        type: 'Mua thẻ điện thoại',
        network: info.network,
        price: info.price,
        count: info.amount,
        amount: total,
        cardID: cardList,
        createAt: Date.now(),
        status: 'Thành công',
      }).save()
      User.findOneAndUpdate({ email: req.session.email }, { fund: newFund }, (err, result) => {
        if (result == false || err) {
          console.log(err)
        }
        else {
          req.session.success = 'Mua thẻ điện thoại thành công'
          req.session.tranID = tranID
          return res.redirect('/card/info')
        }
      })
    }
  })
})

//Thông tin thẻ điện thoại vừa mua
router.get('/card/info', loginChecker, function (req, res, next) {
  let tranID = req.session.tranID

  Transaction.findOne({ id: tranID }, (err, tran) => {
    if (tran == false || err) {
      console.log(err)
    }
    else {
      let success = req.session.success
      req.session.success = ''
      return res.render('buyCardInfo', { title: 'Thông tin thẻ điện thoại', loggedIn: true, email: req.session.email, success: success, card: tran, cardID: tran.cardID });
    }
  })

})

module.exports = router;
