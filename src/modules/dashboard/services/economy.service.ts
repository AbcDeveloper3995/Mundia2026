import { supabase } from '@/services/supabase';

export interface SpyRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  targetId: string;
  targetName: string;
  tierId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  timestamp: number;
  expiresAt?: number;
}

export const ADMIN_USERNAMES = ['anthuan', 'änthuan', 'SirRuben30', 'miri', 'admin', 'Admin'];

export interface GlobalSettings {
  banner_message: string;
  banner_expiration?: number;
  user_expenses: Record<string, number>;
  user_unlocks: Record<string, { 
    streaks?: number, 
    hof?: number, 
    rivalry?: number, 
    extreme_matches?: number,
    spies?: Record<string, { recent?: number | boolean, groups?: number | boolean, knockouts?: number | boolean, awards?: number | boolean }>
  }>;
  active_spies?: { targetId: string, targetName: string, expiresAt: number }[];
  spy_requests?: SpyRequest[];
}

export const fetchGlobalSettings = async (): Promise<GlobalSettings> => {
  const { data, error } = await supabase.from('global_settings').select('*');
  
  const defaultSettings: GlobalSettings = {
    banner_message: '📢 ¿Quieres que todos lean tu mensaje? Haz clic en la bocina de la derecha para secuestrar este banner por 5 MC.',
    user_expenses: {},
    user_unlocks: {},
    active_spies: [],
    spy_requests: []
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
    if (row.key === 'spy_requests') {
      try {
        const parsed = JSON.parse(row.value);
        let changed = false;
        settings.spy_requests = parsed.map((req: any) => {
          if (req.status === 'pending' && !req.expiresAt && ADMIN_USERNAMES.includes(req.targetName)) {
            changed = true;
            return { ...req, expiresAt: Date.now() + 5 * 60 * 1000 };
          }
          return req;
        });
        if (changed) {
          // Asynchronously save back to DB so existing ones get the timestamp permanently
          supabase.from('global_settings').upsert({ key: 'spy_requests', value: JSON.stringify(settings.spy_requests) }).then();
        }
      } catch (e) {
        settings.spy_requests = [];
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
  const settings = await fetchGlobalSettings();

  // 1. Spend the coins for the spy feature
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

  // Note: triggerSpyAlert and unlockSpy remain for backward compatibility or direct triggers
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

export const requestSpy = async (requesterId: string, requesterName: string, targetId: string, targetName: string, tierId: string) => {
  const settings = await fetchGlobalSettings();
  let spyRequests = settings.spy_requests || [];
  
  // Clean up very old requests (e.g. > 1 day) to prevent bloat
  spyRequests = spyRequests.filter(req => Date.now() - req.timestamp < 86400000);

  // Check if there is already a pending request for this user to this target for this tier
  const existing = spyRequests.find(req => req.requesterId === requesterId && req.targetId === targetId && req.tierId === tierId && req.status === 'pending');
  if (existing) {
    throw new Error('Ya enviaste una petición. Espera a que responda.');
  }

  const isAdmin = ADMIN_USERNAMES.includes(targetName);

  spyRequests.push({
    id: Math.random().toString(36).substring(2, 15),
    requesterId,
    requesterName,
    targetId,
    targetName,
    tierId,
    status: 'pending',
    timestamp: Date.now(),
    ...(isAdmin ? { expiresAt: Date.now() + 5 * 60 * 1000 } : {})
  });

  await supabase.from('global_settings').upsert({ key: 'spy_requests', value: JSON.stringify(spyRequests) });
};

export const respondSpyRequest = async (requestId: string, status: 'accepted' | 'rejected' | 'expired') => {
  const settings = await fetchGlobalSettings();
  let spyRequests = settings.spy_requests || [];
  
  const reqIndex = spyRequests.findIndex(req => req.id === requestId);
  if (reqIndex === -1) throw new Error('Petición no encontrada');

  const req = spyRequests[reqIndex];
  req.status = status;
  req.timestamp = Date.now(); // update timestamp so the banner triggers now

  const updates: any[] = [
    { key: 'spy_requests', value: JSON.stringify(spyRequests) }
  ];

  if (status === 'accepted') {
    let unlocks = settings.user_unlocks;
    if (!unlocks[req.requesterId]) unlocks[req.requesterId] = {};
    if (!unlocks[req.requesterId].spies) unlocks[req.requesterId].spies = {};
    if (!unlocks[req.requesterId].spies![req.targetId]) unlocks[req.requesterId].spies![req.targetId] = {};
    
    // Set to true for permanent (until consumed)
    unlocks[req.requesterId].spies![req.targetId][req.tierId as 'recent' | 'groups' | 'knockouts' | 'awards'] = true;
    updates.push({ key: 'user_unlocks', value: JSON.stringify(unlocks) });
  }

  await supabase.from('global_settings').upsert(updates);
};

export const consumeSpyAccess = async (userId: string, targetId: string, tierId: string) => {
  const settings = await fetchGlobalSettings();
  let unlocks = settings.user_unlocks;

  if (unlocks[userId]?.spies?.[targetId]?.[tierId as 'recent' | 'groups' | 'knockouts' | 'awards']) {
    unlocks[userId].spies![targetId][tierId as 'recent' | 'groups' | 'knockouts' | 'awards'] = false; // consume it
    await supabase.from('global_settings').upsert({ key: 'user_unlocks', value: JSON.stringify(unlocks) });
  }
};
