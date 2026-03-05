import { InformationCircleIcon } from '@heroicons/react/24/outline';

interface NarrativeSummaryProps {
  summary: string;
  trajectory: 'improving' | 'stable' | 'declining';
}

export function NarrativeSummary({ summary, trajectory }: NarrativeSummaryProps) {
  const bannerClass = trajectory === 'declining'
    ? 'insight-banner-warning'
    : trajectory === 'improving'
    ? 'insight-banner-success'
    : 'insight-banner-info';

  return (
    <div className={bannerClass}>
      <InformationCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <p className="text-sm leading-relaxed">{summary}</p>
    </div>
  );
}
