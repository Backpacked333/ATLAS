import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ProfessionalInsights } from '../types';

export function InsightsPage() {
  const [insights, setInsights] = useState<ProfessionalInsights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<ProfessionalInsights>('/insights')
      .then(setInsights)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Professional Growth Insights</h1>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-3 bg-gray-200 rounded" />
              <div className="h-3 bg-gray-200 rounded w-2/3 mt-2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Unable to load insights.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Professional Growth Insights</h1>
        <p className="text-sm text-gray-500">
          Non-evaluative, data-driven reflections on your practice. This data is visible only to you.
        </p>
      </div>

      <div className="card p-3 bg-blue-50 border-blue-200">
        <p className="text-xs text-blue-700">
          This data is never shared with administrators, evaluators, or coaches.
          It exists only to support your own professional reflection.
        </p>
      </div>

      {/* Section Comparison */}
      {insights.sectionComparison.length > 1 && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-sm font-medium text-gray-900">Section Comparison</h2>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {insights.sectionComparison.map((section) => (
                <div key={section.sectionName} className="flex items-center gap-4">
                  <div className="w-48 text-sm text-gray-700 truncate">{section.sectionName}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-4">
                        <div
                          className={`h-4 rounded-full ${
                            section.averageGrade >= 73
                              ? 'bg-green-500'
                              : section.averageGrade >= 60
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${section.averageGrade}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-14 text-right">{section.averageGrade}%</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 w-24 text-right">
                    {section.failingCount} failing / {section.studentCount}
                  </div>
                </div>
              ))}
            </div>
            {insights.sectionComparison.length >= 2 && (() => {
              const sorted = [...insights.sectionComparison].sort(
                (a, b) => b.averageGrade - a.averageGrade
              );
              const diff = sorted[0].averageGrade - sorted[sorted.length - 1].averageGrade;
              if (diff > 5) {
                return (
                  <p className="text-sm text-gray-600 mt-3 p-2 bg-gray-50 rounded">
                    There's a {Math.round(diff)}% difference between your highest and lowest
                    performing sections. Consider what's working in{' '}
                    <strong>{sorted[0].sectionName}</strong> that could be applied elsewhere.
                  </p>
                );
              }
              return null;
            })()}
          </div>
        </div>
      )}

      {/* Assignment Effectiveness */}
      {insights.assignmentEffectiveness.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-sm font-medium text-gray-900">Assignment Effectiveness (Last 30 Days)</h2>
          </div>
          <div className="card-body">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 uppercase">
                    <th className="text-left py-2">Assignment</th>
                    <th className="text-left py-2">Section</th>
                    <th className="text-right py-2">Avg Score</th>
                    <th className="text-right py-2">Completion</th>
                    <th className="text-left py-2">Discrimination</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {insights.assignmentEffectiveness.map((ae, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="py-2 font-medium text-gray-900">{ae.assignmentName}</td>
                      <td className="py-2 text-gray-600">{ae.sectionName}</td>
                      <td className={`py-2 text-right font-medium ${ae.avgScore >= 73 ? 'text-green-600' : ae.avgScore >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                        {ae.avgScore}%
                      </td>
                      <td className={`py-2 text-right ${ae.completionRate < 80 ? 'text-red-600' : 'text-gray-600'}`}>
                        {ae.completionRate}%
                      </td>
                      <td className="py-2">
                        <span className={`badge ${ae.discriminationRating === 'High' ? 'badge-green' : ae.discriminationRating === 'Low' ? 'badge-amber' : 'badge-gray'}`}>
                          {ae.discriminationRating}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Show insights for notable assignments */}
            <div className="mt-4 space-y-2">
              {insights.assignmentEffectiveness
                .filter((ae) => ae.discriminationRating === 'Low' || ae.completionRate < 70)
                .slice(0, 3)
                .map((ae, i) => (
                  <div key={i} className="text-sm text-gray-600 p-2 bg-amber-50 rounded">
                    <strong>{ae.assignmentName}:</strong> {ae.insight}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Grading Patterns */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-sm font-medium text-gray-900">Grading Pattern Insights</h2>
        </div>
        <div className="card-body space-y-3">
          {insights.gradingPatterns.map((pattern, i) => (
            <div key={i} className="p-3 bg-gray-50 rounded-lg">
              <span className="badge badge-blue mb-2">{pattern.type}</span>
              <p className="text-sm text-gray-700">{pattern.insight}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Observation Stats */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-sm font-medium text-gray-900">Observation Activity This Month</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500">Total Observations</p>
              <p className="text-2xl font-bold text-gray-900">{insights.observationStats.totalThisMonth}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Positive Ratio</p>
              <p className={`text-2xl font-bold ${insights.observationStats.positiveRatio >= 0.5 ? 'text-green-600' : insights.observationStats.positiveRatio >= 0.2 ? 'text-amber-600' : 'text-red-600'}`}>
                {Math.round(insights.observationStats.positiveRatio * 100)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Target Ratio</p>
              <p className="text-sm text-gray-500 mt-1">Research suggests a 5:1 positive-to-concern ratio</p>
            </div>
          </div>
          {insights.observationStats.categoryCounts.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-gray-500 uppercase">By Category</p>
              {insights.observationStats.categoryCounts.map((cc) => (
                <div key={cc.category} className="flex justify-between text-sm">
                  <span className="text-gray-600">{cc.category.replace(/_/g, ' ')}</span>
                  <span className="font-medium">{cc.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
