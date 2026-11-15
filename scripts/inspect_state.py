import time
from playwright.sync_api import sync_playwright

CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=CHROME_PATH, headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 960})
    page.goto("http://localhost:3000")
    time.sleep(2.5)

    # Check ScrollTrigger start and end values
    st_data = page.evaluate("""() => {
        const triggers = window.ScrollTrigger ? window.ScrollTrigger.getAll() : [];
        return triggers.map(t => ({
            id: t.vars.id || 'unnamed',
            trigger: t.trigger?.className,
            start: t.start,
            end: t.end,
            pin: !!t.pin,
            refreshPriority: t.vars.refreshPriority || 0,
        }));
    }""")
    print("ScrollTriggers:")
    for t in st_data:
        print(" ", t)

    # Scroll to 4486px
    page.evaluate("window.scrollTo(0, 4486)")
    time.sleep(0.5)

    info = page.evaluate("""() => {
        const card = document.querySelector('section[aria-label*="Section B"] .apple-glass');
        const h1 = document.querySelector('.harmony-word-the');
        const subtitle = document.querySelector('.harmony-subtitle-word');
        const headingSection = h1?.closest('div[class*="will-change-transform"]');
        return {
            val: card?.querySelector('.font-black.tabular-nums')?.textContent,
            h1Transform: h1 ? window.getComputedStyle(h1).transform : null,
            h1Opacity: h1 ? window.getComputedStyle(h1).opacity : null,
            subtitleOpacity: subtitle ? window.getComputedStyle(subtitle).opacity : null,
            headingSectionOpacity: headingSection ? window.getComputedStyle(headingSection).opacity : null,
            headingSectionTransform: headingSection ? window.getComputedStyle(headingSection).transform : null,
            headingSectionTop: headingSection ? headingSection.getBoundingClientRect().top : null,
            cardTop: card ? card.getBoundingClientRect().top : null,
            cardOpacity: card ? window.getComputedStyle(card).opacity : null,
        };
    }""")
    print("\nAt 4486px:", info)
    browser.close()
