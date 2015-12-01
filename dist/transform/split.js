"use strict";

var _model = require("../model");

var _transform = require("./transform");

var _step = require("./step");

var _map = require("./map");

(0, _step.defineStep)("split", {
  apply: function apply(doc, step) {
    var pos = step.pos;
    if (pos.depth == 0) return null;

    var _pos$shorten = pos.shorten();

    var parentPath = _pos$shorten.path;
    var offset = _pos$shorten.offset;

    var parent = doc.path(parentPath);
    var target = parent.child(offset),
        targetSize = target.maxOffset;

    var splitAt = pos.offset;
    if (splitAt == 0 && !target.type.canBeEmpty || target.type.locked || splitAt == target.maxOffset && !(step.param || target).type.canBeEmpty) return null;
    var newParent = parent.splice(offset, offset + 1, [target.copy(target.slice(0, splitAt)), (step.param || target).copy(target.slice(splitAt))]);
    var copy = doc.replaceDeep(parentPath, newParent);

    var dest = new _model.Pos(parentPath.concat(offset + 1), 0);
    var map = new _map.PosMap([new _map.MovedRange(pos, targetSize - pos.offset, dest), new _map.MovedRange(new _model.Pos(parentPath, offset + 1), newParent.length - 2 - offset, new _model.Pos(parentPath, offset + 2))], [new _map.ReplacedRange(pos, pos, pos, dest, pos, pos.shorten(null, 1))]);
    return new _transform.TransformResult(copy, map);
  },
  invert: function invert(step, _oldDoc, map) {
    return new _step.Step("join", step.pos, map.map(step.pos).pos);
  },
  paramToJSON: function paramToJSON(param) {
    return param && param.toJSON();
  },
  paramFromJSON: function paramFromJSON(schema, json) {
    return json && schema.nodeFromJSON(json);
  }
});

_transform.Transform.prototype.split = function (pos) {
  var depth = arguments.length <= 1 || arguments[1] === undefined ? 1 : arguments[1];
  var nodeAfter = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];

  if (depth == 0) return this;
  for (var i = 0;; i++) {
    this.step("split", null, null, pos, nodeAfter);
    if (i == depth - 1) return this;
    nodeAfter = null;
    pos = pos.shorten(null, 1);
  }
};

_transform.Transform.prototype.splitIfNeeded = function (pos) {
  var depth = arguments.length <= 1 || arguments[1] === undefined ? 1 : arguments[1];

  for (var off = 0; off < depth; off++) {
    var here = pos.shorten(pos.depth - off);
    if (here.offset && here.offset < this.doc.path(here.path).maxOffset) this.step("split", null, null, here);
  }
  return this;
};