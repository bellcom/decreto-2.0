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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBhY2UuanMiLCJib290c3RyYXAuanMiLCJmbGV4eS1oZWFkZXIuanMiLCJmbGV4eS1uYXZpZ2F0aW9uLmpzIiwianF1ZXJ5LnNpZHIuanMiLCJidWxsZXRwb2ludC5qcyIsInNpZGViYXIuanMiLCJhcHAuanMiXSwibmFtZXMiOlsiQWpheE1vbml0b3IiLCJCYXIiLCJEb2N1bWVudE1vbml0b3IiLCJFbGVtZW50TW9uaXRvciIsIkVsZW1lbnRUcmFja2VyIiwiRXZlbnRMYWdNb25pdG9yIiwiRXZlbnRlZCIsIkV2ZW50cyIsIk5vVGFyZ2V0RXJyb3IiLCJQYWNlIiwiUmVxdWVzdEludGVyY2VwdCIsIlNPVVJDRV9LRVlTIiwiU2NhbGVyIiwiU29ja2V0UmVxdWVzdFRyYWNrZXIiLCJYSFJSZXF1ZXN0VHJhY2tlciIsImFuaW1hdGlvbiIsImF2Z0FtcGxpdHVkZSIsImJhciIsImNhbmNlbEFuaW1hdGlvbiIsImNhbmNlbEFuaW1hdGlvbkZyYW1lIiwiZGVmYXVsdE9wdGlvbnMiLCJleHRlbmQiLCJleHRlbmROYXRpdmUiLCJnZXRGcm9tRE9NIiwiZ2V0SW50ZXJjZXB0IiwiaGFuZGxlUHVzaFN0YXRlIiwiaWdub3JlU3RhY2siLCJpbml0Iiwibm93Iiwib3B0aW9ucyIsInJlcXVlc3RBbmltYXRpb25GcmFtZSIsInJlc3VsdCIsInJ1bkFuaW1hdGlvbiIsInNjYWxlcnMiLCJzaG91bGRJZ25vcmVVUkwiLCJzaG91bGRUcmFjayIsInNvdXJjZSIsInNvdXJjZXMiLCJ1bmlTY2FsZXIiLCJfV2ViU29ja2V0IiwiX1hEb21haW5SZXF1ZXN0IiwiX1hNTEh0dHBSZXF1ZXN0IiwiX2kiLCJfaW50ZXJjZXB0IiwiX2xlbiIsIl9wdXNoU3RhdGUiLCJfcmVmIiwiX3JlZjEiLCJfcmVwbGFjZVN0YXRlIiwiX19zbGljZSIsInNsaWNlIiwiX19oYXNQcm9wIiwiaGFzT3duUHJvcGVydHkiLCJfX2V4dGVuZHMiLCJjaGlsZCIsInBhcmVudCIsImtleSIsImNhbGwiLCJjdG9yIiwiY29uc3RydWN0b3IiLCJwcm90b3R5cGUiLCJfX3N1cGVyX18iLCJfX2luZGV4T2YiLCJpbmRleE9mIiwiaXRlbSIsImkiLCJsIiwibGVuZ3RoIiwiY2F0Y2h1cFRpbWUiLCJpbml0aWFsUmF0ZSIsIm1pblRpbWUiLCJnaG9zdFRpbWUiLCJtYXhQcm9ncmVzc1BlckZyYW1lIiwiZWFzZUZhY3RvciIsInN0YXJ0T25QYWdlTG9hZCIsInJlc3RhcnRPblB1c2hTdGF0ZSIsInJlc3RhcnRPblJlcXVlc3RBZnRlciIsInRhcmdldCIsImVsZW1lbnRzIiwiY2hlY2tJbnRlcnZhbCIsInNlbGVjdG9ycyIsImV2ZW50TGFnIiwibWluU2FtcGxlcyIsInNhbXBsZUNvdW50IiwibGFnVGhyZXNob2xkIiwiYWpheCIsInRyYWNrTWV0aG9kcyIsInRyYWNrV2ViU29ja2V0cyIsImlnbm9yZVVSTHMiLCJwZXJmb3JtYW5jZSIsIkRhdGUiLCJ3aW5kb3ciLCJtb3pSZXF1ZXN0QW5pbWF0aW9uRnJhbWUiLCJ3ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUiLCJtc1JlcXVlc3RBbmltYXRpb25GcmFtZSIsIm1vekNhbmNlbEFuaW1hdGlvbkZyYW1lIiwiZm4iLCJzZXRUaW1lb3V0IiwiaWQiLCJjbGVhclRpbWVvdXQiLCJsYXN0IiwidGljayIsImRpZmYiLCJhcmdzIiwib2JqIiwiYXJndW1lbnRzIiwiYXBwbHkiLCJvdXQiLCJ2YWwiLCJhcnIiLCJjb3VudCIsInN1bSIsInYiLCJNYXRoIiwiYWJzIiwianNvbiIsImRhdGEiLCJlIiwiZWwiLCJkb2N1bWVudCIsInF1ZXJ5U2VsZWN0b3IiLCJnZXRBdHRyaWJ1dGUiLCJKU09OIiwicGFyc2UiLCJfZXJyb3IiLCJjb25zb2xlIiwiZXJyb3IiLCJvbiIsImV2ZW50IiwiaGFuZGxlciIsImN0eCIsIm9uY2UiLCJfYmFzZSIsImJpbmRpbmdzIiwicHVzaCIsIm9mZiIsIl9yZXN1bHRzIiwic3BsaWNlIiwidHJpZ2dlciIsInBhY2VPcHRpb25zIiwiX3N1cGVyIiwiRXJyb3IiLCJwcm9ncmVzcyIsImdldEVsZW1lbnQiLCJ0YXJnZXRFbGVtZW50IiwiY3JlYXRlRWxlbWVudCIsImNsYXNzTmFtZSIsImJvZHkiLCJyZXBsYWNlIiwiaW5uZXJIVE1MIiwiZmlyc3RDaGlsZCIsImluc2VydEJlZm9yZSIsImFwcGVuZENoaWxkIiwiZmluaXNoIiwidXBkYXRlIiwicHJvZyIsInJlbmRlciIsImRlc3Ryb3kiLCJwYXJlbnROb2RlIiwicmVtb3ZlQ2hpbGQiLCJwcm9ncmVzc1N0ciIsInRyYW5zZm9ybSIsIl9qIiwiX2xlbjEiLCJfcmVmMiIsImNoaWxkcmVuIiwic3R5bGUiLCJsYXN0UmVuZGVyZWRQcm9ncmVzcyIsInNldEF0dHJpYnV0ZSIsImRvbmUiLCJuYW1lIiwiYmluZGluZyIsIlhNTEh0dHBSZXF1ZXN0IiwiWERvbWFpblJlcXVlc3QiLCJXZWJTb2NrZXQiLCJ0byIsImZyb20iLCJPYmplY3QiLCJkZWZpbmVQcm9wZXJ0eSIsImdldCIsImNvbmZpZ3VyYWJsZSIsImVudW1lcmFibGUiLCJpZ25vcmUiLCJyZXQiLCJ1bnNoaWZ0Iiwic2hpZnQiLCJ0cmFjayIsIm1ldGhvZCIsInRvVXBwZXJDYXNlIiwibW9uaXRvclhIUiIsIl90aGlzIiwicmVxIiwiX29wZW4iLCJvcGVuIiwidHlwZSIsInVybCIsImFzeW5jIiwicmVxdWVzdCIsImZsYWdzIiwicHJvdG9jb2xzIiwicGF0dGVybiIsInRlc3QiLCJfYXJnIiwiYWZ0ZXIiLCJydW5uaW5nIiwic3RpbGxBY3RpdmUiLCJfcmVmMyIsInJlYWR5U3RhdGUiLCJyZXN0YXJ0Iiwid2F0Y2giLCJ0cmFja2VyIiwic2l6ZSIsIl9vbnJlYWR5c3RhdGVjaGFuZ2UiLCJQcm9ncmVzc0V2ZW50IiwiYWRkRXZlbnRMaXN0ZW5lciIsImV2dCIsImxlbmd0aENvbXB1dGFibGUiLCJsb2FkZWQiLCJ0b3RhbCIsIm9ucmVhZHlzdGF0ZWNoYW5nZSIsInNlbGVjdG9yIiwiY2hlY2siLCJzdGF0ZXMiLCJsb2FkaW5nIiwiaW50ZXJhY3RpdmUiLCJjb21wbGV0ZSIsImF2ZyIsImludGVydmFsIiwicG9pbnRzIiwic2FtcGxlcyIsInNldEludGVydmFsIiwiY2xlYXJJbnRlcnZhbCIsInNpbmNlTGFzdFVwZGF0ZSIsInJhdGUiLCJjYXRjaHVwIiwibGFzdFByb2dyZXNzIiwiZnJhbWVUaW1lIiwic2NhbGluZyIsInBvdyIsIm1pbiIsIm1heCIsImhpc3RvcnkiLCJwdXNoU3RhdGUiLCJyZXBsYWNlU3RhdGUiLCJfayIsIl9sZW4yIiwiX3JlZjQiLCJleHRyYVNvdXJjZXMiLCJzdG9wIiwic3RhcnQiLCJnbyIsImVucXVldWVOZXh0RnJhbWUiLCJlbGVtZW50IiwiaiIsInJlbWFpbmluZyIsInNjYWxlciIsInNjYWxlckxpc3QiLCJfb3B0aW9ucyIsImRlZmluZSIsImFtZCIsImV4cG9ydHMiLCJtb2R1bGUiLCJqUXVlcnkiLCIkIiwidmVyc2lvbiIsImpxdWVyeSIsInNwbGl0IiwidHJhbnNpdGlvbkVuZCIsInRyYW5zRW5kRXZlbnROYW1lcyIsIldlYmtpdFRyYW5zaXRpb24iLCJNb3pUcmFuc2l0aW9uIiwiT1RyYW5zaXRpb24iLCJ0cmFuc2l0aW9uIiwidW5kZWZpbmVkIiwiZW5kIiwiZW11bGF0ZVRyYW5zaXRpb25FbmQiLCJkdXJhdGlvbiIsImNhbGxlZCIsIiRlbCIsIm9uZSIsImNhbGxiYWNrIiwic3VwcG9ydCIsInNwZWNpYWwiLCJic1RyYW5zaXRpb25FbmQiLCJiaW5kVHlwZSIsImRlbGVnYXRlVHlwZSIsImhhbmRsZSIsImlzIiwiaGFuZGxlT2JqIiwiZGlzbWlzcyIsIkFsZXJ0IiwiY2xvc2UiLCJWRVJTSU9OIiwiVFJBTlNJVElPTl9EVVJBVElPTiIsIiR0aGlzIiwiYXR0ciIsIiRwYXJlbnQiLCJmaW5kIiwicHJldmVudERlZmF1bHQiLCJjbG9zZXN0IiwiRXZlbnQiLCJpc0RlZmF1bHRQcmV2ZW50ZWQiLCJyZW1vdmVDbGFzcyIsInJlbW92ZUVsZW1lbnQiLCJkZXRhY2giLCJyZW1vdmUiLCJoYXNDbGFzcyIsIlBsdWdpbiIsIm9wdGlvbiIsImVhY2giLCJvbGQiLCJhbGVydCIsIkNvbnN0cnVjdG9yIiwibm9Db25mbGljdCIsIkJ1dHRvbiIsIiRlbGVtZW50IiwiREVGQVVMVFMiLCJpc0xvYWRpbmciLCJsb2FkaW5nVGV4dCIsInNldFN0YXRlIiwic3RhdGUiLCJkIiwicmVzZXRUZXh0IiwicHJveHkiLCJhZGRDbGFzcyIsInByb3AiLCJyZW1vdmVBdHRyIiwidG9nZ2xlIiwiY2hhbmdlZCIsIiRpbnB1dCIsInRvZ2dsZUNsYXNzIiwiYnV0dG9uIiwiJGJ0biIsImZpcnN0IiwiQ2Fyb3VzZWwiLCIkaW5kaWNhdG9ycyIsInBhdXNlZCIsInNsaWRpbmciLCIkYWN0aXZlIiwiJGl0ZW1zIiwia2V5Ym9hcmQiLCJrZXlkb3duIiwicGF1c2UiLCJkb2N1bWVudEVsZW1lbnQiLCJjeWNsZSIsIndyYXAiLCJ0YWdOYW1lIiwid2hpY2giLCJwcmV2IiwibmV4dCIsImdldEl0ZW1JbmRleCIsImluZGV4IiwiZ2V0SXRlbUZvckRpcmVjdGlvbiIsImRpcmVjdGlvbiIsImFjdGl2ZSIsImFjdGl2ZUluZGV4Iiwid2lsbFdyYXAiLCJkZWx0YSIsIml0ZW1JbmRleCIsImVxIiwicG9zIiwidGhhdCIsInNsaWRlIiwiJG5leHQiLCJpc0N5Y2xpbmciLCJyZWxhdGVkVGFyZ2V0Iiwic2xpZGVFdmVudCIsIiRuZXh0SW5kaWNhdG9yIiwic2xpZEV2ZW50Iiwib2Zmc2V0V2lkdGgiLCJqb2luIiwiYWN0aW9uIiwiY2Fyb3VzZWwiLCJjbGlja0hhbmRsZXIiLCJocmVmIiwiJHRhcmdldCIsInNsaWRlSW5kZXgiLCIkY2Fyb3VzZWwiLCJDb2xsYXBzZSIsIiR0cmlnZ2VyIiwidHJhbnNpdGlvbmluZyIsImdldFBhcmVudCIsImFkZEFyaWFBbmRDb2xsYXBzZWRDbGFzcyIsImRpbWVuc2lvbiIsImhhc1dpZHRoIiwic2hvdyIsImFjdGl2ZXNEYXRhIiwiYWN0aXZlcyIsInN0YXJ0RXZlbnQiLCJzY3JvbGxTaXplIiwiY2FtZWxDYXNlIiwiaGlkZSIsIm9mZnNldEhlaWdodCIsImdldFRhcmdldEZyb21UcmlnZ2VyIiwiaXNPcGVuIiwiY29sbGFwc2UiLCJiYWNrZHJvcCIsIkRyb3Bkb3duIiwiY2xlYXJNZW51cyIsImNvbnRhaW5zIiwiaXNBY3RpdmUiLCJpbnNlcnRBZnRlciIsInN0b3BQcm9wYWdhdGlvbiIsImRlc2MiLCJkcm9wZG93biIsIk1vZGFsIiwiJGJvZHkiLCIkZGlhbG9nIiwiJGJhY2tkcm9wIiwiaXNTaG93biIsIm9yaWdpbmFsQm9keVBhZCIsInNjcm9sbGJhcldpZHRoIiwiaWdub3JlQmFja2Ryb3BDbGljayIsImZpeGVkQ29udGVudCIsInJlbW90ZSIsImxvYWQiLCJCQUNLRFJPUF9UUkFOU0lUSU9OX0RVUkFUSU9OIiwiX3JlbGF0ZWRUYXJnZXQiLCJjaGVja1Njcm9sbGJhciIsInNldFNjcm9sbGJhciIsImVzY2FwZSIsInJlc2l6ZSIsImFwcGVuZFRvIiwic2Nyb2xsVG9wIiwiYWRqdXN0RGlhbG9nIiwiZW5mb3JjZUZvY3VzIiwiaGlkZU1vZGFsIiwiaGFzIiwiaGFuZGxlVXBkYXRlIiwicmVzZXRBZGp1c3RtZW50cyIsInJlc2V0U2Nyb2xsYmFyIiwicmVtb3ZlQmFja2Ryb3AiLCJhbmltYXRlIiwiZG9BbmltYXRlIiwiY3VycmVudFRhcmdldCIsImZvY3VzIiwiY2FsbGJhY2tSZW1vdmUiLCJtb2RhbElzT3ZlcmZsb3dpbmciLCJzY3JvbGxIZWlnaHQiLCJjbGllbnRIZWlnaHQiLCJjc3MiLCJwYWRkaW5nTGVmdCIsImJvZHlJc092ZXJmbG93aW5nIiwicGFkZGluZ1JpZ2h0IiwiZnVsbFdpbmRvd1dpZHRoIiwiaW5uZXJXaWR0aCIsImRvY3VtZW50RWxlbWVudFJlY3QiLCJnZXRCb3VuZGluZ0NsaWVudFJlY3QiLCJyaWdodCIsImxlZnQiLCJjbGllbnRXaWR0aCIsIm1lYXN1cmVTY3JvbGxiYXIiLCJib2R5UGFkIiwicGFyc2VJbnQiLCJhY3R1YWxQYWRkaW5nIiwiY2FsY3VsYXRlZFBhZGRpbmciLCJwYXJzZUZsb2F0IiwicGFkZGluZyIsInJlbW92ZURhdGEiLCJzY3JvbGxEaXYiLCJhcHBlbmQiLCJtb2RhbCIsInNob3dFdmVudCIsIkRJU0FMTE9XRURfQVRUUklCVVRFUyIsInVyaUF0dHJzIiwiQVJJQV9BVFRSSUJVVEVfUEFUVEVSTiIsIkRlZmF1bHRXaGl0ZWxpc3QiLCJhIiwiYXJlYSIsImIiLCJiciIsImNvbCIsImNvZGUiLCJkaXYiLCJlbSIsImhyIiwiaDEiLCJoMiIsImgzIiwiaDQiLCJoNSIsImg2IiwiaW1nIiwibGkiLCJvbCIsInAiLCJwcmUiLCJzIiwic21hbGwiLCJzcGFuIiwic3ViIiwic3VwIiwic3Ryb25nIiwidSIsInVsIiwiU0FGRV9VUkxfUEFUVEVSTiIsIkRBVEFfVVJMX1BBVFRFUk4iLCJhbGxvd2VkQXR0cmlidXRlIiwiYWxsb3dlZEF0dHJpYnV0ZUxpc3QiLCJhdHRyTmFtZSIsIm5vZGVOYW1lIiwidG9Mb3dlckNhc2UiLCJpbkFycmF5IiwiQm9vbGVhbiIsIm5vZGVWYWx1ZSIsIm1hdGNoIiwicmVnRXhwIiwiZmlsdGVyIiwidmFsdWUiLCJSZWdFeHAiLCJzYW5pdGl6ZUh0bWwiLCJ1bnNhZmVIdG1sIiwid2hpdGVMaXN0Iiwic2FuaXRpemVGbiIsImltcGxlbWVudGF0aW9uIiwiY3JlYXRlSFRNTERvY3VtZW50IiwiY3JlYXRlZERvY3VtZW50Iiwid2hpdGVsaXN0S2V5cyIsIm1hcCIsImxlbiIsImVsTmFtZSIsImF0dHJpYnV0ZUxpc3QiLCJhdHRyaWJ1dGVzIiwid2hpdGVsaXN0ZWRBdHRyaWJ1dGVzIiwiY29uY2F0IiwibGVuMiIsInJlbW92ZUF0dHJpYnV0ZSIsIlRvb2x0aXAiLCJlbmFibGVkIiwidGltZW91dCIsImhvdmVyU3RhdGUiLCJpblN0YXRlIiwicGxhY2VtZW50IiwidGVtcGxhdGUiLCJ0aXRsZSIsImRlbGF5IiwiaHRtbCIsImNvbnRhaW5lciIsInZpZXdwb3J0Iiwic2FuaXRpemUiLCJnZXRPcHRpb25zIiwiJHZpZXdwb3J0IiwiaXNGdW5jdGlvbiIsImNsaWNrIiwiaG92ZXIiLCJ0cmlnZ2VycyIsImV2ZW50SW4iLCJldmVudE91dCIsImVudGVyIiwibGVhdmUiLCJmaXhUaXRsZSIsImdldERlZmF1bHRzIiwiZGF0YUF0dHJpYnV0ZXMiLCJkYXRhQXR0ciIsImdldERlbGVnYXRlT3B0aW9ucyIsImRlZmF1bHRzIiwic2VsZiIsInRpcCIsImlzSW5TdGF0ZVRydWUiLCJoYXNDb250ZW50IiwiaW5Eb20iLCJvd25lckRvY3VtZW50IiwiJHRpcCIsInRpcElkIiwiZ2V0VUlEIiwic2V0Q29udGVudCIsImF1dG9Ub2tlbiIsImF1dG9QbGFjZSIsInRvcCIsImRpc3BsYXkiLCJnZXRQb3NpdGlvbiIsImFjdHVhbFdpZHRoIiwiYWN0dWFsSGVpZ2h0Iiwib3JnUGxhY2VtZW50Iiwidmlld3BvcnREaW0iLCJib3R0b20iLCJ3aWR0aCIsImNhbGN1bGF0ZWRPZmZzZXQiLCJnZXRDYWxjdWxhdGVkT2Zmc2V0IiwiYXBwbHlQbGFjZW1lbnQiLCJwcmV2SG92ZXJTdGF0ZSIsIm9mZnNldCIsImhlaWdodCIsIm1hcmdpblRvcCIsIm1hcmdpbkxlZnQiLCJpc05hTiIsInNldE9mZnNldCIsInVzaW5nIiwicHJvcHMiLCJyb3VuZCIsImdldFZpZXdwb3J0QWRqdXN0ZWREZWx0YSIsImlzVmVydGljYWwiLCJhcnJvd0RlbHRhIiwiYXJyb3dPZmZzZXRQb3NpdGlvbiIsInJlcGxhY2VBcnJvdyIsImFycm93IiwiZ2V0VGl0bGUiLCJ0ZXh0IiwiJGUiLCJpc0JvZHkiLCJlbFJlY3QiLCJpc1N2ZyIsIlNWR0VsZW1lbnQiLCJlbE9mZnNldCIsInNjcm9sbCIsIm91dGVyRGltcyIsInZpZXdwb3J0UGFkZGluZyIsInZpZXdwb3J0RGltZW5zaW9ucyIsInRvcEVkZ2VPZmZzZXQiLCJib3R0b21FZGdlT2Zmc2V0IiwibGVmdEVkZ2VPZmZzZXQiLCJyaWdodEVkZ2VPZmZzZXQiLCJvIiwicHJlZml4IiwicmFuZG9tIiwiZ2V0RWxlbWVudEJ5SWQiLCIkYXJyb3ciLCJlbmFibGUiLCJkaXNhYmxlIiwidG9nZ2xlRW5hYmxlZCIsInRvb2x0aXAiLCJQb3BvdmVyIiwiY29udGVudCIsImdldENvbnRlbnQiLCJ0eXBlQ29udGVudCIsInBvcG92ZXIiLCJTY3JvbGxTcHkiLCIkc2Nyb2xsRWxlbWVudCIsIm9mZnNldHMiLCJ0YXJnZXRzIiwiYWN0aXZlVGFyZ2V0IiwicHJvY2VzcyIsInJlZnJlc2giLCJnZXRTY3JvbGxIZWlnaHQiLCJvZmZzZXRNZXRob2QiLCJvZmZzZXRCYXNlIiwiaXNXaW5kb3ciLCIkaHJlZiIsInNvcnQiLCJtYXhTY3JvbGwiLCJhY3RpdmF0ZSIsImNsZWFyIiwicGFyZW50cyIsInBhcmVudHNVbnRpbCIsInNjcm9sbHNweSIsIiRzcHkiLCJUYWIiLCIkdWwiLCIkcHJldmlvdXMiLCJoaWRlRXZlbnQiLCJ0YWIiLCJBZmZpeCIsImNoZWNrUG9zaXRpb24iLCJjaGVja1Bvc2l0aW9uV2l0aEV2ZW50TG9vcCIsImFmZml4ZWQiLCJ1bnBpbiIsInBpbm5lZE9mZnNldCIsIlJFU0VUIiwiZ2V0U3RhdGUiLCJvZmZzZXRUb3AiLCJvZmZzZXRCb3R0b20iLCJwb3NpdGlvbiIsInRhcmdldEhlaWdodCIsImluaXRpYWxpemluZyIsImNvbGxpZGVyVG9wIiwiY29sbGlkZXJIZWlnaHQiLCJnZXRQaW5uZWRPZmZzZXQiLCJhZmZpeCIsImFmZml4VHlwZSIsImZsZXh5X2hlYWRlciIsInB1YiIsIiRoZWFkZXJfc3RhdGljIiwiJGhlYWRlcl9zdGlja3kiLCJ1cGRhdGVfaW50ZXJ2YWwiLCJ0b2xlcmFuY2UiLCJ1cHdhcmQiLCJkb3dud2FyZCIsIl9nZXRfb2Zmc2V0X2Zyb21fZWxlbWVudHNfYm90dG9tIiwiY2xhc3NlcyIsInBpbm5lZCIsInVucGlubmVkIiwid2FzX3Njcm9sbGVkIiwibGFzdF9kaXN0YW5jZV9mcm9tX3RvcCIsInJlZ2lzdGVyRXZlbnRIYW5kbGVycyIsInJlZ2lzdGVyQm9vdEV2ZW50SGFuZGxlcnMiLCJkb2N1bWVudF93YXNfc2Nyb2xsZWQiLCJlbGVtZW50X2hlaWdodCIsIm91dGVySGVpZ2h0IiwiZWxlbWVudF9vZmZzZXQiLCJjdXJyZW50X2Rpc3RhbmNlX2Zyb21fdG9wIiwiZmxleHlfbmF2aWdhdGlvbiIsImxheW91dF9jbGFzc2VzIiwidXBncmFkZSIsIiRuYXZpZ2F0aW9ucyIsIm5hdmlnYXRpb24iLCIkbmF2aWdhdGlvbiIsIiRtZWdhbWVudXMiLCJkcm9wZG93bl9tZWdhbWVudSIsIiRkcm9wZG93bl9tZWdhbWVudSIsImRyb3Bkb3duX2hhc19tZWdhbWVudSIsImlzX3VwZ3JhZGVkIiwibmF2aWdhdGlvbl9oYXNfbWVnYW1lbnUiLCIkbWVnYW1lbnUiLCJoYXNfb2JmdXNjYXRvciIsIm9iZnVzY2F0b3IiLCJiYWJlbEhlbHBlcnMiLCJjbGFzc0NhbGxDaGVjayIsImluc3RhbmNlIiwiVHlwZUVycm9yIiwiY3JlYXRlQ2xhc3MiLCJkZWZpbmVQcm9wZXJ0aWVzIiwiZGVzY3JpcHRvciIsIndyaXRhYmxlIiwicHJvdG9Qcm9wcyIsInN0YXRpY1Byb3BzIiwic2lkclN0YXR1cyIsIm1vdmluZyIsIm9wZW5lZCIsImhlbHBlciIsImlzVXJsIiwic3RyIiwiYWRkUHJlZml4ZXMiLCJhZGRQcmVmaXgiLCJhdHRyaWJ1dGUiLCJ0b1JlcGxhY2UiLCJ0cmFuc2l0aW9ucyIsInN1cHBvcnRlZCIsInByb3BlcnR5IiwicHJlZml4ZXMiLCJjaGFyQXQiLCJzdWJzdHIiLCIkJDIiLCJib2R5QW5pbWF0aW9uQ2xhc3MiLCJvcGVuQWN0aW9uIiwiY2xvc2VBY3Rpb24iLCJ0cmFuc2l0aW9uRW5kRXZlbnQiLCJNZW51Iiwib3BlbkNsYXNzIiwibWVudVdpZHRoIiwib3V0ZXJXaWR0aCIsInNwZWVkIiwic2lkZSIsImRpc3BsYWNlIiwidGltaW5nIiwib25PcGVuQ2FsbGJhY2siLCJvbkNsb3NlQ2FsbGJhY2siLCJvbk9wZW5FbmRDYWxsYmFjayIsIm9uQ2xvc2VFbmRDYWxsYmFjayIsImdldEFuaW1hdGlvbiIsInByZXBhcmVCb2R5IiwiJGh0bWwiLCJvcGVuQm9keSIsImJvZHlBbmltYXRpb24iLCJxdWV1ZSIsIm9uQ2xvc2VCb2R5IiwicmVzZXRTdHlsZXMiLCJ1bmJpbmQiLCJjbG9zZUJvZHkiLCJtb3ZlQm9keSIsIm9uT3Blbk1lbnUiLCJvcGVuTWVudSIsIl90aGlzMiIsIiRpdGVtIiwibWVudUFuaW1hdGlvbiIsIm9uQ2xvc2VNZW51IiwiY2xvc2VNZW51IiwiX3RoaXMzIiwibW92ZU1lbnUiLCJtb3ZlIiwiX3RoaXM0IiwiYWxyZWFkeU9wZW5lZE1lbnUiLCIkJDEiLCJleGVjdXRlIiwic2lkciIsInB1YmxpY01ldGhvZHMiLCJtZXRob2ROYW1lIiwibWV0aG9kcyIsImdldE1ldGhvZCIsIkFycmF5IiwiJCQzIiwiZmlsbENvbnRlbnQiLCIkc2lkZU1lbnUiLCJzZXR0aW5ncyIsIm5ld0NvbnRlbnQiLCJodG1sQ29udGVudCIsInJlbmFtaW5nIiwiJGh0bWxDb250ZW50IiwiZm5TaWRyIiwiYmluZCIsIm9uT3BlbiIsIm9uQ2xvc2UiLCJvbk9wZW5FbmQiLCJvbkNsb3NlRW5kIiwiZmxhZyIsInRvZ2dsZUFsbEJ1dHRvbnMiLCJxdWVyeVNlbGVjdG9yQWxsIiwidG9nZ2xlQnVsbGV0cG9pbnRCdXR0b25zIiwidG9nZ2xlQXR0YWNobWVudHNCdXR0b25zIiwidG9nZ2xlQWxsQnV0dG9uIiwiaGFuZGxlVG9nZ2xlQWxsIiwiYnVsbGV0cG9pbnRzIiwiZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSIsImN1cnJlbnRTdGF0ZSIsImRhdGFzZXQiLCJidWxsZXRwb2ludCIsImNsYXNzTGlzdCIsImFkZCIsInRvZ2dsZUF0dGFjaG1lbnRCdXR0b24iLCJoYW5kbGVUb2dnbGVBdHRhY2htZW50cyIsImF0dGFjaG1lbnRzIiwiYXR0YWNobWVudCIsInRvZ2dsZUJ1bGxldHBvaW50QnV0dG9uIiwiaGFuZGxlVG9nZ2xlQnVsbGV0cG9pbnQiLCJzaWRlYmFyIiwidG9nZ2xlcyIsInRvZ2dsZVN0YXRlIiwibG9jYWxTdG9yYWdlIiwiZ2V0SXRlbSIsInNldEl0ZW0iLCJub3Qi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RDs7QUFFRHRNLFVBQU0wSyxjQUFOO0FBQ0QsR0FqQkQ7QUFrQkQsQ0F0RUQiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCkge1xuICB2YXIgQWpheE1vbml0b3IsIEJhciwgRG9jdW1lbnRNb25pdG9yLCBFbGVtZW50TW9uaXRvciwgRWxlbWVudFRyYWNrZXIsIEV2ZW50TGFnTW9uaXRvciwgRXZlbnRlZCwgRXZlbnRzLCBOb1RhcmdldEVycm9yLCBQYWNlLCBSZXF1ZXN0SW50ZXJjZXB0LCBTT1VSQ0VfS0VZUywgU2NhbGVyLCBTb2NrZXRSZXF1ZXN0VHJhY2tlciwgWEhSUmVxdWVzdFRyYWNrZXIsIGFuaW1hdGlvbiwgYXZnQW1wbGl0dWRlLCBiYXIsIGNhbmNlbEFuaW1hdGlvbiwgY2FuY2VsQW5pbWF0aW9uRnJhbWUsIGRlZmF1bHRPcHRpb25zLCBleHRlbmQsIGV4dGVuZE5hdGl2ZSwgZ2V0RnJvbURPTSwgZ2V0SW50ZXJjZXB0LCBoYW5kbGVQdXNoU3RhdGUsIGlnbm9yZVN0YWNrLCBpbml0LCBub3csIG9wdGlvbnMsIHJlcXVlc3RBbmltYXRpb25GcmFtZSwgcmVzdWx0LCBydW5BbmltYXRpb24sIHNjYWxlcnMsIHNob3VsZElnbm9yZVVSTCwgc2hvdWxkVHJhY2ssIHNvdXJjZSwgc291cmNlcywgdW5pU2NhbGVyLCBfV2ViU29ja2V0LCBfWERvbWFpblJlcXVlc3QsIF9YTUxIdHRwUmVxdWVzdCwgX2ksIF9pbnRlcmNlcHQsIF9sZW4sIF9wdXNoU3RhdGUsIF9yZWYsIF9yZWYxLCBfcmVwbGFjZVN0YXRlLFxuICAgIF9fc2xpY2UgPSBbXS5zbGljZSxcbiAgICBfX2hhc1Byb3AgPSB7fS5oYXNPd25Qcm9wZXJ0eSxcbiAgICBfX2V4dGVuZHMgPSBmdW5jdGlvbihjaGlsZCwgcGFyZW50KSB7IGZvciAodmFyIGtleSBpbiBwYXJlbnQpIHsgaWYgKF9faGFzUHJvcC5jYWxsKHBhcmVudCwga2V5KSkgY2hpbGRba2V5XSA9IHBhcmVudFtrZXldOyB9IGZ1bmN0aW9uIGN0b3IoKSB7IHRoaXMuY29uc3RydWN0b3IgPSBjaGlsZDsgfSBjdG9yLnByb3RvdHlwZSA9IHBhcmVudC5wcm90b3R5cGU7IGNoaWxkLnByb3RvdHlwZSA9IG5ldyBjdG9yKCk7IGNoaWxkLl9fc3VwZXJfXyA9IHBhcmVudC5wcm90b3R5cGU7IHJldHVybiBjaGlsZDsgfSxcbiAgICBfX2luZGV4T2YgPSBbXS5pbmRleE9mIHx8IGZ1bmN0aW9uKGl0ZW0pIHsgZm9yICh2YXIgaSA9IDAsIGwgPSB0aGlzLmxlbmd0aDsgaSA8IGw7IGkrKykgeyBpZiAoaSBpbiB0aGlzICYmIHRoaXNbaV0gPT09IGl0ZW0pIHJldHVybiBpOyB9IHJldHVybiAtMTsgfTtcblxuICBkZWZhdWx0T3B0aW9ucyA9IHtcbiAgICBjYXRjaHVwVGltZTogMTAwLFxuICAgIGluaXRpYWxSYXRlOiAuMDMsXG4gICAgbWluVGltZTogMjUwLFxuICAgIGdob3N0VGltZTogMTAwLFxuICAgIG1heFByb2dyZXNzUGVyRnJhbWU6IDIwLFxuICAgIGVhc2VGYWN0b3I6IDEuMjUsXG4gICAgc3RhcnRPblBhZ2VMb2FkOiB0cnVlLFxuICAgIHJlc3RhcnRPblB1c2hTdGF0ZTogdHJ1ZSxcbiAgICByZXN0YXJ0T25SZXF1ZXN0QWZ0ZXI6IDUwMCxcbiAgICB0YXJnZXQ6ICdib2R5JyxcbiAgICBlbGVtZW50czoge1xuICAgICAgY2hlY2tJbnRlcnZhbDogMTAwLFxuICAgICAgc2VsZWN0b3JzOiBbJ2JvZHknXVxuICAgIH0sXG4gICAgZXZlbnRMYWc6IHtcbiAgICAgIG1pblNhbXBsZXM6IDEwLFxuICAgICAgc2FtcGxlQ291bnQ6IDMsXG4gICAgICBsYWdUaHJlc2hvbGQ6IDNcbiAgICB9LFxuICAgIGFqYXg6IHtcbiAgICAgIHRyYWNrTWV0aG9kczogWydHRVQnXSxcbiAgICAgIHRyYWNrV2ViU29ja2V0czogdHJ1ZSxcbiAgICAgIGlnbm9yZVVSTHM6IFtdXG4gICAgfVxuICB9O1xuXG4gIG5vdyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBfcmVmO1xuICAgIHJldHVybiAoX3JlZiA9IHR5cGVvZiBwZXJmb3JtYW5jZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBwZXJmb3JtYW5jZSAhPT0gbnVsbCA/IHR5cGVvZiBwZXJmb3JtYW5jZS5ub3cgPT09IFwiZnVuY3Rpb25cIiA/IHBlcmZvcm1hbmNlLm5vdygpIDogdm9pZCAwIDogdm9pZCAwKSAhPSBudWxsID8gX3JlZiA6ICsobmV3IERhdGUpO1xuICB9O1xuXG4gIHJlcXVlc3RBbmltYXRpb25GcmFtZSA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgd2luZG93Lm1velJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cud2Via2l0UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8IHdpbmRvdy5tc1JlcXVlc3RBbmltYXRpb25GcmFtZTtcblxuICBjYW5jZWxBbmltYXRpb25GcmFtZSA9IHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cubW96Q2FuY2VsQW5pbWF0aW9uRnJhbWU7XG5cbiAgaWYgKHJlcXVlc3RBbmltYXRpb25GcmFtZSA9PSBudWxsKSB7XG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gZnVuY3Rpb24oZm4pIHtcbiAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZuLCA1MCk7XG4gICAgfTtcbiAgICBjYW5jZWxBbmltYXRpb25GcmFtZSA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KGlkKTtcbiAgICB9O1xuICB9XG5cbiAgcnVuQW5pbWF0aW9uID0gZnVuY3Rpb24oZm4pIHtcbiAgICB2YXIgbGFzdCwgdGljaztcbiAgICBsYXN0ID0gbm93KCk7XG4gICAgdGljayA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGRpZmY7XG4gICAgICBkaWZmID0gbm93KCkgLSBsYXN0O1xuICAgICAgaWYgKGRpZmYgPj0gMzMpIHtcbiAgICAgICAgbGFzdCA9IG5vdygpO1xuICAgICAgICByZXR1cm4gZm4oZGlmZiwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIHJlcXVlc3RBbmltYXRpb25GcmFtZSh0aWNrKTtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dCh0aWNrLCAzMyAtIGRpZmYpO1xuICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIHRpY2soKTtcbiAgfTtcblxuICByZXN1bHQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgYXJncywga2V5LCBvYmo7XG4gICAgb2JqID0gYXJndW1lbnRzWzBdLCBrZXkgPSBhcmd1bWVudHNbMV0sIGFyZ3MgPSAzIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBfX3NsaWNlLmNhbGwoYXJndW1lbnRzLCAyKSA6IFtdO1xuICAgIGlmICh0eXBlb2Ygb2JqW2tleV0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiBvYmpba2V5XS5hcHBseShvYmosIGFyZ3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gb2JqW2tleV07XG4gICAgfVxuICB9O1xuXG4gIGV4dGVuZCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBrZXksIG91dCwgc291cmNlLCBzb3VyY2VzLCB2YWwsIF9pLCBfbGVuO1xuICAgIG91dCA9IGFyZ3VtZW50c1swXSwgc291cmNlcyA9IDIgPD0gYXJndW1lbnRzLmxlbmd0aCA/IF9fc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpIDogW107XG4gICAgZm9yIChfaSA9IDAsIF9sZW4gPSBzb3VyY2VzLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICBzb3VyY2UgPSBzb3VyY2VzW19pXTtcbiAgICAgIGlmIChzb3VyY2UpIHtcbiAgICAgICAgZm9yIChrZXkgaW4gc291cmNlKSB7XG4gICAgICAgICAgaWYgKCFfX2hhc1Byb3AuY2FsbChzb3VyY2UsIGtleSkpIGNvbnRpbnVlO1xuICAgICAgICAgIHZhbCA9IHNvdXJjZVtrZXldO1xuICAgICAgICAgIGlmICgob3V0W2tleV0gIT0gbnVsbCkgJiYgdHlwZW9mIG91dFtrZXldID09PSAnb2JqZWN0JyAmJiAodmFsICE9IG51bGwpICYmIHR5cGVvZiB2YWwgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBleHRlbmQob3V0W2tleV0sIHZhbCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG91dFtrZXldID0gdmFsO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb3V0O1xuICB9O1xuXG4gIGF2Z0FtcGxpdHVkZSA9IGZ1bmN0aW9uKGFycikge1xuICAgIHZhciBjb3VudCwgc3VtLCB2LCBfaSwgX2xlbjtcbiAgICBzdW0gPSBjb3VudCA9IDA7XG4gICAgZm9yIChfaSA9IDAsIF9sZW4gPSBhcnIubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgIHYgPSBhcnJbX2ldO1xuICAgICAgc3VtICs9IE1hdGguYWJzKHYpO1xuICAgICAgY291bnQrKztcbiAgICB9XG4gICAgcmV0dXJuIHN1bSAvIGNvdW50O1xuICB9O1xuXG4gIGdldEZyb21ET00gPSBmdW5jdGlvbihrZXksIGpzb24pIHtcbiAgICB2YXIgZGF0YSwgZSwgZWw7XG4gICAgaWYgKGtleSA9PSBudWxsKSB7XG4gICAgICBrZXkgPSAnb3B0aW9ucyc7XG4gICAgfVxuICAgIGlmIChqc29uID09IG51bGwpIHtcbiAgICAgIGpzb24gPSB0cnVlO1xuICAgIH1cbiAgICBlbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCJbZGF0YS1wYWNlLVwiICsga2V5ICsgXCJdXCIpO1xuICAgIGlmICghZWwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZGF0YSA9IGVsLmdldEF0dHJpYnV0ZShcImRhdGEtcGFjZS1cIiArIGtleSk7XG4gICAgaWYgKCFqc29uKSB7XG4gICAgICByZXR1cm4gZGF0YTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBKU09OLnBhcnNlKGRhdGEpO1xuICAgIH0gY2F0Y2ggKF9lcnJvcikge1xuICAgICAgZSA9IF9lcnJvcjtcbiAgICAgIHJldHVybiB0eXBlb2YgY29uc29sZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBjb25zb2xlICE9PSBudWxsID8gY29uc29sZS5lcnJvcihcIkVycm9yIHBhcnNpbmcgaW5saW5lIHBhY2Ugb3B0aW9uc1wiLCBlKSA6IHZvaWQgMDtcbiAgICB9XG4gIH07XG5cbiAgRXZlbnRlZCA9IChmdW5jdGlvbigpIHtcbiAgICBmdW5jdGlvbiBFdmVudGVkKCkge31cblxuICAgIEV2ZW50ZWQucHJvdG90eXBlLm9uID0gZnVuY3Rpb24oZXZlbnQsIGhhbmRsZXIsIGN0eCwgb25jZSkge1xuICAgICAgdmFyIF9iYXNlO1xuICAgICAgaWYgKG9uY2UgPT0gbnVsbCkge1xuICAgICAgICBvbmNlID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5iaW5kaW5ncyA9PSBudWxsKSB7XG4gICAgICAgIHRoaXMuYmluZGluZ3MgPSB7fTtcbiAgICAgIH1cbiAgICAgIGlmICgoX2Jhc2UgPSB0aGlzLmJpbmRpbmdzKVtldmVudF0gPT0gbnVsbCkge1xuICAgICAgICBfYmFzZVtldmVudF0gPSBbXTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLmJpbmRpbmdzW2V2ZW50XS5wdXNoKHtcbiAgICAgICAgaGFuZGxlcjogaGFuZGxlcixcbiAgICAgICAgY3R4OiBjdHgsXG4gICAgICAgIG9uY2U6IG9uY2VcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBFdmVudGVkLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24oZXZlbnQsIGhhbmRsZXIsIGN0eCkge1xuICAgICAgcmV0dXJuIHRoaXMub24oZXZlbnQsIGhhbmRsZXIsIGN0eCwgdHJ1ZSk7XG4gICAgfTtcblxuICAgIEV2ZW50ZWQucHJvdG90eXBlLm9mZiA9IGZ1bmN0aW9uKGV2ZW50LCBoYW5kbGVyKSB7XG4gICAgICB2YXIgaSwgX3JlZiwgX3Jlc3VsdHM7XG4gICAgICBpZiAoKChfcmVmID0gdGhpcy5iaW5kaW5ncykgIT0gbnVsbCA/IF9yZWZbZXZlbnRdIDogdm9pZCAwKSA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmIChoYW5kbGVyID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIGRlbGV0ZSB0aGlzLmJpbmRpbmdzW2V2ZW50XTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGkgPSAwO1xuICAgICAgICBfcmVzdWx0cyA9IFtdO1xuICAgICAgICB3aGlsZSAoaSA8IHRoaXMuYmluZGluZ3NbZXZlbnRdLmxlbmd0aCkge1xuICAgICAgICAgIGlmICh0aGlzLmJpbmRpbmdzW2V2ZW50XVtpXS5oYW5kbGVyID09PSBoYW5kbGVyKSB7XG4gICAgICAgICAgICBfcmVzdWx0cy5wdXNoKHRoaXMuYmluZGluZ3NbZXZlbnRdLnNwbGljZShpLCAxKSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIF9yZXN1bHRzLnB1c2goaSsrKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIF9yZXN1bHRzO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBFdmVudGVkLnByb3RvdHlwZS50cmlnZ2VyID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgYXJncywgY3R4LCBldmVudCwgaGFuZGxlciwgaSwgb25jZSwgX3JlZiwgX3JlZjEsIF9yZXN1bHRzO1xuICAgICAgZXZlbnQgPSBhcmd1bWVudHNbMF0sIGFyZ3MgPSAyIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBfX3NsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSA6IFtdO1xuICAgICAgaWYgKChfcmVmID0gdGhpcy5iaW5kaW5ncykgIT0gbnVsbCA/IF9yZWZbZXZlbnRdIDogdm9pZCAwKSB7XG4gICAgICAgIGkgPSAwO1xuICAgICAgICBfcmVzdWx0cyA9IFtdO1xuICAgICAgICB3aGlsZSAoaSA8IHRoaXMuYmluZGluZ3NbZXZlbnRdLmxlbmd0aCkge1xuICAgICAgICAgIF9yZWYxID0gdGhpcy5iaW5kaW5nc1tldmVudF1baV0sIGhhbmRsZXIgPSBfcmVmMS5oYW5kbGVyLCBjdHggPSBfcmVmMS5jdHgsIG9uY2UgPSBfcmVmMS5vbmNlO1xuICAgICAgICAgIGhhbmRsZXIuYXBwbHkoY3R4ICE9IG51bGwgPyBjdHggOiB0aGlzLCBhcmdzKTtcbiAgICAgICAgICBpZiAob25jZSkge1xuICAgICAgICAgICAgX3Jlc3VsdHMucHVzaCh0aGlzLmJpbmRpbmdzW2V2ZW50XS5zcGxpY2UoaSwgMSkpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBfcmVzdWx0cy5wdXNoKGkrKyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBfcmVzdWx0cztcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgcmV0dXJuIEV2ZW50ZWQ7XG5cbiAgfSkoKTtcblxuICBQYWNlID0gd2luZG93LlBhY2UgfHwge307XG5cbiAgd2luZG93LlBhY2UgPSBQYWNlO1xuXG4gIGV4dGVuZChQYWNlLCBFdmVudGVkLnByb3RvdHlwZSk7XG5cbiAgb3B0aW9ucyA9IFBhY2Uub3B0aW9ucyA9IGV4dGVuZCh7fSwgZGVmYXVsdE9wdGlvbnMsIHdpbmRvdy5wYWNlT3B0aW9ucywgZ2V0RnJvbURPTSgpKTtcblxuICBfcmVmID0gWydhamF4JywgJ2RvY3VtZW50JywgJ2V2ZW50TGFnJywgJ2VsZW1lbnRzJ107XG4gIGZvciAoX2kgPSAwLCBfbGVuID0gX3JlZi5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgIHNvdXJjZSA9IF9yZWZbX2ldO1xuICAgIGlmIChvcHRpb25zW3NvdXJjZV0gPT09IHRydWUpIHtcbiAgICAgIG9wdGlvbnNbc291cmNlXSA9IGRlZmF1bHRPcHRpb25zW3NvdXJjZV07XG4gICAgfVxuICB9XG5cbiAgTm9UYXJnZXRFcnJvciA9IChmdW5jdGlvbihfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoTm9UYXJnZXRFcnJvciwgX3N1cGVyKTtcblxuICAgIGZ1bmN0aW9uIE5vVGFyZ2V0RXJyb3IoKSB7XG4gICAgICBfcmVmMSA9IE5vVGFyZ2V0RXJyb3IuX19zdXBlcl9fLmNvbnN0cnVjdG9yLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICByZXR1cm4gX3JlZjE7XG4gICAgfVxuXG4gICAgcmV0dXJuIE5vVGFyZ2V0RXJyb3I7XG5cbiAgfSkoRXJyb3IpO1xuXG4gIEJhciA9IChmdW5jdGlvbigpIHtcbiAgICBmdW5jdGlvbiBCYXIoKSB7XG4gICAgICB0aGlzLnByb2dyZXNzID0gMDtcbiAgICB9XG5cbiAgICBCYXIucHJvdG90eXBlLmdldEVsZW1lbnQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciB0YXJnZXRFbGVtZW50O1xuICAgICAgaWYgKHRoaXMuZWwgPT0gbnVsbCkge1xuICAgICAgICB0YXJnZXRFbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihvcHRpb25zLnRhcmdldCk7XG4gICAgICAgIGlmICghdGFyZ2V0RWxlbWVudCkge1xuICAgICAgICAgIHRocm93IG5ldyBOb1RhcmdldEVycm9yO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgdGhpcy5lbC5jbGFzc05hbWUgPSBcInBhY2UgcGFjZS1hY3RpdmVcIjtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5jbGFzc05hbWUgPSBkb2N1bWVudC5ib2R5LmNsYXNzTmFtZS5yZXBsYWNlKC9wYWNlLWRvbmUvZywgJycpO1xuICAgICAgICBkb2N1bWVudC5ib2R5LmNsYXNzTmFtZSArPSAnIHBhY2UtcnVubmluZyc7XG4gICAgICAgIHRoaXMuZWwuaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9XCJwYWNlLXByb2dyZXNzXCI+XFxuICA8ZGl2IGNsYXNzPVwicGFjZS1wcm9ncmVzcy1pbm5lclwiPjwvZGl2PlxcbjwvZGl2PlxcbjxkaXYgY2xhc3M9XCJwYWNlLWFjdGl2aXR5XCI+PC9kaXY+JztcbiAgICAgICAgaWYgKHRhcmdldEVsZW1lbnQuZmlyc3RDaGlsZCAhPSBudWxsKSB7XG4gICAgICAgICAgdGFyZ2V0RWxlbWVudC5pbnNlcnRCZWZvcmUodGhpcy5lbCwgdGFyZ2V0RWxlbWVudC5maXJzdENoaWxkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0YXJnZXRFbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuZWwpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5lbDtcbiAgICB9O1xuXG4gICAgQmFyLnByb3RvdHlwZS5maW5pc2ggPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBlbDtcbiAgICAgIGVsID0gdGhpcy5nZXRFbGVtZW50KCk7XG4gICAgICBlbC5jbGFzc05hbWUgPSBlbC5jbGFzc05hbWUucmVwbGFjZSgncGFjZS1hY3RpdmUnLCAnJyk7XG4gICAgICBlbC5jbGFzc05hbWUgKz0gJyBwYWNlLWluYWN0aXZlJztcbiAgICAgIGRvY3VtZW50LmJvZHkuY2xhc3NOYW1lID0gZG9jdW1lbnQuYm9keS5jbGFzc05hbWUucmVwbGFjZSgncGFjZS1ydW5uaW5nJywgJycpO1xuICAgICAgcmV0dXJuIGRvY3VtZW50LmJvZHkuY2xhc3NOYW1lICs9ICcgcGFjZS1kb25lJztcbiAgICB9O1xuXG4gICAgQmFyLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbihwcm9nKSB7XG4gICAgICB0aGlzLnByb2dyZXNzID0gcHJvZztcbiAgICAgIHJldHVybiB0aGlzLnJlbmRlcigpO1xuICAgIH07XG5cbiAgICBCYXIucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbigpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHRoaXMuZ2V0RWxlbWVudCgpLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy5nZXRFbGVtZW50KCkpO1xuICAgICAgfSBjYXRjaCAoX2Vycm9yKSB7XG4gICAgICAgIE5vVGFyZ2V0RXJyb3IgPSBfZXJyb3I7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5lbCA9IHZvaWQgMDtcbiAgICB9O1xuXG4gICAgQmFyLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBlbCwga2V5LCBwcm9ncmVzc1N0ciwgdHJhbnNmb3JtLCBfaiwgX2xlbjEsIF9yZWYyO1xuICAgICAgaWYgKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Iob3B0aW9ucy50YXJnZXQpID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgZWwgPSB0aGlzLmdldEVsZW1lbnQoKTtcbiAgICAgIHRyYW5zZm9ybSA9IFwidHJhbnNsYXRlM2QoXCIgKyB0aGlzLnByb2dyZXNzICsgXCIlLCAwLCAwKVwiO1xuICAgICAgX3JlZjIgPSBbJ3dlYmtpdFRyYW5zZm9ybScsICdtc1RyYW5zZm9ybScsICd0cmFuc2Zvcm0nXTtcbiAgICAgIGZvciAoX2ogPSAwLCBfbGVuMSA9IF9yZWYyLmxlbmd0aDsgX2ogPCBfbGVuMTsgX2orKykge1xuICAgICAgICBrZXkgPSBfcmVmMltfal07XG4gICAgICAgIGVsLmNoaWxkcmVuWzBdLnN0eWxlW2tleV0gPSB0cmFuc2Zvcm07XG4gICAgICB9XG4gICAgICBpZiAoIXRoaXMubGFzdFJlbmRlcmVkUHJvZ3Jlc3MgfHwgdGhpcy5sYXN0UmVuZGVyZWRQcm9ncmVzcyB8IDAgIT09IHRoaXMucHJvZ3Jlc3MgfCAwKSB7XG4gICAgICAgIGVsLmNoaWxkcmVuWzBdLnNldEF0dHJpYnV0ZSgnZGF0YS1wcm9ncmVzcy10ZXh0JywgXCJcIiArICh0aGlzLnByb2dyZXNzIHwgMCkgKyBcIiVcIik7XG4gICAgICAgIGlmICh0aGlzLnByb2dyZXNzID49IDEwMCkge1xuICAgICAgICAgIHByb2dyZXNzU3RyID0gJzk5JztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwcm9ncmVzc1N0ciA9IHRoaXMucHJvZ3Jlc3MgPCAxMCA/IFwiMFwiIDogXCJcIjtcbiAgICAgICAgICBwcm9ncmVzc1N0ciArPSB0aGlzLnByb2dyZXNzIHwgMDtcbiAgICAgICAgfVxuICAgICAgICBlbC5jaGlsZHJlblswXS5zZXRBdHRyaWJ1dGUoJ2RhdGEtcHJvZ3Jlc3MnLCBcIlwiICsgcHJvZ3Jlc3NTdHIpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMubGFzdFJlbmRlcmVkUHJvZ3Jlc3MgPSB0aGlzLnByb2dyZXNzO1xuICAgIH07XG5cbiAgICBCYXIucHJvdG90eXBlLmRvbmUgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLnByb2dyZXNzID49IDEwMDtcbiAgICB9O1xuXG4gICAgcmV0dXJuIEJhcjtcblxuICB9KSgpO1xuXG4gIEV2ZW50cyA9IChmdW5jdGlvbigpIHtcbiAgICBmdW5jdGlvbiBFdmVudHMoKSB7XG4gICAgICB0aGlzLmJpbmRpbmdzID0ge307XG4gICAgfVxuXG4gICAgRXZlbnRzLnByb3RvdHlwZS50cmlnZ2VyID0gZnVuY3Rpb24obmFtZSwgdmFsKSB7XG4gICAgICB2YXIgYmluZGluZywgX2osIF9sZW4xLCBfcmVmMiwgX3Jlc3VsdHM7XG4gICAgICBpZiAodGhpcy5iaW5kaW5nc1tuYW1lXSAhPSBudWxsKSB7XG4gICAgICAgIF9yZWYyID0gdGhpcy5iaW5kaW5nc1tuYW1lXTtcbiAgICAgICAgX3Jlc3VsdHMgPSBbXTtcbiAgICAgICAgZm9yIChfaiA9IDAsIF9sZW4xID0gX3JlZjIubGVuZ3RoOyBfaiA8IF9sZW4xOyBfaisrKSB7XG4gICAgICAgICAgYmluZGluZyA9IF9yZWYyW19qXTtcbiAgICAgICAgICBfcmVzdWx0cy5wdXNoKGJpbmRpbmcuY2FsbCh0aGlzLCB2YWwpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gX3Jlc3VsdHM7XG4gICAgICB9XG4gICAgfTtcblxuICAgIEV2ZW50cy5wcm90b3R5cGUub24gPSBmdW5jdGlvbihuYW1lLCBmbikge1xuICAgICAgdmFyIF9iYXNlO1xuICAgICAgaWYgKChfYmFzZSA9IHRoaXMuYmluZGluZ3MpW25hbWVdID09IG51bGwpIHtcbiAgICAgICAgX2Jhc2VbbmFtZV0gPSBbXTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLmJpbmRpbmdzW25hbWVdLnB1c2goZm4pO1xuICAgIH07XG5cbiAgICByZXR1cm4gRXZlbnRzO1xuXG4gIH0pKCk7XG5cbiAgX1hNTEh0dHBSZXF1ZXN0ID0gd2luZG93LlhNTEh0dHBSZXF1ZXN0O1xuXG4gIF9YRG9tYWluUmVxdWVzdCA9IHdpbmRvdy5YRG9tYWluUmVxdWVzdDtcblxuICBfV2ViU29ja2V0ID0gd2luZG93LldlYlNvY2tldDtcblxuICBleHRlbmROYXRpdmUgPSBmdW5jdGlvbih0bywgZnJvbSkge1xuICAgIHZhciBlLCBrZXksIF9yZXN1bHRzO1xuICAgIF9yZXN1bHRzID0gW107XG4gICAgZm9yIChrZXkgaW4gZnJvbS5wcm90b3R5cGUpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmICgodG9ba2V5XSA9PSBudWxsKSAmJiB0eXBlb2YgZnJvbVtrZXldICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgaWYgKHR5cGVvZiBPYmplY3QuZGVmaW5lUHJvcGVydHkgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIF9yZXN1bHRzLnB1c2goT2JqZWN0LmRlZmluZVByb3BlcnR5KHRvLCBrZXksIHtcbiAgICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZnJvbS5wcm90b3R5cGVba2V5XTtcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlXG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIF9yZXN1bHRzLnB1c2godG9ba2V5XSA9IGZyb20ucHJvdG90eXBlW2tleV0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBfcmVzdWx0cy5wdXNoKHZvaWQgMCk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKF9lcnJvcikge1xuICAgICAgICBlID0gX2Vycm9yO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gX3Jlc3VsdHM7XG4gIH07XG5cbiAgaWdub3JlU3RhY2sgPSBbXTtcblxuICBQYWNlLmlnbm9yZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBhcmdzLCBmbiwgcmV0O1xuICAgIGZuID0gYXJndW1lbnRzWzBdLCBhcmdzID0gMiA8PSBhcmd1bWVudHMubGVuZ3RoID8gX19zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkgOiBbXTtcbiAgICBpZ25vcmVTdGFjay51bnNoaWZ0KCdpZ25vcmUnKTtcbiAgICByZXQgPSBmbi5hcHBseShudWxsLCBhcmdzKTtcbiAgICBpZ25vcmVTdGFjay5zaGlmdCgpO1xuICAgIHJldHVybiByZXQ7XG4gIH07XG5cbiAgUGFjZS50cmFjayA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBhcmdzLCBmbiwgcmV0O1xuICAgIGZuID0gYXJndW1lbnRzWzBdLCBhcmdzID0gMiA8PSBhcmd1bWVudHMubGVuZ3RoID8gX19zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkgOiBbXTtcbiAgICBpZ25vcmVTdGFjay51bnNoaWZ0KCd0cmFjaycpO1xuICAgIHJldCA9IGZuLmFwcGx5KG51bGwsIGFyZ3MpO1xuICAgIGlnbm9yZVN0YWNrLnNoaWZ0KCk7XG4gICAgcmV0dXJuIHJldDtcbiAgfTtcblxuICBzaG91bGRUcmFjayA9IGZ1bmN0aW9uKG1ldGhvZCkge1xuICAgIHZhciBfcmVmMjtcbiAgICBpZiAobWV0aG9kID09IG51bGwpIHtcbiAgICAgIG1ldGhvZCA9ICdHRVQnO1xuICAgIH1cbiAgICBpZiAoaWdub3JlU3RhY2tbMF0gPT09ICd0cmFjaycpIHtcbiAgICAgIHJldHVybiAnZm9yY2UnO1xuICAgIH1cbiAgICBpZiAoIWlnbm9yZVN0YWNrLmxlbmd0aCAmJiBvcHRpb25zLmFqYXgpIHtcbiAgICAgIGlmIChtZXRob2QgPT09ICdzb2NrZXQnICYmIG9wdGlvbnMuYWpheC50cmFja1dlYlNvY2tldHMpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9IGVsc2UgaWYgKF9yZWYyID0gbWV0aG9kLnRvVXBwZXJDYXNlKCksIF9faW5kZXhPZi5jYWxsKG9wdGlvbnMuYWpheC50cmFja01ldGhvZHMsIF9yZWYyKSA+PSAwKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH07XG5cbiAgUmVxdWVzdEludGVyY2VwdCA9IChmdW5jdGlvbihfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoUmVxdWVzdEludGVyY2VwdCwgX3N1cGVyKTtcblxuICAgIGZ1bmN0aW9uIFJlcXVlc3RJbnRlcmNlcHQoKSB7XG4gICAgICB2YXIgbW9uaXRvclhIUixcbiAgICAgICAgX3RoaXMgPSB0aGlzO1xuICAgICAgUmVxdWVzdEludGVyY2VwdC5fX3N1cGVyX18uY29uc3RydWN0b3IuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIG1vbml0b3JYSFIgPSBmdW5jdGlvbihyZXEpIHtcbiAgICAgICAgdmFyIF9vcGVuO1xuICAgICAgICBfb3BlbiA9IHJlcS5vcGVuO1xuICAgICAgICByZXR1cm4gcmVxLm9wZW4gPSBmdW5jdGlvbih0eXBlLCB1cmwsIGFzeW5jKSB7XG4gICAgICAgICAgaWYgKHNob3VsZFRyYWNrKHR5cGUpKSB7XG4gICAgICAgICAgICBfdGhpcy50cmlnZ2VyKCdyZXF1ZXN0Jywge1xuICAgICAgICAgICAgICB0eXBlOiB0eXBlLFxuICAgICAgICAgICAgICB1cmw6IHVybCxcbiAgICAgICAgICAgICAgcmVxdWVzdDogcmVxXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIF9vcGVuLmFwcGx5KHJlcSwgYXJndW1lbnRzKTtcbiAgICAgICAgfTtcbiAgICAgIH07XG4gICAgICB3aW5kb3cuWE1MSHR0cFJlcXVlc3QgPSBmdW5jdGlvbihmbGFncykge1xuICAgICAgICB2YXIgcmVxO1xuICAgICAgICByZXEgPSBuZXcgX1hNTEh0dHBSZXF1ZXN0KGZsYWdzKTtcbiAgICAgICAgbW9uaXRvclhIUihyZXEpO1xuICAgICAgICByZXR1cm4gcmVxO1xuICAgICAgfTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGV4dGVuZE5hdGl2ZSh3aW5kb3cuWE1MSHR0cFJlcXVlc3QsIF9YTUxIdHRwUmVxdWVzdCk7XG4gICAgICB9IGNhdGNoIChfZXJyb3IpIHt9XG4gICAgICBpZiAoX1hEb21haW5SZXF1ZXN0ICE9IG51bGwpIHtcbiAgICAgICAgd2luZG93LlhEb21haW5SZXF1ZXN0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIHJlcTtcbiAgICAgICAgICByZXEgPSBuZXcgX1hEb21haW5SZXF1ZXN0O1xuICAgICAgICAgIG1vbml0b3JYSFIocmVxKTtcbiAgICAgICAgICByZXR1cm4gcmVxO1xuICAgICAgICB9O1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGV4dGVuZE5hdGl2ZSh3aW5kb3cuWERvbWFpblJlcXVlc3QsIF9YRG9tYWluUmVxdWVzdCk7XG4gICAgICAgIH0gY2F0Y2ggKF9lcnJvcikge31cbiAgICAgIH1cbiAgICAgIGlmICgoX1dlYlNvY2tldCAhPSBudWxsKSAmJiBvcHRpb25zLmFqYXgudHJhY2tXZWJTb2NrZXRzKSB7XG4gICAgICAgIHdpbmRvdy5XZWJTb2NrZXQgPSBmdW5jdGlvbih1cmwsIHByb3RvY29scykge1xuICAgICAgICAgIHZhciByZXE7XG4gICAgICAgICAgaWYgKHByb3RvY29scyAhPSBudWxsKSB7XG4gICAgICAgICAgICByZXEgPSBuZXcgX1dlYlNvY2tldCh1cmwsIHByb3RvY29scyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlcSA9IG5ldyBfV2ViU29ja2V0KHVybCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChzaG91bGRUcmFjaygnc29ja2V0JykpIHtcbiAgICAgICAgICAgIF90aGlzLnRyaWdnZXIoJ3JlcXVlc3QnLCB7XG4gICAgICAgICAgICAgIHR5cGU6ICdzb2NrZXQnLFxuICAgICAgICAgICAgICB1cmw6IHVybCxcbiAgICAgICAgICAgICAgcHJvdG9jb2xzOiBwcm90b2NvbHMsXG4gICAgICAgICAgICAgIHJlcXVlc3Q6IHJlcVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiByZXE7XG4gICAgICAgIH07XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgZXh0ZW5kTmF0aXZlKHdpbmRvdy5XZWJTb2NrZXQsIF9XZWJTb2NrZXQpO1xuICAgICAgICB9IGNhdGNoIChfZXJyb3IpIHt9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIFJlcXVlc3RJbnRlcmNlcHQ7XG5cbiAgfSkoRXZlbnRzKTtcblxuICBfaW50ZXJjZXB0ID0gbnVsbDtcblxuICBnZXRJbnRlcmNlcHQgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoX2ludGVyY2VwdCA9PSBudWxsKSB7XG4gICAgICBfaW50ZXJjZXB0ID0gbmV3IFJlcXVlc3RJbnRlcmNlcHQ7XG4gICAgfVxuICAgIHJldHVybiBfaW50ZXJjZXB0O1xuICB9O1xuXG4gIHNob3VsZElnbm9yZVVSTCA9IGZ1bmN0aW9uKHVybCkge1xuICAgIHZhciBwYXR0ZXJuLCBfaiwgX2xlbjEsIF9yZWYyO1xuICAgIF9yZWYyID0gb3B0aW9ucy5hamF4Lmlnbm9yZVVSTHM7XG4gICAgZm9yIChfaiA9IDAsIF9sZW4xID0gX3JlZjIubGVuZ3RoOyBfaiA8IF9sZW4xOyBfaisrKSB7XG4gICAgICBwYXR0ZXJuID0gX3JlZjJbX2pdO1xuICAgICAgaWYgKHR5cGVvZiBwYXR0ZXJuID09PSAnc3RyaW5nJykge1xuICAgICAgICBpZiAodXJsLmluZGV4T2YocGF0dGVybikgIT09IC0xKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChwYXR0ZXJuLnRlc3QodXJsKSkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfTtcblxuICBnZXRJbnRlcmNlcHQoKS5vbigncmVxdWVzdCcsIGZ1bmN0aW9uKF9hcmcpIHtcbiAgICB2YXIgYWZ0ZXIsIGFyZ3MsIHJlcXVlc3QsIHR5cGUsIHVybDtcbiAgICB0eXBlID0gX2FyZy50eXBlLCByZXF1ZXN0ID0gX2FyZy5yZXF1ZXN0LCB1cmwgPSBfYXJnLnVybDtcbiAgICBpZiAoc2hvdWxkSWdub3JlVVJMKHVybCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKCFQYWNlLnJ1bm5pbmcgJiYgKG9wdGlvbnMucmVzdGFydE9uUmVxdWVzdEFmdGVyICE9PSBmYWxzZSB8fCBzaG91bGRUcmFjayh0eXBlKSA9PT0gJ2ZvcmNlJykpIHtcbiAgICAgIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICBhZnRlciA9IG9wdGlvbnMucmVzdGFydE9uUmVxdWVzdEFmdGVyIHx8IDA7XG4gICAgICBpZiAodHlwZW9mIGFmdGVyID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgYWZ0ZXIgPSAwO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzdGlsbEFjdGl2ZSwgX2osIF9sZW4xLCBfcmVmMiwgX3JlZjMsIF9yZXN1bHRzO1xuICAgICAgICBpZiAodHlwZSA9PT0gJ3NvY2tldCcpIHtcbiAgICAgICAgICBzdGlsbEFjdGl2ZSA9IHJlcXVlc3QucmVhZHlTdGF0ZSA8IDI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RpbGxBY3RpdmUgPSAoMCA8IChfcmVmMiA9IHJlcXVlc3QucmVhZHlTdGF0ZSkgJiYgX3JlZjIgPCA0KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc3RpbGxBY3RpdmUpIHtcbiAgICAgICAgICBQYWNlLnJlc3RhcnQoKTtcbiAgICAgICAgICBfcmVmMyA9IFBhY2Uuc291cmNlcztcbiAgICAgICAgICBfcmVzdWx0cyA9IFtdO1xuICAgICAgICAgIGZvciAoX2ogPSAwLCBfbGVuMSA9IF9yZWYzLmxlbmd0aDsgX2ogPCBfbGVuMTsgX2orKykge1xuICAgICAgICAgICAgc291cmNlID0gX3JlZjNbX2pdO1xuICAgICAgICAgICAgaWYgKHNvdXJjZSBpbnN0YW5jZW9mIEFqYXhNb25pdG9yKSB7XG4gICAgICAgICAgICAgIHNvdXJjZS53YXRjaC5hcHBseShzb3VyY2UsIGFyZ3MpO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIF9yZXN1bHRzLnB1c2godm9pZCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIF9yZXN1bHRzO1xuICAgICAgICB9XG4gICAgICB9LCBhZnRlcik7XG4gICAgfVxuICB9KTtcblxuICBBamF4TW9uaXRvciA9IChmdW5jdGlvbigpIHtcbiAgICBmdW5jdGlvbiBBamF4TW9uaXRvcigpIHtcbiAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICB0aGlzLmVsZW1lbnRzID0gW107XG4gICAgICBnZXRJbnRlcmNlcHQoKS5vbigncmVxdWVzdCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gX3RoaXMud2F0Y2guYXBwbHkoX3RoaXMsIGFyZ3VtZW50cyk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBBamF4TW9uaXRvci5wcm90b3R5cGUud2F0Y2ggPSBmdW5jdGlvbihfYXJnKSB7XG4gICAgICB2YXIgcmVxdWVzdCwgdHJhY2tlciwgdHlwZSwgdXJsO1xuICAgICAgdHlwZSA9IF9hcmcudHlwZSwgcmVxdWVzdCA9IF9hcmcucmVxdWVzdCwgdXJsID0gX2FyZy51cmw7XG4gICAgICBpZiAoc2hvdWxkSWdub3JlVVJMKHVybCkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKHR5cGUgPT09ICdzb2NrZXQnKSB7XG4gICAgICAgIHRyYWNrZXIgPSBuZXcgU29ja2V0UmVxdWVzdFRyYWNrZXIocmVxdWVzdCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0cmFja2VyID0gbmV3IFhIUlJlcXVlc3RUcmFja2VyKHJlcXVlc3QpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudHMucHVzaCh0cmFja2VyKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIEFqYXhNb25pdG9yO1xuXG4gIH0pKCk7XG5cbiAgWEhSUmVxdWVzdFRyYWNrZXIgPSAoZnVuY3Rpb24oKSB7XG4gICAgZnVuY3Rpb24gWEhSUmVxdWVzdFRyYWNrZXIocmVxdWVzdCkge1xuICAgICAgdmFyIGV2ZW50LCBzaXplLCBfaiwgX2xlbjEsIF9vbnJlYWR5c3RhdGVjaGFuZ2UsIF9yZWYyLFxuICAgICAgICBfdGhpcyA9IHRoaXM7XG4gICAgICB0aGlzLnByb2dyZXNzID0gMDtcbiAgICAgIGlmICh3aW5kb3cuUHJvZ3Jlc3NFdmVudCAhPSBudWxsKSB7XG4gICAgICAgIHNpemUgPSBudWxsO1xuICAgICAgICByZXF1ZXN0LmFkZEV2ZW50TGlzdGVuZXIoJ3Byb2dyZXNzJywgZnVuY3Rpb24oZXZ0KSB7XG4gICAgICAgICAgaWYgKGV2dC5sZW5ndGhDb21wdXRhYmxlKSB7XG4gICAgICAgICAgICByZXR1cm4gX3RoaXMucHJvZ3Jlc3MgPSAxMDAgKiBldnQubG9hZGVkIC8gZXZ0LnRvdGFsO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gX3RoaXMucHJvZ3Jlc3MgPSBfdGhpcy5wcm9ncmVzcyArICgxMDAgLSBfdGhpcy5wcm9ncmVzcykgLyAyO1xuICAgICAgICAgIH1cbiAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICBfcmVmMiA9IFsnbG9hZCcsICdhYm9ydCcsICd0aW1lb3V0JywgJ2Vycm9yJ107XG4gICAgICAgIGZvciAoX2ogPSAwLCBfbGVuMSA9IF9yZWYyLmxlbmd0aDsgX2ogPCBfbGVuMTsgX2orKykge1xuICAgICAgICAgIGV2ZW50ID0gX3JlZjJbX2pdO1xuICAgICAgICAgIHJlcXVlc3QuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gX3RoaXMucHJvZ3Jlc3MgPSAxMDA7XG4gICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBfb25yZWFkeXN0YXRlY2hhbmdlID0gcmVxdWVzdC5vbnJlYWR5c3RhdGVjaGFuZ2U7XG4gICAgICAgIHJlcXVlc3Qub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIF9yZWYzO1xuICAgICAgICAgIGlmICgoX3JlZjMgPSByZXF1ZXN0LnJlYWR5U3RhdGUpID09PSAwIHx8IF9yZWYzID09PSA0KSB7XG4gICAgICAgICAgICBfdGhpcy5wcm9ncmVzcyA9IDEwMDtcbiAgICAgICAgICB9IGVsc2UgaWYgKHJlcXVlc3QucmVhZHlTdGF0ZSA9PT0gMykge1xuICAgICAgICAgICAgX3RoaXMucHJvZ3Jlc3MgPSA1MDtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHR5cGVvZiBfb25yZWFkeXN0YXRlY2hhbmdlID09PSBcImZ1bmN0aW9uXCIgPyBfb25yZWFkeXN0YXRlY2hhbmdlLmFwcGx5KG51bGwsIGFyZ3VtZW50cykgOiB2b2lkIDA7XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIFhIUlJlcXVlc3RUcmFja2VyO1xuXG4gIH0pKCk7XG5cbiAgU29ja2V0UmVxdWVzdFRyYWNrZXIgPSAoZnVuY3Rpb24oKSB7XG4gICAgZnVuY3Rpb24gU29ja2V0UmVxdWVzdFRyYWNrZXIocmVxdWVzdCkge1xuICAgICAgdmFyIGV2ZW50LCBfaiwgX2xlbjEsIF9yZWYyLFxuICAgICAgICBfdGhpcyA9IHRoaXM7XG4gICAgICB0aGlzLnByb2dyZXNzID0gMDtcbiAgICAgIF9yZWYyID0gWydlcnJvcicsICdvcGVuJ107XG4gICAgICBmb3IgKF9qID0gMCwgX2xlbjEgPSBfcmVmMi5sZW5ndGg7IF9qIDwgX2xlbjE7IF9qKyspIHtcbiAgICAgICAgZXZlbnQgPSBfcmVmMltfal07XG4gICAgICAgIHJlcXVlc3QuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIF90aGlzLnByb2dyZXNzID0gMTAwO1xuICAgICAgICB9LCBmYWxzZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIFNvY2tldFJlcXVlc3RUcmFja2VyO1xuXG4gIH0pKCk7XG5cbiAgRWxlbWVudE1vbml0b3IgPSAoZnVuY3Rpb24oKSB7XG4gICAgZnVuY3Rpb24gRWxlbWVudE1vbml0b3Iob3B0aW9ucykge1xuICAgICAgdmFyIHNlbGVjdG9yLCBfaiwgX2xlbjEsIF9yZWYyO1xuICAgICAgaWYgKG9wdGlvbnMgPT0gbnVsbCkge1xuICAgICAgICBvcHRpb25zID0ge307XG4gICAgICB9XG4gICAgICB0aGlzLmVsZW1lbnRzID0gW107XG4gICAgICBpZiAob3B0aW9ucy5zZWxlY3RvcnMgPT0gbnVsbCkge1xuICAgICAgICBvcHRpb25zLnNlbGVjdG9ycyA9IFtdO1xuICAgICAgfVxuICAgICAgX3JlZjIgPSBvcHRpb25zLnNlbGVjdG9ycztcbiAgICAgIGZvciAoX2ogPSAwLCBfbGVuMSA9IF9yZWYyLmxlbmd0aDsgX2ogPCBfbGVuMTsgX2orKykge1xuICAgICAgICBzZWxlY3RvciA9IF9yZWYyW19qXTtcbiAgICAgICAgdGhpcy5lbGVtZW50cy5wdXNoKG5ldyBFbGVtZW50VHJhY2tlcihzZWxlY3RvcikpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBFbGVtZW50TW9uaXRvcjtcblxuICB9KSgpO1xuXG4gIEVsZW1lbnRUcmFja2VyID0gKGZ1bmN0aW9uKCkge1xuICAgIGZ1bmN0aW9uIEVsZW1lbnRUcmFja2VyKHNlbGVjdG9yKSB7XG4gICAgICB0aGlzLnNlbGVjdG9yID0gc2VsZWN0b3I7XG4gICAgICB0aGlzLnByb2dyZXNzID0gMDtcbiAgICAgIHRoaXMuY2hlY2soKTtcbiAgICB9XG5cbiAgICBFbGVtZW50VHJhY2tlci5wcm90b3R5cGUuY2hlY2sgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICBpZiAoZG9jdW1lbnQucXVlcnlTZWxlY3Rvcih0aGlzLnNlbGVjdG9yKSkge1xuICAgICAgICByZXR1cm4gdGhpcy5kb25lKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dCgoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIF90aGlzLmNoZWNrKCk7XG4gICAgICAgIH0pLCBvcHRpb25zLmVsZW1lbnRzLmNoZWNrSW50ZXJ2YWwpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBFbGVtZW50VHJhY2tlci5wcm90b3R5cGUuZG9uZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMucHJvZ3Jlc3MgPSAxMDA7XG4gICAgfTtcblxuICAgIHJldHVybiBFbGVtZW50VHJhY2tlcjtcblxuICB9KSgpO1xuXG4gIERvY3VtZW50TW9uaXRvciA9IChmdW5jdGlvbigpIHtcbiAgICBEb2N1bWVudE1vbml0b3IucHJvdG90eXBlLnN0YXRlcyA9IHtcbiAgICAgIGxvYWRpbmc6IDAsXG4gICAgICBpbnRlcmFjdGl2ZTogNTAsXG4gICAgICBjb21wbGV0ZTogMTAwXG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIERvY3VtZW50TW9uaXRvcigpIHtcbiAgICAgIHZhciBfb25yZWFkeXN0YXRlY2hhbmdlLCBfcmVmMixcbiAgICAgICAgX3RoaXMgPSB0aGlzO1xuICAgICAgdGhpcy5wcm9ncmVzcyA9IChfcmVmMiA9IHRoaXMuc3RhdGVzW2RvY3VtZW50LnJlYWR5U3RhdGVdKSAhPSBudWxsID8gX3JlZjIgOiAxMDA7XG4gICAgICBfb25yZWFkeXN0YXRlY2hhbmdlID0gZG9jdW1lbnQub25yZWFkeXN0YXRlY2hhbmdlO1xuICAgICAgZG9jdW1lbnQub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChfdGhpcy5zdGF0ZXNbZG9jdW1lbnQucmVhZHlTdGF0ZV0gIT0gbnVsbCkge1xuICAgICAgICAgIF90aGlzLnByb2dyZXNzID0gX3RoaXMuc3RhdGVzW2RvY3VtZW50LnJlYWR5U3RhdGVdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0eXBlb2YgX29ucmVhZHlzdGF0ZWNoYW5nZSA9PT0gXCJmdW5jdGlvblwiID8gX29ucmVhZHlzdGF0ZWNoYW5nZS5hcHBseShudWxsLCBhcmd1bWVudHMpIDogdm9pZCAwO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gRG9jdW1lbnRNb25pdG9yO1xuXG4gIH0pKCk7XG5cbiAgRXZlbnRMYWdNb25pdG9yID0gKGZ1bmN0aW9uKCkge1xuICAgIGZ1bmN0aW9uIEV2ZW50TGFnTW9uaXRvcigpIHtcbiAgICAgIHZhciBhdmcsIGludGVydmFsLCBsYXN0LCBwb2ludHMsIHNhbXBsZXMsXG4gICAgICAgIF90aGlzID0gdGhpcztcbiAgICAgIHRoaXMucHJvZ3Jlc3MgPSAwO1xuICAgICAgYXZnID0gMDtcbiAgICAgIHNhbXBsZXMgPSBbXTtcbiAgICAgIHBvaW50cyA9IDA7XG4gICAgICBsYXN0ID0gbm93KCk7XG4gICAgICBpbnRlcnZhbCA9IHNldEludGVydmFsKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZGlmZjtcbiAgICAgICAgZGlmZiA9IG5vdygpIC0gbGFzdCAtIDUwO1xuICAgICAgICBsYXN0ID0gbm93KCk7XG4gICAgICAgIHNhbXBsZXMucHVzaChkaWZmKTtcbiAgICAgICAgaWYgKHNhbXBsZXMubGVuZ3RoID4gb3B0aW9ucy5ldmVudExhZy5zYW1wbGVDb3VudCkge1xuICAgICAgICAgIHNhbXBsZXMuc2hpZnQoKTtcbiAgICAgICAgfVxuICAgICAgICBhdmcgPSBhdmdBbXBsaXR1ZGUoc2FtcGxlcyk7XG4gICAgICAgIGlmICgrK3BvaW50cyA+PSBvcHRpb25zLmV2ZW50TGFnLm1pblNhbXBsZXMgJiYgYXZnIDwgb3B0aW9ucy5ldmVudExhZy5sYWdUaHJlc2hvbGQpIHtcbiAgICAgICAgICBfdGhpcy5wcm9ncmVzcyA9IDEwMDtcbiAgICAgICAgICByZXR1cm4gY2xlYXJJbnRlcnZhbChpbnRlcnZhbCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIF90aGlzLnByb2dyZXNzID0gMTAwICogKDMgLyAoYXZnICsgMykpO1xuICAgICAgICB9XG4gICAgICB9LCA1MCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIEV2ZW50TGFnTW9uaXRvcjtcblxuICB9KSgpO1xuXG4gIFNjYWxlciA9IChmdW5jdGlvbigpIHtcbiAgICBmdW5jdGlvbiBTY2FsZXIoc291cmNlKSB7XG4gICAgICB0aGlzLnNvdXJjZSA9IHNvdXJjZTtcbiAgICAgIHRoaXMubGFzdCA9IHRoaXMuc2luY2VMYXN0VXBkYXRlID0gMDtcbiAgICAgIHRoaXMucmF0ZSA9IG9wdGlvbnMuaW5pdGlhbFJhdGU7XG4gICAgICB0aGlzLmNhdGNodXAgPSAwO1xuICAgICAgdGhpcy5wcm9ncmVzcyA9IHRoaXMubGFzdFByb2dyZXNzID0gMDtcbiAgICAgIGlmICh0aGlzLnNvdXJjZSAhPSBudWxsKSB7XG4gICAgICAgIHRoaXMucHJvZ3Jlc3MgPSByZXN1bHQodGhpcy5zb3VyY2UsICdwcm9ncmVzcycpO1xuICAgICAgfVxuICAgIH1cblxuICAgIFNjYWxlci5wcm90b3R5cGUudGljayA9IGZ1bmN0aW9uKGZyYW1lVGltZSwgdmFsKSB7XG4gICAgICB2YXIgc2NhbGluZztcbiAgICAgIGlmICh2YWwgPT0gbnVsbCkge1xuICAgICAgICB2YWwgPSByZXN1bHQodGhpcy5zb3VyY2UsICdwcm9ncmVzcycpO1xuICAgICAgfVxuICAgICAgaWYgKHZhbCA+PSAxMDApIHtcbiAgICAgICAgdGhpcy5kb25lID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGlmICh2YWwgPT09IHRoaXMubGFzdCkge1xuICAgICAgICB0aGlzLnNpbmNlTGFzdFVwZGF0ZSArPSBmcmFtZVRpbWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAodGhpcy5zaW5jZUxhc3RVcGRhdGUpIHtcbiAgICAgICAgICB0aGlzLnJhdGUgPSAodmFsIC0gdGhpcy5sYXN0KSAvIHRoaXMuc2luY2VMYXN0VXBkYXRlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY2F0Y2h1cCA9ICh2YWwgLSB0aGlzLnByb2dyZXNzKSAvIG9wdGlvbnMuY2F0Y2h1cFRpbWU7XG4gICAgICAgIHRoaXMuc2luY2VMYXN0VXBkYXRlID0gMDtcbiAgICAgICAgdGhpcy5sYXN0ID0gdmFsO1xuICAgICAgfVxuICAgICAgaWYgKHZhbCA+IHRoaXMucHJvZ3Jlc3MpIHtcbiAgICAgICAgdGhpcy5wcm9ncmVzcyArPSB0aGlzLmNhdGNodXAgKiBmcmFtZVRpbWU7XG4gICAgICB9XG4gICAgICBzY2FsaW5nID0gMSAtIE1hdGgucG93KHRoaXMucHJvZ3Jlc3MgLyAxMDAsIG9wdGlvbnMuZWFzZUZhY3Rvcik7XG4gICAgICB0aGlzLnByb2dyZXNzICs9IHNjYWxpbmcgKiB0aGlzLnJhdGUgKiBmcmFtZVRpbWU7XG4gICAgICB0aGlzLnByb2dyZXNzID0gTWF0aC5taW4odGhpcy5sYXN0UHJvZ3Jlc3MgKyBvcHRpb25zLm1heFByb2dyZXNzUGVyRnJhbWUsIHRoaXMucHJvZ3Jlc3MpO1xuICAgICAgdGhpcy5wcm9ncmVzcyA9IE1hdGgubWF4KDAsIHRoaXMucHJvZ3Jlc3MpO1xuICAgICAgdGhpcy5wcm9ncmVzcyA9IE1hdGgubWluKDEwMCwgdGhpcy5wcm9ncmVzcyk7XG4gICAgICB0aGlzLmxhc3RQcm9ncmVzcyA9IHRoaXMucHJvZ3Jlc3M7XG4gICAgICByZXR1cm4gdGhpcy5wcm9ncmVzcztcbiAgICB9O1xuXG4gICAgcmV0dXJuIFNjYWxlcjtcblxuICB9KSgpO1xuXG4gIHNvdXJjZXMgPSBudWxsO1xuXG4gIHNjYWxlcnMgPSBudWxsO1xuXG4gIGJhciA9IG51bGw7XG5cbiAgdW5pU2NhbGVyID0gbnVsbDtcblxuICBhbmltYXRpb24gPSBudWxsO1xuXG4gIGNhbmNlbEFuaW1hdGlvbiA9IG51bGw7XG5cbiAgUGFjZS5ydW5uaW5nID0gZmFsc2U7XG5cbiAgaGFuZGxlUHVzaFN0YXRlID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKG9wdGlvbnMucmVzdGFydE9uUHVzaFN0YXRlKSB7XG4gICAgICByZXR1cm4gUGFjZS5yZXN0YXJ0KCk7XG4gICAgfVxuICB9O1xuXG4gIGlmICh3aW5kb3cuaGlzdG9yeS5wdXNoU3RhdGUgIT0gbnVsbCkge1xuICAgIF9wdXNoU3RhdGUgPSB3aW5kb3cuaGlzdG9yeS5wdXNoU3RhdGU7XG4gICAgd2luZG93Lmhpc3RvcnkucHVzaFN0YXRlID0gZnVuY3Rpb24oKSB7XG4gICAgICBoYW5kbGVQdXNoU3RhdGUoKTtcbiAgICAgIHJldHVybiBfcHVzaFN0YXRlLmFwcGx5KHdpbmRvdy5oaXN0b3J5LCBhcmd1bWVudHMpO1xuICAgIH07XG4gIH1cblxuICBpZiAod2luZG93Lmhpc3RvcnkucmVwbGFjZVN0YXRlICE9IG51bGwpIHtcbiAgICBfcmVwbGFjZVN0YXRlID0gd2luZG93Lmhpc3RvcnkucmVwbGFjZVN0YXRlO1xuICAgIHdpbmRvdy5oaXN0b3J5LnJlcGxhY2VTdGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgaGFuZGxlUHVzaFN0YXRlKCk7XG4gICAgICByZXR1cm4gX3JlcGxhY2VTdGF0ZS5hcHBseSh3aW5kb3cuaGlzdG9yeSwgYXJndW1lbnRzKTtcbiAgICB9O1xuICB9XG5cbiAgU09VUkNFX0tFWVMgPSB7XG4gICAgYWpheDogQWpheE1vbml0b3IsXG4gICAgZWxlbWVudHM6IEVsZW1lbnRNb25pdG9yLFxuICAgIGRvY3VtZW50OiBEb2N1bWVudE1vbml0b3IsXG4gICAgZXZlbnRMYWc6IEV2ZW50TGFnTW9uaXRvclxuICB9O1xuXG4gIChpbml0ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHR5cGUsIF9qLCBfaywgX2xlbjEsIF9sZW4yLCBfcmVmMiwgX3JlZjMsIF9yZWY0O1xuICAgIFBhY2Uuc291cmNlcyA9IHNvdXJjZXMgPSBbXTtcbiAgICBfcmVmMiA9IFsnYWpheCcsICdlbGVtZW50cycsICdkb2N1bWVudCcsICdldmVudExhZyddO1xuICAgIGZvciAoX2ogPSAwLCBfbGVuMSA9IF9yZWYyLmxlbmd0aDsgX2ogPCBfbGVuMTsgX2orKykge1xuICAgICAgdHlwZSA9IF9yZWYyW19qXTtcbiAgICAgIGlmIChvcHRpb25zW3R5cGVdICE9PSBmYWxzZSkge1xuICAgICAgICBzb3VyY2VzLnB1c2gobmV3IFNPVVJDRV9LRVlTW3R5cGVdKG9wdGlvbnNbdHlwZV0pKTtcbiAgICAgIH1cbiAgICB9XG4gICAgX3JlZjQgPSAoX3JlZjMgPSBvcHRpb25zLmV4dHJhU291cmNlcykgIT0gbnVsbCA/IF9yZWYzIDogW107XG4gICAgZm9yIChfayA9IDAsIF9sZW4yID0gX3JlZjQubGVuZ3RoOyBfayA8IF9sZW4yOyBfaysrKSB7XG4gICAgICBzb3VyY2UgPSBfcmVmNFtfa107XG4gICAgICBzb3VyY2VzLnB1c2gobmV3IHNvdXJjZShvcHRpb25zKSk7XG4gICAgfVxuICAgIFBhY2UuYmFyID0gYmFyID0gbmV3IEJhcjtcbiAgICBzY2FsZXJzID0gW107XG4gICAgcmV0dXJuIHVuaVNjYWxlciA9IG5ldyBTY2FsZXI7XG4gIH0pKCk7XG5cbiAgUGFjZS5zdG9wID0gZnVuY3Rpb24oKSB7XG4gICAgUGFjZS50cmlnZ2VyKCdzdG9wJyk7XG4gICAgUGFjZS5ydW5uaW5nID0gZmFsc2U7XG4gICAgYmFyLmRlc3Ryb3koKTtcbiAgICBjYW5jZWxBbmltYXRpb24gPSB0cnVlO1xuICAgIGlmIChhbmltYXRpb24gIT0gbnVsbCkge1xuICAgICAgaWYgKHR5cGVvZiBjYW5jZWxBbmltYXRpb25GcmFtZSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIGNhbmNlbEFuaW1hdGlvbkZyYW1lKGFuaW1hdGlvbik7XG4gICAgICB9XG4gICAgICBhbmltYXRpb24gPSBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gaW5pdCgpO1xuICB9O1xuXG4gIFBhY2UucmVzdGFydCA9IGZ1bmN0aW9uKCkge1xuICAgIFBhY2UudHJpZ2dlcigncmVzdGFydCcpO1xuICAgIFBhY2Uuc3RvcCgpO1xuICAgIHJldHVybiBQYWNlLnN0YXJ0KCk7XG4gIH07XG5cbiAgUGFjZS5nbyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzdGFydDtcbiAgICBQYWNlLnJ1bm5pbmcgPSB0cnVlO1xuICAgIGJhci5yZW5kZXIoKTtcbiAgICBzdGFydCA9IG5vdygpO1xuICAgIGNhbmNlbEFuaW1hdGlvbiA9IGZhbHNlO1xuICAgIHJldHVybiBhbmltYXRpb24gPSBydW5BbmltYXRpb24oZnVuY3Rpb24oZnJhbWVUaW1lLCBlbnF1ZXVlTmV4dEZyYW1lKSB7XG4gICAgICB2YXIgYXZnLCBjb3VudCwgZG9uZSwgZWxlbWVudCwgZWxlbWVudHMsIGksIGosIHJlbWFpbmluZywgc2NhbGVyLCBzY2FsZXJMaXN0LCBzdW0sIF9qLCBfaywgX2xlbjEsIF9sZW4yLCBfcmVmMjtcbiAgICAgIHJlbWFpbmluZyA9IDEwMCAtIGJhci5wcm9ncmVzcztcbiAgICAgIGNvdW50ID0gc3VtID0gMDtcbiAgICAgIGRvbmUgPSB0cnVlO1xuICAgICAgZm9yIChpID0gX2ogPSAwLCBfbGVuMSA9IHNvdXJjZXMubGVuZ3RoOyBfaiA8IF9sZW4xOyBpID0gKytfaikge1xuICAgICAgICBzb3VyY2UgPSBzb3VyY2VzW2ldO1xuICAgICAgICBzY2FsZXJMaXN0ID0gc2NhbGVyc1tpXSAhPSBudWxsID8gc2NhbGVyc1tpXSA6IHNjYWxlcnNbaV0gPSBbXTtcbiAgICAgICAgZWxlbWVudHMgPSAoX3JlZjIgPSBzb3VyY2UuZWxlbWVudHMpICE9IG51bGwgPyBfcmVmMiA6IFtzb3VyY2VdO1xuICAgICAgICBmb3IgKGogPSBfayA9IDAsIF9sZW4yID0gZWxlbWVudHMubGVuZ3RoOyBfayA8IF9sZW4yOyBqID0gKytfaykge1xuICAgICAgICAgIGVsZW1lbnQgPSBlbGVtZW50c1tqXTtcbiAgICAgICAgICBzY2FsZXIgPSBzY2FsZXJMaXN0W2pdICE9IG51bGwgPyBzY2FsZXJMaXN0W2pdIDogc2NhbGVyTGlzdFtqXSA9IG5ldyBTY2FsZXIoZWxlbWVudCk7XG4gICAgICAgICAgZG9uZSAmPSBzY2FsZXIuZG9uZTtcbiAgICAgICAgICBpZiAoc2NhbGVyLmRvbmUpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb3VudCsrO1xuICAgICAgICAgIHN1bSArPSBzY2FsZXIudGljayhmcmFtZVRpbWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBhdmcgPSBzdW0gLyBjb3VudDtcbiAgICAgIGJhci51cGRhdGUodW5pU2NhbGVyLnRpY2soZnJhbWVUaW1lLCBhdmcpKTtcbiAgICAgIGlmIChiYXIuZG9uZSgpIHx8IGRvbmUgfHwgY2FuY2VsQW5pbWF0aW9uKSB7XG4gICAgICAgIGJhci51cGRhdGUoMTAwKTtcbiAgICAgICAgUGFjZS50cmlnZ2VyKCdkb25lJyk7XG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGJhci5maW5pc2goKTtcbiAgICAgICAgICBQYWNlLnJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICByZXR1cm4gUGFjZS50cmlnZ2VyKCdoaWRlJyk7XG4gICAgICAgIH0sIE1hdGgubWF4KG9wdGlvbnMuZ2hvc3RUaW1lLCBNYXRoLm1heChvcHRpb25zLm1pblRpbWUgLSAobm93KCkgLSBzdGFydCksIDApKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZW5xdWV1ZU5leHRGcmFtZSgpO1xuICAgICAgfVxuICAgIH0pO1xuICB9O1xuXG4gIFBhY2Uuc3RhcnQgPSBmdW5jdGlvbihfb3B0aW9ucykge1xuICAgIGV4dGVuZChvcHRpb25zLCBfb3B0aW9ucyk7XG4gICAgUGFjZS5ydW5uaW5nID0gdHJ1ZTtcbiAgICB0cnkge1xuICAgICAgYmFyLnJlbmRlcigpO1xuICAgIH0gY2F0Y2ggKF9lcnJvcikge1xuICAgICAgTm9UYXJnZXRFcnJvciA9IF9lcnJvcjtcbiAgICB9XG4gICAgaWYgKCFkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcucGFjZScpKSB7XG4gICAgICByZXR1cm4gc2V0VGltZW91dChQYWNlLnN0YXJ0LCA1MCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIFBhY2UudHJpZ2dlcignc3RhcnQnKTtcbiAgICAgIHJldHVybiBQYWNlLmdvKCk7XG4gICAgfVxuICB9O1xuXG4gIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICBkZWZpbmUoWydwYWNlJ10sIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIFBhY2U7XG4gICAgfSk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBQYWNlO1xuICB9IGVsc2Uge1xuICAgIGlmIChvcHRpb25zLnN0YXJ0T25QYWdlTG9hZCkge1xuICAgICAgUGFjZS5zdGFydCgpO1xuICAgIH1cbiAgfVxuXG59KS5jYWxsKHRoaXMpO1xuIiwiLyohXG4gKiBCb290c3RyYXAgdjMuNC4xIChodHRwczovL2dldGJvb3RzdHJhcC5jb20vKVxuICogQ29weXJpZ2h0IDIwMTEtMjAxOSBUd2l0dGVyLCBJbmMuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2VcbiAqL1xuXG5pZiAodHlwZW9mIGpRdWVyeSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgdGhyb3cgbmV3IEVycm9yKCdCb290c3RyYXBcXCdzIEphdmFTY3JpcHQgcmVxdWlyZXMgalF1ZXJ5Jylcbn1cblxuK2Z1bmN0aW9uICgkKSB7XG4gICd1c2Ugc3RyaWN0JztcbiAgdmFyIHZlcnNpb24gPSAkLmZuLmpxdWVyeS5zcGxpdCgnICcpWzBdLnNwbGl0KCcuJylcbiAgaWYgKCh2ZXJzaW9uWzBdIDwgMiAmJiB2ZXJzaW9uWzFdIDwgOSkgfHwgKHZlcnNpb25bMF0gPT0gMSAmJiB2ZXJzaW9uWzFdID09IDkgJiYgdmVyc2lvblsyXSA8IDEpIHx8ICh2ZXJzaW9uWzBdID4gMykpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0Jvb3RzdHJhcFxcJ3MgSmF2YVNjcmlwdCByZXF1aXJlcyBqUXVlcnkgdmVyc2lvbiAxLjkuMSBvciBoaWdoZXIsIGJ1dCBsb3dlciB0aGFuIHZlcnNpb24gNCcpXG4gIH1cbn0oalF1ZXJ5KTtcblxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBCb290c3RyYXA6IHRyYW5zaXRpb24uanMgdjMuNC4xXG4gKiBodHRwczovL2dldGJvb3RzdHJhcC5jb20vZG9jcy8zLjQvamF2YXNjcmlwdC8jdHJhbnNpdGlvbnNcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogQ29weXJpZ2h0IDIwMTEtMjAxOSBUd2l0dGVyLCBJbmMuXG4gKiBMaWNlbnNlZCB1bmRlciBNSVQgKGh0dHBzOi8vZ2l0aHViLmNvbS90d2JzL2Jvb3RzdHJhcC9ibG9iL21hc3Rlci9MSUNFTlNFKVxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovXG5cblxuK2Z1bmN0aW9uICgkKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICAvLyBDU1MgVFJBTlNJVElPTiBTVVBQT1JUIChTaG91dG91dDogaHR0cHM6Ly9tb2Rlcm5penIuY29tLylcbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgZnVuY3Rpb24gdHJhbnNpdGlvbkVuZCgpIHtcbiAgICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdib290c3RyYXAnKVxuXG4gICAgdmFyIHRyYW5zRW5kRXZlbnROYW1lcyA9IHtcbiAgICAgIFdlYmtpdFRyYW5zaXRpb24gOiAnd2Via2l0VHJhbnNpdGlvbkVuZCcsXG4gICAgICBNb3pUcmFuc2l0aW9uICAgIDogJ3RyYW5zaXRpb25lbmQnLFxuICAgICAgT1RyYW5zaXRpb24gICAgICA6ICdvVHJhbnNpdGlvbkVuZCBvdHJhbnNpdGlvbmVuZCcsXG4gICAgICB0cmFuc2l0aW9uICAgICAgIDogJ3RyYW5zaXRpb25lbmQnXG4gICAgfVxuXG4gICAgZm9yICh2YXIgbmFtZSBpbiB0cmFuc0VuZEV2ZW50TmFtZXMpIHtcbiAgICAgIGlmIChlbC5zdHlsZVtuYW1lXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiB7IGVuZDogdHJhbnNFbmRFdmVudE5hbWVzW25hbWVdIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2UgLy8gZXhwbGljaXQgZm9yIGllOCAoICAuXy4pXG4gIH1cblxuICAvLyBodHRwczovL2Jsb2cuYWxleG1hY2Nhdy5jb20vY3NzLXRyYW5zaXRpb25zXG4gICQuZm4uZW11bGF0ZVRyYW5zaXRpb25FbmQgPSBmdW5jdGlvbiAoZHVyYXRpb24pIHtcbiAgICB2YXIgY2FsbGVkID0gZmFsc2VcbiAgICB2YXIgJGVsID0gdGhpc1xuICAgICQodGhpcykub25lKCdic1RyYW5zaXRpb25FbmQnLCBmdW5jdGlvbiAoKSB7IGNhbGxlZCA9IHRydWUgfSlcbiAgICB2YXIgY2FsbGJhY2sgPSBmdW5jdGlvbiAoKSB7IGlmICghY2FsbGVkKSAkKCRlbCkudHJpZ2dlcigkLnN1cHBvcnQudHJhbnNpdGlvbi5lbmQpIH1cbiAgICBzZXRUaW1lb3V0KGNhbGxiYWNrLCBkdXJhdGlvbilcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgJChmdW5jdGlvbiAoKSB7XG4gICAgJC5zdXBwb3J0LnRyYW5zaXRpb24gPSB0cmFuc2l0aW9uRW5kKClcblxuICAgIGlmICghJC5zdXBwb3J0LnRyYW5zaXRpb24pIHJldHVyblxuXG4gICAgJC5ldmVudC5zcGVjaWFsLmJzVHJhbnNpdGlvbkVuZCA9IHtcbiAgICAgIGJpbmRUeXBlOiAkLnN1cHBvcnQudHJhbnNpdGlvbi5lbmQsXG4gICAgICBkZWxlZ2F0ZVR5cGU6ICQuc3VwcG9ydC50cmFuc2l0aW9uLmVuZCxcbiAgICAgIGhhbmRsZTogZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgaWYgKCQoZS50YXJnZXQpLmlzKHRoaXMpKSByZXR1cm4gZS5oYW5kbGVPYmouaGFuZGxlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgICB9XG4gICAgfVxuICB9KVxuXG59KGpRdWVyeSk7XG5cbi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogQm9vdHN0cmFwOiBhbGVydC5qcyB2My40LjFcbiAqIGh0dHBzOi8vZ2V0Ym9vdHN0cmFwLmNvbS9kb2NzLzMuNC9qYXZhc2NyaXB0LyNhbGVydHNcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogQ29weXJpZ2h0IDIwMTEtMjAxOSBUd2l0dGVyLCBJbmMuXG4gKiBMaWNlbnNlZCB1bmRlciBNSVQgKGh0dHBzOi8vZ2l0aHViLmNvbS90d2JzL2Jvb3RzdHJhcC9ibG9iL21hc3Rlci9MSUNFTlNFKVxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovXG5cblxuK2Z1bmN0aW9uICgkKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICAvLyBBTEVSVCBDTEFTUyBERUZJTklUSU9OXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT1cblxuICB2YXIgZGlzbWlzcyA9ICdbZGF0YS1kaXNtaXNzPVwiYWxlcnRcIl0nXG4gIHZhciBBbGVydCAgID0gZnVuY3Rpb24gKGVsKSB7XG4gICAgJChlbCkub24oJ2NsaWNrJywgZGlzbWlzcywgdGhpcy5jbG9zZSlcbiAgfVxuXG4gIEFsZXJ0LlZFUlNJT04gPSAnMy40LjEnXG5cbiAgQWxlcnQuVFJBTlNJVElPTl9EVVJBVElPTiA9IDE1MFxuXG4gIEFsZXJ0LnByb3RvdHlwZS5jbG9zZSA9IGZ1bmN0aW9uIChlKSB7XG4gICAgdmFyICR0aGlzICAgID0gJCh0aGlzKVxuICAgIHZhciBzZWxlY3RvciA9ICR0aGlzLmF0dHIoJ2RhdGEtdGFyZ2V0JylcblxuICAgIGlmICghc2VsZWN0b3IpIHtcbiAgICAgIHNlbGVjdG9yID0gJHRoaXMuYXR0cignaHJlZicpXG4gICAgICBzZWxlY3RvciA9IHNlbGVjdG9yICYmIHNlbGVjdG9yLnJlcGxhY2UoLy4qKD89I1teXFxzXSokKS8sICcnKSAvLyBzdHJpcCBmb3IgaWU3XG4gICAgfVxuXG4gICAgc2VsZWN0b3IgICAgPSBzZWxlY3RvciA9PT0gJyMnID8gW10gOiBzZWxlY3RvclxuICAgIHZhciAkcGFyZW50ID0gJChkb2N1bWVudCkuZmluZChzZWxlY3RvcilcblxuICAgIGlmIChlKSBlLnByZXZlbnREZWZhdWx0KClcblxuICAgIGlmICghJHBhcmVudC5sZW5ndGgpIHtcbiAgICAgICRwYXJlbnQgPSAkdGhpcy5jbG9zZXN0KCcuYWxlcnQnKVxuICAgIH1cblxuICAgICRwYXJlbnQudHJpZ2dlcihlID0gJC5FdmVudCgnY2xvc2UuYnMuYWxlcnQnKSlcblxuICAgIGlmIChlLmlzRGVmYXVsdFByZXZlbnRlZCgpKSByZXR1cm5cblxuICAgICRwYXJlbnQucmVtb3ZlQ2xhc3MoJ2luJylcblxuICAgIGZ1bmN0aW9uIHJlbW92ZUVsZW1lbnQoKSB7XG4gICAgICAvLyBkZXRhY2ggZnJvbSBwYXJlbnQsIGZpcmUgZXZlbnQgdGhlbiBjbGVhbiB1cCBkYXRhXG4gICAgICAkcGFyZW50LmRldGFjaCgpLnRyaWdnZXIoJ2Nsb3NlZC5icy5hbGVydCcpLnJlbW92ZSgpXG4gICAgfVxuXG4gICAgJC5zdXBwb3J0LnRyYW5zaXRpb24gJiYgJHBhcmVudC5oYXNDbGFzcygnZmFkZScpID9cbiAgICAgICRwYXJlbnRcbiAgICAgICAgLm9uZSgnYnNUcmFuc2l0aW9uRW5kJywgcmVtb3ZlRWxlbWVudClcbiAgICAgICAgLmVtdWxhdGVUcmFuc2l0aW9uRW5kKEFsZXJ0LlRSQU5TSVRJT05fRFVSQVRJT04pIDpcbiAgICAgIHJlbW92ZUVsZW1lbnQoKVxuICB9XG5cblxuICAvLyBBTEVSVCBQTFVHSU4gREVGSU5JVElPTlxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PVxuXG4gIGZ1bmN0aW9uIFBsdWdpbihvcHRpb24pIHtcbiAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciAkdGhpcyA9ICQodGhpcylcbiAgICAgIHZhciBkYXRhICA9ICR0aGlzLmRhdGEoJ2JzLmFsZXJ0JylcblxuICAgICAgaWYgKCFkYXRhKSAkdGhpcy5kYXRhKCdicy5hbGVydCcsIChkYXRhID0gbmV3IEFsZXJ0KHRoaXMpKSlcbiAgICAgIGlmICh0eXBlb2Ygb3B0aW9uID09ICdzdHJpbmcnKSBkYXRhW29wdGlvbl0uY2FsbCgkdGhpcylcbiAgICB9KVxuICB9XG5cbiAgdmFyIG9sZCA9ICQuZm4uYWxlcnRcblxuICAkLmZuLmFsZXJ0ICAgICAgICAgICAgID0gUGx1Z2luXG4gICQuZm4uYWxlcnQuQ29uc3RydWN0b3IgPSBBbGVydFxuXG5cbiAgLy8gQUxFUlQgTk8gQ09ORkxJQ1RcbiAgLy8gPT09PT09PT09PT09PT09PT1cblxuICAkLmZuLmFsZXJ0Lm5vQ29uZmxpY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgJC5mbi5hbGVydCA9IG9sZFxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuXG4gIC8vIEFMRVJUIERBVEEtQVBJXG4gIC8vID09PT09PT09PT09PT09XG5cbiAgJChkb2N1bWVudCkub24oJ2NsaWNrLmJzLmFsZXJ0LmRhdGEtYXBpJywgZGlzbWlzcywgQWxlcnQucHJvdG90eXBlLmNsb3NlKVxuXG59KGpRdWVyeSk7XG5cbi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogQm9vdHN0cmFwOiBidXR0b24uanMgdjMuNC4xXG4gKiBodHRwczovL2dldGJvb3RzdHJhcC5jb20vZG9jcy8zLjQvamF2YXNjcmlwdC8jYnV0dG9uc1xuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBDb3B5cmlnaHQgMjAxMS0yMDE5IFR3aXR0ZXIsIEluYy5cbiAqIExpY2Vuc2VkIHVuZGVyIE1JVCAoaHR0cHM6Ly9naXRodWIuY29tL3R3YnMvYm9vdHN0cmFwL2Jsb2IvbWFzdGVyL0xJQ0VOU0UpXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi9cblxuXG4rZnVuY3Rpb24gKCQpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIC8vIEJVVFRPTiBQVUJMSUMgQ0xBU1MgREVGSU5JVElPTlxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICB2YXIgQnV0dG9uID0gZnVuY3Rpb24gKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLiRlbGVtZW50ICA9ICQoZWxlbWVudClcbiAgICB0aGlzLm9wdGlvbnMgICA9ICQuZXh0ZW5kKHt9LCBCdXR0b24uREVGQVVMVFMsIG9wdGlvbnMpXG4gICAgdGhpcy5pc0xvYWRpbmcgPSBmYWxzZVxuICB9XG5cbiAgQnV0dG9uLlZFUlNJT04gID0gJzMuNC4xJ1xuXG4gIEJ1dHRvbi5ERUZBVUxUUyA9IHtcbiAgICBsb2FkaW5nVGV4dDogJ2xvYWRpbmcuLi4nXG4gIH1cblxuICBCdXR0b24ucHJvdG90eXBlLnNldFN0YXRlID0gZnVuY3Rpb24gKHN0YXRlKSB7XG4gICAgdmFyIGQgICAgPSAnZGlzYWJsZWQnXG4gICAgdmFyICRlbCAgPSB0aGlzLiRlbGVtZW50XG4gICAgdmFyIHZhbCAgPSAkZWwuaXMoJ2lucHV0JykgPyAndmFsJyA6ICdodG1sJ1xuICAgIHZhciBkYXRhID0gJGVsLmRhdGEoKVxuXG4gICAgc3RhdGUgKz0gJ1RleHQnXG5cbiAgICBpZiAoZGF0YS5yZXNldFRleHQgPT0gbnVsbCkgJGVsLmRhdGEoJ3Jlc2V0VGV4dCcsICRlbFt2YWxdKCkpXG5cbiAgICAvLyBwdXNoIHRvIGV2ZW50IGxvb3AgdG8gYWxsb3cgZm9ybXMgdG8gc3VibWl0XG4gICAgc2V0VGltZW91dCgkLnByb3h5KGZ1bmN0aW9uICgpIHtcbiAgICAgICRlbFt2YWxdKGRhdGFbc3RhdGVdID09IG51bGwgPyB0aGlzLm9wdGlvbnNbc3RhdGVdIDogZGF0YVtzdGF0ZV0pXG5cbiAgICAgIGlmIChzdGF0ZSA9PSAnbG9hZGluZ1RleHQnKSB7XG4gICAgICAgIHRoaXMuaXNMb2FkaW5nID0gdHJ1ZVxuICAgICAgICAkZWwuYWRkQ2xhc3MoZCkuYXR0cihkLCBkKS5wcm9wKGQsIHRydWUpXG4gICAgICB9IGVsc2UgaWYgKHRoaXMuaXNMb2FkaW5nKSB7XG4gICAgICAgIHRoaXMuaXNMb2FkaW5nID0gZmFsc2VcbiAgICAgICAgJGVsLnJlbW92ZUNsYXNzKGQpLnJlbW92ZUF0dHIoZCkucHJvcChkLCBmYWxzZSlcbiAgICAgIH1cbiAgICB9LCB0aGlzKSwgMClcbiAgfVxuXG4gIEJ1dHRvbi5wcm90b3R5cGUudG9nZ2xlID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBjaGFuZ2VkID0gdHJ1ZVxuICAgIHZhciAkcGFyZW50ID0gdGhpcy4kZWxlbWVudC5jbG9zZXN0KCdbZGF0YS10b2dnbGU9XCJidXR0b25zXCJdJylcblxuICAgIGlmICgkcGFyZW50Lmxlbmd0aCkge1xuICAgICAgdmFyICRpbnB1dCA9IHRoaXMuJGVsZW1lbnQuZmluZCgnaW5wdXQnKVxuICAgICAgaWYgKCRpbnB1dC5wcm9wKCd0eXBlJykgPT0gJ3JhZGlvJykge1xuICAgICAgICBpZiAoJGlucHV0LnByb3AoJ2NoZWNrZWQnKSkgY2hhbmdlZCA9IGZhbHNlXG4gICAgICAgICRwYXJlbnQuZmluZCgnLmFjdGl2ZScpLnJlbW92ZUNsYXNzKCdhY3RpdmUnKVxuICAgICAgICB0aGlzLiRlbGVtZW50LmFkZENsYXNzKCdhY3RpdmUnKVxuICAgICAgfSBlbHNlIGlmICgkaW5wdXQucHJvcCgndHlwZScpID09ICdjaGVja2JveCcpIHtcbiAgICAgICAgaWYgKCgkaW5wdXQucHJvcCgnY2hlY2tlZCcpKSAhPT0gdGhpcy4kZWxlbWVudC5oYXNDbGFzcygnYWN0aXZlJykpIGNoYW5nZWQgPSBmYWxzZVxuICAgICAgICB0aGlzLiRlbGVtZW50LnRvZ2dsZUNsYXNzKCdhY3RpdmUnKVxuICAgICAgfVxuICAgICAgJGlucHV0LnByb3AoJ2NoZWNrZWQnLCB0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKCdhY3RpdmUnKSlcbiAgICAgIGlmIChjaGFuZ2VkKSAkaW5wdXQudHJpZ2dlcignY2hhbmdlJylcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy4kZWxlbWVudC5hdHRyKCdhcmlhLXByZXNzZWQnLCAhdGhpcy4kZWxlbWVudC5oYXNDbGFzcygnYWN0aXZlJykpXG4gICAgICB0aGlzLiRlbGVtZW50LnRvZ2dsZUNsYXNzKCdhY3RpdmUnKVxuICAgIH1cbiAgfVxuXG5cbiAgLy8gQlVUVE9OIFBMVUdJTiBERUZJTklUSU9OXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gIGZ1bmN0aW9uIFBsdWdpbihvcHRpb24pIHtcbiAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciAkdGhpcyAgID0gJCh0aGlzKVxuICAgICAgdmFyIGRhdGEgICAgPSAkdGhpcy5kYXRhKCdicy5idXR0b24nKVxuICAgICAgdmFyIG9wdGlvbnMgPSB0eXBlb2Ygb3B0aW9uID09ICdvYmplY3QnICYmIG9wdGlvblxuXG4gICAgICBpZiAoIWRhdGEpICR0aGlzLmRhdGEoJ2JzLmJ1dHRvbicsIChkYXRhID0gbmV3IEJ1dHRvbih0aGlzLCBvcHRpb25zKSkpXG5cbiAgICAgIGlmIChvcHRpb24gPT0gJ3RvZ2dsZScpIGRhdGEudG9nZ2xlKClcbiAgICAgIGVsc2UgaWYgKG9wdGlvbikgZGF0YS5zZXRTdGF0ZShvcHRpb24pXG4gICAgfSlcbiAgfVxuXG4gIHZhciBvbGQgPSAkLmZuLmJ1dHRvblxuXG4gICQuZm4uYnV0dG9uICAgICAgICAgICAgID0gUGx1Z2luXG4gICQuZm4uYnV0dG9uLkNvbnN0cnVjdG9yID0gQnV0dG9uXG5cblxuICAvLyBCVVRUT04gTk8gQ09ORkxJQ1RcbiAgLy8gPT09PT09PT09PT09PT09PT09XG5cbiAgJC5mbi5idXR0b24ubm9Db25mbGljdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAkLmZuLmJ1dHRvbiA9IG9sZFxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuXG4gIC8vIEJVVFRPTiBEQVRBLUFQSVxuICAvLyA9PT09PT09PT09PT09PT1cblxuICAkKGRvY3VtZW50KVxuICAgIC5vbignY2xpY2suYnMuYnV0dG9uLmRhdGEtYXBpJywgJ1tkYXRhLXRvZ2dsZV49XCJidXR0b25cIl0nLCBmdW5jdGlvbiAoZSkge1xuICAgICAgdmFyICRidG4gPSAkKGUudGFyZ2V0KS5jbG9zZXN0KCcuYnRuJylcbiAgICAgIFBsdWdpbi5jYWxsKCRidG4sICd0b2dnbGUnKVxuICAgICAgaWYgKCEoJChlLnRhcmdldCkuaXMoJ2lucHV0W3R5cGU9XCJyYWRpb1wiXSwgaW5wdXRbdHlwZT1cImNoZWNrYm94XCJdJykpKSB7XG4gICAgICAgIC8vIFByZXZlbnQgZG91YmxlIGNsaWNrIG9uIHJhZGlvcywgYW5kIHRoZSBkb3VibGUgc2VsZWN0aW9ucyAoc28gY2FuY2VsbGF0aW9uKSBvbiBjaGVja2JveGVzXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgICAvLyBUaGUgdGFyZ2V0IGNvbXBvbmVudCBzdGlsbCByZWNlaXZlIHRoZSBmb2N1c1xuICAgICAgICBpZiAoJGJ0bi5pcygnaW5wdXQsYnV0dG9uJykpICRidG4udHJpZ2dlcignZm9jdXMnKVxuICAgICAgICBlbHNlICRidG4uZmluZCgnaW5wdXQ6dmlzaWJsZSxidXR0b246dmlzaWJsZScpLmZpcnN0KCkudHJpZ2dlcignZm9jdXMnKVxuICAgICAgfVxuICAgIH0pXG4gICAgLm9uKCdmb2N1cy5icy5idXR0b24uZGF0YS1hcGkgYmx1ci5icy5idXR0b24uZGF0YS1hcGknLCAnW2RhdGEtdG9nZ2xlXj1cImJ1dHRvblwiXScsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAkKGUudGFyZ2V0KS5jbG9zZXN0KCcuYnRuJykudG9nZ2xlQ2xhc3MoJ2ZvY3VzJywgL15mb2N1cyhpbik/JC8udGVzdChlLnR5cGUpKVxuICAgIH0pXG5cbn0oalF1ZXJ5KTtcblxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBCb290c3RyYXA6IGNhcm91c2VsLmpzIHYzLjQuMVxuICogaHR0cHM6Ly9nZXRib290c3RyYXAuY29tL2RvY3MvMy40L2phdmFzY3JpcHQvI2Nhcm91c2VsXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIENvcHlyaWdodCAyMDExLTIwMTkgVHdpdHRlciwgSW5jLlxuICogTGljZW5zZWQgdW5kZXIgTUlUIChodHRwczovL2dpdGh1Yi5jb20vdHdicy9ib290c3RyYXAvYmxvYi9tYXN0ZXIvTElDRU5TRSlcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqL1xuXG5cbitmdW5jdGlvbiAoJCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgLy8gQ0FST1VTRUwgQ0xBU1MgREVGSU5JVElPTlxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgdmFyIENhcm91c2VsID0gZnVuY3Rpb24gKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLiRlbGVtZW50ICAgID0gJChlbGVtZW50KVxuICAgIHRoaXMuJGluZGljYXRvcnMgPSB0aGlzLiRlbGVtZW50LmZpbmQoJy5jYXJvdXNlbC1pbmRpY2F0b3JzJylcbiAgICB0aGlzLm9wdGlvbnMgICAgID0gb3B0aW9uc1xuICAgIHRoaXMucGF1c2VkICAgICAgPSBudWxsXG4gICAgdGhpcy5zbGlkaW5nICAgICA9IG51bGxcbiAgICB0aGlzLmludGVydmFsICAgID0gbnVsbFxuICAgIHRoaXMuJGFjdGl2ZSAgICAgPSBudWxsXG4gICAgdGhpcy4kaXRlbXMgICAgICA9IG51bGxcblxuICAgIHRoaXMub3B0aW9ucy5rZXlib2FyZCAmJiB0aGlzLiRlbGVtZW50Lm9uKCdrZXlkb3duLmJzLmNhcm91c2VsJywgJC5wcm94eSh0aGlzLmtleWRvd24sIHRoaXMpKVxuXG4gICAgdGhpcy5vcHRpb25zLnBhdXNlID09ICdob3ZlcicgJiYgISgnb250b3VjaHN0YXJ0JyBpbiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQpICYmIHRoaXMuJGVsZW1lbnRcbiAgICAgIC5vbignbW91c2VlbnRlci5icy5jYXJvdXNlbCcsICQucHJveHkodGhpcy5wYXVzZSwgdGhpcykpXG4gICAgICAub24oJ21vdXNlbGVhdmUuYnMuY2Fyb3VzZWwnLCAkLnByb3h5KHRoaXMuY3ljbGUsIHRoaXMpKVxuICB9XG5cbiAgQ2Fyb3VzZWwuVkVSU0lPTiAgPSAnMy40LjEnXG5cbiAgQ2Fyb3VzZWwuVFJBTlNJVElPTl9EVVJBVElPTiA9IDYwMFxuXG4gIENhcm91c2VsLkRFRkFVTFRTID0ge1xuICAgIGludGVydmFsOiA1MDAwLFxuICAgIHBhdXNlOiAnaG92ZXInLFxuICAgIHdyYXA6IHRydWUsXG4gICAga2V5Ym9hcmQ6IHRydWVcbiAgfVxuXG4gIENhcm91c2VsLnByb3RvdHlwZS5rZXlkb3duID0gZnVuY3Rpb24gKGUpIHtcbiAgICBpZiAoL2lucHV0fHRleHRhcmVhL2kudGVzdChlLnRhcmdldC50YWdOYW1lKSkgcmV0dXJuXG4gICAgc3dpdGNoIChlLndoaWNoKSB7XG4gICAgICBjYXNlIDM3OiB0aGlzLnByZXYoKTsgYnJlYWtcbiAgICAgIGNhc2UgMzk6IHRoaXMubmV4dCgpOyBicmVha1xuICAgICAgZGVmYXVsdDogcmV0dXJuXG4gICAgfVxuXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gIH1cblxuICBDYXJvdXNlbC5wcm90b3R5cGUuY3ljbGUgPSBmdW5jdGlvbiAoZSkge1xuICAgIGUgfHwgKHRoaXMucGF1c2VkID0gZmFsc2UpXG5cbiAgICB0aGlzLmludGVydmFsICYmIGNsZWFySW50ZXJ2YWwodGhpcy5pbnRlcnZhbClcblxuICAgIHRoaXMub3B0aW9ucy5pbnRlcnZhbFxuICAgICAgJiYgIXRoaXMucGF1c2VkXG4gICAgICAmJiAodGhpcy5pbnRlcnZhbCA9IHNldEludGVydmFsKCQucHJveHkodGhpcy5uZXh0LCB0aGlzKSwgdGhpcy5vcHRpb25zLmludGVydmFsKSlcblxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICBDYXJvdXNlbC5wcm90b3R5cGUuZ2V0SXRlbUluZGV4ID0gZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICB0aGlzLiRpdGVtcyA9IGl0ZW0ucGFyZW50KCkuY2hpbGRyZW4oJy5pdGVtJylcbiAgICByZXR1cm4gdGhpcy4kaXRlbXMuaW5kZXgoaXRlbSB8fCB0aGlzLiRhY3RpdmUpXG4gIH1cblxuICBDYXJvdXNlbC5wcm90b3R5cGUuZ2V0SXRlbUZvckRpcmVjdGlvbiA9IGZ1bmN0aW9uIChkaXJlY3Rpb24sIGFjdGl2ZSkge1xuICAgIHZhciBhY3RpdmVJbmRleCA9IHRoaXMuZ2V0SXRlbUluZGV4KGFjdGl2ZSlcbiAgICB2YXIgd2lsbFdyYXAgPSAoZGlyZWN0aW9uID09ICdwcmV2JyAmJiBhY3RpdmVJbmRleCA9PT0gMClcbiAgICAgICAgICAgICAgICB8fCAoZGlyZWN0aW9uID09ICduZXh0JyAmJiBhY3RpdmVJbmRleCA9PSAodGhpcy4kaXRlbXMubGVuZ3RoIC0gMSkpXG4gICAgaWYgKHdpbGxXcmFwICYmICF0aGlzLm9wdGlvbnMud3JhcCkgcmV0dXJuIGFjdGl2ZVxuICAgIHZhciBkZWx0YSA9IGRpcmVjdGlvbiA9PSAncHJldicgPyAtMSA6IDFcbiAgICB2YXIgaXRlbUluZGV4ID0gKGFjdGl2ZUluZGV4ICsgZGVsdGEpICUgdGhpcy4kaXRlbXMubGVuZ3RoXG4gICAgcmV0dXJuIHRoaXMuJGl0ZW1zLmVxKGl0ZW1JbmRleClcbiAgfVxuXG4gIENhcm91c2VsLnByb3RvdHlwZS50byA9IGZ1bmN0aW9uIChwb3MpIHtcbiAgICB2YXIgdGhhdCAgICAgICAgPSB0aGlzXG4gICAgdmFyIGFjdGl2ZUluZGV4ID0gdGhpcy5nZXRJdGVtSW5kZXgodGhpcy4kYWN0aXZlID0gdGhpcy4kZWxlbWVudC5maW5kKCcuaXRlbS5hY3RpdmUnKSlcblxuICAgIGlmIChwb3MgPiAodGhpcy4kaXRlbXMubGVuZ3RoIC0gMSkgfHwgcG9zIDwgMCkgcmV0dXJuXG5cbiAgICBpZiAodGhpcy5zbGlkaW5nKSAgICAgICByZXR1cm4gdGhpcy4kZWxlbWVudC5vbmUoJ3NsaWQuYnMuY2Fyb3VzZWwnLCBmdW5jdGlvbiAoKSB7IHRoYXQudG8ocG9zKSB9KSAvLyB5ZXMsIFwic2xpZFwiXG4gICAgaWYgKGFjdGl2ZUluZGV4ID09IHBvcykgcmV0dXJuIHRoaXMucGF1c2UoKS5jeWNsZSgpXG5cbiAgICByZXR1cm4gdGhpcy5zbGlkZShwb3MgPiBhY3RpdmVJbmRleCA/ICduZXh0JyA6ICdwcmV2JywgdGhpcy4kaXRlbXMuZXEocG9zKSlcbiAgfVxuXG4gIENhcm91c2VsLnByb3RvdHlwZS5wYXVzZSA9IGZ1bmN0aW9uIChlKSB7XG4gICAgZSB8fCAodGhpcy5wYXVzZWQgPSB0cnVlKVxuXG4gICAgaWYgKHRoaXMuJGVsZW1lbnQuZmluZCgnLm5leHQsIC5wcmV2JykubGVuZ3RoICYmICQuc3VwcG9ydC50cmFuc2l0aW9uKSB7XG4gICAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJC5zdXBwb3J0LnRyYW5zaXRpb24uZW5kKVxuICAgICAgdGhpcy5jeWNsZSh0cnVlKVxuICAgIH1cblxuICAgIHRoaXMuaW50ZXJ2YWwgPSBjbGVhckludGVydmFsKHRoaXMuaW50ZXJ2YWwpXG5cbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgQ2Fyb3VzZWwucHJvdG90eXBlLm5leHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMuc2xpZGluZykgcmV0dXJuXG4gICAgcmV0dXJuIHRoaXMuc2xpZGUoJ25leHQnKVxuICB9XG5cbiAgQ2Fyb3VzZWwucHJvdG90eXBlLnByZXYgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMuc2xpZGluZykgcmV0dXJuXG4gICAgcmV0dXJuIHRoaXMuc2xpZGUoJ3ByZXYnKVxuICB9XG5cbiAgQ2Fyb3VzZWwucHJvdG90eXBlLnNsaWRlID0gZnVuY3Rpb24gKHR5cGUsIG5leHQpIHtcbiAgICB2YXIgJGFjdGl2ZSAgID0gdGhpcy4kZWxlbWVudC5maW5kKCcuaXRlbS5hY3RpdmUnKVxuICAgIHZhciAkbmV4dCAgICAgPSBuZXh0IHx8IHRoaXMuZ2V0SXRlbUZvckRpcmVjdGlvbih0eXBlLCAkYWN0aXZlKVxuICAgIHZhciBpc0N5Y2xpbmcgPSB0aGlzLmludGVydmFsXG4gICAgdmFyIGRpcmVjdGlvbiA9IHR5cGUgPT0gJ25leHQnID8gJ2xlZnQnIDogJ3JpZ2h0J1xuICAgIHZhciB0aGF0ICAgICAgPSB0aGlzXG5cbiAgICBpZiAoJG5leHQuaGFzQ2xhc3MoJ2FjdGl2ZScpKSByZXR1cm4gKHRoaXMuc2xpZGluZyA9IGZhbHNlKVxuXG4gICAgdmFyIHJlbGF0ZWRUYXJnZXQgPSAkbmV4dFswXVxuICAgIHZhciBzbGlkZUV2ZW50ID0gJC5FdmVudCgnc2xpZGUuYnMuY2Fyb3VzZWwnLCB7XG4gICAgICByZWxhdGVkVGFyZ2V0OiByZWxhdGVkVGFyZ2V0LFxuICAgICAgZGlyZWN0aW9uOiBkaXJlY3Rpb25cbiAgICB9KVxuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcihzbGlkZUV2ZW50KVxuICAgIGlmIChzbGlkZUV2ZW50LmlzRGVmYXVsdFByZXZlbnRlZCgpKSByZXR1cm5cblxuICAgIHRoaXMuc2xpZGluZyA9IHRydWVcblxuICAgIGlzQ3ljbGluZyAmJiB0aGlzLnBhdXNlKClcblxuICAgIGlmICh0aGlzLiRpbmRpY2F0b3JzLmxlbmd0aCkge1xuICAgICAgdGhpcy4kaW5kaWNhdG9ycy5maW5kKCcuYWN0aXZlJykucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpXG4gICAgICB2YXIgJG5leHRJbmRpY2F0b3IgPSAkKHRoaXMuJGluZGljYXRvcnMuY2hpbGRyZW4oKVt0aGlzLmdldEl0ZW1JbmRleCgkbmV4dCldKVxuICAgICAgJG5leHRJbmRpY2F0b3IgJiYgJG5leHRJbmRpY2F0b3IuYWRkQ2xhc3MoJ2FjdGl2ZScpXG4gICAgfVxuXG4gICAgdmFyIHNsaWRFdmVudCA9ICQuRXZlbnQoJ3NsaWQuYnMuY2Fyb3VzZWwnLCB7IHJlbGF0ZWRUYXJnZXQ6IHJlbGF0ZWRUYXJnZXQsIGRpcmVjdGlvbjogZGlyZWN0aW9uIH0pIC8vIHllcywgXCJzbGlkXCJcbiAgICBpZiAoJC5zdXBwb3J0LnRyYW5zaXRpb24gJiYgdGhpcy4kZWxlbWVudC5oYXNDbGFzcygnc2xpZGUnKSkge1xuICAgICAgJG5leHQuYWRkQ2xhc3ModHlwZSlcbiAgICAgIGlmICh0eXBlb2YgJG5leHQgPT09ICdvYmplY3QnICYmICRuZXh0Lmxlbmd0aCkge1xuICAgICAgICAkbmV4dFswXS5vZmZzZXRXaWR0aCAvLyBmb3JjZSByZWZsb3dcbiAgICAgIH1cbiAgICAgICRhY3RpdmUuYWRkQ2xhc3MoZGlyZWN0aW9uKVxuICAgICAgJG5leHQuYWRkQ2xhc3MoZGlyZWN0aW9uKVxuICAgICAgJGFjdGl2ZVxuICAgICAgICAub25lKCdic1RyYW5zaXRpb25FbmQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgJG5leHQucmVtb3ZlQ2xhc3MoW3R5cGUsIGRpcmVjdGlvbl0uam9pbignICcpKS5hZGRDbGFzcygnYWN0aXZlJylcbiAgICAgICAgICAkYWN0aXZlLnJlbW92ZUNsYXNzKFsnYWN0aXZlJywgZGlyZWN0aW9uXS5qb2luKCcgJykpXG4gICAgICAgICAgdGhhdC5zbGlkaW5nID0gZmFsc2VcbiAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoYXQuJGVsZW1lbnQudHJpZ2dlcihzbGlkRXZlbnQpXG4gICAgICAgICAgfSwgMClcbiAgICAgICAgfSlcbiAgICAgICAgLmVtdWxhdGVUcmFuc2l0aW9uRW5kKENhcm91c2VsLlRSQU5TSVRJT05fRFVSQVRJT04pXG4gICAgfSBlbHNlIHtcbiAgICAgICRhY3RpdmUucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpXG4gICAgICAkbmV4dC5hZGRDbGFzcygnYWN0aXZlJylcbiAgICAgIHRoaXMuc2xpZGluZyA9IGZhbHNlXG4gICAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoc2xpZEV2ZW50KVxuICAgIH1cblxuICAgIGlzQ3ljbGluZyAmJiB0aGlzLmN5Y2xlKClcblxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuXG4gIC8vIENBUk9VU0VMIFBMVUdJTiBERUZJTklUSU9OXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgZnVuY3Rpb24gUGx1Z2luKG9wdGlvbikge1xuICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgdmFyICR0aGlzICAgPSAkKHRoaXMpXG4gICAgICB2YXIgZGF0YSAgICA9ICR0aGlzLmRhdGEoJ2JzLmNhcm91c2VsJylcbiAgICAgIHZhciBvcHRpb25zID0gJC5leHRlbmQoe30sIENhcm91c2VsLkRFRkFVTFRTLCAkdGhpcy5kYXRhKCksIHR5cGVvZiBvcHRpb24gPT0gJ29iamVjdCcgJiYgb3B0aW9uKVxuICAgICAgdmFyIGFjdGlvbiAgPSB0eXBlb2Ygb3B0aW9uID09ICdzdHJpbmcnID8gb3B0aW9uIDogb3B0aW9ucy5zbGlkZVxuXG4gICAgICBpZiAoIWRhdGEpICR0aGlzLmRhdGEoJ2JzLmNhcm91c2VsJywgKGRhdGEgPSBuZXcgQ2Fyb3VzZWwodGhpcywgb3B0aW9ucykpKVxuICAgICAgaWYgKHR5cGVvZiBvcHRpb24gPT0gJ251bWJlcicpIGRhdGEudG8ob3B0aW9uKVxuICAgICAgZWxzZSBpZiAoYWN0aW9uKSBkYXRhW2FjdGlvbl0oKVxuICAgICAgZWxzZSBpZiAob3B0aW9ucy5pbnRlcnZhbCkgZGF0YS5wYXVzZSgpLmN5Y2xlKClcbiAgICB9KVxuICB9XG5cbiAgdmFyIG9sZCA9ICQuZm4uY2Fyb3VzZWxcblxuICAkLmZuLmNhcm91c2VsICAgICAgICAgICAgID0gUGx1Z2luXG4gICQuZm4uY2Fyb3VzZWwuQ29uc3RydWN0b3IgPSBDYXJvdXNlbFxuXG5cbiAgLy8gQ0FST1VTRUwgTk8gQ09ORkxJQ1RcbiAgLy8gPT09PT09PT09PT09PT09PT09PT1cblxuICAkLmZuLmNhcm91c2VsLm5vQ29uZmxpY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgJC5mbi5jYXJvdXNlbCA9IG9sZFxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuXG4gIC8vIENBUk9VU0VMIERBVEEtQVBJXG4gIC8vID09PT09PT09PT09PT09PT09XG5cbiAgdmFyIGNsaWNrSGFuZGxlciA9IGZ1bmN0aW9uIChlKSB7XG4gICAgdmFyICR0aGlzICAgPSAkKHRoaXMpXG4gICAgdmFyIGhyZWYgICAgPSAkdGhpcy5hdHRyKCdocmVmJylcbiAgICBpZiAoaHJlZikge1xuICAgICAgaHJlZiA9IGhyZWYucmVwbGFjZSgvLiooPz0jW15cXHNdKyQpLywgJycpIC8vIHN0cmlwIGZvciBpZTdcbiAgICB9XG5cbiAgICB2YXIgdGFyZ2V0ICA9ICR0aGlzLmF0dHIoJ2RhdGEtdGFyZ2V0JykgfHwgaHJlZlxuICAgIHZhciAkdGFyZ2V0ID0gJChkb2N1bWVudCkuZmluZCh0YXJnZXQpXG5cbiAgICBpZiAoISR0YXJnZXQuaGFzQ2xhc3MoJ2Nhcm91c2VsJykpIHJldHVyblxuXG4gICAgdmFyIG9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgJHRhcmdldC5kYXRhKCksICR0aGlzLmRhdGEoKSlcbiAgICB2YXIgc2xpZGVJbmRleCA9ICR0aGlzLmF0dHIoJ2RhdGEtc2xpZGUtdG8nKVxuICAgIGlmIChzbGlkZUluZGV4KSBvcHRpb25zLmludGVydmFsID0gZmFsc2VcblxuICAgIFBsdWdpbi5jYWxsKCR0YXJnZXQsIG9wdGlvbnMpXG5cbiAgICBpZiAoc2xpZGVJbmRleCkge1xuICAgICAgJHRhcmdldC5kYXRhKCdicy5jYXJvdXNlbCcpLnRvKHNsaWRlSW5kZXgpXG4gICAgfVxuXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gIH1cblxuICAkKGRvY3VtZW50KVxuICAgIC5vbignY2xpY2suYnMuY2Fyb3VzZWwuZGF0YS1hcGknLCAnW2RhdGEtc2xpZGVdJywgY2xpY2tIYW5kbGVyKVxuICAgIC5vbignY2xpY2suYnMuY2Fyb3VzZWwuZGF0YS1hcGknLCAnW2RhdGEtc2xpZGUtdG9dJywgY2xpY2tIYW5kbGVyKVxuXG4gICQod2luZG93KS5vbignbG9hZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAkKCdbZGF0YS1yaWRlPVwiY2Fyb3VzZWxcIl0nKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciAkY2Fyb3VzZWwgPSAkKHRoaXMpXG4gICAgICBQbHVnaW4uY2FsbCgkY2Fyb3VzZWwsICRjYXJvdXNlbC5kYXRhKCkpXG4gICAgfSlcbiAgfSlcblxufShqUXVlcnkpO1xuXG4vKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIEJvb3RzdHJhcDogY29sbGFwc2UuanMgdjMuNC4xXG4gKiBodHRwczovL2dldGJvb3RzdHJhcC5jb20vZG9jcy8zLjQvamF2YXNjcmlwdC8jY29sbGFwc2VcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogQ29weXJpZ2h0IDIwMTEtMjAxOSBUd2l0dGVyLCBJbmMuXG4gKiBMaWNlbnNlZCB1bmRlciBNSVQgKGh0dHBzOi8vZ2l0aHViLmNvbS90d2JzL2Jvb3RzdHJhcC9ibG9iL21hc3Rlci9MSUNFTlNFKVxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovXG5cbi8qIGpzaGludCBsYXRlZGVmOiBmYWxzZSAqL1xuXG4rZnVuY3Rpb24gKCQpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIC8vIENPTExBUFNFIFBVQkxJQyBDTEFTUyBERUZJTklUSU9OXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgdmFyIENvbGxhcHNlID0gZnVuY3Rpb24gKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLiRlbGVtZW50ICAgICAgPSAkKGVsZW1lbnQpXG4gICAgdGhpcy5vcHRpb25zICAgICAgID0gJC5leHRlbmQoe30sIENvbGxhcHNlLkRFRkFVTFRTLCBvcHRpb25zKVxuICAgIHRoaXMuJHRyaWdnZXIgICAgICA9ICQoJ1tkYXRhLXRvZ2dsZT1cImNvbGxhcHNlXCJdW2hyZWY9XCIjJyArIGVsZW1lbnQuaWQgKyAnXCJdLCcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgJ1tkYXRhLXRvZ2dsZT1cImNvbGxhcHNlXCJdW2RhdGEtdGFyZ2V0PVwiIycgKyBlbGVtZW50LmlkICsgJ1wiXScpXG4gICAgdGhpcy50cmFuc2l0aW9uaW5nID0gbnVsbFxuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5wYXJlbnQpIHtcbiAgICAgIHRoaXMuJHBhcmVudCA9IHRoaXMuZ2V0UGFyZW50KClcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5hZGRBcmlhQW5kQ29sbGFwc2VkQ2xhc3ModGhpcy4kZWxlbWVudCwgdGhpcy4kdHJpZ2dlcilcbiAgICB9XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLnRvZ2dsZSkgdGhpcy50b2dnbGUoKVxuICB9XG5cbiAgQ29sbGFwc2UuVkVSU0lPTiAgPSAnMy40LjEnXG5cbiAgQ29sbGFwc2UuVFJBTlNJVElPTl9EVVJBVElPTiA9IDM1MFxuXG4gIENvbGxhcHNlLkRFRkFVTFRTID0ge1xuICAgIHRvZ2dsZTogdHJ1ZVxuICB9XG5cbiAgQ29sbGFwc2UucHJvdG90eXBlLmRpbWVuc2lvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgaGFzV2lkdGggPSB0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKCd3aWR0aCcpXG4gICAgcmV0dXJuIGhhc1dpZHRoID8gJ3dpZHRoJyA6ICdoZWlnaHQnXG4gIH1cblxuICBDb2xsYXBzZS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy50cmFuc2l0aW9uaW5nIHx8IHRoaXMuJGVsZW1lbnQuaGFzQ2xhc3MoJ2luJykpIHJldHVyblxuXG4gICAgdmFyIGFjdGl2ZXNEYXRhXG4gICAgdmFyIGFjdGl2ZXMgPSB0aGlzLiRwYXJlbnQgJiYgdGhpcy4kcGFyZW50LmNoaWxkcmVuKCcucGFuZWwnKS5jaGlsZHJlbignLmluLCAuY29sbGFwc2luZycpXG5cbiAgICBpZiAoYWN0aXZlcyAmJiBhY3RpdmVzLmxlbmd0aCkge1xuICAgICAgYWN0aXZlc0RhdGEgPSBhY3RpdmVzLmRhdGEoJ2JzLmNvbGxhcHNlJylcbiAgICAgIGlmIChhY3RpdmVzRGF0YSAmJiBhY3RpdmVzRGF0YS50cmFuc2l0aW9uaW5nKSByZXR1cm5cbiAgICB9XG5cbiAgICB2YXIgc3RhcnRFdmVudCA9ICQuRXZlbnQoJ3Nob3cuYnMuY29sbGFwc2UnKVxuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcihzdGFydEV2ZW50KVxuICAgIGlmIChzdGFydEV2ZW50LmlzRGVmYXVsdFByZXZlbnRlZCgpKSByZXR1cm5cblxuICAgIGlmIChhY3RpdmVzICYmIGFjdGl2ZXMubGVuZ3RoKSB7XG4gICAgICBQbHVnaW4uY2FsbChhY3RpdmVzLCAnaGlkZScpXG4gICAgICBhY3RpdmVzRGF0YSB8fCBhY3RpdmVzLmRhdGEoJ2JzLmNvbGxhcHNlJywgbnVsbClcbiAgICB9XG5cbiAgICB2YXIgZGltZW5zaW9uID0gdGhpcy5kaW1lbnNpb24oKVxuXG4gICAgdGhpcy4kZWxlbWVudFxuICAgICAgLnJlbW92ZUNsYXNzKCdjb2xsYXBzZScpXG4gICAgICAuYWRkQ2xhc3MoJ2NvbGxhcHNpbmcnKVtkaW1lbnNpb25dKDApXG4gICAgICAuYXR0cignYXJpYS1leHBhbmRlZCcsIHRydWUpXG5cbiAgICB0aGlzLiR0cmlnZ2VyXG4gICAgICAucmVtb3ZlQ2xhc3MoJ2NvbGxhcHNlZCcpXG4gICAgICAuYXR0cignYXJpYS1leHBhbmRlZCcsIHRydWUpXG5cbiAgICB0aGlzLnRyYW5zaXRpb25pbmcgPSAxXG5cbiAgICB2YXIgY29tcGxldGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLiRlbGVtZW50XG4gICAgICAgIC5yZW1vdmVDbGFzcygnY29sbGFwc2luZycpXG4gICAgICAgIC5hZGRDbGFzcygnY29sbGFwc2UgaW4nKVtkaW1lbnNpb25dKCcnKVxuICAgICAgdGhpcy50cmFuc2l0aW9uaW5nID0gMFxuICAgICAgdGhpcy4kZWxlbWVudFxuICAgICAgICAudHJpZ2dlcignc2hvd24uYnMuY29sbGFwc2UnKVxuICAgIH1cblxuICAgIGlmICghJC5zdXBwb3J0LnRyYW5zaXRpb24pIHJldHVybiBjb21wbGV0ZS5jYWxsKHRoaXMpXG5cbiAgICB2YXIgc2Nyb2xsU2l6ZSA9ICQuY2FtZWxDYXNlKFsnc2Nyb2xsJywgZGltZW5zaW9uXS5qb2luKCctJykpXG5cbiAgICB0aGlzLiRlbGVtZW50XG4gICAgICAub25lKCdic1RyYW5zaXRpb25FbmQnLCAkLnByb3h5KGNvbXBsZXRlLCB0aGlzKSlcbiAgICAgIC5lbXVsYXRlVHJhbnNpdGlvbkVuZChDb2xsYXBzZS5UUkFOU0lUSU9OX0RVUkFUSU9OKVtkaW1lbnNpb25dKHRoaXMuJGVsZW1lbnRbMF1bc2Nyb2xsU2l6ZV0pXG4gIH1cblxuICBDb2xsYXBzZS5wcm90b3R5cGUuaGlkZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy50cmFuc2l0aW9uaW5nIHx8ICF0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKCdpbicpKSByZXR1cm5cblxuICAgIHZhciBzdGFydEV2ZW50ID0gJC5FdmVudCgnaGlkZS5icy5jb2xsYXBzZScpXG4gICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKHN0YXJ0RXZlbnQpXG4gICAgaWYgKHN0YXJ0RXZlbnQuaXNEZWZhdWx0UHJldmVudGVkKCkpIHJldHVyblxuXG4gICAgdmFyIGRpbWVuc2lvbiA9IHRoaXMuZGltZW5zaW9uKClcblxuICAgIHRoaXMuJGVsZW1lbnRbZGltZW5zaW9uXSh0aGlzLiRlbGVtZW50W2RpbWVuc2lvbl0oKSlbMF0ub2Zmc2V0SGVpZ2h0XG5cbiAgICB0aGlzLiRlbGVtZW50XG4gICAgICAuYWRkQ2xhc3MoJ2NvbGxhcHNpbmcnKVxuICAgICAgLnJlbW92ZUNsYXNzKCdjb2xsYXBzZSBpbicpXG4gICAgICAuYXR0cignYXJpYS1leHBhbmRlZCcsIGZhbHNlKVxuXG4gICAgdGhpcy4kdHJpZ2dlclxuICAgICAgLmFkZENsYXNzKCdjb2xsYXBzZWQnKVxuICAgICAgLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCBmYWxzZSlcblxuICAgIHRoaXMudHJhbnNpdGlvbmluZyA9IDFcblxuICAgIHZhciBjb21wbGV0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMudHJhbnNpdGlvbmluZyA9IDBcbiAgICAgIHRoaXMuJGVsZW1lbnRcbiAgICAgICAgLnJlbW92ZUNsYXNzKCdjb2xsYXBzaW5nJylcbiAgICAgICAgLmFkZENsYXNzKCdjb2xsYXBzZScpXG4gICAgICAgIC50cmlnZ2VyKCdoaWRkZW4uYnMuY29sbGFwc2UnKVxuICAgIH1cblxuICAgIGlmICghJC5zdXBwb3J0LnRyYW5zaXRpb24pIHJldHVybiBjb21wbGV0ZS5jYWxsKHRoaXMpXG5cbiAgICB0aGlzLiRlbGVtZW50XG4gICAgICBbZGltZW5zaW9uXSgwKVxuICAgICAgLm9uZSgnYnNUcmFuc2l0aW9uRW5kJywgJC5wcm94eShjb21wbGV0ZSwgdGhpcykpXG4gICAgICAuZW11bGF0ZVRyYW5zaXRpb25FbmQoQ29sbGFwc2UuVFJBTlNJVElPTl9EVVJBVElPTilcbiAgfVxuXG4gIENvbGxhcHNlLnByb3RvdHlwZS50b2dnbGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpc1t0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKCdpbicpID8gJ2hpZGUnIDogJ3Nob3cnXSgpXG4gIH1cblxuICBDb2xsYXBzZS5wcm90b3R5cGUuZ2V0UGFyZW50ID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAkKGRvY3VtZW50KS5maW5kKHRoaXMub3B0aW9ucy5wYXJlbnQpXG4gICAgICAuZmluZCgnW2RhdGEtdG9nZ2xlPVwiY29sbGFwc2VcIl1bZGF0YS1wYXJlbnQ9XCInICsgdGhpcy5vcHRpb25zLnBhcmVudCArICdcIl0nKVxuICAgICAgLmVhY2goJC5wcm94eShmdW5jdGlvbiAoaSwgZWxlbWVudCkge1xuICAgICAgICB2YXIgJGVsZW1lbnQgPSAkKGVsZW1lbnQpXG4gICAgICAgIHRoaXMuYWRkQXJpYUFuZENvbGxhcHNlZENsYXNzKGdldFRhcmdldEZyb21UcmlnZ2VyKCRlbGVtZW50KSwgJGVsZW1lbnQpXG4gICAgICB9LCB0aGlzKSlcbiAgICAgIC5lbmQoKVxuICB9XG5cbiAgQ29sbGFwc2UucHJvdG90eXBlLmFkZEFyaWFBbmRDb2xsYXBzZWRDbGFzcyA9IGZ1bmN0aW9uICgkZWxlbWVudCwgJHRyaWdnZXIpIHtcbiAgICB2YXIgaXNPcGVuID0gJGVsZW1lbnQuaGFzQ2xhc3MoJ2luJylcblxuICAgICRlbGVtZW50LmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCBpc09wZW4pXG4gICAgJHRyaWdnZXJcbiAgICAgIC50b2dnbGVDbGFzcygnY29sbGFwc2VkJywgIWlzT3BlbilcbiAgICAgIC5hdHRyKCdhcmlhLWV4cGFuZGVkJywgaXNPcGVuKVxuICB9XG5cbiAgZnVuY3Rpb24gZ2V0VGFyZ2V0RnJvbVRyaWdnZXIoJHRyaWdnZXIpIHtcbiAgICB2YXIgaHJlZlxuICAgIHZhciB0YXJnZXQgPSAkdHJpZ2dlci5hdHRyKCdkYXRhLXRhcmdldCcpXG4gICAgICB8fCAoaHJlZiA9ICR0cmlnZ2VyLmF0dHIoJ2hyZWYnKSkgJiYgaHJlZi5yZXBsYWNlKC8uKig/PSNbXlxcc10rJCkvLCAnJykgLy8gc3RyaXAgZm9yIGllN1xuXG4gICAgcmV0dXJuICQoZG9jdW1lbnQpLmZpbmQodGFyZ2V0KVxuICB9XG5cblxuICAvLyBDT0xMQVBTRSBQTFVHSU4gREVGSU5JVElPTlxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gIGZ1bmN0aW9uIFBsdWdpbihvcHRpb24pIHtcbiAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciAkdGhpcyAgID0gJCh0aGlzKVxuICAgICAgdmFyIGRhdGEgICAgPSAkdGhpcy5kYXRhKCdicy5jb2xsYXBzZScpXG4gICAgICB2YXIgb3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBDb2xsYXBzZS5ERUZBVUxUUywgJHRoaXMuZGF0YSgpLCB0eXBlb2Ygb3B0aW9uID09ICdvYmplY3QnICYmIG9wdGlvbilcblxuICAgICAgaWYgKCFkYXRhICYmIG9wdGlvbnMudG9nZ2xlICYmIC9zaG93fGhpZGUvLnRlc3Qob3B0aW9uKSkgb3B0aW9ucy50b2dnbGUgPSBmYWxzZVxuICAgICAgaWYgKCFkYXRhKSAkdGhpcy5kYXRhKCdicy5jb2xsYXBzZScsIChkYXRhID0gbmV3IENvbGxhcHNlKHRoaXMsIG9wdGlvbnMpKSlcbiAgICAgIGlmICh0eXBlb2Ygb3B0aW9uID09ICdzdHJpbmcnKSBkYXRhW29wdGlvbl0oKVxuICAgIH0pXG4gIH1cblxuICB2YXIgb2xkID0gJC5mbi5jb2xsYXBzZVxuXG4gICQuZm4uY29sbGFwc2UgICAgICAgICAgICAgPSBQbHVnaW5cbiAgJC5mbi5jb2xsYXBzZS5Db25zdHJ1Y3RvciA9IENvbGxhcHNlXG5cblxuICAvLyBDT0xMQVBTRSBOTyBDT05GTElDVFxuICAvLyA9PT09PT09PT09PT09PT09PT09PVxuXG4gICQuZm4uY29sbGFwc2Uubm9Db25mbGljdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAkLmZuLmNvbGxhcHNlID0gb2xkXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG5cbiAgLy8gQ09MTEFQU0UgREFUQS1BUElcbiAgLy8gPT09PT09PT09PT09PT09PT1cblxuICAkKGRvY3VtZW50KS5vbignY2xpY2suYnMuY29sbGFwc2UuZGF0YS1hcGknLCAnW2RhdGEtdG9nZ2xlPVwiY29sbGFwc2VcIl0nLCBmdW5jdGlvbiAoZSkge1xuICAgIHZhciAkdGhpcyAgID0gJCh0aGlzKVxuXG4gICAgaWYgKCEkdGhpcy5hdHRyKCdkYXRhLXRhcmdldCcpKSBlLnByZXZlbnREZWZhdWx0KClcblxuICAgIHZhciAkdGFyZ2V0ID0gZ2V0VGFyZ2V0RnJvbVRyaWdnZXIoJHRoaXMpXG4gICAgdmFyIGRhdGEgICAgPSAkdGFyZ2V0LmRhdGEoJ2JzLmNvbGxhcHNlJylcbiAgICB2YXIgb3B0aW9uICA9IGRhdGEgPyAndG9nZ2xlJyA6ICR0aGlzLmRhdGEoKVxuXG4gICAgUGx1Z2luLmNhbGwoJHRhcmdldCwgb3B0aW9uKVxuICB9KVxuXG59KGpRdWVyeSk7XG5cbi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogQm9vdHN0cmFwOiBkcm9wZG93bi5qcyB2My40LjFcbiAqIGh0dHBzOi8vZ2V0Ym9vdHN0cmFwLmNvbS9kb2NzLzMuNC9qYXZhc2NyaXB0LyNkcm9wZG93bnNcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogQ29weXJpZ2h0IDIwMTEtMjAxOSBUd2l0dGVyLCBJbmMuXG4gKiBMaWNlbnNlZCB1bmRlciBNSVQgKGh0dHBzOi8vZ2l0aHViLmNvbS90d2JzL2Jvb3RzdHJhcC9ibG9iL21hc3Rlci9MSUNFTlNFKVxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovXG5cblxuK2Z1bmN0aW9uICgkKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICAvLyBEUk9QRE9XTiBDTEFTUyBERUZJTklUSU9OXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICB2YXIgYmFja2Ryb3AgPSAnLmRyb3Bkb3duLWJhY2tkcm9wJ1xuICB2YXIgdG9nZ2xlICAgPSAnW2RhdGEtdG9nZ2xlPVwiZHJvcGRvd25cIl0nXG4gIHZhciBEcm9wZG93biA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgJChlbGVtZW50KS5vbignY2xpY2suYnMuZHJvcGRvd24nLCB0aGlzLnRvZ2dsZSlcbiAgfVxuXG4gIERyb3Bkb3duLlZFUlNJT04gPSAnMy40LjEnXG5cbiAgZnVuY3Rpb24gZ2V0UGFyZW50KCR0aGlzKSB7XG4gICAgdmFyIHNlbGVjdG9yID0gJHRoaXMuYXR0cignZGF0YS10YXJnZXQnKVxuXG4gICAgaWYgKCFzZWxlY3Rvcikge1xuICAgICAgc2VsZWN0b3IgPSAkdGhpcy5hdHRyKCdocmVmJylcbiAgICAgIHNlbGVjdG9yID0gc2VsZWN0b3IgJiYgLyNbQS1aYS16XS8udGVzdChzZWxlY3RvcikgJiYgc2VsZWN0b3IucmVwbGFjZSgvLiooPz0jW15cXHNdKiQpLywgJycpIC8vIHN0cmlwIGZvciBpZTdcbiAgICB9XG5cbiAgICB2YXIgJHBhcmVudCA9IHNlbGVjdG9yICE9PSAnIycgPyAkKGRvY3VtZW50KS5maW5kKHNlbGVjdG9yKSA6IG51bGxcblxuICAgIHJldHVybiAkcGFyZW50ICYmICRwYXJlbnQubGVuZ3RoID8gJHBhcmVudCA6ICR0aGlzLnBhcmVudCgpXG4gIH1cblxuICBmdW5jdGlvbiBjbGVhck1lbnVzKGUpIHtcbiAgICBpZiAoZSAmJiBlLndoaWNoID09PSAzKSByZXR1cm5cbiAgICAkKGJhY2tkcm9wKS5yZW1vdmUoKVxuICAgICQodG9nZ2xlKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciAkdGhpcyAgICAgICAgID0gJCh0aGlzKVxuICAgICAgdmFyICRwYXJlbnQgICAgICAgPSBnZXRQYXJlbnQoJHRoaXMpXG4gICAgICB2YXIgcmVsYXRlZFRhcmdldCA9IHsgcmVsYXRlZFRhcmdldDogdGhpcyB9XG5cbiAgICAgIGlmICghJHBhcmVudC5oYXNDbGFzcygnb3BlbicpKSByZXR1cm5cblxuICAgICAgaWYgKGUgJiYgZS50eXBlID09ICdjbGljaycgJiYgL2lucHV0fHRleHRhcmVhL2kudGVzdChlLnRhcmdldC50YWdOYW1lKSAmJiAkLmNvbnRhaW5zKCRwYXJlbnRbMF0sIGUudGFyZ2V0KSkgcmV0dXJuXG5cbiAgICAgICRwYXJlbnQudHJpZ2dlcihlID0gJC5FdmVudCgnaGlkZS5icy5kcm9wZG93bicsIHJlbGF0ZWRUYXJnZXQpKVxuXG4gICAgICBpZiAoZS5pc0RlZmF1bHRQcmV2ZW50ZWQoKSkgcmV0dXJuXG5cbiAgICAgICR0aGlzLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCAnZmFsc2UnKVxuICAgICAgJHBhcmVudC5yZW1vdmVDbGFzcygnb3BlbicpLnRyaWdnZXIoJC5FdmVudCgnaGlkZGVuLmJzLmRyb3Bkb3duJywgcmVsYXRlZFRhcmdldCkpXG4gICAgfSlcbiAgfVxuXG4gIERyb3Bkb3duLnByb3RvdHlwZS50b2dnbGUgPSBmdW5jdGlvbiAoZSkge1xuICAgIHZhciAkdGhpcyA9ICQodGhpcylcblxuICAgIGlmICgkdGhpcy5pcygnLmRpc2FibGVkLCA6ZGlzYWJsZWQnKSkgcmV0dXJuXG5cbiAgICB2YXIgJHBhcmVudCAgPSBnZXRQYXJlbnQoJHRoaXMpXG4gICAgdmFyIGlzQWN0aXZlID0gJHBhcmVudC5oYXNDbGFzcygnb3BlbicpXG5cbiAgICBjbGVhck1lbnVzKClcblxuICAgIGlmICghaXNBY3RpdmUpIHtcbiAgICAgIGlmICgnb250b3VjaHN0YXJ0JyBpbiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgJiYgISRwYXJlbnQuY2xvc2VzdCgnLm5hdmJhci1uYXYnKS5sZW5ndGgpIHtcbiAgICAgICAgLy8gaWYgbW9iaWxlIHdlIHVzZSBhIGJhY2tkcm9wIGJlY2F1c2UgY2xpY2sgZXZlbnRzIGRvbid0IGRlbGVnYXRlXG4gICAgICAgICQoZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JykpXG4gICAgICAgICAgLmFkZENsYXNzKCdkcm9wZG93bi1iYWNrZHJvcCcpXG4gICAgICAgICAgLmluc2VydEFmdGVyKCQodGhpcykpXG4gICAgICAgICAgLm9uKCdjbGljaycsIGNsZWFyTWVudXMpXG4gICAgICB9XG5cbiAgICAgIHZhciByZWxhdGVkVGFyZ2V0ID0geyByZWxhdGVkVGFyZ2V0OiB0aGlzIH1cbiAgICAgICRwYXJlbnQudHJpZ2dlcihlID0gJC5FdmVudCgnc2hvdy5icy5kcm9wZG93bicsIHJlbGF0ZWRUYXJnZXQpKVxuXG4gICAgICBpZiAoZS5pc0RlZmF1bHRQcmV2ZW50ZWQoKSkgcmV0dXJuXG5cbiAgICAgICR0aGlzXG4gICAgICAgIC50cmlnZ2VyKCdmb2N1cycpXG4gICAgICAgIC5hdHRyKCdhcmlhLWV4cGFuZGVkJywgJ3RydWUnKVxuXG4gICAgICAkcGFyZW50XG4gICAgICAgIC50b2dnbGVDbGFzcygnb3BlbicpXG4gICAgICAgIC50cmlnZ2VyKCQuRXZlbnQoJ3Nob3duLmJzLmRyb3Bkb3duJywgcmVsYXRlZFRhcmdldCkpXG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICBEcm9wZG93bi5wcm90b3R5cGUua2V5ZG93biA9IGZ1bmN0aW9uIChlKSB7XG4gICAgaWYgKCEvKDM4fDQwfDI3fDMyKS8udGVzdChlLndoaWNoKSB8fCAvaW5wdXR8dGV4dGFyZWEvaS50ZXN0KGUudGFyZ2V0LnRhZ05hbWUpKSByZXR1cm5cblxuICAgIHZhciAkdGhpcyA9ICQodGhpcylcblxuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcblxuICAgIGlmICgkdGhpcy5pcygnLmRpc2FibGVkLCA6ZGlzYWJsZWQnKSkgcmV0dXJuXG5cbiAgICB2YXIgJHBhcmVudCAgPSBnZXRQYXJlbnQoJHRoaXMpXG4gICAgdmFyIGlzQWN0aXZlID0gJHBhcmVudC5oYXNDbGFzcygnb3BlbicpXG5cbiAgICBpZiAoIWlzQWN0aXZlICYmIGUud2hpY2ggIT0gMjcgfHwgaXNBY3RpdmUgJiYgZS53aGljaCA9PSAyNykge1xuICAgICAgaWYgKGUud2hpY2ggPT0gMjcpICRwYXJlbnQuZmluZCh0b2dnbGUpLnRyaWdnZXIoJ2ZvY3VzJylcbiAgICAgIHJldHVybiAkdGhpcy50cmlnZ2VyKCdjbGljaycpXG4gICAgfVxuXG4gICAgdmFyIGRlc2MgPSAnIGxpOm5vdCguZGlzYWJsZWQpOnZpc2libGUgYSdcbiAgICB2YXIgJGl0ZW1zID0gJHBhcmVudC5maW5kKCcuZHJvcGRvd24tbWVudScgKyBkZXNjKVxuXG4gICAgaWYgKCEkaXRlbXMubGVuZ3RoKSByZXR1cm5cblxuICAgIHZhciBpbmRleCA9ICRpdGVtcy5pbmRleChlLnRhcmdldClcblxuICAgIGlmIChlLndoaWNoID09IDM4ICYmIGluZGV4ID4gMCkgICAgICAgICAgICAgICAgIGluZGV4LS0gICAgICAgICAvLyB1cFxuICAgIGlmIChlLndoaWNoID09IDQwICYmIGluZGV4IDwgJGl0ZW1zLmxlbmd0aCAtIDEpIGluZGV4KysgICAgICAgICAvLyBkb3duXG4gICAgaWYgKCF+aW5kZXgpICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXggPSAwXG5cbiAgICAkaXRlbXMuZXEoaW5kZXgpLnRyaWdnZXIoJ2ZvY3VzJylcbiAgfVxuXG5cbiAgLy8gRFJPUERPV04gUExVR0lOIERFRklOSVRJT05cbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICBmdW5jdGlvbiBQbHVnaW4ob3B0aW9uKSB7XG4gICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgJHRoaXMgPSAkKHRoaXMpXG4gICAgICB2YXIgZGF0YSAgPSAkdGhpcy5kYXRhKCdicy5kcm9wZG93bicpXG5cbiAgICAgIGlmICghZGF0YSkgJHRoaXMuZGF0YSgnYnMuZHJvcGRvd24nLCAoZGF0YSA9IG5ldyBEcm9wZG93bih0aGlzKSkpXG4gICAgICBpZiAodHlwZW9mIG9wdGlvbiA9PSAnc3RyaW5nJykgZGF0YVtvcHRpb25dLmNhbGwoJHRoaXMpXG4gICAgfSlcbiAgfVxuXG4gIHZhciBvbGQgPSAkLmZuLmRyb3Bkb3duXG5cbiAgJC5mbi5kcm9wZG93biAgICAgICAgICAgICA9IFBsdWdpblxuICAkLmZuLmRyb3Bkb3duLkNvbnN0cnVjdG9yID0gRHJvcGRvd25cblxuXG4gIC8vIERST1BET1dOIE5PIENPTkZMSUNUXG4gIC8vID09PT09PT09PT09PT09PT09PT09XG5cbiAgJC5mbi5kcm9wZG93bi5ub0NvbmZsaWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICQuZm4uZHJvcGRvd24gPSBvbGRcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cblxuICAvLyBBUFBMWSBUTyBTVEFOREFSRCBEUk9QRE9XTiBFTEVNRU5UU1xuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gICQoZG9jdW1lbnQpXG4gICAgLm9uKCdjbGljay5icy5kcm9wZG93bi5kYXRhLWFwaScsIGNsZWFyTWVudXMpXG4gICAgLm9uKCdjbGljay5icy5kcm9wZG93bi5kYXRhLWFwaScsICcuZHJvcGRvd24gZm9ybScsIGZ1bmN0aW9uIChlKSB7IGUuc3RvcFByb3BhZ2F0aW9uKCkgfSlcbiAgICAub24oJ2NsaWNrLmJzLmRyb3Bkb3duLmRhdGEtYXBpJywgdG9nZ2xlLCBEcm9wZG93bi5wcm90b3R5cGUudG9nZ2xlKVxuICAgIC5vbigna2V5ZG93bi5icy5kcm9wZG93bi5kYXRhLWFwaScsIHRvZ2dsZSwgRHJvcGRvd24ucHJvdG90eXBlLmtleWRvd24pXG4gICAgLm9uKCdrZXlkb3duLmJzLmRyb3Bkb3duLmRhdGEtYXBpJywgJy5kcm9wZG93bi1tZW51JywgRHJvcGRvd24ucHJvdG90eXBlLmtleWRvd24pXG5cbn0oalF1ZXJ5KTtcblxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBCb290c3RyYXA6IG1vZGFsLmpzIHYzLjQuMVxuICogaHR0cHM6Ly9nZXRib290c3RyYXAuY29tL2RvY3MvMy40L2phdmFzY3JpcHQvI21vZGFsc1xuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBDb3B5cmlnaHQgMjAxMS0yMDE5IFR3aXR0ZXIsIEluYy5cbiAqIExpY2Vuc2VkIHVuZGVyIE1JVCAoaHR0cHM6Ly9naXRodWIuY29tL3R3YnMvYm9vdHN0cmFwL2Jsb2IvbWFzdGVyL0xJQ0VOU0UpXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi9cblxuXG4rZnVuY3Rpb24gKCQpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIC8vIE1PREFMIENMQVNTIERFRklOSVRJT05cbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PVxuXG4gIHZhciBNb2RhbCA9IGZ1bmN0aW9uIChlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9uc1xuICAgIHRoaXMuJGJvZHkgPSAkKGRvY3VtZW50LmJvZHkpXG4gICAgdGhpcy4kZWxlbWVudCA9ICQoZWxlbWVudClcbiAgICB0aGlzLiRkaWFsb2cgPSB0aGlzLiRlbGVtZW50LmZpbmQoJy5tb2RhbC1kaWFsb2cnKVxuICAgIHRoaXMuJGJhY2tkcm9wID0gbnVsbFxuICAgIHRoaXMuaXNTaG93biA9IG51bGxcbiAgICB0aGlzLm9yaWdpbmFsQm9keVBhZCA9IG51bGxcbiAgICB0aGlzLnNjcm9sbGJhcldpZHRoID0gMFxuICAgIHRoaXMuaWdub3JlQmFja2Ryb3BDbGljayA9IGZhbHNlXG4gICAgdGhpcy5maXhlZENvbnRlbnQgPSAnLm5hdmJhci1maXhlZC10b3AsIC5uYXZiYXItZml4ZWQtYm90dG9tJ1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5yZW1vdGUpIHtcbiAgICAgIHRoaXMuJGVsZW1lbnRcbiAgICAgICAgLmZpbmQoJy5tb2RhbC1jb250ZW50JylcbiAgICAgICAgLmxvYWQodGhpcy5vcHRpb25zLnJlbW90ZSwgJC5wcm94eShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdsb2FkZWQuYnMubW9kYWwnKVxuICAgICAgICB9LCB0aGlzKSlcbiAgICB9XG4gIH1cblxuICBNb2RhbC5WRVJTSU9OID0gJzMuNC4xJ1xuXG4gIE1vZGFsLlRSQU5TSVRJT05fRFVSQVRJT04gPSAzMDBcbiAgTW9kYWwuQkFDS0RST1BfVFJBTlNJVElPTl9EVVJBVElPTiA9IDE1MFxuXG4gIE1vZGFsLkRFRkFVTFRTID0ge1xuICAgIGJhY2tkcm9wOiB0cnVlLFxuICAgIGtleWJvYXJkOiB0cnVlLFxuICAgIHNob3c6IHRydWVcbiAgfVxuXG4gIE1vZGFsLnByb3RvdHlwZS50b2dnbGUgPSBmdW5jdGlvbiAoX3JlbGF0ZWRUYXJnZXQpIHtcbiAgICByZXR1cm4gdGhpcy5pc1Nob3duID8gdGhpcy5oaWRlKCkgOiB0aGlzLnNob3coX3JlbGF0ZWRUYXJnZXQpXG4gIH1cblxuICBNb2RhbC5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIChfcmVsYXRlZFRhcmdldCkge1xuICAgIHZhciB0aGF0ID0gdGhpc1xuICAgIHZhciBlID0gJC5FdmVudCgnc2hvdy5icy5tb2RhbCcsIHsgcmVsYXRlZFRhcmdldDogX3JlbGF0ZWRUYXJnZXQgfSlcblxuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcihlKVxuXG4gICAgaWYgKHRoaXMuaXNTaG93biB8fCBlLmlzRGVmYXVsdFByZXZlbnRlZCgpKSByZXR1cm5cblxuICAgIHRoaXMuaXNTaG93biA9IHRydWVcblxuICAgIHRoaXMuY2hlY2tTY3JvbGxiYXIoKVxuICAgIHRoaXMuc2V0U2Nyb2xsYmFyKClcbiAgICB0aGlzLiRib2R5LmFkZENsYXNzKCdtb2RhbC1vcGVuJylcblxuICAgIHRoaXMuZXNjYXBlKClcbiAgICB0aGlzLnJlc2l6ZSgpXG5cbiAgICB0aGlzLiRlbGVtZW50Lm9uKCdjbGljay5kaXNtaXNzLmJzLm1vZGFsJywgJ1tkYXRhLWRpc21pc3M9XCJtb2RhbFwiXScsICQucHJveHkodGhpcy5oaWRlLCB0aGlzKSlcblxuICAgIHRoaXMuJGRpYWxvZy5vbignbW91c2Vkb3duLmRpc21pc3MuYnMubW9kYWwnLCBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGF0LiRlbGVtZW50Lm9uZSgnbW91c2V1cC5kaXNtaXNzLmJzLm1vZGFsJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgaWYgKCQoZS50YXJnZXQpLmlzKHRoYXQuJGVsZW1lbnQpKSB0aGF0Lmlnbm9yZUJhY2tkcm9wQ2xpY2sgPSB0cnVlXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICB0aGlzLmJhY2tkcm9wKGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciB0cmFuc2l0aW9uID0gJC5zdXBwb3J0LnRyYW5zaXRpb24gJiYgdGhhdC4kZWxlbWVudC5oYXNDbGFzcygnZmFkZScpXG5cbiAgICAgIGlmICghdGhhdC4kZWxlbWVudC5wYXJlbnQoKS5sZW5ndGgpIHtcbiAgICAgICAgdGhhdC4kZWxlbWVudC5hcHBlbmRUbyh0aGF0LiRib2R5KSAvLyBkb24ndCBtb3ZlIG1vZGFscyBkb20gcG9zaXRpb25cbiAgICAgIH1cblxuICAgICAgdGhhdC4kZWxlbWVudFxuICAgICAgICAuc2hvdygpXG4gICAgICAgIC5zY3JvbGxUb3AoMClcblxuICAgICAgdGhhdC5hZGp1c3REaWFsb2coKVxuXG4gICAgICBpZiAodHJhbnNpdGlvbikge1xuICAgICAgICB0aGF0LiRlbGVtZW50WzBdLm9mZnNldFdpZHRoIC8vIGZvcmNlIHJlZmxvd1xuICAgICAgfVxuXG4gICAgICB0aGF0LiRlbGVtZW50LmFkZENsYXNzKCdpbicpXG5cbiAgICAgIHRoYXQuZW5mb3JjZUZvY3VzKClcblxuICAgICAgdmFyIGUgPSAkLkV2ZW50KCdzaG93bi5icy5tb2RhbCcsIHsgcmVsYXRlZFRhcmdldDogX3JlbGF0ZWRUYXJnZXQgfSlcblxuICAgICAgdHJhbnNpdGlvbiA/XG4gICAgICAgIHRoYXQuJGRpYWxvZyAvLyB3YWl0IGZvciBtb2RhbCB0byBzbGlkZSBpblxuICAgICAgICAgIC5vbmUoJ2JzVHJhbnNpdGlvbkVuZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoYXQuJGVsZW1lbnQudHJpZ2dlcignZm9jdXMnKS50cmlnZ2VyKGUpXG4gICAgICAgICAgfSlcbiAgICAgICAgICAuZW11bGF0ZVRyYW5zaXRpb25FbmQoTW9kYWwuVFJBTlNJVElPTl9EVVJBVElPTikgOlxuICAgICAgICB0aGF0LiRlbGVtZW50LnRyaWdnZXIoJ2ZvY3VzJykudHJpZ2dlcihlKVxuICAgIH0pXG4gIH1cblxuICBNb2RhbC5wcm90b3R5cGUuaGlkZSA9IGZ1bmN0aW9uIChlKSB7XG4gICAgaWYgKGUpIGUucHJldmVudERlZmF1bHQoKVxuXG4gICAgZSA9ICQuRXZlbnQoJ2hpZGUuYnMubW9kYWwnKVxuXG4gICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKGUpXG5cbiAgICBpZiAoIXRoaXMuaXNTaG93biB8fCBlLmlzRGVmYXVsdFByZXZlbnRlZCgpKSByZXR1cm5cblxuICAgIHRoaXMuaXNTaG93biA9IGZhbHNlXG5cbiAgICB0aGlzLmVzY2FwZSgpXG4gICAgdGhpcy5yZXNpemUoKVxuXG4gICAgJChkb2N1bWVudCkub2ZmKCdmb2N1c2luLmJzLm1vZGFsJylcblxuICAgIHRoaXMuJGVsZW1lbnRcbiAgICAgIC5yZW1vdmVDbGFzcygnaW4nKVxuICAgICAgLm9mZignY2xpY2suZGlzbWlzcy5icy5tb2RhbCcpXG4gICAgICAub2ZmKCdtb3VzZXVwLmRpc21pc3MuYnMubW9kYWwnKVxuXG4gICAgdGhpcy4kZGlhbG9nLm9mZignbW91c2Vkb3duLmRpc21pc3MuYnMubW9kYWwnKVxuXG4gICAgJC5zdXBwb3J0LnRyYW5zaXRpb24gJiYgdGhpcy4kZWxlbWVudC5oYXNDbGFzcygnZmFkZScpID9cbiAgICAgIHRoaXMuJGVsZW1lbnRcbiAgICAgICAgLm9uZSgnYnNUcmFuc2l0aW9uRW5kJywgJC5wcm94eSh0aGlzLmhpZGVNb2RhbCwgdGhpcykpXG4gICAgICAgIC5lbXVsYXRlVHJhbnNpdGlvbkVuZChNb2RhbC5UUkFOU0lUSU9OX0RVUkFUSU9OKSA6XG4gICAgICB0aGlzLmhpZGVNb2RhbCgpXG4gIH1cblxuICBNb2RhbC5wcm90b3R5cGUuZW5mb3JjZUZvY3VzID0gZnVuY3Rpb24gKCkge1xuICAgICQoZG9jdW1lbnQpXG4gICAgICAub2ZmKCdmb2N1c2luLmJzLm1vZGFsJykgLy8gZ3VhcmQgYWdhaW5zdCBpbmZpbml0ZSBmb2N1cyBsb29wXG4gICAgICAub24oJ2ZvY3VzaW4uYnMubW9kYWwnLCAkLnByb3h5KGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGlmIChkb2N1bWVudCAhPT0gZS50YXJnZXQgJiZcbiAgICAgICAgICB0aGlzLiRlbGVtZW50WzBdICE9PSBlLnRhcmdldCAmJlxuICAgICAgICAgICF0aGlzLiRlbGVtZW50LmhhcyhlLnRhcmdldCkubGVuZ3RoKSB7XG4gICAgICAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdmb2N1cycpXG4gICAgICAgIH1cbiAgICAgIH0sIHRoaXMpKVxuICB9XG5cbiAgTW9kYWwucHJvdG90eXBlLmVzY2FwZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5pc1Nob3duICYmIHRoaXMub3B0aW9ucy5rZXlib2FyZCkge1xuICAgICAgdGhpcy4kZWxlbWVudC5vbigna2V5ZG93bi5kaXNtaXNzLmJzLm1vZGFsJywgJC5wcm94eShmdW5jdGlvbiAoZSkge1xuICAgICAgICBlLndoaWNoID09IDI3ICYmIHRoaXMuaGlkZSgpXG4gICAgICB9LCB0aGlzKSlcbiAgICB9IGVsc2UgaWYgKCF0aGlzLmlzU2hvd24pIHtcbiAgICAgIHRoaXMuJGVsZW1lbnQub2ZmKCdrZXlkb3duLmRpc21pc3MuYnMubW9kYWwnKVxuICAgIH1cbiAgfVxuXG4gIE1vZGFsLnByb3RvdHlwZS5yZXNpemUgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMuaXNTaG93bikge1xuICAgICAgJCh3aW5kb3cpLm9uKCdyZXNpemUuYnMubW9kYWwnLCAkLnByb3h5KHRoaXMuaGFuZGxlVXBkYXRlLCB0aGlzKSlcbiAgICB9IGVsc2Uge1xuICAgICAgJCh3aW5kb3cpLm9mZigncmVzaXplLmJzLm1vZGFsJylcbiAgICB9XG4gIH1cblxuICBNb2RhbC5wcm90b3R5cGUuaGlkZU1vZGFsID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciB0aGF0ID0gdGhpc1xuICAgIHRoaXMuJGVsZW1lbnQuaGlkZSgpXG4gICAgdGhpcy5iYWNrZHJvcChmdW5jdGlvbiAoKSB7XG4gICAgICB0aGF0LiRib2R5LnJlbW92ZUNsYXNzKCdtb2RhbC1vcGVuJylcbiAgICAgIHRoYXQucmVzZXRBZGp1c3RtZW50cygpXG4gICAgICB0aGF0LnJlc2V0U2Nyb2xsYmFyKClcbiAgICAgIHRoYXQuJGVsZW1lbnQudHJpZ2dlcignaGlkZGVuLmJzLm1vZGFsJylcbiAgICB9KVxuICB9XG5cbiAgTW9kYWwucHJvdG90eXBlLnJlbW92ZUJhY2tkcm9wID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuJGJhY2tkcm9wICYmIHRoaXMuJGJhY2tkcm9wLnJlbW92ZSgpXG4gICAgdGhpcy4kYmFja2Ryb3AgPSBudWxsXG4gIH1cblxuICBNb2RhbC5wcm90b3R5cGUuYmFja2Ryb3AgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICB2YXIgdGhhdCA9IHRoaXNcbiAgICB2YXIgYW5pbWF0ZSA9IHRoaXMuJGVsZW1lbnQuaGFzQ2xhc3MoJ2ZhZGUnKSA/ICdmYWRlJyA6ICcnXG5cbiAgICBpZiAodGhpcy5pc1Nob3duICYmIHRoaXMub3B0aW9ucy5iYWNrZHJvcCkge1xuICAgICAgdmFyIGRvQW5pbWF0ZSA9ICQuc3VwcG9ydC50cmFuc2l0aW9uICYmIGFuaW1hdGVcblxuICAgICAgdGhpcy4kYmFja2Ryb3AgPSAkKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpKVxuICAgICAgICAuYWRkQ2xhc3MoJ21vZGFsLWJhY2tkcm9wICcgKyBhbmltYXRlKVxuICAgICAgICAuYXBwZW5kVG8odGhpcy4kYm9keSlcblxuICAgICAgdGhpcy4kZWxlbWVudC5vbignY2xpY2suZGlzbWlzcy5icy5tb2RhbCcsICQucHJveHkoZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgaWYgKHRoaXMuaWdub3JlQmFja2Ryb3BDbGljaykge1xuICAgICAgICAgIHRoaXMuaWdub3JlQmFja2Ryb3BDbGljayA9IGZhbHNlXG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgaWYgKGUudGFyZ2V0ICE9PSBlLmN1cnJlbnRUYXJnZXQpIHJldHVyblxuICAgICAgICB0aGlzLm9wdGlvbnMuYmFja2Ryb3AgPT0gJ3N0YXRpYydcbiAgICAgICAgICA/IHRoaXMuJGVsZW1lbnRbMF0uZm9jdXMoKVxuICAgICAgICAgIDogdGhpcy5oaWRlKClcbiAgICAgIH0sIHRoaXMpKVxuXG4gICAgICBpZiAoZG9BbmltYXRlKSB0aGlzLiRiYWNrZHJvcFswXS5vZmZzZXRXaWR0aCAvLyBmb3JjZSByZWZsb3dcblxuICAgICAgdGhpcy4kYmFja2Ryb3AuYWRkQ2xhc3MoJ2luJylcblxuICAgICAgaWYgKCFjYWxsYmFjaykgcmV0dXJuXG5cbiAgICAgIGRvQW5pbWF0ZSA/XG4gICAgICAgIHRoaXMuJGJhY2tkcm9wXG4gICAgICAgICAgLm9uZSgnYnNUcmFuc2l0aW9uRW5kJywgY2FsbGJhY2spXG4gICAgICAgICAgLmVtdWxhdGVUcmFuc2l0aW9uRW5kKE1vZGFsLkJBQ0tEUk9QX1RSQU5TSVRJT05fRFVSQVRJT04pIDpcbiAgICAgICAgY2FsbGJhY2soKVxuXG4gICAgfSBlbHNlIGlmICghdGhpcy5pc1Nob3duICYmIHRoaXMuJGJhY2tkcm9wKSB7XG4gICAgICB0aGlzLiRiYWNrZHJvcC5yZW1vdmVDbGFzcygnaW4nKVxuXG4gICAgICB2YXIgY2FsbGJhY2tSZW1vdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoYXQucmVtb3ZlQmFja2Ryb3AoKVxuICAgICAgICBjYWxsYmFjayAmJiBjYWxsYmFjaygpXG4gICAgICB9XG4gICAgICAkLnN1cHBvcnQudHJhbnNpdGlvbiAmJiB0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKCdmYWRlJykgP1xuICAgICAgICB0aGlzLiRiYWNrZHJvcFxuICAgICAgICAgIC5vbmUoJ2JzVHJhbnNpdGlvbkVuZCcsIGNhbGxiYWNrUmVtb3ZlKVxuICAgICAgICAgIC5lbXVsYXRlVHJhbnNpdGlvbkVuZChNb2RhbC5CQUNLRFJPUF9UUkFOU0lUSU9OX0RVUkFUSU9OKSA6XG4gICAgICAgIGNhbGxiYWNrUmVtb3ZlKClcblxuICAgIH0gZWxzZSBpZiAoY2FsbGJhY2spIHtcbiAgICAgIGNhbGxiYWNrKClcbiAgICB9XG4gIH1cblxuICAvLyB0aGVzZSBmb2xsb3dpbmcgbWV0aG9kcyBhcmUgdXNlZCB0byBoYW5kbGUgb3ZlcmZsb3dpbmcgbW9kYWxzXG5cbiAgTW9kYWwucHJvdG90eXBlLmhhbmRsZVVwZGF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmFkanVzdERpYWxvZygpXG4gIH1cblxuICBNb2RhbC5wcm90b3R5cGUuYWRqdXN0RGlhbG9nID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBtb2RhbElzT3ZlcmZsb3dpbmcgPSB0aGlzLiRlbGVtZW50WzBdLnNjcm9sbEhlaWdodCA+IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHRcblxuICAgIHRoaXMuJGVsZW1lbnQuY3NzKHtcbiAgICAgIHBhZGRpbmdMZWZ0OiAhdGhpcy5ib2R5SXNPdmVyZmxvd2luZyAmJiBtb2RhbElzT3ZlcmZsb3dpbmcgPyB0aGlzLnNjcm9sbGJhcldpZHRoIDogJycsXG4gICAgICBwYWRkaW5nUmlnaHQ6IHRoaXMuYm9keUlzT3ZlcmZsb3dpbmcgJiYgIW1vZGFsSXNPdmVyZmxvd2luZyA/IHRoaXMuc2Nyb2xsYmFyV2lkdGggOiAnJ1xuICAgIH0pXG4gIH1cblxuICBNb2RhbC5wcm90b3R5cGUucmVzZXRBZGp1c3RtZW50cyA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLiRlbGVtZW50LmNzcyh7XG4gICAgICBwYWRkaW5nTGVmdDogJycsXG4gICAgICBwYWRkaW5nUmlnaHQ6ICcnXG4gICAgfSlcbiAgfVxuXG4gIE1vZGFsLnByb3RvdHlwZS5jaGVja1Njcm9sbGJhciA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZnVsbFdpbmRvd1dpZHRoID0gd2luZG93LmlubmVyV2lkdGhcbiAgICBpZiAoIWZ1bGxXaW5kb3dXaWR0aCkgeyAvLyB3b3JrYXJvdW5kIGZvciBtaXNzaW5nIHdpbmRvdy5pbm5lcldpZHRoIGluIElFOFxuICAgICAgdmFyIGRvY3VtZW50RWxlbWVudFJlY3QgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgIGZ1bGxXaW5kb3dXaWR0aCA9IGRvY3VtZW50RWxlbWVudFJlY3QucmlnaHQgLSBNYXRoLmFicyhkb2N1bWVudEVsZW1lbnRSZWN0LmxlZnQpXG4gICAgfVxuICAgIHRoaXMuYm9keUlzT3ZlcmZsb3dpbmcgPSBkb2N1bWVudC5ib2R5LmNsaWVudFdpZHRoIDwgZnVsbFdpbmRvd1dpZHRoXG4gICAgdGhpcy5zY3JvbGxiYXJXaWR0aCA9IHRoaXMubWVhc3VyZVNjcm9sbGJhcigpXG4gIH1cblxuICBNb2RhbC5wcm90b3R5cGUuc2V0U2Nyb2xsYmFyID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBib2R5UGFkID0gcGFyc2VJbnQoKHRoaXMuJGJvZHkuY3NzKCdwYWRkaW5nLXJpZ2h0JykgfHwgMCksIDEwKVxuICAgIHRoaXMub3JpZ2luYWxCb2R5UGFkID0gZG9jdW1lbnQuYm9keS5zdHlsZS5wYWRkaW5nUmlnaHQgfHwgJydcbiAgICB2YXIgc2Nyb2xsYmFyV2lkdGggPSB0aGlzLnNjcm9sbGJhcldpZHRoXG4gICAgaWYgKHRoaXMuYm9keUlzT3ZlcmZsb3dpbmcpIHtcbiAgICAgIHRoaXMuJGJvZHkuY3NzKCdwYWRkaW5nLXJpZ2h0JywgYm9keVBhZCArIHNjcm9sbGJhcldpZHRoKVxuICAgICAgJCh0aGlzLmZpeGVkQ29udGVudCkuZWFjaChmdW5jdGlvbiAoaW5kZXgsIGVsZW1lbnQpIHtcbiAgICAgICAgdmFyIGFjdHVhbFBhZGRpbmcgPSBlbGVtZW50LnN0eWxlLnBhZGRpbmdSaWdodFxuICAgICAgICB2YXIgY2FsY3VsYXRlZFBhZGRpbmcgPSAkKGVsZW1lbnQpLmNzcygncGFkZGluZy1yaWdodCcpXG4gICAgICAgICQoZWxlbWVudClcbiAgICAgICAgICAuZGF0YSgncGFkZGluZy1yaWdodCcsIGFjdHVhbFBhZGRpbmcpXG4gICAgICAgICAgLmNzcygncGFkZGluZy1yaWdodCcsIHBhcnNlRmxvYXQoY2FsY3VsYXRlZFBhZGRpbmcpICsgc2Nyb2xsYmFyV2lkdGggKyAncHgnKVxuICAgICAgfSlcbiAgICB9XG4gIH1cblxuICBNb2RhbC5wcm90b3R5cGUucmVzZXRTY3JvbGxiYXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy4kYm9keS5jc3MoJ3BhZGRpbmctcmlnaHQnLCB0aGlzLm9yaWdpbmFsQm9keVBhZClcbiAgICAkKHRoaXMuZml4ZWRDb250ZW50KS5lYWNoKGZ1bmN0aW9uIChpbmRleCwgZWxlbWVudCkge1xuICAgICAgdmFyIHBhZGRpbmcgPSAkKGVsZW1lbnQpLmRhdGEoJ3BhZGRpbmctcmlnaHQnKVxuICAgICAgJChlbGVtZW50KS5yZW1vdmVEYXRhKCdwYWRkaW5nLXJpZ2h0JylcbiAgICAgIGVsZW1lbnQuc3R5bGUucGFkZGluZ1JpZ2h0ID0gcGFkZGluZyA/IHBhZGRpbmcgOiAnJ1xuICAgIH0pXG4gIH1cblxuICBNb2RhbC5wcm90b3R5cGUubWVhc3VyZVNjcm9sbGJhciA9IGZ1bmN0aW9uICgpIHsgLy8gdGh4IHdhbHNoXG4gICAgdmFyIHNjcm9sbERpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgc2Nyb2xsRGl2LmNsYXNzTmFtZSA9ICdtb2RhbC1zY3JvbGxiYXItbWVhc3VyZSdcbiAgICB0aGlzLiRib2R5LmFwcGVuZChzY3JvbGxEaXYpXG4gICAgdmFyIHNjcm9sbGJhcldpZHRoID0gc2Nyb2xsRGl2Lm9mZnNldFdpZHRoIC0gc2Nyb2xsRGl2LmNsaWVudFdpZHRoXG4gICAgdGhpcy4kYm9keVswXS5yZW1vdmVDaGlsZChzY3JvbGxEaXYpXG4gICAgcmV0dXJuIHNjcm9sbGJhcldpZHRoXG4gIH1cblxuXG4gIC8vIE1PREFMIFBMVUdJTiBERUZJTklUSU9OXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgZnVuY3Rpb24gUGx1Z2luKG9wdGlvbiwgX3JlbGF0ZWRUYXJnZXQpIHtcbiAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciAkdGhpcyA9ICQodGhpcylcbiAgICAgIHZhciBkYXRhID0gJHRoaXMuZGF0YSgnYnMubW9kYWwnKVxuICAgICAgdmFyIG9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgTW9kYWwuREVGQVVMVFMsICR0aGlzLmRhdGEoKSwgdHlwZW9mIG9wdGlvbiA9PSAnb2JqZWN0JyAmJiBvcHRpb24pXG5cbiAgICAgIGlmICghZGF0YSkgJHRoaXMuZGF0YSgnYnMubW9kYWwnLCAoZGF0YSA9IG5ldyBNb2RhbCh0aGlzLCBvcHRpb25zKSkpXG4gICAgICBpZiAodHlwZW9mIG9wdGlvbiA9PSAnc3RyaW5nJykgZGF0YVtvcHRpb25dKF9yZWxhdGVkVGFyZ2V0KVxuICAgICAgZWxzZSBpZiAob3B0aW9ucy5zaG93KSBkYXRhLnNob3coX3JlbGF0ZWRUYXJnZXQpXG4gICAgfSlcbiAgfVxuXG4gIHZhciBvbGQgPSAkLmZuLm1vZGFsXG5cbiAgJC5mbi5tb2RhbCA9IFBsdWdpblxuICAkLmZuLm1vZGFsLkNvbnN0cnVjdG9yID0gTW9kYWxcblxuXG4gIC8vIE1PREFMIE5PIENPTkZMSUNUXG4gIC8vID09PT09PT09PT09PT09PT09XG5cbiAgJC5mbi5tb2RhbC5ub0NvbmZsaWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICQuZm4ubW9kYWwgPSBvbGRcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cblxuICAvLyBNT0RBTCBEQVRBLUFQSVxuICAvLyA9PT09PT09PT09PT09PVxuXG4gICQoZG9jdW1lbnQpLm9uKCdjbGljay5icy5tb2RhbC5kYXRhLWFwaScsICdbZGF0YS10b2dnbGU9XCJtb2RhbFwiXScsIGZ1bmN0aW9uIChlKSB7XG4gICAgdmFyICR0aGlzID0gJCh0aGlzKVxuICAgIHZhciBocmVmID0gJHRoaXMuYXR0cignaHJlZicpXG4gICAgdmFyIHRhcmdldCA9ICR0aGlzLmF0dHIoJ2RhdGEtdGFyZ2V0JykgfHxcbiAgICAgIChocmVmICYmIGhyZWYucmVwbGFjZSgvLiooPz0jW15cXHNdKyQpLywgJycpKSAvLyBzdHJpcCBmb3IgaWU3XG5cbiAgICB2YXIgJHRhcmdldCA9ICQoZG9jdW1lbnQpLmZpbmQodGFyZ2V0KVxuICAgIHZhciBvcHRpb24gPSAkdGFyZ2V0LmRhdGEoJ2JzLm1vZGFsJykgPyAndG9nZ2xlJyA6ICQuZXh0ZW5kKHsgcmVtb3RlOiAhLyMvLnRlc3QoaHJlZikgJiYgaHJlZiB9LCAkdGFyZ2V0LmRhdGEoKSwgJHRoaXMuZGF0YSgpKVxuXG4gICAgaWYgKCR0aGlzLmlzKCdhJykpIGUucHJldmVudERlZmF1bHQoKVxuXG4gICAgJHRhcmdldC5vbmUoJ3Nob3cuYnMubW9kYWwnLCBmdW5jdGlvbiAoc2hvd0V2ZW50KSB7XG4gICAgICBpZiAoc2hvd0V2ZW50LmlzRGVmYXVsdFByZXZlbnRlZCgpKSByZXR1cm4gLy8gb25seSByZWdpc3RlciBmb2N1cyByZXN0b3JlciBpZiBtb2RhbCB3aWxsIGFjdHVhbGx5IGdldCBzaG93blxuICAgICAgJHRhcmdldC5vbmUoJ2hpZGRlbi5icy5tb2RhbCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJHRoaXMuaXMoJzp2aXNpYmxlJykgJiYgJHRoaXMudHJpZ2dlcignZm9jdXMnKVxuICAgICAgfSlcbiAgICB9KVxuICAgIFBsdWdpbi5jYWxsKCR0YXJnZXQsIG9wdGlvbiwgdGhpcylcbiAgfSlcblxufShqUXVlcnkpO1xuXG4vKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIEJvb3RzdHJhcDogdG9vbHRpcC5qcyB2My40LjFcbiAqIGh0dHBzOi8vZ2V0Ym9vdHN0cmFwLmNvbS9kb2NzLzMuNC9qYXZhc2NyaXB0LyN0b29sdGlwXG4gKiBJbnNwaXJlZCBieSB0aGUgb3JpZ2luYWwgalF1ZXJ5LnRpcHN5IGJ5IEphc29uIEZyYW1lXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIENvcHlyaWdodCAyMDExLTIwMTkgVHdpdHRlciwgSW5jLlxuICogTGljZW5zZWQgdW5kZXIgTUlUIChodHRwczovL2dpdGh1Yi5jb20vdHdicy9ib290c3RyYXAvYmxvYi9tYXN0ZXIvTElDRU5TRSlcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqL1xuXG4rZnVuY3Rpb24gKCQpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIHZhciBESVNBTExPV0VEX0FUVFJJQlVURVMgPSBbJ3Nhbml0aXplJywgJ3doaXRlTGlzdCcsICdzYW5pdGl6ZUZuJ11cblxuICB2YXIgdXJpQXR0cnMgPSBbXG4gICAgJ2JhY2tncm91bmQnLFxuICAgICdjaXRlJyxcbiAgICAnaHJlZicsXG4gICAgJ2l0ZW10eXBlJyxcbiAgICAnbG9uZ2Rlc2MnLFxuICAgICdwb3N0ZXInLFxuICAgICdzcmMnLFxuICAgICd4bGluazpocmVmJ1xuICBdXG5cbiAgdmFyIEFSSUFfQVRUUklCVVRFX1BBVFRFUk4gPSAvXmFyaWEtW1xcdy1dKiQvaVxuXG4gIHZhciBEZWZhdWx0V2hpdGVsaXN0ID0ge1xuICAgIC8vIEdsb2JhbCBhdHRyaWJ1dGVzIGFsbG93ZWQgb24gYW55IHN1cHBsaWVkIGVsZW1lbnQgYmVsb3cuXG4gICAgJyonOiBbJ2NsYXNzJywgJ2RpcicsICdpZCcsICdsYW5nJywgJ3JvbGUnLCBBUklBX0FUVFJJQlVURV9QQVRURVJOXSxcbiAgICBhOiBbJ3RhcmdldCcsICdocmVmJywgJ3RpdGxlJywgJ3JlbCddLFxuICAgIGFyZWE6IFtdLFxuICAgIGI6IFtdLFxuICAgIGJyOiBbXSxcbiAgICBjb2w6IFtdLFxuICAgIGNvZGU6IFtdLFxuICAgIGRpdjogW10sXG4gICAgZW06IFtdLFxuICAgIGhyOiBbXSxcbiAgICBoMTogW10sXG4gICAgaDI6IFtdLFxuICAgIGgzOiBbXSxcbiAgICBoNDogW10sXG4gICAgaDU6IFtdLFxuICAgIGg2OiBbXSxcbiAgICBpOiBbXSxcbiAgICBpbWc6IFsnc3JjJywgJ2FsdCcsICd0aXRsZScsICd3aWR0aCcsICdoZWlnaHQnXSxcbiAgICBsaTogW10sXG4gICAgb2w6IFtdLFxuICAgIHA6IFtdLFxuICAgIHByZTogW10sXG4gICAgczogW10sXG4gICAgc21hbGw6IFtdLFxuICAgIHNwYW46IFtdLFxuICAgIHN1YjogW10sXG4gICAgc3VwOiBbXSxcbiAgICBzdHJvbmc6IFtdLFxuICAgIHU6IFtdLFxuICAgIHVsOiBbXVxuICB9XG5cbiAgLyoqXG4gICAqIEEgcGF0dGVybiB0aGF0IHJlY29nbml6ZXMgYSBjb21tb25seSB1c2VmdWwgc3Vic2V0IG9mIFVSTHMgdGhhdCBhcmUgc2FmZS5cbiAgICpcbiAgICogU2hvdXRvdXQgdG8gQW5ndWxhciA3IGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2FuZ3VsYXIvYmxvYi83LjIuNC9wYWNrYWdlcy9jb3JlL3NyYy9zYW5pdGl6YXRpb24vdXJsX3Nhbml0aXplci50c1xuICAgKi9cbiAgdmFyIFNBRkVfVVJMX1BBVFRFUk4gPSAvXig/Oig/Omh0dHBzP3xtYWlsdG98ZnRwfHRlbHxmaWxlKTp8W14mOi8/I10qKD86Wy8/I118JCkpL2dpXG5cbiAgLyoqXG4gICAqIEEgcGF0dGVybiB0aGF0IG1hdGNoZXMgc2FmZSBkYXRhIFVSTHMuIE9ubHkgbWF0Y2hlcyBpbWFnZSwgdmlkZW8gYW5kIGF1ZGlvIHR5cGVzLlxuICAgKlxuICAgKiBTaG91dG91dCB0byBBbmd1bGFyIDcgaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvYW5ndWxhci9ibG9iLzcuMi40L3BhY2thZ2VzL2NvcmUvc3JjL3Nhbml0aXphdGlvbi91cmxfc2FuaXRpemVyLnRzXG4gICAqL1xuICB2YXIgREFUQV9VUkxfUEFUVEVSTiA9IC9eZGF0YTooPzppbWFnZVxcLyg/OmJtcHxnaWZ8anBlZ3xqcGd8cG5nfHRpZmZ8d2VicCl8dmlkZW9cXC8oPzptcGVnfG1wNHxvZ2d8d2VibSl8YXVkaW9cXC8oPzptcDN8b2dhfG9nZ3xvcHVzKSk7YmFzZTY0LFthLXowLTkrL10rPSokL2lcblxuICBmdW5jdGlvbiBhbGxvd2VkQXR0cmlidXRlKGF0dHIsIGFsbG93ZWRBdHRyaWJ1dGVMaXN0KSB7XG4gICAgdmFyIGF0dHJOYW1lID0gYXR0ci5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpXG5cbiAgICBpZiAoJC5pbkFycmF5KGF0dHJOYW1lLCBhbGxvd2VkQXR0cmlidXRlTGlzdCkgIT09IC0xKSB7XG4gICAgICBpZiAoJC5pbkFycmF5KGF0dHJOYW1lLCB1cmlBdHRycykgIT09IC0xKSB7XG4gICAgICAgIHJldHVybiBCb29sZWFuKGF0dHIubm9kZVZhbHVlLm1hdGNoKFNBRkVfVVJMX1BBVFRFUk4pIHx8IGF0dHIubm9kZVZhbHVlLm1hdGNoKERBVEFfVVJMX1BBVFRFUk4pKVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cblxuICAgIHZhciByZWdFeHAgPSAkKGFsbG93ZWRBdHRyaWJ1dGVMaXN0KS5maWx0ZXIoZnVuY3Rpb24gKGluZGV4LCB2YWx1ZSkge1xuICAgICAgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgUmVnRXhwXG4gICAgfSlcblxuICAgIC8vIENoZWNrIGlmIGEgcmVndWxhciBleHByZXNzaW9uIHZhbGlkYXRlcyB0aGUgYXR0cmlidXRlLlxuICAgIGZvciAodmFyIGkgPSAwLCBsID0gcmVnRXhwLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgaWYgKGF0dHJOYW1lLm1hdGNoKHJlZ0V4cFtpXSkpIHtcbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIGZ1bmN0aW9uIHNhbml0aXplSHRtbCh1bnNhZmVIdG1sLCB3aGl0ZUxpc3QsIHNhbml0aXplRm4pIHtcbiAgICBpZiAodW5zYWZlSHRtbC5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiB1bnNhZmVIdG1sXG4gICAgfVxuXG4gICAgaWYgKHNhbml0aXplRm4gJiYgdHlwZW9mIHNhbml0aXplRm4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiBzYW5pdGl6ZUZuKHVuc2FmZUh0bWwpXG4gICAgfVxuXG4gICAgLy8gSUUgOCBhbmQgYmVsb3cgZG9uJ3Qgc3VwcG9ydCBjcmVhdGVIVE1MRG9jdW1lbnRcbiAgICBpZiAoIWRvY3VtZW50LmltcGxlbWVudGF0aW9uIHx8ICFkb2N1bWVudC5pbXBsZW1lbnRhdGlvbi5jcmVhdGVIVE1MRG9jdW1lbnQpIHtcbiAgICAgIHJldHVybiB1bnNhZmVIdG1sXG4gICAgfVxuXG4gICAgdmFyIGNyZWF0ZWREb2N1bWVudCA9IGRvY3VtZW50LmltcGxlbWVudGF0aW9uLmNyZWF0ZUhUTUxEb2N1bWVudCgnc2FuaXRpemF0aW9uJylcbiAgICBjcmVhdGVkRG9jdW1lbnQuYm9keS5pbm5lckhUTUwgPSB1bnNhZmVIdG1sXG5cbiAgICB2YXIgd2hpdGVsaXN0S2V5cyA9ICQubWFwKHdoaXRlTGlzdCwgZnVuY3Rpb24gKGVsLCBpKSB7IHJldHVybiBpIH0pXG4gICAgdmFyIGVsZW1lbnRzID0gJChjcmVhdGVkRG9jdW1lbnQuYm9keSkuZmluZCgnKicpXG5cbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gZWxlbWVudHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIHZhciBlbCA9IGVsZW1lbnRzW2ldXG4gICAgICB2YXIgZWxOYW1lID0gZWwubm9kZU5hbWUudG9Mb3dlckNhc2UoKVxuXG4gICAgICBpZiAoJC5pbkFycmF5KGVsTmFtZSwgd2hpdGVsaXN0S2V5cykgPT09IC0xKSB7XG4gICAgICAgIGVsLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoZWwpXG5cbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgdmFyIGF0dHJpYnV0ZUxpc3QgPSAkLm1hcChlbC5hdHRyaWJ1dGVzLCBmdW5jdGlvbiAoZWwpIHsgcmV0dXJuIGVsIH0pXG4gICAgICB2YXIgd2hpdGVsaXN0ZWRBdHRyaWJ1dGVzID0gW10uY29uY2F0KHdoaXRlTGlzdFsnKiddIHx8IFtdLCB3aGl0ZUxpc3RbZWxOYW1lXSB8fCBbXSlcblxuICAgICAgZm9yICh2YXIgaiA9IDAsIGxlbjIgPSBhdHRyaWJ1dGVMaXN0Lmxlbmd0aDsgaiA8IGxlbjI7IGorKykge1xuICAgICAgICBpZiAoIWFsbG93ZWRBdHRyaWJ1dGUoYXR0cmlidXRlTGlzdFtqXSwgd2hpdGVsaXN0ZWRBdHRyaWJ1dGVzKSkge1xuICAgICAgICAgIGVsLnJlbW92ZUF0dHJpYnV0ZShhdHRyaWJ1dGVMaXN0W2pdLm5vZGVOYW1lKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGNyZWF0ZWREb2N1bWVudC5ib2R5LmlubmVySFRNTFxuICB9XG5cbiAgLy8gVE9PTFRJUCBQVUJMSUMgQ0xBU1MgREVGSU5JVElPTlxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgdmFyIFRvb2x0aXAgPSBmdW5jdGlvbiAoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIHRoaXMudHlwZSAgICAgICA9IG51bGxcbiAgICB0aGlzLm9wdGlvbnMgICAgPSBudWxsXG4gICAgdGhpcy5lbmFibGVkICAgID0gbnVsbFxuICAgIHRoaXMudGltZW91dCAgICA9IG51bGxcbiAgICB0aGlzLmhvdmVyU3RhdGUgPSBudWxsXG4gICAgdGhpcy4kZWxlbWVudCAgID0gbnVsbFxuICAgIHRoaXMuaW5TdGF0ZSAgICA9IG51bGxcblxuICAgIHRoaXMuaW5pdCgndG9vbHRpcCcsIGVsZW1lbnQsIG9wdGlvbnMpXG4gIH1cblxuICBUb29sdGlwLlZFUlNJT04gID0gJzMuNC4xJ1xuXG4gIFRvb2x0aXAuVFJBTlNJVElPTl9EVVJBVElPTiA9IDE1MFxuXG4gIFRvb2x0aXAuREVGQVVMVFMgPSB7XG4gICAgYW5pbWF0aW9uOiB0cnVlLFxuICAgIHBsYWNlbWVudDogJ3RvcCcsXG4gICAgc2VsZWN0b3I6IGZhbHNlLFxuICAgIHRlbXBsYXRlOiAnPGRpdiBjbGFzcz1cInRvb2x0aXBcIiByb2xlPVwidG9vbHRpcFwiPjxkaXYgY2xhc3M9XCJ0b29sdGlwLWFycm93XCI+PC9kaXY+PGRpdiBjbGFzcz1cInRvb2x0aXAtaW5uZXJcIj48L2Rpdj48L2Rpdj4nLFxuICAgIHRyaWdnZXI6ICdob3ZlciBmb2N1cycsXG4gICAgdGl0bGU6ICcnLFxuICAgIGRlbGF5OiAwLFxuICAgIGh0bWw6IGZhbHNlLFxuICAgIGNvbnRhaW5lcjogZmFsc2UsXG4gICAgdmlld3BvcnQ6IHtcbiAgICAgIHNlbGVjdG9yOiAnYm9keScsXG4gICAgICBwYWRkaW5nOiAwXG4gICAgfSxcbiAgICBzYW5pdGl6ZSA6IHRydWUsXG4gICAgc2FuaXRpemVGbiA6IG51bGwsXG4gICAgd2hpdGVMaXN0IDogRGVmYXVsdFdoaXRlbGlzdFxuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uICh0eXBlLCBlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy5lbmFibGVkICAgPSB0cnVlXG4gICAgdGhpcy50eXBlICAgICAgPSB0eXBlXG4gICAgdGhpcy4kZWxlbWVudCAgPSAkKGVsZW1lbnQpXG4gICAgdGhpcy5vcHRpb25zICAgPSB0aGlzLmdldE9wdGlvbnMob3B0aW9ucylcbiAgICB0aGlzLiR2aWV3cG9ydCA9IHRoaXMub3B0aW9ucy52aWV3cG9ydCAmJiAkKGRvY3VtZW50KS5maW5kKCQuaXNGdW5jdGlvbih0aGlzLm9wdGlvbnMudmlld3BvcnQpID8gdGhpcy5vcHRpb25zLnZpZXdwb3J0LmNhbGwodGhpcywgdGhpcy4kZWxlbWVudCkgOiAodGhpcy5vcHRpb25zLnZpZXdwb3J0LnNlbGVjdG9yIHx8IHRoaXMub3B0aW9ucy52aWV3cG9ydCkpXG4gICAgdGhpcy5pblN0YXRlICAgPSB7IGNsaWNrOiBmYWxzZSwgaG92ZXI6IGZhbHNlLCBmb2N1czogZmFsc2UgfVxuXG4gICAgaWYgKHRoaXMuJGVsZW1lbnRbMF0gaW5zdGFuY2VvZiBkb2N1bWVudC5jb25zdHJ1Y3RvciAmJiAhdGhpcy5vcHRpb25zLnNlbGVjdG9yKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2BzZWxlY3RvcmAgb3B0aW9uIG11c3QgYmUgc3BlY2lmaWVkIHdoZW4gaW5pdGlhbGl6aW5nICcgKyB0aGlzLnR5cGUgKyAnIG9uIHRoZSB3aW5kb3cuZG9jdW1lbnQgb2JqZWN0IScpXG4gICAgfVxuXG4gICAgdmFyIHRyaWdnZXJzID0gdGhpcy5vcHRpb25zLnRyaWdnZXIuc3BsaXQoJyAnKVxuXG4gICAgZm9yICh2YXIgaSA9IHRyaWdnZXJzLmxlbmd0aDsgaS0tOykge1xuICAgICAgdmFyIHRyaWdnZXIgPSB0cmlnZ2Vyc1tpXVxuXG4gICAgICBpZiAodHJpZ2dlciA9PSAnY2xpY2snKSB7XG4gICAgICAgIHRoaXMuJGVsZW1lbnQub24oJ2NsaWNrLicgKyB0aGlzLnR5cGUsIHRoaXMub3B0aW9ucy5zZWxlY3RvciwgJC5wcm94eSh0aGlzLnRvZ2dsZSwgdGhpcykpXG4gICAgICB9IGVsc2UgaWYgKHRyaWdnZXIgIT0gJ21hbnVhbCcpIHtcbiAgICAgICAgdmFyIGV2ZW50SW4gID0gdHJpZ2dlciA9PSAnaG92ZXInID8gJ21vdXNlZW50ZXInIDogJ2ZvY3VzaW4nXG4gICAgICAgIHZhciBldmVudE91dCA9IHRyaWdnZXIgPT0gJ2hvdmVyJyA/ICdtb3VzZWxlYXZlJyA6ICdmb2N1c291dCdcblxuICAgICAgICB0aGlzLiRlbGVtZW50Lm9uKGV2ZW50SW4gICsgJy4nICsgdGhpcy50eXBlLCB0aGlzLm9wdGlvbnMuc2VsZWN0b3IsICQucHJveHkodGhpcy5lbnRlciwgdGhpcykpXG4gICAgICAgIHRoaXMuJGVsZW1lbnQub24oZXZlbnRPdXQgKyAnLicgKyB0aGlzLnR5cGUsIHRoaXMub3B0aW9ucy5zZWxlY3RvciwgJC5wcm94eSh0aGlzLmxlYXZlLCB0aGlzKSlcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLm9wdGlvbnMuc2VsZWN0b3IgP1xuICAgICAgKHRoaXMuX29wdGlvbnMgPSAkLmV4dGVuZCh7fSwgdGhpcy5vcHRpb25zLCB7IHRyaWdnZXI6ICdtYW51YWwnLCBzZWxlY3RvcjogJycgfSkpIDpcbiAgICAgIHRoaXMuZml4VGl0bGUoKVxuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUuZ2V0RGVmYXVsdHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIFRvb2x0aXAuREVGQVVMVFNcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLmdldE9wdGlvbnMgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIHZhciBkYXRhQXR0cmlidXRlcyA9IHRoaXMuJGVsZW1lbnQuZGF0YSgpXG5cbiAgICBmb3IgKHZhciBkYXRhQXR0ciBpbiBkYXRhQXR0cmlidXRlcykge1xuICAgICAgaWYgKGRhdGFBdHRyaWJ1dGVzLmhhc093blByb3BlcnR5KGRhdGFBdHRyKSAmJiAkLmluQXJyYXkoZGF0YUF0dHIsIERJU0FMTE9XRURfQVRUUklCVVRFUykgIT09IC0xKSB7XG4gICAgICAgIGRlbGV0ZSBkYXRhQXR0cmlidXRlc1tkYXRhQXR0cl1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBvcHRpb25zID0gJC5leHRlbmQoe30sIHRoaXMuZ2V0RGVmYXVsdHMoKSwgZGF0YUF0dHJpYnV0ZXMsIG9wdGlvbnMpXG5cbiAgICBpZiAob3B0aW9ucy5kZWxheSAmJiB0eXBlb2Ygb3B0aW9ucy5kZWxheSA9PSAnbnVtYmVyJykge1xuICAgICAgb3B0aW9ucy5kZWxheSA9IHtcbiAgICAgICAgc2hvdzogb3B0aW9ucy5kZWxheSxcbiAgICAgICAgaGlkZTogb3B0aW9ucy5kZWxheVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChvcHRpb25zLnNhbml0aXplKSB7XG4gICAgICBvcHRpb25zLnRlbXBsYXRlID0gc2FuaXRpemVIdG1sKG9wdGlvbnMudGVtcGxhdGUsIG9wdGlvbnMud2hpdGVMaXN0LCBvcHRpb25zLnNhbml0aXplRm4pXG4gICAgfVxuXG4gICAgcmV0dXJuIG9wdGlvbnNcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLmdldERlbGVnYXRlT3B0aW9ucyA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgb3B0aW9ucyAgPSB7fVxuICAgIHZhciBkZWZhdWx0cyA9IHRoaXMuZ2V0RGVmYXVsdHMoKVxuXG4gICAgdGhpcy5fb3B0aW9ucyAmJiAkLmVhY2godGhpcy5fb3B0aW9ucywgZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgIGlmIChkZWZhdWx0c1trZXldICE9IHZhbHVlKSBvcHRpb25zW2tleV0gPSB2YWx1ZVxuICAgIH0pXG5cbiAgICByZXR1cm4gb3B0aW9uc1xuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUuZW50ZXIgPSBmdW5jdGlvbiAob2JqKSB7XG4gICAgdmFyIHNlbGYgPSBvYmogaW5zdGFuY2VvZiB0aGlzLmNvbnN0cnVjdG9yID9cbiAgICAgIG9iaiA6ICQob2JqLmN1cnJlbnRUYXJnZXQpLmRhdGEoJ2JzLicgKyB0aGlzLnR5cGUpXG5cbiAgICBpZiAoIXNlbGYpIHtcbiAgICAgIHNlbGYgPSBuZXcgdGhpcy5jb25zdHJ1Y3RvcihvYmouY3VycmVudFRhcmdldCwgdGhpcy5nZXREZWxlZ2F0ZU9wdGlvbnMoKSlcbiAgICAgICQob2JqLmN1cnJlbnRUYXJnZXQpLmRhdGEoJ2JzLicgKyB0aGlzLnR5cGUsIHNlbGYpXG4gICAgfVxuXG4gICAgaWYgKG9iaiBpbnN0YW5jZW9mICQuRXZlbnQpIHtcbiAgICAgIHNlbGYuaW5TdGF0ZVtvYmoudHlwZSA9PSAnZm9jdXNpbicgPyAnZm9jdXMnIDogJ2hvdmVyJ10gPSB0cnVlXG4gICAgfVxuXG4gICAgaWYgKHNlbGYudGlwKCkuaGFzQ2xhc3MoJ2luJykgfHwgc2VsZi5ob3ZlclN0YXRlID09ICdpbicpIHtcbiAgICAgIHNlbGYuaG92ZXJTdGF0ZSA9ICdpbidcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNsZWFyVGltZW91dChzZWxmLnRpbWVvdXQpXG5cbiAgICBzZWxmLmhvdmVyU3RhdGUgPSAnaW4nXG5cbiAgICBpZiAoIXNlbGYub3B0aW9ucy5kZWxheSB8fCAhc2VsZi5vcHRpb25zLmRlbGF5LnNob3cpIHJldHVybiBzZWxmLnNob3coKVxuXG4gICAgc2VsZi50aW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAoc2VsZi5ob3ZlclN0YXRlID09ICdpbicpIHNlbGYuc2hvdygpXG4gICAgfSwgc2VsZi5vcHRpb25zLmRlbGF5LnNob3cpXG4gIH1cblxuICBUb29sdGlwLnByb3RvdHlwZS5pc0luU3RhdGVUcnVlID0gZnVuY3Rpb24gKCkge1xuICAgIGZvciAodmFyIGtleSBpbiB0aGlzLmluU3RhdGUpIHtcbiAgICAgIGlmICh0aGlzLmluU3RhdGVba2V5XSkgcmV0dXJuIHRydWVcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLmxlYXZlID0gZnVuY3Rpb24gKG9iaikge1xuICAgIHZhciBzZWxmID0gb2JqIGluc3RhbmNlb2YgdGhpcy5jb25zdHJ1Y3RvciA/XG4gICAgICBvYmogOiAkKG9iai5jdXJyZW50VGFyZ2V0KS5kYXRhKCdicy4nICsgdGhpcy50eXBlKVxuXG4gICAgaWYgKCFzZWxmKSB7XG4gICAgICBzZWxmID0gbmV3IHRoaXMuY29uc3RydWN0b3Iob2JqLmN1cnJlbnRUYXJnZXQsIHRoaXMuZ2V0RGVsZWdhdGVPcHRpb25zKCkpXG4gICAgICAkKG9iai5jdXJyZW50VGFyZ2V0KS5kYXRhKCdicy4nICsgdGhpcy50eXBlLCBzZWxmKVxuICAgIH1cblxuICAgIGlmIChvYmogaW5zdGFuY2VvZiAkLkV2ZW50KSB7XG4gICAgICBzZWxmLmluU3RhdGVbb2JqLnR5cGUgPT0gJ2ZvY3Vzb3V0JyA/ICdmb2N1cycgOiAnaG92ZXInXSA9IGZhbHNlXG4gICAgfVxuXG4gICAgaWYgKHNlbGYuaXNJblN0YXRlVHJ1ZSgpKSByZXR1cm5cblxuICAgIGNsZWFyVGltZW91dChzZWxmLnRpbWVvdXQpXG5cbiAgICBzZWxmLmhvdmVyU3RhdGUgPSAnb3V0J1xuXG4gICAgaWYgKCFzZWxmLm9wdGlvbnMuZGVsYXkgfHwgIXNlbGYub3B0aW9ucy5kZWxheS5oaWRlKSByZXR1cm4gc2VsZi5oaWRlKClcblxuICAgIHNlbGYudGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKHNlbGYuaG92ZXJTdGF0ZSA9PSAnb3V0Jykgc2VsZi5oaWRlKClcbiAgICB9LCBzZWxmLm9wdGlvbnMuZGVsYXkuaGlkZSlcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGUgPSAkLkV2ZW50KCdzaG93LmJzLicgKyB0aGlzLnR5cGUpXG5cbiAgICBpZiAodGhpcy5oYXNDb250ZW50KCkgJiYgdGhpcy5lbmFibGVkKSB7XG4gICAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoZSlcblxuICAgICAgdmFyIGluRG9tID0gJC5jb250YWlucyh0aGlzLiRlbGVtZW50WzBdLm93bmVyRG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LCB0aGlzLiRlbGVtZW50WzBdKVxuICAgICAgaWYgKGUuaXNEZWZhdWx0UHJldmVudGVkKCkgfHwgIWluRG9tKSByZXR1cm5cbiAgICAgIHZhciB0aGF0ID0gdGhpc1xuXG4gICAgICB2YXIgJHRpcCA9IHRoaXMudGlwKClcblxuICAgICAgdmFyIHRpcElkID0gdGhpcy5nZXRVSUQodGhpcy50eXBlKVxuXG4gICAgICB0aGlzLnNldENvbnRlbnQoKVxuICAgICAgJHRpcC5hdHRyKCdpZCcsIHRpcElkKVxuICAgICAgdGhpcy4kZWxlbWVudC5hdHRyKCdhcmlhLWRlc2NyaWJlZGJ5JywgdGlwSWQpXG5cbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuYW5pbWF0aW9uKSAkdGlwLmFkZENsYXNzKCdmYWRlJylcblxuICAgICAgdmFyIHBsYWNlbWVudCA9IHR5cGVvZiB0aGlzLm9wdGlvbnMucGxhY2VtZW50ID09ICdmdW5jdGlvbicgP1xuICAgICAgICB0aGlzLm9wdGlvbnMucGxhY2VtZW50LmNhbGwodGhpcywgJHRpcFswXSwgdGhpcy4kZWxlbWVudFswXSkgOlxuICAgICAgICB0aGlzLm9wdGlvbnMucGxhY2VtZW50XG5cbiAgICAgIHZhciBhdXRvVG9rZW4gPSAvXFxzP2F1dG8/XFxzPy9pXG4gICAgICB2YXIgYXV0b1BsYWNlID0gYXV0b1Rva2VuLnRlc3QocGxhY2VtZW50KVxuICAgICAgaWYgKGF1dG9QbGFjZSkgcGxhY2VtZW50ID0gcGxhY2VtZW50LnJlcGxhY2UoYXV0b1Rva2VuLCAnJykgfHwgJ3RvcCdcblxuICAgICAgJHRpcFxuICAgICAgICAuZGV0YWNoKClcbiAgICAgICAgLmNzcyh7IHRvcDogMCwgbGVmdDogMCwgZGlzcGxheTogJ2Jsb2NrJyB9KVxuICAgICAgICAuYWRkQ2xhc3MocGxhY2VtZW50KVxuICAgICAgICAuZGF0YSgnYnMuJyArIHRoaXMudHlwZSwgdGhpcylcblxuICAgICAgdGhpcy5vcHRpb25zLmNvbnRhaW5lciA/ICR0aXAuYXBwZW5kVG8oJChkb2N1bWVudCkuZmluZCh0aGlzLm9wdGlvbnMuY29udGFpbmVyKSkgOiAkdGlwLmluc2VydEFmdGVyKHRoaXMuJGVsZW1lbnQpXG4gICAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ2luc2VydGVkLmJzLicgKyB0aGlzLnR5cGUpXG5cbiAgICAgIHZhciBwb3MgICAgICAgICAgPSB0aGlzLmdldFBvc2l0aW9uKClcbiAgICAgIHZhciBhY3R1YWxXaWR0aCAgPSAkdGlwWzBdLm9mZnNldFdpZHRoXG4gICAgICB2YXIgYWN0dWFsSGVpZ2h0ID0gJHRpcFswXS5vZmZzZXRIZWlnaHRcblxuICAgICAgaWYgKGF1dG9QbGFjZSkge1xuICAgICAgICB2YXIgb3JnUGxhY2VtZW50ID0gcGxhY2VtZW50XG4gICAgICAgIHZhciB2aWV3cG9ydERpbSA9IHRoaXMuZ2V0UG9zaXRpb24odGhpcy4kdmlld3BvcnQpXG5cbiAgICAgICAgcGxhY2VtZW50ID0gcGxhY2VtZW50ID09ICdib3R0b20nICYmIHBvcy5ib3R0b20gKyBhY3R1YWxIZWlnaHQgPiB2aWV3cG9ydERpbS5ib3R0b20gPyAndG9wJyAgICA6XG4gICAgICAgICAgICAgICAgICAgIHBsYWNlbWVudCA9PSAndG9wJyAgICAmJiBwb3MudG9wICAgIC0gYWN0dWFsSGVpZ2h0IDwgdmlld3BvcnREaW0udG9wICAgID8gJ2JvdHRvbScgOlxuICAgICAgICAgICAgICAgICAgICBwbGFjZW1lbnQgPT0gJ3JpZ2h0JyAgJiYgcG9zLnJpZ2h0ICArIGFjdHVhbFdpZHRoICA+IHZpZXdwb3J0RGltLndpZHRoICA/ICdsZWZ0JyAgIDpcbiAgICAgICAgICAgICAgICAgICAgcGxhY2VtZW50ID09ICdsZWZ0JyAgICYmIHBvcy5sZWZ0ICAgLSBhY3R1YWxXaWR0aCAgPCB2aWV3cG9ydERpbS5sZWZ0ICAgPyAncmlnaHQnICA6XG4gICAgICAgICAgICAgICAgICAgIHBsYWNlbWVudFxuXG4gICAgICAgICR0aXBcbiAgICAgICAgICAucmVtb3ZlQ2xhc3Mob3JnUGxhY2VtZW50KVxuICAgICAgICAgIC5hZGRDbGFzcyhwbGFjZW1lbnQpXG4gICAgICB9XG5cbiAgICAgIHZhciBjYWxjdWxhdGVkT2Zmc2V0ID0gdGhpcy5nZXRDYWxjdWxhdGVkT2Zmc2V0KHBsYWNlbWVudCwgcG9zLCBhY3R1YWxXaWR0aCwgYWN0dWFsSGVpZ2h0KVxuXG4gICAgICB0aGlzLmFwcGx5UGxhY2VtZW50KGNhbGN1bGF0ZWRPZmZzZXQsIHBsYWNlbWVudClcblxuICAgICAgdmFyIGNvbXBsZXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgcHJldkhvdmVyU3RhdGUgPSB0aGF0LmhvdmVyU3RhdGVcbiAgICAgICAgdGhhdC4kZWxlbWVudC50cmlnZ2VyKCdzaG93bi5icy4nICsgdGhhdC50eXBlKVxuICAgICAgICB0aGF0LmhvdmVyU3RhdGUgPSBudWxsXG5cbiAgICAgICAgaWYgKHByZXZIb3ZlclN0YXRlID09ICdvdXQnKSB0aGF0LmxlYXZlKHRoYXQpXG4gICAgICB9XG5cbiAgICAgICQuc3VwcG9ydC50cmFuc2l0aW9uICYmIHRoaXMuJHRpcC5oYXNDbGFzcygnZmFkZScpID9cbiAgICAgICAgJHRpcFxuICAgICAgICAgIC5vbmUoJ2JzVHJhbnNpdGlvbkVuZCcsIGNvbXBsZXRlKVxuICAgICAgICAgIC5lbXVsYXRlVHJhbnNpdGlvbkVuZChUb29sdGlwLlRSQU5TSVRJT05fRFVSQVRJT04pIDpcbiAgICAgICAgY29tcGxldGUoKVxuICAgIH1cbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLmFwcGx5UGxhY2VtZW50ID0gZnVuY3Rpb24gKG9mZnNldCwgcGxhY2VtZW50KSB7XG4gICAgdmFyICR0aXAgICA9IHRoaXMudGlwKClcbiAgICB2YXIgd2lkdGggID0gJHRpcFswXS5vZmZzZXRXaWR0aFxuICAgIHZhciBoZWlnaHQgPSAkdGlwWzBdLm9mZnNldEhlaWdodFxuXG4gICAgLy8gbWFudWFsbHkgcmVhZCBtYXJnaW5zIGJlY2F1c2UgZ2V0Qm91bmRpbmdDbGllbnRSZWN0IGluY2x1ZGVzIGRpZmZlcmVuY2VcbiAgICB2YXIgbWFyZ2luVG9wID0gcGFyc2VJbnQoJHRpcC5jc3MoJ21hcmdpbi10b3AnKSwgMTApXG4gICAgdmFyIG1hcmdpbkxlZnQgPSBwYXJzZUludCgkdGlwLmNzcygnbWFyZ2luLWxlZnQnKSwgMTApXG5cbiAgICAvLyB3ZSBtdXN0IGNoZWNrIGZvciBOYU4gZm9yIGllIDgvOVxuICAgIGlmIChpc05hTihtYXJnaW5Ub3ApKSAgbWFyZ2luVG9wICA9IDBcbiAgICBpZiAoaXNOYU4obWFyZ2luTGVmdCkpIG1hcmdpbkxlZnQgPSAwXG5cbiAgICBvZmZzZXQudG9wICArPSBtYXJnaW5Ub3BcbiAgICBvZmZzZXQubGVmdCArPSBtYXJnaW5MZWZ0XG5cbiAgICAvLyAkLmZuLm9mZnNldCBkb2Vzbid0IHJvdW5kIHBpeGVsIHZhbHVlc1xuICAgIC8vIHNvIHdlIHVzZSBzZXRPZmZzZXQgZGlyZWN0bHkgd2l0aCBvdXIgb3duIGZ1bmN0aW9uIEItMFxuICAgICQub2Zmc2V0LnNldE9mZnNldCgkdGlwWzBdLCAkLmV4dGVuZCh7XG4gICAgICB1c2luZzogZnVuY3Rpb24gKHByb3BzKSB7XG4gICAgICAgICR0aXAuY3NzKHtcbiAgICAgICAgICB0b3A6IE1hdGgucm91bmQocHJvcHMudG9wKSxcbiAgICAgICAgICBsZWZ0OiBNYXRoLnJvdW5kKHByb3BzLmxlZnQpXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfSwgb2Zmc2V0KSwgMClcblxuICAgICR0aXAuYWRkQ2xhc3MoJ2luJylcblxuICAgIC8vIGNoZWNrIHRvIHNlZSBpZiBwbGFjaW5nIHRpcCBpbiBuZXcgb2Zmc2V0IGNhdXNlZCB0aGUgdGlwIHRvIHJlc2l6ZSBpdHNlbGZcbiAgICB2YXIgYWN0dWFsV2lkdGggID0gJHRpcFswXS5vZmZzZXRXaWR0aFxuICAgIHZhciBhY3R1YWxIZWlnaHQgPSAkdGlwWzBdLm9mZnNldEhlaWdodFxuXG4gICAgaWYgKHBsYWNlbWVudCA9PSAndG9wJyAmJiBhY3R1YWxIZWlnaHQgIT0gaGVpZ2h0KSB7XG4gICAgICBvZmZzZXQudG9wID0gb2Zmc2V0LnRvcCArIGhlaWdodCAtIGFjdHVhbEhlaWdodFxuICAgIH1cblxuICAgIHZhciBkZWx0YSA9IHRoaXMuZ2V0Vmlld3BvcnRBZGp1c3RlZERlbHRhKHBsYWNlbWVudCwgb2Zmc2V0LCBhY3R1YWxXaWR0aCwgYWN0dWFsSGVpZ2h0KVxuXG4gICAgaWYgKGRlbHRhLmxlZnQpIG9mZnNldC5sZWZ0ICs9IGRlbHRhLmxlZnRcbiAgICBlbHNlIG9mZnNldC50b3AgKz0gZGVsdGEudG9wXG5cbiAgICB2YXIgaXNWZXJ0aWNhbCAgICAgICAgICA9IC90b3B8Ym90dG9tLy50ZXN0KHBsYWNlbWVudClcbiAgICB2YXIgYXJyb3dEZWx0YSAgICAgICAgICA9IGlzVmVydGljYWwgPyBkZWx0YS5sZWZ0ICogMiAtIHdpZHRoICsgYWN0dWFsV2lkdGggOiBkZWx0YS50b3AgKiAyIC0gaGVpZ2h0ICsgYWN0dWFsSGVpZ2h0XG4gICAgdmFyIGFycm93T2Zmc2V0UG9zaXRpb24gPSBpc1ZlcnRpY2FsID8gJ29mZnNldFdpZHRoJyA6ICdvZmZzZXRIZWlnaHQnXG5cbiAgICAkdGlwLm9mZnNldChvZmZzZXQpXG4gICAgdGhpcy5yZXBsYWNlQXJyb3coYXJyb3dEZWx0YSwgJHRpcFswXVthcnJvd09mZnNldFBvc2l0aW9uXSwgaXNWZXJ0aWNhbClcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLnJlcGxhY2VBcnJvdyA9IGZ1bmN0aW9uIChkZWx0YSwgZGltZW5zaW9uLCBpc1ZlcnRpY2FsKSB7XG4gICAgdGhpcy5hcnJvdygpXG4gICAgICAuY3NzKGlzVmVydGljYWwgPyAnbGVmdCcgOiAndG9wJywgNTAgKiAoMSAtIGRlbHRhIC8gZGltZW5zaW9uKSArICclJylcbiAgICAgIC5jc3MoaXNWZXJ0aWNhbCA/ICd0b3AnIDogJ2xlZnQnLCAnJylcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLnNldENvbnRlbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyICR0aXAgID0gdGhpcy50aXAoKVxuICAgIHZhciB0aXRsZSA9IHRoaXMuZ2V0VGl0bGUoKVxuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5odG1sKSB7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLnNhbml0aXplKSB7XG4gICAgICAgIHRpdGxlID0gc2FuaXRpemVIdG1sKHRpdGxlLCB0aGlzLm9wdGlvbnMud2hpdGVMaXN0LCB0aGlzLm9wdGlvbnMuc2FuaXRpemVGbilcbiAgICAgIH1cblxuICAgICAgJHRpcC5maW5kKCcudG9vbHRpcC1pbm5lcicpLmh0bWwodGl0bGUpXG4gICAgfSBlbHNlIHtcbiAgICAgICR0aXAuZmluZCgnLnRvb2x0aXAtaW5uZXInKS50ZXh0KHRpdGxlKVxuICAgIH1cblxuICAgICR0aXAucmVtb3ZlQ2xhc3MoJ2ZhZGUgaW4gdG9wIGJvdHRvbSBsZWZ0IHJpZ2h0JylcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLmhpZGUgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICB2YXIgdGhhdCA9IHRoaXNcbiAgICB2YXIgJHRpcCA9ICQodGhpcy4kdGlwKVxuICAgIHZhciBlICAgID0gJC5FdmVudCgnaGlkZS5icy4nICsgdGhpcy50eXBlKVxuXG4gICAgZnVuY3Rpb24gY29tcGxldGUoKSB7XG4gICAgICBpZiAodGhhdC5ob3ZlclN0YXRlICE9ICdpbicpICR0aXAuZGV0YWNoKClcbiAgICAgIGlmICh0aGF0LiRlbGVtZW50KSB7IC8vIFRPRE86IENoZWNrIHdoZXRoZXIgZ3VhcmRpbmcgdGhpcyBjb2RlIHdpdGggdGhpcyBgaWZgIGlzIHJlYWxseSBuZWNlc3NhcnkuXG4gICAgICAgIHRoYXQuJGVsZW1lbnRcbiAgICAgICAgICAucmVtb3ZlQXR0cignYXJpYS1kZXNjcmliZWRieScpXG4gICAgICAgICAgLnRyaWdnZXIoJ2hpZGRlbi5icy4nICsgdGhhdC50eXBlKVxuICAgICAgfVxuICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2soKVxuICAgIH1cblxuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcihlKVxuXG4gICAgaWYgKGUuaXNEZWZhdWx0UHJldmVudGVkKCkpIHJldHVyblxuXG4gICAgJHRpcC5yZW1vdmVDbGFzcygnaW4nKVxuXG4gICAgJC5zdXBwb3J0LnRyYW5zaXRpb24gJiYgJHRpcC5oYXNDbGFzcygnZmFkZScpID9cbiAgICAgICR0aXBcbiAgICAgICAgLm9uZSgnYnNUcmFuc2l0aW9uRW5kJywgY29tcGxldGUpXG4gICAgICAgIC5lbXVsYXRlVHJhbnNpdGlvbkVuZChUb29sdGlwLlRSQU5TSVRJT05fRFVSQVRJT04pIDpcbiAgICAgIGNvbXBsZXRlKClcblxuICAgIHRoaXMuaG92ZXJTdGF0ZSA9IG51bGxcblxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICBUb29sdGlwLnByb3RvdHlwZS5maXhUaXRsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgJGUgPSB0aGlzLiRlbGVtZW50XG4gICAgaWYgKCRlLmF0dHIoJ3RpdGxlJykgfHwgdHlwZW9mICRlLmF0dHIoJ2RhdGEtb3JpZ2luYWwtdGl0bGUnKSAhPSAnc3RyaW5nJykge1xuICAgICAgJGUuYXR0cignZGF0YS1vcmlnaW5hbC10aXRsZScsICRlLmF0dHIoJ3RpdGxlJykgfHwgJycpLmF0dHIoJ3RpdGxlJywgJycpXG4gICAgfVxuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUuaGFzQ29udGVudCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRUaXRsZSgpXG4gIH1cblxuICBUb29sdGlwLnByb3RvdHlwZS5nZXRQb3NpdGlvbiA9IGZ1bmN0aW9uICgkZWxlbWVudCkge1xuICAgICRlbGVtZW50ICAgPSAkZWxlbWVudCB8fCB0aGlzLiRlbGVtZW50XG5cbiAgICB2YXIgZWwgICAgID0gJGVsZW1lbnRbMF1cbiAgICB2YXIgaXNCb2R5ID0gZWwudGFnTmFtZSA9PSAnQk9EWSdcblxuICAgIHZhciBlbFJlY3QgICAgPSBlbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgIGlmIChlbFJlY3Qud2lkdGggPT0gbnVsbCkge1xuICAgICAgLy8gd2lkdGggYW5kIGhlaWdodCBhcmUgbWlzc2luZyBpbiBJRTgsIHNvIGNvbXB1dGUgdGhlbSBtYW51YWxseTsgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS90d2JzL2Jvb3RzdHJhcC9pc3N1ZXMvMTQwOTNcbiAgICAgIGVsUmVjdCA9ICQuZXh0ZW5kKHt9LCBlbFJlY3QsIHsgd2lkdGg6IGVsUmVjdC5yaWdodCAtIGVsUmVjdC5sZWZ0LCBoZWlnaHQ6IGVsUmVjdC5ib3R0b20gLSBlbFJlY3QudG9wIH0pXG4gICAgfVxuICAgIHZhciBpc1N2ZyA9IHdpbmRvdy5TVkdFbGVtZW50ICYmIGVsIGluc3RhbmNlb2Ygd2luZG93LlNWR0VsZW1lbnRcbiAgICAvLyBBdm9pZCB1c2luZyAkLm9mZnNldCgpIG9uIFNWR3Mgc2luY2UgaXQgZ2l2ZXMgaW5jb3JyZWN0IHJlc3VsdHMgaW4galF1ZXJ5IDMuXG4gICAgLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS90d2JzL2Jvb3RzdHJhcC9pc3N1ZXMvMjAyODBcbiAgICB2YXIgZWxPZmZzZXQgID0gaXNCb2R5ID8geyB0b3A6IDAsIGxlZnQ6IDAgfSA6IChpc1N2ZyA/IG51bGwgOiAkZWxlbWVudC5vZmZzZXQoKSlcbiAgICB2YXIgc2Nyb2xsICAgID0geyBzY3JvbGw6IGlzQm9keSA/IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxUb3AgfHwgZG9jdW1lbnQuYm9keS5zY3JvbGxUb3AgOiAkZWxlbWVudC5zY3JvbGxUb3AoKSB9XG4gICAgdmFyIG91dGVyRGltcyA9IGlzQm9keSA/IHsgd2lkdGg6ICQod2luZG93KS53aWR0aCgpLCBoZWlnaHQ6ICQod2luZG93KS5oZWlnaHQoKSB9IDogbnVsbFxuXG4gICAgcmV0dXJuICQuZXh0ZW5kKHt9LCBlbFJlY3QsIHNjcm9sbCwgb3V0ZXJEaW1zLCBlbE9mZnNldClcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLmdldENhbGN1bGF0ZWRPZmZzZXQgPSBmdW5jdGlvbiAocGxhY2VtZW50LCBwb3MsIGFjdHVhbFdpZHRoLCBhY3R1YWxIZWlnaHQpIHtcbiAgICByZXR1cm4gcGxhY2VtZW50ID09ICdib3R0b20nID8geyB0b3A6IHBvcy50b3AgKyBwb3MuaGVpZ2h0LCAgIGxlZnQ6IHBvcy5sZWZ0ICsgcG9zLndpZHRoIC8gMiAtIGFjdHVhbFdpZHRoIC8gMiB9IDpcbiAgICAgICAgICAgcGxhY2VtZW50ID09ICd0b3AnICAgID8geyB0b3A6IHBvcy50b3AgLSBhY3R1YWxIZWlnaHQsIGxlZnQ6IHBvcy5sZWZ0ICsgcG9zLndpZHRoIC8gMiAtIGFjdHVhbFdpZHRoIC8gMiB9IDpcbiAgICAgICAgICAgcGxhY2VtZW50ID09ICdsZWZ0JyAgID8geyB0b3A6IHBvcy50b3AgKyBwb3MuaGVpZ2h0IC8gMiAtIGFjdHVhbEhlaWdodCAvIDIsIGxlZnQ6IHBvcy5sZWZ0IC0gYWN0dWFsV2lkdGggfSA6XG4gICAgICAgIC8qIHBsYWNlbWVudCA9PSAncmlnaHQnICovIHsgdG9wOiBwb3MudG9wICsgcG9zLmhlaWdodCAvIDIgLSBhY3R1YWxIZWlnaHQgLyAyLCBsZWZ0OiBwb3MubGVmdCArIHBvcy53aWR0aCB9XG5cbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLmdldFZpZXdwb3J0QWRqdXN0ZWREZWx0YSA9IGZ1bmN0aW9uIChwbGFjZW1lbnQsIHBvcywgYWN0dWFsV2lkdGgsIGFjdHVhbEhlaWdodCkge1xuICAgIHZhciBkZWx0YSA9IHsgdG9wOiAwLCBsZWZ0OiAwIH1cbiAgICBpZiAoIXRoaXMuJHZpZXdwb3J0KSByZXR1cm4gZGVsdGFcblxuICAgIHZhciB2aWV3cG9ydFBhZGRpbmcgPSB0aGlzLm9wdGlvbnMudmlld3BvcnQgJiYgdGhpcy5vcHRpb25zLnZpZXdwb3J0LnBhZGRpbmcgfHwgMFxuICAgIHZhciB2aWV3cG9ydERpbWVuc2lvbnMgPSB0aGlzLmdldFBvc2l0aW9uKHRoaXMuJHZpZXdwb3J0KVxuXG4gICAgaWYgKC9yaWdodHxsZWZ0Ly50ZXN0KHBsYWNlbWVudCkpIHtcbiAgICAgIHZhciB0b3BFZGdlT2Zmc2V0ICAgID0gcG9zLnRvcCAtIHZpZXdwb3J0UGFkZGluZyAtIHZpZXdwb3J0RGltZW5zaW9ucy5zY3JvbGxcbiAgICAgIHZhciBib3R0b21FZGdlT2Zmc2V0ID0gcG9zLnRvcCArIHZpZXdwb3J0UGFkZGluZyAtIHZpZXdwb3J0RGltZW5zaW9ucy5zY3JvbGwgKyBhY3R1YWxIZWlnaHRcbiAgICAgIGlmICh0b3BFZGdlT2Zmc2V0IDwgdmlld3BvcnREaW1lbnNpb25zLnRvcCkgeyAvLyB0b3Agb3ZlcmZsb3dcbiAgICAgICAgZGVsdGEudG9wID0gdmlld3BvcnREaW1lbnNpb25zLnRvcCAtIHRvcEVkZ2VPZmZzZXRcbiAgICAgIH0gZWxzZSBpZiAoYm90dG9tRWRnZU9mZnNldCA+IHZpZXdwb3J0RGltZW5zaW9ucy50b3AgKyB2aWV3cG9ydERpbWVuc2lvbnMuaGVpZ2h0KSB7IC8vIGJvdHRvbSBvdmVyZmxvd1xuICAgICAgICBkZWx0YS50b3AgPSB2aWV3cG9ydERpbWVuc2lvbnMudG9wICsgdmlld3BvcnREaW1lbnNpb25zLmhlaWdodCAtIGJvdHRvbUVkZ2VPZmZzZXRcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGxlZnRFZGdlT2Zmc2V0ICA9IHBvcy5sZWZ0IC0gdmlld3BvcnRQYWRkaW5nXG4gICAgICB2YXIgcmlnaHRFZGdlT2Zmc2V0ID0gcG9zLmxlZnQgKyB2aWV3cG9ydFBhZGRpbmcgKyBhY3R1YWxXaWR0aFxuICAgICAgaWYgKGxlZnRFZGdlT2Zmc2V0IDwgdmlld3BvcnREaW1lbnNpb25zLmxlZnQpIHsgLy8gbGVmdCBvdmVyZmxvd1xuICAgICAgICBkZWx0YS5sZWZ0ID0gdmlld3BvcnREaW1lbnNpb25zLmxlZnQgLSBsZWZ0RWRnZU9mZnNldFxuICAgICAgfSBlbHNlIGlmIChyaWdodEVkZ2VPZmZzZXQgPiB2aWV3cG9ydERpbWVuc2lvbnMucmlnaHQpIHsgLy8gcmlnaHQgb3ZlcmZsb3dcbiAgICAgICAgZGVsdGEubGVmdCA9IHZpZXdwb3J0RGltZW5zaW9ucy5sZWZ0ICsgdmlld3BvcnREaW1lbnNpb25zLndpZHRoIC0gcmlnaHRFZGdlT2Zmc2V0XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGRlbHRhXG4gIH1cblxuICBUb29sdGlwLnByb3RvdHlwZS5nZXRUaXRsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgdGl0bGVcbiAgICB2YXIgJGUgPSB0aGlzLiRlbGVtZW50XG4gICAgdmFyIG8gID0gdGhpcy5vcHRpb25zXG5cbiAgICB0aXRsZSA9ICRlLmF0dHIoJ2RhdGEtb3JpZ2luYWwtdGl0bGUnKVxuICAgICAgfHwgKHR5cGVvZiBvLnRpdGxlID09ICdmdW5jdGlvbicgPyBvLnRpdGxlLmNhbGwoJGVbMF0pIDogIG8udGl0bGUpXG5cbiAgICByZXR1cm4gdGl0bGVcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLmdldFVJRCA9IGZ1bmN0aW9uIChwcmVmaXgpIHtcbiAgICBkbyBwcmVmaXggKz0gfn4oTWF0aC5yYW5kb20oKSAqIDEwMDAwMDApXG4gICAgd2hpbGUgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHByZWZpeCkpXG4gICAgcmV0dXJuIHByZWZpeFxuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUudGlwID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICghdGhpcy4kdGlwKSB7XG4gICAgICB0aGlzLiR0aXAgPSAkKHRoaXMub3B0aW9ucy50ZW1wbGF0ZSlcbiAgICAgIGlmICh0aGlzLiR0aXAubGVuZ3RoICE9IDEpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKHRoaXMudHlwZSArICcgYHRlbXBsYXRlYCBvcHRpb24gbXVzdCBjb25zaXN0IG9mIGV4YWN0bHkgMSB0b3AtbGV2ZWwgZWxlbWVudCEnKVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy4kdGlwXG4gIH1cblxuICBUb29sdGlwLnByb3RvdHlwZS5hcnJvdyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gKHRoaXMuJGFycm93ID0gdGhpcy4kYXJyb3cgfHwgdGhpcy50aXAoKS5maW5kKCcudG9vbHRpcC1hcnJvdycpKVxuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUuZW5hYmxlID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZW5hYmxlZCA9IHRydWVcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLmRpc2FibGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5lbmFibGVkID0gZmFsc2VcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLnRvZ2dsZUVuYWJsZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5lbmFibGVkID0gIXRoaXMuZW5hYmxlZFxuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUudG9nZ2xlID0gZnVuY3Rpb24gKGUpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICBpZiAoZSkge1xuICAgICAgc2VsZiA9ICQoZS5jdXJyZW50VGFyZ2V0KS5kYXRhKCdicy4nICsgdGhpcy50eXBlKVxuICAgICAgaWYgKCFzZWxmKSB7XG4gICAgICAgIHNlbGYgPSBuZXcgdGhpcy5jb25zdHJ1Y3RvcihlLmN1cnJlbnRUYXJnZXQsIHRoaXMuZ2V0RGVsZWdhdGVPcHRpb25zKCkpXG4gICAgICAgICQoZS5jdXJyZW50VGFyZ2V0KS5kYXRhKCdicy4nICsgdGhpcy50eXBlLCBzZWxmKVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChlKSB7XG4gICAgICBzZWxmLmluU3RhdGUuY2xpY2sgPSAhc2VsZi5pblN0YXRlLmNsaWNrXG4gICAgICBpZiAoc2VsZi5pc0luU3RhdGVUcnVlKCkpIHNlbGYuZW50ZXIoc2VsZilcbiAgICAgIGVsc2Ugc2VsZi5sZWF2ZShzZWxmKVxuICAgIH0gZWxzZSB7XG4gICAgICBzZWxmLnRpcCgpLmhhc0NsYXNzKCdpbicpID8gc2VsZi5sZWF2ZShzZWxmKSA6IHNlbGYuZW50ZXIoc2VsZilcbiAgICB9XG4gIH1cblxuICBUb29sdGlwLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciB0aGF0ID0gdGhpc1xuICAgIGNsZWFyVGltZW91dCh0aGlzLnRpbWVvdXQpXG4gICAgdGhpcy5oaWRlKGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoYXQuJGVsZW1lbnQub2ZmKCcuJyArIHRoYXQudHlwZSkucmVtb3ZlRGF0YSgnYnMuJyArIHRoYXQudHlwZSlcbiAgICAgIGlmICh0aGF0LiR0aXApIHtcbiAgICAgICAgdGhhdC4kdGlwLmRldGFjaCgpXG4gICAgICB9XG4gICAgICB0aGF0LiR0aXAgPSBudWxsXG4gICAgICB0aGF0LiRhcnJvdyA9IG51bGxcbiAgICAgIHRoYXQuJHZpZXdwb3J0ID0gbnVsbFxuICAgICAgdGhhdC4kZWxlbWVudCA9IG51bGxcbiAgICB9KVxuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUuc2FuaXRpemVIdG1sID0gZnVuY3Rpb24gKHVuc2FmZUh0bWwpIHtcbiAgICByZXR1cm4gc2FuaXRpemVIdG1sKHVuc2FmZUh0bWwsIHRoaXMub3B0aW9ucy53aGl0ZUxpc3QsIHRoaXMub3B0aW9ucy5zYW5pdGl6ZUZuKVxuICB9XG5cbiAgLy8gVE9PTFRJUCBQTFVHSU4gREVGSU5JVElPTlxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgZnVuY3Rpb24gUGx1Z2luKG9wdGlvbikge1xuICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgdmFyICR0aGlzICAgPSAkKHRoaXMpXG4gICAgICB2YXIgZGF0YSAgICA9ICR0aGlzLmRhdGEoJ2JzLnRvb2x0aXAnKVxuICAgICAgdmFyIG9wdGlvbnMgPSB0eXBlb2Ygb3B0aW9uID09ICdvYmplY3QnICYmIG9wdGlvblxuXG4gICAgICBpZiAoIWRhdGEgJiYgL2Rlc3Ryb3l8aGlkZS8udGVzdChvcHRpb24pKSByZXR1cm5cbiAgICAgIGlmICghZGF0YSkgJHRoaXMuZGF0YSgnYnMudG9vbHRpcCcsIChkYXRhID0gbmV3IFRvb2x0aXAodGhpcywgb3B0aW9ucykpKVxuICAgICAgaWYgKHR5cGVvZiBvcHRpb24gPT0gJ3N0cmluZycpIGRhdGFbb3B0aW9uXSgpXG4gICAgfSlcbiAgfVxuXG4gIHZhciBvbGQgPSAkLmZuLnRvb2x0aXBcblxuICAkLmZuLnRvb2x0aXAgICAgICAgICAgICAgPSBQbHVnaW5cbiAgJC5mbi50b29sdGlwLkNvbnN0cnVjdG9yID0gVG9vbHRpcFxuXG5cbiAgLy8gVE9PTFRJUCBOTyBDT05GTElDVFxuICAvLyA9PT09PT09PT09PT09PT09PT09XG5cbiAgJC5mbi50b29sdGlwLm5vQ29uZmxpY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgJC5mbi50b29sdGlwID0gb2xkXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG59KGpRdWVyeSk7XG5cbi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogQm9vdHN0cmFwOiBwb3BvdmVyLmpzIHYzLjQuMVxuICogaHR0cHM6Ly9nZXRib290c3RyYXAuY29tL2RvY3MvMy40L2phdmFzY3JpcHQvI3BvcG92ZXJzXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIENvcHlyaWdodCAyMDExLTIwMTkgVHdpdHRlciwgSW5jLlxuICogTGljZW5zZWQgdW5kZXIgTUlUIChodHRwczovL2dpdGh1Yi5jb20vdHdicy9ib290c3RyYXAvYmxvYi9tYXN0ZXIvTElDRU5TRSlcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqL1xuXG5cbitmdW5jdGlvbiAoJCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgLy8gUE9QT1ZFUiBQVUJMSUMgQ0xBU1MgREVGSU5JVElPTlxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgdmFyIFBvcG92ZXIgPSBmdW5jdGlvbiAoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIHRoaXMuaW5pdCgncG9wb3ZlcicsIGVsZW1lbnQsIG9wdGlvbnMpXG4gIH1cblxuICBpZiAoISQuZm4udG9vbHRpcCkgdGhyb3cgbmV3IEVycm9yKCdQb3BvdmVyIHJlcXVpcmVzIHRvb2x0aXAuanMnKVxuXG4gIFBvcG92ZXIuVkVSU0lPTiAgPSAnMy40LjEnXG5cbiAgUG9wb3Zlci5ERUZBVUxUUyA9ICQuZXh0ZW5kKHt9LCAkLmZuLnRvb2x0aXAuQ29uc3RydWN0b3IuREVGQVVMVFMsIHtcbiAgICBwbGFjZW1lbnQ6ICdyaWdodCcsXG4gICAgdHJpZ2dlcjogJ2NsaWNrJyxcbiAgICBjb250ZW50OiAnJyxcbiAgICB0ZW1wbGF0ZTogJzxkaXYgY2xhc3M9XCJwb3BvdmVyXCIgcm9sZT1cInRvb2x0aXBcIj48ZGl2IGNsYXNzPVwiYXJyb3dcIj48L2Rpdj48aDMgY2xhc3M9XCJwb3BvdmVyLXRpdGxlXCI+PC9oMz48ZGl2IGNsYXNzPVwicG9wb3Zlci1jb250ZW50XCI+PC9kaXY+PC9kaXY+J1xuICB9KVxuXG5cbiAgLy8gTk9URTogUE9QT1ZFUiBFWFRFTkRTIHRvb2x0aXAuanNcbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICBQb3BvdmVyLnByb3RvdHlwZSA9ICQuZXh0ZW5kKHt9LCAkLmZuLnRvb2x0aXAuQ29uc3RydWN0b3IucHJvdG90eXBlKVxuXG4gIFBvcG92ZXIucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gUG9wb3ZlclxuXG4gIFBvcG92ZXIucHJvdG90eXBlLmdldERlZmF1bHRzID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBQb3BvdmVyLkRFRkFVTFRTXG4gIH1cblxuICBQb3BvdmVyLnByb3RvdHlwZS5zZXRDb250ZW50ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciAkdGlwICAgID0gdGhpcy50aXAoKVxuICAgIHZhciB0aXRsZSAgID0gdGhpcy5nZXRUaXRsZSgpXG4gICAgdmFyIGNvbnRlbnQgPSB0aGlzLmdldENvbnRlbnQoKVxuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5odG1sKSB7XG4gICAgICB2YXIgdHlwZUNvbnRlbnQgPSB0eXBlb2YgY29udGVudFxuXG4gICAgICBpZiAodGhpcy5vcHRpb25zLnNhbml0aXplKSB7XG4gICAgICAgIHRpdGxlID0gdGhpcy5zYW5pdGl6ZUh0bWwodGl0bGUpXG5cbiAgICAgICAgaWYgKHR5cGVDb250ZW50ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgIGNvbnRlbnQgPSB0aGlzLnNhbml0aXplSHRtbChjb250ZW50KVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgICR0aXAuZmluZCgnLnBvcG92ZXItdGl0bGUnKS5odG1sKHRpdGxlKVxuICAgICAgJHRpcC5maW5kKCcucG9wb3Zlci1jb250ZW50JykuY2hpbGRyZW4oKS5kZXRhY2goKS5lbmQoKVtcbiAgICAgICAgdHlwZUNvbnRlbnQgPT09ICdzdHJpbmcnID8gJ2h0bWwnIDogJ2FwcGVuZCdcbiAgICAgIF0oY29udGVudClcbiAgICB9IGVsc2Uge1xuICAgICAgJHRpcC5maW5kKCcucG9wb3Zlci10aXRsZScpLnRleHQodGl0bGUpXG4gICAgICAkdGlwLmZpbmQoJy5wb3BvdmVyLWNvbnRlbnQnKS5jaGlsZHJlbigpLmRldGFjaCgpLmVuZCgpLnRleHQoY29udGVudClcbiAgICB9XG5cbiAgICAkdGlwLnJlbW92ZUNsYXNzKCdmYWRlIHRvcCBib3R0b20gbGVmdCByaWdodCBpbicpXG5cbiAgICAvLyBJRTggZG9lc24ndCBhY2NlcHQgaGlkaW5nIHZpYSB0aGUgYDplbXB0eWAgcHNldWRvIHNlbGVjdG9yLCB3ZSBoYXZlIHRvIGRvXG4gICAgLy8gdGhpcyBtYW51YWxseSBieSBjaGVja2luZyB0aGUgY29udGVudHMuXG4gICAgaWYgKCEkdGlwLmZpbmQoJy5wb3BvdmVyLXRpdGxlJykuaHRtbCgpKSAkdGlwLmZpbmQoJy5wb3BvdmVyLXRpdGxlJykuaGlkZSgpXG4gIH1cblxuICBQb3BvdmVyLnByb3RvdHlwZS5oYXNDb250ZW50ID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmdldFRpdGxlKCkgfHwgdGhpcy5nZXRDb250ZW50KClcbiAgfVxuXG4gIFBvcG92ZXIucHJvdG90eXBlLmdldENvbnRlbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyICRlID0gdGhpcy4kZWxlbWVudFxuICAgIHZhciBvICA9IHRoaXMub3B0aW9uc1xuXG4gICAgcmV0dXJuICRlLmF0dHIoJ2RhdGEtY29udGVudCcpXG4gICAgICB8fCAodHlwZW9mIG8uY29udGVudCA9PSAnZnVuY3Rpb24nID9cbiAgICAgICAgby5jb250ZW50LmNhbGwoJGVbMF0pIDpcbiAgICAgICAgby5jb250ZW50KVxuICB9XG5cbiAgUG9wb3Zlci5wcm90b3R5cGUuYXJyb3cgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICh0aGlzLiRhcnJvdyA9IHRoaXMuJGFycm93IHx8IHRoaXMudGlwKCkuZmluZCgnLmFycm93JykpXG4gIH1cblxuXG4gIC8vIFBPUE9WRVIgUExVR0lOIERFRklOSVRJT05cbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gIGZ1bmN0aW9uIFBsdWdpbihvcHRpb24pIHtcbiAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciAkdGhpcyAgID0gJCh0aGlzKVxuICAgICAgdmFyIGRhdGEgICAgPSAkdGhpcy5kYXRhKCdicy5wb3BvdmVyJylcbiAgICAgIHZhciBvcHRpb25zID0gdHlwZW9mIG9wdGlvbiA9PSAnb2JqZWN0JyAmJiBvcHRpb25cblxuICAgICAgaWYgKCFkYXRhICYmIC9kZXN0cm95fGhpZGUvLnRlc3Qob3B0aW9uKSkgcmV0dXJuXG4gICAgICBpZiAoIWRhdGEpICR0aGlzLmRhdGEoJ2JzLnBvcG92ZXInLCAoZGF0YSA9IG5ldyBQb3BvdmVyKHRoaXMsIG9wdGlvbnMpKSlcbiAgICAgIGlmICh0eXBlb2Ygb3B0aW9uID09ICdzdHJpbmcnKSBkYXRhW29wdGlvbl0oKVxuICAgIH0pXG4gIH1cblxuICB2YXIgb2xkID0gJC5mbi5wb3BvdmVyXG5cbiAgJC5mbi5wb3BvdmVyICAgICAgICAgICAgID0gUGx1Z2luXG4gICQuZm4ucG9wb3Zlci5Db25zdHJ1Y3RvciA9IFBvcG92ZXJcblxuXG4gIC8vIFBPUE9WRVIgTk8gQ09ORkxJQ1RcbiAgLy8gPT09PT09PT09PT09PT09PT09PVxuXG4gICQuZm4ucG9wb3Zlci5ub0NvbmZsaWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICQuZm4ucG9wb3ZlciA9IG9sZFxuICAgIHJldHVybiB0aGlzXG4gIH1cblxufShqUXVlcnkpO1xuXG4vKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIEJvb3RzdHJhcDogc2Nyb2xsc3B5LmpzIHYzLjQuMVxuICogaHR0cHM6Ly9nZXRib290c3RyYXAuY29tL2RvY3MvMy40L2phdmFzY3JpcHQvI3Njcm9sbHNweVxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBDb3B5cmlnaHQgMjAxMS0yMDE5IFR3aXR0ZXIsIEluYy5cbiAqIExpY2Vuc2VkIHVuZGVyIE1JVCAoaHR0cHM6Ly9naXRodWIuY29tL3R3YnMvYm9vdHN0cmFwL2Jsb2IvbWFzdGVyL0xJQ0VOU0UpXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi9cblxuXG4rZnVuY3Rpb24gKCQpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIC8vIFNDUk9MTFNQWSBDTEFTUyBERUZJTklUSU9OXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgZnVuY3Rpb24gU2Nyb2xsU3B5KGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLiRib2R5ICAgICAgICAgID0gJChkb2N1bWVudC5ib2R5KVxuICAgIHRoaXMuJHNjcm9sbEVsZW1lbnQgPSAkKGVsZW1lbnQpLmlzKGRvY3VtZW50LmJvZHkpID8gJCh3aW5kb3cpIDogJChlbGVtZW50KVxuICAgIHRoaXMub3B0aW9ucyAgICAgICAgPSAkLmV4dGVuZCh7fSwgU2Nyb2xsU3B5LkRFRkFVTFRTLCBvcHRpb25zKVxuICAgIHRoaXMuc2VsZWN0b3IgICAgICAgPSAodGhpcy5vcHRpb25zLnRhcmdldCB8fCAnJykgKyAnIC5uYXYgbGkgPiBhJ1xuICAgIHRoaXMub2Zmc2V0cyAgICAgICAgPSBbXVxuICAgIHRoaXMudGFyZ2V0cyAgICAgICAgPSBbXVxuICAgIHRoaXMuYWN0aXZlVGFyZ2V0ICAgPSBudWxsXG4gICAgdGhpcy5zY3JvbGxIZWlnaHQgICA9IDBcblxuICAgIHRoaXMuJHNjcm9sbEVsZW1lbnQub24oJ3Njcm9sbC5icy5zY3JvbGxzcHknLCAkLnByb3h5KHRoaXMucHJvY2VzcywgdGhpcykpXG4gICAgdGhpcy5yZWZyZXNoKClcbiAgICB0aGlzLnByb2Nlc3MoKVxuICB9XG5cbiAgU2Nyb2xsU3B5LlZFUlNJT04gID0gJzMuNC4xJ1xuXG4gIFNjcm9sbFNweS5ERUZBVUxUUyA9IHtcbiAgICBvZmZzZXQ6IDEwXG4gIH1cblxuICBTY3JvbGxTcHkucHJvdG90eXBlLmdldFNjcm9sbEhlaWdodCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy4kc2Nyb2xsRWxlbWVudFswXS5zY3JvbGxIZWlnaHQgfHwgTWF0aC5tYXgodGhpcy4kYm9keVswXS5zY3JvbGxIZWlnaHQsIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxIZWlnaHQpXG4gIH1cblxuICBTY3JvbGxTcHkucHJvdG90eXBlLnJlZnJlc2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHRoYXQgICAgICAgICAgPSB0aGlzXG4gICAgdmFyIG9mZnNldE1ldGhvZCAgPSAnb2Zmc2V0J1xuICAgIHZhciBvZmZzZXRCYXNlICAgID0gMFxuXG4gICAgdGhpcy5vZmZzZXRzICAgICAgPSBbXVxuICAgIHRoaXMudGFyZ2V0cyAgICAgID0gW11cbiAgICB0aGlzLnNjcm9sbEhlaWdodCA9IHRoaXMuZ2V0U2Nyb2xsSGVpZ2h0KClcblxuICAgIGlmICghJC5pc1dpbmRvdyh0aGlzLiRzY3JvbGxFbGVtZW50WzBdKSkge1xuICAgICAgb2Zmc2V0TWV0aG9kID0gJ3Bvc2l0aW9uJ1xuICAgICAgb2Zmc2V0QmFzZSAgID0gdGhpcy4kc2Nyb2xsRWxlbWVudC5zY3JvbGxUb3AoKVxuICAgIH1cblxuICAgIHRoaXMuJGJvZHlcbiAgICAgIC5maW5kKHRoaXMuc2VsZWN0b3IpXG4gICAgICAubWFwKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyICRlbCAgID0gJCh0aGlzKVxuICAgICAgICB2YXIgaHJlZiAgPSAkZWwuZGF0YSgndGFyZ2V0JykgfHwgJGVsLmF0dHIoJ2hyZWYnKVxuICAgICAgICB2YXIgJGhyZWYgPSAvXiMuLy50ZXN0KGhyZWYpICYmICQoaHJlZilcblxuICAgICAgICByZXR1cm4gKCRocmVmXG4gICAgICAgICAgJiYgJGhyZWYubGVuZ3RoXG4gICAgICAgICAgJiYgJGhyZWYuaXMoJzp2aXNpYmxlJylcbiAgICAgICAgICAmJiBbWyRocmVmW29mZnNldE1ldGhvZF0oKS50b3AgKyBvZmZzZXRCYXNlLCBocmVmXV0pIHx8IG51bGxcbiAgICAgIH0pXG4gICAgICAuc29ydChmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYVswXSAtIGJbMF0gfSlcbiAgICAgIC5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhhdC5vZmZzZXRzLnB1c2godGhpc1swXSlcbiAgICAgICAgdGhhdC50YXJnZXRzLnB1c2godGhpc1sxXSlcbiAgICAgIH0pXG4gIH1cblxuICBTY3JvbGxTcHkucHJvdG90eXBlLnByb2Nlc3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNjcm9sbFRvcCAgICA9IHRoaXMuJHNjcm9sbEVsZW1lbnQuc2Nyb2xsVG9wKCkgKyB0aGlzLm9wdGlvbnMub2Zmc2V0XG4gICAgdmFyIHNjcm9sbEhlaWdodCA9IHRoaXMuZ2V0U2Nyb2xsSGVpZ2h0KClcbiAgICB2YXIgbWF4U2Nyb2xsICAgID0gdGhpcy5vcHRpb25zLm9mZnNldCArIHNjcm9sbEhlaWdodCAtIHRoaXMuJHNjcm9sbEVsZW1lbnQuaGVpZ2h0KClcbiAgICB2YXIgb2Zmc2V0cyAgICAgID0gdGhpcy5vZmZzZXRzXG4gICAgdmFyIHRhcmdldHMgICAgICA9IHRoaXMudGFyZ2V0c1xuICAgIHZhciBhY3RpdmVUYXJnZXQgPSB0aGlzLmFjdGl2ZVRhcmdldFxuICAgIHZhciBpXG5cbiAgICBpZiAodGhpcy5zY3JvbGxIZWlnaHQgIT0gc2Nyb2xsSGVpZ2h0KSB7XG4gICAgICB0aGlzLnJlZnJlc2goKVxuICAgIH1cblxuICAgIGlmIChzY3JvbGxUb3AgPj0gbWF4U2Nyb2xsKSB7XG4gICAgICByZXR1cm4gYWN0aXZlVGFyZ2V0ICE9IChpID0gdGFyZ2V0c1t0YXJnZXRzLmxlbmd0aCAtIDFdKSAmJiB0aGlzLmFjdGl2YXRlKGkpXG4gICAgfVxuXG4gICAgaWYgKGFjdGl2ZVRhcmdldCAmJiBzY3JvbGxUb3AgPCBvZmZzZXRzWzBdKSB7XG4gICAgICB0aGlzLmFjdGl2ZVRhcmdldCA9IG51bGxcbiAgICAgIHJldHVybiB0aGlzLmNsZWFyKClcbiAgICB9XG5cbiAgICBmb3IgKGkgPSBvZmZzZXRzLmxlbmd0aDsgaS0tOykge1xuICAgICAgYWN0aXZlVGFyZ2V0ICE9IHRhcmdldHNbaV1cbiAgICAgICAgJiYgc2Nyb2xsVG9wID49IG9mZnNldHNbaV1cbiAgICAgICAgJiYgKG9mZnNldHNbaSArIDFdID09PSB1bmRlZmluZWQgfHwgc2Nyb2xsVG9wIDwgb2Zmc2V0c1tpICsgMV0pXG4gICAgICAgICYmIHRoaXMuYWN0aXZhdGUodGFyZ2V0c1tpXSlcbiAgICB9XG4gIH1cblxuICBTY3JvbGxTcHkucHJvdG90eXBlLmFjdGl2YXRlID0gZnVuY3Rpb24gKHRhcmdldCkge1xuICAgIHRoaXMuYWN0aXZlVGFyZ2V0ID0gdGFyZ2V0XG5cbiAgICB0aGlzLmNsZWFyKClcblxuICAgIHZhciBzZWxlY3RvciA9IHRoaXMuc2VsZWN0b3IgK1xuICAgICAgJ1tkYXRhLXRhcmdldD1cIicgKyB0YXJnZXQgKyAnXCJdLCcgK1xuICAgICAgdGhpcy5zZWxlY3RvciArICdbaHJlZj1cIicgKyB0YXJnZXQgKyAnXCJdJ1xuXG4gICAgdmFyIGFjdGl2ZSA9ICQoc2VsZWN0b3IpXG4gICAgICAucGFyZW50cygnbGknKVxuICAgICAgLmFkZENsYXNzKCdhY3RpdmUnKVxuXG4gICAgaWYgKGFjdGl2ZS5wYXJlbnQoJy5kcm9wZG93bi1tZW51JykubGVuZ3RoKSB7XG4gICAgICBhY3RpdmUgPSBhY3RpdmVcbiAgICAgICAgLmNsb3Nlc3QoJ2xpLmRyb3Bkb3duJylcbiAgICAgICAgLmFkZENsYXNzKCdhY3RpdmUnKVxuICAgIH1cblxuICAgIGFjdGl2ZS50cmlnZ2VyKCdhY3RpdmF0ZS5icy5zY3JvbGxzcHknKVxuICB9XG5cbiAgU2Nyb2xsU3B5LnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uICgpIHtcbiAgICAkKHRoaXMuc2VsZWN0b3IpXG4gICAgICAucGFyZW50c1VudGlsKHRoaXMub3B0aW9ucy50YXJnZXQsICcuYWN0aXZlJylcbiAgICAgIC5yZW1vdmVDbGFzcygnYWN0aXZlJylcbiAgfVxuXG5cbiAgLy8gU0NST0xMU1BZIFBMVUdJTiBERUZJTklUSU9OXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gIGZ1bmN0aW9uIFBsdWdpbihvcHRpb24pIHtcbiAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciAkdGhpcyAgID0gJCh0aGlzKVxuICAgICAgdmFyIGRhdGEgICAgPSAkdGhpcy5kYXRhKCdicy5zY3JvbGxzcHknKVxuICAgICAgdmFyIG9wdGlvbnMgPSB0eXBlb2Ygb3B0aW9uID09ICdvYmplY3QnICYmIG9wdGlvblxuXG4gICAgICBpZiAoIWRhdGEpICR0aGlzLmRhdGEoJ2JzLnNjcm9sbHNweScsIChkYXRhID0gbmV3IFNjcm9sbFNweSh0aGlzLCBvcHRpb25zKSkpXG4gICAgICBpZiAodHlwZW9mIG9wdGlvbiA9PSAnc3RyaW5nJykgZGF0YVtvcHRpb25dKClcbiAgICB9KVxuICB9XG5cbiAgdmFyIG9sZCA9ICQuZm4uc2Nyb2xsc3B5XG5cbiAgJC5mbi5zY3JvbGxzcHkgICAgICAgICAgICAgPSBQbHVnaW5cbiAgJC5mbi5zY3JvbGxzcHkuQ29uc3RydWN0b3IgPSBTY3JvbGxTcHlcblxuXG4gIC8vIFNDUk9MTFNQWSBOTyBDT05GTElDVFxuICAvLyA9PT09PT09PT09PT09PT09PT09PT1cblxuICAkLmZuLnNjcm9sbHNweS5ub0NvbmZsaWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICQuZm4uc2Nyb2xsc3B5ID0gb2xkXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG5cbiAgLy8gU0NST0xMU1BZIERBVEEtQVBJXG4gIC8vID09PT09PT09PT09PT09PT09PVxuXG4gICQod2luZG93KS5vbignbG9hZC5icy5zY3JvbGxzcHkuZGF0YS1hcGknLCBmdW5jdGlvbiAoKSB7XG4gICAgJCgnW2RhdGEtc3B5PVwic2Nyb2xsXCJdJykuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgJHNweSA9ICQodGhpcylcbiAgICAgIFBsdWdpbi5jYWxsKCRzcHksICRzcHkuZGF0YSgpKVxuICAgIH0pXG4gIH0pXG5cbn0oalF1ZXJ5KTtcblxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBCb290c3RyYXA6IHRhYi5qcyB2My40LjFcbiAqIGh0dHBzOi8vZ2V0Ym9vdHN0cmFwLmNvbS9kb2NzLzMuNC9qYXZhc2NyaXB0LyN0YWJzXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIENvcHlyaWdodCAyMDExLTIwMTkgVHdpdHRlciwgSW5jLlxuICogTGljZW5zZWQgdW5kZXIgTUlUIChodHRwczovL2dpdGh1Yi5jb20vdHdicy9ib290c3RyYXAvYmxvYi9tYXN0ZXIvTElDRU5TRSlcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqL1xuXG5cbitmdW5jdGlvbiAoJCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgLy8gVEFCIENMQVNTIERFRklOSVRJT05cbiAgLy8gPT09PT09PT09PT09PT09PT09PT1cblxuICB2YXIgVGFiID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICAvLyBqc2NzOmRpc2FibGUgcmVxdWlyZURvbGxhckJlZm9yZWpRdWVyeUFzc2lnbm1lbnRcbiAgICB0aGlzLmVsZW1lbnQgPSAkKGVsZW1lbnQpXG4gICAgLy8ganNjczplbmFibGUgcmVxdWlyZURvbGxhckJlZm9yZWpRdWVyeUFzc2lnbm1lbnRcbiAgfVxuXG4gIFRhYi5WRVJTSU9OID0gJzMuNC4xJ1xuXG4gIFRhYi5UUkFOU0lUSU9OX0RVUkFUSU9OID0gMTUwXG5cbiAgVGFiLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciAkdGhpcyAgICA9IHRoaXMuZWxlbWVudFxuICAgIHZhciAkdWwgICAgICA9ICR0aGlzLmNsb3Nlc3QoJ3VsOm5vdCguZHJvcGRvd24tbWVudSknKVxuICAgIHZhciBzZWxlY3RvciA9ICR0aGlzLmRhdGEoJ3RhcmdldCcpXG5cbiAgICBpZiAoIXNlbGVjdG9yKSB7XG4gICAgICBzZWxlY3RvciA9ICR0aGlzLmF0dHIoJ2hyZWYnKVxuICAgICAgc2VsZWN0b3IgPSBzZWxlY3RvciAmJiBzZWxlY3Rvci5yZXBsYWNlKC8uKig/PSNbXlxcc10qJCkvLCAnJykgLy8gc3RyaXAgZm9yIGllN1xuICAgIH1cblxuICAgIGlmICgkdGhpcy5wYXJlbnQoJ2xpJykuaGFzQ2xhc3MoJ2FjdGl2ZScpKSByZXR1cm5cblxuICAgIHZhciAkcHJldmlvdXMgPSAkdWwuZmluZCgnLmFjdGl2ZTpsYXN0IGEnKVxuICAgIHZhciBoaWRlRXZlbnQgPSAkLkV2ZW50KCdoaWRlLmJzLnRhYicsIHtcbiAgICAgIHJlbGF0ZWRUYXJnZXQ6ICR0aGlzWzBdXG4gICAgfSlcbiAgICB2YXIgc2hvd0V2ZW50ID0gJC5FdmVudCgnc2hvdy5icy50YWInLCB7XG4gICAgICByZWxhdGVkVGFyZ2V0OiAkcHJldmlvdXNbMF1cbiAgICB9KVxuXG4gICAgJHByZXZpb3VzLnRyaWdnZXIoaGlkZUV2ZW50KVxuICAgICR0aGlzLnRyaWdnZXIoc2hvd0V2ZW50KVxuXG4gICAgaWYgKHNob3dFdmVudC5pc0RlZmF1bHRQcmV2ZW50ZWQoKSB8fCBoaWRlRXZlbnQuaXNEZWZhdWx0UHJldmVudGVkKCkpIHJldHVyblxuXG4gICAgdmFyICR0YXJnZXQgPSAkKGRvY3VtZW50KS5maW5kKHNlbGVjdG9yKVxuXG4gICAgdGhpcy5hY3RpdmF0ZSgkdGhpcy5jbG9zZXN0KCdsaScpLCAkdWwpXG4gICAgdGhpcy5hY3RpdmF0ZSgkdGFyZ2V0LCAkdGFyZ2V0LnBhcmVudCgpLCBmdW5jdGlvbiAoKSB7XG4gICAgICAkcHJldmlvdXMudHJpZ2dlcih7XG4gICAgICAgIHR5cGU6ICdoaWRkZW4uYnMudGFiJyxcbiAgICAgICAgcmVsYXRlZFRhcmdldDogJHRoaXNbMF1cbiAgICAgIH0pXG4gICAgICAkdGhpcy50cmlnZ2VyKHtcbiAgICAgICAgdHlwZTogJ3Nob3duLmJzLnRhYicsXG4gICAgICAgIHJlbGF0ZWRUYXJnZXQ6ICRwcmV2aW91c1swXVxuICAgICAgfSlcbiAgICB9KVxuICB9XG5cbiAgVGFiLnByb3RvdHlwZS5hY3RpdmF0ZSA9IGZ1bmN0aW9uIChlbGVtZW50LCBjb250YWluZXIsIGNhbGxiYWNrKSB7XG4gICAgdmFyICRhY3RpdmUgICAgPSBjb250YWluZXIuZmluZCgnPiAuYWN0aXZlJylcbiAgICB2YXIgdHJhbnNpdGlvbiA9IGNhbGxiYWNrXG4gICAgICAmJiAkLnN1cHBvcnQudHJhbnNpdGlvblxuICAgICAgJiYgKCRhY3RpdmUubGVuZ3RoICYmICRhY3RpdmUuaGFzQ2xhc3MoJ2ZhZGUnKSB8fCAhIWNvbnRhaW5lci5maW5kKCc+IC5mYWRlJykubGVuZ3RoKVxuXG4gICAgZnVuY3Rpb24gbmV4dCgpIHtcbiAgICAgICRhY3RpdmVcbiAgICAgICAgLnJlbW92ZUNsYXNzKCdhY3RpdmUnKVxuICAgICAgICAuZmluZCgnPiAuZHJvcGRvd24tbWVudSA+IC5hY3RpdmUnKVxuICAgICAgICAucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpXG4gICAgICAgIC5lbmQoKVxuICAgICAgICAuZmluZCgnW2RhdGEtdG9nZ2xlPVwidGFiXCJdJylcbiAgICAgICAgLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCBmYWxzZSlcblxuICAgICAgZWxlbWVudFxuICAgICAgICAuYWRkQ2xhc3MoJ2FjdGl2ZScpXG4gICAgICAgIC5maW5kKCdbZGF0YS10b2dnbGU9XCJ0YWJcIl0nKVxuICAgICAgICAuYXR0cignYXJpYS1leHBhbmRlZCcsIHRydWUpXG5cbiAgICAgIGlmICh0cmFuc2l0aW9uKSB7XG4gICAgICAgIGVsZW1lbnRbMF0ub2Zmc2V0V2lkdGggLy8gcmVmbG93IGZvciB0cmFuc2l0aW9uXG4gICAgICAgIGVsZW1lbnQuYWRkQ2xhc3MoJ2luJylcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVsZW1lbnQucmVtb3ZlQ2xhc3MoJ2ZhZGUnKVxuICAgICAgfVxuXG4gICAgICBpZiAoZWxlbWVudC5wYXJlbnQoJy5kcm9wZG93bi1tZW51JykubGVuZ3RoKSB7XG4gICAgICAgIGVsZW1lbnRcbiAgICAgICAgICAuY2xvc2VzdCgnbGkuZHJvcGRvd24nKVxuICAgICAgICAgIC5hZGRDbGFzcygnYWN0aXZlJylcbiAgICAgICAgICAuZW5kKClcbiAgICAgICAgICAuZmluZCgnW2RhdGEtdG9nZ2xlPVwidGFiXCJdJylcbiAgICAgICAgICAuYXR0cignYXJpYS1leHBhbmRlZCcsIHRydWUpXG4gICAgICB9XG5cbiAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKClcbiAgICB9XG5cbiAgICAkYWN0aXZlLmxlbmd0aCAmJiB0cmFuc2l0aW9uID9cbiAgICAgICRhY3RpdmVcbiAgICAgICAgLm9uZSgnYnNUcmFuc2l0aW9uRW5kJywgbmV4dClcbiAgICAgICAgLmVtdWxhdGVUcmFuc2l0aW9uRW5kKFRhYi5UUkFOU0lUSU9OX0RVUkFUSU9OKSA6XG4gICAgICBuZXh0KClcblxuICAgICRhY3RpdmUucmVtb3ZlQ2xhc3MoJ2luJylcbiAgfVxuXG5cbiAgLy8gVEFCIFBMVUdJTiBERUZJTklUSU9OXG4gIC8vID09PT09PT09PT09PT09PT09PT09PVxuXG4gIGZ1bmN0aW9uIFBsdWdpbihvcHRpb24pIHtcbiAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciAkdGhpcyA9ICQodGhpcylcbiAgICAgIHZhciBkYXRhICA9ICR0aGlzLmRhdGEoJ2JzLnRhYicpXG5cbiAgICAgIGlmICghZGF0YSkgJHRoaXMuZGF0YSgnYnMudGFiJywgKGRhdGEgPSBuZXcgVGFiKHRoaXMpKSlcbiAgICAgIGlmICh0eXBlb2Ygb3B0aW9uID09ICdzdHJpbmcnKSBkYXRhW29wdGlvbl0oKVxuICAgIH0pXG4gIH1cblxuICB2YXIgb2xkID0gJC5mbi50YWJcblxuICAkLmZuLnRhYiAgICAgICAgICAgICA9IFBsdWdpblxuICAkLmZuLnRhYi5Db25zdHJ1Y3RvciA9IFRhYlxuXG5cbiAgLy8gVEFCIE5PIENPTkZMSUNUXG4gIC8vID09PT09PT09PT09PT09PVxuXG4gICQuZm4udGFiLm5vQ29uZmxpY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgJC5mbi50YWIgPSBvbGRcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cblxuICAvLyBUQUIgREFUQS1BUElcbiAgLy8gPT09PT09PT09PT09XG5cbiAgdmFyIGNsaWNrSGFuZGxlciA9IGZ1bmN0aW9uIChlKSB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgUGx1Z2luLmNhbGwoJCh0aGlzKSwgJ3Nob3cnKVxuICB9XG5cbiAgJChkb2N1bWVudClcbiAgICAub24oJ2NsaWNrLmJzLnRhYi5kYXRhLWFwaScsICdbZGF0YS10b2dnbGU9XCJ0YWJcIl0nLCBjbGlja0hhbmRsZXIpXG4gICAgLm9uKCdjbGljay5icy50YWIuZGF0YS1hcGknLCAnW2RhdGEtdG9nZ2xlPVwicGlsbFwiXScsIGNsaWNrSGFuZGxlcilcblxufShqUXVlcnkpO1xuXG4vKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIEJvb3RzdHJhcDogYWZmaXguanMgdjMuNC4xXG4gKiBodHRwczovL2dldGJvb3RzdHJhcC5jb20vZG9jcy8zLjQvamF2YXNjcmlwdC8jYWZmaXhcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogQ29weXJpZ2h0IDIwMTEtMjAxOSBUd2l0dGVyLCBJbmMuXG4gKiBMaWNlbnNlZCB1bmRlciBNSVQgKGh0dHBzOi8vZ2l0aHViLmNvbS90d2JzL2Jvb3RzdHJhcC9ibG9iL21hc3Rlci9MSUNFTlNFKVxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovXG5cblxuK2Z1bmN0aW9uICgkKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICAvLyBBRkZJWCBDTEFTUyBERUZJTklUSU9OXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT1cblxuICB2YXIgQWZmaXggPSBmdW5jdGlvbiAoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBBZmZpeC5ERUZBVUxUUywgb3B0aW9ucylcblxuICAgIHZhciB0YXJnZXQgPSB0aGlzLm9wdGlvbnMudGFyZ2V0ID09PSBBZmZpeC5ERUZBVUxUUy50YXJnZXQgPyAkKHRoaXMub3B0aW9ucy50YXJnZXQpIDogJChkb2N1bWVudCkuZmluZCh0aGlzLm9wdGlvbnMudGFyZ2V0KVxuXG4gICAgdGhpcy4kdGFyZ2V0ID0gdGFyZ2V0XG4gICAgICAub24oJ3Njcm9sbC5icy5hZmZpeC5kYXRhLWFwaScsICQucHJveHkodGhpcy5jaGVja1Bvc2l0aW9uLCB0aGlzKSlcbiAgICAgIC5vbignY2xpY2suYnMuYWZmaXguZGF0YS1hcGknLCAgJC5wcm94eSh0aGlzLmNoZWNrUG9zaXRpb25XaXRoRXZlbnRMb29wLCB0aGlzKSlcblxuICAgIHRoaXMuJGVsZW1lbnQgICAgID0gJChlbGVtZW50KVxuICAgIHRoaXMuYWZmaXhlZCAgICAgID0gbnVsbFxuICAgIHRoaXMudW5waW4gICAgICAgID0gbnVsbFxuICAgIHRoaXMucGlubmVkT2Zmc2V0ID0gbnVsbFxuXG4gICAgdGhpcy5jaGVja1Bvc2l0aW9uKClcbiAgfVxuXG4gIEFmZml4LlZFUlNJT04gID0gJzMuNC4xJ1xuXG4gIEFmZml4LlJFU0VUICAgID0gJ2FmZml4IGFmZml4LXRvcCBhZmZpeC1ib3R0b20nXG5cbiAgQWZmaXguREVGQVVMVFMgPSB7XG4gICAgb2Zmc2V0OiAwLFxuICAgIHRhcmdldDogd2luZG93XG4gIH1cblxuICBBZmZpeC5wcm90b3R5cGUuZ2V0U3RhdGUgPSBmdW5jdGlvbiAoc2Nyb2xsSGVpZ2h0LCBoZWlnaHQsIG9mZnNldFRvcCwgb2Zmc2V0Qm90dG9tKSB7XG4gICAgdmFyIHNjcm9sbFRvcCAgICA9IHRoaXMuJHRhcmdldC5zY3JvbGxUb3AoKVxuICAgIHZhciBwb3NpdGlvbiAgICAgPSB0aGlzLiRlbGVtZW50Lm9mZnNldCgpXG4gICAgdmFyIHRhcmdldEhlaWdodCA9IHRoaXMuJHRhcmdldC5oZWlnaHQoKVxuXG4gICAgaWYgKG9mZnNldFRvcCAhPSBudWxsICYmIHRoaXMuYWZmaXhlZCA9PSAndG9wJykgcmV0dXJuIHNjcm9sbFRvcCA8IG9mZnNldFRvcCA/ICd0b3AnIDogZmFsc2VcblxuICAgIGlmICh0aGlzLmFmZml4ZWQgPT0gJ2JvdHRvbScpIHtcbiAgICAgIGlmIChvZmZzZXRUb3AgIT0gbnVsbCkgcmV0dXJuIChzY3JvbGxUb3AgKyB0aGlzLnVucGluIDw9IHBvc2l0aW9uLnRvcCkgPyBmYWxzZSA6ICdib3R0b20nXG4gICAgICByZXR1cm4gKHNjcm9sbFRvcCArIHRhcmdldEhlaWdodCA8PSBzY3JvbGxIZWlnaHQgLSBvZmZzZXRCb3R0b20pID8gZmFsc2UgOiAnYm90dG9tJ1xuICAgIH1cblxuICAgIHZhciBpbml0aWFsaXppbmcgICA9IHRoaXMuYWZmaXhlZCA9PSBudWxsXG4gICAgdmFyIGNvbGxpZGVyVG9wICAgID0gaW5pdGlhbGl6aW5nID8gc2Nyb2xsVG9wIDogcG9zaXRpb24udG9wXG4gICAgdmFyIGNvbGxpZGVySGVpZ2h0ID0gaW5pdGlhbGl6aW5nID8gdGFyZ2V0SGVpZ2h0IDogaGVpZ2h0XG5cbiAgICBpZiAob2Zmc2V0VG9wICE9IG51bGwgJiYgc2Nyb2xsVG9wIDw9IG9mZnNldFRvcCkgcmV0dXJuICd0b3AnXG4gICAgaWYgKG9mZnNldEJvdHRvbSAhPSBudWxsICYmIChjb2xsaWRlclRvcCArIGNvbGxpZGVySGVpZ2h0ID49IHNjcm9sbEhlaWdodCAtIG9mZnNldEJvdHRvbSkpIHJldHVybiAnYm90dG9tJ1xuXG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICBBZmZpeC5wcm90b3R5cGUuZ2V0UGlubmVkT2Zmc2V0ID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLnBpbm5lZE9mZnNldCkgcmV0dXJuIHRoaXMucGlubmVkT2Zmc2V0XG4gICAgdGhpcy4kZWxlbWVudC5yZW1vdmVDbGFzcyhBZmZpeC5SRVNFVCkuYWRkQ2xhc3MoJ2FmZml4JylcbiAgICB2YXIgc2Nyb2xsVG9wID0gdGhpcy4kdGFyZ2V0LnNjcm9sbFRvcCgpXG4gICAgdmFyIHBvc2l0aW9uICA9IHRoaXMuJGVsZW1lbnQub2Zmc2V0KClcbiAgICByZXR1cm4gKHRoaXMucGlubmVkT2Zmc2V0ID0gcG9zaXRpb24udG9wIC0gc2Nyb2xsVG9wKVxuICB9XG5cbiAgQWZmaXgucHJvdG90eXBlLmNoZWNrUG9zaXRpb25XaXRoRXZlbnRMb29wID0gZnVuY3Rpb24gKCkge1xuICAgIHNldFRpbWVvdXQoJC5wcm94eSh0aGlzLmNoZWNrUG9zaXRpb24sIHRoaXMpLCAxKVxuICB9XG5cbiAgQWZmaXgucHJvdG90eXBlLmNoZWNrUG9zaXRpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCF0aGlzLiRlbGVtZW50LmlzKCc6dmlzaWJsZScpKSByZXR1cm5cblxuICAgIHZhciBoZWlnaHQgICAgICAgPSB0aGlzLiRlbGVtZW50LmhlaWdodCgpXG4gICAgdmFyIG9mZnNldCAgICAgICA9IHRoaXMub3B0aW9ucy5vZmZzZXRcbiAgICB2YXIgb2Zmc2V0VG9wICAgID0gb2Zmc2V0LnRvcFxuICAgIHZhciBvZmZzZXRCb3R0b20gPSBvZmZzZXQuYm90dG9tXG4gICAgdmFyIHNjcm9sbEhlaWdodCA9IE1hdGgubWF4KCQoZG9jdW1lbnQpLmhlaWdodCgpLCAkKGRvY3VtZW50LmJvZHkpLmhlaWdodCgpKVxuXG4gICAgaWYgKHR5cGVvZiBvZmZzZXQgIT0gJ29iamVjdCcpICAgICAgICAgb2Zmc2V0Qm90dG9tID0gb2Zmc2V0VG9wID0gb2Zmc2V0XG4gICAgaWYgKHR5cGVvZiBvZmZzZXRUb3AgPT0gJ2Z1bmN0aW9uJykgICAgb2Zmc2V0VG9wICAgID0gb2Zmc2V0LnRvcCh0aGlzLiRlbGVtZW50KVxuICAgIGlmICh0eXBlb2Ygb2Zmc2V0Qm90dG9tID09ICdmdW5jdGlvbicpIG9mZnNldEJvdHRvbSA9IG9mZnNldC5ib3R0b20odGhpcy4kZWxlbWVudClcblxuICAgIHZhciBhZmZpeCA9IHRoaXMuZ2V0U3RhdGUoc2Nyb2xsSGVpZ2h0LCBoZWlnaHQsIG9mZnNldFRvcCwgb2Zmc2V0Qm90dG9tKVxuXG4gICAgaWYgKHRoaXMuYWZmaXhlZCAhPSBhZmZpeCkge1xuICAgICAgaWYgKHRoaXMudW5waW4gIT0gbnVsbCkgdGhpcy4kZWxlbWVudC5jc3MoJ3RvcCcsICcnKVxuXG4gICAgICB2YXIgYWZmaXhUeXBlID0gJ2FmZml4JyArIChhZmZpeCA/ICctJyArIGFmZml4IDogJycpXG4gICAgICB2YXIgZSAgICAgICAgID0gJC5FdmVudChhZmZpeFR5cGUgKyAnLmJzLmFmZml4JylcblxuICAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKGUpXG5cbiAgICAgIGlmIChlLmlzRGVmYXVsdFByZXZlbnRlZCgpKSByZXR1cm5cblxuICAgICAgdGhpcy5hZmZpeGVkID0gYWZmaXhcbiAgICAgIHRoaXMudW5waW4gPSBhZmZpeCA9PSAnYm90dG9tJyA/IHRoaXMuZ2V0UGlubmVkT2Zmc2V0KCkgOiBudWxsXG5cbiAgICAgIHRoaXMuJGVsZW1lbnRcbiAgICAgICAgLnJlbW92ZUNsYXNzKEFmZml4LlJFU0VUKVxuICAgICAgICAuYWRkQ2xhc3MoYWZmaXhUeXBlKVxuICAgICAgICAudHJpZ2dlcihhZmZpeFR5cGUucmVwbGFjZSgnYWZmaXgnLCAnYWZmaXhlZCcpICsgJy5icy5hZmZpeCcpXG4gICAgfVxuXG4gICAgaWYgKGFmZml4ID09ICdib3R0b20nKSB7XG4gICAgICB0aGlzLiRlbGVtZW50Lm9mZnNldCh7XG4gICAgICAgIHRvcDogc2Nyb2xsSGVpZ2h0IC0gaGVpZ2h0IC0gb2Zmc2V0Qm90dG9tXG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG5cbiAgLy8gQUZGSVggUExVR0lOIERFRklOSVRJT05cbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT1cblxuICBmdW5jdGlvbiBQbHVnaW4ob3B0aW9uKSB7XG4gICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgJHRoaXMgICA9ICQodGhpcylcbiAgICAgIHZhciBkYXRhICAgID0gJHRoaXMuZGF0YSgnYnMuYWZmaXgnKVxuICAgICAgdmFyIG9wdGlvbnMgPSB0eXBlb2Ygb3B0aW9uID09ICdvYmplY3QnICYmIG9wdGlvblxuXG4gICAgICBpZiAoIWRhdGEpICR0aGlzLmRhdGEoJ2JzLmFmZml4JywgKGRhdGEgPSBuZXcgQWZmaXgodGhpcywgb3B0aW9ucykpKVxuICAgICAgaWYgKHR5cGVvZiBvcHRpb24gPT0gJ3N0cmluZycpIGRhdGFbb3B0aW9uXSgpXG4gICAgfSlcbiAgfVxuXG4gIHZhciBvbGQgPSAkLmZuLmFmZml4XG5cbiAgJC5mbi5hZmZpeCAgICAgICAgICAgICA9IFBsdWdpblxuICAkLmZuLmFmZml4LkNvbnN0cnVjdG9yID0gQWZmaXhcblxuXG4gIC8vIEFGRklYIE5PIENPTkZMSUNUXG4gIC8vID09PT09PT09PT09PT09PT09XG5cbiAgJC5mbi5hZmZpeC5ub0NvbmZsaWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICQuZm4uYWZmaXggPSBvbGRcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cblxuICAvLyBBRkZJWCBEQVRBLUFQSVxuICAvLyA9PT09PT09PT09PT09PVxuXG4gICQod2luZG93KS5vbignbG9hZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAkKCdbZGF0YS1zcHk9XCJhZmZpeFwiXScpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgdmFyICRzcHkgPSAkKHRoaXMpXG4gICAgICB2YXIgZGF0YSA9ICRzcHkuZGF0YSgpXG5cbiAgICAgIGRhdGEub2Zmc2V0ID0gZGF0YS5vZmZzZXQgfHwge31cblxuICAgICAgaWYgKGRhdGEub2Zmc2V0Qm90dG9tICE9IG51bGwpIGRhdGEub2Zmc2V0LmJvdHRvbSA9IGRhdGEub2Zmc2V0Qm90dG9tXG4gICAgICBpZiAoZGF0YS5vZmZzZXRUb3AgICAgIT0gbnVsbCkgZGF0YS5vZmZzZXQudG9wICAgID0gZGF0YS5vZmZzZXRUb3BcblxuICAgICAgUGx1Z2luLmNhbGwoJHNweSwgZGF0YSlcbiAgICB9KVxuICB9KVxuXG59KGpRdWVyeSk7XG4iLCIvLyB8LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIHwgRmxleHkgaGVhZGVyXG4vLyB8LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIHxcbi8vIHwgVGhpcyBqUXVlcnkgc2NyaXB0IGlzIHdyaXR0ZW4gYnlcbi8vIHxcbi8vIHwgTW9ydGVuIE5pc3NlblxuLy8gfCBoamVtbWVzaWRla29uZ2VuLmRrXG4vLyB8XG5cbnZhciBmbGV4eV9oZWFkZXIgPSAoZnVuY3Rpb24gKCQpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgcHViID0ge30sXG4gICAgICAgICRoZWFkZXJfc3RhdGljID0gJCgnLmZsZXh5LWhlYWRlci0tc3RhdGljJyksXG4gICAgICAgICRoZWFkZXJfc3RpY2t5ID0gJCgnLmZsZXh5LWhlYWRlci0tc3RpY2t5JyksXG4gICAgICAgIG9wdGlvbnMgPSB7XG4gICAgICAgICAgICB1cGRhdGVfaW50ZXJ2YWw6IDEwMCxcbiAgICAgICAgICAgIHRvbGVyYW5jZToge1xuICAgICAgICAgICAgICAgIHVwd2FyZDogMjAsXG4gICAgICAgICAgICAgICAgZG93bndhcmQ6IDEwXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb2Zmc2V0OiBfZ2V0X29mZnNldF9mcm9tX2VsZW1lbnRzX2JvdHRvbSgkaGVhZGVyX3N0YXRpYyksXG4gICAgICAgICAgICBjbGFzc2VzOiB7XG4gICAgICAgICAgICAgICAgcGlubmVkOiBcImZsZXh5LWhlYWRlci0tcGlubmVkXCIsXG4gICAgICAgICAgICAgICAgdW5waW5uZWQ6IFwiZmxleHktaGVhZGVyLS11bnBpbm5lZFwiXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHdhc19zY3JvbGxlZCA9IGZhbHNlLFxuICAgICAgICBsYXN0X2Rpc3RhbmNlX2Zyb21fdG9wID0gMDtcblxuICAgIC8qKlxuICAgICAqIEluc3RhbnRpYXRlXG4gICAgICovXG4gICAgcHViLmluaXQgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICByZWdpc3RlckV2ZW50SGFuZGxlcnMoKTtcbiAgICAgICAgcmVnaXN0ZXJCb290RXZlbnRIYW5kbGVycygpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBSZWdpc3RlciBib290IGV2ZW50IGhhbmRsZXJzXG4gICAgICovXG4gICAgZnVuY3Rpb24gcmVnaXN0ZXJCb290RXZlbnRIYW5kbGVycygpIHtcbiAgICAgICAgJGhlYWRlcl9zdGlja3kuYWRkQ2xhc3Mob3B0aW9ucy5jbGFzc2VzLnVucGlubmVkKTtcblxuICAgICAgICBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgaWYgKHdhc19zY3JvbGxlZCkge1xuICAgICAgICAgICAgICAgIGRvY3VtZW50X3dhc19zY3JvbGxlZCgpO1xuXG4gICAgICAgICAgICAgICAgd2FzX3Njcm9sbGVkID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIG9wdGlvbnMudXBkYXRlX2ludGVydmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZWdpc3RlciBldmVudCBoYW5kbGVyc1xuICAgICAqL1xuICAgIGZ1bmN0aW9uIHJlZ2lzdGVyRXZlbnRIYW5kbGVycygpIHtcbiAgICAgICAgJCh3aW5kb3cpLnNjcm9sbChmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgd2FzX3Njcm9sbGVkID0gdHJ1ZTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IG9mZnNldCBmcm9tIGVsZW1lbnQgYm90dG9tXG4gICAgICovXG4gICAgZnVuY3Rpb24gX2dldF9vZmZzZXRfZnJvbV9lbGVtZW50c19ib3R0b20oJGVsZW1lbnQpIHtcbiAgICAgICAgdmFyIGVsZW1lbnRfaGVpZ2h0ID0gJGVsZW1lbnQub3V0ZXJIZWlnaHQodHJ1ZSksXG4gICAgICAgICAgICBlbGVtZW50X29mZnNldCA9ICRlbGVtZW50Lm9mZnNldCgpLnRvcDtcblxuICAgICAgICByZXR1cm4gKGVsZW1lbnRfaGVpZ2h0ICsgZWxlbWVudF9vZmZzZXQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERvY3VtZW50IHdhcyBzY3JvbGxlZFxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGRvY3VtZW50X3dhc19zY3JvbGxlZCgpIHtcbiAgICAgICAgdmFyIGN1cnJlbnRfZGlzdGFuY2VfZnJvbV90b3AgPSAkKHdpbmRvdykuc2Nyb2xsVG9wKCk7XG5cbiAgICAgICAgLy8gSWYgcGFzdCBvZmZzZXRcbiAgICAgICAgaWYgKGN1cnJlbnRfZGlzdGFuY2VfZnJvbV90b3AgPj0gb3B0aW9ucy5vZmZzZXQpIHtcblxuICAgICAgICAgICAgLy8gRG93bndhcmRzIHNjcm9sbFxuICAgICAgICAgICAgaWYgKGN1cnJlbnRfZGlzdGFuY2VfZnJvbV90b3AgPiBsYXN0X2Rpc3RhbmNlX2Zyb21fdG9wKSB7XG5cbiAgICAgICAgICAgICAgICAvLyBPYmV5IHRoZSBkb3dud2FyZCB0b2xlcmFuY2VcbiAgICAgICAgICAgICAgICBpZiAoTWF0aC5hYnMoY3VycmVudF9kaXN0YW5jZV9mcm9tX3RvcCAtIGxhc3RfZGlzdGFuY2VfZnJvbV90b3ApIDw9IG9wdGlvbnMudG9sZXJhbmNlLmRvd253YXJkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAkaGVhZGVyX3N0aWNreS5yZW1vdmVDbGFzcyhvcHRpb25zLmNsYXNzZXMucGlubmVkKS5hZGRDbGFzcyhvcHRpb25zLmNsYXNzZXMudW5waW5uZWQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBVcHdhcmRzIHNjcm9sbFxuICAgICAgICAgICAgZWxzZSB7XG5cbiAgICAgICAgICAgICAgICAvLyBPYmV5IHRoZSB1cHdhcmQgdG9sZXJhbmNlXG4gICAgICAgICAgICAgICAgaWYgKE1hdGguYWJzKGN1cnJlbnRfZGlzdGFuY2VfZnJvbV90b3AgLSBsYXN0X2Rpc3RhbmNlX2Zyb21fdG9wKSA8PSBvcHRpb25zLnRvbGVyYW5jZS51cHdhcmQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIFdlIGFyZSBub3Qgc2Nyb2xsZWQgcGFzdCB0aGUgZG9jdW1lbnQgd2hpY2ggaXMgcG9zc2libGUgb24gdGhlIE1hY1xuICAgICAgICAgICAgICAgIGlmICgoY3VycmVudF9kaXN0YW5jZV9mcm9tX3RvcCArICQod2luZG93KS5oZWlnaHQoKSkgPCAkKGRvY3VtZW50KS5oZWlnaHQoKSkge1xuICAgICAgICAgICAgICAgICAgICAkaGVhZGVyX3N0aWNreS5yZW1vdmVDbGFzcyhvcHRpb25zLmNsYXNzZXMudW5waW5uZWQpLmFkZENsYXNzKG9wdGlvbnMuY2xhc3Nlcy5waW5uZWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE5vdCBwYXN0IG9mZnNldFxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICRoZWFkZXJfc3RpY2t5LnJlbW92ZUNsYXNzKG9wdGlvbnMuY2xhc3Nlcy5waW5uZWQpLmFkZENsYXNzKG9wdGlvbnMuY2xhc3Nlcy51bnBpbm5lZCk7XG4gICAgICAgIH1cblxuICAgICAgICBsYXN0X2Rpc3RhbmNlX2Zyb21fdG9wID0gY3VycmVudF9kaXN0YW5jZV9mcm9tX3RvcDtcbiAgICB9XG5cbiAgICByZXR1cm4gcHViO1xufSkoalF1ZXJ5KTtcbiIsIi8vIHwtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gfCBGbGV4eSBuYXZpZ2F0aW9uXG4vLyB8LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIHxcbi8vIHwgVGhpcyBqUXVlcnkgc2NyaXB0IGlzIHdyaXR0ZW4gYnlcbi8vIHxcbi8vIHwgTW9ydGVuIE5pc3NlblxuLy8gfCBoamVtbWVzaWRla29uZ2VuLmRrXG4vLyB8XG5cbnZhciBmbGV4eV9uYXZpZ2F0aW9uID0gKGZ1bmN0aW9uICgkKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIHB1YiA9IHt9LFxuICAgICAgICBsYXlvdXRfY2xhc3NlcyA9IHtcbiAgICAgICAgICAgICduYXZpZ2F0aW9uJzogJy5mbGV4eS1uYXZpZ2F0aW9uJyxcbiAgICAgICAgICAgICdvYmZ1c2NhdG9yJzogJy5mbGV4eS1uYXZpZ2F0aW9uX19vYmZ1c2NhdG9yJyxcbiAgICAgICAgICAgICdkcm9wZG93bic6ICcuZmxleHktbmF2aWdhdGlvbl9faXRlbS0tZHJvcGRvd24nLFxuICAgICAgICAgICAgJ2Ryb3Bkb3duX21lZ2FtZW51JzogJy5mbGV4eS1uYXZpZ2F0aW9uX19pdGVtX19kcm9wZG93bi1tZWdhbWVudScsXG5cbiAgICAgICAgICAgICdpc191cGdyYWRlZCc6ICdpcy11cGdyYWRlZCcsXG4gICAgICAgICAgICAnbmF2aWdhdGlvbl9oYXNfbWVnYW1lbnUnOiAnaGFzLW1lZ2FtZW51JyxcbiAgICAgICAgICAgICdkcm9wZG93bl9oYXNfbWVnYW1lbnUnOiAnZmxleHktbmF2aWdhdGlvbl9faXRlbS0tZHJvcGRvd24td2l0aC1tZWdhbWVudScsXG4gICAgICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBJbnN0YW50aWF0ZVxuICAgICAqL1xuICAgIHB1Yi5pbml0ID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgcmVnaXN0ZXJFdmVudEhhbmRsZXJzKCk7XG4gICAgICAgIHJlZ2lzdGVyQm9vdEV2ZW50SGFuZGxlcnMoKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUmVnaXN0ZXIgYm9vdCBldmVudCBoYW5kbGVyc1xuICAgICAqL1xuICAgIGZ1bmN0aW9uIHJlZ2lzdGVyQm9vdEV2ZW50SGFuZGxlcnMoKSB7XG5cbiAgICAgICAgLy8gVXBncmFkZVxuICAgICAgICB1cGdyYWRlKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVnaXN0ZXIgZXZlbnQgaGFuZGxlcnNcbiAgICAgKi9cbiAgICBmdW5jdGlvbiByZWdpc3RlckV2ZW50SGFuZGxlcnMoKSB7fVxuXG4gICAgLyoqXG4gICAgICogVXBncmFkZSBlbGVtZW50cy5cbiAgICAgKiBBZGQgY2xhc3NlcyB0byBlbGVtZW50cywgYmFzZWQgdXBvbiBhdHRhY2hlZCBjbGFzc2VzLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHVwZ3JhZGUoKSB7XG4gICAgICAgIHZhciAkbmF2aWdhdGlvbnMgPSAkKGxheW91dF9jbGFzc2VzLm5hdmlnYXRpb24pO1xuXG4gICAgICAgIC8vIE5hdmlnYXRpb25zXG4gICAgICAgIGlmICgkbmF2aWdhdGlvbnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgJG5hdmlnYXRpb25zLmVhY2goZnVuY3Rpb24oaW5kZXgsIGVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICB2YXIgJG5hdmlnYXRpb24gPSAkKHRoaXMpLFxuICAgICAgICAgICAgICAgICAgICAkbWVnYW1lbnVzID0gJG5hdmlnYXRpb24uZmluZChsYXlvdXRfY2xhc3Nlcy5kcm9wZG93bl9tZWdhbWVudSksXG4gICAgICAgICAgICAgICAgICAgICRkcm9wZG93bl9tZWdhbWVudSA9ICRuYXZpZ2F0aW9uLmZpbmQobGF5b3V0X2NsYXNzZXMuZHJvcGRvd25faGFzX21lZ2FtZW51KTtcblxuICAgICAgICAgICAgICAgIC8vIEhhcyBhbHJlYWR5IGJlZW4gdXBncmFkZWRcbiAgICAgICAgICAgICAgICBpZiAoJG5hdmlnYXRpb24uaGFzQ2xhc3MobGF5b3V0X2NsYXNzZXMuaXNfdXBncmFkZWQpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBIYXMgbWVnYW1lbnVcbiAgICAgICAgICAgICAgICBpZiAoJG1lZ2FtZW51cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICRuYXZpZ2F0aW9uLmFkZENsYXNzKGxheW91dF9jbGFzc2VzLm5hdmlnYXRpb25faGFzX21lZ2FtZW51KTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBSdW4gdGhyb3VnaCBhbGwgbWVnYW1lbnVzXG4gICAgICAgICAgICAgICAgICAgICRtZWdhbWVudXMuZWFjaChmdW5jdGlvbihpbmRleCwgZWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyICRtZWdhbWVudSA9ICQodGhpcyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFzX29iZnVzY2F0b3IgPSAkKCdodG1sJykuaGFzQ2xhc3MoJ2hhcy1vYmZ1c2NhdG9yJykgPyB0cnVlIDogZmFsc2U7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICRtZWdhbWVudS5wYXJlbnRzKGxheW91dF9jbGFzc2VzLmRyb3Bkb3duKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hZGRDbGFzcyhsYXlvdXRfY2xhc3Nlcy5kcm9wZG93bl9oYXNfbWVnYW1lbnUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmhvdmVyKGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChoYXNfb2JmdXNjYXRvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2JmdXNjYXRvci5zaG93KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChoYXNfb2JmdXNjYXRvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2JmdXNjYXRvci5oaWRlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gSXMgdXBncmFkZWRcbiAgICAgICAgICAgICAgICAkbmF2aWdhdGlvbi5hZGRDbGFzcyhsYXlvdXRfY2xhc3Nlcy5pc191cGdyYWRlZCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBwdWI7XG59KShqUXVlcnkpO1xuIiwiLyohIHNpZHIgLSB2Mi4yLjEgLSAyMDE2LTAyLTE3XG4gKiBodHRwOi8vd3d3LmJlcnJpYXJ0LmNvbS9zaWRyL1xuICogQ29weXJpZ2h0IChjKSAyMDEzLTIwMTYgQWxiZXJ0byBWYXJlbGE7IExpY2Vuc2VkIE1JVCAqL1xuXG4oZnVuY3Rpb24gKCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgdmFyIGJhYmVsSGVscGVycyA9IHt9O1xuXG4gIGJhYmVsSGVscGVycy5jbGFzc0NhbGxDaGVjayA9IGZ1bmN0aW9uIChpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHtcbiAgICBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTtcbiAgICB9XG4gIH07XG5cbiAgYmFiZWxIZWxwZXJzLmNyZWF0ZUNsYXNzID0gZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldO1xuICAgICAgICBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7XG4gICAgICAgIGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTtcbiAgICAgICAgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7XG4gICAgICBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpO1xuICAgICAgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7XG4gICAgICByZXR1cm4gQ29uc3RydWN0b3I7XG4gICAgfTtcbiAgfSgpO1xuXG4gIGJhYmVsSGVscGVycztcblxuICB2YXIgc2lkclN0YXR1cyA9IHtcbiAgICBtb3Zpbmc6IGZhbHNlLFxuICAgIG9wZW5lZDogZmFsc2VcbiAgfTtcblxuICB2YXIgaGVscGVyID0ge1xuICAgIC8vIENoZWNrIGZvciB2YWxpZHMgdXJsc1xuICAgIC8vIEZyb20gOiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzU3MTcwOTMvY2hlY2staWYtYS1qYXZhc2NyaXB0LXN0cmluZy1pcy1hbi11cmxcblxuICAgIGlzVXJsOiBmdW5jdGlvbiBpc1VybChzdHIpIHtcbiAgICAgIHZhciBwYXR0ZXJuID0gbmV3IFJlZ0V4cCgnXihodHRwcz86XFxcXC9cXFxcLyk/JyArIC8vIHByb3RvY29sXG4gICAgICAnKCgoW2EtelxcXFxkXShbYS16XFxcXGQtXSpbYS16XFxcXGRdKSopXFxcXC4/KStbYS16XXsyLH18JyArIC8vIGRvbWFpbiBuYW1lXG4gICAgICAnKChcXFxcZHsxLDN9XFxcXC4pezN9XFxcXGR7MSwzfSkpJyArIC8vIE9SIGlwICh2NCkgYWRkcmVzc1xuICAgICAgJyhcXFxcOlxcXFxkKyk/KFxcXFwvWy1hLXpcXFxcZCVfLn4rXSopKicgKyAvLyBwb3J0IGFuZCBwYXRoXG4gICAgICAnKFxcXFw/WzsmYS16XFxcXGQlXy5+Kz0tXSopPycgKyAvLyBxdWVyeSBzdHJpbmdcbiAgICAgICcoXFxcXCNbLWEtelxcXFxkX10qKT8kJywgJ2knKTsgLy8gZnJhZ21lbnQgbG9jYXRvclxuXG4gICAgICBpZiAocGF0dGVybi50ZXN0KHN0cikpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfSxcblxuXG4gICAgLy8gQWRkIHNpZHIgcHJlZml4ZXNcbiAgICBhZGRQcmVmaXhlczogZnVuY3Rpb24gYWRkUHJlZml4ZXMoJGVsZW1lbnQpIHtcbiAgICAgIHRoaXMuYWRkUHJlZml4KCRlbGVtZW50LCAnaWQnKTtcbiAgICAgIHRoaXMuYWRkUHJlZml4KCRlbGVtZW50LCAnY2xhc3MnKTtcbiAgICAgICRlbGVtZW50LnJlbW92ZUF0dHIoJ3N0eWxlJyk7XG4gICAgfSxcbiAgICBhZGRQcmVmaXg6IGZ1bmN0aW9uIGFkZFByZWZpeCgkZWxlbWVudCwgYXR0cmlidXRlKSB7XG4gICAgICB2YXIgdG9SZXBsYWNlID0gJGVsZW1lbnQuYXR0cihhdHRyaWJ1dGUpO1xuXG4gICAgICBpZiAodHlwZW9mIHRvUmVwbGFjZSA9PT0gJ3N0cmluZycgJiYgdG9SZXBsYWNlICE9PSAnJyAmJiB0b1JlcGxhY2UgIT09ICdzaWRyLWlubmVyJykge1xuICAgICAgICAkZWxlbWVudC5hdHRyKGF0dHJpYnV0ZSwgdG9SZXBsYWNlLnJlcGxhY2UoLyhbQS1aYS16MC05Xy5cXC1dKykvZywgJ3NpZHItJyArIGF0dHJpYnV0ZSArICctJDEnKSk7XG4gICAgICB9XG4gICAgfSxcblxuXG4gICAgLy8gQ2hlY2sgaWYgdHJhbnNpdGlvbnMgaXMgc3VwcG9ydGVkXG4gICAgdHJhbnNpdGlvbnM6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBib2R5ID0gZG9jdW1lbnQuYm9keSB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsXG4gICAgICAgICAgc3R5bGUgPSBib2R5LnN0eWxlLFxuICAgICAgICAgIHN1cHBvcnRlZCA9IGZhbHNlLFxuICAgICAgICAgIHByb3BlcnR5ID0gJ3RyYW5zaXRpb24nO1xuXG4gICAgICBpZiAocHJvcGVydHkgaW4gc3R5bGUpIHtcbiAgICAgICAgc3VwcG9ydGVkID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgdmFyIHByZWZpeGVzID0gWydtb3onLCAnd2Via2l0JywgJ28nLCAnbXMnXSxcbiAgICAgICAgICAgICAgcHJlZml4ID0gdW5kZWZpbmVkLFxuICAgICAgICAgICAgICBpID0gdW5kZWZpbmVkO1xuXG4gICAgICAgICAgcHJvcGVydHkgPSBwcm9wZXJ0eS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHByb3BlcnR5LnN1YnN0cigxKTtcbiAgICAgICAgICBzdXBwb3J0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgcHJlZml4ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgcHJlZml4ID0gcHJlZml4ZXNbaV07XG4gICAgICAgICAgICAgIGlmIChwcmVmaXggKyBwcm9wZXJ0eSBpbiBzdHlsZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9KCk7XG4gICAgICAgICAgcHJvcGVydHkgPSBzdXBwb3J0ZWQgPyAnLScgKyBwcmVmaXgudG9Mb3dlckNhc2UoKSArICctJyArIHByb3BlcnR5LnRvTG93ZXJDYXNlKCkgOiBudWxsO1xuICAgICAgICB9KSgpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdXBwb3J0ZWQ6IHN1cHBvcnRlZCxcbiAgICAgICAgcHJvcGVydHk6IHByb3BlcnR5XG4gICAgICB9O1xuICAgIH0oKVxuICB9O1xuXG4gIHZhciAkJDIgPSBqUXVlcnk7XG5cbiAgdmFyIGJvZHlBbmltYXRpb25DbGFzcyA9ICdzaWRyLWFuaW1hdGluZyc7XG4gIHZhciBvcGVuQWN0aW9uID0gJ29wZW4nO1xuICB2YXIgY2xvc2VBY3Rpb24gPSAnY2xvc2UnO1xuICB2YXIgdHJhbnNpdGlvbkVuZEV2ZW50ID0gJ3dlYmtpdFRyYW5zaXRpb25FbmQgb3RyYW5zaXRpb25lbmQgb1RyYW5zaXRpb25FbmQgbXNUcmFuc2l0aW9uRW5kIHRyYW5zaXRpb25lbmQnO1xuICB2YXIgTWVudSA9IGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBNZW51KG5hbWUpIHtcbiAgICAgIGJhYmVsSGVscGVycy5jbGFzc0NhbGxDaGVjayh0aGlzLCBNZW51KTtcblxuICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgIHRoaXMuaXRlbSA9ICQkMignIycgKyBuYW1lKTtcbiAgICAgIHRoaXMub3BlbkNsYXNzID0gbmFtZSA9PT0gJ3NpZHInID8gJ3NpZHItb3BlbicgOiAnc2lkci1vcGVuICcgKyBuYW1lICsgJy1vcGVuJztcbiAgICAgIHRoaXMubWVudVdpZHRoID0gdGhpcy5pdGVtLm91dGVyV2lkdGgodHJ1ZSk7XG4gICAgICB0aGlzLnNwZWVkID0gdGhpcy5pdGVtLmRhdGEoJ3NwZWVkJyk7XG4gICAgICB0aGlzLnNpZGUgPSB0aGlzLml0ZW0uZGF0YSgnc2lkZScpO1xuICAgICAgdGhpcy5kaXNwbGFjZSA9IHRoaXMuaXRlbS5kYXRhKCdkaXNwbGFjZScpO1xuICAgICAgdGhpcy50aW1pbmcgPSB0aGlzLml0ZW0uZGF0YSgndGltaW5nJyk7XG4gICAgICB0aGlzLm1ldGhvZCA9IHRoaXMuaXRlbS5kYXRhKCdtZXRob2QnKTtcbiAgICAgIHRoaXMub25PcGVuQ2FsbGJhY2sgPSB0aGlzLml0ZW0uZGF0YSgnb25PcGVuJyk7XG4gICAgICB0aGlzLm9uQ2xvc2VDYWxsYmFjayA9IHRoaXMuaXRlbS5kYXRhKCdvbkNsb3NlJyk7XG4gICAgICB0aGlzLm9uT3BlbkVuZENhbGxiYWNrID0gdGhpcy5pdGVtLmRhdGEoJ29uT3BlbkVuZCcpO1xuICAgICAgdGhpcy5vbkNsb3NlRW5kQ2FsbGJhY2sgPSB0aGlzLml0ZW0uZGF0YSgnb25DbG9zZUVuZCcpO1xuICAgICAgdGhpcy5ib2R5ID0gJCQyKHRoaXMuaXRlbS5kYXRhKCdib2R5JykpO1xuICAgIH1cblxuICAgIGJhYmVsSGVscGVycy5jcmVhdGVDbGFzcyhNZW51LCBbe1xuICAgICAga2V5OiAnZ2V0QW5pbWF0aW9uJyxcbiAgICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRBbmltYXRpb24oYWN0aW9uLCBlbGVtZW50KSB7XG4gICAgICAgIHZhciBhbmltYXRpb24gPSB7fSxcbiAgICAgICAgICAgIHByb3AgPSB0aGlzLnNpZGU7XG5cbiAgICAgICAgaWYgKGFjdGlvbiA9PT0gJ29wZW4nICYmIGVsZW1lbnQgPT09ICdib2R5Jykge1xuICAgICAgICAgIGFuaW1hdGlvbltwcm9wXSA9IHRoaXMubWVudVdpZHRoICsgJ3B4JztcbiAgICAgICAgfSBlbHNlIGlmIChhY3Rpb24gPT09ICdjbG9zZScgJiYgZWxlbWVudCA9PT0gJ21lbnUnKSB7XG4gICAgICAgICAgYW5pbWF0aW9uW3Byb3BdID0gJy0nICsgdGhpcy5tZW51V2lkdGggKyAncHgnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGFuaW1hdGlvbltwcm9wXSA9IDA7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYW5pbWF0aW9uO1xuICAgICAgfVxuICAgIH0sIHtcbiAgICAgIGtleTogJ3ByZXBhcmVCb2R5JyxcbiAgICAgIHZhbHVlOiBmdW5jdGlvbiBwcmVwYXJlQm9keShhY3Rpb24pIHtcbiAgICAgICAgdmFyIHByb3AgPSBhY3Rpb24gPT09ICdvcGVuJyA/ICdoaWRkZW4nIDogJyc7XG5cbiAgICAgICAgLy8gUHJlcGFyZSBwYWdlIGlmIGNvbnRhaW5lciBpcyBib2R5XG4gICAgICAgIGlmICh0aGlzLmJvZHkuaXMoJ2JvZHknKSkge1xuICAgICAgICAgIHZhciAkaHRtbCA9ICQkMignaHRtbCcpLFxuICAgICAgICAgICAgICBzY3JvbGxUb3AgPSAkaHRtbC5zY3JvbGxUb3AoKTtcblxuICAgICAgICAgICRodG1sLmNzcygnb3ZlcmZsb3cteCcsIHByb3ApLnNjcm9sbFRvcChzY3JvbGxUb3ApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSwge1xuICAgICAga2V5OiAnb3BlbkJvZHknLFxuICAgICAgdmFsdWU6IGZ1bmN0aW9uIG9wZW5Cb2R5KCkge1xuICAgICAgICBpZiAodGhpcy5kaXNwbGFjZSkge1xuICAgICAgICAgIHZhciB0cmFuc2l0aW9ucyA9IGhlbHBlci50cmFuc2l0aW9ucyxcbiAgICAgICAgICAgICAgJGJvZHkgPSB0aGlzLmJvZHk7XG5cbiAgICAgICAgICBpZiAodHJhbnNpdGlvbnMuc3VwcG9ydGVkKSB7XG4gICAgICAgICAgICAkYm9keS5jc3ModHJhbnNpdGlvbnMucHJvcGVydHksIHRoaXMuc2lkZSArICcgJyArIHRoaXMuc3BlZWQgLyAxMDAwICsgJ3MgJyArIHRoaXMudGltaW5nKS5jc3ModGhpcy5zaWRlLCAwKS5jc3Moe1xuICAgICAgICAgICAgICB3aWR0aDogJGJvZHkud2lkdGgoKSxcbiAgICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZSdcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgJGJvZHkuY3NzKHRoaXMuc2lkZSwgdGhpcy5tZW51V2lkdGggKyAncHgnKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIGJvZHlBbmltYXRpb24gPSB0aGlzLmdldEFuaW1hdGlvbihvcGVuQWN0aW9uLCAnYm9keScpO1xuXG4gICAgICAgICAgICAkYm9keS5jc3Moe1xuICAgICAgICAgICAgICB3aWR0aDogJGJvZHkud2lkdGgoKSxcbiAgICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZSdcbiAgICAgICAgICAgIH0pLmFuaW1hdGUoYm9keUFuaW1hdGlvbiwge1xuICAgICAgICAgICAgICBxdWV1ZTogZmFsc2UsXG4gICAgICAgICAgICAgIGR1cmF0aW9uOiB0aGlzLnNwZWVkXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LCB7XG4gICAgICBrZXk6ICdvbkNsb3NlQm9keScsXG4gICAgICB2YWx1ZTogZnVuY3Rpb24gb25DbG9zZUJvZHkoKSB7XG4gICAgICAgIHZhciB0cmFuc2l0aW9ucyA9IGhlbHBlci50cmFuc2l0aW9ucyxcbiAgICAgICAgICAgIHJlc2V0U3R5bGVzID0ge1xuICAgICAgICAgIHdpZHRoOiAnJyxcbiAgICAgICAgICBwb3NpdGlvbjogJycsXG4gICAgICAgICAgcmlnaHQ6ICcnLFxuICAgICAgICAgIGxlZnQ6ICcnXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKHRyYW5zaXRpb25zLnN1cHBvcnRlZCkge1xuICAgICAgICAgIHJlc2V0U3R5bGVzW3RyYW5zaXRpb25zLnByb3BlcnR5XSA9ICcnO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5ib2R5LmNzcyhyZXNldFN0eWxlcykudW5iaW5kKHRyYW5zaXRpb25FbmRFdmVudCk7XG4gICAgICB9XG4gICAgfSwge1xuICAgICAga2V5OiAnY2xvc2VCb2R5JyxcbiAgICAgIHZhbHVlOiBmdW5jdGlvbiBjbG9zZUJvZHkoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAgICAgaWYgKHRoaXMuZGlzcGxhY2UpIHtcbiAgICAgICAgICBpZiAoaGVscGVyLnRyYW5zaXRpb25zLnN1cHBvcnRlZCkge1xuICAgICAgICAgICAgdGhpcy5ib2R5LmNzcyh0aGlzLnNpZGUsIDApLm9uZSh0cmFuc2l0aW9uRW5kRXZlbnQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgX3RoaXMub25DbG9zZUJvZHkoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgYm9keUFuaW1hdGlvbiA9IHRoaXMuZ2V0QW5pbWF0aW9uKGNsb3NlQWN0aW9uLCAnYm9keScpO1xuXG4gICAgICAgICAgICB0aGlzLmJvZHkuYW5pbWF0ZShib2R5QW5pbWF0aW9uLCB7XG4gICAgICAgICAgICAgIHF1ZXVlOiBmYWxzZSxcbiAgICAgICAgICAgICAgZHVyYXRpb246IHRoaXMuc3BlZWQsXG4gICAgICAgICAgICAgIGNvbXBsZXRlOiBmdW5jdGlvbiBjb21wbGV0ZSgpIHtcbiAgICAgICAgICAgICAgICBfdGhpcy5vbkNsb3NlQm9keSgpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LCB7XG4gICAgICBrZXk6ICdtb3ZlQm9keScsXG4gICAgICB2YWx1ZTogZnVuY3Rpb24gbW92ZUJvZHkoYWN0aW9uKSB7XG4gICAgICAgIGlmIChhY3Rpb24gPT09IG9wZW5BY3Rpb24pIHtcbiAgICAgICAgICB0aGlzLm9wZW5Cb2R5KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5jbG9zZUJvZHkoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sIHtcbiAgICAgIGtleTogJ29uT3Blbk1lbnUnLFxuICAgICAgdmFsdWU6IGZ1bmN0aW9uIG9uT3Blbk1lbnUoY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIG5hbWUgPSB0aGlzLm5hbWU7XG5cbiAgICAgICAgc2lkclN0YXR1cy5tb3ZpbmcgPSBmYWxzZTtcbiAgICAgICAgc2lkclN0YXR1cy5vcGVuZWQgPSBuYW1lO1xuXG4gICAgICAgIHRoaXMuaXRlbS51bmJpbmQodHJhbnNpdGlvbkVuZEV2ZW50KTtcblxuICAgICAgICB0aGlzLmJvZHkucmVtb3ZlQ2xhc3MoYm9keUFuaW1hdGlvbkNsYXNzKS5hZGRDbGFzcyh0aGlzLm9wZW5DbGFzcyk7XG5cbiAgICAgICAgdGhpcy5vbk9wZW5FbmRDYWxsYmFjaygpO1xuXG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICBjYWxsYmFjayhuYW1lKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sIHtcbiAgICAgIGtleTogJ29wZW5NZW51JyxcbiAgICAgIHZhbHVlOiBmdW5jdGlvbiBvcGVuTWVudShjYWxsYmFjaykge1xuICAgICAgICB2YXIgX3RoaXMyID0gdGhpcztcblxuICAgICAgICB2YXIgJGl0ZW0gPSB0aGlzLml0ZW07XG5cbiAgICAgICAgaWYgKGhlbHBlci50cmFuc2l0aW9ucy5zdXBwb3J0ZWQpIHtcbiAgICAgICAgICAkaXRlbS5jc3ModGhpcy5zaWRlLCAwKS5vbmUodHJhbnNpdGlvbkVuZEV2ZW50LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBfdGhpczIub25PcGVuTWVudShjYWxsYmFjayk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIG1lbnVBbmltYXRpb24gPSB0aGlzLmdldEFuaW1hdGlvbihvcGVuQWN0aW9uLCAnbWVudScpO1xuXG4gICAgICAgICAgJGl0ZW0uY3NzKCdkaXNwbGF5JywgJ2Jsb2NrJykuYW5pbWF0ZShtZW51QW5pbWF0aW9uLCB7XG4gICAgICAgICAgICBxdWV1ZTogZmFsc2UsXG4gICAgICAgICAgICBkdXJhdGlvbjogdGhpcy5zcGVlZCxcbiAgICAgICAgICAgIGNvbXBsZXRlOiBmdW5jdGlvbiBjb21wbGV0ZSgpIHtcbiAgICAgICAgICAgICAgX3RoaXMyLm9uT3Blbk1lbnUoY2FsbGJhY2spO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSwge1xuICAgICAga2V5OiAnb25DbG9zZU1lbnUnLFxuICAgICAgdmFsdWU6IGZ1bmN0aW9uIG9uQ2xvc2VNZW51KGNhbGxiYWNrKSB7XG4gICAgICAgIHRoaXMuaXRlbS5jc3Moe1xuICAgICAgICAgIGxlZnQ6ICcnLFxuICAgICAgICAgIHJpZ2h0OiAnJ1xuICAgICAgICB9KS51bmJpbmQodHJhbnNpdGlvbkVuZEV2ZW50KTtcbiAgICAgICAgJCQyKCdodG1sJykuY3NzKCdvdmVyZmxvdy14JywgJycpO1xuXG4gICAgICAgIHNpZHJTdGF0dXMubW92aW5nID0gZmFsc2U7XG4gICAgICAgIHNpZHJTdGF0dXMub3BlbmVkID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5ib2R5LnJlbW92ZUNsYXNzKGJvZHlBbmltYXRpb25DbGFzcykucmVtb3ZlQ2xhc3ModGhpcy5vcGVuQ2xhc3MpO1xuXG4gICAgICAgIHRoaXMub25DbG9zZUVuZENhbGxiYWNrKCk7XG5cbiAgICAgICAgLy8gQ2FsbGJhY2tcbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIGNhbGxiYWNrKG5hbWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSwge1xuICAgICAga2V5OiAnY2xvc2VNZW51JyxcbiAgICAgIHZhbHVlOiBmdW5jdGlvbiBjbG9zZU1lbnUoY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIF90aGlzMyA9IHRoaXM7XG5cbiAgICAgICAgdmFyIGl0ZW0gPSB0aGlzLml0ZW07XG5cbiAgICAgICAgaWYgKGhlbHBlci50cmFuc2l0aW9ucy5zdXBwb3J0ZWQpIHtcbiAgICAgICAgICBpdGVtLmNzcyh0aGlzLnNpZGUsICcnKS5vbmUodHJhbnNpdGlvbkVuZEV2ZW50LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBfdGhpczMub25DbG9zZU1lbnUoY2FsbGJhY2spO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBtZW51QW5pbWF0aW9uID0gdGhpcy5nZXRBbmltYXRpb24oY2xvc2VBY3Rpb24sICdtZW51Jyk7XG5cbiAgICAgICAgICBpdGVtLmFuaW1hdGUobWVudUFuaW1hdGlvbiwge1xuICAgICAgICAgICAgcXVldWU6IGZhbHNlLFxuICAgICAgICAgICAgZHVyYXRpb246IHRoaXMuc3BlZWQsXG4gICAgICAgICAgICBjb21wbGV0ZTogZnVuY3Rpb24gY29tcGxldGUoKSB7XG4gICAgICAgICAgICAgIF90aGlzMy5vbkNsb3NlTWVudSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSwge1xuICAgICAga2V5OiAnbW92ZU1lbnUnLFxuICAgICAgdmFsdWU6IGZ1bmN0aW9uIG1vdmVNZW51KGFjdGlvbiwgY2FsbGJhY2spIHtcbiAgICAgICAgdGhpcy5ib2R5LmFkZENsYXNzKGJvZHlBbmltYXRpb25DbGFzcyk7XG5cbiAgICAgICAgaWYgKGFjdGlvbiA9PT0gb3BlbkFjdGlvbikge1xuICAgICAgICAgIHRoaXMub3Blbk1lbnUoY2FsbGJhY2spO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuY2xvc2VNZW51KGNhbGxiYWNrKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sIHtcbiAgICAgIGtleTogJ21vdmUnLFxuICAgICAgdmFsdWU6IGZ1bmN0aW9uIG1vdmUoYWN0aW9uLCBjYWxsYmFjaykge1xuICAgICAgICAvLyBMb2NrIHNpZHJcbiAgICAgICAgc2lkclN0YXR1cy5tb3ZpbmcgPSB0cnVlO1xuXG4gICAgICAgIHRoaXMucHJlcGFyZUJvZHkoYWN0aW9uKTtcbiAgICAgICAgdGhpcy5tb3ZlQm9keShhY3Rpb24pO1xuICAgICAgICB0aGlzLm1vdmVNZW51KGFjdGlvbiwgY2FsbGJhY2spO1xuICAgICAgfVxuICAgIH0sIHtcbiAgICAgIGtleTogJ29wZW4nLFxuICAgICAgdmFsdWU6IGZ1bmN0aW9uIG9wZW4oY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIF90aGlzNCA9IHRoaXM7XG5cbiAgICAgICAgLy8gQ2hlY2sgaWYgaXMgYWxyZWFkeSBvcGVuZWQgb3IgbW92aW5nXG4gICAgICAgIGlmIChzaWRyU3RhdHVzLm9wZW5lZCA9PT0gdGhpcy5uYW1lIHx8IHNpZHJTdGF0dXMubW92aW5nKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgYW5vdGhlciBtZW51IG9wZW5lZCBjbG9zZSBmaXJzdFxuICAgICAgICBpZiAoc2lkclN0YXR1cy5vcGVuZWQgIT09IGZhbHNlKSB7XG4gICAgICAgICAgdmFyIGFscmVhZHlPcGVuZWRNZW51ID0gbmV3IE1lbnUoc2lkclN0YXR1cy5vcGVuZWQpO1xuXG4gICAgICAgICAgYWxyZWFkeU9wZW5lZE1lbnUuY2xvc2UoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgX3RoaXM0Lm9wZW4oY2FsbGJhY2spO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5tb3ZlKCdvcGVuJywgY2FsbGJhY2spO1xuXG4gICAgICAgIC8vIG9uT3BlbiBjYWxsYmFja1xuICAgICAgICB0aGlzLm9uT3BlbkNhbGxiYWNrKCk7XG4gICAgICB9XG4gICAgfSwge1xuICAgICAga2V5OiAnY2xvc2UnLFxuICAgICAgdmFsdWU6IGZ1bmN0aW9uIGNsb3NlKGNhbGxiYWNrKSB7XG4gICAgICAgIC8vIENoZWNrIGlmIGlzIGFscmVhZHkgY2xvc2VkIG9yIG1vdmluZ1xuICAgICAgICBpZiAoc2lkclN0YXR1cy5vcGVuZWQgIT09IHRoaXMubmFtZSB8fCBzaWRyU3RhdHVzLm1vdmluZykge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMubW92ZSgnY2xvc2UnLCBjYWxsYmFjayk7XG5cbiAgICAgICAgLy8gb25DbG9zZSBjYWxsYmFja1xuICAgICAgICB0aGlzLm9uQ2xvc2VDYWxsYmFjaygpO1xuICAgICAgfVxuICAgIH0sIHtcbiAgICAgIGtleTogJ3RvZ2dsZScsXG4gICAgICB2YWx1ZTogZnVuY3Rpb24gdG9nZ2xlKGNhbGxiYWNrKSB7XG4gICAgICAgIGlmIChzaWRyU3RhdHVzLm9wZW5lZCA9PT0gdGhpcy5uYW1lKSB7XG4gICAgICAgICAgdGhpcy5jbG9zZShjYWxsYmFjayk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5vcGVuKGNhbGxiYWNrKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1dKTtcbiAgICByZXR1cm4gTWVudTtcbiAgfSgpO1xuXG4gIHZhciAkJDEgPSBqUXVlcnk7XG5cbiAgZnVuY3Rpb24gZXhlY3V0ZShhY3Rpb24sIG5hbWUsIGNhbGxiYWNrKSB7XG4gICAgdmFyIHNpZHIgPSBuZXcgTWVudShuYW1lKTtcblxuICAgIHN3aXRjaCAoYWN0aW9uKSB7XG4gICAgICBjYXNlICdvcGVuJzpcbiAgICAgICAgc2lkci5vcGVuKGNhbGxiYWNrKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdjbG9zZSc6XG4gICAgICAgIHNpZHIuY2xvc2UoY2FsbGJhY2spO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3RvZ2dsZSc6XG4gICAgICAgIHNpZHIudG9nZ2xlKGNhbGxiYWNrKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICAkJDEuZXJyb3IoJ01ldGhvZCAnICsgYWN0aW9uICsgJyBkb2VzIG5vdCBleGlzdCBvbiBqUXVlcnkuc2lkcicpO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICB2YXIgaTtcbiAgdmFyICQgPSBqUXVlcnk7XG4gIHZhciBwdWJsaWNNZXRob2RzID0gWydvcGVuJywgJ2Nsb3NlJywgJ3RvZ2dsZSddO1xuICB2YXIgbWV0aG9kTmFtZTtcbiAgdmFyIG1ldGhvZHMgPSB7fTtcbiAgdmFyIGdldE1ldGhvZCA9IGZ1bmN0aW9uIGdldE1ldGhvZChtZXRob2ROYW1lKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChuYW1lLCBjYWxsYmFjaykge1xuICAgICAgLy8gQ2hlY2sgYXJndW1lbnRzXG4gICAgICBpZiAodHlwZW9mIG5hbWUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgY2FsbGJhY2sgPSBuYW1lO1xuICAgICAgICBuYW1lID0gJ3NpZHInO1xuICAgICAgfSBlbHNlIGlmICghbmFtZSkge1xuICAgICAgICBuYW1lID0gJ3NpZHInO1xuICAgICAgfVxuXG4gICAgICBleGVjdXRlKG1ldGhvZE5hbWUsIG5hbWUsIGNhbGxiYWNrKTtcbiAgICB9O1xuICB9O1xuICBmb3IgKGkgPSAwOyBpIDwgcHVibGljTWV0aG9kcy5sZW5ndGg7IGkrKykge1xuICAgIG1ldGhvZE5hbWUgPSBwdWJsaWNNZXRob2RzW2ldO1xuICAgIG1ldGhvZHNbbWV0aG9kTmFtZV0gPSBnZXRNZXRob2QobWV0aG9kTmFtZSk7XG4gIH1cblxuICBmdW5jdGlvbiBzaWRyKG1ldGhvZCkge1xuICAgIGlmIChtZXRob2QgPT09ICdzdGF0dXMnKSB7XG4gICAgICByZXR1cm4gc2lkclN0YXR1cztcbiAgICB9IGVsc2UgaWYgKG1ldGhvZHNbbWV0aG9kXSkge1xuICAgICAgcmV0dXJuIG1ldGhvZHNbbWV0aG9kXS5hcHBseSh0aGlzLCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBtZXRob2QgPT09ICdmdW5jdGlvbicgfHwgdHlwZW9mIG1ldGhvZCA9PT0gJ3N0cmluZycgfHwgIW1ldGhvZCkge1xuICAgICAgcmV0dXJuIG1ldGhvZHMudG9nZ2xlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICQuZXJyb3IoJ01ldGhvZCAnICsgbWV0aG9kICsgJyBkb2VzIG5vdCBleGlzdCBvbiBqUXVlcnkuc2lkcicpO1xuICAgIH1cbiAgfVxuXG4gIHZhciAkJDMgPSBqUXVlcnk7XG5cbiAgZnVuY3Rpb24gZmlsbENvbnRlbnQoJHNpZGVNZW51LCBzZXR0aW5ncykge1xuICAgIC8vIFRoZSBtZW51IGNvbnRlbnRcbiAgICBpZiAodHlwZW9mIHNldHRpbmdzLnNvdXJjZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdmFyIG5ld0NvbnRlbnQgPSBzZXR0aW5ncy5zb3VyY2UobmFtZSk7XG5cbiAgICAgICRzaWRlTWVudS5odG1sKG5ld0NvbnRlbnQpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHNldHRpbmdzLnNvdXJjZSA9PT0gJ3N0cmluZycgJiYgaGVscGVyLmlzVXJsKHNldHRpbmdzLnNvdXJjZSkpIHtcbiAgICAgICQkMy5nZXQoc2V0dGluZ3Muc291cmNlLCBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAkc2lkZU1lbnUuaHRtbChkYXRhKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHNldHRpbmdzLnNvdXJjZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHZhciBodG1sQ29udGVudCA9ICcnLFxuICAgICAgICAgIHNlbGVjdG9ycyA9IHNldHRpbmdzLnNvdXJjZS5zcGxpdCgnLCcpO1xuXG4gICAgICAkJDMuZWFjaChzZWxlY3RvcnMsIGZ1bmN0aW9uIChpbmRleCwgZWxlbWVudCkge1xuICAgICAgICBodG1sQ29udGVudCArPSAnPGRpdiBjbGFzcz1cInNpZHItaW5uZXJcIj4nICsgJCQzKGVsZW1lbnQpLmh0bWwoKSArICc8L2Rpdj4nO1xuICAgICAgfSk7XG5cbiAgICAgIC8vIFJlbmFtaW5nIGlkcyBhbmQgY2xhc3Nlc1xuICAgICAgaWYgKHNldHRpbmdzLnJlbmFtaW5nKSB7XG4gICAgICAgIHZhciAkaHRtbENvbnRlbnQgPSAkJDMoJzxkaXYgLz4nKS5odG1sKGh0bWxDb250ZW50KTtcblxuICAgICAgICAkaHRtbENvbnRlbnQuZmluZCgnKicpLmVhY2goZnVuY3Rpb24gKGluZGV4LCBlbGVtZW50KSB7XG4gICAgICAgICAgdmFyICRlbGVtZW50ID0gJCQzKGVsZW1lbnQpO1xuXG4gICAgICAgICAgaGVscGVyLmFkZFByZWZpeGVzKCRlbGVtZW50KTtcbiAgICAgICAgfSk7XG4gICAgICAgIGh0bWxDb250ZW50ID0gJGh0bWxDb250ZW50Lmh0bWwoKTtcbiAgICAgIH1cblxuICAgICAgJHNpZGVNZW51Lmh0bWwoaHRtbENvbnRlbnQpO1xuICAgIH0gZWxzZSBpZiAoc2V0dGluZ3Muc291cmNlICE9PSBudWxsKSB7XG4gICAgICAkJDMuZXJyb3IoJ0ludmFsaWQgU2lkciBTb3VyY2UnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gJHNpZGVNZW51O1xuICB9XG5cbiAgZnVuY3Rpb24gZm5TaWRyKG9wdGlvbnMpIHtcbiAgICB2YXIgdHJhbnNpdGlvbnMgPSBoZWxwZXIudHJhbnNpdGlvbnMsXG4gICAgICAgIHNldHRpbmdzID0gJCQzLmV4dGVuZCh7XG4gICAgICBuYW1lOiAnc2lkcicsIC8vIE5hbWUgZm9yIHRoZSAnc2lkcidcbiAgICAgIHNwZWVkOiAyMDAsIC8vIEFjY2VwdHMgc3RhbmRhcmQgalF1ZXJ5IGVmZmVjdHMgc3BlZWRzIChpLmUuIGZhc3QsIG5vcm1hbCBvciBtaWxsaXNlY29uZHMpXG4gICAgICBzaWRlOiAnbGVmdCcsIC8vIEFjY2VwdHMgJ2xlZnQnIG9yICdyaWdodCdcbiAgICAgIHNvdXJjZTogbnVsbCwgLy8gT3ZlcnJpZGUgdGhlIHNvdXJjZSBvZiB0aGUgY29udGVudC5cbiAgICAgIHJlbmFtaW5nOiB0cnVlLCAvLyBUaGUgaWRzIGFuZCBjbGFzc2VzIHdpbGwgYmUgcHJlcGVuZGVkIHdpdGggYSBwcmVmaXggd2hlbiBsb2FkaW5nIGV4aXN0ZW50IGNvbnRlbnRcbiAgICAgIGJvZHk6ICdib2R5JywgLy8gUGFnZSBjb250YWluZXIgc2VsZWN0b3IsXG4gICAgICBkaXNwbGFjZTogdHJ1ZSwgLy8gRGlzcGxhY2UgdGhlIGJvZHkgY29udGVudCBvciBub3RcbiAgICAgIHRpbWluZzogJ2Vhc2UnLCAvLyBUaW1pbmcgZnVuY3Rpb24gZm9yIENTUyB0cmFuc2l0aW9uc1xuICAgICAgbWV0aG9kOiAndG9nZ2xlJywgLy8gVGhlIG1ldGhvZCB0byBjYWxsIHdoZW4gZWxlbWVudCBpcyBjbGlja2VkXG4gICAgICBiaW5kOiAndG91Y2hzdGFydCBjbGljaycsIC8vIFRoZSBldmVudChzKSB0byB0cmlnZ2VyIHRoZSBtZW51XG4gICAgICBvbk9wZW46IGZ1bmN0aW9uIG9uT3BlbigpIHt9LFxuICAgICAgLy8gQ2FsbGJhY2sgd2hlbiBzaWRyIHN0YXJ0IG9wZW5pbmdcbiAgICAgIG9uQ2xvc2U6IGZ1bmN0aW9uIG9uQ2xvc2UoKSB7fSxcbiAgICAgIC8vIENhbGxiYWNrIHdoZW4gc2lkciBzdGFydCBjbG9zaW5nXG4gICAgICBvbk9wZW5FbmQ6IGZ1bmN0aW9uIG9uT3BlbkVuZCgpIHt9LFxuICAgICAgLy8gQ2FsbGJhY2sgd2hlbiBzaWRyIGVuZCBvcGVuaW5nXG4gICAgICBvbkNsb3NlRW5kOiBmdW5jdGlvbiBvbkNsb3NlRW5kKCkge30gLy8gQ2FsbGJhY2sgd2hlbiBzaWRyIGVuZCBjbG9zaW5nXG5cbiAgICB9LCBvcHRpb25zKSxcbiAgICAgICAgbmFtZSA9IHNldHRpbmdzLm5hbWUsXG4gICAgICAgICRzaWRlTWVudSA9ICQkMygnIycgKyBuYW1lKTtcblxuICAgIC8vIElmIHRoZSBzaWRlIG1lbnUgZG8gbm90IGV4aXN0IGNyZWF0ZSBpdFxuICAgIGlmICgkc2lkZU1lbnUubGVuZ3RoID09PSAwKSB7XG4gICAgICAkc2lkZU1lbnUgPSAkJDMoJzxkaXYgLz4nKS5hdHRyKCdpZCcsIG5hbWUpLmFwcGVuZFRvKCQkMygnYm9keScpKTtcbiAgICB9XG5cbiAgICAvLyBBZGQgdHJhbnNpdGlvbiB0byBtZW51IGlmIGFyZSBzdXBwb3J0ZWRcbiAgICBpZiAodHJhbnNpdGlvbnMuc3VwcG9ydGVkKSB7XG4gICAgICAkc2lkZU1lbnUuY3NzKHRyYW5zaXRpb25zLnByb3BlcnR5LCBzZXR0aW5ncy5zaWRlICsgJyAnICsgc2V0dGluZ3Muc3BlZWQgLyAxMDAwICsgJ3MgJyArIHNldHRpbmdzLnRpbWluZyk7XG4gICAgfVxuXG4gICAgLy8gQWRkaW5nIHN0eWxlcyBhbmQgb3B0aW9uc1xuICAgICRzaWRlTWVudS5hZGRDbGFzcygnc2lkcicpLmFkZENsYXNzKHNldHRpbmdzLnNpZGUpLmRhdGEoe1xuICAgICAgc3BlZWQ6IHNldHRpbmdzLnNwZWVkLFxuICAgICAgc2lkZTogc2V0dGluZ3Muc2lkZSxcbiAgICAgIGJvZHk6IHNldHRpbmdzLmJvZHksXG4gICAgICBkaXNwbGFjZTogc2V0dGluZ3MuZGlzcGxhY2UsXG4gICAgICB0aW1pbmc6IHNldHRpbmdzLnRpbWluZyxcbiAgICAgIG1ldGhvZDogc2V0dGluZ3MubWV0aG9kLFxuICAgICAgb25PcGVuOiBzZXR0aW5ncy5vbk9wZW4sXG4gICAgICBvbkNsb3NlOiBzZXR0aW5ncy5vbkNsb3NlLFxuICAgICAgb25PcGVuRW5kOiBzZXR0aW5ncy5vbk9wZW5FbmQsXG4gICAgICBvbkNsb3NlRW5kOiBzZXR0aW5ncy5vbkNsb3NlRW5kXG4gICAgfSk7XG5cbiAgICAkc2lkZU1lbnUgPSBmaWxsQ29udGVudCgkc2lkZU1lbnUsIHNldHRpbmdzKTtcblxuICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgdmFyICR0aGlzID0gJCQzKHRoaXMpLFxuICAgICAgICAgIGRhdGEgPSAkdGhpcy5kYXRhKCdzaWRyJyksXG4gICAgICAgICAgZmxhZyA9IGZhbHNlO1xuXG4gICAgICAvLyBJZiB0aGUgcGx1Z2luIGhhc24ndCBiZWVuIGluaXRpYWxpemVkIHlldFxuICAgICAgaWYgKCFkYXRhKSB7XG4gICAgICAgIHNpZHJTdGF0dXMubW92aW5nID0gZmFsc2U7XG4gICAgICAgIHNpZHJTdGF0dXMub3BlbmVkID0gZmFsc2U7XG5cbiAgICAgICAgJHRoaXMuZGF0YSgnc2lkcicsIG5hbWUpO1xuXG4gICAgICAgICR0aGlzLmJpbmQoc2V0dGluZ3MuYmluZCwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICAgIGlmICghZmxhZykge1xuICAgICAgICAgICAgZmxhZyA9IHRydWU7XG4gICAgICAgICAgICBzaWRyKHNldHRpbmdzLm1ldGhvZCwgbmFtZSk7XG5cbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICBmbGFnID0gZmFsc2U7XG4gICAgICAgICAgICB9LCAxMDApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBqUXVlcnkuc2lkciA9IHNpZHI7XG4gIGpRdWVyeS5mbi5zaWRyID0gZm5TaWRyO1xuXG59KCkpOyIsInZhciB0b2dnbGVBbGxCdXR0b25zID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmpzLWJ1bGxldHBvaW50LXRvZ2dsZS1hbGwnKTtcbnZhciB0b2dnbGVCdWxsZXRwb2ludEJ1dHRvbnMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuanMtYnVsbGV0cG9pbnQtdG9nZ2xlLWJ1bGxldHBvaW50Jyk7XG52YXIgdG9nZ2xlQXR0YWNobWVudHNCdXR0b25zID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmpzLWJ1bGxldHBvaW50LXRvZ2dsZS1hdHRhY2htZW50cycpO1xuXG4vLyBUb2dnbGUgYWxsLlxuZm9yICh2YXIgdG9nZ2xlQWxsQnV0dG9uIG9mIHRvZ2dsZUFsbEJ1dHRvbnMpIHtcbiAgdG9nZ2xlQWxsQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlVG9nZ2xlQWxsKTtcbn1cblxuZnVuY3Rpb24gaGFuZGxlVG9nZ2xlQWxsKGV2ZW50KSB7XG4gIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgdmFyIGJ1bGxldHBvaW50cyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ2J1bGxldHBvaW50Jyk7XG4gIHZhciBjdXJyZW50U3RhdGUgPSB0b2dnbGVBbGxCdXR0b24uZGF0YXNldC5jdXJyZW50U3RhdGU7XG5cbiAgaWYgKGN1cnJlbnRTdGF0ZSA9PT0gJ29wZW4nKSB7XG4gICAgdG9nZ2xlQWxsQnV0dG9uLmRhdGFzZXQuY3VycmVudFN0YXRlID0gJ2Nsb3NlZCc7XG5cbiAgICBmb3IgKHZhciBidWxsZXRwb2ludCBvZiBidWxsZXRwb2ludHMpIHtcbiAgICAgIGJ1bGxldHBvaW50LmNsYXNzTGlzdC5yZW1vdmUoJ2J1bGxldHBvaW50LS1vcGVuJyk7XG4gICAgfVxuICB9XG4gIGVsc2Uge1xuICAgIHRvZ2dsZUFsbEJ1dHRvbi5kYXRhc2V0LmN1cnJlbnRTdGF0ZSA9ICdvcGVuJztcblxuICAgIGZvciAodmFyIGJ1bGxldHBvaW50IG9mIGJ1bGxldHBvaW50cykge1xuICAgICAgYnVsbGV0cG9pbnQuY2xhc3NMaXN0LmFkZCgnYnVsbGV0cG9pbnQtLW9wZW4nKTtcbiAgICB9XG4gIH1cbn1cblxuLy8gVG9nZ2xlIGF0dGFjaG1lbnRzLlxuZm9yICh2YXIgdG9nZ2xlQXR0YWNobWVudEJ1dHRvbiBvZiB0b2dnbGVBdHRhY2htZW50c0J1dHRvbnMpIHtcbiAgdG9nZ2xlQXR0YWNobWVudEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZVRvZ2dsZUF0dGFjaG1lbnRzKTtcbn1cblxuZnVuY3Rpb24gaGFuZGxlVG9nZ2xlQXR0YWNobWVudHMoZXZlbnQpIHtcbiAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICB2YXIgZWxlbWVudCA9IHRoaXM7XG4gIHZhciBwYXJlbnQgPSBlbGVtZW50LmNsb3Nlc3QoJy5idWxsZXRwb2ludCcpO1xuXG4gIHBhcmVudC5jbGFzc0xpc3QudG9nZ2xlKCdidWxsZXRwb2ludC0tb3BlbicpO1xuXG4gIC8vIFJ1biB0aHJvdWdoIGF0dGFjaG1lbnRzIGFuZCB0b2dnbGUgdGhlbS5cbiAgdmFyIGF0dGFjaG1lbnRzID0gcGFyZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5idWxsZXRwb2ludC0tYXR0YWNobWVudCcpO1xuXG4gIGlmIChwYXJlbnQuY2xhc3NMaXN0LmNvbnRhaW5zKCdidWxsZXRwb2ludC0tb3BlbicpKSB7XG4gICAgZm9yICh2YXIgYXR0YWNobWVudCBvZiBhdHRhY2htZW50cykge1xuICAgICAgYXR0YWNobWVudC5jbGFzc0xpc3QuYWRkKCdidWxsZXRwb2ludC0tb3BlbicpO1xuICAgIH1cbiAgfVxuICBlbHNlIHtcbiAgICBmb3IgKHZhciBhdHRhY2htZW50IG9mIGF0dGFjaG1lbnRzKSB7XG4gICAgICBhdHRhY2htZW50LmNsYXNzTGlzdC5yZW1vdmUoJ2J1bGxldHBvaW50LS1vcGVuJyk7XG4gICAgfVxuICB9XG59XG5cbi8vIFRvZ2dsZSBidWxsZXRwb2ludC5cbmZvciAodmFyIHRvZ2dsZUJ1bGxldHBvaW50QnV0dG9uIG9mIHRvZ2dsZUJ1bGxldHBvaW50QnV0dG9ucykge1xuICB0b2dnbGVCdWxsZXRwb2ludEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZVRvZ2dsZUJ1bGxldHBvaW50KTtcbn1cblxuZnVuY3Rpb24gaGFuZGxlVG9nZ2xlQnVsbGV0cG9pbnQoZXZlbnQpIHtcbiAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICB2YXIgZWxlbWVudCA9IHRoaXM7XG4gIHZhciBwYXJlbnQgPSBlbGVtZW50LmNsb3Nlc3QoJy5idWxsZXRwb2ludCcpO1xuXG4gIHBhcmVudC5jbGFzc0xpc3QudG9nZ2xlKCdidWxsZXRwb2ludC0tb3BlbicpO1xufVxuIiwiKGZ1bmN0aW9uKCkge1xuICBjb25zdCBzaWRlYmFyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmxheW91dF9fc2lkZWJhcicpO1xuICBjb25zdCB0b2dnbGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmpzLXRvZ2dsZS1zaWRlYmFyJyk7XG5cbiAgY29uc3QgdG9nZ2xlU3RhdGUgPSAoKSA9PiB7XG4gICAgY29uc3QgY3VycmVudFN0YXRlID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3NpZGViYXInKTtcblxuICAgIGlmIChjdXJyZW50U3RhdGUgPT09ICduYXJyb3cnKSB7XG4gICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnc2lkZWJhcicsICd3aWRlJyk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ3NpZGViYXInLCAnbmFycm93Jyk7XG4gICAgfVxuICB9O1xuXG4gIC8vIEFkZCBldmVudGxpc3RlbmVycy5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0b2dnbGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgbGV0IHRvZ2dsZSA9IHRvZ2dsZXNbaV07XG5cbiAgICB0b2dnbGUuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBlID0+IHtcbiAgICAgIHNpZGViYXIuY2xhc3NMaXN0LnRvZ2dsZSgnbGF5b3V0X19zaWRlYmFyLS1uYXJyb3cnKTtcblxuICAgICAgdG9nZ2xlU3RhdGUoKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vIE9uIGxvYWQuXG4gIGNvbnN0IGN1cnJlbnRTdGF0ZSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdzaWRlYmFyJyk7XG5cbiAgaWYgKGN1cnJlbnRTdGF0ZSA9PT0gJ25hcnJvdycpIHtcbiAgICBzaWRlYmFyLmNsYXNzTGlzdC5hZGQoJ2xheW91dF9fc2lkZWJhci0tbmFycm93Jyk7XG4gIH1cbiAgZWxzZSB7XG4gICAgc2lkZWJhci5jbGFzc0xpc3QucmVtb3ZlKCdsYXlvdXRfX3NpZGViYXItLW5hcnJvdycpO1xuICB9XG59KSgpO1xuIiwialF1ZXJ5KGZ1bmN0aW9uICgkKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICAvLyBGbGV4eSBoZWFkZXJcbiAgZmxleHlfaGVhZGVyLmluaXQoKTtcblxuICAkKCcuc2lkci10b2dnbGUtLXJpZ2h0Jykuc2lkcih7XG4gICAgbmFtZTogJ3NpZHItbWFpbicsXG4gICAgc2lkZTogJ3JpZ2h0JyxcbiAgICByZW5hbWluZzogZmFsc2UsXG4gICAgYm9keTogJy5sYXlvdXRfX3dyYXBwZXInLFxuICAgIHNvdXJjZTogJy5zaWRyLXNvdXJjZS1wcm92aWRlcidcbiAgfSk7XG5cbiAgLy8gRW5hYmxlIHRvb2x0aXBzLlxuICAkKCdbZGF0YS10b2dnbGU9XCJ0b29sdGlwXCJdJykudG9vbHRpcCgpO1xuXG4gIC8vIFBvcHB5IChwb3BvdmVycykuXG4gICQoJy5wb3BweS10b2dnbGUnKS5vbignY2xpY2snLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICB2YXIgJGVsZW1lbnQgPSAkKHRoaXMpO1xuICAgIHZhciAkcGFyZW50ID0gJGVsZW1lbnQucGFyZW50cygnLnBvcHB5Jyk7XG5cbiAgICAvLyBNYWtlIHN1cmUgdGhhdCBubyBvdGhlciBcInBvcHB5c1wiIGFyZSBvcGVuLlxuICAgICQoJy5wb3BweS0tb3BlbicpXG4gICAgICAubm90KCRwYXJlbnQpXG4gICAgICAucmVtb3ZlQ2xhc3MoJ3BvcHB5LS1vcGVuJyk7XG5cbiAgICAvLyBUb2dnbGUgdGhlIGNsYXNzIG9uIHRoaXMgZWxlbWVudC5cbiAgICAkcGFyZW50LnRvZ2dsZUNsYXNzKCdwb3BweS0tb3BlbicpO1xuICB9KTtcbiAgJCgnLnBvcHB5Jykub24oJ2NsaWNrJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gIH0pO1xuICAkKCdib2R5Jykub24oJ2NsaWNrJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgJCgnLnBvcHB5LS1vcGVuJykucmVtb3ZlQ2xhc3MoJ3BvcHB5LS1vcGVuJyk7XG4gIH0pO1xuXG4gIC8vIEFqYXhpIGNsaWNrIGxvYWRlci5cbiAgJCgnW2RhdGEtYWpheGktc291cmNlXScpLm9uKCdjbGljaycsIGZ1bmN0aW9uIChldmVudCkge1xuICAgIHZhciAkZWxlbWVudCA9ICQodGhpcyk7XG4gICAgdmFyIHRhcmdldCA9ICRlbGVtZW50LmF0dHIoJ2RhdGEtYWpheGktdGFyZ2V0Jyk7XG4gICAgdmFyIHNvdXJjZSA9ICRlbGVtZW50LmF0dHIoJ2RhdGEtYWpheGktc291cmNlJyk7XG4gICAgdmFyIGxvYWRpbmcgPSAkZWxlbWVudC5hdHRyKCdkYXRhLWFqYXhpLWxvYWRpbmcnKTtcblxuICAgIC8vIFNldCBsb2FkaW5nIHRleHQuXG4gICAgJCh0YXJnZXQpLmh0bWwobG9hZGluZyk7XG5cbiAgICAvLyBMb2FkIGV4dGVybmFsIGNvbnRlbnQuXG4gICAgJCh0YXJnZXQpLmxvYWQoc291cmNlKTtcbiAgfSk7XG5cbiAgLy8gU3dpdGNoIG1vZGUgdG9nZ2xlIGNhbGxiYWNrLlxuICAkKCcjbWVldGluZy1hZ2VuZGEtc3dpdGNoLW1vZGUtdG9nZ2xlJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgJCgnI2FnZW5kYS1vdmVydmlldycpLnRvZ2dsZUNsYXNzKCdoaWRkZW4nKTtcbiAgICAkKCcjYWdlbmRhLWl0ZW0tcmVvcmRlcicpLnRvZ2dsZUNsYXNzKCdoaWRkZW4nKTtcblxuICAgIC8vIFJlc2V0dGluZyBzZWFyY2guXG4gICAgJCgnLmJ1bGxldHBvaW50JykucmVtb3ZlQ2xhc3MoJ2hpZGRlbicpO1xuICAgICQoJ2Zvcm0uZGVjcmV0by1jb250ZW50LW1vZGlmeS1zZWFyY2gtaW4tbWVldGluZy1mb3JtIGlucHV0JykudmFsKCcnKTtcblxuICAgIC8vIFRvZ2dsZSBzZWFyY2ggZW5hYmxlZC5cbiAgICBpZiAoJCgnI2FnZW5kYS1vdmVydmlldycpLmhhc0NsYXNzKCdoaWRkZW4nKSkge1xuICAgICAgJCgnZm9ybS5kZWNyZXRvLWNvbnRlbnQtbW9kaWZ5LXNlYXJjaC1pbi1tZWV0aW5nLWZvcm0gaW5wdXQnKS5hdHRyKCdkaXNhYmxlZCcsICdkaXNhYmxlZCcpXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgJCgnZm9ybS5kZWNyZXRvLWNvbnRlbnQtbW9kaWZ5LXNlYXJjaC1pbi1tZWV0aW5nLWZvcm0gaW5wdXQnKS5yZW1vdmVBdHRyKCdkaXNhYmxlZCcpO1xuICAgIH1cblxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gIH0pO1xufSk7XG4iXX0=
