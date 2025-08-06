/**
 * Vercel Deployment Validation Test
 * Tests the deployed site for the critical fixes we implemented
 */

const https = require('https');
const http = require('http');

async function testVercelDeployment(vercelUrl) {
    console.log('🔍 TESTING VERCEL DEPLOYMENT');
    console.log('='*50);
    console.log(`🌐 Testing URL: ${vercelUrl}`);
    console.log('');

    const tests = [
        {
            name: 'Homepage Load Test',
            path: '/',
            description: 'Verify main page loads without errors'
        },
        {
            name: 'Catalog Load Test', 
            path: '/catalog',
            description: 'Verify product catalog loads'
        },
        {
            name: 'API Health Check',
            path: '/api/health',
            description: 'Check if API endpoints are working'
        }
    ];

    const results = [];

    for (const test of tests) {
        console.log(`🧪 Running: ${test.name}`);
        try {
            const testUrl = `${vercelUrl}${test.path}`;
            const response = await fetchWithTimeout(testUrl, 10000);
            
            const result = {
                test: test.name,
                url: testUrl,
                status: response.status,
                success: response.status >= 200 && response.status < 400,
                description: test.description
            };

            results.push(result);
            
            if (result.success) {
                console.log(`   ✅ PASS: ${response.status} - ${test.description}`);
            } else {
                console.log(`   ❌ FAIL: ${response.status} - ${test.description}`);
            }
            
        } catch (error) {
            console.log(`   ⚠️  ERROR: ${error.message}`);
            results.push({
                test: test.name,
                success: false,
                error: error.message,
                description: test.description
            });
        }
        console.log('');
    }

    // Summary
    console.log('📊 TEST SUMMARY');
    console.log('='*30);
    const passed = results.filter(r => r.success).length;
    const total = results.length;
    console.log(`✅ Passed: ${passed}/${total}`);
    
    if (passed === total) {
        console.log('🎉 ALL TESTS PASSED! Deployment successful.');
        console.log('');
        console.log('🔧 NEXT STEPS:');
        console.log('1. Add NEXTAUTH_URL environment variable');
        console.log('2. Test image optimization fixes');
        console.log('3. Verify Shopify integration');
    } else {
        console.log('⚠️  Some tests failed. Check deployment logs.');
    }

    return results;
}

async function fetchWithTimeout(url, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const request = https.get(url, (response) => {
            resolve({
                status: response.statusCode,
                headers: response.headers
            });
        });

        request.on('error', reject);
        request.setTimeout(timeout, () => {
            request.destroy();
            reject(new Error(`Request timeout after ${timeout}ms`));
        });
    });
}

// Export for use
if (require.main === module) {
    const vercelUrl = process.argv[2];
    if (!vercelUrl) {
        console.log('Usage: node test_vercel_deployment.js <vercel-url>');
        console.log('Example: node test_vercel_deployment.js https://izerwaren-marine-shop-xyz.vercel.app');
        process.exit(1);
    }
    
    testVercelDeployment(vercelUrl);
}

module.exports = { testVercelDeployment };