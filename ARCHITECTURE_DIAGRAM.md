# UC500 Architecture Diagram & Flow

## 🏗️ System Architecture (MVVM)

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER (View)                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ AdminPage.tsx (Main Container)                           │  │
│  │ ┌────────────────────────┐  ┌─────────────────────────┐ │  │
│  │ │ ApplicationQueue.tsx   │  │ ApplicationDetails.tsx │ │  │
│  │ │ - Sidebar (filters)    │  │ - Youth profile       │ │  │
│  │ │ - Stats dashboard      │  │ - Elderly profile     │ │  │
│  │ │ - App list with cards  │  │ - Motivation letter   │ │  │
│  │ └────────────────────────┘  │ - Decision buttons    │ │  │
│  │                             └─────────────────────────┘ │  │
│  │ ┌────────────────────────┐ ┌──────────────────────────┐ │  │
│  │ │ ApprovalModal.tsx      │ │ RejectionModal.tsx      │ │  │
│  │ │ - Success confirmation │ │ - Reason dropdown       │ │  │
│  │ │ - Summary display      │ │ - Feedback textarea     │ │  │
│  │ │ - Next steps           │ │ - Confirm button        │ │  │
│  │ └────────────────────────┘ └──────────────────────────┘ │  │
│  │ ┌──────────────────────────┐                             │  │
│  │ │ RequestInfoModal.tsx     │                             │  │
│  │ │ - Info request textarea  │                             │  │
│  │ │ - Notes field            │                             │  │
│  │ └──────────────────────────┘                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│  Components use observer() hook - reactive to MobX state      │
└─────────────────────────────────────────────────────────────────┘
                            ↑ (read state, call methods)
                            ↓ (notify of changes)
┌─────────────────────────────────────────────────────────────────┐
│                       STATE MANAGEMENT LAYER                    │
│                    (ViewModel - MobX Observable)                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ AdminViewModel.ts - makeAutoObservable(this)             │  │
│  │                                                          │  │
│  │ State Properties:                                        │  │
│  │ • applications: ApplicationWithProfiles[] (observable)   │  │
│  │ • selectedApplication: ApplicationWithProfiles | null    │  │
│  │ • stats: ApplicationStats | null                        │  │
│  │ • isLoading, errorMessage (observable)                  │  │
│  │ • filter, sortBy, currentPage (observable)              │  │
│  │ • isApproving, isRejecting, isRequestingInfo (obs.)     │  │
│  │                                                          │  │
│  │ Action Methods (automatically observable):              │  │
│  │ • loadApplications()   - fetch & filter apps            │  │
│  │ • selectApplication()  - lock & fetch details           │  │
│  │ • approveApplication() - call service, update state     │  │
│  │ • rejectApplication()  - call service, update state     │  │
│  │ • requestMoreInfo()    - call service, update state     │  │
│  │ • backToList()         - release lock, reload list      │  │
│  │ • getWaitingTime()     - format for display             │  │
│  │ • setFilter(), setSortBy() - update filter state        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                    ↑ (call methods, pass data)
                    ↓ (return results, signal completion)
┌─────────────────────────────────────────────────────────────────┐
│                      BUSINESS LOGIC LAYER                       │
│                         (Service)                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ applicationService.ts                                    │  │
│  │                                                          │  │
│  │ Methods (with business rule validation):                │  │
│  │ • getApplications() - call repo, return apps            │  │
│  │ • getApplicationById() - fetch, validate existence      │  │
│  │ • validateReviewCriteria() - check age, profile, letter │  │
│  │ • calculateWaitingTime() - compute hours waiting        │  │
│  │ • isWaitingTimeAlert() - check > 72 hours              │  │
│  │ • approveApplication() - validate then call repo        │  │
│  │ • rejectApplication() - validate reason then call repo  │  │
│  │ • requestMoreInfo() - validate request then call repo   │  │
│  │ • getRejectionReasons() - return valid reasons array    │  │
│  │                                                          │  │
│  │ Business Rules Enforced:                                │  │
│  │ ✓ Age verification required                             │  │
│  │ ✓ Motivation letter 50-1000 chars                       │  │
│  │ ✓ Profile completeness checked                          │  │
│  │ ✓ Valid rejection reasons only                          │  │
│  │ ✓ "Other" reason requires explanation                   │  │
│  │ ✓ Info request cannot be empty                          │  │
│  │ ✓ Alert when > 72 hours waiting                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
              ↑ (call CRUD methods, pass validated data)
              ↓ (return data or error codes)
┌─────────────────────────────────────────────────────────────────┐
│                        DATA ACCESS LAYER                        │
│                        (Repository)                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ adminRepository.ts                                       │  │
│  │                                                          │  │
│  │ CRUD Operations (Supabase):                              │  │
│  │ • getApplications()      - SELECT with JOIN              │  │
│  │ • getApplicationById()   - SELECT single                 │  │
│  │ • getApplicationStats()  - COUNT & aggregate queries     │  │
│  │ • approveApplication()   - UPDATE status                 │  │
│  │ • rejectApplication()    - UPDATE status + notes         │  │
│  │ • requestMoreInfo()      - UPDATE status + request       │  │
│  │ • lockApplication()      - UPDATE ngo_reviewer_id        │  │
│  │ • releaseApplication()   - CLEAR ngo_reviewer_id         │  │
│  │                                                          │  │
│  │ No Business Logic Here - Only Database Operations        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                    ↑ (SQL queries)
                    ↓ (data/errors)
┌─────────────────────────────────────────────────────────────────┐
│                        DATABASE LAYER                           │
│                      (Supabase / PostgreSQL)                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ users table           applications table                 │  │
│  │ ├─ id                 ├─ id                             │  │
│  │ ├─ full_name          ├─ youth_id (FK users.id)        │  │
│  │ ├─ age                ├─ elderly_id (FK users.id)       │  │
│  │ ├─ occupation         ├─ motivation_letter              │  │
│  │ ├─ education          ├─ status                         │  │
│  │ ├─ location           ├─ ngo_reviewer_id (FK users.id)  │  │
│  │ ├─ avatar_url         ├─ ngo_notes                      │  │
│  │ ├─ age_verified       ├─ applied_at                     │  │
│  │ └─ created_at         └─ reviewed_at                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 📊 Data Flow - Approving an Application

```
USER INTERACTION
│
└─→ View: User clicks "Approve Application" button
    │
    ├─→ ApprovalModal opens (confirmation)
    │   └─→ User clicks "Confirm Approval"
    │
    └─→ AdminPage.handleApproveConfirm()
        │
        └─→ ViewModel: adminViewModel.approveApplication()
            │
            ├─→ [LOADING STATE] isApproving = true
            │
            └─→ Service: applicationService.approveApplication()
                │
                ├─→ validateReviewCriteria() [OPTIONAL WARNING]
                │   ├─→ Check age_verified: youth + elderly
                │   ├─→ Check motivation_letter length
                │   ├─→ Check profile completeness
                │   └─→ Return: { isValid, issues[] }
                │
                └─→ Repository: adminRepository.approveApplication()
                    │
                    └─→ Supabase: UPDATE applications SET
                        status = 'ngo_approved',
                        ngo_reviewer_id = admin_id,
                        reviewed_at = NOW()
                        WHERE id = app_id
                    │
                    └─→ Returns: Updated Application object
                │
                ├─→ [STATE UPDATE] selectedApplication.status = 'ngo_approved'
                ├─→ [STATE UPDATE] stats reloaded
                └─→ [STATE UPDATE] isApproving = false
            │
            └─→ View: ApprovalModal displays success
                ├─→ Shows approval summary
                ├─→ Lists next steps
                └─→ Options: Return to Queue or Review Next
```

## 📊 Data Flow - Rejecting with Reason

```
USER INTERACTION
│
└─→ View: User clicks "Reject Application" button
    │
    ├─→ RejectionModal opens
    │   ├─→ User selects reason (dropdown from service)
    │   ├─→ If reason="Other": additional textarea required
    │   ├─→ User optionally adds feedback
    │   └─→ Clicks "Confirm Rejection"
    │
    └─→ AdminPage.handleRejectConfirm(reason, feedback, notes)
        │
        └─→ ViewModel: adminViewModel.rejectApplication(reason, feedback+notes)
            │
            ├─→ [LOADING STATE] isRejecting = true
            │
            └─→ Service: applicationService.rejectApplication()
                │
                ├─→ Validate reason is in getRejectionReasons()
                ├─→ Validate if reason="Other": notes must not be empty
                │   └─→ Throw error if validation fails
                │
                └─→ Repository: adminRepository.rejectApplication()
                    │
                    └─→ Supabase: UPDATE applications SET
                        status = 'rejected',
                        ngo_reviewer_id = admin_id,
                        ngo_notes = 'Reason: {reason}\nFeedback: {notes}',
                        reviewed_at = NOW()
                        WHERE id = app_id
                    │
                    └─→ Returns: Updated Application
                │
                ├─→ [STATE UPDATE] selectedApplication.status = 'rejected'
                ├─→ [STATE UPDATE] stats reloaded
                └─→ [STATE UPDATE] isRejecting = false
            │
            └─→ View: Modal closes, returns to Queue
                ├─→ [NOTIFICATION SENT TO APPLICANT]
                │   └─→ Reason and feedback in notification
                └─→ ApplicationQueue reloaded
```

## 📊 Data Flow - Viewing Application List

```
USER INTERACTION
│
└─→ View: Component mounts or filters change
    │
    └─→ ViewModel: adminViewModel.loadApplications()
        │
        ├─→ Build filter query:
        │   ├─→ filter='pending' → status='pending_ngo_review'
        │   ├─→ filter='info_requested' → status='info_requested'
        │   ├─→ filter='locked' → ngo_reviewer_id IS NOT NULL
        │   └─→ filter='all' → no status filter
        │
        ├─→ Build sort: sortBy='oldest' → ORDER BY applied_at ASC
        │
        ├─→ Calculate offset: (currentPage-1) * itemsPerPage
        │
        ├─→ [LOADING STATE] isLoading = true
        │
        └─→ Service: applicationService.getApplications()
            │
            └─→ Repository: adminRepository.getApplications()
                │
                └─→ Supabase: SELECT applications.*,
                    youth: users!youth_fk(full_name, age, ...),
                    elderly: users!elderly_fk(full_name, age, ...)
                    WHERE (status filter applied)
                    ORDER BY applied_at (sort applied)
                    LIMIT 10 OFFSET {offset}
                │
                └─→ Returns: ApplicationWithProfiles[]
            │
            ├─→ [STATE UPDATE] applications = result
            ├─→ [STATE UPDATE] isLoading = false
            └─→ errorMessage = null
        │
        └─→ Parallel: Load stats
            │
            └─→ ViewModel: adminViewModel.loadStats()
                │
                └─→ Service: applicationService.getApplicationStats()
                    │
                    └─→ Repository: adminRepository.getApplicationStats()
                        │
                        ├─→ COUNT pending_ngo_review
                        ├─→ COUNT locked (ngo_reviewer_id NOT NULL)
                        ├─→ COUNT approved today
                        └─→ AVG waiting time (hours)
                        │
                        └─→ Returns: ApplicationStats
                    │
                    └─→ [STATE UPDATE] stats = result
            │
            └─→ View: observer() component re-renders
                ├─→ Reads adminViewModel.applications
                ├─→ Reads adminViewModel.stats
                ├─→ Renders ApplicationQueue with data
                └─→ [USER SEES] List of applications
```

## 🔄 Component Communication

```
ApplicationQueue.tsx
    │
    ├─→ Reads from: adminViewModel.applications[]
    ├─→ Reads from: adminViewModel.stats
    ├─→ Reads from: adminViewModel.filter
    ├─→ Reads from: adminViewModel.sortBy
    ├─→ Calls: adminViewModel.setFilter()
    ├─→ Calls: adminViewModel.setSortBy()
    ├─→ Calls: adminViewModel.loadApplications()
    ├─→ Calls: adminViewModel.loadStats()
    │
    └─→ Triggers: onSelectApplication(appId)
        │
        └─→ AdminPage.handleSelectApplication()
            │
            └─→ Calls: adminViewModel.selectApplication(appId)
                ├─→ Locks app (set ngo_reviewer_id)
                └─→ [STATE UPDATE] selectedApplication

ApplicationDetails.tsx
    │
    ├─→ Reads from: adminViewModel.selectedApplication
    ├─→ Reads from: adminViewModel.rejectionReasons
    ├─→ Calls: getWaitingTime(appliedAt)
    │
    └─→ Triggers: onDecision('approve'|'reject'|'request_info')
        │
        └─→ AdminPage.handleDecision()
            │
            ├─→ 'approve' → setShowApprovalModal(true)
            │
            ├─→ 'reject' → setShowRejectionModal(true)
            │
            └─→ 'request_info' → setShowRequestInfoModal(true)

ApprovalModal.tsx
    │
    ├─→ Reads from: adminViewModel.selectedApplication
    ├─→ Reads from: adminViewModel.isApproving
    │
    └─→ Triggers: onConfirm()
        │
        └─→ AdminPage.handleApproveConfirm()
            │
            ├─→ Calls: adminViewModel.approveApplication()
            ├─→ Closes modal
            └─→ Success notification

RejectionModal.tsx
    │
    ├─→ Reads from: adminViewModel.rejectionReasons
    ├─→ Reads from: adminViewModel.isRejecting
    │
    └─→ Triggers: onConfirm(reason, feedback, notes)
        │
        └─→ AdminPage.handleRejectConfirm()
            │
            ├─→ Calls: adminViewModel.rejectApplication()
            ├─→ Closes modal
            ├─→ Returns to queue
            └─→ Notification sent to applicant

RequestInfoModal.tsx
    │
    ├─→ Reads from: adminViewModel.isRequestingInfo
    │
    └─→ Triggers: onConfirm(infoNeeded, notes)
        │
        └─→ AdminPage.handleRequestInfoConfirm()
            │
            ├─→ Calls: adminViewModel.requestMoreInfo()
            ├─→ Closes modal
            ├─→ Returns to queue
            └─→ Notification sent to applicant
```

## ✨ State Management Flow (MobX)

```
┌─────────────────────────────────────────────────────────────┐
│ View Component (observer(Component))                        │
│ - Automatically subscribed to ViewModel observables         │
│ - Re-renders when ANY observable property changes          │
│ - No manual setState() or useEffect() needed               │
└─────────────────────────────────────────────────────────────┘
                            ↑ (subscribe)
                            ↓ (notify of changes)
┌─────────────────────────────────────────────────────────────┐
│ ViewModel (makeAutoObservable(this))                        │
│ - applications: [] (observable)                             │
│ - selectedApplication: null (observable)                    │
│ - isLoading: false (observable)                             │
│ - errorMessage: null (observable)                           │
│ - filter: 'pending' (observable)                            │
│ - sortBy: 'oldest' (observable)                             │
│ - Methods (automatically reactions):                        │
│   • loadApplications() → updates observable properties      │
│   • selectApplication() → updates observable state          │
│   • approveApplication() → updates observable state         │
└─────────────────────────────────────────────────────────────┘
     ↑ (view calls methods)
     ↓ (methods update observable state)

Example: When user changes filter
1. View: <button onClick={() => setFilter('pending')}>
2. ViewModel: setFilter('pending')
   - adminViewModel.filter = 'pending' (updates observable)
   - Effect: All @observer components re-render
3. View: Automatically calls loadApplications()
4. ViewModel: loadApplications() fetches data
   - adminViewModel.applications = [new data] (updates observable)
5. View: Re-renders with new applications
   - All happens automatically! No useState, useEffect needed
```

---

**Note**: This MVVM architecture ensures:
- ✅ Views never contain business logic
- ✅ Clear separation of concerns
- ✅ Easy to test (mock Service/Repository)
- ✅ Reusable across platforms (web, mobile)
- ✅ Automatic UI updates via MobX reactivity
