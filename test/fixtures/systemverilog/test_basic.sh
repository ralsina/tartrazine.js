// Adder flops the sum of its inputs
module Adder #(
    parameter int N = 42
) (
    output logic [N-1:0] y,
    output logic         co,

    input  logic [N-1:0] a,
    input  logic [N-1:0] b,
    input  logic         ci,

    input  logic clk
);
    always_ff @(posedge clk) begin
        {co, y} <= a + b + ci;
    end
endmodule : Adder