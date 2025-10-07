;(() => {
  const Swal = window.Swal;
  const POLKU_COMMON = window.POLKU_COMMON;

  async function loadJSON(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Gagal memuat ${url}: ${res.status} ${res.statusText}`);
      const data = await res.json();
      console.log("[berkendara.js] Data loaded from", url, ":", data);
      return data;
    } catch (e) {
      console.error("[berkendara.js] loadJSON error for", url, ":", e);
      alert(`Gagal memuat data dari ${url}. Pastikan file ada dan server berjalan. Detail: ${e.message}`);
      return { categories: [] };
    }
  }

  let originalData = null;

  function renderTables(data) {
    const container = document.getElementById("ber-sections");
    if (!container) {
      console.error("[berkendara.js] Container 'ber-sections' not found");
      return;
    }
    container.innerHTML = "";

    if (!data || !data.categories || !Array.isArray(data.categories)) {
      console.error("[berkendara.js] Invalid data format:", data);
      return;
    }

    data.categories.forEach((cat) => {
      const sec = document.createElement("section");
      sec.className = "table-section";
      sec.dataset.category = cat.id;
      const bgColor = cat.color || "#15172e";
      const textColor = cat.textColor || "#ffffff";
      
      sec.innerHTML = `
        <table>
          <thead>
            <tr style="background-color: ${bgColor};">
              <th colspan="5">${cat.title || cat.id}</th>
            </tr>
            <tr style="background-color: ${bgColor};">
              <th>UU</th>
              <th>Ceklis</th>
              <th>Jenis Pelanggaran</th>
              <th>Denda</th>
              <th>Hukuman</th>
            </tr>
          </thead>
          <tbody id="${cat.id}Table"></tbody>
        </table>
      `;
      container.appendChild(sec);

      const tbody = sec.querySelector(`#${cat.id}Table`);
      if (!cat.rows || !Array.isArray(cat.rows)) {
        console.error(`[berkendara.js] No rows found for category ${cat.id}`);
        return;
      }
      cat.rows.forEach((row) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${row.uu || '-'}</td>
          <td style="text-align: center;"><input type="checkbox" class="checkbox" data-uu="${row.uu || ''}" data-tindak="${row.tindak || ''}" data-denda="${row.denda || 0}" data-hukuman="${row.hukuman || ''}"></td>
          <td>${row.tindak || '-'}</td>
          <td>$${(row.denda || 0).toLocaleString()}</td>
          <td>${row.hukuman || '-'}</td>
        `;
        tbody.appendChild(tr);
      });
    });
  }

  function initSearch() {
    const input = document.getElementById("searchInput");
    if (!input) {
      console.error("[berkendara.js] Search input not found");
      return;
    }
    
    input.addEventListener("input", function () {
      const filter = this.value.toLowerCase().trim();
      const sections = document.querySelectorAll(".table-section");
      
      sections.forEach((section) => {
        const tbody = section.querySelector("tbody");
        const rows = tbody.querySelectorAll("tr");
        let hasVisibleRow = false;
        
        rows.forEach((row) => {
          const cells = row.getElementsByTagName("td");
          let visible = false;
          
          if (filter === "") {
            visible = true;
          } else {
            for (let i = 0; i < cells.length; i++) {
              if (cells[i].textContent.toLowerCase().includes(filter)) {
                visible = true;
                break;
              }
            }
          }
          
          row.style.display = visible ? "" : "none";
          if (visible) hasVisibleRow = true;
        });
        
        // Hide atau show section berdasarkan apakah ada row yang visible
        if (hasVisibleRow || filter === "") {
          section.classList.remove("hidden");
        } else {
          section.classList.add("hidden");
        }
      });
    });
  }

  function computeAndRenderSummary() {
    const checkboxes = document.querySelectorAll(".checkbox:checked");
    const uuSummary = [];
    const tindakSummary = [];
    const uniquePenalties = new Set();
    let totalDenda = 0;

    checkboxes.forEach((cb) => {
      uuSummary.push(cb.dataset.uu);
      tindakSummary.push(cb.dataset.tindak);
      const denda = Number.parseInt(cb.dataset.denda, 10) || 0;
      totalDenda += denda;
      const hukumanText = cb.dataset.hukuman.trim();
      hukumanText.split("+").forEach((a) => uniquePenalties.add(a.trim()));
    });

    const table = document.getElementById("summary-table");
    if (checkboxes.length > 0) {
      table.classList.remove("hidden");
      document.getElementById("uu-summary").textContent = uuSummary.join(", ") || "-";
      document.getElementById("tindak-summary").textContent = tindakSummary.join(", ") || "-";
      document.getElementById("denda-summary").textContent = `$${totalDenda.toLocaleString()}` || "$0";
      document.getElementById("hukuman-summary").textContent = Array.from(uniquePenalties).join(", ") || "-";
    } else {
      table.classList.add("hidden");
    }
  }

  function initButtons() {
    const submit = document.getElementById("submit");
    if (submit) submit.addEventListener("click", computeAndRenderSummary);

    const reset = document.getElementById("reset");
    if (reset) {
      reset.addEventListener("click", () => {
        document.querySelectorAll(".checkbox").forEach((cb) => (cb.checked = false));
        document.getElementById("summary-table").classList.add("hidden");
        ["uu", "tindak", "denda", "hukuman"].forEach((k) => {
          const el = document.getElementById(`${k}-summary`);
          if (el) el.textContent = "";
        });
      });
    }

    const copyMap = {
      "copy-uu": "uu-summary",
      "copy-tindak": "tindak-summary",
      "copy-denda": "denda-summary",
      "copy-hukuman": "hukuman-summary",
    };
    Object.entries(copyMap).forEach(([btnId, srcId]) => {
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.addEventListener("click", () => {
          const el = document.getElementById(srcId);
          const text = el?.textContent || "";
          if (text && text !== "-") {
            navigator.clipboard.writeText(text).then(
              () => Swal.fire({ 
                title: "Berhasil!", 
                text: "Teks disalin ke clipboard", 
                icon: "success", 
                timer: 1500,
                showConfirmButton: false
              }),
              (err) => console.error("[berkendara.js] copy error:", err)
            );
          } else {
            Swal.fire({ 
              title: "Tidak Ada Data", 
              text: "Tidak ada data untuk disalin", 
              icon: "info", 
              timer: 1500,
              showConfirmButton: false
            });
          }
        });
      }
    });
  }

  window.addEventListener("DOMContentLoaded", async () => {
    if (await POLKU_COMMON.ensureSession()) {
      originalData = await loadJSON("data/berkendara.json");
      renderTables(originalData);
      initSearch();
      initButtons();
    }
  });
})();