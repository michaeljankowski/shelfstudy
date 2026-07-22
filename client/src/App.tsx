import { useState, useEffect } from 'react';
import { Class, Note } from './types';
import { getClasses } from './api';
import ClassList from './components/ClassList.js';
import NoteUpload from './components/NoteUpload.js';
import NoteGallery from './components/NoteGallery.js';
import ChatInterface from './components/ChatInterface.js';
import './styles/App.css';

function App() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await getClasses();
      setClasses(response.data);
    } catch (err) {
      setError('Failed to load classes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClassCreated = (newClass: Class) => {
    setClasses([newClass, ...classes]);
    setSelectedClass(newClass);
  };

  const handleClassUpdated = (updatedClass: Class) => {
    setClasses(classes.map(c => c.id === updatedClass.id ? updatedClass : c));
    if (selectedClass?.id === updatedClass.id) {
      setSelectedClass(updatedClass);
    }
  };

  const handleClassDeleted = (classId: number) => {
    setClasses(classes.filter(c => c.id !== classId));
    if (selectedClass?.id === classId) {
      setSelectedClass(null);
    }
  };

  const handleNoteUploaded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleNoteClick = (note: Note) => {
    setSelectedNote(note);
  };

  const handleToggleSidebar = () => {
    setSidebarCollapsed(prev => !prev);
  };

  return (
    <div className={'app' + (sidebarCollapsed ? ' sidebar-collapsed' : '')}>
      <ClassList
        classes={classes}
        selectedClass={selectedClass}
        onSelectClass={setSelectedClass}
        onClassCreated={handleClassCreated}
        onClassUpdated={handleClassUpdated}
        onClassDeleted={handleClassDeleted}
        loading={loading}
        collapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />

      <div className="main-content">
        <div className="content-header">
          <h2>{selectedClass ? selectedClass.name : 'Select a Class'}</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {selectedClass
              ? 'Upload notes, view gallery, and chat with AI'
              : 'Choose a class from the sidebar to get started'}
          </p>
        </div>

        <div className="content-body">
          {error && <div className="error">{error}</div>}

          {!selectedClass ? (
            <div className="empty-state">
              <div className="empty-state-icon">📚</div>
              <h3>No Class Selected</h3>
              <p>Create or select a class from the sidebar to begin</p>
            </div>
          ) : (
            <>
              <NoteUpload
                classId={selectedClass.id}
                onNoteUploaded={handleNoteUploaded}
              />

              <NoteGallery
                classId={selectedClass.id}
                onNoteClick={handleNoteClick}
                refreshTrigger={refreshTrigger}
              />

              <ChatInterface
                classId={selectedClass.id}
                selectedNoteId={selectedNote?.id}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
