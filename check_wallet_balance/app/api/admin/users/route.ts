import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User, Wallet } from '@/models';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

// GET /api/admin/users - Get all users (admin only)
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

    // Check if user is admin
    const currentUser = await User.findById(decoded.userId);
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 });
    }

    // Get all users with basic info
    const users = await User.find({}, {
      password: 0, // Exclude password
      verificationToken: 0,
      resetPasswordToken: 0,
      resetPasswordExpires: 0
    }).sort({ createdAt: -1 });

    // Get wallet counts for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const walletCount = await Wallet.countDocuments({ userId: user._id });
        return {
          ...user.toObject(),
          walletCount,
          lastActive: user.updatedAt,
        };
      })
    );

    return NextResponse.json({ users: usersWithStats });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// PUT /api/admin/users - Update user (admin only)
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

    // Check if user is admin
    const currentUser = await User.findById(decoded.userId);
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, updates } = body;

    if (!userId || !updates) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Prevent admins from changing their own role to user if they're the only admin
    if (updates.role === 'user' && userId === currentUser._id.toString()) {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount === 1) {
        return NextResponse.json({ 
          error: 'Cannot remove admin role. At least one admin must exist.' 
        }, { status: 400 });
      }
    }

    const allowedUpdates = ['name', 'email', 'role', 'isVerified', 'emailNotifications'];
    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj: any, key) => {
        obj[key] = updates[key];
        return obj;
      }, {});

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      filteredUpdates,
      { new: true, select: '-password -verificationToken -resetPasswordToken -resetPasswordExpires' }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Failed to update user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE /api/admin/users - Delete user (admin only)
export async function DELETE(request: NextRequest) {
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

    // Check if user is admin
    const currentUser = await User.findById(decoded.userId);
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Prevent admins from deleting themselves if they're the only admin
    if (userId === currentUser._id.toString()) {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount === 1) {
        return NextResponse.json({ 
          error: 'Cannot delete the last admin account.' 
        }, { status: 400 });
      }
    }

    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete all user's wallets and related data
    await Wallet.deleteMany({ userId });
    
    // Delete the user
    await User.findByIdAndDelete(userId);

    return NextResponse.json({ message: 'User and all associated data deleted successfully' });
  } catch (error) {
    console.error('Failed to delete user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}