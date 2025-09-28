import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/db';
import { User } from '../../../../models/User';
import { getTokenFromRequest, verifyToken } from '../../../../lib/auth';
import { updateUserSchedule } from '../../../../lib/dynamicScheduler';

export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const { name, email, emailNotifications, balanceThreshold, autoUpdate, updateFrequency, monthlyUpdateDay } = body;

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update user settings
    user.name = name || user.name;
    user.email = email || user.email;
    user.emailNotifications = emailNotifications !== undefined ? emailNotifications : user.emailNotifications;
    user.balanceThreshold = balanceThreshold !== undefined ? balanceThreshold : user.balanceThreshold;
    user.autoUpdate = autoUpdate !== undefined ? autoUpdate : user.autoUpdate;
    user.updateFrequency = updateFrequency || user.updateFrequency;
    user.monthlyUpdateDay = monthlyUpdateDay !== undefined ? monthlyUpdateDay : user.monthlyUpdateDay;

    await user.save();

    // Update user's scheduled tasks if frequency or auto-update settings changed
    try {
      await updateUserSchedule(decoded.userId);
      console.log(`✅ Updated schedule for user ${decoded.userId}`);
    } catch (scheduleError) {
      console.error('Failed to update user schedule:', scheduleError);
      // Don't fail the settings update if schedule update fails
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        emailNotifications: user.emailNotifications,
        balanceThreshold: user.balanceThreshold,
        autoUpdate: user.autoUpdate,
        updateFrequency: user.updateFrequency,
        monthlyUpdateDay: user.monthlyUpdateDay,
      },
    });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json({ 
      error: 'Failed to update settings' 
    }, { status: 500 });
  }
}