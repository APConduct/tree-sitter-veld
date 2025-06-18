; Definitions
(function_declaration
  name: (identifier) @definition.function)
(proc_declaration
  name: (identifier) @definition.function)
(variable_declaration
  name: (identifier) @definition.var)
(parameter
  name: (identifier) @definition.parameter)
(struct_declaration
  name: (identifier) @definition.type)
(kind_declaration
  name: (identifier) @definition.interface)
(enum_declaration
  name: (identifier) @definition.enum)
(struct_field
  name: (identifier) @definition.field)

; References
(identifier) @reference
