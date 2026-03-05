import styled from '@emotion/styled';

const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary.lighter} 0%, ${({ theme }) => theme.colors.neutral.white} 100%);
`;

const LoginCard = styled.div`
  width: 100%;
  max-width: 400px;
  padding: ${({ theme }) => theme.spacing['3xl']};
  background-color: ${({ theme }) => theme.colors.background.primary};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: ${({ theme }) => theme.shadows.xl};
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['3xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing['2xl']};
`;

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing['2xl']};
`;

export const LoginPage: React.FC = () => {
  return (
    <LoginContainer>
      <LoginCard>
        <Title>Welcome Back</Title>
        <Subtitle>Login page will be implemented in Phase 6</Subtitle>
      </LoginCard>
    </LoginContainer>
  );
};
