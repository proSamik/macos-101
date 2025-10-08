import { put, del } from '@vercel/blob';

export interface UploadedFile {
  url: string;
  filename: string;
  size: number;
  type: string;
}

export class BlobStorage {
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ];

  static async uploadFile(file: File, userId: string): Promise<UploadedFile> {
    // Validate file size
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error('File size too large. Maximum size is 10MB.');
    }

    // Validate file type
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      throw new Error(`File type not allowed. Allowed types: ${this.ALLOWED_TYPES.join(', ')}`);
    }

    // Generate filename with user prefix and timestamp
    const timestamp = Date.now();
    const filename = `chat-uploads/${userId}/${timestamp}-${file.name}`;

    try {
      const blob = await put(filename, file, {
        access: 'public',
        addRandomSuffix: true,
      });

      return {
        url: blob.url,
        filename: blob.pathname,
        size: file.size,
        type: file.type,
      };
    } catch (error) {
      console.error('Failed to upload file to Vercel Blob:', error);
      throw new Error('Failed to upload file. Please try again.');
    }
  }

  static async uploadMultipleFiles(files: File[], userId: string): Promise<UploadedFile[]> {
    const uploadPromises = files.map(file => this.uploadFile(file, userId));
    
    try {
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Failed to upload multiple files:', error);
      throw new Error('Failed to upload one or more files. Please try again.');
    }
  }

  static async deleteFile(url: string): Promise<boolean> {
    try {
      await del(url);
      return true;
    } catch (error) {
      console.error('Failed to delete file from Vercel Blob:', error);
      return false;
    }
  }

  static async deleteMultipleFiles(urls: string[]): Promise<{ success: string[], failed: string[] }> {
    const results = await Promise.allSettled(
      urls.map(async (url) => {
        const success = await this.deleteFile(url);
        return { url, success };
      })
    );

    const success: string[] = [];
    const failed: string[] = [];

    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.success) {
        success.push(result.value.url);
      } else {
        failed.push(result.status === 'fulfilled' ? result.value.url : 'unknown');
      }
    });

    return { success, failed };
  }

  static validateFileType(file: File): boolean {
    return this.ALLOWED_TYPES.includes(file.type);
  }

  static validateFileSize(file: File): boolean {
    return file.size <= this.MAX_FILE_SIZE;
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static getFileExtension(filename: string): string {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
  }

  static isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
  }

  static async createImagePreview(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.isImageFile(file)) {
        reject(new Error('File is not an image'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsDataURL(file);
    });
  }

  static extractFilenameFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      return pathname.split('/').pop() || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  static generateThumbnailUrl(originalUrl: string, width: number = 300, height: number = 300): string {
    // This is a basic implementation. For production, you might want to use
    // Vercel's image optimization or another service
    return `${originalUrl}?w=${width}&h=${height}&fit=crop`;
  }
}