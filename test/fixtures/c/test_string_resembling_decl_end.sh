// This should not be recognized as a function declaration followed by
// garbage.
string xyz(");");

// This should not be recognized as a function definition.

string xyz("){ }");