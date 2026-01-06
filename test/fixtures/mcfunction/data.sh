data modify storage my:storage root set value {
    key: "This NBT Compound is multiple lines",
    Count: 10b,
    tags: [
        0,
        1,
    ],
    UUID
}

tellraw @a {
    "text": "how ever",
    "color": "blue",
    "extra": [
        "this is json o_O"
    ]
}