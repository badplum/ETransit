/**
 * ETransit
 * Copyright 2015 Baidu Inc. All rights reserved.
 *
 * @file 工具函数
 * @author ibadplum@gmail.com
 */
define(
    function (require) {
        var util = {
            dom: {}
        };

        /**
         * 获取DOM元素
         *
         * @param {string|Element} elem 要获取的dom的id或者其本身
         * @return {Element} 获取的dom element
         */
        util.dom.get = function (elem) {
            if (!elem) {
                return;
            }
            if (typeof elem === 'string') {
                elem = document.getElementById(elem);
            }
            return elem;
        };

        /**
         * 给时间加上ms单位
         *
         * @param {string|number} duration 需要转化的时间，单位ms
         * @return {string} 加上ms的时间
         */
        util.toMS = function (duration) {
            var i = duration;
            return util.unit(i, 'ms');
        };

        /**
         * 加上对应的单位
         *
         * @param {string|number} i 待加单位的值
         * @param {string} unit 待加上的单位
         * @return {string} 加上单位的值
         */
        util.unit = function (i, unit) {
            var result;
            if ((typeof i === 'string') && (!i.match(/^[\-0-9\.]+$/))) {
                result = i;
            }
            else {
                result = '' + i + unit;
            }
            return result;
        };

        /**
         * 便利对象或者数组
         *
         * @param {Array|Object} obj 待遍历的对象
         * @param {Function} callback 对每一个元素执行的函数
         * @param {Array} args callback的额外参数
         * @return {Array|Object} obj
         */
        util.each = function (obj, callback, args) {
            var value;
            var i = 0;
            var length = obj.length;
            var isArray = obj instanceof Array;

            if (args) {
                if (isArray) {
                    for (; i < length; i++) {
                        value = callback.apply(obj[i], args);
                        if (value === false) {
                            break;
                        }
                    }
                }
                else {
                    for (i in obj) {
                        if (obj.hasOwnProperty(i)) {
                            value = callback.apply(obj[i], args);
                        }

                        if (value === false) {
                            break;
                        }
                    }
                }
            }
            else {
                if (isArray) {
                    for (; i < length; i++) {
                        value = callback.call(obj[i], i, obj[i]);

                        if (value === false) {
                            break;
                        }
                    }
                }
                else {
                    for (i in obj) {
                        if (obj.hasOwnProperty(i)) {
                            value = callback.call(obj[i], i, obj[i]);

                            if (value === false) {
                                break;
                            }
                        }
                    }
                }
            }

            return obj;
        };

        /**
         * 转换为驼峰
         *
         * @param {string} str 待转字符串
         * @return {string} 转换后的字符串
         */
        util.camelCase = function (str) {
            var rmsPrefix = /^-ms-/;
            var rdashAlpha = /-([\da-z])/gi;

            var fcamelCase = function (all, letter) {
                return letter.toUpperCase();
            };

            return str.replace(rmsPrefix, 'ms-').replace(rdashAlpha, fcamelCase);
        };

        /**
         *  转换为非驼峰, marginLeft => margin-left
         *
         *  @param {string} str 待转字符串
         *  @return {string} 转换后的字符串
         */
        util.uncamel = function (str) {
            return str.replace(
                /([A-Z])/g,
                function (letter) {
                    return '-' + letter.toLowerCase();
                }
            );
        };

        /**
         * 注册监听事件
         *
         * @param {Element} el dom元素
         * @param {string} type 监听事件的名称
         * @param {Function} fn 监听触发的事件
         */
        util.on = function (el, type, fn) {
            if (document.addEventListener) {
                el.addEventListener(type, fn, false);
            }
            else {
                el.attachEvent('on' + type, function () {
                    return fn.call(el, window.event);
                });
            }
        };

        /**
         * 解绑监听事件
         *
         * @param {Element} el dom元素
         * @param {string} type 监听事件的名称
         * @param {Function} fn 监听触发的事件
         */
        util.un = function (el, type, fn) {
            if (el.removeEventListener) {
                el.removeEventListener(type, fn, false);
            }
            else if (el.detachEvent) {
                el.detachEvent('on' + type, fn);
            }
        };

        /**
         * 元素在数组中的位置
         *
         * @param {Array} list 数组
         * @param {Element} elem 元素
         * @return {number} 位置
         */
        util.indexOf = function (list, elem) {
            var i = 0;
            var len = list.length;
            for (; i < len; i++) {
                if (list[i] === elem) {
                    return i;
                }
            }
            return -1;
        };

        /**
         * 克隆
         *
         * @param {*} source 待克隆的元素
         * @return {*}
         */
        util.clone = function (source) {
            var result = source;
            var i;
            var len;

            if (!source
                || source instanceof Number
                || source instanceof String
                || source instanceof Boolean) {
                return result;
            }
            else if (source instanceof Array) {
                result = [];
                var resultLen = 0;
                for (i = 0, len = source.length; i < len; i++) {
                    result[resultLen++] = util.clone(source[i]);
                }
            }
            else if (source instanceof Object) {
                result = {};
                for (i in source) {
                    if (source.hasOwnProperty(i)) {
                        result[i] = util.clone(source[i]);
                    }
                }
            }
            return result;
        };

        var class2type = {};
        var toString = class2type.toString;

        /**
         * 返回目标类型
         *
         * @param {*} obj 待检测目标
         * @return {string} 目标类型
         */
        util.type = function (obj) {
            if (obj == null) {
                return obj + '';
            }
            // Support: Android<4.0, iOS<6 (functionish RegExp)
            return typeof obj === 'object' || typeof obj === 'function'
                ? class2type[toString.call(obj)] || 'object'
                : typeof obj;
        };

        // 存放data
        var dataCache = {
            uid: 0 // 计数用
        };

        /**
         * 获取指定元素的指定data
         *
         * @param {Element} elem 指定元素
         * @param {string} key 指定data的name
         * @return {*} data
         */
        util.getData = function (elem, key) {
            var data;
            if (elem.transitId) {
                data = dataCache[elem.transitId][key];
            }
            return data;
        };

        /**
         * 给元素存放data
         *
         * @param {Element} elem 指定元素
         * @param {string} key data的key
         * @param {*} value 存起来的值
         * @return {*} 存的值
         */
        util.setData = function (elem, key, value) {
            if (elem.transitId) {
                dataCache[elem.transitId][key] = value;
            }
            else {
                Object.defineProperty(
                    elem,
                    'transitId',
                    {
                        value: ++dataCache.uid,
                        enumerable: true
                    }
                );
                dataCache[dataCache.uid] = {};
                dataCache[dataCache.uid][key] = value;
            }
            return value;
        };

        /**
         * 是否是字符串
         *
         * @param {*} value 待检测的值
         * @return {boolean} 是否字符串
         */
        util.isString = function (value) {
            return typeof value === 'string'
                || (value && typeof value === 'object' && Object.prototype.toString.call(value) === '[object String]')
                || false;
        };

        /**
         * 是否是数组
         *
         * @param {*} value 带检测的值
         * @return {boolean} 是否是数组
         */
        util.isArray = Array.isArray || function (value) {
            return value
                && typeof value === 'object'
                && typeof value.length === 'number'
                && Object.prototype.toString.call(value) === '[object Array]';
        };

        /**
         * 待检测的元素在数组中的位置
         *
         * @param {Array} arr 检测数组
         * @param {number|string} search 待检测的元素
         * @return {number} 位置
         */
        util.inArray = function (arr, search) {
            if (!util.isArray(arr)) {
                throw 'expected an array as first param';
            }

            if (arr.indexOf) {
                return arr.indexOf(search);
            }

            for (var i = 0, end = arr.length; i < end; i++) {
                if (arr[i] === search) {
                    return i;
                }
            }
            return -1;
        };

        return util;
    }
);
