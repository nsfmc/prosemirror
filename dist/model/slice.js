"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.childrenBefore = childrenBefore;
exports.sliceBefore = sliceBefore;
exports.childrenAfter = childrenAfter;
exports.sliceAfter = sliceAfter;
exports.childrenBetween = childrenBetween;
exports.sliceBetween = sliceBetween;
exports.siblingRange = siblingRange;

var _pos = require("./pos");

// FIXME move to node methods

function childrenBefore(node, pos) {
  var depth = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];

  if (depth == pos.depth) return node.slice(0, pos.offset);

  var n = pos.path[depth];
  return node.slice(0, n).concat(sliceBefore(node.child(n), pos, depth + 1));
}

function sliceBefore(node, pos) {
  var depth = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];

  return node.copy(childrenBefore(node, pos, depth));
}

function childrenAfter(node, pos) {
  var depth = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];

  if (depth == pos.depth) return node.slice(pos.offset);
  var n = pos.path[depth];
  var content = node.slice(n + 1);
  content.unshift(sliceAfter(node.child(n), pos, depth + 1));
  return content;
}

function sliceAfter(node, pos) {
  var depth = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];

  return node.copy(childrenAfter(node, pos, depth));
}

function childrenBetween(node, from, to) {
  var depth = arguments.length <= 3 || arguments[3] === undefined ? 0 : arguments[3];

  var fromEnd = depth == from.depth,
      toEnd = depth == to.depth;
  if (fromEnd && toEnd) return node.slice(from.offset, to.offset);
  if (!fromEnd && !toEnd && from.path[depth] == to.path[depth]) return [sliceBetween(node.child(from.path[depth]), from, to, false, depth + 1)];

  var content = [],
      start = undefined;
  if (!fromEnd) {
    start = from.path[depth] + 1;
    content.push(sliceAfter(node.child(start - 1), from, depth + 1));
  } else {
    start = from.offset;
  }
  var end = toEnd ? to.offset : to.path[depth];
  var between = node.slice(start, end);
  for (var i = 0; i < between.length; i++) {
    content.push(between[i]);
  }if (!toEnd) content.push(sliceBefore(node.child(end), to, depth + 1));
  return content;
}

function sliceBetween(node, from, to) {
  var collapse = arguments.length <= 3 || arguments[3] === undefined ? true : arguments[3];
  var depth = arguments.length <= 4 || arguments[4] === undefined ? 0 : arguments[4];

  if (depth < from.depth && depth < to.depth && from.path[depth] == to.path[depth]) {
    var inner = sliceBetween(node.child(from.path[depth]), from, to, collapse, depth + 1);
    if (!collapse) return node.copy([inner]);
    if (node.type.name != "doc") return inner;
    var conn = node.type.findConnection(inner.type);
    for (var i = conn.length - 1; i >= 0; i--) {
      inner = node.type.schema.node(conn[i], null, [inner]);
    }return node.copy([inner]);
  } else {
    return node.copy(childrenBetween(node, from, to, depth));
  }
}

function siblingRange(doc, from, to) {
  for (var i = 0, node = doc;; i++) {
    if (node.isTextblock) {
      var path = from.path.slice(0, i - 1),
          offset = from.path[i - 1];
      return { from: new _pos.Pos(path, offset), to: new _pos.Pos(path, offset + 1) };
    }
    var fromEnd = i == from.path.length,
        toEnd = i == to.path.length;
    var left = fromEnd ? from.offset : from.path[i];
    var right = toEnd ? to.offset : to.path[i];
    if (fromEnd || toEnd || left != right) {
      var path = from.path.slice(0, i);
      return { from: new _pos.Pos(path, left), to: new _pos.Pos(path, right + (toEnd ? 0 : 1)) };
    }
    node = node.child(left);
  }
}