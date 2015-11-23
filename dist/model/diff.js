"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.findDiffStart = findDiffStart;
exports.findDiffEnd = findDiffEnd;

var _pos = require("./pos");

var _style = require("./style");

function findDiffStart(a, b) {
  var pathA = arguments.length <= 2 || arguments[2] === undefined ? [] : arguments[2];
  var pathB = arguments.length <= 3 || arguments[3] === undefined ? [] : arguments[3];

  var offset = 0;
  for (var i = 0;; i++) {
    if (i == a.length || i == b.length) {
      if (a.length == b.length) return null;
      break;
    }
    var childA = a.child(i),
        childB = b.child(i);
    if (childA == childB) {
      offset += a.isTextblock ? childA.offset : 1;
      continue;
    }

    if (!childA.sameMarkup(childB)) break;

    if (a.isTextblock) {
      if (!(0, _style.sameStyles)(childA.styles, childB.styles)) break;
      if (childA.isText && childA.text != childB.text) {
        for (var j = 0; childA.text[j] == childB.text[j]; j++) {
          offset++;
        }break;
      }
      offset += childA.offset;
    } else {
      var inner = findDiffStart(childA, childB, pathA.concat(i), pathB.concat(i));
      if (inner) return inner;
      offset++;
    }
  }
  return { a: new _pos.Pos(pathA, offset), b: new _pos.Pos(pathB, offset) };
}

function findDiffEnd(a, b) {
  var pathA = arguments.length <= 2 || arguments[2] === undefined ? [] : arguments[2];
  var pathB = arguments.length <= 3 || arguments[3] === undefined ? [] : arguments[3];

  var iA = a.length,
      iB = b.length;
  var offset = 0;

  for (;; iA--, iB--) {
    if (iA == 0 || iB == 0) {
      if (iA == iB) return null;
      break;
    }
    var childA = a.child(iA - 1),
        childB = b.child(iB - 1);
    if (childA == childB) {
      offset += a.isTextblock ? childA.offset : 1;
      continue;
    }

    if (!childA.sameMarkup(childB)) break;

    if (a.isTextblock) {
      if (!(0, _style.sameStyles)(childA.styles, childB.styles)) break;

      if (childA.isText && childA.text != childB.text) {
        var same = 0,
            minSize = Math.min(childA.text.length, childB.text.length);
        while (same < minSize && childA.text[childA.text.length - same - 1] == childB.text[childB.text.length - same - 1]) {
          same++;
          offset++;
        }
        break;
      }
      offset += childA.offset;
    } else {
      var inner = findDiffEnd(childA, childB, pathA.concat(iA - 1), pathB.concat(iB - 1));
      if (inner) return inner;
      offset++;
    }
  }
  return { a: new _pos.Pos(pathA, a.maxOffset - offset),
    b: new _pos.Pos(pathB, b.maxOffset - offset) };
}