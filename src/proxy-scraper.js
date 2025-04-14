const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { formatDate } = require("./utils");
const API_LIST = require("./apilist");

async function fetchProxies() {
  const date = formatDate(new Date());
  const filePath = path.join(__dirname, "..", `${date}_proxies.txt`);

  try {
    const proxies = new Set();

    await Promise.all(
      API_LIST.map(async (url) => {
        try {
          const response = await axios.get(url, { timeout: 10000 });
          if (response.status === 200) {
            const data = response.data;
            const extractedProxies = extractProxies(data);
            extractedProxies.forEach((proxy) => proxies.add(proxy));
          }
        } catch (error) {
          console.error(`Proxy API hatası: ${url} - ${error.message}`);
        }
      })
    );

    const proxyArray = Array.from(proxies);
    fs.writeFileSync(filePath, proxyArray.join("\n"));

    return proxyArray;
  } catch (error) {
    console.error(`Proxy toplama hatası: ${error.message}`);
    throw error;
  }
}

function extractProxies(data) {
  const text = typeof data === "string" ? data : JSON.stringify(data);
  const regex = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}:[0-9]{1,5}\b/g;
  const matches = text.match(regex) || [];
  return matches;
}

function getProxyCount() {
  try {
    const date = formatDate(new Date());
    const filePath = path.join(__dirname, "..", `${date}_proxies.txt`);

    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf8");
      const lines = data.split("\n");
      return lines.filter((line) => line.trim()).length;
    }

    return 0;
  } catch (error) {
    console.error(`Proxy sayısı hatası: ${error.message}`);
    return 0;
  }
}

module.exports = { fetchProxies, getProxyCount };
