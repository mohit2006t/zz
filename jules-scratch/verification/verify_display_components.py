from playwright.sync_api import sync_playwright, expect
import os

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Get the absolute path to the index.html file
        file_path = os.path.abspath('basecoat-clone-ui/index.html')

        # Go to the local file
        page.goto(f'file://{file_path}')

        # Set a reasonable viewport size for the screenshot
        page.set_viewport_size({"width": 1280, "height": 2000})

        # 1. Verify Alert
        alert = page.locator('.alert').first
        expect(alert).to_be_visible()
        expect(alert.get_by_role("heading", name="Alert Title")).to_be_visible()

        # 2. Verify Avatar
        avatar_image = page.locator('img[alt="User Avatar"]')
        expect(avatar_image).to_be_visible()
        avatar_fallback = page.get_by_text("CN")
        expect(avatar_fallback).to_be_visible()

        # 3. Verify Badge
        badge = page.get_by_text("Default")
        expect(badge).to_be_visible()
        expect(page.get_by_text("Primary")).to_be_visible()


        # Take a screenshot of the entire page
        page.screenshot(path="jules-scratch/verification/verification_display.png", full_page=True)

        browser.close()

if __name__ == '__main__':
    main()