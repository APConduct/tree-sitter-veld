module.exports = grammar({
  name: "veld",

  rules: {
    source_file: ($) => repeat($._definition),

    _definition: ($) =>
      choice(
        $.function_declaration,
        $.struct_declaration,
        $.kind_declaration,
        $.impl_declaration,
        $.enum_declaration,
        $.macro_declaration,
        $.comment,
      ),

    function_declaration: ($) =>
      seq(
        "fn",
        field("name", $.identifier),
        optional($.generic_parameters),
        $.parameter_list,
        optional(seq("->", $.type)),
        "=",
        $.block,
        "end",
      ),

    struct_declaration: ($) =>
      choice(
        seq(
          "struct",
          field("name", $.identifier),
          optional($.generic_parameters),
          $.struct_body,
          "end",
        ),
        seq("struct", field("name", $.identifier), "(", $.struct_fields, ")"),
      ),

    kind_declaration: ($) =>
      seq(
        "kind",
        field("name", $.identifier),
        optional($.generic_parameters),
        choice(seq($.kind_body, "end"), seq("=", $.function_signature)),
      ),

    comment: ($) => choice(seq("--", /.*/), seq("--|", /.*/)),

    identifier: ($) => /[a-zA-Z_][a-zA-Z0-9_]*/,

    // Add more rules for other language constructs...
  },
});
