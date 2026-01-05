% BibTeX standard bibliography style `plain'

INTEGERS { output.state before.all }

FUNCTION {sort.format.title}
{ 't :=
"A " #2
    "An " #3
    "The " #4 t chop.word
    chop.word
chop.word
sortify
#1 global.max$ substring$
}

ITERATE {call.type$}