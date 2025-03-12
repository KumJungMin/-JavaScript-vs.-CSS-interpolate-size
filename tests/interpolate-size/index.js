const puppeteer = require('puppeteer');

(async () => {
  const NUM_TESTS = 20; // 반복 실행 횟수
  const WAIT_TIME = 2000; 
  const results = [];

  // 1) 브라우저 런치
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // 2) DevTools Protocol 세션 열기
  const client = await page.target().createCDPSession();
  // 네트워크 이벤트 사용 가능하도록 설정
  await client.send('Network.enable');

  // 3) 네트워크 제한 설정 (LTE 환경 가정)
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: 1_250_000, // 약 10Mbps
    uploadThroughput: 625_000,    // 약 5Mbps
    latency: 50                   // 50ms
  });

  await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });


  // 4) 테스트할 웹 페이지 열기
  // !! index.html 경로를 본인의 경로로 수정해주세요
  await page.goto('file:///Users/gjm/-JavaScript-vs.-CSS-interpolate-size/tests/interpolate-size/index.html');

  // 5) 반복 테스트
  for (let i = 0; i < NUM_TESTS; i++) {
    console.log(`🔄 테스트 ${i + 1}/${NUM_TESTS} 실행...`);

    await page.tracing.start({ path: `trace-${i + 1}.json`, screenshots: false });

    // 아코디언 열기 시작 시간
    const startTime = performance.now();

    // 6) 아코디언 헤더(50개) 모두 클릭 - 한꺼번에 열기
    await page.$$eval('.css-accordion .accordion-header', headers => {
      headers.forEach(header => header.click());
    });

    // 고정 대기 (애니메이션 진행)
    await new Promise(resolve => setTimeout(resolve, WAIT_TIME));

    // 종료 시각
    const endTime = performance.now();
    const duration = endTime - startTime;
    results.push(duration);
    console.log(`✅ 테스트 ${i + 1}: ${duration.toFixed(2)} ms`);

    await page.tracing.stop();

    // 7) 아코디언 모두 닫기 (토글)
    await page.$$eval('.css-accordion .accordion-header', headers => {
      headers.forEach(header => header.click());
    });

    await new Promise(resolve => setTimeout(resolve, WAIT_TIME));
  }

  await browser.close();

  // 8) 결과 출력
  const sum = results.reduce((acc, time) => acc + time, 0);
  const average = sum / NUM_TESTS;
  console.log('----------------------------------');
  console.log(`📊 평균 애니메이션 실행 시간: ${average.toFixed(2)} ms`);
  console.log(`📝 전체 결과: ${results.map(r => r.toFixed(2)).join(', ')} ms`);
  console.log('----------------------------------');
})();
