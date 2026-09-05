export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-8">{title}</h1>
      <div className="admin-card">
        <p className="text-slate-500 text-sm text-center py-12">Module en cours de développement</p>
      </div>
    </div>
  );
}
