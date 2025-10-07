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
      sec.className = "mb-6";
      const bgColor = cat.color || "#f0f0f0";
      const textColor = cat.textColor || "#333";
      sec.innerHTML = `
        <table class="border border-gray-300">
          <thead>
            <tr style="background-color: ${bgColor}; color: ${textColor};">
              <th colspan="5" class="p-4 text-center text-lg">${cat.title || cat.id}</th>
            </tr>
            <tr style="background-color: ${bgColor}; color: ${textColor};">
              <th class="border p-2">UU</th>
              <th class="border p-2 text-center">Ceklis</th>
              <th class="border p-2">Jenis Pelanggaran</th>
              <th class="border p-2">Denda</th>
              <th class="border p-2">Hukuman</th>
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
          <td class="border p-2">${row.uu || '-'}</td>
          <td class="border p-2 text-center"><input type="checkbox" class="checkbox" data-uu="${row.uu || ''}" data-tindak="${row.tindak || ''}" data-denda="${row.denda || 0}" data-hukuman="${row.hukuman || ''}"></td>
          <td class="border p-2">${row.tindak || '-'}</td>
          <td class="border p-2">${row.denda || 0}</td>
          <td class="border p-2">${row.hukuman || '-'}</td>
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
      const filter = this.value.toLowerCase();
      document.querySelectorAll("#ber-sections tbody tr").forEach((row) => {
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
      document.getElementById("denda-summary").textContent = totalDenda.toLocaleString() || "0";
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
          if (text) {
            navigator.clipboard.writeText(text).then(
              () => Swal.fire({ title: "Berhasil!", text: "Teks disalin ke clipboard", icon: "success", timer: 1500 }),
              (err) => console.error("[berkendara.js] copy error:", err)
            );
          }
        });
      }
    });

    const openEditor = document.getElementById("openEditor");
    if (openEditor) {
      openEditor.addEventListener("click", () => {
        if (POLKU_COMMON.requireRanks(["jenderal polisi"])) {
          document.getElementById("editorModal").classList.remove("hidden");
        }
      });
    }

    const closeEditor = document.getElementById("closeEditor");
    if (closeEditor) {
      closeEditor.addEventListener("click", () => {
        document.getElementById("editorModal").classList.add("hidden");
        document.getElementById("editorForm").reset();
      });
    }

    const editorForm = document.getElementById("editorForm");
    if (editorForm) {
      editorForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const category = document.getElementById("category").value;
        const uu = document.getElementById("uu").value.trim();
        const tindak = document.getElementById("tindak").value.trim();
        const denda = parseInt(document.getElementById("denda").value, 10);
        const hukuman = document.getElementById("hukuman").value.trim();

        if (uu && tindak && !isNaN(denda) && hukuman) {
          const newRow = { uu, tindak, denda, hukuman };
          let updatedData = { ...originalData };
          const categoryIndex = updatedData.categories.findIndex(c => c.id === category);
          if (categoryIndex !== -1) {
            updatedData.categories[categoryIndex].rows.push(newRow);
          } else {
            updatedData.categories.push({
              id: category,
              title: document.getElementById("category").options[document.getElementById("category").selectedIndex].text,
              color: category === "ringan" ? "#e8f5e9" : "#fef9c3",
              textColor: category === "ringan" ? "#1b5e20" : "#713f12",
              rows: [newRow]
            });
          }
          renderTables(updatedData);
          document.getElementById("editorModal").classList.add("hidden");
          document.getElementById("editorForm").reset();
          Swal.fire({ title: "Berhasil!", text: "Data ditambahkan untuk sesi ini.", icon: "success", timer: 1500 });
        } else {
          Swal.fire({ title: "Gagal!", text: "Semua field harus diisi dengan benar.", icon: "error" });
        }
      });
    }
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
