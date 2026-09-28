import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listarArchivos,
  subirArchivo,
  eliminarArchivo,
  type OwnerRole,
  type PickerAsset,
  type UserUploadRow,
  type UserUploadConUrl,
} from '../lib/supabase-uploads';

/** Lista los archivos de un perfil (con URLs listas para mostrar). */
export function useUserUploads(ownerId: string | null | undefined, ownerRole?: OwnerRole) {
  return useQuery<UserUploadConUrl[]>({
    queryKey: ['user-uploads', ownerId ?? 'sin-usuario', ownerRole ?? 'todos'],
    queryFn: () => listarArchivos(ownerId as string, ownerRole),
    enabled: Boolean(ownerId),
  });
}

/** Sube un archivo del picker y refresca la lista. */
export function useSubirArchivo(ownerId: string, ownerRole: OwnerRole) {
  const queryClient = useQueryClient();

  return useMutation<UserUploadConUrl, Error, PickerAsset>({
    mutationFn: (asset) => subirArchivo({ asset, ownerId, ownerRole }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-uploads', ownerId] });
    },
  });
}

/** Elimina un archivo propio y refresca la lista. */
export function useEliminarArchivo(ownerId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, UserUploadRow>({
    mutationFn: (row) => eliminarArchivo(row),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-uploads', ownerId] });
    },
  });
}
