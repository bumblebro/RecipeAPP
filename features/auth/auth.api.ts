import { api } from '../api/api.client';
import { AuthUser } from '../../types/auth';

export const authApi = {
  /**
   * Sync the current Firebase user profile with the backend database.
   * This should be called after a successful login or profile update.
   */
  syncUserProfile: async (): Promise<{ success: boolean; user: any }> => {
    return api.post('/auth/profile', {});
  },
};
