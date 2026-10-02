(() => {
  const root = document.querySelector('.product-demo');
  if (!root) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const scenes = {
    read: {prompt:'帮我看看设计群最近讨论了什么。',tool:'read_messages',payload:'{ "chat_name": "设计群", "limit": 20 }',title:'讨论集中在两个事项：',text:'首页设计已确认，准备进入开发。\n周五前补齐移动端交互稿。',note:'根据返回内容，由 AI 助手整理'},
    image: {prompt:'看看设计群刚发的图片，说明这版布局。',tool:'read_messages',payload:'{ "chat_name": "设计群",\n  "limit": 10, "include_images": true }',title:'图片已返回给 AI 助手',text:'左侧导航，右侧内容区采用双列卡片。',note:'示意设计稿 · 可用图片通过 MCP 返回'},
    send: {prompt:'向文件传输助手发送「MCP 连接测试」。',tool:'send_message',payload:'{ "chat_name": "文件传输助手",\n  "text": "MCP 连接测试",\n  "request_id": "demo-send-0001" }',title:'本地提交回执已返回',text:'request_id: demo-send-0001\ndelivery: "unverified"',note:'本地提交不代表接收端已送达'}
  };
  const play = document.querySelector('#demo-play');
  const fill = document.querySelector('#demo-progress-fill');
  const time = document.querySelector('#demo-time');
  const stepButtons = [...root.querySelectorAll('[data-step]')];
  let elapsed = 9000, playing = false, frame = 0, previous = 0, visible = false, started = false, stage = -1;
  function render() {
    const next = elapsed < 2200 ? 0 : elapsed < 5100 ? 1 : 2;
    if (next !== stage) {
      stage = next;
      root.dataset.stage = String(stage);
      document.querySelector('#demo-tool-state').textContent = ['等待调用','正在调用…','返回结果'][stage];
      for (const button of stepButtons) {
        if (Number(button.dataset.step) === stage) button.setAttribute('aria-current','step');
        else button.removeAttribute('aria-current');
      }
    }
    fill.style.transform = `scaleX(${elapsed / 9000})`;
    time.textContent = `0:0${Math.min(9,Math.floor(elapsed / 1000))}`;
    root.classList.toggle('is-playing',playing && visible && !document.hidden);
    play.hidden = reduced.matches;
    play.textContent = playing ? '暂停 Ⅱ' : elapsed >= 9000 ? '重播 ↻' : '播放 ▷';
    play.setAttribute('aria-label',playing ? '暂停模拟演示' : elapsed >= 9000 ? '重播模拟演示' : '播放模拟演示');
  }
  function cancel() { cancelAnimationFrame(frame); frame = 0; previous = 0; }
  function tick(now) {
    frame = 0;
    if (!playing || !visible || document.hidden || reduced.matches) return;
    if (previous) elapsed = Math.min(9000, elapsed + now - previous);
    previous = now;
    if (elapsed === 9000) playing = false;
    render();
    if (playing) frame = requestAnimationFrame(tick);
  }
  function schedule() {
    cancel(); render();
    if (playing && visible && !document.hidden && !reduced.matches) frame = requestAnimationFrame(tick);
  }
  function choose(key, autoplay) {
    const scene = scenes[key];
    for (const [id,value] of Object.entries({'demo-prompt':scene.prompt,'demo-tool':`wechat / ${scene.tool}`,'demo-payload':scene.payload,'demo-answer-title':scene.title,'demo-answer-text':scene.text,'demo-result-note':scene.note})) document.getElementById(id).textContent = value;
    document.querySelector('#demo-image').hidden = key !== 'image';
    root.querySelectorAll('[data-demo]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.demo === key)));
    elapsed = reduced.matches ? 9000 : 0;
    playing = autoplay && !reduced.matches;
    stage = -1; schedule();
  }
  root.querySelectorAll('[data-demo]').forEach(button => button.addEventListener('click',() => {started = true; choose(button.dataset.demo,true);}));
  play.addEventListener('click',() => {
    started = true;
    if (reduced.matches) { elapsed = 9000; playing = false; render(); return; }
    if (elapsed >= 9000) elapsed = 0;
    playing = !playing; schedule();
  });
  stepButtons.forEach(button => button.addEventListener('click',() => {started = true; playing = false; elapsed = [0,2200,5100][Number(button.dataset.step)];schedule();}));
  const observer = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible && !started) { started = true; if (!reduced.matches) {elapsed = 0; playing = true;} }
    schedule();
  },{threshold:.2});
  observer.observe(root);
  document.addEventListener('visibilitychange',schedule);
  reduced.addEventListener('change',() => { if (reduced.matches) {playing = false;elapsed = 9000;} schedule(); });
  render();
})();
