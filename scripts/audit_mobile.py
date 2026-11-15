import time
import shutil
from playwright.sync_api import sync_playwright

CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=CHROME_PATH, headless=True)
    page = browser.new_page(viewport={"width": 390, "height": 844})
    page.goto("http://localhost:3000")
    time.sleep(2)

    # Scroll to ShiftingHarmony
    cm_top = page.evaluate("""() => {
        const el = document.querySelector('section[aria-label*="Section B"]');
        return el ? el.getBoundingClientRect().top + window.scrollY : 4000;
    }""")
    print(f"Mobile ShiftingHarmony top: {cm_top}")

    page.evaluate(f"window.scrollTo(0, {cm_top + 400})")
    time.sleep(1)

    # Check overflow and card dimensions
    mobile_info = page.evaluate("""() => {
        const card = document.querySelector('section[aria-label*="Section B"] .apple-glass');
        const r = card?.getBoundingClientRect();
        return {
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth,
            cardWidth: r?.width,
            cardHeight: r?.height,
            cardTop: r?.top,
            cardBottom: r?.bottom,
            viewportHeight: window.innerHeight,
        };
    }""")
    print("Mobile metrics:", mobile_info)

    out = "workspace/nasa_experience/docs/audit_screenshots/audit_mobile_390.png"
    page.screenshot(path=out)
    shutil.copy(out, r"C:\Users\rehan\.gemini\antigravity\brain\bcc1ca90-e327-4161-a9da-7e4b29fc80a1\audit_mobile_390.png")
    print("Saved mobile screenshot")

    browser.close()
