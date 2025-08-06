export interface CategoryMapping {
  ownerCategory: string;
  dbCategories: string[];
  productCount: number;
  description?: string;
}

export interface OwnerCategory {
  name: string;
  productCount: number;
  dbCategories: string[];
  description?: string;
}

export type OwnerCategoryName =
  | 'MARINE LOCKS'
  | 'MARINE LEVERS, ESCUTCHEONS & ROSES'
  | 'KEYING SYSTEMS - SCHWEPPER AND TRIOVING LOCKS'
  | 'CABINET HARDWARE, LOCKERS AND DECK BOXES'
  | 'MARINE GRADE HINGES'
  | 'HATCH AND DECK HARDWARE'
  | 'GLASS DOOR AND SHOWER DOOR HARDWARE'
  | 'SLIDING DOOR TRACK 316 STAINLESS STEEL'
  | 'CLEATS, BOLLARDS & HAWSE PIPES'
  | 'DOOR HOLDERS, DOOR STOPS, WINDOW STAYS & DOOR STAY'
  | 'DOOR CLOSERS HYDRAULIC'
  | 'GASSPRINGS / GAS STRUTS'
  | 'FIRE FIGHTING AND HOSE DOWN EQUIPMENT'
  | 'PULLS / GRABRAILS / HOOKS / BRACKETS'
  | 'DECORATIVE DESIGNS FOR LEVERS, ESCUTCHEONS, ROSES'
  | 'TUBULAR LOCK SYSTEMS'
  | 'FLUSH BOLTS, EDGE BOLTS';
