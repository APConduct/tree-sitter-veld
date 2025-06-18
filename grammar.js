module.exports = grammar({
  name: "veld",

  // Define which characters can be used in identifiers
  extras: ($) => [/\s/, $.comment, $.multiline_comment],

  // Define potential conflicts
  conflicts: ($) => [
    // Expression vs pattern conflicts in match statements
    [$.identifier, $.match_pattern],
    // Function calls vs types with generic parameters
    [$.function_call, $.generic_type],
    // Lambda vs if expression
    [$.lambda, $.if_expression],
    // Block expression vs statement block
    [$.block_expression, $.block],
    // Attribute arguments
    [$.attribute_argument, $.expression],
    // Struct field vs struct field initializer
    [$.struct_field, $.struct_field_initializer],
  ],

  rules: {
    source_file: ($) => repeat($.statement),

    // Comments
    comment: ($) => token(seq("#", /.*/)),
    multiline_comment: ($) => token(seq("#|", /[^|]*/, "|#")),

    // Identifiers and literals
    identifier: ($) => /[a-zA-Z_][a-zA-Z0-9_]*/,

    literal: ($) =>
      choice(
        $.number_literal,
        $.string_literal,
        $.boolean_literal,
        $.char_literal,
        $.unit_literal,
      ),

    number_literal: ($) => choice(/[0-9]+/, /[0-9]+\.[0-9]+/),

    string_literal: ($) =>
      seq('"', repeat(choice(/[^"\\]+/, $.escape_sequence)), '"'),

    escape_sequence: ($) =>
      token(seq("\\", choice(/[\\'"nrt]/, /u[0-9a-fA-F]{4}/))),

    boolean_literal: ($) => choice("true", "false"),

    char_literal: ($) => seq("'", choice(/[^'\\]/, $.escape_sequence), "'"),

    unit_literal: ($) => "()",

    // Attributes
    attribute: ($) =>
      seq(
        "@",
        field("name", $.identifier),
        optional(seq("(", optional(commaSep($.attribute_argument)), ")")),
      ),

    attribute_argument: ($) =>
      choice(
        $.expression,
        seq(field("name", $.identifier), "=", field("value", $.expression)),
      ),

    // Statements
    statement: ($) =>
      choice(
        // Declarations
        $.module_declaration,
        $.import_declaration,
        $.function_declaration,
        $.proc_declaration,
        $.struct_declaration,
        $.kind_declaration,
        $.enum_declaration,
        $.variable_declaration,
        $.implementation,
        $.macro_declaration,

        // Statements with possible attributes
        seq(
          repeat1($.attribute),
          choice(
            $.function_declaration,
            $.proc_declaration,
            $.struct_declaration,
            $.kind_declaration,
            $.enum_declaration,
            $.variable_declaration,
            $.implementation,
          ),
        ),

        // Other statements
        $.assignment,
        $.if_statement,
        $.while_statement,
        $.for_statement,
        $.return_statement,
        $.match_statement,
        $.macro_invocation,
        $.expression_statement,
        $.block,
        $.break_statement,
        $.continue_statement,
      ),

    break_statement: ($) => "break",

    continue_statement: ($) => "continue",

    // Module and import
    module_declaration: ($) =>
      seq(
        optional("pub"),
        "mod",
        field("name", $.identifier),
        optional(field("body", $.block)),
      ),

    import_declaration: ($) =>
      seq(
        optional("pub"),
        "import",
        field("path", $.import_path),
        optional(
          choice(
            seq("as", field("alias", $.identifier)),
            field("items", $.import_items),
          ),
        ),
      ),

    import_path: ($) => seq($.identifier, repeat(seq(".", $.identifier))),

    import_items: ($) =>
      seq(".", choice("*", seq("{", commaSep($.import_item), "}"))),

    import_item: ($) =>
      choice(
        field("name", $.identifier),
        seq(field("name", $.identifier), "as", field("alias", $.identifier)),
      ),

    // Function declaration
    function_declaration: ($) =>
      seq(
        optional("pub"),
        "fn",
        field("name", $.identifier),
        optional(field("generic_params", $.generic_params)),
        field("parameters", $.parameters),
        optional(seq("->", field("return_type", $.type))),
        choice(
          field("body", $.block),
          seq("=>", field("expression", $.expression)),
        ),
      ),

    proc_declaration: ($) =>
      seq(
        optional("pub"),
        "proc",
        field("name", $.identifier),
        optional(field("generic_params", $.generic_params)),
        field("parameters", $.parameters),
        field("body", $.block),
      ),

    parameters: ($) => seq("(", optional(commaSep($.parameter)), ")"),

    parameter: ($) =>
      seq(field("name", $.identifier), ":", field("type", $.type)),

    // Struct and kind declarations
    struct_declaration: ($) =>
      seq(
        optional("pub"),
        "struct",
        field("name", $.identifier),
        optional(field("generic_params", $.generic_params)),
        choice(
          seq(
            field("fields", $.struct_fields),
            optional(field("methods", repeat($.struct_method))),
            optional("end"),
          ),
          seq("(", commaSep($.struct_field), ")"),
        ),
      ),

    struct_fields: ($) =>
      choice(
        seq(commaSep($.struct_field), optional(",")),
        seq(field("fields", commaSep1($.struct_field))),
      ),

    struct_field: ($) =>
      seq(
        optional("pub"),
        field("name", $.identifier),
        ":",
        field("type", $.type),
      ),

    struct_method: ($) =>
      seq(
        optional("pub"),
        "fn",
        field("name", $.identifier),
        field("parameters", $.method_parameters),
        optional(seq("->", field("return_type", $.type))),
        choice(
          field("body", $.block),
          seq("=>", field("expression", $.expression)),
        ),
      ),

    method_parameters: ($) =>
      seq(
        "(",
        seq(
          optional(seq(choice("self", "mut self"), optional(","))),
          optional(commaSep($.parameter)),
        ),
        ")",
      ),

    kind_declaration: ($) =>
      seq(
        optional("pub"),
        "kind",
        field("name", $.identifier),
        optional(field("generic_params", $.generic_params)),
        optional(seq(":", commaSep1($.type))),
        repeat($.kind_method),
        "end",
      ),

    kind_method: ($) =>
      seq(
        optional("pub"),
        "fn",
        field("name", $.identifier),
        field("parameters", $.method_parameters),
        optional(seq("->", field("return_type", $.type))),
        optional(
          choice(
            field("body", $.block),
            seq("=>", field("expression", $.expression)),
          ),
        ),
      ),

    // Enum declaration
    enum_declaration: ($) =>
      seq(
        optional("pub"),
        "enum",
        field("name", $.identifier),
        optional(field("generic_params", $.generic_params)),
        "(",
        commaSep($.enum_variant),
        ")",
      ),

    enum_variant: ($) =>
      choice(
        $.identifier,
        seq(field("name", $.identifier), "(", optional(commaSep($.type)), ")"),
      ),

    // Implementation
    implementation: ($) =>
      seq(
        "impl",
        optional(field("generic_params", $.generic_params)),
        field("type_name", $.type),
        optional(
          choice(
            seq("<-", field("kind_name", $.type)),
            seq("for", field("kind_name", $.type)),
          ),
        ),
        repeat($.impl_method),
        "end",
      ),

    impl_method: ($) =>
      seq(
        optional("pub"),
        "fn",
        field("name", $.identifier),
        field("parameters", $.method_parameters),
        optional(seq("->", field("return_type", $.type))),
        choice(
          field("body", $.block),
          seq("=>", field("expression", $.expression)),
        ),
      ),

    // Variable declaration
    variable_declaration: ($) =>
      seq(
        optional("pub"),
        choice("let", "var", "const"),
        optional("mut"),
        field("name", $.identifier),
        optional(seq(":", field("type", $.type))),
        "=",
        field("value", $.expression),
      ),

    // Assignment
    assignment: ($) =>
      seq(
        field(
          "target",
          choice($.identifier, $.member_expression, $.index_expression),
        ),
        choice("=", "+=", "-=", "*=", "/="),
        field("value", $.expression),
      ),

    // Control flow statements
    if_statement: ($) =>
      seq(
        "if",
        field("condition", $.expression),
        "then",
        field("consequence", choice($.block, $.expression)),
        optional(
          seq(
            "else",
            field("alternative", choice($.block, $.if_statement, $.expression)),
          ),
        ),
        optional("end"),
      ),

    while_statement: ($) =>
      seq(
        "while",
        field("condition", $.expression),
        "do",
        field("body", $.block),
        "end",
      ),

    for_statement: ($) =>
      seq(
        "for",
        field("iterator", $.identifier),
        optional(seq(",", field("index", $.identifier))),
        "in",
        field("iterable", $.expression),
        "do",
        field("body", $.block),
        "end",
      ),

    return_statement: ($) =>
      seq("return", optional(field("value", $.expression))),

    match_statement: ($) =>
      seq("match", field("value", $.expression), repeat($.match_arm), "end"),

    match_arm: ($) =>
      seq(
        field("pattern", $.match_pattern),
        optional(seq("where", field("guard", $.expression))),
        "=>",
        field("body", choice($.block, $.expression)),
        optional(","),
      ),

    match_pattern: ($) =>
      choice(
        $.literal,
        $.identifier,
        "_",
        seq(
          field("enum_name", $.identifier),
          ".",
          field("variant", $.identifier),
          optional(seq("(", commaSep($.match_pattern), ")")),
        ),
      ),

    // Macro declaration and invocation
    macro_declaration: ($) =>
      seq("macro~", field("name", $.identifier), repeat($.macro_rule), "end"),

    macro_rule: ($) =>
      seq(
        field("pattern", $.macro_pattern),
        "=>",
        field("expansion", choice($.block, $.expression)),
        optional(","),
      ),

    macro_pattern: ($) => seq("(", repeat($.macro_pattern_token), ")"),

    macro_pattern_token: ($) =>
      choice(
        "$",
        ",",
        ".",
        ":",
        field("variable", seq("$", $.identifier, ":", $.identifier)),
        /[^\s\$\,\.\:]+/,
      ),

    macro_invocation: ($) =>
      seq(
        field("name", $.identifier),
        "~",
        field("arguments", $.macro_arguments),
      ),

    macro_arguments: ($) => seq("(", optional(commaSep($.expression)), ")"),

    // Block and expressions
    block: ($) => seq(repeat1($.statement), optional("end")),

    expression_statement: ($) =>
      seq(field("expression", $.expression), optional(";")),

    expression: ($) =>
      choice(
        $.literal,
        $.identifier,
        $.function_call,
        $.method_call,
        $.member_expression,
        $.index_expression,
        $.binary_expression,
        $.unary_expression,
        $.lambda,
        $.block_expression,
        $.if_expression,
        $.struct_expression,
        $.array_literal,
        $.tuple_literal,
        $.enum_variant_expression,
        $.macro_expression,
        $.type_cast,
        seq("(", $.expression, ")"),
      ),

    block_expression: ($) =>
      seq("do", repeat($.statement), optional($.expression), "end"),

    if_expression: ($) =>
      seq(
        "if",
        field("condition", $.expression),
        "then",
        field("consequence", $.expression),
        "else",
        field("alternative", $.expression),
        "end",
      ),

    lambda: ($) =>
      choice(
        seq(
          field(
            "params",
            choice($.identifier, seq("(", commaSep($.parameter), ")")),
          ),
          "=>",
          field("body", $.expression),
        ),
        seq(
          field(
            "params",
            choice($.identifier, seq("(", commaSep($.parameter), ")")),
          ),
          "=>",
          "do",
          repeat($.statement),
          optional($.expression),
          "end",
        ),
      ),

    function_call: ($) =>
      seq(field("function", $.identifier), field("arguments", $.arguments)),

    method_call: ($) =>
      seq(
        field(
          "object",
          choice(
            $.identifier,
            $.function_call,
            $.method_call,
            $.member_expression,
            $.index_expression,
            seq("(", $.expression, ")"),
          ),
        ),
        ".",
        field("method", $.identifier),
        field("arguments", $.arguments),
      ),

    arguments: ($) => seq("(", optional(commaSep($.argument)), ")"),

    argument: ($) =>
      choice(
        $.expression,
        seq(field("name", $.identifier), ":", field("value", $.expression)),
      ),

    member_expression: ($) =>
      seq(
        field(
          "object",
          choice(
            $.identifier,
            $.function_call,
            $.method_call,
            $.member_expression,
            $.index_expression,
            seq("(", $.expression, ")"),
          ),
        ),
        ".",
        field("property", $.identifier),
      ),

    index_expression: ($) =>
      seq(
        field(
          "object",
          choice(
            $.identifier,
            $.function_call,
            $.method_call,
            $.member_expression,
            seq("(", $.expression, ")"),
          ),
        ),
        "[",
        field("index", $.expression),
        "]",
      ),

    binary_expression: ($) => {
      const PREC = {
        OR: 1,
        AND: 2,
        EQUALITY: 3,
        COMPARISON: 4,
        ADD: 5,
        MULTIPLY: 6,
        EXPONENT: 7,
        PIPE: 0,
      };

      return choice(
        prec.left(
          PREC.OR,
          seq(
            field("left", $.expression),
            choice("||", "or"),
            field("right", $.expression),
          ),
        ),
        prec.left(
          PREC.AND,
          seq(
            field("left", $.expression),
            choice("&&", "and"),
            field("right", $.expression),
          ),
        ),
        prec.left(
          PREC.EQUALITY,
          seq(
            field("left", $.expression),
            choice("==", "!="),
            field("right", $.expression),
          ),
        ),
        prec.left(
          PREC.COMPARISON,
          seq(
            field("left", $.expression),
            choice("<=", ">=", "<", ">"),
            field("right", $.expression),
          ),
        ),
        prec.left(
          PREC.ADD,
          seq(
            field("left", $.expression),
            choice("+", "-"),
            field("right", $.expression),
          ),
        ),
        prec.left(
          PREC.MULTIPLY,
          seq(
            field("left", $.expression),
            choice("*", "/", "%"),
            field("right", $.expression),
          ),
        ),
        prec.right(
          PREC.EXPONENT,
          seq(field("left", $.expression), "^", field("right", $.expression)),
        ),
        prec.left(
          PREC.PIPE,
          seq(field("left", $.expression), "|>", field("right", $.expression)),
        ),
      );
    },

    unary_expression: ($) =>
      prec(8, seq(choice("-", "!", "not"), field("operand", $.expression))),

    struct_expression: ($) =>
      seq(
        field("name", $.identifier),
        "(",
        commaSep($.struct_field_initializer),
        ")",
      ),

    struct_field_initializer: ($) =>
      seq(field("name", $.identifier), ":", field("value", $.expression)),

    array_literal: ($) => seq("[", optional(commaSep($.expression)), "]"),

    tuple_literal: ($) => seq("(", commaSep1($.expression), optional(","), ")"),

    enum_variant_expression: ($) =>
      seq(
        field("enum", $.identifier),
        ".",
        field("variant", $.identifier),
        optional(seq("(", optional(commaSep($.expression)), ")")),
      ),

    macro_expression: ($) =>
      seq(
        field("name", $.identifier),
        "~",
        field("arguments", $.macro_arguments),
      ),

    type_cast: ($) =>
      seq(field("expression", $.expression), "as", field("type", $.type)),

    // Types
    type: ($) =>
      choice(
        $.basic_type,
        $.generic_type,
        $.function_type,
        $.array_type,
        $.tuple_type,
        "()", // Unit type
      ),

    basic_type: ($) => $.identifier,

    generic_type: ($) =>
      seq(
        field("base", $.identifier),
        "<",
        commaSep1(
          choice(
            $.type,
            seq(field("name", $.identifier), "=", field("type", $.type)),
          ),
        ),
        ">",
      ),

    function_type: ($) =>
      seq("(", optional(commaSep($.type)), ")", "->", $.type),

    array_type: ($) => seq("[", $.type, "]"),

    tuple_type: ($) => seq("(", commaSep1($.type), ")"),

    generic_params: ($) =>
      seq(
        "<",
        commaSep1(
          choice(
            $.identifier,
            seq(field("name", $.identifier), ":", commaSep1($.type)),
          ),
        ),
        ">",
      ),
  },
});

function commaSep(rule) {
  return optional(commaSep1(rule));
}

function commaSep1(rule) {
  return seq(rule, repeat(seq(",", rule)));
}
