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

        # Set a reasonable viewport size
        page.set_viewport_size({"width": 1280, "height": 4000})

        # --- Verify all section headings are present ---
        expect(page.get_by_role("heading", name="Display", exact=True)).to_be_visible()
        expect(page.get_by_role("heading", name="Buttons & Controls", exact=True)).to_be_visible()
        expect(page.get_by_role("heading", name="Form Inputs", exact=True)).to_be_visible()
        expect(page.get_by_role("heading", name="Overlays & Feedback", exact=True)).to_be_visible()
        expect(page.get_by_role("heading", name="Layout & Structure", exact=True)).to_be_visible()

        # Take a screenshot to be safe
        page.screenshot(path="jules-scratch/verification/verification_structure.png", full_page=True)

        browser.close()

if __name__ == '__main__':
    main()