"use strict";

var _model = require("../model");

var _transform = require("./transform");

var _step = require("./step");

var _map = require("./map");

// !! **`split`**
//   : Split a block node at `pos`. The parameter, if given, may be
//     `{type, ?attrs}` object giving the node type and optionally the
//     attributes of the node created to hold the content after the
//     split.

_step.Step.define("split", {
  apply: function apply(doc, step) {
    var $pos = doc.resolve(step.from),
        parent = $pos.parent;
    var cut = [parent.copy(), step.param ? step.param.type.create(step.param.attrs) : parent.copy()];
    return _step.StepResult.fromReplace(doc, $pos.pos, $pos.pos, new _model.Slice(_model.Fragment.fromArray(cut), 1, 1));
  },
  posMap: function posMap(step) {
    return new _map.PosMap([step.from, 0, 2]);
  },
  invert: function invert(step) {
    return new _step.Step("join", step.from, step.from + 2);
  },
  paramToJSON: function paramToJSON(param) {
    return param && { type: param.type.name, attrs: param.attrs };
  },
  paramFromJSON: function paramFromJSON(schema, json) {
    return json && { type: schema.nodeType(json.type), attrs: json.attrs };
  }
});

// :: (number, ?number, ?NodeType, ?Object) → Transform
// Split the node at the given position, and optionally, if `depth` is
// greater than one, any number of nodes above that. By default, the part
// split off will inherit the node type of the original node. This can
// be changed by passing `typeAfter` and `attrsAfter`.
_transform.Transform.prototype.split = function (pos) {
  var depth = arguments.length <= 1 || arguments[1] === undefined ? 1 : arguments[1];
  var typeAfter = arguments[2];
  var attrsAfter = arguments[3];

  for (var i = 0; i < depth; i++) {
    this.step("split", pos + i, pos + i, i == 0 && typeAfter ? { type: typeAfter, attrs: attrsAfter } : null);
  }return this;
};

// :: (number, ?number) → Transform
// Split at the given position, up to the given depth, if that
// position isn't already at the start or end of its parent node.
_transform.Transform.prototype.splitIfNeeded = function (pos) {
  var depth = arguments.length <= 1 || arguments[1] === undefined ? 1 : arguments[1];

  var $pos = this.doc.resolve(pos),
      before = true;
  for (var i = 0; i < depth; i++) {
    var d = $pos.depth - i,
        point = i == 0 ? $pos.pos : before ? $pos.before(d + 1) : $pos.after(d + 1);
    if (point == $pos.start(d)) before = true;else if (point == $pos.end(d)) before = false;else return this.split(point, depth - i);
  }
  return this;
};