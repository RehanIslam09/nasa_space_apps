import os
import time
import shutil
from playwright.sync_api import sync_playwright

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
OUTPUT_DIR = os.path.abspath("docs/screenshots_audio")
ARTIFACT_DIR = r"C:\Users\rehan\.gemini\antigravity\brain\bcc1ca90-e327-4161-a9da-7e4b29fc80a1"

def test_playing_hover():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=CHROME_PATH,
            headless=True,
            args=["--enable-webgl", "--no-sandbox", "--window-size=1440,960"]
        )
        page = browser.new_page(viewport={"width": 1440, "height": 960})
        page.goto("http://localhost:3001", timeout=30000)
        time.sleep(2.5)

        page.wait_for_selector("#audio-dock-console", timeout=15000)
        page.evaluate("""
            const el = document.getElementById('audio-dock-console');
            if (el) {
                el.scrollIntoView({ block: 'center', behavior: 'instant' });
            }
        """)
        time.sleep(1.0)

        # 1. Hover onto orb to show play button
        orb = page.locator(".group\\/orb").first
        orb_box = orb.bounding_box()
        page.mouse.move(orb_box["x"] + orb_box["width"] / 2, orb_box["y"] + orb_box["height"] / 2)
        time.sleep(0.5)

        # 2. Click play button
        play_btn = page.locator("button[aria-label*='Play soundscape']").first
        play_btn.click()
        time.sleep(1.0)

        # 3. Move cursor AWAY from the orb (to coordinates 100, 100)
        page.mouse.move(100, 100)
        time.sleep(0.6)

        # Save screenshot while audio is playing but cursor is removed
        out_playing_unhovered = os.path.join(OUTPUT_DIR, "console_playing_unhovered.png")
        page.screenshot(path=out_playing_unhovered)
        shutil.copy(out_playing_unhovered, os.path.join(ARTIFACT_DIR, "console_playing_unhovered.png"))
        print("Saved: console_playing_unhovered.png")

        # 4. Move cursor BACK onto the orb (should reveal the pause button)
        page.mouse.move(orb_box["x"] + orb_box["width"] / 2, orb_box["y"] + orb_box["height"] / 2)
        time.sleep(0.6)
        out_playing_hovered = os.path.join(OUTPUT_DIR, "console_playing_hovered.png")
        page.screenshot(path=out_playing_hovered)
        shutil.copy(out_playing_hovered, os.path.join(ARTIFACT_DIR, "console_playing_hovered.png"))
        print("Saved: console_playing_hovered.png")

        browser.close()

if __name__ == "__main__":
    test_playing_hover()
