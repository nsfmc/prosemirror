"use strict";

var _model = require("../model");

var _transform = require("./transform");

var _step = require("./step");

// !!
// **`addMark`**
//   : Add the `Mark` given as the step's parameter to all
//     inline content between `from` and `to` (when allowed).
//
// **`removeMark`**
//   : Remove the `Mark` given as the step's parameter from all inline
//     content between `from` and `to`.

function mapNode(node, f, parent) {
  if (node.content.size) node = node.copy(mapFragment(node.content, f, node));
  if (node.isInline) node = f(node, parent);
  return node;
}

function mapFragment(fragment, f, parent) {
  var mapped = [];
  for (var i = 0; i < fragment.childCount; i++) {
    mapped.push(mapNode(fragment.child(i), f, parent));
  }return _model.Fragment.fromArray(mapped);
}

_step.Step.define("addMark", {
  apply: function apply(doc, step) {
    var slice = doc.slice(step.from, step.to),
        $pos = doc.resolve(step.from);
    slice.content = mapFragment(slice.content, function (node, parent) {
      if (!parent.type.canContainMark(step.param.type)) return node;
      return node.mark(step.param.addToSet(node.marks));
    }, $pos.node($pos.depth - slice.openLeft));
    return _step.StepResult.fromReplace(doc, step.from, step.to, slice);
  },
  invert: function invert(step) {
    return new _step.Step("removeMark", step.from, step.to, step.param);
  },
  paramToJSON: function paramToJSON(param) {
    return param.toJSON();
  },
  paramFromJSON: function paramFromJSON(schema, json) {
    return schema.markFromJSON(json);
  }
});

// :: (number, number, Mark) → Transform
// Add the given mark to the inline content between `from` and `to`.
_transform.Transform.prototype.addMark = function (from, to, mark) {
  var _this = this;

  var removed = [],
      added = [],
      removing = null,
      adding = null;
  this.doc.nodesBetween(from, to, function (node, pos, parent) {
    if (!node.isInline) return;
    var marks = node.marks;
    if (mark.isInSet(marks) || !parent.type.canContainMark(mark.type)) {
      adding = removing = null;
    } else {
      var start = Math.max(pos, from),
          end = Math.min(pos + node.nodeSize, to);
      var rm = mark.type.isInSet(marks);

      if (!rm) removing = null;else if (removing && removing.param.eq(rm)) removing.to = end;else removed.push(removing = new _step.Step("removeMark", start, end, rm));

      if (adding) adding.to = end;else added.push(adding = new _step.Step("addMark", start, end, mark));
    }
  });

  removed.forEach(function (s) {
    return _this.step(s);
  });
  added.forEach(function (s) {
    return _this.step(s);
  });
  return this;
};

_step.Step.define("removeMark", {
  apply: function apply(doc, step) {
    var slice = doc.slice(step.from, step.to);
    slice.content = mapFragment(slice.content, function (node) {
      return node.mark(step.param.removeFromSet(node.marks));
    });
    return _step.StepResult.fromReplace(doc, step.from, step.to, slice);
  },
  invert: function invert(step) {
    return new _step.Step("addMark", step.from, step.to, step.param);
  },
  paramToJSON: function paramToJSON(param) {
    return param.toJSON();
  },
  paramFromJSON: function paramFromJSON(schema, json) {
    return schema.markFromJSON(json);
  }
});

// :: (number, number, ?union<Mark, MarkType>) → Transform
// Remove the given mark, or all marks of the given type, from inline
// nodes between `from` and `to`.
_transform.Transform.prototype.removeMark = function (from, to) {
  var _this2 = this;

  var mark = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];

  var matched = [],
      step = 0;
  this.doc.nodesBetween(from, to, function (node, pos) {
    if (!node.isInline) return;
    step++;
    var toRemove = null;
    if (mark instanceof _model.MarkType) {
      var found = mark.isInSet(node.marks);
      if (found) toRemove = [found];
    } else if (mark) {
      if (mark.isInSet(node.marks)) toRemove = [mark];
    } else {
      toRemove = node.marks;
    }
    if (toRemove && toRemove.length) {
      var end = Math.min(pos + node.nodeSize, to);
      for (var i = 0; i < toRemove.length; i++) {
        var style = toRemove[i],
            _found = void 0;
        for (var j = 0; j < matched.length; j++) {
          var m = matched[j];
          if (m.step == step - 1 && style.eq(matched[j].style)) _found = m;
        }
        if (_found) {
          _found.to = end;
          _found.step = step;
        } else {
          matched.push({ style: style, from: Math.max(pos, from), to: end, step: step });
        }
      }
    }
  });
  matched.forEach(function (m) {
    return _this2.step("removeMark", m.from, m.to, m.style);
  });
  return this;
};

// :: (number, number, ?NodeType) → Transform
// Remove all marks and non-text inline nodes, or if `newParent` is
// given, all marks and inline nodes that may not appear as content of
// `newParent`, from the given range.
_transform.Transform.prototype.clearMarkup = function (from, to, newParent) {
  var _this3 = this;

  var delSteps = []; // Must be accumulated and applied in inverse order
  this.doc.nodesBetween(from, to, function (node, pos) {
    if (!node.isInline) return;
    if (newParent ? !newParent.canContainType(node.type) : !node.type.isText) {
      delSteps.push(new _step.Step("replace", pos, pos + node.nodeSize, _model.Slice.empty));
      return;
    }
    for (var i = 0; i < node.marks.length; i++) {
      var mark = node.marks[i];
      if (!newParent || !newParent.canContainMark(mark.type)) _this3.step("removeMark", Math.max(pos, from), Math.min(pos + node.nodeSize, to), mark);
    }
  });
  for (var i = delSteps.length - 1; i >= 0; i--) {
    this.step(delSteps[i]);
  }return this;
};