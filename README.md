School Registrar Document Request Tracker

IT 415 Midterm Examination - Scenario 4 Name: John Wyne Tumabiling | Section: [YOUR SECTION]

A browser-based tracker that replaces the Registrar's logbook. Students send document requests and check their status with a reference number. Registrar staff process, search, and filter requests. Data is saved in the browser with localStorage (no database or server).

Features
Submit a document request; a reference number (e.g. REQ-2026-0001) is generated and the status starts as Submitted
Shows the fee and expected release date per document type (counts Monday to Friday only)
Status flow: Submitted -> Processing -> Ready for Pickup -> Claimed
Submitted or Processing requests can be Rejected (a reason is required)
Claimed is allowed only when the request is Ready for Pickup; the claim date is saved
Blocks a new request if the same student ID already has an active (Submitted/Processing) request for the same document
Registrar list with search (name, student ID, reference number) and filters (status, document type)
Summary of requests per status and per document type
Student view: look up a reference number and see only status, expected release date, and fee (built on branch feature/student-status-lookup, merged by pull request)
Input validation with clear success and error messages
Document Types
Document	Fee	Processing Time
Certificate of Enrollment	P50	2 working days
Transcript of Records	P150	5 working days
Good Moral Certificate	P100	3 working days
How to Run
Download or clone the repository: git clone https://github.com/tumabilingjohnwyne-stack/midterm-tumabiling.git
Open the folder and double-click index.html (any modern browser).
No installation or server is needed.
Folder Structure
midterm-tumabiling/
  README.md
  index.html
  css/style.css
  js/app.js
  docs/
    requirements-analysis.md
    ai-prompt-log.md
    screenshots/
Assumptions
Expected release date counts working days starting the day after the request date; weekends are skipped, holidays are not.
Claimed and Rejected are final statuses and cannot be changed.
The student view does not show the student's name, ID, course, or purpose.
Data stays in the browser; clearing browser data removes the requests.
Tools Used

HTML, CSS, JavaScript, localStorage, Git, GitHub, VS Code, [AI TOOL(S) YOU ACTUALLY USED]

Testing Done
Empty fields, spaces-only input, and invalid student ID/name
Duplicate active request for the same student and document
Claiming a request that is not Ready for Pickup
Rejecting without a reason
Reference number lookup: valid, lowercase, extra spaces, empty, and non-existent
Page refresh keeps saved data
[ADD THE BUGS YOU FOUND AND FIXED]