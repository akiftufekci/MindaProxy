const { ipcRenderer } = require("electron");
const {
  t,
  tParams,
  setLanguage,
  getCurrentLanguage,
  getAvailableLanguages,
} = require("./translations");

// Sayfa elemanları
const mainMenu = document.getElementById("main-menu");
const fetchPage = document.getElementById("fetch-proxies-page");
const checkPage = document.getElementById("check-proxies-page");
const proxyListPage = document.getElementById("proxy-list-page");
const countPage = document.getElementById("proxy-count-page");
const accountsPage = document.getElementById("accounts-page");

// Butonlar
const btnFetchProxies = document.getElementById("btn-fetch-proxies");
const btnCheckProxies = document.getElementById("btn-check-proxies");
const btnProxyList = document.getElementById("btn-proxy-list");
const btnProxyCount = document.getElementById("btn-proxy-count");
const btnAccounts = document.getElementById("btn-accounts");

// İşlem başlatma butonları
const startFetch = document.getElementById("start-fetch");
const startCheck = document.getElementById("start-check");
const refreshListBtn = document.getElementById("refresh-list");
const copyAllBtn = document.getElementById("copy-all");

// Durum ve ilerleme elemanları
const fetchStatus = document.getElementById("fetch-status");
const checkStatus = document.getElementById("check-status");
const checkProgressContainer = document.getElementById(
  "check-progress-container"
);
const checkProgressBar = document.getElementById("check-progress-bar");
const checkProgressText = document.getElementById("check-progress-text");
const proxyCountValue = document.getElementById("proxy-count-value");

// Proxy listeleri elemanları
const validProxyList = document.getElementById("valid-proxy-list");
const invalidProxyList = document.getElementById("invalid-proxy-list");
const validProxyCount = document.getElementById("valid-proxy-count");
const invalidProxyCount = document.getElementById("invalid-proxy-count");

// Nav elemanları
const navItems = document.querySelectorAll(".nav-item");

// Proxy listelerini saklayan değişkenler
let validProxies = [];
let invalidProxies = [];

// İşlem durumunu takip etmek için değişkenler
let isCheckingProxies = false;
let currentCheckProgress = {
  current: 0,
  total: 0,
  progress: 0,
};
let lastCheckStatus = null;

// Dil seçimi butonları
const languageButtons = document.querySelectorAll(".language-btn");

// Çeviri gereken elemanlar
const translationElements = [
  { elem: document.querySelector("title"), key: "appTitle" },
  { elem: document.querySelector(".header p"), key: "appDescription" },
  {
    elem: document.querySelector("#btn-fetch-proxies span"),
    key: "navbar.fetchProxies",
  },
  {
    elem: document.querySelector("#btn-check-proxies span"),
    key: "navbar.checkProxies",
  },
  {
    elem: document.querySelector("#btn-proxy-list span"),
    key: "navbar.proxyList",
  },
  {
    elem: document.querySelector("#btn-proxy-count span"),
    key: "navbar.proxyCount",
  },
  {
    elem: document.querySelector("#btn-accounts span"),
    key: "navbar.accounts",
  },
  {
    elem: document.querySelector("#fetch-proxies-page .card-title"),
    key: "fetchPage.title",
  },
  {
    elem: document.querySelector("#fetch-proxies-page .card-subtitle"),
    key: "fetchPage.subtitle",
  },
  {
    elem: document.querySelector(".api-sources .section-title"),
    key: "fetchPage.apiSources",
  },
  {
    elem: document.querySelector("#start-fetch"),
    key: "fetchPage.startButton",
  },
  {
    elem: document.querySelector("#check-proxies-page .card-title"),
    key: "checkPage.title",
  },
  {
    elem: document.querySelector("#check-proxies-page .card-subtitle"),
    key: "checkPage.subtitle",
  },
  {
    elem: document.querySelector("#start-check"),
    key: "checkPage.startButton",
  },
  {
    elem: document.querySelector("#proxy-list-page .card-title"),
    key: "proxyListPage.title",
  },
  {
    elem: document.querySelector("#proxy-list-page .card-subtitle"),
    key: "proxyListPage.subtitle",
  },
  {
    elem: document.querySelector(".proxy-list-container .section-title"),
    key: "proxyListPage.validProxies",
  },
  {
    elem: document.querySelector(".no-proxy-message"),
    key: "proxyListPage.noProxies",
  },
  {
    elem: document.querySelector("#refresh-list"),
    key: "proxyListPage.refreshButton",
  },
  {
    elem: document.querySelector("#copy-all"),
    key: "proxyListPage.copyButton",
  },
  {
    elem: document.querySelector("#proxy-count-page .card-title"),
    key: "proxyCountPage.title",
  },
  {
    elem: document.querySelector("#proxy-count-page .card-subtitle"),
    key: "proxyCountPage.subtitle",
  },
  {
    elem: document.querySelector(".stat-title"),
    key: "proxyCountPage.totalProxyCount",
  },
  {
    elem: document.querySelector("#accounts-page .card-title"),
    key: "accountsPage.title",
  },
  {
    elem: document.querySelector("#accounts-page .card-subtitle"),
    key: "accountsPage.subtitle",
  },
];

// Tüm sayfaları gizleme fonksiyonu
function hideAllPages() {
  mainMenu.style.display = "none";
  fetchPage.style.display = "none";
  checkPage.style.display = "none";
  proxyListPage.style.display = "none";
  countPage.style.display = "none";
  accountsPage.style.display = "none";
}

// Durum mesajı gösterme fonksiyonu
function showStatus(element, status, message) {
  element.innerHTML = message;
  element.className = `status status-${status}`;
  element.style.display = "block";

  // Eğer kontrol işlemi için durumu güncelliyorsak, son durumu saklayalım
  if (element === checkStatus) {
    lastCheckStatus = {
      status,
      message,
    };
  }
}

// Active class'ını güncelle
function updateActiveNavItem(activeItem) {
  navItems.forEach((item) => {
    item.classList.remove("active");
  });
  activeItem.classList.add("active");
}

// Proxy listelerini güncelle
function updateProxyLists() {
  // Geçerli proxyleri güncelle
  if (validProxies.length === 0) {
    validProxyList.innerHTML =
      '<div class="no-proxy-message">Henüz çalışan proxy bulunamadı.</div>';
  } else {
    let validHtml = "";
    validProxies.forEach((proxy) => {
      validHtml += `<div class="proxy-item">${proxy}</div>`;
    });
    validProxyList.innerHTML = validHtml;
  }

  // Sayaçları güncelle
  validProxyCount.textContent = validProxies.length;
}

// Geçerli proxy'leri yükle (dosyadan)
async function loadValidProxies() {
  try {
    // Geçerli proxyleri yükle
    const result = await ipcRenderer.invoke("load-valid-proxies");

    if (result.success) {
      validProxies = result.proxies;
      updateProxyLists();
    }
  } catch (error) {
    console.error("Proxy listesini yüklerken hata:", error);
  }
}

// Menü buton olayları
btnFetchProxies.addEventListener("click", () => {
  hideAllPages();
  updateActiveNavItem(btnFetchProxies);
  fetchPage.style.display = "block";
  fetchStatus.style.display = "none";
});

btnCheckProxies.addEventListener("click", async () => {
  hideAllPages();
  updateActiveNavItem(btnCheckProxies);
  checkPage.style.display = "block";

  // İşlem durumunu kontrol et
  await checkProcessStatus();

  // Eğer kontrol işlemi devam ediyorsa, ilerleme çubuğunu göster
  if (isCheckingProxies) {
    // Son durumu göster
    if (lastCheckStatus) {
      checkStatus.innerHTML = lastCheckStatus.message;
      checkStatus.className = `status status-${lastCheckStatus.status}`;
      checkStatus.style.display = "block";
    }

    // İlerleme çubuğunu göster ve güncelle
    checkProgressContainer.style.display = "block";
    checkProgressBar.style.width = `${currentCheckProgress.progress}%`;
    checkProgressText.textContent = `${currentCheckProgress.current} / ${currentCheckProgress.total} (%${currentCheckProgress.progress})`;
  } else {
    // Kontrol işlemi yoksa ilerleme çubuğunu ve durum mesajını gizle
    checkStatus.style.display = "none";
    checkProgressContainer.style.display = "none";
  }
});

btnProxyList.addEventListener("click", async () => {
  hideAllPages();
  updateActiveNavItem(btnProxyList);
  proxyListPage.style.display = "block";

  // Proxy listesini yükle
  await loadValidProxies();
});

btnProxyCount.addEventListener("click", async () => {
  hideAllPages();
  updateActiveNavItem(btnProxyCount);
  countPage.style.display = "block";

  const count = await ipcRenderer.invoke("get-proxy-count");
  proxyCountValue.textContent = count;
});

btnAccounts.addEventListener("click", () => {
  hideAllPages();
  updateActiveNavItem(btnAccounts);
  accountsPage.style.display = "block";
});

// İşlem başlatma butonları
startFetch.addEventListener("click", async () => {
  showStatus(fetchStatus, "running", t("fetchPage.statusRunning"));
  startFetch.disabled = true;

  try {
    const result = await ipcRenderer.invoke("fetch-proxies");

    if (result.success) {
      showStatus(
        fetchStatus,
        "completed",
        tParams("fetchPage.statusCompleted", { count: result.count })
      );
    } else {
      showStatus(
        fetchStatus,
        "error",
        tParams("fetchPage.statusError", { message: result.message })
      );
    }
  } catch (error) {
    showStatus(
      fetchStatus,
      "error",
      tParams("fetchPage.statusError", { message: error.message })
    );
  }

  startFetch.disabled = false;
});

// Proxy kontrol işlemi başlatma butonu
startCheck.addEventListener("click", async () => {
  try {
    // Önce proxyleri al
    const date = new Date();
    const formatDate = (date) => {
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      return `${day}_${month}_${year}`;
    };
    const today = formatDate(date);
    const fs = require("fs");
    const path = require("path");
    const proxiesPath = path.join(__dirname, "..", `${today}_proxies.txt`);

    if (!fs.existsSync(proxiesPath)) {
      showStatus(
        checkStatus,
        "error",
        tParams("checkPage.statusError", {
          message: t("checkPage.noProxiesFound"),
        })
      );
      return;
    }

    const proxyData = fs.readFileSync(proxiesPath, "utf8");
    const proxies = proxyData.split("\n").filter((p) => p.trim());

    if (proxies.length === 0) {
      showStatus(
        checkStatus,
        "error",
        tParams("checkPage.statusError", {
          message: t("checkPage.noProxiesFound"),
        })
      );
      return;
    }

    // Kontrol işlemini başlat
    showStatus(
      checkStatus,
      "running",
      tParams("checkPage.statusRunning", { count: proxies.length })
    );
    startCheck.disabled = true;
    checkProgressContainer.style.display = "block";
    checkProgressBar.style.width = "0%";
    checkProgressText.textContent = tParams("checkPage.progressText", {
      current: 0,
      total: proxies.length,
      progress: 0,
    });

    // Kontrol işlemini başlat
    const result = await ipcRenderer.invoke("check-proxies", proxies);

    if (result.success) {
      showStatus(
        checkStatus,
        "completed",
        tParams("checkPage.statusCompleted", {
          validCount: result.result.valid,
        })
      );
      await loadValidProxies();
    } else {
      showStatus(
        checkStatus,
        "error",
        tParams("checkPage.statusError", { message: result.message })
      );
    }
  } catch (error) {
    showStatus(
      checkStatus,
      "error",
      tParams("checkPage.statusError", { message: error.message })
    );
  } finally {
    startCheck.disabled = false;
  }
});

// Proxy listesi sayfası butonları
refreshListBtn.addEventListener("click", async () => {
  await loadValidProxies();
});

// Kopyalama butonu
copyAllBtn.addEventListener("click", () => {
  if (validProxies.length > 0) {
    const text = validProxies.join("\n");
    navigator.clipboard.writeText(text).then(() => {
      const originalText = copyAllBtn.innerHTML;
      copyAllBtn.innerHTML = `<i class="fas fa-check"></i> ${t(
        "proxyListPage.copiedMessage"
      )}`;
      setTimeout(() => {
        copyAllBtn.innerHTML = originalText;
      }, 2000);
    });
  }
});

// İlerleme güncelleme eventi
ipcRenderer.on("check-progress", (event, data) => {
  currentCheckProgress = data;
  checkProgressBar.style.width = `${data.progress}%`;
  checkProgressText.textContent = tParams("checkPage.progressText", {
    current: data.current,
    total: data.total,
    progress: data.progress,
  });
});

// Durum mesajı olayı
ipcRenderer.on("process-status", (event, data) => {
  const statusElement = data.type === "fetch" ? fetchStatus : checkStatus;
  showStatus(statusElement, data.status, data.message);

  // Eğer işlem tamamlandıysa işlem durumunu güncelle
  if (data.status === "completed" || data.status === "error") {
    isCheckingProxies = false;
  }
});

// Proxy durumlarını dinle
ipcRenderer.on("proxy-checked", (event, data) => {
  if (data.valid) {
    // Çalışan proxyler listesine eklenecek ve anında gösterilecek
    if (!validProxies.includes(data.proxy)) {
      validProxies.push(data.proxy);
      updateProxyLists();
    }
  }
  // Çalışmayan proxyler artık işlenmeyecek ve gösterilmeyecek
});

// Sayfa yüklendiğinde ana menüyü göster ve ilk nav item'ı active yap
window.addEventListener("DOMContentLoaded", async () => {
  hideAllPages();
  mainMenu.style.display = "block";
  updateActiveNavItem(navItems[0]); // İlk nav item'ı active yap

  // Sayfa yüklendiğinde işlem durumunu kontrol et
  await checkProcessStatus();
});

// İşlem durumunu kontrol et ve gerekli güncellemeyi yap
async function checkProcessStatus() {
  try {
    const status = await ipcRenderer.invoke("get-process-status");

    if (status.running) {
      // Devam eden bir işlem varsa
      if (status.type === "check") {
        // Eğer proxy kontrolü devam ediyorsa
        isCheckingProxies = true;
        lastCheckStatus = {
          status: status.status,
          message: status.message,
        };
        currentCheckProgress = status.progress;

        // Eğer şu an proxy kontrol sayfasındaysak, UI'ı güncelle
        if (checkPage.style.display === "block") {
          checkStatus.innerHTML = status.message;
          checkStatus.className = `status status-${status.status}`;
          checkStatus.style.display = "block";

          checkProgressContainer.style.display = "block";
          checkProgressBar.style.width = `${status.progress.progress}%`;
          checkProgressText.textContent = `${status.progress.current} / ${status.progress.total} (%${status.progress.progress})`;
        }
      }
    }
  } catch (error) {
    console.error("İşlem durumu kontrolü sırasında hata:", error);
  }
}

// Dil değiştirme fonksiyonu
function changeLanguage(lang) {
  if (setLanguage(lang)) {
    // Dil butonlarının active durumunu güncelle
    languageButtons.forEach((btn) => {
      if (btn.dataset.lang === lang) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    // Tüm metinleri güncelle
    updateAllTexts();

    // Mevcut dili localStorage'a kaydet
    localStorage.setItem("language", lang);
  }
}

// Tüm metinleri güncelleme fonksiyonu
function updateAllTexts() {
  translationElements.forEach((item) => {
    if (item.elem) {
      if (item.elem.tagName === "BUTTON") {
        // İkona dokunmadan butona metin ekle
        const icon = item.elem.querySelector("i");
        item.elem.innerHTML = "";
        if (icon) {
          item.elem.appendChild(icon);
        }
        item.elem.insertAdjacentText("beforeend", " " + t(item.key));
      } else {
        item.elem.textContent = t(item.key);
      }
    }
  });
}

// Sayfa yüklendiğinde
document.addEventListener("DOMContentLoaded", () => {
  // Kaydedilmiş dili kontrol et
  const savedLanguage = localStorage.getItem("language");
  if (savedLanguage && getAvailableLanguages().includes(savedLanguage)) {
    changeLanguage(savedLanguage);
  }

  // Dil değiştirme olayları
  languageButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      changeLanguage(btn.dataset.lang);
    });
  });

  // İlk metin güncellemesi
  updateAllTexts();
});
