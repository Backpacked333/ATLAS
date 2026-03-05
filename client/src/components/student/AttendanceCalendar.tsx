import { clsx } from 'clsx';

interface CalendarDay {
  date: string;
  status: 'present' | 'absent' | 'tardy' | 'excused' | 'weekend';
}

interface AttendanceCalendarProps {
  data: CalendarDay[];
}

const statusColors: Record<string, string> = {
  present: 'bg-atlas-emerald-400',
  absent: 'bg-atlas-rose-400',
  tardy: 'bg-atlas-amber-400',
  excused: 'bg-gray-300',
  weekend: 'bg-gray-100',
};

const statusLabels: Record<string, string> = {
  present: 'Present',
  absent: 'Absent',
  tardy: 'Tardy',
  excused: 'Excused',
  weekend: 'Weekend',
};

export function AttendanceCalendar({ data }: AttendanceCalendarProps) {
  return (
    <div>
      <div className="flex flex-wrap gap-1 mb-3">
        {data.map((day) => (
          <div
            key={day.date}
            className={clsx('w-3 h-3 rounded-sm cursor-default', statusColors[day.status])}
            title={`${day.date}: ${statusLabels[day.status]}`}
          />
        ))}
      </div>
      <div className="flex gap-3 text-[10px] text-atlas-text-tertiary">
        {['present', 'absent', 'tardy', 'excused'].map((status) => (
          <div key={status} className="flex items-center gap-1">
            <span className={clsx('w-2 h-2 rounded-sm', statusColors[status])} />
            {statusLabels[status]}
          </div>
        ))}
      </div>
    </div>
  );
}
