label_replace(
    avg by(instance)
        (irate(node_cpu_seconds_total{mode = "idle"}[5m] offset 3s)
    ) * 100,
    "device",
    "cpu",
    "instance",
    ".*"
)