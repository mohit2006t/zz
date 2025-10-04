from playwright.sync_api import sync_playwright, expect
import os

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        file_path = os.path.abspath('basecoat-clone-ui/index.html')
        page.goto(f'file://{file_path}')
        page.set_viewport_size({"width": 1280, "height": 4000})

        # --- Verify Interactive Components ---

        # 1. Dialog
        page.get_by_role("button", name="Open Dialog").click()
        dialog = page.get_by_role("dialog")
        expect(dialog).to_be_visible()
        dialog.get_by_role("button", name="Close").click()
        expect(dialog).not_to_be_visible()

        # 2. Tooltip
        page.get_by_role("button", name="Hover me").hover()
        expect(page.get_by_text("This is a tooltip!")).to_be_visible()
        # Move mouse away to hide tooltip for clean screenshot
        page.get_by_role("heading", name="Component Showcase").hover()
        expect(page.get_by_text("This is a tooltip!")).not_to_be_visible()

        # 3. Toast
        page.get_by_role("button", name="Show Toast").click()
        expect(page.get_by_text("Your message has been sent.")).to_be_visible()

        # 4. Select
        select_trigger = page.locator('.select-trigger')
        select_trigger.click()
        select_popover = page.locator('.select-popover')
        expect(select_popover).to_be_visible()
        # Click outside to close it reliably
        page.get_by_role("heading", name="Component Showcase").click()
        expect(select_popover).not_to_be_visible()

        # --- Take final screenshot ---
        # We add a small delay to ensure all animations (like the toast disappearing) have time to finish
        page.wait_for_timeout(1000)
        page.screenshot(path="jules-scratch/verification/verification_final.png", full_page=True)

        browser.close()

if __name__ == '__main__':
    main()