import { NextRequest, NextResponse } from 'next/server';
import { triggerBalanceUpdate, triggerMonthlyReport } from '../../../lib/scheduler';
import { initializeDynamicScheduler, updateUserSchedule, triggerManualUserUpdate } from '../../../lib/dynamicScheduler';
import { getTokenFromRequest, verifyToken } from '../../../lib/auth';

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { type } = body;

    switch (type) {
      case 'balance_update':
        await triggerManualUserUpdate(decoded.userId);
        return NextResponse.json({ 
          success: true, 
          message: 'Balance and transaction update triggered successfully' 
        });

      case 'monthly_report':
        await triggerMonthlyReport();
        return NextResponse.json({ 
          success: true, 
          message: 'Monthly report triggered successfully' 
        });

      case 'init_scheduler':
        await initializeDynamicScheduler();
        return NextResponse.json({ 
          success: true, 
          message: 'Dynamic scheduler initialized successfully' 
        });

      case 'update_user_schedule':
        await updateUserSchedule(decoded.userId);
        return NextResponse.json({ 
          success: true, 
          message: 'User schedule updated successfully' 
        });

      default:
        return NextResponse.json({ 
          error: 'Invalid trigger type. Use "balance_update", "monthly_report", "init_scheduler", or "update_user_schedule"' 
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Scheduler trigger error:', error);
    return NextResponse.json({ 
      error: 'Failed to trigger scheduler task' 
    }, { status: 500 });
  }
}