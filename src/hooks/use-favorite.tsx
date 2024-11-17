import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalStorage } from "./use-local-storage";

interface FavoriteItem {
    id: string;
    lat: number;
    lon: number;
    name: string;
    country: string;
    state?: string;
    addedAt: number;
}

export function useFavorites() {
    const [favorites, setFavorites] = useLocalStorage<FavoriteItem[]>("favorites", []);

    const queryClient = useQueryClient();

    const favoriteQuery = useQuery({
        queryKey: ["favorites"],
        queryFn: () => favorites,
        initialData: favorites,
        staleTime: Infinity,
    });

    const addFavorite = useMutation({
        mutationFn: async (favorite: Omit<FavoriteItem, "id" | "addedAt">) => {
            const newFavorite: FavoriteItem = {
                ...favorite,
                id: `${favorite.lat}-${favorite.lon}`,
                addedAt: Date.now()
            };

            const exists = favorites.some((item) => item.id === newFavorite.id);

            if (exists) {
                return favorites;
            }

            const newFavorites = [...favorites, newFavorite];
            setFavorites(newFavorites);
            return newFavorites;
        },
        onSuccess:  () => {
            queryClient.invalidateQueries({
                queryKey: ["favorites"]
            })
        }
    });

    const removeFavorite = useMutation({
        mutationFn: async (cityId: string) => {
            const newFavorites = favorites.filter((item) => item.id !== cityId);
            setFavorites(newFavorites);
            return newFavorites;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["favorites"]
            })
        }
    });

    return {
        favorites: favoriteQuery.data,
        addFavorite,
        removeFavorite,
        isFavorite: (lat: number, lon: number) => {
            return favorites.some((item) => item.lat === lat && item.lon === lon);
        }
    }
}