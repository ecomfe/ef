define(function (require) {
    var Action = require('er/Action');
    var Deferred = require('er/Deferred');
    var util = require('er/util');

    function Test() {
        Action.apply(this, arguments);
    }

    Test.prototype.enter = function () {
        console.log('enter test');
        return Deferred.resolved();
    };

    util.inherits(Test, Action);
    return Test;
})