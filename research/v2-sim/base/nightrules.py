import manzil_sim_cur as m

NIGHT_RULES = [
    ("plain",          dict()),
    ("ties to sky",    dict(TIERULE="sky")),
    ("no Same",        dict(SAME=False, COMBO=False)),
    ("no Combo",       dict(COMBO=False)),
    ("wrapped road",   dict(SHAPE="wrapped")),
    ("she reads deep", dict(REPLY_W=12)),
    ("Storm off",      dict(STORM_MODE="off")),
]

_KEYS = ("TIERULE", "SAME", "COMBO", "SHAPE", "REPLY_W", "STORM_MODE")


def apply_rule(d):
    old = {k: getattr(m, k) for k in _KEYS}
    for k, v in d.items():
        setattr(m, k, v)
    return old


def restore(old):
    for k, v in old.items():
        setattr(m, k, v)
