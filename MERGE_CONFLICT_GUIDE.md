# Git Merge Conflict Prevention and Resolution Guide

## Overview

This guide helps prevent and resolve Git merge conflicts that can cause syntax errors in the AI-Powered Web Testing Agent application.

## The Problem

Unresolved Git merge conflicts can leave conflict markers in source files:
```javascript
<<<<<<< HEAD
// Your changes
=======
// Other changes
>>>>>>> branch-name
```

These markers cause syntax errors when Node.js tries to parse the JavaScript files.

## Prevention

### 1. Use the Conflict Detection Script

We've added a script that automatically checks for conflict markers:

```bash
# Check for conflicts manually
npm run check-conflicts

# Automatically check before starting the server
npm start
```

### 2. Best Practices for Merging

1. **Always pull latest changes before starting work:**
   ```bash
   git pull origin main
   ```

2. **Keep branches short-lived and frequently sync:**
   ```bash
   git fetch origin
   git rebase origin/main
   ```

3. **Use merge tools for complex conflicts:**
   ```bash
   git config --global merge.tool vscode
   git mergetool
   ```

## Resolution Steps

If you encounter the syntax error:
```
SyntaxError: Unexpected token '<<'
```

### Step 1: Identify Affected Files
```bash
# Find files with conflict markers
npm run check-conflicts

# Or manually search
grep -r "<<<<<<< HEAD" src/
```

### Step 2: Resolve Conflicts

For each file with conflicts:

1. **Open the file in your editor**
2. **Look for conflict markers:**
   - `<<<<<<< HEAD` - Start of your changes
   - `=======` - Separator
   - `>>>>>>> branch-name` - End of other changes

3. **Choose the correct code:**
   - Keep your changes, or
   - Keep the other changes, or
   - Combine both sets of changes

4. **Remove all conflict markers**

### Step 3: Verify the Fix
```bash
# Check syntax
node -c src/routes/test.js

# Check for remaining conflicts
npm run check-conflicts

# Test the application
npm start
```

### Step 4: Commit the Resolution
```bash
git add .
git commit -m "Resolve merge conflicts"
```

## Example Resolution

**Before (with conflict):**
```javascript
function generateTest() {
<<<<<<< HEAD
    return new TestCase(url);
=======
    return TestCase.fromUrl(url);
>>>>>>> feature-branch
}
```

**After (resolved):**
```javascript
function generateTest() {
    return TestCase.fromUrl(url);
}
```

## Automated Prevention

The application now includes:

1. **Pre-start hook:** Automatically checks for conflicts before starting the server
2. **Manual check command:** `npm run check-conflicts`
3. **Comprehensive scanning:** Checks all JavaScript, TypeScript, and JSON files

## Emergency Recovery

If the application won't start due to conflicts:

1. **Reset to last known good state:**
   ```bash
   git status
   git checkout -- src/routes/test.js  # Replace with affected file
   ```

2. **Or restore from stash:**
   ```bash
   git stash list
   git stash apply stash@{0}
   ```

3. **Re-apply your changes manually**

## Tools and Resources

- **VS Code Extension:** GitLens for better merge conflict visualization
- **Git Documentation:** https://git-scm.com/docs/git-merge
- **Interactive Tutorial:** https://learngitbranching.js.org/

## Need Help?

If you're still experiencing issues:

1. Run `npm run check-conflicts` for detailed conflict locations
2. Check the server logs for specific error messages
3. Verify all team members are following the same workflow

---

*This guide was created to prevent the syntax error: `SyntaxError: Unexpected token '<<'` that occurs when Git merge conflict markers are left unresolved in source files.*