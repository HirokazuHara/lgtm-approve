const API = "https://api.github.com";

export function parsePrUrl(url) {
  const match = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/.exec(url ?? "");
  if (!match) return null;
  return { owner: match[1], repo: match[2], number: Number(match[3]) };
}

export function createClient(token, fetchFn = fetch) {
  async function request(path, init = {}) {
    const res = await fetchFn(`${API}${path}`, {
      ...init,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
      },
    });
    if (!res.ok) {
      const { message } = await res.json().catch(() => ({}));
      throw new Error(`GitHub API ${res.status}: ${message ?? res.statusText}`);
    }
    return res.json();
  }

  return {
    async approvalBlocker(pr) {
      const [pull, me] = await Promise.all([
        request(`/repos/${pr.owner}/${pr.repo}/pulls/${pr.number}`),
        request("/user"),
      ]);
      if (pull.state !== "open") return `この PR は ${pull.merged ? "merged" : pull.state} なので Approve しません`;
      if (pull.user.login === me.login) return "自分の PR は Approve できません";
      return null;
    },
    approve(pr, body) {
      return request(`/repos/${pr.owner}/${pr.repo}/pulls/${pr.number}/reviews`, {
        method: "POST",
        body: JSON.stringify({ event: "APPROVE", body }),
      });
    },
  };
}
