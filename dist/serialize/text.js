"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.toText = toText;

var _model = require("../model");

var _index = require("./index");

_model.Block.prototype.serializeText = function (node) {
  var accum = "";
  for (var i = 0; i < node.length; i++) {
    var child = node.child(i);
    accum += child.type.serializeText(child);
  }
  return accum;
};

_model.Textblock.prototype.serializeText = function (node) {
  var text = _model.Block.prototype.serializeText(node);
  return text && text + "\n\n";
};

_model.Inline.prototype.serializeText = function () {
  return "";
};

_model.HardBreak.prototype.serializeText = function () {
  return "\n";
};

_model.Text.prototype.serializeText = function (node) {
  return node.text;
};

function toText(doc) {
  return doc.type.serializeText(doc).trim();
}

(0, _index.defineTarget)("text", toText);