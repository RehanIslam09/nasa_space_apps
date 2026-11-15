import os
import time
import shutil
from playwright.sync_api import sync_playwright

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
OUTPUT_DIR = os.path.abspath("docs/screenshots_audio")
ARTIFACT_DIR = r"C:\Users\rehan\.gemini\antigravity\brain\bcc1ca90-e327-4161-a9da-7e4b29fc80a1"
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(ARTIFACT_DIR, exist_ok=True)

def capture_after():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=CHROME_PATH,
            headless=True,
            args=["--enable-webgl", "--no-sandbox", "--window-size=1440,960"]
        )

        # ----------------- DESKTOP (1440x960) -----------------
        page = browser.new_page(viewport={"width": 1440, "height": 960})
        page.goto("http://localhost:3001", timeout=30000)
        time.sleep(2.5)

        page.wait_for_selector("#audio-dock-console", timeout=15000)

        def save_page(name):
            time.sleep(0.4)
            page.evaluate("""
                const el = document.getElementById('audio-dock-console');
                if (el) {
                    el.scrollIntoView({ block: 'center', behavior: 'instant' });
                }
            """)
            time.sleep(0.8)
            out = os.path.join(OUTPUT_DIR, name)
            page.screenshot(path=out)
            shutil.copy(out, os.path.join(ARTIFACT_DIR, name))
            print(f"Saved: {name}")

        # 1. Default (Mix Tab)
        save_page("console_after_default.png")

        # 2. Move Tab
        move_tab = page.locator("#tab-move")
        if move_tab.is_visible():
            move_tab.click()
            save_page("console_after_move.png")

        # 3. Learn Tab
        learn_tab = page.locator("#tab-learn")
        if learn_tab.is_visible():
            learn_tab.click()
            time.sleep(0.5)
            save_page("console_after_learn.png")

        # 4. Access Tab
        access_tab = page.locator("#tab-access")
        if access_tab.is_visible():
            access_tab.click()
            save_page("console_after_access.png")

        # 5. Shortcuts Dialog
        shortcuts_btn = page.locator("button[aria-label='View keyboard shortcuts']").first
        if shortcuts_btn.is_visible():
            shortcuts_btn.click()
            time.sleep(0.5)
            out = os.path.join(OUTPUT_DIR, "console_after_shortcuts.png")
            page.screenshot(path=out)
            shutil.copy(out, os.path.join(ARTIFACT_DIR, "console_after_shortcuts.png"))
            print("Saved: console_after_shortcuts.png")
            page.keyboard.press("Escape")
            time.sleep(0.4)

        # 6. Playing State (Click Master Orb Play)
        play_btn = page.locator("button[aria-label*='Play soundscape']").first
        if play_btn.is_visible():
            play_btn.click()
            time.sleep(1.5)
            save_page("console_after_playing.png")

        page.close()

        # ----------------- MOBILE (390x844) -----------------
        mobile_page = browser.new_page(viewport={"width": 390, "height": 844})
        mobile_page.goto("http://localhost:3001", timeout=30000)
        time.sleep(2.5)

        mobile_page.evaluate("""
            const el = document.getElementById('audio-dock-console');
            if (el) {
                el.scrollIntoView({ block: 'start', behavior: 'instant' });
            }
        """)
        time.sleep(1.0)
        out_mobile = os.path.join(OUTPUT_DIR, "console_after_mobile.png")
        mobile_page.screenshot(path=out_mobile)
        shutil.copy(out_mobile, os.path.join(ARTIFACT_DIR, "console_after_mobile.png"))
        print("Saved: console_after_mobile.png")

        browser.close()

if __name__ == "__main__":
    capture_after()
