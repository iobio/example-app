(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
/*  Chase Miller (2015-2016) */

// Grab an existing iobio namespace object, or create a blank object
// if it doesn't exist
var iobio = global.iobio || {};
global.iobio = iobio;

// export if being used as a node module - needed for test framework
if ( typeof module === 'object' ) { module.exports = iobio;}

// Add visualizations
iobio.viz = require('./viz/viz.js')

// Add layouts
iobio.viz.layout = require('./layout/layout.js')

// Add shapes
iobio.viz.svg = require('./svg/svg.js')

// Add utils
iobio.viz.utils = require('./utils.js')

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./layout/layout.js":4,"./svg/svg.js":8,"./utils.js":10,"./viz/viz.js":20}],2:[function(require,module,exports){
var hasOwn = Object.prototype.hasOwnProperty;
var toStr = Object.prototype.toString;
var undefined;

var isArray = function isArray(arr) {
	if (typeof Array.isArray === 'function') {
		return Array.isArray(arr);
	}

	return toStr.call(arr) === '[object Array]';
};

var isPlainObject = function isPlainObject(obj) {
	'use strict';
	if (!obj || toStr.call(obj) !== '[object Object]') {
		return false;
	}

	var has_own_constructor = hasOwn.call(obj, 'constructor');
	var has_is_property_of_method = obj.constructor && obj.constructor.prototype && hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');
	// Not own constructor property must be Object
	if (obj.constructor && !has_own_constructor && !has_is_property_of_method) {
		return false;
	}

	// Own properties are enumerated firstly, so to speed up,
	// if last one is own, then all properties are own.
	var key;
	for (key in obj) {}

	return key === undefined || hasOwn.call(obj, key);
};

module.exports = function extend() {
	'use strict';
	var options, name, src, copy, copyIsArray, clone,
		target = arguments[0],
		i = 1,
		length = arguments.length,
		deep = false;

	// Handle a deep copy situation
	if (typeof target === 'boolean') {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	} else if ((typeof target !== 'object' && typeof target !== 'function') || target == null) {
		target = {};
	}

	for (; i < length; ++i) {
		options = arguments[i];
		// Only deal with non-null/undefined values
		if (options != null) {
			// Extend the base object
			for (name in options) {
				src = target[name];
				copy = options[name];

				// Prevent never-ending loop
				if (target === copy) {
					continue;
				}

				// Recurse if we're merging plain objects or arrays
				if (deep && copy && (isPlainObject(copy) || (copyIsArray = isArray(copy)))) {
					if (copyIsArray) {
						copyIsArray = false;
						clone = src && isArray(src) ? src : [];
					} else {
						clone = src && isPlainObject(src) ? src : {};
					}

					// Never move original objects, clone them
					target[name] = extend(deep, clone, copy);

				// Don't bring in undefined values
				} else if (copy !== undefined) {
					target[name] = copy;
				}
			}
		}
	}

	// Return the modified object
	return target;
};


},{}],3:[function(require,module,exports){
var utils = require('../utils.js');

var graph = function() {
    // Defaults
    var sources = function(d) { return d.sources },
        targets = function(d) { return d.targets },
        position = function(d) { return d.position };
    
    function layout(root) {
    	var nodes = [];
    	var visited = {};
    	var uid = utils.getUID();
    	var stack = [ root ];
    	while ((node = stack.pop()) != null) {
    		if (node._visited == uid) continue;
    		nodes.push(node);
    		// mark as visited
    		node._visited = uid;
    		// see if multiple variants at this position
    		var v = visited[position(node)] || (visited[position(node)]=[]);
    		v.push(node);
    		if (v.length ==1 )
    			node.y = 0;
    		else 
    			for (var i=0; i<v.length; i++) {v[i].y = (i/(v.length-1) || 0) * 2 - 1;}    		

    		// push unvisited neighbors on stack
    		var neighbors = [].concat(sources(node), targets(node));    		    		
    		stack = stack.concat( neighbors.filter(function(a) {return a._visited != uid;}) )
    	}
    	return nodes;
    }

    /*
     * Identifies the links between all nodes
     */
    layout.links = function(nodes) {
    	var links = [];
    	nodes.forEach(function(node) {
    		(node.targets || []).map(function(target) {
	        	links.push( {
	          		'source': node,
	          		'target': target
	        	});
	        });
    	})
	    return links;
    }

    /*
     * Specifies the value function *sources*, which returns an array of node objects
     * for each datum. The default value function is `return sources`. The value function
     * is passed two arguments: the current datum and the current index.
     */    
    layout.sources = function(_) {
        if (!arguments.length) return sources;
            sources = _;
            return chart;
    }

    /*
     * Specifies the value function *targets*, which returns an array of node objects
     * for each datum. The default value function is `return targets`. The value function
     * is passed two arguments: the current datum and the current index.
     */
    layout.targets = function(_) {
        if (!arguments.length) return targets;
            targets = _;
            return chart;
    }

    /*
     * Specifies the value function *position*, which returns a nonnegative numeric value
     * for each datum. The default value function is `return position`. The value function
     * is passed two arguments: the current datum and the current index.
     */
    layout.position = function(_) {
        if (!arguments.length) return position;
            position = _;
            return chart;
    }
    // TODO: do these functions still make sense?
    // layout.size = function(x) {
    //   if (!arguments.length) return nodeSize ? null : size;
    //   nodeSize = (size = x) == null ? sizeNode : null;
    //   return tree;
    // };
    // layout.nodeSize = function(x) {
    //   if (!arguments.length) return nodeSize ? size : null;
    //   nodeSize = (size = x) == null ? null : sizeNode;
    //   return tree;
    // };
    return layout;
  };
 
 module.exports = graph;
},{"../utils.js":10}],4:[function(require,module,exports){

var layout = {};
// add layouts
layout.pileup = require('./pileup.js');
layout.graph = require('./graph.js');
layout.pointSmooth = require('./pointSmooth.js');
layout.outlier = require('./outlier.js');

module.exports = layout;
},{"./graph.js":3,"./outlier.js":5,"./pileup.js":6,"./pointSmooth.js":7}],5:[function(require,module,exports){


var outlier = function() {
  // Defaults
  var value = function(d) { return d[0]; },
      count = function(d) { return d[1]; };

  function layout(data) {
    var q1 = quantile(data, 0.25); 
    var q3 = quantile(data, 0.75);
    var iqr = (q3-q1) * 1.5; //
    
    return data.filter(function(d) { return (value(d)>=(Math.max(q1-iqr,0)) && value(d)<=(q3+iqr)) });
  }

  /*
   * Determines quantile of array with given p
   */
  function quantile(arr, p) {
    var length = arr.reduce(function(previousValue, currentValue, index, array){
       return previousValue + count(currentValue);
    }, 0) - 1;
    var H = length * p + 1, 
    h = Math.floor(H);

    var hValue, hMinus1Value, currValue = 0;
    for (var i=0; i < arr.length; i++) {
       currValue += count(arr[i]);
       if (hMinus1Value == undefined && currValue >= (h-1))
          hMinus1Value = value(arr[i]);
       if (hValue == undefined && currValue >= h) {
          hValue = value(arr[i]);
          break;
       }
    } 
    var v = +hMinus1Value, e = H - h;
    return e ? v + e * (hValue - v) : v;
  } 

  /*
   * Specifies the value function *value*, which returns a nonnegative numeric value
   * for each datum. The default value function is `return d[0]`. The value function
   * is passed two arguments: the current datum and the current index.
   */
  layout.value = function(_) {
    if (!arguments.length) return value;
    value = _;
    return layout;
  };

  /*
   * Specifies the value function *count*, which returns a nonnegative numeric value
   * for each datum. The default value function is `return d[1]`. The value function
   * is passed two arguments: the current datum and the current index.
   */
  layout.count = function(_) {
    if (!arguments.length) return count;
    count = _;
    return layout;
  };  

  return layout;
};

module.exports = outlier;

},{}],6:[function(require,module,exports){


var pileup = function() {
  // Defaults
  var startValue = function(d) { return d.start; },
      endValue = function(d) { return d.end; },
      sort = 'default',
      size = 400,
      buffer = 0;

  function layout(data) {

    // Compute the numeric values for each data element.
    var values = data.map(function(d, i) { return [+startValue.call(layout, d, i),+endValue.call(layout, d, i)]; });
    var xScale = d3.scale.linear()
            .domain( [values[0][0], values[values.length-1][1]] )
            .range([0, size]);

    // Optionally sort the data.
    var index = d3.range(data.length);
    if (sort != null) index.sort(sort === 'default'
        ? function(i, j) { return values[j][0] - values[i][0]; }
        : function(i, j) { return sort(data[i], data[j]); });

    // Compute the piles!
    // They are stored in the original data's order.
    // TODO: handle widhts that are less than a pixel
    var step;
    var piles = [];
    var furthestRight = [];

    // initialize piles
    var currPile = [];
    var prevPile = [];
    var prevPrevPile = [];

    // initialize indices
    var prevPileIndex = 1;

    index.forEach(function(i) {
      var start = values[i][0];
      var end = values[i][1];
      step = undefined;

      for ( var k=0; k < furthestRight.length; k++) {
        if ( (xScale(furthestRight[k])+buffer) < xScale(start) ) {
          step = k;
          furthestRight[k] = end;
          break;
        }
      }

      if (step == undefined) { step = furthestRight.length; furthestRight.push(end) }

      piles[i] = {
        data: data[i],
        x: start,
        w: end-start,
        y: step
      };
    });
    return piles;
  }

  /*
   * Specifies the value function *start*, which returns a nonnegative numeric value
   * for each datum. The default value function is `return start`. The value function
   * is passed two arguments: the current datum and the current index.
   */
  layout.start = function(_) {
    if (!arguments.length) return startValue;
    startValue = _;
    return layout;
  };

  /*
   * Specifies the value function *end*, which returns a nonnegative numeric value
   * for each datum. The default value function is `return end`. The value function
   * is passed two arguments: the current datum and the current index.
   */
  layout.end = function(_) {
    if (!arguments.length) return endValue;
    endValue = _;
    return layout;
  };

  /*
   * Specifies the x scale for the layout. This is necessary to accurately predict
   * which features will overlap in pixel space.
   */
  layout.size = function(_) {
    if (!arguments.length) return size;
    size = _;
    return layout;
  };

  /*
   * Specifies the buffer needed between features to not be considered an overlap
   */
  layout.buffer = function(_) {
    if (!arguments.length) return buffer;
    buffer = _;
    return layout;
  };

  /*
   * Specifies the sort function to be used or null if no sort
   */
  layout.sort = function(_) {
    if (!arguments.length) return sort;
    sort = _;
    return layout;
  };

  return layout;
};

module.exports = pileup;
},{}],7:[function(require,module,exports){


var pointSmooth = function() {
  // Defaults
  var pos = function(d) { return d.pos; },
      depth = function(d) { return d.depth; },
      size = 400;
      epsilonRate = 0.3;

  function layout(data) {

    // Compute the numeric values for each data element and keep original data.    
    var points = data.map(function(d, i) { 
      return {
        data: d,
        pos: +pos.call(layout, d, i),
        depth: +depth.call(layout, d, i)
      };
    });
    
    var epislon = parseInt( epsilonRate * (points[points.length-1].pos - points[0].pos) / size );

    // Compute the points!
    // They are stored in the original data's order.
    points = properRDP(points, epislon);    
    
    return points;
  }

  /*
   * Specifies the value function *pos*, which returns a nonnegative numeric value
   * for each datum. The default value function is `return pos`. The value function
   * is passed two arguments: the current datum and the current index.
   */
  layout.pos = function(_) {
    if (!arguments.length) return pos;
    pos = _;
    return layout;
  };

  /*
   * Specifies the value function *depth*, which returns a nonnegative numeric value
   * for each datum. The default value function is `return depth`. The value function
   * is passed two arguments: the current datum and the current index.
   */
  layout.depth = function(_) {
    if (!arguments.length) return depth;
    depth = _;
    return layout;
  };

  /*
   * Specifies the x scale for the layout. This is necessary to accurately predict
   * how smoothing will be necessary i.e. smaller size has less resolution and will 
   * require more smoothing.
   */
  layout.size = function(_) {
    if (!arguments.length) return size;
    size = _;
    return layout;
  };

  /*
   * Specifies the epislon rate to determine the aggressiveness of the smoothing   
   */
  layout.epsilonRate = function(_) {
    if (!arguments.length) return epsilonRate;
    epsilonRate = _;
    return layout;
  };

  return layout;
};

module.exports = pointSmooth;


/*
 * properRDP
 * 
 * @licence Feel free to use it as you please, a mention of my name is always nice.
 * 
 * Marius Karthaus
 * http://www.LowVoice.nl
 * 
 */ 

function properRDP(points,epsilon){
    var firstPoint=points[0];
    var lastPoint=points[points.length-1];
    if (points.length<3){
        return points;
    }
    var index=-1;
    var dist=0;
    for (var i=1;i<points.length-1;i++){
        var cDist=findPerpendicularDistance(points[i],firstPoint,lastPoint);
        if (cDist>dist){
            dist=cDist;
            index=i;
        }
    }
    if (dist>epsilon){
        // iterate
        var l1=points.slice(0, index+1);
        var l2=points.slice(index);
        var r1=properRDP(l1,epsilon);
        var r2=properRDP(l2,epsilon);
        // concat r2 to r1 minus the end/startpoint that will be the same
        var rs=r1.slice(0,r1.length-1).concat(r2);
        return rs;
    }else{
        return [firstPoint,lastPoint];
    }
}

function findPerpendicularDistance(p, p1,p2) {
    // if start and end point are on the same x the distance is the difference in X.
    var result;
    var slope;
    var intercept;
    if (p1.pos==p2.pos){
        result=Math.abs(p.pos-p1.pos);
    }else{
        slope = (p2.depth - p1.depth) / (p2.pos - p1.pos);
        intercept = p1.depth - (slope * p1.pos);
        result = Math.abs(slope * p.pos - p.depth + intercept) / Math.sqrt(Math.pow(slope, 2) + 1);
    }
   
    return result;
}
},{}],8:[function(require,module,exports){

var svg = {};
// add shapes
svg.variant = require('./variant.js');

module.exports = svg;
},{"./variant.js":9}],9:[function(require,module,exports){
var variant = function() { 
    
    // Value transformers
    var xValue = function(d) { return d.x; },
        yValue = function(d) { return d.y; },
        wValue = function(d) { return d.w; },
        hValue = function(d) { return d.h; };

    var diagonal = d3.svg.diagonal()        

    function shape(d, i) {    
        diagonal
            .source(function(d) { return {"x":hValue(d)*d.y, "y":d.x+Math.abs(d.w/2)}; })            
            .target(function(d) { return {"x":0, "y":d.x+d.w/2+Math.abs(d.w/2)}; })
            .projection(function(d) { return [d.y, d.x]; });
        
        var variantH = hValue(d);
        var bulbW = Math.abs(variantH * 5/6);
        // Create control points
        var c1 = variantH * 1/6+yValue(d),
            c2 = variantH*2/6+yValue(d),
            c3 = variantH*0.625+yValue(d),
            c4 = variantH*1.145+yValue(d);

        if (wValue(d) <= Math.abs(bulbW/2))
            return "M" +xValue(d)+","+yValue(d)+" C" +xValue(d)+ "," +c1+" "+parseInt(xValue(d)+wValue(d)/2-bulbW/2)+ "," +c2+" "+parseInt(xValue(d)+wValue(d)/2-bulbW/2)+ "," +c3+" C" +parseInt(xValue(d)+wValue(d)/2-bulbW/2)+ "," +c4+" "+parseInt(xValue(d)+wValue(d)/2+bulbW/2)+ "," +c4+" "+parseInt(xValue(d)+wValue(d)/2+bulbW/2)+ "," +c3+" C" +parseInt(xValue(d)+wValue(d)/2+bulbW/2)+ "," +c2+" "+parseInt(xValue(d)+wValue(d))+"," +c1+" "+parseInt(xValue(d)+wValue(d))+","+yValue(d);            
        else
            return diagonal(d)+diagonal({x:xValue(d), y:yValue(d), w:-wValue(d)});
    }

    /*
     * Specifies the value function *x*, which returns an integer for each datum
     * The value function is passed two arguments: the current datum and the current index.
     */  
    shape.xValue = function(_) {
        if (!arguments.length) return xValue;
        xValue = _;
        return shape;
    }

    /*
     * Specifies the value function *y*, which returns an integer for each datum
     * The value function is passed two arguments: the current datum and the current index.
     */  
    shape.yValue = function(_) {
        if (!arguments.length) return yValue;
        yValue = _;
        return shape;
    };

    /*
     * Specifies the value function *width*, which returns an integer for each datum
     * The value function is passed two arguments: the current datum and the current index.
     */  
    shape.wValue = function(_) {
        if (!arguments.length) return wValue;
        wValue = _;
        return shape;
    }; 

    /*
     * Specifies the value function *height*, which returns an integer for each datum
     * The value function is passed two arguments: the current datum and the current index.
     */  
    shape.hValue = function(_) {
        if (!arguments.length) return hValue;
        hValue = _;
        return shape;
    }; 

    return shape;
};

module.exports = variant;
},{}],10:[function(require,module,exports){

module.exports.format_unit_names = function(d) {
	if ((d / 1000000) >= 1)
		d = d / 1000000 + "M";
	else if ((d / 1000) >= 1)
		d = d / 1000 + "K";
	return d;            
}

module.exports.format_percent = function(d, precision_places) {
	var precision_places = precision_places || 1;
		
	var corrector = 1;
	for (var i=0; i < precision_places; i++) { corrector *= 10}

	var percent = parseInt( d * (corrector*100) ) / corrector;

	return percent;            
}

module.exports.getUID = function(separator) {    	
    var delim = separator || "-";

    function S4() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    }

    return (S4() + S4() + delim + S4() + delim + S4() + delim + S4() + delim + S4() + S4() + S4());	
}

module.exports.value_accessor = function(value, d) {
	return typeof value === 'function' ? value(d) : value;
}

module.exports.tooltipHelper = function(selection, tooltipElem, titleAccessor) {
	var utils = require('./utils.js')
	selection
		.on("mouseover", function(d,i) {    
			var tooltipStr = utils.value_accessor(titleAccessor, d); // handle both function and constant string
			var opacity = tooltipStr ? .9 : 0; // don't show if tooltipStr is null			
			tooltipElem.transition()        
				.duration(200)      
				.style("opacity", opacity);			
			tooltipElem.html(tooltipStr)
				.style("left", (d3.event.clientX) + "px") 
				.style("text-align", 'left')
				.style("top", (d3.event.clientY - 24) + "px");
		})
		.on("mouseout", function(d) {       
			tooltipElem.transition()        
				.duration(500)      
				.style("opacity", 0);   
		})
}

// Copies a variable number of methods from source to target.
module.exports.rebind = function(target, source) {
  var i = 1, n = arguments.length, method;
  while (++i < n) target[method = arguments[i]] = iobio_rebind(target, source, source[method]);
  return target;
};

// Method is assumed to be a standard D3 getter-setter:
// If passed with no arguments, gets the value.
// If passed with arguments, sets the value and returns the target.
function iobio_rebind(target, source, method) {
  return function() {
    var value = method.apply(source, arguments);
    return value === source ? target : value;
  };
}
},{"./utils.js":10}],11:[function(require,module,exports){
var alignment = function() {
	// Import base chart
	var base = require('./base.js')(),
		utils = require('../utils.js'),
		extend = require('extend');

	// Value transformers
	var directionValue = null;

	// Defaults
	var elemHeight = 4,
		orientation = 'down',
		events = [],
		tooltip;

	// Default Options
	var defaults = { };

	function chart(selection, opts) {
		// Merge defaults and options
		var options = {};
		extend(options, defaults, opts);

		// Call base chart
		base.call(this, selection, options);

		// Grab base functions for easy access
		var x = base.x(),
			y = base.y(),
			id = base.id();
			xValue = base.xValue(),
			yValue = base.yValue(),
			wValue = base.wValue(),
			yAxis = base.yAxis(),
			color = base.color(),
			transitionDuration = base.transitionDuration();

		// Change orientation of pileup
		if (orientation == 'down') {
			// swap y scale min and max
			y.range([y.range()[1],y.range()[0]]);
			// update y axis
			if(yAxis)
				selection.select(".iobio-y.iobio-axis").transition()
					.duration(0)
					.call(yAxis);
		}

		// Draw


		var g = selection.select('g.iobio-container').classed('iobio-alignment', true); // grab container to draw into (created by base chart)
		var aln = g.selectAll('.alignment')
				.data(selection.datum());

		// Enter
		aln.enter().append('g')
			.attr('class', 'alignment')
			.attr('transform', function(d) {
				var translate = 'translate('+parseInt(x(xValue(d) + wValue(d)/2))+','+ parseInt(y(yValue(d))-elemHeight/2) + ')'
				if (directionValue && directionValue(d) == 'reverse')
					return translate + ' rotate(180)';
				else
					return translate;
			})
			.append('polygon')
				.style('fill', color)
				.attr('id', function(d) { return id(d)})
				.attr('points', function(d) {
					var rW = x(xValue(d)+wValue(d)) - x(xValue(d));
					var rH = elemHeight;
					var arrW = Math.min(5, rW);

					if (directionValue)
						return ((-rW/2) + ',' + (-rH/2) + ' '
							  + (rW/2-arrW) + ',' + (-rH/2) + ' '
							  + (rW/2) + ',0 '
							  + (rW/2-arrW) + ',' + (rH/2) + ' '
							  + (-rW/2) + ',' + (rH/2));
					else
						return ((-rW/2) + ',' + (-rH/2) + ' '
							  + (rW/2) + ',' + (-rH/2) + ' '
							  + (rW/2) + ',' + (rH/2) + ' '
							  + (-rW/2) + ',' + (rH/2));
				})
			// .append('rect')
			// 	.style('fill', color)
			// 	.attr('x', function(d) { return x(xValue(d)) })
			// 	.attr('y', function(d) { return y(yValue(d)) - elemHeight + 2 })
			// 	.attr('id', function(d) { return id(d)})
			// 	.attr('width', function(d) { return x(xValue(d)+wValue(d)) - x(xValue(d)); })
			// 	.attr('height', function(d) { return elemHeight });

		aln.exit()

		aln.attr('transform', function(d) {
				var translate = 'translate('+parseInt(x(xValue(d) + wValue(d)/2))+','+ parseInt(y(yValue(d))-elemHeight/2) + ')'
				if (directionValue && directionValue(d) == 'reverse')
					return translate + ' rotate(180)';
				else
					return translate;
			})

		aln.select('polygon').transition()
			.duration(transitionDuration)
			.style('fill', color)
			.attr('points', function(d) {
				var rW = x(xValue(d)+wValue(d)) - x(xValue(d));
				var rH = elemHeight;
				var arrW = Math.min(5, rW);

				if (directionValue)
					return ((-rW/2) + ',' + (-rH/2) + ' '
						  + (rW/2-arrW) + ',' + (-rH/2) + ' '
						  + (rW/2) + ',0 '
						  + (rW/2-arrW) + ',' + (rH/2) + ' '
						  + (-rW/2) + ',' + (rH/2));
				else
					return ((-rW/2) + ',' + (-rH/2) + ' '
						  + (rW/2) + ',' + (-rH/2) + ' '
						  + (rW/2) + ',' + (rH/2) + ' '
						  + (-rW/2) + ',' + (rH/2));
			})
		// 	.attr('x', function(d) { return x(xValue(d)) })
		// 	.attr('y', function(d) { return y(yValue(d)) - elemHeight + 2 })
		// 	.attr('id', function(d) { return id(d)})
		// 	.attr('width', function(d) {
		// 		return x(xValue(d)+wValue(d)) - x(xValue(d));
		// 	})
		// 	.attr('height', function(d) { return elemHeight });

		// Add title on hover
	    if (tooltip) {
	    	var tt = d3.select('.iobio-tooltip')
	    	utils.tooltipHelper(g.selectAll('.alignment'), tt, tooltip);
	    }

	    // Attach events
		events.forEach(function(ev) {
			var cb = ev.listener ? function() {ev.listener.call(chart, svg)} : null;
			g.selectAll('.alignment').on(ev.event, cb);
		})

	}
	// Rebind methods in 2d.js to this chart
	base.rebind(chart);

	/*
	 * Value accessor for getting the direction of the alignment
	 */
	chart.directionValue = function(_) {
		if (!arguments.length) return directionValue;
		directionValue = _;
		return chart;
	};

	/*
   	 * Specifies the orientation of the alignment. Can be 'up' or 'down'
   	 */
  	chart.orientation = function(_) {
    	if (!arguments.length) return orientation;
    	orientation = _;
    	return chart;
  	};

	/*
   	 * Set events on rects
   	 */
	chart.on = function(event, listener) {
		if (!arguments.length) return events;
		events.push( {'event':event, 'listener':listener})
		return chart;
	}

	/*
   	 * Set tooltip that appears when mouseover rects
   	 */
	chart.tooltip = function(_) {
		if (!arguments.length) return tooltip;
			tooltip = _;
			return chart;
	}

	return chart;
}

// Export alignment
module.exports = alignment;
},{"../utils.js":10,"./base.js":14,"extend":2}],12:[function(require,module,exports){
var bar = function() {
	// Import base chart
	var base = require('./base.js')(),
		utils = require('../utils.js'),
		extend = require('extend');

	// Defaults
	var events = [],
		tooltip;

	// Default Options
	var defaults = { yMin: 0 };

	function chart(selection, opts) {
		// Merge defaults and options
		var options = {};
		extend(options, defaults, opts);

		// Call base chart
		base.call(this, selection, options);

		// Grab base functions for easy access
		var x = base.x(),
			y = base.y(),
			id = base.id();
			xValue = base.xValue(),
			yValue = base.yValue(),			
			wValue = base.wValue(),
			color = base.color(),
			transitionDuration = base.transitionDuration(),
			innerHeight = base.height() - base.margin().top - base.margin().bottom;		

		// Draw
		// enter
		var g = selection.select('g.iobio-container').classed('iobio-bar', true);; // grab container to draw into (created by base chart)		
		var gData = g.selectAll('.rect')
				.data(selection.datum(), function(d) { return xValue(d); })
		// exit
	    gData.exit().remove();
			
		// enter
		gData.enter().append('g')				
			.attr('class', 'rect')			
			.style('fill', color )
			.append('rect')					
				.attr('y', function(d) { return innerHeight })
				.attr('x', function(d) { return x(xValue(d)) })
				.attr('id', id )				
				.attr('width', function(d) { return x(xValue(d)+wValue(d)) - x(xValue(d));})				
				.attr('height', function(d) { return 0; });

		// update
		g.selectAll('.rect').select('rect').transition()
			.duration( transitionDuration )	
			.attr('x', function(d) { return x(xValue(d)) })		
			.attr('y', function(d) { return y(yValue(d)) })
			.attr('width', function(d) { return x(xValue(d)+wValue(d)) - x(xValue(d));})									
			.attr('height', function(d) { return innerHeight - y(yValue(d)); });
	    

		// Add title on hover	   
	    if (tooltip) {	 
	    	var tt = d3.select('.iobio-tooltip')   	
	    	utils.tooltipHelper(g.selectAll('.rect'), tt, tooltip);
	    }

	    // Attach events
		events.forEach(function(ev) {
			var cb = ev.listener ? function() {ev.listener.call(chart, svg)} : null;
			g.selectAll('.rect').on(ev.event, cb);			
		})	

	}
	// Rebind methods in base.js to this chart
	base.rebind(chart);

	/*
   	 * Set events on rects
   	 */
	chart.on = function(event, listener) {
		if (!arguments.length) return events;
		events.push( {'event':event, 'listener':listener})
		return chart;
	}

	/*
   	 * Set tooltip that appears when mouseover rects
   	 */
	chart.tooltip = function(_) {
		if (!arguments.length) return tooltip;
			tooltip = _;
			return chart; 
	}

	return chart;
}

// Export alignment
module.exports = bar;
},{"../utils.js":10,"./base.js":14,"extend":2}],13:[function(require,module,exports){
var barViewer = function() {
	// Import base chart
	var bar = require('./bar.js'),
		utils = require('../utils.js'),
		extend = require('extend');

	// Defaults
	var events = [],
		tooltip,
		sizeRatio = 0.8,
		origHeight;

	// Default Options
	var defaults = { };

	// Base Chart
	var baseBar = bar();

	function chart(selection, opts) {
		// Merge defaults and options
		var options = {};
		extend(options, defaults, opts);

		origHeight = chart.height();

		// Setup both chart divs
		selection.selectAll('div')
				.data([0,0])
			.enter().append('div')
				.attr('class', function(d,i) { return 'iobio-bar-' + i + ' iobio-barViewer' });

		// Call big bar chart
		var focalBar = bar()
			.height( origHeight * sizeRatio )
			.xValue( chart.xValue() )
			.yValue( chart.yValue() )
			.wValue( chart.wValue() )
			.xAxis( chart.xAxis() )
			.yAxis( chart.yAxis() )
			.margin( chart.margin() )
			.width( chart.width() )
			.y( chart.y() )
			.x( chart.x() )
			.id( chart.id() )

		var focalSelection = selection.select('.iobio-bar-0').datum( selection.datum() )
		focalBar(focalSelection, options);

		// Call little bar chart
		var globalBar = bar()
			.xValue( chart.xValue() )
			.yValue( chart.yValue() )
			.wValue( chart.wValue() )
			.xAxis( chart.xAxis() )
			.yAxis( null )
			.margin( chart.margin() )
			.width( chart.width() )
			.id( chart.id() )
			.height( origHeight * (1-sizeRatio) )
			.brush('brush', function() {
				var x2 = globalBar.x(), brush = globalBar.brush();
	        	var x = brush.empty() ? x2.domain() : brush.extent();
	        	var datum = globalSelection.datum().filter(function(d) {
	        		return (globalBar.xValue()(d) >= x[0] && globalBar.xValue()(d) <= x[1])
	        	});
	        	options.xMin = x[0];
	        	options.xMax = x[1];
	        	options.globalBar = globalBar;
	           	focalBar( focalSelection.datum(datum), options );
			});

		var globalSelection = selection.select('.iobio-bar-1').datum( selection.datum() )
		globalBar(globalSelection, options);

		// // Add title on hover
	 //    if (tooltip) {
	 //    	var tt = d3.select('.iobio-tooltip')
	 //    	utils.tooltipHelper(g.selectAll('.rect'), tt, tooltip);
	 //    }

	 //    // Attach events
		// events.forEach(function(ev) {
		// 	var cb = ev.listener ? function() {ev.listener.call(chart, svg)} : null;
		// 	g.selectAll('.rect').on(ev.event, cb);
		// })
		// focalBar.rebind(this);
	}

	// Rebind methods in bar chart to this chart
	baseBar.rebind(chart);

	/*
   	 * Set events on rects
   	 */
	chart.sizeRatio = function(_) {
		if (!arguments.length) return sizeRatio;
		sizeRatio = _;
		return chart;
	};

	/*
   	 * Set events on rects
   	 */
	chart.on = function(event, listener) {
		if (!arguments.length) return events;
		events.push( {'event':event, 'listener':listener})
		return chart;
	}

	/*
   	 * Set tooltip that appears when mouseover rects
   	 */
	chart.tooltip = function(_) {
		if (!arguments.length) return tooltip;
		tooltip = _;
		return chart;
	}

	return chart;
}

// Export alignment
module.exports = barViewer;
},{"../utils.js":10,"./bar.js":12,"extend":2}],14:[function(require,module,exports){
var utils = require('../utils.js'),
	extend = require('extend');

var base = function() {
    // Initialize

	// Dimensions
	var margin = {top: 0, right: 0, bottom: 0, left:0},
	    width = 800,
	  	height = 500;

	// Scales
	var x = d3.scale.linear().nice(),
	    y = d3.scale.linear().nice();

	// Axes
	var xAxis = d3.svg.axis()
			.scale(x)
			.orient("bottom")
			.tickFormat(utils.format_unit_names)
			.ticks(5),
		yAxis = d3.svg.axis()
			.scale(y)
			.orient("left")
			.ticks(5);

	// Value transformers
	var xValue = function(d) { return d[0]; },
   	 	yValue = function(d) { return d[1]; },
       	wValue = function(d) { return d[2] || 1 },
       	id = function(d) { return null; };

    // Color
    var colorScale = d3.scale.category10(),
    	color = function(d,i) { return colorScale(i); };

	// Defaults
	var events = [],
		tooltip,
		brush = d3.svg.brush(),
		preserveAspectRatio,
		transitionDuration = 400;

	// Default options
	var defaults = {};

	function chart(selection, opts) {
		var options = {};
		extend(options, defaults, opts);

      	// Get container
      	var container = d3.select( selection.node() );
      	var data = selection.datum();

      	// Select the svg element, if it exists.
		var svg = container.selectAll("svg").data([0]);
		chart.svg = svg;

   		// Otherwise, create svg.
		var gEnter = svg.enter().append("svg").append('g').attr('class', 'iobio-container');
		var g = svg.select('g');

		// Update the outer dimensions.
      	svg.attr("width", width)
        	.attr("height", height);

      	// Update the inner dimensions.
		g.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		// Get width, height in pixels (necessary to allow percentages to work)
		var boundingClientRect = svg.node().getBoundingClientRect();
		var widthPx = boundingClientRect.width;
		var heightPx = boundingClientRect.height;
		var innerHeight = heightPx - margin.top - margin.bottom;

		// Make svg resize when window resizes
		svg.attr('viewBox', '0 0 ' + widthPx + ' ' + heightPx);
		if (preserveAspectRatio) svg.attr('preserveAspectRatio', preserveAspectRatio);
		container.style('-webkit-flex', '1 1 auto')
		container.style('flex', '1 1 auto')
		container.style('-webkit-order', '1')
		container.style('order', '1')

		// Convert data to standard representation greedily;
   		// this is needed for nondeterministic accessors.
   		data = data.map(function(d, i) {return [xValue.call(data, d, i), yValue.call(data, d, i), wValue.call(data, d, i)];});

   		var xMin = (options.xMin === undefined || options.xMin === null) ? d3.min(data, function(d) { return d[0]}) : options.xMin;
   		var xMax = (options.xMax === undefined || options.xMax === null) ? d3.max(data, function(d) { return d[0]+d[2]}) : options.xMax;

		// Update x scale
		x.domain([xMin, xMax]);
		x.range([0, widthPx - margin.left - margin.right]);

		var yMin = (options.yMin === undefined || options.yMin === null) ? d3.min(data, function(d) { return d[1]}) : options.yMin;
		var yMax = (options.yMax === undefined || options.yMax === null) ? d3.max(data, function(d) { return d[1]}) : options.yMax;

		// Update y scale
		y.domain( [yMin, yMax] )
   	 	 .range([innerHeight , 0]);

   	 	// Flesh out skeletal chart
   	 	gEnter.append("g").attr("class", "iobio-x iobio-axis").attr("transform", "translate(0," + y.range()[0] + ")");
   	 	gEnter.append("g").attr("class", "iobio-y iobio-axis");
   		gEnter.append("g").attr("class", "iobio-x iobio-brush");
   		d3.select("body").append("div").attr("class", "iobio-tooltip").style("opacity", 0);

		// Update the x-axis.
		if(xAxis)
			g.select(".iobio-x.iobio-axis").transition()
				.duration(transitionDuration)
				.call(xAxis);

		// Update the y-axis.
		if(yAxis)
			g.select(".iobio-y.iobio-axis").transition()
				.duration(transitionDuration)
				.call(yAxis);

		// Add title on hover
	    if (tooltip) {
	    	var tt = d3.select('.iobio-tooltip')

	    	svg
				.on("mouseover", function(d,i) {
					var pos = {
			    		x: parseInt(x.invert(d3.event.pageX - svg.node().getBoundingClientRect().left - margin.left )),
			    		y: parseInt(y.invert(d3.event.pageY - svg.node().getBoundingClientRect().top - margin.top ))
			    	}
					var opacity = tooltip.call(chart, svg, pos) ? .9 : 0; // don't show if tooltipStr is null
					tt.transition()
						.duration(transitionDuration)
						.style("opacity", opacity);
					tt.html(tooltip.call(chart, svg, pos))
						.style("left", (d3.event.pageX) + "px")
						.style("text-align", 'left')
						.style("top", (d3.event.pageY - 24) + "px");
				})
				.on("mouseout", function(d) {
					tt.transition()
						.duration(500)
						.style("opacity", 0);
				})
		    	.on("mousemove", function() {
		    		var pos = {
			    		x: parseInt(x.invert(d3.event.pageX - svg.node().getBoundingClientRect().left - margin.left )),
			    		y: parseInt(y.invert(d3.event.pageY - svg.node().getBoundingClientRect().top - margin.top ))
			    	}
		    		var opacity = tooltip.call(chart, svg, pos) ? .9 : 0; // don't show if tooltip is null
		    		tt.style('opacity', opacity)
		            tt.html( tooltip.call(chart, svg, pos) )
		               .style("left", (d3.event.pageX) + "px")
		               .style("top", (d3.event.pageY - 24) + "px");
	          })
	    }

	    // Add brush
	    if( brush.on("brushend") || brush.on("brushstart") || brush.on("brush") ) {
	    	brush.x(x);
      		svg.select(".iobio-brush")
					.call(brush)
				.selectAll("rect")
					.attr("y", -6)
					.attr("height", innerHeight + 6);
	    }

		// Attach events
		events.forEach(function(ev) {
			var cb = ev.listener ? function() {ev.listener.call(chart, svg)} : null;
			svg.on(ev.event, cb);
		})

		return data;
	}

	// Member functions
	chart.margin = function(_) {
    	if (!arguments.length) return margin;
    	margin = _;
    	return chart;
  	};

	chart.width = function(_) {
		if (!arguments.length) return width;
		width = _;
		return chart;
	};

	chart.height = function(_) {
		if (!arguments.length) return height;
		height = _;
		return chart;
	};

	chart.x = function(_) {
		if (!arguments.length) return x;
		x = _;
		return chart;
	};

	chart.y = function(_) {
		if (!arguments.length) return y;
		y = _;
		return chart;
	};

	chart.xValue = function(_) {
		if (!arguments.length) return xValue;
		xValue = _;
		return chart;
	};

	chart.yValue = function(_) {
		if (!arguments.length) return yValue;
		yValue = _;
		return chart;
	};

	chart.wValue = function(_) {
		if (!arguments.length) return wValue;
		wValue = _;
		return chart;
	};

	chart.id = function(_) {
		if (!arguments.length) return id;
		id = _;
		return chart;
	};

	chart.xAxis = function(_) {
		if (!arguments.length) return xAxis;
		xAxis = _;
		return chart;
	};

	chart.yAxis = function(_) {
		if (!arguments.length) return yAxis;
		yAxis = _;
		return chart;
	};

	chart.preserveAspectRatio = function(_) {
		if (!arguments.length) return preserveAspectRatio;
		preserveAspectRatio = _;
		return chart;
	};

	chart.getBoundingClientRect = function(_) {
		return this.svg.node().getBoundingClientRect();
	};

	chart.transitionDuration = function(_) {
		if (!arguments.length) return transitionDuration;
		transitionDuration = _;
		return chart;
	};

	chart.color = function(_) {
		if (!arguments.length) return color;
		color = _;
		return chart;
	};

	/*
   	 * Add brush to chart
   	 */
	chart.brush = function(event, listener) {
		if (!arguments.length) return brush;
		brush.on(event, function() {
			listener.call(this, brush);
		} );
		return chart;
	}

	/*
   	 * Add events to chart
   	 */
	chart.onChart = function(event, listener) {
		if (!arguments.length) return events;
		events.push({'event': event, 'listener': listener});
		return chart;
	}

	/*
   	 * Set tooltip that appears when mouseover chart
   	 */
	chart.tooltipChart = function(_) {
		if (!arguments.length) return tooltip;
		tooltip = _;
		return chart;
	}

	// utility functions


	/*
   	 * Easy method to rebind base chart functions to the argument chart
   	 */
	chart.rebind = function(object) {
		utils.rebind(object, this, 'rebind', 'margin', 'width', 'height', 'x', 'y', 'id',
			'xValue', 'yValue', 'wValue', 'xAxis', 'yAxis', 'brush', 'onChart',
			'tooltipChart', 'preserveAspectRatio', 'getBoundingClientRect', 'transitionDuration', 'color');
	}

	return chart
}

module.exports = base;

},{"../utils.js":10,"extend":2}],15:[function(require,module,exports){
//
// consumes data in following format
// var data = [ {name: 'somename',
//              start: someInt,
//              end : someInt,
//              strand : '+',
//              features : [{start:someInt, end:someInt, feature_type:utr, strand:'+'},
//                          {start:someInt, end:someInt, feature_type:cds}, ...]
//            }, ... ]
//

var gene = function() {
    // Import base chart
    var base = require('./base.js')(),
        utils = require('../utils.js'),
        extend = require('extend');

    // Defaults
    var events = [],
        tooltip,
        trackHeight = 20,
        borderRadius = 1,
        utrHeight = undefined,
        cdsHeight = undefined,
        arrowHeight = undefined,    
        start = function(d) { return d.start; },
        end = function(d) { return d.end; },
        title = function(d) { return d.transcript_id; };

    // Default Options
    var defaults = { };

    // Modify Base Chart
    base
        .yAxis(null)
        .xValue(function(d) { return start(d); })
        .yValue(function(d,i) { return i; })
        .wValue(function(d) { return end(d) - start(d); })          

    function chart(selection, opts) {
        // Merge defaults and options
        var options = {};
        extend(options, defaults, opts);

        // Set variables if not user set
        utrHeight = utrHeight || trackHeight / 2;
        arrowHeight = arrowHeight || trackHeight / 2;
        cdsHeight = cdsHeight || trackHeight;

        // Call base chart
        base.call(this, selection, options)                    

        // Grab base functions for easy access
        var x = base.x(),
            y = base.y(),
            id = base.id();
            xValue = base.xValue(),
            yValue = base.yValue(),     
            wValue = base.wValue(),
            color = base.color(),
            transitionDuration = base.transitionDuration();            

        // Grab Container
        var g = selection.select('g.iobio-container').classed('iobio-gene', true); // grab container to draw into (created by base chart) 

        // Move Axis up
        g.select('.iobio-axis').attr('transform', 'translate(0,-25)');    


        // Draw
        // enter        
        var transcript = g.selectAll('.transcript')
                .data(selection.datum())
        // exit
        transcript.exit().remove()           
            
        // enter
        transcript.enter().append('g')
                .attr('class', 'transcript')
                .attr('id', id )
                .attr('transform', function(d,i) { return "translate(0,0)"});

        transcript.selectAll('.reference').data(function(d) { return [[start(d), end(d)]] })
            .enter().append('line')
                .attr('class', 'reference')
                .attr('x1', function(d) { return x(d[0])})
                .attr('x2', function(d) { return x(d[1])})                    
                .attr('y1', trackHeight/2)
                .attr('y2', trackHeight/2);
        
        transcript.selectAll('.name').data(function(d) { return [[start(d), title(d)]] })
            .enter().append('text')
                .attr('class', 'name')
                .attr('x', function(d) { return x(d[0])-5; })
                .attr('y', trackHeight/2)
                .attr('text-anchor', 'end')
                .attr('alignment-baseline', 'middle')
                .text( function(d) { return d[1]; } )
                .style('fill-opacity', 0)
        
        transcript.selectAll('.arrow').data(centerSpan)
            .enter().append('path')
                .attr('class', 'arrow')
                .attr('d', centerArrow);      
        
        transcript.selectAll('.feature').data(function(d) { 
            return d['features'].filter( function(d) { var ft = d.feature_type.toLowerCase(); return ft == 'utr' || ft == 'cds';}) 
        }).enter().append('g')
                .attr('class', function(d) { return d.feature_type.toLowerCase() + ' feature';})
                .style('fill', color )
                .append('rect')
                    .attr('rx', borderRadius)
                    .attr('ry', borderRadius)
                    .attr('x', function(d) { return x(d.start)})
                    .attr('width', function(d) { return x(d.end) - x(d.start)})
                    .attr('y', trackHeight /2)
                    .attr('height', 0); 

        // update 
        transcript.transition()
                .duration(700)
                .attr('transform', function(d,i) { return "translate(0," + y(i) + ")"});

        transcript.selectAll('.reference').transition()
            .duration(700)
            .attr('x1', function(d) { return x(d[0])})
            .attr('x2', function(d) { return x(d[1])});

        transcript.selectAll('.arrow').transition()
            .duration(700)
            .attr('d', centerArrow);

        transcript.selectAll('.name').transition()
            .duration(700)
            .attr('x', function(d) { return x(d[0])-5; })
            .attr('y', trackHeight/2)   
            .text( function(d) { return d[1]; } )
            .style('fill-opacity', 1);

        transcript.selectAll('.feature').select('rect').sort(function(a,b){ return parseInt(a.start) - parseInt(b.start)})
            .transition()        
                .duration(700)
                .attr('x', function(d) { return x(d.start)})
                .attr('width', function(d) { return x(d.end) - x(d.start)})
                .attr('y', function(d) { 
                    if(d.feature_type.toLowerCase() =='utr') return (trackHeight - utrHeight)/2; 
                    else return (trackHeight - cdsHeight)/2; })
                .attr('height', function(d) { 
                    if(d.feature_type.toLowerCase() =='utr') return utrHeight; 
                    else return cdsHeight; });         

        // Add tooltip on hover      
        if (tooltip) {   
            var tt = d3.select('.iobio-tooltip')    
            utils.tooltipHelper(transcript.selectAll('.utr,.cds'), tt, tooltip);
        } 

    }
    // Rebind methods in base.js to this chart
    base.rebind(chart);

    // Helper Functions

    // moves selection to front of svg
    function moveToFront(selection) {
        return selection.each(function(){
             this.parentNode.appendChild(this);
        });
    }

    // updates the hash with the center of the biggest span between features
    function centerSpan(d) {    
        var span = 0;
        var center = 0;
        var sorted = d.features
            .filter(function(f) { var ft = f.feature_type.toLowerCase(); return ft == 'utr' || ft == 'cds'})
            .sort(function(a,b) { return parseInt(a.start) - parseInt(b.start)});

        for (var i=0; i < sorted.length-1; i++) {
            var currSpan = parseInt(sorted[i+1].start) - parseInt(sorted[i].end);
            if (span < currSpan) {
                span = currSpan;
                center = parseInt(sorted[i].end) + span/2;
            }
        }      
        d.center = center;
        return [d]; 
    }

    // generates the arrow path
    function centerArrow(d) {
        var x = chart.x();
        var arrowHead = parseInt(d.strand + '5');
        var pathStr = "M ";            
        pathStr += x(d.center) + ' ' + (trackHeight - arrowHeight)/2;
        pathStr += ' L ' + parseInt(x(d.center)+arrowHead) + ' ' + trackHeight/2;
        pathStr += ' L ' + x(d.center) + ' ' + parseInt(trackHeight + arrowHeight)/2;
        return pathStr;
    }
  
    chart.trackHeight = function(_) {
        if (!arguments.length) return trackHeight;
        trackHeight = _;
        return chart;
    };

    chart.utrHeight = function(_) {
        if (!arguments.length) return utrHeight;
        utrHeight = _;
        return chart;
    };

    chart.cdsHeight = function(_) {
        if (!arguments.length) return cdsHeight;
        cdsHeight = _;
        return chart;
    };

    chart.arrowHeight = function(_) {
        if (!arguments.length) return arrowHeight;
        arrowHeight = _;
        return chart;
    };
    

    chart.start = function(_) {
        if (!arguments.length) return start;
        start = _;
        return chart;
    };

    chart.end = function(_) {
        if (!arguments.length) return end;
        end = _;
        return chart;
    };

    chart.title = function(_) {
        if (!arguments.length) return title;
        title = _;
        return chart;
    };

    chart.tooltip = function(_) {
        if (!arguments.length) return tooltip;
        tooltip = _;
        return chart;
    };

    return chart;
}

// Export alignment
module.exports = gene;
},{"../utils.js":10,"./base.js":14,"extend":2}],16:[function(require,module,exports){
var line = function(container) {
    // Import base chart
    var base = require('./base.js')(),
        utils = require('../utils.js'),
        extend = require('extend');

    // Defaults
    var numBins = 4,
        events = [],
        tooltip;

    // Default Options
    var defaults = { };

    function chart(selection, opts) {
        // Merge defaults and options
        var options = {};
        extend(options, defaults, opts);

        // Call base chart
        base.call(this, selection, options);

        // Grab base functions for easy access
        var x = base.x(),
            y = base.y(),
            id = base.id();
            xValue = base.xValue(),
            yValue = base.yValue(),
            wValue = base.wValue(),
            transitionDuration = base.transitionDuration()
            color = base.color();

        // Draw
        var lineGen = d3.svg.line()
            .interpolate("linear")
            .x(function(d,i) { return +x( xValue(d) ); })
            .y(function(d) { return +y( yValue(d) ); })

        var g = selection.select('g.iobio-container').classed('iobio-line', true); // grab container to draw into (created by base chart)

        // draw line
        var gEnter = g.selectAll('.line').data([0])
            .enter().append("path")
                .attr('class', "line")
                .attr("d", lineGen(selection.datum()) )
                .style("stroke", color)
                .style("stroke-width", "2")
                .style("fill", "none");

        var path = g.select('path.line');
        var totalLength = path.node().getTotalLength();

        // draw line from left first time
        gEnter
            .attr("stroke-dasharray", totalLength + " " + totalLength)
            .attr("stroke-dashoffset", totalLength);

        path
           .transition()
             .duration( transitionDuration )
             .attr('d', lineGen(selection.datum()) )
             .ease("linear")
             .attr("stroke-dashoffset", 0);
   }

    // Rebind methods in base.js to this chart
    base.rebind(chart);

   return chart;
}

// Export circle
module.exports = line;

},{"../utils.js":10,"./base.js":14,"extend":2}],17:[function(require,module,exports){
var multiLine = function() {
	// Import base chart
	var lineBase = require('./line.js')(),
		utils = require('../utils.js'),
		extend = require('extend');


	// Value transformers
	var nameValue = function(d) { return d[0]; },
   	 	dataValue = function(d) { return d[1]; };

   	// Axes
	var xAxis = d3.svg.axis()
			.orient("bottom")
			.tickFormat(utils.format_unit_names)
			.ticks(5);

	// Defaults
	var events = [],
	selected = 'all';

	// Default Options
	var defaults = { };

	function chart(selection, opts) {
		// Merge defaults and options
		var options = {};
		extend(options, defaults, opts);

		// Get selected button if one
		selected = options.selected || 'all';

		// Grab base line functions for easy access
        var xValue = chart.xValue(),
        	m = chart.margin(),
        	w = chart.width(),
        	h = chart.height(),
        	x = chart.x(),
        	transitionDuration = chart.transitionDuration();

		// Smoothing function
		var smooth = iobio.viz.layout.pointSmooth()
	    	.size(w)
	    	.pos(function(d) { return d.globalPos + xValue(d)})
	    	.epsilonRate(0.1);

	    // Add global positions to data
	    var curr = 0,
	    	points = [],
	    	selectedGlobalpos;

	    selection.datum().forEach(function(d,i) {
	      d.globalPos = curr;
	      var pointData = dataValue(d);
	      curr += chart.xValue()(pointData[pointData.length-1]);
	      pointData.forEach(function(p) {
	        p.globalPos = d.globalPos;
	      })

	      if (selected == 'all') {
	      	points = points.concat(pointData);
	      } else {
	      	if(selected == nameValue(d)) {
	      		points = points.concat(pointData);
	      		selectedGlobalpos = d.globalPos;
	      	}
	      }
	    })

		// Create line div to place the line chart in
		selection.selectAll('.iobio-multi-line.line-panel').data([0]).enter().append('div').attr('class', 'iobio-multi-line line-panel')
		// Call base line chart
		if (selected == 'all') { // for all
	        lineBase
	        	.yAxis(null)
	        	.xAxis(null)
	        	.call(this, selection.select('.line-panel').datum(smooth(points)), options);
	        // Remove brush for all
	        selection.select('.iobio-brush').selectAll("*").remove();
	        selection.select('.iobio-axis.iobio-x').selectAll("*").remove();
	    } else {
	    	chart.selectedGlobalpos = selectedGlobalpos
	    	lineBase
        	.yAxis(null)
        	.xAxis( xAxis.scale(x).tickFormat(function(d) {
        		return (d - chart.selectedGlobalpos);
        	}) )
        	.call(this, selection.select('.line-panel').datum(smooth(points)), options);
	    }

		// Create buttons
		selection.selectAll('.iobio-multi-line.button-panel').data([0])
			.enter().append('div')
				.attr('class', 'iobio-multi-line button-panel')
				.style('width', w - m.left - m.right)
				.append('svg')
					.style('width', '100%');

	   	var button = selection.select('.button-panel svg').selectAll('.button')
	    			 	.data( selection.datum(), function(d) { return nameValue(d); });

	    // Exit
	    button.exit().remove();

	   	// Enter
	    var buttonEnter = button.enter().append('g')
	    	.attr('class', 'button')
	    	.attr('transform', function(d) {return 'translate(' + x(d.globalPos) + ')'; })

		buttonEnter.append('rect')
			.attr('width', function(d) {
					var data = dataValue(d);
		    		var last = parseInt(xValue(data[data.length-1]))+parseInt(d.globalPos)
		    		var xpos = x( last ) - x(parseInt(d.globalPos));
		    		return  xpos + 'px'
		    })
		    .style('fill', chart.color() )
		    .style('height', '20px');

	    buttonEnter.append('text')
	    	.attr('y', 10)
    		.attr('x', function(d) {
    			var data = dataValue(d);
	    		var last = parseInt(xValue(data[data.length-1]))+parseInt(d.globalPos)
	    		var xpos = (x( last ) - x(parseInt(d.globalPos)))/2;
	    		return  xpos + 'px'
	    	})
	    	.attr('alignment-baseline', 'middle')
	    	.attr('text-anchor', 'middle')
	    	.text(function(d) { return nameValue(d); });

	    // Update
	    button.transition()
	    	.duration(transitionDuration)
	    	.attr('transform', function(d) {return 'translate(' + x(d.globalPos) + ')'; });


	    button.select('rect').transition()
	    	.duration(transitionDuration)
	    	.attr('width', function(d) {
	    		var data = dataValue(d);
	    		var last = parseInt(xValue(data[data.length-1]))+parseInt(d.globalPos)
	    		var xpos = x( last ) - x(parseInt(d.globalPos));
	    		return  xpos + 'px'
	    	});

	   	button.select('text').transition()
	   		.duration(transitionDuration)
	   		.attr('x', function(d) {
	   			var data = dataValue(d);
	    		var last = parseInt(xValue(data[data.length-1]))+parseInt(d.globalPos)
	    		var xpos = (x( last ) - x(parseInt(d.globalPos)))/2;
	    		return  xpos + 'px'
	    	});


	    // Attach events
	    var userClickCB;
		events.forEach(function(ev) {
			if(ev.event == 'click')
				userClickCB = ev.listener;
			else
				button.on(ev.event, ev.listener);
		})

		// // Add control click event to all buttons
	    button
			.on('click', function(d) {
	    		var xMin = d.globalPos;
	    		var xMax = d.globalPos + xValue(d.data[d.data.length-1]) ;
	    		chart(selection, {'xMin': xMin, 'xMax': xMax, 'selected':nameValue(d) });

	    		// Handle user event
	    		if (userClickCB) userClickCB.call(this,d);
	    	})
	    if (selected != 'all') {
	    	selection.select('.line-panel .iobio-container').append('text')
	    			.attr('id', 'back-ctrl')
	    			.attr('x', m.left + 5)
	    			.attr('y', 0)
	    			.text('< All')
	    			.on('click', function() {
	    				this.remove();
						chart(selection);
						if (userClickCB) userClickCB.call(this);
	    			})
	    }

	}

	// Rebind methods in line chart to this chart
	lineBase.rebind(chart);


	// Member functions
	chart.dataValue = function(_) {
		if (!arguments.length) return dataValue;
		dataValue = _;
		return chart;
	};

	chart.nameValue = function(_) {
		if (!arguments.length) return nameValue;
		nameValue = _;
		return chart;
	};

	chart.getSelected = function(_) {
		return selected;
	};


	/*
   	 * Set events on buttons
   	 */
	chart.on = function(event, listener) {
		if (!arguments.length) return events;
		events.push( {'event':event, 'listener':listener})
		return chart;
	}


	return chart;
}

// Export alignment
module.exports = multiLine;
},{"../utils.js":10,"./line.js":16,"extend":2}],18:[function(require,module,exports){
var pie = function() {
	// Import base chart
	var base = require('./base.js')(),
		utils = require('../utils.js'),
		extend = require('extend');

	// Initialize
	var total = 0;

	// Defaults
	var radius = 90,
		innerRadius = 0,
		arc,
		text = function(data, total) {
			var count = data[0].data;
			var percent = utils.format_percent(count/total);
			return "<div class='iobio-percent'>" + percent + "%</div><div class='iobio-count'>" + count + "</div>";
		};

	// Default Options
	var defaults = { };

	function chart(selection, opts) {
		// Merge defaults and options
		var options = {};
		extend(options, defaults, opts);

		// Update arc
		arc = d3.svg.arc()
      		.outerRadius(radius)
      		.innerRadius(innerRadius);

		// Call base chart
		base
			.width(radius*2)
			.height(radius*2)
			.xAxis(null)
			.yAxis(null);
		base.call(this, selection, options);

		// Grab base functions for easy access
		var color = base.color(),
			id = base.id(),
			transitionDuration = base.transitionDuration();

		// Get Total
		total = 0;
		selection.datum().forEach(function(d) {
			total += d.data;
		})

		// Get bounding dimenions
		var boundingCR = base.getBoundingClientRect();

		// Draw
		var g = selection.select('g.iobio-container')
			.classed('iobio-pie', true)
			.attr('transform', 'translate(' +boundingCR.width/2+','+boundingCR.height/2+')'); // grab container to draw into (created by base chart)
		var gData = g.selectAll('.arc')
				.data(selection.datum())

		// enter
		gData.enter().append("g")
			.attr('class', 'arc')
			.style('fill', color)
			.append('path')
				.attr("d", function(d) {
					// return arc(d);
					return arc({"data":0,"value":0,"startAngle":0,"endAngle":0, "padAngle":0})
				})
				.attr('id', id)
				.each(function(d) { this._current = {"data":0,"value":0,"startAngle":0,"endAngle":0, "padAngle":0}; }); // store the initial angles

       // update
       g.selectAll('.arc').select('path').transition()
         .duration( transitionDuration )
         .attrTween("d", arcTween);

       	// exit
		gData.exit().remove();

		// Add middle text
		g.selectAll('.iobio-center-text').data([0]).enter().append('foreignObject')
			.attr('x', -innerRadius)
			.attr('y', -13)
			.attr('width', innerRadius*2)
			.attr("class", "iobio-center-text")
			// .append("xhtml:div")


		g.selectAll('.iobio-center-text').html( text(selection.datum(), total) );
		// g.selectAll('.iobio-center-text').text( text(selection.datum(), total) );

		// Add title on hover
	    // if (tooltip) {
	    // 	var tt = d3.select('.iobio-tooltip')
	    // 	utils.tooltipHelper(g.selectAll('.rect'), tt, tooltip);
	    // }

	    // Attach events
		// events.forEach(function(ev) {
		// 	var cb = ev.listener ? function() {ev.listener.call(chart, svg)} : null;
		// 	g.selectAll('.rect').on(ev.event, cb);
		// })



	}
	// Rebind methods in base.js to this chart
	base.rebind(chart);

	// Store the displayed angles in _current.
	// Then, interpolate from _current to the new angles.
	// During the transition, _current is updated in-place by d3.interpolate.
	function arcTween(a) {
	  var i = d3.interpolate(this._current, a);
	  this._current = i(0);
	  return function(t) {
	    return arc(i(t));
	  };
	}


   	chart.radius = function(_) {
		if (!arguments.length) return radius;
		radius = _;
		return chart;
	};

	chart.innerRadius = function(_) {
		if (!arguments.length) return innerRadius;
		innerRadius = _;
		return chart;
	};


	chart.text = function(_) {
		if (!arguments.length) return text;
		text = _;
		return text;
	}

	/*
   	 * Set tooltip that appears when mouseover rects
   	 */
	chart.tooltip = function(_) {
		if (!arguments.length) return tooltip;
			tooltip = _;
			return chart;
	}

	return chart;
}

// Export alignment
module.exports = pie;
},{"../utils.js":10,"./base.js":14,"extend":2}],19:[function(require,module,exports){
var referenceGraph = function() {
	var graph = require('../layout/graph.js')();
	var diagonal = d3.svg.diagonal()
    	.projection(function(d) { return [d.y, d.x]; });
    var utils = require('../utils.js'),
    	extend = require('extend');

	// Import base chart
	var base = require('./base.js')();

	// Defaults
	var elemHeight = 10,
		orientation = 'down',
		levelHeight = 50,
		events = [],
		tooltip,
		variant = iobio.viz.svg.variant();

    // Default Options
    var defaults = { };

	// Remove y axis
	base.yAxis(null);

	function chart(selection, opts) {
		// Merge defaults and options
		var options = {};
		extend(options, defaults, opts);

		// Call base chart
		base.call(this, selection, options);

		// Grab base functions for easy access
		var x = base.x(),
			y = base.y().domain([-1,1]),
			id = base.id(),
			xValue = base.xValue(),
			yValue = base.yValue(),
			wValue = base.wValue();

		// Set variant accessors
		variant
			.xValue(function(d) { return x(+xValue(d)); })
			.wValue(function(d) { return x(xValue(d)+wValue(d)) - x(+xValue(d)); })
			.yValue(function(d) { return yValue(d)>0 ? y(0)+elemHeight : y(0); })
			.hValue(function(d) { return levelHeight * yValue(d); });

		// Draw nodes
		var g = selection.select('g.iobio-container').classed('iobio-referenceGraph', true);; // grab container to draw into (created by base chart)
		var gEnter = g.selectAll('g.node')
				.data(selection.datum(), function(d) { return d.id ; })
			.enter().append('svg:g')
				.attr('class', 'node')

		// Draw line
		selection.selectAll('g.node')
			.filter(function(d){ return yValue(d) == 0 })
			.append("svg:rect")
				.attr('id', function(d) { return id(d)})
				.attr('x', function(d) { return x(+xValue(d)); })
				.attr('y', function(d) { return y(+yValue(d)); })
				.attr('width', function(d) { return x(xValue(d)+wValue(d)) - x(+xValue(d));})
				.attr('height', function(d) { return elemHeight })
				.attr('class', function(d) {
					var step = +yValue(d);
					if (step == 0) return 'reference';
					else  if (step > 0) return 'below-variant';
					else return 'above-variant';
				});

		// Draw Variants
		selection.selectAll('g.node')
			.filter(function(d){ return yValue(d) != 0 })
			.append("svg:path")
				.attr('id', function(d) { return id(d)})
				.attr('d', variant)
				.attr('class', function(d) {
					var step = +yValue(d);
					if (step == 0) return 'reference';
					else  if (step > 0) return 'below-variant';
					else return 'above-variant';
				});

		// Add title on hover
	    if (tooltip) {
	    	var tt = d3.select('.iobio-tooltip')
	    	utils.tooltipHelper(g.selectAll('.node'), tt, tooltip);
	    }

	    // Add events
		if (events.length > 0) {
			var rect = g.selectAll('.node');
			events.forEach(function(event) {
				rect.on(event.type, event.action)
			})
		}
	}
	// Rebind methods in 2d.js to this chart
	base.rebind(chart);

	/*
   	 * Set events on variants
   	 */
	chart.on = function(type, action) {
		events.push( {'type':type, 'action':action})
		return chart;
	}

	/*
   	 * Set height of variant levels
   	 */
	chart.levelHeight = function(_) {
		if (!arguments.length) return levelHeight;
		levelHeight = _;
		return chart;
	}

	/*
   	 * Set drawing function for variants. Function must have the following
   	 * accessor functions:
   	 * xValue, yValue, wValue, hValue
   	 */
	chart.variant = function(_) {
		if (!arguments.length) return variant;
		variant = _;
		return chart;
	}

	/*
   	 * Set tooltip that appears when mouseover variants
   	 */
	chart.tooltip = function(_) {
		if (!arguments.length) return tooltip;
			tooltip = _;
			return chart;
	}

	return chart;
}

// Export referenceGraph
module.exports = referenceGraph;
},{"../layout/graph.js":3,"../utils.js":10,"./base.js":14,"extend":2}],20:[function(require,module,exports){

var viz = {};
// add visualizations
viz.base = require('./base.js')
viz.pie = require('./pie.js')
viz.alignment = require('./alignment.js')
viz.referenceGraph = require('./referenceGraph.js')
viz.line = require('./line.js')
viz.bar = require('./bar.js')
viz.barViewer = require('./barViewer.js')
viz.gene = require('./gene.js')
viz.multiLine = require('./multiLine.js')

module.exports = viz;
},{"./alignment.js":11,"./bar.js":12,"./barViewer.js":13,"./base.js":14,"./gene.js":15,"./line.js":16,"./multiLine.js":17,"./pie.js":18,"./referenceGraph.js":19}]},{},[1])


//# sourceMappingURL=iobio.viz.js.map