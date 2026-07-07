import { createClient } from '@supabase/supabase-js';

// Setup global offline mode detection
declare global {
  interface Window {
    isSupabaseOfflineMode: boolean;
  }
}

const rawUrl = (import.meta as any).env?.VITE_SUPABASE_URL || (typeof process !== 'undefined' ? process.env.SUPABASE_URL : '') || '';
const rawKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || (typeof process !== 'undefined' ? process.env.SUPABASE_ANON_KEY : '') || '';

const isUrlValid = rawUrl && rawUrl.startsWith('http') && !rawUrl.includes('placeholder') && !rawUrl.includes('your-project');
const isKeyValid = rawKey && rawKey !== 'placeholder-anon-key' && rawKey !== 'your-anon-key' && !rawKey.startsWith('your-') && !rawKey.includes('...');

let realSupabase: any = null;
let useOfflineFallback = false;

if (!isUrlValid || !isKeyValid) {
  console.warn('Supabase credentials missing or invalid. Switched to Offline/Mock simulation mode.');
  useOfflineFallback = true;
  if (typeof window !== 'undefined') {
    window.isSupabaseOfflineMode = true;
    localStorage.setItem('supabase_offline_mode', 'true');
  }
} else {
  try {
    realSupabase = createClient(rawUrl, rawKey);
  } catch (e) {
    console.warn('Failed to initialize Supabase client, falling back:', e);
    useOfflineFallback = true;
  }
}

// =========================================================================
// MOCK DATA SEED GENERATOR
// =========================================================================
function getSeedDataForTable(tableName: string): any[] {
  switch (tableName) {
    case 'users':
      return [
        {
          id: 'admin-id',
          email: 'admin@multiplusacademy.com',
          nome_completo: 'Administrador Geral',
          role: 'ADMIN',
          foto_perfil: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150&h=150',
          telefone: '+244 912 345 678'
        },
        {
          id: 'professor-id',
          email: 'professor@multiplusacademy.com',
          nome_completo: 'Professor MultiPlus',
          role: 'PROFESSOR',
          foto_perfil: 'https://res.cloudinary.com/deeki0eou/image/upload/v1782520966/multiplus-academy-esmeralda-bruno-sumbelelo_qtuere.jpg',
          telefone: '+244 923 456 789'
        },
        {
          id: 'aluno-id',
          email: 'aluno@multiplusacademy.com',
          nome_completo: 'Aluno de Elite',
          role: 'ALUNO',
          foto_perfil: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150&h=150',
          telefone: '+244 934 567 890'
        }
      ];
    case 'profiles':
      return [
        { id: 'p-1', user_id: 'admin-id', biografia: 'Administrador Geral do Portal LMS', nivel_ingles: 'Avançado' },
        { id: 'p-2', user_id: 'professor-id', biografia: 'Formadora Pedagógica e docente sénior na MultiPlus Academy.', nivel_ingles: 'Nativo' },
        { id: 'p-3', user_id: 'aluno-id', biografia: 'Advogado júnior focado em drafting de contratos de energia.', nivel_ingles: 'Intermédio' }
      ];
    case 'courses':
      return [
        {
          id: 'eng-legal-angola',
          slug: 'english-for-legal-field-angola',
          title: 'English for the Legal Field in Angola',
          description: 'Eleve o seu perfil profissional através de uma formação desenhada especificamente para juristas, advogados, consultores e profissionais do sector jurídico angolano.',
          duration: '12 Semanas',
          category: 'Inglês Jurídico',
          status: 'PUBLISHED',
          thumbnail: 'https://images.unsplash.com/photo-1518152006812-edab29b069ac?auto=format&fit=crop&q=80&w=300',
          hours: 72
        },
        {
          id: 'legal-writing',
          slug: 'advanced-legal-writing-contracts',
          title: 'Advanced Legal Writing & Contract Drafting',
          description: 'Workshop intensivo focado exclusivamente na arte de redigir peças processuais, contratos internacionais sofisticados.',
          duration: '4 Semanas',
          category: 'Redação de Contratos',
          status: 'PUBLISHED',
          thumbnail: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=300',
          hours: 24
        }
      ];
    case 'lessons':
      return [
        {
          id: 'lesson-1',
          course_id: 'eng-legal-angola',
          titulo: 'Aula 1: Introdução ao Common Law vs. Civil Law',
          descricao: 'Análise estrutural e conceitual entre os dois maiores sistemas jurídicos do mundo, com foco na aplicabilidade para o mercado de Luanda.',
          video_url: 'https://www.youtube.com/embed/9Bv_p68S69w',
          duracao: '45 mins',
          ordem: 1
        },
        {
          id: 'lesson-2',
          course_id: 'eng-legal-angola',
          titulo: 'Aula 2: Drafting de Cláusulas de Exclusão de Responsabilidade',
          descricao: 'Como delimitar e limitar riscos em contratos comerciais sob a lei de Angola.',
          video_url: 'https://www.youtube.com/embed/9Bv_p68S69w',
          duracao: '50 mins',
          ordem: 2
        },
        {
          id: 'lesson-3',
          course_id: 'eng-legal-angola',
          titulo: 'Aula 3: Cláusulas de Boilerplate',
          descricao: 'Estudo prático de cláusulas padrão de força maior, governança e foro arbitral.',
          video_url: 'https://www.youtube.com/embed/9Bv_p68S69w',
          duracao: '60 mins',
          ordem: 3
        }
      ];
    case 'student_progress':
      return [
        { id: 'prog-1', student_id: 'aluno-id', lesson_id: 'lesson-1', completed: true, created_at: new Date().toISOString() }
      ];
    case 'enrollments':
      return [
        { id: 'en-1', student_id: 'aluno-id', course_id: 'eng-legal-angola', status: 'ACTIVE', data_inicio: new Date().toISOString() }
      ];
    case 'messages':
      return [
        {
          id: 'm-1',
          sender_id: 'professor-id',
          receiver_id: 'aluno-id',
          texto: 'Olá Dr., bem-vindo ao portal da MultiPlus Academy! Bons estudos!',
          lido: true,
          created_at: new Date(Date.now() - 3600000 * 2).toISOString()
        }
      ];
    case 'announcements':
      return [
        {
          id: 'ann-1',
          author_id: 'professor-id',
          titulo: 'Workshop de Abertura em Luanda',
          mensagem: 'Lembramos a todos que o nosso workshop presencial sobre arbitragem comercial ocorrerá no próximo sábado letivo às 09:00.',
          destinatarios: 'ALL',
          created_at: new Date().toISOString()
        }
      ];
    case 'scheduled_lessons':
      return [];
    default:
      return [];
  }
}

// =========================================================================
// CHAINABLE QUERY BUILDER SIMULATION
// =========================================================================
class MockQueryBuilder {
  private tableName: string;
  private filters: Array<(item: any) => boolean> = [];
  private orderField: string | null = null;
  private orderAscending = true;
  private isSingle = false;
  private isMaybeSingle = false;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select() { return this; }
  eq(field: string, value: any) {
    this.filters.push(item => item[field] === value);
    return this;
  }
  neq(field: string, value: any) {
    this.filters.push(item => item[field] !== value);
    return this;
  }
  in(field: string, values: any[]) {
    this.filters.push(item => values.includes(item[field]));
    return this;
  }
  or(expression: string) {
    this.filters.push(item => {
      const parts = expression.split(',');
      return parts.some(part => {
        const subparts = part.split('.');
        const field = subparts[0];
        const val = subparts[2];
        return item[field] === val;
      });
    });
    return this;
  }
  order(field: string, options?: { ascending?: boolean }) {
    this.orderField = field;
    this.orderAscending = options?.ascending !== false;
    return this;
  }
  limit() { return this; }
  single() {
    this.isSingle = true;
    return this;
  }
  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  private getLocalData(): any[] {
    if (typeof window === 'undefined') return getSeedDataForTable(this.tableName);
    const key = `mock_table_${this.tableName}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        // use default
      }
    }
    const defaults = getSeedDataForTable(this.tableName);
    localStorage.setItem(key, JSON.stringify(defaults));
    return defaults;
  }

  private saveLocalData(data: any[]) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`mock_table_${this.tableName}`, JSON.stringify(data));
    }
  }

  async insert(rowOrRows: any) {
    const current = this.getLocalData();
    const rows = Array.isArray(rowOrRows) ? rowOrRows : [rowOrRows];
    const newRows = rows.map(r => ({
      id: r.id || `mock-id-${Math.random().toString(36).substr(2, 9)}`,
      created_at: r.created_at || new Date().toISOString(),
      ...r
    }));
    current.push(...newRows);
    this.saveLocalData(current);
    
    return { data: Array.isArray(rowOrRows) ? newRows : newRows[0], error: null };
  }

  async update(updates: any) {
    const current = this.getLocalData();
    const updatedRows: any[] = [];
    const nextData = current.map(item => {
      const matches = this.filters.every(f => f(item));
      if (matches) {
        const updated = { ...item, ...updates };
        updatedRows.push(updated);
        return updated;
      }
      return item;
    });
    this.saveLocalData(nextData);
    return { data: this.isSingle ? updatedRows[0] : updatedRows, error: null };
  }

  async delete() {
    const current = this.getLocalData();
    const deletedRows: any[] = [];
    const nextData = current.filter(item => {
      const matches = this.filters.every(f => f(item));
      if (matches) {
        deletedRows.push(item);
        return false;
      }
      return true;
    });
    this.saveLocalData(nextData);
    return { data: deletedRows, error: null };
  }

  async then(onfulfilled?: (value: any) => any) {
    let data = this.getLocalData();
    if (this.filters.length > 0) {
      data = data.filter(item => this.filters.every(f => f(item)));
    }
    if (this.orderField) {
      const field = this.orderField;
      data.sort((a, b) => {
        const valA = a[field];
        const valB = b[field];
        if (valA < valB) return this.orderAscending ? -1 : 1;
        if (valA > valB) return this.orderAscending ? 1 : -1;
        return 0;
      });
    }

    let finalData: any = data;
    if (this.isSingle || this.isMaybeSingle) {
      finalData = data[0] || null;
    }

    const response = { data: finalData, error: null };
    if (onfulfilled) {
      return onfulfilled(response);
    }
    return response;
  }
}

// =========================================================================
// MOCK AUTHENTICATION SIMULATION
// =========================================================================
const mockAuth = {
  async getSession() {
    if (typeof window === 'undefined') return { data: { session: null }, error: null };
    const activeUserId = localStorage.getItem('mock_active_user_id') || '';
    if (!activeUserId) return { data: { session: null }, error: null };
    
    const users = getSeedDataForTable('users');
    const user = users.find(u => u.id === activeUserId);
    if (!user) return { data: { session: null }, error: null };

    const session = {
      user: {
        id: user.id,
        email: user.email,
        user_metadata: {
          nome_completo: user.nome_completo,
          role: user.role
        }
      }
    };
    return { data: { session }, error: null };
  },

  async getUser() {
    if (typeof window === 'undefined') return { data: { user: null }, error: null };
    const activeUserId = localStorage.getItem('mock_active_user_id') || '';
    if (!activeUserId) return { data: { user: null }, error: null };
    
    const users = getSeedDataForTable('users');
    const user = users.find(u => u.id === activeUserId);
    if (!user) return { data: { user: null }, error: null };

    const authUser = {
      id: user.id,
      email: user.email,
      user_metadata: {
        nome_completo: user.nome_completo,
        role: user.role
      }
    };
    return { data: { user: authUser }, error: null };
  },

  onAuthStateChange() {
    return {
      data: {
        subscription: {
          unsubscribe() {}
        }
      }
    };
  },

  async signInWithPassword({ email }: any) {
    const users = getSeedDataForTable('users');
    const user = users.find(u => u.email === email);
    if (!user) {
      // Allow any test login with mock fallback
      const defaultUser = {
        id: 'aluno-id',
        email,
        nome_completo: 'Aluno de Elite',
        role: 'ALUNO'
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('mock_active_user_id', defaultUser.id);
      }
      return { 
        data: { 
          user: { id: defaultUser.id, email, user_metadata: { nome_completo: defaultUser.nome_completo, role: defaultUser.role } },
          session: {} 
        }, 
        error: null 
      };
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('mock_active_user_id', user.id);
    }
    const session = {
      user: {
        id: user.id,
        email: user.email,
        user_metadata: {
          nome_completo: user.nome_completo,
          role: user.role
        }
      }
    };
    return { data: { user: session.user, session }, error: null };
  },

  async signUp({ email, options }: any) {
    const role = options?.data?.role || 'ALUNO';
    const nome = options?.data?.nome_completo || 'Utilizador';
    const users = getSeedDataForTable('users');
    
    const newUser = {
      id: `mock-user-${Math.random().toString(36).substr(2, 9)}`,
      email,
      nome_completo: nome,
      role,
      foto_perfil: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150&h=150',
      telefone: ''
    };
    
    if (typeof window !== 'undefined') {
      const key = 'mock_table_users';
      const raw = localStorage.getItem(key);
      let currentUsers = users;
      if (raw) {
        try {
          currentUsers = JSON.parse(raw);
        } catch (e) {}
      }
      currentUsers.push(newUser);
      localStorage.setItem(key, JSON.stringify(currentUsers));
      localStorage.setItem('mock_active_user_id', newUser.id);

      // Seed profile
      const profilesKey = 'mock_table_profiles';
      const rawProfiles = localStorage.getItem(profilesKey) || '[]';
      let currentProfiles = getSeedDataForTable('profiles');
      if (rawProfiles && rawProfiles !== '[]') {
        try {
          currentProfiles = JSON.parse(rawProfiles);
        } catch (e) {}
      }
      currentProfiles.push({ id: `p-${Math.random()}`, user_id: newUser.id, biografia: 'Novo Aluno MultiPlus', nivel_ingles: 'Avançado' });
      localStorage.setItem(profilesKey, JSON.stringify(currentProfiles));
    }

    return { data: { user: newUser }, error: null };
  },

  async signOut() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mock_active_user_id');
    }
    return { error: null };
  },

  async resetPasswordForEmail() {
    return { data: {}, error: null };
  }
};

// Helper to determine if we should switch to offline mode based on error
const isApiKeyError = (message: string) => {
  return message?.includes('Invalid API key') || message?.includes('apiKey') || message?.includes('Invalid key') || message?.includes('invalid-api-key');
};

const handleSwitchToOffline = () => {
  console.warn("Supabase API key is invalid. Switched to Offline/Mock simulation mode.");
  useOfflineFallback = true;
  if (typeof window !== 'undefined') {
    window.isSupabaseOfflineMode = true;
    localStorage.setItem('supabase_offline_mode', 'true');
  }
};

// =========================================================================
// EXPORTING PROXIED SUPABASE CLIENT
// =========================================================================
export const supabase = new Proxy({} as any, {
  get(_, prop) {
    const isOffline = useOfflineFallback || (typeof window !== 'undefined' && localStorage.getItem('supabase_offline_mode') === 'true');

    if (isOffline || !realSupabase) {
      if (prop === 'auth') return mockAuth;
      if (prop === 'from') return (tableName: string) => new MockQueryBuilder(tableName);
      return undefined;
    }

    // Wrap auth module calls to catch invalid keys dynamically
    if (prop === 'auth') {
      return new Proxy(realSupabase.auth, {
        get(authTarget, authProp) {
          const originalMethod = (authTarget as any)[authProp];
          if (typeof originalMethod === 'function') {
            return async function(...args: any[]) {
              try {
                const res = await originalMethod.apply(authTarget, args);
                if (res?.error && isApiKeyError(res.error.message)) {
                  handleSwitchToOffline();
                  const mockMethod = (mockAuth as any)[authProp];
                  if (mockMethod) return mockMethod.apply(mockAuth, args);
                }
                return res;
              } catch (err: any) {
                if (isApiKeyError(err?.message)) {
                  handleSwitchToOffline();
                  const mockMethod = (mockAuth as any)[authProp];
                  if (mockMethod) return mockMethod.apply(mockAuth, args);
                }
                throw err;
              }
            };
          }
          return originalMethod;
        }
      });
    }

    // Wrap query builder calls to catch invalid keys dynamically
    if (prop === 'from') {
      return function(tableName: string) {
        const queryBuilder = realSupabase.from(tableName);
        return new Proxy(queryBuilder, {
          get(qbTarget, qbProp) {
            const originalMethod = (qbTarget as any)[qbProp];
            if (typeof originalMethod === 'function') {
              return function(...args: any[]) {
                const result = originalMethod.apply(qbTarget, args);
                
                if (qbProp === 'then') {
                  return originalMethod.call(qbTarget, async (response: any) => {
                    if (response?.error && isApiKeyError(response.error.message)) {
                      handleSwitchToOffline();
                      const mockQb = new MockQueryBuilder(tableName);
                      return mockQb.then(args[0]);
                    }
                    return args[0](response);
                  }, args[1]);
                }

                return new Proxy(result, {
                  get(nestedTarget, nestedProp) {
                    if (nestedProp === 'then') {
                      return function(onfulfilled: any, onrejected: any) {
                        return nestedTarget.then(async (response: any) => {
                          if (response?.error && isApiKeyError(response.error.message)) {
                            handleSwitchToOffline();
                            const mockQb = new MockQueryBuilder(tableName);
                            return mockQb.then(onfulfilled);
                          }
                          return onfulfilled(response);
                        }, onrejected);
                      };
                    }
                    return (nestedTarget as any)[nestedProp];
                  }
                });
              };
            }
            return originalMethod;
          }
        });
      };
    }

    return (realSupabase as any)[prop];
  }
});
