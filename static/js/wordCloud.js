(function( $ ) {
"use strict";
$.fn.jQCloud = function(word_array, options) {
  // Reference to the container element
  var $this = this;
  // Namespace word ids to avoid collisions between multiple clouds
  var cloud_namespace = $this.attr('id') || Math.floor((Math.random()*1000000)).toString(36);
  // Default options value
  var default_options = {
	width: $this.width(),
	height: $this.height(),
	center: {
	  x: ((options && options.width) ? options.width : $this.width()) / 2.0,
	  y: ((options && options.height) ? options.height : $this.height()) / 2.0
	},
	delayedMode: word_array.length > 1,
	shape: true, // It defaults to elliptic shape
	encodeURI: true,
	removeOverflowing: false
  };

  options = $.extend(default_options, options || {});

  // Add the "jqcloud" class to the container for easy CSS styling, set container width/height
  $this.addClass("jqcloud").width(options.width).height(options.height);

  // Container's CSS position cannot be 'static'
  if ($this.css("position") === "static") {
	$this.css("position", "relative");
  }

  var drawWordCloud = function() {
	// Helper function to test if an element overlaps others
	var hitTest = function(elem, other_elems) {
	  // Pairwise overlap detection
	  var overlapping = function(a, b) {
		if (Math.abs(2.0*a.offsetLeft + a.offsetWidth - 2.0*b.offsetLeft - b.offsetWidth) < a.offsetWidth + b.offsetWidth) {
		  if (Math.abs(2.0*a.offsetTop + a.offsetHeight - 2.0*b.offsetTop - b.offsetHeight) < a.offsetHeight + b.offsetHeight) {
			return true;
		  }
		}
		return false;
	  };
	  var i = 0;
	  // Check elements for overlap one by one, stop and return false as soon as an overlap is found
	  for(i = 0; i < other_elems.length; i++) {
		if (overlapping(elem, other_elems[i])) {
		  return true;
		}
	  }
	  return false;
	};

	// Make sure every weight is a number before sorting
	for (var i = 0; i < word_array.length; i++) {
	  word_array[i].weight = parseFloat(word_array[i].weight, 10);
	}

	// Sort word_array from the word with the highest weight to the one with the lowest
	word_array.sort(function(a, b) { if (a.weight < b.weight) {return 1;} else if (a.weight > b.weight) {return -1;} else {return 0;} });

	var step = (options.shape === "rectangular") ? 18.0 : 2.0,
		already_placed_words = [],
		aspect_ratio = options.width / options.height;


    function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
	// Function to draw a word, by moving it in spiral until it finds a suitable empty place. This will be iterated on each word.
	var drawOneWord = function(index, word) {
	  // Define the ID attribute of the span that will wrap the word, and the associated jQuery selector string
	  var word_id = cloud_namespace + "_word_" + index,
		  word_selector = "#" + word_id,
		  angle = 6.28,
		  radius = 0.0,

		  // Only used if option.shape == 'rectangular'
		  steps_in_direction = 0.0,
		  quarter_turns = 0.0,

		  weight = 5,
		  custom_class = "",
		  inner_html = "",
		  word_span;

	  // Extend word html options with defaults
	  word.html = $.extend(word.html, {id: word_id});

	  // If custom class was specified, put them into a variable and remove it from html attrs, to avoid overwriting classes set by jQCloud
	  if (word.html && word.html["class"]) {
		custom_class = word.html["class"];
		delete word.html["class"];
	  }

	  // Check if min(weight) > max(weight) otherwise use default
	  if (word_array[0].weight > word_array[word_array.length - 1].weight) {
		// Linearly map the original weight to a discrete scale from 1 to 10
		weight = Math.round((word.weight - word_array[word_array.length - 1].weight) /
							(word_array[0].weight - word_array[word_array.length - 1].weight) * 9.0) + 1;
        weight = getRandomInt(1, 2);
	  }
	  word_span = $('<span>').attr(word.html).addClass('w' + word.weight + " " + custom_class);

	  // Append link if word.url attribute was set
	  if (word.link) {
		// If link is a string, then use it as the link href
		if (typeof word.link === "string") {
		  word.link = {href: word.link};
		}

		// Extend link html options with defaults
		if ( options.encodeURI ) {
		  word.link = $.extend(word.link, { href: encodeURI(word.link.href).replace(/'/g, "%27") });
		}

		inner_html = $('<a>').attr(word.link).text(word.text);
	  } else {
		inner_html = word.text;
	  }
	  word_span.append(inner_html);

	  // Bind handlers to words
	  if (!!word.handlers) {
		for (var prop in word.handlers) {
		  if (word.handlers.hasOwnProperty(prop) && typeof word.handlers[prop] === 'function') {
			$(word_span).bind(prop, word.handlers[prop]);
		  }
		}
	  }

	  $this.append(word_span);

	  var width = word_span.width(),
		  height = word_span.height(),
		  left = options.center.x - width / 2.0,
		  top = options.center.y - height / 2.0;

	  // Save a reference to the style property, for better performance
	  var word_style = word_span[0].style;
	  word_style.position = "absolute";
	  word_style.left = left + "px";
	  word_style.top = top + "px";

	  while(hitTest(word_span[0], already_placed_words)) {
		// option shape is 'rectangular' so move the word in a rectangular spiral
		if (options.shape === "rectangular") {
		  steps_in_direction++;
		  if (steps_in_direction * step > (1 + Math.floor(quarter_turns / 2.0)) * step * ((quarter_turns % 4 % 2) === 0 ? 1 : aspect_ratio)) {
			steps_in_direction = 0.0;
			quarter_turns++;
		  }
		  switch(quarter_turns % 4) {
			case 1:
			  left += step * aspect_ratio + Math.random() * 2.0;
			  break;
			case 2:
			  top -= step + Math.random() * 2.0;
			  break;
			case 3:
			  left -= step * aspect_ratio + Math.random() * 2.0;
			  break;
			case 0:
			  top += step + Math.random() * 2.0;
			  break;
		  }
		} else { // Default settings: elliptic spiral shape
		  radius += step;
		  angle += (index % 2 === 0 ? 1 : -1)*step;

		  left = options.center.x - (width / 2.0) + (radius*Math.cos(angle)) * aspect_ratio;
		  top = options.center.y + radius*Math.sin(angle) - (height / 2.0);
		}
		word_style.left = left + "px";
		word_style.top = top + "px";
	  }

	  // Don't render word if part of it would be outside the container
	  if (options.removeOverflowing && (left < 0 || top < 0 || (left + width) > options.width || (top + height) > options.height)) {
		word_span.remove()
		return;
	  }


	  already_placed_words.push(word_span[0]);

	  // Invoke callback if existing
	  if ($.isFunction(word.afterWordRender)) {
		word.afterWordRender.call(word_span);
	  }
	};

	var drawOneWordDelayed = function(index) {
	  index = index || 0;
	  if (!$this.is(':visible')) { // if not visible then do not attempt to draw
		setTimeout(function(){drawOneWordDelayed(index);},10);
		return;
	  }
	  if (index < word_array.length) {
		drawOneWord(index, word_array[index]);
		setTimeout(function(){drawOneWordDelayed(index + 1);}, 10);
	  } else {
		if ($.isFunction(options.afterCloudRender)) {
		  options.afterCloudRender.call($this);
		}
	  }
	};

	// Iterate drawOneWord on every word. The way the iteration is done depends on the drawing mode (delayedMode is true or false)
	if (options.delayedMode){
	  drawOneWordDelayed();
	}
	else {
	  $.each(word_array, drawOneWord);
	  if ($.isFunction(options.afterCloudRender)) {
		options.afterCloudRender.call($this);
	  }
	}
  };

  // Delay execution so that the browser can render the page before the computatively intensive word cloud drawing
  setTimeout(function(){drawWordCloud();}, 10);
  return $this;
};
})(jQuery);


function get_color(index){
	var colors = ["#D12013", "#C60040", "#79048D", "#441794", "#1C2E92", "#0073D0", "#298C2D", "#DC7500", "#56322", "#3D5A68"]
    colors.reverse()
    return colors[index -1]
}

var word_arrays = load_word_array();

function drawCloud(word_arrays){
    $("#word-cloud").jQCloud(word_arrays, {
      width: 800,
      height: 500,
      // shape: "rectangular",
      afterCloudRender: function() {
    	$('#word-cloud > span').on('mousedown', function(e){
    	  e.preventDefault();
          add_annotation(focused_text, e.target.innerHTML);
    	});
      }
    });
}

var annotations_list = []
function load_word_array(){
    $.ajax({
            type : 'POST',
            url : '/load_word_array'
        })
        .done(function(data) {
            drawCloud(data.response);
            word_arrays = data.response;

            words_list = []
            for (i=0; i < word_arrays.length; i++){
                annotations_list.push({"value": word_arrays[i].text, "weight":word_arrays[i].weight})
                words_list.push(word_arrays[i].text)
            }
            create_autocomplete_tag()
            $('#searchUriText').autocomplete({source: words_list, minLength: 3});
            return data.response;
        });
}
