
const puppeteer = require('puppeteer');

(async () => {
  const NUM_TESTS = 20;     // 반복 실행 횟수
  const WAIT_TIME = 2000;   // 아코디언 열고 닫은 후 대기 시간
  const results = [];       // 실행 시간 저장 배열

  // 1) 브라우저 런치
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // 2) DevTools Protocol 세션 열기 (네트워크/CPU 제한을 위해)
  const client = await page.target().createCDPSession();
  await client.send('Network.enable');

  // ▒▒▒ LTE 환경 시뮬레이션 ▒▒▒
  // 예: 다운로드 10Mbps, 업로드 5Mbps, 지연 50ms
  // ----------------------------------------
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: 1_250_000, // 약 10Mbps (byte/s)
    uploadThroughput: 625_000,    // 약 5Mbps
    latency: 50                   // 50ms
  });


  // ▒▒▒ CPU Throttling ▒▒▒
  // ---------------------------
  await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });


  // 3) 테스트할 웹 페이지 열기
  // !! index.html 경로를 본인의 경로로 수정해주세요
  await page.goto('file:///Users/gjm/-JavaScript-vs.-CSS-interpolate-size/tests/js-animation/index.html');

  // 4) 반복 테스트
  for (let i = 0; i < NUM_TESTS; i++) {
    console.log(`🔄 테스트 ${i + 1}/${NUM_TESTS} 실행...`);

    // 4-1) Performance 측정을 위해 새로운 실행 기록 시작
    await page.tracing.start({ path: `trace-${i + 1}.json`, screenshots: false });

    // 4-2) 아코디언 60개를 동시에 열기
    const startTime = performance.now(); // 시작 시간 기록
    await page.$$eval('.js-accordion .accordion-header', headers => {
      headers.forEach(header => header.click()); // 한 번에 모두 클릭
    });

    // 4-3) 고정된 대기 시간 (애니메이션 진행 기다림)
    await new Promise(resolve => setTimeout(resolve, WAIT_TIME));

    // 4-4) 종료 시간 기록
    const endTime = performance.now();
    const duration = endTime - startTime;
    results.push(duration);
    console.log(`✅ 테스트 ${i + 1}: ${duration.toFixed(2)} ms`);

    // 4-5) Performance 데이터 저장 종료
    await page.tracing.stop();

    // 4-6) 아코디언 60개 다시 닫기
    await page.$$eval('.js-accordion .accordion-header', headers => {
      headers.forEach(header => header.click()); // 토글하여 모두 닫기
    });

    // 4-7) 다시 고정된 대기 시간
    await new Promise(resolve => setTimeout(resolve, WAIT_TIME));
  }

  await browser.close();

  // 5) 평균 시간 계산
  const sum = results.reduce((acc, time) => acc + time, 0);
  const average = sum / NUM_TESTS;

  console.log('----------------------------------');
  console.log(`📊 평균 애니메이션 실행 시간: ${average.toFixed(2)} ms`);
  console.log(`📝 전체 결과: ${results.map(r => r.toFixed(2)).join(', ')} ms`);
  console.log('----------------------------------');
})();
