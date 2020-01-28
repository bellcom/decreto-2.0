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

(function () {})();

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

    // Add selected bulletpoint param to URL.
    window.history.pushState(null, null, '?bulletpoint=' + id);

    // Toggle visibility.
    parent.classList.toggle('bulletpoint--open');
  }

  // Handle "add bulletpoint".
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBhY2UuanMiLCJib290c3RyYXAuanMiLCJmbGV4eS1oZWFkZXIuanMiLCJmbGV4eS1uYXZpZ2F0aW9uLmpzIiwianF1ZXJ5LnNpZHIuanMiLCJidWxsZXRwb2ludC5qcyIsInNpZGViYXIuanMiLCJhcHAuanMiXSwibmFtZXMiOlsiQWpheE1vbml0b3IiLCJCYXIiLCJEb2N1bWVudE1vbml0b3IiLCJFbGVtZW50TW9uaXRvciIsIkVsZW1lbnRUcmFja2VyIiwiRXZlbnRMYWdNb25pdG9yIiwiRXZlbnRlZCIsIkV2ZW50cyIsIk5vVGFyZ2V0RXJyb3IiLCJQYWNlIiwiUmVxdWVzdEludGVyY2VwdCIsIlNPVVJDRV9LRVlTIiwiU2NhbGVyIiwiU29ja2V0UmVxdWVzdFRyYWNrZXIiLCJYSFJSZXF1ZXN0VHJhY2tlciIsImFuaW1hdGlvbiIsImF2Z0FtcGxpdHVkZSIsImJhciIsImNhbmNlbEFuaW1hdGlvbiIsImNhbmNlbEFuaW1hdGlvbkZyYW1lIiwiZGVmYXVsdE9wdGlvbnMiLCJleHRlbmQiLCJleHRlbmROYXRpdmUiLCJnZXRGcm9tRE9NIiwiZ2V0SW50ZXJjZXB0IiwiaGFuZGxlUHVzaFN0YXRlIiwiaWdub3JlU3RhY2siLCJpbml0Iiwibm93Iiwib3B0aW9ucyIsInJlcXVlc3RBbmltYXRpb25GcmFtZSIsInJlc3VsdCIsInJ1bkFuaW1hdGlvbiIsInNjYWxlcnMiLCJzaG91bGRJZ25vcmVVUkwiLCJzaG91bGRUcmFjayIsInNvdXJjZSIsInNvdXJjZXMiLCJ1bmlTY2FsZXIiLCJfV2ViU29ja2V0IiwiX1hEb21haW5SZXF1ZXN0IiwiX1hNTEh0dHBSZXF1ZXN0IiwiX2kiLCJfaW50ZXJjZXB0IiwiX2xlbiIsIl9wdXNoU3RhdGUiLCJfcmVmIiwiX3JlZjEiLCJfcmVwbGFjZVN0YXRlIiwiX19zbGljZSIsInNsaWNlIiwiX19oYXNQcm9wIiwiaGFzT3duUHJvcGVydHkiLCJfX2V4dGVuZHMiLCJjaGlsZCIsInBhcmVudCIsImtleSIsImNhbGwiLCJjdG9yIiwiY29uc3RydWN0b3IiLCJwcm90b3R5cGUiLCJfX3N1cGVyX18iLCJfX2luZGV4T2YiLCJpbmRleE9mIiwiaXRlbSIsImkiLCJsIiwibGVuZ3RoIiwiY2F0Y2h1cFRpbWUiLCJpbml0aWFsUmF0ZSIsIm1pblRpbWUiLCJnaG9zdFRpbWUiLCJtYXhQcm9ncmVzc1BlckZyYW1lIiwiZWFzZUZhY3RvciIsInN0YXJ0T25QYWdlTG9hZCIsInJlc3RhcnRPblB1c2hTdGF0ZSIsInJlc3RhcnRPblJlcXVlc3RBZnRlciIsInRhcmdldCIsImVsZW1lbnRzIiwiY2hlY2tJbnRlcnZhbCIsInNlbGVjdG9ycyIsImV2ZW50TGFnIiwibWluU2FtcGxlcyIsInNhbXBsZUNvdW50IiwibGFnVGhyZXNob2xkIiwiYWpheCIsInRyYWNrTWV0aG9kcyIsInRyYWNrV2ViU29ja2V0cyIsImlnbm9yZVVSTHMiLCJwZXJmb3JtYW5jZSIsIkRhdGUiLCJ3aW5kb3ciLCJtb3pSZXF1ZXN0QW5pbWF0aW9uRnJhbWUiLCJ3ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUiLCJtc1JlcXVlc3RBbmltYXRpb25GcmFtZSIsIm1vekNhbmNlbEFuaW1hdGlvbkZyYW1lIiwiZm4iLCJzZXRUaW1lb3V0IiwiaWQiLCJjbGVhclRpbWVvdXQiLCJsYXN0IiwidGljayIsImRpZmYiLCJhcmdzIiwib2JqIiwiYXJndW1lbnRzIiwiYXBwbHkiLCJvdXQiLCJ2YWwiLCJhcnIiLCJjb3VudCIsInN1bSIsInYiLCJNYXRoIiwiYWJzIiwianNvbiIsImRhdGEiLCJlIiwiZWwiLCJkb2N1bWVudCIsInF1ZXJ5U2VsZWN0b3IiLCJnZXRBdHRyaWJ1dGUiLCJKU09OIiwicGFyc2UiLCJfZXJyb3IiLCJjb25zb2xlIiwiZXJyb3IiLCJvbiIsImV2ZW50IiwiaGFuZGxlciIsImN0eCIsIm9uY2UiLCJfYmFzZSIsImJpbmRpbmdzIiwicHVzaCIsIm9mZiIsIl9yZXN1bHRzIiwic3BsaWNlIiwidHJpZ2dlciIsInBhY2VPcHRpb25zIiwiX3N1cGVyIiwiRXJyb3IiLCJwcm9ncmVzcyIsImdldEVsZW1lbnQiLCJ0YXJnZXRFbGVtZW50IiwiY3JlYXRlRWxlbWVudCIsImNsYXNzTmFtZSIsImJvZHkiLCJyZXBsYWNlIiwiaW5uZXJIVE1MIiwiZmlyc3RDaGlsZCIsImluc2VydEJlZm9yZSIsImFwcGVuZENoaWxkIiwiZmluaXNoIiwidXBkYXRlIiwicHJvZyIsInJlbmRlciIsImRlc3Ryb3kiLCJwYXJlbnROb2RlIiwicmVtb3ZlQ2hpbGQiLCJwcm9ncmVzc1N0ciIsInRyYW5zZm9ybSIsIl9qIiwiX2xlbjEiLCJfcmVmMiIsImNoaWxkcmVuIiwic3R5bGUiLCJsYXN0UmVuZGVyZWRQcm9ncmVzcyIsInNldEF0dHJpYnV0ZSIsImRvbmUiLCJuYW1lIiwiYmluZGluZyIsIlhNTEh0dHBSZXF1ZXN0IiwiWERvbWFpblJlcXVlc3QiLCJXZWJTb2NrZXQiLCJ0byIsImZyb20iLCJPYmplY3QiLCJkZWZpbmVQcm9wZXJ0eSIsImdldCIsImNvbmZpZ3VyYWJsZSIsImVudW1lcmFibGUiLCJpZ25vcmUiLCJyZXQiLCJ1bnNoaWZ0Iiwic2hpZnQiLCJ0cmFjayIsIm1ldGhvZCIsInRvVXBwZXJDYXNlIiwibW9uaXRvclhIUiIsIl90aGlzIiwicmVxIiwiX29wZW4iLCJvcGVuIiwidHlwZSIsInVybCIsImFzeW5jIiwicmVxdWVzdCIsImZsYWdzIiwicHJvdG9jb2xzIiwicGF0dGVybiIsInRlc3QiLCJfYXJnIiwiYWZ0ZXIiLCJydW5uaW5nIiwic3RpbGxBY3RpdmUiLCJfcmVmMyIsInJlYWR5U3RhdGUiLCJyZXN0YXJ0Iiwid2F0Y2giLCJ0cmFja2VyIiwic2l6ZSIsIl9vbnJlYWR5c3RhdGVjaGFuZ2UiLCJQcm9ncmVzc0V2ZW50IiwiYWRkRXZlbnRMaXN0ZW5lciIsImV2dCIsImxlbmd0aENvbXB1dGFibGUiLCJsb2FkZWQiLCJ0b3RhbCIsIm9ucmVhZHlzdGF0ZWNoYW5nZSIsInNlbGVjdG9yIiwiY2hlY2siLCJzdGF0ZXMiLCJsb2FkaW5nIiwiaW50ZXJhY3RpdmUiLCJjb21wbGV0ZSIsImF2ZyIsImludGVydmFsIiwicG9pbnRzIiwic2FtcGxlcyIsInNldEludGVydmFsIiwiY2xlYXJJbnRlcnZhbCIsInNpbmNlTGFzdFVwZGF0ZSIsInJhdGUiLCJjYXRjaHVwIiwibGFzdFByb2dyZXNzIiwiZnJhbWVUaW1lIiwic2NhbGluZyIsInBvdyIsIm1pbiIsIm1heCIsImhpc3RvcnkiLCJwdXNoU3RhdGUiLCJyZXBsYWNlU3RhdGUiLCJfayIsIl9sZW4yIiwiX3JlZjQiLCJleHRyYVNvdXJjZXMiLCJzdG9wIiwic3RhcnQiLCJnbyIsImVucXVldWVOZXh0RnJhbWUiLCJlbGVtZW50IiwiaiIsInJlbWFpbmluZyIsInNjYWxlciIsInNjYWxlckxpc3QiLCJfb3B0aW9ucyIsImRlZmluZSIsImFtZCIsImV4cG9ydHMiLCJtb2R1bGUiLCJqUXVlcnkiLCIkIiwidmVyc2lvbiIsImpxdWVyeSIsInNwbGl0IiwidHJhbnNpdGlvbkVuZCIsInRyYW5zRW5kRXZlbnROYW1lcyIsIldlYmtpdFRyYW5zaXRpb24iLCJNb3pUcmFuc2l0aW9uIiwiT1RyYW5zaXRpb24iLCJ0cmFuc2l0aW9uIiwidW5kZWZpbmVkIiwiZW5kIiwiZW11bGF0ZVRyYW5zaXRpb25FbmQiLCJkdXJhdGlvbiIsImNhbGxlZCIsIiRlbCIsIm9uZSIsImNhbGxiYWNrIiwic3VwcG9ydCIsInNwZWNpYWwiLCJic1RyYW5zaXRpb25FbmQiLCJiaW5kVHlwZSIsImRlbGVnYXRlVHlwZSIsImhhbmRsZSIsImlzIiwiaGFuZGxlT2JqIiwiZGlzbWlzcyIsIkFsZXJ0IiwiY2xvc2UiLCJWRVJTSU9OIiwiVFJBTlNJVElPTl9EVVJBVElPTiIsIiR0aGlzIiwiYXR0ciIsIiRwYXJlbnQiLCJmaW5kIiwicHJldmVudERlZmF1bHQiLCJjbG9zZXN0IiwiRXZlbnQiLCJpc0RlZmF1bHRQcmV2ZW50ZWQiLCJyZW1vdmVDbGFzcyIsInJlbW92ZUVsZW1lbnQiLCJkZXRhY2giLCJyZW1vdmUiLCJoYXNDbGFzcyIsIlBsdWdpbiIsIm9wdGlvbiIsImVhY2giLCJvbGQiLCJhbGVydCIsIkNvbnN0cnVjdG9yIiwibm9Db25mbGljdCIsIkJ1dHRvbiIsIiRlbGVtZW50IiwiREVGQVVMVFMiLCJpc0xvYWRpbmciLCJsb2FkaW5nVGV4dCIsInNldFN0YXRlIiwic3RhdGUiLCJkIiwicmVzZXRUZXh0IiwicHJveHkiLCJhZGRDbGFzcyIsInByb3AiLCJyZW1vdmVBdHRyIiwidG9nZ2xlIiwiY2hhbmdlZCIsIiRpbnB1dCIsInRvZ2dsZUNsYXNzIiwiYnV0dG9uIiwiJGJ0biIsImZpcnN0IiwiQ2Fyb3VzZWwiLCIkaW5kaWNhdG9ycyIsInBhdXNlZCIsInNsaWRpbmciLCIkYWN0aXZlIiwiJGl0ZW1zIiwia2V5Ym9hcmQiLCJrZXlkb3duIiwicGF1c2UiLCJkb2N1bWVudEVsZW1lbnQiLCJjeWNsZSIsIndyYXAiLCJ0YWdOYW1lIiwid2hpY2giLCJwcmV2IiwibmV4dCIsImdldEl0ZW1JbmRleCIsImluZGV4IiwiZ2V0SXRlbUZvckRpcmVjdGlvbiIsImRpcmVjdGlvbiIsImFjdGl2ZSIsImFjdGl2ZUluZGV4Iiwid2lsbFdyYXAiLCJkZWx0YSIsIml0ZW1JbmRleCIsImVxIiwicG9zIiwidGhhdCIsInNsaWRlIiwiJG5leHQiLCJpc0N5Y2xpbmciLCJyZWxhdGVkVGFyZ2V0Iiwic2xpZGVFdmVudCIsIiRuZXh0SW5kaWNhdG9yIiwic2xpZEV2ZW50Iiwib2Zmc2V0V2lkdGgiLCJqb2luIiwiYWN0aW9uIiwiY2Fyb3VzZWwiLCJjbGlja0hhbmRsZXIiLCJocmVmIiwiJHRhcmdldCIsInNsaWRlSW5kZXgiLCIkY2Fyb3VzZWwiLCJDb2xsYXBzZSIsIiR0cmlnZ2VyIiwidHJhbnNpdGlvbmluZyIsImdldFBhcmVudCIsImFkZEFyaWFBbmRDb2xsYXBzZWRDbGFzcyIsImRpbWVuc2lvbiIsImhhc1dpZHRoIiwic2hvdyIsImFjdGl2ZXNEYXRhIiwiYWN0aXZlcyIsInN0YXJ0RXZlbnQiLCJzY3JvbGxTaXplIiwiY2FtZWxDYXNlIiwiaGlkZSIsIm9mZnNldEhlaWdodCIsImdldFRhcmdldEZyb21UcmlnZ2VyIiwiaXNPcGVuIiwiY29sbGFwc2UiLCJiYWNrZHJvcCIsIkRyb3Bkb3duIiwiY2xlYXJNZW51cyIsImNvbnRhaW5zIiwiaXNBY3RpdmUiLCJpbnNlcnRBZnRlciIsInN0b3BQcm9wYWdhdGlvbiIsImRlc2MiLCJkcm9wZG93biIsIk1vZGFsIiwiJGJvZHkiLCIkZGlhbG9nIiwiJGJhY2tkcm9wIiwiaXNTaG93biIsIm9yaWdpbmFsQm9keVBhZCIsInNjcm9sbGJhcldpZHRoIiwiaWdub3JlQmFja2Ryb3BDbGljayIsImZpeGVkQ29udGVudCIsInJlbW90ZSIsImxvYWQiLCJCQUNLRFJPUF9UUkFOU0lUSU9OX0RVUkFUSU9OIiwiX3JlbGF0ZWRUYXJnZXQiLCJjaGVja1Njcm9sbGJhciIsInNldFNjcm9sbGJhciIsImVzY2FwZSIsInJlc2l6ZSIsImFwcGVuZFRvIiwic2Nyb2xsVG9wIiwiYWRqdXN0RGlhbG9nIiwiZW5mb3JjZUZvY3VzIiwiaGlkZU1vZGFsIiwiaGFzIiwiaGFuZGxlVXBkYXRlIiwicmVzZXRBZGp1c3RtZW50cyIsInJlc2V0U2Nyb2xsYmFyIiwicmVtb3ZlQmFja2Ryb3AiLCJhbmltYXRlIiwiZG9BbmltYXRlIiwiY3VycmVudFRhcmdldCIsImZvY3VzIiwiY2FsbGJhY2tSZW1vdmUiLCJtb2RhbElzT3ZlcmZsb3dpbmciLCJzY3JvbGxIZWlnaHQiLCJjbGllbnRIZWlnaHQiLCJjc3MiLCJwYWRkaW5nTGVmdCIsImJvZHlJc092ZXJmbG93aW5nIiwicGFkZGluZ1JpZ2h0IiwiZnVsbFdpbmRvd1dpZHRoIiwiaW5uZXJXaWR0aCIsImRvY3VtZW50RWxlbWVudFJlY3QiLCJnZXRCb3VuZGluZ0NsaWVudFJlY3QiLCJyaWdodCIsImxlZnQiLCJjbGllbnRXaWR0aCIsIm1lYXN1cmVTY3JvbGxiYXIiLCJib2R5UGFkIiwicGFyc2VJbnQiLCJhY3R1YWxQYWRkaW5nIiwiY2FsY3VsYXRlZFBhZGRpbmciLCJwYXJzZUZsb2F0IiwicGFkZGluZyIsInJlbW92ZURhdGEiLCJzY3JvbGxEaXYiLCJhcHBlbmQiLCJtb2RhbCIsInNob3dFdmVudCIsIkRJU0FMTE9XRURfQVRUUklCVVRFUyIsInVyaUF0dHJzIiwiQVJJQV9BVFRSSUJVVEVfUEFUVEVSTiIsIkRlZmF1bHRXaGl0ZWxpc3QiLCJhIiwiYXJlYSIsImIiLCJiciIsImNvbCIsImNvZGUiLCJkaXYiLCJlbSIsImhyIiwiaDEiLCJoMiIsImgzIiwiaDQiLCJoNSIsImg2IiwiaW1nIiwibGkiLCJvbCIsInAiLCJwcmUiLCJzIiwic21hbGwiLCJzcGFuIiwic3ViIiwic3VwIiwic3Ryb25nIiwidSIsInVsIiwiU0FGRV9VUkxfUEFUVEVSTiIsIkRBVEFfVVJMX1BBVFRFUk4iLCJhbGxvd2VkQXR0cmlidXRlIiwiYWxsb3dlZEF0dHJpYnV0ZUxpc3QiLCJhdHRyTmFtZSIsIm5vZGVOYW1lIiwidG9Mb3dlckNhc2UiLCJpbkFycmF5IiwiQm9vbGVhbiIsIm5vZGVWYWx1ZSIsIm1hdGNoIiwicmVnRXhwIiwiZmlsdGVyIiwidmFsdWUiLCJSZWdFeHAiLCJzYW5pdGl6ZUh0bWwiLCJ1bnNhZmVIdG1sIiwid2hpdGVMaXN0Iiwic2FuaXRpemVGbiIsImltcGxlbWVudGF0aW9uIiwiY3JlYXRlSFRNTERvY3VtZW50IiwiY3JlYXRlZERvY3VtZW50Iiwid2hpdGVsaXN0S2V5cyIsIm1hcCIsImxlbiIsImVsTmFtZSIsImF0dHJpYnV0ZUxpc3QiLCJhdHRyaWJ1dGVzIiwid2hpdGVsaXN0ZWRBdHRyaWJ1dGVzIiwiY29uY2F0IiwibGVuMiIsInJlbW92ZUF0dHJpYnV0ZSIsIlRvb2x0aXAiLCJlbmFibGVkIiwidGltZW91dCIsImhvdmVyU3RhdGUiLCJpblN0YXRlIiwicGxhY2VtZW50IiwidGVtcGxhdGUiLCJ0aXRsZSIsImRlbGF5IiwiaHRtbCIsImNvbnRhaW5lciIsInZpZXdwb3J0Iiwic2FuaXRpemUiLCJnZXRPcHRpb25zIiwiJHZpZXdwb3J0IiwiaXNGdW5jdGlvbiIsImNsaWNrIiwiaG92ZXIiLCJ0cmlnZ2VycyIsImV2ZW50SW4iLCJldmVudE91dCIsImVudGVyIiwibGVhdmUiLCJmaXhUaXRsZSIsImdldERlZmF1bHRzIiwiZGF0YUF0dHJpYnV0ZXMiLCJkYXRhQXR0ciIsImdldERlbGVnYXRlT3B0aW9ucyIsImRlZmF1bHRzIiwic2VsZiIsInRpcCIsImlzSW5TdGF0ZVRydWUiLCJoYXNDb250ZW50IiwiaW5Eb20iLCJvd25lckRvY3VtZW50IiwiJHRpcCIsInRpcElkIiwiZ2V0VUlEIiwic2V0Q29udGVudCIsImF1dG9Ub2tlbiIsImF1dG9QbGFjZSIsInRvcCIsImRpc3BsYXkiLCJnZXRQb3NpdGlvbiIsImFjdHVhbFdpZHRoIiwiYWN0dWFsSGVpZ2h0Iiwib3JnUGxhY2VtZW50Iiwidmlld3BvcnREaW0iLCJib3R0b20iLCJ3aWR0aCIsImNhbGN1bGF0ZWRPZmZzZXQiLCJnZXRDYWxjdWxhdGVkT2Zmc2V0IiwiYXBwbHlQbGFjZW1lbnQiLCJwcmV2SG92ZXJTdGF0ZSIsIm9mZnNldCIsImhlaWdodCIsIm1hcmdpblRvcCIsIm1hcmdpbkxlZnQiLCJpc05hTiIsInNldE9mZnNldCIsInVzaW5nIiwicHJvcHMiLCJyb3VuZCIsImdldFZpZXdwb3J0QWRqdXN0ZWREZWx0YSIsImlzVmVydGljYWwiLCJhcnJvd0RlbHRhIiwiYXJyb3dPZmZzZXRQb3NpdGlvbiIsInJlcGxhY2VBcnJvdyIsImFycm93IiwiZ2V0VGl0bGUiLCJ0ZXh0IiwiJGUiLCJpc0JvZHkiLCJlbFJlY3QiLCJpc1N2ZyIsIlNWR0VsZW1lbnQiLCJlbE9mZnNldCIsInNjcm9sbCIsIm91dGVyRGltcyIsInZpZXdwb3J0UGFkZGluZyIsInZpZXdwb3J0RGltZW5zaW9ucyIsInRvcEVkZ2VPZmZzZXQiLCJib3R0b21FZGdlT2Zmc2V0IiwibGVmdEVkZ2VPZmZzZXQiLCJyaWdodEVkZ2VPZmZzZXQiLCJvIiwicHJlZml4IiwicmFuZG9tIiwiZ2V0RWxlbWVudEJ5SWQiLCIkYXJyb3ciLCJlbmFibGUiLCJkaXNhYmxlIiwidG9nZ2xlRW5hYmxlZCIsInRvb2x0aXAiLCJQb3BvdmVyIiwiY29udGVudCIsImdldENvbnRlbnQiLCJ0eXBlQ29udGVudCIsInBvcG92ZXIiLCJTY3JvbGxTcHkiLCIkc2Nyb2xsRWxlbWVudCIsIm9mZnNldHMiLCJ0YXJnZXRzIiwiYWN0aXZlVGFyZ2V0IiwicHJvY2VzcyIsInJlZnJlc2giLCJnZXRTY3JvbGxIZWlnaHQiLCJvZmZzZXRNZXRob2QiLCJvZmZzZXRCYXNlIiwiaXNXaW5kb3ciLCIkaHJlZiIsInNvcnQiLCJtYXhTY3JvbGwiLCJhY3RpdmF0ZSIsImNsZWFyIiwicGFyZW50cyIsInBhcmVudHNVbnRpbCIsInNjcm9sbHNweSIsIiRzcHkiLCJUYWIiLCIkdWwiLCIkcHJldmlvdXMiLCJoaWRlRXZlbnQiLCJ0YWIiLCJBZmZpeCIsImNoZWNrUG9zaXRpb24iLCJjaGVja1Bvc2l0aW9uV2l0aEV2ZW50TG9vcCIsImFmZml4ZWQiLCJ1bnBpbiIsInBpbm5lZE9mZnNldCIsIlJFU0VUIiwiZ2V0U3RhdGUiLCJvZmZzZXRUb3AiLCJvZmZzZXRCb3R0b20iLCJwb3NpdGlvbiIsInRhcmdldEhlaWdodCIsImluaXRpYWxpemluZyIsImNvbGxpZGVyVG9wIiwiY29sbGlkZXJIZWlnaHQiLCJnZXRQaW5uZWRPZmZzZXQiLCJhZmZpeCIsImFmZml4VHlwZSIsImZsZXh5X2hlYWRlciIsInB1YiIsIiRoZWFkZXJfc3RhdGljIiwiJGhlYWRlcl9zdGlja3kiLCJ1cGRhdGVfaW50ZXJ2YWwiLCJ0b2xlcmFuY2UiLCJ1cHdhcmQiLCJkb3dud2FyZCIsIl9nZXRfb2Zmc2V0X2Zyb21fZWxlbWVudHNfYm90dG9tIiwiY2xhc3NlcyIsInBpbm5lZCIsInVucGlubmVkIiwid2FzX3Njcm9sbGVkIiwibGFzdF9kaXN0YW5jZV9mcm9tX3RvcCIsInJlZ2lzdGVyRXZlbnRIYW5kbGVycyIsInJlZ2lzdGVyQm9vdEV2ZW50SGFuZGxlcnMiLCJkb2N1bWVudF93YXNfc2Nyb2xsZWQiLCJlbGVtZW50X2hlaWdodCIsIm91dGVySGVpZ2h0IiwiZWxlbWVudF9vZmZzZXQiLCJjdXJyZW50X2Rpc3RhbmNlX2Zyb21fdG9wIiwiZmxleHlfbmF2aWdhdGlvbiIsImxheW91dF9jbGFzc2VzIiwidXBncmFkZSIsIiRuYXZpZ2F0aW9ucyIsIm5hdmlnYXRpb24iLCIkbmF2aWdhdGlvbiIsIiRtZWdhbWVudXMiLCJkcm9wZG93bl9tZWdhbWVudSIsIiRkcm9wZG93bl9tZWdhbWVudSIsImRyb3Bkb3duX2hhc19tZWdhbWVudSIsImlzX3VwZ3JhZGVkIiwibmF2aWdhdGlvbl9oYXNfbWVnYW1lbnUiLCIkbWVnYW1lbnUiLCJoYXNfb2JmdXNjYXRvciIsIm9iZnVzY2F0b3IiLCJiYWJlbEhlbHBlcnMiLCJjbGFzc0NhbGxDaGVjayIsImluc3RhbmNlIiwiVHlwZUVycm9yIiwiY3JlYXRlQ2xhc3MiLCJkZWZpbmVQcm9wZXJ0aWVzIiwiZGVzY3JpcHRvciIsIndyaXRhYmxlIiwicHJvdG9Qcm9wcyIsInN0YXRpY1Byb3BzIiwic2lkclN0YXR1cyIsIm1vdmluZyIsIm9wZW5lZCIsImhlbHBlciIsImlzVXJsIiwic3RyIiwiYWRkUHJlZml4ZXMiLCJhZGRQcmVmaXgiLCJhdHRyaWJ1dGUiLCJ0b1JlcGxhY2UiLCJ0cmFuc2l0aW9ucyIsInN1cHBvcnRlZCIsInByb3BlcnR5IiwicHJlZml4ZXMiLCJjaGFyQXQiLCJzdWJzdHIiLCIkJDIiLCJib2R5QW5pbWF0aW9uQ2xhc3MiLCJvcGVuQWN0aW9uIiwiY2xvc2VBY3Rpb24iLCJ0cmFuc2l0aW9uRW5kRXZlbnQiLCJNZW51Iiwib3BlbkNsYXNzIiwibWVudVdpZHRoIiwib3V0ZXJXaWR0aCIsInNwZWVkIiwic2lkZSIsImRpc3BsYWNlIiwidGltaW5nIiwib25PcGVuQ2FsbGJhY2siLCJvbkNsb3NlQ2FsbGJhY2siLCJvbk9wZW5FbmRDYWxsYmFjayIsIm9uQ2xvc2VFbmRDYWxsYmFjayIsImdldEFuaW1hdGlvbiIsInByZXBhcmVCb2R5IiwiJGh0bWwiLCJvcGVuQm9keSIsImJvZHlBbmltYXRpb24iLCJxdWV1ZSIsIm9uQ2xvc2VCb2R5IiwicmVzZXRTdHlsZXMiLCJ1bmJpbmQiLCJjbG9zZUJvZHkiLCJtb3ZlQm9keSIsIm9uT3Blbk1lbnUiLCJvcGVuTWVudSIsIl90aGlzMiIsIiRpdGVtIiwibWVudUFuaW1hdGlvbiIsIm9uQ2xvc2VNZW51IiwiY2xvc2VNZW51IiwiX3RoaXMzIiwibW92ZU1lbnUiLCJtb3ZlIiwiX3RoaXM0IiwiYWxyZWFkeU9wZW5lZE1lbnUiLCIkJDEiLCJleGVjdXRlIiwic2lkciIsInB1YmxpY01ldGhvZHMiLCJtZXRob2ROYW1lIiwibWV0aG9kcyIsImdldE1ldGhvZCIsIkFycmF5IiwiJCQzIiwiZmlsbENvbnRlbnQiLCIkc2lkZU1lbnUiLCJzZXR0aW5ncyIsIm5ld0NvbnRlbnQiLCJodG1sQ29udGVudCIsInJlbmFtaW5nIiwiJGh0bWxDb250ZW50IiwiZm5TaWRyIiwiYmluZCIsIm9uT3BlbiIsIm9uQ2xvc2UiLCJvbk9wZW5FbmQiLCJvbkNsb3NlRW5kIiwiZmxhZyIsInRvZ2dsZUFsbEJ1dHRvbnMiLCJxdWVyeVNlbGVjdG9yQWxsIiwidG9nZ2xlQnVsbGV0cG9pbnRCdXR0b25zIiwidG9nZ2xlQXR0YWNobWVudHNCdXR0b25zIiwiYWRkQnVsbGV0cG9pbnRCdXR0b25zIiwidG9nZ2xlQWxsQnV0dG9uIiwiaGFuZGxlVG9nZ2xlQWxsIiwiYnVsbGV0cG9pbnRzIiwiZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSIsImN1cnJlbnRTdGF0ZSIsImRhdGFzZXQiLCJidWxsZXRwb2ludCIsImNsYXNzTGlzdCIsImFkZCIsInRvZ2dsZUF0dGFjaG1lbnRCdXR0b24iLCJoYW5kbGVUb2dnbGVBdHRhY2htZW50cyIsImF0dGFjaG1lbnRzIiwiYXR0YWNobWVudCIsInRvZ2dsZUJ1bGxldHBvaW50QnV0dG9uIiwiaGFuZGxlVG9nZ2xlQnVsbGV0cG9pbnQiLCJkZWNyZXRvTm9kZUlkIiwiYWRkQnVsbGV0cG9pbnRCdXR0b24iLCJoYW5kbGVBZGRCdWxsZXRwb2ludCIsInF1ZXJ5U3RyaW5nIiwibG9jYXRpb24iLCJzZWFyY2giLCJ1cmxQYXJhbXMiLCJVUkxTZWFyY2hQYXJhbXMiLCJwYXJhbSIsImdldFVybFBhcmFtcyIsInBhcmFtcyIsInBhcnRzIiwibSIsInNpZGViYXIiLCJ0b2dnbGVzIiwidG9nZ2xlU3RhdGUiLCJsb2NhbFN0b3JhZ2UiLCJnZXRJdGVtIiwic2V0SXRlbSIsIm5vdCJdLCJtYXBwaW5ncyI6Ijs7OztBQUFBLENBQUMsWUFBVztBQUNWLE1BQUlBLFdBQUo7QUFBQSxNQUFpQkMsR0FBakI7QUFBQSxNQUFzQkMsZUFBdEI7QUFBQSxNQUF1Q0MsY0FBdkM7QUFBQSxNQUF1REMsY0FBdkQ7QUFBQSxNQUF1RUMsZUFBdkU7QUFBQSxNQUF3RkMsT0FBeEY7QUFBQSxNQUFpR0MsTUFBakc7QUFBQSxNQUF5R0MsYUFBekc7QUFBQSxNQUF3SEMsSUFBeEg7QUFBQSxNQUE4SEMsZ0JBQTlIO0FBQUEsTUFBZ0pDLFdBQWhKO0FBQUEsTUFBNkpDLE1BQTdKO0FBQUEsTUFBcUtDLG9CQUFySztBQUFBLE1BQTJMQyxpQkFBM0w7QUFBQSxNQUE4TUMsU0FBOU07QUFBQSxNQUF5TkMsWUFBek47QUFBQSxNQUF1T0MsR0FBdk87QUFBQSxNQUE0T0MsZUFBNU87QUFBQSxNQUE2UEMsb0JBQTdQO0FBQUEsTUFBbVJDLGNBQW5SO0FBQUEsTUFBbVNDLE9BQW5TO0FBQUEsTUFBMlNDLFlBQTNTO0FBQUEsTUFBeVRDLFVBQXpUO0FBQUEsTUFBcVVDLFlBQXJVO0FBQUEsTUFBbVZDLGVBQW5WO0FBQUEsTUFBb1dDLFdBQXBXO0FBQUEsTUFBaVhDLElBQWpYO0FBQUEsTUFBdVhDLEdBQXZYO0FBQUEsTUFBNFhDLE9BQTVYO0FBQUEsTUFBcVlDLHFCQUFyWTtBQUFBLE1BQTRaQyxNQUE1WjtBQUFBLE1BQW9hQyxZQUFwYTtBQUFBLE1BQWtiQyxPQUFsYjtBQUFBLE1BQTJiQyxlQUEzYjtBQUFBLE1BQTRjQyxXQUE1YztBQUFBLE1BQXlkQyxNQUF6ZDtBQUFB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bmN0aW9uKCkge1xuICB2YXIgQWpheE1vbml0b3IsIEJhciwgRG9jdW1lbnRNb25pdG9yLCBFbGVtZW50TW9uaXRvciwgRWxlbWVudFRyYWNrZXIsIEV2ZW50TGFnTW9uaXRvciwgRXZlbnRlZCwgRXZlbnRzLCBOb1RhcmdldEVycm9yLCBQYWNlLCBSZXF1ZXN0SW50ZXJjZXB0LCBTT1VSQ0VfS0VZUywgU2NhbGVyLCBTb2NrZXRSZXF1ZXN0VHJhY2tlciwgWEhSUmVxdWVzdFRyYWNrZXIsIGFuaW1hdGlvbiwgYXZnQW1wbGl0dWRlLCBiYXIsIGNhbmNlbEFuaW1hdGlvbiwgY2FuY2VsQW5pbWF0aW9uRnJhbWUsIGRlZmF1bHRPcHRpb25zLCBleHRlbmQsIGV4dGVuZE5hdGl2ZSwgZ2V0RnJvbURPTSwgZ2V0SW50ZXJjZXB0LCBoYW5kbGVQdXNoU3RhdGUsIGlnbm9yZVN0YWNrLCBpbml0LCBub3csIG9wdGlvbnMsIHJlcXVlc3RBbmltYXRpb25GcmFtZSwgcmVzdWx0LCBydW5BbmltYXRpb24sIHNjYWxlcnMsIHNob3VsZElnbm9yZVVSTCwgc2hvdWxkVHJhY2ssIHNvdXJjZSwgc291cmNlcywgdW5pU2NhbGVyLCBfV2ViU29ja2V0LCBfWERvbWFpblJlcXVlc3QsIF9YTUxIdHRwUmVxdWVzdCwgX2ksIF9pbnRlcmNlcHQsIF9sZW4sIF9wdXNoU3RhdGUsIF9yZWYsIF9yZWYxLCBfcmVwbGFjZVN0YXRlLFxuICAgIF9fc2xpY2UgPSBbXS5zbGljZSxcbiAgICBfX2hhc1Byb3AgPSB7fS5oYXNPd25Qcm9wZXJ0eSxcbiAgICBfX2V4dGVuZHMgPSBmdW5jdGlvbihjaGlsZCwgcGFyZW50KSB7IGZvciAodmFyIGtleSBpbiBwYXJlbnQpIHsgaWYgKF9faGFzUHJvcC5jYWxsKHBhcmVudCwga2V5KSkgY2hpbGRba2V5XSA9IHBhcmVudFtrZXldOyB9IGZ1bmN0aW9uIGN0b3IoKSB7IHRoaXMuY29uc3RydWN0b3IgPSBjaGlsZDsgfSBjdG9yLnByb3RvdHlwZSA9IHBhcmVudC5wcm90b3R5cGU7IGNoaWxkLnByb3RvdHlwZSA9IG5ldyBjdG9yKCk7IGNoaWxkLl9fc3VwZXJfXyA9IHBhcmVudC5wcm90b3R5cGU7IHJldHVybiBjaGlsZDsgfSxcbiAgICBfX2luZGV4T2YgPSBbXS5pbmRleE9mIHx8IGZ1bmN0aW9uKGl0ZW0pIHsgZm9yICh2YXIgaSA9IDAsIGwgPSB0aGlzLmxlbmd0aDsgaSA8IGw7IGkrKykgeyBpZiAoaSBpbiB0aGlzICYmIHRoaXNbaV0gPT09IGl0ZW0pIHJldHVybiBpOyB9IHJldHVybiAtMTsgfTtcblxuICBkZWZhdWx0T3B0aW9ucyA9IHtcbiAgICBjYXRjaHVwVGltZTogMTAwLFxuICAgIGluaXRpYWxSYXRlOiAuMDMsXG4gICAgbWluVGltZTogMjUwLFxuICAgIGdob3N0VGltZTogMTAwLFxuICAgIG1heFByb2dyZXNzUGVyRnJhbWU6IDIwLFxuICAgIGVhc2VGYWN0b3I6IDEuMjUsXG4gICAgc3RhcnRPblBhZ2VMb2FkOiB0cnVlLFxuICAgIHJlc3RhcnRPblB1c2hTdGF0ZTogdHJ1ZSxcbiAgICByZXN0YXJ0T25SZXF1ZXN0QWZ0ZXI6IDUwMCxcbiAgICB0YXJnZXQ6ICdib2R5JyxcbiAgICBlbGVtZW50czoge1xuICAgICAgY2hlY2tJbnRlcnZhbDogMTAwLFxuICAgICAgc2VsZWN0b3JzOiBbJ2JvZHknXVxuICAgIH0sXG4gICAgZXZlbnRMYWc6IHtcbiAgICAgIG1pblNhbXBsZXM6IDEwLFxuICAgICAgc2FtcGxlQ291bnQ6IDMsXG4gICAgICBsYWdUaHJlc2hvbGQ6IDNcbiAgICB9LFxuICAgIGFqYXg6IHtcbiAgICAgIHRyYWNrTWV0aG9kczogWydHRVQnXSxcbiAgICAgIHRyYWNrV2ViU29ja2V0czogdHJ1ZSxcbiAgICAgIGlnbm9yZVVSTHM6IFtdXG4gICAgfVxuICB9O1xuXG4gIG5vdyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBfcmVmO1xuICAgIHJldHVybiAoX3JlZiA9IHR5cGVvZiBwZXJmb3JtYW5jZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBwZXJmb3JtYW5jZSAhPT0gbnVsbCA/IHR5cGVvZiBwZXJmb3JtYW5jZS5ub3cgPT09IFwiZnVuY3Rpb25cIiA/IHBlcmZvcm1hbmNlLm5vdygpIDogdm9pZCAwIDogdm9pZCAwKSAhPSBudWxsID8gX3JlZiA6ICsobmV3IERhdGUpO1xuICB9O1xuXG4gIHJlcXVlc3RBbmltYXRpb25GcmFtZSA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgd2luZG93Lm1velJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cud2Via2l0UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8IHdpbmRvdy5tc1JlcXVlc3RBbmltYXRpb25GcmFtZTtcblxuICBjYW5jZWxBbmltYXRpb25GcmFtZSA9IHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cubW96Q2FuY2VsQW5pbWF0aW9uRnJhbWU7XG5cbiAgaWYgKHJlcXVlc3RBbmltYXRpb25GcmFtZSA9PSBudWxsKSB7XG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gZnVuY3Rpb24oZm4pIHtcbiAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZuLCA1MCk7XG4gICAgfTtcbiAgICBjYW5jZWxBbmltYXRpb25GcmFtZSA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KGlkKTtcbiAgICB9O1xuICB9XG5cbiAgcnVuQW5pbWF0aW9uID0gZnVuY3Rpb24oZm4pIHtcbiAgICB2YXIgbGFzdCwgdGljaztcbiAgICBsYXN0ID0gbm93KCk7XG4gICAgdGljayA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGRpZmY7XG4gICAgICBkaWZmID0gbm93KCkgLSBsYXN0O1xuICAgICAgaWYgKGRpZmYgPj0gMzMpIHtcbiAgICAgICAgbGFzdCA9IG5vdygpO1xuICAgICAgICByZXR1cm4gZm4oZGlmZiwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIHJlcXVlc3RBbmltYXRpb25GcmFtZSh0aWNrKTtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dCh0aWNrLCAzMyAtIGRpZmYpO1xuICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIHRpY2soKTtcbiAgfTtcblxuICByZXN1bHQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgYXJncywga2V5LCBvYmo7XG4gICAgb2JqID0gYXJndW1lbnRzWzBdLCBrZXkgPSBhcmd1bWVudHNbMV0sIGFyZ3MgPSAzIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBfX3NsaWNlLmNhbGwoYXJndW1lbnRzLCAyKSA6IFtdO1xuICAgIGlmICh0eXBlb2Ygb2JqW2tleV0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiBvYmpba2V5XS5hcHBseShvYmosIGFyZ3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gb2JqW2tleV07XG4gICAgfVxuICB9O1xuXG4gIGV4dGVuZCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBrZXksIG91dCwgc291cmNlLCBzb3VyY2VzLCB2YWwsIF9pLCBfbGVuO1xuICAgIG91dCA9IGFyZ3VtZW50c1swXSwgc291cmNlcyA9IDIgPD0gYXJndW1lbnRzLmxlbmd0aCA/IF9fc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpIDogW107XG4gICAgZm9yIChfaSA9IDAsIF9sZW4gPSBzb3VyY2VzLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICBzb3VyY2UgPSBzb3VyY2VzW19pXTtcbiAgICAgIGlmIChzb3VyY2UpIHtcbiAgICAgICAgZm9yIChrZXkgaW4gc291cmNlKSB7XG4gICAgICAgICAgaWYgKCFfX2hhc1Byb3AuY2FsbChzb3VyY2UsIGtleSkpIGNvbnRpbnVlO1xuICAgICAgICAgIHZhbCA9IHNvdXJjZVtrZXldO1xuICAgICAgICAgIGlmICgob3V0W2tleV0gIT0gbnVsbCkgJiYgdHlwZW9mIG91dFtrZXldID09PSAnb2JqZWN0JyAmJiAodmFsICE9IG51bGwpICYmIHR5cGVvZiB2YWwgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBleHRlbmQob3V0W2tleV0sIHZhbCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG91dFtrZXldID0gdmFsO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb3V0O1xuICB9O1xuXG4gIGF2Z0FtcGxpdHVkZSA9IGZ1bmN0aW9uKGFycikge1xuICAgIHZhciBjb3VudCwgc3VtLCB2LCBfaSwgX2xlbjtcbiAgICBzdW0gPSBjb3VudCA9IDA7XG4gICAgZm9yIChfaSA9IDAsIF9sZW4gPSBhcnIubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgIHYgPSBhcnJbX2ldO1xuICAgICAgc3VtICs9IE1hdGguYWJzKHYpO1xuICAgICAgY291bnQrKztcbiAgICB9XG4gICAgcmV0dXJuIHN1bSAvIGNvdW50O1xuICB9O1xuXG4gIGdldEZyb21ET00gPSBmdW5jdGlvbihrZXksIGpzb24pIHtcbiAgICB2YXIgZGF0YSwgZSwgZWw7XG4gICAgaWYgKGtleSA9PSBudWxsKSB7XG4gICAgICBrZXkgPSAnb3B0aW9ucyc7XG4gICAgfVxuICAgIGlmIChqc29uID09IG51bGwpIHtcbiAgICAgIGpzb24gPSB0cnVlO1xuICAgIH1cbiAgICBlbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCJbZGF0YS1wYWNlLVwiICsga2V5ICsgXCJdXCIpO1xuICAgIGlmICghZWwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZGF0YSA9IGVsLmdldEF0dHJpYnV0ZShcImRhdGEtcGFjZS1cIiArIGtleSk7XG4gICAgaWYgKCFqc29uKSB7XG4gICAgICByZXR1cm4gZGF0YTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBKU09OLnBhcnNlKGRhdGEpO1xuICAgIH0gY2F0Y2ggKF9lcnJvcikge1xuICAgICAgZSA9IF9lcnJvcjtcbiAgICAgIHJldHVybiB0eXBlb2YgY29uc29sZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBjb25zb2xlICE9PSBudWxsID8gY29uc29sZS5lcnJvcihcIkVycm9yIHBhcnNpbmcgaW5saW5lIHBhY2Ugb3B0aW9uc1wiLCBlKSA6IHZvaWQgMDtcbiAgICB9XG4gIH07XG5cbiAgRXZlbnRlZCA9IChmdW5jdGlvbigpIHtcbiAgICBmdW5jdGlvbiBFdmVudGVkKCkge31cblxuICAgIEV2ZW50ZWQucHJvdG90eXBlLm9uID0gZnVuY3Rpb24oZXZlbnQsIGhhbmRsZXIsIGN0eCwgb25jZSkge1xuICAgICAgdmFyIF9iYXNlO1xuICAgICAgaWYgKG9uY2UgPT0gbnVsbCkge1xuICAgICAgICBvbmNlID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5iaW5kaW5ncyA9PSBudWxsKSB7XG4gICAgICAgIHRoaXMuYmluZGluZ3MgPSB7fTtcbiAgICAgIH1cbiAgICAgIGlmICgoX2Jhc2UgPSB0aGlzLmJpbmRpbmdzKVtldmVudF0gPT0gbnVsbCkge1xuICAgICAgICBfYmFzZVtldmVudF0gPSBbXTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLmJpbmRpbmdzW2V2ZW50XS5wdXNoKHtcbiAgICAgICAgaGFuZGxlcjogaGFuZGxlcixcbiAgICAgICAgY3R4OiBjdHgsXG4gICAgICAgIG9uY2U6IG9uY2VcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBFdmVudGVkLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24oZXZlbnQsIGhhbmRsZXIsIGN0eCkge1xuICAgICAgcmV0dXJuIHRoaXMub24oZXZlbnQsIGhhbmRsZXIsIGN0eCwgdHJ1ZSk7XG4gICAgfTtcblxuICAgIEV2ZW50ZWQucHJvdG90eXBlLm9mZiA9IGZ1bmN0aW9uKGV2ZW50LCBoYW5kbGVyKSB7XG4gICAgICB2YXIgaSwgX3JlZiwgX3Jlc3VsdHM7XG4gICAgICBpZiAoKChfcmVmID0gdGhpcy5iaW5kaW5ncykgIT0gbnVsbCA/IF9yZWZbZXZlbnRdIDogdm9pZCAwKSA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmIChoYW5kbGVyID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIGRlbGV0ZSB0aGlzLmJpbmRpbmdzW2V2ZW50XTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGkgPSAwO1xuICAgICAgICBfcmVzdWx0cyA9IFtdO1xuICAgICAgICB3aGlsZSAoaSA8IHRoaXMuYmluZGluZ3NbZXZlbnRdLmxlbmd0aCkge1xuICAgICAgICAgIGlmICh0aGlzLmJpbmRpbmdzW2V2ZW50XVtpXS5oYW5kbGVyID09PSBoYW5kbGVyKSB7XG4gICAgICAgICAgICBfcmVzdWx0cy5wdXNoKHRoaXMuYmluZGluZ3NbZXZlbnRdLnNwbGljZShpLCAxKSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIF9yZXN1bHRzLnB1c2goaSsrKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIF9yZXN1bHRzO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBFdmVudGVkLnByb3RvdHlwZS50cmlnZ2VyID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgYXJncywgY3R4LCBldmVudCwgaGFuZGxlciwgaSwgb25jZSwgX3JlZiwgX3JlZjEsIF9yZXN1bHRzO1xuICAgICAgZXZlbnQgPSBhcmd1bWVudHNbMF0sIGFyZ3MgPSAyIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBfX3NsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSA6IFtdO1xuICAgICAgaWYgKChfcmVmID0gdGhpcy5iaW5kaW5ncykgIT0gbnVsbCA/IF9yZWZbZXZlbnRdIDogdm9pZCAwKSB7XG4gICAgICAgIGkgPSAwO1xuICAgICAgICBfcmVzdWx0cyA9IFtdO1xuICAgICAgICB3aGlsZSAoaSA8IHRoaXMuYmluZGluZ3NbZXZlbnRdLmxlbmd0aCkge1xuICAgICAgICAgIF9yZWYxID0gdGhpcy5iaW5kaW5nc1tldmVudF1baV0sIGhhbmRsZXIgPSBfcmVmMS5oYW5kbGVyLCBjdHggPSBfcmVmMS5jdHgsIG9uY2UgPSBfcmVmMS5vbmNlO1xuICAgICAgICAgIGhhbmRsZXIuYXBwbHkoY3R4ICE9IG51bGwgPyBjdHggOiB0aGlzLCBhcmdzKTtcbiAgICAgICAgICBpZiAob25jZSkge1xuICAgICAgICAgICAgX3Jlc3VsdHMucHVzaCh0aGlzLmJpbmRpbmdzW2V2ZW50XS5zcGxpY2UoaSwgMSkpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBfcmVzdWx0cy5wdXNoKGkrKyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBfcmVzdWx0cztcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgcmV0dXJuIEV2ZW50ZWQ7XG5cbiAgfSkoKTtcblxuICBQYWNlID0gd2luZG93LlBhY2UgfHwge307XG5cbiAgd2luZG93LlBhY2UgPSBQYWNlO1xuXG4gIGV4dGVuZChQYWNlLCBFdmVudGVkLnByb3RvdHlwZSk7XG5cbiAgb3B0aW9ucyA9IFBhY2Uub3B0aW9ucyA9IGV4dGVuZCh7fSwgZGVmYXVsdE9wdGlvbnMsIHdpbmRvdy5wYWNlT3B0aW9ucywgZ2V0RnJvbURPTSgpKTtcblxuICBfcmVmID0gWydhamF4JywgJ2RvY3VtZW50JywgJ2V2ZW50TGFnJywgJ2VsZW1lbnRzJ107XG4gIGZvciAoX2kgPSAwLCBfbGVuID0gX3JlZi5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgIHNvdXJjZSA9IF9yZWZbX2ldO1xuICAgIGlmIChvcHRpb25zW3NvdXJjZV0gPT09IHRydWUpIHtcbiAgICAgIG9wdGlvbnNbc291cmNlXSA9IGRlZmF1bHRPcHRpb25zW3NvdXJjZV07XG4gICAgfVxuICB9XG5cbiAgTm9UYXJnZXRFcnJvciA9IChmdW5jdGlvbihfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoTm9UYXJnZXRFcnJvciwgX3N1cGVyKTtcblxuICAgIGZ1bmN0aW9uIE5vVGFyZ2V0RXJyb3IoKSB7XG4gICAgICBfcmVmMSA9IE5vVGFyZ2V0RXJyb3IuX19zdXBlcl9fLmNvbnN0cnVjdG9yLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICByZXR1cm4gX3JlZjE7XG4gICAgfVxuXG4gICAgcmV0dXJuIE5vVGFyZ2V0RXJyb3I7XG5cbiAgfSkoRXJyb3IpO1xuXG4gIEJhciA9IChmdW5jdGlvbigpIHtcbiAgICBmdW5jdGlvbiBCYXIoKSB7XG4gICAgICB0aGlzLnByb2dyZXNzID0gMDtcbiAgICB9XG5cbiAgICBCYXIucHJvdG90eXBlLmdldEVsZW1lbnQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciB0YXJnZXRFbGVtZW50O1xuICAgICAgaWYgKHRoaXMuZWwgPT0gbnVsbCkge1xuICAgICAgICB0YXJnZXRFbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihvcHRpb25zLnRhcmdldCk7XG4gICAgICAgIGlmICghdGFyZ2V0RWxlbWVudCkge1xuICAgICAgICAgIHRocm93IG5ldyBOb1RhcmdldEVycm9yO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgdGhpcy5lbC5jbGFzc05hbWUgPSBcInBhY2UgcGFjZS1hY3RpdmVcIjtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5jbGFzc05hbWUgPSBkb2N1bWVudC5ib2R5LmNsYXNzTmFtZS5yZXBsYWNlKC9wYWNlLWRvbmUvZywgJycpO1xuICAgICAgICBkb2N1bWVudC5ib2R5LmNsYXNzTmFtZSArPSAnIHBhY2UtcnVubmluZyc7XG4gICAgICAgIHRoaXMuZWwuaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9XCJwYWNlLXByb2dyZXNzXCI+XFxuICA8ZGl2IGNsYXNzPVwicGFjZS1wcm9ncmVzcy1pbm5lclwiPjwvZGl2PlxcbjwvZGl2PlxcbjxkaXYgY2xhc3M9XCJwYWNlLWFjdGl2aXR5XCI+PC9kaXY+JztcbiAgICAgICAgaWYgKHRhcmdldEVsZW1lbnQuZmlyc3RDaGlsZCAhPSBudWxsKSB7XG4gICAgICAgICAgdGFyZ2V0RWxlbWVudC5pbnNlcnRCZWZvcmUodGhpcy5lbCwgdGFyZ2V0RWxlbWVudC5maXJzdENoaWxkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0YXJnZXRFbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuZWwpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5lbDtcbiAgICB9O1xuXG4gICAgQmFyLnByb3RvdHlwZS5maW5pc2ggPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBlbDtcbiAgICAgIGVsID0gdGhpcy5nZXRFbGVtZW50KCk7XG4gICAgICBlbC5jbGFzc05hbWUgPSBlbC5jbGFzc05hbWUucmVwbGFjZSgncGFjZS1hY3RpdmUnLCAnJyk7XG4gICAgICBlbC5jbGFzc05hbWUgKz0gJyBwYWNlLWluYWN0aXZlJztcbiAgICAgIGRvY3VtZW50LmJvZHkuY2xhc3NOYW1lID0gZG9jdW1lbnQuYm9keS5jbGFzc05hbWUucmVwbGFjZSgncGFjZS1ydW5uaW5nJywgJycpO1xuICAgICAgcmV0dXJuIGRvY3VtZW50LmJvZHkuY2xhc3NOYW1lICs9ICcgcGFjZS1kb25lJztcbiAgICB9O1xuXG4gICAgQmFyLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbihwcm9nKSB7XG4gICAgICB0aGlzLnByb2dyZXNzID0gcHJvZztcbiAgICAgIHJldHVybiB0aGlzLnJlbmRlcigpO1xuICAgIH07XG5cbiAgICBCYXIucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbigpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHRoaXMuZ2V0RWxlbWVudCgpLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy5nZXRFbGVtZW50KCkpO1xuICAgICAgfSBjYXRjaCAoX2Vycm9yKSB7XG4gICAgICAgIE5vVGFyZ2V0RXJyb3IgPSBfZXJyb3I7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5lbCA9IHZvaWQgMDtcbiAgICB9O1xuXG4gICAgQmFyLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBlbCwga2V5LCBwcm9ncmVzc1N0ciwgdHJhbnNmb3JtLCBfaiwgX2xlbjEsIF9yZWYyO1xuICAgICAgaWYgKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Iob3B0aW9ucy50YXJnZXQpID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgZWwgPSB0aGlzLmdldEVsZW1lbnQoKTtcbiAgICAgIHRyYW5zZm9ybSA9IFwidHJhbnNsYXRlM2QoXCIgKyB0aGlzLnByb2dyZXNzICsgXCIlLCAwLCAwKVwiO1xuICAgICAgX3JlZjIgPSBbJ3dlYmtpdFRyYW5zZm9ybScsICdtc1RyYW5zZm9ybScsICd0cmFuc2Zvcm0nXTtcbiAgICAgIGZvciAoX2ogPSAwLCBfbGVuMSA9IF9yZWYyLmxlbmd0aDsgX2ogPCBfbGVuMTsgX2orKykge1xuICAgICAgICBrZXkgPSBfcmVmMltfal07XG4gICAgICAgIGVsLmNoaWxkcmVuWzBdLnN0eWxlW2tleV0gPSB0cmFuc2Zvcm07XG4gICAgICB9XG4gICAgICBpZiAoIXRoaXMubGFzdFJlbmRlcmVkUHJvZ3Jlc3MgfHwgdGhpcy5sYXN0UmVuZGVyZWRQcm9ncmVzcyB8IDAgIT09IHRoaXMucHJvZ3Jlc3MgfCAwKSB7XG4gICAgICAgIGVsLmNoaWxkcmVuWzBdLnNldEF0dHJpYnV0ZSgnZGF0YS1wcm9ncmVzcy10ZXh0JywgXCJcIiArICh0aGlzLnByb2dyZXNzIHwgMCkgKyBcIiVcIik7XG4gICAgICAgIGlmICh0aGlzLnByb2dyZXNzID49IDEwMCkge1xuICAgICAgICAgIHByb2dyZXNzU3RyID0gJzk5JztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwcm9ncmVzc1N0ciA9IHRoaXMucHJvZ3Jlc3MgPCAxMCA/IFwiMFwiIDogXCJcIjtcbiAgICAgICAgICBwcm9ncmVzc1N0ciArPSB0aGlzLnByb2dyZXNzIHwgMDtcbiAgICAgICAgfVxuICAgICAgICBlbC5jaGlsZHJlblswXS5zZXRBdHRyaWJ1dGUoJ2RhdGEtcHJvZ3Jlc3MnLCBcIlwiICsgcHJvZ3Jlc3NTdHIpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMubGFzdFJlbmRlcmVkUHJvZ3Jlc3MgPSB0aGlzLnByb2dyZXNzO1xuICAgIH07XG5cbiAgICBCYXIucHJvdG90eXBlLmRvbmUgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLnByb2dyZXNzID49IDEwMDtcbiAgICB9O1xuXG4gICAgcmV0dXJuIEJhcjtcblxuICB9KSgpO1xuXG4gIEV2ZW50cyA9IChmdW5jdGlvbigpIHtcbiAgICBmdW5jdGlvbiBFdmVudHMoKSB7XG4gICAgICB0aGlzLmJpbmRpbmdzID0ge307XG4gICAgfVxuXG4gICAgRXZlbnRzLnByb3RvdHlwZS50cmlnZ2VyID0gZnVuY3Rpb24obmFtZSwgdmFsKSB7XG4gICAgICB2YXIgYmluZGluZywgX2osIF9sZW4xLCBfcmVmMiwgX3Jlc3VsdHM7XG4gICAgICBpZiAodGhpcy5iaW5kaW5nc1tuYW1lXSAhPSBudWxsKSB7XG4gICAgICAgIF9yZWYyID0gdGhpcy5iaW5kaW5nc1tuYW1lXTtcbiAgICAgICAgX3Jlc3VsdHMgPSBbXTtcbiAgICAgICAgZm9yIChfaiA9IDAsIF9sZW4xID0gX3JlZjIubGVuZ3RoOyBfaiA8IF9sZW4xOyBfaisrKSB7XG4gICAgICAgICAgYmluZGluZyA9IF9yZWYyW19qXTtcbiAgICAgICAgICBfcmVzdWx0cy5wdXNoKGJpbmRpbmcuY2FsbCh0aGlzLCB2YWwpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gX3Jlc3VsdHM7XG4gICAgICB9XG4gICAgfTtcblxuICAgIEV2ZW50cy5wcm90b3R5cGUub24gPSBmdW5jdGlvbihuYW1lLCBmbikge1xuICAgICAgdmFyIF9iYXNlO1xuICAgICAgaWYgKChfYmFzZSA9IHRoaXMuYmluZGluZ3MpW25hbWVdID09IG51bGwpIHtcbiAgICAgICAgX2Jhc2VbbmFtZV0gPSBbXTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLmJpbmRpbmdzW25hbWVdLnB1c2goZm4pO1xuICAgIH07XG5cbiAgICByZXR1cm4gRXZlbnRzO1xuXG4gIH0pKCk7XG5cbiAgX1hNTEh0dHBSZXF1ZXN0ID0gd2luZG93LlhNTEh0dHBSZXF1ZXN0O1xuXG4gIF9YRG9tYWluUmVxdWVzdCA9IHdpbmRvdy5YRG9tYWluUmVxdWVzdDtcblxuICBfV2ViU29ja2V0ID0gd2luZG93LldlYlNvY2tldDtcblxuICBleHRlbmROYXRpdmUgPSBmdW5jdGlvbih0bywgZnJvbSkge1xuICAgIHZhciBlLCBrZXksIF9yZXN1bHRzO1xuICAgIF9yZXN1bHRzID0gW107XG4gICAgZm9yIChrZXkgaW4gZnJvbS5wcm90b3R5cGUpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmICgodG9ba2V5XSA9PSBudWxsKSAmJiB0eXBlb2YgZnJvbVtrZXldICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgaWYgKHR5cGVvZiBPYmplY3QuZGVmaW5lUHJvcGVydHkgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIF9yZXN1bHRzLnB1c2goT2JqZWN0LmRlZmluZVByb3BlcnR5KHRvLCBrZXksIHtcbiAgICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZnJvbS5wcm90b3R5cGVba2V5XTtcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlXG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIF9yZXN1bHRzLnB1c2godG9ba2V5XSA9IGZyb20ucHJvdG90eXBlW2tleV0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBfcmVzdWx0cy5wdXNoKHZvaWQgMCk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKF9lcnJvcikge1xuICAgICAgICBlID0gX2Vycm9yO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gX3Jlc3VsdHM7XG4gIH07XG5cbiAgaWdub3JlU3RhY2sgPSBbXTtcblxuICBQYWNlLmlnbm9yZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBhcmdzLCBmbiwgcmV0O1xuICAgIGZuID0gYXJndW1lbnRzWzBdLCBhcmdzID0gMiA8PSBhcmd1bWVudHMubGVuZ3RoID8gX19zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkgOiBbXTtcbiAgICBpZ25vcmVTdGFjay51bnNoaWZ0KCdpZ25vcmUnKTtcbiAgICByZXQgPSBmbi5hcHBseShudWxsLCBhcmdzKTtcbiAgICBpZ25vcmVTdGFjay5zaGlmdCgpO1xuICAgIHJldHVybiByZXQ7XG4gIH07XG5cbiAgUGFjZS50cmFjayA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBhcmdzLCBmbiwgcmV0O1xuICAgIGZuID0gYXJndW1lbnRzWzBdLCBhcmdzID0gMiA8PSBhcmd1bWVudHMubGVuZ3RoID8gX19zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkgOiBbXTtcbiAgICBpZ25vcmVTdGFjay51bnNoaWZ0KCd0cmFjaycpO1xuICAgIHJldCA9IGZuLmFwcGx5KG51bGwsIGFyZ3MpO1xuICAgIGlnbm9yZVN0YWNrLnNoaWZ0KCk7XG4gICAgcmV0dXJuIHJldDtcbiAgfTtcblxuICBzaG91bGRUcmFjayA9IGZ1bmN0aW9uKG1ldGhvZCkge1xuICAgIHZhciBfcmVmMjtcbiAgICBpZiAobWV0aG9kID09IG51bGwpIHtcbiAgICAgIG1ldGhvZCA9ICdHRVQnO1xuICAgIH1cbiAgICBpZiAoaWdub3JlU3RhY2tbMF0gPT09ICd0cmFjaycpIHtcbiAgICAgIHJldHVybiAnZm9yY2UnO1xuICAgIH1cbiAgICBpZiAoIWlnbm9yZVN0YWNrLmxlbmd0aCAmJiBvcHRpb25zLmFqYXgpIHtcbiAgICAgIGlmIChtZXRob2QgPT09ICdzb2NrZXQnICYmIG9wdGlvbnMuYWpheC50cmFja1dlYlNvY2tldHMpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9IGVsc2UgaWYgKF9yZWYyID0gbWV0aG9kLnRvVXBwZXJDYXNlKCksIF9faW5kZXhPZi5jYWxsKG9wdGlvbnMuYWpheC50cmFja01ldGhvZHMsIF9yZWYyKSA+PSAwKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH07XG5cbiAgUmVxdWVzdEludGVyY2VwdCA9IChmdW5jdGlvbihfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoUmVxdWVzdEludGVyY2VwdCwgX3N1cGVyKTtcblxuICAgIGZ1bmN0aW9uIFJlcXVlc3RJbnRlcmNlcHQoKSB7XG4gICAgICB2YXIgbW9uaXRvclhIUixcbiAgICAgICAgX3RoaXMgPSB0aGlzO1xuICAgICAgUmVxdWVzdEludGVyY2VwdC5fX3N1cGVyX18uY29uc3RydWN0b3IuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIG1vbml0b3JYSFIgPSBmdW5jdGlvbihyZXEpIHtcbiAgICAgICAgdmFyIF9vcGVuO1xuICAgICAgICBfb3BlbiA9IHJlcS5vcGVuO1xuICAgICAgICByZXR1cm4gcmVxLm9wZW4gPSBmdW5jdGlvbih0eXBlLCB1cmwsIGFzeW5jKSB7XG4gICAgICAgICAgaWYgKHNob3VsZFRyYWNrKHR5cGUpKSB7XG4gICAgICAgICAgICBfdGhpcy50cmlnZ2VyKCdyZXF1ZXN0Jywge1xuICAgICAgICAgICAgICB0eXBlOiB0eXBlLFxuICAgICAgICAgICAgICB1cmw6IHVybCxcbiAgICAgICAgICAgICAgcmVxdWVzdDogcmVxXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIF9vcGVuLmFwcGx5KHJlcSwgYXJndW1lbnRzKTtcbiAgICAgICAgfTtcbiAgICAgIH07XG4gICAgICB3aW5kb3cuWE1MSHR0cFJlcXVlc3QgPSBmdW5jdGlvbihmbGFncykge1xuICAgICAgICB2YXIgcmVxO1xuICAgICAgICByZXEgPSBuZXcgX1hNTEh0dHBSZXF1ZXN0KGZsYWdzKTtcbiAgICAgICAgbW9uaXRvclhIUihyZXEpO1xuICAgICAgICByZXR1cm4gcmVxO1xuICAgICAgfTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGV4dGVuZE5hdGl2ZSh3aW5kb3cuWE1MSHR0cFJlcXVlc3QsIF9YTUxIdHRwUmVxdWVzdCk7XG4gICAgICB9IGNhdGNoIChfZXJyb3IpIHt9XG4gICAgICBpZiAoX1hEb21haW5SZXF1ZXN0ICE9IG51bGwpIHtcbiAgICAgICAgd2luZG93LlhEb21haW5SZXF1ZXN0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIHJlcTtcbiAgICAgICAgICByZXEgPSBuZXcgX1hEb21haW5SZXF1ZXN0O1xuICAgICAgICAgIG1vbml0b3JYSFIocmVxKTtcbiAgICAgICAgICByZXR1cm4gcmVxO1xuICAgICAgICB9O1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGV4dGVuZE5hdGl2ZSh3aW5kb3cuWERvbWFpblJlcXVlc3QsIF9YRG9tYWluUmVxdWVzdCk7XG4gICAgICAgIH0gY2F0Y2ggKF9lcnJvcikge31cbiAgICAgIH1cbiAgICAgIGlmICgoX1dlYlNvY2tldCAhPSBudWxsKSAmJiBvcHRpb25zLmFqYXgudHJhY2tXZWJTb2NrZXRzKSB7XG4gICAgICAgIHdpbmRvdy5XZWJTb2NrZXQgPSBmdW5jdGlvbih1cmwsIHByb3RvY29scykge1xuICAgICAgICAgIHZhciByZXE7XG4gICAgICAgICAgaWYgKHByb3RvY29scyAhPSBudWxsKSB7XG4gICAgICAgICAgICByZXEgPSBuZXcgX1dlYlNvY2tldCh1cmwsIHByb3RvY29scyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlcSA9IG5ldyBfV2ViU29ja2V0KHVybCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChzaG91bGRUcmFjaygnc29ja2V0JykpIHtcbiAgICAgICAgICAgIF90aGlzLnRyaWdnZXIoJ3JlcXVlc3QnLCB7XG4gICAgICAgICAgICAgIHR5cGU6ICdzb2NrZXQnLFxuICAgICAgICAgICAgICB1cmw6IHVybCxcbiAgICAgICAgICAgICAgcHJvdG9jb2xzOiBwcm90b2NvbHMsXG4gICAgICAgICAgICAgIHJlcXVlc3Q6IHJlcVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiByZXE7XG4gICAgICAgIH07XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgZXh0ZW5kTmF0aXZlKHdpbmRvdy5XZWJTb2NrZXQsIF9XZWJTb2NrZXQpO1xuICAgICAgICB9IGNhdGNoIChfZXJyb3IpIHt9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIFJlcXVlc3RJbnRlcmNlcHQ7XG5cbiAgfSkoRXZlbnRzKTtcblxuICBfaW50ZXJjZXB0ID0gbnVsbDtcblxuICBnZXRJbnRlcmNlcHQgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoX2ludGVyY2VwdCA9PSBudWxsKSB7XG4gICAgICBfaW50ZXJjZXB0ID0gbmV3IFJlcXVlc3RJbnRlcmNlcHQ7XG4gICAgfVxuICAgIHJldHVybiBfaW50ZXJjZXB0O1xuICB9O1xuXG4gIHNob3VsZElnbm9yZVVSTCA9IGZ1bmN0aW9uKHVybCkge1xuICAgIHZhciBwYXR0ZXJuLCBfaiwgX2xlbjEsIF9yZWYyO1xuICAgIF9yZWYyID0gb3B0aW9ucy5hamF4Lmlnbm9yZVVSTHM7XG4gICAgZm9yIChfaiA9IDAsIF9sZW4xID0gX3JlZjIubGVuZ3RoOyBfaiA8IF9sZW4xOyBfaisrKSB7XG4gICAgICBwYXR0ZXJuID0gX3JlZjJbX2pdO1xuICAgICAgaWYgKHR5cGVvZiBwYXR0ZXJuID09PSAnc3RyaW5nJykge1xuICAgICAgICBpZiAodXJsLmluZGV4T2YocGF0dGVybikgIT09IC0xKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChwYXR0ZXJuLnRlc3QodXJsKSkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfTtcblxuICBnZXRJbnRlcmNlcHQoKS5vbigncmVxdWVzdCcsIGZ1bmN0aW9uKF9hcmcpIHtcbiAgICB2YXIgYWZ0ZXIsIGFyZ3MsIHJlcXVlc3QsIHR5cGUsIHVybDtcbiAgICB0eXBlID0gX2FyZy50eXBlLCByZXF1ZXN0ID0gX2FyZy5yZXF1ZXN0LCB1cmwgPSBfYXJnLnVybDtcbiAgICBpZiAoc2hvdWxkSWdub3JlVVJMKHVybCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKCFQYWNlLnJ1bm5pbmcgJiYgKG9wdGlvbnMucmVzdGFydE9uUmVxdWVzdEFmdGVyICE9PSBmYWxzZSB8fCBzaG91bGRUcmFjayh0eXBlKSA9PT0gJ2ZvcmNlJykpIHtcbiAgICAgIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICBhZnRlciA9IG9wdGlvbnMucmVzdGFydE9uUmVxdWVzdEFmdGVyIHx8IDA7XG4gICAgICBpZiAodHlwZW9mIGFmdGVyID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgYWZ0ZXIgPSAwO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzdGlsbEFjdGl2ZSwgX2osIF9sZW4xLCBfcmVmMiwgX3JlZjMsIF9yZXN1bHRzO1xuICAgICAgICBpZiAodHlwZSA9PT0gJ3NvY2tldCcpIHtcbiAgICAgICAgICBzdGlsbEFjdGl2ZSA9IHJlcXVlc3QucmVhZHlTdGF0ZSA8IDI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RpbGxBY3RpdmUgPSAoMCA8IChfcmVmMiA9IHJlcXVlc3QucmVhZHlTdGF0ZSkgJiYgX3JlZjIgPCA0KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc3RpbGxBY3RpdmUpIHtcbiAgICAgICAgICBQYWNlLnJlc3RhcnQoKTtcbiAgICAgICAgICBfcmVmMyA9IFBhY2Uuc291cmNlcztcbiAgICAgICAgICBfcmVzdWx0cyA9IFtdO1xuICAgICAgICAgIGZvciAoX2ogPSAwLCBfbGVuMSA9IF9yZWYzLmxlbmd0aDsgX2ogPCBfbGVuMTsgX2orKykge1xuICAgICAgICAgICAgc291cmNlID0gX3JlZjNbX2pdO1xuICAgICAgICAgICAgaWYgKHNvdXJjZSBpbnN0YW5jZW9mIEFqYXhNb25pdG9yKSB7XG4gICAgICAgICAgICAgIHNvdXJjZS53YXRjaC5hcHBseShzb3VyY2UsIGFyZ3MpO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIF9yZXN1bHRzLnB1c2godm9pZCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIF9yZXN1bHRzO1xuICAgICAgICB9XG4gICAgICB9LCBhZnRlcik7XG4gICAgfVxuICB9KTtcblxuICBBamF4TW9uaXRvciA9IChmdW5jdGlvbigpIHtcbiAgICBmdW5jdGlvbiBBamF4TW9uaXRvcigpIHtcbiAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICB0aGlzLmVsZW1lbnRzID0gW107XG4gICAgICBnZXRJbnRlcmNlcHQoKS5vbigncmVxdWVzdCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gX3RoaXMud2F0Y2guYXBwbHkoX3RoaXMsIGFyZ3VtZW50cyk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBBamF4TW9uaXRvci5wcm90b3R5cGUud2F0Y2ggPSBmdW5jdGlvbihfYXJnKSB7XG4gICAgICB2YXIgcmVxdWVzdCwgdHJhY2tlciwgdHlwZSwgdXJsO1xuICAgICAgdHlwZSA9IF9hcmcudHlwZSwgcmVxdWVzdCA9IF9hcmcucmVxdWVzdCwgdXJsID0gX2FyZy51cmw7XG4gICAgICBpZiAoc2hvdWxkSWdub3JlVVJMKHVybCkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKHR5cGUgPT09ICdzb2NrZXQnKSB7XG4gICAgICAgIHRyYWNrZXIgPSBuZXcgU29ja2V0UmVxdWVzdFRyYWNrZXIocmVxdWVzdCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0cmFja2VyID0gbmV3IFhIUlJlcXVlc3RUcmFja2VyKHJlcXVlc3QpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudHMucHVzaCh0cmFja2VyKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIEFqYXhNb25pdG9yO1xuXG4gIH0pKCk7XG5cbiAgWEhSUmVxdWVzdFRyYWNrZXIgPSAoZnVuY3Rpb24oKSB7XG4gICAgZnVuY3Rpb24gWEhSUmVxdWVzdFRyYWNrZXIocmVxdWVzdCkge1xuICAgICAgdmFyIGV2ZW50LCBzaXplLCBfaiwgX2xlbjEsIF9vbnJlYWR5c3RhdGVjaGFuZ2UsIF9yZWYyLFxuICAgICAgICBfdGhpcyA9IHRoaXM7XG4gICAgICB0aGlzLnByb2dyZXNzID0gMDtcbiAgICAgIGlmICh3aW5kb3cuUHJvZ3Jlc3NFdmVudCAhPSBudWxsKSB7XG4gICAgICAgIHNpemUgPSBudWxsO1xuICAgICAgICByZXF1ZXN0LmFkZEV2ZW50TGlzdGVuZXIoJ3Byb2dyZXNzJywgZnVuY3Rpb24oZXZ0KSB7XG4gICAgICAgICAgaWYgKGV2dC5sZW5ndGhDb21wdXRhYmxlKSB7XG4gICAgICAgICAgICByZXR1cm4gX3RoaXMucHJvZ3Jlc3MgPSAxMDAgKiBldnQubG9hZGVkIC8gZXZ0LnRvdGFsO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gX3RoaXMucHJvZ3Jlc3MgPSBfdGhpcy5wcm9ncmVzcyArICgxMDAgLSBfdGhpcy5wcm9ncmVzcykgLyAyO1xuICAgICAgICAgIH1cbiAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICBfcmVmMiA9IFsnbG9hZCcsICdhYm9ydCcsICd0aW1lb3V0JywgJ2Vycm9yJ107XG4gICAgICAgIGZvciAoX2ogPSAwLCBfbGVuMSA9IF9yZWYyLmxlbmd0aDsgX2ogPCBfbGVuMTsgX2orKykge1xuICAgICAgICAgIGV2ZW50ID0gX3JlZjJbX2pdO1xuICAgICAgICAgIHJlcXVlc3QuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gX3RoaXMucHJvZ3Jlc3MgPSAxMDA7XG4gICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBfb25yZWFkeXN0YXRlY2hhbmdlID0gcmVxdWVzdC5vbnJlYWR5c3RhdGVjaGFuZ2U7XG4gICAgICAgIHJlcXVlc3Qub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIF9yZWYzO1xuICAgICAgICAgIGlmICgoX3JlZjMgPSByZXF1ZXN0LnJlYWR5U3RhdGUpID09PSAwIHx8IF9yZWYzID09PSA0KSB7XG4gICAgICAgICAgICBfdGhpcy5wcm9ncmVzcyA9IDEwMDtcbiAgICAgICAgICB9IGVsc2UgaWYgKHJlcXVlc3QucmVhZHlTdGF0ZSA9PT0gMykge1xuICAgICAgICAgICAgX3RoaXMucHJvZ3Jlc3MgPSA1MDtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHR5cGVvZiBfb25yZWFkeXN0YXRlY2hhbmdlID09PSBcImZ1bmN0aW9uXCIgPyBfb25yZWFkeXN0YXRlY2hhbmdlLmFwcGx5KG51bGwsIGFyZ3VtZW50cykgOiB2b2lkIDA7XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIFhIUlJlcXVlc3RUcmFja2VyO1xuXG4gIH0pKCk7XG5cbiAgU29ja2V0UmVxdWVzdFRyYWNrZXIgPSAoZnVuY3Rpb24oKSB7XG4gICAgZnVuY3Rpb24gU29ja2V0UmVxdWVzdFRyYWNrZXIocmVxdWVzdCkge1xuICAgICAgdmFyIGV2ZW50LCBfaiwgX2xlbjEsIF9yZWYyLFxuICAgICAgICBfdGhpcyA9IHRoaXM7XG4gICAgICB0aGlzLnByb2dyZXNzID0gMDtcbiAgICAgIF9yZWYyID0gWydlcnJvcicsICdvcGVuJ107XG4gICAgICBmb3IgKF9qID0gMCwgX2xlbjEgPSBfcmVmMi5sZW5ndGg7IF9qIDwgX2xlbjE7IF9qKyspIHtcbiAgICAgICAgZXZlbnQgPSBfcmVmMltfal07XG4gICAgICAgIHJlcXVlc3QuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIF90aGlzLnByb2dyZXNzID0gMTAwO1xuICAgICAgICB9LCBmYWxzZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIFNvY2tldFJlcXVlc3RUcmFja2VyO1xuXG4gIH0pKCk7XG5cbiAgRWxlbWVudE1vbml0b3IgPSAoZnVuY3Rpb24oKSB7XG4gICAgZnVuY3Rpb24gRWxlbWVudE1vbml0b3Iob3B0aW9ucykge1xuICAgICAgdmFyIHNlbGVjdG9yLCBfaiwgX2xlbjEsIF9yZWYyO1xuICAgICAgaWYgKG9wdGlvbnMgPT0gbnVsbCkge1xuICAgICAgICBvcHRpb25zID0ge307XG4gICAgICB9XG4gICAgICB0aGlzLmVsZW1lbnRzID0gW107XG4gICAgICBpZiAob3B0aW9ucy5zZWxlY3RvcnMgPT0gbnVsbCkge1xuICAgICAgICBvcHRpb25zLnNlbGVjdG9ycyA9IFtdO1xuICAgICAgfVxuICAgICAgX3JlZjIgPSBvcHRpb25zLnNlbGVjdG9ycztcbiAgICAgIGZvciAoX2ogPSAwLCBfbGVuMSA9IF9yZWYyLmxlbmd0aDsgX2ogPCBfbGVuMTsgX2orKykge1xuICAgICAgICBzZWxlY3RvciA9IF9yZWYyW19qXTtcbiAgICAgICAgdGhpcy5lbGVtZW50cy5wdXNoKG5ldyBFbGVtZW50VHJhY2tlcihzZWxlY3RvcikpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBFbGVtZW50TW9uaXRvcjtcblxuICB9KSgpO1xuXG4gIEVsZW1lbnRUcmFja2VyID0gKGZ1bmN0aW9uKCkge1xuICAgIGZ1bmN0aW9uIEVsZW1lbnRUcmFja2VyKHNlbGVjdG9yKSB7XG4gICAgICB0aGlzLnNlbGVjdG9yID0gc2VsZWN0b3I7XG4gICAgICB0aGlzLnByb2dyZXNzID0gMDtcbiAgICAgIHRoaXMuY2hlY2soKTtcbiAgICB9XG5cbiAgICBFbGVtZW50VHJhY2tlci5wcm90b3R5cGUuY2hlY2sgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICBpZiAoZG9jdW1lbnQucXVlcnlTZWxlY3Rvcih0aGlzLnNlbGVjdG9yKSkge1xuICAgICAgICByZXR1cm4gdGhpcy5kb25lKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dCgoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIF90aGlzLmNoZWNrKCk7XG4gICAgICAgIH0pLCBvcHRpb25zLmVsZW1lbnRzLmNoZWNrSW50ZXJ2YWwpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBFbGVtZW50VHJhY2tlci5wcm90b3R5cGUuZG9uZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMucHJvZ3Jlc3MgPSAxMDA7XG4gICAgfTtcblxuICAgIHJldHVybiBFbGVtZW50VHJhY2tlcjtcblxuICB9KSgpO1xuXG4gIERvY3VtZW50TW9uaXRvciA9IChmdW5jdGlvbigpIHtcbiAgICBEb2N1bWVudE1vbml0b3IucHJvdG90eXBlLnN0YXRlcyA9IHtcbiAgICAgIGxvYWRpbmc6IDAsXG4gICAgICBpbnRlcmFjdGl2ZTogNTAsXG4gICAgICBjb21wbGV0ZTogMTAwXG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIERvY3VtZW50TW9uaXRvcigpIHtcbiAgICAgIHZhciBfb25yZWFkeXN0YXRlY2hhbmdlLCBfcmVmMixcbiAgICAgICAgX3RoaXMgPSB0aGlzO1xuICAgICAgdGhpcy5wcm9ncmVzcyA9IChfcmVmMiA9IHRoaXMuc3RhdGVzW2RvY3VtZW50LnJlYWR5U3RhdGVdKSAhPSBudWxsID8gX3JlZjIgOiAxMDA7XG4gICAgICBfb25yZWFkeXN0YXRlY2hhbmdlID0gZG9jdW1lbnQub25yZWFkeXN0YXRlY2hhbmdlO1xuICAgICAgZG9jdW1lbnQub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChfdGhpcy5zdGF0ZXNbZG9jdW1lbnQucmVhZHlTdGF0ZV0gIT0gbnVsbCkge1xuICAgICAgICAgIF90aGlzLnByb2dyZXNzID0gX3RoaXMuc3RhdGVzW2RvY3VtZW50LnJlYWR5U3RhdGVdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0eXBlb2YgX29ucmVhZHlzdGF0ZWNoYW5nZSA9PT0gXCJmdW5jdGlvblwiID8gX29ucmVhZHlzdGF0ZWNoYW5nZS5hcHBseShudWxsLCBhcmd1bWVudHMpIDogdm9pZCAwO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gRG9jdW1lbnRNb25pdG9yO1xuXG4gIH0pKCk7XG5cbiAgRXZlbnRMYWdNb25pdG9yID0gKGZ1bmN0aW9uKCkge1xuICAgIGZ1bmN0aW9uIEV2ZW50TGFnTW9uaXRvcigpIHtcbiAgICAgIHZhciBhdmcsIGludGVydmFsLCBsYXN0LCBwb2ludHMsIHNhbXBsZXMsXG4gICAgICAgIF90aGlzID0gdGhpcztcbiAgICAgIHRoaXMucHJvZ3Jlc3MgPSAwO1xuICAgICAgYXZnID0gMDtcbiAgICAgIHNhbXBsZXMgPSBbXTtcbiAgICAgIHBvaW50cyA9IDA7XG4gICAgICBsYXN0ID0gbm93KCk7XG4gICAgICBpbnRlcnZhbCA9IHNldEludGVydmFsKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZGlmZjtcbiAgICAgICAgZGlmZiA9IG5vdygpIC0gbGFzdCAtIDUwO1xuICAgICAgICBsYXN0ID0gbm93KCk7XG4gICAgICAgIHNhbXBsZXMucHVzaChkaWZmKTtcbiAgICAgICAgaWYgKHNhbXBsZXMubGVuZ3RoID4gb3B0aW9ucy5ldmVudExhZy5zYW1wbGVDb3VudCkge1xuICAgICAgICAgIHNhbXBsZXMuc2hpZnQoKTtcbiAgICAgICAgfVxuICAgICAgICBhdmcgPSBhdmdBbXBsaXR1ZGUoc2FtcGxlcyk7XG4gICAgICAgIGlmICgrK3BvaW50cyA+PSBvcHRpb25zLmV2ZW50TGFnLm1pblNhbXBsZXMgJiYgYXZnIDwgb3B0aW9ucy5ldmVudExhZy5sYWdUaHJlc2hvbGQpIHtcbiAgICAgICAgICBfdGhpcy5wcm9ncmVzcyA9IDEwMDtcbiAgICAgICAgICByZXR1cm4gY2xlYXJJbnRlcnZhbChpbnRlcnZhbCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIF90aGlzLnByb2dyZXNzID0gMTAwICogKDMgLyAoYXZnICsgMykpO1xuICAgICAgICB9XG4gICAgICB9LCA1MCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIEV2ZW50TGFnTW9uaXRvcjtcblxuICB9KSgpO1xuXG4gIFNjYWxlciA9IChmdW5jdGlvbigpIHtcbiAgICBmdW5jdGlvbiBTY2FsZXIoc291cmNlKSB7XG4gICAgICB0aGlzLnNvdXJjZSA9IHNvdXJjZTtcbiAgICAgIHRoaXMubGFzdCA9IHRoaXMuc2luY2VMYXN0VXBkYXRlID0gMDtcbiAgICAgIHRoaXMucmF0ZSA9IG9wdGlvbnMuaW5pdGlhbFJhdGU7XG4gICAgICB0aGlzLmNhdGNodXAgPSAwO1xuICAgICAgdGhpcy5wcm9ncmVzcyA9IHRoaXMubGFzdFByb2dyZXNzID0gMDtcbiAgICAgIGlmICh0aGlzLnNvdXJjZSAhPSBudWxsKSB7XG4gICAgICAgIHRoaXMucHJvZ3Jlc3MgPSByZXN1bHQodGhpcy5zb3VyY2UsICdwcm9ncmVzcycpO1xuICAgICAgfVxuICAgIH1cblxuICAgIFNjYWxlci5wcm90b3R5cGUudGljayA9IGZ1bmN0aW9uKGZyYW1lVGltZSwgdmFsKSB7XG4gICAgICB2YXIgc2NhbGluZztcbiAgICAgIGlmICh2YWwgPT0gbnVsbCkge1xuICAgICAgICB2YWwgPSByZXN1bHQodGhpcy5zb3VyY2UsICdwcm9ncmVzcycpO1xuICAgICAgfVxuICAgICAgaWYgKHZhbCA+PSAxMDApIHtcbiAgICAgICAgdGhpcy5kb25lID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGlmICh2YWwgPT09IHRoaXMubGFzdCkge1xuICAgICAgICB0aGlzLnNpbmNlTGFzdFVwZGF0ZSArPSBmcmFtZVRpbWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAodGhpcy5zaW5jZUxhc3RVcGRhdGUpIHtcbiAgICAgICAgICB0aGlzLnJhdGUgPSAodmFsIC0gdGhpcy5sYXN0KSAvIHRoaXMuc2luY2VMYXN0VXBkYXRlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY2F0Y2h1cCA9ICh2YWwgLSB0aGlzLnByb2dyZXNzKSAvIG9wdGlvbnMuY2F0Y2h1cFRpbWU7XG4gICAgICAgIHRoaXMuc2luY2VMYXN0VXBkYXRlID0gMDtcbiAgICAgICAgdGhpcy5sYXN0ID0gdmFsO1xuICAgICAgfVxuICAgICAgaWYgKHZhbCA+IHRoaXMucHJvZ3Jlc3MpIHtcbiAgICAgICAgdGhpcy5wcm9ncmVzcyArPSB0aGlzLmNhdGNodXAgKiBmcmFtZVRpbWU7XG4gICAgICB9XG4gICAgICBzY2FsaW5nID0gMSAtIE1hdGgucG93KHRoaXMucHJvZ3Jlc3MgLyAxMDAsIG9wdGlvbnMuZWFzZUZhY3Rvcik7XG4gICAgICB0aGlzLnByb2dyZXNzICs9IHNjYWxpbmcgKiB0aGlzLnJhdGUgKiBmcmFtZVRpbWU7XG4gICAgICB0aGlzLnByb2dyZXNzID0gTWF0aC5taW4odGhpcy5sYXN0UHJvZ3Jlc3MgKyBvcHRpb25zLm1heFByb2dyZXNzUGVyRnJhbWUsIHRoaXMucHJvZ3Jlc3MpO1xuICAgICAgdGhpcy5wcm9ncmVzcyA9IE1hdGgubWF4KDAsIHRoaXMucHJvZ3Jlc3MpO1xuICAgICAgdGhpcy5wcm9ncmVzcyA9IE1hdGgubWluKDEwMCwgdGhpcy5wcm9ncmVzcyk7XG4gICAgICB0aGlzLmxhc3RQcm9ncmVzcyA9IHRoaXMucHJvZ3Jlc3M7XG4gICAgICByZXR1cm4gdGhpcy5wcm9ncmVzcztcbiAgICB9O1xuXG4gICAgcmV0dXJuIFNjYWxlcjtcblxuICB9KSgpO1xuXG4gIHNvdXJjZXMgPSBudWxsO1xuXG4gIHNjYWxlcnMgPSBudWxsO1xuXG4gIGJhciA9IG51bGw7XG5cbiAgdW5pU2NhbGVyID0gbnVsbDtcblxuICBhbmltYXRpb24gPSBudWxsO1xuXG4gIGNhbmNlbEFuaW1hdGlvbiA9IG51bGw7XG5cbiAgUGFjZS5ydW5uaW5nID0gZmFsc2U7XG5cbiAgaGFuZGxlUHVzaFN0YXRlID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKG9wdGlvbnMucmVzdGFydE9uUHVzaFN0YXRlKSB7XG4gICAgICByZXR1cm4gUGFjZS5yZXN0YXJ0KCk7XG4gICAgfVxuICB9O1xuXG4gIGlmICh3aW5kb3cuaGlzdG9yeS5wdXNoU3RhdGUgIT0gbnVsbCkge1xuICAgIF9wdXNoU3RhdGUgPSB3aW5kb3cuaGlzdG9yeS5wdXNoU3RhdGU7XG4gICAgd2luZG93Lmhpc3RvcnkucHVzaFN0YXRlID0gZnVuY3Rpb24oKSB7XG4gICAgICBoYW5kbGVQdXNoU3RhdGUoKTtcbiAgICAgIHJldHVybiBfcHVzaFN0YXRlLmFwcGx5KHdpbmRvdy5oaXN0b3J5LCBhcmd1bWVudHMpO1xuICAgIH07XG4gIH1cblxuICBpZiAod2luZG93Lmhpc3RvcnkucmVwbGFjZVN0YXRlICE9IG51bGwpIHtcbiAgICBfcmVwbGFjZVN0YXRlID0gd2luZG93Lmhpc3RvcnkucmVwbGFjZVN0YXRlO1xuICAgIHdpbmRvdy5oaXN0b3J5LnJlcGxhY2VTdGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgaGFuZGxlUHVzaFN0YXRlKCk7XG4gICAgICByZXR1cm4gX3JlcGxhY2VTdGF0ZS5hcHBseSh3aW5kb3cuaGlzdG9yeSwgYXJndW1lbnRzKTtcbiAgICB9O1xuICB9XG5cbiAgU09VUkNFX0tFWVMgPSB7XG4gICAgYWpheDogQWpheE1vbml0b3IsXG4gICAgZWxlbWVudHM6IEVsZW1lbnRNb25pdG9yLFxuICAgIGRvY3VtZW50OiBEb2N1bWVudE1vbml0b3IsXG4gICAgZXZlbnRMYWc6IEV2ZW50TGFnTW9uaXRvclxuICB9O1xuXG4gIChpbml0ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHR5cGUsIF9qLCBfaywgX2xlbjEsIF9sZW4yLCBfcmVmMiwgX3JlZjMsIF9yZWY0O1xuICAgIFBhY2Uuc291cmNlcyA9IHNvdXJjZXMgPSBbXTtcbiAgICBfcmVmMiA9IFsnYWpheCcsICdlbGVtZW50cycsICdkb2N1bWVudCcsICdldmVudExhZyddO1xuICAgIGZvciAoX2ogPSAwLCBfbGVuMSA9IF9yZWYyLmxlbmd0aDsgX2ogPCBfbGVuMTsgX2orKykge1xuICAgICAgdHlwZSA9IF9yZWYyW19qXTtcbiAgICAgIGlmIChvcHRpb25zW3R5cGVdICE9PSBmYWxzZSkge1xuICAgICAgICBzb3VyY2VzLnB1c2gobmV3IFNPVVJDRV9LRVlTW3R5cGVdKG9wdGlvbnNbdHlwZV0pKTtcbiAgICAgIH1cbiAgICB9XG4gICAgX3JlZjQgPSAoX3JlZjMgPSBvcHRpb25zLmV4dHJhU291cmNlcykgIT0gbnVsbCA/IF9yZWYzIDogW107XG4gICAgZm9yIChfayA9IDAsIF9sZW4yID0gX3JlZjQubGVuZ3RoOyBfayA8IF9sZW4yOyBfaysrKSB7XG4gICAgICBzb3VyY2UgPSBfcmVmNFtfa107XG4gICAgICBzb3VyY2VzLnB1c2gobmV3IHNvdXJjZShvcHRpb25zKSk7XG4gICAgfVxuICAgIFBhY2UuYmFyID0gYmFyID0gbmV3IEJhcjtcbiAgICBzY2FsZXJzID0gW107XG4gICAgcmV0dXJuIHVuaVNjYWxlciA9IG5ldyBTY2FsZXI7XG4gIH0pKCk7XG5cbiAgUGFjZS5zdG9wID0gZnVuY3Rpb24oKSB7XG4gICAgUGFjZS50cmlnZ2VyKCdzdG9wJyk7XG4gICAgUGFjZS5ydW5uaW5nID0gZmFsc2U7XG4gICAgYmFyLmRlc3Ryb3koKTtcbiAgICBjYW5jZWxBbmltYXRpb24gPSB0cnVlO1xuICAgIGlmIChhbmltYXRpb24gIT0gbnVsbCkge1xuICAgICAgaWYgKHR5cGVvZiBjYW5jZWxBbmltYXRpb25GcmFtZSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIGNhbmNlbEFuaW1hdGlvbkZyYW1lKGFuaW1hdGlvbik7XG4gICAgICB9XG4gICAgICBhbmltYXRpb24gPSBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gaW5pdCgpO1xuICB9O1xuXG4gIFBhY2UucmVzdGFydCA9IGZ1bmN0aW9uKCkge1xuICAgIFBhY2UudHJpZ2dlcigncmVzdGFydCcpO1xuICAgIFBhY2Uuc3RvcCgpO1xuICAgIHJldHVybiBQYWNlLnN0YXJ0KCk7XG4gIH07XG5cbiAgUGFjZS5nbyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzdGFydDtcbiAgICBQYWNlLnJ1bm5pbmcgPSB0cnVlO1xuICAgIGJhci5yZW5kZXIoKTtcbiAgICBzdGFydCA9IG5vdygpO1xuICAgIGNhbmNlbEFuaW1hdGlvbiA9IGZhbHNlO1xuICAgIHJldHVybiBhbmltYXRpb24gPSBydW5BbmltYXRpb24oZnVuY3Rpb24oZnJhbWVUaW1lLCBlbnF1ZXVlTmV4dEZyYW1lKSB7XG4gICAgICB2YXIgYXZnLCBjb3VudCwgZG9uZSwgZWxlbWVudCwgZWxlbWVudHMsIGksIGosIHJlbWFpbmluZywgc2NhbGVyLCBzY2FsZXJMaXN0LCBzdW0sIF9qLCBfaywgX2xlbjEsIF9sZW4yLCBfcmVmMjtcbiAgICAgIHJlbWFpbmluZyA9IDEwMCAtIGJhci5wcm9ncmVzcztcbiAgICAgIGNvdW50ID0gc3VtID0gMDtcbiAgICAgIGRvbmUgPSB0cnVlO1xuICAgICAgZm9yIChpID0gX2ogPSAwLCBfbGVuMSA9IHNvdXJjZXMubGVuZ3RoOyBfaiA8IF9sZW4xOyBpID0gKytfaikge1xuICAgICAgICBzb3VyY2UgPSBzb3VyY2VzW2ldO1xuICAgICAgICBzY2FsZXJMaXN0ID0gc2NhbGVyc1tpXSAhPSBudWxsID8gc2NhbGVyc1tpXSA6IHNjYWxlcnNbaV0gPSBbXTtcbiAgICAgICAgZWxlbWVudHMgPSAoX3JlZjIgPSBzb3VyY2UuZWxlbWVudHMpICE9IG51bGwgPyBfcmVmMiA6IFtzb3VyY2VdO1xuICAgICAgICBmb3IgKGogPSBfayA9IDAsIF9sZW4yID0gZWxlbWVudHMubGVuZ3RoOyBfayA8IF9sZW4yOyBqID0gKytfaykge1xuICAgICAgICAgIGVsZW1lbnQgPSBlbGVtZW50c1tqXTtcbiAgICAgICAgICBzY2FsZXIgPSBzY2FsZXJMaXN0W2pdICE9IG51bGwgPyBzY2FsZXJMaXN0W2pdIDogc2NhbGVyTGlzdFtqXSA9IG5ldyBTY2FsZXIoZWxlbWVudCk7XG4gICAgICAgICAgZG9uZSAmPSBzY2FsZXIuZG9uZTtcbiAgICAgICAgICBpZiAoc2NhbGVyLmRvbmUpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb3VudCsrO1xuICAgICAgICAgIHN1bSArPSBzY2FsZXIudGljayhmcmFtZVRpbWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBhdmcgPSBzdW0gLyBjb3VudDtcbiAgICAgIGJhci51cGRhdGUodW5pU2NhbGVyLnRpY2soZnJhbWVUaW1lLCBhdmcpKTtcbiAgICAgIGlmIChiYXIuZG9uZSgpIHx8IGRvbmUgfHwgY2FuY2VsQW5pbWF0aW9uKSB7XG4gICAgICAgIGJhci51cGRhdGUoMTAwKTtcbiAgICAgICAgUGFjZS50cmlnZ2VyKCdkb25lJyk7XG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGJhci5maW5pc2goKTtcbiAgICAgICAgICBQYWNlLnJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICByZXR1cm4gUGFjZS50cmlnZ2VyKCdoaWRlJyk7XG4gICAgICAgIH0sIE1hdGgubWF4KG9wdGlvbnMuZ2hvc3RUaW1lLCBNYXRoLm1heChvcHRpb25zLm1pblRpbWUgLSAobm93KCkgLSBzdGFydCksIDApKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZW5xdWV1ZU5leHRGcmFtZSgpO1xuICAgICAgfVxuICAgIH0pO1xuICB9O1xuXG4gIFBhY2Uuc3RhcnQgPSBmdW5jdGlvbihfb3B0aW9ucykge1xuICAgIGV4dGVuZChvcHRpb25zLCBfb3B0aW9ucyk7XG4gICAgUGFjZS5ydW5uaW5nID0gdHJ1ZTtcbiAgICB0cnkge1xuICAgICAgYmFyLnJlbmRlcigpO1xuICAgIH0gY2F0Y2ggKF9lcnJvcikge1xuICAgICAgTm9UYXJnZXRFcnJvciA9IF9lcnJvcjtcbiAgICB9XG4gICAgaWYgKCFkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcucGFjZScpKSB7XG4gICAgICByZXR1cm4gc2V0VGltZW91dChQYWNlLnN0YXJ0LCA1MCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIFBhY2UudHJpZ2dlcignc3RhcnQnKTtcbiAgICAgIHJldHVybiBQYWNlLmdvKCk7XG4gICAgfVxuICB9O1xuXG4gIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICBkZWZpbmUoWydwYWNlJ10sIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIFBhY2U7XG4gICAgfSk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBQYWNlO1xuICB9IGVsc2Uge1xuICAgIGlmIChvcHRpb25zLnN0YXJ0T25QYWdlTG9hZCkge1xuICAgICAgUGFjZS5zdGFydCgpO1xuICAgIH1cbiAgfVxuXG59KS5jYWxsKHRoaXMpO1xuIiwiLyohXG4gKiBCb290c3RyYXAgdjMuNC4xIChodHRwczovL2dldGJvb3RzdHJhcC5jb20vKVxuICogQ29weXJpZ2h0IDIwMTEtMjAxOSBUd2l0dGVyLCBJbmMuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2VcbiAqL1xuXG5pZiAodHlwZW9mIGpRdWVyeSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgdGhyb3cgbmV3IEVycm9yKCdCb290c3RyYXBcXCdzIEphdmFTY3JpcHQgcmVxdWlyZXMgalF1ZXJ5Jylcbn1cblxuK2Z1bmN0aW9uICgkKSB7XG4gICd1c2Ugc3RyaWN0JztcbiAgdmFyIHZlcnNpb24gPSAkLmZuLmpxdWVyeS5zcGxpdCgnICcpWzBdLnNwbGl0KCcuJylcbiAgaWYgKCh2ZXJzaW9uWzBdIDwgMiAmJiB2ZXJzaW9uWzFdIDwgOSkgfHwgKHZlcnNpb25bMF0gPT0gMSAmJiB2ZXJzaW9uWzFdID09IDkgJiYgdmVyc2lvblsyXSA8IDEpIHx8ICh2ZXJzaW9uWzBdID4gMykpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0Jvb3RzdHJhcFxcJ3MgSmF2YVNjcmlwdCByZXF1aXJlcyBqUXVlcnkgdmVyc2lvbiAxLjkuMSBvciBoaWdoZXIsIGJ1dCBsb3dlciB0aGFuIHZlcnNpb24gNCcpXG4gIH1cbn0oalF1ZXJ5KTtcblxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBCb290c3RyYXA6IHRyYW5zaXRpb24uanMgdjMuNC4xXG4gKiBodHRwczovL2dldGJvb3RzdHJhcC5jb20vZG9jcy8zLjQvamF2YXNjcmlwdC8jdHJhbnNpdGlvbnNcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogQ29weXJpZ2h0IDIwMTEtMjAxOSBUd2l0dGVyLCBJbmMuXG4gKiBMaWNlbnNlZCB1bmRlciBNSVQgKGh0dHBzOi8vZ2l0aHViLmNvbS90d2JzL2Jvb3RzdHJhcC9ibG9iL21hc3Rlci9MSUNFTlNFKVxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovXG5cblxuK2Z1bmN0aW9uICgkKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICAvLyBDU1MgVFJBTlNJVElPTiBTVVBQT1JUIChTaG91dG91dDogaHR0cHM6Ly9tb2Rlcm5penIuY29tLylcbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgZnVuY3Rpb24gdHJhbnNpdGlvbkVuZCgpIHtcbiAgICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdib290c3RyYXAnKVxuXG4gICAgdmFyIHRyYW5zRW5kRXZlbnROYW1lcyA9IHtcbiAgICAgIFdlYmtpdFRyYW5zaXRpb24gOiAnd2Via2l0VHJhbnNpdGlvbkVuZCcsXG4gICAgICBNb3pUcmFuc2l0aW9uICAgIDogJ3RyYW5zaXRpb25lbmQnLFxuICAgICAgT1RyYW5zaXRpb24gICAgICA6ICdvVHJhbnNpdGlvbkVuZCBvdHJhbnNpdGlvbmVuZCcsXG4gICAgICB0cmFuc2l0aW9uICAgICAgIDogJ3RyYW5zaXRpb25lbmQnXG4gICAgfVxuXG4gICAgZm9yICh2YXIgbmFtZSBpbiB0cmFuc0VuZEV2ZW50TmFtZXMpIHtcbiAgICAgIGlmIChlbC5zdHlsZVtuYW1lXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiB7IGVuZDogdHJhbnNFbmRFdmVudE5hbWVzW25hbWVdIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2UgLy8gZXhwbGljaXQgZm9yIGllOCAoICAuXy4pXG4gIH1cblxuICAvLyBodHRwczovL2Jsb2cuYWxleG1hY2Nhdy5jb20vY3NzLXRyYW5zaXRpb25zXG4gICQuZm4uZW11bGF0ZVRyYW5zaXRpb25FbmQgPSBmdW5jdGlvbiAoZHVyYXRpb24pIHtcbiAgICB2YXIgY2FsbGVkID0gZmFsc2VcbiAgICB2YXIgJGVsID0gdGhpc1xuICAgICQodGhpcykub25lKCdic1RyYW5zaXRpb25FbmQnLCBmdW5jdGlvbiAoKSB7IGNhbGxlZCA9IHRydWUgfSlcbiAgICB2YXIgY2FsbGJhY2sgPSBmdW5jdGlvbiAoKSB7IGlmICghY2FsbGVkKSAkKCRlbCkudHJpZ2dlcigkLnN1cHBvcnQudHJhbnNpdGlvbi5lbmQpIH1cbiAgICBzZXRUaW1lb3V0KGNhbGxiYWNrLCBkdXJhdGlvbilcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgJChmdW5jdGlvbiAoKSB7XG4gICAgJC5zdXBwb3J0LnRyYW5zaXRpb24gPSB0cmFuc2l0aW9uRW5kKClcblxuICAgIGlmICghJC5zdXBwb3J0LnRyYW5zaXRpb24pIHJldHVyblxuXG4gICAgJC5ldmVudC5zcGVjaWFsLmJzVHJhbnNpdGlvbkVuZCA9IHtcbiAgICAgIGJpbmRUeXBlOiAkLnN1cHBvcnQudHJhbnNpdGlvbi5lbmQsXG4gICAgICBkZWxlZ2F0ZVR5cGU6ICQuc3VwcG9ydC50cmFuc2l0aW9uLmVuZCxcbiAgICAgIGhhbmRsZTogZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgaWYgKCQoZS50YXJnZXQpLmlzKHRoaXMpKSByZXR1cm4gZS5oYW5kbGVPYmouaGFuZGxlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgICB9XG4gICAgfVxuICB9KVxuXG59KGpRdWVyeSk7XG5cbi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogQm9vdHN0cmFwOiBhbGVydC5qcyB2My40LjFcbiAqIGh0dHBzOi8vZ2V0Ym9vdHN0cmFwLmNvbS9kb2NzLzMuNC9qYXZhc2NyaXB0LyNhbGVydHNcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogQ29weXJpZ2h0IDIwMTEtMjAxOSBUd2l0dGVyLCBJbmMuXG4gKiBMaWNlbnNlZCB1bmRlciBNSVQgKGh0dHBzOi8vZ2l0aHViLmNvbS90d2JzL2Jvb3RzdHJhcC9ibG9iL21hc3Rlci9MSUNFTlNFKVxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovXG5cblxuK2Z1bmN0aW9uICgkKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICAvLyBBTEVSVCBDTEFTUyBERUZJTklUSU9OXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT1cblxuICB2YXIgZGlzbWlzcyA9ICdbZGF0YS1kaXNtaXNzPVwiYWxlcnRcIl0nXG4gIHZhciBBbGVydCAgID0gZnVuY3Rpb24gKGVsKSB7XG4gICAgJChlbCkub24oJ2NsaWNrJywgZGlzbWlzcywgdGhpcy5jbG9zZSlcbiAgfVxuXG4gIEFsZXJ0LlZFUlNJT04gPSAnMy40LjEnXG5cbiAgQWxlcnQuVFJBTlNJVElPTl9EVVJBVElPTiA9IDE1MFxuXG4gIEFsZXJ0LnByb3RvdHlwZS5jbG9zZSA9IGZ1bmN0aW9uIChlKSB7XG4gICAgdmFyICR0aGlzICAgID0gJCh0aGlzKVxuICAgIHZhciBzZWxlY3RvciA9ICR0aGlzLmF0dHIoJ2RhdGEtdGFyZ2V0JylcblxuICAgIGlmICghc2VsZWN0b3IpIHtcbiAgICAgIHNlbGVjdG9yID0gJHRoaXMuYXR0cignaHJlZicpXG4gICAgICBzZWxlY3RvciA9IHNlbGVjdG9yICYmIHNlbGVjdG9yLnJlcGxhY2UoLy4qKD89I1teXFxzXSokKS8sICcnKSAvLyBzdHJpcCBmb3IgaWU3XG4gICAgfVxuXG4gICAgc2VsZWN0b3IgICAgPSBzZWxlY3RvciA9PT0gJyMnID8gW10gOiBzZWxlY3RvclxuICAgIHZhciAkcGFyZW50ID0gJChkb2N1bWVudCkuZmluZChzZWxlY3RvcilcblxuICAgIGlmIChlKSBlLnByZXZlbnREZWZhdWx0KClcblxuICAgIGlmICghJHBhcmVudC5sZW5ndGgpIHtcbiAgICAgICRwYXJlbnQgPSAkdGhpcy5jbG9zZXN0KCcuYWxlcnQnKVxuICAgIH1cblxuICAgICRwYXJlbnQudHJpZ2dlcihlID0gJC5FdmVudCgnY2xvc2UuYnMuYWxlcnQnKSlcblxuICAgIGlmIChlLmlzRGVmYXVsdFByZXZlbnRlZCgpKSByZXR1cm5cblxuICAgICRwYXJlbnQucmVtb3ZlQ2xhc3MoJ2luJylcblxuICAgIGZ1bmN0aW9uIHJlbW92ZUVsZW1lbnQoKSB7XG4gICAgICAvLyBkZXRhY2ggZnJvbSBwYXJlbnQsIGZpcmUgZXZlbnQgdGhlbiBjbGVhbiB1cCBkYXRhXG4gICAgICAkcGFyZW50LmRldGFjaCgpLnRyaWdnZXIoJ2Nsb3NlZC5icy5hbGVydCcpLnJlbW92ZSgpXG4gICAgfVxuXG4gICAgJC5zdXBwb3J0LnRyYW5zaXRpb24gJiYgJHBhcmVudC5oYXNDbGFzcygnZmFkZScpID9cbiAgICAgICRwYXJlbnRcbiAgICAgICAgLm9uZSgnYnNUcmFuc2l0aW9uRW5kJywgcmVtb3ZlRWxlbWVudClcbiAgICAgICAgLmVtdWxhdGVUcmFuc2l0aW9uRW5kKEFsZXJ0LlRSQU5TSVRJT05fRFVSQVRJT04pIDpcbiAgICAgIHJlbW92ZUVsZW1lbnQoKVxuICB9XG5cblxuICAvLyBBTEVSVCBQTFVHSU4gREVGSU5JVElPTlxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PVxuXG4gIGZ1bmN0aW9uIFBsdWdpbihvcHRpb24pIHtcbiAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciAkdGhpcyA9ICQodGhpcylcbiAgICAgIHZhciBkYXRhICA9ICR0aGlzLmRhdGEoJ2JzLmFsZXJ0JylcblxuICAgICAgaWYgKCFkYXRhKSAkdGhpcy5kYXRhKCdicy5hbGVydCcsIChkYXRhID0gbmV3IEFsZXJ0KHRoaXMpKSlcbiAgICAgIGlmICh0eXBlb2Ygb3B0aW9uID09ICdzdHJpbmcnKSBkYXRhW29wdGlvbl0uY2FsbCgkdGhpcylcbiAgICB9KVxuICB9XG5cbiAgdmFyIG9sZCA9ICQuZm4uYWxlcnRcblxuICAkLmZuLmFsZXJ0ICAgICAgICAgICAgID0gUGx1Z2luXG4gICQuZm4uYWxlcnQuQ29uc3RydWN0b3IgPSBBbGVydFxuXG5cbiAgLy8gQUxFUlQgTk8gQ09ORkxJQ1RcbiAgLy8gPT09PT09PT09PT09PT09PT1cblxuICAkLmZuLmFsZXJ0Lm5vQ29uZmxpY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgJC5mbi5hbGVydCA9IG9sZFxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuXG4gIC8vIEFMRVJUIERBVEEtQVBJXG4gIC8vID09PT09PT09PT09PT09XG5cbiAgJChkb2N1bWVudCkub24oJ2NsaWNrLmJzLmFsZXJ0LmRhdGEtYXBpJywgZGlzbWlzcywgQWxlcnQucHJvdG90eXBlLmNsb3NlKVxuXG59KGpRdWVyeSk7XG5cbi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogQm9vdHN0cmFwOiBidXR0b24uanMgdjMuNC4xXG4gKiBodHRwczovL2dldGJvb3RzdHJhcC5jb20vZG9jcy8zLjQvamF2YXNjcmlwdC8jYnV0dG9uc1xuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBDb3B5cmlnaHQgMjAxMS0yMDE5IFR3aXR0ZXIsIEluYy5cbiAqIExpY2Vuc2VkIHVuZGVyIE1JVCAoaHR0cHM6Ly9naXRodWIuY29tL3R3YnMvYm9vdHN0cmFwL2Jsb2IvbWFzdGVyL0xJQ0VOU0UpXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi9cblxuXG4rZnVuY3Rpb24gKCQpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIC8vIEJVVFRPTiBQVUJMSUMgQ0xBU1MgREVGSU5JVElPTlxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICB2YXIgQnV0dG9uID0gZnVuY3Rpb24gKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLiRlbGVtZW50ICA9ICQoZWxlbWVudClcbiAgICB0aGlzLm9wdGlvbnMgICA9ICQuZXh0ZW5kKHt9LCBCdXR0b24uREVGQVVMVFMsIG9wdGlvbnMpXG4gICAgdGhpcy5pc0xvYWRpbmcgPSBmYWxzZVxuICB9XG5cbiAgQnV0dG9uLlZFUlNJT04gID0gJzMuNC4xJ1xuXG4gIEJ1dHRvbi5ERUZBVUxUUyA9IHtcbiAgICBsb2FkaW5nVGV4dDogJ2xvYWRpbmcuLi4nXG4gIH1cblxuICBCdXR0b24ucHJvdG90eXBlLnNldFN0YXRlID0gZnVuY3Rpb24gKHN0YXRlKSB7XG4gICAgdmFyIGQgICAgPSAnZGlzYWJsZWQnXG4gICAgdmFyICRlbCAgPSB0aGlzLiRlbGVtZW50XG4gICAgdmFyIHZhbCAgPSAkZWwuaXMoJ2lucHV0JykgPyAndmFsJyA6ICdodG1sJ1xuICAgIHZhciBkYXRhID0gJGVsLmRhdGEoKVxuXG4gICAgc3RhdGUgKz0gJ1RleHQnXG5cbiAgICBpZiAoZGF0YS5yZXNldFRleHQgPT0gbnVsbCkgJGVsLmRhdGEoJ3Jlc2V0VGV4dCcsICRlbFt2YWxdKCkpXG5cbiAgICAvLyBwdXNoIHRvIGV2ZW50IGxvb3AgdG8gYWxsb3cgZm9ybXMgdG8gc3VibWl0XG4gICAgc2V0VGltZW91dCgkLnByb3h5KGZ1bmN0aW9uICgpIHtcbiAgICAgICRlbFt2YWxdKGRhdGFbc3RhdGVdID09IG51bGwgPyB0aGlzLm9wdGlvbnNbc3RhdGVdIDogZGF0YVtzdGF0ZV0pXG5cbiAgICAgIGlmIChzdGF0ZSA9PSAnbG9hZGluZ1RleHQnKSB7XG4gICAgICAgIHRoaXMuaXNMb2FkaW5nID0gdHJ1ZVxuICAgICAgICAkZWwuYWRkQ2xhc3MoZCkuYXR0cihkLCBkKS5wcm9wKGQsIHRydWUpXG4gICAgICB9IGVsc2UgaWYgKHRoaXMuaXNMb2FkaW5nKSB7XG4gICAgICAgIHRoaXMuaXNMb2FkaW5nID0gZmFsc2VcbiAgICAgICAgJGVsLnJlbW92ZUNsYXNzKGQpLnJlbW92ZUF0dHIoZCkucHJvcChkLCBmYWxzZSlcbiAgICAgIH1cbiAgICB9LCB0aGlzKSwgMClcbiAgfVxuXG4gIEJ1dHRvbi5wcm90b3R5cGUudG9nZ2xlID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBjaGFuZ2VkID0gdHJ1ZVxuICAgIHZhciAkcGFyZW50ID0gdGhpcy4kZWxlbWVudC5jbG9zZXN0KCdbZGF0YS10b2dnbGU9XCJidXR0b25zXCJdJylcblxuICAgIGlmICgkcGFyZW50Lmxlbmd0aCkge1xuICAgICAgdmFyICRpbnB1dCA9IHRoaXMuJGVsZW1lbnQuZmluZCgnaW5wdXQnKVxuICAgICAgaWYgKCRpbnB1dC5wcm9wKCd0eXBlJykgPT0gJ3JhZGlvJykge1xuICAgICAgICBpZiAoJGlucHV0LnByb3AoJ2NoZWNrZWQnKSkgY2hhbmdlZCA9IGZhbHNlXG4gICAgICAgICRwYXJlbnQuZmluZCgnLmFjdGl2ZScpLnJlbW92ZUNsYXNzKCdhY3RpdmUnKVxuICAgICAgICB0aGlzLiRlbGVtZW50LmFkZENsYXNzKCdhY3RpdmUnKVxuICAgICAgfSBlbHNlIGlmICgkaW5wdXQucHJvcCgndHlwZScpID09ICdjaGVja2JveCcpIHtcbiAgICAgICAgaWYgKCgkaW5wdXQucHJvcCgnY2hlY2tlZCcpKSAhPT0gdGhpcy4kZWxlbWVudC5oYXNDbGFzcygnYWN0aXZlJykpIGNoYW5nZWQgPSBmYWxzZVxuICAgICAgICB0aGlzLiRlbGVtZW50LnRvZ2dsZUNsYXNzKCdhY3RpdmUnKVxuICAgICAgfVxuICAgICAgJGlucHV0LnByb3AoJ2NoZWNrZWQnLCB0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKCdhY3RpdmUnKSlcbiAgICAgIGlmIChjaGFuZ2VkKSAkaW5wdXQudHJpZ2dlcignY2hhbmdlJylcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy4kZWxlbWVudC5hdHRyKCdhcmlhLXByZXNzZWQnLCAhdGhpcy4kZWxlbWVudC5oYXNDbGFzcygnYWN0aXZlJykpXG4gICAgICB0aGlzLiRlbGVtZW50LnRvZ2dsZUNsYXNzKCdhY3RpdmUnKVxuICAgIH1cbiAgfVxuXG5cbiAgLy8gQlVUVE9OIFBMVUdJTiBERUZJTklUSU9OXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gIGZ1bmN0aW9uIFBsdWdpbihvcHRpb24pIHtcbiAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciAkdGhpcyAgID0gJCh0aGlzKVxuICAgICAgdmFyIGRhdGEgICAgPSAkdGhpcy5kYXRhKCdicy5idXR0b24nKVxuICAgICAgdmFyIG9wdGlvbnMgPSB0eXBlb2Ygb3B0aW9uID09ICdvYmplY3QnICYmIG9wdGlvblxuXG4gICAgICBpZiAoIWRhdGEpICR0aGlzLmRhdGEoJ2JzLmJ1dHRvbicsIChkYXRhID0gbmV3IEJ1dHRvbih0aGlzLCBvcHRpb25zKSkpXG5cbiAgICAgIGlmIChvcHRpb24gPT0gJ3RvZ2dsZScpIGRhdGEudG9nZ2xlKClcbiAgICAgIGVsc2UgaWYgKG9wdGlvbikgZGF0YS5zZXRTdGF0ZShvcHRpb24pXG4gICAgfSlcbiAgfVxuXG4gIHZhciBvbGQgPSAkLmZuLmJ1dHRvblxuXG4gICQuZm4uYnV0dG9uICAgICAgICAgICAgID0gUGx1Z2luXG4gICQuZm4uYnV0dG9uLkNvbnN0cnVjdG9yID0gQnV0dG9uXG5cblxuICAvLyBCVVRUT04gTk8gQ09ORkxJQ1RcbiAgLy8gPT09PT09PT09PT09PT09PT09XG5cbiAgJC5mbi5idXR0b24ubm9Db25mbGljdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAkLmZuLmJ1dHRvbiA9IG9sZFxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuXG4gIC8vIEJVVFRPTiBEQVRBLUFQSVxuICAvLyA9PT09PT09PT09PT09PT1cblxuICAkKGRvY3VtZW50KVxuICAgIC5vbignY2xpY2suYnMuYnV0dG9uLmRhdGEtYXBpJywgJ1tkYXRhLXRvZ2dsZV49XCJidXR0b25cIl0nLCBmdW5jdGlvbiAoZSkge1xuICAgICAgdmFyICRidG4gPSAkKGUudGFyZ2V0KS5jbG9zZXN0KCcuYnRuJylcbiAgICAgIFBsdWdpbi5jYWxsKCRidG4sICd0b2dnbGUnKVxuICAgICAgaWYgKCEoJChlLnRhcmdldCkuaXMoJ2lucHV0W3R5cGU9XCJyYWRpb1wiXSwgaW5wdXRbdHlwZT1cImNoZWNrYm94XCJdJykpKSB7XG4gICAgICAgIC8vIFByZXZlbnQgZG91YmxlIGNsaWNrIG9uIHJhZGlvcywgYW5kIHRoZSBkb3VibGUgc2VsZWN0aW9ucyAoc28gY2FuY2VsbGF0aW9uKSBvbiBjaGVja2JveGVzXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgICAvLyBUaGUgdGFyZ2V0IGNvbXBvbmVudCBzdGlsbCByZWNlaXZlIHRoZSBmb2N1c1xuICAgICAgICBpZiAoJGJ0bi5pcygnaW5wdXQsYnV0dG9uJykpICRidG4udHJpZ2dlcignZm9jdXMnKVxuICAgICAgICBlbHNlICRidG4uZmluZCgnaW5wdXQ6dmlzaWJsZSxidXR0b246dmlzaWJsZScpLmZpcnN0KCkudHJpZ2dlcignZm9jdXMnKVxuICAgICAgfVxuICAgIH0pXG4gICAgLm9uKCdmb2N1cy5icy5idXR0b24uZGF0YS1hcGkgYmx1ci5icy5idXR0b24uZGF0YS1hcGknLCAnW2RhdGEtdG9nZ2xlXj1cImJ1dHRvblwiXScsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAkKGUudGFyZ2V0KS5jbG9zZXN0KCcuYnRuJykudG9nZ2xlQ2xhc3MoJ2ZvY3VzJywgL15mb2N1cyhpbik/JC8udGVzdChlLnR5cGUpKVxuICAgIH0pXG5cbn0oalF1ZXJ5KTtcblxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBCb290c3RyYXA6IGNhcm91c2VsLmpzIHYzLjQuMVxuICogaHR0cHM6Ly9nZXRib290c3RyYXAuY29tL2RvY3MvMy40L2phdmFzY3JpcHQvI2Nhcm91c2VsXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIENvcHlyaWdodCAyMDExLTIwMTkgVHdpdHRlciwgSW5jLlxuICogTGljZW5zZWQgdW5kZXIgTUlUIChodHRwczovL2dpdGh1Yi5jb20vdHdicy9ib290c3RyYXAvYmxvYi9tYXN0ZXIvTElDRU5TRSlcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqL1xuXG5cbitmdW5jdGlvbiAoJCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgLy8gQ0FST1VTRUwgQ0xBU1MgREVGSU5JVElPTlxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgdmFyIENhcm91c2VsID0gZnVuY3Rpb24gKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLiRlbGVtZW50ICAgID0gJChlbGVtZW50KVxuICAgIHRoaXMuJGluZGljYXRvcnMgPSB0aGlzLiRlbGVtZW50LmZpbmQoJy5jYXJvdXNlbC1pbmRpY2F0b3JzJylcbiAgICB0aGlzLm9wdGlvbnMgICAgID0gb3B0aW9uc1xuICAgIHRoaXMucGF1c2VkICAgICAgPSBudWxsXG4gICAgdGhpcy5zbGlkaW5nICAgICA9IG51bGxcbiAgICB0aGlzLmludGVydmFsICAgID0gbnVsbFxuICAgIHRoaXMuJGFjdGl2ZSAgICAgPSBudWxsXG4gICAgdGhpcy4kaXRlbXMgICAgICA9IG51bGxcblxuICAgIHRoaXMub3B0aW9ucy5rZXlib2FyZCAmJiB0aGlzLiRlbGVtZW50Lm9uKCdrZXlkb3duLmJzLmNhcm91c2VsJywgJC5wcm94eSh0aGlzLmtleWRvd24sIHRoaXMpKVxuXG4gICAgdGhpcy5vcHRpb25zLnBhdXNlID09ICdob3ZlcicgJiYgISgnb250b3VjaHN0YXJ0JyBpbiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQpICYmIHRoaXMuJGVsZW1lbnRcbiAgICAgIC5vbignbW91c2VlbnRlci5icy5jYXJvdXNlbCcsICQucHJveHkodGhpcy5wYXVzZSwgdGhpcykpXG4gICAgICAub24oJ21vdXNlbGVhdmUuYnMuY2Fyb3VzZWwnLCAkLnByb3h5KHRoaXMuY3ljbGUsIHRoaXMpKVxuICB9XG5cbiAgQ2Fyb3VzZWwuVkVSU0lPTiAgPSAnMy40LjEnXG5cbiAgQ2Fyb3VzZWwuVFJBTlNJVElPTl9EVVJBVElPTiA9IDYwMFxuXG4gIENhcm91c2VsLkRFRkFVTFRTID0ge1xuICAgIGludGVydmFsOiA1MDAwLFxuICAgIHBhdXNlOiAnaG92ZXInLFxuICAgIHdyYXA6IHRydWUsXG4gICAga2V5Ym9hcmQ6IHRydWVcbiAgfVxuXG4gIENhcm91c2VsLnByb3RvdHlwZS5rZXlkb3duID0gZnVuY3Rpb24gKGUpIHtcbiAgICBpZiAoL2lucHV0fHRleHRhcmVhL2kudGVzdChlLnRhcmdldC50YWdOYW1lKSkgcmV0dXJuXG4gICAgc3dpdGNoIChlLndoaWNoKSB7XG4gICAgICBjYXNlIDM3OiB0aGlzLnByZXYoKTsgYnJlYWtcbiAgICAgIGNhc2UgMzk6IHRoaXMubmV4dCgpOyBicmVha1xuICAgICAgZGVmYXVsdDogcmV0dXJuXG4gICAgfVxuXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gIH1cblxuICBDYXJvdXNlbC5wcm90b3R5cGUuY3ljbGUgPSBmdW5jdGlvbiAoZSkge1xuICAgIGUgfHwgKHRoaXMucGF1c2VkID0gZmFsc2UpXG5cbiAgICB0aGlzLmludGVydmFsICYmIGNsZWFySW50ZXJ2YWwodGhpcy5pbnRlcnZhbClcblxuICAgIHRoaXMub3B0aW9ucy5pbnRlcnZhbFxuICAgICAgJiYgIXRoaXMucGF1c2VkXG4gICAgICAmJiAodGhpcy5pbnRlcnZhbCA9IHNldEludGVydmFsKCQucHJveHkodGhpcy5uZXh0LCB0aGlzKSwgdGhpcy5vcHRpb25zLmludGVydmFsKSlcblxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICBDYXJvdXNlbC5wcm90b3R5cGUuZ2V0SXRlbUluZGV4ID0gZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICB0aGlzLiRpdGVtcyA9IGl0ZW0ucGFyZW50KCkuY2hpbGRyZW4oJy5pdGVtJylcbiAgICByZXR1cm4gdGhpcy4kaXRlbXMuaW5kZXgoaXRlbSB8fCB0aGlzLiRhY3RpdmUpXG4gIH1cblxuICBDYXJvdXNlbC5wcm90b3R5cGUuZ2V0SXRlbUZvckRpcmVjdGlvbiA9IGZ1bmN0aW9uIChkaXJlY3Rpb24sIGFjdGl2ZSkge1xuICAgIHZhciBhY3RpdmVJbmRleCA9IHRoaXMuZ2V0SXRlbUluZGV4KGFjdGl2ZSlcbiAgICB2YXIgd2lsbFdyYXAgPSAoZGlyZWN0aW9uID09ICdwcmV2JyAmJiBhY3RpdmVJbmRleCA9PT0gMClcbiAgICAgICAgICAgICAgICB8fCAoZGlyZWN0aW9uID09ICduZXh0JyAmJiBhY3RpdmVJbmRleCA9PSAodGhpcy4kaXRlbXMubGVuZ3RoIC0gMSkpXG4gICAgaWYgKHdpbGxXcmFwICYmICF0aGlzLm9wdGlvbnMud3JhcCkgcmV0dXJuIGFjdGl2ZVxuICAgIHZhciBkZWx0YSA9IGRpcmVjdGlvbiA9PSAncHJldicgPyAtMSA6IDFcbiAgICB2YXIgaXRlbUluZGV4ID0gKGFjdGl2ZUluZGV4ICsgZGVsdGEpICUgdGhpcy4kaXRlbXMubGVuZ3RoXG4gICAgcmV0dXJuIHRoaXMuJGl0ZW1zLmVxKGl0ZW1JbmRleClcbiAgfVxuXG4gIENhcm91c2VsLnByb3RvdHlwZS50byA9IGZ1bmN0aW9uIChwb3MpIHtcbiAgICB2YXIgdGhhdCAgICAgICAgPSB0aGlzXG4gICAgdmFyIGFjdGl2ZUluZGV4ID0gdGhpcy5nZXRJdGVtSW5kZXgodGhpcy4kYWN0aXZlID0gdGhpcy4kZWxlbWVudC5maW5kKCcuaXRlbS5hY3RpdmUnKSlcblxuICAgIGlmIChwb3MgPiAodGhpcy4kaXRlbXMubGVuZ3RoIC0gMSkgfHwgcG9zIDwgMCkgcmV0dXJuXG5cbiAgICBpZiAodGhpcy5zbGlkaW5nKSAgICAgICByZXR1cm4gdGhpcy4kZWxlbWVudC5vbmUoJ3NsaWQuYnMuY2Fyb3VzZWwnLCBmdW5jdGlvbiAoKSB7IHRoYXQudG8ocG9zKSB9KSAvLyB5ZXMsIFwic2xpZFwiXG4gICAgaWYgKGFjdGl2ZUluZGV4ID09IHBvcykgcmV0dXJuIHRoaXMucGF1c2UoKS5jeWNsZSgpXG5cbiAgICByZXR1cm4gdGhpcy5zbGlkZShwb3MgPiBhY3RpdmVJbmRleCA/ICduZXh0JyA6ICdwcmV2JywgdGhpcy4kaXRlbXMuZXEocG9zKSlcbiAgfVxuXG4gIENhcm91c2VsLnByb3RvdHlwZS5wYXVzZSA9IGZ1bmN0aW9uIChlKSB7XG4gICAgZSB8fCAodGhpcy5wYXVzZWQgPSB0cnVlKVxuXG4gICAgaWYgKHRoaXMuJGVsZW1lbnQuZmluZCgnLm5leHQsIC5wcmV2JykubGVuZ3RoICYmICQuc3VwcG9ydC50cmFuc2l0aW9uKSB7XG4gICAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJC5zdXBwb3J0LnRyYW5zaXRpb24uZW5kKVxuICAgICAgdGhpcy5jeWNsZSh0cnVlKVxuICAgIH1cblxuICAgIHRoaXMuaW50ZXJ2YWwgPSBjbGVhckludGVydmFsKHRoaXMuaW50ZXJ2YWwpXG5cbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgQ2Fyb3VzZWwucHJvdG90eXBlLm5leHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMuc2xpZGluZykgcmV0dXJuXG4gICAgcmV0dXJuIHRoaXMuc2xpZGUoJ25leHQnKVxuICB9XG5cbiAgQ2Fyb3VzZWwucHJvdG90eXBlLnByZXYgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMuc2xpZGluZykgcmV0dXJuXG4gICAgcmV0dXJuIHRoaXMuc2xpZGUoJ3ByZXYnKVxuICB9XG5cbiAgQ2Fyb3VzZWwucHJvdG90eXBlLnNsaWRlID0gZnVuY3Rpb24gKHR5cGUsIG5leHQpIHtcbiAgICB2YXIgJGFjdGl2ZSAgID0gdGhpcy4kZWxlbWVudC5maW5kKCcuaXRlbS5hY3RpdmUnKVxuICAgIHZhciAkbmV4dCAgICAgPSBuZXh0IHx8IHRoaXMuZ2V0SXRlbUZvckRpcmVjdGlvbih0eXBlLCAkYWN0aXZlKVxuICAgIHZhciBpc0N5Y2xpbmcgPSB0aGlzLmludGVydmFsXG4gICAgdmFyIGRpcmVjdGlvbiA9IHR5cGUgPT0gJ25leHQnID8gJ2xlZnQnIDogJ3JpZ2h0J1xuICAgIHZhciB0aGF0ICAgICAgPSB0aGlzXG5cbiAgICBpZiAoJG5leHQuaGFzQ2xhc3MoJ2FjdGl2ZScpKSByZXR1cm4gKHRoaXMuc2xpZGluZyA9IGZhbHNlKVxuXG4gICAgdmFyIHJlbGF0ZWRUYXJnZXQgPSAkbmV4dFswXVxuICAgIHZhciBzbGlkZUV2ZW50ID0gJC5FdmVudCgnc2xpZGUuYnMuY2Fyb3VzZWwnLCB7XG4gICAgICByZWxhdGVkVGFyZ2V0OiByZWxhdGVkVGFyZ2V0LFxuICAgICAgZGlyZWN0aW9uOiBkaXJlY3Rpb25cbiAgICB9KVxuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcihzbGlkZUV2ZW50KVxuICAgIGlmIChzbGlkZUV2ZW50LmlzRGVmYXVsdFByZXZlbnRlZCgpKSByZXR1cm5cblxuICAgIHRoaXMuc2xpZGluZyA9IHRydWVcblxuICAgIGlzQ3ljbGluZyAmJiB0aGlzLnBhdXNlKClcblxuICAgIGlmICh0aGlzLiRpbmRpY2F0b3JzLmxlbmd0aCkge1xuICAgICAgdGhpcy4kaW5kaWNhdG9ycy5maW5kKCcuYWN0aXZlJykucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpXG4gICAgICB2YXIgJG5leHRJbmRpY2F0b3IgPSAkKHRoaXMuJGluZGljYXRvcnMuY2hpbGRyZW4oKVt0aGlzLmdldEl0ZW1JbmRleCgkbmV4dCldKVxuICAgICAgJG5leHRJbmRpY2F0b3IgJiYgJG5leHRJbmRpY2F0b3IuYWRkQ2xhc3MoJ2FjdGl2ZScpXG4gICAgfVxuXG4gICAgdmFyIHNsaWRFdmVudCA9ICQuRXZlbnQoJ3NsaWQuYnMuY2Fyb3VzZWwnLCB7IHJlbGF0ZWRUYXJnZXQ6IHJlbGF0ZWRUYXJnZXQsIGRpcmVjdGlvbjogZGlyZWN0aW9uIH0pIC8vIHllcywgXCJzbGlkXCJcbiAgICBpZiAoJC5zdXBwb3J0LnRyYW5zaXRpb24gJiYgdGhpcy4kZWxlbWVudC5oYXNDbGFzcygnc2xpZGUnKSkge1xuICAgICAgJG5leHQuYWRkQ2xhc3ModHlwZSlcbiAgICAgIGlmICh0eXBlb2YgJG5leHQgPT09ICdvYmplY3QnICYmICRuZXh0Lmxlbmd0aCkge1xuICAgICAgICAkbmV4dFswXS5vZmZzZXRXaWR0aCAvLyBmb3JjZSByZWZsb3dcbiAgICAgIH1cbiAgICAgICRhY3RpdmUuYWRkQ2xhc3MoZGlyZWN0aW9uKVxuICAgICAgJG5leHQuYWRkQ2xhc3MoZGlyZWN0aW9uKVxuICAgICAgJGFjdGl2ZVxuICAgICAgICAub25lKCdic1RyYW5zaXRpb25FbmQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgJG5leHQucmVtb3ZlQ2xhc3MoW3R5cGUsIGRpcmVjdGlvbl0uam9pbignICcpKS5hZGRDbGFzcygnYWN0aXZlJylcbiAgICAgICAgICAkYWN0aXZlLnJlbW92ZUNsYXNzKFsnYWN0aXZlJywgZGlyZWN0aW9uXS5qb2luKCcgJykpXG4gICAgICAgICAgdGhhdC5zbGlkaW5nID0gZmFsc2VcbiAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoYXQuJGVsZW1lbnQudHJpZ2dlcihzbGlkRXZlbnQpXG4gICAgICAgICAgfSwgMClcbiAgICAgICAgfSlcbiAgICAgICAgLmVtdWxhdGVUcmFuc2l0aW9uRW5kKENhcm91c2VsLlRSQU5TSVRJT05fRFVSQVRJT04pXG4gICAgfSBlbHNlIHtcbiAgICAgICRhY3RpdmUucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpXG4gICAgICAkbmV4dC5hZGRDbGFzcygnYWN0aXZlJylcbiAgICAgIHRoaXMuc2xpZGluZyA9IGZhbHNlXG4gICAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoc2xpZEV2ZW50KVxuICAgIH1cblxuICAgIGlzQ3ljbGluZyAmJiB0aGlzLmN5Y2xlKClcblxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuXG4gIC8vIENBUk9VU0VMIFBMVUdJTiBERUZJTklUSU9OXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgZnVuY3Rpb24gUGx1Z2luKG9wdGlvbikge1xuICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgdmFyICR0aGlzICAgPSAkKHRoaXMpXG4gICAgICB2YXIgZGF0YSAgICA9ICR0aGlzLmRhdGEoJ2JzLmNhcm91c2VsJylcbiAgICAgIHZhciBvcHRpb25zID0gJC5leHRlbmQoe30sIENhcm91c2VsLkRFRkFVTFRTLCAkdGhpcy5kYXRhKCksIHR5cGVvZiBvcHRpb24gPT0gJ29iamVjdCcgJiYgb3B0aW9uKVxuICAgICAgdmFyIGFjdGlvbiAgPSB0eXBlb2Ygb3B0aW9uID09ICdzdHJpbmcnID8gb3B0aW9uIDogb3B0aW9ucy5zbGlkZVxuXG4gICAgICBpZiAoIWRhdGEpICR0aGlzLmRhdGEoJ2JzLmNhcm91c2VsJywgKGRhdGEgPSBuZXcgQ2Fyb3VzZWwodGhpcywgb3B0aW9ucykpKVxuICAgICAgaWYgKHR5cGVvZiBvcHRpb24gPT0gJ251bWJlcicpIGRhdGEudG8ob3B0aW9uKVxuICAgICAgZWxzZSBpZiAoYWN0aW9uKSBkYXRhW2FjdGlvbl0oKVxuICAgICAgZWxzZSBpZiAob3B0aW9ucy5pbnRlcnZhbCkgZGF0YS5wYXVzZSgpLmN5Y2xlKClcbiAgICB9KVxuICB9XG5cbiAgdmFyIG9sZCA9ICQuZm4uY2Fyb3VzZWxcblxuICAkLmZuLmNhcm91c2VsICAgICAgICAgICAgID0gUGx1Z2luXG4gICQuZm4uY2Fyb3VzZWwuQ29uc3RydWN0b3IgPSBDYXJvdXNlbFxuXG5cbiAgLy8gQ0FST1VTRUwgTk8gQ09ORkxJQ1RcbiAgLy8gPT09PT09PT09PT09PT09PT09PT1cblxuICAkLmZuLmNhcm91c2VsLm5vQ29uZmxpY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgJC5mbi5jYXJvdXNlbCA9IG9sZFxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuXG4gIC8vIENBUk9VU0VMIERBVEEtQVBJXG4gIC8vID09PT09PT09PT09PT09PT09XG5cbiAgdmFyIGNsaWNrSGFuZGxlciA9IGZ1bmN0aW9uIChlKSB7XG4gICAgdmFyICR0aGlzICAgPSAkKHRoaXMpXG4gICAgdmFyIGhyZWYgICAgPSAkdGhpcy5hdHRyKCdocmVmJylcbiAgICBpZiAoaHJlZikge1xuICAgICAgaHJlZiA9IGhyZWYucmVwbGFjZSgvLiooPz0jW15cXHNdKyQpLywgJycpIC8vIHN0cmlwIGZvciBpZTdcbiAgICB9XG5cbiAgICB2YXIgdGFyZ2V0ICA9ICR0aGlzLmF0dHIoJ2RhdGEtdGFyZ2V0JykgfHwgaHJlZlxuICAgIHZhciAkdGFyZ2V0ID0gJChkb2N1bWVudCkuZmluZCh0YXJnZXQpXG5cbiAgICBpZiAoISR0YXJnZXQuaGFzQ2xhc3MoJ2Nhcm91c2VsJykpIHJldHVyblxuXG4gICAgdmFyIG9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgJHRhcmdldC5kYXRhKCksICR0aGlzLmRhdGEoKSlcbiAgICB2YXIgc2xpZGVJbmRleCA9ICR0aGlzLmF0dHIoJ2RhdGEtc2xpZGUtdG8nKVxuICAgIGlmIChzbGlkZUluZGV4KSBvcHRpb25zLmludGVydmFsID0gZmFsc2VcblxuICAgIFBsdWdpbi5jYWxsKCR0YXJnZXQsIG9wdGlvbnMpXG5cbiAgICBpZiAoc2xpZGVJbmRleCkge1xuICAgICAgJHRhcmdldC5kYXRhKCdicy5jYXJvdXNlbCcpLnRvKHNsaWRlSW5kZXgpXG4gICAgfVxuXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gIH1cblxuICAkKGRvY3VtZW50KVxuICAgIC5vbignY2xpY2suYnMuY2Fyb3VzZWwuZGF0YS1hcGknLCAnW2RhdGEtc2xpZGVdJywgY2xpY2tIYW5kbGVyKVxuICAgIC5vbignY2xpY2suYnMuY2Fyb3VzZWwuZGF0YS1hcGknLCAnW2RhdGEtc2xpZGUtdG9dJywgY2xpY2tIYW5kbGVyKVxuXG4gICQod2luZG93KS5vbignbG9hZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAkKCdbZGF0YS1yaWRlPVwiY2Fyb3VzZWxcIl0nKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciAkY2Fyb3VzZWwgPSAkKHRoaXMpXG4gICAgICBQbHVnaW4uY2FsbCgkY2Fyb3VzZWwsICRjYXJvdXNlbC5kYXRhKCkpXG4gICAgfSlcbiAgfSlcblxufShqUXVlcnkpO1xuXG4vKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIEJvb3RzdHJhcDogY29sbGFwc2UuanMgdjMuNC4xXG4gKiBodHRwczovL2dldGJvb3RzdHJhcC5jb20vZG9jcy8zLjQvamF2YXNjcmlwdC8jY29sbGFwc2VcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogQ29weXJpZ2h0IDIwMTEtMjAxOSBUd2l0dGVyLCBJbmMuXG4gKiBMaWNlbnNlZCB1bmRlciBNSVQgKGh0dHBzOi8vZ2l0aHViLmNvbS90d2JzL2Jvb3RzdHJhcC9ibG9iL21hc3Rlci9MSUNFTlNFKVxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovXG5cbi8qIGpzaGludCBsYXRlZGVmOiBmYWxzZSAqL1xuXG4rZnVuY3Rpb24gKCQpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIC8vIENPTExBUFNFIFBVQkxJQyBDTEFTUyBERUZJTklUSU9OXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgdmFyIENvbGxhcHNlID0gZnVuY3Rpb24gKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLiRlbGVtZW50ICAgICAgPSAkKGVsZW1lbnQpXG4gICAgdGhpcy5vcHRpb25zICAgICAgID0gJC5leHRlbmQoe30sIENvbGxhcHNlLkRFRkFVTFRTLCBvcHRpb25zKVxuICAgIHRoaXMuJHRyaWdnZXIgICAgICA9ICQoJ1tkYXRhLXRvZ2dsZT1cImNvbGxhcHNlXCJdW2hyZWY9XCIjJyArIGVsZW1lbnQuaWQgKyAnXCJdLCcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgJ1tkYXRhLXRvZ2dsZT1cImNvbGxhcHNlXCJdW2RhdGEtdGFyZ2V0PVwiIycgKyBlbGVtZW50LmlkICsgJ1wiXScpXG4gICAgdGhpcy50cmFuc2l0aW9uaW5nID0gbnVsbFxuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5wYXJlbnQpIHtcbiAgICAgIHRoaXMuJHBhcmVudCA9IHRoaXMuZ2V0UGFyZW50KClcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5hZGRBcmlhQW5kQ29sbGFwc2VkQ2xhc3ModGhpcy4kZWxlbWVudCwgdGhpcy4kdHJpZ2dlcilcbiAgICB9XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLnRvZ2dsZSkgdGhpcy50b2dnbGUoKVxuICB9XG5cbiAgQ29sbGFwc2UuVkVSU0lPTiAgPSAnMy40LjEnXG5cbiAgQ29sbGFwc2UuVFJBTlNJVElPTl9EVVJBVElPTiA9IDM1MFxuXG4gIENvbGxhcHNlLkRFRkFVTFRTID0ge1xuICAgIHRvZ2dsZTogdHJ1ZVxuICB9XG5cbiAgQ29sbGFwc2UucHJvdG90eXBlLmRpbWVuc2lvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgaGFzV2lkdGggPSB0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKCd3aWR0aCcpXG4gICAgcmV0dXJuIGhhc1dpZHRoID8gJ3dpZHRoJyA6ICdoZWlnaHQnXG4gIH1cblxuICBDb2xsYXBzZS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy50cmFuc2l0aW9uaW5nIHx8IHRoaXMuJGVsZW1lbnQuaGFzQ2xhc3MoJ2luJykpIHJldHVyblxuXG4gICAgdmFyIGFjdGl2ZXNEYXRhXG4gICAgdmFyIGFjdGl2ZXMgPSB0aGlzLiRwYXJlbnQgJiYgdGhpcy4kcGFyZW50LmNoaWxkcmVuKCcucGFuZWwnKS5jaGlsZHJlbignLmluLCAuY29sbGFwc2luZycpXG5cbiAgICBpZiAoYWN0aXZlcyAmJiBhY3RpdmVzLmxlbmd0aCkge1xuICAgICAgYWN0aXZlc0RhdGEgPSBhY3RpdmVzLmRhdGEoJ2JzLmNvbGxhcHNlJylcbiAgICAgIGlmIChhY3RpdmVzRGF0YSAmJiBhY3RpdmVzRGF0YS50cmFuc2l0aW9uaW5nKSByZXR1cm5cbiAgICB9XG5cbiAgICB2YXIgc3RhcnRFdmVudCA9ICQuRXZlbnQoJ3Nob3cuYnMuY29sbGFwc2UnKVxuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcihzdGFydEV2ZW50KVxuICAgIGlmIChzdGFydEV2ZW50LmlzRGVmYXVsdFByZXZlbnRlZCgpKSByZXR1cm5cblxuICAgIGlmIChhY3RpdmVzICYmIGFjdGl2ZXMubGVuZ3RoKSB7XG4gICAgICBQbHVnaW4uY2FsbChhY3RpdmVzLCAnaGlkZScpXG4gICAgICBhY3RpdmVzRGF0YSB8fCBhY3RpdmVzLmRhdGEoJ2JzLmNvbGxhcHNlJywgbnVsbClcbiAgICB9XG5cbiAgICB2YXIgZGltZW5zaW9uID0gdGhpcy5kaW1lbnNpb24oKVxuXG4gICAgdGhpcy4kZWxlbWVudFxuICAgICAgLnJlbW92ZUNsYXNzKCdjb2xsYXBzZScpXG4gICAgICAuYWRkQ2xhc3MoJ2NvbGxhcHNpbmcnKVtkaW1lbnNpb25dKDApXG4gICAgICAuYXR0cignYXJpYS1leHBhbmRlZCcsIHRydWUpXG5cbiAgICB0aGlzLiR0cmlnZ2VyXG4gICAgICAucmVtb3ZlQ2xhc3MoJ2NvbGxhcHNlZCcpXG4gICAgICAuYXR0cignYXJpYS1leHBhbmRlZCcsIHRydWUpXG5cbiAgICB0aGlzLnRyYW5zaXRpb25pbmcgPSAxXG5cbiAgICB2YXIgY29tcGxldGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLiRlbGVtZW50XG4gICAgICAgIC5yZW1vdmVDbGFzcygnY29sbGFwc2luZycpXG4gICAgICAgIC5hZGRDbGFzcygnY29sbGFwc2UgaW4nKVtkaW1lbnNpb25dKCcnKVxuICAgICAgdGhpcy50cmFuc2l0aW9uaW5nID0gMFxuICAgICAgdGhpcy4kZWxlbWVudFxuICAgICAgICAudHJpZ2dlcignc2hvd24uYnMuY29sbGFwc2UnKVxuICAgIH1cblxuICAgIGlmICghJC5zdXBwb3J0LnRyYW5zaXRpb24pIHJldHVybiBjb21wbGV0ZS5jYWxsKHRoaXMpXG5cbiAgICB2YXIgc2Nyb2xsU2l6ZSA9ICQuY2FtZWxDYXNlKFsnc2Nyb2xsJywgZGltZW5zaW9uXS5qb2luKCctJykpXG5cbiAgICB0aGlzLiRlbGVtZW50XG4gICAgICAub25lKCdic1RyYW5zaXRpb25FbmQnLCAkLnByb3h5KGNvbXBsZXRlLCB0aGlzKSlcbiAgICAgIC5lbXVsYXRlVHJhbnNpdGlvbkVuZChDb2xsYXBzZS5UUkFOU0lUSU9OX0RVUkFUSU9OKVtkaW1lbnNpb25dKHRoaXMuJGVsZW1lbnRbMF1bc2Nyb2xsU2l6ZV0pXG4gIH1cblxuICBDb2xsYXBzZS5wcm90b3R5cGUuaGlkZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy50cmFuc2l0aW9uaW5nIHx8ICF0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKCdpbicpKSByZXR1cm5cblxuICAgIHZhciBzdGFydEV2ZW50ID0gJC5FdmVudCgnaGlkZS5icy5jb2xsYXBzZScpXG4gICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKHN0YXJ0RXZlbnQpXG4gICAgaWYgKHN0YXJ0RXZlbnQuaXNEZWZhdWx0UHJldmVudGVkKCkpIHJldHVyblxuXG4gICAgdmFyIGRpbWVuc2lvbiA9IHRoaXMuZGltZW5zaW9uKClcblxuICAgIHRoaXMuJGVsZW1lbnRbZGltZW5zaW9uXSh0aGlzLiRlbGVtZW50W2RpbWVuc2lvbl0oKSlbMF0ub2Zmc2V0SGVpZ2h0XG5cbiAgICB0aGlzLiRlbGVtZW50XG4gICAgICAuYWRkQ2xhc3MoJ2NvbGxhcHNpbmcnKVxuICAgICAgLnJlbW92ZUNsYXNzKCdjb2xsYXBzZSBpbicpXG4gICAgICAuYXR0cignYXJpYS1leHBhbmRlZCcsIGZhbHNlKVxuXG4gICAgdGhpcy4kdHJpZ2dlclxuICAgICAgLmFkZENsYXNzKCdjb2xsYXBzZWQnKVxuICAgICAgLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCBmYWxzZSlcblxuICAgIHRoaXMudHJhbnNpdGlvbmluZyA9IDFcblxuICAgIHZhciBjb21wbGV0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMudHJhbnNpdGlvbmluZyA9IDBcbiAgICAgIHRoaXMuJGVsZW1lbnRcbiAgICAgICAgLnJlbW92ZUNsYXNzKCdjb2xsYXBzaW5nJylcbiAgICAgICAgLmFkZENsYXNzKCdjb2xsYXBzZScpXG4gICAgICAgIC50cmlnZ2VyKCdoaWRkZW4uYnMuY29sbGFwc2UnKVxuICAgIH1cblxuICAgIGlmICghJC5zdXBwb3J0LnRyYW5zaXRpb24pIHJldHVybiBjb21wbGV0ZS5jYWxsKHRoaXMpXG5cbiAgICB0aGlzLiRlbGVtZW50XG4gICAgICBbZGltZW5zaW9uXSgwKVxuICAgICAgLm9uZSgnYnNUcmFuc2l0aW9uRW5kJywgJC5wcm94eShjb21wbGV0ZSwgdGhpcykpXG4gICAgICAuZW11bGF0ZVRyYW5zaXRpb25FbmQoQ29sbGFwc2UuVFJBTlNJVElPTl9EVVJBVElPTilcbiAgfVxuXG4gIENvbGxhcHNlLnByb3RvdHlwZS50b2dnbGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpc1t0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKCdpbicpID8gJ2hpZGUnIDogJ3Nob3cnXSgpXG4gIH1cblxuICBDb2xsYXBzZS5wcm90b3R5cGUuZ2V0UGFyZW50ID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAkKGRvY3VtZW50KS5maW5kKHRoaXMub3B0aW9ucy5wYXJlbnQpXG4gICAgICAuZmluZCgnW2RhdGEtdG9nZ2xlPVwiY29sbGFwc2VcIl1bZGF0YS1wYXJlbnQ9XCInICsgdGhpcy5vcHRpb25zLnBhcmVudCArICdcIl0nKVxuICAgICAgLmVhY2goJC5wcm94eShmdW5jdGlvbiAoaSwgZWxlbWVudCkge1xuICAgICAgICB2YXIgJGVsZW1lbnQgPSAkKGVsZW1lbnQpXG4gICAgICAgIHRoaXMuYWRkQXJpYUFuZENvbGxhcHNlZENsYXNzKGdldFRhcmdldEZyb21UcmlnZ2VyKCRlbGVtZW50KSwgJGVsZW1lbnQpXG4gICAgICB9LCB0aGlzKSlcbiAgICAgIC5lbmQoKVxuICB9XG5cbiAgQ29sbGFwc2UucHJvdG90eXBlLmFkZEFyaWFBbmRDb2xsYXBzZWRDbGFzcyA9IGZ1bmN0aW9uICgkZWxlbWVudCwgJHRyaWdnZXIpIHtcbiAgICB2YXIgaXNPcGVuID0gJGVsZW1lbnQuaGFzQ2xhc3MoJ2luJylcblxuICAgICRlbGVtZW50LmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCBpc09wZW4pXG4gICAgJHRyaWdnZXJcbiAgICAgIC50b2dnbGVDbGFzcygnY29sbGFwc2VkJywgIWlzT3BlbilcbiAgICAgIC5hdHRyKCdhcmlhLWV4cGFuZGVkJywgaXNPcGVuKVxuICB9XG5cbiAgZnVuY3Rpb24gZ2V0VGFyZ2V0RnJvbVRyaWdnZXIoJHRyaWdnZXIpIHtcbiAgICB2YXIgaHJlZlxuICAgIHZhciB0YXJnZXQgPSAkdHJpZ2dlci5hdHRyKCdkYXRhLXRhcmdldCcpXG4gICAgICB8fCAoaHJlZiA9ICR0cmlnZ2VyLmF0dHIoJ2hyZWYnKSkgJiYgaHJlZi5yZXBsYWNlKC8uKig/PSNbXlxcc10rJCkvLCAnJykgLy8gc3RyaXAgZm9yIGllN1xuXG4gICAgcmV0dXJuICQoZG9jdW1lbnQpLmZpbmQodGFyZ2V0KVxuICB9XG5cblxuICAvLyBDT0xMQVBTRSBQTFVHSU4gREVGSU5JVElPTlxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gIGZ1bmN0aW9uIFBsdWdpbihvcHRpb24pIHtcbiAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciAkdGhpcyAgID0gJCh0aGlzKVxuICAgICAgdmFyIGRhdGEgICAgPSAkdGhpcy5kYXRhKCdicy5jb2xsYXBzZScpXG4gICAgICB2YXIgb3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBDb2xsYXBzZS5ERUZBVUxUUywgJHRoaXMuZGF0YSgpLCB0eXBlb2Ygb3B0aW9uID09ICdvYmplY3QnICYmIG9wdGlvbilcblxuICAgICAgaWYgKCFkYXRhICYmIG9wdGlvbnMudG9nZ2xlICYmIC9zaG93fGhpZGUvLnRlc3Qob3B0aW9uKSkgb3B0aW9ucy50b2dnbGUgPSBmYWxzZVxuICAgICAgaWYgKCFkYXRhKSAkdGhpcy5kYXRhKCdicy5jb2xsYXBzZScsIChkYXRhID0gbmV3IENvbGxhcHNlKHRoaXMsIG9wdGlvbnMpKSlcbiAgICAgIGlmICh0eXBlb2Ygb3B0aW9uID09ICdzdHJpbmcnKSBkYXRhW29wdGlvbl0oKVxuICAgIH0pXG4gIH1cblxuICB2YXIgb2xkID0gJC5mbi5jb2xsYXBzZVxuXG4gICQuZm4uY29sbGFwc2UgICAgICAgICAgICAgPSBQbHVnaW5cbiAgJC5mbi5jb2xsYXBzZS5Db25zdHJ1Y3RvciA9IENvbGxhcHNlXG5cblxuICAvLyBDT0xMQVBTRSBOTyBDT05GTElDVFxuICAvLyA9PT09PT09PT09PT09PT09PT09PVxuXG4gICQuZm4uY29sbGFwc2Uubm9Db25mbGljdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAkLmZuLmNvbGxhcHNlID0gb2xkXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG5cbiAgLy8gQ09MTEFQU0UgREFUQS1BUElcbiAgLy8gPT09PT09PT09PT09PT09PT1cblxuICAkKGRvY3VtZW50KS5vbignY2xpY2suYnMuY29sbGFwc2UuZGF0YS1hcGknLCAnW2RhdGEtdG9nZ2xlPVwiY29sbGFwc2VcIl0nLCBmdW5jdGlvbiAoZSkge1xuICAgIHZhciAkdGhpcyAgID0gJCh0aGlzKVxuXG4gICAgaWYgKCEkdGhpcy5hdHRyKCdkYXRhLXRhcmdldCcpKSBlLnByZXZlbnREZWZhdWx0KClcblxuICAgIHZhciAkdGFyZ2V0ID0gZ2V0VGFyZ2V0RnJvbVRyaWdnZXIoJHRoaXMpXG4gICAgdmFyIGRhdGEgICAgPSAkdGFyZ2V0LmRhdGEoJ2JzLmNvbGxhcHNlJylcbiAgICB2YXIgb3B0aW9uICA9IGRhdGEgPyAndG9nZ2xlJyA6ICR0aGlzLmRhdGEoKVxuXG4gICAgUGx1Z2luLmNhbGwoJHRhcmdldCwgb3B0aW9uKVxuICB9KVxuXG59KGpRdWVyeSk7XG5cbi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogQm9vdHN0cmFwOiBkcm9wZG93bi5qcyB2My40LjFcbiAqIGh0dHBzOi8vZ2V0Ym9vdHN0cmFwLmNvbS9kb2NzLzMuNC9qYXZhc2NyaXB0LyNkcm9wZG93bnNcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogQ29weXJpZ2h0IDIwMTEtMjAxOSBUd2l0dGVyLCBJbmMuXG4gKiBMaWNlbnNlZCB1bmRlciBNSVQgKGh0dHBzOi8vZ2l0aHViLmNvbS90d2JzL2Jvb3RzdHJhcC9ibG9iL21hc3Rlci9MSUNFTlNFKVxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovXG5cblxuK2Z1bmN0aW9uICgkKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICAvLyBEUk9QRE9XTiBDTEFTUyBERUZJTklUSU9OXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICB2YXIgYmFja2Ryb3AgPSAnLmRyb3Bkb3duLWJhY2tkcm9wJ1xuICB2YXIgdG9nZ2xlICAgPSAnW2RhdGEtdG9nZ2xlPVwiZHJvcGRvd25cIl0nXG4gIHZhciBEcm9wZG93biA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgJChlbGVtZW50KS5vbignY2xpY2suYnMuZHJvcGRvd24nLCB0aGlzLnRvZ2dsZSlcbiAgfVxuXG4gIERyb3Bkb3duLlZFUlNJT04gPSAnMy40LjEnXG5cbiAgZnVuY3Rpb24gZ2V0UGFyZW50KCR0aGlzKSB7XG4gICAgdmFyIHNlbGVjdG9yID0gJHRoaXMuYXR0cignZGF0YS10YXJnZXQnKVxuXG4gICAgaWYgKCFzZWxlY3Rvcikge1xuICAgICAgc2VsZWN0b3IgPSAkdGhpcy5hdHRyKCdocmVmJylcbiAgICAgIHNlbGVjdG9yID0gc2VsZWN0b3IgJiYgLyNbQS1aYS16XS8udGVzdChzZWxlY3RvcikgJiYgc2VsZWN0b3IucmVwbGFjZSgvLiooPz0jW15cXHNdKiQpLywgJycpIC8vIHN0cmlwIGZvciBpZTdcbiAgICB9XG5cbiAgICB2YXIgJHBhcmVudCA9IHNlbGVjdG9yICE9PSAnIycgPyAkKGRvY3VtZW50KS5maW5kKHNlbGVjdG9yKSA6IG51bGxcblxuICAgIHJldHVybiAkcGFyZW50ICYmICRwYXJlbnQubGVuZ3RoID8gJHBhcmVudCA6ICR0aGlzLnBhcmVudCgpXG4gIH1cblxuICBmdW5jdGlvbiBjbGVhck1lbnVzKGUpIHtcbiAgICBpZiAoZSAmJiBlLndoaWNoID09PSAzKSByZXR1cm5cbiAgICAkKGJhY2tkcm9wKS5yZW1vdmUoKVxuICAgICQodG9nZ2xlKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciAkdGhpcyAgICAgICAgID0gJCh0aGlzKVxuICAgICAgdmFyICRwYXJlbnQgICAgICAgPSBnZXRQYXJlbnQoJHRoaXMpXG4gICAgICB2YXIgcmVsYXRlZFRhcmdldCA9IHsgcmVsYXRlZFRhcmdldDogdGhpcyB9XG5cbiAgICAgIGlmICghJHBhcmVudC5oYXNDbGFzcygnb3BlbicpKSByZXR1cm5cblxuICAgICAgaWYgKGUgJiYgZS50eXBlID09ICdjbGljaycgJiYgL2lucHV0fHRleHRhcmVhL2kudGVzdChlLnRhcmdldC50YWdOYW1lKSAmJiAkLmNvbnRhaW5zKCRwYXJlbnRbMF0sIGUudGFyZ2V0KSkgcmV0dXJuXG5cbiAgICAgICRwYXJlbnQudHJpZ2dlcihlID0gJC5FdmVudCgnaGlkZS5icy5kcm9wZG93bicsIHJlbGF0ZWRUYXJnZXQpKVxuXG4gICAgICBpZiAoZS5pc0RlZmF1bHRQcmV2ZW50ZWQoKSkgcmV0dXJuXG5cbiAgICAgICR0aGlzLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCAnZmFsc2UnKVxuICAgICAgJHBhcmVudC5yZW1vdmVDbGFzcygnb3BlbicpLnRyaWdnZXIoJC5FdmVudCgnaGlkZGVuLmJzLmRyb3Bkb3duJywgcmVsYXRlZFRhcmdldCkpXG4gICAgfSlcbiAgfVxuXG4gIERyb3Bkb3duLnByb3RvdHlwZS50b2dnbGUgPSBmdW5jdGlvbiAoZSkge1xuICAgIHZhciAkdGhpcyA9ICQodGhpcylcblxuICAgIGlmICgkdGhpcy5pcygnLmRpc2FibGVkLCA6ZGlzYWJsZWQnKSkgcmV0dXJuXG5cbiAgICB2YXIgJHBhcmVudCAgPSBnZXRQYXJlbnQoJHRoaXMpXG4gICAgdmFyIGlzQWN0aXZlID0gJHBhcmVudC5oYXNDbGFzcygnb3BlbicpXG5cbiAgICBjbGVhck1lbnVzKClcblxuICAgIGlmICghaXNBY3RpdmUpIHtcbiAgICAgIGlmICgnb250b3VjaHN0YXJ0JyBpbiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgJiYgISRwYXJlbnQuY2xvc2VzdCgnLm5hdmJhci1uYXYnKS5sZW5ndGgpIHtcbiAgICAgICAgLy8gaWYgbW9iaWxlIHdlIHVzZSBhIGJhY2tkcm9wIGJlY2F1c2UgY2xpY2sgZXZlbnRzIGRvbid0IGRlbGVnYXRlXG4gICAgICAgICQoZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JykpXG4gICAgICAgICAgLmFkZENsYXNzKCdkcm9wZG93bi1iYWNrZHJvcCcpXG4gICAgICAgICAgLmluc2VydEFmdGVyKCQodGhpcykpXG4gICAgICAgICAgLm9uKCdjbGljaycsIGNsZWFyTWVudXMpXG4gICAgICB9XG5cbiAgICAgIHZhciByZWxhdGVkVGFyZ2V0ID0geyByZWxhdGVkVGFyZ2V0OiB0aGlzIH1cbiAgICAgICRwYXJlbnQudHJpZ2dlcihlID0gJC5FdmVudCgnc2hvdy5icy5kcm9wZG93bicsIHJlbGF0ZWRUYXJnZXQpKVxuXG4gICAgICBpZiAoZS5pc0RlZmF1bHRQcmV2ZW50ZWQoKSkgcmV0dXJuXG5cbiAgICAgICR0aGlzXG4gICAgICAgIC50cmlnZ2VyKCdmb2N1cycpXG4gICAgICAgIC5hdHRyKCdhcmlhLWV4cGFuZGVkJywgJ3RydWUnKVxuXG4gICAgICAkcGFyZW50XG4gICAgICAgIC50b2dnbGVDbGFzcygnb3BlbicpXG4gICAgICAgIC50cmlnZ2VyKCQuRXZlbnQoJ3Nob3duLmJzLmRyb3Bkb3duJywgcmVsYXRlZFRhcmdldCkpXG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICBEcm9wZG93bi5wcm90b3R5cGUua2V5ZG93biA9IGZ1bmN0aW9uIChlKSB7XG4gICAgaWYgKCEvKDM4fDQwfDI3fDMyKS8udGVzdChlLndoaWNoKSB8fCAvaW5wdXR8dGV4dGFyZWEvaS50ZXN0KGUudGFyZ2V0LnRhZ05hbWUpKSByZXR1cm5cblxuICAgIHZhciAkdGhpcyA9ICQodGhpcylcblxuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcblxuICAgIGlmICgkdGhpcy5pcygnLmRpc2FibGVkLCA6ZGlzYWJsZWQnKSkgcmV0dXJuXG5cbiAgICB2YXIgJHBhcmVudCAgPSBnZXRQYXJlbnQoJHRoaXMpXG4gICAgdmFyIGlzQWN0aXZlID0gJHBhcmVudC5oYXNDbGFzcygnb3BlbicpXG5cbiAgICBpZiAoIWlzQWN0aXZlICYmIGUud2hpY2ggIT0gMjcgfHwgaXNBY3RpdmUgJiYgZS53aGljaCA9PSAyNykge1xuICAgICAgaWYgKGUud2hpY2ggPT0gMjcpICRwYXJlbnQuZmluZCh0b2dnbGUpLnRyaWdnZXIoJ2ZvY3VzJylcbiAgICAgIHJldHVybiAkdGhpcy50cmlnZ2VyKCdjbGljaycpXG4gICAgfVxuXG4gICAgdmFyIGRlc2MgPSAnIGxpOm5vdCguZGlzYWJsZWQpOnZpc2libGUgYSdcbiAgICB2YXIgJGl0ZW1zID0gJHBhcmVudC5maW5kKCcuZHJvcGRvd24tbWVudScgKyBkZXNjKVxuXG4gICAgaWYgKCEkaXRlbXMubGVuZ3RoKSByZXR1cm5cblxuICAgIHZhciBpbmRleCA9ICRpdGVtcy5pbmRleChlLnRhcmdldClcblxuICAgIGlmIChlLndoaWNoID09IDM4ICYmIGluZGV4ID4gMCkgICAgICAgICAgICAgICAgIGluZGV4LS0gICAgICAgICAvLyB1cFxuICAgIGlmIChlLndoaWNoID09IDQwICYmIGluZGV4IDwgJGl0ZW1zLmxlbmd0aCAtIDEpIGluZGV4KysgICAgICAgICAvLyBkb3duXG4gICAgaWYgKCF+aW5kZXgpICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXggPSAwXG5cbiAgICAkaXRlbXMuZXEoaW5kZXgpLnRyaWdnZXIoJ2ZvY3VzJylcbiAgfVxuXG5cbiAgLy8gRFJPUERPV04gUExVR0lOIERFRklOSVRJT05cbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICBmdW5jdGlvbiBQbHVnaW4ob3B0aW9uKSB7XG4gICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgJHRoaXMgPSAkKHRoaXMpXG4gICAgICB2YXIgZGF0YSAgPSAkdGhpcy5kYXRhKCdicy5kcm9wZG93bicpXG5cbiAgICAgIGlmICghZGF0YSkgJHRoaXMuZGF0YSgnYnMuZHJvcGRvd24nLCAoZGF0YSA9IG5ldyBEcm9wZG93bih0aGlzKSkpXG4gICAgICBpZiAodHlwZW9mIG9wdGlvbiA9PSAnc3RyaW5nJykgZGF0YVtvcHRpb25dLmNhbGwoJHRoaXMpXG4gICAgfSlcbiAgfVxuXG4gIHZhciBvbGQgPSAkLmZuLmRyb3Bkb3duXG5cbiAgJC5mbi5kcm9wZG93biAgICAgICAgICAgICA9IFBsdWdpblxuICAkLmZuLmRyb3Bkb3duLkNvbnN0cnVjdG9yID0gRHJvcGRvd25cblxuXG4gIC8vIERST1BET1dOIE5PIENPTkZMSUNUXG4gIC8vID09PT09PT09PT09PT09PT09PT09XG5cbiAgJC5mbi5kcm9wZG93bi5ub0NvbmZsaWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICQuZm4uZHJvcGRvd24gPSBvbGRcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cblxuICAvLyBBUFBMWSBUTyBTVEFOREFSRCBEUk9QRE9XTiBFTEVNRU5UU1xuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gICQoZG9jdW1lbnQpXG4gICAgLm9uKCdjbGljay5icy5kcm9wZG93bi5kYXRhLWFwaScsIGNsZWFyTWVudXMpXG4gICAgLm9uKCdjbGljay5icy5kcm9wZG93bi5kYXRhLWFwaScsICcuZHJvcGRvd24gZm9ybScsIGZ1bmN0aW9uIChlKSB7IGUuc3RvcFByb3BhZ2F0aW9uKCkgfSlcbiAgICAub24oJ2NsaWNrLmJzLmRyb3Bkb3duLmRhdGEtYXBpJywgdG9nZ2xlLCBEcm9wZG93bi5wcm90b3R5cGUudG9nZ2xlKVxuICAgIC5vbigna2V5ZG93bi5icy5kcm9wZG93bi5kYXRhLWFwaScsIHRvZ2dsZSwgRHJvcGRvd24ucHJvdG90eXBlLmtleWRvd24pXG4gICAgLm9uKCdrZXlkb3duLmJzLmRyb3Bkb3duLmRhdGEtYXBpJywgJy5kcm9wZG93bi1tZW51JywgRHJvcGRvd24ucHJvdG90eXBlLmtleWRvd24pXG5cbn0oalF1ZXJ5KTtcblxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBCb290c3RyYXA6IG1vZGFsLmpzIHYzLjQuMVxuICogaHR0cHM6Ly9nZXRib290c3RyYXAuY29tL2RvY3MvMy40L2phdmFzY3JpcHQvI21vZGFsc1xuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBDb3B5cmlnaHQgMjAxMS0yMDE5IFR3aXR0ZXIsIEluYy5cbiAqIExpY2Vuc2VkIHVuZGVyIE1JVCAoaHR0cHM6Ly9naXRodWIuY29tL3R3YnMvYm9vdHN0cmFwL2Jsb2IvbWFzdGVyL0xJQ0VOU0UpXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi9cblxuXG4rZnVuY3Rpb24gKCQpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIC8vIE1PREFMIENMQVNTIERFRklOSVRJT05cbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PVxuXG4gIHZhciBNb2RhbCA9IGZ1bmN0aW9uIChlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9uc1xuICAgIHRoaXMuJGJvZHkgPSAkKGRvY3VtZW50LmJvZHkpXG4gICAgdGhpcy4kZWxlbWVudCA9ICQoZWxlbWVudClcbiAgICB0aGlzLiRkaWFsb2cgPSB0aGlzLiRlbGVtZW50LmZpbmQoJy5tb2RhbC1kaWFsb2cnKVxuICAgIHRoaXMuJGJhY2tkcm9wID0gbnVsbFxuICAgIHRoaXMuaXNTaG93biA9IG51bGxcbiAgICB0aGlzLm9yaWdpbmFsQm9keVBhZCA9IG51bGxcbiAgICB0aGlzLnNjcm9sbGJhcldpZHRoID0gMFxuICAgIHRoaXMuaWdub3JlQmFja2Ryb3BDbGljayA9IGZhbHNlXG4gICAgdGhpcy5maXhlZENvbnRlbnQgPSAnLm5hdmJhci1maXhlZC10b3AsIC5uYXZiYXItZml4ZWQtYm90dG9tJ1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5yZW1vdGUpIHtcbiAgICAgIHRoaXMuJGVsZW1lbnRcbiAgICAgICAgLmZpbmQoJy5tb2RhbC1jb250ZW50JylcbiAgICAgICAgLmxvYWQodGhpcy5vcHRpb25zLnJlbW90ZSwgJC5wcm94eShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdsb2FkZWQuYnMubW9kYWwnKVxuICAgICAgICB9LCB0aGlzKSlcbiAgICB9XG4gIH1cblxuICBNb2RhbC5WRVJTSU9OID0gJzMuNC4xJ1xuXG4gIE1vZGFsLlRSQU5TSVRJT05fRFVSQVRJT04gPSAzMDBcbiAgTW9kYWwuQkFDS0RST1BfVFJBTlNJVElPTl9EVVJBVElPTiA9IDE1MFxuXG4gIE1vZGFsLkRFRkFVTFRTID0ge1xuICAgIGJhY2tkcm9wOiB0cnVlLFxuICAgIGtleWJvYXJkOiB0cnVlLFxuICAgIHNob3c6IHRydWVcbiAgfVxuXG4gIE1vZGFsLnByb3RvdHlwZS50b2dnbGUgPSBmdW5jdGlvbiAoX3JlbGF0ZWRUYXJnZXQpIHtcbiAgICByZXR1cm4gdGhpcy5pc1Nob3duID8gdGhpcy5oaWRlKCkgOiB0aGlzLnNob3coX3JlbGF0ZWRUYXJnZXQpXG4gIH1cblxuICBNb2RhbC5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIChfcmVsYXRlZFRhcmdldCkge1xuICAgIHZhciB0aGF0ID0gdGhpc1xuICAgIHZhciBlID0gJC5FdmVudCgnc2hvdy5icy5tb2RhbCcsIHsgcmVsYXRlZFRhcmdldDogX3JlbGF0ZWRUYXJnZXQgfSlcblxuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcihlKVxuXG4gICAgaWYgKHRoaXMuaXNTaG93biB8fCBlLmlzRGVmYXVsdFByZXZlbnRlZCgpKSByZXR1cm5cblxuICAgIHRoaXMuaXNTaG93biA9IHRydWVcblxuICAgIHRoaXMuY2hlY2tTY3JvbGxiYXIoKVxuICAgIHRoaXMuc2V0U2Nyb2xsYmFyKClcbiAgICB0aGlzLiRib2R5LmFkZENsYXNzKCdtb2RhbC1vcGVuJylcblxuICAgIHRoaXMuZXNjYXBlKClcbiAgICB0aGlzLnJlc2l6ZSgpXG5cbiAgICB0aGlzLiRlbGVtZW50Lm9uKCdjbGljay5kaXNtaXNzLmJzLm1vZGFsJywgJ1tkYXRhLWRpc21pc3M9XCJtb2RhbFwiXScsICQucHJveHkodGhpcy5oaWRlLCB0aGlzKSlcblxuICAgIHRoaXMuJGRpYWxvZy5vbignbW91c2Vkb3duLmRpc21pc3MuYnMubW9kYWwnLCBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGF0LiRlbGVtZW50Lm9uZSgnbW91c2V1cC5kaXNtaXNzLmJzLm1vZGFsJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgaWYgKCQoZS50YXJnZXQpLmlzKHRoYXQuJGVsZW1lbnQpKSB0aGF0Lmlnbm9yZUJhY2tkcm9wQ2xpY2sgPSB0cnVlXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICB0aGlzLmJhY2tkcm9wKGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciB0cmFuc2l0aW9uID0gJC5zdXBwb3J0LnRyYW5zaXRpb24gJiYgdGhhdC4kZWxlbWVudC5oYXNDbGFzcygnZmFkZScpXG5cbiAgICAgIGlmICghdGhhdC4kZWxlbWVudC5wYXJlbnQoKS5sZW5ndGgpIHtcbiAgICAgICAgdGhhdC4kZWxlbWVudC5hcHBlbmRUbyh0aGF0LiRib2R5KSAvLyBkb24ndCBtb3ZlIG1vZGFscyBkb20gcG9zaXRpb25cbiAgICAgIH1cblxuICAgICAgdGhhdC4kZWxlbWVudFxuICAgICAgICAuc2hvdygpXG4gICAgICAgIC5zY3JvbGxUb3AoMClcblxuICAgICAgdGhhdC5hZGp1c3REaWFsb2coKVxuXG4gICAgICBpZiAodHJhbnNpdGlvbikge1xuICAgICAgICB0aGF0LiRlbGVtZW50WzBdLm9mZnNldFdpZHRoIC8vIGZvcmNlIHJlZmxvd1xuICAgICAgfVxuXG4gICAgICB0aGF0LiRlbGVtZW50LmFkZENsYXNzKCdpbicpXG5cbiAgICAgIHRoYXQuZW5mb3JjZUZvY3VzKClcblxuICAgICAgdmFyIGUgPSAkLkV2ZW50KCdzaG93bi5icy5tb2RhbCcsIHsgcmVsYXRlZFRhcmdldDogX3JlbGF0ZWRUYXJnZXQgfSlcblxuICAgICAgdHJhbnNpdGlvbiA/XG4gICAgICAgIHRoYXQuJGRpYWxvZyAvLyB3YWl0IGZvciBtb2RhbCB0byBzbGlkZSBpblxuICAgICAgICAgIC5vbmUoJ2JzVHJhbnNpdGlvbkVuZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoYXQuJGVsZW1lbnQudHJpZ2dlcignZm9jdXMnKS50cmlnZ2VyKGUpXG4gICAgICAgICAgfSlcbiAgICAgICAgICAuZW11bGF0ZVRyYW5zaXRpb25FbmQoTW9kYWwuVFJBTlNJVElPTl9EVVJBVElPTikgOlxuICAgICAgICB0aGF0LiRlbGVtZW50LnRyaWdnZXIoJ2ZvY3VzJykudHJpZ2dlcihlKVxuICAgIH0pXG4gIH1cblxuICBNb2RhbC5wcm90b3R5cGUuaGlkZSA9IGZ1bmN0aW9uIChlKSB7XG4gICAgaWYgKGUpIGUucHJldmVudERlZmF1bHQoKVxuXG4gICAgZSA9ICQuRXZlbnQoJ2hpZGUuYnMubW9kYWwnKVxuXG4gICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKGUpXG5cbiAgICBpZiAoIXRoaXMuaXNTaG93biB8fCBlLmlzRGVmYXVsdFByZXZlbnRlZCgpKSByZXR1cm5cblxuICAgIHRoaXMuaXNTaG93biA9IGZhbHNlXG5cbiAgICB0aGlzLmVzY2FwZSgpXG4gICAgdGhpcy5yZXNpemUoKVxuXG4gICAgJChkb2N1bWVudCkub2ZmKCdmb2N1c2luLmJzLm1vZGFsJylcblxuICAgIHRoaXMuJGVsZW1lbnRcbiAgICAgIC5yZW1vdmVDbGFzcygnaW4nKVxuICAgICAgLm9mZignY2xpY2suZGlzbWlzcy5icy5tb2RhbCcpXG4gICAgICAub2ZmKCdtb3VzZXVwLmRpc21pc3MuYnMubW9kYWwnKVxuXG4gICAgdGhpcy4kZGlhbG9nLm9mZignbW91c2Vkb3duLmRpc21pc3MuYnMubW9kYWwnKVxuXG4gICAgJC5zdXBwb3J0LnRyYW5zaXRpb24gJiYgdGhpcy4kZWxlbWVudC5oYXNDbGFzcygnZmFkZScpID9cbiAgICAgIHRoaXMuJGVsZW1lbnRcbiAgICAgICAgLm9uZSgnYnNUcmFuc2l0aW9uRW5kJywgJC5wcm94eSh0aGlzLmhpZGVNb2RhbCwgdGhpcykpXG4gICAgICAgIC5lbXVsYXRlVHJhbnNpdGlvbkVuZChNb2RhbC5UUkFOU0lUSU9OX0RVUkFUSU9OKSA6XG4gICAgICB0aGlzLmhpZGVNb2RhbCgpXG4gIH1cblxuICBNb2RhbC5wcm90b3R5cGUuZW5mb3JjZUZvY3VzID0gZnVuY3Rpb24gKCkge1xuICAgICQoZG9jdW1lbnQpXG4gICAgICAub2ZmKCdmb2N1c2luLmJzLm1vZGFsJykgLy8gZ3VhcmQgYWdhaW5zdCBpbmZpbml0ZSBmb2N1cyBsb29wXG4gICAgICAub24oJ2ZvY3VzaW4uYnMubW9kYWwnLCAkLnByb3h5KGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGlmIChkb2N1bWVudCAhPT0gZS50YXJnZXQgJiZcbiAgICAgICAgICB0aGlzLiRlbGVtZW50WzBdICE9PSBlLnRhcmdldCAmJlxuICAgICAgICAgICF0aGlzLiRlbGVtZW50LmhhcyhlLnRhcmdldCkubGVuZ3RoKSB7XG4gICAgICAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdmb2N1cycpXG4gICAgICAgIH1cbiAgICAgIH0sIHRoaXMpKVxuICB9XG5cbiAgTW9kYWwucHJvdG90eXBlLmVzY2FwZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5pc1Nob3duICYmIHRoaXMub3B0aW9ucy5rZXlib2FyZCkge1xuICAgICAgdGhpcy4kZWxlbWVudC5vbigna2V5ZG93bi5kaXNtaXNzLmJzLm1vZGFsJywgJC5wcm94eShmdW5jdGlvbiAoZSkge1xuICAgICAgICBlLndoaWNoID09IDI3ICYmIHRoaXMuaGlkZSgpXG4gICAgICB9LCB0aGlzKSlcbiAgICB9IGVsc2UgaWYgKCF0aGlzLmlzU2hvd24pIHtcbiAgICAgIHRoaXMuJGVsZW1lbnQub2ZmKCdrZXlkb3duLmRpc21pc3MuYnMubW9kYWwnKVxuICAgIH1cbiAgfVxuXG4gIE1vZGFsLnByb3RvdHlwZS5yZXNpemUgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMuaXNTaG93bikge1xuICAgICAgJCh3aW5kb3cpLm9uKCdyZXNpemUuYnMubW9kYWwnLCAkLnByb3h5KHRoaXMuaGFuZGxlVXBkYXRlLCB0aGlzKSlcbiAgICB9IGVsc2Uge1xuICAgICAgJCh3aW5kb3cpLm9mZigncmVzaXplLmJzLm1vZGFsJylcbiAgICB9XG4gIH1cblxuICBNb2RhbC5wcm90b3R5cGUuaGlkZU1vZGFsID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciB0aGF0ID0gdGhpc1xuICAgIHRoaXMuJGVsZW1lbnQuaGlkZSgpXG4gICAgdGhpcy5iYWNrZHJvcChmdW5jdGlvbiAoKSB7XG4gICAgICB0aGF0LiRib2R5LnJlbW92ZUNsYXNzKCdtb2RhbC1vcGVuJylcbiAgICAgIHRoYXQucmVzZXRBZGp1c3RtZW50cygpXG4gICAgICB0aGF0LnJlc2V0U2Nyb2xsYmFyKClcbiAgICAgIHRoYXQuJGVsZW1lbnQudHJpZ2dlcignaGlkZGVuLmJzLm1vZGFsJylcbiAgICB9KVxuICB9XG5cbiAgTW9kYWwucHJvdG90eXBlLnJlbW92ZUJhY2tkcm9wID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuJGJhY2tkcm9wICYmIHRoaXMuJGJhY2tkcm9wLnJlbW92ZSgpXG4gICAgdGhpcy4kYmFja2Ryb3AgPSBudWxsXG4gIH1cblxuICBNb2RhbC5wcm90b3R5cGUuYmFja2Ryb3AgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICB2YXIgdGhhdCA9IHRoaXNcbiAgICB2YXIgYW5pbWF0ZSA9IHRoaXMuJGVsZW1lbnQuaGFzQ2xhc3MoJ2ZhZGUnKSA/ICdmYWRlJyA6ICcnXG5cbiAgICBpZiAodGhpcy5pc1Nob3duICYmIHRoaXMub3B0aW9ucy5iYWNrZHJvcCkge1xuICAgICAgdmFyIGRvQW5pbWF0ZSA9ICQuc3VwcG9ydC50cmFuc2l0aW9uICYmIGFuaW1hdGVcblxuICAgICAgdGhpcy4kYmFja2Ryb3AgPSAkKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpKVxuICAgICAgICAuYWRkQ2xhc3MoJ21vZGFsLWJhY2tkcm9wICcgKyBhbmltYXRlKVxuICAgICAgICAuYXBwZW5kVG8odGhpcy4kYm9keSlcblxuICAgICAgdGhpcy4kZWxlbWVudC5vbignY2xpY2suZGlzbWlzcy5icy5tb2RhbCcsICQucHJveHkoZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgaWYgKHRoaXMuaWdub3JlQmFja2Ryb3BDbGljaykge1xuICAgICAgICAgIHRoaXMuaWdub3JlQmFja2Ryb3BDbGljayA9IGZhbHNlXG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgaWYgKGUudGFyZ2V0ICE9PSBlLmN1cnJlbnRUYXJnZXQpIHJldHVyblxuICAgICAgICB0aGlzLm9wdGlvbnMuYmFja2Ryb3AgPT0gJ3N0YXRpYydcbiAgICAgICAgICA/IHRoaXMuJGVsZW1lbnRbMF0uZm9jdXMoKVxuICAgICAgICAgIDogdGhpcy5oaWRlKClcbiAgICAgIH0sIHRoaXMpKVxuXG4gICAgICBpZiAoZG9BbmltYXRlKSB0aGlzLiRiYWNrZHJvcFswXS5vZmZzZXRXaWR0aCAvLyBmb3JjZSByZWZsb3dcblxuICAgICAgdGhpcy4kYmFja2Ryb3AuYWRkQ2xhc3MoJ2luJylcblxuICAgICAgaWYgKCFjYWxsYmFjaykgcmV0dXJuXG5cbiAgICAgIGRvQW5pbWF0ZSA/XG4gICAgICAgIHRoaXMuJGJhY2tkcm9wXG4gICAgICAgICAgLm9uZSgnYnNUcmFuc2l0aW9uRW5kJywgY2FsbGJhY2spXG4gICAgICAgICAgLmVtdWxhdGVUcmFuc2l0aW9uRW5kKE1vZGFsLkJBQ0tEUk9QX1RSQU5TSVRJT05fRFVSQVRJT04pIDpcbiAgICAgICAgY2FsbGJhY2soKVxuXG4gICAgfSBlbHNlIGlmICghdGhpcy5pc1Nob3duICYmIHRoaXMuJGJhY2tkcm9wKSB7XG4gICAgICB0aGlzLiRiYWNrZHJvcC5yZW1vdmVDbGFzcygnaW4nKVxuXG4gICAgICB2YXIgY2FsbGJhY2tSZW1vdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoYXQucmVtb3ZlQmFja2Ryb3AoKVxuICAgICAgICBjYWxsYmFjayAmJiBjYWxsYmFjaygpXG4gICAgICB9XG4gICAgICAkLnN1cHBvcnQudHJhbnNpdGlvbiAmJiB0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKCdmYWRlJykgP1xuICAgICAgICB0aGlzLiRiYWNrZHJvcFxuICAgICAgICAgIC5vbmUoJ2JzVHJhbnNpdGlvbkVuZCcsIGNhbGxiYWNrUmVtb3ZlKVxuICAgICAgICAgIC5lbXVsYXRlVHJhbnNpdGlvbkVuZChNb2RhbC5CQUNLRFJPUF9UUkFOU0lUSU9OX0RVUkFUSU9OKSA6XG4gICAgICAgIGNhbGxiYWNrUmVtb3ZlKClcblxuICAgIH0gZWxzZSBpZiAoY2FsbGJhY2spIHtcbiAgICAgIGNhbGxiYWNrKClcbiAgICB9XG4gIH1cblxuICAvLyB0aGVzZSBmb2xsb3dpbmcgbWV0aG9kcyBhcmUgdXNlZCB0byBoYW5kbGUgb3ZlcmZsb3dpbmcgbW9kYWxzXG5cbiAgTW9kYWwucHJvdG90eXBlLmhhbmRsZVVwZGF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmFkanVzdERpYWxvZygpXG4gIH1cblxuICBNb2RhbC5wcm90b3R5cGUuYWRqdXN0RGlhbG9nID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBtb2RhbElzT3ZlcmZsb3dpbmcgPSB0aGlzLiRlbGVtZW50WzBdLnNjcm9sbEhlaWdodCA+IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHRcblxuICAgIHRoaXMuJGVsZW1lbnQuY3NzKHtcbiAgICAgIHBhZGRpbmdMZWZ0OiAhdGhpcy5ib2R5SXNPdmVyZmxvd2luZyAmJiBtb2RhbElzT3ZlcmZsb3dpbmcgPyB0aGlzLnNjcm9sbGJhcldpZHRoIDogJycsXG4gICAgICBwYWRkaW5nUmlnaHQ6IHRoaXMuYm9keUlzT3ZlcmZsb3dpbmcgJiYgIW1vZGFsSXNPdmVyZmxvd2luZyA/IHRoaXMuc2Nyb2xsYmFyV2lkdGggOiAnJ1xuICAgIH0pXG4gIH1cblxuICBNb2RhbC5wcm90b3R5cGUucmVzZXRBZGp1c3RtZW50cyA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLiRlbGVtZW50LmNzcyh7XG4gICAgICBwYWRkaW5nTGVmdDogJycsXG4gICAgICBwYWRkaW5nUmlnaHQ6ICcnXG4gICAgfSlcbiAgfVxuXG4gIE1vZGFsLnByb3RvdHlwZS5jaGVja1Njcm9sbGJhciA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZnVsbFdpbmRvd1dpZHRoID0gd2luZG93LmlubmVyV2lkdGhcbiAgICBpZiAoIWZ1bGxXaW5kb3dXaWR0aCkgeyAvLyB3b3JrYXJvdW5kIGZvciBtaXNzaW5nIHdpbmRvdy5pbm5lcldpZHRoIGluIElFOFxuICAgICAgdmFyIGRvY3VtZW50RWxlbWVudFJlY3QgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgIGZ1bGxXaW5kb3dXaWR0aCA9IGRvY3VtZW50RWxlbWVudFJlY3QucmlnaHQgLSBNYXRoLmFicyhkb2N1bWVudEVsZW1lbnRSZWN0LmxlZnQpXG4gICAgfVxuICAgIHRoaXMuYm9keUlzT3ZlcmZsb3dpbmcgPSBkb2N1bWVudC5ib2R5LmNsaWVudFdpZHRoIDwgZnVsbFdpbmRvd1dpZHRoXG4gICAgdGhpcy5zY3JvbGxiYXJXaWR0aCA9IHRoaXMubWVhc3VyZVNjcm9sbGJhcigpXG4gIH1cblxuICBNb2RhbC5wcm90b3R5cGUuc2V0U2Nyb2xsYmFyID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBib2R5UGFkID0gcGFyc2VJbnQoKHRoaXMuJGJvZHkuY3NzKCdwYWRkaW5nLXJpZ2h0JykgfHwgMCksIDEwKVxuICAgIHRoaXMub3JpZ2luYWxCb2R5UGFkID0gZG9jdW1lbnQuYm9keS5zdHlsZS5wYWRkaW5nUmlnaHQgfHwgJydcbiAgICB2YXIgc2Nyb2xsYmFyV2lkdGggPSB0aGlzLnNjcm9sbGJhcldpZHRoXG4gICAgaWYgKHRoaXMuYm9keUlzT3ZlcmZsb3dpbmcpIHtcbiAgICAgIHRoaXMuJGJvZHkuY3NzKCdwYWRkaW5nLXJpZ2h0JywgYm9keVBhZCArIHNjcm9sbGJhcldpZHRoKVxuICAgICAgJCh0aGlzLmZpeGVkQ29udGVudCkuZWFjaChmdW5jdGlvbiAoaW5kZXgsIGVsZW1lbnQpIHtcbiAgICAgICAgdmFyIGFjdHVhbFBhZGRpbmcgPSBlbGVtZW50LnN0eWxlLnBhZGRpbmdSaWdodFxuICAgICAgICB2YXIgY2FsY3VsYXRlZFBhZGRpbmcgPSAkKGVsZW1lbnQpLmNzcygncGFkZGluZy1yaWdodCcpXG4gICAgICAgICQoZWxlbWVudClcbiAgICAgICAgICAuZGF0YSgncGFkZGluZy1yaWdodCcsIGFjdHVhbFBhZGRpbmcpXG4gICAgICAgICAgLmNzcygncGFkZGluZy1yaWdodCcsIHBhcnNlRmxvYXQoY2FsY3VsYXRlZFBhZGRpbmcpICsgc2Nyb2xsYmFyV2lkdGggKyAncHgnKVxuICAgICAgfSlcbiAgICB9XG4gIH1cblxuICBNb2RhbC5wcm90b3R5cGUucmVzZXRTY3JvbGxiYXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy4kYm9keS5jc3MoJ3BhZGRpbmctcmlnaHQnLCB0aGlzLm9yaWdpbmFsQm9keVBhZClcbiAgICAkKHRoaXMuZml4ZWRDb250ZW50KS5lYWNoKGZ1bmN0aW9uIChpbmRleCwgZWxlbWVudCkge1xuICAgICAgdmFyIHBhZGRpbmcgPSAkKGVsZW1lbnQpLmRhdGEoJ3BhZGRpbmctcmlnaHQnKVxuICAgICAgJChlbGVtZW50KS5yZW1vdmVEYXRhKCdwYWRkaW5nLXJpZ2h0JylcbiAgICAgIGVsZW1lbnQuc3R5bGUucGFkZGluZ1JpZ2h0ID0gcGFkZGluZyA/IHBhZGRpbmcgOiAnJ1xuICAgIH0pXG4gIH1cblxuICBNb2RhbC5wcm90b3R5cGUubWVhc3VyZVNjcm9sbGJhciA9IGZ1bmN0aW9uICgpIHsgLy8gdGh4IHdhbHNoXG4gICAgdmFyIHNjcm9sbERpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgc2Nyb2xsRGl2LmNsYXNzTmFtZSA9ICdtb2RhbC1zY3JvbGxiYXItbWVhc3VyZSdcbiAgICB0aGlzLiRib2R5LmFwcGVuZChzY3JvbGxEaXYpXG4gICAgdmFyIHNjcm9sbGJhcldpZHRoID0gc2Nyb2xsRGl2Lm9mZnNldFdpZHRoIC0gc2Nyb2xsRGl2LmNsaWVudFdpZHRoXG4gICAgdGhpcy4kYm9keVswXS5yZW1vdmVDaGlsZChzY3JvbGxEaXYpXG4gICAgcmV0dXJuIHNjcm9sbGJhcldpZHRoXG4gIH1cblxuXG4gIC8vIE1PREFMIFBMVUdJTiBERUZJTklUSU9OXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgZnVuY3Rpb24gUGx1Z2luKG9wdGlvbiwgX3JlbGF0ZWRUYXJnZXQpIHtcbiAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciAkdGhpcyA9ICQodGhpcylcbiAgICAgIHZhciBkYXRhID0gJHRoaXMuZGF0YSgnYnMubW9kYWwnKVxuICAgICAgdmFyIG9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgTW9kYWwuREVGQVVMVFMsICR0aGlzLmRhdGEoKSwgdHlwZW9mIG9wdGlvbiA9PSAnb2JqZWN0JyAmJiBvcHRpb24pXG5cbiAgICAgIGlmICghZGF0YSkgJHRoaXMuZGF0YSgnYnMubW9kYWwnLCAoZGF0YSA9IG5ldyBNb2RhbCh0aGlzLCBvcHRpb25zKSkpXG4gICAgICBpZiAodHlwZW9mIG9wdGlvbiA9PSAnc3RyaW5nJykgZGF0YVtvcHRpb25dKF9yZWxhdGVkVGFyZ2V0KVxuICAgICAgZWxzZSBpZiAob3B0aW9ucy5zaG93KSBkYXRhLnNob3coX3JlbGF0ZWRUYXJnZXQpXG4gICAgfSlcbiAgfVxuXG4gIHZhciBvbGQgPSAkLmZuLm1vZGFsXG5cbiAgJC5mbi5tb2RhbCA9IFBsdWdpblxuICAkLmZuLm1vZGFsLkNvbnN0cnVjdG9yID0gTW9kYWxcblxuXG4gIC8vIE1PREFMIE5PIENPTkZMSUNUXG4gIC8vID09PT09PT09PT09PT09PT09XG5cbiAgJC5mbi5tb2RhbC5ub0NvbmZsaWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICQuZm4ubW9kYWwgPSBvbGRcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cblxuICAvLyBNT0RBTCBEQVRBLUFQSVxuICAvLyA9PT09PT09PT09PT09PVxuXG4gICQoZG9jdW1lbnQpLm9uKCdjbGljay5icy5tb2RhbC5kYXRhLWFwaScsICdbZGF0YS10b2dnbGU9XCJtb2RhbFwiXScsIGZ1bmN0aW9uIChlKSB7XG4gICAgdmFyICR0aGlzID0gJCh0aGlzKVxuICAgIHZhciBocmVmID0gJHRoaXMuYXR0cignaHJlZicpXG4gICAgdmFyIHRhcmdldCA9ICR0aGlzLmF0dHIoJ2RhdGEtdGFyZ2V0JykgfHxcbiAgICAgIChocmVmICYmIGhyZWYucmVwbGFjZSgvLiooPz0jW15cXHNdKyQpLywgJycpKSAvLyBzdHJpcCBmb3IgaWU3XG5cbiAgICB2YXIgJHRhcmdldCA9ICQoZG9jdW1lbnQpLmZpbmQodGFyZ2V0KVxuICAgIHZhciBvcHRpb24gPSAkdGFyZ2V0LmRhdGEoJ2JzLm1vZGFsJykgPyAndG9nZ2xlJyA6ICQuZXh0ZW5kKHsgcmVtb3RlOiAhLyMvLnRlc3QoaHJlZikgJiYgaHJlZiB9LCAkdGFyZ2V0LmRhdGEoKSwgJHRoaXMuZGF0YSgpKVxuXG4gICAgaWYgKCR0aGlzLmlzKCdhJykpIGUucHJldmVudERlZmF1bHQoKVxuXG4gICAgJHRhcmdldC5vbmUoJ3Nob3cuYnMubW9kYWwnLCBmdW5jdGlvbiAoc2hvd0V2ZW50KSB7XG4gICAgICBpZiAoc2hvd0V2ZW50LmlzRGVmYXVsdFByZXZlbnRlZCgpKSByZXR1cm4gLy8gb25seSByZWdpc3RlciBmb2N1cyByZXN0b3JlciBpZiBtb2RhbCB3aWxsIGFjdHVhbGx5IGdldCBzaG93blxuICAgICAgJHRhcmdldC5vbmUoJ2hpZGRlbi5icy5tb2RhbCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJHRoaXMuaXMoJzp2aXNpYmxlJykgJiYgJHRoaXMudHJpZ2dlcignZm9jdXMnKVxuICAgICAgfSlcbiAgICB9KVxuICAgIFBsdWdpbi5jYWxsKCR0YXJnZXQsIG9wdGlvbiwgdGhpcylcbiAgfSlcblxufShqUXVlcnkpO1xuXG4vKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIEJvb3RzdHJhcDogdG9vbHRpcC5qcyB2My40LjFcbiAqIGh0dHBzOi8vZ2V0Ym9vdHN0cmFwLmNvbS9kb2NzLzMuNC9qYXZhc2NyaXB0LyN0b29sdGlwXG4gKiBJbnNwaXJlZCBieSB0aGUgb3JpZ2luYWwgalF1ZXJ5LnRpcHN5IGJ5IEphc29uIEZyYW1lXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIENvcHlyaWdodCAyMDExLTIwMTkgVHdpdHRlciwgSW5jLlxuICogTGljZW5zZWQgdW5kZXIgTUlUIChodHRwczovL2dpdGh1Yi5jb20vdHdicy9ib290c3RyYXAvYmxvYi9tYXN0ZXIvTElDRU5TRSlcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqL1xuXG4rZnVuY3Rpb24gKCQpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIHZhciBESVNBTExPV0VEX0FUVFJJQlVURVMgPSBbJ3Nhbml0aXplJywgJ3doaXRlTGlzdCcsICdzYW5pdGl6ZUZuJ11cblxuICB2YXIgdXJpQXR0cnMgPSBbXG4gICAgJ2JhY2tncm91bmQnLFxuICAgICdjaXRlJyxcbiAgICAnaHJlZicsXG4gICAgJ2l0ZW10eXBlJyxcbiAgICAnbG9uZ2Rlc2MnLFxuICAgICdwb3N0ZXInLFxuICAgICdzcmMnLFxuICAgICd4bGluazpocmVmJ1xuICBdXG5cbiAgdmFyIEFSSUFfQVRUUklCVVRFX1BBVFRFUk4gPSAvXmFyaWEtW1xcdy1dKiQvaVxuXG4gIHZhciBEZWZhdWx0V2hpdGVsaXN0ID0ge1xuICAgIC8vIEdsb2JhbCBhdHRyaWJ1dGVzIGFsbG93ZWQgb24gYW55IHN1cHBsaWVkIGVsZW1lbnQgYmVsb3cuXG4gICAgJyonOiBbJ2NsYXNzJywgJ2RpcicsICdpZCcsICdsYW5nJywgJ3JvbGUnLCBBUklBX0FUVFJJQlVURV9QQVRURVJOXSxcbiAgICBhOiBbJ3RhcmdldCcsICdocmVmJywgJ3RpdGxlJywgJ3JlbCddLFxuICAgIGFyZWE6IFtdLFxuICAgIGI6IFtdLFxuICAgIGJyOiBbXSxcbiAgICBjb2w6IFtdLFxuICAgIGNvZGU6IFtdLFxuICAgIGRpdjogW10sXG4gICAgZW06IFtdLFxuICAgIGhyOiBbXSxcbiAgICBoMTogW10sXG4gICAgaDI6IFtdLFxuICAgIGgzOiBbXSxcbiAgICBoNDogW10sXG4gICAgaDU6IFtdLFxuICAgIGg2OiBbXSxcbiAgICBpOiBbXSxcbiAgICBpbWc6IFsnc3JjJywgJ2FsdCcsICd0aXRsZScsICd3aWR0aCcsICdoZWlnaHQnXSxcbiAgICBsaTogW10sXG4gICAgb2w6IFtdLFxuICAgIHA6IFtdLFxuICAgIHByZTogW10sXG4gICAgczogW10sXG4gICAgc21hbGw6IFtdLFxuICAgIHNwYW46IFtdLFxuICAgIHN1YjogW10sXG4gICAgc3VwOiBbXSxcbiAgICBzdHJvbmc6IFtdLFxuICAgIHU6IFtdLFxuICAgIHVsOiBbXVxuICB9XG5cbiAgLyoqXG4gICAqIEEgcGF0dGVybiB0aGF0IHJlY29nbml6ZXMgYSBjb21tb25seSB1c2VmdWwgc3Vic2V0IG9mIFVSTHMgdGhhdCBhcmUgc2FmZS5cbiAgICpcbiAgICogU2hvdXRvdXQgdG8gQW5ndWxhciA3IGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2FuZ3VsYXIvYmxvYi83LjIuNC9wYWNrYWdlcy9jb3JlL3NyYy9zYW5pdGl6YXRpb24vdXJsX3Nhbml0aXplci50c1xuICAgKi9cbiAgdmFyIFNBRkVfVVJMX1BBVFRFUk4gPSAvXig/Oig/Omh0dHBzP3xtYWlsdG98ZnRwfHRlbHxmaWxlKTp8W14mOi8/I10qKD86Wy8/I118JCkpL2dpXG5cbiAgLyoqXG4gICAqIEEgcGF0dGVybiB0aGF0IG1hdGNoZXMgc2FmZSBkYXRhIFVSTHMuIE9ubHkgbWF0Y2hlcyBpbWFnZSwgdmlkZW8gYW5kIGF1ZGlvIHR5cGVzLlxuICAgKlxuICAgKiBTaG91dG91dCB0byBBbmd1bGFyIDcgaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvYW5ndWxhci9ibG9iLzcuMi40L3BhY2thZ2VzL2NvcmUvc3JjL3Nhbml0aXphdGlvbi91cmxfc2FuaXRpemVyLnRzXG4gICAqL1xuICB2YXIgREFUQV9VUkxfUEFUVEVSTiA9IC9eZGF0YTooPzppbWFnZVxcLyg/OmJtcHxnaWZ8anBlZ3xqcGd8cG5nfHRpZmZ8d2VicCl8dmlkZW9cXC8oPzptcGVnfG1wNHxvZ2d8d2VibSl8YXVkaW9cXC8oPzptcDN8b2dhfG9nZ3xvcHVzKSk7YmFzZTY0LFthLXowLTkrL10rPSokL2lcblxuICBmdW5jdGlvbiBhbGxvd2VkQXR0cmlidXRlKGF0dHIsIGFsbG93ZWRBdHRyaWJ1dGVMaXN0KSB7XG4gICAgdmFyIGF0dHJOYW1lID0gYXR0ci5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpXG5cbiAgICBpZiAoJC5pbkFycmF5KGF0dHJOYW1lLCBhbGxvd2VkQXR0cmlidXRlTGlzdCkgIT09IC0xKSB7XG4gICAgICBpZiAoJC5pbkFycmF5KGF0dHJOYW1lLCB1cmlBdHRycykgIT09IC0xKSB7XG4gICAgICAgIHJldHVybiBCb29sZWFuKGF0dHIubm9kZVZhbHVlLm1hdGNoKFNBRkVfVVJMX1BBVFRFUk4pIHx8IGF0dHIubm9kZVZhbHVlLm1hdGNoKERBVEFfVVJMX1BBVFRFUk4pKVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cblxuICAgIHZhciByZWdFeHAgPSAkKGFsbG93ZWRBdHRyaWJ1dGVMaXN0KS5maWx0ZXIoZnVuY3Rpb24gKGluZGV4LCB2YWx1ZSkge1xuICAgICAgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgUmVnRXhwXG4gICAgfSlcblxuICAgIC8vIENoZWNrIGlmIGEgcmVndWxhciBleHByZXNzaW9uIHZhbGlkYXRlcyB0aGUgYXR0cmlidXRlLlxuICAgIGZvciAodmFyIGkgPSAwLCBsID0gcmVnRXhwLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgaWYgKGF0dHJOYW1lLm1hdGNoKHJlZ0V4cFtpXSkpIHtcbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIGZ1bmN0aW9uIHNhbml0aXplSHRtbCh1bnNhZmVIdG1sLCB3aGl0ZUxpc3QsIHNhbml0aXplRm4pIHtcbiAgICBpZiAodW5zYWZlSHRtbC5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiB1bnNhZmVIdG1sXG4gICAgfVxuXG4gICAgaWYgKHNhbml0aXplRm4gJiYgdHlwZW9mIHNhbml0aXplRm4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiBzYW5pdGl6ZUZuKHVuc2FmZUh0bWwpXG4gICAgfVxuXG4gICAgLy8gSUUgOCBhbmQgYmVsb3cgZG9uJ3Qgc3VwcG9ydCBjcmVhdGVIVE1MRG9jdW1lbnRcbiAgICBpZiAoIWRvY3VtZW50LmltcGxlbWVudGF0aW9uIHx8ICFkb2N1bWVudC5pbXBsZW1lbnRhdGlvbi5jcmVhdGVIVE1MRG9jdW1lbnQpIHtcbiAgICAgIHJldHVybiB1bnNhZmVIdG1sXG4gICAgfVxuXG4gICAgdmFyIGNyZWF0ZWREb2N1bWVudCA9IGRvY3VtZW50LmltcGxlbWVudGF0aW9uLmNyZWF0ZUhUTUxEb2N1bWVudCgnc2FuaXRpemF0aW9uJylcbiAgICBjcmVhdGVkRG9jdW1lbnQuYm9keS5pbm5lckhUTUwgPSB1bnNhZmVIdG1sXG5cbiAgICB2YXIgd2hpdGVsaXN0S2V5cyA9ICQubWFwKHdoaXRlTGlzdCwgZnVuY3Rpb24gKGVsLCBpKSB7IHJldHVybiBpIH0pXG4gICAgdmFyIGVsZW1lbnRzID0gJChjcmVhdGVkRG9jdW1lbnQuYm9keSkuZmluZCgnKicpXG5cbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gZWxlbWVudHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIHZhciBlbCA9IGVsZW1lbnRzW2ldXG4gICAgICB2YXIgZWxOYW1lID0gZWwubm9kZU5hbWUudG9Mb3dlckNhc2UoKVxuXG4gICAgICBpZiAoJC5pbkFycmF5KGVsTmFtZSwgd2hpdGVsaXN0S2V5cykgPT09IC0xKSB7XG4gICAgICAgIGVsLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoZWwpXG5cbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgdmFyIGF0dHJpYnV0ZUxpc3QgPSAkLm1hcChlbC5hdHRyaWJ1dGVzLCBmdW5jdGlvbiAoZWwpIHsgcmV0dXJuIGVsIH0pXG4gICAgICB2YXIgd2hpdGVsaXN0ZWRBdHRyaWJ1dGVzID0gW10uY29uY2F0KHdoaXRlTGlzdFsnKiddIHx8IFtdLCB3aGl0ZUxpc3RbZWxOYW1lXSB8fCBbXSlcblxuICAgICAgZm9yICh2YXIgaiA9IDAsIGxlbjIgPSBhdHRyaWJ1dGVMaXN0Lmxlbmd0aDsgaiA8IGxlbjI7IGorKykge1xuICAgICAgICBpZiAoIWFsbG93ZWRBdHRyaWJ1dGUoYXR0cmlidXRlTGlzdFtqXSwgd2hpdGVsaXN0ZWRBdHRyaWJ1dGVzKSkge1xuICAgICAgICAgIGVsLnJlbW92ZUF0dHJpYnV0ZShhdHRyaWJ1dGVMaXN0W2pdLm5vZGVOYW1lKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGNyZWF0ZWREb2N1bWVudC5ib2R5LmlubmVySFRNTFxuICB9XG5cbiAgLy8gVE9PTFRJUCBQVUJMSUMgQ0xBU1MgREVGSU5JVElPTlxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgdmFyIFRvb2x0aXAgPSBmdW5jdGlvbiAoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIHRoaXMudHlwZSAgICAgICA9IG51bGxcbiAgICB0aGlzLm9wdGlvbnMgICAgPSBudWxsXG4gICAgdGhpcy5lbmFibGVkICAgID0gbnVsbFxuICAgIHRoaXMudGltZW91dCAgICA9IG51bGxcbiAgICB0aGlzLmhvdmVyU3RhdGUgPSBudWxsXG4gICAgdGhpcy4kZWxlbWVudCAgID0gbnVsbFxuICAgIHRoaXMuaW5TdGF0ZSAgICA9IG51bGxcblxuICAgIHRoaXMuaW5pdCgndG9vbHRpcCcsIGVsZW1lbnQsIG9wdGlvbnMpXG4gIH1cblxuICBUb29sdGlwLlZFUlNJT04gID0gJzMuNC4xJ1xuXG4gIFRvb2x0aXAuVFJBTlNJVElPTl9EVVJBVElPTiA9IDE1MFxuXG4gIFRvb2x0aXAuREVGQVVMVFMgPSB7XG4gICAgYW5pbWF0aW9uOiB0cnVlLFxuICAgIHBsYWNlbWVudDogJ3RvcCcsXG4gICAgc2VsZWN0b3I6IGZhbHNlLFxuICAgIHRlbXBsYXRlOiAnPGRpdiBjbGFzcz1cInRvb2x0aXBcIiByb2xlPVwidG9vbHRpcFwiPjxkaXYgY2xhc3M9XCJ0b29sdGlwLWFycm93XCI+PC9kaXY+PGRpdiBjbGFzcz1cInRvb2x0aXAtaW5uZXJcIj48L2Rpdj48L2Rpdj4nLFxuICAgIHRyaWdnZXI6ICdob3ZlciBmb2N1cycsXG4gICAgdGl0bGU6ICcnLFxuICAgIGRlbGF5OiAwLFxuICAgIGh0bWw6IGZhbHNlLFxuICAgIGNvbnRhaW5lcjogZmFsc2UsXG4gICAgdmlld3BvcnQ6IHtcbiAgICAgIHNlbGVjdG9yOiAnYm9keScsXG4gICAgICBwYWRkaW5nOiAwXG4gICAgfSxcbiAgICBzYW5pdGl6ZSA6IHRydWUsXG4gICAgc2FuaXRpemVGbiA6IG51bGwsXG4gICAgd2hpdGVMaXN0IDogRGVmYXVsdFdoaXRlbGlzdFxuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uICh0eXBlLCBlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy5lbmFibGVkICAgPSB0cnVlXG4gICAgdGhpcy50eXBlICAgICAgPSB0eXBlXG4gICAgdGhpcy4kZWxlbWVudCAgPSAkKGVsZW1lbnQpXG4gICAgdGhpcy5vcHRpb25zICAgPSB0aGlzLmdldE9wdGlvbnMob3B0aW9ucylcbiAgICB0aGlzLiR2aWV3cG9ydCA9IHRoaXMub3B0aW9ucy52aWV3cG9ydCAmJiAkKGRvY3VtZW50KS5maW5kKCQuaXNGdW5jdGlvbih0aGlzLm9wdGlvbnMudmlld3BvcnQpID8gdGhpcy5vcHRpb25zLnZpZXdwb3J0LmNhbGwodGhpcywgdGhpcy4kZWxlbWVudCkgOiAodGhpcy5vcHRpb25zLnZpZXdwb3J0LnNlbGVjdG9yIHx8IHRoaXMub3B0aW9ucy52aWV3cG9ydCkpXG4gICAgdGhpcy5pblN0YXRlICAgPSB7IGNsaWNrOiBmYWxzZSwgaG92ZXI6IGZhbHNlLCBmb2N1czogZmFsc2UgfVxuXG4gICAgaWYgKHRoaXMuJGVsZW1lbnRbMF0gaW5zdGFuY2VvZiBkb2N1bWVudC5jb25zdHJ1Y3RvciAmJiAhdGhpcy5vcHRpb25zLnNlbGVjdG9yKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2BzZWxlY3RvcmAgb3B0aW9uIG11c3QgYmUgc3BlY2lmaWVkIHdoZW4gaW5pdGlhbGl6aW5nICcgKyB0aGlzLnR5cGUgKyAnIG9uIHRoZSB3aW5kb3cuZG9jdW1lbnQgb2JqZWN0IScpXG4gICAgfVxuXG4gICAgdmFyIHRyaWdnZXJzID0gdGhpcy5vcHRpb25zLnRyaWdnZXIuc3BsaXQoJyAnKVxuXG4gICAgZm9yICh2YXIgaSA9IHRyaWdnZXJzLmxlbmd0aDsgaS0tOykge1xuICAgICAgdmFyIHRyaWdnZXIgPSB0cmlnZ2Vyc1tpXVxuXG4gICAgICBpZiAodHJpZ2dlciA9PSAnY2xpY2snKSB7XG4gICAgICAgIHRoaXMuJGVsZW1lbnQub24oJ2NsaWNrLicgKyB0aGlzLnR5cGUsIHRoaXMub3B0aW9ucy5zZWxlY3RvciwgJC5wcm94eSh0aGlzLnRvZ2dsZSwgdGhpcykpXG4gICAgICB9IGVsc2UgaWYgKHRyaWdnZXIgIT0gJ21hbnVhbCcpIHtcbiAgICAgICAgdmFyIGV2ZW50SW4gID0gdHJpZ2dlciA9PSAnaG92ZXInID8gJ21vdXNlZW50ZXInIDogJ2ZvY3VzaW4nXG4gICAgICAgIHZhciBldmVudE91dCA9IHRyaWdnZXIgPT0gJ2hvdmVyJyA/ICdtb3VzZWxlYXZlJyA6ICdmb2N1c291dCdcblxuICAgICAgICB0aGlzLiRlbGVtZW50Lm9uKGV2ZW50SW4gICsgJy4nICsgdGhpcy50eXBlLCB0aGlzLm9wdGlvbnMuc2VsZWN0b3IsICQucHJveHkodGhpcy5lbnRlciwgdGhpcykpXG4gICAgICAgIHRoaXMuJGVsZW1lbnQub24oZXZlbnRPdXQgKyAnLicgKyB0aGlzLnR5cGUsIHRoaXMub3B0aW9ucy5zZWxlY3RvciwgJC5wcm94eSh0aGlzLmxlYXZlLCB0aGlzKSlcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLm9wdGlvbnMuc2VsZWN0b3IgP1xuICAgICAgKHRoaXMuX29wdGlvbnMgPSAkLmV4dGVuZCh7fSwgdGhpcy5vcHRpb25zLCB7IHRyaWdnZXI6ICdtYW51YWwnLCBzZWxlY3RvcjogJycgfSkpIDpcbiAgICAgIHRoaXMuZml4VGl0bGUoKVxuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUuZ2V0RGVmYXVsdHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIFRvb2x0aXAuREVGQVVMVFNcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLmdldE9wdGlvbnMgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIHZhciBkYXRhQXR0cmlidXRlcyA9IHRoaXMuJGVsZW1lbnQuZGF0YSgpXG5cbiAgICBmb3IgKHZhciBkYXRhQXR0ciBpbiBkYXRhQXR0cmlidXRlcykge1xuICAgICAgaWYgKGRhdGFBdHRyaWJ1dGVzLmhhc093blByb3BlcnR5KGRhdGFBdHRyKSAmJiAkLmluQXJyYXkoZGF0YUF0dHIsIERJU0FMTE9XRURfQVRUUklCVVRFUykgIT09IC0xKSB7XG4gICAgICAgIGRlbGV0ZSBkYXRhQXR0cmlidXRlc1tkYXRhQXR0cl1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBvcHRpb25zID0gJC5leHRlbmQoe30sIHRoaXMuZ2V0RGVmYXVsdHMoKSwgZGF0YUF0dHJpYnV0ZXMsIG9wdGlvbnMpXG5cbiAgICBpZiAob3B0aW9ucy5kZWxheSAmJiB0eXBlb2Ygb3B0aW9ucy5kZWxheSA9PSAnbnVtYmVyJykge1xuICAgICAgb3B0aW9ucy5kZWxheSA9IHtcbiAgICAgICAgc2hvdzogb3B0aW9ucy5kZWxheSxcbiAgICAgICAgaGlkZTogb3B0aW9ucy5kZWxheVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChvcHRpb25zLnNhbml0aXplKSB7XG4gICAgICBvcHRpb25zLnRlbXBsYXRlID0gc2FuaXRpemVIdG1sKG9wdGlvbnMudGVtcGxhdGUsIG9wdGlvbnMud2hpdGVMaXN0LCBvcHRpb25zLnNhbml0aXplRm4pXG4gICAgfVxuXG4gICAgcmV0dXJuIG9wdGlvbnNcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLmdldERlbGVnYXRlT3B0aW9ucyA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgb3B0aW9ucyAgPSB7fVxuICAgIHZhciBkZWZhdWx0cyA9IHRoaXMuZ2V0RGVmYXVsdHMoKVxuXG4gICAgdGhpcy5fb3B0aW9ucyAmJiAkLmVhY2godGhpcy5fb3B0aW9ucywgZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgIGlmIChkZWZhdWx0c1trZXldICE9IHZhbHVlKSBvcHRpb25zW2tleV0gPSB2YWx1ZVxuICAgIH0pXG5cbiAgICByZXR1cm4gb3B0aW9uc1xuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUuZW50ZXIgPSBmdW5jdGlvbiAob2JqKSB7XG4gICAgdmFyIHNlbGYgPSBvYmogaW5zdGFuY2VvZiB0aGlzLmNvbnN0cnVjdG9yID9cbiAgICAgIG9iaiA6ICQob2JqLmN1cnJlbnRUYXJnZXQpLmRhdGEoJ2JzLicgKyB0aGlzLnR5cGUpXG5cbiAgICBpZiAoIXNlbGYpIHtcbiAgICAgIHNlbGYgPSBuZXcgdGhpcy5jb25zdHJ1Y3RvcihvYmouY3VycmVudFRhcmdldCwgdGhpcy5nZXREZWxlZ2F0ZU9wdGlvbnMoKSlcbiAgICAgICQob2JqLmN1cnJlbnRUYXJnZXQpLmRhdGEoJ2JzLicgKyB0aGlzLnR5cGUsIHNlbGYpXG4gICAgfVxuXG4gICAgaWYgKG9iaiBpbnN0YW5jZW9mICQuRXZlbnQpIHtcbiAgICAgIHNlbGYuaW5TdGF0ZVtvYmoudHlwZSA9PSAnZm9jdXNpbicgPyAnZm9jdXMnIDogJ2hvdmVyJ10gPSB0cnVlXG4gICAgfVxuXG4gICAgaWYgKHNlbGYudGlwKCkuaGFzQ2xhc3MoJ2luJykgfHwgc2VsZi5ob3ZlclN0YXRlID09ICdpbicpIHtcbiAgICAgIHNlbGYuaG92ZXJTdGF0ZSA9ICdpbidcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNsZWFyVGltZW91dChzZWxmLnRpbWVvdXQpXG5cbiAgICBzZWxmLmhvdmVyU3RhdGUgPSAnaW4nXG5cbiAgICBpZiAoIXNlbGYub3B0aW9ucy5kZWxheSB8fCAhc2VsZi5vcHRpb25zLmRlbGF5LnNob3cpIHJldHVybiBzZWxmLnNob3coKVxuXG4gICAgc2VsZi50aW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAoc2VsZi5ob3ZlclN0YXRlID09ICdpbicpIHNlbGYuc2hvdygpXG4gICAgfSwgc2VsZi5vcHRpb25zLmRlbGF5LnNob3cpXG4gIH1cblxuICBUb29sdGlwLnByb3RvdHlwZS5pc0luU3RhdGVUcnVlID0gZnVuY3Rpb24gKCkge1xuICAgIGZvciAodmFyIGtleSBpbiB0aGlzLmluU3RhdGUpIHtcbiAgICAgIGlmICh0aGlzLmluU3RhdGVba2V5XSkgcmV0dXJuIHRydWVcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLmxlYXZlID0gZnVuY3Rpb24gKG9iaikge1xuICAgIHZhciBzZWxmID0gb2JqIGluc3RhbmNlb2YgdGhpcy5jb25zdHJ1Y3RvciA/XG4gICAgICBvYmogOiAkKG9iai5jdXJyZW50VGFyZ2V0KS5kYXRhKCdicy4nICsgdGhpcy50eXBlKVxuXG4gICAgaWYgKCFzZWxmKSB7XG4gICAgICBzZWxmID0gbmV3IHRoaXMuY29uc3RydWN0b3Iob2JqLmN1cnJlbnRUYXJnZXQsIHRoaXMuZ2V0RGVsZWdhdGVPcHRpb25zKCkpXG4gICAgICAkKG9iai5jdXJyZW50VGFyZ2V0KS5kYXRhKCdicy4nICsgdGhpcy50eXBlLCBzZWxmKVxuICAgIH1cblxuICAgIGlmIChvYmogaW5zdGFuY2VvZiAkLkV2ZW50KSB7XG4gICAgICBzZWxmLmluU3RhdGVbb2JqLnR5cGUgPT0gJ2ZvY3Vzb3V0JyA/ICdmb2N1cycgOiAnaG92ZXInXSA9IGZhbHNlXG4gICAgfVxuXG4gICAgaWYgKHNlbGYuaXNJblN0YXRlVHJ1ZSgpKSByZXR1cm5cblxuICAgIGNsZWFyVGltZW91dChzZWxmLnRpbWVvdXQpXG5cbiAgICBzZWxmLmhvdmVyU3RhdGUgPSAnb3V0J1xuXG4gICAgaWYgKCFzZWxmLm9wdGlvbnMuZGVsYXkgfHwgIXNlbGYub3B0aW9ucy5kZWxheS5oaWRlKSByZXR1cm4gc2VsZi5oaWRlKClcblxuICAgIHNlbGYudGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKHNlbGYuaG92ZXJTdGF0ZSA9PSAnb3V0Jykgc2VsZi5oaWRlKClcbiAgICB9LCBzZWxmLm9wdGlvbnMuZGVsYXkuaGlkZSlcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGUgPSAkLkV2ZW50KCdzaG93LmJzLicgKyB0aGlzLnR5cGUpXG5cbiAgICBpZiAodGhpcy5oYXNDb250ZW50KCkgJiYgdGhpcy5lbmFibGVkKSB7XG4gICAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoZSlcblxuICAgICAgdmFyIGluRG9tID0gJC5jb250YWlucyh0aGlzLiRlbGVtZW50WzBdLm93bmVyRG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LCB0aGlzLiRlbGVtZW50WzBdKVxuICAgICAgaWYgKGUuaXNEZWZhdWx0UHJldmVudGVkKCkgfHwgIWluRG9tKSByZXR1cm5cbiAgICAgIHZhciB0aGF0ID0gdGhpc1xuXG4gICAgICB2YXIgJHRpcCA9IHRoaXMudGlwKClcblxuICAgICAgdmFyIHRpcElkID0gdGhpcy5nZXRVSUQodGhpcy50eXBlKVxuXG4gICAgICB0aGlzLnNldENvbnRlbnQoKVxuICAgICAgJHRpcC5hdHRyKCdpZCcsIHRpcElkKVxuICAgICAgdGhpcy4kZWxlbWVudC5hdHRyKCdhcmlhLWRlc2NyaWJlZGJ5JywgdGlwSWQpXG5cbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuYW5pbWF0aW9uKSAkdGlwLmFkZENsYXNzKCdmYWRlJylcblxuICAgICAgdmFyIHBsYWNlbWVudCA9IHR5cGVvZiB0aGlzLm9wdGlvbnMucGxhY2VtZW50ID09ICdmdW5jdGlvbicgP1xuICAgICAgICB0aGlzLm9wdGlvbnMucGxhY2VtZW50LmNhbGwodGhpcywgJHRpcFswXSwgdGhpcy4kZWxlbWVudFswXSkgOlxuICAgICAgICB0aGlzLm9wdGlvbnMucGxhY2VtZW50XG5cbiAgICAgIHZhciBhdXRvVG9rZW4gPSAvXFxzP2F1dG8/XFxzPy9pXG4gICAgICB2YXIgYXV0b1BsYWNlID0gYXV0b1Rva2VuLnRlc3QocGxhY2VtZW50KVxuICAgICAgaWYgKGF1dG9QbGFjZSkgcGxhY2VtZW50ID0gcGxhY2VtZW50LnJlcGxhY2UoYXV0b1Rva2VuLCAnJykgfHwgJ3RvcCdcblxuICAgICAgJHRpcFxuICAgICAgICAuZGV0YWNoKClcbiAgICAgICAgLmNzcyh7IHRvcDogMCwgbGVmdDogMCwgZGlzcGxheTogJ2Jsb2NrJyB9KVxuICAgICAgICAuYWRkQ2xhc3MocGxhY2VtZW50KVxuICAgICAgICAuZGF0YSgnYnMuJyArIHRoaXMudHlwZSwgdGhpcylcblxuICAgICAgdGhpcy5vcHRpb25zLmNvbnRhaW5lciA/ICR0aXAuYXBwZW5kVG8oJChkb2N1bWVudCkuZmluZCh0aGlzLm9wdGlvbnMuY29udGFpbmVyKSkgOiAkdGlwLmluc2VydEFmdGVyKHRoaXMuJGVsZW1lbnQpXG4gICAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ2luc2VydGVkLmJzLicgKyB0aGlzLnR5cGUpXG5cbiAgICAgIHZhciBwb3MgICAgICAgICAgPSB0aGlzLmdldFBvc2l0aW9uKClcbiAgICAgIHZhciBhY3R1YWxXaWR0aCAgPSAkdGlwWzBdLm9mZnNldFdpZHRoXG4gICAgICB2YXIgYWN0dWFsSGVpZ2h0ID0gJHRpcFswXS5vZmZzZXRIZWlnaHRcblxuICAgICAgaWYgKGF1dG9QbGFjZSkge1xuICAgICAgICB2YXIgb3JnUGxhY2VtZW50ID0gcGxhY2VtZW50XG4gICAgICAgIHZhciB2aWV3cG9ydERpbSA9IHRoaXMuZ2V0UG9zaXRpb24odGhpcy4kdmlld3BvcnQpXG5cbiAgICAgICAgcGxhY2VtZW50ID0gcGxhY2VtZW50ID09ICdib3R0b20nICYmIHBvcy5ib3R0b20gKyBhY3R1YWxIZWlnaHQgPiB2aWV3cG9ydERpbS5ib3R0b20gPyAndG9wJyAgICA6XG4gICAgICAgICAgICAgICAgICAgIHBsYWNlbWVudCA9PSAndG9wJyAgICAmJiBwb3MudG9wICAgIC0gYWN0dWFsSGVpZ2h0IDwgdmlld3BvcnREaW0udG9wICAgID8gJ2JvdHRvbScgOlxuICAgICAgICAgICAgICAgICAgICBwbGFjZW1lbnQgPT0gJ3JpZ2h0JyAgJiYgcG9zLnJpZ2h0ICArIGFjdHVhbFdpZHRoICA+IHZpZXdwb3J0RGltLndpZHRoICA/ICdsZWZ0JyAgIDpcbiAgICAgICAgICAgICAgICAgICAgcGxhY2VtZW50ID09ICdsZWZ0JyAgICYmIHBvcy5sZWZ0ICAgLSBhY3R1YWxXaWR0aCAgPCB2aWV3cG9ydERpbS5sZWZ0ICAgPyAncmlnaHQnICA6XG4gICAgICAgICAgICAgICAgICAgIHBsYWNlbWVudFxuXG4gICAgICAgICR0aXBcbiAgICAgICAgICAucmVtb3ZlQ2xhc3Mob3JnUGxhY2VtZW50KVxuICAgICAgICAgIC5hZGRDbGFzcyhwbGFjZW1lbnQpXG4gICAgICB9XG5cbiAgICAgIHZhciBjYWxjdWxhdGVkT2Zmc2V0ID0gdGhpcy5nZXRDYWxjdWxhdGVkT2Zmc2V0KHBsYWNlbWVudCwgcG9zLCBhY3R1YWxXaWR0aCwgYWN0dWFsSGVpZ2h0KVxuXG4gICAgICB0aGlzLmFwcGx5UGxhY2VtZW50KGNhbGN1bGF0ZWRPZmZzZXQsIHBsYWNlbWVudClcblxuICAgICAgdmFyIGNvbXBsZXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgcHJldkhvdmVyU3RhdGUgPSB0aGF0LmhvdmVyU3RhdGVcbiAgICAgICAgdGhhdC4kZWxlbWVudC50cmlnZ2VyKCdzaG93bi5icy4nICsgdGhhdC50eXBlKVxuICAgICAgICB0aGF0LmhvdmVyU3RhdGUgPSBudWxsXG5cbiAgICAgICAgaWYgKHByZXZIb3ZlclN0YXRlID09ICdvdXQnKSB0aGF0LmxlYXZlKHRoYXQpXG4gICAgICB9XG5cbiAgICAgICQuc3VwcG9ydC50cmFuc2l0aW9uICYmIHRoaXMuJHRpcC5oYXNDbGFzcygnZmFkZScpID9cbiAgICAgICAgJHRpcFxuICAgICAgICAgIC5vbmUoJ2JzVHJhbnNpdGlvbkVuZCcsIGNvbXBsZXRlKVxuICAgICAgICAgIC5lbXVsYXRlVHJhbnNpdGlvbkVuZChUb29sdGlwLlRSQU5TSVRJT05fRFVSQVRJT04pIDpcbiAgICAgICAgY29tcGxldGUoKVxuICAgIH1cbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLmFwcGx5UGxhY2VtZW50ID0gZnVuY3Rpb24gKG9mZnNldCwgcGxhY2VtZW50KSB7XG4gICAgdmFyICR0aXAgICA9IHRoaXMudGlwKClcbiAgICB2YXIgd2lkdGggID0gJHRpcFswXS5vZmZzZXRXaWR0aFxuICAgIHZhciBoZWlnaHQgPSAkdGlwWzBdLm9mZnNldEhlaWdodFxuXG4gICAgLy8gbWFudWFsbHkgcmVhZCBtYXJnaW5zIGJlY2F1c2UgZ2V0Qm91bmRpbmdDbGllbnRSZWN0IGluY2x1ZGVzIGRpZmZlcmVuY2VcbiAgICB2YXIgbWFyZ2luVG9wID0gcGFyc2VJbnQoJHRpcC5jc3MoJ21hcmdpbi10b3AnKSwgMTApXG4gICAgdmFyIG1hcmdpbkxlZnQgPSBwYXJzZUludCgkdGlwLmNzcygnbWFyZ2luLWxlZnQnKSwgMTApXG5cbiAgICAvLyB3ZSBtdXN0IGNoZWNrIGZvciBOYU4gZm9yIGllIDgvOVxuICAgIGlmIChpc05hTihtYXJnaW5Ub3ApKSAgbWFyZ2luVG9wICA9IDBcbiAgICBpZiAoaXNOYU4obWFyZ2luTGVmdCkpIG1hcmdpbkxlZnQgPSAwXG5cbiAgICBvZmZzZXQudG9wICArPSBtYXJnaW5Ub3BcbiAgICBvZmZzZXQubGVmdCArPSBtYXJnaW5MZWZ0XG5cbiAgICAvLyAkLmZuLm9mZnNldCBkb2Vzbid0IHJvdW5kIHBpeGVsIHZhbHVlc1xuICAgIC8vIHNvIHdlIHVzZSBzZXRPZmZzZXQgZGlyZWN0bHkgd2l0aCBvdXIgb3duIGZ1bmN0aW9uIEItMFxuICAgICQub2Zmc2V0LnNldE9mZnNldCgkdGlwWzBdLCAkLmV4dGVuZCh7XG4gICAgICB1c2luZzogZnVuY3Rpb24gKHByb3BzKSB7XG4gICAgICAgICR0aXAuY3NzKHtcbiAgICAgICAgICB0b3A6IE1hdGgucm91bmQocHJvcHMudG9wKSxcbiAgICAgICAgICBsZWZ0OiBNYXRoLnJvdW5kKHByb3BzLmxlZnQpXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfSwgb2Zmc2V0KSwgMClcblxuICAgICR0aXAuYWRkQ2xhc3MoJ2luJylcblxuICAgIC8vIGNoZWNrIHRvIHNlZSBpZiBwbGFjaW5nIHRpcCBpbiBuZXcgb2Zmc2V0IGNhdXNlZCB0aGUgdGlwIHRvIHJlc2l6ZSBpdHNlbGZcbiAgICB2YXIgYWN0dWFsV2lkdGggID0gJHRpcFswXS5vZmZzZXRXaWR0aFxuICAgIHZhciBhY3R1YWxIZWlnaHQgPSAkdGlwWzBdLm9mZnNldEhlaWdodFxuXG4gICAgaWYgKHBsYWNlbWVudCA9PSAndG9wJyAmJiBhY3R1YWxIZWlnaHQgIT0gaGVpZ2h0KSB7XG4gICAgICBvZmZzZXQudG9wID0gb2Zmc2V0LnRvcCArIGhlaWdodCAtIGFjdHVhbEhlaWdodFxuICAgIH1cblxuICAgIHZhciBkZWx0YSA9IHRoaXMuZ2V0Vmlld3BvcnRBZGp1c3RlZERlbHRhKHBsYWNlbWVudCwgb2Zmc2V0LCBhY3R1YWxXaWR0aCwgYWN0dWFsSGVpZ2h0KVxuXG4gICAgaWYgKGRlbHRhLmxlZnQpIG9mZnNldC5sZWZ0ICs9IGRlbHRhLmxlZnRcbiAgICBlbHNlIG9mZnNldC50b3AgKz0gZGVsdGEudG9wXG5cbiAgICB2YXIgaXNWZXJ0aWNhbCAgICAgICAgICA9IC90b3B8Ym90dG9tLy50ZXN0KHBsYWNlbWVudClcbiAgICB2YXIgYXJyb3dEZWx0YSAgICAgICAgICA9IGlzVmVydGljYWwgPyBkZWx0YS5sZWZ0ICogMiAtIHdpZHRoICsgYWN0dWFsV2lkdGggOiBkZWx0YS50b3AgKiAyIC0gaGVpZ2h0ICsgYWN0dWFsSGVpZ2h0XG4gICAgdmFyIGFycm93T2Zmc2V0UG9zaXRpb24gPSBpc1ZlcnRpY2FsID8gJ29mZnNldFdpZHRoJyA6ICdvZmZzZXRIZWlnaHQnXG5cbiAgICAkdGlwLm9mZnNldChvZmZzZXQpXG4gICAgdGhpcy5yZXBsYWNlQXJyb3coYXJyb3dEZWx0YSwgJHRpcFswXVthcnJvd09mZnNldFBvc2l0aW9uXSwgaXNWZXJ0aWNhbClcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLnJlcGxhY2VBcnJvdyA9IGZ1bmN0aW9uIChkZWx0YSwgZGltZW5zaW9uLCBpc1ZlcnRpY2FsKSB7XG4gICAgdGhpcy5hcnJvdygpXG4gICAgICAuY3NzKGlzVmVydGljYWwgPyAnbGVmdCcgOiAndG9wJywgNTAgKiAoMSAtIGRlbHRhIC8gZGltZW5zaW9uKSArICclJylcbiAgICAgIC5jc3MoaXNWZXJ0aWNhbCA/ICd0b3AnIDogJ2xlZnQnLCAnJylcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLnNldENvbnRlbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyICR0aXAgID0gdGhpcy50aXAoKVxuICAgIHZhciB0aXRsZSA9IHRoaXMuZ2V0VGl0bGUoKVxuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5odG1sKSB7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLnNhbml0aXplKSB7XG4gICAgICAgIHRpdGxlID0gc2FuaXRpemVIdG1sKHRpdGxlLCB0aGlzLm9wdGlvbnMud2hpdGVMaXN0LCB0aGlzLm9wdGlvbnMuc2FuaXRpemVGbilcbiAgICAgIH1cblxuICAgICAgJHRpcC5maW5kKCcudG9vbHRpcC1pbm5lcicpLmh0bWwodGl0bGUpXG4gICAgfSBlbHNlIHtcbiAgICAgICR0aXAuZmluZCgnLnRvb2x0aXAtaW5uZXInKS50ZXh0KHRpdGxlKVxuICAgIH1cblxuICAgICR0aXAucmVtb3ZlQ2xhc3MoJ2ZhZGUgaW4gdG9wIGJvdHRvbSBsZWZ0IHJpZ2h0JylcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLmhpZGUgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICB2YXIgdGhhdCA9IHRoaXNcbiAgICB2YXIgJHRpcCA9ICQodGhpcy4kdGlwKVxuICAgIHZhciBlICAgID0gJC5FdmVudCgnaGlkZS5icy4nICsgdGhpcy50eXBlKVxuXG4gICAgZnVuY3Rpb24gY29tcGxldGUoKSB7XG4gICAgICBpZiAodGhhdC5ob3ZlclN0YXRlICE9ICdpbicpICR0aXAuZGV0YWNoKClcbiAgICAgIGlmICh0aGF0LiRlbGVtZW50KSB7IC8vIFRPRE86IENoZWNrIHdoZXRoZXIgZ3VhcmRpbmcgdGhpcyBjb2RlIHdpdGggdGhpcyBgaWZgIGlzIHJlYWxseSBuZWNlc3NhcnkuXG4gICAgICAgIHRoYXQuJGVsZW1lbnRcbiAgICAgICAgICAucmVtb3ZlQXR0cignYXJpYS1kZXNjcmliZWRieScpXG4gICAgICAgICAgLnRyaWdnZXIoJ2hpZGRlbi5icy4nICsgdGhhdC50eXBlKVxuICAgICAgfVxuICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2soKVxuICAgIH1cblxuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcihlKVxuXG4gICAgaWYgKGUuaXNEZWZhdWx0UHJldmVudGVkKCkpIHJldHVyblxuXG4gICAgJHRpcC5yZW1vdmVDbGFzcygnaW4nKVxuXG4gICAgJC5zdXBwb3J0LnRyYW5zaXRpb24gJiYgJHRpcC5oYXNDbGFzcygnZmFkZScpID9cbiAgICAgICR0aXBcbiAgICAgICAgLm9uZSgnYnNUcmFuc2l0aW9uRW5kJywgY29tcGxldGUpXG4gICAgICAgIC5lbXVsYXRlVHJhbnNpdGlvbkVuZChUb29sdGlwLlRSQU5TSVRJT05fRFVSQVRJT04pIDpcbiAgICAgIGNvbXBsZXRlKClcblxuICAgIHRoaXMuaG92ZXJTdGF0ZSA9IG51bGxcblxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICBUb29sdGlwLnByb3RvdHlwZS5maXhUaXRsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgJGUgPSB0aGlzLiRlbGVtZW50XG4gICAgaWYgKCRlLmF0dHIoJ3RpdGxlJykgfHwgdHlwZW9mICRlLmF0dHIoJ2RhdGEtb3JpZ2luYWwtdGl0bGUnKSAhPSAnc3RyaW5nJykge1xuICAgICAgJGUuYXR0cignZGF0YS1vcmlnaW5hbC10aXRsZScsICRlLmF0dHIoJ3RpdGxlJykgfHwgJycpLmF0dHIoJ3RpdGxlJywgJycpXG4gICAgfVxuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUuaGFzQ29udGVudCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRUaXRsZSgpXG4gIH1cblxuICBUb29sdGlwLnByb3RvdHlwZS5nZXRQb3NpdGlvbiA9IGZ1bmN0aW9uICgkZWxlbWVudCkge1xuICAgICRlbGVtZW50ICAgPSAkZWxlbWVudCB8fCB0aGlzLiRlbGVtZW50XG5cbiAgICB2YXIgZWwgICAgID0gJGVsZW1lbnRbMF1cbiAgICB2YXIgaXNCb2R5ID0gZWwudGFnTmFtZSA9PSAnQk9EWSdcblxuICAgIHZhciBlbFJlY3QgICAgPSBlbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgIGlmIChlbFJlY3Qud2lkdGggPT0gbnVsbCkge1xuICAgICAgLy8gd2lkdGggYW5kIGhlaWdodCBhcmUgbWlzc2luZyBpbiBJRTgsIHNvIGNvbXB1dGUgdGhlbSBtYW51YWxseTsgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS90d2JzL2Jvb3RzdHJhcC9pc3N1ZXMvMTQwOTNcbiAgICAgIGVsUmVjdCA9ICQuZXh0ZW5kKHt9LCBlbFJlY3QsIHsgd2lkdGg6IGVsUmVjdC5yaWdodCAtIGVsUmVjdC5sZWZ0LCBoZWlnaHQ6IGVsUmVjdC5ib3R0b20gLSBlbFJlY3QudG9wIH0pXG4gICAgfVxuICAgIHZhciBpc1N2ZyA9IHdpbmRvdy5TVkdFbGVtZW50ICYmIGVsIGluc3RhbmNlb2Ygd2luZG93LlNWR0VsZW1lbnRcbiAgICAvLyBBdm9pZCB1c2luZyAkLm9mZnNldCgpIG9uIFNWR3Mgc2luY2UgaXQgZ2l2ZXMgaW5jb3JyZWN0IHJlc3VsdHMgaW4galF1ZXJ5IDMuXG4gICAgLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS90d2JzL2Jvb3RzdHJhcC9pc3N1ZXMvMjAyODBcbiAgICB2YXIgZWxPZmZzZXQgID0gaXNCb2R5ID8geyB0b3A6IDAsIGxlZnQ6IDAgfSA6IChpc1N2ZyA/IG51bGwgOiAkZWxlbWVudC5vZmZzZXQoKSlcbiAgICB2YXIgc2Nyb2xsICAgID0geyBzY3JvbGw6IGlzQm9keSA/IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxUb3AgfHwgZG9jdW1lbnQuYm9keS5zY3JvbGxUb3AgOiAkZWxlbWVudC5zY3JvbGxUb3AoKSB9XG4gICAgdmFyIG91dGVyRGltcyA9IGlzQm9keSA/IHsgd2lkdGg6ICQod2luZG93KS53aWR0aCgpLCBoZWlnaHQ6ICQod2luZG93KS5oZWlnaHQoKSB9IDogbnVsbFxuXG4gICAgcmV0dXJuICQuZXh0ZW5kKHt9LCBlbFJlY3QsIHNjcm9sbCwgb3V0ZXJEaW1zLCBlbE9mZnNldClcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLmdldENhbGN1bGF0ZWRPZmZzZXQgPSBmdW5jdGlvbiAocGxhY2VtZW50LCBwb3MsIGFjdHVhbFdpZHRoLCBhY3R1YWxIZWlnaHQpIHtcbiAgICByZXR1cm4gcGxhY2VtZW50ID09ICdib3R0b20nID8geyB0b3A6IHBvcy50b3AgKyBwb3MuaGVpZ2h0LCAgIGxlZnQ6IHBvcy5sZWZ0ICsgcG9zLndpZHRoIC8gMiAtIGFjdHVhbFdpZHRoIC8gMiB9IDpcbiAgICAgICAgICAgcGxhY2VtZW50ID09ICd0b3AnICAgID8geyB0b3A6IHBvcy50b3AgLSBhY3R1YWxIZWlnaHQsIGxlZnQ6IHBvcy5sZWZ0ICsgcG9zLndpZHRoIC8gMiAtIGFjdHVhbFdpZHRoIC8gMiB9IDpcbiAgICAgICAgICAgcGxhY2VtZW50ID09ICdsZWZ0JyAgID8geyB0b3A6IHBvcy50b3AgKyBwb3MuaGVpZ2h0IC8gMiAtIGFjdHVhbEhlaWdodCAvIDIsIGxlZnQ6IHBvcy5sZWZ0IC0gYWN0dWFsV2lkdGggfSA6XG4gICAgICAgIC8qIHBsYWNlbWVudCA9PSAncmlnaHQnICovIHsgdG9wOiBwb3MudG9wICsgcG9zLmhlaWdodCAvIDIgLSBhY3R1YWxIZWlnaHQgLyAyLCBsZWZ0OiBwb3MubGVmdCArIHBvcy53aWR0aCB9XG5cbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLmdldFZpZXdwb3J0QWRqdXN0ZWREZWx0YSA9IGZ1bmN0aW9uIChwbGFjZW1lbnQsIHBvcywgYWN0dWFsV2lkdGgsIGFjdHVhbEhlaWdodCkge1xuICAgIHZhciBkZWx0YSA9IHsgdG9wOiAwLCBsZWZ0OiAwIH1cbiAgICBpZiAoIXRoaXMuJHZpZXdwb3J0KSByZXR1cm4gZGVsdGFcblxuICAgIHZhciB2aWV3cG9ydFBhZGRpbmcgPSB0aGlzLm9wdGlvbnMudmlld3BvcnQgJiYgdGhpcy5vcHRpb25zLnZpZXdwb3J0LnBhZGRpbmcgfHwgMFxuICAgIHZhciB2aWV3cG9ydERpbWVuc2lvbnMgPSB0aGlzLmdldFBvc2l0aW9uKHRoaXMuJHZpZXdwb3J0KVxuXG4gICAgaWYgKC9yaWdodHxsZWZ0Ly50ZXN0KHBsYWNlbWVudCkpIHtcbiAgICAgIHZhciB0b3BFZGdlT2Zmc2V0ICAgID0gcG9zLnRvcCAtIHZpZXdwb3J0UGFkZGluZyAtIHZpZXdwb3J0RGltZW5zaW9ucy5zY3JvbGxcbiAgICAgIHZhciBib3R0b21FZGdlT2Zmc2V0ID0gcG9zLnRvcCArIHZpZXdwb3J0UGFkZGluZyAtIHZpZXdwb3J0RGltZW5zaW9ucy5zY3JvbGwgKyBhY3R1YWxIZWlnaHRcbiAgICAgIGlmICh0b3BFZGdlT2Zmc2V0IDwgdmlld3BvcnREaW1lbnNpb25zLnRvcCkgeyAvLyB0b3Agb3ZlcmZsb3dcbiAgICAgICAgZGVsdGEudG9wID0gdmlld3BvcnREaW1lbnNpb25zLnRvcCAtIHRvcEVkZ2VPZmZzZXRcbiAgICAgIH0gZWxzZSBpZiAoYm90dG9tRWRnZU9mZnNldCA+IHZpZXdwb3J0RGltZW5zaW9ucy50b3AgKyB2aWV3cG9ydERpbWVuc2lvbnMuaGVpZ2h0KSB7IC8vIGJvdHRvbSBvdmVyZmxvd1xuICAgICAgICBkZWx0YS50b3AgPSB2aWV3cG9ydERpbWVuc2lvbnMudG9wICsgdmlld3BvcnREaW1lbnNpb25zLmhlaWdodCAtIGJvdHRvbUVkZ2VPZmZzZXRcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGxlZnRFZGdlT2Zmc2V0ICA9IHBvcy5sZWZ0IC0gdmlld3BvcnRQYWRkaW5nXG4gICAgICB2YXIgcmlnaHRFZGdlT2Zmc2V0ID0gcG9zLmxlZnQgKyB2aWV3cG9ydFBhZGRpbmcgKyBhY3R1YWxXaWR0aFxuICAgICAgaWYgKGxlZnRFZGdlT2Zmc2V0IDwgdmlld3BvcnREaW1lbnNpb25zLmxlZnQpIHsgLy8gbGVmdCBvdmVyZmxvd1xuICAgICAgICBkZWx0YS5sZWZ0ID0gdmlld3BvcnREaW1lbnNpb25zLmxlZnQgLSBsZWZ0RWRnZU9mZnNldFxuICAgICAgfSBlbHNlIGlmIChyaWdodEVkZ2VPZmZzZXQgPiB2aWV3cG9ydERpbWVuc2lvbnMucmlnaHQpIHsgLy8gcmlnaHQgb3ZlcmZsb3dcbiAgICAgICAgZGVsdGEubGVmdCA9IHZpZXdwb3J0RGltZW5zaW9ucy5sZWZ0ICsgdmlld3BvcnREaW1lbnNpb25zLndpZHRoIC0gcmlnaHRFZGdlT2Zmc2V0XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGRlbHRhXG4gIH1cblxuICBUb29sdGlwLnByb3RvdHlwZS5nZXRUaXRsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgdGl0bGVcbiAgICB2YXIgJGUgPSB0aGlzLiRlbGVtZW50XG4gICAgdmFyIG8gID0gdGhpcy5vcHRpb25zXG5cbiAgICB0aXRsZSA9ICRlLmF0dHIoJ2RhdGEtb3JpZ2luYWwtdGl0bGUnKVxuICAgICAgfHwgKHR5cGVvZiBvLnRpdGxlID09ICdmdW5jdGlvbicgPyBvLnRpdGxlLmNhbGwoJGVbMF0pIDogIG8udGl0bGUpXG5cbiAgICByZXR1cm4gdGl0bGVcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLmdldFVJRCA9IGZ1bmN0aW9uIChwcmVmaXgpIHtcbiAgICBkbyBwcmVmaXggKz0gfn4oTWF0aC5yYW5kb20oKSAqIDEwMDAwMDApXG4gICAgd2hpbGUgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHByZWZpeCkpXG4gICAgcmV0dXJuIHByZWZpeFxuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUudGlwID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICghdGhpcy4kdGlwKSB7XG4gICAgICB0aGlzLiR0aXAgPSAkKHRoaXMub3B0aW9ucy50ZW1wbGF0ZSlcbiAgICAgIGlmICh0aGlzLiR0aXAubGVuZ3RoICE9IDEpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKHRoaXMudHlwZSArICcgYHRlbXBsYXRlYCBvcHRpb24gbXVzdCBjb25zaXN0IG9mIGV4YWN0bHkgMSB0b3AtbGV2ZWwgZWxlbWVudCEnKVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy4kdGlwXG4gIH1cblxuICBUb29sdGlwLnByb3RvdHlwZS5hcnJvdyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gKHRoaXMuJGFycm93ID0gdGhpcy4kYXJyb3cgfHwgdGhpcy50aXAoKS5maW5kKCcudG9vbHRpcC1hcnJvdycpKVxuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUuZW5hYmxlID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZW5hYmxlZCA9IHRydWVcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLmRpc2FibGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5lbmFibGVkID0gZmFsc2VcbiAgfVxuXG4gIFRvb2x0aXAucHJvdG90eXBlLnRvZ2dsZUVuYWJsZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5lbmFibGVkID0gIXRoaXMuZW5hYmxlZFxuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUudG9nZ2xlID0gZnVuY3Rpb24gKGUpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICBpZiAoZSkge1xuICAgICAgc2VsZiA9ICQoZS5jdXJyZW50VGFyZ2V0KS5kYXRhKCdicy4nICsgdGhpcy50eXBlKVxuICAgICAgaWYgKCFzZWxmKSB7XG4gICAgICAgIHNlbGYgPSBuZXcgdGhpcy5jb25zdHJ1Y3RvcihlLmN1cnJlbnRUYXJnZXQsIHRoaXMuZ2V0RGVsZWdhdGVPcHRpb25zKCkpXG4gICAgICAgICQoZS5jdXJyZW50VGFyZ2V0KS5kYXRhKCdicy4nICsgdGhpcy50eXBlLCBzZWxmKVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChlKSB7XG4gICAgICBzZWxmLmluU3RhdGUuY2xpY2sgPSAhc2VsZi5pblN0YXRlLmNsaWNrXG4gICAgICBpZiAoc2VsZi5pc0luU3RhdGVUcnVlKCkpIHNlbGYuZW50ZXIoc2VsZilcbiAgICAgIGVsc2Ugc2VsZi5sZWF2ZShzZWxmKVxuICAgIH0gZWxzZSB7XG4gICAgICBzZWxmLnRpcCgpLmhhc0NsYXNzKCdpbicpID8gc2VsZi5sZWF2ZShzZWxmKSA6IHNlbGYuZW50ZXIoc2VsZilcbiAgICB9XG4gIH1cblxuICBUb29sdGlwLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciB0aGF0ID0gdGhpc1xuICAgIGNsZWFyVGltZW91dCh0aGlzLnRpbWVvdXQpXG4gICAgdGhpcy5oaWRlKGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoYXQuJGVsZW1lbnQub2ZmKCcuJyArIHRoYXQudHlwZSkucmVtb3ZlRGF0YSgnYnMuJyArIHRoYXQudHlwZSlcbiAgICAgIGlmICh0aGF0LiR0aXApIHtcbiAgICAgICAgdGhhdC4kdGlwLmRldGFjaCgpXG4gICAgICB9XG4gICAgICB0aGF0LiR0aXAgPSBudWxsXG4gICAgICB0aGF0LiRhcnJvdyA9IG51bGxcbiAgICAgIHRoYXQuJHZpZXdwb3J0ID0gbnVsbFxuICAgICAgdGhhdC4kZWxlbWVudCA9IG51bGxcbiAgICB9KVxuICB9XG5cbiAgVG9vbHRpcC5wcm90b3R5cGUuc2FuaXRpemVIdG1sID0gZnVuY3Rpb24gKHVuc2FmZUh0bWwpIHtcbiAgICByZXR1cm4gc2FuaXRpemVIdG1sKHVuc2FmZUh0bWwsIHRoaXMub3B0aW9ucy53aGl0ZUxpc3QsIHRoaXMub3B0aW9ucy5zYW5pdGl6ZUZuKVxuICB9XG5cbiAgLy8gVE9PTFRJUCBQTFVHSU4gREVGSU5JVElPTlxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgZnVuY3Rpb24gUGx1Z2luKG9wdGlvbikge1xuICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgdmFyICR0aGlzICAgPSAkKHRoaXMpXG4gICAgICB2YXIgZGF0YSAgICA9ICR0aGlzLmRhdGEoJ2JzLnRvb2x0aXAnKVxuICAgICAgdmFyIG9wdGlvbnMgPSB0eXBlb2Ygb3B0aW9uID09ICdvYmplY3QnICYmIG9wdGlvblxuXG4gICAgICBpZiAoIWRhdGEgJiYgL2Rlc3Ryb3l8aGlkZS8udGVzdChvcHRpb24pKSByZXR1cm5cbiAgICAgIGlmICghZGF0YSkgJHRoaXMuZGF0YSgnYnMudG9vbHRpcCcsIChkYXRhID0gbmV3IFRvb2x0aXAodGhpcywgb3B0aW9ucykpKVxuICAgICAgaWYgKHR5cGVvZiBvcHRpb24gPT0gJ3N0cmluZycpIGRhdGFbb3B0aW9uXSgpXG4gICAgfSlcbiAgfVxuXG4gIHZhciBvbGQgPSAkLmZuLnRvb2x0aXBcblxuICAkLmZuLnRvb2x0aXAgICAgICAgICAgICAgPSBQbHVnaW5cbiAgJC5mbi50b29sdGlwLkNvbnN0cnVjdG9yID0gVG9vbHRpcFxuXG5cbiAgLy8gVE9PTFRJUCBOTyBDT05GTElDVFxuICAvLyA9PT09PT09PT09PT09PT09PT09XG5cbiAgJC5mbi50b29sdGlwLm5vQ29uZmxpY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgJC5mbi50b29sdGlwID0gb2xkXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG59KGpRdWVyeSk7XG5cbi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogQm9vdHN0cmFwOiBwb3BvdmVyLmpzIHYzLjQuMVxuICogaHR0cHM6Ly9nZXRib290c3RyYXAuY29tL2RvY3MvMy40L2phdmFzY3JpcHQvI3BvcG92ZXJzXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIENvcHlyaWdodCAyMDExLTIwMTkgVHdpdHRlciwgSW5jLlxuICogTGljZW5zZWQgdW5kZXIgTUlUIChodHRwczovL2dpdGh1Yi5jb20vdHdicy9ib290c3RyYXAvYmxvYi9tYXN0ZXIvTElDRU5TRSlcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqL1xuXG5cbitmdW5jdGlvbiAoJCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgLy8gUE9QT1ZFUiBQVUJMSUMgQ0xBU1MgREVGSU5JVElPTlxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgdmFyIFBvcG92ZXIgPSBmdW5jdGlvbiAoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIHRoaXMuaW5pdCgncG9wb3ZlcicsIGVsZW1lbnQsIG9wdGlvbnMpXG4gIH1cblxuICBpZiAoISQuZm4udG9vbHRpcCkgdGhyb3cgbmV3IEVycm9yKCdQb3BvdmVyIHJlcXVpcmVzIHRvb2x0aXAuanMnKVxuXG4gIFBvcG92ZXIuVkVSU0lPTiAgPSAnMy40LjEnXG5cbiAgUG9wb3Zlci5ERUZBVUxUUyA9ICQuZXh0ZW5kKHt9LCAkLmZuLnRvb2x0aXAuQ29uc3RydWN0b3IuREVGQVVMVFMsIHtcbiAgICBwbGFjZW1lbnQ6ICdyaWdodCcsXG4gICAgdHJpZ2dlcjogJ2NsaWNrJyxcbiAgICBjb250ZW50OiAnJyxcbiAgICB0ZW1wbGF0ZTogJzxkaXYgY2xhc3M9XCJwb3BvdmVyXCIgcm9sZT1cInRvb2x0aXBcIj48ZGl2IGNsYXNzPVwiYXJyb3dcIj48L2Rpdj48aDMgY2xhc3M9XCJwb3BvdmVyLXRpdGxlXCI+PC9oMz48ZGl2IGNsYXNzPVwicG9wb3Zlci1jb250ZW50XCI+PC9kaXY+PC9kaXY+J1xuICB9KVxuXG5cbiAgLy8gTk9URTogUE9QT1ZFUiBFWFRFTkRTIHRvb2x0aXAuanNcbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICBQb3BvdmVyLnByb3RvdHlwZSA9ICQuZXh0ZW5kKHt9LCAkLmZuLnRvb2x0aXAuQ29uc3RydWN0b3IucHJvdG90eXBlKVxuXG4gIFBvcG92ZXIucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gUG9wb3ZlclxuXG4gIFBvcG92ZXIucHJvdG90eXBlLmdldERlZmF1bHRzID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBQb3BvdmVyLkRFRkFVTFRTXG4gIH1cblxuICBQb3BvdmVyLnByb3RvdHlwZS5zZXRDb250ZW50ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciAkdGlwICAgID0gdGhpcy50aXAoKVxuICAgIHZhciB0aXRsZSAgID0gdGhpcy5nZXRUaXRsZSgpXG4gICAgdmFyIGNvbnRlbnQgPSB0aGlzLmdldENvbnRlbnQoKVxuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5odG1sKSB7XG4gICAgICB2YXIgdHlwZUNvbnRlbnQgPSB0eXBlb2YgY29udGVudFxuXG4gICAgICBpZiAodGhpcy5vcHRpb25zLnNhbml0aXplKSB7XG4gICAgICAgIHRpdGxlID0gdGhpcy5zYW5pdGl6ZUh0bWwodGl0bGUpXG5cbiAgICAgICAgaWYgKHR5cGVDb250ZW50ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgIGNvbnRlbnQgPSB0aGlzLnNhbml0aXplSHRtbChjb250ZW50KVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgICR0aXAuZmluZCgnLnBvcG92ZXItdGl0bGUnKS5odG1sKHRpdGxlKVxuICAgICAgJHRpcC5maW5kKCcucG9wb3Zlci1jb250ZW50JykuY2hpbGRyZW4oKS5kZXRhY2goKS5lbmQoKVtcbiAgICAgICAgdHlwZUNvbnRlbnQgPT09ICdzdHJpbmcnID8gJ2h0bWwnIDogJ2FwcGVuZCdcbiAgICAgIF0oY29udGVudClcbiAgICB9IGVsc2Uge1xuICAgICAgJHRpcC5maW5kKCcucG9wb3Zlci10aXRsZScpLnRleHQodGl0bGUpXG4gICAgICAkdGlwLmZpbmQoJy5wb3BvdmVyLWNvbnRlbnQnKS5jaGlsZHJlbigpLmRldGFjaCgpLmVuZCgpLnRleHQoY29udGVudClcbiAgICB9XG5cbiAgICAkdGlwLnJlbW92ZUNsYXNzKCdmYWRlIHRvcCBib3R0b20gbGVmdCByaWdodCBpbicpXG5cbiAgICAvLyBJRTggZG9lc24ndCBhY2NlcHQgaGlkaW5nIHZpYSB0aGUgYDplbXB0eWAgcHNldWRvIHNlbGVjdG9yLCB3ZSBoYXZlIHRvIGRvXG4gICAgLy8gdGhpcyBtYW51YWxseSBieSBjaGVja2luZyB0aGUgY29udGVudHMuXG4gICAgaWYgKCEkdGlwLmZpbmQoJy5wb3BvdmVyLXRpdGxlJykuaHRtbCgpKSAkdGlwLmZpbmQoJy5wb3BvdmVyLXRpdGxlJykuaGlkZSgpXG4gIH1cblxuICBQb3BvdmVyLnByb3RvdHlwZS5oYXNDb250ZW50ID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmdldFRpdGxlKCkgfHwgdGhpcy5nZXRDb250ZW50KClcbiAgfVxuXG4gIFBvcG92ZXIucHJvdG90eXBlLmdldENvbnRlbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyICRlID0gdGhpcy4kZWxlbWVudFxuICAgIHZhciBvICA9IHRoaXMub3B0aW9uc1xuXG4gICAgcmV0dXJuICRlLmF0dHIoJ2RhdGEtY29udGVudCcpXG4gICAgICB8fCAodHlwZW9mIG8uY29udGVudCA9PSAnZnVuY3Rpb24nID9cbiAgICAgICAgby5jb250ZW50LmNhbGwoJGVbMF0pIDpcbiAgICAgICAgby5jb250ZW50KVxuICB9XG5cbiAgUG9wb3Zlci5wcm90b3R5cGUuYXJyb3cgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICh0aGlzLiRhcnJvdyA9IHRoaXMuJGFycm93IHx8IHRoaXMudGlwKCkuZmluZCgnLmFycm93JykpXG4gIH1cblxuXG4gIC8vIFBPUE9WRVIgUExVR0lOIERFRklOSVRJT05cbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gIGZ1bmN0aW9uIFBsdWdpbihvcHRpb24pIHtcbiAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciAkdGhpcyAgID0gJCh0aGlzKVxuICAgICAgdmFyIGRhdGEgICAgPSAkdGhpcy5kYXRhKCdicy5wb3BvdmVyJylcbiAgICAgIHZhciBvcHRpb25zID0gdHlwZW9mIG9wdGlvbiA9PSAnb2JqZWN0JyAmJiBvcHRpb25cblxuICAgICAgaWYgKCFkYXRhICYmIC9kZXN0cm95fGhpZGUvLnRlc3Qob3B0aW9uKSkgcmV0dXJuXG4gICAgICBpZiAoIWRhdGEpICR0aGlzLmRhdGEoJ2JzLnBvcG92ZXInLCAoZGF0YSA9IG5ldyBQb3BvdmVyKHRoaXMsIG9wdGlvbnMpKSlcbiAgICAgIGlmICh0eXBlb2Ygb3B0aW9uID09ICdzdHJpbmcnKSBkYXRhW29wdGlvbl0oKVxuICAgIH0pXG4gIH1cblxuICB2YXIgb2xkID0gJC5mbi5wb3BvdmVyXG5cbiAgJC5mbi5wb3BvdmVyICAgICAgICAgICAgID0gUGx1Z2luXG4gICQuZm4ucG9wb3Zlci5Db25zdHJ1Y3RvciA9IFBvcG92ZXJcblxuXG4gIC8vIFBPUE9WRVIgTk8gQ09ORkxJQ1RcbiAgLy8gPT09PT09PT09PT09PT09PT09PVxuXG4gICQuZm4ucG9wb3Zlci5ub0NvbmZsaWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICQuZm4ucG9wb3ZlciA9IG9sZFxuICAgIHJldHVybiB0aGlzXG4gIH1cblxufShqUXVlcnkpO1xuXG4vKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIEJvb3RzdHJhcDogc2Nyb2xsc3B5LmpzIHYzLjQuMVxuICogaHR0cHM6Ly9nZXRib290c3RyYXAuY29tL2RvY3MvMy40L2phdmFzY3JpcHQvI3Njcm9sbHNweVxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBDb3B5cmlnaHQgMjAxMS0yMDE5IFR3aXR0ZXIsIEluYy5cbiAqIExpY2Vuc2VkIHVuZGVyIE1JVCAoaHR0cHM6Ly9naXRodWIuY29tL3R3YnMvYm9vdHN0cmFwL2Jsb2IvbWFzdGVyL0xJQ0VOU0UpXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi9cblxuXG4rZnVuY3Rpb24gKCQpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIC8vIFNDUk9MTFNQWSBDTEFTUyBERUZJTklUSU9OXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgZnVuY3Rpb24gU2Nyb2xsU3B5KGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLiRib2R5ICAgICAgICAgID0gJChkb2N1bWVudC5ib2R5KVxuICAgIHRoaXMuJHNjcm9sbEVsZW1lbnQgPSAkKGVsZW1lbnQpLmlzKGRvY3VtZW50LmJvZHkpID8gJCh3aW5kb3cpIDogJChlbGVtZW50KVxuICAgIHRoaXMub3B0aW9ucyAgICAgICAgPSAkLmV4dGVuZCh7fSwgU2Nyb2xsU3B5LkRFRkFVTFRTLCBvcHRpb25zKVxuICAgIHRoaXMuc2VsZWN0b3IgICAgICAgPSAodGhpcy5vcHRpb25zLnRhcmdldCB8fCAnJykgKyAnIC5uYXYgbGkgPiBhJ1xuICAgIHRoaXMub2Zmc2V0cyAgICAgICAgPSBbXVxuICAgIHRoaXMudGFyZ2V0cyAgICAgICAgPSBbXVxuICAgIHRoaXMuYWN0aXZlVGFyZ2V0ICAgPSBudWxsXG4gICAgdGhpcy5zY3JvbGxIZWlnaHQgICA9IDBcblxuICAgIHRoaXMuJHNjcm9sbEVsZW1lbnQub24oJ3Njcm9sbC5icy5zY3JvbGxzcHknLCAkLnByb3h5KHRoaXMucHJvY2VzcywgdGhpcykpXG4gICAgdGhpcy5yZWZyZXNoKClcbiAgICB0aGlzLnByb2Nlc3MoKVxuICB9XG5cbiAgU2Nyb2xsU3B5LlZFUlNJT04gID0gJzMuNC4xJ1xuXG4gIFNjcm9sbFNweS5ERUZBVUxUUyA9IHtcbiAgICBvZmZzZXQ6IDEwXG4gIH1cblxuICBTY3JvbGxTcHkucHJvdG90eXBlLmdldFNjcm9sbEhlaWdodCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy4kc2Nyb2xsRWxlbWVudFswXS5zY3JvbGxIZWlnaHQgfHwgTWF0aC5tYXgodGhpcy4kYm9keVswXS5zY3JvbGxIZWlnaHQsIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxIZWlnaHQpXG4gIH1cblxuICBTY3JvbGxTcHkucHJvdG90eXBlLnJlZnJlc2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHRoYXQgICAgICAgICAgPSB0aGlzXG4gICAgdmFyIG9mZnNldE1ldGhvZCAgPSAnb2Zmc2V0J1xuICAgIHZhciBvZmZzZXRCYXNlICAgID0gMFxuXG4gICAgdGhpcy5vZmZzZXRzICAgICAgPSBbXVxuICAgIHRoaXMudGFyZ2V0cyAgICAgID0gW11cbiAgICB0aGlzLnNjcm9sbEhlaWdodCA9IHRoaXMuZ2V0U2Nyb2xsSGVpZ2h0KClcblxuICAgIGlmICghJC5pc1dpbmRvdyh0aGlzLiRzY3JvbGxFbGVtZW50WzBdKSkge1xuICAgICAgb2Zmc2V0TWV0aG9kID0gJ3Bvc2l0aW9uJ1xuICAgICAgb2Zmc2V0QmFzZSAgID0gdGhpcy4kc2Nyb2xsRWxlbWVudC5zY3JvbGxUb3AoKVxuICAgIH1cblxuICAgIHRoaXMuJGJvZHlcbiAgICAgIC5maW5kKHRoaXMuc2VsZWN0b3IpXG4gICAgICAubWFwKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyICRlbCAgID0gJCh0aGlzKVxuICAgICAgICB2YXIgaHJlZiAgPSAkZWwuZGF0YSgndGFyZ2V0JykgfHwgJGVsLmF0dHIoJ2hyZWYnKVxuICAgICAgICB2YXIgJGhyZWYgPSAvXiMuLy50ZXN0KGhyZWYpICYmICQoaHJlZilcblxuICAgICAgICByZXR1cm4gKCRocmVmXG4gICAgICAgICAgJiYgJGhyZWYubGVuZ3RoXG4gICAgICAgICAgJiYgJGhyZWYuaXMoJzp2aXNpYmxlJylcbiAgICAgICAgICAmJiBbWyRocmVmW29mZnNldE1ldGhvZF0oKS50b3AgKyBvZmZzZXRCYXNlLCBocmVmXV0pIHx8IG51bGxcbiAgICAgIH0pXG4gICAgICAuc29ydChmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYVswXSAtIGJbMF0gfSlcbiAgICAgIC5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhhdC5vZmZzZXRzLnB1c2godGhpc1swXSlcbiAgICAgICAgdGhhdC50YXJnZXRzLnB1c2godGhpc1sxXSlcbiAgICAgIH0pXG4gIH1cblxuICBTY3JvbGxTcHkucHJvdG90eXBlLnByb2Nlc3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNjcm9sbFRvcCAgICA9IHRoaXMuJHNjcm9sbEVsZW1lbnQuc2Nyb2xsVG9wKCkgKyB0aGlzLm9wdGlvbnMub2Zmc2V0XG4gICAgdmFyIHNjcm9sbEhlaWdodCA9IHRoaXMuZ2V0U2Nyb2xsSGVpZ2h0KClcbiAgICB2YXIgbWF4U2Nyb2xsICAgID0gdGhpcy5vcHRpb25zLm9mZnNldCArIHNjcm9sbEhlaWdodCAtIHRoaXMuJHNjcm9sbEVsZW1lbnQuaGVpZ2h0KClcbiAgICB2YXIgb2Zmc2V0cyAgICAgID0gdGhpcy5vZmZzZXRzXG4gICAgdmFyIHRhcmdldHMgICAgICA9IHRoaXMudGFyZ2V0c1xuICAgIHZhciBhY3RpdmVUYXJnZXQgPSB0aGlzLmFjdGl2ZVRhcmdldFxuICAgIHZhciBpXG5cbiAgICBpZiAodGhpcy5zY3JvbGxIZWlnaHQgIT0gc2Nyb2xsSGVpZ2h0KSB7XG4gICAgICB0aGlzLnJlZnJlc2goKVxuICAgIH1cblxuICAgIGlmIChzY3JvbGxUb3AgPj0gbWF4U2Nyb2xsKSB7XG4gICAgICByZXR1cm4gYWN0aXZlVGFyZ2V0ICE9IChpID0gdGFyZ2V0c1t0YXJnZXRzLmxlbmd0aCAtIDFdKSAmJiB0aGlzLmFjdGl2YXRlKGkpXG4gICAgfVxuXG4gICAgaWYgKGFjdGl2ZVRhcmdldCAmJiBzY3JvbGxUb3AgPCBvZmZzZXRzWzBdKSB7XG4gICAgICB0aGlzLmFjdGl2ZVRhcmdldCA9IG51bGxcbiAgICAgIHJldHVybiB0aGlzLmNsZWFyKClcbiAgICB9XG5cbiAgICBmb3IgKGkgPSBvZmZzZXRzLmxlbmd0aDsgaS0tOykge1xuICAgICAgYWN0aXZlVGFyZ2V0ICE9IHRhcmdldHNbaV1cbiAgICAgICAgJiYgc2Nyb2xsVG9wID49IG9mZnNldHNbaV1cbiAgICAgICAgJiYgKG9mZnNldHNbaSArIDFdID09PSB1bmRlZmluZWQgfHwgc2Nyb2xsVG9wIDwgb2Zmc2V0c1tpICsgMV0pXG4gICAgICAgICYmIHRoaXMuYWN0aXZhdGUodGFyZ2V0c1tpXSlcbiAgICB9XG4gIH1cblxuICBTY3JvbGxTcHkucHJvdG90eXBlLmFjdGl2YXRlID0gZnVuY3Rpb24gKHRhcmdldCkge1xuICAgIHRoaXMuYWN0aXZlVGFyZ2V0ID0gdGFyZ2V0XG5cbiAgICB0aGlzLmNsZWFyKClcblxuICAgIHZhciBzZWxlY3RvciA9IHRoaXMuc2VsZWN0b3IgK1xuICAgICAgJ1tkYXRhLXRhcmdldD1cIicgKyB0YXJnZXQgKyAnXCJdLCcgK1xuICAgICAgdGhpcy5zZWxlY3RvciArICdbaHJlZj1cIicgKyB0YXJnZXQgKyAnXCJdJ1xuXG4gICAgdmFyIGFjdGl2ZSA9ICQoc2VsZWN0b3IpXG4gICAgICAucGFyZW50cygnbGknKVxuICAgICAgLmFkZENsYXNzKCdhY3RpdmUnKVxuXG4gICAgaWYgKGFjdGl2ZS5wYXJlbnQoJy5kcm9wZG93bi1tZW51JykubGVuZ3RoKSB7XG4gICAgICBhY3RpdmUgPSBhY3RpdmVcbiAgICAgICAgLmNsb3Nlc3QoJ2xpLmRyb3Bkb3duJylcbiAgICAgICAgLmFkZENsYXNzKCdhY3RpdmUnKVxuICAgIH1cblxuICAgIGFjdGl2ZS50cmlnZ2VyKCdhY3RpdmF0ZS5icy5zY3JvbGxzcHknKVxuICB9XG5cbiAgU2Nyb2xsU3B5LnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uICgpIHtcbiAgICAkKHRoaXMuc2VsZWN0b3IpXG4gICAgICAucGFyZW50c1VudGlsKHRoaXMub3B0aW9ucy50YXJnZXQsICcuYWN0aXZlJylcbiAgICAgIC5yZW1vdmVDbGFzcygnYWN0aXZlJylcbiAgfVxuXG5cbiAgLy8gU0NST0xMU1BZIFBMVUdJTiBERUZJTklUSU9OXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gIGZ1bmN0aW9uIFBsdWdpbihvcHRpb24pIHtcbiAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciAkdGhpcyAgID0gJCh0aGlzKVxuICAgICAgdmFyIGRhdGEgICAgPSAkdGhpcy5kYXRhKCdicy5zY3JvbGxzcHknKVxuICAgICAgdmFyIG9wdGlvbnMgPSB0eXBlb2Ygb3B0aW9uID09ICdvYmplY3QnICYmIG9wdGlvblxuXG4gICAgICBpZiAoIWRhdGEpICR0aGlzLmRhdGEoJ2JzLnNjcm9sbHNweScsIChkYXRhID0gbmV3IFNjcm9sbFNweSh0aGlzLCBvcHRpb25zKSkpXG4gICAgICBpZiAodHlwZW9mIG9wdGlvbiA9PSAnc3RyaW5nJykgZGF0YVtvcHRpb25dKClcbiAgICB9KVxuICB9XG5cbiAgdmFyIG9sZCA9ICQuZm4uc2Nyb2xsc3B5XG5cbiAgJC5mbi5zY3JvbGxzcHkgICAgICAgICAgICAgPSBQbHVnaW5cbiAgJC5mbi5zY3JvbGxzcHkuQ29uc3RydWN0b3IgPSBTY3JvbGxTcHlcblxuXG4gIC8vIFNDUk9MTFNQWSBOTyBDT05GTElDVFxuICAvLyA9PT09PT09PT09PT09PT09PT09PT1cblxuICAkLmZuLnNjcm9sbHNweS5ub0NvbmZsaWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICQuZm4uc2Nyb2xsc3B5ID0gb2xkXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG5cbiAgLy8gU0NST0xMU1BZIERBVEEtQVBJXG4gIC8vID09PT09PT09PT09PT09PT09PVxuXG4gICQod2luZG93KS5vbignbG9hZC5icy5zY3JvbGxzcHkuZGF0YS1hcGknLCBmdW5jdGlvbiAoKSB7XG4gICAgJCgnW2RhdGEtc3B5PVwic2Nyb2xsXCJdJykuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgJHNweSA9ICQodGhpcylcbiAgICAgIFBsdWdpbi5jYWxsKCRzcHksICRzcHkuZGF0YSgpKVxuICAgIH0pXG4gIH0pXG5cbn0oalF1ZXJ5KTtcblxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBCb290c3RyYXA6IHRhYi5qcyB2My40LjFcbiAqIGh0dHBzOi8vZ2V0Ym9vdHN0cmFwLmNvbS9kb2NzLzMuNC9qYXZhc2NyaXB0LyN0YWJzXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIENvcHlyaWdodCAyMDExLTIwMTkgVHdpdHRlciwgSW5jLlxuICogTGljZW5zZWQgdW5kZXIgTUlUIChodHRwczovL2dpdGh1Yi5jb20vdHdicy9ib290c3RyYXAvYmxvYi9tYXN0ZXIvTElDRU5TRSlcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqL1xuXG5cbitmdW5jdGlvbiAoJCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgLy8gVEFCIENMQVNTIERFRklOSVRJT05cbiAgLy8gPT09PT09PT09PT09PT09PT09PT1cblxuICB2YXIgVGFiID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICAvLyBqc2NzOmRpc2FibGUgcmVxdWlyZURvbGxhckJlZm9yZWpRdWVyeUFzc2lnbm1lbnRcbiAgICB0aGlzLmVsZW1lbnQgPSAkKGVsZW1lbnQpXG4gICAgLy8ganNjczplbmFibGUgcmVxdWlyZURvbGxhckJlZm9yZWpRdWVyeUFzc2lnbm1lbnRcbiAgfVxuXG4gIFRhYi5WRVJTSU9OID0gJzMuNC4xJ1xuXG4gIFRhYi5UUkFOU0lUSU9OX0RVUkFUSU9OID0gMTUwXG5cbiAgVGFiLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciAkdGhpcyAgICA9IHRoaXMuZWxlbWVudFxuICAgIHZhciAkdWwgICAgICA9ICR0aGlzLmNsb3Nlc3QoJ3VsOm5vdCguZHJvcGRvd24tbWVudSknKVxuICAgIHZhciBzZWxlY3RvciA9ICR0aGlzLmRhdGEoJ3RhcmdldCcpXG5cbiAgICBpZiAoIXNlbGVjdG9yKSB7XG4gICAgICBzZWxlY3RvciA9ICR0aGlzLmF0dHIoJ2hyZWYnKVxuICAgICAgc2VsZWN0b3IgPSBzZWxlY3RvciAmJiBzZWxlY3Rvci5yZXBsYWNlKC8uKig/PSNbXlxcc10qJCkvLCAnJykgLy8gc3RyaXAgZm9yIGllN1xuICAgIH1cblxuICAgIGlmICgkdGhpcy5wYXJlbnQoJ2xpJykuaGFzQ2xhc3MoJ2FjdGl2ZScpKSByZXR1cm5cblxuICAgIHZhciAkcHJldmlvdXMgPSAkdWwuZmluZCgnLmFjdGl2ZTpsYXN0IGEnKVxuICAgIHZhciBoaWRlRXZlbnQgPSAkLkV2ZW50KCdoaWRlLmJzLnRhYicsIHtcbiAgICAgIHJlbGF0ZWRUYXJnZXQ6ICR0aGlzWzBdXG4gICAgfSlcbiAgICB2YXIgc2hvd0V2ZW50ID0gJC5FdmVudCgnc2hvdy5icy50YWInLCB7XG4gICAgICByZWxhdGVkVGFyZ2V0OiAkcHJldmlvdXNbMF1cbiAgICB9KVxuXG4gICAgJHByZXZpb3VzLnRyaWdnZXIoaGlkZUV2ZW50KVxuICAgICR0aGlzLnRyaWdnZXIoc2hvd0V2ZW50KVxuXG4gICAgaWYgKHNob3dFdmVudC5pc0RlZmF1bHRQcmV2ZW50ZWQoKSB8fCBoaWRlRXZlbnQuaXNEZWZhdWx0UHJldmVudGVkKCkpIHJldHVyblxuXG4gICAgdmFyICR0YXJnZXQgPSAkKGRvY3VtZW50KS5maW5kKHNlbGVjdG9yKVxuXG4gICAgdGhpcy5hY3RpdmF0ZSgkdGhpcy5jbG9zZXN0KCdsaScpLCAkdWwpXG4gICAgdGhpcy5hY3RpdmF0ZSgkdGFyZ2V0LCAkdGFyZ2V0LnBhcmVudCgpLCBmdW5jdGlvbiAoKSB7XG4gICAgICAkcHJldmlvdXMudHJpZ2dlcih7XG4gICAgICAgIHR5cGU6ICdoaWRkZW4uYnMudGFiJyxcbiAgICAgICAgcmVsYXRlZFRhcmdldDogJHRoaXNbMF1cbiAgICAgIH0pXG4gICAgICAkdGhpcy50cmlnZ2VyKHtcbiAgICAgICAgdHlwZTogJ3Nob3duLmJzLnRhYicsXG4gICAgICAgIHJlbGF0ZWRUYXJnZXQ6ICRwcmV2aW91c1swXVxuICAgICAgfSlcbiAgICB9KVxuICB9XG5cbiAgVGFiLnByb3RvdHlwZS5hY3RpdmF0ZSA9IGZ1bmN0aW9uIChlbGVtZW50LCBjb250YWluZXIsIGNhbGxiYWNrKSB7XG4gICAgdmFyICRhY3RpdmUgICAgPSBjb250YWluZXIuZmluZCgnPiAuYWN0aXZlJylcbiAgICB2YXIgdHJhbnNpdGlvbiA9IGNhbGxiYWNrXG4gICAgICAmJiAkLnN1cHBvcnQudHJhbnNpdGlvblxuICAgICAgJiYgKCRhY3RpdmUubGVuZ3RoICYmICRhY3RpdmUuaGFzQ2xhc3MoJ2ZhZGUnKSB8fCAhIWNvbnRhaW5lci5maW5kKCc+IC5mYWRlJykubGVuZ3RoKVxuXG4gICAgZnVuY3Rpb24gbmV4dCgpIHtcbiAgICAgICRhY3RpdmVcbiAgICAgICAgLnJlbW92ZUNsYXNzKCdhY3RpdmUnKVxuICAgICAgICAuZmluZCgnPiAuZHJvcGRvd24tbWVudSA+IC5hY3RpdmUnKVxuICAgICAgICAucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpXG4gICAgICAgIC5lbmQoKVxuICAgICAgICAuZmluZCgnW2RhdGEtdG9nZ2xlPVwidGFiXCJdJylcbiAgICAgICAgLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCBmYWxzZSlcblxuICAgICAgZWxlbWVudFxuICAgICAgICAuYWRkQ2xhc3MoJ2FjdGl2ZScpXG4gICAgICAgIC5maW5kKCdbZGF0YS10b2dnbGU9XCJ0YWJcIl0nKVxuICAgICAgICAuYXR0cignYXJpYS1leHBhbmRlZCcsIHRydWUpXG5cbiAgICAgIGlmICh0cmFuc2l0aW9uKSB7XG4gICAgICAgIGVsZW1lbnRbMF0ub2Zmc2V0V2lkdGggLy8gcmVmbG93IGZvciB0cmFuc2l0aW9uXG4gICAgICAgIGVsZW1lbnQuYWRkQ2xhc3MoJ2luJylcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVsZW1lbnQucmVtb3ZlQ2xhc3MoJ2ZhZGUnKVxuICAgICAgfVxuXG4gICAgICBpZiAoZWxlbWVudC5wYXJlbnQoJy5kcm9wZG93bi1tZW51JykubGVuZ3RoKSB7XG4gICAgICAgIGVsZW1lbnRcbiAgICAgICAgICAuY2xvc2VzdCgnbGkuZHJvcGRvd24nKVxuICAgICAgICAgIC5hZGRDbGFzcygnYWN0aXZlJylcbiAgICAgICAgICAuZW5kKClcbiAgICAgICAgICAuZmluZCgnW2RhdGEtdG9nZ2xlPVwidGFiXCJdJylcbiAgICAgICAgICAuYXR0cignYXJpYS1leHBhbmRlZCcsIHRydWUpXG4gICAgICB9XG5cbiAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKClcbiAgICB9XG5cbiAgICAkYWN0aXZlLmxlbmd0aCAmJiB0cmFuc2l0aW9uID9cbiAgICAgICRhY3RpdmVcbiAgICAgICAgLm9uZSgnYnNUcmFuc2l0aW9uRW5kJywgbmV4dClcbiAgICAgICAgLmVtdWxhdGVUcmFuc2l0aW9uRW5kKFRhYi5UUkFOU0lUSU9OX0RVUkFUSU9OKSA6XG4gICAgICBuZXh0KClcblxuICAgICRhY3RpdmUucmVtb3ZlQ2xhc3MoJ2luJylcbiAgfVxuXG5cbiAgLy8gVEFCIFBMVUdJTiBERUZJTklUSU9OXG4gIC8vID09PT09PT09PT09PT09PT09PT09PVxuXG4gIGZ1bmN0aW9uIFBsdWdpbihvcHRpb24pIHtcbiAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciAkdGhpcyA9ICQodGhpcylcbiAgICAgIHZhciBkYXRhICA9ICR0aGlzLmRhdGEoJ2JzLnRhYicpXG5cbiAgICAgIGlmICghZGF0YSkgJHRoaXMuZGF0YSgnYnMudGFiJywgKGRhdGEgPSBuZXcgVGFiKHRoaXMpKSlcbiAgICAgIGlmICh0eXBlb2Ygb3B0aW9uID09ICdzdHJpbmcnKSBkYXRhW29wdGlvbl0oKVxuICAgIH0pXG4gIH1cblxuICB2YXIgb2xkID0gJC5mbi50YWJcblxuICAkLmZuLnRhYiAgICAgICAgICAgICA9IFBsdWdpblxuICAkLmZuLnRhYi5Db25zdHJ1Y3RvciA9IFRhYlxuXG5cbiAgLy8gVEFCIE5PIENPTkZMSUNUXG4gIC8vID09PT09PT09PT09PT09PVxuXG4gICQuZm4udGFiLm5vQ29uZmxpY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgJC5mbi50YWIgPSBvbGRcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cblxuICAvLyBUQUIgREFUQS1BUElcbiAgLy8gPT09PT09PT09PT09XG5cbiAgdmFyIGNsaWNrSGFuZGxlciA9IGZ1bmN0aW9uIChlKSB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgUGx1Z2luLmNhbGwoJCh0aGlzKSwgJ3Nob3cnKVxuICB9XG5cbiAgJChkb2N1bWVudClcbiAgICAub24oJ2NsaWNrLmJzLnRhYi5kYXRhLWFwaScsICdbZGF0YS10b2dnbGU9XCJ0YWJcIl0nLCBjbGlja0hhbmRsZXIpXG4gICAgLm9uKCdjbGljay5icy50YWIuZGF0YS1hcGknLCAnW2RhdGEtdG9nZ2xlPVwicGlsbFwiXScsIGNsaWNrSGFuZGxlcilcblxufShqUXVlcnkpO1xuXG4vKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIEJvb3RzdHJhcDogYWZmaXguanMgdjMuNC4xXG4gKiBodHRwczovL2dldGJvb3RzdHJhcC5jb20vZG9jcy8zLjQvamF2YXNjcmlwdC8jYWZmaXhcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogQ29weXJpZ2h0IDIwMTEtMjAxOSBUd2l0dGVyLCBJbmMuXG4gKiBMaWNlbnNlZCB1bmRlciBNSVQgKGh0dHBzOi8vZ2l0aHViLmNvbS90d2JzL2Jvb3RzdHJhcC9ibG9iL21hc3Rlci9MSUNFTlNFKVxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovXG5cblxuK2Z1bmN0aW9uICgkKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICAvLyBBRkZJWCBDTEFTUyBERUZJTklUSU9OXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT1cblxuICB2YXIgQWZmaXggPSBmdW5jdGlvbiAoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBBZmZpeC5ERUZBVUxUUywgb3B0aW9ucylcblxuICAgIHZhciB0YXJnZXQgPSB0aGlzLm9wdGlvbnMudGFyZ2V0ID09PSBBZmZpeC5ERUZBVUxUUy50YXJnZXQgPyAkKHRoaXMub3B0aW9ucy50YXJnZXQpIDogJChkb2N1bWVudCkuZmluZCh0aGlzLm9wdGlvbnMudGFyZ2V0KVxuXG4gICAgdGhpcy4kdGFyZ2V0ID0gdGFyZ2V0XG4gICAgICAub24oJ3Njcm9sbC5icy5hZmZpeC5kYXRhLWFwaScsICQucHJveHkodGhpcy5jaGVja1Bvc2l0aW9uLCB0aGlzKSlcbiAgICAgIC5vbignY2xpY2suYnMuYWZmaXguZGF0YS1hcGknLCAgJC5wcm94eSh0aGlzLmNoZWNrUG9zaXRpb25XaXRoRXZlbnRMb29wLCB0aGlzKSlcblxuICAgIHRoaXMuJGVsZW1lbnQgICAgID0gJChlbGVtZW50KVxuICAgIHRoaXMuYWZmaXhlZCAgICAgID0gbnVsbFxuICAgIHRoaXMudW5waW4gICAgICAgID0gbnVsbFxuICAgIHRoaXMucGlubmVkT2Zmc2V0ID0gbnVsbFxuXG4gICAgdGhpcy5jaGVja1Bvc2l0aW9uKClcbiAgfVxuXG4gIEFmZml4LlZFUlNJT04gID0gJzMuNC4xJ1xuXG4gIEFmZml4LlJFU0VUICAgID0gJ2FmZml4IGFmZml4LXRvcCBhZmZpeC1ib3R0b20nXG5cbiAgQWZmaXguREVGQVVMVFMgPSB7XG4gICAgb2Zmc2V0OiAwLFxuICAgIHRhcmdldDogd2luZG93XG4gIH1cblxuICBBZmZpeC5wcm90b3R5cGUuZ2V0U3RhdGUgPSBmdW5jdGlvbiAoc2Nyb2xsSGVpZ2h0LCBoZWlnaHQsIG9mZnNldFRvcCwgb2Zmc2V0Qm90dG9tKSB7XG4gICAgdmFyIHNjcm9sbFRvcCAgICA9IHRoaXMuJHRhcmdldC5zY3JvbGxUb3AoKVxuICAgIHZhciBwb3NpdGlvbiAgICAgPSB0aGlzLiRlbGVtZW50Lm9mZnNldCgpXG4gICAgdmFyIHRhcmdldEhlaWdodCA9IHRoaXMuJHRhcmdldC5oZWlnaHQoKVxuXG4gICAgaWYgKG9mZnNldFRvcCAhPSBudWxsICYmIHRoaXMuYWZmaXhlZCA9PSAndG9wJykgcmV0dXJuIHNjcm9sbFRvcCA8IG9mZnNldFRvcCA/ICd0b3AnIDogZmFsc2VcblxuICAgIGlmICh0aGlzLmFmZml4ZWQgPT0gJ2JvdHRvbScpIHtcbiAgICAgIGlmIChvZmZzZXRUb3AgIT0gbnVsbCkgcmV0dXJuIChzY3JvbGxUb3AgKyB0aGlzLnVucGluIDw9IHBvc2l0aW9uLnRvcCkgPyBmYWxzZSA6ICdib3R0b20nXG4gICAgICByZXR1cm4gKHNjcm9sbFRvcCArIHRhcmdldEhlaWdodCA8PSBzY3JvbGxIZWlnaHQgLSBvZmZzZXRCb3R0b20pID8gZmFsc2UgOiAnYm90dG9tJ1xuICAgIH1cblxuICAgIHZhciBpbml0aWFsaXppbmcgICA9IHRoaXMuYWZmaXhlZCA9PSBudWxsXG4gICAgdmFyIGNvbGxpZGVyVG9wICAgID0gaW5pdGlhbGl6aW5nID8gc2Nyb2xsVG9wIDogcG9zaXRpb24udG9wXG4gICAgdmFyIGNvbGxpZGVySGVpZ2h0ID0gaW5pdGlhbGl6aW5nID8gdGFyZ2V0SGVpZ2h0IDogaGVpZ2h0XG5cbiAgICBpZiAob2Zmc2V0VG9wICE9IG51bGwgJiYgc2Nyb2xsVG9wIDw9IG9mZnNldFRvcCkgcmV0dXJuICd0b3AnXG4gICAgaWYgKG9mZnNldEJvdHRvbSAhPSBudWxsICYmIChjb2xsaWRlclRvcCArIGNvbGxpZGVySGVpZ2h0ID49IHNjcm9sbEhlaWdodCAtIG9mZnNldEJvdHRvbSkpIHJldHVybiAnYm90dG9tJ1xuXG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICBBZmZpeC5wcm90b3R5cGUuZ2V0UGlubmVkT2Zmc2V0ID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLnBpbm5lZE9mZnNldCkgcmV0dXJuIHRoaXMucGlubmVkT2Zmc2V0XG4gICAgdGhpcy4kZWxlbWVudC5yZW1vdmVDbGFzcyhBZmZpeC5SRVNFVCkuYWRkQ2xhc3MoJ2FmZml4JylcbiAgICB2YXIgc2Nyb2xsVG9wID0gdGhpcy4kdGFyZ2V0LnNjcm9sbFRvcCgpXG4gICAgdmFyIHBvc2l0aW9uICA9IHRoaXMuJGVsZW1lbnQub2Zmc2V0KClcbiAgICByZXR1cm4gKHRoaXMucGlubmVkT2Zmc2V0ID0gcG9zaXRpb24udG9wIC0gc2Nyb2xsVG9wKVxuICB9XG5cbiAgQWZmaXgucHJvdG90eXBlLmNoZWNrUG9zaXRpb25XaXRoRXZlbnRMb29wID0gZnVuY3Rpb24gKCkge1xuICAgIHNldFRpbWVvdXQoJC5wcm94eSh0aGlzLmNoZWNrUG9zaXRpb24sIHRoaXMpLCAxKVxuICB9XG5cbiAgQWZmaXgucHJvdG90eXBlLmNoZWNrUG9zaXRpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCF0aGlzLiRlbGVtZW50LmlzKCc6dmlzaWJsZScpKSByZXR1cm5cblxuICAgIHZhciBoZWlnaHQgICAgICAgPSB0aGlzLiRlbGVtZW50LmhlaWdodCgpXG4gICAgdmFyIG9mZnNldCAgICAgICA9IHRoaXMub3B0aW9ucy5vZmZzZXRcbiAgICB2YXIgb2Zmc2V0VG9wICAgID0gb2Zmc2V0LnRvcFxuICAgIHZhciBvZmZzZXRCb3R0b20gPSBvZmZzZXQuYm90dG9tXG4gICAgdmFyIHNjcm9sbEhlaWdodCA9IE1hdGgubWF4KCQoZG9jdW1lbnQpLmhlaWdodCgpLCAkKGRvY3VtZW50LmJvZHkpLmhlaWdodCgpKVxuXG4gICAgaWYgKHR5cGVvZiBvZmZzZXQgIT0gJ29iamVjdCcpICAgICAgICAgb2Zmc2V0Qm90dG9tID0gb2Zmc2V0VG9wID0gb2Zmc2V0XG4gICAgaWYgKHR5cGVvZiBvZmZzZXRUb3AgPT0gJ2Z1bmN0aW9uJykgICAgb2Zmc2V0VG9wICAgID0gb2Zmc2V0LnRvcCh0aGlzLiRlbGVtZW50KVxuICAgIGlmICh0eXBlb2Ygb2Zmc2V0Qm90dG9tID09ICdmdW5jdGlvbicpIG9mZnNldEJvdHRvbSA9IG9mZnNldC5ib3R0b20odGhpcy4kZWxlbWVudClcblxuICAgIHZhciBhZmZpeCA9IHRoaXMuZ2V0U3RhdGUoc2Nyb2xsSGVpZ2h0LCBoZWlnaHQsIG9mZnNldFRvcCwgb2Zmc2V0Qm90dG9tKVxuXG4gICAgaWYgKHRoaXMuYWZmaXhlZCAhPSBhZmZpeCkge1xuICAgICAgaWYgKHRoaXMudW5waW4gIT0gbnVsbCkgdGhpcy4kZWxlbWVudC5jc3MoJ3RvcCcsICcnKVxuXG4gICAgICB2YXIgYWZmaXhUeXBlID0gJ2FmZml4JyArIChhZmZpeCA/ICctJyArIGFmZml4IDogJycpXG4gICAgICB2YXIgZSAgICAgICAgID0gJC5FdmVudChhZmZpeFR5cGUgKyAnLmJzLmFmZml4JylcblxuICAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKGUpXG5cbiAgICAgIGlmIChlLmlzRGVmYXVsdFByZXZlbnRlZCgpKSByZXR1cm5cblxuICAgICAgdGhpcy5hZmZpeGVkID0gYWZmaXhcbiAgICAgIHRoaXMudW5waW4gPSBhZmZpeCA9PSAnYm90dG9tJyA/IHRoaXMuZ2V0UGlubmVkT2Zmc2V0KCkgOiBudWxsXG5cbiAgICAgIHRoaXMuJGVsZW1lbnRcbiAgICAgICAgLnJlbW92ZUNsYXNzKEFmZml4LlJFU0VUKVxuICAgICAgICAuYWRkQ2xhc3MoYWZmaXhUeXBlKVxuICAgICAgICAudHJpZ2dlcihhZmZpeFR5cGUucmVwbGFjZSgnYWZmaXgnLCAnYWZmaXhlZCcpICsgJy5icy5hZmZpeCcpXG4gICAgfVxuXG4gICAgaWYgKGFmZml4ID09ICdib3R0b20nKSB7XG4gICAgICB0aGlzLiRlbGVtZW50Lm9mZnNldCh7XG4gICAgICAgIHRvcDogc2Nyb2xsSGVpZ2h0IC0gaGVpZ2h0IC0gb2Zmc2V0Qm90dG9tXG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG5cbiAgLy8gQUZGSVggUExVR0lOIERFRklOSVRJT05cbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT1cblxuICBmdW5jdGlvbiBQbHVnaW4ob3B0aW9uKSB7XG4gICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgJHRoaXMgICA9ICQodGhpcylcbiAgICAgIHZhciBkYXRhICAgID0gJHRoaXMuZGF0YSgnYnMuYWZmaXgnKVxuICAgICAgdmFyIG9wdGlvbnMgPSB0eXBlb2Ygb3B0aW9uID09ICdvYmplY3QnICYmIG9wdGlvblxuXG4gICAgICBpZiAoIWRhdGEpICR0aGlzLmRhdGEoJ2JzLmFmZml4JywgKGRhdGEgPSBuZXcgQWZmaXgodGhpcywgb3B0aW9ucykpKVxuICAgICAgaWYgKHR5cGVvZiBvcHRpb24gPT0gJ3N0cmluZycpIGRhdGFbb3B0aW9uXSgpXG4gICAgfSlcbiAgfVxuXG4gIHZhciBvbGQgPSAkLmZuLmFmZml4XG5cbiAgJC5mbi5hZmZpeCAgICAgICAgICAgICA9IFBsdWdpblxuICAkLmZuLmFmZml4LkNvbnN0cnVjdG9yID0gQWZmaXhcblxuXG4gIC8vIEFGRklYIE5PIENPTkZMSUNUXG4gIC8vID09PT09PT09PT09PT09PT09XG5cbiAgJC5mbi5hZmZpeC5ub0NvbmZsaWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICQuZm4uYWZmaXggPSBvbGRcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cblxuICAvLyBBRkZJWCBEQVRBLUFQSVxuICAvLyA9PT09PT09PT09PT09PVxuXG4gICQod2luZG93KS5vbignbG9hZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAkKCdbZGF0YS1zcHk9XCJhZmZpeFwiXScpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgdmFyICRzcHkgPSAkKHRoaXMpXG4gICAgICB2YXIgZGF0YSA9ICRzcHkuZGF0YSgpXG5cbiAgICAgIGRhdGEub2Zmc2V0ID0gZGF0YS5vZmZzZXQgfHwge31cblxuICAgICAgaWYgKGRhdGEub2Zmc2V0Qm90dG9tICE9IG51bGwpIGRhdGEub2Zmc2V0LmJvdHRvbSA9IGRhdGEub2Zmc2V0Qm90dG9tXG4gICAgICBpZiAoZGF0YS5vZmZzZXRUb3AgICAgIT0gbnVsbCkgZGF0YS5vZmZzZXQudG9wICAgID0gZGF0YS5vZmZzZXRUb3BcblxuICAgICAgUGx1Z2luLmNhbGwoJHNweSwgZGF0YSlcbiAgICB9KVxuICB9KVxuXG59KGpRdWVyeSk7XG4iLCIvLyB8LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIHwgRmxleHkgaGVhZGVyXG4vLyB8LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIHxcbi8vIHwgVGhpcyBqUXVlcnkgc2NyaXB0IGlzIHdyaXR0ZW4gYnlcbi8vIHxcbi8vIHwgTW9ydGVuIE5pc3NlblxuLy8gfCBoamVtbWVzaWRla29uZ2VuLmRrXG4vLyB8XG5cbnZhciBmbGV4eV9oZWFkZXIgPSAoZnVuY3Rpb24gKCQpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgcHViID0ge30sXG4gICAgICAgICRoZWFkZXJfc3RhdGljID0gJCgnLmZsZXh5LWhlYWRlci0tc3RhdGljJyksXG4gICAgICAgICRoZWFkZXJfc3RpY2t5ID0gJCgnLmZsZXh5LWhlYWRlci0tc3RpY2t5JyksXG4gICAgICAgIG9wdGlvbnMgPSB7XG4gICAgICAgICAgICB1cGRhdGVfaW50ZXJ2YWw6IDEwMCxcbiAgICAgICAgICAgIHRvbGVyYW5jZToge1xuICAgICAgICAgICAgICAgIHVwd2FyZDogMjAsXG4gICAgICAgICAgICAgICAgZG93bndhcmQ6IDEwXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb2Zmc2V0OiBfZ2V0X29mZnNldF9mcm9tX2VsZW1lbnRzX2JvdHRvbSgkaGVhZGVyX3N0YXRpYyksXG4gICAgICAgICAgICBjbGFzc2VzOiB7XG4gICAgICAgICAgICAgICAgcGlubmVkOiBcImZsZXh5LWhlYWRlci0tcGlubmVkXCIsXG4gICAgICAgICAgICAgICAgdW5waW5uZWQ6IFwiZmxleHktaGVhZGVyLS11bnBpbm5lZFwiXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHdhc19zY3JvbGxlZCA9IGZhbHNlLFxuICAgICAgICBsYXN0X2Rpc3RhbmNlX2Zyb21fdG9wID0gMDtcblxuICAgIC8qKlxuICAgICAqIEluc3RhbnRpYXRlXG4gICAgICovXG4gICAgcHViLmluaXQgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICByZWdpc3RlckV2ZW50SGFuZGxlcnMoKTtcbiAgICAgICAgcmVnaXN0ZXJCb290RXZlbnRIYW5kbGVycygpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBSZWdpc3RlciBib290IGV2ZW50IGhhbmRsZXJzXG4gICAgICovXG4gICAgZnVuY3Rpb24gcmVnaXN0ZXJCb290RXZlbnRIYW5kbGVycygpIHtcbiAgICAgICAgJGhlYWRlcl9zdGlja3kuYWRkQ2xhc3Mob3B0aW9ucy5jbGFzc2VzLnVucGlubmVkKTtcblxuICAgICAgICBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgaWYgKHdhc19zY3JvbGxlZCkge1xuICAgICAgICAgICAgICAgIGRvY3VtZW50X3dhc19zY3JvbGxlZCgpO1xuXG4gICAgICAgICAgICAgICAgd2FzX3Njcm9sbGVkID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIG9wdGlvbnMudXBkYXRlX2ludGVydmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZWdpc3RlciBldmVudCBoYW5kbGVyc1xuICAgICAqL1xuICAgIGZ1bmN0aW9uIHJlZ2lzdGVyRXZlbnRIYW5kbGVycygpIHtcbiAgICAgICAgJCh3aW5kb3cpLnNjcm9sbChmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgd2FzX3Njcm9sbGVkID0gdHJ1ZTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IG9mZnNldCBmcm9tIGVsZW1lbnQgYm90dG9tXG4gICAgICovXG4gICAgZnVuY3Rpb24gX2dldF9vZmZzZXRfZnJvbV9lbGVtZW50c19ib3R0b20oJGVsZW1lbnQpIHtcbiAgICAgICAgdmFyIGVsZW1lbnRfaGVpZ2h0ID0gJGVsZW1lbnQub3V0ZXJIZWlnaHQodHJ1ZSksXG4gICAgICAgICAgICBlbGVtZW50X29mZnNldCA9ICRlbGVtZW50Lm9mZnNldCgpLnRvcDtcblxuICAgICAgICByZXR1cm4gKGVsZW1lbnRfaGVpZ2h0ICsgZWxlbWVudF9vZmZzZXQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERvY3VtZW50IHdhcyBzY3JvbGxlZFxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGRvY3VtZW50X3dhc19zY3JvbGxlZCgpIHtcbiAgICAgICAgdmFyIGN1cnJlbnRfZGlzdGFuY2VfZnJvbV90b3AgPSAkKHdpbmRvdykuc2Nyb2xsVG9wKCk7XG5cbiAgICAgICAgLy8gSWYgcGFzdCBvZmZzZXRcbiAgICAgICAgaWYgKGN1cnJlbnRfZGlzdGFuY2VfZnJvbV90b3AgPj0gb3B0aW9ucy5vZmZzZXQpIHtcblxuICAgICAgICAgICAgLy8gRG93bndhcmRzIHNjcm9sbFxuICAgICAgICAgICAgaWYgKGN1cnJlbnRfZGlzdGFuY2VfZnJvbV90b3AgPiBsYXN0X2Rpc3RhbmNlX2Zyb21fdG9wKSB7XG5cbiAgICAgICAgICAgICAgICAvLyBPYmV5IHRoZSBkb3dud2FyZCB0b2xlcmFuY2VcbiAgICAgICAgICAgICAgICBpZiAoTWF0aC5hYnMoY3VycmVudF9kaXN0YW5jZV9mcm9tX3RvcCAtIGxhc3RfZGlzdGFuY2VfZnJvbV90b3ApIDw9IG9wdGlvbnMudG9sZXJhbmNlLmRvd253YXJkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAkaGVhZGVyX3N0aWNreS5yZW1vdmVDbGFzcyhvcHRpb25zLmNsYXNzZXMucGlubmVkKS5hZGRDbGFzcyhvcHRpb25zLmNsYXNzZXMudW5waW5uZWQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBVcHdhcmRzIHNjcm9sbFxuICAgICAgICAgICAgZWxzZSB7XG5cbiAgICAgICAgICAgICAgICAvLyBPYmV5IHRoZSB1cHdhcmQgdG9sZXJhbmNlXG4gICAgICAgICAgICAgICAgaWYgKE1hdGguYWJzKGN1cnJlbnRfZGlzdGFuY2VfZnJvbV90b3AgLSBsYXN0X2Rpc3RhbmNlX2Zyb21fdG9wKSA8PSBvcHRpb25zLnRvbGVyYW5jZS51cHdhcmQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIFdlIGFyZSBub3Qgc2Nyb2xsZWQgcGFzdCB0aGUgZG9jdW1lbnQgd2hpY2ggaXMgcG9zc2libGUgb24gdGhlIE1hY1xuICAgICAgICAgICAgICAgIGlmICgoY3VycmVudF9kaXN0YW5jZV9mcm9tX3RvcCArICQod2luZG93KS5oZWlnaHQoKSkgPCAkKGRvY3VtZW50KS5oZWlnaHQoKSkge1xuICAgICAgICAgICAgICAgICAgICAkaGVhZGVyX3N0aWNreS5yZW1vdmVDbGFzcyhvcHRpb25zLmNsYXNzZXMudW5waW5uZWQpLmFkZENsYXNzKG9wdGlvbnMuY2xhc3Nlcy5waW5uZWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE5vdCBwYXN0IG9mZnNldFxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICRoZWFkZXJfc3RpY2t5LnJlbW92ZUNsYXNzKG9wdGlvbnMuY2xhc3Nlcy5waW5uZWQpLmFkZENsYXNzKG9wdGlvbnMuY2xhc3Nlcy51bnBpbm5lZCk7XG4gICAgICAgIH1cblxuICAgICAgICBsYXN0X2Rpc3RhbmNlX2Zyb21fdG9wID0gY3VycmVudF9kaXN0YW5jZV9mcm9tX3RvcDtcbiAgICB9XG5cbiAgICByZXR1cm4gcHViO1xufSkoalF1ZXJ5KTtcbiIsIi8vIHwtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gfCBGbGV4eSBuYXZpZ2F0aW9uXG4vLyB8LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIHxcbi8vIHwgVGhpcyBqUXVlcnkgc2NyaXB0IGlzIHdyaXR0ZW4gYnlcbi8vIHxcbi8vIHwgTW9ydGVuIE5pc3NlblxuLy8gfCBoamVtbWVzaWRla29uZ2VuLmRrXG4vLyB8XG5cbnZhciBmbGV4eV9uYXZpZ2F0aW9uID0gKGZ1bmN0aW9uICgkKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIHB1YiA9IHt9LFxuICAgICAgICBsYXlvdXRfY2xhc3NlcyA9IHtcbiAgICAgICAgICAgICduYXZpZ2F0aW9uJzogJy5mbGV4eS1uYXZpZ2F0aW9uJyxcbiAgICAgICAgICAgICdvYmZ1c2NhdG9yJzogJy5mbGV4eS1uYXZpZ2F0aW9uX19vYmZ1c2NhdG9yJyxcbiAgICAgICAgICAgICdkcm9wZG93bic6ICcuZmxleHktbmF2aWdhdGlvbl9faXRlbS0tZHJvcGRvd24nLFxuICAgICAgICAgICAgJ2Ryb3Bkb3duX21lZ2FtZW51JzogJy5mbGV4eS1uYXZpZ2F0aW9uX19pdGVtX19kcm9wZG93bi1tZWdhbWVudScsXG5cbiAgICAgICAgICAgICdpc191cGdyYWRlZCc6ICdpcy11cGdyYWRlZCcsXG4gICAgICAgICAgICAnbmF2aWdhdGlvbl9oYXNfbWVnYW1lbnUnOiAnaGFzLW1lZ2FtZW51JyxcbiAgICAgICAgICAgICdkcm9wZG93bl9oYXNfbWVnYW1lbnUnOiAnZmxleHktbmF2aWdhdGlvbl9faXRlbS0tZHJvcGRvd24td2l0aC1tZWdhbWVudScsXG4gICAgICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBJbnN0YW50aWF0ZVxuICAgICAqL1xuICAgIHB1Yi5pbml0ID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgcmVnaXN0ZXJFdmVudEhhbmRsZXJzKCk7XG4gICAgICAgIHJlZ2lzdGVyQm9vdEV2ZW50SGFuZGxlcnMoKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUmVnaXN0ZXIgYm9vdCBldmVudCBoYW5kbGVyc1xuICAgICAqL1xuICAgIGZ1bmN0aW9uIHJlZ2lzdGVyQm9vdEV2ZW50SGFuZGxlcnMoKSB7XG5cbiAgICAgICAgLy8gVXBncmFkZVxuICAgICAgICB1cGdyYWRlKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVnaXN0ZXIgZXZlbnQgaGFuZGxlcnNcbiAgICAgKi9cbiAgICBmdW5jdGlvbiByZWdpc3RlckV2ZW50SGFuZGxlcnMoKSB7fVxuXG4gICAgLyoqXG4gICAgICogVXBncmFkZSBlbGVtZW50cy5cbiAgICAgKiBBZGQgY2xhc3NlcyB0byBlbGVtZW50cywgYmFzZWQgdXBvbiBhdHRhY2hlZCBjbGFzc2VzLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHVwZ3JhZGUoKSB7XG4gICAgICAgIHZhciAkbmF2aWdhdGlvbnMgPSAkKGxheW91dF9jbGFzc2VzLm5hdmlnYXRpb24pO1xuXG4gICAgICAgIC8vIE5hdmlnYXRpb25zXG4gICAgICAgIGlmICgkbmF2aWdhdGlvbnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgJG5hdmlnYXRpb25zLmVhY2goZnVuY3Rpb24oaW5kZXgsIGVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICB2YXIgJG5hdmlnYXRpb24gPSAkKHRoaXMpLFxuICAgICAgICAgICAgICAgICAgICAkbWVnYW1lbnVzID0gJG5hdmlnYXRpb24uZmluZChsYXlvdXRfY2xhc3Nlcy5kcm9wZG93bl9tZWdhbWVudSksXG4gICAgICAgICAgICAgICAgICAgICRkcm9wZG93bl9tZWdhbWVudSA9ICRuYXZpZ2F0aW9uLmZpbmQobGF5b3V0X2NsYXNzZXMuZHJvcGRvd25faGFzX21lZ2FtZW51KTtcblxuICAgICAgICAgICAgICAgIC8vIEhhcyBhbHJlYWR5IGJlZW4gdXBncmFkZWRcbiAgICAgICAgICAgICAgICBpZiAoJG5hdmlnYXRpb24uaGFzQ2xhc3MobGF5b3V0X2NsYXNzZXMuaXNfdXBncmFkZWQpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBIYXMgbWVnYW1lbnVcbiAgICAgICAgICAgICAgICBpZiAoJG1lZ2FtZW51cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICRuYXZpZ2F0aW9uLmFkZENsYXNzKGxheW91dF9jbGFzc2VzLm5hdmlnYXRpb25faGFzX21lZ2FtZW51KTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBSdW4gdGhyb3VnaCBhbGwgbWVnYW1lbnVzXG4gICAgICAgICAgICAgICAgICAgICRtZWdhbWVudXMuZWFjaChmdW5jdGlvbihpbmRleCwgZWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyICRtZWdhbWVudSA9ICQodGhpcyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFzX29iZnVzY2F0b3IgPSAkKCdodG1sJykuaGFzQ2xhc3MoJ2hhcy1vYmZ1c2NhdG9yJykgPyB0cnVlIDogZmFsc2U7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICRtZWdhbWVudS5wYXJlbnRzKGxheW91dF9jbGFzc2VzLmRyb3Bkb3duKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hZGRDbGFzcyhsYXlvdXRfY2xhc3Nlcy5kcm9wZG93bl9oYXNfbWVnYW1lbnUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmhvdmVyKGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChoYXNfb2JmdXNjYXRvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2JmdXNjYXRvci5zaG93KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChoYXNfb2JmdXNjYXRvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2JmdXNjYXRvci5oaWRlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gSXMgdXBncmFkZWRcbiAgICAgICAgICAgICAgICAkbmF2aWdhdGlvbi5hZGRDbGFzcyhsYXlvdXRfY2xhc3Nlcy5pc191cGdyYWRlZCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBwdWI7XG59KShqUXVlcnkpO1xuIiwiLyohIHNpZHIgLSB2Mi4yLjEgLSAyMDE2LTAyLTE3XG4gKiBodHRwOi8vd3d3LmJlcnJpYXJ0LmNvbS9zaWRyL1xuICogQ29weXJpZ2h0IChjKSAyMDEzLTIwMTYgQWxiZXJ0byBWYXJlbGE7IExpY2Vuc2VkIE1JVCAqL1xuXG4oZnVuY3Rpb24gKCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgdmFyIGJhYmVsSGVscGVycyA9IHt9O1xuXG4gIGJhYmVsSGVscGVycy5jbGFzc0NhbGxDaGVjayA9IGZ1bmN0aW9uIChpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHtcbiAgICBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTtcbiAgICB9XG4gIH07XG5cbiAgYmFiZWxIZWxwZXJzLmNyZWF0ZUNsYXNzID0gZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldO1xuICAgICAgICBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7XG4gICAgICAgIGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTtcbiAgICAgICAgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7XG4gICAgICBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpO1xuICAgICAgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7XG4gICAgICByZXR1cm4gQ29uc3RydWN0b3I7XG4gICAgfTtcbiAgfSgpO1xuXG4gIGJhYmVsSGVscGVycztcblxuICB2YXIgc2lkclN0YXR1cyA9IHtcbiAgICBtb3Zpbmc6IGZhbHNlLFxuICAgIG9wZW5lZDogZmFsc2VcbiAgfTtcblxuICB2YXIgaGVscGVyID0ge1xuICAgIC8vIENoZWNrIGZvciB2YWxpZHMgdXJsc1xuICAgIC8vIEZyb20gOiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzU3MTcwOTMvY2hlY2staWYtYS1qYXZhc2NyaXB0LXN0cmluZy1pcy1hbi11cmxcblxuICAgIGlzVXJsOiBmdW5jdGlvbiBpc1VybChzdHIpIHtcbiAgICAgIHZhciBwYXR0ZXJuID0gbmV3IFJlZ0V4cCgnXihodHRwcz86XFxcXC9cXFxcLyk/JyArIC8vIHByb3RvY29sXG4gICAgICAnKCgoW2EtelxcXFxkXShbYS16XFxcXGQtXSpbYS16XFxcXGRdKSopXFxcXC4/KStbYS16XXsyLH18JyArIC8vIGRvbWFpbiBuYW1lXG4gICAgICAnKChcXFxcZHsxLDN9XFxcXC4pezN9XFxcXGR7MSwzfSkpJyArIC8vIE9SIGlwICh2NCkgYWRkcmVzc1xuICAgICAgJyhcXFxcOlxcXFxkKyk/KFxcXFwvWy1hLXpcXFxcZCVfLn4rXSopKicgKyAvLyBwb3J0IGFuZCBwYXRoXG4gICAgICAnKFxcXFw/WzsmYS16XFxcXGQlXy5+Kz0tXSopPycgKyAvLyBxdWVyeSBzdHJpbmdcbiAgICAgICcoXFxcXCNbLWEtelxcXFxkX10qKT8kJywgJ2knKTsgLy8gZnJhZ21lbnQgbG9jYXRvclxuXG4gICAgICBpZiAocGF0dGVybi50ZXN0KHN0cikpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfSxcblxuXG4gICAgLy8gQWRkIHNpZHIgcHJlZml4ZXNcbiAgICBhZGRQcmVmaXhlczogZnVuY3Rpb24gYWRkUHJlZml4ZXMoJGVsZW1lbnQpIHtcbiAgICAgIHRoaXMuYWRkUHJlZml4KCRlbGVtZW50LCAnaWQnKTtcbiAgICAgIHRoaXMuYWRkUHJlZml4KCRlbGVtZW50LCAnY2xhc3MnKTtcbiAgICAgICRlbGVtZW50LnJlbW92ZUF0dHIoJ3N0eWxlJyk7XG4gICAgfSxcbiAgICBhZGRQcmVmaXg6IGZ1bmN0aW9uIGFkZFByZWZpeCgkZWxlbWVudCwgYXR0cmlidXRlKSB7XG4gICAgICB2YXIgdG9SZXBsYWNlID0gJGVsZW1lbnQuYXR0cihhdHRyaWJ1dGUpO1xuXG4gICAgICBpZiAodHlwZW9mIHRvUmVwbGFjZSA9PT0gJ3N0cmluZycgJiYgdG9SZXBsYWNlICE9PSAnJyAmJiB0b1JlcGxhY2UgIT09ICdzaWRyLWlubmVyJykge1xuICAgICAgICAkZWxlbWVudC5hdHRyKGF0dHJpYnV0ZSwgdG9SZXBsYWNlLnJlcGxhY2UoLyhbQS1aYS16MC05Xy5cXC1dKykvZywgJ3NpZHItJyArIGF0dHJpYnV0ZSArICctJDEnKSk7XG4gICAgICB9XG4gICAgfSxcblxuXG4gICAgLy8gQ2hlY2sgaWYgdHJhbnNpdGlvbnMgaXMgc3VwcG9ydGVkXG4gICAgdHJhbnNpdGlvbnM6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBib2R5ID0gZG9jdW1lbnQuYm9keSB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsXG4gICAgICAgICAgc3R5bGUgPSBib2R5LnN0eWxlLFxuICAgICAgICAgIHN1cHBvcnRlZCA9IGZhbHNlLFxuICAgICAgICAgIHByb3BlcnR5ID0gJ3RyYW5zaXRpb24nO1xuXG4gICAgICBpZiAocHJvcGVydHkgaW4gc3R5bGUpIHtcbiAgICAgICAgc3VwcG9ydGVkID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgdmFyIHByZWZpeGVzID0gWydtb3onLCAnd2Via2l0JywgJ28nLCAnbXMnXSxcbiAgICAgICAgICAgICAgcHJlZml4ID0gdW5kZWZpbmVkLFxuICAgICAgICAgICAgICBpID0gdW5kZWZpbmVkO1xuXG4gICAgICAgICAgcHJvcGVydHkgPSBwcm9wZXJ0eS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHByb3BlcnR5LnN1YnN0cigxKTtcbiAgICAgICAgICBzdXBwb3J0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgcHJlZml4ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgcHJlZml4ID0gcHJlZml4ZXNbaV07XG4gICAgICAgICAgICAgIGlmIChwcmVmaXggKyBwcm9wZXJ0eSBpbiBzdHlsZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9KCk7XG4gICAgICAgICAgcHJvcGVydHkgPSBzdXBwb3J0ZWQgPyAnLScgKyBwcmVmaXgudG9Mb3dlckNhc2UoKSArICctJyArIHByb3BlcnR5LnRvTG93ZXJDYXNlKCkgOiBudWxsO1xuICAgICAgICB9KSgpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdXBwb3J0ZWQ6IHN1cHBvcnRlZCxcbiAgICAgICAgcHJvcGVydHk6IHByb3BlcnR5XG4gICAgICB9O1xuICAgIH0oKVxuICB9O1xuXG4gIHZhciAkJDIgPSBqUXVlcnk7XG5cbiAgdmFyIGJvZHlBbmltYXRpb25DbGFzcyA9ICdzaWRyLWFuaW1hdGluZyc7XG4gIHZhciBvcGVuQWN0aW9uID0gJ29wZW4nO1xuICB2YXIgY2xvc2VBY3Rpb24gPSAnY2xvc2UnO1xuICB2YXIgdHJhbnNpdGlvbkVuZEV2ZW50ID0gJ3dlYmtpdFRyYW5zaXRpb25FbmQgb3RyYW5zaXRpb25lbmQgb1RyYW5zaXRpb25FbmQgbXNUcmFuc2l0aW9uRW5kIHRyYW5zaXRpb25lbmQnO1xuICB2YXIgTWVudSA9IGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBNZW51KG5hbWUpIHtcbiAgICAgIGJhYmVsSGVscGVycy5jbGFzc0NhbGxDaGVjayh0aGlzLCBNZW51KTtcblxuICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgIHRoaXMuaXRlbSA9ICQkMignIycgKyBuYW1lKTtcbiAgICAgIHRoaXMub3BlbkNsYXNzID0gbmFtZSA9PT0gJ3NpZHInID8gJ3NpZHItb3BlbicgOiAnc2lkci1vcGVuICcgKyBuYW1lICsgJy1vcGVuJztcbiAgICAgIHRoaXMubWVudVdpZHRoID0gdGhpcy5pdGVtLm91dGVyV2lkdGgodHJ1ZSk7XG4gICAgICB0aGlzLnNwZWVkID0gdGhpcy5pdGVtLmRhdGEoJ3NwZWVkJyk7XG4gICAgICB0aGlzLnNpZGUgPSB0aGlzLml0ZW0uZGF0YSgnc2lkZScpO1xuICAgICAgdGhpcy5kaXNwbGFjZSA9IHRoaXMuaXRlbS5kYXRhKCdkaXNwbGFjZScpO1xuICAgICAgdGhpcy50aW1pbmcgPSB0aGlzLml0ZW0uZGF0YSgndGltaW5nJyk7XG4gICAgICB0aGlzLm1ldGhvZCA9IHRoaXMuaXRlbS5kYXRhKCdtZXRob2QnKTtcbiAgICAgIHRoaXMub25PcGVuQ2FsbGJhY2sgPSB0aGlzLml0ZW0uZGF0YSgnb25PcGVuJyk7XG4gICAgICB0aGlzLm9uQ2xvc2VDYWxsYmFjayA9IHRoaXMuaXRlbS5kYXRhKCdvbkNsb3NlJyk7XG4gICAgICB0aGlzLm9uT3BlbkVuZENhbGxiYWNrID0gdGhpcy5pdGVtLmRhdGEoJ29uT3BlbkVuZCcpO1xuICAgICAgdGhpcy5vbkNsb3NlRW5kQ2FsbGJhY2sgPSB0aGlzLml0ZW0uZGF0YSgnb25DbG9zZUVuZCcpO1xuICAgICAgdGhpcy5ib2R5ID0gJCQyKHRoaXMuaXRlbS5kYXRhKCdib2R5JykpO1xuICAgIH1cblxuICAgIGJhYmVsSGVscGVycy5jcmVhdGVDbGFzcyhNZW51LCBbe1xuICAgICAga2V5OiAnZ2V0QW5pbWF0aW9uJyxcbiAgICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRBbmltYXRpb24oYWN0aW9uLCBlbGVtZW50KSB7XG4gICAgICAgIHZhciBhbmltYXRpb24gPSB7fSxcbiAgICAgICAgICAgIHByb3AgPSB0aGlzLnNpZGU7XG5cbiAgICAgICAgaWYgKGFjdGlvbiA9PT0gJ29wZW4nICYmIGVsZW1lbnQgPT09ICdib2R5Jykge1xuICAgICAgICAgIGFuaW1hdGlvbltwcm9wXSA9IHRoaXMubWVudVdpZHRoICsgJ3B4JztcbiAgICAgICAgfSBlbHNlIGlmIChhY3Rpb24gPT09ICdjbG9zZScgJiYgZWxlbWVudCA9PT0gJ21lbnUnKSB7XG4gICAgICAgICAgYW5pbWF0aW9uW3Byb3BdID0gJy0nICsgdGhpcy5tZW51V2lkdGggKyAncHgnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGFuaW1hdGlvbltwcm9wXSA9IDA7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYW5pbWF0aW9uO1xuICAgICAgfVxuICAgIH0sIHtcbiAgICAgIGtleTogJ3ByZXBhcmVCb2R5JyxcbiAgICAgIHZhbHVlOiBmdW5jdGlvbiBwcmVwYXJlQm9keShhY3Rpb24pIHtcbiAgICAgICAgdmFyIHByb3AgPSBhY3Rpb24gPT09ICdvcGVuJyA/ICdoaWRkZW4nIDogJyc7XG5cbiAgICAgICAgLy8gUHJlcGFyZSBwYWdlIGlmIGNvbnRhaW5lciBpcyBib2R5XG4gICAgICAgIGlmICh0aGlzLmJvZHkuaXMoJ2JvZHknKSkge1xuICAgICAgICAgIHZhciAkaHRtbCA9ICQkMignaHRtbCcpLFxuICAgICAgICAgICAgICBzY3JvbGxUb3AgPSAkaHRtbC5zY3JvbGxUb3AoKTtcblxuICAgICAgICAgICRodG1sLmNzcygnb3ZlcmZsb3cteCcsIHByb3ApLnNjcm9sbFRvcChzY3JvbGxUb3ApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSwge1xuICAgICAga2V5OiAnb3BlbkJvZHknLFxuICAgICAgdmFsdWU6IGZ1bmN0aW9uIG9wZW5Cb2R5KCkge1xuICAgICAgICBpZiAodGhpcy5kaXNwbGFjZSkge1xuICAgICAgICAgIHZhciB0cmFuc2l0aW9ucyA9IGhlbHBlci50cmFuc2l0aW9ucyxcbiAgICAgICAgICAgICAgJGJvZHkgPSB0aGlzLmJvZHk7XG5cbiAgICAgICAgICBpZiAodHJhbnNpdGlvbnMuc3VwcG9ydGVkKSB7XG4gICAgICAgICAgICAkYm9keS5jc3ModHJhbnNpdGlvbnMucHJvcGVydHksIHRoaXMuc2lkZSArICcgJyArIHRoaXMuc3BlZWQgLyAxMDAwICsgJ3MgJyArIHRoaXMudGltaW5nKS5jc3ModGhpcy5zaWRlLCAwKS5jc3Moe1xuICAgICAgICAgICAgICB3aWR0aDogJGJvZHkud2lkdGgoKSxcbiAgICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZSdcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgJGJvZHkuY3NzKHRoaXMuc2lkZSwgdGhpcy5tZW51V2lkdGggKyAncHgnKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIGJvZHlBbmltYXRpb24gPSB0aGlzLmdldEFuaW1hdGlvbihvcGVuQWN0aW9uLCAnYm9keScpO1xuXG4gICAgICAgICAgICAkYm9keS5jc3Moe1xuICAgICAgICAgICAgICB3aWR0aDogJGJvZHkud2lkdGgoKSxcbiAgICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZSdcbiAgICAgICAgICAgIH0pLmFuaW1hdGUoYm9keUFuaW1hdGlvbiwge1xuICAgICAgICAgICAgICBxdWV1ZTogZmFsc2UsXG4gICAgICAgICAgICAgIGR1cmF0aW9uOiB0aGlzLnNwZWVkXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LCB7XG4gICAgICBrZXk6ICdvbkNsb3NlQm9keScsXG4gICAgICB2YWx1ZTogZnVuY3Rpb24gb25DbG9zZUJvZHkoKSB7XG4gICAgICAgIHZhciB0cmFuc2l0aW9ucyA9IGhlbHBlci50cmFuc2l0aW9ucyxcbiAgICAgICAgICAgIHJlc2V0U3R5bGVzID0ge1xuICAgICAgICAgIHdpZHRoOiAnJyxcbiAgICAgICAgICBwb3NpdGlvbjogJycsXG4gICAgICAgICAgcmlnaHQ6ICcnLFxuICAgICAgICAgIGxlZnQ6ICcnXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKHRyYW5zaXRpb25zLnN1cHBvcnRlZCkge1xuICAgICAgICAgIHJlc2V0U3R5bGVzW3RyYW5zaXRpb25zLnByb3BlcnR5XSA9ICcnO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5ib2R5LmNzcyhyZXNldFN0eWxlcykudW5iaW5kKHRyYW5zaXRpb25FbmRFdmVudCk7XG4gICAgICB9XG4gICAgfSwge1xuICAgICAga2V5OiAnY2xvc2VCb2R5JyxcbiAgICAgIHZhbHVlOiBmdW5jdGlvbiBjbG9zZUJvZHkoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAgICAgaWYgKHRoaXMuZGlzcGxhY2UpIHtcbiAgICAgICAgICBpZiAoaGVscGVyLnRyYW5zaXRpb25zLnN1cHBvcnRlZCkge1xuICAgICAgICAgICAgdGhpcy5ib2R5LmNzcyh0aGlzLnNpZGUsIDApLm9uZSh0cmFuc2l0aW9uRW5kRXZlbnQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgX3RoaXMub25DbG9zZUJvZHkoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgYm9keUFuaW1hdGlvbiA9IHRoaXMuZ2V0QW5pbWF0aW9uKGNsb3NlQWN0aW9uLCAnYm9keScpO1xuXG4gICAgICAgICAgICB0aGlzLmJvZHkuYW5pbWF0ZShib2R5QW5pbWF0aW9uLCB7XG4gICAgICAgICAgICAgIHF1ZXVlOiBmYWxzZSxcbiAgICAgICAgICAgICAgZHVyYXRpb246IHRoaXMuc3BlZWQsXG4gICAgICAgICAgICAgIGNvbXBsZXRlOiBmdW5jdGlvbiBjb21wbGV0ZSgpIHtcbiAgICAgICAgICAgICAgICBfdGhpcy5vbkNsb3NlQm9keSgpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LCB7XG4gICAgICBrZXk6ICdtb3ZlQm9keScsXG4gICAgICB2YWx1ZTogZnVuY3Rpb24gbW92ZUJvZHkoYWN0aW9uKSB7XG4gICAgICAgIGlmIChhY3Rpb24gPT09IG9wZW5BY3Rpb24pIHtcbiAgICAgICAgICB0aGlzLm9wZW5Cb2R5KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5jbG9zZUJvZHkoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sIHtcbiAgICAgIGtleTogJ29uT3Blbk1lbnUnLFxuICAgICAgdmFsdWU6IGZ1bmN0aW9uIG9uT3Blbk1lbnUoY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIG5hbWUgPSB0aGlzLm5hbWU7XG5cbiAgICAgICAgc2lkclN0YXR1cy5tb3ZpbmcgPSBmYWxzZTtcbiAgICAgICAgc2lkclN0YXR1cy5vcGVuZWQgPSBuYW1lO1xuXG4gICAgICAgIHRoaXMuaXRlbS51bmJpbmQodHJhbnNpdGlvbkVuZEV2ZW50KTtcblxuICAgICAgICB0aGlzLmJvZHkucmVtb3ZlQ2xhc3MoYm9keUFuaW1hdGlvbkNsYXNzKS5hZGRDbGFzcyh0aGlzLm9wZW5DbGFzcyk7XG5cbiAgICAgICAgdGhpcy5vbk9wZW5FbmRDYWxsYmFjaygpO1xuXG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICBjYWxsYmFjayhuYW1lKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sIHtcbiAgICAgIGtleTogJ29wZW5NZW51JyxcbiAgICAgIHZhbHVlOiBmdW5jdGlvbiBvcGVuTWVudShjYWxsYmFjaykge1xuICAgICAgICB2YXIgX3RoaXMyID0gdGhpcztcblxuICAgICAgICB2YXIgJGl0ZW0gPSB0aGlzLml0ZW07XG5cbiAgICAgICAgaWYgKGhlbHBlci50cmFuc2l0aW9ucy5zdXBwb3J0ZWQpIHtcbiAgICAgICAgICAkaXRlbS5jc3ModGhpcy5zaWRlLCAwKS5vbmUodHJhbnNpdGlvbkVuZEV2ZW50LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBfdGhpczIub25PcGVuTWVudShjYWxsYmFjayk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIG1lbnVBbmltYXRpb24gPSB0aGlzLmdldEFuaW1hdGlvbihvcGVuQWN0aW9uLCAnbWVudScpO1xuXG4gICAgICAgICAgJGl0ZW0uY3NzKCdkaXNwbGF5JywgJ2Jsb2NrJykuYW5pbWF0ZShtZW51QW5pbWF0aW9uLCB7XG4gICAgICAgICAgICBxdWV1ZTogZmFsc2UsXG4gICAgICAgICAgICBkdXJhdGlvbjogdGhpcy5zcGVlZCxcbiAgICAgICAgICAgIGNvbXBsZXRlOiBmdW5jdGlvbiBjb21wbGV0ZSgpIHtcbiAgICAgICAgICAgICAgX3RoaXMyLm9uT3Blbk1lbnUoY2FsbGJhY2spO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSwge1xuICAgICAga2V5OiAnb25DbG9zZU1lbnUnLFxuICAgICAgdmFsdWU6IGZ1bmN0aW9uIG9uQ2xvc2VNZW51KGNhbGxiYWNrKSB7XG4gICAgICAgIHRoaXMuaXRlbS5jc3Moe1xuICAgICAgICAgIGxlZnQ6ICcnLFxuICAgICAgICAgIHJpZ2h0OiAnJ1xuICAgICAgICB9KS51bmJpbmQodHJhbnNpdGlvbkVuZEV2ZW50KTtcbiAgICAgICAgJCQyKCdodG1sJykuY3NzKCdvdmVyZmxvdy14JywgJycpO1xuXG4gICAgICAgIHNpZHJTdGF0dXMubW92aW5nID0gZmFsc2U7XG4gICAgICAgIHNpZHJTdGF0dXMub3BlbmVkID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5ib2R5LnJlbW92ZUNsYXNzKGJvZHlBbmltYXRpb25DbGFzcykucmVtb3ZlQ2xhc3ModGhpcy5vcGVuQ2xhc3MpO1xuXG4gICAgICAgIHRoaXMub25DbG9zZUVuZENhbGxiYWNrKCk7XG5cbiAgICAgICAgLy8gQ2FsbGJhY2tcbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIGNhbGxiYWNrKG5hbWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSwge1xuICAgICAga2V5OiAnY2xvc2VNZW51JyxcbiAgICAgIHZhbHVlOiBmdW5jdGlvbiBjbG9zZU1lbnUoY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIF90aGlzMyA9IHRoaXM7XG5cbiAgICAgICAgdmFyIGl0ZW0gPSB0aGlzLml0ZW07XG5cbiAgICAgICAgaWYgKGhlbHBlci50cmFuc2l0aW9ucy5zdXBwb3J0ZWQpIHtcbiAgICAgICAgICBpdGVtLmNzcyh0aGlzLnNpZGUsICcnKS5vbmUodHJhbnNpdGlvbkVuZEV2ZW50LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBfdGhpczMub25DbG9zZU1lbnUoY2FsbGJhY2spO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBtZW51QW5pbWF0aW9uID0gdGhpcy5nZXRBbmltYXRpb24oY2xvc2VBY3Rpb24sICdtZW51Jyk7XG5cbiAgICAgICAgICBpdGVtLmFuaW1hdGUobWVudUFuaW1hdGlvbiwge1xuICAgICAgICAgICAgcXVldWU6IGZhbHNlLFxuICAgICAgICAgICAgZHVyYXRpb246IHRoaXMuc3BlZWQsXG4gICAgICAgICAgICBjb21wbGV0ZTogZnVuY3Rpb24gY29tcGxldGUoKSB7XG4gICAgICAgICAgICAgIF90aGlzMy5vbkNsb3NlTWVudSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSwge1xuICAgICAga2V5OiAnbW92ZU1lbnUnLFxuICAgICAgdmFsdWU6IGZ1bmN0aW9uIG1vdmVNZW51KGFjdGlvbiwgY2FsbGJhY2spIHtcbiAgICAgICAgdGhpcy5ib2R5LmFkZENsYXNzKGJvZHlBbmltYXRpb25DbGFzcyk7XG5cbiAgICAgICAgaWYgKGFjdGlvbiA9PT0gb3BlbkFjdGlvbikge1xuICAgICAgICAgIHRoaXMub3Blbk1lbnUoY2FsbGJhY2spO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuY2xvc2VNZW51KGNhbGxiYWNrKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sIHtcbiAgICAgIGtleTogJ21vdmUnLFxuICAgICAgdmFsdWU6IGZ1bmN0aW9uIG1vdmUoYWN0aW9uLCBjYWxsYmFjaykge1xuICAgICAgICAvLyBMb2NrIHNpZHJcbiAgICAgICAgc2lkclN0YXR1cy5tb3ZpbmcgPSB0cnVlO1xuXG4gICAgICAgIHRoaXMucHJlcGFyZUJvZHkoYWN0aW9uKTtcbiAgICAgICAgdGhpcy5tb3ZlQm9keShhY3Rpb24pO1xuICAgICAgICB0aGlzLm1vdmVNZW51KGFjdGlvbiwgY2FsbGJhY2spO1xuICAgICAgfVxuICAgIH0sIHtcbiAgICAgIGtleTogJ29wZW4nLFxuICAgICAgdmFsdWU6IGZ1bmN0aW9uIG9wZW4oY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIF90aGlzNCA9IHRoaXM7XG5cbiAgICAgICAgLy8gQ2hlY2sgaWYgaXMgYWxyZWFkeSBvcGVuZWQgb3IgbW92aW5nXG4gICAgICAgIGlmIChzaWRyU3RhdHVzLm9wZW5lZCA9PT0gdGhpcy5uYW1lIHx8IHNpZHJTdGF0dXMubW92aW5nKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgYW5vdGhlciBtZW51IG9wZW5lZCBjbG9zZSBmaXJzdFxuICAgICAgICBpZiAoc2lkclN0YXR1cy5vcGVuZWQgIT09IGZhbHNlKSB7XG4gICAgICAgICAgdmFyIGFscmVhZHlPcGVuZWRNZW51ID0gbmV3IE1lbnUoc2lkclN0YXR1cy5vcGVuZWQpO1xuXG4gICAgICAgICAgYWxyZWFkeU9wZW5lZE1lbnUuY2xvc2UoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgX3RoaXM0Lm9wZW4oY2FsbGJhY2spO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5tb3ZlKCdvcGVuJywgY2FsbGJhY2spO1xuXG4gICAgICAgIC8vIG9uT3BlbiBjYWxsYmFja1xuICAgICAgICB0aGlzLm9uT3BlbkNhbGxiYWNrKCk7XG4gICAgICB9XG4gICAgfSwge1xuICAgICAga2V5OiAnY2xvc2UnLFxuICAgICAgdmFsdWU6IGZ1bmN0aW9uIGNsb3NlKGNhbGxiYWNrKSB7XG4gICAgICAgIC8vIENoZWNrIGlmIGlzIGFscmVhZHkgY2xvc2VkIG9yIG1vdmluZ1xuICAgICAgICBpZiAoc2lkclN0YXR1cy5vcGVuZWQgIT09IHRoaXMubmFtZSB8fCBzaWRyU3RhdHVzLm1vdmluZykge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMubW92ZSgnY2xvc2UnLCBjYWxsYmFjayk7XG5cbiAgICAgICAgLy8gb25DbG9zZSBjYWxsYmFja1xuICAgICAgICB0aGlzLm9uQ2xvc2VDYWxsYmFjaygpO1xuICAgICAgfVxuICAgIH0sIHtcbiAgICAgIGtleTogJ3RvZ2dsZScsXG4gICAgICB2YWx1ZTogZnVuY3Rpb24gdG9nZ2xlKGNhbGxiYWNrKSB7XG4gICAgICAgIGlmIChzaWRyU3RhdHVzLm9wZW5lZCA9PT0gdGhpcy5uYW1lKSB7XG4gICAgICAgICAgdGhpcy5jbG9zZShjYWxsYmFjayk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5vcGVuKGNhbGxiYWNrKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1dKTtcbiAgICByZXR1cm4gTWVudTtcbiAgfSgpO1xuXG4gIHZhciAkJDEgPSBqUXVlcnk7XG5cbiAgZnVuY3Rpb24gZXhlY3V0ZShhY3Rpb24sIG5hbWUsIGNhbGxiYWNrKSB7XG4gICAgdmFyIHNpZHIgPSBuZXcgTWVudShuYW1lKTtcblxuICAgIHN3aXRjaCAoYWN0aW9uKSB7XG4gICAgICBjYXNlICdvcGVuJzpcbiAgICAgICAgc2lkci5vcGVuKGNhbGxiYWNrKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdjbG9zZSc6XG4gICAgICAgIHNpZHIuY2xvc2UoY2FsbGJhY2spO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3RvZ2dsZSc6XG4gICAgICAgIHNpZHIudG9nZ2xlKGNhbGxiYWNrKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICAkJDEuZXJyb3IoJ01ldGhvZCAnICsgYWN0aW9uICsgJyBkb2VzIG5vdCBleGlzdCBvbiBqUXVlcnkuc2lkcicpO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICB2YXIgaTtcbiAgdmFyICQgPSBqUXVlcnk7XG4gIHZhciBwdWJsaWNNZXRob2RzID0gWydvcGVuJywgJ2Nsb3NlJywgJ3RvZ2dsZSddO1xuICB2YXIgbWV0aG9kTmFtZTtcbiAgdmFyIG1ldGhvZHMgPSB7fTtcbiAgdmFyIGdldE1ldGhvZCA9IGZ1bmN0aW9uIGdldE1ldGhvZChtZXRob2ROYW1lKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChuYW1lLCBjYWxsYmFjaykge1xuICAgICAgLy8gQ2hlY2sgYXJndW1lbnRzXG4gICAgICBpZiAodHlwZW9mIG5hbWUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgY2FsbGJhY2sgPSBuYW1lO1xuICAgICAgICBuYW1lID0gJ3NpZHInO1xuICAgICAgfSBlbHNlIGlmICghbmFtZSkge1xuICAgICAgICBuYW1lID0gJ3NpZHInO1xuICAgICAgfVxuXG4gICAgICBleGVjdXRlKG1ldGhvZE5hbWUsIG5hbWUsIGNhbGxiYWNrKTtcbiAgICB9O1xuICB9O1xuICBmb3IgKGkgPSAwOyBpIDwgcHVibGljTWV0aG9kcy5sZW5ndGg7IGkrKykge1xuICAgIG1ldGhvZE5hbWUgPSBwdWJsaWNNZXRob2RzW2ldO1xuICAgIG1ldGhvZHNbbWV0aG9kTmFtZV0gPSBnZXRNZXRob2QobWV0aG9kTmFtZSk7XG4gIH1cblxuICBmdW5jdGlvbiBzaWRyKG1ldGhvZCkge1xuICAgIGlmIChtZXRob2QgPT09ICdzdGF0dXMnKSB7XG4gICAgICByZXR1cm4gc2lkclN0YXR1cztcbiAgICB9IGVsc2UgaWYgKG1ldGhvZHNbbWV0aG9kXSkge1xuICAgICAgcmV0dXJuIG1ldGhvZHNbbWV0aG9kXS5hcHBseSh0aGlzLCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBtZXRob2QgPT09ICdmdW5jdGlvbicgfHwgdHlwZW9mIG1ldGhvZCA9PT0gJ3N0cmluZycgfHwgIW1ldGhvZCkge1xuICAgICAgcmV0dXJuIG1ldGhvZHMudG9nZ2xlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICQuZXJyb3IoJ01ldGhvZCAnICsgbWV0aG9kICsgJyBkb2VzIG5vdCBleGlzdCBvbiBqUXVlcnkuc2lkcicpO1xuICAgIH1cbiAgfVxuXG4gIHZhciAkJDMgPSBqUXVlcnk7XG5cbiAgZnVuY3Rpb24gZmlsbENvbnRlbnQoJHNpZGVNZW51LCBzZXR0aW5ncykge1xuICAgIC8vIFRoZSBtZW51IGNvbnRlbnRcbiAgICBpZiAodHlwZW9mIHNldHRpbmdzLnNvdXJjZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdmFyIG5ld0NvbnRlbnQgPSBzZXR0aW5ncy5zb3VyY2UobmFtZSk7XG5cbiAgICAgICRzaWRlTWVudS5odG1sKG5ld0NvbnRlbnQpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHNldHRpbmdzLnNvdXJjZSA9PT0gJ3N0cmluZycgJiYgaGVscGVyLmlzVXJsKHNldHRpbmdzLnNvdXJjZSkpIHtcbiAgICAgICQkMy5nZXQoc2V0dGluZ3Muc291cmNlLCBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAkc2lkZU1lbnUuaHRtbChkYXRhKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHNldHRpbmdzLnNvdXJjZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHZhciBodG1sQ29udGVudCA9ICcnLFxuICAgICAgICAgIHNlbGVjdG9ycyA9IHNldHRpbmdzLnNvdXJjZS5zcGxpdCgnLCcpO1xuXG4gICAgICAkJDMuZWFjaChzZWxlY3RvcnMsIGZ1bmN0aW9uIChpbmRleCwgZWxlbWVudCkge1xuICAgICAgICBodG1sQ29udGVudCArPSAnPGRpdiBjbGFzcz1cInNpZHItaW5uZXJcIj4nICsgJCQzKGVsZW1lbnQpLmh0bWwoKSArICc8L2Rpdj4nO1xuICAgICAgfSk7XG5cbiAgICAgIC8vIFJlbmFtaW5nIGlkcyBhbmQgY2xhc3Nlc1xuICAgICAgaWYgKHNldHRpbmdzLnJlbmFtaW5nKSB7XG4gICAgICAgIHZhciAkaHRtbENvbnRlbnQgPSAkJDMoJzxkaXYgLz4nKS5odG1sKGh0bWxDb250ZW50KTtcblxuICAgICAgICAkaHRtbENvbnRlbnQuZmluZCgnKicpLmVhY2goZnVuY3Rpb24gKGluZGV4LCBlbGVtZW50KSB7XG4gICAgICAgICAgdmFyICRlbGVtZW50ID0gJCQzKGVsZW1lbnQpO1xuXG4gICAgICAgICAgaGVscGVyLmFkZFByZWZpeGVzKCRlbGVtZW50KTtcbiAgICAgICAgfSk7XG4gICAgICAgIGh0bWxDb250ZW50ID0gJGh0bWxDb250ZW50Lmh0bWwoKTtcbiAgICAgIH1cblxuICAgICAgJHNpZGVNZW51Lmh0bWwoaHRtbENvbnRlbnQpO1xuICAgIH0gZWxzZSBpZiAoc2V0dGluZ3Muc291cmNlICE9PSBudWxsKSB7XG4gICAgICAkJDMuZXJyb3IoJ0ludmFsaWQgU2lkciBTb3VyY2UnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gJHNpZGVNZW51O1xuICB9XG5cbiAgZnVuY3Rpb24gZm5TaWRyKG9wdGlvbnMpIHtcbiAgICB2YXIgdHJhbnNpdGlvbnMgPSBoZWxwZXIudHJhbnNpdGlvbnMsXG4gICAgICAgIHNldHRpbmdzID0gJCQzLmV4dGVuZCh7XG4gICAgICBuYW1lOiAnc2lkcicsIC8vIE5hbWUgZm9yIHRoZSAnc2lkcidcbiAgICAgIHNwZWVkOiAyMDAsIC8vIEFjY2VwdHMgc3RhbmRhcmQgalF1ZXJ5IGVmZmVjdHMgc3BlZWRzIChpLmUuIGZhc3QsIG5vcm1hbCBvciBtaWxsaXNlY29uZHMpXG4gICAgICBzaWRlOiAnbGVmdCcsIC8vIEFjY2VwdHMgJ2xlZnQnIG9yICdyaWdodCdcbiAgICAgIHNvdXJjZTogbnVsbCwgLy8gT3ZlcnJpZGUgdGhlIHNvdXJjZSBvZiB0aGUgY29udGVudC5cbiAgICAgIHJlbmFtaW5nOiB0cnVlLCAvLyBUaGUgaWRzIGFuZCBjbGFzc2VzIHdpbGwgYmUgcHJlcGVuZGVkIHdpdGggYSBwcmVmaXggd2hlbiBsb2FkaW5nIGV4aXN0ZW50IGNvbnRlbnRcbiAgICAgIGJvZHk6ICdib2R5JywgLy8gUGFnZSBjb250YWluZXIgc2VsZWN0b3IsXG4gICAgICBkaXNwbGFjZTogdHJ1ZSwgLy8gRGlzcGxhY2UgdGhlIGJvZHkgY29udGVudCBvciBub3RcbiAgICAgIHRpbWluZzogJ2Vhc2UnLCAvLyBUaW1pbmcgZnVuY3Rpb24gZm9yIENTUyB0cmFuc2l0aW9uc1xuICAgICAgbWV0aG9kOiAndG9nZ2xlJywgLy8gVGhlIG1ldGhvZCB0byBjYWxsIHdoZW4gZWxlbWVudCBpcyBjbGlja2VkXG4gICAgICBiaW5kOiAndG91Y2hzdGFydCBjbGljaycsIC8vIFRoZSBldmVudChzKSB0byB0cmlnZ2VyIHRoZSBtZW51XG4gICAgICBvbk9wZW46IGZ1bmN0aW9uIG9uT3BlbigpIHt9LFxuICAgICAgLy8gQ2FsbGJhY2sgd2hlbiBzaWRyIHN0YXJ0IG9wZW5pbmdcbiAgICAgIG9uQ2xvc2U6IGZ1bmN0aW9uIG9uQ2xvc2UoKSB7fSxcbiAgICAgIC8vIENhbGxiYWNrIHdoZW4gc2lkciBzdGFydCBjbG9zaW5nXG4gICAgICBvbk9wZW5FbmQ6IGZ1bmN0aW9uIG9uT3BlbkVuZCgpIHt9LFxuICAgICAgLy8gQ2FsbGJhY2sgd2hlbiBzaWRyIGVuZCBvcGVuaW5nXG4gICAgICBvbkNsb3NlRW5kOiBmdW5jdGlvbiBvbkNsb3NlRW5kKCkge30gLy8gQ2FsbGJhY2sgd2hlbiBzaWRyIGVuZCBjbG9zaW5nXG5cbiAgICB9LCBvcHRpb25zKSxcbiAgICAgICAgbmFtZSA9IHNldHRpbmdzLm5hbWUsXG4gICAgICAgICRzaWRlTWVudSA9ICQkMygnIycgKyBuYW1lKTtcblxuICAgIC8vIElmIHRoZSBzaWRlIG1lbnUgZG8gbm90IGV4aXN0IGNyZWF0ZSBpdFxuICAgIGlmICgkc2lkZU1lbnUubGVuZ3RoID09PSAwKSB7XG4gICAgICAkc2lkZU1lbnUgPSAkJDMoJzxkaXYgLz4nKS5hdHRyKCdpZCcsIG5hbWUpLmFwcGVuZFRvKCQkMygnYm9keScpKTtcbiAgICB9XG5cbiAgICAvLyBBZGQgdHJhbnNpdGlvbiB0byBtZW51IGlmIGFyZSBzdXBwb3J0ZWRcbiAgICBpZiAodHJhbnNpdGlvbnMuc3VwcG9ydGVkKSB7XG4gICAgICAkc2lkZU1lbnUuY3NzKHRyYW5zaXRpb25zLnByb3BlcnR5LCBzZXR0aW5ncy5zaWRlICsgJyAnICsgc2V0dGluZ3Muc3BlZWQgLyAxMDAwICsgJ3MgJyArIHNldHRpbmdzLnRpbWluZyk7XG4gICAgfVxuXG4gICAgLy8gQWRkaW5nIHN0eWxlcyBhbmQgb3B0aW9uc1xuICAgICRzaWRlTWVudS5hZGRDbGFzcygnc2lkcicpLmFkZENsYXNzKHNldHRpbmdzLnNpZGUpLmRhdGEoe1xuICAgICAgc3BlZWQ6IHNldHRpbmdzLnNwZWVkLFxuICAgICAgc2lkZTogc2V0dGluZ3Muc2lkZSxcbiAgICAgIGJvZHk6IHNldHRpbmdzLmJvZHksXG4gICAgICBkaXNwbGFjZTogc2V0dGluZ3MuZGlzcGxhY2UsXG4gICAgICB0aW1pbmc6IHNldHRpbmdzLnRpbWluZyxcbiAgICAgIG1ldGhvZDogc2V0dGluZ3MubWV0aG9kLFxuICAgICAgb25PcGVuOiBzZXR0aW5ncy5vbk9wZW4sXG4gICAgICBvbkNsb3NlOiBzZXR0aW5ncy5vbkNsb3NlLFxuICAgICAgb25PcGVuRW5kOiBzZXR0aW5ncy5vbk9wZW5FbmQsXG4gICAgICBvbkNsb3NlRW5kOiBzZXR0aW5ncy5vbkNsb3NlRW5kXG4gICAgfSk7XG5cbiAgICAkc2lkZU1lbnUgPSBmaWxsQ29udGVudCgkc2lkZU1lbnUsIHNldHRpbmdzKTtcblxuICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgdmFyICR0aGlzID0gJCQzKHRoaXMpLFxuICAgICAgICAgIGRhdGEgPSAkdGhpcy5kYXRhKCdzaWRyJyksXG4gICAgICAgICAgZmxhZyA9IGZhbHNlO1xuXG4gICAgICAvLyBJZiB0aGUgcGx1Z2luIGhhc24ndCBiZWVuIGluaXRpYWxpemVkIHlldFxuICAgICAgaWYgKCFkYXRhKSB7XG4gICAgICAgIHNpZHJTdGF0dXMubW92aW5nID0gZmFsc2U7XG4gICAgICAgIHNpZHJTdGF0dXMub3BlbmVkID0gZmFsc2U7XG5cbiAgICAgICAgJHRoaXMuZGF0YSgnc2lkcicsIG5hbWUpO1xuXG4gICAgICAgICR0aGlzLmJpbmQoc2V0dGluZ3MuYmluZCwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICAgIGlmICghZmxhZykge1xuICAgICAgICAgICAgZmxhZyA9IHRydWU7XG4gICAgICAgICAgICBzaWRyKHNldHRpbmdzLm1ldGhvZCwgbmFtZSk7XG5cbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICBmbGFnID0gZmFsc2U7XG4gICAgICAgICAgICB9LCAxMDApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBqUXVlcnkuc2lkciA9IHNpZHI7XG4gIGpRdWVyeS5mbi5zaWRyID0gZm5TaWRyO1xuXG59KCkpOyIsIihmdW5jdGlvbigpIHtcbn0pKCk7XG5cbihmdW5jdGlvbigpIHtcbiAgdmFyIHRvZ2dsZUFsbEJ1dHRvbnMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuanMtYnVsbGV0cG9pbnQtdG9nZ2xlLWFsbCcpO1xuICB2YXIgdG9nZ2xlQnVsbGV0cG9pbnRCdXR0b25zID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmpzLWJ1bGxldHBvaW50LXRvZ2dsZS1idWxsZXRwb2ludCcpO1xuICB2YXIgdG9nZ2xlQXR0YWNobWVudHNCdXR0b25zID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmpzLWJ1bGxldHBvaW50LXRvZ2dsZS1hdHRhY2htZW50cycpO1xuICB2YXIgYWRkQnVsbGV0cG9pbnRCdXR0b25zID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmpzLWJ1bGxldHBvaW50LWFkZCcpO1xuXG4gIC8vIFRvZ2dsZSBhbGwuXG4gIGZvciAodmFyIHRvZ2dsZUFsbEJ1dHRvbiBvZiB0b2dnbGVBbGxCdXR0b25zKSB7XG4gICAgdG9nZ2xlQWxsQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlVG9nZ2xlQWxsKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGhhbmRsZVRvZ2dsZUFsbChldmVudCkge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICB2YXIgYnVsbGV0cG9pbnRzID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnYnVsbGV0cG9pbnQnKTtcbiAgICB2YXIgY3VycmVudFN0YXRlID0gdG9nZ2xlQWxsQnV0dG9uLmRhdGFzZXQuY3VycmVudFN0YXRlO1xuXG4gICAgaWYgKGN1cnJlbnRTdGF0ZSA9PT0gJ29wZW4nKSB7XG4gICAgICB0b2dnbGVBbGxCdXR0b24uZGF0YXNldC5jdXJyZW50U3RhdGUgPSAnY2xvc2VkJztcblxuICAgICAgZm9yICh2YXIgYnVsbGV0cG9pbnQgb2YgYnVsbGV0cG9pbnRzKSB7XG4gICAgICAgIGJ1bGxldHBvaW50LmNsYXNzTGlzdC5yZW1vdmUoJ2J1bGxldHBvaW50LS1vcGVuJyk7XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdG9nZ2xlQWxsQnV0dG9uLmRhdGFzZXQuY3VycmVudFN0YXRlID0gJ29wZW4nO1xuXG4gICAgICBmb3IgKHZhciBidWxsZXRwb2ludCBvZiBidWxsZXRwb2ludHMpIHtcbiAgICAgICAgYnVsbGV0cG9pbnQuY2xhc3NMaXN0LmFkZCgnYnVsbGV0cG9pbnQtLW9wZW4nKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBUb2dnbGUgYXR0YWNobWVudHMuXG4gIGZvciAodmFyIHRvZ2dsZUF0dGFjaG1lbnRCdXR0b24gb2YgdG9nZ2xlQXR0YWNobWVudHNCdXR0b25zKSB7XG4gICAgdG9nZ2xlQXR0YWNobWVudEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZVRvZ2dsZUF0dGFjaG1lbnRzKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGhhbmRsZVRvZ2dsZUF0dGFjaG1lbnRzKGV2ZW50KSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgIHZhciBlbGVtZW50ID0gdGhpcztcbiAgICB2YXIgcGFyZW50ID0gZWxlbWVudC5jbG9zZXN0KCcuYnVsbGV0cG9pbnQnKTtcblxuICAgIHBhcmVudC5jbGFzc0xpc3QudG9nZ2xlKCdidWxsZXRwb2ludC0tb3BlbicpO1xuXG4gICAgLy8gUnVuIHRocm91Z2ggYXR0YWNobWVudHMgYW5kIHRvZ2dsZSB0aGVtLlxuICAgIHZhciBhdHRhY2htZW50cyA9IHBhcmVudC5xdWVyeVNlbGVjdG9yQWxsKCcuYnVsbGV0cG9pbnQtLWF0dGFjaG1lbnQnKTtcblxuICAgIGlmIChwYXJlbnQuY2xhc3NMaXN0LmNvbnRhaW5zKCdidWxsZXRwb2ludC0tb3BlbicpKSB7XG4gICAgICBmb3IgKHZhciBhdHRhY2htZW50IG9mIGF0dGFjaG1lbnRzKSB7XG4gICAgICAgIGF0dGFjaG1lbnQuY2xhc3NMaXN0LmFkZCgnYnVsbGV0cG9pbnQtLW9wZW4nKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBmb3IgKHZhciBhdHRhY2htZW50IG9mIGF0dGFjaG1lbnRzKSB7XG4gICAgICAgIGF0dGFjaG1lbnQuY2xhc3NMaXN0LnJlbW92ZSgnYnVsbGV0cG9pbnQtLW9wZW4nKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBUb2dnbGUgYnVsbGV0cG9pbnQuXG4gIGZvciAodmFyIHRvZ2dsZUJ1bGxldHBvaW50QnV0dG9uIG9mIHRvZ2dsZUJ1bGxldHBvaW50QnV0dG9ucykge1xuICAgIHRvZ2dsZUJ1bGxldHBvaW50QnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlVG9nZ2xlQnVsbGV0cG9pbnQpO1xuICB9XG5cbiAgZnVuY3Rpb24gaGFuZGxlVG9nZ2xlQnVsbGV0cG9pbnQoZXZlbnQpIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgdmFyIGVsZW1lbnQgPSB0aGlzO1xuICAgIHZhciBwYXJlbnQgPSBlbGVtZW50LmNsb3Nlc3QoJy5idWxsZXRwb2ludCcpO1xuICAgIHZhciBpZCA9IHBhcmVudC5kYXRhc2V0LmRlY3JldG9Ob2RlSWQ7XG5cbiAgICAvLyBBZGQgc2VsZWN0ZWQgYnVsbGV0cG9pbnQgcGFyYW0gdG8gVVJMLlxuICAgIHdpbmRvdy5oaXN0b3J5LnB1c2hTdGF0ZShudWxsLCBudWxsLCAnP2J1bGxldHBvaW50PScgKyBpZCk7XG5cbiAgICAvLyBUb2dnbGUgdmlzaWJpbGl0eS5cbiAgICBwYXJlbnQuY2xhc3NMaXN0LnRvZ2dsZSgnYnVsbGV0cG9pbnQtLW9wZW4nKTtcbiAgfVxuXG4gIC8vIEhhbmRsZSBcImFkZCBidWxsZXRwb2ludFwiLlxuICBmb3IgKHZhciBhZGRCdWxsZXRwb2ludEJ1dHRvbiBvZiBhZGRCdWxsZXRwb2ludEJ1dHRvbnMpIHtcbiAgICBhZGRCdWxsZXRwb2ludEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZUFkZEJ1bGxldHBvaW50KTtcbiAgfVxuICBmdW5jdGlvbiBoYW5kbGVBZGRCdWxsZXRwb2ludCgpIHtcbiAgICB2YXIgZWxlbWVudCA9IHRoaXM7XG4gICAgdmFyIHBhcmVudCA9IGVsZW1lbnQuY2xvc2VzdCgnLmJ1bGxldHBvaW50Jyk7XG4gICAgdmFyIGlkID0gcGFyZW50LmRhdGFzZXQuZGVjcmV0b05vZGVJZDtcblxuICAgIC8vIEFkZCBidWxsZXRwb2ludCBwYXJhbSB0byBVUkwuXG4gICAgd2luZG93Lmhpc3RvcnkucHVzaFN0YXRlKG51bGwsIG51bGwsICc/YnVsbGV0cG9pbnQ9JyArIGlkKTtcbiAgfVxuXG4gIC8vIFBhZ2UgbG9hZC5cbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGZ1bmN0aW9uKCkge1xuICAgIHZhciBxdWVyeVN0cmluZyA9IHdpbmRvdy5sb2NhdGlvbi5zZWFyY2g7XG4gICAgdmFyIHVybFBhcmFtcyA9IG5ldyBVUkxTZWFyY2hQYXJhbXMocXVlcnlTdHJpbmcpO1xuICAgIHZhciBwYXJhbSA9IHVybFBhcmFtcy5nZXQoJ2J1bGxldHBvaW50Jyk7XG5cbiAgICBpZiAocGFyYW0gIT09IG51bGwpIHtcbiAgICAgIHZhciBidWxsZXRwb2ludCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdidWxsZXRwb2ludC0tJyArIHBhcmFtKTtcblxuICAgICAgaWYgKGJ1bGxldHBvaW50ICE9PSBudWxsKSB7XG4gICAgICAgIGJ1bGxldHBvaW50LmNsYXNzTGlzdC5hZGQoJ2J1bGxldHBvaW50LS1vcGVuJyk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcblxuICBmdW5jdGlvbiBnZXRVcmxQYXJhbXMoKSB7XG4gICAgdmFyIHBhcmFtcyA9IHt9O1xuICAgIHZhciBwYXJ0cyA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmLnJlcGxhY2UoL1s/Jl0rKFtePSZdKyk9KFteJl0qKS9naSwgZnVuY3Rpb24obSxrZXksdmFsdWUpIHtcbiAgICAgIHBhcmFtc1trZXldID0gdmFsdWU7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcGFyYW1zO1xuICB9XG59KSgpO1xuIiwiKGZ1bmN0aW9uKCkge1xuICBjb25zdCBzaWRlYmFyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmxheW91dF9fc2lkZWJhcicpO1xuICBjb25zdCB0b2dnbGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmpzLXRvZ2dsZS1zaWRlYmFyJyk7XG5cbiAgY29uc3QgdG9nZ2xlU3RhdGUgPSAoKSA9PiB7XG4gICAgY29uc3QgY3VycmVudFN0YXRlID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3NpZGViYXInKTtcblxuICAgIGlmIChjdXJyZW50U3RhdGUgPT09ICduYXJyb3cnKSB7XG4gICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnc2lkZWJhcicsICd3aWRlJyk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ3NpZGViYXInLCAnbmFycm93Jyk7XG4gICAgfVxuICB9O1xuXG4gIC8vIEFkZCBldmVudGxpc3RlbmVycy5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0b2dnbGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgbGV0IHRvZ2dsZSA9IHRvZ2dsZXNbaV07XG5cbiAgICB0b2dnbGUuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBlID0+IHtcbiAgICAgIHNpZGViYXIuY2xhc3NMaXN0LnRvZ2dsZSgnbGF5b3V0X19zaWRlYmFyLS1uYXJyb3cnKTtcblxuICAgICAgdG9nZ2xlU3RhdGUoKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vIE9uIGxvYWQuXG4gIGNvbnN0IGN1cnJlbnRTdGF0ZSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdzaWRlYmFyJyk7XG5cbiAgaWYgKGN1cnJlbnRTdGF0ZSA9PT0gJ25hcnJvdycpIHtcbiAgICBzaWRlYmFyLmNsYXNzTGlzdC5hZGQoJ2xheW91dF9fc2lkZWJhci0tbmFycm93Jyk7XG4gIH1cbiAgZWxzZSB7XG4gICAgc2lkZWJhci5jbGFzc0xpc3QucmVtb3ZlKCdsYXlvdXRfX3NpZGViYXItLW5hcnJvdycpO1xuICB9XG59KSgpO1xuIiwialF1ZXJ5KGZ1bmN0aW9uICgkKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICAvLyBGbGV4eSBoZWFkZXJcbiAgZmxleHlfaGVhZGVyLmluaXQoKTtcblxuICAkKCcuc2lkci10b2dnbGUtLXJpZ2h0Jykuc2lkcih7XG4gICAgbmFtZTogJ3NpZHItbWFpbicsXG4gICAgc2lkZTogJ3JpZ2h0JyxcbiAgICByZW5hbWluZzogZmFsc2UsXG4gICAgYm9keTogJy5sYXlvdXRfX3dyYXBwZXInLFxuICAgIHNvdXJjZTogJy5zaWRyLXNvdXJjZS1wcm92aWRlcidcbiAgfSk7XG5cbiAgLy8gRW5hYmxlIHRvb2x0aXBzLlxuICAkKCdbZGF0YS10b2dnbGU9XCJ0b29sdGlwXCJdJykudG9vbHRpcCgpO1xuXG4gIC8vIFBvcHB5IChwb3BvdmVycykuXG4gICQoJy5wb3BweS10b2dnbGUnKS5vbignY2xpY2snLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICB2YXIgJGVsZW1lbnQgPSAkKHRoaXMpO1xuICAgIHZhciAkcGFyZW50ID0gJGVsZW1lbnQucGFyZW50cygnLnBvcHB5Jyk7XG5cbiAgICAvLyBNYWtlIHN1cmUgdGhhdCBubyBvdGhlciBcInBvcHB5c1wiIGFyZSBvcGVuLlxuICAgICQoJy5wb3BweS0tb3BlbicpXG4gICAgICAubm90KCRwYXJlbnQpXG4gICAgICAucmVtb3ZlQ2xhc3MoJ3BvcHB5LS1vcGVuJyk7XG5cbiAgICAvLyBUb2dnbGUgdGhlIGNsYXNzIG9uIHRoaXMgZWxlbWVudC5cbiAgICAkcGFyZW50LnRvZ2dsZUNsYXNzKCdwb3BweS0tb3BlbicpO1xuICB9KTtcbiAgJCgnLnBvcHB5Jykub24oJ2NsaWNrJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gIH0pO1xuICAkKCdib2R5Jykub24oJ2NsaWNrJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgJCgnLnBvcHB5LS1vcGVuJykucmVtb3ZlQ2xhc3MoJ3BvcHB5LS1vcGVuJyk7XG4gIH0pO1xuXG4gIC8vIEFqYXhpIGNsaWNrIGxvYWRlci5cbiAgJCgnW2RhdGEtYWpheGktc291cmNlXScpLm9uKCdjbGljaycsIGZ1bmN0aW9uIChldmVudCkge1xuICAgIHZhciAkZWxlbWVudCA9ICQodGhpcyk7XG4gICAgdmFyIHRhcmdldCA9ICRlbGVtZW50LmF0dHIoJ2RhdGEtYWpheGktdGFyZ2V0Jyk7XG4gICAgdmFyIHNvdXJjZSA9ICRlbGVtZW50LmF0dHIoJ2RhdGEtYWpheGktc291cmNlJyk7XG4gICAgdmFyIGxvYWRpbmcgPSAkZWxlbWVudC5hdHRyKCdkYXRhLWFqYXhpLWxvYWRpbmcnKTtcblxuICAgIC8vIFNldCBsb2FkaW5nIHRleHQuXG4gICAgJCh0YXJnZXQpLmh0bWwobG9hZGluZyk7XG5cbiAgICAvLyBMb2FkIGV4dGVybmFsIGNvbnRlbnQuXG4gICAgJCh0YXJnZXQpLmxvYWQoc291cmNlKTtcbiAgfSk7XG5cbiAgLy8gU3dpdGNoIG1vZGUgdG9nZ2xlIGNhbGxiYWNrLlxuICAkKCcjbWVldGluZy1hZ2VuZGEtc3dpdGNoLW1vZGUtdG9nZ2xlJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgJCgnI2FnZW5kYS1vdmVydmlldycpLnRvZ2dsZUNsYXNzKCdoaWRkZW4nKTtcbiAgICAkKCcjYWdlbmRhLWl0ZW0tcmVvcmRlcicpLnRvZ2dsZUNsYXNzKCdoaWRkZW4nKTtcblxuICAgIC8vIFJlc2V0dGluZyBzZWFyY2guXG4gICAgJCgnLmJ1bGxldHBvaW50JykucmVtb3ZlQ2xhc3MoJ2hpZGRlbicpO1xuICAgICQoJ2Zvcm0uZGVjcmV0by1jb250ZW50LW1vZGlmeS1zZWFyY2gtaW4tbWVldGluZy1mb3JtIGlucHV0JykudmFsKCcnKTtcblxuICAgIC8vIFRvZ2dsZSBzZWFyY2ggZW5hYmxlZC5cbiAgICBpZiAoJCgnI2FnZW5kYS1vdmVydmlldycpLmhhc0NsYXNzKCdoaWRkZW4nKSkge1xuICAgICAgJCgnZm9ybS5kZWNyZXRvLWNvbnRlbnQtbW9kaWZ5LXNlYXJjaC1pbi1tZWV0aW5nLWZvcm0gaW5wdXQnKS5hdHRyKCdkaXNhYmxlZCcsICdkaXNhYmxlZCcpXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgJCgnZm9ybS5kZWNyZXRvLWNvbnRlbnQtbW9kaWZ5LXNlYXJjaC1pbi1tZWV0aW5nLWZvcm0gaW5wdXQnKS5yZW1vdmVBdHRyKCdkaXNhYmxlZCcpO1xuICAgIH1cblxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gIH0pO1xufSk7XG4iXX0=
