\documentclass{article}

% Comment

\ExplSyntaxOn
    \@@_command:nTF { a } { b } { c }
\ExplSyntaxOff

\makeatletter
\def\example@command{example}
\makeatother

\begin{document}

text \LaTeX: text \

text \example{}[] text \\

text \example text. ``quote''; \123\% and: text.

$\alpha_i\in\{\alpha:\alpha\leq3\}\ \text{something}$

\end{document}