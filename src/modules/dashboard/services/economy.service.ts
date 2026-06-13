import { supabase } from '@/services/supabase';

export interface GlobalSettings {
  banner_message: string;
  banner_expiration?: number;
  user_expenses: Record<string, number>;
  user_unlocks: Record<string, { 
    streaks?: number, 
    hof?: number, 
    rivalry?: number, 
    extreme_matches?: number,
    spies?: Record<string, { recent?: number, groups?: number, knockouts?: number, awards?: number }>
  }>;
  active_spies?: { targetId: string, targetName: string, expiresAt: number }[];
}

export const fetchGlobalSettings = async (): Promise<GlobalSettings> => {
  const { data, error } = await supabase.from('global_settings').select('*');
  
  const defaultSettings: GlobalSettings = {
    banner_message: '📢 ¿Quieres que todos lean tu mensaje? Haz clic en la bocina de la derecha para secuestrar este banner por 5 MC.',
    user_expenses: {},
    user_unlocks: {},
    active_spies: []
  };

  // If table doesn't exist yet or has an error, fail gracefully to defaults
  if (error || !data) {
    console.warn('global_settings not ready, using defaults', error?.message);
    return defaultSettings;
  }

  const settings = { ...defaultSettings };
  data.forEach((row: any) => {
    if (row.key === 'banner_message') settings.banner_message = row.value;
    if (row.key === 'banner_expiration') {
      try { settings.banner_expiration = parseInt(row.value, 10); } catch(e) {}
    }
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
    if (row.key === 'active_spies') {
      try {
        settings.active_spies = JSON.parse(row.value);
      } catch (e) {
        settings.active_spies = [];
      }
    }
  });

  return settings;
};

export const updateBannerMessage = async (message: string, expiration: number) => {
  const { error } = await supabase.from('global_settings').upsert([
    { key: 'banner_message', value: message },
    { key: 'banner_expiration', value: expiration.toString() }
  ]);
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

export const triggerSpyAlert = async (targetId: string, targetName: string) => {
  const settings = await fetchGlobalSettings();
  let activeSpies = settings.active_spies || [];
  activeSpies = activeSpies.filter(spy => spy.expiresAt > Date.now());
  const existingIndex = activeSpies.findIndex(spy => spy.targetId === targetId);
  if (existingIndex !== -1) {
    activeSpies[existingIndex].expiresAt = Date.now() + 300000;
  } else {
    activeSpies.push({ targetId, targetName, expiresAt: Date.now() + 300000 });
  }
  const { error } = await supabase.from('global_settings').upsert({ key: 'active_spies', value: JSON.stringify(activeSpies) });
  if (error) throw error;
};

export const unlockFeature = async (userId: string, feature: 'streaks' | 'hof' | 'rivalry' | 'extreme_matches', price: number) => {
  // 1. Spend the coins
  await spendUserCoins(userId, price);

  // 2. Fetch current unlocks
  const { data } = await supabase.from('global_settings').select('value').eq('key', 'user_unlocks').maybeSingle();
  let unlocks: Record<string, any> = {};
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

export const unlockSpy = async (userId: string, targetId: string, targetName: string, tier: 'recent' | 'groups' | 'knockouts' | 'awards', price: number) => {
  // 1. Fetch current expenses to validate they have spent >= 100 MC (excluding this purchase)
  const settings = await fetchGlobalSettings();
  const pastExpenses = settings.user_expenses[userId] || 0;
  
  if (price > 0 && pastExpenses < 100) {
    throw new Error('Debes haber gastado al menos 100 MC previamente en el torneo para poder espiar a alguien.');
  }

  // 2. Spend the coins for the spy feature
  if (price > 0) {
    await spendUserCoins(userId, price);
  }

  // 3. Update user_unlocks
  let unlocks = settings.user_unlocks;
  if (!unlocks[userId]) unlocks[userId] = {};
  if (!unlocks[userId].spies) unlocks[userId].spies = {};
  if (!unlocks[userId].spies![targetId]) unlocks[userId].spies![targetId] = {};
  
  // Expiration of 5 minutes (+300000ms)
  const expirationTime = Date.now() + 300000;
  unlocks[userId].spies![targetId][tier] = expirationTime;

  // 4. Update active_spies (Global Panic Badge)
  let activeSpies = settings.active_spies || [];
  // Clean expired spies
  activeSpies = activeSpies.filter(spy => spy.expiresAt > Date.now());
  
  // Add or update target
  const existingSpyIndex = activeSpies.findIndex(s => s.targetId === targetId);
  if (existingSpyIndex >= 0) {
    activeSpies[existingSpyIndex].expiresAt = Math.max(activeSpies[existingSpyIndex].expiresAt, expirationTime);
  } else {
    activeSpies.push({ targetId, targetName, expiresAt: expirationTime });
  }

  // 5. Save everything
  await supabase.from('global_settings').upsert([
    { key: 'user_unlocks', value: JSON.stringify(unlocks) },
    { key: 'active_spies', value: JSON.stringify(activeSpies) }
  ]);
};
