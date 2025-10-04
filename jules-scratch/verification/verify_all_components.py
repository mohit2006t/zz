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
        page.set_viewport_size({"width": 1280, "height": 3200})

        # --- Verify all section headings are present ---
        expect(page.get_by_role("heading", name="Button", exact=True)).to_be_visible()
        expect(page.get_by_role("heading", name="Accordion", exact=True)).to_be_visible()
        expect(page.get_by_role("heading", name="Dialog", exact=True)).to_be_visible()
        expect(page.get_by_role("heading", name="Tooltip", exact=True)).to_be_visible()
        expect(page.get_by_role("heading", name="Toast", exact=True)).to_be_visible()
        expect(page.get_by_role("heading", name="Card", exact=True)).to_be_visible()
        forms_heading = page.get_by_role("heading", name="Forms", exact=True)
        expect(forms_heading).to_be_visible()
        adv_forms_heading = page.get_by_role("heading", name="Advanced Forms & Inputs", exact=True)
        expect(adv_forms_heading).to_be_visible()
        expect(page.get_by_role("heading", name="Alert", exact=True)).to_be_visible()
        expect(page.get_by_role("heading", name="Avatar", exact=True)).to_be_visible()
        expect(page.get_by_role("heading", name="Badge", exact=True)).to_be_visible()

        # --- Verify component content within sections ---

        # Interact with Select to open it for the screenshot
        select_trigger = page.locator('.select-trigger')
        expect(select_trigger).to_be_visible()
        select_trigger.click()
        expect(page.locator('.select-popover')).to_be_visible()

        # Take a screenshot of the entire page
        page.screenshot(path="jules-scratch/verification/verification_full_library.png", full_page=True)

        browser.close()

if __name__ == '__main__':
    main()