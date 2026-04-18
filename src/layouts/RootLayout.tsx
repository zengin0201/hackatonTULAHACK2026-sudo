import { useState, useEffect } from 'react';
import { Flame, MessageCircle, Bone, User, PawPrint } from 'lucide-react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export default function RootLayout() {
  const location = useLocation();
  const { user, profile } = useAuth();
  const isFeed = location.pathname === '/';

  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const [savedLives, setSavedLives] = useState<number>(0);

  useEffect(() => {
    if (!user) return;

    const fetchSidebarData = async () => {
      try {
        
        const { count: adoptedCount } = await supabase
          .from('pets')
          .select('*', { count: 'exact', head: true })
          .contains('attributes', { status: 'adopted' });
          
        setSavedLives(adoptedCount || 0);

       
        const { data: matches } = await supabase
          .from('matches')
          .select('*')
          .or(`user_id.eq.${user.id},shelter_id.eq.${user.id}`)
          .order('created_at', { ascending: false })
          .limit(3);

        if (matches && matches.length > 0) {
          const petIds = matches.map(m => m.pet_id);
          const { data: pets } = await supabase
            .from('pets')
            .select('id, name, image_urls')
            .in('id', petIds);

          const enriched = matches.map(m => ({
            ...m,
            pet: pets?.find(p => p.id === m.pet_id)
          }));
          setRecentMatches(enriched);
        }
      } catch (e) {
        console.error('Error fetching sidebar data:', e);
      }
    };

    fetchSidebarData();

   
    const channel = supabase.channel('sidebar_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `user_id=eq.${user.id}` }, () => {
         fetchSidebarData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pets' }, () => {
         fetchSidebarData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <div className="w-full min-h-screen flex p-3 md:p-10 gap-10 bg-[radial-gradient(circle_at_10%_20%,rgba(56,189,248,0.05)_0%,transparent_50%),radial-gradient(circle_at_90%_80%,rgba(139,92,246,0.05)_0%,transparent_50%)] overflow-hidden items-center justify-center max-w-7xl mx-auto">
      
     
      <aside className="w-[280px] flex-col gap-6 hidden lg:flex h-[580px] justify-between">
        <div>
          <div className="text-2xl font-extrabold text-app-accent tracking-tighter flex items-center gap-2">
            <PawPrint className="w-6 h-6" /> PawMatch
          </div>
          
          <div className="mt-10">
            <h3 className="text-xs uppercase tracking-widest text-app-dim mb-3">Недавние мэтчи</h3>
            
            {recentMatches.length === 0 ? (
               <div className="text-sm text-app-dim p-3 border border-white/5 bg-white/5 rounded-xl text-center">
                 Пока нет мэтчей
               </div>
            ) : (
              recentMatches.map((m, idx) => {
                const initial = m.pet?.name ? m.pet.name.charAt(0).toUpperCase() : '?';
                const colors = ['bg-rose-300', 'bg-yellow-300', 'bg-sky-300'];
                const bgColor = colors[idx % colors.length];

                return (
                  <Link to="/messages" key={m.id} className="flex items-center gap-3 p-3 bg-app-glass border border-white/5 rounded-xl mb-2 hover:bg-white/10 transition-colors">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-app-bg overflow-hidden shrink-0 ${!m.pet?.image_urls?.[0] ? bgColor : ''}`}>
                      {m.pet?.image_urls?.[0] ? (
                        <img src={m.pet.image_urls[0]} alt="Pet" className="w-full h-full object-cover" />
                      ) : (
                        initial
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm truncate">{m.pet?.name || 'Питомец'}</div>
                      <div className="text-xs text-app-dim truncate">
                        Нажмите, чтобы открыть чат
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          <div className="mt-6">
            <h3 className="text-xs uppercase tracking-widest text-app-dim mb-3">Статистика</h3>
            <div className="p-3 bg-app-accent/10 rounded-xl border border-app-accent/20">
              <div className="text-xl font-bold">{savedLives}</div>
              <div className="text-[11px] uppercase text-app-accent">Спасенных жизней</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center relative w-full h-[580px]">
        <Outlet />
      </main>

        {/* Bottom Nav */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-app-glass backdrop-blur-xl px-8 py-4 rounded-full flex gap-8 md:gap-10 border border-white/5 z-50">
        {(profile?.role !== 'SHELTER' && user?.user_metadata?.role !== 'SHELTER') && (
          <Link to="/" className={`transition-colors flex items-center justify-center ${isFeed ? 'text-app-accent' : 'text-app-dim hover:text-app-text'}`}>
            <Flame className={`w-6 h-6 ${isFeed ? 'fill-current' : ''}`} />
          </Link>
        )}
        <Link to="/messages" className={`transition-colors flex items-center justify-center ${location.pathname === '/messages' ? 'text-app-accent' : 'text-app-dim hover:text-app-text'}`}>
          <MessageCircle className="w-6 h-6" />
        </Link>
        {(profile?.role === 'SHELTER' || user?.user_metadata?.role === 'SHELTER') && (
          <Link to="/dashboard" className={`transition-colors flex items-center justify-center ${location.pathname === '/dashboard' ? 'text-app-accent' : 'text-app-dim hover:text-app-text'}`}>
            <Bone className="w-6 h-6" />
          </Link>
        )}
        <Link to="/profile" className={`transition-colors flex items-center justify-center ${location.pathname === '/profile' ? 'text-app-accent' : 'text-app-dim hover:text-app-text'}`}>
          <User className="w-6 h-6" />
        </Link>
      </nav>
    </div>
  );
}
