'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { getRegisterErrorMessage } from '@/lib/register-auth-errors';

type RegisterResult = {
  success: boolean;
  error?: string;
};

const avatarColors = ['#1e1b4b', '#0f766e', '#b45309', '#7c3aed', '#be185d', '#0369a1'];

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function pickAvatarColor(email: string) {
  const seed = [...email].reduce((total, char) => total + char.charCodeAt(0), 0);
  return avatarColors[seed % avatarColors.length];
}

export async function registerUser(formData: FormData): Promise<RegisterResult> {
  const name = getString(formData, 'name');
  const department = getString(formData, 'department');
  const position = getString(formData, 'position');
  const email = getString(formData, 'email').toLowerCase();
  const password = getString(formData, 'password');

  if (!name || !department || !position || !email || !password) {
    return { success: false, error: '필수 정보를 모두 입력해 주세요.' };
  }

  if (password.length < 8) {
    return { success: false, error: '비밀번호는 8자 이상이어야 합니다.' };
  }

  try {
    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        department,
        position,
        avatar_initial: name.charAt(0).toUpperCase(),
        avatar_color: pickAvatarColor(email),
      },
    });

    if (error) {
      console.error('Admin sign up failed', error);
      return { success: false, error: getRegisterErrorMessage(error) };
    }

    return { success: true };
  } catch (error) {
    console.error('Admin sign up failed', error);
    return { success: false, error: getRegisterErrorMessage(error) };
  }
}
