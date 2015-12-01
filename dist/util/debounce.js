// FIXME move this into core

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Debounced = (function () {
  function Debounced(pm, delay, f) {
    _classCallCheck(this, Debounced);

    this.pm = pm;
    this.delay = delay;
    this.scheduled = null;
    this.f = f;
    this.pending = null;
  }

  _createClass(Debounced, [{
    key: "trigger",
    value: function trigger() {
      var _this = this;

      window.clearTimeout(this.scheduled);
      this.scheduled = window.setTimeout(function () {
        return _this.fire();
      }, this.delay);
    }
  }, {
    key: "fire",
    value: function fire() {
      var _this2 = this;

      if (!this.pending) {
        if (this.pm.operation) this.pm.on("flush", this.pending = function () {
          _this2.pm.off("flush", _this2.pending);
          _this2.pending = null;
          _this2.f();
        });else this.f();
      }
    }
  }, {
    key: "clear",
    value: function clear() {
      window.clearTimeout(this.scheduled);
    }
  }]);

  return Debounced;
})();

exports.Debounced = Debounced;