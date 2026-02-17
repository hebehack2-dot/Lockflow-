
import { supabase, STORAGE_BUCKET } from '../supabaseClient';

export const uploadFile = async (
  file: File,
  featureName: 'profiles' | 'resources',
  itemId: string
) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required for upload");

  const fileExt = file.name.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `${user.id}/${featureName}/${itemId}/${fileName}`;

  const { error: uploadError, data } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  return data.path;
};

export const getSignedUrl = async (path: string) => {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(path, 3600); // 1 hour expiry

  if (error) throw error;
  return data.signedUrl;
};

export const deleteFile = async (path: string) => {
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([path]);

  if (error) console.error("Error deleting file from storage:", error);
};
