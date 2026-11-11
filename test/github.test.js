import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePrUrl, createClient } from "../src/github.js";

test("parsePrUrl reads owner, repo and number from PR pages and their subpaths", () => {
  assert.deepEqual(parsePrUrl("https://github.com/o/r/pull/12/files"), { owner: "o", repo: "r", number: 12 });
  assert.equal(parsePrUrl("https://github.com/o/r/issues/12"), null);
  assert.equal(parsePrUrl(undefined), null);
});

function fakeGitHub({ state = "open", merged = false, author = "alice", me = "bob" }) {
  const calls = [];
  const fetchFn = async (url, init = {}) => {
    calls.push({ url, init });
    const json = url.endsWith("/user") ? { login: me } : url.endsWith("/reviews") ? { id: 1 } : { state, merged, user: { login: author } };
    return { ok: true, json: async () => json };
  };
  return { calls, client: createClient("t", fetchFn) };
}

const pr = { owner: "o", repo: "r", number: 1 };

test("approvalBlocker refuses closed, merged and own PRs", async () => {
  assert.match(await fakeGitHub({ state: "closed" }).client.approvalBlocker(pr), /closed/);
  assert.match(await fakeGitHub({ state: "closed", merged: true }).client.approvalBlocker(pr), /merged/);
  assert.match(await fakeGitHub({ author: "bob" }).client.approvalBlocker(pr), /自分の PR/);
  assert.equal(await fakeGitHub({}).client.approvalBlocker(pr), null);
});

test("approve posts an APPROVE review with the given body", async () => {
  const { calls, client } = fakeGitHub({});
  await client.approve(pr, "LGTM");
  const [{ url, init }] = calls;
  assert.equal(url, "https://api.github.com/repos/o/r/pulls/1/reviews");
  assert.equal(init.method, "POST");
  assert.deepEqual(JSON.parse(init.body), { event: "APPROVE", body: "LGTM" });
});
