const { ipcRenderer } = require("electron");

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
  showStatus(fetchStatus, "running", "Proxy toplama işlemi başlatılıyor...");
  startFetch.disabled = true;

  try {
    const result = await ipcRenderer.invoke("fetch-proxies");

    if (result.success) {
      showStatus(
        fetchStatus,
        "completed",
        `Proxy toplama işlemi tamamlandı. ${result.count} adet proxy toplandı.`
      );
    } else {
      showStatus(fetchStatus, "error", `Hata: ${result.message}`);
    }
  } catch (error) {
    showStatus(fetchStatus, "error", `Hata: ${error.message}`);
  } finally {
    startFetch.disabled = false;
  }
});

startCheck.addEventListener("click", async () => {
  showStatus(
    checkStatus,
    "running",
    "Proxy kontrol işlemi için hazırlanıyor..."
  );
  startCheck.disabled = true;
  checkProgressContainer.style.display = "none";

  try {
    // İşlem başladığını işaretle
    isCheckingProxies = true;

    // Önce proxyleri çek
    const fetchResult = await ipcRenderer.invoke("fetch-proxies");

    if (fetchResult.success) {
      showStatus(
        checkStatus,
        "running",
        `${fetchResult.count} adet proxy kontrol ediliyor...`
      );
      checkProgressContainer.style.display = "block";

      // İlerleme çubuğu sıfırla
      checkProgressBar.style.width = "0%";
      checkProgressText.textContent = `0 / ${fetchResult.count} (%0)`;

      // İlerleme durumunu güncelle
      currentCheckProgress = {
        current: 0,
        total: fetchResult.count,
        progress: 0,
      };

      // Proxy listelerini sıfırla
      validProxies = [];
      invalidProxies = [];
      updateProxyLists();

      // Proxy kontrolü başlat
      const result = await ipcRenderer.invoke(
        "check-proxies",
        fetchResult.proxies
      );

      if (result.success) {
        showStatus(
          checkStatus,
          "completed",
          `Proxy kontrol işlemi tamamlandı. ${result.result.valid} çalışan proxy bulundu.`
        );
      } else {
        showStatus(checkStatus, "error", `Hata: ${result.message}`);
      }
    } else {
      showStatus(
        checkStatus,
        "error",
        `Proxy çekme hatası: ${fetchResult.message}`
      );
    }
  } catch (error) {
    showStatus(checkStatus, "error", `Hata: ${error.message}`);
  } finally {
    startCheck.disabled = false;
    // İşlem tamamlandı işaretini koy
    isCheckingProxies = false;
  }
});

// Proxy listesi sayfası butonları
refreshListBtn.addEventListener("click", async () => {
  await loadValidProxies();
});

copyAllBtn.addEventListener("click", () => {
  if (validProxies.length === 0) {
    alert("Kopyalanacak proxy bulunamadı.");
    return;
  }

  const proxyText = validProxies.join("\n");
  navigator.clipboard
    .writeText(proxyText)
    .then(() => {
      // Kopyalama başarılı
      const originalText = copyAllBtn.innerHTML;
      copyAllBtn.innerHTML = '<i class="fas fa-check"></i> Kopyalandı!';

      setTimeout(() => {
        copyAllBtn.innerHTML = originalText;
      }, 2000);
    })
    .catch((err) => {
      console.error("Panoya kopyalarken hata:", err);
    });
});

// İlerleme durumu olayı
ipcRenderer.on("check-progress", (event, data) => {
  const percentage = data.progress;
  checkProgressBar.style.width = `${percentage}%`;
  checkProgressText.textContent = `${data.current} / ${data.total} (%${percentage})`;

  // İlerleme durumunu güncelle
  currentCheckProgress = {
    current: data.current,
    total: data.total,
    progress: percentage,
  };
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
