#!/usr/bin/env python3
"""
Fix static assets deployment issue and redeploy
"""
import subprocess
import time
import requests
import sys
from datetime import datetime

def run_command(cmd, cwd=None):
    """Run shell command and return result"""
    print(f"Running: {cmd}")
    result = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, text=True)
    if result.stdout:
        print(f"STDOUT: {result.stdout}")
    if result.stderr:
        print(f"STDERR: {result.stderr}")
    return result.returncode == 0, result.stdout, result.stderr

def main():
    project_root = "/Users/noelmcmichael/Workspace/izerwaren_revamp_2_0"
    frontend_dir = f"{project_root}/apps/frontend"
    
    print("🔧 FIXING STATIC ASSETS DEPLOYMENT")
    print("="*50)
    
    # Generate timestamp for unique image tag
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    image_name = f"gcr.io/noelmc/izerwaren-frontend-hotfix-fixed:{timestamp}"
    
    print(f"⏰ Timestamp: {timestamp}")
    print(f"🏗️ Building image: {image_name}")
    
    # Step 1: Build the corrected image
    print("\n📦 Building Docker image with fixed static asset paths...")
    success, stdout, stderr = run_command(
        f"docker build --platform linux/amd64 -f Dockerfile.hotfix -t {image_name} .",
        cwd=frontend_dir
    )
    
    if not success:
        print("❌ Failed to build Docker image")
        print(f"Error: {stderr}")
        return False
    
    print("✅ Docker image built successfully")
    
    # Step 2: Push to GCR
    print("\n🚀 Pushing to Google Container Registry...")
    success, stdout, stderr = run_command(f"docker push {image_name}")
    
    if not success:
        print("❌ Failed to push to GCR")
        print(f"Error: {stderr}")
        return False
    
    print("✅ Image pushed to GCR")
    
    # Step 3: Deploy to Cloud Run
    print("\n☁️ Deploying to Cloud Run...")
    deploy_cmd = f"""
    gcloud run deploy izerwaren-frontend-hotfix \\
        --image {image_name} \\
        --platform managed \\
        --region us-central1 \\
        --allow-unauthenticated \\
        --port 3000 \\
        --memory 1Gi \\
        --cpu 1 \\
        --max-instances 10 \\
        --set-env-vars NEXT_PUBLIC_API_URL=/api,NODE_ENV=production
    """
    
    success, stdout, stderr = run_command(deploy_cmd.strip())
    
    if not success:
        print("❌ Failed to deploy to Cloud Run")
        print(f"Error: {stderr}")
        return False
    
    print("✅ Deployed to Cloud Run")
    
    # Extract service URL
    service_url = None
    for line in stdout.split('\n'):
        if 'https://' in line and 'izerwaren-frontend-hotfix' in line:
            service_url = line.strip()
            break
    
    if not service_url:
        print("⚠️ Could not extract service URL, using default")
        service_url = "https://izerwaren-frontend-hotfix-ek4ht2g44a-uc.a.run.app"
    
    print(f"\n🌐 Service URL: {service_url}")
    
    # Step 4: Wait and test
    print("\n⏳ Waiting 30 seconds for deployment to stabilize...")
    time.sleep(30)
    
    # Test basic connectivity
    print(f"\n🧪 Testing service at {service_url}")
    try:
        response = requests.get(service_url, timeout=30)
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Service is responding")
            
            # Check if we get actual HTML content
            content = response.text
            if '<html' in content and '</html>' in content:
                print("✅ HTML content received")
                
                # Check for static asset references
                if '_next/static' in content:
                    print("✅ Static asset references found in HTML")
                else:
                    print("⚠️ No static asset references found")
                    
            else:
                print("⚠️ Response doesn't appear to be HTML")
                print(f"Content preview: {content[:200]}...")
        else:
            print(f"❌ Service returned {response.status_code}")
            print(f"Response: {response.text[:500]}")
            
    except Exception as e:
        print(f"❌ Failed to test service: {e}")
        return False
    
    print("\n" + "="*50)
    print("🎉 STATIC ASSETS FIX DEPLOYMENT COMPLETE")
    print(f"🌐 Test the fixed frontend at: {service_url}")
    print("💡 Static assets should now load correctly")
    print("🔍 Check browser console for any remaining 404 errors")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)