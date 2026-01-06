"global function"
"An $interpolated variable"
"An $(a + 1) expression"
"""a"""
"""
global function
de e f
"inner string"
"""
raw"\\ a \" $interp $(1 + 1) \""
raw"""
"inner string"
$interp
$(1 + 1)
"""
# commented "string"

@sprintf "%0.2f" var
v"1.0"
var"#nonstandard#"

r"^[abs]+$"m
arbi"trary"suff
arbi"trary"1234

`global function`
`abc \` \$ $interpolated`
`abc $(a + 1)`
```a```
```
global function
"thing" ` \$
`now` $(now())
```
# commented `command`

arbi`trary`suff
arbi`trary`1234