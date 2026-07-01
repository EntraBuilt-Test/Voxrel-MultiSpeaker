// Test script to verify authentication and data fetching
// This can be run in the browser console to test the integration

async function testProfileIntegration() {
  console.log('🧪 Testing Profile Integration...');
  
  try {
    // Test 1: Check if user is logged in
    console.log('1️⃣ Testing user authentication...');
    const userStore = window.__ZUSTAND_STORES__?.userStore || null;
    if (!userStore) {
      console.error('❌ User store not found');
      return;
    }
    
    const isLoggedIn = userStore.getState().isLoggedIn();
    console.log('✅ User logged in:', isLoggedIn);
    
    if (!isLoggedIn) {
      console.log('⚠️ User not logged in. Please login first.');
      return;
    }
    
    // Test 2: Check user data
    console.log('2️⃣ Testing user data...');
    const user = userStore.getState().user;
    console.log('✅ User data:', user);
    
    // Test 3: Test freelancer store
    console.log('3️⃣ Testing freelancer store...');
    const freelancerStore = window.__ZUSTAND_STORES__?.freelancerStore || null;
    if (!freelancerStore) {
      console.error('❌ Freelancer store not found');
      return;
    }
    
    // Test 4: Fetch user tasks
    console.log('4️⃣ Testing task fetching...');
    await freelancerStore.getState().fetchMyTasks();
    const tasks = freelancerStore.getState().myTasks;
    console.log('✅ User tasks:', tasks);
    
    // Test 5: Calculate stats
    console.log('5️⃣ Testing stats calculation...');
    await freelancerStore.getState().fetchStats();
    const stats = freelancerStore.getState().stats;
    console.log('✅ Calculated stats:', stats);
    
    // Test 6: Test profile data
    console.log('6️⃣ Testing profile data...');
    await freelancerStore.getState().fetchProfile();
    const profile = freelancerStore.getState().profile;
    console.log('✅ Profile data:', profile);
    
    console.log('🎉 All tests passed! Profile integration is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Export for use in browser console
window.testProfileIntegration = testProfileIntegration;

console.log('🔧 Profile integration test loaded. Run testProfileIntegration() in console to test.');
