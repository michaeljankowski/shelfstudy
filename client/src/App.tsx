import { BrowserRouter, Routes, Route } from 'react-router-dom';
import IntroHero from './routes/IntroHero';
import FoldersGrid from './routes/FoldersGrid';
import FolderDetail from './routes/FolderDetail';
import AppShell from './routes/AppShell';
import RouteStub from './routes/RouteStub';
import './styles/App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IntroHero />} />
        <Route path="/folders" element={<FoldersGrid />} />
        <Route path="/folders/:folderId" element={<FolderDetail />} />
        <Route
          path="/folders/:folderId/classes/:classId"
          element={
            <AppShell>
              <RouteStub label="Class workspace" />
            </AppShell>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
