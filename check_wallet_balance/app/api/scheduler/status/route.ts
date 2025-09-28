import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '../../../../lib/auth';
import { dynamicScheduler } from '../../../../lib/dynamicScheduler';
import connectDB from '../../../../lib/db';
import { User } from '../../../../models/User';
import { BalanceHistory } from '../../../../models/BalanceHistory';

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await connectDB();

    // Get user details
    const user = await User.findById(decoded.userId).select('autoUpdate updateFrequency monthlyUpdateDay emailNotifications');
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get scheduler task info
    const taskInfo = dynamicScheduler.getTaskInfo();
    const userTask = taskInfo.find(task => task.userId === decoded.userId);

    // Get recent balance history for this user
    const recentHistory = await BalanceHistory.find({ userId: decoded.userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('createdAt updateType balance');

    // Calculate next update time (approximate)
    let nextUpdateTime = null;
    if (user.autoUpdate && user.updateFrequency) {
      const now = new Date();
      switch (user.updateFrequency) {
        case 'daily':
          nextUpdateTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          break;
        case 'every-3-days':
          nextUpdateTime = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
          break;
        case 'every-5-days':
          nextUpdateTime = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
          break;
        case 'weekly':
          const nextSunday = new Date(now);
          nextSunday.setDate(now.getDate() + (7 - now.getDay()));
          nextSunday.setHours(9, 0, 0, 0);
          nextUpdateTime = nextSunday;
          break;
        case 'bi-weekly':
          const nextBiWeekly = new Date(now);
          nextBiWeekly.setDate(now.getDate() + (14 - (now.getDay() % 14)));
          nextBiWeekly.setHours(9, 0, 0, 0);
          nextUpdateTime = nextBiWeekly;
          break;
        case 'monthly':
          const nextMonth = new Date(now);
          if (now.getDate() > user.monthlyUpdateDay) {
            nextMonth.setMonth(now.getMonth() + 1);
          }
          nextMonth.setDate(user.monthlyUpdateDay);
          nextMonth.setHours(9, 0, 0, 0);
          nextUpdateTime = nextMonth;
          break;
      }
    }

    const status = {
      isScheduled: user.autoUpdate && !!userTask?.isActive,
      isAutoUpdateEnabled: user.autoUpdate,
      isEmailNotificationsEnabled: user.emailNotifications,
      updateFrequency: user.updateFrequency,
      monthlyUpdateDay: user.monthlyUpdateDay,
      nextUpdateTime,
      taskDetails: userTask || null,
      recentActivity: recentHistory.map(history => ({
        timestamp: history.createdAt,
        updateType: history.updateType,
        totalBalance: history.balance?.total || 0,
      })),
      schedulerInfo: {
        totalActiveTasks: taskInfo.filter(task => task.isActive).length,
        allTasks: taskInfo.length,
      }
    };

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error('Scheduler status error:', error);
    return NextResponse.json({ 
      error: 'Failed to get scheduler status' 
    }, { status: 500 });
  }
}