# Quick Start Guide - Admin Application Review System

## 🚀 Quick Setup (5 minutes)

### Step 1: Verify Dependencies
Ensure these packages are installed in `View/Web/package.json`:
```json
{
  "dependencies": {
    "react": "^18.0.0",
    "mobx": "^6.0.0",
    "mobx-react-lite": "^4.0.0",
    "@supabase/supabase-js": "^2.0.0"
  }
}
```

Install if needed:
```bash
npm install mobx mobx-react-lite
```

### Step 2: Set Environment Variables
Create `.env.local` in `View/Web/`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

### Step 3: Import AdminPage
In `View/Web/src/main.tsx` or your app routing:
```typescript
import { AdminPage } from './AdminUI';

// Add to your router/app
<Route path="/admin/applications" element={<AdminPage />} />
```

### Step 4: Test
Navigate to http://localhost:5173/admin/applications

## 📁 File Locations

| Layer | Location | Files |
|-------|----------|-------|
| **View (UI)** | `View/Web/src/AdminUI/` | 6 TSX + 6 CSS files |
| **ViewModel** | `ViewModel/AdminViewModel/` | `AdminViewModel.ts` |
| **Service** | `Model/Service/CoreService/` | `applicationService.ts` |
| **Repository** | `Model/Repository/AdminRepository/` | `adminRepository.ts` |

## 🔄 Data Flow Example: Approving an Application

```
1. User clicks "Approve Application" button
   ↓
2. ApprovalModal opens (confirmation)
   ↓
3. User clicks "Confirm Approval"
   ↓
4. AdminPage calls: adminViewModel.approveApplication()
   ↓
5. ViewModel calls: applicationService.approveApplication()
   ↓
6. Service validates & calls: adminRepository.approveApplication()
   ↓
7. Repository executes Supabase update
   ↓
8. ViewModel updates selectedApplication.status = 'ngo_approved'
   ↓
9. ApprovalModal shows success summary
   ↓
10. View automatically re-renders (MobX observer)
```

## 🎯 Common Tasks

### Load Applications with Filter
```typescript
import { adminViewModel } from '@/ViewModel/AdminViewModel';

// Filter to pending only
adminViewModel.setFilter('pending');

// Sort newest first
adminViewModel.setSortBy('newest');

// Load the data
await adminViewModel.loadApplications();

// Access in view
{adminViewModel.applications.map(app => (...))}
```

### Check Application Details
```typescript
// Select (locks) an application
await adminViewModel.selectApplication(appId);

// Access the data
const app = adminViewModel.selectedApplication;
console.log(app.youth.full_name);
console.log(app.motivation_letter);
```

### Handle Errors
```typescript
if (adminViewModel.errorMessage) {
  // Show error in UI
  <div className="error">{adminViewModel.errorMessage}</div>
}

// Check loading state
{adminViewModel.isLoading && <div>Loading...</div>}
```

### Approve Application
```typescript
await adminViewModel.approveApplication('Optional admin notes here');

// App status is now updated
// Success modal displays with summary
```

### Reject with Reason
```typescript
const reason = 'Insufficient motivation letter';
const feedback = 'Please provide more details about your interests...';

await adminViewModel.rejectApplication(reason, feedback);

// Applicant gets notification with feedback
```

### Request More Information
```typescript
const infoNeeded = 'Please provide: current employment status, references, availability';
const notes = 'We need this by end of week';

await adminViewModel.requestMoreInfo(infoNeeded, notes);

// Applicant notified with detailed request
```

## 🧪 Testing Individual Components

### Test ApplicationQueue Alone
```typescript
import { ApplicationQueue } from '@/AdminUI/ApplicationQueue';

export default function TestQueue() {
  return (
    <ApplicationQueue 
      onSelectApplication={(appId) => console.log('Selected:', appId)} 
    />
  );
}
```

### Test ApplicationDetails Alone
```typescript
import { ApplicationDetails } from '@/AdminUI/ApplicationDetails';
import { adminViewModel } from '@/ViewModel';

export default function TestDetails() {
  // Mock select an app first
  useEffect(() => {
    adminViewModel.selectApplication('app-id-123');
  }, []);

  return (
    <ApplicationDetails
      onBack={() => console.log('Back clicked')}
      onDecision={(action) => console.log('Decision:', action)}
    />
  );
}
```

## 🎨 Customize Colors

Edit `ApplicationQueue.css`, `ApplicationDetails.css`:

```css
/* Change primary color from teal to blue */
:root {
  --primary-color: #2196F3; /* was #9DE2D0 */
}

/* Then update all references */
.filter-btn.active {
  background-color: #2196F3; /* was #9DE2D0 */
}
```

## 📊 Debug ViewModel State

```typescript
// In any React component
import { adminViewModel } from '@/ViewModel/AdminViewModel';

export function DebugPanel() {
  return (
    <pre>
      {JSON.stringify({
        applicationsCount: adminViewModel.applications.length,
        selectedAppId: adminViewModel.selectedApplication?.id,
        isLoading: adminViewModel.isLoading,
        errorMessage: adminViewModel.errorMessage,
        filter: adminViewModel.filter,
        sortBy: adminViewModel.sortBy,
        stats: adminViewModel.stats,
      }, null, 2)}
    </pre>
  );
}
```

## ⚠️ Common Issues & Fixes

### Issue: Applications not loading
**Solution**: 
```typescript
// Ensure admin ID is set
import { adminViewModel } from '@/ViewModel';

adminViewModel.setCurrentAdminId('admin-001'); // Must be set before loading
await adminViewModel.loadApplications();
```

### Issue: Supabase connection error
**Solution**: Check `.env.local` has correct credentials
```bash
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

### Issue: Modal not showing
**Solution**: Verify state is passed correctly
```typescript
<ApprovalModal
  isOpen={showApprovalModal}
  onClose={() => setShowApprovalModal(false)}
  onConfirm={handleApproveConfirm}
/>
```

### Issue: ViewModel not updating UI
**Solution**: Ensure component is wrapped with `observer()`
```typescript
import { observer } from 'mobx-react-lite';

export const MyComponent = observer(() => {
  // Now component reactively updates when ViewModel changes
  return <div>{adminViewModel.applications.length}</div>;
});
```

## 📱 Mobile Responsive

The UI automatically adapts:
- **Desktop (>1200px)**: Sidebar + main content (2 columns)
- **Tablet (768-1200px)**: Sidebar collapses to horizontal filters
- **Mobile (<768px)**: Single column, full-width components

To test:
```bash
# Chrome DevTools: Ctrl+Shift+M for device toolbar
# Firefox: Ctrl+Shift+M for responsive design mode
```

## 🔗 Related Use Cases

This implementation is UC500. Related cases:

| UC | Name | Status |
|-----|------|--------|
| UC1 | Admin Login | ✅ Dependencies ready |
| UC400 | Relationship Dashboard | 🔄 Can reuse pattern |
| UC401 | Reports & Safety | 🔄 Can reuse pattern |
| UC402 | Keyword Management | 🔄 Can reuse pattern |

## 📚 Full Documentation

See: `View/Web/src/AdminUI/README.md` for complete architecture details

## ✅ Ready to Deploy?

Before production:

- [ ] Environment variables configured
- [ ] Supabase tables verified (users, applications)
- [ ] Auth system integrated
- [ ] Notification system connected
- [ ] Test all approve/reject/request flows
- [ ] Performance tested with large datasets
- [ ] Mobile tested on real devices
- [ ] Error handling verified
