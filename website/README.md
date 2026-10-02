# WeChat MCP website

Product website and documentation for WeChat MCP, maintained in `website/` alongside daemon source. Static HTML, CSS and JavaScript; no build dependencies.

## Preview

From repository root:

```powershell
python -m http.server 4173 --bind 127.0.0.1 --directory website
```

## Publish

URL: https://aytoast.github.io/wechat-mcp/

`.github/workflows/pages.yml` publishes only `website/` after website changes on `master`. GitHub Pages source is GitHub Actions. Assets and documentation links use relative paths. Previous standalone website URL redirects here.

## Content

Documentation reflects local Core API V2 and Python adapter inspected on 2026-10-03. Public repository does not yet contain that adapter; installation notice stays until MCP backend release is separately completed. No runtime code is published through website deployment.

Conversation example is fictional. No real chats or credentials are bundled. Keep minimal visual style; omit decorative uppercase section labels. Motion must respect reduced-motion settings and keyboard access.

References: https://github.com/microsoft/playwright-mcp and https://docs.wxauto.org/docs/
