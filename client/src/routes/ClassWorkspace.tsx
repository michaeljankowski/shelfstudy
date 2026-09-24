import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Menu, ChevronDown, Search } from 'lucide-react';
import { ChatMessage, ChatSession, Class, Note } from '../types';
import { createChatSession, getChatMessages, getChatSessions, getClass, getClasses, getNotesByClass, updateChatSession, updateStudyPlan } from '../api';
import ChatInterface from '../components/ChatInterface';
import FlashcardStudy from '../components/FlashcardStudy';
import SidebarSections from '../components/SidebarSections';
import SourceTree from '../components/SourceTree';
import StudyPlanBuilder, { StudyPlanDraft } from '../components/StudyPlanBuilder';
import { markClassOpened } from '../utils/classLastOpened';
import './ClassWorkspace.css';

const CLASS_MENU_COMPACT_LIMIT = 10;
const CLASS_MENU_RECENT_LIMIT = 5;

type SidebarView =
  | { mode: 'sections' }
  | { mode: 'source-tree'; category?: 'documents' | 'photos' | 'links' | 'notes' };

export default function ClassWorkspace() {
  const { folderId, classId } = useParams();
  const navigate = useNavigate();
  const id = Number(classId);

  const [cls, setCls] = useState<Class | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [notesError, setNotesError] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [sidebarView, setSidebarView] = useState<SidebarView>({ mode: 'sections' });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState<number | undefined>();
  const [folderClasses, setFolderClasses] = useState<Class[]>([]);
  const [classMenuOpen, setClassMenuOpen] = useState(false);
  const [chatCommand, setChatCommand] = useState<'connect' | 'definitions' | 'formulas' | 'quiz' | 'summarize' | 'explain' | 'study-plan' | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [mainView, setMainView] = useState<'chat' | 'flashcards'>('chat');
  const [studyPlanBuilderOpen, setStudyPlanBuilderOpen] = useState(false);
  const [activeStudyPlan, setActiveStudyPlan] = useState<StudyPlanDraft | null>(null);
  const [generalSession, setGeneralSession] = useState<ChatSession | null>(null);
  const [studySession, setStudySession] = useState<ChatSession | null>(null);
  const [pausedStudySession, setPausedStudySession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);

  useEffect(() => {
    if (Number.isSafeInteger(id) && id > 0) markClassOpened(id);
  }, [id]);

  useEffect(() => {
    getClass(id).then((res) => setCls(res.data));
  }, [id]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => { if (active) setMessagesLoading(true); });
    getChatSessions(id).then(async ({ data: sessions }) => {
      if (!active) return;
      let general = sessions.find((session) => session.kind === 'general' && session.status === 'active') ?? null;
      if (!general) general = (await createChatSession(id, 'general')).data;
      const currentStudy = sessions.find((session) => session.kind === 'study_plan' && session.status === 'active') ?? null;
      const pausedStudy = sessions.find((session) => session.kind === 'study_plan' && session.status === 'paused') ?? null;
      if (!active) return;
      setGeneralSession(general);
      setStudySession(currentStudy);
      setPausedStudySession(pausedStudy);
      setActiveStudyPlan(currentStudy?.study_plan ?? null);
    }).catch(() => setNotice('Could not restore conversations'));
    return () => { active = false; };
  }, [id]);

  const currentSession = studySession ?? generalSession;
  const currentSessionId = currentSession?.id;
  useEffect(() => {
    if (!currentSessionId) return;
    let active = true;
    queueMicrotask(() => { if (active) setMessagesLoading(true); });
    getChatMessages(currentSessionId).then(({ data }) => {
      if (!active) return;
      setMessages(data.map((message) => ({ id: message.id, role: message.role, content: message.content, timestamp: new Date(message.created_at) })));
    }).catch(() => setNotice('Could not load this conversation'))
      .finally(() => { if (active) setMessagesLoading(false); });
    return () => { active = false; };
  }, [currentSessionId]);

  const pauseStudyChat = async () => {
    if (!studySession) return;
    const paused = (await updateChatSession(studySession.id, 'paused')).data;
    setPausedStudySession(paused);
    setStudySession(null);
    setActiveStudyPlan(null);
  };

  const resumeStudyChat = async () => {
    if (!pausedStudySession) return;
    const resumed = (await updateChatSession(pausedStudySession.id, 'active')).data;
    setPausedStudySession(null);
    setStudySession(resumed);
    setActiveStudyPlan(resumed.study_plan);
    setMainView('chat');
  };

  const endStudyChat = async () => {
    if (studySession) await updateChatSession(studySession.id, 'archived');
    setStudySession(null);
    setActiveStudyPlan(null);
    setChatCommand(null);
    setMainView('chat');
  };

  const clearCurrentChat = async () => {
    if (!currentSession) return;
    await updateChatSession(currentSession.id, 'archived');
    if (currentSession.kind === 'study_plan') {
      setStudySession(null);
      setActiveStudyPlan(null);
    } else {
      const replacement = (await createChatSession(id, 'general')).data;
      setGeneralSession(replacement);
      setMessages([]);
    }
  };

  useEffect(() => {
    if (!folderId) return;
    getClasses().then((res) => {
      const classesInFolder = res.data
        .filter((item) => item.folder_id === Number(folderId))
        .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
      setFolderClasses(classesInFolder);
    });
  }, [folderId]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setClassMenuOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setNotesLoading(true);
      setNotesError('');
    });
    getNotesByClass(id)
      .then((res) => { if (active) setNotes(res.data); })
      .catch(() => { if (active) setNotesError('Could not load this class’s sources. Please try again.'); })
      .finally(() => { if (active) setNotesLoading(false); });
    return () => { active = false; };
  }, [id, refreshTrigger]);

  const compactClassMenu = folderClasses.length > CLASS_MENU_COMPACT_LIMIT;
  const visibleClasses = compactClassMenu ? folderClasses.slice(0, CLASS_MENU_RECENT_LIMIT) : folderClasses;

  return (
    <div className="class-workspace">
      <header className="class-workspace-header">
        <Link to="/folders" className="class-workspace-wordmark">
          ShelfStudy
        </Link>
        <button type="button" className="class-workspace-icon-btn" aria-label="Toggle sidebar" onClick={() => setSidebarCollapsed((c) => !c)}>
          <Menu size={34} strokeWidth={2.2} />
        </button>
        <div className="class-workspace-class-picker">
          <button type="button" className="class-workspace-dropdown" aria-haspopup="menu" aria-expanded={classMenuOpen} aria-controls="folder-class-menu" onClick={() => setClassMenuOpen((open) => !open)}>
            <span>{cls?.name ?? 'Loading...'}</span><ChevronDown size={20} />
          </button>
          {classMenuOpen && (
            <div id="folder-class-menu" className="class-workspace-class-menu" role="menu" aria-label="Classes in this folder">
              {visibleClasses.map((item) => <button key={item.id} type="button" role="menuitem" className={item.id === id ? 'active' : ''} onClick={() => { setClassMenuOpen(false); navigate(`/folders/${folderId}/classes/${item.id}`); }}>{item.name}</button>)}
              {compactClassMenu && <Link role="menuitem" to={`/folders/${folderId}`} onClick={() => setClassMenuOpen(false)}>View all classes</Link>}
              {folderClasses.length === 0 && <span>No classes found.</span>}
            </div>
          )}
        </div>
        <button type="button" className="class-workspace-search" aria-label="Search is coming soon" title="Search is coming soon" onClick={() => setNotice('Search')}><Search size={34} strokeWidth={2.1} /></button>
      </header>
      <div className="class-workspace-body">
        <aside className={`class-workspace-sidebar${sidebarCollapsed ? ' collapsed' : ''}`}>
          {sidebarView.mode === 'sections' ? (
            <SidebarSections
              notes={notes}
              onOpenSourceTree={(category) => setSidebarView({ mode: 'source-tree', category })}
              onChat={() => { setMainView('chat'); setNotice(null); setChatCommand('explain'); }}
              onQuiz={() => { setMainView('chat'); setNotice(null); setChatCommand('quiz'); }}
              onSummarize={() => { setMainView('chat'); setNotice(null); setChatCommand('summarize'); }}
              onExtractDefinitions={() => { setMainView('chat'); setNotice(null); setChatCommand('definitions'); }}
              onExtractFormulas={() => { setMainView('chat'); setNotice(null); setChatCommand('formulas'); }}
              onStudyPlan={() => {
                setNotice(null);
                setStudyPlanBuilderOpen(true);
              }}
              studyPlanActive={Boolean(activeStudyPlan)}
              pausedStudyPlan={Boolean(pausedStudySession)}
              onPauseStudyChat={pauseStudyChat}
              onResumeStudyChat={resumeStudyChat}
              onEndStudyChat={endStudyChat}
              onConnectConcepts={() => { setMainView('chat'); setNotice(null); setChatCommand('connect'); }}
              onFlashcards={() => { setNotice(null); setMainView('flashcards'); }}
              onComingSoon={(tool) => { setMainView('chat'); setNotice(tool); }}
            />
          ) : (
            <SourceTree
              classId={id}
              notes={notes}
              loading={notesLoading}
              loadError={notesError}
              selectedNoteId={selectedNoteId}
              activeCategory={sidebarView.category}
              onBack={() => setSidebarView({ mode: 'sections' })}
              onNoteUploaded={() => setRefreshTrigger((n) => n + 1)}
              onNoteClick={(note) => setSelectedNoteId((currentId) => currentId === note.id ? undefined : note.id)}
            />
          )}
        </aside>
        <main className="class-workspace-main">
          {mainView === 'flashcards' ? (
            <FlashcardStudy classId={id} selectedNoteId={selectedNoteId} onClose={() => setMainView('chat')} />
          ) : (
            <ChatInterface classId={id} sessionId={currentSession?.id} messages={messages} setMessages={setMessages} messagesLoading={messagesLoading} selectedNoteId={selectedNoteId} studyPlan={activeStudyPlan ?? undefined} command={chatCommand} onCommandHandled={() => setChatCommand(null)} onNoteSaved={() => setRefreshTrigger((n) => n + 1)} notice={notice} onClearChat={clearCurrentChat} />
          )}
        </main>
      </div>

      {studyPlanBuilderOpen && (
        <StudyPlanBuilder
          classId={id}
          className={cls?.name ?? 'This class'}
          notes={notes}
          initialDraft={activeStudyPlan ?? pausedStudySession?.study_plan}
          onClose={() => setStudyPlanBuilderOpen(false)}
          onNoteUploaded={() => setRefreshTrigger((n) => n + 1)}
          onStartPlan={async (draft) => {
            const session = (await createChatSession(id, 'study_plan', draft)).data;
            setStudySession(session);
            setPausedStudySession(null);
            setActiveStudyPlan(draft);
            setStudyPlanBuilderOpen(false);
            setMainView('chat');
            setChatCommand('study-plan');
          }}
          onSavePlan={studySession || pausedStudySession ? async (draft) => {
            const sessionToUpdate = studySession ?? pausedStudySession;
            if (!sessionToUpdate) return;
            const updated = (await updateStudyPlan(sessionToUpdate.id, draft)).data;
            if (updated.status === 'active') {
              setStudySession(updated);
              setActiveStudyPlan(updated.study_plan);
            } else {
              setPausedStudySession(updated);
            }
            setStudyPlanBuilderOpen(false);
          } : undefined}
        />
      )}
    </div>
  );
}
