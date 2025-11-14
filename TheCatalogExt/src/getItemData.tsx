export interface IItemData {
  name: string;
  brandName: string;
  asin: string;
}

function sendDataAmazonSide() {
  const itemData: IItemData = {
    name: "none",
    brandName: "none",
    asin: "none",
  };

  function getAsin(): string {
    const xpath = "//th[contains(text(),'ASIN')]";
    const asinElement = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue as HTMLElement;
    if (asinElement)
      return((asinElement.parentElement?.children[1] as HTMLElement).innerText.replace(/\u200E/g, "").trim() || "none");
    return("none");
  }

  if (!document.URL.includes("amazon")) {
    chrome.runtime.sendMessage({ itemData: itemData });
    return;
  }
  const productTitle = document.getElementById("productTitle");
  const brandNameParent = document.getElementsByClassName("po-brand")[0];
  try {
    itemData.asin = getAsin();
  } catch (e: unknown) {
    console.error(e);
  }

  if (brandNameParent) {
    const brandName =
      brandNameParent.getElementsByClassName("po-break-word")[0];
    if (brandName)
      itemData.brandName = (brandName as HTMLElement).innerText.trim();
  }
  if (productTitle) itemData.name = productTitle.innerText.trim();
  chrome.runtime.sendMessage({ itemData: itemData });
}

export async function getItemData(): Promise<IItemData> {
  // return {
  //   name: "Advanced Clinicals Vitamin C, Advanced Brightening Cream, 16 oz (454 g)",
  //   brandName: "Advanced Clinicals",
  //   asin: "B01AMOTPI6",
  // };
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
    target: { tabId: tab.id! },
    func: sendDataAmazonSide,
  }, _=>{
    const e = chrome.runtime.lastError;
    if (e !== undefined) {
      console.error(tab.id, _, e);
    }
  });
  const itemData: IItemData = await new Promise((resolve) => {
    chrome.runtime.onMessage.addListener((message) => {
      resolve(message.itemData);
    });
  });
  // console.log(itemData);
  return itemData;
}
