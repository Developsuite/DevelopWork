import { Outlet } from 'react-router-dom';
import styled from '@emotion/styled';
import { useAppSelector, useAppDispatch } from '../../store';
import { setSidebarCollapsed } from '../../store/slices/uiSlice';
import { LeftSidebar } from '../sidebar/LeftSidebar';
import { TopBar } from '../topbar/TopBar';

const AppContainer = styled.div`
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: ${({ theme }) => theme.colors.background.secondary};
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
`;

const ContentArea = styled.main`
  flex: 1;
  overflow: auto;
  background-color: ${({ theme }) => theme.colors.background.primary};
`;

export const AppShell: React.FC = () => {
  const dispatch = useAppDispatch();
  const sidebarCollapsed = useAppSelector((state) => state.ui.sidebarCollapsed);

  const handleToggleSidebar = () => {
    dispatch(setSidebarCollapsed(!sidebarCollapsed));
  };

  return (
    <AppContainer>
      <LeftSidebar 
        collapsed={sidebarCollapsed} 
        onToggleCollapse={handleToggleSidebar} 
      />
      <MainContent>
        <TopBar />
        <ContentArea>
          <Outlet />
        </ContentArea>
      </MainContent>
    </AppContainer>
  );
};
