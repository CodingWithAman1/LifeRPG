import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const attributeNames = [
    "intelligence",
    "strength",
    "health",
    "discipline",
    "technology"
];

const achievementDefinitions = [
    {
        icon: "🗡️",
        name: "FIRST BLOOD",
        unlocked: (player, completed) => completed >= 1
    },
    {
        icon: "🔥",
        name: "ON FIRE",
        unlocked: (player) => (player.streak || 0) >= 7
    },
    {
        icon: "💻",
        name: "CODE WARRIOR",
        unlocked: (player, completed, technology) => technology >= 10
    },
    {
        icon: "⚡",
        name: "LEVEL FIVE",
        unlocked: (player) => (player.level || 1) >= 5
    }
];

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "/login";
        return;
    }

    try {
        const [player, quests] = await Promise.all([
            loadPlayer(user),
            loadUserQuests(user)
        ]);

        renderPlayer(user, player);
        renderQuests(quests);
        renderAchievements(player, quests);
    } catch (error) {
        console.error("Dashboard loading failed:", error);
        showDashboardError("Unable to load your RPG data. Check your Firestore rules and try again.");
    }
});

async function loadPlayer(user) {
    const snapshot = await getDoc(doc(db, "users", user.uid));
    return snapshot.exists() ? snapshot.data() : {};
}

async function loadUserQuests(user) {
    const snapshot = await getDocs(query(
        collection(db, "quests"),
        where("userId", "==", user.uid)
    ));

    return snapshot.docs.map((questDoc) => ({
        id: questDoc.id,
        ...questDoc.data()
    }));
}

function renderPlayer(user, player) {
    const level = player.level || 1;
    const xp = player.xp || 0;
    const xpRequired = Math.floor(100 * Math.pow(level, 1.5));

    setText("playerName", player.name || user.displayName || "Player");
    setText("levelValue", level);
    setText("xpValue", xp);
    setText("xpRequired", xpRequired);
    setText("goldValue", player.gold || 0);
    setText("streakValue", player.streak || 0);

    const progress = document.getElementById("xpProgress");
    if (progress) {
        progress.style.width = `${Math.min((xp / xpRequired) * 100, 100)}%`;
    }

    attributeNames.forEach((name) => {
        const value = player[name] || 1;
        setText(`${name}Value`, value);
        const bar = document.getElementById(`${name}Bar`);
        if (bar) bar.style.width = `${Math.min(value * 5, 100)}%`;
    });
}

function renderQuests(quests) {
    const list = document.getElementById("dashboardQuestList");
    if (!list) return;

    const activeQuests = quests.filter((quest) => !quest.completed).slice(0, 4);
    list.innerHTML = "";

    if (!activeQuests.length) {
        list.innerHTML = `<div class="dashboard-empty"><span>⚔</span><p>No active quests yet.</p><a href="/quests">Create a mission →</a></div>`;
        return;
    }

    activeQuests.forEach((quest) => {
        const item = document.createElement("div");
        item.className = "dashboard-quest";
        item.innerHTML = `
            <div><span>◆</span><div><strong>${escapeHTML(quest.title || "Untitled quest")}</strong><small>${escapeHTML(quest.category || "mission")}</small></div></div>
            <div class="quest-reward"><span>+${quest.xp || 0} XP</span><span>+${quest.gold || 0} G</span></div>
        `;
        list.appendChild(item);
    });
}

function renderAchievements(player, quests) {
    const list = document.getElementById("dashboardAchievements");
    if (!list) return;

    const completedQuests = quests.filter((quest) => quest.completed);
    const technologyQuests = completedQuests.filter((quest) =>
        String(quest.category || "").toLowerCase() === "technology"
    ).length;

    list.innerHTML = achievementDefinitions.map((achievement) => {
        const unlocked = achievement.unlocked(
            player,
            completedQuests.length,
            technologyQuests
        );

        return `
            <div class="dashboard-achievement ${unlocked ? "unlocked" : "locked"}">
                <span>${unlocked ? achievement.icon : "🔒"}</span>
                <div><strong>${achievement.name}</strong><small>${unlocked ? "UNLOCKED" : "LOCKED"}</small></div>
            </div>
        `;
    }).join("");
}

function showDashboardError(message) {
    ["dashboardQuestList", "dashboardAchievements"].forEach((id) => {
        const element = document.getElementById(id);
        if (element) element.innerHTML = `<div class="dashboard-empty"><p>${message}</p></div>`;
    });
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

function escapeHTML(value) {
    return String(value).replace(/[&<>'"]/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;"
    }[character]));
}

const logoutButton = document.getElementById("logoutBtn");
if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
        await signOut(auth);
        window.location.href = "/login";
    });
}
