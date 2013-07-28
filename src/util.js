/*
 * jsPlumb
 * 
 * Title:jsPlumb 1.5.0
 * 
 * Provides a way to visually connect elements on an HTML page, using either SVG or VML.  
 * 
 * This file contains the util functions
 *
 * Copyright (c) 2010 - 2013 Simon Porritt (http://jsplumb.org)
 * 
 * http://jsplumb.org
 * http://github.com/sporritt/jsplumb
 * http://code.google.com/p/jsplumb
 * 
 * Dual licensed under the MIT and GPL2 licenses.
 */
;(function() {

    var _isa = function(a) { return Object.prototype.toString.call(a) === "[object Array]"; },
        _isnum = function(n) { return Object.prototype.toString.call(n) === "[object Number]"; },
        _iss = function(s) { return typeof s === "string"; },
        _isb = function(s) { return typeof s === "boolean"; },
        _isnull = function(s) { return s == null; },  
        _iso = function(o) { return o == null ? false : Object.prototype.toString.call(o) === "[object Object]"; },
        _isd = function(o) { return Object.prototype.toString.call(o) === "[object Date]"; },
        _isf = function(o) { return Object.prototype.toString.call(o) === "[object Function]"; },
        _ise = function(o) {
            for (var i in o) { if (o.hasOwnProperty(i)) return false; }
            return true;
        },
        pointHelper = function(p1, p2, fn) {
            p1 = _isa(p1) ? p1 : [p1.x, p1.y];
            p2 = _isa(p2) ? p2 : [p2.x, p2.y];    
            return fn(p1, p2);
        };
    
    jsPlumbUtil = {
        isArray : _isa,
        isString : _iss,
        isBoolean: _isb,
        isNull : _isnull,
        isObject : _iso,
        isDate : _isd,
        isFunction: _isf,
        isEmpty:_ise,
        isNumber:_isnum,
        clone : function(a) {
            if (_iss(a)) return "" + a;
            else if (_isb(a)) return !!a;
            else if (_isd(a)) return new Date(a.getTime());
            else if (_isf(a)) return a;
            else if (_isa(a)) {
                var b = [];
                for (var i = 0; i < a.length; i++)
                    b.push(this.clone(a[i]));
                return b;
            }
            else if (_iso(a)) {
                var b = {};
                for (var i in a)
                    b[i] = this.clone(a[i]);
                return b;		
            }
            else return a;
        },
        merge : function(a, b) {		
            var c = this.clone(a);		
            for (var i in b) {
                if (c[i] == null || _iss(b[i]) || _isb(b[i]))
                    c[i] = b[i];
                else {
                    if (_isa(b[i])/* && this.isArray(c[i])*/) {
                        var ar = [];
                        // if c's object is also an array we can keep its values.
                        if (_isa(c[i])) ar.push.apply(ar, c[i]);
                        ar.push.apply(ar, b[i]);
                        c[i] = ar;
                    }
                    else if(_iso(b[i])) {	
                        // overwite c's value with an object if it is not already one.
                        if (!_iso(c[i])) 
                            c[i] = {};
                        for (var j in b[i])
                            c[i][j] = b[i][j];
                    }
                }
            }
            return c;
        },
        copyValues:function(names, from, to) {
            for (var i = 0; i < names.length; i++)
                to[names[i]] = from[names[i]];
        },
        //
        // chain a list of functions, supplied by [ object, method name, args ], and return on the first
        // one that returns the failValue. if none return the failValue, return the successValue.
        //
        functionChain : function(successValue, failValue, fns) {        
            for (var i = 0; i < fns.length; i++) {
                var o = fns[i][0][fns[i][1]].apply(fns[i][0], fns[i][2]);
                if (o === failValue) {
                    return o;
                }
            }                
            return successValue;
        },
        // take the given model and expand out any parameters.
        populate : function(model, values) {		
            // for a string, see if it has parameter matches, and if so, try to make the substitutions.
            var getValue = function(fromString) {
                    var matches = fromString.match(/(\${.*?})/g);
                    if (matches != null) {
                        for (var i = 0; i < matches.length; i++) {
                            var val = values[matches[i].substring(2, matches[i].length - 1)];
                            if (val != null) {
                                fromString = fromString.replace(matches[i], val);
                            }
                        }							
                    }
                    return fromString;
                },		
                // process one entry.
                _one = function(d) {
                    if (d != null) {
                        if (_iss(d)) {
                            return getValue(d);
                        }
                        else if (_isa(d)) {
                            var r = [];	
                            for (var i = 0; i < d.length; i++)
                                r.push(_one(d[i]));
                            return r;
                        }
                        else if (_iso(d)) {
                            var r = {};
                            for (var i in d) {
                                r[i] = _one(d[i]);
                            }
                            return r;
                        }
                        else {
                            return d;
                        }
                    }
                };
            
            return _one(model);	
        },
        convertStyle : function(s, ignoreAlpha) {
            // TODO: jsPlumb should support a separate 'opacity' style member.
            if ("transparent" === s) return s;
            var o = s,
                pad = function(n) { return n.length == 1 ? "0" + n : n; },
                hex = function(k) { return pad(Number(k).toString(16)); },
                pattern = /(rgb[a]?\()(.*)(\))/;
            if (s.match(pattern)) {
                var parts = s.match(pattern)[2].split(",");
                o = "#" + hex(parts[0]) + hex(parts[1]) + hex(parts[2]);
                if (!ignoreAlpha && parts.length == 4) 
                    o = o + hex(parts[3]);
            }
            return o;
        },
        gradient : function(p1, p2) {
            return pointHelper(p1, p2, function(_p1, _p2) { 
                if (_p2[0] == _p1[0])
                    return _p2[1] > _p1[1] ? Infinity : -Infinity;
                else if (_p2[1] == _p1[1]) 
                    return _p2[0] > _p1[0] ? 0 : -0;
                else 
                    return (_p2[1] - _p1[1]) / (_p2[0] - _p1[0]); 
            });		
        },
        normal : function(p1, p2) {
            return -1 / this.gradient(p1, p2);
        },
        lineLength : function(p1, p2) {
            return pointHelper(p1, p2, function(_p1, _p2) {
                return Math.sqrt(Math.pow(_p2[1] - _p1[1], 2) + Math.pow(_p2[0] - _p1[0], 2));			
            });
        },
        segment : function(p1, p2) {
            return pointHelper(p1, p2, function(_p1, _p2) {
                if (_p2[0] > _p1[0]) {
                    return (_p2[1] > _p1[1]) ? 2 : 1;
                }
                else if (_p2[0] == _p1[0]) {
                    return _p2[1] > _p1[1] ? 2 : 1;    
                }
                else {
                    return (_p2[1] > _p1[1]) ? 3 : 4;
                }
            });
        },
        theta : function(p1, p2) {
            return pointHelper(p1, p2, function(_p1, _p2) {
                var m = jsPlumbUtil.gradient(_p1, _p2),
                    t = Math.atan(m),
                    s = jsPlumbUtil.segment(_p1, _p2);
                if ((s == 4 || s== 3)) t += Math.PI;
                if (t < 0) t += (2 * Math.PI);
            
                return t;
            });
        },
        intersects : function(r1, r2) {
            var x1 = r1.x, x2 = r1.x + r1.w, y1 = r1.y, y2 = r1.y + r1.h,
                a1 = r2.x, a2 = r2.x + r2.w, b1 = r2.y, b2 = r2.y + r2.h;
        
        return  ( (x1 <= a1 && a1 <= x2) && (y1 <= b1 && b1 <= y2) ) ||
                ( (x1 <= a2 && a2 <= x2) && (y1 <= b1 && b1 <= y2) ) ||
                ( (x1 <= a1 && a1 <= x2) && (y1 <= b2 && b2 <= y2) ) ||
                ( (x1 <= a2 && a1 <= x2) && (y1 <= b2 && b2 <= y2) ) ||	
                ( (a1 <= x1 && x1 <= a2) && (b1 <= y1 && y1 <= b2) ) ||
                ( (a1 <= x2 && x2 <= a2) && (b1 <= y1 && y1 <= b2) ) ||
                ( (a1 <= x1 && x1 <= a2) && (b1 <= y2 && y2 <= b2) ) ||
                ( (a1 <= x2 && x1 <= a2) && (b1 <= y2 && y2 <= b2) );
        },
        segmentMultipliers : [null, [1, -1], [1, 1], [-1, 1], [-1, -1] ],
        inverseSegmentMultipliers : [null, [-1, -1], [-1, 1], [1, 1], [1, -1] ],
        pointOnLine : function(fromPoint, toPoint, distance) {
            var m = jsPlumbUtil.gradient(fromPoint, toPoint),
                s = jsPlumbUtil.segment(fromPoint, toPoint),
                segmentMultiplier = distance > 0 ? jsPlumbUtil.segmentMultipliers[s] : jsPlumbUtil.inverseSegmentMultipliers[s],
                theta = Math.atan(m),
                y = Math.abs(distance * Math.sin(theta)) * segmentMultiplier[1],
                x =  Math.abs(distance * Math.cos(theta)) * segmentMultiplier[0];
            return { x:fromPoint.x + x, y:fromPoint.y + y };
        },
        /**
         * calculates a perpendicular to the line fromPoint->toPoint, that passes through toPoint and is 'length' long.
         * @param fromPoint
         * @param toPoint
         * @param length
         */
        perpendicularLineTo : function(fromPoint, toPoint, length) {
            var m = jsPlumbUtil.gradient(fromPoint, toPoint),
                theta2 = Math.atan(-1 / m),
                y =  length / 2 * Math.sin(theta2),
                x =  length / 2 * Math.cos(theta2);
            return [{x:toPoint.x + x, y:toPoint.y + y}, {x:toPoint.x - x, y:toPoint.y - y}];
        },
        findWithFunction : function(a, f) {
            if (a)
                for (var i = 0; i < a.length; i++) if (f(a[i])) return i;
            return -1;
        },
        clampToGrid : function(x, y, grid, dontClampX, dontClampY) {
            var _gridClamp = function(n, g) { 
                var e = n % g, 
                    f = Math.floor(n / g), 
                    inc = e >= (g / 2) ? 1 : 0; 
                return (f + inc) * g; 
            };
            return [
                dontClampX || grid == null ? x : _gridClamp(x, grid[0]),
                dontClampY || grid == null ? y : _gridClamp(y, grid[1])
            ];		
        },
        indexOf : function(l, v) {
            return jsPlumbUtil.findWithFunction(l, function(_v) { return _v == v; });	
        },
        removeWithFunction : function(a, f) {
            var idx = jsPlumbUtil.findWithFunction(a, f);
            if (idx > -1) a.splice(idx, 1);
            return idx != -1;
        },
        remove : function(l, v) {
            var idx = jsPlumbUtil.indexOf(l, v);	
            if (idx > -1) l.splice(idx, 1);
            return idx != -1;
        },
        // TODO support insert index
        addWithFunction : function(list, item, hashFunction) {
            if (jsPlumbUtil.findWithFunction(list, hashFunction) == -1) list.push(item);
        },
        addToList : function(map, key, value) {
            var l = map[key];
            if (l == null) {
                l = [], map[key] = l;
            }
            l.push(value);
            return l;
        },
        //
        // extends the given obj (which can be an array) with the given constructor function, prototype functions, and
        // class members, any of which may be null.
        //
        extend : function(child, parent, _protoFn, _protoAtts) {
            _protoFn = _protoFn || {};
            _protoAtts = _protoAtts || {};
            parent = _isa(parent) ? parent : [ parent ];            

            for (var i = 0; i < parent.length; i++) {
                for (var j in parent[i].prototype) {
                    if(parent[i].prototype.hasOwnProperty(j)) {
                        child.prototype[j] = parent[i].prototype[j];
                    }
                }
            }

            var _makeFn = function(name) {
                return function() {
                    for (var i = 0; i < parent.length; i++) {
                        if (parent[i].prototype[name])
                            parent[i].prototype[name].apply(this, arguments);
                    }                    
                    return _protoFn[name].apply(this, arguments);
                };
            };

            for (var j in _protoFn) {
                child.prototype[j] = _makeFn(j);
            }

            for (var j in _protoAtts) {
                child.prototype[j] = _protoAtts[j];
            }

            return child;
        },
        uuid : function() {
            return ('xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                return v.toString(16);
            }));
        },
        logEnabled : true,
        log : function() {
            if (jsPlumbUtil.logEnabled && typeof console != "undefined") {
                try {
                    var msg = arguments[arguments.length - 1];
                    console.log(msg);
                }
                catch (e) {} 
            }
        },
        group : function(g) { if (jsPlumbUtil.logEnabled && typeof console != "undefined") console.group(g); },
        groupEnd : function(g) { if (jsPlumbUtil.logEnabled && typeof console != "undefined") console.groupEnd(g); },
        time : function(t) { if (jsPlumbUtil.logEnabled && typeof console != "undefined") console.time(t); },
        timeEnd : function(t) { if (jsPlumbUtil.logEnabled && typeof console != "undefined") console.timeEnd(t); },
        
        /**
		 * helper to remove an element from the DOM.
		 */
		removeElement : function(element) {
			if (element != null && element.parentNode != null) {
				element.parentNode.removeChild(element);
			}
		},
        /**
		 * helper to remove a list of elements from the DOM.
		 */
		removeElements : function(elements) {
			for ( var i = 0; i < elements.length; i++)
				jsPlumbUtil.removeElement(elements[i]);
		},
        /*
         * Function: sizeElement 
         * Helper to size and position an element. You would typically use
         * this when writing your own Connector or Endpoint implementation.
         * 
         * Parameters: 
         *  x - [int] x position for the element origin 
         *  y - [int] y position for the element origin 
         *  w - [int] width of the element 
         *  h - [int] height of the element
         *  
         */
        sizeElement : function(el, x, y, w, h) {
            if (el) {
                el.style.height = h + "px";
                el.height = h;
                el.style.width = w + "px";
                el.width = w;
                el.style.left = x + "px";
                el.style.top = y + "px";
            }
        }
    };

    /**
     * EventGenerator
     * Superclass for objects that generate events - jsPlumb extends this, as does jsPlumbUIComponent, which all the UI elements extend.
     */
    jsPlumbUtil.EventGenerator = function() {
        var _listeners = {}, eventsSuspended = false;
        
        // this is a list of events that should re-throw any errors that occur during their dispatch. as of 1.3.0 this is private to
        // jsPlumb, but it seems feasible that people might want to manipulate this list.  the thinking is that we don't want event
        // listeners to bring down jsPlumb - or do we.  i can't make up my mind about this, but i know i want to hear about it if the "ready"
        // event fails, because then my page has most likely not initialised.  so i have this halfway-house solution.  it will be interesting
        // to hear what other people think.
        var eventsToDieOn = [ "ready" ];
                                
        /*
         * Binds a listener to an event.  
         * 
         * Parameters:
         *  event       -   name of the event to bind to.
         *  listener    -   function to execute.
         */
        this.bind = function(event, listener) {
            jsPlumbUtil.addToList(_listeners, event, listener);     
            return this;        
        };
        /*
         * Fires an update for the given event.
         * 
         * Parameters:
         *  event               -   event to fire
         *  value               -   value to pass to the event listener(s).
         *  originalEvent       -   the original event from the browser
         */         
        this.fire = function(event, value, originalEvent) {
            if (!eventsSuspended && _listeners[event]) {
                // instead of looping through the array we get a counter and a length, because it is possible
                // that an event fired from here could cause the object to get cleaned up, which would throw
                // away the listeners. so after each cycle through the loop we check to ensure we haven't
                // been nuked.
                var l = _listeners[event].length, i = 0, _gone = false;
                while (!_gone && i < l) {
                    // doing it this way rather than catching and then possibly re-throwing means that an error propagated by this
                    // method will have the whole call stack available in the debugger.
                    if (jsPlumbUtil.findWithFunction(eventsToDieOn, function(e) { return e === event}) != -1)
                        _listeners[event][i](value, originalEvent);
                    else {
                        // for events we don't want to die on, catch and log.
                        try {
                            _listeners[event][i](value, originalEvent);
                        } catch (e) {
                            jsPlumbUtil.log("jsPlumb: fire failed for event " + event + " : " + e);
                        }
                    }
                    i++;
                    if (_listeners == null || _listeners[event] == null) _gone = true;
                }
            }
            return this;
        };
        /*
         * Clears either all listeners, or listeners for some specific event.
         * 
         * Parameters:
         *  event   -   optional. constrains the clear to just listeners for this event.
         */
        this.unbind = function(event) {
            if (event)
                delete _listeners[event];
            else {
                _listeners = {};
            }
            return this;
        };
        
        this.getListener = function(forEvent) {
            return _listeners[forEvent];
        };      
        
        this.setSuspendEvents = function(val) {
            eventsSuspended = val;    
        };
        
        this.isSuspendEvents = function() {
            return eventsSuspended;
        };

        this.cleanupListeners = function() {
            for (var i in _listeners) {
                _listeners[i].splice(0);
                delete _listeners[i];
            }
            // TODO: is it necessary to set these to null to help memory cleanup. i dont think it is.
          //  _listeners = null;
           // eventsSuspended = null;            
        };
    };


    jsPlumbUtil.EventGenerator.prototype = {
        cleanup:function() {
            this.cleanupListeners();
        }
    };


    // thanks MDC
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind?redirectlocale=en-US&redirectslug=JavaScript%2FReference%2FGlobal_Objects%2FFunction%2Fbind
    if (!Function.prototype.bind) {
      Function.prototype.bind = function (oThis) {
        if (typeof this !== "function") {
          // closest thing possible to the ECMAScript 5 internal IsCallable function
          throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
        }

        var aArgs = Array.prototype.slice.call(arguments, 1), 
            fToBind = this, 
            fNOP = function () {},
            fBound = function () {
              return fToBind.apply(this instanceof fNOP && oThis
                                     ? this
                                     : oThis,
                                   aArgs.concat(Array.prototype.slice.call(arguments)));
            };

        fNOP.prototype = this.prototype;
        fBound.prototype = new fNOP();

        return fBound;
      };
    }

})();