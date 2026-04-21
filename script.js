const state = {
  data: null,
  activeClass: "Semua Kelas",
  filter: "all",
  searchTerm: ""
};

const kelasListEl = document.getElementById("kelas-list");
const mapelListEl = document.getElementById("mapel-list");
const featuredListEl = document.getElementById("featured-list");
const kelasTerpilihEl = document.getElementById("kelas-terpilih");
const mapelInfoEl = document.getElementById("mapel-info");
const resultSummaryEl = document.getElementById("result-summary");
const availabilitySummaryEl = document.getElementById("availability-summary");
const yearEl = document.getElementById("year");
const searchInputEl = document.getElementById("search-input");
const filterChipEls = document.querySelectorAll("[data-filter]");
const logoEl = document.getElementById("school-logo");
const logoFallbackEl = document.getElementById("school-logo-fallback");
const statKelasEl = document.getElementById("stat-kelas");
const statMapelEl = document.getElementById("stat-mapel");
const statMateriEl = document.getElementById("stat-materi");

yearEl.textContent = new Date().getFullYear();

if (logoEl) {
  logoEl.addEventListener("error", () => {
    logoEl.style.display = "none";
    logoFallbackEl.style.display = "inline-flex";
  });
}

function formatNumber(value) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function flattenSubjects(classes) {
  return classes.flatMap((kelas) =>
    kelas.subjects.map((subject) => ({
      ...subject,
      className: kelas.name
    }))
  );
}

function isSubjectAvailable(subject) {
  return Boolean(subject.materialUrl);
}

function getFilteredSubjects() {
  if (!state.data) {
    return [];
  }

  const allSubjects = flattenSubjects(state.data.classes);
  const search = state.searchTerm.trim().toLowerCase();

  return allSubjects.filter((subject) => {
    const classMatch =
      state.activeClass === "Semua Kelas" || subject.className === state.activeClass;
    const filterMatch =
      state.filter === "all" ||
      (state.filter === "available" && isSubjectAvailable(subject)) ||
      (state.filter === "pending" && !isSubjectAvailable(subject));
    const haystack = [
      subject.name,
      subject.teacher,
      subject.topic,
      subject.summary,
      subject.className
    ]
      .join(" ")
      .toLowerCase();
    const searchMatch = !search || haystack.includes(search);

    return classMatch && filterMatch && searchMatch;
  });
}

function updateStats() {
  const classes = state.data.classes;
  const subjects = flattenSubjects(classes);
  const availableCount = subjects.filter(isSubjectAvailable).length;

  statKelasEl.textContent = formatNumber(classes.length);
  statMapelEl.textContent = formatNumber(subjects.length);
  statMateriEl.textContent = formatNumber(availableCount);
  availabilitySummaryEl.textContent =
    `${availableCount} dari ${subjects.length} mata pelajaran sudah memiliki materi aktif. ` +
    "Sisanya tetap ditampilkan agar sekolah bisa menambah konten secara bertahap.";
}

function renderFeatured() {
  const featuredSubjects = flattenSubjects(state.data.classes).filter(isSubjectAvailable);

  if (!featuredSubjects.length) {
    featuredListEl.innerHTML =
      '<p class="empty-card">Belum ada materi unggulan yang bisa ditampilkan.</p>';
    return;
  }

  featuredListEl.innerHTML = featuredSubjects
    .map(
      (subject) => `
        <article class="featured-card">
          <span class="featured-class">${subject.className}</span>
          <div>
            <h3>${subject.name}</h3>
            <p>${subject.summary}</p>
          </div>
          <p><strong>Topik:</strong> ${subject.topic}</p>
          <p><strong>Pengampu:</strong> ${subject.teacher}</p>
          <a class="featured-link" href="${subject.materialUrl}">Buka Materi</a>
        </article>
      `
    )
    .join("");
}

function renderClasses() {
  const classes = [
    {
      name: "Semua Kelas",
      description: "Lihat seluruh mapel dari kelas 1 sampai 6."
    },
    ...state.data.classes.map((kelas) => ({
      name: kelas.name,
      description: kelas.description
    }))
  ];

  kelasListEl.innerHTML = classes
    .map((kelas) => {
      const active = state.activeClass === kelas.name;
      return `
        <button
          type="button"
          class="class-button ${active ? "active" : ""}"
          data-kelas="${kelas.name}"
          role="option"
          aria-selected="${active}"
        >
          <strong>${kelas.name}</strong>
          <span>${kelas.description}</span>
        </button>
      `;
    })
    .join("");

  kelasListEl.querySelectorAll("[data-kelas]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeClass = button.dataset.kelas;
      renderClasses();
      renderSubjects();
    });
  });
}

function renderSubjects() {
  const filteredSubjects = getFilteredSubjects();
  const classLabel = state.activeClass === "Semua Kelas" ? "Semua kelas" : state.activeClass;
  const availableCount = filteredSubjects.filter(isSubjectAvailable).length;

  kelasTerpilihEl.textContent = classLabel;
  mapelInfoEl.textContent =
    filteredSubjects.length > 0
      ? `${filteredSubjects.length} mapel ditemukan`
      : "Belum ada hasil yang sesuai";
  resultSummaryEl.textContent =
    `${filteredSubjects.length} hasil tampil, ${availableCount} di antaranya sudah punya materi aktif.`;

  if (!filteredSubjects.length) {
    mapelListEl.innerHTML = `
      <article class="empty-card">
        <h3>Tidak ada hasil yang cocok.</h3>
        <p>Coba ganti kata kunci pencarian, ubah filter, atau pilih kelas lain.</p>
      </article>
    `;
    return;
  }

  mapelListEl.innerHTML = filteredSubjects
    .map(
      (subject) => `
        <article class="subject-card">
          <div class="subject-top">
            <div>
              <h3>${subject.name}</h3>
              <p>${subject.className}</p>
            </div>
            <div class="subject-meta">
              <span class="badge ${isSubjectAvailable(subject) ? "badge-ready" : "badge-pending"}">
                ${isSubjectAvailable(subject) ? "Tersedia" : "Segera Hadir"}
              </span>
            </div>
          </div>

          <div class="subject-topic">
            <strong>Topik Utama</strong>
            <p>${subject.topic}</p>
          </div>

          <p><strong>Guru pengampu:</strong> ${subject.teacher}</p>
          <p>${subject.summary}</p>
          ${
            isSubjectAvailable(subject)
              ? `<a class="subject-link" href="${subject.materialUrl}">Buka Materi</a>`
              : `<span class="subject-link-disabled">Materi disiapkan bertahap</span>`
          }
        </article>
      `
    )
    .join("");
}

function attachToolbarEvents() {
  searchInputEl.addEventListener("input", (event) => {
    state.searchTerm = event.target.value;
    renderSubjects();
  });

  filterChipEls.forEach((chip) => {
    chip.addEventListener("click", () => {
      state.filter = chip.dataset.filter;
      filterChipEls.forEach((item) => {
        const active = item === chip;
        item.classList.toggle("active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      renderSubjects();
    });
  });
}

function renderError(message) {
  featuredListEl.innerHTML = `<p class="empty-card">${message}</p>`;
  mapelListEl.innerHTML = `<p class="empty-card">${message}</p>`;
  resultSummaryEl.textContent = "Portal tidak bisa memuat data.";
  availabilitySummaryEl.textContent = "Periksa kembali berkas data materi.";
}

function loadPortalData() {
  if (!window.portalData || !Array.isArray(window.portalData.classes)) {
    renderError("Data materi gagal dimuat. Pastikan berkas portal-data.js tersedia.");
    return;
  }

  state.data = window.portalData;
  updateStats();
  renderFeatured();
  renderClasses();
  renderSubjects();
}

attachToolbarEvents();
loadPortalData();
