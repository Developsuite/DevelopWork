import { useState } from 'react';
import styled from '@emotion/styled';
import { ChevronDown, Building2 } from 'lucide-react';

const SwitcherContainer = styled.div`
  position: relative;
`;

const SwitcherButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.lg}`};
  background-color: ${({ theme }) => theme.colors.background.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  transition: all ${({ theme }) => theme.transitions.fast};
  border: 1px solid transparent;

  &:hover {
    background-color: ${({ theme }) => theme.colors.background.hover};
    border-color: ${({ theme }) => theme.colors.primary.light};
  }
`;

const IconWrapper = styled.div`
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary.main} 0%, ${({ theme }) => theme.colors.primary.dark} 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    width: 18px;
    height: 18px;
    color: ${({ theme }) => theme.colors.neutral.white};
  }
`;

const WorkspaceInfo = styled.div`
  flex: 1;
  text-align: left;
  min-width: 0;
`;

const WorkspaceName = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const WorkspaceType = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-top: 2px;
`;

const ChevronIcon = styled(ChevronDown)`
  width: 16px;
  height: 16px;
  color: ${({ theme }) => theme.colors.text.secondary};
  flex-shrink: 0;
`;

export const WorkspaceSwitcher: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <SwitcherContainer>
      <SwitcherButton onClick={() => setIsOpen(!isOpen)}>
        <IconWrapper>
          <Building2 />
        </IconWrapper>
        <WorkspaceInfo>
          <WorkspaceName>My Workspace</WorkspaceName>
          <WorkspaceType>Free Plan</WorkspaceType>
        </WorkspaceInfo>
        <ChevronIcon />
      </SwitcherButton>
    </SwitcherContainer>
  );
};
