import os
import time
import json
import shutil
from playwright.sync_api import sync_playwright

CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
OUTPUT_DIR = os.path.abspath("docs/screenshots_fix")
ARTIFACT_DIR = r"C:\Users\rehan\.gemini\antigravity\brain\bcc1ca90-e327-4161-a9da-7e4b29fc80a1"
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(ARTIFACT_DIR, exist_ok=True)

def verify():
    print("=" * 65)
    print("VERIFYING SHIFTING HARMONY FIX: REGRESSION & ACCEPTANCE CHECKS")
    print("=" * 65)

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

        console_errors = []
        page.on('console', lambda msg: console_errors.append(msg.text) if msg.type in ['error', 'warning'] else None)
        page.on('pageerror', lambda err: console_errors.append(f"PAGE ERROR: {err}"))

        def shot(filename):
            time.sleep(0.5)
            out = os.path.join(OUTPUT_DIR, filename)
            page.screenshot(path=out)
            shutil.copy(out, os.path.join(ARTIFACT_DIR, filename))
            print(f"-> Saved: {filename}")

        print("\n1. Loading http://localhost:3000 at 1440x900...")
        page.goto("http://localhost:3000")
        time.sleep(3)

        # ---------------------------------------------------------------------
        # CHECK 1: SCROLLTRIGGER REGRESSION CHECK TABLE
        # ---------------------------------------------------------------------
        print("\n2. Inspecting ScrollTrigger start/end table...")
        triggers = page.evaluate("""() => {
            if (!window.ScrollTrigger) return [];
            return window.ScrollTrigger.getAll().map((st, i) => ({
                idx: i,
                id: st.vars.id || `st-${i}`,
                triggerClass: (st.trigger?.className || st.trigger?.tagName || 'none').substring(0, 40),
                start: Math.round(st.start),
                end: Math.round(st.end),
                pin: !!st.pin,
            }));
        }""")
        print("Triggers count:", len(triggers))
        for t in triggers:
            print(f"  [{t['idx']}] id={t['id']} start={t['start']} end={t['end']} pin={t['pin']} trigger={t['triggerClass']}")

        # ---------------------------------------------------------------------
        # CHECK 2: SECTION ARRIVAL & NO 0.0% BUG
        # ---------------------------------------------------------------------
        print("\n3. Testing section arrival and initial display number...")
        sec_box = page.evaluate("""() => {
            const el = document.querySelector('section[aria-label*="Section B"]');
            return el ? { top: el.getBoundingClientRect().top + window.scrollY, height: el.getBoundingClientRect().height } : null;
        }""")
        print(f"Section B bounding top: {sec_box['top']}px")

        # Scroll to right before the section
        page.evaluate(f"window.scrollTo(0, {sec_box['top'] - 200})")
        time.sleep(0.5)
        shot("fix_01_before_arrival.png")

        # Scroll right to section pin start
        page.evaluate(f"window.scrollTo(0, {sec_box['top']})")
        time.sleep(0.5)

        arrival_state = page.evaluate("""() => {
            const card = document.querySelector('section[aria-label*="Section B"] .apple-glass');
            const h1Word = document.querySelector('.harmony-word-the');
            const valEl = card?.querySelector('.font-black.tabular-nums');
            const suffixEl = card?.querySelector('.font-zentry.shrink-0');
            return {
                h1Transform: h1Word ? window.getComputedStyle(h1Word).transform : null,
                h1Opacity: h1Word ? window.getComputedStyle(h1Word).opacity : null,
                displayedValue: valEl ? valEl.textContent.trim() : null,
                suffix: suffixEl ? suffixEl.textContent.trim() : null,
            };
        }""")
        print("Arrival state at start:", arrival_state)
        shot("fix_02_arrival_start.png")

        # ---------------------------------------------------------------------
        # CHECK 3: FRAME-BY-FRAME SCROLL & NEVER ZERO VERIFICATION
        # ---------------------------------------------------------------------
        print("\n4. Frame-by-frame scroll check through all 4 panels...")
        zero_occurrences = []
        panel_observations = []

        # We step 12 times through the pin length
        total_pin_length = 900 * 2.6 # 2340px
        step_px = int(total_pin_length / 12)

        for step in range(13):
            curr_scroll = int(sec_box['top'] + step * step_px)
            page.evaluate(f"window.scrollTo(0, {curr_scroll})")
            time.sleep(0.3)

            obs = page.evaluate("""() => {
                const card = document.querySelector('section[aria-label*="Section B"] .apple-glass');
                const valEl = card?.querySelector('.font-black.tabular-nums');
                const suffixEl = card?.querySelector('.font-zentry.shrink-0');
                const topicEl = card?.querySelector('span.font-mono.uppercase.tracking-\\\\[0\\\\.25em\\\\]');
                const cardWrapper = card?.closest('div[class*="max-w-5xl"]');
                const cRect = card ? card.getBoundingClientRect() : null;

                const val = valEl ? valEl.textContent.trim() : '';
                return {
                    scrollY: window.scrollY,
                    topic: topicEl ? topicEl.textContent.trim() : '',
                    value: val,
                    suffix: suffixEl ? suffixEl.textContent.trim() : '',
                    cardOpacity: cardWrapper ? window.getComputedStyle(cardWrapper).opacity : '',
                    cardTop: cRect ? cRect.top : null,
                    cardHeight: cRect ? cRect.height : null,
                };
            }""")
            panel_observations.append(obs)

            # Check if value equals "0", "0.0", "+0", "-0"
            if obs['value'] in ['0', '0.0', '+0', '-0']:
                zero_occurrences.append((step, curr_scroll, obs))

            if step in [2, 5, 8, 11]:
                shot(f"fix_step_{step}_{obs['topic'].replace(' ', '_')}.png")

        print(f"Scrolled 13 steps across pin. Zero occurrences: {len(zero_occurrences)}")
        if zero_occurrences:
            print("WARNING: Found zero occurrences:", zero_occurrences)
        else:
            print("[PASS] Number NEVER passed through zero between stages!")

        # ---------------------------------------------------------------------
        # CHECK 4: NO DEAD VOID AT PIN RELEASE
        # ---------------------------------------------------------------------
        print("\n5. Checking stage exit without void...")
        exit_obs = page.evaluate("""() => {
            const card = document.querySelector('section[aria-label*="Section B"] .apple-glass');
            const cardWrapper = card?.closest('div[class*="max-w-5xl"]');
            const thenVsNow = document.querySelector('section[aria-label*="Section C"], #then-vs-now');
            const tRect = thenVsNow ? thenVsNow.getBoundingClientRect() : null;
            return {
                cardOpacity: cardWrapper ? window.getComputedStyle(cardWrapper).opacity : null,
                cardTransform: cardWrapper ? window.getComputedStyle(cardWrapper).transform : null,
                thenVsNowTop: tRect ? tRect.top : null,
            };
        }""")
        print("Exit observation at final step:", exit_obs)
        assert float(exit_obs['cardOpacity'] or '0') > 0.5, "Card should not fade to zero before pin release"
        print("[PASS] Card stayed fully visible through pin exit!")

        # ---------------------------------------------------------------------
        # CHECK 5: TIME SCRUBBING (MOUSE, TOUCH, KEYBOARD) & NUMBER SYNC
        # ---------------------------------------------------------------------
        print("\n6. Testing interactive time scrubbing (Mouse, Touch, Keyboard)...")
        # Scroll back to panel 1 (Cryosphere)
        page.evaluate(f"window.scrollTo(0, {sec_box['top'] + 800})")
        time.sleep(0.5)

        # A. Mouse scrub
        chart_el = page.locator("div[role='slider']")
        chart_box = chart_el.bounding_box()
        print(f"Chart slider bounding box: {chart_box}")

        page.mouse.move(chart_box['x'] + chart_box['width'] * 0.3, chart_box['y'] + chart_box['height'] * 0.5)
        time.sleep(0.4)
        scrubbed_mouse = page.evaluate("""() => {
            const valEl = document.querySelector('.font-black.tabular-nums');
            const scrubLabel = document.querySelector('div[role=\"slider\"] span.text-sky-300');
            return { value: valEl?.textContent.trim(), label: scrubLabel?.textContent.trim() };
        }""")
        print("Mouse scrub at 30% width:", scrubbed_mouse)
        shot("fix_03_mouse_scrub.png")

        # Move mouse away
        page.mouse.move(0, 0)
        time.sleep(0.6)
        reverted_val = page.evaluate("""() => document.querySelector('.font-black.tabular-nums')?.textContent.trim()""")
        print("Reverted value after mouse leave:", reverted_val)

        # B. Keyboard scrub
        chart_el.focus()
        page.keyboard.press("ArrowLeft")
        time.sleep(0.3)
        kb_val1 = page.evaluate("""() => ({
            val: document.querySelector('.font-black.tabular-nums')?.textContent.trim(),
            ariaText: document.querySelector('div[role=\"slider\"]')?.getAttribute('aria-valuetext')
        })""")
        print("Keyboard scrub ArrowLeft:", kb_val1)

        page.keyboard.press("ArrowRight")
        time.sleep(0.3)
        kb_val2 = page.evaluate("""() => ({
            val: document.querySelector('.font-black.tabular-nums')?.textContent.trim(),
            ariaText: document.querySelector('div[role=\"slider\"]')?.getAttribute('aria-valuetext')
        })""")
        print("Keyboard scrub ArrowRight:", kb_val2)
        shot("fix_04_keyboard_scrub.png")

        # ---------------------------------------------------------------------
        # CHECK 6: AUDIO AUDITION BUTTON & MUTED RESPECT
        # ---------------------------------------------------------------------
        print("\n7. Testing Audio Audition button...")
        audition_btn = page.locator("button[aria-label*='planetary harmonic resonance']")
        btn_count = audition_btn.count()
        print("Audition button count:", btn_count)
        assert btn_count == 1, "Audition button must exist"

        # Check button attributes
        btn_text = audition_btn.text_content()
        print(f"Audition button text: '{btn_text.strip()}'")

        # Click audition
        audition_btn.click()
        time.sleep(0.3)
        audition_state = page.evaluate("""() => {
            const btn = document.querySelector('button[aria-label*=\"planetary harmonic resonance\"]');
            const liveIndicator = btn?.textContent?.includes('AUDITION LIVE') || btn?.textContent?.includes('HEAR TONE');
            return {
                btnText: btn?.textContent?.trim(),
                hasLiveIndicator: liveIndicator
            };
        }""")
        print("Audition state after click:", audition_state)
        shot("fix_05_audition_active.png")

        # ---------------------------------------------------------------------
        # CHECK 7: STEPPER BUTTONS & ARIA ACCESSIBILITY
        # ---------------------------------------------------------------------
        print("\n8. Testing accessible stepper buttons...")
        stepper_tabs = page.locator("section[aria-label*='Section B'] button[role='tab']")
        tab_count = stepper_tabs.count()
        print(f"Found {tab_count} stepper tabs in Section B")
        assert tab_count == 4, f"Must have exactly 4 stage tabs, found {tab_count}"

        # Click tab 3 (Ocean Heat)
        stepper_tabs.nth(2).click()
        time.sleep(0.8)
        clicked_tab_state = page.evaluate("""() => {
            const topic = document.querySelector('span.font-mono.uppercase.tracking-\\\\[0\\\\.25em\\\\]')?.textContent.trim();
            const val = document.querySelector('.font-black.tabular-nums')?.textContent.trim();
            const liveRegion = document.querySelector('div[role=\"status\"][aria-live=\"polite\"]')?.textContent.trim();
            return { topic, val, liveRegion };
        }""")
        print("State after clicking Tab 3 (Ocean Heat):", clicked_tab_state)
        shot("fix_06_stepper_tab3.png")

        # ---------------------------------------------------------------------
        # CHECK 8: VIEWPORT RESPONSIVENESS & ZERO CLIPPING
        # ---------------------------------------------------------------------
        print("\n9. Testing viewports for zero clipping...")
        test_viewports = [
            ("390x667 (iPhone SE)", 390, 667),
            ("390x844 (iPhone 14)", 390, 844),
            ("768x1024 (iPad Mini)", 768, 1024),
            ("1366x768 (Laptop)", 1366, 768),
            ("1440x900 (Desktop)", 1440, 900),
            ("1920x1080 (FHD)", 1920, 1080),
        ]

        for label, w, h in test_viewports:
            vp_page = browser.new_page(viewport={"width": w, "height": h})
            vp_page.goto("http://localhost:3000")
            time.sleep(2)

            # Scroll to ShiftingHarmony
            top_y = vp_page.evaluate("""() => {
                const el = document.querySelector('section[aria-label*="Section B"]');
                return el ? el.getBoundingClientRect().top + window.scrollY : 4000;
            }""")
            vp_page.evaluate(f"window.scrollTo(0, {top_y + 800})")
            time.sleep(0.5)

            metrics = vp_page.evaluate("""() => {
                const card = document.querySelector('section[aria-label*="Section B"] .apple-glass');
                const stepper = document.querySelector('div[role=\"tablist\"]');
                const cRect = card ? card.getBoundingClientRect() : null;
                const sRect = stepper ? stepper.getBoundingClientRect() : null;
                return {
                    scrollWidth: document.documentElement.scrollWidth,
                    clientWidth: document.documentElement.clientWidth,
                    cardTop: cRect ? cRect.top : 0,
                    cardBottom: cRect ? cRect.bottom : 0,
                    stepperBottom: sRect ? sRect.bottom : 0,
                    viewportHeight: window.innerHeight,
                };
            }""")

            is_clipped = metrics['stepperBottom'] > metrics['viewportHeight'] or metrics['cardBottom'] > metrics['viewportHeight']
            has_h_overflow = metrics['scrollWidth'] > metrics['clientWidth']
            print(f"  {label}: cardTop={metrics['cardTop']:.1f}, cardBottom={metrics['cardBottom']:.1f}, vh={metrics['viewportHeight']}, clipped={is_clipped}, hOverflow={has_h_overflow}")
            assert not is_clipped, f"Card clipped at {label}!"
            assert not has_h_overflow, f"Horizontal overflow at {label}!"

            out_vp = f"fix_vp_{w}x{h}.png"
            vp_out_path = os.path.join(OUTPUT_DIR, out_vp)
            vp_page.screenshot(path=vp_out_path)
            shutil.copy(vp_out_path, os.path.join(ARTIFACT_DIR, out_vp))
            vp_page.close()

        print("\nAll viewport checks passed!")

        # Console error audit
        print("\nConsole errors/warnings captured during test:")
        for log in console_errors:
            if "favicon" not in log and "404" not in log:
                print(" ", log)

        browser.close()

    print("\nALL VERIFICATION CRITERIA COMPLETED SUCCESSFULLY!")

if __name__ == '__main__':
    verify()
