;(() => {
  const POLKU_COMMON = window.POLKU_COMMON;

  async function loadJSON(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Gagal memuat ${url}: ${res.status} ${res.statusText}`);
      const data = await res.json();
      console.log("[sop.js] Data loaded from", url, ":", data);
      return data;
    } catch (e) {
      console.error("[sop.js] loadJSON error for", url, ":", e);
      alert(`Gagal memuat data dari ${url}. Pastikan file ada dan server berjalan. Detail: ${e.message}`);
      return { categories: [] };
    }
  }

  function renderTables(data) {
    const container = document.getElementById("sop-sections");
    if (!container) {
      console.error("[sop.js] Container 'sop-sections' not found");
      return;
    }
    container.innerHTML = "";

    if (!data || !data.categories || !Array.isArray(data.categories)) {
      console.error("[sop.js] Invalid data format:", data);
      return;
    }

    data.categories.forEach((cat) => {
      const sec = document.createElement("section");
      sec.className = "table-section";
      sec.dataset.category = cat.id;
      const bgColor = cat.color || "#15172e";
      const textColor = cat.textColor || "#ffffff";
      
      const table = document.createElement("table");
      table.innerHTML = `
        <thead>
          <tr style="background-color: ${bgColor};">
            <th colspan="2">${cat.title || cat.id}</th>
          </tr>
          <tr style="background-color: ${bgColor};">
            <th>KODE</th>
            <th>ARTI</th>
          </tr>
        </thead>
        <tbody id="${cat.id}Table"></tbody>
      `;
      
      const tbody = table.querySelector(`#${cat.id}Table`);
      if (!cat.rows || !Array.isArray(cat.rows)) {
        console.error(`[sop.js] No rows found for category ${cat.id}`);
        return;
      }
      cat.rows.forEach((row) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td style="text-align: center; font-weight: 600;">${row.kode || '-'}</td>
          <td>${row.arti || '-'}</td>
        `;
        tbody.appendChild(tr);
      });
      
      sec.appendChild(table);
      container.appendChild(sec);
    });
  }

  function initSearch() {
    const input = document.getElementById("searchInput");
    if (!input) {
      console.error("[sop.js] Search input not found");
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

  window.addEventListener("DOMContentLoaded", async () => {
    if (await POLKU_COMMON.ensureSession()) {
      const data = await loadJSON("data/sop.json");
      renderTables(data);
      initSearch();
    }
  });
})();