# HomeSweetHome Troubleshooting Guide

This guide covers common issues and permanent solutions to prevent recurring TypeScript, dependency, and build problems.

## Table of Contents
1. [Folder Rename Recovery](#folder-rename-recovery)
2. [TypeScript "Cannot find module" Errors](#typescript-cannot-find-module-errors)
3. [React Version Conflicts](#react-version-conflicts)
4. [Native Module Issues in Expo Go](#native-module-issues-in-expo-go)
5. [Supabase Query Issues](#supabase-query-issues)
6. [Database Relationship Debugging](#database-relationship-debugging)

---

## Folder Rename Recovery

**Problem:** After renaming the root project folder, pnpm symlinks break, causing TypeScript and module resolution errors.

**Permanent Solution:**
```bash
# 1. Clean all node_modules and lock file
rm -rf node_modules pnpm-lock.yaml
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +

# 2. Reinstall all dependencies
pnpm install

# 3. Restart TypeScript server in VS Code
# Press Cmd+Shift+P → "TypeScript: Restart TS Server"
```

**Why it happens:** pnpm creates symlinks that contain absolute paths. When you rename the folder, these paths become invalid.

**Prevention:** Use version control and avoid renaming root folders. If you must rename, always run the cleanup script above.

---

## TypeScript "Cannot find module" Errors

**Problem:** TypeScript can't find installed packages like `mobx`, `@expo/vector-icons`, or custom workspace packages.

### Solution 1: Install in Correct Workspace

```bash
# For workspace-wide dependencies (shared by multiple packages)
pnpm add -w <package-name>

# For package-specific dependencies
pnpm --filter @home-sweet-home/mobile add <package-name>
pnpm --filter @home-sweet-home/viewmodel add <package-name>
pnpm --filter @home-sweet-home/model add <package-name>
```

**Examples:**
```bash
# MobX is used in ViewModel → install in ViewModel workspace
pnpm --filter @home-sweet-home/viewmodel add mobx

# @expo/vector-icons is used in Mobile → install in Mobile workspace
pnpm --filter @home-sweet-home/mobile add @expo/vector-icons

# React is used everywhere → install workspace-wide
pnpm add -w react@19.1.0
```

### Solution 2: Restart TypeScript Server

After installing packages, always restart the TypeScript language server:
- **VS Code:** Cmd+Shift+P → "TypeScript: Restart TS Server"
- **Terminal:** Close and reopen your editor

### Solution 3: Check tsconfig.json

Ensure all `tsconfig.json` files have:
```json
{
  "compilerOptions": {
    "skipLibCheck": true,  // Ignore type errors in node_modules
    "moduleResolution": "bundler"  // For Expo SDK 54+
  },
  "exclude": ["node_modules"]  // Don't scan dependencies
}
```

---

## React Version Conflicts

**Problem:** Multiple React versions installed, causing "Invalid Hook Call" or "Hooks can only be called inside function component" errors.

### Diagnosis

```bash
# Check which React versions are installed
pnpm why react

# Should show only ONE version (e.g., 19.1.0)
```

### Solution

```bash
# 1. Remove all React versions
pnpm remove react react-dom react-native -r

# 2. Install single version workspace-wide
pnpm add -w react@19.1.0 react-dom@19.1.0

# 3. Verify only one version exists
pnpm why react
```

**Note:** React Native has its own React version bundled. Always match your workspace React version to what React Native expects.

---

## Native Module Issues in Expo Go

**Problem:** App crashes with "ViewPropTypes is deprecated" or native module errors in Expo Go.

### Which Modules Don't Work in Expo Go?

- `expo-notifications` (requires native build)
- `expo-image` (advanced features)
- `agora-react-native-rtm` (video/audio)
- Any module with native code (C++, Swift, Kotlin)

### Solution 1: Use Development Build (Recommended)

```bash
# Build custom dev client with native modules
cd View/Mobile
expo run:android  # For Android
expo run:ios      # For iOS
```

**When to use:** When you need native modules or custom configuration.

### Solution 2: Lazy Loading (Temporary Workaround)

For development in Expo Go only:

```typescript
// ❌ DON'T: Top-level import (crashes in Expo Go)
import * as Notifications from 'expo-notifications';

// ✅ DO: Lazy load with require()
let _NotificationsModule: any = null;

function getNotifications() {
  if (!_NotificationsModule) {
    try {
      _NotificationsModule = require('expo-notifications');
    } catch (error) {
      console.warn('expo-notifications not available');
      return null;
    }
  }
  return _NotificationsModule;
}

// Then use it:
const Notifications = getNotifications();
if (Notifications) {
  Notifications.setNotificationHandler({ ... });
}
```

**Important:** This is only for development. Production builds should use dev-client.

---

## Supabase Query Issues

**Problem:** Queries return `null` even though data exists in database.

### Common Issues

#### 1. Using `.single()` instead of `.maybeSingle()`

```typescript
// ❌ WRONG: Throws error if no data
const { data } = await supabase
  .from("relationships")
  .select("*")
  .eq("user_id", userId)
  .single();  // Throws PGRST116 error if no match

// ✅ CORRECT: Returns null if no data
const { data } = await supabase
  .from("relationships")
  .select("*")
  .eq("user_id", userId)
  .maybeSingle();  // Returns null safely
```

#### 2. Incorrect `.or()` Filter Syntax

```typescript
// ❌ WRONG: Incorrect OR syntax
.or('youth_id', 'eq', userId)  // Invalid

// ✅ CORRECT: PostgREST OR syntax
.or(`youth_id.eq.${userId},elderly_id.eq.${userId}`)
```

#### 3. Not Handling Errors Properly

```typescript
// ❌ WRONG: Throws on "no rows" error
const { data, error } = await supabase.from("users").select("*").maybeSingle();
if (error) throw error;  // Bad! PGRST116 is normal for no data

// ✅ CORRECT: Only throw on real errors
const { data, error } = await supabase.from("users").select("*").maybeSingle();
if (error && error.code !== "PGRST116") {
  throw error;  // Only throw non-empty errors
}
return data;  // null is OK
```

### Debugging Supabase Queries

Always add debug logging:

```typescript
async getActiveRelationship(userId: string): Promise<Relationship | null> {
  console.debug("[Repository] Query START - userId:", userId);
  
  const { data, error } = await supabase
    .from("relationships")
    .select("*")
    .or(`youth_id.eq.${userId},elderly_id.eq.${userId}`)
    .eq("status", "active")
    .maybeSingle();
  
  console.debug("[Repository] Query RESULT - data:", data, "error:", error);
  
  if (error && error.code !== "PGRST116") throw error;
  return data;
}
```

---

## Database Relationship Debugging

**Problem:** Login redirects to wrong page because relationship query returns null.

### Debugging Steps

1. **Check Database Directly**

```sql
-- Run in Supabase SQL Editor
SELECT * FROM relationships 
WHERE (youth_id = '5a5bec24-b7e0-4ac5-b20a-fed884228a22' 
   OR elderly_id = '5a5bec24-b7e0-4ac5-b20a-fed884228a22')
  AND status IN ('active', 'paused');
```

2. **Check Repository Method Name**

```typescript
// ❌ WRONG: Only checks "active" relationships
const relationship = await relationshipService.getActiveRelationship(user.id);

// ✅ CORRECT: Checks both "active" and "paused"
const relationship = await relationshipService.getAnyRelationship(user.id);
```

3. **Verify Service → Repository Chain**

```typescript
// Service (relationshipService.ts)
async getAnyRelationship(userId: string): Promise<Relationship | null> {
  return userRepository.getAnyRelationship(userId);  // ✅ Correct method
}

// Repository (userRepository.ts)
async getAnyRelationship(userId: string): Promise<Relationship | null> {
  const { data } = await supabase
    .from("relationships")
    .select("*")
    .or(`youth_id.eq.${userId},elderly_id.eq.${userId}`)
    .in("status", ["active", "paused"])  // ✅ Both statuses
    .maybeSingle();
  return data;
}
```

### Login Redirect Logic

Correct order of checks:

```typescript
const handleLogin = async () => {
  const result = await authViewModel.signIn(email, password);
  const user = result.appUser;

  // 1. CHECK RELATIONSHIP (highest priority)
  const relationship = await relationshipService.getAnyRelationship(user.id);
  if (relationship) {
    if (relationship.status === "paused") {
      router.replace("/(main)/journey-pause");
      return;
    }
    if (relationship.status === "active") {
      router.replace("/(main)/bonding");  // ✅ Should go here
      return;
    }
  }

  // 2. CHECK PROFILE COMPLETION
  if (!user.profile_data?.profile_completed) {
    router.replace("/(auth)/profile-setup");
    return;
  }

  // 3. DEFAULT: GO TO MATCHING
  router.replace("/(main)/matching");
};
```

---

## Quick Reference Commands

```bash
# Diagnose dependency issues
pnpm why <package-name>

# Clean and reinstall everything
rm -rf node_modules pnpm-lock.yaml && pnpm install

# Install in specific workspace
pnpm --filter @home-sweet-home/mobile add <package>

# Install workspace-wide
pnpm add -w <package>

# Check TypeScript errors
pnpm --filter @home-sweet-home/mobile type-check

# Rebuild native modules
cd View/Mobile && expo run:android
```

---

## When to Use Which Installation Method

| Scenario | Command | Example |
|----------|---------|---------|
| Package used in ONE workspace | `pnpm --filter <workspace> add` | `pnpm --filter @home-sweet-home/mobile add @expo/vector-icons` |
| Package used in MULTIPLE workspaces | `pnpm add -w` | `pnpm add -w react mobx` |
| Dev dependency (testing, linting) | `pnpm add -D -w` | `pnpm add -D -w prettier@^3.0.0` |
| Update ALL workspaces | `pnpm update -r` | `pnpm update -r` |

---

## Prevention Checklist

- [ ] Always use `maybeSingle()` instead of `single()` for Supabase queries
- [ ] Add debug logging to all repository methods
- [ ] Use correct query method names (e.g., `getAnyRelationship` not `getActiveRelationship`)
- [ ] Keep `skipLibCheck: true` in all tsconfig.json files
- [ ] Use development build for native modules, not Expo Go
- [ ] Install dependencies in correct workspace (--filter vs -w)
- [ ] Restart TypeScript server after installing packages
- [ ] Test database queries directly in Supabase SQL Editor
- [ ] Check login redirect logic matches database state

---

## Still Having Issues?

1. Check VS Code Output panel → Select "TypeScript" → Look for actual error
2. Run `pnpm why <package-name>` to see dependency tree
3. Check Supabase logs for query errors
4. Add console.debug() at every step to trace execution
5. Verify database data matches expected structure
