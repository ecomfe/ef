/**
 * EF
 * Copyright 2015 Baidu Inc. All rights reserved.
 *
 * @file 默认ValueParser实现
 * @exports ef.valueParser
 * @author shenbin(bobshenbin@gmail.com)
 */
define(
    function (require) {
        var defaultValueParser = require('esui/main').defaultValueReplacer;

        /**
         * ValueParser类
         *
         * @class ef.ValueParser
         */
        var prototype = {};

        /**
         * parse方法
         *
         * @public
         * @method ef.ValueParser#parse
         * @param {string} value 输入值
         * @return {string} 输出值
         */
        prototype.parse = defaultValueParser;

        return require('eoo').create(prototype);
    }
);
