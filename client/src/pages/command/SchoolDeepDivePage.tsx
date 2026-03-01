import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { SchoolDeepDive } from '../../types/command';

export function SchoolDeepDivePage() {
  const { schoolId } = useParams<{ schoolId: string }>();
  const [data, setData] = useState<SchoolDeepDive | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<string>('overview');

  useEffect(() => {
    if (!schoolId) return;
    api.get<SchoolDeepDive>(`/command/scoreboard/schools/${schoolId}`)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [schoolId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (error) return <div className="text-red-600 bg-red-50 p-4 rounded-lg">{error}</div>;
  if (!data) return null;

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'outcomes', label: 'Outcome Trends' },
    { key: 'mtss', label: 'MTSS Health' },
    { key: 'compliance', label: 'Compliance' },
    { key: 'equity', label: 'Equity' },
    { key: 'staff', label: 'Staff Capacity' },
    { key: 'budget', label: 'Budget & ROI' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/command/scoreboard" className="text-indigo-600 hover:text-indigo-800 text-sm">
          &larr; Back to Scoreboard
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">{data.overview.schoolName}</h1>
        <p className="text-sm text-gray-500">
          {data.overview.gradeSpan} &bull; {data.overview.enrollment.toLocaleString()} students &bull; {data.overview.teacherCount} teachers &bull; {data.overview.counselorCount} counselors
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4 overflow-x-auto">
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

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab data={data} />}
      {activeTab === 'outcomes' && <OutcomesTab data={data} />}
      {activeTab === 'mtss' && <MTSSTab data={data} />}
      {activeTab === 'compliance' && <ComplianceTab data={data} />}
      {activeTab === 'equity' && <EquityTab data={data} />}
      {activeTab === 'staff' && <StaffTab data={data} />}
      {activeTab === 'budget' && <BudgetTab data={data} />}
    </div>
  );
}

function OverviewTab({ data }: { data: SchoolDeepDive }) {
  const { overview } = data;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">School Profile</h3>
        <dl className="space-y-3">
          <div className="flex justify-between"><dt className="text-sm text-gray-500">Grade Span</dt><dd className="text-sm font-medium">{overview.gradeSpan}</dd></div>
          <div className="flex justify-between"><dt className="text-sm text-gray-500">Enrollment</dt><dd className="text-sm font-medium">{overview.enrollment.toLocaleString()}</dd></div>
          <div className="flex justify-between"><dt className="text-sm text-gray-500">Teachers</dt><dd className="text-sm font-medium">{overview.teacherCount}</dd></div>
          <div className="flex justify-between"><dt className="text-sm text-gray-500">Counselors</dt><dd className="text-sm font-medium">{overview.counselorCount}</dd></div>
          <div className="flex justify-between"><dt className="text-sm text-gray-500">IEP %</dt><dd className="text-sm font-medium">{overview.iepPercent}%</dd></div>
          <div className="flex justify-between"><dt className="text-sm text-gray-500">ELL %</dt><dd className="text-sm font-medium">{overview.ellPercent}%</dd></div>
          <div className="flex justify-between"><dt className="text-sm text-gray-500">FRL %</dt><dd className="text-sm font-medium">{overview.frlPercent}%</dd></div>
        </dl>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Demographics</h3>
        {overview.demographics.length > 0 ? (
          <div className="space-y-2">
            {overview.demographics.map((d) => (
              <div key={d.group} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{d.group}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${d.percent}%` }} />
                  </div>
                  <span className="text-sm font-medium w-16 text-right">{d.percent}%</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No demographic data available</p>
        )}
      </div>
    </div>
  );
}

function OutcomesTab({ data }: { data: SchoolDeepDive }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Outcome Trends</h3>
      {data.outcomeTrends.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Attendance %</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Chronic Abs %</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Suspension %</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Course Fail %</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Avg Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.outcomeTrends.map((t) => (
                <tr key={t.date}>
                  <td className="px-4 py-2 text-sm">{t.date}</td>
                  <td className="px-4 py-2 text-sm">{t.attendanceRate}%</td>
                  <td className="px-4 py-2 text-sm">{t.chronicAbsenceRate}%</td>
                  <td className="px-4 py-2 text-sm">{t.suspensionRate}%</td>
                  <td className="px-4 py-2 text-sm">{t.courseFailureRate}%</td>
                  <td className="px-4 py-2 text-sm">{(t.avgRiskScore * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-gray-400">No trend data available yet. Metrics snapshots will populate over time.</p>
      )}
    </div>
  );
}

function MTSSTab({ data }: { data: SchoolDeepDive }) {
  const { mtssHealth } = data;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tier Distribution</h3>
        {mtssHealth.tierDistribution.map((t) => (
          <div key={t.tier} className="mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span>{t.tier}</span>
              <span className="font-medium">{t.count} ({t.percent}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full ${t.tier === 'Tier 1' ? 'bg-green-500' : t.tier === 'Tier 2' ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${t.percent}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Intervention Fidelity by Type</h3>
        {mtssHealth.fidelityByType.length > 0 ? (
          <div className="space-y-3">
            {mtssHealth.fidelityByType.map((f) => (
              <div key={f.type} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{f.type} ({f.count})</span>
                <span className={`text-sm font-medium ${f.fidelity >= 80 ? 'text-green-600' : f.fidelity >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                  {f.fidelity}%
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No intervention fidelity data available</p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Success Rate by Type</h3>
        {mtssHealth.successRateByType.length > 0 ? (
          <div className="space-y-3">
            {mtssHealth.successRateByType.map((s) => (
              <div key={s.type} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{s.type} ({s.count})</span>
                <span className={`text-sm font-medium ${s.successRate >= 60 ? 'text-green-600' : s.successRate >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                  {s.successRate}%
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No success rate data available</p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">SST Meeting Cadence</h3>
        {mtssHealth.sstMeetingCadence.length > 0 ? (
          <div className="space-y-2">
            {mtssHealth.sstMeetingCadence.map((m) => (
              <div key={m.month} className="flex justify-between text-sm">
                <span className="text-gray-600">{m.month}</span>
                <span className="font-medium">{m.count} meetings</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No meeting data available</p>
        )}
      </div>
    </div>
  );
}

function ComplianceTab({ data }: { data: SchoolDeepDive }) {
  const { complianceStatus } = data;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-sm text-gray-500">Total IEPs</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{complianceStatus.iepTotal}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-sm text-gray-500">Compliant</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{complianceStatus.iepCompliant}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-sm text-gray-500">Compliance Rate</p>
          <p className={`text-3xl font-bold mt-1 ${complianceStatus.iepComplianceRate >= 95 ? 'text-green-600' : 'text-red-600'}`}>
            {complianceStatus.iepComplianceRate}%
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Service Minute Delivery</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-gray-200 rounded-full h-4">
            <div
              className={`h-4 rounded-full ${complianceStatus.serviceMinuteDeliveryRate >= 90 ? 'bg-green-500' : 'bg-amber-500'}`}
              style={{ width: `${complianceStatus.serviceMinuteDeliveryRate}%` }}
            />
          </div>
          <span className="text-sm font-medium">{complianceStatus.serviceMinuteDeliveryRate}%</span>
        </div>
      </div>
    </div>
  );
}

function EquityTab({ data }: { data: SchoolDeepDive }) {
  const { equitySnapshot } = data;
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Discipline Disproportionality</h3>
      {equitySnapshot.disciplineDisproportionality.length > 0 ? (
        <div className="space-y-3">
          {equitySnapshot.disciplineDisproportionality.map((d) => (
            <div key={d.group} className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{d.group}</span>
              <span className={`text-sm font-medium px-2 py-0.5 rounded ${
                d.riskRatio > d.threshold ? 'bg-red-50 text-red-700' : d.riskRatio > 1.5 ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'
              }`}>
                {d.riskRatio.toFixed(1)}x (threshold: {d.threshold.toFixed(1)}x)
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400">No discipline equity data available</p>
      )}
    </div>
  );
}

function StaffTab({ data }: { data: SchoolDeepDive }) {
  const { staffCapacity } = data;
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Counselor Capacity</h3>
      {staffCapacity.counselors.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Counselor</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Students</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">At-Risk</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ratio (All)</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ratio (Risk)</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Assessment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {staffCapacity.counselors.map((c) => (
                <tr key={c.name}>
                  <td className="px-4 py-2 text-sm font-medium">{c.name}</td>
                  <td className="px-4 py-2 text-sm">{c.totalStudents}</td>
                  <td className="px-4 py-2 text-sm">{c.atRiskStudents}</td>
                  <td className="px-4 py-2 text-sm">{c.ratioAll}</td>
                  <td className="px-4 py-2 text-sm">{c.ratioRisk}</td>
                  <td className="px-4 py-2 text-sm">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      c.assessment === 'OK' ? 'bg-green-100 text-green-700' :
                      c.assessment === 'ADEQUATE' ? 'bg-blue-100 text-blue-700' :
                      c.assessment === 'OVERLOADED' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {c.assessment}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-gray-400">No counselor data available</p>
      )}
    </div>
  );
}

function BudgetTab({ data }: { data: SchoolDeepDive }) {
  const { budgetAndRoi } = data;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-sm text-gray-500">Total Intervention Spend</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">${budgetAndRoi.totalInterventionSpend.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-sm text-gray-500">Cost per Student</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">${budgetAndRoi.costPerStudent.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-sm text-gray-500">Cost per Success</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">${budgetAndRoi.costPerSuccess.toLocaleString()}</p>
        </div>
      </div>

      {budgetAndRoi.programs.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Program Cost-Effectiveness</h3>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Program</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Annual Cost</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Students</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Success Rate</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cost/Success</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {budgetAndRoi.programs.map((p) => (
                <tr key={p.name}>
                  <td className="px-4 py-2 text-sm font-medium">{p.name}</td>
                  <td className="px-4 py-2 text-sm">${p.annualCost.toLocaleString()}</td>
                  <td className="px-4 py-2 text-sm">{p.studentsServed}</td>
                  <td className="px-4 py-2 text-sm">{p.successRate}%</td>
                  <td className="px-4 py-2 text-sm">${p.costPerSuccess.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
