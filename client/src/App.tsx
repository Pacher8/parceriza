import { Route, Routes } from 'react-router-dom';
import { Home } from './pages/Home';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { Termos } from './pages/Termos';
import { Privacidade } from './pages/Privacidade';
import { Jobs } from './pages/Jobs';
import { JobDetail } from './pages/JobDetail';
import { Agente } from './pages/Agente';
import { Juridico } from './pages/Juridico';
import { Tokens } from './pages/Tokens';
import { Conquistas } from './pages/Conquistas';
import { Apresentacao } from './pages/Apresentacao';
import { Ads } from './pages/Ads';
import { Tributaria } from './pages/Tributaria';
import { NotFound } from './pages/NotFound';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/termos" element={<Termos />} />
      <Route path="/privacidade" element={<Privacidade />} />
      <Route path="/jobs" element={<Jobs />} />
      <Route path="/jobs/:id" element={<JobDetail />} />
      <Route path="/agente" element={<Agente />} />
      <Route path="/juridico" element={<Juridico />} />
      <Route path="/tokens" element={<Tokens />} />
      <Route path="/conquistas" element={<Conquistas />} />
      <Route path="/perfil/apresentacao" element={<Apresentacao />} />
      <Route path="/ads" element={<Ads />} />
      <Route path="/tributaria" element={<Tributaria />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
