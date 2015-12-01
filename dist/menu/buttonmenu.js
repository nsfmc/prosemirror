"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _edit = require("../edit");

var _dom = require("../dom");

var _editSelection = require("../edit/selection");

var _utilDebounce = require("../util/debounce");

var _tooltip = require("./tooltip");

var _menu = require("./menu");

require("./icons");

var classPrefix = "ProseMirror-buttonmenu";

(0, _edit.defineOption)("buttonMenu", false, function (pm, value) {
  if (pm.mod.menu) pm.mod.menu.detach();
  pm.mod.menu = value ? new ButtonMenu(pm, value) : null;
});

var ButtonMenu = (function () {
  function ButtonMenu(pm, _config) {
    var _this = this;

    _classCallCheck(this, ButtonMenu);

    this.pm = pm;

    this.tooltip = new _tooltip.Tooltip(pm, "left");
    this.menu = new _menu.Menu(pm, new _menu.TooltipDisplay(this.tooltip));
    this.hamburger = pm.wrapper.appendChild((0, _dom.elt)("div", { "class": classPrefix + "-button" }, (0, _dom.elt)("div"), (0, _dom.elt)("div"), (0, _dom.elt)("div")));
    this.hamburger.addEventListener("mousedown", function (e) {
      e.preventDefault();e.stopPropagation();
      if (_this.tooltip.isOpen) _this.tooltip.close();else _this.openMenu();
    });

    this.debounced = new _utilDebounce.Debounced(pm, 100, function () {
      return _this.alignButton();
    });
    pm.on("selectionChange", this.updateFunc = function () {
      return _this.updated();
    });
    pm.on("change", this.updateFunc);
    pm.on("blur", this.updateFunc);

    this.blockItems = (0, _menu.commandGroups)(pm, "block");
    this.allItems = (0, _menu.commandGroups)(pm, "inline", "block");

    this.pm.content.addEventListener("keydown", this.closeFunc = function () {
      return _this.tooltip.close();
    });
    this.pm.content.addEventListener("mousedown", this.closeFunc);

    (0, _menu.forceFontLoad)(pm);
  }

  _createClass(ButtonMenu, [{
    key: "detach",
    value: function detach() {
      this.debounced.clear();
      this.hamburger.parentNode.removeChild(this.hamburger);
      this.tooltip.detach();

      this.pm.off("selectionChange", this.updateFunc);
      this.pm.off("change", this.updateFunc);
      this.pm.off("blur", this.updateFunc);
      this.pm.content.removeEventListener("keydown", this.closeFunc);
      this.pm.content.removeEventListener("mousedown", this.closeFunc);
    }
  }, {
    key: "updated",
    value: function updated() {
      if (!this.menu.active) {
        this.tooltip.close();
        this.debounced.trigger();
      }
    }
  }, {
    key: "openMenu",
    value: function openMenu() {
      var rect = this.hamburger.getBoundingClientRect();
      var pos = { left: rect.left, top: (rect.top + rect.bottom) / 2 };
      var showInline = this.pm.selection.empty || !this.pm.getOption("inlineMenu");
      this.menu.show(showInline ? this.allItems : this.blockItems, pos);
    }
  }, {
    key: "alignButton",
    value: function alignButton() {
      var _pm$selection = this.pm.selection;
      var from = _pm$selection.from;
      var node = _pm$selection.node;

      var blockElt = (0, _editSelection.resolvePath)(this.pm.content, node ? from.path.concat(from.offset) : from.path);

      var _blockElt$getBoundingClientRect = blockElt.getBoundingClientRect();

      var top = _blockElt$getBoundingClientRect.top;

      var around = this.pm.wrapper.getBoundingClientRect();
      this.hamburger.style.top = Math.max(top - this.hamburger.offsetHeight - 2 - around.top, 7) + "px";
    }
  }]);

  return ButtonMenu;
})();

(0, _dom.insertCSS)("\n\n.ProseMirror-buttonmenu-button {\n  display: none;\n  position: absolute;\n  top: 7px;\n  right: 7px;\n  width: 15px;\n  height: 13px;\n  cursor: pointer;\n\n  -webkit-transition: top 0.3s ease-out;\n  -moz-transition: top 0.3s ease-out;\n  transition: top 0.3s ease-out;\n}\n\n.ProseMirror-focused .ProseMirror-buttonmenu-button {\n  display: block;\n}\n\n.ProseMirror-buttonmenu-button div {\n  height: 3px;\n  margin-bottom: 2px;\n  border-radius: 4px;\n  background: #888;\n}\n\n.ProseMirror-buttonmenu-button:hover div {\n  background: #333;\n}\n\n");