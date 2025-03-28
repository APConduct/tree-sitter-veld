; Keywords
"fn" @keyword
"struct" @keyword
"kind" @keyword
"impl" @keyword
"enum" @keyword
"macro" @keyword
"let" @keyword
"var" @keyword
"end" @keyword
"return" @keyword

; Comments
(comment) @comment

; Functions
(function_declaration
  name: (identifier) @function)

; Types
(type
  (identifier) @type)

(struct_declaration
  name: (identifier) @type)

(kind_declaration
  name: (identifier) @type)

; Strings
(string) @string

; Numbers
(number) @number

; Operators
["=" "+" "-" "*" "/" "==" "!=" "<" ">" "<=" ">=" "," ":" "->"] @operator

; Punctuation
["(" ")" ";" "~"] @punctuation
