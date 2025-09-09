/**
 * @file Veld grammar for tree-sitter
 * @author AI Assistant
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const PREC = {
  LAMBDA: 15,
  CALL: 14,
  UNARY: 13,
  POWER: 12,
  MULTI: 11,
  PLUS: 10,
  CONCAT: 9,
  COMPARE: 8,
  EQUALITY: 7,
  AND: 6,
  OR: 5,
  PIPE: 4,
  ASSIGN: 3,
  IF: 2,
  STATEMENT: 1,
};

// Helper functions
const commaSep = (rule) => seq(rule, repeat(seq(",", rule)));
const commaSep1 = (rule) => seq(rule, repeat(seq(",", rule)));
const optionalCommaSep = (rule) => optional(commaSep(rule));

module.exports = grammar({
  name: "veld",

  extras: ($) => [/\s/, $.comment],

  conflicts: ($) => [
    // Keep conflicts minimal and only add when necessary
    [$.expression_statement, $.do_block],
    [$.if_statement, $.if_expression],
    [$.expression_statement, $.block],
    [$.tuple_literal, $.primary_expression],
  ],

  rules: {
    // === ROOT ===
    source_file: ($) => repeat($.statement),

    // === COMMENTS ===
    comment: ($) => token(seq("#", /[^\r\n]*/)),

    // === IDENTIFIERS AND LITERALS ===
    identifier: ($) => /[a-zA-Z_][a-zA-Z0-9_]*/,

    literal: ($) =>
      choice(
        $.number_literal,
        $.string_literal,
        $.boolean_literal,
        $.tuple_literal,
        $.array_literal,
      ),

    number_literal: ($) => /\d+(\.\d+)?/,
    string_literal: ($) => seq('"', /[^"]*/, '"'),
    boolean_literal: ($) => choice("true", "false"),

    tuple_literal: ($) =>
      prec(-10, seq("(", commaSep1(choice($.expression, $.identifier)), ")")),

    array_literal: ($) => seq("[", optionalCommaSep($.expression), "]"),

    // === STATEMENTS ===
    statement: ($) =>
      choice(
        $.variable_declaration,
        $.function_declaration,
        $.proc_declaration,
        $.struct_declaration,
        $.enum_declaration,
        $.kind_declaration,
        $.impl_declaration,
        $.plex_declaration,
        $.if_statement,
        $.return_statement,
        $.expression_statement,
        $.import_statement,
      ),

    variable_declaration: ($) =>
      seq(
        choice("let", seq("let", "mut"), "var", "const"),
        field("name", $.identifier),
        optional(seq(":", field("type", $.type))),
        "=",
        field("value", $.expression),
      ),

    function_declaration: ($) =>
      seq(
        optional(field("visibility", "pub")),
        "fn",
        field("name", $.identifier),
        optional(field("generics", $.generic_parameters)),
        field("parameters", $.parameters),
        optional(seq("->", field("return_type", $.type))),
        choice(seq("=>", field("body", $.expression)), field("body", $.block)),
      ),

    proc_declaration: ($) =>
      seq(
        optional(field("visibility", "pub")),
        "proc",
        field("name", $.identifier),
        optional(field("generics", $.generic_parameters)),
        field("parameters", $.parameters),
        choice(
          seq(field("body", $.block)),
          seq("=>", field("body", $.expression)),
        ),
      ),

    plex_declaration: ($) =>
      seq(
        optional(field("visibility", "pub")),
        field("name", $.identifier),
        "=",
        $.plex_type,
      ),

    plex_type: ($) => seq("{", $.plex_type_field_list, "}"),

    plex_type_field_list: ($) =>
      seq(
        field("fields", $.plex_type_field),
        repeat(seq(",", field("fields", $.plex_type_field))),
        optional(","),
      ),

    plex_type_field: ($) =>
      seq(field("name", $.identifier), ":", field("type", $.type)),

    import_statement: ($) =>
      seq(
        optional(field("visibility", "pub")),
        "import",
        field("name", $.identifier),
        optional(seq(".", field("name", $.identifier))),
        optional(
          choice(
            optional(seq("as", $.identifier)),
            optional(seq(".", "{", $.import_list, "}")),
          ),
        ),
      ),

    import_list: ($) =>
      seq(
        field("names", $.identifier),
        optional(seq("as", $.identifier)),
        repeat(
          seq(
            ",",
            field("names", $.identifier),
            optional(seq("as", $.identifier)),
          ),
        ),
        optional(","),
      ),

    if_statement: ($) =>
      seq(
        "if",
        field("condition", $.expression),
        "then",
        field("consequence", $.expression),
        optional(seq("else", field("alternative", $.expression))),
        "end",
      ),

    return_statement: ($) =>
      prec.right(seq("return", optional(field("value", $.expression)))),

    struct_declaration: ($) =>
      seq("struct", field("name", $.identifier), repeat($.struct_field), "end"),

    struct_field: ($) =>
      seq(
        optional(field("visibility", "pub")),
        field("name", $.identifier),
        ":",
        field("type", $.type),
        ",",
      ),

    enum_declaration: ($) =>
      seq(
        optional(field("visibility", "pub")),
        "enum",
        field("name", $.identifier),
        optional(field("generics", $.generic_parameters)),
        repeat(seq($.enum_variant, optional(","))),
        "end",
      ),

    generic_parameters: ($) => seq("<", commaSep1($.generic_parameter), ">"),

    generic_parameter: ($) =>
      choice(
        $.identifier,
        seq(
          field("name", $.identifier),
          ":",
          field("constraint", $.type_constraint),
        ),
      ),

    type_constraint: ($) =>
      choice(
        $.trait_bound,
        seq($.trait_bound, repeat(seq("+", $.trait_bound))),
      ),

    trait_bound: ($) =>
      choice(
        $.identifier,
        seq(
          field("trait", $.identifier),
          "<",
          commaSep1($.associated_type),
          ">",
        ),
      ),

    associated_type: ($) =>
      choice(
        $.type,
        seq(field("name", $.identifier), "=", field("type", $.type)),
      ),

    enum_variant: ($) =>
      seq(
        field("name", $.identifier),
        optional(seq("(", commaSep1(field("type", $.type)), ")")),
      ),

    kind_declaration: ($) =>
      seq(
        optional(field("visibility", "pub")),
        "kind",
        field("name", $.identifier),
        repeat($.kind_method),
        "end",
      ),

    kind_method: ($) =>
      seq(
        optional(field("visibility", "pub")),
        "fn",
        field("name", $.identifier),
        field("parameters", $.parameters),
        optional(seq("->", field("return_type", $.type))),
      ),

    expression_statement: ($) => $.expression,

    // === BLOCKS ===
    block: ($) => seq(repeat($.statement), optional($.expression), "end"),

    do_block: ($) =>
      seq("do", repeat($.statement), optional($.expression), "end"),

    // === TYPES ===
    type: ($) =>
      choice(
        $.basic_type,
        $.function_type,
        $.unit_type,
        $.array_type,
        $.generic_type,
        $.plex_type,
      ),

    basic_type: ($) => choice($.identifier, "bool", "f64", "str", "i32"),
    function_type: ($) =>
      choice(
        seq("fn", "(", optionalCommaSep($.type), ")", "->", $.type),
        seq("(", optionalCommaSep($.type), ")", "->", $.type),
        prec.right(
          1,
          seq(choice($.basic_type, $.array_type, $.generic_type), "->", $.type),
        ),
      ),
    unit_type: ($) => "()",
    array_type: ($) => seq("[", $.type, "]"),
    generic_type: ($) =>
      seq(
        field("name", $.identifier),
        "<",
        field("args", commaSep1($.type)),
        ">",
      ),

    // === PARAMETERS ===
    parameters: ($) => seq("(", optionalCommaSep($.parameter), ")"),
    parameter: ($) =>
      choice(
        seq(field("name", $.identifier), ":", field("type", $.type)),
        field("name", "self"),
      ),

    // === EXPRESSIONS ===
    expression: ($) =>
      choice(
        // Lambda expressions (highest precedence to resolve conflicts)
        prec.dynamic(2000, $.lambda),
        prec.dynamic(2000, $.fn_lambda),
        prec.dynamic(2000, $.fn_block_lambda),

        // Postfix expressions (function calls, member access)
        $.postfix_expression,

        // Unary expressions
        prec(PREC.UNARY, $.unary_expression),

        // Binary expressions (defined with precedence)
        $.binary_expression,

        // Control flow
        prec(PREC.IF, $.if_expression),
        $.match_expression,

        // Do blocks
        $.do_block,

        $.plex_record_expression,
      ),

    // Primary expressions that can be used as base for postfix operations
    primary_expression: ($) =>
      choice($.literal, $.identifier, $.parenthesized_expression),

    // Postfix expressions include function calls and member access
    postfix_expression: ($) =>
      choice($.function_call, $.member_access, $.primary_expression),

    parenthesized_expression: ($) => seq("(", $.expression, ")"),

    function_call: ($) =>
      prec.dynamic(
        2,
        prec.right(
          PREC.CALL + 2,
          seq(
            field("function", $.postfix_expression),
            field("arguments", $.arguments),
          ),
        ),
      ),

    member_access: ($) =>
      prec.left(
        PREC.CALL,
        seq(
          field("object", $.postfix_expression),
          ".",
          field("member", $.identifier),
        ),
      ),

    arguments: ($) =>
      prec.dynamic(
        2,
        prec(PREC.CALL + 10, seq("(", optionalCommaSep($.expression), ")")),
      ),

    lambda: ($) =>
      prec.dynamic(
        1000,
        choice(
          // Single parameter lambda: x => expr
          seq(field("params", $.identifier), "=>", field("body", $.expression)),
          // Empty parameter lambda: () => expr
          seq(
            field("params", seq("(", ")")),
            "=>",
            field("body", $.expression),
          ),
          // Multi-parameter lambda: (x, y, z) => expr
          seq(
            field("params", $.tuple_literal),
            "=>",
            field("body", $.expression),
          ),
        ),
      ),

    fn_lambda: ($) =>
      seq(
        "fn",
        "(",
        field("params", optionalCommaSep($.fn_lambda_param)),
        ")",
        optional(seq("->", field("return_type", $.type))),
        "=>",
        field("body", $.expression),
      ),

    fn_block_lambda: ($) =>
      seq(
        "fn",
        "(",
        field("params", optionalCommaSep($.fn_lambda_param)),
        ")",
        optional(seq("->", field("return_type", $.type))),
        field("body", $.block),
      ),

    fn_lambda_param: ($) =>
      choice(
        $.identifier,
        seq(field("name", $.identifier), ":", field("type", $.type)),
      ),

    unary_expression: ($) =>
      prec(
        PREC.UNARY,
        seq(
          field("operator", choice("-", "!", "not")),
          field("operand", $.expression),
        ),
      ),

    binary_expression: ($) =>
      choice(
        // Arithmetic
        prec.left(PREC.MULTI, seq($.expression, "*", $.expression)),
        prec.left(PREC.MULTI, seq($.expression, "/", $.expression)),
        prec.left(PREC.MULTI, seq($.expression, "%", $.expression)),
        prec.left(PREC.PLUS, seq($.expression, "+", $.expression)),
        prec.left(PREC.PLUS, seq($.expression, "-", $.expression)),

        // Comparison
        prec.left(PREC.COMPARE, seq($.expression, "<", $.expression)),
        prec.left(PREC.COMPARE, seq($.expression, ">", $.expression)),
        prec.left(PREC.COMPARE, seq($.expression, "<=", $.expression)),
        prec.left(PREC.COMPARE, seq($.expression, ">=", $.expression)),
        prec.left(PREC.EQUALITY, seq($.expression, "==", $.expression)),
        prec.left(PREC.EQUALITY, seq($.expression, "!=", $.expression)),

        // Logical
        prec.left(
          PREC.AND,
          seq($.expression, choice("&&", "and"), $.expression),
        ),
        prec.left(PREC.OR, seq($.expression, choice("||", "or"), $.expression)),

        // Power (right associative)
        prec.right(PREC.POWER, seq($.expression, "^", $.expression)),
      ),

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

    match_expression: ($) =>
      seq("match", field("value", $.expression), repeat1($.match_arm), "end"),

    match_arm: ($) =>
      seq(field("pattern", $.pattern), "=>", field("body", $.expression), ","),

    pattern: ($) =>
      choice(
        $.wildcard_pattern,
        $.constructor_pattern,
        $.literal_pattern,
        $.identifier_pattern,
      ),

    plex_record_expression: ($) =>
      seq("{", field("fields", $.record_field_list), "}"),

    record_field_list: ($) =>
      seq(
        field("fields", $.record_field),
        repeat(seq(",", field("fields", $.record_field))),
        optional(","),
      ),

    record_field: ($) =>
      seq(field("name", $.identifier), ":", field("expression", $.expression)),

    wildcard_pattern: ($) => "_",

    constructor_pattern: ($) =>
      choice(
        prec.left(
          seq(
            field("constructor", $.qualified_identifier),
            "(",
            field("args", commaSep($.pattern)),
            ")",
          ),
        ),
        field("constructor", $.qualified_identifier),
      ),

    identifier_pattern: ($) => $.identifier,

    literal_pattern: ($) => prec(-1, $.literal),

    qualified_identifier: ($) =>
      prec.left(seq($.identifier, repeat1(seq(".", $.identifier)))),

    impl_declaration: ($) =>
      seq(
        "impl",
        optional(field("generics", $.generic_parameters)),
        field("type", $.type),
        repeat(choice($.impl_function, $.impl_proc)),
        "end",
      ),

    impl_function: ($) =>
      seq(
        optional(field("visibility", "pub")),
        "fn",
        field("name", $.identifier),
        optional(field("generics", $.generic_parameters)),
        field("parameters", $.parameters),
        optional(seq("->", field("return_type", $.type))),
        choice(seq("=>", field("body", $.expression)), field("body", $.block)),
      ),

    impl_proc: ($) =>
      seq(
        optional(field("visibility", "pub")),
        "proc",
        field("name", $.identifier),
        optional(field("generics", $.generic_parameters)),
        field("parameters", $.parameters),
        choice(
          seq(field("body", $.block)),
          seq("=>", field("body", $.expression)),
        ),
      ),
  },
});
