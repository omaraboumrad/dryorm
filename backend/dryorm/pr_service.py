import os
import tarfile
import shutil
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Optional, Literal

import httpx

logger = logging.getLogger(__name__)

REF_CACHE_DIR = Path(os.environ.get("PR_CACHE_DIR", "/app/pr_cache"))
HOST_REF_CACHE_PATH = os.environ.get("HOST_PR_CACHE_PATH", "/app/pr_cache")
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")

RefType = Literal["pr", "branch", "tag"]


@dataclass
class RefInfo:
    """Information about a Git reference (PR, branch, or tag)."""
    ref_type: RefType
    ref_id: str  # PR number, branch name, or tag name
    title: str
    sha: str
    local_path: str  # Path inside container
    host_path: str   # Path on Docker host for volume mounting
    author: str = ""
    state: str = ""  # For PRs: open/closed/merged


# Backwards compatibility aliases
PRInfo = RefInfo


class RefServiceError(Exception):
    """Base exception for ref service errors."""
    pass


class RefNotFoundError(RefServiceError):
    """Raised when a ref is not found."""
    pass


class RefFetchError(RefServiceError):
    """Raised when fetching ref source fails."""
    pass


# Backwards compatibility aliases
PRServiceError = RefServiceError
PRNotFoundError = RefNotFoundError
PRFetchError = RefFetchError


class RefService:
    GITHUB_API_BASE = "https://api.github.com"
    DJANGO_REPO = "django/django"

    def __init__(self):
        self.cache_dir = REF_CACHE_DIR
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def _get_headers(self) -> dict:
        headers = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        if GITHUB_TOKEN:
            headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"
        return headers

    # ========== PR Methods ==========

    def fetch_pr(self, pr_id: int) -> RefInfo:
        """Fetch and cache a Django PR. Returns ref metadata."""
        pr_data = self._get_pr_info(pr_id)

        sha = pr_data["head"]["sha"]
        title = pr_data["title"]
        state = pr_data["state"]
        author = pr_data["user"]["login"]

        # Cache structure: pr/{pr_id}/{sha}/
        ref_path = self.cache_dir / "pr" / str(pr_id) / sha
        host_ref_path = os.path.join(HOST_REF_CACHE_PATH, "pr", str(pr_id), sha)

        if ref_path.exists():
            logger.info(f"PR {pr_id} already cached at {ref_path}")
        else:
            self._download_source(sha, ref_path)
            logger.info(f"PR {pr_id} source cached at {ref_path}")

        return RefInfo(
            ref_type="pr",
            ref_id=str(pr_id),
            title=title,
            sha=sha,
            state=state,
            local_path=str(ref_path),
            host_path=host_ref_path,
            author=author,
        )

    def _get_pr_info(self, pr_id: int) -> dict:
        """Get PR metadata from GitHub API."""
        url = f"{self.GITHUB_API_BASE}/repos/{self.DJANGO_REPO}/pulls/{pr_id}"

        try:
            with httpx.Client(timeout=30.0) as client:
                response = client.get(url, headers=self._get_headers())

                if response.status_code == 404:
                    raise RefNotFoundError(f"PR #{pr_id} not found")
                if response.status_code == 403:
                    raise RefFetchError("GitHub API rate limit exceeded")

                response.raise_for_status()
                return response.json()
        except httpx.HTTPError as e:
            raise RefFetchError(f"Failed to fetch PR info: {e}")

    def get_cached_pr(self, pr_id: int) -> Optional[RefInfo]:
        """Get cached PR info if exists."""
        pr_dir = self.cache_dir / "pr" / str(pr_id)
        if not pr_dir.exists():
            return None

        cached_shas = [d for d in pr_dir.iterdir() if d.is_dir()]
        if not cached_shas:
            return None

        latest = cached_shas[0]
        host_ref_path = os.path.join(HOST_REF_CACHE_PATH, "pr", str(pr_id), latest.name)
        return RefInfo(
            ref_type="pr",
            ref_id=str(pr_id),
            title="(cached)",
            sha=latest.name,
            state="unknown",
            local_path=str(latest),
            host_path=host_ref_path,
        )

    # ========== Branch Methods ==========

    def fetch_branch(self, branch_name: str) -> RefInfo:
        """Fetch and cache a Django branch. Returns ref metadata."""
        branch_data = self._get_branch_info(branch_name)

        sha = branch_data["commit"]["sha"]
        author = branch_data["commit"]["author"]["login"] if branch_data["commit"].get("author") else "unknown"

        # Cache structure: branch/{branch_name}/{sha}/
        safe_branch_name = branch_name.replace("/", "__")
        ref_path = self.cache_dir / "branch" / safe_branch_name / sha
        host_ref_path = os.path.join(HOST_REF_CACHE_PATH, "branch", safe_branch_name, sha)

        if ref_path.exists():
            logger.info(f"Branch {branch_name} already cached at {ref_path}")
        else:
            self._download_source(sha, ref_path)
            logger.info(f"Branch {branch_name} source cached at {ref_path}")

        return RefInfo(
            ref_type="branch",
            ref_id=branch_name,
            title=branch_name,
            sha=sha,
            local_path=str(ref_path),
            host_path=host_ref_path,
            author=author,
        )

    def _get_branch_info(self, branch_name: str) -> dict:
        """Get branch metadata from GitHub API."""
        url = f"{self.GITHUB_API_BASE}/repos/{self.DJANGO_REPO}/branches/{branch_name}"

        try:
            with httpx.Client(timeout=30.0) as client:
                response = client.get(url, headers=self._get_headers())

                if response.status_code == 404:
                    raise RefNotFoundError(f"Branch '{branch_name}' not found")
                if response.status_code == 403:
                    raise RefFetchError("GitHub API rate limit exceeded")

                response.raise_for_status()
                return response.json()
        except httpx.HTTPError as e:
            raise RefFetchError(f"Failed to fetch branch info: {e}")

    def get_cached_branch(self, branch_name: str) -> Optional[RefInfo]:
        """Get cached branch info if exists."""
        safe_branch_name = branch_name.replace("/", "__")
        branch_dir = self.cache_dir / "branch" / safe_branch_name
        if not branch_dir.exists():
            return None

        cached_shas = [d for d in branch_dir.iterdir() if d.is_dir()]
        if not cached_shas:
            return None

        latest = cached_shas[0]
        host_ref_path = os.path.join(HOST_REF_CACHE_PATH, "branch", safe_branch_name, latest.name)
        return RefInfo(
            ref_type="branch",
            ref_id=branch_name,
            title=branch_name,
            sha=latest.name,
            local_path=str(latest),
            host_path=host_ref_path,
        )

    # ========== Tag Methods ==========

    def fetch_tag(self, tag_name: str) -> RefInfo:
        """Fetch and cache a Django tag. Returns ref metadata."""
        tag_data = self._get_tag_info(tag_name)

        sha = tag_data["commit"]["sha"]

        # Cache structure: tag/{tag_name}/  (tags are immutable, no SHA subdirectory needed)
        safe_tag_name = tag_name.replace("/", "__")
        ref_path = self.cache_dir / "tag" / safe_tag_name
        host_ref_path = os.path.join(HOST_REF_CACHE_PATH, "tag", safe_tag_name)

        if ref_path.exists():
            logger.info(f"Tag {tag_name} already cached at {ref_path}")
        else:
            self._download_source(sha, ref_path)
            logger.info(f"Tag {tag_name} source cached at {ref_path}")

        return RefInfo(
            ref_type="tag",
            ref_id=tag_name,
            title=tag_name,
            sha=sha,
            local_path=str(ref_path),
            host_path=host_ref_path,
        )

    def _get_tag_info(self, tag_name: str) -> dict:
        """Get tag metadata from GitHub API."""
        # First try to get the tag ref
        url = f"{self.GITHUB_API_BASE}/repos/{self.DJANGO_REPO}/git/refs/tags/{tag_name}"

        try:
            with httpx.Client(timeout=30.0) as client:
                response = client.get(url, headers=self._get_headers())

                if response.status_code == 404:
                    raise RefNotFoundError(f"Tag '{tag_name}' not found")
                if response.status_code == 403:
                    raise RefFetchError("GitHub API rate limit exceeded")

                response.raise_for_status()
                ref_data = response.json()

                # If it's an annotated tag, we need to dereference it
                if ref_data["object"]["type"] == "tag":
                    tag_sha = ref_data["object"]["sha"]
                    tag_url = f"{self.GITHUB_API_BASE}/repos/{self.DJANGO_REPO}/git/tags/{tag_sha}"
                    tag_response = client.get(tag_url, headers=self._get_headers())
                    tag_response.raise_for_status()
                    tag_obj = tag_response.json()
                    return {"commit": {"sha": tag_obj["object"]["sha"]}}
                else:
                    # Lightweight tag - points directly to commit
                    return {"commit": {"sha": ref_data["object"]["sha"]}}

        except httpx.HTTPError as e:
            raise RefFetchError(f"Failed to fetch tag info: {e}")

    def get_cached_tag(self, tag_name: str) -> Optional[RefInfo]:
        """Get cached tag info if exists."""
        safe_tag_name = tag_name.replace("/", "__")
        tag_path = self.cache_dir / "tag" / safe_tag_name
        if not tag_path.exists():
            return None

        # For tags, we need to read the SHA from a metadata file or just return unknown
        return RefInfo(
            ref_type="tag",
            ref_id=tag_name,
            title=tag_name,
            sha="cached",
            local_path=str(tag_path),
            host_path=os.path.join(HOST_REF_CACHE_PATH, "tag", safe_tag_name),
        )

    # ========== Common Methods ==========

    def _download_source(self, sha: str, target_path: Path):
        """Download and extract source tarball for a given SHA."""
        tarball_url = f"https://github.com/{self.DJANGO_REPO}/archive/{sha}.tar.gz"

        try:
            with httpx.Client(timeout=120.0, follow_redirects=True) as client:
                response = client.get(tarball_url, headers=self._get_headers())
                response.raise_for_status()

                # Create parent directory
                target_path.parent.mkdir(parents=True, exist_ok=True)

                # Save tarball temporarily
                tarball_path = target_path.parent / f"{sha}.tar.gz"
                tarball_path.write_bytes(response.content)

                # Extract tarball
                temp_extract = target_path.parent / f"{sha}_temp"
                with tarfile.open(tarball_path, "r:gz") as tar:
                    tar.extractall(temp_extract)

                # Move the extracted django directory to target
                extracted_dirs = list(temp_extract.iterdir())
                if extracted_dirs:
                    shutil.move(str(extracted_dirs[0]), str(target_path))

                # Cleanup
                tarball_path.unlink()
                if temp_extract.exists():
                    shutil.rmtree(temp_extract)

        except httpx.HTTPError as e:
            raise RefFetchError(f"Failed to download source: {e}")
        except (tarfile.TarError, OSError) as e:
            raise RefFetchError(f"Failed to extract source: {e}")

    def fetch_ref(self, ref_type: RefType, ref_id: str) -> RefInfo:
        """Generic method to fetch any ref type."""
        if ref_type == "pr":
            return self.fetch_pr(int(ref_id))
        elif ref_type == "branch":
            return self.fetch_branch(ref_id)
        elif ref_type == "tag":
            return self.fetch_tag(ref_id)
        else:
            raise ValueError(f"Unknown ref type: {ref_type}")

    def get_cached_ref(self, ref_type: RefType, ref_id: str) -> Optional[RefInfo]:
        """Generic method to get cached ref."""
        if ref_type == "pr":
            return self.get_cached_pr(int(ref_id))
        elif ref_type == "branch":
            return self.get_cached_branch(ref_id)
        elif ref_type == "tag":
            return self.get_cached_tag(ref_id)
        else:
            raise ValueError(f"Unknown ref type: {ref_type}")


# Singleton instance
ref_service = RefService()

# Backwards compatibility
pr_service = ref_service
PRService = RefService
