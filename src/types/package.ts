export interface Package {
    _id: string;
    name: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    duration?: string;
    sharingPrice?: number;
    fourBedPrice?: number;
    threeBedPrice?: number;
    twoBedPrice?: number;
    createdAt?: string;
}
