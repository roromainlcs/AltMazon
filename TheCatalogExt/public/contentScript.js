function injectButton() {
  const anchor = document.getElementById("buyNow_feature_div");
  if (!anchor || document.getElementById("TheCatalogBtn")) return;
  const btn = document.createElement("button");
  btn.type = "button";
  btn.id = "TheCatalogBtn";
  btn.textContent = "See other shops";
btn.style.cssText = `
  background-color: #0892a5;
  color: #0f1111;
  font-size: 14px;
  border: none;
  border-radius: 9999px;
  padding: 8px 0px;
  width: 100%;
  cursor: pointer;
  transition: background-color 0.2s ease;
  white-space: nowrap;
  margin-top: -4px;
  margin-bottom: 8px;
`;

btn.addEventListener("mouseover", () => {
  btn.style.backgroundColor = "#078394ff";
});

btn.addEventListener("mouseout", () => {
  btn.style.backgroundColor = "#0892a5";
});

anchor.insertAdjacentElement("afterend", btn);

  btn.addEventListener("click", async () => {
    chrome.runtime.sendMessage({ type: "open_popup" });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", injectButton);
} else {
  injectButton();
}