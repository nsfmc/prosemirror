"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.joinable = joinable;
exports.joinPoint = joinPoint;

var _model = require("../model");

var _transform = require("./transform");

var _step = require("./step");

var _map = require("./map");

// !! **`join`**
//   : Join two block elements together. `from` and `to` must point at
//     the end of the first and start of the second element (so that
//     the intention is preserved even when the positions are mapped).

_step.Step.define("join", {
  apply: function apply(doc, step) {
    var $from = doc.resolve(step.from),
        $to = doc.resolve(step.to);
    if ($from.parentOffset < $from.parent.content.size || $to.parentOffset > 0 || $to.pos - $from.pos != 2) return _step.StepResult.fail("Join positions not around a split");
    return _step.StepResult.fromReplace(doc, $from.pos, $to.pos, _model.Slice.empty);
  },
  posMap: function posMap(step) {
    return new _map.PosMap([step.from, 2, 0]);
  },
  invert: function invert(step, doc) {
    var $before = doc.resolve(step.from),
        d1 = $before.depth - 1;
    var parentAfter = $before.node(d1).child($before.index(d1) + 1);
    var param = null;
    if (!$before.parent.sameMarkup(parentAfter)) param = { type: parentAfter.type, attrs: parentAfter.attrs };
    return new _step.Step("split", step.from, step.from, param);
  }
});

// :: (Node, number) → bool
// Test whether the blocks before and after a given position can be
// joined.
function joinable(doc, pos) {
  var $pos = doc.resolve(pos);
  return canJoin($pos.nodeBefore, $pos.nodeAfter);
}

function canJoin(a, b) {
  return a && b && !a.isText && a.type.contains && a.type.canContainContent(b.type);
}

// :: (Node, number, ?number) → ?number
// Find an ancestor of the given position that can be joined to the
// block before (or after if `dir` is positive). Returns the joinable
// point, if any.
function joinPoint(doc, pos) {
  var dir = arguments.length <= 2 || arguments[2] === undefined ? -1 : arguments[2];

  var $pos = doc.resolve(pos);
  for (var d = $pos.depth;; d--) {
    var before = void 0,
        after = void 0;
    if (d == $pos.depth) {
      before = $pos.nodeBefore;
      after = $pos.nodeAfter;
    } else if (dir > 0) {
      before = $pos.node(d + 1);
      after = $pos.node(d).maybeChild($pos.index(d) + 1);
    } else {
      before = $pos.node(d).maybeChild($pos.index(d) - 1);
      after = $pos.node(d + 1);
    }
    if (before && !before.isTextblock && canJoin(before, after)) return pos;
    if (d == 0) break;
    pos = dir < 0 ? $pos.before(d) : $pos.after(d);
  }
}

// :: (number, ?number, ?bool) → Transform
// Join the blocks around the given position. When `silent` is true,
// the method will return without raising an error if the position
// isn't a valid place to join.
_transform.Transform.prototype.join = function (pos) {
  var depth = arguments.length <= 1 || arguments[1] === undefined ? 1 : arguments[1];
  var silent = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

  for (var i = 0; i < depth; i++) {
    var $pos = this.doc.resolve(pos);
    if ($pos.parentOffset == 0 || $pos.parentOffset == $pos.parent.content.size || !$pos.nodeBefore.type.canContainContent($pos.nodeAfter.type)) {
      if (!silent) throw new RangeError("Nothing to join at " + pos);
      break;
    }
    this.step("join", pos - 1, pos + 1);
    pos--;
  }
  return this;
};