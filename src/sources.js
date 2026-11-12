export const SOURCES = [
  {
    id: "lgtmeow",
    label: "LGTMeow（猫）",
    home: "https://lgtmeow.com",
    imageHost: "https://lgtm-images.lgtmeow.com/",
    async fetchUrls(fetchFn) {
      const images = await fetchJson(fetchFn, "https://lgtmeow.com/api/lgtm-images");
      return images.map((image) => image.imageUrl);
    },
  },
  {
    id: "lgtmoon",
    label: "LGTMoon",
    home: "https://lgtmoon.dev",
    imageHost: "https://image.lgtmoon.dev/",
    async fetchUrls(fetchFn) {
      const { images } = await fetchJson(fetchFn, "https://lgtmoon.dev/api/images/random");
      return images.map((image) => image.url);
    },
  },
];

export const DEFAULT_SOURCE_ID = SOURCES[0].id;

export function findSource(id) {
  return SOURCES.find((source) => source.id === id) ?? SOURCES[0];
}

export async function pickImageMarkdown(source, fetchFn = fetch, random = Math.random) {
  const urls = (await source.fetchUrls(fetchFn)).filter((url) => url?.startsWith(source.imageHost));
  if (urls.length === 0) throw new Error(`${source.label} から画像の URL を取れませんでした`);
  const url = urls[Math.floor(random() * urls.length)];
  return { url, markdown: `[![LGTM](${url})](${source.home})` };
}

async function fetchJson(fetchFn, url) {
  const res = await fetchFn(url);
  if (!res.ok) throw new Error(`${url} が ${res.status} を返しました`);
  return res.json();
}
