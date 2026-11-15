import os
import time
import shutil
from playwright.sync_api import sync_playwright

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
OUTPUT_DIR = os.path.abspath("docs/screenshots_audio")
ARTIFACT_DIR = r"C:\Users\rehan\.gemini\antigravity\brain\bcc1ca90-e327-4161-a9da-7e4b29fc80a1"

def verify_hover():
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

        # 1. State without cursor on the orb (clean orb view)
        # Move mouse to top left of screen (outside console orb)
        page.mouse.move(50, 50)
        time.sleep(0.5)
        out_clean = os.path.join(OUTPUT_DIR, "console_orb_clean_unhovered.png")
        page.screenshot(path=out_clean)
        shutil.copy(out_clean, os.path.join(ARTIFACT_DIR, "console_orb_clean_unhovered.png"))
        print("Saved: console_orb_clean_unhovered.png")

        # 2. State with cursor hovering on the orb (revealing the play button)
        orb = page.locator(".group\\/orb").first
        orb_box = orb.bounding_box()
        if orb_box:
            # Move cursor directly to center of orb
            page.mouse.move(orb_box["x"] + orb_box["width"] / 2, orb_box["y"] + orb_box["height"] / 2)
            time.sleep(0.6)
            out_hover = os.path.join(OUTPUT_DIR, "console_orb_hovered_button.png")
            page.screenshot(path=out_hover)
            shutil.copy(out_hover, os.path.join(ARTIFACT_DIR, "console_orb_hovered_button.png"))
            print("Saved: console_orb_hovered_button.png")

        browser.close()

if __name__ == "__main__":
    verify_hover()
