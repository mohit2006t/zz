from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        # Get the absolute path to the index.html file
        file_path = os.path.abspath('basecoat-clone-ui/index.html')
        page.goto(f"file://{file_path}")
        # Give some time for fonts and layout to settle
        page.wait_for_timeout(1000)
        page.screenshot(path="jules-scratch/verification/verification.png", full_page=True)
        browser.close()

run()