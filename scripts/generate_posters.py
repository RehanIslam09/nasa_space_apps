import os
import cv2

VIDEOS_DIR = r"C:\Users\rehan\Hackathons\Nasa_Space_Apps\workspace\nasa_experience\frontend\public\videos"
POSTERS_DIR = os.path.join(VIDEOS_DIR, "posters")
os.makedirs(POSTERS_DIR, exist_ok=True)

# Dataset mapping: (dataset_id, video_name, start_sec)
CARD_POSTERS = [
    ("geos-aerosols", "hurricane_video.mp4", 0.5),
    ("ocean-currents-temp", "deep_ocean_video.mp4", 1.0),
    ("night-lights", "cool_video_happy.mp4", 5.0),
    ("air-quality", "hurricane_video.mp4", 18.0),
    ("perpetual-ocean", "deep_ocean_video.mp4", 17.0),
    ("dyamond-co2", "polar_video.mp4", 7.0),
    ("lightning-iss", "hurricane_video.mp4", 25.0),
    ("atmospheric-river", "deep_ocean_video.mp4", 23.0),
    ("gedi-forest", "cool_video_happy.mp4", 1.0),
    ("caldwell-73", "cool_video_happy.mp4", 11.0),
    ("earth-info-center", "polar_video.mp4", 2.0),
]

for card_id, vname, sec in CARD_POSTERS:
    vpath = os.path.join(VIDEOS_DIR, vname)
    cap = cv2.VideoCapture(vpath)
    if not cap.isOpened():
        print(f"Error opening {vname}")
        continue
    
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_idx = int(fps * sec)
    cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
    ret, frame = cap.read()
    if ret:
        out_path = os.path.join(POSTERS_DIR, f"{card_id}.jpg")
        cv2.imwrite(out_path, frame, [int(cv2.IMWRITE_JPEG_QUALITY), 90])
        print(f"Generated poster for {card_id} at {sec}s -> {out_path}")
    else:
        print(f"Failed to read frame at {sec}s in {vname}")
    cap.release()
