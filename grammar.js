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
    [$.tuple_literal, $.parenthesized_expression],
    [$.lambda, $.tuple_literal],
    [$.lambda, $.unit_literal],
    [$.lambda, $.literal],
    [$.member_access, $.lambda],
    [$.member_access, $.fn_lambda],
    [$.method_call, $.lambda],
    [$.method_call, $.fn_lambda],
    [$.method_call, $.member_access, $.lambda],
    [$.method_call, $.member_access],
    [$.method_call, $.member_access, $.fn_lambda],
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
        $.unit_literal,
        $.tuple_literal,
      ),

    number_literal: ($) => /\d+(\.\d+)?/,
    string_literal: ($) => seq('"', /[^"]*/, '"'),
    boolean_literal: ($) => choice("true", "false"),
    unit_literal: ($) => "()",

    tuple_literal: ($) =>
      prec(-10, seq("(", commaSep1(choice($.expression, $.identifier)), ")")),

    // === STATEMENTS ===
    statement: ($) =>
      choice(
        $.variable_declaration,
        $.function_declaration,
        $.proc_declaration,
        $.struct_declaration,
        $.enum_declaration,
        $.kind_declaration,
        $.if_statement,
        $.return_statement,
        $.expression_statement,
      ),

    variable_declaration: ($) =>
      seq(
        "let",
        field("name", $.identifier),
        "=",
        field("value", $.expression),
      ),

    function_declaration: ($) =>
      seq(
        "fn",
        field("name", $.identifier),
        field("parameters", $.parameters),
        optional(seq("->", field("return_type", $.type))),
        choice(seq("=>", field("body", $.expression)), field("body", $.block)),
      ),

    proc_declaration: ($) =>
      seq(
        "proc",
        field("name", $.identifier),
        field("parameters", $.parameters),
        choice(
          seq(field("body", $.block)),
          seq("=>", field("body", $.expression)),
        ),
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
        repeat($.enum_variant),
        "end",
      ),

    generic_parameters: ($) => seq("<", commaSep1($.identifier), ">"),

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
    type: ($) => choice($.basic_type, $.function_type, $.unit_type),

    basic_type: ($) => choice($.identifier, "bool", "f64", "str", "i32"),
    function_type: ($) =>
      seq("fn", "(", optionalCommaSep($.type), ")", "->", $.type),
    unit_type: ($) => "()",

    // === PARAMETERS ===
    parameters: ($) => seq("(", optionalCommaSep($.parameter), ")"),
    parameter: ($) =>
      seq(field("name", $.identifier), ":", field("type", $.type)),

    // === EXPRESSIONS ===
    expression: ($) =>
      choice(
        // Lambda expressions (highest precedence to resolve conflicts)
        prec.dynamic(2000, $.lambda),
        prec.dynamic(2000, $.fn_lambda),

        // Atoms (highest precedence)
        prec(PREC.CALL + 1, $.literal),
        prec(PREC.CALL + 1, $.identifier),
        prec(PREC.CALL + 1, $.parenthesized_expression),

        // Member access and function calls
        prec(PREC.CALL, $.member_access),
        prec(PREC.CALL + 1, $.function_call),
        prec(PREC.CALL + 2, $.method_call),

        // Unary expressions
        prec(PREC.UNARY, $.unary_expression),

        // Binary expressions (defined with precedence)
        $.binary_expression,

        // Control flow
        prec(PREC.IF, $.if_expression),

        // Do blocks
        $.do_block,
      ),

    parenthesized_expression: ($) => seq("(", $.expression, ")"),

    function_call: ($) =>
      seq(field("function", $.identifier), field("arguments", $.arguments)),

    method_call: ($) =>
      seq(
        field("object", $.expression),
        ".",
        field("method", $.identifier),
        field("arguments", $.arguments),
      ),

    arguments: ($) => seq("(", optionalCommaSep($.expression), ")"),

    member_access: ($) =>
      seq(field("object", $.expression), ".", field("member", $.identifier)),

    lambda: ($) =>
      prec.dynamic(
        1000,
        choice(
          // Single parameter lambda: x => expr
          seq(field("params", $.identifier), "=>", field("body", $.expression)),
          // Empty parameter lambda: () => expr
          seq(
            field("params", $.unit_literal),
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
  },
});
