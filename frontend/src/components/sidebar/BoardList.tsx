import { useNavigate, useParams } from 'react-router-dom';
import styled from '@emotion/styled';
import { 
  FolderKanban, 
  Users, 
  Headphones, 
  UserCircle, 
  DollarSign,
  Plus 
} from 'lucide-react';
import { BoardType } from '../../types';

const ListContainer = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
`;

const SectionTitle = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text.secondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  padding: 0 ${({ theme }) => theme.spacing.sm};
`;

const BoardItem = styled.button<{ active?: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background-color: ${({ theme, active }) => 
    active ? theme.colors.primary.lighter : 'transparent'};
  color: ${({ theme, active }) => 
    active ? theme.colors.primary.main : theme.colors.text.primary};
  transition: all ${({ theme }) => theme.transitions.fast};
  margin-bottom: ${({ theme }) => theme.spacing.xs};

  &:hover {
    background-color: ${({ theme, active }) => 
      active ? theme.colors.primary.lighter : theme.colors.background.hover};
  }

  svg {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }
`;

const BoardName = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  flex: 1;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const AddButton = styled(BoardItem)`
  color: ${({ theme }) => theme.colors.text.secondary};
  border: 1px dashed ${({ theme }) => theme.colors.border.main};
  background-color: transparent;

  &:hover {
    color: ${({ theme }) => theme.colors.primary.main};
    border-color: ${({ theme }) => theme.colors.primary.main};
    background-color: ${({ theme }) => theme.colors.primary.lighter};
  }
`;

interface Board {
  id: string;
  name: string;
  type: BoardType;
}

const mockBoards: Board[] = [
  { id: 'demo', name: 'Projects Board', type: 'project' },
  { id: 'crm', name: 'CRM Leads', type: 'crm' },
  { id: 'support', name: 'Support Tickets', type: 'support' },
  { id: 'hr', name: 'HR Management', type: 'hr' },
  { id: 'finance', name: 'Finance Tracker', type: 'finance' },
];

const getBoardIcon = (type: BoardType) => {
  switch (type) {
    case 'project':
      return FolderKanban;
    case 'crm':
      return Users;
    case 'support':
      return Headphones;
    case 'hr':
      return UserCircle;
    case 'finance':
      return DollarSign;
    default:
      return FolderKanban;
  }
};

export const BoardList: React.FC = () => {
  const navigate = useNavigate();
  const { boardId } = useParams();

  const handleBoardClick = (id: string) => {
    navigate(`/board/${id}`);
  };

  return (
    <ListContainer>
      <SectionTitle>Boards</SectionTitle>
      {mockBoards.map((board) => {
        const Icon = getBoardIcon(board.type);
        return (
          <BoardItem
            key={board.id}
            active={boardId === board.id}
            onClick={() => handleBoardClick(board.id)}
          >
            <Icon />
            <BoardName>{board.name}</BoardName>
          </BoardItem>
        );
      })}
      <AddButton>
        <Plus />
        <BoardName>Add Board</BoardName>
      </AddButton>
    </ListContainer>
  );
};
