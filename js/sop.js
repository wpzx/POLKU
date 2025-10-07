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
      const bgColor = cat.color || "#f0f0f0";
      const textColor = cat.textColor || "#333";
      const table = document.createElement("table");
      table.className = "border border-gray-300 mb-6";
      table.innerHTML = `
        <thead>
          <tr style="background-color: ${bgColor}; color: ${textColor};">
            <th colspan="2" class="p-4 text-center text-lg">${cat.title || cat.id}</th>
          </tr>
          <tr style="background-color: ${bgColor}; color: ${textColor};">
            <th class="border p-2 text-center">KODE</th>
            <th class="border p-2 text-center">ARTI</th>
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
          <td class="border p-2 text-center">${row.kode || '-'}</td>
          <td class="border p-2">${row.arti || '-'}</td>
        `;
        tbody.appendChild(tr);
      });
      container.appendChild(table);
    });
  }

  function initSearch() {
    const input = document.getElementById("searchInput");
    if (!input) {
      console.error("[sop.js] Search input not found");
      return;
    }
    input.addEventListener("input", function () {
      const filter = this.value.toLowerCase();
      document.querySelectorAll("#sop-sections tbody tr").forEach((row) => {
        const cells = row.getElementsByTagName("td");
        let visible = false;
        for (let i = 0; i < cells.length; i++) {
          if (cells[i].textContent.toLowerCase().includes(filter)) {
            visible = true;
            break;
          }
        }
        row.style.display = visible ? "" : "none";
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