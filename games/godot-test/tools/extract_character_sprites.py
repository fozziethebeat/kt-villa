#!/usr/bin/env python3
"""
Pure-Python + sips sprite sheet slicer & exterior background flood-fill remover.
Requires zero external pip packages!
"""
import os
import struct
import subprocess
import zlib
from collections import deque

def read_png_rgba(path: str):
    """Reads an 8-bit RGB or RGBA PNG file into (width, height, bytearray of RGBA)."""
    with open(path, "rb") as f:
        data = f.read()
    assert data[:8] == b"\x89PNG\r\n\x1a\n", "Not a valid PNG"
    pos = 8
    width = height = bit_depth = color_type = 0
    idat_chunks = []
    while pos < len(data):
        length = struct.unpack(">I", data[pos:pos+4])[0]
        chunk_type = data[pos+4:pos+8]
        chunk_data = data[pos+8:pos+8+length]
        pos += 12 + length
        if chunk_type == b"IHDR":
            width, height, bit_depth, color_type, comp, filt, interlace = struct.unpack(">IIBBBBB", chunk_data)
            assert bit_depth == 8 and interlace == 0, f"Unsupported PNG format: depth={bit_depth}, interlace={interlace}"
        elif chunk_type == b"IDAT":
            idat_chunks.append(chunk_data)
        elif chunk_type == b"IEND":
            break

    raw = zlib.decompress(b"".join(idat_chunks))
    bpp = 4 if color_type == 6 else 3
    stride = width * bpp
    rgba = bytearray(width * height * 4)

    prev_row = bytearray(stride)
    cur_row = bytearray(stride)
    raw_pos = 0

    for y in range(height):
        filter_type = raw[raw_pos]
        raw_pos += 1
        cur_row[:] = raw[raw_pos:raw_pos + stride]
        raw_pos += stride

        if filter_type == 1: # Sub
            for i in range(bpp, stride):
                cur_row[i] = (cur_row[i] + cur_row[i - bpp]) & 0xFF
        elif filter_type == 2: # Up
            for i in range(stride):
                cur_row[i] = (cur_row[i] + prev_row[i]) & 0xFF
        elif filter_type == 3: # Average
            for i in range(stride):
                left = cur_row[i - bpp] if i >= bpp else 0
                up = prev_row[i]
                cur_row[i] = (cur_row[i] + ((left + up) >> 1)) & 0xFF
        elif filter_type == 4: # Paeth
            for i in range(stride):
                a = cur_row[i - bpp] if i >= bpp else 0
                b = prev_row[i]
                c = prev_row[i - bpp] if i >= bpp else 0
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                cur_row[i] = (cur_row[i] + pr) & 0xFF

        out_row_start = y * width * 4
        if bpp == 4:
            rgba[out_row_start:out_row_start + width * 4] = cur_row
        else:
            for x in range(width):
                 rgba[out_row_start + x*4 + 0] = cur_row[x*3 + 0]
                 rgba[out_row_start + x*4 + 1] = cur_row[x*3 + 1]
                 rgba[out_row_start + x*4 + 2] = cur_row[x*3 + 2]
                 rgba[out_row_start + x*4 + 3] = 255
        prev_row[:] = cur_row

    return width, height, rgba

def write_png_rgba(path: str, width: int, height: int, rgba: bytearray):
    """Writes an RGBA bytearray to a valid PNG file."""
    def make_chunk(chunk_type: bytes, chunk_data: bytes) -> bytes:
        crc = zlib.crc32(chunk_type + chunk_data) & 0xFFFFFFFF
        return struct.pack(">I", len(chunk_data)) + chunk_type + chunk_data + struct.pack(">I", crc)

    raw_rows = bytearray()
    stride = width * 4
    for y in range(height):
        raw_rows.append(0) # Filter type 0 (None)
        row_start = y * stride
        raw_rows.extend(rgba[row_start:row_start + stride])

    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    idat = zlib.compress(bytes(raw_rows), 6)

    with open(path, "wb") as f:
        f.write(b"\x89PNG\r\n\x1a\n")
        f.write(make_chunk(b"IHDR", ihdr))
        f.write(make_chunk(b"IDAT", idat))
        f.write(make_chunk(b"IEND", b""))

def slice_and_clean(w: int, h: int, full_rgba: bytearray, x0: int, x1: int, threshold: int = 236, soft_threshold: int = 195):
    cw = x1 - x0
    ch = h
    crop = bytearray(cw * ch * 4)
    for y in range(ch):
        src_start = (y * w + x0) * 4
        dst_start = y * cw * 4
        crop[dst_start:dst_start + cw * 4] = full_rgba[src_start:src_start + cw * 4]

    visited = bytearray(cw * ch)
    q = deque()

    def is_bg(idx4):
        r, g, b = crop[idx4], crop[idx4+1], crop[idx4+2]
        return r >= threshold and g >= threshold and b >= threshold and abs(r - g) < 20 and abs(g - b) < 20

    # Seed all 4 borders
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
        p4 = (cy * cw + cx) * 4
        crop[p4+3] = 0
        for nx, ny in ((cx-1, cy), (cx+1, cy), (cx, cy-1), (cx, cy+1)):
            if 0 <= nx < cw and 0 <= ny < ch:
                np = ny * cw + nx
                if not visited[np] and is_bg(np * 4):
                    visited[np] = 1
                    q.append((nx, ny))

    # Also clear any pure-white enclosed cutouts in the lower half (y > ch * 0.45, e.g. between legs)
    # or right-hand side (x > cw * 0.62, e.g. between extended arm/book and torso)
    # where the white blouse collar (top-center) does not exist!
    for y in range(int(ch * 0.43), ch):
        for x in range(cw):
            p = y * cw + x
            if not visited[p] and is_bg(p * 4):
                visited[p] = 1
                crop[p * 4 + 3] = 0

    for y in range(int(ch * 0.25), int(ch * 0.55)):
        for x in range(int(cw * 0.58), cw):
            p = y * cw + x
            if not visited[p] and is_bg(p * 4):
                visited[p] = 1
                crop[p * 4 + 3] = 0

    # Feather 1px edge next to exterior transparent pixels + compute tight bbox
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
                        alpha = int(max(0.0, min(1.0, (248.0 - lum) / (248.0 - soft_threshold))) * 255)
                        crop[p4+3] = alpha
                if crop[p4+3] > 16:
                    if x < min_x: min_x = x
                    if x > max_x: max_x = x
                    if y < min_y: min_y = y
                    if y > max_y: max_y = y

    # Create square canvas so character is bottom-center aligned with consistent scale
    tw = max_x - min_x + 1
    th = max_y - min_y + 1
    side = int(max(tw, th) * 1.06)
    canvas = bytearray(side * side * 4)
    dest_x = (side - tw) // 2
    dest_y = side - int(side * 0.03) - th

    for y in range(th):
        src_start = ((min_y + y) * cw + min_x) * 4
        dst_start = ((dest_y + y) * side + dest_x) * 4
        canvas[dst_start:dst_start + tw * 4] = crop[src_start:src_start + tw * 4]

    return side, side, canvas

def process_sheet(jpg_path: str, out_dir: str, prefix: str):
    os.makedirs(out_dir, exist_ok=True)
    tmp_png = os.path.join(out_dir, f"_tmp_{prefix}.png")
    subprocess.run(["sips", "-s", "format", "png", jpg_path, "--out", tmp_png], check=True, stdout=subprocess.DEVNULL)

    w, h, full_rgba = read_png_rgba(tmp_png)
    os.remove(tmp_png)

    splits = [
        ("idle",   0, int(w * 0.31)),
        ("walk",   int(w * 0.31), int(w * 0.63)),
        ("battle", int(w * 0.63), w),
    ]

    for pose_name, x0, x1 in splits:
        sw, sh, canvas = slice_and_clean(w, h, full_rgba, x0, x1)
        out_path = os.path.join(out_dir, f"{prefix}_{pose_name}.png")
        write_png_rgba(out_path, sw, sh, canvas)
        # Resize smoothly to 256x256 using sips
        subprocess.run(["sips", "-z", "256", "256", out_path, "--out", out_path], check=True, stdout=subprocess.DEVNULL)
        print(f"Created {out_path} (256x256 RGBA)")

if __name__ == "__main__":
    brain_dir = "/Users/fozziethebeat/.gemini/antigravity/brain/04d7f3fa-3669-4cf1-bbd3-1c1059621170"
    out_dir = "/Users/fozziethebeat/devel/kt-villa/games/godot-test/assets/sprites/characters/burnout_female"

    winter_sheet = os.path.join(brain_dir, "burnout_female_winter_sheet_1792414492755.jpg")
    green_sheet = os.path.join(brain_dir, "burnout_female_green_sheet_1792414520387.jpg")

    process_sheet(winter_sheet, out_dir, "winter")
    process_sheet(green_sheet, out_dir, "green")
