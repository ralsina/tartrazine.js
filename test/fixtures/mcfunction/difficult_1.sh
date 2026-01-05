# execute as @e[nbt={ Item: {id: "minecraft:diamond", Count: 64 } }] run
# setblock ~ ~ ~ minecraft:dispenser[facing=up]{Items: [{id: "minecraft:diamond", Count: 1}]}
# tellraw @a [{"text": "hello", "color": "blue"}, {"text": "world", "color": "blue"}]

execute as @a[advancements={minecraft:story/form_obsidian={foo=true, bar=false},minecraft:story/follow_ender_eye={foo=false, bar=true}}] run