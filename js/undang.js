;(() => {
  const Swal = window.Swal;
  const POLKU_COMMON = window.POLKU_COMMON;

  async function loadJSON(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Gagal memuat ${url}: ${res.status} ${res.statusText}`);
      const data = await res.json();
      console.log("[undang.js] Data loaded from", url, ":", data);
      return data;
    } catch (e) {
      console.error("[undang.js] loadJSON error for", url, ":", e);
      alert(`Gagal memuat data dari ${url}. Pastikan file ada dan server berjalan. Detail: ${e.message}`);
      return { categories: [] };
    }
  }

  let originalData = null;
  let currentSummaryData = null;

  function renderTables(data) {
    const container = document.getElementById("uud-sections");
    if (!container) {
      console.error("[undang.js] Container 'uud-sections' not found");
      return;
    }
    container.innerHTML = "";

    if (!data || !data.categories || !Array.isArray(data.categories)) {
      console.error("[undang.js] Invalid data format:", data);
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
              <th colspan="6" class="p-4 text-center text-lg">${cat.title || cat.id}</th>
            </tr>
            <tr style="background-color: ${bgColor}; color: ${textColor};">
              <th class="border p-2">Pasal (Ayat)</th>
              <th class="border p-2 text-center">Ceklis</th>
              <th class="border p-2">Pelanggaran</th>
              <th class="border p-2">Denda</th>
              <th class="border p-2">Massa Tahanan</th>
            </tr>
          </thead>
          <tbody id="${cat.id}Table"></tbody>
        </table>
      `;
      container.appendChild(sec);

      const tbody = sec.querySelector(`#${cat.id}Table`);
      if (!cat.rows || !Array.isArray(cat.rows)) {
        console.error(`[undang.js] No rows found for category ${cat.id}`);
        return;
      }
      cat.rows.forEach((row) => {
        const tr = document.createElement("tr");
        const penjara = typeof row.penjara === "number" ? `${row.penjara} Bulan` : row.penjara;
        tr.innerHTML = `
          <td class="border p-2">${row.uu || '-'}</td>
          <td class="border p-2 text-center"><input type="checkbox" class="checkbox" data-uu="${row.uu || ''}" data-tindak="${row.tindak || ''}" data-denda="${row.denda || 0}" data-penjara="${penjara || ''}"></td>
          <td class="border p-2">${row.tindak || '-'}</td>
          <td class="border p-2">${(row.denda || 0).toLocaleString()}</td>
          <td class="border p-2">${penjara || '-'}</td>
        `;
        tbody.appendChild(tr);
      });
    });
  }

  function initSearch() {
    const input = document.getElementById("searchInput");
    if (!input) {
      console.error("[undang.js] Search input not found");
      return;
    }
    input.addEventListener("input", function () {
      const filter = this.value.toLowerCase();
      document.querySelectorAll("#uud-sections tbody tr").forEach((row) => {
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
    let totalDenda = 0;
    let totalPenjara = 0;
    let hasHukumanMati = false;

    checkboxes.forEach((cb) => {
      uuSummary.push(cb.dataset.uu);
      tindakSummary.push(cb.dataset.tindak);
      const denda = Number.parseInt(cb.dataset.denda, 10) || 0;
      totalDenda += denda;
      
      const penjaraText = cb.dataset.penjara.toLowerCase().trim();
      if (penjaraText === "hukuman mati") {
        hasHukumanMati = true;
      } else {
        const bulan = Number.parseInt(penjaraText, 10) || 0;
        totalPenjara += bulan;
      }
    });

    const penjaraSummaryText = hasHukumanMati ? "Hukuman Mati" : `${totalPenjara} Bulan`;
    const lokasiText = (hasHukumanMati || totalPenjara > 60) ? "Federal" : "Kantor Pusat";

    // Store for Discord
    currentSummaryData = {
      uu: uuSummary.join(", ") || "-",
      tindak: tindakSummary.join(", ") || "-",
      denda: totalDenda,
      dendaFormatted: totalDenda.toLocaleString() || "0",
      penjara: penjaraSummaryText,
      lokasi: lokasiText
    };

    const table = document.getElementById("summary-table");
    if (checkboxes.length > 0) {
      table.classList.remove("hidden");
      document.getElementById("uu-summary").textContent = currentSummaryData.uu;
      document.getElementById("tindak-summary").textContent = currentSummaryData.tindak;
      document.getElementById("denda-summary").textContent = currentSummaryData.dendaFormatted;
      document.getElementById("penjara-summary").textContent = currentSummaryData.penjara;
      document.getElementById("lokasi-summary").textContent = currentSummaryData.lokasi;
    } else {
      table.classList.add("hidden");
      currentSummaryData = null;
    }
  }

  function initDiscordModal() {
    const kirimDiscordBtn = document.getElementById("kirim-discord");
    const discordModal = document.getElementById("discordModal");
    const closeDiscord = document.getElementById("closeDiscord");
    const discordForm = document.getElementById("discordForm");

    if (kirimDiscordBtn) {
      kirimDiscordBtn.addEventListener("click", () => {
        if (!currentSummaryData) {
          Swal.fire({
            icon: "warning",
            title: "Tidak Ada Data",
            text: "Silakan pilih pelanggaran terlebih dahulu dan klik Submit",
          });
          return;
        }
        discordModal.classList.add("show");
      });
    }

    if (closeDiscord) {
      closeDiscord.addEventListener("click", () => {
        discordModal.classList.remove("show");
      });
    }

    if (discordModal) {
      discordModal.addEventListener("click", (e) => {
        if (e.target === discordModal) {
          discordModal.classList.remove("show");
        }
      });
    }

    if (discordForm) {
      discordForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const webhookUrl = document.getElementById("webhookUrl").value.trim();
        const tersangkaName = document.getElementById("tersangkaName").value.trim();
        const petugasName = sessionStorage.getItem("username") || "Tidak Diketahui";
        const petugasRank = sessionStorage.getItem("rank") || "-";

        if (!webhookUrl || !tersangkaName) {
          Swal.fire({
            icon: "error",
            title: "Data Tidak Lengkap",
            text: "Mohon isi semua field yang diperlukan",
          });
          return;
        }

        // Create Discord embed
        const embed = {
          title: "📋 Laporan Tindak Pidana - Polisi Kuyland",
          color: 3447003, // Blue color
          fields: [
            {
              name: "👤 Nama Tersangka",
              value: tersangkaName,
              inline: false
            },
            {
              name: "📜 Pasal (UU)",
              value: currentSummaryData.uu,
              inline: false
            },
            {
              name: "⚖️ Tindak Pidana",
              value: currentSummaryData.tindak,
              inline: false
            },
            {
              name: "💰 Total Denda",
              value: `$${currentSummaryData.dendaFormatted}`,
              inline: true
            },
            {
              name: "⏱️ Masa Tahanan",
              value: currentSummaryData.penjara,
              inline: true
            },
            {
              name: "🏛️ Lokasi Penahanan",
              value: currentSummaryData.lokasi,
              inline: true
            },
            {
              name: "👮 Petugas Yang Menangani",
              value: `${petugasName}\n${petugasRank}`,
              inline: false
            }
          ],
          footer: {
            text: "Polisi Kuyland Roleplay - System Report"
          },
          timestamp: new Date().toISOString()
        };

        try {
          const response = await fetch(webhookUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              embeds: [embed]
            }),
          });

          if (response.ok) {
            Swal.fire({
              icon: "success",
              title: "Berhasil!",
              text: "Laporan berhasil dikirim ke Discord",
              timer: 2000
            });
            discordModal.classList.remove("show");
            discordForm.reset();
          } else {
            throw new Error(`HTTP ${response.status}`);
          }
        } catch (error) {
          console.error("[undang.js] Discord webhook error:", error);
          Swal.fire({
            icon: "error",
            title: "Gagal Mengirim",
            text: "Terjadi kesalahan saat mengirim ke Discord. Periksa webhook URL Anda.",
          });
        }
      });
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
        currentSummaryData = null;
        ["uu", "tindak", "denda", "penjara", "lokasi"].forEach((k) => {
          const el = document.getElementById(`${k}-summary`);
          if (el) el.textContent = "";
        });
      });
    }

    const copyMap = {
      "copy-uu": "uu-summary",
      "copy-tindak": "tindak-summary",
      "copy-denda": "denda-summary",
      "copy-penjara": "penjara-summary",
      "copy-lokasi": "lokasi-summary",
    };
    Object.entries(copyMap).forEach(([btnId, srcId]) => {
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.addEventListener("click", () => {
          const el = document.getElementById(srcId);
          const text = el?.textContent || "";
          if (text && text !== "-") {
            navigator.clipboard.writeText(text).then(
              () => Swal.fire({ title: "Berhasil!", text: "Teks disalin ke clipboard", icon: "success", timer: 1500 }),
              (err) => console.error("[undang.js] copy error:", err)
            );
          } else {
            Swal.fire({ title: "Tidak Ada Data", text: "Tidak ada data untuk disalin", icon: "info", timer: 1500 });
          }
        });
      }
    });
  }

  window.addEventListener("DOMContentLoaded", async () => {
    if (await POLKU_COMMON.ensureSession()) {
      originalData = await loadJSON("data/undang.json");
      renderTables(originalData);
      initSearch();
      initButtons();
      initDiscordModal();
    }
  });
})();