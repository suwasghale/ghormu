"""Configuration and copying regressions: no services or real secrets required."""
import importlib.util
from pathlib import Path
import shutil
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, ROOT / path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


production = load("production_env", "scripts/production_env.py")
generator = load("project_generator", "scripts/create-project.py")


class ProductionConfigurationTests(unittest.TestCase):
    def configuration(self):
        values = production.read_environment(ROOT / "backend/.env.production.example")
        values.update({
            "APP_SLUG": "production-test", "SECRET_KEY": "django-test-" * 8,
            "JWT_SIGNING_KEY": "jwt-test-" * 10, "POSTGRES_PASSWORD": "postgres-test-" * 4,
            "REDIS_PASSWORD": "redis-test-" * 4, "ALLOWED_HOSTS": "app.release.test,web",
            "NEXT_PUBLIC_SITE_URL": "https://app.release.test", "FRONTEND_URL": "https://app.release.test",
            "CORS_ALLOWED_ORIGINS": "https://app.release.test", "CSRF_TRUSTED_ORIGINS": "https://app.release.test",
            "EMAIL_HOST": "mail.release.test", "DEFAULT_FROM_EMAIL": "sender@release.test",
            "BACKUP_BUCKET": "private-release-backups", "BACKUP_ACCESS_KEY_ID": "test-key",
            "BACKUP_SECRET_ACCESS_KEY": "test-secret", "BACKUP_ENDPOINT_URL": "https://objects.release.test",
        })
        return values

    def test_configured_template_is_accepted(self):
        self.assertEqual(production.validate_environment(self.configuration(), require_backup=True), [])

    def test_unsafe_settings_are_rejected_without_echoing_values(self):
        invalid = {
            "DEBUG": "True", "POSTGRES_PASSWORD": "SECRET_SHORT", "REDIS_PASSWORD": "SECRET_SHORT",
            "NEXT_PUBLIC_SITE_URL": "https://user:SECRET_PASSWORD@release.test",
            "ALLOWED_HOSTS": "*", "CORS_ALLOWED_ORIGINS": "http://app.release.test",
            "CSRF_TRUSTED_ORIGINS": "https://elsewhere.test", "EMAIL_USE_TLS": "False",
            "EMAIL_USE_SSL": "True", "BACKUP_ENDPOINT_URL": "http://objects.release.test",
            "BACKUP_RETENTION_DAYS": "0", "BACKUP_PREFIX": "../other-project",
        }
        for key, value in invalid.items():
            with self.subTest(key=key):
                values = {**self.configuration(), key: value}
                errors = production.validate_environment(values, require_backup=True)
                self.assertTrue(errors)
                self.assertNotIn("SECRET_", "\n".join(errors))

    def test_cloud_media_must_match_build_host_and_use_separate_bucket(self):
        values = {**self.configuration(), "USE_CLOUD_STORAGE": "True", "R2_BUCKET_NAME": "media",
                  "R2_ACCESS_KEY_ID": "test", "R2_SECRET_ACCESS_KEY": "test",
                  "R2_ENDPOINT_URL": "https://objects.release.test", "R2_CUSTOM_DOMAIN": "media.release.test",
                  "MEDIA_HOST": "media.release.test"}
        self.assertEqual(production.validate_environment(values, require_backup=True), [])
        for change in ({"MEDIA_HOST": "wrong.release.test"}, {"BACKUP_BUCKET": "media"}):
            self.assertTrue(production.validate_environment({**values, **change}, require_backup=True))

    def test_parser_rejects_duplicates_interpolation_and_ambiguous_quoting(self):
        for content in ("SECRET_KEY=one\nSECRET_KEY=two", "SECRET_KEY=${OTHER}", "SECRET_KEY='quoted'", "SECRET_KEY=value # comment", "export SECRET_KEY=value"):
            with self.subTest(content=content), tempfile.TemporaryDirectory() as directory:
                path = Path(directory) / "test.env"
                path.write_text(content)
                with self.assertRaises(ValueError):
                    production.read_environment(path)


class ProjectCopyTests(unittest.TestCase):
    def test_names_cannot_inject_environment_assignments(self):
        for name in ("Project\nDEBUG=True", "Project$SECRET", "Project#comment", '"Quoted', "a" * 64):
            with self.subTest(name=name), self.assertRaises(ValueError):
                generator.project_slug(name)

    def test_private_files_are_excluded_and_source_assets_are_retained(self):
        with tempfile.TemporaryDirectory() as directory:
            source, target = Path(directory) / "source", Path(directory) / "copy"
            for name in (".env.example", "backend/.env.example", "frontend/.env.example", "backend/.env.production.example", "scripts/tasks.py", "scripts/production_env.py"):
                destination = source / name
                destination.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(ROOT / name, destination)
            private = ["loose.key", "certificate.pem", "state.tfstate", "secrets.env", ".npmrc", ".aws/credentials", "infra/e2e/generated/test.env", "backend/media/photo.png"]
            retained = ["frontend/app/media/page.tsx", "frontend/generated/client.ts", "infra/e2e/prepare.py"]
            for name in private + retained:
                path = source / name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text("fixture")
            # On hosts with symlink support, prove an external directory is not followed.
            outside = Path(directory) / "outside"
            outside.mkdir()
            (outside / "secret.txt").write_text("private fixture")
            try:
                (source / "external-link").symlink_to(outside, target_is_directory=True)
            except OSError:
                pass
            generator.copy_project(source, target, "Reusable Example")
            for name in private + ["external-link"]:
                self.assertFalse((target / name).exists(), name)
            for name in retained:
                self.assertTrue((target / name).is_file(), name)
            env = production.read_environment(target / "backend/.env")
            self.assertEqual(env["APP_SLUG"], "reusable-example")
            self.assertNotEqual(env["SECRET_KEY"], env["JWT_SIGNING_KEY"])
            self.assertGreaterEqual(len(env["SECRET_KEY"]), 50)
            with self.assertRaises(ValueError):
                generator.copy_project(source, target, "Do Not Overwrite")


if __name__ == "__main__":
    unittest.main()
