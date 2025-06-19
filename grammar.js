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

    [$.expression, $.function_call, $.struct_expression],
    [$.return_statement],

    [$.block],
    [$.source_file, $.block],
    [$.module_declaration],
    [$.import_path],
    [$.expression_statement, $.block_expression],
    [$.member_expression, $.enum_variant_expression],
    [$.lambda, $.type_cast],
    [$.macro_invocation, $.macro_expression],
    [$.expression, $.tuple_literal],
    [$.parenthesized_expression, $.index_expression],
    [$.expression, $.index_expression],
    [$.statement, $.module_declaration],
    [$.struct_declaration],
    [$.struct_fields],
    [$.basic_type, $.generic_type],
    [$.argument, $.struct_field_initializer],
    [$.kind_method],
    [$.statement, $.if_statement],
    [$.if_statement, $.expression_statement],
    [$.generic_params],
  ],

  rules: {
    source_file: ($) => repeat($.statement),

    // Comments
    comment: ($) => token(choice(seq("#", /.*/), seq("#|", /.*/))),
    multiline_comment: ($) =>
      token(
        choice(
          seq("#[[", /(.|\n|\r)*?/, "]]"),
          seq("#|[[", /(.|\n|\r)*?/, "]]"),
        ),
      ),

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
        prec(3, $.if_statement),
        $.while_statement,
        $.for_statement,
        $.return_statement,
        $.match_statement,
        $.macro_invocation,
        $.expression_statement,
        prec(1, $.block),
        $.break_statement,
        $.continue_statement,
      ),

    break_statement: ($) => "break",

    continue_statement: ($) => "continue",

    // Module and import
    module_declaration: ($) =>
      prec.right(
        2,
        seq(
          optional("pub"),
          "mod",
          field("name", $.identifier),
          optional(field("body", $.block)),
        ),
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

    import_path: ($) =>
      prec.left(seq($.identifier, repeat(seq(".", $.identifier)))),

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
      prec.right(
        seq(
          optional("pub"),
          "struct",
          field("name", $.identifier),
          optional(field("generic_params", $.generic_params)),
          choice(
            // Tuple-style struct (simple case)
            seq("(", commaSep($.struct_field), ")"),

            // Block-style struct with fields and methods
            seq(
              field("fields", $.struct_fields),
              optional(field("methods", repeat($.struct_method))),
              "end", // Always require 'end' for block-style structs
            ),
          ),
        ),
      ),

    struct_fields: ($) =>
      choice(
        // Ensure at least one field (commaSep1 instead of commaSep)
        seq(commaSep1($.struct_field), optional(",")),
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
      prec.right(
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
      prec.right(
        3,
        seq(
          "if",
          field("condition", $.expression),
          "then",
          field("consequence", choice($.expression, $.block)),
          optional(
            seq(
              "else",
              field(
                "alternative",
                choice($.expression, $.block, $.if_statement),
              ),
            ),
          ),
          optional("end"),
        ),
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
      prec.right(seq("return", optional(field("value", $.expression)))),

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
        /[^\s$,.:"'()]+/,
      ),

    macro_invocation: ($) =>
      prec(
        1,
        seq(
          field("name", $.identifier),
          "~",
          field("arguments", $.macro_arguments),
        ),
      ),

    macro_arguments: ($) => seq("(", optional(commaSep($.expression)), ")"),

    // Block and expressions
    block: ($) => seq(repeat1($.statement), "end"),

    expression_statement: ($) =>
      prec(1, seq(field("expression", $.expression), optional(";"))),

    expression: ($) =>
      choice(
        // Simple expressions (higher precedence)
        prec(10, $.literal),
        prec(10, $.identifier),

        // Call expressions (high precedence)
        prec(9, $.function_call),
        prec(9, $.method_call),
        prec(9, $.member_expression),
        prec(9, $.index_expression),

        // Other expressions
        $.binary_expression,
        $.unary_expression,
        $.lambda,
        $.block_expression,
        $.if_expression,

        // Creation expressions (lower precedence than call expressions)
        prec(8, $.struct_expression),
        prec(8, $.array_literal),
        prec(8, $.tuple_literal),
        prec(8, $.enum_variant_expression),

        // Macro expressions
        $.macro_expression,
        $.type_cast,

        // Parenthesized expressions
        $.parenthesized_expression,
      ),

    parenthesized_expression: ($) => prec(10, seq("(", $.expression, ")")),

    block_expression: ($) =>
      prec(2, seq("do", repeat($.statement), optional($.expression), "end")),

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
      prec.right(
        5,
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
      ),

    function_call: ($) =>
      prec.left(
        9,
        seq(field("function", $.identifier), field("arguments", $.arguments)),
      ),

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
            $.parenthesized_expression, // Use parenthesized_expression directly
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
        prec(
          2,
          seq(field("name", $.identifier), ":", field("value", $.expression)),
        ),
      ),

    member_expression: ($) =>
      prec(
        1,
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
      ),

    index_expression: ($) =>
      prec.left(
        11,
        seq(
          field(
            "object",
            choice(
              $.identifier,
              $.function_call,
              $.method_call,
              $.member_expression,
              $.parenthesized_expression,
            ),
          ),
          "[",
          field("index", $.expression),
          "]",
        ),
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
      prec.left(
        8,
        seq(
          field("name", $.identifier),
          "(",
          commaSep($.struct_field_initializer),
          ")",
        ),
      ),

    struct_field_initializer: ($) =>
      prec(
        1,
        seq(field("name", $.identifier), ":", field("value", $.expression)),
      ),

    array_literal: ($) => seq("[", optional(commaSep($.expression)), "]"),

    tuple_literal: ($) =>
      choice(
        // Single-element tuple must have a comma
        seq("(", $.expression, ",", ")"),

        // Multiple elements
        seq("(", commaSep2($.expression), optional(","), ")"),
      ),

    enum_variant_expression: ($) =>
      prec(
        2,
        seq(
          field("enum", $.identifier),
          ".",
          field("variant", $.identifier),
          optional(seq("(", optional(commaSep($.expression)), ")")),
        ),
      ),

    macro_expression: ($) =>
      prec(
        5,
        seq(
          field("name", $.identifier),
          "~",
          field("arguments", $.macro_arguments),
        ),
      ),

    type_cast: ($) =>
      prec(
        11,
        seq(field("expression", $.expression), "as", field("type", $.type)),
      ),

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

    basic_type: ($) => prec(1, $.identifier),

    generic_type: ($) =>
      prec(
        2,
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
      ),

    function_type: ($) =>
      seq("(", optional(commaSep($.type)), ")", "->", $.type),

    array_type: ($) => seq("[", $.type, "]"),

    tuple_type: ($) => seq("(", commaSep1($.type), ")"),

    generic_params: ($) =>
      prec.left(
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
      ),
  },
});

function commaSep(rule) {
  return optional(commaSep1(rule));
}

function commaSep1(rule) {
  return seq(rule, repeat(seq(",", rule)));
}

function commaSep2(rule) {
  return seq(rule, ",", commaSep(rule));
}
