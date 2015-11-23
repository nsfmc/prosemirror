"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

exports.toMarkdown = toMarkdown;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _model = require("../model");

var _index = require("./index");

function toMarkdown(doc) {
  var state = new State();
  state.renderNodes(doc.children);
  return state.out;
}

(0, _index.defineTarget)("markdown", toMarkdown);

function esc(str, startOfLine) {
  str = str.replace(/[`*\\~+\[\]]/g, "\\$&");
  if (startOfLine) str = str.replace(/^[:#-]/, "\\$&");
  return str;
}

function quote(str) {
  var wrap = str.indexOf('"') == -1 ? '""' : str.indexOf("'") == -1 ? "''" : "()";
  return wrap[0] + str + wrap[1];
}

function rep(str, n) {
  var out = "";
  for (var i = 0; i < n; i++) {
    out += str;
  }return out;
}

var State = (function () {
  function State() {
    _classCallCheck(this, State);

    this.delim = this.out = "";
    this.closed = false;
    this.inTightList = false;
  }

  _createClass(State, [{
    key: "closeBlock",
    value: function closeBlock(node) {
      this.closed = node;
    }
  }, {
    key: "flushClose",
    value: function flushClose(size) {
      if (this.closed) {
        if (!this.atBlank()) this.out += "\n";
        if (size == null) size = 2;
        if (size > 1) {
          var delimMin = this.delim;
          var trim = /\s+$/.exec(delimMin);
          if (trim) delimMin = delimMin.slice(0, delimMin.length - trim[0].length);
          for (var i = 1; i < size; i++) {
            this.out += delimMin + "\n";
          }
        }
        this.closed = false;
      }
    }
  }, {
    key: "wrapBlock",
    value: function wrapBlock(delim, firstDelim, node, f) {
      var old = this.delim;
      this.write(firstDelim || delim);
      this.delim += delim;
      f();
      this.delim = old;
      this.closeBlock(node);
    }
  }, {
    key: "atBlank",
    value: function atBlank() {
      return (/(^|\n)$/.test(this.out)
      );
    }
  }, {
    key: "write",
    value: function write(add) {
      this.flushClose();
      if (this.delim && this.atBlank()) this.out += this.delim;
      if (add) this.out += add;
    }
  }, {
    key: "text",
    value: function text(_text, escape) {
      var lines = _text.split("\n");
      for (var i = 0; i < lines.length; i++) {
        var startOfLine = this.atBlank() || this.closed;
        this.write();
        this.out += escape !== false ? esc(lines[i], startOfLine) : lines[i];
        if (i != lines.length - 1) this.out += "\n";
      }
    }
  }, {
    key: "ensureNewLine",
    value: function ensureNewLine() {
      if (!this.atBlank()) this.out += "\n";
    }
  }, {
    key: "render",
    value: function render(node) {
      node.type.serializeMarkdown(this, node);
    }
  }, {
    key: "renderNodes",
    value: function renderNodes(nodes) {
      for (var i = 0; i < nodes.length; i++) {
        this.render(nodes[i]);
      }
    }
  }, {
    key: "renderInline",
    value: function renderInline(nodes) {
      var stack = [];
      for (var i = 0; i <= nodes.length; i++) {
        var node = nodes[i];
        var styles = node ? node.styles.slice() : [];
        if (stack.length && stack[stack.length - 1].type == "code" && (!styles.length || styles[styles.length - 1].type != "code")) {
          this.text("`", false);
          stack.pop();
        }
        for (var j = 0; j < stack.length; j++) {
          var cur = stack[j],
              found = false;
          for (var k = 0; k < styles.length; k++) {
            if (styles[k].eq(stack[j])) {
              styles.splice(k, 1);
              found = true;
              break;
            }
          }
          if (!found) {
            this.text(styleString(cur, false), false);
            stack.splice(j--, 1);
          }
        }
        for (var j = 0; j < styles.length; j++) {
          var cur = styles[j];
          stack.push(cur);
          this.text(styleString(cur, true), false);
        }
        if (node) this.render(node);
      }
    }
  }, {
    key: "renderList",
    value: function renderList(node, delim, firstDelim) {
      var _this = this;

      if (this.closed && this.closed.type == node.type) this.flushClose(3);else if (this.inTightList) this.flushClose(1);

      var prevTight = this.inTightList;
      this.inTightList = node.attrs.tight;

      var _loop = function (i) {
        if (i && node.attrs.tight) _this.flushClose(1);
        var item = node.child(i);
        _this.wrapBlock(delim, firstDelim(i), node, function () {
          return _this.render(item);
        });
      };

      for (var i = 0; i < node.length; i++) {
        _loop(i);
      }
      this.inTightList = prevTight;
    }
  }]);

  return State;
})();

function def(cls, method) {
  cls.prototype.serializeMarkdown = method;
}

def(_model.BlockQuote, function (state, node) {
  state.wrapBlock("> ", null, node, function () {
    return state.renderNodes(node.children);
  });
});

def(_model.CodeBlock, function (state, node) {
  if (node.attrs.params == null) {
    state.wrapBlock("    ", null, node, function () {
      return state.text(node.textContent, false);
    });
  } else {
    state.write("```" + node.attrs.params + "\n");
    state.text(node.textContent, false);
    state.ensureNewLine();
    state.write("```");
    state.closeBlock(node);
  }
});

def(_model.Heading, function (state, node) {
  state.write(rep("#", node.attrs.level) + " ");
  state.renderInline(node.children);
  state.closeBlock(node);
});

def(_model.HorizontalRule, function (state, node) {
  state.write(node.attrs.markup || "---");
  state.closeBlock(node);
});

def(_model.BulletList, function (state, node) {
  state.renderList(node, "  ", function () {
    return (node.attrs.bullet || "*") + " ";
  });
});

def(_model.OrderedList, function (state, node) {
  var start = Number(node.attrs.order || 1);
  var maxW = String(start + node.length - 1).length;
  var space = rep(" ", maxW + 2);
  state.renderList(node, space, function (i) {
    var nStr = String(start + i);
    return rep(" ", maxW - nStr.length) + nStr + ". ";
  });
});

def(_model.ListItem, function (state, node) {
  return state.renderNodes(node.children);
});

def(_model.Paragraph, function (state, node) {
  state.renderInline(node.children);
  state.closeBlock(node);
});

// Inline nodes

def(_model.Image, function (state, node) {
  state.write("![" + esc(node.attrs.alt || "") + "](" + esc(node.attrs.src) + (node.attrs.title ? " " + quote(node.attrs.title) : "") + ")");
});

def(_model.HardBreak, function (state) {
  return state.write("\\\n");
});

def(_model.Text, function (state, node) {
  return state.text(node.text);
});

// Styles

function styleString(style, open) {
  var value = open ? style.type.openMarkdownStyle : style.type.closeMarkdownStyle;
  return typeof value == "string" ? value : value(style);
}

function defStyle(style, open, close) {
  style.prototype.openMarkdownStyle = open;
  style.prototype.closeMarkdownStyle = close;
}

defStyle(_model.EmStyle, "*", "*");

defStyle(_model.StrongStyle, "**", "**");

defStyle(_model.LinkStyle, "[", function (style) {
  return "](" + esc(style.attrs.href) + (style.attrs.title ? " " + quote(style.attrs.title) : "") + ")";
});

defStyle(_model.CodeStyle, "`", "`");