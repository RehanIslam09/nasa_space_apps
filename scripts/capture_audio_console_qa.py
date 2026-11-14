import os
import time
import shutil
from playwright.sync_api import sync_playwright

CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
OUTPUT_DIR = os.path.abspath("docs/screenshots")
ARTIFACT_DIR = r"C:\Users\rehan\.gemini\antigravity\brain\bcc1ca90-e327-4161-a9da-7e4b29fc80a1"
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(ARTIFACT_DIR, exist_ok=True)

def run():
    print("=" * 60)
    print("RUNNING AUDIO DOCK CONSOLE COMPREHENSIVE QA SCREENSHOT CAPTURE")
    print("=" * 60)

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=CHROME_PATH,
            headless=True,
            args=[
                "--enable-webgl",
                "--enable-webgl2-compute-context",
                "--ignore-gpu-blocklist",
                "--enable-gpu-rasterization",
                "--no-sandbox",
                "--use-gl=angle",
                "--window-size=1440,960",
            ]
        )

        page = browser.new_page(viewport={"width": 1440, "height": 960})

        print("1. Loading http://localhost:3000...")
        page.goto("http://localhost:3000")
        time.sleep(3.0)

        # Scroll to #jukebox section
        print("Scrolling to #jukebox section...")
        page.evaluate("document.getElementById('jukebox')?.scrollIntoView({ behavior: 'instant' })")
        time.sleep(1.5)

        # Wait for AudioDockConsole container
        console_el = page.wait_for_selector(".apple-glass", timeout=15000)
        print("AudioDockConsole found! Waiting 2s for animations...")
        time.sleep(2.0)

        def save_console_shot(filename):
            time.sleep(1.0)
            page.evaluate("document.querySelector('.apple-glass')?.scrollIntoView({ block: 'center' })")
            time.sleep(0.5)
            out = os.path.join(OUTPUT_DIR, filename)
            page.screenshot(path=out)
            shutil.copy(out, os.path.join(ARTIFACT_DIR, filename))
            print(f"-> Saved: {filename}")

        # 1. Resting State (Idle breathing visualizer + 2-pane console)
        print("Capturing 21: Resting Idle State...")
        save_console_shot("21_audio_console_resting_idle.png")

        # 2. Click Play Pill (Live Soundscape)
        print("Capturing 22: Live Soundscape Playing...")
        play_btn = page.locator("button:has-text('Hear Earth Audio')")
        if play_btn.is_visible():
            play_btn.click()
            time.sleep(1.5)
        save_console_shot("22_audio_console_playing_active.png")

        # 3. Open Mixer Drawer (Constituent Layer Synthesizer)
        print("Capturing 23: Mixer Drawer...")
        mixer_btn = page.locator("button[aria-label*='Toggle Constituent Layer Synthesizer Mixer']")
        mixer_btn.click()
        time.sleep(1.2)
        save_console_shot("23_audio_console_mixer_drawer.png")

        # 4. Open Space 2D Audio Drawer
        print("Capturing 24: Spatial 2D Earth Field Drawer...")
        space_btn = page.locator("button[aria-label*='Toggle Spatial Audio and Planetary Field']")
        space_btn.click()
        time.sleep(1.2)
        # Click on 2D pad to move puck
        pad = page.locator("div[aria-label*='2D Planetary Spatial Position']")
        if pad.is_visible():
            box = pad.bounding_box()
            if box:
                page.mouse.click(box["x"] + box["width"] * 0.7, box["y"] + box["height"] * 0.3)
                time.sleep(0.5)
        save_console_shot("24_audio_console_space_2d_field.png")

        # 5. Open Science Legend Drawer
        print("Capturing 25: Science Legend Drawer...")
        science_btn = page.locator("button[aria-label*='Toggle Scientific Interpretation & Audio Legend']")
        science_btn.click()
        time.sleep(1.5)
        save_console_shot("25_audio_console_science_legend.png")

        # 6. Open Access & Sensory Settings Drawer
        print("Capturing 26: Access & Sensory Settings Drawer...")
        access_btn = page.locator("button[aria-label*='Toggle Accessibility & Sensory Settings']")
        access_btn.click()
        time.sleep(1.2)
        save_console_shot("26_audio_console_access_sensory.png")

        # 7. Press Escape Key to Dismiss
        print("Capturing 27: Escape Key Dismiss...")
        page.keyboard.press("Escape")
        time.sleep(1.0)
        save_console_shot("27_audio_console_escape_dismissed.png")

        # 8. Mobile Viewport (390 x 844)
        print("Capturing 28: Mobile Viewport 390x844...")
        page.set_viewport_size({"width": 390, "height": 844})
        time.sleep(1.0)
        page.evaluate("document.querySelector('.apple-glass')?.scrollIntoView({ block: 'center' })")
        time.sleep(0.5)
        save_console_shot("28_audio_console_mobile_responsive.png")

        browser.close()
        print("=" * 60)
        print("AUDIO DOCK CONSOLE QA COMPLETE: ALL 8 SCREENSHOTS SAVED!")
        print("=" * 60)

if __name__ == "__main__":
    run()
