{ x = 1; y = 2; }

{ foo.bar = 1; }

rec { x = "foo"; y = x + "bar"; }

[ "foo" "bar" "baz" ]

[ 1 2 3 ]

[ (f 1) { a = 1; b = 2; } [ "c" ] ]