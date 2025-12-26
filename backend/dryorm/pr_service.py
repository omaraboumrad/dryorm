import os
import subprocess
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Optional, Literal

import httpx

logger = logging.getLogger(__name__)

# Base cache directory - now contains git repo and worktrees
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
    DJANGO_GIT_URL = "https://github.com/django/django.git"

    def __init__(self):
        self.cache_dir = REF_CACHE_DIR
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.git_repo_path = self.cache_dir / "django.git"
        self.worktrees_path = self.cache_dir / "worktrees"
        self.worktrees_path.mkdir(parents=True, exist_ok=True)

    def _get_headers(self) -> dict:
        headers = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        if GITHUB_TOKEN:
            headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"
        return headers

    def _run_git(self, *args, cwd=None) -> subprocess.CompletedProcess:
        """Run a git command and return the result."""
        cmd = ["git"] + list(args)
        logger.debug(f"Running: {' '.join(cmd)}")
        try:
            result = subprocess.run(
                cmd,
                cwd=cwd,
                capture_output=True,
                text=True,
                timeout=300,  # 5 min timeout for clone/fetch
            )
            if result.returncode != 0:
                logger.error(f"Git command failed: {result.stderr}")
            return result
        except subprocess.TimeoutExpired:
            raise RefFetchError("Git command timed out")

    def _ensure_repo_cloned(self):
        """Ensure the Django repo is cloned. Clone if not exists."""
        if self.git_repo_path.exists():
            return

        logger.info(f"Cloning Django repository to {self.git_repo_path}")
        result = self._run_git(
            "clone", "--bare", self.DJANGO_GIT_URL, str(self.git_repo_path)
        )
        if result.returncode != 0:
            raise RefFetchError(f"Failed to clone repository: {result.stderr}")

        # Configure the bare repo to fetch all refs including tags
        self._run_git(
            "config", "--add", "remote.origin.fetch",
            "+refs/heads/*:refs/heads/*",
            cwd=str(self.git_repo_path)
        )
        self._run_git(
            "config", "--add", "remote.origin.fetch",
            "+refs/tags/*:refs/tags/*",
            cwd=str(self.git_repo_path)
        )
        # Fetch all tags
        self._run_git("fetch", "--tags", "origin", cwd=str(self.git_repo_path))
        logger.info("Django repository cloned successfully")

    def _fetch_ref(self, refspec: str):
        """Fetch a specific ref from origin."""
        self._ensure_repo_cloned()
        logger.info(f"Fetching ref: {refspec}")
        result = self._run_git(
            "fetch", "origin", refspec,
            cwd=str(self.git_repo_path)
        )
        if result.returncode != 0:
            raise RefFetchError(f"Failed to fetch ref: {result.stderr}")

    def _get_worktree_path(self, ref_type: RefType, ref_id: str, sha: str) -> Path:
        """Get the worktree path for a ref. Includes SHA to handle updates."""
        safe_ref_id = ref_id.replace("/", "__")
        # For PRs and branches, include SHA since they can change
        # For tags, they're immutable so no SHA needed
        if ref_type == "tag":
            return self.worktrees_path / ref_type / safe_ref_id
        else:
            return self.worktrees_path / ref_type / safe_ref_id / sha[:12]

    def _ensure_worktree(self, ref_type: RefType, ref_id: str, sha: str, git_ref: str) -> Path:
        """Ensure a worktree exists for the given ref. Create if not exists."""
        worktree_path = self._get_worktree_path(ref_type, ref_id, sha)

        if worktree_path.exists():
            logger.info(f"Worktree already exists at {worktree_path}")
            return worktree_path

        # Create parent directories
        worktree_path.parent.mkdir(parents=True, exist_ok=True)

        logger.info(f"Creating worktree at {worktree_path} for {git_ref}")
        result = self._run_git(
            "worktree", "add", "--detach", str(worktree_path), sha,
            cwd=str(self.git_repo_path)
        )
        if result.returncode != 0:
            raise RefFetchError(f"Failed to create worktree: {result.stderr}")

        return worktree_path

    def _get_host_path(self, worktree_path: Path) -> str:
        """Convert local worktree path to host path for Docker mounting."""
        relative = worktree_path.relative_to(self.cache_dir)
        return os.path.join(HOST_REF_CACHE_PATH, str(relative))

    # ========== PR Methods ==========

    def fetch_pr(self, pr_id: int) -> RefInfo:
        """Fetch and cache a Django PR. Returns ref metadata."""
        pr_data = self._get_pr_info(pr_id)

        sha = pr_data["head"]["sha"]
        title = pr_data["title"]
        state = pr_data["state"]
        author = pr_data["user"]["login"]

        # Fetch the PR ref
        self._fetch_ref(f"pull/{pr_id}/head:refs/pr/{pr_id}")

        # Create/get worktree
        worktree_path = self._ensure_worktree("pr", str(pr_id), sha, f"refs/pr/{pr_id}")
        host_path = self._get_host_path(worktree_path)

        logger.info(f"PR {pr_id} ready at {worktree_path}")

        return RefInfo(
            ref_type="pr",
            ref_id=str(pr_id),
            title=title,
            sha=sha,
            state=state,
            local_path=str(worktree_path),
            host_path=host_path,
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
        pr_dir = self.worktrees_path / "pr" / str(pr_id)
        if not pr_dir.exists():
            return None

        # Find the latest SHA directory
        cached_shas = [d for d in pr_dir.iterdir() if d.is_dir()]
        if not cached_shas:
            return None

        latest = sorted(cached_shas, key=lambda d: d.stat().st_mtime, reverse=True)[0]
        host_path = self._get_host_path(latest)

        return RefInfo(
            ref_type="pr",
            ref_id=str(pr_id),
            title="(cached)",
            sha=latest.name,
            state="unknown",
            local_path=str(latest),
            host_path=host_path,
        )

    # ========== Branch Methods ==========

    def fetch_branch(self, branch_name: str) -> RefInfo:
        """Fetch and cache a Django branch. Returns ref metadata."""
        branch_data = self._get_branch_info(branch_name)

        sha = branch_data["commit"]["sha"]
        author = branch_data["commit"]["author"]["login"] if branch_data["commit"].get("author") else "unknown"

        # Fetch the branch
        safe_branch = branch_name.replace("/", "__")
        self._fetch_ref(f"{branch_name}:refs/heads/{safe_branch}")

        # Create/get worktree
        worktree_path = self._ensure_worktree("branch", branch_name, sha, f"refs/heads/{safe_branch}")
        host_path = self._get_host_path(worktree_path)

        logger.info(f"Branch {branch_name} ready at {worktree_path}")

        return RefInfo(
            ref_type="branch",
            ref_id=branch_name,
            title=branch_name,
            sha=sha,
            local_path=str(worktree_path),
            host_path=host_path,
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
        branch_dir = self.worktrees_path / "branch" / safe_branch_name
        if not branch_dir.exists():
            return None

        cached_shas = [d for d in branch_dir.iterdir() if d.is_dir()]
        if not cached_shas:
            return None

        latest = sorted(cached_shas, key=lambda d: d.stat().st_mtime, reverse=True)[0]
        host_path = self._get_host_path(latest)

        return RefInfo(
            ref_type="branch",
            ref_id=branch_name,
            title=branch_name,
            sha=latest.name,
            local_path=str(latest),
            host_path=host_path,
        )

    # ========== Tag Methods ==========

    def fetch_tag(self, tag_name: str) -> RefInfo:
        """Fetch and cache a Django tag. Returns ref metadata."""
        tag_data = self._get_tag_info(tag_name)

        sha = tag_data["commit"]["sha"]

        # Fetch the tag
        self._fetch_ref(f"refs/tags/{tag_name}:refs/tags/{tag_name}")

        # Create/get worktree (tags are immutable, so no SHA in path)
        worktree_path = self._ensure_worktree("tag", tag_name, sha, f"refs/tags/{tag_name}")
        host_path = self._get_host_path(worktree_path)

        logger.info(f"Tag {tag_name} ready at {worktree_path}")

        return RefInfo(
            ref_type="tag",
            ref_id=tag_name,
            title=tag_name,
            sha=sha,
            local_path=str(worktree_path),
            host_path=host_path,
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
        tag_path = self.worktrees_path / "tag" / safe_tag_name
        if not tag_path.exists():
            return None

        return RefInfo(
            ref_type="tag",
            ref_id=tag_name,
            title=tag_name,
            sha="cached",
            local_path=str(tag_path),
            host_path=self._get_host_path(tag_path),
        )

    # ========== Common Methods ==========

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

    # ========== Search Methods ==========

    def search_prs(self, query: str, limit: int = 10) -> list[dict]:
        """Search for Django PRs by number or title."""
        # If query is a number, search by PR number
        if query.isdigit():
            url = f"{self.GITHUB_API_BASE}/repos/{self.DJANGO_REPO}/pulls/{query}"
            try:
                with httpx.Client(timeout=10.0) as client:
                    response = client.get(url, headers=self._get_headers())
                    if response.status_code == 200:
                        pr = response.json()
                        return [{
                            "id": pr["number"],
                            "title": pr["title"],
                            "state": pr["state"],
                            "author": pr["user"]["login"],
                        }]
                    return []
            except httpx.HTTPError:
                return []

        # Otherwise search by title using GitHub search API
        url = f"{self.GITHUB_API_BASE}/search/issues"
        params = {
            "q": f"repo:{self.DJANGO_REPO} type:pr {query}",
            "per_page": limit,
            "sort": "updated",
            "order": "desc",
        }
        try:
            with httpx.Client(timeout=10.0) as client:
                response = client.get(url, headers=self._get_headers(), params=params)
                if response.status_code == 200:
                    data = response.json()
                    return [{
                        "id": item["number"],
                        "title": item["title"],
                        "state": item["state"],
                        "author": item["user"]["login"],
                    } for item in data.get("items", [])]
                return []
        except httpx.HTTPError:
            return []

    def search_branches(self, query: str, limit: int = 10) -> list[dict]:
        """Search for Django branches by name."""
        url = f"{self.GITHUB_API_BASE}/repos/{self.DJANGO_REPO}/branches"
        params = {"per_page": 100}  # Get more to filter client-side

        try:
            with httpx.Client(timeout=10.0) as client:
                response = client.get(url, headers=self._get_headers(), params=params)
                if response.status_code == 200:
                    branches = response.json()
                    # Filter by query (case-insensitive)
                    query_lower = query.lower()
                    filtered = [
                        {"name": b["name"], "sha": b["commit"]["sha"][:12]}
                        for b in branches
                        if query_lower in b["name"].lower()
                    ]
                    return filtered[:limit]
                return []
        except httpx.HTTPError:
            return []

    def search_tags(self, query: str, limit: int = 10) -> list[dict]:
        """Search for Django tags by name."""
        url = f"{self.GITHUB_API_BASE}/repos/{self.DJANGO_REPO}/tags"
        params = {"per_page": 100}  # Get more to filter client-side

        try:
            with httpx.Client(timeout=10.0) as client:
                response = client.get(url, headers=self._get_headers(), params=params)
                if response.status_code == 200:
                    tags = response.json()
                    # Filter by query (case-insensitive)
                    query_lower = query.lower()
                    filtered = [
                        {"name": t["name"], "sha": t["commit"]["sha"][:12]}
                        for t in tags
                        if query_lower in t["name"].lower()
                    ]
                    return filtered[:limit]
                return []
        except httpx.HTTPError:
            return []

    def cleanup_old_worktrees(self, max_age_days: int = 7):
        """Remove worktrees older than max_age_days. Call periodically to free disk space."""
        import time
        now = time.time()
        max_age_seconds = max_age_days * 24 * 60 * 60

        # Prune any stale worktree references first
        self._run_git("worktree", "prune", cwd=str(self.git_repo_path))

        for ref_type_dir in self.worktrees_path.iterdir():
            if not ref_type_dir.is_dir():
                continue
            for ref_dir in ref_type_dir.iterdir():
                if not ref_dir.is_dir():
                    continue
                # For tags, check the ref_dir itself
                # For PRs/branches, check SHA subdirectories
                if ref_type_dir.name == "tag":
                    if now - ref_dir.stat().st_mtime > max_age_seconds:
                        logger.info(f"Removing old worktree: {ref_dir}")
                        self._run_git(
                            "worktree", "remove", "--force", str(ref_dir),
                            cwd=str(self.git_repo_path)
                        )
                else:
                    for sha_dir in ref_dir.iterdir():
                        if sha_dir.is_dir() and now - sha_dir.stat().st_mtime > max_age_seconds:
                            logger.info(f"Removing old worktree: {sha_dir}")
                            self._run_git(
                                "worktree", "remove", "--force", str(sha_dir),
                                cwd=str(self.git_repo_path)
                            )


# Singleton instance
ref_service = RefService()

# Backwards compatibility
pr_service = ref_service
PRService = RefService
