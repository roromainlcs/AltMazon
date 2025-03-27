
export const backend_url = process.env.NODE_ENV === "development" ? "http://localhost:3001/api" : "http://localhost:3001/api";

export interface IAltShop {
  link: string;
  id: string;
  price: number;
  score: number;
  productAsin: string;
  createdAt: Date;
  updatedAt: Date;
}

interface IProduct {
  asin: string;
  name: string;
  brand: string;
  altShops: IAltShop[];
  createdAt: Date;
  updatedAt: Date;
}

interface OAuthTokenResponse {
	access_token: string;
	expires_at: number;
	refresh_token?: string;
};

export async function codeAuth(code: string) {
  const res = await fetch(`${backend_url}/auth`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      code
    })
  });
  if (!res.ok) {
    throw new Error("Error getting tokens");
  }
  const tokens: OAuthTokenResponse = await res.json();
  // console.log("tokens:", tokens);
  if (tokens.refresh_token)
    localStorage.setItem("refresh_token", tokens.refresh_token);
  else
    console.error('No refresh token given');
  localStorage.setItem("access_token", tokens.access_token);
  localStorage.setItem("expires_at", (tokens.expires_at.toString()));

}

export async function getProduct(asin: string): Promise<IProduct> {
  const res = await fetch(`${backend_url}/product/${asin}`);
  if (!res.ok) {
    throw new Error("Error fetching product");
  }
  return res.json() as Promise<IProduct>;
}

export async function addProduct(asin: string, name: string, brand: string) {
  console.log("adding product:", asin, name, brand);
  const res = await fetch(`${backend_url}/product`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
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

export async function getAltShopList(asin: string): Promise<IAltShop[]> {
  const res = await fetch(`${backend_url}/altshops/${asin}`);
  if (!res.ok) {
    const resJson = await res.json();
    // console.log(res.status, resJson);
    if (res.status === 404)
      throw new Error(resJson.error);
    throw new Error("Error fetching alt shops");
  }
  return res.json() as Promise<IAltShop[]>;
}

export async function addAltShop(asin: string, link: string, price: number) {
  const res = await fetch(`${backend_url}/altshop`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      asin,
      link,
      price
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

export async function voteAltShop(shopId: string, userid: string, vote: number) {
  const res = await fetch(`${backend_url}/vote`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      shopId,
      userid,
      vote
    })
  });
  if (!res.ok)
    console.error(`Error voting alt shop: ${res.statusText}`);
}