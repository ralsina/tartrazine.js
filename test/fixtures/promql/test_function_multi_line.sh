label_replace(
    sum by (instance) (
        irate(node_disk_read_bytes_total[2m])
    ) / 1024 / 1024,
    "device",
    'disk',
    "instance",
    ".*"
)