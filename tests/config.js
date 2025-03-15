const puppeteer = require('puppeteer');

const TEST_COUNT = 20;
const CPU_THROTTLING_RATE = 100;

const emulateNetworkConditions = {
  offline: false,
  downloadThroughput: 1_250_000, // 약 10Mbps (byte/s)
  uploadThroughput: 625_000,    // 약 5Mbps
  latency: 50                   // 50ms
}

async function launch() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  return { browser, page };
}

module.exports = {
  launch,
  emulateNetworkConditions,
  CPU_THROTTLING_RATE,
  TEST_COUNT
}