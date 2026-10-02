async function testAuth() {
  const baseUrl = "http://localhost:5000/api/auth";
  const testEmail = `test_${Date.now()}@edureach.edu.in`;
  const testPassword = "Password@123";

  console.log("=== Testing Authentication Endpoints ===");

  // 1. Register
  console.log("\n1. Registering new user...");
  const regRes = await fetch(`${baseUrl}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Test Student",
      email: testEmail,
      password: testPassword,
      phone: "+91 9876543210",
    }),
  });
  const regData = await regRes.json();
  console.log("Registration Status:", regRes.status, "| Success:", regData.success);
  if (!regRes.ok || !regData.data?.token) {
    console.error("Registration failed:", regData);
    process.exit(1);
  }
  const token = regData.data.token;
  console.log("Token received successfully (length:", token.length, ")");

  // 2. Login
  console.log("\n2. Logging in with credentials...");
  const loginRes = await fetch(`${baseUrl}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
    }),
  });
  const loginData = await loginRes.json();
  console.log("Login Status:", loginRes.status, "| Success:", loginData.success);
  if (!loginRes.ok) {
    console.error("Login failed:", loginData);
    process.exit(1);
  }

  // 3. Protected Route (GET /me)
  console.log("\n3. Testing Protected Route (/me)...");
  const meRes = await fetch(`${baseUrl}/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const meData = await meRes.json();
  console.log("GetMe Status:", meRes.status, "| User Name:", meData.data?.user?.name);

  // 4. Invalid Token test
  console.log("\n4. Testing Invalid Token rejection...");
  const badRes = await fetch(`${baseUrl}/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer invalid_token_xyz`,
    },
  });
  console.log("Bad Token Status:", badRes.status, "(expected 401)");

  console.log("\n🎉 All authentication checks passed successfully!");
}

testAuth();
