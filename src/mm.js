/**
 * ETransit
 * Copyright 2015 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file CSS动画库
 * @author ibadplum@gmail.com
 */
define(
    function (require) {
        var ETransit = {};
        var util = require('./util');
        var map = require('./map');
        var css = require('./css');

        var option = {
            enabled: true,
            useTransitionEnd: true,
            speeds: {
                _default: 1000
            }
        };

        // Detect the 'transitionend' event needed.
        var transitionEnd = map.support.transitionEnd = map.eventNames[map.support.transition] || null;

        // ## Other CSS hooks
        // Allows you to rotate, scale and translate.
        registerCssHook('scale');
        registerCssHook('scaleX');
        registerCssHook('scaleY');
        registerCssHook('translate');
        registerCssHook('rotate');
        registerCssHook('rotateX');
        registerCssHook('rotateY');
        registerCssHook('rotate3d');
        registerCssHook('perspective');
        registerCssHook('skewX');
        registerCssHook('skewY');
        registerCssHook('x', true);
        registerCssHook('y', true);

        function Transform(str) {
            if (typeof str === 'string') {
                this.parse(str);
            }
            return this;
        }
        
        ETransit.to = function (elem, properties, duration, easing, callback) {
            var transitObj = new TransitObject(elem);
            transitObj.transit(properties, duration, easing, callback);
        };

        /**
         * 获取transition属性的字符串
         * Example: getTransition({x: '100px', y: '100px'}, 100, 'linear', 0) 得到结果
         *          'transform 100ms linear, transform 100ms linear'
         * @param  {Object} properties 需要变换的CSS属性
         * @param  {number|string} duration 持续时间
         * @param  {string} easing easing的值
         * @param  {number|string} delay delay时间
         * @return {string} transition属性的字符串
         */
        function getTransition(properties, duration, easing, delay) {
            // 转换为可以用的属性数组
            var props = getProperties(properties);

            // 'in' => 'ease-in'
            if (map.cssEase[easing]) {
                easing = map.cssEase[easing];
            }

            // 各种基础属性写写好
            var attribs = '' + util.toMS(duration) + ' ' + easing;

            if (parseInt(delay, 10) > 0) {
                attribs += ' ' + util.toMS(delay);
            }

            // 多个属性的话，按照这个规则添加：
            // 'margin 200ms ease, padding 200ms ease, ...'
            var transitions = [];
            util.each(
                props,
                function(i, name) {
                    transitions.push(name + ' ' + attribs);
                }
            );

            return transitions.join(', ');
        }

        /**
         * 从用户写的属性，转换到浏览器要执行的的CSS属性
         * 例如 x -> transform
         * @param  {Object} props 需要转换的属性
         * @return {Array} 返回数组
         */
        function getProperties(props) {
            var result = [];

            util.each(
                props,
                function (key) {
                    key = util.camelCase(key); // Convert "text-align" => "textAlign"
                    key = map.propertyMap[key] || map.cssProps[key] || key;
                    key = util.uncamel(key); // Convert back to dasherized

                    // Get vendor specify propertie
                    if (map.support[key]) {
                        key = util.uncamel(map.support[key]);
                    }

                    if (util.inArray(result, key) === -1) {
                        result.push(key);
                    }
                }
            );

            return result;
        }

        /**
         * 注册CSSHOOK
         * @param  {string} prop cssHook的名字
         * @param  {Boolean} isPixels 是不是需要'px'后缀
         *
         */
        function registerCssHook(prop, isPixels) {
            // 要不要px的两种情况
            if (!isPixels) {
                css.cssNumber[prop] = true;
            }

            // 各种property转换为浏览器认识的写法
            map.propertyMap[prop] = map.support.transform;

            css.cssHooks[prop] = {
                get: function(elem) {
                    var t = css.style(elem, 'transit:transform');
                    return t;
                },

                set: function(elem, value) {
                    var t = css.style(elem, 'transit:transform');
                    t.setFromString(prop,  value);
                    css.style(elem, 'transit:transform', t);
                }
            };
        }

        /**
         * @class TransitObject
         *
         * Transit类
         *
         * 每个变换都是基于这个类
         *
         * @constructor
         */
        function TransitObject(elem) {
            this.elem = util.dom.get(elem);
            this.queue = [];
            this.status = {
                pause: false
            };
            this.oldTransitions = util.clone(elem.style);
        }

        /**
         * 恢复初始状态
         * @param  {Function} callback 完成后的回掉函数
         * @return {Object} this
         */
        TransitObject.prototype.restore = function (callback) {
            var me = this;
            var run = function (nextFn) {
                me.run({}, 1, 'transform 100ms linear');
                me.bindCallback(1, nextFn, callback);
                me.elem.style.cssText = me.oldTransitions.cssText;
                me.elem.offsetWidth; // force a repaint
            };
            me.deferredRun(run);
            return me;
        };

        /**
         * 进入队列并按照队列顺序执行
         * @param  {Function} fn 待执行的函数
         */
        TransitObject.prototype.deferredRun = function (fn) {
            var element = this.elem;
            var deferredRun = function (nextFn) {
                element.offsetWidth; // force a repaint
                fn(nextFn);
            };
            this.queneRun(deferredRun);
        };

        /**
         * 每个步骤前的准备工作。存储一些基本状态。
         * @param  {=string} lastTransitionValue 上次变换的transitionValue
         * @param  {=string|number} duration 持续时间
         * @param  {Object} arguments 上次变换的参数
         */
        TransitObject.prototype.run = function (lastTransitionValue, duration, arguments) {
            this._position = 0;
            this._getRealEasing(this.lastArguments.easing);
            this.lastTransition = arguments || this.lastTransition;
            this.lastStyle = util.clone(this.elem.style);
            this.lastDuration = parseInt(duration, 10) || this.lastDuration;
            this.lastTransitionValue = lastTransitionValue || this.lastTransitionValue;
        };

        /**
         * 对最后一步进行循环
         * @param  {number} times 循环次数，包含已经执行的一次。为1的时候，不进行额外的动作。
         * @return {Object} this
         */
        TransitObject.prototype.loop = function (times) {
            var me = this;
            var run = function () {
                me.reverse().transit.apply(me, me.lastTransition);
            };
            for (;times > 1; times--) {
                me._deferredRun(run);
            }
            return me;
        };
        
        var easingFunc;

        /**
         * 获取transitioin进度百分比，已小数形式表示
         * @return {number} 进度
         */
        TransitObject.prototype.getProgress = function () {
            var progress;
            progress = Math.max(0, Math.min(1, this._position / this.lastArguments.duration))
            return Math.round(progress * 1000) / 1000;
        }

        /**
         * 暂停
         * @return {Object} this
         */
        TransitObject.prototype.pause = function () {
            if (this.status.pause || (!this.timeLine.restTime && !this.lastArguments.duration)) {
                return this;
            }

            var elem = this.elem;
            var style = {};
            var targetStyle = window.getComputedStyle(elem);
            var transform;
            var line = this.transitProperty;
            var offset;
            var currentOffset;
            this.pauseStyle = util.clone(this.elem.style);

            var startTime = this.timeLine.resumeStartTime || this.timeLine.startTime;
            var pauseTime = +new Date();
            this.timeLine.restTime = this.timeLine.restTime - (pauseTime - startTime);
            this.status.pause = true;
            this._position += pauseTime - startTime;

            for (var name in line) {
                var prop = line[name];
                if (isTransformProperty(name)) {
                    if (name === 'x' || name === 'y' || name === 'z') {
                        transform = getProperty(targetStyle, 'transform')[1];
                        transformValues = transform.substring(transform.indexOf('(') + 1, transform.length - 1).split(/\s*,\s*/);
                        offset = transform.indexOf('matrix3d') === 0 ? 12 : 4;
                        currentOffset = offset + (name === 'z' ? 2 : (name === 'y' ? 1 : 0));
                        style[name] = transformValues[currentOffset];
                    }
                    else {
                        // 计算当前的各种样式，直接赋值给style
                        if (!easingFunc) {
                            easingFunc = bezier.apply(null, this._currentEasing);  
                            var progress = this.getProgress();                      
                            valueProgress = easingFunc(progress);
                        }
                        beginValue = parseFloat(this.transitProperty[name].start);
                        endValue = parseFloat(this.transitProperty[name].end);
                        current = ((endValue - beginValue) * valueProgress) + beginValue;                    
                        style[name] = current;
                    }
                }
                else {
                    style[name] = targetStyle[name];
                }
            }
            style[getProperty(targetStyle, 'transition')[0]] = 'none';
            css.style(elem, style);
            return this;
        };

        // 属于transform类型的各种属性
        var transformProperties = ('scale|scale3d|translate|translate3d|rotate|rotate3d|'
            + 'rotation|skew|scaleX|scaleY|scaleZ|translateX|translateY|translateZ|x|y|z|'
            + 'rotateX|rotateY|rotateZ|skewX|skewY').split('|');

        /**
         * 是不是transform类型
         * @param  {string} name 待检测的类型
         * @return {Boolean} 是不是transform类型
         */
        function isTransformProperty(name) {
            return (util.inArray(transformProperties, name) != -1);
        }

        /**
         * 继续动画
         * @return {Object} this
         */
        TransitObject.prototype.resume = function () {
            if (!this.status.pause) {
                return this;
            }

            var me = this;
            var elem = this.elem;
            var lastArguments = this.lastArguments;
            var lastCssText = this.pauseStyle.cssText;
            this.elem.offsetWidth;
            var lastDuration = this.lastDuration;
            var easing = this._getRealEasing(lastArguments.easing);

            this.elem.style.cssText = lastCssText.replace(/\d+ms/g, this.timeLine.restTime + 'ms')
                .replace(/cubic\-bezier\(.*?\)/g, 'cubic-bezier(' + easing.join(',') + ')');

            this.elem.offsetWidth;
            this.status.pause = false;
            this.timeLine.resumeStartTime = +new Date();
            return this;
        };

        // 存放已经计算过的Bezier，作为cache
        var bezierEasingCache = {};

        /**
         * 获取实际的easing。
         * 例如暂停后再继续，那么easing要做相应的调整才行
         * 
         * @param  {string} value 之前的easing
         * @return {string} 新的easing
         */
        TransitObject.prototype._getRealEasing = function (value) {
            if (util.isString(value) && value in map.easings) {
                value = map.easings[value];
            }
            if (util.isArray(value)) {
                var position = this._position;
                var timeRatio = position / this.lastArguments.duration;
                value = getNewBezier(value, timeRatio);
                if(this._currentEasing === undefined) {
                    this._currentEasing = value;
                }
            }
            return value;
        };

        /**
         * 计算新的bezier
         * @param  {Array} oldBezier 之前的bezier
         * @param  {number} time 已经运行的时间
         * @return {Array} 新的bezier
         */
        function getNewBezier(oldBezier, time) {
            if(time === 0 || time === 1) {
                return oldBezier;
            }
            var cacheName = oldBezier.join('_').replace(/\./g, 'p') + '_' + time.toFixed(3);
            if(cacheName in bezierEasingCache) {
                return bezierEasingCache[cacheName];
            }
            var xInterval = 1 - time;
            var oldBezierFunc = bezier.apply(null, oldBezier);
            var startY = oldBezierFunc(time);
            var sign = startY > 1? - 1 : 1;
            var yInterval = (1 - startY) * sign;

            var u = 0.33, v = 0.67;
            var uu = u * xInterval + time;
            var vv = v * xInterval + time;

            var p0x = 0, p0y = 0,
                p1x = u, p1y = (oldBezierFunc(uu) - startY) * sign / yInterval, 
                p2x = v, p2y = (oldBezierFunc(vv) - startY) * sign / yInterval, 
                p3x = 1, p3y = 1,
                compU = 1 - u, compV = 1 -v, 
                u2 = u * u, u3 = u * u * u, v2 = v * v, v3 = v * v * v,

                a = 3 * compU * compU * u, b = 3 * compU * u2, 
                c = 3 * compV * compV * v, d = 3 * compV * v2;

            var det = a*d - b*c;

            /* it would not be needed, it's just to honor Murphy's Law */
            if(det === 0) 
            {
                console.log('New Bezier FAIL: Det == 0'); 
                return oldBezier;
            }

            var compU3 = compU * compU * compU, compV3 = compV * compV * compV;

            var q1x = p1x - (compU3 * p0x + u3 * p3x),
                q1y = p1y - (compU3 * p0y + u3 * p3y),  
                q2x = p2x - (compV3 * p0x + v3 * p3x),
                q2y = p2y - (compV3 * p0y + v3 * p3y);

            var res = [
                (d * q1x - b * q2x) / det,
                (d * q1y - b * q2y) / det,

                ((-c) * q1x + a * q2x) / det,
                ((-c) * q1y + a * q2y) / det
            ];

            bezierEasingCache[cacheName] = res;
            return res;
        }

        /**
         *  Based on Bez http://github.com/rdallasgray/bez
         * 
         * Copyright Robert Dallas Gray. All rights reserved.
         * Provided under the FreeBSD license: https://github.com/rdallasgray/bez/blob/master/LICENSE.txt
         */
        function bezier(x1, y1, x2, y2) {
            var p1 = [x1, y1], p2 = [x2, y2],
                A = [null, null], B = [null, null], C = [null, null],

                bezCoOrd = function(time, ax) 
                {
                    C[ax] = 3 * p1[ax]; B[ax] = 3 * (p2[ax] - p1[ax]) - C[ax]; A[ax] = 1 - C[ax] - B[ax];
                    return time * (C[ax] + time * (B[ax] + time * A[ax]));
                },

                xDeriv = function(time) 
                {
                    return C[0] + time * (2 * B[0] + 3 * A[0] * time);
                },

                xForT = function(time) 
                {
                    var x = time, i = 0, z;
                    while (++i < 14) 
                    {
                        z = bezCoOrd(x, 0) - time;
                        if (Math.abs(z) < 1e-3) break;
                        x -= z / xDeriv(x);
                    }
                    return x;
                };

            return function(time) {
                return bezCoOrd(xForT(time), 1);
            };
        }

        /**
         * 获取当前浏览器应该怎么写property
         * @param  {Object} style style
         * @param  {string} name 要转换的property
         * @return {Array} 转换后的值
         */
        function getProperty(style, name) {
            if (style[name] !== void 0)
            {
                return [name, style[name]];
            }
            if (name in propertyNames)
            {
                return [propertyNames[name], style[propertyNames[name]]];
            }
            name = name.substr(0, 1).toUpperCase() + name.substr(1);
            var prefixes = ['webkit', 'moz', 'ms', 'o'], fullName;
            for (var i = 0, end = prefixes.length; i < end; i++)
            {
                fullName = prefixes[i] + name;
                if(style[fullName] !== void 0)
                {
                    propertyNames[name] = fullName;
                    return [fullName, style[fullName]];
                }
            }
            return [name, void 0];
        }

        /**
         * 反转。
         * 按照上一步的时间和easing对动画进行反转
         * @param  {Function} callback 回掉
         * @return {Object} this
         */
        TransitObject.prototype.reverse = function (callback) {
            var me = this;
            var element = me.elem;
            var run = function (nextFn) {
                var lastCssText = me.lastStyle.cssText;
                var lastDuration = me.lastDuration;
                me.run();
                me.bindCallback(lastDuration, nextFn, callback);
                // me.elem.style.cssText = lastCssText + map.support.transition + ':' + me.lastTransitionValue;
                me.elem.style.cssText = 'transition: transform 10000ms linear; -webkit-transition: transform 10000ms linear;';
            };
            me.deferredRun(run);
            return me;
        };

        /**
         * 绑定callback
         * @param  {number|string} duration 持续时间
         * @param  {Function} nextFn 队列中要执行的下一个函数
         * @param  {Function} callback 真正的回调函数
         */
        TransitObject.prototype.bindCallback = function (duration, nextFn, callback) {
            var bound = false;
            var element = this.elem;
            // Prepare the callback.
            var cb = function (e) {
                if (bound) {
                    util.un(element, transitionEnd, cb);
                }

                if (duration > 0) {
                    element.style[map.support.transition] = null;
                }

                if (typeof callback === 'function') {
                    callback(element);
                }
                if (typeof nextFn === 'function') {
                    nextFn();
                }
            };

            if ((duration > 0) && (transitionEnd) && (option.useTransitionEnd)) {
                // Use the 'transitionend' event if it's available.
                bound = true;
                util.on(element, transitionEnd, cb);
            }
            else {
                // Fallback to timers if the 'transitionend' event isn't supported.
                window.setTimeout(cb, duration);
            }
        };

        /**
         * 执行队列函数
         * @param  {Function} fn 待执行的函数
         */
        TransitObject.prototype._deferredRun = function (fn) {
            var deferredRun = function (next) {
                fn();
                next();
            }
            this.queneRun(deferredRun);
        };

        /**
         * 基本的变换函数
         * @param {Object} properties 待变换的属性
         * @param {string|number} duration 变换时间，单位ms
         * @param {string} easing easing
         * @param {Function} callback callback
         * @param {=string} type 变换执行的类型
         * @return {Object} this
         */
        TransitObject.prototype.transit = function (properties, duration, easing, callback, type) {
            var element = this.elem;
            var delay = 0;
            var theseProperties = util.clone(properties);
            var lastTransition = arguments;
            var lastTransit = util.clone(this.transitProperty) || {};
            if (!type || type === 'now') {
                this.lastArguments = {
                    properties: properties,
                    duration: duration,
                    easing: easing,
                    callback: callback
                };
                this.timeLine = {
                    startTime: + new Date(),
                    restTime: duration,
                    resume: {}
                };
                this.transitProperty = {};

                for (var name in properties) {
                    var start = lastTransit[name] || 0;
                    this.transitProperty[name] = {
                        end: properties[name],
                        duration: duration,
                        easing: easing,
                        start: start
                    }
                }
            }
            else {
                this.timeLine[type]['startTime'] = + new Date();
            }

            // Set defaults.(`400` duration, `ease` easing)
            if (typeof duration === 'undefined') {
                duration = option.speeds._default;
            }
            if (typeof easing === 'undefined' || !easing) {
                easing = map.cssEase._default;
            }

            duration = util.toMS(duration);

            // 获取需要执行的CSS，例如'transform 400ms ease'
            var transitionValue = getTransition(properties, duration, easing, delay);
            this.lastTransitionValue = transitionValue;
            var work = option.enabled && map.support.transition;
            var i = work ? (parseInt(duration, 10) + parseInt(delay, 10)) : 0;

            // 如果时间为0，则直接开动
            if (i === 0) {
                var fn = function (next) {
                    css.transit(element, theseProperties);
                    if (callback) {
                        callback.apply(this);
                    }
                    if (next) {
                        next();
                    }
                };
                this.queneRun(fn);
                return this;
            }

            var me = this;
            var run = function (nextFn) {
                var bound = false;
                me.run(null, duration, lastTransition);

                // callback
                var cb = function () {
                    if (bound) {
                        util.un(element, transitionEnd, cb);
                    }

                    if (i > 0) {
                        element.style[map.support.transition] = null;
                    }

                    if (typeof callback === 'function') {
                        callback(element);
                    }
                    if (typeof nextFn === 'function') {
                        nextFn();
                    }
                };

                // 支持'transitionend'用这个，不支持用setTimeout
                if ((i > 0) && (transitionEnd) && (option.useTransitionEnd)) {
                    bound = true;
                    util.on(element, transitionEnd, cb);
                }
                else {
                    window.setTimeout(cb, time);
                }

                if (i > 0) {
                    element.style[map.support.transition] = transitionValue;
                }
                css.transit(element, theseProperties);
            };

            // Defer running. This allows the browser to paint any pending CSS it hasn't
            // painted yet before doing the transitions.
            var deferredRun = function (next) {
                element.offsetWidth; // force a repaint
                run(next);
            };
            if (type === 'now') {
                deferredRun();
            }
            else {
                this.queneRun(deferredRun);
            }
            return this;
        };

        // 相当于transition,提供一个更好看的API
        TransitObject.prototype.then = TransitObject.prototype.transit;

        /**
         * 执行队列里的函数
         */
        TransitObject.prototype.dequeue = function () {
            var me = this;
            var next = function () {
                me.dequeue();
            };
            var fn = this.queue.shift();
            if (fn === 'inprogress') {
                fn = this.queue.shift();
            }
            if (fn && typeof fn === 'function') {
                me.queue.unshift( "inprogress" );
                fn.call(this, next);
            }
        };

        /**
         * 把函数塞进队列
         * @param  {Function} fn 塞进队列的函数
         */
        TransitObject.prototype.queneRun = function (fn) {
            this.queue.push(fn);
            if (this.queue[0] !== "inprogress") {
                this.dequeue();
            }
        };

        /**
         * 根据给定的元素来生成TransitObject
         * @param  {string|Object} elem 指定的元素
         * @return {Object} TransitObject
         */
        ETransit.get = function (elem) {
            elem = util.dom.get(elem);
            return new TransitObject(elem);
        };

        return ETransit;
    }
);