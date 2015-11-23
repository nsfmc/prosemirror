"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.copyStructure = copyStructure;
exports.copyInline = copyInline;
exports.isFlatRange = isFlatRange;
exports.replaceHasEffect = replaceHasEffect;
exports.samePathDepth = samePathDepth;

function copyStructure(node, from, to, f) {
  var depth = arguments.length <= 4 || arguments[4] === undefined ? 0 : arguments[4];

  if (node.isTextblock) {
    return f(node, from, to);
  } else {
    if (!node.length) return node;
    var start = from ? from.path[depth] : 0;
    var end = to ? to.path[depth] : node.length - 1;
    var content = node.slice(0, start);
    if (start == end) {
      content.push(copyStructure(node.child(start), from, to, f, depth + 1));
    } else {
      content.push(copyStructure(node.child(start), from, null, f, depth + 1));
      for (var i = start + 1; i < end; i++) {
        content.push(copyStructure(node.child(i), null, null, f, depth + 1));
      }content.push(copyStructure(node.child(end), null, to, f, depth + 1));
    }
    for (var i = end + 1; i < node.length; i++) {
      content.push(node.child(i));
    }return node.copy(content);
  }
}

function copyInline(node, from, to, f) {
  var start = from ? from.offset : 0;
  var end = to ? to.offset : node.maxOffset;
  var copied = node.slice(0, start).concat(node.slice(start, end).map(f)).concat(node.slice(end));
  for (var i = copied.length - 2; i >= 0; i--) {
    var merged = copied[i].maybeMerge(copied[i + 1]);
    if (merged) copied.splice(i, 2, merged);
  }
  return node.copy(copied);
}

function isFlatRange(from, to) {
  if (from.path.length != to.path.length) return false;
  for (var i = 0; i < from.path.length; i++) {
    if (from.path[i] != to.path[i]) return false;
  }return from.offset <= to.offset;
}

function canBeJoined(node, offset, depth) {
  if (!depth || offset == 0 || offset == node.length) return false;
  var left = node.child(offset - 1),
      right = node.child(offset);
  return left.sameMarkup(right);
}

function replaceHasEffect(doc, from, to) {
  for (var depth = 0, node = doc;; depth++) {
    var fromEnd = depth == from.depth,
        toEnd = depth == to.depth;
    if (fromEnd || toEnd || from.path[depth] != to.path[depth]) {
      var gapStart = undefined,
          gapEnd = undefined;
      if (fromEnd) {
        gapStart = from.offset;
      } else {
        gapStart = from.path[depth] + 1;
        for (var i = depth + 1, n = node.child(gapStart - 1); i <= from.path.length; i++) {
          if (i == from.path.length) {
            if (from.offset < n.maxOffset) return true;
          } else {
            if (from.path[i] + 1 < n.maxOffset) return true;
            n = n.child(from.path[i]);
          }
        }
      }
      if (toEnd) {
        gapEnd = to.offset;
      } else {
        gapEnd = to.path[depth];
        for (var i = depth + 1; i <= to.path.length; i++) {
          if ((i == to.path.length ? to.offset : to.path[i]) > 0) return true;
        }
      }
      if (gapStart != gapEnd) return true;
      return canBeJoined(node, gapStart, Math.min(from.depth, to.depth) - depth);
    } else {
      node = node.child(from.path[depth]);
    }
  }
}

function samePathDepth(a, b) {
  for (var i = 0;; i++) {
    if (i == a.path.length || i == b.path.length || a.path[i] != b.path[i]) return i;
  }
}