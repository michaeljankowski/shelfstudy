import { useEffect, useState } from 'react';
import { FolderOpen, Trash2 } from 'lucide-react';
import AppShell from './AppShell';
import { getFolders } from '../api';
import { Folder } from '../types';
import './EntityGrid.css';

type LibraryStatusProps = { view: 'recent' | 'trash' };

export default function LibraryStatus({ view }: LibraryStatusProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(view === 'recent');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (view !== 'recent') return;
    let cancelled = false;
    getFolders().then(({ data }) => { if (!cancelled) setFolders(data); })
      .catch(() => { if (!cancelled) setError('Could not load folders. Is the server running?'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [view]);

  if (view === 'trash') return (
    <AppShell><section className="folders-panel library-status" aria-labelledby="trash-title">
      <h1 id="trash-title">Trash</h1><div className="empty-state">
        <Trash2 size={40} className="empty-state-icon" aria-hidden="true" />
        <h3>No trash is available</h3><p>Deleted folders are permanently removed and cannot be recovered here.</p>
      </div>
    </section></AppShell>
  );

  return (
    <AppShell><section className="folders-panel library-status" aria-labelledby="recent-title">
      <h1 id="recent-title">Recent</h1>{error && <div className="error">{error}</div>}
      {loading ? <div className="loading">Loading folders…</div> : <div className="empty-state">
        <FolderOpen size={40} className="empty-state-icon" aria-hidden="true" />
        <h3>{folders.length ? 'Recent activity is not available' : 'No folders yet'}</h3>
        <p>{folders.length ? 'Open a folder from My Folders to continue studying.' : 'Create a folder to start organizing your classes.'}</p>
      </div>}
    </section></AppShell>
  );
}
