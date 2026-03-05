import styled from '@emotion/styled';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { BoardList } from './BoardList';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface LeftSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const SidebarContainer = styled.aside<{ collapsed: boolean }>`
  width: ${({ collapsed }) => (collapsed ? '60px' : '260px')};
  height: 100vh;
  background-color: ${({ theme }) => theme.colors.background.primary};
  border-right: 1px solid ${({ theme }) => theme.colors.border.light};
  display: flex;
  flex-direction: column;
  transition: width ${({ theme }) => theme.transitions.slow};
  overflow: hidden;
  flex-shrink: 0;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    width: ${({ collapsed }) => (collapsed ? '0' : '260px')};
    position: absolute;
    left: 0;
    top: 0;
    z-index: ${({ theme }) => theme.zIndex.fixed};
    box-shadow: ${({ theme, collapsed }) => (collapsed ? 'none' : theme.shadows.lg)};
  }
`;

const SidebarHeader = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.light};
  flex-shrink: 0;
`;

const SidebarContent = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
`;

const ToggleButton = styled.button`
  position: absolute;
  right: -12px;
  top: 20px;
  width: 24px;
  height: 24px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  background-color: ${({ theme }) => theme.colors.background.primary};
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  z-index: 10;

  &:hover {
    background-color: ${({ theme }) => theme.colors.background.hover};
    border-color: ${({ theme }) => theme.colors.primary.main};
  }

  svg {
    width: 14px;
    height: 14px;
    color: ${({ theme }) => theme.colors.text.secondary};
  }
`;

export const LeftSidebar: React.FC<LeftSidebarProps> = ({ collapsed, onToggleCollapse }) => {
  return (
    <SidebarContainer collapsed={collapsed}>
      <ToggleButton onClick={onToggleCollapse}>
        {collapsed ? <ChevronRight /> : <ChevronLeft />}
      </ToggleButton>
      
      {!collapsed && (
        <>
          <SidebarHeader>
            <WorkspaceSwitcher />
          </SidebarHeader>
          <SidebarContent>
            <BoardList />
          </SidebarContent>
        </>
      )}
    </SidebarContainer>
  );
};
