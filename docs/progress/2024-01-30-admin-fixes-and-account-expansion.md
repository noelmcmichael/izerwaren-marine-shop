# Implementation Roadmap: Admin UI Fixes & Account Type Expansion

**Date**: 2024-01-30  
**Objective**: Fix missing admin pages and expand from dealer-only to
multi-account-type system

## Acceptance Criteria

### Issues to Fix

- [ ] `/admin/pricing` page exists and functional
- [ ] `/admin/dealers/create` route works (currently 404)
- [ ] Dealer creation form submits successfully

### Account Type Expansion

- [ ] Prisma schema updated with new `Account` model replacing `Dealer`
- [ ] Account types: `DEALER`, `PRO`, `ACCOUNT_REP`
- [ ] Database migration preserves existing dealer data
- [ ] Admin UI updated to manage all account types
- [ ] RFQ system assigns Account Reps for quote management

### New Features

- [ ] `/admin/accounts` page with filtering by account type
- [ ] Account Rep assignment to RFQ requests
- [ ] Pro account pricing rules (different from dealer tiers)
- [ ] Account creation workflow for all types

## Risks

**Data Migration**: Converting from `Dealer` to `Account` model risks data loss

- **Mitigation**: Create migration script that preserves all existing dealer
  data

**Authentication Mapping**: Firebase UID mapping may break

- **Mitigation**: Maintain backward compatibility with `firebaseUid` field

**UI Complexity**: Managing multiple account types in single interface

- **Mitigation**: Use clear filtering and type-specific views

## Test Hooks

### Unit Tests

- Account creation with different types
- Pricing rule inheritance by account type
- RFQ assignment to Account Reps

### Integration Tests

- Admin flow: create Pro account → assign pricing → test login
- Admin flow: create Account Rep → assign RFQ → test quote workflow
- Data migration: verify all dealers become DEALER accounts

### Manual Testing

- [ ] Navigate to `/admin/pricing` - should load without 404
- [ ] Click "Add Dealer" - should navigate to creation form
- [ ] Submit new account creation - should save to database
- [ ] Filter accounts by type - should show correct results
- [ ] Assign Account Rep to RFQ - should update status

## Implementation Plan

### Phase 1: Fix Existing Issues

1. Create missing `/admin/pricing/page.tsx`
2. Create `/admin/dealers/create/page.tsx`
3. Fix dealer creation API endpoints

### Phase 2: Schema Migration

1. Create new `Account` model with type field
2. Generate migration script
3. Preserve dealer data as `DEALER` type accounts

### Phase 3: UI Updates

1. Rename `/admin/dealers` to `/admin/accounts`
2. Add account type filtering
3. Account Rep assignment interface for RFQs

### Phase 4: Testing & Validation

1. Verify all existing dealer functionality works
2. Test new account type creation
3. Validate RFQ assignment workflow

---

**Estimated Time**: 3-4 hours  
**Dependencies**: Database access, admin authentication working  
**Rollback Plan**: Git revert + database backup restore
