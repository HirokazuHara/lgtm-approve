import { SOURCES, DEFAULT_SOURCE_ID, findSource, pickImageMarkdown } from "./sources.js";
import { parsePrUrl, createClient } from "./github.js";

const $ = (id) => document.getElementById(id);
const sourceSelect = $("source");
const image = $("image");
const approveButton = $("approve");
const status = $("status");

let pr = null;
let client = null;
let picked = null;

function show(message, isError = false) {
  status.textContent = message;
  status.classList.toggle("error", isError);
}

async function pick() {
  picked = null;
  image.removeAttribute("src");
  approveButton.disabled = true;
  const source = findSource(sourceSelect.value);
  try {
    picked = await pickImageMarkdown(source);
    image.src = picked.url;
    approveButton.textContent = "Approve";
    show("");
  } catch (error) {
    approveButton.textContent = "画像なしで Approve";
    show(error.message, true);
  }
  approveButton.disabled = !client;
}

async function approve() {
  approveButton.disabled = true;
  try {
    const blocker = await client.approvalBlocker(pr);
    if (blocker) return show(blocker, true);
    await client.approve(pr, picked?.markdown ?? "LGTM");
    show("Approve しました");
  } catch (error) {
    show(error.message, true);
    approveButton.disabled = false;
  }
}

async function init() {
  const { token, sourceId = DEFAULT_SOURCE_ID } = await chrome.storage.local.get(["token", "sourceId"]);
  for (const source of SOURCES) sourceSelect.add(new Option(source.label, source.id));
  sourceSelect.value = findSource(sourceId).id;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  pr = parsePrUrl(tab?.url);
  $("pr").textContent = pr ? `${pr.owner}/${pr.repo}#${pr.number}` : "GitHub の PR ページで開いてください";
  if (pr && token) client = createClient(token);
  if (pr && !token) {
    show("設定画面で GitHub のトークンを登録してください", true);
    chrome.runtime.openOptionsPage();
  }

  sourceSelect.addEventListener("change", () => {
    chrome.storage.local.set({ sourceId: sourceSelect.value });
    pick();
  });
  $("shuffle").addEventListener("click", pick);
  approveButton.addEventListener("click", approve);
  await pick();
}

init();
