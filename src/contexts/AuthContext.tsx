import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../utils/supabaseClient';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: any | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  refreshProfile: async () => {},
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string, fallbackUser?: User | null) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching profile from Supabase:', error);
      }
      
      // Ищем юзера: переданный явно, либо из стейта
      const activeUser = fallbackUser || user;

      if (!error && data) {
        setProfile(data);
      } else if (activeUser) {
        // КРИТИЧЕСКИЙ FALLBACK: Если записи в таблице profiles нет или RLS ее блокирует,
        // генерируем профиль "на лету" из метадаты авторизации Supabase (она там 100% есть)
        const syntheticProfile = {
           id: activeUser.id,
           email: activeUser.email,
           role: activeUser.user_metadata?.role || 'ADOPTER',
           name: activeUser.user_metadata?.name || '',
           onboarding_answers: {}
        };
        console.log("Generating synthetic profile from auth metadata:", syntheticProfile);
        setProfile(syntheticProfile);
        
        // Пытаемся тихо сохранить его в БД в фоне, чтобы было
        supabase.from('profiles').upsert([syntheticProfile]).then(({error: upsertError}) => {
           if (upsertError) console.error('Background profile auto-heal failed. RLS issue?', upsertError);
        });

        
      } else {
        setProfile(null);
      }
    } catch (e) {
      console.error('Error fetching profile:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    // В момент принудительного обновления пытаемся достать самого свежего юзера
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser) {
      await fetchProfile(currentUser.id, currentUser);
    } else if (user) {
      await fetchProfile(user.id, user);
    }
  };

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user);
      } else {
        setIsLoading(false);
      }
    });

    // 2. Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setIsLoading(true);
        fetchProfile(session.user.id, session.user);
      } else {
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error signing out:', error);
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, isLoading, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
