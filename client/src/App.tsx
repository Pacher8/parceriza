import { Route, Routes } from 'react-router-dom';
import { Home } from './pages/Home';
import { Jobs } from './pages/Jobs';
import { JobDetail } from './pages/JobDetail';
import { Agente } from './pages/Agente';
import { NotFound } from './pages/NotFound';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/jobs" element={<Jobs />} />
      <Route path="/jobs/:id" element={<JobDetail />} />
      <Route path="/agente" element={<Agente />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
