import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import MiPerfil from './pages/MiPerfil';
import MarcaDetalle from './pages/MarcaDetalle';
import ModelPageDetalle from './pages/ModelPageDetalle';
import ModelDetail from './pages/ModelDetail';
import Presupuesto from './pages/Presupuesto';
import QuotePublic from './pages/QuotePublic';
import { AuthProvider, useAuth } from '@/lib/AuthContext';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      <Route path="/Admin" element={<Pages.Admin />} />
      <Route path="/admin" element={<Pages.Admin />} />
      {Object.entries(Pages).filter(([path]) => path !== "Admin").map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="/MiPerfil" element={<LayoutWrapper currentPageName="MiPerfil"><MiPerfil /></LayoutWrapper>} />
      <Route path="/marca/:slug" element={<LayoutWrapper currentPageName="MarcaDetalle"><MarcaDetalle /></LayoutWrapper>} />
      <Route path="/marca/modelo/:slug" element={<LayoutWrapper currentPageName="ModelPageDetalle"><ModelPageDetalle /></LayoutWrapper>} />
      <Route path="/modelo/:slug" element={<LayoutWrapper currentPageName="ModelPageDetalle"><ModelPageDetalle /></LayoutWrapper>} />
      <Route path="/ModelDetail" element={<LayoutWrapper currentPageName="ModelDetail"><ModelDetail /></LayoutWrapper>} />
      <Route path="/presupuesto" element={<LayoutWrapper currentPageName="Presupuesto"><Presupuesto /></LayoutWrapper>} />
      <Route path="/quote/:id" element={<LayoutWrapper currentPageName="QuotePublic"><QuotePublic /></LayoutWrapper>} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
