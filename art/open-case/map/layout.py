# The lie of Open Case's map, shared by land.py (which paints the land) and places.py (which draws the
# places, the city and the bridges on it, and writes map.json): the coast, the lake, the river, the
# roads, the paths and the railway, where each picture stands, and the noise and colour helpers both
# draw with. Everything here is in land pixels: the land is W x H, and the game shows it at SCALE
# times that size, with the pictures on it drawn at one screen pixel each (twice the land's detail).
import math
from pathlib import Path
from PIL import Image, ImageDraw

W, H = 960, 540
SCALE = 2
ROOT = Path(__file__).resolve().parents[3]  # the repo
OUT = ROOT / 'open-case' / 'assets' / 'map'

# ---------------------------------------------------------------------------------------------
# Noise and colour

def hsh(ix, iy, seed):
    """A repeatable number in [0, 1] for whole numbers ix, iy and a seed."""
    n = (int(ix) * 374761393 + int(iy) * 668265263 + seed * 2147483647) & 0xffffffff
    n = ((n ^ (n >> 13)) * 1274126177) & 0xffffffff
    return ((n ^ (n >> 16)) & 0xffff) / 65535.0

def vnoise(x, y, seed):
    ix, iy = math.floor(x), math.floor(y)
    fx, fy = x - ix, y - iy
    sx, sy = fx * fx * (3 - 2 * fx), fy * fy * (3 - 2 * fy)
    a, b = hsh(ix, iy, seed), hsh(ix + 1, iy, seed)
    c, d = hsh(ix, iy + 1, seed), hsh(ix + 1, iy + 1, seed)
    return (a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy

def fbm(x, y, seed, scale=40.0, octaves=4):
    """Smooth noise in [0, 1], its features about `scale` pixels across."""
    v, amp, tot, f = 0.0, 1.0, 0.0, 1.0 / scale
    for o in range(octaves):
        v += vnoise(x * f, y * f, seed + o * 17) * amp
        tot += amp
        amp *= 0.5
        f *= 2
    return v / tot

def mix(a, b, t):
    t = max(0.0, min(1.0, t))
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

def step(cols, t):
    """The colour of a ramp at t in [0, 1], in hard steps, for crisp pixel shading."""
    t = max(0.0, min(0.999, t))
    return cols[int(t * len(cols))]

def darker(c, k):
    return tuple(max(0, int(v * (1 - k))) for v in c[:3])

def lighter(c, k):
    return tuple(min(255, int(v + (255 - v) * k)) for v in c[:3])

def catmull(pts, n=24):
    """A smooth curve through the points, n steps between each pair."""
    out = []
    for i in range(len(pts) - 1):
        p0, p1 = pts[max(0, i - 1)], pts[i]
        p2, p3 = pts[i + 1], pts[min(len(pts) - 1, i + 2)]
        for k in range(n):
            t = k / n
            t2, t3 = t * t, t * t * t
            out.append(tuple(0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2
                                    + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3) for j in range(2)))
    out.append(pts[-1])
    return out

# ---------------------------------------------------------------------------------------------
# The land

def coast(y):
    """The western sea's edge at row y: the sea is everything left of it, widening into the bay."""
    return 70 + 26 * math.sin(y / 70) + 30 * fbm(0, y, 5, 50, 3) + (max(0, y - 380) ** 1.3) * 0.75

# The river, from the lake's waterfall down through town (north to south past the station, where the
# road and the railway cross it) and west into the bay.
RIVER = [(842, 150), (812, 186), (770, 214), (726, 240), (702, 270), (692, 300), (690, 330), (688, 360), (680, 392),
         (650, 424), (596, 446), (530, 458), (460, 466), (390, 474), (320, 482), (250, 494)]
LAKE = (838, 104, 74, 42)  # its middle and radii
ISLANDS = [(856, 98, 12, 7), (812, 112, 6, 4), (40, 150, 6, 4), (26, 330, 8, 5)]  # two in the lake, two off the coast

ROADS = [
    [(424, 438), (452, 408), (490, 370), (528, 330), (560, 298), (604, 270)],  # the market to the station
    [(404, 262), (450, 276), (490, 290), (528, 300), (560, 298)],  # the park into town
    [(604, 270), (630, 300), (650, 330), (668, 342), (692, 344), (716, 342), (744, 352), (770, 384), (790, 420)],  # over the suspension bridge
    [(404, 262), (360, 270), (300, 290), (250, 318), (200, 330), (140, 340), (90, 330)],  # the park to the coast
    [(604, 270), (626, 230), (650, 200), (650, 150), (680, 90), (720, 40), (760, -10)],  # north, past the village
    [(424, 438), (392, 446), (366, 456)],  # down to the marina
    [(790, 420), (830, 460), (870, 500), (920, 512), (970, 520)],  # out past the farm
    [(404, 262), (420, 200), (400, 140), (360, 80), (340, -10)],  # north from the park
]
PATHS = [
    [(120, 178), (150, 210), (200, 240), (250, 318)],
    [(650, 150), (700, 142), (736, 152), (758, 172)],
    [(652, 512), (682, 490), (710, 470)],
    [(84, 262), (104, 282), (140, 340)],
    [(860, 200), (900, 240), (940, 300), (970, 330)],
]
RAIL = [(970, 300), (900, 300), (830, 300), (760, 300), (712, 300), (692, 300), (672, 300), (646, 292), (622, 274), (606, 262)]

# Where each picture stands (places.py): its bottom middle and the size of the clear ground it needs,
# where no trees grow: (x, y, w, h). The music shop stands in the city on the road into town, just
# above its kerb, halfway from the park to the station, where its label fits between theirs. Your
# home stands at the west end of the first suburb's street, a bit apart from its houses, just above
# the road to the coast with its gate facing it; its clear ground is no taller than the house and its
# garden, so the woods come up close behind it. One Tree Island is the smaller of the lake's islands
# (ISLANDS[1]), drawn again over the land's.
PICTURES = {
    'park': (404, 262, 80, 50), 'station': (604, 270, 92, 52), 'market': (424, 438, 76, 44),
    'island': (812, 116, 12, 8), 'shop': (500, 284, 32, 22), 'home': (192, 323, 30, 20),
    'suburb1': (250, 318, 70, 34), 'suburb2': (790, 420, 70, 34), 'farm': (870, 500, 54, 34),
    'lighthouse': (120, 178, 26, 30), 'marina': (334, 478, 60, 26), 'village': (650, 150, 56, 30),
}
PLACES = ['park', 'station', 'market', 'island']  # the pictures that are places to busk
STOPS = PLACES + ['shop', 'home']  # the map's stops: the places to busk, the music shop, then your home
# Where the road and the railway cross the river, on bridges drawn from the side: each deck's left end
# and its length.
BRIDGES = {'suspension': (664, 344, 48), 'truss': (670, 300, 44)}
# The city's outline: its buildings spread over the land between the park, the station and the village.
CITY = [(448, 296), (446, 236), (456, 196), (480, 160), (520, 132), (566, 118), (612, 116), (642, 152), (676, 160),
        (690, 196), (682, 236), (668, 270), (652, 298), (600, 304), (520, 306)]
CITY_HEART = (604, 246)  # the towers crowd round here, by the station
CLOUDS = [('cloud1', 150, 60), ('cloud2', 750, 320), ('cloud1', 590, 45), ('cloud2', 60, 430)]  # each one's start

def in_city(x, y):
    inside = False
    for i in range(len(CITY)):
        (x1, y1), (x2, y2) = CITY[i], CITY[(i + 1) % len(CITY)]
        if (y1 > y) != (y2 > y) and x < x1 + (y - y1) * (x2 - x1) / (y2 - y1):
            inside = not inside
    return inside

def in_clearing(x, y, pad=0):
    return any(cx - w / 2 - pad <= x <= cx + w / 2 + pad and by - h - pad <= y <= by + pad for (cx, by, w, h) in PICTURES.values())

def on_bridge(x, y):
    return any(bx - 2 <= x <= bx + bl + 2 and by - 6 <= y <= by + 6 for (bx, by, bl) in BRIDGES.values())

def masks():
    """The land's masks, each an 'L' image, 255 where it is: the water (the sea, the lake with its
    islands, the river), the roads with their kerbs, the roads alone, the paths, and round the railway."""
    def mask():
        m = Image.new('L', (W, H), 0)
        return m, ImageDraw.Draw(m)
    water, wd = mask()
    for y in range(H):
        wd.line((0, y, coast(y), y), fill=255)
    river = catmull(RIVER, 30)
    for i, (x, y) in enumerate(river):
        w = 7 + 6 * i / len(river) + 2 * fbm(i, 0, 77, 14, 2)
        wd.ellipse((x - w, y - w, x + w, y + w), fill=255)
    lx, ly, lrx, lry = LAKE
    wd.polygon([(lx + lrx * (1 + 0.25 * (fbm(k, 3, 81, 5, 2) - 0.5)) * math.cos(k / 48 * 6.283),
                 ly + lry * (1 + 0.25 * (fbm(k, 3, 81, 5, 2) - 0.5)) * math.sin(k / 48 * 6.283)) for k in range(48)], fill=255)
    for (ix, iy, rx, ry) in ISLANDS:
        wd.ellipse((ix - rx, iy - ry, ix + rx, iy + ry), fill=0)
    kerb, kd = mask()
    road, rd = mask()
    for r in ROADS:
        for (x, y) in catmull(r, 40):
            kd.ellipse((x - 4, y - 4, x + 4, y + 4), fill=255)
            rd.ellipse((x - 3, y - 3, x + 3, y + 3), fill=255)
    path, pd = mask()
    for p in PATHS:
        for (x, y) in catmull(p, 40):
            pd.ellipse((x - 2, y - 2, x + 2, y + 2), fill=255)
    rail, rld = mask()
    for (x, y) in catmull(RAIL, 40):
        rld.ellipse((x - 7, y - 7, x + 7, y + 4), fill=255)
    return {'water': water, 'kerb': kerb, 'road': road, 'path': path, 'rail': rail}
