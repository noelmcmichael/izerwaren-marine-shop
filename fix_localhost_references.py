#!/usr/bin/env python3
"""
Systematic fix for localhost references in frontend components
"""

import os
import re
from pathlib import Path

def fix_file(file_path, fixes_applied):
    """Fix localhost references in a single file"""
    with open(file_path, 'r') as f:
        content = f.read()
    
    original_content = content
    
    # Pattern 1: const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    pattern1 = r"const API_BASE_URL = process\.env\.NEXT_PUBLIC_API_URL \|\| ['\"]http://localhost:3001['\"];"
    replacement1 = "const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';"
    content = re.sub(pattern1, replacement1, content)
    
    # Pattern 2: hardcoded fetch('http://localhost:3001/health')
    pattern2 = r"fetch\(['\"]http://localhost:3001/health['\"]\)"
    replacement2 = "fetch('/api/health')"
    content = re.sub(pattern2, replacement2, content)
    
    # Pattern 3: any other localhost:3001 references
    pattern3 = r"['\"]http://localhost:3001([^'\"]*)['\"]"
    replacement3 = r"'/api\1'"
    content = re.sub(pattern3, replacement3, content)
    
    if content != original_content:
        with open(file_path, 'w') as f:
            f.write(content)
        fixes_applied.append(str(file_path))
        print(f"✅ Fixed: {file_path}")
        return True
    
    return False

def main():
    print("🔧 Fixing localhost references in frontend components")
    print("=" * 60)
    
    frontend_src = Path("/Users/noelmcmichael/Workspace/izerwaren_revamp_2_0/apps/frontend/src")
    fixes_applied = []
    
    # Find all TypeScript/JavaScript files
    for file_path in frontend_src.rglob("*.ts"):
        if "node_modules" in str(file_path) or ".next" in str(file_path):
            continue
        fix_file(file_path, fixes_applied)
    
    for file_path in frontend_src.rglob("*.tsx"):
        if "node_modules" in str(file_path) or ".next" in str(file_path):
            continue
        fix_file(file_path, fixes_applied)
    
    print(f"\n✅ Fixed {len(fixes_applied)} files:")
    for file_path in fixes_applied:
        print(f"  • {file_path}")
    
    if not fixes_applied:
        print("ℹ️  No localhost references found to fix")
    
    print("\n🎯 Next: Test locally and deploy")

if __name__ == "__main__":
    main()