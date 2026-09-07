#!/usr/bin/env python3
"""
Sync mapped sprites from Kenney asset packs to Godot runtime assets/sprites directory
based on the mappings recorded in tools/sprite_usage.json.
"""

import os
import json
import shutil
import subprocess

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
GAME_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, '..'))
USAGE_FILE = os.path.join(GAME_DIR, 'tools', 'sprite_usage.json')
KENNEY_DIR = os.path.join(GAME_DIR, 'assets', 'kenney')
SPRITES_DIR = os.path.join(GAME_DIR, 'assets', 'sprites')
BUILD_SCRIPT = os.path.join(os.path.expanduser('~'), '.gemini/antigravity/brain/2e98373e-80e6-4642-8ce4-2447fb6cf882/scratch/build_full_catalog.py')

def sync_assets():
    if not os.path.exists(USAGE_FILE):
        print(f"Error: {USAGE_FILE} not found.")
        return

    with open(USAGE_FILE, 'r') as f:
        data = json.load(f)

    os.makedirs(SPRITES_DIR, exist_ok=True)
    synced_count = 0

    # Map items based on usages
    for u in data.get('usages', []):
        if u.get('project') != 'godot-test':
            continue
        
        entity_type = u.get('entity_type')
        pack = u.get('pack')
        tile = u.get('tile_name')

        # Locate source tile file in kenney folder
        src_path = None
        for root, dirs, files in os.walk(os.path.join(KENNEY_DIR, pack)):
            target_filename = f"{tile}.png"
            if target_filename in files:
                src_path = os.path.join(root, target_filename)
                break

        if not src_path or not os.path.exists(src_path):
            continue

        # Determine target file name in assets/sprites/
        dest_filename = None
        role = u.get('role', '')
        if 'Apple' in role:
            dest_filename = 'item_apple.png'
        elif 'Ski Pass' in role:
            dest_filename = 'item_skipass.png'
        elif 'Tea' in role:
            dest_filename = 'item_tea.png'
        elif 'Charm' in role:
            dest_filename = 'item_charm.png'

        if dest_filename:
            dest_path = os.path.join(SPRITES_DIR, dest_filename)
            shutil.copyfile(src_path, dest_path)
            print(f"Synced {pack}/{tile}.png -> assets/sprites/{dest_filename}")
            synced_count += 1

    print(f"Successfully synced {synced_count} game asset sprites!")

    # Also re-run catalog builder if available
    if os.path.exists(BUILD_SCRIPT):
        subprocess.run(['python3', BUILD_SCRIPT], cwd=GAME_DIR)

if __name__ == '__main__':
    sync_assets()
