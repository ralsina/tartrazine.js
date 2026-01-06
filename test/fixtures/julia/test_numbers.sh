# floats
  1e1   1e+1   1e-1
1.1e1 1.1e+1 1.1e-1 .1e1 .1_1e1 1_1.1e1 1.1_1e1 1.1_11e1
1.1E1 1.1E+1 1.1E-1 .1E1 .1_1E1 1_1.1E1 1.1_1E1 1.1_11E1
1.1f1 1.1f+1 1.1f-1 .1f1 .1_1f1 1_1.1f1 1.1_1f1 1.1_11f1
1E1   1E+1   1E-1
1f1   1f+1   1f-1
.1  1.  1.1  1.1_1  1.1_11  .1_1  .1_11 1_1.1_1
# hex floats
0x1p1 0xa_bp10 0x01_ap11 0x01_abp1
0x1.1p1 0xA.Bp10 0x0.1_Ap9 0x0_1.Ap1 0x0_1.A_Bp9

# integers
1 01 10_1 10_11

# non-decimal
0xf 0xf_0 0xfff_000
0o7 0o7_0 0o777_000
0b1 0b1_0 0b111_000

# invalid in Julia - out of range values
0xg 0o8 0b2 0x1pA
# invalid in Julia - no trailing underscores
1_ 1.1_ 0xf_ 0o7_ 0b1_ 0xF_p1
# parsed as juxtaposed numeral + variable in Julia (no underscores in exponents)
1e1_1 1E1_1 1f1_1 0xfp1_1

# not floats -- range-like expression parts
1..1  ..1  1..