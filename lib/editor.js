(function($) {
	var owner;

	var textSize = function(input, text) {
		var ruler = $('#jquery-ruler-element');

		if(!ruler.length) {
			ruler = $('<div id="jquery-ruler-element"><div></div></div>')
				.css({ position: 'absolute', left: -1000, top: -1000 })
				.appendTo('body');
		}

		ruler = ruler.find('div');

		if(!input.is(owner)) {
			var style = getComputedStyle(input[0]);

			$.extend(style, {
				margin: 0,
				padding: 0,
				border: 'none',
				position: 'absolute',
				whiteSpace: 'nowrap',
				width: 'auto'
			});

			ruler.css(style);
			owner = input;
		}

		text = (text || input.text() || input.val())
			.replace(/&/g, '&amp;')
			.replace(/\s/g,'&nbsp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');

		ruler.html(text);

		return {
			width: ruler.innerWidth(),
			height: ruler.innerHeight()
		};
	};

	var getComputedStyle = function(dom){
		var style;
		var returns = {};

		if(window.getComputedStyle){
			var camelize = function(a,b){
				return b.toUpperCase();
			}

			style = window.getComputedStyle(dom, null);

			for(var i=0;i<style.length;i++){
				var prop = style[i];
				var camel = prop.replace(/\-([a-z])/g, camelize);
				var val = style.getPropertyValue(prop);
				returns[camel] = val;
			}

			return returns;
		}
		if(dom.currentStyle){
			style = dom.currentStyle;

			for(var prop in style){
				returns[prop] = style[prop];
			}

			return returns;
		}

		return {};
	}

	var getCursorPosition = function(input) {
		var pos = {};

		if('selectionStart' in input) {
			pos = {
				start: input.selectionStart,
				end: input.selectionEnd
			}
		} else if('selection' in document) {
			input.focus();

			var range = document.selection.createRange();
		    var range2 = range.duplicate();

		    range2.moveToElementText(editor);
		    range2.setEndPoint('EndToEnd', range);

		    var selStart = range2.text.length - range.text.length;

		    pos = {
		    	start: selStart,
		    	end: selStart + range.text.length
		    }
		}

		return pos;
	};
	var setCursorPosition = function(input, start, end) {
		if (input.setSelectionRange) {
			input.focus();
			input.setSelectionRange(start, end);
		}
		else if (input.createTextRange) {
			var range = input.createTextRange();

			range.collapse(true);
			range.moveEnd('character', start);
			range.moveStart('character', end);
			range.select();
		}
	};

	var Editor = function(input) {
		this.input = $(input);
	};
	Editor.prototype.value = function(value) {
		return arguments.length ? this.input.val(value) : this.input.val();
	};
	Editor.prototype.width = function(text) {
		return textSize(this.input, text).width;
	};
	Editor.prototype.height = function(text) {
		return textSize(this.input, text).height;
	};
	Editor.prototype.cursor = function(position) {
		if(position !== undefined) {
			this.selection(position, position);
			return position;
		}

		return this.selection().start;
	};
	Editor.prototype.selection = function(positionStart, positionEnd) {
		if(positionStart !== undefined) {
			setCursorPosition(this.input[0], positionStart, positionEnd || positionStart);
			return { start: positionStart, end: positionEnd };
		}

		return getCursorPosition(this.input[0]);
	};
	Editor.prototype.word = function(w, pos) {
		if(typeof w === 'string') {
			var cursor = pos !== undefined ? pos : this.cursor();
			var value = this.value();

			if(cursor < 0) {
				cursor = 0;
			}
			if(cursor > value.length) {
				cursor = value.length;
			}

			var start = value.slice(0, cursor);
			var end = value.slice(cursor);

			this.value(start + w + end);

			return w;
		}

		var cursor = typeof w === 'number' ? w : this.cursor();
		var value = this.value();

		if(!value) {
			return '';
		}

		var start = value.slice(0, cursor);
		var end = value.slice(cursor);

		return start.split(/\s/).pop() + end.split(/\s/).splice(0, 1)[0];
	};

	var EmptyEditor = function() {};

	$.each(['value', 'width', 'height', 'cursor', 'selection', 'word'], function(i, name) {
		EmptyEditor.prototype[name] = function() {};
	});

	var get = function(element) {
		element = $(element);
		var editor = element.data('editor');

		if(!editor) {
			editor = new Editor(element);
			element.data('editor', editor);
		}

		return editor;
	};

	$.fn.editor = function(method) {
		if(!this.length) {
			return new EmptyEditor();
		}

		var editor = get(this[0]);

		if(method !== undefined) {
			var args = Array.prototype.slice.call(arguments, 1);
			return editor[method].apply(editor, args);
		}

		return editor;
	};
}(jQuery));
