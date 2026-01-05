from playwright.sync_api import sync_playwright

def verify_app(page):
    # Increase timeout for navigation and waiting
    page.goto("http://localhost:5173", timeout=10000)

    # Wait for the loader to disappear. It might take longer than 5s if intro is slow.
    # The intro in Interface.js starts after 1.8s, then takes 1.5s to hide loader.
    # Total ~3.3s. 5s should have been enough, but maybe machine is slow.
    # Increasing to 10s.
    try:
        page.wait_for_selector("#loader", state="hidden", timeout=15000)
    except Exception as e:
        print(f"Loader did not hide: {e}")
        # Take a debug screenshot
        page.screenshot(path="verification/debug_loader.png")
        return

    page.wait_for_selector("#webgl")

    # Wait a bit for the intro animation to finish (camera move takes 4.5s)
    page.wait_for_timeout(5000)

    # Take a screenshot of the initial state
    page.screenshot(path="verification/initial_state.png")
    print("Initial state screenshot captured.")

    # Interact with UI - click reset button (should be visible)
    reset_btn = page.locator("#resetBtn")
    if reset_btn.is_visible():
        reset_btn.click()
        page.wait_for_timeout(1000)
        page.screenshot(path="verification/after_reset.png")
        print("After reset screenshot captured.")

    # Test Quiz Mode toggle
    quiz_btn = page.locator("#quizBtn")
    if quiz_btn.is_visible():
        quiz_btn.click()
        page.wait_for_timeout(1000)
        page.screenshot(path="verification/quiz_mode.png")
        print("Quiz mode screenshot captured.")

        # Toggle back
        quiz_btn.click()
        page.wait_for_timeout(1000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            verify_app(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
