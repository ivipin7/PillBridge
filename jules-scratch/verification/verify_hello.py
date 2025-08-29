from playwright.sync_api import Page, sync_playwright
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()
    print("Navigating to http://localhost:5173...")
    page.goto("http://localhost:5173")
    print("Waiting for 5 seconds...")
    time.sleep(5)
    print("Taking screenshot...")
    page.screenshot(path="jules-scratch/verification/hello.png")
    print("Screenshot captured.")
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
