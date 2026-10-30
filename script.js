const TYPES = ["Water leakage", "Overflowing bin", "Electricity waste", "Littering", "Other"];
const STATUSES = ["Reported", "In progress", "Resolved"];
function $(id) {
  return document.getElementById(id);
}
let reports = [];
let photoData = "";
function saveReports() {
  localStorage.setItem("campusReports", JSON.stringify(reports));
}
function loadReports() {
  const saved = localStorage.getItem("campusReports");
  if (saved) {
    reports = JSON.parse(saved);
  } else {
    reports = [
      { id: 1, category: "Water leakage", location: "Block 32 ground floor tap", severity: "High",
        description: "Tap leaking continuously.", photo: "", status: "In progress", date: "2026-10-18" },
      { id: 2, category: "Overflowing bin", location: "Food court exit", severity: "Medium",
        description: "Bins full since afternoon.", photo: "", status: "Reported", date: "2026-10-19" },
      { id: 3, category: "Electricity waste", location: "Library reading hall", severity: "Low",
        description: "Lights on in empty section.", photo: "", status: "Resolved", date: "2026-10-16" }
    ];
  }
}
function showScreen(name) {
  $("screen-report").classList.toggle("hidden", name !== "report");
  $("screen-admin").classList.toggle("hidden", name !== "admin");
  $("tab-report").classList.toggle("active", name === "report");
  $("tab-admin").classList.toggle("active", name === "admin");
  drawEverything();
}
$("tab-report").onclick = function () { showScreen("report"); };
$("tab-admin").onclick = function () { showScreen("admin"); };
$("photo").onchange = function (event) {
  const file = event.target.files[0];
  photoData = "";
  if (!file) return;
  if (file.size > 300000) {
    $("message").textContent = "Photo is too large. Choose one under 300 KB.";
    $("photo").value = "";
    return;
  }
  const reader = new FileReader();
  reader.onload = function () {
    photoData = reader.result;
  };
  reader.readAsDataURL(file);
};
$("submit-btn").onclick = function () {
  const location = $("location").value.trim();
  const description = $("description").value.trim();
  if (location === "") {
    $("message").textContent = "Please enter the location.";
    return;
  }
  if (description === "") {
    $("message").textContent = "Please describe the problem.";
    return;
  }
  const newReport = {
    id: Date.now(),
    category: $("category").value,
    location: location,
    severity: $("severity").value,
    description: description,
    photo: photoData,
    status: "Reported",
    date: new Date().toISOString().slice(0, 10)
  };

  reports.unshift(newReport);
  saveReports();
  $("location").value = "";
  $("description").value = "";
  $("photo").value = "";
  photoData = "";
  $("message").textContent = "Report submitted. Thank you!";
  drawEverything();
};
function drawChart() {
  let html = "";
  let biggest = 1;
  for (const type of TYPES) {
    const count = reports.filter(function (r) { return r.category === type; }).length;
    if (count > biggest) biggest = count;
  }

  for (const type of TYPES) {
    const count = reports.filter(function (r) { return r.category === type; }).length;
    const widthPercent = (count / biggest) * 100;
    html += '<div class="bar-row">' +
              '<span class="bar-label">' + type + '</span>' +
              '<span class="bar-track"><div class="bar-fill" style="width:' + widthPercent + '%"></div></span>' +
              '<b>' + count + '</b>' +
            '</div>';
  }
  $("chart").innerHTML = html;
}
function drawStats() {
  const reported   = reports.filter(function (r) { return r.status === "Reported"; }).length;
  const inProgress = reports.filter(function (r) { return r.status === "In progress"; }).length;
  const resolved   = reports.filter(function (r) { return r.status === "Resolved"; }).length;

  $("stats").innerHTML =
    '<div class="stat"><b>' + reports.length + '</b><span>Total reports</span></div>' +
    '<div class="stat"><b>' + reported + '</b><span>Reported</span></div>' +
    '<div class="stat"><b>' + inProgress + '</b><span>In progress</span></div>' +
    '<div class="stat"><b>' + resolved + '</b><span>Resolved</span></div>';
}
function safe(text) {
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function drawList() {
  const fCat = $("filter-category").value;
  const fSev = $("filter-severity").value;
  const fSta = $("filter-status").value;
  const shown = reports.filter(function (r) {
    return (fCat === "" || r.category === fCat) &&
           (fSev === "" || r.severity === fSev) &&
           (fSta === "" || r.status === fSta);
  });

  if (shown.length === 0) {
    $("list").innerHTML = '<div class="empty">No reports match. Change the filters or add a report.</div>';
    return;
  }

  let html = "";
  for (const r of shown) {
    let options = "";
    for (const s of STATUSES) {
      options += "<option" + (s === r.status ? " selected" : "") + ">" + s + "</option>";
    }
    html += '<div class="item ' + r.severity + '">' +
              '<h3>' + safe(r.category) + ' - ' + r.severity + '</h3>' +
              '<div class="meta">' + safe(r.location) + ' | ' + r.date + '</div>' +
              '<div>' + safe(r.description) + '</div>' +
              (r.photo ? '<img src="' + r.photo + '" alt="Report photo">' : '') +
              '<div class="actions">' +
                '<select onchange="changeStatus(' + r.id + ', this.value)">' + options + '</select>' +
                '<button class="btn alt" onclick="deleteReport(' + r.id + ')">Delete</button>' +
              '</div>' +
            '</div>';
  }
  $("list").innerHTML = html;
}
function drawEverything() {
  drawChart();
  drawStats();
  drawList();
}
function changeStatus(id, newStatus) {
  for (const r of reports) {
    if (r.id === id) {
      r.status = newStatus;
    }
  }
  saveReports();
  drawEverything();
}
function deleteReport(id) {
  reports = reports.filter(function (r) { return r.id !== id; });
  saveReports();
  drawEverything();
}
$("filter-category").onchange = drawList;
$("filter-severity").onchange = drawList;
$("filter-status").onchange = drawList;
$("csv-btn").onclick = function () {
  let csv = "Date,Type,Location,Severity,Status,Description\n";
  for (const r of reports) {
    csv += '"' + r.date + '","' + r.category + '","' + r.location + '","' +
           r.severity + '","' + r.status + '","' + r.description.replace(/"/g, '""') + '"\n';
  }
  const link = document.createElement("a");
  link.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
  link.download = "campus-reports.csv";
  link.click();
};

loadReports();
showScreen("report");
