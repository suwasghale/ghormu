"""Release safety contracts, runnable without a VPS, network or database."""
import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

import yaml

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("release_env", ROOT / "infra/release_env.py")
release_env = importlib.util.module_from_spec(spec)
spec.loader.exec_module(release_env)


class ReleaseEnvironmentTests(unittest.TestCase):
    def test_only_image_assignments_change_and_duplicates_are_removed(self):
        original = "# deployment settings\nSECRET_KEY='keep $this exactly'\nBACKEND_IMAGE=old\nexport BACKEND_IMAGE=older\nFRONTEND_IMAGE=old\nEMAIL_PASSWORD=keep=also\n"
        images = release_env.read_images("BACKEND_IMAGE=ghcr.io/starter/backend@sha256:abc\nFRONTEND_IMAGE=ghcr.io/starter/frontend:commit\n")
        result = release_env.update_environment(original, images)
        self.assertIn("SECRET_KEY='keep $this exactly'\n", result)
        self.assertIn("EMAIL_PASSWORD=keep=also\n", result)
        self.assertEqual(result.count("BACKEND_IMAGE="), 1)
        self.assertNotIn("BACKEND_IMAGE=old", result)

    def test_incomplete_or_unsafe_references_are_rejected(self):
        for text in ("BACKEND_IMAGE=only-one\n", "BACKEND_IMAGE=$(whoami)\nFRONTEND_IMAGE=tag\n", "SECRET_KEY=anything\n", "BACKEND_IMAGE=x:y\nBACKEND_IMAGE=x:z\nFRONTEND_IMAGE=x:y\n"):
            with self.subTest(text=text), self.assertRaises(ValueError):
                release_env.read_images(text)

    def test_failed_atomic_replace_keeps_original_and_removes_temporary_file(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "environment"
            original = "SECRET_KEY=preserved\nBACKEND_IMAGE=old\n"
            target.write_text(original, encoding="utf-8")
            with patch.object(release_env.os, "replace", side_effect=OSError("simulated write failure")):
                with self.assertRaises(OSError):
                    release_env.persist(target, {"BACKEND_IMAGE": "new:tag", "FRONTEND_IMAGE": "new:tag"})
            self.assertEqual(target.read_text(encoding="utf-8"), original)
            self.assertEqual(list(Path(directory).iterdir()), [target])

    def test_successful_atomic_write_retains_other_settings(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "environment"
            target.write_text("SECRET_KEY=preserved\n", encoding="utf-8")
            release_env.persist(target, {"BACKEND_IMAGE": "backend:new", "FRONTEND_IMAGE": "frontend:new"})
            self.assertEqual(target.read_text(encoding="utf-8"), "SECRET_KEY=preserved\nBACKEND_IMAGE=backend:new\nFRONTEND_IMAGE=frontend:new\n")


class WorkflowGateTests(unittest.TestCase):
    def workflow(self, filename):
        # BaseLoader retains the YAML 'on' key instead of treating it as bool.
        return yaml.load((ROOT / ".github/workflows" / filename).read_text(encoding="utf-8"), Loader=yaml.BaseLoader)

    def test_publication_requires_all_four_same_revision_validation_workflows(self):
        publish = self.workflow("publish.yml")
        expected = {"validate-backend": "backend.yml", "validate-frontend": "frontend.yml", "validate-production": "production-validation.yml", "validate-integration": "integration.yml"}
        self.assertEqual(set(publish["jobs"]["build"]["needs"]), set(expected))
        for job, filename in expected.items():
            self.assertEqual(publish["jobs"][job]["uses"], f"./.github/workflows/{filename}")
            child = self.workflow(filename)
            self.assertIn("workflow_call", child["on"])
            self.assertNotEqual(child["concurrency"]["group"], publish["concurrency"]["group"])
        build = publish["jobs"]["build"]
        self.assertEqual(set(build["strategy"]["matrix"]["service"]), {"backend", "frontend", "backup"})
        image_step = next(step for step in build["steps"] if step.get("uses", "").startswith("docker/build-push-action"))
        self.assertIn("${{ github.sha }}", image_step["with"]["tags"])
        self.assertNotIn(":latest", image_step["with"]["tags"])
        self.assertEqual(image_step["with"]["sbom"], "true")
        self.assertEqual(image_step["with"]["provenance"], "mode=max")

    def test_external_actions_are_immutable_and_checkout_credentials_are_ephemeral(self):
        for path in (ROOT / ".github/workflows").glob("*.yml"):
            workflow = self.workflow(path.name)
            self.assertNotIn("pull_request_target", workflow["on"])
            for job in workflow["jobs"].values():
                for step in job.get("steps", []):
                    reference = step.get("uses", "")
                    if reference and not reference.startswith("./"):
                        self.assertRegex(reference, r"^[^@]+@[0-9a-f]{40}$")
                    if reference.startswith("actions/checkout@"):
                        self.assertEqual(step["with"]["persist-credentials"], "false")

    def test_deployment_uses_verified_output_and_serializes_releases(self):
        deploy = self.workflow("deploy.yml")
        self.assertEqual(deploy["concurrency"]["cancel-in-progress"], "false")
        self.assertEqual(deploy["on"]["workflow_run"]["branches"], ["main"])
        self.assertEqual(deploy["on"]["workflow_dispatch"]["inputs"]["release_sha"]["required"], "true")
        steps = deploy["jobs"]["deploy"]["steps"]
        ssh = next(step for step in steps if step.get("uses", "").startswith("appleboy/ssh-action"))
        self.assertEqual(ssh["env"]["RELEASE_SHA"], "${{ steps.release.outputs.sha }}")
        self.assertNotIn("git pull", ssh["with"]["script"])


@unittest.skipUnless(sys.platform.startswith("linux") and shutil.which("flock"), "Release script targets Linux with flock")
class DeploymentFailureTests(unittest.TestCase):
    """Exercise the real script without SSH, Git mutation, Docker or network access."""

    def run_release(self, *, failure="", fresh=False):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        root = Path(temporary.name)
        for folder in ("bin", "backend", "scripts", "infra", ".deployment"):
            (root / folder).mkdir()
        for name in ("deploy.sh", "scripts/tasks.py", "scripts/production_env.py", "infra/release_env.py"):
            shutil.copy2(ROOT / name, root / name)
        (root / ".deployment/current-sha").write_text("old-release\n")
        (root / ".deployment/current-images.env").write_text("BACKEND_IMAGE=ghcr.io/test/verified-backend:old\nFRONTEND_IMAGE=ghcr.io/test/verified-frontend:old\nBACKUP_IMAGE=ghcr.io/test/verified-backup:old\n")
        environment = "\n".join([
            "SECRET_KEY=" + "django-" * 10, "JWT_SIGNING_KEY=" + "jwt-" * 20,
            "POSTGRES_PASSWORD=" + "postgres-test-" * 3, "REDIS_PASSWORD=" + "redis-test-" * 3,
            "APP_SLUG=release-test", "POSTGRES_DB=release_test", "POSTGRES_USER=release_test",
            "CORS_ALLOWED_ORIGINS=https://release.test", "CSRF_TRUSTED_ORIGINS=https://release.test",
            "EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend", "EMAIL_USE_TLS=True",
            "ALLOWED_HOSTS=release.test,web", "NEXT_PUBLIC_SITE_URL=https://release.test",
            "FRONTEND_URL=https://release.test", "EMAIL_HOST=mail.release.test",
            "DEFAULT_FROM_EMAIL=sender@release.test", "BACKUP_BUCKET=private-test",
            "BACKUP_ACCESS_KEY_ID=test", "BACKUP_SECRET_ACCESS_KEY=test",
            "BACKUP_ENDPOINT_URL=https://storage.release.test", "",
        ])
        (root / "backend/.env.production").write_text(environment)
        # Each fake executable only records calls. Python still runs the real
        # environment checks/persistence; only the external HTTPS probe is mocked.
        mock = '''import json, os, sys
from pathlib import Path
name = Path(sys.argv[0]).name
args = sys.argv[1:]
with open(os.environ["MOCK_LOG"], "a") as stream:
    stream.write(json.dumps([name, *args]) + "\\n")
command = " ".join(args)
failure = os.environ.get("MOCK_FAIL")
if failure and failure in command:
    sys.exit(7)
if name == "python3":
    if args[0] == "infra/smoke.py":
        sys.exit(0)
    os.execv(sys.executable, [sys.executable, *args])
if name == "docker":
    if args[:2] == ["image", "inspect"]:
        print(args[-1].split(":")[0] + "@sha256:" + "a" * 64)
    elif args[0] == "inspect":
        print("ghcr.io/test/previous:old")
    elif "ps -q" in command:
        print(args[-1] + "-container")
    elif "information_schema.tables" in command:
        print(os.environ["MOCK_SCHEMA"])
'''
        for name in ("docker", "git", "python3"):
            executable = root / "bin" / name
            executable.write_text(f"#!{sys.executable}\n" + mock)
            executable.chmod(0o755)
        env = {**os.environ, "PATH": str(root / "bin") + os.pathsep + os.environ["PATH"],
               "DEPLOY_DIR": str(root), "DEPLOY_SITE_URL": "https://release.test",
               "IMAGE_NAMESPACE": "ghcr.io/test/starter", "MOCK_LOG": str(root / "calls.jsonl"),
               "MOCK_FAIL": failure, "MOCK_SCHEMA": "0" if fresh else "30"}
        result = subprocess.run(["bash", str(root / "deploy.sh"), "b" * 40], cwd=root,
                                env=env, stdin=subprocess.DEVNULL, capture_output=True, text=True, timeout=30)
        calls = [json.loads(line) for line in (root / "calls.jsonl").read_text().splitlines()]
        return root, result, [" ".join(call) for call in calls]

    def test_backup_failure_keeps_previous_release_and_never_starts_migration(self):
        root, result, calls = self.run_release(failure="--entrypoint /usr/local/bin/restore")
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual((root / ".deployment/current-sha").read_text().strip(), "old-release")
        self.assertFalse(any("--wait-timeout 240" in call for call in calls))
        self.assertNotIn("BACKEND_IMAGE=", (root / "backend/.env.production").read_text())
        # Running containers may belong to an incomplete previous attempt.
        previous = (root / ".deployment/previous-images.env").read_text()
        self.assertIn("verified-backend:old", previous)
        self.assertNotIn("ghcr.io/test/previous:old", previous)

    def test_migration_or_smoke_failure_cannot_report_success(self):
        for failure in ("--wait-timeout 240", "infra/smoke.py"):
            with self.subTest(failure=failure):
                root, result, calls = self.run_release(failure=failure)
                self.assertNotEqual(result.returncode, 0)
                self.assertEqual((root / ".deployment/current-sha").read_text().strip(), "old-release")
                self.assertFalse(any("--wait-timeout 180 backup-scheduler" in call for call in calls))

    def test_only_complete_release_records_immutable_images_and_sha(self):
        for fresh in (False, True):
            with self.subTest(fresh=fresh):
                root, result, calls = self.run_release(fresh=fresh)
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertEqual((root / ".deployment/current-sha").read_text().strip(), "b" * 40)
                saved = (root / ".deployment/current-images.env").read_text()
                self.assertEqual(saved.count("@sha256:"), 3)
                self.assertEqual(sum("--entrypoint /usr/local/bin/restore" in call for call in calls), 1 if fresh else 2)
                self.assertIn("SECRET_KEY=django-", (root / "backend/.env.production").read_text())
                self.assertTrue(any("--wait-timeout 180 backup-scheduler" in call for call in calls))


if __name__ == "__main__":
    unittest.main()
