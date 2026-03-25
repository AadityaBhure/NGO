// ===== SUPABASE CONFIG =====
const SUPABASE_URL = "https://fyovusytzrdvgvgpwutk.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5b3Z1c3l0enJkdmd2Z3B3dXRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0Mzk0MzUsImV4cCI6MjA5MDAxNTQzNX0.3nRYLbQCZr7d27FEaMi1ih8UKkz16sutWxcxR3gg_jk";

// ✅ Correct way for Supabase v2
const { createClient } = supabase;
const client = createClient(SUPABASE_URL, SUPABASE_KEY);

// ===== SIGNUP =====
async function signup() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    alert("Please fill all fields");
    return;
  }

  const { error } = await client.auth.signUp({
    email,
    password,
  });

  if (error) {
    alert(error.message);
  } else {
    alert("Signup successful!");
    window.location.href = "index.html";
  }
}

// ===== LOGIN =====
async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    alert("Please fill all fields");
    return;
  }

  const { error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    alert(error.message);
  } else {
    window.location.href = "dashboard.html";
  }
}

// ===== LOGOUT =====
async function logout() {
  await client.auth.signOut();
  window.location.href = "index.html";
}

// ===== PROTECT DASHBOARD =====
async function checkUser() {
  const { data } = await client.auth.getUser();

  if (!data.user) {
    window.location.href = "index.html";
  }
}

// FETCH PROFILE
async function loadProfile() {
  const { data: userData } = await client.auth.getUser();
  if (!userData.user) return;

  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("id", userData.user.id)
    .maybeSingle(); // 🔥 CHANGE HERE

  if (error) {
    console.log(error);
    return;
  }

  // 👇 If profile doesn't exist → create it
  if (!data) {
    await client.from("profiles").insert({
      id: userData.user.id,
      email: userData.user.email,
    });

    return loadProfile(); // retry
  }

  document.getElementById("emailDisplay").innerText = data.email;
  document.getElementById("nameDisplay").innerText =
    data.name || "No name set";
}

// UPDATE PROFILE
async function updateProfile() {
  const name = document.getElementById("nameInput").value;

  const { data: userData } = await client.auth.getUser();

  if (!userData.user) return;

  const { error } = await client
    .from("profiles")
    .update({ name: name })
    .eq("id", userData.user.id);

  if (error) {
    alert(error.message);
  } else {
    alert("Profile updated!");
    loadProfile();
  }
}