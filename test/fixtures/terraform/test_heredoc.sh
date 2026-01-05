resource "local_file" "heredoc" {
  content = <<-DOC
    heredoc content
    DOC
}

resource "local_file" "heredoc" {
  content = <<DOC
    heredoc content
    DOC
}