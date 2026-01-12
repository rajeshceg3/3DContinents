from playwright.sync_api import sync_playwright

def verify_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            # Navigate to the app
            page.goto("http://localhost:5173")

            # Wait for loader to disappear
            page.wait_for_selector("#loader", state="hidden", timeout=10000)

            # Wait for canvas
            page.wait_for_selector("#webgl", state="visible")

            # Wait for UI controls
            page.wait_for_selector(".controls", state="visible", timeout=10000)

            # Take screenshot of initial state
            page.screenshot(path="verification/initial_state.png")
            print("Initial state screenshot captured.")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_ui()
