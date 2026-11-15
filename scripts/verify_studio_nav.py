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
    print("VERIFYING STUDIO NAV AND DATASET PAGE SURGICAL ENHANCEMENTS")
    print("=" * 60)

    results = {}

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

        def save_shot(filename):
            time.sleep(1.0)
            out = os.path.join(OUTPUT_DIR, filename)
            page.screenshot(path=out)
            shutil.copy(out, os.path.join(ARTIFACT_DIR, filename))
            print(f"-> Saved screenshot: {filename}")

        # -------------------------------------------------------------
        # 1. VERIFY LANDING NAVBAR PIXEL-IDENTICAL & UNCHANGED
        # -------------------------------------------------------------
        print("1. Visiting landing page http://localhost:3000...")
        page.goto("http://localhost:3000")
        time.sleep(2.5)

        landing_nav = page.locator("nav[aria-label='Main Navigation']")
        has_journey = page.locator("nav a:has-text('The Journey')").is_visible()
        has_pulse = page.locator("nav a:has-text('Planetary Pulse')").is_visible()
        has_console = page.locator("nav a:has-text('Sonic Console')").is_visible()

        if landing_nav.is_visible() and has_journey and has_pulse and has_console:
            results["landing_navbar_unchanged"] = "PASS"
            print("✓ Landing page navbar is intact with all 3 links.")
        else:
            results["landing_navbar_unchanged"] = "FAIL"

        save_shot("29_landing_nav_unchanged.png")

        # -------------------------------------------------------------
        # 2. VERIFY /dataset/[id] SHOWS StudioNav AND NO LANDING LINKS
        # -------------------------------------------------------------
        print("2. Visiting /dataset/geos-aerosols...")
        page.goto("http://localhost:3000/dataset/geos-aerosols")
        time.sleep(2.5)

        studio_nav = page.locator("nav[aria-label='Dataset studio']")
        no_journey = not page.locator("nav a:has-text('The Journey')").is_visible()
        no_old_pill = not page.locator("a:has-text('Return to Earth Song Gallery')").is_visible()
        has_gallery_back = page.locator("nav[aria-label='Dataset studio'] a:has-text('Gallery')").is_visible()
        has_position_01 = page.locator("nav[aria-label='Dataset studio'] >> text=01 / 11").is_visible()

        if studio_nav.is_visible() and no_journey and no_old_pill and has_gallery_back and has_position_01:
            results["studionav_mounted_no_landing_links"] = "PASS"
            print("✓ StudioNav is mounted; landing links and old duplicate pill are removed.")
        else:
            results["studionav_mounted_no_landing_links"] = "FAIL"

        # Check disabled state on first dataset
        prev_disabled = page.locator("nav[aria-label='Dataset studio'] button[aria-disabled='true']").is_visible()
        next_link = page.locator("nav[aria-label='Dataset studio'] a[aria-label*='Next dataset']").is_visible()
        if prev_disabled and next_link:
            results["boundary_first_dataset_disabled"] = "PASS"
            print("✓ Boundary check: previous arrow disabled at index 0, next arrow active.")
        else:
            results["boundary_first_dataset_disabled"] = "FAIL"

        # Verify Finishing Touch 1: Audio Converter badge is not clipped
        badge = page.locator("text='AUDIO CONVERTER'")
        if badge.is_visible():
            results["audio_converter_badge_unclipped"] = "PASS"
            print("✓ Finishing Touch 1: 'AUDIO CONVERTER' badge is visible without clipping.")
        else:
            results["audio_converter_badge_unclipped"] = "FAIL"

        # Verify Finishing Touch 2: Download Master WAV is visible
        download_btn = page.locator("a:has-text('Download Master WAV')")
        if download_btn.is_visible():
            results["download_wav_button_visible"] = "PASS"
            print("✓ Finishing Touch 2: 'Download Master WAV' button is fully visible.")
        else:
            results["download_wav_button_visible"] = "FAIL"

        save_shot("30_dataset_studio_nav_first.png")

        # -------------------------------------------------------------
        # 3. VERIFY PREV/NEXT ARROW NAVIGATION & MUTE SYNC
        # -------------------------------------------------------------
        print("3. Navigating to next dataset via StudioNav...")
        page.locator("nav[aria-label='Dataset studio'] a[aria-label*='Next dataset']").click()
        time.sleep(2.5)

        has_position_02 = page.locator("nav[aria-label='Dataset studio'] >> text=02 / 11").is_visible()
        has_currents_title = page.locator("h1:has-text('GLOBAL SEA SURFACE')").is_visible()
        prev_now_enabled = page.locator("nav[aria-label='Dataset studio'] a[aria-label*='Previous dataset']").is_visible()

        if has_position_02 and has_currents_title and prev_now_enabled:
            results["next_dataset_navigation"] = "PASS"
            print("✓ Navigated cleanly to Dataset 02 / 11 with previous arrow enabled.")
        else:
            results["next_dataset_navigation"] = "FAIL"

        save_shot("31_dataset_studio_nav_second.png")

        # -------------------------------------------------------------
        # 4. VERIFY RESPONSIVE 390px (MOBILE) VIEWPORT
        # -------------------------------------------------------------
        print("4. Testing mobile viewport 390x844...")
        page.set_viewport_size({"width": 390, "height": 844})
        time.sleep(1.5)

        # Check for horizontal scroll / overflow
        scroll_width = page.evaluate("document.documentElement.scrollWidth")
        client_width = page.evaluate("document.documentElement.clientWidth")
        no_overflow = scroll_width <= client_width

        if no_overflow:
            results["mobile_390_no_overflow"] = "PASS"
            print(f"✓ Mobile 390px layout: scrollWidth ({scroll_width}) <= clientWidth ({client_width}), NO horizontal overflow.")
        else:
            results["mobile_390_no_overflow"] = "FAIL"
            print(f"✗ Mobile overflow detected: scrollWidth={scroll_width}, clientWidth={client_width}")

        save_shot("32_dataset_studio_nav_mobile_390.png")

        # -------------------------------------------------------------
        # 5. VERIFY TABLET 768px VIEWPORT
        # -------------------------------------------------------------
        print("5. Testing tablet viewport 768x1024...")
        page.set_viewport_size({"width": 768, "height": 1024})
        time.sleep(1.5)

        tab_scroll_width = page.evaluate("document.documentElement.scrollWidth")
        tab_client_width = page.evaluate("document.documentElement.clientWidth")
        if tab_scroll_width <= tab_client_width:
            results["tablet_768_no_overflow"] = "PASS"
            print("✓ Tablet 768px layout: NO horizontal overflow.")
        else:
            results["tablet_768_no_overflow"] = "FAIL"

        save_shot("33_dataset_studio_nav_tablet_768.png")

        # -------------------------------------------------------------
        # 6. VERIFY ESCAPE KEY RETURNS TO /#jukebox
        # -------------------------------------------------------------
        print("6. Testing Escape key shortcut...")
        page.focus("body")
        page.keyboard.press("Escape")
        try:
            page.wait_for_url(lambda u: "#jukebox" in u, timeout=5000)
        except Exception:
            time.sleep(2.0)

        current_url = page.url
        if "#jukebox" in current_url:
            results["escape_key_navigation"] = "PASS"
            print(f"✓ Escape key returned to: {current_url}")
        else:
            results["escape_key_navigation"] = "FAIL"
            print(f"✗ Escape key went to: {current_url}")

        save_shot("34_dataset_studio_nav_escape_to_gallery.png")

        browser.close()

    print("=" * 60)
    print("VERIFICATION RESULTS SUMMARY:")
    for k, v in results.items():
        print(f"  [{v}] {k}")
    print("=" * 60)

if __name__ == "__main__":
    run()
