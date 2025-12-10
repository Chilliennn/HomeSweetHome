# Verification Instructions

Follow these steps to ensure all issues are resolved.

## 1. Verify Journey Pause Redirect (Fixing the "00:00:00" Loop)

**Scenario:** You are stuck on the Journey Pause page with a 00:00:00 timer, or want to verify it redirects correctly when cooldown ends.

1.  **Preparation:**

    - Navigate to the **Journey Pause** page (via Withdraw button in settings/progression).
    - Ensure you see the timer.

2.  **Action (Force Cooldown End):**

    - Run this SQL command to reset the cooldown timer:

    ```sql
    UPDATE relationships
    SET end_request_at = NOW() - INTERVAL '25 hours'
    WHERE status = 'paused';
    ```

3.  **Expected Result:**
    - The app should **immediately** redirect you back to the "Bonding" (Stage Progression) page.
    - **No Crash:** You should NOT see "GO_BACK handled by no navigator" error.

## 2. Verify Milestone Pop-up

**Scenario:** Checking if the milestone celebration (e.g., 7 days) appears correctly.

1.  **Preparation:**

    - **Log out** and log back in (This is important to reset the "already shown" state).

2.  **Action (Set Days):**

    - Run this SQL command to set your relationship duration to exactly 7 days:

    ```sql
    UPDATE relationships
    SET created_at = NOW() - INTERVAL '7 days'
    WHERE status = 'active';
    ```

3.  **Expected Result:**
    - Wait a few seconds. The **Milestone Celebration** page should pop up automatically.
    - If it doesn't appear within 5 seconds, pull down to refresh the Stage Progression page.

## 3. Verify Completed Stage Navigation

**Scenario:** Checking if you can view past completed stages.

1.  **Action:**

    - Go to the **Stage Progression** page.
    - Tap on a **Completed Stage** circle (green checkmark).

2.  **Expected Result:**
    - The app should navigate to the **Stage Completed** page for that specific stage.
    - You should see the stage completion details.
    - **Test:** Tap another completed circle _while_ on this page. It should switch to the new stage's details smoothly.
    - Verify the bottom navigation bar is visible and working.

## 4. Verify Real-Time Stage Completion

1.  **Action:**

    - Run this SQL to advance your stage (e.g., from 'getting_to_know' to 'trial_period'):

    ```sql
    UPDATE relationships
    SET current_stage = 'trial_period'
    WHERE current_stage = 'getting_to_know';
    ```

2.  **Expected Result:**
    - The app should detect the change and navigate to the **Stage Completed** page automatically.

## 5. Verify Stage Circles Visibility (Critical)

**Scenario:** Ensure stage circles never disappear, even when paused.

1.  **Action:**
    - Put the app in "Journey Pause" mode (withdraw).
    - If you are redirected back to "Bonding" page (due to cooldown expiry or cancellation), verify the circles are visible.
    - **Result:** You should see the stage circles and "Current Stage" card. It should NOT be empty.
