"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.draw = draw;
exports.redraw = redraw;

var _model = require("../model");

var _serializeDom = require("../serialize/dom");

var _dom = require("../dom");

var nonEditable = { html_block: true, html_tag: true, horizontal_rule: true };

function options(path, ranges) {
  return {
    onRender: function onRender(node, dom, offset) {
      if (!node.isInline && offset != null) dom.setAttribute("pm-path", offset);
      if (nonEditable.hasOwnProperty(node.type.name)) dom.contentEditable = false;
      return dom;
    },
    renderInlineFlat: function renderInlineFlat(node, dom, offset) {
      ranges.advanceTo(new _model.Pos(path, offset));
      var end = new _model.Pos(path, offset + node.offset);
      var nextCut = ranges.nextChangeBefore(end);

      var inner = dom,
          wrapped = undefined;
      for (var i = 0; i < node.styles.length; i++) {
        inner = inner.firstChild;
      }if (dom.nodeType != 1) {
        dom = (0, _dom.elt)("span", null, dom);
        if (!nextCut) wrapped = dom;
      }
      if (!wrapped && (nextCut || ranges.current.length)) {
        wrapped = inner == dom ? dom = (0, _dom.elt)("span", null, inner) : inner.parentNode.appendChild((0, _dom.elt)("span", null, inner));
      }

      dom.setAttribute("pm-span", offset + "-" + end.offset);
      if (!node.isText) dom.setAttribute("pm-span-atom", "true");

      var inlineOffset = 0;
      while (nextCut) {
        var size = nextCut - offset;
        var split = splitSpan(wrapped, size);
        if (ranges.current.length) split.className = ranges.current.join(" ");
        split.setAttribute("pm-span-offset", inlineOffset);
        inlineOffset += size;
        offset += size;
        ranges.advanceTo(new _model.Pos(path, offset));
        if (!(nextCut = ranges.nextChangeBefore(end))) wrapped.setAttribute("pm-span-offset", inlineOffset);
      }

      if (ranges.current.length) wrapped.className = ranges.current.join(" ");
      return dom;
    },
    document: document,
    path: path
  };
}

function splitSpan(span, at) {
  var textNode = span.firstChild,
      text = textNode.nodeValue;
  var newNode = span.parentNode.insertBefore((0, _dom.elt)("span", null, text.slice(0, at)), span);
  textNode.nodeValue = text.slice(at);
  return newNode;
}

function draw(pm, doc) {
  pm.content.textContent = "";
  pm.content.appendChild((0, _serializeDom.toDOM)(doc, options([], pm.ranges.activeRangeTracker())));
}

function deleteNextNodes(parent, at, amount) {
  for (var i = 0; i < amount; i++) {
    var prev = at;
    at = at.nextSibling;
    parent.removeChild(prev);
  }
  return at;
}

function redraw(pm, dirty, doc, prev) {
  var ranges = pm.ranges.activeRangeTracker();
  var path = [];

  function scan(dom, node, prev) {
    var status = [],
        inPrev = [],
        inNode = [];
    for (var i = 0, _j = 0; i < prev.length && _j < node.width; i++) {
      var cur = prev.child(i),
          dirtyStatus = dirty.get(cur);
      status.push(dirtyStatus);
      var matching = dirtyStatus ? -1 : node.children.indexOf(cur, _j);
      if (matching > -1) {
        inNode[i] = matching;
        inPrev[matching] = i;
        _j = matching + 1;
      }
    }

    if (node.isTextblock) {
      var needsBR = node.length == 0 || node.lastChild.type == node.type.schema.nodes.hard_break;
      var last = dom.lastChild,
          hasBR = last && last.nodeType == 1 && last.hasAttribute("pm-force-br");
      if (needsBR && !hasBR) dom.appendChild((0, _dom.elt)("br", { "pm-force-br": "true" }));else if (!needsBR && hasBR) dom.removeChild(last);
    }

    var domPos = dom.firstChild,
        j = 0;
    var block = node.isTextblock;
    for (var i = 0, offset = 0; i < node.length; i++) {
      var child = node.child(i);
      if (!block) path.push(i);
      var found = inPrev[i];
      var nodeLeft = true;
      if (found > -1) {
        domPos = deleteNextNodes(dom, domPos, found - j);
        j = found;
      } else if (!block && j < prev.length && inNode[j] == null && status[j] != 2 && child.sameMarkup(prev.child(j))) {
        scan(domPos, child, prev.child(j));
      } else {
        dom.insertBefore((0, _serializeDom.renderNodeToDOM)(child, options(path, ranges), block ? offset : i), domPos);
        nodeLeft = false;
      }
      if (nodeLeft) {
        if (block) domPos.setAttribute("pm-span", offset + "-" + (offset + child.offset));else domPos.setAttribute("pm-path", i);
        domPos = domPos.nextSibling;
        j++;
      }
      if (block) offset += child.offset;else path.pop();
    }
    deleteNextNodes(dom, domPos, prev.length - j);
  }
  scan(pm.content, doc, prev);
}