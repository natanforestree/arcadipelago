# Paints the land of Open Case's map, after Nathan's reference (his friend's atlas): a lush world seen
# from above, with mottled grass and flowers, terraced hills of pines with cliffs, the sea and its
# beaches, a lake with islands and a waterfall, the river, farm fields, roads, paths and the railway,
# forests and rocks. The places, the city and the bridges are drawn on top by places.py. Run from the
# repo root (Python 3 with Pillow):
#   python3 art/open-case/map/land.py
# Writes open-case/assets/map/land.png. It's deterministic: an unchanged script writes the same bytes.
# It stops with an error if a road, a path or the railway crosses water anywhere but on a bridge.
import math
from collections import deque
import sys
from PIL import Image, ImageDraw
sys.dont_write_bytecode = True  # no __pycache__ beside the scripts
from layout import (W, H, OUT, hsh, fbm, mix, step, darker, lighter, catmull, coast, ROADS, PATHS, RAIL, ISLANDS,
                    PICTURES, BRIDGES, in_city, in_clearing, on_bridge, masks)

img = Image.new('RGB', (W, H))
P = img.load()

def put(x, y, c):
    if 0 <= x < W and 0 <= y < H:
        P[x, y] = c

def shade(x, y, k):
    if 0 <= x < W and 0 <= y < H:
        P[x, y] = darker(P[x, y], k)

# daylight with a warm cast
GRASS_WARM = [(74, 112, 40), (96, 134, 44), (122, 156, 52), (150, 174, 62), (180, 190, 84), (204, 204, 112)]
GRASS_COOL = [(48, 96, 52), (62, 116, 56), (82, 138, 62), (108, 158, 70), (136, 176, 82), (168, 194, 104)]
LEAF = [(16, 40, 36), (24, 58, 44), (34, 80, 50), (50, 104, 54), (76, 130, 58), (114, 156, 66), (158, 182, 86)]
LEAF_Y = [(30, 52, 30), (50, 78, 34), (76, 108, 40), (108, 136, 46), (146, 162, 58), (186, 186, 82), (222, 210, 120)]
PINE = [(12, 34, 34), (18, 50, 44), (26, 68, 54), (38, 90, 64), (60, 116, 72), (92, 140, 82)]
WATER = [(30, 84, 134), (34, 100, 150), (40, 120, 164), (52, 140, 174), (72, 162, 182), (106, 188, 190)]
FOAM = (214, 238, 228)
SAND = [(190, 160, 104), (214, 188, 132), (234, 212, 160), (246, 230, 186)]
CLIFF = [(54, 46, 44), (78, 66, 58), (104, 88, 72), (132, 114, 92), (160, 142, 116)]
ROCK = [(62, 64, 70), (92, 94, 100), (128, 128, 130), (164, 162, 158), (200, 196, 186)]
DIRT = [(118, 88, 56), (150, 116, 74), (182, 148, 98), (206, 176, 124)]
ROAD = [(64, 64, 74), (84, 84, 94), (104, 104, 112)]

M = masks()
WA, KA, RA, PA, RCA = (M[k].load() for k in ('water', 'kerb', 'road', 'path', 'rail'))

def wet(x, y):
    return 0 <= x < W and 0 <= y < H and WA[x, y] > 0

# How far each water pixel is from the shore (1 at the edge, up to 16), for the water's depth.
dist = {}
q = deque()
for y in range(H):
    for x in range(W):
        if WA[x, y] and any(0 <= x + dx < W and 0 <= y + dy < H and not wet(x + dx, y + dy) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
            dist[(x, y)] = 1
            q.append((x, y))
while q:
    x, y = q.popleft()
    if dist[(x, y)] >= 16:
        continue
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        n = (x + dx, y + dy)
        if wet(*n) and n not in dist:
            dist[n] = dist[(x, y)] + 1
            q.append(n)

# The hills: terraces rising to the north (and to the lake), each a step up with a cliff on its south
# face.
def level(x, y):
    e = fbm(x, y, 91, 150, 4) * 0.9 + max(0, (170 - y) / 170) * 0.75 + max(0, (x - 700) / 260) * max(0, (260 - y) / 260) * 0.4
    return 0 if e < 0.78 else (1 if e < 0.98 else 2)
LEVEL = [[level(x, y) for x in range(W)] for y in range(H)]
def lv(x, y):
    return LEVEL[y][x] if 0 <= x < W and 0 <= y < H else 0

# ---------------------------------------------------------------------------------------------
# The ground: grass mottled warm and cool, cliffs and lit lips on the terraces, the beach, the water

for y in range(H):
    for x in range(W):
        if WA[x, y]:
            continue
        hue, n, m = fbm(x, y, 11, 220, 3), fbm(x, y, 13, 70, 4), fbm(x, y, 17, 6, 2)
        t = 0.2 + n * 0.62 + (m - 0.5) * 0.42 + lv(x, y) * 0.06
        P[x, y] = step(GRASS_WARM, t) if hue + (hsh(x, y, 19) - 0.5) * 0.08 > 0.52 else step(GRASS_COOL, t)
for y in range(H):
    for x in range(W):
        if WA[x, y]:
            continue
        L = lv(x, y)
        if max(lv(x, y - k) for k in range(1, 7)) > L:
            k = next(k for k in range(1, 7) if lv(x, y - k) > L)  # how far down the cliff's face
            stripe = (x * 3 + int(hsh(x, 0, 23) * 4)) % 5
            t = 0.75 - k * 0.1 + (0.12 if stripe == 0 else (-0.12 if stripe == 3 else 0)) + (hsh(x, y, 29) - 0.5) * 0.15
            P[x, y] = step(CLIFF, t)
            if k == 6 or lv(x, y + 1) > L:
                P[x, y] = darker(P[x, y], 0.2)
        elif lv(x, y + 1) < L:
            P[x, y] = lighter(P[x, y], 0.25)
for y in range(H):
    for x in range(W):
        if WA[x, y]:
            continue
        d = min((abs(dx) + abs(dy) for dx in range(-6, 7) for dy in (-2, 0, 2) if wet(x + dx, y + dy) and (x + dx) < coast(y + dy) + 2), default=99)
        if d <= 5 and x < coast(y) + 12:
            P[x, y] = step(SAND, 0.15 + d * 0.15 + (hsh(x, y, 31) - 0.5) * 0.2)
for y in range(H):
    for x in range(W):
        if WA[x, y]:
            d = dist.get((x, y), 16)
            c = step(WATER, 0.98 - d * 0.055 + (fbm(x, y, 41, 16, 3) - 0.5) * 0.25)
            if d == 1 and hsh(x, y, 43) < 0.8:
                c = FOAM
            elif d == 2 and hsh(x, y, 45) < 0.35:
                c = lighter(c, 0.35)
            elif hsh(x, y, 47) < 0.0012:
                c = (226, 242, 238)
            P[x, y] = c
for i in range(900):  # little waves on open water
    x, y = int(hsh(i, 1, 49) * W), int(hsh(i, 2, 49) * H)
    if wet(x, y) and wet(x + 3, y) and dist.get((x, y), 16) > 4:
        for k in range(3):
            put(x + k, y, lighter(P[x + k, y], 0.3))
for y in range(150, 168):  # the waterfall where the river leaves the lake
    for x in range(836, 852):
        if wet(x, y) and hsh(x, y, 51) < 0.6:
            P[x, y] = (226, 240, 236) if (x + y // 2) % 3 else (176, 214, 218)
for i in range(260):  # patches of flowers
    cx, cy = int(hsh(i, 1, 61) * W), int(hsh(i, 2, 61) * H)
    col = [(236, 232, 206), (232, 200, 90), (214, 142, 160), (190, 210, 240)][int(hsh(i, 3, 61) * 4)]
    for k in range(5):
        x, y = cx + int(hsh(i, k, 63) * 6) - 3, cy + int(hsh(i, k, 65) * 4) - 2
        if 0 <= x < W and 0 <= y < H and not wet(x, y) and (P[x, y] in GRASS_WARM or P[x, y] in GRASS_COOL):
            P[x, y] = col

# ---------------------------------------------------------------------------------------------
# Fields: a patchwork of crops in the south east, with hedges between

FIELDS = []
for fy in range(372, H, 34):
    for fx in range(712, W, 46):
        if not in_clearing(fx + 20, fy + 30, 6) and not any(wet(fx + dx, fy + dy) for dx in (0, 20, 46) for dy in (0, 16, 32)):
            FIELDS.append((fx + int(hsh(fx, fy, 61) * 6), fy + int(hsh(fx, fy, 62) * 4), 40 + int(hsh(fx, fy, 63) * 6), 28, int(hsh(fx, fy, 64) * 4)))
CROPS = [((214, 186, 96), (186, 154, 72)), ((152, 176, 70), (118, 146, 58)), ((150, 110, 74), (122, 88, 60)), ((196, 200, 110), (164, 172, 88))]
for (x0, y0, w, h, k) in FIELDS:
    a, b = CROPS[k]
    for y in range(y0, y0 + h):
        for x in range(x0, x0 + w):
            if 0 <= x < W and 0 <= y < H and not WA[x, y]:
                stripe = ((y - y0) % 3 == 0) if k != 1 else ((x - x0 + (y - y0) // 2) % 4 == 0)
                c = b if stripe else a
                P[x, y] = lighter(c, 0.15) if hsh(x, y, 65) < 0.06 else c
    for x in range(x0, x0 + w):
        put(x, y0 + h, (54, 84, 40))
        put(x, y0 + h + 1, (40, 66, 34))
    for y in range(y0, y0 + h + 2):
        put(x0 + w, y, (54, 84, 40))

# ---------------------------------------------------------------------------------------------
# Paths, roads (their decks under the bridges' pictures where they cross the river) and the railway

for y in range(H):
    for x in range(W):
        if PA[x, y] and not KA[x, y]:
            inner = all(PA[min(W - 1, x + dx), min(H - 1, y + dy)] for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))
            P[x, y] = step(DIRT, (0.6 if inner else 0.25) + (hsh(x, y, 71) - 0.5) * 0.3)
for y in range(H):
    for x in range(W):
        if KA[x, y]:
            if WA[x, y]:
                P[x, y] = (150, 144, 136) if not RA[x, y] else (112, 110, 116)
            else:
                P[x, y] = (178, 170, 154) if not RA[x, y] else step(ROAD, 0.45 + (hsh(x, y, 73) - 0.5) * 0.3)
for road in ROADS:  # the centre lines, dashed
    for i, (x, y) in enumerate(catmull(road, 80)):
        if (i // 3) % 2 == 0 and not in_clearing(x, y):
            put(int(x), int(y), (228, 214, 166))
line = [(int(x), int(y)) for (x, y) in catmull(RAIL, 60) if 0 <= x < W and 0 <= y < H]
for i, (x, y) in enumerate(line):
    for dy in range(-2, 3):
        if not KA[x, min(H - 1, max(0, y + dy))]:
            put(x, y + dy, (66, 48, 38) if i % 2 == 0 else ((96, 82, 72) if not wet(x, y + dy) else (84, 78, 76)))
for (x, y) in line:
    for dy in (-1, 1):
        if not KA[x, min(H - 1, max(0, y + dy))]:
            put(x, y + dy, (190, 188, 184))

# The ground under each picture, a lighter mown green, where no trees grow
for (cx, by, w, h) in PICTURES.values():
    for y in range(int(by - h), int(by) + 1):
        for x in range(int(cx - w / 2), int(cx + w / 2) + 1):
            if 0 <= x < W and 0 <= y < H and not WA[x, y] and not KA[x, y]:
                dx, dy = (x - cx) / (w / 2), (y - (by - h / 2)) / (h / 2)
                if dx * dx + dy * dy <= 0.8:
                    P[x, y] = mix(P[x, y], (128, 168, 70), 0.35)

# ---------------------------------------------------------------------------------------------
# What stands on the land, back to front: trees and rocks

things = []
def stand(y, f):
    things.append((y, len(things), f))

def rock(cx, cy, r, seed):
    for y in range(cy - 1, cy + 3):
        for x in range(cx, cx + r + 3):
            shade(x, y, 0.3)
    for y in range(cy - r, cy + 1):
        for x in range(cx - r, cx + r + 1):
            dx, dy = (x - cx) / (r + 0.5), (y - cy + r * 0.3) / (r * 0.8 + 0.5)
            if dx * dx + dy * dy <= 1:
                edge = dx * dx + dy * dy > 0.7 and (dx > 0.3 or dy > 0.3)
                put(x, y, ROCK[0] if edge else step(ROCK, 0.6 - dx * 0.25 - dy * 0.35 + (hsh(x, y, seed) - 0.5) * 0.3))

# A tree standing at (cx, cy), r its size: its shadow cast to the lower right, then a pine in tiers,
# or a round crown of a few overlapping blobs, each lit from the top left, outlined below and right.
def tree(cx, cy, r, seed, kind='leaf'):
    for y in range(int(cy - r * 0.5), int(cy + r * 0.5) + 2):
        for x in range(int(cx - r * 0.2), int(cx + r * 1.9)):
            dx, dy = (x - (cx + r * 0.75)) / (r * 1.15), (y - cy) / (r * 0.5)
            if dx * dx + dy * dy <= 1:
                shade(x, y, 0.3)
    if kind == 'pine':
        top = cy - r * 2.8
        for y in range(int(top), int(cy) + 1):
            k = (y - top) / (cy - top)
            tier = ((y - int(top)) % 5) / 5
            half = max(0.6, r * (0.25 + k * 0.75) * (0.75 + tier * 0.35))
            for x in range(int(cx - half), int(cx + half) + 1):
                t = 0.7 - (x - cx) / (half + 1) * 0.4 - tier * 0.25 - k * 0.15 + (hsh(x, y, seed) - 0.5) * 0.2
                put(x, y, PINE[0] if x >= int(cx + half) or y == int(cy) else step(PINE, t))
        put(int(cx), int(cy) + 1, (58, 40, 30))
        return
    ramp = LEAF_Y if kind == 'yellow' else LEAF
    put(int(cx), int(cy), (64, 42, 30))
    put(int(cx), int(cy) - 1, (84, 56, 36))
    blobs = []
    for k in range(3 + int(hsh(seed, 1, 92) * 3)):
        a, d = hsh(k, seed, 91) * 6.28, 0 if k == 0 else r * 0.5
        blobs.append((cx + math.cos(a) * d, cy - r * 1.1 + math.sin(a) * d * 0.7, r * (1 if k == 0 else 0.55 + hsh(k, seed, 93) * 0.25)))
    def inside(x, y):
        best = None
        for (bx, by, br) in blobs:
            if (x - bx) ** 2 + (y - by) ** 2 <= br * br and (best is None or by > best[1]):
                best = (bx, by, br)
        return best
    for y in range(int(cy - r * 2.6), int(cy) + 1):
        for x in range(int(cx - r * 1.7), int(cx + r * 1.7) + 1):
            b = inside(x + 0.5, y + 0.5)
            if not b:
                continue
            bx, by, br = b
            t = 0.6 - ((x - bx) * 0.45 + (y - by) * 0.75) / br * 0.45 + (hsh(x, y, seed) - 0.5) * 0.22
            if not inside(x + 1.5, y + 0.5) or not inside(x + 0.5, y + 1.5):
                c = ramp[0]
            elif not inside(x - 0.5, y - 0.5):
                c = ramp[min(len(ramp) - 1, int(t * len(ramp)) + 1)]
            else:
                c = step(ramp, t)
            put(x, y, c)

# Where a tree or a rock may stand: on dry ground, off the roads, paths and railway, clear of the
# pictures, the city, the bridges, the fields and the beach, and not on a cliff.
def clear(x, y):
    if not (0 <= x < W and 0 <= y < H) or wet(x, y) or wet(x, y + 2) or wet(x + 3, y):
        return False
    if KA[x, y] or PA[x, y] or RCA[x, y] or in_clearing(x, y, 4) or in_city(x, y):
        return False
    if any(bx - 4 <= x <= bx + bl + 4 and by - 24 <= y <= by + 8 for (bx, by, bl) in BRIDGES.values()):
        return False
    if any(f[0] - 2 <= x <= f[0] + f[2] + 2 and f[1] - 2 <= y <= f[1] + f[3] + 4 for f in FIELDS):
        return False
    return x >= coast(y) + 10 and not any(lv(x, y - k) > lv(x, y) for k in range(1, 8))

# Forests where the noise is high (and on the hills, mostly pines), a scatter of trees elsewhere.
for gy in range(-6, H + 10, 4):
    for gx in range(-6, W + 6, 5):
        x, y = gx + int(hsh(gx, gy, 141) * 5) - 2, gy + int(hsh(gx, gy, 142) * 5) - 2
        if not clear(x, y):
            continue
        f, hill, roll = fbm(x, y, 151, 80, 3), lv(x, y) > 0, hsh(gx, gy, 143)
        dense = f > 0.56 or (hill and f > 0.46)
        if dense or roll < 0.035:
            r = (3.6 + hsh(gx, gy, 144) * 2.4) if dense else (3 + hsh(gx, gy, 144) * 2)
            pick = hsh(gx, gy, 145)
            if hill and pick < 0.7:
                kind = 'pine'
            else:
                kind = 'yellow' if fbm(x, y, 157, 50, 2) > 0.62 and pick < 0.5 else ('pine' if pick < 0.15 else 'leaf')
            stand(y, lambda x=x, y=y, r=r, kind=kind: tree(x, y, r * (0.8 if kind == 'pine' else 1), x * 31 + y * 7, kind))
for i in range(320):  # rocks: on the hills, at the cliffs' feet, and here and there
    x, y = int(hsh(i, 1, 171) * W), int(hsh(i, 2, 171) * H)
    if clear(x, y) and (lv(x, y) > 0 or hsh(i, 3, 171) < 0.25 or any(lv(x, y - k) > lv(x, y) for k in range(8, 12))):
        stand(y, lambda x=x, y=y, i=i: rock(x, y, 1 + int(hsh(i, 4, 171) * 3), i))
for (ix, iy, rx, ry) in ISLANDS[:2]:  # pines on the lake's islands
    stand(iy, lambda ix=ix, iy=iy, rx=rx: tree(ix, iy + 1, min(4, rx * 0.5), ix, 'pine'))
for (x0, y0, w, h, k) in FIELDS:  # hedgerow trees between the fields
    for x in range(x0, x0 + w, 9):
        if hsh(x, y0, 181) < 0.4:
            stand(y0 + h + 1, lambda x=x, y=y0 + h + 1: tree(x, y, 3, x * 3 + y, 'leaf'))

for _, _, f in sorted(things, key=lambda t: (t[0], t[1])):
    f()

# ---------------------------------------------------------------------------------------------
# Nothing crosses water but on a bridge

for kind, lines in (('road', ROADS), ('path', PATHS), ('railway', [RAIL])):
    for i, ln in enumerate(lines):
        for (x, y) in catmull(ln, 60):
            if 0 <= x < W and 0 <= y < H and WA[int(x), int(y)] and not on_bridge(x, y):
                raise SystemExit(f'{kind} {i} crosses water at ({int(x)}, {int(y)}) with no bridge')

OUT.mkdir(parents=True, exist_ok=True)
img.save(OUT / 'land.png', optimize=True)
print(f'land: {W}x{H}, {len(img.getcolors(W * H))} colours')
