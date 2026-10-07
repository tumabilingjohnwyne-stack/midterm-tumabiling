Requirements Analysis: Registrar Document Request Tracker

Name: John Wyne Tumabiling | Section: [YOUR SECTION] | Scenario No.: 4

#	Item	Answer
1	Problem	Document requests are written in a logbook, so students keep asking "Is my document ready?" and staff cannot find old requests.
2	Target users	Students (send a request, check status) and Registrar staff (process requests).
3	Functional requirements	Submit a request and generate a reference number (REQ-YYYY-0001) with status Submitted. Show fee and expected release date (Mon-Fri only). Status flow: Submitted > Processing > Ready for Pickup > Claimed; Rejected (with reason) from Submitted/Processing. Student view by reference number showing only status, release date, and fee. Registrar list with search (name, student ID, reference number) and filters (status, document type). Block duplicate active requests for the same student ID and document. Claimed only when Ready for Pickup, with claim date saved. Summary per status and per document type.
4	Required inputs	Student name, student ID, course, document type, purpose; reference number (student lookup); search text and filters; rejection reason.
5	Expected outputs	Reference number, fee, expected release date, status, registrar request list, summary counts, success and error messages.
6	Proposed features	Request form, automatic reference number, working-day date calculator, status workflow, validation, search and filters, summary, student status lookup, localStorage saving.
7	Tools and technologies	HTML, CSS, JavaScript, localStorage, Git, GitHub, VS Code, [AI TOOL(S) YOU ACTUALLY USED].