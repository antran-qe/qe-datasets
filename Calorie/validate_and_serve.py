#!/usr/bin/env python3
import argparse
import http.server
import json
import os
import socketserver
import sys
import threading
import time
import webbrowser
from pathlib import Path


WORKSPACE_ROOT = Path(__file__).resolve().parents[1]
CALORIE_DIR = WORKSPACE_ROOT / 'Calorie'
RESULTS_DIR = CALORIE_DIR / 'test-results'
DATA_FILE = CALORIE_DIR / 'data_output.json'
GALLERY_FILE = CALORIE_DIR / 'index.html'


def read_json(path: Path):
    with path.open('r', encoding='utf-8') as f:
        return json.load(f)


def validate():
    if not DATA_FILE.exists():
        print(f"[ERROR] Missing {DATA_FILE}")
        return 1
    if not RESULTS_DIR.exists():
        print(f"[ERROR] Missing {RESULTS_DIR}")
        return 1

    base_data = read_json(DATA_FILE)
    id_to_item = {str(item.get('item_id')): item for item in base_data}

    result_files = sorted(RESULTS_DIR.glob('*.json'))
    if not result_files:
        print(f"[WARN] No result files found in {RESULTS_DIR}")
        return 0

    print(f"Validating {len(result_files)} result file(s) against {DATA_FILE.name} ({len(base_data)} items)\n")

    exit_code = 0
    for rf in result_files:
        try:
            doc = read_json(rf)
        except Exception as e:
            print(f"[FAIL] {rf.name}: cannot parse JSON: {e}")
            exit_code = 2
            continue

        results = doc.get('results') or []
        meta = doc.get('metadata') or {}
        summary = doc.get('summary') or {}

        missing_ids = 0
        missing_images = 0
        ok_count = 0
        fail_count = 0
        total = len(results)

        for entry in results:
            orig = (entry or {}).get('original_data') or {}
            api = (entry or {}).get('api_result') or {}
            proc = (entry or {}).get('processing_info') or {}

            item_id = str(orig.get('item_id'))
            base_item = id_to_item.get(item_id)
            if not base_item:
                missing_ids += 1
            else:
                img_path = base_item.get('img_location') or ''
                if img_path:
                    # resolve relative to CALORIE_DIR
                    img_file = (CALORIE_DIR / img_path).resolve()
                    if not img_file.exists():
                        missing_images += 1

            kcal = api.get('total_calories')
            success = proc.get('success')
            if isinstance(success, bool):
                if success:
                    ok_count += 1
                else:
                    fail_count += 1
            else:
                # fallback: assume present calories means ok
                (ok_count if isinstance(kcal, (int, float)) else fail_count)

        run_name = meta.get('completed_at') or rf.name
        print(f"- {run_name}")
        print(f"  File: {rf.name}")
        print(f"  Items: {total}")
        if summary:
            print(f"  Summary: processed={summary.get('total_processed')} success={summary.get('successful_api_calls')} fail={summary.get('failed_api_calls')}")
        print(f"  Checks: missing_ids={missing_ids} missing_images={missing_images} ok={ok_count} fail={fail_count}\n")

    return exit_code


class QuietHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass


def serve(port: int, open_browser: bool):
    os.chdir(WORKSPACE_ROOT)
    handler = QuietHTTPRequestHandler
    with socketserver.TCPServer(("127.0.0.1", port), handler) as httpd:
        url = f"http://127.0.0.1:{port}/Calorie/{GALLERY_FILE.name}"
        print(f"Serving {WORKSPACE_ROOT} at {url}")
        if open_browser:
            # slight delay to ensure server is ready
            threading.Timer(0.5, lambda: webbrowser.open(url)).start()
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down...")


def main(argv=None):
    parser = argparse.ArgumentParser(description='Validate Calorie test results and optionally serve the gallery.')
    parser.add_argument('--serve', action='store_true', help='Start a local static server after validation')
    parser.add_argument('--port', type=int, default=8000, help='Port for the static server (default: 8000)')
    parser.add_argument('--no-browser', action='store_true', help='Do not open a browser when serving')
    args = parser.parse_args(argv)

    code = validate()
    if args.serve:
        serve(args.port, not args.no_browser)
    sys.exit(code)


if __name__ == '__main__':
    main()


