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
    print("RUNNING STREAMLINED SCREENSHOT CAPTURE WITH FORCE=TRUE")
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
        
        # Scroll once to #then-vs-now via DOM API
        print("Scrolling to #then-vs-now via DOM API...")
        page.evaluate("document.getElementById('then-vs-now').scrollIntoView()")
        time.sleep(2.0)

        # Wait for Canvas
        canvas = page.wait_for_selector("#observation-visualizer-panel canvas", timeout=15000)
        print("Canvas found! Waiting 3.5s for initial 3D render...")
        time.sleep(3.5)

        def save_section_shot(filename):
            time.sleep(1.2)
            page.evaluate("document.getElementById('then-vs-now')?.scrollIntoView()")
            time.sleep(0.5)
            out = os.path.join(OUTPUT_DIR, filename)
            page.screenshot(path=out)
            shutil.copy(out, os.path.join(ARTIFACT_DIR, filename))
            print(f"-> Saved: {filename}")

        # 1. Initial State (Dual-Phase by default)
        save_section_shot("01_then_vs_now_initial_dual_phase.png")

        # 2. Click 2023 Current
        print("Switching to 2023 Current...")
        page.locator("#tab-period-2023").click(force=True)
        time.sleep(2.5)
        save_section_shot("02_then_vs_now_2023_current.png")

        # 3. Click 2012 Baseline
        print("Switching to 2012 Baseline...")
        page.locator("#tab-period-2012").click(force=True)
        time.sleep(2.5)
        save_section_shot("03_then_vs_now_2012_baseline.png")

        # 4. Click Dual-Phase Comparative
        print("Switching back to Dual-Phase Comparative...")
        page.locator("#tab-period-diff").click(force=True)
        time.sleep(2.5)
        save_section_shot("04_then_vs_now_dual_phase_delta.png")

        # 5. Interactive Orbit (mouse drag on Earth)
        print("Dragging on 3D Earth canvas...")
        canvas_box = canvas.bounding_box()
        if canvas_box:
            cx = canvas_box["x"] + canvas_box["width"] * 0.5
            cy = canvas_box["y"] + canvas_box["height"] * 0.5
            page.mouse.move(cx, cy)
            page.mouse.down()
            page.mouse.move(cx - 300, cy + 50, steps=25)
            page.mouse.up()
            time.sleep(1.5)
            save_section_shot("05_then_vs_now_orbited_drag.png")

            # 6. Click Reset View
            print("Clicking Reset View...")
            page.locator("button:has-text('Reset View')").click(force=True)
            time.sleep(1.5)
            save_section_shot("06_then_vs_now_camera_reset.png")

        # 7. Mobile Viewport (390 x 844)
        print("Testing mobile viewport 390x844...")
        page.set_viewport_size({"width": 390, "height": 844})
        time.sleep(1.5)
        page.evaluate("document.getElementById('then-vs-now')?.scrollIntoView()")
        time.sleep(1.0)
        out_m = os.path.join(OUTPUT_DIR, "07_then_vs_now_mobile_390x844.png")
        page.screenshot(path=out_m)
        shutil.copy(out_m, os.path.join(ARTIFACT_DIR, "07_then_vs_now_mobile_390x844.png"))
        print(f"-> Saved: 07_then_vs_now_mobile_390x844.png")

        # 8. WebGL benchmark
        print("\nBenchmarking performance...")
        page.set_viewport_size({"width": 1440, "height": 960})
        page.evaluate("document.getElementById('then-vs-now')?.scrollIntoView()")
        time.sleep(1.0)
        benchmark = page.evaluate('''() => {
            return new Promise((resolve) => {
                let frames = 0;
                let start = performance.now();
                function tick() {
                    frames++;
                    let elapsed = performance.now() - start;
                    if (elapsed >= 1000) {
                        const canvas = document.querySelector("#observation-visualizer-panel canvas");
                        const gl = canvas ? (canvas.getContext("webgl2") || canvas.getContext("webgl")) : null;
                        const debug = gl ? gl.getExtension("WEBGL_debug_renderer_info") : null;
                        resolve({
                            fps: Math.round((frames * 1000) / elapsed),
                            elapsedMs: elapsed,
                            canvasWidth: canvas ? canvas.width : 0,
                            canvasHeight: canvas ? canvas.height : 0,
                            dpr: window.devicePixelRatio,
                            vendor: debug ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) : "N/A",
                            renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : "N/A"
                        });
                    } else {
                        requestAnimationFrame(tick);
                    }
                }
                requestAnimationFrame(tick);
            });
        }''')
        print(f"PERFORMANCE: {benchmark['fps']} FPS | Canvas Size: {benchmark['canvasWidth']}x{benchmark['canvasHeight']} | DPR: {benchmark['dpr']}")
        print(f"GPU Renderer: {benchmark['renderer']}")

        browser.close()
        print("\nALL 7 SCREENSHOTS CAPTURED AND SAVED SUCCESSFULLY!")

if __name__ == "__main__":
    run()
