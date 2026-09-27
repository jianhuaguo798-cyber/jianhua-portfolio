"""Validate deployable files and download wiring without third-party packages."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote

root = Path(__file__).resolve().parents[1]

class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls = []
        self.ids = set()
        self.downloads = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            self.ids.add(attrs['id'])
        for key in ('href', 'src'):
            if key in attrs:
                self.urls.append(attrs[key])
        if tag == 'a' and 'download' in attrs:
            self.downloads.append(attrs.get('href', ''))

page = Page()
page.feed((root / 'index.html').read_text())
errors = []
for url in page.urls:
    parsed = urlsplit(url)
    if parsed.scheme or parsed.netloc:
        continue
    if not parsed.path:
        if not parsed.fragment or parsed.fragment not in page.ids:
            errors.append(f'Invalid anchor: {url}')
    elif not (root / unquote(parsed.path)).is_file():
        errors.append(f'Missing resource: {url}')
pdf = root / 'downloads/portfolio.pdf'
if not pdf.is_file() or not pdf.read_bytes().startswith(b'%PDF-'):
    errors.append('Missing or invalid portfolio PDF')
if len(page.downloads) < 2 or any(url != 'downloads/portfolio.pdf' for url in page.downloads):
    errors.append('Expected working header, hero and footer download links')
if errors:
    raise SystemExit('\n'.join(errors))
print(f'PASS: {len(page.urls)} links/assets, {len(page.downloads)} PDF download links; PDF {pdf.stat().st_size} bytes.')
