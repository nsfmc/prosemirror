"use strict";

var _model = require("../model");

var _transform = require("./transform");

var _step = require("./step");

var _tree = require("./tree");

(0, _step.defineStep)("addStyle", {
  apply: function apply(doc, step) {
    return new _transform.TransformResult((0, _tree.copyStructure)(doc, step.from, step.to, function (node, from, to) {
      if (!node.type.canContainStyle(step.param)) return node;
      return (0, _tree.copyInline)(node, from, to, function (node) {
        return node.styled(step.param.addToSet(node.styles));
      });
    }));
  },
  invert: function invert(step, _oldDoc, map) {
    return new _step.Step("removeStyle", step.from, map.map(step.to).pos, null, step.param);
  },
  paramToJSON: function paramToJSON(param) {
    return param.toJSON();
  },
  paramFromJSON: function paramFromJSON(schema, json) {
    return schema.styleFromJSON(json);
  }
});

_transform.Transform.prototype.addStyle = function (from, to, st) {
  var _this = this;

  var removed = [],
      added = [],
      removing = null,
      adding = null;
  this.doc.inlineNodesBetween(from, to, function (span, start, end, path, parent) {
    if (st.isInSet(span.styles) || !parent.type.canContainStyle(st.type)) {
      adding = removing = null;
    } else {
      path = path.slice();
      var rm = (0, _model.containsStyle)(span.styles, st.type);
      if (rm) {
        if (removing && removing.param.eq(rm)) {
          removing.to = new _model.Pos(path, end);
        } else {
          removing = new _step.Step("removeStyle", new _model.Pos(path, start), new _model.Pos(path, end), null, rm);
          removed.push(removing);
        }
      } else if (removing) {
        removing = null;
      }
      if (adding) {
        adding.to = new _model.Pos(path, end);
      } else {
        adding = new _step.Step("addStyle", new _model.Pos(path, start), new _model.Pos(path, end), null, st);
        added.push(adding);
      }
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

(0, _step.defineStep)("removeStyle", {
  apply: function apply(doc, step) {
    return new _transform.TransformResult((0, _tree.copyStructure)(doc, step.from, step.to, function (node, from, to) {
      return (0, _tree.copyInline)(node, from, to, function (node) {
        return node.styled(step.param.removeFromSet(node.styles));
      });
    }));
  },
  invert: function invert(step, _oldDoc, map) {
    return new _step.Step("addStyle", step.from, map.map(step.to).pos, null, step.param);
  },
  paramToJSON: function paramToJSON(param) {
    return param.toJSON();
  },
  paramFromJSON: function paramFromJSON(schema, json) {
    return schema.styleFromJSON(json);
  }
});

_transform.Transform.prototype.removeStyle = function (from, to) {
  var _this2 = this;

  var st = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];

  var matched = [],
      step = 0;
  this.doc.inlineNodesBetween(from, to, function (span, start, end, path) {
    step++;
    var toRemove = null;
    if (st instanceof _model.StyleType) {
      var found = (0, _model.containsStyle)(span.styles, st);
      if (found) toRemove = [found];
    } else if (st) {
      if (st.isInSet(span.styles)) toRemove = [st];
    } else {
      toRemove = span.styles;
    }
    if (toRemove && toRemove.length) {
      path = path.slice();
      for (var i = 0; i < toRemove.length; i++) {
        var rm = toRemove[i],
            found = undefined;
        for (var j = 0; j < matched.length; j++) {
          var m = matched[j];
          if (m.step == step - 1 && rm.eq(matched[j].style)) found = m;
        }
        if (found) {
          found.to = new _model.Pos(path, end);
          found.step = step;
        } else {
          matched.push({ style: rm, from: new _model.Pos(path, start), to: new _model.Pos(path, end), step: step });
        }
      }
    }
  });
  matched.forEach(function (m) {
    return _this2.step("removeStyle", m.from, m.to, null, m.style);
  });
  return this;
};

_transform.Transform.prototype.clearMarkup = function (from, to, newParent) {
  var _this3 = this;

  var delSteps = []; // Must be accumulated and applied in inverse order
  this.doc.inlineNodesBetween(from, to, function (span, start, end, path) {
    if (newParent ? !newParent.canContainType(span.type) : !span.isText) {
      path = path.slice();
      var _from = new _model.Pos(path, start);
      delSteps.push(new _step.Step("replace", _from, new _model.Pos(path, end), _from));
      return;
    }
    for (var i = 0; i < span.styles.length; i++) {
      var st = span.styles[i];
      if (!newParent || !newParent.canContainStyle(st.type)) {
        path = path.slice();
        _this3.step("removeStyle", new _model.Pos(path, start), new _model.Pos(path, end), null, st);
      }
    }
  });
  for (var i = delSteps.length - 1; i >= 0; i--) {
    this.step(delSteps[i]);
  }return this;
};