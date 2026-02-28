import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface EncryptionSummary {
  totalKeys: number;
  activeKeys: number;
  encryptedFieldCount: number;
  scansLast30d: number;
  latestCritical: number;
  latestHigh: number;
}

interface EncryptionKey {
  id: string;
  alias: string;
  algorithm: string;
  purpose: string;
  status: string;
  expiresAt: string | null;
  createdAt: string;
  rotatedAt: string | null;
}

interface SecurityScan {
  id: string;
  scanType: string;
  status: string;
  vulnerabilities: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  startedAt: string;
  completedAt: string | null;
}

export function EncryptionPage() {
  const [summary, setSummary] = useState<EncryptionSummary | null>(null);
  const [keys, setKeys] = useState<EncryptionKey[]>([]);
  const [scans, setScans] = useState<SecurityScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<EncryptionSummary>('/encryption/summary'),
      api.get<EncryptionKey[]>('/encryption/keys'),
      api.get<SecurityScan[]>('/encryption/scans'),
    ])
      .then(([summaryData, keysData, scansData]) => {
        setSummary(summaryData);
        setKeys(keysData);
        setScans(scansData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function startScan() {
    setScanning(true);
    try {
      const scan = await api.post<SecurityScan>('/encryption/scans', { scanType: 'ENCRYPTION_AUDIT' });
      setScans((prev) => [scan, ...prev]);
    } catch {
      // ignore
    } finally {
      setScanning(false);
    }
  }

  const statusColor: Record<string, string> = {
    ACTIVE: 'green',
    ROTATED: 'blue',
    REVOKED_KEY: 'red',
    EXPIRED_KEY: 'gray',
  };

  const scanStatusColor: Record<string, string> = {
    IN_PROGRESS_S: 'blue',
    COMPLETED_S: 'green',
    FAILED_S: 'red',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Encryption & Security</h1>
        <button onClick={startScan} disabled={scanning} className="btn-ghost text-sm">
          {scanning ? 'Scanning...' : 'Run Security Scan'}
        </button>
      </div>

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
          {/* Summary */}
          {summary && (
            <div className="grid grid-cols-3 gap-3">
              <div className="card p-3 text-center">
                <p className="text-2xl font-bold text-green-600">{summary.activeKeys}</p>
                <p className="text-xs text-gray-500">Active Keys</p>
                <p className="text-xs text-gray-400">{summary.totalKeys} total</p>
              </div>
              <div className="card p-3 text-center">
                <p className="text-2xl font-bold text-blue-600">{summary.encryptedFieldCount}</p>
                <p className="text-xs text-gray-500">Encrypted Fields</p>
              </div>
              <div className="card p-3 text-center">
                <p className={`text-2xl font-bold ${summary.latestCritical > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {summary.latestCritical}
                </p>
                <p className="text-xs text-gray-500">Critical Vulnerabilities</p>
                {summary.latestHigh > 0 && (
                  <p className="text-xs text-amber-600">{summary.latestHigh} high</p>
                )}
              </div>
            </div>
          )}

          {/* Encryption Keys */}
          <div className="card p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Encryption Keys</h2>
            {keys.length === 0 ? (
              <p className="text-sm text-gray-500">No encryption keys.</p>
            ) : (
              <div className="space-y-2">
                {keys.map((key) => (
                  <div key={key.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">{key.alias}</code>
                        <span className={`badge badge-${statusColor[key.status] || 'gray'}`}>
                          {key.status.replace('_KEY', '')}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-xs text-gray-500">{key.algorithm}</p>
                        <p className="text-xs text-gray-400">{key.purpose.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">{new Date(key.createdAt).toLocaleDateString()}</p>
                      {key.expiresAt && (
                        <p className="text-xs text-amber-500">Expires: {new Date(key.expiresAt).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Security Scans */}
          <div className="card p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Security Scans</h2>
            {scans.length === 0 ? (
              <p className="text-sm text-gray-500">No security scans recorded.</p>
            ) : (
              <div className="space-y-2">
                {scans.slice(0, 10).map((scan) => (
                  <div key={scan.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="badge badge-gray">{scan.scanType.replace('_', ' ')}</span>
                      <span className={`badge badge-${scanStatusColor[scan.status] || 'gray'}`}>
                        {scan.status.replace('_S', '')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {scan.vulnerabilities > 0 && (
                        <span className="text-xs text-red-600">{scan.vulnerabilities} vulnerabilities</span>
                      )}
                      <span className="text-xs text-gray-400">{new Date(scan.startedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
