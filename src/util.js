/**
 * ETransit
 * Copyright 2015 Baidu Inc. All rights reserved.
 *
 * @file 工具函数
 * @author ibadplum@gmail.com
 */
define(
    function (require) {
        var map = require('./map');
        var util = {
            dom: {}
        };

        util.dom.get = function (elem) {
            if (!elem) {
                return;
            }
            if (typeof elem === 'string') {
                elem = document.getElementById(elem);
            }
            return elem;
        }

        // 转换为带ms后缀
        util.toMS = function (duration) {
            var i = duration;
            return util.unit(i, 'ms');
        };

        // 加单位后缀
        util.unit = function (i, unit) {
            if ((typeof i === 'string') && (!i.match(/^[\-0-9\.]+$/))) {
                return i;
            }
            else {
                return '' + i + unit;
            }
        };

        // 遍历
        util.each = function(obj, callback, args) {
            var value,
                i = 0,
                length = obj.length,
                isArray = obj instanceof Array;

            if (args) {
                if (isArray) {
                    for ( ; i < length; i++ ) {
                        value = callback.apply( obj[ i ], args );
                        if (value === false) {
                            break;
                        }
                    }
                }
                else {
                    for ( i in obj ) {
                        value = callback.apply( obj[ i ], args );

                        if (value === false)  {
                            break;
                        }
                    }
                }
            }
            else {
                if (isArray) {
                    for ( ; i < length; i++ ) {
                        value = callback.call( obj[ i ], i, obj[ i ] );

                        if (value === false) {
                            break;
                        }
                    }
                }
                else {
                    for (i in obj) {
                        value = callback.call( obj[ i ], i, obj[ i ] );

                        if (value === false) {
                            break;
                        }
                    }
                }
            }

            return obj;
        };

        // 转换为驼峰
        util.camelCase = function (string) {
            var rmsPrefix = /^-ms-/;
            var rdashAlpha = /-([\da-z])/gi;
            
            var fcamelCase = function(all, letter) {
                return letter.toUpperCase();
            };

            return string.replace(rmsPrefix, "ms-").replace(rdashAlpha, fcamelCase);
        };

        // 转换为非驼峰
        // marginLeft => margin-left
        util.uncamel = function (str) {
            return str.replace(
                /([A-Z])/g,
                function (letter) {
                    return '-' + letter.toLowerCase();
                }
            );
        };

        // 注册监听事件
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

        // 解绑监听事件
        util.un = function (el, type, fn) {
            if (el.removeEventListener) {
                el.removeEventListener(type, fn, false);
            } else if (el.detachEvent) {
                el.detachEvent('on' + type, fn);
            }
        }

        // 元素在数组中的位置
        util.indexOf = function (list, elem) {
            var i = 0;
            var len = list.length;
            for ( ; i < len; i++ ) {
                if (list[i] === elem) {
                    return i;
                }
            }
            return -1;
        };

        // 克隆
        util.clone  = function (source) {
            var result = source, i, len;
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

        // 返回参数类型
        util.type = function(obj) {
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

        // 获取data
        util.getData = function (elem, key) {
            var data;
            if (elem.transitId) {
                data = dataCache[elem.transitId][key];
            }
            return data;
        };

        // 存放data
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

        // 是否是字符串
        util.isString = function (value) {
            return typeof value == 'string'
                || (value && typeof value == 'object' && Object.prototype.toString.call(value) == '[object String]')
                || false;
        };

        // 是否是数组
        util.isArray = Array.isArray || function (value) {        
            return value
                && typeof value == 'object'
                && typeof value.length == 'number'
                && Object.prototype.toString.call(value) == '[object Array]';
        };

        // 待检测的元素，是否在数组中
        util.inArray = function (array, search) {
            if (!util.isArray(array)) {
                throw 'expected an array as first param';
            }
            
            if (array.indexOf) {
                return array.indexOf(search);
            }

            for (var i = 0, end = array.length; i < end; i++){
                if(array[i] === search) {
                    return i;
                }
            }
            return -1;
        }

        return util;
    }
);