import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Inline category mappings to avoid import issues
const OWNER_CATEGORIES = [
  {
    name: 'MARINE LOCKS',
    productCount: 169,
    description: 'Marine-grade mortise locks for various door sizes and applications',
    dbCategories: [
      '25, 30 and 38 mm backset; Marine Grade Mortise Locks for Small Doors',
      '40 and 50 mm backset. Marine Grade Mortise Locks GSV and S&B',
      '55 mm Backset GSV Schwepper and S&B Marine Locks',
      '55 mm backset Trioving Vingcard Marine Grade Mortise Locks',
      '65 backset mm Marine Grade Mortise Locks for full Size Doors',
      'Italian Marine Locks -Razeto and Casareto',
      'Italian Marine Locks - OIcese Ricci',
    ],
  },
  {
    name: 'MARINE LEVERS, ESCUTCHEONS & ROSES',
    productCount: 76,
    description: 'Decorative door levers, escutcheon plates, and rose trim for marine applications',
    dbCategories: [
      'GSV and S&B Lever Handles, Marine Grade Trim',
      'Izerwaren Upgrade Marine Levers, Escutcheons and Roses',
      'Special Marine Design Levers Brass',
    ],
  },
  {
    name: 'KEYING SYSTEMS - SCHWEPPER AND TRIOVING LOCKS',
    productCount: 123,
    description: 'Schwepper and Trioving keying systems and components',
    dbCategories: [
      '55 mm Backset GSV Schwepper and S&B Marine Locks',
      '55 mm backset Trioving Vingcard Marine Grade Mortise Locks',
      'Oval Key Cylinder, Tumb-turns (Trioving/Vingcard)',
      'Profile Cylinder Key/ Knob (GSV - S&B LOCKS)',
      'Profile Cylinder Key/Key',
    ],
  },
  {
    name: 'CABINET HARDWARE, LOCKERS AND DECK BOXES',
    productCount: 66,
    description: 'Marine cabinet hardware, locker systems, and deck storage solutions',
    dbCategories: [
      'd- Cabinet Rim Locks with Steel Parts',
      'e - Cabinet Rim Locks Marine Grade',
      'Cabinet Hinges Stainless Steel',
      'Slam Latch Stainless Steel for Cabinet Doors',
      'Refrigerator Latches',
    ],
  },
  {
    name: 'MARINE GRADE HINGES',
    productCount: 54,
    description: 'High-quality marine-grade hinges for various applications',
    dbCategories: [
      'Marine Grade Invisible Hinges',
      'Stainless Steel Deck Hinges',
      'Stainless Steel Door Hinges',
      'Easy On Hinges',
    ],
  },
  {
    name: 'HATCH AND DECK HARDWARE',
    productCount: 87,
    description: 'Deck fittings, hatch hardware, and marine deck equipment',
    dbCategories: [
      'Hatch Fasteners with Cam Operated by Triangular key',
      'Compression Latch Hatch Fastener Stainless Steel',
      'Hatch fasteners with Cam operated by Winch Handle',
      'Hatch lifts with Cam Hand Operated',
      'Deck Tie Downs 316 Stainless Steel Surface Mount',
      'Hatch Lift',
    ],
  },
  {
    name: 'GLASS DOOR AND SHOWER DOOR HARDWARE',
    productCount: 43,
    description: 'Specialized hardware for glass doors and shower installations',
    dbCategories: [
      'Glass Door Hinge Stainless Steel',
      'Glass Door Lock Full Size Steel Parts',
      'Glass Door Mechanism for Exterior Full Size Swinging Doors',
      'Glass Door Mechanism for Exterior Medium Size Swinging Doors',
      'Glass Clamps Wall and Tube Mounted - Stainless Steel',
    ],
  },
  {
    name: 'SLIDING DOOR TRACK 316 STAINLESS STEEL',
    productCount: 37,
    description: '316 stainless steel sliding door track systems and locks',
    dbCategories: ['Sliding Door Mortise Locks', 'Pocket Door Sliding Mortise Locks'],
  },
  {
    name: 'CLEATS, BOLLARDS & HAWSE PIPES',
    productCount: 7,
    description: 'Marine cleats, bollards and hawse pipe fittings',
    dbCategories: ['Bollards', 'Fold Down Cleats 316 Stainless Steel'],
  },
  {
    name: 'DOOR HOLDERS, DOOR STOPS, WINDOW STAYS & DOOR STAY',
    productCount: 77,
    description: 'Door holders, stops, window stays and door stay hardware',
    dbCategories: [
      'Door Holder Clamping Model',
      'Door Holder Hook Model',
      'Push Door Holder',
      'Magnetic Door Holder Heavy Duty',
      'Magnetic Door Holder Light Duty',
      'Magnetic Light Door Holder Plastic Ivory & Brown',
      'Window Stay Stainless Steel',
      'Window Stay Brass',
      'Window Stay Telescopic Stainless Steel',
      'Door Stay Stainless Steel',
      'Door Stays Brass',
      'Dogging Devices for Doors And Hatches',
    ],
  },
  {
    name: 'DOOR CLOSERS HYDRAULIC',
    productCount: 4,
    description: 'Hydraulic door closers for various applications',
    dbCategories: ['Door Closer Stainless Steel Set', 'Door Closer Steel Fire Rated'],
  },
  {
    name: 'GASSPRINGS / GAS STRUTS',
    productCount: 51,
    description: 'Gas springs, struts and related hardware',
    dbCategories: [
      'Gas Spring - End Fittings Stainless Steel',
      'Gas Spring Charging Kit',
      'Gas Springs Bleeding Kit',
      'Gas spring - Mounting Hardware',
    ],
  },
  {
    name: 'FIRE FIGHTING AND HOSE DOWN EQUIPMENT',
    productCount: 14,
    description: 'Marine fire safety equipment and hose down systems',
    dbCategories: ['Valves, Hoses, Nozzles and Couplings'],
  },
  {
    name: 'PULLS / GRABRAILS / HOOKS / BRACKETS',
    productCount: 74,
    description: 'Marine pulls, grabrails, hooks, brackets, and mounting hardware',
    dbCategories: [
      'Door Pulls, Grab Rails and Steps',
      'b - Push / Pull Mechanism',
      'a - Push Button Mechanism',
      'g - Pull to Open Latch Mechanism',
      'c - Button & Rings for Push/Pull mechanisms',
      'Ajar Hooks',
    ],
  },
  {
    name: 'DECORATIVE DESIGNS FOR LEVERS, ESCUTCHEONS, ROSES',
    productCount: 87,
    description: 'Decorative and artistic hardware designs for luxury marine applications',
    dbCategories: [
      'Jado Decorative Lever Designs',
      'Italian Contemporary Lever Designs',
      'Jado and Wilka Mortise Locks',
    ],
  },
  {
    name: 'TUBULAR LOCK SYSTEMS',
    productCount: 25,
    description: 'Tubular locking mechanisms and cylindrical lock systems',
    dbCategories: ['Tubular Latches and Dead Bolts'],
  },
  {
    name: 'FLUSH BOLTS, EDGE BOLTS',
    productCount: 25,
    description: 'Flush bolts, edge bolts, and door security hardware',
    dbCategories: [
      'Flush Bolts',
      'f - Barrel Bolts, Stainless Steel.',
      'Barrel Bolt / Transom Door / Bulwark Door Bolts. Stainless Steel',
    ],
  },
];

export async function GET() {
  try {
    // Return the predefined owner categories
    const categories = OWNER_CATEGORIES.map(category => ({
      name: category.name,
      productCount: category.productCount,
      description: category.description,
      dbCategories: category.dbCategories,
    })).sort((a, b) => b.productCount - a.productCount);

    const totalMappedProducts = OWNER_CATEGORIES.reduce((sum, cat) => sum + cat.productCount, 0);

    return NextResponse.json({
      categories,
      meta: {
        source: 'owner-category-mapping',
        timestamp: new Date().toISOString(),
        totalCategories: categories.length,
        totalProducts: totalMappedProducts,
        mappingCoverage: 100,
        averageProductsPerCategory: Math.round(totalMappedProducts / categories.length),
      },
    });
  } catch (error) {
    console.error('Categories API error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch categories',
        message: error instanceof Error ? error.message : 'Unknown error',
        meta: {
          source: 'category-mapping-error',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}