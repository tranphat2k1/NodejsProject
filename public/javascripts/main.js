function Validator(options) {

    var selectorRules = {};

    function validate(inputElement, rule) {

        var errorElement = inputElement.parentElement.querySelector(options.errorSelector);
        var errorMessage;

        var rules = selectorRules[rule.selector];

        for (var i = 0; i < rules.length; i++) {
            errorMessage = rules[i](inputElement.value);
            if (errorMessage) {
                break;
            }
        }

        if (errorMessage) {
            errorElement.innerHTML = errorMessage;
        }
        else {
            errorElement.innerText = '';
        }

        return !errorMessage;
    }

    var formElement = document.querySelector(options.form);
    if (formElement) {

        formElement.onsubmit = function (e) {
            e.preventDefault();

            var isFormValid = true;

            options.rules.forEach(function (rule) {
                var inputElement = formElement.querySelector(rule.selector);
                var isValid = validate(inputElement, rule);

                if (!isValid) {
                    isFormValid = false;
                }
            });

            if (isFormValid) {
                formElement.submit();
            }

        }



        options.rules.forEach(function (rule) {

            if (Array.isArray(selectorRules[rule.selector])) {
                selectorRules[rule.selector].push(rule.test);
            }
            else {
                selectorRules[rule.selector] = [rule.test];
            }



            var inputElement = formElement.querySelector(rule.selector);
            if (inputElement) {
                inputElement.onblur = function () {
                    validate(inputElement, rule);
                }

                inputElement.onInput = function () {
                    var errorElement = inputElement.parentElement.querySelector(options.errorSelector);
                    errorElement.innerText = '';
                    inputElement.parentElement.classList.remove('invalid');
                }
            }
        });
    }
}


Validator.isRequired = function (selector) {
    return {
        selector,
        test(value) {
            return value.trim() ? undefined : 'Không được để trống trường này';
        }
    }
}

Validator.minLength = function (selector, min) {
    return {
        selector,
        test(value) {
            return value.length >= min ? undefined : `Trường này phải có ít nhất ${min} kí tự.`;
        }
    }
}

Validator.maxLength = function (selector, max) {
    return {
        selector,
        test(value) {
            return value.length <= max ? undefined : `Trường này có tối đa ${max} kí tự.`;
        }
    }
}

Validator.isFullName = function (selector) {
    return {
        selector,
        test(value) {
            var regex = /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾưăạảấầẩẫậắằẳẵặẹẻẽềềểếỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ ]/;
            return regex.test(value.trim()) ? undefined : 'Tên không hợp lệ';
        }
    }
}

Validator.isLengthOfUserName = function (selector) {
    return {
        selector,
        test(value) {
            return value.length == 10 ? undefined : `Tên tải khoản chỉ bao gồm 10 kí tự.`;
        }
    }
}


Validator.isLengthOfOTP = function (selector) {
    return {
        selector,
        test(value) {
            return value.length == 6 ? undefined : `Mã OTP bao gồm 6 kí tự`;
        }
    }
}



Validator.isEmail = function (selector) {
    return {
        selector,
        test(value) {
            var regex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return regex.test(value.trim()) ? undefined : 'Email không hợp lệ.';
        }
    }
}


Validator.isPhoneNumber = function (selector) {
    return {
        selector,
        test(value) {
            var regex = /((086|096|097|098|032|033|034|035|036|037|038|039|088|091|094|083|084|085|081|082|089|090|093|070|079|077|076|078|092|056|058)+([0-9]{7})\b)/g;
            return regex.test(value.trim()) ? undefined : 'Số điện thoại không hợp lệ.';
        }
    }
}


Validator.isUsername = function (selector) {
    return {
        selector,
        test(value) {
            var regex = /^[0-9]+$/;
            return regex.test(value.trim()) || value.trim() === 'admin' ? undefined : 'Tên đăng nhập không hợp lệ.';
        }
    }
}

Validator.isPassword = function (selector) {
    return {
        selector,
        test(value) {
            var regex = /^[a-zA-Z0-9]+$/;
            return regex.test(value.trim()) ? undefined : 'Mật khẩu không hợp lệ.';
        }
    }
}


Validator.isCardID = function (selector) {
    return {
        selector,
        test(value) {
            var regex = /^[0-9]+$/;
            return regex.test(value.trim()) && value.trim().length === 6 ? undefined : 'Mã thẻ không hợp lệ.';
        }
    }
}

Validator.isNumber = function (selector) {
    return {
        selector,
        test(value) {
            var regex = /^[0-9]+$/;
            return regex.test(value.trim()) ? undefined : 'Giá trị này không hợp lệ.';
        }
    }
}


Validator.isNotNegative = function (selector) {
    return {
        selector,
        test(value) {
            return value.trim() > 0 ? undefined : 'Giá trị không hợp lệ.';
        }
    }
}

Validator.isPassRepeat = function (selector, getComfirmValue) {
    return {
        selector,
        test(value) {
            return value.trim() === getComfirmValue() ? undefined : `Mật khẩu không khớp.`;
        }
    }
}

Validator.isLengthOfCVV = function (selector) {
    return {
        selector,
        test(value) {
            return value.length === 3 ? undefined : `Mã CVV chỉ bao gồm 3 kí tự.`;
        }
    }
}

Validator.isValidMoney = function (selector) {
    return {
        selector,
        test(value) {
            return value.trim() % 50000 === 0 ? undefined : `Số tiền phải là bội số của 50.000đ`;
        }
    }
}

Validator({
    form: '#form-register',
    errorSelector: '.form-message',
    rules: [
        Validator.isRequired('#fullname'),
        Validator.isFullName('#fullname'),
        Validator.maxLength('#fullname', 128),
        Validator.minLength('#fullname', 5),
        Validator.isRequired('#phone'),
        Validator.isPhoneNumber('#phone'),
        Validator.isRequired('#email'),
        Validator.isEmail('#email'),
        Validator.isRequired('#birthdate'),
        Validator.isRequired('#front'),
        Validator.isRequired('#back'),
        Validator.isRequired('#address'),

    ]
});


Validator({
    form: '#form-addMoney',
    errorSelector: '.form-message',
    rules: [
        Validator.isRequired('#cardID'),
        Validator.isRequired('#money'),
        Validator.isRequired('#CVV'),
        Validator.isRequired('#expireDate'),
        Validator.isCardID('#cardID'),
        Validator.isNumber('#money'),
        Validator.isNotNegative('#money'),
        Validator.isLengthOfCVV('#CVV'),
        Validator.isNotNegative('#CVV'),
        Validator.isNumber('#CVV'),

    ]
});


Validator({
    form: '#form-sendMoney',
    errorSelector: '.form-message',
    rules: [
        Validator.isRequired('#phone'),
        Validator.isRequired('#money'),
        Validator.isPhoneNumber('#phone'),
        Validator.isNumber('#money'),
        Validator.isNotNegative('#money'),
    ]
});


Validator({
    form: '#form-confirmSendMoneys',
    errorSelector: '.form-message',
    rules: [
        Validator.isRequired('#OTP'),
        Validator.isLengthOfOTP('#OTP'),

    ]
});

Validator({
    form: '#form-withdraw',
    errorSelector: '.form-message',
    rules: [
        Validator.isRequired('#cardID'),
        Validator.isRequired('#money'),
        Validator.isRequired('#CVV'),
        Validator.isRequired('#expireDate'),
        Validator.isCardID('#cardID'),
        Validator.isNumber('#money'),
        Validator.isNotNegative('#money'),
        Validator.isValidMoney('#money'),
        Validator.isLengthOfCVV('#CVV'),
        Validator.isNotNegative('#CVV'),
        Validator.isNumber('#CVV'),

    ]
});


Validator({
    form: '#form-login',
    errorSelector: '.form-message',
    rules: [
        Validator.isRequired('#username'),
        Validator.isUsername('#username'),
        Validator.isRequired('#password'),
    ]
});

Validator({
    form: '#form-checkInfo',
    errorSelector: '.form-message',
    rules: [
        Validator.isRequired('#email'),
        Validator.isEmail('#email'),
        Validator.isRequired('#phone'),
        Validator.isPhoneNumber('#phone'),
    ]
});

Validator({
    form: '#form-checkOTP',
    errorSelector: '.form-message',
    rules: [
        Validator.isRequired('#OTP'),
        Validator.isLengthOfOTP('#OTP'),
    ]
});


$(document).ready(() => {

    var amount = $("#amount").val();
    var price = $("#price").val();
    sumMoney = amount * price
    $("#sumPrice").text(sumMoney.toLocaleString('vi-VN'))

    $('#amount').change(() => {
        var amount = $("#amount").val();
        var price = $("#price").val();
        sumMoney = amount * price
        $("#sumPrice").text(sumMoney.toLocaleString('vi-VN'))
    })

    $('#price').change(() => {
        var amount = $("#amount").val();
        var price = $("#price").val();
        sumMoney = amount * price
        $("#sumPrice").text(sumMoney.toLocaleString('vi-VN'))
    })

    if ($('#form-changepassword .field-current-password').css('display') == 'none') {
        Validator({
            form: '#form-changepassword',
            errorSelector: '.form-message',
            rules: [
                Validator.isRequired('#password'),
                Validator.isRequired('#repassword'),
                Validator.minLength('#password', 8),
                Validator.maxLength('#password', 32),
                Validator.minLength('#repassword', 8),
                Validator.maxLength('#repassword', 32),
                Validator.isPassRepeat('#repassword', function () {
                    return document.querySelector('#form-changepassword #password').value.trim();
                })
            ]
        });
    } else {
        Validator({
            form: '#form-changepassword',
            errorSelector: '.form-message',
            rules: [
                Validator.isRequired('#currentpassword'),
                Validator.isRequired('#password'),
                Validator.isRequired('#repassword'),
                Validator.minLength('#currentpassword', 8),
                Validator.maxLength('#currentpassword', 32),
                Validator.minLength('#password', 8),
                Validator.maxLength('#password', 32),
                Validator.minLength('#repassword', 8),
                Validator.maxLength('#repassword', 32),
                Validator.isPassRepeat('#repassword', function () {
                    return document.querySelector('#form-changepassword #password').value.trim();
                })
            ]
        });
    }
})
