[strings]
basic-string = "I'm a basic string. I can contain 'single quotes', \u0055nicode escapes \U0001f61b \U0001F61B, \"escaped\" double quotes, \n and \t more."
literal-string = 'I am literal string. Escapes like \this have no effect on me. I can contain "double quotes".'
multiline-basic-string = """
I'm a multiline basic string.
I can span several lines and contain 'single' and "double" quotes
as well as \u0055nicode escapes. Line continuations \
   work too.
"""
multiline-literal-string = '''
I'm a "multiline" 'literal' string.
Escapes like \this have no effect on me. Neither does this: \
   it is not a line continuation.'''