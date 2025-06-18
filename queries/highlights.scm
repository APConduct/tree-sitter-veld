; Comments
(comment) @comment
(multiline_comment) @comment

; Literals
(string_literal) @string
(number_literal) @number
(boolean_literal) @boolean
(char_literal) @character
(unit_literal) @constant

; Types
(basic_type) @type
(function_type) @type
(array_type) @type
(tuple_type) @type

; Identifiers in specific contexts
(function_declaration
  (identifier) @function)
(proc_declaration
  (identifier) @function)
(struct_declaration
  (identifier) @type)
(kind_declaration
  (identifier) @type)
(enum_declaration
  (identifier) @type)
(variable_declaration
  (identifier) @variable)
(parameter
  (identifier) @parameter)
(module_declaration
  (identifier) @namespace)

; Fields
(struct_field
  (identifier) @property)
(struct_field_initializer
  (identifier) @property)
(member_expression
  (identifier) @property)

; Statement nodes that represent keywords
(break_statement) @keyword
(continue_statement) @keyword
(return_statement) @keyword
; Macro-related keywords
; To change the behavior of these keywords, change '@keyword.macro' to '@function.macro' or similar
(macro_declaration) @keyword.macro
(macro_expression) @keyword.macro
(macro_invocation) @keyword.macro

; Safe keywords (excluding the problematic ones)
"fn" @keyword
"proc" @keyword
"let" @keyword
"var" @keyword
"const" @keyword
"mut" @keyword
"struct" @keyword
"kind" @keyword
"impl" @keyword
"end" @keyword
"if" @keyword
"else" @keyword
"then" @keyword
"while" @keyword
"for" @keyword
"in" @keyword
"do" @keyword
"mod" @keyword
"import" @keyword
"pub" @keyword
"as" @keyword
"enum" @keyword
"match" @keyword
"where" @keyword
"return" @keyword

; Pattern matching for problematic keywords in identifiers
((identifier) @keyword
 (#match? @keyword "^(break|continue|macro)$"))

; Operators
"=" @operator
"+" @operator
"-" @operator
"*" @operator
"/" @operator
"==" @operator
"!=" @operator
"<" @operator
">" @operator
"<=" @operator
">=" @operator
"->" @operator
"=>" @operator
"^" @operator
"%" @operator
"+=" @operator
"-=" @operator
"*=" @operator
"/=" @operator
"|>" @operator
"<-" @operator
"@" @operator
"~" @operator

; Punctuation
"(" @punctuation.delimiter
")" @punctuation.delimiter
"{" @punctuation.delimiter
"}" @punctuation.delimiter
"[" @punctuation.delimiter
"]" @punctuation.delimiter
"," @punctuation.delimiter
"." @punctuation.delimiter
":" @punctuation.delimiter
";" @punctuation.delimiter
