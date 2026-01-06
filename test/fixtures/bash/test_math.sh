# TODO: Find git dir; global options
# TODO: LIBEXECDIR or something
GIT_DIR="${GIT_DIR:-.git}"

INDEX_VERSION=2

gitsort() (
	# This will still often be wrong
	LANG=C sort
)

# Is it hacky? Hell yes. Is it POSIX? HELL YES.
write_hex() {
	hex="$1"
	while [ -n "$hex" ]
	do
		cur=$(printf "%s" "$hex" | cut -c1-2)
		next=$(printf "%s" "$hex" | cut -c3-)
		printf "\\x$(printf "%s" "$cur")"
		hex="$next"
	done
}

# Prints an integer to stdout in binary, big-endian
write_int32() (
	n="$1"
	hex=$(printf "%08X" "$n")
	write_hex "$hex"
)

write_int16() (
	n="$1"
	hex=$(printf "%04X" "$n")
	write_hex "$hex"
)

read_text() (
	path="$1"
	offs="$2"
	len="$3"
	for oct in $(od -An -txC -N"$len" -j"$offs" "$index")
	do
		printf "\x$oct"
	done
)

read_int16() (
	path="$1"
	offs="$2"
	i16=$(od -An -tdS -j"$offs" -N2 "$path" | tr -d ' ')
	i16=$((((i16>>8)&0xff) | ((i16<<8)&0xff00)))
	echo "$i16"
)

read_int32() (
	path="$1"
	offs="$2"
	i32=$(od -An -tdI -j"$offs" -N4 "$path" | tr -d ' ')
	i32=$((((i32>>24)&0xff) |
		((i32<<8)&0xff0000) |
		((i32>>8)&0xff00) |
		((i32<<24)&0xff000000)))
	echo "$i32"
)

read_hex() (
	path="$1"
	offs="$2"
	len="$3"
	od -An -txC -N"$len" -j"$offs" "$path" | tr -d ' \n'
)

normalize_path() (
	path="$1"
	path="${path#./}"
	# TODO: Remove the leading / if fully qualified
	if [ "${path#.git}" != "$path" ]
	then
		printf '%s' 'Invalid path %s\n' "$path"
		exit 1
	fi
	printf "%s" "$path"
)