/**
 * ETransit
 * Copyright 2015 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 一些map
 * @author ibadplum@gmail.com
 */
define(
    function (require) {
        var map = {};

        map.support = {
            filter: 'WebkitFilter',
            transform: 'transform',
            transform3d: true,
            transformOrigin: 'transformOrigin',
            transition: 'transition',
            transitionDelay: 'transitionDelay',
            transitionEnd: 'transitionend'
        };

        var isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
        map.isChrome = isChrome;

        var div = document.createElement('div');

        // transition => WebkitTransition
        function getVendorPropertyName(prop) {
            if (prop in div.style) {
                return prop;
            }

            var prefixes = ['Moz', 'Webkit', 'O', 'ms'];
            var prop_ = prop.charAt(0).toUpperCase() + prop.substr(1);

            for (var i = 0; i < prefixes.length; ++i) {
                var vendorProp = prefixes[i] + prop_;
                if (vendorProp in div.style) { return vendorProp; }
            }
        }

        // Helper function to check if transform3D is supported.
        // Should return true for Webkits and Firefox 10+.
        function checkTransform3dSupport() {
            div.style[map.support.transform] = '';
            div.style[map.support.transform] = 'rotateY(90deg)';
            return div.style[map.support.transform] !== '';
        }

        // Check for the browser's transitions support.
        map.support.transition = getVendorPropertyName('transition');
        map.support.transitionDelay = getVendorPropertyName('transitionDelay');
        map.support.transform = getVendorPropertyName('transform');
        map.support.transformOrigin = getVendorPropertyName('transformOrigin');
        map.support.filter = getVendorPropertyName('Filter');
        map.support.transform3d = checkTransform3dSupport();
        map.support.clearCloneStyle = div.style.backgroundClip === "content-box";


        map.propertyMap = {
            marginBottom: 'margin',
            marginLeft: 'margin',
            marginRight: 'margin',
            marginTop: 'margin',
            paddingBottom: 'padding',
            paddingLeft: 'padding',
            paddingRight: 'padding',
            paddingTop: 'padding',
            perspective: 'transform',
            rotate: 'transform',
            rotate3d: 'transform',
            rotateX: 'transform',
            rotateY: 'transform',
            scale: 'transform',
            scaleX: 'transform',
            scaleY: 'transform',
            skewX: 'transform',
            skewY: 'transform',
            translate: 'transform',
            x: 'transform',
            y: 'transform'
        };
        map.cssProps = {
            float: 'cssFloat'
        };
        map.cssEase = {
            '_default':       'ease',
            'in':             'ease-in',
            'out':            'ease-out',
            'in-out':         'ease-in-out',
            'snap':           'cubic-bezier(0,1,.5,1)',
            // Penner equations
            'easeInCubic':    'cubic-bezier(.550,.055,.675,.190)',
            'easeOutCubic':   'cubic-bezier(.215,.61,.355,1)',
            'easeInOutCubic': 'cubic-bezier(.645,.045,.355,1)',
            'easeInCirc':     'cubic-bezier(.6,.04,.98,.335)',
            'easeOutCirc':    'cubic-bezier(.075,.82,.165,1)',
            'easeInOutCirc':  'cubic-bezier(.785,.135,.15,.86)',
            'easeInExpo':     'cubic-bezier(.95,.05,.795,.035)',
            'easeOutExpo':    'cubic-bezier(.19,1,.22,1)',
            'easeInOutExpo':  'cubic-bezier(1,0,0,1)',
            'easeInQuad':     'cubic-bezier(.55,.085,.68,.53)',
            'easeOutQuad':    'cubic-bezier(.25,.46,.45,.94)',
            'easeInOutQuad':  'cubic-bezier(.455,.03,.515,.955)',
            'easeInQuart':    'cubic-bezier(.895,.03,.685,.22)',
            'easeOutQuart':   'cubic-bezier(.165,.84,.44,1)',
            'easeInOutQuart': 'cubic-bezier(.77,0,.175,1)',
            'easeInQuint':    'cubic-bezier(.755,.05,.855,.06)',
            'easeOutQuint':   'cubic-bezier(.23,1,.32,1)',
            'easeInOutQuint': 'cubic-bezier(.86,0,.07,1)',
            'easeInSine':     'cubic-bezier(.47,0,.745,.715)',
            'easeOutSine':    'cubic-bezier(.39,.575,.565,1)',
            'easeInOutSine':  'cubic-bezier(.445,.05,.55,.95)',
            'easeInBack':     'cubic-bezier(.6,-.28,.735,.045)',
            'easeOutBack':    'cubic-bezier(.175, .885,.32,1.275)',
            'easeInOutBack':  'cubic-bezier(.68,-.55,.265,1.55)'
        };

        // predefined easing shortcuts
        map.easings = {
            linear: [.25, .25, .75, .75],
            ease: [.25, 0.1, 0.25, 1],
            'ease-in': [.42, 0, 1, 1],
            'ease-out': [0, 0, .58, 1],
            'ease-in-out': [.42, 0, .58, 1],
            'in': [.42, 0, 1, 1],
            out: [0, 0, .58, 1],
            'in-out': [.42, 0, .58, 1],            
            snap: [0, 1, .5, 1],
            easeInCubic: [.550,.055,.675,.190],
            easeOutCubic: [.215,.61,.355,1],
            easeInOutCubic: [.645,.045,.355,1],
            easeInCirc: [.6,.04,.98,.335],
            easeOutCirc: [.075,.82,.165,1],
            easeInOutCirc: [.785,.135,.15,.86],
            easeInExpo: [.95,.05,.795,.035],
            easeOutExpo: [.19,1,.22,1],
            easeInOutExpo: [1,0,0,1],
            easeInQuad: [.55,.085,.68,.53],
            easeOutQuad: [.25,.46,.45,.94],
            easeInOutQuad: [.455,.03,.515,.955],
            easeInQuart: [.895,.03,.685,.22],
            easeOutQuart: [.165,.84,.44,1],
            easeInOutQuart: [.77,0,.175,1],
            easeInQuint: [.755,.05,.855,.06],
            easeOutQuint: [.23,1,.32,1],
            easeInOutQuint: [.86,0,.07,1],
            easeInSine: [.47,0,.745,.715],
            easeOutSine: [.39,.575,.565,1],
            easeInOutSine: [.445,.05,.55,.95],
            easeInBack: [.6,-.28,.735,.045],
            easeOutBack: [.175, .885,.32,1.275],
            easeInOutBack: [.68,-.55,.265,1.55]                        
        };

        map.eventNames = {
            transition: 'transitionend',
            MozTransition: 'transitionend',
            OTransition: 'oTransitionEnd',
            WebkitTransition: 'webkitTransitionEnd',
            msTransition: 'MSTransitionEnd'
        };

        return map;
    }
);