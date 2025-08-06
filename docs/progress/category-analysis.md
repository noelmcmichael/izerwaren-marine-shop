# Product Category Analysis

## Current Category Structure Analysis

### **Detected Category Patterns**

#### **1. Alphabetic System (Legacy/Simple)**

```
a - Push Button Mechanism
b - Push / Pull Mechanism
c - Button & Rings for Push/Pull mechanisms
d - Cabinet Rim Locks with Steel Parts
e - Cabinet Rim Locks Marine Grade
f - Barrel Bolts, Stainless Steel
g - Pull to Open Latch Mechanism
```

_Pattern: Single letter prefix + descriptive name_

#### **2. Descriptive Categories (Detailed/Modern)**

```
25, 30 and 38 mm backset; Marine Grade Mortise Locks for Small Doors
40 and 50 mm backset. Marine Grade Mortise Locks GSV and S&B
55 mm Backset GSV Schwepper and S&B Marine Locks
65 backset mm Marine Grade Mortise Locks for full Size Doors
```

_Pattern: Technical specifications + product type_

#### **3. Functional Categories (Product-Based)**

```
Door Pulls, Grab Rails and Steps
Door Holder Hook Model
Door Holder Clamping Model
Door Stay Stainless Steel
Door Stays Brass
```

_Pattern: Primary function + material/variant_

#### **4. Brand/Manufacturer Categories**

```
Jado Decorative Lever Designs
Jado and Wilka Mortise Locks
Italian Contemporary Lever Designs
Italian Marine Locks - OIcese Ricci
Italian Marine Locks - Razeto and Casareto
GSV and S&B Lever Handles, Marine Grade Trim
```

_Pattern: Brand name + product type_

### **Inferred Category Hierarchy**

Based on the analysis, I can identify this **3-level hierarchy**:

#### **Level 1: Primary Categories (Top-Level)**

1. **Locks & Latches**
   - Cabinet Rim Locks
   - Mortise Locks
   - Door Locks
   - Latches & Mechanisms

2. **Hardware & Fasteners**
   - Hinges
   - Bolts & Fasteners
   - Deck Hardware
   - Hatch Hardware

3. **Door & Window Systems**
   - Door Holders & Stays
   - Door Closers
   - Window Hardware
   - Glass Door Systems

4. **Marine Deck Equipment**
   - Cleats & Bollards
   - Tie Downs
   - Deck Fittings

5. **Handles & Levers**
   - Marine Grade Levers
   - Decorative Handles
   - Grab Rails & Pulls

6. **Gas Springs & Pneumatics**
   - Gas Springs
   - End Fittings
   - Charging/Bleeding Kits

#### **Level 2: Sub-Categories (Material/Grade)**

- **Marine Grade** (Stainless Steel, Corrosion Resistant)
- **Standard Grade** (Steel, Brass)
- **Heavy Duty** vs **Light Duty**
- **Interior** vs **Exterior**

#### **Level 3: Specific Variants (Technical Specs)**

- **Size Specifications** (25mm, 30mm, 38mm backset)
- **Brand Variants** (GSV, S&B, Jado, Italian)
- **Mounting Types** (Surface Mount, Flush, etc.)

### **Category Distribution Analysis**

#### **Top Categories by Product Count:**

1. **Cabinet Rim Locks** (50 products) - d & e categories
2. **Push/Pull Mechanisms** (23 products) - b & c categories
3. **Jado Lever Designs** (15 products)
4. **Pull to Open Mechanisms** (12 products) - g category
5. **GSV/S&B Marine Hardware** (11 products)

#### **Material Distribution:**

- **Stainless Steel**: ~40% of products
- **Marine Grade**: ~35% of products
- **Brass**: ~15% of products
- **Steel**: ~10% of products

#### **Size Categories:**

- **Small Doors**: 25-38mm backset locks
- **Medium Doors**: 40-55mm backset locks
- **Full Size Doors**: 65mm+ backset locks

### **Recommendations for Category Navigation**

#### **Option 1: Hierarchical Filter Tree** ⭐ **RECOMMENDED**

```
📁 Locks & Latches
  ├── 🔒 Cabinet Rim Locks
  │   ├── Marine Grade (15 products)
  │   └── Steel Parts (35 products)
  ├── 🚪 Mortise Locks
  │   ├── Small Doors (25-38mm)
  │   ├── Medium Doors (40-55mm)
  │   └── Full Size Doors (65mm+)
  └── 🔧 Mechanisms
      ├── Push/Pull (16 products)
      └── Pull to Open (12 products)

📁 Hardware & Fasteners
  ├── 🚪 Hinges
  ├── 🔩 Bolts & Fasteners
  └── ⚓ Marine Deck Hardware

📁 Handles & Levers
  ├── 🎨 Decorative (Jado, Italian)
  └── ⚓ Marine Grade (GSV, S&B)
```

#### **Option 2: Tag-Based Filtering**

**Material Tags**: Marine Grade, Stainless Steel, Brass, Steel **Function
Tags**: Locks, Hinges, Handles, Fasteners **Size Tags**: Small, Medium, Large,
Heavy Duty **Brand Tags**: Jado, Italian, GSV, S&B

#### **Option 3: Smart Search Categories**

**Quick Filters**: Most Popular, Marine Grade, New Products **Browse by Need**:
Interior Doors, Exterior Doors, Cabinets, Deck Hardware **Shop by Brand**:
Premium Brands, Marine Specialists

### **Implementation Priority**

1. **High Priority**: Hierarchical tree with Marine Grade vs Standard separation
2. **Medium Priority**: Brand filtering (Jado, Italian, GSV/S&B)
3. **Low Priority**: Technical specification filtering (backset sizes)

### **Data Cleanup Needed**

1. **Standardize naming**: "backset" vs "Backset" inconsistencies
2. **Handle null categories**: 1 product with null category
3. **Consolidate similar**: Multiple door holder categories could be grouped
4. **Brand extraction**: Extract brand names into separate field
