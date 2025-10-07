;(() => {
  const Swal = window.Swal;
  const POLKU_COMMON = window.POLKU_COMMON;

  // Webhook URLs - Ganti dengan webhook Discord Anda
  const WEBHOOKS = {
    federal: "MASUKKAN_WEBHOOK_FEDERAL_DISINI",
    kantorPusat: "MASUKKAN_WEBHOOK_KANTOR_PUSAT_DISINI"
  };

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
              <th>Pasal (Ayat)</th>
              <th>Ceklis</th>
              <th>Pelanggaran</th>
              <th>Denda</th>
              <th>Massa Tahanan</th>
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
          <td>${row.uu || '-'}</td>
          <td style="text-align: center;"><input type="checkbox" class="checkbox" data-uu="${row.uu || ''}" data-tindak="${row.tindak || ''}" data-denda="${row.denda || 0}" data-penjara="${penjara || ''}"></td>
          <td>${row.tindak || '-'}</td>
          <td>$${(row.denda || 0).toLocaleString()}</td>
          <td>${penjara || '-'}</td>
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
      document.getElementById("denda-summary").textContent = `$${currentSummaryData.dendaFormatted}`;
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
        
        // Check webhook configuration
        const webhookUrl = currentSummaryData.lokasi === "Federal" ? WEBHOOKS.federal : WEBHOOKS.kantorPusat;
        if (webhookUrl.includes("MASUKKAN_WEBHOOK")) {
          Swal.fire({
            icon: "error",
            title: "Webhook Belum Dikonfigurasi",
            html: `Webhook untuk <strong>${currentSummaryData.lokasi}</strong> belum diatur.<br>Silakan hubungi administrator untuk mengkonfigurasi webhook Discord.`,
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
        
        const tersangkaName = document.getElementById("tersangkaName").value.trim();
        const petugasName = sessionStorage.getItem("username") || "Tidak Diketahui";
        const petugasRank = sessionStorage.getItem("rank") || "-";
        const petugasDivision = sessionStorage.getItem("division") || "-";

        if (!tersangkaName) {
          Swal.fire({
            icon: "error",
            title: "Data Tidak Lengkap",
            text: "Mohon isi nama tersangka",
          });
          return;
        }

        // Determine webhook based on location
        const webhookUrl = currentSummaryData.lokasi === "Federal" ? WEBHOOKS.federal : WEBHOOKS.kantorPusat;
        const embedColor = currentSummaryData.lokasi === "Federal" ? 15158332 : 3447003; // Red for Federal, Blue for Kantor Pusat

        // Create Discord embed
        const embed = {
          title: "📋 Laporan Tindak Pidana - Polisi Kuyland",
          color: embedColor,
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
              value: `**${petugasName}**\n${petugasRank}\n${petugasDivision}`,
              inline: false
            }
          ],
          footer: {
            text: "Polisi Kuyland Roleplay - Automated Report System"
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

          if (response.ok || response.status === 204) {
            Swal.fire({
              icon: "success",
              title: "Berhasil!",
              html: `Laporan berhasil dikirim ke Discord<br><strong>${currentSummaryData.lokasi}</strong>`,
              timer: 2500,
              showConfirmButton: false
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
            text: "Terjadi kesalahan saat mengirim ke Discord. Periksa konfigurasi webhook.",
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
              () => Swal.fire({ 
                title: "Berhasil!", 
                text: "Teks disalin ke clipboard", 
                icon: "success", 
                timer: 1500,
                showConfirmButton: false
              }),
              (err) => console.error("[undang.js] copy error:", err)
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
      originalData = await loadJSON("data/undang.json");
      renderTables(originalData);
      initSearch();
      initButtons();
      initDiscordModal();
    }
  });
})();