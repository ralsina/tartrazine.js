terraform {
  backend "consul" {
    address = "demo.consul.io"
    path    = "tfdocs"
  }
}