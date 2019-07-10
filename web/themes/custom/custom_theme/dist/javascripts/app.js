'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/*!
 * Bootstrap v3.4.1 (https://getbootstrap.com/)
 * Copyright 2011-2019 Twitter, Inc.
 * Licensed under the MIT license
 */

if (typeof jQuery === 'undefined') {
  throw new Error('Bootstrap\'s JavaScript requires jQuery');
}

+function ($) {
  'use strict';

  var version = $.fn.jquery.split(' ')[0].split('.');
  if (version[0] < 2 && version[1] < 9 || version[0] == 1 && version[1] == 9 && version[2] < 1 || version[0] > 3) {
    throw new Error('Bootstrap\'s JavaScript requires jQuery version 1.9.1 or higher, but lower than version 4');
  }
}(jQuery);

/* ========================================================================
 * Bootstrap: transition.js v3.4.1
 * https://getbootstrap.com/docs/3.4/javascript/#transitions
 * ========================================================================
 * Copyright 2011-2019 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */

+function ($) {
  'use strict';

  // CSS TRANSITION SUPPORT (Shoutout: https://modernizr.com/)
  // ============================================================

  function transitionEnd() {
    var el = document.createElement('bootstrap');

    var transEndEventNames = {
      WebkitTransition: 'webkitTransitionEnd',
      MozTransition: 'transitionend',
      OTransition: 'oTransitionEnd otransitionend',
      transition: 'transitionend'
    };

    for (var name in transEndEventNames) {
      if (el.style[name] !== undefined) {
        return { end: transEndEventNames[name] };
      }
    }

    return false; // explicit for ie8 (  ._.)
  }

  // https://blog.alexmaccaw.com/css-transitions
  $.fn.emulateTransitionEnd = function (duration) {
    var called = false;
    var $el = this;
    $(this).one('bsTransitionEnd', function () {
      called = true;
    });
    var callback = function callback() {
      if (!called) $($el).trigger($.support.transition.end);
    };
    setTimeout(callback, duration);
    return this;
  };

  $(function () {
    $.support.transition = transitionEnd();

    if (!$.support.transition) return;

    $.event.special.bsTransitionEnd = {
      bindType: $.support.transition.end,
      delegateType: $.support.transition.end,
      handle: function handle(e) {
        if ($(e.target).is(this)) return e.handleObj.handler.apply(this, arguments);
      }
    };
  });
}(jQuery);

/* ========================================================================
 * Bootstrap: alert.js v3.4.1
 * https://getbootstrap.com/docs/3.4/javascript/#alerts
 * ========================================================================
 * Copyright 2011-2019 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */

+function ($) {
  'use strict';

  // ALERT CLASS DEFINITION
  // ======================

  var dismiss = '[data-dismiss="alert"]';
  var Alert = function Alert(el) {
    $(el).on('click', dismiss, this.close);
  };

  Alert.VERSION = '3.4.1';

  Alert.TRANSITION_DURATION = 150;

  Alert.prototype.close = function (e) {
    var $this = $(this);
    var selector = $this.attr('data-target');

    if (!selector) {
      selector = $this.attr('href');
      selector = selector && selector.replace(/.*(?=#[^\s]*$)/, ''); // strip for ie7
    }

    selector = selector === '#' ? [] : selector;
    var $parent = $(document).find(selector);

    if (e) e.preventDefault();

    if (!$parent.length) {
      $parent = $this.closest('.alert');
    }

    $parent.trigger(e = $.Event('close.bs.alert'));

    if (e.isDefaultPrevented()) return;

    $parent.removeClass('in');

    function removeElement() {
      // detach from parent, fire event then clean up data
      $parent.detach().trigger('closed.bs.alert').remove();
    }

    $.support.transition && $parent.hasClass('fade') ? $parent.one('bsTransitionEnd', removeElement).emulateTransitionEnd(Alert.TRANSITION_DURATION) : removeElement();
  };

  // ALERT PLUGIN DEFINITION
  // =======================

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this);
      var data = $this.data('bs.alert');

      if (!data) $this.data('bs.alert', data = new Alert(this));
      if (typeof option == 'string') data[option].call($this);
    });
  }

  var old = $.fn.alert;

  $.fn.alert = Plugin;
  $.fn.alert.Constructor = Alert;

  // ALERT NO CONFLICT
  // =================

  $.fn.alert.noConflict = function () {
    $.fn.alert = old;
    return this;
  };

  // ALERT DATA-API
  // ==============

  $(document).on('click.bs.alert.data-api', dismiss, Alert.prototype.close);
}(jQuery);

/* ========================================================================
 * Bootstrap: button.js v3.4.1
 * https://getbootstrap.com/docs/3.4/javascript/#buttons
 * ========================================================================
 * Copyright 2011-2019 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */

+function ($) {
  'use strict';

  // BUTTON PUBLIC CLASS DEFINITION
  // ==============================

  var Button = function Button(element, options) {
    this.$element = $(element);
    this.options = $.extend({}, Button.DEFAULTS, options);
    this.isLoading = false;
  };

  Button.VERSION = '3.4.1';

  Button.DEFAULTS = {
    loadingText: 'loading...'
  };

  Button.prototype.setState = function (state) {
    var d = 'disabled';
    var $el = this.$element;
    var val = $el.is('input') ? 'val' : 'html';
    var data = $el.data();

    state += 'Text';

    if (data.resetText == null) $el.data('resetText', $el[val]());

    // push to event loop to allow forms to submit
    setTimeout($.proxy(function () {
      $el[val](data[state] == null ? this.options[state] : data[state]);

      if (state == 'loadingText') {
        this.isLoading = true;
        $el.addClass(d).attr(d, d).prop(d, true);
      } else if (this.isLoading) {
        this.isLoading = false;
        $el.removeClass(d).removeAttr(d).prop(d, false);
      }
    }, this), 0);
  };

  Button.prototype.toggle = function () {
    var changed = true;
    var $parent = this.$element.closest('[data-toggle="buttons"]');

    if ($parent.length) {
      var $input = this.$element.find('input');
      if ($input.prop('type') == 'radio') {
        if ($input.prop('checked')) changed = false;
        $parent.find('.active').removeClass('active');
        this.$element.addClass('active');
      } else if ($input.prop('type') == 'checkbox') {
        if ($input.prop('checked') !== this.$element.hasClass('active')) changed = false;
        this.$element.toggleClass('active');
      }
      $input.prop('checked', this.$element.hasClass('active'));
      if (changed) $input.trigger('change');
    } else {
      this.$element.attr('aria-pressed', !this.$element.hasClass('active'));
      this.$element.toggleClass('active');
    }
  };

  // BUTTON PLUGIN DEFINITION
  // ========================

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this);
      var data = $this.data('bs.button');
      var options = (typeof option === 'undefined' ? 'undefined' : _typeof(option)) == 'object' && option;

      if (!data) $this.data('bs.button', data = new Button(this, options));

      if (option == 'toggle') data.toggle();else if (option) data.setState(option);
    });
  }

  var old = $.fn.button;

  $.fn.button = Plugin;
  $.fn.button.Constructor = Button;

  // BUTTON NO CONFLICT
  // ==================

  $.fn.button.noConflict = function () {
    $.fn.button = old;
    return this;
  };

  // BUTTON DATA-API
  // ===============

  $(document).on('click.bs.button.data-api', '[data-toggle^="button"]', function (e) {
    var $btn = $(e.target).closest('.btn');
    Plugin.call($btn, 'toggle');
    if (!$(e.target).is('input[type="radio"], input[type="checkbox"]')) {
      // Prevent double click on radios, and the double selections (so cancellation) on checkboxes
      e.preventDefault();
      // The target component still receive the focus
      if ($btn.is('input,button')) $btn.trigger('focus');else $btn.find('input:visible,button:visible').first().trigger('focus');
    }
  }).on('focus.bs.button.data-api blur.bs.button.data-api', '[data-toggle^="button"]', function (e) {
    $(e.target).closest('.btn').toggleClass('focus', /^focus(in)?$/.test(e.type));
  });
}(jQuery);

/* ========================================================================
 * Bootstrap: carousel.js v3.4.1
 * https://getbootstrap.com/docs/3.4/javascript/#carousel
 * ========================================================================
 * Copyright 2011-2019 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */

+function ($) {
  'use strict';

  // CAROUSEL CLASS DEFINITION
  // =========================

  var Carousel = function Carousel(element, options) {
    this.$element = $(element);
    this.$indicators = this.$element.find('.carousel-indicators');
    this.options = options;
    this.paused = null;
    this.sliding = null;
    this.interval = null;
    this.$active = null;
    this.$items = null;

    this.options.keyboard && this.$element.on('keydown.bs.carousel', $.proxy(this.keydown, this));

    this.options.pause == 'hover' && !('ontouchstart' in document.documentElement) && this.$element.on('mouseenter.bs.carousel', $.proxy(this.pause, this)).on('mouseleave.bs.carousel', $.proxy(this.cycle, this));
  };

  Carousel.VERSION = '3.4.1';

  Carousel.TRANSITION_DURATION = 600;

  Carousel.DEFAULTS = {
    interval: 5000,
    pause: 'hover',
    wrap: true,
    keyboard: true
  };

  Carousel.prototype.keydown = function (e) {
    if (/input|textarea/i.test(e.target.tagName)) return;
    switch (e.which) {
      case 37:
        this.prev();break;
      case 39:
        this.next();break;
      default:
        return;
    }

    e.preventDefault();
  };

  Carousel.prototype.cycle = function (e) {
    e || (this.paused = false);

    this.interval && clearInterval(this.interval);

    this.options.interval && !this.paused && (this.interval = setInterval($.proxy(this.next, this), this.options.interval));

    return this;
  };

  Carousel.prototype.getItemIndex = function (item) {
    this.$items = item.parent().children('.item');
    return this.$items.index(item || this.$active);
  };

  Carousel.prototype.getItemForDirection = function (direction, active) {
    var activeIndex = this.getItemIndex(active);
    var willWrap = direction == 'prev' && activeIndex === 0 || direction == 'next' && activeIndex == this.$items.length - 1;
    if (willWrap && !this.options.wrap) return active;
    var delta = direction == 'prev' ? -1 : 1;
    var itemIndex = (activeIndex + delta) % this.$items.length;
    return this.$items.eq(itemIndex);
  };

  Carousel.prototype.to = function (pos) {
    var that = this;
    var activeIndex = this.getItemIndex(this.$active = this.$element.find('.item.active'));

    if (pos > this.$items.length - 1 || pos < 0) return;

    if (this.sliding) return this.$element.one('slid.bs.carousel', function () {
      that.to(pos);
    }); // yes, "slid"
    if (activeIndex == pos) return this.pause().cycle();

    return this.slide(pos > activeIndex ? 'next' : 'prev', this.$items.eq(pos));
  };

  Carousel.prototype.pause = function (e) {
    e || (this.paused = true);

    if (this.$element.find('.next, .prev').length && $.support.transition) {
      this.$element.trigger($.support.transition.end);
      this.cycle(true);
    }

    this.interval = clearInterval(this.interval);

    return this;
  };

  Carousel.prototype.next = function () {
    if (this.sliding) return;
    return this.slide('next');
  };

  Carousel.prototype.prev = function () {
    if (this.sliding) return;
    return this.slide('prev');
  };

  Carousel.prototype.slide = function (type, next) {
    var $active = this.$element.find('.item.active');
    var $next = next || this.getItemForDirection(type, $active);
    var isCycling = this.interval;
    var direction = type == 'next' ? 'left' : 'right';
    var that = this;

    if ($next.hasClass('active')) return this.sliding = false;

    var relatedTarget = $next[0];
    var slideEvent = $.Event('slide.bs.carousel', {
      relatedTarget: relatedTarget,
      direction: direction
    });
    this.$element.trigger(slideEvent);
    if (slideEvent.isDefaultPrevented()) return;

    this.sliding = true;

    isCycling && this.pause();

    if (this.$indicators.length) {
      this.$indicators.find('.active').removeClass('active');
      var $nextIndicator = $(this.$indicators.children()[this.getItemIndex($next)]);
      $nextIndicator && $nextIndicator.addClass('active');
    }

    var slidEvent = $.Event('slid.bs.carousel', { relatedTarget: relatedTarget, direction: direction }); // yes, "slid"
    if ($.support.transition && this.$element.hasClass('slide')) {
      $next.addClass(type);
      if ((typeof $next === 'undefined' ? 'undefined' : _typeof($next)) === 'object' && $next.length) {
        $next[0].offsetWidth; // force reflow
      }
      $active.addClass(direction);
      $next.addClass(direction);
      $active.one('bsTransitionEnd', function () {
        $next.removeClass([type, direction].join(' ')).addClass('active');
        $active.removeClass(['active', direction].join(' '));
        that.sliding = false;
        setTimeout(function () {
          that.$element.trigger(slidEvent);
        }, 0);
      }).emulateTransitionEnd(Carousel.TRANSITION_DURATION);
    } else {
      $active.removeClass('active');
      $next.addClass('active');
      this.sliding = false;
      this.$element.trigger(slidEvent);
    }

    isCycling && this.cycle();

    return this;
  };

  // CAROUSEL PLUGIN DEFINITION
  // ==========================

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this);
      var data = $this.data('bs.carousel');
      var options = $.extend({}, Carousel.DEFAULTS, $this.data(), (typeof option === 'undefined' ? 'undefined' : _typeof(option)) == 'object' && option);
      var action = typeof option == 'string' ? option : options.slide;

      if (!data) $this.data('bs.carousel', data = new Carousel(this, options));
      if (typeof option == 'number') data.to(option);else if (action) data[action]();else if (options.interval) data.pause().cycle();
    });
  }

  var old = $.fn.carousel;

  $.fn.carousel = Plugin;
  $.fn.carousel.Constructor = Carousel;

  // CAROUSEL NO CONFLICT
  // ====================

  $.fn.carousel.noConflict = function () {
    $.fn.carousel = old;
    return this;
  };

  // CAROUSEL DATA-API
  // =================

  var clickHandler = function clickHandler(e) {
    var $this = $(this);
    var href = $this.attr('href');
    if (href) {
      href = href.replace(/.*(?=#[^\s]+$)/, ''); // strip for ie7
    }

    var target = $this.attr('data-target') || href;
    var $target = $(document).find(target);

    if (!$target.hasClass('carousel')) return;

    var options = $.extend({}, $target.data(), $this.data());
    var slideIndex = $this.attr('data-slide-to');
    if (slideIndex) options.interval = false;

    Plugin.call($target, options);

    if (slideIndex) {
      $target.data('bs.carousel').to(slideIndex);
    }

    e.preventDefault();
  };

  $(document).on('click.bs.carousel.data-api', '[data-slide]', clickHandler).on('click.bs.carousel.data-api', '[data-slide-to]', clickHandler);

  $(window).on('load', function () {
    $('[data-ride="carousel"]').each(function () {
      var $carousel = $(this);
      Plugin.call($carousel, $carousel.data());
    });
  });
}(jQuery);

/* ========================================================================
 * Bootstrap: collapse.js v3.4.1
 * https://getbootstrap.com/docs/3.4/javascript/#collapse
 * ========================================================================
 * Copyright 2011-2019 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */

/* jshint latedef: false */

+function ($) {
  'use strict';

  // COLLAPSE PUBLIC CLASS DEFINITION
  // ================================

  var Collapse = function Collapse(element, options) {
    this.$element = $(element);
    this.options = $.extend({}, Collapse.DEFAULTS, options);
    this.$trigger = $('[data-toggle="collapse"][href="#' + element.id + '"],' + '[data-toggle="collapse"][data-target="#' + element.id + '"]');
    this.transitioning = null;

    if (this.options.parent) {
      this.$parent = this.getParent();
    } else {
      this.addAriaAndCollapsedClass(this.$element, this.$trigger);
    }

    if (this.options.toggle) this.toggle();
  };

  Collapse.VERSION = '3.4.1';

  Collapse.TRANSITION_DURATION = 350;

  Collapse.DEFAULTS = {
    toggle: true
  };

  Collapse.prototype.dimension = function () {
    var hasWidth = this.$element.hasClass('width');
    return hasWidth ? 'width' : 'height';
  };

  Collapse.prototype.show = function () {
    if (this.transitioning || this.$element.hasClass('in')) return;

    var activesData;
    var actives = this.$parent && this.$parent.children('.panel').children('.in, .collapsing');

    if (actives && actives.length) {
      activesData = actives.data('bs.collapse');
      if (activesData && activesData.transitioning) return;
    }

    var startEvent = $.Event('show.bs.collapse');
    this.$element.trigger(startEvent);
    if (startEvent.isDefaultPrevented()) return;

    if (actives && actives.length) {
      Plugin.call(actives, 'hide');
      activesData || actives.data('bs.collapse', null);
    }

    var dimension = this.dimension();

    this.$element.removeClass('collapse').addClass('collapsing')[dimension](0).attr('aria-expanded', true);

    this.$trigger.removeClass('collapsed').attr('aria-expanded', true);

    this.transitioning = 1;

    var complete = function complete() {
      this.$element.removeClass('collapsing').addClass('collapse in')[dimension]('');
      this.transitioning = 0;
      this.$element.trigger('shown.bs.collapse');
    };

    if (!$.support.transition) return complete.call(this);

    var scrollSize = $.camelCase(['scroll', dimension].join('-'));

    this.$element.one('bsTransitionEnd', $.proxy(complete, this)).emulateTransitionEnd(Collapse.TRANSITION_DURATION)[dimension](this.$element[0][scrollSize]);
  };

  Collapse.prototype.hide = function () {
    if (this.transitioning || !this.$element.hasClass('in')) return;

    var startEvent = $.Event('hide.bs.collapse');
    this.$element.trigger(startEvent);
    if (startEvent.isDefaultPrevented()) return;

    var dimension = this.dimension();

    this.$element[dimension](this.$element[dimension]())[0].offsetHeight;

    this.$element.addClass('collapsing').removeClass('collapse in').attr('aria-expanded', false);

    this.$trigger.addClass('collapsed').attr('aria-expanded', false);

    this.transitioning = 1;

    var complete = function complete() {
      this.transitioning = 0;
      this.$element.removeClass('collapsing').addClass('collapse').trigger('hidden.bs.collapse');
    };

    if (!$.support.transition) return complete.call(this);

    this.$element[dimension](0).one('bsTransitionEnd', $.proxy(complete, this)).emulateTransitionEnd(Collapse.TRANSITION_DURATION);
  };

  Collapse.prototype.toggle = function () {
    this[this.$element.hasClass('in') ? 'hide' : 'show']();
  };

  Collapse.prototype.getParent = function () {
    return $(document).find(this.options.parent).find('[data-toggle="collapse"][data-parent="' + this.options.parent + '"]').each($.proxy(function (i, element) {
      var $element = $(element);
      this.addAriaAndCollapsedClass(getTargetFromTrigger($element), $element);
    }, this)).end();
  };

  Collapse.prototype.addAriaAndCollapsedClass = function ($element, $trigger) {
    var isOpen = $element.hasClass('in');

    $element.attr('aria-expanded', isOpen);
    $trigger.toggleClass('collapsed', !isOpen).attr('aria-expanded', isOpen);
  };

  function getTargetFromTrigger($trigger) {
    var href;
    var target = $trigger.attr('data-target') || (href = $trigger.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, ''); // strip for ie7

    return $(document).find(target);
  }

  // COLLAPSE PLUGIN DEFINITION
  // ==========================

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this);
      var data = $this.data('bs.collapse');
      var options = $.extend({}, Collapse.DEFAULTS, $this.data(), (typeof option === 'undefined' ? 'undefined' : _typeof(option)) == 'object' && option);

      if (!data && options.toggle && /show|hide/.test(option)) options.toggle = false;
      if (!data) $this.data('bs.collapse', data = new Collapse(this, options));
      if (typeof option == 'string') data[option]();
    });
  }

  var old = $.fn.collapse;

  $.fn.collapse = Plugin;
  $.fn.collapse.Constructor = Collapse;

  // COLLAPSE NO CONFLICT
  // ====================

  $.fn.collapse.noConflict = function () {
    $.fn.collapse = old;
    return this;
  };

  // COLLAPSE DATA-API
  // =================

  $(document).on('click.bs.collapse.data-api', '[data-toggle="collapse"]', function (e) {
    var $this = $(this);

    if (!$this.attr('data-target')) e.preventDefault();

    var $target = getTargetFromTrigger($this);
    var data = $target.data('bs.collapse');
    var option = data ? 'toggle' : $this.data();

    Plugin.call($target, option);
  });
}(jQuery);

/* ========================================================================
 * Bootstrap: dropdown.js v3.4.1
 * https://getbootstrap.com/docs/3.4/javascript/#dropdowns
 * ========================================================================
 * Copyright 2011-2019 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */

+function ($) {
  'use strict';

  // DROPDOWN CLASS DEFINITION
  // =========================

  var backdrop = '.dropdown-backdrop';
  var toggle = '[data-toggle="dropdown"]';
  var Dropdown = function Dropdown(element) {
    $(element).on('click.bs.dropdown', this.toggle);
  };

  Dropdown.VERSION = '3.4.1';

  function getParent($this) {
    var selector = $this.attr('data-target');

    if (!selector) {
      selector = $this.attr('href');
      selector = selector && /#[A-Za-z]/.test(selector) && selector.replace(/.*(?=#[^\s]*$)/, ''); // strip for ie7
    }

    var $parent = selector !== '#' ? $(document).find(selector) : null;

    return $parent && $parent.length ? $parent : $this.parent();
  }

  function clearMenus(e) {
    if (e && e.which === 3) return;
    $(backdrop).remove();
    $(toggle).each(function () {
      var $this = $(this);
      var $parent = getParent($this);
      var relatedTarget = { relatedTarget: this };

      if (!$parent.hasClass('open')) return;

      if (e && e.type == 'click' && /input|textarea/i.test(e.target.tagName) && $.contains($parent[0], e.target)) return;

      $parent.trigger(e = $.Event('hide.bs.dropdown', relatedTarget));

      if (e.isDefaultPrevented()) return;

      $this.attr('aria-expanded', 'false');
      $parent.removeClass('open').trigger($.Event('hidden.bs.dropdown', relatedTarget));
    });
  }

  Dropdown.prototype.toggle = function (e) {
    var $this = $(this);

    if ($this.is('.disabled, :disabled')) return;

    var $parent = getParent($this);
    var isActive = $parent.hasClass('open');

    clearMenus();

    if (!isActive) {
      if ('ontouchstart' in document.documentElement && !$parent.closest('.navbar-nav').length) {
        // if mobile we use a backdrop because click events don't delegate
        $(document.createElement('div')).addClass('dropdown-backdrop').insertAfter($(this)).on('click', clearMenus);
      }

      var relatedTarget = { relatedTarget: this };
      $parent.trigger(e = $.Event('show.bs.dropdown', relatedTarget));

      if (e.isDefaultPrevented()) return;

      $this.trigger('focus').attr('aria-expanded', 'true');

      $parent.toggleClass('open').trigger($.Event('shown.bs.dropdown', relatedTarget));
    }

    return false;
  };

  Dropdown.prototype.keydown = function (e) {
    if (!/(38|40|27|32)/.test(e.which) || /input|textarea/i.test(e.target.tagName)) return;

    var $this = $(this);

    e.preventDefault();
    e.stopPropagation();

    if ($this.is('.disabled, :disabled')) return;

    var $parent = getParent($this);
    var isActive = $parent.hasClass('open');

    if (!isActive && e.which != 27 || isActive && e.which == 27) {
      if (e.which == 27) $parent.find(toggle).trigger('focus');
      return $this.trigger('click');
    }

    var desc = ' li:not(.disabled):visible a';
    var $items = $parent.find('.dropdown-menu' + desc);

    if (!$items.length) return;

    var index = $items.index(e.target);

    if (e.which == 38 && index > 0) index--; // up
    if (e.which == 40 && index < $items.length - 1) index++; // down
    if (!~index) index = 0;

    $items.eq(index).trigger('focus');
  };

  // DROPDOWN PLUGIN DEFINITION
  // ==========================

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this);
      var data = $this.data('bs.dropdown');

      if (!data) $this.data('bs.dropdown', data = new Dropdown(this));
      if (typeof option == 'string') data[option].call($this);
    });
  }

  var old = $.fn.dropdown;

  $.fn.dropdown = Plugin;
  $.fn.dropdown.Constructor = Dropdown;

  // DROPDOWN NO CONFLICT
  // ====================

  $.fn.dropdown.noConflict = function () {
    $.fn.dropdown = old;
    return this;
  };

  // APPLY TO STANDARD DROPDOWN ELEMENTS
  // ===================================

  $(document).on('click.bs.dropdown.data-api', clearMenus).on('click.bs.dropdown.data-api', '.dropdown form', function (e) {
    e.stopPropagation();
  }).on('click.bs.dropdown.data-api', toggle, Dropdown.prototype.toggle).on('keydown.bs.dropdown.data-api', toggle, Dropdown.prototype.keydown).on('keydown.bs.dropdown.data-api', '.dropdown-menu', Dropdown.prototype.keydown);
}(jQuery);

/* ========================================================================
 * Bootstrap: modal.js v3.4.1
 * https://getbootstrap.com/docs/3.4/javascript/#modals
 * ========================================================================
 * Copyright 2011-2019 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */

+function ($) {
  'use strict';

  // MODAL CLASS DEFINITION
  // ======================

  var Modal = function Modal(element, options) {
    this.options = options;
    this.$body = $(document.body);
    this.$element = $(element);
    this.$dialog = this.$element.find('.modal-dialog');
    this.$backdrop = null;
    this.isShown = null;
    this.originalBodyPad = null;
    this.scrollbarWidth = 0;
    this.ignoreBackdropClick = false;
    this.fixedContent = '.navbar-fixed-top, .navbar-fixed-bottom';

    if (this.options.remote) {
      this.$element.find('.modal-content').load(this.options.remote, $.proxy(function () {
        this.$element.trigger('loaded.bs.modal');
      }, this));
    }
  };

  Modal.VERSION = '3.4.1';

  Modal.TRANSITION_DURATION = 300;
  Modal.BACKDROP_TRANSITION_DURATION = 150;

  Modal.DEFAULTS = {
    backdrop: true,
    keyboard: true,
    show: true
  };

  Modal.prototype.toggle = function (_relatedTarget) {
    return this.isShown ? this.hide() : this.show(_relatedTarget);
  };

  Modal.prototype.show = function (_relatedTarget) {
    var that = this;
    var e = $.Event('show.bs.modal', { relatedTarget: _relatedTarget });

    this.$element.trigger(e);

    if (this.isShown || e.isDefaultPrevented()) return;

    this.isShown = true;

    this.checkScrollbar();
    this.setScrollbar();
    this.$body.addClass('modal-open');

    this.escape();
    this.resize();

    this.$element.on('click.dismiss.bs.modal', '[data-dismiss="modal"]', $.proxy(this.hide, this));

    this.$dialog.on('mousedown.dismiss.bs.modal', function () {
      that.$element.one('mouseup.dismiss.bs.modal', function (e) {
        if ($(e.target).is(that.$element)) that.ignoreBackdropClick = true;
      });
    });

    this.backdrop(function () {
      var transition = $.support.transition && that.$element.hasClass('fade');

      if (!that.$element.parent().length) {
        that.$element.appendTo(that.$body); // don't move modals dom position
      }

      that.$element.show().scrollTop(0);

      that.adjustDialog();

      if (transition) {
        that.$element[0].offsetWidth; // force reflow
      }

      that.$element.addClass('in');

      that.enforceFocus();

      var e = $.Event('shown.bs.modal', { relatedTarget: _relatedTarget });

      transition ? that.$dialog // wait for modal to slide in
      .one('bsTransitionEnd', function () {
        that.$element.trigger('focus').trigger(e);
      }).emulateTransitionEnd(Modal.TRANSITION_DURATION) : that.$element.trigger('focus').trigger(e);
    });
  };

  Modal.prototype.hide = function (e) {
    if (e) e.preventDefault();

    e = $.Event('hide.bs.modal');

    this.$element.trigger(e);

    if (!this.isShown || e.isDefaultPrevented()) return;

    this.isShown = false;

    this.escape();
    this.resize();

    $(document).off('focusin.bs.modal');

    this.$element.removeClass('in').off('click.dismiss.bs.modal').off('mouseup.dismiss.bs.modal');

    this.$dialog.off('mousedown.dismiss.bs.modal');

    $.support.transition && this.$element.hasClass('fade') ? this.$element.one('bsTransitionEnd', $.proxy(this.hideModal, this)).emulateTransitionEnd(Modal.TRANSITION_DURATION) : this.hideModal();
  };

  Modal.prototype.enforceFocus = function () {
    $(document).off('focusin.bs.modal') // guard against infinite focus loop
    .on('focusin.bs.modal', $.proxy(function (e) {
      if (document !== e.target && this.$element[0] !== e.target && !this.$element.has(e.target).length) {
        this.$element.trigger('focus');
      }
    }, this));
  };

  Modal.prototype.escape = function () {
    if (this.isShown && this.options.keyboard) {
      this.$element.on('keydown.dismiss.bs.modal', $.proxy(function (e) {
        e.which == 27 && this.hide();
      }, this));
    } else if (!this.isShown) {
      this.$element.off('keydown.dismiss.bs.modal');
    }
  };

  Modal.prototype.resize = function () {
    if (this.isShown) {
      $(window).on('resize.bs.modal', $.proxy(this.handleUpdate, this));
    } else {
      $(window).off('resize.bs.modal');
    }
  };

  Modal.prototype.hideModal = function () {
    var that = this;
    this.$element.hide();
    this.backdrop(function () {
      that.$body.removeClass('modal-open');
      that.resetAdjustments();
      that.resetScrollbar();
      that.$element.trigger('hidden.bs.modal');
    });
  };

  Modal.prototype.removeBackdrop = function () {
    this.$backdrop && this.$backdrop.remove();
    this.$backdrop = null;
  };

  Modal.prototype.backdrop = function (callback) {
    var that = this;
    var animate = this.$element.hasClass('fade') ? 'fade' : '';

    if (this.isShown && this.options.backdrop) {
      var doAnimate = $.support.transition && animate;

      this.$backdrop = $(document.createElement('div')).addClass('modal-backdrop ' + animate).appendTo(this.$body);

      this.$element.on('click.dismiss.bs.modal', $.proxy(function (e) {
        if (this.ignoreBackdropClick) {
          this.ignoreBackdropClick = false;
          return;
        }
        if (e.target !== e.currentTarget) return;
        this.options.backdrop == 'static' ? this.$element[0].focus() : this.hide();
      }, this));

      if (doAnimate) this.$backdrop[0].offsetWidth; // force reflow

      this.$backdrop.addClass('in');

      if (!callback) return;

      doAnimate ? this.$backdrop.one('bsTransitionEnd', callback).emulateTransitionEnd(Modal.BACKDROP_TRANSITION_DURATION) : callback();
    } else if (!this.isShown && this.$backdrop) {
      this.$backdrop.removeClass('in');

      var callbackRemove = function callbackRemove() {
        that.removeBackdrop();
        callback && callback();
      };
      $.support.transition && this.$element.hasClass('fade') ? this.$backdrop.one('bsTransitionEnd', callbackRemove).emulateTransitionEnd(Modal.BACKDROP_TRANSITION_DURATION) : callbackRemove();
    } else if (callback) {
      callback();
    }
  };

  // these following methods are used to handle overflowing modals

  Modal.prototype.handleUpdate = function () {
    this.adjustDialog();
  };

  Modal.prototype.adjustDialog = function () {
    var modalIsOverflowing = this.$element[0].scrollHeight > document.documentElement.clientHeight;

    this.$element.css({
      paddingLeft: !this.bodyIsOverflowing && modalIsOverflowing ? this.scrollbarWidth : '',
      paddingRight: this.bodyIsOverflowing && !modalIsOverflowing ? this.scrollbarWidth : ''
    });
  };

  Modal.prototype.resetAdjustments = function () {
    this.$element.css({
      paddingLeft: '',
      paddingRight: ''
    });
  };

  Modal.prototype.checkScrollbar = function () {
    var fullWindowWidth = window.innerWidth;
    if (!fullWindowWidth) {
      // workaround for missing window.innerWidth in IE8
      var documentElementRect = document.documentElement.getBoundingClientRect();
      fullWindowWidth = documentElementRect.right - Math.abs(documentElementRect.left);
    }
    this.bodyIsOverflowing = document.body.clientWidth < fullWindowWidth;
    this.scrollbarWidth = this.measureScrollbar();
  };

  Modal.prototype.setScrollbar = function () {
    var bodyPad = parseInt(this.$body.css('padding-right') || 0, 10);
    this.originalBodyPad = document.body.style.paddingRight || '';
    var scrollbarWidth = this.scrollbarWidth;
    if (this.bodyIsOverflowing) {
      this.$body.css('padding-right', bodyPad + scrollbarWidth);
      $(this.fixedContent).each(function (index, element) {
        var actualPadding = element.style.paddingRight;
        var calculatedPadding = $(element).css('padding-right');
        $(element).data('padding-right', actualPadding).css('padding-right', parseFloat(calculatedPadding) + scrollbarWidth + 'px');
      });
    }
  };

  Modal.prototype.resetScrollbar = function () {
    this.$body.css('padding-right', this.originalBodyPad);
    $(this.fixedContent).each(function (index, element) {
      var padding = $(element).data('padding-right');
      $(element).removeData('padding-right');
      element.style.paddingRight = padding ? padding : '';
    });
  };

  Modal.prototype.measureScrollbar = function () {
    // thx walsh
    var scrollDiv = document.createElement('div');
    scrollDiv.className = 'modal-scrollbar-measure';
    this.$body.append(scrollDiv);
    var scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
    this.$body[0].removeChild(scrollDiv);
    return scrollbarWidth;
  };

  // MODAL PLUGIN DEFINITION
  // =======================

  function Plugin(option, _relatedTarget) {
    return this.each(function () {
      var $this = $(this);
      var data = $this.data('bs.modal');
      var options = $.extend({}, Modal.DEFAULTS, $this.data(), (typeof option === 'undefined' ? 'undefined' : _typeof(option)) == 'object' && option);

      if (!data) $this.data('bs.modal', data = new Modal(this, options));
      if (typeof option == 'string') data[option](_relatedTarget);else if (options.show) data.show(_relatedTarget);
    });
  }

  var old = $.fn.modal;

  $.fn.modal = Plugin;
  $.fn.modal.Constructor = Modal;

  // MODAL NO CONFLICT
  // =================

  $.fn.modal.noConflict = function () {
    $.fn.modal = old;
    return this;
  };

  // MODAL DATA-API
  // ==============

  $(document).on('click.bs.modal.data-api', '[data-toggle="modal"]', function (e) {
    var $this = $(this);
    var href = $this.attr('href');
    var target = $this.attr('data-target') || href && href.replace(/.*(?=#[^\s]+$)/, ''); // strip for ie7

    var $target = $(document).find(target);
    var option = $target.data('bs.modal') ? 'toggle' : $.extend({ remote: !/#/.test(href) && href }, $target.data(), $this.data());

    if ($this.is('a')) e.preventDefault();

    $target.one('show.bs.modal', function (showEvent) {
      if (showEvent.isDefaultPrevented()) return; // only register focus restorer if modal will actually get shown
      $target.one('hidden.bs.modal', function () {
        $this.is(':visible') && $this.trigger('focus');
      });
    });
    Plugin.call($target, option, this);
  });
}(jQuery);

/* ========================================================================
 * Bootstrap: tooltip.js v3.4.1
 * https://getbootstrap.com/docs/3.4/javascript/#tooltip
 * Inspired by the original jQuery.tipsy by Jason Frame
 * ========================================================================
 * Copyright 2011-2019 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */

+function ($) {
  'use strict';

  var DISALLOWED_ATTRIBUTES = ['sanitize', 'whiteList', 'sanitizeFn'];

  var uriAttrs = ['background', 'cite', 'href', 'itemtype', 'longdesc', 'poster', 'src', 'xlink:href'];

  var ARIA_ATTRIBUTE_PATTERN = /^aria-[\w-]*$/i;

  var DefaultWhitelist = {
    // Global attributes allowed on any supplied element below.
    '*': ['class', 'dir', 'id', 'lang', 'role', ARIA_ATTRIBUTE_PATTERN],
    a: ['target', 'href', 'title', 'rel'],
    area: [],
    b: [],
    br: [],
    col: [],
    code: [],
    div: [],
    em: [],
    hr: [],
    h1: [],
    h2: [],
    h3: [],
    h4: [],
    h5: [],
    h6: [],
    i: [],
    img: ['src', 'alt', 'title', 'width', 'height'],
    li: [],
    ol: [],
    p: [],
    pre: [],
    s: [],
    small: [],
    span: [],
    sub: [],
    sup: [],
    strong: [],
    u: [],
    ul: []

    /**
     * A pattern that recognizes a commonly useful subset of URLs that are safe.
     *
     * Shoutout to Angular 7 https://github.com/angular/angular/blob/7.2.4/packages/core/src/sanitization/url_sanitizer.ts
     */
  };var SAFE_URL_PATTERN = /^(?:(?:https?|mailto|ftp|tel|file):|[^&:/?#]*(?:[/?#]|$))/gi;

  /**
   * A pattern that matches safe data URLs. Only matches image, video and audio types.
   *
   * Shoutout to Angular 7 https://github.com/angular/angular/blob/7.2.4/packages/core/src/sanitization/url_sanitizer.ts
   */
  var DATA_URL_PATTERN = /^data:(?:image\/(?:bmp|gif|jpeg|jpg|png|tiff|webp)|video\/(?:mpeg|mp4|ogg|webm)|audio\/(?:mp3|oga|ogg|opus));base64,[a-z0-9+/]+=*$/i;

  function allowedAttribute(attr, allowedAttributeList) {
    var attrName = attr.nodeName.toLowerCase();

    if ($.inArray(attrName, allowedAttributeList) !== -1) {
      if ($.inArray(attrName, uriAttrs) !== -1) {
        return Boolean(attr.nodeValue.match(SAFE_URL_PATTERN) || attr.nodeValue.match(DATA_URL_PATTERN));
      }

      return true;
    }

    var regExp = $(allowedAttributeList).filter(function (index, value) {
      return value instanceof RegExp;
    });

    // Check if a regular expression validates the attribute.
    for (var i = 0, l = regExp.length; i < l; i++) {
      if (attrName.match(regExp[i])) {
        return true;
      }
    }

    return false;
  }

  function sanitizeHtml(unsafeHtml, whiteList, sanitizeFn) {
    if (unsafeHtml.length === 0) {
      return unsafeHtml;
    }

    if (sanitizeFn && typeof sanitizeFn === 'function') {
      return sanitizeFn(unsafeHtml);
    }

    // IE 8 and below don't support createHTMLDocument
    if (!document.implementation || !document.implementation.createHTMLDocument) {
      return unsafeHtml;
    }

    var createdDocument = document.implementation.createHTMLDocument('sanitization');
    createdDocument.body.innerHTML = unsafeHtml;

    var whitelistKeys = $.map(whiteList, function (el, i) {
      return i;
    });
    var elements = $(createdDocument.body).find('*');

    for (var i = 0, len = elements.length; i < len; i++) {
      var el = elements[i];
      var elName = el.nodeName.toLowerCase();

      if ($.inArray(elName, whitelistKeys) === -1) {
        el.parentNode.removeChild(el);

        continue;
      }

      var attributeList = $.map(el.attributes, function (el) {
        return el;
      });
      var whitelistedAttributes = [].concat(whiteList['*'] || [], whiteList[elName] || []);

      for (var j = 0, len2 = attributeList.length; j < len2; j++) {
        if (!allowedAttribute(attributeList[j], whitelistedAttributes)) {
          el.removeAttribute(attributeList[j].nodeName);
        }
      }
    }

    return createdDocument.body.innerHTML;
  }

  // TOOLTIP PUBLIC CLASS DEFINITION
  // ===============================

  var Tooltip = function Tooltip(element, options) {
    this.type = null;
    this.options = null;
    this.enabled = null;
    this.timeout = null;
    this.hoverState = null;
    this.$element = null;
    this.inState = null;

    this.init('tooltip', element, options);
  };

  Tooltip.VERSION = '3.4.1';

  Tooltip.TRANSITION_DURATION = 150;

  Tooltip.DEFAULTS = {
    animation: true,
    placement: 'top',
    selector: false,
    template: '<div class="tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',
    trigger: 'hover focus',
    title: '',
    delay: 0,
    html: false,
    container: false,
    viewport: {
      selector: 'body',
      padding: 0
    },
    sanitize: true,
    sanitizeFn: null,
    whiteList: DefaultWhitelist
  };

  Tooltip.prototype.init = function (type, element, options) {
    this.enabled = true;
    this.type = type;
    this.$element = $(element);
    this.options = this.getOptions(options);
    this.$viewport = this.options.viewport && $(document).find($.isFunction(this.options.viewport) ? this.options.viewport.call(this, this.$element) : this.options.viewport.selector || this.options.viewport);
    this.inState = { click: false, hover: false, focus: false };

    if (this.$element[0] instanceof document.constructor && !this.options.selector) {
      throw new Error('`selector` option must be specified when initializing ' + this.type + ' on the window.document object!');
    }

    var triggers = this.options.trigger.split(' ');

    for (var i = triggers.length; i--;) {
      var trigger = triggers[i];

      if (trigger == 'click') {
        this.$element.on('click.' + this.type, this.options.selector, $.proxy(this.toggle, this));
      } else if (trigger != 'manual') {
        var eventIn = trigger == 'hover' ? 'mouseenter' : 'focusin';
        var eventOut = trigger == 'hover' ? 'mouseleave' : 'focusout';

        this.$element.on(eventIn + '.' + this.type, this.options.selector, $.proxy(this.enter, this));
        this.$element.on(eventOut + '.' + this.type, this.options.selector, $.proxy(this.leave, this));
      }
    }

    this.options.selector ? this._options = $.extend({}, this.options, { trigger: 'manual', selector: '' }) : this.fixTitle();
  };

  Tooltip.prototype.getDefaults = function () {
    return Tooltip.DEFAULTS;
  };

  Tooltip.prototype.getOptions = function (options) {
    var dataAttributes = this.$element.data();

    for (var dataAttr in dataAttributes) {
      if (dataAttributes.hasOwnProperty(dataAttr) && $.inArray(dataAttr, DISALLOWED_ATTRIBUTES) !== -1) {
        delete dataAttributes[dataAttr];
      }
    }

    options = $.extend({}, this.getDefaults(), dataAttributes, options);

    if (options.delay && typeof options.delay == 'number') {
      options.delay = {
        show: options.delay,
        hide: options.delay
      };
    }

    if (options.sanitize) {
      options.template = sanitizeHtml(options.template, options.whiteList, options.sanitizeFn);
    }

    return options;
  };

  Tooltip.prototype.getDelegateOptions = function () {
    var options = {};
    var defaults = this.getDefaults();

    this._options && $.each(this._options, function (key, value) {
      if (defaults[key] != value) options[key] = value;
    });

    return options;
  };

  Tooltip.prototype.enter = function (obj) {
    var self = obj instanceof this.constructor ? obj : $(obj.currentTarget).data('bs.' + this.type);

    if (!self) {
      self = new this.constructor(obj.currentTarget, this.getDelegateOptions());
      $(obj.currentTarget).data('bs.' + this.type, self);
    }

    if (obj instanceof $.Event) {
      self.inState[obj.type == 'focusin' ? 'focus' : 'hover'] = true;
    }

    if (self.tip().hasClass('in') || self.hoverState == 'in') {
      self.hoverState = 'in';
      return;
    }

    clearTimeout(self.timeout);

    self.hoverState = 'in';

    if (!self.options.delay || !self.options.delay.show) return self.show();

    self.timeout = setTimeout(function () {
      if (self.hoverState == 'in') self.show();
    }, self.options.delay.show);
  };

  Tooltip.prototype.isInStateTrue = function () {
    for (var key in this.inState) {
      if (this.inState[key]) return true;
    }

    return false;
  };

  Tooltip.prototype.leave = function (obj) {
    var self = obj instanceof this.constructor ? obj : $(obj.currentTarget).data('bs.' + this.type);

    if (!self) {
      self = new this.constructor(obj.currentTarget, this.getDelegateOptions());
      $(obj.currentTarget).data('bs.' + this.type, self);
    }

    if (obj instanceof $.Event) {
      self.inState[obj.type == 'focusout' ? 'focus' : 'hover'] = false;
    }

    if (self.isInStateTrue()) return;

    clearTimeout(self.timeout);

    self.hoverState = 'out';

    if (!self.options.delay || !self.options.delay.hide) return self.hide();

    self.timeout = setTimeout(function () {
      if (self.hoverState == 'out') self.hide();
    }, self.options.delay.hide);
  };

  Tooltip.prototype.show = function () {
    var e = $.Event('show.bs.' + this.type);

    if (this.hasContent() && this.enabled) {
      this.$element.trigger(e);

      var inDom = $.contains(this.$element[0].ownerDocument.documentElement, this.$element[0]);
      if (e.isDefaultPrevented() || !inDom) return;
      var that = this;

      var $tip = this.tip();

      var tipId = this.getUID(this.type);

      this.setContent();
      $tip.attr('id', tipId);
      this.$element.attr('aria-describedby', tipId);

      if (this.options.animation) $tip.addClass('fade');

      var placement = typeof this.options.placement == 'function' ? this.options.placement.call(this, $tip[0], this.$element[0]) : this.options.placement;

      var autoToken = /\s?auto?\s?/i;
      var autoPlace = autoToken.test(placement);
      if (autoPlace) placement = placement.replace(autoToken, '') || 'top';

      $tip.detach().css({ top: 0, left: 0, display: 'block' }).addClass(placement).data('bs.' + this.type, this);

      this.options.container ? $tip.appendTo($(document).find(this.options.container)) : $tip.insertAfter(this.$element);
      this.$element.trigger('inserted.bs.' + this.type);

      var pos = this.getPosition();
      var actualWidth = $tip[0].offsetWidth;
      var actualHeight = $tip[0].offsetHeight;

      if (autoPlace) {
        var orgPlacement = placement;
        var viewportDim = this.getPosition(this.$viewport);

        placement = placement == 'bottom' && pos.bottom + actualHeight > viewportDim.bottom ? 'top' : placement == 'top' && pos.top - actualHeight < viewportDim.top ? 'bottom' : placement == 'right' && pos.right + actualWidth > viewportDim.width ? 'left' : placement == 'left' && pos.left - actualWidth < viewportDim.left ? 'right' : placement;

        $tip.removeClass(orgPlacement).addClass(placement);
      }

      var calculatedOffset = this.getCalculatedOffset(placement, pos, actualWidth, actualHeight);

      this.applyPlacement(calculatedOffset, placement);

      var complete = function complete() {
        var prevHoverState = that.hoverState;
        that.$element.trigger('shown.bs.' + that.type);
        that.hoverState = null;

        if (prevHoverState == 'out') that.leave(that);
      };

      $.support.transition && this.$tip.hasClass('fade') ? $tip.one('bsTransitionEnd', complete).emulateTransitionEnd(Tooltip.TRANSITION_DURATION) : complete();
    }
  };

  Tooltip.prototype.applyPlacement = function (offset, placement) {
    var $tip = this.tip();
    var width = $tip[0].offsetWidth;
    var height = $tip[0].offsetHeight;

    // manually read margins because getBoundingClientRect includes difference
    var marginTop = parseInt($tip.css('margin-top'), 10);
    var marginLeft = parseInt($tip.css('margin-left'), 10);

    // we must check for NaN for ie 8/9
    if (isNaN(marginTop)) marginTop = 0;
    if (isNaN(marginLeft)) marginLeft = 0;

    offset.top += marginTop;
    offset.left += marginLeft;

    // $.fn.offset doesn't round pixel values
    // so we use setOffset directly with our own function B-0
    $.offset.setOffset($tip[0], $.extend({
      using: function using(props) {
        $tip.css({
          top: Math.round(props.top),
          left: Math.round(props.left)
        });
      }
    }, offset), 0);

    $tip.addClass('in');

    // check to see if placing tip in new offset caused the tip to resize itself
    var actualWidth = $tip[0].offsetWidth;
    var actualHeight = $tip[0].offsetHeight;

    if (placement == 'top' && actualHeight != height) {
      offset.top = offset.top + height - actualHeight;
    }

    var delta = this.getViewportAdjustedDelta(placement, offset, actualWidth, actualHeight);

    if (delta.left) offset.left += delta.left;else offset.top += delta.top;

    var isVertical = /top|bottom/.test(placement);
    var arrowDelta = isVertical ? delta.left * 2 - width + actualWidth : delta.top * 2 - height + actualHeight;
    var arrowOffsetPosition = isVertical ? 'offsetWidth' : 'offsetHeight';

    $tip.offset(offset);
    this.replaceArrow(arrowDelta, $tip[0][arrowOffsetPosition], isVertical);
  };

  Tooltip.prototype.replaceArrow = function (delta, dimension, isVertical) {
    this.arrow().css(isVertical ? 'left' : 'top', 50 * (1 - delta / dimension) + '%').css(isVertical ? 'top' : 'left', '');
  };

  Tooltip.prototype.setContent = function () {
    var $tip = this.tip();
    var title = this.getTitle();

    if (this.options.html) {
      if (this.options.sanitize) {
        title = sanitizeHtml(title, this.options.whiteList, this.options.sanitizeFn);
      }

      $tip.find('.tooltip-inner').html(title);
    } else {
      $tip.find('.tooltip-inner').text(title);
    }

    $tip.removeClass('fade in top bottom left right');
  };

  Tooltip.prototype.hide = function (callback) {
    var that = this;
    var $tip = $(this.$tip);
    var e = $.Event('hide.bs.' + this.type);

    function complete() {
      if (that.hoverState != 'in') $tip.detach();
      if (that.$element) {
        // TODO: Check whether guarding this code with this `if` is really necessary.
        that.$element.removeAttr('aria-describedby').trigger('hidden.bs.' + that.type);
      }
      callback && callback();
    }

    this.$element.trigger(e);

    if (e.isDefaultPrevented()) return;

    $tip.removeClass('in');

    $.support.transition && $tip.hasClass('fade') ? $tip.one('bsTransitionEnd', complete).emulateTransitionEnd(Tooltip.TRANSITION_DURATION) : complete();

    this.hoverState = null;

    return this;
  };

  Tooltip.prototype.fixTitle = function () {
    var $e = this.$element;
    if ($e.attr('title') || typeof $e.attr('data-original-title') != 'string') {
      $e.attr('data-original-title', $e.attr('title') || '').attr('title', '');
    }
  };

  Tooltip.prototype.hasContent = function () {
    return this.getTitle();
  };

  Tooltip.prototype.getPosition = function ($element) {
    $element = $element || this.$element;

    var el = $element[0];
    var isBody = el.tagName == 'BODY';

    var elRect = el.getBoundingClientRect();
    if (elRect.width == null) {
      // width and height are missing in IE8, so compute them manually; see https://github.com/twbs/bootstrap/issues/14093
      elRect = $.extend({}, elRect, { width: elRect.right - elRect.left, height: elRect.bottom - elRect.top });
    }
    var isSvg = window.SVGElement && el instanceof window.SVGElement;
    // Avoid using $.offset() on SVGs since it gives incorrect results in jQuery 3.
    // See https://github.com/twbs/bootstrap/issues/20280
    var elOffset = isBody ? { top: 0, left: 0 } : isSvg ? null : $element.offset();
    var scroll = { scroll: isBody ? document.documentElement.scrollTop || document.body.scrollTop : $element.scrollTop() };
    var outerDims = isBody ? { width: $(window).width(), height: $(window).height() } : null;

    return $.extend({}, elRect, scroll, outerDims, elOffset);
  };

  Tooltip.prototype.getCalculatedOffset = function (placement, pos, actualWidth, actualHeight) {
    return placement == 'bottom' ? { top: pos.top + pos.height, left: pos.left + pos.width / 2 - actualWidth / 2 } : placement == 'top' ? { top: pos.top - actualHeight, left: pos.left + pos.width / 2 - actualWidth / 2 } : placement == 'left' ? { top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left - actualWidth } :
    /* placement == 'right' */{ top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left + pos.width };
  };

  Tooltip.prototype.getViewportAdjustedDelta = function (placement, pos, actualWidth, actualHeight) {
    var delta = { top: 0, left: 0 };
    if (!this.$viewport) return delta;

    var viewportPadding = this.options.viewport && this.options.viewport.padding || 0;
    var viewportDimensions = this.getPosition(this.$viewport);

    if (/right|left/.test(placement)) {
      var topEdgeOffset = pos.top - viewportPadding - viewportDimensions.scroll;
      var bottomEdgeOffset = pos.top + viewportPadding - viewportDimensions.scroll + actualHeight;
      if (topEdgeOffset < viewportDimensions.top) {
        // top overflow
        delta.top = viewportDimensions.top - topEdgeOffset;
      } else if (bottomEdgeOffset > viewportDimensions.top + viewportDimensions.height) {
        // bottom overflow
        delta.top = viewportDimensions.top + viewportDimensions.height - bottomEdgeOffset;
      }
    } else {
      var leftEdgeOffset = pos.left - viewportPadding;
      var rightEdgeOffset = pos.left + viewportPadding + actualWidth;
      if (leftEdgeOffset < viewportDimensions.left) {
        // left overflow
        delta.left = viewportDimensions.left - leftEdgeOffset;
      } else if (rightEdgeOffset > viewportDimensions.right) {
        // right overflow
        delta.left = viewportDimensions.left + viewportDimensions.width - rightEdgeOffset;
      }
    }

    return delta;
  };

  Tooltip.prototype.getTitle = function () {
    var title;
    var $e = this.$element;
    var o = this.options;

    title = $e.attr('data-original-title') || (typeof o.title == 'function' ? o.title.call($e[0]) : o.title);

    return title;
  };

  Tooltip.prototype.getUID = function (prefix) {
    do {
      prefix += ~~(Math.random() * 1000000);
    } while (document.getElementById(prefix));
    return prefix;
  };

  Tooltip.prototype.tip = function () {
    if (!this.$tip) {
      this.$tip = $(this.options.template);
      if (this.$tip.length != 1) {
        throw new Error(this.type + ' `template` option must consist of exactly 1 top-level element!');
      }
    }
    return this.$tip;
  };

  Tooltip.prototype.arrow = function () {
    return this.$arrow = this.$arrow || this.tip().find('.tooltip-arrow');
  };

  Tooltip.prototype.enable = function () {
    this.enabled = true;
  };

  Tooltip.prototype.disable = function () {
    this.enabled = false;
  };

  Tooltip.prototype.toggleEnabled = function () {
    this.enabled = !this.enabled;
  };

  Tooltip.prototype.toggle = function (e) {
    var self = this;
    if (e) {
      self = $(e.currentTarget).data('bs.' + this.type);
      if (!self) {
        self = new this.constructor(e.currentTarget, this.getDelegateOptions());
        $(e.currentTarget).data('bs.' + this.type, self);
      }
    }

    if (e) {
      self.inState.click = !self.inState.click;
      if (self.isInStateTrue()) self.enter(self);else self.leave(self);
    } else {
      self.tip().hasClass('in') ? self.leave(self) : self.enter(self);
    }
  };

  Tooltip.prototype.destroy = function () {
    var that = this;
    clearTimeout(this.timeout);
    this.hide(function () {
      that.$element.off('.' + that.type).removeData('bs.' + that.type);
      if (that.$tip) {
        that.$tip.detach();
      }
      that.$tip = null;
      that.$arrow = null;
      that.$viewport = null;
      that.$element = null;
    });
  };

  Tooltip.prototype.sanitizeHtml = function (unsafeHtml) {
    return sanitizeHtml(unsafeHtml, this.options.whiteList, this.options.sanitizeFn);
  };

  // TOOLTIP PLUGIN DEFINITION
  // =========================

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this);
      var data = $this.data('bs.tooltip');
      var options = (typeof option === 'undefined' ? 'undefined' : _typeof(option)) == 'object' && option;

      if (!data && /destroy|hide/.test(option)) return;
      if (!data) $this.data('bs.tooltip', data = new Tooltip(this, options));
      if (typeof option == 'string') data[option]();
    });
  }

  var old = $.fn.tooltip;

  $.fn.tooltip = Plugin;
  $.fn.tooltip.Constructor = Tooltip;

  // TOOLTIP NO CONFLICT
  // ===================

  $.fn.tooltip.noConflict = function () {
    $.fn.tooltip = old;
    return this;
  };
}(jQuery);

/* ========================================================================
 * Bootstrap: popover.js v3.4.1
 * https://getbootstrap.com/docs/3.4/javascript/#popovers
 * ========================================================================
 * Copyright 2011-2019 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */

+function ($) {
  'use strict';

  // POPOVER PUBLIC CLASS DEFINITION
  // ===============================

  var Popover = function Popover(element, options) {
    this.init('popover', element, options);
  };

  if (!$.fn.tooltip) throw new Error('Popover requires tooltip.js');

  Popover.VERSION = '3.4.1';

  Popover.DEFAULTS = $.extend({}, $.fn.tooltip.Constructor.DEFAULTS, {
    placement: 'right',
    trigger: 'click',
    content: '',
    template: '<div class="popover" role="tooltip"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>'
  });

  // NOTE: POPOVER EXTENDS tooltip.js
  // ================================

  Popover.prototype = $.extend({}, $.fn.tooltip.Constructor.prototype);

  Popover.prototype.constructor = Popover;

  Popover.prototype.getDefaults = function () {
    return Popover.DEFAULTS;
  };

  Popover.prototype.setContent = function () {
    var $tip = this.tip();
    var title = this.getTitle();
    var content = this.getContent();

    if (this.options.html) {
      var typeContent = typeof content === 'undefined' ? 'undefined' : _typeof(content);

      if (this.options.sanitize) {
        title = this.sanitizeHtml(title);

        if (typeContent === 'string') {
          content = this.sanitizeHtml(content);
        }
      }

      $tip.find('.popover-title').html(title);
      $tip.find('.popover-content').children().detach().end()[typeContent === 'string' ? 'html' : 'append'](content);
    } else {
      $tip.find('.popover-title').text(title);
      $tip.find('.popover-content').children().detach().end().text(content);
    }

    $tip.removeClass('fade top bottom left right in');

    // IE8 doesn't accept hiding via the `:empty` pseudo selector, we have to do
    // this manually by checking the contents.
    if (!$tip.find('.popover-title').html()) $tip.find('.popover-title').hide();
  };

  Popover.prototype.hasContent = function () {
    return this.getTitle() || this.getContent();
  };

  Popover.prototype.getContent = function () {
    var $e = this.$element;
    var o = this.options;

    return $e.attr('data-content') || (typeof o.content == 'function' ? o.content.call($e[0]) : o.content);
  };

  Popover.prototype.arrow = function () {
    return this.$arrow = this.$arrow || this.tip().find('.arrow');
  };

  // POPOVER PLUGIN DEFINITION
  // =========================

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this);
      var data = $this.data('bs.popover');
      var options = (typeof option === 'undefined' ? 'undefined' : _typeof(option)) == 'object' && option;

      if (!data && /destroy|hide/.test(option)) return;
      if (!data) $this.data('bs.popover', data = new Popover(this, options));
      if (typeof option == 'string') data[option]();
    });
  }

  var old = $.fn.popover;

  $.fn.popover = Plugin;
  $.fn.popover.Constructor = Popover;

  // POPOVER NO CONFLICT
  // ===================

  $.fn.popover.noConflict = function () {
    $.fn.popover = old;
    return this;
  };
}(jQuery);

/* ========================================================================
 * Bootstrap: scrollspy.js v3.4.1
 * https://getbootstrap.com/docs/3.4/javascript/#scrollspy
 * ========================================================================
 * Copyright 2011-2019 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */

+function ($) {
  'use strict';

  // SCROLLSPY CLASS DEFINITION
  // ==========================

  function ScrollSpy(element, options) {
    this.$body = $(document.body);
    this.$scrollElement = $(element).is(document.body) ? $(window) : $(element);
    this.options = $.extend({}, ScrollSpy.DEFAULTS, options);
    this.selector = (this.options.target || '') + ' .nav li > a';
    this.offsets = [];
    this.targets = [];
    this.activeTarget = null;
    this.scrollHeight = 0;

    this.$scrollElement.on('scroll.bs.scrollspy', $.proxy(this.process, this));
    this.refresh();
    this.process();
  }

  ScrollSpy.VERSION = '3.4.1';

  ScrollSpy.DEFAULTS = {
    offset: 10
  };

  ScrollSpy.prototype.getScrollHeight = function () {
    return this.$scrollElement[0].scrollHeight || Math.max(this.$body[0].scrollHeight, document.documentElement.scrollHeight);
  };

  ScrollSpy.prototype.refresh = function () {
    var that = this;
    var offsetMethod = 'offset';
    var offsetBase = 0;

    this.offsets = [];
    this.targets = [];
    this.scrollHeight = this.getScrollHeight();

    if (!$.isWindow(this.$scrollElement[0])) {
      offsetMethod = 'position';
      offsetBase = this.$scrollElement.scrollTop();
    }

    this.$body.find(this.selector).map(function () {
      var $el = $(this);
      var href = $el.data('target') || $el.attr('href');
      var $href = /^#./.test(href) && $(href);

      return $href && $href.length && $href.is(':visible') && [[$href[offsetMethod]().top + offsetBase, href]] || null;
    }).sort(function (a, b) {
      return a[0] - b[0];
    }).each(function () {
      that.offsets.push(this[0]);
      that.targets.push(this[1]);
    });
  };

  ScrollSpy.prototype.process = function () {
    var scrollTop = this.$scrollElement.scrollTop() + this.options.offset;
    var scrollHeight = this.getScrollHeight();
    var maxScroll = this.options.offset + scrollHeight - this.$scrollElement.height();
    var offsets = this.offsets;
    var targets = this.targets;
    var activeTarget = this.activeTarget;
    var i;

    if (this.scrollHeight != scrollHeight) {
      this.refresh();
    }

    if (scrollTop >= maxScroll) {
      return activeTarget != (i = targets[targets.length - 1]) && this.activate(i);
    }

    if (activeTarget && scrollTop < offsets[0]) {
      this.activeTarget = null;
      return this.clear();
    }

    for (i = offsets.length; i--;) {
      activeTarget != targets[i] && scrollTop >= offsets[i] && (offsets[i + 1] === undefined || scrollTop < offsets[i + 1]) && this.activate(targets[i]);
    }
  };

  ScrollSpy.prototype.activate = function (target) {
    this.activeTarget = target;

    this.clear();

    var selector = this.selector + '[data-target="' + target + '"],' + this.selector + '[href="' + target + '"]';

    var active = $(selector).parents('li').addClass('active');

    if (active.parent('.dropdown-menu').length) {
      active = active.closest('li.dropdown').addClass('active');
    }

    active.trigger('activate.bs.scrollspy');
  };

  ScrollSpy.prototype.clear = function () {
    $(this.selector).parentsUntil(this.options.target, '.active').removeClass('active');
  };

  // SCROLLSPY PLUGIN DEFINITION
  // ===========================

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this);
      var data = $this.data('bs.scrollspy');
      var options = (typeof option === 'undefined' ? 'undefined' : _typeof(option)) == 'object' && option;

      if (!data) $this.data('bs.scrollspy', data = new ScrollSpy(this, options));
      if (typeof option == 'string') data[option]();
    });
  }

  var old = $.fn.scrollspy;

  $.fn.scrollspy = Plugin;
  $.fn.scrollspy.Constructor = ScrollSpy;

  // SCROLLSPY NO CONFLICT
  // =====================

  $.fn.scrollspy.noConflict = function () {
    $.fn.scrollspy = old;
    return this;
  };

  // SCROLLSPY DATA-API
  // ==================

  $(window).on('load.bs.scrollspy.data-api', function () {
    $('[data-spy="scroll"]').each(function () {
      var $spy = $(this);
      Plugin.call($spy, $spy.data());
    });
  });
}(jQuery);

/* ========================================================================
 * Bootstrap: tab.js v3.4.1
 * https://getbootstrap.com/docs/3.4/javascript/#tabs
 * ========================================================================
 * Copyright 2011-2019 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */

+function ($) {
  'use strict';

  // TAB CLASS DEFINITION
  // ====================

  var Tab = function Tab(element) {
    // jscs:disable requireDollarBeforejQueryAssignment
    this.element = $(element);
    // jscs:enable requireDollarBeforejQueryAssignment
  };

  Tab.VERSION = '3.4.1';

  Tab.TRANSITION_DURATION = 150;

  Tab.prototype.show = function () {
    var $this = this.element;
    var $ul = $this.closest('ul:not(.dropdown-menu)');
    var selector = $this.data('target');

    if (!selector) {
      selector = $this.attr('href');
      selector = selector && selector.replace(/.*(?=#[^\s]*$)/, ''); // strip for ie7
    }

    if ($this.parent('li').hasClass('active')) return;

    var $previous = $ul.find('.active:last a');
    var hideEvent = $.Event('hide.bs.tab', {
      relatedTarget: $this[0]
    });
    var showEvent = $.Event('show.bs.tab', {
      relatedTarget: $previous[0]
    });

    $previous.trigger(hideEvent);
    $this.trigger(showEvent);

    if (showEvent.isDefaultPrevented() || hideEvent.isDefaultPrevented()) return;

    var $target = $(document).find(selector);

    this.activate($this.closest('li'), $ul);
    this.activate($target, $target.parent(), function () {
      $previous.trigger({
        type: 'hidden.bs.tab',
        relatedTarget: $this[0]
      });
      $this.trigger({
        type: 'shown.bs.tab',
        relatedTarget: $previous[0]
      });
    });
  };

  Tab.prototype.activate = function (element, container, callback) {
    var $active = container.find('> .active');
    var transition = callback && $.support.transition && ($active.length && $active.hasClass('fade') || !!container.find('> .fade').length);

    function next() {
      $active.removeClass('active').find('> .dropdown-menu > .active').removeClass('active').end().find('[data-toggle="tab"]').attr('aria-expanded', false);

      element.addClass('active').find('[data-toggle="tab"]').attr('aria-expanded', true);

      if (transition) {
        element[0].offsetWidth; // reflow for transition
        element.addClass('in');
      } else {
        element.removeClass('fade');
      }

      if (element.parent('.dropdown-menu').length) {
        element.closest('li.dropdown').addClass('active').end().find('[data-toggle="tab"]').attr('aria-expanded', true);
      }

      callback && callback();
    }

    $active.length && transition ? $active.one('bsTransitionEnd', next).emulateTransitionEnd(Tab.TRANSITION_DURATION) : next();

    $active.removeClass('in');
  };

  // TAB PLUGIN DEFINITION
  // =====================

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this);
      var data = $this.data('bs.tab');

      if (!data) $this.data('bs.tab', data = new Tab(this));
      if (typeof option == 'string') data[option]();
    });
  }

  var old = $.fn.tab;

  $.fn.tab = Plugin;
  $.fn.tab.Constructor = Tab;

  // TAB NO CONFLICT
  // ===============

  $.fn.tab.noConflict = function () {
    $.fn.tab = old;
    return this;
  };

  // TAB DATA-API
  // ============

  var clickHandler = function clickHandler(e) {
    e.preventDefault();
    Plugin.call($(this), 'show');
  };

  $(document).on('click.bs.tab.data-api', '[data-toggle="tab"]', clickHandler).on('click.bs.tab.data-api', '[data-toggle="pill"]', clickHandler);
}(jQuery);

/* ========================================================================
 * Bootstrap: affix.js v3.4.1
 * https://getbootstrap.com/docs/3.4/javascript/#affix
 * ========================================================================
 * Copyright 2011-2019 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */

+function ($) {
  'use strict';

  // AFFIX CLASS DEFINITION
  // ======================

  var Affix = function Affix(element, options) {
    this.options = $.extend({}, Affix.DEFAULTS, options);

    var target = this.options.target === Affix.DEFAULTS.target ? $(this.options.target) : $(document).find(this.options.target);

    this.$target = target.on('scroll.bs.affix.data-api', $.proxy(this.checkPosition, this)).on('click.bs.affix.data-api', $.proxy(this.checkPositionWithEventLoop, this));

    this.$element = $(element);
    this.affixed = null;
    this.unpin = null;
    this.pinnedOffset = null;

    this.checkPosition();
  };

  Affix.VERSION = '3.4.1';

  Affix.RESET = 'affix affix-top affix-bottom';

  Affix.DEFAULTS = {
    offset: 0,
    target: window
  };

  Affix.prototype.getState = function (scrollHeight, height, offsetTop, offsetBottom) {
    var scrollTop = this.$target.scrollTop();
    var position = this.$element.offset();
    var targetHeight = this.$target.height();

    if (offsetTop != null && this.affixed == 'top') return scrollTop < offsetTop ? 'top' : false;

    if (this.affixed == 'bottom') {
      if (offsetTop != null) return scrollTop + this.unpin <= position.top ? false : 'bottom';
      return scrollTop + targetHeight <= scrollHeight - offsetBottom ? false : 'bottom';
    }

    var initializing = this.affixed == null;
    var colliderTop = initializing ? scrollTop : position.top;
    var colliderHeight = initializing ? targetHeight : height;

    if (offsetTop != null && scrollTop <= offsetTop) return 'top';
    if (offsetBottom != null && colliderTop + colliderHeight >= scrollHeight - offsetBottom) return 'bottom';

    return false;
  };

  Affix.prototype.getPinnedOffset = function () {
    if (this.pinnedOffset) return this.pinnedOffset;
    this.$element.removeClass(Affix.RESET).addClass('affix');
    var scrollTop = this.$target.scrollTop();
    var position = this.$element.offset();
    return this.pinnedOffset = position.top - scrollTop;
  };

  Affix.prototype.checkPositionWithEventLoop = function () {
    setTimeout($.proxy(this.checkPosition, this), 1);
  };

  Affix.prototype.checkPosition = function () {
    if (!this.$element.is(':visible')) return;

    var height = this.$element.height();
    var offset = this.options.offset;
    var offsetTop = offset.top;
    var offsetBottom = offset.bottom;
    var scrollHeight = Math.max($(document).height(), $(document.body).height());

    if ((typeof offset === 'undefined' ? 'undefined' : _typeof(offset)) != 'object') offsetBottom = offsetTop = offset;
    if (typeof offsetTop == 'function') offsetTop = offset.top(this.$element);
    if (typeof offsetBottom == 'function') offsetBottom = offset.bottom(this.$element);

    var affix = this.getState(scrollHeight, height, offsetTop, offsetBottom);

    if (this.affixed != affix) {
      if (this.unpin != null) this.$element.css('top', '');

      var affixType = 'affix' + (affix ? '-' + affix : '');
      var e = $.Event(affixType + '.bs.affix');

      this.$element.trigger(e);

      if (e.isDefaultPrevented()) return;

      this.affixed = affix;
      this.unpin = affix == 'bottom' ? this.getPinnedOffset() : null;

      this.$element.removeClass(Affix.RESET).addClass(affixType).trigger(affixType.replace('affix', 'affixed') + '.bs.affix');
    }

    if (affix == 'bottom') {
      this.$element.offset({
        top: scrollHeight - height - offsetBottom
      });
    }
  };

  // AFFIX PLUGIN DEFINITION
  // =======================

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this);
      var data = $this.data('bs.affix');
      var options = (typeof option === 'undefined' ? 'undefined' : _typeof(option)) == 'object' && option;

      if (!data) $this.data('bs.affix', data = new Affix(this, options));
      if (typeof option == 'string') data[option]();
    });
  }

  var old = $.fn.affix;

  $.fn.affix = Plugin;
  $.fn.affix.Constructor = Affix;

  // AFFIX NO CONFLICT
  // =================

  $.fn.affix.noConflict = function () {
    $.fn.affix = old;
    return this;
  };

  // AFFIX DATA-API
  // ==============

  $(window).on('load', function () {
    $('[data-spy="affix"]').each(function () {
      var $spy = $(this);
      var data = $spy.data();

      data.offset = data.offset || {};

      if (data.offsetBottom != null) data.offset.bottom = data.offsetBottom;
      if (data.offsetTop != null) data.offset.top = data.offsetTop;

      Plugin.call($spy, data);
    });
  });
}(jQuery);
'use strict';

// |--------------------------------------------------------------------------
// | Flexy header
// |--------------------------------------------------------------------------
// |
// | This jQuery script is written by
// |
// | Morten Nissen
// | hjemmesidekongen.dk
// |

var flexy_header = function ($) {
    'use strict';

    var pub = {},
        $header_static = $('.flexy-header--static'),
        $header_sticky = $('.flexy-header--sticky'),
        options = {
        update_interval: 100,
        tolerance: {
            upward: 20,
            downward: 10
        },
        offset: _get_offset_from_elements_bottom($header_static),
        classes: {
            pinned: "flexy-header--pinned",
            unpinned: "flexy-header--unpinned"
        }
    },
        was_scrolled = false,
        last_distance_from_top = 0;

    /**
     * Instantiate
     */
    pub.init = function (options) {
        registerEventHandlers();
        registerBootEventHandlers();
    };

    /**
     * Register boot event handlers
     */
    function registerBootEventHandlers() {
        $header_sticky.addClass(options.classes.unpinned);

        setInterval(function () {

            if (was_scrolled) {
                document_was_scrolled();

                was_scrolled = false;
            }
        }, options.update_interval);
    }

    /**
     * Register event handlers
     */
    function registerEventHandlers() {
        $(window).scroll(function (event) {
            was_scrolled = true;
        });
    }

    /**
     * Get offset from element bottom
     */
    function _get_offset_from_elements_bottom($element) {
        var element_height = $element.outerHeight(true),
            element_offset = $element.offset().top;

        return element_height + element_offset;
    }

    /**
     * Document was scrolled
     */
    function document_was_scrolled() {
        var current_distance_from_top = $(window).scrollTop();

        // If past offset
        if (current_distance_from_top >= options.offset) {

            // Downwards scroll
            if (current_distance_from_top > last_distance_from_top) {

                // Obey the downward tolerance
                if (Math.abs(current_distance_from_top - last_distance_from_top) <= options.tolerance.downward) {
                    return;
                }

                $header_sticky.removeClass(options.classes.pinned).addClass(options.classes.unpinned);
            }

            // Upwards scroll
            else {

                    // Obey the upward tolerance
                    if (Math.abs(current_distance_from_top - last_distance_from_top) <= options.tolerance.upward) {
                        return;
                    }

                    // We are not scrolled past the document which is possible on the Mac
                    if (current_distance_from_top + $(window).height() < $(document).height()) {
                        $header_sticky.removeClass(options.classes.unpinned).addClass(options.classes.pinned);
                    }
                }
        }

        // Not past offset
        else {
                $header_sticky.removeClass(options.classes.pinned).addClass(options.classes.unpinned);
            }

        last_distance_from_top = current_distance_from_top;
    }

    return pub;
}(jQuery);
'use strict';

// |--------------------------------------------------------------------------
// | Flexy navigation
// |--------------------------------------------------------------------------
// |
// | This jQuery script is written by
// |
// | Morten Nissen
// | hjemmesidekongen.dk
// |

var flexy_navigation = function ($) {
    'use strict';

    var pub = {},
        layout_classes = {
        'navigation': '.flexy-navigation',
        'obfuscator': '.flexy-navigation__obfuscator',
        'dropdown': '.flexy-navigation__item--dropdown',
        'dropdown_megamenu': '.flexy-navigation__item__dropdown-megamenu',

        'is_upgraded': 'is-upgraded',
        'navigation_has_megamenu': 'has-megamenu',
        'dropdown_has_megamenu': 'flexy-navigation__item--dropdown-with-megamenu'
    };

    /**
     * Instantiate
     */
    pub.init = function (options) {
        registerEventHandlers();
        registerBootEventHandlers();
    };

    /**
     * Register boot event handlers
     */
    function registerBootEventHandlers() {

        // Upgrade
        upgrade();
    }

    /**
     * Register event handlers
     */
    function registerEventHandlers() {}

    /**
     * Upgrade elements.
     * Add classes to elements, based upon attached classes.
     */
    function upgrade() {
        var $navigations = $(layout_classes.navigation);

        // Navigations
        if ($navigations.length > 0) {
            $navigations.each(function (index, element) {
                var $navigation = $(this),
                    $megamenus = $navigation.find(layout_classes.dropdown_megamenu),
                    $dropdown_megamenu = $navigation.find(layout_classes.dropdown_has_megamenu);

                // Has already been upgraded
                if ($navigation.hasClass(layout_classes.is_upgraded)) {
                    return;
                }

                // Has megamenu
                if ($megamenus.length > 0) {
                    $navigation.addClass(layout_classes.navigation_has_megamenu);

                    // Run through all megamenus
                    $megamenus.each(function (index, element) {
                        var $megamenu = $(this),
                            has_obfuscator = $('html').hasClass('has-obfuscator') ? true : false;

                        $megamenu.parents(layout_classes.dropdown).addClass(layout_classes.dropdown_has_megamenu).hover(function () {

                            if (has_obfuscator) {
                                obfuscator.show();
                            }
                        }, function () {

                            if (has_obfuscator) {
                                obfuscator.hide();
                            }
                        });
                    });
                }

                // Is upgraded
                $navigation.addClass(layout_classes.is_upgraded);
            });
        }
    }

    return pub;
}(jQuery);
"use strict";

/*! sidr - v2.2.1 - 2016-02-17
 * http://www.berriart.com/sidr/
 * Copyright (c) 2013-2016 Alberto Varela; Licensed MIT */

(function () {
  'use strict';

  var babelHelpers = {};

  babelHelpers.classCallCheck = function (instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  };

  babelHelpers.createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();

  babelHelpers;

  var sidrStatus = {
    moving: false,
    opened: false
  };

  var helper = {
    // Check for valids urls
    // From : http://stackoverflow.com/questions/5717093/check-if-a-javascript-string-is-an-url

    isUrl: function isUrl(str) {
      var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|' + // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
      '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator

      if (pattern.test(str)) {
        return true;
      } else {
        return false;
      }
    },

    // Add sidr prefixes
    addPrefixes: function addPrefixes($element) {
      this.addPrefix($element, 'id');
      this.addPrefix($element, 'class');
      $element.removeAttr('style');
    },
    addPrefix: function addPrefix($element, attribute) {
      var toReplace = $element.attr(attribute);

      if (typeof toReplace === 'string' && toReplace !== '' && toReplace !== 'sidr-inner') {
        $element.attr(attribute, toReplace.replace(/([A-Za-z0-9_.\-]+)/g, 'sidr-' + attribute + '-$1'));
      }
    },

    // Check if transitions is supported
    transitions: function () {
      var body = document.body || document.documentElement,
          style = body.style,
          supported = false,
          property = 'transition';

      if (property in style) {
        supported = true;
      } else {
        (function () {
          var prefixes = ['moz', 'webkit', 'o', 'ms'],
              prefix = undefined,
              i = undefined;

          property = property.charAt(0).toUpperCase() + property.substr(1);
          supported = function () {
            for (i = 0; i < prefixes.length; i++) {
              prefix = prefixes[i];
              if (prefix + property in style) {
                return true;
              }
            }

            return false;
          }();
          property = supported ? '-' + prefix.toLowerCase() + '-' + property.toLowerCase() : null;
        })();
      }

      return {
        supported: supported,
        property: property
      };
    }()
  };

  var $$2 = jQuery;

  var bodyAnimationClass = 'sidr-animating';
  var openAction = 'open';
  var closeAction = 'close';
  var transitionEndEvent = 'webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend';
  var Menu = function () {
    function Menu(name) {
      babelHelpers.classCallCheck(this, Menu);

      this.name = name;
      this.item = $$2('#' + name);
      this.openClass = name === 'sidr' ? 'sidr-open' : 'sidr-open ' + name + '-open';
      this.menuWidth = this.item.outerWidth(true);
      this.speed = this.item.data('speed');
      this.side = this.item.data('side');
      this.displace = this.item.data('displace');
      this.timing = this.item.data('timing');
      this.method = this.item.data('method');
      this.onOpenCallback = this.item.data('onOpen');
      this.onCloseCallback = this.item.data('onClose');
      this.onOpenEndCallback = this.item.data('onOpenEnd');
      this.onCloseEndCallback = this.item.data('onCloseEnd');
      this.body = $$2(this.item.data('body'));
    }

    babelHelpers.createClass(Menu, [{
      key: 'getAnimation',
      value: function getAnimation(action, element) {
        var animation = {},
            prop = this.side;

        if (action === 'open' && element === 'body') {
          animation[prop] = this.menuWidth + 'px';
        } else if (action === 'close' && element === 'menu') {
          animation[prop] = '-' + this.menuWidth + 'px';
        } else {
          animation[prop] = 0;
        }

        return animation;
      }
    }, {
      key: 'prepareBody',
      value: function prepareBody(action) {
        var prop = action === 'open' ? 'hidden' : '';

        // Prepare page if container is body
        if (this.body.is('body')) {
          var $html = $$2('html'),
              scrollTop = $html.scrollTop();

          $html.css('overflow-x', prop).scrollTop(scrollTop);
        }
      }
    }, {
      key: 'openBody',
      value: function openBody() {
        if (this.displace) {
          var transitions = helper.transitions,
              $body = this.body;

          if (transitions.supported) {
            $body.css(transitions.property, this.side + ' ' + this.speed / 1000 + 's ' + this.timing).css(this.side, 0).css({
              width: $body.width(),
              position: 'absolute'
            });
            $body.css(this.side, this.menuWidth + 'px');
          } else {
            var bodyAnimation = this.getAnimation(openAction, 'body');

            $body.css({
              width: $body.width(),
              position: 'absolute'
            }).animate(bodyAnimation, {
              queue: false,
              duration: this.speed
            });
          }
        }
      }
    }, {
      key: 'onCloseBody',
      value: function onCloseBody() {
        var transitions = helper.transitions,
            resetStyles = {
          width: '',
          position: '',
          right: '',
          left: ''
        };

        if (transitions.supported) {
          resetStyles[transitions.property] = '';
        }

        this.body.css(resetStyles).unbind(transitionEndEvent);
      }
    }, {
      key: 'closeBody',
      value: function closeBody() {
        var _this = this;

        if (this.displace) {
          if (helper.transitions.supported) {
            this.body.css(this.side, 0).one(transitionEndEvent, function () {
              _this.onCloseBody();
            });
          } else {
            var bodyAnimation = this.getAnimation(closeAction, 'body');

            this.body.animate(bodyAnimation, {
              queue: false,
              duration: this.speed,
              complete: function complete() {
                _this.onCloseBody();
              }
            });
          }
        }
      }
    }, {
      key: 'moveBody',
      value: function moveBody(action) {
        if (action === openAction) {
          this.openBody();
        } else {
          this.closeBody();
        }
      }
    }, {
      key: 'onOpenMenu',
      value: function onOpenMenu(callback) {
        var name = this.name;

        sidrStatus.moving = false;
        sidrStatus.opened = name;

        this.item.unbind(transitionEndEvent);

        this.body.removeClass(bodyAnimationClass).addClass(this.openClass);

        this.onOpenEndCallback();

        if (typeof callback === 'function') {
          callback(name);
        }
      }
    }, {
      key: 'openMenu',
      value: function openMenu(callback) {
        var _this2 = this;

        var $item = this.item;

        if (helper.transitions.supported) {
          $item.css(this.side, 0).one(transitionEndEvent, function () {
            _this2.onOpenMenu(callback);
          });
        } else {
          var menuAnimation = this.getAnimation(openAction, 'menu');

          $item.css('display', 'block').animate(menuAnimation, {
            queue: false,
            duration: this.speed,
            complete: function complete() {
              _this2.onOpenMenu(callback);
            }
          });
        }
      }
    }, {
      key: 'onCloseMenu',
      value: function onCloseMenu(callback) {
        this.item.css({
          left: '',
          right: ''
        }).unbind(transitionEndEvent);
        $$2('html').css('overflow-x', '');

        sidrStatus.moving = false;
        sidrStatus.opened = false;

        this.body.removeClass(bodyAnimationClass).removeClass(this.openClass);

        this.onCloseEndCallback();

        // Callback
        if (typeof callback === 'function') {
          callback(name);
        }
      }
    }, {
      key: 'closeMenu',
      value: function closeMenu(callback) {
        var _this3 = this;

        var item = this.item;

        if (helper.transitions.supported) {
          item.css(this.side, '').one(transitionEndEvent, function () {
            _this3.onCloseMenu(callback);
          });
        } else {
          var menuAnimation = this.getAnimation(closeAction, 'menu');

          item.animate(menuAnimation, {
            queue: false,
            duration: this.speed,
            complete: function complete() {
              _this3.onCloseMenu();
            }
          });
        }
      }
    }, {
      key: 'moveMenu',
      value: function moveMenu(action, callback) {
        this.body.addClass(bodyAnimationClass);

        if (action === openAction) {
          this.openMenu(callback);
        } else {
          this.closeMenu(callback);
        }
      }
    }, {
      key: 'move',
      value: function move(action, callback) {
        // Lock sidr
        sidrStatus.moving = true;

        this.prepareBody(action);
        this.moveBody(action);
        this.moveMenu(action, callback);
      }
    }, {
      key: 'open',
      value: function open(callback) {
        var _this4 = this;

        // Check if is already opened or moving
        if (sidrStatus.opened === this.name || sidrStatus.moving) {
          return;
        }

        // If another menu opened close first
        if (sidrStatus.opened !== false) {
          var alreadyOpenedMenu = new Menu(sidrStatus.opened);

          alreadyOpenedMenu.close(function () {
            _this4.open(callback);
          });

          return;
        }

        this.move('open', callback);

        // onOpen callback
        this.onOpenCallback();
      }
    }, {
      key: 'close',
      value: function close(callback) {
        // Check if is already closed or moving
        if (sidrStatus.opened !== this.name || sidrStatus.moving) {
          return;
        }

        this.move('close', callback);

        // onClose callback
        this.onCloseCallback();
      }
    }, {
      key: 'toggle',
      value: function toggle(callback) {
        if (sidrStatus.opened === this.name) {
          this.close(callback);
        } else {
          this.open(callback);
        }
      }
    }]);
    return Menu;
  }();

  var $$1 = jQuery;

  function execute(action, name, callback) {
    var sidr = new Menu(name);

    switch (action) {
      case 'open':
        sidr.open(callback);
        break;
      case 'close':
        sidr.close(callback);
        break;
      case 'toggle':
        sidr.toggle(callback);
        break;
      default:
        $$1.error('Method ' + action + ' does not exist on jQuery.sidr');
        break;
    }
  }

  var i;
  var $ = jQuery;
  var publicMethods = ['open', 'close', 'toggle'];
  var methodName;
  var methods = {};
  var getMethod = function getMethod(methodName) {
    return function (name, callback) {
      // Check arguments
      if (typeof name === 'function') {
        callback = name;
        name = 'sidr';
      } else if (!name) {
        name = 'sidr';
      }

      execute(methodName, name, callback);
    };
  };
  for (i = 0; i < publicMethods.length; i++) {
    methodName = publicMethods[i];
    methods[methodName] = getMethod(methodName);
  }

  function sidr(method) {
    if (method === 'status') {
      return sidrStatus;
    } else if (methods[method]) {
      return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
    } else if (typeof method === 'function' || typeof method === 'string' || !method) {
      return methods.toggle.apply(this, arguments);
    } else {
      $.error('Method ' + method + ' does not exist on jQuery.sidr');
    }
  }

  var $$3 = jQuery;

  function fillContent($sideMenu, settings) {
    // The menu content
    if (typeof settings.source === 'function') {
      var newContent = settings.source(name);

      $sideMenu.html(newContent);
    } else if (typeof settings.source === 'string' && helper.isUrl(settings.source)) {
      $$3.get(settings.source, function (data) {
        $sideMenu.html(data);
      });
    } else if (typeof settings.source === 'string') {
      var htmlContent = '',
          selectors = settings.source.split(',');

      $$3.each(selectors, function (index, element) {
        htmlContent += '<div class="sidr-inner">' + $$3(element).html() + '</div>';
      });

      // Renaming ids and classes
      if (settings.renaming) {
        var $htmlContent = $$3('<div />').html(htmlContent);

        $htmlContent.find('*').each(function (index, element) {
          var $element = $$3(element);

          helper.addPrefixes($element);
        });
        htmlContent = $htmlContent.html();
      }

      $sideMenu.html(htmlContent);
    } else if (settings.source !== null) {
      $$3.error('Invalid Sidr Source');
    }

    return $sideMenu;
  }

  function fnSidr(options) {
    var transitions = helper.transitions,
        settings = $$3.extend({
      name: 'sidr', // Name for the 'sidr'
      speed: 200, // Accepts standard jQuery effects speeds (i.e. fast, normal or milliseconds)
      side: 'left', // Accepts 'left' or 'right'
      source: null, // Override the source of the content.
      renaming: true, // The ids and classes will be prepended with a prefix when loading existent content
      body: 'body', // Page container selector,
      displace: true, // Displace the body content or not
      timing: 'ease', // Timing function for CSS transitions
      method: 'toggle', // The method to call when element is clicked
      bind: 'touchstart click', // The event(s) to trigger the menu
      onOpen: function onOpen() {},
      // Callback when sidr start opening
      onClose: function onClose() {},
      // Callback when sidr start closing
      onOpenEnd: function onOpenEnd() {},
      // Callback when sidr end opening
      onCloseEnd: function onCloseEnd() {} // Callback when sidr end closing

    }, options),
        name = settings.name,
        $sideMenu = $$3('#' + name);

    // If the side menu do not exist create it
    if ($sideMenu.length === 0) {
      $sideMenu = $$3('<div />').attr('id', name).appendTo($$3('body'));
    }

    // Add transition to menu if are supported
    if (transitions.supported) {
      $sideMenu.css(transitions.property, settings.side + ' ' + settings.speed / 1000 + 's ' + settings.timing);
    }

    // Adding styles and options
    $sideMenu.addClass('sidr').addClass(settings.side).data({
      speed: settings.speed,
      side: settings.side,
      body: settings.body,
      displace: settings.displace,
      timing: settings.timing,
      method: settings.method,
      onOpen: settings.onOpen,
      onClose: settings.onClose,
      onOpenEnd: settings.onOpenEnd,
      onCloseEnd: settings.onCloseEnd
    });

    $sideMenu = fillContent($sideMenu, settings);

    return this.each(function () {
      var $this = $$3(this),
          data = $this.data('sidr'),
          flag = false;

      // If the plugin hasn't been initialized yet
      if (!data) {
        sidrStatus.moving = false;
        sidrStatus.opened = false;

        $this.data('sidr', name);

        $this.bind(settings.bind, function (event) {
          event.preventDefault();

          if (!flag) {
            flag = true;
            sidr(settings.method, name);

            setTimeout(function () {
              flag = false;
            }, 100);
          }
        });
      }
    });
  }

  jQuery.sidr = sidr;
  jQuery.fn.sidr = fnSidr;
})();
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

(function () {
  var AjaxMonitor,
      Bar,
      DocumentMonitor,
      ElementMonitor,
      ElementTracker,
      EventLagMonitor,
      Evented,
      Events,
      NoTargetError,
      Pace,
      RequestIntercept,
      SOURCE_KEYS,
      Scaler,
      SocketRequestTracker,
      XHRRequestTracker,
      animation,
      avgAmplitude,
      bar,
      cancelAnimation,
      cancelAnimationFrame,
      defaultOptions,
      _extend,
      extendNative,
      getFromDOM,
      getIntercept,
      handlePushState,
      ignoreStack,
      init,
      now,
      options,
      requestAnimationFrame,
      result,
      runAnimation,
      scalers,
      shouldIgnoreURL,
      shouldTrack,
      source,
      sources,
      uniScaler,
      _WebSocket,
      _XDomainRequest,
      _XMLHttpRequest,
      _i,
      _intercept,
      _len,
      _pushState,
      _ref,
      _ref1,
      _replaceState,
      __slice = [].slice,
      __hasProp = {}.hasOwnProperty,
      __extends = function __extends(child, parent) {
    for (var key in parent) {
      if (__hasProp.call(parent, key)) child[key] = parent[key];
    }function ctor() {
      this.constructor = child;
    }ctor.prototype = parent.prototype;child.prototype = new ctor();child.__super__ = parent.prototype;return child;
  },
      __indexOf = [].indexOf || function (item) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (i in this && this[i] === item) return i;
    }return -1;
  };

  defaultOptions = {
    catchupTime: 100,
    initialRate: .03,
    minTime: 250,
    ghostTime: 100,
    maxProgressPerFrame: 20,
    easeFactor: 1.25,
    startOnPageLoad: true,
    restartOnPushState: true,
    restartOnRequestAfter: 500,
    target: 'body',
    elements: {
      checkInterval: 100,
      selectors: ['body']
    },
    eventLag: {
      minSamples: 10,
      sampleCount: 3,
      lagThreshold: 3
    },
    ajax: {
      trackMethods: ['GET'],
      trackWebSockets: true,
      ignoreURLs: []
    }
  };

  now = function now() {
    var _ref;
    return (_ref = typeof performance !== "undefined" && performance !== null ? typeof performance.now === "function" ? performance.now() : void 0 : void 0) != null ? _ref : +new Date();
  };

  requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

  cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame;

  if (requestAnimationFrame == null) {
    requestAnimationFrame = function requestAnimationFrame(fn) {
      return setTimeout(fn, 50);
    };
    cancelAnimationFrame = function cancelAnimationFrame(id) {
      return clearTimeout(id);
    };
  }

  runAnimation = function runAnimation(fn) {
    var last, _tick;
    last = now();
    _tick = function tick() {
      var diff;
      diff = now() - last;
      if (diff >= 33) {
        last = now();
        return fn(diff, function () {
          return requestAnimationFrame(_tick);
        });
      } else {
        return setTimeout(_tick, 33 - diff);
      }
    };
    return _tick();
  };

  result = function result() {
    var args, key, obj;
    obj = arguments[0], key = arguments[1], args = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
    if (typeof obj[key] === 'function') {
      return obj[key].apply(obj, args);
    } else {
      return obj[key];
    }
  };

  _extend = function extend() {
    var key, out, source, sources, val, _i, _len;
    out = arguments[0], sources = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    for (_i = 0, _len = sources.length; _i < _len; _i++) {
      source = sources[_i];
      if (source) {
        for (key in source) {
          if (!__hasProp.call(source, key)) continue;
          val = source[key];
          if (out[key] != null && _typeof(out[key]) === 'object' && val != null && (typeof val === 'undefined' ? 'undefined' : _typeof(val)) === 'object') {
            _extend(out[key], val);
          } else {
            out[key] = val;
          }
        }
      }
    }
    return out;
  };

  avgAmplitude = function avgAmplitude(arr) {
    var count, sum, v, _i, _len;
    sum = count = 0;
    for (_i = 0, _len = arr.length; _i < _len; _i++) {
      v = arr[_i];
      sum += Math.abs(v);
      count++;
    }
    return sum / count;
  };

  getFromDOM = function getFromDOM(key, json) {
    var data, e, el;
    if (key == null) {
      key = 'options';
    }
    if (json == null) {
      json = true;
    }
    el = document.querySelector("[data-pace-" + key + "]");
    if (!el) {
      return;
    }
    data = el.getAttribute("data-pace-" + key);
    if (!json) {
      return data;
    }
    try {
      return JSON.parse(data);
    } catch (_error) {
      e = _error;
      return typeof console !== "undefined" && console !== null ? console.error("Error parsing inline pace options", e) : void 0;
    }
  };

  Evented = function () {
    function Evented() {}

    Evented.prototype.on = function (event, handler, ctx, once) {
      var _base;
      if (once == null) {
        once = false;
      }
      if (this.bindings == null) {
        this.bindings = {};
      }
      if ((_base = this.bindings)[event] == null) {
        _base[event] = [];
      }
      return this.bindings[event].push({
        handler: handler,
        ctx: ctx,
        once: once
      });
    };

    Evented.prototype.once = function (event, handler, ctx) {
      return this.on(event, handler, ctx, true);
    };

    Evented.prototype.off = function (event, handler) {
      var i, _ref, _results;
      if (((_ref = this.bindings) != null ? _ref[event] : void 0) == null) {
        return;
      }
      if (handler == null) {
        return delete this.bindings[event];
      } else {
        i = 0;
        _results = [];
        while (i < this.bindings[event].length) {
          if (this.bindings[event][i].handler === handler) {
            _results.push(this.bindings[event].splice(i, 1));
          } else {
            _results.push(i++);
          }
        }
        return _results;
      }
    };

    Evented.prototype.trigger = function () {
      var args, ctx, event, handler, i, once, _ref, _ref1, _results;
      event = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      if ((_ref = this.bindings) != null ? _ref[event] : void 0) {
        i = 0;
        _results = [];
        while (i < this.bindings[event].length) {
          _ref1 = this.bindings[event][i], handler = _ref1.handler, ctx = _ref1.ctx, once = _ref1.once;
          handler.apply(ctx != null ? ctx : this, args);
          if (once) {
            _results.push(this.bindings[event].splice(i, 1));
          } else {
            _results.push(i++);
          }
        }
        return _results;
      }
    };

    return Evented;
  }();

  Pace = window.Pace || {};

  window.Pace = Pace;

  _extend(Pace, Evented.prototype);

  options = Pace.options = _extend({}, defaultOptions, window.paceOptions, getFromDOM());

  _ref = ['ajax', 'document', 'eventLag', 'elements'];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    source = _ref[_i];
    if (options[source] === true) {
      options[source] = defaultOptions[source];
    }
  }

  NoTargetError = function (_super) {
    __extends(NoTargetError, _super);

    function NoTargetError() {
      _ref1 = NoTargetError.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    return NoTargetError;
  }(Error);

  Bar = function () {
    function Bar() {
      this.progress = 0;
    }

    Bar.prototype.getElement = function () {
      var targetElement;
      if (this.el == null) {
        targetElement = document.querySelector(options.target);
        if (!targetElement) {
          throw new NoTargetError();
        }
        this.el = document.createElement('div');
        this.el.className = "pace pace-active";
        document.body.className = document.body.className.replace(/pace-done/g, '');
        document.body.className += ' pace-running';
        this.el.innerHTML = '<div class="pace-progress">\n  <div class="pace-progress-inner"></div>\n</div>\n<div class="pace-activity"></div>';
        if (targetElement.firstChild != null) {
          targetElement.insertBefore(this.el, targetElement.firstChild);
        } else {
          targetElement.appendChild(this.el);
        }
      }
      return this.el;
    };

    Bar.prototype.finish = function () {
      var el;
      el = this.getElement();
      el.className = el.className.replace('pace-active', '');
      el.className += ' pace-inactive';
      document.body.className = document.body.className.replace('pace-running', '');
      return document.body.className += ' pace-done';
    };

    Bar.prototype.update = function (prog) {
      this.progress = prog;
      return this.render();
    };

    Bar.prototype.destroy = function () {
      try {
        this.getElement().parentNode.removeChild(this.getElement());
      } catch (_error) {
        NoTargetError = _error;
      }
      return this.el = void 0;
    };

    Bar.prototype.render = function () {
      var el, key, progressStr, transform, _j, _len1, _ref2;
      if (document.querySelector(options.target) == null) {
        return false;
      }
      el = this.getElement();
      transform = "translate3d(" + this.progress + "%, 0, 0)";
      _ref2 = ['webkitTransform', 'msTransform', 'transform'];
      for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
        key = _ref2[_j];
        el.children[0].style[key] = transform;
      }
      if (!this.lastRenderedProgress || this.lastRenderedProgress | 0 !== this.progress | 0) {
        el.children[0].setAttribute('data-progress-text', "" + (this.progress | 0) + "%");
        if (this.progress >= 100) {
          progressStr = '99';
        } else {
          progressStr = this.progress < 10 ? "0" : "";
          progressStr += this.progress | 0;
        }
        el.children[0].setAttribute('data-progress', "" + progressStr);
      }
      return this.lastRenderedProgress = this.progress;
    };

    Bar.prototype.done = function () {
      return this.progress >= 100;
    };

    return Bar;
  }();

  Events = function () {
    function Events() {
      this.bindings = {};
    }

    Events.prototype.trigger = function (name, val) {
      var binding, _j, _len1, _ref2, _results;
      if (this.bindings[name] != null) {
        _ref2 = this.bindings[name];
        _results = [];
        for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
          binding = _ref2[_j];
          _results.push(binding.call(this, val));
        }
        return _results;
      }
    };

    Events.prototype.on = function (name, fn) {
      var _base;
      if ((_base = this.bindings)[name] == null) {
        _base[name] = [];
      }
      return this.bindings[name].push(fn);
    };

    return Events;
  }();

  _XMLHttpRequest = window.XMLHttpRequest;

  _XDomainRequest = window.XDomainRequest;

  _WebSocket = window.WebSocket;

  extendNative = function extendNative(to, from) {
    var e, key, _results;
    _results = [];
    for (key in from.prototype) {
      try {
        if (to[key] == null && typeof from[key] !== 'function') {
          if (typeof Object.defineProperty === 'function') {
            _results.push(Object.defineProperty(to, key, {
              get: function get() {
                return from.prototype[key];
              },
              configurable: true,
              enumerable: true
            }));
          } else {
            _results.push(to[key] = from.prototype[key]);
          }
        } else {
          _results.push(void 0);
        }
      } catch (_error) {
        e = _error;
      }
    }
    return _results;
  };

  ignoreStack = [];

  Pace.ignore = function () {
    var args, fn, ret;
    fn = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    ignoreStack.unshift('ignore');
    ret = fn.apply(null, args);
    ignoreStack.shift();
    return ret;
  };

  Pace.track = function () {
    var args, fn, ret;
    fn = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    ignoreStack.unshift('track');
    ret = fn.apply(null, args);
    ignoreStack.shift();
    return ret;
  };

  shouldTrack = function shouldTrack(method) {
    var _ref2;
    if (method == null) {
      method = 'GET';
    }
    if (ignoreStack[0] === 'track') {
      return 'force';
    }
    if (!ignoreStack.length && options.ajax) {
      if (method === 'socket' && options.ajax.trackWebSockets) {
        return true;
      } else if (_ref2 = method.toUpperCase(), __indexOf.call(options.ajax.trackMethods, _ref2) >= 0) {
        return true;
      }
    }
    return false;
  };

  RequestIntercept = function (_super) {
    __extends(RequestIntercept, _super);

    function RequestIntercept() {
      var monitorXHR,
          _this = this;
      RequestIntercept.__super__.constructor.apply(this, arguments);
      monitorXHR = function monitorXHR(req) {
        var _open;
        _open = req.open;
        return req.open = function (type, url, async) {
          if (shouldTrack(type)) {
            _this.trigger('request', {
              type: type,
              url: url,
              request: req
            });
          }
          return _open.apply(req, arguments);
        };
      };
      window.XMLHttpRequest = function (flags) {
        var req;
        req = new _XMLHttpRequest(flags);
        monitorXHR(req);
        return req;
      };
      try {
        extendNative(window.XMLHttpRequest, _XMLHttpRequest);
      } catch (_error) {}
      if (_XDomainRequest != null) {
        window.XDomainRequest = function () {
          var req;
          req = new _XDomainRequest();
          monitorXHR(req);
          return req;
        };
        try {
          extendNative(window.XDomainRequest, _XDomainRequest);
        } catch (_error) {}
      }
      if (_WebSocket != null && options.ajax.trackWebSockets) {
        window.WebSocket = function (url, protocols) {
          var req;
          if (protocols != null) {
            req = new _WebSocket(url, protocols);
          } else {
            req = new _WebSocket(url);
          }
          if (shouldTrack('socket')) {
            _this.trigger('request', {
              type: 'socket',
              url: url,
              protocols: protocols,
              request: req
            });
          }
          return req;
        };
        try {
          extendNative(window.WebSocket, _WebSocket);
        } catch (_error) {}
      }
    }

    return RequestIntercept;
  }(Events);

  _intercept = null;

  getIntercept = function getIntercept() {
    if (_intercept == null) {
      _intercept = new RequestIntercept();
    }
    return _intercept;
  };

  shouldIgnoreURL = function shouldIgnoreURL(url) {
    var pattern, _j, _len1, _ref2;
    _ref2 = options.ajax.ignoreURLs;
    for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
      pattern = _ref2[_j];
      if (typeof pattern === 'string') {
        if (url.indexOf(pattern) !== -1) {
          return true;
        }
      } else {
        if (pattern.test(url)) {
          return true;
        }
      }
    }
    return false;
  };

  getIntercept().on('request', function (_arg) {
    var after, args, request, type, url;
    type = _arg.type, request = _arg.request, url = _arg.url;
    if (shouldIgnoreURL(url)) {
      return;
    }
    if (!Pace.running && (options.restartOnRequestAfter !== false || shouldTrack(type) === 'force')) {
      args = arguments;
      after = options.restartOnRequestAfter || 0;
      if (typeof after === 'boolean') {
        after = 0;
      }
      return setTimeout(function () {
        var stillActive, _j, _len1, _ref2, _ref3, _results;
        if (type === 'socket') {
          stillActive = request.readyState < 2;
        } else {
          stillActive = 0 < (_ref2 = request.readyState) && _ref2 < 4;
        }
        if (stillActive) {
          Pace.restart();
          _ref3 = Pace.sources;
          _results = [];
          for (_j = 0, _len1 = _ref3.length; _j < _len1; _j++) {
            source = _ref3[_j];
            if (source instanceof AjaxMonitor) {
              source.watch.apply(source, args);
              break;
            } else {
              _results.push(void 0);
            }
          }
          return _results;
        }
      }, after);
    }
  });

  AjaxMonitor = function () {
    function AjaxMonitor() {
      var _this = this;
      this.elements = [];
      getIntercept().on('request', function () {
        return _this.watch.apply(_this, arguments);
      });
    }

    AjaxMonitor.prototype.watch = function (_arg) {
      var request, tracker, type, url;
      type = _arg.type, request = _arg.request, url = _arg.url;
      if (shouldIgnoreURL(url)) {
        return;
      }
      if (type === 'socket') {
        tracker = new SocketRequestTracker(request);
      } else {
        tracker = new XHRRequestTracker(request);
      }
      return this.elements.push(tracker);
    };

    return AjaxMonitor;
  }();

  XHRRequestTracker = function () {
    function XHRRequestTracker(request) {
      var event,
          size,
          _j,
          _len1,
          _onreadystatechange,
          _ref2,
          _this = this;
      this.progress = 0;
      if (window.ProgressEvent != null) {
        size = null;
        request.addEventListener('progress', function (evt) {
          if (evt.lengthComputable) {
            return _this.progress = 100 * evt.loaded / evt.total;
          } else {
            return _this.progress = _this.progress + (100 - _this.progress) / 2;
          }
        }, false);
        _ref2 = ['load', 'abort', 'timeout', 'error'];
        for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
          event = _ref2[_j];
          request.addEventListener(event, function () {
            return _this.progress = 100;
          }, false);
        }
      } else {
        _onreadystatechange = request.onreadystatechange;
        request.onreadystatechange = function () {
          var _ref3;
          if ((_ref3 = request.readyState) === 0 || _ref3 === 4) {
            _this.progress = 100;
          } else if (request.readyState === 3) {
            _this.progress = 50;
          }
          return typeof _onreadystatechange === "function" ? _onreadystatechange.apply(null, arguments) : void 0;
        };
      }
    }

    return XHRRequestTracker;
  }();

  SocketRequestTracker = function () {
    function SocketRequestTracker(request) {
      var event,
          _j,
          _len1,
          _ref2,
          _this = this;
      this.progress = 0;
      _ref2 = ['error', 'open'];
      for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
        event = _ref2[_j];
        request.addEventListener(event, function () {
          return _this.progress = 100;
        }, false);
      }
    }

    return SocketRequestTracker;
  }();

  ElementMonitor = function () {
    function ElementMonitor(options) {
      var selector, _j, _len1, _ref2;
      if (options == null) {
        options = {};
      }
      this.elements = [];
      if (options.selectors == null) {
        options.selectors = [];
      }
      _ref2 = options.selectors;
      for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
        selector = _ref2[_j];
        this.elements.push(new ElementTracker(selector));
      }
    }

    return ElementMonitor;
  }();

  ElementTracker = function () {
    function ElementTracker(selector) {
      this.selector = selector;
      this.progress = 0;
      this.check();
    }

    ElementTracker.prototype.check = function () {
      var _this = this;
      if (document.querySelector(this.selector)) {
        return this.done();
      } else {
        return setTimeout(function () {
          return _this.check();
        }, options.elements.checkInterval);
      }
    };

    ElementTracker.prototype.done = function () {
      return this.progress = 100;
    };

    return ElementTracker;
  }();

  DocumentMonitor = function () {
    DocumentMonitor.prototype.states = {
      loading: 0,
      interactive: 50,
      complete: 100
    };

    function DocumentMonitor() {
      var _onreadystatechange,
          _ref2,
          _this = this;
      this.progress = (_ref2 = this.states[document.readyState]) != null ? _ref2 : 100;
      _onreadystatechange = document.onreadystatechange;
      document.onreadystatechange = function () {
        if (_this.states[document.readyState] != null) {
          _this.progress = _this.states[document.readyState];
        }
        return typeof _onreadystatechange === "function" ? _onreadystatechange.apply(null, arguments) : void 0;
      };
    }

    return DocumentMonitor;
  }();

  EventLagMonitor = function () {
    function EventLagMonitor() {
      var avg,
          interval,
          last,
          points,
          samples,
          _this = this;
      this.progress = 0;
      avg = 0;
      samples = [];
      points = 0;
      last = now();
      interval = setInterval(function () {
        var diff;
        diff = now() - last - 50;
        last = now();
        samples.push(diff);
        if (samples.length > options.eventLag.sampleCount) {
          samples.shift();
        }
        avg = avgAmplitude(samples);
        if (++points >= options.eventLag.minSamples && avg < options.eventLag.lagThreshold) {
          _this.progress = 100;
          return clearInterval(interval);
        } else {
          return _this.progress = 100 * (3 / (avg + 3));
        }
      }, 50);
    }

    return EventLagMonitor;
  }();

  Scaler = function () {
    function Scaler(source) {
      this.source = source;
      this.last = this.sinceLastUpdate = 0;
      this.rate = options.initialRate;
      this.catchup = 0;
      this.progress = this.lastProgress = 0;
      if (this.source != null) {
        this.progress = result(this.source, 'progress');
      }
    }

    Scaler.prototype.tick = function (frameTime, val) {
      var scaling;
      if (val == null) {
        val = result(this.source, 'progress');
      }
      if (val >= 100) {
        this.done = true;
      }
      if (val === this.last) {
        this.sinceLastUpdate += frameTime;
      } else {
        if (this.sinceLastUpdate) {
          this.rate = (val - this.last) / this.sinceLastUpdate;
        }
        this.catchup = (val - this.progress) / options.catchupTime;
        this.sinceLastUpdate = 0;
        this.last = val;
      }
      if (val > this.progress) {
        this.progress += this.catchup * frameTime;
      }
      scaling = 1 - Math.pow(this.progress / 100, options.easeFactor);
      this.progress += scaling * this.rate * frameTime;
      this.progress = Math.min(this.lastProgress + options.maxProgressPerFrame, this.progress);
      this.progress = Math.max(0, this.progress);
      this.progress = Math.min(100, this.progress);
      this.lastProgress = this.progress;
      return this.progress;
    };

    return Scaler;
  }();

  sources = null;

  scalers = null;

  bar = null;

  uniScaler = null;

  animation = null;

  cancelAnimation = null;

  Pace.running = false;

  handlePushState = function handlePushState() {
    if (options.restartOnPushState) {
      return Pace.restart();
    }
  };

  if (window.history.pushState != null) {
    _pushState = window.history.pushState;
    window.history.pushState = function () {
      handlePushState();
      return _pushState.apply(window.history, arguments);
    };
  }

  if (window.history.replaceState != null) {
    _replaceState = window.history.replaceState;
    window.history.replaceState = function () {
      handlePushState();
      return _replaceState.apply(window.history, arguments);
    };
  }

  SOURCE_KEYS = {
    ajax: AjaxMonitor,
    elements: ElementMonitor,
    document: DocumentMonitor,
    eventLag: EventLagMonitor
  };

  (init = function init() {
    var type, _j, _k, _len1, _len2, _ref2, _ref3, _ref4;
    Pace.sources = sources = [];
    _ref2 = ['ajax', 'elements', 'document', 'eventLag'];
    for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
      type = _ref2[_j];
      if (options[type] !== false) {
        sources.push(new SOURCE_KEYS[type](options[type]));
      }
    }
    _ref4 = (_ref3 = options.extraSources) != null ? _ref3 : [];
    for (_k = 0, _len2 = _ref4.length; _k < _len2; _k++) {
      source = _ref4[_k];
      sources.push(new source(options));
    }
    Pace.bar = bar = new Bar();
    scalers = [];
    return uniScaler = new Scaler();
  })();

  Pace.stop = function () {
    Pace.trigger('stop');
    Pace.running = false;
    bar.destroy();
    cancelAnimation = true;
    if (animation != null) {
      if (typeof cancelAnimationFrame === "function") {
        cancelAnimationFrame(animation);
      }
      animation = null;
    }
    return init();
  };

  Pace.restart = function () {
    Pace.trigger('restart');
    Pace.stop();
    return Pace.start();
  };

  Pace.go = function () {
    var start;
    Pace.running = true;
    bar.render();
    start = now();
    cancelAnimation = false;
    return animation = runAnimation(function (frameTime, enqueueNextFrame) {
      var avg, count, done, element, elements, i, j, remaining, scaler, scalerList, sum, _j, _k, _len1, _len2, _ref2;
      remaining = 100 - bar.progress;
      count = sum = 0;
      done = true;
      for (i = _j = 0, _len1 = sources.length; _j < _len1; i = ++_j) {
        source = sources[i];
        scalerList = scalers[i] != null ? scalers[i] : scalers[i] = [];
        elements = (_ref2 = source.elements) != null ? _ref2 : [source];
        for (j = _k = 0, _len2 = elements.length; _k < _len2; j = ++_k) {
          element = elements[j];
          scaler = scalerList[j] != null ? scalerList[j] : scalerList[j] = new Scaler(element);
          done &= scaler.done;
          if (scaler.done) {
            continue;
          }
          count++;
          sum += scaler.tick(frameTime);
        }
      }
      avg = sum / count;
      bar.update(uniScaler.tick(frameTime, avg));
      if (bar.done() || done || cancelAnimation) {
        bar.update(100);
        Pace.trigger('done');
        return setTimeout(function () {
          bar.finish();
          Pace.running = false;
          return Pace.trigger('hide');
        }, Math.max(options.ghostTime, Math.max(options.minTime - (now() - start), 0)));
      } else {
        return enqueueNextFrame();
      }
    });
  };

  Pace.start = function (_options) {
    _extend(options, _options);
    Pace.running = true;
    try {
      bar.render();
    } catch (_error) {
      NoTargetError = _error;
    }
    if (!document.querySelector('.pace')) {
      return setTimeout(Pace.start, 50);
    } else {
      Pace.trigger('start');
      return Pace.go();
    }
  };

  if (typeof define === 'function' && define.amd) {
    define(['pace'], function () {
      return Pace;
    });
  } else if ((typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object') {
    module.exports = Pace;
  } else {
    if (options.startOnPageLoad) {
      Pace.start();
    }
  }
}).call(undefined);
'use strict';

jQuery(function ($) {
    'use strict';

    // Flexy header

    flexy_header.init();

    $('.sidr-toggle--right').sidr({
        name: 'sidr-main',
        side: 'right',
        renaming: false,
        body: '.layout__wrapper',
        source: '.sidr-source-provider'
    });

    // Enable / disable Bootstrap tooltips, based upon touch events
    if (Modernizr.touchevents) {
        $('[data-toggle="tooltip"]').tooltip('hide');
    } else {
        $('[data-toggle="tooltip"]').tooltip();
    }

    // Poppy (popovers).
    $('.poppy-toggle').on('click', function (event) {
        var $element = $(this);
        var $parent = $element.parents('.poppy');

        // Make sure that no other "poppys" are open.
        $('.poppy--open').not($parent).removeClass('poppy--open');

        // Toggle the class on this element.
        $parent.toggleClass('poppy--open');
    });
    $('.poppy').on('click', function (event) {
        event.stopPropagation();
    });
    $('body').on('click', function (event) {
        $('.poppy--open').removeClass('poppy--open');
    });

    // Ajaxi click loader.
    $('[data-ajaxi-source]').on('click', function (event) {
        var $element = $(this);
        var target = $element.attr('data-ajaxi-target');
        var source = $element.attr('data-ajaxi-source');
        var loading = $element.attr('data-ajaxi-loading');

        // Set loading text.
        $(target).html(loading);

        // Load external content.
        $(target).load(source);
    });

    // Metting agenda bulletpoints collapse toggle callback.
    $('#meeting-agenda-collapse-toggle').on('click', function (event) {
        $('.area-expand-collapse').collapse('toggle');
        event.preventDefault();
    });

    // Bullet point collapse toggle callback.
    $('.bullet-point-toggle').on('click', function (event) {
        var $wrapper = $(this).parents('article:first');
        $wrapper.find('.area-expand-collapse').collapse('toggle');
        event.preventDefault();
    });
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImJvb3RzdHJhcC5qcyIsImZsZXh5LWhlYWRlci5qcyIsImZsZXh5LW5hdmlnYXRpb24uanMiLCJqcXVlcnkuc2lkci5qcyIsInBhY2UuanMiLCJhcHAuanMiXSwibmFtZXMiOlsialF1ZXJ5IiwiRXJyb3IiLCIkIiwidmVyc2lvbiIsImZuIiwianF1ZXJ5Iiwic3BsaXQiLCJ0cmFuc2l0aW9uRW5kIiwiZWwiLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnQiLCJ0cmFuc0VuZEV2ZW50TmFtZXMiLCJXZWJraXRUcmFuc2l0aW9uIiwiTW96VHJhbnNpdGlvbiIsIk9UcmFuc2l0aW9uIiwidHJhbnNpdGlvbiIsIm5hbWUiLCJzdHlsZSIsInVuZGVmaW5lZCIsImVuZCIsImVtdWxhdGVUcmFuc2l0aW9uRW5kIiwiZHVyYXRpb24iLCJjYWxsZWQiLCIkZWwiLCJvbmUiLCJjYWxsYmFjayIsInRyaWdnZXIiLCJzdXBwb3J0Iiwic2V0VGltZW91dCIsImV2ZW50Iiwic3BlY2lhbCIsImJzVHJhbnNpdGlvbkVuZCIsImJpbmRUeXBlIiwiZGVsZWdhdGVUeXBlIiwiaGFuZGxlIiwiZSIsInRhcmdldCIsImlzIiwiaGFuZGxlT2JqIiwiaGFuZGxlciIsImFwcGx5IiwiYXJndW1lbnRzIiwiZGlzbWlzcyIsIkFsZXJ0Iiwib24iLCJjbG9zZSIsIlZFUlNJT04iLCJUUkFOU0lUSU9OX0RVUkFUSU9OIiwicHJvdG90eXBlIiwiJHRoaXMiLCJzZWxlY3RvciIsImF0dHIiLCJyZXBsYWNlIiwiJHBhcmVudCIsImZpbmQiLCJwcmV2ZW50RGVmYXVsdCIsImxlbmd0aCIsImNsb3Nlc3QiLCJFdmVudCIsImlzRGVmYXVsdFByZXZlbnRlZCIsInJlbW92ZUNsYXNzIiwicmVtb3ZlRWxlbWVudCIsImRldGFjaCIsInJlbW92ZSIsImhhc0NsYXNzIiwiUGx1Z2luIiwib3B0aW9uIiwiZWFjaCIsImRhdGEiLCJjYWxsIiwib2xkIiwiYWxlcnQiLCJDb25zdHJ1Y3RvciIsIm5vQ29uZmxpY3QiLCJCdXR0b24iLCJlbGVtZW50Iiwib3B0aW9ucyIsIiRlbGVtZW50IiwiZXh0ZW5kIiwiREVGQVVMVFMiLCJpc0xvYWRpbmciLCJsb2FkaW5nVGV4dCIsInNldFN0YXRlIiwic3RhdGUiLCJkIiwidmFsIiwicmVzZXRUZXh0IiwicHJveHkiLCJhZGRDbGFzcyIsInByb3AiLCJyZW1vdmVBdHRyIiwidG9nZ2xlIiwiY2hhbmdlZCIsIiRpbnB1dCIsInRvZ2dsZUNsYXNzIiwiYnV0dG9uIiwiJGJ0biIsImZpcnN0IiwidGVzdCIsInR5cGUiLCJDYXJvdXNlbCIsIiRpbmRpY2F0b3JzIiwicGF1c2VkIiwic2xpZGluZyIsImludGVydmFsIiwiJGFjdGl2ZSIsIiRpdGVtcyIsImtleWJvYXJkIiwia2V5ZG93biIsInBhdXNlIiwiZG9jdW1lbnRFbGVtZW50IiwiY3ljbGUiLCJ3cmFwIiwidGFnTmFtZSIsIndoaWNoIiwicHJldiIsIm5leHQiLCJjbGVhckludGVydmFsIiwic2V0SW50ZXJ2YWwiLCJnZXRJdGVtSW5kZXgiLCJpdGVtIiwicGFyZW50IiwiY2hpbGRyZW4iLCJpbmRleCIsImdldEl0ZW1Gb3JEaXJlY3Rpb24iLCJkaXJlY3Rpb24iLCJhY3RpdmUiLCJhY3RpdmVJbmRleCIsIndpbGxXcmFwIiwiZGVsdGEiLCJpdGVtSW5kZXgiLCJlcSIsInRvIiwicG9zIiwidGhhdCIsInNsaWRlIiwiJG5leHQiLCJpc0N5Y2xpbmciLCJyZWxhdGVkVGFyZ2V0Iiwic2xpZGVFdmVudCIsIiRuZXh0SW5kaWNhdG9yIiwic2xpZEV2ZW50Iiwib2Zmc2V0V2lkdGgiLCJqb2luIiwiYWN0aW9uIiwiY2Fyb3VzZWwiLCJjbGlja0hhbmRsZXIiLCJocmVmIiwiJHRhcmdldCIsInNsaWRlSW5kZXgiLCJ3aW5kb3ciLCIkY2Fyb3VzZWwiLCJDb2xsYXBzZSIsIiR0cmlnZ2VyIiwiaWQiLCJ0cmFuc2l0aW9uaW5nIiwiZ2V0UGFyZW50IiwiYWRkQXJpYUFuZENvbGxhcHNlZENsYXNzIiwiZGltZW5zaW9uIiwiaGFzV2lkdGgiLCJzaG93IiwiYWN0aXZlc0RhdGEiLCJhY3RpdmVzIiwic3RhcnRFdmVudCIsImNvbXBsZXRlIiwic2Nyb2xsU2l6ZSIsImNhbWVsQ2FzZSIsImhpZGUiLCJvZmZzZXRIZWlnaHQiLCJpIiwiZ2V0VGFyZ2V0RnJvbVRyaWdnZXIiLCJpc09wZW4iLCJjb2xsYXBzZSIsImJhY2tkcm9wIiwiRHJvcGRvd24iLCJjbGVhck1lbnVzIiwiY29udGFpbnMiLCJpc0FjdGl2ZSIsImluc2VydEFmdGVyIiwic3RvcFByb3BhZ2F0aW9uIiwiZGVzYyIsImRyb3Bkb3duIiwiTW9kYWwiLCIkYm9keSIsImJvZHkiLCIkZGlhbG9nIiwiJGJhY2tkcm9wIiwiaXNTaG93biIsIm9yaWdpbmFsQm9keVBhZCIsInNjcm9sbGJhcldpZHRoIiwiaWdub3JlQmFja2Ryb3BDbGljayIsImZpeGVkQ29udGVudCIsInJlbW90ZSIsImxvYWQiLCJCQUNLRFJPUF9UUkFOU0lUSU9OX0RVUkFUSU9OIiwiX3JlbGF0ZWRUYXJnZXQiLCJjaGVja1Njcm9sbGJhciIsInNldFNjcm9sbGJhciIsImVzY2FwZSIsInJlc2l6ZSIsImFwcGVuZFRvIiwic2Nyb2xsVG9wIiwiYWRqdXN0RGlhbG9nIiwiZW5mb3JjZUZvY3VzIiwib2ZmIiwiaGlkZU1vZGFsIiwiaGFzIiwiaGFuZGxlVXBkYXRlIiwicmVzZXRBZGp1c3RtZW50cyIsInJlc2V0U2Nyb2xsYmFyIiwicmVtb3ZlQmFja2Ryb3AiLCJhbmltYXRlIiwiZG9BbmltYXRlIiwiY3VycmVudFRhcmdldCIsImZvY3VzIiwiY2FsbGJhY2tSZW1vdmUiLCJtb2RhbElzT3ZlcmZsb3dpbmciLCJzY3JvbGxIZWlnaHQiLCJjbGllbnRIZWlnaHQiLCJjc3MiLCJwYWRkaW5nTGVmdCIsImJvZHlJc092ZXJmbG93aW5nIiwicGFkZGluZ1JpZ2h0IiwiZnVsbFdpbmRvd1dpZHRoIiwiaW5uZXJXaWR0aCIsImRvY3VtZW50RWxlbWVudFJlY3QiLCJnZXRCb3VuZGluZ0NsaWVudFJlY3QiLCJyaWdodCIsIk1hdGgiLCJhYnMiLCJsZWZ0IiwiY2xpZW50V2lkdGgiLCJtZWFzdXJlU2Nyb2xsYmFyIiwiYm9keVBhZCIsInBhcnNlSW50IiwiYWN0dWFsUGFkZGluZyIsImNhbGN1bGF0ZWRQYWRkaW5nIiwicGFyc2VGbG9hdCIsInBhZGRpbmciLCJyZW1vdmVEYXRhIiwic2Nyb2xsRGl2IiwiY2xhc3NOYW1lIiwiYXBwZW5kIiwicmVtb3ZlQ2hpbGQiLCJtb2RhbCIsInNob3dFdmVudCIsIkRJU0FMTE9XRURfQVRUUklCVVRFUyIsInVyaUF0dHJzIiwiQVJJQV9BVFRSSUJVVEVfUEFUVEVSTiIsIkRlZmF1bHRXaGl0ZWxpc3QiLCJhIiwiYXJlYSIsImIiLCJiciIsImNvbCIsImNvZGUiLCJkaXYiLCJlbSIsImhyIiwiaDEiLCJoMiIsImgzIiwiaDQiLCJoNSIsImg2IiwiaW1nIiwibGkiLCJvbCIsInAiLCJwcmUiLCJzIiwic21hbGwiLCJzcGFuIiwic3ViIiwic3VwIiwic3Ryb25nIiwidSIsInVsIiwiU0FGRV9VUkxfUEFUVEVSTiIsIkRBVEFfVVJMX1BBVFRFUk4iLCJhbGxvd2VkQXR0cmlidXRlIiwiYWxsb3dlZEF0dHJpYnV0ZUxpc3QiLCJhdHRyTmFtZSIsIm5vZGVOYW1lIiwidG9Mb3dlckNhc2UiLCJpbkFycmF5IiwiQm9vbGVhbiIsIm5vZGVWYWx1ZSIsIm1hdGNoIiwicmVnRXhwIiwiZmlsdGVyIiwidmFsdWUiLCJSZWdFeHAiLCJsIiwic2FuaXRpemVIdG1sIiwidW5zYWZlSHRtbCIsIndoaXRlTGlzdCIsInNhbml0aXplRm4iLCJpbXBsZW1lbnRhdGlvbiIsImNyZWF0ZUhUTUxEb2N1bWVudCIsImNyZWF0ZWREb2N1bWVudCIsImlubmVySFRNTCIsIndoaXRlbGlzdEtleXMiLCJtYXAiLCJlbGVtZW50cyIsImxlbiIsImVsTmFtZSIsInBhcmVudE5vZGUiLCJhdHRyaWJ1dGVMaXN0IiwiYXR0cmlidXRlcyIsIndoaXRlbGlzdGVkQXR0cmlidXRlcyIsImNvbmNhdCIsImoiLCJsZW4yIiwicmVtb3ZlQXR0cmlidXRlIiwiVG9vbHRpcCIsImVuYWJsZWQiLCJ0aW1lb3V0IiwiaG92ZXJTdGF0ZSIsImluU3RhdGUiLCJpbml0IiwiYW5pbWF0aW9uIiwicGxhY2VtZW50IiwidGVtcGxhdGUiLCJ0aXRsZSIsImRlbGF5IiwiaHRtbCIsImNvbnRhaW5lciIsInZpZXdwb3J0Iiwic2FuaXRpemUiLCJnZXRPcHRpb25zIiwiJHZpZXdwb3J0IiwiaXNGdW5jdGlvbiIsImNsaWNrIiwiaG92ZXIiLCJjb25zdHJ1Y3RvciIsInRyaWdnZXJzIiwiZXZlbnRJbiIsImV2ZW50T3V0IiwiZW50ZXIiLCJsZWF2ZSIsIl9vcHRpb25zIiwiZml4VGl0bGUiLCJnZXREZWZhdWx0cyIsImRhdGFBdHRyaWJ1dGVzIiwiZGF0YUF0dHIiLCJoYXNPd25Qcm9wZXJ0eSIsImdldERlbGVnYXRlT3B0aW9ucyIsImRlZmF1bHRzIiwia2V5Iiwib2JqIiwic2VsZiIsInRpcCIsImNsZWFyVGltZW91dCIsImlzSW5TdGF0ZVRydWUiLCJoYXNDb250ZW50IiwiaW5Eb20iLCJvd25lckRvY3VtZW50IiwiJHRpcCIsInRpcElkIiwiZ2V0VUlEIiwic2V0Q29udGVudCIsImF1dG9Ub2tlbiIsImF1dG9QbGFjZSIsInRvcCIsImRpc3BsYXkiLCJnZXRQb3NpdGlvbiIsImFjdHVhbFdpZHRoIiwiYWN0dWFsSGVpZ2h0Iiwib3JnUGxhY2VtZW50Iiwidmlld3BvcnREaW0iLCJib3R0b20iLCJ3aWR0aCIsImNhbGN1bGF0ZWRPZmZzZXQiLCJnZXRDYWxjdWxhdGVkT2Zmc2V0IiwiYXBwbHlQbGFjZW1lbnQiLCJwcmV2SG92ZXJTdGF0ZSIsIm9mZnNldCIsImhlaWdodCIsIm1hcmdpblRvcCIsIm1hcmdpbkxlZnQiLCJpc05hTiIsInNldE9mZnNldCIsInVzaW5nIiwicHJvcHMiLCJyb3VuZCIsImdldFZpZXdwb3J0QWRqdXN0ZWREZWx0YSIsImlzVmVydGljYWwiLCJhcnJvd0RlbHRhIiwiYXJyb3dPZmZzZXRQb3NpdGlvbiIsInJlcGxhY2VBcnJvdyIsImFycm93IiwiZ2V0VGl0bGUiLCJ0ZXh0IiwiJGUiLCJpc0JvZHkiLCJlbFJlY3QiLCJpc1N2ZyIsIlNWR0VsZW1lbnQiLCJlbE9mZnNldCIsInNjcm9sbCIsIm91dGVyRGltcyIsInZpZXdwb3J0UGFkZGluZyIsInZpZXdwb3J0RGltZW5zaW9ucyIsInRvcEVkZ2VPZmZzZXQiLCJib3R0b21FZGdlT2Zmc2V0IiwibGVmdEVkZ2VPZmZzZXQiLCJyaWdodEVkZ2VPZmZzZXQiLCJvIiwicHJlZml4IiwicmFuZG9tIiwiZ2V0RWxlbWVudEJ5SWQiLCIkYXJyb3ciLCJlbmFibGUiLCJkaXNhYmxlIiwidG9nZ2xlRW5hYmxlZCIsImRlc3Ryb3kiLCJ0b29sdGlwIiwiUG9wb3ZlciIsImNvbnRlbnQiLCJnZXRDb250ZW50IiwidHlwZUNvbnRlbnQiLCJwb3BvdmVyIiwiU2Nyb2xsU3B5IiwiJHNjcm9sbEVsZW1lbnQiLCJvZmZzZXRzIiwidGFyZ2V0cyIsImFjdGl2ZVRhcmdldCIsInByb2Nlc3MiLCJyZWZyZXNoIiwiZ2V0U2Nyb2xsSGVpZ2h0IiwibWF4Iiwib2Zmc2V0TWV0aG9kIiwib2Zmc2V0QmFzZSIsImlzV2luZG93IiwiJGhyZWYiLCJzb3J0IiwicHVzaCIsIm1heFNjcm9sbCIsImFjdGl2YXRlIiwiY2xlYXIiLCJwYXJlbnRzIiwicGFyZW50c1VudGlsIiwic2Nyb2xsc3B5IiwiJHNweSIsIlRhYiIsIiR1bCIsIiRwcmV2aW91cyIsImhpZGVFdmVudCIsInRhYiIsIkFmZml4IiwiY2hlY2tQb3NpdGlvbiIsImNoZWNrUG9zaXRpb25XaXRoRXZlbnRMb29wIiwiYWZmaXhlZCIsInVucGluIiwicGlubmVkT2Zmc2V0IiwiUkVTRVQiLCJnZXRTdGF0ZSIsIm9mZnNldFRvcCIsIm9mZnNldEJvdHRvbSIsInBvc2l0aW9uIiwidGFyZ2V0SGVpZ2h0IiwiaW5pdGlhbGl6aW5nIiwiY29sbGlkZXJUb3AiLCJjb2xsaWRlckhlaWdodCIsImdldFBpbm5lZE9mZnNldCIsImFmZml4IiwiYWZmaXhUeXBlIiwiZmxleHlfaGVhZGVyIiwicHViIiwiJGhlYWRlcl9zdGF0aWMiLCIkaGVhZGVyX3N0aWNreSIsInVwZGF0ZV9pbnRlcnZhbCIsInRvbGVyYW5jZSIsInVwd2FyZCIsImRvd253YXJkIiwiX2dldF9vZmZzZXRfZnJvbV9lbGVtZW50c19ib3R0b20iLCJjbGFzc2VzIiwicGlubmVkIiwidW5waW5uZWQiLCJ3YXNfc2Nyb2xsZWQiLCJsYXN0X2Rpc3RhbmNlX2Zyb21fdG9wIiwicmVnaXN0ZXJFdmVudEhhbmRsZXJzIiwicmVnaXN0ZXJCb290RXZlbnRIYW5kbGVycyIsImRvY3VtZW50X3dhc19zY3JvbGxlZCIsImVsZW1lbnRfaGVpZ2h0Iiwib3V0ZXJIZWlnaHQiLCJlbGVtZW50X29mZnNldCIsImN1cnJlbnRfZGlzdGFuY2VfZnJvbV90b3AiLCJmbGV4eV9uYXZpZ2F0aW9uIiwibGF5b3V0X2NsYXNzZXMiLCJ1cGdyYWRlIiwiJG5hdmlnYXRpb25zIiwibmF2aWdhdGlvbiIsIiRuYXZpZ2F0aW9uIiwiJG1lZ2FtZW51cyIsImRyb3Bkb3duX21lZ2FtZW51IiwiJGRyb3Bkb3duX21lZ2FtZW51IiwiZHJvcGRvd25faGFzX21lZ2FtZW51IiwiaXNfdXBncmFkZWQiLCJuYXZpZ2F0aW9uX2hhc19tZWdhbWVudSIsIiRtZWdhbWVudSIsImhhc19vYmZ1c2NhdG9yIiwib2JmdXNjYXRvciIsImJhYmVsSGVscGVycyIsImNsYXNzQ2FsbENoZWNrIiwiaW5zdGFuY2UiLCJUeXBlRXJyb3IiLCJjcmVhdGVDbGFzcyIsImRlZmluZVByb3BlcnRpZXMiLCJkZXNjcmlwdG9yIiwiZW51bWVyYWJsZSIsImNvbmZpZ3VyYWJsZSIsIndyaXRhYmxlIiwiT2JqZWN0IiwiZGVmaW5lUHJvcGVydHkiLCJwcm90b1Byb3BzIiwic3RhdGljUHJvcHMiLCJzaWRyU3RhdHVzIiwibW92aW5nIiwib3BlbmVkIiwiaGVscGVyIiwiaXNVcmwiLCJzdHIiLCJwYXR0ZXJuIiwiYWRkUHJlZml4ZXMiLCJhZGRQcmVmaXgiLCJhdHRyaWJ1dGUiLCJ0b1JlcGxhY2UiLCJ0cmFuc2l0aW9ucyIsInN1cHBvcnRlZCIsInByb3BlcnR5IiwicHJlZml4ZXMiLCJjaGFyQXQiLCJ0b1VwcGVyQ2FzZSIsInN1YnN0ciIsIiQkMiIsImJvZHlBbmltYXRpb25DbGFzcyIsIm9wZW5BY3Rpb24iLCJjbG9zZUFjdGlvbiIsInRyYW5zaXRpb25FbmRFdmVudCIsIk1lbnUiLCJvcGVuQ2xhc3MiLCJtZW51V2lkdGgiLCJvdXRlcldpZHRoIiwic3BlZWQiLCJzaWRlIiwiZGlzcGxhY2UiLCJ0aW1pbmciLCJtZXRob2QiLCJvbk9wZW5DYWxsYmFjayIsIm9uQ2xvc2VDYWxsYmFjayIsIm9uT3BlbkVuZENhbGxiYWNrIiwib25DbG9zZUVuZENhbGxiYWNrIiwiZ2V0QW5pbWF0aW9uIiwicHJlcGFyZUJvZHkiLCIkaHRtbCIsIm9wZW5Cb2R5IiwiYm9keUFuaW1hdGlvbiIsInF1ZXVlIiwib25DbG9zZUJvZHkiLCJyZXNldFN0eWxlcyIsInVuYmluZCIsImNsb3NlQm9keSIsIl90aGlzIiwibW92ZUJvZHkiLCJvbk9wZW5NZW51Iiwib3Blbk1lbnUiLCJfdGhpczIiLCIkaXRlbSIsIm1lbnVBbmltYXRpb24iLCJvbkNsb3NlTWVudSIsImNsb3NlTWVudSIsIl90aGlzMyIsIm1vdmVNZW51IiwibW92ZSIsIm9wZW4iLCJfdGhpczQiLCJhbHJlYWR5T3BlbmVkTWVudSIsIiQkMSIsImV4ZWN1dGUiLCJzaWRyIiwiZXJyb3IiLCJwdWJsaWNNZXRob2RzIiwibWV0aG9kTmFtZSIsIm1ldGhvZHMiLCJnZXRNZXRob2QiLCJBcnJheSIsInNsaWNlIiwiJCQzIiwiZmlsbENvbnRlbnQiLCIkc2lkZU1lbnUiLCJzZXR0aW5ncyIsInNvdXJjZSIsIm5ld0NvbnRlbnQiLCJnZXQiLCJodG1sQ29udGVudCIsInNlbGVjdG9ycyIsInJlbmFtaW5nIiwiJGh0bWxDb250ZW50IiwiZm5TaWRyIiwiYmluZCIsIm9uT3BlbiIsIm9uQ2xvc2UiLCJvbk9wZW5FbmQiLCJvbkNsb3NlRW5kIiwiZmxhZyIsIkFqYXhNb25pdG9yIiwiQmFyIiwiRG9jdW1lbnRNb25pdG9yIiwiRWxlbWVudE1vbml0b3IiLCJFbGVtZW50VHJhY2tlciIsIkV2ZW50TGFnTW9uaXRvciIsIkV2ZW50ZWQiLCJFdmVudHMiLCJOb1RhcmdldEVycm9yIiwiUGFjZSIsIlJlcXVlc3RJbnRlcmNlcHQiLCJTT1VSQ0VfS0VZUyIsIlNjYWxlciIsIlNvY2tldFJlcXVlc3RUcmFja2VyIiwiWEhSUmVxdWVzdFRyYWNrZXIiLCJhdmdBbXBsaXR1ZGUiLCJiYXIiLCJjYW5jZWxBbmltYXRpb24iLCJjYW5jZWxBbmltYXRpb25GcmFtZSIsImRlZmF1bHRPcHRpb25zIiwiZXh0ZW5kTmF0aXZlIiwiZ2V0RnJvbURPTSIsImdldEludGVyY2VwdCIsImhhbmRsZVB1c2hTdGF0ZSIsImlnbm9yZVN0YWNrIiwibm93IiwicmVxdWVzdEFuaW1hdGlvbkZyYW1lIiwicmVzdWx0IiwicnVuQW5pbWF0aW9uIiwic2NhbGVycyIsInNob3VsZElnbm9yZVVSTCIsInNob3VsZFRyYWNrIiwic291cmNlcyIsInVuaVNjYWxlciIsIl9XZWJTb2NrZXQiLCJfWERvbWFpblJlcXVlc3QiLCJfWE1MSHR0cFJlcXVlc3QiLCJfaSIsIl9pbnRlcmNlcHQiLCJfbGVuIiwiX3B1c2hTdGF0ZSIsIl9yZWYiLCJfcmVmMSIsIl9yZXBsYWNlU3RhdGUiLCJfX3NsaWNlIiwiX19oYXNQcm9wIiwiX19leHRlbmRzIiwiY2hpbGQiLCJjdG9yIiwiX19zdXBlcl9fIiwiX19pbmRleE9mIiwiaW5kZXhPZiIsImNhdGNodXBUaW1lIiwiaW5pdGlhbFJhdGUiLCJtaW5UaW1lIiwiZ2hvc3RUaW1lIiwibWF4UHJvZ3Jlc3NQZXJGcmFtZSIsImVhc2VGYWN0b3IiLCJzdGFydE9uUGFnZUxvYWQiLCJyZXN0YXJ0T25QdXNoU3RhdGUiLCJyZXN0YXJ0T25SZXF1ZXN0QWZ0ZXIiLCJjaGVja0ludGVydmFsIiwiZXZlbnRMYWciLCJtaW5TYW1wbGVzIiwic2FtcGxlQ291bnQiLCJsYWdUaHJlc2hvbGQiLCJhamF4IiwidHJhY2tNZXRob2RzIiwidHJhY2tXZWJTb2NrZXRzIiwiaWdub3JlVVJMcyIsInBlcmZvcm1hbmNlIiwiRGF0ZSIsIm1velJlcXVlc3RBbmltYXRpb25GcmFtZSIsIndlYmtpdFJlcXVlc3RBbmltYXRpb25GcmFtZSIsIm1zUmVxdWVzdEFuaW1hdGlvbkZyYW1lIiwibW96Q2FuY2VsQW5pbWF0aW9uRnJhbWUiLCJsYXN0IiwidGljayIsImRpZmYiLCJhcmdzIiwib3V0IiwiYXJyIiwiY291bnQiLCJzdW0iLCJ2IiwianNvbiIsInF1ZXJ5U2VsZWN0b3IiLCJnZXRBdHRyaWJ1dGUiLCJKU09OIiwicGFyc2UiLCJfZXJyb3IiLCJjb25zb2xlIiwiY3R4Iiwib25jZSIsIl9iYXNlIiwiYmluZGluZ3MiLCJfcmVzdWx0cyIsInNwbGljZSIsInBhY2VPcHRpb25zIiwiX3N1cGVyIiwicHJvZ3Jlc3MiLCJnZXRFbGVtZW50IiwidGFyZ2V0RWxlbWVudCIsImZpcnN0Q2hpbGQiLCJpbnNlcnRCZWZvcmUiLCJhcHBlbmRDaGlsZCIsImZpbmlzaCIsInVwZGF0ZSIsInByb2ciLCJyZW5kZXIiLCJwcm9ncmVzc1N0ciIsInRyYW5zZm9ybSIsIl9qIiwiX2xlbjEiLCJfcmVmMiIsImxhc3RSZW5kZXJlZFByb2dyZXNzIiwic2V0QXR0cmlidXRlIiwiZG9uZSIsImJpbmRpbmciLCJYTUxIdHRwUmVxdWVzdCIsIlhEb21haW5SZXF1ZXN0IiwiV2ViU29ja2V0IiwiZnJvbSIsImlnbm9yZSIsInJldCIsInVuc2hpZnQiLCJzaGlmdCIsInRyYWNrIiwibW9uaXRvclhIUiIsInJlcSIsIl9vcGVuIiwidXJsIiwiYXN5bmMiLCJyZXF1ZXN0IiwiZmxhZ3MiLCJwcm90b2NvbHMiLCJfYXJnIiwiYWZ0ZXIiLCJydW5uaW5nIiwic3RpbGxBY3RpdmUiLCJfcmVmMyIsInJlYWR5U3RhdGUiLCJyZXN0YXJ0Iiwid2F0Y2giLCJ0cmFja2VyIiwic2l6ZSIsIl9vbnJlYWR5c3RhdGVjaGFuZ2UiLCJQcm9ncmVzc0V2ZW50IiwiYWRkRXZlbnRMaXN0ZW5lciIsImV2dCIsImxlbmd0aENvbXB1dGFibGUiLCJsb2FkZWQiLCJ0b3RhbCIsIm9ucmVhZHlzdGF0ZWNoYW5nZSIsImNoZWNrIiwic3RhdGVzIiwibG9hZGluZyIsImludGVyYWN0aXZlIiwiYXZnIiwicG9pbnRzIiwic2FtcGxlcyIsInNpbmNlTGFzdFVwZGF0ZSIsInJhdGUiLCJjYXRjaHVwIiwibGFzdFByb2dyZXNzIiwiZnJhbWVUaW1lIiwic2NhbGluZyIsInBvdyIsIm1pbiIsImhpc3RvcnkiLCJwdXNoU3RhdGUiLCJyZXBsYWNlU3RhdGUiLCJfayIsIl9sZW4yIiwiX3JlZjQiLCJleHRyYVNvdXJjZXMiLCJzdG9wIiwic3RhcnQiLCJnbyIsImVucXVldWVOZXh0RnJhbWUiLCJyZW1haW5pbmciLCJzY2FsZXIiLCJzY2FsZXJMaXN0IiwiZGVmaW5lIiwiYW1kIiwiZXhwb3J0cyIsIm1vZHVsZSIsIk1vZGVybml6ciIsInRvdWNoZXZlbnRzIiwibm90IiwiJHdyYXBwZXIiXSwibWFwcGluZ3MiOiI7Ozs7QUFBQTs7Ozs7O0FBTUEsSUFBSSxPQUFPQSxNQUFQLEtBQWtCLFdBQXRCLEVBQW1DO0FBQ2pDLFFBQU0sSUFBSUMsS0FBSixDQUFVLHlDQUFWLENBQU47QUFDRDs7QUFFRCxDQUFDLFVBQVVDLENBQVYsRUFBYTtBQUNaOztBQUNBLE1BQUlDLFVBQVVELEVBQUVFLEVBQUYsQ0FBS0MsTUFBTCxDQUFZQyxLQUFaLENBQWtCLEdBQWxCLEVBQXVCLENBQXZCLEVBQTBCQSxLQUExQixDQUFnQyxHQUFoQyxDQUFkO0FBQ0EsTUFBS0gsUUFBUSxDQUFSLElBQWEsQ0FBYixJQUFrQkEsUUFBUSxDQUFSLElBQWEsQ0FBaEMsSUFBdUNBLFFBQVEsQ0FBUixLQUFjLENBQWQsSUFBbUJBLFFBQVEsQ0FBUixLQUFjLENBQWpDLElBQXNDQSxRQUFRLENBQVIsSUFBYSxDQUExRixJQUFpR0EsUUFBUSxDQUFSLElBQWEsQ0FBbEgs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LENBQWVnWixNQUFmO0FBQ0gsS0FYRDs7QUFhQTtBQUNBL2tCLE1BQUUsaUNBQUYsRUFBcUMwQyxFQUFyQyxDQUF3QyxPQUF4QyxFQUFpRCxVQUFTZixLQUFULEVBQWdCO0FBQzdEM0IsVUFBRSx1QkFBRixFQUEyQjBLLFFBQTNCLENBQW9DLFFBQXBDO0FBQ0EvSSxjQUFNMEIsY0FBTjtBQUNILEtBSEQ7O0FBS0E7QUFDQXJELE1BQUUsc0JBQUYsRUFBMEIwQyxFQUExQixDQUE2QixPQUE3QixFQUFzQyxVQUFTZixLQUFULEVBQWdCO0FBQ2xELFlBQUlnd0IsV0FBVzN4QixFQUFFLElBQUYsRUFBUXViLE9BQVIsQ0FBZ0IsZUFBaEIsQ0FBZjtBQUNBb1csaUJBQVN2dUIsSUFBVCxDQUFjLHVCQUFkLEVBQXVDc0gsUUFBdkMsQ0FBZ0QsUUFBaEQ7QUFDQS9JLGNBQU0wQixjQUFOO0FBQ0gsS0FKRDtBQUtILENBcEVEIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIVxuICogQm9vdHN0cmFwIHYzLjQuMSAoaHR0cHM6Ly9nZXRib290c3RyYXAuY29tLylcbiAqIENvcHlyaWdodCAyMDExLTIwMTkgVHdpdHRlciwgSW5jLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlXG4gKi9cblxuaWYgKHR5cGVvZiBqUXVlcnkgPT09ICd1bmRlZmluZWQnKSB7XG4gIHRocm93IG5ldyBFcnJvcignQm9vdHN0cmFwXFwncyBKYXZhU2NyaXB0IHJlcXVpcmVzIGpRdWVyeScpXG59XG5cbitmdW5jdGlvbiAoJCkge1xuICAndXNlIHN0cmljdCc7XG4gIHZhciB2ZXJzaW9uID0gJC5mbi5qcXVlcnkuc3BsaXQoJyAnKVswXS5zcGxpdCgnLicpXG4gIGlmICgodmVyc2lvblswXSA8IDIgJiYgdmVyc2lvblsxXSA8IDkpIHx8ICh2ZXJzaW9uWzBdID09IDEgJiYgdmVyc2lvblsxXSA9PSA5ICYmIHZlcnNpb25bMl0gPCAxKSB8fCAodmVyc2lvblswXSA+IDMpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdCb290c3RyYXBcXCdzIEphdmFTY3JpcHQgcmVxdWlyZXMgalF1ZXJ5IHZlcnNpb24gMS45LjEgb3IgaGlnaGVyLCBidXQgbG93ZXIgdGhhbiB2ZXJzaW9uIDQnKVxuICB9XG59KGpRdWVyeSk7XG5cbi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogQm9vdHN0cmFwOiB0cmFuc2l0aW9uLmpzIHYzLjQuMVxuICogaHR0cHM6Ly9nZXRib290c3RyYXAuY29tL2RvY3MvMy40L2phdmFzY3JpcHQvI3RyYW5zaXRpb25zXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIENvcHlyaWdodCAyMDExLTIwMTkgVHdpdHRlciwgSW5jLlxuICogTGljZW5zZWQgdW5kZXIgTUlUIChodHRwczovL2dpdGh1Yi5jb20vdHdicy9ib290c3RyYXAvYmxvYi9tYXN0ZXIvTElDRU5TRSlcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqL1xuXG5cbitmdW5jdGlvbiAoJCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgLy8gQ1NTIFRSQU5TSVRJT04gU1VQUE9SVCAoU2hvdXRvdXQ6IGh0dHBzOi8vbW9kZXJuaXpyLmNvbS8pXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gIGZ1bmN0aW9uIHRyYW5zaXRpb25FbmQoKSB7XG4gICAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYm9vdHN0cmFwJylcblxuICAgIHZhciB0cmFuc0VuZEV2ZW50TmFtZXMgPSB7XG4gICAgICBXZWJraXRUcmFuc2l0aW9uIDogJ3dlYmtpdFRyYW5zaXRpb25FbmQnLFxuICAgICAgTW96VHJhbnNpdGlvbiAgICA6ICd0cmFuc2l0aW9uZW5kJyxcbiAgICAgIE9UcmFuc2l0aW9uICAgICAgOiAnb1RyYW5zaXRpb25FbmQgb3RyYW5zaXRpb25lbmQnLFxuICAgICAgdHJhbnNpdGlvbiAgICAgICA6ICd0cmFuc2l0aW9uZW5kJ1xuICAgIH1cblxuICAgIGZvciAodmFyIG5hbWUgaW4gdHJhbnNFbmRFdmVudE5hbWVzKSB7XG4gICAgICBpZiAoZWwuc3R5bGVbbmFtZV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4geyBlbmQ6IHRyYW5zRW5kRXZlbnROYW1lc1tuYW1lXSB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlIC8vIGV4cGxpY2l0IGZvciBpZTggKCAgLl8uKVxuICB9XG5cbiAgLy8gaHR0cHM6Ly9ibG9nLmFsZXhtYWNjYXcuY29tL2Nzcy10cmFuc2l0aW9uc1xuICAkLmZuLmVtdWxhdGVUcmFuc2l0aW9uRW5kID0gZnVuY3Rpb24gKGR1cmF0aW9uKSB7XG4gICAgdmFyIGNhbGxlZCA9IGZhbHNlXG4gICAgdmFyICRlbCA9IHRoaXNcbiAgICAkKHRoaXMpLm9uZSgnYnNUcmFuc2l0aW9uRW5kJywgZnVuY3Rpb24gKCkgeyBjYWxsZWQgPSB0cnVlIH0pXG4gICAgdmFyIGNhbGxiYWNrID0gZnVuY3Rpb24gKCkgeyBpZiAoIWNhbGxlZCkgJCgkZWwpLnRyaWdnZXIoJC5zdXBwb3J0LnRyYW5zaXRpb24uZW5kKSB9XG4gICAgc2V0VGltZW91dChjYWxsYmFjaywgZHVyYXRpb24pXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gICQoZnVuY3Rpb24gKCkge1xuICAgICQuc3VwcG9ydC50cmFuc2l0aW9uID0gdHJhbnNpdGlvbkVuZCgpXG5cbiAgICBpZiAoISQuc3VwcG9ydC50cmFuc2l0aW9uKSByZXR1cm5cblxuICAgICQuZXZlbnQuc3BlY2lhbC5ic1RyYW5zaXRpb25FbmQgPSB7XG4gICAgICBiaW5kVHlwZTogJC5zdXBwb3J0LnRyYW5zaXRpb24uZW5kLFxuICAgICAgZGVsZWdhdGVUeXBlOiAkLnN1cHBvcnQudHJhbnNpdGlvbi5lbmQsXG4gICAgICBoYW5kbGU6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGlmICgkKGUudGFyZ2V0KS5pcyh0aGlzKSkgcmV0dXJuIGUuaGFuZGxlT2JqLmhhbmRsZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICAgICAgfVxuICAgIH1cbiAgfSlcblxufShqUXVlcnkpO1xuXG4vKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIEJvb3RzdHJhcDogYWxlcnQuanMgdjMuNC4xXG4gKiBodHRwczovL2dldGJvb3RzdHJhcC5jb20vZG9jcy8zLjQvamF2YXNjcmlwdC8jYWxlcnRzXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIENvcHlyaWdodCAyMDExLTIwMTkgVHdpdHRlciwgSW5jLlxuICogTGljZW5zZWQgdW5kZXIgTUlUIChodHRwczovL2dpdGh1Yi5jb20vdHdicy9ib290c3RyYXAvYmxvYi9tYXN0ZXIvTElDRU5TRSlcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqL1xuXG5cbitmdW5jdGlvbiAoJCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgLy8gQUxFUlQgQ0xBU1MgREVGSU5JVElPTlxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09XG5cbiAgdmFyIGRpc21pc3MgPSAnW2RhdGEtZGlzbWlzcz1cImFsZXJ0XCJdJ1xuICB2YXIgQWxlcnQgICA9IGZ1bmN0aW9uIChlbCkge1xuICAgICQoZWwpLm9uKCdjbGljaycsIGRpc21pc3MsIHRoaXMuY2xvc2UpXG4gIH1cblxuICBBbGVydC5WRVJTSU9OID0gJzMuNC4xJ1xuXG4gIEFsZXJ0LlRSQU5TSVRJT05fRFVSQVRJT04gPSAxNTBcblxuICBBbGVydC5wcm90b3R5cGUuY2xvc2UgPSBmdW5jdGlvbiAoZSkge1xuICAgIHZhciAkdGhpcyAgICA9ICQodGhpcylcbiAgICB2YXIgc2VsZWN0b3IgPSAkdGhpcy5hdHRyKCdkYXRhLXRhcmdldCcpXG5cbiAgICBpZiAoIXNlbGVjdG9yKSB7XG4gICAgICBzZWxlY3RvciA9ICR0aGlzLmF0dHIoJ2hyZWYnKVxuICAgICAgc2VsZWN0b3IgPSBzZWxlY3RvciAmJiBzZWxlY3Rvci5yZXBsYWNlKC8uKig/PSNbXlxcc10qJCkvLCAnJykgLy8gc3RyaXAgZm9yIGllN1xuICAgIH1cblxuICAgIHNlbGVjdG9yICAgID0gc2VsZWN0b3IgPT09ICcjJyA/IFtdIDogc2VsZWN0b3JcbiAgICB2YXIgJHBhcmVudCA9ICQoZG9jdW1lbnQpLmZpbmQoc2VsZWN0b3IpXG5cbiAgICBpZiAoZSkgZS5wcmV2ZW50RGVmYXVsdCgpXG5cbiAgICBpZiAoISRwYXJlbnQubGVuZ3RoKSB7XG4gICAgICAkcGFyZW50ID0gJHRoaXMuY2xvc2VzdCgnLmFsZXJ0JylcbiAgICB9XG5cbiAgICAkcGFyZW50LnRyaWdnZXIoZSA9ICQuRXZlbnQoJ2Nsb3NlLmJzLmFsZXJ0JykpXG5cbiAgICBpZiAoZS5pc0RlZmF1bHRQcmV2ZW50ZWQoKSkgcmV0dXJuXG5cbiAgICAkcGFyZW50LnJlbW92ZUNsYXNzKCdpbicpXG5cbiAgICBmdW5jdGlvbiByZW1vdmVFbGVtZW50KCkge1xuICAgICAgLy8gZGV0YWNoIGZyb20gcGFyZW50LCBmaXJlIGV2ZW50IHRoZW4gY2xlYW4gdXAgZGF0YVxuICAgICAgJHBhcmVudC5kZXRhY2goKS50cmlnZ2VyKCdjbG9zZWQuYnMuYWxlcnQnKS5yZW1vdmUoKVxuICAgIH1cblxuICAgICQuc3VwcG9ydC50cmFuc2l0aW9uICYmICRwYXJlbnQuaGFzQ2xhc3MoJ2ZhZGUnKSA/XG4gICAgICAkcGFyZW50XG4gICAgICAgIC5vbmUoJ2JzVHJhbnNpdGlvbkVuZCcsIHJlbW92ZUVsZW1lbnQpXG4gICAgICAgIC5lbXVsYXRlVHJhbnNpdGlvbkVuZChBbGVydC5UUkFOU0lUSU9OX0RVUkFUSU9OKSA6XG4gICAgICByZW1vdmVFbGVtZW50KClcbiAgfVxuXG5cbiAgLy8gQUxFUlQgUExVR0lOIERFRklOSVRJT05cbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT1cblxuICBmdW5jdGlvbiBQbHVnaW4ob3B0aW9uKSB7XG4gICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgJHRoaXMgPSAkKHRoaXMpXG4gICAgICB2YXIgZGF0YSAgPSAkdGhpcy5kYXRhKCdicy5hbGVydCcpXG5cbiAgICAgIGlmICghZGF0YSkgJHRoaXMuZGF0YSgnYnMuYWxlcnQnLCAoZGF0YSA9IG5ldyBBbGVydCh0aGlzKSkpXG4gICAgICBpZiAodHlwZW9mIG9wdGlvbiA9PSAnc3RyaW5nJykgZGF0YVtvcHRpb25dLmNhbGwoJHRoaXMpXG4gICAgfSlcbiAgfVxuXG4gIHZhciBvbGQgPSAkLmZuLmFsZXJ0XG5cbiAgJC5mbi5hbGVydCAgICAgICAgICAgICA9IFBsdWdpblxuICAkLmZuLmFsZXJ0LkNvbnN0cnVjdG9yID0gQWxlcnRcblxuXG4gIC8vIEFMRVJUIE5PIENPTkZMSUNUXG4gIC8vID09PT09PT09PT09PT09PT09XG5cbiAgJC5mbi5hbGVydC5ub0NvbmZsaWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICQuZm4uYWxlcnQgPSBvbGRcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cblxuICAvLyBBTEVSVCBEQVRBLUFQSVxuICAvLyA9PT09PT09PT09PT09PVxuXG4gICQoZG9jdW1lbnQpLm9uKCdjbGljay5icy5hbGVydC5kYXRhLWFwaScsIGRpc21pc3MsIEFsZXJ0LnByb3RvdHlwZS5jbG9zZSlcblxufShqUXVlcnkpO1xuXG4vKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIEJvb3RzdHJhcDogYnV0dG9uLmpzIHYzLjQuMVxuICogaHR0cHM6Ly9nZXRib290c3RyYXAuY29tL2RvY3MvMy40L2phdmFzY3JpcHQvI2J1dHRvbnNcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogQ29weXJpZ2h0IDIwMTEtMjAxOSBUd2l0dGVyLCBJbmMuXG4gKiBMaWNlbnNlZCB1bmRlciBNSVQgKGh0dHBzOi8vZ2l0aHViLmNvbS90d2JzL2Jvb3RzdHJhcC9ibG9iL21hc3Rlci9MSUNFTlNFKVxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovXG5cblxuK2Z1bmN0aW9uICgkKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICAvLyBCVVRUT04gUFVCTElDIENMQVNTIERFRklOSVRJT05cbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgdmFyIEJ1dHRvbiA9IGZ1bmN0aW9uIChlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy4kZWxlbWVudCAgPSAkKGVsZW1lbnQpXG4gICAgdGhpcy5vcHRpb25zICAgPSAkLmV4dGVuZCh7fSwgQnV0dG9uLkRFRkFVTFRTLCBvcHRpb25zKVxuICAgIHRoaXMuaXNMb2FkaW5nID0gZmFsc2VcbiAgfVxuXG4gIEJ1dHRvbi5WRVJTSU9OICA9ICczLjQuMSdcblxuICBCdXR0b24uREVGQVVMVFMgPSB7XG4gICAgbG9hZGluZ1RleHQ6ICdsb2FkaW5nLi4uJ1xuICB9XG5cbiAgQnV0dG9uLnByb3RvdHlwZS5zZXRTdGF0ZSA9IGZ1bmN0aW9uIChzdGF0ZSkge1xuICAgIHZhciBkICAgID0gJ2Rpc2FibGVkJ1xuICAgIHZhciAkZWwgID0gdGhpcy4kZWxlbWVudFxuICAgIHZhciB2YWwgID0gJGVsLmlzKCdpbnB1dCcpID8gJ3ZhbCcgOiAnaHRtbCdcbiAgICB2YXIgZGF0YSA9ICRlbC5kYXRhKClcblxuICAgIHN0YXRlICs9ICdUZXh0J1xuXG4gICAgaWYgKGRhdGEucmVzZXRUZXh0ID09IG51bGwpICRlbC5kYXRhKCdyZXNldFRleHQnLCAkZWxbdmFsXSgpKVxuXG4gICAgLy8gcHVzaCB0byBldmVudCBsb29wIHRvIGFsbG93IGZvcm1zIHRvIHN1Ym1pdFxuICAgIHNldFRpbWVvdXQoJC5wcm94eShmdW5jdGlvbiAoKSB7XG4gICAgICAkZWxbdmFsXShkYXRhW3N0YXRlXSA9PSBudWxsID8gdGhpcy5vcHRpb25zW3N0YXRlXSA6IGRhdGFbc3RhdGVdKVxuXG4gICAgICBpZiAoc3RhdGUgPT0gJ2xvYWRpbmdUZXh0Jykge1xuICAgICAgICB0aGlzLmlzTG9hZGluZyA9IHRydWVcbiAgICAgICAgJGVsLmFkZENsYXNzKGQpLmF0dHIoZCwgZCkucHJvcChkLCB0cnVlKVxuICAgICAgfSBlbHNlIGlmICh0aGlzLmlzTG9hZGluZykge1xuICAgICAgICB0aGlzLmlzTG9hZGluZyA9IGZhbHNlXG4gICAgICAgICRlbC5yZW1vdmVDbGFzcyhkKS5yZW1vdmVBdHRyKGQpLnByb3AoZCwgZmFsc2UpXG4gICAgICB9XG4gICAgfSwgdGhpcyksIDApXG4gIH1cblxuICBCdXR0b24ucHJvdG90eXBlLnRvZ2dsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2hhbmdlZCA9IHRydWVcbiAgICB2YXIgJHBhcmVudCA9IHRoaXMuJGVsZW1lbnQuY2xvc2VzdCgnW2RhdGEtdG9nZ2xlPVwiYnV0dG9uc1wiXScpXG5cbiAgICBpZiAoJHBhcmVudC5sZW5ndGgpIHtcbiAgICAgIHZhciAkaW5wdXQgPSB0aGlzLiRlbGVtZW50LmZpbmQoJ2lucHV0JylcbiAgICAgIGlmICgkaW5wdXQucHJvcCgndHlwZScpID09ICdyYWRpbycpIHtcbiAgICAgICAgaWYgKCRpbnB1dC5wcm9wKCdjaGVja2VkJykpIGNoYW5nZWQgPSBmYWxzZVxuICAgICAgICAkcGFyZW50LmZpbmQoJy5hY3RpdmUnKS5yZW1vdmVDbGFzcygnYWN0aXZlJylcbiAgICAgICAgdGhpcy4kZWxlbWVudC5hZGRDbGFzcygnYWN0aXZlJylcbiAgICAgIH0gZWxzZSBpZiAoJGlucHV0LnByb3AoJ3R5cGUnKSA9PSAnY2hlY2tib3gnKSB7XG4gICAgICAgIGlmICgoJGlucHV0LnByb3AoJ2NoZWNrZWQnKSkgIT09IHRoaXMuJGVsZW1lbnQuaGFzQ2xhc3MoJ2FjdGl2ZScpKSBjaGFuZ2VkID0gZmFsc2VcbiAgICAgICAgdGhpcy4kZWxlbWVudC50b2dnbGVDbGFzcygnYWN0aXZlJylcbiAgICAgIH1cbiAgICAgICRpbnB1dC5wcm9wKCdjaGVja2VkJywgdGhpcy4kZWxlbWVudC5oYXNDbGFzcygnYWN0aXZlJykpXG4gICAgICBpZiAoY2hhbmdlZCkgJGlucHV0LnRyaWdnZXIoJ2NoYW5nZScpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuJGVsZW1lbnQuYXR0cignYXJpYS1wcmVzc2VkJywgIXRoaXMuJGVsZW1lbnQuaGFzQ2xhc3MoJ2FjdGl2ZScpKVxuICAgICAgdGhpcy4kZWxlbWVudC50b2dnbGVDbGFzcygnYWN0aXZlJylcbiAgICB9XG4gIH1cblxuXG4gIC8vIEJVVFRPTiBQTFVHSU4gREVGSU5JVElPTlxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT1cblxuICBmdW5jdGlvbiBQbHVnaW4ob3B0aW9uKSB7XG4gICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgJHRoaXMgICA9ICQodGhpcylcbiAgICAgIHZhciBkYXRhICAgID0gJHRoaXMuZGF0YSgnYnMuYnV0dG9uJylcbiAgICAgIHZhciBvcHRpb25zID0gdHlwZW9mIG9wdGlvbiA9PSAnb2JqZWN0JyAmJiBvcHRpb25cblxuICAgICAgaWYgKCFkYXRhKSAkdGhpcy5kYXRhKCdicy5idXR0b24nLCAoZGF0YSA9IG5ldyBCdXR0b24odGhpcywgb3B0aW9ucykpKVxuXG4gICAgICBpZiAob3B0aW9uID09ICd0b2dnbGUnKSBkYXRhLnRvZ2dsZSgpXG4gICAgICBlbHNlIGlmIChvcHRpb24pIGRhdGEuc2V0U3RhdGUob3B0aW9uKVxuICAgIH0pXG4gIH1cblxuICB2YXIgb2xkID0gJC5mbi5idXR0b25cblxuICAkLmZuLmJ1dHRvbiAgICAgICAgICAgICA9IFBsdWdpblxuICAkLmZuLmJ1dHRvbi5Db25zdHJ1Y3RvciA9IEJ1dHRvblxuXG5cbiAgLy8gQlVUVE9OIE5PIENPTkZMSUNUXG4gIC8vID09PT09PT09PT09PT09PT09PVxuXG4gICQuZm4uYnV0dG9uLm5vQ29uZmxpY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgJC5mbi5idXR0b24gPSBvbGRcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cblxuICAvLyBCVVRUT04gREFUQS1BUElcbiAgLy8gPT09PT09PT09PT09PT09XG5cbiAgJChkb2N1bWVudClcbiAgICAub24oJ2NsaWNrLmJzLmJ1dHRvbi5kYXRhLWFwaScsICdbZGF0YS10b2dnbGVePVwiYnV0dG9uXCJdJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgIHZhciAkYnRuID0gJChlLnRhcmdldCkuY2xvc2VzdCgnLmJ0bicpXG4gICAgICBQbHVnaW4uY2FsbCgkYnRuLCAndG9nZ2xlJylcbiAgICAgIGlmICghKCQoZS50YXJnZXQpLmlzKCdpbnB1dFt0eXBlPVwicmFkaW9cIl0sIGlucHV0W3R5cGU9XCJjaGVja2JveFwiXScpKSkge1xuICAgICAgICAvLyBQcmV2ZW50IGRvdWJsZSBjbGljayBvbiByYWRpb3MsIGFuZCB0aGUgZG91YmxlIHNlbGVjdGlvbnMgKHNvIGNhbmNlbGxhdGlvbikgb24gY2hlY2tib3hlc1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgLy8gVGhlIHRhcmdldCBjb21wb25lbnQgc3RpbGwgcmVjZWl2ZSB0aGUgZm9jdXNcbiAgICAgICAgaWYgKCRidG4uaXMoJ2lucHV0LGJ1dHRvbicpKSAkYnRuLnRyaWdnZXIoJ2ZvY3VzJylcbiAgICAgICAgZWxzZSAkYnRuLmZpbmQoJ2lucHV0OnZpc2libGUsYnV0dG9uOnZpc2libGUnKS5maXJzdCgpLnRyaWdnZXIoJ2ZvY3VzJylcbiAgICAgIH1cbiAgICB9KVxuICAgIC5vbignZm9jdXMuYnMuYnV0dG9uLmRhdGEtYXBpIGJsdXIuYnMuYnV0dG9uLmRhdGEtYXBpJywgJ1tkYXRhLXRvZ2dsZV49XCJidXR0b25cIl0nLCBmdW5jdGlvbiAoZSkge1xuICAgICAgJChlLnRhcmdldCkuY2xvc2VzdCgnLmJ0bicpLnRvZ2dsZUNsYXNzKCdmb2N1cycsIC9eZm9jdXMoaW4pPyQvLnRlc3QoZS50eXBlKSlcbiAgICB9KVxuXG59KGpRdWVyeSk7XG5cbi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogQm9vdHN0cmFwOiBjYXJvdXNlbC5qcyB2My40LjFcbiAqIGh0dHBzOi8vZ2V0Ym9vdHN0cmFwLmNvbS9kb2NzLzMuNC9qYXZhc2NyaXB0LyNjYXJvdXNlbFxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBDb3B5cmlnaHQgMjAxMS0yMDE5IFR3aXR0ZXIsIEluYy5cbiAqIExpY2Vuc2VkIHVuZGVyIE1JVCAoaHR0cHM6Ly9naXRodWIuY29tL3R3YnMvYm9vdHN0cmFwL2Jsb2IvbWFzdGVyL0xJQ0VOU0UpXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi9cblxuXG4rZnVuY3Rpb24gKCQpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIC8vIENBUk9VU0VMIENMQVNTIERFRklOSVRJT05cbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gIHZhciBDYXJvdXNlbCA9IGZ1bmN0aW9uIChlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy4kZWxlbWVudCAgICA9ICQoZWxlbWVudClcbiAgICB0aGlzLiRpbmRpY2F0b3JzID0gdGhpcy4kZWxlbWVudC5maW5kKCcuY2Fyb3VzZWwtaW5kaWNhdG9ycycpXG4gICAgdGhpcy5vcHRpb25zICAgICA9IG9wdGlvbnNcbiAgICB0aGlzLnBhdXNlZCAgICAgID0gbnVsbFxuICAgIHRoaXMuc2xpZGluZyAgICAgPSBudWxsXG4gICAgdGhpcy5pbnRlcnZhbCAgICA9IG51bGxcbiAgICB0aGlzLiRhY3RpdmUgICAgID0gbnVsbFxuICAgIHRoaXMuJGl0ZW1zICAgICAgPSBudWxsXG5cbiAgICB0aGlzLm9wdGlvbnMua2V5Ym9hcmQgJiYgdGhpcy4kZWxlbWVudC5vbigna2V5ZG93bi5icy5jYXJvdXNlbCcsICQucHJveHkodGhpcy5rZXlkb3duLCB0aGlzKSlcblxuICAgIHRoaXMub3B0aW9ucy5wYXVzZSA9PSAnaG92ZXInICYmICEoJ29udG91Y2hzdGFydCcgaW4gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50KSAmJiB0aGlzLiRlbGVtZW50XG4gICAgICAub24oJ21vdXNlZW50ZXIuYnMuY2Fyb3VzZWwnLCAkLnByb3h5KHRoaXMucGF1c2UsIHRoaXMpKVxuICAgICAgLm9uKCdtb3VzZWxlYXZlLmJzLmNhcm91c2VsJywgJC5wcm94eSh0aGlzLmN5Y2xlLCB0aGlzKSlcbiAgfVxuXG4gIENhcm91c2VsLlZFUlNJT04gID0gJzMuNC4xJ1xuXG4gIENhcm91c2VsLlRSQU5TSVRJT05fRFVSQVRJT04gPSA2MDBcblxuICBDYXJvdXNlbC5ERUZBVUxUUyA9IHtcbiAgICBpbnRlcnZhbDogNTAwMCxcbiAgICBwYXVzZTogJ2hvdmVyJyxcbiAgICB3cmFwOiB0cnVlLFxuICAgIGtleWJvYXJkOiB0cnVlXG4gIH1cblxuICBDYXJvdXNlbC5wcm90b3R5cGUua2V5ZG93biA9IGZ1bmN0aW9uIChlKSB7XG4gICAgaWYgKC9pbnB1dHx0ZXh0YXJlYS9pLnRlc3QoZS50YXJnZXQudGFnTmFtZSkpIHJldHVyblxuICAgIHN3aXRjaCAoZS53aGljaCkge1xuICAgICAgY2FzZSAzNzogdGhpcy5wcmV2KCk7IGJyZWFrXG4gICAgICBjYXNlIDM5OiB0aGlzLm5leHQoKTsgYnJlYWtcbiAgICAgIGRlZmF1bHQ6IHJldHVyblxuICAgIH1cblxuICAgIGUucHJldmVudERlZmF1bHQoKVxuICB9XG5cbiAgQ2Fyb3VzZWwucHJvdG90eXBlLmN5Y2xlID0gZnVuY3Rpb24gKGUpIHtcbiAgICBlIHx8ICh0aGlzLnBhdXNlZCA9IGZhbHNlKVxuXG4gICAgdGhpcy5pbnRlcnZhbCAmJiBjbGVhckludGVydmFsKHRoaXMuaW50ZXJ2YWwpXG5cbiAgICB0aGlzLm9wdGlvbnMuaW50ZXJ2YWxcbiAgICAgICYmICF0aGlzLnBhdXNlZFxuICAgICAgJiYgKHRoaXMuaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCgkLnByb3h5KHRoaXMubmV4dCwgdGhpcyksIHRoaXMub3B0aW9ucy5pbnRlcnZhbCkpXG5cbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgQ2Fyb3VzZWwucHJvdG90eXBlLmdldEl0ZW1JbmRleCA9IGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgdGhpcy4kaXRlbXMgPSBpdGVtLnBhcmVudCgpLmNoaWxkcmVuKCcuaXRlbScpXG4gICAgcmV0dXJuIHRoaXMuJGl0ZW1zLmluZGV4KGl0ZW0gfHwgdGhpcy4kYWN0aXZlKVxuICB9XG5cbiAgQ2Fyb3VzZWwucHJvdG90eXBlLmdldEl0ZW1Gb3JEaXJlY3Rpb24gPSBmdW5jdGlvbiAoZGlyZWN0aW9uLCBhY3RpdmUpIHtcbiAgICB2YXIgYWN0aXZlSW5kZXggPSB0aGlzLmdldEl0ZW1JbmRleChhY3RpdmUpXG4gICAgdmFyIHdpbGxXcmFwID0gKGRpcmVjdGlvbiA9PSAncHJldicgJiYgYWN0aXZlSW5kZXggPT09IDApXG4gICAgICAgICAgICAgICAgfHwgKGRpcmVjdGlvbiA9PSAnbmV4dCcgJiYgYWN0aXZlSW5kZXggPT0gKHRoaXMuJGl0ZW1zLmxlbmd0aCAtIDEpKVxuICAgIGlmICh3aWxsV3JhcCAmJiAhdGhpcy5vcHRpb25zLndyYXApIHJldHVybiBhY3RpdmVcbiAgICB2YXIgZGVsdGEgPSBkaXJlY3Rpb24gPT0gJ3ByZXYnID8gLTEgOiAxXG4gICAgdmFyIGl0ZW1JbmRleCA9IChhY3RpdmVJbmRleCArIGRlbHRhKSAlIHRoaXMuJGl0ZW1zLmxlbmd0aFxuICAgIHJldHVybiB0aGlzLiRpdGVtcy5lcShpdGVtSW5kZXgpXG4gIH1cblxuICBDYXJvdXNlbC5wcm90b3R5cGUudG8gPSBmdW5jdGlvbiAocG9zKSB7XG4gICAgdmFyIHRoYXQgICAgICAgID0gdGhpc1xuICAgIHZhciBhY3RpdmVJbmRleCA9IHRoaXMuZ2V0SXRlbUluZGV4KHRoaXMuJGFjdGl2ZSA9IHRoaXMuJGVsZW1lbnQuZmluZCgnLml0ZW0uYWN0aXZlJykpXG5cbiAgICBpZiAocG9zID4gKHRoaXMuJGl0ZW1zLmxlbmd0aCAtIDEpIHx8IHBvcyA8IDApIHJldHVyblxuXG4gICAgaWYgKHRoaXMuc2xpZGluZykgICAgICAgcmV0dXJuIHRoaXMuJGVsZW1lbnQub25lKCdzbGlkLmJzLmNhcm91c2VsJywgZnVuY3Rpb24gKCkgeyB0aGF0LnRvKHBvcykgfSkgLy8geWVzLCBcInNsaWRcIlxuICAgIGlmIChhY3RpdmVJbmRleCA9PSBwb3MpIHJldHVybiB0aGlzLnBhdXNlKCkuY3ljbGUoKVxuXG4gICAgcmV0dXJuIHRoaXMuc2xpZGUocG9zID4gYWN0aXZlSW5kZXggPyAnbmV4dCcgOiAncHJldicsIHRoaXMuJGl0ZW1zLmVxKHBvcykpXG4gIH1cblxuICBDYXJvdXNlbC5wcm90b3R5cGUucGF1c2UgPSBmdW5jdGlvbiAoZSkge1xuICAgIGUgfHwgKHRoaXMucGF1c2VkID0gdHJ1ZSlcblxuICAgIGlmICh0aGlzLiRlbGVtZW50LmZpbmQoJy5uZXh0LCAucHJldicpLmxlbmd0aCAmJiAkLnN1cHBvcnQudHJhbnNpdGlvbikge1xuICAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCQuc3VwcG9ydC50cmFuc2l0aW9uLmVuZClcbiAgICAgIHRoaXMuY3ljbGUodHJ1ZSlcbiAgICB9XG5cbiAgICB0aGlzLmludGVydmFsID0gY2xlYXJJbnRlcnZhbCh0aGlzLmludGVydmFsKVxuXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIENhcm91c2VsLnByb3RvdHlwZS5uZXh0ID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLnNsaWRpbmcpIHJldHVyblxuICAgIHJldHVybiB0aGlzLnNsaWRlKCduZXh0JylcbiAgfVxuXG4gIENhcm91c2VsLnByb3RvdHlwZS5wcmV2ID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLnNsaWRpbmcpIHJldHVyblxuICAgIHJldHVybiB0aGlzLnNsaWRlKCdwcmV2JylcbiAgfVxuXG4gIENhcm91c2VsLnByb3RvdHlwZS5zbGlkZSA9IGZ1bmN0aW9uICh0eXBlLCBuZXh0KSB7XG4gICAgdmFyICRhY3RpdmUgICA9IHRoaXMuJGVsZW1lbnQuZmluZCgnLml0ZW0uYWN0aXZlJylcbiAgICB2YXIgJG5leHQgICAgID0gbmV4dCB8fCB0aGlzLmdldEl0ZW1Gb3JEaXJlY3Rpb24odHlwZSwgJGFjdGl2ZSlcbiAgICB2YXIgaXNDeWNsaW5nID0gdGhpcy5pbnRlcnZhbFxuICAgIHZhciBkaXJlY3Rpb24gPSB0eXBlID09ICduZXh0JyA/ICdsZWZ0JyA6ICdyaWdodCdcbiAgICB2YXIgdGhhdCAgICAgID0gdGhpc1xuXG4gICAgaWYgKCRuZXh0Lmhhc0NsYXNzKCdhY3RpdmUnKSkgcmV0dXJuICh0aGlzLnNsaWRpbmcgPSBmYWxzZSlcblxuICAgIHZhciByZWxhdGVkVGFyZ2V0ID0gJG5leHRbMF1cbiAgICB2YXIgc2xpZGVFdmVudCA9ICQuRXZlbnQoJ3NsaWRlLmJzLmNhcm91c2VsJywge1xuICAgICAgcmVsYXRlZFRhcmdldDogcmVsYXRlZFRhcmdldCxcbiAgICAgIGRpcmVjdGlvbjogZGlyZWN0aW9uXG4gICAgfSlcbiAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoc2xpZGVFdmVudClcbiAgICBpZiAoc2xpZGVFdmVudC5pc0RlZmF1bHRQcmV2ZW50ZWQoKSkgcmV0dXJuXG5cbiAgICB0aGlzLnNsaWRpbmcgPSB0cnVlXG5cbiAgICBpc0N5Y2xpbmcgJiYgdGhpcy5wYXVzZSgpXG5cbiAgICBpZiAodGhpcy4kaW5kaWNhdG9ycy5sZW5ndGgpIHtcbiAgICAgIHRoaXMuJGluZGljYXRvcnMuZmluZCgnLmFjdGl2ZScpLnJlbW92ZUNsYXNzKCdhY3RpdmUnKVxuICAgICAgdmFyICRuZXh0SW5kaWNhdG9yID0gJCh0aGlzLiRpbmRpY2F0b3JzLmNoaWxkcmVuKClbdGhpcy5nZXRJdGVtSW5kZXgoJG5leHQpXSlcbiAgICAgICRuZXh0SW5kaWNhdG9yICYmICRuZXh0SW5kaWNhdG9yLmFkZENsYXNzKCdhY3RpdmUnKVxuICAgIH1cblxuICAgIHZhciBzbGlkRXZlbnQgPSAkLkV2ZW50KCdzbGlkLmJzLmNhcm91c2VsJywgeyByZWxhdGVkVGFyZ2V0OiByZWxhdGVkVGFyZ2V0LCBkaXJlY3Rpb246IGRpcmVjdGlvbiB9KSAvLyB5ZXMsIFwic2xpZFwiXG4gICAgaWYgKCQuc3VwcG9ydC50cmFuc2l0aW9uICYmIHRoaXMuJGVsZW1lbnQuaGFzQ2xhc3MoJ3NsaWRlJykpIHtcbiAgICAgICRuZXh0LmFkZENsYXNzKHR5cGUpXG4gICAgICBpZiAodHlwZW9mICRuZXh0ID09PSAnb2JqZWN0JyAmJiAkbmV4dC5sZW5ndGgpIHtcbiAgICAgICAgJG5leHRbMF0ub2Zmc2V0V2lkdGggLy8gZm9yY2UgcmVmbG93XG4gICAgICB9XG4gICAgICAkYWN0aXZlLmFkZENsYXNzKGRpcmVjdGlvbilcbiAgICAgICRuZXh0LmFkZENsYXNzKGRpcmVjdGlvbilcbiAgICAgICRhY3RpdmVcbiAgICAgICAgLm9uZSgnYnNUcmFuc2l0aW9uRW5kJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICRuZXh0LnJlbW92ZUNsYXNzKFt0eXBlLCBkaXJlY3Rpb25dLmpvaW4oJyAnKSkuYWRkQ2xhc3MoJ2FjdGl2ZScpXG4gICAgICAgICAgJGFjdGl2ZS5yZW1vdmVDbGFzcyhbJ2FjdGl2ZScsIGRpcmVjdGlvbl0uam9pbignICcpKVxuICAgICAgICAgIHRoYXQuc2xpZGluZyA9IGZhbHNlXG4gICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGF0LiRlbGVtZW50LnRyaWdnZXIoc2xpZEV2ZW50KVxuICAgICAgICAgIH0sIDApXG4gICAgICAgIH0pXG4gICAgICAgIC5lbXVsYXRlVHJhbnNpdGlvbkVuZChDYXJvdXNlbC5UUkFOU0lUSU9OX0RVUkFUSU9OKVxuICAgIH0gZWxzZSB7XG4gICAgICAkYWN0aXZlLnJlbW92ZUNsYXNzKCdhY3RpdmUnKVxuICAgICAgJG5leHQuYWRkQ2xhc3MoJ2FjdGl2ZScpXG4gICAgICB0aGlzLnNsaWRpbmcgPSBmYWxzZVxuICAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKHNsaWRFdmVudClcbiAgICB9XG5cbiAgICBpc0N5Y2xpbmcgJiYgdGhpcy5jeWNsZSgpXG5cbiAgICByZXR1cm4gdGhpc1xuICB9XG5cblxuICAvLyBDQVJPVVNFTCBQTFVHSU4gREVGSU5JVElPTlxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gIGZ1bmN0aW9uIFBsdWdpbihvcHRpb24pIHtcbiAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciAkdGhpcyAgID0gJCh0aGlzKVxuICAgICAgdmFyIGRhdGEgICAgPSAkdGhpcy5kYXRhKCdicy5jYXJvdXNlbCcpXG4gICAgICB2YXIgb3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBDYXJvdXNlbC5ERUZBVUxUUywgJHRoaXMuZGF0YSgpLCB0eXBlb2Ygb3B0aW9uID09ICdvYmplY3QnICYmIG9wdGlvbilcbiAgICAgIHZhciBhY3Rpb24gID0gdHlwZW9mIG9wdGlvbiA9PSAnc3RyaW5nJyA/IG9wdGlvbiA6IG9wdGlvbnMuc2xpZGVcblxuICAgICAgaWYgKCFkYXRhKSAkdGhpcy5kYXRhKCdicy5jYXJvdXNlbCcsIChkYXRhID0gbmV3IENhcm91c2VsKHRoaXMsIG9wdGlvbnMpKSlcbiAgICAgIGlmICh0eXBlb2Ygb3B0aW9uID09ICdudW1iZXInKSBkYXRhLnRvKG9wdGlvbilcbiAgICAgIGVsc2UgaWYgKGFjdGlvbikgZGF0YVthY3Rpb25dKClcbiAgICAgIGVsc2UgaWYgKG9wdGlvbnMuaW50ZXJ2YWwpIGRhdGEucGF1c2UoKS5jeWNsZSgpXG4gICAgfSlcbiAgfVxuXG4gIHZhciBvbGQgPSAkLmZuLmNhcm91c2VsXG5cbiAgJC5mbi5jYXJvdXNlbCAgICAgICAgICAgICA9IFBsdWdpblxuICAkLmZuLmNhcm91c2VsLkNvbnN0cnVjdG9yID0gQ2Fyb3VzZWxcblxuXG4gIC8vIENBUk9VU0VMIE5PIENPTkZMSUNUXG4gIC8vID09PT09PT09PT09PT09PT09PT09XG5cbiAgJC5mbi5jYXJvdXNlbC5ub0NvbmZsaWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICQuZm4uY2Fyb3VzZWwgPSBvbGRcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cblxuICAvLyBDQVJPVVNFTCBEQVRBLUFQSVxuICAvLyA9PT09PT09PT09PT09PT09PVxuXG4gIHZhciBjbGlja0hhbmRsZXIgPSBmdW5jdGlvbiAoZSkge1xuICAgIHZhciAkdGhpcyAgID0gJCh0aGlzKVxuICAgIHZhciBocmVmICAgID0gJHRoaXMuYXR0cignaHJlZicpXG4gICAgaWYgKGhyZWYpIHtcbiAgICAgIGhyZWYgPSBocmVmLnJlcGxhY2UoLy4qKD89I1teXFxzXSskKS8sICcnKSAvLyBzdHJpcCBmb3IgaWU3XG4gICAgfVxuXG4gICAgdmFyIHRhcmdldCAgPSAkdGhpcy5hdHRyKCdkYXRhLXRhcmdldCcpIHx8IGhyZWZcbiAgICB2YXIgJHRhcmdldCA9ICQoZG9jdW1lbnQpLmZpbmQodGFyZ2V0KVxuXG4gICAgaWYgKCEkdGFyZ2V0Lmhhc0NsYXNzKCdjYXJvdXNlbCcpKSByZXR1cm5cblxuICAgIHZhciBvcHRpb25zID0gJC5leHRlbmQoe30sICR0YXJnZXQuZGF0YSgpLCAkdGhpcy5kYXRhKCkpXG4gICAgdmFyIHNsaWRlSW5kZXggPSAkdGhpcy5hdHRyKCdkYXRhLXNsaWRlLXRvJylcbiAgICBpZiAoc2xpZGVJbmRleCkgb3B0aW9ucy5pbnRlcnZhbCA9IGZhbHNlXG5cbiAgICBQbHVnaW4uY2FsbCgkdGFyZ2V0LCBvcHRpb25zKVxuXG4gICAgaWYgKHNsaWRlSW5kZXgpIHtcbiAgICAgICR0YXJnZXQuZGF0YSgnYnMuY2Fyb3VzZWwnKS50byhzbGlkZUluZGV4KVxuICAgIH1cblxuICAgIGUucHJldmVudERlZmF1bHQoKVxuICB9XG5cbiAgJChkb2N1bWVudClcbiAgICAub24oJ2NsaWNrLmJzLmNhcm91c2VsLmRhdGEtYXBpJywgJ1tkYXRhLXNsaWRlXScsIGNsaWNrSGFuZGxlcilcbiAgICAub24oJ2NsaWNrLmJzLmNhcm91c2VsLmRhdGEtYXBpJywgJ1tkYXRhLXNsaWRlLXRvXScsIGNsaWNrSGFuZGxlcilcblxuICAkKHdpbmRvdykub24oJ2xvYWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgJCgnW2RhdGEtcmlkZT1cImNhcm91c2VsXCJdJykuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgJGNhcm91c2VsID0gJCh0aGlzKVxuICAgICAgUGx1Z2luLmNhbGwoJGNhcm91c2VsLCAkY2Fyb3VzZWwuZGF0YSgpKVxuICAgIH0pXG4gIH0pXG5cbn0oalF1ZXJ5KTtcblxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBCb290c3RyYXA6IGNvbGxhcHNlLmpzIHYzLjQuMVxuICogaHR0cHM6Ly9nZXRib290c3RyYXAuY29tL2RvY3MvMy40L2phdmFzY3JpcHQvI2NvbGxhcHNlXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIENvcHlyaWdodCAyMDExLTIwMTkgVHdpdHRlciwgSW5jLlxuICogTGljZW5zZWQgdW5kZXIgTUlUIChodHRwczovL2dpdGh1Yi5jb20vdHdicy9ib290c3RyYXAvYmxvYi9tYXN0ZXIvTElDRU5TRSlcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqL1xuXG4vKiBqc2hpbnQgbGF0ZWRlZjogZmFsc2UgKi9cblxuK2Z1bmN0aW9uICgkKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICAvLyBDT0xMQVBTRSBQVUJMSUMgQ0xBU1MgREVGSU5JVElPTlxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gIHZhciBDb2xsYXBzZSA9IGZ1bmN0aW9uIChlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy4kZWxlbWVudCAgICAgID0gJChlbGVtZW50KVxuICAgIHRoaXMub3B0aW9ucyAgICAgICA9ICQuZXh0ZW5kKHt9LCBDb2xsYXBzZS5ERUZBVUxUUywgb3B0aW9ucylcbiAgICB0aGlzLiR0cmlnZ2VyICAgICAgPSAkKCdbZGF0YS10b2dnbGU9XCJjb2xsYXBzZVwiXVtocmVmPVwiIycgKyBlbGVtZW50LmlkICsgJ1wiXSwnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICdbZGF0YS10b2dnbGU9XCJjb2xsYXBzZVwiXVtkYXRhLXRhcmdldD1cIiMnICsgZWxlbWVudC5pZCArICdcIl0nKVxuICAgIHRoaXMudHJhbnNpdGlvbmluZyA9IG51bGxcblxuICAgIGlmICh0aGlzLm9wdGlvbnMucGFyZW50KSB7XG4gICAgICB0aGlzLiRwYXJlbnQgPSB0aGlzLmdldFBhcmVudCgpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuYWRkQXJpYUFuZENvbGxhcHNlZENsYXNzKHRoaXMuJGVsZW1lbnQsIHRoaXMuJHRyaWdnZXIpXG4gICAgfVxuXG4gICAgaWYgKHRoaXMub3B0aW9ucy50b2dnbGUpIHRoaXMudG9nZ2xlKClcbiAgfVxuXG4gIENvbGxhcHNlLlZFUlNJT04gID0gJzMuNC4xJ1xuXG4gIENvbGxhcHNlLlRSQU5TSVRJT05fRFVSQVRJT04gPSAzNTBcblxuICBDb2xsYXBzZS5ERUZBVUxUUyA9IHtcbiAgICB0b2dnbGU6IHRydWVcbiAgfVxuXG4gIENvbGxhcHNlLnByb3RvdHlwZS5kaW1lbnNpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGhhc1dpZHRoID0gdGhpcy4kZWxlbWVudC5oYXNDbGFzcygnd2lkdGgnKVxuICAgIHJldHVybiBoYXNXaWR0aCA/ICd3aWR0aCcgOiAnaGVpZ2h0J1xuICB9XG5cbiAgQ29sbGFwc2UucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMudHJhbnNpdGlvbmluZyB8fCB0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKCdpbicpKSByZXR1cm5cblxuICAgIHZhciBhY3RpdmVzRGF0YVxuICAgIHZhciBhY3RpdmVzID0gdGhpcy4kcGFyZW50ICYmIHRoaXMuJHBhcmVudC5jaGlsZHJlbignLnBhbmVsJykuY2hpbGRyZW4oJy5pbiwgLmNvbGxhcHNpbmcnKVxuXG4gICAgaWYgKGFjdGl2ZXMgJiYgYWN0aXZlcy5sZW5ndGgpIHtcbiAgICAgIGFjdGl2ZXNEYXRhID0gYWN0aXZlcy5kYXRhKCdicy5jb2xsYXBzZScpXG4gICAgICBpZiAoYWN0aXZlc0RhdGEgJiYgYWN0aXZlc0RhdGEudHJhbnNpdGlvbmluZykgcmV0dXJuXG4gICAgfVxuXG4gICAgdmFyIHN0YXJ0RXZlbnQgPSAkLkV2ZW50KCdzaG93LmJzLmNvbGxhcHNlJylcbiAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoc3RhcnRFdmVudClcbiAgICBpZiAoc3RhcnRFdmVudC5pc0RlZmF1bHRQcmV2ZW50ZWQoKSkgcmV0dXJuXG5cbiAgICBpZiAoYWN0aXZlcyAmJiBhY3RpdmVzLmxlbmd0aCkge1xuICAgICAgUGx1Z2luLmNhbGwoYWN0aXZlcywgJ2hpZGUnKVxuICAgICAgYWN0aXZlc0RhdGEgfHwgYWN0aXZlcy5kYXRhKCdicy5jb2xsYXBzZScsIG51bGwpXG4gICAgfVxuXG4gICAgdmFyIGRpbWVuc2lvbiA9IHRoaXMuZGltZW5zaW9uKClcblxuICAgIHRoaXMuJGVsZW1lbnRcbiAgICAgIC5yZW1vdmVDbGFzcygnY29sbGFwc2UnKVxuICAgICAgLmFkZENsYXNzKCdjb2xsYXBzaW5nJylbZGltZW5zaW9uXSgwKVxuICAgICAgLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCB0cnVlKVxuXG4gICAgdGhpcy4kdHJpZ2dlclxuICAgICAgLnJlbW92ZUNsYXNzKCdjb2xsYXBzZWQnKVxuICAgICAgLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCB0cnVlKVxuXG4gICAgdGhpcy50cmFuc2l0aW9uaW5nID0gMVxuXG4gICAgdmFyIGNvbXBsZXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy4kZWxlbWVudFxuICAgICAgICAucmVtb3ZlQ2xhc3MoJ2NvbGxhcHNpbmcnKVxuICAgICAgICAuYWRkQ2xhc3MoJ2NvbGxhcHNlIGluJylbZGltZW5zaW9uXSgnJylcbiAgICAgIHRoaXMudHJhbnNpdGlvbmluZyA9IDBcbiAgICAgIHRoaXMuJGVsZW1lbnRcbiAgICAgICAgLnRyaWdnZXIoJ3Nob3duLmJzLmNvbGxhcHNlJylcbiAgICB9XG5cbiAgICBpZiAoISQuc3VwcG9ydC50cmFuc2l0aW9uKSByZXR1cm4gY29tcGxldGUuY2FsbCh0aGlzKVxuXG4gICAgdmFyIHNjcm9sbFNpemUgPSAkLmNhbWVsQ2FzZShbJ3Njcm9sbCcsIGRpbWVuc2lvbl0uam9pbignLScpKVxuXG4gICAgdGhpcy4kZWxlbWVudFxuICAgICAgLm9uZSgnYnNUcmFuc2l0aW9uRW5kJywgJC5wcm94eShjb21wbGV0ZSwgdGhpcykpXG4gICAgICAuZW11bGF0ZVRyYW5zaXRpb25FbmQoQ29sbGFwc2UuVFJBTlNJVElPTl9EVVJBVElPTilbZGltZW5zaW9uXSh0aGlzLiRlbGVtZW50WzBdW3Njcm9sbFNpemVdKVxuICB9XG5cbiAgQ29sbGFwc2UucHJvdG90eXBlLmhpZGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMudHJhbnNpdGlvbmluZyB8fCAhdGhpcy4kZWxlbWVudC5oYXNDbGFzcygnaW4nKSkgcmV0dXJuXG5cbiAgICB2YXIgc3RhcnRFdmVudCA9ICQuRXZlbnQoJ2hpZGUuYnMuY29sbGFwc2UnKVxuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcihzdGFydEV2ZW50KVxuICAgIGlmIChzdGFydEV2ZW50LmlzRGVmYXVsdFByZXZlbnRlZCgpKSByZXR1cm5cblxuICAgIHZhciBkaW1lbnNpb24gPSB0aGlzLmRpbWVuc2lvbigpXG5cbiAgICB0aGlzLiRlbGVtZW50W2RpbWVuc2lvbl0odGhpcy4kZWxlbWVudFtkaW1lbnNpb25dKCkpWzBdLm9mZnNldEhlaWdodFxuXG4gICAgdGhpcy4kZWxlbWVudFxuICAgICAgLmFkZENsYXNzKCdjb2xsYXBzaW5nJylcbiAgICAgIC5yZW1vdmVDbGFzcygnY29sbGFwc2UgaW4nKVxuICAgICAgLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCBmYWxzZSlcblxuICAgIHRoaXMuJHRyaWdnZXJcbiAgICAgIC5hZGRDbGFzcygnY29sbGFwc2VkJylcbiAgICAgIC5hdHRyKCdhcmlhLWV4cGFuZGVkJywgZmFsc2UpXG5cbiAgICB0aGlzLnRyYW5zaXRpb25pbmcgPSAxXG5cbiAgICB2YXIgY29tcGxldGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLnRyYW5zaXRpb25pbmcgPSAwXG4gICAgICB0aGlzLiRlbGVtZW50XG4gICAgICAgIC5yZW1vdmVDbGFzcygnY29sbGFwc2luZycpXG4gICAgICAgIC5hZGRDbGFzcygnY29sbGFwc2UnKVxuICAgICAgICAudHJpZ2dlcignaGlkZGVuLmJzLmNvbGxhcHNlJylcbiAgICB9XG5cbiAgICBpZiAoISQuc3VwcG9ydC50cmFuc2l0aW9uKSByZXR1cm4gY29tcGxldGUuY2FsbCh0aGlzKVxuXG4gICAgdGhpcy4kZWxlbWVudFxuICAgICAgW2RpbWVuc2lvbl0oMClcbiAgICAgIC5vbmUoJ2JzVHJhbnNpdGlvbkVuZCcsICQucHJveHkoY29tcGxldGUsIHRoaXMpKVxuICAgICAgLmVtdWxhdGVUcmFuc2l0aW9uRW5kKENvbGxhcHNlLlRSQU5TSVRJT05fRFVSQVRJT04pXG4gIH1cblxuICBDb2xsYXBzZS5wcm90b3R5cGUudG9nZ2xlID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXNbdGhpcy4kZWxlbWVudC5oYXNDbGFzcygnaW4nKSA/ICdoaWRlJyA6ICdzaG93J10oKVxuICB9XG5cbiAgQ29sbGFwc2UucHJvdG90eXBlLmdldFBhcmVudCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gJChkb2N1bWVudCkuZmluZCh0aGlzLm9wdGlvbnMucGFyZW50KVxuICAgICAgLmZpbmQoJ1tkYXRhLXRvZ2dsZT1cImNvbGxhcHNlXCJdW2RhdGEtcGFyZW50PVwiJyArIHRoaXMub3B0aW9ucy5wYXJlbnQgKyAnXCJdJylcbiAgICAgIC5lYWNoKCQucHJveHkoZnVuY3Rpb24gKGksIGVsZW1lbnQpIHtcbiAgICAgICAgdmFyICRlbGVtZW50ID0gJChlbGVtZW50KVxuICAgICAgICB0aGlzLmFkZEFyaWFBbmRDb2xsYXBzZWRDbGFzcyhnZXRUYXJnZXRGcm9tVHJpZ2dlcigkZWxlbWVudCksICRlbGVtZW50KVxuICAgICAgfSwgdGhpcykpXG4gICAgICAuZW5kKClcbiAgfVxuXG4gIENvbGxhcHNlLnByb3RvdHlwZS5hZGRBcmlhQW5kQ29sbGFwc2VkQ2xhc3MgPSBmdW5jdGlvbiAoJGVsZW1lbnQsICR0cmlnZ2VyKSB7XG4gICAgdmFyIGlzT3BlbiA9ICRlbGVtZW50Lmhhc0NsYXNzKCdpbicpXG5cbiAgICAkZWxlbWVudC5hdHRyKCdhcmlhLWV4cGFuZGVkJywgaXNPcGVuKVxuICAgICR0cmlnZ2VyXG4gICAgICAudG9nZ2xlQ2xhc3MoJ2NvbGxhcHNlZCcsICFpc09wZW4pXG4gICAgICAuYXR0cignYXJpYS1leHBhbmRlZCcsIGlzT3BlbilcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldFRhcmdldEZyb21UcmlnZ2VyKCR0cmlnZ2VyKSB7XG4gICAgdmFyIGhyZWZcbiAgICB2YXIgdGFyZ2V0ID0gJHRyaWdnZXIuYXR0cignZGF0YS10YXJnZXQnKVxuICAgICAgfHwgKGhyZWYgPSAkdHJpZ2dlci5hdHRyKCdocmVmJykpICYmIGhyZWYucmVwbGFjZSgvLiooPz0jW15cXHNdKyQpLywgJycpIC8vIHN0cmlwIGZvciBpZTdcblxuICAgIHJldHVybiAkKGRvY3VtZW50KS5maW5kKHRhcmdldClcbiAgfVxuXG5cbiAgLy8gQ09MTEFQU0UgUExVR0lOIERFRklOSVRJT05cbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICBmdW5jdGlvbiBQbHVnaW4ob3B0aW9uKSB7XG4gICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgJHRoaXMgICA9ICQodGhpcylcbiAgICAgIHZhciBkYXRhICAgID0gJHRoaXMuZGF0YSgnYnMuY29sbGFwc2UnKVxuICAgICAgdmFyIG9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgQ29sbGFwc2UuREVGQVVMVFMsICR0aGlzLmRhdGEoKSwgdHlwZW9mIG9wdGlvbiA9PSAnb2JqZWN0JyAmJiBvcHRpb24pXG5cbiAgICAgIGlmICghZGF0YSAmJiBvcHRpb25zLnRvZ2dsZSAmJiAvc2hvd3xoaWRlLy50ZXN0KG9wdGlvbikpIG9wdGlvbnMudG9nZ2xlID0gZmFsc2VcbiAgICAgIGlmICghZGF0YSkgJHRoaXMuZGF0YSgnYnMuY29sbGFwc2UnLCAoZGF0YSA9IG5ldyBDb2xsYXBzZSh0aGlzLCBvcHRpb25zKSkpXG4gICAgICBpZiAodHlwZW9mIG9wdGlvbiA9PSAnc3RyaW5nJykgZGF0YVtvcHRpb25dKClcbiAgICB9KVxuICB9XG5cbiAgdmFyIG9sZCA9ICQuZm4uY29sbGFwc2VcblxuICAkLmZuLmNvbGxhcHNlICAgICAgICAgICAgID0gUGx1Z2luXG4gICQuZm4uY29sbGFwc2UuQ29uc3RydWN0b3IgPSBDb2xsYXBzZVxuXG5cbiAgLy8gQ09MTEFQU0UgTk8gQ09ORkxJQ1RcbiAgLy8gPT09PT09PT09PT09PT09PT09PT1cblxuICAkLmZuLmNvbGxhcHNlLm5vQ29uZmxpY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgJC5mbi5jb2xsYXBzZSA9IG9sZFxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuXG4gIC8vIENPTExBUFNFIERBVEEtQVBJXG4gIC8vID09PT09PT09PT09PT09PT09XG5cbiAgJChkb2N1bWVudCkub24oJ2NsaWNrLmJzLmNvbGxhcHNlLmRhdGEtYXBpJywgJ1tkYXRhLXRvZ2dsZT1cImNvbGxhcHNlXCJdJywgZnVuY3Rpb24gKGUpIHtcbiAgICB2YXIgJHRoaXMgICA9ICQodGhpcylcblxuICAgIGlmICghJHRoaXMuYXR0cignZGF0YS10YXJnZXQnKSkgZS5wcmV2ZW50RGVmYXVsdCgpXG5cbiAgICB2YXIgJHRhcmdldCA9IGdldFRhcmdldEZyb21UcmlnZ2VyKCR0aGlzKVxuICAgIHZhciBkYXRhICAgID0gJHRhcmdldC5kYXRhKCdicy5jb2xsYXBzZScpXG4gICAgdmFyIG9wdGlvbiAgPSBkYXRhID8gJ3RvZ2dsZScgOiAkdGhpcy5kYXRhKClcblxuICAgIFBsdWdpbi5jYWxsKCR0YXJnZXQsIG9wdGlvbilcbiAgfSlcblxufShqUXVlcnkpO1xuXG4vKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIEJvb3RzdHJhcDogZHJvcGRvd24uanMgdjMuNC4xXG4gKiBodHRwczovL2dldGJvb3RzdHJhcC5jb20vZG9jcy8zLjQvamF2YXNjcmlwdC8jZHJvcGRvd25zXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIENvcHlyaWdodCAyMDExLTIwMTkgVHdpdHRlciwgSW5jLlxuICogTGljZW5zZWQgdW5kZXIgTUlUIChodHRwczovL2dpdGh1Yi5jb20vdHdicy9ib290c3RyYXAvYmxvYi9tYXN0ZXIvTElDRU5TRSlcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqL1xuXG5cbitmdW5jdGlvbiAoJCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgLy8gRFJPUERPV04gQ0xBU1MgREVGSU5JVElPTlxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgdmFyIGJhY2tkcm9wID0gJy5kcm9wZG93bi1iYWNrZHJvcCdcbiAgdmFyIHRvZ2dsZSAgID0gJ1tkYXRhLXRvZ2dsZT1cImRyb3Bkb3duXCJdJ1xuICB2YXIgRHJvcGRvd24gPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICQoZWxlbWVudCkub24oJ2NsaWNrLmJzLmRyb3Bkb3duJywgdGhpcy50b2dnbGUpXG4gIH1cblxuICBEcm9wZG93bi5WRVJTSU9OID0gJzMuNC4xJ1xuXG4gIGZ1bmN0aW9uIGdldFBhcmVudCgkdGhpcykge1xuICAgIHZhciBzZWxlY3RvciA9ICR0aGlzLmF0dHIoJ2RhdGEtdGFyZ2V0JylcblxuICAgIGlmICghc2VsZWN0b3IpIHtcbiAgICAgIHNlbGVjdG9yID0gJHRoaXMuYXR0cignaHJlZicpXG4gICAgICBzZWxlY3RvciA9IHNlbGVjdG9yICYmIC8jW0EtWmEtel0vLnRlc3Qoc2VsZWN0b3IpICYmIHNlbGVjdG9yLnJlcGxhY2UoLy4qKD89I1teXFxzXSokKS8sICcnKSAvLyBzdHJpcCBmb3IgaWU3XG4gICAgfVxuXG4gICAgdmFyICRwYXJlbnQgPSBzZWxlY3RvciAhPT0gJyMnID8gJChkb2N1bWVudCkuZmluZChzZWxlY3RvcikgOiBudWxsXG5cbiAgICByZXR1cm4gJHBhcmVudCAmJiAkcGFyZW50Lmxlbmd0aCA/ICRwYXJlbnQgOiAkdGhpcy5wYXJlbnQoKVxuICB9XG5cbiAgZnVuY3Rpb24gY2xlYXJNZW51cyhlKSB7XG4gICAgaWYgKGUgJiYgZS53aGljaCA9PT0gMykgcmV0dXJuXG4gICAgJChiYWNrZHJvcCkucmVtb3ZlKClcbiAgICAkKHRvZ2dsZSkuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgJHRoaXMgICAgICAgICA9ICQodGhpcylcbiAgICAgIHZhciAkcGFyZW50ICAgICAgID0gZ2V0UGFyZW50KCR0aGlzKVxuICAgICAgdmFyIHJlbGF0ZWRUYXJnZXQgPSB7IHJlbGF0ZWRUYXJnZXQ6IHRoaXMgfVxuXG4gICAgICBpZiAoISRwYXJlbnQuaGFzQ2xhc3MoJ29wZW4nKSkgcmV0dXJuXG5cbiAgICAgIGlmIChlICYmIGUudHlwZSA9PSAnY2xpY2snICYmIC9pbnB1dHx0ZXh0YXJlYS9pLnRlc3QoZS50YXJnZXQudGFnTmFtZSkgJiYgJC5jb250YWlucygkcGFyZW50WzBdLCBlLnRhcmdldCkpIHJldHVyblxuXG4gICAgICAkcGFyZW50LnRyaWdnZXIoZSA9ICQuRXZlbnQoJ2hpZGUuYnMuZHJvcGRvd24nLCByZWxhdGVkVGFyZ2V0KSlcblxuICAgICAgaWYgKGUuaXNEZWZhdWx0UHJldmVudGVkKCkpIHJldHVyblxuXG4gICAgICAkdGhpcy5hdHRyKCdhcmlhLWV4cGFuZGVkJywgJ2ZhbHNlJylcbiAgICAgICRwYXJlbnQucmVtb3ZlQ2xhc3MoJ29wZW4nKS50cmlnZ2VyKCQuRXZlbnQoJ2hpZGRlbi5icy5kcm9wZG93bicsIHJlbGF0ZWRUYXJnZXQpKVxuICAgIH0pXG4gIH1cblxuICBEcm9wZG93bi5wcm90b3R5cGUudG9nZ2xlID0gZnVuY3Rpb24gKGUpIHtcbiAgICB2YXIgJHRoaXMgPSAkKHRoaXMpXG5cbiAgICBpZiAoJHRoaXMuaXMoJy5kaXNhYmxlZCwgOmRpc2FibGVkJykpIHJldHVyblxuXG4gICAgdmFyICRwYXJlbnQgID0gZ2V0UGFyZW50KCR0aGlzKVxuICAgIHZhciBpc0FjdGl2ZSA9ICRwYXJlbnQuaGFzQ2xhc3MoJ29wZW4nKVxuXG4gICAgY2xlYXJNZW51cygpXG5cbiAgICBpZiAoIWlzQWN0aXZlKSB7XG4gICAgICBpZiAoJ29udG91Y2hzdGFydCcgaW4gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50ICYmICEkcGFyZW50LmNsb3Nlc3QoJy5uYXZiYXItbmF2JykubGVuZ3RoKSB7XG4gICAgICAgIC8vIGlmIG1vYmlsZSB3ZSB1c2UgYSBiYWNrZHJvcCBiZWNhdXNlIGNsaWNrIGV2ZW50cyBkb24ndCBkZWxlZ2F0ZVxuICAgICAgICAkKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpKVxuICAgICAgICAgIC5hZGRDbGFzcygnZHJvcGRvd24tYmFja2Ryb3AnKVxuICAgICAgICAgIC5pbnNlcnRBZnRlcigkKHRoaXMpKVxuICAgICAgICAgIC5vbignY2xpY2snLCBjbGVhck1lbnVzKVxuICAgICAgfVxuXG4gICAgICB2YXIgcmVsYXRlZFRhcmdldCA9IHsgcmVsYXRlZFRhcmdldDogdGhpcyB9XG4gICAgICAkcGFyZW50LnRyaWdnZXIoZSA9ICQuRXZlbnQoJ3Nob3cuYnMuZHJvcGRvd24nLCByZWxhdGVkVGFyZ2V0KSlcblxuICAgICAgaWYgKGUuaXNEZWZhdWx0UHJldmVudGVkKCkpIHJldHVyblxuXG4gICAgICAkdGhpc1xuICAgICAgICAudHJpZ2dlcignZm9jdXMnKVxuICAgICAgICAuYXR0cignYXJpYS1leHBhbmRlZCcsICd0cnVlJylcblxuICAgICAgJHBhcmVudFxuICAgICAgICAudG9nZ2xlQ2xhc3MoJ29wZW4nKVxuICAgICAgICAudHJpZ2dlcigkLkV2ZW50KCdzaG93bi5icy5kcm9wZG93bicsIHJlbGF0ZWRUYXJnZXQpKVxuICAgIH1cblxuICAgIHJldHVybiBmYWxzZVxuICB9XG5cbiAgRHJvcGRvd24ucHJvdG90eXBlLmtleWRvd24gPSBmdW5jdGlvbiAoZSkge1xuICAgIGlmICghLygzOHw0MHwyN3wzMikvLnRlc3QoZS53aGljaCkgfHwgL2lucHV0fHRleHRhcmVhL2kudGVzdChlLnRhcmdldC50YWdOYW1lKSkgcmV0dXJuXG5cbiAgICB2YXIgJHRoaXMgPSAkKHRoaXMpXG5cbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpXG5cbiAgICBpZiAoJHRoaXMuaXMoJy5kaXNhYmxlZCwgOmRpc2FibGVkJykpIHJldHVyblxuXG4gICAgdmFyICRwYXJlbnQgID0gZ2V0UGFyZW50KCR0aGlzKVxuICAgIHZhciBpc0FjdGl2ZSA9ICRwYXJlbnQuaGFzQ2xhc3MoJ29wZW4nKVxuXG4gICAgaWYgKCFpc0FjdGl2ZSAmJiBlLndoaWNoICE9IDI3IHx8IGlzQWN0aXZlICYmIGUud2hpY2ggPT0gMjcpIHtcbiAgICAgIGlmIChlLndoaWNoID09IDI3KSAkcGFyZW50LmZpbmQodG9nZ2xlKS50cmlnZ2VyKCdmb2N1cycpXG4gICAgICByZXR1cm4gJHRoaXMudHJpZ2dlcignY2xpY2snKVxuICAgIH1cblxuICAgIHZhciBkZXNjID0gJyBsaTpub3QoLmRpc2FibGVkKTp2aXNpYmxlIGEnXG4gICAgdmFyICRpdGVtcyA9ICRwYXJlbnQuZmluZCgnLmRyb3Bkb3duLW1lbnUnICsgZGVzYylcblxuICAgIGlmICghJGl0ZW1zLmxlbmd0aCkgcmV0dXJuXG5cbiAgICB2YXIgaW5kZXggPSAkaXRlbXMuaW5kZXgoZS50YXJnZXQpXG5cbiAgICBpZiAoZS53aGljaCA9PSAzOCAmJiBpbmRleCA+IDApICAgICAgICAgICAgICAgICBpbmRleC0tICAgICAgICAgLy8gdXBcbiAgICBpZiAoZS53aGljaCA9PSA0MCAmJiBpbmRleCA8ICRpdGVtcy5sZW5ndGggLSAxKSBpbmRleCsrICAgICAgICAgLy8gZG93blxuICAgIGlmICghfmluZGV4KSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4ID0gMFxuXG4gICAgJGl0ZW1zLmVxKGluZGV4KS50cmlnZ2VyKCdmb2N1cycpXG4gIH1cblxuXG4gIC8vIERST1BET1dOIFBMVUdJTiBERUZJTklUSU9OXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgZnVuY3Rpb24gUGx1Z2luKG9wdGlvbikge1xuICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgdmFyICR0aGlzID0gJCh0aGlzKVxuICAgICAgdmFyIGRhdGEgID0gJHRoaXMuZGF0YSgnYnMuZHJvcGRvd24nKVxuXG4gICAgICBpZiAoIWRhdGEpICR0aGlzLmRhdGEoJ2JzLmRyb3Bkb3duJywgKGRhdGEgPSBuZXcgRHJvcGRvd24odGhpcykpKVxuICAgICAgaWYgKHR5cGVvZiBvcHRpb24gPT0gJ3N0cmluZycpIGRhdGFbb3B0aW9uXS5jYWxsKCR0aGlzKVxuICAgIH0pXG4gIH1cblxuICB2YXIgb2xkID0gJC5mbi5kcm9wZG93blxuXG4gICQuZm4uZHJvcGRvd24gICAgICAgICAgICAgPSBQbHVnaW5cbiAgJC5mbi5kcm9wZG93bi5Db25zdHJ1Y3RvciA9IERyb3Bkb3duXG5cblxuICAvLyBEUk9QRE9XTiBOTyBDT05GTElDVFxuICAvLyA9PT09PT09PT09PT09PT09PT09PVxuXG4gICQuZm4uZHJvcGRvd24ubm9Db25mbGljdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAkLmZuLmRyb3Bkb3duID0gb2xkXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG5cbiAgLy8gQVBQTFkgVE8gU1RBTkRBUkQgRFJPUERPV04gRUxFTUVOVFNcbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICAkKGRvY3VtZW50KVxuICAgIC5vbignY2xpY2suYnMuZHJvcGRvd24uZGF0YS1hcGknLCBjbGVhck1lbnVzKVxuICAgIC5vbignY2xpY2suYnMuZHJvcGRvd24uZGF0YS1hcGknLCAnLmRyb3Bkb3duIGZvcm0nLCBmdW5jdGlvbiAoZSkgeyBlLnN0b3BQcm9wYWdhdGlvbigpIH0pXG4gICAgLm9uKCdjbGljay5icy5kcm9wZG93bi5kYXRhLWFwaScsIHRvZ2dsZSwgRHJvcGRvd24ucHJvdG90eXBlLnRvZ2dsZSlcbiAgICAub24oJ2tleWRvd24uYnMuZHJvcGRvd24uZGF0YS1hcGknLCB0b2dnbGUsIERyb3Bkb3duLnByb3RvdHlwZS5rZXlkb3duKVxuICAgIC5vbigna2V5ZG93bi5icy5kcm9wZG93bi5kYXRhLWFwaScsICcuZHJvcGRvd24tbWVudScsIERyb3Bkb3duLnByb3RvdHlwZS5rZXlkb3duKVxuXG59KGpRdWVyeSk7XG5cbi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogQm9vdHN0cmFwOiBtb2RhbC5qcyB2My40LjFcbiAqIGh0dHBzOi8vZ2V0Ym9vdHN0cmFwLmNvbS9kb2NzLzMuNC9qYXZhc2NyaXB0LyNtb2RhbHNcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogQ29weXJpZ2h0IDIwMTEtMjAxOSBUd2l0dGVyLCBJbmMuXG4gKiBMaWNlbnNlZCB1bmRlciBNSVQgKGh0dHBzOi8vZ2l0aHViLmNvbS90d2JzL2Jvb3RzdHJhcC9ibG9iL21hc3Rlci9MSUNFTlNFKVxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovXG5cblxuK2Z1bmN0aW9uICgkKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICAvLyBNT0RBTCBDTEFTUyBERUZJTklUSU9OXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT1cblxuICB2YXIgTW9kYWwgPSBmdW5jdGlvbiAoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnNcbiAgICB0aGlzLiRib2R5ID0gJChkb2N1bWVudC5ib2R5KVxuICAgIHRoaXMuJGVsZW1lbnQgPSAkKGVsZW1lbnQpXG4gICAgdGhpcy4kZGlhbG9nID0gdGhpcy4kZWxlbWVudC5maW5kKCcubW9kYWwtZGlhbG9nJylcbiAgICB0aGlzLiRiYWNrZHJvcCA9IG51bGxcbiAgICB0aGlzLmlzU2hvd24gPSBudWxsXG4gICAgdGhpcy5vcmlnaW5hbEJvZHlQYWQgPSBudWxsXG4gICAgdGhpcy5zY3JvbGxiYXJXaWR0aCA9IDBcbiAgICB0aGlzLmlnbm9yZUJhY2tkcm9wQ2xpY2sgPSBmYWxzZVxuICAgIHRoaXMuZml4ZWRDb250ZW50ID0gJy5uYXZiYXItZml4ZWQtdG9wLCAubmF2YmFyLWZpeGVkLWJvdHRvbSdcblxuICAgIGlmICh0aGlzLm9wdGlvbnMucmVtb3RlKSB7XG4gICAgICB0aGlzLiRlbGVtZW50XG4gICAgICAgIC5maW5kKCcubW9kYWwtY29udGVudCcpXG4gICAgICAgIC5sb2FkKHRoaXMub3B0aW9ucy5yZW1vdGUsICQucHJveHkoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignbG9hZGVkLmJzLm1vZGFsJylcbiAgICAgICAgfSwgdGhpcykpXG4gICAgfVxuICB9XG5cbiAgTW9kYWwuVkVSU0lPTiA9ICczLjQuMSdcblxuICBNb2RhbC5UUkFOU0lUSU9OX0RVUkFUSU9OID0gMzAwXG4gIE1vZGFsLkJBQ0tEUk9QX1RSQU5TSVRJT05fRFVSQVRJT04gPSAxNTBcblxuICBNb2RhbC5ERUZBVUxUUyA9IHtcbiAgICBiYWNrZHJvcDogdHJ1ZSxcbiAgICBrZXlib2FyZDogdHJ1ZSxcbiAgICBzaG93OiB0cnVlXG4gIH1cblxuICBNb2RhbC5wcm90b3R5cGUudG9nZ2xlID0gZnVuY3Rpb24gKF9yZWxhdGVkVGFyZ2V0KSB7XG4gICAgcmV0dXJuIHRoaXMuaXNTaG93biA/IHRoaXMuaGlkZSgpIDogdGhpcy5zaG93KF9yZWxhdGVkVGFyZ2V0KVxuICB9XG5cbiAgTW9kYWwucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiAoX3JlbGF0ZWRUYXJnZXQpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXNcbiAgICB2YXIgZSA9ICQuRXZlbnQoJ3Nob3cuYnMubW9kYWwnLCB7IHJlbGF0ZWRUYXJnZXQ6IF9yZWxhdGVkVGFyZ2V0IH0pXG5cbiAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoZSlcblxuICAgIGlmICh0aGlzLmlzU2hvd24gfHwgZS5pc0RlZmF1bHRQcmV2ZW50ZWQoKSkgcmV0dXJuXG5cbiAgICB0aGlzLmlzU2hvd24gPSB0cnVlXG5cbiAgICB0aGlzLmNoZWNrU2Nyb2xsYmFyKClcbiAgICB0aGlzLnNldFNjcm9sbGJhcigpXG4gICAgdGhpcy4kYm9keS5hZGRDbGFzcygnbW9kYWwtb3BlbicpXG5cbiAgICB0aGlzLmVzY2FwZSgpXG4gICAgdGhpcy5yZXNpemUoKVxuXG4gICAgdGhpcy4kZWxlbWVudC5vbignY2xpY2suZGlzbWlzcy5icy5tb2RhbCcsICdbZGF0YS1kaXNtaXNzPVwibW9kYWxcIl0nLCAkLnByb3h5KHRoaXMuaGlkZSwgdGhpcykpXG5cbiAgICB0aGlzLiRkaWFsb2cub24oJ21vdXNlZG93bi5kaXNtaXNzLmJzLm1vZGFsJywgZnVuY3Rpb24gKCkge1xuICAgICAgdGhhdC4kZWxlbWVudC5vbmUoJ21vdXNldXAuZGlzbWlzcy5icy5tb2RhbCcsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGlmICgkKGUudGFyZ2V0KS5pcyh0aGF0LiRlbGVtZW50KSkgdGhhdC5pZ25vcmVCYWNrZHJvcENsaWNrID0gdHJ1ZVxuICAgICAgfSlcbiAgICB9KVxuXG4gICAgdGhpcy5iYWNrZHJvcChmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgdHJhbnNpdGlvbiA9ICQuc3VwcG9ydC50cmFuc2l0aW9uICYmIHRoYXQuJGVsZW1lbnQuaGFzQ2xhc3MoJ2ZhZGUnKVxuXG4gICAgICBpZiAoIXRoYXQuJGVsZW1lbnQucGFyZW50KCkubGVuZ3RoKSB7XG4gICAgICAgIHRoYXQuJGVsZW1lbnQuYXBwZW5kVG8odGhhdC4kYm9keSkgLy8gZG9uJ3QgbW92ZSBtb2RhbHMgZG9tIHBvc2l0aW9uXG4gICAgICB9XG5cbiAgICAgIHRoYXQuJGVsZW1lbnRcbiAgICAgICAgLnNob3coKVxuICAgICAgICAuc2Nyb2xsVG9wKDApXG5cbiAgICAgIHRoYXQuYWRqdXN0RGlhbG9nKClcblxuICAgICAgaWYgKHRyYW5zaXRpb24pIHtcbiAgICAgICAgdGhhdC4kZWxlbWVudFswXS5vZmZzZXRXaWR0aCAvLyBmb3JjZSByZWZsb3dcbiAgICAgIH1cblxuICAgICAgdGhhdC4kZWxlbWVudC5hZGRDbGFzcygnaW4nKVxuXG4gICAgICB0aGF0LmVuZm9yY2VGb2N1cygpXG5cbiAgICAgIHZhciBlID0gJC5FdmVudCgnc2hvd24uYnMubW9kYWwnLCB7IHJlbGF0ZWRUYXJnZXQ6IF9yZWxhdGVkVGFyZ2V0IH0pXG5cbiAgICAgIHRyYW5zaXRpb24gP1xuICAgICAgICB0aGF0LiRkaWFsb2cgLy8gd2FpdCBmb3IgbW9kYWwgdG8gc2xpZGUgaW5cbiAgICAgICAgICAub25lKCdic1RyYW5zaXRpb25FbmQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGF0LiRlbGVtZW50LnRyaWdnZXIoJ2ZvY3VzJykudHJpZ2dlcihlKVxuICAgICAgICAgIH0pXG4gICAgICAgICAgLmVtdWxhdGVUcmFuc2l0aW9uRW5kKE1vZGFsLlRSQU5TSVRJT05fRFVSQVRJT04pIDpcbiAgICAgICAgdGhhdC4kZWxlbWVudC50cmlnZ2VyKCdmb2N1cycpLnRyaWdnZXIoZSlcbiAgICB9KVxuICB9XG5cbiAgTW9kYWwucHJvdG90eXBlLmhpZGUgPSBmdW5jdGlvbiAoZSkge1xuICAgIGlmIChlKSBlLnByZXZlbnREZWZhdWx0KClcblxuICAgIGUgPSAkLkV2ZW50KCdoaWRlLmJzLm1vZGFsJylcblxuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcihlKVxuXG4gICAgaWYgKCF0aGlzLmlzU2hvd24gfHwgZS5pc0RlZmF1bHRQcmV2ZW50ZWQoKSkgcmV0dXJuXG5cbiAgICB0aGlzLmlzU2hvd24gPSBmYWxzZVxuXG4gICAgdGhpcy5lc2NhcGUoKVxuICAgIHRoaXMucmVzaXplKClcblxuICAgICQoZG9jdW1lbnQpLm9mZignZm9jdXNpbi5icy5tb2RhbCcpXG5cbiAgICB0aGlzLiRlbGVtZW50XG4gICAgICAucmVtb3ZlQ2xhc3MoJ2luJylcbiAgICAgIC5vZmYoJ2NsaWNrLmRpc21pc3MuYnMubW9kYWwnKVxuICAgICAgLm9mZignbW91c2V1cC5kaXNtaXNzLmJzLm1vZGFsJylcblxuICAgIHRoaXMuJGRpYWxvZy5vZmYoJ21vdXNlZG93bi5kaXNtaXNzLmJzLm1vZGFsJylcblxuICAgICQuc3VwcG9ydC50cmFuc2l0aW9uICYmIHRoaXMuJGVsZW1lbnQuaGFzQ2xhc3MoJ2ZhZGUnKSA/XG4gICAgICB0aGlzLiRlbGVtZW50XG4gICAgICAgIC5vbmUoJ2JzVHJhbnNpdGlvbkVuZCcsICQucHJveHkodGhpcy5oaWRlTW9kYWwsIHRoaXMpKVxuICAgICAgICAuZW11bGF0ZVRyYW5zaXRpb25FbmQoTW9kYWwuVFJBTlNJVElPTl9EVVJBVElPTikgOlxuICAgICAgdGhpcy5oaWRlTW9kYWwoKVxuICB9XG5cbiAgTW9kYWwucHJvdG90eXBlLmVuZm9yY2VGb2N1cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAkKGRvY3VtZW50KVxuICAgICAgLm9mZignZm9jdXNpbi5icy5tb2RhbCcpIC8vIGd1YXJkIGFnYWluc3QgaW5maW5pdGUgZm9jdXMgbG9vcFxuICAgICAgLm9uKCdmb2N1c2luLmJzLm1vZGFsJywgJC5wcm94eShmdW5jdGlvbiAoZSkge1xuICAgICAgICBpZiAoZG9jdW1lbnQgIT09IGUudGFyZ2V0ICYmXG4gICAgICAgICAgdGhpcy4kZWxlbWVudFswXSAhPT0gZS50YXJnZXQgJiZcbiAgICAgICAgICAhdGhpcy4kZWxlbWVudC5oYXMoZS50YXJnZXQpLmxlbmd0aCkge1xuICAgICAgICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignZm9jdXMnKVxuICAgICAgICB9XG4gICAgICB9LCB0aGlzKSlcbiAgfVxuXG4gIE1vZGFsLnByb3RvdHlwZS5lc2NhcGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMuaXNTaG93biAmJiB0aGlzLm9wdGlvbnMua2V5Ym9hcmQpIHtcbiAgICAgIHRoaXMuJGVsZW1lbnQub24oJ2tleWRvd24uZGlzbWlzcy5icy5tb2RhbCcsICQucHJveHkoZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgZS53aGljaCA9PSAyNyAmJiB0aGlzLmhpZGUoKVxuICAgICAgfSwgdGhpcykpXG4gICAgfSBlbHNlIGlmICghdGhpcy5pc1Nob3duKSB7XG4gICAgICB0aGlzLiRlbGVtZW50Lm9mZigna2V5ZG93bi5kaXNtaXNzLmJzLm1vZGFsJylcbiAgICB9XG4gIH1cblxuICBNb2RhbC5wcm90b3R5cGUucmVzaXplID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLmlzU2hvd24pIHtcbiAgICAgICQod2luZG93KS5vbigncmVzaXplLmJzLm1vZGFsJywgJC5wcm94eSh0aGlzLmhhbmRsZVVwZGF0ZSwgdGhpcykpXG4gICAgfSBlbHNlIHtcbiAgICAgICQod2luZG93KS5vZmYoJ3Jlc2l6ZS5icy5tb2RhbCcpXG4gICAgfVxuICB9XG5cbiAgTW9kYWwucHJvdG90eXBlLmhpZGVNb2RhbCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXNcbiAgICB0aGlzLiRlbGVtZW50LmhpZGUoKVxuICAgIHRoaXMuYmFja2Ryb3AoZnVuY3Rpb24gKCkge1xuICAgICAgdGhhdC4kYm9keS5yZW1vdmVDbGFzcygnbW9kYWwtb3BlbicpXG4gICAgICB0aGF0LnJlc2V0QWRqdXN0bWVudHMoKVxuICAgICAgdGhhdC5yZXNldFNjcm9sbGJhcigpXG4gICAgICB0aGF0LiRlbGVtZW50LnRyaWdnZXIoJ2hpZGRlbi5icy5tb2RhbCcpXG4gICAgfSlcbiAgfVxuXG4gIE1vZGFsLnByb3RvdHlwZS5yZW1vdmVCYWNrZHJvcCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLiRiYWNrZHJvcCAmJiB0aGlzLiRiYWNrZHJvcC5yZW1vdmUoKVxuICAgIHRoaXMuJGJhY2tkcm9wID0gbnVsbFxuICB9XG5cbiAgTW9kYWwucHJvdG90eXBlLmJhY2tkcm9wID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzXG4gICAgdmFyIGFuaW1hdGUgPSB0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKCdmYWRlJykgPyAnZmFkZScgOiAnJ1xuXG4gICAgaWYgKHRoaXMuaXNTaG93biAmJiB0aGlzLm9wdGlvbnMuYmFja2Ryb3ApIHtcbiAgICAgIHZhciBkb0FuaW1hdGUgPSAkLnN1cHBvcnQudHJhbnNpdGlvbiAmJiBhbmltYXRlXG5cbiAgICAgIHRoaXMuJGJhY2tkcm9wID0gJChkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSlcbiAgICAgICAgLmFkZENsYXNzKCdtb2RhbC1iYWNrZHJvcCAnICsgYW5pbWF0ZSlcbiAgICAgICAgLmFwcGVuZFRvKHRoaXMuJGJvZHkpXG5cbiAgICAgIHRoaXMuJGVsZW1lbnQub24oJ2NsaWNrLmRpc21pc3MuYnMubW9kYWwnLCAkLnByb3h5KGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGlmICh0aGlzLmlnbm9yZUJhY2tkcm9wQ2xpY2spIHtcbiAgICAgICAgICB0aGlzLmlnbm9yZUJhY2tkcm9wQ2xpY2sgPSBmYWxzZVxuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIGlmIChlLnRhcmdldCAhPT0gZS5jdXJyZW50VGFyZ2V0KSByZXR1cm5cbiAgICAgICAgdGhpcy5vcHRpb25zLmJhY2tkcm9wID09ICdzdGF0aWMnXG4gICAgICAgICAgPyB0aGlzLiRlbGVtZW50WzBdLmZvY3VzKClcbiAgICAgICAgICA6IHRoaXMuaGlkZSgpXG4gICAgICB9LCB0aGlzKSlcblxuICAgICAgaWYgKGRvQW5pbWF0ZSkgdGhpcy4kYmFja2Ryb3BbMF0ub2Zmc2V0V2lkdGggLy8gZm9yY2UgcmVmbG93XG5cbiAgICAgIHRoaXMuJGJhY2tkcm9wLmFkZENsYXNzKCdpbicpXG5cbiAgICAgIGlmICghY2FsbGJhY2spIHJldHVyblxuXG4gICAgICBkb0FuaW1hdGUgP1xuICAgICAgICB0aGlzLiRiYWNrZHJvcFxuICAgICAgICAgIC5vbmUoJ2JzVHJhbnNpdGlvbkVuZCcsIGNhbGxiYWNrKVxuICAgICAgICAgIC5lbXVsYXRlVHJhbnNpdGlvbkVuZChNb2RhbC5CQUNLRFJPUF9UUkFOU0lUSU9OX0RVUkFUSU9OKSA6XG4gICAgICAgIGNhbGxiYWNrKClcblxuICAgIH0gZWxzZSBpZiAoIXRoaXMuaXNTaG93biAmJiB0aGlzLiRiYWNrZHJvcCkge1xuICAgICAgdGhpcy4kYmFja2Ryb3AucmVtb3ZlQ2xhc3MoJ2luJylcblxuICAgICAgdmFyIGNhbGxiYWNrUmVtb3ZlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGF0LnJlbW92ZUJhY2tkcm9wKClcbiAgICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2soKVxuICAgICAgfVxuICAgICAgJC5zdXBwb3J0LnRyYW5zaXRpb24gJiYgdGhpcy4kZWxlbWVudC5oYXNDbGFzcygnZmFkZScpID9cbiAgICAgICAgdGhpcy4kYmFja2Ryb3BcbiAgICAgICAgICAub25lKCdic1RyYW5zaXRpb25FbmQnLCBjYWxsYmFja1JlbW92ZSlcbiAgICAgICAgICAuZW11bGF0ZVRyYW5zaXRpb25FbmQoTW9kYWwuQkFDS0RST1BfVFJBTlNJVElPTl9EVVJBVElPTikgOlxuICAgICAgICBjYWxsYmFja1JlbW92ZSgpXG5cbiAgICB9IGVsc2UgaWYgKGNhbGxiYWNrKSB7XG4gICAgICBjYWxsYmFjaygpXG4gICAgfVxuICB9XG5cbiAgLy8gdGhlc2UgZm9sbG93aW5nIG1ldGhvZHMgYXJlIHVzZWQgdG8gaGFuZGxlIG92ZXJmbG93aW5nIG1vZGFsc1xuXG4gIE1vZGFsLnByb3RvdHlwZS5oYW5kbGVVcGRhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5hZGp1c3REaWFsb2coKVxuICB9XG5cbiAgTW9kYWwucHJvdG90eXBlLmFkanVzdERpYWxvZyA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbW9kYWxJc092ZXJmbG93aW5nID0gdGhpcy4kZWxlbWVudFswXS5zY3JvbGxIZWlnaHQgPiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0XG5cbiAgICB0aGlzLiRlbGVtZW50LmNzcyh7XG4gICAgICBwYWRkaW5nTGVmdDogIXRoaXMuYm9keUlzT3ZlcmZsb3dpbmcgJiYgbW9kYWxJc092ZXJmbG93aW5nID8gdGhpcy5zY3JvbGxiYXJXaWR0aCA6ICcnLFxuICAgICAgcGFkZGluZ1JpZ2h0OiB0aGlzLmJvZHlJc092ZXJmbG93aW5nICYmICFtb2RhbElzT3ZlcmZsb3dpbmcgPyB0aGlzLnNjcm9sbGJhcldpZHRoIDogJydcbiAgICB9KVxuICB9XG5cbiAgTW9kYWwucHJvdG90eXBlLnJlc2V0QWRqdXN0bWVudHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy4kZWxlbWVudC5jc3Moe1xuICAgICAgcGFkZGluZ0xlZnQ6ICcnLFxuICAgICAgcGFkZGluZ1JpZ2h0OiAnJ1xuICAgIH0pXG4gIH1cblxuICBNb2RhbC5wcm90b3R5cGUuY2hlY2tTY3JvbGxiYXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGZ1bGxXaW5kb3dXaWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoXG4gICAgaWYgKCFmdWxsV2luZG93V2lkdGgpIHsgLy8gd29ya2Fyb3VuZCBmb3IgbWlzc2luZyB3aW5kb3cuaW5uZXJXaWR0aCBpbiBJRThcbiAgICAgIHZhciBkb2N1bWVudEVsZW1lbnRSZWN0ID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgICBmdWxsV2luZG93V2lkdGggPSBkb2N1bWVudEVsZW1lbnRSZWN0LnJpZ2h0IC0gTWF0aC5hYnMoZG9jdW1lbnRFbGVtZW50UmVjdC5sZWZ0KVxuICAgIH1cbiAgICB0aGlzLmJvZHlJc092ZXJmbG93aW5nID0gZG9jdW1lbnQuYm9keS5jbGllbnRXaWR0aCA8IGZ1bGxXaW5kb3dXaWR0aFxuICAgIHRoaXMuc2Nyb2xsYmFyV2lkdGggPSB0aGlzLm1lYXN1cmVTY3JvbGxiYXIoKVxuICB9XG5cbiAgTW9kYWwucHJvdG90eXBlLnNldFNjcm9sbGJhciA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgYm9keVBhZCA9IHBhcnNlSW50KCh0aGlzLiRib2R5LmNzcygncGFkZGluZy1yaWdodCcpIHx8IDApLCAxMClcbiAgICB0aGlzLm9yaWdpbmFsQm9keVBhZCA9IGRvY3VtZW50LmJvZHkuc3R5bGUucGFkZGluZ1JpZ2h0IHx8ICcnXG4gICAgdmFyIHNjcm9sbGJhcldpZHRoID0gdGhpcy5zY3JvbGxiYXJXaWR0aFxuICAgIGlmICh0aGlzLmJvZHlJc092ZXJmbG93aW5nKSB7XG4gICAgICB0aGlzLiRib2R5LmNzcygncGFkZGluZy1yaWdodCcsIGJvZHlQYWQgKyBzY3JvbGxiYXJXaWR0aClcbiAgICAgICQodGhpcy5maXhlZENvbnRlbnQpLmVhY2goZnVuY3Rpb24gKGluZGV4LCBlbGVtZW50KSB7XG4gICAgICAgIHZhciBhY3R1YWxQYWRkaW5nID0gZWxlbWVudC5zdHlsZS5wYWRkaW5nUmlnaHRcbiAgICAgICAgdmFyIGNhbGN1bGF0ZWRQYWRkaW5nID0gJChlbGVtZW50KS5jc3MoJ3BhZGRpbmctcmlnaHQnKVxuICAgICAgICAkKGVsZW1lbnQpXG4gICAgICAgICAgLmRhdGEoJ3BhZGRpbmctcmlnaHQnLCBhY3R1YWxQYWRkaW5nKVxuICAgICAgICAgIC5jc3MoJ3BhZGRpbmctcmlnaHQnLCBwYXJzZUZsb2F0KGNhbGN1bGF0ZWRQYWRkaW5nKSArIHNjcm9sbGJhcldpZHRoICsgJ3B4JylcbiAgICAgIH0pXG4gICAgfVxuICB9XG5cbiAgTW9kYWwucHJvdG90eXBlLnJlc2V0U2Nyb2xsYmFyID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuJGJvZHkuY3NzKCdwYWRkaW5nLXJpZ2h0JywgdGhpcy5vcmlnaW5hbEJvZHlQYWQpXG4gICAgJCh0aGlzLmZpeGVkQ29udGVudCkuZWFjaChmdW5jdGlvbiAoaW5kZXgsIGVsZW1lbnQpIHtcbiAgICAgIHZhciBwYWRkaW5nID0gJChlbGVtZW50KS5kYXRhKCdwYWRkaW5nLXJpZ2h0JylcbiAgICAgICQoZWxlbWVudCkucmVtb3ZlRGF0YSgncGFkZGluZy1yaWdodCcpXG4gICAgICBlbGVtZW50LnN0eWxlLnBhZGRpbmdSaWdodCA9IHBhZGRpbmcgPyBwYWRkaW5nIDogJydcbiAgICB9KVxuICB9XG5cbiAgTW9kYWwucHJvdG90eXBlLm1lYXN1cmVTY3JvbGxiYXIgPSBmdW5jdGlvbiAoKSB7IC8vIHRoeCB3YWxzaFxuICAgIHZhciBzY3JvbGxEaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICAgIHNjcm9sbERpdi5jbGFzc05hbWUgPSAnbW9kYWwtc2Nyb2xsYmFyLW1lYXN1cmUnXG4gICAgdGhpcy4kYm9keS5hcHBlbmQoc2Nyb2xsRGl2KVxuICAgIHZhciBzY3JvbGxiYXJXaWR0aCA9IHNjcm9sbERpdi5vZmZzZXRXaWR0aCAtIHNjcm9sbERpdi5jbGllbnRXaWR0aFxuICAgIHRoaXMuJGJvZHlbMF0ucmVtb3ZlQ2hpbGQoc2Nyb2xsRGl2KVxuICAgIHJldHVybiBzY3JvbGxiYXJXaWR0aFxuICB9XG5cblxuICAvLyBNT0RBTCBQTFVHSU4gREVGSU5JVElPTlxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PVxuXG4gIGZ1bmN0aW9uIFBsdWdpbihvcHRpb24sIF9yZWxhdGVkVGFyZ2V0KSB7XG4gICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgJHRoaXMgPSAkKHRoaXMpXG4gICAgICB2YXIgZGF0YSA9ICR0aGlzLmRhdGEoJ2JzLm1vZGFsJylcbiAgICAgIHZhciBvcHRpb25zID0gJC5leHRlbmQoe30sIE1vZGFsLkRFRkFVTFRTLCAkdGhpcy5kYXRhKCksIHR5cGVvZiBvcHRpb24gPT0gJ29iamVjdCcgJiYgb3B0aW9uKVxuXG4gICAgICBpZiAoIWRhdGEpICR0aGlzLmRhdGEoJ2JzLm1vZGFsJywgKGRhdGEgPSBuZXcgTW9kYWwodGhpcywgb3B0aW9ucykpKVxuICAgICAgaWYgKHR5cGVvZiBvcHRpb24gPT0gJ3N0cmluZycpIGRhdGFbb3B0aW9uXShfcmVsYXRlZFRhcmdldClcbiAgICAgIGVsc2UgaWYgKG9wdGlvbnMuc2hvdykgZGF0YS5zaG93KF9yZWxhdGVkVGFyZ2V0KVxuICAgIH0pXG4gIH1cblxuICB2YXIgb2xkID0gJC5mbi5tb2RhbFxuXG4gICQuZm4ubW9kYWwgPSBQbHVnaW5cbiAgJC5mbi5tb2RhbC5Db25zdHJ1Y3RvciA9IE1vZGFsXG5cblxuICAvLyBNT0RBTCBOTyBDT05GTElDVFxuICAvLyA9PT09PT09PT09PT09PT09PVxuXG4gICQuZm4ubW9kYWwubm9Db25mbGljdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAkLmZuLm1vZGFsID0gb2xkXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG5cbiAgLy8gTU9EQUwgREFUQS1BUElcbiAgLy8gPT09PT09PT09PT09PT1cblxuICAkKGRvY3VtZW50KS5vbignY2xpY2suYnMubW9kYWwuZGF0YS1hcGknLCAnW2RhdGEtdG9nZ2xlPVwibW9kYWxcIl0nLCBmdW5jdGlvbiAoZSkge1xuICAgIHZhciAkdGhpcyA9ICQodGhpcylcbiAgICB2YXIgaHJlZiA9ICR0aGlzLmF0dHIoJ2hyZWYnKVxuICAgIHZhciB0YXJnZXQgPSAkdGhpcy5hdHRyKCdkYXRhLXRhcmdldCcpIHx8XG4gICAgICAoaHJlZiAmJiBocmVmLnJlcGxhY2UoLy4qKD89I1teXFxzXSskKS8sICcnKSkgLy8gc3RyaXAgZm9yIGllN1xuXG4gICAgdmFyICR0YXJnZXQgPSAkKGRvY3VtZW50KS5maW5kKHRhcmdldClcbiAgICB2YXIgb3B0aW9uID0gJHRhcmdldC5kYXRhKCdicy5tb2RhbCcpID8gJ3RvZ2dsZScgOiAkLmV4dGVuZCh7IHJlbW90ZTogIS8jLy50ZXN0KGhyZWYpICYmIGhyZWYgfSwgJHRhcmdldC5kYXRhKCksICR0aGlzLmRhdGEoKSlcblxuICAgIGlmICgkdGhpcy5pcygnYScpKSBlLnByZXZlbnREZWZhdWx0KClcblxuICAgICR0YXJnZXQub25lKCdzaG93LmJzLm1vZGFsJywgZnVuY3Rpb24gKHNob3dFdmVudCkge1xuICAgICAgaWYgKHNob3dFdmVudC5pc0RlZmF1bHRQcmV2ZW50ZWQoKSkgcmV0dXJuIC8vIG9ubHkgcmVnaXN0ZXIgZm9jdXMgcmVzdG9yZXIgaWYgbW9kYWwgd2lsbCBhY3R1YWxseSBnZXQgc2hvd25cbiAgICAgICR0YXJnZXQub25lKCdoaWRkZW4uYnMubW9kYWwnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICR0aGlzLmlzKCc6dmlzaWJsZScpICYmICR0aGlzLnRyaWdnZXIoJ2ZvY3VzJylcbiAgICAgIH0pXG4gICAgfSlcbiAgICBQbHVnaW4uY2FsbCgkdGFyZ2V0LCBvcHRpb24sIHRoaXMpXG4gIH0pXG5cbn0oalF1ZXJ5KTtcblxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBCb290c3RyYXA6IHRvb2x0aXAuanMgdjMuNC4xXG4gKiBodHRwczovL2dldGJvb3RzdHJhcC5jb20vZG9jcy8zLjQvamF2YXNjcmlwdC8jdG9vbHRpcFxuICogSW5zcGlyZWQgYnkgdGhlIG9yaWdpbmFsIGpRdWVyeS50aXBzeSBieSBKYXNvbiBGcmFtZVxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBDb3B5cmlnaHQgMjAxMS0yMDE5IFR3aXR0ZXIsIEluYy5cbiAqIExpY2Vuc2VkIHVuZGVyIE1JVCAoaHR0cHM6Ly9naXRodWIuY29tL3R3YnMvYm9vdHN0cmFwL2Jsb2IvbWFzdGVyL0xJQ0VOU0UpXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi9cblxuK2Z1bmN0aW9uICgkKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICB2YXIgRElTQUxMT1dFRF9BVFRSSUJVVEVTID0gWydzYW5pdGl6ZScsICd3aGl0ZUxpc3QnLCAnc2FuaXRpemVGbiddXG5cbiAgdmFyIHVyaUF0dHJzID0gW1xuICAgICdiYWNrZ3JvdW5kJyxcbiAgICAnY2l0ZScsXG4gICAgJ2hyZWYnLFxuICAgICdpdGVtdHlwZScsXG4gICAgJ2xvbmdkZXNjJyxcbiAgICAncG9zdGVyJyxcbiAgICAnc3JjJyxcbiAgICAneGxpbms6aHJlZidcbiAgXVxuXG4gIHZhciBBUklBX0FUVFJJQlVURV9QQVRURVJOID0gL15hcmlhLVtcXHctXSokL2lcblxuICB2YXIgRGVmYXVsdFdoaXRlbGlzdCA9IHtcbiAgICAvLyBHbG9iYWwgYXR0cmlidXRlcyBhbGxvd2VkIG9uIGFueSBzdXBwbGllZCBlbGVtZW50IGJlbG93LlxuICAgICcqJzogWydjbGFzcycsICdkaXInLCAnaWQnLCAnbGFuZycsICdyb2xlJywgQVJJQV9BVFRSSUJVVEVfUEFUVEVSTl0sXG4gICAgYTogWyd0YXJnZXQnLCAnaHJlZicsICd0aXRsZScsICdyZWwnXSxcbiAgICBhcmVhOiBbXSxcbiAgICBiOiBbXSxcbiAgICBicjogW10sXG4gICAgY29sOiBbXSxcbiAgICBjb2RlOiBbXSxcbiAgICBkaXY6IFtdLFxuICAgIGVtOiBbXSxcbiAgICBocjogW10sXG4gICAgaDE6IFtdLFxuICAgIGgyOiBbXSxcbiAgICBoMzogW10sXG4gICAgaDQ6IFtdLFxuICAgIGg1OiBbXSxcbiAgICBoNjogW10sXG4gICAgaTogW10sXG4gICAgaW1nOiBbJ3NyYycsICdhbHQnLCAndGl0bGUnLCAnd2lkdGgnLCAnaGVpZ2h0J10sXG4gICAgbGk6IFtdLFxuICAgIG9sOiBbXSxcbiAgICBwOiBbXSxcbiAgICBwcmU6IFtdLFxuICAgIHM6IFtdLFxuICAgIHNtYWxsOiBbXSxcbiAgICBzcGFuOiBbXSxcbiAgICBzdWI6IFtdLFxuICAgIHN1cDogW10sXG4gICAgc3Ryb25nOiBbXSxcbiAgICB1OiBbXSxcbiAgICB1bDogW11cbiAgfVxuXG4gIC8qKlxuICAgKiBBIHBhdHRlcm4gdGhhdCByZWNvZ25pemVzIGEgY29tbW9ubHkgdXNlZnVsIHN1YnNldCBvZiBVUkxzIHRoYXQgYXJlIHNhZmUuXG4gICAqXG4gICAqIFNob3V0b3V0IHRvIEFuZ3VsYXIgNyBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9hbmd1bGFyL2Jsb2IvNy4yLjQvcGFja2FnZXMvY29yZS9zcmMvc2FuaXRpemF0aW9uL3VybF9zYW5pdGl6ZXIudHNcbiAgICovXG4gIHZhciBTQUZFX1VSTF9QQVRURVJOID0gL14oPzooPzpodHRwcz98bWFpbHRvfGZ0cHx0ZWx8ZmlsZSk6fFteJjovPyNdKig/OlsvPyNdfCQpKS9naVxuXG4gIC8qKlxuICAgKiBBIHBhdHRlcm4gdGhhdCBtYXRjaGVzIHNhZmUgZGF0YSBVUkxzLiBPbmx5IG1hdGNoZXMgaW1hZ2UsIHZpZGVvIGFuZCBhdWRpbyB0eXBlcy5cbiAgICpcbiAgICogU2hvdXRvdXQgdG8gQW5ndWxhciA3IGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2FuZ3VsYXIvYmxvYi83LjIuNC9wYWNrYWdlcy9jb3JlL3NyYy9zYW5pdGl6YXRpb24vdXJsX3Nhbml0aXplci50c1xuICAgKi9cbiAgdmFyIERBVEFfVVJMX1BBVFRFUk4gPSAvXmRhdGE6KD86aW1hZ2VcXC8oPzpibXB8Z2lmfGpwZWd8anBnfHBuZ3x0aWZmfHdlYnApfHZpZGVvXFwvKD86bXBlZ3xtcDR8b2dnfHdlYm0pfGF1ZGlvXFwvKD86bXAzfG9nYXxvZ2d8b3B1cykpO2Jhc2U2NCxbYS16MC05Ky9dKz0qJC9pXG5cbiAgZnVuY3Rpb24gYWxsb3dlZEF0dHJpYnV0ZShhdHRyLCBhbGxvd2VkQXR0cmlidXRlTGlzdCkge1xuICAgIHZhciBhdHRyTmFtZSA9IGF0dHIubm9kZU5hbWUudG9Mb3dlckNhc2UoKVxuXG4gICAgaWYgKCQuaW5BcnJheShhdHRyTmFtZSwgYWxsb3dlZEF0dHJpYnV0ZUxpc3QpICE9PSAtMSkge1xuICAgICAgaWYgKCQuaW5BcnJheShhdHRyTmFtZSwgdXJpQXR0cnMpICE9PSAtMSkge1xuICAgICAgICByZXR1cm4gQm9vbGVhbihhdHRyLm5vZGVWYWx1ZS5tYXRjaChTQUZFX1VSTF9QQVRURVJOKSB8fCBhdHRyLm5vZGVWYWx1ZS5tYXRjaChEQVRBX1VSTF9QQVRURVJOKSlcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG5cbiAgICB2YXIgcmVnRXhwID0gJChhbGxvd2VkQXR0cmlidXRlTGlzdCkuZmlsdGVyKGZ1bmN0aW9uIChpbmRleCwgdmFsdWUpIHtcbiAgICAgIHJldHVybiB2YWx1ZSBpbnN0YW5jZW9mIFJlZ0V4cFxuICAgIH0pXG5cbiAgICAvLyBDaGVjayBpZiBhIHJlZ3VsYXIgZXhwcmVzc2lvbiB2YWxpZGF0ZXMgdGhlIGF0dHJpYnV0ZS5cbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IHJlZ0V4cC5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIGlmIChhdHRyTmFtZS5tYXRjaChyZWdFeHBbaV0pKSB7XG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICBmdW5jdGlvbiBzYW5pdGl6ZUh0bWwodW5zYWZlSHRtbCwgd2hpdGVMaXN0LCBzYW5pdGl6ZUZuKSB7XG4gICAgaWYgKHVuc2FmZUh0bWwubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gdW5zYWZlSHRtbFxuICAgIH1cblxuICAgIGlmIChzYW5pdGl6ZUZuICYmIHR5cGVvZiBzYW5pdGl6ZUZuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gc2FuaXRpemVGbih1bnNhZmVIdG1sKVxuICAgIH1cblxuICAgIC8vIElFIDggYW5kIGJlbG93IGRvbid0IHN1cHBvcnQgY3JlYXRlSFRNTERvY3VtZW50XG4gICAgaWYgKCFkb2N1bWVudC5pbXBsZW1lbnRhdGlvbiB8fCAhZG9jdW1lbnQuaW1wbGVtZW50YXRpb24uY3JlYXRlSFRNTERvY3VtZW50KSB7XG4gICAgICByZXR1cm4gdW5zYWZlSHRtbFxuICAgIH1cblxuICAgIHZhciBjcmVhdGVkRG9jdW1lbnQgPSBkb2N1bWVudC5pbXBsZW1lbnRhdGlvbi5jcmVhdGVIVE1MRG9jdW1lbnQoJ3Nhbml0aXphdGlvbicpXG4gICAgY3JlYXRlZERvY3VtZW50LmJvZHkuaW5uZXJIVE1MID0gdW5zYWZlSHRtbFxuXG4gICAgdmFyIHdoaXRlbGlzdEtleXMgPSAkLm1hcCh3aGl0ZUxpc3QsIGZ1bmN0aW9uIChlbCwgaSkgeyByZXR1cm4gaSB9KVxuICAgIHZhciBlbGVtZW50cyA9ICQoY3JlYXRlZERvY3VtZW50LmJvZHkpLmZpbmQoJyonKVxuXG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGVsZW1lbnRzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICB2YXIgZWwgPSBlbGVtZW50c1tpXVxuICAgICAgdmFyIGVsTmFtZSA9IGVsLm5vZGVOYW1lLnRvTG93ZXJDYXNlKClcblxuICAgICAgaWYgKCQuaW5BcnJheShlbE5hbWUsIHdoaXRlbGlzdEtleXMpID09PSAtMSkge1xuICAgICAgICBlbC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGVsKVxuXG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIHZhciBhdHRyaWJ1dGVMaXN0ID0gJC5tYXAoZWwuYXR0cmlidXRlcywgZnVuY3Rpb24gKGVsKSB7IHJldHVybiBlbCB9KVxuICAgICAgdmFyIHdoaXRlbGlzdGVkQXR0cmlidXRlcyA9IFtdLmNvbmNhdCh3aGl0ZUxpc3RbJyonXSB8fCBbXSwgd2hpdGVMaXN0W2VsTmFtZV0gfHwgW10pXG5cbiAgICAgIGZvciAodmFyIGogPSAwLCBsZW4yID0gYXR0cmlidXRlTGlzdC5sZW5ndGg7IGogPCBsZW4yOyBqKyspIHtcbiAgICAgICAgaWYgKCFhbGxvd2VkQXR0cmlidXRlKGF0dHJpYnV0ZUxpc3Rbal0sIHdoaXRlbGlzdGVkQXR0cmlidXRlcykpIHtcbiAgICAgICAgICBlbC5yZW1vdmVBdHRyaWJ1dGUoYXR0cmlidXRlTGlzdFtqXS5ub2RlTmFtZSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBjcmVhdGVkRG9jdW1lbnQuYm9keS5pbm5lckhUTUxcbiAgfVxuXG4gIC8vIFRPT0xUSVAgUFVCTElDIENMQVNTIERFRklOSVRJT05cbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gIHZhciBUb29sdGlwID0gZnVuY3Rpb24gKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLnR5cGUgICAgICAgPSBudWxsXG4gICAgdGhpcy5vcHRpb25zICAgID0gbnVsbFxuICAgIHRoaXMuZW5hYmxlZCAgICA9IG51bGxcbiAgICB0aGlzLnRpbWVvdXQgICAgPSBudWxsXG4gICAgdGhpcy5ob3ZlclN0YXRlID0gbnVsbFxuICAgIHRoaXMuJGVsZW1lbnQgICA9IG51bGxcbiAgICB0aGlzLmluU3RhdGUgICAgPSBudWxsXG5cbiAgICB0aGlzLmluaXQoJ3Rvb2x0aXAnLCBlbGVtZW50LCBvcHRpb25zKVxuICB9XG5cbiAgVG9vbHRpcC5WRVJTSU9OICA9ICczLjQuMSdcblxuICBUb29sdGlwLlRSQU5TSVRJT05fRFVSQVRJT04gPSAxNTBcblxuICBUb29sdGlwLkRFRkFVTFRTID0ge1xuICAgIGFuaW1hdGlvbjogdHJ1ZSxcbiAgICBwbGFjZW1lbnQ6ICd0b3AnLFxuICAgIHNlbGVjdG9yOiBmYWxzZSxcbiAgICB0ZW1wbGF0ZTogJzxkaXYgY2xhc3M9XCJ0b29sdGlwXCIgcm9sZT1cInRvb2x0aXBcIj48ZGl2IGNsYXNzPVwidG9vbHRpcC1hcnJvd1wiPjwvZGl2PjxkaXYgY2xhc3M9XCJ0b29sdGlwLWlubmVyXCI+PC9kaXY+PC9kaXY+JyxcbiAgICB0cmlnZ2VyOiAnaG92ZXIgZm9jdXMnLFxuICAgIHRpdGxlOiAnJyxcbiAgICBkZWxheTogMCxcbiAgICBodG1sOiBmYWxzZSxcbiAgICBjb250YWluZXI6IGZhbHNlLFxuICAgIHZpZXdwb3J0OiB7XG4gICAgICBzZWxlY3RvcjogJ2JvZHknLFxuICAgICAgcGFkZGluZzogMFxuICAgIH0sXG4gICAgc2FuaXRpemUgOiB0cnVlLFxuICAgIHNhbml0aXplRm4gOiBudWxsLFxuICAgIHdoaXRlTGlzdCA6IERlZmF1bHRXaGl0ZWxpc3RcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbiAodHlwZSwgZWxlbWVudCwgb3B0aW9ucykge1xuICAgIHRoaXMuZW5hYmxlZCAgID0gdHJ1ZVxuICAgIHRoaXMudHlwZSAgICAgID0gdHlwZVxuICAgIHRoaXMuJGVsZW1lbnQgID0gJChlbGVtZW50KVxuICAgIHRoaXMub3B0aW9ucyAgID0gdGhpcy5nZXRPcHRpb25zKG9wdGlvbnMpXG4gICAgdGhpcy4kdmlld3BvcnQgPSB0aGlzLm9wdGlvbnMudmlld3BvcnQgJiYgJChkb2N1bWVudCkuZmluZCgkLmlzRnVuY3Rpb24odGhpcy5vcHRpb25zLnZpZXdwb3J0KSA/IHRoaXMub3B0aW9ucy52aWV3cG9ydC5jYWxsKHRoaXMsIHRoaXMuJGVsZW1lbnQpIDogKHRoaXMub3B0aW9ucy52aWV3cG9ydC5zZWxlY3RvciB8fCB0aGlzLm9wdGlvbnMudmlld3BvcnQpKVxuICAgIHRoaXMuaW5TdGF0ZSAgID0geyBjbGljazogZmFsc2UsIGhvdmVyOiBmYWxzZSwgZm9jdXM6IGZhbHNlIH1cblxuICAgIGlmICh0aGlzLiRlbGVtZW50WzBdIGluc3RhbmNlb2YgZG9jdW1lbnQuY29uc3RydWN0b3IgJiYgIXRoaXMub3B0aW9ucy5zZWxlY3Rvcikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdgc2VsZWN0b3JgIG9wdGlvbiBtdXN0IGJlIHNwZWNpZmllZCB3aGVuIGluaXRpYWxpemluZyAnICsgdGhpcy50eXBlICsgJyBvbiB0aGUgd2luZG93LmRvY3VtZW50IG9iamVjdCEnKVxuICAgIH1cblxuICAgIHZhciB0cmlnZ2VycyA9IHRoaXMub3B0aW9ucy50cmlnZ2VyLnNwbGl0KCcgJylcblxuICAgIGZvciAodmFyIGkgPSB0cmlnZ2Vycy5sZW5ndGg7IGktLTspIHtcbiAgICAgIHZhciB0cmlnZ2VyID0gdHJpZ2dlcnNbaV1cblxuICAgICAgaWYgKHRyaWdnZXIgPT0gJ2NsaWNrJykge1xuICAgICAgICB0aGlzLiRlbGVtZW50Lm9uKCdjbGljay4nICsgdGhpcy50eXBlLCB0aGlzLm9wdGlvbnMuc2VsZWN0b3IsICQucHJveHkodGhpcy50b2dnbGUsIHRoaXMpKVxuICAgICAgfSBlbHNlIGlmICh0cmlnZ2VyICE9ICdtYW51YWwnKSB7XG4gICAgICAgIHZhciBldmVudEluICA9IHRyaWdnZXIgPT0gJ2hvdmVyJyA/ICdtb3VzZWVudGVyJyA6ICdmb2N1c2luJ1xuICAgICAgICB2YXIgZXZlbnRPdXQgPSB0cmlnZ2VyID09ICdob3ZlcicgPyAnbW91c2VsZWF2ZScgOiAnZm9jdXNvdXQnXG5cbiAgICAgICAgdGhpcy4kZWxlbWVudC5vbihldmVudEluICArICcuJyArIHRoaXMudHlwZSwgdGhpcy5vcHRpb25zLnNlbGVjdG9yLCAkLnByb3h5KHRoaXMuZW50ZXIsIHRoaXMpKVxuICAgICAgICB0aGlzLiRlbGVtZW50Lm9uKGV2ZW50T3V0ICsgJy4nICsgdGhpcy50eXBlLCB0aGlzLm9wdGlvbnMuc2VsZWN0b3IsICQucHJveHkodGhpcy5sZWF2ZSwgdGhpcykpXG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5vcHRpb25zLnNlbGVjdG9yID9cbiAgICAgICh0aGlzLl9vcHRpb25zID0gJC5leHRlbmQoe30sIHRoaXMub3B0aW9ucywgeyB0cmlnZ2VyOiAnbWFudWFsJywgc2VsZWN0b3I6ICcnIH0pKSA6XG4gICAgICB0aGlzLmZpeFRpdGxlKClcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLmdldERlZmF1bHRzID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBUb29sdGlwLkRFRkFVTFRTXG4gIH1cblxuICBUb29sdGlwLnByb3RvdHlwZS5nZXRPcHRpb25zID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICB2YXIgZGF0YUF0dHJpYnV0ZXMgPSB0aGlzLiRlbGVtZW50LmRhdGEoKVxuXG4gICAgZm9yICh2YXIgZGF0YUF0dHIgaW4gZGF0YUF0dHJpYnV0ZXMpIHtcbiAgICAgIGlmIChkYXRhQXR0cmlidXRlcy5oYXNPd25Qcm9wZXJ0eShkYXRhQXR0cikgJiYgJC5pbkFycmF5KGRhdGFBdHRyLCBESVNBTExPV0VEX0FUVFJJQlVURVMpICE9PSAtMSkge1xuICAgICAgICBkZWxldGUgZGF0YUF0dHJpYnV0ZXNbZGF0YUF0dHJdXG4gICAgICB9XG4gICAgfVxuXG4gICAgb3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCB0aGlzLmdldERlZmF1bHRzKCksIGRhdGFBdHRyaWJ1dGVzLCBvcHRpb25zKVxuXG4gICAgaWYgKG9wdGlvbnMuZGVsYXkgJiYgdHlwZW9mIG9wdGlvbnMuZGVsYXkgPT0gJ251bWJlcicpIHtcbiAgICAgIG9wdGlvbnMuZGVsYXkgPSB7XG4gICAgICAgIHNob3c6IG9wdGlvbnMuZGVsYXksXG4gICAgICAgIGhpZGU6IG9wdGlvbnMuZGVsYXlcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAob3B0aW9ucy5zYW5pdGl6ZSkge1xuICAgICAgb3B0aW9ucy50ZW1wbGF0ZSA9IHNhbml0aXplSHRtbChvcHRpb25zLnRlbXBsYXRlLCBvcHRpb25zLndoaXRlTGlzdCwgb3B0aW9ucy5zYW5pdGl6ZUZuKVxuICAgIH1cblxuICAgIHJldHVybiBvcHRpb25zXG4gIH1cblxuICBUb29sdGlwLnByb3RvdHlwZS5nZXREZWxlZ2F0ZU9wdGlvbnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG9wdGlvbnMgID0ge31cbiAgICB2YXIgZGVmYXVsdHMgPSB0aGlzLmdldERlZmF1bHRzKClcblxuICAgIHRoaXMuX29wdGlvbnMgJiYgJC5lYWNoKHRoaXMuX29wdGlvbnMsIGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICBpZiAoZGVmYXVsdHNba2V5XSAhPSB2YWx1ZSkgb3B0aW9uc1trZXldID0gdmFsdWVcbiAgICB9KVxuXG4gICAgcmV0dXJuIG9wdGlvbnNcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLmVudGVyID0gZnVuY3Rpb24gKG9iaikge1xuICAgIHZhciBzZWxmID0gb2JqIGluc3RhbmNlb2YgdGhpcy5jb25zdHJ1Y3RvciA/XG4gICAgICBvYmogOiAkKG9iai5jdXJyZW50VGFyZ2V0KS5kYXRhKCdicy4nICsgdGhpcy50eXBlKVxuXG4gICAgaWYgKCFzZWxmKSB7XG4gICAgICBzZWxmID0gbmV3IHRoaXMuY29uc3RydWN0b3Iob2JqLmN1cnJlbnRUYXJnZXQsIHRoaXMuZ2V0RGVsZWdhdGVPcHRpb25zKCkpXG4gICAgICAkKG9iai5jdXJyZW50VGFyZ2V0KS5kYXRhKCdicy4nICsgdGhpcy50eXBlLCBzZWxmKVxuICAgIH1cblxuICAgIGlmIChvYmogaW5zdGFuY2VvZiAkLkV2ZW50KSB7XG4gICAgICBzZWxmLmluU3RhdGVbb2JqLnR5cGUgPT0gJ2ZvY3VzaW4nID8gJ2ZvY3VzJyA6ICdob3ZlciddID0gdHJ1ZVxuICAgIH1cblxuICAgIGlmIChzZWxmLnRpcCgpLmhhc0NsYXNzKCdpbicpIHx8IHNlbGYuaG92ZXJTdGF0ZSA9PSAnaW4nKSB7XG4gICAgICBzZWxmLmhvdmVyU3RhdGUgPSAnaW4nXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBjbGVhclRpbWVvdXQoc2VsZi50aW1lb3V0KVxuXG4gICAgc2VsZi5ob3ZlclN0YXRlID0gJ2luJ1xuXG4gICAgaWYgKCFzZWxmLm9wdGlvbnMuZGVsYXkgfHwgIXNlbGYub3B0aW9ucy5kZWxheS5zaG93KSByZXR1cm4gc2VsZi5zaG93KClcblxuICAgIHNlbGYudGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKHNlbGYuaG92ZXJTdGF0ZSA9PSAnaW4nKSBzZWxmLnNob3coKVxuICAgIH0sIHNlbGYub3B0aW9ucy5kZWxheS5zaG93KVxuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUuaXNJblN0YXRlVHJ1ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy5pblN0YXRlKSB7XG4gICAgICBpZiAodGhpcy5pblN0YXRlW2tleV0pIHJldHVybiB0cnVlXG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICBUb29sdGlwLnByb3RvdHlwZS5sZWF2ZSA9IGZ1bmN0aW9uIChvYmopIHtcbiAgICB2YXIgc2VsZiA9IG9iaiBpbnN0YW5jZW9mIHRoaXMuY29uc3RydWN0b3IgP1xuICAgICAgb2JqIDogJChvYmouY3VycmVudFRhcmdldCkuZGF0YSgnYnMuJyArIHRoaXMudHlwZSlcblxuICAgIGlmICghc2VsZikge1xuICAgICAgc2VsZiA9IG5ldyB0aGlzLmNvbnN0cnVjdG9yKG9iai5jdXJyZW50VGFyZ2V0LCB0aGlzLmdldERlbGVnYXRlT3B0aW9ucygpKVxuICAgICAgJChvYmouY3VycmVudFRhcmdldCkuZGF0YSgnYnMuJyArIHRoaXMudHlwZSwgc2VsZilcbiAgICB9XG5cbiAgICBpZiAob2JqIGluc3RhbmNlb2YgJC5FdmVudCkge1xuICAgICAgc2VsZi5pblN0YXRlW29iai50eXBlID09ICdmb2N1c291dCcgPyAnZm9jdXMnIDogJ2hvdmVyJ10gPSBmYWxzZVxuICAgIH1cblxuICAgIGlmIChzZWxmLmlzSW5TdGF0ZVRydWUoKSkgcmV0dXJuXG5cbiAgICBjbGVhclRpbWVvdXQoc2VsZi50aW1lb3V0KVxuXG4gICAgc2VsZi5ob3ZlclN0YXRlID0gJ291dCdcblxuICAgIGlmICghc2VsZi5vcHRpb25zLmRlbGF5IHx8ICFzZWxmLm9wdGlvbnMuZGVsYXkuaGlkZSkgcmV0dXJuIHNlbGYuaGlkZSgpXG5cbiAgICBzZWxmLnRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmIChzZWxmLmhvdmVyU3RhdGUgPT0gJ291dCcpIHNlbGYuaGlkZSgpXG4gICAgfSwgc2VsZi5vcHRpb25zLmRlbGF5LmhpZGUpXG4gIH1cblxuICBUb29sdGlwLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBlID0gJC5FdmVudCgnc2hvdy5icy4nICsgdGhpcy50eXBlKVxuXG4gICAgaWYgKHRoaXMuaGFzQ29udGVudCgpICYmIHRoaXMuZW5hYmxlZCkge1xuICAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKGUpXG5cbiAgICAgIHZhciBpbkRvbSA9ICQuY29udGFpbnModGhpcy4kZWxlbWVudFswXS5vd25lckRvY3VtZW50LmRvY3VtZW50RWxlbWVudCwgdGhpcy4kZWxlbWVudFswXSlcbiAgICAgIGlmIChlLmlzRGVmYXVsdFByZXZlbnRlZCgpIHx8ICFpbkRvbSkgcmV0dXJuXG4gICAgICB2YXIgdGhhdCA9IHRoaXNcblxuICAgICAgdmFyICR0aXAgPSB0aGlzLnRpcCgpXG5cbiAgICAgIHZhciB0aXBJZCA9IHRoaXMuZ2V0VUlEKHRoaXMudHlwZSlcblxuICAgICAgdGhpcy5zZXRDb250ZW50KClcbiAgICAgICR0aXAuYXR0cignaWQnLCB0aXBJZClcbiAgICAgIHRoaXMuJGVsZW1lbnQuYXR0cignYXJpYS1kZXNjcmliZWRieScsIHRpcElkKVxuXG4gICAgICBpZiAodGhpcy5vcHRpb25zLmFuaW1hdGlvbikgJHRpcC5hZGRDbGFzcygnZmFkZScpXG5cbiAgICAgIHZhciBwbGFjZW1lbnQgPSB0eXBlb2YgdGhpcy5vcHRpb25zLnBsYWNlbWVudCA9PSAnZnVuY3Rpb24nID9cbiAgICAgICAgdGhpcy5vcHRpb25zLnBsYWNlbWVudC5jYWxsKHRoaXMsICR0aXBbMF0sIHRoaXMuJGVsZW1lbnRbMF0pIDpcbiAgICAgICAgdGhpcy5vcHRpb25zLnBsYWNlbWVudFxuXG4gICAgICB2YXIgYXV0b1Rva2VuID0gL1xccz9hdXRvP1xccz8vaVxuICAgICAgdmFyIGF1dG9QbGFjZSA9IGF1dG9Ub2tlbi50ZXN0KHBsYWNlbWVudClcbiAgICAgIGlmIChhdXRvUGxhY2UpIHBsYWNlbWVudCA9IHBsYWNlbWVudC5yZXBsYWNlKGF1dG9Ub2tlbiwgJycpIHx8ICd0b3AnXG5cbiAgICAgICR0aXBcbiAgICAgICAgLmRldGFjaCgpXG4gICAgICAgIC5jc3MoeyB0b3A6IDAsIGxlZnQ6IDAsIGRpc3BsYXk6ICdibG9jaycgfSlcbiAgICAgICAgLmFkZENsYXNzKHBsYWNlbWVudClcbiAgICAgICAgLmRhdGEoJ2JzLicgKyB0aGlzLnR5cGUsIHRoaXMpXG5cbiAgICAgIHRoaXMub3B0aW9ucy5jb250YWluZXIgPyAkdGlwLmFwcGVuZFRvKCQoZG9jdW1lbnQpLmZpbmQodGhpcy5vcHRpb25zLmNvbnRhaW5lcikpIDogJHRpcC5pbnNlcnRBZnRlcih0aGlzLiRlbGVtZW50KVxuICAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdpbnNlcnRlZC5icy4nICsgdGhpcy50eXBlKVxuXG4gICAgICB2YXIgcG9zICAgICAgICAgID0gdGhpcy5nZXRQb3NpdGlvbigpXG4gICAgICB2YXIgYWN0dWFsV2lkdGggID0gJHRpcFswXS5vZmZzZXRXaWR0aFxuICAgICAgdmFyIGFjdHVhbEhlaWdodCA9ICR0aXBbMF0ub2Zmc2V0SGVpZ2h0XG5cbiAgICAgIGlmIChhdXRvUGxhY2UpIHtcbiAgICAgICAgdmFyIG9yZ1BsYWNlbWVudCA9IHBsYWNlbWVudFxuICAgICAgICB2YXIgdmlld3BvcnREaW0gPSB0aGlzLmdldFBvc2l0aW9uKHRoaXMuJHZpZXdwb3J0KVxuXG4gICAgICAgIHBsYWNlbWVudCA9IHBsYWNlbWVudCA9PSAnYm90dG9tJyAmJiBwb3MuYm90dG9tICsgYWN0dWFsSGVpZ2h0ID4gdmlld3BvcnREaW0uYm90dG9tID8gJ3RvcCcgICAgOlxuICAgICAgICAgICAgICAgICAgICBwbGFjZW1lbnQgPT0gJ3RvcCcgICAgJiYgcG9zLnRvcCAgICAtIGFjdHVhbEhlaWdodCA8IHZpZXdwb3J0RGltLnRvcCAgICA/ICdib3R0b20nIDpcbiAgICAgICAgICAgICAgICAgICAgcGxhY2VtZW50ID09ICdyaWdodCcgICYmIHBvcy5yaWdodCAgKyBhY3R1YWxXaWR0aCAgPiB2aWV3cG9ydERpbS53aWR0aCAgPyAnbGVmdCcgICA6XG4gICAgICAgICAgICAgICAgICAgIHBsYWNlbWVudCA9PSAnbGVmdCcgICAmJiBwb3MubGVmdCAgIC0gYWN0dWFsV2lkdGggIDwgdmlld3BvcnREaW0ubGVmdCAgID8gJ3JpZ2h0JyAgOlxuICAgICAgICAgICAgICAgICAgICBwbGFjZW1lbnRcblxuICAgICAgICAkdGlwXG4gICAgICAgICAgLnJlbW92ZUNsYXNzKG9yZ1BsYWNlbWVudClcbiAgICAgICAgICAuYWRkQ2xhc3MocGxhY2VtZW50KVxuICAgICAgfVxuXG4gICAgICB2YXIgY2FsY3VsYXRlZE9mZnNldCA9IHRoaXMuZ2V0Q2FsY3VsYXRlZE9mZnNldChwbGFjZW1lbnQsIHBvcywgYWN0dWFsV2lkdGgsIGFjdHVhbEhlaWdodClcblxuICAgICAgdGhpcy5hcHBseVBsYWNlbWVudChjYWxjdWxhdGVkT2Zmc2V0LCBwbGFjZW1lbnQpXG5cbiAgICAgIHZhciBjb21wbGV0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHByZXZIb3ZlclN0YXRlID0gdGhhdC5ob3ZlclN0YXRlXG4gICAgICAgIHRoYXQuJGVsZW1lbnQudHJpZ2dlcignc2hvd24uYnMuJyArIHRoYXQudHlwZSlcbiAgICAgICAgdGhhdC5ob3ZlclN0YXRlID0gbnVsbFxuXG4gICAgICAgIGlmIChwcmV2SG92ZXJTdGF0ZSA9PSAnb3V0JykgdGhhdC5sZWF2ZSh0aGF0KVxuICAgICAgfVxuXG4gICAgICAkLnN1cHBvcnQudHJhbnNpdGlvbiAmJiB0aGlzLiR0aXAuaGFzQ2xhc3MoJ2ZhZGUnKSA/XG4gICAgICAgICR0aXBcbiAgICAgICAgICAub25lKCdic1RyYW5zaXRpb25FbmQnLCBjb21wbGV0ZSlcbiAgICAgICAgICAuZW11bGF0ZVRyYW5zaXRpb25FbmQoVG9vbHRpcC5UUkFOU0lUSU9OX0RVUkFUSU9OKSA6XG4gICAgICAgIGNvbXBsZXRlKClcbiAgICB9XG4gIH1cblxuICBUb29sdGlwLnByb3RvdHlwZS5hcHBseVBsYWNlbWVudCA9IGZ1bmN0aW9uIChvZmZzZXQsIHBsYWNlbWVudCkge1xuICAgIHZhciAkdGlwICAgPSB0aGlzLnRpcCgpXG4gICAgdmFyIHdpZHRoICA9ICR0aXBbMF0ub2Zmc2V0V2lkdGhcbiAgICB2YXIgaGVpZ2h0ID0gJHRpcFswXS5vZmZzZXRIZWlnaHRcblxuICAgIC8vIG1hbnVhbGx5IHJlYWQgbWFyZ2lucyBiZWNhdXNlIGdldEJvdW5kaW5nQ2xpZW50UmVjdCBpbmNsdWRlcyBkaWZmZXJlbmNlXG4gICAgdmFyIG1hcmdpblRvcCA9IHBhcnNlSW50KCR0aXAuY3NzKCdtYXJnaW4tdG9wJyksIDEwKVxuICAgIHZhciBtYXJnaW5MZWZ0ID0gcGFyc2VJbnQoJHRpcC5jc3MoJ21hcmdpbi1sZWZ0JyksIDEwKVxuXG4gICAgLy8gd2UgbXVzdCBjaGVjayBmb3IgTmFOIGZvciBpZSA4LzlcbiAgICBpZiAoaXNOYU4obWFyZ2luVG9wKSkgIG1hcmdpblRvcCAgPSAwXG4gICAgaWYgKGlzTmFOKG1hcmdpbkxlZnQpKSBtYXJnaW5MZWZ0ID0gMFxuXG4gICAgb2Zmc2V0LnRvcCAgKz0gbWFyZ2luVG9wXG4gICAgb2Zmc2V0LmxlZnQgKz0gbWFyZ2luTGVmdFxuXG4gICAgLy8gJC5mbi5vZmZzZXQgZG9lc24ndCByb3VuZCBwaXhlbCB2YWx1ZXNcbiAgICAvLyBzbyB3ZSB1c2Ugc2V0T2Zmc2V0IGRpcmVjdGx5IHdpdGggb3VyIG93biBmdW5jdGlvbiBCLTBcbiAgICAkLm9mZnNldC5zZXRPZmZzZXQoJHRpcFswXSwgJC5leHRlbmQoe1xuICAgICAgdXNpbmc6IGZ1bmN0aW9uIChwcm9wcykge1xuICAgICAgICAkdGlwLmNzcyh7XG4gICAgICAgICAgdG9wOiBNYXRoLnJvdW5kKHByb3BzLnRvcCksXG4gICAgICAgICAgbGVmdDogTWF0aC5yb3VuZChwcm9wcy5sZWZ0KVxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH0sIG9mZnNldCksIDApXG5cbiAgICAkdGlwLmFkZENsYXNzKCdpbicpXG5cbiAgICAvLyBjaGVjayB0byBzZWUgaWYgcGxhY2luZyB0aXAgaW4gbmV3IG9mZnNldCBjYXVzZWQgdGhlIHRpcCB0byByZXNpemUgaXRzZWxmXG4gICAgdmFyIGFjdHVhbFdpZHRoICA9ICR0aXBbMF0ub2Zmc2V0V2lkdGhcbiAgICB2YXIgYWN0dWFsSGVpZ2h0ID0gJHRpcFswXS5vZmZzZXRIZWlnaHRcblxuICAgIGlmIChwbGFjZW1lbnQgPT0gJ3RvcCcgJiYgYWN0dWFsSGVpZ2h0ICE9IGhlaWdodCkge1xuICAgICAgb2Zmc2V0LnRvcCA9IG9mZnNldC50b3AgKyBoZWlnaHQgLSBhY3R1YWxIZWlnaHRcbiAgICB9XG5cbiAgICB2YXIgZGVsdGEgPSB0aGlzLmdldFZpZXdwb3J0QWRqdXN0ZWREZWx0YShwbGFjZW1lbnQsIG9mZnNldCwgYWN0dWFsV2lkdGgsIGFjdHVhbEhlaWdodClcblxuICAgIGlmIChkZWx0YS5sZWZ0KSBvZmZzZXQubGVmdCArPSBkZWx0YS5sZWZ0XG4gICAgZWxzZSBvZmZzZXQudG9wICs9IGRlbHRhLnRvcFxuXG4gICAgdmFyIGlzVmVydGljYWwgICAgICAgICAgPSAvdG9wfGJvdHRvbS8udGVzdChwbGFjZW1lbnQpXG4gICAgdmFyIGFycm93RGVsdGEgICAgICAgICAgPSBpc1ZlcnRpY2FsID8gZGVsdGEubGVmdCAqIDIgLSB3aWR0aCArIGFjdHVhbFdpZHRoIDogZGVsdGEudG9wICogMiAtIGhlaWdodCArIGFjdHVhbEhlaWdodFxuICAgIHZhciBhcnJvd09mZnNldFBvc2l0aW9uID0gaXNWZXJ0aWNhbCA/ICdvZmZzZXRXaWR0aCcgOiAnb2Zmc2V0SGVpZ2h0J1xuXG4gICAgJHRpcC5vZmZzZXQob2Zmc2V0KVxuICAgIHRoaXMucmVwbGFjZUFycm93KGFycm93RGVsdGEsICR0aXBbMF1bYXJyb3dPZmZzZXRQb3NpdGlvbl0sIGlzVmVydGljYWwpXG4gIH1cblxuICBUb29sdGlwLnByb3RvdHlwZS5yZXBsYWNlQXJyb3cgPSBmdW5jdGlvbiAoZGVsdGEsIGRpbWVuc2lvbiwgaXNWZXJ0aWNhbCkge1xuICAgIHRoaXMuYXJyb3coKVxuICAgICAgLmNzcyhpc1ZlcnRpY2FsID8gJ2xlZnQnIDogJ3RvcCcsIDUwICogKDEgLSBkZWx0YSAvIGRpbWVuc2lvbikgKyAnJScpXG4gICAgICAuY3NzKGlzVmVydGljYWwgPyAndG9wJyA6ICdsZWZ0JywgJycpXG4gIH1cblxuICBUb29sdGlwLnByb3RvdHlwZS5zZXRDb250ZW50ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciAkdGlwICA9IHRoaXMudGlwKClcbiAgICB2YXIgdGl0bGUgPSB0aGlzLmdldFRpdGxlKClcblxuICAgIGlmICh0aGlzLm9wdGlvbnMuaHRtbCkge1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5zYW5pdGl6ZSkge1xuICAgICAgICB0aXRsZSA9IHNhbml0aXplSHRtbCh0aXRsZSwgdGhpcy5vcHRpb25zLndoaXRlTGlzdCwgdGhpcy5vcHRpb25zLnNhbml0aXplRm4pXG4gICAgICB9XG5cbiAgICAgICR0aXAuZmluZCgnLnRvb2x0aXAtaW5uZXInKS5odG1sKHRpdGxlKVxuICAgIH0gZWxzZSB7XG4gICAgICAkdGlwLmZpbmQoJy50b29sdGlwLWlubmVyJykudGV4dCh0aXRsZSlcbiAgICB9XG5cbiAgICAkdGlwLnJlbW92ZUNsYXNzKCdmYWRlIGluIHRvcCBib3R0b20gbGVmdCByaWdodCcpXG4gIH1cblxuICBUb29sdGlwLnByb3RvdHlwZS5oaWRlID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzXG4gICAgdmFyICR0aXAgPSAkKHRoaXMuJHRpcClcbiAgICB2YXIgZSAgICA9ICQuRXZlbnQoJ2hpZGUuYnMuJyArIHRoaXMudHlwZSlcblxuICAgIGZ1bmN0aW9uIGNvbXBsZXRlKCkge1xuICAgICAgaWYgKHRoYXQuaG92ZXJTdGF0ZSAhPSAnaW4nKSAkdGlwLmRldGFjaCgpXG4gICAgICBpZiAodGhhdC4kZWxlbWVudCkgeyAvLyBUT0RPOiBDaGVjayB3aGV0aGVyIGd1YXJkaW5nIHRoaXMgY29kZSB3aXRoIHRoaXMgYGlmYCBpcyByZWFsbHkgbmVjZXNzYXJ5LlxuICAgICAgICB0aGF0LiRlbGVtZW50XG4gICAgICAgICAgLnJlbW92ZUF0dHIoJ2FyaWEtZGVzY3JpYmVkYnknKVxuICAgICAgICAgIC50cmlnZ2VyKCdoaWRkZW4uYnMuJyArIHRoYXQudHlwZSlcbiAgICAgIH1cbiAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKClcbiAgICB9XG5cbiAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoZSlcblxuICAgIGlmIChlLmlzRGVmYXVsdFByZXZlbnRlZCgpKSByZXR1cm5cblxuICAgICR0aXAucmVtb3ZlQ2xhc3MoJ2luJylcblxuICAgICQuc3VwcG9ydC50cmFuc2l0aW9uICYmICR0aXAuaGFzQ2xhc3MoJ2ZhZGUnKSA/XG4gICAgICAkdGlwXG4gICAgICAgIC5vbmUoJ2JzVHJhbnNpdGlvbkVuZCcsIGNvbXBsZXRlKVxuICAgICAgICAuZW11bGF0ZVRyYW5zaXRpb25FbmQoVG9vbHRpcC5UUkFOU0lUSU9OX0RVUkFUSU9OKSA6XG4gICAgICBjb21wbGV0ZSgpXG5cbiAgICB0aGlzLmhvdmVyU3RhdGUgPSBudWxsXG5cbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUuZml4VGl0bGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyICRlID0gdGhpcy4kZWxlbWVudFxuICAgIGlmICgkZS5hdHRyKCd0aXRsZScpIHx8IHR5cGVvZiAkZS5hdHRyKCdkYXRhLW9yaWdpbmFsLXRpdGxlJykgIT0gJ3N0cmluZycpIHtcbiAgICAgICRlLmF0dHIoJ2RhdGEtb3JpZ2luYWwtdGl0bGUnLCAkZS5hdHRyKCd0aXRsZScpIHx8ICcnKS5hdHRyKCd0aXRsZScsICcnKVxuICAgIH1cbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLmhhc0NvbnRlbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0VGl0bGUoKVxuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUuZ2V0UG9zaXRpb24gPSBmdW5jdGlvbiAoJGVsZW1lbnQpIHtcbiAgICAkZWxlbWVudCAgID0gJGVsZW1lbnQgfHwgdGhpcy4kZWxlbWVudFxuXG4gICAgdmFyIGVsICAgICA9ICRlbGVtZW50WzBdXG4gICAgdmFyIGlzQm9keSA9IGVsLnRhZ05hbWUgPT0gJ0JPRFknXG5cbiAgICB2YXIgZWxSZWN0ICAgID0gZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICBpZiAoZWxSZWN0LndpZHRoID09IG51bGwpIHtcbiAgICAgIC8vIHdpZHRoIGFuZCBoZWlnaHQgYXJlIG1pc3NpbmcgaW4gSUU4LCBzbyBjb21wdXRlIHRoZW0gbWFudWFsbHk7IHNlZSBodHRwczovL2dpdGh1Yi5jb20vdHdicy9ib290c3RyYXAvaXNzdWVzLzE0MDkzXG4gICAgICBlbFJlY3QgPSAkLmV4dGVuZCh7fSwgZWxSZWN0LCB7IHdpZHRoOiBlbFJlY3QucmlnaHQgLSBlbFJlY3QubGVmdCwgaGVpZ2h0OiBlbFJlY3QuYm90dG9tIC0gZWxSZWN0LnRvcCB9KVxuICAgIH1cbiAgICB2YXIgaXNTdmcgPSB3aW5kb3cuU1ZHRWxlbWVudCAmJiBlbCBpbnN0YW5jZW9mIHdpbmRvdy5TVkdFbGVtZW50XG4gICAgLy8gQXZvaWQgdXNpbmcgJC5vZmZzZXQoKSBvbiBTVkdzIHNpbmNlIGl0IGdpdmVzIGluY29ycmVjdCByZXN1bHRzIGluIGpRdWVyeSAzLlxuICAgIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vdHdicy9ib290c3RyYXAvaXNzdWVzLzIwMjgwXG4gICAgdmFyIGVsT2Zmc2V0ICA9IGlzQm9keSA/IHsgdG9wOiAwLCBsZWZ0OiAwIH0gOiAoaXNTdmcgPyBudWxsIDogJGVsZW1lbnQub2Zmc2V0KCkpXG4gICAgdmFyIHNjcm9sbCAgICA9IHsgc2Nyb2xsOiBpc0JvZHkgPyBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsVG9wIHx8IGRvY3VtZW50LmJvZHkuc2Nyb2xsVG9wIDogJGVsZW1lbnQuc2Nyb2xsVG9wKCkgfVxuICAgIHZhciBvdXRlckRpbXMgPSBpc0JvZHkgPyB7IHdpZHRoOiAkKHdpbmRvdykud2lkdGgoKSwgaGVpZ2h0OiAkKHdpbmRvdykuaGVpZ2h0KCkgfSA6IG51bGxcblxuICAgIHJldHVybiAkLmV4dGVuZCh7fSwgZWxSZWN0LCBzY3JvbGwsIG91dGVyRGltcywgZWxPZmZzZXQpXG4gIH1cblxuICBUb29sdGlwLnByb3RvdHlwZS5nZXRDYWxjdWxhdGVkT2Zmc2V0ID0gZnVuY3Rpb24gKHBsYWNlbWVudCwgcG9zLCBhY3R1YWxXaWR0aCwgYWN0dWFsSGVpZ2h0KSB7XG4gICAgcmV0dXJuIHBsYWNlbWVudCA9PSAnYm90dG9tJyA/IHsgdG9wOiBwb3MudG9wICsgcG9zLmhlaWdodCwgICBsZWZ0OiBwb3MubGVmdCArIHBvcy53aWR0aCAvIDIgLSBhY3R1YWxXaWR0aCAvIDIgfSA6XG4gICAgICAgICAgIHBsYWNlbWVudCA9PSAndG9wJyAgICA/IHsgdG9wOiBwb3MudG9wIC0gYWN0dWFsSGVpZ2h0LCBsZWZ0OiBwb3MubGVmdCArIHBvcy53aWR0aCAvIDIgLSBhY3R1YWxXaWR0aCAvIDIgfSA6XG4gICAgICAgICAgIHBsYWNlbWVudCA9PSAnbGVmdCcgICA/IHsgdG9wOiBwb3MudG9wICsgcG9zLmhlaWdodCAvIDIgLSBhY3R1YWxIZWlnaHQgLyAyLCBsZWZ0OiBwb3MubGVmdCAtIGFjdHVhbFdpZHRoIH0gOlxuICAgICAgICAvKiBwbGFjZW1lbnQgPT0gJ3JpZ2h0JyAqLyB7IHRvcDogcG9zLnRvcCArIHBvcy5oZWlnaHQgLyAyIC0gYWN0dWFsSGVpZ2h0IC8gMiwgbGVmdDogcG9zLmxlZnQgKyBwb3Mud2lkdGggfVxuXG4gIH1cblxuICBUb29sdGlwLnByb3RvdHlwZS5nZXRWaWV3cG9ydEFkanVzdGVkRGVsdGEgPSBmdW5jdGlvbiAocGxhY2VtZW50LCBwb3MsIGFjdHVhbFdpZHRoLCBhY3R1YWxIZWlnaHQpIHtcbiAgICB2YXIgZGVsdGEgPSB7IHRvcDogMCwgbGVmdDogMCB9XG4gICAgaWYgKCF0aGlzLiR2aWV3cG9ydCkgcmV0dXJuIGRlbHRhXG5cbiAgICB2YXIgdmlld3BvcnRQYWRkaW5nID0gdGhpcy5vcHRpb25zLnZpZXdwb3J0ICYmIHRoaXMub3B0aW9ucy52aWV3cG9ydC5wYWRkaW5nIHx8IDBcbiAgICB2YXIgdmlld3BvcnREaW1lbnNpb25zID0gdGhpcy5nZXRQb3NpdGlvbih0aGlzLiR2aWV3cG9ydClcblxuICAgIGlmICgvcmlnaHR8bGVmdC8udGVzdChwbGFjZW1lbnQpKSB7XG4gICAgICB2YXIgdG9wRWRnZU9mZnNldCAgICA9IHBvcy50b3AgLSB2aWV3cG9ydFBhZGRpbmcgLSB2aWV3cG9ydERpbWVuc2lvbnMuc2Nyb2xsXG4gICAgICB2YXIgYm90dG9tRWRnZU9mZnNldCA9IHBvcy50b3AgKyB2aWV3cG9ydFBhZGRpbmcgLSB2aWV3cG9ydERpbWVuc2lvbnMuc2Nyb2xsICsgYWN0dWFsSGVpZ2h0XG4gICAgICBpZiAodG9wRWRnZU9mZnNldCA8IHZpZXdwb3J0RGltZW5zaW9ucy50b3ApIHsgLy8gdG9wIG92ZXJmbG93XG4gICAgICAgIGRlbHRhLnRvcCA9IHZpZXdwb3J0RGltZW5zaW9ucy50b3AgLSB0b3BFZGdlT2Zmc2V0XG4gICAgICB9IGVsc2UgaWYgKGJvdHRvbUVkZ2VPZmZzZXQgPiB2aWV3cG9ydERpbWVuc2lvbnMudG9wICsgdmlld3BvcnREaW1lbnNpb25zLmhlaWdodCkgeyAvLyBib3R0b20gb3ZlcmZsb3dcbiAgICAgICAgZGVsdGEudG9wID0gdmlld3BvcnREaW1lbnNpb25zLnRvcCArIHZpZXdwb3J0RGltZW5zaW9ucy5oZWlnaHQgLSBib3R0b21FZGdlT2Zmc2V0XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBsZWZ0RWRnZU9mZnNldCAgPSBwb3MubGVmdCAtIHZpZXdwb3J0UGFkZGluZ1xuICAgICAgdmFyIHJpZ2h0RWRnZU9mZnNldCA9IHBvcy5sZWZ0ICsgdmlld3BvcnRQYWRkaW5nICsgYWN0dWFsV2lkdGhcbiAgICAgIGlmIChsZWZ0RWRnZU9mZnNldCA8IHZpZXdwb3J0RGltZW5zaW9ucy5sZWZ0KSB7IC8vIGxlZnQgb3ZlcmZsb3dcbiAgICAgICAgZGVsdGEubGVmdCA9IHZpZXdwb3J0RGltZW5zaW9ucy5sZWZ0IC0gbGVmdEVkZ2VPZmZzZXRcbiAgICAgIH0gZWxzZSBpZiAocmlnaHRFZGdlT2Zmc2V0ID4gdmlld3BvcnREaW1lbnNpb25zLnJpZ2h0KSB7IC8vIHJpZ2h0IG92ZXJmbG93XG4gICAgICAgIGRlbHRhLmxlZnQgPSB2aWV3cG9ydERpbWVuc2lvbnMubGVmdCArIHZpZXdwb3J0RGltZW5zaW9ucy53aWR0aCAtIHJpZ2h0RWRnZU9mZnNldFxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBkZWx0YVxuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUuZ2V0VGl0bGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHRpdGxlXG4gICAgdmFyICRlID0gdGhpcy4kZWxlbWVudFxuICAgIHZhciBvICA9IHRoaXMub3B0aW9uc1xuXG4gICAgdGl0bGUgPSAkZS5hdHRyKCdkYXRhLW9yaWdpbmFsLXRpdGxlJylcbiAgICAgIHx8ICh0eXBlb2Ygby50aXRsZSA9PSAnZnVuY3Rpb24nID8gby50aXRsZS5jYWxsKCRlWzBdKSA6ICBvLnRpdGxlKVxuXG4gICAgcmV0dXJuIHRpdGxlXG4gIH1cblxuICBUb29sdGlwLnByb3RvdHlwZS5nZXRVSUQgPSBmdW5jdGlvbiAocHJlZml4KSB7XG4gICAgZG8gcHJlZml4ICs9IH5+KE1hdGgucmFuZG9tKCkgKiAxMDAwMDAwKVxuICAgIHdoaWxlIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZChwcmVmaXgpKVxuICAgIHJldHVybiBwcmVmaXhcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLnRpcCA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMuJHRpcCkge1xuICAgICAgdGhpcy4kdGlwID0gJCh0aGlzLm9wdGlvbnMudGVtcGxhdGUpXG4gICAgICBpZiAodGhpcy4kdGlwLmxlbmd0aCAhPSAxKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcih0aGlzLnR5cGUgKyAnIGB0ZW1wbGF0ZWAgb3B0aW9uIG11c3QgY29uc2lzdCBvZiBleGFjdGx5IDEgdG9wLWxldmVsIGVsZW1lbnQhJylcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuJHRpcFxuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUuYXJyb3cgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICh0aGlzLiRhcnJvdyA9IHRoaXMuJGFycm93IHx8IHRoaXMudGlwKCkuZmluZCgnLnRvb2x0aXAtYXJyb3cnKSlcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLmVuYWJsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmVuYWJsZWQgPSB0cnVlXG4gIH1cblxuICBUb29sdGlwLnByb3RvdHlwZS5kaXNhYmxlID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZW5hYmxlZCA9IGZhbHNlXG4gIH1cblxuICBUb29sdGlwLnByb3RvdHlwZS50b2dnbGVFbmFibGVkID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZW5hYmxlZCA9ICF0aGlzLmVuYWJsZWRcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLnRvZ2dsZSA9IGZ1bmN0aW9uIChlKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgaWYgKGUpIHtcbiAgICAgIHNlbGYgPSAkKGUuY3VycmVudFRhcmdldCkuZGF0YSgnYnMuJyArIHRoaXMudHlwZSlcbiAgICAgIGlmICghc2VsZikge1xuICAgICAgICBzZWxmID0gbmV3IHRoaXMuY29uc3RydWN0b3IoZS5jdXJyZW50VGFyZ2V0LCB0aGlzLmdldERlbGVnYXRlT3B0aW9ucygpKVxuICAgICAgICAkKGUuY3VycmVudFRhcmdldCkuZGF0YSgnYnMuJyArIHRoaXMudHlwZSwgc2VsZilcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZSkge1xuICAgICAgc2VsZi5pblN0YXRlLmNsaWNrID0gIXNlbGYuaW5TdGF0ZS5jbGlja1xuICAgICAgaWYgKHNlbGYuaXNJblN0YXRlVHJ1ZSgpKSBzZWxmLmVudGVyKHNlbGYpXG4gICAgICBlbHNlIHNlbGYubGVhdmUoc2VsZilcbiAgICB9IGVsc2Uge1xuICAgICAgc2VsZi50aXAoKS5oYXNDbGFzcygnaW4nKSA/IHNlbGYubGVhdmUoc2VsZikgOiBzZWxmLmVudGVyKHNlbGYpXG4gICAgfVxuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXNcbiAgICBjbGVhclRpbWVvdXQodGhpcy50aW1lb3V0KVxuICAgIHRoaXMuaGlkZShmdW5jdGlvbiAoKSB7XG4gICAgICB0aGF0LiRlbGVtZW50Lm9mZignLicgKyB0aGF0LnR5cGUpLnJlbW92ZURhdGEoJ2JzLicgKyB0aGF0LnR5cGUpXG4gICAgICBpZiAodGhhdC4kdGlwKSB7XG4gICAgICAgIHRoYXQuJHRpcC5kZXRhY2goKVxuICAgICAgfVxuICAgICAgdGhhdC4kdGlwID0gbnVsbFxuICAgICAgdGhhdC4kYXJyb3cgPSBudWxsXG4gICAgICB0aGF0LiR2aWV3cG9ydCA9IG51bGxcbiAgICAgIHRoYXQuJGVsZW1lbnQgPSBudWxsXG4gICAgfSlcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLnNhbml0aXplSHRtbCA9IGZ1bmN0aW9uICh1bnNhZmVIdG1sKSB7XG4gICAgcmV0dXJuIHNhbml0aXplSHRtbCh1bnNhZmVIdG1sLCB0aGlzLm9wdGlvbnMud2hpdGVMaXN0LCB0aGlzLm9wdGlvbnMuc2FuaXRpemVGbilcbiAgfVxuXG4gIC8vIFRPT0xUSVAgUExVR0lOIERFRklOSVRJT05cbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gIGZ1bmN0aW9uIFBsdWdpbihvcHRpb24pIHtcbiAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciAkdGhpcyAgID0gJCh0aGlzKVxuICAgICAgdmFyIGRhdGEgICAgPSAkdGhpcy5kYXRhKCdicy50b29sdGlwJylcbiAgICAgIHZhciBvcHRpb25zID0gdHlwZW9mIG9wdGlvbiA9PSAnb2JqZWN0JyAmJiBvcHRpb25cblxuICAgICAgaWYgKCFkYXRhICYmIC9kZXN0cm95fGhpZGUvLnRlc3Qob3B0aW9uKSkgcmV0dXJuXG4gICAgICBpZiAoIWRhdGEpICR0aGlzLmRhdGEoJ2JzLnRvb2x0aXAnLCAoZGF0YSA9IG5ldyBUb29sdGlwKHRoaXMsIG9wdGlvbnMpKSlcbiAgICAgIGlmICh0eXBlb2Ygb3B0aW9uID09ICdzdHJpbmcnKSBkYXRhW29wdGlvbl0oKVxuICAgIH0pXG4gIH1cblxuICB2YXIgb2xkID0gJC5mbi50b29sdGlwXG5cbiAgJC5mbi50b29sdGlwICAgICAgICAgICAgID0gUGx1Z2luXG4gICQuZm4udG9vbHRpcC5Db25zdHJ1Y3RvciA9IFRvb2x0aXBcblxuXG4gIC8vIFRPT0xUSVAgTk8gQ09ORkxJQ1RcbiAgLy8gPT09PT09PT09PT09PT09PT09PVxuXG4gICQuZm4udG9vbHRpcC5ub0NvbmZsaWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICQuZm4udG9vbHRpcCA9IG9sZFxuICAgIHJldHVybiB0aGlzXG4gIH1cblxufShqUXVlcnkpO1xuXG4vKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIEJvb3RzdHJhcDogcG9wb3Zlci5qcyB2My40LjFcbiAqIGh0dHBzOi8vZ2V0Ym9vdHN0cmFwLmNvbS9kb2NzLzMuNC9qYXZhc2NyaXB0LyNwb3BvdmVyc1xuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBDb3B5cmlnaHQgMjAxMS0yMDE5IFR3aXR0ZXIsIEluYy5cbiAqIExpY2Vuc2VkIHVuZGVyIE1JVCAoaHR0cHM6Ly9naXRodWIuY29tL3R3YnMvYm9vdHN0cmFwL2Jsb2IvbWFzdGVyL0xJQ0VOU0UpXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi9cblxuXG4rZnVuY3Rpb24gKCQpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIC8vIFBPUE9WRVIgUFVCTElDIENMQVNTIERFRklOSVRJT05cbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gIHZhciBQb3BvdmVyID0gZnVuY3Rpb24gKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLmluaXQoJ3BvcG92ZXInLCBlbGVtZW50LCBvcHRpb25zKVxuICB9XG5cbiAgaWYgKCEkLmZuLnRvb2x0aXApIHRocm93IG5ldyBFcnJvcignUG9wb3ZlciByZXF1aXJlcyB0b29sdGlwLmpzJylcblxuICBQb3BvdmVyLlZFUlNJT04gID0gJzMuNC4xJ1xuXG4gIFBvcG92ZXIuREVGQVVMVFMgPSAkLmV4dGVuZCh7fSwgJC5mbi50b29sdGlwLkNvbnN0cnVjdG9yLkRFRkFVTFRTLCB7XG4gICAgcGxhY2VtZW50OiAncmlnaHQnLFxuICAgIHRyaWdnZXI6ICdjbGljaycsXG4gICAgY29udGVudDogJycsXG4gICAgdGVtcGxhdGU6ICc8ZGl2IGNsYXNzPVwicG9wb3ZlclwiIHJvbGU9XCJ0b29sdGlwXCI+PGRpdiBjbGFzcz1cImFycm93XCI+PC9kaXY+PGgzIGNsYXNzPVwicG9wb3Zlci10aXRsZVwiPjwvaDM+PGRpdiBjbGFzcz1cInBvcG92ZXItY29udGVudFwiPjwvZGl2PjwvZGl2PidcbiAgfSlcblxuXG4gIC8vIE5PVEU6IFBPUE9WRVIgRVhURU5EUyB0b29sdGlwLmpzXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgUG9wb3Zlci5wcm90b3R5cGUgPSAkLmV4dGVuZCh7fSwgJC5mbi50b29sdGlwLkNvbnN0cnVjdG9yLnByb3RvdHlwZSlcblxuICBQb3BvdmVyLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFBvcG92ZXJcblxuICBQb3BvdmVyLnByb3RvdHlwZS5nZXREZWZhdWx0cyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gUG9wb3Zlci5ERUZBVUxUU1xuICB9XG5cbiAgUG9wb3Zlci5wcm90b3R5cGUuc2V0Q29udGVudCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgJHRpcCAgICA9IHRoaXMudGlwKClcbiAgICB2YXIgdGl0bGUgICA9IHRoaXMuZ2V0VGl0bGUoKVxuICAgIHZhciBjb250ZW50ID0gdGhpcy5nZXRDb250ZW50KClcblxuICAgIGlmICh0aGlzLm9wdGlvbnMuaHRtbCkge1xuICAgICAgdmFyIHR5cGVDb250ZW50ID0gdHlwZW9mIGNvbnRlbnRcblxuICAgICAgaWYgKHRoaXMub3B0aW9ucy5zYW5pdGl6ZSkge1xuICAgICAgICB0aXRsZSA9IHRoaXMuc2FuaXRpemVIdG1sKHRpdGxlKVxuXG4gICAgICAgIGlmICh0eXBlQ29udGVudCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICBjb250ZW50ID0gdGhpcy5zYW5pdGl6ZUh0bWwoY29udGVudClcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAkdGlwLmZpbmQoJy5wb3BvdmVyLXRpdGxlJykuaHRtbCh0aXRsZSlcbiAgICAgICR0aXAuZmluZCgnLnBvcG92ZXItY29udGVudCcpLmNoaWxkcmVuKCkuZGV0YWNoKCkuZW5kKClbXG4gICAgICAgIHR5cGVDb250ZW50ID09PSAnc3RyaW5nJyA/ICdodG1sJyA6ICdhcHBlbmQnXG4gICAgICBdKGNvbnRlbnQpXG4gICAgfSBlbHNlIHtcbiAgICAgICR0aXAuZmluZCgnLnBvcG92ZXItdGl0bGUnKS50ZXh0KHRpdGxlKVxuICAgICAgJHRpcC5maW5kKCcucG9wb3Zlci1jb250ZW50JykuY2hpbGRyZW4oKS5kZXRhY2goKS5lbmQoKS50ZXh0KGNvbnRlbnQpXG4gICAgfVxuXG4gICAgJHRpcC5yZW1vdmVDbGFzcygnZmFkZSB0b3AgYm90dG9tIGxlZnQgcmlnaHQgaW4nKVxuXG4gICAgLy8gSUU4IGRvZXNuJ3QgYWNjZXB0IGhpZGluZyB2aWEgdGhlIGA6ZW1wdHlgIHBzZXVkbyBzZWxlY3Rvciwgd2UgaGF2ZSB0byBkb1xuICAgIC8vIHRoaXMgbWFudWFsbHkgYnkgY2hlY2tpbmcgdGhlIGNvbnRlbnRzLlxuICAgIGlmICghJHRpcC5maW5kKCcucG9wb3Zlci10aXRsZScpLmh0bWwoKSkgJHRpcC5maW5kKCcucG9wb3Zlci10aXRsZScpLmhpZGUoKVxuICB9XG5cbiAgUG9wb3Zlci5wcm90b3R5cGUuaGFzQ29udGVudCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRUaXRsZSgpIHx8IHRoaXMuZ2V0Q29udGVudCgpXG4gIH1cblxuICBQb3BvdmVyLnByb3RvdHlwZS5nZXRDb250ZW50ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciAkZSA9IHRoaXMuJGVsZW1lbnRcbiAgICB2YXIgbyAgPSB0aGlzLm9wdGlvbnNcblxuICAgIHJldHVybiAkZS5hdHRyKCdkYXRhLWNvbnRlbnQnKVxuICAgICAgfHwgKHR5cGVvZiBvLmNvbnRlbnQgPT0gJ2Z1bmN0aW9uJyA/XG4gICAgICAgIG8uY29udGVudC5jYWxsKCRlWzBdKSA6XG4gICAgICAgIG8uY29udGVudClcbiAgfVxuXG4gIFBvcG92ZXIucHJvdG90eXBlLmFycm93ID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAodGhpcy4kYXJyb3cgPSB0aGlzLiRhcnJvdyB8fCB0aGlzLnRpcCgpLmZpbmQoJy5hcnJvdycpKVxuICB9XG5cblxuICAvLyBQT1BPVkVSIFBMVUdJTiBERUZJTklUSU9OXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICBmdW5jdGlvbiBQbHVnaW4ob3B0aW9uKSB7XG4gICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgJHRoaXMgICA9ICQodGhpcylcbiAgICAgIHZhciBkYXRhICAgID0gJHRoaXMuZGF0YSgnYnMucG9wb3ZlcicpXG4gICAgICB2YXIgb3B0aW9ucyA9IHR5cGVvZiBvcHRpb24gPT0gJ29iamVjdCcgJiYgb3B0aW9uXG5cbiAgICAgIGlmICghZGF0YSAmJiAvZGVzdHJveXxoaWRlLy50ZXN0KG9wdGlvbikpIHJldHVyblxuICAgICAgaWYgKCFkYXRhKSAkdGhpcy5kYXRhKCdicy5wb3BvdmVyJywgKGRhdGEgPSBuZXcgUG9wb3Zlcih0aGlzLCBvcHRpb25zKSkpXG4gICAgICBpZiAodHlwZW9mIG9wdGlvbiA9PSAnc3RyaW5nJykgZGF0YVtvcHRpb25dKClcbiAgICB9KVxuICB9XG5cbiAgdmFyIG9sZCA9ICQuZm4ucG9wb3ZlclxuXG4gICQuZm4ucG9wb3ZlciAgICAgICAgICAgICA9IFBsdWdpblxuICAkLmZuLnBvcG92ZXIuQ29uc3RydWN0b3IgPSBQb3BvdmVyXG5cblxuICAvLyBQT1BPVkVSIE5PIENPTkZMSUNUXG4gIC8vID09PT09PT09PT09PT09PT09PT1cblxuICAkLmZuLnBvcG92ZXIubm9Db25mbGljdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAkLmZuLnBvcG92ZXIgPSBvbGRcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbn0oalF1ZXJ5KTtcblxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBCb290c3RyYXA6IHNjcm9sbHNweS5qcyB2My40LjFcbiAqIGh0dHBzOi8vZ2V0Ym9vdHN0cmFwLmNvbS9kb2NzLzMuNC9qYXZhc2NyaXB0LyNzY3JvbGxzcHlcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogQ29weXJpZ2h0IDIwMTEtMjAxOSBUd2l0dGVyLCBJbmMuXG4gKiBMaWNlbnNlZCB1bmRlciBNSVQgKGh0dHBzOi8vZ2l0aHViLmNvbS90d2JzL2Jvb3RzdHJhcC9ibG9iL21hc3Rlci9MSUNFTlNFKVxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovXG5cblxuK2Z1bmN0aW9uICgkKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICAvLyBTQ1JPTExTUFkgQ0xBU1MgREVGSU5JVElPTlxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gIGZ1bmN0aW9uIFNjcm9sbFNweShlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy4kYm9keSAgICAgICAgICA9ICQoZG9jdW1lbnQuYm9keSlcbiAgICB0aGlzLiRzY3JvbGxFbGVtZW50ID0gJChlbGVtZW50KS5pcyhkb2N1bWVudC5ib2R5KSA/ICQod2luZG93KSA6ICQoZWxlbWVudClcbiAgICB0aGlzLm9wdGlvbnMgICAgICAgID0gJC5leHRlbmQoe30sIFNjcm9sbFNweS5ERUZBVUxUUywgb3B0aW9ucylcbiAgICB0aGlzLnNlbGVjdG9yICAgICAgID0gKHRoaXMub3B0aW9ucy50YXJnZXQgfHwgJycpICsgJyAubmF2IGxpID4gYSdcbiAgICB0aGlzLm9mZnNldHMgICAgICAgID0gW11cbiAgICB0aGlzLnRhcmdldHMgICAgICAgID0gW11cbiAgICB0aGlzLmFjdGl2ZVRhcmdldCAgID0gbnVsbFxuICAgIHRoaXMuc2Nyb2xsSGVpZ2h0ICAgPSAwXG5cbiAgICB0aGlzLiRzY3JvbGxFbGVtZW50Lm9uKCdzY3JvbGwuYnMuc2Nyb2xsc3B5JywgJC5wcm94eSh0aGlzLnByb2Nlc3MsIHRoaXMpKVxuICAgIHRoaXMucmVmcmVzaCgpXG4gICAgdGhpcy5wcm9jZXNzKClcbiAgfVxuXG4gIFNjcm9sbFNweS5WRVJTSU9OICA9ICczLjQuMSdcblxuICBTY3JvbGxTcHkuREVGQVVMVFMgPSB7XG4gICAgb2Zmc2V0OiAxMFxuICB9XG5cbiAgU2Nyb2xsU3B5LnByb3RvdHlwZS5nZXRTY3JvbGxIZWlnaHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuJHNjcm9sbEVsZW1lbnRbMF0uc2Nyb2xsSGVpZ2h0IHx8IE1hdGgubWF4KHRoaXMuJGJvZHlbMF0uc2Nyb2xsSGVpZ2h0LCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsSGVpZ2h0KVxuICB9XG5cbiAgU2Nyb2xsU3B5LnByb3RvdHlwZS5yZWZyZXNoID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciB0aGF0ICAgICAgICAgID0gdGhpc1xuICAgIHZhciBvZmZzZXRNZXRob2QgID0gJ29mZnNldCdcbiAgICB2YXIgb2Zmc2V0QmFzZSAgICA9IDBcblxuICAgIHRoaXMub2Zmc2V0cyAgICAgID0gW11cbiAgICB0aGlzLnRhcmdldHMgICAgICA9IFtdXG4gICAgdGhpcy5zY3JvbGxIZWlnaHQgPSB0aGlzLmdldFNjcm9sbEhlaWdodCgpXG5cbiAgICBpZiAoISQuaXNXaW5kb3codGhpcy4kc2Nyb2xsRWxlbWVudFswXSkpIHtcbiAgICAgIG9mZnNldE1ldGhvZCA9ICdwb3NpdGlvbidcbiAgICAgIG9mZnNldEJhc2UgICA9IHRoaXMuJHNjcm9sbEVsZW1lbnQuc2Nyb2xsVG9wKClcbiAgICB9XG5cbiAgICB0aGlzLiRib2R5XG4gICAgICAuZmluZCh0aGlzLnNlbGVjdG9yKVxuICAgICAgLm1hcChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciAkZWwgICA9ICQodGhpcylcbiAgICAgICAgdmFyIGhyZWYgID0gJGVsLmRhdGEoJ3RhcmdldCcpIHx8ICRlbC5hdHRyKCdocmVmJylcbiAgICAgICAgdmFyICRocmVmID0gL14jLi8udGVzdChocmVmKSAmJiAkKGhyZWYpXG5cbiAgICAgICAgcmV0dXJuICgkaHJlZlxuICAgICAgICAgICYmICRocmVmLmxlbmd0aFxuICAgICAgICAgICYmICRocmVmLmlzKCc6dmlzaWJsZScpXG4gICAgICAgICAgJiYgW1skaHJlZltvZmZzZXRNZXRob2RdKCkudG9wICsgb2Zmc2V0QmFzZSwgaHJlZl1dKSB8fCBudWxsXG4gICAgICB9KVxuICAgICAgLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGFbMF0gLSBiWzBdIH0pXG4gICAgICAuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoYXQub2Zmc2V0cy5wdXNoKHRoaXNbMF0pXG4gICAgICAgIHRoYXQudGFyZ2V0cy5wdXNoKHRoaXNbMV0pXG4gICAgICB9KVxuICB9XG5cbiAgU2Nyb2xsU3B5LnByb3RvdHlwZS5wcm9jZXNzID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBzY3JvbGxUb3AgICAgPSB0aGlzLiRzY3JvbGxFbGVtZW50LnNjcm9sbFRvcCgpICsgdGhpcy5vcHRpb25zLm9mZnNldFxuICAgIHZhciBzY3JvbGxIZWlnaHQgPSB0aGlzLmdldFNjcm9sbEhlaWdodCgpXG4gICAgdmFyIG1heFNjcm9sbCAgICA9IHRoaXMub3B0aW9ucy5vZmZzZXQgKyBzY3JvbGxIZWlnaHQgLSB0aGlzLiRzY3JvbGxFbGVtZW50LmhlaWdodCgpXG4gICAgdmFyIG9mZnNldHMgICAgICA9IHRoaXMub2Zmc2V0c1xuICAgIHZhciB0YXJnZXRzICAgICAgPSB0aGlzLnRhcmdldHNcbiAgICB2YXIgYWN0aXZlVGFyZ2V0ID0gdGhpcy5hY3RpdmVUYXJnZXRcbiAgICB2YXIgaVxuXG4gICAgaWYgKHRoaXMuc2Nyb2xsSGVpZ2h0ICE9IHNjcm9sbEhlaWdodCkge1xuICAgICAgdGhpcy5yZWZyZXNoKClcbiAgICB9XG5cbiAgICBpZiAoc2Nyb2xsVG9wID49IG1heFNjcm9sbCkge1xuICAgICAgcmV0dXJuIGFjdGl2ZVRhcmdldCAhPSAoaSA9IHRhcmdldHNbdGFyZ2V0cy5sZW5ndGggLSAxXSkgJiYgdGhpcy5hY3RpdmF0ZShpKVxuICAgIH1cblxuICAgIGlmIChhY3RpdmVUYXJnZXQgJiYgc2Nyb2xsVG9wIDwgb2Zmc2V0c1swXSkge1xuICAgICAgdGhpcy5hY3RpdmVUYXJnZXQgPSBudWxsXG4gICAgICByZXR1cm4gdGhpcy5jbGVhcigpXG4gICAgfVxuXG4gICAgZm9yIChpID0gb2Zmc2V0cy5sZW5ndGg7IGktLTspIHtcbiAgICAgIGFjdGl2ZVRhcmdldCAhPSB0YXJnZXRzW2ldXG4gICAgICAgICYmIHNjcm9sbFRvcCA+PSBvZmZzZXRzW2ldXG4gICAgICAgICYmIChvZmZzZXRzW2kgKyAxXSA9PT0gdW5kZWZpbmVkIHx8IHNjcm9sbFRvcCA8IG9mZnNldHNbaSArIDFdKVxuICAgICAgICAmJiB0aGlzLmFjdGl2YXRlKHRhcmdldHNbaV0pXG4gICAgfVxuICB9XG5cbiAgU2Nyb2xsU3B5LnByb3RvdHlwZS5hY3RpdmF0ZSA9IGZ1bmN0aW9uICh0YXJnZXQpIHtcbiAgICB0aGlzLmFjdGl2ZVRhcmdldCA9IHRhcmdldFxuXG4gICAgdGhpcy5jbGVhcigpXG5cbiAgICB2YXIgc2VsZWN0b3IgPSB0aGlzLnNlbGVjdG9yICtcbiAgICAgICdbZGF0YS10YXJnZXQ9XCInICsgdGFyZ2V0ICsgJ1wiXSwnICtcbiAgICAgIHRoaXMuc2VsZWN0b3IgKyAnW2hyZWY9XCInICsgdGFyZ2V0ICsgJ1wiXSdcblxuICAgIHZhciBhY3RpdmUgPSAkKHNlbGVjdG9yKVxuICAgICAgLnBhcmVudHMoJ2xpJylcbiAgICAgIC5hZGRDbGFzcygnYWN0aXZlJylcblxuICAgIGlmIChhY3RpdmUucGFyZW50KCcuZHJvcGRvd24tbWVudScpLmxlbmd0aCkge1xuICAgICAgYWN0aXZlID0gYWN0aXZlXG4gICAgICAgIC5jbG9zZXN0KCdsaS5kcm9wZG93bicpXG4gICAgICAgIC5hZGRDbGFzcygnYWN0aXZlJylcbiAgICB9XG5cbiAgICBhY3RpdmUudHJpZ2dlcignYWN0aXZhdGUuYnMuc2Nyb2xsc3B5JylcbiAgfVxuXG4gIFNjcm9sbFNweS5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgJCh0aGlzLnNlbGVjdG9yKVxuICAgICAgLnBhcmVudHNVbnRpbCh0aGlzLm9wdGlvbnMudGFyZ2V0LCAnLmFjdGl2ZScpXG4gICAgICAucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpXG4gIH1cblxuXG4gIC8vIFNDUk9MTFNQWSBQTFVHSU4gREVGSU5JVElPTlxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICBmdW5jdGlvbiBQbHVnaW4ob3B0aW9uKSB7XG4gICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgJHRoaXMgICA9ICQodGhpcylcbiAgICAgIHZhciBkYXRhICAgID0gJHRoaXMuZGF0YSgnYnMuc2Nyb2xsc3B5JylcbiAgICAgIHZhciBvcHRpb25zID0gdHlwZW9mIG9wdGlvbiA9PSAnb2JqZWN0JyAmJiBvcHRpb25cblxuICAgICAgaWYgKCFkYXRhKSAkdGhpcy5kYXRhKCdicy5zY3JvbGxzcHknLCAoZGF0YSA9IG5ldyBTY3JvbGxTcHkodGhpcywgb3B0aW9ucykpKVxuICAgICAgaWYgKHR5cGVvZiBvcHRpb24gPT0gJ3N0cmluZycpIGRhdGFbb3B0aW9uXSgpXG4gICAgfSlcbiAgfVxuXG4gIHZhciBvbGQgPSAkLmZuLnNjcm9sbHNweVxuXG4gICQuZm4uc2Nyb2xsc3B5ICAgICAgICAgICAgID0gUGx1Z2luXG4gICQuZm4uc2Nyb2xsc3B5LkNvbnN0cnVjdG9yID0gU2Nyb2xsU3B5XG5cblxuICAvLyBTQ1JPTExTUFkgTk8gQ09ORkxJQ1RcbiAgLy8gPT09PT09PT09PT09PT09PT09PT09XG5cbiAgJC5mbi5zY3JvbGxzcHkubm9Db25mbGljdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAkLmZuLnNjcm9sbHNweSA9IG9sZFxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuXG4gIC8vIFNDUk9MTFNQWSBEQVRBLUFQSVxuICAvLyA9PT09PT09PT09PT09PT09PT1cblxuICAkKHdpbmRvdykub24oJ2xvYWQuYnMuc2Nyb2xsc3B5LmRhdGEtYXBpJywgZnVuY3Rpb24gKCkge1xuICAgICQoJ1tkYXRhLXNweT1cInNjcm9sbFwiXScpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgdmFyICRzcHkgPSAkKHRoaXMpXG4gICAgICBQbHVnaW4uY2FsbCgkc3B5LCAkc3B5LmRhdGEoKSlcbiAgICB9KVxuICB9KVxuXG59KGpRdWVyeSk7XG5cbi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogQm9vdHN0cmFwOiB0YWIuanMgdjMuNC4xXG4gKiBodHRwczovL2dldGJvb3RzdHJhcC5jb20vZG9jcy8zLjQvamF2YXNjcmlwdC8jdGFic1xuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBDb3B5cmlnaHQgMjAxMS0yMDE5IFR3aXR0ZXIsIEluYy5cbiAqIExpY2Vuc2VkIHVuZGVyIE1JVCAoaHR0cHM6Ly9naXRodWIuY29tL3R3YnMvYm9vdHN0cmFwL2Jsb2IvbWFzdGVyL0xJQ0VOU0UpXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi9cblxuXG4rZnVuY3Rpb24gKCQpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIC8vIFRBQiBDTEFTUyBERUZJTklUSU9OXG4gIC8vID09PT09PT09PT09PT09PT09PT09XG5cbiAgdmFyIFRhYiA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgLy8ganNjczpkaXNhYmxlIHJlcXVpcmVEb2xsYXJCZWZvcmVqUXVlcnlBc3NpZ25tZW50XG4gICAgdGhpcy5lbGVtZW50ID0gJChlbGVtZW50KVxuICAgIC8vIGpzY3M6ZW5hYmxlIHJlcXVpcmVEb2xsYXJCZWZvcmVqUXVlcnlBc3NpZ25tZW50XG4gIH1cblxuICBUYWIuVkVSU0lPTiA9ICczLjQuMSdcblxuICBUYWIuVFJBTlNJVElPTl9EVVJBVElPTiA9IDE1MFxuXG4gIFRhYi5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgJHRoaXMgICAgPSB0aGlzLmVsZW1lbnRcbiAgICB2YXIgJHVsICAgICAgPSAkdGhpcy5jbG9zZXN0KCd1bDpub3QoLmRyb3Bkb3duLW1lbnUpJylcbiAgICB2YXIgc2VsZWN0b3IgPSAkdGhpcy5kYXRhKCd0YXJnZXQnKVxuXG4gICAgaWYgKCFzZWxlY3Rvcikge1xuICAgICAgc2VsZWN0b3IgPSAkdGhpcy5hdHRyKCdocmVmJylcbiAgICAgIHNlbGVjdG9yID0gc2VsZWN0b3IgJiYgc2VsZWN0b3IucmVwbGFjZSgvLiooPz0jW15cXHNdKiQpLywgJycpIC8vIHN0cmlwIGZvciBpZTdcbiAgICB9XG5cbiAgICBpZiAoJHRoaXMucGFyZW50KCdsaScpLmhhc0NsYXNzKCdhY3RpdmUnKSkgcmV0dXJuXG5cbiAgICB2YXIgJHByZXZpb3VzID0gJHVsLmZpbmQoJy5hY3RpdmU6bGFzdCBhJylcbiAgICB2YXIgaGlkZUV2ZW50ID0gJC5FdmVudCgnaGlkZS5icy50YWInLCB7XG4gICAgICByZWxhdGVkVGFyZ2V0OiAkdGhpc1swXVxuICAgIH0pXG4gICAgdmFyIHNob3dFdmVudCA9ICQuRXZlbnQoJ3Nob3cuYnMudGFiJywge1xuICAgICAgcmVsYXRlZFRhcmdldDogJHByZXZpb3VzWzBdXG4gICAgfSlcblxuICAgICRwcmV2aW91cy50cmlnZ2VyKGhpZGVFdmVudClcbiAgICAkdGhpcy50cmlnZ2VyKHNob3dFdmVudClcblxuICAgIGlmIChzaG93RXZlbnQuaXNEZWZhdWx0UHJldmVudGVkKCkgfHwgaGlkZUV2ZW50LmlzRGVmYXVsdFByZXZlbnRlZCgpKSByZXR1cm5cblxuICAgIHZhciAkdGFyZ2V0ID0gJChkb2N1bWVudCkuZmluZChzZWxlY3RvcilcblxuICAgIHRoaXMuYWN0aXZhdGUoJHRoaXMuY2xvc2VzdCgnbGknKSwgJHVsKVxuICAgIHRoaXMuYWN0aXZhdGUoJHRhcmdldCwgJHRhcmdldC5wYXJlbnQoKSwgZnVuY3Rpb24gKCkge1xuICAgICAgJHByZXZpb3VzLnRyaWdnZXIoe1xuICAgICAgICB0eXBlOiAnaGlkZGVuLmJzLnRhYicsXG4gICAgICAgIHJlbGF0ZWRUYXJnZXQ6ICR0aGlzWzBdXG4gICAgICB9KVxuICAgICAgJHRoaXMudHJpZ2dlcih7XG4gICAgICAgIHR5cGU6ICdzaG93bi5icy50YWInLFxuICAgICAgICByZWxhdGVkVGFyZ2V0OiAkcHJldmlvdXNbMF1cbiAgICAgIH0pXG4gICAgfSlcbiAgfVxuXG4gIFRhYi5wcm90b3R5cGUuYWN0aXZhdGUgPSBmdW5jdGlvbiAoZWxlbWVudCwgY29udGFpbmVyLCBjYWxsYmFjaykge1xuICAgIHZhciAkYWN0aXZlICAgID0gY29udGFpbmVyLmZpbmQoJz4gLmFjdGl2ZScpXG4gICAgdmFyIHRyYW5zaXRpb24gPSBjYWxsYmFja1xuICAgICAgJiYgJC5zdXBwb3J0LnRyYW5zaXRpb25cbiAgICAgICYmICgkYWN0aXZlLmxlbmd0aCAmJiAkYWN0aXZlLmhhc0NsYXNzKCdmYWRlJykgfHwgISFjb250YWluZXIuZmluZCgnPiAuZmFkZScpLmxlbmd0aClcblxuICAgIGZ1bmN0aW9uIG5leHQoKSB7XG4gICAgICAkYWN0aXZlXG4gICAgICAgIC5yZW1vdmVDbGFzcygnYWN0aXZlJylcbiAgICAgICAgLmZpbmQoJz4gLmRyb3Bkb3duLW1lbnUgPiAuYWN0aXZlJylcbiAgICAgICAgLnJlbW92ZUNsYXNzKCdhY3RpdmUnKVxuICAgICAgICAuZW5kKClcbiAgICAgICAgLmZpbmQoJ1tkYXRhLXRvZ2dsZT1cInRhYlwiXScpXG4gICAgICAgIC5hdHRyKCdhcmlhLWV4cGFuZGVkJywgZmFsc2UpXG5cbiAgICAgIGVsZW1lbnRcbiAgICAgICAgLmFkZENsYXNzKCdhY3RpdmUnKVxuICAgICAgICAuZmluZCgnW2RhdGEtdG9nZ2xlPVwidGFiXCJdJylcbiAgICAgICAgLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCB0cnVlKVxuXG4gICAgICBpZiAodHJhbnNpdGlvbikge1xuICAgICAgICBlbGVtZW50WzBdLm9mZnNldFdpZHRoIC8vIHJlZmxvdyBmb3IgdHJhbnNpdGlvblxuICAgICAgICBlbGVtZW50LmFkZENsYXNzKCdpbicpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBlbGVtZW50LnJlbW92ZUNsYXNzKCdmYWRlJylcbiAgICAgIH1cblxuICAgICAgaWYgKGVsZW1lbnQucGFyZW50KCcuZHJvcGRvd24tbWVudScpLmxlbmd0aCkge1xuICAgICAgICBlbGVtZW50XG4gICAgICAgICAgLmNsb3Nlc3QoJ2xpLmRyb3Bkb3duJylcbiAgICAgICAgICAuYWRkQ2xhc3MoJ2FjdGl2ZScpXG4gICAgICAgICAgLmVuZCgpXG4gICAgICAgICAgLmZpbmQoJ1tkYXRhLXRvZ2dsZT1cInRhYlwiXScpXG4gICAgICAgICAgLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCB0cnVlKVxuICAgICAgfVxuXG4gICAgICBjYWxsYmFjayAmJiBjYWxsYmFjaygpXG4gICAgfVxuXG4gICAgJGFjdGl2ZS5sZW5ndGggJiYgdHJhbnNpdGlvbiA/XG4gICAgICAkYWN0aXZlXG4gICAgICAgIC5vbmUoJ2JzVHJhbnNpdGlvbkVuZCcsIG5leHQpXG4gICAgICAgIC5lbXVsYXRlVHJhbnNpdGlvbkVuZChUYWIuVFJBTlNJVElPTl9EVVJBVElPTikgOlxuICAgICAgbmV4dCgpXG5cbiAgICAkYWN0aXZlLnJlbW92ZUNsYXNzKCdpbicpXG4gIH1cblxuXG4gIC8vIFRBQiBQTFVHSU4gREVGSU5JVElPTlxuICAvLyA9PT09PT09PT09PT09PT09PT09PT1cblxuICBmdW5jdGlvbiBQbHVnaW4ob3B0aW9uKSB7XG4gICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgJHRoaXMgPSAkKHRoaXMpXG4gICAgICB2YXIgZGF0YSAgPSAkdGhpcy5kYXRhKCdicy50YWInKVxuXG4gICAgICBpZiAoIWRhdGEpICR0aGlzLmRhdGEoJ2JzLnRhYicsIChkYXRhID0gbmV3IFRhYih0aGlzKSkpXG4gICAgICBpZiAodHlwZW9mIG9wdGlvbiA9PSAnc3RyaW5nJykgZGF0YVtvcHRpb25dKClcbiAgICB9KVxuICB9XG5cbiAgdmFyIG9sZCA9ICQuZm4udGFiXG5cbiAgJC5mbi50YWIgICAgICAgICAgICAgPSBQbHVnaW5cbiAgJC5mbi50YWIuQ29uc3RydWN0b3IgPSBUYWJcblxuXG4gIC8vIFRBQiBOTyBDT05GTElDVFxuICAvLyA9PT09PT09PT09PT09PT1cblxuICAkLmZuLnRhYi5ub0NvbmZsaWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICQuZm4udGFiID0gb2xkXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG5cbiAgLy8gVEFCIERBVEEtQVBJXG4gIC8vID09PT09PT09PT09PVxuXG4gIHZhciBjbGlja0hhbmRsZXIgPSBmdW5jdGlvbiAoZSkge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIFBsdWdpbi5jYWxsKCQodGhpcyksICdzaG93JylcbiAgfVxuXG4gICQoZG9jdW1lbnQpXG4gICAgLm9uKCdjbGljay5icy50YWIuZGF0YS1hcGknLCAnW2RhdGEtdG9nZ2xlPVwidGFiXCJdJywgY2xpY2tIYW5kbGVyKVxuICAgIC5vbignY2xpY2suYnMudGFiLmRhdGEtYXBpJywgJ1tkYXRhLXRvZ2dsZT1cInBpbGxcIl0nLCBjbGlja0hhbmRsZXIpXG5cbn0oalF1ZXJ5KTtcblxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBCb290c3RyYXA6IGFmZml4LmpzIHYzLjQuMVxuICogaHR0cHM6Ly9nZXRib290c3RyYXAuY29tL2RvY3MvMy40L2phdmFzY3JpcHQvI2FmZml4XG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIENvcHlyaWdodCAyMDExLTIwMTkgVHdpdHRlciwgSW5jLlxuICogTGljZW5zZWQgdW5kZXIgTUlUIChodHRwczovL2dpdGh1Yi5jb20vdHdicy9ib290c3RyYXAvYmxvYi9tYXN0ZXIvTElDRU5TRSlcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqL1xuXG5cbitmdW5jdGlvbiAoJCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgLy8gQUZGSVggQ0xBU1MgREVGSU5JVElPTlxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09XG5cbiAgdmFyIEFmZml4ID0gZnVuY3Rpb24gKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgQWZmaXguREVGQVVMVFMsIG9wdGlvbnMpXG5cbiAgICB2YXIgdGFyZ2V0ID0gdGhpcy5vcHRpb25zLnRhcmdldCA9PT0gQWZmaXguREVGQVVMVFMudGFyZ2V0ID8gJCh0aGlzLm9wdGlvbnMudGFyZ2V0KSA6ICQoZG9jdW1lbnQpLmZpbmQodGhpcy5vcHRpb25zLnRhcmdldClcblxuICAgIHRoaXMuJHRhcmdldCA9IHRhcmdldFxuICAgICAgLm9uKCdzY3JvbGwuYnMuYWZmaXguZGF0YS1hcGknLCAkLnByb3h5KHRoaXMuY2hlY2tQb3NpdGlvbiwgdGhpcykpXG4gICAgICAub24oJ2NsaWNrLmJzLmFmZml4LmRhdGEtYXBpJywgICQucHJveHkodGhpcy5jaGVja1Bvc2l0aW9uV2l0aEV2ZW50TG9vcCwgdGhpcykpXG5cbiAgICB0aGlzLiRlbGVtZW50ICAgICA9ICQoZWxlbWVudClcbiAgICB0aGlzLmFmZml4ZWQgICAgICA9IG51bGxcbiAgICB0aGlzLnVucGluICAgICAgICA9IG51bGxcbiAgICB0aGlzLnBpbm5lZE9mZnNldCA9IG51bGxcblxuICAgIHRoaXMuY2hlY2tQb3NpdGlvbigpXG4gIH1cblxuICBBZmZpeC5WRVJTSU9OICA9ICczLjQuMSdcblxuICBBZmZpeC5SRVNFVCAgICA9ICdhZmZpeCBhZmZpeC10b3AgYWZmaXgtYm90dG9tJ1xuXG4gIEFmZml4LkRFRkFVTFRTID0ge1xuICAgIG9mZnNldDogMCxcbiAgICB0YXJnZXQ6IHdpbmRvd1xuICB9XG5cbiAgQWZmaXgucHJvdG90eXBlLmdldFN0YXRlID0gZnVuY3Rpb24gKHNjcm9sbEhlaWdodCwgaGVpZ2h0LCBvZmZzZXRUb3AsIG9mZnNldEJvdHRvbSkge1xuICAgIHZhciBzY3JvbGxUb3AgICAgPSB0aGlzLiR0YXJnZXQuc2Nyb2xsVG9wKClcbiAgICB2YXIgcG9zaXRpb24gICAgID0gdGhpcy4kZWxlbWVudC5vZmZzZXQoKVxuICAgIHZhciB0YXJnZXRIZWlnaHQgPSB0aGlzLiR0YXJnZXQuaGVpZ2h0KClcblxuICAgIGlmIChvZmZzZXRUb3AgIT0gbnVsbCAmJiB0aGlzLmFmZml4ZWQgPT0gJ3RvcCcpIHJldHVybiBzY3JvbGxUb3AgPCBvZmZzZXRUb3AgPyAndG9wJyA6IGZhbHNlXG5cbiAgICBpZiAodGhpcy5hZmZpeGVkID09ICdib3R0b20nKSB7XG4gICAgICBpZiAob2Zmc2V0VG9wICE9IG51bGwpIHJldHVybiAoc2Nyb2xsVG9wICsgdGhpcy51bnBpbiA8PSBwb3NpdGlvbi50b3ApID8gZmFsc2UgOiAnYm90dG9tJ1xuICAgICAgcmV0dXJuIChzY3JvbGxUb3AgKyB0YXJnZXRIZWlnaHQgPD0gc2Nyb2xsSGVpZ2h0IC0gb2Zmc2V0Qm90dG9tKSA/IGZhbHNlIDogJ2JvdHRvbSdcbiAgICB9XG5cbiAgICB2YXIgaW5pdGlhbGl6aW5nICAgPSB0aGlzLmFmZml4ZWQgPT0gbnVsbFxuICAgIHZhciBjb2xsaWRlclRvcCAgICA9IGluaXRpYWxpemluZyA/IHNjcm9sbFRvcCA6IHBvc2l0aW9uLnRvcFxuICAgIHZhciBjb2xsaWRlckhlaWdodCA9IGluaXRpYWxpemluZyA/IHRhcmdldEhlaWdodCA6IGhlaWdodFxuXG4gICAgaWYgKG9mZnNldFRvcCAhPSBudWxsICYmIHNjcm9sbFRvcCA8PSBvZmZzZXRUb3ApIHJldHVybiAndG9wJ1xuICAgIGlmIChvZmZzZXRCb3R0b20gIT0gbnVsbCAmJiAoY29sbGlkZXJUb3AgKyBjb2xsaWRlckhlaWdodCA+PSBzY3JvbGxIZWlnaHQgLSBvZmZzZXRCb3R0b20pKSByZXR1cm4gJ2JvdHRvbSdcblxuICAgIHJldHVybiBmYWxzZVxuICB9XG5cbiAgQWZmaXgucHJvdG90eXBlLmdldFBpbm5lZE9mZnNldCA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5waW5uZWRPZmZzZXQpIHJldHVybiB0aGlzLnBpbm5lZE9mZnNldFxuICAgIHRoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3MoQWZmaXguUkVTRVQpLmFkZENsYXNzKCdhZmZpeCcpXG4gICAgdmFyIHNjcm9sbFRvcCA9IHRoaXMuJHRhcmdldC5zY3JvbGxUb3AoKVxuICAgIHZhciBwb3NpdGlvbiAgPSB0aGlzLiRlbGVtZW50Lm9mZnNldCgpXG4gICAgcmV0dXJuICh0aGlzLnBpbm5lZE9mZnNldCA9IHBvc2l0aW9uLnRvcCAtIHNjcm9sbFRvcClcbiAgfVxuXG4gIEFmZml4LnByb3RvdHlwZS5jaGVja1Bvc2l0aW9uV2l0aEV2ZW50TG9vcCA9IGZ1bmN0aW9uICgpIHtcbiAgICBzZXRUaW1lb3V0KCQucHJveHkodGhpcy5jaGVja1Bvc2l0aW9uLCB0aGlzKSwgMSlcbiAgfVxuXG4gIEFmZml4LnByb3RvdHlwZS5jaGVja1Bvc2l0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICghdGhpcy4kZWxlbWVudC5pcygnOnZpc2libGUnKSkgcmV0dXJuXG5cbiAgICB2YXIgaGVpZ2h0ICAgICAgID0gdGhpcy4kZWxlbWVudC5oZWlnaHQoKVxuICAgIHZhciBvZmZzZXQgICAgICAgPSB0aGlzLm9wdGlvbnMub2Zmc2V0XG4gICAgdmFyIG9mZnNldFRvcCAgICA9IG9mZnNldC50b3BcbiAgICB2YXIgb2Zmc2V0Qm90dG9tID0gb2Zmc2V0LmJvdHRvbVxuICAgIHZhciBzY3JvbGxIZWlnaHQgPSBNYXRoLm1heCgkKGRvY3VtZW50KS5oZWlnaHQoKSwgJChkb2N1bWVudC5ib2R5KS5oZWlnaHQoKSlcblxuICAgIGlmICh0eXBlb2Ygb2Zmc2V0ICE9ICdvYmplY3QnKSAgICAgICAgIG9mZnNldEJvdHRvbSA9IG9mZnNldFRvcCA9IG9mZnNldFxuICAgIGlmICh0eXBlb2Ygb2Zmc2V0VG9wID09ICdmdW5jdGlvbicpICAgIG9mZnNldFRvcCAgICA9IG9mZnNldC50b3AodGhpcy4kZWxlbWVudClcbiAgICBpZiAodHlwZW9mIG9mZnNldEJvdHRvbSA9PSAnZnVuY3Rpb24nKSBvZmZzZXRCb3R0b20gPSBvZmZzZXQuYm90dG9tKHRoaXMuJGVsZW1lbnQpXG5cbiAgICB2YXIgYWZmaXggPSB0aGlzLmdldFN0YXRlKHNjcm9sbEhlaWdodCwgaGVpZ2h0LCBvZmZzZXRUb3AsIG9mZnNldEJvdHRvbSlcblxuICAgIGlmICh0aGlzLmFmZml4ZWQgIT0gYWZmaXgpIHtcbiAgICAgIGlmICh0aGlzLnVucGluICE9IG51bGwpIHRoaXMuJGVsZW1lbnQuY3NzKCd0b3AnLCAnJylcblxuICAgICAgdmFyIGFmZml4VHlwZSA9ICdhZmZpeCcgKyAoYWZmaXggPyAnLScgKyBhZmZpeCA6ICcnKVxuICAgICAgdmFyIGUgICAgICAgICA9ICQuRXZlbnQoYWZmaXhUeXBlICsgJy5icy5hZmZpeCcpXG5cbiAgICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcihlKVxuXG4gICAgICBpZiAoZS5pc0RlZmF1bHRQcmV2ZW50ZWQoKSkgcmV0dXJuXG5cbiAgICAgIHRoaXMuYWZmaXhlZCA9IGFmZml4XG4gICAgICB0aGlzLnVucGluID0gYWZmaXggPT0gJ2JvdHRvbScgPyB0aGlzLmdldFBpbm5lZE9mZnNldCgpIDogbnVsbFxuXG4gICAgICB0aGlzLiRlbGVtZW50XG4gICAgICAgIC5yZW1vdmVDbGFzcyhBZmZpeC5SRVNFVClcbiAgICAgICAgLmFkZENsYXNzKGFmZml4VHlwZSlcbiAgICAgICAgLnRyaWdnZXIoYWZmaXhUeXBlLnJlcGxhY2UoJ2FmZml4JywgJ2FmZml4ZWQnKSArICcuYnMuYWZmaXgnKVxuICAgIH1cblxuICAgIGlmIChhZmZpeCA9PSAnYm90dG9tJykge1xuICAgICAgdGhpcy4kZWxlbWVudC5vZmZzZXQoe1xuICAgICAgICB0b3A6IHNjcm9sbEhlaWdodCAtIGhlaWdodCAtIG9mZnNldEJvdHRvbVxuICAgICAgfSlcbiAgICB9XG4gIH1cblxuXG4gIC8vIEFGRklYIFBMVUdJTiBERUZJTklUSU9OXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgZnVuY3Rpb24gUGx1Z2luKG9wdGlvbikge1xuICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgdmFyICR0aGlzICAgPSAkKHRoaXMpXG4gICAgICB2YXIgZGF0YSAgICA9ICR0aGlzLmRhdGEoJ2JzLmFmZml4JylcbiAgICAgIHZhciBvcHRpb25zID0gdHlwZW9mIG9wdGlvbiA9PSAnb2JqZWN0JyAmJiBvcHRpb25cblxuICAgICAgaWYgKCFkYXRhKSAkdGhpcy5kYXRhKCdicy5hZmZpeCcsIChkYXRhID0gbmV3IEFmZml4KHRoaXMsIG9wdGlvbnMpKSlcbiAgICAgIGlmICh0eXBlb2Ygb3B0aW9uID09ICdzdHJpbmcnKSBkYXRhW29wdGlvbl0oKVxuICAgIH0pXG4gIH1cblxuICB2YXIgb2xkID0gJC5mbi5hZmZpeFxuXG4gICQuZm4uYWZmaXggICAgICAgICAgICAgPSBQbHVnaW5cbiAgJC5mbi5hZmZpeC5Db25zdHJ1Y3RvciA9IEFmZml4XG5cblxuICAvLyBBRkZJWCBOTyBDT05GTElDVFxuICAvLyA9PT09PT09PT09PT09PT09PVxuXG4gICQuZm4uYWZmaXgubm9Db25mbGljdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAkLmZuLmFmZml4ID0gb2xkXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG5cbiAgLy8gQUZGSVggREFUQS1BUElcbiAgLy8gPT09PT09PT09PT09PT1cblxuICAkKHdpbmRvdykub24oJ2xvYWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgJCgnW2RhdGEtc3B5PVwiYWZmaXhcIl0nKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciAkc3B5ID0gJCh0aGlzKVxuICAgICAgdmFyIGRhdGEgPSAkc3B5LmRhdGEoKVxuXG4gICAgICBkYXRhLm9mZnNldCA9IGRhdGEub2Zmc2V0IHx8IHt9XG5cbiAgICAgIGlmIChkYXRhLm9mZnNldEJvdHRvbSAhPSBudWxsKSBkYXRhLm9mZnNldC5ib3R0b20gPSBkYXRhLm9mZnNldEJvdHRvbVxuICAgICAgaWYgKGRhdGEub2Zmc2V0VG9wICAgICE9IG51bGwpIGRhdGEub2Zmc2V0LnRvcCAgICA9IGRhdGEub2Zmc2V0VG9wXG5cbiAgICAgIFBsdWdpbi5jYWxsKCRzcHksIGRhdGEpXG4gICAgfSlcbiAgfSlcblxufShqUXVlcnkpO1xuIiwiLy8gfC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyB8IEZsZXh5IGhlYWRlclxuLy8gfC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyB8XG4vLyB8IFRoaXMgalF1ZXJ5IHNjcmlwdCBpcyB3cml0dGVuIGJ5XG4vLyB8XG4vLyB8IE1vcnRlbiBOaXNzZW5cbi8vIHwgaGplbW1lc2lkZWtvbmdlbi5ka1xuLy8gfFxuXG52YXIgZmxleHlfaGVhZGVyID0gKGZ1bmN0aW9uICgkKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIHB1YiA9IHt9LFxuICAgICAgICAkaGVhZGVyX3N0YXRpYyA9ICQoJy5mbGV4eS1oZWFkZXItLXN0YXRpYycpLFxuICAgICAgICAkaGVhZGVyX3N0aWNreSA9ICQoJy5mbGV4eS1oZWFkZXItLXN0aWNreScpLFxuICAgICAgICBvcHRpb25zID0ge1xuICAgICAgICAgICAgdXBkYXRlX2ludGVydmFsOiAxMDAsXG4gICAgICAgICAgICB0b2xlcmFuY2U6IHtcbiAgICAgICAgICAgICAgICB1cHdhcmQ6IDIwLFxuICAgICAgICAgICAgICAgIGRvd253YXJkOiAxMFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9mZnNldDogX2dldF9vZmZzZXRfZnJvbV9lbGVtZW50c19ib3R0b20oJGhlYWRlcl9zdGF0aWMpLFxuICAgICAgICAgICAgY2xhc3Nlczoge1xuICAgICAgICAgICAgICAgIHBpbm5lZDogXCJmbGV4eS1oZWFkZXItLXBpbm5lZFwiLFxuICAgICAgICAgICAgICAgIHVucGlubmVkOiBcImZsZXh5LWhlYWRlci0tdW5waW5uZWRcIlxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB3YXNfc2Nyb2xsZWQgPSBmYWxzZSxcbiAgICAgICAgbGFzdF9kaXN0YW5jZV9mcm9tX3RvcCA9IDA7XG5cbiAgICAvKipcbiAgICAgKiBJbnN0YW50aWF0ZVxuICAgICAqL1xuICAgIHB1Yi5pbml0ID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgcmVnaXN0ZXJFdmVudEhhbmRsZXJzKCk7XG4gICAgICAgIHJlZ2lzdGVyQm9vdEV2ZW50SGFuZGxlcnMoKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUmVnaXN0ZXIgYm9vdCBldmVudCBoYW5kbGVyc1xuICAgICAqL1xuICAgIGZ1bmN0aW9uIHJlZ2lzdGVyQm9vdEV2ZW50SGFuZGxlcnMoKSB7XG4gICAgICAgICRoZWFkZXJfc3RpY2t5LmFkZENsYXNzKG9wdGlvbnMuY2xhc3Nlcy51bnBpbm5lZCk7XG5cbiAgICAgICAgc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgIGlmICh3YXNfc2Nyb2xsZWQpIHtcbiAgICAgICAgICAgICAgICBkb2N1bWVudF93YXNfc2Nyb2xsZWQoKTtcblxuICAgICAgICAgICAgICAgIHdhc19zY3JvbGxlZCA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCBvcHRpb25zLnVwZGF0ZV9pbnRlcnZhbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVnaXN0ZXIgZXZlbnQgaGFuZGxlcnNcbiAgICAgKi9cbiAgICBmdW5jdGlvbiByZWdpc3RlckV2ZW50SGFuZGxlcnMoKSB7XG4gICAgICAgICQod2luZG93KS5zY3JvbGwoZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIHdhc19zY3JvbGxlZCA9IHRydWU7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCBvZmZzZXQgZnJvbSBlbGVtZW50IGJvdHRvbVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIF9nZXRfb2Zmc2V0X2Zyb21fZWxlbWVudHNfYm90dG9tKCRlbGVtZW50KSB7XG4gICAgICAgIHZhciBlbGVtZW50X2hlaWdodCA9ICRlbGVtZW50Lm91dGVySGVpZ2h0KHRydWUpLFxuICAgICAgICAgICAgZWxlbWVudF9vZmZzZXQgPSAkZWxlbWVudC5vZmZzZXQoKS50b3A7XG5cbiAgICAgICAgcmV0dXJuIChlbGVtZW50X2hlaWdodCArIGVsZW1lbnRfb2Zmc2V0KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEb2N1bWVudCB3YXMgc2Nyb2xsZWRcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBkb2N1bWVudF93YXNfc2Nyb2xsZWQoKSB7XG4gICAgICAgIHZhciBjdXJyZW50X2Rpc3RhbmNlX2Zyb21fdG9wID0gJCh3aW5kb3cpLnNjcm9sbFRvcCgpO1xuXG4gICAgICAgIC8vIElmIHBhc3Qgb2Zmc2V0XG4gICAgICAgIGlmIChjdXJyZW50X2Rpc3RhbmNlX2Zyb21fdG9wID49IG9wdGlvbnMub2Zmc2V0KSB7XG5cbiAgICAgICAgICAgIC8vIERvd253YXJkcyBzY3JvbGxcbiAgICAgICAgICAgIGlmIChjdXJyZW50X2Rpc3RhbmNlX2Zyb21fdG9wID4gbGFzdF9kaXN0YW5jZV9mcm9tX3RvcCkge1xuXG4gICAgICAgICAgICAgICAgLy8gT2JleSB0aGUgZG93bndhcmQgdG9sZXJhbmNlXG4gICAgICAgICAgICAgICAgaWYgKE1hdGguYWJzKGN1cnJlbnRfZGlzdGFuY2VfZnJvbV90b3AgLSBsYXN0X2Rpc3RhbmNlX2Zyb21fdG9wKSA8PSBvcHRpb25zLnRvbGVyYW5jZS5kb3dud2FyZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgJGhlYWRlcl9zdGlja3kucmVtb3ZlQ2xhc3Mob3B0aW9ucy5jbGFzc2VzLnBpbm5lZCkuYWRkQ2xhc3Mob3B0aW9ucy5jbGFzc2VzLnVucGlubmVkKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gVXB3YXJkcyBzY3JvbGxcbiAgICAgICAgICAgIGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgLy8gT2JleSB0aGUgdXB3YXJkIHRvbGVyYW5jZVxuICAgICAgICAgICAgICAgIGlmIChNYXRoLmFicyhjdXJyZW50X2Rpc3RhbmNlX2Zyb21fdG9wIC0gbGFzdF9kaXN0YW5jZV9mcm9tX3RvcCkgPD0gb3B0aW9ucy50b2xlcmFuY2UudXB3YXJkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBXZSBhcmUgbm90IHNjcm9sbGVkIHBhc3QgdGhlIGRvY3VtZW50IHdoaWNoIGlzIHBvc3NpYmxlIG9uIHRoZSBNYWNcbiAgICAgICAgICAgICAgICBpZiAoKGN1cnJlbnRfZGlzdGFuY2VfZnJvbV90b3AgKyAkKHdpbmRvdykuaGVpZ2h0KCkpIDwgJChkb2N1bWVudCkuaGVpZ2h0KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgJGhlYWRlcl9zdGlja3kucmVtb3ZlQ2xhc3Mob3B0aW9ucy5jbGFzc2VzLnVucGlubmVkKS5hZGRDbGFzcyhvcHRpb25zLmNsYXNzZXMucGlubmVkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBOb3QgcGFzdCBvZmZzZXRcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAkaGVhZGVyX3N0aWNreS5yZW1vdmVDbGFzcyhvcHRpb25zLmNsYXNzZXMucGlubmVkKS5hZGRDbGFzcyhvcHRpb25zLmNsYXNzZXMudW5waW5uZWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGFzdF9kaXN0YW5jZV9mcm9tX3RvcCA9IGN1cnJlbnRfZGlzdGFuY2VfZnJvbV90b3A7XG4gICAgfVxuXG4gICAgcmV0dXJuIHB1Yjtcbn0pKGpRdWVyeSk7XG4iLCIvLyB8LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIHwgRmxleHkgbmF2aWdhdGlvblxuLy8gfC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyB8XG4vLyB8IFRoaXMgalF1ZXJ5IHNjcmlwdCBpcyB3cml0dGVuIGJ5XG4vLyB8XG4vLyB8IE1vcnRlbiBOaXNzZW5cbi8vIHwgaGplbW1lc2lkZWtvbmdlbi5ka1xuLy8gfFxuXG52YXIgZmxleHlfbmF2aWdhdGlvbiA9IChmdW5jdGlvbiAoJCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBwdWIgPSB7fSxcbiAgICAgICAgbGF5b3V0X2NsYXNzZXMgPSB7XG4gICAgICAgICAgICAnbmF2aWdhdGlvbic6ICcuZmxleHktbmF2aWdhdGlvbicsXG4gICAgICAgICAgICAnb2JmdXNjYXRvcic6ICcuZmxleHktbmF2aWdhdGlvbl9fb2JmdXNjYXRvcicsXG4gICAgICAgICAgICAnZHJvcGRvd24nOiAnLmZsZXh5LW5hdmlnYXRpb25fX2l0ZW0tLWRyb3Bkb3duJyxcbiAgICAgICAgICAgICdkcm9wZG93bl9tZWdhbWVudSc6ICcuZmxleHktbmF2aWdhdGlvbl9faXRlbV9fZHJvcGRvd24tbWVnYW1lbnUnLFxuXG4gICAgICAgICAgICAnaXNfdXBncmFkZWQnOiAnaXMtdXBncmFkZWQnLFxuICAgICAgICAgICAgJ25hdmlnYXRpb25faGFzX21lZ2FtZW51JzogJ2hhcy1tZWdhbWVudScsXG4gICAgICAgICAgICAnZHJvcGRvd25faGFzX21lZ2FtZW51JzogJ2ZsZXh5LW5hdmlnYXRpb25fX2l0ZW0tLWRyb3Bkb3duLXdpdGgtbWVnYW1lbnUnLFxuICAgICAgICB9O1xuXG4gICAgLyoqXG4gICAgICogSW5zdGFudGlhdGVcbiAgICAgKi9cbiAgICBwdWIuaW5pdCA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIHJlZ2lzdGVyRXZlbnRIYW5kbGVycygpO1xuICAgICAgICByZWdpc3RlckJvb3RFdmVudEhhbmRsZXJzKCk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFJlZ2lzdGVyIGJvb3QgZXZlbnQgaGFuZGxlcnNcbiAgICAgKi9cbiAgICBmdW5jdGlvbiByZWdpc3RlckJvb3RFdmVudEhhbmRsZXJzKCkge1xuXG4gICAgICAgIC8vIFVwZ3JhZGVcbiAgICAgICAgdXBncmFkZSgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlZ2lzdGVyIGV2ZW50IGhhbmRsZXJzXG4gICAgICovXG4gICAgZnVuY3Rpb24gcmVnaXN0ZXJFdmVudEhhbmRsZXJzKCkge31cblxuICAgIC8qKlxuICAgICAqIFVwZ3JhZGUgZWxlbWVudHMuXG4gICAgICogQWRkIGNsYXNzZXMgdG8gZWxlbWVudHMsIGJhc2VkIHVwb24gYXR0YWNoZWQgY2xhc3Nlcy5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiB1cGdyYWRlKCkge1xuICAgICAgICB2YXIgJG5hdmlnYXRpb25zID0gJChsYXlvdXRfY2xhc3Nlcy5uYXZpZ2F0aW9uKTtcblxuICAgICAgICAvLyBOYXZpZ2F0aW9uc1xuICAgICAgICBpZiAoJG5hdmlnYXRpb25zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICRuYXZpZ2F0aW9ucy5lYWNoKGZ1bmN0aW9uKGluZGV4LCBlbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgdmFyICRuYXZpZ2F0aW9uID0gJCh0aGlzKSxcbiAgICAgICAgICAgICAgICAgICAgJG1lZ2FtZW51cyA9ICRuYXZpZ2F0aW9uLmZpbmQobGF5b3V0X2NsYXNzZXMuZHJvcGRvd25fbWVnYW1lbnUpLFxuICAgICAgICAgICAgICAgICAgICAkZHJvcGRvd25fbWVnYW1lbnUgPSAkbmF2aWdhdGlvbi5maW5kKGxheW91dF9jbGFzc2VzLmRyb3Bkb3duX2hhc19tZWdhbWVudSk7XG5cbiAgICAgICAgICAgICAgICAvLyBIYXMgYWxyZWFkeSBiZWVuIHVwZ3JhZGVkXG4gICAgICAgICAgICAgICAgaWYgKCRuYXZpZ2F0aW9uLmhhc0NsYXNzKGxheW91dF9jbGFzc2VzLmlzX3VwZ3JhZGVkKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gSGFzIG1lZ2FtZW51XG4gICAgICAgICAgICAgICAgaWYgKCRtZWdhbWVudXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAkbmF2aWdhdGlvbi5hZGRDbGFzcyhsYXlvdXRfY2xhc3Nlcy5uYXZpZ2F0aW9uX2hhc19tZWdhbWVudSk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gUnVuIHRocm91Z2ggYWxsIG1lZ2FtZW51c1xuICAgICAgICAgICAgICAgICAgICAkbWVnYW1lbnVzLmVhY2goZnVuY3Rpb24oaW5kZXgsIGVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciAkbWVnYW1lbnUgPSAkKHRoaXMpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhc19vYmZ1c2NhdG9yID0gJCgnaHRtbCcpLmhhc0NsYXNzKCdoYXMtb2JmdXNjYXRvcicpID8gdHJ1ZSA6IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAkbWVnYW1lbnUucGFyZW50cyhsYXlvdXRfY2xhc3Nlcy5kcm9wZG93bilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuYWRkQ2xhc3MobGF5b3V0X2NsYXNzZXMuZHJvcGRvd25faGFzX21lZ2FtZW51KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5ob3ZlcihmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaGFzX29iZnVzY2F0b3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9iZnVzY2F0b3Iuc2hvdygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaGFzX29iZnVzY2F0b3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9iZnVzY2F0b3IuaGlkZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIElzIHVwZ3JhZGVkXG4gICAgICAgICAgICAgICAgJG5hdmlnYXRpb24uYWRkQ2xhc3MobGF5b3V0X2NsYXNzZXMuaXNfdXBncmFkZWQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcHViO1xufSkoalF1ZXJ5KTtcbiIsIi8qISBzaWRyIC0gdjIuMi4xIC0gMjAxNi0wMi0xN1xuICogaHR0cDovL3d3dy5iZXJyaWFydC5jb20vc2lkci9cbiAqIENvcHlyaWdodCAoYykgMjAxMy0yMDE2IEFsYmVydG8gVmFyZWxhOyBMaWNlbnNlZCBNSVQgKi9cblxuKGZ1bmN0aW9uICgpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIHZhciBiYWJlbEhlbHBlcnMgPSB7fTtcblxuICBiYWJlbEhlbHBlcnMuY2xhc3NDYWxsQ2hlY2sgPSBmdW5jdGlvbiAoaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7XG4gICAgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7XG4gICAgfVxuICB9O1xuXG4gIGJhYmVsSGVscGVycy5jcmVhdGVDbGFzcyA9IGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTtcbiAgICAgICAgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlO1xuICAgICAgICBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7XG4gICAgICAgIGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykge1xuICAgICAgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTtcbiAgICAgIGlmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpO1xuICAgICAgcmV0dXJuIENvbnN0cnVjdG9yO1xuICAgIH07XG4gIH0oKTtcblxuICBiYWJlbEhlbHBlcnM7XG5cbiAgdmFyIHNpZHJTdGF0dXMgPSB7XG4gICAgbW92aW5nOiBmYWxzZSxcbiAgICBvcGVuZWQ6IGZhbHNlXG4gIH07XG5cbiAgdmFyIGhlbHBlciA9IHtcbiAgICAvLyBDaGVjayBmb3IgdmFsaWRzIHVybHNcbiAgICAvLyBGcm9tIDogaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy81NzE3MDkzL2NoZWNrLWlmLWEtamF2YXNjcmlwdC1zdHJpbmctaXMtYW4tdXJsXG5cbiAgICBpc1VybDogZnVuY3Rpb24gaXNVcmwoc3RyKSB7XG4gICAgICB2YXIgcGF0dGVybiA9IG5ldyBSZWdFeHAoJ14oaHR0cHM/OlxcXFwvXFxcXC8pPycgKyAvLyBwcm90b2NvbFxuICAgICAgJygoKFthLXpcXFxcZF0oW2EtelxcXFxkLV0qW2EtelxcXFxkXSkqKVxcXFwuPykrW2Etel17Mix9fCcgKyAvLyBkb21haW4gbmFtZVxuICAgICAgJygoXFxcXGR7MSwzfVxcXFwuKXszfVxcXFxkezEsM30pKScgKyAvLyBPUiBpcCAodjQpIGFkZHJlc3NcbiAgICAgICcoXFxcXDpcXFxcZCspPyhcXFxcL1stYS16XFxcXGQlXy5+K10qKSonICsgLy8gcG9ydCBhbmQgcGF0aFxuICAgICAgJyhcXFxcP1s7JmEtelxcXFxkJV8ufis9LV0qKT8nICsgLy8gcXVlcnkgc3RyaW5nXG4gICAgICAnKFxcXFwjWy1hLXpcXFxcZF9dKik/JCcsICdpJyk7IC8vIGZyYWdtZW50IGxvY2F0b3JcblxuICAgICAgaWYgKHBhdHRlcm4udGVzdChzdHIpKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH0sXG5cblxuICAgIC8vIEFkZCBzaWRyIHByZWZpeGVzXG4gICAgYWRkUHJlZml4ZXM6IGZ1bmN0aW9uIGFkZFByZWZpeGVzKCRlbGVtZW50KSB7XG4gICAgICB0aGlzLmFkZFByZWZpeCgkZWxlbWVudCwgJ2lkJyk7XG4gICAgICB0aGlzLmFkZFByZWZpeCgkZWxlbWVudCwgJ2NsYXNzJyk7XG4gICAgICAkZWxlbWVudC5yZW1vdmVBdHRyKCdzdHlsZScpO1xuICAgIH0sXG4gICAgYWRkUHJlZml4OiBmdW5jdGlvbiBhZGRQcmVmaXgoJGVsZW1lbnQsIGF0dHJpYnV0ZSkge1xuICAgICAgdmFyIHRvUmVwbGFjZSA9ICRlbGVtZW50LmF0dHIoYXR0cmlidXRlKTtcblxuICAgICAgaWYgKHR5cGVvZiB0b1JlcGxhY2UgPT09ICdzdHJpbmcnICYmIHRvUmVwbGFjZSAhPT0gJycgJiYgdG9SZXBsYWNlICE9PSAnc2lkci1pbm5lcicpIHtcbiAgICAgICAgJGVsZW1lbnQuYXR0cihhdHRyaWJ1dGUsIHRvUmVwbGFjZS5yZXBsYWNlKC8oW0EtWmEtejAtOV8uXFwtXSspL2csICdzaWRyLScgKyBhdHRyaWJ1dGUgKyAnLSQxJykpO1xuICAgICAgfVxuICAgIH0sXG5cblxuICAgIC8vIENoZWNrIGlmIHRyYW5zaXRpb25zIGlzIHN1cHBvcnRlZFxuICAgIHRyYW5zaXRpb25zOiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgYm9keSA9IGRvY3VtZW50LmJvZHkgfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LFxuICAgICAgICAgIHN0eWxlID0gYm9keS5zdHlsZSxcbiAgICAgICAgICBzdXBwb3J0ZWQgPSBmYWxzZSxcbiAgICAgICAgICBwcm9wZXJ0eSA9ICd0cmFuc2l0aW9uJztcblxuICAgICAgaWYgKHByb3BlcnR5IGluIHN0eWxlKSB7XG4gICAgICAgIHN1cHBvcnRlZCA9IHRydWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHZhciBwcmVmaXhlcyA9IFsnbW96JywgJ3dlYmtpdCcsICdvJywgJ21zJ10sXG4gICAgICAgICAgICAgIHByZWZpeCA9IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgaSA9IHVuZGVmaW5lZDtcblxuICAgICAgICAgIHByb3BlcnR5ID0gcHJvcGVydHkuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBwcm9wZXJ0eS5zdWJzdHIoMSk7XG4gICAgICAgICAgc3VwcG9ydGVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHByZWZpeGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgIHByZWZpeCA9IHByZWZpeGVzW2ldO1xuICAgICAgICAgICAgICBpZiAocHJlZml4ICsgcHJvcGVydHkgaW4gc3R5bGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfSgpO1xuICAgICAgICAgIHByb3BlcnR5ID0gc3VwcG9ydGVkID8gJy0nICsgcHJlZml4LnRvTG93ZXJDYXNlKCkgKyAnLScgKyBwcm9wZXJ0eS50b0xvd2VyQ2FzZSgpIDogbnVsbDtcbiAgICAgICAgfSkoKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3VwcG9ydGVkOiBzdXBwb3J0ZWQsXG4gICAgICAgIHByb3BlcnR5OiBwcm9wZXJ0eVxuICAgICAgfTtcbiAgICB9KClcbiAgfTtcblxuICB2YXIgJCQyID0galF1ZXJ5O1xuXG4gIHZhciBib2R5QW5pbWF0aW9uQ2xhc3MgPSAnc2lkci1hbmltYXRpbmcnO1xuICB2YXIgb3BlbkFjdGlvbiA9ICdvcGVuJztcbiAgdmFyIGNsb3NlQWN0aW9uID0gJ2Nsb3NlJztcbiAgdmFyIHRyYW5zaXRpb25FbmRFdmVudCA9ICd3ZWJraXRUcmFuc2l0aW9uRW5kIG90cmFuc2l0aW9uZW5kIG9UcmFuc2l0aW9uRW5kIG1zVHJhbnNpdGlvbkVuZCB0cmFuc2l0aW9uZW5kJztcbiAgdmFyIE1lbnUgPSBmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gTWVudShuYW1lKSB7XG4gICAgICBiYWJlbEhlbHBlcnMuY2xhc3NDYWxsQ2hlY2sodGhpcywgTWVudSk7XG5cbiAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICB0aGlzLml0ZW0gPSAkJDIoJyMnICsgbmFtZSk7XG4gICAgICB0aGlzLm9wZW5DbGFzcyA9IG5hbWUgPT09ICdzaWRyJyA/ICdzaWRyLW9wZW4nIDogJ3NpZHItb3BlbiAnICsgbmFtZSArICctb3Blbic7XG4gICAgICB0aGlzLm1lbnVXaWR0aCA9IHRoaXMuaXRlbS5vdXRlcldpZHRoKHRydWUpO1xuICAgICAgdGhpcy5zcGVlZCA9IHRoaXMuaXRlbS5kYXRhKCdzcGVlZCcpO1xuICAgICAgdGhpcy5zaWRlID0gdGhpcy5pdGVtLmRhdGEoJ3NpZGUnKTtcbiAgICAgIHRoaXMuZGlzcGxhY2UgPSB0aGlzLml0ZW0uZGF0YSgnZGlzcGxhY2UnKTtcbiAgICAgIHRoaXMudGltaW5nID0gdGhpcy5pdGVtLmRhdGEoJ3RpbWluZycpO1xuICAgICAgdGhpcy5tZXRob2QgPSB0aGlzLml0ZW0uZGF0YSgnbWV0aG9kJyk7XG4gICAgICB0aGlzLm9uT3BlbkNhbGxiYWNrID0gdGhpcy5pdGVtLmRhdGEoJ29uT3BlbicpO1xuICAgICAgdGhpcy5vbkNsb3NlQ2FsbGJhY2sgPSB0aGlzLml0ZW0uZGF0YSgnb25DbG9zZScpO1xuICAgICAgdGhpcy5vbk9wZW5FbmRDYWxsYmFjayA9IHRoaXMuaXRlbS5kYXRhKCdvbk9wZW5FbmQnKTtcbiAgICAgIHRoaXMub25DbG9zZUVuZENhbGxiYWNrID0gdGhpcy5pdGVtLmRhdGEoJ29uQ2xvc2VFbmQnKTtcbiAgICAgIHRoaXMuYm9keSA9ICQkMih0aGlzLml0ZW0uZGF0YSgnYm9keScpKTtcbiAgICB9XG5cbiAgICBiYWJlbEhlbHBlcnMuY3JlYXRlQ2xhc3MoTWVudSwgW3tcbiAgICAgIGtleTogJ2dldEFuaW1hdGlvbicsXG4gICAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0QW5pbWF0aW9uKGFjdGlvbiwgZWxlbWVudCkge1xuICAgICAgICB2YXIgYW5pbWF0aW9uID0ge30sXG4gICAgICAgICAgICBwcm9wID0gdGhpcy5zaWRlO1xuXG4gICAgICAgIGlmIChhY3Rpb24gPT09ICdvcGVuJyAmJiBlbGVtZW50ID09PSAnYm9keScpIHtcbiAgICAgICAgICBhbmltYXRpb25bcHJvcF0gPSB0aGlzLm1lbnVXaWR0aCArICdweCc7XG4gICAgICAgIH0gZWxzZSBpZiAoYWN0aW9uID09PSAnY2xvc2UnICYmIGVsZW1lbnQgPT09ICdtZW51Jykge1xuICAgICAgICAgIGFuaW1hdGlvbltwcm9wXSA9ICctJyArIHRoaXMubWVudVdpZHRoICsgJ3B4JztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBhbmltYXRpb25bcHJvcF0gPSAwO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGFuaW1hdGlvbjtcbiAgICAgIH1cbiAgICB9LCB7XG4gICAgICBrZXk6ICdwcmVwYXJlQm9keScsXG4gICAgICB2YWx1ZTogZnVuY3Rpb24gcHJlcGFyZUJvZHkoYWN0aW9uKSB7XG4gICAgICAgIHZhciBwcm9wID0gYWN0aW9uID09PSAnb3BlbicgPyAnaGlkZGVuJyA6ICcnO1xuXG4gICAgICAgIC8vIFByZXBhcmUgcGFnZSBpZiBjb250YWluZXIgaXMgYm9keVxuICAgICAgICBpZiAodGhpcy5ib2R5LmlzKCdib2R5JykpIHtcbiAgICAgICAgICB2YXIgJGh0bWwgPSAkJDIoJ2h0bWwnKSxcbiAgICAgICAgICAgICAgc2Nyb2xsVG9wID0gJGh0bWwuc2Nyb2xsVG9wKCk7XG5cbiAgICAgICAgICAkaHRtbC5jc3MoJ292ZXJmbG93LXgnLCBwcm9wKS5zY3JvbGxUb3Aoc2Nyb2xsVG9wKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sIHtcbiAgICAgIGtleTogJ29wZW5Cb2R5JyxcbiAgICAgIHZhbHVlOiBmdW5jdGlvbiBvcGVuQm9keSgpIHtcbiAgICAgICAgaWYgKHRoaXMuZGlzcGxhY2UpIHtcbiAgICAgICAgICB2YXIgdHJhbnNpdGlvbnMgPSBoZWxwZXIudHJhbnNpdGlvbnMsXG4gICAgICAgICAgICAgICRib2R5ID0gdGhpcy5ib2R5O1xuXG4gICAgICAgICAgaWYgKHRyYW5zaXRpb25zLnN1cHBvcnRlZCkge1xuICAgICAgICAgICAgJGJvZHkuY3NzKHRyYW5zaXRpb25zLnByb3BlcnR5LCB0aGlzLnNpZGUgKyAnICcgKyB0aGlzLnNwZWVkIC8gMTAwMCArICdzICcgKyB0aGlzLnRpbWluZykuY3NzKHRoaXMuc2lkZSwgMCkuY3NzKHtcbiAgICAgICAgICAgICAgd2lkdGg6ICRib2R5LndpZHRoKCksXG4gICAgICAgICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICRib2R5LmNzcyh0aGlzLnNpZGUsIHRoaXMubWVudVdpZHRoICsgJ3B4Jyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBib2R5QW5pbWF0aW9uID0gdGhpcy5nZXRBbmltYXRpb24ob3BlbkFjdGlvbiwgJ2JvZHknKTtcblxuICAgICAgICAgICAgJGJvZHkuY3NzKHtcbiAgICAgICAgICAgICAgd2lkdGg6ICRib2R5LndpZHRoKCksXG4gICAgICAgICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnXG4gICAgICAgICAgICB9KS5hbmltYXRlKGJvZHlBbmltYXRpb24sIHtcbiAgICAgICAgICAgICAgcXVldWU6IGZhbHNlLFxuICAgICAgICAgICAgICBkdXJhdGlvbjogdGhpcy5zcGVlZFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSwge1xuICAgICAga2V5OiAnb25DbG9zZUJvZHknLFxuICAgICAgdmFsdWU6IGZ1bmN0aW9uIG9uQ2xvc2VCb2R5KCkge1xuICAgICAgICB2YXIgdHJhbnNpdGlvbnMgPSBoZWxwZXIudHJhbnNpdGlvbnMsXG4gICAgICAgICAgICByZXNldFN0eWxlcyA9IHtcbiAgICAgICAgICB3aWR0aDogJycsXG4gICAgICAgICAgcG9zaXRpb246ICcnLFxuICAgICAgICAgIHJpZ2h0OiAnJyxcbiAgICAgICAgICBsZWZ0OiAnJ1xuICAgICAgICB9O1xuXG4gICAgICAgIGlmICh0cmFuc2l0aW9ucy5zdXBwb3J0ZWQpIHtcbiAgICAgICAgICByZXNldFN0eWxlc1t0cmFuc2l0aW9ucy5wcm9wZXJ0eV0gPSAnJztcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuYm9keS5jc3MocmVzZXRTdHlsZXMpLnVuYmluZCh0cmFuc2l0aW9uRW5kRXZlbnQpO1xuICAgICAgfVxuICAgIH0sIHtcbiAgICAgIGtleTogJ2Nsb3NlQm9keScsXG4gICAgICB2YWx1ZTogZnVuY3Rpb24gY2xvc2VCb2R5KCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgICAgIGlmICh0aGlzLmRpc3BsYWNlKSB7XG4gICAgICAgICAgaWYgKGhlbHBlci50cmFuc2l0aW9ucy5zdXBwb3J0ZWQpIHtcbiAgICAgICAgICAgIHRoaXMuYm9keS5jc3ModGhpcy5zaWRlLCAwKS5vbmUodHJhbnNpdGlvbkVuZEV2ZW50LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIF90aGlzLm9uQ2xvc2VCb2R5KCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIGJvZHlBbmltYXRpb24gPSB0aGlzLmdldEFuaW1hdGlvbihjbG9zZUFjdGlvbiwgJ2JvZHknKTtcblxuICAgICAgICAgICAgdGhpcy5ib2R5LmFuaW1hdGUoYm9keUFuaW1hdGlvbiwge1xuICAgICAgICAgICAgICBxdWV1ZTogZmFsc2UsXG4gICAgICAgICAgICAgIGR1cmF0aW9uOiB0aGlzLnNwZWVkLFxuICAgICAgICAgICAgICBjb21wbGV0ZTogZnVuY3Rpb24gY29tcGxldGUoKSB7XG4gICAgICAgICAgICAgICAgX3RoaXMub25DbG9zZUJvZHkoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSwge1xuICAgICAga2V5OiAnbW92ZUJvZHknLFxuICAgICAgdmFsdWU6IGZ1bmN0aW9uIG1vdmVCb2R5KGFjdGlvbikge1xuICAgICAgICBpZiAoYWN0aW9uID09PSBvcGVuQWN0aW9uKSB7XG4gICAgICAgICAgdGhpcy5vcGVuQm9keSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuY2xvc2VCb2R5KCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LCB7XG4gICAgICBrZXk6ICdvbk9wZW5NZW51JyxcbiAgICAgIHZhbHVlOiBmdW5jdGlvbiBvbk9wZW5NZW51KGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBuYW1lID0gdGhpcy5uYW1lO1xuXG4gICAgICAgIHNpZHJTdGF0dXMubW92aW5nID0gZmFsc2U7XG4gICAgICAgIHNpZHJTdGF0dXMub3BlbmVkID0gbmFtZTtcblxuICAgICAgICB0aGlzLml0ZW0udW5iaW5kKHRyYW5zaXRpb25FbmRFdmVudCk7XG5cbiAgICAgICAgdGhpcy5ib2R5LnJlbW92ZUNsYXNzKGJvZHlBbmltYXRpb25DbGFzcykuYWRkQ2xhc3ModGhpcy5vcGVuQ2xhc3MpO1xuXG4gICAgICAgIHRoaXMub25PcGVuRW5kQ2FsbGJhY2soKTtcblxuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgY2FsbGJhY2sobmFtZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LCB7XG4gICAgICBrZXk6ICdvcGVuTWVudScsXG4gICAgICB2YWx1ZTogZnVuY3Rpb24gb3Blbk1lbnUoY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIF90aGlzMiA9IHRoaXM7XG5cbiAgICAgICAgdmFyICRpdGVtID0gdGhpcy5pdGVtO1xuXG4gICAgICAgIGlmIChoZWxwZXIudHJhbnNpdGlvbnMuc3VwcG9ydGVkKSB7XG4gICAgICAgICAgJGl0ZW0uY3NzKHRoaXMuc2lkZSwgMCkub25lKHRyYW5zaXRpb25FbmRFdmVudCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgX3RoaXMyLm9uT3Blbk1lbnUoY2FsbGJhY2spO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBtZW51QW5pbWF0aW9uID0gdGhpcy5nZXRBbmltYXRpb24ob3BlbkFjdGlvbiwgJ21lbnUnKTtcblxuICAgICAgICAgICRpdGVtLmNzcygnZGlzcGxheScsICdibG9jaycpLmFuaW1hdGUobWVudUFuaW1hdGlvbiwge1xuICAgICAgICAgICAgcXVldWU6IGZhbHNlLFxuICAgICAgICAgICAgZHVyYXRpb246IHRoaXMuc3BlZWQsXG4gICAgICAgICAgICBjb21wbGV0ZTogZnVuY3Rpb24gY29tcGxldGUoKSB7XG4gICAgICAgICAgICAgIF90aGlzMi5vbk9wZW5NZW51KGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sIHtcbiAgICAgIGtleTogJ29uQ2xvc2VNZW51JyxcbiAgICAgIHZhbHVlOiBmdW5jdGlvbiBvbkNsb3NlTWVudShjYWxsYmFjaykge1xuICAgICAgICB0aGlzLml0ZW0uY3NzKHtcbiAgICAgICAgICBsZWZ0OiAnJyxcbiAgICAgICAgICByaWdodDogJydcbiAgICAgICAgfSkudW5iaW5kKHRyYW5zaXRpb25FbmRFdmVudCk7XG4gICAgICAgICQkMignaHRtbCcpLmNzcygnb3ZlcmZsb3cteCcsICcnKTtcblxuICAgICAgICBzaWRyU3RhdHVzLm1vdmluZyA9IGZhbHNlO1xuICAgICAgICBzaWRyU3RhdHVzLm9wZW5lZCA9IGZhbHNlO1xuXG4gICAgICAgIHRoaXMuYm9keS5yZW1vdmVDbGFzcyhib2R5QW5pbWF0aW9uQ2xhc3MpLnJlbW92ZUNsYXNzKHRoaXMub3BlbkNsYXNzKTtcblxuICAgICAgICB0aGlzLm9uQ2xvc2VFbmRDYWxsYmFjaygpO1xuXG4gICAgICAgIC8vIENhbGxiYWNrXG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICBjYWxsYmFjayhuYW1lKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sIHtcbiAgICAgIGtleTogJ2Nsb3NlTWVudScsXG4gICAgICB2YWx1ZTogZnVuY3Rpb24gY2xvc2VNZW51KGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBfdGhpczMgPSB0aGlzO1xuXG4gICAgICAgIHZhciBpdGVtID0gdGhpcy5pdGVtO1xuXG4gICAgICAgIGlmIChoZWxwZXIudHJhbnNpdGlvbnMuc3VwcG9ydGVkKSB7XG4gICAgICAgICAgaXRlbS5jc3ModGhpcy5zaWRlLCAnJykub25lKHRyYW5zaXRpb25FbmRFdmVudCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgX3RoaXMzLm9uQ2xvc2VNZW51KGNhbGxiYWNrKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YXIgbWVudUFuaW1hdGlvbiA9IHRoaXMuZ2V0QW5pbWF0aW9uKGNsb3NlQWN0aW9uLCAnbWVudScpO1xuXG4gICAgICAgICAgaXRlbS5hbmltYXRlKG1lbnVBbmltYXRpb24sIHtcbiAgICAgICAgICAgIHF1ZXVlOiBmYWxzZSxcbiAgICAgICAgICAgIGR1cmF0aW9uOiB0aGlzLnNwZWVkLFxuICAgICAgICAgICAgY29tcGxldGU6IGZ1bmN0aW9uIGNvbXBsZXRlKCkge1xuICAgICAgICAgICAgICBfdGhpczMub25DbG9zZU1lbnUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sIHtcbiAgICAgIGtleTogJ21vdmVNZW51JyxcbiAgICAgIHZhbHVlOiBmdW5jdGlvbiBtb3ZlTWVudShhY3Rpb24sIGNhbGxiYWNrKSB7XG4gICAgICAgIHRoaXMuYm9keS5hZGRDbGFzcyhib2R5QW5pbWF0aW9uQ2xhc3MpO1xuXG4gICAgICAgIGlmIChhY3Rpb24gPT09IG9wZW5BY3Rpb24pIHtcbiAgICAgICAgICB0aGlzLm9wZW5NZW51KGNhbGxiYWNrKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLmNsb3NlTWVudShjYWxsYmFjayk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LCB7XG4gICAgICBrZXk6ICdtb3ZlJyxcbiAgICAgIHZhbHVlOiBmdW5jdGlvbiBtb3ZlKGFjdGlvbiwgY2FsbGJhY2spIHtcbiAgICAgICAgLy8gTG9jayBzaWRyXG4gICAgICAgIHNpZHJTdGF0dXMubW92aW5nID0gdHJ1ZTtcblxuICAgICAgICB0aGlzLnByZXBhcmVCb2R5KGFjdGlvbik7XG4gICAgICAgIHRoaXMubW92ZUJvZHkoYWN0aW9uKTtcbiAgICAgICAgdGhpcy5tb3ZlTWVudShhY3Rpb24sIGNhbGxiYWNrKTtcbiAgICAgIH1cbiAgICB9LCB7XG4gICAgICBrZXk6ICdvcGVuJyxcbiAgICAgIHZhbHVlOiBmdW5jdGlvbiBvcGVuKGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBfdGhpczQgPSB0aGlzO1xuXG4gICAgICAgIC8vIENoZWNrIGlmIGlzIGFscmVhZHkgb3BlbmVkIG9yIG1vdmluZ1xuICAgICAgICBpZiAoc2lkclN0YXR1cy5vcGVuZWQgPT09IHRoaXMubmFtZSB8fCBzaWRyU3RhdHVzLm1vdmluZykge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIGFub3RoZXIgbWVudSBvcGVuZWQgY2xvc2UgZmlyc3RcbiAgICAgICAgaWYgKHNpZHJTdGF0dXMub3BlbmVkICE9PSBmYWxzZSkge1xuICAgICAgICAgIHZhciBhbHJlYWR5T3BlbmVkTWVudSA9IG5ldyBNZW51KHNpZHJTdGF0dXMub3BlbmVkKTtcblxuICAgICAgICAgIGFscmVhZHlPcGVuZWRNZW51LmNsb3NlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIF90aGlzNC5vcGVuKGNhbGxiYWNrKTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMubW92ZSgnb3BlbicsIGNhbGxiYWNrKTtcblxuICAgICAgICAvLyBvbk9wZW4gY2FsbGJhY2tcbiAgICAgICAgdGhpcy5vbk9wZW5DYWxsYmFjaygpO1xuICAgICAgfVxuICAgIH0sIHtcbiAgICAgIGtleTogJ2Nsb3NlJyxcbiAgICAgIHZhbHVlOiBmdW5jdGlvbiBjbG9zZShjYWxsYmFjaykge1xuICAgICAgICAvLyBDaGVjayBpZiBpcyBhbHJlYWR5IGNsb3NlZCBvciBtb3ZpbmdcbiAgICAgICAgaWYgKHNpZHJTdGF0dXMub3BlbmVkICE9PSB0aGlzLm5hbWUgfHwgc2lkclN0YXR1cy5tb3ZpbmcpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLm1vdmUoJ2Nsb3NlJywgY2FsbGJhY2spO1xuXG4gICAgICAgIC8vIG9uQ2xvc2UgY2FsbGJhY2tcbiAgICAgICAgdGhpcy5vbkNsb3NlQ2FsbGJhY2soKTtcbiAgICAgIH1cbiAgICB9LCB7XG4gICAgICBrZXk6ICd0b2dnbGUnLFxuICAgICAgdmFsdWU6IGZ1bmN0aW9uIHRvZ2dsZShjYWxsYmFjaykge1xuICAgICAgICBpZiAoc2lkclN0YXR1cy5vcGVuZWQgPT09IHRoaXMubmFtZSkge1xuICAgICAgICAgIHRoaXMuY2xvc2UoY2FsbGJhY2spO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMub3BlbihjYWxsYmFjayk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XSk7XG4gICAgcmV0dXJuIE1lbnU7XG4gIH0oKTtcblxuICB2YXIgJCQxID0galF1ZXJ5O1xuXG4gIGZ1bmN0aW9uIGV4ZWN1dGUoYWN0aW9uLCBuYW1lLCBjYWxsYmFjaykge1xuICAgIHZhciBzaWRyID0gbmV3IE1lbnUobmFtZSk7XG5cbiAgICBzd2l0Y2ggKGFjdGlvbikge1xuICAgICAgY2FzZSAnb3Blbic6XG4gICAgICAgIHNpZHIub3BlbihjYWxsYmFjayk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnY2xvc2UnOlxuICAgICAgICBzaWRyLmNsb3NlKGNhbGxiYWNrKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICd0b2dnbGUnOlxuICAgICAgICBzaWRyLnRvZ2dsZShjYWxsYmFjayk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgJCQxLmVycm9yKCdNZXRob2QgJyArIGFjdGlvbiArICcgZG9lcyBub3QgZXhpc3Qgb24galF1ZXJ5LnNpZHInKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgdmFyIGk7XG4gIHZhciAkID0galF1ZXJ5O1xuICB2YXIgcHVibGljTWV0aG9kcyA9IFsnb3BlbicsICdjbG9zZScsICd0b2dnbGUnXTtcbiAgdmFyIG1ldGhvZE5hbWU7XG4gIHZhciBtZXRob2RzID0ge307XG4gIHZhciBnZXRNZXRob2QgPSBmdW5jdGlvbiBnZXRNZXRob2QobWV0aG9kTmFtZSkge1xuICAgIHJldHVybiBmdW5jdGlvbiAobmFtZSwgY2FsbGJhY2spIHtcbiAgICAgIC8vIENoZWNrIGFyZ3VtZW50c1xuICAgICAgaWYgKHR5cGVvZiBuYW1lID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGNhbGxiYWNrID0gbmFtZTtcbiAgICAgICAgbmFtZSA9ICdzaWRyJztcbiAgICAgIH0gZWxzZSBpZiAoIW5hbWUpIHtcbiAgICAgICAgbmFtZSA9ICdzaWRyJztcbiAgICAgIH1cblxuICAgICAgZXhlY3V0ZShtZXRob2ROYW1lLCBuYW1lLCBjYWxsYmFjayk7XG4gICAgfTtcbiAgfTtcbiAgZm9yIChpID0gMDsgaSA8IHB1YmxpY01ldGhvZHMubGVuZ3RoOyBpKyspIHtcbiAgICBtZXRob2ROYW1lID0gcHVibGljTWV0aG9kc1tpXTtcbiAgICBtZXRob2RzW21ldGhvZE5hbWVdID0gZ2V0TWV0aG9kKG1ldGhvZE5hbWUpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2lkcihtZXRob2QpIHtcbiAgICBpZiAobWV0aG9kID09PSAnc3RhdHVzJykge1xuICAgICAgcmV0dXJuIHNpZHJTdGF0dXM7XG4gICAgfSBlbHNlIGlmIChtZXRob2RzW21ldGhvZF0pIHtcbiAgICAgIHJldHVybiBtZXRob2RzW21ldGhvZF0uYXBwbHkodGhpcywgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgbWV0aG9kID09PSAnZnVuY3Rpb24nIHx8IHR5cGVvZiBtZXRob2QgPT09ICdzdHJpbmcnIHx8ICFtZXRob2QpIHtcbiAgICAgIHJldHVybiBtZXRob2RzLnRvZ2dsZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH0gZWxzZSB7XG4gICAgICAkLmVycm9yKCdNZXRob2QgJyArIG1ldGhvZCArICcgZG9lcyBub3QgZXhpc3Qgb24galF1ZXJ5LnNpZHInKTtcbiAgICB9XG4gIH1cblxuICB2YXIgJCQzID0galF1ZXJ5O1xuXG4gIGZ1bmN0aW9uIGZpbGxDb250ZW50KCRzaWRlTWVudSwgc2V0dGluZ3MpIHtcbiAgICAvLyBUaGUgbWVudSBjb250ZW50XG4gICAgaWYgKHR5cGVvZiBzZXR0aW5ncy5zb3VyY2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHZhciBuZXdDb250ZW50ID0gc2V0dGluZ3Muc291cmNlKG5hbWUpO1xuXG4gICAgICAkc2lkZU1lbnUuaHRtbChuZXdDb250ZW50KTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBzZXR0aW5ncy5zb3VyY2UgPT09ICdzdHJpbmcnICYmIGhlbHBlci5pc1VybChzZXR0aW5ncy5zb3VyY2UpKSB7XG4gICAgICAkJDMuZ2V0KHNldHRpbmdzLnNvdXJjZSwgZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgJHNpZGVNZW51Lmh0bWwoZGF0YSk7XG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBzZXR0aW5ncy5zb3VyY2UgPT09ICdzdHJpbmcnKSB7XG4gICAgICB2YXIgaHRtbENvbnRlbnQgPSAnJyxcbiAgICAgICAgICBzZWxlY3RvcnMgPSBzZXR0aW5ncy5zb3VyY2Uuc3BsaXQoJywnKTtcblxuICAgICAgJCQzLmVhY2goc2VsZWN0b3JzLCBmdW5jdGlvbiAoaW5kZXgsIGVsZW1lbnQpIHtcbiAgICAgICAgaHRtbENvbnRlbnQgKz0gJzxkaXYgY2xhc3M9XCJzaWRyLWlubmVyXCI+JyArICQkMyhlbGVtZW50KS5odG1sKCkgKyAnPC9kaXY+JztcbiAgICAgIH0pO1xuXG4gICAgICAvLyBSZW5hbWluZyBpZHMgYW5kIGNsYXNzZXNcbiAgICAgIGlmIChzZXR0aW5ncy5yZW5hbWluZykge1xuICAgICAgICB2YXIgJGh0bWxDb250ZW50ID0gJCQzKCc8ZGl2IC8+JykuaHRtbChodG1sQ29udGVudCk7XG5cbiAgICAgICAgJGh0bWxDb250ZW50LmZpbmQoJyonKS5lYWNoKGZ1bmN0aW9uIChpbmRleCwgZWxlbWVudCkge1xuICAgICAgICAgIHZhciAkZWxlbWVudCA9ICQkMyhlbGVtZW50KTtcblxuICAgICAgICAgIGhlbHBlci5hZGRQcmVmaXhlcygkZWxlbWVudCk7XG4gICAgICAgIH0pO1xuICAgICAgICBodG1sQ29udGVudCA9ICRodG1sQ29udGVudC5odG1sKCk7XG4gICAgICB9XG5cbiAgICAgICRzaWRlTWVudS5odG1sKGh0bWxDb250ZW50KTtcbiAgICB9IGVsc2UgaWYgKHNldHRpbmdzLnNvdXJjZSAhPT0gbnVsbCkge1xuICAgICAgJCQzLmVycm9yKCdJbnZhbGlkIFNpZHIgU291cmNlJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuICRzaWRlTWVudTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZuU2lkcihvcHRpb25zKSB7XG4gICAgdmFyIHRyYW5zaXRpb25zID0gaGVscGVyLnRyYW5zaXRpb25zLFxuICAgICAgICBzZXR0aW5ncyA9ICQkMy5leHRlbmQoe1xuICAgICAgbmFtZTogJ3NpZHInLCAvLyBOYW1lIGZvciB0aGUgJ3NpZHInXG4gICAgICBzcGVlZDogMjAwLCAvLyBBY2NlcHRzIHN0YW5kYXJkIGpRdWVyeSBlZmZlY3RzIHNwZWVkcyAoaS5lLiBmYXN0LCBub3JtYWwgb3IgbWlsbGlzZWNvbmRzKVxuICAgICAgc2lkZTogJ2xlZnQnLCAvLyBBY2NlcHRzICdsZWZ0JyBvciAncmlnaHQnXG4gICAgICBzb3VyY2U6IG51bGwsIC8vIE92ZXJyaWRlIHRoZSBzb3VyY2Ugb2YgdGhlIGNvbnRlbnQuXG4gICAgICByZW5hbWluZzogdHJ1ZSwgLy8gVGhlIGlkcyBhbmQgY2xhc3NlcyB3aWxsIGJlIHByZXBlbmRlZCB3aXRoIGEgcHJlZml4IHdoZW4gbG9hZGluZyBleGlzdGVudCBjb250ZW50XG4gICAgICBib2R5OiAnYm9keScsIC8vIFBhZ2UgY29udGFpbmVyIHNlbGVjdG9yLFxuICAgICAgZGlzcGxhY2U6IHRydWUsIC8vIERpc3BsYWNlIHRoZSBib2R5IGNvbnRlbnQgb3Igbm90XG4gICAgICB0aW1pbmc6ICdlYXNlJywgLy8gVGltaW5nIGZ1bmN0aW9uIGZvciBDU1MgdHJhbnNpdGlvbnNcbiAgICAgIG1ldGhvZDogJ3RvZ2dsZScsIC8vIFRoZSBtZXRob2QgdG8gY2FsbCB3aGVuIGVsZW1lbnQgaXMgY2xpY2tlZFxuICAgICAgYmluZDogJ3RvdWNoc3RhcnQgY2xpY2snLCAvLyBUaGUgZXZlbnQocykgdG8gdHJpZ2dlciB0aGUgbWVudVxuICAgICAgb25PcGVuOiBmdW5jdGlvbiBvbk9wZW4oKSB7fSxcbiAgICAgIC8vIENhbGxiYWNrIHdoZW4gc2lkciBzdGFydCBvcGVuaW5nXG4gICAgICBvbkNsb3NlOiBmdW5jdGlvbiBvbkNsb3NlKCkge30sXG4gICAgICAvLyBDYWxsYmFjayB3aGVuIHNpZHIgc3RhcnQgY2xvc2luZ1xuICAgICAgb25PcGVuRW5kOiBmdW5jdGlvbiBvbk9wZW5FbmQoKSB7fSxcbiAgICAgIC8vIENhbGxiYWNrIHdoZW4gc2lkciBlbmQgb3BlbmluZ1xuICAgICAgb25DbG9zZUVuZDogZnVuY3Rpb24gb25DbG9zZUVuZCgpIHt9IC8vIENhbGxiYWNrIHdoZW4gc2lkciBlbmQgY2xvc2luZ1xuXG4gICAgfSwgb3B0aW9ucyksXG4gICAgICAgIG5hbWUgPSBzZXR0aW5ncy5uYW1lLFxuICAgICAgICAkc2lkZU1lbnUgPSAkJDMoJyMnICsgbmFtZSk7XG5cbiAgICAvLyBJZiB0aGUgc2lkZSBtZW51IGRvIG5vdCBleGlzdCBjcmVhdGUgaXRcbiAgICBpZiAoJHNpZGVNZW51Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgJHNpZGVNZW51ID0gJCQzKCc8ZGl2IC8+JykuYXR0cignaWQnLCBuYW1lKS5hcHBlbmRUbygkJDMoJ2JvZHknKSk7XG4gICAgfVxuXG4gICAgLy8gQWRkIHRyYW5zaXRpb24gdG8gbWVudSBpZiBhcmUgc3VwcG9ydGVkXG4gICAgaWYgKHRyYW5zaXRpb25zLnN1cHBvcnRlZCkge1xuICAgICAgJHNpZGVNZW51LmNzcyh0cmFuc2l0aW9ucy5wcm9wZXJ0eSwgc2V0dGluZ3Muc2lkZSArICcgJyArIHNldHRpbmdzLnNwZWVkIC8gMTAwMCArICdzICcgKyBzZXR0aW5ncy50aW1pbmcpO1xuICAgIH1cblxuICAgIC8vIEFkZGluZyBzdHlsZXMgYW5kIG9wdGlvbnNcbiAgICAkc2lkZU1lbnUuYWRkQ2xhc3MoJ3NpZHInKS5hZGRDbGFzcyhzZXR0aW5ncy5zaWRlKS5kYXRhKHtcbiAgICAgIHNwZWVkOiBzZXR0aW5ncy5zcGVlZCxcbiAgICAgIHNpZGU6IHNldHRpbmdzLnNpZGUsXG4gICAgICBib2R5OiBzZXR0aW5ncy5ib2R5LFxuICAgICAgZGlzcGxhY2U6IHNldHRpbmdzLmRpc3BsYWNlLFxuICAgICAgdGltaW5nOiBzZXR0aW5ncy50aW1pbmcsXG4gICAgICBtZXRob2Q6IHNldHRpbmdzLm1ldGhvZCxcbiAgICAgIG9uT3Blbjogc2V0dGluZ3Mub25PcGVuLFxuICAgICAgb25DbG9zZTogc2V0dGluZ3Mub25DbG9zZSxcbiAgICAgIG9uT3BlbkVuZDogc2V0dGluZ3Mub25PcGVuRW5kLFxuICAgICAgb25DbG9zZUVuZDogc2V0dGluZ3Mub25DbG9zZUVuZFxuICAgIH0pO1xuXG4gICAgJHNpZGVNZW51ID0gZmlsbENvbnRlbnQoJHNpZGVNZW51LCBzZXR0aW5ncyk7XG5cbiAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciAkdGhpcyA9ICQkMyh0aGlzKSxcbiAgICAgICAgICBkYXRhID0gJHRoaXMuZGF0YSgnc2lkcicpLFxuICAgICAgICAgIGZsYWcgPSBmYWxzZTtcblxuICAgICAgLy8gSWYgdGhlIHBsdWdpbiBoYXNuJ3QgYmVlbiBpbml0aWFsaXplZCB5ZXRcbiAgICAgIGlmICghZGF0YSkge1xuICAgICAgICBzaWRyU3RhdHVzLm1vdmluZyA9IGZhbHNlO1xuICAgICAgICBzaWRyU3RhdHVzLm9wZW5lZCA9IGZhbHNlO1xuXG4gICAgICAgICR0aGlzLmRhdGEoJ3NpZHInLCBuYW1lKTtcblxuICAgICAgICAkdGhpcy5iaW5kKHNldHRpbmdzLmJpbmQsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgICBpZiAoIWZsYWcpIHtcbiAgICAgICAgICAgIGZsYWcgPSB0cnVlO1xuICAgICAgICAgICAgc2lkcihzZXR0aW5ncy5tZXRob2QsIG5hbWUpO1xuXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgZmxhZyA9IGZhbHNlO1xuICAgICAgICAgICAgfSwgMTAwKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgalF1ZXJ5LnNpZHIgPSBzaWRyO1xuICBqUXVlcnkuZm4uc2lkciA9IGZuU2lkcjtcblxufSgpKTsiLCIoZnVuY3Rpb24oKSB7XG4gIHZhciBBamF4TW9uaXRvciwgQmFyLCBEb2N1bWVudE1vbml0b3IsIEVsZW1lbnRNb25pdG9yLCBFbGVtZW50VHJhY2tlciwgRXZlbnRMYWdNb25pdG9yLCBFdmVudGVkLCBFdmVudHMsIE5vVGFyZ2V0RXJyb3IsIFBhY2UsIFJlcXVlc3RJbnRlcmNlcHQsIFNPVVJDRV9LRVlTLCBTY2FsZXIsIFNvY2tldFJlcXVlc3RUcmFja2VyLCBYSFJSZXF1ZXN0VHJhY2tlciwgYW5pbWF0aW9uLCBhdmdBbXBsaXR1ZGUsIGJhciwgY2FuY2VsQW5pbWF0aW9uLCBjYW5jZWxBbmltYXRpb25GcmFtZSwgZGVmYXVsdE9wdGlvbnMsIGV4dGVuZCwgZXh0ZW5kTmF0aXZlLCBnZXRGcm9tRE9NLCBnZXRJbnRlcmNlcHQsIGhhbmRsZVB1c2hTdGF0ZSwgaWdub3JlU3RhY2ssIGluaXQsIG5vdywgb3B0aW9ucywgcmVxdWVzdEFuaW1hdGlvbkZyYW1lLCByZXN1bHQsIHJ1bkFuaW1hdGlvbiwgc2NhbGVycywgc2hvdWxkSWdub3JlVVJMLCBzaG91bGRUcmFjaywgc291cmNlLCBzb3VyY2VzLCB1bmlTY2FsZXIsIF9XZWJTb2NrZXQsIF9YRG9tYWluUmVxdWVzdCwgX1hNTEh0dHBSZXF1ZXN0LCBfaSwgX2ludGVyY2VwdCwgX2xlbiwgX3B1c2hTdGF0ZSwgX3JlZiwgX3JlZjEsIF9yZXBsYWNlU3RhdGUsXG4gICAgX19zbGljZSA9IFtdLnNsaWNlLFxuICAgIF9faGFzUHJvcCA9IHt9Lmhhc093blByb3BlcnR5LFxuICAgIF9fZXh0ZW5kcyA9IGZ1bmN0aW9uKGNoaWxkLCBwYXJlbnQpIHsgZm9yICh2YXIga2V5IGluIHBhcmVudCkgeyBpZiAoX19oYXNQcm9wLmNhbGwocGFyZW50LCBrZXkpKSBjaGlsZFtrZXldID0gcGFyZW50W2tleV07IH0gZnVuY3Rpb24gY3RvcigpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGNoaWxkOyB9IGN0b3IucHJvdG90eXBlID0gcGFyZW50LnByb3RvdHlwZTsgY2hpbGQucHJvdG90eXBlID0gbmV3IGN0b3IoKTsgY2hpbGQuX19zdXBlcl9fID0gcGFyZW50LnByb3RvdHlwZTsgcmV0dXJuIGNoaWxkOyB9LFxuICAgIF9faW5kZXhPZiA9IFtdLmluZGV4T2YgfHwgZnVuY3Rpb24oaXRlbSkgeyBmb3IgKHZhciBpID0gMCwgbCA9IHRoaXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7IGlmIChpIGluIHRoaXMgJiYgdGhpc1tpXSA9PT0gaXRlbSkgcmV0dXJuIGk7IH0gcmV0dXJuIC0xOyB9O1xuXG4gIGRlZmF1bHRPcHRpb25zID0ge1xuICAgIGNhdGNodXBUaW1lOiAxMDAsXG4gICAgaW5pdGlhbFJhdGU6IC4wMyxcbiAgICBtaW5UaW1lOiAyNTAsXG4gICAgZ2hvc3RUaW1lOiAxMDAsXG4gICAgbWF4UHJvZ3Jlc3NQZXJGcmFtZTogMjAsXG4gICAgZWFzZUZhY3RvcjogMS4yNSxcbiAgICBzdGFydE9uUGFnZUxvYWQ6IHRydWUsXG4gICAgcmVzdGFydE9uUHVzaFN0YXRlOiB0cnVlLFxuICAgIHJlc3RhcnRPblJlcXVlc3RBZnRlcjogNTAwLFxuICAgIHRhcmdldDogJ2JvZHknLFxuICAgIGVsZW1lbnRzOiB7XG4gICAgICBjaGVja0ludGVydmFsOiAxMDAsXG4gICAgICBzZWxlY3RvcnM6IFsnYm9keSddXG4gICAgfSxcbiAgICBldmVudExhZzoge1xuICAgICAgbWluU2FtcGxlczogMTAsXG4gICAgICBzYW1wbGVDb3VudDogMyxcbiAgICAgIGxhZ1RocmVzaG9sZDogM1xuICAgIH0sXG4gICAgYWpheDoge1xuICAgICAgdHJhY2tNZXRob2RzOiBbJ0dFVCddLFxuICAgICAgdHJhY2tXZWJTb2NrZXRzOiB0cnVlLFxuICAgICAgaWdub3JlVVJMczogW11cbiAgICB9XG4gIH07XG5cbiAgbm93ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIF9yZWY7XG4gICAgcmV0dXJuIChfcmVmID0gdHlwZW9mIHBlcmZvcm1hbmNlICE9PSBcInVuZGVmaW5lZFwiICYmIHBlcmZvcm1hbmNlICE9PSBudWxsID8gdHlwZW9mIHBlcmZvcm1hbmNlLm5vdyA9PT0gXCJmdW5jdGlvblwiID8gcGVyZm9ybWFuY2Uubm93KCkgOiB2b2lkIDAgOiB2b2lkIDApICE9IG51bGwgPyBfcmVmIDogKyhuZXcgRGF0ZSk7XG4gIH07XG5cbiAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cubW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8IHdpbmRvdy53ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgd2luZG93Lm1zUmVxdWVzdEFuaW1hdGlvbkZyYW1lO1xuXG4gIGNhbmNlbEFuaW1hdGlvbkZyYW1lID0gd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lIHx8IHdpbmRvdy5tb3pDYW5jZWxBbmltYXRpb25GcmFtZTtcblxuICBpZiAocmVxdWVzdEFuaW1hdGlvbkZyYW1lID09IG51bGwpIHtcbiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbihmbikge1xuICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZm4sIDUwKTtcbiAgICB9O1xuICAgIGNhbmNlbEFuaW1hdGlvbkZyYW1lID0gZnVuY3Rpb24oaWQpIHtcbiAgICAgIHJldHVybiBjbGVhclRpbWVvdXQoaWQpO1xuICAgIH07XG4gIH1cblxuICBydW5BbmltYXRpb24gPSBmdW5jdGlvbihmbikge1xuICAgIHZhciBsYXN0LCB0aWNrO1xuICAgIGxhc3QgPSBub3coKTtcbiAgICB0aWNrID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgZGlmZjtcbiAgICAgIGRpZmYgPSBub3coKSAtIGxhc3Q7XG4gICAgICBpZiAoZGlmZiA+PSAzMykge1xuICAgICAgICBsYXN0ID0gbm93KCk7XG4gICAgICAgIHJldHVybiBmbihkaWZmLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRpY2spO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KHRpY2ssIDMzIC0gZGlmZik7XG4gICAgICB9XG4gICAgfTtcbiAgICByZXR1cm4gdGljaygpO1xuICB9O1xuXG4gIHJlc3VsdCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBhcmdzLCBrZXksIG9iajtcbiAgICBvYmogPSBhcmd1bWVudHNbMF0sIGtleSA9IGFyZ3VtZW50c1sxXSwgYXJncyA9IDMgPD0gYXJndW1lbnRzLmxlbmd0aCA/IF9fc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpIDogW107XG4gICAgaWYgKHR5cGVvZiBvYmpba2V5XSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuIG9ialtrZXldLmFwcGx5KG9iaiwgYXJncyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBvYmpba2V5XTtcbiAgICB9XG4gIH07XG5cbiAgZXh0ZW5kID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGtleSwgb3V0LCBzb3VyY2UsIHNvdXJjZXMsIHZhbCwgX2ksIF9sZW47XG4gICAgb3V0ID0gYXJndW1lbnRzWzBdLCBzb3VyY2VzID0gMiA8PSBhcmd1bWVudHMubGVuZ3RoID8gX19zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkgOiBbXTtcbiAgICBmb3IgKF9pID0gMCwgX2xlbiA9IHNvdXJjZXMubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgIHNvdXJjZSA9IHNvdXJjZXNbX2ldO1xuICAgICAgaWYgKHNvdXJjZSkge1xuICAgICAgICBmb3IgKGtleSBpbiBzb3VyY2UpIHtcbiAgICAgICAgICBpZiAoIV9faGFzUHJvcC5jYWxsKHNvdXJjZSwga2V5KSkgY29udGludWU7XG4gICAgICAgICAgdmFsID0gc291cmNlW2tleV07XG4gICAgICAgICAgaWYgKChvdXRba2V5XSAhPSBudWxsKSAmJiB0eXBlb2Ygb3V0W2tleV0gPT09ICdvYmplY3QnICYmICh2YWwgIT0gbnVsbCkgJiYgdHlwZW9mIHZhbCA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIGV4dGVuZChvdXRba2V5XSwgdmFsKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb3V0W2tleV0gPSB2YWw7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBvdXQ7XG4gIH07XG5cbiAgYXZnQW1wbGl0dWRlID0gZnVuY3Rpb24oYXJyKSB7XG4gICAgdmFyIGNvdW50LCBzdW0sIHYsIF9pLCBfbGVuO1xuICAgIHN1bSA9IGNvdW50ID0gMDtcbiAgICBmb3IgKF9pID0gMCwgX2xlbiA9IGFyci5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgdiA9IGFycltfaV07XG4gICAgICBzdW0gKz0gTWF0aC5hYnModik7XG4gICAgICBjb3VudCsrO1xuICAgIH1cbiAgICByZXR1cm4gc3VtIC8gY291bnQ7XG4gIH07XG5cbiAgZ2V0RnJvbURPTSA9IGZ1bmN0aW9uKGtleSwganNvbikge1xuICAgIHZhciBkYXRhLCBlLCBlbDtcbiAgICBpZiAoa2V5ID09IG51bGwpIHtcbiAgICAgIGtleSA9ICdvcHRpb25zJztcbiAgICB9XG4gICAgaWYgKGpzb24gPT0gbnVsbCkge1xuICAgICAganNvbiA9IHRydWU7XG4gICAgfVxuICAgIGVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIltkYXRhLXBhY2UtXCIgKyBrZXkgKyBcIl1cIik7XG4gICAgaWYgKCFlbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkYXRhID0gZWwuZ2V0QXR0cmlidXRlKFwiZGF0YS1wYWNlLVwiICsga2V5KTtcbiAgICBpZiAoIWpzb24pIHtcbiAgICAgIHJldHVybiBkYXRhO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgcmV0dXJuIEpTT04ucGFyc2UoZGF0YSk7XG4gICAgfSBjYXRjaCAoX2Vycm9yKSB7XG4gICAgICBlID0gX2Vycm9yO1xuICAgICAgcmV0dXJuIHR5cGVvZiBjb25zb2xlICE9PSBcInVuZGVmaW5lZFwiICYmIGNvbnNvbGUgIT09IG51bGwgPyBjb25zb2xlLmVycm9yKFwiRXJyb3IgcGFyc2luZyBpbmxpbmUgcGFjZSBvcHRpb25zXCIsIGUpIDogdm9pZCAwO1xuICAgIH1cbiAgfTtcblxuICBFdmVudGVkID0gKGZ1bmN0aW9uKCkge1xuICAgIGZ1bmN0aW9uIEV2ZW50ZWQoKSB7fVxuXG4gICAgRXZlbnRlZC5wcm90b3R5cGUub24gPSBmdW5jdGlvbihldmVudCwgaGFuZGxlciwgY3R4LCBvbmNlKSB7XG4gICAgICB2YXIgX2Jhc2U7XG4gICAgICBpZiAob25jZSA9PSBudWxsKSB7XG4gICAgICAgIG9uY2UgPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLmJpbmRpbmdzID09IG51bGwpIHtcbiAgICAgICAgdGhpcy5iaW5kaW5ncyA9IHt9O1xuICAgICAgfVxuICAgICAgaWYgKChfYmFzZSA9IHRoaXMuYmluZGluZ3MpW2V2ZW50XSA9PSBudWxsKSB7XG4gICAgICAgIF9iYXNlW2V2ZW50XSA9IFtdO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuYmluZGluZ3NbZXZlbnRdLnB1c2goe1xuICAgICAgICBoYW5kbGVyOiBoYW5kbGVyLFxuICAgICAgICBjdHg6IGN0eCxcbiAgICAgICAgb25jZTogb25jZVxuICAgICAgfSk7XG4gICAgfTtcblxuICAgIEV2ZW50ZWQucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbihldmVudCwgaGFuZGxlciwgY3R4KSB7XG4gICAgICByZXR1cm4gdGhpcy5vbihldmVudCwgaGFuZGxlciwgY3R4LCB0cnVlKTtcbiAgICB9O1xuXG4gICAgRXZlbnRlZC5wcm90b3R5cGUub2ZmID0gZnVuY3Rpb24oZXZlbnQsIGhhbmRsZXIpIHtcbiAgICAgIHZhciBpLCBfcmVmLCBfcmVzdWx0cztcbiAgICAgIGlmICgoKF9yZWYgPSB0aGlzLmJpbmRpbmdzKSAhPSBudWxsID8gX3JlZltldmVudF0gOiB2b2lkIDApID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKGhhbmRsZXIgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gZGVsZXRlIHRoaXMuYmluZGluZ3NbZXZlbnRdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaSA9IDA7XG4gICAgICAgIF9yZXN1bHRzID0gW107XG4gICAgICAgIHdoaWxlIChpIDwgdGhpcy5iaW5kaW5nc1tldmVudF0ubGVuZ3RoKSB7XG4gICAgICAgICAgaWYgKHRoaXMuYmluZGluZ3NbZXZlbnRdW2ldLmhhbmRsZXIgPT09IGhhbmRsZXIpIHtcbiAgICAgICAgICAgIF9yZXN1bHRzLnB1c2godGhpcy5iaW5kaW5nc1tldmVudF0uc3BsaWNlKGksIDEpKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgX3Jlc3VsdHMucHVzaChpKyspO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gX3Jlc3VsdHM7XG4gICAgICB9XG4gICAgfTtcblxuICAgIEV2ZW50ZWQucHJvdG90eXBlLnRyaWdnZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBhcmdzLCBjdHgsIGV2ZW50LCBoYW5kbGVyLCBpLCBvbmNlLCBfcmVmLCBfcmVmMSwgX3Jlc3VsdHM7XG4gICAgICBldmVudCA9IGFyZ3VtZW50c1swXSwgYXJncyA9IDIgPD0gYXJndW1lbnRzLmxlbmd0aCA/IF9fc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpIDogW107XG4gICAgICBpZiAoKF9yZWYgPSB0aGlzLmJpbmRpbmdzKSAhPSBudWxsID8gX3JlZltldmVudF0gOiB2b2lkIDApIHtcbiAgICAgICAgaSA9IDA7XG4gICAgICAgIF9yZXN1bHRzID0gW107XG4gICAgICAgIHdoaWxlIChpIDwgdGhpcy5iaW5kaW5nc1tldmVudF0ubGVuZ3RoKSB7XG4gICAgICAgICAgX3JlZjEgPSB0aGlzLmJpbmRpbmdzW2V2ZW50XVtpXSwgaGFuZGxlciA9IF9yZWYxLmhhbmRsZXIsIGN0eCA9IF9yZWYxLmN0eCwgb25jZSA9IF9yZWYxLm9uY2U7XG4gICAgICAgICAgaGFuZGxlci5hcHBseShjdHggIT0gbnVsbCA/IGN0eCA6IHRoaXMsIGFyZ3MpO1xuICAgICAgICAgIGlmIChvbmNlKSB7XG4gICAgICAgICAgICBfcmVzdWx0cy5wdXNoKHRoaXMuYmluZGluZ3NbZXZlbnRdLnNwbGljZShpLCAxKSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIF9yZXN1bHRzLnB1c2goaSsrKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIF9yZXN1bHRzO1xuICAgICAgfVxuICAgIH07XG5cbiAgICByZXR1cm4gRXZlbnRlZDtcblxuICB9KSgpO1xuXG4gIFBhY2UgPSB3aW5kb3cuUGFjZSB8fCB7fTtcblxuICB3aW5kb3cuUGFjZSA9IFBhY2U7XG5cbiAgZXh0ZW5kKFBhY2UsIEV2ZW50ZWQucHJvdG90eXBlKTtcblxuICBvcHRpb25zID0gUGFjZS5vcHRpb25zID0gZXh0ZW5kKHt9LCBkZWZhdWx0T3B0aW9ucywgd2luZG93LnBhY2VPcHRpb25zLCBnZXRGcm9tRE9NKCkpO1xuXG4gIF9yZWYgPSBbJ2FqYXgnLCAnZG9jdW1lbnQnLCAnZXZlbnRMYWcnLCAnZWxlbWVudHMnXTtcbiAgZm9yIChfaSA9IDAsIF9sZW4gPSBfcmVmLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgc291cmNlID0gX3JlZltfaV07XG4gICAgaWYgKG9wdGlvbnNbc291cmNlXSA9PT0gdHJ1ZSkge1xuICAgICAgb3B0aW9uc1tzb3VyY2VdID0gZGVmYXVsdE9wdGlvbnNbc291cmNlXTtcbiAgICB9XG4gIH1cblxuICBOb1RhcmdldEVycm9yID0gKGZ1bmN0aW9uKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhOb1RhcmdldEVycm9yLCBfc3VwZXIpO1xuXG4gICAgZnVuY3Rpb24gTm9UYXJnZXRFcnJvcigpIHtcbiAgICAgIF9yZWYxID0gTm9UYXJnZXRFcnJvci5fX3N1cGVyX18uY29uc3RydWN0b3IuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIHJldHVybiBfcmVmMTtcbiAgICB9XG5cbiAgICByZXR1cm4gTm9UYXJnZXRFcnJvcjtcblxuICB9KShFcnJvcik7XG5cbiAgQmFyID0gKGZ1bmN0aW9uKCkge1xuICAgIGZ1bmN0aW9uIEJhcigpIHtcbiAgICAgIHRoaXMucHJvZ3Jlc3MgPSAwO1xuICAgIH1cblxuICAgIEJhci5wcm90b3R5cGUuZ2V0RWxlbWVudCA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHRhcmdldEVsZW1lbnQ7XG4gICAgICBpZiAodGhpcy5lbCA9PSBudWxsKSB7XG4gICAgICAgIHRhcmdldEVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKG9wdGlvbnMudGFyZ2V0KTtcbiAgICAgICAgaWYgKCF0YXJnZXRFbGVtZW50KSB7XG4gICAgICAgICAgdGhyb3cgbmV3IE5vVGFyZ2V0RXJyb3I7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5lbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICB0aGlzLmVsLmNsYXNzTmFtZSA9IFwicGFjZSBwYWNlLWFjdGl2ZVwiO1xuICAgICAgICBkb2N1bWVudC5ib2R5LmNsYXNzTmFtZSA9IGRvY3VtZW50LmJvZHkuY2xhc3NOYW1lLnJlcGxhY2UoL3BhY2UtZG9uZS9nLCAnJyk7XG4gICAgICAgIGRvY3VtZW50LmJvZHkuY2xhc3NOYW1lICs9ICcgcGFjZS1ydW5uaW5nJztcbiAgICAgICAgdGhpcy5lbC5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz1cInBhY2UtcHJvZ3Jlc3NcIj5cXG4gIDxkaXYgY2xhc3M9XCJwYWNlLXByb2dyZXNzLWlubmVyXCI+PC9kaXY+XFxuPC9kaXY+XFxuPGRpdiBjbGFzcz1cInBhY2UtYWN0aXZpdHlcIj48L2Rpdj4nO1xuICAgICAgICBpZiAodGFyZ2V0RWxlbWVudC5maXJzdENoaWxkICE9IG51bGwpIHtcbiAgICAgICAgICB0YXJnZXRFbGVtZW50Lmluc2VydEJlZm9yZSh0aGlzLmVsLCB0YXJnZXRFbGVtZW50LmZpcnN0Q2hpbGQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRhcmdldEVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5lbCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLmVsO1xuICAgIH07XG5cbiAgICBCYXIucHJvdG90eXBlLmZpbmlzaCA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGVsO1xuICAgICAgZWwgPSB0aGlzLmdldEVsZW1lbnQoKTtcbiAgICAgIGVsLmNsYXNzTmFtZSA9IGVsLmNsYXNzTmFtZS5yZXBsYWNlKCdwYWNlLWFjdGl2ZScsICcnKTtcbiAgICAgIGVsLmNsYXNzTmFtZSArPSAnIHBhY2UtaW5hY3RpdmUnO1xuICAgICAgZG9jdW1lbnQuYm9keS5jbGFzc05hbWUgPSBkb2N1bWVudC5ib2R5LmNsYXNzTmFtZS5yZXBsYWNlKCdwYWNlLXJ1bm5pbmcnLCAnJyk7XG4gICAgICByZXR1cm4gZG9jdW1lbnQuYm9keS5jbGFzc05hbWUgKz0gJyBwYWNlLWRvbmUnO1xuICAgIH07XG5cbiAgICBCYXIucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uKHByb2cpIHtcbiAgICAgIHRoaXMucHJvZ3Jlc3MgPSBwcm9nO1xuICAgICAgcmV0dXJuIHRoaXMucmVuZGVyKCk7XG4gICAgfTtcblxuICAgIEJhci5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uKCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgdGhpcy5nZXRFbGVtZW50KCkucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLmdldEVsZW1lbnQoKSk7XG4gICAgICB9IGNhdGNoIChfZXJyb3IpIHtcbiAgICAgICAgTm9UYXJnZXRFcnJvciA9IF9lcnJvcjtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLmVsID0gdm9pZCAwO1xuICAgIH07XG5cbiAgICBCYXIucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGVsLCBrZXksIHByb2dyZXNzU3RyLCB0cmFuc2Zvcm0sIF9qLCBfbGVuMSwgX3JlZjI7XG4gICAgICBpZiAoZG9jdW1lbnQucXVlcnlTZWxlY3RvcihvcHRpb25zLnRhcmdldCkgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBlbCA9IHRoaXMuZ2V0RWxlbWVudCgpO1xuICAgICAgdHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUzZChcIiArIHRoaXMucHJvZ3Jlc3MgKyBcIiUsIDAsIDApXCI7XG4gICAgICBfcmVmMiA9IFsnd2Via2l0VHJhbnNmb3JtJywgJ21zVHJhbnNmb3JtJywgJ3RyYW5zZm9ybSddO1xuICAgICAgZm9yIChfaiA9IDAsIF9sZW4xID0gX3JlZjIubGVuZ3RoOyBfaiA8IF9sZW4xOyBfaisrKSB7XG4gICAgICAgIGtleSA9IF9yZWYyW19qXTtcbiAgICAgICAgZWwuY2hpbGRyZW5bMF0uc3R5bGVba2V5XSA9IHRyYW5zZm9ybTtcbiAgICAgIH1cbiAgICAgIGlmICghdGhpcy5sYXN0UmVuZGVyZWRQcm9ncmVzcyB8fCB0aGlzLmxhc3RSZW5kZXJlZFByb2dyZXNzIHwgMCAhPT0gdGhpcy5wcm9ncmVzcyB8IDApIHtcbiAgICAgICAgZWwuY2hpbGRyZW5bMF0uc2V0QXR0cmlidXRlKCdkYXRhLXByb2dyZXNzLXRleHQnLCBcIlwiICsgKHRoaXMucHJvZ3Jlc3MgfCAwKSArIFwiJVwiKTtcbiAgICAgICAgaWYgKHRoaXMucHJvZ3Jlc3MgPj0gMTAwKSB7XG4gICAgICAgICAgcHJvZ3Jlc3NTdHIgPSAnOTknO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHByb2dyZXNzU3RyID0gdGhpcy5wcm9ncmVzcyA8IDEwID8gXCIwXCIgOiBcIlwiO1xuICAgICAgICAgIHByb2dyZXNzU3RyICs9IHRoaXMucHJvZ3Jlc3MgfCAwO1xuICAgICAgICB9XG4gICAgICAgIGVsLmNoaWxkcmVuWzBdLnNldEF0dHJpYnV0ZSgnZGF0YS1wcm9ncmVzcycsIFwiXCIgKyBwcm9ncmVzc1N0cik7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5sYXN0UmVuZGVyZWRQcm9ncmVzcyA9IHRoaXMucHJvZ3Jlc3M7XG4gICAgfTtcblxuICAgIEJhci5wcm90b3R5cGUuZG9uZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMucHJvZ3Jlc3MgPj0gMTAwO1xuICAgIH07XG5cbiAgICByZXR1cm4gQmFyO1xuXG4gIH0pKCk7XG5cbiAgRXZlbnRzID0gKGZ1bmN0aW9uKCkge1xuICAgIGZ1bmN0aW9uIEV2ZW50cygpIHtcbiAgICAgIHRoaXMuYmluZGluZ3MgPSB7fTtcbiAgICB9XG5cbiAgICBFdmVudHMucHJvdG90eXBlLnRyaWdnZXIgPSBmdW5jdGlvbihuYW1lLCB2YWwpIHtcbiAgICAgIHZhciBiaW5kaW5nLCBfaiwgX2xlbjEsIF9yZWYyLCBfcmVzdWx0cztcbiAgICAgIGlmICh0aGlzLmJpbmRpbmdzW25hbWVdICE9IG51bGwpIHtcbiAgICAgICAgX3JlZjIgPSB0aGlzLmJpbmRpbmdzW25hbWVdO1xuICAgICAgICBfcmVzdWx0cyA9IFtdO1xuICAgICAgICBmb3IgKF9qID0gMCwgX2xlbjEgPSBfcmVmMi5sZW5ndGg7IF9qIDwgX2xlbjE7IF9qKyspIHtcbiAgICAgICAgICBiaW5kaW5nID0gX3JlZjJbX2pdO1xuICAgICAgICAgIF9yZXN1bHRzLnB1c2goYmluZGluZy5jYWxsKHRoaXMsIHZhbCkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBfcmVzdWx0cztcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgRXZlbnRzLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uKG5hbWUsIGZuKSB7XG4gICAgICB2YXIgX2Jhc2U7XG4gICAgICBpZiAoKF9iYXNlID0gdGhpcy5iaW5kaW5ncylbbmFtZV0gPT0gbnVsbCkge1xuICAgICAgICBfYmFzZVtuYW1lXSA9IFtdO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuYmluZGluZ3NbbmFtZV0ucHVzaChmbik7XG4gICAgfTtcblxuICAgIHJldHVybiBFdmVudHM7XG5cbiAgfSkoKTtcblxuICBfWE1MSHR0cFJlcXVlc3QgPSB3aW5kb3cuWE1MSHR0cFJlcXVlc3Q7XG5cbiAgX1hEb21haW5SZXF1ZXN0ID0gd2luZG93LlhEb21haW5SZXF1ZXN0O1xuXG4gIF9XZWJTb2NrZXQgPSB3aW5kb3cuV2ViU29ja2V0O1xuXG4gIGV4dGVuZE5hdGl2ZSA9IGZ1bmN0aW9uKHRvLCBmcm9tKSB7XG4gICAgdmFyIGUsIGtleSwgX3Jlc3VsdHM7XG4gICAgX3Jlc3VsdHMgPSBbXTtcbiAgICBmb3IgKGtleSBpbiBmcm9tLnByb3RvdHlwZSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKCh0b1trZXldID09IG51bGwpICYmIHR5cGVvZiBmcm9tW2tleV0gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICBpZiAodHlwZW9mIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgX3Jlc3VsdHMucHVzaChPYmplY3QuZGVmaW5lUHJvcGVydHkodG8sIGtleSwge1xuICAgICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmcm9tLnByb3RvdHlwZVtrZXldO1xuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWVcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgX3Jlc3VsdHMucHVzaCh0b1trZXldID0gZnJvbS5wcm90b3R5cGVba2V5XSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIF9yZXN1bHRzLnB1c2godm9pZCAwKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoX2Vycm9yKSB7XG4gICAgICAgIGUgPSBfZXJyb3I7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBfcmVzdWx0cztcbiAgfTtcblxuICBpZ25vcmVTdGFjayA9IFtdO1xuXG4gIFBhY2UuaWdub3JlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGFyZ3MsIGZuLCByZXQ7XG4gICAgZm4gPSBhcmd1bWVudHNbMF0sIGFyZ3MgPSAyIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBfX3NsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSA6IFtdO1xuICAgIGlnbm9yZVN0YWNrLnVuc2hpZnQoJ2lnbm9yZScpO1xuICAgIHJldCA9IGZuLmFwcGx5KG51bGwsIGFyZ3MpO1xuICAgIGlnbm9yZVN0YWNrLnNoaWZ0KCk7XG4gICAgcmV0dXJuIHJldDtcbiAgfTtcblxuICBQYWNlLnRyYWNrID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGFyZ3MsIGZuLCByZXQ7XG4gICAgZm4gPSBhcmd1bWVudHNbMF0sIGFyZ3MgPSAyIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBfX3NsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSA6IFtdO1xuICAgIGlnbm9yZVN0YWNrLnVuc2hpZnQoJ3RyYWNrJyk7XG4gICAgcmV0ID0gZm4uYXBwbHkobnVsbCwgYXJncyk7XG4gICAgaWdub3JlU3RhY2suc2hpZnQoKTtcbiAgICByZXR1cm4gcmV0O1xuICB9O1xuXG4gIHNob3VsZFRyYWNrID0gZnVuY3Rpb24obWV0aG9kKSB7XG4gICAgdmFyIF9yZWYyO1xuICAgIGlmIChtZXRob2QgPT0gbnVsbCkge1xuICAgICAgbWV0aG9kID0gJ0dFVCc7XG4gICAgfVxuICAgIGlmIChpZ25vcmVTdGFja1swXSA9PT0gJ3RyYWNrJykge1xuICAgICAgcmV0dXJuICdmb3JjZSc7XG4gICAgfVxuICAgIGlmICghaWdub3JlU3RhY2subGVuZ3RoICYmIG9wdGlvbnMuYWpheCkge1xuICAgICAgaWYgKG1ldGhvZCA9PT0gJ3NvY2tldCcgJiYgb3B0aW9ucy5hamF4LnRyYWNrV2ViU29ja2V0cykge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0gZWxzZSBpZiAoX3JlZjIgPSBtZXRob2QudG9VcHBlckNhc2UoKSwgX19pbmRleE9mLmNhbGwob3B0aW9ucy5hamF4LnRyYWNrTWV0aG9kcywgX3JlZjIpID49IDApIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfTtcblxuICBSZXF1ZXN0SW50ZXJjZXB0ID0gKGZ1bmN0aW9uKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhSZXF1ZXN0SW50ZXJjZXB0LCBfc3VwZXIpO1xuXG4gICAgZnVuY3Rpb24gUmVxdWVzdEludGVyY2VwdCgpIHtcbiAgICAgIHZhciBtb25pdG9yWEhSLFxuICAgICAgICBfdGhpcyA9IHRoaXM7XG4gICAgICBSZXF1ZXN0SW50ZXJjZXB0Ll9fc3VwZXJfXy5jb25zdHJ1Y3Rvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgbW9uaXRvclhIUiA9IGZ1bmN0aW9uKHJlcSkge1xuICAgICAgICB2YXIgX29wZW47XG4gICAgICAgIF9vcGVuID0gcmVxLm9wZW47XG4gICAgICAgIHJldHVybiByZXEub3BlbiA9IGZ1bmN0aW9uKHR5cGUsIHVybCwgYXN5bmMpIHtcbiAgICAgICAgICBpZiAoc2hvdWxkVHJhY2sodHlwZSkpIHtcbiAgICAgICAgICAgIF90aGlzLnRyaWdnZXIoJ3JlcXVlc3QnLCB7XG4gICAgICAgICAgICAgIHR5cGU6IHR5cGUsXG4gICAgICAgICAgICAgIHVybDogdXJsLFxuICAgICAgICAgICAgICByZXF1ZXN0OiByZXFcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gX29wZW4uYXBwbHkocmVxLCBhcmd1bWVudHMpO1xuICAgICAgICB9O1xuICAgICAgfTtcbiAgICAgIHdpbmRvdy5YTUxIdHRwUmVxdWVzdCA9IGZ1bmN0aW9uKGZsYWdzKSB7XG4gICAgICAgIHZhciByZXE7XG4gICAgICAgIHJlcSA9IG5ldyBfWE1MSHR0cFJlcXVlc3QoZmxhZ3MpO1xuICAgICAgICBtb25pdG9yWEhSKHJlcSk7XG4gICAgICAgIHJldHVybiByZXE7XG4gICAgICB9O1xuICAgICAgdHJ5IHtcbiAgICAgICAgZXh0ZW5kTmF0aXZlKHdpbmRvdy5YTUxIdHRwUmVxdWVzdCwgX1hNTEh0dHBSZXF1ZXN0KTtcbiAgICAgIH0gY2F0Y2ggKF9lcnJvcikge31cbiAgICAgIGlmIChfWERvbWFpblJlcXVlc3QgIT0gbnVsbCkge1xuICAgICAgICB3aW5kb3cuWERvbWFpblJlcXVlc3QgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICB2YXIgcmVxO1xuICAgICAgICAgIHJlcSA9IG5ldyBfWERvbWFpblJlcXVlc3Q7XG4gICAgICAgICAgbW9uaXRvclhIUihyZXEpO1xuICAgICAgICAgIHJldHVybiByZXE7XG4gICAgICAgIH07XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgZXh0ZW5kTmF0aXZlKHdpbmRvdy5YRG9tYWluUmVxdWVzdCwgX1hEb21haW5SZXF1ZXN0KTtcbiAgICAgICAgfSBjYXRjaCAoX2Vycm9yKSB7fVxuICAgICAgfVxuICAgICAgaWYgKChfV2ViU29ja2V0ICE9IG51bGwpICYmIG9wdGlvbnMuYWpheC50cmFja1dlYlNvY2tldHMpIHtcbiAgICAgICAgd2luZG93LldlYlNvY2tldCA9IGZ1bmN0aW9uKHVybCwgcHJvdG9jb2xzKSB7XG4gICAgICAgICAgdmFyIHJlcTtcbiAgICAgICAgICBpZiAocHJvdG9jb2xzICE9IG51bGwpIHtcbiAgICAgICAgICAgIHJlcSA9IG5ldyBfV2ViU29ja2V0KHVybCwgcHJvdG9jb2xzKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVxID0gbmV3IF9XZWJTb2NrZXQodXJsKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHNob3VsZFRyYWNrKCdzb2NrZXQnKSkge1xuICAgICAgICAgICAgX3RoaXMudHJpZ2dlcigncmVxdWVzdCcsIHtcbiAgICAgICAgICAgICAgdHlwZTogJ3NvY2tldCcsXG4gICAgICAgICAgICAgIHVybDogdXJsLFxuICAgICAgICAgICAgICBwcm90b2NvbHM6IHByb3RvY29scyxcbiAgICAgICAgICAgICAgcmVxdWVzdDogcmVxXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHJlcTtcbiAgICAgICAgfTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBleHRlbmROYXRpdmUod2luZG93LldlYlNvY2tldCwgX1dlYlNvY2tldCk7XG4gICAgICAgIH0gY2F0Y2ggKF9lcnJvcikge31cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gUmVxdWVzdEludGVyY2VwdDtcblxuICB9KShFdmVudHMpO1xuXG4gIF9pbnRlcmNlcHQgPSBudWxsO1xuXG4gIGdldEludGVyY2VwdCA9IGZ1bmN0aW9uKCkge1xuICAgIGlmIChfaW50ZXJjZXB0ID09IG51bGwpIHtcbiAgICAgIF9pbnRlcmNlcHQgPSBuZXcgUmVxdWVzdEludGVyY2VwdDtcbiAgICB9XG4gICAgcmV0dXJuIF9pbnRlcmNlcHQ7XG4gIH07XG5cbiAgc2hvdWxkSWdub3JlVVJMID0gZnVuY3Rpb24odXJsKSB7XG4gICAgdmFyIHBhdHRlcm4sIF9qLCBfbGVuMSwgX3JlZjI7XG4gICAgX3JlZjIgPSBvcHRpb25zLmFqYXguaWdub3JlVVJMcztcbiAgICBmb3IgKF9qID0gMCwgX2xlbjEgPSBfcmVmMi5sZW5ndGg7IF9qIDwgX2xlbjE7IF9qKyspIHtcbiAgICAgIHBhdHRlcm4gPSBfcmVmMltfal07XG4gICAgICBpZiAodHlwZW9mIHBhdHRlcm4gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGlmICh1cmwuaW5kZXhPZihwYXR0ZXJuKSAhPT0gLTEpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHBhdHRlcm4udGVzdCh1cmwpKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9O1xuXG4gIGdldEludGVyY2VwdCgpLm9uKCdyZXF1ZXN0JywgZnVuY3Rpb24oX2FyZykge1xuICAgIHZhciBhZnRlciwgYXJncywgcmVxdWVzdCwgdHlwZSwgdXJsO1xuICAgIHR5cGUgPSBfYXJnLnR5cGUsIHJlcXVlc3QgPSBfYXJnLnJlcXVlc3QsIHVybCA9IF9hcmcudXJsO1xuICAgIGlmIChzaG91bGRJZ25vcmVVUkwodXJsKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoIVBhY2UucnVubmluZyAmJiAob3B0aW9ucy5yZXN0YXJ0T25SZXF1ZXN0QWZ0ZXIgIT09IGZhbHNlIHx8IHNob3VsZFRyYWNrKHR5cGUpID09PSAnZm9yY2UnKSkge1xuICAgICAgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgIGFmdGVyID0gb3B0aW9ucy5yZXN0YXJ0T25SZXF1ZXN0QWZ0ZXIgfHwgMDtcbiAgICAgIGlmICh0eXBlb2YgYWZ0ZXIgPT09ICdib29sZWFuJykge1xuICAgICAgICBhZnRlciA9IDA7XG4gICAgICB9XG4gICAgICByZXR1cm4gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHN0aWxsQWN0aXZlLCBfaiwgX2xlbjEsIF9yZWYyLCBfcmVmMywgX3Jlc3VsdHM7XG4gICAgICAgIGlmICh0eXBlID09PSAnc29ja2V0Jykge1xuICAgICAgICAgIHN0aWxsQWN0aXZlID0gcmVxdWVzdC5yZWFkeVN0YXRlIDwgMjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdGlsbEFjdGl2ZSA9ICgwIDwgKF9yZWYyID0gcmVxdWVzdC5yZWFkeVN0YXRlKSAmJiBfcmVmMiA8IDQpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzdGlsbEFjdGl2ZSkge1xuICAgICAgICAgIFBhY2UucmVzdGFydCgpO1xuICAgICAgICAgIF9yZWYzID0gUGFjZS5zb3VyY2VzO1xuICAgICAgICAgIF9yZXN1bHRzID0gW107XG4gICAgICAgICAgZm9yIChfaiA9IDAsIF9sZW4xID0gX3JlZjMubGVuZ3RoOyBfaiA8IF9sZW4xOyBfaisrKSB7XG4gICAgICAgICAgICBzb3VyY2UgPSBfcmVmM1tfal07XG4gICAgICAgICAgICBpZiAoc291cmNlIGluc3RhbmNlb2YgQWpheE1vbml0b3IpIHtcbiAgICAgICAgICAgICAgc291cmNlLndhdGNoLmFwcGx5KHNvdXJjZSwgYXJncyk7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgX3Jlc3VsdHMucHVzaCh2b2lkIDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gX3Jlc3VsdHM7XG4gICAgICAgIH1cbiAgICAgIH0sIGFmdGVyKTtcbiAgICB9XG4gIH0pO1xuXG4gIEFqYXhNb25pdG9yID0gKGZ1bmN0aW9uKCkge1xuICAgIGZ1bmN0aW9uIEFqYXhNb25pdG9yKCkge1xuICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgIHRoaXMuZWxlbWVudHMgPSBbXTtcbiAgICAgIGdldEludGVyY2VwdCgpLm9uKCdyZXF1ZXN0JywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBfdGhpcy53YXRjaC5hcHBseShfdGhpcywgYXJndW1lbnRzKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIEFqYXhNb25pdG9yLnByb3RvdHlwZS53YXRjaCA9IGZ1bmN0aW9uKF9hcmcpIHtcbiAgICAgIHZhciByZXF1ZXN0LCB0cmFja2VyLCB0eXBlLCB1cmw7XG4gICAgICB0eXBlID0gX2FyZy50eXBlLCByZXF1ZXN0ID0gX2FyZy5yZXF1ZXN0LCB1cmwgPSBfYXJnLnVybDtcbiAgICAgIGlmIChzaG91bGRJZ25vcmVVUkwodXJsKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAodHlwZSA9PT0gJ3NvY2tldCcpIHtcbiAgICAgICAgdHJhY2tlciA9IG5ldyBTb2NrZXRSZXF1ZXN0VHJhY2tlcihyZXF1ZXN0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRyYWNrZXIgPSBuZXcgWEhSUmVxdWVzdFRyYWNrZXIocmVxdWVzdCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5lbGVtZW50cy5wdXNoKHRyYWNrZXIpO1xuICAgIH07XG5cbiAgICByZXR1cm4gQWpheE1vbml0b3I7XG5cbiAgfSkoKTtcblxuICBYSFJSZXF1ZXN0VHJhY2tlciA9IChmdW5jdGlvbigpIHtcbiAgICBmdW5jdGlvbiBYSFJSZXF1ZXN0VHJhY2tlcihyZXF1ZXN0KSB7XG4gICAgICB2YXIgZXZlbnQsIHNpemUsIF9qLCBfbGVuMSwgX29ucmVhZHlzdGF0ZWNoYW5nZSwgX3JlZjIsXG4gICAgICAgIF90aGlzID0gdGhpcztcbiAgICAgIHRoaXMucHJvZ3Jlc3MgPSAwO1xuICAgICAgaWYgKHdpbmRvdy5Qcm9ncmVzc0V2ZW50ICE9IG51bGwpIHtcbiAgICAgICAgc2l6ZSA9IG51bGw7XG4gICAgICAgIHJlcXVlc3QuYWRkRXZlbnRMaXN0ZW5lcigncHJvZ3Jlc3MnLCBmdW5jdGlvbihldnQpIHtcbiAgICAgICAgICBpZiAoZXZ0Lmxlbmd0aENvbXB1dGFibGUpIHtcbiAgICAgICAgICAgIHJldHVybiBfdGhpcy5wcm9ncmVzcyA9IDEwMCAqIGV2dC5sb2FkZWQgLyBldnQudG90YWw7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBfdGhpcy5wcm9ncmVzcyA9IF90aGlzLnByb2dyZXNzICsgKDEwMCAtIF90aGlzLnByb2dyZXNzKSAvIDI7XG4gICAgICAgICAgfVxuICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgIF9yZWYyID0gWydsb2FkJywgJ2Fib3J0JywgJ3RpbWVvdXQnLCAnZXJyb3InXTtcbiAgICAgICAgZm9yIChfaiA9IDAsIF9sZW4xID0gX3JlZjIubGVuZ3RoOyBfaiA8IF9sZW4xOyBfaisrKSB7XG4gICAgICAgICAgZXZlbnQgPSBfcmVmMltfal07XG4gICAgICAgICAgcmVxdWVzdC5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBfdGhpcy5wcm9ncmVzcyA9IDEwMDtcbiAgICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIF9vbnJlYWR5c3RhdGVjaGFuZ2UgPSByZXF1ZXN0Lm9ucmVhZHlzdGF0ZWNoYW5nZTtcbiAgICAgICAgcmVxdWVzdC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICB2YXIgX3JlZjM7XG4gICAgICAgICAgaWYgKChfcmVmMyA9IHJlcXVlc3QucmVhZHlTdGF0ZSkgPT09IDAgfHwgX3JlZjMgPT09IDQpIHtcbiAgICAgICAgICAgIF90aGlzLnByb2dyZXNzID0gMTAwO1xuICAgICAgICAgIH0gZWxzZSBpZiAocmVxdWVzdC5yZWFkeVN0YXRlID09PSAzKSB7XG4gICAgICAgICAgICBfdGhpcy5wcm9ncmVzcyA9IDUwO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdHlwZW9mIF9vbnJlYWR5c3RhdGVjaGFuZ2UgPT09IFwiZnVuY3Rpb25cIiA/IF9vbnJlYWR5c3RhdGVjaGFuZ2UuYXBwbHkobnVsbCwgYXJndW1lbnRzKSA6IHZvaWQgMDtcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gWEhSUmVxdWVzdFRyYWNrZXI7XG5cbiAgfSkoKTtcblxuICBTb2NrZXRSZXF1ZXN0VHJhY2tlciA9IChmdW5jdGlvbigpIHtcbiAgICBmdW5jdGlvbiBTb2NrZXRSZXF1ZXN0VHJhY2tlcihyZXF1ZXN0KSB7XG4gICAgICB2YXIgZXZlbnQsIF9qLCBfbGVuMSwgX3JlZjIsXG4gICAgICAgIF90aGlzID0gdGhpcztcbiAgICAgIHRoaXMucHJvZ3Jlc3MgPSAwO1xuICAgICAgX3JlZjIgPSBbJ2Vycm9yJywgJ29wZW4nXTtcbiAgICAgIGZvciAoX2ogPSAwLCBfbGVuMSA9IF9yZWYyLmxlbmd0aDsgX2ogPCBfbGVuMTsgX2orKykge1xuICAgICAgICBldmVudCA9IF9yZWYyW19qXTtcbiAgICAgICAgcmVxdWVzdC5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gX3RoaXMucHJvZ3Jlc3MgPSAxMDA7XG4gICAgICAgIH0sIGZhbHNlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gU29ja2V0UmVxdWVzdFRyYWNrZXI7XG5cbiAgfSkoKTtcblxuICBFbGVtZW50TW9uaXRvciA9IChmdW5jdGlvbigpIHtcbiAgICBmdW5jdGlvbiBFbGVtZW50TW9uaXRvcihvcHRpb25zKSB7XG4gICAgICB2YXIgc2VsZWN0b3IsIF9qLCBfbGVuMSwgX3JlZjI7XG4gICAgICBpZiAob3B0aW9ucyA9PSBudWxsKSB7XG4gICAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICAgIH1cbiAgICAgIHRoaXMuZWxlbWVudHMgPSBbXTtcbiAgICAgIGlmIChvcHRpb25zLnNlbGVjdG9ycyA9PSBudWxsKSB7XG4gICAgICAgIG9wdGlvbnMuc2VsZWN0b3JzID0gW107XG4gICAgICB9XG4gICAgICBfcmVmMiA9IG9wdGlvbnMuc2VsZWN0b3JzO1xuICAgICAgZm9yIChfaiA9IDAsIF9sZW4xID0gX3JlZjIubGVuZ3RoOyBfaiA8IF9sZW4xOyBfaisrKSB7XG4gICAgICAgIHNlbGVjdG9yID0gX3JlZjJbX2pdO1xuICAgICAgICB0aGlzLmVsZW1lbnRzLnB1c2gobmV3IEVsZW1lbnRUcmFja2VyKHNlbGVjdG9yKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIEVsZW1lbnRNb25pdG9yO1xuXG4gIH0pKCk7XG5cbiAgRWxlbWVudFRyYWNrZXIgPSAoZnVuY3Rpb24oKSB7XG4gICAgZnVuY3Rpb24gRWxlbWVudFRyYWNrZXIoc2VsZWN0b3IpIHtcbiAgICAgIHRoaXMuc2VsZWN0b3IgPSBzZWxlY3RvcjtcbiAgICAgIHRoaXMucHJvZ3Jlc3MgPSAwO1xuICAgICAgdGhpcy5jaGVjaygpO1xuICAgIH1cblxuICAgIEVsZW1lbnRUcmFja2VyLnByb3RvdHlwZS5jaGVjayA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgIGlmIChkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHRoaXMuc2VsZWN0b3IpKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRvbmUoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KChmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gX3RoaXMuY2hlY2soKTtcbiAgICAgICAgfSksIG9wdGlvbnMuZWxlbWVudHMuY2hlY2tJbnRlcnZhbCk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIEVsZW1lbnRUcmFja2VyLnByb3RvdHlwZS5kb25lID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5wcm9ncmVzcyA9IDEwMDtcbiAgICB9O1xuXG4gICAgcmV0dXJuIEVsZW1lbnRUcmFja2VyO1xuXG4gIH0pKCk7XG5cbiAgRG9jdW1lbnRNb25pdG9yID0gKGZ1bmN0aW9uKCkge1xuICAgIERvY3VtZW50TW9uaXRvci5wcm90b3R5cGUuc3RhdGVzID0ge1xuICAgICAgbG9hZGluZzogMCxcbiAgICAgIGludGVyYWN0aXZlOiA1MCxcbiAgICAgIGNvbXBsZXRlOiAxMDBcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gRG9jdW1lbnRNb25pdG9yKCkge1xuICAgICAgdmFyIF9vbnJlYWR5c3RhdGVjaGFuZ2UsIF9yZWYyLFxuICAgICAgICBfdGhpcyA9IHRoaXM7XG4gICAgICB0aGlzLnByb2dyZXNzID0gKF9yZWYyID0gdGhpcy5zdGF0ZXNbZG9jdW1lbnQucmVhZHlTdGF0ZV0pICE9IG51bGwgPyBfcmVmMiA6IDEwMDtcbiAgICAgIF9vbnJlYWR5c3RhdGVjaGFuZ2UgPSBkb2N1bWVudC5vbnJlYWR5c3RhdGVjaGFuZ2U7XG4gICAgICBkb2N1bWVudC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKF90aGlzLnN0YXRlc1tkb2N1bWVudC5yZWFkeVN0YXRlXSAhPSBudWxsKSB7XG4gICAgICAgICAgX3RoaXMucHJvZ3Jlc3MgPSBfdGhpcy5zdGF0ZXNbZG9jdW1lbnQucmVhZHlTdGF0ZV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHR5cGVvZiBfb25yZWFkeXN0YXRlY2hhbmdlID09PSBcImZ1bmN0aW9uXCIgPyBfb25yZWFkeXN0YXRlY2hhbmdlLmFwcGx5KG51bGwsIGFyZ3VtZW50cykgOiB2b2lkIDA7XG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBEb2N1bWVudE1vbml0b3I7XG5cbiAgfSkoKTtcblxuICBFdmVudExhZ01vbml0b3IgPSAoZnVuY3Rpb24oKSB7XG4gICAgZnVuY3Rpb24gRXZlbnRMYWdNb25pdG9yKCkge1xuICAgICAgdmFyIGF2ZywgaW50ZXJ2YWwsIGxhc3QsIHBvaW50cywgc2FtcGxlcyxcbiAgICAgICAgX3RoaXMgPSB0aGlzO1xuICAgICAgdGhpcy5wcm9ncmVzcyA9IDA7XG4gICAgICBhdmcgPSAwO1xuICAgICAgc2FtcGxlcyA9IFtdO1xuICAgICAgcG9pbnRzID0gMDtcbiAgICAgIGxhc3QgPSBub3coKTtcbiAgICAgIGludGVydmFsID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBkaWZmO1xuICAgICAgICBkaWZmID0gbm93KCkgLSBsYXN0IC0gNTA7XG4gICAgICAgIGxhc3QgPSBub3coKTtcbiAgICAgICAgc2FtcGxlcy5wdXNoKGRpZmYpO1xuICAgICAgICBpZiAoc2FtcGxlcy5sZW5ndGggPiBvcHRpb25zLmV2ZW50TGFnLnNhbXBsZUNvdW50KSB7XG4gICAgICAgICAgc2FtcGxlcy5zaGlmdCgpO1xuICAgICAgICB9XG4gICAgICAgIGF2ZyA9IGF2Z0FtcGxpdHVkZShzYW1wbGVzKTtcbiAgICAgICAgaWYgKCsrcG9pbnRzID49IG9wdGlvbnMuZXZlbnRMYWcubWluU2FtcGxlcyAmJiBhdmcgPCBvcHRpb25zLmV2ZW50TGFnLmxhZ1RocmVzaG9sZCkge1xuICAgICAgICAgIF90aGlzLnByb2dyZXNzID0gMTAwO1xuICAgICAgICAgIHJldHVybiBjbGVhckludGVydmFsKGludGVydmFsKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gX3RoaXMucHJvZ3Jlc3MgPSAxMDAgKiAoMyAvIChhdmcgKyAzKSk7XG4gICAgICAgIH1cbiAgICAgIH0sIDUwKTtcbiAgICB9XG5cbiAgICByZXR1cm4gRXZlbnRMYWdNb25pdG9yO1xuXG4gIH0pKCk7XG5cbiAgU2NhbGVyID0gKGZ1bmN0aW9uKCkge1xuICAgIGZ1bmN0aW9uIFNjYWxlcihzb3VyY2UpIHtcbiAgICAgIHRoaXMuc291cmNlID0gc291cmNlO1xuICAgICAgdGhpcy5sYXN0ID0gdGhpcy5zaW5jZUxhc3RVcGRhdGUgPSAwO1xuICAgICAgdGhpcy5yYXRlID0gb3B0aW9ucy5pbml0aWFsUmF0ZTtcbiAgICAgIHRoaXMuY2F0Y2h1cCA9IDA7XG4gICAgICB0aGlzLnByb2dyZXNzID0gdGhpcy5sYXN0UHJvZ3Jlc3MgPSAwO1xuICAgICAgaWYgKHRoaXMuc291cmNlICE9IG51bGwpIHtcbiAgICAgICAgdGhpcy5wcm9ncmVzcyA9IHJlc3VsdCh0aGlzLnNvdXJjZSwgJ3Byb2dyZXNzJyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgU2NhbGVyLnByb3RvdHlwZS50aWNrID0gZnVuY3Rpb24oZnJhbWVUaW1lLCB2YWwpIHtcbiAgICAgIHZhciBzY2FsaW5nO1xuICAgICAgaWYgKHZhbCA9PSBudWxsKSB7XG4gICAgICAgIHZhbCA9IHJlc3VsdCh0aGlzLnNvdXJjZSwgJ3Byb2dyZXNzJyk7XG4gICAgICB9XG4gICAgICBpZiAodmFsID49IDEwMCkge1xuICAgICAgICB0aGlzLmRvbmUgPSB0cnVlO1xuICAgICAgfVxuICAgICAgaWYgKHZhbCA9PT0gdGhpcy5sYXN0KSB7XG4gICAgICAgIHRoaXMuc2luY2VMYXN0VXBkYXRlICs9IGZyYW1lVGltZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh0aGlzLnNpbmNlTGFzdFVwZGF0ZSkge1xuICAgICAgICAgIHRoaXMucmF0ZSA9ICh2YWwgLSB0aGlzLmxhc3QpIC8gdGhpcy5zaW5jZUxhc3RVcGRhdGU7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jYXRjaHVwID0gKHZhbCAtIHRoaXMucHJvZ3Jlc3MpIC8gb3B0aW9ucy5jYXRjaHVwVGltZTtcbiAgICAgICAgdGhpcy5zaW5jZUxhc3RVcGRhdGUgPSAwO1xuICAgICAgICB0aGlzLmxhc3QgPSB2YWw7XG4gICAgICB9XG4gICAgICBpZiAodmFsID4gdGhpcy5wcm9ncmVzcykge1xuICAgICAgICB0aGlzLnByb2dyZXNzICs9IHRoaXMuY2F0Y2h1cCAqIGZyYW1lVGltZTtcbiAgICAgIH1cbiAgICAgIHNjYWxpbmcgPSAxIC0gTWF0aC5wb3codGhpcy5wcm9ncmVzcyAvIDEwMCwgb3B0aW9ucy5lYXNlRmFjdG9yKTtcbiAgICAgIHRoaXMucHJvZ3Jlc3MgKz0gc2NhbGluZyAqIHRoaXMucmF0ZSAqIGZyYW1lVGltZTtcbiAgICAgIHRoaXMucHJvZ3Jlc3MgPSBNYXRoLm1pbih0aGlzLmxhc3RQcm9ncmVzcyArIG9wdGlvbnMubWF4UHJvZ3Jlc3NQZXJGcmFtZSwgdGhpcy5wcm9ncmVzcyk7XG4gICAgICB0aGlzLnByb2dyZXNzID0gTWF0aC5tYXgoMCwgdGhpcy5wcm9ncmVzcyk7XG4gICAgICB0aGlzLnByb2dyZXNzID0gTWF0aC5taW4oMTAwLCB0aGlzLnByb2dyZXNzKTtcbiAgICAgIHRoaXMubGFzdFByb2dyZXNzID0gdGhpcy5wcm9ncmVzcztcbiAgICAgIHJldHVybiB0aGlzLnByb2dyZXNzO1xuICAgIH07XG5cbiAgICByZXR1cm4gU2NhbGVyO1xuXG4gIH0pKCk7XG5cbiAgc291cmNlcyA9IG51bGw7XG5cbiAgc2NhbGVycyA9IG51bGw7XG5cbiAgYmFyID0gbnVsbDtcblxuICB1bmlTY2FsZXIgPSBudWxsO1xuXG4gIGFuaW1hdGlvbiA9IG51bGw7XG5cbiAgY2FuY2VsQW5pbWF0aW9uID0gbnVsbDtcblxuICBQYWNlLnJ1bm5pbmcgPSBmYWxzZTtcblxuICBoYW5kbGVQdXNoU3RhdGUgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAob3B0aW9ucy5yZXN0YXJ0T25QdXNoU3RhdGUpIHtcbiAgICAgIHJldHVybiBQYWNlLnJlc3RhcnQoKTtcbiAgICB9XG4gIH07XG5cbiAgaWYgKHdpbmRvdy5oaXN0b3J5LnB1c2hTdGF0ZSAhPSBudWxsKSB7XG4gICAgX3B1c2hTdGF0ZSA9IHdpbmRvdy5oaXN0b3J5LnB1c2hTdGF0ZTtcbiAgICB3aW5kb3cuaGlzdG9yeS5wdXNoU3RhdGUgPSBmdW5jdGlvbigpIHtcbiAgICAgIGhhbmRsZVB1c2hTdGF0ZSgpO1xuICAgICAgcmV0dXJuIF9wdXNoU3RhdGUuYXBwbHkod2luZG93Lmhpc3RvcnksIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgfVxuXG4gIGlmICh3aW5kb3cuaGlzdG9yeS5yZXBsYWNlU3RhdGUgIT0gbnVsbCkge1xuICAgIF9yZXBsYWNlU3RhdGUgPSB3aW5kb3cuaGlzdG9yeS5yZXBsYWNlU3RhdGU7XG4gICAgd2luZG93Lmhpc3RvcnkucmVwbGFjZVN0YXRlID0gZnVuY3Rpb24oKSB7XG4gICAgICBoYW5kbGVQdXNoU3RhdGUoKTtcbiAgICAgIHJldHVybiBfcmVwbGFjZVN0YXRlLmFwcGx5KHdpbmRvdy5oaXN0b3J5LCBhcmd1bWVudHMpO1xuICAgIH07XG4gIH1cblxuICBTT1VSQ0VfS0VZUyA9IHtcbiAgICBhamF4OiBBamF4TW9uaXRvcixcbiAgICBlbGVtZW50czogRWxlbWVudE1vbml0b3IsXG4gICAgZG9jdW1lbnQ6IERvY3VtZW50TW9uaXRvcixcbiAgICBldmVudExhZzogRXZlbnRMYWdNb25pdG9yXG4gIH07XG5cbiAgKGluaXQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdHlwZSwgX2osIF9rLCBfbGVuMSwgX2xlbjIsIF9yZWYyLCBfcmVmMywgX3JlZjQ7XG4gICAgUGFjZS5zb3VyY2VzID0gc291cmNlcyA9IFtdO1xuICAgIF9yZWYyID0gWydhamF4JywgJ2VsZW1lbnRzJywgJ2RvY3VtZW50JywgJ2V2ZW50TGFnJ107XG4gICAgZm9yIChfaiA9IDAsIF9sZW4xID0gX3JlZjIubGVuZ3RoOyBfaiA8IF9sZW4xOyBfaisrKSB7XG4gICAgICB0eXBlID0gX3JlZjJbX2pdO1xuICAgICAgaWYgKG9wdGlvbnNbdHlwZV0gIT09IGZhbHNlKSB7XG4gICAgICAgIHNvdXJjZXMucHVzaChuZXcgU09VUkNFX0tFWVNbdHlwZV0ob3B0aW9uc1t0eXBlXSkpO1xuICAgICAgfVxuICAgIH1cbiAgICBfcmVmNCA9IChfcmVmMyA9IG9wdGlvbnMuZXh0cmFTb3VyY2VzKSAhPSBudWxsID8gX3JlZjMgOiBbXTtcbiAgICBmb3IgKF9rID0gMCwgX2xlbjIgPSBfcmVmNC5sZW5ndGg7IF9rIDwgX2xlbjI7IF9rKyspIHtcbiAgICAgIHNvdXJjZSA9IF9yZWY0W19rXTtcbiAgICAgIHNvdXJjZXMucHVzaChuZXcgc291cmNlKG9wdGlvbnMpKTtcbiAgICB9XG4gICAgUGFjZS5iYXIgPSBiYXIgPSBuZXcgQmFyO1xuICAgIHNjYWxlcnMgPSBbXTtcbiAgICByZXR1cm4gdW5pU2NhbGVyID0gbmV3IFNjYWxlcjtcbiAgfSkoKTtcblxuICBQYWNlLnN0b3AgPSBmdW5jdGlvbigpIHtcbiAgICBQYWNlLnRyaWdnZXIoJ3N0b3AnKTtcbiAgICBQYWNlLnJ1bm5pbmcgPSBmYWxzZTtcbiAgICBiYXIuZGVzdHJveSgpO1xuICAgIGNhbmNlbEFuaW1hdGlvbiA9IHRydWU7XG4gICAgaWYgKGFuaW1hdGlvbiAhPSBudWxsKSB7XG4gICAgICBpZiAodHlwZW9mIGNhbmNlbEFuaW1hdGlvbkZyYW1lID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgY2FuY2VsQW5pbWF0aW9uRnJhbWUoYW5pbWF0aW9uKTtcbiAgICAgIH1cbiAgICAgIGFuaW1hdGlvbiA9IG51bGw7XG4gICAgfVxuICAgIHJldHVybiBpbml0KCk7XG4gIH07XG5cbiAgUGFjZS5yZXN0YXJ0ID0gZnVuY3Rpb24oKSB7XG4gICAgUGFjZS50cmlnZ2VyKCdyZXN0YXJ0Jyk7XG4gICAgUGFjZS5zdG9wKCk7XG4gICAgcmV0dXJuIFBhY2Uuc3RhcnQoKTtcbiAgfTtcblxuICBQYWNlLmdvID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHN0YXJ0O1xuICAgIFBhY2UucnVubmluZyA9IHRydWU7XG4gICAgYmFyLnJlbmRlcigpO1xuICAgIHN0YXJ0ID0gbm93KCk7XG4gICAgY2FuY2VsQW5pbWF0aW9uID0gZmFsc2U7XG4gICAgcmV0dXJuIGFuaW1hdGlvbiA9IHJ1bkFuaW1hdGlvbihmdW5jdGlvbihmcmFtZVRpbWUsIGVucXVldWVOZXh0RnJhbWUpIHtcbiAgICAgIHZhciBhdmcsIGNvdW50LCBkb25lLCBlbGVtZW50LCBlbGVtZW50cywgaSwgaiwgcmVtYWluaW5nLCBzY2FsZXIsIHNjYWxlckxpc3QsIHN1bSwgX2osIF9rLCBfbGVuMSwgX2xlbjIsIF9yZWYyO1xuICAgICAgcmVtYWluaW5nID0gMTAwIC0gYmFyLnByb2dyZXNzO1xuICAgICAgY291bnQgPSBzdW0gPSAwO1xuICAgICAgZG9uZSA9IHRydWU7XG4gICAgICBmb3IgKGkgPSBfaiA9IDAsIF9sZW4xID0gc291cmNlcy5sZW5ndGg7IF9qIDwgX2xlbjE7IGkgPSArK19qKSB7XG4gICAgICAgIHNvdXJjZSA9IHNvdXJjZXNbaV07XG4gICAgICAgIHNjYWxlckxpc3QgPSBzY2FsZXJzW2ldICE9IG51bGwgPyBzY2FsZXJzW2ldIDogc2NhbGVyc1tpXSA9IFtdO1xuICAgICAgICBlbGVtZW50cyA9IChfcmVmMiA9IHNvdXJjZS5lbGVtZW50cykgIT0gbnVsbCA/IF9yZWYyIDogW3NvdXJjZV07XG4gICAgICAgIGZvciAoaiA9IF9rID0gMCwgX2xlbjIgPSBlbGVtZW50cy5sZW5ndGg7IF9rIDwgX2xlbjI7IGogPSArK19rKSB7XG4gICAgICAgICAgZWxlbWVudCA9IGVsZW1lbnRzW2pdO1xuICAgICAgICAgIHNjYWxlciA9IHNjYWxlckxpc3Rbal0gIT0gbnVsbCA/IHNjYWxlckxpc3Rbal0gOiBzY2FsZXJMaXN0W2pdID0gbmV3IFNjYWxlcihlbGVtZW50KTtcbiAgICAgICAgICBkb25lICY9IHNjYWxlci5kb25lO1xuICAgICAgICAgIGlmIChzY2FsZXIuZG9uZSkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvdW50Kys7XG4gICAgICAgICAgc3VtICs9IHNjYWxlci50aWNrKGZyYW1lVGltZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGF2ZyA9IHN1bSAvIGNvdW50O1xuICAgICAgYmFyLnVwZGF0ZSh1bmlTY2FsZXIudGljayhmcmFtZVRpbWUsIGF2ZykpO1xuICAgICAgaWYgKGJhci5kb25lKCkgfHwgZG9uZSB8fCBjYW5jZWxBbmltYXRpb24pIHtcbiAgICAgICAgYmFyLnVwZGF0ZSgxMDApO1xuICAgICAgICBQYWNlLnRyaWdnZXIoJ2RvbmUnKTtcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgYmFyLmZpbmlzaCgpO1xuICAgICAgICAgIFBhY2UucnVubmluZyA9IGZhbHNlO1xuICAgICAgICAgIHJldHVybiBQYWNlLnRyaWdnZXIoJ2hpZGUnKTtcbiAgICAgICAgfSwgTWF0aC5tYXgob3B0aW9ucy5naG9zdFRpbWUsIE1hdGgubWF4KG9wdGlvbnMubWluVGltZSAtIChub3coKSAtIHN0YXJ0KSwgMCkpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBlbnF1ZXVlTmV4dEZyYW1lKCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH07XG5cbiAgUGFjZS5zdGFydCA9IGZ1bmN0aW9uKF9vcHRpb25zKSB7XG4gICAgZXh0ZW5kKG9wdGlvbnMsIF9vcHRpb25zKTtcbiAgICBQYWNlLnJ1bm5pbmcgPSB0cnVlO1xuICAgIHRyeSB7XG4gICAgICBiYXIucmVuZGVyKCk7XG4gICAgfSBjYXRjaCAoX2Vycm9yKSB7XG4gICAgICBOb1RhcmdldEVycm9yID0gX2Vycm9yO1xuICAgIH1cbiAgICBpZiAoIWRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5wYWNlJykpIHtcbiAgICAgIHJldHVybiBzZXRUaW1lb3V0KFBhY2Uuc3RhcnQsIDUwKTtcbiAgICB9IGVsc2Uge1xuICAgICAgUGFjZS50cmlnZ2VyKCdzdGFydCcpO1xuICAgICAgcmV0dXJuIFBhY2UuZ28oKTtcbiAgICB9XG4gIH07XG5cbiAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgIGRlZmluZShbJ3BhY2UnXSwgZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gUGFjZTtcbiAgICB9KTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IFBhY2U7XG4gIH0gZWxzZSB7XG4gICAgaWYgKG9wdGlvbnMuc3RhcnRPblBhZ2VMb2FkKSB7XG4gICAgICBQYWNlLnN0YXJ0KCk7XG4gICAgfVxuICB9XG5cbn0pLmNhbGwodGhpcyk7XG4iLCJqUXVlcnkoZnVuY3Rpb24oJCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIC8vIEZsZXh5IGhlYWRlclxuICAgIGZsZXh5X2hlYWRlci5pbml0KCk7XG5cbiAgICAkKCcuc2lkci10b2dnbGUtLXJpZ2h0Jykuc2lkcih7XG4gICAgICAgIG5hbWU6ICdzaWRyLW1haW4nLFxuICAgICAgICBzaWRlOiAncmlnaHQnLFxuICAgICAgICByZW5hbWluZzogZmFsc2UsXG4gICAgICAgIGJvZHk6ICcubGF5b3V0X193cmFwcGVyJyxcbiAgICAgICAgc291cmNlOiAnLnNpZHItc291cmNlLXByb3ZpZGVyJ1xuICAgIH0pO1xuXG4gICAgLy8gRW5hYmxlIC8gZGlzYWJsZSBCb290c3RyYXAgdG9vbHRpcHMsIGJhc2VkIHVwb24gdG91Y2ggZXZlbnRzXG4gICAgaWYoTW9kZXJuaXpyLnRvdWNoZXZlbnRzKSB7XG4gICAgICAgICQoJ1tkYXRhLXRvZ2dsZT1cInRvb2x0aXBcIl0nKS50b29sdGlwKCdoaWRlJyk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICAkKCdbZGF0YS10b2dnbGU9XCJ0b29sdGlwXCJdJykudG9vbHRpcCgpO1xuICAgIH1cblxuICAgIC8vIFBvcHB5IChwb3BvdmVycykuXG4gICAgJCgnLnBvcHB5LXRvZ2dsZScpLm9uKCdjbGljaycsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHZhciAkZWxlbWVudCA9ICQodGhpcyk7XG4gICAgICAgIHZhciAkcGFyZW50ID0gJGVsZW1lbnQucGFyZW50cygnLnBvcHB5Jyk7XG5cbiAgICAgICAgLy8gTWFrZSBzdXJlIHRoYXQgbm8gb3RoZXIgXCJwb3BweXNcIiBhcmUgb3Blbi5cbiAgICAgICAgJCgnLnBvcHB5LS1vcGVuJylcbiAgICAgICAgICAgIC5ub3QoJHBhcmVudClcbiAgICAgICAgICAgIC5yZW1vdmVDbGFzcygncG9wcHktLW9wZW4nKTtcblxuICAgICAgICAvLyBUb2dnbGUgdGhlIGNsYXNzIG9uIHRoaXMgZWxlbWVudC5cbiAgICAgICAgJHBhcmVudC50b2dnbGVDbGFzcygncG9wcHktLW9wZW4nKTtcbiAgICB9KTtcbiAgICAkKCcucG9wcHknKS5vbignY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH0pO1xuICAgICQoJ2JvZHknKS5vbignY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAkKCcucG9wcHktLW9wZW4nKS5yZW1vdmVDbGFzcygncG9wcHktLW9wZW4nKTtcbiAgICB9KTtcblxuICAgIC8vIEFqYXhpIGNsaWNrIGxvYWRlci5cbiAgICAkKCdbZGF0YS1hamF4aS1zb3VyY2VdJykub24oJ2NsaWNrJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyICRlbGVtZW50ID0gJCh0aGlzKTtcbiAgICAgICAgdmFyIHRhcmdldCA9ICRlbGVtZW50LmF0dHIoJ2RhdGEtYWpheGktdGFyZ2V0Jyk7XG4gICAgICAgIHZhciBzb3VyY2UgPSAkZWxlbWVudC5hdHRyKCdkYXRhLWFqYXhpLXNvdXJjZScpO1xuICAgICAgICB2YXIgbG9hZGluZyA9ICRlbGVtZW50LmF0dHIoJ2RhdGEtYWpheGktbG9hZGluZycpO1xuXG4gICAgICAgIC8vIFNldCBsb2FkaW5nIHRleHQuXG4gICAgICAgICQodGFyZ2V0KS5odG1sKGxvYWRpbmcpO1xuXG4gICAgICAgIC8vIExvYWQgZXh0ZXJuYWwgY29udGVudC5cbiAgICAgICAgJCh0YXJnZXQpLmxvYWQoc291cmNlKTtcbiAgICB9KTtcblxuICAgIC8vIE1ldHRpbmcgYWdlbmRhIGJ1bGxldHBvaW50cyBjb2xsYXBzZSB0b2dnbGUgY2FsbGJhY2suXG4gICAgJCgnI21lZXRpbmctYWdlbmRhLWNvbGxhcHNlLXRvZ2dsZScpLm9uKCdjbGljaycsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICQoJy5hcmVhLWV4cGFuZC1jb2xsYXBzZScpLmNvbGxhcHNlKCd0b2dnbGUnKTtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB9KTtcblxuICAgIC8vIEJ1bGxldCBwb2ludCBjb2xsYXBzZSB0b2dnbGUgY2FsbGJhY2suXG4gICAgJCgnLmJ1bGxldC1wb2ludC10b2dnbGUnKS5vbignY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgJHdyYXBwZXIgPSAkKHRoaXMpLnBhcmVudHMoJ2FydGljbGU6Zmlyc3QnKTtcbiAgICAgICAgJHdyYXBwZXIuZmluZCgnLmFyZWEtZXhwYW5kLWNvbGxhcHNlJykuY29sbGFwc2UoJ3RvZ2dsZScpO1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH0pO1xufSk7XG4iXX0=
