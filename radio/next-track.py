import os
import sys
import json
import random

def main():
    if len(sys.argv) < 2:
        print("Error: missing playlist type argument", file=sys.stderr)
        sys.exit(1)

    playlist_type = sys.argv[1] # 'featured' or 'normal'
    music_dir = f"/music/unified/{playlist_type}"
    history_file = "/music/recent_tracks.json"

    # 1. List files in the target directory
    if not os.path.exists(music_dir):
        print(f"Error: directory {music_dir} does not exist", file=sys.stderr)
        sys.exit(1)

    valid_extensions = ('.mp3', '.wav', '.ogg', '.flac', '.m4a')
    files = [f for f in os.listdir(music_dir) if f.lower().endswith(valid_extensions)]

    if not files:
        print(f"Warning: no tracks in {music_dir}", file=sys.stderr)
        sys.exit(1)

    # 2. Load recent history
    history = []
    if os.path.exists(history_file):
        try:
            with open(history_file, 'r') as h:
                history = json.load(h)
                if not isinstance(history, list):
                    history = []
        except Exception as e:
            print(f"Warning: failed to read history: {e}", file=sys.stderr)
            history = []

    # 3. Calculate dynamic cooldown limit based on global unique files
    total_files_list = []
    for pt in ['featured', 'normal']:
        pt_dir = f"/music/unified/{pt}"
        if os.path.exists(pt_dir):
            total_files_list.extend([f for f in os.listdir(pt_dir) if f.lower().endswith(valid_extensions)])
    
    global_unique_files = list(set(total_files_list))
    total_unique = len(global_unique_files)

    # Cooldown window is at most 10 tracks, but limited to total_unique - 1 to prevent deadlock
    cooldown_limit = min(10, max(0, total_unique - 1))

    # 4. Filter out recent tracks
    recent_history = history[-cooldown_limit:] if cooldown_limit > 0 else []
    candidates = [f for f in files if f not in recent_history]

    if not candidates:
        candidates = files

    # 5. Select a random candidate
    selected_file = random.choice(candidates)
    selected_path = os.path.join(music_dir, selected_file)

    # 6. Update global history
    history.append(selected_file)
    history = history[-10:]

    # 7. Write history back
    try:
        with open(history_file, 'w') as h:
            json.dump(history, h)
    except Exception as e:
        print(f"Warning: failed to write history: {e}", file=sys.stderr)

    print(selected_path)

if __name__ == "__main__":
    main()
