const results = [];
const { launch, emulateNetworkConditions, CPU_THROTTLING_RATE, TEST_COUNT } = require('../config.js');

init();

async function init() {
  // 1) 브라우저 런치
  const { browser, page } = await launch();

  // 2) DevTools Protocol 세션 열기 (LTE+CPU 제한)
  const client = await page.target().createCDPSession();

  await client.send('Network.enable');
  await client.send('Network.emulateNetworkConditions', emulateNetworkConditions); // ▒▒▒ LTE 환경 시뮬레이션 ▒▒▒
  await client.send('Emulation.setCPUThrottlingRate', { rate: CPU_THROTTLING_RATE });  // ▒▒▒ CPU Throttling ▒▒▒

  // 3) 테스트할 웹 페이지 열기
  await page.goto('file:///Users/gjm/-JavaScript-vs.-CSS-interpolate-size/tests/interpolate-size/index.html');

  for (let i = 0; i < TEST_COUNT; i++) {
    await evaluateRunTime(page, i, TEST_COUNT);
  }
  await browser.close();
  
  const sum = results.reduce((acc, time) => acc + time, 0);
  const average = sum / TEST_COUNT;

  console.log('----------------------------------');
  console.log(`📊 평균 애니메이션 종료 시점: ${average.toFixed(2)} ms`);
  console.log(`📝 전체 결과: ${results.map(r => r.toFixed(2)).join(', ')} ms`);
  console.log('----------------------------------');
}

async function  evaluateRunTime(page, i, totalCount) {
    console.log(`🔄 테스트 ${i + 1}/${totalCount} 실행...`);

    // 2-1) Performance 측정을 위해 새로운 실행 기록 시작
    await page.tracing.start({ path: `trace-${i + 1}.json`, screenshots: false });

    // 2-2) 애니메이션 시작 시점 기록
    const startTime = performance.now();

    await page.evaluate(toggleAccordion);

    // 2-4) 모든 transition이 끝난 시점
    const endTime = performance.now();
    const duration = endTime - startTime;
    results.push(duration);
    console.log(`✅ 테스트 ${i + 1}: ${duration.toFixed(2)} ms`);

    // 2-5) Performance 데이터 저장 종료
    await page.tracing.stop();
    await page.evaluate(toggleAccordion);
}


function toggleAccordion(){
  return new Promise((resolve) => {
    const headers = document.querySelectorAll('.css-accordion .accordion-header');
    const contents = document.querySelectorAll('.css-accordion .accordion-content');

    headers.forEach(h => h.click());

    let finishedCount = 0;
    contents.forEach(content => {
      const onTransitionEnd = (e) => {
        if (e.propertyName === 'max-height' || e.propertyName === 'height') {
          content.removeEventListener('transitionend', onTransitionEnd);
          finishedCount++;
          if (finishedCount === contents.length) {
            resolve();
          }
        }
      };
      content.addEventListener('transitionend', onTransitionEnd);
    });
  });
}