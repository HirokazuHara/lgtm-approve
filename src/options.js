const input = document.getElementById("token");
const status = document.getElementById("status");

chrome.storage.local.get("token").then(({ token }) => {
  input.value = token ?? "";
});

document.getElementById("save").addEventListener("click", async () => {
  const token = input.value.trim();
  if (!token) {
    await chrome.storage.local.remove("token");
    status.textContent = "トークンを削除しました";
    return;
  }
  const res = await fetch("https://api.github.com/user", { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    status.textContent = `トークンを確かめられませんでした（${res.status}）`;
    return;
  }
  const { login } = await res.json();
  await chrome.storage.local.set({ token });
  status.textContent = `${login} として保存しました`;
});
