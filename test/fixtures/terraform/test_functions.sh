provider "aws" {
  value  = file("path.txt")
}

provider "aws" {
  value = jsonencode(element("value"))
}