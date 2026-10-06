#!/usr/bin/env python3
"""Generate view.html with ChartDB URL from diagram.sql"""
import zlib, base64

with open('/home/simon/repos/foodflow/environments/dev/db/diagram.sql') as f:
    lines = [l for l in f.read().split('\n') if not l.strip().startswith('--')]
    sql = '\n'.join(lines)

c = zlib.compress(sql.encode(), level=9)
b64 = base64.urlsafe_b64encode(c).decode().rstrip('=')
url = f'http://localhost:3504/#s={b64}'

html = f'''<!DOCTYPE html>
<html lang=en>
<head>
  <meta charset=UTF-8>
  <meta http-equiv=refresh content="0;url={url}">
  <title>Foodflow Schema - ChartDB</title>
  <style>
    body {{
      font-family: system-ui, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; margin: 0; flex-direction: column; gap: 16px;
    }}
    .card {{
      background: #1e293b; border: 1px solid #334155;
      border-radius: 12px; padding: 32px 40px;
      text-align: center; max-width: 480px;
    }}
    h1 {{ color: #f1f5f9; margin: 0 0 8px }}
    p {{ color: #94a3b8; margin: 8px 0; line-height: 1.5 }}
    a {{ color: #818cf8 }}
  </style>
</head>
<body>
  <div class=card>
    <h1>Foodflow Schema</h1>
    <p>Opening <strong>ChartDB</strong> with the database schema auto-loaded...</p>
    <p>If not redirected: <a href="{url}">click here</a></p>
  </div>
</body>
</html>'''

with open('/home/simon/repos/foodflow/environments/dev/db/view.html', 'w') as f:
    f.write(html)

print(f'view.html generated ({len(b64)} char token)')
