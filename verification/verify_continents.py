from playwright.sync_api import sync_playwright

def verify_continents(page):
    # Go to the local dev server
    page.goto("http://localhost:5173")

    # Wait for the canvas to be present
    page.wait_for_selector("#webgl")

    # Wait for the loader to disappear (it has a 1.5s delay + 1s fade)
    page.wait_for_timeout(3000)

    # Take a screenshot
    page.screenshot(path="verification/globe_screenshot.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_continents(page)
        finally:
            browser.close()
