# Implementation Roadmap: Complete RFQ Management System

**Date**: 2024-01-30  
**Objective**: Build end-to-end RFQ workflow from customer request to quote
delivery

## Acceptance Criteria

### Admin RFQ Dashboard

- [ ] `/admin/rfq` page showing all RFQ requests with status
- [ ] Bulk assignment of RFQs to Account Reps
- [ ] Auto-assignment based on territory and capacity
- [ ] RFQ status tracking (Pending → Assigned → Quoted → Accepted/Declined)
- [ ] Search and filtering by status, customer, assigned rep

### Account Rep Portal

- [ ] `/rep` route for Account Rep login and dashboard
- [ ] Personal RFQ queue showing assigned requests
- [ ] Quote building interface with custom pricing
- [ ] Quote approval workflow integration
- [ ] Quote delivery/email functionality

### Customer RFQ Interface

- [ ] Public RFQ request form (`/request-quote`)
- [ ] File upload for specifications/drawings
- [ ] Integration with existing account system for dealer/pro pricing context
- [ ] Email confirmation and tracking

### Quote Generation System

- [ ] Quote builder with line item management
- [ ] Custom pricing overrides for Account Reps
- [ ] Quote templates and branding
- [ ] PDF quote generation
- [ ] Quote versioning and revision tracking

### Workflow Automation

- [ ] Auto-assignment algorithm based on territory/capacity
- [ ] Email notifications for all stakeholders
- [ ] Escalation for overdue quotes
- [ ] Integration with Shopify for order conversion

## Risks

**Account Rep Authentication**: New user type needs separate auth flow

- **Mitigation**: Extend existing Firebase Auth with role-based access

**Quote Pricing Logic**: Complex B2B pricing calculations

- **Mitigation**: Build on existing dealer pricing system, add rep overrides

**File Storage**: Customer uploads need secure storage

- **Mitigation**: Use GCP Cloud Storage with signed URLs

**Email Integration**: Notification system complexity

- **Mitigation**: Start with basic email, enhance later

## Test Hooks

### Unit Tests

- RFQ assignment algorithm with territory/capacity logic
- Quote calculation with pricing overrides
- Status transition validation

### Integration Tests

- Customer submits RFQ → Auto-assigned to rep → Quote generated → Customer
  notified
- Account Rep dashboard shows only assigned RFQs
- Admin can manually reassign RFQs

### Manual Testing

- [ ] Submit RFQ as customer - should auto-assign to appropriate rep
- [ ] Login as Account Rep - should see assigned RFQs only
- [ ] Build quote with custom pricing - should calculate correctly
- [ ] Admin bulk assignment - should update assignments immediately

## Implementation Plan

### Phase 1: Core RFQ Infrastructure (45 min)

1. Create RFQ admin dashboard with assignment interface
2. Build Account Rep authentication and portal routing
3. Create basic RFQ status management APIs

### Phase 2: Quote Building System (60 min)

1. Quote builder interface for Account Reps
2. Custom pricing override system
3. Quote generation and PDF export
4. Quote approval workflow

### Phase 3: Customer Interface (45 min)

1. Public RFQ request form
2. File upload integration
3. Customer notification system
4. RFQ tracking for customers

### Phase 4: Automation & Polish (30 min)

1. Auto-assignment algorithm implementation
2. Email notification system
3. Workflow optimization
4. Testing and validation

---

**Estimated Time**: 3 hours  
**Dependencies**: Account system (✅ complete), admin authentication  
**Business Value**: Complete B2B quote-to-order workflow

**Success Metrics:**

- Customer can submit RFQ and receive quote within defined SLA
- Account Reps have clear dashboard and quote-building tools
- Admin has full visibility and control over RFQ pipeline
- System handles territory-based assignment automatically
