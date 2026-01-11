import asyncio
from playwright.async_api import async_playwright
import os

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        print("Navigating to app...")
        await page.goto("http://localhost:5173")

        # Wait for loader to disappear
        await page.wait_for_selector("#loader", state="hidden", timeout=10000)

        # Wait for initial animation
        await asyncio.sleep(2)

        # Set viewport
        width = 1280
        height = 720
        await page.set_viewport_size({"width": width, "height": height})

        # Scan for continent
        print("Scanning for continent...")
        found = False
        center_x, center_y = width // 2, height // 2
        step = 20
        click_x, click_y = 0, 0

        for r in range(0, 300, step):
            for angle in range(0, 360, 45):
                import math
                rad = math.radians(angle)
                x = center_x + int(r * math.cos(rad))
                y = center_y + int(r * math.sin(rad))

                await page.mouse.move(x, y)
                await asyncio.sleep(0.05)

                cursor = await page.evaluate("document.body.style.cursor")
                if cursor == "pointer":
                    click_x, click_y = x, y
                    found = True
                    break
            if found: break

        if found:
            print("Clicking...")
            await page.mouse.click(click_x, click_y)

            print("Waiting for card...")
            await page.wait_for_selector("#infoCard", state="visible", timeout=5000)
            await asyncio.sleep(1)

            print("Taking screenshot...")
            if not os.path.exists("verification"):
                os.makedirs("verification")
            await page.screenshot(path="verification/verification.png")
            print("Done.")
        else:
            print("No continent found.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
