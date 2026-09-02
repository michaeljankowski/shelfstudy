import { CalendarDays, ClipboardList, ListTodo, Timer } from 'lucide-react';
import AppShell from './AppShell';
import './ProductivityStatus.css';

type ProductivityView = 'todo' | 'assignments' | 'timer' | 'calendar';

const viewDetails = {
  todo: { title: 'To-do list', description: 'Plan study tasks here when productivity tools arrive.', icon: ListTodo },
  assignments: { title: 'Assignments', description: 'Keep due work together when assignment tracking arrives.', icon: ClipboardList },
  timer: { title: 'Study timer', description: 'A focused study timer is coming soon.', icon: Timer },
  calendar: { title: 'Calendar', description: 'View study plans and deadlines here when calendar support arrives.', icon: CalendarDays },
} satisfies Record<ProductivityView, { title: string; description: string; icon: typeof ListTodo }>;

export default function ProductivityStatus({ view }: { view: ProductivityView }) {
  const { title, description, icon: Icon } = viewDetails[view];

  return (
    <AppShell>
      <section className="productivity-status" aria-labelledby="productivity-title">
        <div className="productivity-status-icon" aria-hidden="true"><Icon /></div>
        <p className="productivity-status-eyebrow">Productivity</p>
        <h1 id="productivity-title">{title}</h1>
        <p>{description}</p>
        <span className="productivity-status-badge">Coming soon</span>
      </section>
    </AppShell>
  );
}
