"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _get = function get(_x10, _x11, _x12) { var _again = true; _function: while (_again) { var object = _x10, property = _x11, receiver = _x12; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x10 = parent; _x11 = property; _x12 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

exports.compareMarkup = compareMarkup;

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _style = require("./style");

var emptyArray = [];

/**
 * Document node class
 */

var Node = (function () {
  function Node(type, attrs) {
    _classCallCheck(this, Node);

    this.type = type;
    this.attrs = attrs;
  }

  _createClass(Node, [{
    key: "sameMarkup",
    value: function sameMarkup(other) {
      return compareMarkup(this.type, other.type, this.attrs, other.attrs);
    }
  }, {
    key: "child",
    value: function child(_) {
      throw new Error("Trying to index non-block node " + this);
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      var obj = { type: this.type.name };
      for (var _ in this.attrs) {
        obj.attrs = this.attrs;
        return obj;
      }
      return obj;
    }
  }, {
    key: "length",
    get: function get() {
      return 0;
    }
  }, {
    key: "isBlock",
    get: function get() {
      return false;
    }
  }, {
    key: "isTextblock",
    get: function get() {
      return false;
    }
  }, {
    key: "isInline",
    get: function get() {
      return false;
    }
  }, {
    key: "isText",
    get: function get() {
      return false;
    }
  }]);

  return Node;
})();

exports.Node = Node;

var BlockNode = (function (_Node) {
  _inherits(BlockNode, _Node);

  function BlockNode(type, attrs, content, styles) {
    _classCallCheck(this, BlockNode);

    if (styles) throw new Error("Constructing a block node with styles");
    _get(Object.getPrototypeOf(BlockNode.prototype), "constructor", this).call(this, type, attrs);
    this.content = content || emptyArray;
  }

  _createClass(BlockNode, [{
    key: "toString",
    value: function toString() {
      return this.type.name + "(" + this.content.join(", ") + ")";
    }
  }, {
    key: "copy",
    value: function copy() {
      var content = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];

      return new this.constructor(this.type, this.attrs, content);
    }
  }, {
    key: "slice",
    value: function slice(from) {
      var to = arguments.length <= 1 || arguments[1] === undefined ? this.length : arguments[1];

      return this.content.slice(from, to);
    }

    // FIXME maybe slice and splice returning different things is going to confuse
  }, {
    key: "splice",
    value: function splice(from, to, replace) {
      return new this.constructor(this.type, this.attrs, this.content.slice(0, from).concat(replace).concat(this.content.slice(to)));
    }
  }, {
    key: "replace",
    value: function replace(pos, node) {
      var content = this.content.slice();
      content[pos] = node;
      return this.copy(content);
    }
  }, {
    key: "replaceDeep",
    value: function replaceDeep(path, node) {
      var depth = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];

      if (depth == path.length) return node;
      var pos = path[depth];
      return this.replace(pos, this.child(pos).replaceDeep(path, node, depth + 1));
    }
  }, {
    key: "append",
    value: function append(nodes) {
      var joinLeft = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];
      var joinRight = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];

      if (!nodes.length) return this;
      if (!this.length) return this.copy(nodes);

      var last = this.length - 1,
          content = this.content.slice(0, last);
      var before = this.content[last],
          after = nodes[0];
      if (joinLeft > 0 && joinRight > 0 && before.sameMarkup(after)) content.push(before.append(after.content, joinLeft - 1, joinRight - 1));else content.push(before.close(joinLeft - 1, "end"), after.close(joinRight - 1, "start"));
      for (var i = 1; i < nodes.length; i++) {
        content.push(nodes[i]);
      }return this.copy(content);
    }
  }, {
    key: "close",
    value: function close(depth, side) {
      if (depth == 0 && this.length == 0 && !this.type.canBeEmpty) return this.copy(this.type.defaultContent());
      if (depth < 0) return this;
      var off = side == "start" ? 0 : this.maxOffset - 1,
          child = this.child(off);
      var closed = child.close(depth - 1, side);
      if (closed == child) return this;
      return this.replace(off, closed);
    }
  }, {
    key: "child",

    /**
     * Get the child node at a given index.
     */
    value: function child(i) {
      if (i < 0 || i >= this.length) throw new Error("Index " + i + " out of range in " + this);
      return this.content[i];
    }
  }, {
    key: "path",

    /**
     * Get a child node given a path.
     *
     * @param  {array} path
     * @return {Node}
     */
    value: function path(_path) {
      for (var i = 0, node = this; i < _path.length; node = node.content[_path[i]], i++) {}
      return node;
    }
  }, {
    key: "isValidPos",
    value: function isValidPos(pos, requireInBlock) {
      for (var i = 0, node = this;; i++) {
        if (i == pos.path.length) {
          if (requireInBlock && !node.isTextblock) return false;
          return pos.offset <= node.maxOffset;
        } else {
          var n = pos.path[i];
          if (n >= node.length || node.isTextblock) return false;
          node = node.child(n);
        }
      }
    }
  }, {
    key: "pathNodes",
    value: function pathNodes(path) {
      var nodes = [];
      for (var i = 0, node = this;; i++) {
        nodes.push(node);
        if (i == path.length) break;
        node = node.child(path[i]);
      }
      return nodes;
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      var obj = _get(Object.getPrototypeOf(BlockNode.prototype), "toJSON", this).call(this);
      obj.content = this.content.map(function (n) {
        return n.toJSON();
      });
      return obj;
    }
  }, {
    key: "nodesBetween",
    value: function nodesBetween(from, to, f) {
      var path = arguments.length <= 3 || arguments[3] === undefined ? [] : arguments[3];
      var parent = arguments.length <= 4 || arguments[4] === undefined ? null : arguments[4];

      if (f(this, path, from, to, parent) === false) return;

      var start = undefined,
          endPartial = to && to.depth > path.length;
      var end = endPartial ? to.path[path.length] : to ? to.offset : this.length;
      if (!from) {
        start = 0;
      } else if (from.depth == path.length) {
        start = from.offset;
      } else {
        start = from.path[path.length] + 1;
        var passTo = null;
        if (endPartial && end == start - 1) {
          passTo = to;
          endPartial = false;
        }
        this.enterNode(start - 1, from, passTo, path, f);
      }
      for (var i = start; i < end; i++) {
        this.enterNode(i, null, null, path, f);
      }if (endPartial) this.enterNode(end, null, to, path, f);
    }
  }, {
    key: "enterNode",
    value: function enterNode(index, from, to, path, f) {
      path.push(index);
      this.child(index).nodesBetween(from, to, f, path, this);
      path.pop();
    }
  }, {
    key: "inlineNodesBetween",
    value: function inlineNodesBetween(from, to, f) {
      this.nodesBetween(from, to, function (node, path, from, to, parent, offset) {
        if (node.isInline) f(node, from ? from.offset : offset, to ? to.offset : offset + node.offset, path, parent);
      });
    }
  }, {
    key: "maxOffset",
    get: function get() {
      return this.length;
    }
  }, {
    key: "textContent",
    get: function get() {
      var text = "";
      for (var i = 0; i < this.length; i++) {
        text += this.child(i).textContent;
      }return text;
    }
  }, {
    key: "firstChild",
    get: function get() {
      return this.content[0] || null;
    }
  }, {
    key: "lastChild",
    get: function get() {
      return this.content[this.length - 1] || null;
    }
  }, {
    key: "length",
    get: function get() {
      return this.content.length;
    }
  }, {
    key: "children",
    get: function get() {
      return this.content;
    }
  }, {
    key: "isBlock",
    get: function get() {
      return true;
    }
  }]);

  return BlockNode;
})(Node);

exports.BlockNode = BlockNode;

var TextblockNode = (function (_BlockNode) {
  _inherits(TextblockNode, _BlockNode);

  function TextblockNode(type, attrs, content) {
    _classCallCheck(this, TextblockNode);

    _get(Object.getPrototypeOf(TextblockNode.prototype), "constructor", this).call(this, type, attrs, content);
    var maxOffset = 0;
    for (var i = 0; i < this.content.length; i++) {
      maxOffset += this.content[i].offset;
    }this._maxOffset = maxOffset;
  }

  _createClass(TextblockNode, [{
    key: "slice",
    value: function slice(from) {
      var to = arguments.length <= 1 || arguments[1] === undefined ? this.maxOffset : arguments[1];

      var result = [];
      if (from == to) return result;
      for (var i = 0, offset = 0;; i++) {
        var child = this.child(i),
            size = child.offset,
            end = offset + size;
        if (offset + size > from) result.push(offset >= from && end <= to ? child : child.slice(Math.max(0, from - offset), Math.min(size, to - offset)));
        if (end >= to) return result;
        offset = end;
      }
    }
  }, {
    key: "append",
    value: function append(nodes) {
      if (!nodes.length) return this;
      if (!this.length) return this.copy(nodes);

      var content = this.content.concat(nodes),
          last = this.length - 1,
          merged = undefined;
      if (merged = content[last].maybeMerge(content[last + 1])) content.splice(last, 2, merged);
      return this.copy(content);
    }
  }, {
    key: "close",
    value: function close() {
      return this;
    }
  }, {
    key: "nodesBetween",
    value: function nodesBetween(from, to, f, path, parent) {
      if (f(this, path, from, to, parent) === false) return;
      var start = from ? from.offset : 0,
          end = to ? to.offset : this.maxOffset;
      if (start == end) return;
      for (var offset = 0, i = 0; i < this.length; i++) {
        var child = this.child(i),
            endOffset = offset + child.offset;
        if (endOffset >= start) f(child, path, offset < start ? from : null, endOffset > end ? to : null, this, offset);
        if (endOffset >= end) break;
        offset = endOffset;
      }
    }
  }, {
    key: "childBefore",
    value: function childBefore(offset) {
      if (offset == 0) return { node: null, index: 0, innerOffset: 0 };
      for (var i = 0; i < this.length; i++) {
        var child = this.child(i);
        offset -= child.offset;
        if (offset <= 0) return { node: child, index: i, innerOffset: offset + child.offset };
      }
    }
  }, {
    key: "childAfter",
    value: function childAfter(offset) {
      for (var i = 0; i < this.length; i++) {
        var child = this.child(i),
            size = child.offset;
        if (offset < size) return { node: child, index: i, innerOffset: offset };
        offset -= size;
      }
      return { node: null, index: 0, innerOffset: 0 };
    }
  }, {
    key: "isTextblock",
    get: function get() {
      return true;
    }
  }, {
    key: "maxOffset",
    get: function get() {
      return this._maxOffset;
    }
  }]);

  return TextblockNode;
})(BlockNode);

exports.TextblockNode = TextblockNode;

var InlineNode = (function (_Node2) {
  _inherits(InlineNode, _Node2);

  function InlineNode(type, attrs, content, styles) {
    _classCallCheck(this, InlineNode);

    if (content) throw new Error("Can't create a span node with content");
    _get(Object.getPrototypeOf(InlineNode.prototype), "constructor", this).call(this, type, attrs);
    this.styles = styles || emptyArray;
  }

  _createClass(InlineNode, [{
    key: "styled",
    value: function styled(styles) {
      return new this.constructor(this.type, this.attrs, this.text, styles);
    }
  }, {
    key: "maybeMerge",
    value: function maybeMerge(_) {
      return null;
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      var obj = _get(Object.getPrototypeOf(InlineNode.prototype), "toJSON", this).call(this);
      if (this.styles.length) obj.styles = this.styles.map(function (s) {
        return s.toJSON();
      });
      return obj;
    }
  }, {
    key: "toString",
    value: function toString() {
      return this.type.name;
    }
  }, {
    key: "offset",
    get: function get() {
      return 1;
    }
  }, {
    key: "textContent",
    get: function get() {
      return "";
    }
  }, {
    key: "isInline",
    get: function get() {
      return true;
    }
  }]);

  return InlineNode;
})(Node);

exports.InlineNode = InlineNode;

var TextNode = (function (_InlineNode) {
  _inherits(TextNode, _InlineNode);

  function TextNode(type, attrs, content, styles) {
    _classCallCheck(this, TextNode);

    if (typeof content != "string" || !content) throw new Error("Text node content must be a non-empty string");
    _get(Object.getPrototypeOf(TextNode.prototype), "constructor", this).call(this, type, attrs, null, styles);
    this.text = content;
  }

  _createClass(TextNode, [{
    key: "maybeMerge",
    value: function maybeMerge(other) {
      if (other.type == this.type && (0, _style.sameStyles)(this.styles, other.styles)) return new TextNode(this.type, this.attrs, this.text + other.text, this.styles);
    }
  }, {
    key: "slice",
    value: function slice(from) {
      var to = arguments.length <= 1 || arguments[1] === undefined ? this.offset : arguments[1];

      return new TextNode(this.type, this.attrs, this.text.slice(from, to), this.styles);
    }
  }, {
    key: "toString",
    value: function toString() {
      var text = JSON.stringify(this.text);
      for (var i = 0; i < this.styles.length; i++) {
        text = this.styles[i].type.name + "(" + text + ")";
      }return text;
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      var obj = _get(Object.getPrototypeOf(TextNode.prototype), "toJSON", this).call(this);
      obj.text = this.text;
      return obj;
    }
  }, {
    key: "offset",
    get: function get() {
      return this.text.length;
    }
  }, {
    key: "textContent",
    get: function get() {
      return this.text;
    }
  }, {
    key: "isText",
    get: function get() {
      return true;
    }
  }]);

  return TextNode;
})(InlineNode);

exports.TextNode = TextNode;

function compareMarkup(typeA, typeB, attrsA, attrsB) {
  if (typeA != typeB) return false;
  for (var prop in attrsA) if (attrsB[prop] !== attrsA[prop]) return false;
  return true;
}