import { createClient } from '@supabase/supabase-js';

let supabaseInstance;
try {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  console.log('Supabase init', { url, anonKey });
  if (!url || !anonKey) {
    console.warn('Supabase environment variables are missing. API calls may fail.');
  }
  // createClient will throw if URL or key are undefined; catch it below.
  supabaseInstance = createClient(url as string, anonKey as string);
} catch (e) {
  console.warn('Failed to create Supabase client:', e);
  supabaseInstance = null;
}
export const supabase = supabaseInstance as any;

// 1. Page 4: Instant IITR Email Sign-In (Zero OTP Delay for Judges)
export async function signInWithIITREmail(email: string) {
  try {
    if (!supabase) {
      console.warn('Supabase client not initialized in signInWithIITREmail');
      return null as any;
    }
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.endsWith('iitr.ac.in')) {
      throw new Error('Please use your @iitr.ac.in institute email');
    }

    // Check if profile exists; if not, create it automatically
    let { data: profile, error: fetchErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', cleanEmail)
      .single();
    if (fetchErr && fetchErr.code !== 'PGRST116') {
      // real error
      throw fetchErr;
    }

    if (!profile) {
      const namePart = cleanEmail.split('@')[0].replace(/[._]/g, ' ');
      const formattedName = namePart.replace(/\b\w/g, (l) => l.toUpperCase());
      const { data: newProfile, error } = await supabase
        .from('profiles')
        .insert({
          id: crypto.randomUUID(),
          email: cleanEmail,
          full_name: formattedName,
          bhawan: 'Azad Bhawan',
        })
        .select()
        .single();
      if (error) throw error;
      profile = newProfile;
    }
    localStorage.setItem('forkrank_user', JSON.stringify(profile));
    return profile;
  } catch (e) {
    console.warn('signInWithIITREmail failed:', e);
    return null as any; // caller should handle null
  }
}

// 2. Page 5: Food Leaderboard + Filters (All, Veg, Day, Night, Under ₹50, Search)
export async function getFoodLeaderboard(filters?: {
    search?: string;
    vegOnly?: boolean;
    shift?: 'day' | 'night';
    under50?: boolean;
}) {
  try {
    let query = supabase
      .from('menu_items')
      .select(`*, canteens!inner(id, name, bhawan, shift_type, is_open)`)
      .order('bayesian_score', { ascending: false });

    if (filters?.search) query = query.ilike('name', `%${filters.search}%`);
    if (filters?.vegOnly) query = query.eq('is_veg', true);
    if (filters?.under50) query = query.lte('price', 50);
    if (filters?.shift) query = query.eq('canteens.shift_type', filters.shift);

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  } catch (e) {
    console.warn('getFoodLeaderboard failed:', e);
    return [];
  }
}

// 3. Pages 6 & 7: Canteens Directory & Single Canteen Detail
export async function getCanteensDirectory() {
  try {
    const { data, error } = await supabase
      .from('canteen_stats')
      .select('*')
      .order('bhawan', { ascending: true });
    if (error) throw error;
    return data ?? [];
  } catch (e) {
    console.warn('getCanteensDirectory failed:', e);
    return [];
  }
}

export async function getCanteenMenu(canteenId: string) {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select(`*, canteens(name, bhawan, shift_type, closing_time)`)
      .eq('canteen_id', canteenId)
      .order('avg_rating', { ascending: false });
    if (error) throw error;
    return data ?? [];
  } catch (e) {
    console.warn('getCanteenMenu failed:', e);
    return [];
  }
}

// 4. Page 8: Dish Detail ("WHERE TO GET IT" across all canteens)
export async function getDishWhereToGetIt(dishName: string) {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select(`*, canteens(id, name, bhawan, shift_type, is_open)`)
      .ilike('name', dishName)
      .order('avg_rating', { ascending: false });
    if (error) throw error;
    return data ?? [];
  } catch (e) {
    console.warn('getDishWhereToGetIt failed:', e);
    return [];
  }
}

// 5. Page 9: Rate / Update / Remove Rating (1 per user per item)

export async function getDishById(dishId: string) {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select(`*, canteens(id, name, bhawan, shift_type, is_open)`)
      .eq('id', dishId)
      .single();
    if (error) throw error;
    return data ?? null;
  } catch (e) {
    console.warn('getDishById failed:', e);
    return null;
  }
}

export async function submitOrUpdateRating(
    userId: string,
    menuItemId: string,
    rating: number,
    prepTimeMins: number = 6
) {
    const { error } = await supabase
        .from('ratings')
        .upsert(
            { user_id: userId, menu_item_id: menuItemId, rating, prep_time_mins: prepTimeMins },
            { onConflict: 'user_id, menu_item_id' }
        );
    if (error) throw error;
}

export async function removeUserRating(userId: string, menuItemId: string) {
    const { error } = await supabase
        .from('ratings')
        .delete()
        .match({ user_id: userId, menu_item_id: menuItemId });
    if (error) throw error;
}

// 6. Page 10: Favorites Toggle & List
export async function toggleFavorite(userId: string, menuItemId: string) {
    const { data: existing } = await supabase
        .from('favorites')
        .select('*')
        .match({ user_id: userId, menu_item_id: menuItemId })
        .maybeSingle();

    if (existing) {
        await supabase.from('favorites').delete().match({ user_id: userId, menu_item_id: menuItemId });
        return false; // Unfavorited
    } else {
        await supabase.from('favorites').insert({ user_id: userId, menu_item_id: menuItemId });
        return true; // Favorited
    }
}

export async function getUserFavorites(userId: string) {
    const { data, error } = await supabase
        .from('favorites')
        .select(`created_at, menu_items(*, canteens(name, bhawan, shift_type))`)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data?.map((row: any) => row.menu_items) || [];
}

// 7. Page 11: User Profile Stats & Ratings Given
export async function getUserProfileStats(userId: string) {
    const { data: userRatings } = await supabase
        .from('ratings')
        .select(`rating, created_at, menu_items(id, name, price, canteens(bhawan, shift_type))`)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    const { count: favCount } = await supabase
        .from('favorites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

    const ratingsList = userRatings || [];
    const avgGiven =
        ratingsList.length > 0
            ? (ratingsList.reduce((acc, r) => acc + r.rating, 0) / ratingsList.length).toFixed(1)
            : '0.0';

    return {
        ratingsCount: ratingsList.length,
        favoritesCount: favCount || 0,
        avgGiven,
        recentRatings: ratingsList,
    };
}

export async function getUserRatingsWithDetails(userId: string) {
  const stats = await getUserProfileStats(userId);
  return stats.recentRatings;
}