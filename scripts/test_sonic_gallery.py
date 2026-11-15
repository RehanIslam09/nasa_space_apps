import json
import time
from playwright.sync_api import sync_playwright

def test_sonic_gallery():
    with sync_playwright() as p:
        browser = p.chromium.launch(channel='chrome', headless=True)
        page = browser.new_page(viewport={'width': 1440, 'height': 900})
        
        print("Navigating to http://localhost:3000...")
        page.goto('http://localhost:3000', wait_until='domcontentloaded')
        page.wait_for_timeout(3000)
        
        gallery = page.locator('section[aria-label="Planetary Sonic Gallery"]')
        gallery.scroll_into_view_if_needed()
        page.wait_for_timeout(1000)
        
        # Test clicking dash 5 (index 4) inside gallery
        dash_5 = page.locator('section[aria-label="Planetary Sonic Gallery"] div[role="tablist"][aria-label="Carousel slide selectors"] button').nth(4)
        dash_5.click()
        page.wait_for_timeout(1200)
        
        card_info_after_tab = page.evaluate('''() => {
            const section = document.querySelector('section[aria-label="Planetary Sonic Gallery"]');
            const liveRegion = section ? section.querySelector('[aria-live="polite"]')?.textContent?.trim() : '';
            const activeCard = section ? section.querySelector('[role="group"][aria-roledescription="slide"].scale-100') : null;
            const title = activeCard ? activeCard.querySelector('h3')?.textContent?.trim() : '';
            return { liveRegion, title };
        }''')
        print("After Tab 5 Click:", card_info_after_tab)
        
        page.screenshot(path=r'C:\Users\rehan\.gemini\antigravity\brain\bcc1ca90-e327-4161-a9da-7e4b29fc80a1\sonic_gallery_card_5.png')
        print("Saved sonic_gallery_card_5.png")

        # Test vertical wheel scrolling through gallery
        initial_scroll = page.evaluate('window.scrollY')
        print("Initial window.scrollY before wheel:", initial_scroll)
        
        # Dispatch vertical wheel events over the gallery
        gallery_box = gallery.bounding_box()
        if gallery_box:
            page.mouse.move(gallery_box['x'] + gallery_box['width'] / 2, gallery_box['y'] + gallery_box['height'] / 2)
            page.mouse.wheel(0, 800)
            page.wait_for_timeout(1000)
            after_wheel_scroll = page.evaluate('window.scrollY')
            print("After wheel scroll window.scrollY:", after_wheel_scroll)
            assert after_wheel_scroll > initial_scroll, "Vertical wheel must scroll page!"

        # Mobile Viewport Verification
        mobile_page = browser.new_page(viewport={'width': 390, 'height': 844})
        mobile_page.goto('http://localhost:3000', wait_until='domcontentloaded')
        mobile_page.wait_for_timeout(2000)
        mob_gallery = mobile_page.locator('section[aria-label="Planetary Sonic Gallery"]')
        mob_gallery.scroll_into_view_if_needed()
        mobile_page.wait_for_timeout(1000)
        mobile_page.screenshot(path=r'C:\Users\rehan\.gemini\antigravity\brain\bcc1ca90-e327-4161-a9da-7e4b29fc80a1\sonic_gallery_mobile.png')
        print("Saved sonic_gallery_mobile.png")
        mobile_page.close()
        
        browser.close()
        print("Verification complete!")

if __name__ == '__main__':
    test_sonic_gallery()
