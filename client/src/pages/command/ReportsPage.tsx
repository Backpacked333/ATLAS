import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ReportTypeInfo, GeneratedReport } from '../../types/command';

export function ReportsPage() {
  const [reportTypes, setReportTypes] = useState<ReportTypeInfo[]>([]);
  const [generatedReport, setGeneratedReport] = useState<GeneratedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<ReportTypeInfo[]>('/command/reports/types')
      .then(setReportTypes)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleGenerate = async (type: string) => {
    setGenerating(true);
    setError('');
    setGeneratedReport(null);
    try {
      const report = await api.post<GeneratedReport>('/command/reports/generate', { type });
      setGeneratedReport(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Report generation failed');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Board Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Generate publication-ready reports for board meetings and stakeholders</p>
      </div>

      {error && <div className="text-red-600 bg-red-50 p-4 rounded-lg">{error}</div>}

      {/* Report Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportTypes.map((rt) => (
          <div key={rt.type} className="bg-white rounded-lg shadow p-6 flex flex-col">
            <h3 className="text-sm font-semibold text-gray-900">{rt.title}</h3>
            <p className="text-xs text-gray-500 mt-1 flex-1">{rt.description}</p>
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs text-indigo-600 font-medium">{rt.schedule}</span>
              <button
                onClick={() => handleGenerate(rt.type)}
                disabled={generating}
                className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {generating ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Generated Report */}
      {generatedReport && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{generatedReport.title}</h2>
              <p className="text-xs text-gray-500 mt-1">
                Generated {new Date(generatedReport.generatedAt).toLocaleString()} | ID: {generatedReport.id}
              </p>
            </div>
          </div>

          {generatedReport.summary && (
            <div className="bg-indigo-50 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-semibold text-indigo-900 mb-1">Executive Summary</h3>
              <p className="text-sm text-indigo-800">{generatedReport.summary}</p>
            </div>
          )}

          <div className="space-y-6">
            {generatedReport.sections.map((section, idx) => (
              <div key={idx} className="border-l-4 border-indigo-200 pl-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">{section.title}</h3>
                <p className="text-sm text-gray-600">{section.content}</p>
                {section.data && (
                  <pre className="mt-2 bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                    {JSON.stringify(section.data, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
