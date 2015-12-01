"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

exports.defineCommand = defineCommand;
exports.defineParamHandler = defineParamHandler;
exports.initCommands = initCommands;
exports.defaultKeymap = defaultKeymap;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _model = require("../model");

var _transform = require("../transform");

var _dom = require("../dom");

var _utilSortedinsert = require("../util/sortedinsert");

var _utilSortedinsert2 = _interopRequireDefault(_utilSortedinsert);

var _char = require("./char");

var _keys = require("./keys");

var _selection = require("./selection");

var globalCommands = Object.create(null);
var paramHandlers = Object.create(null);

function defineCommand(name, cmd) {
  globalCommands[name] = cmd instanceof Command ? cmd : new Command(name, cmd);
}

_model.NodeType.attachCommand = _model.StyleType.attachCommand = function (name, create) {
  this.register("commands", { name: name, create: create });
};

function defineParamHandler(name, handler) {
  paramHandlers[name] = handler;
}

function getParamHandler(pm) {
  var option = pm.options.commandParamHandler;
  if (option && paramHandlers[option]) return paramHandlers[option];
}

var Command = (function () {
  function Command(name, options) {
    _classCallCheck(this, Command);

    this.name = name;
    this.label = options.label || name;
    this.run = options.run;
    this.params = options.params || [];
    this.select = options.select || function () {
      return true;
    };
    this.active = options.active || function () {
      return false;
    };
    this.info = options;
    this.display = options.display || "icon";
  }

  _createClass(Command, [{
    key: "exec",
    value: function exec(pm, params) {
      var _this = this;

      if (!this.params.length) return this.run(pm);
      if (params) return this.run.apply(this, [pm].concat(_toConsumableArray(params)));
      var handler = getParamHandler(pm);
      if (handler) handler(pm, this, function (params) {
        if (params) _this.run.apply(_this, [pm].concat(_toConsumableArray(params)));
      });else return false;
    }
  }]);

  return Command;
})();

exports.Command = Command;

function initCommands(schema) {
  var result = Object.create(null);
  for (var cmd in globalCommands) {
    result[cmd] = globalCommands[cmd];
  }function fromTypes(types) {
    var _loop = function (_name) {
      var type = types[_name],
          cmds = type.commands;
      if (cmds) cmds.forEach(function (_ref) {
        var name = _ref.name;
        var create = _ref.create;

        result[name] = new Command(name, create(type));
      });
    };

    for (var _name in types) {
      _loop(_name);
    }
  }
  fromTypes(schema.nodes);
  fromTypes(schema.styles);
  return result;
}

function defaultKeymap(pm) {
  var bindings = {};
  function add(command, key) {
    if (Array.isArray(key)) {
      for (var i = 0; i < key.length; i++) {
        add(command, key[i]);
      }
    } else if (key) {
      var _d$$exec = /^(.+?)(?:\((\d+)\))?$/.exec(key);

      var _d$$exec2 = _slicedToArray(_d$$exec, 3);

      var _ = _d$$exec2[0];
      var _name2 = _d$$exec2[1];
      var _d$$exec2$2 = _d$$exec2[2];
      var rank = _d$$exec2$2 === undefined ? 50 : _d$$exec2$2;

      (0, _utilSortedinsert2["default"])(bindings[_name2] || (bindings[_name2] = []), { command: command, rank: rank }, function (a, b) {
        return a.rank - b.rank;
      });
    }
  }
  for (var _name3 in pm.commands) {
    var cmd = pm.commands[_name3];
    add(_name3, cmd.info.key);
    add(_name3, _dom.browser.mac ? cmd.info.macKey : cmd.info.pcKey);
  }

  for (var key in bindings) {
    bindings[key] = bindings[key].map(function (b) {
      return b.command;
    });
  }return new _keys.Keymap(bindings);
}

var andScroll = { scrollIntoView: true };

_model.HardBreak.attachCommand("insertHardBreak", function (type) {
  return {
    label: "Insert hard break",
    run: function run(pm) {
      var _pm$selection = pm.selection;
      var node = _pm$selection.node;
      var from = _pm$selection.from;

      if (node && node.isBlock) return false;else if (pm.doc.path(from.path).type.isCode) return pm.tr.typeText("\n").apply(andScroll);else return pm.tr.replaceSelection(type.create()).apply(andScroll);
    },
    key: ["Mod-Enter", "Shift-Enter"]
  };
});

function inlineStyleActive(pm, type) {
  var sel = pm.selection;
  if (sel.empty) return (0, _model.containsStyle)(pm.activeStyles(), type);else return (0, _model.rangeHasStyle)(pm.doc, sel.from, sel.to, type);
}

function canAddInline(pm, type) {
  var _pm$selection2 = pm.selection;
  var from = _pm$selection2.from;
  var to = _pm$selection2.to;
  var empty = _pm$selection2.empty;

  if (empty) return !(0, _model.containsStyle)(pm.activeStyles(), type) && pm.doc.path(from.path).type.canContainStyle(type);
  var can = false;
  pm.doc.nodesBetween(from, to, function (node) {
    if (can || node.isTextblock && !node.type.canContainStyle(type)) return false;
    if (node.isInline && !(0, _model.containsStyle)(node.styles, type)) can = true;
  });
  return can;
}

function inlineStyleApplies(pm, type) {
  var _pm$selection3 = pm.selection;
  var from = _pm$selection3.from;
  var to = _pm$selection3.to;

  var relevant = false;
  pm.doc.nodesBetween(from, to, function (node) {
    if (node.isTextblock) {
      if (node.type.canContainStyle(type)) relevant = true;
      return false;
    }
  });
  return relevant;
}

function generateStyleCommands(type, name, labelName, info) {
  if (!labelName) labelName = name;
  var cap = name.charAt(0).toUpperCase() + name.slice(1);
  type.attachCommand("set" + cap, function (type) {
    return {
      label: "Set " + labelName,
      run: function run(pm) {
        pm.setStyle(type, true);
      },
      select: function select(pm) {
        return canAddInline(pm, type);
      }
    };
  });
  type.attachCommand("unset" + cap, function (type) {
    return {
      label: "Remove " + labelName,
      run: function run(pm) {
        pm.setStyle(type, false);
      },
      select: function select(pm) {
        return inlineStyleActive(pm, type);
      }
    };
  });
  type.attachCommand(name, function (type) {
    var command = {
      label: "Toggle " + labelName,
      run: function run(pm) {
        pm.setStyle(type, null);
      },
      active: function active(pm) {
        return inlineStyleActive(pm, type);
      },
      select: function select(pm) {
        return inlineStyleApplies(pm, type);
      },
      info: info
    };
    for (var prop in info) {
      command[prop] = info[prop];
    }return command;
  });
}

generateStyleCommands(_model.StrongStyle, "strong", null, {
  menuGroup: "inline",
  menuRank: 20,
  key: "Mod-B"
});

generateStyleCommands(_model.EmStyle, "em", "emphasis", {
  menuGroup: "inline",
  menuRank: 21,
  key: "Mod-I"
});

generateStyleCommands(_model.CodeStyle, "code", null, {
  menuGroup: "inline",
  menuRank: 22,
  key: "Mod-`"
});

_model.LinkStyle.attachCommand("unlink", function (type) {
  return {
    label: "Unlink",
    run: function run(pm) {
      pm.setStyle(type, false);
    },
    select: function select(pm) {
      return inlineStyleActive(pm, type);
    },
    active: function active() {
      return true;
    },
    menuGroup: "inline", menuRank: 30
  };
});
_model.LinkStyle.attachCommand("link", function (type) {
  return {
    label: "Add link",
    run: function run(pm, href, title) {
      pm.setStyle(type, true, { href: href, title: title });
    },
    params: [{ name: "Target", type: "text" }, { name: "Title", type: "text", "default": "" }],
    select: function select(pm) {
      return inlineStyleApplies(pm, type) && !inlineStyleActive(pm, type);
    },
    menuGroup: "inline", menuRank: 30
  };
});

_model.Image.attachCommand("insertImage", function (type) {
  return {
    label: "Insert image",
    run: function run(pm, src, alt, title) {
      return pm.tr.replaceSelection(type.create({ src: src, title: title, alt: alt })).apply(andScroll);
    },
    params: [{ name: "Image URL", type: "text" }, { name: "Description / alternative text", type: "text", "default": "" }, { name: "Title", type: "text", "default": "" }],
    select: function select(pm) {
      return pm.doc.path(pm.selection.from.path).type.canContainType(type);
    },
    menuGroup: "inline",
    menuRank: 40,
    prefillParams: function prefillParams(pm) {
      var node = pm.selection.node;

      if (node && node.type == type) return [node.attrs.src, node.attrs.alt, node.attrs.title];
    }
  };
});

/**
 * Get an offset moving backward from a current offset inside a node.
 *
 * @param  {Object} parent The parent node.
 * @param  {int}    offset Offset to move from inside the node.
 * @param  {string} by     Size to delete by. Either "char" or "word".
 * @return {[type]}        [description]
 */
function moveBackward(parent, offset, by) {
  if (by != "char" && by != "word") throw new Error("Unknown motion unit: " + by);

  var _parent$childBefore = parent.childBefore(offset);

  var index = _parent$childBefore.index;
  var innerOffset = _parent$childBefore.innerOffset;

  var cat = null,
      counted = 0;
  for (; index >= 0; index--, innerOffset = null) {
    var child = parent.child(index),
        size = child.offset;
    if (!child.isText) return cat ? offset : offset - 1;

    if (by == "char") {
      for (var i = innerOffset == null ? size : innerOffset; i > 0; i--) {
        if (!(0, _char.isExtendingChar)(child.text.charAt(i - 1))) return offset - 1;
        offset--;
      }
    } else if (by == "word") {
      // Work from the current position backwards through text of a singular
      // character category (e.g. "cat" of "#!*") until reaching a character in a
      // different category (i.e. the end of the word).
      for (var i = innerOffset == null ? size : innerOffset; i > 0; i--) {
        var nextCharCat = (0, _char.charCategory)(child.text.charAt(i - 1));
        if (cat == null || counted == 1 && cat == "space") cat = nextCharCat;else if (cat != nextCharCat) return offset;
        offset--;
        counted++;
      }
    }
  }
  return offset;
}

defineCommand("deleteSelection", {
  label: "Delete the selection",
  run: function run(pm) {
    return pm.tr.replaceSelection().apply(andScroll);
  },
  key: ["Backspace(10)", "Delete(10)", "Mod-Backspace(10)", "Mod-Delete(10)"],
  macKey: ["Ctrl-H(10)", "Alt-Backspace(10)", "Ctrl-D(10)", "Ctrl-Alt-Backspace(10)", "Alt-Delete(10)", "Alt-D(10)"]
});

function deleteBarrier(pm, cut) {
  var around = pm.doc.path(cut.path);
  var before = around.child(cut.offset - 1),
      after = around.child(cut.offset);
  if (before.type.canContainChildren(after) && pm.tr.join(cut).apply(andScroll) !== false) return;

  var conn = undefined;
  if (after.isTextblock && (conn = before.type.findConnection(after.type))) {
    var tr = pm.tr,
        end = cut.move(1);
    tr.step("ancestor", cut, end, null, { wrappers: [before].concat(_toConsumableArray(conn.map(function (t) {
        return t.create();
      }))) });
    tr.join(end);
    tr.join(cut);
    if (tr.apply(andScroll) !== false) return;
  }

  var selAfter = (0, _selection.findSelectionFrom)(pm.doc, cut, 1);
  return pm.tr.lift(selAfter.from, selAfter.to).apply(andScroll);
}

defineCommand("joinBackward", {
  label: "Join with the block above",
  run: function run(pm) {
    var _pm$selection4 = pm.selection;
    var head = _pm$selection4.head;
    var empty = _pm$selection4.empty;

    if (!empty || head.offset > 0) return false;

    // Find the node before this one
    var before = undefined,
        cut = undefined;
    for (var i = head.path.length - 1; !before && i >= 0; i--) {
      if (head.path[i] > 0) {
        cut = head.shorten(i);
        before = pm.doc.path(cut.path).child(cut.offset - 1);
      }
    } // If there is no node before this, try to lift
    if (!before) return pm.tr.lift(head).apply(andScroll);

    // If the node doesn't allow children, delete it
    if (before.type.contains == null) return pm.tr["delete"](cut.move(-1), cut).apply(andScroll);

    // Apply the joining algorithm
    return deleteBarrier(pm, cut);
  },
  key: ["Backspace(30)", "Mod-Backspace(30)"]
});

defineCommand("deleteCharBefore", {
  label: "Delete a character before the cursor",
  run: function run(pm) {
    var _pm$selection5 = pm.selection;
    var head = _pm$selection5.head;
    var empty = _pm$selection5.empty;

    if (!empty || head.offset == 0) return false;
    var from = moveBackward(pm.doc.path(head.path), head.offset, "char");
    return pm.tr["delete"](new _model.Pos(head.path, from), head).apply(andScroll);
  },
  key: "Backspace(60)",
  macKey: "Ctrl-H(40)"
});

defineCommand("deleteWordBefore", {
  label: "Delete the word before the cursor",
  run: function run(pm) {
    var _pm$selection6 = pm.selection;
    var head = _pm$selection6.head;
    var empty = _pm$selection6.empty;

    if (!empty || head.offset == 0) return false;
    var from = moveBackward(pm.doc.path(head.path), head.offset, "word");
    return pm.tr["delete"](new _model.Pos(head.path, from), head).apply(andScroll);
  },
  key: "Mod-Backspace(40)",
  macKey: "Alt-Backspace(40)"
});

function moveForward(parent, offset, by) {
  if (by != "char" && by != "word") throw new Error("Unknown motion unit: " + by);

  var _parent$childAfter = parent.childAfter(offset);

  var index = _parent$childAfter.index;
  var innerOffset = _parent$childAfter.innerOffset;

  var cat = null,
      counted = 0;
  for (; index < parent.length; index++, innerOffset = 0) {
    var child = parent.child(index),
        size = child.offset;
    if (!child.isText) return cat ? offset : offset + 1;

    if (by == "char") {
      for (var i = innerOffset; i < size; i++) {
        if (!(0, _char.isExtendingChar)(child.text.charAt(i + 1))) return offset + 1;
        offset++;
      }
    } else if (by == "word") {
      for (var i = innerOffset; i < size; i++) {
        var nextCharCat = (0, _char.charCategory)(child.text.charAt(i));
        if (cat == null || counted == 1 && cat == "space") cat = nextCharCat;else if (cat != nextCharCat) return offset;
        offset++;
        counted++;
      }
    }
  }
  return offset;
}

defineCommand("joinForward", {
  label: "Join with the block below",
  run: function run(pm) {
    var _pm$selection7 = pm.selection;
    var head = _pm$selection7.head;
    var empty = _pm$selection7.empty;

    if (!empty || head.offset < pm.doc.path(head.path).maxOffset) return false;

    // Find the node after this one
    var after = undefined,
        cut = undefined;
    for (var i = head.path.length - 1; !after && i >= 0; i--) {
      cut = head.shorten(i, 1);
      var _parent = pm.doc.path(cut.path);
      if (cut.offset < _parent.length) after = _parent.child(cut.offset);
    }

    // If there is no node after this, there's nothing to do
    if (!after) return false;

    // If the node doesn't allow children, delete it
    if (after.type.contains == null) return pm.tr["delete"](cut, cut.move(1)).apply(andScroll);

    // Apply the joining algorithm
    return deleteBarrier(pm, cut);
  },
  key: ["Delete(30)", "Mod-Delete(30)"]
});

defineCommand("deleteCharAfter", {
  label: "Delete a character after the cursor",
  run: function run(pm) {
    var _pm$selection8 = pm.selection;
    var head = _pm$selection8.head;
    var empty = _pm$selection8.empty;

    if (!empty || head.offset == pm.doc.path(head.path).maxOffset) return false;
    var to = moveForward(pm.doc.path(head.path), head.offset, "char");
    return pm.tr["delete"](head, new _model.Pos(head.path, to)).apply(andScroll);
  },
  key: "Delete(60)",
  macKey: "Ctrl-D(60)"
});

defineCommand("deleteWordAfter", {
  label: "Delete a character after the cursor",
  run: function run(pm) {
    var _pm$selection9 = pm.selection;
    var head = _pm$selection9.head;
    var empty = _pm$selection9.empty;

    if (!empty || head.offset == pm.doc.path(head.path).maxOffset) return false;
    var to = moveForward(pm.doc.path(head.path), head.offset, "word");
    return pm.tr["delete"](head, new _model.Pos(head.path, to)).apply(andScroll);
  },
  key: "Mod-Delete(40)",
  macKey: ["Ctrl-Alt-Backspace(40)", "Alt-Delete(40)", "Alt-D(40)"]
});

function joinPointAbove(pm) {
  var _pm$selection10 = pm.selection;
  var node = _pm$selection10.node;
  var from = _pm$selection10.from;

  if (node) return (0, _transform.joinableBlocks)(pm.doc, from) ? from : null;else return (0, _transform.joinPoint)(pm.doc, from, -1);
}

defineCommand("joinUp", {
  label: "Join with above block",
  run: function run(pm) {
    var node = pm.selection.node;
    var point = joinPointAbove(pm);
    if (!point) return false;
    pm.tr.join(point).apply();
    if (node) pm.setNodeSelection(point.move(-1));
  },
  select: function select(pm) {
    return joinPointAbove(pm);
  },
  menuGroup: "block", menuRank: 80,
  key: "Alt-Up"
});

function joinPointBelow(pm) {
  var _pm$selection11 = pm.selection;
  var node = _pm$selection11.node;
  var to = _pm$selection11.to;

  if (node) return (0, _transform.joinableBlocks)(pm.doc, to) ? to : null;else return (0, _transform.joinPoint)(pm.doc, to, 1);
}

defineCommand("joinDown", {
  label: "Join with below block",
  run: function run(pm) {
    var node = pm.selection.node;
    var point = joinPointBelow(pm);
    if (!point) return false;
    pm.tr.join(point).apply();
    if (node) pm.setNodeSelection(point.move(-1));
  },
  select: function select(pm) {
    return joinPointBelow(pm);
  },
  key: "Alt-Down"
});

defineCommand("lift", {
  label: "Lift out of enclosing block",
  run: function run(pm) {
    var _pm$selection12 = pm.selection;
    var from = _pm$selection12.from;
    var to = _pm$selection12.to;

    return pm.tr.lift(from, to).apply(andScroll);
  },
  select: function select(pm) {
    var _pm$selection13 = pm.selection;
    var from = _pm$selection13.from;
    var to = _pm$selection13.to;

    return (0, _transform.canLift)(pm.doc, from, to);
  },
  menuGroup: "block", menuRank: 75,
  key: "Alt-Left"
});

function isAtTopOfListItem(doc, from, to, listType) {
  return _model.Pos.samePath(from.path, to.path) && from.path.length >= 2 && from.path[from.path.length - 1] == 0 && listType.canContain(doc.path(from.path.slice(0, from.path.length - 1)));
}

function wrapCommand(type, name, labelName, isList, info) {
  type.attachCommand("wrap" + name, function (type) {
    var command = {
      label: "Wrap in " + labelName,
      run: function run(pm) {
        var _pm$selection14 = pm.selection;
        var from = _pm$selection14.from;
        var to = _pm$selection14.to;
        var head = _pm$selection14.head;var doJoin = false;
        if (isList && head && isAtTopOfListItem(pm.doc, from, to, type)) {
          // Don't do anything if this is the top of the list
          if (from.path[from.path.length - 2] == 0) return false;
          doJoin = true;
        }
        var tr = pm.tr.wrap(from, to, type.create());
        if (doJoin) tr.join(from.shorten(from.depth - 2));
        return tr.apply(andScroll);
      },
      select: function select(pm) {
        var _pm$selection15 = pm.selection;
        var from = _pm$selection15.from;
        var to = _pm$selection15.to;
        var head = _pm$selection15.head;

        if (isList && head && isAtTopOfListItem(pm.doc, from, to, type) && from.path[from.path.length - 2] == 0) return false;
        return (0, _transform.canWrap)(pm.doc, from, to, type.create());
      }
    };
    for (var key in info) {
      command[key] = info[key];
    }return command;
  });
}

wrapCommand(_model.BulletList, "BulletList", "bullet list", true, {
  menuGroup: "block",
  menuRank: 40,
  key: ["Alt-Right '*'", "Alt-Right '-'"]
});

wrapCommand(_model.OrderedList, "OrderedList", "ordered list", true, {
  menuGroup: "block",
  menuRank: 41,
  key: "Alt-Right '1'"
});

wrapCommand(_model.BlockQuote, "BlockQuote", "block quote", false, {
  menuGroup: "block",
  menuRank: 45,
  key: ["Alt-Right '>'", "Alt-Right '\"'"]
});

defineCommand("newlineInCode", {
  label: "Insert newline",
  run: function run(pm) {
    var _pm$selection16 = pm.selection;
    var from = _pm$selection16.from;
    var to = _pm$selection16.to;
    var node = _pm$selection16.node;var block = undefined;
    if (!node && _model.Pos.samePath(from.path, to.path) && (block = pm.doc.path(from.path)).type.isCode && to.offset < block.maxOffset) return pm.tr.typeText("\n").apply(andScroll);else return false;
  },
  key: "Enter(10)"
});

defineCommand("createParagraphNear", {
  label: "Create a paragraph near the selected leaf block",
  run: function run(pm) {
    var _pm$selection17 = pm.selection;
    var from = _pm$selection17.from;
    var to = _pm$selection17.to;
    var node = _pm$selection17.node;

    if (!node || !node.isBlock || node.type.contains) return false;
    var side = from.offset ? to : from;
    pm.tr.insert(side, pm.schema.defaultTextblockType().create()).apply(andScroll);
    pm.setSelection(new _model.Pos(side.toPath(), 0));
  },
  key: "Enter(20)"
});

defineCommand("liftEmptyBlock", {
  label: "Move current block up",
  run: function run(pm) {
    var _pm$selection18 = pm.selection;
    var head = _pm$selection18.head;
    var empty = _pm$selection18.empty;

    if (!empty || head.offset > 0) return false;
    if (head.path[head.path.length - 1] > 0 && pm.tr.split(head.shorten()).apply() !== false) return;
    return pm.tr.lift(head).apply(andScroll);
  },
  key: "Enter(30)"
});

defineCommand("splitBlock", {
  label: "Split the current block",
  run: function run(pm) {
    var _pm$selection19 = pm.selection;
    var from = _pm$selection19.from;
    var to = _pm$selection19.to;
    var node = _pm$selection19.node;var block = pm.doc.path(to.path);
    if (node && node.isBlock) {
      if (!from.offset) return false;
      return pm.tr.split(from).apply(andScroll);
    } else {
      var type = to.offset == block.maxOffset ? pm.schema.defaultTextblockType().create() : null;
      return pm.tr["delete"](from, to).split(from, 1, type).apply(andScroll);
    }
  },
  key: "Enter(60)"
});

_model.ListItem.attachCommand("splitListItem", function (type) {
  return {
    label: "Split the current list item",
    run: function run(pm) {
      var _pm$selection20 = pm.selection;
      var from = _pm$selection20.from;
      var to = _pm$selection20.to;
      var node = _pm$selection20.node;
      var empty = _pm$selection20.empty;

      if (node && node.isBlock || from.path.length < 2 || !_model.Pos.samePath(from.path, to.path) || empty && from.offset == 0) return false;
      var toParent = from.shorten(),
          grandParent = pm.doc.path(toParent.path);
      if (grandParent.type != type) return false;
      var nextType = to.offset == grandParent.child(toParent.offset).maxOffset ? pm.schema.defaultTextblockType().create() : null;
      return pm.tr["delete"](from, to).split(from, 2, nextType).apply(andScroll);
    },
    key: "Enter(50)"
  };
});

function blockTypeCommand(type, name, labelName, attrs, key) {
  if (!attrs) attrs = {};
  type.attachCommand(name, function (type) {
    return {
      label: "Change to " + labelName,
      run: function run(pm) {
        var _pm$selection21 = pm.selection;
        var from = _pm$selection21.from;
        var to = _pm$selection21.to;

        return pm.tr.setBlockType(from, to, pm.schema.node(type, attrs)).apply(andScroll);
      },
      select: function select(pm) {
        var _pm$selection22 = pm.selection;
        var from = _pm$selection22.from;
        var to = _pm$selection22.to;
        var node = _pm$selection22.node;

        if (node) return node.isTextblock && !(0, _model.compareMarkup)(type, node.type, attrs, node.attrs);else return !(0, _transform.alreadyHasBlockType)(pm.doc, from, to, type, attrs);
      },
      key: key
    };
  });
}

blockTypeCommand(_model.Heading, "makeH1", "heading 1", { level: 1 }, "Mod-H '1'");
blockTypeCommand(_model.Heading, "makeH2", "heading 2", { level: 2 }, "Mod-H '2'");
blockTypeCommand(_model.Heading, "makeH3", "heading 3", { level: 3 }, "Mod-H '3'");
blockTypeCommand(_model.Heading, "makeH4", "heading 4", { level: 4 }, "Mod-H '4'");
blockTypeCommand(_model.Heading, "makeH5", "heading 5", { level: 5 }, "Mod-H '5'");
blockTypeCommand(_model.Heading, "makeH6", "heading 6", { level: 6 }, "Mod-H '6'");

blockTypeCommand(_model.Paragraph, "makeParagraph", "paragraph", null, "Mod-P");
blockTypeCommand(_model.CodeBlock, "makeCodeBlock", "code block", null, "Mod-\\");

_model.HorizontalRule.attachCommand("insertHorizontalRule", function (type) {
  return {
    label: "Insert horizontal rule",
    run: function run(pm) {
      return pm.tr.replaceSelection(type.create()).apply(andScroll);
    },
    key: "Mod-Space"
  };
});

defineCommand("undo", {
  label: "Undo last change",
  run: function run(pm) {
    pm.scrollIntoView();return pm.history.undo();
  },
  select: function select(pm) {
    return pm.history.canUndo();
  },
  menuGroup: "history",
  menuRank: 10,
  key: "Mod-Z"
});

defineCommand("redo", {
  label: "Redo last undone change",
  run: function run(pm) {
    pm.scrollIntoView();return pm.history.redo();
  },
  select: function select(pm) {
    return pm.history.canRedo();
  },
  menuGroup: "history",
  menuRank: 20,
  key: ["Mod-Y", "Shift-Mod-Z"]
});

defineCommand("textblockType", {
  label: "Change block type",
  run: function run(pm, type) {
    var _pm$selection23 = pm.selection;
    var from = _pm$selection23.from;
    var to = _pm$selection23.to;

    return pm.tr.setBlockType(from, to, type).apply();
  },
  select: function select(pm) {
    var node = pm.selection.node;

    return !node || node.isTextblock;
  },
  params: [{ name: "Type", type: "select", options: listTextblockTypes, "default": currentTextblockType, defaultLabel: "Type..." }],
  display: "select",
  menuGroup: "block", menuRank: 10
});

_model.Paragraph.prototype.textblockTypes = [{ label: "Normal", rank: 10 }];
_model.CodeBlock.prototype.textblockTypes = [{ label: "Code", rank: 20 }];
_model.Heading.prototype.textblockTypes = [1, 2, 3, 4, 5, 6].map(function (n) {
  return { label: "Head " + n, attrs: { level: n }, rank: 30 + n };
});

function listTextblockTypes(pm) {
  var cached = pm.schema.cached.textblockTypes;
  if (cached) return cached;

  var found = [];
  for (var _name4 in pm.schema.nodes) {
    var type = pm.schema.nodes[_name4];
    if (!type.textblockTypes) continue;
    for (var i = 0; i < type.textblockTypes.length; i++) {
      var info = type.textblockTypes[i];
      (0, _utilSortedinsert2["default"])(found, { label: info.label, value: type.create(info.attrs), rank: info.rank }, function (a, b) {
        return a.rank - b.rank;
      });
    }
  }
  return pm.schema.cached.textblockTypes = found;
}

function currentTextblockType(pm) {
  var _pm$selection24 = pm.selection;
  var from = _pm$selection24.from;
  var to = _pm$selection24.to;
  var node = _pm$selection24.node;

  if (!node || node.isInline) {
    if (!_model.Pos.samePath(from.path, to.path)) return null;
    node = pm.doc.path(from.path);
  } else if (!node.isTextblock) {
    return null;
  }
  var types = listTextblockTypes(pm);
  for (var i = 0; i < types.length; i++) {
    if (types[i].value.sameMarkup(node)) return types[i];
  }
}

function nodeAboveSelection(pm) {
  var sel = pm.selection,
      i = 0;
  if (sel.node) return !!sel.from.depth && sel.from.shorten();
  for (; i < sel.head.depth && i < sel.anchor.depth; i++) if (sel.head.path[i] != sel.anchor.path[i]) break;
  return i == 0 ? false : sel.head.shorten(i - 1);
}

defineCommand("selectParentBlock", {
  label: "Select parent node",
  run: function run(pm) {
    var node = nodeAboveSelection(pm);
    if (!node) return false;
    pm.setNodeSelection(node);
  },
  select: function select(pm) {
    return nodeAboveSelection(pm);
  },
  menuGroup: "block",
  menuRank: 90,
  key: "Esc"
});

function moveSelectionBlock(pm, dir) {
  var _pm$selection25 = pm.selection;
  var from = _pm$selection25.from;
  var to = _pm$selection25.to;
  var node = _pm$selection25.node;

  var side = dir > 0 ? to : from;
  return (0, _selection.findSelectionFrom)(pm.doc, node && node.isBlock ? side : side.shorten(null, dir > 0 ? 1 : 0), dir);
}

function selectBlockHorizontally(pm, dir) {
  var _pm$selection26 = pm.selection;
  var empty = _pm$selection26.empty;
  var node = _pm$selection26.node;
  var from = _pm$selection26.from;
  var to = _pm$selection26.to;

  if (!empty && !node) return false;

  if (node && node.isInline) {
    pm.setSelection(dir > 0 ? to : from);
    return true;
  }

  var parent = undefined;
  if (!node && (parent = pm.doc.path(from.path)) && (dir > 0 ? from.offset < parent.maxOffset : from.offset)) {
    var _ref2 = dir > 0 ? parent.childAfter(from.offset) : parent.childBefore(from.offset);

    var nextNode = _ref2.node;
    var innerOffset = _ref2.innerOffset;

    if (nextNode && nextNode.type.selectable && (dir > 0 ? !innerOffset : innerOffset == nextNode.offset)) {
      pm.setNodeSelection(dir < 0 ? from.move(-1) : from);
      return true;
    }
    return false;
  }

  var next = moveSelectionBlock(pm, dir);
  if (next && (next instanceof _selection.NodeSelection || node)) {
    pm.setSelection(next);
    return true;
  }
  return false;
}

defineCommand("selectBlockLeft", {
  label: "Move the selection onto or out of the block to the left",
  run: function run(pm) {
    var done = selectBlockHorizontally(pm, -1);
    if (done) pm.scrollIntoView();
    return done;
  },
  key: ["Left", "Mod-Left"]
});

defineCommand("selectBlockRight", {
  label: "Move the selection onto or out of the block to the right",
  run: function run(pm) {
    var done = selectBlockHorizontally(pm, 1);
    if (done) pm.scrollIntoView();
    return done;
  },
  key: ["Right", "Mod-Right"]
});

function selectBlockVertically(pm, dir) {
  var _pm$selection27 = pm.selection;
  var empty = _pm$selection27.empty;
  var node = _pm$selection27.node;
  var from = _pm$selection27.from;
  var to = _pm$selection27.to;

  if (!empty && !node) return false;

  var leavingTextblock = true;
  if (!node || node.isInline) leavingTextblock = (0, _selection.verticalMotionLeavesTextblock)(pm, dir > 0 ? to : from, dir);

  if (leavingTextblock) {
    var next = moveSelectionBlock(pm, dir);
    if (next && next instanceof _selection.NodeSelection) {
      pm.setSelection(next);
      if (!node) pm.sel.lastNonNodePos = from;
      return true;
    }
  }

  if (!node) return false;

  if (node.isInline) {
    (0, _selection.setDOMSelectionToPos)(pm, from);
    return false;
  }

  var last = pm.sel.lastNonNodePos;
  var beyond = (0, _selection.findSelectionFrom)(pm.doc, dir < 0 ? from : to, dir);
  if (last && beyond && _model.Pos.samePath(last.path, beyond.from.path)) {
    (0, _selection.setDOMSelectionToPos)(pm, last);
    return false;
  }
  pm.setSelection(beyond);
  return true;
}

defineCommand("selectBlockUp", {
  label: "Move the selection onto or out of the block above",
  run: function run(pm) {
    var done = selectBlockVertically(pm, -1);
    if (done !== false) pm.scrollIntoView();
    return done;
  },
  key: "Up"
});

defineCommand("selectBlockDown", {
  label: "Move the selection onto or out of the block below",
  run: function run(pm) {
    var done = selectBlockVertically(pm, 1);
    if (done !== false) pm.scrollIntoView();
    return done;
  },
  key: "Down"
});