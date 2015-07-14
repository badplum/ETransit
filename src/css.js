/**
 * ETransit
 * Copyright 2015 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file css喜欢函数
 * @author ibadplum@gmail.com
 */
define(
    function (require) {
        var map = require('./map');
        var util = require('./util');
        var css = {
            cssHooks: {},
            cssNumber: {
                'columnCount': true,
                'fillOpacity': true,
                'flexGrow': true,
                'flexShrink': true,
                'fontWeight': true,
                'lineHeight': true,
                'opacity': true,
                'order': true,
                'orphans': true,
                'widows': true,
                'zIndex': true,
                'zoom': true
            }
        };

        css.cssHooks['transit:transform'] = {
            get: function(elem) {
                return util.getData(elem, 'transform') || new Transform();
            },

            set: function(elem, v) {
                var value = v;

                if (!(value instanceof Transform)) {
                    value = new Transform(value);
                }

                // 从jquery里拷来的
                // We've seen the 3D version of Scale() not work in Chrome when the
                // element being scaled extends outside of the viewport.  Thus, we're
                // forcing Chrome to not use the 3d transforms as well.  Not sure if
                // translate is affectede, but not risking it.  Detection code from
                // http://davidwalsh.name/detecting-google-chrome-javascript
                if (map.support.transform === 'WebkitTransform' && !map.isChrome) {
                    elem.style[map.support.transform] = value.toString(true);
                }
                else {
                    elem.style[map.support.transform] = value.toString();
                }

                util.setData(elem, 'transform', value);
            }
        };

        css.cssHooks.transform = {
            set: css.cssHooks['transit:transform'].set
        };

        // Transform class
        // 从jquery里拷来的
        // This is the main class of a transformation property that powers
        // `$.fn.css({ transform: '...' })`.
        //
        // This is, in essence, a dictionary object with key/values as `-transform`
        // properties.
        //
        //     var t = new Transform("rotate(90) scale(4)");
        //
        //     t.rotate             //=> "90deg"
        //     t.scale              //=> "4,4"
        //
        // Setters are accounted for.
        //
        //     t.set('rotate', 4)
        //     t.rotate             //=> "4deg"
        //
        // Convert it to a CSS string using the `toString()` and `toString(true)` (for WebKit)
        // functions.
        //
        //     t.toString()         //=> "rotate(90deg) scale(4,4)"
        //     t.toString(true)     //=> "rotate(90deg) scale3d(4,4,0)" (WebKit version)
        //
        function Transform(str) {
            if (typeof str === 'string') {
                this.parse(str);
            }
            return this;
        }

        Transform.prototype = {
            //  ('scale', '2,4') => ('scale', '2', '4');
            setFromString: function (prop, val) {
                var args = (typeof val === 'string') 
                    ? val.split(',')
                    : (val.constructor === Array) ? val : [ val ];

                args.unshift(prop);
                Transform.prototype.set.apply(this, args);
            },

            set: function(prop) {
                var args = Array.prototype.slice.apply(arguments, [1]);
                if (this.setter[prop]) {
                    this.setter[prop].apply(this, args);
                }
                else {
                    this[prop] = args.join(',');
                }
            },

            get: function(prop) {
              if (this.getter[prop]) {
                return this.getter[prop].apply(this);
              } else {
                return this[prop] || 0;
              }
            },

            setter: {
                // rotate
                //
                // .css({ rotate: 30 })
                // .css({ rotate: "30" })
                // .css({ rotate: "30deg" })
                // .css({ rotate: "30deg" })
                //
                rotate: function(theta) {
                    this.rotate = util.unit(theta, 'deg');
                },

                rotateX: function(theta) {
                    this.rotateX = util.unit(theta, 'deg');
                },

                rotateY: function(theta) {
                    this.rotateY = util.unit(theta, 'deg');
                },

                // scale
                //
                // .css({ scale: 9 })      //=> "scale(9,9)"
                // .css({ scale: '3,2' })  //=> "scale(3,2)"
                //
                scale: function (x, y) {
                    if (y === undefined) { y = x; }
                    this.scale = x + "," + y;
                },

                // ### skewX + skewY
                skewX: function (x) {
                    this.skewX = util.unit(x, 'deg');
                },

                skewY: function (y) {
                    this.skewY = util.unit(y, 'deg');
                },

                // ### perspectvie
                perspective: function(dist) {
                    this.perspective = util.unit(dist, 'px');
                },

                // x / y
                // Translations. Notice how this keeps the other value.
                //
                // .css({ x: 4 })       //=> "translate(4px, 0)"
                // .css({ y: 10 })      //=> "translate(4px, 10px)"
                //
                x: function (x) {
                    this.set('translate', x, null);
                },

                y: function (y) {
                    this.set('translate', null, y);
                },

                // translate
                // Notice how this keeps the other value.
                //
                // .css({ translate: '2, 5' })    //=> "translate(2px, 5px)"
                //
                translate: function (x, y) {
                    if (this._translateX === undefined) {
                        this._translateX = 0;
                    }
                    if (this._translateY === undefined) {
                        this._translateY = 0;
                    }

                    if (x !== null && x !== undefined) {
                        this._translateX = util.unit(x, 'px');
                    }
                    if (y !== null && y !== undefined) {
                        this._translateY = util.unit(y, 'px');
                    }

                    this.translate = this._translateX + "," + this._translateY;
                }
            },

            getter: {
                x: function () {
                    return this._translateX || 0;
                },

                y: function () {
                    return this._translateY || 0;
                },

                scale: function () {
                    var s = (this.scale || "1,1").split(',');
                    if (s[0]) {
                        s[0] = parseFloat(s[0]);
                    }
                    if (s[1]) {
                        s[1] = parseFloat(s[1]);
                    }
                    // "2.5,2.5" => 2.5
                    // "2.5,1" => [2.5,1]
                    return (s[0] === s[1]) ? s[0] : s;
                },

                rotate3d: function () {
                    var s = (this.rotate3d || "0,0,0,0deg").split(',');
                    for (var i = 0; i <= 3; ++i) {
                        if (s[i]) {
                            s[i] = parseFloat(s[i]);
                        }
                    }
                    if (s[3]) {
                        s[3] = util.unit(s[3], 'deg');
                    }

                    return s;
                }
            },

            // ### parse()
            // Parses from a string. Called on constructor.
            parse: function (str) {
                var self = this;
                str.replace(
                    /([a-zA-Z0-9]+)\((.*?)\)/g,
                    function (x, prop, val) {
                        self.setFromString(prop, val);
                    }
                );
            },

            // ### toString()
            // Converts to a `transition` CSS property string. If `use3d` is given,
            // it converts to a `-webkit-transition` CSS property string instead.
            toString: function (use3d) {
                var re = [];

                for (var i in this) {
                    if (this.hasOwnProperty(i)) {
                        // Don't use 3D transformations if the browser can't support it.
                        if ((!map.support.transform3d) && ((i === 'rotateX') || (i === 'rotateY')
                            || (i === 'perspective') || (i === 'transformOrigin'))) {
                            continue;
                        }

                        if (i[0] !== '_') {
                            if (use3d && (i === 'scale')) {
                                re.push(i + '3d(' + this[i] + ',1)');
                            }
                            else if (use3d && (i === 'translate')) {
                                re.push(i + '3d(' + this[i] + ',0)');
                            }
                            else {
                                re.push(i + '(' + this[i] + ')');
                            }
                        }
                    }
                }

                return re.join(' ');
            }
        };

        css.cssHooks['x'] = {
            get: function (elem) {
                return css.style(elem, 'transit:transform');
            },

            set: function (elem, value) {
                var t = css.style(elem, 'transit:transform');
                t.setFromString('x', value);

                css.transit(elem, {'transit:transform': t});
            }
        };

        css.cssHooks['filter'] = {
            get: function(elem) {
                return elem.style[map.support.filter];
            },
            set: function(elem, value) {
                elem.style[map.support.filter] = value;
            }
        };

        css.cssHooks.transformOrigin = {
            get: function(elem) {
                return elem.style[map.support.transformOrigin];
            },
            set: function(elem, value) {
                elem.style[map.support.transformOrigin] = value;
            }
        };

        // css属性变换
        css.transit = function (elem, key) {
            if (util.type(key) === 'object') {
                util.each(
                    key,
                    function (name, value) {
                        css.style(elem, name, value);
                    }
                );
            }
        };

        // 单个CSS属性变换        
        css.style = function (elem, name, value) {
            if (!elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style) {
                return;
            }

            if (typeof name === 'object') {
                util.each(
                    name,
                    function (key, value) {
                        css.style(elem, key, value);
                    }
                );
                return;
            }

            var ret;
            var type;
            var origName = util.camelCase( name );
            var style = elem.style;
            name = vendorPropName(style, origName);
            var hooks = css.cssHooks[name] || css.cssHooks[origName];

            if (value !== undefined) {
                type = typeof value;

                if (type === 'string' && (ret = rrelNum.exec( value ))) {
                    value = ( ret[1] + 1 ) * ret[2] + parseFloat( jQuery.css(elem, name) );
                    type = 'number';
                }

                if (value == null || value !== value) {
                    return;
                }

                if (type === 'number' && !css.cssNumber[origName]) {
                    value += 'px';
                }

                if (!map.support.clearCloneStyle && value === "" && name.indexOf( "background" ) === 0) {
                    style[name] = "inherit";
                }

                if (!hooks || !('set' in hooks) || (value = hooks.set(elem, value)) !== undefined ) {
                    style[name] = value;
                }
            }
            else {
                if ( hooks && 'get' in hooks && (ret = hooks.get(elem, false)) !== undefined ) {
                    return ret;
                }

                // Otherwise just get the value from the style object
                return style[name];
            }

        };

        var cssPrefixes = [ "Webkit", "O", "Moz", "ms" ];
        var pnum = (/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/).source;
        var rrelNum = new RegExp( "^([+-])=(" + pnum + ")", "i" );

        // form jQuery
        // 获取属性值
        function vendorPropName(style, name) {
            // Shortcut for names that are not vendor prefixed
            if (name in style) {
                return name;
            }

            // Check for vendor prefixed names
            var capName = name[0].toUpperCase() + name.slice(1),
                origName = name,
                i = cssPrefixes.length;

            while ( i-- ) {
                name = cssPrefixes[ i ] + capName;
                if ( name in style ) {
                    return name;
                }
            }

            return origName;
        }

        return css;
    }
);