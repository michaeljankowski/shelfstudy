import { BrowserRouter, Routes, Route } from 'react-router-dom';
import IntroHero from './routes/IntroHero';
import FoldersGrid from './routes/FoldersGrid';
import FolderDetail from './routes/FolderDetail';
import ClassWorkspace from './routes/ClassWorkspace';
import LibraryStatus from './routes/LibraryStatus';
import ProductivityStatus from './routes/ProductivityStatus';
import './styles/App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IntroHero />} />
        <Route path="/folders" element={<FoldersGrid />} />
        <Route path="/recent" element={<LibraryStatus view="recent" />} />
        <Route path="/trash" element={<LibraryStatus view="trash" />} />
        <Route path="/productivity/todo" element={<ProductivityStatus view="todo" />} />
        <Route path="/productivity/assignments" element={<ProductivityStatus view="assignments" />} />
        <Route path="/productivity/timer" element={<ProductivityStatus view="timer" />} />
        <Route path="/productivity/calendar" element={<ProductivityStatus view="calendar" />} />
        <Route path="/folders/:folderId" element={<FolderDetail />} />
        <Route path="/folders/:folderId/classes/:classId" element={<ClassWorkspace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
