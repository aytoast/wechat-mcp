(() => {
  const root = document.querySelector('.product-demo');
  if (!root) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const scenes = {
    read: {prompt:'帮我看看设计群最近讨论了什么。',tool:'read_messages',payload:'{ "chat_name": "设计群", "limit": 20 }',title:'讨论集中在两个事项：',text:'首页设计已确认，准备进入开发。\n周五前补齐移动端交互稿。',note:'根据返回内容，由 AI 助手整理'},
    image: {prompt:'看看设计群刚发的图片，说明这版布局。',tool:'read_messages',payload:'{ "chat_name": "设计群",\n  "limit": 10, "include_images": true }',title:'这版采用了新的布局：',text:'左侧导航，右侧内容区采用双列卡片。',note:'根据返回的图片，由 AI 助手分析'},
    send: {prompt:'向文件传输助手发送「MCP 连接测试」。',tool:'send_message',payload:'{ "chat_name": "文件传输助手",\n  "text": "MCP 连接测试",\n  "request_id": "demo-send-0001" }',title:'本地提交回执已返回',text:'request_id: demo-send-0001\ndelivery: "unverified"',note:'本地提交不代表接收端已送达'}
  };
  const play = document.querySelector('#demo-play');
  const fill = document.querySelector('#demo-progress-fill');
  const time = document.querySelector('#demo-time');
  const stepButtons = [...root.querySelectorAll('[data-step]')];
  let sceneKey = 'read';
  let elapsed = 12000, playing = false, frame = 0, previous = 0, visible = false, started = false, stage = -1;
  function render() {
    const next = elapsed < 2600 ? 0 : elapsed < 5400 ? 1 : elapsed < 8000 ? 2 : 3;
    if (next !== stage) {
      stage = next;
      root.dataset.stage = String(stage);
      document.querySelector('#wx-capture-state').textContent = sceneKey === 'send' ? ['等待发送指令','填写消息内容','已观察到本地提交','回执已返回'][stage] : ['等待 AI 请求','读取可见消息','内容已返回给 AI','读取完成'][stage];
      document.querySelector('#wx-outgoing').hidden = sceneKey !== 'send' || stage < 2;
      document.querySelector('#wx-draft').textContent = sceneKey === 'send' && stage === 1 ? 'MCP 连接测试' : '';
      document.querySelector('#demo-tool-state').textContent = ['等待调用','读取桌面…','已收到内容','调用完成'][stage];
      for (const button of stepButtons) {
        if (Number(button.dataset.step) === stage) button.setAttribute('aria-current','step');
        else button.removeAttribute('aria-current');
      }
    }
    fill.style.transform = `scaleX(${elapsed / 12000})`;
    time.textContent = `0:${String(Math.min(12,Math.floor(elapsed / 1000))).padStart(2,'0')}`;
    root.classList.toggle('is-playing',playing && visible && !document.hidden);
    play.hidden = reduced.matches;
    play.textContent = playing ? '暂停 Ⅱ' : elapsed >= 12000 ? '重播 ↻' : '播放 ▷';
    play.setAttribute('aria-label',playing ? '暂停模拟演示' : elapsed >= 12000 ? '重播模拟演示' : '播放模拟演示');
  }
  function cancel() { cancelAnimationFrame(frame); frame = 0; previous = 0; }
  function tick(now) {
    frame = 0;
    if (!playing || !visible || document.hidden || reduced.matches) return;
    if (previous) elapsed = Math.min(12000, elapsed + now - previous);
    previous = now;
    if (elapsed === 12000) playing = false;
    render();
    if (playing) frame = requestAnimationFrame(tick);
  }
  function schedule() {
    cancel(); render();
    if (playing && visible && !document.hidden && !reduced.matches) frame = requestAnimationFrame(tick);
  }
  function choose(key, autoplay) {
    const scene = scenes[key];
    sceneKey = key;
    root.dataset.scene = key;
    document.querySelector('#wx-title').textContent = key === 'send' ? '文件传输助手' : '设计群';
    document.querySelector('#wx-message-one').textContent = key === 'image' ? '这版改成了左侧导航，大家看看。' : '首页设计已确认，准备进入开发。';
    document.querySelector('#wx-message-two').textContent = key === 'image' ? '新版设计稿：' : '周五前补齐移动端交互稿。';
    document.querySelector('#wx-image').hidden = key !== 'image';
    root.querySelectorAll('.wx-chat').forEach((chat,index) => chat.classList.toggle('selected',index === (key === 'send' ? 1 : 0)));
    document.querySelector('#demo-return-text').textContent = key === 'read' ? '小林：首页设计已确认，准备进入开发。\n小周：周五前补齐移动端交互稿。' : key === 'image' ? '小林：这版改成了左侧导航，大家看看。\n小周：[图片] · 图片内容已返回' : 'request_id: demo-send-0001\ndelivery: "unverified"';
    for (const [id,value] of Object.entries({'demo-prompt':scene.prompt,'demo-tool':`wechat / ${scene.tool}`,'demo-payload':scene.payload,'demo-answer-title':scene.title,'demo-answer-text':scene.text,'demo-result-note':scene.note})) document.getElementById(id).textContent = value;
    document.querySelector('#demo-image').toggleAttribute('hidden', key !== 'image');
    root.querySelectorAll('[data-demo]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.demo === key)));
    elapsed = reduced.matches ? 12000 : 0;
    playing = autoplay && !reduced.matches;
    stage = -1; schedule();
  }
  root.querySelectorAll('[data-demo]').forEach(button => button.addEventListener('click',() => {started = true; choose(button.dataset.demo,true);}));
  play.addEventListener('click',() => {
    started = true;
    if (reduced.matches) { elapsed = 12000; playing = false; render(); return; }
    if (elapsed >= 12000) elapsed = 0;
    playing = !playing; schedule();
  });
  stepButtons.forEach(button => button.addEventListener('click',() => {started = true; playing = false; elapsed = [0,2600,5400,8000][Number(button.dataset.step)];schedule();}));
  const observer = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible && !started) { started = true; if (!reduced.matches) {elapsed = 0; playing = true;} }
    schedule();
  },{threshold:.2});
  observer.observe(root);
  document.addEventListener('visibilitychange',schedule);
  reduced.addEventListener('change',() => { if (reduced.matches) {playing = false;elapsed = 12000;} schedule(); });
  document.querySelector('#demo-return').appendChild(document.querySelector('#demo-image'));
  const picture = document.querySelector('#demo-image').cloneNode(true);
  picture.removeAttribute('id'); picture.removeAttribute('hidden');
  document.querySelector('#wx-image').appendChild(picture);
  choose('read', false);
  if (reduced.matches) {elapsed = 12000; render();}
})();
