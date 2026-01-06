require "./src/tartrazine"

text = File.read("/home/ralsina/code/tartrazine.js/.worktrees/tartrazine-port/test/fixtures/mason/test_handles_tags_correctly.sh")

lexer = Tartrazine.lexer("mason")
tokenizer = lexer.tokenizer(text)

tokens = [] of Tartrazine::Token
tokenizer.each do |token|
  tokens << token
end

puts "Tokens before collapse:"
tokens.each_with_index do |token, i|
  puts "  [#{i}] #{token}"
end

collapsed = Tartrazine::RegexLexer.collapse_tokens(tokens)
puts "\nTokens after collapse:"
collapsed.each_with_index do |token, i|
  puts "  [#{i}] #{token}"
end
