backend "consul" {
data "aws_ami" "example" {
module "consul" {
output "instance_ip_addr" {
provider "aws" {
provisioner "local-exec" {
resource "aws_internet_gateway" "base_igw" {
variable "aws_region" {
variable "set-str" {
  type = set(string)
}