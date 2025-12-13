# Admin Application Review System - UC500

## Overview
This is the admin application review system (UC500) for the HomeSweetHome platform. It allows NGO staff to review youth adoption applications, assess sincerity, and make approval/rejection decisions.

## Architecture

The implementation follows strict MVVM (Model-View-ViewModel) architecture as per project requirements:

### 1. **Repository Layer** (`Model/Repository/AdminRepository/`)
- **File**: `adminRepository.ts`
- **Responsibility**: Data access only (CRUD operations)
- **Functions**:
  - `getApplications()` - Fetch applications with filtering/sorting
  - `getApplicationById()` - Get single application details
  - `getApplicationStats()` - Dashboard statistics
  - `approveApplication()` - Update status to approved
  - `rejectApplication()` - Update status to rejected
  - `requestMoreInfo()` - Update status to info_requested
  - `lockApplication()` - Assign to reviewer
  - `releaseApplication()` - Unassign from reviewer

### 2. **Service Layer** (`Model/Service/CoreService/`)
- **File**: `applicationService.ts`
- **Responsibility**: Business logic and validation
- **Functions**:
  - `getApplications()` - Delegates to repository
  - `getApplicationById()` - With validation
  - `validateReviewCriteria()` - Check age verification, profile completeness, letter quality
  - `calculateWaitingTime()` - Compute hours waiting
  - `isWaitingTimeAlert()` - Check if > 72 hours (3 days)
  - `approveApplication()` - With business rule validation
  - `rejectApplication()` - Validates reason and notes
  - `requestMoreInfo()` - Validates request is not empty
  - `getRejectionReasons()` - Return valid reasons

### 3. **ViewModel Layer** (`ViewModel/AdminViewModel/`)
- **File**: `AdminViewModel.ts`
- **Responsibility**: UI state management and interaction logic
- **Observable Properties**:
  - `applications` - Current page of applications
  - `selectedApplication` - Currently viewing application
  - `stats` - Dashboard statistics
  - `isLoading`, `errorMessage` - UI state
  - `filter`, `sortBy`, `currentPage` - Pagination/filtering state
  - `isApproving`, `isRejecting`, `isRequestingInfo` - Action states
  
- **Methods**:
  - `loadApplications()` - Load with current filters
  - `loadStats()` - Load dashboard stats
  - `selectApplication()` - Lock and load application
  - `backToList()` - Release lock and return to list
  - `approveApplication()` - Approve with optional notes
  - `rejectApplication()` - Reject with reason and notes
  - `requestMoreInfo()` - Request with details
  - `setFilter()`, `setSortBy()` - Update filter state
  - `getWaitingTime()` - Format waiting time for display
  - `isWaitingAlert()` - Check if alert should show
  - `getDisplayStatus()` - Format status for UI

### 4. **View Layer** (`View/Web/src/AdminUI/`)

#### Main Components:
- **AdminPage.tsx** - Main container managing all modal states
- **ApplicationQueue.tsx** - List view with filtering/sorting
- **ApplicationDetails.tsx** - Detailed review view
- **ApprovalModal.tsx** - Approval confirmation with summary
- **RejectionModal.tsx** - Rejection reason selection and feedback
- **RequestInfoModal.tsx** - Information request form

#### Styling:
- **AdminPage.css** - Header and main layout
- **ApplicationQueue.css** - List view and sidebar
- **ApplicationDetails.css** - Detail view styling
- **ApprovalModal.css** - Modal base styles + approval specific
- **RejectionModal.css** - Modal base styles + rejection specific
- **RequestInfoModal.css** - Modal base styles + request specific

## Data Flow

### Viewing Applications
```
View (ApplicationQueue) 
  → ViewModel.loadApplications()
    → Service.getApplications()
      → Repository.getApplications()
        → Supabase
```

### Approving Application
```
View (DetailView) 
  → User clicks "Approve"
    → Modal confirms
      → ViewModel.approveApplication()
        → Service.approveApplication()
          → Validation checks (rules applied here)
          → Repository.approveApplication()
            → Supabase
```

### Rejecting Application
```
View (DetailView)
  → User clicks "Reject"
    → RejectionModal (user selects reason)
      → ViewModel.rejectApplication()
        → Service.rejectApplication()
          → Validation (reason valid, "Other" has feedback)
          → Repository.rejectApplication()
            → Supabase
```

## Key Features

### 1. Application Queue
- Filter by status: All, Pending Review, Info Requested, Locked by Others
- Sort by: Oldest First, Newest First
- Dashboard stats: Pending count, Locked count, Approved today, Avg waiting time
- Visual alert (⚠️) when waiting time > 72 hours

### 2. Application Review Details
- Youth and Elderly profile information
- Motivation letter with character count validation (50-1000 chars)
- Commitment level (star rating based on letter length)
- Profile completeness percentage
- Submission date, waiting time, status

### 3. Decision Actions
- **Approve**: Shows success modal with approval summary and next steps
- **Reject**: Modal to select reason (5 predefined + "Other"), optional feedback
- **Request More Info**: Modal to specify information needed

### 4. Application Locking (Concurrency)
- When viewing an application, system locks it (assigns ngo_reviewer_id)
- Prevents duplicate review
- Lock released when returning to queue
- Shows "Locked by Others" in filter if another admin has locked

## Color Scheme
Following project requirements:
- `#9DE2D0` - Primary (Teal) - Approve buttons, highlights
- `#C8ADD6` - Secondary (Purple) - Status badges
- `#D4E5AE` - Tertiary (Yellow-Green) - Request info buttons
- `#EB8F80` - Alert (Coral) - Reject buttons, warnings
- `#FADE9F` - Accent (Peach) - Additional accents
- `#FFFFFF` - White - Background

## Validation Rules

### Review Criteria (Business Logic in Service)
- Age verification completed for both youth and elderly
- Motivation letter: 50-1000 characters
- Profile information not empty
- Account creation date recorded

### Rejection Reasons
- Insufficient motivation letter
- Age verification failed
- Inappropriate match
- Incomplete profile
- Other (requires detailed explanation)

### Waiting Time Alert
- Shows alert (⚠️) when application waiting > 72 hours (3 days)
- Displays in both queue list and dashboard stats

## Integration Notes

1. **Authentication**: Admin ID should be set via `adminViewModel.setCurrentAdminId(id)` 
2. **Notifications**: System should notify users via notification service (UC-M1 through UC-M6)
3. **Mobile**: Same ViewModel/Service can be used for mobile view with different UI
4. **State Persistence**: Use MobX for automatic reactivity - all UI updates when state changes

## Future Extensions

- UC400: Relationship dashboard (family health status)
- UC401: Reports (Safety Alerts & Family Advisor Consultations)
- UC402: Keyword Management
- Bulk operations (batch review up to 10 applications)
- Export applications to CSV/PDF
- Search applications by name, ID, etc.

## Testing

When testing:
1. Ensure Supabase credentials in `.env` are correct
2. Test with different application statuses
3. Verify notification sending works
4. Check locking mechanism prevents duplicate reviews
5. Validate all rejection reasons work
