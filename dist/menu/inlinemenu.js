"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _edit = require("../edit");

var _model = require("../model");

var _dom = require("../dom");

var _utilDebounce = require("../util/debounce");

var _tooltip = require("./tooltip");

var _menu = require("./menu");

var classPrefix = "ProseMirror-inlinemenu";

(0, _edit.defineOption)("inlineMenu", false, function (pm, value) {
  if (pm.mod.inlineMenu) pm.mod.inlineMenu.detach();
  pm.mod.inlineMenu = value ? new InlineMenu(pm, value) : null;
});

var InlineMenu = (function () {
  function InlineMenu(pm, config) {
    var _this = this;

    _classCallCheck(this, InlineMenu);

    this.pm = pm;
    this.items = config && config.items || (0, _menu.commandGroups)(pm, "inline");
    this.nodeItems = config && config.nodeItems || (0, _menu.commandGroups)(pm, "block");
    this.showLinks = config ? config.showLinks !== false : true;
    this.debounced = new _utilDebounce.Debounced(pm, 100, function () {
      return _this.update();
    });

    pm.on("selectionChange", this.updateFunc = function () {
      return _this.debounced.trigger();
    });
    pm.on("change", this.updateFunc);
    pm.on("blur", this.updateFunc);

    this.tooltip = new _tooltip.Tooltip(pm, "above");
    this.menu = new _menu.Menu(pm, new _menu.TooltipDisplay(this.tooltip, this.updateFunc));

    (0, _menu.forceFontLoad)(pm);
  }

  /**
   * Get the x and y coordinates at the top center of the current DOM selection.
   *
   * @return {Object}
   */

  _createClass(InlineMenu, [{
    key: "detach",
    value: function detach() {
      this.debounced.clear();
      this.tooltip.detach();

      this.pm.off("selectionChange", this.updateFunc);
      this.pm.off("change", this.updateFunc);
      this.pm.off("blur", this.updateFunc);
    }
  }, {
    key: "update",
    value: function update() {
      if (this.menu.active) return;

      var _pm$selection = this.pm.selection;
      var empty = _pm$selection.empty;
      var node = _pm$selection.node;
      var head = _pm$selection.head;var link = undefined;
      if (!this.pm.hasFocus()) this.tooltip.close();else if (node && node.isBlock) this.menu.show(this.nodeItems, topOfNodeSelection(this.pm));else if (!empty) this.menu.show(this.items, node ? topOfNodeSelection(this.pm) : topCenterOfSelection());else if (this.showLinks && (link = this.linkUnderCursor())) this.showLink(link, this.pm.coordsAtPos(head));else this.tooltip.close();
    }
  }, {
    key: "linkUnderCursor",
    value: function linkUnderCursor() {
      var head = this.pm.selection.head;
      if (!head) return null;
      var styles = (0, _model.spanStylesAt)(this.pm.doc, head);
      return styles.reduce(function (found, st) {
        return found || st.type.name == "link" && st;
      }, null);
    }
  }, {
    key: "showLink",
    value: function showLink(link, pos) {
      var node = (0, _dom.elt)("div", { "class": classPrefix + "-linktext" }, (0, _dom.elt)("a", { href: link.attrs.href, title: link.attrs.title }, link.attrs.href));
      this.tooltip.open(node, pos);
    }
  }]);

  return InlineMenu;
})();

function topCenterOfSelection() {
  var rects = window.getSelection().getRangeAt(0).getClientRects();
  var _rects$0 = rects[0];
  var left = _rects$0.left;
  var right = _rects$0.right;
  var top = _rects$0.top;var i = 1;
  while (left == right && rects.length > i) {
    ;var _rects = rects[i++];
    left = _rects.left;
    right = _rects.right;
    top = _rects.top;
  }
  for (; i < rects.length; i++) {
    if (rects[i].top < rects[0].bottom - 1 && (
    // Chrome bug where bogus rectangles are inserted at span boundaries
    i == rects.length - 1 || Math.abs(rects[i + 1].left - rects[i].left) > 1)) {
      left = Math.min(left, rects[i].left);
      right = Math.max(right, rects[i].right);
      top = Math.min(top, rects[i].top);
    }
  }
  return { top: top, left: (left + right) / 2 };
}

function topOfNodeSelection(pm) {
  var selected = pm.content.querySelector(".ProseMirror-selectednode");
  if (!selected) return { left: 0, top: 0 };
  var box = selected.getBoundingClientRect();
  return { left: Math.min((box.left + box.right) / 2, box.left + 20), top: box.top };
}

(0, _dom.insertCSS)("\n\n.ProseMirror-inlinemenu-linktext a {\n  color: white;\n  text-decoration: none;\n  padding: 0 5px;\n}\n\n.ProseMirror-inlinemenu-linktext a:hover {\n  text-decoration: underline;\n}\n\n");