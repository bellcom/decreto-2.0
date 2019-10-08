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

var toggleAllButtons = document.querySelectorAll('.js-bulletpoint-toggle-all');
var toggleBulletpointButtons = document.querySelectorAll('.js-bulletpoint-toggle-bulletpoint');
var toggleAttachmentsButtons = document.querySelectorAll('.js-bulletpoint-toggle-attachments');

// Toggle all.
var _iteratorNormalCompletion = true;
var _didIteratorError = false;
var _iteratorError = undefined;

try {
  for (var _iterator = toggleAllButtons[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
    var toggleAllButton = _step.value;

    toggleAllButton.addEventListener('click', handleToggleAll);
  }
} catch (err) {
  _didIteratorError = true;
  _iteratorError = err;
} finally {
  try {
    if (!_iteratorNormalCompletion && _iterator.return) {
      _iterator.return();
    }
  } finally {
    if (_didIteratorError) {
      throw _iteratorError;
    }
  }
}

function handleToggleAll(event) {
  event.preventDefault();

  var bulletpoints = document.getElementsByClassName('bulletpoint');
  var currentState = toggleAllButton.dataset.currentState;

  if (currentState === 'open') {
    toggleAllButton.dataset.currentState = 'closed';

    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = bulletpoints[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var bulletpoint = _step2.value;

        bulletpoint.classList.remove('bulletpoint--open');
      }
    } catch (err) {
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2.return) {
          _iterator2.return();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
      }
    }
  } else {
    toggleAllButton.dataset.currentState = 'open';

    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
      for (var _iterator3 = bulletpoints[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
        var bulletpoint = _step3.value;

        bulletpoint.classList.add('bulletpoint--open');
      }
    } catch (err) {
      _didIteratorError3 = true;
      _iteratorError3 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion3 && _iterator3.return) {
          _iterator3.return();
        }
      } finally {
        if (_didIteratorError3) {
          throw _iteratorError3;
        }
      }
    }
  }
}

// Toggle attachments.
var _iteratorNormalCompletion4 = true;
var _didIteratorError4 = false;
var _iteratorError4 = undefined;

try {
  for (var _iterator4 = toggleAttachmentsButtons[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
    var toggleAttachmentButton = _step4.value;

    toggleAttachmentButton.addEventListener('click', handleToggleAttachments);
  }
} catch (err) {
  _didIteratorError4 = true;
  _iteratorError4 = err;
} finally {
  try {
    if (!_iteratorNormalCompletion4 && _iterator4.return) {
      _iterator4.return();
    }
  } finally {
    if (_didIteratorError4) {
      throw _iteratorError4;
    }
  }
}

function handleToggleAttachments(event) {
  event.preventDefault();

  var element = this;
  var parent = element.closest('.bulletpoint');

  parent.classList.toggle('bulletpoint--open');

  // Run through attachments and toggle them.
  var attachments = parent.querySelectorAll('.bulletpoint--attachment');

  if (parent.classList.contains('bulletpoint--open')) {
    var _iteratorNormalCompletion5 = true;
    var _didIteratorError5 = false;
    var _iteratorError5 = undefined;

    try {
      for (var _iterator5 = attachments[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
        var attachment = _step5.value;

        attachment.classList.add('bulletpoint--open');
      }
    } catch (err) {
      _didIteratorError5 = true;
      _iteratorError5 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion5 && _iterator5.return) {
          _iterator5.return();
        }
      } finally {
        if (_didIteratorError5) {
          throw _iteratorError5;
        }
      }
    }
  } else {
    var _iteratorNormalCompletion6 = true;
    var _didIteratorError6 = false;
    var _iteratorError6 = undefined;

    try {
      for (var _iterator6 = attachments[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
        var attachment = _step6.value;

        attachment.classList.remove('bulletpoint--open');
      }
    } catch (err) {
      _didIteratorError6 = true;
      _iteratorError6 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion6 && _iterator6.return) {
          _iterator6.return();
        }
      } finally {
        if (_didIteratorError6) {
          throw _iteratorError6;
        }
      }
    }
  }
}

// Toggle bulletpoint.
var _iteratorNormalCompletion7 = true;
var _didIteratorError7 = false;
var _iteratorError7 = undefined;

try {
  for (var _iterator7 = toggleBulletpointButtons[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
    var toggleBulletpointButton = _step7.value;

    toggleBulletpointButton.addEventListener('click', handleToggleBulletpoint);
  }
} catch (err) {
  _didIteratorError7 = true;
  _iteratorError7 = err;
} finally {
  try {
    if (!_iteratorNormalCompletion7 && _iterator7.return) {
      _iterator7.return();
    }
  } finally {
    if (_didIteratorError7) {
      throw _iteratorError7;
    }
  }
}

function handleToggleBulletpoint(event) {
  event.preventDefault();

  var element = this;
  var parent = element.closest('.bulletpoint');

  parent.classList.toggle('bulletpoint--open');
}
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

  // Enable tooltips.
  $('[data-toggle="tooltip"]').tooltip();

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

  // Switch mode toggle callback.
  $('#meeting-agenda-switch-mode-toggle').on('click', function (event) {
    $('#agenda-overview').toggleClass('hidden');
    $('#agenda-item-reorder').toggleClass('hidden');

    // Resetting search.
    $('.bulletpoint').removeClass('hidden');
    $('form.decreto-content-modify-search-in-meeting-form input').val('');

    // Toggle search enabled.
    if ($('#agenda-overview').hasClass('hidden')) {
      $('form.decreto-content-modify-search-in-meeting-form input').attr('disabled', 'disabled');
    } else {
      $('form.decreto-content-modify-search-in-meeting-form input').removeAttr('disabled');
    }

    event.preventDefault();
  });
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImJvb3RzdHJhcC5qcyIsImZsZXh5LWhlYWRlci5qcyIsImZsZXh5LW5hdmlnYXRpb24uanMiLCJqcXVlcnkuc2lkci5qcyIsInBhY2UuanMiLCJidWxsZXRwb2ludC5qcyIsImFwcC5qcyJdLCJuYW1lcyI6WyJqUXVlcnkiLCJFcnJvciIsIiQiLCJ2ZXJzaW9uIiwiZm4iLCJqcXVlcnkiLCJzcGxpdCIsInRyYW5zaXRpb25FbmQiLCJlbCIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsInRyYW5zRW5kRXZlbnROYW1lcyIsIldlYmtpdFRyYW5zaXRpb24iLCJNb3pUcmFuc2l0aW9uIiwiT1RyYW5zaXRpb24iLCJ0cmFuc2l0aW9uIiwibmFtZSIsInN0eWxlIiwidW5kZWZpbmVkIiwiZW5kIiwiZW11bGF0ZVRyYW5zaXRpb25FbmQiLCJkdXJhdGlvbiIsImNhbGxlZCIsIiRlbCIsIm9uZSIsImNhbGxiYWNrIiwidHJpZ2dlciIsInN1cHBvcnQiLCJzZXRUaW1lb3V0IiwiZXZlbnQiLCJzcGVjaWFsIiwiYnNUcmFuc2l0aW9uRW5kIiwiYmluZFR5cGUiLCJkZWxlZ2F0ZVR5cGUiLCJoYW5kbGUiLCJlIiwidGFyZ2V0IiwiaXMiLCJoYW5kbGVPYmoiLCJoYW5kbGVyIiwiYXBwbHkiLCJhcmd1bWVudHMiLCJkaXNtaXNzIiwiQWxlcnQiLCJvbiIsImNsb3NlIiwiVkVSU0lPTiIsIlRSQU5TSVRJT05fRFVSQVRJT04iLCJwcm90b3R5cGUiLCIkdGhpcyIsInNlbGVjdG9yIiwiYXR0ciIsInJlcGxhY2UiLCIkcGFyZW50IiwiZmluZCIsInByZXZlbnREZWZhdWx0IiwibGVuZ3RoIiwiY2xvc2VzdCIsIkV2ZW50IiwiaXNEZWZhdWx0UHJldmVudGVkIiwicmVtb3ZlQ2xhc3MiLCJyZW1vdmVFbGVtZW50IiwiZGV0YWNoIiwicmVtb3ZlIiwiaGFzQ2xhc3MiLCJQbHVnaW4iLCJvcHRpb24iLCJlYWNoIiwiZGF0YSIsImNhbGwiLCJvbGQiLCJhbGVydCIsIkNvbnN0cnVjdG9yIiwibm9Db25mbGljdCIsIkJ1dHRvbiIsImVsZW1lbnQiLCJvcHRpb25zIiwiJGVsZW1lbnQiLCJleHRlbmQiLCJERUZBVUxUUyIsImlzTG9hZGluZyIsImxvYWRpbmdUZXh0Iiwic2V0U3RhdGUiLCJzdGF0ZSIsImQiLCJ2YWwiLCJyZXNldFRleHQiLCJwcm94eSIsImFkZENsYXNzIiwicHJvcCIsInJlbW92ZUF0dHIiLCJ0b2dnbGUiLCJjaGFuZ2VkIiwiJGlucHV0IiwidG9nZ2xlQ2xhc3MiLCJidXR0b24iLCIkYnRuIiwiZmlyc3QiLCJ0ZXN0IiwidHlwZSIsIkNhcm91c2VsIiwiJGluZGljYXRvcnMiLCJwYXVzZWQiLCJzbGlkaW5nIiwiaW50ZXJ2YWwiLCIkYWN0aXZlIiwiJGl0ZW1zIiwia2V5Ym9hcmQiLCJrZXlkb3duIiwicGF1c2UiLCJkb2N1bWVudEVsZW1lbnQiLCJjeWNsZSIsIndyYXAiLCJ0YWdOYW1lIiwid2hpY2giLCJwcmV2IiwibmV4dCIsImNsZWFySW50ZXJ2YWwiLCJzZXRJbnRlcnZhbCIsImdldEl0ZW1JbmRleCIsIml0ZW0iLCJwYXJlbnQiLCJjaGlsZHJlbiIsImluZGV4IiwiZ2V0SXRlbUZvckRpcmVjdGlvbiIsImRpcmVjdGlvbiIsImFjdGl2ZSIsImFjdGl2ZUluZGV4Iiwid2lsbFdyYXAiLCJkZWx0YSIsIml0ZW1JbmRleCIsImVxIiwidG8iLCJwb3MiLCJ0aGF0Iiwic2xpZGUiLCIkbmV4dCIsImlzQ3ljbGluZyIsInJlbGF0ZWRUYXJnZXQiLCJzbGlkZUV2ZW50IiwiJG5leHRJbmRpY2F0b3IiLCJzbGlkRXZlbnQiLCJvZmZzZXRXaWR0aCIsImpvaW4iLCJhY3Rpb24iLCJjYXJvdXNlbCIsImNsaWNrSGFuZGxlciIsImhyZWYiLCIkdGFyZ2V0Iiwic2xpZGVJbmRleCIsIndpbmRvdyIsIiRjYXJvdXNlbCIsIkNvbGxhcHNlIiwiJHRyaWdnZXIiLCJpZCIsInRyYW5zaXRpb25pbmciLCJnZXRQYXJlbnQiLCJhZGRBcmlhQW5kQ29sbGFwc2VkQ2xhc3MiLCJkaW1lbnNpb24iLCJoYXNXaWR0aCIsInNob3ciLCJhY3RpdmVzRGF0YSIsImFjdGl2ZXMiLCJzdGFydEV2ZW50IiwiY29tcGxldGUiLCJzY3JvbGxTaXplIiwiY2FtZWxDYXNlIiwiaGlkZSIsIm9mZnNldEhlaWdodCIsImkiLCJnZXRUYXJnZXRGcm9tVHJpZ2dlciIsImlzT3BlbiIsImNvbGxhcHNlIiwiYmFja2Ryb3AiLCJEcm9wZG93biIsImNsZWFyTWVudXMiLCJjb250YWlucyIsImlzQWN0aXZlIiwiaW5zZXJ0QWZ0ZXIiLCJzdG9wUHJvcGFnYXRpb24iLCJkZXNjIiwiZHJvcGRvd24iLCJNb2RhbCIsIiRib2R5IiwiYm9keSIsIiRkaWFsb2ciLCIkYmFja2Ryb3AiLCJpc1Nob3duIiwib3JpZ2luYWxCb2R5UGFkIiwic2Nyb2xsYmFyV2lkdGgiLCJpZ25vcmVCYWNrZHJvcENsaWNrIiwiZml4ZWRDb250ZW50IiwicmVtb3RlIiwibG9hZCIsIkJBQ0tEUk9QX1RSQU5TSVRJT05fRFVSQVRJT04iLCJfcmVsYXRlZFRhcmdldCIsImNoZWNrU2Nyb2xsYmFyIiwic2V0U2Nyb2xsYmFyIiwiZXNjYXBlIiwicmVzaXplIiwiYXBwZW5kVG8iLCJzY3JvbGxUb3AiLCJhZGp1c3REaWFsb2ciLCJlbmZvcmNlRm9jdXMiLCJvZmYiLCJoaWRlTW9kYWwiLCJoYXMiLCJoYW5kbGVVcGRhdGUiLCJyZXNldEFkanVzdG1lbnRzIiwicmVzZXRTY3JvbGxiYXIiLCJyZW1vdmVCYWNrZHJvcCIsImFuaW1hdGUiLCJkb0FuaW1hdGUiLCJjdXJyZW50VGFyZ2V0IiwiZm9jdXMiLCJjYWxsYmFja1JlbW92ZSIsIm1vZGFsSXNPdmVyZmxvd2luZyIsInNjcm9sbEhlaWdodCIsImNsaWVudEhlaWdodCIsImNzcyIsInBhZGRpbmdMZWZ0IiwiYm9keUlzT3ZlcmZsb3dpbmciLCJwYWRkaW5nUmlnaHQiLCJmdWxsV2luZG93V2lkdGgiLCJpbm5lcldpZHRoIiwiZG9jdW1lbnRFbGVtZW50UmVjdCIsImdldEJvdW5kaW5nQ2xpZW50UmVjdCIsInJpZ2h0IiwiTWF0aCIsImFicyIsImxlZnQiLCJjbGllbnRXaWR0aCIsIm1lYXN1cmVTY3JvbGxiYXIiLCJib2R5UGFkIiwicGFyc2VJbnQiLCJhY3R1YWxQYWRkaW5nIiwiY2FsY3VsYXRlZFBhZGRpbmciLCJwYXJzZUZsb2F0IiwicGFkZGluZyIsInJlbW92ZURhdGEiLCJzY3JvbGxEaXYiLCJjbGFzc05hbWUiLCJhcHBlbmQiLCJyZW1vdmVDaGlsZCIsIm1vZGFsIiwic2hvd0V2ZW50IiwiRElTQUxMT1dFRF9BVFRSSUJVVEVTIiwidXJpQXR0cnMiLCJBUklBX0FUVFJJQlVURV9QQVRURVJOIiwiRGVmYXVsdFdoaXRlbGlzdCIsImEiLCJhcmVhIiwiYiIsImJyIiwiY29sIiwiY29kZSIsImRpdiIsImVtIiwiaHIiLCJoMSIsImgyIiwiaDMiLCJoNCIsImg1IiwiaDYiLCJpbWciLCJsaSIsIm9sIiwicCIsInByZSIsInMiLCJzbWFsbCIsInNwYW4iLCJzdWIiLCJzdXAiLCJzdHJvbmciLCJ1IiwidWwiLCJTQUZFX1VSTF9QQVRURVJOIiwiREFUQV9VUkxfUEFUVEVSTiIsImFsbG93ZWRBdHRyaWJ1dGUiLCJhbGxvd2VkQXR0cmlidXRlTGlzdCIsImF0dHJOYW1lIiwibm9kZU5hbWUiLCJ0b0xvd2VyQ2FzZSIsImluQXJyYXkiLCJCb29sZWFuIiwibm9kZVZhbHVlIiwibWF0Y2giLCJyZWdFeHAiLCJmaWx0ZXIiLCJ2YWx1ZSIsIlJlZ0V4cCIsImwiLCJzYW5pdGl6ZUh0bWwiLCJ1bnNhZmVIdG1sIiwid2hpdGVMaXN0Iiwic2FuaXRpemVGbiIsImltcGxlbWVudGF0aW9uIiwiY3JlYXRlSFRNTERvY3VtZW50IiwiY3JlYXRlZERvY3VtZW50IiwiaW5uZXJIVE1MIiwid2hpdGVsaXN0S2V5cyIsIm1hcCIsImVsZW1lbnRzIiwibGVuIiwiZWxOYW1lIiwicGFyZW50Tm9kZSIsImF0dHJpYnV0ZUxpc3QiLCJhdHRyaWJ1dGVzIiwid2hpdGVsaXN0ZWRBdHRyaWJ1dGVzIiwiY29uY2F0IiwiaiIsImxlbjIiLCJyZW1vdmVBdHRyaWJ1dGUiLCJUb29sdGlwIiwiZW5hYmxlZCIsInRpbWVvdXQiLCJob3ZlclN0YXRlIiwiaW5TdGF0ZSIsImluaXQiLCJhbmltYXRpb24iLCJwbGFjZW1lbnQiLCJ0ZW1wbGF0ZSIsInRpdGxlIiwiZGVsYXkiLCJodG1sIiwiY29udGFpbmVyIiwidmlld3BvcnQiLCJzYW5pdGl6ZSIsImdldE9wdGlvbnMiLCIkdmlld3BvcnQiLCJpc0Z1bmN0aW9uIiwiY2xpY2siLCJob3ZlciIsImNvbnN0cnVjdG9yIiwidHJpZ2dlcnMiLCJldmVudEluIiwiZXZlbnRPdXQiLCJlbnRlciIsImxlYXZlIiwiX29wdGlvbnMiLCJmaXhUaXRsZSIsImdldERlZmF1bHRzIiwiZGF0YUF0dHJpYnV0ZXMiLCJkYXRhQXR0ciIsImhhc093blByb3BlcnR5IiwiZ2V0RGVsZWdhdGVPcHRpb25zIiwiZGVmYXVsdHMiLCJrZXkiLCJvYmoiLCJzZWxmIiwidGlwIiwiY2xlYXJUaW1lb3V0IiwiaXNJblN0YXRlVHJ1ZSIsImhhc0NvbnRlbnQiLCJpbkRvbSIsIm93bmVyRG9jdW1lbnQiLCIkdGlwIiwidGlwSWQiLCJnZXRVSUQiLCJzZXRDb250ZW50IiwiYXV0b1Rva2VuIiwiYXV0b1BsYWNlIiwidG9wIiwiZGlzcGxheSIsImdldFBvc2l0aW9uIiwiYWN0dWFsV2lkdGgiLCJhY3R1YWxIZWlnaHQiLCJvcmdQbGFjZW1lbnQiLCJ2aWV3cG9ydERpbSIsImJvdHRvbSIsIndpZHRoIiwiY2FsY3VsYXRlZE9mZnNldCIsImdldENhbGN1bGF0ZWRPZmZzZXQiLCJhcHBseVBsYWNlbWVudCIsInByZXZIb3ZlclN0YXRlIiwib2Zmc2V0IiwiaGVpZ2h0IiwibWFyZ2luVG9wIiwibWFyZ2luTGVmdCIsImlzTmFOIiwic2V0T2Zmc2V0IiwidXNpbmciLCJwcm9wcyIsInJvdW5kIiwiZ2V0Vmlld3BvcnRBZGp1c3RlZERlbHRhIiwiaXNWZXJ0aWNhbCIsImFycm93RGVsdGEiLCJhcnJvd09mZnNldFBvc2l0aW9uIiwicmVwbGFjZUFycm93IiwiYXJyb3ciLCJnZXRUaXRsZSIsInRleHQiLCIkZSIsImlzQm9keSIsImVsUmVjdCIsImlzU3ZnIiwiU1ZHRWxlbWVudCIsImVsT2Zmc2V0Iiwic2Nyb2xsIiwib3V0ZXJEaW1zIiwidmlld3BvcnRQYWRkaW5nIiwidmlld3BvcnREaW1lbnNpb25zIiwidG9wRWRnZU9mZnNldCIsImJvdHRvbUVkZ2VPZmZzZXQiLCJsZWZ0RWRnZU9mZnNldCIsInJpZ2h0RWRnZU9mZnNldCIsIm8iLCJwcmVmaXgiLCJyYW5kb20iLCJnZXRFbGVtZW50QnlJZCIsIiRhcnJvdyIsImVuYWJsZSIsImRpc2FibGUiLCJ0b2dnbGVFbmFibGVkIiwiZGVzdHJveSIsInRvb2x0aXAiLCJQb3BvdmVyIiwiY29udGVudCIsImdldENvbnRlbnQiLCJ0eXBlQ29udGVudCIsInBvcG92ZXIiLCJTY3JvbGxTcHkiLCIkc2Nyb2xsRWxlbWVudCIsIm9mZnNldHMiLCJ0YXJnZXRzIiwiYWN0aXZlVGFyZ2V0IiwicHJvY2VzcyIsInJlZnJlc2giLCJnZXRTY3JvbGxIZWlnaHQiLCJtYXgiLCJvZmZzZXRNZXRob2QiLCJvZmZzZXRCYXNlIiwiaXNXaW5kb3ciLCIkaHJlZiIsInNvcnQiLCJwdXNoIiwibWF4U2Nyb2xsIiwiYWN0aXZhdGUiLCJjbGVhciIsInBhcmVudHMiLCJwYXJlbnRzVW50aWwiLCJzY3JvbGxzcHkiLCIkc3B5IiwiVGFiIiwiJHVsIiwiJHByZXZpb3VzIiwiaGlkZUV2ZW50IiwidGFiIiwiQWZmaXgiLCJjaGVja1Bvc2l0aW9uIiwiY2hlY2tQb3NpdGlvbldpdGhFdmVudExvb3AiLCJhZmZpeGVkIiwidW5waW4iLCJwaW5uZWRPZmZzZXQiLCJSRVNFVCIsImdldFN0YXRlIiwib2Zmc2V0VG9wIiwib2Zmc2V0Qm90dG9tIiwicG9zaXRpb24iLCJ0YXJnZXRIZWlnaHQiLCJpbml0aWFsaXppbmciLCJjb2xsaWRlclRvcCIsImNvbGxpZGVySGVpZ2h0IiwiZ2V0UGlubmVkT2Zmc2V0IiwiYWZmaXgiLCJhZmZpeFR5cGUiLCJmbGV4eV9oZWFkZXIiLCJwdWIiLCIkaGVhZGVyX3N0YXRpYyIsIiRoZWFkZXJfc3RpY2t5IiwidXBkYXRlX2ludGVydmFsIiwidG9sZXJhbmNlIiwidXB3YXJkIiwiZG93bndhcmQiLCJfZ2V0X29mZnNldF9mcm9tX2VsZW1lbnRzX2JvdHRvbSIsImNsYXNzZXMiLCJwaW5uZWQiLCJ1bnBpbm5lZCIsIndhc19zY3JvbGxlZCIsImxhc3RfZGlzdGFuY2VfZnJvbV90b3AiLCJyZWdpc3RlckV2ZW50SGFuZGxlcnMiLCJyZWdpc3RlckJvb3RFdmVudEhhbmRsZXJzIiwiZG9jdW1lbnRfd2FzX3Njcm9sbGVkIiwiZWxlbWVudF9oZWlnaHQiLCJvdXRlckhlaWdodCIsImVsZW1lbnRfb2Zmc2V0IiwiY3VycmVudF9kaXN0YW5jZV9mcm9tX3RvcCIsImZsZXh5X25hdmlnYXRpb24iLCJsYXlvdXRfY2xhc3NlcyIsInVwZ3JhZGUiLCIkbmF2aWdhdGlvbnMiLCJuYXZpZ2F0aW9uIiwiJG5hdmlnYXRpb24iLCIkbWVnYW1lbnVzIiwiZHJvcGRvd25fbWVnYW1lbnUiLCIkZHJvcGRvd25fbWVnYW1lbnUiLCJkcm9wZG93bl9oYXNfbWVnYW1lbnUiLCJpc191cGdyYWRlZCIsIm5hdmlnYXRpb25faGFzX21lZ2FtZW51IiwiJG1lZ2FtZW51IiwiaGFzX29iZnVzY2F0b3IiLCJvYmZ1c2NhdG9yIiwiYmFiZWxIZWxwZXJzIiwiY2xhc3NDYWxsQ2hlY2siLCJpbnN0YW5jZSIsIlR5cGVFcnJvciIsImNyZWF0ZUNsYXNzIiwiZGVmaW5lUHJvcGVydGllcyIsImRlc2NyaXB0b3IiLCJlbnVtZXJhYmxlIiwiY29uZmlndXJhYmxlIiwid3JpdGFibGUiLCJPYmplY3QiLCJkZWZpbmVQcm9wZXJ0eSIsInByb3RvUHJvcHMiLCJzdGF0aWNQcm9wcyIsInNpZHJTdGF0dXMiLCJtb3ZpbmciLCJvcGVuZWQiLCJoZWxwZXIiLCJpc1VybCIsInN0ciIsInBhdHRlcm4iLCJhZGRQcmVmaXhlcyIsImFkZFByZWZpeCIsImF0dHJpYnV0ZSIsInRvUmVwbGFjZSIsInRyYW5zaXRpb25zIiwic3VwcG9ydGVkIiwicHJvcGVydHkiLCJwcmVmaXhlcyIsImNoYXJBdCIsInRvVXBwZXJDYXNlIiwic3Vic3RyIiwiJCQyIiwiYm9keUFuaW1hdGlvbkNsYXNzIiwib3BlbkFjdGlvbiIsImNsb3NlQWN0aW9uIiwidHJhbnNpdGlvbkVuZEV2ZW50IiwiTWVudSIsIm9wZW5DbGFzcyIsIm1lbnVXaWR0aCIsIm91dGVyV2lkdGgiLCJzcGVlZCIsInNpZGUiLCJkaXNwbGFjZSIsInRpbWluZyIsIm1ldGhvZCIsIm9uT3BlbkNhbGxiYWNrIiwib25DbG9zZUNhbGxiYWNrIiwib25PcGVuRW5kQ2FsbGJhY2siLCJvbkNsb3NlRW5kQ2FsbGJhY2siLCJnZXRBbmltYXRpb24iLCJwcmVwYXJlQm9keSIsIiRodG1sIiwib3BlbkJvZHkiLCJib2R5QW5pbWF0aW9uIiwicXVldWUiLCJvbkNsb3NlQm9keSIsInJlc2V0U3R5bGVzIiwidW5iaW5kIiwiY2xvc2VCb2R5IiwiX3RoaXMiLCJtb3ZlQm9keSIsIm9uT3Blbk1lbnUiLCJvcGVuTWVudSIsIl90aGlzMiIsIiRpdGVtIiwibWVudUFuaW1hdGlvbiIsIm9uQ2xvc2VNZW51IiwiY2xvc2VNZW51IiwiX3RoaXMzIiwibW92ZU1lbnUiLCJtb3ZlIiwib3BlbiIsIl90aGlzNCIsImFscmVhZHlPcGVuZWRNZW51IiwiJCQxIiwiZXhlY3V0ZSIsInNpZHIiLCJlcnJvciIsInB1YmxpY01ldGhvZHMiLCJtZXRob2ROYW1lIiwibWV0aG9kcyIsImdldE1ldGhvZCIsIkFycmF5Iiwic2xpY2UiLCIkJDMiLCJmaWxsQ29udGVudCIsIiRzaWRlTWVudSIsInNldHRpbmdzIiwic291cmNlIiwibmV3Q29udGVudCIsImdldCIsImh0bWxDb250ZW50Iiwic2VsZWN0b3JzIiwicmVuYW1pbmciLCIkaHRtbENvbnRlbnQiLCJmblNpZHIiLCJiaW5kIiwib25PcGVuIiwib25DbG9zZSIsIm9uT3BlbkVuZCIsIm9uQ2xvc2VFbmQiLCJmbGFnIiwiQWpheE1vbml0b3IiLCJCYXIiLCJEb2N1bWVudE1vbml0b3IiLCJFbGVtZW50TW9uaXRvciIsIkVsZW1lbnRUcmFja2VyIiwiRXZlbnRMYWdNb25pdG9yIiwiRXZlbnRlZCIsIkV2ZW50cyIsIk5vVGFyZ2V0RXJyb3IiLCJQYWNlIiwiUmVxdWVzdEludGVyY2VwdCIsIlNPVVJDRV9LRVlTIiwiU2NhbGVyIiwiU29ja2V0UmVxdWVzdFRyYWNrZXIiLCJYSFJSZXF1ZXN0VHJhY2tlciIsImF2Z0FtcGxpdHVkZSIsImJhciIsImNhbmNlbEFuaW1hdGlvbiIsImNhbmNlbEFuaW1hdGlvbkZyYW1lIiwiZGVmYXVsdE9wdGlvbnMiLCJleHRlbmROYXRpdmUiLCJnZXRGcm9tRE9NIiwiZ2V0SW50ZXJjZXB0IiwiaGFuZGxlUHVzaFN0YXRlIiwiaWdub3JlU3RhY2siLCJub3ciLCJyZXF1ZXN0QW5pbWF0aW9uRnJhbWUiLCJyZXN1bHQiLCJydW5BbmltYXRpb24iLCJzY2FsZXJzIiwic2hvdWxkSWdub3JlVVJMIiwic2hvdWxkVHJhY2siLCJzb3VyY2VzIiwidW5pU2NhbGVyIiwiX1dlYlNvY2tldCIsIl9YRG9tYWluUmVxdWVzdCIsIl9YTUxIdHRwUmVxdWVzdCIsIl9pIiwiX2ludGVyY2VwdCIsIl9sZW4iLCJfcHVzaFN0YXRlIiwiX3JlZiIsIl9yZWYxIiwiX3JlcGxhY2VTdGF0ZSIsIl9fc2xpY2UiLCJfX2hhc1Byb3AiLCJfX2V4dGVuZHMiLCJjaGlsZCIsImN0b3IiLCJfX3N1cGVyX18iLCJfX2luZGV4T2YiLCJpbmRleE9mIiwiY2F0Y2h1cFRpbWUiLCJpbml0aWFsUmF0ZSIsIm1pblRpbWUiLCJnaG9zdFRpbWUiLCJtYXhQcm9ncmVzc1BlckZyYW1lIiwiZWFzZUZhY3RvciIsInN0YXJ0T25QYWdlTG9hZCIsInJlc3RhcnRPblB1c2hTdGF0ZSIsInJlc3RhcnRPblJlcXVlc3RBZnRlciIsImNoZWNrSW50ZXJ2YWwiLCJldmVudExhZyIsIm1pblNhbXBsZXMiLCJzYW1wbGVDb3VudCIsImxhZ1RocmVzaG9sZCIsImFqYXgiLCJ0cmFja01ldGhvZHMiLCJ0cmFja1dlYlNvY2tldHMiLCJpZ25vcmVVUkxzIiwicGVyZm9ybWFuY2UiLCJEYXRlIiwibW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lIiwid2Via2l0UmVxdWVzdEFuaW1hdGlvbkZyYW1lIiwibXNSZXF1ZXN0QW5pbWF0aW9uRnJhbWUiLCJtb3pDYW5jZWxBbmltYXRpb25GcmFtZSIsImxhc3QiLCJ0aWNrIiwiZGlmZiIsImFyZ3MiLCJvdXQiLCJhcnIiLCJjb3VudCIsInN1bSIsInYiLCJqc29uIiwicXVlcnlTZWxlY3RvciIsImdldEF0dHJpYnV0ZSIsIkpTT04iLCJwYXJzZSIsIl9lcnJvciIsImNvbnNvbGUiLCJjdHgiLCJvbmNlIiwiX2Jhc2UiLCJiaW5kaW5ncyIsIl9yZXN1bHRzIiwic3BsaWNlIiwicGFjZU9wdGlvbnMiLCJfc3VwZXIiLCJwcm9ncmVzcyIsImdldEVsZW1lbnQiLCJ0YXJnZXRFbGVtZW50IiwiZmlyc3RDaGlsZCIsImluc2VydEJlZm9yZSIsImFwcGVuZENoaWxkIiwiZmluaXNoIiwidXBkYXRlIiwicHJvZyIsInJlbmRlciIsInByb2dyZXNzU3RyIiwidHJhbnNmb3JtIiwiX2oiLCJfbGVuMSIsIl9yZWYyIiwibGFzdFJlbmRlcmVkUHJvZ3Jlc3MiLCJzZXRBdHRyaWJ1dGUiLCJkb25lIiwiYmluZGluZyIsIlhNTEh0dHBSZXF1ZXN0IiwiWERvbWFpblJlcXVlc3QiLCJXZWJTb2NrZXQiLCJmcm9tIiwiaWdub3JlIiwicmV0IiwidW5zaGlmdCIsInNoaWZ0IiwidHJhY2siLCJtb25pdG9yWEhSIiwicmVxIiwiX29wZW4iLCJ1cmwiLCJhc3luYyIsInJlcXVlc3QiLCJmbGFncyIsInByb3RvY29scyIsIl9hcmciLCJhZnRlciIsInJ1bm5pbmciLCJzdGlsbEFjdGl2ZSIsIl9yZWYzIiwicmVhZHlTdGF0ZSIsInJlc3RhcnQiLCJ3YXRjaCIsInRyYWNrZXIiLCJzaXplIiwiX29ucmVhZHlzdGF0ZWNoYW5nZSIsIlByb2dyZXNzRXZlbnQiLCJhZGRFdmVudExpc3RlbmVyIiwiZXZ0IiwibGVuZ3RoQ29tcHV0YWJsZSIsImxvYWRlZCIsInRvdGFsIiwib25yZWFkeXN0YXRlY2hhbmdlIiwiY2hlY2siLCJzdGF0ZXMiLCJsb2FkaW5nIiwiaW50ZXJhY3RpdmUiLCJhdmciLCJwb2ludHMiLCJzYW1wbGVzIiwic2luY2VMYXN0VXBkYXRlIiwicmF0ZSIsImNhdGNodXAiLCJsYXN0UHJvZ3Jlc3MiLCJmcmFtZVRpbWUiLCJzY2FsaW5nIiwicG93IiwibWluIiwiaGlzdG9yeSIsInB1c2hTdGF0ZSIsInJlcGxhY2VTdGF0ZSIsIl9rIiwiX2xlbjIiLCJfcmVmNCIsImV4dHJhU291cmNlcyIsInN0b3AiLCJzdGFydCIsImdvIiwiZW5xdWV1ZU5leHRGcmFtZSIsInJlbWFpbmluZyIsInNjYWxlciIsInNjYWxlckxpc3QiLCJkZWZpbmUiLCJhbWQiLCJleHBvcnRzIiwibW9kdWxlIiwidG9nZ2xlQWxsQnV0dG9ucyIsInF1ZXJ5U2VsZWN0b3JBbGwiLCJ0b2dnbGVCdWxsZXRwb2ludEJ1dHRvbnMiLCJ0b2dnbGVBdHRhY2htZW50c0J1dHRvbnMiLCJ0b2dnbGVBbGxCdXR0b24iLCJoYW5kbGVUb2dnbGVBbGwiLCJidWxsZXRwb2ludHMiLCJnZXRFbGVtZW50c0J5Q2xhc3NOYW1lIiwiY3VycmVudFN0YXRlIiwiZGF0YXNldCIsImJ1bGxldHBvaW50IiwiY2xhc3NMaXN0IiwiYWRkIiwidG9nZ2xlQXR0YWNobWVudEJ1dHRvbiIsImhhbmRsZVRvZ2dsZUF0dGFjaG1lbnRzIiwiYXR0YWNobWVudHMiLCJhdHRhY2htZW50IiwidG9nZ2xlQnVsbGV0cG9pbnRCdXR0b24iLCJoYW5kbGVUb2dnbGVCdWxsZXRwb2ludCIsIm5vdCJdLCJtYXBwaW5ncyI6Ijs7OztBQUFBOzs7Ozs7QUFNQSxJQUFJLE9BQU9BLE1BQVAsS0FBa0IsV0FBdEIsRUFBbUM7QUFDakMsUUFBTSxJQUFJ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QThDO0FBQzVDOUQsUUFBRSwwREFBRixFQUE4RGlELElBQTlELENBQW1FLFVBQW5FLEVBQStFLFVBQS9FO0FBQ0QsS0FGRCxNQUdLO0FBQ0hqRCxRQUFFLDBEQUFGLEVBQThEd0YsVUFBOUQsQ0FBeUUsVUFBekU7QUFDRDs7QUFFRDdELFVBQU0wQixjQUFOO0FBQ0QsR0FqQkQ7QUFrQkQsQ0F0RUQiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyohXG4gKiBCb290c3RyYXAgdjMuNC4xIChodHRwczovL2dldGJvb3RzdHJhcC5jb20vKVxuICogQ29weXJpZ2h0IDIwMTEtMjAxOSBUd2l0dGVyLCBJbmMuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2VcbiAqL1xuXG5pZiAodHlwZW9mIGpRdWVyeSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgdGhyb3cgbmV3IEVycm9yKCdCb290c3RyYXBcXCdzIEphdmFTY3JpcHQgcmVxdWlyZXMgalF1ZXJ5Jylcbn1cblxuK2Z1bmN0aW9uICgkKSB7XG4gICd1c2Ugc3RyaWN0JztcbiAgdmFyIHZlcnNpb24gPSAkLmZuLmpxdWVyeS5zcGxpdCgnICcpWzBdLnNwbGl0KCcuJylcbiAgaWYgKCh2ZXJzaW9uWzBdIDwgMiAmJiB2ZXJzaW9uWzFdIDwgOSkgfHwgKHZlcnNpb25bMF0gPT0gMSAmJiB2ZXJzaW9uWzFdID09IDkgJiYgdmVyc2lvblsyXSA8IDEpIHx8ICh2ZXJzaW9uWzBdID4gMykpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0Jvb3RzdHJhcFxcJ3MgSmF2YVNjcmlwdCByZXF1aXJlcyBqUXVlcnkgdmVyc2lvbiAxLjkuMSBvciBoaWdoZXIsIGJ1dCBsb3dlciB0aGFuIHZlcnNpb24gNCcpXG4gIH1cbn0oalF1ZXJ5KTtcblxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBCb290c3RyYXA6IHRyYW5zaXRpb24uanMgdjMuNC4xXG4gKiBodHRwczovL2dldGJvb3RzdHJhcC5jb20vZG9jcy8zLjQvamF2YXNjcmlwdC8jdHJhbnNpdGlvbnNcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogQ29weXJpZ2h0IDIwMTEtMjAxOSBUd2l0dGVyLCBJbmMuXG4gKiBMaWNlbnNlZCB1bmRlciBNSVQgKGh0dHBzOi8vZ2l0aHViLmNvbS90d2JzL2Jvb3RzdHJhcC9ibG9iL21hc3Rlci9MSUNFTlNFKVxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovXG5cblxuK2Z1bmN0aW9uICgkKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICAvLyBDU1MgVFJBTlNJVElPTiBTVVBQT1JUIChTaG91dG91dDogaHR0cHM6Ly9tb2Rlcm5penIuY29tLylcbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgZnVuY3Rpb24gdHJhbnNpdGlvbkVuZCgpIHtcbiAgICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdib290c3RyYXAnKVxuXG4gICAgdmFyIHRyYW5zRW5kRXZlbnROYW1lcyA9IHtcbiAgICAgIFdlYmtpdFRyYW5zaXRpb24gOiAnd2Via2l0VHJhbnNpdGlvbkVuZCcsXG4gICAgICBNb3pUcmFuc2l0aW9uICAgIDogJ3RyYW5zaXRpb25lbmQnLFxuICAgICAgT1RyYW5zaXRpb24gICAgICA6ICdvVHJhbnNpdGlvbkVuZCBvdHJhbnNpdGlvbmVuZCcsXG4gICAgICB0cmFuc2l0aW9uICAgICAgIDogJ3RyYW5zaXRpb25lbmQnXG4gICAgfVxuXG4gICAgZm9yICh2YXIgbmFtZSBpbiB0cmFuc0VuZEV2ZW50TmFtZXMpIHtcbiAgICAgIGlmIChlbC5zdHlsZVtuYW1lXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiB7IGVuZDogdHJhbnNFbmRFdmVudE5hbWVzW25hbWVdIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2UgLy8gZXhwbGljaXQgZm9yIGllOCAoICAuXy4pXG4gIH1cblxuICAvLyBodHRwczovL2Jsb2cuYWxleG1hY2Nhdy5jb20vY3NzLXRyYW5zaXRpb25zXG4gICQuZm4uZW11bGF0ZVRyYW5zaXRpb25FbmQgPSBmdW5jdGlvbiAoZHVyYXRpb24pIHtcbiAgICB2YXIgY2FsbGVkID0gZmFsc2VcbiAgICB2YXIgJGVsID0gdGhpc1xuICAgICQodGhpcykub25lKCdic1RyYW5zaXRpb25FbmQnLCBmdW5jdGlvbiAoKSB7IGNhbGxlZCA9IHRydWUgfSlcbiAgICB2YXIgY2FsbGJhY2sgPSBmdW5jdGlvbiAoKSB7IGlmICghY2FsbGVkKSAkKCRlbCkudHJpZ2dlcigkLnN1cHBvcnQudHJhbnNpdGlvbi5lbmQpIH1cbiAgICBzZXRUaW1lb3V0KGNhbGxiYWNrLCBkdXJhdGlvbilcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgJChmdW5jdGlvbiAoKSB7XG4gICAgJC5zdXBwb3J0LnRyYW5zaXRpb24gPSB0cmFuc2l0aW9uRW5kKClcblxuICAgIGlmICghJC5zdXBwb3J0LnRyYW5zaXRpb24pIHJldHVyblxuXG4gICAgJC5ldmVudC5zcGVjaWFsLmJzVHJhbnNpdGlvbkVuZCA9IHtcbiAgICAgIGJpbmRUeXBlOiAkLnN1cHBvcnQudHJhbnNpdGlvbi5lbmQsXG4gICAgICBkZWxlZ2F0ZVR5cGU6ICQuc3VwcG9ydC50cmFuc2l0aW9uLmVuZCxcbiAgICAgIGhhbmRsZTogZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgaWYgKCQoZS50YXJnZXQpLmlzKHRoaXMpKSByZXR1cm4gZS5oYW5kbGVPYmouaGFuZGxlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgICB9XG4gICAgfVxuICB9KVxuXG59KGpRdWVyeSk7XG5cbi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogQm9vdHN0cmFwOiBhbGVydC5qcyB2My40LjFcbiAqIGh0dHBzOi8vZ2V0Ym9vdHN0cmFwLmNvbS9kb2NzLzMuNC9qYXZhc2NyaXB0LyNhbGVydHNcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogQ29weXJpZ2h0IDIwMTEtMjAxOSBUd2l0dGVyLCBJbmMuXG4gKiBMaWNlbnNlZCB1bmRlciBNSVQgKGh0dHBzOi8vZ2l0aHViLmNvbS90d2JzL2Jvb3RzdHJhcC9ibG9iL21hc3Rlci9MSUNFTlNFKVxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovXG5cblxuK2Z1bmN0aW9uICgkKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICAvLyBBTEVSVCBDTEFTUyBERUZJTklUSU9OXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT1cblxuICB2YXIgZGlzbWlzcyA9ICdbZGF0YS1kaXNtaXNzPVwiYWxlcnRcIl0nXG4gIHZhciBBbGVydCAgID0gZnVuY3Rpb24gKGVsKSB7XG4gICAgJChlbCkub24oJ2NsaWNrJywgZGlzbWlzcywgdGhpcy5jbG9zZSlcbiAgfVxuXG4gIEFsZXJ0LlZFUlNJT04gPSAnMy40LjEnXG5cbiAgQWxlcnQuVFJBTlNJVElPTl9EVVJBVElPTiA9IDE1MFxuXG4gIEFsZXJ0LnByb3RvdHlwZS5jbG9zZSA9IGZ1bmN0aW9uIChlKSB7XG4gICAgdmFyICR0aGlzICAgID0gJCh0aGlzKVxuICAgIHZhciBzZWxlY3RvciA9ICR0aGlzLmF0dHIoJ2RhdGEtdGFyZ2V0JylcblxuICAgIGlmICghc2VsZWN0b3IpIHtcbiAgICAgIHNlbGVjdG9yID0gJHRoaXMuYXR0cignaHJlZicpXG4gICAgICBzZWxlY3RvciA9IHNlbGVjdG9yICYmIHNlbGVjdG9yLnJlcGxhY2UoLy4qKD89I1teXFxzXSokKS8sICcnKSAvLyBzdHJpcCBmb3IgaWU3XG4gICAgfVxuXG4gICAgc2VsZWN0b3IgICAgPSBzZWxlY3RvciA9PT0gJyMnID8gW10gOiBzZWxlY3RvclxuICAgIHZhciAkcGFyZW50ID0gJChkb2N1bWVudCkuZmluZChzZWxlY3RvcilcblxuICAgIGlmIChlKSBlLnByZXZlbnREZWZhdWx0KClcblxuICAgIGlmICghJHBhcmVudC5sZW5ndGgpIHtcbiAgICAgICRwYXJlbnQgPSAkdGhpcy5jbG9zZXN0KCcuYWxlcnQnKVxuICAgIH1cblxuICAgICRwYXJlbnQudHJpZ2dlcihlID0gJC5FdmVudCgnY2xvc2UuYnMuYWxlcnQnKSlcblxuICAgIGlmIChlLmlzRGVmYXVsdFByZXZlbnRlZCgpKSByZXR1cm5cblxuICAgICRwYXJlbnQucmVtb3ZlQ2xhc3MoJ2luJylcblxuICAgIGZ1bmN0aW9uIHJlbW92ZUVsZW1lbnQoKSB7XG4gICAgICAvLyBkZXRhY2ggZnJvbSBwYXJlbnQsIGZpcmUgZXZlbnQgdGhlbiBjbGVhbiB1cCBkYXRhXG4gICAgICAkcGFyZW50LmRldGFjaCgpLnRyaWdnZXIoJ2Nsb3NlZC5icy5hbGVydCcpLnJlbW92ZSgpXG4gICAgfVxuXG4gICAgJC5zdXBwb3J0LnRyYW5zaXRpb24gJiYgJHBhcmVudC5oYXNDbGFzcygnZmFkZScpID9cbiAgICAgICRwYXJlbnRcbiAgICAgICAgLm9uZSgnYnNUcmFuc2l0aW9uRW5kJywgcmVtb3ZlRWxlbWVudClcbiAgICAgICAgLmVtdWxhdGVUcmFuc2l0aW9uRW5kKEFsZXJ0LlRSQU5TSVRJT05fRFVSQVRJT04pIDpcbiAgICAgIHJlbW92ZUVsZW1lbnQoKVxuICB9XG5cblxuICAvLyBBTEVSVCBQTFVHSU4gREVGSU5JVElPTlxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PVxuXG4gIGZ1bmN0aW9uIFBsdWdpbihvcHRpb24pIHtcbiAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciAkdGhpcyA9ICQodGhpcylcbiAgICAgIHZhciBkYXRhICA9ICR0aGlzLmRhdGEoJ2JzLmFsZXJ0JylcblxuICAgICAgaWYgKCFkYXRhKSAkdGhpcy5kYXRhKCdicy5hbGVydCcsIChkYXRhID0gbmV3IEFsZXJ0KHRoaXMpKSlcbiAgICAgIGlmICh0eXBlb2Ygb3B0aW9uID09ICdzdHJpbmcnKSBkYXRhW29wdGlvbl0uY2FsbCgkdGhpcylcbiAgICB9KVxuICB9XG5cbiAgdmFyIG9sZCA9ICQuZm4uYWxlcnRcblxuICAkLmZuLmFsZXJ0ICAgICAgICAgICAgID0gUGx1Z2luXG4gICQuZm4uYWxlcnQuQ29uc3RydWN0b3IgPSBBbGVydFxuXG5cbiAgLy8gQUxFUlQgTk8gQ09ORkxJQ1RcbiAgLy8gPT09PT09PT09PT09PT09PT1cblxuICAkLmZuLmFsZXJ0Lm5vQ29uZmxpY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgJC5mbi5hbGVydCA9IG9sZFxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuXG4gIC8vIEFMRVJUIERBVEEtQVBJXG4gIC8vID09PT09PT09PT09PT09XG5cbiAgJChkb2N1bWVudCkub24oJ2NsaWNrLmJzLmFsZXJ0LmRhdGEtYXBpJywgZGlzbWlzcywgQWxlcnQucHJvdG90eXBlLmNsb3NlKVxuXG59KGpRdWVyeSk7XG5cbi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogQm9vdHN0cmFwOiBidXR0b24uanMgdjMuNC4xXG4gKiBodHRwczovL2dldGJvb3RzdHJhcC5jb20vZG9jcy8zLjQvamF2YXNjcmlwdC8jYnV0dG9uc1xuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBDb3B5cmlnaHQgMjAxMS0yMDE5IFR3aXR0ZXIsIEluYy5cbiAqIExpY2Vuc2VkIHVuZGVyIE1JVCAoaHR0cHM6Ly9naXRodWIuY29tL3R3YnMvYm9vdHN0cmFwL2Jsb2IvbWFzdGVyL0xJQ0VOU0UpXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi9cblxuXG4rZnVuY3Rpb24gKCQpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIC8vIEJVVFRPTiBQVUJMSUMgQ0xBU1MgREVGSU5JVElPTlxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICB2YXIgQnV0dG9uID0gZnVuY3Rpb24gKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLiRlbGVtZW50ICA9ICQoZWxlbWVudClcbiAgICB0aGlzLm9wdGlvbnMgICA9ICQuZXh0ZW5kKHt9LCBCdXR0b24uREVGQVVMVFMsIG9wdGlvbnMpXG4gICAgdGhpcy5pc0xvYWRpbmcgPSBmYWxzZVxuICB9XG5cbiAgQnV0dG9uLlZFUlNJT04gID0gJzMuNC4xJ1xuXG4gIEJ1dHRvbi5ERUZBVUxUUyA9IHtcbiAgICBsb2FkaW5nVGV4dDogJ2xvYWRpbmcuLi4nXG4gIH1cblxuICBCdXR0b24ucHJvdG90eXBlLnNldFN0YXRlID0gZnVuY3Rpb24gKHN0YXRlKSB7XG4gICAgdmFyIGQgICAgPSAnZGlzYWJsZWQnXG4gICAgdmFyICRlbCAgPSB0aGlzLiRlbGVtZW50XG4gICAgdmFyIHZhbCAgPSAkZWwuaXMoJ2lucHV0JykgPyAndmFsJyA6ICdodG1sJ1xuICAgIHZhciBkYXRhID0gJGVsLmRhdGEoKVxuXG4gICAgc3RhdGUgKz0gJ1RleHQnXG5cbiAgICBpZiAoZGF0YS5yZXNldFRleHQgPT0gbnVsbCkgJGVsLmRhdGEoJ3Jlc2V0VGV4dCcsICRlbFt2YWxdKCkpXG5cbiAgICAvLyBwdXNoIHRvIGV2ZW50IGxvb3AgdG8gYWxsb3cgZm9ybXMgdG8gc3VibWl0XG4gICAgc2V0VGltZW91dCgkLnByb3h5KGZ1bmN0aW9uICgpIHtcbiAgICAgICRlbFt2YWxdKGRhdGFbc3RhdGVdID09IG51bGwgPyB0aGlzLm9wdGlvbnNbc3RhdGVdIDogZGF0YVtzdGF0ZV0pXG5cbiAgICAgIGlmIChzdGF0ZSA9PSAnbG9hZGluZ1RleHQnKSB7XG4gICAgICAgIHRoaXMuaXNMb2FkaW5nID0gdHJ1ZVxuICAgICAgICAkZWwuYWRkQ2xhc3MoZCkuYXR0cihkLCBkKS5wcm9wKGQsIHRydWUpXG4gICAgICB9IGVsc2UgaWYgKHRoaXMuaXNMb2FkaW5nKSB7XG4gICAgICAgIHRoaXMuaXNMb2FkaW5nID0gZmFsc2VcbiAgICAgICAgJGVsLnJlbW92ZUNsYXNzKGQpLnJlbW92ZUF0dHIoZCkucHJvcChkLCBmYWxzZSlcbiAgICAgIH1cbiAgICB9LCB0aGlzKSwgMClcbiAgfVxuXG4gIEJ1dHRvbi5wcm90b3R5cGUudG9nZ2xlID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBjaGFuZ2VkID0gdHJ1ZVxuICAgIHZhciAkcGFyZW50ID0gdGhpcy4kZWxlbWVudC5jbG9zZXN0KCdbZGF0YS10b2dnbGU9XCJidXR0b25zXCJdJylcblxuICAgIGlmICgkcGFyZW50Lmxlbmd0aCkge1xuICAgICAgdmFyICRpbnB1dCA9IHRoaXMuJGVsZW1lbnQuZmluZCgnaW5wdXQnKVxuICAgICAgaWYgKCRpbnB1dC5wcm9wKCd0eXBlJykgPT0gJ3JhZGlvJykge1xuICAgICAgICBpZiAoJGlucHV0LnByb3AoJ2NoZWNrZWQnKSkgY2hhbmdlZCA9IGZhbHNlXG4gICAgICAgICRwYXJlbnQuZmluZCgnLmFjdGl2ZScpLnJlbW92ZUNsYXNzKCdhY3RpdmUnKVxuICAgICAgICB0aGlzLiRlbGVtZW50LmFkZENsYXNzKCdhY3RpdmUnKVxuICAgICAgfSBlbHNlIGlmICgkaW5wdXQucHJvcCgndHlwZScpID09ICdjaGVja2JveCcpIHtcbiAgICAgICAgaWYgKCgkaW5wdXQucHJvcCgnY2hlY2tlZCcpKSAhPT0gdGhpcy4kZWxlbWVudC5oYXNDbGFzcygnYWN0aXZlJykpIGNoYW5nZWQgPSBmYWxzZVxuICAgICAgICB0aGlzLiRlbGVtZW50LnRvZ2dsZUNsYXNzKCdhY3RpdmUnKVxuICAgICAgfVxuICAgICAgJGlucHV0LnByb3AoJ2NoZWNrZWQnLCB0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKCdhY3RpdmUnKSlcbiAgICAgIGlmIChjaGFuZ2VkKSAkaW5wdXQudHJpZ2dlcignY2hhbmdlJylcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy4kZWxlbWVudC5hdHRyKCdhcmlhLXByZXNzZWQnLCAhdGhpcy4kZWxlbWVudC5oYXNDbGFzcygnYWN0aXZlJykpXG4gICAgICB0aGlzLiRlbGVtZW50LnRvZ2dsZUNsYXNzKCdhY3RpdmUnKVxuICAgIH1cbiAgfVxuXG5cbiAgLy8gQlVUVE9OIFBMVUdJTiBERUZJTklUSU9OXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gIGZ1bmN0aW9uIFBsdWdpbihvcHRpb24pIHtcbiAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciAkdGhpcyAgID0gJCh0aGlzKVxuICAgICAgdmFyIGRhdGEgICAgPSAkdGhpcy5kYXRhKCdicy5idXR0b24nKVxuICAgICAgdmFyIG9wdGlvbnMgPSB0eXBlb2Ygb3B0aW9uID09ICdvYmplY3QnICYmIG9wdGlvblxuXG4gICAgICBpZiAoIWRhdGEpICR0aGlzLmRhdGEoJ2JzLmJ1dHRvbicsIChkYXRhID0gbmV3IEJ1dHRvbih0aGlzLCBvcHRpb25zKSkpXG5cbiAgICAgIGlmIChvcHRpb24gPT0gJ3RvZ2dsZScpIGRhdGEudG9nZ2xlKClcbiAgICAgIGVsc2UgaWYgKG9wdGlvbikgZGF0YS5zZXRTdGF0ZShvcHRpb24pXG4gICAgfSlcbiAgfVxuXG4gIHZhciBvbGQgPSAkLmZuLmJ1dHRvblxuXG4gICQuZm4uYnV0dG9uICAgICAgICAgICAgID0gUGx1Z2luXG4gICQuZm4uYnV0dG9uLkNvbnN0cnVjdG9yID0gQnV0dG9uXG5cblxuICAvLyBCVVRUT04gTk8gQ09ORkxJQ1RcbiAgLy8gPT09PT09PT09PT09PT09PT09XG5cbiAgJC5mbi5idXR0b24ubm9Db25mbGljdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAkLmZuLmJ1dHRvbiA9IG9sZFxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuXG4gIC8vIEJVVFRPTiBEQVRBLUFQSVxuICAvLyA9PT09PT09PT09PT09PT1cblxuICAkKGRvY3VtZW50KVxuICAgIC5vbignY2xpY2suYnMuYnV0dG9uLmRhdGEtYXBpJywgJ1tkYXRhLXRvZ2dsZV49XCJidXR0b25cIl0nLCBmdW5jdGlvbiAoZSkge1xuICAgICAgdmFyICRidG4gPSAkKGUudGFyZ2V0KS5jbG9zZXN0KCcuYnRuJylcbiAgICAgIFBsdWdpbi5jYWxsKCRidG4sICd0b2dnbGUnKVxuICAgICAgaWYgKCEoJChlLnRhcmdldCkuaXMoJ2lucHV0W3R5cGU9XCJyYWRpb1wiXSwgaW5wdXRbdHlwZT1cImNoZWNrYm94XCJdJykpKSB7XG4gICAgICAgIC8vIFByZXZlbnQgZG91YmxlIGNsaWNrIG9uIHJhZGlvcywgYW5kIHRoZSBkb3VibGUgc2VsZWN0aW9ucyAoc28gY2FuY2VsbGF0aW9uKSBvbiBjaGVja2JveGVzXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgICAvLyBUaGUgdGFyZ2V0IGNvbXBvbmVudCBzdGlsbCByZWNlaXZlIHRoZSBmb2N1c1xuICAgICAgICBpZiAoJGJ0bi5pcygnaW5wdXQsYnV0dG9uJykpICRidG4udHJpZ2dlcignZm9jdXMnKVxuICAgICAgICBlbHNlICRidG4uZmluZCgnaW5wdXQ6dmlzaWJsZSxidXR0b246dmlzaWJsZScpLmZpcnN0KCkudHJpZ2dlcignZm9jdXMnKVxuICAgICAgfVxuICAgIH0pXG4gICAgLm9uKCdmb2N1cy5icy5idXR0b24uZGF0YS1hcGkgYmx1ci5icy5idXR0b24uZGF0YS1hcGknLCAnW2RhdGEtdG9nZ2xlXj1cImJ1dHRvblwiXScsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAkKGUudGFyZ2V0KS5jbG9zZXN0KCcuYnRuJykudG9nZ2xlQ2xhc3MoJ2ZvY3VzJywgL15mb2N1cyhpbik/JC8udGVzdChlLnR5cGUpKVxuICAgIH0pXG5cbn0oalF1ZXJ5KTtcblxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBCb290c3RyYXA6IGNhcm91c2VsLmpzIHYzLjQuMVxuICogaHR0cHM6Ly9nZXRib290c3RyYXAuY29tL2RvY3MvMy40L2phdmFzY3JpcHQvI2Nhcm91c2VsXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIENvcHlyaWdodCAyMDExLTIwMTkgVHdpdHRlciwgSW5jLlxuICogTGljZW5zZWQgdW5kZXIgTUlUIChodHRwczovL2dpdGh1Yi5jb20vdHdicy9ib290c3RyYXAvYmxvYi9tYXN0ZXIvTElDRU5TRSlcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqL1xuXG5cbitmdW5jdGlvbiAoJCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgLy8gQ0FST1VTRUwgQ0xBU1MgREVGSU5JVElPTlxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgdmFyIENhcm91c2VsID0gZnVuY3Rpb24gKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLiRlbGVtZW50ICAgID0gJChlbGVtZW50KVxuICAgIHRoaXMuJGluZGljYXRvcnMgPSB0aGlzLiRlbGVtZW50LmZpbmQoJy5jYXJvdXNlbC1pbmRpY2F0b3JzJylcbiAgICB0aGlzLm9wdGlvbnMgICAgID0gb3B0aW9uc1xuICAgIHRoaXMucGF1c2VkICAgICAgPSBudWxsXG4gICAgdGhpcy5zbGlkaW5nICAgICA9IG51bGxcbiAgICB0aGlzLmludGVydmFsICAgID0gbnVsbFxuICAgIHRoaXMuJGFjdGl2ZSAgICAgPSBudWxsXG4gICAgdGhpcy4kaXRlbXMgICAgICA9IG51bGxcblxuICAgIHRoaXMub3B0aW9ucy5rZXlib2FyZCAmJiB0aGlzLiRlbGVtZW50Lm9uKCdrZXlkb3duLmJzLmNhcm91c2VsJywgJC5wcm94eSh0aGlzLmtleWRvd24sIHRoaXMpKVxuXG4gICAgdGhpcy5vcHRpb25zLnBhdXNlID09ICdob3ZlcicgJiYgISgnb250b3VjaHN0YXJ0JyBpbiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQpICYmIHRoaXMuJGVsZW1lbnRcbiAgICAgIC5vbignbW91c2VlbnRlci5icy5jYXJvdXNlbCcsICQucHJveHkodGhpcy5wYXVzZSwgdGhpcykpXG4gICAgICAub24oJ21vdXNlbGVhdmUuYnMuY2Fyb3VzZWwnLCAkLnByb3h5KHRoaXMuY3ljbGUsIHRoaXMpKVxuICB9XG5cbiAgQ2Fyb3VzZWwuVkVSU0lPTiAgPSAnMy40LjEnXG5cbiAgQ2Fyb3VzZWwuVFJBTlNJVElPTl9EVVJBVElPTiA9IDYwMFxuXG4gIENhcm91c2VsLkRFRkFVTFRTID0ge1xuICAgIGludGVydmFsOiA1MDAwLFxuICAgIHBhdXNlOiAnaG92ZXInLFxuICAgIHdyYXA6IHRydWUsXG4gICAga2V5Ym9hcmQ6IHRydWVcbiAgfVxuXG4gIENhcm91c2VsLnByb3RvdHlwZS5rZXlkb3duID0gZnVuY3Rpb24gKGUpIHtcbiAgICBpZiAoL2lucHV0fHRleHRhcmVhL2kudGVzdChlLnRhcmdldC50YWdOYW1lKSkgcmV0dXJuXG4gICAgc3dpdGNoIChlLndoaWNoKSB7XG4gICAgICBjYXNlIDM3OiB0aGlzLnByZXYoKTsgYnJlYWtcbiAgICAgIGNhc2UgMzk6IHRoaXMubmV4dCgpOyBicmVha1xuICAgICAgZGVmYXVsdDogcmV0dXJuXG4gICAgfVxuXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gIH1cblxuICBDYXJvdXNlbC5wcm90b3R5cGUuY3ljbGUgPSBmdW5jdGlvbiAoZSkge1xuICAgIGUgfHwgKHRoaXMucGF1c2VkID0gZmFsc2UpXG5cbiAgICB0aGlzLmludGVydmFsICYmIGNsZWFySW50ZXJ2YWwodGhpcy5pbnRlcnZhbClcblxuICAgIHRoaXMub3B0aW9ucy5pbnRlcnZhbFxuICAgICAgJiYgIXRoaXMucGF1c2VkXG4gICAgICAmJiAodGhpcy5pbnRlcnZhbCA9IHNldEludGVydmFsKCQucHJveHkodGhpcy5uZXh0LCB0aGlzKSwgdGhpcy5vcHRpb25zLmludGVydmFsKSlcblxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICBDYXJvdXNlbC5wcm90b3R5cGUuZ2V0SXRlbUluZGV4ID0gZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICB0aGlzLiRpdGVtcyA9IGl0ZW0ucGFyZW50KCkuY2hpbGRyZW4oJy5pdGVtJylcbiAgICByZXR1cm4gdGhpcy4kaXRlbXMuaW5kZXgoaXRlbSB8fCB0aGlzLiRhY3RpdmUpXG4gIH1cblxuICBDYXJvdXNlbC5wcm90b3R5cGUuZ2V0SXRlbUZvckRpcmVjdGlvbiA9IGZ1bmN0aW9uIChkaXJlY3Rpb24sIGFjdGl2ZSkge1xuICAgIHZhciBhY3RpdmVJbmRleCA9IHRoaXMuZ2V0SXRlbUluZGV4KGFjdGl2ZSlcbiAgICB2YXIgd2lsbFdyYXAgPSAoZGlyZWN0aW9uID09ICdwcmV2JyAmJiBhY3RpdmVJbmRleCA9PT0gMClcbiAgICAgICAgICAgICAgICB8fCAoZGlyZWN0aW9uID09ICduZXh0JyAmJiBhY3RpdmVJbmRleCA9PSAodGhpcy4kaXRlbXMubGVuZ3RoIC0gMSkpXG4gICAgaWYgKHdpbGxXcmFwICYmICF0aGlzLm9wdGlvbnMud3JhcCkgcmV0dXJuIGFjdGl2ZVxuICAgIHZhciBkZWx0YSA9IGRpcmVjdGlvbiA9PSAncHJldicgPyAtMSA6IDFcbiAgICB2YXIgaXRlbUluZGV4ID0gKGFjdGl2ZUluZGV4ICsgZGVsdGEpICUgdGhpcy4kaXRlbXMubGVuZ3RoXG4gICAgcmV0dXJuIHRoaXMuJGl0ZW1zLmVxKGl0ZW1JbmRleClcbiAgfVxuXG4gIENhcm91c2VsLnByb3RvdHlwZS50byA9IGZ1bmN0aW9uIChwb3MpIHtcbiAgICB2YXIgdGhhdCAgICAgICAgPSB0aGlzXG4gICAgdmFyIGFjdGl2ZUluZGV4ID0gdGhpcy5nZXRJdGVtSW5kZXgodGhpcy4kYWN0aXZlID0gdGhpcy4kZWxlbWVudC5maW5kKCcuaXRlbS5hY3RpdmUnKSlcblxuICAgIGlmIChwb3MgPiAodGhpcy4kaXRlbXMubGVuZ3RoIC0gMSkgfHwgcG9zIDwgMCkgcmV0dXJuXG5cbiAgICBpZiAodGhpcy5zbGlkaW5nKSAgICAgICByZXR1cm4gdGhpcy4kZWxlbWVudC5vbmUoJ3NsaWQuYnMuY2Fyb3VzZWwnLCBmdW5jdGlvbiAoKSB7IHRoYXQudG8ocG9zKSB9KSAvLyB5ZXMsIFwic2xpZFwiXG4gICAgaWYgKGFjdGl2ZUluZGV4ID09IHBvcykgcmV0dXJuIHRoaXMucGF1c2UoKS5jeWNsZSgpXG5cbiAgICByZXR1cm4gdGhpcy5zbGlkZShwb3MgPiBhY3RpdmVJbmRleCA/ICduZXh0JyA6ICdwcmV2JywgdGhpcy4kaXRlbXMuZXEocG9zKSlcbiAgfVxuXG4gIENhcm91c2VsLnByb3RvdHlwZS5wYXVzZSA9IGZ1bmN0aW9uIChlKSB7XG4gICAgZSB8fCAodGhpcy5wYXVzZWQgPSB0cnVlKVxuXG4gICAgaWYgKHRoaXMuJGVsZW1lbnQuZmluZCgnLm5leHQsIC5wcmV2JykubGVuZ3RoICYmICQuc3VwcG9ydC50cmFuc2l0aW9uKSB7XG4gICAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJC5zdXBwb3J0LnRyYW5zaXRpb24uZW5kKVxuICAgICAgdGhpcy5jeWNsZSh0cnVlKVxuICAgIH1cblxuICAgIHRoaXMuaW50ZXJ2YWwgPSBjbGVhckludGVydmFsKHRoaXMuaW50ZXJ2YWwpXG5cbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgQ2Fyb3VzZWwucHJvdG90eXBlLm5leHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMuc2xpZGluZykgcmV0dXJuXG4gICAgcmV0dXJuIHRoaXMuc2xpZGUoJ25leHQnKVxuICB9XG5cbiAgQ2Fyb3VzZWwucHJvdG90eXBlLnByZXYgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMuc2xpZGluZykgcmV0dXJuXG4gICAgcmV0dXJuIHRoaXMuc2xpZGUoJ3ByZXYnKVxuICB9XG5cbiAgQ2Fyb3VzZWwucHJvdG90eXBlLnNsaWRlID0gZnVuY3Rpb24gKHR5cGUsIG5leHQpIHtcbiAgICB2YXIgJGFjdGl2ZSAgID0gdGhpcy4kZWxlbWVudC5maW5kKCcuaXRlbS5hY3RpdmUnKVxuICAgIHZhciAkbmV4dCAgICAgPSBuZXh0IHx8IHRoaXMuZ2V0SXRlbUZvckRpcmVjdGlvbih0eXBlLCAkYWN0aXZlKVxuICAgIHZhciBpc0N5Y2xpbmcgPSB0aGlzLmludGVydmFsXG4gICAgdmFyIGRpcmVjdGlvbiA9IHR5cGUgPT0gJ25leHQnID8gJ2xlZnQnIDogJ3JpZ2h0J1xuICAgIHZhciB0aGF0ICAgICAgPSB0aGlzXG5cbiAgICBpZiAoJG5leHQuaGFzQ2xhc3MoJ2FjdGl2ZScpKSByZXR1cm4gKHRoaXMuc2xpZGluZyA9IGZhbHNlKVxuXG4gICAgdmFyIHJlbGF0ZWRUYXJnZXQgPSAkbmV4dFswXVxuICAgIHZhciBzbGlkZUV2ZW50ID0gJC5FdmVudCgnc2xpZGUuYnMuY2Fyb3VzZWwnLCB7XG4gICAgICByZWxhdGVkVGFyZ2V0OiByZWxhdGVkVGFyZ2V0LFxuICAgICAgZGlyZWN0aW9uOiBkaXJlY3Rpb25cbiAgICB9KVxuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcihzbGlkZUV2ZW50KVxuICAgIGlmIChzbGlkZUV2ZW50LmlzRGVmYXVsdFByZXZlbnRlZCgpKSByZXR1cm5cblxuICAgIHRoaXMuc2xpZGluZyA9IHRydWVcblxuICAgIGlzQ3ljbGluZyAmJiB0aGlzLnBhdXNlKClcblxuICAgIGlmICh0aGlzLiRpbmRpY2F0b3JzLmxlbmd0aCkge1xuICAgICAgdGhpcy4kaW5kaWNhdG9ycy5maW5kKCcuYWN0aXZlJykucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpXG4gICAgICB2YXIgJG5leHRJbmRpY2F0b3IgPSAkKHRoaXMuJGluZGljYXRvcnMuY2hpbGRyZW4oKVt0aGlzLmdldEl0ZW1JbmRleCgkbmV4dCldKVxuICAgICAgJG5leHRJbmRpY2F0b3IgJiYgJG5leHRJbmRpY2F0b3IuYWRkQ2xhc3MoJ2FjdGl2ZScpXG4gICAgfVxuXG4gICAgdmFyIHNsaWRFdmVudCA9ICQuRXZlbnQoJ3NsaWQuYnMuY2Fyb3VzZWwnLCB7IHJlbGF0ZWRUYXJnZXQ6IHJlbGF0ZWRUYXJnZXQsIGRpcmVjdGlvbjogZGlyZWN0aW9uIH0pIC8vIHllcywgXCJzbGlkXCJcbiAgICBpZiAoJC5zdXBwb3J0LnRyYW5zaXRpb24gJiYgdGhpcy4kZWxlbWVudC5oYXNDbGFzcygnc2xpZGUnKSkge1xuICAgICAgJG5leHQuYWRkQ2xhc3ModHlwZSlcbiAgICAgIGlmICh0eXBlb2YgJG5leHQgPT09ICdvYmplY3QnICYmICRuZXh0Lmxlbmd0aCkge1xuICAgICAgICAkbmV4dFswXS5vZmZzZXRXaWR0aCAvLyBmb3JjZSByZWZsb3dcbiAgICAgIH1cbiAgICAgICRhY3RpdmUuYWRkQ2xhc3MoZGlyZWN0aW9uKVxuICAgICAgJG5leHQuYWRkQ2xhc3MoZGlyZWN0aW9uKVxuICAgICAgJGFjdGl2ZVxuICAgICAgICAub25lKCdic1RyYW5zaXRpb25FbmQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgJG5leHQucmVtb3ZlQ2xhc3MoW3R5cGUsIGRpcmVjdGlvbl0uam9pbignICcpKS5hZGRDbGFzcygnYWN0aXZlJylcbiAgICAgICAgICAkYWN0aXZlLnJlbW92ZUNsYXNzKFsnYWN0aXZlJywgZGlyZWN0aW9uXS5qb2luKCcgJykpXG4gICAgICAgICAgdGhhdC5zbGlkaW5nID0gZmFsc2VcbiAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoYXQuJGVsZW1lbnQudHJpZ2dlcihzbGlkRXZlbnQpXG4gICAgICAgICAgfSwgMClcbiAgICAgICAgfSlcbiAgICAgICAgLmVtdWxhdGVUcmFuc2l0aW9uRW5kKENhcm91c2VsLlRSQU5TSVRJT05fRFVSQVRJT04pXG4gICAgfSBlbHNlIHtcbiAgICAgICRhY3RpdmUucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpXG4gICAgICAkbmV4dC5hZGRDbGFzcygnYWN0aXZlJylcbiAgICAgIHRoaXMuc2xpZGluZyA9IGZhbHNlXG4gICAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoc2xpZEV2ZW50KVxuICAgIH1cblxuICAgIGlzQ3ljbGluZyAmJiB0aGlzLmN5Y2xlKClcblxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuXG4gIC8vIENBUk9VU0VMIFBMVUdJTiBERUZJTklUSU9OXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgZnVuY3Rpb24gUGx1Z2luKG9wdGlvbikge1xuICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgdmFyICR0aGlzICAgPSAkKHRoaXMpXG4gICAgICB2YXIgZGF0YSAgICA9ICR0aGlzLmRhdGEoJ2JzLmNhcm91c2VsJylcbiAgICAgIHZhciBvcHRpb25zID0gJC5leHRlbmQoe30sIENhcm91c2VsLkRFRkFVTFRTLCAkdGhpcy5kYXRhKCksIHR5cGVvZiBvcHRpb24gPT0gJ29iamVjdCcgJiYgb3B0aW9uKVxuICAgICAgdmFyIGFjdGlvbiAgPSB0eXBlb2Ygb3B0aW9uID09ICdzdHJpbmcnID8gb3B0aW9uIDogb3B0aW9ucy5zbGlkZVxuXG4gICAgICBpZiAoIWRhdGEpICR0aGlzLmRhdGEoJ2JzLmNhcm91c2VsJywgKGRhdGEgPSBuZXcgQ2Fyb3VzZWwodGhpcywgb3B0aW9ucykpKVxuICAgICAgaWYgKHR5cGVvZiBvcHRpb24gPT0gJ251bWJlcicpIGRhdGEudG8ob3B0aW9uKVxuICAgICAgZWxzZSBpZiAoYWN0aW9uKSBkYXRhW2FjdGlvbl0oKVxuICAgICAgZWxzZSBpZiAob3B0aW9ucy5pbnRlcnZhbCkgZGF0YS5wYXVzZSgpLmN5Y2xlKClcbiAgICB9KVxuICB9XG5cbiAgdmFyIG9sZCA9ICQuZm4uY2Fyb3VzZWxcblxuICAkLmZuLmNhcm91c2VsICAgICAgICAgICAgID0gUGx1Z2luXG4gICQuZm4uY2Fyb3VzZWwuQ29uc3RydWN0b3IgPSBDYXJvdXNlbFxuXG5cbiAgLy8gQ0FST1VTRUwgTk8gQ09ORkxJQ1RcbiAgLy8gPT09PT09PT09PT09PT09PT09PT1cblxuICAkLmZuLmNhcm91c2VsLm5vQ29uZmxpY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgJC5mbi5jYXJvdXNlbCA9IG9sZFxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuXG4gIC8vIENBUk9VU0VMIERBVEEtQVBJXG4gIC8vID09PT09PT09PT09PT09PT09XG5cbiAgdmFyIGNsaWNrSGFuZGxlciA9IGZ1bmN0aW9uIChlKSB7XG4gICAgdmFyICR0aGlzICAgPSAkKHRoaXMpXG4gICAgdmFyIGhyZWYgICAgPSAkdGhpcy5hdHRyKCdocmVmJylcbiAgICBpZiAoaHJlZikge1xuICAgICAgaHJlZiA9IGhyZWYucmVwbGFjZSgvLiooPz0jW15cXHNdKyQpLywgJycpIC8vIHN0cmlwIGZvciBpZTdcbiAgICB9XG5cbiAgICB2YXIgdGFyZ2V0ICA9ICR0aGlzLmF0dHIoJ2RhdGEtdGFyZ2V0JykgfHwgaHJlZlxuICAgIHZhciAkdGFyZ2V0ID0gJChkb2N1bWVudCkuZmluZCh0YXJnZXQpXG5cbiAgICBpZiAoISR0YXJnZXQuaGFzQ2xhc3MoJ2Nhcm91c2VsJykpIHJldHVyblxuXG4gICAgdmFyIG9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgJHRhcmdldC5kYXRhKCksICR0aGlzLmRhdGEoKSlcbiAgICB2YXIgc2xpZGVJbmRleCA9ICR0aGlzLmF0dHIoJ2RhdGEtc2xpZGUtdG8nKVxuICAgIGlmIChzbGlkZUluZGV4KSBvcHRpb25zLmludGVydmFsID0gZmFsc2VcblxuICAgIFBsdWdpbi5jYWxsKCR0YXJnZXQsIG9wdGlvbnMpXG5cbiAgICBpZiAoc2xpZGVJbmRleCkge1xuICAgICAgJHRhcmdldC5kYXRhKCdicy5jYXJvdXNlbCcpLnRvKHNsaWRlSW5kZXgpXG4gICAgfVxuXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gIH1cblxuICAkKGRvY3VtZW50KVxuICAgIC5vbignY2xpY2suYnMuY2Fyb3VzZWwuZGF0YS1hcGknLCAnW2RhdGEtc2xpZGVdJywgY2xpY2tIYW5kbGVyKVxuICAgIC5vbignY2xpY2suYnMuY2Fyb3VzZWwuZGF0YS1hcGknLCAnW2RhdGEtc2xpZGUtdG9dJywgY2xpY2tIYW5kbGVyKVxuXG4gICQod2luZG93KS5vbignbG9hZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAkKCdbZGF0YS1yaWRlPVwiY2Fyb3VzZWxcIl0nKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciAkY2Fyb3VzZWwgPSAkKHRoaXMpXG4gICAgICBQbHVnaW4uY2FsbCgkY2Fyb3VzZWwsICRjYXJvdXNlbC5kYXRhKCkpXG4gICAgfSlcbiAgfSlcblxufShqUXVlcnkpO1xuXG4vKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIEJvb3RzdHJhcDogY29sbGFwc2UuanMgdjMuNC4xXG4gKiBodHRwczovL2dldGJvb3RzdHJhcC5jb20vZG9jcy8zLjQvamF2YXNjcmlwdC8jY29sbGFwc2VcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogQ29weXJpZ2h0IDIwMTEtMjAxOSBUd2l0dGVyLCBJbmMuXG4gKiBMaWNlbnNlZCB1bmRlciBNSVQgKGh0dHBzOi8vZ2l0aHViLmNvbS90d2JzL2Jvb3RzdHJhcC9ibG9iL21hc3Rlci9MSUNFTlNFKVxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovXG5cbi8qIGpzaGludCBsYXRlZGVmOiBmYWxzZSAqL1xuXG4rZnVuY3Rpb24gKCQpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIC8vIENPTExBUFNFIFBVQkxJQyBDTEFTUyBERUZJTklUSU9OXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgdmFyIENvbGxhcHNlID0gZnVuY3Rpb24gKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLiRlbGVtZW50ICAgICAgPSAkKGVsZW1lbnQpXG4gICAgdGhpcy5vcHRpb25zICAgICAgID0gJC5leHRlbmQoe30sIENvbGxhcHNlLkRFRkFVTFRTLCBvcHRpb25zKVxuICAgIHRoaXMuJHRyaWdnZXIgICAgICA9ICQoJ1tkYXRhLXRvZ2dsZT1cImNvbGxhcHNlXCJdW2hyZWY9XCIjJyArIGVsZW1lbnQuaWQgKyAnXCJdLCcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgJ1tkYXRhLXRvZ2dsZT1cImNvbGxhcHNlXCJdW2RhdGEtdGFyZ2V0PVwiIycgKyBlbGVtZW50LmlkICsgJ1wiXScpXG4gICAgdGhpcy50cmFuc2l0aW9uaW5nID0gbnVsbFxuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5wYXJlbnQpIHtcbiAgICAgIHRoaXMuJHBhcmVudCA9IHRoaXMuZ2V0UGFyZW50KClcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5hZGRBcmlhQW5kQ29sbGFwc2VkQ2xhc3ModGhpcy4kZWxlbWVudCwgdGhpcy4kdHJpZ2dlcilcbiAgICB9XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLnRvZ2dsZSkgdGhpcy50b2dnbGUoKVxuICB9XG5cbiAgQ29sbGFwc2UuVkVSU0lPTiAgPSAnMy40LjEnXG5cbiAgQ29sbGFwc2UuVFJBTlNJVElPTl9EVVJBVElPTiA9IDM1MFxuXG4gIENvbGxhcHNlLkRFRkFVTFRTID0ge1xuICAgIHRvZ2dsZTogdHJ1ZVxuICB9XG5cbiAgQ29sbGFwc2UucHJvdG90eXBlLmRpbWVuc2lvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgaGFzV2lkdGggPSB0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKCd3aWR0aCcpXG4gICAgcmV0dXJuIGhhc1dpZHRoID8gJ3dpZHRoJyA6ICdoZWlnaHQnXG4gIH1cblxuICBDb2xsYXBzZS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy50cmFuc2l0aW9uaW5nIHx8IHRoaXMuJGVsZW1lbnQuaGFzQ2xhc3MoJ2luJykpIHJldHVyblxuXG4gICAgdmFyIGFjdGl2ZXNEYXRhXG4gICAgdmFyIGFjdGl2ZXMgPSB0aGlzLiRwYXJlbnQgJiYgdGhpcy4kcGFyZW50LmNoaWxkcmVuKCcucGFuZWwnKS5jaGlsZHJlbignLmluLCAuY29sbGFwc2luZycpXG5cbiAgICBpZiAoYWN0aXZlcyAmJiBhY3RpdmVzLmxlbmd0aCkge1xuICAgICAgYWN0aXZlc0RhdGEgPSBhY3RpdmVzLmRhdGEoJ2JzLmNvbGxhcHNlJylcbiAgICAgIGlmIChhY3RpdmVzRGF0YSAmJiBhY3RpdmVzRGF0YS50cmFuc2l0aW9uaW5nKSByZXR1cm5cbiAgICB9XG5cbiAgICB2YXIgc3RhcnRFdmVudCA9ICQuRXZlbnQoJ3Nob3cuYnMuY29sbGFwc2UnKVxuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcihzdGFydEV2ZW50KVxuICAgIGlmIChzdGFydEV2ZW50LmlzRGVmYXVsdFByZXZlbnRlZCgpKSByZXR1cm5cblxuICAgIGlmIChhY3RpdmVzICYmIGFjdGl2ZXMubGVuZ3RoKSB7XG4gICAgICBQbHVnaW4uY2FsbChhY3RpdmVzLCAnaGlkZScpXG4gICAgICBhY3RpdmVzRGF0YSB8fCBhY3RpdmVzLmRhdGEoJ2JzLmNvbGxhcHNlJywgbnVsbClcbiAgICB9XG5cbiAgICB2YXIgZGltZW5zaW9uID0gdGhpcy5kaW1lbnNpb24oKVxuXG4gICAgdGhpcy4kZWxlbWVudFxuICAgICAgLnJlbW92ZUNsYXNzKCdjb2xsYXBzZScpXG4gICAgICAuYWRkQ2xhc3MoJ2NvbGxhcHNpbmcnKVtkaW1lbnNpb25dKDApXG4gICAgICAuYXR0cignYXJpYS1leHBhbmRlZCcsIHRydWUpXG5cbiAgICB0aGlzLiR0cmlnZ2VyXG4gICAgICAucmVtb3ZlQ2xhc3MoJ2NvbGxhcHNlZCcpXG4gICAgICAuYXR0cignYXJpYS1leHBhbmRlZCcsIHRydWUpXG5cbiAgICB0aGlzLnRyYW5zaXRpb25pbmcgPSAxXG5cbiAgICB2YXIgY29tcGxldGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLiRlbGVtZW50XG4gICAgICAgIC5yZW1vdmVDbGFzcygnY29sbGFwc2luZycpXG4gICAgICAgIC5hZGRDbGFzcygnY29sbGFwc2UgaW4nKVtkaW1lbnNpb25dKCcnKVxuICAgICAgdGhpcy50cmFuc2l0aW9uaW5nID0gMFxuICAgICAgdGhpcy4kZWxlbWVudFxuICAgICAgICAudHJpZ2dlcignc2hvd24uYnMuY29sbGFwc2UnKVxuICAgIH1cblxuICAgIGlmICghJC5zdXBwb3J0LnRyYW5zaXRpb24pIHJldHVybiBjb21wbGV0ZS5jYWxsKHRoaXMpXG5cbiAgICB2YXIgc2Nyb2xsU2l6ZSA9ICQuY2FtZWxDYXNlKFsnc2Nyb2xsJywgZGltZW5zaW9uXS5qb2luKCctJykpXG5cbiAgICB0aGlzLiRlbGVtZW50XG4gICAgICAub25lKCdic1RyYW5zaXRpb25FbmQnLCAkLnByb3h5KGNvbXBsZXRlLCB0aGlzKSlcbiAgICAgIC5lbXVsYXRlVHJhbnNpdGlvbkVuZChDb2xsYXBzZS5UUkFOU0lUSU9OX0RVUkFUSU9OKVtkaW1lbnNpb25dKHRoaXMuJGVsZW1lbnRbMF1bc2Nyb2xsU2l6ZV0pXG4gIH1cblxuICBDb2xsYXBzZS5wcm90b3R5cGUuaGlkZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy50cmFuc2l0aW9uaW5nIHx8ICF0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKCdpbicpKSByZXR1cm5cblxuICAgIHZhciBzdGFydEV2ZW50ID0gJC5FdmVudCgnaGlkZS5icy5jb2xsYXBzZScpXG4gICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKHN0YXJ0RXZlbnQpXG4gICAgaWYgKHN0YXJ0RXZlbnQuaXNEZWZhdWx0UHJldmVudGVkKCkpIHJldHVyblxuXG4gICAgdmFyIGRpbWVuc2lvbiA9IHRoaXMuZGltZW5zaW9uKClcblxuICAgIHRoaXMuJGVsZW1lbnRbZGltZW5zaW9uXSh0aGlzLiRlbGVtZW50W2RpbWVuc2lvbl0oKSlbMF0ub2Zmc2V0SGVpZ2h0XG5cbiAgICB0aGlzLiRlbGVtZW50XG4gICAgICAuYWRkQ2xhc3MoJ2NvbGxhcHNpbmcnKVxuICAgICAgLnJlbW92ZUNsYXNzKCdjb2xsYXBzZSBpbicpXG4gICAgICAuYXR0cignYXJpYS1leHBhbmRlZCcsIGZhbHNlKVxuXG4gICAgdGhpcy4kdHJpZ2dlclxuICAgICAgLmFkZENsYXNzKCdjb2xsYXBzZWQnKVxuICAgICAgLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCBmYWxzZSlcblxuICAgIHRoaXMudHJhbnNpdGlvbmluZyA9IDFcblxuICAgIHZhciBjb21wbGV0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMudHJhbnNpdGlvbmluZyA9IDBcbiAgICAgIHRoaXMuJGVsZW1lbnRcbiAgICAgICAgLnJlbW92ZUNsYXNzKCdjb2xsYXBzaW5nJylcbiAgICAgICAgLmFkZENsYXNzKCdjb2xsYXBzZScpXG4gICAgICAgIC50cmlnZ2VyKCdoaWRkZW4uYnMuY29sbGFwc2UnKVxuICAgIH1cblxuICAgIGlmICghJC5zdXBwb3J0LnRyYW5zaXRpb24pIHJldHVybiBjb21wbGV0ZS5jYWxsKHRoaXMpXG5cbiAgICB0aGlzLiRlbGVtZW50XG4gICAgICBbZGltZW5zaW9uXSgwKVxuICAgICAgLm9uZSgnYnNUcmFuc2l0aW9uRW5kJywgJC5wcm94eShjb21wbGV0ZSwgdGhpcykpXG4gICAgICAuZW11bGF0ZVRyYW5zaXRpb25FbmQoQ29sbGFwc2UuVFJBTlNJVElPTl9EVVJBVElPTilcbiAgfVxuXG4gIENvbGxhcHNlLnByb3RvdHlwZS50b2dnbGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpc1t0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKCdpbicpID8gJ2hpZGUnIDogJ3Nob3cnXSgpXG4gIH1cblxuICBDb2xsYXBzZS5wcm90b3R5cGUuZ2V0UGFyZW50ID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAkKGRvY3VtZW50KS5maW5kKHRoaXMub3B0aW9ucy5wYXJlbnQpXG4gICAgICAuZmluZCgnW2RhdGEtdG9nZ2xlPVwiY29sbGFwc2VcIl1bZGF0YS1wYXJlbnQ9XCInICsgdGhpcy5vcHRpb25zLnBhcmVudCArICdcIl0nKVxuICAgICAgLmVhY2goJC5wcm94eShmdW5jdGlvbiAoaSwgZWxlbWVudCkge1xuICAgICAgICB2YXIgJGVsZW1lbnQgPSAkKGVsZW1lbnQpXG4gICAgICAgIHRoaXMuYWRkQXJpYUFuZENvbGxhcHNlZENsYXNzKGdldFRhcmdldEZyb21UcmlnZ2VyKCRlbGVtZW50KSwgJGVsZW1lbnQpXG4gICAgICB9LCB0aGlzKSlcbiAgICAgIC5lbmQoKVxuICB9XG5cbiAgQ29sbGFwc2UucHJvdG90eXBlLmFkZEFyaWFBbmRDb2xsYXBzZWRDbGFzcyA9IGZ1bmN0aW9uICgkZWxlbWVudCwgJHRyaWdnZXIpIHtcbiAgICB2YXIgaXNPcGVuID0gJGVsZW1lbnQuaGFzQ2xhc3MoJ2luJylcblxuICAgICRlbGVtZW50LmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCBpc09wZW4pXG4gICAgJHRyaWdnZXJcbiAgICAgIC50b2dnbGVDbGFzcygnY29sbGFwc2VkJywgIWlzT3BlbilcbiAgICAgIC5hdHRyKCdhcmlhLWV4cGFuZGVkJywgaXNPcGVuKVxuICB9XG5cbiAgZnVuY3Rpb24gZ2V0VGFyZ2V0RnJvbVRyaWdnZXIoJHRyaWdnZXIpIHtcbiAgICB2YXIgaHJlZlxuICAgIHZhciB0YXJnZXQgPSAkdHJpZ2dlci5hdHRyKCdkYXRhLXRhcmdldCcpXG4gICAgICB8fCAoaHJlZiA9ICR0cmlnZ2VyLmF0dHIoJ2hyZWYnKSkgJiYgaHJlZi5yZXBsYWNlKC8uKig/PSNbXlxcc10rJCkvLCAnJykgLy8gc3RyaXAgZm9yIGllN1xuXG4gICAgcmV0dXJuICQoZG9jdW1lbnQpLmZpbmQodGFyZ2V0KVxuICB9XG5cblxuICAvLyBDT0xMQVBTRSBQTFVHSU4gREVGSU5JVElPTlxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gIGZ1bmN0aW9uIFBsdWdpbihvcHRpb24pIHtcbiAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciAkdGhpcyAgID0gJCh0aGlzKVxuICAgICAgdmFyIGRhdGEgICAgPSAkdGhpcy5kYXRhKCdicy5jb2xsYXBzZScpXG4gICAgICB2YXIgb3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBDb2xsYXBzZS5ERUZBVUxUUywgJHRoaXMuZGF0YSgpLCB0eXBlb2Ygb3B0aW9uID09ICdvYmplY3QnICYmIG9wdGlvbilcblxuICAgICAgaWYgKCFkYXRhICYmIG9wdGlvbnMudG9nZ2xlICYmIC9zaG93fGhpZGUvLnRlc3Qob3B0aW9uKSkgb3B0aW9ucy50b2dnbGUgPSBmYWxzZVxuICAgICAgaWYgKCFkYXRhKSAkdGhpcy5kYXRhKCdicy5jb2xsYXBzZScsIChkYXRhID0gbmV3IENvbGxhcHNlKHRoaXMsIG9wdGlvbnMpKSlcbiAgICAgIGlmICh0eXBlb2Ygb3B0aW9uID09ICdzdHJpbmcnKSBkYXRhW29wdGlvbl0oKVxuICAgIH0pXG4gIH1cblxuICB2YXIgb2xkID0gJC5mbi5jb2xsYXBzZVxuXG4gICQuZm4uY29sbGFwc2UgICAgICAgICAgICAgPSBQbHVnaW5cbiAgJC5mbi5jb2xsYXBzZS5Db25zdHJ1Y3RvciA9IENvbGxhcHNlXG5cblxuICAvLyBDT0xMQVBTRSBOTyBDT05GTElDVFxuICAvLyA9PT09PT09PT09PT09PT09PT09PVxuXG4gICQuZm4uY29sbGFwc2Uubm9Db25mbGljdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAkLmZuLmNvbGxhcHNlID0gb2xkXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG5cbiAgLy8gQ09MTEFQU0UgREFUQS1BUElcbiAgLy8gPT09PT09PT09PT09PT09PT1cblxuICAkKGRvY3VtZW50KS5vbignY2xpY2suYnMuY29sbGFwc2UuZGF0YS1hcGknLCAnW2RhdGEtdG9nZ2xlPVwiY29sbGFwc2VcIl0nLCBmdW5jdGlvbiAoZSkge1xuICAgIHZhciAkdGhpcyAgID0gJCh0aGlzKVxuXG4gICAgaWYgKCEkdGhpcy5hdHRyKCdkYXRhLXRhcmdldCcpKSBlLnByZXZlbnREZWZhdWx0KClcblxuICAgIHZhciAkdGFyZ2V0ID0gZ2V0VGFyZ2V0RnJvbVRyaWdnZXIoJHRoaXMpXG4gICAgdmFyIGRhdGEgICAgPSAkdGFyZ2V0LmRhdGEoJ2JzLmNvbGxhcHNlJylcbiAgICB2YXIgb3B0aW9uICA9IGRhdGEgPyAndG9nZ2xlJyA6ICR0aGlzLmRhdGEoKVxuXG4gICAgUGx1Z2luLmNhbGwoJHRhcmdldCwgb3B0aW9uKVxuICB9KVxuXG59KGpRdWVyeSk7XG5cbi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogQm9vdHN0cmFwOiBkcm9wZG93bi5qcyB2My40LjFcbiAqIGh0dHBzOi8vZ2V0Ym9vdHN0cmFwLmNvbS9kb2NzLzMuNC9qYXZhc2NyaXB0LyNkcm9wZG93bnNcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogQ29weXJpZ2h0IDIwMTEtMjAxOSBUd2l0dGVyLCBJbmMuXG4gKiBMaWNlbnNlZCB1bmRlciBNSVQgKGh0dHBzOi8vZ2l0aHViLmNvbS90d2JzL2Jvb3RzdHJhcC9ibG9iL21hc3Rlci9MSUNFTlNFKVxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovXG5cblxuK2Z1bmN0aW9uICgkKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICAvLyBEUk9QRE9XTiBDTEFTUyBERUZJTklUSU9OXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICB2YXIgYmFja2Ryb3AgPSAnLmRyb3Bkb3duLWJhY2tkcm9wJ1xuICB2YXIgdG9nZ2xlICAgPSAnW2RhdGEtdG9nZ2xlPVwiZHJvcGRvd25cIl0nXG4gIHZhciBEcm9wZG93biA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgJChlbGVtZW50KS5vbignY2xpY2suYnMuZHJvcGRvd24nLCB0aGlzLnRvZ2dsZSlcbiAgfVxuXG4gIERyb3Bkb3duLlZFUlNJT04gPSAnMy40LjEnXG5cbiAgZnVuY3Rpb24gZ2V0UGFyZW50KCR0aGlzKSB7XG4gICAgdmFyIHNlbGVjdG9yID0gJHRoaXMuYXR0cignZGF0YS10YXJnZXQnKVxuXG4gICAgaWYgKCFzZWxlY3Rvcikge1xuICAgICAgc2VsZWN0b3IgPSAkdGhpcy5hdHRyKCdocmVmJylcbiAgICAgIHNlbGVjdG9yID0gc2VsZWN0b3IgJiYgLyNbQS1aYS16XS8udGVzdChzZWxlY3RvcikgJiYgc2VsZWN0b3IucmVwbGFjZSgvLiooPz0jW15cXHNdKiQpLywgJycpIC8vIHN0cmlwIGZvciBpZTdcbiAgICB9XG5cbiAgICB2YXIgJHBhcmVudCA9IHNlbGVjdG9yICE9PSAnIycgPyAkKGRvY3VtZW50KS5maW5kKHNlbGVjdG9yKSA6IG51bGxcblxuICAgIHJldHVybiAkcGFyZW50ICYmICRwYXJlbnQubGVuZ3RoID8gJHBhcmVudCA6ICR0aGlzLnBhcmVudCgpXG4gIH1cblxuICBmdW5jdGlvbiBjbGVhck1lbnVzKGUpIHtcbiAgICBpZiAoZSAmJiBlLndoaWNoID09PSAzKSByZXR1cm5cbiAgICAkKGJhY2tkcm9wKS5yZW1vdmUoKVxuICAgICQodG9nZ2xlKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciAkdGhpcyAgICAgICAgID0gJCh0aGlzKVxuICAgICAgdmFyICRwYXJlbnQgICAgICAgPSBnZXRQYXJlbnQoJHRoaXMpXG4gICAgICB2YXIgcmVsYXRlZFRhcmdldCA9IHsgcmVsYXRlZFRhcmdldDogdGhpcyB9XG5cbiAgICAgIGlmICghJHBhcmVudC5oYXNDbGFzcygnb3BlbicpKSByZXR1cm5cblxuICAgICAgaWYgKGUgJiYgZS50eXBlID09ICdjbGljaycgJiYgL2lucHV0fHRleHRhcmVhL2kudGVzdChlLnRhcmdldC50YWdOYW1lKSAmJiAkLmNvbnRhaW5zKCRwYXJlbnRbMF0sIGUudGFyZ2V0KSkgcmV0dXJuXG5cbiAgICAgICRwYXJlbnQudHJpZ2dlcihlID0gJC5FdmVudCgnaGlkZS5icy5kcm9wZG93bicsIHJlbGF0ZWRUYXJnZXQpKVxuXG4gICAgICBpZiAoZS5pc0RlZmF1bHRQcmV2ZW50ZWQoKSkgcmV0dXJuXG5cbiAgICAgICR0aGlzLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCAnZmFsc2UnKVxuICAgICAgJHBhcmVudC5yZW1vdmVDbGFzcygnb3BlbicpLnRyaWdnZXIoJC5FdmVudCgnaGlkZGVuLmJzLmRyb3Bkb3duJywgcmVsYXRlZFRhcmdldCkpXG4gICAgfSlcbiAgfVxuXG4gIERyb3Bkb3duLnByb3RvdHlwZS50b2dnbGUgPSBmdW5jdGlvbiAoZSkge1xuICAgIHZhciAkdGhpcyA9ICQodGhpcylcblxuICAgIGlmICgkdGhpcy5pcygnLmRpc2FibGVkLCA6ZGlzYWJsZWQnKSkgcmV0dXJuXG5cbiAgICB2YXIgJHBhcmVudCAgPSBnZXRQYXJlbnQoJHRoaXMpXG4gICAgdmFyIGlzQWN0aXZlID0gJHBhcmVudC5oYXNDbGFzcygnb3BlbicpXG5cbiAgICBjbGVhck1lbnVzKClcblxuICAgIGlmICghaXNBY3RpdmUpIHtcbiAgICAgIGlmICgnb250b3VjaHN0YXJ0JyBpbiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgJiYgISRwYXJlbnQuY2xvc2VzdCgnLm5hdmJhci1uYXYnKS5sZW5ndGgpIHtcbiAgICAgICAgLy8gaWYgbW9iaWxlIHdlIHVzZSBhIGJhY2tkcm9wIGJlY2F1c2UgY2xpY2sgZXZlbnRzIGRvbid0IGRlbGVnYXRlXG4gICAgICAgICQoZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JykpXG4gICAgICAgICAgLmFkZENsYXNzKCdkcm9wZG93bi1iYWNrZHJvcCcpXG4gICAgICAgICAgLmluc2VydEFmdGVyKCQodGhpcykpXG4gICAgICAgICAgLm9uKCdjbGljaycsIGNsZWFyTWVudXMpXG4gICAgICB9XG5cbiAgICAgIHZhciByZWxhdGVkVGFyZ2V0ID0geyByZWxhdGVkVGFyZ2V0OiB0aGlzIH1cbiAgICAgICRwYXJlbnQudHJpZ2dlcihlID0gJC5FdmVudCgnc2hvdy5icy5kcm9wZG93bicsIHJlbGF0ZWRUYXJnZXQpKVxuXG4gICAgICBpZiAoZS5pc0RlZmF1bHRQcmV2ZW50ZWQoKSkgcmV0dXJuXG5cbiAgICAgICR0aGlzXG4gICAgICAgIC50cmlnZ2VyKCdmb2N1cycpXG4gICAgICAgIC5hdHRyKCdhcmlhLWV4cGFuZGVkJywgJ3RydWUnKVxuXG4gICAgICAkcGFyZW50XG4gICAgICAgIC50b2dnbGVDbGFzcygnb3BlbicpXG4gICAgICAgIC50cmlnZ2VyKCQuRXZlbnQoJ3Nob3duLmJzLmRyb3Bkb3duJywgcmVsYXRlZFRhcmdldCkpXG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICBEcm9wZG93bi5wcm90b3R5cGUua2V5ZG93biA9IGZ1bmN0aW9uIChlKSB7XG4gICAgaWYgKCEvKDM4fDQwfDI3fDMyKS8udGVzdChlLndoaWNoKSB8fCAvaW5wdXR8dGV4dGFyZWEvaS50ZXN0KGUudGFyZ2V0LnRhZ05hbWUpKSByZXR1cm5cblxuICAgIHZhciAkdGhpcyA9ICQodGhpcylcblxuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcblxuICAgIGlmICgkdGhpcy5pcygnLmRpc2FibGVkLCA6ZGlzYWJsZWQnKSkgcmV0dXJuXG5cbiAgICB2YXIgJHBhcmVudCAgPSBnZXRQYXJlbnQoJHRoaXMpXG4gICAgdmFyIGlzQWN0aXZlID0gJHBhcmVudC5oYXNDbGFzcygnb3BlbicpXG5cbiAgICBpZiAoIWlzQWN0aXZlICYmIGUud2hpY2ggIT0gMjcgfHwgaXNBY3RpdmUgJiYgZS53aGljaCA9PSAyNykge1xuICAgICAgaWYgKGUud2hpY2ggPT0gMjcpICRwYXJlbnQuZmluZCh0b2dnbGUpLnRyaWdnZXIoJ2ZvY3VzJylcbiAgICAgIHJldHVybiAkdGhpcy50cmlnZ2VyKCdjbGljaycpXG4gICAgfVxuXG4gICAgdmFyIGRlc2MgPSAnIGxpOm5vdCguZGlzYWJsZWQpOnZpc2libGUgYSdcbiAgICB2YXIgJGl0ZW1zID0gJHBhcmVudC5maW5kKCcuZHJvcGRvd24tbWVudScgKyBkZXNjKVxuXG4gICAgaWYgKCEkaXRlbXMubGVuZ3RoKSByZXR1cm5cblxuICAgIHZhciBpbmRleCA9ICRpdGVtcy5pbmRleChlLnRhcmdldClcblxuICAgIGlmIChlLndoaWNoID09IDM4ICYmIGluZGV4ID4gMCkgICAgICAgICAgICAgICAgIGluZGV4LS0gICAgICAgICAvLyB1cFxuICAgIGlmIChlLndoaWNoID09IDQwICYmIGluZGV4IDwgJGl0ZW1zLmxlbmd0aCAtIDEpIGluZGV4KysgICAgICAgICAvLyBkb3duXG4gICAgaWYgKCF+aW5kZXgpICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXggPSAwXG5cbiAgICAkaXRlbXMuZXEoaW5kZXgpLnRyaWdnZXIoJ2ZvY3VzJylcbiAgfVxuXG5cbiAgLy8gRFJPUERPV04gUExVR0lOIERFRklOSVRJT05cbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICBmdW5jdGlvbiBQbHVnaW4ob3B0aW9uKSB7XG4gICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgJHRoaXMgPSAkKHRoaXMpXG4gICAgICB2YXIgZGF0YSAgPSAkdGhpcy5kYXRhKCdicy5kcm9wZG93bicpXG5cbiAgICAgIGlmICghZGF0YSkgJHRoaXMuZGF0YSgnYnMuZHJvcGRvd24nLCAoZGF0YSA9IG5ldyBEcm9wZG93bih0aGlzKSkpXG4gICAgICBpZiAodHlwZW9mIG9wdGlvbiA9PSAnc3RyaW5nJykgZGF0YVtvcHRpb25dLmNhbGwoJHRoaXMpXG4gICAgfSlcbiAgfVxuXG4gIHZhciBvbGQgPSAkLmZuLmRyb3Bkb3duXG5cbiAgJC5mbi5kcm9wZG93biAgICAgICAgICAgICA9IFBsdWdpblxuICAkLmZuLmRyb3Bkb3duLkNvbnN0cnVjdG9yID0gRHJvcGRvd25cblxuXG4gIC8vIERST1BET1dOIE5PIENPTkZMSUNUXG4gIC8vID09PT09PT09PT09PT09PT09PT09XG5cbiAgJC5mbi5kcm9wZG93bi5ub0NvbmZsaWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICQuZm4uZHJvcGRvd24gPSBvbGRcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cblxuICAvLyBBUFBMWSBUTyBTVEFOREFSRCBEUk9QRE9XTiBFTEVNRU5UU1xuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gICQoZG9jdW1lbnQpXG4gICAgLm9uKCdjbGljay5icy5kcm9wZG93bi5kYXRhLWFwaScsIGNsZWFyTWVudXMpXG4gICAgLm9uKCdjbGljay5icy5kcm9wZG93bi5kYXRhLWFwaScsICcuZHJvcGRvd24gZm9ybScsIGZ1bmN0aW9uIChlKSB7IGUuc3RvcFByb3BhZ2F0aW9uKCkgfSlcbiAgICAub24oJ2NsaWNrLmJzLmRyb3Bkb3duLmRhdGEtYXBpJywgdG9nZ2xlLCBEcm9wZG93bi5wcm90b3R5cGUudG9nZ2xlKVxuICAgIC5vbigna2V5ZG93bi5icy5kcm9wZG93bi5kYXRhLWFwaScsIHRvZ2dsZSwgRHJvcGRvd24ucHJvdG90eXBlLmtleWRvd24pXG4gICAgLm9uKCdrZXlkb3duLmJzLmRyb3Bkb3duLmRhdGEtYXBpJywgJy5kcm9wZG93bi1tZW51JywgRHJvcGRvd24ucHJvdG90eXBlLmtleWRvd24pXG5cbn0oalF1ZXJ5KTtcblxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBCb290c3RyYXA6IG1vZGFsLmpzIHYzLjQuMVxuICogaHR0cHM6Ly9nZXRib290c3RyYXAuY29tL2RvY3MvMy40L2phdmFzY3JpcHQvI21vZGFsc1xuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBDb3B5cmlnaHQgMjAxMS0yMDE5IFR3aXR0ZXIsIEluYy5cbiAqIExpY2Vuc2VkIHVuZGVyIE1JVCAoaHR0cHM6Ly9naXRodWIuY29tL3R3YnMvYm9vdHN0cmFwL2Jsb2IvbWFzdGVyL0xJQ0VOU0UpXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi9cblxuXG4rZnVuY3Rpb24gKCQpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIC8vIE1PREFMIENMQVNTIERFRklOSVRJT05cbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PVxuXG4gIHZhciBNb2RhbCA9IGZ1bmN0aW9uIChlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9uc1xuICAgIHRoaXMuJGJvZHkgPSAkKGRvY3VtZW50LmJvZHkpXG4gICAgdGhpcy4kZWxlbWVudCA9ICQoZWxlbWVudClcbiAgICB0aGlzLiRkaWFsb2cgPSB0aGlzLiRlbGVtZW50LmZpbmQoJy5tb2RhbC1kaWFsb2cnKVxuICAgIHRoaXMuJGJhY2tkcm9wID0gbnVsbFxuICAgIHRoaXMuaXNTaG93biA9IG51bGxcbiAgICB0aGlzLm9yaWdpbmFsQm9keVBhZCA9IG51bGxcbiAgICB0aGlzLnNjcm9sbGJhcldpZHRoID0gMFxuICAgIHRoaXMuaWdub3JlQmFja2Ryb3BDbGljayA9IGZhbHNlXG4gICAgdGhpcy5maXhlZENvbnRlbnQgPSAnLm5hdmJhci1maXhlZC10b3AsIC5uYXZiYXItZml4ZWQtYm90dG9tJ1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5yZW1vdGUpIHtcbiAgICAgIHRoaXMuJGVsZW1lbnRcbiAgICAgICAgLmZpbmQoJy5tb2RhbC1jb250ZW50JylcbiAgICAgICAgLmxvYWQodGhpcy5vcHRpb25zLnJlbW90ZSwgJC5wcm94eShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdsb2FkZWQuYnMubW9kYWwnKVxuICAgICAgICB9LCB0aGlzKSlcbiAgICB9XG4gIH1cblxuICBNb2RhbC5WRVJTSU9OID0gJzMuNC4xJ1xuXG4gIE1vZGFsLlRSQU5TSVRJT05fRFVSQVRJT04gPSAzMDBcbiAgTW9kYWwuQkFDS0RST1BfVFJBTlNJVElPTl9EVVJBVElPTiA9IDE1MFxuXG4gIE1vZGFsLkRFRkFVTFRTID0ge1xuICAgIGJhY2tkcm9wOiB0cnVlLFxuICAgIGtleWJvYXJkOiB0cnVlLFxuICAgIHNob3c6IHRydWVcbiAgfVxuXG4gIE1vZGFsLnByb3RvdHlwZS50b2dnbGUgPSBmdW5jdGlvbiAoX3JlbGF0ZWRUYXJnZXQpIHtcbiAgICByZXR1cm4gdGhpcy5pc1Nob3duID8gdGhpcy5oaWRlKCkgOiB0aGlzLnNob3coX3JlbGF0ZWRUYXJnZXQpXG4gIH1cblxuICBNb2RhbC5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIChfcmVsYXRlZFRhcmdldCkge1xuICAgIHZhciB0aGF0ID0gdGhpc1xuICAgIHZhciBlID0gJC5FdmVudCgnc2hvdy5icy5tb2RhbCcsIHsgcmVsYXRlZFRhcmdldDogX3JlbGF0ZWRUYXJnZXQgfSlcblxuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcihlKVxuXG4gICAgaWYgKHRoaXMuaXNTaG93biB8fCBlLmlzRGVmYXVsdFByZXZlbnRlZCgpKSByZXR1cm5cblxuICAgIHRoaXMuaXNTaG93biA9IHRydWVcblxuICAgIHRoaXMuY2hlY2tTY3JvbGxiYXIoKVxuICAgIHRoaXMuc2V0U2Nyb2xsYmFyKClcbiAgICB0aGlzLiRib2R5LmFkZENsYXNzKCdtb2RhbC1vcGVuJylcblxuICAgIHRoaXMuZXNjYXBlKClcbiAgICB0aGlzLnJlc2l6ZSgpXG5cbiAgICB0aGlzLiRlbGVtZW50Lm9uKCdjbGljay5kaXNtaXNzLmJzLm1vZGFsJywgJ1tkYXRhLWRpc21pc3M9XCJtb2RhbFwiXScsICQucHJveHkodGhpcy5oaWRlLCB0aGlzKSlcblxuICAgIHRoaXMuJGRpYWxvZy5vbignbW91c2Vkb3duLmRpc21pc3MuYnMubW9kYWwnLCBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGF0LiRlbGVtZW50Lm9uZSgnbW91c2V1cC5kaXNtaXNzLmJzLm1vZGFsJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgaWYgKCQoZS50YXJnZXQpLmlzKHRoYXQuJGVsZW1lbnQpKSB0aGF0Lmlnbm9yZUJhY2tkcm9wQ2xpY2sgPSB0cnVlXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICB0aGlzLmJhY2tkcm9wKGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciB0cmFuc2l0aW9uID0gJC5zdXBwb3J0LnRyYW5zaXRpb24gJiYgdGhhdC4kZWxlbWVudC5oYXNDbGFzcygnZmFkZScpXG5cbiAgICAgIGlmICghdGhhdC4kZWxlbWVudC5wYXJlbnQoKS5sZW5ndGgpIHtcbiAgICAgICAgdGhhdC4kZWxlbWVudC5hcHBlbmRUbyh0aGF0LiRib2R5KSAvLyBkb24ndCBtb3ZlIG1vZGFscyBkb20gcG9zaXRpb25cbiAgICAgIH1cblxuICAgICAgdGhhdC4kZWxlbWVudFxuICAgICAgICAuc2hvdygpXG4gICAgICAgIC5zY3JvbGxUb3AoMClcblxuICAgICAgdGhhdC5hZGp1c3REaWFsb2coKVxuXG4gICAgICBpZiAodHJhbnNpdGlvbikge1xuICAgICAgICB0aGF0LiRlbGVtZW50WzBdLm9mZnNldFdpZHRoIC8vIGZvcmNlIHJlZmxvd1xuICAgICAgfVxuXG4gICAgICB0aGF0LiRlbGVtZW50LmFkZENsYXNzKCdpbicpXG5cbiAgICAgIHRoYXQuZW5mb3JjZUZvY3VzKClcblxuICAgICAgdmFyIGUgPSAkLkV2ZW50KCdzaG93bi5icy5tb2RhbCcsIHsgcmVsYXRlZFRhcmdldDogX3JlbGF0ZWRUYXJnZXQgfSlcblxuICAgICAgdHJhbnNpdGlvbiA/XG4gICAgICAgIHRoYXQuJGRpYWxvZyAvLyB3YWl0IGZvciBtb2RhbCB0byBzbGlkZSBpblxuICAgICAgICAgIC5vbmUoJ2JzVHJhbnNpdGlvbkVuZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoYXQuJGVsZW1lbnQudHJpZ2dlcignZm9jdXMnKS50cmlnZ2VyKGUpXG4gICAgICAgICAgfSlcbiAgICAgICAgICAuZW11bGF0ZVRyYW5zaXRpb25FbmQoTW9kYWwuVFJBTlNJVElPTl9EVVJBVElPTikgOlxuICAgICAgICB0aGF0LiRlbGVtZW50LnRyaWdnZXIoJ2ZvY3VzJykudHJpZ2dlcihlKVxuICAgIH0pXG4gIH1cblxuICBNb2RhbC5wcm90b3R5cGUuaGlkZSA9IGZ1bmN0aW9uIChlKSB7XG4gICAgaWYgKGUpIGUucHJldmVudERlZmF1bHQoKVxuXG4gICAgZSA9ICQuRXZlbnQoJ2hpZGUuYnMubW9kYWwnKVxuXG4gICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKGUpXG5cbiAgICBpZiAoIXRoaXMuaXNTaG93biB8fCBlLmlzRGVmYXVsdFByZXZlbnRlZCgpKSByZXR1cm5cblxuICAgIHRoaXMuaXNTaG93biA9IGZhbHNlXG5cbiAgICB0aGlzLmVzY2FwZSgpXG4gICAgdGhpcy5yZXNpemUoKVxuXG4gICAgJChkb2N1bWVudCkub2ZmKCdmb2N1c2luLmJzLm1vZGFsJylcblxuICAgIHRoaXMuJGVsZW1lbnRcbiAgICAgIC5yZW1vdmVDbGFzcygnaW4nKVxuICAgICAgLm9mZignY2xpY2suZGlzbWlzcy5icy5tb2RhbCcpXG4gICAgICAub2ZmKCdtb3VzZXVwLmRpc21pc3MuYnMubW9kYWwnKVxuXG4gICAgdGhpcy4kZGlhbG9nLm9mZignbW91c2Vkb3duLmRpc21pc3MuYnMubW9kYWwnKVxuXG4gICAgJC5zdXBwb3J0LnRyYW5zaXRpb24gJiYgdGhpcy4kZWxlbWVudC5oYXNDbGFzcygnZmFkZScpID9cbiAgICAgIHRoaXMuJGVsZW1lbnRcbiAgICAgICAgLm9uZSgnYnNUcmFuc2l0aW9uRW5kJywgJC5wcm94eSh0aGlzLmhpZGVNb2RhbCwgdGhpcykpXG4gICAgICAgIC5lbXVsYXRlVHJhbnNpdGlvbkVuZChNb2RhbC5UUkFOU0lUSU9OX0RVUkFUSU9OKSA6XG4gICAgICB0aGlzLmhpZGVNb2RhbCgpXG4gIH1cblxuICBNb2RhbC5wcm90b3R5cGUuZW5mb3JjZUZvY3VzID0gZnVuY3Rpb24gKCkge1xuICAgICQoZG9jdW1lbnQpXG4gICAgICAub2ZmKCdmb2N1c2luLmJzLm1vZGFsJykgLy8gZ3VhcmQgYWdhaW5zdCBpbmZpbml0ZSBmb2N1cyBsb29wXG4gICAgICAub24oJ2ZvY3VzaW4uYnMubW9kYWwnLCAkLnByb3h5KGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGlmIChkb2N1bWVudCAhPT0gZS50YXJnZXQgJiZcbiAgICAgICAgICB0aGlzLiRlbGVtZW50WzBdICE9PSBlLnRhcmdldCAmJlxuICAgICAgICAgICF0aGlzLiRlbGVtZW50LmhhcyhlLnRhcmdldCkubGVuZ3RoKSB7XG4gICAgICAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdmb2N1cycpXG4gICAgICAgIH1cbiAgICAgIH0sIHRoaXMpKVxuICB9XG5cbiAgTW9kYWwucHJvdG90eXBlLmVzY2FwZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5pc1Nob3duICYmIHRoaXMub3B0aW9ucy5rZXlib2FyZCkge1xuICAgICAgdGhpcy4kZWxlbWVudC5vbigna2V5ZG93bi5kaXNtaXNzLmJzLm1vZGFsJywgJC5wcm94eShmdW5jdGlvbiAoZSkge1xuICAgICAgICBlLndoaWNoID09IDI3ICYmIHRoaXMuaGlkZSgpXG4gICAgICB9LCB0aGlzKSlcbiAgICB9IGVsc2UgaWYgKCF0aGlzLmlzU2hvd24pIHtcbiAgICAgIHRoaXMuJGVsZW1lbnQub2ZmKCdrZXlkb3duLmRpc21pc3MuYnMubW9kYWwnKVxuICAgIH1cbiAgfVxuXG4gIE1vZGFsLnByb3RvdHlwZS5yZXNpemUgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMuaXNTaG93bikge1xuICAgICAgJCh3aW5kb3cpLm9uKCdyZXNpemUuYnMubW9kYWwnLCAkLnByb3h5KHRoaXMuaGFuZGxlVXBkYXRlLCB0aGlzKSlcbiAgICB9IGVsc2Uge1xuICAgICAgJCh3aW5kb3cpLm9mZigncmVzaXplLmJzLm1vZGFsJylcbiAgICB9XG4gIH1cblxuICBNb2RhbC5wcm90b3R5cGUuaGlkZU1vZGFsID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciB0aGF0ID0gdGhpc1xuICAgIHRoaXMuJGVsZW1lbnQuaGlkZSgpXG4gICAgdGhpcy5iYWNrZHJvcChmdW5jdGlvbiAoKSB7XG4gICAgICB0aGF0LiRib2R5LnJlbW92ZUNsYXNzKCdtb2RhbC1vcGVuJylcbiAgICAgIHRoYXQucmVzZXRBZGp1c3RtZW50cygpXG4gICAgICB0aGF0LnJlc2V0U2Nyb2xsYmFyKClcbiAgICAgIHRoYXQuJGVsZW1lbnQudHJpZ2dlcignaGlkZGVuLmJzLm1vZGFsJylcbiAgICB9KVxuICB9XG5cbiAgTW9kYWwucHJvdG90eXBlLnJlbW92ZUJhY2tkcm9wID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuJGJhY2tkcm9wICYmIHRoaXMuJGJhY2tkcm9wLnJlbW92ZSgpXG4gICAgdGhpcy4kYmFja2Ryb3AgPSBudWxsXG4gIH1cblxuICBNb2RhbC5wcm90b3R5cGUuYmFja2Ryb3AgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICB2YXIgdGhhdCA9IHRoaXNcbiAgICB2YXIgYW5pbWF0ZSA9IHRoaXMuJGVsZW1lbnQuaGFzQ2xhc3MoJ2ZhZGUnKSA/ICdmYWRlJyA6ICcnXG5cbiAgICBpZiAodGhpcy5pc1Nob3duICYmIHRoaXMub3B0aW9ucy5iYWNrZHJvcCkge1xuICAgICAgdmFyIGRvQW5pbWF0ZSA9ICQuc3VwcG9ydC50cmFuc2l0aW9uICYmIGFuaW1hdGVcblxuICAgICAgdGhpcy4kYmFja2Ryb3AgPSAkKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpKVxuICAgICAgICAuYWRkQ2xhc3MoJ21vZGFsLWJhY2tkcm9wICcgKyBhbmltYXRlKVxuICAgICAgICAuYXBwZW5kVG8odGhpcy4kYm9keSlcblxuICAgICAgdGhpcy4kZWxlbWVudC5vbignY2xpY2suZGlzbWlzcy5icy5tb2RhbCcsICQucHJveHkoZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgaWYgKHRoaXMuaWdub3JlQmFja2Ryb3BDbGljaykge1xuICAgICAgICAgIHRoaXMuaWdub3JlQmFja2Ryb3BDbGljayA9IGZhbHNlXG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgaWYgKGUudGFyZ2V0ICE9PSBlLmN1cnJlbnRUYXJnZXQpIHJldHVyblxuICAgICAgICB0aGlzLm9wdGlvbnMuYmFja2Ryb3AgPT0gJ3N0YXRpYydcbiAgICAgICAgICA/IHRoaXMuJGVsZW1lbnRbMF0uZm9jdXMoKVxuICAgICAgICAgIDogdGhpcy5oaWRlKClcbiAgICAgIH0sIHRoaXMpKVxuXG4gICAgICBpZiAoZG9BbmltYXRlKSB0aGlzLiRiYWNrZHJvcFswXS5vZmZzZXRXaWR0aCAvLyBmb3JjZSByZWZsb3dcblxuICAgICAgdGhpcy4kYmFja2Ryb3AuYWRkQ2xhc3MoJ2luJylcblxuICAgICAgaWYgKCFjYWxsYmFjaykgcmV0dXJuXG5cbiAgICAgIGRvQW5pbWF0ZSA/XG4gICAgICAgIHRoaXMuJGJhY2tkcm9wXG4gICAgICAgICAgLm9uZSgnYnNUcmFuc2l0aW9uRW5kJywgY2FsbGJhY2spXG4gICAgICAgICAgLmVtdWxhdGVUcmFuc2l0aW9uRW5kKE1vZGFsLkJBQ0tEUk9QX1RSQU5TSVRJT05fRFVSQVRJT04pIDpcbiAgICAgICAgY2FsbGJhY2soKVxuXG4gICAgfSBlbHNlIGlmICghdGhpcy5pc1Nob3duICYmIHRoaXMuJGJhY2tkcm9wKSB7XG4gICAgICB0aGlzLiRiYWNrZHJvcC5yZW1vdmVDbGFzcygnaW4nKVxuXG4gICAgICB2YXIgY2FsbGJhY2tSZW1vdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoYXQucmVtb3ZlQmFja2Ryb3AoKVxuICAgICAgICBjYWxsYmFjayAmJiBjYWxsYmFjaygpXG4gICAgICB9XG4gICAgICAkLnN1cHBvcnQudHJhbnNpdGlvbiAmJiB0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKCdmYWRlJykgP1xuICAgICAgICB0aGlzLiRiYWNrZHJvcFxuICAgICAgICAgIC5vbmUoJ2JzVHJhbnNpdGlvbkVuZCcsIGNhbGxiYWNrUmVtb3ZlKVxuICAgICAgICAgIC5lbXVsYXRlVHJhbnNpdGlvbkVuZChNb2RhbC5CQUNLRFJPUF9UUkFOU0lUSU9OX0RVUkFUSU9OKSA6XG4gICAgICAgIGNhbGxiYWNrUmVtb3ZlKClcblxuICAgIH0gZWxzZSBpZiAoY2FsbGJhY2spIHtcbiAgICAgIGNhbGxiYWNrKClcbiAgICB9XG4gIH1cblxuICAvLyB0aGVzZSBmb2xsb3dpbmcgbWV0aG9kcyBhcmUgdXNlZCB0byBoYW5kbGUgb3ZlcmZsb3dpbmcgbW9kYWxzXG5cbiAgTW9kYWwucHJvdG90eXBlLmhhbmRsZVVwZGF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmFkanVzdERpYWxvZygpXG4gIH1cblxuICBNb2RhbC5wcm90b3R5cGUuYWRqdXN0RGlhbG9nID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBtb2RhbElzT3ZlcmZsb3dpbmcgPSB0aGlzLiRlbGVtZW50WzBdLnNjcm9sbEhlaWdodCA+IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHRcblxuICAgIHRoaXMuJGVsZW1lbnQuY3NzKHtcbiAgICAgIHBhZGRpbmdMZWZ0OiAhdGhpcy5ib2R5SXNPdmVyZmxvd2luZyAmJiBtb2RhbElzT3ZlcmZsb3dpbmcgPyB0aGlzLnNjcm9sbGJhcldpZHRoIDogJycsXG4gICAgICBwYWRkaW5nUmlnaHQ6IHRoaXMuYm9keUlzT3ZlcmZsb3dpbmcgJiYgIW1vZGFsSXNPdmVyZmxvd2luZyA/IHRoaXMuc2Nyb2xsYmFyV2lkdGggOiAnJ1xuICAgIH0pXG4gIH1cblxuICBNb2RhbC5wcm90b3R5cGUucmVzZXRBZGp1c3RtZW50cyA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLiRlbGVtZW50LmNzcyh7XG4gICAgICBwYWRkaW5nTGVmdDogJycsXG4gICAgICBwYWRkaW5nUmlnaHQ6ICcnXG4gICAgfSlcbiAgfVxuXG4gIE1vZGFsLnByb3RvdHlwZS5jaGVja1Njcm9sbGJhciA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZnVsbFdpbmRvd1dpZHRoID0gd2luZG93LmlubmVyV2lkdGhcbiAgICBpZiAoIWZ1bGxXaW5kb3dXaWR0aCkgeyAvLyB3b3JrYXJvdW5kIGZvciBtaXNzaW5nIHdpbmRvdy5pbm5lcldpZHRoIGluIElFOFxuICAgICAgdmFyIGRvY3VtZW50RWxlbWVudFJlY3QgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgIGZ1bGxXaW5kb3dXaWR0aCA9IGRvY3VtZW50RWxlbWVudFJlY3QucmlnaHQgLSBNYXRoLmFicyhkb2N1bWVudEVsZW1lbnRSZWN0LmxlZnQpXG4gICAgfVxuICAgIHRoaXMuYm9keUlzT3ZlcmZsb3dpbmcgPSBkb2N1bWVudC5ib2R5LmNsaWVudFdpZHRoIDwgZnVsbFdpbmRvd1dpZHRoXG4gICAgdGhpcy5zY3JvbGxiYXJXaWR0aCA9IHRoaXMubWVhc3VyZVNjcm9sbGJhcigpXG4gIH1cblxuICBNb2RhbC5wcm90b3R5cGUuc2V0U2Nyb2xsYmFyID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBib2R5UGFkID0gcGFyc2VJbnQoKHRoaXMuJGJvZHkuY3NzKCdwYWRkaW5nLXJpZ2h0JykgfHwgMCksIDEwKVxuICAgIHRoaXMub3JpZ2luYWxCb2R5UGFkID0gZG9jdW1lbnQuYm9keS5zdHlsZS5wYWRkaW5nUmlnaHQgfHwgJydcbiAgICB2YXIgc2Nyb2xsYmFyV2lkdGggPSB0aGlzLnNjcm9sbGJhcldpZHRoXG4gICAgaWYgKHRoaXMuYm9keUlzT3ZlcmZsb3dpbmcpIHtcbiAgICAgIHRoaXMuJGJvZHkuY3NzKCdwYWRkaW5nLXJpZ2h0JywgYm9keVBhZCArIHNjcm9sbGJhcldpZHRoKVxuICAgICAgJCh0aGlzLmZpeGVkQ29udGVudCkuZWFjaChmdW5jdGlvbiAoaW5kZXgsIGVsZW1lbnQpIHtcbiAgICAgICAgdmFyIGFjdHVhbFBhZGRpbmcgPSBlbGVtZW50LnN0eWxlLnBhZGRpbmdSaWdodFxuICAgICAgICB2YXIgY2FsY3VsYXRlZFBhZGRpbmcgPSAkKGVsZW1lbnQpLmNzcygncGFkZGluZy1yaWdodCcpXG4gICAgICAgICQoZWxlbWVudClcbiAgICAgICAgICAuZGF0YSgncGFkZGluZy1yaWdodCcsIGFjdHVhbFBhZGRpbmcpXG4gICAgICAgICAgLmNzcygncGFkZGluZy1yaWdodCcsIHBhcnNlRmxvYXQoY2FsY3VsYXRlZFBhZGRpbmcpICsgc2Nyb2xsYmFyV2lkdGggKyAncHgnKVxuICAgICAgfSlcbiAgICB9XG4gIH1cblxuICBNb2RhbC5wcm90b3R5cGUucmVzZXRTY3JvbGxiYXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy4kYm9keS5jc3MoJ3BhZGRpbmctcmlnaHQnLCB0aGlzLm9yaWdpbmFsQm9keVBhZClcbiAgICAkKHRoaXMuZml4ZWRDb250ZW50KS5lYWNoKGZ1bmN0aW9uIChpbmRleCwgZWxlbWVudCkge1xuICAgICAgdmFyIHBhZGRpbmcgPSAkKGVsZW1lbnQpLmRhdGEoJ3BhZGRpbmctcmlnaHQnKVxuICAgICAgJChlbGVtZW50KS5yZW1vdmVEYXRhKCdwYWRkaW5nLXJpZ2h0JylcbiAgICAgIGVsZW1lbnQuc3R5bGUucGFkZGluZ1JpZ2h0ID0gcGFkZGluZyA/IHBhZGRpbmcgOiAnJ1xuICAgIH0pXG4gIH1cblxuICBNb2RhbC5wcm90b3R5cGUubWVhc3VyZVNjcm9sbGJhciA9IGZ1bmN0aW9uICgpIHsgLy8gdGh4IHdhbHNoXG4gICAgdmFyIHNjcm9sbERpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgc2Nyb2xsRGl2LmNsYXNzTmFtZSA9ICdtb2RhbC1zY3JvbGxiYXItbWVhc3VyZSdcbiAgICB0aGlzLiRib2R5LmFwcGVuZChzY3JvbGxEaXYpXG4gICAgdmFyIHNjcm9sbGJhcldpZHRoID0gc2Nyb2xsRGl2Lm9mZnNldFdpZHRoIC0gc2Nyb2xsRGl2LmNsaWVudFdpZHRoXG4gICAgdGhpcy4kYm9keVswXS5yZW1vdmVDaGlsZChzY3JvbGxEaXYpXG4gICAgcmV0dXJuIHNjcm9sbGJhcldpZHRoXG4gIH1cblxuXG4gIC8vIE1PREFMIFBMVUdJTiBERUZJTklUSU9OXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgZnVuY3Rpb24gUGx1Z2luKG9wdGlvbiwgX3JlbGF0ZWRUYXJnZXQpIHtcbiAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciAkdGhpcyA9ICQodGhpcylcbiAgICAgIHZhciBkYXRhID0gJHRoaXMuZGF0YSgnYnMubW9kYWwnKVxuICAgICAgdmFyIG9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgTW9kYWwuREVGQVVMVFMsICR0aGlzLmRhdGEoKSwgdHlwZW9mIG9wdGlvbiA9PSAnb2JqZWN0JyAmJiBvcHRpb24pXG5cbiAgICAgIGlmICghZGF0YSkgJHRoaXMuZGF0YSgnYnMubW9kYWwnLCAoZGF0YSA9IG5ldyBNb2RhbCh0aGlzLCBvcHRpb25zKSkpXG4gICAgICBpZiAodHlwZW9mIG9wdGlvbiA9PSAnc3RyaW5nJykgZGF0YVtvcHRpb25dKF9yZWxhdGVkVGFyZ2V0KVxuICAgICAgZWxzZSBpZiAob3B0aW9ucy5zaG93KSBkYXRhLnNob3coX3JlbGF0ZWRUYXJnZXQpXG4gICAgfSlcbiAgfVxuXG4gIHZhciBvbGQgPSAkLmZuLm1vZGFsXG5cbiAgJC5mbi5tb2RhbCA9IFBsdWdpblxuICAkLmZuLm1vZGFsLkNvbnN0cnVjdG9yID0gTW9kYWxcblxuXG4gIC8vIE1PREFMIE5PIENPTkZMSUNUXG4gIC8vID09PT09PT09PT09PT09PT09XG5cbiAgJC5mbi5tb2RhbC5ub0NvbmZsaWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICQuZm4ubW9kYWwgPSBvbGRcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cblxuICAvLyBNT0RBTCBEQVRBLUFQSVxuICAvLyA9PT09PT09PT09PT09PVxuXG4gICQoZG9jdW1lbnQpLm9uKCdjbGljay5icy5tb2RhbC5kYXRhLWFwaScsICdbZGF0YS10b2dnbGU9XCJtb2RhbFwiXScsIGZ1bmN0aW9uIChlKSB7XG4gICAgdmFyICR0aGlzID0gJCh0aGlzKVxuICAgIHZhciBocmVmID0gJHRoaXMuYXR0cignaHJlZicpXG4gICAgdmFyIHRhcmdldCA9ICR0aGlzLmF0dHIoJ2RhdGEtdGFyZ2V0JykgfHxcbiAgICAgIChocmVmICYmIGhyZWYucmVwbGFjZSgvLiooPz0jW15cXHNdKyQpLywgJycpKSAvLyBzdHJpcCBmb3IgaWU3XG5cbiAgICB2YXIgJHRhcmdldCA9ICQoZG9jdW1lbnQpLmZpbmQodGFyZ2V0KVxuICAgIHZhciBvcHRpb24gPSAkdGFyZ2V0LmRhdGEoJ2JzLm1vZGFsJykgPyAndG9nZ2xlJyA6ICQuZXh0ZW5kKHsgcmVtb3RlOiAhLyMvLnRlc3QoaHJlZikgJiYgaHJlZiB9LCAkdGFyZ2V0LmRhdGEoKSwgJHRoaXMuZGF0YSgpKVxuXG4gICAgaWYgKCR0aGlzLmlzKCdhJykpIGUucHJldmVudERlZmF1bHQoKVxuXG4gICAgJHRhcmdldC5vbmUoJ3Nob3cuYnMubW9kYWwnLCBmdW5jdGlvbiAoc2hvd0V2ZW50KSB7XG4gICAgICBpZiAoc2hvd0V2ZW50LmlzRGVmYXVsdFByZXZlbnRlZCgpKSByZXR1cm4gLy8gb25seSByZWdpc3RlciBmb2N1cyByZXN0b3JlciBpZiBtb2RhbCB3aWxsIGFjdHVhbGx5IGdldCBzaG93blxuICAgICAgJHRhcmdldC5vbmUoJ2hpZGRlbi5icy5tb2RhbCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJHRoaXMuaXMoJzp2aXNpYmxlJykgJiYgJHRoaXMudHJpZ2dlcignZm9jdXMnKVxuICAgICAgfSlcbiAgICB9KVxuICAgIFBsdWdpbi5jYWxsKCR0YXJnZXQsIG9wdGlvbiwgdGhpcylcbiAgfSlcblxufShqUXVlcnkpO1xuXG4vKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIEJvb3RzdHJhcDogdG9vbHRpcC5qcyB2My40LjFcbiAqIGh0dHBzOi8vZ2V0Ym9vdHN0cmFwLmNvbS9kb2NzLzMuNC9qYXZhc2NyaXB0LyN0b29sdGlwXG4gKiBJbnNwaXJlZCBieSB0aGUgb3JpZ2luYWwgalF1ZXJ5LnRpcHN5IGJ5IEphc29uIEZyYW1lXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIENvcHlyaWdodCAyMDExLTIwMTkgVHdpdHRlciwgSW5jLlxuICogTGljZW5zZWQgdW5kZXIgTUlUIChodHRwczovL2dpdGh1Yi5jb20vdHdicy9ib290c3RyYXAvYmxvYi9tYXN0ZXIvTElDRU5TRSlcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqL1xuXG4rZnVuY3Rpb24gKCQpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIHZhciBESVNBTExPV0VEX0FUVFJJQlVURVMgPSBbJ3Nhbml0aXplJywgJ3doaXRlTGlzdCcsICdzYW5pdGl6ZUZuJ11cblxuICB2YXIgdXJpQXR0cnMgPSBbXG4gICAgJ2JhY2tncm91bmQnLFxuICAgICdjaXRlJyxcbiAgICAnaHJlZicsXG4gICAgJ2l0ZW10eXBlJyxcbiAgICAnbG9uZ2Rlc2MnLFxuICAgICdwb3N0ZXInLFxuICAgICdzcmMnLFxuICAgICd4bGluazpocmVmJ1xuICBdXG5cbiAgdmFyIEFSSUFfQVRUUklCVVRFX1BBVFRFUk4gPSAvXmFyaWEtW1xcdy1dKiQvaVxuXG4gIHZhciBEZWZhdWx0V2hpdGVsaXN0ID0ge1xuICAgIC8vIEdsb2JhbCBhdHRyaWJ1dGVzIGFsbG93ZWQgb24gYW55IHN1cHBsaWVkIGVsZW1lbnQgYmVsb3cuXG4gICAgJyonOiBbJ2NsYXNzJywgJ2RpcicsICdpZCcsICdsYW5nJywgJ3JvbGUnLCBBUklBX0FUVFJJQlVURV9QQVRURVJOXSxcbiAgICBhOiBbJ3RhcmdldCcsICdocmVmJywgJ3RpdGxlJywgJ3JlbCddLFxuICAgIGFyZWE6IFtdLFxuICAgIGI6IFtdLFxuICAgIGJyOiBbXSxcbiAgICBjb2w6IFtdLFxuICAgIGNvZGU6IFtdLFxuICAgIGRpdjogW10sXG4gICAgZW06IFtdLFxuICAgIGhyOiBbXSxcbiAgICBoMTogW10sXG4gICAgaDI6IFtdLFxuICAgIGgzOiBbXSxcbiAgICBoNDogW10sXG4gICAgaDU6IFtdLFxuICAgIGg2OiBbXSxcbiAgICBpOiBbXSxcbiAgICBpbWc6IFsnc3JjJywgJ2FsdCcsICd0aXRsZScsICd3aWR0aCcsICdoZWlnaHQnXSxcbiAgICBsaTogW10sXG4gICAgb2w6IFtdLFxuICAgIHA6IFtdLFxuICAgIHByZTogW10sXG4gICAgczogW10sXG4gICAgc21hbGw6IFtdLFxuICAgIHNwYW46IFtdLFxuICAgIHN1YjogW10sXG4gICAgc3VwOiBbXSxcbiAgICBzdHJvbmc6IFtdLFxuICAgIHU6IFtdLFxuICAgIHVsOiBbXVxuICB9XG5cbiAgLyoqXG4gICAqIEEgcGF0dGVybiB0aGF0IHJlY29nbml6ZXMgYSBjb21tb25seSB1c2VmdWwgc3Vic2V0IG9mIFVSTHMgdGhhdCBhcmUgc2FmZS5cbiAgICpcbiAgICogU2hvdXRvdXQgdG8gQW5ndWxhciA3IGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2FuZ3VsYXIvYmxvYi83LjIuNC9wYWNrYWdlcy9jb3JlL3NyYy9zYW5pdGl6YXRpb24vdXJsX3Nhbml0aXplci50c1xuICAgKi9cbiAgdmFyIFNBRkVfVVJMX1BBVFRFUk4gPSAvXig/Oig/Omh0dHBzP3xtYWlsdG98ZnRwfHRlbHxmaWxlKTp8W14mOi8/I10qKD86Wy8/I118JCkpL2dpXG5cbiAgLyoqXG4gICAqIEEgcGF0dGVybiB0aGF0IG1hdGNoZXMgc2FmZSBkYXRhIFVSTHMuIE9ubHkgbWF0Y2hlcyBpbWFnZSwgdmlkZW8gYW5kIGF1ZGlvIHR5cGVzLlxuICAgKlxuICAgKiBTaG91dG91dCB0byBBbmd1bGFyIDcgaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvYW5ndWxhci9ibG9iLzcuMi40L3BhY2thZ2VzL2NvcmUvc3JjL3Nhbml0aXphdGlvbi91cmxfc2FuaXRpemVyLnRzXG4gICAqL1xuICB2YXIgREFUQV9VUkxfUEFUVEVSTiA9IC9eZGF0YTooPzppbWFnZVxcLyg/OmJtcHxnaWZ8anBlZ3xqcGd8cG5nfHRpZmZ8d2VicCl8dmlkZW9cXC8oPzptcGVnfG1wNHxvZ2d8d2VibSl8YXVkaW9cXC8oPzptcDN8b2dhfG9nZ3xvcHVzKSk7YmFzZTY0LFthLXowLTkrL10rPSokL2lcblxuICBmdW5jdGlvbiBhbGxvd2VkQXR0cmlidXRlKGF0dHIsIGFsbG93ZWRBdHRyaWJ1dGVMaXN0KSB7XG4gICAgdmFyIGF0dHJOYW1lID0gYXR0ci5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpXG5cbiAgICBpZiAoJC5pbkFycmF5KGF0dHJOYW1lLCBhbGxvd2VkQXR0cmlidXRlTGlzdCkgIT09IC0xKSB7XG4gICAgICBpZiAoJC5pbkFycmF5KGF0dHJOYW1lLCB1cmlBdHRycykgIT09IC0xKSB7XG4gICAgICAgIHJldHVybiBCb29sZWFuKGF0dHIubm9kZVZhbHVlLm1hdGNoKFNBRkVfVVJMX1BBVFRFUk4pIHx8IGF0dHIubm9kZVZhbHVlLm1hdGNoKERBVEFfVVJMX1BBVFRFUk4pKVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cblxuICAgIHZhciByZWdFeHAgPSAkKGFsbG93ZWRBdHRyaWJ1dGVMaXN0KS5maWx0ZXIoZnVuY3Rpb24gKGluZGV4LCB2YWx1ZSkge1xuICAgICAgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgUmVnRXhwXG4gICAgfSlcblxuICAgIC8vIENoZWNrIGlmIGEgcmVndWxhciBleHByZXNzaW9uIHZhbGlkYXRlcyB0aGUgYXR0cmlidXRlLlxuICAgIGZvciAodmFyIGkgPSAwLCBsID0gcmVnRXhwLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgaWYgKGF0dHJOYW1lLm1hdGNoKHJlZ0V4cFtpXSkpIHtcbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIGZ1bmN0aW9uIHNhbml0aXplSHRtbCh1bnNhZmVIdG1sLCB3aGl0ZUxpc3QsIHNhbml0aXplRm4pIHtcbiAgICBpZiAodW5zYWZlSHRtbC5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiB1bnNhZmVIdG1sXG4gICAgfVxuXG4gICAgaWYgKHNhbml0aXplRm4gJiYgdHlwZW9mIHNhbml0aXplRm4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiBzYW5pdGl6ZUZuKHVuc2FmZUh0bWwpXG4gICAgfVxuXG4gICAgLy8gSUUgOCBhbmQgYmVsb3cgZG9uJ3Qgc3VwcG9ydCBjcmVhdGVIVE1MRG9jdW1lbnRcbiAgICBpZiAoIWRvY3VtZW50LmltcGxlbWVudGF0aW9uIHx8ICFkb2N1bWVudC5pbXBsZW1lbnRhdGlvbi5jcmVhdGVIVE1MRG9jdW1lbnQpIHtcbiAgICAgIHJldHVybiB1bnNhZmVIdG1sXG4gICAgfVxuXG4gICAgdmFyIGNyZWF0ZWREb2N1bWVudCA9IGRvY3VtZW50LmltcGxlbWVudGF0aW9uLmNyZWF0ZUhUTUxEb2N1bWVudCgnc2FuaXRpemF0aW9uJylcbiAgICBjcmVhdGVkRG9jdW1lbnQuYm9keS5pbm5lckhUTUwgPSB1bnNhZmVIdG1sXG5cbiAgICB2YXIgd2hpdGVsaXN0S2V5cyA9ICQubWFwKHdoaXRlTGlzdCwgZnVuY3Rpb24gKGVsLCBpKSB7IHJldHVybiBpIH0pXG4gICAgdmFyIGVsZW1lbnRzID0gJChjcmVhdGVkRG9jdW1lbnQuYm9keSkuZmluZCgnKicpXG5cbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gZWxlbWVudHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIHZhciBlbCA9IGVsZW1lbnRzW2ldXG4gICAgICB2YXIgZWxOYW1lID0gZWwubm9kZU5hbWUudG9Mb3dlckNhc2UoKVxuXG4gICAgICBpZiAoJC5pbkFycmF5KGVsTmFtZSwgd2hpdGVsaXN0S2V5cykgPT09IC0xKSB7XG4gICAgICAgIGVsLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoZWwpXG5cbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgdmFyIGF0dHJpYnV0ZUxpc3QgPSAkLm1hcChlbC5hdHRyaWJ1dGVzLCBmdW5jdGlvbiAoZWwpIHsgcmV0dXJuIGVsIH0pXG4gICAgICB2YXIgd2hpdGVsaXN0ZWRBdHRyaWJ1dGVzID0gW10uY29uY2F0KHdoaXRlTGlzdFsnKiddIHx8IFtdLCB3aGl0ZUxpc3RbZWxOYW1lXSB8fCBbXSlcblxuICAgICAgZm9yICh2YXIgaiA9IDAsIGxlbjIgPSBhdHRyaWJ1dGVMaXN0Lmxlbmd0aDsgaiA8IGxlbjI7IGorKykge1xuICAgICAgICBpZiAoIWFsbG93ZWRBdHRyaWJ1dGUoYXR0cmlidXRlTGlzdFtqXSwgd2hpdGVsaXN0ZWRBdHRyaWJ1dGVzKSkge1xuICAgICAgICAgIGVsLnJlbW92ZUF0dHJpYnV0ZShhdHRyaWJ1dGVMaXN0W2pdLm5vZGVOYW1lKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGNyZWF0ZWREb2N1bWVudC5ib2R5LmlubmVySFRNTFxuICB9XG5cbiAgLy8gVE9PTFRJUCBQVUJMSUMgQ0xBU1MgREVGSU5JVElPTlxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgdmFyIFRvb2x0aXAgPSBmdW5jdGlvbiAoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIHRoaXMudHlwZSAgICAgICA9IG51bGxcbiAgICB0aGlzLm9wdGlvbnMgICAgPSBudWxsXG4gICAgdGhpcy5lbmFibGVkICAgID0gbnVsbFxuICAgIHRoaXMudGltZW91dCAgICA9IG51bGxcbiAgICB0aGlzLmhvdmVyU3RhdGUgPSBudWxsXG4gICAgdGhpcy4kZWxlbWVudCAgID0gbnVsbFxuICAgIHRoaXMuaW5TdGF0ZSAgICA9IG51bGxcblxuICAgIHRoaXMuaW5pdCgndG9vbHRpcCcsIGVsZW1lbnQsIG9wdGlvbnMpXG4gIH1cblxuICBUb29sdGlwLlZFUlNJT04gID0gJzMuNC4xJ1xuXG4gIFRvb2x0aXAuVFJBTlNJVElPTl9EVVJBVElPTiA9IDE1MFxuXG4gIFRvb2x0aXAuREVGQVVMVFMgPSB7XG4gICAgYW5pbWF0aW9uOiB0cnVlLFxuICAgIHBsYWNlbWVudDogJ3RvcCcsXG4gICAgc2VsZWN0b3I6IGZhbHNlLFxuICAgIHRlbXBsYXRlOiAnPGRpdiBjbGFzcz1cInRvb2x0aXBcIiByb2xlPVwidG9vbHRpcFwiPjxkaXYgY2xhc3M9XCJ0b29sdGlwLWFycm93XCI+PC9kaXY+PGRpdiBjbGFzcz1cInRvb2x0aXAtaW5uZXJcIj48L2Rpdj48L2Rpdj4nLFxuICAgIHRyaWdnZXI6ICdob3ZlciBmb2N1cycsXG4gICAgdGl0bGU6ICcnLFxuICAgIGRlbGF5OiAwLFxuICAgIGh0bWw6IGZhbHNlLFxuICAgIGNvbnRhaW5lcjogZmFsc2UsXG4gICAgdmlld3BvcnQ6IHtcbiAgICAgIHNlbGVjdG9yOiAnYm9keScsXG4gICAgICBwYWRkaW5nOiAwXG4gICAgfSxcbiAgICBzYW5pdGl6ZSA6IHRydWUsXG4gICAgc2FuaXRpemVGbiA6IG51bGwsXG4gICAgd2hpdGVMaXN0IDogRGVmYXVsdFdoaXRlbGlzdFxuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uICh0eXBlLCBlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy5lbmFibGVkICAgPSB0cnVlXG4gICAgdGhpcy50eXBlICAgICAgPSB0eXBlXG4gICAgdGhpcy4kZWxlbWVudCAgPSAkKGVsZW1lbnQpXG4gICAgdGhpcy5vcHRpb25zICAgPSB0aGlzLmdldE9wdGlvbnMob3B0aW9ucylcbiAgICB0aGlzLiR2aWV3cG9ydCA9IHRoaXMub3B0aW9ucy52aWV3cG9ydCAmJiAkKGRvY3VtZW50KS5maW5kKCQuaXNGdW5jdGlvbih0aGlzLm9wdGlvbnMudmlld3BvcnQpID8gdGhpcy5vcHRpb25zLnZpZXdwb3J0LmNhbGwodGhpcywgdGhpcy4kZWxlbWVudCkgOiAodGhpcy5vcHRpb25zLnZpZXdwb3J0LnNlbGVjdG9yIHx8IHRoaXMub3B0aW9ucy52aWV3cG9ydCkpXG4gICAgdGhpcy5pblN0YXRlICAgPSB7IGNsaWNrOiBmYWxzZSwgaG92ZXI6IGZhbHNlLCBmb2N1czogZmFsc2UgfVxuXG4gICAgaWYgKHRoaXMuJGVsZW1lbnRbMF0gaW5zdGFuY2VvZiBkb2N1bWVudC5jb25zdHJ1Y3RvciAmJiAhdGhpcy5vcHRpb25zLnNlbGVjdG9yKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2BzZWxlY3RvcmAgb3B0aW9uIG11c3QgYmUgc3BlY2lmaWVkIHdoZW4gaW5pdGlhbGl6aW5nICcgKyB0aGlzLnR5cGUgKyAnIG9uIHRoZSB3aW5kb3cuZG9jdW1lbnQgb2JqZWN0IScpXG4gICAgfVxuXG4gICAgdmFyIHRyaWdnZXJzID0gdGhpcy5vcHRpb25zLnRyaWdnZXIuc3BsaXQoJyAnKVxuXG4gICAgZm9yICh2YXIgaSA9IHRyaWdnZXJzLmxlbmd0aDsgaS0tOykge1xuICAgICAgdmFyIHRyaWdnZXIgPSB0cmlnZ2Vyc1tpXVxuXG4gICAgICBpZiAodHJpZ2dlciA9PSAnY2xpY2snKSB7XG4gICAgICAgIHRoaXMuJGVsZW1lbnQub24oJ2NsaWNrLicgKyB0aGlzLnR5cGUsIHRoaXMub3B0aW9ucy5zZWxlY3RvciwgJC5wcm94eSh0aGlzLnRvZ2dsZSwgdGhpcykpXG4gICAgICB9IGVsc2UgaWYgKHRyaWdnZXIgIT0gJ21hbnVhbCcpIHtcbiAgICAgICAgdmFyIGV2ZW50SW4gID0gdHJpZ2dlciA9PSAnaG92ZXInID8gJ21vdXNlZW50ZXInIDogJ2ZvY3VzaW4nXG4gICAgICAgIHZhciBldmVudE91dCA9IHRyaWdnZXIgPT0gJ2hvdmVyJyA/ICdtb3VzZWxlYXZlJyA6ICdmb2N1c291dCdcblxuICAgICAgICB0aGlzLiRlbGVtZW50Lm9uKGV2ZW50SW4gICsgJy4nICsgdGhpcy50eXBlLCB0aGlzLm9wdGlvbnMuc2VsZWN0b3IsICQucHJveHkodGhpcy5lbnRlciwgdGhpcykpXG4gICAgICAgIHRoaXMuJGVsZW1lbnQub24oZXZlbnRPdXQgKyAnLicgKyB0aGlzLnR5cGUsIHRoaXMub3B0aW9ucy5zZWxlY3RvciwgJC5wcm94eSh0aGlzLmxlYXZlLCB0aGlzKSlcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLm9wdGlvbnMuc2VsZWN0b3IgP1xuICAgICAgKHRoaXMuX29wdGlvbnMgPSAkLmV4dGVuZCh7fSwgdGhpcy5vcHRpb25zLCB7IHRyaWdnZXI6ICdtYW51YWwnLCBzZWxlY3RvcjogJycgfSkpIDpcbiAgICAgIHRoaXMuZml4VGl0bGUoKVxuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUuZ2V0RGVmYXVsdHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIFRvb2x0aXAuREVGQVVMVFNcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLmdldE9wdGlvbnMgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIHZhciBkYXRhQXR0cmlidXRlcyA9IHRoaXMuJGVsZW1lbnQuZGF0YSgpXG5cbiAgICBmb3IgKHZhciBkYXRhQXR0ciBpbiBkYXRhQXR0cmlidXRlcykge1xuICAgICAgaWYgKGRhdGFBdHRyaWJ1dGVzLmhhc093blByb3BlcnR5KGRhdGFBdHRyKSAmJiAkLmluQXJyYXkoZGF0YUF0dHIsIERJU0FMTE9XRURfQVRUUklCVVRFUykgIT09IC0xKSB7XG4gICAgICAgIGRlbGV0ZSBkYXRhQXR0cmlidXRlc1tkYXRhQXR0cl1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBvcHRpb25zID0gJC5leHRlbmQoe30sIHRoaXMuZ2V0RGVmYXVsdHMoKSwgZGF0YUF0dHJpYnV0ZXMsIG9wdGlvbnMpXG5cbiAgICBpZiAob3B0aW9ucy5kZWxheSAmJiB0eXBlb2Ygb3B0aW9ucy5kZWxheSA9PSAnbnVtYmVyJykge1xuICAgICAgb3B0aW9ucy5kZWxheSA9IHtcbiAgICAgICAgc2hvdzogb3B0aW9ucy5kZWxheSxcbiAgICAgICAgaGlkZTogb3B0aW9ucy5kZWxheVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChvcHRpb25zLnNhbml0aXplKSB7XG4gICAgICBvcHRpb25zLnRlbXBsYXRlID0gc2FuaXRpemVIdG1sKG9wdGlvbnMudGVtcGxhdGUsIG9wdGlvbnMud2hpdGVMaXN0LCBvcHRpb25zLnNhbml0aXplRm4pXG4gICAgfVxuXG4gICAgcmV0dXJuIG9wdGlvbnNcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLmdldERlbGVnYXRlT3B0aW9ucyA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgb3B0aW9ucyAgPSB7fVxuICAgIHZhciBkZWZhdWx0cyA9IHRoaXMuZ2V0RGVmYXVsdHMoKVxuXG4gICAgdGhpcy5fb3B0aW9ucyAmJiAkLmVhY2godGhpcy5fb3B0aW9ucywgZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgIGlmIChkZWZhdWx0c1trZXldICE9IHZhbHVlKSBvcHRpb25zW2tleV0gPSB2YWx1ZVxuICAgIH0pXG5cbiAgICByZXR1cm4gb3B0aW9uc1xuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUuZW50ZXIgPSBmdW5jdGlvbiAob2JqKSB7XG4gICAgdmFyIHNlbGYgPSBvYmogaW5zdGFuY2VvZiB0aGlzLmNvbnN0cnVjdG9yID9cbiAgICAgIG9iaiA6ICQob2JqLmN1cnJlbnRUYXJnZXQpLmRhdGEoJ2JzLicgKyB0aGlzLnR5cGUpXG5cbiAgICBpZiAoIXNlbGYpIHtcbiAgICAgIHNlbGYgPSBuZXcgdGhpcy5jb25zdHJ1Y3RvcihvYmouY3VycmVudFRhcmdldCwgdGhpcy5nZXREZWxlZ2F0ZU9wdGlvbnMoKSlcbiAgICAgICQob2JqLmN1cnJlbnRUYXJnZXQpLmRhdGEoJ2JzLicgKyB0aGlzLnR5cGUsIHNlbGYpXG4gICAgfVxuXG4gICAgaWYgKG9iaiBpbnN0YW5jZW9mICQuRXZlbnQpIHtcbiAgICAgIHNlbGYuaW5TdGF0ZVtvYmoudHlwZSA9PSAnZm9jdXNpbicgPyAnZm9jdXMnIDogJ2hvdmVyJ10gPSB0cnVlXG4gICAgfVxuXG4gICAgaWYgKHNlbGYudGlwKCkuaGFzQ2xhc3MoJ2luJykgfHwgc2VsZi5ob3ZlclN0YXRlID09ICdpbicpIHtcbiAgICAgIHNlbGYuaG92ZXJTdGF0ZSA9ICdpbidcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNsZWFyVGltZW91dChzZWxmLnRpbWVvdXQpXG5cbiAgICBzZWxmLmhvdmVyU3RhdGUgPSAnaW4nXG5cbiAgICBpZiAoIXNlbGYub3B0aW9ucy5kZWxheSB8fCAhc2VsZi5vcHRpb25zLmRlbGF5LnNob3cpIHJldHVybiBzZWxmLnNob3coKVxuXG4gICAgc2VsZi50aW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAoc2VsZi5ob3ZlclN0YXRlID09ICdpbicpIHNlbGYuc2hvdygpXG4gICAgfSwgc2VsZi5vcHRpb25zLmRlbGF5LnNob3cpXG4gIH1cblxuICBUb29sdGlwLnByb3RvdHlwZS5pc0luU3RhdGVUcnVlID0gZnVuY3Rpb24gKCkge1xuICAgIGZvciAodmFyIGtleSBpbiB0aGlzLmluU3RhdGUpIHtcbiAgICAgIGlmICh0aGlzLmluU3RhdGVba2V5XSkgcmV0dXJuIHRydWVcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLmxlYXZlID0gZnVuY3Rpb24gKG9iaikge1xuICAgIHZhciBzZWxmID0gb2JqIGluc3RhbmNlb2YgdGhpcy5jb25zdHJ1Y3RvciA/XG4gICAgICBvYmogOiAkKG9iai5jdXJyZW50VGFyZ2V0KS5kYXRhKCdicy4nICsgdGhpcy50eXBlKVxuXG4gICAgaWYgKCFzZWxmKSB7XG4gICAgICBzZWxmID0gbmV3IHRoaXMuY29uc3RydWN0b3Iob2JqLmN1cnJlbnRUYXJnZXQsIHRoaXMuZ2V0RGVsZWdhdGVPcHRpb25zKCkpXG4gICAgICAkKG9iai5jdXJyZW50VGFyZ2V0KS5kYXRhKCdicy4nICsgdGhpcy50eXBlLCBzZWxmKVxuICAgIH1cblxuICAgIGlmIChvYmogaW5zdGFuY2VvZiAkLkV2ZW50KSB7XG4gICAgICBzZWxmLmluU3RhdGVbb2JqLnR5cGUgPT0gJ2ZvY3Vzb3V0JyA/ICdmb2N1cycgOiAnaG92ZXInXSA9IGZhbHNlXG4gICAgfVxuXG4gICAgaWYgKHNlbGYuaXNJblN0YXRlVHJ1ZSgpKSByZXR1cm5cblxuICAgIGNsZWFyVGltZW91dChzZWxmLnRpbWVvdXQpXG5cbiAgICBzZWxmLmhvdmVyU3RhdGUgPSAnb3V0J1xuXG4gICAgaWYgKCFzZWxmLm9wdGlvbnMuZGVsYXkgfHwgIXNlbGYub3B0aW9ucy5kZWxheS5oaWRlKSByZXR1cm4gc2VsZi5oaWRlKClcblxuICAgIHNlbGYudGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKHNlbGYuaG92ZXJTdGF0ZSA9PSAnb3V0Jykgc2VsZi5oaWRlKClcbiAgICB9LCBzZWxmLm9wdGlvbnMuZGVsYXkuaGlkZSlcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGUgPSAkLkV2ZW50KCdzaG93LmJzLicgKyB0aGlzLnR5cGUpXG5cbiAgICBpZiAodGhpcy5oYXNDb250ZW50KCkgJiYgdGhpcy5lbmFibGVkKSB7XG4gICAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoZSlcblxuICAgICAgdmFyIGluRG9tID0gJC5jb250YWlucyh0aGlzLiRlbGVtZW50WzBdLm93bmVyRG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LCB0aGlzLiRlbGVtZW50WzBdKVxuICAgICAgaWYgKGUuaXNEZWZhdWx0UHJldmVudGVkKCkgfHwgIWluRG9tKSByZXR1cm5cbiAgICAgIHZhciB0aGF0ID0gdGhpc1xuXG4gICAgICB2YXIgJHRpcCA9IHRoaXMudGlwKClcblxuICAgICAgdmFyIHRpcElkID0gdGhpcy5nZXRVSUQodGhpcy50eXBlKVxuXG4gICAgICB0aGlzLnNldENvbnRlbnQoKVxuICAgICAgJHRpcC5hdHRyKCdpZCcsIHRpcElkKVxuICAgICAgdGhpcy4kZWxlbWVudC5hdHRyKCdhcmlhLWRlc2NyaWJlZGJ5JywgdGlwSWQpXG5cbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuYW5pbWF0aW9uKSAkdGlwLmFkZENsYXNzKCdmYWRlJylcblxuICAgICAgdmFyIHBsYWNlbWVudCA9IHR5cGVvZiB0aGlzLm9wdGlvbnMucGxhY2VtZW50ID09ICdmdW5jdGlvbicgP1xuICAgICAgICB0aGlzLm9wdGlvbnMucGxhY2VtZW50LmNhbGwodGhpcywgJHRpcFswXSwgdGhpcy4kZWxlbWVudFswXSkgOlxuICAgICAgICB0aGlzLm9wdGlvbnMucGxhY2VtZW50XG5cbiAgICAgIHZhciBhdXRvVG9rZW4gPSAvXFxzP2F1dG8/XFxzPy9pXG4gICAgICB2YXIgYXV0b1BsYWNlID0gYXV0b1Rva2VuLnRlc3QocGxhY2VtZW50KVxuICAgICAgaWYgKGF1dG9QbGFjZSkgcGxhY2VtZW50ID0gcGxhY2VtZW50LnJlcGxhY2UoYXV0b1Rva2VuLCAnJykgfHwgJ3RvcCdcblxuICAgICAgJHRpcFxuICAgICAgICAuZGV0YWNoKClcbiAgICAgICAgLmNzcyh7IHRvcDogMCwgbGVmdDogMCwgZGlzcGxheTogJ2Jsb2NrJyB9KVxuICAgICAgICAuYWRkQ2xhc3MocGxhY2VtZW50KVxuICAgICAgICAuZGF0YSgnYnMuJyArIHRoaXMudHlwZSwgdGhpcylcblxuICAgICAgdGhpcy5vcHRpb25zLmNvbnRhaW5lciA/ICR0aXAuYXBwZW5kVG8oJChkb2N1bWVudCkuZmluZCh0aGlzLm9wdGlvbnMuY29udGFpbmVyKSkgOiAkdGlwLmluc2VydEFmdGVyKHRoaXMuJGVsZW1lbnQpXG4gICAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ2luc2VydGVkLmJzLicgKyB0aGlzLnR5cGUpXG5cbiAgICAgIHZhciBwb3MgICAgICAgICAgPSB0aGlzLmdldFBvc2l0aW9uKClcbiAgICAgIHZhciBhY3R1YWxXaWR0aCAgPSAkdGlwWzBdLm9mZnNldFdpZHRoXG4gICAgICB2YXIgYWN0dWFsSGVpZ2h0ID0gJHRpcFswXS5vZmZzZXRIZWlnaHRcblxuICAgICAgaWYgKGF1dG9QbGFjZSkge1xuICAgICAgICB2YXIgb3JnUGxhY2VtZW50ID0gcGxhY2VtZW50XG4gICAgICAgIHZhciB2aWV3cG9ydERpbSA9IHRoaXMuZ2V0UG9zaXRpb24odGhpcy4kdmlld3BvcnQpXG5cbiAgICAgICAgcGxhY2VtZW50ID0gcGxhY2VtZW50ID09ICdib3R0b20nICYmIHBvcy5ib3R0b20gKyBhY3R1YWxIZWlnaHQgPiB2aWV3cG9ydERpbS5ib3R0b20gPyAndG9wJyAgICA6XG4gICAgICAgICAgICAgICAgICAgIHBsYWNlbWVudCA9PSAndG9wJyAgICAmJiBwb3MudG9wICAgIC0gYWN0dWFsSGVpZ2h0IDwgdmlld3BvcnREaW0udG9wICAgID8gJ2JvdHRvbScgOlxuICAgICAgICAgICAgICAgICAgICBwbGFjZW1lbnQgPT0gJ3JpZ2h0JyAgJiYgcG9zLnJpZ2h0ICArIGFjdHVhbFdpZHRoICA+IHZpZXdwb3J0RGltLndpZHRoICA/ICdsZWZ0JyAgIDpcbiAgICAgICAgICAgICAgICAgICAgcGxhY2VtZW50ID09ICdsZWZ0JyAgICYmIHBvcy5sZWZ0ICAgLSBhY3R1YWxXaWR0aCAgPCB2aWV3cG9ydERpbS5sZWZ0ICAgPyAncmlnaHQnICA6XG4gICAgICAgICAgICAgICAgICAgIHBsYWNlbWVudFxuXG4gICAgICAgICR0aXBcbiAgICAgICAgICAucmVtb3ZlQ2xhc3Mob3JnUGxhY2VtZW50KVxuICAgICAgICAgIC5hZGRDbGFzcyhwbGFjZW1lbnQpXG4gICAgICB9XG5cbiAgICAgIHZhciBjYWxjdWxhdGVkT2Zmc2V0ID0gdGhpcy5nZXRDYWxjdWxhdGVkT2Zmc2V0KHBsYWNlbWVudCwgcG9zLCBhY3R1YWxXaWR0aCwgYWN0dWFsSGVpZ2h0KVxuXG4gICAgICB0aGlzLmFwcGx5UGxhY2VtZW50KGNhbGN1bGF0ZWRPZmZzZXQsIHBsYWNlbWVudClcblxuICAgICAgdmFyIGNvbXBsZXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgcHJldkhvdmVyU3RhdGUgPSB0aGF0LmhvdmVyU3RhdGVcbiAgICAgICAgdGhhdC4kZWxlbWVudC50cmlnZ2VyKCdzaG93bi5icy4nICsgdGhhdC50eXBlKVxuICAgICAgICB0aGF0LmhvdmVyU3RhdGUgPSBudWxsXG5cbiAgICAgICAgaWYgKHByZXZIb3ZlclN0YXRlID09ICdvdXQnKSB0aGF0LmxlYXZlKHRoYXQpXG4gICAgICB9XG5cbiAgICAgICQuc3VwcG9ydC50cmFuc2l0aW9uICYmIHRoaXMuJHRpcC5oYXNDbGFzcygnZmFkZScpID9cbiAgICAgICAgJHRpcFxuICAgICAgICAgIC5vbmUoJ2JzVHJhbnNpdGlvbkVuZCcsIGNvbXBsZXRlKVxuICAgICAgICAgIC5lbXVsYXRlVHJhbnNpdGlvbkVuZChUb29sdGlwLlRSQU5TSVRJT05fRFVSQVRJT04pIDpcbiAgICAgICAgY29tcGxldGUoKVxuICAgIH1cbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLmFwcGx5UGxhY2VtZW50ID0gZnVuY3Rpb24gKG9mZnNldCwgcGxhY2VtZW50KSB7XG4gICAgdmFyICR0aXAgICA9IHRoaXMudGlwKClcbiAgICB2YXIgd2lkdGggID0gJHRpcFswXS5vZmZzZXRXaWR0aFxuICAgIHZhciBoZWlnaHQgPSAkdGlwWzBdLm9mZnNldEhlaWdodFxuXG4gICAgLy8gbWFudWFsbHkgcmVhZCBtYXJnaW5zIGJlY2F1c2UgZ2V0Qm91bmRpbmdDbGllbnRSZWN0IGluY2x1ZGVzIGRpZmZlcmVuY2VcbiAgICB2YXIgbWFyZ2luVG9wID0gcGFyc2VJbnQoJHRpcC5jc3MoJ21hcmdpbi10b3AnKSwgMTApXG4gICAgdmFyIG1hcmdpbkxlZnQgPSBwYXJzZUludCgkdGlwLmNzcygnbWFyZ2luLWxlZnQnKSwgMTApXG5cbiAgICAvLyB3ZSBtdXN0IGNoZWNrIGZvciBOYU4gZm9yIGllIDgvOVxuICAgIGlmIChpc05hTihtYXJnaW5Ub3ApKSAgbWFyZ2luVG9wICA9IDBcbiAgICBpZiAoaXNOYU4obWFyZ2luTGVmdCkpIG1hcmdpbkxlZnQgPSAwXG5cbiAgICBvZmZzZXQudG9wICArPSBtYXJnaW5Ub3BcbiAgICBvZmZzZXQubGVmdCArPSBtYXJnaW5MZWZ0XG5cbiAgICAvLyAkLmZuLm9mZnNldCBkb2Vzbid0IHJvdW5kIHBpeGVsIHZhbHVlc1xuICAgIC8vIHNvIHdlIHVzZSBzZXRPZmZzZXQgZGlyZWN0bHkgd2l0aCBvdXIgb3duIGZ1bmN0aW9uIEItMFxuICAgICQub2Zmc2V0LnNldE9mZnNldCgkdGlwWzBdLCAkLmV4dGVuZCh7XG4gICAgICB1c2luZzogZnVuY3Rpb24gKHByb3BzKSB7XG4gICAgICAgICR0aXAuY3NzKHtcbiAgICAgICAgICB0b3A6IE1hdGgucm91bmQocHJvcHMudG9wKSxcbiAgICAgICAgICBsZWZ0OiBNYXRoLnJvdW5kKHByb3BzLmxlZnQpXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfSwgb2Zmc2V0KSwgMClcblxuICAgICR0aXAuYWRkQ2xhc3MoJ2luJylcblxuICAgIC8vIGNoZWNrIHRvIHNlZSBpZiBwbGFjaW5nIHRpcCBpbiBuZXcgb2Zmc2V0IGNhdXNlZCB0aGUgdGlwIHRvIHJlc2l6ZSBpdHNlbGZcbiAgICB2YXIgYWN0dWFsV2lkdGggID0gJHRpcFswXS5vZmZzZXRXaWR0aFxuICAgIHZhciBhY3R1YWxIZWlnaHQgPSAkdGlwWzBdLm9mZnNldEhlaWdodFxuXG4gICAgaWYgKHBsYWNlbWVudCA9PSAndG9wJyAmJiBhY3R1YWxIZWlnaHQgIT0gaGVpZ2h0KSB7XG4gICAgICBvZmZzZXQudG9wID0gb2Zmc2V0LnRvcCArIGhlaWdodCAtIGFjdHVhbEhlaWdodFxuICAgIH1cblxuICAgIHZhciBkZWx0YSA9IHRoaXMuZ2V0Vmlld3BvcnRBZGp1c3RlZERlbHRhKHBsYWNlbWVudCwgb2Zmc2V0LCBhY3R1YWxXaWR0aCwgYWN0dWFsSGVpZ2h0KVxuXG4gICAgaWYgKGRlbHRhLmxlZnQpIG9mZnNldC5sZWZ0ICs9IGRlbHRhLmxlZnRcbiAgICBlbHNlIG9mZnNldC50b3AgKz0gZGVsdGEudG9wXG5cbiAgICB2YXIgaXNWZXJ0aWNhbCAgICAgICAgICA9IC90b3B8Ym90dG9tLy50ZXN0KHBsYWNlbWVudClcbiAgICB2YXIgYXJyb3dEZWx0YSAgICAgICAgICA9IGlzVmVydGljYWwgPyBkZWx0YS5sZWZ0ICogMiAtIHdpZHRoICsgYWN0dWFsV2lkdGggOiBkZWx0YS50b3AgKiAyIC0gaGVpZ2h0ICsgYWN0dWFsSGVpZ2h0XG4gICAgdmFyIGFycm93T2Zmc2V0UG9zaXRpb24gPSBpc1ZlcnRpY2FsID8gJ29mZnNldFdpZHRoJyA6ICdvZmZzZXRIZWlnaHQnXG5cbiAgICAkdGlwLm9mZnNldChvZmZzZXQpXG4gICAgdGhpcy5yZXBsYWNlQXJyb3coYXJyb3dEZWx0YSwgJHRpcFswXVthcnJvd09mZnNldFBvc2l0aW9uXSwgaXNWZXJ0aWNhbClcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLnJlcGxhY2VBcnJvdyA9IGZ1bmN0aW9uIChkZWx0YSwgZGltZW5zaW9uLCBpc1ZlcnRpY2FsKSB7XG4gICAgdGhpcy5hcnJvdygpXG4gICAgICAuY3NzKGlzVmVydGljYWwgPyAnbGVmdCcgOiAndG9wJywgNTAgKiAoMSAtIGRlbHRhIC8gZGltZW5zaW9uKSArICclJylcbiAgICAgIC5jc3MoaXNWZXJ0aWNhbCA/ICd0b3AnIDogJ2xlZnQnLCAnJylcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLnNldENvbnRlbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyICR0aXAgID0gdGhpcy50aXAoKVxuICAgIHZhciB0aXRsZSA9IHRoaXMuZ2V0VGl0bGUoKVxuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5odG1sKSB7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLnNhbml0aXplKSB7XG4gICAgICAgIHRpdGxlID0gc2FuaXRpemVIdG1sKHRpdGxlLCB0aGlzLm9wdGlvbnMud2hpdGVMaXN0LCB0aGlzLm9wdGlvbnMuc2FuaXRpemVGbilcbiAgICAgIH1cblxuICAgICAgJHRpcC5maW5kKCcudG9vbHRpcC1pbm5lcicpLmh0bWwodGl0bGUpXG4gICAgfSBlbHNlIHtcbiAgICAgICR0aXAuZmluZCgnLnRvb2x0aXAtaW5uZXInKS50ZXh0KHRpdGxlKVxuICAgIH1cblxuICAgICR0aXAucmVtb3ZlQ2xhc3MoJ2ZhZGUgaW4gdG9wIGJvdHRvbSBsZWZ0IHJpZ2h0JylcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLmhpZGUgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICB2YXIgdGhhdCA9IHRoaXNcbiAgICB2YXIgJHRpcCA9ICQodGhpcy4kdGlwKVxuICAgIHZhciBlICAgID0gJC5FdmVudCgnaGlkZS5icy4nICsgdGhpcy50eXBlKVxuXG4gICAgZnVuY3Rpb24gY29tcGxldGUoKSB7XG4gICAgICBpZiAodGhhdC5ob3ZlclN0YXRlICE9ICdpbicpICR0aXAuZGV0YWNoKClcbiAgICAgIGlmICh0aGF0LiRlbGVtZW50KSB7IC8vIFRPRE86IENoZWNrIHdoZXRoZXIgZ3VhcmRpbmcgdGhpcyBjb2RlIHdpdGggdGhpcyBgaWZgIGlzIHJlYWxseSBuZWNlc3NhcnkuXG4gICAgICAgIHRoYXQuJGVsZW1lbnRcbiAgICAgICAgICAucmVtb3ZlQXR0cignYXJpYS1kZXNjcmliZWRieScpXG4gICAgICAgICAgLnRyaWdnZXIoJ2hpZGRlbi5icy4nICsgdGhhdC50eXBlKVxuICAgICAgfVxuICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2soKVxuICAgIH1cblxuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcihlKVxuXG4gICAgaWYgKGUuaXNEZWZhdWx0UHJldmVudGVkKCkpIHJldHVyblxuXG4gICAgJHRpcC5yZW1vdmVDbGFzcygnaW4nKVxuXG4gICAgJC5zdXBwb3J0LnRyYW5zaXRpb24gJiYgJHRpcC5oYXNDbGFzcygnZmFkZScpID9cbiAgICAgICR0aXBcbiAgICAgICAgLm9uZSgnYnNUcmFuc2l0aW9uRW5kJywgY29tcGxldGUpXG4gICAgICAgIC5lbXVsYXRlVHJhbnNpdGlvbkVuZChUb29sdGlwLlRSQU5TSVRJT05fRFVSQVRJT04pIDpcbiAgICAgIGNvbXBsZXRlKClcblxuICAgIHRoaXMuaG92ZXJTdGF0ZSA9IG51bGxcblxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICBUb29sdGlwLnByb3RvdHlwZS5maXhUaXRsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgJGUgPSB0aGlzLiRlbGVtZW50XG4gICAgaWYgKCRlLmF0dHIoJ3RpdGxlJykgfHwgdHlwZW9mICRlLmF0dHIoJ2RhdGEtb3JpZ2luYWwtdGl0bGUnKSAhPSAnc3RyaW5nJykge1xuICAgICAgJGUuYXR0cignZGF0YS1vcmlnaW5hbC10aXRsZScsICRlLmF0dHIoJ3RpdGxlJykgfHwgJycpLmF0dHIoJ3RpdGxlJywgJycpXG4gICAgfVxuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUuaGFzQ29udGVudCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRUaXRsZSgpXG4gIH1cblxuICBUb29sdGlwLnByb3RvdHlwZS5nZXRQb3NpdGlvbiA9IGZ1bmN0aW9uICgkZWxlbWVudCkge1xuICAgICRlbGVtZW50ICAgPSAkZWxlbWVudCB8fCB0aGlzLiRlbGVtZW50XG5cbiAgICB2YXIgZWwgICAgID0gJGVsZW1lbnRbMF1cbiAgICB2YXIgaXNCb2R5ID0gZWwudGFnTmFtZSA9PSAnQk9EWSdcblxuICAgIHZhciBlbFJlY3QgICAgPSBlbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgIGlmIChlbFJlY3Qud2lkdGggPT0gbnVsbCkge1xuICAgICAgLy8gd2lkdGggYW5kIGhlaWdodCBhcmUgbWlzc2luZyBpbiBJRTgsIHNvIGNvbXB1dGUgdGhlbSBtYW51YWxseTsgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS90d2JzL2Jvb3RzdHJhcC9pc3N1ZXMvMTQwOTNcbiAgICAgIGVsUmVjdCA9ICQuZXh0ZW5kKHt9LCBlbFJlY3QsIHsgd2lkdGg6IGVsUmVjdC5yaWdodCAtIGVsUmVjdC5sZWZ0LCBoZWlnaHQ6IGVsUmVjdC5ib3R0b20gLSBlbFJlY3QudG9wIH0pXG4gICAgfVxuICAgIHZhciBpc1N2ZyA9IHdpbmRvdy5TVkdFbGVtZW50ICYmIGVsIGluc3RhbmNlb2Ygd2luZG93LlNWR0VsZW1lbnRcbiAgICAvLyBBdm9pZCB1c2luZyAkLm9mZnNldCgpIG9uIFNWR3Mgc2luY2UgaXQgZ2l2ZXMgaW5jb3JyZWN0IHJlc3VsdHMgaW4galF1ZXJ5IDMuXG4gICAgLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS90d2JzL2Jvb3RzdHJhcC9pc3N1ZXMvMjAyODBcbiAgICB2YXIgZWxPZmZzZXQgID0gaXNCb2R5ID8geyB0b3A6IDAsIGxlZnQ6IDAgfSA6IChpc1N2ZyA/IG51bGwgOiAkZWxlbWVudC5vZmZzZXQoKSlcbiAgICB2YXIgc2Nyb2xsICAgID0geyBzY3JvbGw6IGlzQm9keSA/IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxUb3AgfHwgZG9jdW1lbnQuYm9keS5zY3JvbGxUb3AgOiAkZWxlbWVudC5zY3JvbGxUb3AoKSB9XG4gICAgdmFyIG91dGVyRGltcyA9IGlzQm9keSA/IHsgd2lkdGg6ICQod2luZG93KS53aWR0aCgpLCBoZWlnaHQ6ICQod2luZG93KS5oZWlnaHQoKSB9IDogbnVsbFxuXG4gICAgcmV0dXJuICQuZXh0ZW5kKHt9LCBlbFJlY3QsIHNjcm9sbCwgb3V0ZXJEaW1zLCBlbE9mZnNldClcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLmdldENhbGN1bGF0ZWRPZmZzZXQgPSBmdW5jdGlvbiAocGxhY2VtZW50LCBwb3MsIGFjdHVhbFdpZHRoLCBhY3R1YWxIZWlnaHQpIHtcbiAgICByZXR1cm4gcGxhY2VtZW50ID09ICdib3R0b20nID8geyB0b3A6IHBvcy50b3AgKyBwb3MuaGVpZ2h0LCAgIGxlZnQ6IHBvcy5sZWZ0ICsgcG9zLndpZHRoIC8gMiAtIGFjdHVhbFdpZHRoIC8gMiB9IDpcbiAgICAgICAgICAgcGxhY2VtZW50ID09ICd0b3AnICAgID8geyB0b3A6IHBvcy50b3AgLSBhY3R1YWxIZWlnaHQsIGxlZnQ6IHBvcy5sZWZ0ICsgcG9zLndpZHRoIC8gMiAtIGFjdHVhbFdpZHRoIC8gMiB9IDpcbiAgICAgICAgICAgcGxhY2VtZW50ID09ICdsZWZ0JyAgID8geyB0b3A6IHBvcy50b3AgKyBwb3MuaGVpZ2h0IC8gMiAtIGFjdHVhbEhlaWdodCAvIDIsIGxlZnQ6IHBvcy5sZWZ0IC0gYWN0dWFsV2lkdGggfSA6XG4gICAgICAgIC8qIHBsYWNlbWVudCA9PSAncmlnaHQnICovIHsgdG9wOiBwb3MudG9wICsgcG9zLmhlaWdodCAvIDIgLSBhY3R1YWxIZWlnaHQgLyAyLCBsZWZ0OiBwb3MubGVmdCArIHBvcy53aWR0aCB9XG5cbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLmdldFZpZXdwb3J0QWRqdXN0ZWREZWx0YSA9IGZ1bmN0aW9uIChwbGFjZW1lbnQsIHBvcywgYWN0dWFsV2lkdGgsIGFjdHVhbEhlaWdodCkge1xuICAgIHZhciBkZWx0YSA9IHsgdG9wOiAwLCBsZWZ0OiAwIH1cbiAgICBpZiAoIXRoaXMuJHZpZXdwb3J0KSByZXR1cm4gZGVsdGFcblxuICAgIHZhciB2aWV3cG9ydFBhZGRpbmcgPSB0aGlzLm9wdGlvbnMudmlld3BvcnQgJiYgdGhpcy5vcHRpb25zLnZpZXdwb3J0LnBhZGRpbmcgfHwgMFxuICAgIHZhciB2aWV3cG9ydERpbWVuc2lvbnMgPSB0aGlzLmdldFBvc2l0aW9uKHRoaXMuJHZpZXdwb3J0KVxuXG4gICAgaWYgKC9yaWdodHxsZWZ0Ly50ZXN0KHBsYWNlbWVudCkpIHtcbiAgICAgIHZhciB0b3BFZGdlT2Zmc2V0ICAgID0gcG9zLnRvcCAtIHZpZXdwb3J0UGFkZGluZyAtIHZpZXdwb3J0RGltZW5zaW9ucy5zY3JvbGxcbiAgICAgIHZhciBib3R0b21FZGdlT2Zmc2V0ID0gcG9zLnRvcCArIHZpZXdwb3J0UGFkZGluZyAtIHZpZXdwb3J0RGltZW5zaW9ucy5zY3JvbGwgKyBhY3R1YWxIZWlnaHRcbiAgICAgIGlmICh0b3BFZGdlT2Zmc2V0IDwgdmlld3BvcnREaW1lbnNpb25zLnRvcCkgeyAvLyB0b3Agb3ZlcmZsb3dcbiAgICAgICAgZGVsdGEudG9wID0gdmlld3BvcnREaW1lbnNpb25zLnRvcCAtIHRvcEVkZ2VPZmZzZXRcbiAgICAgIH0gZWxzZSBpZiAoYm90dG9tRWRnZU9mZnNldCA+IHZpZXdwb3J0RGltZW5zaW9ucy50b3AgKyB2aWV3cG9ydERpbWVuc2lvbnMuaGVpZ2h0KSB7IC8vIGJvdHRvbSBvdmVyZmxvd1xuICAgICAgICBkZWx0YS50b3AgPSB2aWV3cG9ydERpbWVuc2lvbnMudG9wICsgdmlld3BvcnREaW1lbnNpb25zLmhlaWdodCAtIGJvdHRvbUVkZ2VPZmZzZXRcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGxlZnRFZGdlT2Zmc2V0ICA9IHBvcy5sZWZ0IC0gdmlld3BvcnRQYWRkaW5nXG4gICAgICB2YXIgcmlnaHRFZGdlT2Zmc2V0ID0gcG9zLmxlZnQgKyB2aWV3cG9ydFBhZGRpbmcgKyBhY3R1YWxXaWR0aFxuICAgICAgaWYgKGxlZnRFZGdlT2Zmc2V0IDwgdmlld3BvcnREaW1lbnNpb25zLmxlZnQpIHsgLy8gbGVmdCBvdmVyZmxvd1xuICAgICAgICBkZWx0YS5sZWZ0ID0gdmlld3BvcnREaW1lbnNpb25zLmxlZnQgLSBsZWZ0RWRnZU9mZnNldFxuICAgICAgfSBlbHNlIGlmIChyaWdodEVkZ2VPZmZzZXQgPiB2aWV3cG9ydERpbWVuc2lvbnMucmlnaHQpIHsgLy8gcmlnaHQgb3ZlcmZsb3dcbiAgICAgICAgZGVsdGEubGVmdCA9IHZpZXdwb3J0RGltZW5zaW9ucy5sZWZ0ICsgdmlld3BvcnREaW1lbnNpb25zLndpZHRoIC0gcmlnaHRFZGdlT2Zmc2V0XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGRlbHRhXG4gIH1cblxuICBUb29sdGlwLnByb3RvdHlwZS5nZXRUaXRsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgdGl0bGVcbiAgICB2YXIgJGUgPSB0aGlzLiRlbGVtZW50XG4gICAgdmFyIG8gID0gdGhpcy5vcHRpb25zXG5cbiAgICB0aXRsZSA9ICRlLmF0dHIoJ2RhdGEtb3JpZ2luYWwtdGl0bGUnKVxuICAgICAgfHwgKHR5cGVvZiBvLnRpdGxlID09ICdmdW5jdGlvbicgPyBvLnRpdGxlLmNhbGwoJGVbMF0pIDogIG8udGl0bGUpXG5cbiAgICByZXR1cm4gdGl0bGVcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLmdldFVJRCA9IGZ1bmN0aW9uIChwcmVmaXgpIHtcbiAgICBkbyBwcmVmaXggKz0gfn4oTWF0aC5yYW5kb20oKSAqIDEwMDAwMDApXG4gICAgd2hpbGUgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHByZWZpeCkpXG4gICAgcmV0dXJuIHByZWZpeFxuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUudGlwID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICghdGhpcy4kdGlwKSB7XG4gICAgICB0aGlzLiR0aXAgPSAkKHRoaXMub3B0aW9ucy50ZW1wbGF0ZSlcbiAgICAgIGlmICh0aGlzLiR0aXAubGVuZ3RoICE9IDEpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKHRoaXMudHlwZSArICcgYHRlbXBsYXRlYCBvcHRpb24gbXVzdCBjb25zaXN0IG9mIGV4YWN0bHkgMSB0b3AtbGV2ZWwgZWxlbWVudCEnKVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy4kdGlwXG4gIH1cblxuICBUb29sdGlwLnByb3RvdHlwZS5hcnJvdyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gKHRoaXMuJGFycm93ID0gdGhpcy4kYXJyb3cgfHwgdGhpcy50aXAoKS5maW5kKCcudG9vbHRpcC1hcnJvdycpKVxuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUuZW5hYmxlID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZW5hYmxlZCA9IHRydWVcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLmRpc2FibGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5lbmFibGVkID0gZmFsc2VcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLnRvZ2dsZUVuYWJsZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5lbmFibGVkID0gIXRoaXMuZW5hYmxlZFxuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUudG9nZ2xlID0gZnVuY3Rpb24gKGUpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICBpZiAoZSkge1xuICAgICAgc2VsZiA9ICQoZS5jdXJyZW50VGFyZ2V0KS5kYXRhKCdicy4nICsgdGhpcy50eXBlKVxuICAgICAgaWYgKCFzZWxmKSB7XG4gICAgICAgIHNlbGYgPSBuZXcgdGhpcy5jb25zdHJ1Y3RvcihlLmN1cnJlbnRUYXJnZXQsIHRoaXMuZ2V0RGVsZWdhdGVPcHRpb25zKCkpXG4gICAgICAgICQoZS5jdXJyZW50VGFyZ2V0KS5kYXRhKCdicy4nICsgdGhpcy50eXBlLCBzZWxmKVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChlKSB7XG4gICAgICBzZWxmLmluU3RhdGUuY2xpY2sgPSAhc2VsZi5pblN0YXRlLmNsaWNrXG4gICAgICBpZiAoc2VsZi5pc0luU3RhdGVUcnVlKCkpIHNlbGYuZW50ZXIoc2VsZilcbiAgICAgIGVsc2Ugc2VsZi5sZWF2ZShzZWxmKVxuICAgIH0gZWxzZSB7XG4gICAgICBzZWxmLnRpcCgpLmhhc0NsYXNzKCdpbicpID8gc2VsZi5sZWF2ZShzZWxmKSA6IHNlbGYuZW50ZXIoc2VsZilcbiAgICB9XG4gIH1cblxuICBUb29sdGlwLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciB0aGF0ID0gdGhpc1xuICAgIGNsZWFyVGltZW91dCh0aGlzLnRpbWVvdXQpXG4gICAgdGhpcy5oaWRlKGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoYXQuJGVsZW1lbnQub2ZmKCcuJyArIHRoYXQudHlwZSkucmVtb3ZlRGF0YSgnYnMuJyArIHRoYXQudHlwZSlcbiAgICAgIGlmICh0aGF0LiR0aXApIHtcbiAgICAgICAgdGhhdC4kdGlwLmRldGFjaCgpXG4gICAgICB9XG4gICAgICB0aGF0LiR0aXAgPSBudWxsXG4gICAgICB0aGF0LiRhcnJvdyA9IG51bGxcbiAgICAgIHRoYXQuJHZpZXdwb3J0ID0gbnVsbFxuICAgICAgdGhhdC4kZWxlbWVudCA9IG51bGxcbiAgICB9KVxuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUuc2FuaXRpemVIdG1sID0gZnVuY3Rpb24gKHVuc2FmZUh0bWwpIHtcbiAgICByZXR1cm4gc2FuaXRpemVIdG1sKHVuc2FmZUh0bWwsIHRoaXMub3B0aW9ucy53aGl0ZUxpc3QsIHRoaXMub3B0aW9ucy5zYW5pdGl6ZUZuKVxuICB9XG5cbiAgLy8gVE9PTFRJUCBQTFVHSU4gREVGSU5JVElPTlxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgZnVuY3Rpb24gUGx1Z2luKG9wdGlvbikge1xuICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgdmFyICR0aGlzICAgPSAkKHRoaXMpXG4gICAgICB2YXIgZGF0YSAgICA9ICR0aGlzLmRhdGEoJ2JzLnRvb2x0aXAnKVxuICAgICAgdmFyIG9wdGlvbnMgPSB0eXBlb2Ygb3B0aW9uID09ICdvYmplY3QnICYmIG9wdGlvblxuXG4gICAgICBpZiAoIWRhdGEgJiYgL2Rlc3Ryb3l8aGlkZS8udGVzdChvcHRpb24pKSByZXR1cm5cbiAgICAgIGlmICghZGF0YSkgJHRoaXMuZGF0YSgnYnMudG9vbHRpcCcsIChkYXRhID0gbmV3IFRvb2x0aXAodGhpcywgb3B0aW9ucykpKVxuICAgICAgaWYgKHR5cGVvZiBvcHRpb24gPT0gJ3N0cmluZycpIGRhdGFbb3B0aW9uXSgpXG4gICAgfSlcbiAgfVxuXG4gIHZhciBvbGQgPSAkLmZuLnRvb2x0aXBcblxuICAkLmZuLnRvb2x0aXAgICAgICAgICAgICAgPSBQbHVnaW5cbiAgJC5mbi50b29sdGlwLkNvbnN0cnVjdG9yID0gVG9vbHRpcFxuXG5cbiAgLy8gVE9PTFRJUCBOTyBDT05GTElDVFxuICAvLyA9PT09PT09PT09PT09PT09PT09XG5cbiAgJC5mbi50b29sdGlwLm5vQ29uZmxpY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgJC5mbi50b29sdGlwID0gb2xkXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG59KGpRdWVyeSk7XG5cbi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogQm9vdHN0cmFwOiBwb3BvdmVyLmpzIHYzLjQuMVxuICogaHR0cHM6Ly9nZXRib290c3RyYXAuY29tL2RvY3MvMy40L2phdmFzY3JpcHQvI3BvcG92ZXJzXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIENvcHlyaWdodCAyMDExLTIwMTkgVHdpdHRlciwgSW5jLlxuICogTGljZW5zZWQgdW5kZXIgTUlUIChodHRwczovL2dpdGh1Yi5jb20vdHdicy9ib290c3RyYXAvYmxvYi9tYXN0ZXIvTElDRU5TRSlcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqL1xuXG5cbitmdW5jdGlvbiAoJCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgLy8gUE9QT1ZFUiBQVUJMSUMgQ0xBU1MgREVGSU5JVElPTlxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgdmFyIFBvcG92ZXIgPSBmdW5jdGlvbiAoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIHRoaXMuaW5pdCgncG9wb3ZlcicsIGVsZW1lbnQsIG9wdGlvbnMpXG4gIH1cblxuICBpZiAoISQuZm4udG9vbHRpcCkgdGhyb3cgbmV3IEVycm9yKCdQb3BvdmVyIHJlcXVpcmVzIHRvb2x0aXAuanMnKVxuXG4gIFBvcG92ZXIuVkVSU0lPTiAgPSAnMy40LjEnXG5cbiAgUG9wb3Zlci5ERUZBVUxUUyA9ICQuZXh0ZW5kKHt9LCAkLmZuLnRvb2x0aXAuQ29uc3RydWN0b3IuREVGQVVMVFMsIHtcbiAgICBwbGFjZW1lbnQ6ICdyaWdodCcsXG4gICAgdHJpZ2dlcjogJ2NsaWNrJyxcbiAgICBjb250ZW50OiAnJyxcbiAgICB0ZW1wbGF0ZTogJzxkaXYgY2xhc3M9XCJwb3BvdmVyXCIgcm9sZT1cInRvb2x0aXBcIj48ZGl2IGNsYXNzPVwiYXJyb3dcIj48L2Rpdj48aDMgY2xhc3M9XCJwb3BvdmVyLXRpdGxlXCI+PC9oMz48ZGl2IGNsYXNzPVwicG9wb3Zlci1jb250ZW50XCI+PC9kaXY+PC9kaXY+J1xuICB9KVxuXG5cbiAgLy8gTk9URTogUE9QT1ZFUiBFWFRFTkRTIHRvb2x0aXAuanNcbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICBQb3BvdmVyLnByb3RvdHlwZSA9ICQuZXh0ZW5kKHt9LCAkLmZuLnRvb2x0aXAuQ29uc3RydWN0b3IucHJvdG90eXBlKVxuXG4gIFBvcG92ZXIucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gUG9wb3ZlclxuXG4gIFBvcG92ZXIucHJvdG90eXBlLmdldERlZmF1bHRzID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBQb3BvdmVyLkRFRkFVTFRTXG4gIH1cblxuICBQb3BvdmVyLnByb3RvdHlwZS5zZXRDb250ZW50ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciAkdGlwICAgID0gdGhpcy50aXAoKVxuICAgIHZhciB0aXRsZSAgID0gdGhpcy5nZXRUaXRsZSgpXG4gICAgdmFyIGNvbnRlbnQgPSB0aGlzLmdldENvbnRlbnQoKVxuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5odG1sKSB7XG4gICAgICB2YXIgdHlwZUNvbnRlbnQgPSB0eXBlb2YgY29udGVudFxuXG4gICAgICBpZiAodGhpcy5vcHRpb25zLnNhbml0aXplKSB7XG4gICAgICAgIHRpdGxlID0gdGhpcy5zYW5pdGl6ZUh0bWwodGl0bGUpXG5cbiAgICAgICAgaWYgKHR5cGVDb250ZW50ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgIGNvbnRlbnQgPSB0aGlzLnNhbml0aXplSHRtbChjb250ZW50KVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgICR0aXAuZmluZCgnLnBvcG92ZXItdGl0bGUnKS5odG1sKHRpdGxlKVxuICAgICAgJHRpcC5maW5kKCcucG9wb3Zlci1jb250ZW50JykuY2hpbGRyZW4oKS5kZXRhY2goKS5lbmQoKVtcbiAgICAgICAgdHlwZUNvbnRlbnQgPT09ICdzdHJpbmcnID8gJ2h0bWwnIDogJ2FwcGVuZCdcbiAgICAgIF0oY29udGVudClcbiAgICB9IGVsc2Uge1xuICAgICAgJHRpcC5maW5kKCcucG9wb3Zlci10aXRsZScpLnRleHQodGl0bGUpXG4gICAgICAkdGlwLmZpbmQoJy5wb3BvdmVyLWNvbnRlbnQnKS5jaGlsZHJlbigpLmRldGFjaCgpLmVuZCgpLnRleHQoY29udGVudClcbiAgICB9XG5cbiAgICAkdGlwLnJlbW92ZUNsYXNzKCdmYWRlIHRvcCBib3R0b20gbGVmdCByaWdodCBpbicpXG5cbiAgICAvLyBJRTggZG9lc24ndCBhY2NlcHQgaGlkaW5nIHZpYSB0aGUgYDplbXB0eWAgcHNldWRvIHNlbGVjdG9yLCB3ZSBoYXZlIHRvIGRvXG4gICAgLy8gdGhpcyBtYW51YWxseSBieSBjaGVja2luZyB0aGUgY29udGVudHMuXG4gICAgaWYgKCEkdGlwLmZpbmQoJy5wb3BvdmVyLXRpdGxlJykuaHRtbCgpKSAkdGlwLmZpbmQoJy5wb3BvdmVyLXRpdGxlJykuaGlkZSgpXG4gIH1cblxuICBQb3BvdmVyLnByb3RvdHlwZS5oYXNDb250ZW50ID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmdldFRpdGxlKCkgfHwgdGhpcy5nZXRDb250ZW50KClcbiAgfVxuXG4gIFBvcG92ZXIucHJvdG90eXBlLmdldENvbnRlbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyICRlID0gdGhpcy4kZWxlbWVudFxuICAgIHZhciBvICA9IHRoaXMub3B0aW9uc1xuXG4gICAgcmV0dXJuICRlLmF0dHIoJ2RhdGEtY29udGVudCcpXG4gICAgICB8fCAodHlwZW9mIG8uY29udGVudCA9PSAnZnVuY3Rpb24nID9cbiAgICAgICAgby5jb250ZW50LmNhbGwoJGVbMF0pIDpcbiAgICAgICAgby5jb250ZW50KVxuICB9XG5cbiAgUG9wb3Zlci5wcm90b3R5cGUuYXJyb3cgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICh0aGlzLiRhcnJvdyA9IHRoaXMuJGFycm93IHx8IHRoaXMudGlwKCkuZmluZCgnLmFycm93JykpXG4gIH1cblxuXG4gIC8vIFBPUE9WRVIgUExVR0lOIERFRklOSVRJT05cbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gIGZ1bmN0aW9uIFBsdWdpbihvcHRpb24pIHtcbiAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciAkdGhpcyAgID0gJCh0aGlzKVxuICAgICAgdmFyIGRhdGEgICAgPSAkdGhpcy5kYXRhKCdicy5wb3BvdmVyJylcbiAgICAgIHZhciBvcHRpb25zID0gdHlwZW9mIG9wdGlvbiA9PSAnb2JqZWN0JyAmJiBvcHRpb25cblxuICAgICAgaWYgKCFkYXRhICYmIC9kZXN0cm95fGhpZGUvLnRlc3Qob3B0aW9uKSkgcmV0dXJuXG4gICAgICBpZiAoIWRhdGEpICR0aGlzLmRhdGEoJ2JzLnBvcG92ZXInLCAoZGF0YSA9IG5ldyBQb3BvdmVyKHRoaXMsIG9wdGlvbnMpKSlcbiAgICAgIGlmICh0eXBlb2Ygb3B0aW9uID09ICdzdHJpbmcnKSBkYXRhW29wdGlvbl0oKVxuICAgIH0pXG4gIH1cblxuICB2YXIgb2xkID0gJC5mbi5wb3BvdmVyXG5cbiAgJC5mbi5wb3BvdmVyICAgICAgICAgICAgID0gUGx1Z2luXG4gICQuZm4ucG9wb3Zlci5Db25zdHJ1Y3RvciA9IFBvcG92ZXJcblxuXG4gIC8vIFBPUE9WRVIgTk8gQ09ORkxJQ1RcbiAgLy8gPT09PT09PT09PT09PT09PT09PVxuXG4gICQuZm4ucG9wb3Zlci5ub0NvbmZsaWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICQuZm4ucG9wb3ZlciA9IG9sZFxuICAgIHJldHVybiB0aGlzXG4gIH1cblxufShqUXVlcnkpO1xuXG4vKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIEJvb3RzdHJhcDogc2Nyb2xsc3B5LmpzIHYzLjQuMVxuICogaHR0cHM6Ly9nZXRib290c3RyYXAuY29tL2RvY3MvMy40L2phdmFzY3JpcHQvI3Njcm9sbHNweVxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBDb3B5cmlnaHQgMjAxMS0yMDE5IFR3aXR0ZXIsIEluYy5cbiAqIExpY2Vuc2VkIHVuZGVyIE1JVCAoaHR0cHM6Ly9naXRodWIuY29tL3R3YnMvYm9vdHN0cmFwL2Jsb2IvbWFzdGVyL0xJQ0VOU0UpXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi9cblxuXG4rZnVuY3Rpb24gKCQpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIC8vIFNDUk9MTFNQWSBDTEFTUyBERUZJTklUSU9OXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgZnVuY3Rpb24gU2Nyb2xsU3B5KGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLiRib2R5ICAgICAgICAgID0gJChkb2N1bWVudC5ib2R5KVxuICAgIHRoaXMuJHNjcm9sbEVsZW1lbnQgPSAkKGVsZW1lbnQpLmlzKGRvY3VtZW50LmJvZHkpID8gJCh3aW5kb3cpIDogJChlbGVtZW50KVxuICAgIHRoaXMub3B0aW9ucyAgICAgICAgPSAkLmV4dGVuZCh7fSwgU2Nyb2xsU3B5LkRFRkFVTFRTLCBvcHRpb25zKVxuICAgIHRoaXMuc2VsZWN0b3IgICAgICAgPSAodGhpcy5vcHRpb25zLnRhcmdldCB8fCAnJykgKyAnIC5uYXYgbGkgPiBhJ1xuICAgIHRoaXMub2Zmc2V0cyAgICAgICAgPSBbXVxuICAgIHRoaXMudGFyZ2V0cyAgICAgICAgPSBbXVxuICAgIHRoaXMuYWN0aXZlVGFyZ2V0ICAgPSBudWxsXG4gICAgdGhpcy5zY3JvbGxIZWlnaHQgICA9IDBcblxuICAgIHRoaXMuJHNjcm9sbEVsZW1lbnQub24oJ3Njcm9sbC5icy5zY3JvbGxzcHknLCAkLnByb3h5KHRoaXMucHJvY2VzcywgdGhpcykpXG4gICAgdGhpcy5yZWZyZXNoKClcbiAgICB0aGlzLnByb2Nlc3MoKVxuICB9XG5cbiAgU2Nyb2xsU3B5LlZFUlNJT04gID0gJzMuNC4xJ1xuXG4gIFNjcm9sbFNweS5ERUZBVUxUUyA9IHtcbiAgICBvZmZzZXQ6IDEwXG4gIH1cblxuICBTY3JvbGxTcHkucHJvdG90eXBlLmdldFNjcm9sbEhlaWdodCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy4kc2Nyb2xsRWxlbWVudFswXS5zY3JvbGxIZWlnaHQgfHwgTWF0aC5tYXgodGhpcy4kYm9keVswXS5zY3JvbGxIZWlnaHQsIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxIZWlnaHQpXG4gIH1cblxuICBTY3JvbGxTcHkucHJvdG90eXBlLnJlZnJlc2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHRoYXQgICAgICAgICAgPSB0aGlzXG4gICAgdmFyIG9mZnNldE1ldGhvZCAgPSAnb2Zmc2V0J1xuICAgIHZhciBvZmZzZXRCYXNlICAgID0gMFxuXG4gICAgdGhpcy5vZmZzZXRzICAgICAgPSBbXVxuICAgIHRoaXMudGFyZ2V0cyAgICAgID0gW11cbiAgICB0aGlzLnNjcm9sbEhlaWdodCA9IHRoaXMuZ2V0U2Nyb2xsSGVpZ2h0KClcblxuICAgIGlmICghJC5pc1dpbmRvdyh0aGlzLiRzY3JvbGxFbGVtZW50WzBdKSkge1xuICAgICAgb2Zmc2V0TWV0aG9kID0gJ3Bvc2l0aW9uJ1xuICAgICAgb2Zmc2V0QmFzZSAgID0gdGhpcy4kc2Nyb2xsRWxlbWVudC5zY3JvbGxUb3AoKVxuICAgIH1cblxuICAgIHRoaXMuJGJvZHlcbiAgICAgIC5maW5kKHRoaXMuc2VsZWN0b3IpXG4gICAgICAubWFwKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyICRlbCAgID0gJCh0aGlzKVxuICAgICAgICB2YXIgaHJlZiAgPSAkZWwuZGF0YSgndGFyZ2V0JykgfHwgJGVsLmF0dHIoJ2hyZWYnKVxuICAgICAgICB2YXIgJGhyZWYgPSAvXiMuLy50ZXN0KGhyZWYpICYmICQoaHJlZilcblxuICAgICAgICByZXR1cm4gKCRocmVmXG4gICAgICAgICAgJiYgJGhyZWYubGVuZ3RoXG4gICAgICAgICAgJiYgJGhyZWYuaXMoJzp2aXNpYmxlJylcbiAgICAgICAgICAmJiBbWyRocmVmW29mZnNldE1ldGhvZF0oKS50b3AgKyBvZmZzZXRCYXNlLCBocmVmXV0pIHx8IG51bGxcbiAgICAgIH0pXG4gICAgICAuc29ydChmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYVswXSAtIGJbMF0gfSlcbiAgICAgIC5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhhdC5vZmZzZXRzLnB1c2godGhpc1swXSlcbiAgICAgICAgdGhhdC50YXJnZXRzLnB1c2godGhpc1sxXSlcbiAgICAgIH0pXG4gIH1cblxuICBTY3JvbGxTcHkucHJvdG90eXBlLnByb2Nlc3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNjcm9sbFRvcCAgICA9IHRoaXMuJHNjcm9sbEVsZW1lbnQuc2Nyb2xsVG9wKCkgKyB0aGlzLm9wdGlvbnMub2Zmc2V0XG4gICAgdmFyIHNjcm9sbEhlaWdodCA9IHRoaXMuZ2V0U2Nyb2xsSGVpZ2h0KClcbiAgICB2YXIgbWF4U2Nyb2xsICAgID0gdGhpcy5vcHRpb25zLm9mZnNldCArIHNjcm9sbEhlaWdodCAtIHRoaXMuJHNjcm9sbEVsZW1lbnQuaGVpZ2h0KClcbiAgICB2YXIgb2Zmc2V0cyAgICAgID0gdGhpcy5vZmZzZXRzXG4gICAgdmFyIHRhcmdldHMgICAgICA9IHRoaXMudGFyZ2V0c1xuICAgIHZhciBhY3RpdmVUYXJnZXQgPSB0aGlzLmFjdGl2ZVRhcmdldFxuICAgIHZhciBpXG5cbiAgICBpZiAodGhpcy5zY3JvbGxIZWlnaHQgIT0gc2Nyb2xsSGVpZ2h0KSB7XG4gICAgICB0aGlzLnJlZnJlc2goKVxuICAgIH1cblxuICAgIGlmIChzY3JvbGxUb3AgPj0gbWF4U2Nyb2xsKSB7XG4gICAgICByZXR1cm4gYWN0aXZlVGFyZ2V0ICE9IChpID0gdGFyZ2V0c1t0YXJnZXRzLmxlbmd0aCAtIDFdKSAmJiB0aGlzLmFjdGl2YXRlKGkpXG4gICAgfVxuXG4gICAgaWYgKGFjdGl2ZVRhcmdldCAmJiBzY3JvbGxUb3AgPCBvZmZzZXRzWzBdKSB7XG4gICAgICB0aGlzLmFjdGl2ZVRhcmdldCA9IG51bGxcbiAgICAgIHJldHVybiB0aGlzLmNsZWFyKClcbiAgICB9XG5cbiAgICBmb3IgKGkgPSBvZmZzZXRzLmxlbmd0aDsgaS0tOykge1xuICAgICAgYWN0aXZlVGFyZ2V0ICE9IHRhcmdldHNbaV1cbiAgICAgICAgJiYgc2Nyb2xsVG9wID49IG9mZnNldHNbaV1cbiAgICAgICAgJiYgKG9mZnNldHNbaSArIDFdID09PSB1bmRlZmluZWQgfHwgc2Nyb2xsVG9wIDwgb2Zmc2V0c1tpICsgMV0pXG4gICAgICAgICYmIHRoaXMuYWN0aXZhdGUodGFyZ2V0c1tpXSlcbiAgICB9XG4gIH1cblxuICBTY3JvbGxTcHkucHJvdG90eXBlLmFjdGl2YXRlID0gZnVuY3Rpb24gKHRhcmdldCkge1xuICAgIHRoaXMuYWN0aXZlVGFyZ2V0ID0gdGFyZ2V0XG5cbiAgICB0aGlzLmNsZWFyKClcblxuICAgIHZhciBzZWxlY3RvciA9IHRoaXMuc2VsZWN0b3IgK1xuICAgICAgJ1tkYXRhLXRhcmdldD1cIicgKyB0YXJnZXQgKyAnXCJdLCcgK1xuICAgICAgdGhpcy5zZWxlY3RvciArICdbaHJlZj1cIicgKyB0YXJnZXQgKyAnXCJdJ1xuXG4gICAgdmFyIGFjdGl2ZSA9ICQoc2VsZWN0b3IpXG4gICAgICAucGFyZW50cygnbGknKVxuICAgICAgLmFkZENsYXNzKCdhY3RpdmUnKVxuXG4gICAgaWYgKGFjdGl2ZS5wYXJlbnQoJy5kcm9wZG93bi1tZW51JykubGVuZ3RoKSB7XG4gICAgICBhY3RpdmUgPSBhY3RpdmVcbiAgICAgICAgLmNsb3Nlc3QoJ2xpLmRyb3Bkb3duJylcbiAgICAgICAgLmFkZENsYXNzKCdhY3RpdmUnKVxuICAgIH1cblxuICAgIGFjdGl2ZS50cmlnZ2VyKCdhY3RpdmF0ZS5icy5zY3JvbGxzcHknKVxuICB9XG5cbiAgU2Nyb2xsU3B5LnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uICgpIHtcbiAgICAkKHRoaXMuc2VsZWN0b3IpXG4gICAgICAucGFyZW50c1VudGlsKHRoaXMub3B0aW9ucy50YXJnZXQsICcuYWN0aXZlJylcbiAgICAgIC5yZW1vdmVDbGFzcygnYWN0aXZlJylcbiAgfVxuXG5cbiAgLy8gU0NST0xMU1BZIFBMVUdJTiBERUZJTklUSU9OXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gIGZ1bmN0aW9uIFBsdWdpbihvcHRpb24pIHtcbiAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciAkdGhpcyAgID0gJCh0aGlzKVxuICAgICAgdmFyIGRhdGEgICAgPSAkdGhpcy5kYXRhKCdicy5zY3JvbGxzcHknKVxuICAgICAgdmFyIG9wdGlvbnMgPSB0eXBlb2Ygb3B0aW9uID09ICdvYmplY3QnICYmIG9wdGlvblxuXG4gICAgICBpZiAoIWRhdGEpICR0aGlzLmRhdGEoJ2JzLnNjcm9sbHNweScsIChkYXRhID0gbmV3IFNjcm9sbFNweSh0aGlzLCBvcHRpb25zKSkpXG4gICAgICBpZiAodHlwZW9mIG9wdGlvbiA9PSAnc3RyaW5nJykgZGF0YVtvcHRpb25dKClcbiAgICB9KVxuICB9XG5cbiAgdmFyIG9sZCA9ICQuZm4uc2Nyb2xsc3B5XG5cbiAgJC5mbi5zY3JvbGxzcHkgICAgICAgICAgICAgPSBQbHVnaW5cbiAgJC5mbi5zY3JvbGxzcHkuQ29uc3RydWN0b3IgPSBTY3JvbGxTcHlcblxuXG4gIC8vIFNDUk9MTFNQWSBOTyBDT05GTElDVFxuICAvLyA9PT09PT09PT09PT09PT09PT09PT1cblxuICAkLmZuLnNjcm9sbHNweS5ub0NvbmZsaWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICQuZm4uc2Nyb2xsc3B5ID0gb2xkXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG5cbiAgLy8gU0NST0xMU1BZIERBVEEtQVBJXG4gIC8vID09PT09PT09PT09PT09PT09PVxuXG4gICQod2luZG93KS5vbignbG9hZC5icy5zY3JvbGxzcHkuZGF0YS1hcGknLCBmdW5jdGlvbiAoKSB7XG4gICAgJCgnW2RhdGEtc3B5PVwic2Nyb2xsXCJdJykuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgJHNweSA9ICQodGhpcylcbiAgICAgIFBsdWdpbi5jYWxsKCRzcHksICRzcHkuZGF0YSgpKVxuICAgIH0pXG4gIH0pXG5cbn0oalF1ZXJ5KTtcblxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBCb290c3RyYXA6IHRhYi5qcyB2My40LjFcbiAqIGh0dHBzOi8vZ2V0Ym9vdHN0cmFwLmNvbS9kb2NzLzMuNC9qYXZhc2NyaXB0LyN0YWJzXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIENvcHlyaWdodCAyMDExLTIwMTkgVHdpdHRlciwgSW5jLlxuICogTGljZW5zZWQgdW5kZXIgTUlUIChodHRwczovL2dpdGh1Yi5jb20vdHdicy9ib290c3RyYXAvYmxvYi9tYXN0ZXIvTElDRU5TRSlcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqL1xuXG5cbitmdW5jdGlvbiAoJCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgLy8gVEFCIENMQVNTIERFRklOSVRJT05cbiAgLy8gPT09PT09PT09PT09PT09PT09PT1cblxuICB2YXIgVGFiID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICAvLyBqc2NzOmRpc2FibGUgcmVxdWlyZURvbGxhckJlZm9yZWpRdWVyeUFzc2lnbm1lbnRcbiAgICB0aGlzLmVsZW1lbnQgPSAkKGVsZW1lbnQpXG4gICAgLy8ganNjczplbmFibGUgcmVxdWlyZURvbGxhckJlZm9yZWpRdWVyeUFzc2lnbm1lbnRcbiAgfVxuXG4gIFRhYi5WRVJTSU9OID0gJzMuNC4xJ1xuXG4gIFRhYi5UUkFOU0lUSU9OX0RVUkFUSU9OID0gMTUwXG5cbiAgVGFiLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciAkdGhpcyAgICA9IHRoaXMuZWxlbWVudFxuICAgIHZhciAkdWwgICAgICA9ICR0aGlzLmNsb3Nlc3QoJ3VsOm5vdCguZHJvcGRvd24tbWVudSknKVxuICAgIHZhciBzZWxlY3RvciA9ICR0aGlzLmRhdGEoJ3RhcmdldCcpXG5cbiAgICBpZiAoIXNlbGVjdG9yKSB7XG4gICAgICBzZWxlY3RvciA9ICR0aGlzLmF0dHIoJ2hyZWYnKVxuICAgICAgc2VsZWN0b3IgPSBzZWxlY3RvciAmJiBzZWxlY3Rvci5yZXBsYWNlKC8uKig/PSNbXlxcc10qJCkvLCAnJykgLy8gc3RyaXAgZm9yIGllN1xuICAgIH1cblxuICAgIGlmICgkdGhpcy5wYXJlbnQoJ2xpJykuaGFzQ2xhc3MoJ2FjdGl2ZScpKSByZXR1cm5cblxuICAgIHZhciAkcHJldmlvdXMgPSAkdWwuZmluZCgnLmFjdGl2ZTpsYXN0IGEnKVxuICAgIHZhciBoaWRlRXZlbnQgPSAkLkV2ZW50KCdoaWRlLmJzLnRhYicsIHtcbiAgICAgIHJlbGF0ZWRUYXJnZXQ6ICR0aGlzWzBdXG4gICAgfSlcbiAgICB2YXIgc2hvd0V2ZW50ID0gJC5FdmVudCgnc2hvdy5icy50YWInLCB7XG4gICAgICByZWxhdGVkVGFyZ2V0OiAkcHJldmlvdXNbMF1cbiAgICB9KVxuXG4gICAgJHByZXZpb3VzLnRyaWdnZXIoaGlkZUV2ZW50KVxuICAgICR0aGlzLnRyaWdnZXIoc2hvd0V2ZW50KVxuXG4gICAgaWYgKHNob3dFdmVudC5pc0RlZmF1bHRQcmV2ZW50ZWQoKSB8fCBoaWRlRXZlbnQuaXNEZWZhdWx0UHJldmVudGVkKCkpIHJldHVyblxuXG4gICAgdmFyICR0YXJnZXQgPSAkKGRvY3VtZW50KS5maW5kKHNlbGVjdG9yKVxuXG4gICAgdGhpcy5hY3RpdmF0ZSgkdGhpcy5jbG9zZXN0KCdsaScpLCAkdWwpXG4gICAgdGhpcy5hY3RpdmF0ZSgkdGFyZ2V0LCAkdGFyZ2V0LnBhcmVudCgpLCBmdW5jdGlvbiAoKSB7XG4gICAgICAkcHJldmlvdXMudHJpZ2dlcih7XG4gICAgICAgIHR5cGU6ICdoaWRkZW4uYnMudGFiJyxcbiAgICAgICAgcmVsYXRlZFRhcmdldDogJHRoaXNbMF1cbiAgICAgIH0pXG4gICAgICAkdGhpcy50cmlnZ2VyKHtcbiAgICAgICAgdHlwZTogJ3Nob3duLmJzLnRhYicsXG4gICAgICAgIHJlbGF0ZWRUYXJnZXQ6ICRwcmV2aW91c1swXVxuICAgICAgfSlcbiAgICB9KVxuICB9XG5cbiAgVGFiLnByb3RvdHlwZS5hY3RpdmF0ZSA9IGZ1bmN0aW9uIChlbGVtZW50LCBjb250YWluZXIsIGNhbGxiYWNrKSB7XG4gICAgdmFyICRhY3RpdmUgICAgPSBjb250YWluZXIuZmluZCgnPiAuYWN0aXZlJylcbiAgICB2YXIgdHJhbnNpdGlvbiA9IGNhbGxiYWNrXG4gICAgICAmJiAkLnN1cHBvcnQudHJhbnNpdGlvblxuICAgICAgJiYgKCRhY3RpdmUubGVuZ3RoICYmICRhY3RpdmUuaGFzQ2xhc3MoJ2ZhZGUnKSB8fCAhIWNvbnRhaW5lci5maW5kKCc+IC5mYWRlJykubGVuZ3RoKVxuXG4gICAgZnVuY3Rpb24gbmV4dCgpIHtcbiAgICAgICRhY3RpdmVcbiAgICAgICAgLnJlbW92ZUNsYXNzKCdhY3RpdmUnKVxuICAgICAgICAuZmluZCgnPiAuZHJvcGRvd24tbWVudSA+IC5hY3RpdmUnKVxuICAgICAgICAucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpXG4gICAgICAgIC5lbmQoKVxuICAgICAgICAuZmluZCgnW2RhdGEtdG9nZ2xlPVwidGFiXCJdJylcbiAgICAgICAgLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCBmYWxzZSlcblxuICAgICAgZWxlbWVudFxuICAgICAgICAuYWRkQ2xhc3MoJ2FjdGl2ZScpXG4gICAgICAgIC5maW5kKCdbZGF0YS10b2dnbGU9XCJ0YWJcIl0nKVxuICAgICAgICAuYXR0cignYXJpYS1leHBhbmRlZCcsIHRydWUpXG5cbiAgICAgIGlmICh0cmFuc2l0aW9uKSB7XG4gICAgICAgIGVsZW1lbnRbMF0ub2Zmc2V0V2lkdGggLy8gcmVmbG93IGZvciB0cmFuc2l0aW9uXG4gICAgICAgIGVsZW1lbnQuYWRkQ2xhc3MoJ2luJylcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVsZW1lbnQucmVtb3ZlQ2xhc3MoJ2ZhZGUnKVxuICAgICAgfVxuXG4gICAgICBpZiAoZWxlbWVudC5wYXJlbnQoJy5kcm9wZG93bi1tZW51JykubGVuZ3RoKSB7XG4gICAgICAgIGVsZW1lbnRcbiAgICAgICAgICAuY2xvc2VzdCgnbGkuZHJvcGRvd24nKVxuICAgICAgICAgIC5hZGRDbGFzcygnYWN0aXZlJylcbiAgICAgICAgICAuZW5kKClcbiAgICAgICAgICAuZmluZCgnW2RhdGEtdG9nZ2xlPVwidGFiXCJdJylcbiAgICAgICAgICAuYXR0cignYXJpYS1leHBhbmRlZCcsIHRydWUpXG4gICAgICB9XG5cbiAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKClcbiAgICB9XG5cbiAgICAkYWN0aXZlLmxlbmd0aCAmJiB0cmFuc2l0aW9uID9cbiAgICAgICRhY3RpdmVcbiAgICAgICAgLm9uZSgnYnNUcmFuc2l0aW9uRW5kJywgbmV4dClcbiAgICAgICAgLmVtdWxhdGVUcmFuc2l0aW9uRW5kKFRhYi5UUkFOU0lUSU9OX0RVUkFUSU9OKSA6XG4gICAgICBuZXh0KClcblxuICAgICRhY3RpdmUucmVtb3ZlQ2xhc3MoJ2luJylcbiAgfVxuXG5cbiAgLy8gVEFCIFBMVUdJTiBERUZJTklUSU9OXG4gIC8vID09PT09PT09PT09PT09PT09PT09PVxuXG4gIGZ1bmN0aW9uIFBsdWdpbihvcHRpb24pIHtcbiAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciAkdGhpcyA9ICQodGhpcylcbiAgICAgIHZhciBkYXRhICA9ICR0aGlzLmRhdGEoJ2JzLnRhYicpXG5cbiAgICAgIGlmICghZGF0YSkgJHRoaXMuZGF0YSgnYnMudGFiJywgKGRhdGEgPSBuZXcgVGFiKHRoaXMpKSlcbiAgICAgIGlmICh0eXBlb2Ygb3B0aW9uID09ICdzdHJpbmcnKSBkYXRhW29wdGlvbl0oKVxuICAgIH0pXG4gIH1cblxuICB2YXIgb2xkID0gJC5mbi50YWJcblxuICAkLmZuLnRhYiAgICAgICAgICAgICA9IFBsdWdpblxuICAkLmZuLnRhYi5Db25zdHJ1Y3RvciA9IFRhYlxuXG5cbiAgLy8gVEFCIE5PIENPTkZMSUNUXG4gIC8vID09PT09PT09PT09PT09PVxuXG4gICQuZm4udGFiLm5vQ29uZmxpY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgJC5mbi50YWIgPSBvbGRcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cblxuICAvLyBUQUIgREFUQS1BUElcbiAgLy8gPT09PT09PT09PT09XG5cbiAgdmFyIGNsaWNrSGFuZGxlciA9IGZ1bmN0aW9uIChlKSB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgUGx1Z2luLmNhbGwoJCh0aGlzKSwgJ3Nob3cnKVxuICB9XG5cbiAgJChkb2N1bWVudClcbiAgICAub24oJ2NsaWNrLmJzLnRhYi5kYXRhLWFwaScsICdbZGF0YS10b2dnbGU9XCJ0YWJcIl0nLCBjbGlja0hhbmRsZXIpXG4gICAgLm9uKCdjbGljay5icy50YWIuZGF0YS1hcGknLCAnW2RhdGEtdG9nZ2xlPVwicGlsbFwiXScsIGNsaWNrSGFuZGxlcilcblxufShqUXVlcnkpO1xuXG4vKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIEJvb3RzdHJhcDogYWZmaXguanMgdjMuNC4xXG4gKiBodHRwczovL2dldGJvb3RzdHJhcC5jb20vZG9jcy8zLjQvamF2YXNjcmlwdC8jYWZmaXhcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogQ29weXJpZ2h0IDIwMTEtMjAxOSBUd2l0dGVyLCBJbmMuXG4gKiBMaWNlbnNlZCB1bmRlciBNSVQgKGh0dHBzOi8vZ2l0aHViLmNvbS90d2JzL2Jvb3RzdHJhcC9ibG9iL21hc3Rlci9MSUNFTlNFKVxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovXG5cblxuK2Z1bmN0aW9uICgkKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICAvLyBBRkZJWCBDTEFTUyBERUZJTklUSU9OXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT1cblxuICB2YXIgQWZmaXggPSBmdW5jdGlvbiAoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBBZmZpeC5ERUZBVUxUUywgb3B0aW9ucylcblxuICAgIHZhciB0YXJnZXQgPSB0aGlzLm9wdGlvbnMudGFyZ2V0ID09PSBBZmZpeC5ERUZBVUxUUy50YXJnZXQgPyAkKHRoaXMub3B0aW9ucy50YXJnZXQpIDogJChkb2N1bWVudCkuZmluZCh0aGlzLm9wdGlvbnMudGFyZ2V0KVxuXG4gICAgdGhpcy4kdGFyZ2V0ID0gdGFyZ2V0XG4gICAgICAub24oJ3Njcm9sbC5icy5hZmZpeC5kYXRhLWFwaScsICQucHJveHkodGhpcy5jaGVja1Bvc2l0aW9uLCB0aGlzKSlcbiAgICAgIC5vbignY2xpY2suYnMuYWZmaXguZGF0YS1hcGknLCAgJC5wcm94eSh0aGlzLmNoZWNrUG9zaXRpb25XaXRoRXZlbnRMb29wLCB0aGlzKSlcblxuICAgIHRoaXMuJGVsZW1lbnQgICAgID0gJChlbGVtZW50KVxuICAgIHRoaXMuYWZmaXhlZCAgICAgID0gbnVsbFxuICAgIHRoaXMudW5waW4gICAgICAgID0gbnVsbFxuICAgIHRoaXMucGlubmVkT2Zmc2V0ID0gbnVsbFxuXG4gICAgdGhpcy5jaGVja1Bvc2l0aW9uKClcbiAgfVxuXG4gIEFmZml4LlZFUlNJT04gID0gJzMuNC4xJ1xuXG4gIEFmZml4LlJFU0VUICAgID0gJ2FmZml4IGFmZml4LXRvcCBhZmZpeC1ib3R0b20nXG5cbiAgQWZmaXguREVGQVVMVFMgPSB7XG4gICAgb2Zmc2V0OiAwLFxuICAgIHRhcmdldDogd2luZG93XG4gIH1cblxuICBBZmZpeC5wcm90b3R5cGUuZ2V0U3RhdGUgPSBmdW5jdGlvbiAoc2Nyb2xsSGVpZ2h0LCBoZWlnaHQsIG9mZnNldFRvcCwgb2Zmc2V0Qm90dG9tKSB7XG4gICAgdmFyIHNjcm9sbFRvcCAgICA9IHRoaXMuJHRhcmdldC5zY3JvbGxUb3AoKVxuICAgIHZhciBwb3NpdGlvbiAgICAgPSB0aGlzLiRlbGVtZW50Lm9mZnNldCgpXG4gICAgdmFyIHRhcmdldEhlaWdodCA9IHRoaXMuJHRhcmdldC5oZWlnaHQoKVxuXG4gICAgaWYgKG9mZnNldFRvcCAhPSBudWxsICYmIHRoaXMuYWZmaXhlZCA9PSAndG9wJykgcmV0dXJuIHNjcm9sbFRvcCA8IG9mZnNldFRvcCA/ICd0b3AnIDogZmFsc2VcblxuICAgIGlmICh0aGlzLmFmZml4ZWQgPT0gJ2JvdHRvbScpIHtcbiAgICAgIGlmIChvZmZzZXRUb3AgIT0gbnVsbCkgcmV0dXJuIChzY3JvbGxUb3AgKyB0aGlzLnVucGluIDw9IHBvc2l0aW9uLnRvcCkgPyBmYWxzZSA6ICdib3R0b20nXG4gICAgICByZXR1cm4gKHNjcm9sbFRvcCArIHRhcmdldEhlaWdodCA8PSBzY3JvbGxIZWlnaHQgLSBvZmZzZXRCb3R0b20pID8gZmFsc2UgOiAnYm90dG9tJ1xuICAgIH1cblxuICAgIHZhciBpbml0aWFsaXppbmcgICA9IHRoaXMuYWZmaXhlZCA9PSBudWxsXG4gICAgdmFyIGNvbGxpZGVyVG9wICAgID0gaW5pdGlhbGl6aW5nID8gc2Nyb2xsVG9wIDogcG9zaXRpb24udG9wXG4gICAgdmFyIGNvbGxpZGVySGVpZ2h0ID0gaW5pdGlhbGl6aW5nID8gdGFyZ2V0SGVpZ2h0IDogaGVpZ2h0XG5cbiAgICBpZiAob2Zmc2V0VG9wICE9IG51bGwgJiYgc2Nyb2xsVG9wIDw9IG9mZnNldFRvcCkgcmV0dXJuICd0b3AnXG4gICAgaWYgKG9mZnNldEJvdHRvbSAhPSBudWxsICYmIChjb2xsaWRlclRvcCArIGNvbGxpZGVySGVpZ2h0ID49IHNjcm9sbEhlaWdodCAtIG9mZnNldEJvdHRvbSkpIHJldHVybiAnYm90dG9tJ1xuXG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICBBZmZpeC5wcm90b3R5cGUuZ2V0UGlubmVkT2Zmc2V0ID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLnBpbm5lZE9mZnNldCkgcmV0dXJuIHRoaXMucGlubmVkT2Zmc2V0XG4gICAgdGhpcy4kZWxlbWVudC5yZW1vdmVDbGFzcyhBZmZpeC5SRVNFVCkuYWRkQ2xhc3MoJ2FmZml4JylcbiAgICB2YXIgc2Nyb2xsVG9wID0gdGhpcy4kdGFyZ2V0LnNjcm9sbFRvcCgpXG4gICAgdmFyIHBvc2l0aW9uICA9IHRoaXMuJGVsZW1lbnQub2Zmc2V0KClcbiAgICByZXR1cm4gKHRoaXMucGlubmVkT2Zmc2V0ID0gcG9zaXRpb24udG9wIC0gc2Nyb2xsVG9wKVxuICB9XG5cbiAgQWZmaXgucHJvdG90eXBlLmNoZWNrUG9zaXRpb25XaXRoRXZlbnRMb29wID0gZnVuY3Rpb24gKCkge1xuICAgIHNldFRpbWVvdXQoJC5wcm94eSh0aGlzLmNoZWNrUG9zaXRpb24sIHRoaXMpLCAxKVxuICB9XG5cbiAgQWZmaXgucHJvdG90eXBlLmNoZWNrUG9zaXRpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCF0aGlzLiRlbGVtZW50LmlzKCc6dmlzaWJsZScpKSByZXR1cm5cblxuICAgIHZhciBoZWlnaHQgICAgICAgPSB0aGlzLiRlbGVtZW50LmhlaWdodCgpXG4gICAgdmFyIG9mZnNldCAgICAgICA9IHRoaXMub3B0aW9ucy5vZmZzZXRcbiAgICB2YXIgb2Zmc2V0VG9wICAgID0gb2Zmc2V0LnRvcFxuICAgIHZhciBvZmZzZXRCb3R0b20gPSBvZmZzZXQuYm90dG9tXG4gICAgdmFyIHNjcm9sbEhlaWdodCA9IE1hdGgubWF4KCQoZG9jdW1lbnQpLmhlaWdodCgpLCAkKGRvY3VtZW50LmJvZHkpLmhlaWdodCgpKVxuXG4gICAgaWYgKHR5cGVvZiBvZmZzZXQgIT0gJ29iamVjdCcpICAgICAgICAgb2Zmc2V0Qm90dG9tID0gb2Zmc2V0VG9wID0gb2Zmc2V0XG4gICAgaWYgKHR5cGVvZiBvZmZzZXRUb3AgPT0gJ2Z1bmN0aW9uJykgICAgb2Zmc2V0VG9wICAgID0gb2Zmc2V0LnRvcCh0aGlzLiRlbGVtZW50KVxuICAgIGlmICh0eXBlb2Ygb2Zmc2V0Qm90dG9tID09ICdmdW5jdGlvbicpIG9mZnNldEJvdHRvbSA9IG9mZnNldC5ib3R0b20odGhpcy4kZWxlbWVudClcblxuICAgIHZhciBhZmZpeCA9IHRoaXMuZ2V0U3RhdGUoc2Nyb2xsSGVpZ2h0LCBoZWlnaHQsIG9mZnNldFRvcCwgb2Zmc2V0Qm90dG9tKVxuXG4gICAgaWYgKHRoaXMuYWZmaXhlZCAhPSBhZmZpeCkge1xuICAgICAgaWYgKHRoaXMudW5waW4gIT0gbnVsbCkgdGhpcy4kZWxlbWVudC5jc3MoJ3RvcCcsICcnKVxuXG4gICAgICB2YXIgYWZmaXhUeXBlID0gJ2FmZml4JyArIChhZmZpeCA/ICctJyArIGFmZml4IDogJycpXG4gICAgICB2YXIgZSAgICAgICAgID0gJC5FdmVudChhZmZpeFR5cGUgKyAnLmJzLmFmZml4JylcblxuICAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKGUpXG5cbiAgICAgIGlmIChlLmlzRGVmYXVsdFByZXZlbnRlZCgpKSByZXR1cm5cblxuICAgICAgdGhpcy5hZmZpeGVkID0gYWZmaXhcbiAgICAgIHRoaXMudW5waW4gPSBhZmZpeCA9PSAnYm90dG9tJyA/IHRoaXMuZ2V0UGlubmVkT2Zmc2V0KCkgOiBudWxsXG5cbiAgICAgIHRoaXMuJGVsZW1lbnRcbiAgICAgICAgLnJlbW92ZUNsYXNzKEFmZml4LlJFU0VUKVxuICAgICAgICAuYWRkQ2xhc3MoYWZmaXhUeXBlKVxuICAgICAgICAudHJpZ2dlcihhZmZpeFR5cGUucmVwbGFjZSgnYWZmaXgnLCAnYWZmaXhlZCcpICsgJy5icy5hZmZpeCcpXG4gICAgfVxuXG4gICAgaWYgKGFmZml4ID09ICdib3R0b20nKSB7XG4gICAgICB0aGlzLiRlbGVtZW50Lm9mZnNldCh7XG4gICAgICAgIHRvcDogc2Nyb2xsSGVpZ2h0IC0gaGVpZ2h0IC0gb2Zmc2V0Qm90dG9tXG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG5cbiAgLy8gQUZGSVggUExVR0lOIERFRklOSVRJT05cbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT1cblxuICBmdW5jdGlvbiBQbHVnaW4ob3B0aW9uKSB7XG4gICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgJHRoaXMgICA9ICQodGhpcylcbiAgICAgIHZhciBkYXRhICAgID0gJHRoaXMuZGF0YSgnYnMuYWZmaXgnKVxuICAgICAgdmFyIG9wdGlvbnMgPSB0eXBlb2Ygb3B0aW9uID09ICdvYmplY3QnICYmIG9wdGlvblxuXG4gICAgICBpZiAoIWRhdGEpICR0aGlzLmRhdGEoJ2JzLmFmZml4JywgKGRhdGEgPSBuZXcgQWZmaXgodGhpcywgb3B0aW9ucykpKVxuICAgICAgaWYgKHR5cGVvZiBvcHRpb24gPT0gJ3N0cmluZycpIGRhdGFbb3B0aW9uXSgpXG4gICAgfSlcbiAgfVxuXG4gIHZhciBvbGQgPSAkLmZuLmFmZml4XG5cbiAgJC5mbi5hZmZpeCAgICAgICAgICAgICA9IFBsdWdpblxuICAkLmZuLmFmZml4LkNvbnN0cnVjdG9yID0gQWZmaXhcblxuXG4gIC8vIEFGRklYIE5PIENPTkZMSUNUXG4gIC8vID09PT09PT09PT09PT09PT09XG5cbiAgJC5mbi5hZmZpeC5ub0NvbmZsaWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICQuZm4uYWZmaXggPSBvbGRcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cblxuICAvLyBBRkZJWCBEQVRBLUFQSVxuICAvLyA9PT09PT09PT09PT09PVxuXG4gICQod2luZG93KS5vbignbG9hZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAkKCdbZGF0YS1zcHk9XCJhZmZpeFwiXScpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgdmFyICRzcHkgPSAkKHRoaXMpXG4gICAgICB2YXIgZGF0YSA9ICRzcHkuZGF0YSgpXG5cbiAgICAgIGRhdGEub2Zmc2V0ID0gZGF0YS5vZmZzZXQgfHwge31cblxuICAgICAgaWYgKGRhdGEub2Zmc2V0Qm90dG9tICE9IG51bGwpIGRhdGEub2Zmc2V0LmJvdHRvbSA9IGRhdGEub2Zmc2V0Qm90dG9tXG4gICAgICBpZiAoZGF0YS5vZmZzZXRUb3AgICAgIT0gbnVsbCkgZGF0YS5vZmZzZXQudG9wICAgID0gZGF0YS5vZmZzZXRUb3BcblxuICAgICAgUGx1Z2luLmNhbGwoJHNweSwgZGF0YSlcbiAgICB9KVxuICB9KVxuXG59KGpRdWVyeSk7XG4iLCIvLyB8LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIHwgRmxleHkgaGVhZGVyXG4vLyB8LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIHxcbi8vIHwgVGhpcyBqUXVlcnkgc2NyaXB0IGlzIHdyaXR0ZW4gYnlcbi8vIHxcbi8vIHwgTW9ydGVuIE5pc3NlblxuLy8gfCBoamVtbWVzaWRla29uZ2VuLmRrXG4vLyB8XG5cbnZhciBmbGV4eV9oZWFkZXIgPSAoZnVuY3Rpb24gKCQpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgcHViID0ge30sXG4gICAgICAgICRoZWFkZXJfc3RhdGljID0gJCgnLmZsZXh5LWhlYWRlci0tc3RhdGljJyksXG4gICAgICAgICRoZWFkZXJfc3RpY2t5ID0gJCgnLmZsZXh5LWhlYWRlci0tc3RpY2t5JyksXG4gICAgICAgIG9wdGlvbnMgPSB7XG4gICAgICAgICAgICB1cGRhdGVfaW50ZXJ2YWw6IDEwMCxcbiAgICAgICAgICAgIHRvbGVyYW5jZToge1xuICAgICAgICAgICAgICAgIHVwd2FyZDogMjAsXG4gICAgICAgICAgICAgICAgZG93bndhcmQ6IDEwXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb2Zmc2V0OiBfZ2V0X29mZnNldF9mcm9tX2VsZW1lbnRzX2JvdHRvbSgkaGVhZGVyX3N0YXRpYyksXG4gICAgICAgICAgICBjbGFzc2VzOiB7XG4gICAgICAgICAgICAgICAgcGlubmVkOiBcImZsZXh5LWhlYWRlci0tcGlubmVkXCIsXG4gICAgICAgICAgICAgICAgdW5waW5uZWQ6IFwiZmxleHktaGVhZGVyLS11bnBpbm5lZFwiXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHdhc19zY3JvbGxlZCA9IGZhbHNlLFxuICAgICAgICBsYXN0X2Rpc3RhbmNlX2Zyb21fdG9wID0gMDtcblxuICAgIC8qKlxuICAgICAqIEluc3RhbnRpYXRlXG4gICAgICovXG4gICAgcHViLmluaXQgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICByZWdpc3RlckV2ZW50SGFuZGxlcnMoKTtcbiAgICAgICAgcmVnaXN0ZXJCb290RXZlbnRIYW5kbGVycygpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBSZWdpc3RlciBib290IGV2ZW50IGhhbmRsZXJzXG4gICAgICovXG4gICAgZnVuY3Rpb24gcmVnaXN0ZXJCb290RXZlbnRIYW5kbGVycygpIHtcbiAgICAgICAgJGhlYWRlcl9zdGlja3kuYWRkQ2xhc3Mob3B0aW9ucy5jbGFzc2VzLnVucGlubmVkKTtcblxuICAgICAgICBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgaWYgKHdhc19zY3JvbGxlZCkge1xuICAgICAgICAgICAgICAgIGRvY3VtZW50X3dhc19zY3JvbGxlZCgpO1xuXG4gICAgICAgICAgICAgICAgd2FzX3Njcm9sbGVkID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIG9wdGlvbnMudXBkYXRlX2ludGVydmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZWdpc3RlciBldmVudCBoYW5kbGVyc1xuICAgICAqL1xuICAgIGZ1bmN0aW9uIHJlZ2lzdGVyRXZlbnRIYW5kbGVycygpIHtcbiAgICAgICAgJCh3aW5kb3cpLnNjcm9sbChmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgd2FzX3Njcm9sbGVkID0gdHJ1ZTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IG9mZnNldCBmcm9tIGVsZW1lbnQgYm90dG9tXG4gICAgICovXG4gICAgZnVuY3Rpb24gX2dldF9vZmZzZXRfZnJvbV9lbGVtZW50c19ib3R0b20oJGVsZW1lbnQpIHtcbiAgICAgICAgdmFyIGVsZW1lbnRfaGVpZ2h0ID0gJGVsZW1lbnQub3V0ZXJIZWlnaHQodHJ1ZSksXG4gICAgICAgICAgICBlbGVtZW50X29mZnNldCA9ICRlbGVtZW50Lm9mZnNldCgpLnRvcDtcblxuICAgICAgICByZXR1cm4gKGVsZW1lbnRfaGVpZ2h0ICsgZWxlbWVudF9vZmZzZXQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERvY3VtZW50IHdhcyBzY3JvbGxlZFxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGRvY3VtZW50X3dhc19zY3JvbGxlZCgpIHtcbiAgICAgICAgdmFyIGN1cnJlbnRfZGlzdGFuY2VfZnJvbV90b3AgPSAkKHdpbmRvdykuc2Nyb2xsVG9wKCk7XG5cbiAgICAgICAgLy8gSWYgcGFzdCBvZmZzZXRcbiAgICAgICAgaWYgKGN1cnJlbnRfZGlzdGFuY2VfZnJvbV90b3AgPj0gb3B0aW9ucy5vZmZzZXQpIHtcblxuICAgICAgICAgICAgLy8gRG93bndhcmRzIHNjcm9sbFxuICAgICAgICAgICAgaWYgKGN1cnJlbnRfZGlzdGFuY2VfZnJvbV90b3AgPiBsYXN0X2Rpc3RhbmNlX2Zyb21fdG9wKSB7XG5cbiAgICAgICAgICAgICAgICAvLyBPYmV5IHRoZSBkb3dud2FyZCB0b2xlcmFuY2VcbiAgICAgICAgICAgICAgICBpZiAoTWF0aC5hYnMoY3VycmVudF9kaXN0YW5jZV9mcm9tX3RvcCAtIGxhc3RfZGlzdGFuY2VfZnJvbV90b3ApIDw9IG9wdGlvbnMudG9sZXJhbmNlLmRvd253YXJkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAkaGVhZGVyX3N0aWNreS5yZW1vdmVDbGFzcyhvcHRpb25zLmNsYXNzZXMucGlubmVkKS5hZGRDbGFzcyhvcHRpb25zLmNsYXNzZXMudW5waW5uZWQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBVcHdhcmRzIHNjcm9sbFxuICAgICAgICAgICAgZWxzZSB7XG5cbiAgICAgICAgICAgICAgICAvLyBPYmV5IHRoZSB1cHdhcmQgdG9sZXJhbmNlXG4gICAgICAgICAgICAgICAgaWYgKE1hdGguYWJzKGN1cnJlbnRfZGlzdGFuY2VfZnJvbV90b3AgLSBsYXN0X2Rpc3RhbmNlX2Zyb21fdG9wKSA8PSBvcHRpb25zLnRvbGVyYW5jZS51cHdhcmQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIFdlIGFyZSBub3Qgc2Nyb2xsZWQgcGFzdCB0aGUgZG9jdW1lbnQgd2hpY2ggaXMgcG9zc2libGUgb24gdGhlIE1hY1xuICAgICAgICAgICAgICAgIGlmICgoY3VycmVudF9kaXN0YW5jZV9mcm9tX3RvcCArICQod2luZG93KS5oZWlnaHQoKSkgPCAkKGRvY3VtZW50KS5oZWlnaHQoKSkge1xuICAgICAgICAgICAgICAgICAgICAkaGVhZGVyX3N0aWNreS5yZW1vdmVDbGFzcyhvcHRpb25zLmNsYXNzZXMudW5waW5uZWQpLmFkZENsYXNzKG9wdGlvbnMuY2xhc3Nlcy5waW5uZWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE5vdCBwYXN0IG9mZnNldFxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICRoZWFkZXJfc3RpY2t5LnJlbW92ZUNsYXNzKG9wdGlvbnMuY2xhc3Nlcy5waW5uZWQpLmFkZENsYXNzKG9wdGlvbnMuY2xhc3Nlcy51bnBpbm5lZCk7XG4gICAgICAgIH1cblxuICAgICAgICBsYXN0X2Rpc3RhbmNlX2Zyb21fdG9wID0gY3VycmVudF9kaXN0YW5jZV9mcm9tX3RvcDtcbiAgICB9XG5cbiAgICByZXR1cm4gcHViO1xufSkoalF1ZXJ5KTtcbiIsIi8vIHwtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gfCBGbGV4eSBuYXZpZ2F0aW9uXG4vLyB8LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIHxcbi8vIHwgVGhpcyBqUXVlcnkgc2NyaXB0IGlzIHdyaXR0ZW4gYnlcbi8vIHxcbi8vIHwgTW9ydGVuIE5pc3NlblxuLy8gfCBoamVtbWVzaWRla29uZ2VuLmRrXG4vLyB8XG5cbnZhciBmbGV4eV9uYXZpZ2F0aW9uID0gKGZ1bmN0aW9uICgkKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIHB1YiA9IHt9LFxuICAgICAgICBsYXlvdXRfY2xhc3NlcyA9IHtcbiAgICAgICAgICAgICduYXZpZ2F0aW9uJzogJy5mbGV4eS1uYXZpZ2F0aW9uJyxcbiAgICAgICAgICAgICdvYmZ1c2NhdG9yJzogJy5mbGV4eS1uYXZpZ2F0aW9uX19vYmZ1c2NhdG9yJyxcbiAgICAgICAgICAgICdkcm9wZG93bic6ICcuZmxleHktbmF2aWdhdGlvbl9faXRlbS0tZHJvcGRvd24nLFxuICAgICAgICAgICAgJ2Ryb3Bkb3duX21lZ2FtZW51JzogJy5mbGV4eS1uYXZpZ2F0aW9uX19pdGVtX19kcm9wZG93bi1tZWdhbWVudScsXG5cbiAgICAgICAgICAgICdpc191cGdyYWRlZCc6ICdpcy11cGdyYWRlZCcsXG4gICAgICAgICAgICAnbmF2aWdhdGlvbl9oYXNfbWVnYW1lbnUnOiAnaGFzLW1lZ2FtZW51JyxcbiAgICAgICAgICAgICdkcm9wZG93bl9oYXNfbWVnYW1lbnUnOiAnZmxleHktbmF2aWdhdGlvbl9faXRlbS0tZHJvcGRvd24td2l0aC1tZWdhbWVudScsXG4gICAgICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBJbnN0YW50aWF0ZVxuICAgICAqL1xuICAgIHB1Yi5pbml0ID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgcmVnaXN0ZXJFdmVudEhhbmRsZXJzKCk7XG4gICAgICAgIHJlZ2lzdGVyQm9vdEV2ZW50SGFuZGxlcnMoKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUmVnaXN0ZXIgYm9vdCBldmVudCBoYW5kbGVyc1xuICAgICAqL1xuICAgIGZ1bmN0aW9uIHJlZ2lzdGVyQm9vdEV2ZW50SGFuZGxlcnMoKSB7XG5cbiAgICAgICAgLy8gVXBncmFkZVxuICAgICAgICB1cGdyYWRlKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVnaXN0ZXIgZXZlbnQgaGFuZGxlcnNcbiAgICAgKi9cbiAgICBmdW5jdGlvbiByZWdpc3RlckV2ZW50SGFuZGxlcnMoKSB7fVxuXG4gICAgLyoqXG4gICAgICogVXBncmFkZSBlbGVtZW50cy5cbiAgICAgKiBBZGQgY2xhc3NlcyB0byBlbGVtZW50cywgYmFzZWQgdXBvbiBhdHRhY2hlZCBjbGFzc2VzLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHVwZ3JhZGUoKSB7XG4gICAgICAgIHZhciAkbmF2aWdhdGlvbnMgPSAkKGxheW91dF9jbGFzc2VzLm5hdmlnYXRpb24pO1xuXG4gICAgICAgIC8vIE5hdmlnYXRpb25zXG4gICAgICAgIGlmICgkbmF2aWdhdGlvbnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgJG5hdmlnYXRpb25zLmVhY2goZnVuY3Rpb24oaW5kZXgsIGVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICB2YXIgJG5hdmlnYXRpb24gPSAkKHRoaXMpLFxuICAgICAgICAgICAgICAgICAgICAkbWVnYW1lbnVzID0gJG5hdmlnYXRpb24uZmluZChsYXlvdXRfY2xhc3Nlcy5kcm9wZG93bl9tZWdhbWVudSksXG4gICAgICAgICAgICAgICAgICAgICRkcm9wZG93bl9tZWdhbWVudSA9ICRuYXZpZ2F0aW9uLmZpbmQobGF5b3V0X2NsYXNzZXMuZHJvcGRvd25faGFzX21lZ2FtZW51KTtcblxuICAgICAgICAgICAgICAgIC8vIEhhcyBhbHJlYWR5IGJlZW4gdXBncmFkZWRcbiAgICAgICAgICAgICAgICBpZiAoJG5hdmlnYXRpb24uaGFzQ2xhc3MobGF5b3V0X2NsYXNzZXMuaXNfdXBncmFkZWQpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBIYXMgbWVnYW1lbnVcbiAgICAgICAgICAgICAgICBpZiAoJG1lZ2FtZW51cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICRuYXZpZ2F0aW9uLmFkZENsYXNzKGxheW91dF9jbGFzc2VzLm5hdmlnYXRpb25faGFzX21lZ2FtZW51KTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBSdW4gdGhyb3VnaCBhbGwgbWVnYW1lbnVzXG4gICAgICAgICAgICAgICAgICAgICRtZWdhbWVudXMuZWFjaChmdW5jdGlvbihpbmRleCwgZWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyICRtZWdhbWVudSA9ICQodGhpcyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFzX29iZnVzY2F0b3IgPSAkKCdodG1sJykuaGFzQ2xhc3MoJ2hhcy1vYmZ1c2NhdG9yJykgPyB0cnVlIDogZmFsc2U7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICRtZWdhbWVudS5wYXJlbnRzKGxheW91dF9jbGFzc2VzLmRyb3Bkb3duKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hZGRDbGFzcyhsYXlvdXRfY2xhc3Nlcy5kcm9wZG93bl9oYXNfbWVnYW1lbnUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmhvdmVyKGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChoYXNfb2JmdXNjYXRvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2JmdXNjYXRvci5zaG93KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChoYXNfb2JmdXNjYXRvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2JmdXNjYXRvci5oaWRlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gSXMgdXBncmFkZWRcbiAgICAgICAgICAgICAgICAkbmF2aWdhdGlvbi5hZGRDbGFzcyhsYXlvdXRfY2xhc3Nlcy5pc191cGdyYWRlZCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBwdWI7XG59KShqUXVlcnkpO1xuIiwiLyohIHNpZHIgLSB2Mi4yLjEgLSAyMDE2LTAyLTE3XG4gKiBodHRwOi8vd3d3LmJlcnJpYXJ0LmNvbS9zaWRyL1xuICogQ29weXJpZ2h0IChjKSAyMDEzLTIwMTYgQWxiZXJ0byBWYXJlbGE7IExpY2Vuc2VkIE1JVCAqL1xuXG4oZnVuY3Rpb24gKCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgdmFyIGJhYmVsSGVscGVycyA9IHt9O1xuXG4gIGJhYmVsSGVscGVycy5jbGFzc0NhbGxDaGVjayA9IGZ1bmN0aW9uIChpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHtcbiAgICBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTtcbiAgICB9XG4gIH07XG5cbiAgYmFiZWxIZWxwZXJzLmNyZWF0ZUNsYXNzID0gZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldO1xuICAgICAgICBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7XG4gICAgICAgIGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTtcbiAgICAgICAgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7XG4gICAgICBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpO1xuICAgICAgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7XG4gICAgICByZXR1cm4gQ29uc3RydWN0b3I7XG4gICAgfTtcbiAgfSgpO1xuXG4gIGJhYmVsSGVscGVycztcblxuICB2YXIgc2lkclN0YXR1cyA9IHtcbiAgICBtb3Zpbmc6IGZhbHNlLFxuICAgIG9wZW5lZDogZmFsc2VcbiAgfTtcblxuICB2YXIgaGVscGVyID0ge1xuICAgIC8vIENoZWNrIGZvciB2YWxpZHMgdXJsc1xuICAgIC8vIEZyb20gOiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzU3MTcwOTMvY2hlY2staWYtYS1qYXZhc2NyaXB0LXN0cmluZy1pcy1hbi11cmxcblxuICAgIGlzVXJsOiBmdW5jdGlvbiBpc1VybChzdHIpIHtcbiAgICAgIHZhciBwYXR0ZXJuID0gbmV3IFJlZ0V4cCgnXihodHRwcz86XFxcXC9cXFxcLyk/JyArIC8vIHByb3RvY29sXG4gICAgICAnKCgoW2EtelxcXFxkXShbYS16XFxcXGQtXSpbYS16XFxcXGRdKSopXFxcXC4/KStbYS16XXsyLH18JyArIC8vIGRvbWFpbiBuYW1lXG4gICAgICAnKChcXFxcZHsxLDN9XFxcXC4pezN9XFxcXGR7MSwzfSkpJyArIC8vIE9SIGlwICh2NCkgYWRkcmVzc1xuICAgICAgJyhcXFxcOlxcXFxkKyk/KFxcXFwvWy1hLXpcXFxcZCVfLn4rXSopKicgKyAvLyBwb3J0IGFuZCBwYXRoXG4gICAgICAnKFxcXFw/WzsmYS16XFxcXGQlXy5+Kz0tXSopPycgKyAvLyBxdWVyeSBzdHJpbmdcbiAgICAgICcoXFxcXCNbLWEtelxcXFxkX10qKT8kJywgJ2knKTsgLy8gZnJhZ21lbnQgbG9jYXRvclxuXG4gICAgICBpZiAocGF0dGVybi50ZXN0KHN0cikpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfSxcblxuXG4gICAgLy8gQWRkIHNpZHIgcHJlZml4ZXNcbiAgICBhZGRQcmVmaXhlczogZnVuY3Rpb24gYWRkUHJlZml4ZXMoJGVsZW1lbnQpIHtcbiAgICAgIHRoaXMuYWRkUHJlZml4KCRlbGVtZW50LCAnaWQnKTtcbiAgICAgIHRoaXMuYWRkUHJlZml4KCRlbGVtZW50LCAnY2xhc3MnKTtcbiAgICAgICRlbGVtZW50LnJlbW92ZUF0dHIoJ3N0eWxlJyk7XG4gICAgfSxcbiAgICBhZGRQcmVmaXg6IGZ1bmN0aW9uIGFkZFByZWZpeCgkZWxlbWVudCwgYXR0cmlidXRlKSB7XG4gICAgICB2YXIgdG9SZXBsYWNlID0gJGVsZW1lbnQuYXR0cihhdHRyaWJ1dGUpO1xuXG4gICAgICBpZiAodHlwZW9mIHRvUmVwbGFjZSA9PT0gJ3N0cmluZycgJiYgdG9SZXBsYWNlICE9PSAnJyAmJiB0b1JlcGxhY2UgIT09ICdzaWRyLWlubmVyJykge1xuICAgICAgICAkZWxlbWVudC5hdHRyKGF0dHJpYnV0ZSwgdG9SZXBsYWNlLnJlcGxhY2UoLyhbQS1aYS16MC05Xy5cXC1dKykvZywgJ3NpZHItJyArIGF0dHJpYnV0ZSArICctJDEnKSk7XG4gICAgICB9XG4gICAgfSxcblxuXG4gICAgLy8gQ2hlY2sgaWYgdHJhbnNpdGlvbnMgaXMgc3VwcG9ydGVkXG4gICAgdHJhbnNpdGlvbnM6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBib2R5ID0gZG9jdW1lbnQuYm9keSB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsXG4gICAgICAgICAgc3R5bGUgPSBib2R5LnN0eWxlLFxuICAgICAgICAgIHN1cHBvcnRlZCA9IGZhbHNlLFxuICAgICAgICAgIHByb3BlcnR5ID0gJ3RyYW5zaXRpb24nO1xuXG4gICAgICBpZiAocHJvcGVydHkgaW4gc3R5bGUpIHtcbiAgICAgICAgc3VwcG9ydGVkID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgdmFyIHByZWZpeGVzID0gWydtb3onLCAnd2Via2l0JywgJ28nLCAnbXMnXSxcbiAgICAgICAgICAgICAgcHJlZml4ID0gdW5kZWZpbmVkLFxuICAgICAgICAgICAgICBpID0gdW5kZWZpbmVkO1xuXG4gICAgICAgICAgcHJvcGVydHkgPSBwcm9wZXJ0eS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHByb3BlcnR5LnN1YnN0cigxKTtcbiAgICAgICAgICBzdXBwb3J0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgcHJlZml4ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgcHJlZml4ID0gcHJlZml4ZXNbaV07XG4gICAgICAgICAgICAgIGlmIChwcmVmaXggKyBwcm9wZXJ0eSBpbiBzdHlsZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9KCk7XG4gICAgICAgICAgcHJvcGVydHkgPSBzdXBwb3J0ZWQgPyAnLScgKyBwcmVmaXgudG9Mb3dlckNhc2UoKSArICctJyArIHByb3BlcnR5LnRvTG93ZXJDYXNlKCkgOiBudWxsO1xuICAgICAgICB9KSgpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdXBwb3J0ZWQ6IHN1cHBvcnRlZCxcbiAgICAgICAgcHJvcGVydHk6IHByb3BlcnR5XG4gICAgICB9O1xuICAgIH0oKVxuICB9O1xuXG4gIHZhciAkJDIgPSBqUXVlcnk7XG5cbiAgdmFyIGJvZHlBbmltYXRpb25DbGFzcyA9ICdzaWRyLWFuaW1hdGluZyc7XG4gIHZhciBvcGVuQWN0aW9uID0gJ29wZW4nO1xuICB2YXIgY2xvc2VBY3Rpb24gPSAnY2xvc2UnO1xuICB2YXIgdHJhbnNpdGlvbkVuZEV2ZW50ID0gJ3dlYmtpdFRyYW5zaXRpb25FbmQgb3RyYW5zaXRpb25lbmQgb1RyYW5zaXRpb25FbmQgbXNUcmFuc2l0aW9uRW5kIHRyYW5zaXRpb25lbmQnO1xuICB2YXIgTWVudSA9IGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBNZW51KG5hbWUpIHtcbiAgICAgIGJhYmVsSGVscGVycy5jbGFzc0NhbGxDaGVjayh0aGlzLCBNZW51KTtcblxuICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgIHRoaXMuaXRlbSA9ICQkMignIycgKyBuYW1lKTtcbiAgICAgIHRoaXMub3BlbkNsYXNzID0gbmFtZSA9PT0gJ3NpZHInID8gJ3NpZHItb3BlbicgOiAnc2lkci1vcGVuICcgKyBuYW1lICsgJy1vcGVuJztcbiAgICAgIHRoaXMubWVudVdpZHRoID0gdGhpcy5pdGVtLm91dGVyV2lkdGgodHJ1ZSk7XG4gICAgICB0aGlzLnNwZWVkID0gdGhpcy5pdGVtLmRhdGEoJ3NwZWVkJyk7XG4gICAgICB0aGlzLnNpZGUgPSB0aGlzLml0ZW0uZGF0YSgnc2lkZScpO1xuICAgICAgdGhpcy5kaXNwbGFjZSA9IHRoaXMuaXRlbS5kYXRhKCdkaXNwbGFjZScpO1xuICAgICAgdGhpcy50aW1pbmcgPSB0aGlzLml0ZW0uZGF0YSgndGltaW5nJyk7XG4gICAgICB0aGlzLm1ldGhvZCA9IHRoaXMuaXRlbS5kYXRhKCdtZXRob2QnKTtcbiAgICAgIHRoaXMub25PcGVuQ2FsbGJhY2sgPSB0aGlzLml0ZW0uZGF0YSgnb25PcGVuJyk7XG4gICAgICB0aGlzLm9uQ2xvc2VDYWxsYmFjayA9IHRoaXMuaXRlbS5kYXRhKCdvbkNsb3NlJyk7XG4gICAgICB0aGlzLm9uT3BlbkVuZENhbGxiYWNrID0gdGhpcy5pdGVtLmRhdGEoJ29uT3BlbkVuZCcpO1xuICAgICAgdGhpcy5vbkNsb3NlRW5kQ2FsbGJhY2sgPSB0aGlzLml0ZW0uZGF0YSgnb25DbG9zZUVuZCcpO1xuICAgICAgdGhpcy5ib2R5ID0gJCQyKHRoaXMuaXRlbS5kYXRhKCdib2R5JykpO1xuICAgIH1cblxuICAgIGJhYmVsSGVscGVycy5jcmVhdGVDbGFzcyhNZW51LCBbe1xuICAgICAga2V5OiAnZ2V0QW5pbWF0aW9uJyxcbiAgICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRBbmltYXRpb24oYWN0aW9uLCBlbGVtZW50KSB7XG4gICAgICAgIHZhciBhbmltYXRpb24gPSB7fSxcbiAgICAgICAgICAgIHByb3AgPSB0aGlzLnNpZGU7XG5cbiAgICAgICAgaWYgKGFjdGlvbiA9PT0gJ29wZW4nICYmIGVsZW1lbnQgPT09ICdib2R5Jykge1xuICAgICAgICAgIGFuaW1hdGlvbltwcm9wXSA9IHRoaXMubWVudVdpZHRoICsgJ3B4JztcbiAgICAgICAgfSBlbHNlIGlmIChhY3Rpb24gPT09ICdjbG9zZScgJiYgZWxlbWVudCA9PT0gJ21lbnUnKSB7XG4gICAgICAgICAgYW5pbWF0aW9uW3Byb3BdID0gJy0nICsgdGhpcy5tZW51V2lkdGggKyAncHgnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGFuaW1hdGlvbltwcm9wXSA9IDA7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYW5pbWF0aW9uO1xuICAgICAgfVxuICAgIH0sIHtcbiAgICAgIGtleTogJ3ByZXBhcmVCb2R5JyxcbiAgICAgIHZhbHVlOiBmdW5jdGlvbiBwcmVwYXJlQm9keShhY3Rpb24pIHtcbiAgICAgICAgdmFyIHByb3AgPSBhY3Rpb24gPT09ICdvcGVuJyA/ICdoaWRkZW4nIDogJyc7XG5cbiAgICAgICAgLy8gUHJlcGFyZSBwYWdlIGlmIGNvbnRhaW5lciBpcyBib2R5XG4gICAgICAgIGlmICh0aGlzLmJvZHkuaXMoJ2JvZHknKSkge1xuICAgICAgICAgIHZhciAkaHRtbCA9ICQkMignaHRtbCcpLFxuICAgICAgICAgICAgICBzY3JvbGxUb3AgPSAkaHRtbC5zY3JvbGxUb3AoKTtcblxuICAgICAgICAgICRodG1sLmNzcygnb3ZlcmZsb3cteCcsIHByb3ApLnNjcm9sbFRvcChzY3JvbGxUb3ApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSwge1xuICAgICAga2V5OiAnb3BlbkJvZHknLFxuICAgICAgdmFsdWU6IGZ1bmN0aW9uIG9wZW5Cb2R5KCkge1xuICAgICAgICBpZiAodGhpcy5kaXNwbGFjZSkge1xuICAgICAgICAgIHZhciB0cmFuc2l0aW9ucyA9IGhlbHBlci50cmFuc2l0aW9ucyxcbiAgICAgICAgICAgICAgJGJvZHkgPSB0aGlzLmJvZHk7XG5cbiAgICAgICAgICBpZiAodHJhbnNpdGlvbnMuc3VwcG9ydGVkKSB7XG4gICAgICAgICAgICAkYm9keS5jc3ModHJhbnNpdGlvbnMucHJvcGVydHksIHRoaXMuc2lkZSArICcgJyArIHRoaXMuc3BlZWQgLyAxMDAwICsgJ3MgJyArIHRoaXMudGltaW5nKS5jc3ModGhpcy5zaWRlLCAwKS5jc3Moe1xuICAgICAgICAgICAgICB3aWR0aDogJGJvZHkud2lkdGgoKSxcbiAgICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZSdcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgJGJvZHkuY3NzKHRoaXMuc2lkZSwgdGhpcy5tZW51V2lkdGggKyAncHgnKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIGJvZHlBbmltYXRpb24gPSB0aGlzLmdldEFuaW1hdGlvbihvcGVuQWN0aW9uLCAnYm9keScpO1xuXG4gICAgICAgICAgICAkYm9keS5jc3Moe1xuICAgICAgICAgICAgICB3aWR0aDogJGJvZHkud2lkdGgoKSxcbiAgICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZSdcbiAgICAgICAgICAgIH0pLmFuaW1hdGUoYm9keUFuaW1hdGlvbiwge1xuICAgICAgICAgICAgICBxdWV1ZTogZmFsc2UsXG4gICAgICAgICAgICAgIGR1cmF0aW9uOiB0aGlzLnNwZWVkXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LCB7XG4gICAgICBrZXk6ICdvbkNsb3NlQm9keScsXG4gICAgICB2YWx1ZTogZnVuY3Rpb24gb25DbG9zZUJvZHkoKSB7XG4gICAgICAgIHZhciB0cmFuc2l0aW9ucyA9IGhlbHBlci50cmFuc2l0aW9ucyxcbiAgICAgICAgICAgIHJlc2V0U3R5bGVzID0ge1xuICAgICAgICAgIHdpZHRoOiAnJyxcbiAgICAgICAgICBwb3NpdGlvbjogJycsXG4gICAgICAgICAgcmlnaHQ6ICcnLFxuICAgICAgICAgIGxlZnQ6ICcnXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKHRyYW5zaXRpb25zLnN1cHBvcnRlZCkge1xuICAgICAgICAgIHJlc2V0U3R5bGVzW3RyYW5zaXRpb25zLnByb3BlcnR5XSA9ICcnO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5ib2R5LmNzcyhyZXNldFN0eWxlcykudW5iaW5kKHRyYW5zaXRpb25FbmRFdmVudCk7XG4gICAgICB9XG4gICAgfSwge1xuICAgICAga2V5OiAnY2xvc2VCb2R5JyxcbiAgICAgIHZhbHVlOiBmdW5jdGlvbiBjbG9zZUJvZHkoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAgICAgaWYgKHRoaXMuZGlzcGxhY2UpIHtcbiAgICAgICAgICBpZiAoaGVscGVyLnRyYW5zaXRpb25zLnN1cHBvcnRlZCkge1xuICAgICAgICAgICAgdGhpcy5ib2R5LmNzcyh0aGlzLnNpZGUsIDApLm9uZSh0cmFuc2l0aW9uRW5kRXZlbnQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgX3RoaXMub25DbG9zZUJvZHkoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgYm9keUFuaW1hdGlvbiA9IHRoaXMuZ2V0QW5pbWF0aW9uKGNsb3NlQWN0aW9uLCAnYm9keScpO1xuXG4gICAgICAgICAgICB0aGlzLmJvZHkuYW5pbWF0ZShib2R5QW5pbWF0aW9uLCB7XG4gICAgICAgICAgICAgIHF1ZXVlOiBmYWxzZSxcbiAgICAgICAgICAgICAgZHVyYXRpb246IHRoaXMuc3BlZWQsXG4gICAgICAgICAgICAgIGNvbXBsZXRlOiBmdW5jdGlvbiBjb21wbGV0ZSgpIHtcbiAgICAgICAgICAgICAgICBfdGhpcy5vbkNsb3NlQm9keSgpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LCB7XG4gICAgICBrZXk6ICdtb3ZlQm9keScsXG4gICAgICB2YWx1ZTogZnVuY3Rpb24gbW92ZUJvZHkoYWN0aW9uKSB7XG4gICAgICAgIGlmIChhY3Rpb24gPT09IG9wZW5BY3Rpb24pIHtcbiAgICAgICAgICB0aGlzLm9wZW5Cb2R5KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5jbG9zZUJvZHkoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sIHtcbiAgICAgIGtleTogJ29uT3Blbk1lbnUnLFxuICAgICAgdmFsdWU6IGZ1bmN0aW9uIG9uT3Blbk1lbnUoY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIG5hbWUgPSB0aGlzLm5hbWU7XG5cbiAgICAgICAgc2lkclN0YXR1cy5tb3ZpbmcgPSBmYWxzZTtcbiAgICAgICAgc2lkclN0YXR1cy5vcGVuZWQgPSBuYW1lO1xuXG4gICAgICAgIHRoaXMuaXRlbS51bmJpbmQodHJhbnNpdGlvbkVuZEV2ZW50KTtcblxuICAgICAgICB0aGlzLmJvZHkucmVtb3ZlQ2xhc3MoYm9keUFuaW1hdGlvbkNsYXNzKS5hZGRDbGFzcyh0aGlzLm9wZW5DbGFzcyk7XG5cbiAgICAgICAgdGhpcy5vbk9wZW5FbmRDYWxsYmFjaygpO1xuXG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICBjYWxsYmFjayhuYW1lKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sIHtcbiAgICAgIGtleTogJ29wZW5NZW51JyxcbiAgICAgIHZhbHVlOiBmdW5jdGlvbiBvcGVuTWVudShjYWxsYmFjaykge1xuICAgICAgICB2YXIgX3RoaXMyID0gdGhpcztcblxuICAgICAgICB2YXIgJGl0ZW0gPSB0aGlzLml0ZW07XG5cbiAgICAgICAgaWYgKGhlbHBlci50cmFuc2l0aW9ucy5zdXBwb3J0ZWQpIHtcbiAgICAgICAgICAkaXRlbS5jc3ModGhpcy5zaWRlLCAwKS5vbmUodHJhbnNpdGlvbkVuZEV2ZW50LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBfdGhpczIub25PcGVuTWVudShjYWxsYmFjayk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIG1lbnVBbmltYXRpb24gPSB0aGlzLmdldEFuaW1hdGlvbihvcGVuQWN0aW9uLCAnbWVudScpO1xuXG4gICAgICAgICAgJGl0ZW0uY3NzKCdkaXNwbGF5JywgJ2Jsb2NrJykuYW5pbWF0ZShtZW51QW5pbWF0aW9uLCB7XG4gICAgICAgICAgICBxdWV1ZTogZmFsc2UsXG4gICAgICAgICAgICBkdXJhdGlvbjogdGhpcy5zcGVlZCxcbiAgICAgICAgICAgIGNvbXBsZXRlOiBmdW5jdGlvbiBjb21wbGV0ZSgpIHtcbiAgICAgICAgICAgICAgX3RoaXMyLm9uT3Blbk1lbnUoY2FsbGJhY2spO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSwge1xuICAgICAga2V5OiAnb25DbG9zZU1lbnUnLFxuICAgICAgdmFsdWU6IGZ1bmN0aW9uIG9uQ2xvc2VNZW51KGNhbGxiYWNrKSB7XG4gICAgICAgIHRoaXMuaXRlbS5jc3Moe1xuICAgICAgICAgIGxlZnQ6ICcnLFxuICAgICAgICAgIHJpZ2h0OiAnJ1xuICAgICAgICB9KS51bmJpbmQodHJhbnNpdGlvbkVuZEV2ZW50KTtcbiAgICAgICAgJCQyKCdodG1sJykuY3NzKCdvdmVyZmxvdy14JywgJycpO1xuXG4gICAgICAgIHNpZHJTdGF0dXMubW92aW5nID0gZmFsc2U7XG4gICAgICAgIHNpZHJTdGF0dXMub3BlbmVkID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5ib2R5LnJlbW92ZUNsYXNzKGJvZHlBbmltYXRpb25DbGFzcykucmVtb3ZlQ2xhc3ModGhpcy5vcGVuQ2xhc3MpO1xuXG4gICAgICAgIHRoaXMub25DbG9zZUVuZENhbGxiYWNrKCk7XG5cbiAgICAgICAgLy8gQ2FsbGJhY2tcbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIGNhbGxiYWNrKG5hbWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSwge1xuICAgICAga2V5OiAnY2xvc2VNZW51JyxcbiAgICAgIHZhbHVlOiBmdW5jdGlvbiBjbG9zZU1lbnUoY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIF90aGlzMyA9IHRoaXM7XG5cbiAgICAgICAgdmFyIGl0ZW0gPSB0aGlzLml0ZW07XG5cbiAgICAgICAgaWYgKGhlbHBlci50cmFuc2l0aW9ucy5zdXBwb3J0ZWQpIHtcbiAgICAgICAgICBpdGVtLmNzcyh0aGlzLnNpZGUsICcnKS5vbmUodHJhbnNpdGlvbkVuZEV2ZW50LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBfdGhpczMub25DbG9zZU1lbnUoY2FsbGJhY2spO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBtZW51QW5pbWF0aW9uID0gdGhpcy5nZXRBbmltYXRpb24oY2xvc2VBY3Rpb24sICdtZW51Jyk7XG5cbiAgICAgICAgICBpdGVtLmFuaW1hdGUobWVudUFuaW1hdGlvbiwge1xuICAgICAgICAgICAgcXVldWU6IGZhbHNlLFxuICAgICAgICAgICAgZHVyYXRpb246IHRoaXMuc3BlZWQsXG4gICAgICAgICAgICBjb21wbGV0ZTogZnVuY3Rpb24gY29tcGxldGUoKSB7XG4gICAgICAgICAgICAgIF90aGlzMy5vbkNsb3NlTWVudSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSwge1xuICAgICAga2V5OiAnbW92ZU1lbnUnLFxuICAgICAgdmFsdWU6IGZ1bmN0aW9uIG1vdmVNZW51KGFjdGlvbiwgY2FsbGJhY2spIHtcbiAgICAgICAgdGhpcy5ib2R5LmFkZENsYXNzKGJvZHlBbmltYXRpb25DbGFzcyk7XG5cbiAgICAgICAgaWYgKGFjdGlvbiA9PT0gb3BlbkFjdGlvbikge1xuICAgICAgICAgIHRoaXMub3Blbk1lbnUoY2FsbGJhY2spO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuY2xvc2VNZW51KGNhbGxiYWNrKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sIHtcbiAgICAgIGtleTogJ21vdmUnLFxuICAgICAgdmFsdWU6IGZ1bmN0aW9uIG1vdmUoYWN0aW9uLCBjYWxsYmFjaykge1xuICAgICAgICAvLyBMb2NrIHNpZHJcbiAgICAgICAgc2lkclN0YXR1cy5tb3ZpbmcgPSB0cnVlO1xuXG4gICAgICAgIHRoaXMucHJlcGFyZUJvZHkoYWN0aW9uKTtcbiAgICAgICAgdGhpcy5tb3ZlQm9keShhY3Rpb24pO1xuICAgICAgICB0aGlzLm1vdmVNZW51KGFjdGlvbiwgY2FsbGJhY2spO1xuICAgICAgfVxuICAgIH0sIHtcbiAgICAgIGtleTogJ29wZW4nLFxuICAgICAgdmFsdWU6IGZ1bmN0aW9uIG9wZW4oY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIF90aGlzNCA9IHRoaXM7XG5cbiAgICAgICAgLy8gQ2hlY2sgaWYgaXMgYWxyZWFkeSBvcGVuZWQgb3IgbW92aW5nXG4gICAgICAgIGlmIChzaWRyU3RhdHVzLm9wZW5lZCA9PT0gdGhpcy5uYW1lIHx8IHNpZHJTdGF0dXMubW92aW5nKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgYW5vdGhlciBtZW51IG9wZW5lZCBjbG9zZSBmaXJzdFxuICAgICAgICBpZiAoc2lkclN0YXR1cy5vcGVuZWQgIT09IGZhbHNlKSB7XG4gICAgICAgICAgdmFyIGFscmVhZHlPcGVuZWRNZW51ID0gbmV3IE1lbnUoc2lkclN0YXR1cy5vcGVuZWQpO1xuXG4gICAgICAgICAgYWxyZWFkeU9wZW5lZE1lbnUuY2xvc2UoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgX3RoaXM0Lm9wZW4oY2FsbGJhY2spO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5tb3ZlKCdvcGVuJywgY2FsbGJhY2spO1xuXG4gICAgICAgIC8vIG9uT3BlbiBjYWxsYmFja1xuICAgICAgICB0aGlzLm9uT3BlbkNhbGxiYWNrKCk7XG4gICAgICB9XG4gICAgfSwge1xuICAgICAga2V5OiAnY2xvc2UnLFxuICAgICAgdmFsdWU6IGZ1bmN0aW9uIGNsb3NlKGNhbGxiYWNrKSB7XG4gICAgICAgIC8vIENoZWNrIGlmIGlzIGFscmVhZHkgY2xvc2VkIG9yIG1vdmluZ1xuICAgICAgICBpZiAoc2lkclN0YXR1cy5vcGVuZWQgIT09IHRoaXMubmFtZSB8fCBzaWRyU3RhdHVzLm1vdmluZykge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMubW92ZSgnY2xvc2UnLCBjYWxsYmFjayk7XG5cbiAgICAgICAgLy8gb25DbG9zZSBjYWxsYmFja1xuICAgICAgICB0aGlzLm9uQ2xvc2VDYWxsYmFjaygpO1xuICAgICAgfVxuICAgIH0sIHtcbiAgICAgIGtleTogJ3RvZ2dsZScsXG4gICAgICB2YWx1ZTogZnVuY3Rpb24gdG9nZ2xlKGNhbGxiYWNrKSB7XG4gICAgICAgIGlmIChzaWRyU3RhdHVzLm9wZW5lZCA9PT0gdGhpcy5uYW1lKSB7XG4gICAgICAgICAgdGhpcy5jbG9zZShjYWxsYmFjayk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5vcGVuKGNhbGxiYWNrKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1dKTtcbiAgICByZXR1cm4gTWVudTtcbiAgfSgpO1xuXG4gIHZhciAkJDEgPSBqUXVlcnk7XG5cbiAgZnVuY3Rpb24gZXhlY3V0ZShhY3Rpb24sIG5hbWUsIGNhbGxiYWNrKSB7XG4gICAgdmFyIHNpZHIgPSBuZXcgTWVudShuYW1lKTtcblxuICAgIHN3aXRjaCAoYWN0aW9uKSB7XG4gICAgICBjYXNlICdvcGVuJzpcbiAgICAgICAgc2lkci5vcGVuKGNhbGxiYWNrKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdjbG9zZSc6XG4gICAgICAgIHNpZHIuY2xvc2UoY2FsbGJhY2spO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3RvZ2dsZSc6XG4gICAgICAgIHNpZHIudG9nZ2xlKGNhbGxiYWNrKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICAkJDEuZXJyb3IoJ01ldGhvZCAnICsgYWN0aW9uICsgJyBkb2VzIG5vdCBleGlzdCBvbiBqUXVlcnkuc2lkcicpO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICB2YXIgaTtcbiAgdmFyICQgPSBqUXVlcnk7XG4gIHZhciBwdWJsaWNNZXRob2RzID0gWydvcGVuJywgJ2Nsb3NlJywgJ3RvZ2dsZSddO1xuICB2YXIgbWV0aG9kTmFtZTtcbiAgdmFyIG1ldGhvZHMgPSB7fTtcbiAgdmFyIGdldE1ldGhvZCA9IGZ1bmN0aW9uIGdldE1ldGhvZChtZXRob2ROYW1lKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChuYW1lLCBjYWxsYmFjaykge1xuICAgICAgLy8gQ2hlY2sgYXJndW1lbnRzXG4gICAgICBpZiAodHlwZW9mIG5hbWUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgY2FsbGJhY2sgPSBuYW1lO1xuICAgICAgICBuYW1lID0gJ3NpZHInO1xuICAgICAgfSBlbHNlIGlmICghbmFtZSkge1xuICAgICAgICBuYW1lID0gJ3NpZHInO1xuICAgICAgfVxuXG4gICAgICBleGVjdXRlKG1ldGhvZE5hbWUsIG5hbWUsIGNhbGxiYWNrKTtcbiAgICB9O1xuICB9O1xuICBmb3IgKGkgPSAwOyBpIDwgcHVibGljTWV0aG9kcy5sZW5ndGg7IGkrKykge1xuICAgIG1ldGhvZE5hbWUgPSBwdWJsaWNNZXRob2RzW2ldO1xuICAgIG1ldGhvZHNbbWV0aG9kTmFtZV0gPSBnZXRNZXRob2QobWV0aG9kTmFtZSk7XG4gIH1cblxuICBmdW5jdGlvbiBzaWRyKG1ldGhvZCkge1xuICAgIGlmIChtZXRob2QgPT09ICdzdGF0dXMnKSB7XG4gICAgICByZXR1cm4gc2lkclN0YXR1cztcbiAgICB9IGVsc2UgaWYgKG1ldGhvZHNbbWV0aG9kXSkge1xuICAgICAgcmV0dXJuIG1ldGhvZHNbbWV0aG9kXS5hcHBseSh0aGlzLCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBtZXRob2QgPT09ICdmdW5jdGlvbicgfHwgdHlwZW9mIG1ldGhvZCA9PT0gJ3N0cmluZycgfHwgIW1ldGhvZCkge1xuICAgICAgcmV0dXJuIG1ldGhvZHMudG9nZ2xlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICQuZXJyb3IoJ01ldGhvZCAnICsgbWV0aG9kICsgJyBkb2VzIG5vdCBleGlzdCBvbiBqUXVlcnkuc2lkcicpO1xuICAgIH1cbiAgfVxuXG4gIHZhciAkJDMgPSBqUXVlcnk7XG5cbiAgZnVuY3Rpb24gZmlsbENvbnRlbnQoJHNpZGVNZW51LCBzZXR0aW5ncykge1xuICAgIC8vIFRoZSBtZW51IGNvbnRlbnRcbiAgICBpZiAodHlwZW9mIHNldHRpbmdzLnNvdXJjZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdmFyIG5ld0NvbnRlbnQgPSBzZXR0aW5ncy5zb3VyY2UobmFtZSk7XG5cbiAgICAgICRzaWRlTWVudS5odG1sKG5ld0NvbnRlbnQpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHNldHRpbmdzLnNvdXJjZSA9PT0gJ3N0cmluZycgJiYgaGVscGVyLmlzVXJsKHNldHRpbmdzLnNvdXJjZSkpIHtcbiAgICAgICQkMy5nZXQoc2V0dGluZ3Muc291cmNlLCBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAkc2lkZU1lbnUuaHRtbChkYXRhKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHNldHRpbmdzLnNvdXJjZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHZhciBodG1sQ29udGVudCA9ICcnLFxuICAgICAgICAgIHNlbGVjdG9ycyA9IHNldHRpbmdzLnNvdXJjZS5zcGxpdCgnLCcpO1xuXG4gICAgICAkJDMuZWFjaChzZWxlY3RvcnMsIGZ1bmN0aW9uIChpbmRleCwgZWxlbWVudCkge1xuICAgICAgICBodG1sQ29udGVudCArPSAnPGRpdiBjbGFzcz1cInNpZHItaW5uZXJcIj4nICsgJCQzKGVsZW1lbnQpLmh0bWwoKSArICc8L2Rpdj4nO1xuICAgICAgfSk7XG5cbiAgICAgIC8vIFJlbmFtaW5nIGlkcyBhbmQgY2xhc3Nlc1xuICAgICAgaWYgKHNldHRpbmdzLnJlbmFtaW5nKSB7XG4gICAgICAgIHZhciAkaHRtbENvbnRlbnQgPSAkJDMoJzxkaXYgLz4nKS5odG1sKGh0bWxDb250ZW50KTtcblxuICAgICAgICAkaHRtbENvbnRlbnQuZmluZCgnKicpLmVhY2goZnVuY3Rpb24gKGluZGV4LCBlbGVtZW50KSB7XG4gICAgICAgICAgdmFyICRlbGVtZW50ID0gJCQzKGVsZW1lbnQpO1xuXG4gICAgICAgICAgaGVscGVyLmFkZFByZWZpeGVzKCRlbGVtZW50KTtcbiAgICAgICAgfSk7XG4gICAgICAgIGh0bWxDb250ZW50ID0gJGh0bWxDb250ZW50Lmh0bWwoKTtcbiAgICAgIH1cblxuICAgICAgJHNpZGVNZW51Lmh0bWwoaHRtbENvbnRlbnQpO1xuICAgIH0gZWxzZSBpZiAoc2V0dGluZ3Muc291cmNlICE9PSBudWxsKSB7XG4gICAgICAkJDMuZXJyb3IoJ0ludmFsaWQgU2lkciBTb3VyY2UnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gJHNpZGVNZW51O1xuICB9XG5cbiAgZnVuY3Rpb24gZm5TaWRyKG9wdGlvbnMpIHtcbiAgICB2YXIgdHJhbnNpdGlvbnMgPSBoZWxwZXIudHJhbnNpdGlvbnMsXG4gICAgICAgIHNldHRpbmdzID0gJCQzLmV4dGVuZCh7XG4gICAgICBuYW1lOiAnc2lkcicsIC8vIE5hbWUgZm9yIHRoZSAnc2lkcidcbiAgICAgIHNwZWVkOiAyMDAsIC8vIEFjY2VwdHMgc3RhbmRhcmQgalF1ZXJ5IGVmZmVjdHMgc3BlZWRzIChpLmUuIGZhc3QsIG5vcm1hbCBvciBtaWxsaXNlY29uZHMpXG4gICAgICBzaWRlOiAnbGVmdCcsIC8vIEFjY2VwdHMgJ2xlZnQnIG9yICdyaWdodCdcbiAgICAgIHNvdXJjZTogbnVsbCwgLy8gT3ZlcnJpZGUgdGhlIHNvdXJjZSBvZiB0aGUgY29udGVudC5cbiAgICAgIHJlbmFtaW5nOiB0cnVlLCAvLyBUaGUgaWRzIGFuZCBjbGFzc2VzIHdpbGwgYmUgcHJlcGVuZGVkIHdpdGggYSBwcmVmaXggd2hlbiBsb2FkaW5nIGV4aXN0ZW50IGNvbnRlbnRcbiAgICAgIGJvZHk6ICdib2R5JywgLy8gUGFnZSBjb250YWluZXIgc2VsZWN0b3IsXG4gICAgICBkaXNwbGFjZTogdHJ1ZSwgLy8gRGlzcGxhY2UgdGhlIGJvZHkgY29udGVudCBvciBub3RcbiAgICAgIHRpbWluZzogJ2Vhc2UnLCAvLyBUaW1pbmcgZnVuY3Rpb24gZm9yIENTUyB0cmFuc2l0aW9uc1xuICAgICAgbWV0aG9kOiAndG9nZ2xlJywgLy8gVGhlIG1ldGhvZCB0byBjYWxsIHdoZW4gZWxlbWVudCBpcyBjbGlja2VkXG4gICAgICBiaW5kOiAndG91Y2hzdGFydCBjbGljaycsIC8vIFRoZSBldmVudChzKSB0byB0cmlnZ2VyIHRoZSBtZW51XG4gICAgICBvbk9wZW46IGZ1bmN0aW9uIG9uT3BlbigpIHt9LFxuICAgICAgLy8gQ2FsbGJhY2sgd2hlbiBzaWRyIHN0YXJ0IG9wZW5pbmdcbiAgICAgIG9uQ2xvc2U6IGZ1bmN0aW9uIG9uQ2xvc2UoKSB7fSxcbiAgICAgIC8vIENhbGxiYWNrIHdoZW4gc2lkciBzdGFydCBjbG9zaW5nXG4gICAgICBvbk9wZW5FbmQ6IGZ1bmN0aW9uIG9uT3BlbkVuZCgpIHt9LFxuICAgICAgLy8gQ2FsbGJhY2sgd2hlbiBzaWRyIGVuZCBvcGVuaW5nXG4gICAgICBvbkNsb3NlRW5kOiBmdW5jdGlvbiBvbkNsb3NlRW5kKCkge30gLy8gQ2FsbGJhY2sgd2hlbiBzaWRyIGVuZCBjbG9zaW5nXG5cbiAgICB9LCBvcHRpb25zKSxcbiAgICAgICAgbmFtZSA9IHNldHRpbmdzLm5hbWUsXG4gICAgICAgICRzaWRlTWVudSA9ICQkMygnIycgKyBuYW1lKTtcblxuICAgIC8vIElmIHRoZSBzaWRlIG1lbnUgZG8gbm90IGV4aXN0IGNyZWF0ZSBpdFxuICAgIGlmICgkc2lkZU1lbnUubGVuZ3RoID09PSAwKSB7XG4gICAgICAkc2lkZU1lbnUgPSAkJDMoJzxkaXYgLz4nKS5hdHRyKCdpZCcsIG5hbWUpLmFwcGVuZFRvKCQkMygnYm9keScpKTtcbiAgICB9XG5cbiAgICAvLyBBZGQgdHJhbnNpdGlvbiB0byBtZW51IGlmIGFyZSBzdXBwb3J0ZWRcbiAgICBpZiAodHJhbnNpdGlvbnMuc3VwcG9ydGVkKSB7XG4gICAgICAkc2lkZU1lbnUuY3NzKHRyYW5zaXRpb25zLnByb3BlcnR5LCBzZXR0aW5ncy5zaWRlICsgJyAnICsgc2V0dGluZ3Muc3BlZWQgLyAxMDAwICsgJ3MgJyArIHNldHRpbmdzLnRpbWluZyk7XG4gICAgfVxuXG4gICAgLy8gQWRkaW5nIHN0eWxlcyBhbmQgb3B0aW9uc1xuICAgICRzaWRlTWVudS5hZGRDbGFzcygnc2lkcicpLmFkZENsYXNzKHNldHRpbmdzLnNpZGUpLmRhdGEoe1xuICAgICAgc3BlZWQ6IHNldHRpbmdzLnNwZWVkLFxuICAgICAgc2lkZTogc2V0dGluZ3Muc2lkZSxcbiAgICAgIGJvZHk6IHNldHRpbmdzLmJvZHksXG4gICAgICBkaXNwbGFjZTogc2V0dGluZ3MuZGlzcGxhY2UsXG4gICAgICB0aW1pbmc6IHNldHRpbmdzLnRpbWluZyxcbiAgICAgIG1ldGhvZDogc2V0dGluZ3MubWV0aG9kLFxuICAgICAgb25PcGVuOiBzZXR0aW5ncy5vbk9wZW4sXG4gICAgICBvbkNsb3NlOiBzZXR0aW5ncy5vbkNsb3NlLFxuICAgICAgb25PcGVuRW5kOiBzZXR0aW5ncy5vbk9wZW5FbmQsXG4gICAgICBvbkNsb3NlRW5kOiBzZXR0aW5ncy5vbkNsb3NlRW5kXG4gICAgfSk7XG5cbiAgICAkc2lkZU1lbnUgPSBmaWxsQ29udGVudCgkc2lkZU1lbnUsIHNldHRpbmdzKTtcblxuICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgdmFyICR0aGlzID0gJCQzKHRoaXMpLFxuICAgICAgICAgIGRhdGEgPSAkdGhpcy5kYXRhKCdzaWRyJyksXG4gICAgICAgICAgZmxhZyA9IGZhbHNlO1xuXG4gICAgICAvLyBJZiB0aGUgcGx1Z2luIGhhc24ndCBiZWVuIGluaXRpYWxpemVkIHlldFxuICAgICAgaWYgKCFkYXRhKSB7XG4gICAgICAgIHNpZHJTdGF0dXMubW92aW5nID0gZmFsc2U7XG4gICAgICAgIHNpZHJTdGF0dXMub3BlbmVkID0gZmFsc2U7XG5cbiAgICAgICAgJHRoaXMuZGF0YSgnc2lkcicsIG5hbWUpO1xuXG4gICAgICAgICR0aGlzLmJpbmQoc2V0dGluZ3MuYmluZCwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICAgIGlmICghZmxhZykge1xuICAgICAgICAgICAgZmxhZyA9IHRydWU7XG4gICAgICAgICAgICBzaWRyKHNldHRpbmdzLm1ldGhvZCwgbmFtZSk7XG5cbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICBmbGFnID0gZmFsc2U7XG4gICAgICAgICAgICB9LCAxMDApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBqUXVlcnkuc2lkciA9IHNpZHI7XG4gIGpRdWVyeS5mbi5zaWRyID0gZm5TaWRyO1xuXG59KCkpOyIsIihmdW5jdGlvbigpIHtcbiAgdmFyIEFqYXhNb25pdG9yLCBCYXIsIERvY3VtZW50TW9uaXRvciwgRWxlbWVudE1vbml0b3IsIEVsZW1lbnRUcmFja2VyLCBFdmVudExhZ01vbml0b3IsIEV2ZW50ZWQsIEV2ZW50cywgTm9UYXJnZXRFcnJvciwgUGFjZSwgUmVxdWVzdEludGVyY2VwdCwgU09VUkNFX0tFWVMsIFNjYWxlciwgU29ja2V0UmVxdWVzdFRyYWNrZXIsIFhIUlJlcXVlc3RUcmFja2VyLCBhbmltYXRpb24sIGF2Z0FtcGxpdHVkZSwgYmFyLCBjYW5jZWxBbmltYXRpb24sIGNhbmNlbEFuaW1hdGlvbkZyYW1lLCBkZWZhdWx0T3B0aW9ucywgZXh0ZW5kLCBleHRlbmROYXRpdmUsIGdldEZyb21ET00sIGdldEludGVyY2VwdCwgaGFuZGxlUHVzaFN0YXRlLCBpZ25vcmVTdGFjaywgaW5pdCwgbm93LCBvcHRpb25zLCByZXF1ZXN0QW5pbWF0aW9uRnJhbWUsIHJlc3VsdCwgcnVuQW5pbWF0aW9uLCBzY2FsZXJzLCBzaG91bGRJZ25vcmVVUkwsIHNob3VsZFRyYWNrLCBzb3VyY2UsIHNvdXJjZXMsIHVuaVNjYWxlciwgX1dlYlNvY2tldCwgX1hEb21haW5SZXF1ZXN0LCBfWE1MSHR0cFJlcXVlc3QsIF9pLCBfaW50ZXJjZXB0LCBfbGVuLCBfcHVzaFN0YXRlLCBfcmVmLCBfcmVmMSwgX3JlcGxhY2VTdGF0ZSxcbiAgICBfX3NsaWNlID0gW10uc2xpY2UsXG4gICAgX19oYXNQcm9wID0ge30uaGFzT3duUHJvcGVydHksXG4gICAgX19leHRlbmRzID0gZnVuY3Rpb24oY2hpbGQsIHBhcmVudCkgeyBmb3IgKHZhciBrZXkgaW4gcGFyZW50KSB7IGlmIChfX2hhc1Byb3AuY2FsbChwYXJlbnQsIGtleSkpIGNoaWxkW2tleV0gPSBwYXJlbnRba2V5XTsgfSBmdW5jdGlvbiBjdG9yKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gY2hpbGQ7IH0gY3Rvci5wcm90b3R5cGUgPSBwYXJlbnQucHJvdG90eXBlOyBjaGlsZC5wcm90b3R5cGUgPSBuZXcgY3RvcigpOyBjaGlsZC5fX3N1cGVyX18gPSBwYXJlbnQucHJvdG90eXBlOyByZXR1cm4gY2hpbGQ7IH0sXG4gICAgX19pbmRleE9mID0gW10uaW5kZXhPZiB8fCBmdW5jdGlvbihpdGVtKSB7IGZvciAodmFyIGkgPSAwLCBsID0gdGhpcy5sZW5ndGg7IGkgPCBsOyBpKyspIHsgaWYgKGkgaW4gdGhpcyAmJiB0aGlzW2ldID09PSBpdGVtKSByZXR1cm4gaTsgfSByZXR1cm4gLTE7IH07XG5cbiAgZGVmYXVsdE9wdGlvbnMgPSB7XG4gICAgY2F0Y2h1cFRpbWU6IDEwMCxcbiAgICBpbml0aWFsUmF0ZTogLjAzLFxuICAgIG1pblRpbWU6IDI1MCxcbiAgICBnaG9zdFRpbWU6IDEwMCxcbiAgICBtYXhQcm9ncmVzc1BlckZyYW1lOiAyMCxcbiAgICBlYXNlRmFjdG9yOiAxLjI1LFxuICAgIHN0YXJ0T25QYWdlTG9hZDogdHJ1ZSxcbiAgICByZXN0YXJ0T25QdXNoU3RhdGU6IHRydWUsXG4gICAgcmVzdGFydE9uUmVxdWVzdEFmdGVyOiA1MDAsXG4gICAgdGFyZ2V0OiAnYm9keScsXG4gICAgZWxlbWVudHM6IHtcbiAgICAgIGNoZWNrSW50ZXJ2YWw6IDEwMCxcbiAgICAgIHNlbGVjdG9yczogWydib2R5J11cbiAgICB9LFxuICAgIGV2ZW50TGFnOiB7XG4gICAgICBtaW5TYW1wbGVzOiAxMCxcbiAgICAgIHNhbXBsZUNvdW50OiAzLFxuICAgICAgbGFnVGhyZXNob2xkOiAzXG4gICAgfSxcbiAgICBhamF4OiB7XG4gICAgICB0cmFja01ldGhvZHM6IFsnR0VUJ10sXG4gICAgICB0cmFja1dlYlNvY2tldHM6IHRydWUsXG4gICAgICBpZ25vcmVVUkxzOiBbXVxuICAgIH1cbiAgfTtcblxuICBub3cgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgX3JlZjtcbiAgICByZXR1cm4gKF9yZWYgPSB0eXBlb2YgcGVyZm9ybWFuY2UgIT09IFwidW5kZWZpbmVkXCIgJiYgcGVyZm9ybWFuY2UgIT09IG51bGwgPyB0eXBlb2YgcGVyZm9ybWFuY2Uubm93ID09PSBcImZ1bmN0aW9uXCIgPyBwZXJmb3JtYW5jZS5ub3coKSA6IHZvaWQgMCA6IHZvaWQgMCkgIT0gbnVsbCA/IF9yZWYgOiArKG5ldyBEYXRlKTtcbiAgfTtcblxuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8IHdpbmRvdy5tb3pSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgd2luZG93LndlYmtpdFJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cubXNSZXF1ZXN0QW5pbWF0aW9uRnJhbWU7XG5cbiAgY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgfHwgd2luZG93Lm1vekNhbmNlbEFuaW1hdGlvbkZyYW1lO1xuXG4gIGlmIChyZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPT0gbnVsbCkge1xuICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSA9IGZ1bmN0aW9uKGZuKSB7XG4gICAgICByZXR1cm4gc2V0VGltZW91dChmbiwgNTApO1xuICAgIH07XG4gICAgY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbihpZCkge1xuICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChpZCk7XG4gICAgfTtcbiAgfVxuXG4gIHJ1bkFuaW1hdGlvbiA9IGZ1bmN0aW9uKGZuKSB7XG4gICAgdmFyIGxhc3QsIHRpY2s7XG4gICAgbGFzdCA9IG5vdygpO1xuICAgIHRpY2sgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBkaWZmO1xuICAgICAgZGlmZiA9IG5vdygpIC0gbGFzdDtcbiAgICAgIGlmIChkaWZmID49IDMzKSB7XG4gICAgICAgIGxhc3QgPSBub3coKTtcbiAgICAgICAgcmV0dXJuIGZuKGRpZmYsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiByZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGljayk7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQodGljaywgMzMgLSBkaWZmKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIHJldHVybiB0aWNrKCk7XG4gIH07XG5cbiAgcmVzdWx0ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGFyZ3MsIGtleSwgb2JqO1xuICAgIG9iaiA9IGFyZ3VtZW50c1swXSwga2V5ID0gYXJndW1lbnRzWzFdLCBhcmdzID0gMyA8PSBhcmd1bWVudHMubGVuZ3RoID8gX19zbGljZS5jYWxsKGFyZ3VtZW50cywgMikgOiBbXTtcbiAgICBpZiAodHlwZW9mIG9ialtrZXldID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gb2JqW2tleV0uYXBwbHkob2JqLCBhcmdzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG9ialtrZXldO1xuICAgIH1cbiAgfTtcblxuICBleHRlbmQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIga2V5LCBvdXQsIHNvdXJjZSwgc291cmNlcywgdmFsLCBfaSwgX2xlbjtcbiAgICBvdXQgPSBhcmd1bWVudHNbMF0sIHNvdXJjZXMgPSAyIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBfX3NsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSA6IFtdO1xuICAgIGZvciAoX2kgPSAwLCBfbGVuID0gc291cmNlcy5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgc291cmNlID0gc291cmNlc1tfaV07XG4gICAgICBpZiAoc291cmNlKSB7XG4gICAgICAgIGZvciAoa2V5IGluIHNvdXJjZSkge1xuICAgICAgICAgIGlmICghX19oYXNQcm9wLmNhbGwoc291cmNlLCBrZXkpKSBjb250aW51ZTtcbiAgICAgICAgICB2YWwgPSBzb3VyY2Vba2V5XTtcbiAgICAgICAgICBpZiAoKG91dFtrZXldICE9IG51bGwpICYmIHR5cGVvZiBvdXRba2V5XSA9PT0gJ29iamVjdCcgJiYgKHZhbCAhPSBudWxsKSAmJiB0eXBlb2YgdmFsID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgZXh0ZW5kKG91dFtrZXldLCB2YWwpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBvdXRba2V5XSA9IHZhbDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG91dDtcbiAgfTtcblxuICBhdmdBbXBsaXR1ZGUgPSBmdW5jdGlvbihhcnIpIHtcbiAgICB2YXIgY291bnQsIHN1bSwgdiwgX2ksIF9sZW47XG4gICAgc3VtID0gY291bnQgPSAwO1xuICAgIGZvciAoX2kgPSAwLCBfbGVuID0gYXJyLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICB2ID0gYXJyW19pXTtcbiAgICAgIHN1bSArPSBNYXRoLmFicyh2KTtcbiAgICAgIGNvdW50Kys7XG4gICAgfVxuICAgIHJldHVybiBzdW0gLyBjb3VudDtcbiAgfTtcblxuICBnZXRGcm9tRE9NID0gZnVuY3Rpb24oa2V5LCBqc29uKSB7XG4gICAgdmFyIGRhdGEsIGUsIGVsO1xuICAgIGlmIChrZXkgPT0gbnVsbCkge1xuICAgICAga2V5ID0gJ29wdGlvbnMnO1xuICAgIH1cbiAgICBpZiAoanNvbiA9PSBudWxsKSB7XG4gICAgICBqc29uID0gdHJ1ZTtcbiAgICB9XG4gICAgZWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiW2RhdGEtcGFjZS1cIiArIGtleSArIFwiXVwiKTtcbiAgICBpZiAoIWVsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGRhdGEgPSBlbC5nZXRBdHRyaWJ1dGUoXCJkYXRhLXBhY2UtXCIgKyBrZXkpO1xuICAgIGlmICghanNvbikge1xuICAgICAgcmV0dXJuIGRhdGE7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICByZXR1cm4gSlNPTi5wYXJzZShkYXRhKTtcbiAgICB9IGNhdGNoIChfZXJyb3IpIHtcbiAgICAgIGUgPSBfZXJyb3I7XG4gICAgICByZXR1cm4gdHlwZW9mIGNvbnNvbGUgIT09IFwidW5kZWZpbmVkXCIgJiYgY29uc29sZSAhPT0gbnVsbCA/IGNvbnNvbGUuZXJyb3IoXCJFcnJvciBwYXJzaW5nIGlubGluZSBwYWNlIG9wdGlvbnNcIiwgZSkgOiB2b2lkIDA7XG4gICAgfVxuICB9O1xuXG4gIEV2ZW50ZWQgPSAoZnVuY3Rpb24oKSB7XG4gICAgZnVuY3Rpb24gRXZlbnRlZCgpIHt9XG5cbiAgICBFdmVudGVkLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uKGV2ZW50LCBoYW5kbGVyLCBjdHgsIG9uY2UpIHtcbiAgICAgIHZhciBfYmFzZTtcbiAgICAgIGlmIChvbmNlID09IG51bGwpIHtcbiAgICAgICAgb25jZSA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuYmluZGluZ3MgPT0gbnVsbCkge1xuICAgICAgICB0aGlzLmJpbmRpbmdzID0ge307XG4gICAgICB9XG4gICAgICBpZiAoKF9iYXNlID0gdGhpcy5iaW5kaW5ncylbZXZlbnRdID09IG51bGwpIHtcbiAgICAgICAgX2Jhc2VbZXZlbnRdID0gW107XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5iaW5kaW5nc1tldmVudF0ucHVzaCh7XG4gICAgICAgIGhhbmRsZXI6IGhhbmRsZXIsXG4gICAgICAgIGN0eDogY3R4LFxuICAgICAgICBvbmNlOiBvbmNlXG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgRXZlbnRlZC5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uKGV2ZW50LCBoYW5kbGVyLCBjdHgpIHtcbiAgICAgIHJldHVybiB0aGlzLm9uKGV2ZW50LCBoYW5kbGVyLCBjdHgsIHRydWUpO1xuICAgIH07XG5cbiAgICBFdmVudGVkLnByb3RvdHlwZS5vZmYgPSBmdW5jdGlvbihldmVudCwgaGFuZGxlcikge1xuICAgICAgdmFyIGksIF9yZWYsIF9yZXN1bHRzO1xuICAgICAgaWYgKCgoX3JlZiA9IHRoaXMuYmluZGluZ3MpICE9IG51bGwgPyBfcmVmW2V2ZW50XSA6IHZvaWQgMCkgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAoaGFuZGxlciA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBkZWxldGUgdGhpcy5iaW5kaW5nc1tldmVudF07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpID0gMDtcbiAgICAgICAgX3Jlc3VsdHMgPSBbXTtcbiAgICAgICAgd2hpbGUgKGkgPCB0aGlzLmJpbmRpbmdzW2V2ZW50XS5sZW5ndGgpIHtcbiAgICAgICAgICBpZiAodGhpcy5iaW5kaW5nc1tldmVudF1baV0uaGFuZGxlciA9PT0gaGFuZGxlcikge1xuICAgICAgICAgICAgX3Jlc3VsdHMucHVzaCh0aGlzLmJpbmRpbmdzW2V2ZW50XS5zcGxpY2UoaSwgMSkpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBfcmVzdWx0cy5wdXNoKGkrKyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBfcmVzdWx0cztcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgRXZlbnRlZC5wcm90b3R5cGUudHJpZ2dlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGFyZ3MsIGN0eCwgZXZlbnQsIGhhbmRsZXIsIGksIG9uY2UsIF9yZWYsIF9yZWYxLCBfcmVzdWx0cztcbiAgICAgIGV2ZW50ID0gYXJndW1lbnRzWzBdLCBhcmdzID0gMiA8PSBhcmd1bWVudHMubGVuZ3RoID8gX19zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkgOiBbXTtcbiAgICAgIGlmICgoX3JlZiA9IHRoaXMuYmluZGluZ3MpICE9IG51bGwgPyBfcmVmW2V2ZW50XSA6IHZvaWQgMCkge1xuICAgICAgICBpID0gMDtcbiAgICAgICAgX3Jlc3VsdHMgPSBbXTtcbiAgICAgICAgd2hpbGUgKGkgPCB0aGlzLmJpbmRpbmdzW2V2ZW50XS5sZW5ndGgpIHtcbiAgICAgICAgICBfcmVmMSA9IHRoaXMuYmluZGluZ3NbZXZlbnRdW2ldLCBoYW5kbGVyID0gX3JlZjEuaGFuZGxlciwgY3R4ID0gX3JlZjEuY3R4LCBvbmNlID0gX3JlZjEub25jZTtcbiAgICAgICAgICBoYW5kbGVyLmFwcGx5KGN0eCAhPSBudWxsID8gY3R4IDogdGhpcywgYXJncyk7XG4gICAgICAgICAgaWYgKG9uY2UpIHtcbiAgICAgICAgICAgIF9yZXN1bHRzLnB1c2godGhpcy5iaW5kaW5nc1tldmVudF0uc3BsaWNlKGksIDEpKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgX3Jlc3VsdHMucHVzaChpKyspO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gX3Jlc3VsdHM7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHJldHVybiBFdmVudGVkO1xuXG4gIH0pKCk7XG5cbiAgUGFjZSA9IHdpbmRvdy5QYWNlIHx8IHt9O1xuXG4gIHdpbmRvdy5QYWNlID0gUGFjZTtcblxuICBleHRlbmQoUGFjZSwgRXZlbnRlZC5wcm90b3R5cGUpO1xuXG4gIG9wdGlvbnMgPSBQYWNlLm9wdGlvbnMgPSBleHRlbmQoe30sIGRlZmF1bHRPcHRpb25zLCB3aW5kb3cucGFjZU9wdGlvbnMsIGdldEZyb21ET00oKSk7XG5cbiAgX3JlZiA9IFsnYWpheCcsICdkb2N1bWVudCcsICdldmVudExhZycsICdlbGVtZW50cyddO1xuICBmb3IgKF9pID0gMCwgX2xlbiA9IF9yZWYubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICBzb3VyY2UgPSBfcmVmW19pXTtcbiAgICBpZiAob3B0aW9uc1tzb3VyY2VdID09PSB0cnVlKSB7XG4gICAgICBvcHRpb25zW3NvdXJjZV0gPSBkZWZhdWx0T3B0aW9uc1tzb3VyY2VdO1xuICAgIH1cbiAgfVxuXG4gIE5vVGFyZ2V0RXJyb3IgPSAoZnVuY3Rpb24oX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKE5vVGFyZ2V0RXJyb3IsIF9zdXBlcik7XG5cbiAgICBmdW5jdGlvbiBOb1RhcmdldEVycm9yKCkge1xuICAgICAgX3JlZjEgPSBOb1RhcmdldEVycm9yLl9fc3VwZXJfXy5jb25zdHJ1Y3Rvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgcmV0dXJuIF9yZWYxO1xuICAgIH1cblxuICAgIHJldHVybiBOb1RhcmdldEVycm9yO1xuXG4gIH0pKEVycm9yKTtcblxuICBCYXIgPSAoZnVuY3Rpb24oKSB7XG4gICAgZnVuY3Rpb24gQmFyKCkge1xuICAgICAgdGhpcy5wcm9ncmVzcyA9IDA7XG4gICAgfVxuXG4gICAgQmFyLnByb3RvdHlwZS5nZXRFbGVtZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgdGFyZ2V0RWxlbWVudDtcbiAgICAgIGlmICh0aGlzLmVsID09IG51bGwpIHtcbiAgICAgICAgdGFyZ2V0RWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Iob3B0aW9ucy50YXJnZXQpO1xuICAgICAgICBpZiAoIXRhcmdldEVsZW1lbnQpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgTm9UYXJnZXRFcnJvcjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIHRoaXMuZWwuY2xhc3NOYW1lID0gXCJwYWNlIHBhY2UtYWN0aXZlXCI7XG4gICAgICAgIGRvY3VtZW50LmJvZHkuY2xhc3NOYW1lID0gZG9jdW1lbnQuYm9keS5jbGFzc05hbWUucmVwbGFjZSgvcGFjZS1kb25lL2csICcnKTtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5jbGFzc05hbWUgKz0gJyBwYWNlLXJ1bm5pbmcnO1xuICAgICAgICB0aGlzLmVsLmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPVwicGFjZS1wcm9ncmVzc1wiPlxcbiAgPGRpdiBjbGFzcz1cInBhY2UtcHJvZ3Jlc3MtaW5uZXJcIj48L2Rpdj5cXG48L2Rpdj5cXG48ZGl2IGNsYXNzPVwicGFjZS1hY3Rpdml0eVwiPjwvZGl2Pic7XG4gICAgICAgIGlmICh0YXJnZXRFbGVtZW50LmZpcnN0Q2hpbGQgIT0gbnVsbCkge1xuICAgICAgICAgIHRhcmdldEVsZW1lbnQuaW5zZXJ0QmVmb3JlKHRoaXMuZWwsIHRhcmdldEVsZW1lbnQuZmlyc3RDaGlsZCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGFyZ2V0RWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLmVsKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuZWw7XG4gICAgfTtcblxuICAgIEJhci5wcm90b3R5cGUuZmluaXNoID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgZWw7XG4gICAgICBlbCA9IHRoaXMuZ2V0RWxlbWVudCgpO1xuICAgICAgZWwuY2xhc3NOYW1lID0gZWwuY2xhc3NOYW1lLnJlcGxhY2UoJ3BhY2UtYWN0aXZlJywgJycpO1xuICAgICAgZWwuY2xhc3NOYW1lICs9ICcgcGFjZS1pbmFjdGl2ZSc7XG4gICAgICBkb2N1bWVudC5ib2R5LmNsYXNzTmFtZSA9IGRvY3VtZW50LmJvZHkuY2xhc3NOYW1lLnJlcGxhY2UoJ3BhY2UtcnVubmluZycsICcnKTtcbiAgICAgIHJldHVybiBkb2N1bWVudC5ib2R5LmNsYXNzTmFtZSArPSAnIHBhY2UtZG9uZSc7XG4gICAgfTtcblxuICAgIEJhci5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24ocHJvZykge1xuICAgICAgdGhpcy5wcm9ncmVzcyA9IHByb2c7XG4gICAgICByZXR1cm4gdGhpcy5yZW5kZXIoKTtcbiAgICB9O1xuXG4gICAgQmFyLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24oKSB7XG4gICAgICB0cnkge1xuICAgICAgICB0aGlzLmdldEVsZW1lbnQoKS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMuZ2V0RWxlbWVudCgpKTtcbiAgICAgIH0gY2F0Y2ggKF9lcnJvcikge1xuICAgICAgICBOb1RhcmdldEVycm9yID0gX2Vycm9yO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuZWwgPSB2b2lkIDA7XG4gICAgfTtcblxuICAgIEJhci5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgZWwsIGtleSwgcHJvZ3Jlc3NTdHIsIHRyYW5zZm9ybSwgX2osIF9sZW4xLCBfcmVmMjtcbiAgICAgIGlmIChkb2N1bWVudC5xdWVyeVNlbGVjdG9yKG9wdGlvbnMudGFyZ2V0KSA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGVsID0gdGhpcy5nZXRFbGVtZW50KCk7XG4gICAgICB0cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZTNkKFwiICsgdGhpcy5wcm9ncmVzcyArIFwiJSwgMCwgMClcIjtcbiAgICAgIF9yZWYyID0gWyd3ZWJraXRUcmFuc2Zvcm0nLCAnbXNUcmFuc2Zvcm0nLCAndHJhbnNmb3JtJ107XG4gICAgICBmb3IgKF9qID0gMCwgX2xlbjEgPSBfcmVmMi5sZW5ndGg7IF9qIDwgX2xlbjE7IF9qKyspIHtcbiAgICAgICAga2V5ID0gX3JlZjJbX2pdO1xuICAgICAgICBlbC5jaGlsZHJlblswXS5zdHlsZVtrZXldID0gdHJhbnNmb3JtO1xuICAgICAgfVxuICAgICAgaWYgKCF0aGlzLmxhc3RSZW5kZXJlZFByb2dyZXNzIHx8IHRoaXMubGFzdFJlbmRlcmVkUHJvZ3Jlc3MgfCAwICE9PSB0aGlzLnByb2dyZXNzIHwgMCkge1xuICAgICAgICBlbC5jaGlsZHJlblswXS5zZXRBdHRyaWJ1dGUoJ2RhdGEtcHJvZ3Jlc3MtdGV4dCcsIFwiXCIgKyAodGhpcy5wcm9ncmVzcyB8IDApICsgXCIlXCIpO1xuICAgICAgICBpZiAodGhpcy5wcm9ncmVzcyA+PSAxMDApIHtcbiAgICAgICAgICBwcm9ncmVzc1N0ciA9ICc5OSc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcHJvZ3Jlc3NTdHIgPSB0aGlzLnByb2dyZXNzIDwgMTAgPyBcIjBcIiA6IFwiXCI7XG4gICAgICAgICAgcHJvZ3Jlc3NTdHIgKz0gdGhpcy5wcm9ncmVzcyB8IDA7XG4gICAgICAgIH1cbiAgICAgICAgZWwuY2hpbGRyZW5bMF0uc2V0QXR0cmlidXRlKCdkYXRhLXByb2dyZXNzJywgXCJcIiArIHByb2dyZXNzU3RyKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLmxhc3RSZW5kZXJlZFByb2dyZXNzID0gdGhpcy5wcm9ncmVzcztcbiAgICB9O1xuXG4gICAgQmFyLnByb3RvdHlwZS5kb25lID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5wcm9ncmVzcyA+PSAxMDA7XG4gICAgfTtcblxuICAgIHJldHVybiBCYXI7XG5cbiAgfSkoKTtcblxuICBFdmVudHMgPSAoZnVuY3Rpb24oKSB7XG4gICAgZnVuY3Rpb24gRXZlbnRzKCkge1xuICAgICAgdGhpcy5iaW5kaW5ncyA9IHt9O1xuICAgIH1cblxuICAgIEV2ZW50cy5wcm90b3R5cGUudHJpZ2dlciA9IGZ1bmN0aW9uKG5hbWUsIHZhbCkge1xuICAgICAgdmFyIGJpbmRpbmcsIF9qLCBfbGVuMSwgX3JlZjIsIF9yZXN1bHRzO1xuICAgICAgaWYgKHRoaXMuYmluZGluZ3NbbmFtZV0gIT0gbnVsbCkge1xuICAgICAgICBfcmVmMiA9IHRoaXMuYmluZGluZ3NbbmFtZV07XG4gICAgICAgIF9yZXN1bHRzID0gW107XG4gICAgICAgIGZvciAoX2ogPSAwLCBfbGVuMSA9IF9yZWYyLmxlbmd0aDsgX2ogPCBfbGVuMTsgX2orKykge1xuICAgICAgICAgIGJpbmRpbmcgPSBfcmVmMltfal07XG4gICAgICAgICAgX3Jlc3VsdHMucHVzaChiaW5kaW5nLmNhbGwodGhpcywgdmFsKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIF9yZXN1bHRzO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBFdmVudHMucHJvdG90eXBlLm9uID0gZnVuY3Rpb24obmFtZSwgZm4pIHtcbiAgICAgIHZhciBfYmFzZTtcbiAgICAgIGlmICgoX2Jhc2UgPSB0aGlzLmJpbmRpbmdzKVtuYW1lXSA9PSBudWxsKSB7XG4gICAgICAgIF9iYXNlW25hbWVdID0gW107XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5iaW5kaW5nc1tuYW1lXS5wdXNoKGZuKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIEV2ZW50cztcblxuICB9KSgpO1xuXG4gIF9YTUxIdHRwUmVxdWVzdCA9IHdpbmRvdy5YTUxIdHRwUmVxdWVzdDtcblxuICBfWERvbWFpblJlcXVlc3QgPSB3aW5kb3cuWERvbWFpblJlcXVlc3Q7XG5cbiAgX1dlYlNvY2tldCA9IHdpbmRvdy5XZWJTb2NrZXQ7XG5cbiAgZXh0ZW5kTmF0aXZlID0gZnVuY3Rpb24odG8sIGZyb20pIHtcbiAgICB2YXIgZSwga2V5LCBfcmVzdWx0cztcbiAgICBfcmVzdWx0cyA9IFtdO1xuICAgIGZvciAoa2V5IGluIGZyb20ucHJvdG90eXBlKSB7XG4gICAgICB0cnkge1xuICAgICAgICBpZiAoKHRvW2tleV0gPT0gbnVsbCkgJiYgdHlwZW9mIGZyb21ba2V5XSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIGlmICh0eXBlb2YgT2JqZWN0LmRlZmluZVByb3BlcnR5ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBfcmVzdWx0cy5wdXNoKE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0bywga2V5LCB7XG4gICAgICAgICAgICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZyb20ucHJvdG90eXBlW2tleV07XG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZVxuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBfcmVzdWx0cy5wdXNoKHRvW2tleV0gPSBmcm9tLnByb3RvdHlwZVtrZXldKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgX3Jlc3VsdHMucHVzaCh2b2lkIDApO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChfZXJyb3IpIHtcbiAgICAgICAgZSA9IF9lcnJvcjtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIF9yZXN1bHRzO1xuICB9O1xuXG4gIGlnbm9yZVN0YWNrID0gW107XG5cbiAgUGFjZS5pZ25vcmUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgYXJncywgZm4sIHJldDtcbiAgICBmbiA9IGFyZ3VtZW50c1swXSwgYXJncyA9IDIgPD0gYXJndW1lbnRzLmxlbmd0aCA/IF9fc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpIDogW107XG4gICAgaWdub3JlU3RhY2sudW5zaGlmdCgnaWdub3JlJyk7XG4gICAgcmV0ID0gZm4uYXBwbHkobnVsbCwgYXJncyk7XG4gICAgaWdub3JlU3RhY2suc2hpZnQoKTtcbiAgICByZXR1cm4gcmV0O1xuICB9O1xuXG4gIFBhY2UudHJhY2sgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgYXJncywgZm4sIHJldDtcbiAgICBmbiA9IGFyZ3VtZW50c1swXSwgYXJncyA9IDIgPD0gYXJndW1lbnRzLmxlbmd0aCA/IF9fc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpIDogW107XG4gICAgaWdub3JlU3RhY2sudW5zaGlmdCgndHJhY2snKTtcbiAgICByZXQgPSBmbi5hcHBseShudWxsLCBhcmdzKTtcbiAgICBpZ25vcmVTdGFjay5zaGlmdCgpO1xuICAgIHJldHVybiByZXQ7XG4gIH07XG5cbiAgc2hvdWxkVHJhY2sgPSBmdW5jdGlvbihtZXRob2QpIHtcbiAgICB2YXIgX3JlZjI7XG4gICAgaWYgKG1ldGhvZCA9PSBudWxsKSB7XG4gICAgICBtZXRob2QgPSAnR0VUJztcbiAgICB9XG4gICAgaWYgKGlnbm9yZVN0YWNrWzBdID09PSAndHJhY2snKSB7XG4gICAgICByZXR1cm4gJ2ZvcmNlJztcbiAgICB9XG4gICAgaWYgKCFpZ25vcmVTdGFjay5sZW5ndGggJiYgb3B0aW9ucy5hamF4KSB7XG4gICAgICBpZiAobWV0aG9kID09PSAnc29ja2V0JyAmJiBvcHRpb25zLmFqYXgudHJhY2tXZWJTb2NrZXRzKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSBlbHNlIGlmIChfcmVmMiA9IG1ldGhvZC50b1VwcGVyQ2FzZSgpLCBfX2luZGV4T2YuY2FsbChvcHRpb25zLmFqYXgudHJhY2tNZXRob2RzLCBfcmVmMikgPj0gMCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9O1xuXG4gIFJlcXVlc3RJbnRlcmNlcHQgPSAoZnVuY3Rpb24oX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKFJlcXVlc3RJbnRlcmNlcHQsIF9zdXBlcik7XG5cbiAgICBmdW5jdGlvbiBSZXF1ZXN0SW50ZXJjZXB0KCkge1xuICAgICAgdmFyIG1vbml0b3JYSFIsXG4gICAgICAgIF90aGlzID0gdGhpcztcbiAgICAgIFJlcXVlc3RJbnRlcmNlcHQuX19zdXBlcl9fLmNvbnN0cnVjdG9yLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICBtb25pdG9yWEhSID0gZnVuY3Rpb24ocmVxKSB7XG4gICAgICAgIHZhciBfb3BlbjtcbiAgICAgICAgX29wZW4gPSByZXEub3BlbjtcbiAgICAgICAgcmV0dXJuIHJlcS5vcGVuID0gZnVuY3Rpb24odHlwZSwgdXJsLCBhc3luYykge1xuICAgICAgICAgIGlmIChzaG91bGRUcmFjayh0eXBlKSkge1xuICAgICAgICAgICAgX3RoaXMudHJpZ2dlcigncmVxdWVzdCcsIHtcbiAgICAgICAgICAgICAgdHlwZTogdHlwZSxcbiAgICAgICAgICAgICAgdXJsOiB1cmwsXG4gICAgICAgICAgICAgIHJlcXVlc3Q6IHJlcVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBfb3Blbi5hcHBseShyZXEsIGFyZ3VtZW50cyk7XG4gICAgICAgIH07XG4gICAgICB9O1xuICAgICAgd2luZG93LlhNTEh0dHBSZXF1ZXN0ID0gZnVuY3Rpb24oZmxhZ3MpIHtcbiAgICAgICAgdmFyIHJlcTtcbiAgICAgICAgcmVxID0gbmV3IF9YTUxIdHRwUmVxdWVzdChmbGFncyk7XG4gICAgICAgIG1vbml0b3JYSFIocmVxKTtcbiAgICAgICAgcmV0dXJuIHJlcTtcbiAgICAgIH07XG4gICAgICB0cnkge1xuICAgICAgICBleHRlbmROYXRpdmUod2luZG93LlhNTEh0dHBSZXF1ZXN0LCBfWE1MSHR0cFJlcXVlc3QpO1xuICAgICAgfSBjYXRjaCAoX2Vycm9yKSB7fVxuICAgICAgaWYgKF9YRG9tYWluUmVxdWVzdCAhPSBudWxsKSB7XG4gICAgICAgIHdpbmRvdy5YRG9tYWluUmVxdWVzdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciByZXE7XG4gICAgICAgICAgcmVxID0gbmV3IF9YRG9tYWluUmVxdWVzdDtcbiAgICAgICAgICBtb25pdG9yWEhSKHJlcSk7XG4gICAgICAgICAgcmV0dXJuIHJlcTtcbiAgICAgICAgfTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBleHRlbmROYXRpdmUod2luZG93LlhEb21haW5SZXF1ZXN0LCBfWERvbWFpblJlcXVlc3QpO1xuICAgICAgICB9IGNhdGNoIChfZXJyb3IpIHt9XG4gICAgICB9XG4gICAgICBpZiAoKF9XZWJTb2NrZXQgIT0gbnVsbCkgJiYgb3B0aW9ucy5hamF4LnRyYWNrV2ViU29ja2V0cykge1xuICAgICAgICB3aW5kb3cuV2ViU29ja2V0ID0gZnVuY3Rpb24odXJsLCBwcm90b2NvbHMpIHtcbiAgICAgICAgICB2YXIgcmVxO1xuICAgICAgICAgIGlmIChwcm90b2NvbHMgIT0gbnVsbCkge1xuICAgICAgICAgICAgcmVxID0gbmV3IF9XZWJTb2NrZXQodXJsLCBwcm90b2NvbHMpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXEgPSBuZXcgX1dlYlNvY2tldCh1cmwpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoc2hvdWxkVHJhY2soJ3NvY2tldCcpKSB7XG4gICAgICAgICAgICBfdGhpcy50cmlnZ2VyKCdyZXF1ZXN0Jywge1xuICAgICAgICAgICAgICB0eXBlOiAnc29ja2V0JyxcbiAgICAgICAgICAgICAgdXJsOiB1cmwsXG4gICAgICAgICAgICAgIHByb3RvY29sczogcHJvdG9jb2xzLFxuICAgICAgICAgICAgICByZXF1ZXN0OiByZXFcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcmVxO1xuICAgICAgICB9O1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGV4dGVuZE5hdGl2ZSh3aW5kb3cuV2ViU29ja2V0LCBfV2ViU29ja2V0KTtcbiAgICAgICAgfSBjYXRjaCAoX2Vycm9yKSB7fVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBSZXF1ZXN0SW50ZXJjZXB0O1xuXG4gIH0pKEV2ZW50cyk7XG5cbiAgX2ludGVyY2VwdCA9IG51bGw7XG5cbiAgZ2V0SW50ZXJjZXB0ID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKF9pbnRlcmNlcHQgPT0gbnVsbCkge1xuICAgICAgX2ludGVyY2VwdCA9IG5ldyBSZXF1ZXN0SW50ZXJjZXB0O1xuICAgIH1cbiAgICByZXR1cm4gX2ludGVyY2VwdDtcbiAgfTtcblxuICBzaG91bGRJZ25vcmVVUkwgPSBmdW5jdGlvbih1cmwpIHtcbiAgICB2YXIgcGF0dGVybiwgX2osIF9sZW4xLCBfcmVmMjtcbiAgICBfcmVmMiA9IG9wdGlvbnMuYWpheC5pZ25vcmVVUkxzO1xuICAgIGZvciAoX2ogPSAwLCBfbGVuMSA9IF9yZWYyLmxlbmd0aDsgX2ogPCBfbGVuMTsgX2orKykge1xuICAgICAgcGF0dGVybiA9IF9yZWYyW19qXTtcbiAgICAgIGlmICh0eXBlb2YgcGF0dGVybiA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgaWYgKHVybC5pbmRleE9mKHBhdHRlcm4pICE9PSAtMSkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAocGF0dGVybi50ZXN0KHVybCkpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH07XG5cbiAgZ2V0SW50ZXJjZXB0KCkub24oJ3JlcXVlc3QnLCBmdW5jdGlvbihfYXJnKSB7XG4gICAgdmFyIGFmdGVyLCBhcmdzLCByZXF1ZXN0LCB0eXBlLCB1cmw7XG4gICAgdHlwZSA9IF9hcmcudHlwZSwgcmVxdWVzdCA9IF9hcmcucmVxdWVzdCwgdXJsID0gX2FyZy51cmw7XG4gICAgaWYgKHNob3VsZElnbm9yZVVSTCh1cmwpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICghUGFjZS5ydW5uaW5nICYmIChvcHRpb25zLnJlc3RhcnRPblJlcXVlc3RBZnRlciAhPT0gZmFsc2UgfHwgc2hvdWxkVHJhY2sodHlwZSkgPT09ICdmb3JjZScpKSB7XG4gICAgICBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgYWZ0ZXIgPSBvcHRpb25zLnJlc3RhcnRPblJlcXVlc3RBZnRlciB8fCAwO1xuICAgICAgaWYgKHR5cGVvZiBhZnRlciA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgIGFmdGVyID0gMDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc3RpbGxBY3RpdmUsIF9qLCBfbGVuMSwgX3JlZjIsIF9yZWYzLCBfcmVzdWx0cztcbiAgICAgICAgaWYgKHR5cGUgPT09ICdzb2NrZXQnKSB7XG4gICAgICAgICAgc3RpbGxBY3RpdmUgPSByZXF1ZXN0LnJlYWR5U3RhdGUgPCAyO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0aWxsQWN0aXZlID0gKDAgPCAoX3JlZjIgPSByZXF1ZXN0LnJlYWR5U3RhdGUpICYmIF9yZWYyIDwgNCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHN0aWxsQWN0aXZlKSB7XG4gICAgICAgICAgUGFjZS5yZXN0YXJ0KCk7XG4gICAgICAgICAgX3JlZjMgPSBQYWNlLnNvdXJjZXM7XG4gICAgICAgICAgX3Jlc3VsdHMgPSBbXTtcbiAgICAgICAgICBmb3IgKF9qID0gMCwgX2xlbjEgPSBfcmVmMy5sZW5ndGg7IF9qIDwgX2xlbjE7IF9qKyspIHtcbiAgICAgICAgICAgIHNvdXJjZSA9IF9yZWYzW19qXTtcbiAgICAgICAgICAgIGlmIChzb3VyY2UgaW5zdGFuY2VvZiBBamF4TW9uaXRvcikge1xuICAgICAgICAgICAgICBzb3VyY2Uud2F0Y2guYXBwbHkoc291cmNlLCBhcmdzKTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBfcmVzdWx0cy5wdXNoKHZvaWQgMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBfcmVzdWx0cztcbiAgICAgICAgfVxuICAgICAgfSwgYWZ0ZXIpO1xuICAgIH1cbiAgfSk7XG5cbiAgQWpheE1vbml0b3IgPSAoZnVuY3Rpb24oKSB7XG4gICAgZnVuY3Rpb24gQWpheE1vbml0b3IoKSB7XG4gICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgdGhpcy5lbGVtZW50cyA9IFtdO1xuICAgICAgZ2V0SW50ZXJjZXB0KCkub24oJ3JlcXVlc3QnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIF90aGlzLndhdGNoLmFwcGx5KF90aGlzLCBhcmd1bWVudHMpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgQWpheE1vbml0b3IucHJvdG90eXBlLndhdGNoID0gZnVuY3Rpb24oX2FyZykge1xuICAgICAgdmFyIHJlcXVlc3QsIHRyYWNrZXIsIHR5cGUsIHVybDtcbiAgICAgIHR5cGUgPSBfYXJnLnR5cGUsIHJlcXVlc3QgPSBfYXJnLnJlcXVlc3QsIHVybCA9IF9hcmcudXJsO1xuICAgICAgaWYgKHNob3VsZElnbm9yZVVSTCh1cmwpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmICh0eXBlID09PSAnc29ja2V0Jykge1xuICAgICAgICB0cmFja2VyID0gbmV3IFNvY2tldFJlcXVlc3RUcmFja2VyKHJlcXVlc3QpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdHJhY2tlciA9IG5ldyBYSFJSZXF1ZXN0VHJhY2tlcihyZXF1ZXN0KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLmVsZW1lbnRzLnB1c2godHJhY2tlcik7XG4gICAgfTtcblxuICAgIHJldHVybiBBamF4TW9uaXRvcjtcblxuICB9KSgpO1xuXG4gIFhIUlJlcXVlc3RUcmFja2VyID0gKGZ1bmN0aW9uKCkge1xuICAgIGZ1bmN0aW9uIFhIUlJlcXVlc3RUcmFja2VyKHJlcXVlc3QpIHtcbiAgICAgIHZhciBldmVudCwgc2l6ZSwgX2osIF9sZW4xLCBfb25yZWFkeXN0YXRlY2hhbmdlLCBfcmVmMixcbiAgICAgICAgX3RoaXMgPSB0aGlzO1xuICAgICAgdGhpcy5wcm9ncmVzcyA9IDA7XG4gICAgICBpZiAod2luZG93LlByb2dyZXNzRXZlbnQgIT0gbnVsbCkge1xuICAgICAgICBzaXplID0gbnVsbDtcbiAgICAgICAgcmVxdWVzdC5hZGRFdmVudExpc3RlbmVyKCdwcm9ncmVzcycsIGZ1bmN0aW9uKGV2dCkge1xuICAgICAgICAgIGlmIChldnQubGVuZ3RoQ29tcHV0YWJsZSkge1xuICAgICAgICAgICAgcmV0dXJuIF90aGlzLnByb2dyZXNzID0gMTAwICogZXZ0LmxvYWRlZCAvIGV2dC50b3RhbDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIF90aGlzLnByb2dyZXNzID0gX3RoaXMucHJvZ3Jlc3MgKyAoMTAwIC0gX3RoaXMucHJvZ3Jlc3MpIC8gMjtcbiAgICAgICAgICB9XG4gICAgICAgIH0sIGZhbHNlKTtcbiAgICAgICAgX3JlZjIgPSBbJ2xvYWQnLCAnYWJvcnQnLCAndGltZW91dCcsICdlcnJvciddO1xuICAgICAgICBmb3IgKF9qID0gMCwgX2xlbjEgPSBfcmVmMi5sZW5ndGg7IF9qIDwgX2xlbjE7IF9qKyspIHtcbiAgICAgICAgICBldmVudCA9IF9yZWYyW19qXTtcbiAgICAgICAgICByZXF1ZXN0LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIF90aGlzLnByb2dyZXNzID0gMTAwO1xuICAgICAgICAgIH0sIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgX29ucmVhZHlzdGF0ZWNoYW5nZSA9IHJlcXVlc3Qub25yZWFkeXN0YXRlY2hhbmdlO1xuICAgICAgICByZXF1ZXN0Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciBfcmVmMztcbiAgICAgICAgICBpZiAoKF9yZWYzID0gcmVxdWVzdC5yZWFkeVN0YXRlKSA9PT0gMCB8fCBfcmVmMyA9PT0gNCkge1xuICAgICAgICAgICAgX3RoaXMucHJvZ3Jlc3MgPSAxMDA7XG4gICAgICAgICAgfSBlbHNlIGlmIChyZXF1ZXN0LnJlYWR5U3RhdGUgPT09IDMpIHtcbiAgICAgICAgICAgIF90aGlzLnByb2dyZXNzID0gNTA7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB0eXBlb2YgX29ucmVhZHlzdGF0ZWNoYW5nZSA9PT0gXCJmdW5jdGlvblwiID8gX29ucmVhZHlzdGF0ZWNoYW5nZS5hcHBseShudWxsLCBhcmd1bWVudHMpIDogdm9pZCAwO1xuICAgICAgICB9O1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBYSFJSZXF1ZXN0VHJhY2tlcjtcblxuICB9KSgpO1xuXG4gIFNvY2tldFJlcXVlc3RUcmFja2VyID0gKGZ1bmN0aW9uKCkge1xuICAgIGZ1bmN0aW9uIFNvY2tldFJlcXVlc3RUcmFja2VyKHJlcXVlc3QpIHtcbiAgICAgIHZhciBldmVudCwgX2osIF9sZW4xLCBfcmVmMixcbiAgICAgICAgX3RoaXMgPSB0aGlzO1xuICAgICAgdGhpcy5wcm9ncmVzcyA9IDA7XG4gICAgICBfcmVmMiA9IFsnZXJyb3InLCAnb3BlbiddO1xuICAgICAgZm9yIChfaiA9IDAsIF9sZW4xID0gX3JlZjIubGVuZ3RoOyBfaiA8IF9sZW4xOyBfaisrKSB7XG4gICAgICAgIGV2ZW50ID0gX3JlZjJbX2pdO1xuICAgICAgICByZXF1ZXN0LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiBfdGhpcy5wcm9ncmVzcyA9IDEwMDtcbiAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBTb2NrZXRSZXF1ZXN0VHJhY2tlcjtcblxuICB9KSgpO1xuXG4gIEVsZW1lbnRNb25pdG9yID0gKGZ1bmN0aW9uKCkge1xuICAgIGZ1bmN0aW9uIEVsZW1lbnRNb25pdG9yKG9wdGlvbnMpIHtcbiAgICAgIHZhciBzZWxlY3RvciwgX2osIF9sZW4xLCBfcmVmMjtcbiAgICAgIGlmIChvcHRpb25zID09IG51bGwpIHtcbiAgICAgICAgb3B0aW9ucyA9IHt9O1xuICAgICAgfVxuICAgICAgdGhpcy5lbGVtZW50cyA9IFtdO1xuICAgICAgaWYgKG9wdGlvbnMuc2VsZWN0b3JzID09IG51bGwpIHtcbiAgICAgICAgb3B0aW9ucy5zZWxlY3RvcnMgPSBbXTtcbiAgICAgIH1cbiAgICAgIF9yZWYyID0gb3B0aW9ucy5zZWxlY3RvcnM7XG4gICAgICBmb3IgKF9qID0gMCwgX2xlbjEgPSBfcmVmMi5sZW5ndGg7IF9qIDwgX2xlbjE7IF9qKyspIHtcbiAgICAgICAgc2VsZWN0b3IgPSBfcmVmMltfal07XG4gICAgICAgIHRoaXMuZWxlbWVudHMucHVzaChuZXcgRWxlbWVudFRyYWNrZXIoc2VsZWN0b3IpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gRWxlbWVudE1vbml0b3I7XG5cbiAgfSkoKTtcblxuICBFbGVtZW50VHJhY2tlciA9IChmdW5jdGlvbigpIHtcbiAgICBmdW5jdGlvbiBFbGVtZW50VHJhY2tlcihzZWxlY3Rvcikge1xuICAgICAgdGhpcy5zZWxlY3RvciA9IHNlbGVjdG9yO1xuICAgICAgdGhpcy5wcm9ncmVzcyA9IDA7XG4gICAgICB0aGlzLmNoZWNrKCk7XG4gICAgfVxuXG4gICAgRWxlbWVudFRyYWNrZXIucHJvdG90eXBlLmNoZWNrID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgaWYgKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IodGhpcy5zZWxlY3RvcikpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZG9uZSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiBfdGhpcy5jaGVjaygpO1xuICAgICAgICB9KSwgb3B0aW9ucy5lbGVtZW50cy5jaGVja0ludGVydmFsKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgRWxlbWVudFRyYWNrZXIucHJvdG90eXBlLmRvbmUgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLnByb2dyZXNzID0gMTAwO1xuICAgIH07XG5cbiAgICByZXR1cm4gRWxlbWVudFRyYWNrZXI7XG5cbiAgfSkoKTtcblxuICBEb2N1bWVudE1vbml0b3IgPSAoZnVuY3Rpb24oKSB7XG4gICAgRG9jdW1lbnRNb25pdG9yLnByb3RvdHlwZS5zdGF0ZXMgPSB7XG4gICAgICBsb2FkaW5nOiAwLFxuICAgICAgaW50ZXJhY3RpdmU6IDUwLFxuICAgICAgY29tcGxldGU6IDEwMFxuICAgIH07XG5cbiAgICBmdW5jdGlvbiBEb2N1bWVudE1vbml0b3IoKSB7XG4gICAgICB2YXIgX29ucmVhZHlzdGF0ZWNoYW5nZSwgX3JlZjIsXG4gICAgICAgIF90aGlzID0gdGhpcztcbiAgICAgIHRoaXMucHJvZ3Jlc3MgPSAoX3JlZjIgPSB0aGlzLnN0YXRlc1tkb2N1bWVudC5yZWFkeVN0YXRlXSkgIT0gbnVsbCA/IF9yZWYyIDogMTAwO1xuICAgICAgX29ucmVhZHlzdGF0ZWNoYW5nZSA9IGRvY3VtZW50Lm9ucmVhZHlzdGF0ZWNoYW5nZTtcbiAgICAgIGRvY3VtZW50Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoX3RoaXMuc3RhdGVzW2RvY3VtZW50LnJlYWR5U3RhdGVdICE9IG51bGwpIHtcbiAgICAgICAgICBfdGhpcy5wcm9ncmVzcyA9IF90aGlzLnN0YXRlc1tkb2N1bWVudC5yZWFkeVN0YXRlXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHlwZW9mIF9vbnJlYWR5c3RhdGVjaGFuZ2UgPT09IFwiZnVuY3Rpb25cIiA/IF9vbnJlYWR5c3RhdGVjaGFuZ2UuYXBwbHkobnVsbCwgYXJndW1lbnRzKSA6IHZvaWQgMDtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIERvY3VtZW50TW9uaXRvcjtcblxuICB9KSgpO1xuXG4gIEV2ZW50TGFnTW9uaXRvciA9IChmdW5jdGlvbigpIHtcbiAgICBmdW5jdGlvbiBFdmVudExhZ01vbml0b3IoKSB7XG4gICAgICB2YXIgYXZnLCBpbnRlcnZhbCwgbGFzdCwgcG9pbnRzLCBzYW1wbGVzLFxuICAgICAgICBfdGhpcyA9IHRoaXM7XG4gICAgICB0aGlzLnByb2dyZXNzID0gMDtcbiAgICAgIGF2ZyA9IDA7XG4gICAgICBzYW1wbGVzID0gW107XG4gICAgICBwb2ludHMgPSAwO1xuICAgICAgbGFzdCA9IG5vdygpO1xuICAgICAgaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGRpZmY7XG4gICAgICAgIGRpZmYgPSBub3coKSAtIGxhc3QgLSA1MDtcbiAgICAgICAgbGFzdCA9IG5vdygpO1xuICAgICAgICBzYW1wbGVzLnB1c2goZGlmZik7XG4gICAgICAgIGlmIChzYW1wbGVzLmxlbmd0aCA+IG9wdGlvbnMuZXZlbnRMYWcuc2FtcGxlQ291bnQpIHtcbiAgICAgICAgICBzYW1wbGVzLnNoaWZ0KCk7XG4gICAgICAgIH1cbiAgICAgICAgYXZnID0gYXZnQW1wbGl0dWRlKHNhbXBsZXMpO1xuICAgICAgICBpZiAoKytwb2ludHMgPj0gb3B0aW9ucy5ldmVudExhZy5taW5TYW1wbGVzICYmIGF2ZyA8IG9wdGlvbnMuZXZlbnRMYWcubGFnVGhyZXNob2xkKSB7XG4gICAgICAgICAgX3RoaXMucHJvZ3Jlc3MgPSAxMDA7XG4gICAgICAgICAgcmV0dXJuIGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWwpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBfdGhpcy5wcm9ncmVzcyA9IDEwMCAqICgzIC8gKGF2ZyArIDMpKTtcbiAgICAgICAgfVxuICAgICAgfSwgNTApO1xuICAgIH1cblxuICAgIHJldHVybiBFdmVudExhZ01vbml0b3I7XG5cbiAgfSkoKTtcblxuICBTY2FsZXIgPSAoZnVuY3Rpb24oKSB7XG4gICAgZnVuY3Rpb24gU2NhbGVyKHNvdXJjZSkge1xuICAgICAgdGhpcy5zb3VyY2UgPSBzb3VyY2U7XG4gICAgICB0aGlzLmxhc3QgPSB0aGlzLnNpbmNlTGFzdFVwZGF0ZSA9IDA7XG4gICAgICB0aGlzLnJhdGUgPSBvcHRpb25zLmluaXRpYWxSYXRlO1xuICAgICAgdGhpcy5jYXRjaHVwID0gMDtcbiAgICAgIHRoaXMucHJvZ3Jlc3MgPSB0aGlzLmxhc3RQcm9ncmVzcyA9IDA7XG4gICAgICBpZiAodGhpcy5zb3VyY2UgIT0gbnVsbCkge1xuICAgICAgICB0aGlzLnByb2dyZXNzID0gcmVzdWx0KHRoaXMuc291cmNlLCAncHJvZ3Jlc3MnKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBTY2FsZXIucHJvdG90eXBlLnRpY2sgPSBmdW5jdGlvbihmcmFtZVRpbWUsIHZhbCkge1xuICAgICAgdmFyIHNjYWxpbmc7XG4gICAgICBpZiAodmFsID09IG51bGwpIHtcbiAgICAgICAgdmFsID0gcmVzdWx0KHRoaXMuc291cmNlLCAncHJvZ3Jlc3MnKTtcbiAgICAgIH1cbiAgICAgIGlmICh2YWwgPj0gMTAwKSB7XG4gICAgICAgIHRoaXMuZG9uZSA9IHRydWU7XG4gICAgICB9XG4gICAgICBpZiAodmFsID09PSB0aGlzLmxhc3QpIHtcbiAgICAgICAgdGhpcy5zaW5jZUxhc3RVcGRhdGUgKz0gZnJhbWVUaW1lO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHRoaXMuc2luY2VMYXN0VXBkYXRlKSB7XG4gICAgICAgICAgdGhpcy5yYXRlID0gKHZhbCAtIHRoaXMubGFzdCkgLyB0aGlzLnNpbmNlTGFzdFVwZGF0ZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNhdGNodXAgPSAodmFsIC0gdGhpcy5wcm9ncmVzcykgLyBvcHRpb25zLmNhdGNodXBUaW1lO1xuICAgICAgICB0aGlzLnNpbmNlTGFzdFVwZGF0ZSA9IDA7XG4gICAgICAgIHRoaXMubGFzdCA9IHZhbDtcbiAgICAgIH1cbiAgICAgIGlmICh2YWwgPiB0aGlzLnByb2dyZXNzKSB7XG4gICAgICAgIHRoaXMucHJvZ3Jlc3MgKz0gdGhpcy5jYXRjaHVwICogZnJhbWVUaW1lO1xuICAgICAgfVxuICAgICAgc2NhbGluZyA9IDEgLSBNYXRoLnBvdyh0aGlzLnByb2dyZXNzIC8gMTAwLCBvcHRpb25zLmVhc2VGYWN0b3IpO1xuICAgICAgdGhpcy5wcm9ncmVzcyArPSBzY2FsaW5nICogdGhpcy5yYXRlICogZnJhbWVUaW1lO1xuICAgICAgdGhpcy5wcm9ncmVzcyA9IE1hdGgubWluKHRoaXMubGFzdFByb2dyZXNzICsgb3B0aW9ucy5tYXhQcm9ncmVzc1BlckZyYW1lLCB0aGlzLnByb2dyZXNzKTtcbiAgICAgIHRoaXMucHJvZ3Jlc3MgPSBNYXRoLm1heCgwLCB0aGlzLnByb2dyZXNzKTtcbiAgICAgIHRoaXMucHJvZ3Jlc3MgPSBNYXRoLm1pbigxMDAsIHRoaXMucHJvZ3Jlc3MpO1xuICAgICAgdGhpcy5sYXN0UHJvZ3Jlc3MgPSB0aGlzLnByb2dyZXNzO1xuICAgICAgcmV0dXJuIHRoaXMucHJvZ3Jlc3M7XG4gICAgfTtcblxuICAgIHJldHVybiBTY2FsZXI7XG5cbiAgfSkoKTtcblxuICBzb3VyY2VzID0gbnVsbDtcblxuICBzY2FsZXJzID0gbnVsbDtcblxuICBiYXIgPSBudWxsO1xuXG4gIHVuaVNjYWxlciA9IG51bGw7XG5cbiAgYW5pbWF0aW9uID0gbnVsbDtcblxuICBjYW5jZWxBbmltYXRpb24gPSBudWxsO1xuXG4gIFBhY2UucnVubmluZyA9IGZhbHNlO1xuXG4gIGhhbmRsZVB1c2hTdGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIGlmIChvcHRpb25zLnJlc3RhcnRPblB1c2hTdGF0ZSkge1xuICAgICAgcmV0dXJuIFBhY2UucmVzdGFydCgpO1xuICAgIH1cbiAgfTtcblxuICBpZiAod2luZG93Lmhpc3RvcnkucHVzaFN0YXRlICE9IG51bGwpIHtcbiAgICBfcHVzaFN0YXRlID0gd2luZG93Lmhpc3RvcnkucHVzaFN0YXRlO1xuICAgIHdpbmRvdy5oaXN0b3J5LnB1c2hTdGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgaGFuZGxlUHVzaFN0YXRlKCk7XG4gICAgICByZXR1cm4gX3B1c2hTdGF0ZS5hcHBseSh3aW5kb3cuaGlzdG9yeSwgYXJndW1lbnRzKTtcbiAgICB9O1xuICB9XG5cbiAgaWYgKHdpbmRvdy5oaXN0b3J5LnJlcGxhY2VTdGF0ZSAhPSBudWxsKSB7XG4gICAgX3JlcGxhY2VTdGF0ZSA9IHdpbmRvdy5oaXN0b3J5LnJlcGxhY2VTdGF0ZTtcbiAgICB3aW5kb3cuaGlzdG9yeS5yZXBsYWNlU3RhdGUgPSBmdW5jdGlvbigpIHtcbiAgICAgIGhhbmRsZVB1c2hTdGF0ZSgpO1xuICAgICAgcmV0dXJuIF9yZXBsYWNlU3RhdGUuYXBwbHkod2luZG93Lmhpc3RvcnksIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgfVxuXG4gIFNPVVJDRV9LRVlTID0ge1xuICAgIGFqYXg6IEFqYXhNb25pdG9yLFxuICAgIGVsZW1lbnRzOiBFbGVtZW50TW9uaXRvcixcbiAgICBkb2N1bWVudDogRG9jdW1lbnRNb25pdG9yLFxuICAgIGV2ZW50TGFnOiBFdmVudExhZ01vbml0b3JcbiAgfTtcblxuICAoaW5pdCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB0eXBlLCBfaiwgX2ssIF9sZW4xLCBfbGVuMiwgX3JlZjIsIF9yZWYzLCBfcmVmNDtcbiAgICBQYWNlLnNvdXJjZXMgPSBzb3VyY2VzID0gW107XG4gICAgX3JlZjIgPSBbJ2FqYXgnLCAnZWxlbWVudHMnLCAnZG9jdW1lbnQnLCAnZXZlbnRMYWcnXTtcbiAgICBmb3IgKF9qID0gMCwgX2xlbjEgPSBfcmVmMi5sZW5ndGg7IF9qIDwgX2xlbjE7IF9qKyspIHtcbiAgICAgIHR5cGUgPSBfcmVmMltfal07XG4gICAgICBpZiAob3B0aW9uc1t0eXBlXSAhPT0gZmFsc2UpIHtcbiAgICAgICAgc291cmNlcy5wdXNoKG5ldyBTT1VSQ0VfS0VZU1t0eXBlXShvcHRpb25zW3R5cGVdKSk7XG4gICAgICB9XG4gICAgfVxuICAgIF9yZWY0ID0gKF9yZWYzID0gb3B0aW9ucy5leHRyYVNvdXJjZXMpICE9IG51bGwgPyBfcmVmMyA6IFtdO1xuICAgIGZvciAoX2sgPSAwLCBfbGVuMiA9IF9yZWY0Lmxlbmd0aDsgX2sgPCBfbGVuMjsgX2srKykge1xuICAgICAgc291cmNlID0gX3JlZjRbX2tdO1xuICAgICAgc291cmNlcy5wdXNoKG5ldyBzb3VyY2Uob3B0aW9ucykpO1xuICAgIH1cbiAgICBQYWNlLmJhciA9IGJhciA9IG5ldyBCYXI7XG4gICAgc2NhbGVycyA9IFtdO1xuICAgIHJldHVybiB1bmlTY2FsZXIgPSBuZXcgU2NhbGVyO1xuICB9KSgpO1xuXG4gIFBhY2Uuc3RvcCA9IGZ1bmN0aW9uKCkge1xuICAgIFBhY2UudHJpZ2dlcignc3RvcCcpO1xuICAgIFBhY2UucnVubmluZyA9IGZhbHNlO1xuICAgIGJhci5kZXN0cm95KCk7XG4gICAgY2FuY2VsQW5pbWF0aW9uID0gdHJ1ZTtcbiAgICBpZiAoYW5pbWF0aW9uICE9IG51bGwpIHtcbiAgICAgIGlmICh0eXBlb2YgY2FuY2VsQW5pbWF0aW9uRnJhbWUgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICBjYW5jZWxBbmltYXRpb25GcmFtZShhbmltYXRpb24pO1xuICAgICAgfVxuICAgICAgYW5pbWF0aW9uID0gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIGluaXQoKTtcbiAgfTtcblxuICBQYWNlLnJlc3RhcnQgPSBmdW5jdGlvbigpIHtcbiAgICBQYWNlLnRyaWdnZXIoJ3Jlc3RhcnQnKTtcbiAgICBQYWNlLnN0b3AoKTtcbiAgICByZXR1cm4gUGFjZS5zdGFydCgpO1xuICB9O1xuXG4gIFBhY2UuZ28gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgc3RhcnQ7XG4gICAgUGFjZS5ydW5uaW5nID0gdHJ1ZTtcbiAgICBiYXIucmVuZGVyKCk7XG4gICAgc3RhcnQgPSBub3coKTtcbiAgICBjYW5jZWxBbmltYXRpb24gPSBmYWxzZTtcbiAgICByZXR1cm4gYW5pbWF0aW9uID0gcnVuQW5pbWF0aW9uKGZ1bmN0aW9uKGZyYW1lVGltZSwgZW5xdWV1ZU5leHRGcmFtZSkge1xuICAgICAgdmFyIGF2ZywgY291bnQsIGRvbmUsIGVsZW1lbnQsIGVsZW1lbnRzLCBpLCBqLCByZW1haW5pbmcsIHNjYWxlciwgc2NhbGVyTGlzdCwgc3VtLCBfaiwgX2ssIF9sZW4xLCBfbGVuMiwgX3JlZjI7XG4gICAgICByZW1haW5pbmcgPSAxMDAgLSBiYXIucHJvZ3Jlc3M7XG4gICAgICBjb3VudCA9IHN1bSA9IDA7XG4gICAgICBkb25lID0gdHJ1ZTtcbiAgICAgIGZvciAoaSA9IF9qID0gMCwgX2xlbjEgPSBzb3VyY2VzLmxlbmd0aDsgX2ogPCBfbGVuMTsgaSA9ICsrX2opIHtcbiAgICAgICAgc291cmNlID0gc291cmNlc1tpXTtcbiAgICAgICAgc2NhbGVyTGlzdCA9IHNjYWxlcnNbaV0gIT0gbnVsbCA/IHNjYWxlcnNbaV0gOiBzY2FsZXJzW2ldID0gW107XG4gICAgICAgIGVsZW1lbnRzID0gKF9yZWYyID0gc291cmNlLmVsZW1lbnRzKSAhPSBudWxsID8gX3JlZjIgOiBbc291cmNlXTtcbiAgICAgICAgZm9yIChqID0gX2sgPSAwLCBfbGVuMiA9IGVsZW1lbnRzLmxlbmd0aDsgX2sgPCBfbGVuMjsgaiA9ICsrX2spIHtcbiAgICAgICAgICBlbGVtZW50ID0gZWxlbWVudHNbal07XG4gICAgICAgICAgc2NhbGVyID0gc2NhbGVyTGlzdFtqXSAhPSBudWxsID8gc2NhbGVyTGlzdFtqXSA6IHNjYWxlckxpc3Rbal0gPSBuZXcgU2NhbGVyKGVsZW1lbnQpO1xuICAgICAgICAgIGRvbmUgJj0gc2NhbGVyLmRvbmU7XG4gICAgICAgICAgaWYgKHNjYWxlci5kb25lKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY291bnQrKztcbiAgICAgICAgICBzdW0gKz0gc2NhbGVyLnRpY2soZnJhbWVUaW1lKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgYXZnID0gc3VtIC8gY291bnQ7XG4gICAgICBiYXIudXBkYXRlKHVuaVNjYWxlci50aWNrKGZyYW1lVGltZSwgYXZnKSk7XG4gICAgICBpZiAoYmFyLmRvbmUoKSB8fCBkb25lIHx8IGNhbmNlbEFuaW1hdGlvbikge1xuICAgICAgICBiYXIudXBkYXRlKDEwMCk7XG4gICAgICAgIFBhY2UudHJpZ2dlcignZG9uZScpO1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICBiYXIuZmluaXNoKCk7XG4gICAgICAgICAgUGFjZS5ydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgcmV0dXJuIFBhY2UudHJpZ2dlcignaGlkZScpO1xuICAgICAgICB9LCBNYXRoLm1heChvcHRpb25zLmdob3N0VGltZSwgTWF0aC5tYXgob3B0aW9ucy5taW5UaW1lIC0gKG5vdygpIC0gc3RhcnQpLCAwKSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGVucXVldWVOZXh0RnJhbWUoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcblxuICBQYWNlLnN0YXJ0ID0gZnVuY3Rpb24oX29wdGlvbnMpIHtcbiAgICBleHRlbmQob3B0aW9ucywgX29wdGlvbnMpO1xuICAgIFBhY2UucnVubmluZyA9IHRydWU7XG4gICAgdHJ5IHtcbiAgICAgIGJhci5yZW5kZXIoKTtcbiAgICB9IGNhdGNoIChfZXJyb3IpIHtcbiAgICAgIE5vVGFyZ2V0RXJyb3IgPSBfZXJyb3I7XG4gICAgfVxuICAgIGlmICghZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnBhY2UnKSkge1xuICAgICAgcmV0dXJuIHNldFRpbWVvdXQoUGFjZS5zdGFydCwgNTApO1xuICAgIH0gZWxzZSB7XG4gICAgICBQYWNlLnRyaWdnZXIoJ3N0YXJ0Jyk7XG4gICAgICByZXR1cm4gUGFjZS5nbygpO1xuICAgIH1cbiAgfTtcblxuICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgZGVmaW5lKFsncGFjZSddLCBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBQYWNlO1xuICAgIH0pO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuICAgIG1vZHVsZS5leHBvcnRzID0gUGFjZTtcbiAgfSBlbHNlIHtcbiAgICBpZiAob3B0aW9ucy5zdGFydE9uUGFnZUxvYWQpIHtcbiAgICAgIFBhY2Uuc3RhcnQoKTtcbiAgICB9XG4gIH1cblxufSkuY2FsbCh0aGlzKTtcbiIsInZhciB0b2dnbGVBbGxCdXR0b25zID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmpzLWJ1bGxldHBvaW50LXRvZ2dsZS1hbGwnKTtcbnZhciB0b2dnbGVCdWxsZXRwb2ludEJ1dHRvbnMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuanMtYnVsbGV0cG9pbnQtdG9nZ2xlLWJ1bGxldHBvaW50Jyk7XG52YXIgdG9nZ2xlQXR0YWNobWVudHNCdXR0b25zID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmpzLWJ1bGxldHBvaW50LXRvZ2dsZS1hdHRhY2htZW50cycpO1xuXG4vLyBUb2dnbGUgYWxsLlxuZm9yICh2YXIgdG9nZ2xlQWxsQnV0dG9uIG9mIHRvZ2dsZUFsbEJ1dHRvbnMpIHtcbiAgdG9nZ2xlQWxsQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlVG9nZ2xlQWxsKTtcbn1cblxuZnVuY3Rpb24gaGFuZGxlVG9nZ2xlQWxsKGV2ZW50KSB7XG4gIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgdmFyIGJ1bGxldHBvaW50cyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ2J1bGxldHBvaW50Jyk7XG4gIHZhciBjdXJyZW50U3RhdGUgPSB0b2dnbGVBbGxCdXR0b24uZGF0YXNldC5jdXJyZW50U3RhdGU7XG5cbiAgaWYgKGN1cnJlbnRTdGF0ZSA9PT0gJ29wZW4nKSB7XG4gICAgdG9nZ2xlQWxsQnV0dG9uLmRhdGFzZXQuY3VycmVudFN0YXRlID0gJ2Nsb3NlZCc7XG5cbiAgICBmb3IgKHZhciBidWxsZXRwb2ludCBvZiBidWxsZXRwb2ludHMpIHtcbiAgICAgIGJ1bGxldHBvaW50LmNsYXNzTGlzdC5yZW1vdmUoJ2J1bGxldHBvaW50LS1vcGVuJyk7XG4gICAgfVxuICB9XG4gIGVsc2Uge1xuICAgIHRvZ2dsZUFsbEJ1dHRvbi5kYXRhc2V0LmN1cnJlbnRTdGF0ZSA9ICdvcGVuJztcblxuICAgIGZvciAodmFyIGJ1bGxldHBvaW50IG9mIGJ1bGxldHBvaW50cykge1xuICAgICAgYnVsbGV0cG9pbnQuY2xhc3NMaXN0LmFkZCgnYnVsbGV0cG9pbnQtLW9wZW4nKTtcbiAgICB9XG4gIH1cbn1cblxuLy8gVG9nZ2xlIGF0dGFjaG1lbnRzLlxuZm9yICh2YXIgdG9nZ2xlQXR0YWNobWVudEJ1dHRvbiBvZiB0b2dnbGVBdHRhY2htZW50c0J1dHRvbnMpIHtcbiAgdG9nZ2xlQXR0YWNobWVudEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZVRvZ2dsZUF0dGFjaG1lbnRzKTtcbn1cblxuZnVuY3Rpb24gaGFuZGxlVG9nZ2xlQXR0YWNobWVudHMoZXZlbnQpIHtcbiAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICB2YXIgZWxlbWVudCA9IHRoaXM7XG4gIHZhciBwYXJlbnQgPSBlbGVtZW50LmNsb3Nlc3QoJy5idWxsZXRwb2ludCcpO1xuXG4gIHBhcmVudC5jbGFzc0xpc3QudG9nZ2xlKCdidWxsZXRwb2ludC0tb3BlbicpO1xuXG4gIC8vIFJ1biB0aHJvdWdoIGF0dGFjaG1lbnRzIGFuZCB0b2dnbGUgdGhlbS5cbiAgdmFyIGF0dGFjaG1lbnRzID0gcGFyZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5idWxsZXRwb2ludC0tYXR0YWNobWVudCcpO1xuXG4gIGlmIChwYXJlbnQuY2xhc3NMaXN0LmNvbnRhaW5zKCdidWxsZXRwb2ludC0tb3BlbicpKSB7XG4gICAgZm9yICh2YXIgYXR0YWNobWVudCBvZiBhdHRhY2htZW50cykge1xuICAgICAgYXR0YWNobWVudC5jbGFzc0xpc3QuYWRkKCdidWxsZXRwb2ludC0tb3BlbicpO1xuICAgIH1cbiAgfVxuICBlbHNlIHtcbiAgICBmb3IgKHZhciBhdHRhY2htZW50IG9mIGF0dGFjaG1lbnRzKSB7XG4gICAgICBhdHRhY2htZW50LmNsYXNzTGlzdC5yZW1vdmUoJ2J1bGxldHBvaW50LS1vcGVuJyk7XG4gICAgfVxuICB9XG59XG5cbi8vIFRvZ2dsZSBidWxsZXRwb2ludC5cbmZvciAodmFyIHRvZ2dsZUJ1bGxldHBvaW50QnV0dG9uIG9mIHRvZ2dsZUJ1bGxldHBvaW50QnV0dG9ucykge1xuICB0b2dnbGVCdWxsZXRwb2ludEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZVRvZ2dsZUJ1bGxldHBvaW50KTtcbn1cblxuZnVuY3Rpb24gaGFuZGxlVG9nZ2xlQnVsbGV0cG9pbnQoZXZlbnQpIHtcbiAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICB2YXIgZWxlbWVudCA9IHRoaXM7XG4gIHZhciBwYXJlbnQgPSBlbGVtZW50LmNsb3Nlc3QoJy5idWxsZXRwb2ludCcpO1xuXG4gIHBhcmVudC5jbGFzc0xpc3QudG9nZ2xlKCdidWxsZXRwb2ludC0tb3BlbicpO1xufVxuIiwialF1ZXJ5KGZ1bmN0aW9uICgkKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICAvLyBGbGV4eSBoZWFkZXJcbiAgZmxleHlfaGVhZGVyLmluaXQoKTtcblxuICAkKCcuc2lkci10b2dnbGUtLXJpZ2h0Jykuc2lkcih7XG4gICAgbmFtZTogJ3NpZHItbWFpbicsXG4gICAgc2lkZTogJ3JpZ2h0JyxcbiAgICByZW5hbWluZzogZmFsc2UsXG4gICAgYm9keTogJy5sYXlvdXRfX3dyYXBwZXInLFxuICAgIHNvdXJjZTogJy5zaWRyLXNvdXJjZS1wcm92aWRlcidcbiAgfSk7XG5cbiAgLy8gRW5hYmxlIHRvb2x0aXBzLlxuICAkKCdbZGF0YS10b2dnbGU9XCJ0b29sdGlwXCJdJykudG9vbHRpcCgpO1xuXG4gIC8vIFBvcHB5IChwb3BvdmVycykuXG4gICQoJy5wb3BweS10b2dnbGUnKS5vbignY2xpY2snLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICB2YXIgJGVsZW1lbnQgPSAkKHRoaXMpO1xuICAgIHZhciAkcGFyZW50ID0gJGVsZW1lbnQucGFyZW50cygnLnBvcHB5Jyk7XG5cbiAgICAvLyBNYWtlIHN1cmUgdGhhdCBubyBvdGhlciBcInBvcHB5c1wiIGFyZSBvcGVuLlxuICAgICQoJy5wb3BweS0tb3BlbicpXG4gICAgICAubm90KCRwYXJlbnQpXG4gICAgICAucmVtb3ZlQ2xhc3MoJ3BvcHB5LS1vcGVuJyk7XG5cbiAgICAvLyBUb2dnbGUgdGhlIGNsYXNzIG9uIHRoaXMgZWxlbWVudC5cbiAgICAkcGFyZW50LnRvZ2dsZUNsYXNzKCdwb3BweS0tb3BlbicpO1xuICB9KTtcbiAgJCgnLnBvcHB5Jykub24oJ2NsaWNrJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gIH0pO1xuICAkKCdib2R5Jykub24oJ2NsaWNrJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgJCgnLnBvcHB5LS1vcGVuJykucmVtb3ZlQ2xhc3MoJ3BvcHB5LS1vcGVuJyk7XG4gIH0pO1xuXG4gIC8vIEFqYXhpIGNsaWNrIGxvYWRlci5cbiAgJCgnW2RhdGEtYWpheGktc291cmNlXScpLm9uKCdjbGljaycsIGZ1bmN0aW9uIChldmVudCkge1xuICAgIHZhciAkZWxlbWVudCA9ICQodGhpcyk7XG4gICAgdmFyIHRhcmdldCA9ICRlbGVtZW50LmF0dHIoJ2RhdGEtYWpheGktdGFyZ2V0Jyk7XG4gICAgdmFyIHNvdXJjZSA9ICRlbGVtZW50LmF0dHIoJ2RhdGEtYWpheGktc291cmNlJyk7XG4gICAgdmFyIGxvYWRpbmcgPSAkZWxlbWVudC5hdHRyKCdkYXRhLWFqYXhpLWxvYWRpbmcnKTtcblxuICAgIC8vIFNldCBsb2FkaW5nIHRleHQuXG4gICAgJCh0YXJnZXQpLmh0bWwobG9hZGluZyk7XG5cbiAgICAvLyBMb2FkIGV4dGVybmFsIGNvbnRlbnQuXG4gICAgJCh0YXJnZXQpLmxvYWQoc291cmNlKTtcbiAgfSk7XG5cbiAgLy8gU3dpdGNoIG1vZGUgdG9nZ2xlIGNhbGxiYWNrLlxuICAkKCcjbWVldGluZy1hZ2VuZGEtc3dpdGNoLW1vZGUtdG9nZ2xlJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgJCgnI2FnZW5kYS1vdmVydmlldycpLnRvZ2dsZUNsYXNzKCdoaWRkZW4nKTtcbiAgICAkKCcjYWdlbmRhLWl0ZW0tcmVvcmRlcicpLnRvZ2dsZUNsYXNzKCdoaWRkZW4nKTtcblxuICAgIC8vIFJlc2V0dGluZyBzZWFyY2guXG4gICAgJCgnLmJ1bGxldHBvaW50JykucmVtb3ZlQ2xhc3MoJ2hpZGRlbicpO1xuICAgICQoJ2Zvcm0uZGVjcmV0by1jb250ZW50LW1vZGlmeS1zZWFyY2gtaW4tbWVldGluZy1mb3JtIGlucHV0JykudmFsKCcnKTtcblxuICAgIC8vIFRvZ2dsZSBzZWFyY2ggZW5hYmxlZC5cbiAgICBpZiAoJCgnI2FnZW5kYS1vdmVydmlldycpLmhhc0NsYXNzKCdoaWRkZW4nKSkge1xuICAgICAgJCgnZm9ybS5kZWNyZXRvLWNvbnRlbnQtbW9kaWZ5LXNlYXJjaC1pbi1tZWV0aW5nLWZvcm0gaW5wdXQnKS5hdHRyKCdkaXNhYmxlZCcsICdkaXNhYmxlZCcpXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgJCgnZm9ybS5kZWNyZXRvLWNvbnRlbnQtbW9kaWZ5LXNlYXJjaC1pbi1tZWV0aW5nLWZvcm0gaW5wdXQnKS5yZW1vdmVBdHRyKCdkaXNhYmxlZCcpO1xuICAgIH1cblxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gIH0pO1xufSk7XG4iXX0=
