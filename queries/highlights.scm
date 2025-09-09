; Comments
(comment) @comment
; (multiline_comment) @comment

; Literals
(string_literal) @string
(number_literal) @number
(boolean_literal) @boolean
; (char_literal) @character
; (unit_literal) @constant

; Types
(basic_type) @type
(function_type) @type
(array_type) @type
(generic_type) @type
; (tuple_type) @type

(primary_expression
  (identifier) @variable)

; Identifiers in specific contexts
(function_declaration
  name: (identifier) @function)
(proc_declaration
  name: (identifier) @function)
(struct_declaration
  name: (identifier) @type)
(kind_declaration
  name: (identifier) @type)
(enum_declaration
  name: (identifier) @type)
(variable_declaration
  name: (identifier) @variable)
(parameter
  name: (identifier) @variable)
(kind_method
  name: (identifier) @function)
(impl_function
  name: (identifier) @function)
(impl_proc
  name: (identifier) @function)

; Generic type parameters
(generic_parameter
  (identifier) @type.parameter)

; Generic parameters with names
(generic_parameter
  name: (identifier) @type.parameter)

; Trait bounds in constraints
(trait_bound
  (identifier) @type)

; Trait bounds with trait field
(trait_bound
  trait: (identifier) @type)

; Associated type names
(associated_type
  name: (identifier) @type.parameter)

; Match expressions and patterns
"match" @keyword
(wildcard_pattern) @variable.builtin
(constructor_pattern
  constructor: (qualified_identifier) @constructor)
(identifier_pattern
  (identifier) @variable)

; Impl blocks

; Lambda parameters - direct identifiers in tuple literals
(lambda
  params: (tuple_literal
    (identifier) @variable))

; Lambda parameters - wrapped identifiers in tuple literals
(lambda
  params: (tuple_literal
    (expression
      (postfix_expression
        (primary_expression
          (identifier) @variable)))))

; Lambda parameters - single identifier
(lambda
  params: (identifier) @variable)

; fn_block_lambda parameters
(fn_block_lambda
  params: (fn_lambda_param
    name: (identifier) @variable))

; Function calls - capture the function name identifier
(function_call
  function: (postfix_expression
    (primary_expression
      (identifier) @function.call)))

; Member access function calls (override property highlighting)
(function_call
  function: (postfix_expression
    (member_access
      member: (identifier) @function.call)))

; Nested function calls in member access
(function_call
  arguments: (arguments
    (expression
      (postfix_expression
        (function_call
          function: (postfix_expression
            (primary_expression
              (identifier) @function.call)))))))

; Function calls in match expressions
(match_arm
  body: (expression
    (postfix_expression
      (function_call
        function: (postfix_expression
          (member_access
            member: (identifier) @function.call))))))

; Function calls in arguments to other function calls
(arguments
  (expression
    (postfix_expression
      (function_call
        function: (postfix_expression
          (primary_expression
            (identifier) @function.call))))))

; Member access for property access in specific contexts (not function calls)
; Property access in variable declarations
(variable_declaration
  value: (expression
    (postfix_expression
      (member_access
        member: (identifier) @property))))

; Property access in expression statements (standalone)
(expression_statement
  (expression
    (postfix_expression
      (member_access
        member: (identifier) @property))))

; Property access in binary expressions
(binary_expression
  (expression
    (postfix_expression
      (member_access
        member: (identifier) @property))))

; Property access in function call arguments
(arguments
  (expression
    (postfix_expression
      (member_access
        member: (identifier) @property))))

; Property access in if conditions
(if_expression
  condition: (expression
    (postfix_expression
      (member_access
        member: (identifier) @property))))

; Property access in return statements
(return_statement
  value: (expression
    (postfix_expression
      (member_access
        member: (identifier) @property))))




; Member access for object names
(member_access
  object: (postfix_expression
    (primary_expression
      (identifier) @variable)))

; ; Member access in nested chains (object side)
(member_access
  object: (postfix_expression
    (member_access
      member: (identifier) @property))) ; Like 'headers' in 'request.headers.get("Authorization")'

(lambda
                  params: (identifier )
                  body: (expression
                    (postfix_expression
                      (member_access
                        object: (postfix_expression
                          (primary_expression
                            (identifier )))
                        member: (identifier) @property))))

; Fields
(struct_field
  (identifier) @property)

; Enum variants
(enum_variant
  (identifier) @type)


; Safe keywords (excluding the problematic ones)
"fn" @keyword
"proc" @keyword
"let" @keyword
"struct" @keyword
"kind" @keyword
"end" @keyword
"if" @keyword
"else" @keyword
"then" @keyword
"do" @keyword
"pub" @keyword
"enum" @keyword
"return" @keyword
"impl" @keyword
"self" @variable.builtin
"and" @keyword
"or" @keyword
"mut" @keyword
"var" @keyword
"const" @keyword

; Pattern matching for problematic keywords in identifiers
((identifier) @keyword
 (#match? @keyword "^(break|continue|macro|while|for|in|mod|import|as|match|where)$"))

; identifier is type if it starts with a capital letter
((identifier) @type
    (#match? @type "^[A-Z]"))

"true" @constant
"false" @constant


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
; "+=" @operator
; "-=" @operator
; "*=" @operator
; "/=" @operator
; "|>" @operator
; "<-" @operator
; "@" @operator
; "~" @operator

; Punctuation
"(" @punctuation.delimiter
")" @punctuation.delimiter
; "{" @punctuation.delimiter
; "}" @punctuation.delimiter
"[" @punctuation.delimiter
"]" @punctuation.delimiter
"," @punctuation.delimiter
"." @punctuation.delimiter
":" @punctuation.delimiter
; ";" @punctuation.delimiter

; Additional highlighting for lambda arrows
"=>" @operator.lambda

; Special highlighting for return type arrows
; "->" @operator.type
