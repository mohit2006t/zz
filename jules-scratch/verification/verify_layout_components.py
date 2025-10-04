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
        page.set_viewport_size({"width": 1280, "height": 4000})

        # --- Verify Layout & Structure Section ---
        layout_section = page.get_by_role("heading", name="Layout & Structure", exact=True).locator('..').locator('.component-preview')

        # Verify Aspect Ratio
        expect(layout_section.locator('.aspect-ratio-16-9')).to_be_visible()

        # Verify Separator
        expect(layout_section.locator('.separator')).to_be_visible()

        # Verify Resizable
        expect(layout_section.locator('.resizable')).to_be_visible()

        # Verify Scroll Area
        expect(layout_section.locator('.scroll-area')).to_be_visible()

        # Verify Table
        expect(layout_section.get_by_role("table")).to_be_visible()

        # Take a screenshot of the entire page
        page.screenshot(path="jules-scratch/verification/verification_layout.png", full_page=True)

        browser.close()

if __name__ == '__main__':
    main()