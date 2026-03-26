// ===== SUPABASE =====
const SUPABASE_URL = "https://fyovusytzrdvgvgpwutk.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5b3Z1c3l0enJkdmd2Z3B3dXRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0Mzk0MzUsImV4cCI6MjA5MDAxNTQzNX0.3nRYLbQCZr7d27FEaMi1ih8UKkz16sutWxcxR3gg_jk";

const { createClient } = supabase;
const client = createClient(SUPABASE_URL, SUPABASE_KEY);

// ===== AUTH =====
async function signup() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) return alert("Fill all fields");

  const { error } = await client.auth.signUp({ email, password });

  if (error) alert(error.message);
  else {
    alert("Signup successful");
    window.location.href = "index.html";
  }
}

async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  const { error } = await client.auth.signInWithPassword({ email, password });

  if (error) alert(error.message);
  else window.location.href = "dashboard.html";
}

async function logout() {
  await client.auth.signOut();
  window.location.href = "index.html";
}

// ===== INIT =====
async function initDashboard() {
  const { data } = await client.auth.getUser();

  if (!data.user) {
    window.location.href = "index.html";
    return;
  }

  const user = data.user;

  // 🔥 Get profile
  let { data: profile } = await client
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  // 🧠 Create if missing
  if (!profile) {
    await client.from("profiles").insert({
      id: user.id,
      email: user.email
    });

    profile = { name: null };
  }

  // Show name modal or welcome
  if (!profile.name) {
    document.getElementById("nameModal").style.display = "flex";
  } else {
    showWelcome(profile.name);
  }

  loadHistory();
}

// ===== NAME =====
async function saveName() {
  const name = document.getElementById("nameInput").value.trim();

  if (!name) return alert("Enter your name");

  const { data } = await client.auth.getUser();

  await client
    .from("profiles")
    .update({ name })
    .eq("id", data.user.id);

  document.getElementById("nameModal").style.display = "none";

  showWelcome(name);
}

// ===== WELCOME =====
function showWelcome(name) {
  document.getElementById("welcomeText").innerText =
    "Welcome, " + name + " 👋";
}

// ===== PREDICTION =====
let chartInstance = null;
let historyChartInstance = null;

function predictMentalHealth() {
  const age = document.getElementById("age").value;
  const gender = document.getElementById("gender").value;
  const stress = document.getElementById("stress").value;
  const sleep = document.getElementById("sleep").value;
  const anxiety = document.getElementById("anxiety").value;
  const mood = document.getElementById("mood").value.toLowerCase();

  if (!age || !gender || !stress || !sleep || !anxiety || !mood) {
    return alert("Fill all fields");
  }

  let score = 100;

  if (stress === "High") score -= 30;
  else if (stress === "Medium") score -= 15;

  if (anxiety === "High") score -= 25;
  else if (anxiety === "Medium") score -= 10;

  if (sleep < 5) score -= 25;
  else if (sleep < 7) score -= 10;

  if (mood.includes("sad") || mood.includes("angry")) score -= 20;
  if (mood.includes("happy")) score += 10;

  score = Math.max(0, Math.min(100, score));

  const label =
    score > 75 ? "Healthy" :
    score > 50 ? "Moderate" :
    "Needs Attention";

  renderChart(score, label);
  saveHistory(score);
}

// ===== CURRENT GRAPH =====
function renderChart(score, label) {
  const ctx = document.getElementById("chart");

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Score"],
      datasets: [{
        label: label,
        data: [score]
      }]
    },
    options: {
      scales: {
        y: { beginAtZero: true, max: 100 }
      }
    }
  });
}

// ===== SAVE HISTORY =====
async function saveHistory(score) {
  const { data } = await client.auth.getUser();

  await client.from("mental_history").insert({
    user_id: data.user.id,
    score: score
  });

  loadHistory();
}

// ===== HISTORY GRAPH =====
async function loadHistory() {
  const { data: userData } = await client.auth.getUser();

  const { data } = await client
    .from("mental_history")
    .select("score, created_at")
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: true });

  if (!data || data.length === 0) return;

  const labels = data.map(d =>
    new Date(d.created_at).toLocaleDateString()
  );

  const scores = data.map(d => d.score);

  const ctx = document.getElementById("historyChart");

  if (historyChartInstance) historyChartInstance.destroy();

  historyChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "History",
        data: scores
      }]
    }
  });
}