include <threads.scad>

/*
   Multiline comment
*/

egg(1500);

// Single line comment
// TODO: add a line

module egg(length, start=-1000, end=-1000) {
    rotate_extrude()
    translate([0, -length/2, 0])
    rotate([0, 0, 90])
    polygon(egg_half_poly(
        length,
        start == -1000 ? 0 : start,
        end == -1000 ? length : end
    ));
}

function egg_half_poly(length, start, end) =
    concat(
    [[start, 0]],
        [for (x=[start : (release ? 0.5 : 1) : end]) [x, egg_eq(x - length/2, length)]],
        [[end, 0]]
    );

function egg_eq(x, length) =
    length / 1.25 / 2 * sqrt(
        (length * length - 4 * x * x) /
        (length * length + 8 * egg_w * x + 4 * egg_w * egg_w)
    );