import styled from '@emotion/styled';
import { Search, Bell, User } from 'lucide-react';

const TopBarContainer = styled.header`
  height: 60px;
  background-color: ${({ theme }) => theme.colors.background.primary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.light};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 ${({ theme }) => theme.spacing.xl};
  flex-shrink: 0;
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xl};
  flex: 1;
`;

const SearchContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 400px;
`;

const SearchInput = styled.input`
  width: 100%;
  height: 36px;
  padding: 0 ${({ theme }) => theme.spacing.lg} 0 ${({ theme }) => theme.spacing['3xl']};
  border: 1px solid ${({ theme }) => theme.colors.border.main};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  background-color: ${({ theme }) => theme.colors.background.secondary};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary.main};
    background-color: ${({ theme }) => theme.colors.background.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary.lighter};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.text.tertiary};
  }
`;

const SearchIcon = styled(Search)`
  position: absolute;
  left: ${({ theme }) => theme.spacing.md};
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: ${({ theme }) => theme.colors.text.secondary};
  pointer-events: none;
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const IconButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all ${({ theme }) => theme.transitions.fast};
  position: relative;

  &:hover {
    background-color: ${({ theme }) => theme.colors.background.hover};
  }

  svg {
    width: 20px;
    height: 20px;
    color: ${({ theme }) => theme.colors.text.secondary};
  }
`;

const NotificationBadge = styled.span`
  position: absolute;
  top: 6px;
  right: 6px;
  width: 8px;
  height: 8px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  background-color: ${({ theme }) => theme.colors.status.error};
  border: 2px solid ${({ theme }) => theme.colors.background.primary};
`;

const ProfileButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background-color: ${({ theme }) => theme.colors.background.hover};
  }
`;

const Avatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary.main} 0%, ${({ theme }) => theme.colors.primary.dark} 100%);
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 18px;
    height: 18px;
    color: ${({ theme }) => theme.colors.neutral.white};
  }
`;

const UserInfo = styled.div`
  text-align: left;
`;

const UserName = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const UserRole = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

export const TopBar: React.FC = () => {
  return (
    <TopBarContainer>
      <LeftSection>
        <SearchContainer>
          <SearchIcon />
          <SearchInput 
            type="text" 
            placeholder="Search items, boards..." 
          />
        </SearchContainer>
      </LeftSection>

      <RightSection>
        <IconButton>
          <Bell />
          <NotificationBadge />
        </IconButton>

        <ProfileButton>
          <Avatar>
            <User />
          </Avatar>
          <UserInfo>
            <UserName>John Doe</UserName>
            <UserRole>Admin</UserRole>
          </UserInfo>
        </ProfileButton>
      </RightSection>
    </TopBarContainer>
  );
};
