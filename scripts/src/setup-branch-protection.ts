/**
 * setup-branch-protection.ts
 *
 * Configures a GitHub branch protection rule on `main` that requires the
 * "Typecheck & Build" CI status check to pass before any pull request can
 * be merged.
 *
 * The script fetches any existing branch-protection settings first and
 * merges in the required status check, so it will NOT accidentally remove
 * other protections (e.g. required reviewers, admin enforcement) that are
 * already in place.
 *
 * ─── Prerequisites ────────────────────────────────────────────────────────────
 * Set two environment variables before running:
 *
 *   export GITHUB_TOKEN="ghp_..."          # Personal Access Token with 'repo'
 *                                          # scope (classic), or a fine-grained
 *                                          # token with Administration read/write
 *   export GITHUB_REPOSITORY="owner/repo" # e.g. "acme-inc/my-app"
 *
 * ─── Run ──────────────────────────────────────────────────────────────────────
 *   pnpm --filter @workspace/scripts run setup-branch-protection
 *
 * ─── Alternative: GitHub UI steps ────────────────────────────────────────────
 *   1. Open your repository on github.com.
 *   2. Go to Settings → Branches → "Add branch protection rule".
 *   3. Branch name pattern: main
 *   4. Check "Require status checks to pass before merging".
 *   5. In the search box, type and select: Typecheck & Build
 *   6. Check "Require branches to be up to date before merging" (recommended).
 *   7. Click "Create" (or "Save changes").
 */

const BRANCH = "main";
const REQUIRED_CHECK = "Typecheck & Build";

const token = process.env.GITHUB_TOKEN;
const repo = process.env.GITHUB_REPOSITORY;

if (!token || !repo) {
  console.error(
    "ERROR: GITHUB_TOKEN and GITHUB_REPOSITORY must both be set.\n\n" +
      "  export GITHUB_TOKEN='ghp_...'           # token with repo scope\n" +
      "  export GITHUB_REPOSITORY='owner/repo'   # e.g. acme-inc/my-app\n\n" +
      "Then run:\n" +
      "  pnpm --filter @workspace/scripts run setup-branch-protection"
  );
  process.exit(1);
}

const apiBase = "https://api.github.com";
const headers: Record<string, string> = {
  Authorization: `Bearer ${token}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "Content-Type": "application/json",
};

interface GitHubStatusCheck {
  context: string;
  app_id?: number | null;
}

interface ExistingProtection {
  required_status_checks?: {
    strict: boolean;
    checks: GitHubStatusCheck[];
  } | null;
  enforce_admins?: { enabled: boolean } | null;
  required_pull_request_reviews?: {
    dismissal_restrictions?: {
      users?: { login: string }[];
      teams?: { slug: string }[];
    };
    dismiss_stale_reviews?: boolean;
    require_code_owner_reviews?: boolean;
    required_approving_review_count?: number;
    require_last_push_approval?: boolean;
  } | null;
  restrictions?: {
    users: { login: string }[];
    teams: { slug: string }[];
    apps?: { slug: string }[];
  } | null;
  required_conversation_resolution?: { enabled: boolean } | null;
  required_linear_history?: { enabled: boolean } | null;
  allow_force_pushes?: { enabled: boolean } | null;
  allow_deletions?: { enabled: boolean } | null;
}

async function fetchExistingProtection(): Promise<ExistingProtection | null> {
  const url = `${apiBase}/repos/${repo}/branches/${BRANCH}/protection`;
  const res = await fetch(url, { headers });

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    const body = await res.text();
    console.error(
      `ERROR: Could not read existing branch protection (HTTP ${res.status}).\n` +
        `  GitHub response: ${body}`
    );
    process.exit(1);
  }

  return (await res.json()) as ExistingProtection;
}

function buildPutBody(existing: ExistingProtection | null): Record<string, unknown> {
  const existingChecks: GitHubStatusCheck[] = existing?.required_status_checks?.checks ?? [];

  const alreadyPresent = existingChecks.some((c) => c.context === REQUIRED_CHECK);
  const mergedChecks: GitHubStatusCheck[] = alreadyPresent
    ? existingChecks
    : [...existingChecks, { context: REQUIRED_CHECK }];

  const existingReviews = existing?.required_pull_request_reviews;
  let reviews: Record<string, unknown> | null = null;
  if (existingReviews) {
    reviews = {
      dismiss_stale_reviews: existingReviews.dismiss_stale_reviews ?? false,
      require_code_owner_reviews: existingReviews.require_code_owner_reviews ?? false,
      required_approving_review_count:
        existingReviews.required_approving_review_count ?? 0,
      require_last_push_approval: existingReviews.require_last_push_approval ?? false,
    };
    if (existingReviews.dismissal_restrictions) {
      reviews.dismissal_restrictions = {
        users: existingReviews.dismissal_restrictions.users?.map((u) => u.login) ?? [],
        teams: existingReviews.dismissal_restrictions.teams?.map((t) => t.slug) ?? [],
      };
    }
  }

  const existingRestrictions = existing?.restrictions;
  let restrictions: Record<string, unknown> | null = null;
  if (existingRestrictions) {
    restrictions = {
      users: existingRestrictions.users?.map((u) => u.login) ?? [],
      teams: existingRestrictions.teams?.map((t) => t.slug) ?? [],
      apps: existingRestrictions.apps?.map((a) => a.slug) ?? [],
    };
  }

  return {
    required_status_checks: {
      strict: existing?.required_status_checks?.strict ?? true,
      checks: mergedChecks,
    },
    enforce_admins: existing?.enforce_admins?.enabled ?? true,
    required_pull_request_reviews: reviews,
    restrictions,
    required_conversation_resolution:
      existing?.required_conversation_resolution?.enabled ?? false,
    required_linear_history: existing?.required_linear_history?.enabled ?? false,
    allow_force_pushes: existing?.allow_force_pushes?.enabled ?? false,
    allow_deletions: existing?.allow_deletions?.enabled ?? false,
  };
}

async function applyBranchProtection(): Promise<void> {
  console.log(`Repository : ${repo}`);
  console.log(`Branch     : ${BRANCH}`);
  console.log(`Required check: "${REQUIRED_CHECK}"\n`);

  const existing = await fetchExistingProtection();

  if (existing) {
    const currentChecks = existing.required_status_checks?.checks ?? [];
    const names = currentChecks.map((c) => `"${c.context}"`).join(", ") || "(none)";
    console.log(`Existing required checks: ${names}`);
    console.log("Merging in new check — existing settings will be preserved.\n");
  } else {
    console.log("No existing branch protection found — creating a new rule.\n");
  }

  const body = buildPutBody(existing);

  const url = `${apiBase}/repos/${repo}/branches/${BRANCH}/protection`;
  const response = await fetch(url, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  });

  if (response.ok) {
    const finalChecks = (
      body.required_status_checks as { checks: GitHubStatusCheck[] }
    ).checks
      .map((c) => `"${c.context}"`)
      .join(", ");

    console.log("Branch protection updated successfully.");
    console.log(`  Required checks now: ${finalChecks}`);
    console.log(
      `  PRs targeting '${BRANCH}' must pass all listed checks before merging.`
    );
    return;
  }

  const errorBody = await response.text();

  if (response.status === 403) {
    console.error(
      `ERROR: 403 Forbidden — the token lacks permission to update branch protection.\n` +
        `  Classic token: ensure the 'repo' scope is granted.\n` +
        `  Fine-grained token: ensure "Administration" read/write permission is set.\n\n` +
        `  GitHub response: ${errorBody}`
    );
    process.exit(1);
  }

  if (response.status === 404) {
    console.error(
      `ERROR: 404 Not Found — branch '${BRANCH}' not found in ${repo}.\n` +
        `  Verify GITHUB_REPOSITORY is correct and the branch exists.\n\n` +
        `  GitHub response: ${errorBody}`
    );
    process.exit(1);
  }

  console.error(
    `ERROR: GitHub API returned HTTP ${response.status}.\n\n` +
      `  GitHub response: ${errorBody}`
  );
  process.exit(1);
}

applyBranchProtection().catch((err: unknown) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
