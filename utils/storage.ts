
// Utility to handle LocalStorage operations safely

export const loadData = <T>(key: string, defaultData: T): T => {
  try {
    const serializedData = localStorage.getItem(key);
    if (serializedData === null) {
      return defaultData;
    }
    return JSON.parse(serializedData);
  } catch (error) {
    console.error(`Error loading data for key ${key}:`, error);
    return defaultData;
  }
};

export const saveData = <T>(key: string, data: T): void => {
  try {
    const serializedData = JSON.stringify(data);
    localStorage.setItem(key, serializedData);
  } catch (error) {
    console.error(`Error saving data for key ${key}:`, error);
  }
};

export const clearData = (key: string): void => {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error(`Error clearing data for key ${key}`, error);
    }
}

// Keys Registry to avoid typos
export const STORAGE_KEYS = {
    SYSTEM_CONFIG: 'kmp_adng_system_config', // NEW
    USER: 'kmp_adng_user',
    ALL_USERS: 'kmp_adng_all_users',
    CART: 'kmp_adng_cart',
    ORDERS: 'kmp_adng_orders',
    TRANSACTIONS: 'kmp_adng_transactions',
    PRODUCTS: 'kmp_adng_products',
    CONTENTS: 'kmp_adng_contents',
    TICKETS: 'kmp_adng_tickets',
    CHAT_HISTORY: 'kmp_adng_chat_history',
    CHAT_CONTACTS: 'kmp_adng_chat_contacts',
    WHOLESALE_ITEMS: 'kmp_adng_wholesale_items',
    GROUP_PROJECT: 'kmp_adng_group_project',
    THEME: 'kmp_adng_theme'
};
