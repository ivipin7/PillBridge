const API_BASE = 'http://localhost:3000';

export interface ImageUploadResponse {
  message: string;
  fileId: string;
  filename: string;
  url: string;
  size: number;
  contentType: string;
}

export interface ImageListItem {
  id: string;
  filename: string;
  originalName: string;
  contentType: string;
  size: number;
  uploadDate: string;
  url: string;
  medicationId?: string;
  category?: string;
}

export class ImageApi {
  /**
   * Upload an image to MongoDB GridFS
   * @param file - The image file to upload
   * @param medicationId - Optional medication ID to associate with the image
   * @param category - Optional category (defaults to 'medication')
   * @returns Promise with upload response
   */
  static async uploadImage(
    file: File, 
    medicationId?: string, 
    category: string = 'medication'
  ): Promise<ImageUploadResponse> {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('category', category);
    
    if (medicationId) {
      formData.append('medication_id', medicationId);
    }

    console.log('Uploading image to MongoDB GridFS:', {
      filename: file.name,
      size: file.size,
      type: file.type,
      medicationId,
      category
    });

    const response = await fetch(`${API_BASE}/images`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Image upload failed:', errorData);
      throw new Error(errorData.error || 'Failed to upload image');
    }

    const data = await response.json();
    console.log('Image uploaded successfully:', data);
    return data;
  }

  /**
   * Get an image by ID (returns the image URL for use in img src)
   * @param imageId - The MongoDB ObjectId of the image
   * @returns The image URL
   */
  static getImageUrl(imageId: string): string {
    return `${API_BASE}/images/${imageId}`;
  }

  /**
   * List images with optional filtering
   * @param filters - Optional filters for medication ID and category
   * @returns Promise with array of image metadata
   */
  static async listImages(filters?: {
    medicationId?: string;
    category?: string;
    limit?: number;
  }): Promise<ImageListItem[]> {
    const params = new URLSearchParams();
    
    if (filters?.medicationId) params.append('medication_id', filters.medicationId);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await fetch(`${API_BASE}/images?${params}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || 'Failed to list images');
    }

    return response.json();
  }

  /**
   * Delete an image by ID
   * @param imageId - The MongoDB ObjectId of the image to delete
   * @returns Promise with deletion confirmation
   */
  static async deleteImage(imageId: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE}/images/${imageId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || 'Failed to delete image');
    }

    return response.json();
  }

  /**
   * Get images for a specific medication (useful for pill game)
   * @param medicationId - The medication ID
   * @returns Promise with array of image metadata for that medication
   */
  static async getMedicationImages(medicationId: string): Promise<ImageListItem[]> {
    return this.listImages({ medicationId, category: 'medication' });
  }

  /**
   * Get all medication images for the pill game
   * @returns Promise with array of all medication images
   */
  static async getAllMedicationImages(): Promise<ImageListItem[]> {
    return this.listImages({ category: 'medication' });
  }
}

// Export default instance
export const imageApi = ImageApi;
