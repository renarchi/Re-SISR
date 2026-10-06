import unittest
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urljoin, urlsplit

DOCS = Path(__file__).resolve().parents[1] / 'docs'

class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.nodes = []
        self.feed(path.read_text(encoding='utf-8'))
    def handle_starttag(self, tag, attrs):
        self.nodes.append((tag, dict(attrs)))

class Routes(unittest.TestCase):
    def test_home_links_to_separate_viewer_without_loading_its_assets(self):
        home = Page(DOCS / 'index.html')
        self.assertFalse(any(a.get('id') == 'comparison-viewer' for _, a in home.nodes))
        links = [a['href'] for tag, a in home.nodes if tag == 'a' and 'comparasion' in a.get('href', '')]
        self.assertTrue(links)
        self.assertEqual(urljoin('https://example.org/Re-SISR/', links[0]), 'https://example.org/Re-SISR/comparasion/')
        self.assertFalse(any('comparison' in a.get('src', '') for _, a in home.nodes))

    def test_nested_page_assets_resolve_under_project_root(self):
        path = DOCS / 'comparasion/index.html'
        self.assertTrue(path.is_file())
        page = Page(path)
        base = next(a['href'] for tag, a in page.nodes if tag == 'base')
        resolved = urljoin('https://example.org/Re-SISR/comparasion/', base)
        self.assertTrue(any(a.get('id') == 'comparison-viewer' for _, a in page.nodes))
        for tag, attrs in page.nodes:
            value = attrs.get('src') if tag in ('script', 'img') else attrs.get('href') if tag == 'link' else None
            if value and not value.startswith('http'):
                target = urlsplit(urljoin(resolved, value)).path.removeprefix('/Re-SISR/')
                self.assertTrue((DOCS / target).is_file(), target)

if __name__ == '__main__': unittest.main()
