#!/usr/bin/env node
/**
 * Secret Manager Development Script
 * 
 * Utility script for managing secrets during development and deployment.
 * Provides commands for creating, updating, and testing secrets.
 */

const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

class SecretManagerCLI {
    constructor() {
        this.client = null;
        this.projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID;
        
        // Secret configuration (matches secrets.ts)
        this.secretsConfig = {
            'izerwaren-db-password': {
                description: 'Database connection password',
                envVar: 'DB_PASSWORD'
            },
            'izerwaren-shopify-admin-token': {
                description: 'Shopify Admin API access token',
                envVar: 'SHOPIFY_ADMIN_ACCESS_TOKEN'
            },
            'izerwaren-shopify-webhook-secret': {
                description: 'Shopify webhook signing secret',
                envVar: 'SHOPIFY_WEBHOOK_SECRET'
            },
            'izerwaren-firebase-private-key': {
                description: 'Firebase Admin SDK private key',
                envVar: 'FIREBASE_PRIVATE_KEY'
            },
            'izerwaren-jwt-secret': {
                description: 'JWT signing secret',
                envVar: 'JWT_SECRET'
            }
        };
        
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }
    
    async init() {
        if (!this.projectId) {
            console.error('❌ No Google Cloud project ID found. Set GOOGLE_CLOUD_PROJECT or FIREBASE_PROJECT_ID environment variable.');
            return false;
        }
        
        try {
            this.client = new SecretManagerServiceClient();
            console.log(`🔐 Secret Manager CLI initialized for project: ${this.projectId}`);
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Secret Manager client:', error.message);
            console.log('💡 Make sure you have Google Cloud credentials configured.');
            return false;
        }
    }
    
    async createSecret(secretName, secretValue) {
        try {
            // Create the secret
            const [secret] = await this.client.createSecret({
                parent: `projects/${this.projectId}`,
                secretId: secretName,
                secret: {
                    replication: {
                        automatic: {},
                    },
                },
            });
            
            // Add the secret version
            const [version] = await this.client.addSecretVersion({
                parent: secret.name,
                payload: {
                    data: Buffer.from(secretValue, 'utf8'),
                },
            });
            
            console.log(`✅ Created secret: ${secretName}`);
            console.log(`   Version: ${version.name}`);
            return true;
        } catch (error) {
            if (error.code === 6) {
                console.log(`⚠️  Secret ${secretName} already exists, updating instead...`);
                return this.updateSecret(secretName, secretValue);
            } else {
                console.error(`❌ Failed to create secret ${secretName}:`, error.message);
                return false;
            }
        }
    }
    
    async updateSecret(secretName, secretValue) {
        try {
            const [version] = await this.client.addSecretVersion({
                parent: `projects/${this.projectId}/secrets/${secretName}`,
                payload: {
                    data: Buffer.from(secretValue, 'utf8'),
                },
            });
            
            console.log(`✅ Updated secret: ${secretName}`);
            console.log(`   Version: ${version.name}`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to update secret ${secretName}:`, error.message);
            return false;
        }
    }
    
    async getSecret(secretName) {
        try {
            const [version] = await this.client.accessSecretVersion({
                name: `projects/${this.projectId}/secrets/${secretName}/versions/latest`,
            });
            
            const payload = version.payload.data.toString('utf8');
            return payload;
        } catch (error) {
            console.error(`❌ Failed to get secret ${secretName}:`, error.message);
            return null;
        }
    }
    
    async listSecrets() {
        try {
            const [secrets] = await this.client.listSecrets({
                parent: `projects/${this.projectId}`,
            });
            
            console.log(`📋 Secrets in project ${this.projectId}:`);
            
            if (secrets.length === 0) {
                console.log('   No secrets found.');
                return;
            }
            
            for (const secret of secrets) {
                const secretName = secret.name.split('/').pop();
                const config = this.secretsConfig[secretName];
                
                console.log(`   • ${secretName}`);
                if (config) {
                    console.log(`     Description: ${config.description}`);
                    console.log(`     Environment variable: ${config.envVar}`);
                } else {
                    console.log(`     (Not configured in application)`);
                }
            }
        } catch (error) {
            console.error('❌ Failed to list secrets:', error.message);
        }
    }
    
    async setupFromEnv() {
        console.log('🔄 Setting up secrets from environment variables...');
        
        let created = 0;
        let skipped = 0;
        
        for (const [secretName, config] of Object.entries(this.secretsConfig)) {
            const envValue = process.env[config.envVar];
            
            if (envValue) {
                console.log(`Creating secret: ${secretName}`);
                const success = await this.createSecret(secretName, envValue);
                if (success) {
                    created++;
                }
            } else {
                console.log(`⚠️  Skipping ${secretName}: ${config.envVar} not set in environment`);
                skipped++;
            }
        }
        
        console.log(`\\n✅ Setup complete: ${created} secrets created, ${skipped} skipped`);
    }
    
    async interactive() {
        console.log('🔐 Interactive Secret Manager');
        console.log('Available commands:');
        console.log('  list     - List all secrets');
        console.log('  create   - Create a new secret');
        console.log('  update   - Update an existing secret');
        console.log('  get      - Get a secret value');
        console.log('  setup    - Create all secrets from environment variables');
        console.log('  exit     - Exit the CLI');
        console.log('');
        
        while (true) {
            const command = await this.prompt('Enter command: ');
            
            switch (command.toLowerCase()) {
                case 'list':
                    await this.listSecrets();
                    break;
                    
                case 'create':
                    await this.interactiveCreate();
                    break;
                    
                case 'update':
                    await this.interactiveUpdate();
                    break;
                    
                case 'get':
                    await this.interactiveGet();
                    break;
                    
                case 'setup':
                    await this.setupFromEnv();
                    break;
                    
                case 'exit':
                    console.log('👋 Goodbye!');
                    return;
                    
                default:
                    console.log('❌ Unknown command. Try: list, create, update, get, setup, or exit');
            }
            
            console.log('');
        }
    }
    
    async interactiveCreate() {
        console.log('\\nAvailable secrets to create:');
        const secrets = Object.keys(this.secretsConfig);
        secrets.forEach((name, index) => {
            const config = this.secretsConfig[name];
            console.log(`  ${index + 1}. ${name} - ${config.description}`);
        });
        
        const choice = await this.prompt('Enter number or secret name: ');
        const secretName = isNaN(choice) ? choice : secrets[parseInt(choice) - 1];
        
        if (!secretName || !this.secretsConfig[secretName]) {
            console.log('❌ Invalid secret name');
            return;
        }
        
        const value = await this.prompt('Enter secret value: ', true);
        await this.createSecret(secretName, value);
    }
    
    async interactiveUpdate() {
        await this.listSecrets();
        const secretName = await this.prompt('\\nEnter secret name to update: ');
        
        if (!this.secretsConfig[secretName]) {
            console.log('❌ Invalid secret name');
            return;
        }
        
        const value = await this.prompt('Enter new secret value: ', true);
        await this.updateSecret(secretName, value);
    }
    
    async interactiveGet() {
        await this.listSecrets();
        const secretName = await this.prompt('\\nEnter secret name to get: ');
        
        const value = await this.getSecret(secretName);
        if (value) {
            console.log(`Secret value: ${value}`);
        }
    }
    
    prompt(question, sensitive = false) {
        return new Promise((resolve) => {
            if (sensitive) {
                // Hide input for sensitive values
                this.rl.question(question, (answer) => {
                    resolve(answer);
                });
                this.rl.input.on('keypress', () => {
                    // Move cursor back and clear
                    process.stdout.write('\\b*');
                });
            } else {
                this.rl.question(question, resolve);
            }
        });
    }
    
    close() {
        this.rl.close();
    }
}

async function main() {
    const cli = new SecretManagerCLI();
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    const command = args[0];
    
    if (!await cli.init()) {
        process.exit(1);
    }
    
    try {
        switch (command) {
            case 'list':
                await cli.listSecrets();
                break;
                
            case 'setup':
                await cli.setupFromEnv();
                break;
                
            case 'create':
                if (args.length < 3) {
                    console.log('Usage: node secret-manager.js create <secret-name> <secret-value>');
                    process.exit(1);
                }
                await cli.createSecret(args[1], args[2]);
                break;
                
            case 'update':
                if (args.length < 3) {
                    console.log('Usage: node secret-manager.js update <secret-name> <secret-value>');
                    process.exit(1);
                }
                await cli.updateSecret(args[1], args[2]);
                break;
                
            case 'get':
                if (args.length < 2) {
                    console.log('Usage: node secret-manager.js get <secret-name>');
                    process.exit(1);
                }
                const value = await cli.getSecret(args[1]);
                if (value) {
                    console.log(value);
                }
                break;
                
            case 'interactive':
            case undefined:
                await cli.interactive();
                break;
                
            default:
                console.log('Usage: node secret-manager.js [command] [args]');
                console.log('Commands:');
                console.log('  list                              - List all secrets');
                console.log('  setup                             - Create secrets from environment variables');
                console.log('  create <name> <value>             - Create a new secret');
                console.log('  update <name> <value>             - Update an existing secret');
                console.log('  get <name>                        - Get a secret value');
                console.log('  interactive                       - Interactive mode');
                process.exit(1);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        cli.close();
    }
}

if (require.main === module) {
    main();
}

module.exports = SecretManagerCLI;