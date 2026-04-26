'use client';

type Variant = 'green' | 'red' | 'yellow' | 'blue' | 'gray' | 'orange';

const variants: Record<Variant, string> = {
  green: 'bg-green-50 text-green-700 ring-1 ring-green-200',
  red: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  yellow: 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200',
  blue: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  gray: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  orange: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
};

export function Badge({ children, variant = 'gray' }: { children: React.ReactNode; variant?: Variant }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
}
