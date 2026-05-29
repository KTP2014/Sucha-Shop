const LOYVERSE_BASE_URL = 'https://api.loyverse.com/v1.0';

const getApiToken = (): string => {
  const token = process.env.LOYVERSE_TOKEN || process.env.LOYVERSE_API_TOKEN;
  if (!token) {
    throw new Error('LOYVERSE_TOKEN is not defined in environment variables');
  }
  return token;
};

export interface LoyverseVariant {
  variant_id: string;
  item_id: string;
  sku: string | null;
  option1_value: string | null;
  option2_value: string | null;
  option3_value: string | null;
  cost: number;
}

export interface LoyverseItem {
  id: string;
  item_name: string;
  description: string | null;
  category_id: string | null;
  variants: LoyverseVariant[];
}

export interface LoyverseStore {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
}

export async function getStores(): Promise<LoyverseStore[]> {
  const token = getApiToken();
  const response = await fetch(`${LOYVERSE_BASE_URL}/stores`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    next: { revalidate: 60 }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch stores: ${response.statusText}`);
  }

  const data = await response.json();
  return data.stores || [];
}

export async function getItems(): Promise<LoyverseItem[]> {
  const token = getApiToken();
  let allItems: LoyverseItem[] = [];
  let cursor: string | undefined = undefined;

  try {
    do {
      const url = new URL(`${LOYVERSE_BASE_URL}/items`);
      url.searchParams.set('limit', '250');
      if (cursor) {
        url.searchParams.set('cursor', cursor);
      }

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        next: { revalidate: 10 }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch items: ${response.statusText}`);
      }

      const data = await response.json();
      const items: LoyverseItem[] = data.items || [];
      allItems = [...allItems, ...items];
      cursor = data.cursor;
    } while (cursor);

    return allItems;
  } catch (error) {
    console.error('Error fetching Loyverse items:', error);
    throw error;
  }
}

export async function updateInventory(
  variantId: string,
  storeId: string,
  stockAfter: number
): Promise<any> {
  const token = getApiToken();
  const response = await fetch(`${LOYVERSE_BASE_URL}/inventory`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inventory_levels: [
        {
          variant_id: variantId,
          store_id: storeId,
          stock_after: stockAfter,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Loyverse Inventory Update Error:', errorBody);
    throw new Error(`Failed to update inventory: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
