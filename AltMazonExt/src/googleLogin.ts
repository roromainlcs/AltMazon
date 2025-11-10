import { codeAuth, backend_url } from "./backRequest";

export interface IUserInfo {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  email: string;
  email_verified: boolean;
  locale: string;
}

export async function getToken() {
  const access_token = localStorage.getItem("access_token");
  const refresh_token = localStorage.getItem("refresh_token");
  const expires_at = Number(localStorage.getItem("expires_at"));

  if (access_token) {
    const nowInSeconds = Math.floor(Date.now() / 1000);
    const nowPlus60 = nowInSeconds + 60;

    // expired or will expire in the next 60 seconds
    if (expires_at <= nowPlus60) {
      console.log("Access token expired, refreshing...");
      const response = await fetch(`${backend_url}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refresh_token: refresh_token,
        }),
      });

      if (response.ok) {
        const { access_token, expires_at } = await response.json();
        localStorage.setItem("access_token", access_token);
        localStorage.setItem("expires_at", expires_at);

        console.log("Access token refreshed");
        return access_token;

      } else {
        const data = await response.json();
        console.error("request failed: ", data);
      }
    } else {
      //console.log("Access token is still valid");
      return access_token;
    }
  }
  return undefined;
}

export async function getUserInfo(): Promise<IUserInfo | undefined> {
  const access_token = await getToken();
  if (!access_token)
    return undefined;
  const res = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`);
  return await res.json();
}

export async function googleLogin(setUserInfo: (userInfo: IUserInfo | undefined) => void) {
  try {
    if (!localStorage.getItem("access_token")) {
      const code = (await launchWebAuthFlow_and_getCode());
      if (!code)
        throw { error: "No code" }
      await codeAuth(code);
    }
    const userInfo = await getUserInfo();
    if (!userInfo)
      throw { error: "No userInfo" }
    setUserInfo(userInfo);
  } catch (error) {
    console.error(`error-googleLogin`, error)
  }
}

async function launchWebAuthFlow_and_getCode() {
  const manifest = chrome.runtime.getManifest()
  const { url } = generateBaseUrl_and_redirectUri()
  if (!manifest.oauth2 || !manifest.oauth2.scopes) throw { error: "No scopes" }
  
  url.searchParams.set("response_type", "code")
  url.searchParams.set("access_type", "offline")
  url.searchParams.set("scope", manifest.oauth2.scopes.join(" "))
  url.searchParams.set("prompt", "consent")

  const authorizeResult: string | undefined = await new Promise((resolve) => {
    chrome.identity.launchWebAuthFlow(
      { url: url.href, interactive: true },
      (callbackUrl) => resolve(callbackUrl)
    )
  })
  if (!authorizeResult)
    throw { error: "No authorizeResult" }
  const encodedCode = authorizeResult?.split("code=")[1].split("&")[0]
  // code is url encoded
  return decodeURIComponent(encodedCode)
  }

function generateBaseUrl_and_redirectUri() {
const manifest = chrome.runtime.getManifest()
if (!manifest.oauth2 || !manifest.oauth2.client_id) throw { error: "No scopes" }

// https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow#redirecting
const url = new URL("https://accounts.google.com/o/oauth2/auth")

const redirectUri = chrome.identity.getRedirectURL("back")

url.searchParams.set("client_id", manifest.oauth2.client_id)
url.searchParams.set("redirect_uri", redirectUri)

return { url }
}