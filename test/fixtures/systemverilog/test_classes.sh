class Foo;
endclass

class Bar;
endclass : Bar

class Fiz extends Buz;
endclass : Fiz

class Free #(parameter type T = byte) extends Beer #(T);
endclass : Free