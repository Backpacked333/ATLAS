import { clsx } from 'clsx';

interface Tab {
  key: string;
  label: string;
  count?: number;
}

interface TabNavProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (key: string) => void;
}

export function TabNav({ tabs, activeTab, onChange }: TabNavProps) {
  return (
    <div className="tab-nav">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={clsx(
            activeTab === tab.key ? 'tab-nav-item-active' : 'tab-nav-item-inactive'
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={clsx(
              'ml-1.5 inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-medium',
              activeTab === tab.key ? 'bg-atlas-indigo-100 text-atlas-indigo-700' : 'bg-gray-100 text-gray-600'
            )}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
