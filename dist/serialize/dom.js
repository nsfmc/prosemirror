"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.toDOM = toDOM;
exports.toHTML = toHTML;
exports.renderNodeToDOM = renderNodeToDOM;

var _model = require("../model");

var _index = require("./index");

var doc = null;

// declare_global: window

function toDOM(node) {
  var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  doc = options.document || window.document;
  return renderNodes(node.children, options);
}

(0, _index.defineTarget)("dom", toDOM);

function toHTML(node, options) {
  var wrap = (options && options.document || window.document).createElement("div");
  wrap.appendChild(toDOM(node, options));
  return wrap.innerHTML;
}

(0, _index.defineTarget)("html", toHTML);

function renderNodeToDOM(node, options, offset) {
  var dom = renderNode(node, options, offset);
  if (options.renderInlineFlat && node.isInline) {
    dom = wrapInlineFlat(node, dom);
    dom = options.renderInlineFlat(node, dom, offset) || dom;
  }
  return dom;
}

function elt(name) {
  var dom = doc.createElement(name);

  for (var _len = arguments.length, children = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    children[_key - 1] = arguments[_key];
  }

  for (var i = 0; i < children.length; i++) {
    var child = children[i];
    dom.appendChild(typeof child == "string" ? doc.createTextNode(child) : child);
  }
  return dom;
}

function wrap(node, options, type) {
  var dom = elt(type || node.type.name);
  if (!node.isTextblock) renderNodesInto(node.children, dom, options);else if (options.renderInlineFlat) renderInlineContentFlat(node.children, dom, options);else renderInlineContent(node.children, dom, options);
  return dom;
}

function wrapIn(type) {
  return function (node, options) {
    return wrap(node, options, type);
  };
}

function renderNodes(nodes, options) {
  var frag = doc.createDocumentFragment();
  renderNodesInto(nodes, frag, options);
  return frag;
}

function renderNode(node, options, offset) {
  var dom = node.type.serializeDOM(node, options);
  if (options.onRender && node.isBlock) dom = options.onRender(node, dom, offset) || dom;
  return dom;
}

function renderNodesInto(nodes, where, options) {
  for (var i = 0; i < nodes.length; i++) {
    if (options.path) options.path.push(i);
    where.appendChild(renderNode(nodes[i], options, i));
    if (options.path) options.path.pop();
  }
}

function renderInlineContent(nodes, where, options) {
  var top = where;
  var active = [];
  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i],
        styles = node.styles;
    var keep = 0;
    for (; keep < Math.min(active.length, styles.length); ++keep) if (!styles[keep].eq(active[keep])) break;
    while (keep < active.length) {
      active.pop();
      top = top.parentNode;
    }
    while (active.length < styles.length) {
      var add = styles[active.length];
      active.push(add);
      top = top.appendChild(add.type.serializeDOM(add));
    }
    top.appendChild(renderNode(node, options, i));
  }
}

function wrapInlineFlat(node, dom) {
  var styles = node.styles;
  for (var i = styles.length - 1; i >= 0; i--) {
    var _wrap = styles[i].type.serializeDOM(styles[i]);
    _wrap.appendChild(dom);
    dom = _wrap;
  }
  return dom;
}

function renderInlineContentFlat(nodes, where, options) {
  var offset = 0;
  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    var dom = wrapInlineFlat(node, renderNode(node, options, i));
    dom = options.renderInlineFlat(node, dom, offset) || dom;
    where.appendChild(dom);
    offset += node.offset;
  }

  if (!nodes.length || nodes[nodes.length - 1].type.name == "hard_break") where.appendChild(elt("br")).setAttribute("pm-force-br", "true");else if (where.lastChild.contentEditable == "false") where.appendChild(doc.createTextNode(""));
}

// Block nodes

function def(cls, method) {
  cls.prototype.serializeDOM = method;
}

def(_model.BlockQuote, wrapIn("blockquote"));

_model.BlockQuote.prototype.clicked = function (_, path, dom, coords) {
  var childBox = dom.firstChild.getBoundingClientRect();
  if (coords.left < childBox.left - 2) return _model.Pos.from(path);
};

def(_model.BulletList, wrapIn("ul"));

def(_model.OrderedList, function (node, options) {
  var dom = wrap(node, options, "ol");
  if (node.attrs.order > 1) dom.setAttribute("start", node.attrs.order);
  return dom;
});

_model.OrderedList.prototype.clicked = _model.BulletList.prototype.clicked = function (_, path, dom, coords) {
  for (var i = 0; i < dom.childNodes.length; i++) {
    var child = dom.childNodes[i];
    if (!child.hasAttribute("pm-path")) continue;
    var childBox = child.getBoundingClientRect();
    if (coords.left > childBox.left - 2) return null;
    if (childBox.top <= coords.top && childBox.bottom >= coords.top) return new _model.Pos(path, i);
  }
};

def(_model.ListItem, wrapIn("li"));

def(_model.HorizontalRule, function () {
  return elt("hr");
});

def(_model.Paragraph, wrapIn("p"));

def(_model.Heading, function (node, options) {
  return wrap(node, options, "h" + node.attrs.level);
});

def(_model.CodeBlock, function (node, options) {
  var code = wrap(node, options, "code");
  if (node.attrs.params != null) code.className = "fence " + node.attrs.params.replace(/(^|\s+)/g, "$&lang-");
  return elt("pre", code);
});

// Inline content

def(_model.Text, function (node) {
  return doc.createTextNode(node.text);
});

def(_model.Image, function (node) {
  var dom = elt("img");
  dom.setAttribute("src", node.attrs.src);
  if (node.attrs.title) dom.setAttribute("title", node.attrs.title);
  if (node.attrs.alt) dom.setAttribute("alt", node.attrs.alt);
  return dom;
});

def(_model.HardBreak, function () {
  return elt("br");
});

// Inline styles

def(_model.EmStyle, function () {
  return elt("em");
});

def(_model.StrongStyle, function () {
  return elt("strong");
});

def(_model.CodeStyle, function () {
  return elt("code");
});

def(_model.LinkStyle, function (style) {
  var dom = elt("a");
  dom.setAttribute("href", style.attrs.href);
  if (style.attrs.title) dom.setAttribute("title", style.attrs.title);
  return dom;
});