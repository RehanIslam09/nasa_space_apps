import os
import time
import json
import shutil
from playwright.sync_api import sync_playwright

CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
OUTPUT_DIR = os.path.abspath("docs/audit_screenshots")
ARTIFACT_DIR = r"C:\Users\rehan\.gemini\antigravity\brain\bcc1ca90-e327-4161-a9da-7e4b29fc80a1"
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(ARTIFACT_DIR, exist_ok=True)

def run():
    print("=" * 60)
    print("AUDITING SHIFTING HARMONY COMPONENT")
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

        console_logs = []
        page.on('console', lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))
        page.on('pageerror', lambda err: console_logs.append(f"[PAGE_ERROR] {err}"))

        def save_shot(filename):
            time.sleep(0.5)
            out = os.path.join(OUTPUT_DIR, filename)
            page.screenshot(path=out)
            shutil.copy(out, os.path.join(ARTIFACT_DIR, filename))
            print(f"-> Saved screenshot: {filename}")

        print("Navigating to http://localhost:3000...")
        page.goto("http://localhost:3000")
        time.sleep(3)

        # Get element positions
        layout_info = page.evaluate("""() => {
            const getBox = (sel) => {
                const el = document.querySelector(sel);
                if (!el) return null;
                const r = el.getBoundingClientRect();
                return { top: r.top + window.scrollY, height: r.height, className: el.className };
            };
            return {
                hero: getBox('section[aria-label*="Cinematic Hero"], section:first-of-type'),
                chapter1: getBox('#chapter-01'),
                balanceDisrupted: getBox('section[aria-label*="Section A"]'),
                crisisMetrics: getBox('#crisis-metrics'),
                shiftingHarmony: getBox('section[aria-label*="Section B"]'),
                thenVsNow: getBox('section[aria-label*="Section C"], #then-vs-now'),
            };
        }""")
        print("Layout info:\n", json.dumps(layout_info, indent=2))

        # Check GSAP ScrollTriggers
        st_info = page.evaluate("""() => {
            if (!window.ScrollTrigger) return "No ScrollTrigger on window";
            return window.ScrollTrigger.getAll().map((st, i) => ({
                id: st.vars.id || `st-${i}`,
                triggerClass: st.trigger ? st.trigger.className : 'null',
                start: st.start,
                end: st.end,
                pinned: !!st.pin,
                pinClass: st.pin ? st.pin.className : 'null',
                progress: st.progress,
            }));
        }""")
        print("GSAP ScrollTriggers:\n", json.dumps(st_info, indent=2))

        # Target Shifting Harmony start
        cm_top = layout_info['shiftingHarmony']['top'] if layout_info['shiftingHarmony'] else 3000
        print(f"Targeting ShiftingHarmony top at {cm_top}px")

        # Scroll to just before it
        page.evaluate(f"window.scrollTo(0, {cm_top - 600})")
        time.sleep(1)
        save_shot("audit_01_approaching.png")

        # Scroll right at top of heading
        page.evaluate(f"window.scrollTo(0, {cm_top})")
        time.sleep(1)
        save_shot("audit_02_at_top.png")

        # Scroll in increments of 300px through the pin duration
        for idx in range(1, 9):
            scroll_pos = cm_top + idx * 300
            page.evaluate(f"window.scrollTo(0, {scroll_pos})")
            time.sleep(0.5)

            state = page.evaluate("""() => {
                const heading = document.querySelector('section[aria-label*="Section B"] .harmony-word-the')?.closest('.special-font')?.parentElement?.parentElement?.parentElement;
                const card = document.querySelector('section[aria-label*="Section B"] .apple-glass');
                const pinWrapper = card?.closest('div[style*="--pin-top"]');
                const valueEl = card?.querySelector('.font-black.tabular-nums');
                const suffixEl = card?.querySelector('.font-zentry.shrink-0');
                const topicEl = card?.querySelector('span.font-mono.uppercase.tracking-\\\\[0\\\\.25em\\\\]');
                const hRect = heading ? heading.getBoundingClientRect() : null;
                const cRect = card ? card.getBoundingClientRect() : null;
                const pRect = pinWrapper ? pinWrapper.getBoundingClientRect() : null;
                
                return {
                    scrollY: window.scrollY,
                    headingTop: hRect?.top,
                    headingOpacity: heading ? window.getComputedStyle(heading).opacity : null,
                    cardTop: cRect?.top,
                    cardOpacity: card ? window.getComputedStyle(card).opacity : null,
                    cardTransform: card ? window.getComputedStyle(card).transform : null,
                    pinPosition: pinWrapper ? window.getComputedStyle(pinWrapper).position : null,
                    pinTop: pRect?.top,
                    topic: topicEl ? topicEl.textContent.trim() : null,
                    value: valueEl ? valueEl.textContent.trim() : null,
                };
            }""")
            print(f"Scroll {scroll_pos}px: state={state}")
            save_shot(f"audit_step_{idx}.png")

        print("\nConsole errors/warnings:")
        for log in console_logs:
            if any(w in log.lower() for w in ['warn', 'error', 'exception', 'cannot update']):
                print("  ", log)

        browser.close()

if __name__ == '__main__':
    run()
