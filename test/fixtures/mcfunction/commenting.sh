#> Get: #rx.playerdb:api/v2/get
#>
#> @input
#>  $in.uid rx.io
#>
#> @output
#>  rx.playerdb:io player
#
# Selects data inside the database and copies to rx.playerdb:io player
# See #api/v2/select for more info..
#
#* Note: something, something, this is important..

# Normal Comment

# This **shouldn't** be a comment..
scoreboard players operation @s obj = #fakeplayer obj

#> single line block comment
tellraw @a "This string # has # hashtags o_O"