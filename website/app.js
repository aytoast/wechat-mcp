const motion = matchMedia('(prefers-reduced-motion: reduce)');
const running = new Set();
function animate(element, frames, duration = 240) {
  if (motion.matches || !element.animate) return null;
  const animation = element.animate(frames, {duration, easing:'cubic-bezier(.22,.68,0,1)'});
  running.add(animation);
  animation.finished.catch(() => {}).finally(() => running.delete(animation));
  return animation;
}
motion.addEventListener('change', () => { if (motion.matches) for (const animation of running) animation.finish(); });
const commands = {
  codex: {command:'codex mcp add wechat -- python "C:\\path\\to\\wechat-mcp\\mcp\\server.py"',note:'将示例路径替换为本机 MCP 适配器的绝对路径。完成后，在 Codex 中检查 MCP 工具列表。'},
  claude: {command:'claude mcp add --scope user wechat -- python "C:\\path\\to\\wechat-mcp\\mcp\\server.py"',note:'将示例路径替换为本机 MCP 适配器的绝对路径。完成后，在 Claude Code 中运行 /mcp 检查连接。'},
  cursor: {command:JSON.stringify({mcpServers:{wechat:{command:'python',args:['C:/path/to/wechat-mcp/mcp/server.py']}}},null,2),note:'将配置合并到用户目录下的 .cursor/mcp.json，保留已有服务，并替换示例路径。'},
  json: {command:JSON.stringify({mcpServers:{wechat:{command:'python',args:['C:/path/to/wechat-mcp/mcp/server.py']}}},null,2),note:'将配置合并到客户端的 MCP 设置中，并替换示例路径。客户端必须能运行本机 Python。'}
};
const tabs = [...document.querySelectorAll('[data-client]')];
let selectedClient, codeAnimation;
function placeIndicator() {
  const selected = tabs.find(button => button.dataset.client === selectedClient);
  if (!selected) return;
  selected.parentElement.style.setProperty('--tab-left', `${selected.offsetLeft}px`);
  selected.parentElement.style.setProperty('--tab-width', `${selected.offsetWidth}px`);
}
function selectClient(client) {
  if (client === selectedClient) return;
  const code = document.querySelector('#install-command');
  const pre = code.parentElement;
  const height = pre.getBoundingClientRect().height;
  codeAnimation?.cancel();
  code.textContent = commands[client].command;
  document.querySelector('#client-note').textContent = commands[client].note;
  for (const button of tabs) {
    const selected = button.dataset.client === client;
    button.setAttribute('aria-selected', String(selected));
    button.tabIndex = selected ? 0 : -1;
  }
  if (selectedClient) codeAnimation = animate(pre, [{height:`${height}px`,opacity:.55},{height:`${pre.getBoundingClientRect().height}px`,opacity:1}],250);
  selectedClient = client;
  placeIndicator();
}
for (const button of tabs) {
  button.addEventListener('click', () => selectClient(button.dataset.client));
  button.addEventListener('keydown', event => {
    let index = tabs.indexOf(button);
    if (event.key === 'ArrowRight') index = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') index = (index + tabs.length - 1) % tabs.length;
    else if (event.key === 'Home') index = 0;
    else if (event.key === 'End') index = tabs.length - 1;
    else return;
    event.preventDefault(); selectClient(tabs[index].dataset.client); tabs[index].focus();
  });
}
if (tabs.length) { selectClient('codex'); new ResizeObserver(placeIndicator).observe(tabs[0].parentElement); document.fonts.ready.then(placeIndicator); }
let toastTimeout;
function toast(message) {
  const node = document.querySelector('#toast');
  node.textContent = message; node.classList.add('visible');
  clearTimeout(toastTimeout); toastTimeout = setTimeout(() => node.classList.remove('visible'),2600);
}
for (const button of document.querySelectorAll('[data-copy]')) {
  const original = button.innerHTML;
  let timer, copying = false;
  button.addEventListener('click', async () => {
    if (copying) return;
    copying = true;
    const text = document.getElementById(button.dataset.copy).textContent;
    let copied = false;
    try { await navigator.clipboard.writeText(text); copied = true; }
    catch {
      const field = document.createElement('textarea'); field.value = text;
      field.style.cssText = 'position:fixed;left:-9999px;top:0'; document.body.appendChild(field); field.select();
      try { copied = document.execCommand('copy'); } catch {}
      field.remove(); button.focus({preventScroll:true});
    }
    copying = false; clearTimeout(timer);
    button.classList.toggle('copied',copied);
    if (copied) { button.textContent = '已复制 ✓'; toast('已复制'); }
    else { button.innerHTML = original; toast('复制失败，请选中命令手动复制'); }
    timer = setTimeout(() => {button.innerHTML = original; button.classList.remove('copied');},2600);
  });
}
for (const details of document.querySelectorAll('.faq-list details')) {
  const summary = details.querySelector('summary');
  let animation, expanded = details.open;
  summary.addEventListener('click', event => {
    if (motion.matches) return;
    event.preventDefault();
    const start = details.getBoundingClientRect().height;
    expanded = animation ? !expanded : !details.open;
    animation?.cancel(); details.open = true;
    const style = getComputedStyle(details);
    const closed = summary.getBoundingClientRect().height + parseFloat(style.paddingTop) + parseFloat(style.paddingBottom) + parseFloat(style.borderBottomWidth);
    const end = expanded ? details.getBoundingClientRect().height : closed;
    details.style.overflow = 'hidden'; details.classList.toggle('collapsing',!expanded);
    animation = animate(details,[{height:`${start}px`},{height:`${end}px`}],260);
    const finish = () => {details.open = expanded; details.style.overflow = ''; details.classList.remove('collapsing'); animation = null;};
    if (animation) animation.onfinish = finish; else finish();
  });
}
const search = document.querySelector('#tool-search');
if (search) search.addEventListener('input', () => {
  const query = search.value.trim().toLowerCase(); let count = 0;
  document.querySelectorAll('.doc-tool').forEach(tool => {const match = tool.textContent.toLowerCase().includes(query);tool.hidden = !match;if(match)count++;});
  document.querySelector('#tool-count').textContent = `${count} 个工具`; document.querySelector('#tool-empty').hidden = count !== 0;
});
const header = document.querySelector('header');
const docLinks = [...document.querySelectorAll('.docs-sidebar a')];
const sections = docLinks.map(link => document.querySelector(link.getAttribute('href')));
let scrollPending = false;
function updateScroll() {
  header.classList.toggle('scrolled',scrollY > 12);
  let active = 0;
  sections.forEach((section,index) => {if(section.getBoundingClientRect().top <= 160)active=index;});
  docLinks.forEach((link,index) => {if(index===active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
  scrollPending = false;
}
addEventListener('scroll', () => {if(!scrollPending){scrollPending=true;requestAnimationFrame(updateScroll);}}, {passive:true});
updateScroll();
// Content stays readable without JavaScript and when reduced motion is enabled.
if (!motion.matches && 'IntersectionObserver' in window) {
  const reveal = new IntersectionObserver(entries => {for(const entry of entries)if(entry.isIntersecting){entry.target.classList.remove('reveal-pending');reveal.unobserve(entry.target);}}, {threshold:.06});
  const targets = document.querySelectorAll('.section, .closing');
  for(const element of targets)if(element.getBoundingClientRect().top>innerHeight){element.classList.add('reveal-pending');reveal.observe(element);}
  motion.addEventListener('change', () => {if(motion.matches){reveal.disconnect();targets.forEach(element=>element.classList.remove('reveal-pending'));}});
  document.addEventListener('focusin',event=>event.target.closest('.reveal-pending')?.classList.remove('reveal-pending'));
}
