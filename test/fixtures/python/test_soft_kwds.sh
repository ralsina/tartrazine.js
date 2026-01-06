match spam:
    case Some(x):
        print(f"found {x}")
    case None:
        print("found nothing")
    case _:
        assert False