import os
import time
import shutil
from playwright.sync_api import sync_playwright

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
OUTPUT_DIR = os.path.abspath(r"workspace\nasa_experience\docs\screenshots")
ROOT_DOCS = os.path.abspath(r"docs\screenshots")
ARTIFACT_DIR = r"C:\Users\rehan\.gemini\antigravity\brain\bcc1ca90-e327-4161-a9da-7e4b29fc80a1"

def run():
    print("Capturing 5 Landmark NASA Observation Stories...")

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
                "--autoplay-policy=no-user-gesture-required",
            ],
        )

        page = browser.new_page(viewport={"width": 1440, "height": 960})
        page.goto("http://localhost:3000")
        time.sleep(2.0)
        page.evaluate("document.getElementById('then-vs-now')?.scrollIntoView()")
        time.sleep(2.5)

        targets = [
            ("Target Amazon Basin Deforestation Arc", "16_milestone2_amazon_rainforest_hud.png"),
            ("Target Arctic Cryosphere & Svalbard Sea Ice", "17_milestone2_arctic_cryosphere_hud.png"),
            ("Target Indo-Gangetic Megalopolis & Delhi Belt", "18_milestone2_india_urbanization_hud.png"),
            ("Target Sierra Nevada & Central Valley Fire Corridor", "19_milestone2_california_wildfire_hud.png"),
            ("Target Sahara Desert & Ténéré Mineral Dust Corridor", "20_milestone2_sahara_desert_hud.png"),
        ]

        for aria_name, filename in targets:
            print(f"Targeting: {aria_name}...")
            btn = page.locator(f"button[aria-label='{aria_name}']")
            btn.click(force=True)
            time.sleep(2.0)

            # Scroll and capture
            page.evaluate("document.getElementById('then-vs-now')?.scrollIntoView()")
            time.sleep(0.5)

            p1 = os.path.join(OUTPUT_DIR, filename)
            p2 = os.path.join(ROOT_DOCS, filename)
            p3 = os.path.join(ARTIFACT_DIR, filename)
            page.screenshot(path=p1)
            shutil.copy(p1, p2)
            shutil.copy(p1, p3)
            print(f"-> Saved: {filename}")

        browser.close()
        print("ALL 5 LANDMARK NASA STORIES CAPTURED!")

if __name__ == "__main__":
    run()
