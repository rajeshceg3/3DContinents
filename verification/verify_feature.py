from playwright.sync_api import sync_playwright

def verify_app():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            # Wait for Vite to start
            page.goto("http://localhost:5173")

            # Wait for loader to disappear
            page.wait_for_selector("#loader", state="hidden", timeout=10000)

            # Take screenshot of the initial view
            page.screenshot(path="verification/verification.png")

            print("Screenshot saved to verification/verification.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_app()
