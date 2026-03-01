import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { StaffingModel, WhatIfScenario, BudgetOutcomeMapping } from '../../types/command';

export function ResourceAllocationPage() {
  const [activeTab, setActiveTab] = useState<'staffing' | 'whatif' | 'budget'>('staffing');
  const [staffingData, setStaffingData] = useState<StaffingModel | null>(null);
  const [budgetData, setBudgetData] = useState<BudgetOutcomeMapping | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    if (activeTab === 'staffing') {
      api.get<StaffingModel>('/command/resources/staffing')
        .then(setStaffingData)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    } else if (activeTab === 'budget') {
      api.get<BudgetOutcomeMapping>('/command/resources/budget')
        .then(setBudgetData)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [activeTab]);

  const tabs = [
    { key: 'staffing' as const, label: 'Staffing Optimization' },
    { key: 'whatif' as const, label: 'What-If Modeling' },
    { key: 'budget' as const, label: 'Budget-to-Outcome' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Resource Allocation Intelligence</h1>
        <p className="text-sm text-gray-500 mt-1">Optimize staffing, model scenarios, and track cost-effectiveness</p>
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

      {!loading && !error && activeTab === 'staffing' && staffingData && (
        <StaffingTab data={staffingData} />
      )}
      {!loading && !error && activeTab === 'whatif' && <WhatIfTab />}
      {!loading && !error && activeTab === 'budget' && budgetData && (
        <BudgetTab data={budgetData} />
      )}
    </div>
  );
}

function StaffingTab({ data }: { data: StaffingModel }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">District Average Ratio</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{data.districtAvgRatio}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">ASCA Recommendation</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{data.ascaRecommendation}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">School</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Students</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">At-Risk</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Counselors</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ratio (All)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ratio (Risk)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assessment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.schools.map((school) => (
              <tr key={school.schoolId} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium">{school.schoolName}</td>
                <td className="px-4 py-3 text-sm">{school.totalStudents.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm">{school.atRiskStudents}</td>
                <td className="px-4 py-3 text-sm">{school.counselorCount}</td>
                <td className="px-4 py-3 text-sm">{school.ratioAll}</td>
                <td className="px-4 py-3 text-sm">{school.ratioRisk}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                    school.assessment === 'OK' ? 'bg-green-100 text-green-700' :
                    school.assessment === 'ADEQUATE' ? 'bg-blue-100 text-blue-700' :
                    school.assessment === 'OVERLOADED' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {school.assessment}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WhatIfTab() {
  const [scenarioType, setScenarioType] = useState('ADD_COUNSELOR');
  const [schoolId, setSchoolId] = useState('');
  const [result, setResult] = useState<WhatIfScenario | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const runScenario = async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string | number> = {};
      if (schoolId) params.schoolId = schoolId;
      const res = await api.post<WhatIfScenario>('/command/resources/what-if', {
        scenarioType,
        params,
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scenario failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">What-If Scenario Builder</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Scenario Type</label>
            <select
              value={scenarioType}
              onChange={(e) => setScenarioType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ADD_COUNSELOR">Add Counselor to School</option>
              <option value="REDUCE_CHRONIC_ABSENCE">Reduce Chronic Absence</option>
              <option value="INVEST_PROGRAM">Invest in Program</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">School ID (if applicable)</label>
            <input
              type="text"
              value={schoolId}
              onChange={(e) => setSchoolId(e.target.value)}
              placeholder="School ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={runScenario}
              disabled={loading}
              className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Running...' : 'Run Scenario'}
            </button>
          </div>
        </div>

        {error && <div className="text-red-600 bg-red-50 p-3 rounded-lg text-sm">{error}</div>}
      </div>

      {result && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{result.scenario}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Current State</h4>
              <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
                {JSON.stringify(result.currentState, null, 2)}
              </pre>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Projected State</h4>
              <pre className="bg-indigo-50 p-3 rounded text-sm overflow-x-auto">
                {JSON.stringify(result.projectedState, null, 2)}
              </pre>
            </div>
          </div>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700"><strong>Impact:</strong> {result.impact}</p>
            <p className="text-sm text-gray-700 mt-2"><strong>Confidence:</strong> {result.confidence}</p>
            <p className="text-sm text-gray-700 mt-2"><strong>Recommendation:</strong> {result.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function BudgetTab({ data }: { data: BudgetOutcomeMapping }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-xs text-gray-500">Total Spend</p>
          <p className="text-xl font-bold text-gray-900">${data.totalSpend.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-xs text-gray-500">Students Served</p>
          <p className="text-xl font-bold text-gray-900">{data.totalStudentsServed.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-xs text-gray-500">Overall Success Rate</p>
          <p className="text-xl font-bold text-green-600">{data.overallSuccessRate}%</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-xs text-gray-500">Cost per Success</p>
          <p className="text-xl font-bold text-gray-900">${data.overallCostPerSuccess.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Program</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Annual Cost</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Students</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost/Student</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Success Rate</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost/Success</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.programs.map((p) => (
              <tr key={p.name} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium">{p.name}</td>
                <td className="px-4 py-3 text-sm">${p.annualCost.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm">{p.studentsServed}</td>
                <td className="px-4 py-3 text-sm">${p.costPerStudent.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`inline-block px-2 py-0.5 rounded ${
                    p.successRate >= 60 ? 'bg-green-50 text-green-700' :
                    p.successRate >= 40 ? 'bg-amber-50 text-amber-700' :
                    'bg-red-50 text-red-700'
                  }`}>
                    {p.successRate}%
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">${p.costPerSuccess.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
