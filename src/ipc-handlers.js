const { ipcMain } = require("electron");
const { fetchProxies, getProxyCount } = require("./proxy-scraper");
const { checkProxies } = require("./proxy-checker");

let isProcessing = false;

let processStatus = {
  running: false,
  type: null,
  progress: {
    current: 0,
    total: 0,
    progress: 0,
  },
  status: null,
  message: null,
};

function registerIpcHandlers() {
  ipcMain.handle("get-process-status", () => {
    return processStatus;
  });

  // Geçerli proxy listesini yükle
  ipcMain.handle("load-valid-proxies", async () => {
    try {
      const fs = require("fs");
      const path = require("path");
      const { formatDate } = require("./utils");

      const today = formatDate(new Date());
      const validPath = path.join(
        __dirname,
        "..",
        `${today}_valid_proxies.txt`
      );

      if (fs.existsSync(validPath)) {
        const validProxies = fs
          .readFileSync(validPath, "utf8")
          .split("\n")
          .filter((p) => p.trim());
        return {
          success: true,
          proxies: validProxies,
        };
      }

      return {
        success: true,
        proxies: [],
      };
    } catch (error) {
      console.error("Geçerli proxy listesini yüklerken hata:", error);
      return {
        success: false,
        message: error.message,
        proxies: [],
      };
    }
  });

  // Proxy çekme işlemi
  ipcMain.handle("fetch-proxies", async (event) => {
    if (isProcessing) {
      return { success: false, message: "Başka bir işlem devam ediyor." };
    }

    try {
      isProcessing = true;
      processStatus = {
        running: true,
        type: "fetch",
        progress: { current: 0, total: 0, progress: 0 },
        status: "running",
        message: "Proxy toplama işlemi başladı...",
      };

      event.sender.send("process-status", {
        type: "fetch",
        status: "running",
        message: "Proxy toplama işlemi başladı...",
      });

      const proxies = await fetchProxies();

      isProcessing = false;
      processStatus = {
        running: false,
        type: "fetch",
        progress: { current: 0, total: 0, progress: 0 },
        status: "completed",
        message: "Proxy toplama işlemi tamamlandı.",
      };

      event.sender.send("process-status", {
        type: "fetch",
        status: "completed",
        message: "Proxy toplama işlemi tamamlandı.",
      });

      return {
        success: true,
        count: proxies.length,
        proxies: proxies,
      };
    } catch (error) {
      isProcessing = false;
      processStatus = {
        running: false,
        type: "fetch",
        progress: { current: 0, total: 0, progress: 0 },
        status: "error",
        message: "Hata: " + error.message,
      };

      event.sender.send("process-status", {
        type: "fetch",
        status: "error",
        message: "Hata: " + error.message,
      });

      return {
        success: false,
        message: error.message,
      };
    }
  });

  // Proxy kontrol işlemi
  ipcMain.handle("check-proxies", async (event, proxies) => {
    if (isProcessing) {
      return { success: false, message: "Başka bir işlem devam ediyor." };
    }

    try {
      isProcessing = true;
      processStatus = {
        running: true,
        type: "check",
        progress: { current: 0, total: proxies.length, progress: 0 },
        status: "running",
        message: `${proxies.length} adet proxy kontrol ediliyor...`,
      };

      event.sender.send("process-status", {
        type: "check",
        status: "running",
        message: `${proxies.length} adet proxy kontrol ediliyor...`,
      });

      const updateProgress = (completed, total, proxyInfo) => {
        const progress = Math.floor((completed / total) * 100);

        processStatus.progress = {
          current: completed,
          total,
          progress,
        };

        event.sender.send("check-progress", {
          current: completed,
          total,
          progress,
        });

        if (proxyInfo && proxyInfo.action === "new_valid_proxy") {
          event.sender.send("proxy-checked", {
            proxy: proxyInfo.proxy,
            valid: true,
          });
        }
      };

      const result = await checkProxies(proxies, updateProgress);

      isProcessing = false;
      processStatus = {
        running: false,
        type: "check",
        progress: {
          current: proxies.length,
          total: proxies.length,
          progress: 100,
        },
        status: "completed",
        message: `Kontrol tamamlandı. ${result.valid} çalışan proxy bulundu.`,
      };

      event.sender.send("process-status", {
        type: "check",
        status: "completed",
        message: `Kontrol tamamlandı. ${result.valid} çalışan proxy bulundu.`,
      });

      return {
        success: true,
        result: result,
      };
    } catch (error) {
      console.error("Proxy kontrol hatası:", error);
      isProcessing = false;
      processStatus = {
        running: false,
        type: "check",
        progress: { current: 0, total: 0, progress: 0 },
        status: "error",
        message: "Hata: " + error.message,
      };

      event.sender.send("process-status", {
        type: "check",
        status: "error",
        message: "Hata: " + error.message,
      });

      return { success: false, message: error.message };
    }
  });

  // Proxy sayısını döndür
  ipcMain.handle("get-proxy-count", () => {
    return getProxyCount();
  });
}

registerIpcHandlers();

module.exports = {};
