(function($) {
	var MIN_INPUT_WIDTH = 10;
	var KEYS = {
		enter: 13,
		tab: 9,
		esc: 27,
		backspace: 8,
		space: 32,
		arrowUp: 38,
		arrowDown: 40,
		arrowLeft: 37,
		arrowRight: 39,
		del: 46,
		comma: 188
	};

	var proxy = function(obj) {
		var args = Array.prototype.slice.call(arguments, 1);

		$.each(args, function(i, name) {
			obj[name] = function() {
				this._element[name].apply(this._element, arguments);
			};
		});
	};
	var n = function(name) {
		var pre = name.match(/^\.|#/) || '';

		if(pre) {
			name = name.slice(1);
		}

		return pre + 'jquery-tag-' + name;
	};
	var pixels = function(elem, prop) {
		return parseInt(elem.css(prop), 10) || 0;
	};

	var Input = function(element, select, options) {
		options = $.extend({
			minimum: 2,
			tag: function(value) {
				var tag = $('<div></div>')
					.addClass(n('fixed'))
					.addClass(n('text'))
					.attr('data-value', value)
					.append($('<span></span>').text(value))
					.append($('<a href="javascript:void(0);">x</a>').addClass(n('remove')).on('click', function() {
						remove($(this).closest('div'));
					}));

				return tag;
			}
		}, options);

		element = this._element = $(element);
		this._select = select;

		var self = this;
		var input = '';
		var blurred = null;

		var adjustWidth = function(input, text) {
			var max = element.innerWidth() - pixels(element, 'padding-right') - pixels(element, 'padding-left');
			var margin = pixels(input, 'margin-right');
			var width = input.editor('width', text);

			if(width > max) {
				width = max - margin;
				console.log(width, margin, max);
			}
			if(width < MIN_INPUT_WIDTH) {
				width = MIN_INPUT_WIDTH;
			}

			input.css('width', width);
		};
		var remove = this._remove = function(tag) {
			var prevInput = tag.prev('input');
			var nextInput = tag.next('input');

			tag.remove();

			if(prevInput.length && nextInput.length) {
				var nextValue = nextInput.val();
				var prevValue = prevInput.val();

				nextInput.remove();

				prevInput
					.val(prevValue + nextValue)
					.focus()
					.editor('cursor', prevValue.length);

				adjustWidth(prevInput);
			} else if(nextInput.length) {
				nextInput.focus().editor('cursor', 0);
			}
		};
		var commit = function(input, cursor) {
			var value = select.value();

			if(!value) {
				return false;
			}

			cursor = cursor === undefined ? input.editor('cursor') : cursor;
			var text = input.val();
			var start = text.slice(0, cursor);
			var end = text.slice(cursor);

			var wordStart = start.split(/\s/).pop();
			var wordEnd = end.split(/\s/).slice(0, 1)[0];

			start = start.slice(0, start.length - wordStart.length).replace(/\s+$/, '');
			end = end.slice(wordEnd.length).replace(/^\s+/, '');

			var child = input.clone().val(end);
			var tag = options.tag(value);

			input.after(tag);
			tag.after(child);

			adjustWidth(child);

			if(start) {
				input.val(start);
				adjustWidth(input);
			} else {
				input.remove();
			}

			child.focus().editor('cursor', 0);
		};

		select.on('change', function() {
			if(blurred) {
				commit(blurred.input, blurred.cursor);
			}
		});

		element
			.on('keydown', 'input', function(e) {
				var $this = $(this);
				var keyCode = e.keyCode || e.witch;

				var value = $this.val();
				var selection = $this.editor('selection');
				var cursor = selection.start;
				var isSelected = selection.start !== selection.end;

				switch(keyCode) {
					case KEYS.tab:
					case KEYS.enter:
						commit($this);

						e.preventDefault();
						break;
					case KEYS.backspace:
						if(!cursor && !isSelected) {
							remove($this.prev(n('.fixed')));
							e.preventDefault();
						}

						break;
					case KEYS.esc:
						select.close();

						e.preventDefault();
						break;
					case KEYS.arrowUp:
						select.previous();
						
						e.preventDefault();
						break;
					case KEYS.arrowDown:
						select.next();

						e.preventDefault();
						break;
					case KEYS.arrowLeft:
						if(!cursor && !isSelected) {
							var prev = $this.prevAll('input').first();

							if(prev.length) {
								prev.focus().editor('cursor', prev.val().length + 1);
								e.preventDefault();
							}
						}

						break;
					case KEYS.arrowRight:
						if(cursor === $this.val().length && !isSelected) {
							var next = $this.nextAll('input').first();

							if(next.length) {
								next.focus().editor('cursor', 0);
								e.preventDefault();
							}
						}

						break;
					case KEYS.del:
						if(selection.end === value.length && !isSelected) {
							remove($this.next(n('.fixed')));
							e.preventDefault();
						}

						break;
				}

			})
			.on('keypress', 'input', function(e) {
				var $this = $(this);
				var value = $this.val();
				
				adjustWidth($this, value + String.fromCharCode(e.which || e.charCode));
			})
			.on('keyup', 'input', function() {
				var $this = $(this);
				var value = $this.editor('word');

				if(value !== input) {
					if(value.length >= options.minimum) {
						select.show(self._element, value);
					} else {
						select.close();
					}
				}

				input = value;
				adjustWidth($this);
			})
			.on('focus', 'input', function() {
				input = '';
				blurred = null;
			})
			.on('blur', 'input', function(e) {
				var $this = $(this);

				blurred = {
					input: $this,
					cursor: $this.editor('cursor')
				};

				setTimeout(function() {
					select.close();
				}, 100);
			})
			.on('click', n('.fixed'), function() {
				$(this).nextAll('input').first().focus().editor('cursor', 0);
				return false;
			})
			.on('click', function(e) {
				var target = $(e.target);

				if(target.is(element)) {
					self.focus();
					return false;
				}
			});

		element
			.addClass(n('input'))
			.append('<div style="clear:both;"></div>')
			.find('input')
			.addClass(n('text'))
			.addClass(n('field'))
			.attr('autocomplete', 'off')
			.each(function() {
				adjustWidth($(this));
			});
	};
	Input.prototype.value = function() {
		return this._element
			.children()
			.map(function() {
				var $this = $(this);
				return $this.val() || $this.data('val');
			})
			.get()
			.join();
	};
	Input.prototype.focus = function() {
		var input = this._element.find('input').last();
		var value = input.val();

		input.focus().editor('cursor', value.length);
	};
	Input.prototype.remove = function(index) {
		if(typeof index === 'number') {
			index = this._element.find(n('.tag')).get(index);
		}
		if(index === undefined) {
			return;
		}

		this._remove($(index));
	};

	proxy(Input.prototype, 'on', 'off', 'one');

	var Select = function(element, options) {
		element = this._element = $(element);
		this._options = $.extend({
			delay: 300
		}, options);

		var self = this;

		element
			.on('click', n('.option'), function() {
				element.trigger('change');
				self.close();

				return false;
			})
			.on('mouseenter', n('.option'), function() {
				self.select(this);
			})
			.on('mouseleave', n('.option'), function() {
				self.select();
			});
	};
	Select.build = function(obj, options) {
		options = options || {};

		var opts = obj;

		if(Object.prototype.toString.call(obj) !== '[object Array]') {
			opts = [];

			for(var name in obj) {
				if(obj.hasOwnProperty(name)) {
					opts.push({ name: name, value: obj[name] });
				}
			}
		}

		var select = $('<div></div>').addClass(n('select'));

		for(var i = 0; i < opts.length; i++) {
			var item = opts[i];

			if(typeof item === 'string') {
				item = { name: item, value: item };
			}

			var opt = $('<div></div>')
				.addClass(n('option'))
				.attr('data-value', item.value)
				.text(item.name);

			select.append(opt);
		}

		select.appendTo(options.appendTo);

		return new Select(select, options);
	};
	Select.prototype.value = function() {
		var i = this.current();
		return i >= 0 ? $(this.options(true).get(i)).data('value') : undefined;
	};
	Select.prototype.show = function(options, str) {
		this.match(str);

		if(this.options(true).length) {
			this.open(options);
			this.select(0);
		} else {
			this.close();
		}
	};
	Select.prototype.open = function(options) {
		if((typeof options.top !== 'number') || (typeof options.left !== 'number')) {
			var elem = $(options);

			var position = elem.position();
			var height = elem.outerHeight();

			options = {
				top: position.top + height,
				left: position.left
			};
		}

		clearTimeout(this._onshow);

		var self = this;

		this._onshow = setTimeout(function() {
			self._element.show().css(options);
		}, this._options.delay);
	};
	Select.prototype.close = function() {
		clearTimeout(this._onshow);

		this.clear();
		this._element.hide();
	};
	Select.prototype.filter = function(fn) {
		return this.options().each(function() {
			var $this = $(this);

			if(fn($this)) {
				$this.removeClass('concealed');
			} else {
				$this.addClass('concealed');
			}
		});
	};
	Select.prototype.match = function(str) {
		this.filter(function(option) {
			if(!str) {
				return false;
			}

			str = str.toLowerCase();

			return option.data('value').toLowerCase().indexOf(str) >= 0 || 
				option.text().toLowerCase().indexOf(str) >= 0;
		});
	};
	Select.prototype.clear = function() {
		this.filter(function() { return true; }).removeClass('active');
	};
	Select.prototype.options = function(concealed) {
		var options = this._element.find(n('.option'));

		if(concealed) {
			return options.not('.concealed');
		}

		return options;
	};
	Select.prototype.select = function(index) {
		var options = this.options().removeClass('active').not('.concealed');

		if(index === undefined || !options.length) {
			return;
		}

		if(typeof index === 'number') {
			index = options.get((index + options.length) % options.length);
		}

		$(index).addClass('active');
	};
	Select.prototype.current = function() {
		var active = this._element.find(n('.option.active'));
		return active.length ? this.options(true).index(active) : -1;
	};
	Select.prototype.next = function() {
		this.select(this.current() + 1);
	};
	Select.prototype.previous = function() {
		this.select(this.current() - 1);
	};

	proxy(Select.prototype, 'on', 'off', 'one');

	$.fn.tag = function(select, options) {
		if(typeof select === 'string') {
			var input = this.data('tag-input');

			if(input) {
				var args = Array.prototype.slice.call(arguments, 1);
				return input[select].apply(input, args);
			}
		}

		return this.each(function() {
			var $this = $(this);
			var input = $this.data('tag-input');

			if(input) {
				return;
			}

			if(select instanceof HTMLElement || select instanceof jQuery || typeof select === 'string') {
				select = new Select(select, options);
			} else if(select instanceof Select) {
				// Nothing
			} else {
				select = Select.build(select, $.extend({ appendTo: $this }, options));
			}

			input = new Input($this, select, options);
			$this.data('tag-input', input);
		});
	};
}(jQuery));
