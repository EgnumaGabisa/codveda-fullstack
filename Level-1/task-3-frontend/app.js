const API_URL = "http://localhost:4000/api/campaigns";
const form = document.getElementById("campaign-form");
const listEl = document.getElementById("campaign-list");
const feedbackEl = document.getElementById("feedback");

async function loadCampaigns() {
  feedbackEl.textContent = "Loading campaigns...";
  const res = await fetch(API_URL);
  const json = await res.json();
  renderList(json.data || []);
  feedbackEl.textContent = "";
}

function renderList(items) {
  listEl.innerHTML = "";
  items.forEach((item) => {
    const li = document.createElement("li");
    li.className = "item";
    li.innerHTML = `
      <div>
        <strong>${item.title}</strong>
        <div class="meta">Channel: ${item.channel} | Status: ${item.status}</div>
      </div>
      <div class="actions">
        <button onclick="toggleStatus(${item.id}, '${item.status}')">Next Status</button>
        <button class="delete-btn" onclick="deleteCampaign(${item.id})">Delete</button>
      </div>
    `;
    listEl.appendChild(li);
  });
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = document.getElementById("title").value;
  const channel = document.getElementById("channel").value;
  const status = document.getElementById("status").value;
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, channel, status }),
  });
  const data = await res.json();
  if (!res.ok) {
    feedbackEl.textContent = data.error || "Error creating campaign";
    return;
  }
  form.reset();
  loadCampaigns();
});

async function toggleStatus(id, current) {
  const next = current === "planned" ? "active" : current === "active" ? "completed" : "planned";
  await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: next }),
  });
  loadCampaigns();
}

async function deleteCampaign(id) {
  await fetch(`${API_URL}/${id}`, { method: "DELETE" });
  loadCampaigns();
}

loadCampaigns();
