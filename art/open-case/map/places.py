# Draws the pictures that stand on Open Case's map, at one screen pixel each (twice the land's detail,
# as Nathan's reference draws its towns), and writes where everything goes:
#   the four places to busk: the park (a ring of trees round a lawn, a pond, the bandstand), the station
#     (the glass train shed, its brick front and clock tower, a limestone forecourt with a fountain),
#     the night market (striped stalls under lanterns on warm brick, townhouses behind, a boardwalk) and
#     One Tree Island (the lake's smaller island again, its one pine, a rowboat pulled up on its shore);
#   the music shop, on the road into town between the park and the station (a flat over a shopfront
#     with a striped awning and a guitar in its lit window);
#   your home, at the west end of the first suburb's street (a cottage with lit windows, smoke from its
#     chimney and a front garden, a sign with a gold note by its gate);
#   the city, in loose clusters over the land between the park, the station and the village: towers by
#     the station, flats further out, houses at the edges, trees in the gaps;
#   the settlements without a name: a village with a church, two suburbs, a farm, a lighthouse, a marina;
#   the bridges, seen from the side: a red suspension bridge for the road, two arched steel spans for
#     the railway; and two clouds.
# Run from the repo root after land.py (Python 3 with Pillow):
#   python3 art/open-case/map/places.py
# Writes open-case/assets/map/<picture>.png and map.json:
#   size      [w, h]: the map in screen pixels (the land at SCALE times its size)
#   land      the land's picture
#   pictures  [{ name, x, y }]: each picture's top left, in the order they're drawn (the city first)
#   places    { id: { name, pin: [x, y], label: [x, y], view: [x, y] } }: each of the map's stops (the
#             places to busk, the music shop, then your home): its name, where its gold pin points (just
#             over its picture's top), where its label hangs (under it), and the point the view centres
#             on when it's chosen
#   clouds    [{ name, x, y }]: where each cloud starts, drawn at SCALE times its size
# It's deterministic: an unchanged script writes the same bytes.
import json, math
import sys
from PIL import Image, ImageDraw
sys.dont_write_bytecode = True  # no __pycache__ beside the scripts
from layout import (W, H, SCALE, OUT, hsh, mix, step, darker, lighter, PICTURES, STOPS, BRIDGES, CITY, CITY_HEART, CLOUDS,
                    in_city, masks)

LEAF = [(16, 40, 36), (24, 58, 44), (34, 80, 50), (50, 104, 54), (76, 130, 58), (114, 156, 66), (158, 182, 86)]
PINE = [(12, 34, 34), (18, 50, 44), (26, 68, 54), (38, 90, 64), (60, 116, 72), (92, 140, 82)]
WALLS = [(222, 200, 166), (204, 160, 124), (234, 222, 200), (178, 126, 100), (210, 202, 186), (196, 176, 146), (232, 196, 150)]
ROOFS = [(162, 72, 58), (184, 96, 66), (112, 106, 112), (132, 82, 62), (96, 100, 118), (150, 62, 70)]
GLASS = [((106, 152, 176), (64, 104, 132)), ((134, 162, 172), (86, 112, 128)), ((80, 132, 150), (50, 92, 112)), ((150, 170, 190), (100, 116, 140))]


class Canvas:
    """A picture with see-through ground, and the few ways it's drawn on."""

    def __init__(self, w, h):
        self.w, self.h = w, h
        self.img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        self.P = self.img.load()
        self.d = ImageDraw.Draw(self.img)

    def put(self, x, y, c):
        x, y = int(x), int(y)
        if 0 <= x < self.w and 0 <= y < self.h:
            self.P[x, y] = c if len(c) == 4 else (c[0], c[1], c[2], 255)

    def get(self, x, y):
        x, y = int(x), int(y)
        return self.P[x, y] if 0 <= x < self.w and 0 <= y < self.h else (0, 0, 0, 0)

    def shade(self, x, y, k=0.32):
        """A shadow: darker where something's drawn, a soft dark where nothing is (on the land)."""
        x, y = int(x), int(y)
        if 0 <= x < self.w and 0 <= y < self.h:
            c = self.P[x, y]
            if c[3] == 0:
                self.P[x, y] = (10, 24, 14, 90)
            elif c[3] < 255:
                self.P[x, y] = (c[0], c[1], c[2], min(255, c[3] + 40))
            else:
                self.P[x, y] = darker(c, k) + (255,)

    def rect(self, x0, y0, x1, y1, c):
        self.d.rectangle((x0, y0, x1, y1), fill=c)

    def poly(self, pts, c):
        self.d.polygon(pts, fill=c)

    def line(self, pts, c):
        self.d.line(pts, fill=c)

    def oval(self, x0, y0, x1, y1, c):
        self.d.ellipse((x0, y0, x1, y1), fill=c)


# ---------------------------------------------------------------------------------------------
# The kit

def tree(cv, cx, cy, r, seed, kind='leaf'):
    """A tree standing at (cx, cy): a pine, or a round crown of overlapping blobs lit from the top left."""
    for y in range(int(cy - r * 0.5), int(cy + r * 0.5) + 2):
        for x in range(int(cx - r * 0.2), int(cx + r * 1.9)):
            dx, dy = (x - (cx + r * 0.75)) / (r * 1.15), (y - cy) / (r * 0.5)
            if dx * dx + dy * dy <= 1:
                cv.shade(x, y)
    if kind == 'pine':
        top = cy - r * 2.8
        for y in range(int(top), int(cy) + 1):
            k = (y - top) / (cy - top)
            tier = ((y - int(top)) % 5) / 5
            half = max(0.6, r * (0.25 + k * 0.75) * (0.75 + tier * 0.35))
            for x in range(int(cx - half), int(cx + half) + 1):
                t = 0.7 - (x - cx) / (half + 1) * 0.4 - tier * 0.25 - k * 0.15 + (hsh(x, y, seed) - 0.5) * 0.2
                cv.put(x, y, PINE[0] if x >= int(cx + half) or y == int(cy) else step(PINE, t))
        return
    cv.rect(int(cx), int(cy - r * 0.6), int(cx) + 1, int(cy), (78, 52, 34))
    blobs = []
    for k in range(4 + int(hsh(seed, 1, 92) * 3)):
        a, d = hsh(k, seed, 91) * 6.28, 0 if k == 0 else r * 0.5
        blobs.append((cx + math.cos(a) * d, cy - r * 1.15 + math.sin(a) * d * 0.7, r * (1 if k == 0 else 0.5 + hsh(k, seed, 93) * 0.25)))
    def inside(x, y):
        best = None
        for (bx, by, br) in blobs:
            if (x - bx) ** 2 + (y - by) ** 2 <= br * br and (best is None or by > best[1]):
                best = (bx, by, br)
        return best
    for y in range(int(cy - r * 2.7), int(cy) + 1):
        for x in range(int(cx - r * 1.7), int(cx + r * 1.7) + 1):
            b = inside(x + 0.5, y + 0.5)
            if not b:
                continue
            bx, by, br = b
            t = 0.6 - ((x - bx) * 0.45 + (y - by) * 0.75) / br * 0.45 + (hsh(x, y, seed) - 0.5) * 0.2
            if not inside(x + 1.5, y + 0.5) or not inside(x + 0.5, y + 1.5):
                c = LEAF[0]
            elif not inside(x - 0.5, y - 0.5):
                c = LEAF[min(6, int(t * 7) + 1)]
            else:
                c = step(LEAF, t)
            cv.put(x, y, c)


def building(cv, x, y, w, h, d, wall, roof, roofkind='gable', win=(52, 50, 62), lit=0.25, seed=1, floors=None, door=True):
    """A building seen from the front and above at a slant: its front's bottom left at (x, y), w wide,
    h tall to the eaves, d deep (going up and right at 45 degrees, half length), its shadow cast to the
    lower right; a 'gable' roof (ridge along the front, with a chimney now and then) or a 'flat' one
    (with a box on top); windows in rows on its front and side, some lit."""
    dx = d // 2
    side = darker(wall, 0.3)
    rise = max(3, int(w * 0.35)) if roofkind == 'gable' else 0
    for yy in range(y - dx, y + 3):
        for xx in range(x + w, x + w + dx + int(h * 0.6) + 2):
            if xx - (x + w) <= (yy - (y - dx)) + int(h * 0.6):
                cv.shade(xx, yy)
    cv.rect(x, y - h, x + w - 1, y, wall)
    cv.poly([(x + w, y - h), (x + w + dx, y - h - dx), (x + w + dx, y - dx), (x + w, y)], side)
    for yy in range(y - h + 2, y, 3):
        cv.line([(x, yy), (x + w - 1, yy)], darker(wall, 0.06))
    fl = floors or max(1, (h - 2) // 5)
    fh = (h - 2) / fl
    for f in range(fl):
        wy = int(y - h + 2 + f * fh + 1)
        for wx in range(x + 2, x + w - 3, 4):
            cv.rect(wx, wy, wx + 1, wy + 1, (252, 216, 128) if hsh(wx, wy, seed) < lit else win)
            cv.put(wx, wy + 2, lighter(wall, 0.3))
        for k in range(2, dx - 1, 4):
            c = (226, 190, 110) if hsh(k, wy, seed + 1) < lit else darker(win, 0.15)
            cv.put(x + w + k, wy - k + 1, c)
            cv.put(x + w + k, wy - k + 2, c)
    if door and h >= 7:
        cv.rect(x + w // 2 - 1, y - 4, x + w // 2 + 1, y - 1, darker(wall, 0.55))
    if roofkind == 'gable':
        ridge = y - h - rise - dx // 2
        cv.poly([(x - 1, y - h), (x + w, y - h), (x + w + dx // 2, ridge), (x - 1 + dx // 2, ridge)], roof)
        cv.poly([(x - 1 + dx // 2, ridge), (x + w + dx // 2, ridge), (x + w + dx, y - h - dx), (x + dx - 1, y - h - dx)], darker(roof, 0.28))
        cv.poly([(x + w, y - h), (x + w + dx, y - h - dx), (x + w + dx // 2, ridge)], side)
        for yy in range(ridge + 2, y - h, 2):
            x0 = x - 1 + dx // 2 * (1 - (yy - ridge) / (rise + dx // 2))
            cv.line([(x0, yy), (x0 + w + 1, yy)], darker(roof, 0.12))
        cv.line([(x - 1 + dx // 2, ridge), (x + w + dx // 2, ridge)], lighter(roof, 0.3))
        cv.line([(x - 1, y - h), (x + w, y - h)], darker(roof, 0.4))
        if hsh(x, y, seed + 7) < 0.6:
            ch = x + w - 4
            cv.rect(ch, y - h - rise - 3, ch + 1, y - h - rise + 1, (120, 80, 64))
            cv.put(ch, y - h - rise - 3, (150, 104, 84))
    else:
        cv.poly([(x, y - h), (x + w - 1, y - h), (x + w - 1 + dx, y - h - dx), (x + dx, y - h - dx)], roof)
        cv.line([(x, y - h), (x + w - 1, y - h)], lighter(roof, 0.35))
        cv.line([(x + w - 1, y - h), (x + w - 1 + dx, y - h - dx)], lighter(roof, 0.2))
        if w > 9:
            bx = x + 3 + int(hsh(x, y, seed + 9) * (w - 9))
            cv.rect(bx + dx // 2, y - h - dx // 2 - 3, bx + dx // 2 + 3, y - h - dx // 2, lighter(roof, 0.15))
    cv.line([(x, y), (x + w - 1, y)], darker(wall, 0.5))


def tower(cv, x, y, w, h, seed, glass):
    """A tower: glass with mullions running up it, or stone."""
    if glass:
        wall, roof = GLASS[int(hsh(x, y, 7) * 4) % 4]
        building(cv, x, y, w, h, 10, wall, roof, 'flat', win=roof, lit=0.3, seed=seed, floors=h // 6, door=False)
        for xx in range(x + 1, x + w - 1, 3):
            cv.line([(xx, y - h + 1), (xx, y - 1)], lighter(wall, 0.12))
    else:
        building(cv, x, y, w, h, 10, WALLS[int(hsh(x, y, 8) * 7) % 7], (110, 104, 110), 'flat', win=(70, 64, 74), lit=0.3, seed=seed, floors=h // 6, door=False)


def person(cv, x, y, i):
    skin = [(236, 196, 160), (190, 136, 100), (150, 100, 70), (110, 70, 50)][i % 4]
    shirt = [(200, 64, 70), (60, 110, 170), (240, 220, 180), (50, 140, 120), (230, 180, 70), (150, 90, 160), (60, 60, 70)][i % 7]
    cv.put(x + 1, y + 1, (0, 0, 0, 60))
    cv.put(x + 2, y + 1, (0, 0, 0, 60))
    cv.put(x, y - 4, (60, 40, 30) if i % 3 else (220, 200, 140))
    cv.put(x, y - 3, skin)
    for yy in (y - 2, y - 1):
        cv.put(x, yy, shirt)
        cv.put(x + 1, yy, darker(shirt, 0.25))
    cv.put(x, y, (50, 46, 60))
    cv.put(x + 1, y, (40, 36, 50))


def lamp(cv, x, y):
    cv.line([(x, y - 9), (x, y)], (44, 40, 48))
    for dx, c in ((-1, (252, 222, 130)), (0, (255, 246, 210)), (1, (252, 222, 130))):
        cv.put(x + dx, y - 10, c)
    cv.put(x, y - 11, (44, 40, 48))
    cv.put(x + 1, y + 1, (0, 0, 0, 60))


def bench(cv, x, y):
    cv.line([(x, y - 1), (x + 5, y - 1)], (168, 118, 72))
    cv.line([(x, y), (x + 5, y)], (128, 86, 52))
    cv.put(x, y + 1, (52, 40, 36))
    cv.put(x + 5, y + 1, (52, 40, 36))


def ground(cv, cx, cy, rx, ry, cols, seed):
    """An oval of ground, ragged at its edge: cols(x, y, d) the colour at each pixel, d 0 in the middle
    to 1 at the edge."""
    for y in range(int(cy - ry), int(cy + ry) + 1):
        for x in range(int(cx - rx), int(cx + rx) + 1):
            dx, dy = (x - cx) / rx, (y - cy) / ry
            d = dx * dx + dy * dy + (hsh(x, y, seed) - 0.5) * 0.12
            if d <= 1:
                cv.put(x, y, cols(x, y, d))


def back_to_front(items):
    for _, _, f in sorted(items, key=lambda t: (t[0], t[1])):
        f()

# ---------------------------------------------------------------------------------------------
# The places

def park():
    cv = Canvas(170, 120)
    cx, cy = 85, 76
    ground(cv, cx, cy, 80, 40, lambda x, y, d: ((128, 172, 70) if ((x - y // 2) // 6) % 2 else (116, 162, 64)) if d < 0.9 else (60, 110, 54), 3)
    for t in range(200):  # the gravel paths
        k = t / 200
        x, y = 10 + k * 150, cy + 10 * math.sin(k * 5) - 4
        cv.rect(x - 1, y - 1, x + 1, y + 1, (206, 182, 136))
        x2, y2 = cx + 30 * math.sin(k * 3) - 10, 40 + k * 76
        if 38 < y2 < 114:
            cv.rect(x2 - 1, y2 - 1, x2 + 1, y2 + 1, (206, 182, 136))
    ground(cv, 50, 92, 22, 10, lambda x, y, d: (196, 186, 156) if d > 0.8 else step([(40, 120, 160), (56, 146, 172), (86, 172, 182)], 0.9 - d + (hsh(x, y, 5) - 0.5) * 0.3), 5)
    for (x, y) in ((42, 90), (56, 94)):  # ducks on the pond
        cv.put(x, y, (250, 250, 240))
        cv.put(x + 1, y, (250, 250, 240))
        cv.put(x + 2, y - 1, (240, 180, 60))
    for (bx, by) in ((112, 96), (26, 66), (128, 66)):  # flower beds
        for y in range(by, by + 4):
            for x in range(bx, bx + 14):
                cv.put(x, y, [(222, 84, 92), (248, 212, 98), (240, 240, 220), (214, 120, 176)][(x + y * 3) % 4] if (x + y) % 2 else (64, 108, 50))
    bx, by = 106, 74  # the bandstand
    for y in range(by - 4, by + 6):
        for x in range(bx + 4, bx + 22):
            cv.shade(x, y)
    cv.oval(bx - 13, by - 3, bx + 13, by + 5, (214, 206, 190))
    cv.oval(bx - 12, by - 2, bx + 12, by + 3, (226, 220, 206))
    for px in (bx - 10, bx - 5, bx, bx + 5, bx + 10):
        cv.line([(px, by - 12), (px, by + 1)], (246, 242, 230))
    cv.poly([(bx - 15, by - 12), (bx, by - 24), (bx + 15, by - 12), (bx, by - 8)], (186, 70, 64))
    cv.poly([(bx, by - 24), (bx + 15, by - 12), (bx, by - 8)], (142, 48, 52))
    cv.line([(bx - 15, by - 12), (bx, by - 8), (bx + 15, by - 12)], (244, 232, 206))
    cv.rect(bx, by - 27, bx, by - 24, (240, 200, 90))
    items = []
    for k in range(34):  # the ring of trees, open at the front
        a = k / 34 * 6.283
        x, y = cx + math.cos(a) * 76 + (hsh(k, 1, 7) - 0.5) * 6, cy + math.sin(a) * 36 + (hsh(k, 2, 7) - 0.5) * 4
        if not (60 < x < 112 and y > 100):
            items.append((y, k, lambda x=x, y=y, k=k: tree(cv, x, y, 5 + hsh(k, 3, 7) * 3, k * 13, 'pine' if k % 7 == 0 else 'leaf')))
    for k, (x, y) in enumerate(((60, 62), (84, 58), (140, 84), (20, 82), (72, 70))):
        items.append((y, 100 + k, lambda x=x, y=y, k=k: tree(cv, x, y, 6, k * 7 + 100)))
    for k, (x, y) in enumerate(((40, 78), (90, 84), (126, 78), (66, 100))):
        items.append((y, 200 + k, lambda x=x, y=y: lamp(cv, x, y)))
    for k, (x, y) in enumerate(((70, 80), (118, 86))):
        items.append((y, 300 + k, lambda x=x, y=y: bench(cv, x, y)))
    for i in range(14):
        x, y = 20 + int(hsh(i, 1, 9) * 130), 70 + int(hsh(i, 2, 9) * 36)
        items.append((y, 400 + i, lambda x=x, y=y, i=i: person(cv, x, y, i)))
    back_to_front(items)
    return cv


def station():
    cv = Canvas(124, 106)
    def limestone(x, y, d):  # the forecourt's pale slabs
        if d > 0.9:
            return (190, 180, 158)
        row = y // 3
        joint = y % 3 == 0 or (x + (row % 2) * 4) % 8 == 0
        return (172, 160, 136) if joint else mix((222, 212, 186), (234, 226, 204), hsh(x // 8, row, 14))
    ground(cv, 58, 94, 56, 10, limestone, 13)
    x, y, w, h, d = 16, 88, 80, 13, 38
    dx = d // 2
    for yy in range(y - dx, y + 4):
        for xx in range(x + w, x + w + 20):
            if xx - (x + w) <= yy - (y - dx) + 9:
                cv.shade(xx, yy)
    top = y - h
    tx0, ty = x + w + 2, top - dx + 13  # the train coming out of the shed's far end
    cv.rect(tx0, ty - 4, 123, ty + 2, (40, 150, 140))
    cv.line([(tx0, ty - 4), (123, ty - 4)], (206, 228, 222))
    cv.line([(tx0, ty + 2), (123, ty + 2)], (26, 100, 96))
    for wx in range(tx0 + 2, 123, 4):
        cv.rect(wx, ty - 2, wx + 1, ty - 1, (250, 222, 140))
    R = dx + 10  # the glass roof: a barrel vault seen from above at a slant, lit along its crown
    for k in range(R):
        t = k / R
        c = mix((150, 196, 206), (230, 242, 238), t * 2) if t < 0.5 else mix((230, 242, 238), (110, 160, 178), (t - 0.5) * 2)
        sx = x + int(k * 0.5)
        cv.line([(sx, top - k), (sx + w, top - k)], c)
    for rx in range(x, x + w + 1, 6):
        cv.line([(rx, top), (rx + R // 2, top - R)], (64, 68, 82))
    cv.line([(x + R // 2, top - R), (x + w + R // 2, top - R)], (64, 68, 82))
    cv.poly([(x + w, top), (x + w + R // 2, top - R), (x + w + R // 2, top - dx + 2), (x + w, y)], (126, 74, 56))
    cv.rect(x, top, x + w, y, (166, 96, 70))  # the brick front, its arched windows lit
    for yy in range(top + 2, y, 2):
        cv.line([(x, yy), (x + w, yy)], (150, 86, 62))
        for xx in range(x + (yy % 4), x + w, 4):
            cv.put(xx, yy, (140, 80, 58))
    for ax in range(x + 4, x + w - 6, 10):
        cv.poly([(ax, y - 1), (ax, top + 5), (ax + 2, top + 3), (ax + 3, top + 3), (ax + 5, top + 5), (ax + 5, y - 1)], (48, 42, 54))
        cv.poly([(ax + 1, y - 2), (ax + 1, top + 6), (ax + 2, top + 4), (ax + 3, top + 4), (ax + 4, top + 6), (ax + 4, y - 2)], (236, 196, 116))
    cv.line([(x, top), (x + w, top)], (222, 200, 170))
    cv.line([(x, top + 1), (x + w, top + 1)], (196, 170, 140))
    tx, tw, th = 50, 12, 48  # the clock tower
    for yy in range(y - 8, y + 3):
        for xx in range(tx + tw + 4, tx + tw + 13):
            cv.shade(xx, yy)
    cv.rect(tx, y - th, tx + tw, y, (222, 200, 164))
    cv.poly([(tx + tw, y - th), (tx + tw + 5, y - th - 5), (tx + tw + 5, y - 5), (tx + tw, y)], (176, 152, 122))
    for yy in range(y - th + 2, y, 3):
        cv.line([(tx, yy), (tx + tw, yy)], (210, 186, 150))
    cv.poly([(tx - 2, y - th), (tx + tw // 2 + 2, y - th - 12), (tx + tw + 7, y - th - 5), (tx + tw + 2, y - th)], (162, 72, 58))
    cv.poly([(tx + tw // 2 + 2, y - th - 12), (tx + tw + 7, y - th - 5), (tx + tw + 2, y - th)], (118, 50, 44))
    cv.rect(tx + tw // 2 + 1, y - th - 15, tx + tw // 2 + 1, y - th - 12, (60, 50, 50))
    cv.oval(tx + 2, y - th + 4, tx + 10, y - th + 12, (64, 54, 54))
    cv.oval(tx + 3, y - th + 5, tx + 9, y - th + 11, (252, 248, 232))
    cv.line([(tx + 6, y - th + 8), (tx + 6, y - th + 6)], (40, 34, 40))
    cv.line([(tx + 6, y - th + 8), (tx + 8, y - th + 8)], (40, 34, 40))
    for wy in range(y - th + 16, y - 8, 6):
        cv.rect(tx + 5, wy, tx + 7, wy + 3, (236, 196, 116))
        cv.line([(tx + 5, wy), (tx + 7, wy)], (90, 70, 60))
    cv.rect(tx + 4, y - 7, tx + 8, y, (52, 44, 54))
    cv.rect(tx + 5, y - 6, tx + 7, y, (90, 60, 50))
    def taxi(cx, cy):
        cv.rect(cx, cy - 2, cx + 6, cy, (246, 200, 66))
        cv.rect(cx + 2, cy - 4, cx + 4, cy - 2, (250, 214, 90))
        cv.rect(cx + 2, cy - 3, cx + 4, cy - 3, (90, 110, 130))
        cv.put(cx + 1, cy + 1, (30, 30, 34))
        cv.put(cx + 5, cy + 1, (30, 30, 34))
    def fountain():
        fx, fy = 58, 100
        cv.oval(fx - 8, fy - 3, fx + 8, fy + 3, (150, 142, 128))
        cv.oval(fx - 7, fy - 2, fx + 7, fy + 2, (70, 150, 176))
        cv.oval(fx - 4, fy - 1, fx + 4, fy + 1, (96, 178, 196))
        cv.rect(fx, fy - 6, fx, fy, (200, 192, 176))
        for (ddx, ddy) in ((-2, -8), (0, -9), (2, -8), (-4, -5), (4, -5)):
            cv.put(fx + ddx, fy + ddy, (226, 244, 250))
    def planter(px, py):
        cv.rect(px, py - 2, px + 6, py, (120, 112, 104))
        cv.line([(px, py - 2), (px + 6, py - 2)], (160, 152, 140))
        for xx in range(px + 1, px + 6):
            cv.put(xx, py - 3, [(220, 70, 80), (64, 120, 60), (246, 206, 90)][xx % 3])
    items = [(101, 0, fountain)]
    for k, (cx, cy) in enumerate(((22, 96), (34, 98), (86, 96), (98, 99))):
        items.append((cy, 10 + k, lambda cx=cx, cy=cy: taxi(cx, cy)))
    for i in range(16):
        px, py = 18 + int(hsh(i, 1, 21) * 84), 90 + int(hsh(i, 2, 21) * 10)
        items.append((py, 20 + i, lambda px=px, py=py, i=i: person(cv, px, py, i)))
    for k, (px, py) in enumerate(((6, 102), (118, 102), (3, 84))):
        items.append((py, 40 + k, lambda px=px, py=py: tree(cv, px, py, 5, px)))
    for k, (px, py) in enumerate(((44, 102), (74, 102))):
        items.append((py, 50 + k, lambda px=px, py=py: lamp(cv, px, py)))
    for k, (px, py) in enumerate(((10, 94), (100, 94))):
        items.append((py, 60 + k, lambda px=px, py=py: planter(px, py)))
    back_to_front(items)
    return cv


AWNINGS = [((210, 62, 70), (246, 238, 222)), ((40, 150, 140), (246, 238, 222)), ((248, 200, 80), (204, 120, 60)), ((216, 110, 150), (246, 238, 222)), ((70, 110, 180), (246, 238, 222))]

def market():
    cv = Canvas(170, 122)
    def brick(x, y, d):  # warm brick in a herringbone, brighter under the lanterns; a boardwalk along the water
        if y >= 114:
            plank = (x + (y // 2) * 7) % 12 == 0 or y % 2 == 1
            return (92, 60, 38) if plank and y % 2 == 1 else mix((150, 104, 64), (176, 128, 82), hsh(x // 6, y // 2, 35))
        block = ((x // 4) + (y // 4)) % 2
        joint = (y % 2 == 0 or (x + (y // 2) * 2) % 4 == 0) if block == 0 else (x % 2 == 0 or (y + (x // 2) * 2) % 4 == 0)
        c = (112, 60, 46) if joint else mix((176, 96, 70), (196, 116, 84), hsh(x // 2, y // 2, 34))
        return mix(c, (246, 196, 120), max(0, 1 - ((x - 85) / 70) ** 2 - ((y - 100) / 12) ** 2) * 0.35)
    ground(cv, 85, 94, 82, 24, brick, 33)
    x, k = 8, 0  # the townhouses along the back
    while x < 150:
        w, h = 14 + int(hsh(k, 1, 41) * 6), 22 + int(hsh(k, 2, 41) * 12)
        building(cv, x, 78, w, h, 12, WALLS[k % len(WALLS)], ROOFS[(k * 2) % len(ROOFS)], 'gable', lit=0.45, seed=k + 50, floors=3 + (h > 28))
        x, k = x + w + 1, k + 1
    def stall(x, y, k):
        a, b = AWNINGS[k % len(AWNINGS)]
        goods = [(244, 204, 82), (214, 72, 62), (124, 186, 82), (240, 150, 60)]
        for yy in range(y - 3, y + 3):
            for xx in range(x + 12, x + 17):
                cv.shade(xx, yy)
        cv.rect(x, y - 5, x + 13, y, (146, 100, 62))
        cv.line([(x, y), (x + 13, y)], (100, 66, 42))
        for xx in range(x + 1, x + 13, 2):
            cv.put(xx, y - 4, goods[(xx + k) % 4])
            cv.put(xx, y - 3, goods[(xx + k + 1) % 4])
        cv.line([(x, y - 12), (x, y - 5)], (90, 64, 44))
        cv.line([(x + 13, y - 12), (x + 13, y - 5)], (90, 64, 44))
        for xx in range(x - 1, x + 15):
            for yy in range(y - 14, y - 8):
                cv.put(xx, yy, a if ((xx - x + 1) // 2) % 2 == 0 else b)
        for xx in range(x - 1, x + 15, 2):
            cv.put(xx, y - 8, a)
        cv.line([(x - 1, y - 14), (x + 14, y - 14)], lighter(a, 0.3))
    def lanterns():
        for row in (92, 100):
            for x in range(6, 164):
                yy = row + int(4 * abs(((x - 6) % 30) - 15) / 15)
                cv.put(x, yy, (70, 56, 54))
                if (x - 6) % 5 == 0:
                    c = [(255, 214, 96), (244, 100, 84), (246, 156, 176)][(x // 5) % 3]
                    cv.put(x, yy + 1, c)
                    cv.put(x, yy + 2, c)
                    cv.put(x + 1, yy + 1, darker(c, 0.2))
                    cv.put(x + 1, yy + 2, darker(c, 0.25))
                    cv.put(x, yy + 3, (255, 240, 200, 120))
    def steam():
        for k in range(6):
            sx, sy = 20 + int(3 * math.sin(k * 1.4)), 70 - k * 6
            cv.oval(sx - 2 - k * 0.4, sy - 1.5, sx + 2 + k * 0.4, sy + 1.5, (240, 240, 236, 200 - k * 25))
    def posts():
        for x in range(12, 160, 12):
            cv.rect(x, 116, x + 1, 120, (84, 56, 36))
            cv.put(x, 115, (176, 128, 82))
        cv.line([(8, 116), (162, 116)], (120, 84, 52))
    items = [(79, 0, steam), (101, 1, lanterns), (121, 2, posts)]
    for k, x in enumerate(range(12, 150, 20)):
        items.append((88, 10 + k, lambda x=x, k=k: stall(x, 88, k)))
        items.append((110, 30 + k, lambda x=x, k=k: stall(x + 8, 110, k + 2)))
    for i in range(40):
        x, y = 8 + int(hsh(i, 1, 51) * 154), 90 + int(hsh(i, 2, 51) * 22)
        items.append((y, 50 + i, lambda x=x, y=y, i=i: person(cv, x, y, i)))
    back_to_front(items)
    return cv


def shop():
    """The music shop on the road into town: a flat over a shopfront, its sign board with a gold note,
    a striped awning over the door and a lit window with a guitar standing in it; a bit of pavement in
    front, with a sandwich board, a lamp and a tree at each end. A little bigger than a city house."""
    cv = Canvas(72, 56)
    def slabs(x, y, d):  # the pavement's pale slabs, like the station's forecourt but smaller
        if d > 0.88:
            return (184, 174, 154)
        row = y // 3
        joint = y % 3 == 0 or (x + (row % 2) * 3) % 6 == 0
        return (170, 158, 136) if joint else mix((216, 206, 182), (230, 222, 200), hsh(x // 6, row, 64))
    ground(cv, 34, 49, 30, 5, slabs, 63)
    x, y, w, h = 21, 46, 24, 25  # the front's bottom left, its width and its height to the eaves
    wall, GREEN, GOLD = (234, 222, 200), (34, 78, 64), (252, 208, 98)
    def house():
        building(cv, x, y, w, h, 12, wall, (96, 100, 118), 'gable', lit=0.5, seed=5, floors=2, door=False)
        cv.rect(x, y - h, x + w - 1, y - 1, wall)  # the front, painted afresh for the shop's own windows
        for yy in range(y - h + 2, y, 3):
            cv.line([(x, yy), (x + w - 1, yy)], darker(wall, 0.06))
        for k, wx in enumerate(range(x + 4, x + w - 3, 7)):  # the flat upstairs, flowers on its sills
            cv.rect(wx, y - h + 2, wx + 1, y - h + 4, (252, 216, 128) if k == 1 else (52, 50, 62))
            cv.line([(wx - 1, y - h + 5), (wx + 2, y - h + 5)], (64, 108, 50))
            cv.put(wx, y - h + 5, (222, 84, 92))
            cv.put(wx + 2, y - h + 5, (248, 212, 98))
        cv.line([(x - 1, y - 17), (x + w, y - 17)], lighter(wall, 0.5))  # the cornice over the shopfront
        cv.rect(x, y - 16, x + w - 1, y - 14, GREEN)  # the sign board, gold letters round a note
        cv.line([(x, y - 16), (x + w - 1, y - 16)], (62, 112, 90))
        nx = x + w // 2
        for lx in list(range(x + 2, nx - 3, 2)) + list(range(nx + 4, x + w - 2, 2)):
            cv.put(lx, y - 15, (226, 196, 120))
        for (ddx, ddy) in ((0, -18), (1, -18), (2, -17), (0, -17), (0, -16), (0, -15), (-1, -15), (-2, -15), (-1, -14), (-2, -14)):
            cv.put(nx + ddx, y + ddy, GOLD)  # its flag pokes up over the board
        cv.rect(x, y - 13, x + w - 1, y, GREEN)  # the shopfront
        wx1 = x + w - 9  # the window, lit warm, the guitar standing in it
        cv.rect(x + 2, y - 11, wx1, y - 1, (24, 50, 42))
        for yy in range(y - 10, y - 1):
            cv.line([(x + 3, yy), (wx1 - 1, yy)], mix((255, 244, 206), (246, 204, 128), (yy - (y - 10)) / 8))
        guitar = ['..H..', '..N..', '..N..', '..N..', '.BBB.', '.BOB.', 'bBBBb', 'bBBBb', '.bbb.']
        colours = {'H': (54, 32, 26), 'N': (90, 56, 38), 'B': (214, 104, 44), 'b': (128, 52, 32), 'O': (46, 26, 22)}
        gx = (x + 2 + wx1) // 2 - 2
        for r, row in enumerate(guitar):
            for c, ch in enumerate(row):
                if ch in colours:
                    cv.put(gx + c, y - 10 + r, colours[ch])
        cv.line([(x + 2, y - 1), (wx1, y - 1)], lighter(GREEN, 0.3))  # the sill
        dx0 = x + w - 6  # the door, its glass lit
        cv.rect(dx0, y - 10, dx0 + 3, y - 1, (22, 50, 42))
        cv.rect(dx0 + 1, y - 9, dx0 + 2, y - 5, (246, 206, 128))
        cv.put(dx0 + 2, y - 3, GOLD)
        a, b = (204, 58, 66), (246, 238, 222)  # the striped awning, lit along its top, scalloped below
        cv.rect(x - 1, y - 13, x + w, y - 11, b)
        for xx in range(x - 1, x + w + 1):
            if ((xx - x + 1) // 2) % 2 == 0:
                cv.line([(xx, y - 13), (xx, y - 11)], a)
                cv.put(xx, y - 10, a if (xx - x) % 2 == 0 else darker(a, 0.2))
            elif (xx - x) % 2 == 0:
                cv.put(xx, y - 10, darker(b, 0.12))
        cv.line([(x - 1, y - 13), (x + w, y - 13)], lighter(a, 0.25))
        for xx in range(x + 3, wx1):  # its shadow on the window
            cv.shade(xx, y - 9, 0.2)
    def board(px, py):  # a sandwich board by the door, chalked
        cv.rect(px, py - 4, px + 2, py - 1, (52, 56, 54))
        cv.line([(px, py - 4), (px + 2, py - 4)], (150, 112, 74))
        cv.put(px + 1, py - 3, (236, 232, 220))
        cv.put(px + 1, py - 2, GOLD)
        cv.put(px, py, (100, 72, 48))
        cv.put(px + 2, py, (100, 72, 48))
        cv.put(px + 3, py, (0, 0, 0, 60))
    items = [(y, 0, house), (49, 1, lambda: board(x + w - 3, 49)), (50, 2, lambda: lamp(cv, x - 4, 50))]
    for k, px in enumerate((7, 65)):
        items.append((50, 10 + k, lambda px=px: tree(cv, px, 50, 5, px + 3)))
    for i, (px, py) in enumerate(((x + 6, 49), (x + 11, 51), (x + w + 4, 50))):
        items.append((py, 20 + i, lambda px=px, py=py, i=i: person(cv, px, py, i + 3)))
    back_to_front(items)
    return cv


def home():
    """Your home, at the west end of the first suburb's street: a cottage a touch bigger than its
    neighbours, built the same way, with warm light in its windows, smoke from its chimney and a little
    porch over a green door; a small front garden behind a picket fence, with a flower bed, a path to
    the gate and a tree either side; and by the gate a green sign with a gold note, like the music
    shop's."""
    cv = Canvas(64, 50)
    ground(cv, 31, 41, 29, 7, lambda x, y, d: (122, 164, 66) if (x + y) % 7 else (112, 156, 62), 23)  # the lawn
    x, y, w, h = 18, 38, 24, 12  # the front's bottom left, its width and its height to the eaves
    wall, roof = (234, 222, 200), (162, 72, 58)
    GREEN, GOLD, FRAME = (34, 78, 64), (252, 208, 98), (92, 64, 52)
    WARM, WARM_DEEP = (255, 238, 190), (246, 198, 116)
    gx = x + 10  # the door, the path and the gate, in a line
    def window(wx, wy, ww, wh):  # lit warm, brighter at the top, in a dark frame, a sill under it
        cv.rect(wx, wy, wx + ww - 1, wy + wh - 1, FRAME)
        for yy in range(wy + 1, wy + wh - 1):
            cv.line([(wx + 1, yy), (wx + ww - 2, yy)], mix(WARM, WARM_DEEP, (yy - wy - 1) / max(1, wh - 3)))
        cv.line([(wx - 1, wy + wh), (wx + ww, wy + wh)], lighter(wall, 0.5))
    def house():
        building(cv, x, y, w, h, 12, wall, roof, 'gable', lit=0.6, seed=3, floors=1, door=False)
        cv.rect(x, y - h, x + w - 1, y - 1, wall)  # the front, painted afresh for its own windows
        for yy in range(y - h + 2, y, 3):
            cv.line([(x, yy), (x + w - 1, yy)], darker(wall, 0.06))
        window(x + 2, y - 9, 6, 5)  # the big window on the left, a mullion down it, and a smaller one
        cv.line([(x + 4, y - 8), (x + 4, y - 6)], FRAME)
        window(x + w - 7, y - 9, 5, 5)
        cv.line([(gx - 1, y - 7), (gx + 3, y - 7)], darker(wall, 0.3))  # the porch's shadow
        cv.rect(gx, y - 6, gx + 2, y - 1, GREEN)  # the door, its glass lit, its brass knob
        cv.put(gx + 1, y - 5, (246, 206, 128))
        cv.put(gx + 2, y - 3, GOLD)
        cv.poly([(gx - 2, y - 8), (gx + 1, y - 11), (gx + 4, y - 8)], roof)  # the porch's little gable
        cv.line([(gx - 2, y - 8), (gx + 1, y - 11)], lighter(roof, 0.3))
        cv.line([(gx + 2, y - 10), (gx + 4, y - 8)], darker(roof, 0.28))
        cv.line([(gx - 2, y - 8), (gx + 4, y - 8)], darker(roof, 0.4))
        cv.rect(gx - 1, y, gx + 3, y, (200, 190, 170))  # the step
        # The chimney, over the stub building() may have drawn but a little taller, and its smoke
        # drifting east, fading.
        ch = x + w - 4
        cv.rect(ch, y - h - 11, ch + 1, y - h - 6, (120, 80, 64))
        cv.put(ch, y - h - 11, (150, 104, 84))
        for k, (sx, sy, r) in enumerate(((ch + 1, y - h - 14, 1.2), (ch + 3, y - h - 17, 1.6), (ch + 6, y - h - 19, 1.8))):
            cv.oval(sx - r, sy - r * 0.8, sx + r, sy + r * 0.8, (238, 238, 234, 170 - k * 45))
    def garden():  # the path to the gate, flower beds either side of it, the picket fence and its gate
        for yy in range(y + 1, y + 7):
            for xx in range(gx, gx + 3):
                cv.put(xx, yy, mix((206, 192, 160), (222, 210, 182), hsh(xx, yy, 24)))
        flowers = [(222, 84, 92), (248, 212, 98), (240, 240, 220), (214, 120, 176)]
        for (bx0, bx1) in ((x + 1, gx - 1), (gx + 4, x + w - 1)):
            for xx in range(bx0, bx1):
                cv.put(xx, y + 2, flowers[(xx * 3) % 4] if xx % 2 else (64, 108, 50))
                cv.put(xx, y + 3, (64, 108, 50) if xx % 2 else (84, 128, 56))
        fy = y + 7
        for xx in range(x - 6, x + w + 8):
            if gx - 1 <= xx <= gx + 3:
                continue
            cv.put(xx, fy, (226, 218, 198))
            if xx % 2 == 0:
                cv.put(xx, fy - 1, (244, 238, 224))
            cv.put(xx + 1, fy + 1, (10, 24, 14, 70))
        for px in (gx - 2, gx + 4):
            cv.line([(px, fy - 2), (px, fy)], (246, 240, 228))
            cv.put(px + 1, fy + 1, (10, 24, 14, 70))
    def sign():  # on a post by the gate: a green board with a gold note, like the music shop's sign
        sx, sy = gx + 5, y - 1  # the board's top left; its post stands on the fence's line
        cv.line([(sx + 2, sy + 7), (sx + 2, sy + 8)], (100, 72, 48))
        cv.put(sx + 3, sy + 9, (10, 24, 14, 70))
        cv.rect(sx, sy, sx + 5, sy + 6, GREEN)
        cv.line([(sx, sy), (sx + 5, sy)], (62, 112, 90))
        for r, row in enumerate(['..XX', '..XX', '..X.', 'XXX.', 'XX..']):
            for c, k in enumerate(row):
                if k == 'X':
                    cv.put(sx + 1 + c, sy + 1 + r, GOLD)
    items = [(y, 0, house), (y + 7, 1, garden), (y + 8, 2, sign)]
    items += [(y + 2, 3, lambda: tree(cv, x - 5, y + 2, 5.5, 41)), (y + 1, 4, lambda: tree(cv, x + w + 9, y + 1, 4.5, 44))]
    back_to_front(items)
    return cv

def island():
    """One Tree Island, the smaller of the lake's two, drawn again at twice the land's detail over its own:
    its grass in the land's greens, sunlit on the right, the foam round its edge, its one pine with its
    shadow, and a rowboat pulled up on its shore."""
    cv = Canvas(40, 34)
    cx, cy = 20, 23  # the island's middle, over the land's own
    GRASS = [(122, 156, 52), (150, 174, 62), (180, 190, 84)]
    for y in range(cy - 10, cy + 11):
        for x in range(cx - 16, cx + 17):
            dx, dy = (x - cx) / 14.5, (y - cy) / 9.5
            d = dx * dx + dy * dy + (hsh(x, y, 61) - 0.5) * 0.1
            if d <= 1:
                cv.put(x, y, (214, 238, 228) if d > 0.78 else step(GRASS, 0.45 + (x - cx) / 30 - (y - cy) / 40 + (hsh(x, y, 62) - 0.5) * 0.3))
    # the rowboat, its bow up on the grass to the right, its stern in the water
    bx, by = cx + 6, cy + 3
    for k, row in enumerate(['..ggggggg..', '.gDDDDDDDg.', 'GGGGGGGGGGG', '.HHHHHHHHH.']):
        for i, ch in enumerate(row):
            if ch != '.':
                cv.put(bx + i, by + k, {'g': (204, 160, 108), 'D': (104, 66, 42), 'G': (166, 112, 72), 'H': (118, 76, 48)}[ch])
    for i in range(1, 10):
        cv.put(bx + i, by + 4, (20, 60, 90, 90))
    cv.line([(bx + 2, by + 1), (bx + 8, by + 1)], (104, 66, 42))
    cv.line([(bx + 3, by), (bx + 3, by + 1)], (204, 160, 108))  # the seat
    tree(cv, cx, cy + 1, 6, 812, 'pine')  # over the land's own, a little taller
    return cv

# ---------------------------------------------------------------------------------------------
# The settlements without a name

def suburb(seed):
    cv = Canvas(150, 78)
    ground(cv, 75, 56, 72, 20, lambda x, y, d: (122, 164, 66) if (x + y) % 7 else (112, 156, 62), seed)
    items = []
    for row, y in enumerate((52, 72)):
        x, k = 6 + row * 8, 0
        while x < 132:
            w = 14 + int(hsh(k, row, seed) * 5)
            n = len(items)
            items.append((y, n, lambda x=x, y=y, w=w, k=k, row=row: building(cv, x, y, w, 9, 10, WALLS[(k + row * 3 + seed) % len(WALLS)], ROOFS[(k * 3 + row + seed) % len(ROOFS)], 'gable', lit=0.2, seed=k + row * 20 + seed, floors=1)))
            if hsh(k, row, seed + 1) < 0.5:
                items.append((y + 1, n + 1, lambda x=x + w + 6, y=y + 1, k=k: tree(cv, x, y, 4.5, k + seed)))
            items.append((y + 4, n + 2, lambda x=x, y=y, w=w: [cv.put(xx, y + 4, (236, 228, 210)) for xx in range(x - 2, x + w + 3, 2)]))  # a garden fence
            x, k = x + w + 14, k + 1
    back_to_front(items)
    return cv


def village():
    cv = Canvas(120, 90)
    ground(cv, 60, 74, 56, 14, lambda x, y, d: (122, 164, 66), 71)
    def church():
        building(cv, 46, 74, 24, 14, 12, (222, 214, 196), (110, 104, 112), 'gable', lit=0.1, seed=3, floors=1)
        sx = 40
        cv.rect(sx, 44, sx + 7, 74, (214, 206, 188))
        cv.poly([(sx + 7, 44), (sx + 10, 41), (sx + 10, 71), (sx + 7, 74)], (176, 168, 152))
        cv.poly([(sx - 1, 44), (sx + 4, 22), (sx + 11, 41), (sx + 8, 44)], (96, 100, 116))
        cv.poly([(sx + 4, 22), (sx + 11, 41), (sx + 8, 44)], (70, 74, 90))
        cv.rect(sx + 2, 52, sx + 4, 56, (60, 60, 70))
        cv.put(sx + 3, 21, (240, 200, 90))
    items = [(74, 0, church)]
    for k, (x, y) in enumerate(((8, 70), (18, 84), (76, 72), (92, 84), (62, 86))):
        items.append((y, 10 + k, lambda x=x, y=y, k=k: building(cv, x, y, 14, 8, 10, WALLS[k % len(WALLS)], ROOFS[k % len(ROOFS)], 'gable', lit=0.2, seed=k + 70, floors=1)))
    for k, (x, y) in enumerate(((36, 86), (104, 70), (4, 82))):
        items.append((y, 20 + k, lambda x=x, y=y, k=k: tree(cv, x, y, 5, k + 80)))
    back_to_front(items)
    return cv


def farm():
    cv = Canvas(110, 80)
    ground(cv, 55, 64, 52, 14, lambda x, y, d: (150, 130, 90) if d < 0.5 else (124, 164, 66), 81)
    def silo():
        cv.rect(54, 30, 63, 62, (206, 204, 198))
        cv.rect(60, 30, 63, 62, (170, 168, 164))
        cv.oval(53, 25, 64, 34, (150, 150, 156))
        cv.oval(54, 26, 62, 31, (186, 186, 190))
    def tractor():
        cv.rect(36, 70, 44, 73, (70, 150, 70))
        cv.rect(40, 67, 43, 70, (60, 130, 60))
        cv.oval(34, 71, 39, 76, (40, 40, 44))
        cv.oval(42, 73, 45, 76, (40, 40, 44))
    back_to_front([
        (60, 0, lambda: building(cv, 14, 60, 30, 16, 16, (170, 58, 52), (110, 104, 108), 'gable', win=(90, 40, 36), lit=0, seed=1, floors=1)),
        (62, 1, silo),
        (72, 2, lambda: building(cv, 70, 72, 20, 10, 12, (234, 222, 200), (150, 62, 56), 'gable', lit=0.3, seed=4, floors=1)),
        (76, 3, tractor),
        (74, 4, lambda: tree(cv, 6, 74, 6, 90)),
        (66, 5, lambda: tree(cv, 100, 66, 6, 91)),
    ])
    return cv


def lighthouse():
    cv = Canvas(50, 90)
    ground(cv, 25, 80, 22, 8, lambda x, y, d: step([(96, 96, 104), (128, 128, 132), (160, 158, 154)], 0.8 - d * 0.6 + (hsh(x, y, 91) - 0.5) * 0.3), 93)
    for yy in range(70, 82):
        for xx in range(30, 44):
            cv.shade(xx, yy)
    for y in range(26, 80):  # the tower in red and white bands, shaded on the right
        half = 4 + (y - 26) / 54 * 3
        for x in range(int(25 - half), int(25 + half) + 1):
            c = (204, 54, 58) if ((y - 26) // 9) % 2 == 0 else (244, 240, 230)
            cv.put(x, y, darker(c, 0.25) if x > 25 + half * 0.3 else c)
    cv.rect(20, 18, 30, 26, (60, 60, 70))
    cv.rect(21, 19, 29, 25, (255, 236, 150))
    cv.rect(22, 20, 25, 24, (255, 252, 230))
    cv.poly([(19, 18), (25, 10), (31, 18)], (180, 50, 54))
    cv.line([(18, 26), (32, 26)], (40, 40, 48))
    return cv


def marina():
    cv = Canvas(130, 60)
    cv.rect(10, 20, 120, 24, (150, 112, 74))  # the pier and its jetties, out over the water
    cv.line([(10, 24), (120, 24)], (96, 70, 48))
    for x in range(10, 121, 4):
        cv.line([(x, 20), (x, 24)], (130, 96, 62))
    for jx in (24, 54, 84, 110):
        cv.rect(jx, 24, jx + 3, 46, (150, 112, 74))
        cv.line([(jx + 3, 24), (jx + 3, 46)], (96, 70, 48))
    for k, (bx, by) in enumerate(((30, 34), (44, 42), (60, 30), (74, 40), (90, 34), (116, 42), (12, 40))):
        for xx in range(bx + 1, bx + 14):
            cv.put(xx, by + 3, (20, 60, 90, 90))
        cv.poly([(bx, by), (bx + 12, by), (bx + 10, by + 3), (bx + 2, by + 3)], (246, 244, 236))
        cv.line([(bx + 2, by + 3), (bx + 10, by + 3)], (80, 110, 140) if k % 2 else (190, 60, 60))
        cv.line([(bx + 6, by - 12), (bx + 6, by)], (60, 56, 60))
        cv.poly([(bx + 7, by - 11), (bx + 12, by - 2), (bx + 7, by - 2)], (250, 248, 240))
    return cv


def cloud(w, h, seed):
    cv = Canvas(w, h)
    blobs = [(w * (0.2 + 0.6 * hsh(k, 1, seed)), h * (0.45 + 0.25 * hsh(k, 2, seed)), h * (0.22 + 0.2 * hsh(k, 3, seed))) for k in range(7)]
    for y in range(h):
        for x in range(w):
            inside = [(bx, by, r) for (bx, by, r) in blobs if (x - bx) ** 2 + ((y - by) * 1.5) ** 2 <= r * r * 2.2]
            if inside:
                bx, by, r = max(inside, key=lambda b: b[1])
                t = (y - (by - r)) / (2 * r)
                cv.put(x, y, ((255, 255, 252) if t < 0.35 else ((236, 240, 244) if t < 0.7 else (206, 216, 228))) + (150,))
    return cv

# ---------------------------------------------------------------------------------------------
# The bridges, seen from the side

DECK = {'suspension': 78, 'truss': 44}  # the row of each bridge picture that sits on its road or railway

def suspension(L=96):
    """Like the Golden Gate: the road deck on a red girder, two tall red towers standing in the water,
    the main cables draping between them and down to each end, hangers down to the deck."""
    cv = Canvas(L, 100)
    RED, RED_LIT, RED_DARK = (196, 62, 46), (232, 104, 74), (134, 40, 32)
    deck_far, deck_near = 74, 82
    t1, t2 = int(L * 0.27), int(L * 0.73)
    top = 18
    def cable(x, sag_to):
        if t1 <= x <= t2:
            k = (x - t1) / (t2 - t1)
            return top + 2 + (sag_to - top) * (1 - (2 * k - 1) ** 2)
        k = x / t1 if x < t1 else (L - 1 - x) / (L - 1 - t2)
        return deck_far - 2 - (deck_far - 2 - top - 2) * k ** 1.6
    for y in range(deck_near + 3, deck_near + 9):  # its shadow on the water
        for x in range(4, L):
            cv.put(x, y, (8, 30, 50, 70))
    for x in range(L):  # the far cable and its hangers, behind the deck
        cy = cable(x, deck_far - 6) - 3
        cv.put(x, cy, RED_DARK)
        if x % 3 == 0 and cy < deck_far - 1:
            for y in range(int(cy) + 1, deck_far):
                cv.put(x, y, (150, 50, 40, 160))
    for t in (t1, t2):  # the piers under the towers, with foam
        cv.rect(t - 4, deck_near, t + 5, deck_near + 7, (150, 146, 140))
        cv.rect(t - 4, deck_near, t - 2, deck_near + 7, (186, 182, 174))
        for dx in (-5, -2, 2, 6):
            cv.put(t + dx, deck_near + 8, (226, 242, 236))
    cv.rect(0, deck_far, L - 1, deck_near - 1, (100, 100, 110))  # the road, a red rail on the far side, the girder's red face
    cv.line([(0, deck_far), (L - 1, deck_far)], RED_DARK)
    for x in range(0, L, 6):
        cv.line([(x, (deck_far + deck_near) // 2), (x + 2, (deck_far + deck_near) // 2)], (232, 220, 170))
    cv.rect(0, deck_near, L - 1, deck_near + 3, RED)
    cv.line([(0, deck_near), (L - 1, deck_near)], RED_LIT)
    cv.line([(0, deck_near + 3), (L - 1, deck_near + 3)], RED_DARK)
    for x in range(1, L, 3):
        cv.put(x, deck_near + 1, RED_DARK)
        cv.put(x + 1, deck_near + 2, RED_DARK)
    for t in (t1, t2):  # the towers, tapering in steps, lit on the left, braced across
        for y in range(top, deck_near + 4):
            half = 2 if y < top + 18 else (3 if y < top + 38 else 4)
            for x in range(t - half, t + half + 1):
                cv.put(x, y, RED_LIT if x == t - half else (RED_DARK if x >= t + half - 1 else RED))
        for by in (top + 3, top + 18, top + 38):
            cv.rect(t - 4, by, t + 4, by + 1, RED_DARK)
            cv.line([(t - 4, by), (t + 4, by)], RED_LIT)
        cv.rect(t - 2, top - 2, t + 2, top, RED_LIT)
        for y in range(top + 5, deck_far - 2):  # the slot between each tower's two legs
            if y not in range(top + 17, top + 20) and y not in range(top + 37, top + 40):
                cv.put(t, y, RED_DARK)
    for x in range(L):  # the near cable and its hangers, in front
        cy = cable(x, deck_far - 4)
        cv.put(x, cy, RED)
        cv.put(x, cy - 1, RED_LIT)
        if x % 3 == 0 and cy < deck_near - 1 and abs(x - t1) > 4 and abs(x - t2) > 4:
            for y in range(int(cy) + 1, deck_near):
                cv.put(x, y, (176, 58, 44))
    for x0 in (0, L - 6):  # stone ends where it meets the banks
        cv.rect(x0, deck_far - 1, x0 + 5, deck_near + 6, (176, 168, 152))
        cv.line([(x0, deck_far - 1), (x0 + 5, deck_far - 1)], (214, 206, 188))
    return cv


def truss(L=88):
    """For the trains: the rails on the deck, and two arched steel spans along both sides, the far side
    darker, on a pier in the river."""
    cv = Canvas(L, 60)
    STEEL, STEEL_LIT, STEEL_DARK = (66, 96, 98), (120, 156, 150), (36, 54, 58)
    deck_far, deck_near = 41, 47
    half = L // 2
    for y in range(deck_near + 3, deck_near + 8):
        for x in range(4, L):
            cv.put(x, y, (8, 30, 50, 70))
    cv.rect(half - 3, deck_near, half + 3, deck_near + 8, (150, 140, 128))
    cv.rect(half - 3, deck_near, half - 1, deck_near + 8, (184, 176, 162))
    for dx in (-4, 0, 4):
        cv.put(half + dx, deck_near + 9, (226, 242, 236))
    def span(x0, x1, base, rise, top_c, mem_c):  # a bowstring: an arch over the span, verticals and diagonals inside
        pts = [(x, base - 2 - rise * (1 - (2 * (x - x0) / (x1 - x0) - 1) ** 2)) for x in range(x0, x1 + 1)]
        for i in range(len(pts) - 1):
            cv.line([pts[i], pts[i + 1]], top_c)
            cv.line([(pts[i][0], pts[i][1] + 1), (pts[i + 1][0], pts[i + 1][1] + 1)], mem_c)
        n = 6
        for j in range(1, n):
            x = x0 + (x1 - x0) * j // n
            xp = x0 + (x1 - x0) * (j - 1) // n
            cv.line([(x, pts[x - x0][1]), (x, base)], mem_c)
            cv.line([(xp, base), (x, pts[x - x0][1])] if j <= n // 2 else [(x, base), (xp, pts[xp - x0][1])], mem_c)
        cv.line([(x0, base), (x1, base)], top_c)
    span(0, half, deck_far, 12, STEEL_DARK, (30, 44, 48))
    span(half, L - 1, deck_far, 12, STEEL_DARK, (30, 44, 48))
    cv.rect(0, deck_far, L - 1, deck_near - 1, (96, 82, 72))
    for x in range(0, L, 2):
        cv.line([(x, deck_far + 1), (x, deck_near - 2)], (66, 48, 38))
    cv.line([(0, deck_far + 2), (L - 1, deck_far + 2)], (196, 194, 190))
    cv.line([(0, deck_near - 2), (L - 1, deck_near - 2)], (196, 194, 190))
    cv.rect(0, deck_near, L - 1, deck_near + 2, STEEL)
    cv.line([(0, deck_near + 2), (L - 1, deck_near + 2)], STEEL_DARK)
    span(0, half, deck_near, 13, STEEL_LIT, STEEL)
    span(half, L - 1, deck_near, 13, STEEL_LIT, STEEL)
    for x0 in (0, L - 5):
        cv.rect(x0, deck_far - 1, x0 + 4, deck_near + 5, (176, 168, 152))
    return cv

# ---------------------------------------------------------------------------------------------
# The city

def city(pictures, M):
    """The city's buildings, loose on patches of paving over the land inside its outline, clear of the
    roads, the water and the pictures standing in it (the station, the village, the park, the shop):
    towers crowded round its heart by the station, flats further out, houses in gardens at the edges,
    trees in the gaps. Returns the picture and its top left, in screen pixels."""
    roads, water = M['kerb'].load(), M['water'].load()
    xs, ys = [p[0] for p in CITY], [p[1] for p in CITY]
    lx0, ly0, lx1, ly1 = min(xs) - 4, min(ys) - 50, max(xs) + 8, max(ys) + 6  # with headroom for the towers
    CW, CH = (lx1 - lx0) * SCALE, (ly1 - ly0) * SCALE
    cv = Canvas(CW, CH)
    def land(px, py):  # a picture pixel's land pixel
        return lx0 + px / SCALE, ly0 + py / SCALE
    def ground_ok(X, Y):
        return in_city(X, Y) and not roads[int(X), int(Y)] and not water[int(X), int(Y)]
    def clear_of(px0, py0, px1, py1):
        return all(ground_ok(*land(px, py)) for py in range(int(py0), int(py1) + 1, 2) for px in range(int(px0), int(px1) + 1, 2))
    keep_out = []  # the lower part of each picture standing in the city
    for name in ('station', 'village', 'park', 'shop'):
        cx, by, _, _ = PICTURES[name]
        im = pictures[name].img
        keep_out.append((cx * SCALE - im.width // 2 - lx0 * SCALE + 6, by * SCALE - im.height * 0.55 - ly0 * SCALE,
                         cx * SCALE + im.width // 2 - lx0 * SCALE - 6, by * SCALE - ly0 * SCALE + 4))
    taken = []
    def free(x0, y0, x1, y1):
        if any(not (x1 < k[0] or x0 > k[2] or y1 < k[1] or y0 > k[3]) for k in keep_out):
            return False
        return not any(not (x1 + 2 < t[0] or x0 - 2 > t[2] or y1 + 2 < t[1] or y0 - 2 > t[3]) for t in taken)
    hx, hy = (CITY_HEART[0] - lx0) * SCALE, (CITY_HEART[1] - ly0) * SCALE
    plots = []
    for gy in range(0, CH, 10):
        for gx in range(0, CW, 10):
            x, y = gx + int(hsh(gx, gy, 1) * 6), gy + int(hsh(gx, gy, 2) * 6)
            d = math.hypot((x - hx) / 1.25, y - hy) / SCALE  # from the heart, in land pixels
            if d < 70:
                kind, w, h = 'tower', 14 + int(hsh(x, y, 3) * 9), 36 + int(hsh(x, y, 4) * 50 * (1 - d / 90))
            elif d < 120:
                kind, w, h = 'flats', 13 + int(hsh(x, y, 3) * 8), 16 + int(hsh(x, y, 4) * 14)
            else:
                kind, w, h = 'house', 11 + int(hsh(x, y, 3) * 4), 9
            fx0, fy0, fx1, fy1 = x, y - 6, x + w + 5, y  # its footprint
            if fy0 - h < 0 or not clear_of(fx0 - 3, fy0 - 3, fx1 + 3, fy1 + 4) or not free(fx0, fy0, fx1, fy1):
                continue
            if hsh(x, y, 5) < {'house': 0.4, 'flats': 0.22, 'tower': 0.08}[kind]:  # some room between them
                continue
            taken.append((fx0, fy0, fx1, fy1))
            plots.append((y, x, w, h, kind))
    for (y, x, w, h, kind) in plots:  # paving round the towers and the flats, joining up where they're close
        if kind == 'house':
            continue
        m = 5 if kind == 'tower' else 3
        for py in range(y - 5 - m, y + m + 1):
            for px in range(x - m, x + w + 5 + m + 1):
                if 0 <= px < CW and 0 <= py < CH and ground_ok(*land(px, py)):
                    cv.put(px, py, mix((170, 160, 144), (192, 182, 162), hsh(px, py, 61)))
    items = []
    for k, (y, x, w, h, kind) in enumerate(plots):
        seed = x * 7 + y
        if kind == 'tower':
            items.append((y, k, lambda x=x, y=y, w=w, h=h, seed=seed: tower(cv, x, y, w, h, seed, hsh(x, y, 6) < 0.6)))
        else:
            wall, roof = WALLS[int(hsh(x, y, 8) * 7) % 7], ROOFS[int(hsh(x, y, 9) * 6) % 6]
            if kind == 'flats':
                rk = 'flat' if hsh(x, y, 10) < 0.5 else 'gable'
                items.append((y, k, lambda x=x, y=y, w=w, h=h, wall=wall, roof=roof, rk=rk, seed=seed: building(cv, x, y, w, h, 10, wall, roof, rk, lit=0.3, seed=seed)))
            else:
                items.append((y, k, lambda x=x, y=y, w=w, wall=wall, roof=roof, seed=seed: building(cv, x, y, w, 8, 10, wall, roof, 'gable', lit=0.2, seed=seed, floors=1)))
    for gy in range(0, CH, 7):  # trees in the gaps
        for gx in range(0, CW, 7):
            x, y = gx + int(hsh(gx, gy, 11) * 5), gy + int(hsh(gx, gy, 12) * 5)
            if not ground_ok(*land(x, y)) or cv.get(x, y)[3] or not free(x - 4, y - 3, x + 4, y + 1) or hsh(gx, gy, 13) >= 0.3:
                continue
            taken.append((x - 3, y - 2, x + 3, y))
            items.append((y, len(items), lambda x=x, y=y: tree(cv, x, y, 3.5 + hsh(x, y, 14) * 1.5, x * 3 + y)))
    back_to_front(items)
    return cv, (lx0 * SCALE, ly0 * SCALE)

# ---------------------------------------------------------------------------------------------
# Everything drawn, saved, and placed

def top_row(cv):
    """The highest solid row in the middle third of a picture, where its pin points."""
    for y in range(cv.h):
        for x in range(cv.w // 3, cv.w * 2 // 3):
            if cv.get(x, y)[3] > 200:
                return y
    return 0


pictures = {
    'park': park(), 'station': station(), 'market': market(), 'island': island(), 'shop': shop(), 'home': home(), 'suburb1': suburb(3),
    'suburb2': suburb(11), 'village': village(), 'farm': farm(), 'lighthouse': lighthouse(), 'marina': marina(),
}
the_city, city_at = city(pictures, masks())
bridges = {'suspension': suspension(96), 'truss': truss(88)}
clouds = {'cloud1': cloud(120, 44, 5), 'cloud2': cloud(90, 34, 9)}

placed = [{'name': 'city', 'x': city_at[0], 'y': city_at[1]}]
places = {}
NAMES = {'park': 'The Park', 'station': 'The Station', 'market': 'The Night Market', 'island': 'One Tree Island', 'shop': 'The Music Shop', 'home': 'Home'}
for name, (cx, by, w, h) in sorted(PICTURES.items(), key=lambda kv: (kv[1][1], kv[0])):
    cv = pictures[name]
    x, y = cx * SCALE - cv.w // 2, by * SCALE - cv.h + 3
    placed.append({'name': name, 'x': x, 'y': y})
    if name in STOPS:
        places[name] = {'name': NAMES[name], 'pin': [cx * SCALE, y + top_row(cv) - 4], 'label': [cx * SCALE, by * SCALE + 6],
                        'view': [cx * SCALE, round(by * SCALE - cv.h * 0.4 - 17)]}
for name, (bx, by, _) in BRIDGES.items():
    placed.append({'name': name, 'x': bx * SCALE, 'y': by * SCALE - DECK[name]})

OUT.mkdir(parents=True, exist_ok=True)
for name, cv in {**pictures, 'city': the_city, **bridges, **clouds}.items():
    cv.img.save(OUT / f'{name}.png', optimize=True)
data = {
    'size': [W * SCALE, H * SCALE],
    'land': 'land.png',
    'pictures': placed,
    'places': {k: places[k] for k in STOPS},
    'clouds': [{'name': name, 'x': x * SCALE, 'y': y * SCALE} for (name, x, y) in CLOUDS],
}
(OUT / 'map.json').write_text(json.dumps(data, indent=2) + '\n')
print(f'places: {len(placed)} pictures, {len(clouds)} clouds')
