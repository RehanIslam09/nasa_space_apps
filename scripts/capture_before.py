import os
import time
import shutil
from playwright.sync_api import sync_playwright

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
OUTPUT_DIR = os.path.abspath("docs/screenshots_audio")
ARTIFACT_DIR = r"C:\Users\rehan\.gemini\antigravity\brain\bcc1ca90-e327-4161-a9da-7e4b29fc80a1"
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(ARTIFACT_DIR, exist_ok=True)

def capture():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=CHROME_PATH,
            headless=True,
            args=["--enable-webgl", "--no-sandbox", "--window-size=1440,960"]
        )
        page = browser.new_page(viewport={"width": 1440, "height": 960})
        page.goto("http://localhost:3001", timeout=30000)
        time.sleep(2.0)
        
        page.evaluate("document.getElementById('jukebox')?.scrollIntoView({ behavior: 'instant' })")
        time.sleep(1.0)
        page.wait_for_selector(".apple-glass", timeout=10000)
        page.evaluate("document.querySelector('.apple-glass')?.scrollIntoView({ block: 'center' })")
        time.sleep(1.0)
        
        def save(name):
            out = os.path.join(OUTPUT_DIR, name)
            page.screenshot(path=out)
            shutil.copy(out, os.path.join(ARTIFACT_DIR, name))
            print(f"Saved: {name}")

        save("console_before_default.png")

        # Mixer
        mixer_btn = page.locator("button[aria-label*='Toggle Constituent Layer Synthesizer Mixer']")
        if mixer_btn.is_visible():
            mixer_btn.click()
            time.sleep(0.5)
            save("console_before_mixer.png")
            mixer_btn.click()
            time.sleep(0.3)

        # Space
        space_btn = page.locator("button[aria-label*='Toggle Spatial Audio and Planetary Field']")
        if space_btn.is_visible():
            space_btn.click()
            time.sleep(0.5)
            save("console_before_space.png")
            space_btn.click()
            time.sleep(0.3)

        # Science
        science_btn = page.locator("button[aria-label*='Toggle Scientific Interpretation & Audio Legend']")
        if science_btn.is_visible():
            science_btn.click()
            time.sleep(0.5)
            save("console_before_science.png")
            science_btn.click()
            time.sleep(0.3)

        # Access
        access_btn = page.locator("button[aria-label*='Toggle Accessibility & Sensory Settings']")
        if access_btn.is_visible():
            access_btn.click()
            time.sleep(0.5)
            save("console_before_access.png")

        browser.close()

if __name__ == "__main__":
    capture()
