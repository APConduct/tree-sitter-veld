; Keywords
[
  "fn"
  "proc"
  "let"
  "var"
  "const"
  "mut"
  "struct"
  "kind"
  "impl"
  "end"
  "if"
  "else"
  "then"
  "while"
  "for"
  "in"
  "do"
  "return"
  "mod"
  "import"
  "pub"
  "as"
  "enum"
  "match"
  "where"
  "macro"
  "break"
  "continue"
] @keyword

; Operators
[
  "="
  "+"
  "-"
  "*"
  "/"
  "=="
  "!="
  "<"
  ">"
  "<="
  ">="
  "->"
  "=>"
  "^"
  "%"
  "+="
  "-="
  "*="
  "/="
  "|>"
  "<-"
  "@"
  "~"
] @operator

; Punctuation
[
  "("
  ")"
  "{"
  "}"
  "["
  "]"
  ","
  "."
  ":"
  ";"
] @punctuation.delimiter

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
(generic_type
  base: (identifier) @type)

; Function names
(function_declaration
  name: (identifier) @function)
(proc_declaration
  name: (identifier) @function)

; Method names
(struct_method
  name: (identifier) @function.method)
(kind_method
  name: (identifier) @function.method)
(impl_method
  name: (identifier) @function.method)
(method_call
  method: (identifier) @function.method)

; Struct, kind, and enum names
(struct_declaration
  name: (identifier) @type)
(kind_declaration
  name: (identifier) @type)
(enum_declaration
  name: (identifier) @type)

; Attributes
(attribute
  name: (identifier) @attribute)

; Variables
(variable_declaration
  name: (identifier) @variable)
(parameter
  name: (identifier) @parameter)

; Module and import
(module_declaration
  name: (identifier) @namespace)
(import_path
  (identifier) @namespace)
(import_item
  name: (identifier) @variable.import)

; Enum
(enum_variant
  name: (identifier) @type)
(enum_variant_expression
  enum: (identifier) @type
  variant: (identifier) @constructor)

; Fields
(struct_field
  name: (identifier) @property)
(struct_field_initializer
  name: (identifier) @property)
(member_expression
  property: (identifier) @property)

; Macro
(macro_declaration
  name: (identifier) @function.macro)
(macro_expression
  name: (identifier) @function.macro)
(macro_invocation
  name: (identifier) @function.macro)
