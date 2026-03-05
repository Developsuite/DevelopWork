import { useParams } from 'react-router-dom';
import styled from '@emotion/styled';

const PageContainer = styled.div`
  padding: ${({ theme }) => theme.spacing.xl};
  height: 100%;
`;

const PageTitle = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['3xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const Placeholder = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
  background-color: ${({ theme }) => theme.colors.background.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  border: 2px dashed ${({ theme }) => theme.colors.border.main};
`;

const PlaceholderText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

export const BoardPage: React.FC = () => {
  const { boardId } = useParams();

  return (
    <PageContainer>
      <PageTitle>Board: {boardId}</PageTitle>
      <Placeholder>
        <PlaceholderText>Board content will be displayed here</PlaceholderText>
      </Placeholder>
    </PageContainer>
  );
};
