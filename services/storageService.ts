import { supabase, STORAGE_BUCKET } from '../supabaseClient.js';

export const uploadFile = async (
  file: File,
  featureName: 'profiles' | 'resources',
  itemId: string
) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required for upload");

  const fileExt = file.name.split('.').pop();
  const uuid = crypto.randomUUID();
  // Format: {uid}/{featureName}/{itemId}/{uuid}.{extension}
  const filePath = `${user.id}/${featureName}/${itemId}/${uuid}.${fileExt}`;

  const { error: uploadError, data } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  return data.path;
};

export const getSignedUrl = async (path: string) => {
  if (!path) return '';
  // If it's already a full URL (external), return as is
  if (path.startsWith('http')) return path;

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(path, 3600); // 1 hour expiry

  if (error) {
    console.error("Error creating signed URL:", error);
    return '';
  }
  return data.signedUrl;
};

export const deleteFile = async (path: string) => {
  if (!path || path.startsWith('http')) return;
  
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([path]);

  if (error) console.error("Error deleting file from storage:", error);
};