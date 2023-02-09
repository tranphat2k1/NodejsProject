var express = require('express');
var router = express.Router();
var nodemailer = require('nodemailer');
var User = require('../models/user.js')
var Transaction = require('../models/transaction.js')

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

var adminChecker = (req, res, next) => {
    if (!req.session.email || !req.session.admin) {
        res.redirect("/")
    }
    else {
        next()
    }
}

//Danh sách tài khoản đã xác minh
router.get('/account/activated', adminChecker, function (req, res, next) {
    User.find({ status: 'Đã xác minh' }, function (err, users) {
        if (err) {
            console.log(err)
        }
        else {
            res.render('listUser', { title: 'Danh sách tài khoản đã kích hoạt', loggedIn: true, admin: true, email: req.session.email, list: users });
        }
    })
});

//Danh sách tài khoản chưa xác minh
router.get('/account/nonactivated', adminChecker, function (req, res, next) {
    User.find({ status: 'Chờ xác minh' }, function (err, users1) {
        if (err) {
            console.log(err)
        }
        else {
            User.find({ status: 'Chờ cập nhật' }, null, { updateAt: -1 }, function (err, users2) {
                if (err) {
                    console.log(err)
                }
                else {
                    res.render('listUser', { title: 'Danh sách tài khoản chờ kích hoạt', loggedIn: true, admin: true, email: req.session.email, nonactivted: true, list1: users1, list2: users2 });
                }
            })
        }
    }).sort({ createAt: -1 })
});

//Danh sách tài khoản bị vô hiệu hóa
router.get('/account/disabled', adminChecker, function (req, res, next) {
    User.find({ status: 'Đã vô hiệu hóa' }, function (err, users) {
        if (err) {
            console.log(err)
        }
        else {
            res.render('listUser', { title: 'Danh sách tài khoản đã vô hiệu hóa', loggedIn: true, admin: true, email: req.session.email, list: users });
        }
    }).sort({ createAt: -1 })
});

//Danh sách tài khoản đã bị khóa
router.get('/account/locked', adminChecker, function (req, res, next) {
    User.find({ status: 'Khóa vô thời hạn' }, function (err, users) {
        if (err) {
            console.log(err)
        }
        else {
            res.render('listUser', { title: 'Danh sách tài khoản đang bị khóa', loggedIn: true, admin: true, email: req.session.email, list: users, isLocked: true });
        }
    }).sort({ createAt: -1 })
});

//Chi tiết tài khoản
router.get('/account/detail/:id', adminChecker, function (req, res, next) {
    User.findOne({ _id: req.params.id }, function (err, u) {
        if (err) {
            console.log(err)
        }
        else {
            let msg = req.session.msg
            let isLocked = false
            let isDisabled = false
            let hiddenUdapteStatus = false
            req.session.msg = ''
            if (u.status === 'Khóa vô thời hạn') {
                isLocked = true
                hiddenUdapteStatus = true
            }
            if (u.status === 'Đã vô hiệu hóa') {
                isDisabled = true
                hiddenUdapteStatus = true
            }
            Transaction.find({ maker: u.email }, (err, trans) => {
                if (!trans || err) {
                    console.log(err)
                }
                else {
                    res.render('userDetail', { title: 'Thông tin chi tiết', loggedIn: true, admin: true, email: req.session.email, user: u, trans: trans, isLocked: isLocked, isDisabled: isDisabled, msg: msg, hidden: hiddenUdapteStatus });
                }
            }).sort({ createAt: -1 })
        }
    })
});

//Cập nhật lại trạng thái tài khoản
router.post('/account/update/:id', function (req, res, next) {
    var status = req.body.status
    if (status === 'Xác minh') {
        User.findOneAndUpdate({ _id: req.params.id }, { status: 'Đã xác minh' }, (err, user) => {
            if (err) {
                console.log(err)
            }
            else {
                req.session.msg = 'Đã xác minh thành công'
                res.redirect('/admin/account/detail/' + user._id)
            }
        })
    }
    if (status === 'Yêu cầu bổ sung') {
        User.findOneAndUpdate({ _id: req.params.id }, { status: 'Chờ cập nhật' }, (err, user) => {
            if (err) {
                console.log(err)
            }
            else {
                req.session.msg = 'Đã gửi yêu cầu bổ sung thông tin'
                res.redirect('/admin/account/detail/' + user._id)
            }
        })
    }
    if (status === 'Hủy') {
        User.findOneAndUpdate({ _id: req.params.id }, { status: 'Đã vô hiệu hóa' }, (err, user) => {
            if (err) {
                console.log(err)
            }
            else {
                req.session.msg = 'Đã vô hiệu hóa tài khoản này'
                res.redirect('/admin/account/detail/' + user._id)
            }
        })
    }
})

//Mở khóa tài khoản bị vô hiệu hóa/khóa
router.post('/account/unclock/:id', function (req, res, next) {
    User.findOneAndUpdate({ _id: req.params.id }, { status: 'Đã xác minh', login_failed: 0 }, (err, user) => {
        if (err) {
            console.log(err)
        }
        else {
            user.disableDate = undefined;
            user.save();
            req.session.msg = 'Đã mở khóa tài khoản này'
            res.redirect('/admin/account/detail/' + user._id)
        }
    })
})

//Danh sách tất cả các giao dịch đang chờ duyệt
router.get('/transaction', adminChecker, function (req, res, next) {
    Transaction.find({ status: 'Chờ duyệt' }, (err, trans) => {
        return res.render('transactionHistory', { title: 'Danh sách giao dịch chờ duyệt', loggedIn: true, admin: true, email: req.session.email, list: trans })
    }).sort({ createAt: -1 })
})

//Danh sách giao dịch rút tiền chờ duyệt
router.get('/transaction/withdraw', adminChecker, function (req, res, next) {
    Transaction.find({ type: 'Rút tiền', status: 'Chờ duyệt' }, (err, trans) => {
        return res.render('transactionHistory', { title: 'Danh sách giao dịch chờ duyệt', loggedIn: true, admin: true, email: req.session.email, list: trans })
    }).sort({ createAt: -1 })
})

//Danh sách giao dịch chuyển tiền chờ duyệt
router.get('/transaction/send', adminChecker, function (req, res, next) {
    Transaction.find({ type: 'Chuyển tiền', status: 'Chờ duyệt' }, (err, trans) => {
        return res.render('transactionHistory', { title: 'Danh sách giao dịch chờ duyệt', loggedIn: true, admin: true, email: req.session.email, list: trans })
    }).sort({ createAt: -1 })
})

//Chi tiết giao dịch
router.get('/transaction/detail/:id', adminChecker, function (req, res, next) {
    let msg = req.session.msg
    let feePayer
    req.session.msg = ''
    Transaction.findOne({ _id: req.params.id }, (err, tran) => {
        if (!tran || err) {
            console.log(err)
        }
        if (tran.type === 'Mua thẻ điện thoại' || tran.type === 'Nạp tiền' || tran.type === 'Rút tiền') {
            return res.render('transactionDetail', { title: 'Thông tin chi tiết giao dịch', loggedIn: true, admin: true, tran: tran, email: req.session.email, msg: msg })
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
                            return res.render('transactionDetail', { title: 'Thông tin chi tiết giao dịch', loggedIn: true, admin: true, tran: tran, email: req.session.email, sender: u1.fullname, receiver: u2.fullname, feePayer: feePayer, msg: msg })
                        }
                    })
                }
            })
        }
    })
})

//Phê duyệt giao dịch
router.post('/transaction/approve/:id', function (req, res, next) {
    Transaction.findOne({ _id: req.params.id }, (err, tran) => {
        if (!tran || err) {
            console.log(err)
        }
        else {
            Transaction.findOneAndUpdate({ _id: req.params.id }, { status: 'Thành công' }, (err, result) => {
                if (result == false || err) {
                    console.log(err)
                }
                else {
                    User.findOne({ email: tran.maker }, (err, u) => {
                        if (!u || err) {
                            console.log(err)
                        }
                        else {
                            let fund = parseInt(u.fund - (tran.amount + tran.fee))
                            if (tran.type === 'Rút tiền') {
                                User.findOneAndUpdate({ email: tran.maker }, { fund: fund }, (err, result) => {
                                    if (err) {
                                        console.log(err)
                                    }
                                    else {
                                        req.session.msg = 'Phê duyệt thành công'
                                        return res.redirect('/admin/transaction/detail/' + tran._id)
                                    }
                                })
                            }
                            else {
                                let tran2 = new Transaction({
                                    id: tranIDCreate('Nhận tiền'),
                                    maker: tran.receiver,
                                    sender: tran.sender,
                                    receiver: tran.receiver,
                                    type: 'Nhận tiền',
                                    amount: tran.amount,
                                    fee: tran.fee,
                                    feePayer: tran.feePayer,
                                    createAt: tran.createAt,
                                    status: 'Thành công',
                                    note: tran.note
                                }).save()
                                User.findOne({ email: tran.receiver }, (err, u2) => {
                                    if (!u2 || err) {
                                        console.log(err)
                                    }
                                    else {
                                        if (tran.feePayer === u.email) {
                                            User.findOneAndUpdate({ _id: u.id }, { fund: u.fund - (tran.amount + tran.fee) }, (err, result) => {
                                                if (result == false || err) {
                                                    console.log(err)
                                                }
                                            })
                                            User.findOneAndUpdate({ _id: u2._id }, { fund: u2.fund + tran.amount }, (err, result) => {
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
                                            //     service: 'gmail',
                                            //     auth: {
                                            //         user: 'moneywalletwebsite@gmail.com',
                                            //         pass: 'admin123!'
                                            //     }
                                            // });

                                            var mailOptions = {
                                                from: 'sinhvien@phongdaotao.com',
                                                to: u2.email,
                                                subject: 'Thông báo biến động số dư',
                                                text: 'Bạn vừa nhận được số tiền từ ' + u.fullname + '\n' +
                                                    'Người trả phí gửi: ' + u.fullname + '\n' +
                                                    'Ghi chú: ' + tran.note + '\n' +
                                                    'Biến động số dư: +' + (tran.amount).toLocaleString('vi-VN') + 'đ\n' +
                                                    'Số dư hiện tại: ' + (u2.fund + tran.amount).toLocaleString('vi-VN') + 'đ'
                                            };

                                            transporter.sendMail(mailOptions, function (error, info) {
                                                if (error) {
                                                    console.log(error);
                                                } else {
                                                    console.log('Email sent: ' + info.response);
                                                }
                                            });
                                            req.session.msg = 'Phê duyệt thành công'
                                            return res.redirect('/admin/transaction/detail/' + tran._id)
                                        }
                                        else {
                                            User.findOneAndUpdate({ _id: u._id }, { fund: u.fund - tran.amount }, (err, result) => {
                                                if (result == false || err) {
                                                    console.log(err)
                                                }
                                            })
                                            User.findOneAndUpdate({ _id: u2._id }, { fund: (u2.fund + tran.amount) - tran.fee }, (err, result) => {
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
                                            //     service: 'gmail',
                                            //     auth: {
                                            //         user: 'moneywalletwebsite@gmail.com',
                                            //         pass: 'admin123!'
                                            //     }
                                            // });

                                            var mailOptions = {
                                                from: 'sinhvien@phongdaotao.com',
                                                to: u2.email,
                                                subject: 'Thông báo biến động số dư',
                                                text: 'Bạn vừa nhận được số tiền từ ' + u.fullname + '\n' +
                                                    'Người trả phí gửi: bạn' +
                                                    'Ghi chú: ' + tran.note + '\n' +
                                                    'Biến động số dư: +' + (tran.amount).toLocaleString('vi-VN') + 'đ\n' +
                                                    'Số dư hiện tại: ' + (u2.fund + tran.amount).toLocaleString('vi-VN') + 'đ'
                                            };

                                            transporter.sendMail(mailOptions, function (error, info) {
                                                if (error) {
                                                    console.log(error);
                                                } else {
                                                    console.log('Email sent: ' + info.response);
                                                }
                                            });
                                            req.session.msg = 'Phê duyệt thành công'
                                            return res.redirect('/admin/transaction/detail/' + tran._id)
                                        }
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

//Từ chối giao dịch
router.post('/transaction/reject/:id', function (req, res, next) {
    Transaction.findOneAndUpdate({ _id: req.params.id }, { status: 'Thất bại' }, (err, result) => {
        if (result == false || err) {
            console.log(err)
        }
        else {
            req.session.msg = 'Đã từ chối giao dịch'
            return res.redirect('/admin/transaction/detail/' + req.params.id)
        }
    })
})

module.exports = router;
