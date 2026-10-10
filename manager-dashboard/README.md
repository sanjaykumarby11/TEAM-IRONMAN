# Employee Leave Management Module

## Overview
This project is a complete Employee Leave Management Module that satisfies all core requirements without requiring a complex backend infrastructure. It uses the browser's `localStorage` as a real-time, synchronized database (`store.js`), allowing it to function flawlessly as a robust frontend application. 

If you ever plan to deploy this for real-world, multi-device production use, the `store.js` file is designed so that it can be easily swapped out for real REST API calls (e.g., using Node.js/Express + a Database). However, for your current requirements, the frontend structure completely handles all data persistence and synchronization.

## Features & Project Description Fulfillment

1. **"Employees should be able to apply for leave"**
   - **Implemented in**: `employee.html` and `employee.js`
   - **Details**: Employees have a dedicated portal where they can submit new requests. The form checks their current balances, validates dates, and evaluates auto-approval rules.

2. **"View leave history and leave balance"**
   - **Implemented in**: `employee.html`
   - **Details**: The employee portal features a real-time "Balances" widget and a comprehensive "My Requests & Status" history log, showing manager feedback and current status.

3. **"Managers or administrators can review, approve, or reject leave requests"**
   - **Implemented in**: `index.html` and `app.js`
   - **Details**: Managers have an admin dashboard where they can review pending requests, check for scheduling conflicts (overlapping team absences), provide comments, and approve or reject submissions.

4. **"The module should maintain accurate leave status"**
   - **Implemented in**: `store.js`
   - **Details**: State is strictly managed. When a request is approved, the exact number of requested days is automatically deducted from the employee's available balance.

5. **"Provide appropriate notifications or updates"**
   - **Implemented in**: `app.js`, `employee.js`, and `store.js`
   - **Details**: A dual notification system is in place. Active toast alerts pop up in real-time when a request is submitted or reviewed, and a Notification Center (Bell icon) stores a history of all unread and read updates for both managers and employees.

## Final Structure
- `store.js`: The central data manager simulating a backend database. It handles persistent storage and queries.
- `index.html` / `index.css` / `app.js`: The Manager/Admin Portal for approvals, task planning, and settings.
- `employee.html` / `employee.css` / `employee.js`: The Employee Portal for submitting leaves and tracking history.

## How to Test
1. Open `index.html` in one browser tab (Manager View).
2. Open `employee.html` in a second browser tab (Employee View).
3. Submit a leave request in the Employee tab.
4. Watch as a notification instantly pops up in the Manager tab, where you can then approve it!
