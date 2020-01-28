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

(function () {
  var toggleAllButtons = document.querySelectorAll('.js-bulletpoint-toggle-all');
  var toggleBulletpointButtons = document.querySelectorAll('.js-bulletpoint-toggle-bulletpoint');
  var toggleAttachmentsButtons = document.querySelectorAll('.js-bulletpoint-toggle-attachments');
  var addBulletpointButtons = document.querySelectorAll('.js-bulletpoint-add');

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
    var id = parent.dataset.decretoNodeId;

    // Add selected bulletpoint param to URL - only if it's a
    // parent bulletpoint that has been opened.
    if (!parent.classList.contains('bulletpoint--attachment')) {
      window.history.pushState(null, null, '?bulletpoint=' + id);
    }

    // Toggle visibility.
    parent.classList.toggle('bulletpoint--open');
  }

  // Add bulletpoint attachment.
  var _iteratorNormalCompletion8 = true;
  var _didIteratorError8 = false;
  var _iteratorError8 = undefined;

  try {
    for (var _iterator8 = addBulletpointButtons[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
      var addBulletpointButton = _step8.value;

      addBulletpointButton.addEventListener('click', handleAddBulletpoint);
    }
  } catch (err) {
    _didIteratorError8 = true;
    _iteratorError8 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion8 && _iterator8.return) {
        _iterator8.return();
      }
    } finally {
      if (_didIteratorError8) {
        throw _iteratorError8;
      }
    }
  }

  function handleAddBulletpoint() {
    var element = this;
    var parent = element.closest('.bulletpoint');
    var id = parent.dataset.decretoNodeId;

    // Add bulletpoint param to URL.
    window.history.pushState(null, null, '?bulletpoint=' + id);
  }

  // Page load.
  document.addEventListener('DOMContentLoaded', function () {
    var queryString = window.location.search;
    var urlParams = new URLSearchParams(queryString);
    var param = urlParams.get('bulletpoint');

    if (param !== null) {
      var bulletpoint = document.getElementById('bulletpoint--' + param);

      if (bulletpoint !== null) {
        bulletpoint.classList.add('bulletpoint--open');
      }
    }
  });

  function getUrlParams() {
    var params = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
      params[key] = value;
    });

    return params;
  }
})();
'use strict';

(function () {
  var sidebar = document.querySelector('.layout__sidebar');
  var toggles = document.querySelectorAll('.js-toggle-sidebar');

  var toggleState = function toggleState() {
    var currentState = localStorage.getItem('sidebar');

    if (currentState === 'narrow') {
      localStorage.setItem('sidebar', 'wide');
    } else {
      localStorage.setItem('sidebar', 'narrow');
    }
  };

  // Add eventlisteners.
  for (var i = 0; i < toggles.length; i++) {
    var toggle = toggles[i];

    toggle.addEventListener('click', function (e) {
      sidebar.classList.toggle('layout__sidebar--narrow');

      toggleState();
    });
  }

  // On load.
  var currentState = localStorage.getItem('sidebar');

  if (currentState === 'narrow') {
    sidebar.classList.add('layout__sidebar--narrow');
  } else {
    sidebar.classList.remove('layout__sidebar--narrow');
  }
})();
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBhY2UuanMiLCJib290c3RyYXAuanMiLCJmbGV4eS1oZWFkZXIuanMiLCJmbGV4eS1uYXZpZ2F0aW9uLmpzIiwianF1ZXJ5LnNpZHIuanMiLCJidWxsZXRwb2ludC5qcyIsInNpZGViYXIuanMiLCJhcHAuanMiXSwibmFtZXMiOlsiQWpheE1vbml0b3IiLCJCYXIiLCJEb2N1bWVudE1vbml0b3IiLCJFbGVtZW50TW9uaXRvciIsIkVsZW1lbnRUcmFja2VyIiwiRXZlbnRMYWdNb25pdG9yIiwiRXZlbnRlZCIsIkV2ZW50cyIsIk5vVGFyZ2V0RXJyb3IiLCJQYWNlIiwiUmVxdWVzdEludGVyY2VwdCIsIlNPVVJDRV9LRVlTIiwiU2NhbGVyIiwiU29ja2V0UmVxdWVzdFRyYWNrZXIiLCJYSFJSZXF1ZXN0VHJhY2tlciIsImFuaW1hdGlvbiIsImF2Z0FtcGxpdHVkZSIsImJhciIsImNhbmNlbEFuaW1hdGlvbiIsImNhbmNlbEFuaW1hdGlvbkZyYW1lIiwiZGVmYXVsdE9wdGlvbnMiLCJleHRlbmQiLCJleHRlbmROYXRpdmUiLCJnZXRGcm9tRE9NIiwiZ2V0SW50ZXJjZXB0IiwiaGFuZGxlUHVzaFN0YXRlIiwiaWdub3JlU3RhY2siLCJpbml0Iiwibm93Iiwib3B0aW9ucyIsInJlcXVlc3RBbmltYXRpb25GcmFtZSIsInJlc3VsdCIsInJ1bkFuaW1hdGlvbiIsInNjYWxlcnMiLCJzaG91bGRJZ25vcmVVUkwiLCJzaG91bGRUcmFjayIsInNvdXJjZSIsInNvdXJjZXMiLCJ1bmlTY2FsZXIiLCJfV2ViU29ja2V0IiwiX1hEb21haW5SZXF1ZXN0IiwiX1hNTEh0dHBSZXF1ZXN0IiwiX2kiLCJfaW50ZXJjZXB0IiwiX2xlbiIsIl9wdXNoU3RhdGUiLCJfcmVmIiwiX3JlZjEiLCJfcmVwbGFjZVN0YXRlIiwiX19zbGljZSIsInNsaWNlIiwiX19oYXNQcm9wIiwiaGFzT3duUHJvcGVydHkiLCJfX2V4dGVuZHMiLCJjaGlsZCIsInBhcmVudCIsImtleSIsImNhbGwiLCJjdG9yIiwiY29uc3RydWN0b3IiLCJwcm90b3R5cGUiLCJfX3N1cGVyX18iLCJfX2luZGV4T2YiLCJpbmRleE9mIiwiaXRlbSIsImkiLCJsIiwibGVuZ3RoIiwiY2F0Y2h1cFRpbWUiLCJpbml0aWFsUmF0ZSIsIm1pblRpbWUiLCJnaG9zdFRpbWUiLCJtYXhQcm9ncmVzc1BlckZyYW1lIiwiZWFzZUZhY3RvciIsInN0YXJ0T25QYWdlTG9hZCIsInJlc3RhcnRPblB1c2hTdGF0ZSIsInJlc3RhcnRPblJlcXVlc3RBZnRlciIsInRhcmdldCIsImVsZW1lbnRzIiwiY2hlY2tJbnRlcnZhbCIsInNlbGVjdG9ycyIsImV2ZW50TGFnIiwibWluU2FtcGxlcyIsInNhbXBsZUNvdW50IiwibGFnVGhyZXNob2xkIiwiYWpheCIsInRyYWNrTWV0aG9kcyIsInRyYWNrV2ViU29ja2V0cyIsImlnbm9yZVVSTHMiLCJwZXJmb3JtYW5jZSIsIkRhdGUiLCJ3aW5kb3ciLCJtb3pSZXF1ZXN0QW5pbWF0aW9uRnJhbWUiLCJ3ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUiLCJtc1JlcXVlc3RBbmltYXRpb25GcmFtZSIsIm1vekNhbmNlbEFuaW1hdGlvbkZyYW1lIiwiZm4iLCJzZXRUaW1lb3V0IiwiaWQiLCJjbGVhclRpbWVvdXQiLCJsYXN0IiwidGljayIsImRpZmYiLCJhcmdzIiwib2JqIiwiYXJndW1lbnRzIiwiYXBwbHkiLCJvdXQiLCJ2YWwiLCJhcnIiLCJjb3VudCIsInN1bSIsInYiLCJNYXRoIiwiYWJzIiwianNvbiIsImRhdGEiLCJlIiwiZWwiLCJkb2N1bWVudCIsInF1ZXJ5U2VsZWN0b3IiLCJnZXRBdHRyaWJ1dGUiLCJKU09OIiwicGFyc2UiLCJfZXJyb3IiLCJjb25zb2xlIiwiZXJyb3IiLCJvbiIsImV2ZW50IiwiaGFuZGxlciIsImN0eCIsIm9uY2UiLCJfYmFzZSIsImJpbmRpbmdzIiwicHVzaCIsIm9mZiIsIl9yZXN1bHRzIiwic3BsaWNlIiwidHJpZ2dlciIsInBhY2VPcHRpb25zIiwiX3N1cGVyIiwiRXJyb3IiLCJwcm9ncmVzcyIsImdldEVsZW1lbnQiLCJ0YXJnZXRFbGVtZW50IiwiY3JlYXRlRWxlbWVudCIsImNsYXNzTmFtZSIsImJvZHkiLCJyZXBsYWNlIiwiaW5uZXJIVE1MIiwiZmlyc3RDaGlsZCIsImluc2VydEJlZm9yZSIsImFwcGVuZENoaWxkIiwiZmluaXNoIiwidXBkYXRlIiwicHJvZyIsInJlbmRlciIsImRlc3Ryb3kiLCJwYXJlbnROb2RlIiwicmVtb3ZlQ2hpbGQiLCJwcm9ncmVzc1N0ciIsInRyYW5zZm9ybSIsIl9qIiwiX2xlbjEiLCJfcmVmMiIsImNoaWxkcmVuIiwic3R5bGUiLCJsYXN0UmVuZGVyZWRQcm9ncmVzcyIsInNldEF0dHJpYnV0ZSIsImRvbmUiLCJuYW1lIiwiYmluZGluZyIsIlhNTEh0dHBSZXF1ZXN0IiwiWERvbWFpblJlcXVlc3QiLCJXZWJTb2NrZXQiLCJ0byIsImZyb20iLCJPYmplY3QiLCJkZWZpbmVQcm9wZXJ0eSIsImdldCIsImNvbmZpZ3VyYWJsZSIsImVudW1lcmFibGUiLCJpZ25vcmUiLCJyZXQiLCJ1bnNoaWZ0Iiwic2hpZnQiLCJ0cmFjayIsIm1ldGhvZCIsInRvVXBwZXJDYXNlIiwibW9uaXRvclhIUiIsIl90aGlzIiwicmVxIiwiX29wZW4iLCJvcGVuIiwidHlwZSIsInVybCIsImFzeW5jIiwicmVxdWVzdCIsImZsYWdzIiwicHJvdG9jb2xzIiwicGF0dGVybiIsInRlc3QiLCJfYXJnIiwiYWZ0ZXIiLCJydW5uaW5nIiwic3RpbGxBY3RpdmUiLCJfcmVmMyIsInJlYWR5U3RhdGUiLCJyZXN0YXJ0Iiwid2F0Y2giLCJ0cmFja2VyIiwic2l6ZSIsIl9vbnJlYWR5c3RhdGVjaGFuZ2UiLCJQcm9ncmVzc0V2ZW50IiwiYWRkRXZlbnRMaXN0ZW5lciIsImV2dCIsImxlbmd0aENvbXB1dGFibGUiLCJsb2FkZWQiLCJ0b3RhbCIsIm9ucmVhZHlzdGF0ZWNoYW5nZSIsInNlbGVjdG9yIiwiY2hlY2siLCJzdGF0ZXMiLCJsb2FkaW5nIiwiaW50ZXJhY3RpdmUiLCJjb21wbGV0ZSIsImF2ZyIsImludGVydmFsIiwicG9pbnRzIiwic2FtcGxlcyIsInNldEludGVydmFsIiwiY2xlYXJJbnRlcnZhbCIsInNpbmNlTGFzdFVwZGF0ZSIsInJhdGUiLCJjYXRjaHVwIiwibGFzdFByb2dyZXNzIiwiZnJhbWVUaW1lIiwic2NhbGluZyIsInBvdyIsIm1pbiIsIm1heCIsImhpc3RvcnkiLCJwdXNoU3RhdGUiLCJyZXBsYWNlU3RhdGUiLCJfayIsIl9sZW4yIiwiX3JlZjQiLCJleHRyYVNvdXJjZXMiLCJzdG9wIiwic3RhcnQiLCJnbyIsImVucXVldWVOZXh0RnJhbWUiLCJlbGVtZW50IiwiaiIsInJlbWFpbmluZyIsInNjYWxlciIsInNjYWxlckxpc3QiLCJfb3B0aW9ucyIsImRlZmluZSIsImFtZCIsImV4cG9ydHMiLCJtb2R1bGUiLCJqUXVlcnkiLCIkIiwidmVyc2lvbiIsImpxdWVyeSIsInNwbGl0IiwidHJhbnNpdGlvbkVuZCIsInRyYW5zRW5kRXZlbnROYW1lcyIsIldlYmtpdFRyYW5zaXRpb24iLCJNb3pUcmFuc2l0aW9uIiwiT1RyYW5zaXRpb24iLCJ0cmFuc2l0aW9uIiwidW5kZWZpbmVkIiwiZW5kIiwiZW11bGF0ZVRyYW5zaXRpb25FbmQiLCJkdXJhdGlvbiIsImNhbGxlZCIsIiRlbCIsIm9uZSIsImNhbGxiYWNrIiwic3VwcG9ydCIsInNwZWNpYWwiLCJic1RyYW5zaXRpb25FbmQiLCJiaW5kVHlwZSIsImRlbGVnYXRlVHlwZSIsImhhbmRsZSIsImlzIiwiaGFuZGxlT2JqIiwiZGlzbWlzcyIsIkFsZXJ0IiwiY2xvc2UiLCJWRVJTSU9OIiwiVFJBTlNJVElPTl9EVVJBVElPTiIsIiR0aGlzIiwiYXR0ciIsIiRwYXJlbnQiLCJmaW5kIiwicHJldmVudERlZmF1bHQiLCJjbG9zZXN0IiwiRXZlbnQiLCJpc0RlZmF1bHRQcmV2ZW50ZWQiLCJyZW1vdmVDbGFzcyIsInJlbW92ZUVsZW1lbnQiLCJkZXRhY2giLCJyZW1vdmUiLCJoYXNDbGFzcyIsIlBsdWdpbiIsIm9wdGlvbiIsImVhY2giLCJvbGQiLCJhbGVydCIsIkNvbnN0cnVjdG9yIiwibm9Db25mbGljdCIsIkJ1dHRvbiIsIiRlbGVtZW50IiwiREVGQVVMVFMiLCJpc0xvYWRpbmciLCJsb2FkaW5nVGV4dCIsInNldFN0YXRlIiwic3RhdGUiLCJkIiwicmVzZXRUZXh0IiwicHJveHkiLCJhZGRDbGFzcyIsInByb3AiLCJyZW1vdmVBdHRyIiwidG9nZ2xlIiwiY2hhbmdlZCIsIiRpbnB1dCIsInRvZ2dsZUNsYXNzIiwiYnV0dG9uIiwiJGJ0biIsImZpcnN0IiwiQ2Fyb3VzZWwiLCIkaW5kaWNhdG9ycyIsInBhdXNlZCIsInNsaWRpbmciLCIkYWN0aXZlIiwiJGl0ZW1zIiwia2V5Ym9hcmQiLCJrZXlkb3duIiwicGF1c2UiLCJkb2N1bWVudEVsZW1lbnQiLCJjeWNsZSIsIndyYXAiLCJ0YWdOYW1lIiwid2hpY2giLCJwcmV2IiwibmV4dCIsImdldEl0ZW1JbmRleCIsImluZGV4IiwiZ2V0SXRlbUZvckRpcmVjdGlvbiIsImRpcmVjdGlvbiIsImFjdGl2ZSIsImFjdGl2ZUluZGV4Iiwid2lsbFdyYXAiLCJkZWx0YSIsIml0ZW1JbmRleCIsImVxIiwicG9zIiwidGhhdCIsInNsaWRlIiwiJG5leHQiLCJpc0N5Y2xpbmciLCJyZWxhdGVkVGFyZ2V0Iiwic2xpZGVFdmVudCIsIiRuZXh0SW5kaWNhdG9yIiwic2xpZEV2ZW50Iiwib2Zmc2V0V2lkdGgiLCJqb2luIiwiYWN0aW9uIiwiY2Fyb3VzZWwiLCJjbGlja0hhbmRsZXIiLCJocmVmIiwiJHRhcmdldCIsInNsaWRlSW5kZXgiLCIkY2Fyb3VzZWwiLCJDb2xsYXBzZSIsIiR0cmlnZ2VyIiwidHJhbnNpdGlvbmluZyIsImdldFBhcmVudCIsImFkZEFyaWFBbmRDb2xsYXBzZWRDbGFzcyIsImRpbWVuc2lvbiIsImhhc1dpZHRoIiwic2hvdyIsImFjdGl2ZXNEYXRhIiwiYWN0aXZlcyIsInN0YXJ0RXZlbnQiLCJzY3JvbGxTaXplIiwiY2FtZWxDYXNlIiwiaGlkZSIsIm9mZnNldEhlaWdodCIsImdldFRhcmdldEZyb21UcmlnZ2VyIiwiaXNPcGVuIiwiY29sbGFwc2UiLCJiYWNrZHJvcCIsIkRyb3Bkb3duIiwiY2xlYXJNZW51cyIsImNvbnRhaW5zIiwiaXNBY3RpdmUiLCJpbnNlcnRBZnRlciIsInN0b3BQcm9wYWdhdGlvbiIsImRlc2MiLCJkcm9wZG93biIsIk1vZGFsIiwiJGJvZHkiLCIkZGlhbG9nIiwiJGJhY2tkcm9wIiwiaXNTaG93biIsIm9yaWdpbmFsQm9keVBhZCIsInNjcm9sbGJhcldpZHRoIiwiaWdub3JlQmFja2Ryb3BDbGljayIsImZpeGVkQ29udGVudCIsInJlbW90ZSIsImxvYWQiLCJCQUNLRFJPUF9UUkFOU0lUSU9OX0RVUkFUSU9OIiwiX3JlbGF0ZWRUYXJnZXQiLCJjaGVja1Njcm9sbGJhciIsInNldFNjcm9sbGJhciIsImVzY2FwZSIsInJlc2l6ZSIsImFwcGVuZFRvIiwic2Nyb2xsVG9wIiwiYWRqdXN0RGlhbG9nIiwiZW5mb3JjZUZvY3VzIiwiaGlkZU1vZGFsIiwiaGFzIiwiaGFuZGxlVXBkYXRlIiwicmVzZXRBZGp1c3RtZW50cyIsInJlc2V0U2Nyb2xsYmFyIiwicmVtb3ZlQmFja2Ryb3AiLCJhbmltYXRlIiwiZG9BbmltYXRlIiwiY3VycmVudFRhcmdldCIsImZvY3VzIiwiY2FsbGJhY2tSZW1vdmUiLCJtb2RhbElzT3ZlcmZsb3dpbmciLCJzY3JvbGxIZWlnaHQiLCJjbGllbnRIZWlnaHQiLCJjc3MiLCJwYWRkaW5nTGVmdCIsImJvZHlJc092ZXJmbG93aW5nIiwicGFkZGluZ1JpZ2h0IiwiZnVsbFdpbmRvd1dpZHRoIiwiaW5uZXJXaWR0aCIsImRvY3VtZW50RWxlbWVudFJlY3QiLCJnZXRCb3VuZGluZ0NsaWVudFJlY3QiLCJyaWdodCIsImxlZnQiLCJjbGllbnRXaWR0aCIsIm1lYXN1cmVTY3JvbGxiYXIiLCJib2R5UGFkIiwicGFyc2VJbnQiLCJhY3R1YWxQYWRkaW5nIiwiY2FsY3VsYXRlZFBhZGRpbmciLCJwYXJzZUZsb2F0IiwicGFkZGluZyIsInJlbW92ZURhdGEiLCJzY3JvbGxEaXYiLCJhcHBlbmQiLCJtb2RhbCIsInNob3dFdmVudCIsIkRJU0FMTE9XRURfQVRUUklCVVRFUyIsInVyaUF0dHJzIiwiQVJJQV9BVFRSSUJVVEVfUEFUVEVSTiIsIkRlZmF1bHRXaGl0ZWxpc3QiLCJhIiwiYXJlYSIsImIiLCJiciIsImNvbCIsImNvZGUiLCJkaXYiLCJlbSIsImhyIiwiaDEiLCJoMiIsImgzIiwiaDQiLCJoNSIsImg2IiwiaW1nIiwibGkiLCJvbCIsInAiLCJwcmUiLCJzIiwic21hbGwiLCJzcGFuIiwic3ViIiwic3VwIiwic3Ryb25nIiwidSIsInVsIiwiU0FGRV9VUkxfUEFUVEVSTiIsIkRBVEFfVVJMX1BBVFRFUk4iLCJhbGxvd2VkQXR0cmlidXRlIiwiYWxsb3dlZEF0dHJpYnV0ZUxpc3QiLCJhdHRyTmFtZSIsIm5vZGVOYW1lIiwidG9Mb3dlckNhc2UiLCJpbkFycmF5IiwiQm9vbGVhbiIsIm5vZGVWYWx1ZSIsIm1hdGNoIiwicmVnRXhwIiwiZmlsdGVyIiwidmFsdWUiLCJSZWdFeHAiLCJzYW5pdGl6ZUh0bWwiLCJ1bnNhZmVIdG1sIiwid2hpdGVMaXN0Iiwic2FuaXRpemVGbiIsImltcGxlbWVudGF0aW9uIiwiY3JlYXRlSFRNTERvY3VtZW50IiwiY3JlYXRlZERvY3VtZW50Iiwid2hpdGVsaXN0S2V5cyIsIm1hcCIsImxlbiIsImVsTmFtZSIsImF0dHJpYnV0ZUxpc3QiLCJhdHRyaWJ1dGVzIiwid2hpdGVsaXN0ZWRBdHRyaWJ1dGVzIiwiY29uY2F0IiwibGVuMiIsInJlbW92ZUF0dHJpYnV0ZSIsIlRvb2x0aXAiLCJlbmFibGVkIiwidGltZW91dCIsImhvdmVyU3RhdGUiLCJpblN0YXRlIiwicGxhY2VtZW50IiwidGVtcGxhdGUiLCJ0aXRsZSIsImRlbGF5IiwiaHRtbCIsImNvbnRhaW5lciIsInZpZXdwb3J0Iiwic2FuaXRpemUiLCJnZXRPcHRpb25zIiwiJHZpZXdwb3J0IiwiaXNGdW5jdGlvbiIsImNsaWNrIiwiaG92ZXIiLCJ0cmlnZ2VycyIsImV2ZW50SW4iLCJldmVudE91dCIsImVudGVyIiwibGVhdmUiLCJmaXhUaXRsZSIsImdldERlZmF1bHRzIiwiZGF0YUF0dHJpYnV0ZXMiLCJkYXRhQXR0ciIsImdldERlbGVnYXRlT3B0aW9ucyIsImRlZmF1bHRzIiwic2VsZiIsInRpcCIsImlzSW5TdGF0ZVRydWUiLCJoYXNDb250ZW50IiwiaW5Eb20iLCJvd25lckRvY3VtZW50IiwiJHRpcCIsInRpcElkIiwiZ2V0VUlEIiwic2V0Q29udGVudCIsImF1dG9Ub2tlbiIsImF1dG9QbGFjZSIsInRvcCIsImRpc3BsYXkiLCJnZXRQb3NpdGlvbiIsImFjdHVhbFdpZHRoIiwiYWN0dWFsSGVpZ2h0Iiwib3JnUGxhY2VtZW50Iiwidmlld3BvcnREaW0iLCJib3R0b20iLCJ3aWR0aCIsImNhbGN1bGF0ZWRPZmZzZXQiLCJnZXRDYWxjdWxhdGVkT2Zmc2V0IiwiYXBwbHlQbGFjZW1lbnQiLCJwcmV2SG92ZXJTdGF0ZSIsIm9mZnNldCIsImhlaWdodCIsIm1hcmdpblRvcCIsIm1hcmdpbkxlZnQiLCJpc05hTiIsInNldE9mZnNldCIsInVzaW5nIiwicHJvcHMiLCJyb3VuZCIsImdldFZpZXdwb3J0QWRqdXN0ZWREZWx0YSIsImlzVmVydGljYWwiLCJhcnJvd0RlbHRhIiwiYXJyb3dPZmZzZXRQb3NpdGlvbiIsInJlcGxhY2VBcnJvdyIsImFycm93IiwiZ2V0VGl0bGUiLCJ0ZXh0IiwiJGUiLCJpc0JvZHkiLCJlbFJlY3QiLCJpc1N2ZyIsIlNWR0VsZW1lbnQiLCJlbE9mZnNldCIsInNjcm9sbCIsIm91dGVyRGltcyIsInZpZXdwb3J0UGFkZGluZyIsInZpZXdwb3J0RGltZW5zaW9ucyIsInRvcEVkZ2VPZmZzZXQiLCJib3R0b21FZGdlT2Zmc2V0IiwibGVmdEVkZ2VPZmZzZXQiLCJyaWdodEVkZ2VPZmZzZXQiLCJvIiwicHJlZml4IiwicmFuZG9tIiwiZ2V0RWxlbWVudEJ5SWQiLCIkYXJyb3ciLCJlbmFibGUiLCJkaXNhYmxlIiwidG9nZ2xlRW5hYmxlZCIsInRvb2x0aXAiLCJQb3BvdmVyIiwiY29udGVudCIsImdldENvbnRlbnQiLCJ0eXBlQ29udGVudCIsInBvcG92ZXIiLCJTY3JvbGxTcHkiLCIkc2Nyb2xsRWxlbWVudCIsIm9mZnNldHMiLCJ0YXJnZXRzIiwiYWN0aXZlVGFyZ2V0IiwicHJvY2VzcyIsInJlZnJlc2giLCJnZXRTY3JvbGxIZWlnaHQiLCJvZmZzZXRNZXRob2QiLCJvZmZzZXRCYXNlIiwiaXNXaW5kb3ciLCIkaHJlZiIsInNvcnQiLCJtYXhTY3JvbGwiLCJhY3RpdmF0ZSIsImNsZWFyIiwicGFyZW50cyIsInBhcmVudHNVbnRpbCIsInNjcm9sbHNweSIsIiRzcHkiLCJUYWIiLCIkdWwiLCIkcHJldmlvdXMiLCJoaWRlRXZlbnQiLCJ0YWIiLCJBZmZpeCIsImNoZWNrUG9zaXRpb24iLCJjaGVja1Bvc2l0aW9uV2l0aEV2ZW50TG9vcCIsImFmZml4ZWQiLCJ1bnBpbiIsInBpbm5lZE9mZnNldCIsIlJFU0VUIiwiZ2V0U3RhdGUiLCJvZmZzZXRUb3AiLCJvZmZzZXRCb3R0b20iLCJwb3NpdGlvbiIsInRhcmdldEhlaWdodCIsImluaXRpYWxpemluZyIsImNvbGxpZGVyVG9wIiwiY29sbGlkZXJIZWlnaHQiLCJnZXRQaW5uZWRPZmZzZXQiLCJhZmZpeCIsImFmZml4VHlwZSIsImZsZXh5X2hlYWRlciIsInB1YiIsIiRoZWFkZXJfc3RhdGljIiwiJGhlYWRlcl9zdGlja3kiLCJ1cGRhdGVfaW50ZXJ2YWwiLCJ0b2xlcmFuY2UiLCJ1cHdhcmQiLCJkb3dud2FyZCIsIl9nZXRfb2Zmc2V0X2Zyb21fZWxlbWVudHNfYm90dG9tIiwiY2xhc3NlcyIsInBpbm5lZCIsInVucGlubmVkIiwid2FzX3Njcm9sbGVkIiwibGFzdF9kaXN0YW5jZV9mcm9tX3RvcCIsInJlZ2lzdGVyRXZlbnRIYW5kbGVycyIsInJlZ2lzdGVyQm9vdEV2ZW50SGFuZGxlcnMiLCJkb2N1bWVudF93YXNfc2Nyb2xsZWQiLCJlbGVtZW50X2hlaWdodCIsIm91dGVySGVpZ2h0IiwiZWxlbWVudF9vZmZzZXQiLCJjdXJyZW50X2Rpc3RhbmNlX2Zyb21fdG9wIiwiZmxleHlfbmF2aWdhdGlvbiIsImxheW91dF9jbGFzc2VzIiwidXBncmFkZSIsIiRuYXZpZ2F0aW9ucyIsIm5hdmlnYXRpb24iLCIkbmF2aWdhdGlvbiIsIiRtZWdhbWVudXMiLCJkcm9wZG93bl9tZWdhbWVudSIsIiRkcm9wZG93bl9tZWdhbWVudSIsImRyb3Bkb3duX2hhc19tZWdhbWVudSIsImlzX3VwZ3JhZGVkIiwibmF2aWdhdGlvbl9oYXNfbWVnYW1lbnUiLCIkbWVnYW1lbnUiLCJoYXNfb2JmdXNjYXRvciIsIm9iZnVzY2F0b3IiLCJiYWJlbEhlbHBlcnMiLCJjbGFzc0NhbGxDaGVjayIsImluc3RhbmNlIiwiVHlwZUVycm9yIiwiY3JlYXRlQ2xhc3MiLCJkZWZpbmVQcm9wZXJ0aWVzIiwiZGVzY3JpcHRvciIsIndyaXRhYmxlIiwicHJvdG9Qcm9wcyIsInN0YXRpY1Byb3BzIiwic2lkclN0YXR1cyIsIm1vdmluZyIsIm9wZW5lZCIsImhlbHBlciIsImlzVXJsIiwic3RyIiwiYWRkUHJlZml4ZXMiLCJhZGRQcmVmaXgiLCJhdHRyaWJ1dGUiLCJ0b1JlcGxhY2UiLCJ0cmFuc2l0aW9ucyIsInN1cHBvcnRlZCIsInByb3BlcnR5IiwicHJlZml4ZXMiLCJjaGFyQXQiLCJzdWJzdHIiLCIkJDIiLCJib2R5QW5pbWF0aW9uQ2xhc3MiLCJvcGVuQWN0aW9uIiwiY2xvc2VBY3Rpb24iLCJ0cmFuc2l0aW9uRW5kRXZlbnQiLCJNZW51Iiwib3BlbkNsYXNzIiwibWVudVdpZHRoIiwib3V0ZXJXaWR0aCIsInNwZWVkIiwic2lkZSIsImRpc3BsYWNlIiwidGltaW5nIiwib25PcGVuQ2FsbGJhY2siLCJvbkNsb3NlQ2FsbGJhY2siLCJvbk9wZW5FbmRDYWxsYmFjayIsIm9uQ2xvc2VFbmRDYWxsYmFjayIsImdldEFuaW1hdGlvbiIsInByZXBhcmVCb2R5IiwiJGh0bWwiLCJvcGVuQm9keSIsImJvZHlBbmltYXRpb24iLCJxdWV1ZSIsIm9uQ2xvc2VCb2R5IiwicmVzZXRTdHlsZXMiLCJ1bmJpbmQiLCJjbG9zZUJvZHkiLCJtb3ZlQm9keSIsIm9uT3Blbk1lbnUiLCJvcGVuTWVudSIsIl90aGlzMiIsIiRpdGVtIiwibWVudUFuaW1hdGlvbiIsIm9uQ2xvc2VNZW51IiwiY2xvc2VNZW51IiwiX3RoaXMzIiwibW92ZU1lbnUiLCJtb3ZlIiwiX3RoaXM0IiwiYWxyZWFkeU9wZW5lZE1lbnUiLCIkJDEiLCJleGVjdXRlIiwic2lkciIsInB1YmxpY01ldGhvZHMiLCJtZXRob2ROYW1lIiwibWV0aG9kcyIsImdldE1ldGhvZCIsIkFycmF5IiwiJCQzIiwiZmlsbENvbnRlbnQiLCIkc2lkZU1lbnUiLCJzZXR0aW5ncyIsIm5ld0NvbnRlbnQiLCJodG1sQ29udGVudCIsInJlbmFtaW5nIiwiJGh0bWxDb250ZW50IiwiZm5TaWRyIiwiYmluZCIsIm9uT3BlbiIsIm9uQ2xvc2UiLCJvbk9wZW5FbmQiLCJvbkNsb3NlRW5kIiwiZmxhZyIsInRvZ2dsZUFsbEJ1dHRvbnMiLCJxdWVyeVNlbGVjdG9yQWxsIiwidG9nZ2xlQnVsbGV0cG9pbnRCdXR0b25zIiwidG9nZ2xlQXR0YWNobWVudHNCdXR0b25zIiwiYWRkQnVsbGV0cG9pbnRCdXR0b25zIiwidG9nZ2xlQWxsQnV0dG9uIiwiaGFuZGxlVG9nZ2xlQWxsIiwiYnVsbGV0cG9pbnRzIiwiZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSIsImN1cnJlbnRTdGF0ZSIsImRhdGFzZXQiLCJidWxsZXRwb2ludCIsImNsYXNzTGlzdCIsImFkZCIsInRvZ2dsZUF0dGFjaG1lbnRCdXR0b24iLCJoYW5kbGVUb2dnbGVBdHRhY2htZW50cyIsImF0dGFjaG1lbnRzIiwiYXR0YWNobWVudCIsInRvZ2dsZUJ1bGxldHBvaW50QnV0dG9uIiwiaGFuZGxlVG9nZ2xlQnVsbGV0cG9pbnQiLCJkZWNyZXRvTm9kZUlkIiwiYWRkQnVsbGV0cG9pbnRCdXR0b24iLCJoYW5kbGVBZGRCdWxsZXRwb2ludCIsInF1ZXJ5U3RyaW5nIiwibG9jYXRpb24iLCJzZWFyY2giLCJ1cmxQYXJhbXMiLCJVUkxTZWFyY2hQYXJhbXMiLCJwYXJhbSIsImdldFVybFBhcmFtcyIsInBhcmFtcyIsInBhcnRzIiwibSIsInNpZGViYXIiLCJ0b2dnbGVzIiwidG9nZ2xlU3RhdGUiLCJsb2NhbFN0b3JhZ2UiLCJnZXRJdGVtIiwic2V0SXRlbSIsIm5vdCJdLCJtYXBwaW5ncyI6Ijs7OztBQUFBLENBQUMsWUFBVztBQUNWLE1BQUlBLFdBQUo7QUFBQSxNQUFpQkMsR0FBakI7QUFBQSxNQUFzQkMsZUFBdEI7QUFBQSxNQUF1Q0MsY0FBdkM7QUFBQSxNQUF1REMsY0FBdkQ7QUFBQSxNQUF1RUMsZUFBdkU7QUFBQSxNQUF3RkMsT0FBeEY7QUFBQSxNQUFpR0MsTUFBakc7QUFBQSxNQUF5R0MsYUFBekc7QUFBQSxNQUF3SEMsSUFBeEg7QUFBQSxNQUE4SEMsZ0JBQTlIO0FBQUEsTUFBZ0pDLFdBQWhKO0FBQUEsTUFBNkpDLE1BQTdKO0FBQUEsTUFBcUtDLG9CQUFySztBQUFBLE1BQTJMQyxpQkFBM0w7QUFBQSxNQUE4TUMsU0FBOU07QUFBQSxNQUF5TkMsWUFBek47QUFBQSxNQUF1T0MsR0FBdk87QUFBQSxNQUE0T0MsZUFBNU87QUFBQSxNQUE2UEMsb0JBQTdQO0FBQUEsTUFBbVJDLGNBQW5SO0FBQUEsTUFBbVNDLE9BQW5TO0FBQUEsTUFBMlNDLFlBQTNTO0FBQUEsTUFBeVRDLFVBQXpUO0FBQUEsTUFBcVVDLFlBQXJVO0FBQUEsTUFBbVZDLGVBQW5WO0FBQUEsTUFBb1dDLFdBQXBXO0FBQUEsTUFBaVhDLElBQWpYO0FBQUEsTUFBdVhDLEdBQXZYO0FBQUEsTUFBNFhDLE9BQTVYO0FBQUEsTUFBcVlDLHFCQUFyWTtBQUFBLE1BQTRaQyxNQUE1WjtBQUFBLE1BQW9hQyxZQUFwYTtBQUFBLE1BQWtiQyxPQUFsYjtBQUFBLE1BQTJiQyxlQUEzYjtBQUFBLE1BQTRjQyxXQUE1YztBQUFBLE1BQXlkQyxNQUF6ZDtBQUFB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RDtBQWtCRCxDQXRFRCIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKSB7XG4gIHZhciBBamF4TW9uaXRvciwgQmFyLCBEb2N1bWVudE1vbml0b3IsIEVsZW1lbnRNb25pdG9yLCBFbGVtZW50VHJhY2tlciwgRXZlbnRMYWdNb25pdG9yLCBFdmVudGVkLCBFdmVudHMsIE5vVGFyZ2V0RXJyb3IsIFBhY2UsIFJlcXVlc3RJbnRlcmNlcHQsIFNPVVJDRV9LRVlTLCBTY2FsZXIsIFNvY2tldFJlcXVlc3RUcmFja2VyLCBYSFJSZXF1ZXN0VHJhY2tlciwgYW5pbWF0aW9uLCBhdmdBbXBsaXR1ZGUsIGJhciwgY2FuY2VsQW5pbWF0aW9uLCBjYW5jZWxBbmltYXRpb25GcmFtZSwgZGVmYXVsdE9wdGlvbnMsIGV4dGVuZCwgZXh0ZW5kTmF0aXZlLCBnZXRGcm9tRE9NLCBnZXRJbnRlcmNlcHQsIGhhbmRsZVB1c2hTdGF0ZSwgaWdub3JlU3RhY2ssIGluaXQsIG5vdywgb3B0aW9ucywgcmVxdWVzdEFuaW1hdGlvbkZyYW1lLCByZXN1bHQsIHJ1bkFuaW1hdGlvbiwgc2NhbGVycywgc2hvdWxkSWdub3JlVVJMLCBzaG91bGRUcmFjaywgc291cmNlLCBzb3VyY2VzLCB1bmlTY2FsZXIsIF9XZWJTb2NrZXQsIF9YRG9tYWluUmVxdWVzdCwgX1hNTEh0dHBSZXF1ZXN0LCBfaSwgX2ludGVyY2VwdCwgX2xlbiwgX3B1c2hTdGF0ZSwgX3JlZiwgX3JlZjEsIF9yZXBsYWNlU3RhdGUsXG4gICAgX19zbGljZSA9IFtdLnNsaWNlLFxuICAgIF9faGFzUHJvcCA9IHt9Lmhhc093blByb3BlcnR5LFxuICAgIF9fZXh0ZW5kcyA9IGZ1bmN0aW9uKGNoaWxkLCBwYXJlbnQpIHsgZm9yICh2YXIga2V5IGluIHBhcmVudCkgeyBpZiAoX19oYXNQcm9wLmNhbGwocGFyZW50LCBrZXkpKSBjaGlsZFtrZXldID0gcGFyZW50W2tleV07IH0gZnVuY3Rpb24gY3RvcigpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGNoaWxkOyB9IGN0b3IucHJvdG90eXBlID0gcGFyZW50LnByb3RvdHlwZTsgY2hpbGQucHJvdG90eXBlID0gbmV3IGN0b3IoKTsgY2hpbGQuX19zdXBlcl9fID0gcGFyZW50LnByb3RvdHlwZTsgcmV0dXJuIGNoaWxkOyB9LFxuICAgIF9faW5kZXhPZiA9IFtdLmluZGV4T2YgfHwgZnVuY3Rpb24oaXRlbSkgeyBmb3IgKHZhciBpID0gMCwgbCA9IHRoaXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7IGlmIChpIGluIHRoaXMgJiYgdGhpc1tpXSA9PT0gaXRlbSkgcmV0dXJuIGk7IH0gcmV0dXJuIC0xOyB9O1xuXG4gIGRlZmF1bHRPcHRpb25zID0ge1xuICAgIGNhdGNodXBUaW1lOiAxMDAsXG4gICAgaW5pdGlhbFJhdGU6IC4wMyxcbiAgICBtaW5UaW1lOiAyNTAsXG4gICAgZ2hvc3RUaW1lOiAxMDAsXG4gICAgbWF4UHJvZ3Jlc3NQZXJGcmFtZTogMjAsXG4gICAgZWFzZUZhY3RvcjogMS4yNSxcbiAgICBzdGFydE9uUGFnZUxvYWQ6IHRydWUsXG4gICAgcmVzdGFydE9uUHVzaFN0YXRlOiB0cnVlLFxuICAgIHJlc3RhcnRPblJlcXVlc3RBZnRlcjogNTAwLFxuICAgIHRhcmdldDogJ2JvZHknLFxuICAgIGVsZW1lbnRzOiB7XG4gICAgICBjaGVja0ludGVydmFsOiAxMDAsXG4gICAgICBzZWxlY3RvcnM6IFsnYm9keSddXG4gICAgfSxcbiAgICBldmVudExhZzoge1xuICAgICAgbWluU2FtcGxlczogMTAsXG4gICAgICBzYW1wbGVDb3VudDogMyxcbiAgICAgIGxhZ1RocmVzaG9sZDogM1xuICAgIH0sXG4gICAgYWpheDoge1xuICAgICAgdHJhY2tNZXRob2RzOiBbJ0dFVCddLFxuICAgICAgdHJhY2tXZWJTb2NrZXRzOiB0cnVlLFxuICAgICAgaWdub3JlVVJMczogW11cbiAgICB9XG4gIH07XG5cbiAgbm93ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIF9yZWY7XG4gICAgcmV0dXJuIChfcmVmID0gdHlwZW9mIHBlcmZvcm1hbmNlICE9PSBcInVuZGVmaW5lZFwiICYmIHBlcmZvcm1hbmNlICE9PSBudWxsID8gdHlwZW9mIHBlcmZvcm1hbmNlLm5vdyA9PT0gXCJmdW5jdGlvblwiID8gcGVyZm9ybWFuY2Uubm93KCkgOiB2b2lkIDAgOiB2b2lkIDApICE9IG51bGwgPyBfcmVmIDogKyhuZXcgRGF0ZSk7XG4gIH07XG5cbiAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cubW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8IHdpbmRvdy53ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgd2luZG93Lm1zUmVxdWVzdEFuaW1hdGlvbkZyYW1lO1xuXG4gIGNhbmNlbEFuaW1hdGlvbkZyYW1lID0gd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lIHx8IHdpbmRvdy5tb3pDYW5jZWxBbmltYXRpb25GcmFtZTtcblxuICBpZiAocmVxdWVzdEFuaW1hdGlvbkZyYW1lID09IG51bGwpIHtcbiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbihmbikge1xuICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZm4sIDUwKTtcbiAgICB9O1xuICAgIGNhbmNlbEFuaW1hdGlvbkZyYW1lID0gZnVuY3Rpb24oaWQpIHtcbiAgICAgIHJldHVybiBjbGVhclRpbWVvdXQoaWQpO1xuICAgIH07XG4gIH1cblxuICBydW5BbmltYXRpb24gPSBmdW5jdGlvbihmbikge1xuICAgIHZhciBsYXN0LCB0aWNrO1xuICAgIGxhc3QgPSBub3coKTtcbiAgICB0aWNrID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgZGlmZjtcbiAgICAgIGRpZmYgPSBub3coKSAtIGxhc3Q7XG4gICAgICBpZiAoZGlmZiA+PSAzMykge1xuICAgICAgICBsYXN0ID0gbm93KCk7XG4gICAgICAgIHJldHVybiBmbihkaWZmLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRpY2spO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KHRpY2ssIDMzIC0gZGlmZik7XG4gICAgICB9XG4gICAgfTtcbiAgICByZXR1cm4gdGljaygpO1xuICB9O1xuXG4gIHJlc3VsdCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBhcmdzLCBrZXksIG9iajtcbiAgICBvYmogPSBhcmd1bWVudHNbMF0sIGtleSA9IGFyZ3VtZW50c1sxXSwgYXJncyA9IDMgPD0gYXJndW1lbnRzLmxlbmd0aCA/IF9fc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpIDogW107XG4gICAgaWYgKHR5cGVvZiBvYmpba2V5XSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuIG9ialtrZXldLmFwcGx5KG9iaiwgYXJncyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBvYmpba2V5XTtcbiAgICB9XG4gIH07XG5cbiAgZXh0ZW5kID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGtleSwgb3V0LCBzb3VyY2UsIHNvdXJjZXMsIHZhbCwgX2ksIF9sZW47XG4gICAgb3V0ID0gYXJndW1lbnRzWzBdLCBzb3VyY2VzID0gMiA8PSBhcmd1bWVudHMubGVuZ3RoID8gX19zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkgOiBbXTtcbiAgICBmb3IgKF9pID0gMCwgX2xlbiA9IHNvdXJjZXMubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgIHNvdXJjZSA9IHNvdXJjZXNbX2ldO1xuICAgICAgaWYgKHNvdXJjZSkge1xuICAgICAgICBmb3IgKGtleSBpbiBzb3VyY2UpIHtcbiAgICAgICAgICBpZiAoIV9faGFzUHJvcC5jYWxsKHNvdXJjZSwga2V5KSkgY29udGludWU7XG4gICAgICAgICAgdmFsID0gc291cmNlW2tleV07XG4gICAgICAgICAgaWYgKChvdXRba2V5XSAhPSBudWxsKSAmJiB0eXBlb2Ygb3V0W2tleV0gPT09ICdvYmplY3QnICYmICh2YWwgIT0gbnVsbCkgJiYgdHlwZW9mIHZhbCA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIGV4dGVuZChvdXRba2V5XSwgdmFsKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb3V0W2tleV0gPSB2YWw7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBvdXQ7XG4gIH07XG5cbiAgYXZnQW1wbGl0dWRlID0gZnVuY3Rpb24oYXJyKSB7XG4gICAgdmFyIGNvdW50LCBzdW0sIHYsIF9pLCBfbGVuO1xuICAgIHN1bSA9IGNvdW50ID0gMDtcbiAgICBmb3IgKF9pID0gMCwgX2xlbiA9IGFyci5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgdiA9IGFycltfaV07XG4gICAgICBzdW0gKz0gTWF0aC5hYnModik7XG4gICAgICBjb3VudCsrO1xuICAgIH1cbiAgICByZXR1cm4gc3VtIC8gY291bnQ7XG4gIH07XG5cbiAgZ2V0RnJvbURPTSA9IGZ1bmN0aW9uKGtleSwganNvbikge1xuICAgIHZhciBkYXRhLCBlLCBlbDtcbiAgICBpZiAoa2V5ID09IG51bGwpIHtcbiAgICAgIGtleSA9ICdvcHRpb25zJztcbiAgICB9XG4gICAgaWYgKGpzb24gPT0gbnVsbCkge1xuICAgICAganNvbiA9IHRydWU7XG4gICAgfVxuICAgIGVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIltkYXRhLXBhY2UtXCIgKyBrZXkgKyBcIl1cIik7XG4gICAgaWYgKCFlbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkYXRhID0gZWwuZ2V0QXR0cmlidXRlKFwiZGF0YS1wYWNlLVwiICsga2V5KTtcbiAgICBpZiAoIWpzb24pIHtcbiAgICAgIHJldHVybiBkYXRhO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgcmV0dXJuIEpTT04ucGFyc2UoZGF0YSk7XG4gICAgfSBjYXRjaCAoX2Vycm9yKSB7XG4gICAgICBlID0gX2Vycm9yO1xuICAgICAgcmV0dXJuIHR5cGVvZiBjb25zb2xlICE9PSBcInVuZGVmaW5lZFwiICYmIGNvbnNvbGUgIT09IG51bGwgPyBjb25zb2xlLmVycm9yKFwiRXJyb3IgcGFyc2luZyBpbmxpbmUgcGFjZSBvcHRpb25zXCIsIGUpIDogdm9pZCAwO1xuICAgIH1cbiAgfTtcblxuICBFdmVudGVkID0gKGZ1bmN0aW9uKCkge1xuICAgIGZ1bmN0aW9uIEV2ZW50ZWQoKSB7fVxuXG4gICAgRXZlbnRlZC5wcm90b3R5cGUub24gPSBmdW5jdGlvbihldmVudCwgaGFuZGxlciwgY3R4LCBvbmNlKSB7XG4gICAgICB2YXIgX2Jhc2U7XG4gICAgICBpZiAob25jZSA9PSBudWxsKSB7XG4gICAgICAgIG9uY2UgPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLmJpbmRpbmdzID09IG51bGwpIHtcbiAgICAgICAgdGhpcy5iaW5kaW5ncyA9IHt9O1xuICAgICAgfVxuICAgICAgaWYgKChfYmFzZSA9IHRoaXMuYmluZGluZ3MpW2V2ZW50XSA9PSBudWxsKSB7XG4gICAgICAgIF9iYXNlW2V2ZW50XSA9IFtdO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuYmluZGluZ3NbZXZlbnRdLnB1c2goe1xuICAgICAgICBoYW5kbGVyOiBoYW5kbGVyLFxuICAgICAgICBjdHg6IGN0eCxcbiAgICAgICAgb25jZTogb25jZVxuICAgICAgfSk7XG4gICAgfTtcblxuICAgIEV2ZW50ZWQucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbihldmVudCwgaGFuZGxlciwgY3R4KSB7XG4gICAgICByZXR1cm4gdGhpcy5vbihldmVudCwgaGFuZGxlciwgY3R4LCB0cnVlKTtcbiAgICB9O1xuXG4gICAgRXZlbnRlZC5wcm90b3R5cGUub2ZmID0gZnVuY3Rpb24oZXZlbnQsIGhhbmRsZXIpIHtcbiAgICAgIHZhciBpLCBfcmVmLCBfcmVzdWx0cztcbiAgICAgIGlmICgoKF9yZWYgPSB0aGlzLmJpbmRpbmdzKSAhPSBudWxsID8gX3JlZltldmVudF0gOiB2b2lkIDApID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKGhhbmRsZXIgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gZGVsZXRlIHRoaXMuYmluZGluZ3NbZXZlbnRdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaSA9IDA7XG4gICAgICAgIF9yZXN1bHRzID0gW107XG4gICAgICAgIHdoaWxlIChpIDwgdGhpcy5iaW5kaW5nc1tldmVudF0ubGVuZ3RoKSB7XG4gICAgICAgICAgaWYgKHRoaXMuYmluZGluZ3NbZXZlbnRdW2ldLmhhbmRsZXIgPT09IGhhbmRsZXIpIHtcbiAgICAgICAgICAgIF9yZXN1bHRzLnB1c2godGhpcy5iaW5kaW5nc1tldmVudF0uc3BsaWNlKGksIDEpKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgX3Jlc3VsdHMucHVzaChpKyspO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gX3Jlc3VsdHM7XG4gICAgICB9XG4gICAgfTtcblxuICAgIEV2ZW50ZWQucHJvdG90eXBlLnRyaWdnZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBhcmdzLCBjdHgsIGV2ZW50LCBoYW5kbGVyLCBpLCBvbmNlLCBfcmVmLCBfcmVmMSwgX3Jlc3VsdHM7XG4gICAgICBldmVudCA9IGFyZ3VtZW50c1swXSwgYXJncyA9IDIgPD0gYXJndW1lbnRzLmxlbmd0aCA/IF9fc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpIDogW107XG4gICAgICBpZiAoKF9yZWYgPSB0aGlzLmJpbmRpbmdzKSAhPSBudWxsID8gX3JlZltldmVudF0gOiB2b2lkIDApIHtcbiAgICAgICAgaSA9IDA7XG4gICAgICAgIF9yZXN1bHRzID0gW107XG4gICAgICAgIHdoaWxlIChpIDwgdGhpcy5iaW5kaW5nc1tldmVudF0ubGVuZ3RoKSB7XG4gICAgICAgICAgX3JlZjEgPSB0aGlzLmJpbmRpbmdzW2V2ZW50XVtpXSwgaGFuZGxlciA9IF9yZWYxLmhhbmRsZXIsIGN0eCA9IF9yZWYxLmN0eCwgb25jZSA9IF9yZWYxLm9uY2U7XG4gICAgICAgICAgaGFuZGxlci5hcHBseShjdHggIT0gbnVsbCA/IGN0eCA6IHRoaXMsIGFyZ3MpO1xuICAgICAgICAgIGlmIChvbmNlKSB7XG4gICAgICAgICAgICBfcmVzdWx0cy5wdXNoKHRoaXMuYmluZGluZ3NbZXZlbnRdLnNwbGljZShpLCAxKSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIF9yZXN1bHRzLnB1c2goaSsrKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIF9yZXN1bHRzO1xuICAgICAgfVxuICAgIH07XG5cbiAgICByZXR1cm4gRXZlbnRlZDtcblxuICB9KSgpO1xuXG4gIFBhY2UgPSB3aW5kb3cuUGFjZSB8fCB7fTtcblxuICB3aW5kb3cuUGFjZSA9IFBhY2U7XG5cbiAgZXh0ZW5kKFBhY2UsIEV2ZW50ZWQucHJvdG90eXBlKTtcblxuICBvcHRpb25zID0gUGFjZS5vcHRpb25zID0gZXh0ZW5kKHt9LCBkZWZhdWx0T3B0aW9ucywgd2luZG93LnBhY2VPcHRpb25zLCBnZXRGcm9tRE9NKCkpO1xuXG4gIF9yZWYgPSBbJ2FqYXgnLCAnZG9jdW1lbnQnLCAnZXZlbnRMYWcnLCAnZWxlbWVudHMnXTtcbiAgZm9yIChfaSA9IDAsIF9sZW4gPSBfcmVmLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgc291cmNlID0gX3JlZltfaV07XG4gICAgaWYgKG9wdGlvbnNbc291cmNlXSA9PT0gdHJ1ZSkge1xuICAgICAgb3B0aW9uc1tzb3VyY2VdID0gZGVmYXVsdE9wdGlvbnNbc291cmNlXTtcbiAgICB9XG4gIH1cblxuICBOb1RhcmdldEVycm9yID0gKGZ1bmN0aW9uKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhOb1RhcmdldEVycm9yLCBfc3VwZXIpO1xuXG4gICAgZnVuY3Rpb24gTm9UYXJnZXRFcnJvcigpIHtcbiAgICAgIF9yZWYxID0gTm9UYXJnZXRFcnJvci5fX3N1cGVyX18uY29uc3RydWN0b3IuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIHJldHVybiBfcmVmMTtcbiAgICB9XG5cbiAgICByZXR1cm4gTm9UYXJnZXRFcnJvcjtcblxuICB9KShFcnJvcik7XG5cbiAgQmFyID0gKGZ1bmN0aW9uKCkge1xuICAgIGZ1bmN0aW9uIEJhcigpIHtcbiAgICAgIHRoaXMucHJvZ3Jlc3MgPSAwO1xuICAgIH1cblxuICAgIEJhci5wcm90b3R5cGUuZ2V0RWxlbWVudCA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHRhcmdldEVsZW1lbnQ7XG4gICAgICBpZiAodGhpcy5lbCA9PSBudWxsKSB7XG4gICAgICAgIHRhcmdldEVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKG9wdGlvbnMudGFyZ2V0KTtcbiAgICAgICAgaWYgKCF0YXJnZXRFbGVtZW50KSB7XG4gICAgICAgICAgdGhyb3cgbmV3IE5vVGFyZ2V0RXJyb3I7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5lbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICB0aGlzLmVsLmNsYXNzTmFtZSA9IFwicGFjZSBwYWNlLWFjdGl2ZVwiO1xuICAgICAgICBkb2N1bWVudC5ib2R5LmNsYXNzTmFtZSA9IGRvY3VtZW50LmJvZHkuY2xhc3NOYW1lLnJlcGxhY2UoL3BhY2UtZG9uZS9nLCAnJyk7XG4gICAgICAgIGRvY3VtZW50LmJvZHkuY2xhc3NOYW1lICs9ICcgcGFjZS1ydW5uaW5nJztcbiAgICAgICAgdGhpcy5lbC5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz1cInBhY2UtcHJvZ3Jlc3NcIj5cXG4gIDxkaXYgY2xhc3M9XCJwYWNlLXByb2dyZXNzLWlubmVyXCI+PC9kaXY+XFxuPC9kaXY+XFxuPGRpdiBjbGFzcz1cInBhY2UtYWN0aXZpdHlcIj48L2Rpdj4nO1xuICAgICAgICBpZiAodGFyZ2V0RWxlbWVudC5maXJzdENoaWxkICE9IG51bGwpIHtcbiAgICAgICAgICB0YXJnZXRFbGVtZW50Lmluc2VydEJlZm9yZSh0aGlzLmVsLCB0YXJnZXRFbGVtZW50LmZpcnN0Q2hpbGQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRhcmdldEVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5lbCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLmVsO1xuICAgIH07XG5cbiAgICBCYXIucHJvdG90eXBlLmZpbmlzaCA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGVsO1xuICAgICAgZWwgPSB0aGlzLmdldEVsZW1lbnQoKTtcbiAgICAgIGVsLmNsYXNzTmFtZSA9IGVsLmNsYXNzTmFtZS5yZXBsYWNlKCdwYWNlLWFjdGl2ZScsICcnKTtcbiAgICAgIGVsLmNsYXNzTmFtZSArPSAnIHBhY2UtaW5hY3RpdmUnO1xuICAgICAgZG9jdW1lbnQuYm9keS5jbGFzc05hbWUgPSBkb2N1bWVudC5ib2R5LmNsYXNzTmFtZS5yZXBsYWNlKCdwYWNlLXJ1bm5pbmcnLCAnJyk7XG4gICAgICByZXR1cm4gZG9jdW1lbnQuYm9keS5jbGFzc05hbWUgKz0gJyBwYWNlLWRvbmUnO1xuICAgIH07XG5cbiAgICBCYXIucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uKHByb2cpIHtcbiAgICAgIHRoaXMucHJvZ3Jlc3MgPSBwcm9nO1xuICAgICAgcmV0dXJuIHRoaXMucmVuZGVyKCk7XG4gICAgfTtcblxuICAgIEJhci5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uKCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgdGhpcy5nZXRFbGVtZW50KCkucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLmdldEVsZW1lbnQoKSk7XG4gICAgICB9IGNhdGNoIChfZXJyb3IpIHtcbiAgICAgICAgTm9UYXJnZXRFcnJvciA9IF9lcnJvcjtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLmVsID0gdm9pZCAwO1xuICAgIH07XG5cbiAgICBCYXIucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGVsLCBrZXksIHByb2dyZXNzU3RyLCB0cmFuc2Zvcm0sIF9qLCBfbGVuMSwgX3JlZjI7XG4gICAgICBpZiAoZG9jdW1lbnQucXVlcnlTZWxlY3RvcihvcHRpb25zLnRhcmdldCkgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBlbCA9IHRoaXMuZ2V0RWxlbWVudCgpO1xuICAgICAgdHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUzZChcIiArIHRoaXMucHJvZ3Jlc3MgKyBcIiUsIDAsIDApXCI7XG4gICAgICBfcmVmMiA9IFsnd2Via2l0VHJhbnNmb3JtJywgJ21zVHJhbnNmb3JtJywgJ3RyYW5zZm9ybSddO1xuICAgICAgZm9yIChfaiA9IDAsIF9sZW4xID0gX3JlZjIubGVuZ3RoOyBfaiA8IF9sZW4xOyBfaisrKSB7XG4gICAgICAgIGtleSA9IF9yZWYyW19qXTtcbiAgICAgICAgZWwuY2hpbGRyZW5bMF0uc3R5bGVba2V5XSA9IHRyYW5zZm9ybTtcbiAgICAgIH1cbiAgICAgIGlmICghdGhpcy5sYXN0UmVuZGVyZWRQcm9ncmVzcyB8fCB0aGlzLmxhc3RSZW5kZXJlZFByb2dyZXNzIHwgMCAhPT0gdGhpcy5wcm9ncmVzcyB8IDApIHtcbiAgICAgICAgZWwuY2hpbGRyZW5bMF0uc2V0QXR0cmlidXRlKCdkYXRhLXByb2dyZXNzLXRleHQnLCBcIlwiICsgKHRoaXMucHJvZ3Jlc3MgfCAwKSArIFwiJVwiKTtcbiAgICAgICAgaWYgKHRoaXMucHJvZ3Jlc3MgPj0gMTAwKSB7XG4gICAgICAgICAgcHJvZ3Jlc3NTdHIgPSAnOTknO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHByb2dyZXNzU3RyID0gdGhpcy5wcm9ncmVzcyA8IDEwID8gXCIwXCIgOiBcIlwiO1xuICAgICAgICAgIHByb2dyZXNzU3RyICs9IHRoaXMucHJvZ3Jlc3MgfCAwO1xuICAgICAgICB9XG4gICAgICAgIGVsLmNoaWxkcmVuWzBdLnNldEF0dHJpYnV0ZSgnZGF0YS1wcm9ncmVzcycsIFwiXCIgKyBwcm9ncmVzc1N0cik7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5sYXN0UmVuZGVyZWRQcm9ncmVzcyA9IHRoaXMucHJvZ3Jlc3M7XG4gICAgfTtcblxuICAgIEJhci5wcm90b3R5cGUuZG9uZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMucHJvZ3Jlc3MgPj0gMTAwO1xuICAgIH07XG5cbiAgICByZXR1cm4gQmFyO1xuXG4gIH0pKCk7XG5cbiAgRXZlbnRzID0gKGZ1bmN0aW9uKCkge1xuICAgIGZ1bmN0aW9uIEV2ZW50cygpIHtcbiAgICAgIHRoaXMuYmluZGluZ3MgPSB7fTtcbiAgICB9XG5cbiAgICBFdmVudHMucHJvdG90eXBlLnRyaWdnZXIgPSBmdW5jdGlvbihuYW1lLCB2YWwpIHtcbiAgICAgIHZhciBiaW5kaW5nLCBfaiwgX2xlbjEsIF9yZWYyLCBfcmVzdWx0cztcbiAgICAgIGlmICh0aGlzLmJpbmRpbmdzW25hbWVdICE9IG51bGwpIHtcbiAgICAgICAgX3JlZjIgPSB0aGlzLmJpbmRpbmdzW25hbWVdO1xuICAgICAgICBfcmVzdWx0cyA9IFtdO1xuICAgICAgICBmb3IgKF9qID0gMCwgX2xlbjEgPSBfcmVmMi5sZW5ndGg7IF9qIDwgX2xlbjE7IF9qKyspIHtcbiAgICAgICAgICBiaW5kaW5nID0gX3JlZjJbX2pdO1xuICAgICAgICAgIF9yZXN1bHRzLnB1c2goYmluZGluZy5jYWxsKHRoaXMsIHZhbCkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBfcmVzdWx0cztcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgRXZlbnRzLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uKG5hbWUsIGZuKSB7XG4gICAgICB2YXIgX2Jhc2U7XG4gICAgICBpZiAoKF9iYXNlID0gdGhpcy5iaW5kaW5ncylbbmFtZV0gPT0gbnVsbCkge1xuICAgICAgICBfYmFzZVtuYW1lXSA9IFtdO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuYmluZGluZ3NbbmFtZV0ucHVzaChmbik7XG4gICAgfTtcblxuICAgIHJldHVybiBFdmVudHM7XG5cbiAgfSkoKTtcblxuICBfWE1MSHR0cFJlcXVlc3QgPSB3aW5kb3cuWE1MSHR0cFJlcXVlc3Q7XG5cbiAgX1hEb21haW5SZXF1ZXN0ID0gd2luZG93LlhEb21haW5SZXF1ZXN0O1xuXG4gIF9XZWJTb2NrZXQgPSB3aW5kb3cuV2ViU29ja2V0O1xuXG4gIGV4dGVuZE5hdGl2ZSA9IGZ1bmN0aW9uKHRvLCBmcm9tKSB7XG4gICAgdmFyIGUsIGtleSwgX3Jlc3VsdHM7XG4gICAgX3Jlc3VsdHMgPSBbXTtcbiAgICBmb3IgKGtleSBpbiBmcm9tLnByb3RvdHlwZSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKCh0b1trZXldID09IG51bGwpICYmIHR5cGVvZiBmcm9tW2tleV0gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICBpZiAodHlwZW9mIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgX3Jlc3VsdHMucHVzaChPYmplY3QuZGVmaW5lUHJvcGVydHkodG8sIGtleSwge1xuICAgICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmcm9tLnByb3RvdHlwZVtrZXldO1xuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWVcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgX3Jlc3VsdHMucHVzaCh0b1trZXldID0gZnJvbS5wcm90b3R5cGVba2V5XSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIF9yZXN1bHRzLnB1c2godm9pZCAwKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoX2Vycm9yKSB7XG4gICAgICAgIGUgPSBfZXJyb3I7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBfcmVzdWx0cztcbiAgfTtcblxuICBpZ25vcmVTdGFjayA9IFtdO1xuXG4gIFBhY2UuaWdub3JlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGFyZ3MsIGZuLCByZXQ7XG4gICAgZm4gPSBhcmd1bWVudHNbMF0sIGFyZ3MgPSAyIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBfX3NsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSA6IFtdO1xuICAgIGlnbm9yZVN0YWNrLnVuc2hpZnQoJ2lnbm9yZScpO1xuICAgIHJldCA9IGZuLmFwcGx5KG51bGwsIGFyZ3MpO1xuICAgIGlnbm9yZVN0YWNrLnNoaWZ0KCk7XG4gICAgcmV0dXJuIHJldDtcbiAgfTtcblxuICBQYWNlLnRyYWNrID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGFyZ3MsIGZuLCByZXQ7XG4gICAgZm4gPSBhcmd1bWVudHNbMF0sIGFyZ3MgPSAyIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBfX3NsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSA6IFtdO1xuICAgIGlnbm9yZVN0YWNrLnVuc2hpZnQoJ3RyYWNrJyk7XG4gICAgcmV0ID0gZm4uYXBwbHkobnVsbCwgYXJncyk7XG4gICAgaWdub3JlU3RhY2suc2hpZnQoKTtcbiAgICByZXR1cm4gcmV0O1xuICB9O1xuXG4gIHNob3VsZFRyYWNrID0gZnVuY3Rpb24obWV0aG9kKSB7XG4gICAgdmFyIF9yZWYyO1xuICAgIGlmIChtZXRob2QgPT0gbnVsbCkge1xuICAgICAgbWV0aG9kID0gJ0dFVCc7XG4gICAgfVxuICAgIGlmIChpZ25vcmVTdGFja1swXSA9PT0gJ3RyYWNrJykge1xuICAgICAgcmV0dXJuICdmb3JjZSc7XG4gICAgfVxuICAgIGlmICghaWdub3JlU3RhY2subGVuZ3RoICYmIG9wdGlvbnMuYWpheCkge1xuICAgICAgaWYgKG1ldGhvZCA9PT0gJ3NvY2tldCcgJiYgb3B0aW9ucy5hamF4LnRyYWNrV2ViU29ja2V0cykge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0gZWxzZSBpZiAoX3JlZjIgPSBtZXRob2QudG9VcHBlckNhc2UoKSwgX19pbmRleE9mLmNhbGwob3B0aW9ucy5hamF4LnRyYWNrTWV0aG9kcywgX3JlZjIpID49IDApIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfTtcblxuICBSZXF1ZXN0SW50ZXJjZXB0ID0gKGZ1bmN0aW9uKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhSZXF1ZXN0SW50ZXJjZXB0LCBfc3VwZXIpO1xuXG4gICAgZnVuY3Rpb24gUmVxdWVzdEludGVyY2VwdCgpIHtcbiAgICAgIHZhciBtb25pdG9yWEhSLFxuICAgICAgICBfdGhpcyA9IHRoaXM7XG4gICAgICBSZXF1ZXN0SW50ZXJjZXB0Ll9fc3VwZXJfXy5jb25zdHJ1Y3Rvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgbW9uaXRvclhIUiA9IGZ1bmN0aW9uKHJlcSkge1xuICAgICAgICB2YXIgX29wZW47XG4gICAgICAgIF9vcGVuID0gcmVxLm9wZW47XG4gICAgICAgIHJldHVybiByZXEub3BlbiA9IGZ1bmN0aW9uKHR5cGUsIHVybCwgYXN5bmMpIHtcbiAgICAgICAgICBpZiAoc2hvdWxkVHJhY2sodHlwZSkpIHtcbiAgICAgICAgICAgIF90aGlzLnRyaWdnZXIoJ3JlcXVlc3QnLCB7XG4gICAgICAgICAgICAgIHR5cGU6IHR5cGUsXG4gICAgICAgICAgICAgIHVybDogdXJsLFxuICAgICAgICAgICAgICByZXF1ZXN0OiByZXFcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gX29wZW4uYXBwbHkocmVxLCBhcmd1bWVudHMpO1xuICAgICAgICB9O1xuICAgICAgfTtcbiAgICAgIHdpbmRvdy5YTUxIdHRwUmVxdWVzdCA9IGZ1bmN0aW9uKGZsYWdzKSB7XG4gICAgICAgIHZhciByZXE7XG4gICAgICAgIHJlcSA9IG5ldyBfWE1MSHR0cFJlcXVlc3QoZmxhZ3MpO1xuICAgICAgICBtb25pdG9yWEhSKHJlcSk7XG4gICAgICAgIHJldHVybiByZXE7XG4gICAgICB9O1xuICAgICAgdHJ5IHtcbiAgICAgICAgZXh0ZW5kTmF0aXZlKHdpbmRvdy5YTUxIdHRwUmVxdWVzdCwgX1hNTEh0dHBSZXF1ZXN0KTtcbiAgICAgIH0gY2F0Y2ggKF9lcnJvcikge31cbiAgICAgIGlmIChfWERvbWFpblJlcXVlc3QgIT0gbnVsbCkge1xuICAgICAgICB3aW5kb3cuWERvbWFpblJlcXVlc3QgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICB2YXIgcmVxO1xuICAgICAgICAgIHJlcSA9IG5ldyBfWERvbWFpblJlcXVlc3Q7XG4gICAgICAgICAgbW9uaXRvclhIUihyZXEpO1xuICAgICAgICAgIHJldHVybiByZXE7XG4gICAgICAgIH07XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgZXh0ZW5kTmF0aXZlKHdpbmRvdy5YRG9tYWluUmVxdWVzdCwgX1hEb21haW5SZXF1ZXN0KTtcbiAgICAgICAgfSBjYXRjaCAoX2Vycm9yKSB7fVxuICAgICAgfVxuICAgICAgaWYgKChfV2ViU29ja2V0ICE9IG51bGwpICYmIG9wdGlvbnMuYWpheC50cmFja1dlYlNvY2tldHMpIHtcbiAgICAgICAgd2luZG93LldlYlNvY2tldCA9IGZ1bmN0aW9uKHVybCwgcHJvdG9jb2xzKSB7XG4gICAgICAgICAgdmFyIHJlcTtcbiAgICAgICAgICBpZiAocHJvdG9jb2xzICE9IG51bGwpIHtcbiAgICAgICAgICAgIHJlcSA9IG5ldyBfV2ViU29ja2V0KHVybCwgcHJvdG9jb2xzKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVxID0gbmV3IF9XZWJTb2NrZXQodXJsKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHNob3VsZFRyYWNrKCdzb2NrZXQnKSkge1xuICAgICAgICAgICAgX3RoaXMudHJpZ2dlcigncmVxdWVzdCcsIHtcbiAgICAgICAgICAgICAgdHlwZTogJ3NvY2tldCcsXG4gICAgICAgICAgICAgIHVybDogdXJsLFxuICAgICAgICAgICAgICBwcm90b2NvbHM6IHByb3RvY29scyxcbiAgICAgICAgICAgICAgcmVxdWVzdDogcmVxXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHJlcTtcbiAgICAgICAgfTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBleHRlbmROYXRpdmUod2luZG93LldlYlNvY2tldCwgX1dlYlNvY2tldCk7XG4gICAgICAgIH0gY2F0Y2ggKF9lcnJvcikge31cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gUmVxdWVzdEludGVyY2VwdDtcblxuICB9KShFdmVudHMpO1xuXG4gIF9pbnRlcmNlcHQgPSBudWxsO1xuXG4gIGdldEludGVyY2VwdCA9IGZ1bmN0aW9uKCkge1xuICAgIGlmIChfaW50ZXJjZXB0ID09IG51bGwpIHtcbiAgICAgIF9pbnRlcmNlcHQgPSBuZXcgUmVxdWVzdEludGVyY2VwdDtcbiAgICB9XG4gICAgcmV0dXJuIF9pbnRlcmNlcHQ7XG4gIH07XG5cbiAgc2hvdWxkSWdub3JlVVJMID0gZnVuY3Rpb24odXJsKSB7XG4gICAgdmFyIHBhdHRlcm4sIF9qLCBfbGVuMSwgX3JlZjI7XG4gICAgX3JlZjIgPSBvcHRpb25zLmFqYXguaWdub3JlVVJMcztcbiAgICBmb3IgKF9qID0gMCwgX2xlbjEgPSBfcmVmMi5sZW5ndGg7IF9qIDwgX2xlbjE7IF9qKyspIHtcbiAgICAgIHBhdHRlcm4gPSBfcmVmMltfal07XG4gICAgICBpZiAodHlwZW9mIHBhdHRlcm4gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGlmICh1cmwuaW5kZXhPZihwYXR0ZXJuKSAhPT0gLTEpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHBhdHRlcm4udGVzdCh1cmwpKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9O1xuXG4gIGdldEludGVyY2VwdCgpLm9uKCdyZXF1ZXN0JywgZnVuY3Rpb24oX2FyZykge1xuICAgIHZhciBhZnRlciwgYXJncywgcmVxdWVzdCwgdHlwZSwgdXJsO1xuICAgIHR5cGUgPSBfYXJnLnR5cGUsIHJlcXVlc3QgPSBfYXJnLnJlcXVlc3QsIHVybCA9IF9hcmcudXJsO1xuICAgIGlmIChzaG91bGRJZ25vcmVVUkwodXJsKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoIVBhY2UucnVubmluZyAmJiAob3B0aW9ucy5yZXN0YXJ0T25SZXF1ZXN0QWZ0ZXIgIT09IGZhbHNlIHx8IHNob3VsZFRyYWNrKHR5cGUpID09PSAnZm9yY2UnKSkge1xuICAgICAgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgIGFmdGVyID0gb3B0aW9ucy5yZXN0YXJ0T25SZXF1ZXN0QWZ0ZXIgfHwgMDtcbiAgICAgIGlmICh0eXBlb2YgYWZ0ZXIgPT09ICdib29sZWFuJykge1xuICAgICAgICBhZnRlciA9IDA7XG4gICAgICB9XG4gICAgICByZXR1cm4gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHN0aWxsQWN0aXZlLCBfaiwgX2xlbjEsIF9yZWYyLCBfcmVmMywgX3Jlc3VsdHM7XG4gICAgICAgIGlmICh0eXBlID09PSAnc29ja2V0Jykge1xuICAgICAgICAgIHN0aWxsQWN0aXZlID0gcmVxdWVzdC5yZWFkeVN0YXRlIDwgMjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdGlsbEFjdGl2ZSA9ICgwIDwgKF9yZWYyID0gcmVxdWVzdC5yZWFkeVN0YXRlKSAmJiBfcmVmMiA8IDQpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzdGlsbEFjdGl2ZSkge1xuICAgICAgICAgIFBhY2UucmVzdGFydCgpO1xuICAgICAgICAgIF9yZWYzID0gUGFjZS5zb3VyY2VzO1xuICAgICAgICAgIF9yZXN1bHRzID0gW107XG4gICAgICAgICAgZm9yIChfaiA9IDAsIF9sZW4xID0gX3JlZjMubGVuZ3RoOyBfaiA8IF9sZW4xOyBfaisrKSB7XG4gICAgICAgICAgICBzb3VyY2UgPSBfcmVmM1tfal07XG4gICAgICAgICAgICBpZiAoc291cmNlIGluc3RhbmNlb2YgQWpheE1vbml0b3IpIHtcbiAgICAgICAgICAgICAgc291cmNlLndhdGNoLmFwcGx5KHNvdXJjZSwgYXJncyk7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgX3Jlc3VsdHMucHVzaCh2b2lkIDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gX3Jlc3VsdHM7XG4gICAgICAgIH1cbiAgICAgIH0sIGFmdGVyKTtcbiAgICB9XG4gIH0pO1xuXG4gIEFqYXhNb25pdG9yID0gKGZ1bmN0aW9uKCkge1xuICAgIGZ1bmN0aW9uIEFqYXhNb25pdG9yKCkge1xuICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgIHRoaXMuZWxlbWVudHMgPSBbXTtcbiAgICAgIGdldEludGVyY2VwdCgpLm9uKCdyZXF1ZXN0JywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBfdGhpcy53YXRjaC5hcHBseShfdGhpcywgYXJndW1lbnRzKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIEFqYXhNb25pdG9yLnByb3RvdHlwZS53YXRjaCA9IGZ1bmN0aW9uKF9hcmcpIHtcbiAgICAgIHZhciByZXF1ZXN0LCB0cmFja2VyLCB0eXBlLCB1cmw7XG4gICAgICB0eXBlID0gX2FyZy50eXBlLCByZXF1ZXN0ID0gX2FyZy5yZXF1ZXN0LCB1cmwgPSBfYXJnLnVybDtcbiAgICAgIGlmIChzaG91bGRJZ25vcmVVUkwodXJsKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAodHlwZSA9PT0gJ3NvY2tldCcpIHtcbiAgICAgICAgdHJhY2tlciA9IG5ldyBTb2NrZXRSZXF1ZXN0VHJhY2tlcihyZXF1ZXN0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRyYWNrZXIgPSBuZXcgWEhSUmVxdWVzdFRyYWNrZXIocmVxdWVzdCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5lbGVtZW50cy5wdXNoKHRyYWNrZXIpO1xuICAgIH07XG5cbiAgICByZXR1cm4gQWpheE1vbml0b3I7XG5cbiAgfSkoKTtcblxuICBYSFJSZXF1ZXN0VHJhY2tlciA9IChmdW5jdGlvbigpIHtcbiAgICBmdW5jdGlvbiBYSFJSZXF1ZXN0VHJhY2tlcihyZXF1ZXN0KSB7XG4gICAgICB2YXIgZXZlbnQsIHNpemUsIF9qLCBfbGVuMSwgX29ucmVhZHlzdGF0ZWNoYW5nZSwgX3JlZjIsXG4gICAgICAgIF90aGlzID0gdGhpcztcbiAgICAgIHRoaXMucHJvZ3Jlc3MgPSAwO1xuICAgICAgaWYgKHdpbmRvdy5Qcm9ncmVzc0V2ZW50ICE9IG51bGwpIHtcbiAgICAgICAgc2l6ZSA9IG51bGw7XG4gICAgICAgIHJlcXVlc3QuYWRkRXZlbnRMaXN0ZW5lcigncHJvZ3Jlc3MnLCBmdW5jdGlvbihldnQpIHtcbiAgICAgICAgICBpZiAoZXZ0Lmxlbmd0aENvbXB1dGFibGUpIHtcbiAgICAgICAgICAgIHJldHVybiBfdGhpcy5wcm9ncmVzcyA9IDEwMCAqIGV2dC5sb2FkZWQgLyBldnQudG90YWw7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBfdGhpcy5wcm9ncmVzcyA9IF90aGlzLnByb2dyZXNzICsgKDEwMCAtIF90aGlzLnByb2dyZXNzKSAvIDI7XG4gICAgICAgICAgfVxuICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgIF9yZWYyID0gWydsb2FkJywgJ2Fib3J0JywgJ3RpbWVvdXQnLCAnZXJyb3InXTtcbiAgICAgICAgZm9yIChfaiA9IDAsIF9sZW4xID0gX3JlZjIubGVuZ3RoOyBfaiA8IF9sZW4xOyBfaisrKSB7XG4gICAgICAgICAgZXZlbnQgPSBfcmVmMltfal07XG4gICAgICAgICAgcmVxdWVzdC5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBfdGhpcy5wcm9ncmVzcyA9IDEwMDtcbiAgICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIF9vbnJlYWR5c3RhdGVjaGFuZ2UgPSByZXF1ZXN0Lm9ucmVhZHlzdGF0ZWNoYW5nZTtcbiAgICAgICAgcmVxdWVzdC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICB2YXIgX3JlZjM7XG4gICAgICAgICAgaWYgKChfcmVmMyA9IHJlcXVlc3QucmVhZHlTdGF0ZSkgPT09IDAgfHwgX3JlZjMgPT09IDQpIHtcbiAgICAgICAgICAgIF90aGlzLnByb2dyZXNzID0gMTAwO1xuICAgICAgICAgIH0gZWxzZSBpZiAocmVxdWVzdC5yZWFkeVN0YXRlID09PSAzKSB7XG4gICAgICAgICAgICBfdGhpcy5wcm9ncmVzcyA9IDUwO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdHlwZW9mIF9vbnJlYWR5c3RhdGVjaGFuZ2UgPT09IFwiZnVuY3Rpb25cIiA/IF9vbnJlYWR5c3RhdGVjaGFuZ2UuYXBwbHkobnVsbCwgYXJndW1lbnRzKSA6IHZvaWQgMDtcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gWEhSUmVxdWVzdFRyYWNrZXI7XG5cbiAgfSkoKTtcblxuICBTb2NrZXRSZXF1ZXN0VHJhY2tlciA9IChmdW5jdGlvbigpIHtcbiAgICBmdW5jdGlvbiBTb2NrZXRSZXF1ZXN0VHJhY2tlcihyZXF1ZXN0KSB7XG4gICAgICB2YXIgZXZlbnQsIF9qLCBfbGVuMSwgX3JlZjIsXG4gICAgICAgIF90aGlzID0gdGhpcztcbiAgICAgIHRoaXMucHJvZ3Jlc3MgPSAwO1xuICAgICAgX3JlZjIgPSBbJ2Vycm9yJywgJ29wZW4nXTtcbiAgICAgIGZvciAoX2ogPSAwLCBfbGVuMSA9IF9yZWYyLmxlbmd0aDsgX2ogPCBfbGVuMTsgX2orKykge1xuICAgICAgICBldmVudCA9IF9yZWYyW19qXTtcbiAgICAgICAgcmVxdWVzdC5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gX3RoaXMucHJvZ3Jlc3MgPSAxMDA7XG4gICAgICAgIH0sIGZhbHNlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gU29ja2V0UmVxdWVzdFRyYWNrZXI7XG5cbiAgfSkoKTtcblxuICBFbGVtZW50TW9uaXRvciA9IChmdW5jdGlvbigpIHtcbiAgICBmdW5jdGlvbiBFbGVtZW50TW9uaXRvcihvcHRpb25zKSB7XG4gICAgICB2YXIgc2VsZWN0b3IsIF9qLCBfbGVuMSwgX3JlZjI7XG4gICAgICBpZiAob3B0aW9ucyA9PSBudWxsKSB7XG4gICAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICAgIH1cbiAgICAgIHRoaXMuZWxlbWVudHMgPSBbXTtcbiAgICAgIGlmIChvcHRpb25zLnNlbGVjdG9ycyA9PSBudWxsKSB7XG4gICAgICAgIG9wdGlvbnMuc2VsZWN0b3JzID0gW107XG4gICAgICB9XG4gICAgICBfcmVmMiA9IG9wdGlvbnMuc2VsZWN0b3JzO1xuICAgICAgZm9yIChfaiA9IDAsIF9sZW4xID0gX3JlZjIubGVuZ3RoOyBfaiA8IF9sZW4xOyBfaisrKSB7XG4gICAgICAgIHNlbGVjdG9yID0gX3JlZjJbX2pdO1xuICAgICAgICB0aGlzLmVsZW1lbnRzLnB1c2gobmV3IEVsZW1lbnRUcmFja2VyKHNlbGVjdG9yKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIEVsZW1lbnRNb25pdG9yO1xuXG4gIH0pKCk7XG5cbiAgRWxlbWVudFRyYWNrZXIgPSAoZnVuY3Rpb24oKSB7XG4gICAgZnVuY3Rpb24gRWxlbWVudFRyYWNrZXIoc2VsZWN0b3IpIHtcbiAgICAgIHRoaXMuc2VsZWN0b3IgPSBzZWxlY3RvcjtcbiAgICAgIHRoaXMucHJvZ3Jlc3MgPSAwO1xuICAgICAgdGhpcy5jaGVjaygpO1xuICAgIH1cblxuICAgIEVsZW1lbnRUcmFja2VyLnByb3RvdHlwZS5jaGVjayA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgIGlmIChkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHRoaXMuc2VsZWN0b3IpKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRvbmUoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KChmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gX3RoaXMuY2hlY2soKTtcbiAgICAgICAgfSksIG9wdGlvbnMuZWxlbWVudHMuY2hlY2tJbnRlcnZhbCk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIEVsZW1lbnRUcmFja2VyLnByb3RvdHlwZS5kb25lID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5wcm9ncmVzcyA9IDEwMDtcbiAgICB9O1xuXG4gICAgcmV0dXJuIEVsZW1lbnRUcmFja2VyO1xuXG4gIH0pKCk7XG5cbiAgRG9jdW1lbnRNb25pdG9yID0gKGZ1bmN0aW9uKCkge1xuICAgIERvY3VtZW50TW9uaXRvci5wcm90b3R5cGUuc3RhdGVzID0ge1xuICAgICAgbG9hZGluZzogMCxcbiAgICAgIGludGVyYWN0aXZlOiA1MCxcbiAgICAgIGNvbXBsZXRlOiAxMDBcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gRG9jdW1lbnRNb25pdG9yKCkge1xuICAgICAgdmFyIF9vbnJlYWR5c3RhdGVjaGFuZ2UsIF9yZWYyLFxuICAgICAgICBfdGhpcyA9IHRoaXM7XG4gICAgICB0aGlzLnByb2dyZXNzID0gKF9yZWYyID0gdGhpcy5zdGF0ZXNbZG9jdW1lbnQucmVhZHlTdGF0ZV0pICE9IG51bGwgPyBfcmVmMiA6IDEwMDtcbiAgICAgIF9vbnJlYWR5c3RhdGVjaGFuZ2UgPSBkb2N1bWVudC5vbnJlYWR5c3RhdGVjaGFuZ2U7XG4gICAgICBkb2N1bWVudC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKF90aGlzLnN0YXRlc1tkb2N1bWVudC5yZWFkeVN0YXRlXSAhPSBudWxsKSB7XG4gICAgICAgICAgX3RoaXMucHJvZ3Jlc3MgPSBfdGhpcy5zdGF0ZXNbZG9jdW1lbnQucmVhZHlTdGF0ZV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHR5cGVvZiBfb25yZWFkeXN0YXRlY2hhbmdlID09PSBcImZ1bmN0aW9uXCIgPyBfb25yZWFkeXN0YXRlY2hhbmdlLmFwcGx5KG51bGwsIGFyZ3VtZW50cykgOiB2b2lkIDA7XG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBEb2N1bWVudE1vbml0b3I7XG5cbiAgfSkoKTtcblxuICBFdmVudExhZ01vbml0b3IgPSAoZnVuY3Rpb24oKSB7XG4gICAgZnVuY3Rpb24gRXZlbnRMYWdNb25pdG9yKCkge1xuICAgICAgdmFyIGF2ZywgaW50ZXJ2YWwsIGxhc3QsIHBvaW50cywgc2FtcGxlcyxcbiAgICAgICAgX3RoaXMgPSB0aGlzO1xuICAgICAgdGhpcy5wcm9ncmVzcyA9IDA7XG4gICAgICBhdmcgPSAwO1xuICAgICAgc2FtcGxlcyA9IFtdO1xuICAgICAgcG9pbnRzID0gMDtcbiAgICAgIGxhc3QgPSBub3coKTtcbiAgICAgIGludGVydmFsID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBkaWZmO1xuICAgICAgICBkaWZmID0gbm93KCkgLSBsYXN0IC0gNTA7XG4gICAgICAgIGxhc3QgPSBub3coKTtcbiAgICAgICAgc2FtcGxlcy5wdXNoKGRpZmYpO1xuICAgICAgICBpZiAoc2FtcGxlcy5sZW5ndGggPiBvcHRpb25zLmV2ZW50TGFnLnNhbXBsZUNvdW50KSB7XG4gICAgICAgICAgc2FtcGxlcy5zaGlmdCgpO1xuICAgICAgICB9XG4gICAgICAgIGF2ZyA9IGF2Z0FtcGxpdHVkZShzYW1wbGVzKTtcbiAgICAgICAgaWYgKCsrcG9pbnRzID49IG9wdGlvbnMuZXZlbnRMYWcubWluU2FtcGxlcyAmJiBhdmcgPCBvcHRpb25zLmV2ZW50TGFnLmxhZ1RocmVzaG9sZCkge1xuICAgICAgICAgIF90aGlzLnByb2dyZXNzID0gMTAwO1xuICAgICAgICAgIHJldHVybiBjbGVhckludGVydmFsKGludGVydmFsKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gX3RoaXMucHJvZ3Jlc3MgPSAxMDAgKiAoMyAvIChhdmcgKyAzKSk7XG4gICAgICAgIH1cbiAgICAgIH0sIDUwKTtcbiAgICB9XG5cbiAgICByZXR1cm4gRXZlbnRMYWdNb25pdG9yO1xuXG4gIH0pKCk7XG5cbiAgU2NhbGVyID0gKGZ1bmN0aW9uKCkge1xuICAgIGZ1bmN0aW9uIFNjYWxlcihzb3VyY2UpIHtcbiAgICAgIHRoaXMuc291cmNlID0gc291cmNlO1xuICAgICAgdGhpcy5sYXN0ID0gdGhpcy5zaW5jZUxhc3RVcGRhdGUgPSAwO1xuICAgICAgdGhpcy5yYXRlID0gb3B0aW9ucy5pbml0aWFsUmF0ZTtcbiAgICAgIHRoaXMuY2F0Y2h1cCA9IDA7XG4gICAgICB0aGlzLnByb2dyZXNzID0gdGhpcy5sYXN0UHJvZ3Jlc3MgPSAwO1xuICAgICAgaWYgKHRoaXMuc291cmNlICE9IG51bGwpIHtcbiAgICAgICAgdGhpcy5wcm9ncmVzcyA9IHJlc3VsdCh0aGlzLnNvdXJjZSwgJ3Byb2dyZXNzJyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgU2NhbGVyLnByb3RvdHlwZS50aWNrID0gZnVuY3Rpb24oZnJhbWVUaW1lLCB2YWwpIHtcbiAgICAgIHZhciBzY2FsaW5nO1xuICAgICAgaWYgKHZhbCA9PSBudWxsKSB7XG4gICAgICAgIHZhbCA9IHJlc3VsdCh0aGlzLnNvdXJjZSwgJ3Byb2dyZXNzJyk7XG4gICAgICB9XG4gICAgICBpZiAodmFsID49IDEwMCkge1xuICAgICAgICB0aGlzLmRvbmUgPSB0cnVlO1xuICAgICAgfVxuICAgICAgaWYgKHZhbCA9PT0gdGhpcy5sYXN0KSB7XG4gICAgICAgIHRoaXMuc2luY2VMYXN0VXBkYXRlICs9IGZyYW1lVGltZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh0aGlzLnNpbmNlTGFzdFVwZGF0ZSkge1xuICAgICAgICAgIHRoaXMucmF0ZSA9ICh2YWwgLSB0aGlzLmxhc3QpIC8gdGhpcy5zaW5jZUxhc3RVcGRhdGU7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jYXRjaHVwID0gKHZhbCAtIHRoaXMucHJvZ3Jlc3MpIC8gb3B0aW9ucy5jYXRjaHVwVGltZTtcbiAgICAgICAgdGhpcy5zaW5jZUxhc3RVcGRhdGUgPSAwO1xuICAgICAgICB0aGlzLmxhc3QgPSB2YWw7XG4gICAgICB9XG4gICAgICBpZiAodmFsID4gdGhpcy5wcm9ncmVzcykge1xuICAgICAgICB0aGlzLnByb2dyZXNzICs9IHRoaXMuY2F0Y2h1cCAqIGZyYW1lVGltZTtcbiAgICAgIH1cbiAgICAgIHNjYWxpbmcgPSAxIC0gTWF0aC5wb3codGhpcy5wcm9ncmVzcyAvIDEwMCwgb3B0aW9ucy5lYXNlRmFjdG9yKTtcbiAgICAgIHRoaXMucHJvZ3Jlc3MgKz0gc2NhbGluZyAqIHRoaXMucmF0ZSAqIGZyYW1lVGltZTtcbiAgICAgIHRoaXMucHJvZ3Jlc3MgPSBNYXRoLm1pbih0aGlzLmxhc3RQcm9ncmVzcyArIG9wdGlvbnMubWF4UHJvZ3Jlc3NQZXJGcmFtZSwgdGhpcy5wcm9ncmVzcyk7XG4gICAgICB0aGlzLnByb2dyZXNzID0gTWF0aC5tYXgoMCwgdGhpcy5wcm9ncmVzcyk7XG4gICAgICB0aGlzLnByb2dyZXNzID0gTWF0aC5taW4oMTAwLCB0aGlzLnByb2dyZXNzKTtcbiAgICAgIHRoaXMubGFzdFByb2dyZXNzID0gdGhpcy5wcm9ncmVzcztcbiAgICAgIHJldHVybiB0aGlzLnByb2dyZXNzO1xuICAgIH07XG5cbiAgICByZXR1cm4gU2NhbGVyO1xuXG4gIH0pKCk7XG5cbiAgc291cmNlcyA9IG51bGw7XG5cbiAgc2NhbGVycyA9IG51bGw7XG5cbiAgYmFyID0gbnVsbDtcblxuICB1bmlTY2FsZXIgPSBudWxsO1xuXG4gIGFuaW1hdGlvbiA9IG51bGw7XG5cbiAgY2FuY2VsQW5pbWF0aW9uID0gbnVsbDtcblxuICBQYWNlLnJ1bm5pbmcgPSBmYWxzZTtcblxuICBoYW5kbGVQdXNoU3RhdGUgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAob3B0aW9ucy5yZXN0YXJ0T25QdXNoU3RhdGUpIHtcbiAgICAgIHJldHVybiBQYWNlLnJlc3RhcnQoKTtcbiAgICB9XG4gIH07XG5cbiAgaWYgKHdpbmRvdy5oaXN0b3J5LnB1c2hTdGF0ZSAhPSBudWxsKSB7XG4gICAgX3B1c2hTdGF0ZSA9IHdpbmRvdy5oaXN0b3J5LnB1c2hTdGF0ZTtcbiAgICB3aW5kb3cuaGlzdG9yeS5wdXNoU3RhdGUgPSBmdW5jdGlvbigpIHtcbiAgICAgIGhhbmRsZVB1c2hTdGF0ZSgpO1xuICAgICAgcmV0dXJuIF9wdXNoU3RhdGUuYXBwbHkod2luZG93Lmhpc3RvcnksIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgfVxuXG4gIGlmICh3aW5kb3cuaGlzdG9yeS5yZXBsYWNlU3RhdGUgIT0gbnVsbCkge1xuICAgIF9yZXBsYWNlU3RhdGUgPSB3aW5kb3cuaGlzdG9yeS5yZXBsYWNlU3RhdGU7XG4gICAgd2luZG93Lmhpc3RvcnkucmVwbGFjZVN0YXRlID0gZnVuY3Rpb24oKSB7XG4gICAgICBoYW5kbGVQdXNoU3RhdGUoKTtcbiAgICAgIHJldHVybiBfcmVwbGFjZVN0YXRlLmFwcGx5KHdpbmRvdy5oaXN0b3J5LCBhcmd1bWVudHMpO1xuICAgIH07XG4gIH1cblxuICBTT1VSQ0VfS0VZUyA9IHtcbiAgICBhamF4OiBBamF4TW9uaXRvcixcbiAgICBlbGVtZW50czogRWxlbWVudE1vbml0b3IsXG4gICAgZG9jdW1lbnQ6IERvY3VtZW50TW9uaXRvcixcbiAgICBldmVudExhZzogRXZlbnRMYWdNb25pdG9yXG4gIH07XG5cbiAgKGluaXQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdHlwZSwgX2osIF9rLCBfbGVuMSwgX2xlbjIsIF9yZWYyLCBfcmVmMywgX3JlZjQ7XG4gICAgUGFjZS5zb3VyY2VzID0gc291cmNlcyA9IFtdO1xuICAgIF9yZWYyID0gWydhamF4JywgJ2VsZW1lbnRzJywgJ2RvY3VtZW50JywgJ2V2ZW50TGFnJ107XG4gICAgZm9yIChfaiA9IDAsIF9sZW4xID0gX3JlZjIubGVuZ3RoOyBfaiA8IF9sZW4xOyBfaisrKSB7XG4gICAgICB0eXBlID0gX3JlZjJbX2pdO1xuICAgICAgaWYgKG9wdGlvbnNbdHlwZV0gIT09IGZhbHNlKSB7XG4gICAgICAgIHNvdXJjZXMucHVzaChuZXcgU09VUkNFX0tFWVNbdHlwZV0ob3B0aW9uc1t0eXBlXSkpO1xuICAgICAgfVxuICAgIH1cbiAgICBfcmVmNCA9IChfcmVmMyA9IG9wdGlvbnMuZXh0cmFTb3VyY2VzKSAhPSBudWxsID8gX3JlZjMgOiBbXTtcbiAgICBmb3IgKF9rID0gMCwgX2xlbjIgPSBfcmVmNC5sZW5ndGg7IF9rIDwgX2xlbjI7IF9rKyspIHtcbiAgICAgIHNvdXJjZSA9IF9yZWY0W19rXTtcbiAgICAgIHNvdXJjZXMucHVzaChuZXcgc291cmNlKG9wdGlvbnMpKTtcbiAgICB9XG4gICAgUGFjZS5iYXIgPSBiYXIgPSBuZXcgQmFyO1xuICAgIHNjYWxlcnMgPSBbXTtcbiAgICByZXR1cm4gdW5pU2NhbGVyID0gbmV3IFNjYWxlcjtcbiAgfSkoKTtcblxuICBQYWNlLnN0b3AgPSBmdW5jdGlvbigpIHtcbiAgICBQYWNlLnRyaWdnZXIoJ3N0b3AnKTtcbiAgICBQYWNlLnJ1bm5pbmcgPSBmYWxzZTtcbiAgICBiYXIuZGVzdHJveSgpO1xuICAgIGNhbmNlbEFuaW1hdGlvbiA9IHRydWU7XG4gICAgaWYgKGFuaW1hdGlvbiAhPSBudWxsKSB7XG4gICAgICBpZiAodHlwZW9mIGNhbmNlbEFuaW1hdGlvbkZyYW1lID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgY2FuY2VsQW5pbWF0aW9uRnJhbWUoYW5pbWF0aW9uKTtcbiAgICAgIH1cbiAgICAgIGFuaW1hdGlvbiA9IG51bGw7XG4gICAgfVxuICAgIHJldHVybiBpbml0KCk7XG4gIH07XG5cbiAgUGFjZS5yZXN0YXJ0ID0gZnVuY3Rpb24oKSB7XG4gICAgUGFjZS50cmlnZ2VyKCdyZXN0YXJ0Jyk7XG4gICAgUGFjZS5zdG9wKCk7XG4gICAgcmV0dXJuIFBhY2Uuc3RhcnQoKTtcbiAgfTtcblxuICBQYWNlLmdvID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHN0YXJ0O1xuICAgIFBhY2UucnVubmluZyA9IHRydWU7XG4gICAgYmFyLnJlbmRlcigpO1xuICAgIHN0YXJ0ID0gbm93KCk7XG4gICAgY2FuY2VsQW5pbWF0aW9uID0gZmFsc2U7XG4gICAgcmV0dXJuIGFuaW1hdGlvbiA9IHJ1bkFuaW1hdGlvbihmdW5jdGlvbihmcmFtZVRpbWUsIGVucXVldWVOZXh0RnJhbWUpIHtcbiAgICAgIHZhciBhdmcsIGNvdW50LCBkb25lLCBlbGVtZW50LCBlbGVtZW50cywgaSwgaiwgcmVtYWluaW5nLCBzY2FsZXIsIHNjYWxlckxpc3QsIHN1bSwgX2osIF9rLCBfbGVuMSwgX2xlbjIsIF9yZWYyO1xuICAgICAgcmVtYWluaW5nID0gMTAwIC0gYmFyLnByb2dyZXNzO1xuICAgICAgY291bnQgPSBzdW0gPSAwO1xuICAgICAgZG9uZSA9IHRydWU7XG4gICAgICBmb3IgKGkgPSBfaiA9IDAsIF9sZW4xID0gc291cmNlcy5sZW5ndGg7IF9qIDwgX2xlbjE7IGkgPSArK19qKSB7XG4gICAgICAgIHNvdXJjZSA9IHNvdXJjZXNbaV07XG4gICAgICAgIHNjYWxlckxpc3QgPSBzY2FsZXJzW2ldICE9IG51bGwgPyBzY2FsZXJzW2ldIDogc2NhbGVyc1tpXSA9IFtdO1xuICAgICAgICBlbGVtZW50cyA9IChfcmVmMiA9IHNvdXJjZS5lbGVtZW50cykgIT0gbnVsbCA/IF9yZWYyIDogW3NvdXJjZV07XG4gICAgICAgIGZvciAoaiA9IF9rID0gMCwgX2xlbjIgPSBlbGVtZW50cy5sZW5ndGg7IF9rIDwgX2xlbjI7IGogPSArK19rKSB7XG4gICAgICAgICAgZWxlbWVudCA9IGVsZW1lbnRzW2pdO1xuICAgICAgICAgIHNjYWxlciA9IHNjYWxlckxpc3Rbal0gIT0gbnVsbCA/IHNjYWxlckxpc3Rbal0gOiBzY2FsZXJMaXN0W2pdID0gbmV3IFNjYWxlcihlbGVtZW50KTtcbiAgICAgICAgICBkb25lICY9IHNjYWxlci5kb25lO1xuICAgICAgICAgIGlmIChzY2FsZXIuZG9uZSkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvdW50Kys7XG4gICAgICAgICAgc3VtICs9IHNjYWxlci50aWNrKGZyYW1lVGltZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGF2ZyA9IHN1bSAvIGNvdW50O1xuICAgICAgYmFyLnVwZGF0ZSh1bmlTY2FsZXIudGljayhmcmFtZVRpbWUsIGF2ZykpO1xuICAgICAgaWYgKGJhci5kb25lKCkgfHwgZG9uZSB8fCBjYW5jZWxBbmltYXRpb24pIHtcbiAgICAgICAgYmFyLnVwZGF0ZSgxMDApO1xuICAgICAgICBQYWNlLnRyaWdnZXIoJ2RvbmUnKTtcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgYmFyLmZpbmlzaCgpO1xuICAgICAgICAgIFBhY2UucnVubmluZyA9IGZhbHNlO1xuICAgICAgICAgIHJldHVybiBQYWNlLnRyaWdnZXIoJ2hpZGUnKTtcbiAgICAgICAgfSwgTWF0aC5tYXgob3B0aW9ucy5naG9zdFRpbWUsIE1hdGgubWF4KG9wdGlvbnMubWluVGltZSAtIChub3coKSAtIHN0YXJ0KSwgMCkpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBlbnF1ZXVlTmV4dEZyYW1lKCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH07XG5cbiAgUGFjZS5zdGFydCA9IGZ1bmN0aW9uKF9vcHRpb25zKSB7XG4gICAgZXh0ZW5kKG9wdGlvbnMsIF9vcHRpb25zKTtcbiAgICBQYWNlLnJ1bm5pbmcgPSB0cnVlO1xuICAgIHRyeSB7XG4gICAgICBiYXIucmVuZGVyKCk7XG4gICAgfSBjYXRjaCAoX2Vycm9yKSB7XG4gICAgICBOb1RhcmdldEVycm9yID0gX2Vycm9yO1xuICAgIH1cbiAgICBpZiAoIWRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5wYWNlJykpIHtcbiAgICAgIHJldHVybiBzZXRUaW1lb3V0KFBhY2Uuc3RhcnQsIDUwKTtcbiAgICB9IGVsc2Uge1xuICAgICAgUGFjZS50cmlnZ2VyKCdzdGFydCcpO1xuICAgICAgcmV0dXJuIFBhY2UuZ28oKTtcbiAgICB9XG4gIH07XG5cbiAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgIGRlZmluZShbJ3BhY2UnXSwgZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gUGFjZTtcbiAgICB9KTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IFBhY2U7XG4gIH0gZWxzZSB7XG4gICAgaWYgKG9wdGlvbnMuc3RhcnRPblBhZ2VMb2FkKSB7XG4gICAgICBQYWNlLnN0YXJ0KCk7XG4gICAgfVxuICB9XG5cbn0pLmNhbGwodGhpcyk7XG4iLCIvKiFcbiAqIEJvb3RzdHJhcCB2My40LjEgKGh0dHBzOi8vZ2V0Ym9vdHN0cmFwLmNvbS8pXG4gKiBDb3B5cmlnaHQgMjAxMS0yMDE5IFR3aXR0ZXIsIEluYy5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZVxuICovXG5cbmlmICh0eXBlb2YgalF1ZXJ5ID09PSAndW5kZWZpbmVkJykge1xuICB0aHJvdyBuZXcgRXJyb3IoJ0Jvb3RzdHJhcFxcJ3MgSmF2YVNjcmlwdCByZXF1aXJlcyBqUXVlcnknKVxufVxuXG4rZnVuY3Rpb24gKCQpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuICB2YXIgdmVyc2lvbiA9ICQuZm4uanF1ZXJ5LnNwbGl0KCcgJylbMF0uc3BsaXQoJy4nKVxuICBpZiAoKHZlcnNpb25bMF0gPCAyICYmIHZlcnNpb25bMV0gPCA5KSB8fCAodmVyc2lvblswXSA9PSAxICYmIHZlcnNpb25bMV0gPT0gOSAmJiB2ZXJzaW9uWzJdIDwgMSkgfHwgKHZlcnNpb25bMF0gPiAzKSkge1xuICAgIHRocm93IG5ldyBFcnJvcignQm9vdHN0cmFwXFwncyBKYXZhU2NyaXB0IHJlcXVpcmVzIGpRdWVyeSB2ZXJzaW9uIDEuOS4xIG9yIGhpZ2hlciwgYnV0IGxvd2VyIHRoYW4gdmVyc2lvbiA0JylcbiAgfVxufShqUXVlcnkpO1xuXG4vKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIEJvb3RzdHJhcDogdHJhbnNpdGlvbi5qcyB2My40LjFcbiAqIGh0dHBzOi8vZ2V0Ym9vdHN0cmFwLmNvbS9kb2NzLzMuNC9qYXZhc2NyaXB0LyN0cmFuc2l0aW9uc1xuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBDb3B5cmlnaHQgMjAxMS0yMDE5IFR3aXR0ZXIsIEluYy5cbiAqIExpY2Vuc2VkIHVuZGVyIE1JVCAoaHR0cHM6Ly9naXRodWIuY29tL3R3YnMvYm9vdHN0cmFwL2Jsb2IvbWFzdGVyL0xJQ0VOU0UpXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi9cblxuXG4rZnVuY3Rpb24gKCQpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIC8vIENTUyBUUkFOU0lUSU9OIFNVUFBPUlQgKFNob3V0b3V0OiBodHRwczovL21vZGVybml6ci5jb20vKVxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICBmdW5jdGlvbiB0cmFuc2l0aW9uRW5kKCkge1xuICAgIHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2Jvb3RzdHJhcCcpXG5cbiAgICB2YXIgdHJhbnNFbmRFdmVudE5hbWVzID0ge1xuICAgICAgV2Via2l0VHJhbnNpdGlvbiA6ICd3ZWJraXRUcmFuc2l0aW9uRW5kJyxcbiAgICAgIE1velRyYW5zaXRpb24gICAgOiAndHJhbnNpdGlvbmVuZCcsXG4gICAgICBPVHJhbnNpdGlvbiAgICAgIDogJ29UcmFuc2l0aW9uRW5kIG90cmFuc2l0aW9uZW5kJyxcbiAgICAgIHRyYW5zaXRpb24gICAgICAgOiAndHJhbnNpdGlvbmVuZCdcbiAgICB9XG5cbiAgICBmb3IgKHZhciBuYW1lIGluIHRyYW5zRW5kRXZlbnROYW1lcykge1xuICAgICAgaWYgKGVsLnN0eWxlW25hbWVdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHsgZW5kOiB0cmFuc0VuZEV2ZW50TmFtZXNbbmFtZV0gfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBmYWxzZSAvLyBleHBsaWNpdCBmb3IgaWU4ICggIC5fLilcbiAgfVxuXG4gIC8vIGh0dHBzOi8vYmxvZy5hbGV4bWFjY2F3LmNvbS9jc3MtdHJhbnNpdGlvbnNcbiAgJC5mbi5lbXVsYXRlVHJhbnNpdGlvbkVuZCA9IGZ1bmN0aW9uIChkdXJhdGlvbikge1xuICAgIHZhciBjYWxsZWQgPSBmYWxzZVxuICAgIHZhciAkZWwgPSB0aGlzXG4gICAgJCh0aGlzKS5vbmUoJ2JzVHJhbnNpdGlvbkVuZCcsIGZ1bmN0aW9uICgpIHsgY2FsbGVkID0gdHJ1ZSB9KVxuICAgIHZhciBjYWxsYmFjayA9IGZ1bmN0aW9uICgpIHsgaWYgKCFjYWxsZWQpICQoJGVsKS50cmlnZ2VyKCQuc3VwcG9ydC50cmFuc2l0aW9uLmVuZCkgfVxuICAgIHNldFRpbWVvdXQoY2FsbGJhY2ssIGR1cmF0aW9uKVxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICAkKGZ1bmN0aW9uICgpIHtcbiAgICAkLnN1cHBvcnQudHJhbnNpdGlvbiA9IHRyYW5zaXRpb25FbmQoKVxuXG4gICAgaWYgKCEkLnN1cHBvcnQudHJhbnNpdGlvbikgcmV0dXJuXG5cbiAgICAkLmV2ZW50LnNwZWNpYWwuYnNUcmFuc2l0aW9uRW5kID0ge1xuICAgICAgYmluZFR5cGU6ICQuc3VwcG9ydC50cmFuc2l0aW9uLmVuZCxcbiAgICAgIGRlbGVnYXRlVHlwZTogJC5zdXBwb3J0LnRyYW5zaXRpb24uZW5kLFxuICAgICAgaGFuZGxlOiBmdW5jdGlvbiAoZSkge1xuICAgICAgICBpZiAoJChlLnRhcmdldCkuaXModGhpcykpIHJldHVybiBlLmhhbmRsZU9iai5oYW5kbGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICAgIH1cbiAgICB9XG4gIH0pXG5cbn0oalF1ZXJ5KTtcblxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBCb290c3RyYXA6IGFsZXJ0LmpzIHYzLjQuMVxuICogaHR0cHM6Ly9nZXRib290c3RyYXAuY29tL2RvY3MvMy40L2phdmFzY3JpcHQvI2FsZXJ0c1xuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBDb3B5cmlnaHQgMjAxMS0yMDE5IFR3aXR0ZXIsIEluYy5cbiAqIExpY2Vuc2VkIHVuZGVyIE1JVCAoaHR0cHM6Ly9naXRodWIuY29tL3R3YnMvYm9vdHN0cmFwL2Jsb2IvbWFzdGVyL0xJQ0VOU0UpXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi9cblxuXG4rZnVuY3Rpb24gKCQpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIC8vIEFMRVJUIENMQVNTIERFRklOSVRJT05cbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PVxuXG4gIHZhciBkaXNtaXNzID0gJ1tkYXRhLWRpc21pc3M9XCJhbGVydFwiXSdcbiAgdmFyIEFsZXJ0ICAgPSBmdW5jdGlvbiAoZWwpIHtcbiAgICAkKGVsKS5vbignY2xpY2snLCBkaXNtaXNzLCB0aGlzLmNsb3NlKVxuICB9XG5cbiAgQWxlcnQuVkVSU0lPTiA9ICczLjQuMSdcblxuICBBbGVydC5UUkFOU0lUSU9OX0RVUkFUSU9OID0gMTUwXG5cbiAgQWxlcnQucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24gKGUpIHtcbiAgICB2YXIgJHRoaXMgICAgPSAkKHRoaXMpXG4gICAgdmFyIHNlbGVjdG9yID0gJHRoaXMuYXR0cignZGF0YS10YXJnZXQnKVxuXG4gICAgaWYgKCFzZWxlY3Rvcikge1xuICAgICAgc2VsZWN0b3IgPSAkdGhpcy5hdHRyKCdocmVmJylcbiAgICAgIHNlbGVjdG9yID0gc2VsZWN0b3IgJiYgc2VsZWN0b3IucmVwbGFjZSgvLiooPz0jW15cXHNdKiQpLywgJycpIC8vIHN0cmlwIGZvciBpZTdcbiAgICB9XG5cbiAgICBzZWxlY3RvciAgICA9IHNlbGVjdG9yID09PSAnIycgPyBbXSA6IHNlbGVjdG9yXG4gICAgdmFyICRwYXJlbnQgPSAkKGRvY3VtZW50KS5maW5kKHNlbGVjdG9yKVxuXG4gICAgaWYgKGUpIGUucHJldmVudERlZmF1bHQoKVxuXG4gICAgaWYgKCEkcGFyZW50Lmxlbmd0aCkge1xuICAgICAgJHBhcmVudCA9ICR0aGlzLmNsb3Nlc3QoJy5hbGVydCcpXG4gICAgfVxuXG4gICAgJHBhcmVudC50cmlnZ2VyKGUgPSAkLkV2ZW50KCdjbG9zZS5icy5hbGVydCcpKVxuXG4gICAgaWYgKGUuaXNEZWZhdWx0UHJldmVudGVkKCkpIHJldHVyblxuXG4gICAgJHBhcmVudC5yZW1vdmVDbGFzcygnaW4nKVxuXG4gICAgZnVuY3Rpb24gcmVtb3ZlRWxlbWVudCgpIHtcbiAgICAgIC8vIGRldGFjaCBmcm9tIHBhcmVudCwgZmlyZSBldmVudCB0aGVuIGNsZWFuIHVwIGRhdGFcbiAgICAgICRwYXJlbnQuZGV0YWNoKCkudHJpZ2dlcignY2xvc2VkLmJzLmFsZXJ0JykucmVtb3ZlKClcbiAgICB9XG5cbiAgICAkLnN1cHBvcnQudHJhbnNpdGlvbiAmJiAkcGFyZW50Lmhhc0NsYXNzKCdmYWRlJykgP1xuICAgICAgJHBhcmVudFxuICAgICAgICAub25lKCdic1RyYW5zaXRpb25FbmQnLCByZW1vdmVFbGVtZW50KVxuICAgICAgICAuZW11bGF0ZVRyYW5zaXRpb25FbmQoQWxlcnQuVFJBTlNJVElPTl9EVVJBVElPTikgOlxuICAgICAgcmVtb3ZlRWxlbWVudCgpXG4gIH1cblxuXG4gIC8vIEFMRVJUIFBMVUdJTiBERUZJTklUSU9OXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgZnVuY3Rpb24gUGx1Z2luKG9wdGlvbikge1xuICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgdmFyICR0aGlzID0gJCh0aGlzKVxuICAgICAgdmFyIGRhdGEgID0gJHRoaXMuZGF0YSgnYnMuYWxlcnQnKVxuXG4gICAgICBpZiAoIWRhdGEpICR0aGlzLmRhdGEoJ2JzLmFsZXJ0JywgKGRhdGEgPSBuZXcgQWxlcnQodGhpcykpKVxuICAgICAgaWYgKHR5cGVvZiBvcHRpb24gPT0gJ3N0cmluZycpIGRhdGFbb3B0aW9uXS5jYWxsKCR0aGlzKVxuICAgIH0pXG4gIH1cblxuICB2YXIgb2xkID0gJC5mbi5hbGVydFxuXG4gICQuZm4uYWxlcnQgICAgICAgICAgICAgPSBQbHVnaW5cbiAgJC5mbi5hbGVydC5Db25zdHJ1Y3RvciA9IEFsZXJ0XG5cblxuICAvLyBBTEVSVCBOTyBDT05GTElDVFxuICAvLyA9PT09PT09PT09PT09PT09PVxuXG4gICQuZm4uYWxlcnQubm9Db25mbGljdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAkLmZuLmFsZXJ0ID0gb2xkXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG5cbiAgLy8gQUxFUlQgREFUQS1BUElcbiAgLy8gPT09PT09PT09PT09PT1cblxuICAkKGRvY3VtZW50KS5vbignY2xpY2suYnMuYWxlcnQuZGF0YS1hcGknLCBkaXNtaXNzLCBBbGVydC5wcm90b3R5cGUuY2xvc2UpXG5cbn0oalF1ZXJ5KTtcblxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBCb290c3RyYXA6IGJ1dHRvbi5qcyB2My40LjFcbiAqIGh0dHBzOi8vZ2V0Ym9vdHN0cmFwLmNvbS9kb2NzLzMuNC9qYXZhc2NyaXB0LyNidXR0b25zXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIENvcHlyaWdodCAyMDExLTIwMTkgVHdpdHRlciwgSW5jLlxuICogTGljZW5zZWQgdW5kZXIgTUlUIChodHRwczovL2dpdGh1Yi5jb20vdHdicy9ib290c3RyYXAvYmxvYi9tYXN0ZXIvTElDRU5TRSlcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqL1xuXG5cbitmdW5jdGlvbiAoJCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgLy8gQlVUVE9OIFBVQkxJQyBDTEFTUyBERUZJTklUSU9OXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gIHZhciBCdXR0b24gPSBmdW5jdGlvbiAoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIHRoaXMuJGVsZW1lbnQgID0gJChlbGVtZW50KVxuICAgIHRoaXMub3B0aW9ucyAgID0gJC5leHRlbmQoe30sIEJ1dHRvbi5ERUZBVUxUUywgb3B0aW9ucylcbiAgICB0aGlzLmlzTG9hZGluZyA9IGZhbHNlXG4gIH1cblxuICBCdXR0b24uVkVSU0lPTiAgPSAnMy40LjEnXG5cbiAgQnV0dG9uLkRFRkFVTFRTID0ge1xuICAgIGxvYWRpbmdUZXh0OiAnbG9hZGluZy4uLidcbiAgfVxuXG4gIEJ1dHRvbi5wcm90b3R5cGUuc2V0U3RhdGUgPSBmdW5jdGlvbiAoc3RhdGUpIHtcbiAgICB2YXIgZCAgICA9ICdkaXNhYmxlZCdcbiAgICB2YXIgJGVsICA9IHRoaXMuJGVsZW1lbnRcbiAgICB2YXIgdmFsICA9ICRlbC5pcygnaW5wdXQnKSA/ICd2YWwnIDogJ2h0bWwnXG4gICAgdmFyIGRhdGEgPSAkZWwuZGF0YSgpXG5cbiAgICBzdGF0ZSArPSAnVGV4dCdcblxuICAgIGlmIChkYXRhLnJlc2V0VGV4dCA9PSBudWxsKSAkZWwuZGF0YSgncmVzZXRUZXh0JywgJGVsW3ZhbF0oKSlcblxuICAgIC8vIHB1c2ggdG8gZXZlbnQgbG9vcCB0byBhbGxvdyBmb3JtcyB0byBzdWJtaXRcbiAgICBzZXRUaW1lb3V0KCQucHJveHkoZnVuY3Rpb24gKCkge1xuICAgICAgJGVsW3ZhbF0oZGF0YVtzdGF0ZV0gPT0gbnVsbCA/IHRoaXMub3B0aW9uc1tzdGF0ZV0gOiBkYXRhW3N0YXRlXSlcblxuICAgICAgaWYgKHN0YXRlID09ICdsb2FkaW5nVGV4dCcpIHtcbiAgICAgICAgdGhpcy5pc0xvYWRpbmcgPSB0cnVlXG4gICAgICAgICRlbC5hZGRDbGFzcyhkKS5hdHRyKGQsIGQpLnByb3AoZCwgdHJ1ZSlcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5pc0xvYWRpbmcpIHtcbiAgICAgICAgdGhpcy5pc0xvYWRpbmcgPSBmYWxzZVxuICAgICAgICAkZWwucmVtb3ZlQ2xhc3MoZCkucmVtb3ZlQXR0cihkKS5wcm9wKGQsIGZhbHNlKVxuICAgICAgfVxuICAgIH0sIHRoaXMpLCAwKVxuICB9XG5cbiAgQnV0dG9uLnByb3RvdHlwZS50b2dnbGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNoYW5nZWQgPSB0cnVlXG4gICAgdmFyICRwYXJlbnQgPSB0aGlzLiRlbGVtZW50LmNsb3Nlc3QoJ1tkYXRhLXRvZ2dsZT1cImJ1dHRvbnNcIl0nKVxuXG4gICAgaWYgKCRwYXJlbnQubGVuZ3RoKSB7XG4gICAgICB2YXIgJGlucHV0ID0gdGhpcy4kZWxlbWVudC5maW5kKCdpbnB1dCcpXG4gICAgICBpZiAoJGlucHV0LnByb3AoJ3R5cGUnKSA9PSAncmFkaW8nKSB7XG4gICAgICAgIGlmICgkaW5wdXQucHJvcCgnY2hlY2tlZCcpKSBjaGFuZ2VkID0gZmFsc2VcbiAgICAgICAgJHBhcmVudC5maW5kKCcuYWN0aXZlJykucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpXG4gICAgICAgIHRoaXMuJGVsZW1lbnQuYWRkQ2xhc3MoJ2FjdGl2ZScpXG4gICAgICB9IGVsc2UgaWYgKCRpbnB1dC5wcm9wKCd0eXBlJykgPT0gJ2NoZWNrYm94Jykge1xuICAgICAgICBpZiAoKCRpbnB1dC5wcm9wKCdjaGVja2VkJykpICE9PSB0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKCdhY3RpdmUnKSkgY2hhbmdlZCA9IGZhbHNlXG4gICAgICAgIHRoaXMuJGVsZW1lbnQudG9nZ2xlQ2xhc3MoJ2FjdGl2ZScpXG4gICAgICB9XG4gICAgICAkaW5wdXQucHJvcCgnY2hlY2tlZCcsIHRoaXMuJGVsZW1lbnQuaGFzQ2xhc3MoJ2FjdGl2ZScpKVxuICAgICAgaWYgKGNoYW5nZWQpICRpbnB1dC50cmlnZ2VyKCdjaGFuZ2UnKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLiRlbGVtZW50LmF0dHIoJ2FyaWEtcHJlc3NlZCcsICF0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKCdhY3RpdmUnKSlcbiAgICAgIHRoaXMuJGVsZW1lbnQudG9nZ2xlQ2xhc3MoJ2FjdGl2ZScpXG4gICAgfVxuICB9XG5cblxuICAvLyBCVVRUT04gUExVR0lOIERFRklOSVRJT05cbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgZnVuY3Rpb24gUGx1Z2luKG9wdGlvbikge1xuICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgdmFyICR0aGlzICAgPSAkKHRoaXMpXG4gICAgICB2YXIgZGF0YSAgICA9ICR0aGlzLmRhdGEoJ2JzLmJ1dHRvbicpXG4gICAgICB2YXIgb3B0aW9ucyA9IHR5cGVvZiBvcHRpb24gPT0gJ29iamVjdCcgJiYgb3B0aW9uXG5cbiAgICAgIGlmICghZGF0YSkgJHRoaXMuZGF0YSgnYnMuYnV0dG9uJywgKGRhdGEgPSBuZXcgQnV0dG9uKHRoaXMsIG9wdGlvbnMpKSlcblxuICAgICAgaWYgKG9wdGlvbiA9PSAndG9nZ2xlJykgZGF0YS50b2dnbGUoKVxuICAgICAgZWxzZSBpZiAob3B0aW9uKSBkYXRhLnNldFN0YXRlKG9wdGlvbilcbiAgICB9KVxuICB9XG5cbiAgdmFyIG9sZCA9ICQuZm4uYnV0dG9uXG5cbiAgJC5mbi5idXR0b24gICAgICAgICAgICAgPSBQbHVnaW5cbiAgJC5mbi5idXR0b24uQ29uc3RydWN0b3IgPSBCdXR0b25cblxuXG4gIC8vIEJVVFRPTiBOTyBDT05GTElDVFxuICAvLyA9PT09PT09PT09PT09PT09PT1cblxuICAkLmZuLmJ1dHRvbi5ub0NvbmZsaWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICQuZm4uYnV0dG9uID0gb2xkXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG5cbiAgLy8gQlVUVE9OIERBVEEtQVBJXG4gIC8vID09PT09PT09PT09PT09PVxuXG4gICQoZG9jdW1lbnQpXG4gICAgLm9uKCdjbGljay5icy5idXR0b24uZGF0YS1hcGknLCAnW2RhdGEtdG9nZ2xlXj1cImJ1dHRvblwiXScsIGZ1bmN0aW9uIChlKSB7XG4gICAgICB2YXIgJGJ0biA9ICQoZS50YXJnZXQpLmNsb3Nlc3QoJy5idG4nKVxuICAgICAgUGx1Z2luLmNhbGwoJGJ0biwgJ3RvZ2dsZScpXG4gICAgICBpZiAoISgkKGUudGFyZ2V0KS5pcygnaW5wdXRbdHlwZT1cInJhZGlvXCJdLCBpbnB1dFt0eXBlPVwiY2hlY2tib3hcIl0nKSkpIHtcbiAgICAgICAgLy8gUHJldmVudCBkb3VibGUgY2xpY2sgb24gcmFkaW9zLCBhbmQgdGhlIGRvdWJsZSBzZWxlY3Rpb25zIChzbyBjYW5jZWxsYXRpb24pIG9uIGNoZWNrYm94ZXNcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICAgIC8vIFRoZSB0YXJnZXQgY29tcG9uZW50IHN0aWxsIHJlY2VpdmUgdGhlIGZvY3VzXG4gICAgICAgIGlmICgkYnRuLmlzKCdpbnB1dCxidXR0b24nKSkgJGJ0bi50cmlnZ2VyKCdmb2N1cycpXG4gICAgICAgIGVsc2UgJGJ0bi5maW5kKCdpbnB1dDp2aXNpYmxlLGJ1dHRvbjp2aXNpYmxlJykuZmlyc3QoKS50cmlnZ2VyKCdmb2N1cycpXG4gICAgICB9XG4gICAgfSlcbiAgICAub24oJ2ZvY3VzLmJzLmJ1dHRvbi5kYXRhLWFwaSBibHVyLmJzLmJ1dHRvbi5kYXRhLWFwaScsICdbZGF0YS10b2dnbGVePVwiYnV0dG9uXCJdJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICQoZS50YXJnZXQpLmNsb3Nlc3QoJy5idG4nKS50b2dnbGVDbGFzcygnZm9jdXMnLCAvXmZvY3VzKGluKT8kLy50ZXN0KGUudHlwZSkpXG4gICAgfSlcblxufShqUXVlcnkpO1xuXG4vKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIEJvb3RzdHJhcDogY2Fyb3VzZWwuanMgdjMuNC4xXG4gKiBodHRwczovL2dldGJvb3RzdHJhcC5jb20vZG9jcy8zLjQvamF2YXNjcmlwdC8jY2Fyb3VzZWxcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogQ29weXJpZ2h0IDIwMTEtMjAxOSBUd2l0dGVyLCBJbmMuXG4gKiBMaWNlbnNlZCB1bmRlciBNSVQgKGh0dHBzOi8vZ2l0aHViLmNvbS90d2JzL2Jvb3RzdHJhcC9ibG9iL21hc3Rlci9MSUNFTlNFKVxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovXG5cblxuK2Z1bmN0aW9uICgkKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICAvLyBDQVJPVVNFTCBDTEFTUyBERUZJTklUSU9OXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICB2YXIgQ2Fyb3VzZWwgPSBmdW5jdGlvbiAoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIHRoaXMuJGVsZW1lbnQgICAgPSAkKGVsZW1lbnQpXG4gICAgdGhpcy4kaW5kaWNhdG9ycyA9IHRoaXMuJGVsZW1lbnQuZmluZCgnLmNhcm91c2VsLWluZGljYXRvcnMnKVxuICAgIHRoaXMub3B0aW9ucyAgICAgPSBvcHRpb25zXG4gICAgdGhpcy5wYXVzZWQgICAgICA9IG51bGxcbiAgICB0aGlzLnNsaWRpbmcgICAgID0gbnVsbFxuICAgIHRoaXMuaW50ZXJ2YWwgICAgPSBudWxsXG4gICAgdGhpcy4kYWN0aXZlICAgICA9IG51bGxcbiAgICB0aGlzLiRpdGVtcyAgICAgID0gbnVsbFxuXG4gICAgdGhpcy5vcHRpb25zLmtleWJvYXJkICYmIHRoaXMuJGVsZW1lbnQub24oJ2tleWRvd24uYnMuY2Fyb3VzZWwnLCAkLnByb3h5KHRoaXMua2V5ZG93biwgdGhpcykpXG5cbiAgICB0aGlzLm9wdGlvbnMucGF1c2UgPT0gJ2hvdmVyJyAmJiAhKCdvbnRvdWNoc3RhcnQnIGluIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCkgJiYgdGhpcy4kZWxlbWVudFxuICAgICAgLm9uKCdtb3VzZWVudGVyLmJzLmNhcm91c2VsJywgJC5wcm94eSh0aGlzLnBhdXNlLCB0aGlzKSlcbiAgICAgIC5vbignbW91c2VsZWF2ZS5icy5jYXJvdXNlbCcsICQucHJveHkodGhpcy5jeWNsZSwgdGhpcykpXG4gIH1cblxuICBDYXJvdXNlbC5WRVJTSU9OICA9ICczLjQuMSdcblxuICBDYXJvdXNlbC5UUkFOU0lUSU9OX0RVUkFUSU9OID0gNjAwXG5cbiAgQ2Fyb3VzZWwuREVGQVVMVFMgPSB7XG4gICAgaW50ZXJ2YWw6IDUwMDAsXG4gICAgcGF1c2U6ICdob3ZlcicsXG4gICAgd3JhcDogdHJ1ZSxcbiAgICBrZXlib2FyZDogdHJ1ZVxuICB9XG5cbiAgQ2Fyb3VzZWwucHJvdG90eXBlLmtleWRvd24gPSBmdW5jdGlvbiAoZSkge1xuICAgIGlmICgvaW5wdXR8dGV4dGFyZWEvaS50ZXN0KGUudGFyZ2V0LnRhZ05hbWUpKSByZXR1cm5cbiAgICBzd2l0Y2ggKGUud2hpY2gpIHtcbiAgICAgIGNhc2UgMzc6IHRoaXMucHJldigpOyBicmVha1xuICAgICAgY2FzZSAzOTogdGhpcy5uZXh0KCk7IGJyZWFrXG4gICAgICBkZWZhdWx0OiByZXR1cm5cbiAgICB9XG5cbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgfVxuXG4gIENhcm91c2VsLnByb3RvdHlwZS5jeWNsZSA9IGZ1bmN0aW9uIChlKSB7XG4gICAgZSB8fCAodGhpcy5wYXVzZWQgPSBmYWxzZSlcblxuICAgIHRoaXMuaW50ZXJ2YWwgJiYgY2xlYXJJbnRlcnZhbCh0aGlzLmludGVydmFsKVxuXG4gICAgdGhpcy5vcHRpb25zLmludGVydmFsXG4gICAgICAmJiAhdGhpcy5wYXVzZWRcbiAgICAgICYmICh0aGlzLmludGVydmFsID0gc2V0SW50ZXJ2YWwoJC5wcm94eSh0aGlzLm5leHQsIHRoaXMpLCB0aGlzLm9wdGlvbnMuaW50ZXJ2YWwpKVxuXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIENhcm91c2VsLnByb3RvdHlwZS5nZXRJdGVtSW5kZXggPSBmdW5jdGlvbiAoaXRlbSkge1xuICAgIHRoaXMuJGl0ZW1zID0gaXRlbS5wYXJlbnQoKS5jaGlsZHJlbignLml0ZW0nKVxuICAgIHJldHVybiB0aGlzLiRpdGVtcy5pbmRleChpdGVtIHx8IHRoaXMuJGFjdGl2ZSlcbiAgfVxuXG4gIENhcm91c2VsLnByb3RvdHlwZS5nZXRJdGVtRm9yRGlyZWN0aW9uID0gZnVuY3Rpb24gKGRpcmVjdGlvbiwgYWN0aXZlKSB7XG4gICAgdmFyIGFjdGl2ZUluZGV4ID0gdGhpcy5nZXRJdGVtSW5kZXgoYWN0aXZlKVxuICAgIHZhciB3aWxsV3JhcCA9IChkaXJlY3Rpb24gPT0gJ3ByZXYnICYmIGFjdGl2ZUluZGV4ID09PSAwKVxuICAgICAgICAgICAgICAgIHx8IChkaXJlY3Rpb24gPT0gJ25leHQnICYmIGFjdGl2ZUluZGV4ID09ICh0aGlzLiRpdGVtcy5sZW5ndGggLSAxKSlcbiAgICBpZiAod2lsbFdyYXAgJiYgIXRoaXMub3B0aW9ucy53cmFwKSByZXR1cm4gYWN0aXZlXG4gICAgdmFyIGRlbHRhID0gZGlyZWN0aW9uID09ICdwcmV2JyA/IC0xIDogMVxuICAgIHZhciBpdGVtSW5kZXggPSAoYWN0aXZlSW5kZXggKyBkZWx0YSkgJSB0aGlzLiRpdGVtcy5sZW5ndGhcbiAgICByZXR1cm4gdGhpcy4kaXRlbXMuZXEoaXRlbUluZGV4KVxuICB9XG5cbiAgQ2Fyb3VzZWwucHJvdG90eXBlLnRvID0gZnVuY3Rpb24gKHBvcykge1xuICAgIHZhciB0aGF0ICAgICAgICA9IHRoaXNcbiAgICB2YXIgYWN0aXZlSW5kZXggPSB0aGlzLmdldEl0ZW1JbmRleCh0aGlzLiRhY3RpdmUgPSB0aGlzLiRlbGVtZW50LmZpbmQoJy5pdGVtLmFjdGl2ZScpKVxuXG4gICAgaWYgKHBvcyA+ICh0aGlzLiRpdGVtcy5sZW5ndGggLSAxKSB8fCBwb3MgPCAwKSByZXR1cm5cblxuICAgIGlmICh0aGlzLnNsaWRpbmcpICAgICAgIHJldHVybiB0aGlzLiRlbGVtZW50Lm9uZSgnc2xpZC5icy5jYXJvdXNlbCcsIGZ1bmN0aW9uICgpIHsgdGhhdC50byhwb3MpIH0pIC8vIHllcywgXCJzbGlkXCJcbiAgICBpZiAoYWN0aXZlSW5kZXggPT0gcG9zKSByZXR1cm4gdGhpcy5wYXVzZSgpLmN5Y2xlKClcblxuICAgIHJldHVybiB0aGlzLnNsaWRlKHBvcyA+IGFjdGl2ZUluZGV4ID8gJ25leHQnIDogJ3ByZXYnLCB0aGlzLiRpdGVtcy5lcShwb3MpKVxuICB9XG5cbiAgQ2Fyb3VzZWwucHJvdG90eXBlLnBhdXNlID0gZnVuY3Rpb24gKGUpIHtcbiAgICBlIHx8ICh0aGlzLnBhdXNlZCA9IHRydWUpXG5cbiAgICBpZiAodGhpcy4kZWxlbWVudC5maW5kKCcubmV4dCwgLnByZXYnKS5sZW5ndGggJiYgJC5zdXBwb3J0LnRyYW5zaXRpb24pIHtcbiAgICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcigkLnN1cHBvcnQudHJhbnNpdGlvbi5lbmQpXG4gICAgICB0aGlzLmN5Y2xlKHRydWUpXG4gICAgfVxuXG4gICAgdGhpcy5pbnRlcnZhbCA9IGNsZWFySW50ZXJ2YWwodGhpcy5pbnRlcnZhbClcblxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICBDYXJvdXNlbC5wcm90b3R5cGUubmV4dCA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5zbGlkaW5nKSByZXR1cm5cbiAgICByZXR1cm4gdGhpcy5zbGlkZSgnbmV4dCcpXG4gIH1cblxuICBDYXJvdXNlbC5wcm90b3R5cGUucHJldiA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5zbGlkaW5nKSByZXR1cm5cbiAgICByZXR1cm4gdGhpcy5zbGlkZSgncHJldicpXG4gIH1cblxuICBDYXJvdXNlbC5wcm90b3R5cGUuc2xpZGUgPSBmdW5jdGlvbiAodHlwZSwgbmV4dCkge1xuICAgIHZhciAkYWN0aXZlICAgPSB0aGlzLiRlbGVtZW50LmZpbmQoJy5pdGVtLmFjdGl2ZScpXG4gICAgdmFyICRuZXh0ICAgICA9IG5leHQgfHwgdGhpcy5nZXRJdGVtRm9yRGlyZWN0aW9uKHR5cGUsICRhY3RpdmUpXG4gICAgdmFyIGlzQ3ljbGluZyA9IHRoaXMuaW50ZXJ2YWxcbiAgICB2YXIgZGlyZWN0aW9uID0gdHlwZSA9PSAnbmV4dCcgPyAnbGVmdCcgOiAncmlnaHQnXG4gICAgdmFyIHRoYXQgICAgICA9IHRoaXNcblxuICAgIGlmICgkbmV4dC5oYXNDbGFzcygnYWN0aXZlJykpIHJldHVybiAodGhpcy5zbGlkaW5nID0gZmFsc2UpXG5cbiAgICB2YXIgcmVsYXRlZFRhcmdldCA9ICRuZXh0WzBdXG4gICAgdmFyIHNsaWRlRXZlbnQgPSAkLkV2ZW50KCdzbGlkZS5icy5jYXJvdXNlbCcsIHtcbiAgICAgIHJlbGF0ZWRUYXJnZXQ6IHJlbGF0ZWRUYXJnZXQsXG4gICAgICBkaXJlY3Rpb246IGRpcmVjdGlvblxuICAgIH0pXG4gICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKHNsaWRlRXZlbnQpXG4gICAgaWYgKHNsaWRlRXZlbnQuaXNEZWZhdWx0UHJldmVudGVkKCkpIHJldHVyblxuXG4gICAgdGhpcy5zbGlkaW5nID0gdHJ1ZVxuXG4gICAgaXNDeWNsaW5nICYmIHRoaXMucGF1c2UoKVxuXG4gICAgaWYgKHRoaXMuJGluZGljYXRvcnMubGVuZ3RoKSB7XG4gICAgICB0aGlzLiRpbmRpY2F0b3JzLmZpbmQoJy5hY3RpdmUnKS5yZW1vdmVDbGFzcygnYWN0aXZlJylcbiAgICAgIHZhciAkbmV4dEluZGljYXRvciA9ICQodGhpcy4kaW5kaWNhdG9ycy5jaGlsZHJlbigpW3RoaXMuZ2V0SXRlbUluZGV4KCRuZXh0KV0pXG4gICAgICAkbmV4dEluZGljYXRvciAmJiAkbmV4dEluZGljYXRvci5hZGRDbGFzcygnYWN0aXZlJylcbiAgICB9XG5cbiAgICB2YXIgc2xpZEV2ZW50ID0gJC5FdmVudCgnc2xpZC5icy5jYXJvdXNlbCcsIHsgcmVsYXRlZFRhcmdldDogcmVsYXRlZFRhcmdldCwgZGlyZWN0aW9uOiBkaXJlY3Rpb24gfSkgLy8geWVzLCBcInNsaWRcIlxuICAgIGlmICgkLnN1cHBvcnQudHJhbnNpdGlvbiAmJiB0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKCdzbGlkZScpKSB7XG4gICAgICAkbmV4dC5hZGRDbGFzcyh0eXBlKVxuICAgICAgaWYgKHR5cGVvZiAkbmV4dCA9PT0gJ29iamVjdCcgJiYgJG5leHQubGVuZ3RoKSB7XG4gICAgICAgICRuZXh0WzBdLm9mZnNldFdpZHRoIC8vIGZvcmNlIHJlZmxvd1xuICAgICAgfVxuICAgICAgJGFjdGl2ZS5hZGRDbGFzcyhkaXJlY3Rpb24pXG4gICAgICAkbmV4dC5hZGRDbGFzcyhkaXJlY3Rpb24pXG4gICAgICAkYWN0aXZlXG4gICAgICAgIC5vbmUoJ2JzVHJhbnNpdGlvbkVuZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAkbmV4dC5yZW1vdmVDbGFzcyhbdHlwZSwgZGlyZWN0aW9uXS5qb2luKCcgJykpLmFkZENsYXNzKCdhY3RpdmUnKVxuICAgICAgICAgICRhY3RpdmUucmVtb3ZlQ2xhc3MoWydhY3RpdmUnLCBkaXJlY3Rpb25dLmpvaW4oJyAnKSlcbiAgICAgICAgICB0aGF0LnNsaWRpbmcgPSBmYWxzZVxuICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhhdC4kZWxlbWVudC50cmlnZ2VyKHNsaWRFdmVudClcbiAgICAgICAgICB9LCAwKVxuICAgICAgICB9KVxuICAgICAgICAuZW11bGF0ZVRyYW5zaXRpb25FbmQoQ2Fyb3VzZWwuVFJBTlNJVElPTl9EVVJBVElPTilcbiAgICB9IGVsc2Uge1xuICAgICAgJGFjdGl2ZS5yZW1vdmVDbGFzcygnYWN0aXZlJylcbiAgICAgICRuZXh0LmFkZENsYXNzKCdhY3RpdmUnKVxuICAgICAgdGhpcy5zbGlkaW5nID0gZmFsc2VcbiAgICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcihzbGlkRXZlbnQpXG4gICAgfVxuXG4gICAgaXNDeWNsaW5nICYmIHRoaXMuY3ljbGUoKVxuXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG5cbiAgLy8gQ0FST1VTRUwgUExVR0lOIERFRklOSVRJT05cbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICBmdW5jdGlvbiBQbHVnaW4ob3B0aW9uKSB7XG4gICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgJHRoaXMgICA9ICQodGhpcylcbiAgICAgIHZhciBkYXRhICAgID0gJHRoaXMuZGF0YSgnYnMuY2Fyb3VzZWwnKVxuICAgICAgdmFyIG9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgQ2Fyb3VzZWwuREVGQVVMVFMsICR0aGlzLmRhdGEoKSwgdHlwZW9mIG9wdGlvbiA9PSAnb2JqZWN0JyAmJiBvcHRpb24pXG4gICAgICB2YXIgYWN0aW9uICA9IHR5cGVvZiBvcHRpb24gPT0gJ3N0cmluZycgPyBvcHRpb24gOiBvcHRpb25zLnNsaWRlXG5cbiAgICAgIGlmICghZGF0YSkgJHRoaXMuZGF0YSgnYnMuY2Fyb3VzZWwnLCAoZGF0YSA9IG5ldyBDYXJvdXNlbCh0aGlzLCBvcHRpb25zKSkpXG4gICAgICBpZiAodHlwZW9mIG9wdGlvbiA9PSAnbnVtYmVyJykgZGF0YS50byhvcHRpb24pXG4gICAgICBlbHNlIGlmIChhY3Rpb24pIGRhdGFbYWN0aW9uXSgpXG4gICAgICBlbHNlIGlmIChvcHRpb25zLmludGVydmFsKSBkYXRhLnBhdXNlKCkuY3ljbGUoKVxuICAgIH0pXG4gIH1cblxuICB2YXIgb2xkID0gJC5mbi5jYXJvdXNlbFxuXG4gICQuZm4uY2Fyb3VzZWwgICAgICAgICAgICAgPSBQbHVnaW5cbiAgJC5mbi5jYXJvdXNlbC5Db25zdHJ1Y3RvciA9IENhcm91c2VsXG5cblxuICAvLyBDQVJPVVNFTCBOTyBDT05GTElDVFxuICAvLyA9PT09PT09PT09PT09PT09PT09PVxuXG4gICQuZm4uY2Fyb3VzZWwubm9Db25mbGljdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAkLmZuLmNhcm91c2VsID0gb2xkXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG5cbiAgLy8gQ0FST1VTRUwgREFUQS1BUElcbiAgLy8gPT09PT09PT09PT09PT09PT1cblxuICB2YXIgY2xpY2tIYW5kbGVyID0gZnVuY3Rpb24gKGUpIHtcbiAgICB2YXIgJHRoaXMgICA9ICQodGhpcylcbiAgICB2YXIgaHJlZiAgICA9ICR0aGlzLmF0dHIoJ2hyZWYnKVxuICAgIGlmIChocmVmKSB7XG4gICAgICBocmVmID0gaHJlZi5yZXBsYWNlKC8uKig/PSNbXlxcc10rJCkvLCAnJykgLy8gc3RyaXAgZm9yIGllN1xuICAgIH1cblxuICAgIHZhciB0YXJnZXQgID0gJHRoaXMuYXR0cignZGF0YS10YXJnZXQnKSB8fCBocmVmXG4gICAgdmFyICR0YXJnZXQgPSAkKGRvY3VtZW50KS5maW5kKHRhcmdldClcblxuICAgIGlmICghJHRhcmdldC5oYXNDbGFzcygnY2Fyb3VzZWwnKSkgcmV0dXJuXG5cbiAgICB2YXIgb3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCAkdGFyZ2V0LmRhdGEoKSwgJHRoaXMuZGF0YSgpKVxuICAgIHZhciBzbGlkZUluZGV4ID0gJHRoaXMuYXR0cignZGF0YS1zbGlkZS10bycpXG4gICAgaWYgKHNsaWRlSW5kZXgpIG9wdGlvbnMuaW50ZXJ2YWwgPSBmYWxzZVxuXG4gICAgUGx1Z2luLmNhbGwoJHRhcmdldCwgb3B0aW9ucylcblxuICAgIGlmIChzbGlkZUluZGV4KSB7XG4gICAgICAkdGFyZ2V0LmRhdGEoJ2JzLmNhcm91c2VsJykudG8oc2xpZGVJbmRleClcbiAgICB9XG5cbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgfVxuXG4gICQoZG9jdW1lbnQpXG4gICAgLm9uKCdjbGljay5icy5jYXJvdXNlbC5kYXRhLWFwaScsICdbZGF0YS1zbGlkZV0nLCBjbGlja0hhbmRsZXIpXG4gICAgLm9uKCdjbGljay5icy5jYXJvdXNlbC5kYXRhLWFwaScsICdbZGF0YS1zbGlkZS10b10nLCBjbGlja0hhbmRsZXIpXG5cbiAgJCh3aW5kb3cpLm9uKCdsb2FkJywgZnVuY3Rpb24gKCkge1xuICAgICQoJ1tkYXRhLXJpZGU9XCJjYXJvdXNlbFwiXScpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgdmFyICRjYXJvdXNlbCA9ICQodGhpcylcbiAgICAgIFBsdWdpbi5jYWxsKCRjYXJvdXNlbCwgJGNhcm91c2VsLmRhdGEoKSlcbiAgICB9KVxuICB9KVxuXG59KGpRdWVyeSk7XG5cbi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogQm9vdHN0cmFwOiBjb2xsYXBzZS5qcyB2My40LjFcbiAqIGh0dHBzOi8vZ2V0Ym9vdHN0cmFwLmNvbS9kb2NzLzMuNC9qYXZhc2NyaXB0LyNjb2xsYXBzZVxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBDb3B5cmlnaHQgMjAxMS0yMDE5IFR3aXR0ZXIsIEluYy5cbiAqIExpY2Vuc2VkIHVuZGVyIE1JVCAoaHR0cHM6Ly9naXRodWIuY29tL3R3YnMvYm9vdHN0cmFwL2Jsb2IvbWFzdGVyL0xJQ0VOU0UpXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi9cblxuLyoganNoaW50IGxhdGVkZWY6IGZhbHNlICovXG5cbitmdW5jdGlvbiAoJCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgLy8gQ09MTEFQU0UgUFVCTElDIENMQVNTIERFRklOSVRJT05cbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICB2YXIgQ29sbGFwc2UgPSBmdW5jdGlvbiAoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIHRoaXMuJGVsZW1lbnQgICAgICA9ICQoZWxlbWVudClcbiAgICB0aGlzLm9wdGlvbnMgICAgICAgPSAkLmV4dGVuZCh7fSwgQ29sbGFwc2UuREVGQVVMVFMsIG9wdGlvbnMpXG4gICAgdGhpcy4kdHJpZ2dlciAgICAgID0gJCgnW2RhdGEtdG9nZ2xlPVwiY29sbGFwc2VcIl1baHJlZj1cIiMnICsgZWxlbWVudC5pZCArICdcIl0sJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAnW2RhdGEtdG9nZ2xlPVwiY29sbGFwc2VcIl1bZGF0YS10YXJnZXQ9XCIjJyArIGVsZW1lbnQuaWQgKyAnXCJdJylcbiAgICB0aGlzLnRyYW5zaXRpb25pbmcgPSBudWxsXG5cbiAgICBpZiAodGhpcy5vcHRpb25zLnBhcmVudCkge1xuICAgICAgdGhpcy4kcGFyZW50ID0gdGhpcy5nZXRQYXJlbnQoKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmFkZEFyaWFBbmRDb2xsYXBzZWRDbGFzcyh0aGlzLiRlbGVtZW50LCB0aGlzLiR0cmlnZ2VyKVxuICAgIH1cblxuICAgIGlmICh0aGlzLm9wdGlvbnMudG9nZ2xlKSB0aGlzLnRvZ2dsZSgpXG4gIH1cblxuICBDb2xsYXBzZS5WRVJTSU9OICA9ICczLjQuMSdcblxuICBDb2xsYXBzZS5UUkFOU0lUSU9OX0RVUkFUSU9OID0gMzUwXG5cbiAgQ29sbGFwc2UuREVGQVVMVFMgPSB7XG4gICAgdG9nZ2xlOiB0cnVlXG4gIH1cblxuICBDb2xsYXBzZS5wcm90b3R5cGUuZGltZW5zaW9uID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBoYXNXaWR0aCA9IHRoaXMuJGVsZW1lbnQuaGFzQ2xhc3MoJ3dpZHRoJylcbiAgICByZXR1cm4gaGFzV2lkdGggPyAnd2lkdGgnIDogJ2hlaWdodCdcbiAgfVxuXG4gIENvbGxhcHNlLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLnRyYW5zaXRpb25pbmcgfHwgdGhpcy4kZWxlbWVudC5oYXNDbGFzcygnaW4nKSkgcmV0dXJuXG5cbiAgICB2YXIgYWN0aXZlc0RhdGFcbiAgICB2YXIgYWN0aXZlcyA9IHRoaXMuJHBhcmVudCAmJiB0aGlzLiRwYXJlbnQuY2hpbGRyZW4oJy5wYW5lbCcpLmNoaWxkcmVuKCcuaW4sIC5jb2xsYXBzaW5nJylcblxuICAgIGlmIChhY3RpdmVzICYmIGFjdGl2ZXMubGVuZ3RoKSB7XG4gICAgICBhY3RpdmVzRGF0YSA9IGFjdGl2ZXMuZGF0YSgnYnMuY29sbGFwc2UnKVxuICAgICAgaWYgKGFjdGl2ZXNEYXRhICYmIGFjdGl2ZXNEYXRhLnRyYW5zaXRpb25pbmcpIHJldHVyblxuICAgIH1cblxuICAgIHZhciBzdGFydEV2ZW50ID0gJC5FdmVudCgnc2hvdy5icy5jb2xsYXBzZScpXG4gICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKHN0YXJ0RXZlbnQpXG4gICAgaWYgKHN0YXJ0RXZlbnQuaXNEZWZhdWx0UHJldmVudGVkKCkpIHJldHVyblxuXG4gICAgaWYgKGFjdGl2ZXMgJiYgYWN0aXZlcy5sZW5ndGgpIHtcbiAgICAgIFBsdWdpbi5jYWxsKGFjdGl2ZXMsICdoaWRlJylcbiAgICAgIGFjdGl2ZXNEYXRhIHx8IGFjdGl2ZXMuZGF0YSgnYnMuY29sbGFwc2UnLCBudWxsKVxuICAgIH1cblxuICAgIHZhciBkaW1lbnNpb24gPSB0aGlzLmRpbWVuc2lvbigpXG5cbiAgICB0aGlzLiRlbGVtZW50XG4gICAgICAucmVtb3ZlQ2xhc3MoJ2NvbGxhcHNlJylcbiAgICAgIC5hZGRDbGFzcygnY29sbGFwc2luZycpW2RpbWVuc2lvbl0oMClcbiAgICAgIC5hdHRyKCdhcmlhLWV4cGFuZGVkJywgdHJ1ZSlcblxuICAgIHRoaXMuJHRyaWdnZXJcbiAgICAgIC5yZW1vdmVDbGFzcygnY29sbGFwc2VkJylcbiAgICAgIC5hdHRyKCdhcmlhLWV4cGFuZGVkJywgdHJ1ZSlcblxuICAgIHRoaXMudHJhbnNpdGlvbmluZyA9IDFcblxuICAgIHZhciBjb21wbGV0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMuJGVsZW1lbnRcbiAgICAgICAgLnJlbW92ZUNsYXNzKCdjb2xsYXBzaW5nJylcbiAgICAgICAgLmFkZENsYXNzKCdjb2xsYXBzZSBpbicpW2RpbWVuc2lvbl0oJycpXG4gICAgICB0aGlzLnRyYW5zaXRpb25pbmcgPSAwXG4gICAgICB0aGlzLiRlbGVtZW50XG4gICAgICAgIC50cmlnZ2VyKCdzaG93bi5icy5jb2xsYXBzZScpXG4gICAgfVxuXG4gICAgaWYgKCEkLnN1cHBvcnQudHJhbnNpdGlvbikgcmV0dXJuIGNvbXBsZXRlLmNhbGwodGhpcylcblxuICAgIHZhciBzY3JvbGxTaXplID0gJC5jYW1lbENhc2UoWydzY3JvbGwnLCBkaW1lbnNpb25dLmpvaW4oJy0nKSlcblxuICAgIHRoaXMuJGVsZW1lbnRcbiAgICAgIC5vbmUoJ2JzVHJhbnNpdGlvbkVuZCcsICQucHJveHkoY29tcGxldGUsIHRoaXMpKVxuICAgICAgLmVtdWxhdGVUcmFuc2l0aW9uRW5kKENvbGxhcHNlLlRSQU5TSVRJT05fRFVSQVRJT04pW2RpbWVuc2lvbl0odGhpcy4kZWxlbWVudFswXVtzY3JvbGxTaXplXSlcbiAgfVxuXG4gIENvbGxhcHNlLnByb3RvdHlwZS5oaWRlID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLnRyYW5zaXRpb25pbmcgfHwgIXRoaXMuJGVsZW1lbnQuaGFzQ2xhc3MoJ2luJykpIHJldHVyblxuXG4gICAgdmFyIHN0YXJ0RXZlbnQgPSAkLkV2ZW50KCdoaWRlLmJzLmNvbGxhcHNlJylcbiAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoc3RhcnRFdmVudClcbiAgICBpZiAoc3RhcnRFdmVudC5pc0RlZmF1bHRQcmV2ZW50ZWQoKSkgcmV0dXJuXG5cbiAgICB2YXIgZGltZW5zaW9uID0gdGhpcy5kaW1lbnNpb24oKVxuXG4gICAgdGhpcy4kZWxlbWVudFtkaW1lbnNpb25dKHRoaXMuJGVsZW1lbnRbZGltZW5zaW9uXSgpKVswXS5vZmZzZXRIZWlnaHRcblxuICAgIHRoaXMuJGVsZW1lbnRcbiAgICAgIC5hZGRDbGFzcygnY29sbGFwc2luZycpXG4gICAgICAucmVtb3ZlQ2xhc3MoJ2NvbGxhcHNlIGluJylcbiAgICAgIC5hdHRyKCdhcmlhLWV4cGFuZGVkJywgZmFsc2UpXG5cbiAgICB0aGlzLiR0cmlnZ2VyXG4gICAgICAuYWRkQ2xhc3MoJ2NvbGxhcHNlZCcpXG4gICAgICAuYXR0cignYXJpYS1leHBhbmRlZCcsIGZhbHNlKVxuXG4gICAgdGhpcy50cmFuc2l0aW9uaW5nID0gMVxuXG4gICAgdmFyIGNvbXBsZXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy50cmFuc2l0aW9uaW5nID0gMFxuICAgICAgdGhpcy4kZWxlbWVudFxuICAgICAgICAucmVtb3ZlQ2xhc3MoJ2NvbGxhcHNpbmcnKVxuICAgICAgICAuYWRkQ2xhc3MoJ2NvbGxhcHNlJylcbiAgICAgICAgLnRyaWdnZXIoJ2hpZGRlbi5icy5jb2xsYXBzZScpXG4gICAgfVxuXG4gICAgaWYgKCEkLnN1cHBvcnQudHJhbnNpdGlvbikgcmV0dXJuIGNvbXBsZXRlLmNhbGwodGhpcylcblxuICAgIHRoaXMuJGVsZW1lbnRcbiAgICAgIFtkaW1lbnNpb25dKDApXG4gICAgICAub25lKCdic1RyYW5zaXRpb25FbmQnLCAkLnByb3h5KGNvbXBsZXRlLCB0aGlzKSlcbiAgICAgIC5lbXVsYXRlVHJhbnNpdGlvbkVuZChDb2xsYXBzZS5UUkFOU0lUSU9OX0RVUkFUSU9OKVxuICB9XG5cbiAgQ29sbGFwc2UucHJvdG90eXBlLnRvZ2dsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzW3RoaXMuJGVsZW1lbnQuaGFzQ2xhc3MoJ2luJykgPyAnaGlkZScgOiAnc2hvdyddKClcbiAgfVxuXG4gIENvbGxhcHNlLnByb3RvdHlwZS5nZXRQYXJlbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICQoZG9jdW1lbnQpLmZpbmQodGhpcy5vcHRpb25zLnBhcmVudClcbiAgICAgIC5maW5kKCdbZGF0YS10b2dnbGU9XCJjb2xsYXBzZVwiXVtkYXRhLXBhcmVudD1cIicgKyB0aGlzLm9wdGlvbnMucGFyZW50ICsgJ1wiXScpXG4gICAgICAuZWFjaCgkLnByb3h5KGZ1bmN0aW9uIChpLCBlbGVtZW50KSB7XG4gICAgICAgIHZhciAkZWxlbWVudCA9ICQoZWxlbWVudClcbiAgICAgICAgdGhpcy5hZGRBcmlhQW5kQ29sbGFwc2VkQ2xhc3MoZ2V0VGFyZ2V0RnJvbVRyaWdnZXIoJGVsZW1lbnQpLCAkZWxlbWVudClcbiAgICAgIH0sIHRoaXMpKVxuICAgICAgLmVuZCgpXG4gIH1cblxuICBDb2xsYXBzZS5wcm90b3R5cGUuYWRkQXJpYUFuZENvbGxhcHNlZENsYXNzID0gZnVuY3Rpb24gKCRlbGVtZW50LCAkdHJpZ2dlcikge1xuICAgIHZhciBpc09wZW4gPSAkZWxlbWVudC5oYXNDbGFzcygnaW4nKVxuXG4gICAgJGVsZW1lbnQuYXR0cignYXJpYS1leHBhbmRlZCcsIGlzT3BlbilcbiAgICAkdHJpZ2dlclxuICAgICAgLnRvZ2dsZUNsYXNzKCdjb2xsYXBzZWQnLCAhaXNPcGVuKVxuICAgICAgLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCBpc09wZW4pXG4gIH1cblxuICBmdW5jdGlvbiBnZXRUYXJnZXRGcm9tVHJpZ2dlcigkdHJpZ2dlcikge1xuICAgIHZhciBocmVmXG4gICAgdmFyIHRhcmdldCA9ICR0cmlnZ2VyLmF0dHIoJ2RhdGEtdGFyZ2V0JylcbiAgICAgIHx8IChocmVmID0gJHRyaWdnZXIuYXR0cignaHJlZicpKSAmJiBocmVmLnJlcGxhY2UoLy4qKD89I1teXFxzXSskKS8sICcnKSAvLyBzdHJpcCBmb3IgaWU3XG5cbiAgICByZXR1cm4gJChkb2N1bWVudCkuZmluZCh0YXJnZXQpXG4gIH1cblxuXG4gIC8vIENPTExBUFNFIFBMVUdJTiBERUZJTklUSU9OXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgZnVuY3Rpb24gUGx1Z2luKG9wdGlvbikge1xuICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgdmFyICR0aGlzICAgPSAkKHRoaXMpXG4gICAgICB2YXIgZGF0YSAgICA9ICR0aGlzLmRhdGEoJ2JzLmNvbGxhcHNlJylcbiAgICAgIHZhciBvcHRpb25zID0gJC5leHRlbmQoe30sIENvbGxhcHNlLkRFRkFVTFRTLCAkdGhpcy5kYXRhKCksIHR5cGVvZiBvcHRpb24gPT0gJ29iamVjdCcgJiYgb3B0aW9uKVxuXG4gICAgICBpZiAoIWRhdGEgJiYgb3B0aW9ucy50b2dnbGUgJiYgL3Nob3d8aGlkZS8udGVzdChvcHRpb24pKSBvcHRpb25zLnRvZ2dsZSA9IGZhbHNlXG4gICAgICBpZiAoIWRhdGEpICR0aGlzLmRhdGEoJ2JzLmNvbGxhcHNlJywgKGRhdGEgPSBuZXcgQ29sbGFwc2UodGhpcywgb3B0aW9ucykpKVxuICAgICAgaWYgKHR5cGVvZiBvcHRpb24gPT0gJ3N0cmluZycpIGRhdGFbb3B0aW9uXSgpXG4gICAgfSlcbiAgfVxuXG4gIHZhciBvbGQgPSAkLmZuLmNvbGxhcHNlXG5cbiAgJC5mbi5jb2xsYXBzZSAgICAgICAgICAgICA9IFBsdWdpblxuICAkLmZuLmNvbGxhcHNlLkNvbnN0cnVjdG9yID0gQ29sbGFwc2VcblxuXG4gIC8vIENPTExBUFNFIE5PIENPTkZMSUNUXG4gIC8vID09PT09PT09PT09PT09PT09PT09XG5cbiAgJC5mbi5jb2xsYXBzZS5ub0NvbmZsaWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICQuZm4uY29sbGFwc2UgPSBvbGRcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cblxuICAvLyBDT0xMQVBTRSBEQVRBLUFQSVxuICAvLyA9PT09PT09PT09PT09PT09PVxuXG4gICQoZG9jdW1lbnQpLm9uKCdjbGljay5icy5jb2xsYXBzZS5kYXRhLWFwaScsICdbZGF0YS10b2dnbGU9XCJjb2xsYXBzZVwiXScsIGZ1bmN0aW9uIChlKSB7XG4gICAgdmFyICR0aGlzICAgPSAkKHRoaXMpXG5cbiAgICBpZiAoISR0aGlzLmF0dHIoJ2RhdGEtdGFyZ2V0JykpIGUucHJldmVudERlZmF1bHQoKVxuXG4gICAgdmFyICR0YXJnZXQgPSBnZXRUYXJnZXRGcm9tVHJpZ2dlcigkdGhpcylcbiAgICB2YXIgZGF0YSAgICA9ICR0YXJnZXQuZGF0YSgnYnMuY29sbGFwc2UnKVxuICAgIHZhciBvcHRpb24gID0gZGF0YSA/ICd0b2dnbGUnIDogJHRoaXMuZGF0YSgpXG5cbiAgICBQbHVnaW4uY2FsbCgkdGFyZ2V0LCBvcHRpb24pXG4gIH0pXG5cbn0oalF1ZXJ5KTtcblxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBCb290c3RyYXA6IGRyb3Bkb3duLmpzIHYzLjQuMVxuICogaHR0cHM6Ly9nZXRib290c3RyYXAuY29tL2RvY3MvMy40L2phdmFzY3JpcHQvI2Ryb3Bkb3duc1xuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBDb3B5cmlnaHQgMjAxMS0yMDE5IFR3aXR0ZXIsIEluYy5cbiAqIExpY2Vuc2VkIHVuZGVyIE1JVCAoaHR0cHM6Ly9naXRodWIuY29tL3R3YnMvYm9vdHN0cmFwL2Jsb2IvbWFzdGVyL0xJQ0VOU0UpXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi9cblxuXG4rZnVuY3Rpb24gKCQpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIC8vIERST1BET1dOIENMQVNTIERFRklOSVRJT05cbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gIHZhciBiYWNrZHJvcCA9ICcuZHJvcGRvd24tYmFja2Ryb3AnXG4gIHZhciB0b2dnbGUgICA9ICdbZGF0YS10b2dnbGU9XCJkcm9wZG93blwiXSdcbiAgdmFyIERyb3Bkb3duID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICAkKGVsZW1lbnQpLm9uKCdjbGljay5icy5kcm9wZG93bicsIHRoaXMudG9nZ2xlKVxuICB9XG5cbiAgRHJvcGRvd24uVkVSU0lPTiA9ICczLjQuMSdcblxuICBmdW5jdGlvbiBnZXRQYXJlbnQoJHRoaXMpIHtcbiAgICB2YXIgc2VsZWN0b3IgPSAkdGhpcy5hdHRyKCdkYXRhLXRhcmdldCcpXG5cbiAgICBpZiAoIXNlbGVjdG9yKSB7XG4gICAgICBzZWxlY3RvciA9ICR0aGlzLmF0dHIoJ2hyZWYnKVxuICAgICAgc2VsZWN0b3IgPSBzZWxlY3RvciAmJiAvI1tBLVphLXpdLy50ZXN0KHNlbGVjdG9yKSAmJiBzZWxlY3Rvci5yZXBsYWNlKC8uKig/PSNbXlxcc10qJCkvLCAnJykgLy8gc3RyaXAgZm9yIGllN1xuICAgIH1cblxuICAgIHZhciAkcGFyZW50ID0gc2VsZWN0b3IgIT09ICcjJyA/ICQoZG9jdW1lbnQpLmZpbmQoc2VsZWN0b3IpIDogbnVsbFxuXG4gICAgcmV0dXJuICRwYXJlbnQgJiYgJHBhcmVudC5sZW5ndGggPyAkcGFyZW50IDogJHRoaXMucGFyZW50KClcbiAgfVxuXG4gIGZ1bmN0aW9uIGNsZWFyTWVudXMoZSkge1xuICAgIGlmIChlICYmIGUud2hpY2ggPT09IDMpIHJldHVyblxuICAgICQoYmFja2Ryb3ApLnJlbW92ZSgpXG4gICAgJCh0b2dnbGUpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgdmFyICR0aGlzICAgICAgICAgPSAkKHRoaXMpXG4gICAgICB2YXIgJHBhcmVudCAgICAgICA9IGdldFBhcmVudCgkdGhpcylcbiAgICAgIHZhciByZWxhdGVkVGFyZ2V0ID0geyByZWxhdGVkVGFyZ2V0OiB0aGlzIH1cblxuICAgICAgaWYgKCEkcGFyZW50Lmhhc0NsYXNzKCdvcGVuJykpIHJldHVyblxuXG4gICAgICBpZiAoZSAmJiBlLnR5cGUgPT0gJ2NsaWNrJyAmJiAvaW5wdXR8dGV4dGFyZWEvaS50ZXN0KGUudGFyZ2V0LnRhZ05hbWUpICYmICQuY29udGFpbnMoJHBhcmVudFswXSwgZS50YXJnZXQpKSByZXR1cm5cblxuICAgICAgJHBhcmVudC50cmlnZ2VyKGUgPSAkLkV2ZW50KCdoaWRlLmJzLmRyb3Bkb3duJywgcmVsYXRlZFRhcmdldCkpXG5cbiAgICAgIGlmIChlLmlzRGVmYXVsdFByZXZlbnRlZCgpKSByZXR1cm5cblxuICAgICAgJHRoaXMuYXR0cignYXJpYS1leHBhbmRlZCcsICdmYWxzZScpXG4gICAgICAkcGFyZW50LnJlbW92ZUNsYXNzKCdvcGVuJykudHJpZ2dlcigkLkV2ZW50KCdoaWRkZW4uYnMuZHJvcGRvd24nLCByZWxhdGVkVGFyZ2V0KSlcbiAgICB9KVxuICB9XG5cbiAgRHJvcGRvd24ucHJvdG90eXBlLnRvZ2dsZSA9IGZ1bmN0aW9uIChlKSB7XG4gICAgdmFyICR0aGlzID0gJCh0aGlzKVxuXG4gICAgaWYgKCR0aGlzLmlzKCcuZGlzYWJsZWQsIDpkaXNhYmxlZCcpKSByZXR1cm5cblxuICAgIHZhciAkcGFyZW50ICA9IGdldFBhcmVudCgkdGhpcylcbiAgICB2YXIgaXNBY3RpdmUgPSAkcGFyZW50Lmhhc0NsYXNzKCdvcGVuJylcblxuICAgIGNsZWFyTWVudXMoKVxuXG4gICAgaWYgKCFpc0FjdGl2ZSkge1xuICAgICAgaWYgKCdvbnRvdWNoc3RhcnQnIGluIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCAmJiAhJHBhcmVudC5jbG9zZXN0KCcubmF2YmFyLW5hdicpLmxlbmd0aCkge1xuICAgICAgICAvLyBpZiBtb2JpbGUgd2UgdXNlIGEgYmFja2Ryb3AgYmVjYXVzZSBjbGljayBldmVudHMgZG9uJ3QgZGVsZWdhdGVcbiAgICAgICAgJChkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSlcbiAgICAgICAgICAuYWRkQ2xhc3MoJ2Ryb3Bkb3duLWJhY2tkcm9wJylcbiAgICAgICAgICAuaW5zZXJ0QWZ0ZXIoJCh0aGlzKSlcbiAgICAgICAgICAub24oJ2NsaWNrJywgY2xlYXJNZW51cylcbiAgICAgIH1cblxuICAgICAgdmFyIHJlbGF0ZWRUYXJnZXQgPSB7IHJlbGF0ZWRUYXJnZXQ6IHRoaXMgfVxuICAgICAgJHBhcmVudC50cmlnZ2VyKGUgPSAkLkV2ZW50KCdzaG93LmJzLmRyb3Bkb3duJywgcmVsYXRlZFRhcmdldCkpXG5cbiAgICAgIGlmIChlLmlzRGVmYXVsdFByZXZlbnRlZCgpKSByZXR1cm5cblxuICAgICAgJHRoaXNcbiAgICAgICAgLnRyaWdnZXIoJ2ZvY3VzJylcbiAgICAgICAgLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCAndHJ1ZScpXG5cbiAgICAgICRwYXJlbnRcbiAgICAgICAgLnRvZ2dsZUNsYXNzKCdvcGVuJylcbiAgICAgICAgLnRyaWdnZXIoJC5FdmVudCgnc2hvd24uYnMuZHJvcGRvd24nLCByZWxhdGVkVGFyZ2V0KSlcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIERyb3Bkb3duLnByb3RvdHlwZS5rZXlkb3duID0gZnVuY3Rpb24gKGUpIHtcbiAgICBpZiAoIS8oMzh8NDB8Mjd8MzIpLy50ZXN0KGUud2hpY2gpIHx8IC9pbnB1dHx0ZXh0YXJlYS9pLnRlc3QoZS50YXJnZXQudGFnTmFtZSkpIHJldHVyblxuXG4gICAgdmFyICR0aGlzID0gJCh0aGlzKVxuXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuXG4gICAgaWYgKCR0aGlzLmlzKCcuZGlzYWJsZWQsIDpkaXNhYmxlZCcpKSByZXR1cm5cblxuICAgIHZhciAkcGFyZW50ICA9IGdldFBhcmVudCgkdGhpcylcbiAgICB2YXIgaXNBY3RpdmUgPSAkcGFyZW50Lmhhc0NsYXNzKCdvcGVuJylcblxuICAgIGlmICghaXNBY3RpdmUgJiYgZS53aGljaCAhPSAyNyB8fCBpc0FjdGl2ZSAmJiBlLndoaWNoID09IDI3KSB7XG4gICAgICBpZiAoZS53aGljaCA9PSAyNykgJHBhcmVudC5maW5kKHRvZ2dsZSkudHJpZ2dlcignZm9jdXMnKVxuICAgICAgcmV0dXJuICR0aGlzLnRyaWdnZXIoJ2NsaWNrJylcbiAgICB9XG5cbiAgICB2YXIgZGVzYyA9ICcgbGk6bm90KC5kaXNhYmxlZCk6dmlzaWJsZSBhJ1xuICAgIHZhciAkaXRlbXMgPSAkcGFyZW50LmZpbmQoJy5kcm9wZG93bi1tZW51JyArIGRlc2MpXG5cbiAgICBpZiAoISRpdGVtcy5sZW5ndGgpIHJldHVyblxuXG4gICAgdmFyIGluZGV4ID0gJGl0ZW1zLmluZGV4KGUudGFyZ2V0KVxuXG4gICAgaWYgKGUud2hpY2ggPT0gMzggJiYgaW5kZXggPiAwKSAgICAgICAgICAgICAgICAgaW5kZXgtLSAgICAgICAgIC8vIHVwXG4gICAgaWYgKGUud2hpY2ggPT0gNDAgJiYgaW5kZXggPCAkaXRlbXMubGVuZ3RoIC0gMSkgaW5kZXgrKyAgICAgICAgIC8vIGRvd25cbiAgICBpZiAoIX5pbmRleCkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleCA9IDBcblxuICAgICRpdGVtcy5lcShpbmRleCkudHJpZ2dlcignZm9jdXMnKVxuICB9XG5cblxuICAvLyBEUk9QRE9XTiBQTFVHSU4gREVGSU5JVElPTlxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gIGZ1bmN0aW9uIFBsdWdpbihvcHRpb24pIHtcbiAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciAkdGhpcyA9ICQodGhpcylcbiAgICAgIHZhciBkYXRhICA9ICR0aGlzLmRhdGEoJ2JzLmRyb3Bkb3duJylcblxuICAgICAgaWYgKCFkYXRhKSAkdGhpcy5kYXRhKCdicy5kcm9wZG93bicsIChkYXRhID0gbmV3IERyb3Bkb3duKHRoaXMpKSlcbiAgICAgIGlmICh0eXBlb2Ygb3B0aW9uID09ICdzdHJpbmcnKSBkYXRhW29wdGlvbl0uY2FsbCgkdGhpcylcbiAgICB9KVxuICB9XG5cbiAgdmFyIG9sZCA9ICQuZm4uZHJvcGRvd25cblxuICAkLmZuLmRyb3Bkb3duICAgICAgICAgICAgID0gUGx1Z2luXG4gICQuZm4uZHJvcGRvd24uQ29uc3RydWN0b3IgPSBEcm9wZG93blxuXG5cbiAgLy8gRFJPUERPV04gTk8gQ09ORkxJQ1RcbiAgLy8gPT09PT09PT09PT09PT09PT09PT1cblxuICAkLmZuLmRyb3Bkb3duLm5vQ29uZmxpY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgJC5mbi5kcm9wZG93biA9IG9sZFxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuXG4gIC8vIEFQUExZIFRPIFNUQU5EQVJEIERST1BET1dOIEVMRU1FTlRTXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgJChkb2N1bWVudClcbiAgICAub24oJ2NsaWNrLmJzLmRyb3Bkb3duLmRhdGEtYXBpJywgY2xlYXJNZW51cylcbiAgICAub24oJ2NsaWNrLmJzLmRyb3Bkb3duLmRhdGEtYXBpJywgJy5kcm9wZG93biBmb3JtJywgZnVuY3Rpb24gKGUpIHsgZS5zdG9wUHJvcGFnYXRpb24oKSB9KVxuICAgIC5vbignY2xpY2suYnMuZHJvcGRvd24uZGF0YS1hcGknLCB0b2dnbGUsIERyb3Bkb3duLnByb3RvdHlwZS50b2dnbGUpXG4gICAgLm9uKCdrZXlkb3duLmJzLmRyb3Bkb3duLmRhdGEtYXBpJywgdG9nZ2xlLCBEcm9wZG93bi5wcm90b3R5cGUua2V5ZG93bilcbiAgICAub24oJ2tleWRvd24uYnMuZHJvcGRvd24uZGF0YS1hcGknLCAnLmRyb3Bkb3duLW1lbnUnLCBEcm9wZG93bi5wcm90b3R5cGUua2V5ZG93bilcblxufShqUXVlcnkpO1xuXG4vKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIEJvb3RzdHJhcDogbW9kYWwuanMgdjMuNC4xXG4gKiBodHRwczovL2dldGJvb3RzdHJhcC5jb20vZG9jcy8zLjQvamF2YXNjcmlwdC8jbW9kYWxzXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIENvcHlyaWdodCAyMDExLTIwMTkgVHdpdHRlciwgSW5jLlxuICogTGljZW5zZWQgdW5kZXIgTUlUIChodHRwczovL2dpdGh1Yi5jb20vdHdicy9ib290c3RyYXAvYmxvYi9tYXN0ZXIvTElDRU5TRSlcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqL1xuXG5cbitmdW5jdGlvbiAoJCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgLy8gTU9EQUwgQ0xBU1MgREVGSU5JVElPTlxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09XG5cbiAgdmFyIE1vZGFsID0gZnVuY3Rpb24gKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zXG4gICAgdGhpcy4kYm9keSA9ICQoZG9jdW1lbnQuYm9keSlcbiAgICB0aGlzLiRlbGVtZW50ID0gJChlbGVtZW50KVxuICAgIHRoaXMuJGRpYWxvZyA9IHRoaXMuJGVsZW1lbnQuZmluZCgnLm1vZGFsLWRpYWxvZycpXG4gICAgdGhpcy4kYmFja2Ryb3AgPSBudWxsXG4gICAgdGhpcy5pc1Nob3duID0gbnVsbFxuICAgIHRoaXMub3JpZ2luYWxCb2R5UGFkID0gbnVsbFxuICAgIHRoaXMuc2Nyb2xsYmFyV2lkdGggPSAwXG4gICAgdGhpcy5pZ25vcmVCYWNrZHJvcENsaWNrID0gZmFsc2VcbiAgICB0aGlzLmZpeGVkQ29udGVudCA9ICcubmF2YmFyLWZpeGVkLXRvcCwgLm5hdmJhci1maXhlZC1ib3R0b20nXG5cbiAgICBpZiAodGhpcy5vcHRpb25zLnJlbW90ZSkge1xuICAgICAgdGhpcy4kZWxlbWVudFxuICAgICAgICAuZmluZCgnLm1vZGFsLWNvbnRlbnQnKVxuICAgICAgICAubG9hZCh0aGlzLm9wdGlvbnMucmVtb3RlLCAkLnByb3h5KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ2xvYWRlZC5icy5tb2RhbCcpXG4gICAgICAgIH0sIHRoaXMpKVxuICAgIH1cbiAgfVxuXG4gIE1vZGFsLlZFUlNJT04gPSAnMy40LjEnXG5cbiAgTW9kYWwuVFJBTlNJVElPTl9EVVJBVElPTiA9IDMwMFxuICBNb2RhbC5CQUNLRFJPUF9UUkFOU0lUSU9OX0RVUkFUSU9OID0gMTUwXG5cbiAgTW9kYWwuREVGQVVMVFMgPSB7XG4gICAgYmFja2Ryb3A6IHRydWUsXG4gICAga2V5Ym9hcmQ6IHRydWUsXG4gICAgc2hvdzogdHJ1ZVxuICB9XG5cbiAgTW9kYWwucHJvdG90eXBlLnRvZ2dsZSA9IGZ1bmN0aW9uIChfcmVsYXRlZFRhcmdldCkge1xuICAgIHJldHVybiB0aGlzLmlzU2hvd24gPyB0aGlzLmhpZGUoKSA6IHRoaXMuc2hvdyhfcmVsYXRlZFRhcmdldClcbiAgfVxuXG4gIE1vZGFsLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gKF9yZWxhdGVkVGFyZ2V0KSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzXG4gICAgdmFyIGUgPSAkLkV2ZW50KCdzaG93LmJzLm1vZGFsJywgeyByZWxhdGVkVGFyZ2V0OiBfcmVsYXRlZFRhcmdldCB9KVxuXG4gICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKGUpXG5cbiAgICBpZiAodGhpcy5pc1Nob3duIHx8IGUuaXNEZWZhdWx0UHJldmVudGVkKCkpIHJldHVyblxuXG4gICAgdGhpcy5pc1Nob3duID0gdHJ1ZVxuXG4gICAgdGhpcy5jaGVja1Njcm9sbGJhcigpXG4gICAgdGhpcy5zZXRTY3JvbGxiYXIoKVxuICAgIHRoaXMuJGJvZHkuYWRkQ2xhc3MoJ21vZGFsLW9wZW4nKVxuXG4gICAgdGhpcy5lc2NhcGUoKVxuICAgIHRoaXMucmVzaXplKClcblxuICAgIHRoaXMuJGVsZW1lbnQub24oJ2NsaWNrLmRpc21pc3MuYnMubW9kYWwnLCAnW2RhdGEtZGlzbWlzcz1cIm1vZGFsXCJdJywgJC5wcm94eSh0aGlzLmhpZGUsIHRoaXMpKVxuXG4gICAgdGhpcy4kZGlhbG9nLm9uKCdtb3VzZWRvd24uZGlzbWlzcy5icy5tb2RhbCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoYXQuJGVsZW1lbnQub25lKCdtb3VzZXVwLmRpc21pc3MuYnMubW9kYWwnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICBpZiAoJChlLnRhcmdldCkuaXModGhhdC4kZWxlbWVudCkpIHRoYXQuaWdub3JlQmFja2Ryb3BDbGljayA9IHRydWVcbiAgICAgIH0pXG4gICAgfSlcblxuICAgIHRoaXMuYmFja2Ryb3AoZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIHRyYW5zaXRpb24gPSAkLnN1cHBvcnQudHJhbnNpdGlvbiAmJiB0aGF0LiRlbGVtZW50Lmhhc0NsYXNzKCdmYWRlJylcblxuICAgICAgaWYgKCF0aGF0LiRlbGVtZW50LnBhcmVudCgpLmxlbmd0aCkge1xuICAgICAgICB0aGF0LiRlbGVtZW50LmFwcGVuZFRvKHRoYXQuJGJvZHkpIC8vIGRvbid0IG1vdmUgbW9kYWxzIGRvbSBwb3NpdGlvblxuICAgICAgfVxuXG4gICAgICB0aGF0LiRlbGVtZW50XG4gICAgICAgIC5zaG93KClcbiAgICAgICAgLnNjcm9sbFRvcCgwKVxuXG4gICAgICB0aGF0LmFkanVzdERpYWxvZygpXG5cbiAgICAgIGlmICh0cmFuc2l0aW9uKSB7XG4gICAgICAgIHRoYXQuJGVsZW1lbnRbMF0ub2Zmc2V0V2lkdGggLy8gZm9yY2UgcmVmbG93XG4gICAgICB9XG5cbiAgICAgIHRoYXQuJGVsZW1lbnQuYWRkQ2xhc3MoJ2luJylcblxuICAgICAgdGhhdC5lbmZvcmNlRm9jdXMoKVxuXG4gICAgICB2YXIgZSA9ICQuRXZlbnQoJ3Nob3duLmJzLm1vZGFsJywgeyByZWxhdGVkVGFyZ2V0OiBfcmVsYXRlZFRhcmdldCB9KVxuXG4gICAgICB0cmFuc2l0aW9uID9cbiAgICAgICAgdGhhdC4kZGlhbG9nIC8vIHdhaXQgZm9yIG1vZGFsIHRvIHNsaWRlIGluXG4gICAgICAgICAgLm9uZSgnYnNUcmFuc2l0aW9uRW5kJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhhdC4kZWxlbWVudC50cmlnZ2VyKCdmb2N1cycpLnRyaWdnZXIoZSlcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5lbXVsYXRlVHJhbnNpdGlvbkVuZChNb2RhbC5UUkFOU0lUSU9OX0RVUkFUSU9OKSA6XG4gICAgICAgIHRoYXQuJGVsZW1lbnQudHJpZ2dlcignZm9jdXMnKS50cmlnZ2VyKGUpXG4gICAgfSlcbiAgfVxuXG4gIE1vZGFsLnByb3RvdHlwZS5oaWRlID0gZnVuY3Rpb24gKGUpIHtcbiAgICBpZiAoZSkgZS5wcmV2ZW50RGVmYXVsdCgpXG5cbiAgICBlID0gJC5FdmVudCgnaGlkZS5icy5tb2RhbCcpXG5cbiAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoZSlcblxuICAgIGlmICghdGhpcy5pc1Nob3duIHx8IGUuaXNEZWZhdWx0UHJldmVudGVkKCkpIHJldHVyblxuXG4gICAgdGhpcy5pc1Nob3duID0gZmFsc2VcblxuICAgIHRoaXMuZXNjYXBlKClcbiAgICB0aGlzLnJlc2l6ZSgpXG5cbiAgICAkKGRvY3VtZW50KS5vZmYoJ2ZvY3VzaW4uYnMubW9kYWwnKVxuXG4gICAgdGhpcy4kZWxlbWVudFxuICAgICAgLnJlbW92ZUNsYXNzKCdpbicpXG4gICAgICAub2ZmKCdjbGljay5kaXNtaXNzLmJzLm1vZGFsJylcbiAgICAgIC5vZmYoJ21vdXNldXAuZGlzbWlzcy5icy5tb2RhbCcpXG5cbiAgICB0aGlzLiRkaWFsb2cub2ZmKCdtb3VzZWRvd24uZGlzbWlzcy5icy5tb2RhbCcpXG5cbiAgICAkLnN1cHBvcnQudHJhbnNpdGlvbiAmJiB0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKCdmYWRlJykgP1xuICAgICAgdGhpcy4kZWxlbWVudFxuICAgICAgICAub25lKCdic1RyYW5zaXRpb25FbmQnLCAkLnByb3h5KHRoaXMuaGlkZU1vZGFsLCB0aGlzKSlcbiAgICAgICAgLmVtdWxhdGVUcmFuc2l0aW9uRW5kKE1vZGFsLlRSQU5TSVRJT05fRFVSQVRJT04pIDpcbiAgICAgIHRoaXMuaGlkZU1vZGFsKClcbiAgfVxuXG4gIE1vZGFsLnByb3RvdHlwZS5lbmZvcmNlRm9jdXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgJChkb2N1bWVudClcbiAgICAgIC5vZmYoJ2ZvY3VzaW4uYnMubW9kYWwnKSAvLyBndWFyZCBhZ2FpbnN0IGluZmluaXRlIGZvY3VzIGxvb3BcbiAgICAgIC5vbignZm9jdXNpbi5icy5tb2RhbCcsICQucHJveHkoZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgaWYgKGRvY3VtZW50ICE9PSBlLnRhcmdldCAmJlxuICAgICAgICAgIHRoaXMuJGVsZW1lbnRbMF0gIT09IGUudGFyZ2V0ICYmXG4gICAgICAgICAgIXRoaXMuJGVsZW1lbnQuaGFzKGUudGFyZ2V0KS5sZW5ndGgpIHtcbiAgICAgICAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ2ZvY3VzJylcbiAgICAgICAgfVxuICAgICAgfSwgdGhpcykpXG4gIH1cblxuICBNb2RhbC5wcm90b3R5cGUuZXNjYXBlID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLmlzU2hvd24gJiYgdGhpcy5vcHRpb25zLmtleWJvYXJkKSB7XG4gICAgICB0aGlzLiRlbGVtZW50Lm9uKCdrZXlkb3duLmRpc21pc3MuYnMubW9kYWwnLCAkLnByb3h5KGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGUud2hpY2ggPT0gMjcgJiYgdGhpcy5oaWRlKClcbiAgICAgIH0sIHRoaXMpKVxuICAgIH0gZWxzZSBpZiAoIXRoaXMuaXNTaG93bikge1xuICAgICAgdGhpcy4kZWxlbWVudC5vZmYoJ2tleWRvd24uZGlzbWlzcy5icy5tb2RhbCcpXG4gICAgfVxuICB9XG5cbiAgTW9kYWwucHJvdG90eXBlLnJlc2l6ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5pc1Nob3duKSB7XG4gICAgICAkKHdpbmRvdykub24oJ3Jlc2l6ZS5icy5tb2RhbCcsICQucHJveHkodGhpcy5oYW5kbGVVcGRhdGUsIHRoaXMpKVxuICAgIH0gZWxzZSB7XG4gICAgICAkKHdpbmRvdykub2ZmKCdyZXNpemUuYnMubW9kYWwnKVxuICAgIH1cbiAgfVxuXG4gIE1vZGFsLnByb3RvdHlwZS5oaWRlTW9kYWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzXG4gICAgdGhpcy4kZWxlbWVudC5oaWRlKClcbiAgICB0aGlzLmJhY2tkcm9wKGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoYXQuJGJvZHkucmVtb3ZlQ2xhc3MoJ21vZGFsLW9wZW4nKVxuICAgICAgdGhhdC5yZXNldEFkanVzdG1lbnRzKClcbiAgICAgIHRoYXQucmVzZXRTY3JvbGxiYXIoKVxuICAgICAgdGhhdC4kZWxlbWVudC50cmlnZ2VyKCdoaWRkZW4uYnMubW9kYWwnKVxuICAgIH0pXG4gIH1cblxuICBNb2RhbC5wcm90b3R5cGUucmVtb3ZlQmFja2Ryb3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy4kYmFja2Ryb3AgJiYgdGhpcy4kYmFja2Ryb3AucmVtb3ZlKClcbiAgICB0aGlzLiRiYWNrZHJvcCA9IG51bGxcbiAgfVxuXG4gIE1vZGFsLnByb3RvdHlwZS5iYWNrZHJvcCA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgIHZhciB0aGF0ID0gdGhpc1xuICAgIHZhciBhbmltYXRlID0gdGhpcy4kZWxlbWVudC5oYXNDbGFzcygnZmFkZScpID8gJ2ZhZGUnIDogJydcblxuICAgIGlmICh0aGlzLmlzU2hvd24gJiYgdGhpcy5vcHRpb25zLmJhY2tkcm9wKSB7XG4gICAgICB2YXIgZG9BbmltYXRlID0gJC5zdXBwb3J0LnRyYW5zaXRpb24gJiYgYW5pbWF0ZVxuXG4gICAgICB0aGlzLiRiYWNrZHJvcCA9ICQoZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JykpXG4gICAgICAgIC5hZGRDbGFzcygnbW9kYWwtYmFja2Ryb3AgJyArIGFuaW1hdGUpXG4gICAgICAgIC5hcHBlbmRUbyh0aGlzLiRib2R5KVxuXG4gICAgICB0aGlzLiRlbGVtZW50Lm9uKCdjbGljay5kaXNtaXNzLmJzLm1vZGFsJywgJC5wcm94eShmdW5jdGlvbiAoZSkge1xuICAgICAgICBpZiAodGhpcy5pZ25vcmVCYWNrZHJvcENsaWNrKSB7XG4gICAgICAgICAgdGhpcy5pZ25vcmVCYWNrZHJvcENsaWNrID0gZmFsc2VcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBpZiAoZS50YXJnZXQgIT09IGUuY3VycmVudFRhcmdldCkgcmV0dXJuXG4gICAgICAgIHRoaXMub3B0aW9ucy5iYWNrZHJvcCA9PSAnc3RhdGljJ1xuICAgICAgICAgID8gdGhpcy4kZWxlbWVudFswXS5mb2N1cygpXG4gICAgICAgICAgOiB0aGlzLmhpZGUoKVxuICAgICAgfSwgdGhpcykpXG5cbiAgICAgIGlmIChkb0FuaW1hdGUpIHRoaXMuJGJhY2tkcm9wWzBdLm9mZnNldFdpZHRoIC8vIGZvcmNlIHJlZmxvd1xuXG4gICAgICB0aGlzLiRiYWNrZHJvcC5hZGRDbGFzcygnaW4nKVxuXG4gICAgICBpZiAoIWNhbGxiYWNrKSByZXR1cm5cblxuICAgICAgZG9BbmltYXRlID9cbiAgICAgICAgdGhpcy4kYmFja2Ryb3BcbiAgICAgICAgICAub25lKCdic1RyYW5zaXRpb25FbmQnLCBjYWxsYmFjaylcbiAgICAgICAgICAuZW11bGF0ZVRyYW5zaXRpb25FbmQoTW9kYWwuQkFDS0RST1BfVFJBTlNJVElPTl9EVVJBVElPTikgOlxuICAgICAgICBjYWxsYmFjaygpXG5cbiAgICB9IGVsc2UgaWYgKCF0aGlzLmlzU2hvd24gJiYgdGhpcy4kYmFja2Ryb3ApIHtcbiAgICAgIHRoaXMuJGJhY2tkcm9wLnJlbW92ZUNsYXNzKCdpbicpXG5cbiAgICAgIHZhciBjYWxsYmFja1JlbW92ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhhdC5yZW1vdmVCYWNrZHJvcCgpXG4gICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKClcbiAgICAgIH1cbiAgICAgICQuc3VwcG9ydC50cmFuc2l0aW9uICYmIHRoaXMuJGVsZW1lbnQuaGFzQ2xhc3MoJ2ZhZGUnKSA/XG4gICAgICAgIHRoaXMuJGJhY2tkcm9wXG4gICAgICAgICAgLm9uZSgnYnNUcmFuc2l0aW9uRW5kJywgY2FsbGJhY2tSZW1vdmUpXG4gICAgICAgICAgLmVtdWxhdGVUcmFuc2l0aW9uRW5kKE1vZGFsLkJBQ0tEUk9QX1RSQU5TSVRJT05fRFVSQVRJT04pIDpcbiAgICAgICAgY2FsbGJhY2tSZW1vdmUoKVxuXG4gICAgfSBlbHNlIGlmIChjYWxsYmFjaykge1xuICAgICAgY2FsbGJhY2soKVxuICAgIH1cbiAgfVxuXG4gIC8vIHRoZXNlIGZvbGxvd2luZyBtZXRob2RzIGFyZSB1c2VkIHRvIGhhbmRsZSBvdmVyZmxvd2luZyBtb2RhbHNcblxuICBNb2RhbC5wcm90b3R5cGUuaGFuZGxlVXBkYXRlID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuYWRqdXN0RGlhbG9nKClcbiAgfVxuXG4gIE1vZGFsLnByb3RvdHlwZS5hZGp1c3REaWFsb2cgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG1vZGFsSXNPdmVyZmxvd2luZyA9IHRoaXMuJGVsZW1lbnRbMF0uc2Nyb2xsSGVpZ2h0ID4gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodFxuXG4gICAgdGhpcy4kZWxlbWVudC5jc3Moe1xuICAgICAgcGFkZGluZ0xlZnQ6ICF0aGlzLmJvZHlJc092ZXJmbG93aW5nICYmIG1vZGFsSXNPdmVyZmxvd2luZyA/IHRoaXMuc2Nyb2xsYmFyV2lkdGggOiAnJyxcbiAgICAgIHBhZGRpbmdSaWdodDogdGhpcy5ib2R5SXNPdmVyZmxvd2luZyAmJiAhbW9kYWxJc092ZXJmbG93aW5nID8gdGhpcy5zY3JvbGxiYXJXaWR0aCA6ICcnXG4gICAgfSlcbiAgfVxuXG4gIE1vZGFsLnByb3RvdHlwZS5yZXNldEFkanVzdG1lbnRzID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuJGVsZW1lbnQuY3NzKHtcbiAgICAgIHBhZGRpbmdMZWZ0OiAnJyxcbiAgICAgIHBhZGRpbmdSaWdodDogJydcbiAgICB9KVxuICB9XG5cbiAgTW9kYWwucHJvdG90eXBlLmNoZWNrU2Nyb2xsYmFyID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBmdWxsV2luZG93V2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aFxuICAgIGlmICghZnVsbFdpbmRvd1dpZHRoKSB7IC8vIHdvcmthcm91bmQgZm9yIG1pc3Npbmcgd2luZG93LmlubmVyV2lkdGggaW4gSUU4XG4gICAgICB2YXIgZG9jdW1lbnRFbGVtZW50UmVjdCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgICAgZnVsbFdpbmRvd1dpZHRoID0gZG9jdW1lbnRFbGVtZW50UmVjdC5yaWdodCAtIE1hdGguYWJzKGRvY3VtZW50RWxlbWVudFJlY3QubGVmdClcbiAgICB9XG4gICAgdGhpcy5ib2R5SXNPdmVyZmxvd2luZyA9IGRvY3VtZW50LmJvZHkuY2xpZW50V2lkdGggPCBmdWxsV2luZG93V2lkdGhcbiAgICB0aGlzLnNjcm9sbGJhcldpZHRoID0gdGhpcy5tZWFzdXJlU2Nyb2xsYmFyKClcbiAgfVxuXG4gIE1vZGFsLnByb3RvdHlwZS5zZXRTY3JvbGxiYXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGJvZHlQYWQgPSBwYXJzZUludCgodGhpcy4kYm9keS5jc3MoJ3BhZGRpbmctcmlnaHQnKSB8fCAwKSwgMTApXG4gICAgdGhpcy5vcmlnaW5hbEJvZHlQYWQgPSBkb2N1bWVudC5ib2R5LnN0eWxlLnBhZGRpbmdSaWdodCB8fCAnJ1xuICAgIHZhciBzY3JvbGxiYXJXaWR0aCA9IHRoaXMuc2Nyb2xsYmFyV2lkdGhcbiAgICBpZiAodGhpcy5ib2R5SXNPdmVyZmxvd2luZykge1xuICAgICAgdGhpcy4kYm9keS5jc3MoJ3BhZGRpbmctcmlnaHQnLCBib2R5UGFkICsgc2Nyb2xsYmFyV2lkdGgpXG4gICAgICAkKHRoaXMuZml4ZWRDb250ZW50KS5lYWNoKGZ1bmN0aW9uIChpbmRleCwgZWxlbWVudCkge1xuICAgICAgICB2YXIgYWN0dWFsUGFkZGluZyA9IGVsZW1lbnQuc3R5bGUucGFkZGluZ1JpZ2h0XG4gICAgICAgIHZhciBjYWxjdWxhdGVkUGFkZGluZyA9ICQoZWxlbWVudCkuY3NzKCdwYWRkaW5nLXJpZ2h0JylcbiAgICAgICAgJChlbGVtZW50KVxuICAgICAgICAgIC5kYXRhKCdwYWRkaW5nLXJpZ2h0JywgYWN0dWFsUGFkZGluZylcbiAgICAgICAgICAuY3NzKCdwYWRkaW5nLXJpZ2h0JywgcGFyc2VGbG9hdChjYWxjdWxhdGVkUGFkZGluZykgKyBzY3JvbGxiYXJXaWR0aCArICdweCcpXG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIE1vZGFsLnByb3RvdHlwZS5yZXNldFNjcm9sbGJhciA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLiRib2R5LmNzcygncGFkZGluZy1yaWdodCcsIHRoaXMub3JpZ2luYWxCb2R5UGFkKVxuICAgICQodGhpcy5maXhlZENvbnRlbnQpLmVhY2goZnVuY3Rpb24gKGluZGV4LCBlbGVtZW50KSB7XG4gICAgICB2YXIgcGFkZGluZyA9ICQoZWxlbWVudCkuZGF0YSgncGFkZGluZy1yaWdodCcpXG4gICAgICAkKGVsZW1lbnQpLnJlbW92ZURhdGEoJ3BhZGRpbmctcmlnaHQnKVxuICAgICAgZWxlbWVudC5zdHlsZS5wYWRkaW5nUmlnaHQgPSBwYWRkaW5nID8gcGFkZGluZyA6ICcnXG4gICAgfSlcbiAgfVxuXG4gIE1vZGFsLnByb3RvdHlwZS5tZWFzdXJlU2Nyb2xsYmFyID0gZnVuY3Rpb24gKCkgeyAvLyB0aHggd2Fsc2hcbiAgICB2YXIgc2Nyb2xsRGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICBzY3JvbGxEaXYuY2xhc3NOYW1lID0gJ21vZGFsLXNjcm9sbGJhci1tZWFzdXJlJ1xuICAgIHRoaXMuJGJvZHkuYXBwZW5kKHNjcm9sbERpdilcbiAgICB2YXIgc2Nyb2xsYmFyV2lkdGggPSBzY3JvbGxEaXYub2Zmc2V0V2lkdGggLSBzY3JvbGxEaXYuY2xpZW50V2lkdGhcbiAgICB0aGlzLiRib2R5WzBdLnJlbW92ZUNoaWxkKHNjcm9sbERpdilcbiAgICByZXR1cm4gc2Nyb2xsYmFyV2lkdGhcbiAgfVxuXG5cbiAgLy8gTU9EQUwgUExVR0lOIERFRklOSVRJT05cbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT1cblxuICBmdW5jdGlvbiBQbHVnaW4ob3B0aW9uLCBfcmVsYXRlZFRhcmdldCkge1xuICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgdmFyICR0aGlzID0gJCh0aGlzKVxuICAgICAgdmFyIGRhdGEgPSAkdGhpcy5kYXRhKCdicy5tb2RhbCcpXG4gICAgICB2YXIgb3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBNb2RhbC5ERUZBVUxUUywgJHRoaXMuZGF0YSgpLCB0eXBlb2Ygb3B0aW9uID09ICdvYmplY3QnICYmIG9wdGlvbilcblxuICAgICAgaWYgKCFkYXRhKSAkdGhpcy5kYXRhKCdicy5tb2RhbCcsIChkYXRhID0gbmV3IE1vZGFsKHRoaXMsIG9wdGlvbnMpKSlcbiAgICAgIGlmICh0eXBlb2Ygb3B0aW9uID09ICdzdHJpbmcnKSBkYXRhW29wdGlvbl0oX3JlbGF0ZWRUYXJnZXQpXG4gICAgICBlbHNlIGlmIChvcHRpb25zLnNob3cpIGRhdGEuc2hvdyhfcmVsYXRlZFRhcmdldClcbiAgICB9KVxuICB9XG5cbiAgdmFyIG9sZCA9ICQuZm4ubW9kYWxcblxuICAkLmZuLm1vZGFsID0gUGx1Z2luXG4gICQuZm4ubW9kYWwuQ29uc3RydWN0b3IgPSBNb2RhbFxuXG5cbiAgLy8gTU9EQUwgTk8gQ09ORkxJQ1RcbiAgLy8gPT09PT09PT09PT09PT09PT1cblxuICAkLmZuLm1vZGFsLm5vQ29uZmxpY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgJC5mbi5tb2RhbCA9IG9sZFxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuXG4gIC8vIE1PREFMIERBVEEtQVBJXG4gIC8vID09PT09PT09PT09PT09XG5cbiAgJChkb2N1bWVudCkub24oJ2NsaWNrLmJzLm1vZGFsLmRhdGEtYXBpJywgJ1tkYXRhLXRvZ2dsZT1cIm1vZGFsXCJdJywgZnVuY3Rpb24gKGUpIHtcbiAgICB2YXIgJHRoaXMgPSAkKHRoaXMpXG4gICAgdmFyIGhyZWYgPSAkdGhpcy5hdHRyKCdocmVmJylcbiAgICB2YXIgdGFyZ2V0ID0gJHRoaXMuYXR0cignZGF0YS10YXJnZXQnKSB8fFxuICAgICAgKGhyZWYgJiYgaHJlZi5yZXBsYWNlKC8uKig/PSNbXlxcc10rJCkvLCAnJykpIC8vIHN0cmlwIGZvciBpZTdcblxuICAgIHZhciAkdGFyZ2V0ID0gJChkb2N1bWVudCkuZmluZCh0YXJnZXQpXG4gICAgdmFyIG9wdGlvbiA9ICR0YXJnZXQuZGF0YSgnYnMubW9kYWwnKSA/ICd0b2dnbGUnIDogJC5leHRlbmQoeyByZW1vdGU6ICEvIy8udGVzdChocmVmKSAmJiBocmVmIH0sICR0YXJnZXQuZGF0YSgpLCAkdGhpcy5kYXRhKCkpXG5cbiAgICBpZiAoJHRoaXMuaXMoJ2EnKSkgZS5wcmV2ZW50RGVmYXVsdCgpXG5cbiAgICAkdGFyZ2V0Lm9uZSgnc2hvdy5icy5tb2RhbCcsIGZ1bmN0aW9uIChzaG93RXZlbnQpIHtcbiAgICAgIGlmIChzaG93RXZlbnQuaXNEZWZhdWx0UHJldmVudGVkKCkpIHJldHVybiAvLyBvbmx5IHJlZ2lzdGVyIGZvY3VzIHJlc3RvcmVyIGlmIG1vZGFsIHdpbGwgYWN0dWFsbHkgZ2V0IHNob3duXG4gICAgICAkdGFyZ2V0Lm9uZSgnaGlkZGVuLmJzLm1vZGFsJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAkdGhpcy5pcygnOnZpc2libGUnKSAmJiAkdGhpcy50cmlnZ2VyKCdmb2N1cycpXG4gICAgICB9KVxuICAgIH0pXG4gICAgUGx1Z2luLmNhbGwoJHRhcmdldCwgb3B0aW9uLCB0aGlzKVxuICB9KVxuXG59KGpRdWVyeSk7XG5cbi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogQm9vdHN0cmFwOiB0b29sdGlwLmpzIHYzLjQuMVxuICogaHR0cHM6Ly9nZXRib290c3RyYXAuY29tL2RvY3MvMy40L2phdmFzY3JpcHQvI3Rvb2x0aXBcbiAqIEluc3BpcmVkIGJ5IHRoZSBvcmlnaW5hbCBqUXVlcnkudGlwc3kgYnkgSmFzb24gRnJhbWVcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogQ29weXJpZ2h0IDIwMTEtMjAxOSBUd2l0dGVyLCBJbmMuXG4gKiBMaWNlbnNlZCB1bmRlciBNSVQgKGh0dHBzOi8vZ2l0aHViLmNvbS90d2JzL2Jvb3RzdHJhcC9ibG9iL21hc3Rlci9MSUNFTlNFKVxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovXG5cbitmdW5jdGlvbiAoJCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgdmFyIERJU0FMTE9XRURfQVRUUklCVVRFUyA9IFsnc2FuaXRpemUnLCAnd2hpdGVMaXN0JywgJ3Nhbml0aXplRm4nXVxuXG4gIHZhciB1cmlBdHRycyA9IFtcbiAgICAnYmFja2dyb3VuZCcsXG4gICAgJ2NpdGUnLFxuICAgICdocmVmJyxcbiAgICAnaXRlbXR5cGUnLFxuICAgICdsb25nZGVzYycsXG4gICAgJ3Bvc3RlcicsXG4gICAgJ3NyYycsXG4gICAgJ3hsaW5rOmhyZWYnXG4gIF1cblxuICB2YXIgQVJJQV9BVFRSSUJVVEVfUEFUVEVSTiA9IC9eYXJpYS1bXFx3LV0qJC9pXG5cbiAgdmFyIERlZmF1bHRXaGl0ZWxpc3QgPSB7XG4gICAgLy8gR2xvYmFsIGF0dHJpYnV0ZXMgYWxsb3dlZCBvbiBhbnkgc3VwcGxpZWQgZWxlbWVudCBiZWxvdy5cbiAgICAnKic6IFsnY2xhc3MnLCAnZGlyJywgJ2lkJywgJ2xhbmcnLCAncm9sZScsIEFSSUFfQVRUUklCVVRFX1BBVFRFUk5dLFxuICAgIGE6IFsndGFyZ2V0JywgJ2hyZWYnLCAndGl0bGUnLCAncmVsJ10sXG4gICAgYXJlYTogW10sXG4gICAgYjogW10sXG4gICAgYnI6IFtdLFxuICAgIGNvbDogW10sXG4gICAgY29kZTogW10sXG4gICAgZGl2OiBbXSxcbiAgICBlbTogW10sXG4gICAgaHI6IFtdLFxuICAgIGgxOiBbXSxcbiAgICBoMjogW10sXG4gICAgaDM6IFtdLFxuICAgIGg0OiBbXSxcbiAgICBoNTogW10sXG4gICAgaDY6IFtdLFxuICAgIGk6IFtdLFxuICAgIGltZzogWydzcmMnLCAnYWx0JywgJ3RpdGxlJywgJ3dpZHRoJywgJ2hlaWdodCddLFxuICAgIGxpOiBbXSxcbiAgICBvbDogW10sXG4gICAgcDogW10sXG4gICAgcHJlOiBbXSxcbiAgICBzOiBbXSxcbiAgICBzbWFsbDogW10sXG4gICAgc3BhbjogW10sXG4gICAgc3ViOiBbXSxcbiAgICBzdXA6IFtdLFxuICAgIHN0cm9uZzogW10sXG4gICAgdTogW10sXG4gICAgdWw6IFtdXG4gIH1cblxuICAvKipcbiAgICogQSBwYXR0ZXJuIHRoYXQgcmVjb2duaXplcyBhIGNvbW1vbmx5IHVzZWZ1bCBzdWJzZXQgb2YgVVJMcyB0aGF0IGFyZSBzYWZlLlxuICAgKlxuICAgKiBTaG91dG91dCB0byBBbmd1bGFyIDcgaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvYW5ndWxhci9ibG9iLzcuMi40L3BhY2thZ2VzL2NvcmUvc3JjL3Nhbml0aXphdGlvbi91cmxfc2FuaXRpemVyLnRzXG4gICAqL1xuICB2YXIgU0FGRV9VUkxfUEFUVEVSTiA9IC9eKD86KD86aHR0cHM/fG1haWx0b3xmdHB8dGVsfGZpbGUpOnxbXiY6Lz8jXSooPzpbLz8jXXwkKSkvZ2lcblxuICAvKipcbiAgICogQSBwYXR0ZXJuIHRoYXQgbWF0Y2hlcyBzYWZlIGRhdGEgVVJMcy4gT25seSBtYXRjaGVzIGltYWdlLCB2aWRlbyBhbmQgYXVkaW8gdHlwZXMuXG4gICAqXG4gICAqIFNob3V0b3V0IHRvIEFuZ3VsYXIgNyBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9hbmd1bGFyL2Jsb2IvNy4yLjQvcGFja2FnZXMvY29yZS9zcmMvc2FuaXRpemF0aW9uL3VybF9zYW5pdGl6ZXIudHNcbiAgICovXG4gIHZhciBEQVRBX1VSTF9QQVRURVJOID0gL15kYXRhOig/OmltYWdlXFwvKD86Ym1wfGdpZnxqcGVnfGpwZ3xwbmd8dGlmZnx3ZWJwKXx2aWRlb1xcLyg/Om1wZWd8bXA0fG9nZ3x3ZWJtKXxhdWRpb1xcLyg/Om1wM3xvZ2F8b2dnfG9wdXMpKTtiYXNlNjQsW2EtejAtOSsvXSs9KiQvaVxuXG4gIGZ1bmN0aW9uIGFsbG93ZWRBdHRyaWJ1dGUoYXR0ciwgYWxsb3dlZEF0dHJpYnV0ZUxpc3QpIHtcbiAgICB2YXIgYXR0ck5hbWUgPSBhdHRyLm5vZGVOYW1lLnRvTG93ZXJDYXNlKClcblxuICAgIGlmICgkLmluQXJyYXkoYXR0ck5hbWUsIGFsbG93ZWRBdHRyaWJ1dGVMaXN0KSAhPT0gLTEpIHtcbiAgICAgIGlmICgkLmluQXJyYXkoYXR0ck5hbWUsIHVyaUF0dHJzKSAhPT0gLTEpIHtcbiAgICAgICAgcmV0dXJuIEJvb2xlYW4oYXR0ci5ub2RlVmFsdWUubWF0Y2goU0FGRV9VUkxfUEFUVEVSTikgfHwgYXR0ci5ub2RlVmFsdWUubWF0Y2goREFUQV9VUkxfUEFUVEVSTikpXG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuXG4gICAgdmFyIHJlZ0V4cCA9ICQoYWxsb3dlZEF0dHJpYnV0ZUxpc3QpLmZpbHRlcihmdW5jdGlvbiAoaW5kZXgsIHZhbHVlKSB7XG4gICAgICByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBSZWdFeHBcbiAgICB9KVxuXG4gICAgLy8gQ2hlY2sgaWYgYSByZWd1bGFyIGV4cHJlc3Npb24gdmFsaWRhdGVzIHRoZSBhdHRyaWJ1dGUuXG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSByZWdFeHAubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICBpZiAoYXR0ck5hbWUubWF0Y2gocmVnRXhwW2ldKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBmYWxzZVxuICB9XG5cbiAgZnVuY3Rpb24gc2FuaXRpemVIdG1sKHVuc2FmZUh0bWwsIHdoaXRlTGlzdCwgc2FuaXRpemVGbikge1xuICAgIGlmICh1bnNhZmVIdG1sLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHVuc2FmZUh0bWxcbiAgICB9XG5cbiAgICBpZiAoc2FuaXRpemVGbiAmJiB0eXBlb2Ygc2FuaXRpemVGbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuIHNhbml0aXplRm4odW5zYWZlSHRtbClcbiAgICB9XG5cbiAgICAvLyBJRSA4IGFuZCBiZWxvdyBkb24ndCBzdXBwb3J0IGNyZWF0ZUhUTUxEb2N1bWVudFxuICAgIGlmICghZG9jdW1lbnQuaW1wbGVtZW50YXRpb24gfHwgIWRvY3VtZW50LmltcGxlbWVudGF0aW9uLmNyZWF0ZUhUTUxEb2N1bWVudCkge1xuICAgICAgcmV0dXJuIHVuc2FmZUh0bWxcbiAgICB9XG5cbiAgICB2YXIgY3JlYXRlZERvY3VtZW50ID0gZG9jdW1lbnQuaW1wbGVtZW50YXRpb24uY3JlYXRlSFRNTERvY3VtZW50KCdzYW5pdGl6YXRpb24nKVxuICAgIGNyZWF0ZWREb2N1bWVudC5ib2R5LmlubmVySFRNTCA9IHVuc2FmZUh0bWxcblxuICAgIHZhciB3aGl0ZWxpc3RLZXlzID0gJC5tYXAod2hpdGVMaXN0LCBmdW5jdGlvbiAoZWwsIGkpIHsgcmV0dXJuIGkgfSlcbiAgICB2YXIgZWxlbWVudHMgPSAkKGNyZWF0ZWREb2N1bWVudC5ib2R5KS5maW5kKCcqJylcblxuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBlbGVtZW50cy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgdmFyIGVsID0gZWxlbWVudHNbaV1cbiAgICAgIHZhciBlbE5hbWUgPSBlbC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpXG5cbiAgICAgIGlmICgkLmluQXJyYXkoZWxOYW1lLCB3aGl0ZWxpc3RLZXlzKSA9PT0gLTEpIHtcbiAgICAgICAgZWwucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChlbClcblxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICB2YXIgYXR0cmlidXRlTGlzdCA9ICQubWFwKGVsLmF0dHJpYnV0ZXMsIGZ1bmN0aW9uIChlbCkgeyByZXR1cm4gZWwgfSlcbiAgICAgIHZhciB3aGl0ZWxpc3RlZEF0dHJpYnV0ZXMgPSBbXS5jb25jYXQod2hpdGVMaXN0WycqJ10gfHwgW10sIHdoaXRlTGlzdFtlbE5hbWVdIHx8IFtdKVxuXG4gICAgICBmb3IgKHZhciBqID0gMCwgbGVuMiA9IGF0dHJpYnV0ZUxpc3QubGVuZ3RoOyBqIDwgbGVuMjsgaisrKSB7XG4gICAgICAgIGlmICghYWxsb3dlZEF0dHJpYnV0ZShhdHRyaWJ1dGVMaXN0W2pdLCB3aGl0ZWxpc3RlZEF0dHJpYnV0ZXMpKSB7XG4gICAgICAgICAgZWwucmVtb3ZlQXR0cmlidXRlKGF0dHJpYnV0ZUxpc3Rbal0ubm9kZU5hbWUpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gY3JlYXRlZERvY3VtZW50LmJvZHkuaW5uZXJIVE1MXG4gIH1cblxuICAvLyBUT09MVElQIFBVQkxJQyBDTEFTUyBERUZJTklUSU9OXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICB2YXIgVG9vbHRpcCA9IGZ1bmN0aW9uIChlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy50eXBlICAgICAgID0gbnVsbFxuICAgIHRoaXMub3B0aW9ucyAgICA9IG51bGxcbiAgICB0aGlzLmVuYWJsZWQgICAgPSBudWxsXG4gICAgdGhpcy50aW1lb3V0ICAgID0gbnVsbFxuICAgIHRoaXMuaG92ZXJTdGF0ZSA9IG51bGxcbiAgICB0aGlzLiRlbGVtZW50ICAgPSBudWxsXG4gICAgdGhpcy5pblN0YXRlICAgID0gbnVsbFxuXG4gICAgdGhpcy5pbml0KCd0b29sdGlwJywgZWxlbWVudCwgb3B0aW9ucylcbiAgfVxuXG4gIFRvb2x0aXAuVkVSU0lPTiAgPSAnMy40LjEnXG5cbiAgVG9vbHRpcC5UUkFOU0lUSU9OX0RVUkFUSU9OID0gMTUwXG5cbiAgVG9vbHRpcC5ERUZBVUxUUyA9IHtcbiAgICBhbmltYXRpb246IHRydWUsXG4gICAgcGxhY2VtZW50OiAndG9wJyxcbiAgICBzZWxlY3RvcjogZmFsc2UsXG4gICAgdGVtcGxhdGU6ICc8ZGl2IGNsYXNzPVwidG9vbHRpcFwiIHJvbGU9XCJ0b29sdGlwXCI+PGRpdiBjbGFzcz1cInRvb2x0aXAtYXJyb3dcIj48L2Rpdj48ZGl2IGNsYXNzPVwidG9vbHRpcC1pbm5lclwiPjwvZGl2PjwvZGl2PicsXG4gICAgdHJpZ2dlcjogJ2hvdmVyIGZvY3VzJyxcbiAgICB0aXRsZTogJycsXG4gICAgZGVsYXk6IDAsXG4gICAgaHRtbDogZmFsc2UsXG4gICAgY29udGFpbmVyOiBmYWxzZSxcbiAgICB2aWV3cG9ydDoge1xuICAgICAgc2VsZWN0b3I6ICdib2R5JyxcbiAgICAgIHBhZGRpbmc6IDBcbiAgICB9LFxuICAgIHNhbml0aXplIDogdHJ1ZSxcbiAgICBzYW5pdGl6ZUZuIDogbnVsbCxcbiAgICB3aGl0ZUxpc3QgOiBEZWZhdWx0V2hpdGVsaXN0XG4gIH1cblxuICBUb29sdGlwLnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24gKHR5cGUsIGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLmVuYWJsZWQgICA9IHRydWVcbiAgICB0aGlzLnR5cGUgICAgICA9IHR5cGVcbiAgICB0aGlzLiRlbGVtZW50ICA9ICQoZWxlbWVudClcbiAgICB0aGlzLm9wdGlvbnMgICA9IHRoaXMuZ2V0T3B0aW9ucyhvcHRpb25zKVxuICAgIHRoaXMuJHZpZXdwb3J0ID0gdGhpcy5vcHRpb25zLnZpZXdwb3J0ICYmICQoZG9jdW1lbnQpLmZpbmQoJC5pc0Z1bmN0aW9uKHRoaXMub3B0aW9ucy52aWV3cG9ydCkgPyB0aGlzLm9wdGlvbnMudmlld3BvcnQuY2FsbCh0aGlzLCB0aGlzLiRlbGVtZW50KSA6ICh0aGlzLm9wdGlvbnMudmlld3BvcnQuc2VsZWN0b3IgfHwgdGhpcy5vcHRpb25zLnZpZXdwb3J0KSlcbiAgICB0aGlzLmluU3RhdGUgICA9IHsgY2xpY2s6IGZhbHNlLCBob3ZlcjogZmFsc2UsIGZvY3VzOiBmYWxzZSB9XG5cbiAgICBpZiAodGhpcy4kZWxlbWVudFswXSBpbnN0YW5jZW9mIGRvY3VtZW50LmNvbnN0cnVjdG9yICYmICF0aGlzLm9wdGlvbnMuc2VsZWN0b3IpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignYHNlbGVjdG9yYCBvcHRpb24gbXVzdCBiZSBzcGVjaWZpZWQgd2hlbiBpbml0aWFsaXppbmcgJyArIHRoaXMudHlwZSArICcgb24gdGhlIHdpbmRvdy5kb2N1bWVudCBvYmplY3QhJylcbiAgICB9XG5cbiAgICB2YXIgdHJpZ2dlcnMgPSB0aGlzLm9wdGlvbnMudHJpZ2dlci5zcGxpdCgnICcpXG5cbiAgICBmb3IgKHZhciBpID0gdHJpZ2dlcnMubGVuZ3RoOyBpLS07KSB7XG4gICAgICB2YXIgdHJpZ2dlciA9IHRyaWdnZXJzW2ldXG5cbiAgICAgIGlmICh0cmlnZ2VyID09ICdjbGljaycpIHtcbiAgICAgICAgdGhpcy4kZWxlbWVudC5vbignY2xpY2suJyArIHRoaXMudHlwZSwgdGhpcy5vcHRpb25zLnNlbGVjdG9yLCAkLnByb3h5KHRoaXMudG9nZ2xlLCB0aGlzKSlcbiAgICAgIH0gZWxzZSBpZiAodHJpZ2dlciAhPSAnbWFudWFsJykge1xuICAgICAgICB2YXIgZXZlbnRJbiAgPSB0cmlnZ2VyID09ICdob3ZlcicgPyAnbW91c2VlbnRlcicgOiAnZm9jdXNpbidcbiAgICAgICAgdmFyIGV2ZW50T3V0ID0gdHJpZ2dlciA9PSAnaG92ZXInID8gJ21vdXNlbGVhdmUnIDogJ2ZvY3Vzb3V0J1xuXG4gICAgICAgIHRoaXMuJGVsZW1lbnQub24oZXZlbnRJbiAgKyAnLicgKyB0aGlzLnR5cGUsIHRoaXMub3B0aW9ucy5zZWxlY3RvciwgJC5wcm94eSh0aGlzLmVudGVyLCB0aGlzKSlcbiAgICAgICAgdGhpcy4kZWxlbWVudC5vbihldmVudE91dCArICcuJyArIHRoaXMudHlwZSwgdGhpcy5vcHRpb25zLnNlbGVjdG9yLCAkLnByb3h5KHRoaXMubGVhdmUsIHRoaXMpKVxuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMub3B0aW9ucy5zZWxlY3RvciA/XG4gICAgICAodGhpcy5fb3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCB0aGlzLm9wdGlvbnMsIHsgdHJpZ2dlcjogJ21hbnVhbCcsIHNlbGVjdG9yOiAnJyB9KSkgOlxuICAgICAgdGhpcy5maXhUaXRsZSgpXG4gIH1cblxuICBUb29sdGlwLnByb3RvdHlwZS5nZXREZWZhdWx0cyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gVG9vbHRpcC5ERUZBVUxUU1xuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUuZ2V0T3B0aW9ucyA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgdmFyIGRhdGFBdHRyaWJ1dGVzID0gdGhpcy4kZWxlbWVudC5kYXRhKClcblxuICAgIGZvciAodmFyIGRhdGFBdHRyIGluIGRhdGFBdHRyaWJ1dGVzKSB7XG4gICAgICBpZiAoZGF0YUF0dHJpYnV0ZXMuaGFzT3duUHJvcGVydHkoZGF0YUF0dHIpICYmICQuaW5BcnJheShkYXRhQXR0ciwgRElTQUxMT1dFRF9BVFRSSUJVVEVTKSAhPT0gLTEpIHtcbiAgICAgICAgZGVsZXRlIGRhdGFBdHRyaWJ1dGVzW2RhdGFBdHRyXVxuICAgICAgfVxuICAgIH1cblxuICAgIG9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgdGhpcy5nZXREZWZhdWx0cygpLCBkYXRhQXR0cmlidXRlcywgb3B0aW9ucylcblxuICAgIGlmIChvcHRpb25zLmRlbGF5ICYmIHR5cGVvZiBvcHRpb25zLmRlbGF5ID09ICdudW1iZXInKSB7XG4gICAgICBvcHRpb25zLmRlbGF5ID0ge1xuICAgICAgICBzaG93OiBvcHRpb25zLmRlbGF5LFxuICAgICAgICBoaWRlOiBvcHRpb25zLmRlbGF5XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbnMuc2FuaXRpemUpIHtcbiAgICAgIG9wdGlvbnMudGVtcGxhdGUgPSBzYW5pdGl6ZUh0bWwob3B0aW9ucy50ZW1wbGF0ZSwgb3B0aW9ucy53aGl0ZUxpc3QsIG9wdGlvbnMuc2FuaXRpemVGbilcbiAgICB9XG5cbiAgICByZXR1cm4gb3B0aW9uc1xuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUuZ2V0RGVsZWdhdGVPcHRpb25zID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBvcHRpb25zICA9IHt9XG4gICAgdmFyIGRlZmF1bHRzID0gdGhpcy5nZXREZWZhdWx0cygpXG5cbiAgICB0aGlzLl9vcHRpb25zICYmICQuZWFjaCh0aGlzLl9vcHRpb25zLCBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgaWYgKGRlZmF1bHRzW2tleV0gIT0gdmFsdWUpIG9wdGlvbnNba2V5XSA9IHZhbHVlXG4gICAgfSlcblxuICAgIHJldHVybiBvcHRpb25zXG4gIH1cblxuICBUb29sdGlwLnByb3RvdHlwZS5lbnRlciA9IGZ1bmN0aW9uIChvYmopIHtcbiAgICB2YXIgc2VsZiA9IG9iaiBpbnN0YW5jZW9mIHRoaXMuY29uc3RydWN0b3IgP1xuICAgICAgb2JqIDogJChvYmouY3VycmVudFRhcmdldCkuZGF0YSgnYnMuJyArIHRoaXMudHlwZSlcblxuICAgIGlmICghc2VsZikge1xuICAgICAgc2VsZiA9IG5ldyB0aGlzLmNvbnN0cnVjdG9yKG9iai5jdXJyZW50VGFyZ2V0LCB0aGlzLmdldERlbGVnYXRlT3B0aW9ucygpKVxuICAgICAgJChvYmouY3VycmVudFRhcmdldCkuZGF0YSgnYnMuJyArIHRoaXMudHlwZSwgc2VsZilcbiAgICB9XG5cbiAgICBpZiAob2JqIGluc3RhbmNlb2YgJC5FdmVudCkge1xuICAgICAgc2VsZi5pblN0YXRlW29iai50eXBlID09ICdmb2N1c2luJyA/ICdmb2N1cycgOiAnaG92ZXInXSA9IHRydWVcbiAgICB9XG5cbiAgICBpZiAoc2VsZi50aXAoKS5oYXNDbGFzcygnaW4nKSB8fCBzZWxmLmhvdmVyU3RhdGUgPT0gJ2luJykge1xuICAgICAgc2VsZi5ob3ZlclN0YXRlID0gJ2luJ1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgY2xlYXJUaW1lb3V0KHNlbGYudGltZW91dClcblxuICAgIHNlbGYuaG92ZXJTdGF0ZSA9ICdpbidcblxuICAgIGlmICghc2VsZi5vcHRpb25zLmRlbGF5IHx8ICFzZWxmLm9wdGlvbnMuZGVsYXkuc2hvdykgcmV0dXJuIHNlbGYuc2hvdygpXG5cbiAgICBzZWxmLnRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmIChzZWxmLmhvdmVyU3RhdGUgPT0gJ2luJykgc2VsZi5zaG93KClcbiAgICB9LCBzZWxmLm9wdGlvbnMuZGVsYXkuc2hvdylcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLmlzSW5TdGF0ZVRydWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgZm9yICh2YXIga2V5IGluIHRoaXMuaW5TdGF0ZSkge1xuICAgICAgaWYgKHRoaXMuaW5TdGF0ZVtrZXldKSByZXR1cm4gdHJ1ZVxuICAgIH1cblxuICAgIHJldHVybiBmYWxzZVxuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUubGVhdmUgPSBmdW5jdGlvbiAob2JqKSB7XG4gICAgdmFyIHNlbGYgPSBvYmogaW5zdGFuY2VvZiB0aGlzLmNvbnN0cnVjdG9yID9cbiAgICAgIG9iaiA6ICQob2JqLmN1cnJlbnRUYXJnZXQpLmRhdGEoJ2JzLicgKyB0aGlzLnR5cGUpXG5cbiAgICBpZiAoIXNlbGYpIHtcbiAgICAgIHNlbGYgPSBuZXcgdGhpcy5jb25zdHJ1Y3RvcihvYmouY3VycmVudFRhcmdldCwgdGhpcy5nZXREZWxlZ2F0ZU9wdGlvbnMoKSlcbiAgICAgICQob2JqLmN1cnJlbnRUYXJnZXQpLmRhdGEoJ2JzLicgKyB0aGlzLnR5cGUsIHNlbGYpXG4gICAgfVxuXG4gICAgaWYgKG9iaiBpbnN0YW5jZW9mICQuRXZlbnQpIHtcbiAgICAgIHNlbGYuaW5TdGF0ZVtvYmoudHlwZSA9PSAnZm9jdXNvdXQnID8gJ2ZvY3VzJyA6ICdob3ZlciddID0gZmFsc2VcbiAgICB9XG5cbiAgICBpZiAoc2VsZi5pc0luU3RhdGVUcnVlKCkpIHJldHVyblxuXG4gICAgY2xlYXJUaW1lb3V0KHNlbGYudGltZW91dClcblxuICAgIHNlbGYuaG92ZXJTdGF0ZSA9ICdvdXQnXG5cbiAgICBpZiAoIXNlbGYub3B0aW9ucy5kZWxheSB8fCAhc2VsZi5vcHRpb25zLmRlbGF5LmhpZGUpIHJldHVybiBzZWxmLmhpZGUoKVxuXG4gICAgc2VsZi50aW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAoc2VsZi5ob3ZlclN0YXRlID09ICdvdXQnKSBzZWxmLmhpZGUoKVxuICAgIH0sIHNlbGYub3B0aW9ucy5kZWxheS5oaWRlKVxuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZSA9ICQuRXZlbnQoJ3Nob3cuYnMuJyArIHRoaXMudHlwZSlcblxuICAgIGlmICh0aGlzLmhhc0NvbnRlbnQoKSAmJiB0aGlzLmVuYWJsZWQpIHtcbiAgICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcihlKVxuXG4gICAgICB2YXIgaW5Eb20gPSAkLmNvbnRhaW5zKHRoaXMuJGVsZW1lbnRbMF0ub3duZXJEb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsIHRoaXMuJGVsZW1lbnRbMF0pXG4gICAgICBpZiAoZS5pc0RlZmF1bHRQcmV2ZW50ZWQoKSB8fCAhaW5Eb20pIHJldHVyblxuICAgICAgdmFyIHRoYXQgPSB0aGlzXG5cbiAgICAgIHZhciAkdGlwID0gdGhpcy50aXAoKVxuXG4gICAgICB2YXIgdGlwSWQgPSB0aGlzLmdldFVJRCh0aGlzLnR5cGUpXG5cbiAgICAgIHRoaXMuc2V0Q29udGVudCgpXG4gICAgICAkdGlwLmF0dHIoJ2lkJywgdGlwSWQpXG4gICAgICB0aGlzLiRlbGVtZW50LmF0dHIoJ2FyaWEtZGVzY3JpYmVkYnknLCB0aXBJZClcblxuICAgICAgaWYgKHRoaXMub3B0aW9ucy5hbmltYXRpb24pICR0aXAuYWRkQ2xhc3MoJ2ZhZGUnKVxuXG4gICAgICB2YXIgcGxhY2VtZW50ID0gdHlwZW9mIHRoaXMub3B0aW9ucy5wbGFjZW1lbnQgPT0gJ2Z1bmN0aW9uJyA/XG4gICAgICAgIHRoaXMub3B0aW9ucy5wbGFjZW1lbnQuY2FsbCh0aGlzLCAkdGlwWzBdLCB0aGlzLiRlbGVtZW50WzBdKSA6XG4gICAgICAgIHRoaXMub3B0aW9ucy5wbGFjZW1lbnRcblxuICAgICAgdmFyIGF1dG9Ub2tlbiA9IC9cXHM/YXV0bz9cXHM/L2lcbiAgICAgIHZhciBhdXRvUGxhY2UgPSBhdXRvVG9rZW4udGVzdChwbGFjZW1lbnQpXG4gICAgICBpZiAoYXV0b1BsYWNlKSBwbGFjZW1lbnQgPSBwbGFjZW1lbnQucmVwbGFjZShhdXRvVG9rZW4sICcnKSB8fCAndG9wJ1xuXG4gICAgICAkdGlwXG4gICAgICAgIC5kZXRhY2goKVxuICAgICAgICAuY3NzKHsgdG9wOiAwLCBsZWZ0OiAwLCBkaXNwbGF5OiAnYmxvY2snIH0pXG4gICAgICAgIC5hZGRDbGFzcyhwbGFjZW1lbnQpXG4gICAgICAgIC5kYXRhKCdicy4nICsgdGhpcy50eXBlLCB0aGlzKVxuXG4gICAgICB0aGlzLm9wdGlvbnMuY29udGFpbmVyID8gJHRpcC5hcHBlbmRUbygkKGRvY3VtZW50KS5maW5kKHRoaXMub3B0aW9ucy5jb250YWluZXIpKSA6ICR0aXAuaW5zZXJ0QWZ0ZXIodGhpcy4kZWxlbWVudClcbiAgICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignaW5zZXJ0ZWQuYnMuJyArIHRoaXMudHlwZSlcblxuICAgICAgdmFyIHBvcyAgICAgICAgICA9IHRoaXMuZ2V0UG9zaXRpb24oKVxuICAgICAgdmFyIGFjdHVhbFdpZHRoICA9ICR0aXBbMF0ub2Zmc2V0V2lkdGhcbiAgICAgIHZhciBhY3R1YWxIZWlnaHQgPSAkdGlwWzBdLm9mZnNldEhlaWdodFxuXG4gICAgICBpZiAoYXV0b1BsYWNlKSB7XG4gICAgICAgIHZhciBvcmdQbGFjZW1lbnQgPSBwbGFjZW1lbnRcbiAgICAgICAgdmFyIHZpZXdwb3J0RGltID0gdGhpcy5nZXRQb3NpdGlvbih0aGlzLiR2aWV3cG9ydClcblxuICAgICAgICBwbGFjZW1lbnQgPSBwbGFjZW1lbnQgPT0gJ2JvdHRvbScgJiYgcG9zLmJvdHRvbSArIGFjdHVhbEhlaWdodCA+IHZpZXdwb3J0RGltLmJvdHRvbSA/ICd0b3AnICAgIDpcbiAgICAgICAgICAgICAgICAgICAgcGxhY2VtZW50ID09ICd0b3AnICAgICYmIHBvcy50b3AgICAgLSBhY3R1YWxIZWlnaHQgPCB2aWV3cG9ydERpbS50b3AgICAgPyAnYm90dG9tJyA6XG4gICAgICAgICAgICAgICAgICAgIHBsYWNlbWVudCA9PSAncmlnaHQnICAmJiBwb3MucmlnaHQgICsgYWN0dWFsV2lkdGggID4gdmlld3BvcnREaW0ud2lkdGggID8gJ2xlZnQnICAgOlxuICAgICAgICAgICAgICAgICAgICBwbGFjZW1lbnQgPT0gJ2xlZnQnICAgJiYgcG9zLmxlZnQgICAtIGFjdHVhbFdpZHRoICA8IHZpZXdwb3J0RGltLmxlZnQgICA/ICdyaWdodCcgIDpcbiAgICAgICAgICAgICAgICAgICAgcGxhY2VtZW50XG5cbiAgICAgICAgJHRpcFxuICAgICAgICAgIC5yZW1vdmVDbGFzcyhvcmdQbGFjZW1lbnQpXG4gICAgICAgICAgLmFkZENsYXNzKHBsYWNlbWVudClcbiAgICAgIH1cblxuICAgICAgdmFyIGNhbGN1bGF0ZWRPZmZzZXQgPSB0aGlzLmdldENhbGN1bGF0ZWRPZmZzZXQocGxhY2VtZW50LCBwb3MsIGFjdHVhbFdpZHRoLCBhY3R1YWxIZWlnaHQpXG5cbiAgICAgIHRoaXMuYXBwbHlQbGFjZW1lbnQoY2FsY3VsYXRlZE9mZnNldCwgcGxhY2VtZW50KVxuXG4gICAgICB2YXIgY29tcGxldGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBwcmV2SG92ZXJTdGF0ZSA9IHRoYXQuaG92ZXJTdGF0ZVxuICAgICAgICB0aGF0LiRlbGVtZW50LnRyaWdnZXIoJ3Nob3duLmJzLicgKyB0aGF0LnR5cGUpXG4gICAgICAgIHRoYXQuaG92ZXJTdGF0ZSA9IG51bGxcblxuICAgICAgICBpZiAocHJldkhvdmVyU3RhdGUgPT0gJ291dCcpIHRoYXQubGVhdmUodGhhdClcbiAgICAgIH1cblxuICAgICAgJC5zdXBwb3J0LnRyYW5zaXRpb24gJiYgdGhpcy4kdGlwLmhhc0NsYXNzKCdmYWRlJykgP1xuICAgICAgICAkdGlwXG4gICAgICAgICAgLm9uZSgnYnNUcmFuc2l0aW9uRW5kJywgY29tcGxldGUpXG4gICAgICAgICAgLmVtdWxhdGVUcmFuc2l0aW9uRW5kKFRvb2x0aXAuVFJBTlNJVElPTl9EVVJBVElPTikgOlxuICAgICAgICBjb21wbGV0ZSgpXG4gICAgfVxuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUuYXBwbHlQbGFjZW1lbnQgPSBmdW5jdGlvbiAob2Zmc2V0LCBwbGFjZW1lbnQpIHtcbiAgICB2YXIgJHRpcCAgID0gdGhpcy50aXAoKVxuICAgIHZhciB3aWR0aCAgPSAkdGlwWzBdLm9mZnNldFdpZHRoXG4gICAgdmFyIGhlaWdodCA9ICR0aXBbMF0ub2Zmc2V0SGVpZ2h0XG5cbiAgICAvLyBtYW51YWxseSByZWFkIG1hcmdpbnMgYmVjYXVzZSBnZXRCb3VuZGluZ0NsaWVudFJlY3QgaW5jbHVkZXMgZGlmZmVyZW5jZVxuICAgIHZhciBtYXJnaW5Ub3AgPSBwYXJzZUludCgkdGlwLmNzcygnbWFyZ2luLXRvcCcpLCAxMClcbiAgICB2YXIgbWFyZ2luTGVmdCA9IHBhcnNlSW50KCR0aXAuY3NzKCdtYXJnaW4tbGVmdCcpLCAxMClcblxuICAgIC8vIHdlIG11c3QgY2hlY2sgZm9yIE5hTiBmb3IgaWUgOC85XG4gICAgaWYgKGlzTmFOKG1hcmdpblRvcCkpICBtYXJnaW5Ub3AgID0gMFxuICAgIGlmIChpc05hTihtYXJnaW5MZWZ0KSkgbWFyZ2luTGVmdCA9IDBcblxuICAgIG9mZnNldC50b3AgICs9IG1hcmdpblRvcFxuICAgIG9mZnNldC5sZWZ0ICs9IG1hcmdpbkxlZnRcblxuICAgIC8vICQuZm4ub2Zmc2V0IGRvZXNuJ3Qgcm91bmQgcGl4ZWwgdmFsdWVzXG4gICAgLy8gc28gd2UgdXNlIHNldE9mZnNldCBkaXJlY3RseSB3aXRoIG91ciBvd24gZnVuY3Rpb24gQi0wXG4gICAgJC5vZmZzZXQuc2V0T2Zmc2V0KCR0aXBbMF0sICQuZXh0ZW5kKHtcbiAgICAgIHVzaW5nOiBmdW5jdGlvbiAocHJvcHMpIHtcbiAgICAgICAgJHRpcC5jc3Moe1xuICAgICAgICAgIHRvcDogTWF0aC5yb3VuZChwcm9wcy50b3ApLFxuICAgICAgICAgIGxlZnQ6IE1hdGgucm91bmQocHJvcHMubGVmdClcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9LCBvZmZzZXQpLCAwKVxuXG4gICAgJHRpcC5hZGRDbGFzcygnaW4nKVxuXG4gICAgLy8gY2hlY2sgdG8gc2VlIGlmIHBsYWNpbmcgdGlwIGluIG5ldyBvZmZzZXQgY2F1c2VkIHRoZSB0aXAgdG8gcmVzaXplIGl0c2VsZlxuICAgIHZhciBhY3R1YWxXaWR0aCAgPSAkdGlwWzBdLm9mZnNldFdpZHRoXG4gICAgdmFyIGFjdHVhbEhlaWdodCA9ICR0aXBbMF0ub2Zmc2V0SGVpZ2h0XG5cbiAgICBpZiAocGxhY2VtZW50ID09ICd0b3AnICYmIGFjdHVhbEhlaWdodCAhPSBoZWlnaHQpIHtcbiAgICAgIG9mZnNldC50b3AgPSBvZmZzZXQudG9wICsgaGVpZ2h0IC0gYWN0dWFsSGVpZ2h0XG4gICAgfVxuXG4gICAgdmFyIGRlbHRhID0gdGhpcy5nZXRWaWV3cG9ydEFkanVzdGVkRGVsdGEocGxhY2VtZW50LCBvZmZzZXQsIGFjdHVhbFdpZHRoLCBhY3R1YWxIZWlnaHQpXG5cbiAgICBpZiAoZGVsdGEubGVmdCkgb2Zmc2V0LmxlZnQgKz0gZGVsdGEubGVmdFxuICAgIGVsc2Ugb2Zmc2V0LnRvcCArPSBkZWx0YS50b3BcblxuICAgIHZhciBpc1ZlcnRpY2FsICAgICAgICAgID0gL3RvcHxib3R0b20vLnRlc3QocGxhY2VtZW50KVxuICAgIHZhciBhcnJvd0RlbHRhICAgICAgICAgID0gaXNWZXJ0aWNhbCA/IGRlbHRhLmxlZnQgKiAyIC0gd2lkdGggKyBhY3R1YWxXaWR0aCA6IGRlbHRhLnRvcCAqIDIgLSBoZWlnaHQgKyBhY3R1YWxIZWlnaHRcbiAgICB2YXIgYXJyb3dPZmZzZXRQb3NpdGlvbiA9IGlzVmVydGljYWwgPyAnb2Zmc2V0V2lkdGgnIDogJ29mZnNldEhlaWdodCdcblxuICAgICR0aXAub2Zmc2V0KG9mZnNldClcbiAgICB0aGlzLnJlcGxhY2VBcnJvdyhhcnJvd0RlbHRhLCAkdGlwWzBdW2Fycm93T2Zmc2V0UG9zaXRpb25dLCBpc1ZlcnRpY2FsKVxuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUucmVwbGFjZUFycm93ID0gZnVuY3Rpb24gKGRlbHRhLCBkaW1lbnNpb24sIGlzVmVydGljYWwpIHtcbiAgICB0aGlzLmFycm93KClcbiAgICAgIC5jc3MoaXNWZXJ0aWNhbCA/ICdsZWZ0JyA6ICd0b3AnLCA1MCAqICgxIC0gZGVsdGEgLyBkaW1lbnNpb24pICsgJyUnKVxuICAgICAgLmNzcyhpc1ZlcnRpY2FsID8gJ3RvcCcgOiAnbGVmdCcsICcnKVxuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUuc2V0Q29udGVudCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgJHRpcCAgPSB0aGlzLnRpcCgpXG4gICAgdmFyIHRpdGxlID0gdGhpcy5nZXRUaXRsZSgpXG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmh0bWwpIHtcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuc2FuaXRpemUpIHtcbiAgICAgICAgdGl0bGUgPSBzYW5pdGl6ZUh0bWwodGl0bGUsIHRoaXMub3B0aW9ucy53aGl0ZUxpc3QsIHRoaXMub3B0aW9ucy5zYW5pdGl6ZUZuKVxuICAgICAgfVxuXG4gICAgICAkdGlwLmZpbmQoJy50b29sdGlwLWlubmVyJykuaHRtbCh0aXRsZSlcbiAgICB9IGVsc2Uge1xuICAgICAgJHRpcC5maW5kKCcudG9vbHRpcC1pbm5lcicpLnRleHQodGl0bGUpXG4gICAgfVxuXG4gICAgJHRpcC5yZW1vdmVDbGFzcygnZmFkZSBpbiB0b3AgYm90dG9tIGxlZnQgcmlnaHQnKVxuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUuaGlkZSA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgIHZhciB0aGF0ID0gdGhpc1xuICAgIHZhciAkdGlwID0gJCh0aGlzLiR0aXApXG4gICAgdmFyIGUgICAgPSAkLkV2ZW50KCdoaWRlLmJzLicgKyB0aGlzLnR5cGUpXG5cbiAgICBmdW5jdGlvbiBjb21wbGV0ZSgpIHtcbiAgICAgIGlmICh0aGF0LmhvdmVyU3RhdGUgIT0gJ2luJykgJHRpcC5kZXRhY2goKVxuICAgICAgaWYgKHRoYXQuJGVsZW1lbnQpIHsgLy8gVE9ETzogQ2hlY2sgd2hldGhlciBndWFyZGluZyB0aGlzIGNvZGUgd2l0aCB0aGlzIGBpZmAgaXMgcmVhbGx5IG5lY2Vzc2FyeS5cbiAgICAgICAgdGhhdC4kZWxlbWVudFxuICAgICAgICAgIC5yZW1vdmVBdHRyKCdhcmlhLWRlc2NyaWJlZGJ5JylcbiAgICAgICAgICAudHJpZ2dlcignaGlkZGVuLmJzLicgKyB0aGF0LnR5cGUpXG4gICAgICB9XG4gICAgICBjYWxsYmFjayAmJiBjYWxsYmFjaygpXG4gICAgfVxuXG4gICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKGUpXG5cbiAgICBpZiAoZS5pc0RlZmF1bHRQcmV2ZW50ZWQoKSkgcmV0dXJuXG5cbiAgICAkdGlwLnJlbW92ZUNsYXNzKCdpbicpXG5cbiAgICAkLnN1cHBvcnQudHJhbnNpdGlvbiAmJiAkdGlwLmhhc0NsYXNzKCdmYWRlJykgP1xuICAgICAgJHRpcFxuICAgICAgICAub25lKCdic1RyYW5zaXRpb25FbmQnLCBjb21wbGV0ZSlcbiAgICAgICAgLmVtdWxhdGVUcmFuc2l0aW9uRW5kKFRvb2x0aXAuVFJBTlNJVElPTl9EVVJBVElPTikgOlxuICAgICAgY29tcGxldGUoKVxuXG4gICAgdGhpcy5ob3ZlclN0YXRlID0gbnVsbFxuXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLmZpeFRpdGxlID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciAkZSA9IHRoaXMuJGVsZW1lbnRcbiAgICBpZiAoJGUuYXR0cigndGl0bGUnKSB8fCB0eXBlb2YgJGUuYXR0cignZGF0YS1vcmlnaW5hbC10aXRsZScpICE9ICdzdHJpbmcnKSB7XG4gICAgICAkZS5hdHRyKCdkYXRhLW9yaWdpbmFsLXRpdGxlJywgJGUuYXR0cigndGl0bGUnKSB8fCAnJykuYXR0cigndGl0bGUnLCAnJylcbiAgICB9XG4gIH1cblxuICBUb29sdGlwLnByb3RvdHlwZS5oYXNDb250ZW50ID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmdldFRpdGxlKClcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLmdldFBvc2l0aW9uID0gZnVuY3Rpb24gKCRlbGVtZW50KSB7XG4gICAgJGVsZW1lbnQgICA9ICRlbGVtZW50IHx8IHRoaXMuJGVsZW1lbnRcblxuICAgIHZhciBlbCAgICAgPSAkZWxlbWVudFswXVxuICAgIHZhciBpc0JvZHkgPSBlbC50YWdOYW1lID09ICdCT0RZJ1xuXG4gICAgdmFyIGVsUmVjdCAgICA9IGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgaWYgKGVsUmVjdC53aWR0aCA9PSBudWxsKSB7XG4gICAgICAvLyB3aWR0aCBhbmQgaGVpZ2h0IGFyZSBtaXNzaW5nIGluIElFOCwgc28gY29tcHV0ZSB0aGVtIG1hbnVhbGx5OyBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3R3YnMvYm9vdHN0cmFwL2lzc3Vlcy8xNDA5M1xuICAgICAgZWxSZWN0ID0gJC5leHRlbmQoe30sIGVsUmVjdCwgeyB3aWR0aDogZWxSZWN0LnJpZ2h0IC0gZWxSZWN0LmxlZnQsIGhlaWdodDogZWxSZWN0LmJvdHRvbSAtIGVsUmVjdC50b3AgfSlcbiAgICB9XG4gICAgdmFyIGlzU3ZnID0gd2luZG93LlNWR0VsZW1lbnQgJiYgZWwgaW5zdGFuY2VvZiB3aW5kb3cuU1ZHRWxlbWVudFxuICAgIC8vIEF2b2lkIHVzaW5nICQub2Zmc2V0KCkgb24gU1ZHcyBzaW5jZSBpdCBnaXZlcyBpbmNvcnJlY3QgcmVzdWx0cyBpbiBqUXVlcnkgMy5cbiAgICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3R3YnMvYm9vdHN0cmFwL2lzc3Vlcy8yMDI4MFxuICAgIHZhciBlbE9mZnNldCAgPSBpc0JvZHkgPyB7IHRvcDogMCwgbGVmdDogMCB9IDogKGlzU3ZnID8gbnVsbCA6ICRlbGVtZW50Lm9mZnNldCgpKVxuICAgIHZhciBzY3JvbGwgICAgPSB7IHNjcm9sbDogaXNCb2R5ID8gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFRvcCB8fCBkb2N1bWVudC5ib2R5LnNjcm9sbFRvcCA6ICRlbGVtZW50LnNjcm9sbFRvcCgpIH1cbiAgICB2YXIgb3V0ZXJEaW1zID0gaXNCb2R5ID8geyB3aWR0aDogJCh3aW5kb3cpLndpZHRoKCksIGhlaWdodDogJCh3aW5kb3cpLmhlaWdodCgpIH0gOiBudWxsXG5cbiAgICByZXR1cm4gJC5leHRlbmQoe30sIGVsUmVjdCwgc2Nyb2xsLCBvdXRlckRpbXMsIGVsT2Zmc2V0KVxuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUuZ2V0Q2FsY3VsYXRlZE9mZnNldCA9IGZ1bmN0aW9uIChwbGFjZW1lbnQsIHBvcywgYWN0dWFsV2lkdGgsIGFjdHVhbEhlaWdodCkge1xuICAgIHJldHVybiBwbGFjZW1lbnQgPT0gJ2JvdHRvbScgPyB7IHRvcDogcG9zLnRvcCArIHBvcy5oZWlnaHQsICAgbGVmdDogcG9zLmxlZnQgKyBwb3Mud2lkdGggLyAyIC0gYWN0dWFsV2lkdGggLyAyIH0gOlxuICAgICAgICAgICBwbGFjZW1lbnQgPT0gJ3RvcCcgICAgPyB7IHRvcDogcG9zLnRvcCAtIGFjdHVhbEhlaWdodCwgbGVmdDogcG9zLmxlZnQgKyBwb3Mud2lkdGggLyAyIC0gYWN0dWFsV2lkdGggLyAyIH0gOlxuICAgICAgICAgICBwbGFjZW1lbnQgPT0gJ2xlZnQnICAgPyB7IHRvcDogcG9zLnRvcCArIHBvcy5oZWlnaHQgLyAyIC0gYWN0dWFsSGVpZ2h0IC8gMiwgbGVmdDogcG9zLmxlZnQgLSBhY3R1YWxXaWR0aCB9IDpcbiAgICAgICAgLyogcGxhY2VtZW50ID09ICdyaWdodCcgKi8geyB0b3A6IHBvcy50b3AgKyBwb3MuaGVpZ2h0IC8gMiAtIGFjdHVhbEhlaWdodCAvIDIsIGxlZnQ6IHBvcy5sZWZ0ICsgcG9zLndpZHRoIH1cblxuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUuZ2V0Vmlld3BvcnRBZGp1c3RlZERlbHRhID0gZnVuY3Rpb24gKHBsYWNlbWVudCwgcG9zLCBhY3R1YWxXaWR0aCwgYWN0dWFsSGVpZ2h0KSB7XG4gICAgdmFyIGRlbHRhID0geyB0b3A6IDAsIGxlZnQ6IDAgfVxuICAgIGlmICghdGhpcy4kdmlld3BvcnQpIHJldHVybiBkZWx0YVxuXG4gICAgdmFyIHZpZXdwb3J0UGFkZGluZyA9IHRoaXMub3B0aW9ucy52aWV3cG9ydCAmJiB0aGlzLm9wdGlvbnMudmlld3BvcnQucGFkZGluZyB8fCAwXG4gICAgdmFyIHZpZXdwb3J0RGltZW5zaW9ucyA9IHRoaXMuZ2V0UG9zaXRpb24odGhpcy4kdmlld3BvcnQpXG5cbiAgICBpZiAoL3JpZ2h0fGxlZnQvLnRlc3QocGxhY2VtZW50KSkge1xuICAgICAgdmFyIHRvcEVkZ2VPZmZzZXQgICAgPSBwb3MudG9wIC0gdmlld3BvcnRQYWRkaW5nIC0gdmlld3BvcnREaW1lbnNpb25zLnNjcm9sbFxuICAgICAgdmFyIGJvdHRvbUVkZ2VPZmZzZXQgPSBwb3MudG9wICsgdmlld3BvcnRQYWRkaW5nIC0gdmlld3BvcnREaW1lbnNpb25zLnNjcm9sbCArIGFjdHVhbEhlaWdodFxuICAgICAgaWYgKHRvcEVkZ2VPZmZzZXQgPCB2aWV3cG9ydERpbWVuc2lvbnMudG9wKSB7IC8vIHRvcCBvdmVyZmxvd1xuICAgICAgICBkZWx0YS50b3AgPSB2aWV3cG9ydERpbWVuc2lvbnMudG9wIC0gdG9wRWRnZU9mZnNldFxuICAgICAgfSBlbHNlIGlmIChib3R0b21FZGdlT2Zmc2V0ID4gdmlld3BvcnREaW1lbnNpb25zLnRvcCArIHZpZXdwb3J0RGltZW5zaW9ucy5oZWlnaHQpIHsgLy8gYm90dG9tIG92ZXJmbG93XG4gICAgICAgIGRlbHRhLnRvcCA9IHZpZXdwb3J0RGltZW5zaW9ucy50b3AgKyB2aWV3cG9ydERpbWVuc2lvbnMuaGVpZ2h0IC0gYm90dG9tRWRnZU9mZnNldFxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgbGVmdEVkZ2VPZmZzZXQgID0gcG9zLmxlZnQgLSB2aWV3cG9ydFBhZGRpbmdcbiAgICAgIHZhciByaWdodEVkZ2VPZmZzZXQgPSBwb3MubGVmdCArIHZpZXdwb3J0UGFkZGluZyArIGFjdHVhbFdpZHRoXG4gICAgICBpZiAobGVmdEVkZ2VPZmZzZXQgPCB2aWV3cG9ydERpbWVuc2lvbnMubGVmdCkgeyAvLyBsZWZ0IG92ZXJmbG93XG4gICAgICAgIGRlbHRhLmxlZnQgPSB2aWV3cG9ydERpbWVuc2lvbnMubGVmdCAtIGxlZnRFZGdlT2Zmc2V0XG4gICAgICB9IGVsc2UgaWYgKHJpZ2h0RWRnZU9mZnNldCA+IHZpZXdwb3J0RGltZW5zaW9ucy5yaWdodCkgeyAvLyByaWdodCBvdmVyZmxvd1xuICAgICAgICBkZWx0YS5sZWZ0ID0gdmlld3BvcnREaW1lbnNpb25zLmxlZnQgKyB2aWV3cG9ydERpbWVuc2lvbnMud2lkdGggLSByaWdodEVkZ2VPZmZzZXRcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZGVsdGFcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLmdldFRpdGxlID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciB0aXRsZVxuICAgIHZhciAkZSA9IHRoaXMuJGVsZW1lbnRcbiAgICB2YXIgbyAgPSB0aGlzLm9wdGlvbnNcblxuICAgIHRpdGxlID0gJGUuYXR0cignZGF0YS1vcmlnaW5hbC10aXRsZScpXG4gICAgICB8fCAodHlwZW9mIG8udGl0bGUgPT0gJ2Z1bmN0aW9uJyA/IG8udGl0bGUuY2FsbCgkZVswXSkgOiAgby50aXRsZSlcblxuICAgIHJldHVybiB0aXRsZVxuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUuZ2V0VUlEID0gZnVuY3Rpb24gKHByZWZpeCkge1xuICAgIGRvIHByZWZpeCArPSB+fihNYXRoLnJhbmRvbSgpICogMTAwMDAwMClcbiAgICB3aGlsZSAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQocHJlZml4KSlcbiAgICByZXR1cm4gcHJlZml4XG4gIH1cblxuICBUb29sdGlwLnByb3RvdHlwZS50aXAgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCF0aGlzLiR0aXApIHtcbiAgICAgIHRoaXMuJHRpcCA9ICQodGhpcy5vcHRpb25zLnRlbXBsYXRlKVxuICAgICAgaWYgKHRoaXMuJHRpcC5sZW5ndGggIT0gMSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IodGhpcy50eXBlICsgJyBgdGVtcGxhdGVgIG9wdGlvbiBtdXN0IGNvbnNpc3Qgb2YgZXhhY3RseSAxIHRvcC1sZXZlbCBlbGVtZW50IScpXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzLiR0aXBcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLmFycm93ID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAodGhpcy4kYXJyb3cgPSB0aGlzLiRhcnJvdyB8fCB0aGlzLnRpcCgpLmZpbmQoJy50b29sdGlwLWFycm93JykpXG4gIH1cblxuICBUb29sdGlwLnByb3RvdHlwZS5lbmFibGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5lbmFibGVkID0gdHJ1ZVxuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUuZGlzYWJsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmVuYWJsZWQgPSBmYWxzZVxuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUudG9nZ2xlRW5hYmxlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmVuYWJsZWQgPSAhdGhpcy5lbmFibGVkXG4gIH1cblxuICBUb29sdGlwLnByb3RvdHlwZS50b2dnbGUgPSBmdW5jdGlvbiAoZSkge1xuICAgIHZhciBzZWxmID0gdGhpc1xuICAgIGlmIChlKSB7XG4gICAgICBzZWxmID0gJChlLmN1cnJlbnRUYXJnZXQpLmRhdGEoJ2JzLicgKyB0aGlzLnR5cGUpXG4gICAgICBpZiAoIXNlbGYpIHtcbiAgICAgICAgc2VsZiA9IG5ldyB0aGlzLmNvbnN0cnVjdG9yKGUuY3VycmVudFRhcmdldCwgdGhpcy5nZXREZWxlZ2F0ZU9wdGlvbnMoKSlcbiAgICAgICAgJChlLmN1cnJlbnRUYXJnZXQpLmRhdGEoJ2JzLicgKyB0aGlzLnR5cGUsIHNlbGYpXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGUpIHtcbiAgICAgIHNlbGYuaW5TdGF0ZS5jbGljayA9ICFzZWxmLmluU3RhdGUuY2xpY2tcbiAgICAgIGlmIChzZWxmLmlzSW5TdGF0ZVRydWUoKSkgc2VsZi5lbnRlcihzZWxmKVxuICAgICAgZWxzZSBzZWxmLmxlYXZlKHNlbGYpXG4gICAgfSBlbHNlIHtcbiAgICAgIHNlbGYudGlwKCkuaGFzQ2xhc3MoJ2luJykgPyBzZWxmLmxlYXZlKHNlbGYpIDogc2VsZi5lbnRlcihzZWxmKVxuICAgIH1cbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzXG4gICAgY2xlYXJUaW1lb3V0KHRoaXMudGltZW91dClcbiAgICB0aGlzLmhpZGUoZnVuY3Rpb24gKCkge1xuICAgICAgdGhhdC4kZWxlbWVudC5vZmYoJy4nICsgdGhhdC50eXBlKS5yZW1vdmVEYXRhKCdicy4nICsgdGhhdC50eXBlKVxuICAgICAgaWYgKHRoYXQuJHRpcCkge1xuICAgICAgICB0aGF0LiR0aXAuZGV0YWNoKClcbiAgICAgIH1cbiAgICAgIHRoYXQuJHRpcCA9IG51bGxcbiAgICAgIHRoYXQuJGFycm93ID0gbnVsbFxuICAgICAgdGhhdC4kdmlld3BvcnQgPSBudWxsXG4gICAgICB0aGF0LiRlbGVtZW50ID0gbnVsbFxuICAgIH0pXG4gIH1cblxuICBUb29sdGlwLnByb3RvdHlwZS5zYW5pdGl6ZUh0bWwgPSBmdW5jdGlvbiAodW5zYWZlSHRtbCkge1xuICAgIHJldHVybiBzYW5pdGl6ZUh0bWwodW5zYWZlSHRtbCwgdGhpcy5vcHRpb25zLndoaXRlTGlzdCwgdGhpcy5vcHRpb25zLnNhbml0aXplRm4pXG4gIH1cblxuICAvLyBUT09MVElQIFBMVUdJTiBERUZJTklUSU9OXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICBmdW5jdGlvbiBQbHVnaW4ob3B0aW9uKSB7XG4gICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgJHRoaXMgICA9ICQodGhpcylcbiAgICAgIHZhciBkYXRhICAgID0gJHRoaXMuZGF0YSgnYnMudG9vbHRpcCcpXG4gICAgICB2YXIgb3B0aW9ucyA9IHR5cGVvZiBvcHRpb24gPT0gJ29iamVjdCcgJiYgb3B0aW9uXG5cbiAgICAgIGlmICghZGF0YSAmJiAvZGVzdHJveXxoaWRlLy50ZXN0KG9wdGlvbikpIHJldHVyblxuICAgICAgaWYgKCFkYXRhKSAkdGhpcy5kYXRhKCdicy50b29sdGlwJywgKGRhdGEgPSBuZXcgVG9vbHRpcCh0aGlzLCBvcHRpb25zKSkpXG4gICAgICBpZiAodHlwZW9mIG9wdGlvbiA9PSAnc3RyaW5nJykgZGF0YVtvcHRpb25dKClcbiAgICB9KVxuICB9XG5cbiAgdmFyIG9sZCA9ICQuZm4udG9vbHRpcFxuXG4gICQuZm4udG9vbHRpcCAgICAgICAgICAgICA9IFBsdWdpblxuICAkLmZuLnRvb2x0aXAuQ29uc3RydWN0b3IgPSBUb29sdGlwXG5cblxuICAvLyBUT09MVElQIE5PIENPTkZMSUNUXG4gIC8vID09PT09PT09PT09PT09PT09PT1cblxuICAkLmZuLnRvb2x0aXAubm9Db25mbGljdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAkLmZuLnRvb2x0aXAgPSBvbGRcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbn0oalF1ZXJ5KTtcblxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBCb290c3RyYXA6IHBvcG92ZXIuanMgdjMuNC4xXG4gKiBodHRwczovL2dldGJvb3RzdHJhcC5jb20vZG9jcy8zLjQvamF2YXNjcmlwdC8jcG9wb3ZlcnNcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogQ29weXJpZ2h0IDIwMTEtMjAxOSBUd2l0dGVyLCBJbmMuXG4gKiBMaWNlbnNlZCB1bmRlciBNSVQgKGh0dHBzOi8vZ2l0aHViLmNvbS90d2JzL2Jvb3RzdHJhcC9ibG9iL21hc3Rlci9MSUNFTlNFKVxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovXG5cblxuK2Z1bmN0aW9uICgkKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICAvLyBQT1BPVkVSIFBVQkxJQyBDTEFTUyBERUZJTklUSU9OXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICB2YXIgUG9wb3ZlciA9IGZ1bmN0aW9uIChlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy5pbml0KCdwb3BvdmVyJywgZWxlbWVudCwgb3B0aW9ucylcbiAgfVxuXG4gIGlmICghJC5mbi50b29sdGlwKSB0aHJvdyBuZXcgRXJyb3IoJ1BvcG92ZXIgcmVxdWlyZXMgdG9vbHRpcC5qcycpXG5cbiAgUG9wb3Zlci5WRVJTSU9OICA9ICczLjQuMSdcblxuICBQb3BvdmVyLkRFRkFVTFRTID0gJC5leHRlbmQoe30sICQuZm4udG9vbHRpcC5Db25zdHJ1Y3Rvci5ERUZBVUxUUywge1xuICAgIHBsYWNlbWVudDogJ3JpZ2h0JyxcbiAgICB0cmlnZ2VyOiAnY2xpY2snLFxuICAgIGNvbnRlbnQ6ICcnLFxuICAgIHRlbXBsYXRlOiAnPGRpdiBjbGFzcz1cInBvcG92ZXJcIiByb2xlPVwidG9vbHRpcFwiPjxkaXYgY2xhc3M9XCJhcnJvd1wiPjwvZGl2PjxoMyBjbGFzcz1cInBvcG92ZXItdGl0bGVcIj48L2gzPjxkaXYgY2xhc3M9XCJwb3BvdmVyLWNvbnRlbnRcIj48L2Rpdj48L2Rpdj4nXG4gIH0pXG5cblxuICAvLyBOT1RFOiBQT1BPVkVSIEVYVEVORFMgdG9vbHRpcC5qc1xuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gIFBvcG92ZXIucHJvdG90eXBlID0gJC5leHRlbmQoe30sICQuZm4udG9vbHRpcC5Db25zdHJ1Y3Rvci5wcm90b3R5cGUpXG5cbiAgUG9wb3Zlci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBQb3BvdmVyXG5cbiAgUG9wb3Zlci5wcm90b3R5cGUuZ2V0RGVmYXVsdHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIFBvcG92ZXIuREVGQVVMVFNcbiAgfVxuXG4gIFBvcG92ZXIucHJvdG90eXBlLnNldENvbnRlbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyICR0aXAgICAgPSB0aGlzLnRpcCgpXG4gICAgdmFyIHRpdGxlICAgPSB0aGlzLmdldFRpdGxlKClcbiAgICB2YXIgY29udGVudCA9IHRoaXMuZ2V0Q29udGVudCgpXG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmh0bWwpIHtcbiAgICAgIHZhciB0eXBlQ29udGVudCA9IHR5cGVvZiBjb250ZW50XG5cbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuc2FuaXRpemUpIHtcbiAgICAgICAgdGl0bGUgPSB0aGlzLnNhbml0aXplSHRtbCh0aXRsZSlcblxuICAgICAgICBpZiAodHlwZUNvbnRlbnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgY29udGVudCA9IHRoaXMuc2FuaXRpemVIdG1sKGNvbnRlbnQpXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgJHRpcC5maW5kKCcucG9wb3Zlci10aXRsZScpLmh0bWwodGl0bGUpXG4gICAgICAkdGlwLmZpbmQoJy5wb3BvdmVyLWNvbnRlbnQnKS5jaGlsZHJlbigpLmRldGFjaCgpLmVuZCgpW1xuICAgICAgICB0eXBlQ29udGVudCA9PT0gJ3N0cmluZycgPyAnaHRtbCcgOiAnYXBwZW5kJ1xuICAgICAgXShjb250ZW50KVxuICAgIH0gZWxzZSB7XG4gICAgICAkdGlwLmZpbmQoJy5wb3BvdmVyLXRpdGxlJykudGV4dCh0aXRsZSlcbiAgICAgICR0aXAuZmluZCgnLnBvcG92ZXItY29udGVudCcpLmNoaWxkcmVuKCkuZGV0YWNoKCkuZW5kKCkudGV4dChjb250ZW50KVxuICAgIH1cblxuICAgICR0aXAucmVtb3ZlQ2xhc3MoJ2ZhZGUgdG9wIGJvdHRvbSBsZWZ0IHJpZ2h0IGluJylcblxuICAgIC8vIElFOCBkb2Vzbid0IGFjY2VwdCBoaWRpbmcgdmlhIHRoZSBgOmVtcHR5YCBwc2V1ZG8gc2VsZWN0b3IsIHdlIGhhdmUgdG8gZG9cbiAgICAvLyB0aGlzIG1hbnVhbGx5IGJ5IGNoZWNraW5nIHRoZSBjb250ZW50cy5cbiAgICBpZiAoISR0aXAuZmluZCgnLnBvcG92ZXItdGl0bGUnKS5odG1sKCkpICR0aXAuZmluZCgnLnBvcG92ZXItdGl0bGUnKS5oaWRlKClcbiAgfVxuXG4gIFBvcG92ZXIucHJvdG90eXBlLmhhc0NvbnRlbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0VGl0bGUoKSB8fCB0aGlzLmdldENvbnRlbnQoKVxuICB9XG5cbiAgUG9wb3Zlci5wcm90b3R5cGUuZ2V0Q29udGVudCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgJGUgPSB0aGlzLiRlbGVtZW50XG4gICAgdmFyIG8gID0gdGhpcy5vcHRpb25zXG5cbiAgICByZXR1cm4gJGUuYXR0cignZGF0YS1jb250ZW50JylcbiAgICAgIHx8ICh0eXBlb2Ygby5jb250ZW50ID09ICdmdW5jdGlvbicgP1xuICAgICAgICBvLmNvbnRlbnQuY2FsbCgkZVswXSkgOlxuICAgICAgICBvLmNvbnRlbnQpXG4gIH1cblxuICBQb3BvdmVyLnByb3RvdHlwZS5hcnJvdyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gKHRoaXMuJGFycm93ID0gdGhpcy4kYXJyb3cgfHwgdGhpcy50aXAoKS5maW5kKCcuYXJyb3cnKSlcbiAgfVxuXG5cbiAgLy8gUE9QT1ZFUiBQTFVHSU4gREVGSU5JVElPTlxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgZnVuY3Rpb24gUGx1Z2luKG9wdGlvbikge1xuICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgdmFyICR0aGlzICAgPSAkKHRoaXMpXG4gICAgICB2YXIgZGF0YSAgICA9ICR0aGlzLmRhdGEoJ2JzLnBvcG92ZXInKVxuICAgICAgdmFyIG9wdGlvbnMgPSB0eXBlb2Ygb3B0aW9uID09ICdvYmplY3QnICYmIG9wdGlvblxuXG4gICAgICBpZiAoIWRhdGEgJiYgL2Rlc3Ryb3l8aGlkZS8udGVzdChvcHRpb24pKSByZXR1cm5cbiAgICAgIGlmICghZGF0YSkgJHRoaXMuZGF0YSgnYnMucG9wb3ZlcicsIChkYXRhID0gbmV3IFBvcG92ZXIodGhpcywgb3B0aW9ucykpKVxuICAgICAgaWYgKHR5cGVvZiBvcHRpb24gPT0gJ3N0cmluZycpIGRhdGFbb3B0aW9uXSgpXG4gICAgfSlcbiAgfVxuXG4gIHZhciBvbGQgPSAkLmZuLnBvcG92ZXJcblxuICAkLmZuLnBvcG92ZXIgICAgICAgICAgICAgPSBQbHVnaW5cbiAgJC5mbi5wb3BvdmVyLkNvbnN0cnVjdG9yID0gUG9wb3ZlclxuXG5cbiAgLy8gUE9QT1ZFUiBOTyBDT05GTElDVFxuICAvLyA9PT09PT09PT09PT09PT09PT09XG5cbiAgJC5mbi5wb3BvdmVyLm5vQ29uZmxpY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgJC5mbi5wb3BvdmVyID0gb2xkXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG59KGpRdWVyeSk7XG5cbi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogQm9vdHN0cmFwOiBzY3JvbGxzcHkuanMgdjMuNC4xXG4gKiBodHRwczovL2dldGJvb3RzdHJhcC5jb20vZG9jcy8zLjQvamF2YXNjcmlwdC8jc2Nyb2xsc3B5XG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIENvcHlyaWdodCAyMDExLTIwMTkgVHdpdHRlciwgSW5jLlxuICogTGljZW5zZWQgdW5kZXIgTUlUIChodHRwczovL2dpdGh1Yi5jb20vdHdicy9ib290c3RyYXAvYmxvYi9tYXN0ZXIvTElDRU5TRSlcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqL1xuXG5cbitmdW5jdGlvbiAoJCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgLy8gU0NST0xMU1BZIENMQVNTIERFRklOSVRJT05cbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICBmdW5jdGlvbiBTY3JvbGxTcHkoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIHRoaXMuJGJvZHkgICAgICAgICAgPSAkKGRvY3VtZW50LmJvZHkpXG4gICAgdGhpcy4kc2Nyb2xsRWxlbWVudCA9ICQoZWxlbWVudCkuaXMoZG9jdW1lbnQuYm9keSkgPyAkKHdpbmRvdykgOiAkKGVsZW1lbnQpXG4gICAgdGhpcy5vcHRpb25zICAgICAgICA9ICQuZXh0ZW5kKHt9LCBTY3JvbGxTcHkuREVGQVVMVFMsIG9wdGlvbnMpXG4gICAgdGhpcy5zZWxlY3RvciAgICAgICA9ICh0aGlzLm9wdGlvbnMudGFyZ2V0IHx8ICcnKSArICcgLm5hdiBsaSA+IGEnXG4gICAgdGhpcy5vZmZzZXRzICAgICAgICA9IFtdXG4gICAgdGhpcy50YXJnZXRzICAgICAgICA9IFtdXG4gICAgdGhpcy5hY3RpdmVUYXJnZXQgICA9IG51bGxcbiAgICB0aGlzLnNjcm9sbEhlaWdodCAgID0gMFxuXG4gICAgdGhpcy4kc2Nyb2xsRWxlbWVudC5vbignc2Nyb2xsLmJzLnNjcm9sbHNweScsICQucHJveHkodGhpcy5wcm9jZXNzLCB0aGlzKSlcbiAgICB0aGlzLnJlZnJlc2goKVxuICAgIHRoaXMucHJvY2VzcygpXG4gIH1cblxuICBTY3JvbGxTcHkuVkVSU0lPTiAgPSAnMy40LjEnXG5cbiAgU2Nyb2xsU3B5LkRFRkFVTFRTID0ge1xuICAgIG9mZnNldDogMTBcbiAgfVxuXG4gIFNjcm9sbFNweS5wcm90b3R5cGUuZ2V0U2Nyb2xsSGVpZ2h0ID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLiRzY3JvbGxFbGVtZW50WzBdLnNjcm9sbEhlaWdodCB8fCBNYXRoLm1heCh0aGlzLiRib2R5WzBdLnNjcm9sbEhlaWdodCwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbEhlaWdodClcbiAgfVxuXG4gIFNjcm9sbFNweS5wcm90b3R5cGUucmVmcmVzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgdGhhdCAgICAgICAgICA9IHRoaXNcbiAgICB2YXIgb2Zmc2V0TWV0aG9kICA9ICdvZmZzZXQnXG4gICAgdmFyIG9mZnNldEJhc2UgICAgPSAwXG5cbiAgICB0aGlzLm9mZnNldHMgICAgICA9IFtdXG4gICAgdGhpcy50YXJnZXRzICAgICAgPSBbXVxuICAgIHRoaXMuc2Nyb2xsSGVpZ2h0ID0gdGhpcy5nZXRTY3JvbGxIZWlnaHQoKVxuXG4gICAgaWYgKCEkLmlzV2luZG93KHRoaXMuJHNjcm9sbEVsZW1lbnRbMF0pKSB7XG4gICAgICBvZmZzZXRNZXRob2QgPSAncG9zaXRpb24nXG4gICAgICBvZmZzZXRCYXNlICAgPSB0aGlzLiRzY3JvbGxFbGVtZW50LnNjcm9sbFRvcCgpXG4gICAgfVxuXG4gICAgdGhpcy4kYm9keVxuICAgICAgLmZpbmQodGhpcy5zZWxlY3RvcilcbiAgICAgIC5tYXAoZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgJGVsICAgPSAkKHRoaXMpXG4gICAgICAgIHZhciBocmVmICA9ICRlbC5kYXRhKCd0YXJnZXQnKSB8fCAkZWwuYXR0cignaHJlZicpXG4gICAgICAgIHZhciAkaHJlZiA9IC9eIy4vLnRlc3QoaHJlZikgJiYgJChocmVmKVxuXG4gICAgICAgIHJldHVybiAoJGhyZWZcbiAgICAgICAgICAmJiAkaHJlZi5sZW5ndGhcbiAgICAgICAgICAmJiAkaHJlZi5pcygnOnZpc2libGUnKVxuICAgICAgICAgICYmIFtbJGhyZWZbb2Zmc2V0TWV0aG9kXSgpLnRvcCArIG9mZnNldEJhc2UsIGhyZWZdXSkgfHwgbnVsbFxuICAgICAgfSlcbiAgICAgIC5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBhWzBdIC0gYlswXSB9KVxuICAgICAgLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGF0Lm9mZnNldHMucHVzaCh0aGlzWzBdKVxuICAgICAgICB0aGF0LnRhcmdldHMucHVzaCh0aGlzWzFdKVxuICAgICAgfSlcbiAgfVxuXG4gIFNjcm9sbFNweS5wcm90b3R5cGUucHJvY2VzcyA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc2Nyb2xsVG9wICAgID0gdGhpcy4kc2Nyb2xsRWxlbWVudC5zY3JvbGxUb3AoKSArIHRoaXMub3B0aW9ucy5vZmZzZXRcbiAgICB2YXIgc2Nyb2xsSGVpZ2h0ID0gdGhpcy5nZXRTY3JvbGxIZWlnaHQoKVxuICAgIHZhciBtYXhTY3JvbGwgICAgPSB0aGlzLm9wdGlvbnMub2Zmc2V0ICsgc2Nyb2xsSGVpZ2h0IC0gdGhpcy4kc2Nyb2xsRWxlbWVudC5oZWlnaHQoKVxuICAgIHZhciBvZmZzZXRzICAgICAgPSB0aGlzLm9mZnNldHNcbiAgICB2YXIgdGFyZ2V0cyAgICAgID0gdGhpcy50YXJnZXRzXG4gICAgdmFyIGFjdGl2ZVRhcmdldCA9IHRoaXMuYWN0aXZlVGFyZ2V0XG4gICAgdmFyIGlcblxuICAgIGlmICh0aGlzLnNjcm9sbEhlaWdodCAhPSBzY3JvbGxIZWlnaHQpIHtcbiAgICAgIHRoaXMucmVmcmVzaCgpXG4gICAgfVxuXG4gICAgaWYgKHNjcm9sbFRvcCA+PSBtYXhTY3JvbGwpIHtcbiAgICAgIHJldHVybiBhY3RpdmVUYXJnZXQgIT0gKGkgPSB0YXJnZXRzW3RhcmdldHMubGVuZ3RoIC0gMV0pICYmIHRoaXMuYWN0aXZhdGUoaSlcbiAgICB9XG5cbiAgICBpZiAoYWN0aXZlVGFyZ2V0ICYmIHNjcm9sbFRvcCA8IG9mZnNldHNbMF0pIHtcbiAgICAgIHRoaXMuYWN0aXZlVGFyZ2V0ID0gbnVsbFxuICAgICAgcmV0dXJuIHRoaXMuY2xlYXIoKVxuICAgIH1cblxuICAgIGZvciAoaSA9IG9mZnNldHMubGVuZ3RoOyBpLS07KSB7XG4gICAgICBhY3RpdmVUYXJnZXQgIT0gdGFyZ2V0c1tpXVxuICAgICAgICAmJiBzY3JvbGxUb3AgPj0gb2Zmc2V0c1tpXVxuICAgICAgICAmJiAob2Zmc2V0c1tpICsgMV0gPT09IHVuZGVmaW5lZCB8fCBzY3JvbGxUb3AgPCBvZmZzZXRzW2kgKyAxXSlcbiAgICAgICAgJiYgdGhpcy5hY3RpdmF0ZSh0YXJnZXRzW2ldKVxuICAgIH1cbiAgfVxuXG4gIFNjcm9sbFNweS5wcm90b3R5cGUuYWN0aXZhdGUgPSBmdW5jdGlvbiAodGFyZ2V0KSB7XG4gICAgdGhpcy5hY3RpdmVUYXJnZXQgPSB0YXJnZXRcblxuICAgIHRoaXMuY2xlYXIoKVxuXG4gICAgdmFyIHNlbGVjdG9yID0gdGhpcy5zZWxlY3RvciArXG4gICAgICAnW2RhdGEtdGFyZ2V0PVwiJyArIHRhcmdldCArICdcIl0sJyArXG4gICAgICB0aGlzLnNlbGVjdG9yICsgJ1tocmVmPVwiJyArIHRhcmdldCArICdcIl0nXG5cbiAgICB2YXIgYWN0aXZlID0gJChzZWxlY3RvcilcbiAgICAgIC5wYXJlbnRzKCdsaScpXG4gICAgICAuYWRkQ2xhc3MoJ2FjdGl2ZScpXG5cbiAgICBpZiAoYWN0aXZlLnBhcmVudCgnLmRyb3Bkb3duLW1lbnUnKS5sZW5ndGgpIHtcbiAgICAgIGFjdGl2ZSA9IGFjdGl2ZVxuICAgICAgICAuY2xvc2VzdCgnbGkuZHJvcGRvd24nKVxuICAgICAgICAuYWRkQ2xhc3MoJ2FjdGl2ZScpXG4gICAgfVxuXG4gICAgYWN0aXZlLnRyaWdnZXIoJ2FjdGl2YXRlLmJzLnNjcm9sbHNweScpXG4gIH1cblxuICBTY3JvbGxTcHkucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24gKCkge1xuICAgICQodGhpcy5zZWxlY3RvcilcbiAgICAgIC5wYXJlbnRzVW50aWwodGhpcy5vcHRpb25zLnRhcmdldCwgJy5hY3RpdmUnKVxuICAgICAgLnJlbW92ZUNsYXNzKCdhY3RpdmUnKVxuICB9XG5cblxuICAvLyBTQ1JPTExTUFkgUExVR0lOIERFRklOSVRJT05cbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgZnVuY3Rpb24gUGx1Z2luKG9wdGlvbikge1xuICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgdmFyICR0aGlzICAgPSAkKHRoaXMpXG4gICAgICB2YXIgZGF0YSAgICA9ICR0aGlzLmRhdGEoJ2JzLnNjcm9sbHNweScpXG4gICAgICB2YXIgb3B0aW9ucyA9IHR5cGVvZiBvcHRpb24gPT0gJ29iamVjdCcgJiYgb3B0aW9uXG5cbiAgICAgIGlmICghZGF0YSkgJHRoaXMuZGF0YSgnYnMuc2Nyb2xsc3B5JywgKGRhdGEgPSBuZXcgU2Nyb2xsU3B5KHRoaXMsIG9wdGlvbnMpKSlcbiAgICAgIGlmICh0eXBlb2Ygb3B0aW9uID09ICdzdHJpbmcnKSBkYXRhW29wdGlvbl0oKVxuICAgIH0pXG4gIH1cblxuICB2YXIgb2xkID0gJC5mbi5zY3JvbGxzcHlcblxuICAkLmZuLnNjcm9sbHNweSAgICAgICAgICAgICA9IFBsdWdpblxuICAkLmZuLnNjcm9sbHNweS5Db25zdHJ1Y3RvciA9IFNjcm9sbFNweVxuXG5cbiAgLy8gU0NST0xMU1BZIE5PIENPTkZMSUNUXG4gIC8vID09PT09PT09PT09PT09PT09PT09PVxuXG4gICQuZm4uc2Nyb2xsc3B5Lm5vQ29uZmxpY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgJC5mbi5zY3JvbGxzcHkgPSBvbGRcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cblxuICAvLyBTQ1JPTExTUFkgREFUQS1BUElcbiAgLy8gPT09PT09PT09PT09PT09PT09XG5cbiAgJCh3aW5kb3cpLm9uKCdsb2FkLmJzLnNjcm9sbHNweS5kYXRhLWFwaScsIGZ1bmN0aW9uICgpIHtcbiAgICAkKCdbZGF0YS1zcHk9XCJzY3JvbGxcIl0nKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciAkc3B5ID0gJCh0aGlzKVxuICAgICAgUGx1Z2luLmNhbGwoJHNweSwgJHNweS5kYXRhKCkpXG4gICAgfSlcbiAgfSlcblxufShqUXVlcnkpO1xuXG4vKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIEJvb3RzdHJhcDogdGFiLmpzIHYzLjQuMVxuICogaHR0cHM6Ly9nZXRib290c3RyYXAuY29tL2RvY3MvMy40L2phdmFzY3JpcHQvI3RhYnNcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogQ29weXJpZ2h0IDIwMTEtMjAxOSBUd2l0dGVyLCBJbmMuXG4gKiBMaWNlbnNlZCB1bmRlciBNSVQgKGh0dHBzOi8vZ2l0aHViLmNvbS90d2JzL2Jvb3RzdHJhcC9ibG9iL21hc3Rlci9MSUNFTlNFKVxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovXG5cblxuK2Z1bmN0aW9uICgkKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICAvLyBUQUIgQ0xBU1MgREVGSU5JVElPTlxuICAvLyA9PT09PT09PT09PT09PT09PT09PVxuXG4gIHZhciBUYWIgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgIC8vIGpzY3M6ZGlzYWJsZSByZXF1aXJlRG9sbGFyQmVmb3JlalF1ZXJ5QXNzaWdubWVudFxuICAgIHRoaXMuZWxlbWVudCA9ICQoZWxlbWVudClcbiAgICAvLyBqc2NzOmVuYWJsZSByZXF1aXJlRG9sbGFyQmVmb3JlalF1ZXJ5QXNzaWdubWVudFxuICB9XG5cbiAgVGFiLlZFUlNJT04gPSAnMy40LjEnXG5cbiAgVGFiLlRSQU5TSVRJT05fRFVSQVRJT04gPSAxNTBcblxuICBUYWIucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyICR0aGlzICAgID0gdGhpcy5lbGVtZW50XG4gICAgdmFyICR1bCAgICAgID0gJHRoaXMuY2xvc2VzdCgndWw6bm90KC5kcm9wZG93bi1tZW51KScpXG4gICAgdmFyIHNlbGVjdG9yID0gJHRoaXMuZGF0YSgndGFyZ2V0JylcblxuICAgIGlmICghc2VsZWN0b3IpIHtcbiAgICAgIHNlbGVjdG9yID0gJHRoaXMuYXR0cignaHJlZicpXG4gICAgICBzZWxlY3RvciA9IHNlbGVjdG9yICYmIHNlbGVjdG9yLnJlcGxhY2UoLy4qKD89I1teXFxzXSokKS8sICcnKSAvLyBzdHJpcCBmb3IgaWU3XG4gICAgfVxuXG4gICAgaWYgKCR0aGlzLnBhcmVudCgnbGknKS5oYXNDbGFzcygnYWN0aXZlJykpIHJldHVyblxuXG4gICAgdmFyICRwcmV2aW91cyA9ICR1bC5maW5kKCcuYWN0aXZlOmxhc3QgYScpXG4gICAgdmFyIGhpZGVFdmVudCA9ICQuRXZlbnQoJ2hpZGUuYnMudGFiJywge1xuICAgICAgcmVsYXRlZFRhcmdldDogJHRoaXNbMF1cbiAgICB9KVxuICAgIHZhciBzaG93RXZlbnQgPSAkLkV2ZW50KCdzaG93LmJzLnRhYicsIHtcbiAgICAgIHJlbGF0ZWRUYXJnZXQ6ICRwcmV2aW91c1swXVxuICAgIH0pXG5cbiAgICAkcHJldmlvdXMudHJpZ2dlcihoaWRlRXZlbnQpXG4gICAgJHRoaXMudHJpZ2dlcihzaG93RXZlbnQpXG5cbiAgICBpZiAoc2hvd0V2ZW50LmlzRGVmYXVsdFByZXZlbnRlZCgpIHx8IGhpZGVFdmVudC5pc0RlZmF1bHRQcmV2ZW50ZWQoKSkgcmV0dXJuXG5cbiAgICB2YXIgJHRhcmdldCA9ICQoZG9jdW1lbnQpLmZpbmQoc2VsZWN0b3IpXG5cbiAgICB0aGlzLmFjdGl2YXRlKCR0aGlzLmNsb3Nlc3QoJ2xpJyksICR1bClcbiAgICB0aGlzLmFjdGl2YXRlKCR0YXJnZXQsICR0YXJnZXQucGFyZW50KCksIGZ1bmN0aW9uICgpIHtcbiAgICAgICRwcmV2aW91cy50cmlnZ2VyKHtcbiAgICAgICAgdHlwZTogJ2hpZGRlbi5icy50YWInLFxuICAgICAgICByZWxhdGVkVGFyZ2V0OiAkdGhpc1swXVxuICAgICAgfSlcbiAgICAgICR0aGlzLnRyaWdnZXIoe1xuICAgICAgICB0eXBlOiAnc2hvd24uYnMudGFiJyxcbiAgICAgICAgcmVsYXRlZFRhcmdldDogJHByZXZpb3VzWzBdXG4gICAgICB9KVxuICAgIH0pXG4gIH1cblxuICBUYWIucHJvdG90eXBlLmFjdGl2YXRlID0gZnVuY3Rpb24gKGVsZW1lbnQsIGNvbnRhaW5lciwgY2FsbGJhY2spIHtcbiAgICB2YXIgJGFjdGl2ZSAgICA9IGNvbnRhaW5lci5maW5kKCc+IC5hY3RpdmUnKVxuICAgIHZhciB0cmFuc2l0aW9uID0gY2FsbGJhY2tcbiAgICAgICYmICQuc3VwcG9ydC50cmFuc2l0aW9uXG4gICAgICAmJiAoJGFjdGl2ZS5sZW5ndGggJiYgJGFjdGl2ZS5oYXNDbGFzcygnZmFkZScpIHx8ICEhY29udGFpbmVyLmZpbmQoJz4gLmZhZGUnKS5sZW5ndGgpXG5cbiAgICBmdW5jdGlvbiBuZXh0KCkge1xuICAgICAgJGFjdGl2ZVxuICAgICAgICAucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpXG4gICAgICAgIC5maW5kKCc+IC5kcm9wZG93bi1tZW51ID4gLmFjdGl2ZScpXG4gICAgICAgIC5yZW1vdmVDbGFzcygnYWN0aXZlJylcbiAgICAgICAgLmVuZCgpXG4gICAgICAgIC5maW5kKCdbZGF0YS10b2dnbGU9XCJ0YWJcIl0nKVxuICAgICAgICAuYXR0cignYXJpYS1leHBhbmRlZCcsIGZhbHNlKVxuXG4gICAgICBlbGVtZW50XG4gICAgICAgIC5hZGRDbGFzcygnYWN0aXZlJylcbiAgICAgICAgLmZpbmQoJ1tkYXRhLXRvZ2dsZT1cInRhYlwiXScpXG4gICAgICAgIC5hdHRyKCdhcmlhLWV4cGFuZGVkJywgdHJ1ZSlcblxuICAgICAgaWYgKHRyYW5zaXRpb24pIHtcbiAgICAgICAgZWxlbWVudFswXS5vZmZzZXRXaWR0aCAvLyByZWZsb3cgZm9yIHRyYW5zaXRpb25cbiAgICAgICAgZWxlbWVudC5hZGRDbGFzcygnaW4nKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZWxlbWVudC5yZW1vdmVDbGFzcygnZmFkZScpXG4gICAgICB9XG5cbiAgICAgIGlmIChlbGVtZW50LnBhcmVudCgnLmRyb3Bkb3duLW1lbnUnKS5sZW5ndGgpIHtcbiAgICAgICAgZWxlbWVudFxuICAgICAgICAgIC5jbG9zZXN0KCdsaS5kcm9wZG93bicpXG4gICAgICAgICAgLmFkZENsYXNzKCdhY3RpdmUnKVxuICAgICAgICAgIC5lbmQoKVxuICAgICAgICAgIC5maW5kKCdbZGF0YS10b2dnbGU9XCJ0YWJcIl0nKVxuICAgICAgICAgIC5hdHRyKCdhcmlhLWV4cGFuZGVkJywgdHJ1ZSlcbiAgICAgIH1cblxuICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2soKVxuICAgIH1cblxuICAgICRhY3RpdmUubGVuZ3RoICYmIHRyYW5zaXRpb24gP1xuICAgICAgJGFjdGl2ZVxuICAgICAgICAub25lKCdic1RyYW5zaXRpb25FbmQnLCBuZXh0KVxuICAgICAgICAuZW11bGF0ZVRyYW5zaXRpb25FbmQoVGFiLlRSQU5TSVRJT05fRFVSQVRJT04pIDpcbiAgICAgIG5leHQoKVxuXG4gICAgJGFjdGl2ZS5yZW1vdmVDbGFzcygnaW4nKVxuICB9XG5cblxuICAvLyBUQUIgUExVR0lOIERFRklOSVRJT05cbiAgLy8gPT09PT09PT09PT09PT09PT09PT09XG5cbiAgZnVuY3Rpb24gUGx1Z2luKG9wdGlvbikge1xuICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgdmFyICR0aGlzID0gJCh0aGlzKVxuICAgICAgdmFyIGRhdGEgID0gJHRoaXMuZGF0YSgnYnMudGFiJylcblxuICAgICAgaWYgKCFkYXRhKSAkdGhpcy5kYXRhKCdicy50YWInLCAoZGF0YSA9IG5ldyBUYWIodGhpcykpKVxuICAgICAgaWYgKHR5cGVvZiBvcHRpb24gPT0gJ3N0cmluZycpIGRhdGFbb3B0aW9uXSgpXG4gICAgfSlcbiAgfVxuXG4gIHZhciBvbGQgPSAkLmZuLnRhYlxuXG4gICQuZm4udGFiICAgICAgICAgICAgID0gUGx1Z2luXG4gICQuZm4udGFiLkNvbnN0cnVjdG9yID0gVGFiXG5cblxuICAvLyBUQUIgTk8gQ09ORkxJQ1RcbiAgLy8gPT09PT09PT09PT09PT09XG5cbiAgJC5mbi50YWIubm9Db25mbGljdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAkLmZuLnRhYiA9IG9sZFxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuXG4gIC8vIFRBQiBEQVRBLUFQSVxuICAvLyA9PT09PT09PT09PT1cblxuICB2YXIgY2xpY2tIYW5kbGVyID0gZnVuY3Rpb24gKGUpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBQbHVnaW4uY2FsbCgkKHRoaXMpLCAnc2hvdycpXG4gIH1cblxuICAkKGRvY3VtZW50KVxuICAgIC5vbignY2xpY2suYnMudGFiLmRhdGEtYXBpJywgJ1tkYXRhLXRvZ2dsZT1cInRhYlwiXScsIGNsaWNrSGFuZGxlcilcbiAgICAub24oJ2NsaWNrLmJzLnRhYi5kYXRhLWFwaScsICdbZGF0YS10b2dnbGU9XCJwaWxsXCJdJywgY2xpY2tIYW5kbGVyKVxuXG59KGpRdWVyeSk7XG5cbi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogQm9vdHN0cmFwOiBhZmZpeC5qcyB2My40LjFcbiAqIGh0dHBzOi8vZ2V0Ym9vdHN0cmFwLmNvbS9kb2NzLzMuNC9qYXZhc2NyaXB0LyNhZmZpeFxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBDb3B5cmlnaHQgMjAxMS0yMDE5IFR3aXR0ZXIsIEluYy5cbiAqIExpY2Vuc2VkIHVuZGVyIE1JVCAoaHR0cHM6Ly9naXRodWIuY29tL3R3YnMvYm9vdHN0cmFwL2Jsb2IvbWFzdGVyL0xJQ0VOU0UpXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi9cblxuXG4rZnVuY3Rpb24gKCQpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIC8vIEFGRklYIENMQVNTIERFRklOSVRJT05cbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PVxuXG4gIHZhciBBZmZpeCA9IGZ1bmN0aW9uIChlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe30sIEFmZml4LkRFRkFVTFRTLCBvcHRpb25zKVxuXG4gICAgdmFyIHRhcmdldCA9IHRoaXMub3B0aW9ucy50YXJnZXQgPT09IEFmZml4LkRFRkFVTFRTLnRhcmdldCA/ICQodGhpcy5vcHRpb25zLnRhcmdldCkgOiAkKGRvY3VtZW50KS5maW5kKHRoaXMub3B0aW9ucy50YXJnZXQpXG5cbiAgICB0aGlzLiR0YXJnZXQgPSB0YXJnZXRcbiAgICAgIC5vbignc2Nyb2xsLmJzLmFmZml4LmRhdGEtYXBpJywgJC5wcm94eSh0aGlzLmNoZWNrUG9zaXRpb24sIHRoaXMpKVxuICAgICAgLm9uKCdjbGljay5icy5hZmZpeC5kYXRhLWFwaScsICAkLnByb3h5KHRoaXMuY2hlY2tQb3NpdGlvbldpdGhFdmVudExvb3AsIHRoaXMpKVxuXG4gICAgdGhpcy4kZWxlbWVudCAgICAgPSAkKGVsZW1lbnQpXG4gICAgdGhpcy5hZmZpeGVkICAgICAgPSBudWxsXG4gICAgdGhpcy51bnBpbiAgICAgICAgPSBudWxsXG4gICAgdGhpcy5waW5uZWRPZmZzZXQgPSBudWxsXG5cbiAgICB0aGlzLmNoZWNrUG9zaXRpb24oKVxuICB9XG5cbiAgQWZmaXguVkVSU0lPTiAgPSAnMy40LjEnXG5cbiAgQWZmaXguUkVTRVQgICAgPSAnYWZmaXggYWZmaXgtdG9wIGFmZml4LWJvdHRvbSdcblxuICBBZmZpeC5ERUZBVUxUUyA9IHtcbiAgICBvZmZzZXQ6IDAsXG4gICAgdGFyZ2V0OiB3aW5kb3dcbiAgfVxuXG4gIEFmZml4LnByb3RvdHlwZS5nZXRTdGF0ZSA9IGZ1bmN0aW9uIChzY3JvbGxIZWlnaHQsIGhlaWdodCwgb2Zmc2V0VG9wLCBvZmZzZXRCb3R0b20pIHtcbiAgICB2YXIgc2Nyb2xsVG9wICAgID0gdGhpcy4kdGFyZ2V0LnNjcm9sbFRvcCgpXG4gICAgdmFyIHBvc2l0aW9uICAgICA9IHRoaXMuJGVsZW1lbnQub2Zmc2V0KClcbiAgICB2YXIgdGFyZ2V0SGVpZ2h0ID0gdGhpcy4kdGFyZ2V0LmhlaWdodCgpXG5cbiAgICBpZiAob2Zmc2V0VG9wICE9IG51bGwgJiYgdGhpcy5hZmZpeGVkID09ICd0b3AnKSByZXR1cm4gc2Nyb2xsVG9wIDwgb2Zmc2V0VG9wID8gJ3RvcCcgOiBmYWxzZVxuXG4gICAgaWYgKHRoaXMuYWZmaXhlZCA9PSAnYm90dG9tJykge1xuICAgICAgaWYgKG9mZnNldFRvcCAhPSBudWxsKSByZXR1cm4gKHNjcm9sbFRvcCArIHRoaXMudW5waW4gPD0gcG9zaXRpb24udG9wKSA/IGZhbHNlIDogJ2JvdHRvbSdcbiAgICAgIHJldHVybiAoc2Nyb2xsVG9wICsgdGFyZ2V0SGVpZ2h0IDw9IHNjcm9sbEhlaWdodCAtIG9mZnNldEJvdHRvbSkgPyBmYWxzZSA6ICdib3R0b20nXG4gICAgfVxuXG4gICAgdmFyIGluaXRpYWxpemluZyAgID0gdGhpcy5hZmZpeGVkID09IG51bGxcbiAgICB2YXIgY29sbGlkZXJUb3AgICAgPSBpbml0aWFsaXppbmcgPyBzY3JvbGxUb3AgOiBwb3NpdGlvbi50b3BcbiAgICB2YXIgY29sbGlkZXJIZWlnaHQgPSBpbml0aWFsaXppbmcgPyB0YXJnZXRIZWlnaHQgOiBoZWlnaHRcblxuICAgIGlmIChvZmZzZXRUb3AgIT0gbnVsbCAmJiBzY3JvbGxUb3AgPD0gb2Zmc2V0VG9wKSByZXR1cm4gJ3RvcCdcbiAgICBpZiAob2Zmc2V0Qm90dG9tICE9IG51bGwgJiYgKGNvbGxpZGVyVG9wICsgY29sbGlkZXJIZWlnaHQgPj0gc2Nyb2xsSGVpZ2h0IC0gb2Zmc2V0Qm90dG9tKSkgcmV0dXJuICdib3R0b20nXG5cbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIEFmZml4LnByb3RvdHlwZS5nZXRQaW5uZWRPZmZzZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMucGlubmVkT2Zmc2V0KSByZXR1cm4gdGhpcy5waW5uZWRPZmZzZXRcbiAgICB0aGlzLiRlbGVtZW50LnJlbW92ZUNsYXNzKEFmZml4LlJFU0VUKS5hZGRDbGFzcygnYWZmaXgnKVxuICAgIHZhciBzY3JvbGxUb3AgPSB0aGlzLiR0YXJnZXQuc2Nyb2xsVG9wKClcbiAgICB2YXIgcG9zaXRpb24gID0gdGhpcy4kZWxlbWVudC5vZmZzZXQoKVxuICAgIHJldHVybiAodGhpcy5waW5uZWRPZmZzZXQgPSBwb3NpdGlvbi50b3AgLSBzY3JvbGxUb3ApXG4gIH1cblxuICBBZmZpeC5wcm90b3R5cGUuY2hlY2tQb3NpdGlvbldpdGhFdmVudExvb3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgc2V0VGltZW91dCgkLnByb3h5KHRoaXMuY2hlY2tQb3NpdGlvbiwgdGhpcyksIDEpXG4gIH1cblxuICBBZmZpeC5wcm90b3R5cGUuY2hlY2tQb3NpdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMuJGVsZW1lbnQuaXMoJzp2aXNpYmxlJykpIHJldHVyblxuXG4gICAgdmFyIGhlaWdodCAgICAgICA9IHRoaXMuJGVsZW1lbnQuaGVpZ2h0KClcbiAgICB2YXIgb2Zmc2V0ICAgICAgID0gdGhpcy5vcHRpb25zLm9mZnNldFxuICAgIHZhciBvZmZzZXRUb3AgICAgPSBvZmZzZXQudG9wXG4gICAgdmFyIG9mZnNldEJvdHRvbSA9IG9mZnNldC5ib3R0b21cbiAgICB2YXIgc2Nyb2xsSGVpZ2h0ID0gTWF0aC5tYXgoJChkb2N1bWVudCkuaGVpZ2h0KCksICQoZG9jdW1lbnQuYm9keSkuaGVpZ2h0KCkpXG5cbiAgICBpZiAodHlwZW9mIG9mZnNldCAhPSAnb2JqZWN0JykgICAgICAgICBvZmZzZXRCb3R0b20gPSBvZmZzZXRUb3AgPSBvZmZzZXRcbiAgICBpZiAodHlwZW9mIG9mZnNldFRvcCA9PSAnZnVuY3Rpb24nKSAgICBvZmZzZXRUb3AgICAgPSBvZmZzZXQudG9wKHRoaXMuJGVsZW1lbnQpXG4gICAgaWYgKHR5cGVvZiBvZmZzZXRCb3R0b20gPT0gJ2Z1bmN0aW9uJykgb2Zmc2V0Qm90dG9tID0gb2Zmc2V0LmJvdHRvbSh0aGlzLiRlbGVtZW50KVxuXG4gICAgdmFyIGFmZml4ID0gdGhpcy5nZXRTdGF0ZShzY3JvbGxIZWlnaHQsIGhlaWdodCwgb2Zmc2V0VG9wLCBvZmZzZXRCb3R0b20pXG5cbiAgICBpZiAodGhpcy5hZmZpeGVkICE9IGFmZml4KSB7XG4gICAgICBpZiAodGhpcy51bnBpbiAhPSBudWxsKSB0aGlzLiRlbGVtZW50LmNzcygndG9wJywgJycpXG5cbiAgICAgIHZhciBhZmZpeFR5cGUgPSAnYWZmaXgnICsgKGFmZml4ID8gJy0nICsgYWZmaXggOiAnJylcbiAgICAgIHZhciBlICAgICAgICAgPSAkLkV2ZW50KGFmZml4VHlwZSArICcuYnMuYWZmaXgnKVxuXG4gICAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoZSlcblxuICAgICAgaWYgKGUuaXNEZWZhdWx0UHJldmVudGVkKCkpIHJldHVyblxuXG4gICAgICB0aGlzLmFmZml4ZWQgPSBhZmZpeFxuICAgICAgdGhpcy51bnBpbiA9IGFmZml4ID09ICdib3R0b20nID8gdGhpcy5nZXRQaW5uZWRPZmZzZXQoKSA6IG51bGxcblxuICAgICAgdGhpcy4kZWxlbWVudFxuICAgICAgICAucmVtb3ZlQ2xhc3MoQWZmaXguUkVTRVQpXG4gICAgICAgIC5hZGRDbGFzcyhhZmZpeFR5cGUpXG4gICAgICAgIC50cmlnZ2VyKGFmZml4VHlwZS5yZXBsYWNlKCdhZmZpeCcsICdhZmZpeGVkJykgKyAnLmJzLmFmZml4JylcbiAgICB9XG5cbiAgICBpZiAoYWZmaXggPT0gJ2JvdHRvbScpIHtcbiAgICAgIHRoaXMuJGVsZW1lbnQub2Zmc2V0KHtcbiAgICAgICAgdG9wOiBzY3JvbGxIZWlnaHQgLSBoZWlnaHQgLSBvZmZzZXRCb3R0b21cbiAgICAgIH0pXG4gICAgfVxuICB9XG5cblxuICAvLyBBRkZJWCBQTFVHSU4gREVGSU5JVElPTlxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PVxuXG4gIGZ1bmN0aW9uIFBsdWdpbihvcHRpb24pIHtcbiAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciAkdGhpcyAgID0gJCh0aGlzKVxuICAgICAgdmFyIGRhdGEgICAgPSAkdGhpcy5kYXRhKCdicy5hZmZpeCcpXG4gICAgICB2YXIgb3B0aW9ucyA9IHR5cGVvZiBvcHRpb24gPT0gJ29iamVjdCcgJiYgb3B0aW9uXG5cbiAgICAgIGlmICghZGF0YSkgJHRoaXMuZGF0YSgnYnMuYWZmaXgnLCAoZGF0YSA9IG5ldyBBZmZpeCh0aGlzLCBvcHRpb25zKSkpXG4gICAgICBpZiAodHlwZW9mIG9wdGlvbiA9PSAnc3RyaW5nJykgZGF0YVtvcHRpb25dKClcbiAgICB9KVxuICB9XG5cbiAgdmFyIG9sZCA9ICQuZm4uYWZmaXhcblxuICAkLmZuLmFmZml4ICAgICAgICAgICAgID0gUGx1Z2luXG4gICQuZm4uYWZmaXguQ29uc3RydWN0b3IgPSBBZmZpeFxuXG5cbiAgLy8gQUZGSVggTk8gQ09ORkxJQ1RcbiAgLy8gPT09PT09PT09PT09PT09PT1cblxuICAkLmZuLmFmZml4Lm5vQ29uZmxpY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgJC5mbi5hZmZpeCA9IG9sZFxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuXG4gIC8vIEFGRklYIERBVEEtQVBJXG4gIC8vID09PT09PT09PT09PT09XG5cbiAgJCh3aW5kb3cpLm9uKCdsb2FkJywgZnVuY3Rpb24gKCkge1xuICAgICQoJ1tkYXRhLXNweT1cImFmZml4XCJdJykuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgJHNweSA9ICQodGhpcylcbiAgICAgIHZhciBkYXRhID0gJHNweS5kYXRhKClcblxuICAgICAgZGF0YS5vZmZzZXQgPSBkYXRhLm9mZnNldCB8fCB7fVxuXG4gICAgICBpZiAoZGF0YS5vZmZzZXRCb3R0b20gIT0gbnVsbCkgZGF0YS5vZmZzZXQuYm90dG9tID0gZGF0YS5vZmZzZXRCb3R0b21cbiAgICAgIGlmIChkYXRhLm9mZnNldFRvcCAgICAhPSBudWxsKSBkYXRhLm9mZnNldC50b3AgICAgPSBkYXRhLm9mZnNldFRvcFxuXG4gICAgICBQbHVnaW4uY2FsbCgkc3B5LCBkYXRhKVxuICAgIH0pXG4gIH0pXG5cbn0oalF1ZXJ5KTtcbiIsIi8vIHwtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gfCBGbGV4eSBoZWFkZXJcbi8vIHwtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gfFxuLy8gfCBUaGlzIGpRdWVyeSBzY3JpcHQgaXMgd3JpdHRlbiBieVxuLy8gfFxuLy8gfCBNb3J0ZW4gTmlzc2VuXG4vLyB8IGhqZW1tZXNpZGVrb25nZW4uZGtcbi8vIHxcblxudmFyIGZsZXh5X2hlYWRlciA9IChmdW5jdGlvbiAoJCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBwdWIgPSB7fSxcbiAgICAgICAgJGhlYWRlcl9zdGF0aWMgPSAkKCcuZmxleHktaGVhZGVyLS1zdGF0aWMnKSxcbiAgICAgICAgJGhlYWRlcl9zdGlja3kgPSAkKCcuZmxleHktaGVhZGVyLS1zdGlja3knKSxcbiAgICAgICAgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgIHVwZGF0ZV9pbnRlcnZhbDogMTAwLFxuICAgICAgICAgICAgdG9sZXJhbmNlOiB7XG4gICAgICAgICAgICAgICAgdXB3YXJkOiAyMCxcbiAgICAgICAgICAgICAgICBkb3dud2FyZDogMTBcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvZmZzZXQ6IF9nZXRfb2Zmc2V0X2Zyb21fZWxlbWVudHNfYm90dG9tKCRoZWFkZXJfc3RhdGljKSxcbiAgICAgICAgICAgIGNsYXNzZXM6IHtcbiAgICAgICAgICAgICAgICBwaW5uZWQ6IFwiZmxleHktaGVhZGVyLS1waW5uZWRcIixcbiAgICAgICAgICAgICAgICB1bnBpbm5lZDogXCJmbGV4eS1oZWFkZXItLXVucGlubmVkXCJcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgd2FzX3Njcm9sbGVkID0gZmFsc2UsXG4gICAgICAgIGxhc3RfZGlzdGFuY2VfZnJvbV90b3AgPSAwO1xuXG4gICAgLyoqXG4gICAgICogSW5zdGFudGlhdGVcbiAgICAgKi9cbiAgICBwdWIuaW5pdCA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIHJlZ2lzdGVyRXZlbnRIYW5kbGVycygpO1xuICAgICAgICByZWdpc3RlckJvb3RFdmVudEhhbmRsZXJzKCk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFJlZ2lzdGVyIGJvb3QgZXZlbnQgaGFuZGxlcnNcbiAgICAgKi9cbiAgICBmdW5jdGlvbiByZWdpc3RlckJvb3RFdmVudEhhbmRsZXJzKCkge1xuICAgICAgICAkaGVhZGVyX3N0aWNreS5hZGRDbGFzcyhvcHRpb25zLmNsYXNzZXMudW5waW5uZWQpO1xuXG4gICAgICAgIHNldEludGVydmFsKGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICBpZiAod2FzX3Njcm9sbGVkKSB7XG4gICAgICAgICAgICAgICAgZG9jdW1lbnRfd2FzX3Njcm9sbGVkKCk7XG5cbiAgICAgICAgICAgICAgICB3YXNfc2Nyb2xsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgb3B0aW9ucy51cGRhdGVfaW50ZXJ2YWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlZ2lzdGVyIGV2ZW50IGhhbmRsZXJzXG4gICAgICovXG4gICAgZnVuY3Rpb24gcmVnaXN0ZXJFdmVudEhhbmRsZXJzKCkge1xuICAgICAgICAkKHdpbmRvdykuc2Nyb2xsKGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICB3YXNfc2Nyb2xsZWQgPSB0cnVlO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgb2Zmc2V0IGZyb20gZWxlbWVudCBib3R0b21cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBfZ2V0X29mZnNldF9mcm9tX2VsZW1lbnRzX2JvdHRvbSgkZWxlbWVudCkge1xuICAgICAgICB2YXIgZWxlbWVudF9oZWlnaHQgPSAkZWxlbWVudC5vdXRlckhlaWdodCh0cnVlKSxcbiAgICAgICAgICAgIGVsZW1lbnRfb2Zmc2V0ID0gJGVsZW1lbnQub2Zmc2V0KCkudG9wO1xuXG4gICAgICAgIHJldHVybiAoZWxlbWVudF9oZWlnaHQgKyBlbGVtZW50X29mZnNldCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRG9jdW1lbnQgd2FzIHNjcm9sbGVkXG4gICAgICovXG4gICAgZnVuY3Rpb24gZG9jdW1lbnRfd2FzX3Njcm9sbGVkKCkge1xuICAgICAgICB2YXIgY3VycmVudF9kaXN0YW5jZV9mcm9tX3RvcCA9ICQod2luZG93KS5zY3JvbGxUb3AoKTtcblxuICAgICAgICAvLyBJZiBwYXN0IG9mZnNldFxuICAgICAgICBpZiAoY3VycmVudF9kaXN0YW5jZV9mcm9tX3RvcCA+PSBvcHRpb25zLm9mZnNldCkge1xuXG4gICAgICAgICAgICAvLyBEb3dud2FyZHMgc2Nyb2xsXG4gICAgICAgICAgICBpZiAoY3VycmVudF9kaXN0YW5jZV9mcm9tX3RvcCA+IGxhc3RfZGlzdGFuY2VfZnJvbV90b3ApIHtcblxuICAgICAgICAgICAgICAgIC8vIE9iZXkgdGhlIGRvd253YXJkIHRvbGVyYW5jZVxuICAgICAgICAgICAgICAgIGlmIChNYXRoLmFicyhjdXJyZW50X2Rpc3RhbmNlX2Zyb21fdG9wIC0gbGFzdF9kaXN0YW5jZV9mcm9tX3RvcCkgPD0gb3B0aW9ucy50b2xlcmFuY2UuZG93bndhcmQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICRoZWFkZXJfc3RpY2t5LnJlbW92ZUNsYXNzKG9wdGlvbnMuY2xhc3Nlcy5waW5uZWQpLmFkZENsYXNzKG9wdGlvbnMuY2xhc3Nlcy51bnBpbm5lZCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFVwd2FyZHMgc2Nyb2xsXG4gICAgICAgICAgICBlbHNlIHtcblxuICAgICAgICAgICAgICAgIC8vIE9iZXkgdGhlIHVwd2FyZCB0b2xlcmFuY2VcbiAgICAgICAgICAgICAgICBpZiAoTWF0aC5hYnMoY3VycmVudF9kaXN0YW5jZV9mcm9tX3RvcCAtIGxhc3RfZGlzdGFuY2VfZnJvbV90b3ApIDw9IG9wdGlvbnMudG9sZXJhbmNlLnVwd2FyZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gV2UgYXJlIG5vdCBzY3JvbGxlZCBwYXN0IHRoZSBkb2N1bWVudCB3aGljaCBpcyBwb3NzaWJsZSBvbiB0aGUgTWFjXG4gICAgICAgICAgICAgICAgaWYgKChjdXJyZW50X2Rpc3RhbmNlX2Zyb21fdG9wICsgJCh3aW5kb3cpLmhlaWdodCgpKSA8ICQoZG9jdW1lbnQpLmhlaWdodCgpKSB7XG4gICAgICAgICAgICAgICAgICAgICRoZWFkZXJfc3RpY2t5LnJlbW92ZUNsYXNzKG9wdGlvbnMuY2xhc3Nlcy51bnBpbm5lZCkuYWRkQ2xhc3Mob3B0aW9ucy5jbGFzc2VzLnBpbm5lZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gTm90IHBhc3Qgb2Zmc2V0XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgJGhlYWRlcl9zdGlja3kucmVtb3ZlQ2xhc3Mob3B0aW9ucy5jbGFzc2VzLnBpbm5lZCkuYWRkQ2xhc3Mob3B0aW9ucy5jbGFzc2VzLnVucGlubmVkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxhc3RfZGlzdGFuY2VfZnJvbV90b3AgPSBjdXJyZW50X2Rpc3RhbmNlX2Zyb21fdG9wO1xuICAgIH1cblxuICAgIHJldHVybiBwdWI7XG59KShqUXVlcnkpO1xuIiwiLy8gfC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyB8IEZsZXh5IG5hdmlnYXRpb25cbi8vIHwtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gfFxuLy8gfCBUaGlzIGpRdWVyeSBzY3JpcHQgaXMgd3JpdHRlbiBieVxuLy8gfFxuLy8gfCBNb3J0ZW4gTmlzc2VuXG4vLyB8IGhqZW1tZXNpZGVrb25nZW4uZGtcbi8vIHxcblxudmFyIGZsZXh5X25hdmlnYXRpb24gPSAoZnVuY3Rpb24gKCQpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgcHViID0ge30sXG4gICAgICAgIGxheW91dF9jbGFzc2VzID0ge1xuICAgICAgICAgICAgJ25hdmlnYXRpb24nOiAnLmZsZXh5LW5hdmlnYXRpb24nLFxuICAgICAgICAgICAgJ29iZnVzY2F0b3InOiAnLmZsZXh5LW5hdmlnYXRpb25fX29iZnVzY2F0b3InLFxuICAgICAgICAgICAgJ2Ryb3Bkb3duJzogJy5mbGV4eS1uYXZpZ2F0aW9uX19pdGVtLS1kcm9wZG93bicsXG4gICAgICAgICAgICAnZHJvcGRvd25fbWVnYW1lbnUnOiAnLmZsZXh5LW5hdmlnYXRpb25fX2l0ZW1fX2Ryb3Bkb3duLW1lZ2FtZW51JyxcblxuICAgICAgICAgICAgJ2lzX3VwZ3JhZGVkJzogJ2lzLXVwZ3JhZGVkJyxcbiAgICAgICAgICAgICduYXZpZ2F0aW9uX2hhc19tZWdhbWVudSc6ICdoYXMtbWVnYW1lbnUnLFxuICAgICAgICAgICAgJ2Ryb3Bkb3duX2hhc19tZWdhbWVudSc6ICdmbGV4eS1uYXZpZ2F0aW9uX19pdGVtLS1kcm9wZG93bi13aXRoLW1lZ2FtZW51JyxcbiAgICAgICAgfTtcblxuICAgIC8qKlxuICAgICAqIEluc3RhbnRpYXRlXG4gICAgICovXG4gICAgcHViLmluaXQgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICByZWdpc3RlckV2ZW50SGFuZGxlcnMoKTtcbiAgICAgICAgcmVnaXN0ZXJCb290RXZlbnRIYW5kbGVycygpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBSZWdpc3RlciBib290IGV2ZW50IGhhbmRsZXJzXG4gICAgICovXG4gICAgZnVuY3Rpb24gcmVnaXN0ZXJCb290RXZlbnRIYW5kbGVycygpIHtcblxuICAgICAgICAvLyBVcGdyYWRlXG4gICAgICAgIHVwZ3JhZGUoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZWdpc3RlciBldmVudCBoYW5kbGVyc1xuICAgICAqL1xuICAgIGZ1bmN0aW9uIHJlZ2lzdGVyRXZlbnRIYW5kbGVycygpIHt9XG5cbiAgICAvKipcbiAgICAgKiBVcGdyYWRlIGVsZW1lbnRzLlxuICAgICAqIEFkZCBjbGFzc2VzIHRvIGVsZW1lbnRzLCBiYXNlZCB1cG9uIGF0dGFjaGVkIGNsYXNzZXMuXG4gICAgICovXG4gICAgZnVuY3Rpb24gdXBncmFkZSgpIHtcbiAgICAgICAgdmFyICRuYXZpZ2F0aW9ucyA9ICQobGF5b3V0X2NsYXNzZXMubmF2aWdhdGlvbik7XG5cbiAgICAgICAgLy8gTmF2aWdhdGlvbnNcbiAgICAgICAgaWYgKCRuYXZpZ2F0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAkbmF2aWdhdGlvbnMuZWFjaChmdW5jdGlvbihpbmRleCwgZWxlbWVudCkge1xuICAgICAgICAgICAgICAgIHZhciAkbmF2aWdhdGlvbiA9ICQodGhpcyksXG4gICAgICAgICAgICAgICAgICAgICRtZWdhbWVudXMgPSAkbmF2aWdhdGlvbi5maW5kKGxheW91dF9jbGFzc2VzLmRyb3Bkb3duX21lZ2FtZW51KSxcbiAgICAgICAgICAgICAgICAgICAgJGRyb3Bkb3duX21lZ2FtZW51ID0gJG5hdmlnYXRpb24uZmluZChsYXlvdXRfY2xhc3Nlcy5kcm9wZG93bl9oYXNfbWVnYW1lbnUpO1xuXG4gICAgICAgICAgICAgICAgLy8gSGFzIGFscmVhZHkgYmVlbiB1cGdyYWRlZFxuICAgICAgICAgICAgICAgIGlmICgkbmF2aWdhdGlvbi5oYXNDbGFzcyhsYXlvdXRfY2xhc3Nlcy5pc191cGdyYWRlZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIEhhcyBtZWdhbWVudVxuICAgICAgICAgICAgICAgIGlmICgkbWVnYW1lbnVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgJG5hdmlnYXRpb24uYWRkQ2xhc3MobGF5b3V0X2NsYXNzZXMubmF2aWdhdGlvbl9oYXNfbWVnYW1lbnUpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIFJ1biB0aHJvdWdoIGFsbCBtZWdhbWVudXNcbiAgICAgICAgICAgICAgICAgICAgJG1lZ2FtZW51cy5lYWNoKGZ1bmN0aW9uKGluZGV4LCBlbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgJG1lZ2FtZW51ID0gJCh0aGlzKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYXNfb2JmdXNjYXRvciA9ICQoJ2h0bWwnKS5oYXNDbGFzcygnaGFzLW9iZnVzY2F0b3InKSA/IHRydWUgOiBmYWxzZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgJG1lZ2FtZW51LnBhcmVudHMobGF5b3V0X2NsYXNzZXMuZHJvcGRvd24pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmFkZENsYXNzKGxheW91dF9jbGFzc2VzLmRyb3Bkb3duX2hhc19tZWdhbWVudSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuaG92ZXIoZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGhhc19vYmZ1c2NhdG9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYmZ1c2NhdG9yLnNob3coKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGhhc19vYmZ1c2NhdG9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYmZ1c2NhdG9yLmhpZGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBJcyB1cGdyYWRlZFxuICAgICAgICAgICAgICAgICRuYXZpZ2F0aW9uLmFkZENsYXNzKGxheW91dF9jbGFzc2VzLmlzX3VwZ3JhZGVkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHB1Yjtcbn0pKGpRdWVyeSk7XG4iLCIvKiEgc2lkciAtIHYyLjIuMSAtIDIwMTYtMDItMTdcbiAqIGh0dHA6Ly93d3cuYmVycmlhcnQuY29tL3NpZHIvXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtMjAxNiBBbGJlcnRvIFZhcmVsYTsgTGljZW5zZWQgTUlUICovXG5cbihmdW5jdGlvbiAoKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICB2YXIgYmFiZWxIZWxwZXJzID0ge307XG5cbiAgYmFiZWxIZWxwZXJzLmNsYXNzQ2FsbENoZWNrID0gZnVuY3Rpb24gKGluc3RhbmNlLCBDb25zdHJ1Y3Rvcikge1xuICAgIGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpO1xuICAgIH1cbiAgfTtcblxuICBiYWJlbEhlbHBlcnMuY3JlYXRlQ2xhc3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07XG4gICAgICAgIGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTtcbiAgICAgICAgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlO1xuICAgICAgICBpZiAoXCJ2YWx1ZVwiIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlO1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHtcbiAgICAgIGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7XG4gICAgICBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTtcbiAgICAgIHJldHVybiBDb25zdHJ1Y3RvcjtcbiAgICB9O1xuICB9KCk7XG5cbiAgYmFiZWxIZWxwZXJzO1xuXG4gIHZhciBzaWRyU3RhdHVzID0ge1xuICAgIG1vdmluZzogZmFsc2UsXG4gICAgb3BlbmVkOiBmYWxzZVxuICB9O1xuXG4gIHZhciBoZWxwZXIgPSB7XG4gICAgLy8gQ2hlY2sgZm9yIHZhbGlkcyB1cmxzXG4gICAgLy8gRnJvbSA6IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvNTcxNzA5My9jaGVjay1pZi1hLWphdmFzY3JpcHQtc3RyaW5nLWlzLWFuLXVybFxuXG4gICAgaXNVcmw6IGZ1bmN0aW9uIGlzVXJsKHN0cikge1xuICAgICAgdmFyIHBhdHRlcm4gPSBuZXcgUmVnRXhwKCdeKGh0dHBzPzpcXFxcL1xcXFwvKT8nICsgLy8gcHJvdG9jb2xcbiAgICAgICcoKChbYS16XFxcXGRdKFthLXpcXFxcZC1dKlthLXpcXFxcZF0pKilcXFxcLj8pK1thLXpdezIsfXwnICsgLy8gZG9tYWluIG5hbWVcbiAgICAgICcoKFxcXFxkezEsM31cXFxcLil7M31cXFxcZHsxLDN9KSknICsgLy8gT1IgaXAgKHY0KSBhZGRyZXNzXG4gICAgICAnKFxcXFw6XFxcXGQrKT8oXFxcXC9bLWEtelxcXFxkJV8ufitdKikqJyArIC8vIHBvcnQgYW5kIHBhdGhcbiAgICAgICcoXFxcXD9bOyZhLXpcXFxcZCVfLn4rPS1dKik/JyArIC8vIHF1ZXJ5IHN0cmluZ1xuICAgICAgJyhcXFxcI1stYS16XFxcXGRfXSopPyQnLCAnaScpOyAvLyBmcmFnbWVudCBsb2NhdG9yXG5cbiAgICAgIGlmIChwYXR0ZXJuLnRlc3Qoc3RyKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9LFxuXG5cbiAgICAvLyBBZGQgc2lkciBwcmVmaXhlc1xuICAgIGFkZFByZWZpeGVzOiBmdW5jdGlvbiBhZGRQcmVmaXhlcygkZWxlbWVudCkge1xuICAgICAgdGhpcy5hZGRQcmVmaXgoJGVsZW1lbnQsICdpZCcpO1xuICAgICAgdGhpcy5hZGRQcmVmaXgoJGVsZW1lbnQsICdjbGFzcycpO1xuICAgICAgJGVsZW1lbnQucmVtb3ZlQXR0cignc3R5bGUnKTtcbiAgICB9LFxuICAgIGFkZFByZWZpeDogZnVuY3Rpb24gYWRkUHJlZml4KCRlbGVtZW50LCBhdHRyaWJ1dGUpIHtcbiAgICAgIHZhciB0b1JlcGxhY2UgPSAkZWxlbWVudC5hdHRyKGF0dHJpYnV0ZSk7XG5cbiAgICAgIGlmICh0eXBlb2YgdG9SZXBsYWNlID09PSAnc3RyaW5nJyAmJiB0b1JlcGxhY2UgIT09ICcnICYmIHRvUmVwbGFjZSAhPT0gJ3NpZHItaW5uZXInKSB7XG4gICAgICAgICRlbGVtZW50LmF0dHIoYXR0cmlidXRlLCB0b1JlcGxhY2UucmVwbGFjZSgvKFtBLVphLXowLTlfLlxcLV0rKS9nLCAnc2lkci0nICsgYXR0cmlidXRlICsgJy0kMScpKTtcbiAgICAgIH1cbiAgICB9LFxuXG5cbiAgICAvLyBDaGVjayBpZiB0cmFuc2l0aW9ucyBpcyBzdXBwb3J0ZWRcbiAgICB0cmFuc2l0aW9uczogZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIGJvZHkgPSBkb2N1bWVudC5ib2R5IHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCxcbiAgICAgICAgICBzdHlsZSA9IGJvZHkuc3R5bGUsXG4gICAgICAgICAgc3VwcG9ydGVkID0gZmFsc2UsXG4gICAgICAgICAgcHJvcGVydHkgPSAndHJhbnNpdGlvbic7XG5cbiAgICAgIGlmIChwcm9wZXJ0eSBpbiBzdHlsZSkge1xuICAgICAgICBzdXBwb3J0ZWQgPSB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICB2YXIgcHJlZml4ZXMgPSBbJ21veicsICd3ZWJraXQnLCAnbycsICdtcyddLFxuICAgICAgICAgICAgICBwcmVmaXggPSB1bmRlZmluZWQsXG4gICAgICAgICAgICAgIGkgPSB1bmRlZmluZWQ7XG5cbiAgICAgICAgICBwcm9wZXJ0eSA9IHByb3BlcnR5LmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgcHJvcGVydHkuc3Vic3RyKDEpO1xuICAgICAgICAgIHN1cHBvcnRlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBwcmVmaXhlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICBwcmVmaXggPSBwcmVmaXhlc1tpXTtcbiAgICAgICAgICAgICAgaWYgKHByZWZpeCArIHByb3BlcnR5IGluIHN0eWxlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH0oKTtcbiAgICAgICAgICBwcm9wZXJ0eSA9IHN1cHBvcnRlZCA/ICctJyArIHByZWZpeC50b0xvd2VyQ2FzZSgpICsgJy0nICsgcHJvcGVydHkudG9Mb3dlckNhc2UoKSA6IG51bGw7XG4gICAgICAgIH0pKCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN1cHBvcnRlZDogc3VwcG9ydGVkLFxuICAgICAgICBwcm9wZXJ0eTogcHJvcGVydHlcbiAgICAgIH07XG4gICAgfSgpXG4gIH07XG5cbiAgdmFyICQkMiA9IGpRdWVyeTtcblxuICB2YXIgYm9keUFuaW1hdGlvbkNsYXNzID0gJ3NpZHItYW5pbWF0aW5nJztcbiAgdmFyIG9wZW5BY3Rpb24gPSAnb3Blbic7XG4gIHZhciBjbG9zZUFjdGlvbiA9ICdjbG9zZSc7XG4gIHZhciB0cmFuc2l0aW9uRW5kRXZlbnQgPSAnd2Via2l0VHJhbnNpdGlvbkVuZCBvdHJhbnNpdGlvbmVuZCBvVHJhbnNpdGlvbkVuZCBtc1RyYW5zaXRpb25FbmQgdHJhbnNpdGlvbmVuZCc7XG4gIHZhciBNZW51ID0gZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIE1lbnUobmFtZSkge1xuICAgICAgYmFiZWxIZWxwZXJzLmNsYXNzQ2FsbENoZWNrKHRoaXMsIE1lbnUpO1xuXG4gICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgdGhpcy5pdGVtID0gJCQyKCcjJyArIG5hbWUpO1xuICAgICAgdGhpcy5vcGVuQ2xhc3MgPSBuYW1lID09PSAnc2lkcicgPyAnc2lkci1vcGVuJyA6ICdzaWRyLW9wZW4gJyArIG5hbWUgKyAnLW9wZW4nO1xuICAgICAgdGhpcy5tZW51V2lkdGggPSB0aGlzLml0ZW0ub3V0ZXJXaWR0aCh0cnVlKTtcbiAgICAgIHRoaXMuc3BlZWQgPSB0aGlzLml0ZW0uZGF0YSgnc3BlZWQnKTtcbiAgICAgIHRoaXMuc2lkZSA9IHRoaXMuaXRlbS5kYXRhKCdzaWRlJyk7XG4gICAgICB0aGlzLmRpc3BsYWNlID0gdGhpcy5pdGVtLmRhdGEoJ2Rpc3BsYWNlJyk7XG4gICAgICB0aGlzLnRpbWluZyA9IHRoaXMuaXRlbS5kYXRhKCd0aW1pbmcnKTtcbiAgICAgIHRoaXMubWV0aG9kID0gdGhpcy5pdGVtLmRhdGEoJ21ldGhvZCcpO1xuICAgICAgdGhpcy5vbk9wZW5DYWxsYmFjayA9IHRoaXMuaXRlbS5kYXRhKCdvbk9wZW4nKTtcbiAgICAgIHRoaXMub25DbG9zZUNhbGxiYWNrID0gdGhpcy5pdGVtLmRhdGEoJ29uQ2xvc2UnKTtcbiAgICAgIHRoaXMub25PcGVuRW5kQ2FsbGJhY2sgPSB0aGlzLml0ZW0uZGF0YSgnb25PcGVuRW5kJyk7XG4gICAgICB0aGlzLm9uQ2xvc2VFbmRDYWxsYmFjayA9IHRoaXMuaXRlbS5kYXRhKCdvbkNsb3NlRW5kJyk7XG4gICAgICB0aGlzLmJvZHkgPSAkJDIodGhpcy5pdGVtLmRhdGEoJ2JvZHknKSk7XG4gICAgfVxuXG4gICAgYmFiZWxIZWxwZXJzLmNyZWF0ZUNsYXNzKE1lbnUsIFt7XG4gICAgICBrZXk6ICdnZXRBbmltYXRpb24nLFxuICAgICAgdmFsdWU6IGZ1bmN0aW9uIGdldEFuaW1hdGlvbihhY3Rpb24sIGVsZW1lbnQpIHtcbiAgICAgICAgdmFyIGFuaW1hdGlvbiA9IHt9LFxuICAgICAgICAgICAgcHJvcCA9IHRoaXMuc2lkZTtcblxuICAgICAgICBpZiAoYWN0aW9uID09PSAnb3BlbicgJiYgZWxlbWVudCA9PT0gJ2JvZHknKSB7XG4gICAgICAgICAgYW5pbWF0aW9uW3Byb3BdID0gdGhpcy5tZW51V2lkdGggKyAncHgnO1xuICAgICAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gJ2Nsb3NlJyAmJiBlbGVtZW50ID09PSAnbWVudScpIHtcbiAgICAgICAgICBhbmltYXRpb25bcHJvcF0gPSAnLScgKyB0aGlzLm1lbnVXaWR0aCArICdweCc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYW5pbWF0aW9uW3Byb3BdID0gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBhbmltYXRpb247XG4gICAgICB9XG4gICAgfSwge1xuICAgICAga2V5OiAncHJlcGFyZUJvZHknLFxuICAgICAgdmFsdWU6IGZ1bmN0aW9uIHByZXBhcmVCb2R5KGFjdGlvbikge1xuICAgICAgICB2YXIgcHJvcCA9IGFjdGlvbiA9PT0gJ29wZW4nID8gJ2hpZGRlbicgOiAnJztcblxuICAgICAgICAvLyBQcmVwYXJlIHBhZ2UgaWYgY29udGFpbmVyIGlzIGJvZHlcbiAgICAgICAgaWYgKHRoaXMuYm9keS5pcygnYm9keScpKSB7XG4gICAgICAgICAgdmFyICRodG1sID0gJCQyKCdodG1sJyksXG4gICAgICAgICAgICAgIHNjcm9sbFRvcCA9ICRodG1sLnNjcm9sbFRvcCgpO1xuXG4gICAgICAgICAgJGh0bWwuY3NzKCdvdmVyZmxvdy14JywgcHJvcCkuc2Nyb2xsVG9wKHNjcm9sbFRvcCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LCB7XG4gICAgICBrZXk6ICdvcGVuQm9keScsXG4gICAgICB2YWx1ZTogZnVuY3Rpb24gb3BlbkJvZHkoKSB7XG4gICAgICAgIGlmICh0aGlzLmRpc3BsYWNlKSB7XG4gICAgICAgICAgdmFyIHRyYW5zaXRpb25zID0gaGVscGVyLnRyYW5zaXRpb25zLFxuICAgICAgICAgICAgICAkYm9keSA9IHRoaXMuYm9keTtcblxuICAgICAgICAgIGlmICh0cmFuc2l0aW9ucy5zdXBwb3J0ZWQpIHtcbiAgICAgICAgICAgICRib2R5LmNzcyh0cmFuc2l0aW9ucy5wcm9wZXJ0eSwgdGhpcy5zaWRlICsgJyAnICsgdGhpcy5zcGVlZCAvIDEwMDAgKyAncyAnICsgdGhpcy50aW1pbmcpLmNzcyh0aGlzLnNpZGUsIDApLmNzcyh7XG4gICAgICAgICAgICAgIHdpZHRoOiAkYm9keS53aWR0aCgpLFxuICAgICAgICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJ1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAkYm9keS5jc3ModGhpcy5zaWRlLCB0aGlzLm1lbnVXaWR0aCArICdweCcpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgYm9keUFuaW1hdGlvbiA9IHRoaXMuZ2V0QW5pbWF0aW9uKG9wZW5BY3Rpb24sICdib2R5Jyk7XG5cbiAgICAgICAgICAgICRib2R5LmNzcyh7XG4gICAgICAgICAgICAgIHdpZHRoOiAkYm9keS53aWR0aCgpLFxuICAgICAgICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJ1xuICAgICAgICAgICAgfSkuYW5pbWF0ZShib2R5QW5pbWF0aW9uLCB7XG4gICAgICAgICAgICAgIHF1ZXVlOiBmYWxzZSxcbiAgICAgICAgICAgICAgZHVyYXRpb246IHRoaXMuc3BlZWRcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sIHtcbiAgICAgIGtleTogJ29uQ2xvc2VCb2R5JyxcbiAgICAgIHZhbHVlOiBmdW5jdGlvbiBvbkNsb3NlQm9keSgpIHtcbiAgICAgICAgdmFyIHRyYW5zaXRpb25zID0gaGVscGVyLnRyYW5zaXRpb25zLFxuICAgICAgICAgICAgcmVzZXRTdHlsZXMgPSB7XG4gICAgICAgICAgd2lkdGg6ICcnLFxuICAgICAgICAgIHBvc2l0aW9uOiAnJyxcbiAgICAgICAgICByaWdodDogJycsXG4gICAgICAgICAgbGVmdDogJydcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAodHJhbnNpdGlvbnMuc3VwcG9ydGVkKSB7XG4gICAgICAgICAgcmVzZXRTdHlsZXNbdHJhbnNpdGlvbnMucHJvcGVydHldID0gJyc7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmJvZHkuY3NzKHJlc2V0U3R5bGVzKS51bmJpbmQodHJhbnNpdGlvbkVuZEV2ZW50KTtcbiAgICAgIH1cbiAgICB9LCB7XG4gICAgICBrZXk6ICdjbG9zZUJvZHknLFxuICAgICAgdmFsdWU6IGZ1bmN0aW9uIGNsb3NlQm9keSgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgICAgICBpZiAodGhpcy5kaXNwbGFjZSkge1xuICAgICAgICAgIGlmIChoZWxwZXIudHJhbnNpdGlvbnMuc3VwcG9ydGVkKSB7XG4gICAgICAgICAgICB0aGlzLmJvZHkuY3NzKHRoaXMuc2lkZSwgMCkub25lKHRyYW5zaXRpb25FbmRFdmVudCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICBfdGhpcy5vbkNsb3NlQm9keSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBib2R5QW5pbWF0aW9uID0gdGhpcy5nZXRBbmltYXRpb24oY2xvc2VBY3Rpb24sICdib2R5Jyk7XG5cbiAgICAgICAgICAgIHRoaXMuYm9keS5hbmltYXRlKGJvZHlBbmltYXRpb24sIHtcbiAgICAgICAgICAgICAgcXVldWU6IGZhbHNlLFxuICAgICAgICAgICAgICBkdXJhdGlvbjogdGhpcy5zcGVlZCxcbiAgICAgICAgICAgICAgY29tcGxldGU6IGZ1bmN0aW9uIGNvbXBsZXRlKCkge1xuICAgICAgICAgICAgICAgIF90aGlzLm9uQ2xvc2VCb2R5KCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sIHtcbiAgICAgIGtleTogJ21vdmVCb2R5JyxcbiAgICAgIHZhbHVlOiBmdW5jdGlvbiBtb3ZlQm9keShhY3Rpb24pIHtcbiAgICAgICAgaWYgKGFjdGlvbiA9PT0gb3BlbkFjdGlvbikge1xuICAgICAgICAgIHRoaXMub3BlbkJvZHkoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLmNsb3NlQm9keSgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSwge1xuICAgICAga2V5OiAnb25PcGVuTWVudScsXG4gICAgICB2YWx1ZTogZnVuY3Rpb24gb25PcGVuTWVudShjYWxsYmFjaykge1xuICAgICAgICB2YXIgbmFtZSA9IHRoaXMubmFtZTtcblxuICAgICAgICBzaWRyU3RhdHVzLm1vdmluZyA9IGZhbHNlO1xuICAgICAgICBzaWRyU3RhdHVzLm9wZW5lZCA9IG5hbWU7XG5cbiAgICAgICAgdGhpcy5pdGVtLnVuYmluZCh0cmFuc2l0aW9uRW5kRXZlbnQpO1xuXG4gICAgICAgIHRoaXMuYm9keS5yZW1vdmVDbGFzcyhib2R5QW5pbWF0aW9uQ2xhc3MpLmFkZENsYXNzKHRoaXMub3BlbkNsYXNzKTtcblxuICAgICAgICB0aGlzLm9uT3BlbkVuZENhbGxiYWNrKCk7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIGNhbGxiYWNrKG5hbWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSwge1xuICAgICAga2V5OiAnb3Blbk1lbnUnLFxuICAgICAgdmFsdWU6IGZ1bmN0aW9uIG9wZW5NZW51KGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBfdGhpczIgPSB0aGlzO1xuXG4gICAgICAgIHZhciAkaXRlbSA9IHRoaXMuaXRlbTtcblxuICAgICAgICBpZiAoaGVscGVyLnRyYW5zaXRpb25zLnN1cHBvcnRlZCkge1xuICAgICAgICAgICRpdGVtLmNzcyh0aGlzLnNpZGUsIDApLm9uZSh0cmFuc2l0aW9uRW5kRXZlbnQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIF90aGlzMi5vbk9wZW5NZW51KGNhbGxiYWNrKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YXIgbWVudUFuaW1hdGlvbiA9IHRoaXMuZ2V0QW5pbWF0aW9uKG9wZW5BY3Rpb24sICdtZW51Jyk7XG5cbiAgICAgICAgICAkaXRlbS5jc3MoJ2Rpc3BsYXknLCAnYmxvY2snKS5hbmltYXRlKG1lbnVBbmltYXRpb24sIHtcbiAgICAgICAgICAgIHF1ZXVlOiBmYWxzZSxcbiAgICAgICAgICAgIGR1cmF0aW9uOiB0aGlzLnNwZWVkLFxuICAgICAgICAgICAgY29tcGxldGU6IGZ1bmN0aW9uIGNvbXBsZXRlKCkge1xuICAgICAgICAgICAgICBfdGhpczIub25PcGVuTWVudShjYWxsYmFjayk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LCB7XG4gICAgICBrZXk6ICdvbkNsb3NlTWVudScsXG4gICAgICB2YWx1ZTogZnVuY3Rpb24gb25DbG9zZU1lbnUoY2FsbGJhY2spIHtcbiAgICAgICAgdGhpcy5pdGVtLmNzcyh7XG4gICAgICAgICAgbGVmdDogJycsXG4gICAgICAgICAgcmlnaHQ6ICcnXG4gICAgICAgIH0pLnVuYmluZCh0cmFuc2l0aW9uRW5kRXZlbnQpO1xuICAgICAgICAkJDIoJ2h0bWwnKS5jc3MoJ292ZXJmbG93LXgnLCAnJyk7XG5cbiAgICAgICAgc2lkclN0YXR1cy5tb3ZpbmcgPSBmYWxzZTtcbiAgICAgICAgc2lkclN0YXR1cy5vcGVuZWQgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLmJvZHkucmVtb3ZlQ2xhc3MoYm9keUFuaW1hdGlvbkNsYXNzKS5yZW1vdmVDbGFzcyh0aGlzLm9wZW5DbGFzcyk7XG5cbiAgICAgICAgdGhpcy5vbkNsb3NlRW5kQ2FsbGJhY2soKTtcblxuICAgICAgICAvLyBDYWxsYmFja1xuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgY2FsbGJhY2sobmFtZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LCB7XG4gICAgICBrZXk6ICdjbG9zZU1lbnUnLFxuICAgICAgdmFsdWU6IGZ1bmN0aW9uIGNsb3NlTWVudShjYWxsYmFjaykge1xuICAgICAgICB2YXIgX3RoaXMzID0gdGhpcztcblxuICAgICAgICB2YXIgaXRlbSA9IHRoaXMuaXRlbTtcblxuICAgICAgICBpZiAoaGVscGVyLnRyYW5zaXRpb25zLnN1cHBvcnRlZCkge1xuICAgICAgICAgIGl0ZW0uY3NzKHRoaXMuc2lkZSwgJycpLm9uZSh0cmFuc2l0aW9uRW5kRXZlbnQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIF90aGlzMy5vbkNsb3NlTWVudShjYWxsYmFjayk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIG1lbnVBbmltYXRpb24gPSB0aGlzLmdldEFuaW1hdGlvbihjbG9zZUFjdGlvbiwgJ21lbnUnKTtcblxuICAgICAgICAgIGl0ZW0uYW5pbWF0ZShtZW51QW5pbWF0aW9uLCB7XG4gICAgICAgICAgICBxdWV1ZTogZmFsc2UsXG4gICAgICAgICAgICBkdXJhdGlvbjogdGhpcy5zcGVlZCxcbiAgICAgICAgICAgIGNvbXBsZXRlOiBmdW5jdGlvbiBjb21wbGV0ZSgpIHtcbiAgICAgICAgICAgICAgX3RoaXMzLm9uQ2xvc2VNZW51KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LCB7XG4gICAgICBrZXk6ICdtb3ZlTWVudScsXG4gICAgICB2YWx1ZTogZnVuY3Rpb24gbW92ZU1lbnUoYWN0aW9uLCBjYWxsYmFjaykge1xuICAgICAgICB0aGlzLmJvZHkuYWRkQ2xhc3MoYm9keUFuaW1hdGlvbkNsYXNzKTtcblxuICAgICAgICBpZiAoYWN0aW9uID09PSBvcGVuQWN0aW9uKSB7XG4gICAgICAgICAgdGhpcy5vcGVuTWVudShjYWxsYmFjayk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5jbG9zZU1lbnUoY2FsbGJhY2spO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSwge1xuICAgICAga2V5OiAnbW92ZScsXG4gICAgICB2YWx1ZTogZnVuY3Rpb24gbW92ZShhY3Rpb24sIGNhbGxiYWNrKSB7XG4gICAgICAgIC8vIExvY2sgc2lkclxuICAgICAgICBzaWRyU3RhdHVzLm1vdmluZyA9IHRydWU7XG5cbiAgICAgICAgdGhpcy5wcmVwYXJlQm9keShhY3Rpb24pO1xuICAgICAgICB0aGlzLm1vdmVCb2R5KGFjdGlvbik7XG4gICAgICAgIHRoaXMubW92ZU1lbnUoYWN0aW9uLCBjYWxsYmFjayk7XG4gICAgICB9XG4gICAgfSwge1xuICAgICAga2V5OiAnb3BlbicsXG4gICAgICB2YWx1ZTogZnVuY3Rpb24gb3BlbihjYWxsYmFjaykge1xuICAgICAgICB2YXIgX3RoaXM0ID0gdGhpcztcblxuICAgICAgICAvLyBDaGVjayBpZiBpcyBhbHJlYWR5IG9wZW5lZCBvciBtb3ZpbmdcbiAgICAgICAgaWYgKHNpZHJTdGF0dXMub3BlbmVkID09PSB0aGlzLm5hbWUgfHwgc2lkclN0YXR1cy5tb3ZpbmcpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiBhbm90aGVyIG1lbnUgb3BlbmVkIGNsb3NlIGZpcnN0XG4gICAgICAgIGlmIChzaWRyU3RhdHVzLm9wZW5lZCAhPT0gZmFsc2UpIHtcbiAgICAgICAgICB2YXIgYWxyZWFkeU9wZW5lZE1lbnUgPSBuZXcgTWVudShzaWRyU3RhdHVzLm9wZW5lZCk7XG5cbiAgICAgICAgICBhbHJlYWR5T3BlbmVkTWVudS5jbG9zZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBfdGhpczQub3BlbihjYWxsYmFjayk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLm1vdmUoJ29wZW4nLCBjYWxsYmFjayk7XG5cbiAgICAgICAgLy8gb25PcGVuIGNhbGxiYWNrXG4gICAgICAgIHRoaXMub25PcGVuQ2FsbGJhY2soKTtcbiAgICAgIH1cbiAgICB9LCB7XG4gICAgICBrZXk6ICdjbG9zZScsXG4gICAgICB2YWx1ZTogZnVuY3Rpb24gY2xvc2UoY2FsbGJhY2spIHtcbiAgICAgICAgLy8gQ2hlY2sgaWYgaXMgYWxyZWFkeSBjbG9zZWQgb3IgbW92aW5nXG4gICAgICAgIGlmIChzaWRyU3RhdHVzLm9wZW5lZCAhPT0gdGhpcy5uYW1lIHx8IHNpZHJTdGF0dXMubW92aW5nKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5tb3ZlKCdjbG9zZScsIGNhbGxiYWNrKTtcblxuICAgICAgICAvLyBvbkNsb3NlIGNhbGxiYWNrXG4gICAgICAgIHRoaXMub25DbG9zZUNhbGxiYWNrKCk7XG4gICAgICB9XG4gICAgfSwge1xuICAgICAga2V5OiAndG9nZ2xlJyxcbiAgICAgIHZhbHVlOiBmdW5jdGlvbiB0b2dnbGUoY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHNpZHJTdGF0dXMub3BlbmVkID09PSB0aGlzLm5hbWUpIHtcbiAgICAgICAgICB0aGlzLmNsb3NlKGNhbGxiYWNrKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLm9wZW4oY2FsbGJhY2spO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfV0pO1xuICAgIHJldHVybiBNZW51O1xuICB9KCk7XG5cbiAgdmFyICQkMSA9IGpRdWVyeTtcblxuICBmdW5jdGlvbiBleGVjdXRlKGFjdGlvbiwgbmFtZSwgY2FsbGJhY2spIHtcbiAgICB2YXIgc2lkciA9IG5ldyBNZW51KG5hbWUpO1xuXG4gICAgc3dpdGNoIChhY3Rpb24pIHtcbiAgICAgIGNhc2UgJ29wZW4nOlxuICAgICAgICBzaWRyLm9wZW4oY2FsbGJhY2spO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2Nsb3NlJzpcbiAgICAgICAgc2lkci5jbG9zZShjYWxsYmFjayk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAndG9nZ2xlJzpcbiAgICAgICAgc2lkci50b2dnbGUoY2FsbGJhY2spO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgICQkMS5lcnJvcignTWV0aG9kICcgKyBhY3Rpb24gKyAnIGRvZXMgbm90IGV4aXN0IG9uIGpRdWVyeS5zaWRyJyk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIHZhciBpO1xuICB2YXIgJCA9IGpRdWVyeTtcbiAgdmFyIHB1YmxpY01ldGhvZHMgPSBbJ29wZW4nLCAnY2xvc2UnLCAndG9nZ2xlJ107XG4gIHZhciBtZXRob2ROYW1lO1xuICB2YXIgbWV0aG9kcyA9IHt9O1xuICB2YXIgZ2V0TWV0aG9kID0gZnVuY3Rpb24gZ2V0TWV0aG9kKG1ldGhvZE5hbWUpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKG5hbWUsIGNhbGxiYWNrKSB7XG4gICAgICAvLyBDaGVjayBhcmd1bWVudHNcbiAgICAgIGlmICh0eXBlb2YgbmFtZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBjYWxsYmFjayA9IG5hbWU7XG4gICAgICAgIG5hbWUgPSAnc2lkcic7XG4gICAgICB9IGVsc2UgaWYgKCFuYW1lKSB7XG4gICAgICAgIG5hbWUgPSAnc2lkcic7XG4gICAgICB9XG5cbiAgICAgIGV4ZWN1dGUobWV0aG9kTmFtZSwgbmFtZSwgY2FsbGJhY2spO1xuICAgIH07XG4gIH07XG4gIGZvciAoaSA9IDA7IGkgPCBwdWJsaWNNZXRob2RzLmxlbmd0aDsgaSsrKSB7XG4gICAgbWV0aG9kTmFtZSA9IHB1YmxpY01ldGhvZHNbaV07XG4gICAgbWV0aG9kc1ttZXRob2ROYW1lXSA9IGdldE1ldGhvZChtZXRob2ROYW1lKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNpZHIobWV0aG9kKSB7XG4gICAgaWYgKG1ldGhvZCA9PT0gJ3N0YXR1cycpIHtcbiAgICAgIHJldHVybiBzaWRyU3RhdHVzO1xuICAgIH0gZWxzZSBpZiAobWV0aG9kc1ttZXRob2RdKSB7XG4gICAgICByZXR1cm4gbWV0aG9kc1ttZXRob2RdLmFwcGx5KHRoaXMsIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIG1ldGhvZCA9PT0gJ2Z1bmN0aW9uJyB8fCB0eXBlb2YgbWV0aG9kID09PSAnc3RyaW5nJyB8fCAhbWV0aG9kKSB7XG4gICAgICByZXR1cm4gbWV0aG9kcy50b2dnbGUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgJC5lcnJvcignTWV0aG9kICcgKyBtZXRob2QgKyAnIGRvZXMgbm90IGV4aXN0IG9uIGpRdWVyeS5zaWRyJyk7XG4gICAgfVxuICB9XG5cbiAgdmFyICQkMyA9IGpRdWVyeTtcblxuICBmdW5jdGlvbiBmaWxsQ29udGVudCgkc2lkZU1lbnUsIHNldHRpbmdzKSB7XG4gICAgLy8gVGhlIG1lbnUgY29udGVudFxuICAgIGlmICh0eXBlb2Ygc2V0dGluZ3Muc291cmNlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICB2YXIgbmV3Q29udGVudCA9IHNldHRpbmdzLnNvdXJjZShuYW1lKTtcblxuICAgICAgJHNpZGVNZW51Lmh0bWwobmV3Q29udGVudCk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygc2V0dGluZ3Muc291cmNlID09PSAnc3RyaW5nJyAmJiBoZWxwZXIuaXNVcmwoc2V0dGluZ3Muc291cmNlKSkge1xuICAgICAgJCQzLmdldChzZXR0aW5ncy5zb3VyY2UsIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICRzaWRlTWVudS5odG1sKGRhdGEpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygc2V0dGluZ3Muc291cmNlID09PSAnc3RyaW5nJykge1xuICAgICAgdmFyIGh0bWxDb250ZW50ID0gJycsXG4gICAgICAgICAgc2VsZWN0b3JzID0gc2V0dGluZ3Muc291cmNlLnNwbGl0KCcsJyk7XG5cbiAgICAgICQkMy5lYWNoKHNlbGVjdG9ycywgZnVuY3Rpb24gKGluZGV4LCBlbGVtZW50KSB7XG4gICAgICAgIGh0bWxDb250ZW50ICs9ICc8ZGl2IGNsYXNzPVwic2lkci1pbm5lclwiPicgKyAkJDMoZWxlbWVudCkuaHRtbCgpICsgJzwvZGl2Pic7XG4gICAgICB9KTtcblxuICAgICAgLy8gUmVuYW1pbmcgaWRzIGFuZCBjbGFzc2VzXG4gICAgICBpZiAoc2V0dGluZ3MucmVuYW1pbmcpIHtcbiAgICAgICAgdmFyICRodG1sQ29udGVudCA9ICQkMygnPGRpdiAvPicpLmh0bWwoaHRtbENvbnRlbnQpO1xuXG4gICAgICAgICRodG1sQ29udGVudC5maW5kKCcqJykuZWFjaChmdW5jdGlvbiAoaW5kZXgsIGVsZW1lbnQpIHtcbiAgICAgICAgICB2YXIgJGVsZW1lbnQgPSAkJDMoZWxlbWVudCk7XG5cbiAgICAgICAgICBoZWxwZXIuYWRkUHJlZml4ZXMoJGVsZW1lbnQpO1xuICAgICAgICB9KTtcbiAgICAgICAgaHRtbENvbnRlbnQgPSAkaHRtbENvbnRlbnQuaHRtbCgpO1xuICAgICAgfVxuXG4gICAgICAkc2lkZU1lbnUuaHRtbChodG1sQ29udGVudCk7XG4gICAgfSBlbHNlIGlmIChzZXR0aW5ncy5zb3VyY2UgIT09IG51bGwpIHtcbiAgICAgICQkMy5lcnJvcignSW52YWxpZCBTaWRyIFNvdXJjZScpO1xuICAgIH1cblxuICAgIHJldHVybiAkc2lkZU1lbnU7XG4gIH1cblxuICBmdW5jdGlvbiBmblNpZHIob3B0aW9ucykge1xuICAgIHZhciB0cmFuc2l0aW9ucyA9IGhlbHBlci50cmFuc2l0aW9ucyxcbiAgICAgICAgc2V0dGluZ3MgPSAkJDMuZXh0ZW5kKHtcbiAgICAgIG5hbWU6ICdzaWRyJywgLy8gTmFtZSBmb3IgdGhlICdzaWRyJ1xuICAgICAgc3BlZWQ6IDIwMCwgLy8gQWNjZXB0cyBzdGFuZGFyZCBqUXVlcnkgZWZmZWN0cyBzcGVlZHMgKGkuZS4gZmFzdCwgbm9ybWFsIG9yIG1pbGxpc2Vjb25kcylcbiAgICAgIHNpZGU6ICdsZWZ0JywgLy8gQWNjZXB0cyAnbGVmdCcgb3IgJ3JpZ2h0J1xuICAgICAgc291cmNlOiBudWxsLCAvLyBPdmVycmlkZSB0aGUgc291cmNlIG9mIHRoZSBjb250ZW50LlxuICAgICAgcmVuYW1pbmc6IHRydWUsIC8vIFRoZSBpZHMgYW5kIGNsYXNzZXMgd2lsbCBiZSBwcmVwZW5kZWQgd2l0aCBhIHByZWZpeCB3aGVuIGxvYWRpbmcgZXhpc3RlbnQgY29udGVudFxuICAgICAgYm9keTogJ2JvZHknLCAvLyBQYWdlIGNvbnRhaW5lciBzZWxlY3RvcixcbiAgICAgIGRpc3BsYWNlOiB0cnVlLCAvLyBEaXNwbGFjZSB0aGUgYm9keSBjb250ZW50IG9yIG5vdFxuICAgICAgdGltaW5nOiAnZWFzZScsIC8vIFRpbWluZyBmdW5jdGlvbiBmb3IgQ1NTIHRyYW5zaXRpb25zXG4gICAgICBtZXRob2Q6ICd0b2dnbGUnLCAvLyBUaGUgbWV0aG9kIHRvIGNhbGwgd2hlbiBlbGVtZW50IGlzIGNsaWNrZWRcbiAgICAgIGJpbmQ6ICd0b3VjaHN0YXJ0IGNsaWNrJywgLy8gVGhlIGV2ZW50KHMpIHRvIHRyaWdnZXIgdGhlIG1lbnVcbiAgICAgIG9uT3BlbjogZnVuY3Rpb24gb25PcGVuKCkge30sXG4gICAgICAvLyBDYWxsYmFjayB3aGVuIHNpZHIgc3RhcnQgb3BlbmluZ1xuICAgICAgb25DbG9zZTogZnVuY3Rpb24gb25DbG9zZSgpIHt9LFxuICAgICAgLy8gQ2FsbGJhY2sgd2hlbiBzaWRyIHN0YXJ0IGNsb3NpbmdcbiAgICAgIG9uT3BlbkVuZDogZnVuY3Rpb24gb25PcGVuRW5kKCkge30sXG4gICAgICAvLyBDYWxsYmFjayB3aGVuIHNpZHIgZW5kIG9wZW5pbmdcbiAgICAgIG9uQ2xvc2VFbmQ6IGZ1bmN0aW9uIG9uQ2xvc2VFbmQoKSB7fSAvLyBDYWxsYmFjayB3aGVuIHNpZHIgZW5kIGNsb3NpbmdcblxuICAgIH0sIG9wdGlvbnMpLFxuICAgICAgICBuYW1lID0gc2V0dGluZ3MubmFtZSxcbiAgICAgICAgJHNpZGVNZW51ID0gJCQzKCcjJyArIG5hbWUpO1xuXG4gICAgLy8gSWYgdGhlIHNpZGUgbWVudSBkbyBub3QgZXhpc3QgY3JlYXRlIGl0XG4gICAgaWYgKCRzaWRlTWVudS5sZW5ndGggPT09IDApIHtcbiAgICAgICRzaWRlTWVudSA9ICQkMygnPGRpdiAvPicpLmF0dHIoJ2lkJywgbmFtZSkuYXBwZW5kVG8oJCQzKCdib2R5JykpO1xuICAgIH1cblxuICAgIC8vIEFkZCB0cmFuc2l0aW9uIHRvIG1lbnUgaWYgYXJlIHN1cHBvcnRlZFxuICAgIGlmICh0cmFuc2l0aW9ucy5zdXBwb3J0ZWQpIHtcbiAgICAgICRzaWRlTWVudS5jc3ModHJhbnNpdGlvbnMucHJvcGVydHksIHNldHRpbmdzLnNpZGUgKyAnICcgKyBzZXR0aW5ncy5zcGVlZCAvIDEwMDAgKyAncyAnICsgc2V0dGluZ3MudGltaW5nKTtcbiAgICB9XG5cbiAgICAvLyBBZGRpbmcgc3R5bGVzIGFuZCBvcHRpb25zXG4gICAgJHNpZGVNZW51LmFkZENsYXNzKCdzaWRyJykuYWRkQ2xhc3Moc2V0dGluZ3Muc2lkZSkuZGF0YSh7XG4gICAgICBzcGVlZDogc2V0dGluZ3Muc3BlZWQsXG4gICAgICBzaWRlOiBzZXR0aW5ncy5zaWRlLFxuICAgICAgYm9keTogc2V0dGluZ3MuYm9keSxcbiAgICAgIGRpc3BsYWNlOiBzZXR0aW5ncy5kaXNwbGFjZSxcbiAgICAgIHRpbWluZzogc2V0dGluZ3MudGltaW5nLFxuICAgICAgbWV0aG9kOiBzZXR0aW5ncy5tZXRob2QsXG4gICAgICBvbk9wZW46IHNldHRpbmdzLm9uT3BlbixcbiAgICAgIG9uQ2xvc2U6IHNldHRpbmdzLm9uQ2xvc2UsXG4gICAgICBvbk9wZW5FbmQ6IHNldHRpbmdzLm9uT3BlbkVuZCxcbiAgICAgIG9uQ2xvc2VFbmQ6IHNldHRpbmdzLm9uQ2xvc2VFbmRcbiAgICB9KTtcblxuICAgICRzaWRlTWVudSA9IGZpbGxDb250ZW50KCRzaWRlTWVudSwgc2V0dGluZ3MpO1xuXG4gICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgJHRoaXMgPSAkJDModGhpcyksXG4gICAgICAgICAgZGF0YSA9ICR0aGlzLmRhdGEoJ3NpZHInKSxcbiAgICAgICAgICBmbGFnID0gZmFsc2U7XG5cbiAgICAgIC8vIElmIHRoZSBwbHVnaW4gaGFzbid0IGJlZW4gaW5pdGlhbGl6ZWQgeWV0XG4gICAgICBpZiAoIWRhdGEpIHtcbiAgICAgICAgc2lkclN0YXR1cy5tb3ZpbmcgPSBmYWxzZTtcbiAgICAgICAgc2lkclN0YXR1cy5vcGVuZWQgPSBmYWxzZTtcblxuICAgICAgICAkdGhpcy5kYXRhKCdzaWRyJywgbmFtZSk7XG5cbiAgICAgICAgJHRoaXMuYmluZChzZXR0aW5ncy5iaW5kLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgICAgaWYgKCFmbGFnKSB7XG4gICAgICAgICAgICBmbGFnID0gdHJ1ZTtcbiAgICAgICAgICAgIHNpZHIoc2V0dGluZ3MubWV0aG9kLCBuYW1lKTtcblxuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIGZsYWcgPSBmYWxzZTtcbiAgICAgICAgICAgIH0sIDEwMCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGpRdWVyeS5zaWRyID0gc2lkcjtcbiAgalF1ZXJ5LmZuLnNpZHIgPSBmblNpZHI7XG5cbn0oKSk7IiwiKGZ1bmN0aW9uKCkge1xuICB2YXIgdG9nZ2xlQWxsQnV0dG9ucyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5qcy1idWxsZXRwb2ludC10b2dnbGUtYWxsJyk7XG4gIHZhciB0b2dnbGVCdWxsZXRwb2ludEJ1dHRvbnMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuanMtYnVsbGV0cG9pbnQtdG9nZ2xlLWJ1bGxldHBvaW50Jyk7XG4gIHZhciB0b2dnbGVBdHRhY2htZW50c0J1dHRvbnMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuanMtYnVsbGV0cG9pbnQtdG9nZ2xlLWF0dGFjaG1lbnRzJyk7XG4gIHZhciBhZGRCdWxsZXRwb2ludEJ1dHRvbnMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuanMtYnVsbGV0cG9pbnQtYWRkJyk7XG5cbiAgLy8gVG9nZ2xlIGFsbC5cbiAgZm9yICh2YXIgdG9nZ2xlQWxsQnV0dG9uIG9mIHRvZ2dsZUFsbEJ1dHRvbnMpIHtcbiAgICB0b2dnbGVBbGxCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVUb2dnbGVBbGwpO1xuICB9XG5cbiAgZnVuY3Rpb24gaGFuZGxlVG9nZ2xlQWxsKGV2ZW50KSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgIHZhciBidWxsZXRwb2ludHMgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdidWxsZXRwb2ludCcpO1xuICAgIHZhciBjdXJyZW50U3RhdGUgPSB0b2dnbGVBbGxCdXR0b24uZGF0YXNldC5jdXJyZW50U3RhdGU7XG5cbiAgICBpZiAoY3VycmVudFN0YXRlID09PSAnb3BlbicpIHtcbiAgICAgIHRvZ2dsZUFsbEJ1dHRvbi5kYXRhc2V0LmN1cnJlbnRTdGF0ZSA9ICdjbG9zZWQnO1xuXG4gICAgICBmb3IgKHZhciBidWxsZXRwb2ludCBvZiBidWxsZXRwb2ludHMpIHtcbiAgICAgICAgYnVsbGV0cG9pbnQuY2xhc3NMaXN0LnJlbW92ZSgnYnVsbGV0cG9pbnQtLW9wZW4nKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB0b2dnbGVBbGxCdXR0b24uZGF0YXNldC5jdXJyZW50U3RhdGUgPSAnb3Blbic7XG5cbiAgICAgIGZvciAodmFyIGJ1bGxldHBvaW50IG9mIGJ1bGxldHBvaW50cykge1xuICAgICAgICBidWxsZXRwb2ludC5jbGFzc0xpc3QuYWRkKCdidWxsZXRwb2ludC0tb3BlbicpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIFRvZ2dsZSBhdHRhY2htZW50cy5cbiAgZm9yICh2YXIgdG9nZ2xlQXR0YWNobWVudEJ1dHRvbiBvZiB0b2dnbGVBdHRhY2htZW50c0J1dHRvbnMpIHtcbiAgICB0b2dnbGVBdHRhY2htZW50QnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlVG9nZ2xlQXR0YWNobWVudHMpO1xuICB9XG5cbiAgZnVuY3Rpb24gaGFuZGxlVG9nZ2xlQXR0YWNobWVudHMoZXZlbnQpIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgdmFyIGVsZW1lbnQgPSB0aGlzO1xuICAgIHZhciBwYXJlbnQgPSBlbGVtZW50LmNsb3Nlc3QoJy5idWxsZXRwb2ludCcpO1xuXG4gICAgcGFyZW50LmNsYXNzTGlzdC50b2dnbGUoJ2J1bGxldHBvaW50LS1vcGVuJyk7XG5cbiAgICAvLyBSdW4gdGhyb3VnaCBhdHRhY2htZW50cyBhbmQgdG9nZ2xlIHRoZW0uXG4gICAgdmFyIGF0dGFjaG1lbnRzID0gcGFyZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5idWxsZXRwb2ludC0tYXR0YWNobWVudCcpO1xuXG4gICAgaWYgKHBhcmVudC5jbGFzc0xpc3QuY29udGFpbnMoJ2J1bGxldHBvaW50LS1vcGVuJykpIHtcbiAgICAgIGZvciAodmFyIGF0dGFjaG1lbnQgb2YgYXR0YWNobWVudHMpIHtcbiAgICAgICAgYXR0YWNobWVudC5jbGFzc0xpc3QuYWRkKCdidWxsZXRwb2ludC0tb3BlbicpO1xuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGZvciAodmFyIGF0dGFjaG1lbnQgb2YgYXR0YWNobWVudHMpIHtcbiAgICAgICAgYXR0YWNobWVudC5jbGFzc0xpc3QucmVtb3ZlKCdidWxsZXRwb2ludC0tb3BlbicpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIFRvZ2dsZSBidWxsZXRwb2ludC5cbiAgZm9yICh2YXIgdG9nZ2xlQnVsbGV0cG9pbnRCdXR0b24gb2YgdG9nZ2xlQnVsbGV0cG9pbnRCdXR0b25zKSB7XG4gICAgdG9nZ2xlQnVsbGV0cG9pbnRCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVUb2dnbGVCdWxsZXRwb2ludCk7XG4gIH1cblxuICBmdW5jdGlvbiBoYW5kbGVUb2dnbGVCdWxsZXRwb2ludChldmVudCkge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICB2YXIgZWxlbWVudCA9IHRoaXM7XG4gICAgdmFyIHBhcmVudCA9IGVsZW1lbnQuY2xvc2VzdCgnLmJ1bGxldHBvaW50Jyk7XG4gICAgdmFyIGlkID0gcGFyZW50LmRhdGFzZXQuZGVjcmV0b05vZGVJZDtcblxuICAgIC8vIEFkZCBzZWxlY3RlZCBidWxsZXRwb2ludCBwYXJhbSB0byBVUkwgLSBvbmx5IGlmIGl0J3MgYVxuICAgIC8vIHBhcmVudCBidWxsZXRwb2ludCB0aGF0IGhhcyBiZWVuIG9wZW5lZC5cbiAgICBpZiAoIXBhcmVudC5jbGFzc0xpc3QuY29udGFpbnMoJ2J1bGxldHBvaW50LS1hdHRhY2htZW50JykpIHtcbiAgICAgIHdpbmRvdy5oaXN0b3J5LnB1c2hTdGF0ZShudWxsLCBudWxsLCAnP2J1bGxldHBvaW50PScgKyBpZCk7XG4gICAgfVxuXG4gICAgLy8gVG9nZ2xlIHZpc2liaWxpdHkuXG4gICAgcGFyZW50LmNsYXNzTGlzdC50b2dnbGUoJ2J1bGxldHBvaW50LS1vcGVuJyk7XG4gIH1cblxuICAvLyBBZGQgYnVsbGV0cG9pbnQgYXR0YWNobWVudC5cbiAgZm9yICh2YXIgYWRkQnVsbGV0cG9pbnRCdXR0b24gb2YgYWRkQnVsbGV0cG9pbnRCdXR0b25zKSB7XG4gICAgYWRkQnVsbGV0cG9pbnRCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVBZGRCdWxsZXRwb2ludCk7XG4gIH1cblxuICBmdW5jdGlvbiBoYW5kbGVBZGRCdWxsZXRwb2ludCgpIHtcbiAgICB2YXIgZWxlbWVudCA9IHRoaXM7XG4gICAgdmFyIHBhcmVudCA9IGVsZW1lbnQuY2xvc2VzdCgnLmJ1bGxldHBvaW50Jyk7XG4gICAgdmFyIGlkID0gcGFyZW50LmRhdGFzZXQuZGVjcmV0b05vZGVJZDtcblxuICAgIC8vIEFkZCBidWxsZXRwb2ludCBwYXJhbSB0byBVUkwuXG4gICAgd2luZG93Lmhpc3RvcnkucHVzaFN0YXRlKG51bGwsIG51bGwsICc/YnVsbGV0cG9pbnQ9JyArIGlkKTtcbiAgfVxuXG4gIC8vIFBhZ2UgbG9hZC5cbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGZ1bmN0aW9uKCkge1xuICAgIHZhciBxdWVyeVN0cmluZyA9IHdpbmRvdy5sb2NhdGlvbi5zZWFyY2g7XG4gICAgdmFyIHVybFBhcmFtcyA9IG5ldyBVUkxTZWFyY2hQYXJhbXMocXVlcnlTdHJpbmcpO1xuICAgIHZhciBwYXJhbSA9IHVybFBhcmFtcy5nZXQoJ2J1bGxldHBvaW50Jyk7XG5cbiAgICBpZiAocGFyYW0gIT09IG51bGwpIHtcbiAgICAgIHZhciBidWxsZXRwb2ludCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdidWxsZXRwb2ludC0tJyArIHBhcmFtKTtcblxuICAgICAgaWYgKGJ1bGxldHBvaW50ICE9PSBudWxsKSB7XG4gICAgICAgIGJ1bGxldHBvaW50LmNsYXNzTGlzdC5hZGQoJ2J1bGxldHBvaW50LS1vcGVuJyk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcblxuICBmdW5jdGlvbiBnZXRVcmxQYXJhbXMoKSB7XG4gICAgdmFyIHBhcmFtcyA9IHt9O1xuICAgIHZhciBwYXJ0cyA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmLnJlcGxhY2UoL1s/Jl0rKFtePSZdKyk9KFteJl0qKS9naSwgZnVuY3Rpb24obSxrZXksdmFsdWUpIHtcbiAgICAgIHBhcmFtc1trZXldID0gdmFsdWU7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcGFyYW1zO1xuICB9XG59KSgpO1xuIiwiKGZ1bmN0aW9uKCkge1xuICBjb25zdCBzaWRlYmFyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmxheW91dF9fc2lkZWJhcicpO1xuICBjb25zdCB0b2dnbGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmpzLXRvZ2dsZS1zaWRlYmFyJyk7XG5cbiAgY29uc3QgdG9nZ2xlU3RhdGUgPSAoKSA9PiB7XG4gICAgY29uc3QgY3VycmVudFN0YXRlID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3NpZGViYXInKTtcblxuICAgIGlmIChjdXJyZW50U3RhdGUgPT09ICduYXJyb3cnKSB7XG4gICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnc2lkZWJhcicsICd3aWRlJyk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ3NpZGViYXInLCAnbmFycm93Jyk7XG4gICAgfVxuICB9O1xuXG4gIC8vIEFkZCBldmVudGxpc3RlbmVycy5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0b2dnbGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgbGV0IHRvZ2dsZSA9IHRvZ2dsZXNbaV07XG5cbiAgICB0b2dnbGUuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBlID0+IHtcbiAgICAgIHNpZGViYXIuY2xhc3NMaXN0LnRvZ2dsZSgnbGF5b3V0X19zaWRlYmFyLS1uYXJyb3cnKTtcblxuICAgICAgdG9nZ2xlU3RhdGUoKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vIE9uIGxvYWQuXG4gIGNvbnN0IGN1cnJlbnRTdGF0ZSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdzaWRlYmFyJyk7XG5cbiAgaWYgKGN1cnJlbnRTdGF0ZSA9PT0gJ25hcnJvdycpIHtcbiAgICBzaWRlYmFyLmNsYXNzTGlzdC5hZGQoJ2xheW91dF9fc2lkZWJhci0tbmFycm93Jyk7XG4gIH1cbiAgZWxzZSB7XG4gICAgc2lkZWJhci5jbGFzc0xpc3QucmVtb3ZlKCdsYXlvdXRfX3NpZGViYXItLW5hcnJvdycpO1xuICB9XG59KSgpO1xuIiwialF1ZXJ5KGZ1bmN0aW9uICgkKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICAvLyBGbGV4eSBoZWFkZXJcbiAgZmxleHlfaGVhZGVyLmluaXQoKTtcblxuICAkKCcuc2lkci10b2dnbGUtLXJpZ2h0Jykuc2lkcih7XG4gICAgbmFtZTogJ3NpZHItbWFpbicsXG4gICAgc2lkZTogJ3JpZ2h0JyxcbiAgICByZW5hbWluZzogZmFsc2UsXG4gICAgYm9keTogJy5sYXlvdXRfX3dyYXBwZXInLFxuICAgIHNvdXJjZTogJy5zaWRyLXNvdXJjZS1wcm92aWRlcidcbiAgfSk7XG5cbiAgLy8gRW5hYmxlIHRvb2x0aXBzLlxuICAkKCdbZGF0YS10b2dnbGU9XCJ0b29sdGlwXCJdJykudG9vbHRpcCgpO1xuXG4gIC8vIFBvcHB5IChwb3BvdmVycykuXG4gICQoJy5wb3BweS10b2dnbGUnKS5vbignY2xpY2snLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICB2YXIgJGVsZW1lbnQgPSAkKHRoaXMpO1xuICAgIHZhciAkcGFyZW50ID0gJGVsZW1lbnQucGFyZW50cygnLnBvcHB5Jyk7XG5cbiAgICAvLyBNYWtlIHN1cmUgdGhhdCBubyBvdGhlciBcInBvcHB5c1wiIGFyZSBvcGVuLlxuICAgICQoJy5wb3BweS0tb3BlbicpXG4gICAgICAubm90KCRwYXJlbnQpXG4gICAgICAucmVtb3ZlQ2xhc3MoJ3BvcHB5LS1vcGVuJyk7XG5cbiAgICAvLyBUb2dnbGUgdGhlIGNsYXNzIG9uIHRoaXMgZWxlbWVudC5cbiAgICAkcGFyZW50LnRvZ2dsZUNsYXNzKCdwb3BweS0tb3BlbicpO1xuICB9KTtcbiAgJCgnLnBvcHB5Jykub24oJ2NsaWNrJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gIH0pO1xuICAkKCdib2R5Jykub24oJ2NsaWNrJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgJCgnLnBvcHB5LS1vcGVuJykucmVtb3ZlQ2xhc3MoJ3BvcHB5LS1vcGVuJyk7XG4gIH0pO1xuXG4gIC8vIEFqYXhpIGNsaWNrIGxvYWRlci5cbiAgJCgnW2RhdGEtYWpheGktc291cmNlXScpLm9uKCdjbGljaycsIGZ1bmN0aW9uIChldmVudCkge1xuICAgIHZhciAkZWxlbWVudCA9ICQodGhpcyk7XG4gICAgdmFyIHRhcmdldCA9ICRlbGVtZW50LmF0dHIoJ2RhdGEtYWpheGktdGFyZ2V0Jyk7XG4gICAgdmFyIHNvdXJjZSA9ICRlbGVtZW50LmF0dHIoJ2RhdGEtYWpheGktc291cmNlJyk7XG4gICAgdmFyIGxvYWRpbmcgPSAkZWxlbWVudC5hdHRyKCdkYXRhLWFqYXhpLWxvYWRpbmcnKTtcblxuICAgIC8vIFNldCBsb2FkaW5nIHRleHQuXG4gICAgJCh0YXJnZXQpLmh0bWwobG9hZGluZyk7XG5cbiAgICAvLyBMb2FkIGV4dGVybmFsIGNvbnRlbnQuXG4gICAgJCh0YXJnZXQpLmxvYWQoc291cmNlKTtcbiAgfSk7XG5cbiAgLy8gU3dpdGNoIG1vZGUgdG9nZ2xlIGNhbGxiYWNrLlxuICAkKCcjbWVldGluZy1hZ2VuZGEtc3dpdGNoLW1vZGUtdG9nZ2xlJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgJCgnI2FnZW5kYS1vdmVydmlldycpLnRvZ2dsZUNsYXNzKCdoaWRkZW4nKTtcbiAgICAkKCcjYWdlbmRhLWl0ZW0tcmVvcmRlcicpLnRvZ2dsZUNsYXNzKCdoaWRkZW4nKTtcblxuICAgIC8vIFJlc2V0dGluZyBzZWFyY2guXG4gICAgJCgnLmJ1bGxldHBvaW50JykucmVtb3ZlQ2xhc3MoJ2hpZGRlbicpO1xuICAgICQoJ2Zvcm0uZGVjcmV0by1jb250ZW50LW1vZGlmeS1zZWFyY2gtaW4tbWVldGluZy1mb3JtIGlucHV0JykudmFsKCcnKTtcblxuICAgIC8vIFRvZ2dsZSBzZWFyY2ggZW5hYmxlZC5cbiAgICBpZiAoJCgnI2FnZW5kYS1vdmVydmlldycpLmhhc0NsYXNzKCdoaWRkZW4nKSkge1xuICAgICAgJCgnZm9ybS5kZWNyZXRvLWNvbnRlbnQtbW9kaWZ5LXNlYXJjaC1pbi1tZWV0aW5nLWZvcm0gaW5wdXQnKS5hdHRyKCdkaXNhYmxlZCcsICdkaXNhYmxlZCcpXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgJCgnZm9ybS5kZWNyZXRvLWNvbnRlbnQtbW9kaWZ5LXNlYXJjaC1pbi1tZWV0aW5nLWZvcm0gaW5wdXQnKS5yZW1vdmVBdHRyKCdkaXNhYmxlZCcpO1xuICAgIH1cblxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gIH0pO1xufSk7XG4iXX0=
