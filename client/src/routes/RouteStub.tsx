interface Props {
  label: string;
}

export default function RouteStub({ label }: Props) {
  return (
    <div style={{ padding: 'var(--space-2xl)', color: 'var(--text-secondary)' }}>
      <p>{label} — built in a later sprint.</p>
    </div>
  );
}
