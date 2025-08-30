import re
from playwright.sync_api import Page, expect, sync_playwright
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()
    page.set_default_timeout(30000)

    # --- Register Caregiver ---
    page.goto("http://localhost:5173/auth")
    page.get_by_text("Sign up").click()

    expect(page.get_by_text("Create your account")).to_be_visible()
    page.get_by_role("button", name="Caregiver").click()
    page.get_by_label("Full Name").fill("Test Caregiver")
    page.get_by_label("Email").fill("caregiver-final@test.com") # Use new email
    page.get_by_label("Password").fill("password123")
    page.get_by_role("button", name="Create Account").click()

    # --- Get Caregiver Code ---
    expect(page.get_by_text("Your Caregiver Code")).to_be_visible()
    caregiver_code_element = page.locator("p.text-2xl.font-mono.font-bold.text-blue-700")
    caregiver_code = caregiver_code_element.inner_text()

    # --- Log Out ---
    context.clear_cookies()
    page.evaluate("localStorage.clear()")
    page.goto("http://localhost:5173/auth")

    # --- Register Patient ---
    page.get_by_text("Sign up").click()
    page.get_by_role("button", name="Patient").click()
    page.get_by_label("Full Name").fill("Test Patient")
    page.get_by_label("Email").fill("patient-final@test.com") # Use new email
    page.get_by_label("Password").fill("password123")
    page.get_by_label("Caregiver Code").fill(caregiver_code)
    page.get_by_role("button", name="Create Account").click()

    # --- Log Out Again ---
    context.clear_cookies()
    page.evaluate("localStorage.clear()")
    page.goto("http://localhost:5173/auth")

    # --- Login as Caregiver ---
    page.get_by_label("Email").fill("caregiver-final@test.com")
    page.get_by_label("Password").fill("password123")
    page.get_by_role("button", name="Sign In").click()

    # --- Test Chat Functionality ---
    expect(page.get_by_text("Caregiver Dashboard")).to_be_visible()
    expect(page.get_by_text("Test Patient")).to_be_visible()
    # Select the patient
    page.get_by_text("Test Patient").first.click()

    # Check that the chat panel is visible and for the correct patient
    expect(page.get_by_text("AI Assistant for Test Patient")).to_be_visible()

    # Ask a question
    chat_input = page.get_by_placeholder("Ask the AI assistant...")
    chat_input.fill("What are the side effects of Paracetamol?")
    page.get_by_role("button", name="Send").click()

    # Wait for and verify the AI's response
    # The response will be in a specific element. Let's wait for it.
    ai_response_locator = page.locator(".bg-gray-200.text-gray-800.rounded-bl-none")
    expect(ai_response_locator).to_be_visible(timeout=20000) # Wait up to 20s for AI
    expect(ai_response_locator).not_to_be_empty()

    print("AI response received.")
    page.screenshot(path="jules-scratch/verification/final_verification.png")
    print("Screenshot captured successfully.")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
