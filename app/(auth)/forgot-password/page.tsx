import ForgotPasswordForm from './forgot-password-form';

type ForgotPasswordPageProps = {
  searchParams?: Promise<{
    error?: string | string[];
  }>;
};

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const params = searchParams ? await searchParams : {};
  const hasLinkError = Boolean(params.error);

  return (
    <ForgotPasswordForm
      initialError={hasLinkError
        ? '재설정 링크가 만료되었거나 유효하지 않습니다. 재설정 메일을 다시 요청하세요.'
        : ''}
    />
  );
}
