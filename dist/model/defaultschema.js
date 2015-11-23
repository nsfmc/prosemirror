"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _schema = require("./schema");

var Doc = (function (_Block) {
  _inherits(Doc, _Block);

  function Doc() {
    _classCallCheck(this, Doc);

    _get(Object.getPrototypeOf(Doc.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(Doc, null, [{
    key: "kind",
    get: function get() {
      return ".";
    }
  }]);

  return Doc;
})(_schema.Block);

exports.Doc = Doc;

var BlockQuote = (function (_Block2) {
  _inherits(BlockQuote, _Block2);

  function BlockQuote() {
    _classCallCheck(this, BlockQuote);

    _get(Object.getPrototypeOf(BlockQuote.prototype), "constructor", this).apply(this, arguments);
  }

  return BlockQuote;
})(_schema.Block);

exports.BlockQuote = BlockQuote;

var OrderedList = (function (_Block3) {
  _inherits(OrderedList, _Block3);

  function OrderedList() {
    _classCallCheck(this, OrderedList);

    _get(Object.getPrototypeOf(OrderedList.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(OrderedList, null, [{
    key: "contains",
    get: function get() {
      return "list_item";
    }
  }]);

  return OrderedList;
})(_schema.Block);

exports.OrderedList = OrderedList;

OrderedList.attributes = { order: new _schema.Attribute({ "default": "1" }) };

var BulletList = (function (_Block4) {
  _inherits(BulletList, _Block4);

  function BulletList() {
    _classCallCheck(this, BulletList);

    _get(Object.getPrototypeOf(BulletList.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(BulletList, null, [{
    key: "contains",
    get: function get() {
      return "list_item";
    }
  }]);

  return BulletList;
})(_schema.Block);

exports.BulletList = BulletList;

var ListItem = (function (_Block5) {
  _inherits(ListItem, _Block5);

  function ListItem() {
    _classCallCheck(this, ListItem);

    _get(Object.getPrototypeOf(ListItem.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(ListItem, null, [{
    key: "kind",
    get: function get() {
      return ".";
    }
  }]);

  return ListItem;
})(_schema.Block);

exports.ListItem = ListItem;

var HorizontalRule = (function (_Block6) {
  _inherits(HorizontalRule, _Block6);

  function HorizontalRule() {
    _classCallCheck(this, HorizontalRule);

    _get(Object.getPrototypeOf(HorizontalRule.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(HorizontalRule, null, [{
    key: "contains",
    get: function get() {
      return null;
    }
  }]);

  return HorizontalRule;
})(_schema.Block);

exports.HorizontalRule = HorizontalRule;

var Heading = (function (_Textblock) {
  _inherits(Heading, _Textblock);

  function Heading() {
    _classCallCheck(this, Heading);

    _get(Object.getPrototypeOf(Heading.prototype), "constructor", this).apply(this, arguments);
  }

  return Heading;
})(_schema.Textblock);

exports.Heading = Heading;

Heading.attributes = { level: new _schema.Attribute({ "default": "1" }) };

var CodeBlock = (function (_Textblock2) {
  _inherits(CodeBlock, _Textblock2);

  function CodeBlock() {
    _classCallCheck(this, CodeBlock);

    _get(Object.getPrototypeOf(CodeBlock.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(CodeBlock, [{
    key: "containsStyles",
    get: function get() {
      return false;
    }
  }, {
    key: "isCode",
    get: function get() {
      return true;
    }
  }], [{
    key: "contains",
    get: function get() {
      return "text";
    }
  }]);

  return CodeBlock;
})(_schema.Textblock);

exports.CodeBlock = CodeBlock;

var Paragraph = (function (_Textblock3) {
  _inherits(Paragraph, _Textblock3);

  function Paragraph() {
    _classCallCheck(this, Paragraph);

    _get(Object.getPrototypeOf(Paragraph.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(Paragraph, [{
    key: "defaultTextblock",
    get: function get() {
      return true;
    }
  }]);

  return Paragraph;
})(_schema.Textblock);

exports.Paragraph = Paragraph;

var Image = (function (_Inline) {
  _inherits(Image, _Inline);

  function Image() {
    _classCallCheck(this, Image);

    _get(Object.getPrototypeOf(Image.prototype), "constructor", this).apply(this, arguments);
  }

  return Image;
})(_schema.Inline);

exports.Image = Image;

Image.attributes = {
  src: new _schema.Attribute(),
  alt: new _schema.Attribute({ "default": "" }),
  title: new _schema.Attribute({ "default": "" })
};

var HardBreak = (function (_Inline2) {
  _inherits(HardBreak, _Inline2);

  function HardBreak() {
    _classCallCheck(this, HardBreak);

    _get(Object.getPrototypeOf(HardBreak.prototype), "constructor", this).apply(this, arguments);
  }

  // Style types

  _createClass(HardBreak, [{
    key: "selectable",
    get: function get() {
      return false;
    }
  }]);

  return HardBreak;
})(_schema.Inline);

exports.HardBreak = HardBreak;

var EmStyle = (function (_StyleType) {
  _inherits(EmStyle, _StyleType);

  function EmStyle() {
    _classCallCheck(this, EmStyle);

    _get(Object.getPrototypeOf(EmStyle.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(EmStyle, null, [{
    key: "rank",
    get: function get() {
      return 51;
    }
  }]);

  return EmStyle;
})(_schema.StyleType);

exports.EmStyle = EmStyle;

var StrongStyle = (function (_StyleType2) {
  _inherits(StrongStyle, _StyleType2);

  function StrongStyle() {
    _classCallCheck(this, StrongStyle);

    _get(Object.getPrototypeOf(StrongStyle.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(StrongStyle, null, [{
    key: "rank",
    get: function get() {
      return 52;
    }
  }]);

  return StrongStyle;
})(_schema.StyleType);

exports.StrongStyle = StrongStyle;

var LinkStyle = (function (_StyleType3) {
  _inherits(LinkStyle, _StyleType3);

  function LinkStyle() {
    _classCallCheck(this, LinkStyle);

    _get(Object.getPrototypeOf(LinkStyle.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(LinkStyle, null, [{
    key: "rank",
    get: function get() {
      return 53;
    }
  }]);

  return LinkStyle;
})(_schema.StyleType);

exports.LinkStyle = LinkStyle;

LinkStyle.attributes = {
  href: new _schema.Attribute(),
  title: new _schema.Attribute({ "default": "" })
};

var CodeStyle = (function (_StyleType4) {
  _inherits(CodeStyle, _StyleType4);

  function CodeStyle() {
    _classCallCheck(this, CodeStyle);

    _get(Object.getPrototypeOf(CodeStyle.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(CodeStyle, [{
    key: "isCode",
    get: function get() {
      return true;
    }
  }], [{
    key: "rank",
    get: function get() {
      return 101;
    }
  }]);

  return CodeStyle;
})(_schema.StyleType);

exports.CodeStyle = CodeStyle;

var defaultSpec = new _schema.SchemaSpec({
  doc: Doc,
  blockquote: BlockQuote,
  ordered_list: OrderedList,
  bullet_list: BulletList,
  list_item: ListItem,
  horizontal_rule: HorizontalRule,

  paragraph: Paragraph,
  heading: Heading,
  code_block: CodeBlock,

  text: _schema.Text,
  image: Image,
  hard_break: HardBreak
}, {
  em: EmStyle,
  strong: StrongStyle,
  link: LinkStyle,
  code: CodeStyle
});

var defaultSchema = new _schema.Schema(defaultSpec);
exports.defaultSchema = defaultSchema;