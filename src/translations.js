const translations = {
  tr: {
    appTitle: "MindaProxy - Proxy Aracı",
    appDescription: "Proxy Çekme ve Kontrol Aracı",
    navbar: {
      fetchProxies: "Proxy Çek",
      checkProxies: "Proxy Kontrol",
      proxyList: "Proxy Listesi",
      proxyCount: "Toplam Proxy",
      accounts: "Hesaplarımız",
    },
    fetchPage: {
      title: "Proxy Çekme",
      subtitle: "Çeşitli API kaynaklarından proxy listesi topla",
      apiSources: "API Kaynakları",
      startButton: "Başlat",
      statusRunning: "Proxy toplama işlemi başlatılıyor...",
      statusCompleted:
        "Proxy toplama işlemi tamamlandı. {count} adet proxy toplandı.",
      statusError: "Hata: {message}",
    },
    checkPage: {
      title: "Proxy Kontrol",
      subtitle:
        "Proxy listesini kontrol et ve çalışan proxyler listesini oluştur",
      startButton: "Başlat",
      statusRunning: "{count} adet proxy kontrol ediliyor...",
      statusCompleted:
        "Kontrol tamamlandı. {validCount} çalışan proxy bulundu.",
      statusError: "Hata: {message}",
      progressText: "{current} / {total} (%{progress})",
      noProxiesFound: "Kontrol edilecek proxy bulunamadı.",
    },
    proxyListPage: {
      title: "Proxy Listesi",
      subtitle: "Çalışan proxy'lerin listesi",
      validProxies: "Çalışan Proxyler",
      noProxies: "Henüz çalışan proxy bulunamadı.",
      refreshButton: "Listeyi Yenile",
      copyButton: "Tümünü Kopyala",
      copiedMessage: "Proxy listesi kopyalandı!",
    },
    proxyCountPage: {
      title: "Toplam Proxy",
      subtitle: "Günlük toplanan proxy istatistikleri",
      totalProxyCount: "Toplam Proxy Sayısı",
    },
    accountsPage: {
      title: "Hesaplarımız",
      subtitle: "İletişim ve sosyal medya hesaplarımız",
    },
    errors: {
      proxyApiError: "Proxy API hatası: {url} - {error}",
      proxyCollectionError: "Proxy toplama hatası: {error}",
      proxyCountError: "Proxy sayısı hatası: {error}",
    },
  },
  en: {
    appTitle: "MindaProxy - Proxy Tool",
    appDescription: "Proxy Fetching and Checking Tool",
    navbar: {
      fetchProxies: "Fetch Proxies",
      checkProxies: "Check Proxies",
      proxyList: "Proxy List",
      proxyCount: "Total Proxies",
      accounts: "Our Accounts",
    },
    fetchPage: {
      title: "Fetch Proxies",
      subtitle: "Collect proxy list from various API sources",
      apiSources: "API Sources",
      startButton: "Start",
      statusRunning: "Starting proxy collection process...",
      statusCompleted: "Proxy collection completed. {count} proxies collected.",
      statusError: "Error: {message}",
    },
    checkPage: {
      title: "Check Proxies",
      subtitle: "Check proxy list and create a list of working proxies",
      startButton: "Start",
      statusRunning: "Checking {count} proxies...",
      statusCompleted: "Check completed. Found {validCount} working proxies.",
      statusError: "Error: {message}",
      progressText: "{current} / {total} ({progress}%)",
      noProxiesFound: "No proxies found to check.",
    },
    proxyListPage: {
      title: "Proxy List",
      subtitle: "List of working proxies",
      validProxies: "Working Proxies",
      noProxies: "No working proxies found yet.",
      refreshButton: "Refresh List",
      copyButton: "Copy All",
      copiedMessage: "Proxy list copied!",
    },
    proxyCountPage: {
      title: "Total Proxies",
      subtitle: "Daily collected proxy statistics",
      totalProxyCount: "Total Proxy Count",
    },
    accountsPage: {
      title: "Our Accounts",
      subtitle: "Contact and social media accounts",
    },
    errors: {
      proxyApiError: "Proxy API error: {url} - {error}",
      proxyCollectionError: "Proxy collection error: {error}",
      proxyCountError: "Proxy count error: {error}",
    },
  },
};

// Varsayılan dil
let currentLanguage = "tr";

// Dil değiştirme fonksiyonu
function setLanguage(lang) {
  if (translations[lang]) {
    currentLanguage = lang;
    return true;
  }
  return false;
}

// Çeviri alma fonksiyonu
function t(key) {
  const keys = key.split(".");
  let result = translations[currentLanguage];

  for (const k of keys) {
    if (result && result[k]) {
      result = result[k];
    } else {
      return key; // Çeviri bulunamadı, anahtarı döndür
    }
  }

  return result;
}

// Parametreli çeviri alma fonksiyonu
function tParams(key, params) {
  let text = t(key);

  if (typeof text === "string" && params) {
    Object.keys(params).forEach((param) => {
      text = text.replace(`{${param}}`, params[param]);
    });
  }

  return text;
}

// Mevcut dili döndüren fonksiyon
function getCurrentLanguage() {
  return currentLanguage;
}

// Mevcut dilleri döndüren fonksiyon
function getAvailableLanguages() {
  return Object.keys(translations);
}

module.exports = {
  t,
  tParams,
  setLanguage,
  getCurrentLanguage,
  getAvailableLanguages,
};
