import { supabase } from '@/services/supabase';

export interface GlobalSettings {
  banner_message: string;
  user_expenses: Record<string, number>;
  user_unlocks: Record<string, { streaks?: number, hof?: number, rivalry?: number }>;
}

export const fetchGlobalSettings = async (): Promise<GlobalSettings> => {
  const { data, error } = await supabase.from('global_settings').select('*');
  
  const defaultSettings: GlobalSettings = {
    banner_message: '📢 ¿Quieres que todos lean tu mensaje? Haz clic en la bocina de la derecha para secuestrar este banner por 5 MC.',
    user_expenses: {},
    user_unlocks: {}
  };

  // If table doesn't exist yet or has an error, fail gracefully to defaults
  if (error || !data) {
    console.warn('global_settings not ready, using defaults', error?.message);
    return defaultSettings;
  }

  const settings = { ...defaultSettings };
  data.forEach((row: any) => {
    if (row.key === 'banner_message') settings.banner_message = row.value;
    if (row.key === 'user_expenses') {
      try {
        settings.user_expenses = JSON.parse(row.value);
      } catch (e) {
        settings.user_expenses = {};
      }
    }
    if (row.key === 'user_unlocks') {
      try {
        settings.user_unlocks = JSON.parse(row.value);
      } catch (e) {
        settings.user_unlocks = {};
      }
    }
  });

  return settings;
};

export const updateBannerMessage = async (message: string) => {
  const { error } = await supabase.from('global_settings').upsert({ key: 'banner_message', value: message });
  if (error) throw error;
};

export const spendUserCoins = async (userId: string, amount: number) => {
  // 1. Fetch current expenses
  const { data } = await supabase.from('global_settings').select('value').eq('key', 'user_expenses').maybeSingle();
  
  let expenses: Record<string, number> = {};
  if (data && data.value) {
    try {
      expenses = JSON.parse(data.value);
    } catch (e) { }
  }

  // 2. Add new expense
  if (!expenses[userId]) expenses[userId] = 0;
  expenses[userId] += amount;

  // 3. Save to DB
  const { error } = await supabase.from('global_settings').upsert({ key: 'user_expenses', value: JSON.stringify(expenses) });
  if (error) throw error;
};

export const unlockFeature = async (userId: string, feature: 'streaks' | 'hof' | 'rivalry', price: number) => {
  // 1. Spend the coins
  await spendUserCoins(userId, price);

  // 2. Fetch current unlocks
  const { data } = await supabase.from('global_settings').select('value').eq('key', 'user_unlocks').maybeSingle();
  let unlocks: Record<string, { streaks?: number, hof?: number, rivalry?: number }> = {};
  if (data && data.value) {
    try {
      unlocks = JSON.parse(data.value);
    } catch (e) {}
  }

  // 3. Update the specific feature timer
  if (!unlocks[userId]) unlocks[userId] = {};
  unlocks[userId][feature] = Date.now();

  const { error } = await supabase.from('global_settings').upsert({ key: 'user_unlocks', value: JSON.stringify(unlocks) });
  if (error) throw error;
};
