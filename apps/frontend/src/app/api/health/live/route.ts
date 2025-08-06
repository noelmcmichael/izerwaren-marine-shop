import { NextResponse } from 'next/server';
import { config } from '@/lib/config';

/**
 * Kubernetes Liveness Probe Endpoint
 * 
 * This endpoint determines if the service is alive and functioning.
 * It performs basic checks to ensure the application hasn't deadlocked
 * or entered an unrecoverable state. Returns 200 OK if alive, 503 if not.
 */

interface LivenessCheck {
  alive: boolean;
  timestamp: string;
  checks: {
    process: boolean;
    memory: boolean;
    filesystem: boolean;
  };
  metrics: {
    uptime: number;
    memoryUsage: number;
    memoryLimit?: number;
    responseTime: number;
  };
  correlationId: string;
}

function generateCorrelationId(): string {
  return `live-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function checkProcess(): Promise<boolean> {
  try {
    // Basic process health - if we can execute this, process is alive
    return process.uptime() > 0;
  } catch {
    return false;
  }
}

async function checkMemory(): Promise<{ healthy: boolean; usage: number; limit?: number }> {
  try {
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    
    // Check if we're approaching memory limits (simple heuristic)
    // For Cloud Run, typical memory limits are 512Mi, 1Gi, 2Gi, etc.
    const memoryLimitMB = process.env.MEMORY_LIMIT 
      ? parseInt(process.env.MEMORY_LIMIT, 10) 
      : 512; // Default Cloud Run limit
    
    // Consider unhealthy if using more than 90% of available memory
    const memoryThreshold = memoryLimitMB * 0.9;
    const healthy = heapUsedMB < memoryThreshold;

    return {
      healthy,
      usage: heapUsedMB,
      limit: memoryLimitMB,
    };
  } catch {
    return {
      healthy: false,
      usage: 0,
    };
  }
}

async function checkFilesystem(): Promise<boolean> {
  try {
    // Basic filesystem check - ensure we can access the current working directory
    const fs = await import('fs/promises');
    await fs.access(process.cwd());
    return true;
  } catch {
    return false;
  }
}

export async function GET() {
  const startTime = Date.now();
  const correlationId = generateCorrelationId();

  try {
    // Run basic liveness checks
    const [processCheck, memoryCheck, filesystemCheck] = await Promise.allSettled([
      checkProcess(),
      checkMemory(),
      checkFilesystem(),
    ]);

    const processHealthy = processCheck.status === 'fulfilled' ? processCheck.value : false;
    const memoryResult = memoryCheck.status === 'fulfilled' 
      ? memoryCheck.value 
      : { healthy: false, usage: 0 };
    const filesystemHealthy = filesystemCheck.status === 'fulfilled' ? filesystemCheck.value : false;

    const checks = {
      process: processHealthy,
      memory: memoryResult.healthy,
      filesystem: filesystemHealthy,
    };

    // Service is alive if all basic checks pass
    const alive = checks.process && checks.memory && checks.filesystem;

    const responseTime = Date.now() - startTime;

    const livenessStatus: LivenessCheck = {
      alive,
      timestamp: new Date().toISOString(),
      checks,
      metrics: {
        uptime: Math.round(process.uptime()),
        memoryUsage: memoryResult.usage,
        memoryLimit: memoryResult.limit,
        responseTime,
      },
      correlationId,
    };

    return NextResponse.json(livenessStatus, {
      status: alive ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Correlation-ID': correlationId,
        'X-Liveness-Check-Duration': responseTime.toString(),
        'X-Alive': alive.toString(),
      },
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json(
      {
        alive: false,
        timestamp: new Date().toISOString(),
        checks: {
          process: false,
          memory: false,
          filesystem: false,
        },
        metrics: {
          uptime: 0,
          memoryUsage: 0,
          responseTime,
        },
        correlationId,
        error: error instanceof Error ? error.message : 'Liveness check failed',
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Correlation-ID': correlationId,
          'X-Liveness-Check-Duration': responseTime.toString(),
          'X-Alive': 'false',
        },
      }
    );
  }
}