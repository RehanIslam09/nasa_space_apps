import os
import time
import shutil
from playwright.sync_api import sync_playwright

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
OUT_DIR = os.path.abspath("docs/screenshots_audio")
ARTIFACT_DIR = r"C:\Users\rehan\.gemini\antigravity\brain\bcc1ca90-e327-4161-a9da-7e4b29fc80a1"

os.makedirs(OUT_DIR, exist_ok=True)
os.makedirs(ARTIFACT_DIR, exist_ok=True)

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=CHROME_PATH,
            headless=True,
            args=["--enable-webgl", "--no-sandbox", "--window-size=1440,960"]
        )
        page = browser.new_page(viewport={"width": 1440, "height": 960})
        
        print("Navigating to http://localhost:3000...")
        page.goto("http://localhost:3000", timeout=30000)
        time.sleep(3.0)

        page.wait_for_selector("#audio-dock-console", timeout=15000)
        page.evaluate("""
            const el = document.getElementById('audio-dock-console');
            if (el) {
                el.scrollIntoView({ block: 'center', behavior: 'instant' });
            }
        """)
        time.sleep(1.5)

        presets = [
            ("Calm Earth", "mood_calm_earth.png"),
            ("Deep Ocean", "mood_deep_ocean.png"),
            ("Storm Dynamics", "mood_storm_dynamics.png"),
            ("Planetary Fever", "mood_planetary_fever.png"),
        ]

        for name, filename in presets:
            print(f"Selecting preset: {name}")
            btn = page.locator(f"button:has-text('{name}')").first
            btn.click()
            time.sleep(1.5)

            out_path = os.path.join(OUT_DIR, filename)
            art_path = os.path.join(ARTIFACT_DIR, filename)
            page.screenshot(path=out_path)
            shutil.copy(out_path, art_path)
            print(f"Saved: {filename}")

        browser.close()

if __name__ == "__main__":
    run()
