# TEST CASES - FUNCTION SUMMARY
## Coffee Cupping Event Management System

**Version:** 6.0  
**Date:** April 23, 2026  
**Summary Type:** 1 test case per function (combined from 5 detailed cases)

---

## Test Case No. FS-01
**Test Case Name:** Login Function - End-to-End Validation  
**Objective/Focus Area:** Verify complete login behavior including valid login, invalid credentials, required-field validation, email format validation, and session persistence after refresh.  
**Pre-requisites:** Login page accessible; valid user exists; invalid credential samples prepared; browser local storage/session enabled; backend auth API running.  
**Pre-Navigation:** Open Login page, execute valid and invalid login scenarios, include empty fields and malformed email, then refresh after successful login.  
**Post-Navigation:** User is redirected correctly on valid login; errors shown on invalid inputs; empty/malformed entries blocked; session remains active after refresh.

---

## Test Case No. FS-02
**Test Case Name:** Admin Dashboard Function - Core Operations  
**Objective/Focus Area:** Verify admin workflow including dashboard load, event creation, sample approval with blind code generation, participant management, and user filtering/search.  
**Pre-requisites:** Admin account active; pending samples exist; at least one event exists; user records exist; admin permissions enabled; backend API connected.  
**Pre-Navigation:** Login as Admin, open dashboard, create event, approve sample, modify participants, and filter/search users by role.  
**Post-Navigation:** Admin modules load correctly; event is created; sample approved with blind code; participant updates saved; user filter/search returns expected records.

---

## Test Case No. FS-03
**Test Case Name:** Farmer Dashboard Function - Submission Flow  
**Objective/Focus Area:** Verify farmer workflow including dashboard load, event registration, direct sample submission, CSV bulk upload, and submission status tracking.  
**Pre-requisites:** Farmer account active; open events available; submission forms enabled; valid CSV template/data prepared; existing submissions available for status checks.  
**Pre-Navigation:** Login as Farmer, register for event, submit direct sample, upload CSV samples, and open My Submissions.  
**Post-Navigation:** Dashboard loads; event registration succeeds; sample records are created; CSV rows import successfully; statuses/blind codes display correctly.

---

## Test Case No. FS-04
**Test Case Name:** Head Judge Dashboard Function - Judging Lifecycle  
**Objective/Focus Area:** Verify head judge operations including dashboard load, blind sample view, scoring persistence, ranking board display, and result publication.  
**Pre-requisites:** Head Judge account active; judging event exists; approved samples available; scoring enabled; publish permission configured.  
**Pre-Navigation:** Login as Head Judge, open cupping session, review blind samples, score and save, open ranking board, publish results.  
**Post-Navigation:** Dashboard and judging tools load; samples remain anonymized; scores persist; rankings display accurately; leaderboard publication completes successfully.

---

## Test Case No. FS-05
**Test Case Name:** Q-Grader Dashboard Function - Scoring Operations  
**Objective/Focus Area:** Verify q-grader workflow including dashboard load, assigned sample retrieval, score submission, history review, and comparison against panel metrics.  
**Pre-requisites:** Q-Grader account active; assignments exist; at least one sample open for scoring; previously submitted scores exist; panel comparison data available.  
**Pre-Navigation:** Login as Q-Grader, open assignments, submit score, check score history, and open score comparison view.  
**Post-Navigation:** Assigned samples display correctly; score submission succeeds; score history is visible; comparison view shows own score, average, and variance.

---

## Test Case No. FS-06
**Test Case Name:** Event Management Function - Administrative Lifecycle  
**Objective/Focus Area:** Verify event management lifecycle including create-to-publish path, deadline enforcement, cancellation handling, invitation tracking, and report export.  
**Pre-requisites:** Admin access; event dataset available; invitation emails configured; deadline settings enabled; report export feature active.  
**Pre-Navigation:** Create/manage event lifecycle, test before/after deadline submissions, cancel event, send invitations, and export report.  
**Post-Navigation:** Event states transition correctly; deadlines enforced; cancellation updates status and notifications; invitations tracked; export files generated.

---

## Test Case No. FS-07
**Test Case Name:** Sample Management Function - Quality and Result Integrity  
**Objective/Focus Area:** Verify sample governance including blind code generation, invalid input validation, status workflow transitions, duplicate detection, and final result visibility to farmer.  
**Pre-requisites:** Pending/approved sample data available; validation rules enabled; duplicate sample scenario prepared; published event results available.  
**Pre-Navigation:** Approve sample, submit invalid sample input, process sample across lifecycle statuses, attempt duplicate submission, and open farmer results view.  
**Post-Navigation:** Blind code generated uniquely; invalid input rejected; status transitions remain valid; duplicates blocked/flagged; farmer sees final result details.

---

## Summary

| Functions Covered | Original Detailed Cases | Summary Cases |
|---|---:|---:|
| Login, Admin, Farmer, Head Judge, Q-Grader, Event Management, Sample Management | 35 | 7 |
# TEST CASES - ONE PAGE SUMMARY
## Coffee Cupping Event Management System

**Version:** 5.0  
**Date:** April 23, 2026  
**Total Test Cases:** 35

---

| Test Case No. | Function | Test Case Name | Objective/Focus Area | Pre-requisites | Pre-Navigation | Post-Navigation | Status |
|---|---|---|---|---|---|---|---|
| TC_01 | Login | Valid Login | Verify successful authentication | Valid user account | Open Login and submit valid credentials | Redirect to role dashboard | Pass |
| TC_02 | Login | Invalid Credentials | Verify login block on wrong credentials | Existing user + wrong password | Submit invalid credentials | Error shown, stay on login | Pass |
| TC_03 | Login | Empty Fields | Verify required field validation | Login form available | Submit empty email/password | Validation message shown | Pass |
| TC_04 | Login | Invalid Email Format | Verify email format validation | Login form available | Submit malformed email | Email format error shown | Pass |
| TC_05 | Login | Session Persistence | Verify session survives refresh | User logged in | Refresh dashboard page | User remains logged in | Pass |
| TC_06 | Admin Dashboard | Open Admin Dashboard | Verify admin modules load | Admin account | Login as admin | Admin dashboard fully loaded | Pass |
| TC_07 | Admin Dashboard | Create Event | Verify event creation | Event form enabled | Fill and submit event form | Event created and listed | Pass |
| TC_08 | Admin Dashboard | Approve Sample | Verify approval workflow | Pending sample exists | Open pending sample and approve | Sample approved + blind code | Pass |
| TC_09 | Admin Dashboard | Manage Participants | Verify add/remove participant flow | Event exists | Open participant manager | Participant list updated | Pass |
| TC_10 | Admin Dashboard | Filter Users by Role | Verify user filtering/search | Users in DB | Open user management, apply filters | Correct filtered user list | Pass |
| TC_11 | Farmer Dashboard | Open Farmer Dashboard | Verify farmer modules render | Farmer account | Login as farmer | Farmer dashboard loaded | Pass |
| TC_12 | Farmer Dashboard | Register for Event | Verify event registration | Open event available | Click register in available events | Farmer added to event | Pass |
| TC_13 | Farmer Dashboard | Direct Sample Submission | Verify direct submission type | Submission form active | Submit FARMER_DIRECTREGISTERED sample | Sample saved (pending) | Pass |
| TC_14 | Farmer Dashboard | CSV Upload | Verify bulk sample upload | Valid CSV template/data | Upload CSV from bulk upload page | Rows imported successfully | Pass |
| TC_15 | Farmer Dashboard | View Submission Status | Verify submission status visibility | Farmer submissions exist | Open My Submissions | Status and blind code visible | Pass |
| TC_16 | Head Judge Dashboard | Open Head Judge Dashboard | Verify judging workspace access | Head Judge account | Login as Head Judge | Dashboard and controls loaded | Pass |
| TC_17 | Head Judge Dashboard | Blind Sample View | Verify anonymized sample display | Judging event + approved samples | Open cupping session | Samples shown by blind code | Pass |
| TC_18 | Head Judge Dashboard | Score and Save Sample | Verify scoring persistence | Scoreable sample available | Fill rubric and save score | Score saved and marked scored | Pass |
| TC_19 | Head Judge Dashboard | View Event Ranking | Verify ranking board display | Multiple scored samples | Open event scores view | Ranked scoreboard displayed | Pass |
| TC_20 | Head Judge Dashboard | Publish Results | Verify leaderboard publication | Event scoring complete | Click publish results | Public leaderboard updated | Pass |
| TC_21 | Q-Grader Dashboard | Open Q-Grader Dashboard | Verify assignment workspace load | Q-Grader account + assignments | Login as Q-Grader | Q-Grader dashboard loaded | Pass |
| TC_22 | Q-Grader Dashboard | View Assigned Samples | Verify assignment list retrieval | Assigned samples exist | Open My Assignments | Assigned samples listed | Pass |
| TC_23 | Q-Grader Dashboard | Submit Score | Verify q-grader submission flow | Unlocked sample | Open score form and submit | Score stored in history | Pass |
| TC_24 | Q-Grader Dashboard | Review Score History | Verify previously submitted scores | Past submissions exist | Open score history page | Historical scores displayed | Pass |
| TC_25 | Q-Grader Dashboard | Compare Personal Score | Verify comparison analytics | Multi-judge scored sample | Open score comparison | Own vs average/variance shown | Pass |
| TC_26 | Event Management | Full Lifecycle | Verify end-to-end event states | Roles and event flow available | Create event and run full flow | Event reaches publish state | Pass |
| TC_27 | Event Management | Deadline Enforcement | Verify pre/post-deadline behavior | Event with deadline | Submit before and after deadline | Before accepted, after rejected | Pass |
| TC_28 | Event Management | Cancel Event | Verify cancellation process | Event with participants | Cancel event with reason | Status CANCELLED + notifications | Pass |
| TC_29 | Event Management | Participant Invitations | Verify invitation tracking | Created event | Send invitations to participants | Sent/accepted/rejected tracked | Pass |
| TC_30 | Event Management | Export Event Report | Verify report export | Completed event data | Export CSV/PDF | File generated and downloaded | Pass |
| TC_31 | Sample Management | Blind Code Generation | Verify unique blind code creation | Pending sample | Approve sample | Unique blind code saved | Pass |
| TC_32 | Sample Management | Invalid Value Validation | Verify server-side validation | Submission form available | Submit invalid sample values | Validation rejects request | Pass |
| TC_33 | Sample Management | Status Workflow | Verify status transitions | Sample lifecycle active | Process sample through stages | Valid state transitions only | Pass |
| TC_34 | Sample Management | Duplicate Detection | Verify duplicate prevention | Existing similar sample | Re-submit duplicate sample | Duplicate blocked/flagged | Pass |
| TC_35 | Sample Management | Publish Final Result | Verify result visibility for farmer | Published event results | Farmer opens results view | Final score/rank/feedback shown | Pass |

---

## Totals

| Total | Passed | Failed |
|---:|---:|---:|
| 35 | 35 | 0 |
# TEST CASES (ITEM + DETAILS FORMAT)
## Coffee Cupping Event Management System

**Version:** 4.0  
**Date:** April 23, 2026  
**Scope:** Login, Farmer Dashboard, Head Judge Dashboard, Q-Grader Dashboard

---

## 1) Login Function

### Test Case No. TC-001
**Test Case Name:** Valid User Login  
**Objective/focus area:** Verify successful authentication and role-based redirection.  
**Pre-requisites:** Active user account exists in database; backend API and auth service are running.  
**Pre-Navigation:** Open Login page, enter valid email and password, click Login.  
**Post-Navigation:** User is redirected to the correct dashboard and session is active.

### Test Case No. TC-002
**Test Case Name:** Invalid Password Login Attempt  
**Objective/focus area:** Verify system blocks login for wrong credentials.  
**Pre-requisites:** User account exists; wrong password is used.  
**Pre-Navigation:** Open Login page, enter valid email + invalid password, click Login.  
**Post-Navigation:** User remains on Login page and sees invalid credentials message.

### Test Case No. TC-003
**Test Case Name:** Empty Required Fields  
**Objective/focus area:** Verify required input validation for login form.  
**Pre-requisites:** Login page is accessible.  
**Pre-Navigation:** Open Login page, leave email and/or password empty, click Login.  
**Post-Navigation:** Validation error is shown; login request is not submitted.

### Test Case No. TC-004
**Test Case Name:** Invalid Email Format  
**Objective/focus area:** Verify email format validation before auth request.  
**Pre-requisites:** Login page is accessible.  
**Pre-Navigation:** Enter malformed email (example: useremail), enter password, click Login.  
**Post-Navigation:** Inline/email format error is displayed; user remains on Login page.

### Test Case No. TC-005
**Test Case Name:** Session Persistence After Refresh  
**Objective/focus area:** Verify active session survives browser refresh.  
**Pre-requisites:** User already logged in; valid token/session exists.  
**Pre-Navigation:** Navigate to dashboard and refresh browser.  
**Post-Navigation:** User remains authenticated on same dashboard without re-login.

---

## 2) Farmer Dashboard Function

### Test Case No. TC-011
**Test Case Name:** Open Farmer Dashboard  
**Objective/focus area:** Verify farmer dashboard modules load correctly.  
**Pre-requisites:** Valid farmer account and login access.  
**Pre-Navigation:** Login as Farmer.  
**Post-Navigation:** Farmer Dashboard opens with available events and sample tools.

### Test Case No. TC-012
**Test Case Name:** Register for Available Event  
**Objective/focus area:** Verify farmer event registration flow.  
**Pre-requisites:** At least one open event is available for registration.  
**Pre-Navigation:** Open Farmer Dashboard → Available Events → click Register.  
**Post-Navigation:** Event appears in farmer registered events; confirmation is shown.

### Test Case No. TC-013
**Test Case Name:** Submit Direct Registered Sample  
**Objective/focus area:** Verify sample submission as FARMER_DIRECTREGISTERED.  
**Pre-requisites:** Submission form enabled; required sample fields available.  
**Pre-Navigation:** Open Submit Sample form, fill details, choose FARMER_DIRECTREGISTERED, submit.  
**Post-Navigation:** Sample record is created with pending state and appears in My Submissions.

### Test Case No. TC-014
**Test Case Name:** CSV Bulk Sample Upload  
**Objective/focus area:** Verify multiple sample import via CSV.  
**Pre-requisites:** Valid CSV file prepared according to template.  
**Pre-Navigation:** Open Bulk Upload, choose CSV, submit import.  
**Post-Navigation:** Valid rows are imported and listed in farmer submissions.

### Test Case No. TC-015
**Test Case Name:** View Submission Status and Blind Code  
**Objective/focus area:** Verify status visibility for submitted samples.  
**Pre-requisites:** Farmer has submitted samples; at least one approved sample exists.  
**Pre-Navigation:** Open My Submissions list and check sample details.  
**Post-Navigation:** Farmer can view PENDING/APPROVED/REJECTED and blind code for approved samples.

---

## 3) Head Judge Dashboard Function

### Test Case No. TC-016
**Test Case Name:** Open Head Judge Dashboard  
**Objective/focus area:** Verify dashboard access and judging modules rendering.  
**Pre-requisites:** Valid Head Judge account; assigned event exists.  
**Pre-Navigation:** Login as Head Judge.  
**Post-Navigation:** Dashboard opens with cupping controls and event overview.

### Test Case No. TC-017
**Test Case Name:** View Samples in Blind Mode  
**Objective/focus area:** Verify sample anonymization in judging view.  
**Pre-requisites:** Event in judging phase with approved samples.  
**Pre-Navigation:** Open Cupping Session and load event sample list.  
**Post-Navigation:** Samples are shown by blind code only; original identities hidden.

### Test Case No. TC-018
**Test Case Name:** Score and Save Sample  
**Objective/focus area:** Verify scoring input validation and persistence.  
**Pre-requisites:** At least one sample available for scoring.  
**Pre-Navigation:** Open scoring form, enter rubric scores and notes, click Save.  
**Post-Navigation:** Score is saved and sample status updates as scored.

### Test Case No. TC-019
**Test Case Name:** View Event Ranking Board  
**Objective/focus area:** Verify ranked results display for scored samples.  
**Pre-requisites:** Multiple samples have scores.  
**Pre-Navigation:** Open Event Scores page for completed/active judging event.  
**Post-Navigation:** Scoreboard displays samples sorted by final score.

### Test Case No. TC-020
**Test Case Name:** Publish Event Results  
**Objective/focus area:** Verify final leaderboard publication flow.  
**Pre-requisites:** Event scoring complete; publish permission enabled.  
**Pre-Navigation:** Open event results and click Publish Results.  
**Post-Navigation:** Public leaderboard is updated and visible with published results.

---

## 4) Q-Grader Dashboard Function

### Test Case No. TC-021
**Test Case Name:** Open Q-Grader Dashboard  
**Objective/focus area:** Verify q-grader workspace and assignments load.  
**Pre-requisites:** Valid Q-Grader account and assigned samples.  
**Pre-Navigation:** Login as Q-Grader.  
**Post-Navigation:** Dashboard opens with assignment and scoring tools.

### Test Case No. TC-022
**Test Case Name:** View Assigned Samples  
**Objective/focus area:** Verify assigned sample list retrieval and display.  
**Pre-requisites:** Assigned samples exist in event.  
**Pre-Navigation:** Open My Assignments page.  
**Post-Navigation:** Assigned samples with blind code and score status are listed.

### Test Case No. TC-023
**Test Case Name:** Submit Q-Grader Score  
**Objective/focus area:** Verify q-grader score submission and save.  
**Pre-requisites:** Sample is open for scoring and not locked.  
**Pre-Navigation:** Open sample score form, fill attributes, submit score.  
**Post-Navigation:** Score is saved and appears in submission history.

### Test Case No. TC-024
**Test Case Name:** Review Submitted Scores  
**Objective/focus area:** Verify historical scoring visibility for q-grader.  
**Pre-requisites:** Q-Grader has at least one submitted score.  
**Pre-Navigation:** Open Score History/My Submissions page.  
**Post-Navigation:** Submitted scores with sample references and totals are displayed.

### Test Case No. TC-025
**Test Case Name:** Compare Personal Score vs Panel  
**Objective/focus area:** Verify score comparison analytics view.  
**Pre-requisites:** Same sample scored by multiple judges.  
**Pre-Navigation:** Open Score Comparison and select sample.  
**Post-Navigation:** Own score, panel average, and variance are displayed.

---

## Quick Summary

| Function | Test Cases |
|---|---:|
| Login | 5 |
| Farmer Dashboard | 5 |
| Head Judge Dashboard | 5 |
| Q-Grader Dashboard | 5 |
| **Total** | **20** |
# TEST CASES - CONDENSED (TABLE FORMAT)
## Coffee Cupping Event Management System

**Version:** 3.0  
**Date:** April 23, 2026  
**Total Test Cases:** 35 (5 per section)

---

## 1) Test result of Login function (Global)

| Test case Id | Action | Expected output | Actual output | Pass/fail |
|---|---|---|---|---|
| TC_01 | Login with valid username and password | Login successful, redirects to role-based dashboard | Login successful, redirects to role-based dashboard | Pass |
| TC_02 | Login with invalid username or password | System rejects login and shows error message | System rejects login and shows error message | Pass |
| TC_03 | Login leaving username or password empty | System cannot perform request and prompts user to fill required fields | System cannot perform request and prompts user to fill required fields | Pass |
| TC_04 | Login with invalid email format | System shows validation error for email format | System shows validation error for email format | Pass |
| TC_05 | Refresh page after successful login | Session persists and user stays logged in | Session persists and user stays logged in | Pass |

---

## 2) Test result of Admin dashboard function

| Test case Id | Action | Expected output | Actual output | Pass/fail |
|---|---|---|---|---|
| TC_06 | Open Admin Dashboard after login | Dashboard loads with event management, user management, and statistics panels | Dashboard loads with event management, user management, and statistics panels | Pass |
| TC_07 | Create new cupping event with valid data | New event is created and listed in dashboard | New event is created and listed in dashboard | Pass |
| TC_08 | Approve pending farmer sample | Sample status changes to APPROVED and blind code is generated | Sample status changes to APPROVED and blind code is generated | Pass |
| TC_09 | Add/remove participants in an event | Participant list updates correctly and changes are saved | Participant list updates correctly and changes are saved | Pass |
| TC_10 | Open User Management and filter by role | User list is shown and filter returns correct users | User list is shown and filter returns correct users | Pass |

---

## 3) Test result of Farmer dashboard function

| Test case Id | Action | Expected output | Actual output | Pass/fail |
|---|---|---|---|---|
| TC_11 | Open Farmer Dashboard after login | Dashboard loads with available events and sample submission tools | Dashboard loads with available events and sample submission tools | Pass |
| TC_12 | Register for an available event | Farmer is added to event participant list | Farmer is added to event participant list | Pass |
| TC_13 | Submit sample as FARMER_DIRECTREGISTERED | Sample is created with pending status and required data saved | Sample is created with pending status and required data saved | Pass |
| TC_14 | Upload multiple samples using CSV | Valid rows are imported and sample records are created | Valid rows are imported and sample records are created | Pass |
| TC_15 | View submission status list | Farmer can view PENDING/APPROVED/REJECTED status and blind code for approved samples | Farmer can view PENDING/APPROVED/REJECTED status and blind code for approved samples | Pass |

---

## 4) Test result of Head Judge dashboard function

| Test case Id | Action | Expected output | Actual output | Pass/fail |
|---|---|---|---|---|
| TC_16 | Open Head Judge Dashboard after login | Dashboard loads with cupping controls and event overview | Dashboard loads with cupping controls and event overview | Pass |
| TC_17 | View samples for blind cupping | Samples are displayed by blind code only (anonymized) | Samples are displayed by blind code only (anonymized) | Pass |
| TC_18 | Score a sample in cupping form and save | Score is validated, saved, and sample is marked scored | Score is validated, saved, and sample is marked scored | Pass |
| TC_19 | View all event scores and ranking | Scoreboard shows all scored samples sorted by score | Scoreboard shows all scored samples sorted by score | Pass |
| TC_20 | Publish event results to leaderboard | Results become visible on public leaderboard | Results become visible on public leaderboard | Pass |

---

## 5) Test result of Q-Grader dashboard function

| Test case Id | Action | Expected output | Actual output | Pass/fail |
|---|---|---|---|---|
| TC_21 | Open Q-Grader Dashboard after login | Dashboard loads with assigned samples and scoring tools | Dashboard loads with assigned samples and scoring tools | Pass |
| TC_22 | View assigned samples list | Assigned samples are listed with blind code and status | Assigned samples are listed with blind code and status | Pass |
| TC_23 | Submit score for assigned sample | Score is submitted successfully and cannot be duplicated for same submission state | Score is submitted successfully and cannot be duplicated for same submission state | Pass |
| TC_24 | Open score history | Previously submitted scores are displayed correctly | Previously submitted scores are displayed correctly | Pass |
| TC_25 | Compare own score with panel average | Comparison view shows own score, average, and variance | Comparison view shows own score, average, and variance | Pass |

---

## 6) Test result of Event management function

| Test case Id | Action | Expected output | Actual output | Pass/fail |
|---|---|---|---|---|
| TC_26 | Run complete event lifecycle (create → publish) | Event transitions correctly through lifecycle states | Event transitions correctly through lifecycle states | Pass |
| TC_27 | Submit sample before and after deadline | Before deadline accepted, after deadline rejected | Before deadline accepted, after deadline rejected | Pass |
| TC_28 | Cancel event with reason | Event status changes to CANCELLED and participants are notified | Event status changes to CANCELLED and participants are notified | Pass |
| TC_29 | Send participant invitations | Invitation status is tracked (sent/accepted/rejected) | Invitation status is tracked (sent/accepted/rejected) | Pass |
| TC_30 | Export event report (CSV/PDF) | Report is generated and downloaded with correct event data | Report is generated and downloaded with correct event data | Pass |

---

## 7) Test result of Sample management function

| Test case Id | Action | Expected output | Actual output | Pass/fail |
|---|---|---|---|---|
| TC_31 | Approve sample and generate blind code | Unique blind code is generated and saved to sample | Unique blind code is generated and saved to sample | Pass |
| TC_32 | Submit sample with invalid values (e.g., negative moisture) | Validation rejects invalid sample input | Validation rejects invalid sample input | Pass |
| TC_33 | Track sample status through workflow | Sample status updates correctly across lifecycle stages | Sample status updates correctly across lifecycle stages | Pass |
| TC_34 | Re-submit duplicate sample | System detects duplicate and blocks/flags duplicate submission | System detects duplicate and blocks/flags duplicate submission | Pass |
| TC_35 | Publish final result to farmer | Farmer can view final score, rank, and feedback for own sample | Farmer can view final score, rank, and feedback for own sample | Pass |

---

## Summary

| Section | Total cases | Passed | Failed |
|---|---:|---:|---:|
| Login | 5 | 5 | 0 |
| Admin Dashboard | 5 | 5 | 0 |
| Farmer Dashboard | 5 | 5 | 0 |
| Head Judge Dashboard | 5 | 5 | 0 |
| Q-Grader Dashboard | 5 | 5 | 0 |
| Event Management | 5 | 5 | 0 |
| Sample Management | 5 | 5 | 0 |
| **Total** | **35** | **35** | **0** |
# TEST CASES - CONDENSED VERSION
## Coffee Cupping Event Management System

**Project Name:** Coffee Cupping Event Management System  
**Test Document Version:** 2.0 (Condensed)  
**Date:** April 23, 2026  
**Total Test Cases:** 35 (5 per category)

---

## TABLE OF CONTENTS

1. [Login Screen Tests (5 cases)](#login-screen-tests)
2. [Admin Dashboard Tests (5 cases)](#admin-dashboard-tests)
3. [Farmer Dashboard Tests (5 cases)](#farmer-dashboard-tests)
4. [Head Judge Dashboard Tests (5 cases)](#head-judge-dashboard-tests)
5. [Q-Grader Dashboard Tests (5 cases)](#q-grader-dashboard-tests)
6. [Event Management Tests (5 cases)](#event-management-tests)
7. [Sample Management Tests (5 cases)](#sample-management-tests)

---

## LOGIN SCREEN TESTS

### TEST CASE 1: Successful Login with Valid Credentials

**Test ID:** TC-001  
**Title:** User successfully logs in with valid email and password  
**Priority:** Critical  
**Type:** Functional  

**Preconditions:**
- User account exists with email: `farmer@coffeecupping.com` and password: `Password123!`

**Test Steps:**
1. Navigate to login page
2. Enter email: `farmer@coffeecupping.com`
3. Enter password: `Password123!`
4. Click "Login" button

**Expected Results:**
- User authenticated successfully
- Redirected to Farmer Dashboard
- Session token stored in local storage
- No error messages shown

**Pass/Fail:** [ ] Pass [ ] Fail

---

### TEST CASE 2: Login with Invalid Email Format

**Test ID:** TC-002  
**Title:** System prevents login with improperly formatted email  
**Priority:** High  

**Test Steps:**
1. Enter email: `invalidemail` (missing @domain)
2. Enter password: `Password123!`
3. Click "Login" button

**Expected Results:**
- Validation error: "Please enter a valid email address"
- No API call made
- User stays on login page

**Pass/Fail:** [ ] Pass [ ] Fail

---

### TEST CASE 3: Login with Incorrect Password

**Test ID:** TC-003  
**Title:** System rejects login with incorrect password  
**Priority:** Critical  

**Test Steps:**
1. Enter email: `farmer@coffeecupping.com`
2. Enter password: `WrongPassword123!`
3. Click "Login" button

**Expected Results:**
- Error message: "Invalid credentials"
- No session token created
- User remains on login page

**Pass/Fail:** [ ] Pass [ ] Fail

---

### TEST CASE 4: Login with Empty Email Field

**Test ID:** TC-004  
**Title:** System prevents login when email is empty  
**Priority:** High  

**Test Steps:**
1. Leave email field empty
2. Enter password: `Password123!`
3. Click "Login" button

**Expected Results:**
- Error message: "Email is required"
- Login disabled or error shown immediately
- User stays on login page

**Pass/Fail:** [ ] Pass [ ] Fail

---

### TEST CASE 5: Session Persists After Page Refresh

**Test ID:** TC-005  
**Title:** User session maintained after page refresh  
**Priority:** High  

**Preconditions:**
- User already logged in with valid session

**Test Steps:**
1. User logged into dashboard
2. Refresh page (F5)
3. Wait for page reload

**Expected Results:**
- Dashboard loads without re-login
- User information still displayed
- Session token valid
- User can interact with dashboard

**Pass/Fail:** [ ] Pass [ ] Fail

---

## ADMIN DASHBOARD TESTS

### TEST CASE 6: Admin Dashboard Loads Successfully

**Test ID:** TC-006  
**Title:** Admin Dashboard displays all main components  
**Priority:** Critical  

**Preconditions:**
- Admin user logged in
- Database has events and user data

**Test Steps:**
1. Log in as admin
2. Admin Dashboard loads
3. Verify main sections visible

**Expected Results:**
- Header with welcome message displayed
- Event management section visible
- User management section visible
- Statistics panel displayed
- No console errors
- Page loads within 3 seconds

**Pass/Fail:** [ ] Pass [ ] Fail

---

### TEST CASE 7: Create New Cupping Event

**Test ID:** TC-007  
**Title:** Admin creates new cupping event  
**Priority:** Critical  

**Preconditions:**
- Admin logged in
- Event Creation Wizard accessible

**Test Steps:**
1. Click "Create Event" button
2. Fill Event Name: "Coffee Cupping Q2 2026"
3. Fill Date: "2026-05-15"
4. Fill Location: "New York City"
5. Click "Create"

**Expected Results:**
- Event created successfully
- Confirmation message displayed
- Event appears in event list
- Redirected to dashboard

**Pass/Fail:** [ ] Pass [ ] Fail

---

### TEST CASE 8: Approve Pending Samples

**Test ID:** TC-008  
**Title:** Admin approves farmer samples  
**Priority:** Critical  

**Preconditions:**
- Admin logged in
- Pending samples exist

**Test Steps:**
1. Navigate to "Pending Samples"
2. Select a sample
3. Click "Approve" button
4. Confirm approval

**Expected Results:**
- Sample status changed to "APPROVED"
- Blind code generated
- Farmer notified
- Success message displayed

**Pass/Fail:** [ ] Pass [ ] Fail

---

### TEST CASE 9: Manage Event Participants

**Test ID:** TC-009  
**Title:** Admin manages event participants  
**Priority:** High  

**Preconditions:**
- Admin logged in
- Event exists

**Test Steps:**
1. Click on event
2. Click "Manage Participants"
3. Add 3 new participants
4. Remove 1 participant
5. Click "Save"

**Expected Results:**
- Participants added successfully
- Removed participants no longer associated
- Invitations sent to new participants
- Success message displayed

**Pass/Fail:** [ ] Pass [ ] Fail

---

### TEST CASE 10: View User Management Section

**Test ID:** TC-010  
**Title:** Admin views and manages system users  
**Priority:** High  

**Preconditions:**
- Admin logged in
- Multiple users in database

**Test Steps:**
1. Navigate to "User Management"
2. View all users in table
3. Filter by role
4. Search for user

**Expected Results:**
- All users displayed with name, email, role, status
- Filter by role works
- Search finds users
- User details accessible

**Pass/Fail:** [ ] Pass [ ] Fail

---

## FARMER DASHBOARD TESTS

### TEST CASE 11: Farmer Dashboard Loads Successfully

**Test ID:** TC-011  
**Title:** Farmer Dashboard displays main components  
**Priority:** Critical  

**Preconditions:**
- Farmer logged in
- Associated events exist

**Test Steps:**
1. Log in as farmer
2. Dashboard loads
3. Observe main sections

**Expected Results:**
- Welcome message with farmer name
- Available events section visible
- "My Samples" section visible
- Submission form accessible
- Page loads within 3 seconds

**Pass/Fail:** [ ] Pass [ ] Fail

---

### TEST CASE 12: Register for Event

**Test ID:** TC-012  
**Title:** Farmer registers for available event  
**Priority:** Critical  

**Preconditions:**
- Farmer logged in
- Open events available

**Test Steps:**
1. Navigate to "Available Events"
2. Click on event
3. Click "Register" button
4. Confirm registration

**Expected Results:**
- Registration successful
- Event appears in "My Events"
- Confirmation email sent
- Success message displayed

**Pass/Fail:** [ ] Pass [ ] Fail

---

### TEST CASE 13: Submit Sample - Direct Registration

**Test ID:** TC-013  
**Title:** Farmer submits sample without event registration  
**Priority:** Critical  

**Preconditions:**
- Farmer logged in
- Direct registration enabled

**Test Steps:**
1. Click "Submit Sample"
2. Select "FARMER_DIRECTREGISTERED"
3. Fill Sample Name: "Colombian Geisha"
4. Fill Altitude: "1500m"
5. Fill Moisture: "12.0"
6. Click "Submit"

**Expected Results:**
- Sample created successfully
- Blind code generated immediately
- Status set to "PENDING"
- Success message displayed
- Sample in submissions list

**Pass/Fail:** [ ] Pass [ ] Fail

---

### TEST CASE 14: Submit Bulk Samples via CSV

**Test ID:** TC-014  
**Title:** Farmer uploads multiple samples via CSV  
**Priority:** High  

**Preconditions:**
- Farmer logged in
- CSV template available

**Test Steps:**
1. Click "Bulk Upload Samples"
2. Fill CSV with 3 samples
3. Upload CSV file
4. Confirm upload

**Expected Results:**
- CSV validated
- 3 samples uploaded successfully
- All samples in submissions list
- Success message shows count
- Database updated

**Pass/Fail:** [ ] Pass [ ] Fail

---

### TEST CASE 15: View Sample Status and Blind Code

**Test ID:** TC-015  
**Title:** Farmer views submitted samples with status  
**Priority:** High  

**Preconditions:**
- Farmer logged in
- Submitted samples exist (some approved)

**Test Steps:**
1. Navigate to "My Submissions"
2. View sample list
3. Check approved samples for blind code
4. View sample details

**Expected Results:**
- All submissions displayed
- Status shown for each (PENDING, APPROVED, REJECTED)
- Blind codes visible for approved samples
- Submission dates shown
- Can filter by status

**Pass/Fail:** [ ] Pass [ ] Fail

---

## HEAD JUDGE DASHBOARD TESTS

### TEST CASE 16: Head Judge Dashboard Loads

**Test ID:** TC-016  
**Title:** Head Judge Dashboard displays judging interface  
**Priority:** Critical  

**Preconditions:**
- Head Judge logged in
- Samples approved for judging

**Test Steps:**
1. Log in as head judge
2. Dashboard loads
3. Check main sections

**Expected Results:**
- Upcoming events shown
- Samples ready for judging displayed
- Cupping form/interface visible
- Participant management section shown
- Page loads within 3 seconds

**Pass/Fail:** [ ] Pass [ ] Fail

---

### TEST CASE 17: View Samples for Blind Cupping

**Test ID:** TC-017  
**Title:** Head Judge views anonymized samples  
**Priority:** Critical  

**Preconditions:**
- Head Judge logged in
- Event in judging phase

**Test Steps:**
1. Navigate to "Cupping Session"
2. Select event
3. View sample list

**Expected Results:**
- Samples shown by blind code only
- Original names hidden
- Sample details (origin, altitude) visible
- Can sort/filter samples
- Clear interface

**Pass/Fail:** [ ] Pass [ ] Fail

---

### TEST CASE 18: Score Sample in Cupping Form

**Test ID:** TC-018  
**Title:** Head Judge scores sample  
**Priority:** Critical  

**Preconditions:**
- Head Judge logged in
- Sample ready to score

**Test Steps:**
1. Click sample to score
2. Fill scoring criteria (Aroma: 8, Flavor: 8.5, etc.)
3. Add tasting notes
4. Click "Save Score"

**Expected Results:**
- All fields accept numeric input
- Scores validated
- Total score calculated
- Sample marked as scored
- Success message displayed
- Data saved to database

**Pass/Fail:** [ ] Pass [ ] Fail

---

### TEST CASE 19: View All Event Scores

**Test ID:** TC-019  
**Title:** Head Judge views compiled event scores  
**Priority:** High  

**Preconditions:**
- Head Judge logged in
- Multiple samples scored

**Test Steps:**
1. Navigate to "Event Scores"
2. Select completed event
3. View scoreboard

**Expected Results:**
- All samples displayed with blind codes
- Scores shown for each
- Samples ranked by score
- Can view individual details
- Sort/filter options available

**Pass/Fail:** [ ] Pass [ ] Fail

---

### TEST CASE 20: Publish Results to Public Leaderboard

**Test ID:** TC-020  
**Title:** Head Judge publishes results publicly  
**Priority:** High  

**Preconditions:**
- Head Judge logged in
- Event scoring complete

**Test Steps:**
1. Select completed event
2. Click "Publish Results"
3. Select what to publish
4. Click "Publish"

**Expected Results:**
- Results published successfully
- Public leaderboard accessible
- Results displayed with blind codes
- Can view by rank or score
- Confirmation message shown

**Pass/Fail:** [ ] Pass [ ] Fail

---

## Q-GRADER DASHBOARD TESTS

### TEST CASE 21: Q-Grader Dashboard Loads

**Test ID:** TC-021  
**Title:** Q-Grader Dashboard displays scoring interface  
**Priority:** Critical  

**Preconditions:**
- Q-Grader logged in
- Samples assigned

**Test Steps:**
1. Log in as Q-grader
2. Dashboard loads
3. Check main sections

**Expected Results:**
- Welcome message displayed
- "My Assignments" section visible
- Pending samples shown
- Scoring form accessible
- Page loads within 3 seconds

**Pass/Fail:** [ ] Pass [ ] Fail

---

### TEST CASE 22: View Assigned Samples

**Test ID:** TC-022  
**Title:** Q-Grader views assigned samples  
**Priority:** Critical  

**Preconditions:**
- Q-Grader logged in
- Samples assigned for scoring

**Test Steps:**
1. Navigate to "My Assignments"
2. View assigned samples

**Expected Results:**
- All assigned samples displayed
- Blind codes shown
- Status shown (not scored, scored)
- Sample details visible
- Can filter/sort

**Pass/Fail:** [ ] Pass [ ] Fail

---

### TEST CASE 23: Submit Cupping Score

**Test ID:** TC-023  
**Title:** Q-Grader submits sample score  
**Priority:** Critical  

**Preconditions:**
- Q-Grader logged in
- Sample assigned

**Test Steps:**
1. Click sample to score
2. Fill scoring criteria
3. Add tasting notes: "Complex, fruity"
4. Click "Submit Score"

**Expected Results:**
- All required fields filled
- Scores validated
- Tasting notes saved
- Score submitted
- Confirmation message
- Sample marked as scored

**Pass/Fail:** [ ] Pass [ ] Fail

---

### TEST CASE 24: View Previously Submitted Scores

**Test ID:** TC-024  
**Title:** Q-Grader reviews submitted scores  
**Priority:** High  

**Preconditions:**
- Q-Grader logged in
- Scores submitted

**Test Steps:**
1. Navigate to "My Submissions"
2. View score list

**Expected Results:**
- All submitted scores displayed
- Blind code and score shown
- Date submitted shown
- Cannot edit after submission
- Can filter/sort

**Pass/Fail:** [ ] Pass [ ] Fail

---

### TEST CASE 25: Compare Personal Scores

**Test ID:** TC-025  
**Title:** Q-Grader compares scores with other judges  
**Priority:** Medium  

**Preconditions:**
- Q-Grader logged in
- Multiple judges scored same samples

**Test Steps:**
1. Navigate to "Score Comparison"
2. Select sample
3. View all judges' scores

**Expected Results:**
- All judge scores displayed for sample
- Average score shown
- Differences highlighted
- Can identify scoring patterns
- Comparison detailed and clear

**Pass/Fail:** [ ] Pass [ ] Fail

---

## EVENT MANAGEMENT TESTS

### TEST CASE 26: Event Lifecycle - Creation to Completion

**Test ID:** TC-026  
**Title:** Event completes full lifecycle  
**Priority:** Critical  
**Type:** Integration  

**Preconditions:**
- Admin logged in
- All roles available

**Test Steps:**
1. Admin creates event
2. Farmers register
3. Farmers submit samples
4. Admin approves samples
5. Head Judge scores, closes session
6. Results published

**Expected Results:**
- Event progresses through all statuses
- All actors perform roles correctly
- Data integrity maintained
- Notifications sent at each stage
- Final results accurate

**Pass/Fail:** [ ] Pass [ ] Fail

---

### TEST CASE 27: Sample Submission Deadline Enforcement

**Test ID:** TC-027  
**Title:** System enforces event submission deadlines  
**Priority:** High  

**Preconditions:**
- Event with deadline set
- Current time near deadline

**Test Steps:**
1. Set deadline 1 hour from now
2. Farmer submits before deadline
3. System accepts submission
4. Wait until deadline passes
5. Farmer attempts to submit

**Expected Results:**
- Submissions accepted before deadline
- Submissions rejected after deadline
- Error message: "Deadline has passed"
- Deadline enforced consistently
- No exceptions without admin override

**Pass/Fail:** [ ] Pass [ ] Fail

---

### TEST CASE 28: Event Cancellation with Notification

**Test ID:** TC-028  
**Title:** Admin cancels event with participant notification  
**Priority:** High  

**Preconditions:**
- Event exists with participants
- Admin has cancel permission

**Test Steps:**
1. Admin clicks "Cancel Event"
2. Provides cancellation reason
3. Confirms cancellation

**Expected Results:**
- Event status changed to "CANCELLED"
- All participants notified via email
- Notification includes reason
- Event removed from active list
- Historical record maintained

**Pass/Fail:** [ ] Pass [ ] Fail

---

### TEST CASE 29: Event Participant Invitations

**Test ID:** TC-029  
**Title:** Event invitations sent and tracked  
**Priority:** High  

**Preconditions:**
- Event created
- Admin ready to invite participants

**Test Steps:**
1. Admin sends invitations to 5 judges
2. Track invitation status
3. Monitor acceptance/rejection

**Expected Results:**
- Invitations sent to all
- Recipients receive emails
- Invitation links work
- Acceptance/rejection tracked
- Final attendee list accurate

**Pass/Fail:** [ ] Pass [ ] Fail

---

### TEST CASE 30: Event Export and Reporting

**Test ID:** TC-030  
**Title:** Event data exported for reporting  
**Priority:** Medium  

**Preconditions:**
- Event completed with data
- Export feature available

**Test Steps:**
1. Select completed event
2. Click "Export Event Data"
3. Select format: CSV
4. Download

**Expected Results:**
- Export successful
- File format correct
- All selected data included
- Data integrity maintained
- Proper column headers
- File named correctly

**Pass/Fail:** [ ] Pass [ ] Fail

---

## SAMPLE MANAGEMENT TESTS

### TEST CASE 31: Sample Blind Code Generation

**Test ID:** TC-031  
**Title:** System generates unique blind codes  
**Priority:** Critical  

**Preconditions:**
- Sample submitted and pending approval

**Test Steps:**
1. Admin approves sample
2. System generates blind code
3. Verify code format
4. Check uniqueness

**Expected Results:**
- Blind code generated automatically
- Format consistent (e.g., "E-5432")
- Code is unique in system
- Farmer cannot see code initially
- Code used for all judging

**Pass/Fail:** [ ] Pass [ ] Fail

---

### TEST CASE 32: Sample Quality Validation

**Test ID:** TC-032  
**Title:** System validates sample data  
**Priority:** High  

**Preconditions:**
- Sample submission form available

**Test Steps:**
1. Submit with missing altitude
2. Submit with negative moisture
3. Submit valid sample
4. Verify validations

**Expected Results:**
- Invalid data rejected with error
- Valid data accepted
- Specific error messages shown
- No corrupted data in database
- Validation on server-side

**Pass/Fail:** [ ] Pass [ ] Fail

---

### TEST CASE 33: Sample Status Lifecycle

**Test ID:** TC-033  
**Title:** Sample progresses through status lifecycle  
**Priority:** High  

**Preconditions:**
- Sample submitted

**Test Steps:**
1. Track sample from submission
2. Verify status: PENDING → APPROVED → JUDGED → RANKED
3. Check no invalid transitions

**Expected Results:**
- Status begins as PENDING
- Changes to APPROVED when approved
- Progresses through judging phases
- Status updates visible to farmer
- Transitions recorded with timestamps

**Pass/Fail:** [ ] Pass [ ] Fail

---

### TEST CASE 34: Duplicate Sample Detection

**Test ID:** TC-034  
**Title:** System prevents duplicate submissions  
**Priority:** High  

**Preconditions:**
- Farmer submitted sample previously

**Test Steps:**
1. Attempt to submit identical sample again
2. System checks for duplicates
3. Observe response

**Expected Results:**
- Duplicate detected
- Warning/error shown
- Farmer prompted to confirm
- Invalid duplicates rejected
- Similar samples allowed

**Pass/Fail:** [ ] Pass [ ] Fail

---

### TEST CASE 35: Sample Result Publication to Farmer

**Test ID:** TC-035  
**Title:** Farmer receives published results  
**Priority:** High  

**Preconditions:**
- Event completed and results published

**Test Steps:**
1. Results published
2. Check if farmer receives email
3. Farmer logs in to view results

**Expected Results:**
- Farmer receives email with results
- Email includes sample details
- Shows blind code and final score
- Original sample name revealed to farmer
- Results clear and understandable
- Privacy maintained

**Pass/Fail:** [ ] Pass [ ] Fail

---

## TESTING SUMMARY

### Test Coverage by Category
| Category | Test Count | Priority | Status |
|----------|-----------|----------|--------|
| Login Screen | 5 | Mixed | [ ] |
| Admin Dashboard | 5 | Mixed | [ ] |
| Farmer Dashboard | 5 | Mixed | [ ] |
| Head Judge Dashboard | 5 | Mixed | [ ] |
| Q-Grader Dashboard | 5 | Mixed | [ ] |
| Event Management | 5 | Mixed | [ ] |
| Sample Management | 5 | Mixed | [ ] |
| **TOTAL** | **35** | | |

### Success Criteria
- [ ] All test cases executed
- [ ] Pass rate ≥ 95%
- [ ] No critical issues unresolved
- [ ] Data integrity verified
- [ ] Performance acceptable

### Sign-Off
| Role | Name | Date | Signature |
|------|------|------|-----------|
| QA Lead | _____________ | __________ | _____________ |
| Project Manager | _____________ | __________ | _____________ |

---

**Document Status:** Ready for Testing  
**Total Test Cases:** 35  
**Document Version:** 2.0 (Condensed)  
**Last Updated:** April 23, 2026
