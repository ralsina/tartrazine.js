<?php
$pipe = popen( "flamegraph.pl --title=\"$title\" > /var/www/html/w/docs/flamegraph.svg", 'w' );