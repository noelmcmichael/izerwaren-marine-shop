"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALL_OWNER_CATEGORIES = exports.getProductCountForOwnerCategory = exports.mapDbCategoryToOwner = exports.getDbCategoriesForOwner = exports.getMappedOwnerCategories = exports.CATEGORY_MAPPINGS = void 0;
/**
 * Category mappings from database categories to owner's intended categories
 * Based on analysis in docs/progress/category-mapping-analysis.md
 */
exports.CATEGORY_MAPPINGS = [
    {
        ownerCategory: 'MARINE LOCKS',
        dbCategories: [
            '25, 30 and 38 mm backset; Marine Grade Mortise Locks for Small Doors',
            '40 and 50 mm backset. Marine Grade Mortise Locks GSV and S&B',
            '55 mm Backset GSV Schwepper and S&B Marine Locks',
            '55 mm backset Trioving Vingcard Marine Grade Mortise Locks',
            '65 backset mm Marine Grade Mortise Locks for full Size Doors',
            'Italian Marine Locks -Razeto and Casareto',
            'Italian Marine Locks - OIcese Ricci',
        ],
        productCount: 169,
        description: 'Marine-grade mortise locks for various door sizes and applications',
    },
    {
        ownerCategory: 'MARINE LEVERS, ESCUTCHEONS & ROSES',
        dbCategories: [
            'GSV and S&B Lever Handles, Marine Grade Trim',
            'Izerwaren Upgrade Marine Levers, Escutcheons and Roses',
            'Special Marine Design Levers Brass',
        ],
        productCount: 76,
        description: 'Decorative door levers, escutcheon plates, and rose trim for marine applications',
    },
    {
        ownerCategory: 'KEYING SYSTEMS - SCHWEPPER AND TRIOVING LOCKS',
        dbCategories: [
            '55 mm Backset GSV Schwepper and S&B Marine Locks',
            '55 mm backset Trioving Vingcard Marine Grade Mortise Locks',
            'Oval Key Cylinder, Tumb-turns (Trioving/Vingcard)',
            'Profile Cylinder Key/ Knob (GSV - S&B LOCKS)',
            'Profile Cylinder Key/Key',
        ],
        productCount: 123,
        description: 'Schwepper and Trioving keying systems and components',
    },
    {
        ownerCategory: 'CABINET HARDWARE, LOCKERS AND DECK BOXES',
        dbCategories: [
            'd- Cabinet Rim Locks with Steel Parts',
            'e - Cabinet Rim Locks Marine Grade',
            'Cabinet Hinges Stainless Steel',
            'Slam Latch Stainless Steel for Cabinet Doors',
            'Refrigerator Latches',
        ],
        productCount: 66,
        description: 'Marine cabinet hardware, locker systems, and deck storage solutions',
    },
    {
        ownerCategory: 'MARINE GRADE HINGES',
        dbCategories: [
            'Marine Grade Invisible Hinges',
            'Stainless Steel Deck Hinges',
            'Stainless Steel Door Hinges',
            'Easy On Hinges',
        ],
        productCount: 54,
        description: 'High-quality marine-grade hinges for various applications',
    },
    {
        ownerCategory: 'HATCH AND DECK HARDWARE',
        dbCategories: [
            'Hatch Fasteners with Cam Operated by Triangular key',
            'Compression Latch Hatch Fastener Stainless Steel',
            'Hatch fasteners with Cam operated by Winch Handle',
            'Hatch lifts with Cam Hand Operated',
            'Deck Tie Downs 316 Stainless Steel Surface Mount',
            'Hatch Lift',
        ],
        productCount: 87,
        description: 'Deck fittings, hatch hardware, and marine deck equipment',
    },
    {
        ownerCategory: 'GLASS DOOR AND SHOWER DOOR HARDWARE',
        dbCategories: [
            'Glass Door Hinge Stainless Steel',
            'Glass Door Lock Full Size Steel Parts',
            'Glass Door Mechanism for Exterior Full Size Swinging Doors',
            'Glass Door Mechanism for Exterior Medium Size Swinging Doors',
            'Glass Clamps Wall and Tube Mounted - Stainless Steel',
        ],
        productCount: 43,
        description: 'Specialized hardware for glass doors and shower installations',
    },
    {
        ownerCategory: 'SLIDING DOOR TRACK 316 STAINLESS STEEL',
        dbCategories: ['Sliding Door Mortise Locks', 'Pocket Door Sliding Mortise Locks'],
        productCount: 37,
        description: '316 stainless steel sliding door track systems and locks',
    },
    {
        ownerCategory: 'CLEATS, BOLLARDS & HAWSE PIPES',
        dbCategories: ['Bollards', 'Fold Down Cleats 316 Stainless Steel'],
        productCount: 7,
        description: 'Marine cleats, bollards and hawse pipe fittings',
    },
    {
        ownerCategory: 'DOOR HOLDERS, DOOR STOPS, WINDOW STAYS & DOOR STAY',
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
        productCount: 77,
        description: 'Door holders, stops, window stays and door stay hardware',
    },
    {
        ownerCategory: 'DOOR CLOSERS HYDRAULIC',
        dbCategories: ['Door Closer Stainless Steel Set', 'Door Closer Steel Fire Rated'],
        productCount: 4,
        description: 'Hydraulic door closers for various applications',
    },
    {
        ownerCategory: 'GASSPRINGS / GAS STRUTS',
        dbCategories: [
            'Gas Spring - End Fittings Stainless Steel',
            'Gas Spring Charging Kit',
            'Gas Springs Bleeding Kit',
            'Gas spring - Mounting Hardware',
        ],
        productCount: 51,
        description: 'Gas springs, struts and related hardware',
    },
    {
        ownerCategory: 'FIRE FIGHTING AND HOSE DOWN EQUIPMENT',
        dbCategories: ['Valves, Hoses, Nozzles and Couplings'],
        productCount: 14,
        description: 'Marine fire safety equipment and hose down systems',
    },
    {
        ownerCategory: 'PULLS / GRABRAILS / HOOKS / BRACKETS',
        dbCategories: [
            'Door Pulls, Grab Rails and Steps',
            'b - Push / Pull Mechanism',
            'a - Push Button Mechanism',
            'g - Pull to Open Latch Mechanism',
            'c - Button & Rings for Push/Pull mechanisms',
            'Ajar Hooks',
        ],
        productCount: 74,
        description: 'Marine pulls, grabrails, hooks, brackets, and mounting hardware',
    },
    {
        ownerCategory: 'DECORATIVE DESIGNS FOR LEVERS, ESCUTCHEONS, ROSES',
        dbCategories: [
            'Jado Decorative Lever Designs',
            'Italian Contemporary Lever Designs',
            'Jado and Wilka Mortise Locks',
        ],
        productCount: 87,
        description: 'Decorative and artistic hardware designs for luxury marine applications',
    },
    {
        ownerCategory: 'TUBULAR LOCK SYSTEMS',
        dbCategories: ['Tubular Latches and Dead Bolts'],
        productCount: 25,
        description: 'Tubular locking mechanisms and cylindrical lock systems',
    },
    {
        ownerCategory: 'FLUSH BOLTS, EDGE BOLTS',
        dbCategories: [
            'Flush Bolts',
            'f - Barrel Bolts, Stainless Steel.',
            'Barrel Bolt / Transom Door / Bulwark Door Bolts. Stainless Steel',
        ],
        productCount: 25,
        description: 'Flush bolts, edge bolts, and door security hardware',
    },
];
/**
 * Get all mapped owner categories
 */
const getMappedOwnerCategories = () => {
    return exports.CATEGORY_MAPPINGS.map(mapping => mapping.ownerCategory);
};
exports.getMappedOwnerCategories = getMappedOwnerCategories;
/**
 * Get database categories for a given owner category
 */
const getDbCategoriesForOwner = (ownerCategory) => {
    const mapping = exports.CATEGORY_MAPPINGS.find(m => m.ownerCategory === ownerCategory);
    return mapping ? mapping.dbCategories : [];
};
exports.getDbCategoriesForOwner = getDbCategoriesForOwner;
/**
 * Map a database category to its owner category
 */
const mapDbCategoryToOwner = (dbCategory) => {
    for (const mapping of exports.CATEGORY_MAPPINGS) {
        if (mapping.dbCategories.includes(dbCategory)) {
            return mapping.ownerCategory;
        }
    }
    return null;
};
exports.mapDbCategoryToOwner = mapDbCategoryToOwner;
/**
 * Get product count for an owner category
 */
const getProductCountForOwnerCategory = (ownerCategory) => {
    const mapping = exports.CATEGORY_MAPPINGS.find(m => m.ownerCategory === ownerCategory);
    return mapping ? mapping.productCount : 0;
};
exports.getProductCountForOwnerCategory = getProductCountForOwnerCategory;
/**
 * All owner categories (including unmapped ones for future implementation)
 */
exports.ALL_OWNER_CATEGORIES = [
    'MARINE LOCKS',
    'MARINE LEVERS, ESCUTCHEONS & ROSES',
    'KEYING SYSTEMS - SCHWEPPER AND TRIOVING LOCKS',
    'CABINET HARDWARE, LOCKERS AND DECK BOXES',
    'MARINE GRADE HINGES',
    'HATCH AND DECK HARDWARE',
    'GLASS DOOR AND SHOWER DOOR HARDWARE',
    'SLIDING DOOR TRACK 316 STAINLESS STEEL',
    'CLEATS, BOLLARDS & HAWSE PIPES',
    'DOOR HOLDERS, DOOR STOPS, WINDOW STAYS & DOOR STAY',
    'DOOR CLOSERS HYDRAULIC',
    'GASSPRINGS / GAS STRUTS',
    'FIRE FIGHTING AND HOSE DOWN EQUIPMENT',
    'PULLS / GRABRAILS / HOOKS / BRACKETS',
    'DECORATIVE DESIGNS FOR LEVERS, ESCUTCHEONS, ROSES',
    'TUBULAR LOCK SYSTEMS',
    'FLUSH BOLTS, EDGE BOLTS',
];
