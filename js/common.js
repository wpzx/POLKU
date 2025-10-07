;(() => {
  async function loadUsers() {
    try {
      const res = await fetch("data/default-users.json");
      if (!res.ok) throw new Error(`Gagal memuat data/default-users.json: ${res.status} ${res.statusText}`);
      const data = await res.json();
      console.log("[common.js] Users data loaded:", data);
      return data;
    } catch (e) {
      console.error("[common.js] loadUsers error:", e);
      alert("Gagal memuat data pengguna. Pastikan file 'data/default-users.json' ada dan server berjalan.");
      return [];
    }
  }

  async function ensureSession() {
    const username = sessionStorage.getItem("username");
    const rank = sessionStorage.getItem("rank");
    const division = sessionStorage.getItem("division");
    
    console.log("[common.js] Session check:", { username, rank, division });
    
    if (!username || !rank || !division) {
      console.log("[common.js] Session tidak lengkap, redirect ke login");
      alert("Sesi tidak valid. Silakan login kembali.");
      window.location.href = "index.html";
      return false;
    }

    // Update user name di navbar
    const userNameEl = document.getElementById("user-name");
    if (userNameEl) {
      userNameEl.textContent = username;
      console.log("[common.js] Username di navbar diupdate:", username);
    }

    return true;
  }

  function initNavbar() {
    const userInfo = document.getElementById("user-info");
    const profileMenu = document.getElementById("profile-menu");
    const openProfile = document.getElementById("openProfile");
    const closeProfile = document.getElementById("closeProfile");
    const profileModal = document.getElementById("profileModal");

    // Dropdown user menu
    if (userInfo && profileMenu) {
      userInfo.addEventListener("click", (e) => {
        e.stopPropagation();
        profileMenu.style.display = profileMenu.style.display === "block" ? "none" : "block";
      });
    }

    // Dropdown layanan
    const dropdowns = document.querySelectorAll(".nav-item.dropdown");
    dropdowns.forEach(dropdown => {
      const button = dropdown.querySelector(".nav-link");
      const content = dropdown.querySelector(".dropdown-content");
      
      if (button && content) {
        button.addEventListener("click", (e) => {
          e.stopPropagation();
          content.style.display = content.style.display === "block" ? "none" : "block";
        });
      }
    });

    // Close dropdown saat klik di luar
    document.addEventListener("click", (e) => {
      if (profileMenu && userInfo && !userInfo.contains(e.target)) {
        profileMenu.style.display = "none";
      }
      
      dropdowns.forEach(dropdown => {
        const button = dropdown.querySelector(".nav-link");
        const content = dropdown.querySelector(".dropdown-content");
        if (content && button && !dropdown.contains(e.target)) {
          content.style.display = "none";
        }
      });
    });

    // Open profile modal
    if (openProfile && profileModal) {
      openProfile.addEventListener("click", (e) => {
        e.preventDefault();
        const username = sessionStorage.getItem("username") || "Nama Polisi";
        const rank = sessionStorage.getItem("rank") || "-";
        const division = sessionStorage.getItem("division") || "-";
        
        console.log("[common.js] Opening profile:", { username, rank, division });
        
        const namaEl = document.getElementById("petugasNama");
        const jabatanEl = document.getElementById("petugasJabatan");
        const divisiEl = document.getElementById("petugasDivisi");
        
        if (namaEl) namaEl.textContent = username;
        if (jabatanEl) jabatanEl.textContent = rank;
        if (divisiEl) divisiEl.textContent = division;
        
        profileModal.classList.add("show");
      });
    }

    // Close profile modal
    if (closeProfile && profileModal) {
      closeProfile.addEventListener("click", () => {
        profileModal.classList.remove("show");
      });
      
      // Close saat klik di luar modal
      profileModal.addEventListener("click", (e) => {
        if (e.target === profileModal) {
          profileModal.classList.remove("show");
        }
      });
    }
  }

  function requireRanks(allowedRanks = []) {
    const rank = (sessionStorage.getItem("rank") || "").toLowerCase().trim();
    const norm = (s) => (s || "").toLowerCase().trim();
    const isAllowed = allowedRanks.map(norm).includes(rank);
    if (!isAllowed) {
      alert("Akses ditolak. Anda tidak memiliki izin untuk aksi ini.");
      return false;
    }
    return true;
  }

  window.POLKU_COMMON = {
    ensureSession,
    initNavbar,
    requireRanks,
  };

  window.addEventListener("DOMContentLoaded", () => {
    console.log("[common.js] DOM loaded, initializing navbar...");
    initNavbar();
  });
})();
