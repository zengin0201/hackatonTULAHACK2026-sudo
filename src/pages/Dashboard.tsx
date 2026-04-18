import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../utils/supabaseClient";
import { Loader2, Plus, PawPrint } from "lucide-react";

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([""]);

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    description: "",
    requiresSpace: false,
    catFriendly: true,
    donationGoal: "",
    type: "dog",
  });

  const effectiveRole = profile?.role || user?.user_metadata?.role;

  useEffect(() => {
    if (user && effectiveRole === "SHELTER") {
      fetchPets();
    } else {
      setLoading(false);
    }
  }, [user, effectiveRole]);

  const fetchPets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("pets")
      .select("*")
      .eq("shelter_id", user?.id)
      .order("created_at", { ascending: false });

    if (error) console.error("Error fetching pets:", error);
    if (data) setPets(data);
    setLoading(false);
  };

  const handleMarkAdopted = async (pet: any) => {
    const updatedAttrs = { ...pet.attributes, status: "adopted" };
    const { error } = await supabase
      .from("pets")
      .update({ attributes: updatedAttrs })
      .eq("id", pet.id);
    if (!error) {
      setPets((prev) =>
        prev.map((p) =>
          p.id === pet.id ? { ...p, attributes: updatedAttrs } : p,
        ),
      );
    }
  };

  const handleDeletePet = async (petId: string) => {
    if (
      window.confirm("Вы уверены, что хотите удалить эту карточку питомца?")
    ) {
      const { error } = await supabase.from("pets").delete().eq("id", petId);
      if (!error) {
        setPets((prev) => prev.filter((p) => p.id !== petId));
      }
    }
  };
  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...imageUrls];
    newUrls[index] = value;
    setImageUrls(newUrls);
  };

  const addUrlField = () => setImageUrls([...imageUrls, ""]);

  const removeUrlField = (index: number) => {
    if (imageUrls.length > 1) {
      setImageUrls(imageUrls.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("pets").insert({
        shelter_id: user?.id,
        name: formData.name,
        age: parseInt(formData.age),
        description: formData.description,
        image_urls: imageUrls.filter((url) => url.trim() !== ""),
        type: formData.type,
        attributes: {
          requires_space: formData.requiresSpace,
          cat_friendly: formData.catFriendly,
        },
        donation_goal: parseInt(formData.donationGoal) || 0,
        current_donations: 0,
      });
      if (error) throw error;

      setFormData({
        name: "",
        age: "",
        description: "",
        requiresSpace: false,
        catFriendly: true,
        donationGoal: "",
        type: "dog",
      });

      await fetchPets();
    } catch (err) {
      console.error(err);
      alert(
        "Ошибка при добавлении питомца. Проверьте права и подключение к БД.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (effectiveRole !== "SHELTER") {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 bg-app-card rounded-[32px] border border-white/10 shadow-2xl">
        <PawPrint className="w-16 h-16 text-app-dim mb-4 opacity-50" />
        <h2 className="text-2xl font-bold mb-2">Доступ закрыт</h2>
        <p className="text-app-dim">
          Эта панель предназначена только для аккаунтов со статусом "Приют". Для
          усыновителей функционал скрыт.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex gap-6 overflow-hidden max-w-full">
      {/* Form Section */}
      <div className="w-full md:w-1/2 flex flex-col bg-app-card rounded-[32px] border border-white/10 shadow-2xl overflow-hidden h-full">
        <div className="p-6 border-b border-white/10 bg-white/5">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Plus className="w-5 h-5 text-app-accent" />
            Добавить питомца
          </h2>
        </div>
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-xs uppercase tracking-widest text-slate-500 mb-2 block">
                Кто это?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "dog", label: "Собака", icon: "🐶" },
                  { id: "cat", label: "Кот", icon: "🐱" },
                  { id: "parrot", label: "Попугай", icon: "🦜" },
                  { id: "rodent", label: "Грызун", icon: "🐁" },
                  { id: "turtle", label: "Рептилия", icon: "🐢" },
                  { id: "other", label: "Другое", icon: "🐹" },
                ].map((typeObj) => (
                  <button
                    key={typeObj.id}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, type: typeObj.id })
                    }
                    className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-sm transition-all ${
                      formData.type === typeObj.id
                        ? "bg-app-accent/20 border-app-accent text-white shadow-lg shadow-app-accent/10"
                        : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                    }`}
                  >
                    <span className="text-xl">{typeObj.icon}</span>
                    <span className="text-[10px] uppercase font-bold tracking-tighter">
                      {typeObj.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-app-dim mb-1 block">
                Имя
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full bg-app-glass border border-white/10 rounded-xl px-4 py-3 text-app-text focus:outline-none focus:border-app-accent focus:ring-1 focus:ring-app-accent transition-all"
                placeholder="Бобик"
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-xs uppercase tracking-widest text-app-dim mb-1 block">
                  Возраст (лет)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.age}
                  onChange={(e) =>
                    setFormData({ ...formData, age: e.target.value })
                  }
                  className="w-full bg-app-glass border border-white/10 rounded-xl px-4 py-3 text-app-text focus:outline-none focus:border-app-accent transition-all"
                  placeholder="2"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs uppercase tracking-widest text-app-dim mb-1 block">
                  Цель сбора (₽)
                </label>
                <input
                  type="number"
                  value={formData.donationGoal}
                  onChange={(e) =>
                    setFormData({ ...formData, donationGoal: e.target.value })
                  }
                  className="w-full bg-app-glass border border-white/10 rounded-xl px-4 py-3 text-app-text focus:outline-none focus:border-app-accent transition-all"
                  placeholder="5000"
                />
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-widest text-app-dim mb-1 block">
                URL фотографии
              </label>
              <div className="flex flex-col gap-3">
                <label className="text-xs uppercase tracking-widest text-app-dim block">
                  Ссылки на фотографии
                </label>

                {imageUrls.map((url, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="url"
                      required
                      value={url}
                      onChange={(e) => handleUrlChange(index, e.target.value)}
                      placeholder="https://example.com/photo.jpg"
                      className="flex-1 bg-app-glass border border-white/10 rounded-xl px-4 py-3 text-app-text focus:outline-none focus:border-app-accent transition-all"
                    />
                    {imageUrls.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeUrlField(index)}
                        className="px-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-colors"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addUrlField}
                  className="text-sm font-semibold text-app-accent hover:text-sky-300 transition-colors w-max"
                >
                  + Добавить еще фото
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-widest text-app-dim mb-1 block">
                Описание
              </label>
              <textarea
                required
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full bg-app-glass border border-white/10 rounded-xl px-4 py-3 text-app-text focus:outline-none focus:border-app-accent transition-all resize-none"
                placeholder="Расскажите о характере питомца..."
              />
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <label className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.requiresSpace}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      requiresSpace: e.target.checked,
                    })
                  }
                  className="w-4 h-4 accent-app-accent"
                />
                <span className="text-sm font-medium">
                  Нужен большой дом/участок (не для квартир)
                </span>
              </label>
              <label className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.catFriendly}
                  onChange={(e) =>
                    setFormData({ ...formData, catFriendly: e.target.checked })
                  }
                  className="w-4 h-4 accent-app-accent"
                />
                <span className="text-sm font-medium">
                  Дружит с другими животными / котами
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-app-accent text-app-bg font-bold py-3.5 rounded-xl hover:bg-sky-300 transition-colors mt-4 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Plus className="w-5 h-5" /> Создать карточку
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <div className="hidden md:flex w-1/2 flex-col bg-app-card/50 rounded-[32px] border border-white/5 overflow-hidden h-full">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-xl font-bold">Ваши питомцы ({pets.length})</h2>
        </div>
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-4">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 text-app-accent animate-spin" />
            </div>
          ) : pets.length === 0 ? (
            <div className="text-center text-app-dim py-10">
              У вас пока нет добавленных питомцев.
            </div>
          ) : (
            pets.map((pet) => (
              <div
                key={pet.id}
                className="relative group flex gap-4 p-4 bg-app-glass border border-white/10 rounded-2xl items-center hover:border-white/20 transition-colors"
              >
                <div className="w-16 h-16 rounded-xl bg-app-bg border border-white/10 overflow-hidden shrink-0 relative">
                  {pet.attributes?.status === "adopted" && (
                    <div className="absolute inset-0 bg-app-success/80 flex items-center justify-center z-10">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider -rotate-12 bg-white text-app-success px-1 py-0.5 rounded shadow-sm">
                        Дома
                      </span>
                    </div>
                  )}
                  {pet.image_urls?.[0] ? (
                    <img
                      src={pet.image_urls[0]}
                      alt={pet.name}
                      className={`w-full h-full object-cover ${pet.attributes?.status === "adopted" ? "grayscale opacity-50" : ""}`}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-app-dim text-xs">
                      Нет фото
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold truncate">
                    {pet.name}, {pet.age} лет
                  </h3>
                  <p className="text-xs text-app-dim truncate">
                    {pet.description}
                  </p>
                </div>
                <div className="flex flex-col gap-1 items-end shrink-0">
                  {pet.donation_goal > 0 && (
                    <div className="text-right bg-app-success/10 border border-app-success/20 px-2 py-0.5 rounded-lg whitespace-nowrap mb-1">
                      <div className="text-[10px] font-bold text-app-success">
                        {pet.current_donations || 0} / {pet.donation_goal} ₽
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {pet.attributes?.status !== "adopted" && (
                      <button
                        onClick={() => handleMarkAdopted(pet)}
                        className="px-2 py-1 bg-app-success/20 text-app-success text-xs font-bold rounded-lg border border-app-success/30 hover:bg-app-success/30 transition-colors"
                      >
                        Пристроен!
                      </button>
                    )}
                    <button
                      onClick={() => handleDeletePet(pet.id)}
                      className="px-2 py-1 bg-app-danger/20 text-app-danger text-xs font-bold rounded-lg border border-app-danger/30 hover:bg-app-danger/30 transition-colors"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
