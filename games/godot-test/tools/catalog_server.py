#!/usr/bin/env python3
"""
Lightweight Companion Server for Sprite Catalog.
Enables 1-click direct saving to tools/sprite_usage.json and automatically
triggers sync_game_assets.py to copy textures directly into Godot.
"""

import os
import sys
import json
import subprocess
from http.server import HTTPServer, SimpleHTTPRequestHandler

PORT = 8080
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
GAME_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, '..'))
USAGE_FILE = os.path.join(GAME_DIR, 'tools', 'sprite_usage.json')
SYNC_SCRIPT = os.path.join(GAME_DIR, 'tools', 'sync_game_assets.py')

class CatalogRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=GAME_DIR, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        if self.path == '/api/status':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            status_data = {
                "status": "ok",
                "usage_file": USAGE_FILE,
                "game_dir": GAME_DIR
            }
            self.wfile.write(json.dumps(status_data).encode('utf-8'))
            return
        elif self.path == '/' or self.path == '/catalog':
            self.send_response(302)
            self.send_header('Location', '/tools/sprite_catalog.html')
            self.end_headers()
            return

        super().do_GET()

    def do_POST(self):
        if self.path == '/api/save':
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)

            try:
                data = json.loads(body.decode('utf-8'))
                
                # Write to sprite_usage.json
                with open(USAGE_FILE, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2)

                print(f"[CatalogServer] Successfully saved to {USAGE_FILE}")

                # Automatically trigger sync_game_assets.py
                sync_output = ""
                if os.path.exists(SYNC_SCRIPT):
                    res = subprocess.run(
                        [sys.executable, SYNC_SCRIPT],
                        cwd=GAME_DIR,
                        capture_output=True,
                        text=True
                    )
                    sync_output = res.stdout
                    print(f"[CatalogServer] Synced assets:\n{sync_output.strip()}")

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                resp = {
                    "status": "ok",
                    "message": "Saved to tools/sprite_usage.json and synced assets!",
                    "details": sync_output.strip()
                }
                self.wfile.write(json.dumps(resp).encode('utf-8'))
            except Exception as e:
                print(f"[CatalogServer] Error saving: {e}")
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                resp = {
                    "status": "error",
                    "error": str(e)
                }
                self.wfile.write(json.dumps(resp).encode('utf-8'))
            return

        self.send_response(404)
        self.end_headers()

def run_server():
    server = HTTPServer(('127.0.0.1', PORT), CatalogRequestHandler)
    print(f"==================================================")
    print(f"🚀 Sprite Catalog Companion Server running at:")
    print(f"   http://127.0.0.1:{PORT}/tools/sprite_catalog.html")
    print(f"   Listening for direct saves to: {USAGE_FILE}")
    print(f"==================================================")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        server.server_close()

if __name__ == '__main__':
    run_server()
