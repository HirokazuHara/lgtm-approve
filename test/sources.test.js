import { test } from "node:test";
import assert from "node:assert/strict";
import { SOURCES, findSource, pickImageMarkdown } from "../src/sources.js";

for (const source of SOURCES) {
  test(`${source.id} returns a reachable image from its live API`, async () => {
    const { url, markdown } = await pickImageMarkdown(source);
    assert.ok(url.startsWith(source.imageHost), url);
    assert.equal(markdown, `[![LGTM](${url})](${source.home})`);
    const res = await fetch(url, { method: "HEAD" });
    assert.ok(res.ok && res.headers.get("content-type").startsWith("image/"), `${url} ${res.status}`);
  });
}

test("pickImageMarkdown rejects URLs outside the source's image host", async () => {
  const fetchFn = async () => ({ ok: true, json: async () => [{ imageUrl: "https://evil.example/x.png" }] });
  await assert.rejects(pickImageMarkdown(findSource("lgtmeow"), fetchFn), /画像の URL を取れませんでした/);
});

test("findSource falls back to the first source for unknown ids", () => {
  assert.equal(findSource("gone").id, SOURCES[0].id);
});
