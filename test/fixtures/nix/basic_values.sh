"hello world"

"hello ${ { a = "world"; }.a }"

"1 2 ${toString 3}"

"${pkgs.bash}/bin/sh"

true, false, null, 123, 3.141

-1

/etc
./foo.png
~/.config

<nixpkgs>

''
  multi
   line
    string
''

''
  multi
   ${value}
    string
''