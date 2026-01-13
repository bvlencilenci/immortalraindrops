import { Database } from '../lib/database.types';

export type Track = Database['public']['Tables']['tracks']['Row'] & { vote_count?: number };
