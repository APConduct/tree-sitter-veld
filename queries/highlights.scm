
; ; Member access in nested chains (object side)
; (member_access
;   object: (postfix_expression
;     (member_access
;       member: (identifier) @property)))
(member_access
  object: (postfix_expression
    (member_access
      member: (identifier) @property)))

; ; Function calls in chained member access
; (member_access
