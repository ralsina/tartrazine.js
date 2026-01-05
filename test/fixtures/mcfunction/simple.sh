#> This command looks for a player with 10 hp and prints a message
# @param - @s = player

execute as @a[name="rx", nbt={Health: 10.0f}] run tellraw @a {"text": "this is my cool command"}  # epic