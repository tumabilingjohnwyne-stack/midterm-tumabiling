// Document Configurations (Pricing & Lead Times)
const DOC_CONFIG = {
    "Certificate of Enrollment": { price: 50, workingDays: 2 },
    "Transcript of Records": { price: 150, workingDays: 5 },
    "Good Moral Certificate": { price: 100, workingDays: 3 }
  };
  
  const STORAGE_KEY = "registrar_requests_data";
  let requests = [];
  let selectedRequestId = null;
  
  // DOM Elements
  const requestForm = document.getElementById("requestForm");
  const docTypeSelect = document.getElementById("docType");
  const previewCard = document.getElementById("previewCard");
  const previewFee = document.getElementById("previewFee");
  const previewReleaseDate = document.getElementById("previewReleaseDate");
  
  const requestsTableBody = document.getElementById("requestsTableBody");
  const searchInput = document.getElementById("searchInput");
  const statusFilter = document.getElementById("statusFilter");
  const docTypeFilter = document.getElementById("docTypeFilter");
  
  const navBtns = document.querySelectorAll(".nav-btn");
  const tabContents = document.querySelectorAll(".tab-content");
  
  const statusSummaryContainer = document.getElementById("statusSummaryContainer");
  const docTypeSummaryContainer = document.getElementById("docTypeSummaryContainer");
  
  // Modal Elements
  const detailsModal = document.getElementById("detailsModal");
  const closeModalBtn = document.getElementById("closeModal");
  const modalRefNum = document.getElementById("modalRefNum");
  const modalStudentName = document.getElementById("modalStudentName");
  const modalStudentId = document.getElementById("modalStudentId");
  const modalCourse = document.getElementById("modalCourse");
  const modalDocType = document.getElementById("modalDocType");
  const modalFee = document.getElementById("modalFee");
  const modalPurpose = document.getElementById("modalPurpose");
  const modalDateRequested = document.getElementById("modalDateRequested");
  const modalExpectedRelease = document.getElementById("modalExpectedRelease");
  const modalStatusBadge = document.getElementById("modalStatusBadge");
  const modalClaimDateRow = document.getElementById("modalClaimDateRow");
  const modalClaimDate = document.getElementById("modalClaimDate");
  const modalRejectionRow = document.getElementById("modalRejectionRow");
  const modalRejectionReason = document.getElementById("modalRejectionReason");
  
  const updateStatusForm = document.getElementById("updateStatusForm");
  const updateStatusSelect = document.getElementById("updateStatusSelect");
  const rejectionInputGroup = document.getElementById("rejectionInputGroup");
  const rejectionReasonInput = document.getElementById("rejectionReasonInput");
  const deleteBtn = document.getElementById("deleteBtn");
  
  // Navigation Tab Switching
  navBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      navBtns.forEach(b => b.classList.remove("active"));
      tabContents.forEach(tab => tab.classList.remove("active"));
  
      btn.classList.add("active");
      const targetTab = document.getElementById(btn.getAttribute("data-target"));
      targetTab.classList.add("active");
  
      if (btn.getAttribute("data-target") === "summarySection") {
        renderSummary();
      }
    });
  });
  
  // Helper: Calculate Expected Release Date (skipping weekends)
  function calculateReleaseDate(startDateStr, workingDays) {
    let currentDate = new Date(startDateStr);
    let addedDays = 0;
  
    while (addedDays < workingDays) {
      currentDate.setDate(currentDate.getDate() + 1);
      const dayOfWeek = currentDate.getDay();
      // 0 = Sunday, 6 = Saturday
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        addedDays++;
      }
    }
    return currentDate.toISOString().split("T")[0];
  }
  
  // Live Fee & Expected Release Date Preview Listener
  docTypeSelect.addEventListener("change", (e) => {
    const selectedDoc = e.target.value;
  
    if (selectedDoc && DOC_CONFIG[selectedDoc]) {
      const config = DOC_CONFIG[selectedDoc];
      const today = new Date().toISOString().split("T")[0];
      const expectedDate = calculateReleaseDate(today, config.workingDays);
  
      previewFee.textContent = `₱${config.price}`;
      previewReleaseDate.textContent = expectedDate;
      previewCard.style.display = "block";
    } else {
      previewCard.style.display = "none";
    }
  });
  
  // Helper: Generate Unique Reference Code (REQ-YYYY-XXXX)
  function generateRefNumber() {
    const year = new Date().getFullYear();
    let maxNum = 0;
  
    requests.forEach(req => {
      if (req.referenceNumber && req.referenceNumber.startsWith(`REQ-${year}-`)) {
        const parts = req.referenceNumber.split("-");
        const num = parseInt(parts[2], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });
  
    const nextNum = String(maxNum + 1).padStart(4, "0");
    return `REQ-${year}-${nextNum}`;
  }
  
  // Load data from LocalStorage
  function loadRequests() {
    const data = localStorage.getItem(STORAGE_KEY);
    requests = data ? JSON.parse(data) : [];
  }
  
  // Save data to LocalStorage
  function saveRequests() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  }
  
  // Render Requests Table
  function renderRequests() {
    const query = searchInput.value.toLowerCase().trim();
    const statusVal = statusFilter.value;
    const docTypeVal = docTypeFilter.value;
  
    requestsTableBody.innerHTML = "";
  
    const filteredRequests = requests.filter(req => {
      const matchesSearch = 
        req.referenceNumber.toLowerCase().includes(query) ||
        req.studentName.toLowerCase().includes(query) ||
        req.studentId.toLowerCase().includes(query);
  
      const matchesStatus = (statusVal === "All") || (req.status === statusVal);
      const matchesDocType = (docTypeVal === "All") || (req.documentType === docTypeVal);
  
      return matchesSearch && matchesStatus && matchesDocType;
    });
  
    if (filteredRequests.length === 0) {
      requestsTableBody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: #64748b;">No request records found.</td></tr>`;
      return;
    }
  
    filteredRequests.forEach(req => {
      const fee = DOC_CONFIG[req.documentType] ? DOC_CONFIG[req.documentType].price : 0;
      const tr = document.createElement("tr");
  
      tr.innerHTML = `
        <td><strong>${req.referenceNumber}</strong></td>
        <td>${req.studentName}</td>
        <td>${req.studentId}</td>
        <td>${req.course}</td>
        <td>${req.documentType}</td>
        <td>₱${fee}</td>
        <td>${req.dateRequested}</td>
        <td>${req.expectedReleaseDate}</td>
        <td><span class="badge ${getBadgeClass(req.status)}">${req.status}</span></td>
        <td><button class="btn btn-secondary" onclick="openDetailsModal('${req.referenceNumber}')">View Details</button></td>
      `;
  
      requestsTableBody.appendChild(tr);
    });
  }
  
  // Render Summary Section Stats
  function renderSummary() {
    const statusCounts = {
      "Submitted": 0,
      "Processing": 0,
      "Ready for Pickup": 0,
      "Claimed": 0,
      "Rejected": 0
    };
  
    const docTypeCounts = {
      "Certificate of Enrollment": 0,
      "Transcript of Records": 0,
      "Good Moral Certificate": 0
    };
  
    requests.forEach(req => {
      if (statusCounts[req.status] !== undefined) statusCounts[req.status]++;
      if (docTypeCounts[req.documentType] !== undefined) docTypeCounts[req.documentType]++;
    });
  
    // Render Status Cards
    statusSummaryContainer.innerHTML = Object.keys(statusCounts).map(status => `
      <div class="summary-card">
        <span class="label">${status}</span>
        <span class="count">${statusCounts[status]}</span>
      </div>
    `).join("");
  
    // Render Document Type Cards
    docTypeSummaryContainer.innerHTML = Object.keys(docTypeCounts).map(doc => `
      <div class="summary-card">
        <span class="label">${doc}</span>
        <span class="count">${docTypeCounts[doc]}</span>
      </div>
    `).join("");
  }
  
  // Helper: CSS Badge Class based on status
  function getBadgeClass(status) {
    switch (status) {
      case "Submitted": return "badge-submitted";
      case "Processing": return "badge-processing";
      case "Ready for Pickup": return "badge-ready";
      case "Claimed": return "badge-claimed";
      case "Rejected": return "badge-rejected";
      default: return "";
    }
  }
  
  // Add New Request Event
  requestForm.addEventListener("submit", (e) => {
    e.preventDefault();
  
    const docType = docTypeSelect.value;
    const today = new Date().toISOString().split("T")[0];
    const daysNeeded = DOC_CONFIG[docType].workingDays;
    const expectedRelease = calculateReleaseDate(today, daysNeeded);
  
    const newRequest = {
      referenceNumber: generateRefNumber(),
      studentName: document.getElementById("studentName").value.trim(),
      studentId: document.getElementById("studentId").value.trim(),
      course: document.getElementById("course").value.trim(),
      documentType: docType,
      purpose: document.getElementById("purpose").value.trim(),
      dateRequested: today,
      status: "Submitted",
      expectedReleaseDate: expectedRelease,
      claimDate: null,
      rejectionReason: null
    };
  
    requests.unshift(newRequest);
    saveRequests();
    renderRequests();
  
    requestForm.reset();
    previewCard.style.display = "none";
    alert(`Request submitted successfully! Reference Code: ${newRequest.referenceNumber}`);
  });
  
  // Modal Logic
  function openDetailsModal(refNum) {
    const req = requests.find(r => r.referenceNumber === refNum);
    if (!req) return;
  
    selectedRequestId = refNum;
  
    modalRefNum.textContent = req.referenceNumber;
    modalStudentName.textContent = req.studentName;
    modalStudentId.textContent = req.studentId;
    modalCourse.textContent = req.course;
    modalDocType.textContent = req.documentType;
    modalFee.textContent = `₱${DOC_CONFIG[req.documentType].price}`;
    modalPurpose.textContent = req.purpose;
    modalDateRequested.textContent = req.dateRequested;
    modalExpectedRelease.textContent = req.expectedReleaseDate;
  
    modalStatusBadge.textContent = req.status;
    modalStatusBadge.className = `badge ${getBadgeClass(req.status)}`;
  
    // Toggle optional details display
    if (req.status === "Claimed" && req.claimDate) {
      modalClaimDateRow.style.display = "block";
      modalClaimDate.textContent = req.claimDate;
    } else {
      modalClaimDateRow.style.display = "none";
    }
  
    if (req.status === "Rejected" && req.rejectionReason) {
      modalRejectionRow.style.display = "block";
      modalRejectionReason.textContent = req.rejectionReason;
    } else {
      modalRejectionRow.style.display = "none";
    }
  
    // Pre-set update dropdown
    updateStatusSelect.value = req.status;
    rejectionReasonInput.value = req.rejectionReason || "";
    toggleRejectionField(req.status);
  
    detailsModal.style.display = "block";
  }
  
  // Toggle display of Rejection Reason input based on selected status
  function toggleRejectionField(status) {
    if (status === "Rejected") {
      rejectionInputGroup.style.display = "block";
      rejectionReasonInput.required = true;
    } else {
      rejectionInputGroup.style.display = "none";
      rejectionReasonInput.required = false;
    }
  }
  
  updateStatusSelect.addEventListener("change", (e) => {
    toggleRejectionField(e.target.value);
  });
  
  // Submit Status Update
  updateStatusForm.addEventListener("submit", (e) => {
    e.preventDefault();
  
    const reqIndex = requests.findIndex(r => r.referenceNumber === selectedRequestId);
    if (reqIndex === -1) return;
  
    const newStatus = updateStatusSelect.value;
    const today = new Date().toISOString().split("T")[0];
  
    requests[reqIndex].status = newStatus;
  
    if (newStatus === "Claimed") {
      requests[reqIndex].claimDate = today;
    } else {
      requests[reqIndex].claimDate = null;
    }
  
    if (newStatus === "Rejected") {
      requests[reqIndex].rejectionReason = rejectionReasonInput.value.trim();
    } else {
      requests[reqIndex].rejectionReason = null;
    }
  
    saveRequests();
    renderRequests();
    detailsModal.style.display = "none";
  });
  
  // Delete Record Action
  deleteBtn.addEventListener("click", () => {
    if (confirm(`Are you sure you want to delete request ${selectedRequestId}?`)) {
      requests = requests.filter(r => r.referenceNumber !== selectedRequestId);
      saveRequests();
      renderRequests();
      detailsModal.style.display = "none";
    }
  });
  
  // Close Modal Controls
  closeModalBtn.addEventListener("click", () => {
    detailsModal.style.display = "none";
  });
  
  window.addEventListener("click", (event) => {
    if (event.target === detailsModal) {
      detailsModal.style.display = "none";
    }
  });
  
  // Search & Filter Listeners
  searchInput.addEventListener("input", renderRequests);
  statusFilter.addEventListener("change", renderRequests);
  docTypeFilter.addEventListener("change", renderRequests);
  
  // Initial Load
  document.addEventListener("DOMContentLoaded", () => {
    loadRequests();
    renderRequests();
  });