export function percentageToLetter(pct: number): string {
  if (pct >= 93) return 'A';
  if (pct >= 90) return 'A-';
  if (pct >= 87) return 'B+';
  if (pct >= 83) return 'B';
  if (pct >= 80) return 'B-';
  if (pct >= 77) return 'C+';
  if (pct >= 73) return 'C';
  if (pct >= 70) return 'C-';
  if (pct >= 67) return 'D+';
  if (pct >= 63) return 'D';
  if (pct >= 60) return 'D-';
  return 'F';
}

export function letterToGpa(letter: string): number {
  const map: Record<string, number> = {
    'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0, 'D-': 0.7,
    'F': 0.0,
  };
  return map[letter] ?? 0.0;
}

export function gradeColor(letter: string): 'green' | 'amber' | 'red' {
  if (letter.startsWith('A') || letter.startsWith('B')) return 'green';
  if (letter.startsWith('C')) return 'amber';
  return 'red';
}

export function attendanceColor(rate: number): 'green' | 'amber' | 'red' {
  if (rate >= 95) return 'green';
  if (rate >= 90) return 'amber';
  return 'red';
}

export function absenceSeverity(consecutiveDays: number): 'gray' | 'amber' | 'red' {
  if (consecutiveDays >= 5) return 'red';
  if (consecutiveDays >= 3) return 'amber';
  return 'gray';
}
