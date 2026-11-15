import os
import cv2

VIDEOS_DIR = r"C:\Users\rehan\Hackathons\Nasa_Space_Apps\workspace\nasa_experience\frontend\public\videos"
POSTERS_DIR = os.path.join(VIDEOS_DIR, "posters")
os.makedirs(POSTERS_DIR, exist_ok=True)

videos = [
    "cool_video_happy.mp4",
    "deep_ocean_video.mp4",
    "hurricane_video.mp4",
    "polar_video.mp4"
]

for vname in videos:
    vpath = os.path.join(VIDEOS_DIR, vname)
    cap = cv2.VideoCapture(vpath)
    if not cap.isOpened():
        print(f"Error opening {vname}")
        continue
    
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    duration = frame_count / fps if fps > 0 else 0
    
    print(f"\n==========================================")
    print(f"VIDEO: {vname}")
    print(f"Resolution: {width}x{height}")
    print(f"FPS: {fps:.2f}")
    print(f"Frame count: {frame_count}")
    print(f"Duration: {duration:.2f} seconds")
    
    # Sample 4 frames at 10%, 35%, 65%, 90%
    sample_percentages = [0.10, 0.35, 0.65, 0.90]
    for p in sample_percentages:
        frame_idx = int(frame_count * p)
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
        ret, frame = cap.read()
        if ret:
            sec = frame_idx / fps
            out_img = os.path.join(POSTERS_DIR, f"{vname.replace('.mp4', '')}_sec_{int(sec)}.jpg")
            cv2.imwrite(out_img, frame)
            # Calculate average brightness / dominant color
            avg_color_bgr = frame.mean(axis=(0, 1))
            print(f"  Frame at {sec:.1f}s ({p*100:.0f}%): Mean BGR = ({avg_color_bgr[0]:.1f}, {avg_color_bgr[1]:.1f}, {avg_color_bgr[2]:.1f}) -> Saved {os.path.basename(out_img)}")
    
    cap.release()
