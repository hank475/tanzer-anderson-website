import importlib.util
import unittest
from pathlib import Path

spec=importlib.util.spec_from_file_location("nq_engine",Path(__file__).with_name("nq_intelligence.py"))
engine=importlib.util.module_from_spec(spec)
spec.loader.exec_module(engine)

class TreasurySourceTests(unittest.TestCase):
 def test_official_index_preserves_source_date_and_link(self):
  value=engine.parse_treasury_press('<time datetime="2026-09-04T14:30:00Z"></time><h3 class="featured-stories__headline"><a href="/news/press-releases/source-test/">A &amp; B</a></h3>')
  self.assertEqual(value[0]["published"],"2026-09-04T14:30:00Z")
  self.assertEqual(value[0]["title"],"A & B")
  self.assertEqual(value[0]["url"],"https://home.treasury.gov/news/press-releases/source-test/")
 def test_undated_or_external_links_fail_closed(self):
  for prefix,href in [("","/news/press-releases/a/"),('<time datetime="2026-09-04T14:30:00Z"></time>',"https://untrusted.invalid/news/press-releases/a/")]:
   with self.subTest(href=href):
    with self.assertRaises(RuntimeError):
     engine.parse_treasury_press(prefix+'<h3 class="featured-stories__headline"><a href="'+href+'">Ignored</a></h3>')
 def test_retired_rss_is_not_the_current_treasury_route(self):
  self.assertIn(("U.S. Treasury","https://home.treasury.gov/news/press-releases"),engine.FEEDS)
  self.assertIn(("CFTC","https://www.cftc.gov/RSS/RSSGP/rssgp.xml"),engine.FEEDS)

if __name__=="__main__":unittest.main()
