description = "Some description"

  availability_zones = ["${aws_instance.web.availability_zone}-foobar"]
  availability_zones = [aws_instance.web.availability_zone]
  assume_role_policy = data.aws_iam_policy_document.trust.json
  policy_arn = aws_iam_policy.assume_roles[0].arn

  value  = file("path.txt")
  value = jsonencode(element("value"))

  tags = {
    Name = "something"
  }

  "ENV_VARIABLE_1" = aws_dynamodb_table.loginsights2metrics.name
  "ENV_VARIABLE_2" = "Some string"

  ignore_changes = [last_modified, filename]

  variable = "aws:MultiFactorAuthPresent"