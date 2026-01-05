let
  bar = "bar";
in {
  foo.${bar} = 3;
  foo.${bar + "bar"} = 3;
}