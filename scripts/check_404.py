import time
from playwright.sync_api import sync_playwright

CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=CHROME_PATH, headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 960})

    failed_requests = []
    page.on('response', lambda res: failed_requests.append(f"{res.status} {res.url}") if res.status >= 400 else None)

    page.goto("http://localhost:3000")
    time.sleep(3)

    print("Failed requests on page load:")
    for r in failed_requests:
        print(" ", r)

    browser.close()
