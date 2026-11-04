#!/usr/bin/env python3
"""
Builds all Cozy Storybook 2.5D world, prop, NPC, and Spirit-Animal assets for the redesigned Hakuba RPG:
1. Copies & converts the Winter 2.5D village background (`village_winter_bg.png`, 1280x720).
2. Transforms the Winter 2.5D village background into a lush Green Season 2.5D village background (`village_green_bg.png`, 1280x720) with exact camera/layout alignment!
3. Slices the 3 Cozy Storybook architectural props (`prop_kominka_lodge.png`, `prop_tea_kiosk.png`, `prop_shrine_cedars.png`) with transparent backgrounds.
4. Generates high-res Cozy Storybook 2.5D illustrated PNG sprites (with dark-brown storybook ink outlines, gouache shading, and warm rim lighting) for:
   - `npc_elder_kenzo.png` (Elder Kenzo with haori, straw mino cape, hinoki staff, steaming amazake mug)
   - `npc_ski_yuki.png` (Yuki the Ski/Mountain Instructor with crimson patrol jacket, goggles on forehead, clipboard)
   - `enemy_snow_monkey.png` (Jigokudani Wild Snow Monkey with red face, white onsen towel on head, snowball & apple)
   - `enemy_sacred_serow.png` (Sacred Japanese Serow / Kamoshika — Transformed Shinto Priest with golden eyes & shimenawa rope + shide zig-zags)
   - `enemy_moon_bear.png` (Caffeine-Deprived Moon Bear — Transformed Coffee Roaster with golden crescent latte-art chest & wooden coffee tamper)
"""
import math
import os
import struct
import subprocess
import zlib
from collections import deque

# Import PNG reader/writer from extract_character_sprites
from extract_character_sprites import read_png_rgba, write_png_rgba

def make_green_season_village_bg(winter_png_path: str, green_png_path: str):
    w, h, rgba = read_png_rgba(winter_png_path)
    out = bytearray(rgba)

    for y in range(h):
        yf = y / float(h)
        # Smoothly ramp mountain-to-valley green transition between yf=0.16 (high alpine snow line) and yf=0.36 (valley floor)
        valley_blend = max(0.0, min(1.0, (yf - 0.16) / 0.20))
        valley_blend = valley_blend * valley_blend * (3.0 - 2.0 * valley_blend) # Smoothstep!

        row_off = y * w * 4
        for x in range(w):
            idx = row_off + x * 4
            r, g, b, a = out[idx], out[idx+1], out[idx+2], out[idx+3]

            # Warmth: positive when pixel is warm (wood, cobblestone, sunset clouds, amber lanterns)
            warmth = (r - b) / 255.0
            lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255.0

            # Turquoise onsen pool in upper-left: g > r and b > r
            is_onsen = (0.38 < yf < 0.65 and 0.10 < (x / float(w)) < 0.45 and g > r + 8 and b > r + 6)
            if is_onsen:
                out[idx]   = int(max(0, min(255, r * 0.88)))
                out[idx+1] = int(max(0, min(255, g * 1.06 + 8)))
                out[idx+2] = int(max(0, min(255, b * 1.04 + 6)))
                continue

            # Preserve warm wood, golden sunset clouds, lanterns, and cobblestones smoothly
            warm_preserve = max(0.0, min(1.0, (warmth - 0.02) / 0.18))
            effect = valley_blend * (1.0 - warm_preserve)

            if effect > 0.001:
                # Convert cool snow/shadow luminance into lush storybook summer meadow & forest green
                # while keeping 100% of the original watercolor brushstroke luminance contrast!
                target_r = lum * 138.0 + 18.0
                target_g = lum * 196.0 + 28.0
                target_b = lum * 96.0  + 14.0

                nr = int(max(0, min(255, r * (1.0 - effect) + target_r * effect)))
                ng = int(max(0, min(255, g * (1.0 - effect) + target_g * effect)))
                nb = int(max(0, min(255, b * (1.0 - effect) + target_b * effect)))
                out[idx], out[idx+1], out[idx+2] = nr, ng, nb

    write_png_rgba(green_png_path, w, h, out)
    print(f"Created smooth Green Season 2.5D backdrop: {green_png_path} ({w}x{h})")

def slice_buildings_sheet(jpg_path: str, out_dir: str):
    os.makedirs(out_dir, exist_ok=True)
    tmp_png = os.path.join(out_dir, "_tmp_buildings.png")
    subprocess.run(["sips", "-s", "format", "png", jpg_path, "--out", tmp_png], check=True, stdout=subprocess.DEVNULL)
    w, h, full_rgba = read_png_rgba(tmp_png)
    os.remove(tmp_png)

    # 3 columns: Left (kominka_lodge), Center (tea_kiosk), Right (shrine_cedars)
    splits = [
        ("prop_kominka_lodge", 0, int(w * 0.39), 384),
        ("prop_tea_kiosk",     int(w * 0.39), int(w * 0.69), 320),
        ("prop_shrine_cedars", int(w * 0.69), w, 384),
    ]

    for name, x0, x1, target_sz in splits:
        cw = x1 - x0
        ch = h
        crop = bytearray(cw * ch * 4)
        for y in range(ch):
            s0 = (y * w + x0) * 4
            d0 = y * cw * 4
            crop[d0:d0 + cw * 4] = full_rgba[s0:s0 + cw * 4]

        visited = bytearray(cw * ch)
        q = deque()
        threshold = 236
        soft_threshold = 195

        def is_bg(idx4):
            r, g, b = crop[idx4], crop[idx4+1], crop[idx4+2]
            return r >= threshold and g >= threshold and b >= threshold and abs(r - g) < 20 and abs(g - b) < 20

        for x in range(cw):
            for y in (0, ch - 1):
                p = y * cw + x
                if not visited[p] and is_bg(p * 4):
                    visited[p] = 1
                    q.append((x, y))
        for y in range(ch):
            for x in (0, cw - 1):
                p = y * cw + x
                if not visited[p] and is_bg(p * 4):
                    visited[p] = 1
                    q.append((x, y))

        while q:
            cx, cy = q.popleft()
            crop[(cy * cw + cx) * 4 + 3] = 0
            for nx, ny in ((cx-1, cy), (cx+1, cy), (cx, cy-1), (cx, cy+1)):
                if 0 <= nx < cw and 0 <= ny < ch:
                    np = ny * cw + nx
                    if not visited[np] and is_bg(np * 4):
                        visited[np] = 1
                        q.append((nx, ny))

        # Clear interior pure-white gaps inside the torii gate or under porch posts
        for y in range(int(ch * 0.45), ch):
            for x in range(cw):
                p = y * cw + x
                if not visited[p] and is_bg(p * 4):
                    visited[p] = 1
                    crop[p * 4 + 3] = 0

        min_x, min_y = cw, ch
        max_x, max_y = -1, -1
        for y in range(1, ch - 1):
            for x in range(1, cw - 1):
                p = y * cw + x
                p4 = p * 4
                if crop[p4+3] > 0:
                    r, g, b = crop[p4], crop[p4+1], crop[p4+2]
                    if r >= soft_threshold and g >= soft_threshold and b >= soft_threshold:
                        if visited[p - 1] or visited[p + 1] or visited[p - cw] or visited[p + cw]:
                            lum = (r + g + b) / 3.0
                            crop[p4+3] = int(max(0.0, min(1.0, (248.0 - lum) / (248.0 - soft_threshold))) * 255)
                    if crop[p4+3] > 16:
                        if x < min_x: min_x = x
                        if x > max_x: max_x = x
                        if y < min_y: min_y = y
                        if y > max_y: max_y = y

        tw = max_x - min_x + 1
        th = max_y - min_y + 1
        side = int(max(tw, th) * 1.05)
        canvas = bytearray(side * side * 4)
        dx = (side - tw) // 2
        dy = side - int(side * 0.02) - th
        for y in range(th):
            s0 = ((min_y + y) * cw + min_x) * 4
            d0 = ((dy + y) * side + dx) * 4
            canvas[d0:d0 + tw * 4] = crop[s0:s0 + tw * 4]

        out_path = os.path.join(out_dir, f"{name}.png")
        write_png_rgba(out_path, side, side, canvas)
        subprocess.run(["sips", "-z", str(target_sz), str(target_sz), out_path, "--out", out_path], check=True, stdout=subprocess.DEVNULL)
        print(f"Created prop sprite: {out_path} ({target_sz}x{target_sz})")

# --- Storybook Illustrated Vector/Painterly Renderer for NPCs & Spirit Beasts ---
class StorybookCanvas:
    def __init__(self, w: int = 256, h: int = 256):
        self.w = w
        self.h = h
        self.buf = bytearray(w * h * 4)
        self.INK = (48, 34, 26, 255) # Warm dark-brown storybook ink outline

    def blend_pixel(self, x: int, y: int, r: int, g: int, b: int, a: float):
        if x < 0 or x >= self.w or y < 0 or y >= self.h or a <= 0.0:
            return
        idx = (y * self.w + x) * 4
        sa = max(0.0, min(1.0, a))
        da = self.buf[idx+3] / 255.0
        out_a = sa + da * (1.0 - sa)
        if out_a <= 0.0:
            return
        self.buf[idx]   = int((r * sa + self.buf[idx]   * da * (1.0 - sa)) / out_a)
        self.buf[idx+1] = int((g * sa + self.buf[idx+1] * da * (1.0 - sa)) / out_a)
        self.buf[idx+2] = int((b * sa + self.buf[idx+2] * da * (1.0 - sa)) / out_a)
        self.buf[idx+3] = int(out_a * 255)

    def fill_ellipse(self, cx: float, cy: float, rx: float, ry: float, fill_rgb, outline_w: float = 3.2, angle_deg: float = 0.0, rim_light: bool = True):
        rad = math.radians(angle_deg)
        ca, sa = math.cos(rad), math.sin(rad)
        max_r = int(max(rx, ry) + outline_w + 3)
        x0, x1 = max(0, int(cx - max_r)), min(self.w - 1, int(cx + max_r))
        y0, y1 = max(0, int(cy - max_r)), min(self.h - 1, int(cy + max_r))
        r, g, b = fill_rgb
        ink_r, ink_g, ink_b, _ = self.INK

        for y in range(y0, y1 + 1):
            dy = y - cy
            for x in range(x0, x1 + 1):
                dx = x - cx
                lx =  dx * ca + dy * sa
                ly = -dx * sa + dy * ca
                dist = math.sqrt((lx / rx) ** 2 + (ly / ry) ** 2)
                avg_r = (rx + ry) * 0.5
                outer_edge = 1.0 + (outline_w / avg_r)
                if dist <= outer_edge + (1.0 / avg_r):
                    if dist >= 1.0 - (0.5 / avg_r):
                        # Outline band
                        aa = max(0.0, min(1.0, (outer_edge + (1.0 / avg_r) - dist) * avg_r))
                        self.blend_pixel(x, y, ink_r, ink_g, ink_b, aa)
                    else:
                        # Gouache shaded interior (warm top-left rim light, soft bottom-right shadow)
                        shade = 1.0 - 0.14 * (lx / rx) - 0.18 * (ly / ry)
                        # Subtle painterly paper grain
                        grain = math.sin(x * 0.7) * math.cos(y * 0.7) * 0.025
                        shade += grain
                        if rim_light and (lx / rx) < -0.55 and (ly / ry) < -0.15:
                            shade += 0.14
                        pr = int(max(0, min(255, r * shade)))
                        pg = int(max(0, min(255, g * shade)))
                        pb = int(max(0, min(255, b * shade)))
                        self.blend_pixel(x, y, pr, pg, pb, 1.0)

    def fill_round_rect(self, cx: float, cy: float, hw: float, hh: float, rad_corner: float, fill_rgb, outline_w: float = 3.2, taper_top: float = 1.0):
        x0, x1 = max(0, int(cx - hw * 1.3 - outline_w - 2)), min(self.w - 1, int(cx + hw * 1.3 + outline_w + 2))
        y0, y1 = max(0, int(cy - hh - outline_w - 2)), min(self.h - 1, int(cy + hh + outline_w + 2))
        r, g, b = fill_rgb
        ink_r, ink_g, ink_b, _ = self.INK

        for y in range(y0, y1 + 1):
            dy = y - cy
            t = (dy + hh) / max(1.0, 2.0 * hh)
            cur_hw = hw * (taper_top + (1.0 - taper_top) * t)
            for x in range(x0, x1 + 1):
                dx = abs(x - cx) - max(0.0, cur_hw - rad_corner)
                ady = abs(dy) - max(0.0, hh - rad_corner)
                dist = math.hypot(max(dx, 0.0), max(ady, 0.0)) + min(max(dx, ady), 0.0) - rad_corner
                if dist <= outline_w + 1.0:
                    if dist >= -0.5:
                        aa = max(0.0, min(1.0, outline_w + 1.0 - dist))
                        self.blend_pixel(x, y, ink_r, ink_g, ink_b, aa)
                    else:
                        nx = (x - cx) / max(1.0, cur_hw)
                        ny = dy / max(1.0, hh)
                        shade = 1.0 - 0.12 * nx - 0.16 * ny
                        if nx < -0.6:
                            shade += 0.10
                        pr = int(max(0, min(255, r * shade)))
                        pg = int(max(0, min(255, g * shade)))
                        pb = int(max(0, min(255, b * shade)))
                        self.blend_pixel(x, y, pr, pg, pb, 1.0)

    def draw_line(self, x0: float, y0: float, x1: float, y1: float, thickness: float, rgb):
        steps = int(max(abs(x1 - x0), abs(y1 - y0)) * 2) + 1
        r, g, b = rgb
        for i in range(steps + 1):
            t = i / float(steps)
            px = x0 + (x1 - x0) * t
            py = y0 + (y1 - y0) * t
            self.fill_ellipse(px, py, thickness, thickness, (r, g, b), outline_w=0.0, rim_light=False)

    def save(self, path: str):
        write_png_rgba(path, self.w, self.h, self.buf)
        print(f"Saved Storybook sprite: {path}")

def build_npc_and_enemy_sprites(out_dir: str):
    os.makedirs(out_dir, exist_ok=True)
    ink = (48, 34, 26)

    # 1. Elder Kenzo (Village Historian & Anchor)
    c = StorybookCanvas(256, 256)
    # Gnarled Hinoki wooden staff on right hand
    c.draw_line(182, 74, 174, 240, 5.5, ink)
    c.draw_line(182, 74, 174, 240, 3.2, (148, 102, 58))
    c.fill_ellipse(184, 72, 9, 8, (158, 110, 62), 2.8)
    # Boots
    c.fill_ellipse(106, 232, 16, 11, (92, 64, 44), 3.2)
    c.fill_ellipse(146, 232, 16, 11, (92, 64, 44), 3.2)
    # Hakama trousers
    c.fill_round_rect(126, 192, 34, 34, 8, (64, 72, 84), 3.2, taper_top=0.85)
    # Straw snow-cape (mino) over shoulders
    c.fill_ellipse(126, 146, 54, 48, (206, 178, 118), 3.4)
    # Charcoal wool haori coat & vintage mountain sweater
    c.fill_round_rect(126, 152, 38, 42, 12, (76, 82, 92), 3.2, taper_top=0.82)
    c.fill_round_rect(126, 150, 20, 36, 6, (168, 68, 56), 2.5) # Warm crimson inner sweater
    # Head & warm ears
    c.fill_ellipse(126, 84, 30, 32, (242, 206, 178), 3.4)
    # Fluffy white hair & long wisdom beard
    c.fill_ellipse(126, 60, 31, 14, (240, 238, 232), 3.0)
    c.fill_ellipse(126, 114, 22, 24, (244, 242, 236), 3.0)
    c.fill_ellipse(116, 98, 10, 5, (244, 242, 236), 2.2)
    c.fill_ellipse(136, 98, 10, 5, (244, 242, 236), 2.2)
    # Round spectacles & kind eyes
    c.fill_ellipse(115, 82, 8, 8, (248, 245, 235), 2.4)
    c.fill_ellipse(137, 82, 8, 8, (248, 245, 235), 2.4)
    c.fill_ellipse(115, 82, 3, 3.5, ink, 0.0)
    c.fill_ellipse(137, 82, 3, 3.5, ink, 0.0)
    # Steaming mug of amazake in left hand
    c.fill_round_rect(98, 146, 11, 13, 4, (232, 220, 198), 2.8)
    c.fill_ellipse(92, 148, 9, 8, (242, 206, 178), 2.6)
    c.fill_ellipse(176, 132, 9, 8, (242, 206, 178), 2.6)
    c.save(os.path.join(out_dir, "npc_elder_kenzo.png"))

    # 2. Yuki (Hakuba Ski & Mountain Instructor)
    c = StorybookCanvas(256, 256)
    # Snowboard strapped behind back
    c.fill_ellipse(132, 142, 22, 78, (58, 148, 162), 3.2, angle_deg=-24)
    # Snow boots
    c.fill_ellipse(108, 232, 15, 11, (78, 54, 42), 3.2)
    c.fill_ellipse(144, 232, 15, 11, (78, 54, 42), 3.2)
    # Navy snow pants
    c.fill_round_rect(112, 196, 12, 30, 5, (54, 68, 92), 3.0)
    c.fill_round_rect(140, 196, 12, 30, 5, (54, 68, 92), 3.0)
    # Crimson & cream Hakuba Ski Patrol parka
    c.fill_round_rect(126, 148, 36, 40, 12, (208, 68, 62), 3.4, taper_top=0.85)
    c.fill_round_rect(126, 148, 12, 38, 4, (244, 238, 226), 2.4)
    # Head & cheerful smile
    c.fill_ellipse(126, 84, 28, 30, (246, 210, 184), 3.4)
    # Knit beanie & mirrored blue ski goggles on forehead
    c.fill_ellipse(126, 60, 30, 18, (224, 168, 58), 3.2)
    c.fill_round_rect(114, 64, 11, 8, 4, (88, 188, 232), 2.8)
    c.fill_round_rect(138, 64, 11, 8, 4, (88, 188, 232), 2.8)
    # Eyes & rosy cheeks
    c.fill_ellipse(115, 86, 3.5, 4.5, ink, 0.0)
    c.fill_ellipse(137, 86, 3.5, 4.5, ink, 0.0)
    c.fill_ellipse(106, 94, 5, 3, (238, 138, 128), 0.0)
    c.fill_ellipse(146, 94, 5, 3, (238, 138, 128), 0.0)
    # Clipboard in hand
    c.fill_round_rect(94, 152, 13, 17, 3, (178, 132, 84), 2.8)
    c.fill_round_rect(94, 153, 9, 13, 2, (248, 246, 240), 1.5)
    c.save(os.path.join(out_dir, "npc_ski_yuki.png"))

    # 3. Jigokudani Wild Snow Monkey Pest (with rolled onsen towel & Nagano apple/snowball!)
    c = StorybookCanvas(256, 256)
    # Fluffy tail & hind legs
    c.fill_ellipse(96, 224, 18, 12, (148, 132, 116), 3.2)
    c.fill_ellipse(156, 224, 18, 12, (148, 132, 116), 3.2)
    # Plump fluffy winter fur body
    c.fill_ellipse(126, 166, 48, 52, (168, 152, 134), 3.6)
    c.fill_ellipse(126, 172, 32, 36, (212, 198, 182), 0.0)
    # Fluffy head & ears
    c.fill_ellipse(84, 96, 12, 14, (158, 142, 124), 3.0)
    c.fill_ellipse(168, 96, 12, 14, (158, 142, 124), 3.0)
    c.fill_ellipse(126, 98, 42, 38, (176, 160, 142), 3.6)
    # Bright crimson macaque face
    c.fill_ellipse(126, 104, 28, 24, (226, 92, 86), 2.8)
    # Mischievous golden eyes & grin
    c.fill_ellipse(114, 98, 6, 6.5, (252, 218, 92), 2.4)
    c.fill_ellipse(138, 98, 6, 6.5, (252, 218, 92), 2.4)
    c.fill_ellipse(114, 98, 2.8, 3.0, ink, 0.0)
    c.fill_ellipse(138, 98, 2.8, 3.0, ink, 0.0)
    c.draw_line(116, 114, 136, 114, 2.4, ink)
    # Rolled-up white Onsen Towel balanced on its head!
    c.fill_round_rect(126, 62, 30, 12, 6, (248, 246, 242), 3.2)
    c.draw_line(106, 62, 146, 62, 1.8, (78, 128, 188)) # Traditional blue onsen stripe
    # Left hand holding a packed white Snowball
    c.fill_ellipse(74, 146, 16, 14, (158, 142, 124), 3.0)
    c.fill_ellipse(68, 130, 18, 18, (242, 248, 255), 3.2)
    # Right hand holding a stolen red Nagano Apple!
    c.fill_ellipse(178, 148, 16, 14, (158, 142, 124), 3.0)
    c.fill_ellipse(184, 134, 16, 15, (224, 58, 52), 3.2)
    c.fill_ellipse(188, 118, 6, 3, (88, 168, 72), 2.0)
    c.save(os.path.join(out_dir, "enemy_snow_monkey.png"))

    # 4. Sacred Japanese Serow / Kamoshika (Transformed Head Shinto Priest Spirit Beast!)
    c = StorybookCanvas(256, 256)
    # Sturdy cloven hooves & legs
    for lx in (82, 110, 148, 176):
        c.fill_round_rect(lx, 198, 10, 34, 5, (72, 78, 88), 3.2)
        c.fill_ellipse(lx, 232, 12, 8, (44, 48, 56), 3.0)
    # Majestic shaggy slate-and-silver body
    c.fill_ellipse(134, 154, 58, 42, (118, 128, 142), 3.6)
    c.fill_ellipse(104, 132, 34, 44, (228, 232, 238), 3.4) # Shaggy white mane/chest
    # Braided Shinto Shimenawa rope around neck with white paper Shide lightning zig-zags!
    c.fill_round_rect(104, 138, 34, 9, 5, (214, 172, 92), 3.2)
    for sx in (84, 104, 124):
        c.fill_round_rect(sx, 154, 7, 14, 2, (250, 250, 248), 2.6)
    # Head & curved black horns
    c.fill_ellipse(108, 52, 7, 22, (52, 56, 64), 3.0, angle_deg=22)
    c.fill_ellipse(124, 52, 7, 22, (52, 56, 64), 3.0, angle_deg=-15)
    c.fill_ellipse(96, 88, 34, 26, (128, 138, 152), 3.6, angle_deg=-10)
    c.fill_ellipse(74, 94, 16, 14, (74, 80, 90), 3.0) # Snout
    # Glowing Golden Spirit Eyes
    c.fill_ellipse(92, 82, 7, 5.5, (255, 215, 64), 2.6)
    c.fill_ellipse(92, 82, 2.5, 4.0, ink, 0.0)
    c.save(os.path.join(out_dir, "enemy_sacred_serow.png"))

    # 5. Caffeine-Deprived Moon Bear / Tsukinowaguma (Transformed Coffee Shop Owner Spirit Beast!)
    c = StorybookCanvas(256, 256)
    # Giant paws & legs
    c.fill_ellipse(96, 226, 22, 14, (54, 48, 46), 3.4)
    c.fill_ellipse(158, 226, 22, 14, (54, 48, 46), 3.4)
    # Massive round black-brown bear body
    c.fill_ellipse(128, 158, 64, 62, (64, 56, 54), 3.8)
    # Signature Golden Crescent-Moon Latte Art mark on chest!
    c.fill_ellipse(128, 146, 32, 22, (244, 212, 128), 2.8)
    c.fill_ellipse(128, 136, 26, 16, (64, 56, 54), 0.0, rim_light=False)
    # Round ears & sleepy bear head
    c.fill_ellipse(88, 64, 16, 16, (64, 56, 54), 3.4)
    c.fill_ellipse(168, 64, 16, 16, (64, 56, 54), 3.4)
    c.fill_ellipse(88, 64, 8, 8, (138, 102, 86), 0.0)
    c.fill_ellipse(168, 64, 8, 8, (138, 102, 86), 0.0)
    c.fill_ellipse(128, 88, 44, 36, (72, 62, 58), 3.6)
    c.fill_ellipse(128, 98, 20, 16, (168, 134, 112), 2.8) # Muzzle
    c.fill_ellipse(128, 92, 8, 6, (38, 32, 30), 2.0) # Nose
    # Sleepy half-closed eyes & barista glasses
    c.fill_ellipse(110, 82, 9, 7, (245, 240, 230), 2.6)
    c.fill_ellipse(146, 82, 9, 7, (245, 240, 230), 2.6)
    c.draw_line(102, 80, 118, 80, 2.5, ink)
    c.draw_line(138, 80, 154, 80, 2.5, ink)
    # Giant wooden espresso tamper / portafilter held in left paw
    c.fill_ellipse(68, 148, 18, 16, (64, 56, 54), 3.2)
    c.fill_round_rect(56, 126, 14, 22, 6, (168, 112, 68), 3.0)
    c.fill_round_rect(56, 148, 20, 7, 3, (192, 198, 206), 2.8)
    c.save(os.path.join(out_dir, "enemy_moon_bear.png"))

if __name__ == "__main__":
    brain_dir = "/Users/fozziethebeat/.gemini/antigravity/brain/04d7f3fa-3669-4cf1-bbd3-1c1059621170"
    world_dir = "/Users/fozziethebeat/devel/kt-villa/games/godot-test/assets/storybook/world"
    props_dir = "/Users/fozziethebeat/devel/kt-villa/games/godot-test/assets/storybook/props"
    entities_dir = "/Users/fozziethebeat/devel/kt-villa/games/godot-test/assets/storybook/entities"

    os.makedirs(world_dir, exist_ok=True)
    os.makedirs(props_dir, exist_ok=True)
    os.makedirs(entities_dir, exist_ok=True)

    # 1. Convert Winter 2.5D village background to 1280x720 PNG
    winter_jpg = os.path.join(brain_dir, "storybook_village_winter_bg_png_1792415477901.jpg")
    winter_png = os.path.join(world_dir, "village_winter_bg.png")
    subprocess.run(["sips", "-s", "format", "png", "-z", "720", "1280", winter_jpg, "--out", winter_png], check=True, stdout=subprocess.DEVNULL)
    print(f"Created Winter 2.5D backdrop: {winter_png} (1280x720)")

    # 2. Create matching Green Season 2.5D village background (1280x720)
    green_png = os.path.join(world_dir, "village_green_bg.png")
    make_green_season_village_bg(winter_png, green_png)

    # 3. Slice 3 Cozy Storybook architectural props
    buildings_jpg = os.path.join(brain_dir, "storybook_village_buildings_sheet_1792415480432.jpg")
    slice_buildings_sheet(buildings_jpg, props_dir)

    # 4. Build Cozy Storybook NPC & Spirit Beast sprites
    build_npc_and_enemy_sprites(entities_dir)
