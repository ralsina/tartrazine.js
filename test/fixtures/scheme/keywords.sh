(define* (foo #:key (bar123? 'baz))
  (display bar123?)
  (newline))

(foo #:bar123? 'xyz)