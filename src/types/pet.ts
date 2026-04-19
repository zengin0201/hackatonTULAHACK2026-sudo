export interface Pet {
  id: string;
  shelter_id: string;
  name: string;
  age: number;
  description: string;
  image_urls: string[];
  donation_goal: number;
  current_donations: number;
  type?: string;
  attributes?: {
    requires_space: boolean;
    cat_friendly: boolean;
    status?: string;
  };
  matchPercentage?: number;
  userName?: string;
  shelterName?: string;
}