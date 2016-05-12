"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.StepResult = exports.Step = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _model = require("../model");

var _map = require("./map");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// ;; A step object wraps an atomic operation. It generally applies
// only to the document it was created for, since the positions
// associated with it will only make sense for that document.

var Step = exports.Step = function () {
  // :: (string, number, number, ?any)
  // Build a step. The type should name a [defined](Step.define) step
  // type, and the shape of the positions and parameter should be
  // appropriate for that type.

  function Step(type, from, to) {
    var param = arguments.length <= 3 || arguments[3] === undefined ? null : arguments[3];

    _classCallCheck(this, Step);

    if (!(type in steps)) throw new RangeError("Unknown step type: " + type);
    // :: string
    // The type of the step.
    this.type = type;
    // :: ?number
    // The start of the step's range, if any. Which of the three
    // optional positions associated with a step a given step type
    // uses differs. The way each of these positions is mapped when
    // the step is mapped over a [position mapping](#PosMap) depends
    // on its role.
    this.from = from;
    // :: ?number
    // The end of the step's range.
    this.to = to;
    // :: ?any
    // Extra step-type-specific information associated with the step.
    this.param = param;
  }

  // :: (Node) → ?StepResult
  // Applies this step to the given document, returning a result
  // containing the transformed document (the input document is not
  // changed) and a `PosMap`. If the step could not meaningfully be
  // applied to the given document, this returns `null`.


  _createClass(Step, [{
    key: "apply",
    value: function apply(doc) {
      return steps[this.type].apply(doc, this);
    }
  }, {
    key: "posMap",
    value: function posMap() {
      var type = steps[this.type];
      return type.posMap ? type.posMap(this) : _map.PosMap.empty;
    }

    // :: (Node) → Step
    // Create an inverted version of this step. Needs the document as it
    // was before the step as input.

  }, {
    key: "invert",
    value: function invert(oldDoc) {
      return steps[this.type].invert(this, oldDoc);
    }

    // :: (Mappable) → ?Step
    // Map this step through a mappable thing, returning either a
    // version of that step with its positions adjusted, or `null` if
    // the step was entirely deleted by the mapping.

  }, {
    key: "map",
    value: function map(remapping) {
      var from = remapping.mapResult(this.from, 1);
      var to = this.to == this.from ? from : remapping.mapResult(this.to, -1);
      if (from.deleted && to.deleted) return null;
      return new Step(this.type, from.pos, Math.max(from.pos, to.pos), this.param);
    }

    // :: () → Object
    // Create a JSON-serializeable representation of this step.

  }, {
    key: "toJSON",
    value: function toJSON() {
      var impl = steps[this.type];
      return {
        type: this.type,
        from: this.from,
        to: this.to,
        param: impl.paramToJSON ? impl.paramToJSON(this.param) : this.param
      };
    }

    // :: (Schema, Object) → Step
    // Deserialize a step from its JSON representation.

  }, {
    key: "toString",
    value: function toString() {
      return this.type + "@" + this.from + "-" + this.to;
    }
  }], [{
    key: "fromJSON",
    value: function fromJSON(schema, json) {
      var impl = steps[json.type];
      return new Step(json.type, json.from, json.to, impl.paramFromJSON ? impl.paramFromJSON(schema, json.param) : json.param);
    }

    // :: (string, Object)
    // Define a new type of step. Implementation should have the
    // following properties:
    //
    // **`apply`**`(doc: Node, step: Step) → ?StepResult
    //   : Applies the step to a document.
    // **`invert`**`(step: Step, oldDoc: Node) → Step
    //   : Create an inverted version of the step.
    // **`paramToJSON`**`(param: ?any) → ?Object
    //   : Serialize this step type's parameter to JSON.
    // **`paramFromJSON`**`(schema: Schema, json: ?Object) → ?any
    //   : Deserialize this step type's parameter from JSON.

  }, {
    key: "define",
    value: function define(type, implementation) {
      steps[type] = implementation;
    }
  }]);

  return Step;
}();

var steps = Object.create(null);

// ;; The result of [applying](#Step.apply) a step. Contains either a
// new document or a failure value.

var StepResult = exports.StepResult = function () {
  // :: (?Node, ?string)

  function StepResult(doc, failed) {
    _classCallCheck(this, StepResult);

    // :: ?Node The transformed document.
    this.doc = doc;
    // :: ?string A text providing information about a failed step.
    this.failed = failed;
  }

  // :: (Node) → StepResult
  // Create a successful step result.


  _createClass(StepResult, null, [{
    key: "ok",
    value: function ok(doc) {
      return new StepResult(doc, null);
    }

    // :: (string) → StepResult
    // Create a failed step result.

  }, {
    key: "fail",
    value: function fail(val) {
      return new StepResult(null, val);
    }

    // :: (Node, number, number, Slice) → StepResult
    // Run `Node.replace`, create a successful result if it succeeds,
    // and a failed one if it throws a `ReplaceError`.

  }, {
    key: "fromReplace",
    value: function fromReplace(doc, from, to, slice) {
      try {
        return StepResult.ok(doc.replace(from, to, slice));
      } catch (e) {
        if (e instanceof _model.ReplaceError) return StepResult.fail(e.message);
        throw e;
      }
    }
  }]);

  return StepResult;
}();