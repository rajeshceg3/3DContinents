from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            # Navigate to the local dev server
            page.goto("http://localhost:5173")

            # Wait for the loader to disappear or the header to appear
            # The header has an animation delay, so we wait for it
            expect(page.locator("h1")).to_be_visible(timeout=10000)

            # Wait a bit more for the fadeIn animation
            page.wait_for_timeout(3000)

            # Take a screenshot of the initial state (Pastel UI)
            page.screenshot(path="verification/ui_initial.png")
            print("Initial UI screenshot captured.")

            # Click the 'Orbit View' button just to interact
            # The button has id 'resetBtn'
            page.click("#resetBtn")
            page.wait_for_timeout(1000)

            # Take another screenshot
            page.screenshot(path="verification/ui_orbit.png")
            print("Orbit UI screenshot captured.")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
