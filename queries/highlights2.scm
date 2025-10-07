; ; Comments
; (comment) @comment
; (multiline_comment) @comment

; ; Literals
; (string_literal) @string
; (number_literal) @number
; (boolean_literal) @boolean
; (char_literal) @character
; (unit_literal) @constant
; (escape_sequence) @string.escape

; ; Types
; (basic_type) @type
; (function_type) @type
; (array_type) @type
; (tuple_type) @type
; (generic_type
;   (identifier) @type)

; ; Built-in types
; ((identifier) @type.builtin
;  (#match? @type.builtin "^(i32|i64|f32|f64|bool|char|str|String)$"))

; ; Functions and methods
; (function_declaration
;   (identifier) @function)
; (proc_declaration
;   (identifier) @function)
; (function_call
;   (identifier) @function.call)
; (method_call
;   (identifier) @function.method)

; ; Struct, kind, and enum
; (struct_declaration
;   (identifier) @type)
; (kind_declaration
;   (identifier) @type)
; (enum_declaration
;   (identifier) @type)
; (enum_variant
;   (identifier) @constructor)
; (enum_variant_expression
;   (identifier) @type)

; ; Variables and parameters
; (variable_declaration
;   (identifier) @variable)
; (parameter
;   (identifier) @parameter)
; ((identifier) @variable.unused
;  (#match? @variable.unused "^_"))

; ; Module and import
; (module_declaration
;   (identifier) @namespace)
; (import_path
;   (identifier) @namespace)
; (import_item
;   (identifier) @variable.import)

; ; Fields
; (struct_field
;   (identifier) @property)
; (struct_field_initializer
;   (identifier) @property)
; (member_expression
;   (identifier) @property)

; ; Macros - without field selectors
; (macro_declaration) @keyword.macro
; (macro_expression) @keyword.macro
; (macro_invocation) @keyword.macro

; ; Statement nodes that represent keywords
; (break_statement) @keyword.control
; (continue_statement) @keyword.control
; (return_statement) @keyword.control

; ; Control flow keywords
; ["if" "else" "then" "while" "for" "in" "do" "match" "where"] @keyword.control

; ; Storage keywords
; ["let" "var" "const" "mut"] @keyword.storage

; ; Structure keywords
; ["struct" "kind" "enum" "impl" "fn" "proc" "end"] @keyword.structure

; ; Module keywords
; ["mod" "import" "pub" "as"] @keyword.import

; ; Pattern matching for problematic keywords
; ((identifier) @keyword
;  (#match? @keyword "^(break|continue|macro)$"))

; ; Arithmetic operators
; ["+" "-" "*" "/" "%"] @operator.arithmetic

; ; Comparison operators
; ["==" "!=" "<" ">" "<=" ">="] @operator.comparison

; ; Assignment operators
; ["=" "+=" "-=" "*=" "/="] @operator.assignment

; ; Other operators
; ["->" "=>" "^" "|>" "<-" "@" "~"] @operator

; ; Punctuation
; ["(" ")" "{" "}" "[" "]"] @punctuation.bracket
; ["," "." ":" ";"] @punctuation.delimiter
