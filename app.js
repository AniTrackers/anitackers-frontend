/* ------------------------------------------------------------------
 * CONFIG / SUPABASE
 * ------------------------------------------------------------------ */

const SUPABASE_URL =
  "https://pwzwxusjqfdrjefiihec.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3end4dXNqcWZkcmplZmlpaGVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3OTg1MDYsImV4cCI6MjA4MDM3NDUwNn0.qKYUO9HwEfR8JCJHTfjs-YcZzV2QVXUCa_AvkCUxYsI";

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;

/* ------------------------------------------------------------------
 * DOM REFERENCES
 * ------------------------------------------------------------------ */

const authPanel = document.getElementById("auth-panel");
const appPanel = document.getElementById("app-panel");
const authStatus = document.getElementById("auth-status");
const headerUserEmail = document.getElementById("header-user-email");
const logoutButton = document.getElementById("logout-button");

const emailInput = document.getElementById("email-input");
const passwordInput = document.getElementById("password-input");
const passwordToggle = document.getElementById("password-toggle");
const signinButton = document.getElementById("signin-button");
const signupButton = document.getElementById("signup-button");

const cowList = document.getElementById("cow-list");
const alertsList = document.getElementById("alerts-list");
const geofencesList = document.getElementById("geofences-list");
const startDrawGeofenceBtn = document.getElementById("start-draw-geofence-btn");
const herdCountPill = document.getElementById("herd-count-pill");
const alertCountPill = document.getElementById("alert-count-pill");

const searchInput = document.getElementById("search-input");
const batteryFilter = document.getElementById("battery-filter");
const detailsCategoryFilter = document.getElementById("details-category-filter");

const newAnimalTagInput = document.getElementById("new-animal-tag");
const newAnimalNameInput = document.getElementById("new-animal-name");
const addAnimalButton = document.getElementById("add-animal-button");
const addAnimalStatus = document.getElementById("add-animal-status");
const animalTypeHeifer = document.getElementById("new-animal-type-heifer");
const animalTypeSteer = document.getElementById("new-animal-type-steer");
const animalTypeBull = document.getElementById("new-animal-type-bull");

const addAnimalBody = document.getElementById("add-animal-body");
const addAnimalToggle = document.getElementById("add-animal-toggle");
const addAnimalToggleIcon = document.getElementById("add-animal-toggle-icon");

const docsModal = document.getElementById("docs-modal");
const docsModalTitle = document.getElementById("docs-modal-title");
const docsModalSubtitle = document.getElementById("docs-modal-subtitle");
const docsCloseBtn = document.getElementById("docs-close-btn");
const docsStatus = document.getElementById("docs-status");
const docsTableBody = document.getElementById("docs-table-body");
const docsAddList = document.getElementById("docs-add-list");
const docsSaveButton = document.getElementById("docs-save-button");

const docsPdfButton = document.getElementById("docs-pdf-button");
const docsPdfStatus = document.getElementById("docs-pdf-status");
const docsExcelButton = document.getElementById("docs-excel-button");
const docsExcelStatus = document.getElementById("docs-excel-status");

const shotPdfButton = document.getElementById("shot-pdf-button");
const shotPdfStatus = document.getElementById("shot-pdf-status");
const shotExcelButton = document.getElementById("shot-excel-button");
const shotExcelStatus = document.getElementById("shot-excel-status");

const docsParentsSection = document.getElementById("docs-parents-section");
const docsParentsList = document.getElementById("docs-parents-list");
const docsParentsCowSelect = document.getElementById("docs-parents-cow-select");
const docsParentsTypeSelect = document.getElementById("docs-parents-type-select");
const docsParentsAddButton = document.getElementById("docs-parents-add-button");

const docsCalvesSection = document.getElementById("docs-calves-section");
const docsCalvesHeader = document.getElementById("docs-calves-header");
const docsCalvesList = document.getElementById("docs-calves-list");
const docsCalvesCalfSelect = document.getElementById("docs-calves-calf-select");
const docsCalvesAddButton = document.getElementById("docs-calves-add-button");

const reportsToggle = document.getElementById("reports-toggle");
const reportsToggleIcon = document.getElementById("reports-toggle-icon");
const reportsBody = document.getElementById("reports-body");

const docsRenameAnimalButton = document.getElementById("docs-rename-animal-button");
const docsDeleteAnimalButton = document.getElementById("docs-delete-animal-button");

/* Export-category modal DOM (for Documentation PDF/Excel) */
const exportModal = document.getElementById("export-modal");
const exportModalTitle = document.getElementById("export-modal-title");
const exportModalSubtitle = document.getElementById("export-modal-subtitle");
const exportCategoriesList = document.getElementById("export-categories-list");
const exportCancelBtn = document.getElementById("export-cancel-btn");
const exportConfirmBtn = document.getElementById("export-confirm-btn");

/* ------------------------------------------------------------------
 * CONSTANTS / STATE
 * ------------------------------------------------------------------ */

const DOC_FIELDS = [
  { key: "identification",     label: "Identification" },
  { key: "age_birth_date",     label: "Age/Birth Date" },
  { key: "breed_pedigree",     label: "Breed/Pedigree" },
  { key: "health_records",     label: "Health Records" },
  { key: "growth_condition",   label: "Growth/Condition" },
  { key: "reproduction",       label: "Reproduction" },
  { key: "production",         label: "Production (Milk/Meat)" },
  { key: "nutrition",          label: "Nutrition" },
  { key: "movement_location",  label: "Movement/Location" },
  { key: "behavior",           label: "Behavior" },
  { key: "mortality_survival", label: "Mortality/Survival" },
  { key: "birthday",           label: "Birthday" },
  { key: "geofence",           label: "Geofence" },
];

const markersByTag = {};
const geofenceLayersById = {};
const drawnItems = new L.FeatureGroup();

const animalCardsByTag = {};
let selectedCardTagId = null;

let geofencesData = [];
let polygonDrawer = null;
let animalsCache = [];
let selectedAnimal = null;
let docsByFieldKey = {};
let parentsRelationships = [];
let calvesRelationships = [];

/* For herd filtering by documentation categories */
let animalDocsCache = {}; // animal_id -> Set(field_key)

/* For export-category modal */
let currentExportMode = null; // "pdf" | "excel"

/* ------------------------------------------------------------------
 * HELPERS
 * ------------------------------------------------------------------ */

function flashStatus(el, message, color, visibleMs = 5000) {
  if (!el) return;
  el.textContent = message;
  el.style.color = color;
  el.style.opacity = 1;
  el.classList.add("fading-status");

  const fadeDuration = 600;

  setTimeout(() => {
    if (el.textContent === message) {
      el.style.opacity = 0;
      setTimeout(() => {
        if (el.textContent === message) {
          el.textContent = "";
          el.style.opacity = 1;
        }
      }, fadeDuration);
    }
  }, visibleMs);
}

function handleAuthKeydown(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    signinButton.click();
  }
}

function setAuthState(signedIn, email) {
  if (signedIn) {
    authPanel.style.display = "none";
    appPanel.style.display = "flex";
    headerUserEmail.textContent = email || "Signed in";
    logoutButton.style.display = "inline-block";
    ensureMapSize();
  } else {
    authPanel.style.display = "flex";
    appPanel.style.display = "none";
    headerUserEmail.textContent = "Not signed in";
    logoutButton.style.display = "none";
    currentUser = null;
    cowList.textContent = "Loading…";
    geofencesList.textContent = "No geofences yet.";
    alertsList.textContent = "No alerts yet.";
  }
}

function setAuthMessage(msg, isError = false) {
  authStatus.textContent = msg;
  authStatus.style.color = isError ? "#f97373" : "#4ade80";
  authStatus.style.opacity = 1;
}

async function refreshDashboard() {
  await Promise.all([
    loadAnimalsAndLocations(),
    loadAlerts(),
    loadGeofences(),
    loadAnimalDocsOverview(),
  ]);
  ensureMapSize();
}

function classifyBattery(battery_v) {
  if (battery_v == null) return "unknown";
  if (battery_v >= 3.4) return "good";
  if (battery_v >= 3.2) return "medium";
  return "low";
}

function isPointInPolygon(point, polygon) {
  if (!polygon || polygon.length < 3) return false;
  const y = point[0];
  const x = point[1];
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const yi = polygon[i][0];
    const xi = polygon[i][1];
    const yj = polygon[j][0];
    const xj = polygon[j][1];

    const intersect =
      ((yi > y) !== (yj > y)) &&
      (x < ((xj - xi) * (y - yi)) / ((yj - yi) || 1e-12) + xi);

    if (intersect) inside = !inside;
  }
  return inside;
}

function getGeofenceNamesForAnimalRow(row) {
  if (!row || row.latitude == null || row.longitude == null) return "";
  if (!geofencesData || geofencesData.length === 0) return "";

  const pt = [row.latitude, row.longitude];
  const names = [];

  geofencesData.forEach((fence) => {
    if (Array.isArray(fence.polygon) && fence.polygon.length >= 3) {
      if (isPointInPolygon(pt, fence.polygon)) {
        names.push(fence.name);
      }
    }
  });

  return names.join(", ");
}

function highlightCardByTag(tagId) {
  if (selectedCardTagId && animalCardsByTag[selectedCardTagId]) {
    animalCardsByTag[selectedCardTagId].classList.remove("selected");
  }
  const card = animalCardsByTag[tagId];
  if (card) {
    selectedCardTagId = tagId;
    card.classList.add("selected");
    card.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

/* ------------------------------------------------------------------
 * MAP SETUP
 * ------------------------------------------------------------------ */

const map = L.map("map").setView([36.12, -97.445], 12);

L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  {
    maxZoom: 19,
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, " +
      "GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
  }
).addTo(map);

map.addLayer(drawnItems);

const drawControl = new L.Control.Draw({
  edit: {
    featureGroup: drawnItems,
    edit: false,
    remove: false,
  },
  draw: {
    polygon: {
      allowIntersection: false,
      showArea: true,
      shapeOptions: {
        color: "#4f46e5",
      },
    },
    polyline: false,
    rectangle: false,
    circle: false,
    marker: false,
    circlemarker: false,
  },
});
map.addControl(drawControl);

function ensureMapSize() {
  setTimeout(() => map.invalidateSize(), 150);
  setTimeout(() => map.invalidateSize(), 400);
}

window.addEventListener("resize", ensureMapSize);

/* ------------------------------------------------------------------
 * DOCS MODAL RENDERING
 * ------------------------------------------------------------------ */

function closeDocsModal() {
  docsModal.classList.remove("visible");
  selectedAnimal = null;
  docsByFieldKey = {};
  parentsRelationships = [];
  calvesRelationships = [];

  docsTableBody.innerHTML = "";
  docsAddList.innerHTML = "";
  docsStatus.textContent = "";

  docsParentsList.textContent = "No parents linked yet.";
  docsParentsCowSelect.innerHTML = '<option value="">Select cow…</option>';

  docsCalvesList.textContent = "No calves linked yet.";
  docsCalvesCalfSelect.innerHTML = '<option value="">Select calf…</option>';
  docsCalvesSection.style.display = "none";
}

function renderDocsUI() {
  docsTableBody.innerHTML = "";
  docsAddList.innerHTML = "";

  if (!selectedAnimal) return;

  const activeKeys = Object.keys(docsByFieldKey);

  if (activeKeys.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 3;
    cell.style.fontSize = "0.8rem";
    cell.style.color = "var(--text-muted)";
    cell.textContent =
      "No categories selected yet. Use the buttons below to add attributes for this animal.";
    row.appendChild(cell);
    docsTableBody.appendChild(row);
  } else {
    activeKeys.forEach((key) => {
      const doc = docsByFieldKey[key];
      const fieldDef = DOC_FIELDS.find((f) => f.key === key);
      const labelText = fieldDef ? fieldDef.label : (doc.field_label || key);

      const row = document.createElement("tr");
      const labelCell = document.createElement("td");
      const notesCell = document.createElement("td");
      const actionCell = document.createElement("td");

      labelCell.className = "docs-field-label-cell";
      labelCell.textContent = labelText;
      actionCell.style.textAlign = "right";

      if (key === "geofence") {
        const geofenceText = document.createElement("div");
        geofenceText.textContent = doc.field_value || "";
        geofenceText.style.fontSize = "0.78rem";
        geofenceText.style.color = "var(--text-muted)";
        notesCell.appendChild(geofenceText);
      } else if (key === "birthday") {
        const wrapper = document.createElement("div");
        wrapper.style.display = "flex";
        wrapper.style.gap = "0.25rem";
        wrapper.style.flexWrap = "wrap";

        const monthSelect = document.createElement("select");
        const daySelect = document.createElement("select");
        const yearSelect = document.createElement("select");

        monthSelect.className = "docs-bday-select";
        daySelect.className = "docs-bday-select";
        yearSelect.className = "docs-bday-select";

        let savedYear = "";
        let savedMonth = "";
        let savedDay = "";

        if (doc.field_value) {
          const parts = String(doc.field_value).split("-");
          if (parts.length === 3) {
            savedYear = parts[0] || "";
            savedMonth = parts[1] || "";
            savedDay = parts[2] || "";
          }
        }

        const months = [
          { value: "", label: "Month" },
          { value: "01", label: "Jan" },
          { value: "02", label: "Feb" },
          { value: "03", label: "Mar" },
          { value: "04", label: "Apr" },
          { value: "05", label: "May" },
          { value: "06", label: "Jun" },
          { value: "07", label: "Jul" },
          { value: "08", label: "Aug" },
          { value: "09", label: "Sep" },
          { value: "10", label: "Oct" },
          { value: "11", label: "Nov" },
          { value: "12", label: "Dec" },
        ];

        months.forEach((m) => {
          const opt = document.createElement("option");
          opt.value = m.value;
          opt.textContent = m.label;
          monthSelect.appendChild(opt);
        });

        const dayPlaceholder = document.createElement("option");
        dayPlaceholder.value = "";
        dayPlaceholder.textContent = "Day";
        daySelect.appendChild(dayPlaceholder);
        for (let d = 1; d <= 31; d++) {
          const val = d.toString().padStart(2, "0");
          const opt = document.createElement("option");
          opt.value = val;
          opt.textContent = d.toString();
          daySelect.appendChild(opt);
        }

        const yearPlaceholder = document.createElement("option");
        yearPlaceholder.value = "";
        yearPlaceholder.textContent = "Year";
        yearSelect.appendChild(yearPlaceholder);
        for (let y = 2050; y >= 1990; y--) {
          const opt = document.createElement("option");
          opt.value = String(y);
          opt.textContent = String(y);
          yearSelect.appendChild(opt);
        }

        if (savedMonth) monthSelect.value = savedMonth;
        if (savedDay) daySelect.value = savedDay;
        if (savedYear) yearSelect.value = savedYear;

        const updateBirthdayValue = () => {
          const m = monthSelect.value;
          const d = daySelect.value;
          const y = yearSelect.value;
          docsByFieldKey[key].field_value = (m && d && y) ? `${y}-${m}-${d}` : "";
        };

        monthSelect.addEventListener("change", updateBirthdayValue);
        daySelect.addEventListener("change", updateBirthdayValue);
        yearSelect.addEventListener("change", updateBirthdayValue);

        wrapper.appendChild(monthSelect);
        wrapper.appendChild(daySelect);
        wrapper.appendChild(yearSelect);
        notesCell.appendChild(wrapper);
      } else {
        const textarea = document.createElement("textarea");
        textarea.className = "docs-textarea";
        textarea.value = doc.field_value || "";
        textarea.addEventListener("input", (e) => {
          docsByFieldKey[key].field_value = e.target.value;
        });
        notesCell.appendChild(textarea);
      }

      if (key !== "geofence" && key !== "birthday") {
        const removeBtn = document.createElement("button");
        removeBtn.className = "docs-remove-btn";
        removeBtn.textContent = "Remove";
        removeBtn.addEventListener("click", async (e) => {
          e.stopPropagation();
          const existing = docsByFieldKey[key];
          delete docsByFieldKey[key];
          renderDocsUI();

          if (existing && existing.id) {
            try {
              await supabaseClient
                .from("animal_docs")
                .delete()
                .eq("id", existing.id);
            } catch (err) {
              console.error("Error deleting doc row:", err);
            }
          }
        });
        actionCell.appendChild(removeBtn);
      }

      row.appendChild(labelCell);
      row.appendChild(notesCell);
      row.appendChild(actionCell);
      docsTableBody.appendChild(row);
    });
  }

  const inactiveFields = DOC_FIELDS.filter(
    (field) => !docsByFieldKey[field.key]
  );

  if (inactiveFields.length === 0) {
    const doneDiv = document.createElement("div");
    doneDiv.style.fontSize = "0.78rem";
    doneDiv.style.color = "var(--text-muted)";
    doneDiv.textContent = "All default categories are currently in use.";
    docsAddList.appendChild(doneDiv);
  } else {
    inactiveFields.forEach((field) => {
      const btn = document.createElement("button");
      btn.className = "small-button";
      btn.textContent = field.label;
      btn.addEventListener("click", () => {
        docsByFieldKey[field.key] = {
          id: null,
          field_label: field.label,
          field_value: "",
        };
        renderDocsUI();
      });
      docsAddList.appendChild(btn);
    });
  }
}

function renderParentsSection() {
  docsParentsList.innerHTML = "";

  if (!selectedAnimal) {
    docsParentsList.textContent = "No parents linked yet.";
    return;
  }

  if (!parentsRelationships || parentsRelationships.length === 0) {
    docsParentsList.textContent = "No parents linked yet.";
    return;
  }

  parentsRelationships.forEach((rel) => {
    const parentRow = animalsCache.find(
      (a) => a.animal_id === rel.parent_animal_id
    );
    const displayName = parentRow ? (parentRow.name || parentRow.tag_id) : "Unknown cow";
    const displayTag = parentRow ? parentRow.tag_id : "";

    const item = document.createElement("div");
    item.className = "docs-family-list-item";

    const textDiv = document.createElement("div");
    textDiv.className = "docs-family-text";
    const roleLabel = rel.relation_type === "father" ? "Father" : "Mother";
    textDiv.innerHTML =
      `<strong>${displayName}</strong>` +
      `<div class="docs-family-meta">Tag: ${
        displayTag || "N/A"
      } • ${roleLabel}</div>`;

    const removeBtn = document.createElement("button");
    removeBtn.className = "docs-family-remove-btn";
    removeBtn.textContent = "×";
    removeBtn.title = "Remove parent link";
    removeBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (!confirm("Remove this parent link?")) return;

      const { error } = await supabaseClient
        .from("animal_relationships")
        .delete()
        .eq("id", rel.id);

      if (error) {
        console.error("Error deleting relationship:", error);
        alert("Error removing parent link. Check console.");
        return;
      }

      await loadParentsForAnimal(selectedAnimal.animal_id);
    });

    item.appendChild(textDiv);
    item.appendChild(removeBtn);
    docsParentsList.appendChild(item);
  });
}

function renderCalvesSection() {
  docsCalvesList.innerHTML = "";

  if (!selectedAnimal) {
    docsCalvesList.textContent = "No calves linked yet.";
    return;
  }

  if (!calvesRelationships || calvesRelationships.length === 0) {
    docsCalvesList.textContent = "No calves linked yet.";
    return;
  }

  calvesRelationships.forEach((rel) => {
    const calfRow = animalsCache.find(
      (a) => a.animal_id === rel.calf_animal_id
    );
    const displayName = calfRow ? (calfRow.name || calfRow.tag_id) : "Unknown calf";
    const displayTag = calfRow ? calfRow.tag_id : "";

    const item = document.createElement("div");
    item.className = "docs-family-list-item";

    const textDiv = document.createElement("div");
    textDiv.className = "docs-family-text";
    textDiv.innerHTML =
      `<strong>${displayName}</strong>` +
      `<div class="docs-family-meta">Tag: ${
        displayTag || "N/A"
      } • Calf</div>`;

    const removeBtn = document.createElement("button");
    removeBtn.className = "docs-family-remove-btn";
    removeBtn.textContent = "×";
    removeBtn.title = "Remove calf link";
    removeBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (!confirm("Remove this calf link?")) return;

      const { error } = await supabaseClient
        .from("animal_relationships")
        .delete()
        .eq("id", rel.id);

      if (error) {
        console.error("Error deleting relationship:", error);
        alert("Error removing calf link. Check console.");
        return;
      }

      await loadCalvesForAnimal(selectedAnimal.animal_id);
    });

    item.appendChild(textDiv);
    item.appendChild(removeBtn);
    docsCalvesList.appendChild(item);
  });
}

async function loadParentsForAnimal(animalId) {
  docsParentsList.textContent = "Loading parents…";
  parentsRelationships = [];

  const { data, error } = await supabaseClient
    .from("animal_relationships")
    .select("*")
    .eq("calf_animal_id", animalId);

  if (error) {
    console.error("Error loading parents:", error);
    docsParentsList.textContent = "Error loading parents.";
    return;
  }

  parentsRelationships = data || [];
  renderParentsSection();
}

async function loadCalvesForAnimal(animalId) {
  docsCalvesList.textContent = "Loading calves…";
  calvesRelationships = [];

  const { data, error } = await supabaseClient
    .from("animal_relationships")
    .select("*")
    .eq("parent_animal_id", animalId);

  if (error) {
    console.error("Error loading calves:", error);
    docsCalvesList.textContent = "Error loading calves.";
    return;
  }

  calvesRelationships = data || [];
  renderCalvesSection();
}

async function loadAnimalDocs(row) {
  if (!currentUser) {
    alert("Please sign in first.");
    return;
  }

  selectedAnimal = row;
  docsByFieldKey = {};
  parentsRelationships = [];
  calvesRelationships = [];

  docsStatus.textContent = "Loading documentation…";
  docsStatus.style.color = "#94a3b8";
  docsStatus.style.opacity = 1;

  docsModalTitle.textContent = row.name || row.tag_id;
  docsModalSubtitle.textContent = `Tag: ${row.tag_id}`;
  docsModal.classList.add("visible");

  const nameLower = (row.name || "").toLowerCase();
  const isHeifer = nameLower.includes("heifer");
  const isBull = nameLower.includes("bull");

  docsParentsList.textContent = "Loading parents…";
  docsParentsCowSelect.innerHTML = '<option value="">Select cow…</option>';

  docsCalvesList.textContent = "No calves linked yet.";
  docsCalvesCalfSelect.innerHTML = '<option value="">Select calf…</option>';

  if (isHeifer || isBull) {
    docsCalvesSection.style.display = "block";
    docsCalvesHeader.textContent = isBull ? "Fathered" : "Calves";
  } else {
    docsCalvesSection.style.display = "none";
  }

  animalsCache
    .filter((a) => a.animal_id !== row.animal_id)
    .forEach((a) => {
      const label = `${a.name || a.tag_id} (Tag: ${a.tag_id})`;

      const optParent = document.createElement("option");
      optParent.value = a.animal_id;
      optParent.textContent = label;
      docsParentsCowSelect.appendChild(optParent);

      const optCalf = document.createElement("option");
      optCalf.value = a.animal_id;
      optCalf.textContent = label;
      docsCalvesCalfSelect.appendChild(optCalf);
    });

  renderDocsUI();

  const { data, error } = await supabaseClient
    .from("animal_docs")
    .select("*")
    .eq("animal_id", row.animal_id);

  if (error) {
    console.error("Error loading documentation:", error);
    docsStatus.textContent = "Error loading documentation.";
    docsStatus.style.color = "#f97373";
  } else {
    (data || []).forEach((docRow) => {
      docsByFieldKey[docRow.field_key] = {
        id: docRow.id,
        field_label: docRow.field_label,
        field_value: docRow.field_value || "",
      };
    });

    const geofenceNames = getGeofenceNamesForAnimalRow(row);
    const existingGeofence = docsByFieldKey["geofence"] || {};
    docsByFieldKey["geofence"] = {
      id: existingGeofence.id || null,
      field_label: existingGeofence.field_label || "Geofence",
      field_value: geofenceNames,
    };

    const existingBirthday = docsByFieldKey["birthday"] || {};
    docsByFieldKey["birthday"] = {
      id: existingBirthday.id || null,
      field_label: existingBirthday.field_label || "Birthday",
      field_value: existingBirthday.field_value || "",
    };

    docsStatus.textContent = "";
    renderDocsUI();
  }

  await loadParentsForAnimal(row.animal_id);

  if (isHeifer || isBull) {
    await loadCalvesForAnimal(row.animal_id);
  }
}

/* ------------------------------------------------------------------
 * DOCS MODAL EVENTS
 * ------------------------------------------------------------------ */

docsCloseBtn.addEventListener("click", closeDocsModal);

docsModal.addEventListener("click", (e) => {
  if (e.target === docsModal) closeDocsModal();
});

docsSaveButton.addEventListener("click", async () => {
  if (!currentUser || !selectedAnimal) {
    alert("Select an animal first.");
    return;
  }

  const animalId = selectedAnimal.animal_id;
  const keys = Object.keys(docsByFieldKey);

  if (keys.length === 0) {
    docsStatus.textContent = "Nothing to save. Add a category first.";
    docsStatus.style.color = "#f97373";
    docsStatus.style.opacity = 1;
    return;
  }

  docsStatus.textContent = "Saving documentation…";
  docsStatus.style.color = "#94a3b8";
  docsStatus.style.opacity = 1;

  try {
    for (const key of keys) {
      const doc = docsByFieldKey[key];
      const payload = {
        animal_id: animalId,
        field_key: key,
        field_label: doc.field_label,
        field_value: doc.field_value || "",
      };

      if (doc.id) {
        const { error } = await supabaseClient
          .from("animal_docs")
          .update(payload)
          .eq("id", doc.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabaseClient
          .from("animal_docs")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        docsByFieldKey[key].id = data.id;
      }
    }

    docsStatus.textContent = "Documentation saved.";
    docsStatus.style.color = "#4ade80";
    docsStatus.style.opacity = 1;
  } catch (err) {
    console.error("Error saving documentation:", err);
    docsStatus.textContent =
      "Error saving documentation. Check console.";
    docsStatus.style.color = "#f97373";
    docsStatus.style.opacity = 1;
  }
});

// Rename animal from Details (docs) modal
docsRenameAnimalButton.addEventListener("click", async () => {
  if (!currentUser || !selectedAnimal) {
    alert("Select an animal first.");
    return;
  }

  const currentName = selectedAnimal.name || selectedAnimal.tag_id;
  const newName = prompt(
    `Enter new number/name for ${currentName}:`,
    currentName
  );
  if (!newName || newName.trim() === "") return;

  const { error } = await supabaseClient
    .from("animals")
    .update({ name: newName.trim() })
    .eq("id", selectedAnimal.animal_id);

  if (error) {
    console.error("Rename error:", error);
    alert("Error renaming animal. Check console for details.");
    return;
  }

  selectedAnimal.name = newName.trim();
  docsModalTitle.textContent = selectedAnimal.name;

  await loadAnimalsAndLocations();
});

// Delete animal from Details (docs) modal
docsDeleteAnimalButton.addEventListener("click", async () => {
  if (!currentUser || !selectedAnimal) {
    alert("Select an animal first.");
    return;
  }

  const displayName = selectedAnimal.name || selectedAnimal.tag_id;
  if (!confirm(`Remove ${displayName} from herd?`)) return;

  const { error } = await supabaseClient
    .from("animals")
    .delete()
    .eq("id", selectedAnimal.animal_id);

  if (error) {
    console.error("Delete animal error:", error);
    alert("Error deleting animal. Check console for details.");
    return;
  }

  closeDocsModal();
  await loadAnimalsAndLocations();
});

docsParentsAddButton.addEventListener("click", async () => {
  if (!currentUser || !selectedAnimal) {
    alert("Select an animal first.");
    return;
  }

  const parentId = docsParentsCowSelect.value;
  const relationType = docsParentsTypeSelect.value;

  if (!parentId) {
    alert("Select a cow to link.");
    return;
  }

  const exists = parentsRelationships.some(
    (rel) =>
      String(rel.parent_animal_id) === String(parentId) &&
      rel.relation_type === relationType
  );
  if (exists) {
    alert("This parent is already linked with that relationship.");
    return;
  }

  const payload = {
    parent_animal_id: parentId,
    calf_animal_id: selectedAnimal.animal_id,
    relation_type: relationType,
  };

  const { error } = await supabaseClient
    .from("animal_relationships")
    .insert(payload);

  if (error) {
    console.error("Error linking parent:", error);
    alert("Error linking parent. Check console.");
    return;
  }

  await loadParentsForAnimal(selectedAnimal.animal_id);
});

docsCalvesAddButton.addEventListener("click", async () => {
  if (!currentUser || !selectedAnimal) {
    alert("Select an animal first.");
    return;
  }

  const calfId = docsCalvesCalfSelect.value;
  if (!calfId) {
    alert("Select a calf to link.");
    return;
  }

  const exists = calvesRelationships.some(
    (rel) => String(rel.calf_animal_id) === String(calfId)
  );
  if (exists) {
    alert("This calf is already linked.");
    return;
  }

  let relationType = "mother";
  const selNameLower = (selectedAnimal.name || "").toLowerCase();
  if (selNameLower.includes("bull")) {
    relationType = "father";
  } else if (selNameLower.includes("heifer")) {
    relationType = "mother";
  }

  const payload = {
    parent_animal_id: selectedAnimal.animal_id,
    calf_animal_id: calfId,
    relation_type,
  };

  const { error } = await supabaseClient
    .from("animal_relationships")
    .insert(payload);

  if (error) {
    console.error("Error linking calf:", error);
    alert("Error linking calf. Check console.");
    return;
  }

  await loadCalvesForAnimal(selectedAnimal.animal_id);
});

/* ------------------------------------------------------------------
 * ANIMALS: LOAD + RENDER + DOCS OVERVIEW FOR FILTER
 * ------------------------------------------------------------------ */

function applyFiltersToAnimals(data) {
  const searchValue = searchInput.value.trim().toLowerCase();
  const batteryMode = batteryFilter.value;
  const selectedCategory =
    detailsCategoryFilter && detailsCategoryFilter.value
      ? detailsCategoryFilter.value
      : "all";

  return data.filter((row) => {
    let matchesSearch = true;
    if (searchValue) {
      const text =
        (row.name || "").toLowerCase() +
        " " +
        (row.tag_id || "").toLowerCase();
      matchesSearch = text.includes(searchValue);
    }

    let matchesBattery = true;
    if (batteryMode !== "all") {
      const level = classifyBattery(row.battery_v);
      matchesBattery = level === batteryMode;
    }

    let matchesCategory = true;
    if (selectedCategory && selectedCategory !== "all") {
      const docSet = animalDocsCache[row.animal_id];
      matchesCategory = !!(docSet && docSet.has(selectedCategory));
    }

    return matchesSearch && matchesBattery && matchesCategory;
  });
}

async function loadAnimalsAndLocations() {
  cowList.textContent = "Loading…";

  const { data, error } = await supabaseClient
    .from("animal_latest_locations")
    .select("*")
    .order("last_seen_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("Error loading animals:", error);
    cowList.textContent = "Error loading animals.";
    herdCountPill.textContent = "0 active";
    return;
  }

  animalsCache = data || [];
  renderAnimals();
}

/* Load overview of which animals have which documentation categories
 * so the Filters area can filter by "Details category".
 */
async function loadAnimalDocsOverview() {
  if (!currentUser) {
    animalDocsCache = {};
    return;
  }

  const { data, error } = await supabaseClient
    .from("animal_docs")
    .select("animal_id, field_key, field_value");

  if (error) {
    console.error("Error loading animal docs for filter:", error);
    animalDocsCache = {};
    return;
  }

  const cache = {};
  (data || []).forEach((row) => {
    const val = row.field_value;
    if (val == null || String(val).trim() === "") return;
    const id = row.animal_id;
    if (!cache[id]) cache[id] = new Set();
    cache[id].add(row.field_key);
  });

  animalDocsCache = cache;

  // Re-render animals so category filter is applied as soon as docs cache is ready
  if (animalsCache && animalsCache.length > 0) {
    renderAnimals();
  }
}

function renderAnimals() {
  const filtered = applyFiltersToAnimals(animalsCache);
  cowList.textContent = "";
  herdCountPill.textContent = `${filtered.length} active`;

  // Clear previous markers and card map
  Object.values(markersByTag).forEach((m) => m.remove());
  Object.keys(markersByTag).forEach((k) => delete markersByTag[k]);
  Object.keys(animalCardsByTag).forEach((k) => delete animalCardsByTag[k]);
  selectedCardTagId = null;

  if (!filtered || filtered.length === 0) {
    cowList.textContent = "No animals currently listed.";
    return;
  }

  filtered.forEach((row) => {
    const card = document.createElement("div");
    card.className = "cow-card";

    const header = document.createElement("div");
    header.className = "cow-header";

    const left = document.createElement("div");
    left.innerHTML =
      `<div class="cow-id">${row.name || row.tag_id}</div>` +
      `<div class="cow-tag">${
        row.ranch_name ? row.ranch_name + " • " : ""
      }Tag: ${row.tag_id}</div>`;

    const actions = document.createElement("div");
    actions.className = "cow-actions";

    const detailsBtn = document.createElement("button");
    detailsBtn.className = "details-btn";
    detailsBtn.textContent = "Details";
    detailsBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      loadAnimalDocs(row);
    });

    actions.appendChild(detailsBtn);

    header.appendChild(left);
    header.appendChild(actions);

    const meta = document.createElement("div");
    meta.className = "cow-meta";

    let batteryClass = "battery-ok";
    let batteryLabel = "Unknown";
    const level = classifyBattery(row.battery_v);

    if (level === "good") {
      batteryLabel = "Good";
      batteryClass = "battery-ok";
    } else if (level === "medium") {
      batteryLabel = "Medium";
      batteryClass = "battery-low";
    } else if (level === "low") {
      batteryLabel = "Low";
      batteryClass = "battery-critical";
    }

    const batteryText = `<span class="${batteryClass}">${batteryLabel}</span>`;
    const timeText = row.last_seen_at
      ? new Date(row.last_seen_at).toLocaleString()
      : "never";

    meta.innerHTML =
      `<span>Last seen: ${timeText}</span>` +
      `<span>Battery: ${batteryText}</span>`;

    card.appendChild(header);
    card.appendChild(meta);

    card.addEventListener("click", () => {
      const marker = markersByTag[row.tag_id];
      if (marker) {
        const latlng = marker.getLatLng();
        map.setView(latlng, 16, { animate: true });
        marker.openPopup();
      } else if (row.latitude != null && row.longitude != null) {
        map.setView([row.latitude, row.longitude], 16, { animate: true });
      }
      highlightCardByTag(row.tag_id);
    });

    cowList.appendChild(card);

    // Track card by tag id for map -> list highlighting
    if (row.tag_id) {
      animalCardsByTag[row.tag_id] = card;
    }

    if (row.latitude != null && row.longitude != null) {
      const nameLower = (row.name || "").toLowerCase();
      let color = "#3b82f6"; // Heifer = blue (default)
      if (nameLower.includes("bull")) {
        color = "#ef4444"; // Bull = red
      } else if (nameLower.includes("steer")) {
        color = "#facc15"; // Steer = yellow
      }

      const marker = L.circleMarker([row.latitude, row.longitude], {
        radius: 7,
        weight: 2,
        color,
        fillColor: color,
        fillOpacity: 0.9,
      }).addTo(map);

      marker.bringToFront();

      const displayName = row.name || row.tag_id;
      const tagText = `Tag: ${row.tag_id}`;

      marker.bindPopup(
        `<strong>${displayName}</strong><br>${tagText}`,
        { autoPan: false }
      );

      markersByTag[row.tag_id] = marker;

      marker.on("click", () => {
        const latlng = marker.getLatLng();
        map.setView(latlng, 16, { animate: true });
        marker.openPopup();
        highlightCardByTag(row.tag_id);
      });
    }
  });

  if (filtered.length > 0) {
    const firstWithCoords = filtered.find(
      (r) => r.latitude != null && r.longitude != null
    );
    if (firstWithCoords) {
      map.setView(
        [firstWithCoords.latitude, firstWithCoords.longitude],
        12
      );
    }
  }

  ensureMapSize();
}

searchInput.addEventListener("input", () => renderAnimals());
batteryFilter.addEventListener("change", () => renderAnimals());
if (detailsCategoryFilter) {
  detailsCategoryFilter.addEventListener("change", () => renderAnimals());
}

addAnimalButton.addEventListener("click", async () => {
  if (!currentUser) {
    alert("Please sign in first.");
    return;
  }

  const tag = newAnimalTagInput.value.trim();
  const nameInputVal = newAnimalNameInput.value.trim();

  if (!tag || !nameInputVal) {
    addAnimalStatus.textContent =
      "Name/Number and Tag ID are required.";
    addAnimalStatus.style.color = "#f97373";
    addAnimalStatus.style.opacity = 1;
    return;
  }

  let type = "heifer";
  if (animalTypeSteer.checked) type = "steer";
  else if (animalTypeBull.checked) type = "bull";

  let finalName = nameInputVal;
  if (type === "heifer" && !/heifer/i.test(finalName)) {
    finalName = "Heifer " + finalName;
  } else if (type === "steer" && !/steer/i.test(finalName)) {
    finalName = "Steer " + finalName;
  } else if (type === "bull" && !/bull/i.test(finalName)) {
    finalName = "Bull " + finalName;
  }

  addAnimalStatus.textContent = "Adding animal…";
  addAnimalStatus.style.color = "#94a3b8";
  addAnimalStatus.style.opacity = 1;

  const { error } = await supabaseClient
    .from("animals")
    .insert({
      tag_id: tag,
      name: finalName,
    });

  if (error) {
    console.error("Add animal error:", error);
    addAnimalStatus.textContent =
      "Error adding animal. Check console.";
    addAnimalStatus.style.color = "#f97373";
    addAnimalStatus.style.opacity = 1;
    return;
  }

  flashStatus(addAnimalStatus, "Animal added.", "#4ade80", 5000);
  newAnimalTagInput.value = "";
  newAnimalNameInput.value = "";
  animalTypeHeifer.checked = true;

  await loadAnimalsAndLocations();
});

/* ------------------------------------------------------------------
 * ALERTS
 * ------------------------------------------------------------------ */

async function loadAlerts() {
  alertsList.textContent = "Loading…";

  const { data, error } = await supabaseClient
    .from("alerts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    console.error("Error loading alerts:", error);
    alertsList.textContent = "Error loading alerts.";
    alertCountPill.textContent = "0";
    return;
  }

  if (!data || data.length === 0) {
    alertsList.textContent = "No alerts yet.";
    alertCountPill.textContent = "0";
    return;
  }

  alertsList.textContent = "";
  alertCountPill.textContent = String(data.length);

  data.forEach((alert) => {
    const item = document.createElement("div");
    item.className = "alert-item";

    const header = document.createElement("div");
    header.className = "alert-item-header";

    const timeText = new Date(alert.created_at).toLocaleString();
    const textDiv = document.createElement("div");
    textDiv.innerHTML =
      `<strong>${alert.type || "alert"}</strong><br>` +
      `<span style="font-size:0.75rem;opacity:0.9;">${timeText}</span><br>` +
      `${alert.message || ""}`;

    const closeBtn = document.createElement("button");
    closeBtn.className = "alert-dismiss-btn";
    closeBtn.textContent = "×";
    closeBtn.title = "Dismiss alert";
    closeBtn.addEventListener("click", async (e) => {
      e.stopPropagation();

      const { error: delError } = await supabaseClient
        .from("alerts")
        .delete()
        .eq("id", alert.id);

      if (delError) {
        console.error("Error deleting alert:", delError);
        alert("Error deleting alert. Check console for details.");
        return;
      }

      item.remove();

      const currentCount = parseInt(
        alertCountPill.textContent || "0",
        10
      );
      const newCount = Math.max(0, currentCount - 1);

      alertCountPill.textContent = String(newCount);
      if (newCount === 0 && !alertsList.hasChildNodes()) {
        alertsList.textContent = "No alerts yet.";
      }
    });

    header.appendChild(textDiv);
    header.appendChild(closeBtn);
    item.appendChild(header);
    alertsList.appendChild(item);
  });
}

/* ------------------------------------------------------------------
 * GEOFENCES
 * ------------------------------------------------------------------ */

async function loadGeofences() {
  geofencesList.textContent = "Loading…";

  const { data, error } = await supabaseClient
    .from("geofences")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error loading geofences:", error);
    geofencesList.textContent = "Error loading geofences.";
    return;
  }

  geofencesList.textContent = "";
  drawnItems.clearLayers();
  Object.keys(geofenceLayersById).forEach(
    (id) => delete geofenceLayersById[id]
  );

  geofencesData = data || [];

  if (!data || data.length === 0) {
    geofencesList.textContent = "No geofences yet.";
    return;
  }

  data.forEach((fence) => {
    const polygon = fence.polygon;
    if (!Array.isArray(polygon) || polygon.length < 3) return;

    const latlngs = polygon.map((pair) => L.latLng(pair[0], pair[1]));
    const layer = L.polygon(latlngs, {
      color: "#4f46e5",
      weight: 2,
      fillOpacity: 0.06,
    });

    layer.addTo(drawnItems);
    layer.bindPopup(fence.name);
    layer.bringToBack();
    geofenceLayersById[fence.id] = layer;

    const item = document.createElement("div");
    item.className = "geofence-item";

    item.addEventListener("click", () => {
      const bounds = layer.getBounds();
      map.fitBounds(bounds, { padding: [28, 28] });
      layer.openPopup();
    });

    const headerDiv = document.createElement("div");
    headerDiv.className = "geofence-item-header";

    const nameDiv = document.createElement("div");
    nameDiv.className = "geofence-item-name";
    nameDiv.textContent = fence.name;

    const rightControls = document.createElement("div");
    rightControls.style.display = "flex";
    rightControls.style.alignItems = "center";
    rightControls.style.gap = "0.25rem";

    const detailsBtn = document.createElement("button");
    detailsBtn.className = "small-button small-button-geo-details";
    detailsBtn.textContent = "Details";

    const removeBtn = document.createElement("button");
    removeBtn.className = "geofence-remove-btn";
    removeBtn.textContent = "×";
    removeBtn.title = "Remove geofence";

    rightControls.appendChild(detailsBtn);
    rightControls.appendChild(removeBtn);

    headerDiv.appendChild(nameDiv);
    headerDiv.appendChild(rightControls);

    const metaDiv = document.createElement("div");
    metaDiv.className = "geofence-item-meta";
    metaDiv.textContent = `Vertices: ${polygon.length}`;

    const detailsDiv = document.createElement("div");
    detailsDiv.className = "geofence-details";

    removeBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (!confirm(`Remove geofence "${fence.name}"?`)) return;

      const { error: updateError } = await supabaseClient
        .from("geofences")
        .update({ is_active: false })
        .eq("id", fence.id);

      if (updateError) {
        console.error("Error removing geofence:", updateError);
        alert("Error removing geofence. Check console for details.");
        return;
      }

      const existingLayer = geofenceLayersById[fence.id];
      if (existingLayer) {
        drawnItems.removeLayer(existingLayer);
        delete geofenceLayersById[fence.id];
      }

      item.remove();
      if (!geofencesList.hasChildNodes()) {
        geofencesList.textContent = "No geofences yet.";
      }
    });

    detailsBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isHidden = detailsDiv.style.display === "none";

      if (isHidden) {
        const counts = { heifer: 0, steer: 0, bull: 0, total: 0 };

        if (Array.isArray(animalsCache) && animalsCache.length > 0) {
          animalsCache.forEach((row) => {
            if (
              row.latitude == null ||
              row.longitude == null
            ) return;

            const pt = [row.latitude, row.longitude];
            if (!isPointInPolygon(pt, polygon)) return;

            counts.total++;

            const nameLower = (row.name || "").toLowerCase();
            if (nameLower.includes("heifer")) counts.heifer++;
            else if (nameLower.includes("steer")) counts.steer++;
            else if (nameLower.includes("bull")) counts.bull++;
          });
        }

        detailsDiv.innerHTML =
          `<div>Heifer: <strong>${counts.heifer}</strong></div>` +
          `<div>Steer: <strong>${counts.steer}</strong></div>` +
          `<div>Bull: <strong>${counts.bull}</strong></div>` +
          `<div>Total: <strong>${counts.total}</strong></div>`;

        detailsDiv.style.display = "block";
        detailsBtn.textContent = "Hide details";
      } else {
        detailsDiv.style.display = "none";
        detailsBtn.textContent = "Details";
      }
    });

    item.appendChild(headerDiv);
    item.appendChild(metaDiv);
    item.appendChild(detailsDiv);
    geofencesList.appendChild(item);
  });

  ensureMapSize();
}

startDrawGeofenceBtn.addEventListener("click", () => {
  if (!currentUser) {
    alert("Please sign in first.");
    return;
  }
  if (!polygonDrawer) {
    polygonDrawer = new L.Draw.Polygon(
      map,
      drawControl.options.draw.polygon
    );
  }
  polygonDrawer.enable();
  alert(
    "Click around the pasture to draw your geofence. Double-click to finish."
  );
});

map.on(L.Draw.Event.CREATED, async (event) => {
  if (!currentUser) {
    alert("You must be signed in to save geofences.");
    return;
  }

  const layer = event.layer;
  if (event.layerType !== "polygon") return;

  const latlngs = layer.getLatLngs()[0] || [];
  if (!latlngs.length) return;

  const polygon = latlngs.map((ll) => [ll.lat, ll.lng]);
  const name = prompt('Name this geofence (e.g. "North Pasture"):' );
  if (!name || name.trim() === "") return;

  const { error } = await supabaseClient
    .from("geofences")
    .insert({
      farmer_id: currentUser.id,
      name: name.trim(),
      polygon,
    });

  if (error) {
    console.error("Error saving geofence:", error);
    alert("Error saving geofence. Check console for details.");
    return;
  }

  layer.addTo(drawnItems);
  layer.bindPopup(name.trim());
  layer.bringToBack();

  await loadGeofences();
});

/* ------------------------------------------------------------------
 * EXPORT CATEGORY MODAL (for Documentation PDF / Excel)
 * ------------------------------------------------------------------ */

function openExportModal(mode) {
  if (!exportModal) {
    // If HTML not wired yet, just fall back to legacy direct export
    if (mode === "pdf") {
      generateDocsPdf(DOC_FIELDS.map((f) => f.key));
    } else {
      generateDocsExcel(DOC_FIELDS.map((f) => f.key));
    }
    return;
  }

  currentExportMode = mode;
  exportCategoriesList.innerHTML = "";

  if (mode === "pdf") {
    exportModalTitle.textContent = "Documentation PDF";
    exportModalSubtitle.textContent =
      "Choose which documentation categories to include in the PDF.";
    if (exportConfirmBtn) exportConfirmBtn.textContent = "Download PDF";
  } else {
    exportModalTitle.textContent = "Documentation Excel";
    exportModalSubtitle.textContent =
      "Choose which documentation categories to include in the Excel file.";
    if (exportConfirmBtn) exportConfirmBtn.textContent = "Download Excel";
  }

  // Show all DOC_FIELDS, pre-selected
  DOC_FIELDS.forEach((field) => {
    const row = document.createElement("label");
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.gap = "0.4rem";
    row.style.fontSize = "0.8rem";
    row.style.marginBottom = "0.25rem";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = field.key;
    checkbox.checked = true;

    const span = document.createElement("span");
    span.textContent = field.label;

    row.appendChild(checkbox);
    row.appendChild(span);

    exportCategoriesList.appendChild(row);
  });

  exportModal.classList.add("visible");
}

function closeExportModal() {
  if (!exportModal) return;
  exportModal.classList.remove("visible");
  currentExportMode = null;
  exportCategoriesList.innerHTML = "";
}

function getSelectedExportFieldKeys() {
  if (!exportCategoriesList) return DOC_FIELDS.map((f) => f.key);

  const checkboxes = exportCategoriesList.querySelectorAll(
    'input[type="checkbox"]'
  );
  const keys = [];
  checkboxes.forEach((cb) => {
    if (cb.checked) keys.push(cb.value);
  });
  return keys;
}

if (exportCancelBtn) {
  exportCancelBtn.addEventListener("click", () => {
    closeExportModal();
  });
}

if (exportModal) {
  exportModal.addEventListener("click", (e) => {
    if (e.target === exportModal) {
      closeExportModal();
    }
  });
}

if (exportConfirmBtn) {
  exportConfirmBtn.addEventListener("click", async () => {
    if (!currentExportMode) {
      closeExportModal();
      return;
    }

    const selectedKeys = getSelectedExportFieldKeys();
    if (selectedKeys.length === 0) {
      const proceed = confirm(
        "No categories selected. Export will only include the animal name/tag. Continue?"
      );
      if (!proceed) return;
    }

    closeExportModal();

    if (currentExportMode === "pdf") {
      await generateDocsPdf(selectedKeys);
    } else {
      await generateDocsExcel(selectedKeys);
    }
  });
}

/* ------------------------------------------------------------------
 * REPORTS: DOCUMENTATION PDF / EXCEL (with selectable categories)
 * ------------------------------------------------------------------ */

docsPdfButton.addEventListener("click", () => {
  if (!currentUser) {
    alert("Please sign in first.");
    return;
  }
  openExportModal("pdf");
});

docsExcelButton.addEventListener("click", () => {
  if (!currentUser) {
    alert("Please sign in first.");
    return;
  }
  openExportModal("excel");
});

async function generateDocsPdf(selectedFieldKeys) {
  if (!currentUser) {
    alert("Please sign in first.");
    return;
  }

  docsPdfStatus.textContent = "Building PDF…";
  docsPdfStatus.style.color = "#94a3b8";
  docsPdfStatus.style.opacity = 1;

  try {
    const { data: animals, error: animalsError } = await supabaseClient
      .from("animals")
      .select("id, tag_id, name")
      .order("created_at", { ascending: true });

    if (animalsError) throw animalsError;
    if (!animals || animals.length === 0) {
      docsPdfStatus.textContent = "No animals to export.";
      docsPdfStatus.style.color = "#f97373";
      docsPdfStatus.style.opacity = 1;
      return;
    }

    const animalIds = animals.map((a) => a.id);

    const { data: docs, error: docsError } = await supabaseClient
      .from("animal_docs")
      .select("*")
      .in("animal_id", animalIds);

    if (docsError) throw docsError;

    const { data: fences, error: fencesError } = await supabaseClient
      .from("geofences")
      .select("id, name, polygon")
      .eq("is_active", true);

    if (fencesError) throw fencesError;
    const geofencesForExport = fences || [];

    const { data: locs, error: locsError } = await supabaseClient
      .from("animal_latest_locations")
      .select("animal_id, latitude, longitude")
      .in("animal_id", animalIds);

    if (locsError) throw locsError;
    const locMap = {};
    (locs || []).forEach((l) => {
      locMap[l.animal_id] = l;
    });

    const docsByAnimal = {};
    (docs || []).forEach((doc) => {
      if (!docsByAnimal[doc.animal_id]) {
        docsByAnimal[doc.animal_id] = [];
      }
      docsByAnimal[doc.animal_id].push(doc);
    });

    function getGeofenceNamesForExport(animalId) {
      const loc = locMap[animalId];
      if (!loc || loc.latitude == null || loc.longitude == null) return "";
      if (!geofencesForExport || geofencesForExport.length === 0) return "";

      const pt = [loc.latitude, loc.longitude];
      const names = [];

      geofencesForExport.forEach((fence) => {
        if (Array.isArray(fence.polygon) && fence.polygon.length >= 3) {
          if (isPointInPolygon(pt, fence.polygon)) {
            names.push(fence.name);
          }
        }
      });
      return names.join(", ");
    }

    // Always keep geofence updated in docsByAnimal, even if not selected later
    animals.forEach((animal) => {
      const list = docsByAnimal[animal.id] || (docsByAnimal[animal.id] = []);
      const gfNames = getGeofenceNamesForExport(animal.id);
      const idx = list.findIndex((d) => d.field_key === "geofence");

      if (idx >= 0) {
        list[idx].field_value = gfNames;
        list[idx].field_label = list[idx].field_label || "Geofence";
      } else {
        list.push({
          animal_id: animal.id,
          field_key: "geofence",
          field_label: "Geofence",
          field_value: gfNames,
        });
      }
    });

    const usedFields = DOC_FIELDS.filter((f) =>
      selectedFieldKeys.includes(f.key)
    );

    const { jsPDF } = window.jspdf;
    const docPdf = new jsPDF("landscape");

    docPdf.setFontSize(14);
    docPdf.text("AniTrackers – Herd Documentation Matrix", 14, 16);

    docPdf.setFontSize(11);
    const timestamp = new Date().toLocaleString();
    docPdf.text(`Generated: ${timestamp}`, 14, 22);

    const headRow = ["Animal / Tag"];
    if (usedFields.length > 0) {
      headRow.push(...usedFields.map((f) => f.label));
    }

    const bodyRows = animals.map((animal) => {
      const animalDocs = docsByAnimal[animal.id] || [];
      const rowValues = usedFields.map((field) => {
        const match = animalDocs.find(
          (d) =>
            d.field_key === field.key &&
            d.field_value != null
        );
        return match ? String(match.field_value) : "";
      });
      return [animal.name || animal.tag_id, ...rowValues];
    });

    const baseFontSize = usedFields.length > 8 ? 6 : 7;

    docPdf.autoTable({
      startY: 28,
      head: [headRow],
      body: bodyRows,
      styles: {
        fontSize: baseFontSize,
        cellPadding: 2,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: 255,
        fontSize: baseFontSize,
      },
      columnStyles: {
        0: { cellWidth: 35 },
      },
    });

    docPdf.save("anitrackers-documentation-matrix.pdf");
    flashStatus(docsPdfStatus, "PDF downloaded.", "#4ade80", 5000);
  } catch (err) {
    console.error("PDF generation error:", err);
    docsPdfStatus.textContent =
      "Error generating PDF. Check console.";
    docsPdfStatus.style.color = "#f97373";
    docsPdfStatus.style.opacity = 1;
  }
}

async function generateDocsExcel(selectedFieldKeys) {
  if (!currentUser) {
    alert("Please sign in first.");
    return;
  }

  docsExcelStatus.textContent = "Building Excel…";
  docsExcelStatus.style.color = "#94a3b8";
  docsExcelStatus.style.opacity = 1;

  try {
    const { data: animals, error: animalsError } = await supabaseClient
      .from("animals")
      .select("id, tag_id, name")
      .order("created_at", { ascending: true });

    if (animalsError) throw animalsError;
    if (!animals || animals.length === 0) {
      docsExcelStatus.textContent = "No animals to export.";
      docsExcelStatus.style.color = "#f97373";
      docsExcelStatus.style.opacity = 1;
      return;
    }

    const animalIds = animals.map((a) => a.id);

    const { data: docs, error: docsError } = await supabaseClient
      .from("animal_docs")
      .select("*")
      .in("animal_id", animalIds);

    if (docsError) throw docsError;

    const { data: fences, error: fencesError } = await supabaseClient
      .from("geofences")
      .select("id, name, polygon")
      .eq("is_active", true);

    if (fencesError) throw fencesError;
    const geofencesForExport = fences || [];

    const { data: locs, error: locsError } = await supabaseClient
      .from("animal_latest_locations")
      .select("animal_id, latitude, longitude")
      .in("animal_id", animalIds);

    if (locsError) throw locsError;
    const locMap = {};
    (locs || []).forEach((l) => {
      locMap[l.animal_id] = l;
    });

    const docsByAnimal = {};
    (docs || []).forEach((doc) => {
      if (!docsByAnimal[doc.animal_id]) {
        docsByAnimal[doc.animal_id] = [];
      }
      docsByAnimal[doc.animal_id].push(doc);
    });

    function getGeofenceNamesForExport(animalId) {
      const loc = locMap[animalId];
      if (!loc || loc.latitude == null || loc.longitude == null) return "";
      if (!geofencesForExport || geofencesForExport.length === 0) return "";

      const pt = [loc.latitude, loc.longitude];
      const names = [];

      geofencesForExport.forEach((fence) => {
        if (Array.isArray(fence.polygon) && fence.polygon.length >= 3) {
          if (isPointInPolygon(pt, fence.polygon)) {
            names.push(fence.name);
          }
        }
      });
      return names.join(", ");
    }

    animals.forEach((animal) => {
      const list = docsByAnimal[animal.id] || (docsByAnimal[animal.id] = []);
      const gfNames = getGeofenceNamesForExport(animal.id);
      const idx = list.findIndex((d) => d.field_key === "geofence");

      if (idx >= 0) {
        list[idx].field_value = gfNames;
        list[idx].field_label = list[idx].field_label || "Geofence";
      } else {
        list.push({
          animal_id: animal.id,
          field_key: "geofence",
          field_label: "Geofence",
          field_value: gfNames,
        });
      }
    });

    const usedFields = DOC_FIELDS.filter((f) =>
      selectedFieldKeys.includes(f.key)
    );

    const header = ["Animal / Tag"];
    if (usedFields.length > 0) {
      header.push(...usedFields.map((f) => f.label));
    }

    const dataRows = animals.map((animal) => {
      const animalDocs = docsByAnimal[animal.id] || [];
      const rowValues = usedFields.map((field) => {
        const match = animalDocs.find(
          (d) =>
            d.field_key === field.key &&
            d.field_value != null
        );
        return match ? String(match.field_value) : "";
      });
      return [animal.name || animal.tag_id, ...rowValues];
    });

    const aoa = [header, ...dataRows];
    const ws = XLSX.utils.aoa_to_sheet(aoa);

    const colCount = header.length;
    const colWidths = new Array(colCount).fill(0);

    aoa.forEach((row) => {
      row.forEach((val, idx) => {
        const text = val == null ? "" : String(val);
        colWidths[idx] = Math.max(colWidths[idx], text.length);
      });
    });

    ws["!cols"] = colWidths.map((len) => ({
      wch: Math.min(Math.max(len + 2, 10), 50),
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Documentation");
    XLSX.writeFile(wb, "anitrackers-documentation-matrix.xlsx");

    flashStatus(docsExcelStatus, "Excel downloaded.", "#4ade80", 5000);
  } catch (err) {
    console.error("Excel generation error:", err);
    docsExcelStatus.textContent =
      "Error generating Excel. Check console.";
    docsExcelStatus.style.color = "#f97373";
    docsExcelStatus.style.opacity = 1;
  }
}

/* ------------------------------------------------------------------
 * REPORTS: SHOT RECORD PDF / EXCEL (unchanged)
 * ------------------------------------------------------------------ */

shotPdfButton.addEventListener("click", async () => {
  if (!currentUser) {
    alert("Please sign in first.");
    return;
  }

  shotPdfStatus.textContent = "Building shot record PDF…";
  shotPdfStatus.style.color = "#94a3b8";
  shotPdfStatus.style.opacity = 1;

  try {
    const { data: animals, error: animalsError } = await supabaseClient
      .from("animals")
      .select("id, tag_id, name")
      .order("created_at", { ascending: true });

    if (animalsError) throw animalsError;
    if (!animals || animals.length === 0) {
      shotPdfStatus.textContent = "No animals to export.";
      shotPdfStatus.style.color = "#f97373";
      shotPdfStatus.style.opacity = 1;
      return;
    }

    const { jsPDF } = window.jspdf;
    const docPdf = new jsPDF("landscape");

    docPdf.setFontSize(14);
    docPdf.text("AniTrackers – Shot Record Template", 14, 16);

    docPdf.setFontSize(11);
    const timestamp = new Date().toLocaleString();
    docPdf.text(`Generated: ${timestamp}`, 14, 22);

    const headRow = [
      "Animal / Name",
      "Tag ID",
      "Vaccine 1",
      "Vaccine 1 Date",
      "Vaccine 2",
      "Vaccine 2 Date",
      "Booster Notes",
    ];

    const bodyRows = animals.map((animal) => [
      animal.name || animal.tag_id,
      animal.tag_id || "",
      "",
      "",
      "",
      "",
      "",
    ]);

    docPdf.autoTable({
      startY: 28,
      head: [headRow],
      body: bodyRows,
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: 255,
        fontSize: 8,
      },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 25 },
      },
    });

    docPdf.save("anitrackers-shot-record-template.pdf");
    flashStatus(
      shotPdfStatus,
      "Shot record PDF downloaded.",
      "#4ade80",
      5000
    );
  } catch (err) {
    console.error("Shot PDF generation error:", err);
    shotPdfStatus.textContent =
      "Error generating shot record PDF. Check console.";
    shotPdfStatus.style.color = "#f97373";
    shotPdfStatus.style.opacity = 1;
  }
});

shotExcelButton.addEventListener("click", async () => {
  if (!currentUser) {
    alert("Please sign in first.");
    return;
  }

  shotExcelStatus.textContent = "Building shot record Excel…";
  shotExcelStatus.style.color = "#94a3b8";
  shotExcelStatus.style.opacity = 1;

  try {
    const { data: animals, error: animalsError } = await supabaseClient
      .from("animals")
      .select("id, tag_id, name")
      .order("created_at", { ascending: true });

    if (animalsError) throw animalsError;
    if (!animals || animals.length === 0) {
      shotExcelStatus.textContent = "No animals to export.";
      shotExcelStatus.style.color = "#f97373";
      shotExcelStatus.style.opacity = 1;
      return;
    }

    const header = [
      "Animal / Name",
      "Tag ID",
      "Vaccine 1",
      "Vaccine 1 Date",
      "Vaccine 2",
      "Vaccine 2 Date",
      "Booster Notes",
    ];

    const dataRows = animals.map((animal) => [
      animal.name || animal.tag_id,
      animal.tag_id || "",
      "",
      "",
      "",
      "",
      "",
    ]);

    const aoa = [header, ...dataRows];
    const ws = XLSX.utils.aoa_to_sheet(aoa);

    const colCount = header.length;
    const colWidths = new Array(colCount).fill(0);

    aoa.forEach((row) => {
      row.forEach((val, idx) => {
        const text = val == null ? "" : String(val);
        colWidths[idx] = Math.max(colWidths[idx], text.length);
      });
    });

    ws["!cols"] = colWidths.map((len) => ({
      wch: Math.min(Math.max(len + 2, 10), 40),
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Shot Record");
    XLSX.writeFile(wb, "anitrackers-shot-record-template.xlsx");

    flashStatus(
      shotExcelStatus,
      "Shot record Excel downloaded.",
      "#4ade80",
      5000
    );
  } catch (err) {
    console.error("Shot Excel generation error:", err);
    shotExcelStatus.textContent =
      "Error generating shot record Excel. Check console.";
    shotExcelStatus.style.color = "#f97373";
    shotExcelStatus.style.opacity = 1;
  }
});

/* ------------------------------------------------------------------
 * AUTH
 * ------------------------------------------------------------------ */

emailInput.addEventListener("keydown", handleAuthKeydown);
passwordInput.addEventListener("keydown", handleAuthKeydown);

if (passwordToggle) {
  passwordToggle.addEventListener("click", () => {
    const isPassword = passwordInput.type === "password";
    passwordInput.type = isPassword ? "text" : "password";
    passwordToggle.setAttribute(
      "aria-label",
      isPassword ? "Hide password" : "Show password"
    );
  });
}

addAnimalToggle.addEventListener("click", () => {
  const isHidden = addAnimalBody.style.display === "none";
  addAnimalBody.style.display = isHidden ? "block" : "none";
  addAnimalToggleIcon.textContent = isHidden ? "-" : "+";
});

reportsToggle.addEventListener("click", () => {
  const isHidden = reportsBody.style.display === "none";
  reportsBody.style.display = isHidden ? "block" : "none";
  reportsToggleIcon.textContent = isHidden ? "-" : "+";
});

signinButton.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  authStatus.textContent = "Signing in…";
  authStatus.style.color = "#94a3b8";
  authStatus.style.opacity = 1;

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Sign-in error:", error);
    setAuthMessage(error.message || "Sign-in failed.", true);
    return;
  }

  currentUser = data.user;
  setAuthState(true, email);
  setAuthMessage("Signed in successfully.");
  await refreshDashboard();
});

signupButton.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  authStatus.textContent = "Creating account…";
  authStatus.style.color = "#94a3b8";
  authStatus.style.opacity = 1;

  const { error } = await supabaseClient.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error("Sign-up error:", error);
    setAuthMessage(error.message || "Sign-up failed.", true);
    return;
  }

  setAuthMessage(
    "Account created. Check your email if confirmation is enabled, then sign in."
  );
});

logoutButton.addEventListener("click", async () => {
  try {
    await supabaseClient.auth.signOut();
  } catch (e) {
    console.error("Logout error:", e);
  }
  localStorage.clear();
  sessionStorage.clear();
  setAuthState(false, null);
  location.reload();
});

/* ------------------------------------------------------------------
 * INIT
 * ------------------------------------------------------------------ */

(async () => {
  setAuthState(false, null);
  ensureMapSize();
})();
