resource "aws_internet_gateway" "base_igw" {
  vpc_id = aws_vpc.something.id
  tags = {
    Name = "igw-${var.something}-${var.something}"
  }
}

resource "aws_security_group" "allow_tls" {
  name        = "allow_tls"
  description = "Allow TLS inbound traffic"
  vpc_id      = aws_vpc.main.id

  # Ingress rules
  ingress {
    description = "TLS from VPC"
    from_port   = 443
    to_port     = 443
  }

  # Egress rules
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "allow_tls"
  }
}