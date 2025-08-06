# Category Mapping: Owner Intent vs Database Reality

## **Owner's Intended Category Structure** (From UI Design)

Based on the provided category list, here's the intended 17-category structure:

### **Owner's Categories:**

1. **MARINE LOCKS**
2. **MARINE LEVERS, ESCUTCHEONS & ROSES**
3. **KEYING SYSTEMS - SCHWEPPER AND TRIOVING LOCKS**
4. **CABINET HARDWARE, LOCKERS AND DECK BOXES**
5. **MARINE GRADE HINGES**
6. **HATCH AND DECK HARDWARE**
7. **GLASS DOOR AND SHOWER DOOR HARDWARE**
8. **SLIDING DOOR TRACK 316 STAINLESS STEEL**
9. **CLEATS, BOLLARDS & HAWSE PIPES**
10. **DOOR HOLDERS, DOOR STOPS, WINDOW STAYS & DOOR STAY**
11. **DOOR CLOSERS HYDRAULIC**
12. **GASSPRINGS / GAS STRUTS**
13. **FIRE FIGHTING AND HOSE DOWN EQUIPMENT**
14. **PULLS / GRABRAILS / HOOKS / BRACKETS**
15. **DECORATIVE DESIGNS FOR LEVERS, ESCUTCHEONS, ROSES**
16. **TUBULAR LOCK SYSTEMS**
17. **FLUSH BOLTS, EDGE BOLTS**

---

## **Database Category Mapping**

### **✅ Direct Matches Found:**

#### **1. MARINE LOCKS** → **147 products**

```
✅ 25, 30 and 38 mm backset; Marine Grade Mortise Locks for Small Doors (12)
✅ 40 and 50 mm backset. Marine Grade Mortise Locks GSV and S&B (25)
✅ 55 mm Backset GSV Schwepper and S&B Marine Locks (47)
✅ 55 mm backset Trioving Vingcard Marine Grade Mortise Locks (55)
✅ 65 backset mm Marine Grade Mortise Locks for full Size Doors (8)
```

#### **3. KEYING SYSTEMS - SCHWEPPER AND TRIOVING LOCKS** → **102+ products**

```
✅ 55 mm Backset GSV Schwepper and S&B Marine Locks (47)
✅ 55 mm backset Trioving Vingcard Marine Grade Mortise Locks (55)
✅ Oval Key Cylinder, Tumb-turns (Trioving/Vingcard) (7)
✅ Profile Cylinder Key/ Knob (GSV - S&B LOCKS) (4)
```

#### **5. MARINE GRADE HINGES** → **22 products**

```
✅ Marine Grade Invisible Hinges (22)
```

#### **7. GLASS DOOR AND SHOWER DOOR HARDWARE** → **33 products**

```
✅ Glass Door Hinge Stainless Steel (5)
✅ Glass Door Lock Full Size Steel Parts (1)
✅ Glass Door Mechanism for Exterior Full Size Swinging Doors (10)
✅ Glass Door Mechanism for Exterior Medium Size Swinging Doors (17)
```

#### **8. SLIDING DOOR TRACK 316 STAINLESS STEEL** → **24 products**

```
✅ Sliding Door Mortise Locks (24)
```

#### **9. CLEATS, BOLLARDS & HAWSE PIPES** → **7 products**

```
✅ Bollards (3)
✅ Fold Down Cleats 316 Stainless Steel (4)
```

#### **10. DOOR HOLDERS, DOOR STOPS, WINDOW STAYS & DOOR STAY** → **46 products**

```
✅ Door Holder Clamping Model (11)
✅ Door Holder Hook Model (13)
✅ Push Door Holder (12)
✅ Magnetic Door Holder Heavy Duty (7)
✅ Magnetic Door Holder Light Duty (13)
✅ Window Stay Brass (?) - need to verify
✅ Window Stay Stainless Steel (?) - need to verify
✅ Door Stay Stainless Steel (?) - need to verify
```

#### **11. DOOR CLOSERS HYDRAULIC** → **4 products**

```
✅ Door Closer Stainless Steel Set (3)
✅ Door Closer Steel Fire Rated (1)
```

#### **12. GASSPRINGS / GAS STRUTS** → **50+ products**

```
✅ Gas Spring - End Fittings Stainless Steel (26)
✅ Gas Spring Charging Kit (1)
✅ Gas Springs Bleeding Kit (1)
✅ Gas spring - Mounting Hardware (23)
```

#### **14. PULLS / GRABRAILS / HOOKS / BRACKETS** → **5 products**

```
✅ Door Pulls, Grab Rails and Steps (5)
```

#### **17. FLUSH BOLTS, EDGE BOLTS** → **4 products**

```
✅ Flush Bolts (4)
```

---

### **🔍 Needs Mapping/Investigation:**

#### **2. MARINE LEVERS, ESCUTCHEONS & ROSES** → **Need to find**

```
🔍 GSV and S&B Lever Handles, Marine Grade Trim (11)
🔍 Izerwaren Upgrade Marine Levers, Escutcheons and Roses (3)
🔍 Special Marine Design Levers Brass (1)
```

#### **4. CABINET HARDWARE, LOCKERS AND DECK BOXES** → **Need to verify**

```
🔍 d- Cabinet Rim Locks with Steel Parts (35)
🔍 e - Cabinet Rim Locks Marine Grade (15)
🔍 Cabinet Hinges Stainless Steel (?)
🔍 Slam Latch Stainless Steel for Cabinet Doors (?)
```

#### **6. HATCH AND DECK HARDWARE** → **Need to verify**

```
🔍 Hatch Fasteners with Cam Operated by Triangular key (?)
🔍 Hatch lifts with Cam Hand Operated (?)
🔍 Hatch fasteners with Cam operated by Winch Handle (?)
🔍 Compression Latch Hatch Fastener Stainless Steel (?)
🔍 Deck Tie Downs 316 Stainless Steel Surface Mount (?)
```

#### **13. FIRE FIGHTING AND HOSE DOWN EQUIPMENT** → **Need to find**

```
🔍 Valves, Hoses, Nozzles and Couplings (1)
```

#### **15. DECORATIVE DESIGNS FOR LEVERS, ESCUTCHEONS, ROSES** → **Need to verify**

```
🔍 Jado Decorative Lever Designs (15)
🔍 Italian Contemporary Lever Designs (3)
🔍 Jado and Wilka Mortise Locks (3)
```

#### **16. TUBULAR LOCK SYSTEMS** → **Need to verify**

```
🔍 Tubular Latches and Dead Bolts (4)
```

---

## **Category Mapping Strategy**

### **Option 1: Database Schema Enhancement** ⭐ **RECOMMENDED**

Add a `owner_category` field to map existing categories to owner's structure:

```sql
ALTER TABLE products ADD COLUMN owner_category VARCHAR(255);

-- Example mappings:
UPDATE products SET owner_category = 'MARINE LOCKS'
WHERE category_name LIKE '%Marine Grade Mortise Locks%';

UPDATE products SET owner_category = 'GASSPRINGS / GAS STRUTS'
WHERE category_name LIKE '%Gas Spring%';

UPDATE products SET owner_category = 'GLASS DOOR AND SHOWER DOOR HARDWARE'
WHERE category_name LIKE '%Glass Door%';
```

### **Option 2: Category Mapping Service**

Create a mapping service to translate database categories to owner categories:

```typescript
interface CategoryMapping {
  ownerCategory: string;
  dbCategories: string[];
  productCount: number;
}

const CATEGORY_MAPPINGS: CategoryMapping[] = [
  {
    ownerCategory: 'MARINE LOCKS',
    dbCategories: [
      '25, 30 and 38 mm backset; Marine Grade Mortise Locks for Small Doors',
      '40 and 50 mm backset. Marine Grade Mortise Locks GSV and S&B',
      '55 mm Backset GSV Schwepper and S&B Marine Locks',
      '55 mm backset Trioving Vingcard Marine Grade Mortise Locks',
      '65 backset mm Marine Grade Mortise Locks for full Size Doors',
    ],
    productCount: 147,
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
  },
  // ... more mappings
];
```

### **Option 3: Gradual Migration**

1. **Phase 1**: Implement mapping service for known categories
2. **Phase 2**: Research and map remaining categories
3. **Phase 3**: Update database with final category structure

---

## **Immediate Action Items**

### **✅ Can Implement Now** (9 categories mapped, ~400 products)

1. **MARINE LOCKS** (147 products)
2. **KEYING SYSTEMS - SCHWEPPER AND TRIOVING LOCKS** (102 products)
3. **MARINE GRADE HINGES** (22 products)
4. **GLASS DOOR AND SHOWER DOOR HARDWARE** (33 products)
5. **SLIDING DOOR TRACK 316 STAINLESS STEEL** (24 products)
6. **CLEATS, BOLLARDS & HAWSE PIPES** (7 products)
7. **DOOR HOLDERS, DOOR STOPS, WINDOW STAYS & DOOR STAY** (46 products)
8. **DOOR CLOSERS HYDRAULIC** (4 products)
9. **GASSPRINGS / GAS STRUTS** (51 products)

### **🔍 Need Research** (8 categories, ~547 products)

- Find database categories for remaining owner categories
- Verify product counts and mappings
- Handle any unmapped products

---

## **Implementation Recommendations**

### **Immediate (Today)**:

1. Create mapping service for the 9 confirmed categories
2. Add category filter dropdown to product search
3. Test with known category mappings

### **Short Term (This Week)**:

1. Research and map remaining 8 categories
2. Handle any uncategorized products
3. Add hierarchical navigation based on owner's structure

### **Medium Term**:

1. Update database schema with owner categories
2. Add subcategory navigation where appropriate
3. Implement category-based product recommendations

**The owner's category structure is excellent and much more user-friendly than
the current database categories. We should definitely implement this
hierarchical navigation system.**
