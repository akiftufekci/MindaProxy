const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { formatDate } = require("./utils");

async function checkProxy(proxy) {
  const url = "http://example.com";

  try {
    const httpResponse = await axios.get(url, {
      proxy: {
        host: proxy.split(":")[0],
        port: proxy.split(":")[1],
      },
      timeout: 10000,
    });

    return httpResponse.status >= 200 && httpResponse.status < 300;
  } catch (httpError) {
    try {
      const httpsResponse = await axios.get("https://example.com", {
        proxy: {
          host: proxy.split(":")[0],
          port: proxy.split(":")[1],
          protocol: "https",
        },
        timeout: 10000,
      });

      return httpsResponse.status >= 200 && httpsResponse.status < 300;
    } catch (httpsError) {
      console.log(`Proxy kontrol hatası: ${proxy} - ${httpsError.message}`);
      return false;
    }
  }
}

async function checkProxies(proxies, updateProgress) {
  const validProxies = [];
  const invalidProxies = [];
  const total = proxies.length;
  let completed = 0;

  const today = formatDate(new Date());
  const validPath = path.join(__dirname, "..", `${today}_valid_proxies.txt`);

  if (fs.existsSync(validPath)) {
    const existingProxies = fs
      .readFileSync(validPath, "utf8")
      .split("\n")
      .filter((p) => p.trim());
    validProxies.push(...existingProxies);
  }

  const batchSize = 10;
  const batches = [];

  for (let i = 0; i < proxies.length; i += batchSize) {
    batches.push(proxies.slice(i, i + batchSize));
  }

  for (const batch of batches) {
    const batchPromises = batch.map(async (proxy) => {
      try {
        const isValid = await checkProxy(proxy);

        if (isValid) {
          if (!validProxies.includes(proxy)) {
            validProxies.push(proxy);
            fs.appendFileSync(validPath, proxy + "\n");
            updateProgress(completed + 1, total, {
              proxy,
              valid: true,
              action: "new_valid_proxy",
            });
          }
        } else {
          invalidProxies.push(proxy);
        }
      } catch (error) {
        console.error(`Proxy kontrolü sırasında hata: ${proxy}`, error);
        invalidProxies.push(proxy);
      } finally {
        completed++;
        updateProgress(completed, total);
      }
    });

    await Promise.all(batchPromises);
  }

  return {
    valid: validProxies.length,
    invalid: invalidProxies.length,
    total: total,
  };
}

module.exports = { checkProxies };
