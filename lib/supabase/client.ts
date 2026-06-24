import { createClient } from '@supabase/supabase-js';

const rawUrl = (typeof process !== 'undefined' ? process.env.SUPABASE_URL : '') || '';
const rawKey = (typeof process !== 'undefined' ? process.env.SUPABASE_ANON_KEY : '') || '';

const isUrlValid = rawUrl && rawUrl.startsWith('http') && !rawUrl.includes('placeholder-project');
const supabaseUrl = isUrlValid ? rawUrl : 'https://placeholder-project.supabase.co';
const supabaseAnonKey = rawKey && rawKey.trim() !== '' && rawKey !== 'placeholder-anon-key' ? rawKey : 'placeholder-anon-key';

// Highly robust Mock Client to prevent actual physical fetch requests when unconfigured
const createMockSupabaseClient = (): any => {
  const getMockUsers = () => {
    try {
      const dbStr = localStorage.getItem('multiplus_academic_db');
      if (dbStr) {
        const parsed = JSON.parse(dbStr);
        if (parsed.users) return parsed.users;
      }
    } catch (e) {}
    return [];
  };

  const getQueryBuilder = (tableName: string) => {
    const builder: any = {
      select: () => builder,
      insert: (data: any) => {
        try {
          if (tableName === 'users' || tableName === 'profiles') {
            const dbStr = localStorage.getItem('multiplus_academic_db') || '{}';
            const parsed = JSON.parse(dbStr);
            if (!parsed.users) parsed.users = [];
            const items = Array.isArray(data) ? data : [data];
            items.forEach((item: any) => {
              parsed.users.push(item);
            });
            localStorage.setItem('multiplus_academic_db', JSON.stringify(parsed));
          }
        } catch (e) {}
        return builder;
      },
      update: () => builder,
      delete: () => builder,
      eq: () => builder,
      neq: () => builder,
      gt: () => builder,
      lt: () => builder,
      gte: () => builder,
      lte: () => builder,
      like: () => builder,
      ilike: () => builder,
      in: () => builder,
      order: () => builder,
      limit: () => builder,
      single: async () => {
        const users = getMockUsers();
        return { data: users.length > 0 ? users[0] : null, error: null };
      },
      maybeSingle: async () => {
        const users = getMockUsers();
        return { data: users.length > 0 ? users[0] : null, error: null };
      },
      then: (resolve: any) => {
        const users = getMockUsers();
        resolve({ data: tableName === 'users' || tableName === 'profiles' ? users : [], error: null });
      }
    };
    return builder;
  };

  return {
    from: (tableName: string) => getQueryBuilder(tableName),
    auth: {
      getSession: async () => {
        try {
          const sessionUserStr = localStorage.getItem('multiplus_current_session');
          if (sessionUserStr) {
            const user = JSON.parse(sessionUserStr);
            return {
              data: {
                session: {
                  user: {
                    id: user.id,
                    email: user.email,
                    user_metadata: {
                      nome_completo: `${user.firstName} ${user.lastName}`,
                      role: user.role === 'ADMIN' ? 'ADMIN' : user.role === 'INSTRUCTOR' ? 'PROFESSOR' : 'ALUNO'
                    }
                  }
                }
              },
              error: null
            };
          }
        } catch (e) {}
        return { data: { session: null }, error: null };
      },
      getUser: async () => {
        try {
          const sessionUserStr = localStorage.getItem('multiplus_current_session');
          if (sessionUserStr) {
            const user = JSON.parse(sessionUserStr);
            return {
              data: {
                user: {
                  id: user.id,
                  email: user.email
                }
              },
              error: null
            };
          }
        } catch (e) {}
        return { data: { user: null }, error: null };
      },
      onAuthStateChange: (callback: any) => {
        setTimeout(() => {
          try {
            const sessionUserStr = localStorage.getItem('multiplus_current_session');
            if (sessionUserStr) {
              const user = JSON.parse(sessionUserStr);
              callback('SIGNED_IN', {
                user: {
                  id: user.id || 'mock_user_' + Date.now(),
                  email: user.email,
                  user_metadata: {
                    nome_completo: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                    role: user.role === 'ADMIN' ? 'ADMIN' : user.role === 'INSTRUCTOR' ? 'PROFESSOR' : 'ALUNO'
                  }
                }
              });
            } else {
              callback('SIGNED_OUT', null);
            }
          } catch (e) {}
        }, 50);
        return {
          data: {
            subscription: {
              unsubscribe: () => {}
            }
          }
        };
      },
      signInWithPassword: async ({ email }: { email: string }) => {
        return { data: { user: { id: 'mock_' + Date.now(), email } }, error: null };
      },
      signUp: async ({ email, options }: { email: string, options?: any }) => {
        return {
          data: {
            user: {
              id: 'mock_' + Date.now(),
              email,
              user_metadata: options?.data || {}
            }
          },
          error: null
        };
      },
      signOut: async () => {
        return { error: null };
      },
      resetPasswordForEmail: async () => {
        return { data: {}, error: null };
      }
    }
  };
};

export const supabase = isUrlValid && rawKey && rawKey !== 'placeholder-anon-key'
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockSupabaseClient();
