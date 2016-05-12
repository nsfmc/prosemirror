"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.canLift = canLift;
exports.canWrap = canWrap;

var _model = require("../model");

var _transform = require("./transform");

var _step = require("./step");

var _map = require("./map");

// !! **`ancestor`**
//    : Change the stack of nodes that wrap the part of the document
//      between `from` and `to`, which must point into the same parent
//      node.
//
//      The set of ancestors to replace is determined by the `depth`
//      property of the step's parameter. If this is greater than
//      zero, `from` and `to` must point at the start and end of a
//      stack of nodes, of that depth, since this step will not split
//      nodes.
//
//      The set of new ancestors to wrap with is determined by the
//      `types` and `attrs` properties of the parameter. The first
//      should be an array of `NodeType`s, and the second, optionally,
//      an array of attribute objects.

function isFlatRange($from, $to) {
  if ($from.depth != $to.depth) return false;
  for (var i = 0; i < $from.depth; i++) {
    if ($from.index(i) != $to.index(i)) return false;
  }return $from.parentOffset <= $to.parentOffset;
}

_step.Step.define("ancestor", {
  apply: function apply(doc, step) {
    var $from = doc.resolve(step.from),
        $to = doc.resolve(step.to);
    if (!isFlatRange($from, $to)) return _step.StepResult.fail("Not a flat range");

    var _step$param = step.param;
    var _step$param$depth = _step$param.depth;
    var depth = _step$param$depth === undefined ? 0 : _step$param$depth;
    var _step$param$types = _step$param.types;
    var types = _step$param$types === undefined ? [] : _step$param$types;
    var _step$param$attrs = _step$param.attrs;
    var attrs = _step$param$attrs === undefined ? [] : _step$param$attrs;

    if (depth == 0 && types.length == 0) return _step.StepResult.ok(doc);

    for (var i = 0, d = $from.depth; i < depth; i++, d--) {
      if ($from.start(d) != $from.pos - i || $to.end(d) != $to.pos + i) return _step.StepResult.fail("Parent at depth " + d + " not fully covered");
    }var inner = $from.parent,
        slice = void 0;
    if (types.length) {
      var lastWrapper = types[types.length - 1];
      if (!lastWrapper.contains) throw new RangeError("Can not wrap content in node type " + lastWrapper.name);
      var content = inner.content.cut($from.parentOffset, $to.parentOffset);
      if (!lastWrapper.checkContent(content, attrs[types.length - 1])) return _step.StepResult.fail("Content can not be wrapped in ancestor " + lastWrapper.name);
      for (var _i = types.length - 1; _i >= 0; _i--) {
        content = _model.Fragment.from(types[_i].create(attrs[_i], content));
      }slice = new _model.Slice(content, 0, 0);
    } else {
      slice = new _model.Slice(inner.content, 0, 0);
    }
    return _step.StepResult.fromReplace(doc, $from.pos - depth, $to.pos + depth, slice);
  },
  posMap: function posMap(step) {
    var depth = step.param.depth || 0,
        newDepth = step.param.types ? step.param.types.length : 0;
    if (depth == newDepth && depth < 2) return _map.PosMap.empty;
    return new _map.PosMap([step.from - depth, depth, newDepth, step.to, depth, newDepth]);
  },
  invert: function invert(step, oldDoc) {
    var types = [],
        attrs = [];
    var $from = oldDoc.resolve(step.from);
    var oldDepth = step.param.depth || 0,
        newDepth = step.param.types ? step.param.types.length : 0;
    for (var i = 0; i < oldDepth; i++) {
      var parent = $from.node($from.depth - i);
      types.unshift(parent.type);
      attrs.unshift(parent.attrs);
    }
    var dDepth = newDepth - oldDepth;
    return new _step.Step("ancestor", step.from + dDepth, step.to + dDepth, { depth: newDepth, types: types, attrs: attrs });
  },
  paramToJSON: function paramToJSON(param) {
    return { depth: param.depth,
      types: param.types && param.types.map(function (t) {
        return t.name;
      }),
      attrs: param.attrs };
  },
  paramFromJSON: function paramFromJSON(schema, json) {
    return { depth: json.depth,
      types: json.types && json.types.map(function (n) {
        return schema.nodeType(n);
      }),
      attrs: json.attrs };
  }
});

// :: (Node, number, ?number) → bool
// Tells you whether the range in the given positions' shared
// ancestor, or any of _its_ ancestor nodes, can be lifted out of a
// parent.
function canLift(doc, from, to) {
  return !!findLiftable(doc.resolve(from), doc.resolve(to == null ? from : to));
}

function rangeDepth(from, to) {
  var shared = from.sameDepth(to);
  if (from.node(shared).isTextblock) --shared;
  if (shared && from.before(shared) >= to.after(shared)) return null;
  return shared;
}

function findLiftable(from, to) {
  var shared = rangeDepth(from, to);
  if (shared == null) return null;
  var parent = from.node(shared);
  for (var depth = shared - 1; depth >= 0; --depth) {
    if (from.node(depth).type.canContainContent(parent.type)) return { depth: depth, shared: shared, unwrap: false };
  }if (parent.isBlock) for (var _depth = shared - 1; _depth >= 0; --_depth) {
    var target = from.node(_depth);
    for (var i = from.index(shared), e = Math.min(to.index(shared) + 1, parent.childCount); i < e; i++) {
      if (!target.type.canContainContent(parent.child(i).type)) continue;
    }return { depth: _depth, shared: shared, unwrap: true };
  }
}

// :: (number, ?number, ?bool) → Transform
// Lift the nearest liftable ancestor of the [sibling
// range](#Node.siblingRange) of the given positions out of its parent
// (or do nothing if no such node exists). When `silent` is true, this
// won't raise an error when the lift is impossible.
_transform.Transform.prototype.lift = function (from) {
  var to = arguments.length <= 1 || arguments[1] === undefined ? from : arguments[1];
  var silent = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

  var $from = this.doc.resolve(from),
      $to = this.doc.resolve(to);
  var liftable = findLiftable($from, $to);
  if (!liftable) {
    if (!silent) throw new RangeError("No valid lift target");
    return this;
  }

  var depth = liftable.depth;
  var shared = liftable.shared;
  var unwrap = liftable.unwrap;

  var start = $from.before(shared + 1),
      end = $to.after(shared + 1);

  for (var d = shared; d > depth; d--) {
    if ($to.index(d) + 1 < $to.node(d).childCount) {
      this.split($to.after(d + 1), d - depth);
      break;
    }
  }for (var _d = shared; _d > depth; _d--) {
    if ($from.index(_d) > 0) {
      var cut = _d - depth;
      this.split($from.before(_d + 1), cut);
      start += 2 * cut;
      end += 2 * cut;
      break;
    }
  }if (unwrap) {
    var joinPos = start,
        parent = $from.node(shared);
    for (var i = $from.index(shared), e = $to.index(shared) + 1, first = true; i < e; i++, first = false) {
      if (!first) {
        this.join(joinPos);
        end -= 2;
      }
      joinPos += parent.child(i).nodeSize - (first ? 0 : 2);
    }
    shared++;
    start++;
    end--;
  }
  return this.step("ancestor", start, end, { depth: shared - depth });
};

// :: (Node, number, ?number, NodeType) → bool
// Determines whether the [sibling range](#Node.siblingRange) of the
// given positions can be wrapped in the given node type.
function canWrap(doc, from, to, type) {
  return !!checkWrap(doc.resolve(from), doc.resolve(to == null ? from : to), type);
}

function checkWrap($from, $to, type) {
  var shared = rangeDepth($from, $to);
  if (shared == null) return null;
  var parent = $from.node(shared);
  var around = parent.type.findConnection(type);
  var inside = type.findConnection(parent.child($from.index(shared)).type);
  if (around && inside) return { shared: shared, around: around, inside: inside };
}

// :: (number, ?number, NodeType, ?Object) → Transform
// Wrap the [sibling range](#Node.siblingRange) of the given positions
// in a node of the given type, with the given attributes (if
// possible).
_transform.Transform.prototype.wrap = function (from) {
  var to = arguments.length <= 1 || arguments[1] === undefined ? from : arguments[1];
  var type = arguments[2];
  var wrapAttrs = arguments[3];

  var $from = this.doc.resolve(from),
      $to = this.doc.resolve(to);
  var check = checkWrap($from, $to, type);
  if (!check) throw new RangeError("Wrap not possible");
  var shared = check.shared;
  var around = check.around;
  var inside = check.inside;


  var types = around.concat(type).concat(inside);
  var attrs = around.map(function () {
    return null;
  }).concat(wrapAttrs).concat(inside.map(function () {
    return null;
  }));
  var start = $from.before(shared + 1);
  this.step("ancestor", start, $to.after(shared + 1), { types: types, attrs: attrs });
  if (inside.length) {
    var splitPos = start + types.length,
        parent = $from.node(shared);
    for (var i = $from.index(shared), e = $to.index(shared) + 1, first = true; i < e; i++, first = false) {
      if (!first) this.split(splitPos, inside.length);
      splitPos += parent.child(i).nodeSize + (first ? 0 : 2 * inside.length);
    }
  }
  return this;
};

// :: (number, ?number, NodeType, ?Object) → Transform
// Set the type of all textblocks (partly) between `from` and `to` to
// the given node type with the given attributes.
_transform.Transform.prototype.setBlockType = function (from) {
  var to = arguments.length <= 1 || arguments[1] === undefined ? from : arguments[1];

  var _this = this;

  var type = arguments[2];
  var attrs = arguments[3];

  if (!type.isTextblock) throw new RangeError("Type given to setBlockType should be a textblock");
  this.doc.nodesBetween(from, to, function (node, pos) {
    if (node.isTextblock && !node.hasMarkup(type, attrs)) {
      // Ensure all markup that isn't allowed in the new node type is cleared
      var start = pos + 1,
          end = start + node.content.size;
      _this.clearMarkup(_this.map(start), _this.map(end), type);
      _this.step("ancestor", _this.map(start), _this.map(end), { depth: 1, types: [type], attrs: [attrs] });
      return false;
    }
  });
  return this;
};

// :: (number, ?NodeType, ?Object) → Transform
// Change the type and attributes of the node after `pos`.
_transform.Transform.prototype.setNodeType = function (pos, type, attrs) {
  var node = this.doc.nodeAt(pos);
  if (!node) throw new RangeError("No node at given position");
  if (!type) type = node.type;
  if (node.type.contains) return this.step("ancestor", pos + 1, pos + 1 + node.content.size, { depth: 1, types: [type], attrs: [attrs] });else return this.replaceWith(pos, pos + node.nodeSize, type.create(attrs, null, node.marks));
};