import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { ThemeProvider } from './styles/ThemeProvider';
import { AppShell } from './components/layout/AppShell';
import { BoardPage } from './pages/board/BoardPage';
import { LoginPage } from './pages/auth/LoginPage';

console.log('App component loaded');

function App() {
  console.log('App rendering');
  
  return (
    <Provider store={store}>
      <ThemeProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<AppShell />}>
              <Route index element={<Navigate to="/board/demo" replace />} />
              <Route path="board/:boardId" element={<BoardPage />} />
            </Route>
          </Routes>
        </Router>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
