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
  RANGE: 8,
  COMPARE: 7,
  EQUALITY: 6,
  AND: 5,
  OR: 4,
  PIPE: 3,
  ASSIGN: 2,
  IF: 1,
  STATEMENT: 0,
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
    [$.expression_statement, $.block],
    [$.tuple_literal, $.primary_expression],
    [$.tuple_literal, $.arguments],
    [$.basic_type, $.generic_type],
    [$.primary_expression, $.fn_lambda_param],
    [$.lambda],
    [$.primary_expression, $.lambda],
    [$.if_statement],
    [$.if_statement, $.if_expression],
    [$.union_declaration, $.plex_declaration, $.generic_type],
    [$.plex_declaration, $.union_declaration],
    [$.union_declaration, $.generic_type],
    [$.union_declaration, $.plex_declaration, $.basic_type],
    [$.union_declaration, $.plex_declaration, $.generic_type],
    [$.union_declaration, $.plex_declaration, $.generic_type, $.basic_type],
    [$.plex_declaration, $.type],
    [$.union_declaration, $.basic_type],
    [$.union_declaration, $.basic_type, $.generic_type],
    [$.union_declaration, $.plex_declaration, $.type_alias_declaration, $.basic_type],
    [$.union_declaration, $.plex_declaration, $.type_alias_declaration, $.basic_type, $.generic_type],

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
        $.union_declaration,
        $.type_alias_declaration,
        $.if_statement,
        $.return_statement,
        $.expression_statement,
        $.import_statement,
        $.re_export_statement,
        $.module_declaration,
        $.variable_assignment,
      ),

    re_export_statement: ($) =>
      seq("pub", "(", field("export", $.identifier), ")"),

    module_declaration: ($) =>
      seq(
        optional(field("visibility", "pub")),
        "mod",
        field("name", $.identifier),
        choice("...", seq(repeat($.statement), "end")),
      ),

    variable_declaration: ($) =>
      seq(
        choice("let", seq("let", "mut"), "var", "const"),
        field("name", $.identifier),
        optional(seq(":", field("type", $.type))),
        optional(seq(field("equal_sign", "="), field("value", $.expression))),
      ),

    variable_assignment: ($) =>
      seq(field("name", $.identifier), "=", field("value", $.expression)),

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
        choice("plex", "type"),
        field("name", $.identifier),
        optional(field("generics", $.generic_parameters)),
        "=",
        choice($.identifier, $.plex_type),
      ),

    plex_type: ($) => seq("{", $.plex_type_field_list, "}"),

    union_declaration: ($) =>
      seq(
        optional(field("visibility", "pub")),
        choice("type", "union",),
        field("name", $.identifier),
        optional(field("generics", $.generic_parameters)),
        "=",
        choice($.identifier, $.union_type),
      ),

    union_type: ($) => seq($.type, "|", $.type, repeat(seq("|", $.type))),

    type_alias_declaration: ($) =>
      seq(
        optional(field("visibility", "pub")),
        "type",
        field("name", $.identifier),
        "=",
        choice($.identifier, $.type),
      ),

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
        optional(repeat(seq(".", field("name", $.identifier)))),
        optional(
          choice(
            optional(seq("as", field("alias", $.identifier))),
            optional(seq(".", "{", $.import_list, "}")),
          ),
        ),
      ),

    import_list: ($) =>
      seq(
        field("name", $.identifier),
        optional(seq("as", field("alias", $.identifier))),
        repeat(
          seq(
            ",",
            field("name", $.identifier),
            optional(seq("as", field("alias", $.identifier))),
          ),
        ),
        optional(","),
      ),

    if_statement: ($) =>
      prec(
        PREC.IF,
        seq(
          "if",
          field("condition", $.expression),
          "then",
          repeat(field("pre_consequence", $.statement)),
          optional(field("consequence", $.expression)),
          optional(
            seq(
              "else",
              "if",
              field("condition", $.expression),
              "then",
              repeat(field("pre_consequence", $.statement)),
              optional(field("consequence", $.expression)),
            ),
          ),
          choice(
            "end",
            seq(
              "else",
              repeat(field("pre_consequence", $.statement)),
              optional(field("alternative", $.expression)),
              "end",
            ),
          ),
        ),
      ),

    return_statement: ($) =>
      prec.right(seq("return", optional(field("value", $.expression)))),

    struct_declaration: ($) =>
      seq(
        optional("pub"),
        "struct",
        field("name", $.identifier),
        optional(field("generics", $.generic_parameters)),
        choice(
          seq(
            repeat(choice($.struct_field, $.impl_function, $.impl_proc)),
            "end",
          ),
          seq("(", repeat($.struct_field), ")"),
        ),
      ),

    struct_field: ($) =>
      seq(
        optional(field("visibility", "pub")),
        field("name", $.identifier),
        ":",
        field("type", $.type),
        optional(","),
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
        optional(field("generics", $.generic_parameters)),
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
        $.tuple_type,
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
    tuple_type: ($) => seq("(", field("fields", commaSep($.type)), ")"),

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

        $.range_expression,
      ),

    range_expression: ($) =>
      prec.right(
        PREC.RANGE,
        seq(
          optional($.expression),
          choice("..", "..="),
          optional($.expression),
        ),
      ),

    // Primary expressions that can be used as base for postfix operations
    primary_expression: ($) =>
      choice($.literal, $.identifier, $.parenthesized_expression),

    // Postfix expressions include function calls and member access
    postfix_expression: ($) =>
      choice(
        $.function_call,
        $.macro_call,
        $.member_access,
        $.primary_expression,
      ),

    parenthesized_expression: ($) => seq("(", $.expression, ")"),

    macro_call: ($) =>
      prec.dynamic(
        2,
        prec.right(
          PREC.CALL + 2,
          seq(
            field("macro", seq($.postfix_expression)),
            field("tilde", "~"),
            choice(
              field("arguments", $.arguments),
              field("argument", $.expression),
            ),
          ),
        ),
      ),

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
          seq(
            field("params", choice($.identifier, seq("(", $.identifier, ")"))),
            "=>",
            field("body", $.expression),
          ),
          // Empty parameter lambda: () => expr
          seq(
            field("params", seq("(", ")")),
            "=>",
            field("body", $.expression),
          ),
          // Multi-parameter lambda: (x, y, z) => expr
          seq(
            optional(field("generic_parameters", $.generic_parameters)),
            "(",
            field("params", optionalCommaSep($.fn_lambda_param)),
            ")",
            optional(seq("->", field("return_type", $.type))),
            "=>",
            field("body", $.expression),
          ),
        ),
      ),

    fn_lambda: ($) =>
      seq(
        "fn",
        optional(field("generic_parameters", $.generic_parameters)),
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
      seq(
        field("pattern", $.pattern),
        "=>",
        field("body", $.expression),
        optional(","),
      ),

    pattern: ($) =>
      seq(
        choice(
          $.wildcard_pattern,
          $.identifier_pattern,
          $.constructor_pattern,
          $.literal_pattern,
        ),
        optional(seq("where", $.expression)),
      ),

    plex_record_expression: ($) =>
      seq("{", optional(field("fields", $.record_field_list)), "}"),

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
            field("constructor", choice($.identifier, $.qualified_identifier)),
            "(",
            field("args", optional(commaSep($.pattern))),
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
        optional(seq($.type, "<-")),
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
