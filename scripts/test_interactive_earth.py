import os
import time
import shutil
from playwright.sync_api import sync_playwright

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
OUTPUT_DIR = os.path.abspath(r"workspace\nasa_experience\docs\screenshots")
ROOT_DOCS = os.path.abspath(r"docs\screenshots")
ARTIFACT_DIR = r"C:\Users\rehan\.gemini\antigravity\brain\bcc1ca90-e327-4161-a9da-7e4b29fc80a1"

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(ROOT_DOCS, exist_ok=True)
os.makedirs(ARTIFACT_DIR, exist_ok=True)

def run():
    print("=" * 60)
    print("RUNNING MILESTONE 2 INTERACTIVE EARTH & SONIFICATION QA")
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
                "--autoplay-policy=no-user-gesture-required",
            ],
        )

        page = browser.new_page(viewport={"width": 1440, "height": 960})

        page.on("console", lambda msg: print("[BROWSER]", msg.type, msg.text[:120]))
        page.on("pageerror", lambda err: print("[PAGE ERROR]", err))

        print("1. Loading http://localhost:3000...")
        page.goto("http://localhost:3000")
        time.sleep(2.5)

        print("2. Scrolling to #then-vs-now...")
        page.evaluate("document.getElementById('then-vs-now')?.scrollIntoView()")
        time.sleep(2.0)

        canvas = page.wait_for_selector("#observation-visualizer-panel canvas", timeout=15000)
        print("Canvas found! Waiting 3.5s for 3D Earth render...")
        time.sleep(3.5)

        def save_shot(filename):
            time.sleep(1.0)
            page.evaluate("document.getElementById('then-vs-now')?.scrollIntoView()")
            time.sleep(0.5)
            path1 = os.path.join(OUTPUT_DIR, filename)
            path2 = os.path.join(ROOT_DOCS, filename)
            path3 = os.path.join(ARTIFACT_DIR, filename)
            page.screenshot(path=path1)
            shutil.copy(path1, path2)
            shutil.copy(path1, path3)
            print(f"-> Saved: {filename}")

        box = canvas.bounding_box()
        assert box, "Canvas bounding box not found"
        cx = box["x"] + box["width"] * 0.5
        cy = box["y"] + box["height"] * 0.5

        # State 1: Global Planetary View
        save_shot("08_milestone2_global_earth_ready.png")

        # State 2: Geographic Picking (Click near center-left to target South America / Atlantic)
        print("3. Clicking on Earth surface to pick geographic target...")
        # At initial rotation -0.4*PI, Prime Meridian (Atlantic/Europe/Africa) is in view.
        # Clicking slightly left of center (cx - 100, cy + 40) hits South America / Atlantic margin
        page.mouse.click(cx - 90, cy + 30)
        time.sleep(2.0)

        # Check if intelligence panel appeared
        panel = page.wait_for_selector("div[role='region'][aria-label*='Planetary Intelligence']", timeout=8000)
        print("Target Acquired! Intelligence HUD detected.")
        panel_text = panel.inner_text()
        print("HUD Title snippet:\n", panel_text[:200])

        save_shot("09_milestone2_target_acquired_hud.png")

        # State 3: Interactive Sonification Playback
        print("4. Triggering live environmental sonification...")
        play_btn = page.locator("button[aria-label='Play Sonification']")
        if play_btn.is_visible():
            play_btn.click(force=True)
            time.sleep(2.0)
            print("Sonification active!")

        save_shot("10_milestone2_live_sonification_active.png")

        # State 4: Temporal Mode Switch to 2012 Baseline
        print("5. Switching sonification to 2012 Baseline...")
        page.locator("button[aria-label='Sonify 2012 Baseline']").click(force=True)
        time.sleep(2.0)
        save_shot("11_milestone2_sonify_2012_baseline.png")

        # State 5: Temporal Mode Switch to Dual-Phase Comparative Delta
        print("6. Switching sonification to Dual-Phase Comparative Delta...")
        page.locator("button[aria-label='Sonify Dual-Phase Comparative Delta']").click(force=True)
        time.sleep(2.0)
        save_shot("12_milestone2_sonify_dual_phase_delta.png")

        # State 6: Drag-to-Orbit without false clicks
        print("7. Testing camera drag-to-orbit...")
        page.mouse.move(cx, cy)
        page.mouse.down()
        page.mouse.move(cx - 240, cy + 30, steps=20)
        page.mouse.up()
        time.sleep(1.5)
        save_shot("13_milestone2_orbited_target_perspective.png")

        # State 7: Reset View
        print("8. Resetting camera view...")
        page.locator("button[aria-label='Reset 3D Earth camera to default perspective']").click(force=True)
        time.sleep(1.5)
        save_shot("14_milestone2_reset_view_restored.png")

        # State 8: Mobile Viewport
        print("9. Testing mobile responsive layout (390x844)...")
        page.set_viewport_size({"width": 390, "height": 844})
        time.sleep(1.5)
        page.evaluate("document.getElementById('then-vs-now')?.scrollIntoView()")
        time.sleep(1.0)
        # Click on mobile canvas to target
        m_canvas = page.wait_for_selector("#observation-visualizer-panel canvas", timeout=10000)
        m_box = m_canvas.bounding_box()
        if m_box:
            mcx = m_box["x"] + m_box["width"] * 0.5
            mcy = m_box["y"] + m_box["height"] * 0.5
            page.mouse.click(mcx - 30, mcy + 20)
            time.sleep(2.0)

        out_m = os.path.join(OUTPUT_DIR, "15_milestone2_mobile_interactive_hud.png")
        page.screenshot(path=out_m)
        shutil.copy(out_m, os.path.join(ROOT_DOCS, "15_milestone2_mobile_interactive_hud.png"))
        shutil.copy(out_m, os.path.join(ARTIFACT_DIR, "15_milestone2_mobile_interactive_hud.png"))
        print("-> Saved: 15_milestone2_mobile_interactive_hud.png")

        browser.close()
        print("\nALL MILESTONE 2 INTERACTIVE QA SCREENSHOTS CAPTURED!")

if __name__ == "__main__":
    run()
