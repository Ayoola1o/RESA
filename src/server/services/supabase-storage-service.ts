import 'server-only';

import { getSupabaseAdminClient } from '@/lib/supabase/admin';

const STORAGE_REFERENCE_PREFIX = 'supabase://';

type StorageReference = { bucket: string; path: string };

function parseReference(reference: string): StorageReference | null {
  if (!reference.startsWith(STORAGE_REFERENCE_PREFIX)) return null;
  const value = reference.slice(STORAGE_REFERENCE_PREFIX.length);
  const separator = value.indexOf('/');
  if (separator < 1 || separator === value.length - 1) {
    throw new Error('Invalid Supabase Storage reference.');
  }
  const bucket = value.slice(0, separator);
  const path = value.slice(separator + 1);
  if (!['property-media', 'verification-files'].includes(bucket)
    || path.split('/').some((part) => !part || part === '.' || part === '..')) {
    throw new Error('Invalid Supabase Storage reference.');
  }
  return { bucket, path };
}

export class SupabaseStorageService {
  private getClient() {
    const client = getSupabaseAdminClient();
    if (client) return client;

    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error('Supabase Storage uploads require SUPABASE_SECRET_KEY in the server environment.');
    }
    return null;
  }

  async upload(bucket: string, path: string, contents: Buffer, contentType: string): Promise<string | null> {
    const client = this.getClient();
    if (!client) return null;

    const { error } = await client.storage.from(bucket).upload(path, contents, {
      contentType,
      upsert: false,
    });
    if (error) throw new Error(`Supabase Storage upload failed: ${error.message}`);
    return `${STORAGE_REFERENCE_PREFIX}${bucket}/${path}`;
  }

  async download(reference: string): Promise<Buffer | null> {
    const parsed = parseReference(reference);
    if (!parsed) return null;
    const client = this.getClient();
    if (!client) throw new Error('Supabase Storage is not configured on this server.');

    const { data, error } = await client.storage.from(parsed.bucket).download(parsed.path);
    if (error || !data) throw new Error(`Supabase Storage download failed: ${error?.message ?? 'File not found'}`);
    return Buffer.from(await data.arrayBuffer());
  }

  async createSignedUrl(reference: string, expiresInSeconds = 300): Promise<string | null> {
    const parsed = parseReference(reference);
    if (!parsed) return null;
    const client = this.getClient();
    if (!client) throw new Error('Supabase Storage is not configured on this server.');

    const { data, error } = await client.storage.from(parsed.bucket)
      .createSignedUrl(parsed.path, expiresInSeconds);
    if (error || !data?.signedUrl) {
      throw new Error(`Supabase Storage link creation failed: ${error?.message ?? 'Unable to sign file'}`);
    }
    return data.signedUrl;
  }

  async remove(reference: string): Promise<boolean> {
    const parsed = parseReference(reference);
    if (!parsed) return false;
    const client = this.getClient();
    if (!client) throw new Error('Supabase Storage is not configured on this server.');

    const { error } = await client.storage.from(parsed.bucket).remove([parsed.path]);
    if (error) throw new Error(`Supabase Storage delete failed: ${error.message}`);
    return true;
  }

  isSupabaseReference(reference?: string): boolean {
    return Boolean(reference?.startsWith(STORAGE_REFERENCE_PREFIX));
  }
}

export const supabaseStorageService = new SupabaseStorageService();
