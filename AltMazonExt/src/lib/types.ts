
export const currencies = [
  { code: 'EUR', symbol: '€' },
  { code: 'USD', symbol: '$' },
  { code: 'GBP', symbol: '£' },
  { code: 'JPY', symbol: '¥' },
  { code: 'AUD', symbol: 'A$' },
  { code: 'CAD', symbol: 'C$' },
  { code: 'CHF', symbol: 'CHF' },
  { code: 'CNY', symbol: '¥' },
  { code: 'SEK', symbol: 'kr' },
  { code: 'SGD', symbol: 'S$' },
];


export interface IAltShop {
  link: string;
  id: string;
  price: number;
  currency: string;
  score: number;
  productAsin: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProduct {
  asin: string;
  name: string;
  brand: string;
  altShops: IAltShop[];
  createdAt: Date;
  updatedAt: Date;
}