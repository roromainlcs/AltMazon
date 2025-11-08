
export const createAltShopSchema = {
  body: {
    type: 'object',
    required: ['asin', 'link', 'price', 'currency'],
    properties: {
      asin: { type: 'string', pattern: '^[A-Z0-9]{10}$' },
      link: { type: 'string', format: 'uri', pattern: '^https?:\/\/www\.[a-zA-Z0-9-]+\.[a-z]{3}(\/.*)?$' },
      price: { type: 'number' },
      currency: { type: 'string', enum: ['EUR', 'USD', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'SEK', 'SGD'] },
    },
  },
};

export const voteAltShopSchema = {
  body: {
    type: 'object',
    required: ['altShopId', 'newVote'],
    properties: {
      altShopId: { type: 'string', pattern: '^[a-z0-9]{25}$' },
      newVote: { type: 'integer', minimum: -2, maximum: 2 },
    },
  },
}

export const getAltShopsSchema = {
  params: {
    type: 'object',
    required: ['asin'],
    properties: {
      asin: { type: 'string', pattern: '^[A-Z0-9]{10}$' },
    },
  },
};