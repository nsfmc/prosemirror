"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _edit = require("../edit");

var _dom = require("../dom");

var _utilDebounce = require("../util/debounce");

var _menu = require("./menu");

require("./icons");

(0, _edit.defineOption)("menuBar", false, function (pm, value) {
  if (pm.mod.menuBar) pm.mod.menuBar.detach();
  pm.mod.menuBar = value ? new MenuBar(pm, value) : null;
});

var BarDisplay = (function () {
  function BarDisplay(container, resetFunc) {
    _classCallCheck(this, BarDisplay);

    this.container = container;
    this.resetFunc = resetFunc;
  }

  _createClass(BarDisplay, [{
    key: "clear",
    value: function clear() {
      this.container.textContent = "";
    }
  }, {
    key: "reset",
    value: function reset() {
      this.resetFunc();
    }
  }, {
    key: "show",
    value: function show(dom) {
      this.clear();
      this.container.appendChild(dom);
    }
  }, {
    key: "enter",
    value: function enter(dom, back) {
      var current = this.container.firstChild;
      if (current) {
        current.style.position = "absolute";
        current.style.opacity = "0.5";
      }
      var backButton = (0, _dom.elt)("div", { "class": "ProseMirror-menubar-back" });
      backButton.addEventListener("mousedown", function (e) {
        e.preventDefault();e.stopPropagation();
        back();
      });
      var added = (0, _dom.elt)("div", { "class": "ProseMirror-menubar-sliding" }, backButton, dom);
      this.container.appendChild(added);
      added.getBoundingClientRect(); // Force layout for transition
      added.style.left = "0";
      added.addEventListener("transitionend", function () {
        if (current && current.parentNode) current.parentNode.removeChild(current);
      });
    }
  }]);

  return BarDisplay;
})();

var MenuBar = (function () {
  function MenuBar(pm, config) {
    var _this = this;

    _classCallCheck(this, MenuBar);

    this.pm = pm;

    this.menuElt = (0, _dom.elt)("div", { "class": "ProseMirror-menubar-inner" });
    this.wrapper = (0, _dom.elt)("div", { "class": "ProseMirror-menubar" },
    // Height-forcing placeholder
    (0, _dom.elt)("div", { "class": "ProseMirror-menu", style: "visibility: hidden" }, (0, _dom.elt)("div", { "class": "ProseMirror-menuicon" }, (0, _dom.elt)("span", { "class": "ProseMirror-menuicon ProseMirror-icon-strong" }))), this.menuElt);
    pm.wrapper.insertBefore(this.wrapper, pm.wrapper.firstChild);

    this.menu = new _menu.Menu(pm, new BarDisplay(this.menuElt, function () {
      return _this.resetMenu();
    }));
    this.debounced = new _utilDebounce.Debounced(pm, 100, function () {
      return _this.update();
    });
    pm.on("selectionChange", this.updateFunc = function () {
      return _this.debounced.trigger();
    });
    pm.on("change", this.updateFunc);
    pm.on("activeStyleChange", this.updateFunc);

    this.menuItems = config && config.items || (0, _menu.commandGroups)(pm, "inline", "block", "history");
    this.update();

    this.floating = false;
    if (config && config.float) {
      this.updateFloat();
      this.scrollFunc = function () {
        if (!document.body.contains(_this.pm.wrapper)) window.removeEventListener("scroll", _this.scrollFunc);else _this.updateFloat();
      };
      window.addEventListener("scroll", this.scrollFunc);
    }
  }

  _createClass(MenuBar, [{
    key: "detach",
    value: function detach() {
      this.debounced.clear();
      this.wrapper.parentNode.removeChild(this.wrapper);

      this.pm.off("selectionChange", this.updateFunc);
      this.pm.off("change", this.updateFunc);
      this.pm.off("activeStyleChange", this.updateFunc);
      if (this.scrollFunc) window.removeEventListener("scroll", this.scrollFunc);
    }
  }, {
    key: "update",
    value: function update() {
      if (!this.menu.active) this.resetMenu();
      if (this.floating) this.scrollCursorIfNeeded();
    }
  }, {
    key: "resetMenu",
    value: function resetMenu() {
      this.menu.show(this.menuItems);
    }
  }, {
    key: "updateFloat",
    value: function updateFloat() {
      var editorRect = this.pm.wrapper.getBoundingClientRect();
      if (this.floating) {
        if (editorRect.top >= 0 || editorRect.bottom < this.menuElt.offsetHeight + 10) {
          this.floating = false;
          this.menuElt.style.position = this.menuElt.style.left = this.menuElt.style.width = "";
          this.menuElt.style.display = "";
        } else {
          var border = (this.pm.wrapper.offsetWidth - this.pm.wrapper.clientWidth) / 2;
          this.menuElt.style.left = editorRect.left + border + "px";
          this.menuElt.style.display = editorRect.top > window.innerHeight ? "none" : "";
        }
      } else {
        if (editorRect.top < 0 && editorRect.bottom >= this.menuElt.offsetHeight + 10) {
          this.floating = true;
          var menuRect = this.menuElt.getBoundingClientRect();
          this.menuElt.style.left = menuRect.left + "px";
          this.menuElt.style.width = menuRect.width + "px";
          this.menuElt.style.position = "fixed";
        }
      }
    }
  }, {
    key: "scrollCursorIfNeeded",
    value: function scrollCursorIfNeeded() {
      var head = this.pm.selection.head;
      if (!head) return;
      var cursorPos = this.pm.coordsAtPos(head);
      var menuRect = this.menuElt.getBoundingClientRect();
      if (cursorPos.top < menuRect.bottom && cursorPos.bottom > menuRect.top) {
        var scrollable = findWrappingScrollable(this.pm.wrapper);
        if (scrollable) scrollable.scrollTop -= menuRect.bottom - cursorPos.top;
      }
    }
  }]);

  return MenuBar;
})();

function findWrappingScrollable(node) {
  for (var cur = node.parentNode; cur; cur = cur.parentNode) {
    if (cur.scrollHeight > cur.clientHeight) return cur;
  }
}

(0, _dom.insertCSS)("\n.ProseMirror-menubar {\n  padding: 1px 4px;\n  position: relative;\n  margin-bottom: 3px;\n  border-top-left-radius: inherit;\n  border-top-right-radius: inherit;\n}\n\n.ProseMirror-menubar-inner {\n  color: #666;\n  padding: 1px 4px;\n  top: 0; left: 0; right: 0;\n  position: absolute;\n  border-bottom: 1px solid silver;\n  background: white;\n  z-index: 10;\n  -moz-box-sizing: border-box;\n  box-sizing: border-box;\n  overflow: hidden;\n  border-top-left-radius: inherit;\n  border-top-right-radius: inherit;\n}\n\n.ProseMirror-menubar .ProseMirror-menuicon-active {\n  background: #eee;\n}\n\n.ProseMirror-menubar input[type=\"text\"],\n.ProseMirror-menubar textarea {\n  background: #eee;\n  color: black;\n  border: none;\n  outline: none;\n  width: 100%;\n  box-sizing: -moz-border-box;\n  box-sizing: border-box;\n}\n\n.ProseMirror-menubar input[type=\"text\"] {\n  padding: 0 4px;\n}\n\n.ProseMirror-menubar form {\n  position: relative;\n  padding: 2px 4px;\n}\n\n.ProseMirror-menubar .ProseMirror-blocktype {\n  border: 1px solid #ccc;\n  min-width: 4em;\n}\n.ProseMirror-menubar .ProseMirror-blocktype:after {\n  color: #ccc;\n}\n\n.ProseMirror-menubar-sliding {\n  -webkit-transition: left 0.2s ease-out;\n  -moz-transition: left 0.2s ease-out;\n  transition: left 0.2s ease-out;\n  position: relative;\n  left: 100%;\n  width: 100%;\n  box-sizing: -moz-border-box;\n  box-sizing: border-box;\n  padding-left: 16px;\n  background: white;\n}\n\n.ProseMirror-menubar-back {\n  position: absolute;\n  height: 100%;\n  margin-top: -1px;\n  padding-bottom: 2px;\n  width: 10px;\n  left: 0;\n  border-right: 1px solid silver;\n  cursor: pointer;\n}\n.ProseMirror-menubar-back:after {\n  content: \"«\";\n}\n\n");