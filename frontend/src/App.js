import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Telas from './pages/Telas';
import Entalles from './pages/Entalles';
import TiposProducto from './pages/TiposProducto';
import MuestrasBase from './pages/MuestrasBase';
import Bases from './pages/Bases';
import Tizados from './pages/Tizados';
import '@/App.css';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/telas" element={<Telas />} />
            <Route path="/entalles" element={<Entalles />} />
            <Route path="/tipos-producto" element={<TiposProducto />} />
            <Route path="/muestras-base" element={<MuestrasBase />} />
            <Route path="/bases" element={<Bases />} />
            <Route path="/tizados" element={<Tizados />} />
          </Routes>
        </Layout>
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
