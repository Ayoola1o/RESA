import { propertyService } from './property-service';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { User, PropertyMedia, MediaType, MediaUploadStatus } from '@/types/prophunta';
import { propertyRepository } from '../repositories/property-repository';
import { auditRepository } from '../repositories/audit-repository';
import { supabaseStorageService } from './supabase-storage-service';

const UPLOAD_DIR = path.join(process.cwd(), '.data', 'uploads', 'media');

// Ensure local media directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export class MediaService {
  /**
   * Uploads a real file (image or video) and registers it as a persistent PropertyMedia record.
   */
  async uploadMedia(
    user: User,
    propertyId: string,
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    caption?: string,
    isPrimary?: boolean
  ): Promise<PropertyMedia> {
    if (!fileBuffer?.length) throw new Error('Please choose a non-empty media file.');
    if (fileBuffer.length > 25 * 1024 * 1024) throw new Error('Media files must be 25 MB or smaller.');

    const imageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
    const videoTypes = new Set(['video/mp4', 'video/webm', 'video/quicktime']);
    const normalizedMimeType = mimeType.toLowerCase();
    if (!imageTypes.has(normalizedMimeType) && !videoTypes.has(normalizedMimeType)) {
      throw new Error('Supported media formats are JPG, PNG, WEBP, AVIF, MP4, WEBM, and MOV.');
    }

    const property = await propertyRepository.findById(propertyId);
    if (!property) throw new Error('Property not found');

    // Authorization check
    if (
      user.role !== 'ADMIN' &&
      !await propertyService.canManageListing(user.id, property)
    ) {
      throw new Error('Unauthorized to manage media for this property');
    }

    // Determine type
    const isVideo = videoTypes.has(normalizedMimeType);
    const type: MediaType = isVideo ? 'video' : 'image';

    const safeUUID = randomUUID().replace(/-/g, '');
    const mediaId = `med_${Date.now()}_${safeUUID.slice(0, 8)}`;
    const extensionByMime: Record<string, string> = {
      'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/avif': '.avif',
      'video/mp4': '.mp4', 'video/webm': '.webm', 'video/quicktime': '.mov',
    };
    const diskFileName = `${type}_${Date.now()}_${safeUUID}${extensionByMime[normalizedMimeType]}`;
    const storageReference = await supabaseStorageService.upload(
      'property-media', `${propertyId}/${mediaId}${extensionByMime[normalizedMimeType]}`,
      fileBuffer, normalizedMimeType
    );
    if (!storageReference) {
      await fs.promises.writeFile(path.join(UPLOAD_DIR, diskFileName), fileBuffer);
    }

    const mediaItem: PropertyMedia = {
      id: mediaId,
      propertyId,
      url: `/api/media/${mediaId}`,
      type,
      caption: caption || (isVideo ? 'Property Video Walkthrough' : 'Property Photo'),
      isPrimary: !!isPrimary,
      order: (property.media || []).length + 1,
      uploadStatus: 'COMPLETED',
      fileReference: storageReference || diskFileName,
      fileName: originalName,
      mimeType,
      sizeBytes: fileBuffer.length,
      createdAt: new Date().toISOString(),
    };

    await propertyRepository.addMedia(propertyId, mediaItem);

    await auditRepository.create({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'MEDIA_UPLOADED',
      objectType: 'MEDIA',
      objectId: mediaId,
      result: 'SUCCESS',
      metadata: {
        propertyId,
        fileName: originalName,
        type,
        sizeBytes: fileBuffer.length,
      },
    });

    return mediaItem;
  }

  /**
   * Adds a persistent media record with a specified or remote URL, creating a full persistent schema item.
   */
  async addMediaRecord(
    user: User,
    propertyId: string,
    data: {
      url: string;
      type?: MediaType;
      caption?: string;
      isPrimary?: boolean;
      fileName?: string;
    }
  ): Promise<PropertyMedia> {
    const property = await propertyRepository.findById(propertyId);
    if (!property) throw new Error('Property not found');

    if (
      user.role !== 'ADMIN' &&
      !await propertyService.canManageListing(user.id, property)
    ) {
      throw new Error('Unauthorized to manage media for this property');
    }

    const type: MediaType = data.type || (data.url.match(/\.(mp4|webm|mov)$/i) ? 'video' : 'image');
    const mediaId = `med_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const mediaItem: PropertyMedia = {
      id: mediaId,
      propertyId,
      url: data.url,
      type,
      caption: data.caption || (type === 'video' ? 'Video Walkthrough' : 'Property Visual'),
      isPrimary: !!data.isPrimary,
      order: (property.media || []).length + 1,
      uploadStatus: 'COMPLETED',
      fileName: data.fileName || `${type}_${mediaId}.jpg`,
      createdAt: new Date().toISOString(),
    };

    await propertyRepository.addMedia(propertyId, mediaItem);

    await auditRepository.create({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'MEDIA_UPLOADED',
      objectType: 'MEDIA',
      objectId: mediaId,
      result: 'SUCCESS',
      metadata: { propertyId, type, url: data.url },
    });

    return mediaItem;
  }

  /**
   * Updates caption, primary status, or order of an existing media item.
   */
  async updateMedia(
    user: User,
    propertyId: string,
    mediaId: string,
    updates: {
      caption?: string;
      isPrimary?: boolean;
      order?: number;
    }
  ): Promise<PropertyMedia> {
    const property = await propertyRepository.findById(propertyId);
    if (!property) throw new Error('Property not found');

    if (
      user.role !== 'ADMIN' &&
      !await propertyService.canManageListing(user.id, property)
    ) {
      throw new Error('Unauthorized to update media for this property');
    }

    const updatedProperty = await propertyRepository.updateMedia(propertyId, mediaId, updates);
    if (!updatedProperty) throw new Error('Failed to update media item');

    const updatedItem = updatedProperty.media.find((m) => m.id === mediaId);
    if (!updatedItem) throw new Error('Updated media item not found');

    return updatedItem;
  }

  /**
   * Deletes a media item and removes the file on disk if it is stored locally.
   */
  async deleteMedia(user: User, propertyId: string, mediaId: string): Promise<boolean> {
    const property = await propertyRepository.findById(propertyId);
    if (!property) throw new Error('Property not found');

    if (
      user.role !== 'ADMIN' &&
      !await propertyService.canManageListing(user.id, property)
    ) {
      throw new Error('Unauthorized to delete media for this property');
    }

    const item = property.media.find((m) => m.id === mediaId);
    if (item?.fileReference) {
      if (supabaseStorageService.isSupabaseReference(item.fileReference)) {
        await supabaseStorageService.remove(item.fileReference);
      } else {
        const diskPath = path.join(UPLOAD_DIR, item.fileReference);
        if (fs.existsSync(diskPath)) {
          try {
            await fs.promises.unlink(diskPath);
          } catch (err) {
            console.warn('Could not remove file from disk:', diskPath, err);
          }
        }
      }
    }

    await propertyRepository.deleteMedia(propertyId, mediaId);

    await auditRepository.create({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'MEDIA_DELETED',
      objectType: 'MEDIA',
      objectId: mediaId,
      result: 'SUCCESS',
      metadata: { propertyId },
    });

    return true;
  }

  /**
   * Reorders all media items for a given property.
   */
  async reorderMedia(user: User, propertyId: string, orderedIds: string[]): Promise<PropertyMedia[]> {
    const property = await propertyRepository.findById(propertyId);
    if (!property) throw new Error('Property not found');

    if (
      user.role !== 'ADMIN' &&
      !await propertyService.canManageListing(user.id, property)
    ) {
      throw new Error('Unauthorized to reorder media for this property');
    }

    const updated = await propertyRepository.reorderMedia(propertyId, orderedIds);
    if (!updated) throw new Error('Failed to reorder media');

    await auditRepository.create({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'MEDIA_ORDER_UPDATED',
      objectType: 'MEDIA',
      objectId: propertyId,
      result: 'SUCCESS',
      metadata: { orderedIds },
    });

    return updated.media;
  }

  /**
   * Finds a media record by id across all properties.
   */
  async findMediaById(mediaId: string): Promise<{ property: any; media: PropertyMedia } | null> {
    const properties = await propertyRepository.listAll();
    for (const prop of properties) {
      const found = (prop.media || []).find((m) => m.id === mediaId);
      if (found) {
        return { property: prop, media: found };
      }
    }
    return null;
  }

  /**
   * Gets absolute disk path for a stored media file.
   */
  getDiskFilePath(fileReference: string): string {
    return path.join(UPLOAD_DIR, fileReference);
  }
}

export const mediaService = new MediaService();
