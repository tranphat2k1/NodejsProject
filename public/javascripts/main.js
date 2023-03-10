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
            return value.trim() ? undefined : 'Kh??ng ???????c ????? tr???ng tr?????ng n??y';
        }
    }
}

Validator.minLength = function (selector, min) {
    return {
        selector,
        test(value) {
            return value.length >= min ? undefined : `Tr?????ng n??y ph???i c?? ??t nh???t ${min} k?? t???.`;
        }
    }
}

Validator.maxLength = function (selector, max) {
    return {
        selector,
        test(value) {
            return value.length <= max ? undefined : `Tr?????ng n??y c?? t???i ??a ${max} k?? t???.`;
        }
    }
}

Validator.isFullName = function (selector) {
    return {
        selector,
        test(value) {
            var regex = /^[a-zA-Z?????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????? ]/;
            return regex.test(value.trim()) ? undefined : 'T??n kh??ng h???p l???';
        }
    }
}

Validator.isLengthOfUserName = function (selector) {
    return {
        selector,
        test(value) {
            return value.length == 10 ? undefined : `T??n t???i kho???n ch??? bao g???m 10 k?? t???.`;
        }
    }
}


Validator.isLengthOfOTP = function (selector) {
    return {
        selector,
        test(value) {
            return value.length == 6 ? undefined : `M?? OTP bao g???m 6 k?? t???`;
        }
    }
}



Validator.isEmail = function (selector) {
    return {
        selector,
        test(value) {
            var regex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return regex.test(value.trim()) ? undefined : 'Email kh??ng h???p l???.';
        }
    }
}


Validator.isPhoneNumber = function (selector) {
    return {
        selector,
        test(value) {
            var regex = /((086|096|097|098|032|033|034|035|036|037|038|039|088|091|094|083|084|085|081|082|089|090|093|070|079|077|076|078|092|056|058)+([0-9]{7})\b)/g;
            return regex.test(value.trim()) ? undefined : 'S??? ??i???n tho???i kh??ng h???p l???.';
        }
    }
}


Validator.isUsername = function (selector) {
    return {
        selector,
        test(value) {
            var regex = /^[0-9]+$/;
            return regex.test(value.trim()) || value.trim() === 'admin' ? undefined : 'T??n ????ng nh???p kh??ng h???p l???.';
        }
    }
}

Validator.isPassword = function (selector) {
    return {
        selector,
        test(value) {
            var regex = /^[a-zA-Z0-9]+$/;
            return regex.test(value.trim()) ? undefined : 'M???t kh???u kh??ng h???p l???.';
        }
    }
}


Validator.isCardID = function (selector) {
    return {
        selector,
        test(value) {
            var regex = /^[0-9]+$/;
            return regex.test(value.trim()) && value.trim().length === 6 ? undefined : 'M?? th??? kh??ng h???p l???.';
        }
    }
}

Validator.isNumber = function (selector) {
    return {
        selector,
        test(value) {
            var regex = /^[0-9]+$/;
            return regex.test(value.trim()) ? undefined : 'Gi?? tr??? n??y kh??ng h???p l???.';
        }
    }
}


Validator.isNotNegative = function (selector) {
    return {
        selector,
        test(value) {
            return value.trim() > 0 ? undefined : 'Gi?? tr??? kh??ng h???p l???.';
        }
    }
}

Validator.isPassRepeat = function (selector, getComfirmValue) {
    return {
        selector,
        test(value) {
            return value.trim() === getComfirmValue() ? undefined : `M???t kh???u kh??ng kh???p.`;
        }
    }
}

Validator.isLengthOfCVV = function (selector) {
    return {
        selector,
        test(value) {
            return value.length === 3 ? undefined : `M?? CVV ch??? bao g???m 3 k?? t???.`;
        }
    }
}

Validator.isValidMoney = function (selector) {
    return {
        selector,
        test(value) {
            return value.trim() % 50000 === 0 ? undefined : `S??? ti???n ph???i l?? b???i s??? c???a 50.000??`;
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
