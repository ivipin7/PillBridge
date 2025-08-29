from playwright.sync_api import Page, sync_playwright
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()
    page.set_default_timeout(30000)

    print("Navigating to auth page...")
    page.goto("http://localhost:5173/auth")

    print("Clicking 'Sign up'...")
    page.get_by_text("Sign up").click()

    print("Waiting for registration form to load...")
    time.sleep(3)

    print("Taking full page screenshot of registration page...")
    page.screenshot(path="jules-scratch/verification/register_page_full.png", full_page=True)
    print("Full page screenshot captured.")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
