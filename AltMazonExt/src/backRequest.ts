import { IAltShop, IProduct } from "./lib/types";

export const backend_url = process.env.NODE_ENV === "development" ? "http://localhost:3001/api" : "http://localhost:3001/api"// : "https://altmazon-production.up.railway.app/api";

interface OAuthTokenResponse {
	access_token: string;
	id_token: string;
	expires_at: number;
	refresh_token?: string;
};

function backendHeaders() {
  return {
    "Content-Type": "application/json",
    "authorization": `Bearer ${localStorage.getItem("id_token")}`
  };
};


function getBackendHeaders() {
  const id_token = localStorage.getItem("id_token");
  if (id_token == null)
    return undefined;
  return {
    "authorization": `Bearer ${localStorage.getItem("id_token")}`
  };
};

export async function addUser() {
  const res = await fetch(`${backend_url}/user`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id_token: localStorage.getItem("id_token"),
    })
  });
  if (!res.ok)
    throw new Error("Error adding user");
}

export async function codeAuth(code: string) {
  const res = await fetch(`${backend_url}/auth`, {
    method: "POST",
    headers: backendHeaders(),
    body: JSON.stringify({
      code
    })
  });
  if (!res.ok)
    throw new Error("Error getting tokens");

  const tokens: OAuthTokenResponse = await res.json();
  // console.log("tokens:", tokens);
  if (!tokens.refresh_token) {
    console.error('No refresh token given');
    return;
  }
  localStorage.setItem("refresh_token", tokens.refresh_token);
  localStorage.setItem("id_token", tokens.id_token);
  localStorage.setItem("access_token", tokens.access_token);
  localStorage.setItem("expires_at", (tokens.expires_at.toString()));
  // add user to backend
  addUser();
}

export async function getProduct(asin: string): Promise<IProduct> {
  const res = await fetch(`${backend_url}/product/${asin}`);
  if (!res.ok) {
    throw new Error("Error fetching product");
  }
  return res.json() as Promise<IProduct>;
}

export async function addProduct(asin: string, name: string, brand: string) {
  //console.log("adding product:", asin, name, brand);
  const res = await fetch(`${backend_url}/product`, {
    method: "POST",
    headers: backendHeaders(),
    body: JSON.stringify({
      asin,
      name,
      brand
    })
  });
  if (!res.ok) {
    throw new Error("Error adding product");
  }
}

export async function getAltShopList(asin: string): Promise<{data: IAltShop[], votes: []}> {
  const authHeaders = getBackendHeaders();
  const res = await fetch(`${backend_url}/altshops/${asin}`, {
    ...(authHeaders && { headers: authHeaders })
  });
  const resJson = await res.json();
  if (!res.ok) {
    // console.log(res.status, resJson);
    if (res.status === 404)
      throw new Error(resJson.error);
    throw new Error("Error fetching alt shops");
  }
  //console.log("fetched data:", resJson)
  return { data: resJson.altShops, votes: resJson.userVotes };
}

export async function addAltShop(asin: string, link: string, price: number, currency: string) {
  const res = await fetch(`${backend_url}/altshop`, {
    method: "POST",
    headers: backendHeaders(),
    body: JSON.stringify({
      asin,
      link,
      price,
      currency
    })
  });
  if (!res.ok) {
    throw new Error("Error adding alt shop");
  }
}

export async function removeAltShop(id: string) {
  const res = await fetch(`${backend_url}/altshop/${id}`, {
    method: "DELETE"
  });
  if (!res.ok) {
    throw new Error(`Error removing alt shop: ${res.statusText}`);
  }
}

export async function voteAltShop(altShopId: string, vote: number) {
  const res = await fetch(`${backend_url}/vote`, {
    method: "POST",
    headers: backendHeaders(),
    body: JSON.stringify({
      altShopId,
      newVote: vote
    })
  });
  if (!res.ok)
    throw new Error(`Error voting: ${res.statusText}`);
}

export async function getUserVotes(asin: string) {
  const res = await fetch(`${backend_url}/votes/${asin}`, {
    method: "GET",
    headers: getBackendHeaders()
  });
  if (!res.ok)
    throw new Error(`Error fetching user votes: ${res.statusText}`);
  return res.json();
}

export async function refreshAuthTokens() {
  const refresh_token = localStorage.getItem("refresh_token");
  
  if (!refresh_token) {
    console.error("No refresh token found");
    return;
  }
  const res = await fetch(`${backend_url}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      refresh_token: refresh_token,
    })
  });
  
  if (!res.ok) {
    console.error("Error refreshing tokens");
    return;
  }
  const tokens: OAuthTokenResponse = await res.json();
  localStorage.setItem("access_token", tokens.access_token);
  localStorage.setItem("id_token", tokens.id_token);
  localStorage.setItem("expires_at", (tokens.expires_at.toString()));
}