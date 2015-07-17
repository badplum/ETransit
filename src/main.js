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
        var eTransit = {};
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
        
        eTransit.to = function (elem, properties, duration, easing, callback) {
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
            this.line = {
                step: -1,
                queue:[]
            };
            this.delay = 0;
            this.isOver = false; 
        }

        /**
         * 恢复初始状态
         * 恢复包括所有动画过程中，用别的方法额外设置的style
         * @param  {Function} callback 完成后的回掉函数
         * @return {Object} this
         */
        TransitObject.prototype.restoreAllStyle = function (callback) {
            var me = this;
            var run = function (nextFn) {
                me.run();
                me.bindCallback(1, nextFn, callback);
                me.elem.style.cssText = me.oldTransitions.cssText;
                //me.elem.offsetWidth; // force a repaint
            };
            me.deferredRun(run);
            return me;
        };

        /**
         * 恢复初始状态
         * 仅恢复ETransit改变的值
         * @param  {Function} callback 完成后的回掉函数
         * @return {Object} this
         */
        TransitObject.prototype.restore = function (callback, isNow) {
            var me = this;
            var run = function (nextFn) {
                me.reverse(-1, callback, 'restore');
            };
            if (isNow) {
                run();
            }
            else {
                me.queneRun(run);
            }
            return me;
        };

        /**
         * 恢复初始状态
         * 仅恢复ETransit改变的值
         * @param  {Function} callback 完成后的回掉函数
         * @return {Object} this
         */
        TransitObject.prototype.restoreNow = function (callback) {
            this.restore(callback, true);
        }
        /**
         * 进入队列并按照队列顺序执行
         * @param  {Function} fn 待执行的函数
         */
        TransitObject.prototype.deferredRun = function (fn) {
            var element = this.elem;
            var deferredRun = function (nextFn) {
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
        TransitObject.prototype.run = function (type) {
            this._position = 0;
            this._getRealEasing(this.lastArguments.easing);
            this._prepare(this.properties, this.easing, type);
            this.timeLine = {
                startTime: + new Date(),
                restTime: this.duration
            };
            this.line.step++;
        };

        /**
         * 循环
         * @param  {number} times 循环次数。
         * @param  {number} step 需要循环的步骤个数，从最后一次开始倒数，默认为全部，为-1。
         * @return {Object} this
         */
        TransitObject.prototype.loop = function (times, step) {
            var me = this;
            times = parseInt(times, 10) || 2;
            step = parseInt(step, 10) || -1;
            var loopLine = {
                isReady: false,
                reverseStep: step,
                forwardStep: 0,
                times: 1,
                queue: []
            };

            function run () {
                if (!loopLine.isReady) {
                    step = step === -1 ? step = me.line.queue.length : step;
                    loopLine.reverseStep = step;
                    loopLine.isReady = true;
                }
                if (loopLine.reverseStep > 0) {
                    loopLine.reverseStep--;
                    loopLine.queue.push(me.line.queue[me.line.queue.length - 1]);
                    me.reverse(1, run, 'loop');
                }
                else if (loopLine.forwardStep < step) {
                    loopLine.forwardStep++;
                    var data = loopLine.queue.pop();
                    me.transit(data.properties, {duration: data.duration, delay: data.delay},
                        data.easing, run, 'loop');
                }
                else if (loopLine.times < times){
                    loopLine.times++;
                    loopLine.reverseStep = step;
                    loopLine.forwardStep = 0;
                    run();
                }
            }
            me.queneRun(run);
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
            var line = this.line.queue[this.line.queue.length - 1];
            var offset;
            var currentOffset;
            this.pauseStyle = util.clone(this.elem.style);

            var startTime = this.timeLine.resumeStartTime || this.timeLine.startTime;
            var pauseTime = +new Date();
            this.timeLine.restTime = this.timeLine.restTime - (pauseTime - startTime);
            this.status.pause = true;
            this._position += pauseTime - startTime;

            for (var name in line.properties) {
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
                        }n
                        beginValue = parseFloat(line.propertyData[name].begin);
                        endValue = parseFloat(line.propertyData[name].end);
                        current = ((endValue - begiValue) * valueProgress) + beginValue;                    
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
            var easing = this._getRealEasing(lastArguments.easing);

            this.elem.style.cssText = lastCssText.replace(/\d+ms/g, this.timeLine.restTime + 'ms')
                .replace(/cubic\-bezier\(.*?\)/g, 'cubic-bezier(' + easing.join(',') + ')');
            this.offsetWidth;
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

        var propertyNames = {};

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
            var prefixes = ['webkit', 'moz', 'ms', 'o'];
            var fullName;
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
         * 反转
         * 按照上一步的时间和easing对动画进行反转
         * @param {Function} callback 回掉
         * @param {number} step 回退的指令个数
         * @param {string} type 可以扩展的各种类型。而且只要有值都不用queue来。
         * @return {Object} this
         */
        TransitObject.prototype.reverse = function (step, callback, type) {
            var me = this;
            var element = me.elem;
            step = parseInt(step, 10) || 1;
            var i = 0;
            var realDuration = type === 'restore' ? 1 : undefined;
            var run = function (nextFn) {
                if (step === -1) {
                    step = me.line.queue.length;
                }
                if (i < step) {
                    i++;
                    var action = me.line.queue[me.line.queue.length - 1];
                    var properties = {};
                    var lastProperties = action.propertyData;
                    for (var name in lastProperties) {
                        properties[name] = lastProperties[name]['begin'];
                    }
                    var duration = {
                        duration: action.duration,
                        delay: action.delay
                    };
                    var easing = action.easing;
                    var fn = function () {
                        // 把line里最后两个干掉。
                        me.line.queue = me.line.queue.slice(0, -2);
                        run(nextFn);
                    }
                    me.transit(properties, realDuration || duration.duration, easing, fn, 'reverse');
                }
                else {
                    callback && callback();
                    nextFn && nextFn();
                }
            };
            if (type) {
                run();
            }
            else {
                me.queneRun(run);
            }
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
                setTimeout(
                    function () {
                        util.on(element, transitionEnd, cb);
                    },
                    1
                );
            }
            else {
                // Fallback to timers if the 'transitionend' event isn't supported.
                window.setTimeout(cb, duration);
            }
        };

        /**
         * 初始化相关工作
         * @param  {Object} properties 待变换的属性
         * @param  {string} easing esasing
         * @param  {string} type action类型
         */
        TransitObject.prototype._prepare = function (properties, easing, type) {
            var propertyData = {};
            for (var name in properties) {
                if (properties.hasOwnProperty(name)) {
                    var value = properties[name];
                    propertyData[name] = {
                        begin: null, 
                        end: value,
                        easing: easing, 
                        isTransform: isTransformProperty(name)
                    };
                }
            }
            this._getCurrentValues(this.elem, properties, propertyData);
            var data = {
                delay: util.toMS(this.delay),
                duration: util.toMS(this.duration),
                easing: this.easing,
                propertyData: propertyData,
                properties: properties,
                type: type
            };
            this.line.queue.push(data);
        }

        /**
         * 计算当前的各种属性
         * @param  {Object} target 元素
         * @param  {Object} properties 当前要撸的各种属性
         * @param  {Object} data 存属性的对象
         * @param  {Boolen} useStyle 是不是需要即时机选
         */
        TransitObject.prototype._getCurrentValues = function(target, properties, data, useStyle) {
            var style = useStyle? target.style : window.getComputedStyle(target);
            var value;
            var property;
            for (var name in properties) {
                if (properties[name].isTransform) {
                    value = this._getTransformValue(target, name);
                }
                else {
                    property = getProperty(style, name);
                    if (property[0] != name) {                    
                        data[property[0]] = data[name];
                        delete data[name];
                        name = property[0]; 
                    }
                    value = property[1];
                }
                data[name]['begin'] = value;
            }
        }

        /**
         * Fetch transform property value directly from Transit
         *
         */  
        this._getTransformValue = function(target, name) {
            if (name.indexOf('scale') === 0) {
                name = 'scale';
            }
            else if (name.indexOf('rotate') === 0) {
                name = 'rotate';
            }
            return util.style(target, name); 
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
            var delay = 0;
            if (typeof duration === 'undefined') {
                duration = option.speeds._default;
            }
            if (typeof duration === 'object') {
                var delay = util.toMS(duration.delay) || '0ms';
                duration = util.toMS(duration.duration) || '0ms';
            }
            if (typeof easing === 'undefined' || !easing) {
                easing = map.cssEase._default;
            }

            type = type || 'transit';
            this.duration = duration;
            this.delay = delay;
            this.easing = easing;
            this.properties = properties;

            var theseProperties = util.clone(properties);
            var lastTransit = util.clone(this.transitProperty) || {};
            var element = this.elem;

            this.lastArguments = {
                properties: properties,
                duration: duration,
                easing: easing,
                callback: callback
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

            // 获取需要执行的CSS，例如'transform 400ms ease'
            var transitionValue = getTransition(properties, duration, easing, delay);
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
                me.run(type);

                // callback
                var cb = function () {
                    if (bound) {
                        util.un(element, transitionEnd, cb);
                    }

                    if (i > 0 && !nextFn) {
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
                    setTimeout(
                        function () {
                            util.on(element, transitionEnd, cb);
                        },
                        1
                    );
                }
                else {
                    window.setTimeout(cb, i);
                }

                if (i > 0) {
                    element.style[map.support.transition] = transitionValue;
                }
                css.transit(element, theseProperties);
            };

            // Defer running. This allows the browser to paint any pending CSS it hasn't
            // painted yet before doing the transitions.
            var deferredRun = function (next) {
                run(next);
            };
            if (type !== 'transit') {
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
        eTransit.get = function (elem) {
            elem = util.dom.get(elem);
            return new TransitObject(elem);
        };

        return eTransit;
    }
);