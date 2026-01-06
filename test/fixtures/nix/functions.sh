x: x + 1


A function that expects an integer and returns it increased by 1

x: y: x + y

(x: x + 1) 100

let inc = x: x + 1; in inc (inc (inc 100))

{ x, y }: x + y

{ x, y ? "bar" }: x + y

{ x, y, ... }: x + y

{ x, y } @ args: x + y

args @ { x, y }: x + y