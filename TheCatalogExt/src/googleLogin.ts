import { codeAuth, refreshAuthTokens } from "./backRequest";

export interface IUserInfo {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  email_verified: boolean;
  locale: string;
}

export async function checkTokens() {
  const access_token = localStorage.getItem("access_token");
  const expires_at = Number(localStorage.getItem("expires_at"));

  if (access_token) {
    const nowInSeconds = Math.floor(Date.now() / 1000);
    const nowPlus60 = nowInSeconds + 60;

    // expired or will expire in the next 60 seconds
    if (expires_at <= nowPlus60) {
      try {
        await refreshAuthTokens();
        const new_access_token = localStorage.getItem("access_token");
        if (access_token === new_access_token) {
           console.error("Failed to refresh tokens");
            return undefined;
        }
      } catch (error) {
        console.error("Error refreshing tokens:", error);
      }
      console.log("Access token refreshed");
    }
    return access_token;
  }
  return undefined;
}

export async function getUserInfo(): Promise<IUserInfo | undefined> {
  const access_token = await checkTokens();
  if (!access_token)
    return undefined;
  const res = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`);
  return await res.json();
}

async function getTokens(setUserInfo: (userInfo: IUserInfo | undefined) => void, codeAuthData: { code: string; verifier?: string; nonce?: string }) {
  try {
    console.log("codeAuthData:", codeAuthData);
    await codeAuth(codeAuthData.code, codeAuthData.verifier, codeAuthData.nonce);
    const userInfo = await getUserInfo();
    if (!userInfo)
      throw { error: "No userInfo" }
    setUserInfo(userInfo);
  } catch (error) {
    console.error(`error-googleLogin`, error)
  }
}

export async function googleLogin(setUserInfo: (userInfo: IUserInfo | undefined) => void) {
  const codeAuthDataString = localStorage.getItem('codeAuthData');

  if (codeAuthDataString !== null) {
    localStorage.removeItem('codeAuthData');
    await getTokens(setUserInfo, JSON.parse(codeAuthDataString));
  } else {
    chrome.runtime.sendMessage({ type: "login_google" }, (response) => {
      if (response && response.ok && response.data) {
        console.log("res data:", response.data);
        isGoogleChrome().then((isChrome) => {
          if (isChrome)
            localStorage.setItem("codeAuthData", JSON.stringify(response.data));
          else
            getTokens(setUserInfo, response.data);
        });
      }
    });
  }
}

// async function launchWebAuthFlow_and_getCode(googleOAuthClientId?: string) {
//   const manifest = chrome.runtime.getManifest()
//   const { url } = generateBaseUrl_and_redirectUri(googleOAuthClientId)
//   if (!manifest.oauth2 || !manifest.oauth2.scopes) throw { error: "No scopes" }
  
//   url.searchParams.set("response_type", "code")
//   url.searchParams.set("access_type", "offline")
//   url.searchParams.set("scope", manifest.oauth2.scopes.join(" "))
//   url.searchParams.set("prompt", "consent")

//   const authorizeResult: string | undefined = await new Promise((resolve) => {
//     chrome.identity.launchWebAuthFlow(
//       { url: url.href, interactive: true },
//       (callbackUrl) => resolve(callbackUrl)
//     )
//   })
//   if (!authorizeResult)
//     throw { error: "No authorizeResult" }
//   const encodedCode = authorizeResult?.split("code=")[1].split("&")[0]
//   // code is url encoded
//   return decodeURIComponent(encodedCode)
//   }

// function generateBaseUrl_and_redirectUri(googleOAuthClientId?: string) {
//   const manifest = chrome.runtime.getManifest()
//   if (!manifest.oauth2 || !manifest.oauth2.client_id) throw { error: "No scopes" }

//   const url = new URL("https://accounts.google.com/o/oauth2/auth")

//   if (googleOAuthClientId) {
//     url.searchParams.set("client_id", googleOAuthClientId)
//   } else {
//     url.searchParams.set("client_id", manifest.oauth2.client_id)
//     const redirectUri = chrome.identity.getRedirectURL("back")
//     url.searchParams.set("redirect_uri", redirectUri)
//   }

//   return { url }
// }

async function isGoogleChrome() {
  // userAgentData may not be present in some TypeScript lib.dom typings; define a safe type and use it
  interface UAData {
    brands?: Array<{ brand: string; version?: string }>;
  }
  const nav = navigator as Navigator & { userAgentData?: UAData };
  const brands = nav.userAgentData?.brands ?? [];
  const isChromeBrand = brands.some((b: { brand: string }) => b.brand === 'Google Chrome');

  console.log("brands:", brands, "isChromeBrand:", isChromeBrand);
  // Fallback for older Chromium versions
  // const ua = navigator.userAgent;
  // const isChromeUA =
  //   ua.includes('Chrome') &&
  //   !ua.includes('Chromium') &&
  //   !ua.includes('Edg') &&
  //   !ua.includes('OPR') &&
  //   !ua.includes('Brave');

  return isChromeBrand;// || isChromeUA;
}