const { createClient } = require('@supabase/supabase-js');

// You need to get these from your environment variables or Supabase dashboard
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY';

// Create admin client with service role key
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function resetPassword() {
  try {
    // Reset password for alex@robo.tech
    const newPassword = 'NewSecurePassword123!'; // Change this to your desired password
    
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      // First, we need to find the user ID by email
      // Let's get user by email first
    );

    // Alternative method: Update user by email (if supported)
    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: 'alex@robo.tech'
    });

    if (updateError) {
      console.error('Error generating recovery link:', updateError);
      return;
    }

    console.log('Password recovery link generated successfully');
    console.log('Send this link to the user:', updateData.properties.action_link);

  } catch (error) {
    console.error('Error:', error);
  }
}

// Alternative: Direct password reset (requires user ID)
async function resetPasswordById(userId, newPassword) {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword
    });

    if (error) {
      console.error('Error updating password:', error);
      return;
    }

    console.log('Password updated successfully for user:', userId);
    console.log('New password:', newPassword);

  } catch (error) {
    console.error('Error:', error);
  }
}

// Function to find user by email and get their ID
async function findUserByEmail(email) {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      console.error('Error listing users:', error);
      return null;
    }

    const user = data.users.find(u => u.email === email);
    return user ? user.id : null;
  } catch (error) {
    console.error('Error finding user:', error);
    return null;
  }
}

// Main execution
async function main() {
  console.log('Finding user alex@robo.tech...');
  const userId = await findUserByEmail('alex@robo.tech');
  
  if (!userId) {
    console.error('User not found: alex@robo.tech');
    return;
  }

  console.log('Found user ID:', userId);
  
  // Reset password
  const newPassword = 'P@ssw0rd123!'; // Change this to your desired password
  await resetPasswordById(userId, newPassword);
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { resetPasswordById, findUserByEmail };
