"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.canLift = canLift;
exports.canWrap = canWrap;
exports.alreadyHasBlockType = alreadyHasBlockType;

var _model = require("../model");

var _transform = require("./transform");

var _step = require("./step");

var _tree = require("./tree");

var _map = require("./map");

(0, _step.defineStep)("ancestor", {
  apply: function apply(doc, step) {
    var from = step.from,
        to = step.to;
    if (!(0, _tree.isFlatRange)(from, to)) return null;
    var toParent = from.path,
        start = from.offset,
        end = to.offset;
    var depth = step.param.depth || 0,
        wrappers = step.param.wrappers || [];
    var inner = doc.path(from.path);
    for (var i = 0; i < depth; i++) {
      if (start > 0 || end < doc.path(toParent).maxOffset || toParent.length == 0) return null;
      start = toParent[toParent.length - 1];
      end = start + 1;
      toParent = toParent.slice(0, toParent.length - 1);
    }
    if (depth == 0 && wrappers.length == 0) return null;

    var parent = doc.path(toParent),
        parentSize = parent.length,
        newParent = undefined;
    if (parent.type.locked) return null;
    if (wrappers.length) {
      var _ret = (function () {
        var lastWrapper = wrappers[wrappers.length - 1];
        var content = inner.slice(from.offset, to.offset);
        if (!parent.type.canContain(wrappers[0]) || !content.every(function (n) {
          return lastWrapper.type.canContain(n);
        }) || !inner.length && !lastWrapper.type.canBeEmpty || lastWrapper.type.locked) return {
            v: null
          };
        var node = null;
        for (var i = wrappers.length - 1; i >= 0; i--) {
          node = wrappers[i].copy(node ? [node] : content);
        }newParent = parent.splice(start, end, [node]);
      })();

      if (typeof _ret === "object") return _ret.v;
    } else {
      if (!parent.type.canContainChildren(inner, true) || !inner.length && start == 0 && end == parent.length && !parent.type.canBeEmpty) return null;
      newParent = parent.splice(start, end, inner.children);
    }
    var copy = doc.replaceDeep(toParent, newParent);

    var toInner = toParent.slice();
    for (var i = 0; i < wrappers.length; i++) {
      toInner.push(i ? 0 : start);
    }var startOfInner = new _model.Pos(toInner, wrappers.length ? 0 : start);
    var replaced = null;
    var insertedSize = wrappers.length ? 1 : to.offset - from.offset;
    if (depth != wrappers.length || depth > 1 || wrappers.length > 1) {
      var posBefore = new _model.Pos(toParent, start);
      var posAfter1 = new _model.Pos(toParent, end),
          posAfter2 = new _model.Pos(toParent, start + insertedSize);
      var endOfInner = new _model.Pos(toInner, startOfInner.offset + (to.offset - from.offset));
      replaced = [new _map.ReplacedRange(posBefore, from, posBefore, startOfInner), new _map.ReplacedRange(to, posAfter1, endOfInner, posAfter2, posAfter1, posAfter2)];
    }
    var moved = [new _map.MovedRange(from, to.offset - from.offset, startOfInner)];
    if (end - start != insertedSize) moved.push(new _map.MovedRange(new _model.Pos(toParent, end), parentSize - end, new _model.Pos(toParent, start + insertedSize)));
    return new _transform.TransformResult(copy, new _map.PosMap(moved, replaced));
  },
  invert: function invert(step, oldDoc, map) {
    var wrappers = [];
    if (step.param.depth) for (var i = 0; i < step.param.depth; i++) {
      var _parent = oldDoc.path(step.from.path.slice(0, step.from.path.length - i));
      wrappers.unshift(_parent.copy());
    }
    var newFrom = map.map(step.from).pos;
    var newTo = step.from.cmp(step.to) ? map.map(step.to, -1).pos : newFrom;
    return new _step.Step("ancestor", newFrom, newTo, null, { depth: step.param.wrappers ? step.param.wrappers.length : 0,
      wrappers: wrappers });
  },
  paramToJSON: function paramToJSON(param) {
    return { depth: param.depth,
      wrappers: param.wrappers && param.wrappers.map(function (n) {
        return n.toJSON();
      }) };
  },
  paramFromJSON: function paramFromJSON(schema, json) {
    return { depth: json.depth,
      wrappers: json.wrappers && json.wrappers.map(schema.nodeFromJSON) };
  }
});

function canBeLifted(doc, range) {
  var content = [doc.path(range.from.path)],
      unwrap = false;
  for (;;) {
    var parentDepth = -1;

    var _loop = function (_node, i) {
      if (content.every(function (inner) {
        return _node.type.canContainChildren(inner);
      })) parentDepth = i;
      _node = _node.child(range.from.path[i]);
      exports.node = node = _node;
    };

    for (var node = doc, i = 0; i < range.from.path.length; i++) {
      _loop(node, i);
    }
    if (parentDepth > -1) return { path: range.from.path.slice(0, parentDepth), unwrap: unwrap };
    if (unwrap || !content[0].isBlock) return null;
    content = content[0].slice(range.from.offset, range.to.offset);
    unwrap = true;
  }
}

function canLift(doc, from, to) {
  var range = (0, _model.siblingRange)(doc, from, to || from);
  var found = canBeLifted(doc, range);
  if (found) return { found: found, range: range };
}

_transform.Transform.prototype.lift = function (from) {
  var to = arguments.length <= 1 || arguments[1] === undefined ? from : arguments[1];
  return (function () {
    var can = canLift(this.doc, from, to);
    if (!can) return this;
    var found = can.found;
    var range = can.range;

    var depth = range.from.path.length - found.path.length;
    var rangeNode = found.unwrap && this.doc.path(range.from.path);

    for (var d = 0, pos = range.to;; d++) {
      if (pos.offset < this.doc.path(pos.path).length) {
        this.split(pos, depth);
        break;
      }
      if (d == depth - 1) break;
      pos = pos.shorten(null, 1);
    }
    for (var d = 0, pos = range.from;; d++) {
      if (pos.offset > 0) {
        this.split(pos, depth - d);
        var cut = range.from.path.length - depth,
            path = pos.path.slice(0, cut).concat(pos.path[cut] + 1);
        while (path.length < range.from.path.length) path.push(0);
        range = { from: new _model.Pos(path, 0), to: new _model.Pos(path, range.to.offset - range.from.offset) };
        break;
      }
      if (d == depth - 1) break;
      pos = pos.shorten();
    }
    if (found.unwrap) {
      for (var i = range.to.offset - 1; i > range.from.offset; i--) {
        this.join(new _model.Pos(range.from.path, i));
      }var size = 0;
      for (var i = range.from.offset; i < range.to.offset; i++) {
        size += rangeNode.child(i).length;
      }var path = range.from.path.concat(range.from.offset);
      range = { from: new _model.Pos(path, 0), to: new _model.Pos(path, size) };
      ++depth;
    }
    this.step("ancestor", range.from, range.to, null, { depth: depth });
    return this;
  }).apply(this, arguments);
};

function canWrap(doc, from, to, node) {
  var range = (0, _model.siblingRange)(doc, from, to || from);
  if (range.from.offset == range.to.offset) return null;
  var parent = doc.path(range.from.path);
  var around = parent.type.findConnection(node.type);
  var inside = node.type.findConnection(parent.child(range.from.offset).type);
  if (around && inside) return { range: range, around: around, inside: inside };
}

_transform.Transform.prototype.wrap = function (from, to, node) {
  var can = canWrap(this.doc, from, to, node);
  if (!can) return this;
  var range = can.range;
  var around = can.around;
  var inside = can.inside;

  var wrappers = around.map(function (t) {
    return node.type.schema.node(t);
  }).concat(node).concat(inside.map(function (t) {
    return node.type.schema.node(t);
  }));
  this.step("ancestor", range.from, range.to, null, { wrappers: wrappers });
  if (inside.length) {
    var toInner = range.from.path.slice();
    for (var i = 0; i < around.length + inside.length + 1; i++) {
      toInner.push(i ? 0 : range.from.offset);
    }for (var i = range.to.offset - 1 - range.from.offset; i > 0; i--) {
      this.split(new _model.Pos(toInner, i), inside.length);
    }
  }
  return this;
};

function alreadyHasBlockType(doc, from, to, type, attrs) {
  var found = false;
  if (!attrs) attrs = {};
  doc.nodesBetween(from, to || from, function (node) {
    if (node.isTextblock) {
      if (!(0, _model.compareMarkup)(node.type, type, node.attrs, attrs)) found = true;
      return false;
    }
  });
  return found;
}

_transform.Transform.prototype.setBlockType = function (from, to, wrapNode) {
  var _this = this;

  this.doc.nodesBetween(from, to || from, function (node, path) {
    if (node.isTextblock && !node.sameMarkup(wrapNode)) {
      path = path.slice();
      // Ensure all markup that isn't allowed in the new node type is cleared
      _this.clearMarkup(new _model.Pos(path, 0), new _model.Pos(path, node.maxOffset), wrapNode.type);
      _this.step("ancestor", new _model.Pos(path, 0), new _model.Pos(path, _this.doc.path(path).maxOffset), null, { depth: 1, wrappers: [wrapNode] });
      return false;
    }
  });
  return this;
};