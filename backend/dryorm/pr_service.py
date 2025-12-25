import os
import tarfile
import shutil
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

PR_CACHE_DIR = Path(os.environ.get("PR_CACHE_DIR", "/app/pr_cache"))
HOST_PR_CACHE_PATH = os.environ.get("HOST_PR_CACHE_PATH", "/app/pr_cache")
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")


@dataclass
class PRInfo:
    pr_id: int
    title: str
    sha: str
    state: str
    local_path: str  # Path inside container
    host_path: str   # Path on Docker host for volume mounting
    author: str
    branch: str


class PRServiceError(Exception):
    """Base exception for PR service errors."""
    pass


class PRNotFoundError(PRServiceError):
    """Raised when a PR is not found."""
    pass


class PRFetchError(PRServiceError):
    """Raised when fetching PR source fails."""
    pass


class PRService:
    GITHUB_API_BASE = "https://api.github.com"
    DJANGO_REPO = "django/django"

    def __init__(self):
        self.cache_dir = PR_CACHE_DIR
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def _get_headers(self) -> dict:
        headers = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        if GITHUB_TOKEN:
            headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"
        return headers

    def fetch_pr(self, pr_id: int) -> PRInfo:
        """Fetch and cache a Django PR. Returns PR metadata."""
        # 1. Get PR info from GitHub API
        pr_data = self._get_pr_info(pr_id)

        sha = pr_data["head"]["sha"]
        title = pr_data["title"]
        state = pr_data["state"]
        author = pr_data["user"]["login"]
        branch = pr_data["head"]["ref"]

        # 2. Check if already cached
        pr_path = self.cache_dir / str(pr_id) / sha
        host_pr_path = os.path.join(HOST_PR_CACHE_PATH, str(pr_id), sha)
        if pr_path.exists():
            logger.info(f"PR {pr_id} already cached at {pr_path}")
            return PRInfo(
                pr_id=pr_id,
                title=title,
                sha=sha,
                state=state,
                local_path=str(pr_path),
                host_path=host_pr_path,
                author=author,
                branch=branch,
            )

        # 3. Download and extract tarball
        self._download_pr_source(pr_id, sha, pr_path)

        return PRInfo(
            pr_id=pr_id,
            title=title,
            sha=sha,
            state=state,
            local_path=str(pr_path),
            host_path=host_pr_path,
            author=author,
            branch=branch,
        )

    def _get_pr_info(self, pr_id: int) -> dict:
        """Get PR metadata from GitHub API."""
        url = f"{self.GITHUB_API_BASE}/repos/{self.DJANGO_REPO}/pulls/{pr_id}"

        try:
            with httpx.Client(timeout=30.0) as client:
                response = client.get(url, headers=self._get_headers())

                if response.status_code == 404:
                    raise PRNotFoundError(f"PR #{pr_id} not found")
                if response.status_code == 403:
                    raise PRFetchError("GitHub API rate limit exceeded")

                response.raise_for_status()
                return response.json()
        except httpx.HTTPError as e:
            raise PRFetchError(f"Failed to fetch PR info: {e}")

    def _download_pr_source(self, pr_id: int, sha: str, target_path: Path):
        """Download and extract PR source tarball."""
        # Download tarball for the specific commit
        tarball_url = f"https://github.com/{self.DJANGO_REPO}/archive/{sha}.tar.gz"

        try:
            with httpx.Client(timeout=120.0, follow_redirects=True) as client:
                response = client.get(tarball_url, headers=self._get_headers())
                response.raise_for_status()

                # Create parent directory for PR
                pr_dir = self.cache_dir / str(pr_id)
                pr_dir.mkdir(parents=True, exist_ok=True)

                # Save tarball temporarily
                tarball_path = pr_dir / f"{sha}.tar.gz"
                tarball_path.write_bytes(response.content)

                # Extract tarball
                temp_extract = pr_dir / f"{sha}_temp"
                with tarfile.open(tarball_path, "r:gz") as tar:
                    tar.extractall(temp_extract)

                # Move the extracted django directory to target
                # GitHub tarballs extract to django-{sha}/ directory
                extracted_dirs = list(temp_extract.iterdir())
                if extracted_dirs:
                    shutil.move(str(extracted_dirs[0]), str(target_path))

                # Cleanup
                tarball_path.unlink()
                if temp_extract.exists():
                    shutil.rmtree(temp_extract)

                logger.info(f"PR {pr_id} source cached at {target_path}")

        except httpx.HTTPError as e:
            raise PRFetchError(f"Failed to download PR source: {e}")
        except (tarfile.TarError, OSError) as e:
            raise PRFetchError(f"Failed to extract PR source: {e}")

    def get_cached_pr(self, pr_id: int) -> Optional[PRInfo]:
        """Get cached PR info if exists (returns most recent cached version)."""
        pr_dir = self.cache_dir / str(pr_id)
        if not pr_dir.exists():
            return None

        # Get the most recent cached SHA
        cached_shas = [d for d in pr_dir.iterdir() if d.is_dir()]
        if not cached_shas:
            return None

        # Return the first cached version (we'd need to fetch PR info to get full details)
        latest = cached_shas[0]
        host_pr_path = os.path.join(HOST_PR_CACHE_PATH, str(pr_id), latest.name)
        return PRInfo(
            pr_id=pr_id,
            title="(cached)",
            sha=latest.name,
            state="unknown",
            local_path=str(latest),
            host_path=host_pr_path,
            author="unknown",
            branch="unknown",
        )

    def validate_pr(self, pr_id: int) -> bool:
        """Check if PR exists."""
        try:
            self._get_pr_info(pr_id)
            return True
        except PRNotFoundError:
            return False
        except PRFetchError:
            return False


# Singleton instance
pr_service = PRService()
