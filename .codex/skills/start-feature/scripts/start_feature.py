#!/usr/bin/env python3

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from datetime import datetime


def run_git(args: list[str], *, capture_output: bool = False) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["git", *args],
        check=False,
        text=True,
        capture_output=capture_output,
    )


def ensure_git_ok(result: subprocess.CompletedProcess[str], action: str) -> None:
    if result.returncode == 0:
        return

    stderr = (result.stderr or "").strip()
    stdout = (result.stdout or "").strip()
    detail = stderr or stdout or "unknown git error"
    print(f"{action} failed: {detail}", file=sys.stderr)
    raise SystemExit(result.returncode)


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    slug = re.sub(r"-{2,}", "-", slug)
    if not slug:
        raise SystemExit("feature description must contain at least one letter or number")
    return slug


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Update main and create a Mohio feature branch."
    )
    parser.add_argument("description", help="Human-readable feature description")
    parser.add_argument(
        "--date",
        dest="date_override",
        help="Override the branch date in YYYYMMDD format",
    )
    parser.add_argument(
        "--base",
        default="main",
        help="Base branch to update before creating the feature branch",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print the branch name and git steps without making changes",
    )
    return parser.parse_args()


def validate_date(raw: str | None) -> str:
    if raw is None:
        return datetime.now().strftime("%Y%m%d")

    try:
        return datetime.strptime(raw, "%Y%m%d").strftime("%Y%m%d")
    except ValueError as exc:
        raise SystemExit("--date must use YYYYMMDD format") from exc


def ensure_clean_worktree() -> None:
    status = run_git(["status", "--short"], capture_output=True)
    ensure_git_ok(status, "git status --short")
    if status.stdout.strip():
        print("worktree is not clean; commit, stash, or otherwise resolve local changes first", file=sys.stderr)
        raise SystemExit(2)


def ensure_branch_missing(branch_name: str) -> None:
    result = run_git(["rev-parse", "--verify", "--quiet", branch_name])
    if result.returncode == 0:
        print(f"branch already exists: {branch_name}", file=sys.stderr)
        raise SystemExit(3)


def main() -> None:
    args = parse_args()
    date_part = validate_date(args.date_override)
    slug = slugify(args.description)
    branch_name = f"feature-{date_part}-{slug}"

    if args.dry_run:
        print(branch_name)
        print(f"git switch {args.base}")
        print(f"git fetch origin {args.base}")
        print(f"git pull --ff-only origin {args.base}")
        print(f"git switch -c {branch_name}")
        return

    ensure_clean_worktree()
    ensure_branch_missing(branch_name)

    ensure_git_ok(run_git(["switch", args.base]), f"git switch {args.base}")
    ensure_git_ok(run_git(["fetch", "origin", args.base]), f"git fetch origin {args.base}")
    ensure_git_ok(
        run_git(["pull", "--ff-only", "origin", args.base]),
        f"git pull --ff-only origin {args.base}",
    )
    ensure_git_ok(run_git(["switch", "-c", branch_name]), f"git switch -c {branch_name}")

    print(branch_name)


if __name__ == "__main__":
    main()
