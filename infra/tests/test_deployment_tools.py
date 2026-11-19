"""Site identity, the shared edge and project creation: no Docker, network or server."""
import importlib.util
from pathlib import Path
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, ROOT / path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


import edge  # noqa: E402  (scripts/ is on the path, as on the server)
import production_env as production  # noqa: E402
import site_config  # noqa: E402

generator = load("project_generator", "scripts/create-project.py")

VALID = {
    "APP_NAME": "My Site", "APP_SLUG": "my-site", "SITE_DOMAIN": "mysite.com",
    "SITE_ALIASES": "www.mysite.com", "LETSENCRYPT_EMAIL": "ops@mysite.com",
    "DEPLOY_DIR": "/srv/my-site", "EDGE_HTTP_PORT": "21080", "EDGE_HTTPS_PORT": "21081",
    "IMAGE_NAMESPACE": "ghcr.io/owner/my-site", "MEDIA_HOST": "",
}


def site(**changes):
    return site_config.parse({**VALID, **changes}, strict=True, git_root=None)


class SiteConfigTests(unittest.TestCase):
    def test_the_starter_file_parses_and_is_refused_for_deployment(self):
        values = site_config.read_values(ROOT / "deploy/site.env")
        site_config.parse(values, strict=False, git_root=None)
        with self.assertRaises(site_config.SiteConfigError):
            site_config.parse(values, strict=True, git_root=None)

    def test_derived_values(self):
        configured = site()
        self.assertEqual(configured.url, "https://mysite.com")
        self.assertEqual(configured.hostnames, ("mysite.com", "www.mysite.com"))
        self.assertEqual(configured.shell()["SITE_ALIASES"], "www.mysite.com")

    def test_invalid_values_are_rejected(self):
        for changes in (
            {"SITE_DOMAIN": "https://mysite.com"}, {"SITE_DOMAIN": "mysite.com/path"},
            {"SITE_ALIASES": "mysite.com"}, {"SITE_ALIASES": "www.mysite.com,www.mysite.com"},
            {"EDGE_HTTP_PORT": "80"}, {"EDGE_HTTPS_PORT": "21080"}, {"DEPLOY_DIR": "srv/site"},
            {"DEPLOY_DIR": "/srv"}, {"APP_SLUG": "My Site"}, {"IMAGE_NAMESPACE": "docker.io/x/y"},
            {"SITE_DOMAIN": "example.com"}, {"LETSENCRYPT_EMAIL": ""},
        ):
            with self.subTest(changes=changes), self.assertRaises(site_config.SiteConfigError):
                site(**changes)

    def test_file_values_cannot_interpolate_or_inject(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "site.env"
            for line in ("APP_NAME=$(whoami)", "APP_NAME='quoted'", "UNKNOWN=1", "APP_NAME=a\nAPP_NAME=b"):
                path.write_text(line + "\n")
                with self.subTest(line=line), self.assertRaises(site_config.SiteConfigError):
                    site_config.read_values(path)

    def test_production_secrets_must_describe_the_same_site(self):
        values = {"NEXT_PUBLIC_SITE_URL": "https://mysite.com", "FRONTEND_URL": "https://mysite.com",
                  "ALLOWED_HOSTS": "mysite.com,web", "APP_SLUG": "my-site"}
        self.assertEqual(production.validate_site(values, site()), [])
        for key, wrong in (("NEXT_PUBLIC_SITE_URL", "https://other.com"), ("ALLOWED_HOSTS", "other.com,web"), ("APP_SLUG", "other")):
            with self.subTest(key=key):
                self.assertTrue(production.validate_site({**values, key: wrong}, site()))


class EdgeTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.directory = Path(temporary.name)

    def test_fresh_install_and_registration(self):
        self.assertEqual(edge.install(self.directory), "installed")
        edge.register(self.directory, site())
        https = (self.directory / "sites/my-site.https.map").read_text()
        http = (self.directory / "sites/my-site.http.map").read_text()
        self.assertIn("mysite.com 127.0.0.1:21081;", https)
        self.assertIn("www.mysite.com 127.0.0.1:21081;", https)
        self.assertIn("www.mysite.com 127.0.0.1:21080;", http)
        self.assertEqual(edge.install(self.directory), "unchanged")

    def test_reregistering_replaces_the_site_own_routes(self):
        edge.install(self.directory)
        edge.register(self.directory, site())
        edge.register(self.directory, site(SITE_ALIASES="", EDGE_HTTP_PORT="22080", EDGE_HTTPS_PORT="22081"))
        https = (self.directory / "sites/my-site.https.map").read_text()
        self.assertNotIn("www.mysite.com", https)
        self.assertIn("127.0.0.1:22081", https)

    def test_another_site_names_and_ports_are_protected(self):
        edge.install(self.directory)
        edge.register(self.directory, site())
        clashes = (
            {"APP_SLUG": "other", "SITE_DOMAIN": "other.com", "SITE_ALIASES": "", "EDGE_HTTP_PORT": "21080", "EDGE_HTTPS_PORT": "23000"},
            {"APP_SLUG": "other", "SITE_DOMAIN": "other.com", "SITE_ALIASES": "www.mysite.com", "EDGE_HTTP_PORT": "23000", "EDGE_HTTPS_PORT": "23001"},
        )
        for changes in clashes:
            with self.subTest(changes=changes), self.assertRaises(edge.EdgeError):
                edge.register(self.directory, site(**changes))
        edge.register(self.directory, site(APP_SLUG="other", SITE_DOMAIN="other.com", SITE_ALIASES="",
                                           EDGE_HTTP_PORT="23000", EDGE_HTTPS_PORT="23001"))
        self.assertEqual(len(list((self.directory / "sites").glob("*.map"))), 4)

    def test_a_hand_written_edge_is_migrated_without_losing_a_site(self):
        legacy = """
stream {
    map $ssl_preread_server_name $https_site {
        first.com       127.0.0.1:8443;
        www.first.com   127.0.0.1:8443;
        second.com      127.0.0.1:9443;
        default         127.0.0.1:8443;
    }
}
http {
    map $host $http_site {
        hostnames;
        first.com       127.0.0.1:8080;
        www.first.com   127.0.0.1:8080;
        second.com      127.0.0.1:9080;
        default         127.0.0.1:8080;
    }
}
"""
        (self.directory / "nginx.conf").write_text(legacy)
        action = edge.install(self.directory)
        self.assertTrue(action.startswith("migrated"), action)
        self.assertIsNotNone(edge.version((self.directory / "nginx.conf").read_text()))
        self.assertTrue(list(self.directory.glob("nginx.conf.legacy-*")))
        routes = edge.registered(self.directory / "sites")
        self.assertEqual({(r.hostname, r.port) for r in routes["https"]},
                         {("first.com", 8443), ("www.first.com", 8443), ("second.com", 9443)})
        self.assertEqual({(r.hostname, r.port) for r in routes["http"]},
                         {("first.com", 8080), ("www.first.com", 8080), ("second.com", 9080)})
        # A migrated site still protects its ports from a new one.
        with self.assertRaises(edge.EdgeError):
            edge.register(self.directory, site(EDGE_HTTP_PORT="9080", EDGE_HTTPS_PORT="21081"))

    def test_an_older_edge_is_upgraded_and_keeps_its_sites(self):
        edge.install(self.directory)
        edge.register(self.directory, site())
        config = self.directory / "nginx.conf"
        config.write_text(config.read_text().replace("# sg-edge v1", "# sg-edge v0"))
        self.assertEqual(edge.install(self.directory), "upgraded from v0 to v1")
        self.assertTrue((self.directory / "sites/my-site.https.map").exists())

    def test_the_installed_edge_includes_every_site_file(self):
        config = (ROOT / "infra/edge/nginx.conf").read_text()
        self.assertIn("include  /etc/edge/sites/*.https.map;", config)
        self.assertIn("include  /etc/edge/sites/*.http.map;", config)
        self.assertIn("proxy_protocol  on;", config)
        compose = (ROOT / "infra/edge/compose.yml").read_text()
        self.assertIn("./sites:/etc/edge/sites:ro", compose)


class ProjectCreationTests(unittest.TestCase):
    def test_ports_are_stable_distinct_and_in_range(self):
        for slug in ("ghormu", "my-site", "suwas"):
            with self.subTest(slug=slug):
                http, https = generator.edge_ports(slug)
                self.assertEqual(generator.edge_ports(slug), (http, https))
                self.assertTrue(21000 <= http < https <= 29000)
                ports = [int(port) for port in generator.dev_ports(slug).values()]
                self.assertEqual(len(set(ports)), len(ports))
        self.assertNotEqual(generator.edge_ports("ghormu"), generator.edge_ports("my-site"))

    def test_site_env_is_filled_in(self):
        text = generator.site_env((ROOT / "deploy/site.env").read_text(), name="My Site", slug="my-site",
                                  domain="mysite.com", repo="Owner/My-Site", email="ops@mysite.com")
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "site.env"
            path.write_text(text)
            configured = site_config.parse(site_config.read_values(path), strict=True, git_root=None)
        self.assertEqual(configured.domain, "mysite.com")
        self.assertEqual(configured.aliases, ("www.mysite.com",))
        self.assertEqual(configured.image_namespace, "ghcr.io/owner/my-site")
        self.assertEqual(configured.deploy_dir, "/srv/my-site")
        self.assertEqual((configured.edge_http_port, configured.edge_https_port), generator.edge_ports("my-site"))

    def test_a_subdomain_gets_no_www_alias(self):
        text = generator.site_env((ROOT / "deploy/site.env").read_text(), name="App", slug="app",
                                  domain="app.mysite.com", repo="", email="")
        self.assertIn("SITE_ALIASES=\n", text)


if __name__ == "__main__":
    unittest.main()
