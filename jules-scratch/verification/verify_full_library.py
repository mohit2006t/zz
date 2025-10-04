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

        # --- Verify Component Interactions ---

        # 1. Dialog
        page.get_by_role("button", name="Open Dialog").click()
        dialog = page.get_by_role("dialog")
        expect(dialog).to_be_visible()
        expect(dialog.get_by_role("heading", name="Dialog Title")).to_be_visible()
        dialog.get_by_role("button", name="Close").click()
        expect(dialog).not_to_be_visible()

        # 2. Tooltip
        page.get_by_role("button", name="Hover me").hover()
        expect(page.get_by_text("This is a tooltip!")).to_be_visible()

        # 3. Toast
        page.get_by_role("button", name="Show Toast").click()
        expect(page.get_by_text("Your message has been sent.")).to_be_visible()

        # 4. Select
        select_trigger = page.locator('.select-trigger')
        select_trigger.click()
        select_popover = page.locator('.select-popover')
        expect(select_popover).to_be_visible()

        # Select a new option
        select_popover.get_by_text("Apple").click()
        expect(select_trigger.get_by_text("Apple")).to_be_visible()
        expect(select_popover).not_to_be_visible()

        # 5. Resizable (Just check visibility, interaction is hard to verify in a static screenshot)
        expect(page.get_by_label("Resizable Panel").locator('..').locator('.resizable')).to_be_visible()


        # Take a screenshot of the final state
        page.screenshot(path="jules-scratch/verification/verification_final.png", full_page=True)

        browser.close()

if __name__ == '__main__':
    main()