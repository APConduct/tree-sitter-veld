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
        $.variable_declaration,
      ),

    // Function declaration
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

    // Struct declaration
    struct_declaration: ($) =>
      choice(
        // Multi-line struct
        seq(
          "struct",
          field("name", $.identifier),
          optional($.generic_parameters),
          $.struct_body,
          "end",
        ),
        // Single-line struct
        prec(
          2,
          seq(
            "struct",
            field("name", $.identifier),
            "(",
            optional($.inline_struct_fields),
            ")",
            ";",
          ),
        ),
      ),
    // Implementation declaration
    impl_declaration: ($) =>
      prec(
        1,
        seq(
          "impl",
          field("target", $.identifier),
          optional(seq("for", $.type)),
          choice(
            seq($.impl_body, "end"),
            seq(
              "fn",
              field("name", $.identifier),
              $.parameter_list,
              optional(seq("->", $.type)),
              "=",
              $.expression,
              optional(";"),
            ),
          ),
        ),
      ),

    impl_block: ($) => seq("impl", repeat1($.function_declaration)),

    // Kind declaration
    kind_declaration: ($) =>
      seq(
        "kind",
        field("name", $.identifier),
        optional($.generic_parameters),
        choice(
          seq($.kind_body, "end"),
          seq("=", $.function_signature, optional(";")),
        ),
      ),

    // Enum declaration
    enum_declaration: ($) =>
      choice(
        seq("enum", field("name", $.identifier), $.enum_body, "end"),
        seq(
          "enum",
          field("name", $.identifier),
          "(",
          $.enum_variants,
          ")",
          ";",
        ),
      ),

    // Macro declaration
    macro_declaration: ($) =>
      seq(
        choice("macro", "proc_macro"),
        field("name", $.identifier),
        "=",
        "fn",
        $.parameter_list,
        $.block,
        "end",
      ),

    // Helper rules
    parameter_list: ($) => seq("(", optional($.parameters), ")"),

    parameters: ($) =>
      seq($.parameter, repeat(seq(",", $.parameter)), optional(",")),

    parameter: ($) =>
      seq(field("name", $.identifier), optional(seq(":", $.type))),

    type: ($) => choice($.identifier, $.generic_type),

    generic_type: ($) =>
      seq(field("base", $.identifier), "<", $.type_parameters, ">"),

    type_parameters: ($) =>
      seq($.type, repeat(seq(",", $.type)), optional(",")),

    generic_parameters: ($) =>
      seq(
        "<",
        $.generic_parameter,
        repeat(seq(",", $.generic_parameter)),
        optional(","),
        ">",
      ),

    generic_parameter: ($) =>
      seq(field("name", $.identifier), optional(seq(":", $.type_constraints))),

    type_constraints: ($) => seq($.identifier, repeat(seq("+", $.identifier))),

    struct_body: ($) => repeat1($.struct_field),

    struct_fields: ($) =>
      prec.right(
        1,
        seq($.struct_field, repeat(seq(",", $.struct_field)), optional(",")),
      ),

    struct_field: ($) =>
      prec.right(
        1,
        seq(
          field("name", $.identifier),
          ":",
          field("type", $.type),
          optional(","),
        ),
      ),

    inline_struct_fields: ($) =>
      seq(
        $.inline_struct_field,
        repeat(seq(",", $.inline_struct_field)),
        optional(","),
      ),

    inline_struct_field: ($) =>
      seq(field("name", $.identifier), ":", field("type", $.type)),

    impl_body: ($) => repeat1($.function_declaration),

    kind_body: ($) => repeat1($.function_signature),

    function_signature: ($) =>
      seq(
        "fn",
        field("name", $.identifier),
        $.parameter_list,
        optional(seq("->", $.type)),
        optional(","),
      ),

    enum_body: ($) => repeat1($.enum_variant),

    enum_variant: ($) => seq(field("name", $.identifier), optional(",")),

    enum_variants: ($) =>
      seq($.identifier, repeat(seq(",", $.identifier)), optional(",")),

    block: ($) =>
      choice(
        // Single expression
        $.expression,
        // One or more statements
        seq(repeat1($.statement)),
        // Statements followed by an expression
        seq(repeat1($.statement), $.expression),
      ),

    statement: ($) => choice($.variable_declaration, seq($.expression, ";")),

    variable_declaration: ($) =>
      seq(
        choice("let", "var"),
        field("name", $.identifier),
        optional(seq(":", $.type)),
        "=",
        $.expression,
        optional(";"),
      ),

    expression: ($) =>
      choice(
        $.identifier,
        $.number,
        $.string,
        $.binary_expression,
        $.function_call,
        $.macro_call,
        $.return_expression,
      ),

    return_expression: ($) =>
      prec.right(
        2, // Higher precedence than binary_expression
        seq("return", optional($.expression)),
      ),

    number: ($) => /\d+(\.\d+)?/,
    string: ($) => /"[^"]*"/,

    binary_expression: ($) =>
      prec.left(
        1, // Lower precedence than return_expression
        seq(
          field("left", $.expression),
          field(
            "operator",
            choice("+", "-", "*", "/", "==", "!=", "<", ">", "<=", ">="),
          ),
          field("right", $.expression),
        ),
      ),

    function_call: ($) =>
      seq(field("function", $.identifier), $.parameter_list),

    macro_call: ($) =>
      seq("~", field("macro", $.identifier), optional($.parameter_list)),

    identifier: ($) => /[a-zA-Z_][a-zA-Z0-9_]*/,

    comment: ($) => choice(seq("--", /.*/), seq("--|", /.*/)),
  },
});
