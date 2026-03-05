import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { DisciplineEquityMatrix, MTSSEquityDashboard, SPEDEquityDashboard } from '../../types/command';

export function EquityDashboardPage() {
  const [activeTab, setActiveTab] = useState<'discipline' | 'mtss' | 'sped'>('discipline');
  const [disciplineData, setDisciplineData] = useState<DisciplineEquityMatrix | null>(null);
  const [mtssData, setMtssData] = useState<MTSSEquityDashboard | null>(null);
  const [spedData, setSpedData] = useState<SPEDEquityDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    const endpoint = activeTab === 'discipline' ? '/command/equity/discipline'
      : activeTab === 'mtss' ? '/command/equity/mtss'
      : '/command/equity/sped';

    if (activeTab === 'discipline') {
      api.get<DisciplineEquityMatrix>(endpoint)
        .then(setDisciplineData)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    } else if (activeTab === 'mtss') {
      api.get<MTSSEquityDashboard>(endpoint)
        .then(setMtssData)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      api.get<SPEDEquityDashboard>(endpoint)
        .then(setSpedData)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [activeTab]);

  const tabs = [
    { key: 'discipline' as const, label: 'Discipline Equity' },
    { key: 'mtss' as const, label: 'MTSS Equity' },
    { key: 'sped' as const, label: 'SPED Equity' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Equity Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Continuous equity monitoring across all schools</p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      )}

      {error && <div className="text-red-600 bg-red-50 p-4 rounded-lg">{error}</div>}

      {!loading && !error && activeTab === 'discipline' && disciplineData && (
        <DisciplineTab data={disciplineData} />
      )}
      {!loading && !error && activeTab === 'mtss' && mtssData && (
        <MTSSEquityTab data={mtssData} />
      )}
      {!loading && !error && activeTab === 'sped' && spedData && (
        <SPEDTab data={spedData} />
      )}
    </div>
  );
}

function DisciplineTab({ data }: { data: DisciplineEquityMatrix }) {
  return (
    <div className="space-y-6">
      {/* District-wide summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">District-Wide Risk Ratios</h3>
        <p className="text-xs text-gray-500 mb-4">
          Risk ratio = group suspension rate / White student suspension rate. Values above 2.0x indicate significant disproportionality.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {data.district.map((g) => (
            <div key={g.group} className={`rounded-lg p-4 text-center ${
              g.riskRatio > g.threshold ? 'bg-red-50 border border-red-200' :
              g.riskRatio > 1.5 ? 'bg-amber-50 border border-amber-200' :
              'bg-green-50 border border-green-200'
            }`}>
              <p className="text-xs font-medium text-gray-500">{g.group}</p>
              <p className={`text-2xl font-bold mt-1 ${
                g.riskRatio > g.threshold ? 'text-red-700' :
                g.riskRatio > 1.5 ? 'text-amber-700' : 'text-green-700'
              }`}>
                {g.riskRatio.toFixed(1)}x
              </p>
              <p className="text-xs text-gray-400 mt-1">n={g.count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Per-school breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Ratios by School</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">School</th>
                {data.district.map((g) => (
                  <th key={g.group} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{g.group}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.schools.map((school) => (
                <tr key={school.schoolId}>
                  <td className="px-4 py-2 text-sm font-medium">{school.schoolName}</td>
                  {data.district.map((dg) => {
                    const group = school.groups.find((g) => g.group === dg.group);
                    const ratio = group?.riskRatio ?? 0;
                    return (
                      <td key={dg.group} className="px-4 py-2 text-sm">
                        <span className={`inline-block px-2 py-0.5 rounded ${
                          ratio > 2.0 ? 'bg-red-50 text-red-700' :
                          ratio > 1.5 ? 'bg-amber-50 text-amber-700' :
                          'bg-green-50 text-green-700'
                        }`}>
                          {ratio.toFixed(1)}x
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MTSSEquityTab({ data }: { data: MTSSEquityDashboard }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Identification Equity</h3>
        <p className="text-xs text-gray-500 mb-3">Among at-risk students, rate of referral by group</p>
        {data.identificationEquity.length > 0 ? (
          <div className="space-y-2">
            {data.identificationEquity.map((e) => (
              <div key={e.group} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{e.group}</span>
                <span className="text-sm font-medium">{e.referralRate}% ({e.referredCount}/{e.atRiskCount})</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No data available</p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Intervention Access Equity</h3>
        <p className="text-xs text-gray-500 mb-3">Among referred students, rate receiving interventions</p>
        {data.interventionAccessEquity.length > 0 ? (
          <div className="space-y-2">
            {data.interventionAccessEquity.map((e) => (
              <div key={e.group} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{e.group}</span>
                <span className="text-sm font-medium">{e.accessRate}% ({e.receivingCount}/{e.referredCount})</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No data available</p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Outcome Equity</h3>
        <p className="text-xs text-gray-500 mb-3">Success rate of completed interventions by group</p>
        {data.outcomeEquity.length > 0 ? (
          <div className="space-y-2">
            {data.outcomeEquity.map((e) => (
              <div key={e.group} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{e.group}</span>
                <span className="text-sm font-medium">{e.successRate}% ({e.successCount}/{e.interventionCount})</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No data available</p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Exit Equity</h3>
        <p className="text-xs text-gray-500 mb-3">Rate of students exiting Tier 2 by group</p>
        {data.exitEquity.length > 0 ? (
          <div className="space-y-2">
            {data.exitEquity.map((e) => (
              <div key={e.group} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{e.group}</span>
                <span className="text-sm font-medium">{e.exitRate}% ({e.exitedCount}/{e.tier2Count})</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No data available</p>
        )}
      </div>
    </div>
  );
}

function SPEDTab({ data }: { data: SPEDEquityDashboard }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">SPED Identification Rates by Race</h3>
        {data.identificationRates.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Group</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Students</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">SPED Students</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID Rate</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Enrollment %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.identificationRates.map((r) => (
                  <tr key={r.group}>
                    <td className="px-4 py-2 text-sm font-medium">{r.group}</td>
                    <td className="px-4 py-2 text-sm">{r.totalStudents}</td>
                    <td className="px-4 py-2 text-sm">{r.spedStudents}</td>
                    <td className="px-4 py-2 text-sm">{r.identificationRate}%</td>
                    <td className="px-4 py-2 text-sm">{r.enrollmentPercent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-400">No identification rate data available</p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Discipline of Students with IEPs by Race</h3>
        {data.disciplineOfIEP.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Group</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">IEP Students</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Suspended</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Suspension Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.disciplineOfIEP.map((r) => (
                  <tr key={r.group}>
                    <td className="px-4 py-2 text-sm font-medium">{r.group}</td>
                    <td className="px-4 py-2 text-sm">{r.iepStudents}</td>
                    <td className="px-4 py-2 text-sm">{r.suspendedCount}</td>
                    <td className="px-4 py-2 text-sm">
                      <span className={`inline-block px-2 py-0.5 rounded ${
                        r.suspensionRate > 10 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                      }`}>
                        {r.suspensionRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-400">No discipline data available for IEP students</p>
        )}
      </div>
    </div>
  );
}
