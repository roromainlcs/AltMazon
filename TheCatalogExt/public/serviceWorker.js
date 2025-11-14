chrome.runtime.onMessage.addListener(async (msg) => {
  if (msg?.type === "open_popup") {
    // Requires Chrome 127+ for general extensions.
    await chrome.action.openPopup().catch(err => {
      // Optional: fallback UX if popup can’t open (e.g., not pinned)
      console.warn("openPopup failed:", err);
      return;
    });
    await chrome.storage.local.set({ view: "altShops" });
  }
});

const randomBytes = (len = 32) =>
  crypto.getRandomValues(new Uint8Array(len));

const base64url = (buf) =>
  btoa(String.fromCharCode(...buf))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function makePkcePair() {
  const verifier = base64url(randomBytes(64)); // 43–128 chars
  const enc = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', enc);
  const challenge = base64url(new Uint8Array(digest));
  return { verifier, challenge };
}

async function loginWithGoogle() {
  const { verifier, challenge } = await makePkcePair();
  const redirectUri = `https://${chrome.runtime.id}.chromiumapp.org/back`;
  console.log(verifier);

  // Optional but recommended protections
  const state = base64url(randomBytes(16));
  const nonce = base64url(randomBytes(16));

  const params = new URLSearchParams({
    client_id: "581551084472-ea10ridnrcj05ja5bj21500dn9v0co6m.apps.googleusercontent.com",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",        // get refresh token (requires prompt=consent)
    prompt: "consent",             // ensure refresh on first login
    code_challenge: challenge,
    code_challenge_method: "S256",
    state,
    nonce
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  // Opens a small window and returns the final redirect URL
  const redirect = await chrome.identity.launchWebAuthFlow({
    url: authUrl,
    interactive: true,
  });
  if (!redirect) throw new Error("No redirect URL");
  // Chrome gives you the full redirected URL:
  const u = new URL(redirect);
  if (u.searchParams.get("state") !== state) throw new Error("State mismatch");
  const code = u.searchParams.get("code");
  if (!code) throw new Error("No code in callback");

  console.log("Authorization code:", code);
  return { code, verifier, nonce };
  // Hand code + verifier to your backend for the token exchange
  // const res = await fetch("http://localhost:3001/api/auth", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({
  //     code,
  //     code_verifier: verifier,
  //     nonce
  //   }),
  // });

  // if (!res.ok) throw new Error("Exchange failed");
  // const data = await res.json(); // e.g., { ok: true, user: {...} }
  // console.log("Login response:", data);
  // return data;
}

// Example: start from popup by messaging the SW
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "login_google") {
    loginWithGoogle().then(
      (data) => sendResponse({ ok: true, data }),
      (err) => sendResponse({ ok: false, error: String(err) })
    );
    return true; // keep the message channel alive for async reply
  }
});