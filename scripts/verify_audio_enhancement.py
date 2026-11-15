import os
import time
import shutil
from playwright.sync_api import sync_playwright

CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
OUTPUT_DIR = os.path.abspath("docs/screenshots_audio")
ARTIFACT_DIR = r"C:\Users\rehan\.gemini\antigravity\brain\bcc1ca90-e327-4161-a9da-7e4b29fc80a1"
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(ARTIFACT_DIR, exist_ok=True)

def verify():
    print("=" * 60)
    print("VERIFYING HERO AUDIO & NAVBAR AUDIO CONTROLLER")
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
                "--window-size=1440,900",
            ]
        )

        page = browser.new_page(viewport={"width": 1440, "height": 900})

        def shot(filename):
            time.sleep(0.5)
            out = os.path.join(OUTPUT_DIR, filename)
            page.screenshot(path=out)
            shutil.copy(out, os.path.join(ARTIFACT_DIR, filename))
            print(f"-> Saved: {filename}")

        print("1. Loading http://localhost:3000...")
        page.goto("http://localhost:3000")
        time.sleep(2.5)

        # -------------------------------------------------------------
        # CHECK 1: FLOATING BADGE REMOVED FROM BOTTOM-LEFT
        # -------------------------------------------------------------
        print("\n2. Checking that bottom-left FloatingAudioBadge is removed...")
        floating_badge = page.locator("aside[aria-label='Audio Controls']")
        count_floating = floating_badge.count()
        print(f"FloatingAudioBadge count: {count_floating}")
        assert count_floating == 0, "FloatingAudioBadge must be removed from page!"
        print("[PASS] FloatingAudioBadge removed from bottom-left!")

        # -------------------------------------------------------------
        # CHECK 2: NAVBAR AUDIO BUTTON MOUNTED AT TOP
        # -------------------------------------------------------------
        print("\n3. Checking navbar audio button in Header...")
        nav_audio_btn = page.locator("header button[aria-label*='experience sound']")
        btn_count = nav_audio_btn.count()
        print(f"Navbar audio button count: {btn_count}")
        assert btn_count >= 1, "Audio toggle button must exist in header navbar!"
        
        btn_text = nav_audio_btn.first.text_content()
        print(f"Initial button text: '{btn_text.strip()}'")
        assert "Audio Muted" in btn_text, "Should start in Muted state"
        shot("audio_01_navbar_muted.png")

        # -------------------------------------------------------------
        # CHECK 3: HERO VIDEO INITIAL MUTED STATE
        # -------------------------------------------------------------
        print("\n4. Checking hero video initial audio properties...")
        initial_video = page.evaluate("""() => {
            const v = document.querySelector('video');
            return {
                muted: v?.muted,
                volume: v?.volume,
                paused: v?.paused,
                src: v?.src
            };
        }""")
        print("Hero video initial state:", initial_video)
        assert initial_video['muted'] == True, "Hero video must start muted"
        assert initial_video['volume'] == 0, "Hero video initial volume must be 0"

        # -------------------------------------------------------------
        # CHECK 4: CLICK NAVBAR AUDIO BUTTON -> UNMUTE HERO VIDEO
        # -------------------------------------------------------------
        print("\n5. Clicking navbar Audio button to unmute...")
        nav_audio_btn.first.click()
        time.sleep(1.0)

        unmuted_btn_text = nav_audio_btn.first.text_content()
        print(f"Unmuted button text: '{unmuted_btn_text.strip()}'")
        assert "Audio Live" in unmuted_btn_text, "Navbar button should display Audio Live"

        unmuted_video = page.evaluate("""() => {
            const v = document.querySelector('video');
            return {
                muted: v?.muted,
                volume: v?.volume,
                paused: v?.paused,
                currentTime: v?.currentTime,
            };
        }""")
        print("Hero video unmuted state:", unmuted_video)
        assert unmuted_video['muted'] == False, "Hero video muted property must be false!"
        assert unmuted_video['volume'] > 0.5, f"Hero video volume must be audible (>0.5), got {unmuted_video['volume']}"
        assert unmuted_video['paused'] == False, "Hero video should be playing audio!"
        print("[PASS] Hero video is unmuted, audible, and playing!")
        shot("audio_02_navbar_live.png")

        # -------------------------------------------------------------
        # CHECK 5: SCROLL DUCKING
        # -------------------------------------------------------------
        print("\n6. Checking scroll ducking as user scrolls down into Chapter 01...")
        page.evaluate("window.scrollTo(0, 700)")
        time.sleep(0.5)

        ducked_video = page.evaluate("""() => {
            const v = document.querySelector('video');
            return {
                volume: v?.volume,
                paused: v?.paused,
                scrollY: window.scrollY
            };
        }""")
        print("Hero video at scrollY=700:", ducked_video)
        assert ducked_video['volume'] < 0.35, f"Hero video volume should be ducked at scrollY=700, got {ducked_video['volume']}"
        print("[PASS] Hero video volume ducks smoothly on scroll!")

        # Scroll further down past Hero
        page.evaluate("window.scrollTo(0, 1600)")
        time.sleep(0.5)
        passed_video = page.evaluate("""() => {
            const v = document.querySelector('video');
            return {
                volume: v?.volume,
                paused: v?.paused
            };
        }""")
        print("Hero video at scrollY=1600 (past hero):", passed_video)
        assert passed_video['volume'] == 0 or passed_video['paused'] == True, "Hero video should be paused or silent when scrolled away"
        print("[PASS] Hero video paused/silenced when scrolled past!")

        # Scroll back to top
        page.evaluate("window.scrollTo(0, 0)")
        time.sleep(0.8)
        restored_video = page.evaluate("""() => {
            const v = document.querySelector('video');
            return {
                muted: v?.muted,
                volume: v?.volume,
                paused: v?.paused
            };
        }""")
        print("Hero video restored at scrollY=0:", restored_video)
        assert restored_video['volume'] > 0.5, "Hero video volume should restore when returning to top"
        print("[PASS] Hero video restored to full audible volume on return to top!")

        # -------------------------------------------------------------
        # CHECK 6: MOBILE NAVBAR AUDIO TOGGLE
        # -------------------------------------------------------------
        print("\n7. Checking mobile navbar layout at 390x844...")
        mob_page = browser.new_page(viewport={"width": 390, "height": 844})
        mob_page.goto("http://localhost:3000")
        time.sleep(2)

        mob_audio_btn = mob_page.locator("header button[aria-label*='sound']")
        mob_btn_count = mob_audio_btn.count()
        print(f"Mobile navbar audio buttons found: {mob_btn_count}")
        assert mob_btn_count >= 1, "Mobile header must have audio toggle button!"
        
        mob_out = os.path.join(OUTPUT_DIR, "audio_03_mobile_header.png")
        mob_page.screenshot(path=mob_out)
        shutil.copy(mob_out, os.path.join(ARTIFACT_DIR, "audio_03_mobile_header.png"))
        print("[PASS] Mobile header verified with audio toggle!")
        mob_page.close()

        browser.close()

    print("\nALL HERO AUDIO & NAVBAR AUDIO CHECKS PASSED!")

if __name__ == '__main__':
    verify()
