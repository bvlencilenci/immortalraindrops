export interface UploadPreferences {
  defaultType: 'song' | 'dj set' | 'video' | 'image';
  lastArtist: string;
}

const STORAGE_KEY = 'immortal_upload_prefs';

const DEFAULTS: UploadPreferences = {
  defaultType: 'song',
  lastArtist: '',
};

export const savePreferences = (prefs: Partial<UploadPreferences>) => {
  try {
    if (typeof window === 'undefined') return;

    // Merge with existing
    const current = loadPreferences();
    const updated = { ...current, ...prefs };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    // QuotaExceededError or SecurityError (private browsing)
    console.warn('Failed to save preferences:', e);
  }
};

export const loadPreferences = (): UploadPreferences => {
  try {
    if (typeof window === 'undefined') return DEFAULTS;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULTS;

    const parsed = JSON.parse(stored);

    // Validate shape roughly
    return {
      defaultType: parsed.defaultType || DEFAULTS.defaultType,
      lastArtist: parsed.lastArtist || DEFAULTS.lastArtist,
    };
  } catch (e) {
    console.warn('Failed to load preferences:', e);
    return DEFAULTS;
  }
};
