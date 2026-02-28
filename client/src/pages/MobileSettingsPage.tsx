import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface DeviceRegistration {
  id: string;
  deviceToken: string;
  platform: string;
  deviceName: string | null;
  isActive: boolean;
  lastActiveAt: string;
}

interface MobilePreference {
  pushNotificationsEnabled: boolean;
  alertSound: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  dataSaverMode: boolean;
  offlineCacheEnabled: boolean;
}

export function MobileSettingsPage() {
  const [devices, setDevices] = useState<DeviceRegistration[]>([]);
  const [prefs, setPrefs] = useState<MobilePreference | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<DeviceRegistration[]>('/mobile/devices'),
      api.get<MobilePreference>('/mobile/preferences'),
    ])
      .then(([devData, prefData]) => {
        setDevices(devData);
        setPrefs(prefData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function togglePref(key: keyof MobilePreference) {
    if (!prefs) return;
    const newValue = !prefs[key];
    try {
      const updated = await api.put<MobilePreference>('/mobile/preferences', {
        [key]: newValue,
      });
      setPrefs(updated);
    } catch {
      // ignore
    }
  }

  async function deactivateDevice(deviceId: string) {
    try {
      await api.put(`/mobile/devices/${deviceId}/deactivate`);
      setDevices((prev) =>
        prev.map((d) => (d.id === deviceId ? { ...d, isActive: false } : d))
      );
    } catch {
      // ignore
    }
  }

  const platformIcon: Record<string, string> = {
    IOS: 'iOS',
    ANDROID: 'Android',
    WEB: 'Web',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Mobile Settings</h1>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Preferences */}
          {prefs && (
            <div className="card p-4 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
              {[
                { key: 'pushNotificationsEnabled' as const, label: 'Push Notifications', desc: 'Receive push notifications on mobile devices' },
                { key: 'alertSound' as const, label: 'Alert Sound', desc: 'Play a sound for important alerts' },
                { key: 'dataSaverMode' as const, label: 'Data Saver Mode', desc: 'Reduce data usage for mobile connections' },
                { key: 'offlineCacheEnabled' as const, label: 'Offline Cache', desc: 'Cache data for offline access' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => togglePref(item.key)}
                    className={`w-10 h-6 rounded-full transition-colors ${
                      prefs[item.key] ? 'bg-atlas-primary' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white shadow transform transition-transform ${
                        prefs[item.key] ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}

              {prefs.quietHoursStart && prefs.quietHoursEnd && (
                <div className="text-xs text-gray-400 mt-2">
                  Quiet hours: {prefs.quietHoursStart} - {prefs.quietHoursEnd}
                </div>
              )}
            </div>
          )}

          {/* Registered Devices */}
          <div className="card p-4 space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Registered Devices</h2>
            {devices.length === 0 ? (
              <p className="text-sm text-gray-500">No devices registered.</p>
            ) : (
              devices.map((device) => (
                <div key={device.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="badge badge-gray">{platformIcon[device.platform] || device.platform}</span>
                      <span className={`badge ${device.isActive ? 'badge-green' : 'badge-gray'}`}>
                        {device.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">
                      {device.deviceName || 'Unknown Device'}
                    </p>
                    <p className="text-xs text-gray-400">
                      Last active: {new Date(device.lastActiveAt).toLocaleDateString()}
                    </p>
                  </div>
                  {device.isActive && (
                    <button
                      onClick={() => deactivateDevice(device.id)}
                      className="btn-ghost text-xs text-red-600"
                    >
                      Deactivate
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
