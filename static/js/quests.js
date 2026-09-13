import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    collection,
    addDoc,
    writeBatch,
    increment,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


let currentUser = null;

const questForm =
    document.getElementById("questForm");

const questList =
    document.getElementById("questList");

const questMessage =
    document.getElementById("questMessage");

const aiEstimateBtn =
    document.getElementById("aiEstimateBtn");


// =========================================
// AUTH
// =========================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "/login";

        return;
    }

    currentUser = user;

    await loadPlayerStats();

    await loadQuests();

});


// =========================================
// PLAYER STATS
// =========================================

async function loadPlayerStats() {

    try {

        const userRef =
            doc(
                db,
                "users",
                currentUser.uid
            );

        const snapshot =
            await getDoc(userRef);

        if (!snapshot.exists()) {

            return;
        }

        const data =
            snapshot.data();

        document.getElementById(
            "goldValue"
        ).textContent =
            data.gold || 0;

        document.getElementById(
            "streakValue"
        ).textContent =
            data.streak || 0;

    }

    catch (error) {

        console.error(
            "Player stats error:",
            error
        );

    }

}


// =========================================
// AI QUEST ESTIMATOR
// =========================================

if (aiEstimateBtn) {

    aiEstimateBtn.addEventListener(
        "click",
        async () => {

            const title =
                document
                    .getElementById("questTitle")
                    .value
                    .trim();

            const category =
                document
                    .getElementById("questCategory")
                    .value;


            if (!title) {

                showMessage(
                    "Enter a quest name first.",
                    true
                );

                document
                    .getElementById("questTitle")
                    .focus();

                return;
            }


            aiEstimateBtn.disabled = true;

            aiEstimateBtn.textContent =
                "🤖 ANALYZING...";


            const predictionReason =
                document.getElementById(
                    "predictionReason"
                );

            predictionReason.textContent =
                "AI is evaluating the effort required...";


            try {

                const response =
                    await fetch(
                        "/api/predict-quest",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({
                                    title,
                                    category
                                })
                        }
                    );


                const result =
                    await response.json();


                if (!result.available) {

                    predictionReason.textContent =
                        result.error ||
                        "AI prediction is currently unavailable.";

                    document.querySelector(
                        ".prediction-status"
                    ).textContent =
                        "LOCAL FALLBACK";

                    return;
                }


                // -------------------------
                // DIFFICULTY
                // -------------------------

                document.getElementById(
                    "predictedDifficulty"
                ).textContent =
                    result.difficulty
                        .toUpperCase();


                document.getElementById(
                    "questDifficulty"
                ).value =
                    result.difficulty;


                // -------------------------
                // XP
                // -------------------------

                document.getElementById(
                    "predictedXP"
                ).textContent =
                    result.xp;


                // -------------------------
                // GOLD
                // -------------------------

                document.getElementById(
                    "predictedGold"
                ).textContent =
                    result.gold;


                // -------------------------
                // REASON
                // -------------------------

                predictionReason.textContent =
                    result.reason;


                // Visual feedback

                const panel =
                    document.querySelector(
                        ".prediction-panel"
                    );

                if (panel) {

                    panel.classList.add(
                        "prediction-success"
                    );

                    setTimeout(() => {

                        panel.classList.remove(
                            "prediction-success"
                        );

                    }, 1000);

                }

            }

            catch (error) {

                console.error(
                    "AI prediction error:",
                    error
                );

                predictionReason.textContent =
                    "Unable to reach the AI service.";

            }

            finally {

                aiEstimateBtn.disabled =
                    false;

                aiEstimateBtn.textContent =
                    "✨ ANALYZE QUEST";

            }

        }
    );

}


// =========================================
// CREATE QUEST
// =========================================

if (questForm) {

    questForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            if (!currentUser) {

                return;
            }


            const title =
                document
                    .getElementById("questTitle")
                    .value
                    .trim();


            const category =
                document
                    .getElementById("questCategory")
                    .value;


            const difficulty =
                document
                    .getElementById("questDifficulty")
                    .value;


            const xp =
                parseInt(
                    document
                        .getElementById(
                            "predictedXP"
                        )
                        .textContent
                ) || 25;


            const gold =
                parseInt(
                    document
                        .getElementById(
                            "predictedGold"
                        )
                        .textContent
                ) || 5;


            if (!title) {

                showMessage(
                    "Quest name is required.",
                    true
                );

                return;
            }


            try {

                await addDoc(
                    collection(
                        db,
                        "quests"
                    ),
                    {

                        userId:
                            currentUser.uid,

                        title:
                            title,

                        category:
                            category,

                        difficulty:
                            difficulty,

                        xp:
                            xp,

                        gold:
                            gold,

                        completed:
                            false,

                        createdAt:
                            new Date().toISOString()

                    }
                );


                showMessage(
                    "QUEST CREATED ⚔️",
                    false
                );


                questForm.reset();


                // Reset prediction UI

                document.getElementById(
                    "predictedDifficulty"
                ).textContent =
                    "EASY";


                document.getElementById(
                    "questDifficulty"
                ).value =
                    "easy";


                document.getElementById(
                    "predictedXP"
                ).textContent =
                    "25";


                document.getElementById(
                    "predictedGold"
                ).textContent =
                    "5";


                document.getElementById(
                    "predictionReason"
                ).textContent =
                    "Add a clear quest title for a better prediction.";


                await loadQuests();

            }

            catch (error) {

                console.error(
                    "Quest creation failed:",
                    error
                );

                showMessage(
                    "Could not create quest.",
                    true
                );

            }

        }
    );

}


// =========================================
// LOAD QUESTS
// =========================================

async function loadQuests() {

    try {

        const q =
            query(
                collection(
                    db,
                    "quests"
                ),

                where(
                    "userId",
                    "==",
                    currentUser.uid
                )
            );


        const snapshot =
            await getDocs(q);


        questList.innerHTML = "";


        const quests =
            [];


        snapshot.forEach(
            (questDoc) => {

                quests.push({

                    id:
                        questDoc.id,

                    ...questDoc.data()

                });

            }
        );


        // Newest first

        quests.sort(
            (a, b) =>
                String(
                    b.createdAt || ""
                ).localeCompare(
                    String(
                        a.createdAt || ""
                    )
                )
        );


        const activeQuests =
            quests.filter(
                quest =>
                    !quest.completed
            );


        const count =
            document.getElementById(
                "questCount"
            );


        if (count) {

            count.textContent =
                `${activeQuests.length} QUEST${
                    activeQuests.length === 1
                        ? ""
                        : "S"
                }`;

        }


        if (activeQuests.length === 0) {

            questList.innerHTML = `

                <div class="no-quests">

                    ⚔️

                    <p>
                        No active quests.
                    </p>

                </div>

            `;

            return;
        }


        activeQuests.forEach(
            quest => {

                renderQuest(
                    quest
                );

            }
        );

    }

    catch (error) {

        console.error(
            "Quest loading failed:",
            error
        );

        questList.innerHTML = `

            <div class="no-quests">

                Unable to load quests.

            </div>

        `;

    }

}


// =========================================
// RENDER QUEST
// =========================================

function renderQuest(quest) {

    const card =
        document.createElement(
            "div"
        );


    card.className =
        "quest-card cut-panel";


    const difficultyStars =
        getDifficultyStars(
            quest.difficulty
        );


    card.innerHTML = `

        <span class="quest-category">

            ${escapeHTML(
                quest.category
            )}

        </span>


        <h3>

            ${escapeHTML(
                quest.title
            )}

        </h3>


        <div class="quest-rewards">

            <span class="quest-reward">

                ⚡ ${quest.xp} XP

            </span>

            <span class="quest-reward">

                🪙 ${quest.gold} Gold

            </span>

            <span class="quest-reward">

                ${difficultyStars}

            </span>

        </div>


        <div class="quest-actions">

            <button
                class="complete-quest-btn"
                data-id="${quest.id}">

                ⚔ COMPLETE

            </button>


            <button
                class="delete-quest-btn"
                data-id="${quest.id}">

                DELETE

            </button>

        </div>

    `;


    // Complete button

    card
        .querySelector(
            ".complete-quest-btn"
        )
        .addEventListener(
            "click",
            async (event) => {

                const button = event.currentTarget;

                button.disabled = true;
                button.textContent = "COMPLETING...";

                try {

                    const userRef = doc(
                        db,
                        "users",
                        currentUser.uid
                    );

                    const questRef = doc(
                        db,
                        "quests",
                        quest.id
                    );

                    const userSnapshot = await getDoc(userRef);
                    const latestQuest = await getDoc(questRef);

                    if (!userSnapshot.exists()) {
                        throw new Error("Player profile not found.");
                    }

                    if (!latestQuest.exists() || latestQuest.data().completed) {
                        await loadQuests();
                        return;
                    }

                    const player = userSnapshot.data();
                    const questXp = Number(latestQuest.data().xp) || 0;
                    const newXp = (Number(player.xp) || 0) + questXp;
                    let newLevel = Number(player.level) || 1;

                    while (
                        newXp >= Math.floor(100 * Math.pow(newLevel, 1.5))
                    ) {
                        newLevel += 1;
                    }

                    const category = String(
                        latestQuest.data().category || "discipline"
                    ).toLowerCase();

                    const attribute = [
                        "intelligence",
                        "strength",
                        "health",
                        "discipline",
                        "technology"
                    ].includes(category)
                        ? category
                        : "discipline";

                    const batch = writeBatch(db);

                    batch.update(questRef, {
                        completed: true,
                        completedAt: new Date().toISOString()
                    });

                    batch.update(userRef, {
                        xp: increment(questXp),
                        gold: increment(latestQuest.data().gold || 0),
                        streak: increment(1),
                        level: newLevel,
                        [attribute]: increment(1)
                    });

                    await batch.commit();
                    window.lifeRpgSounds?.play("questComplete");

                    if (newLevel > (Number(player.level) || 1)) {
                        window.lifeRpgSounds?.play("levelUp");
                        showLevelUpPopup(
                            newLevel,
                            questXp,
                            Number(latestQuest.data().gold) || 0
                        );
                    }

                    else {
                        showRewardPopup(
                            questXp,
                            Number(latestQuest.data().gold) || 0
                        );
                    }

                    showMessage("QUEST COMPLETE! REWARDS CLAIMED.", false);
                    await loadPlayerStats();
                    await loadQuests();

                }

                catch (error) {

                    console.error(
                        "Quest completion failed:",
                        error
                    );

                    button.disabled = false;
                    button.textContent = "⚔ COMPLETE";
                    showMessage("Could not complete quest.", true);

                }

            }
        );


    // Delete button

    card
        .querySelector(
            ".delete-quest-btn"
        )
        .addEventListener(
            "click",
            async () => {

                if (
                    !confirm(
                        "Delete this quest?"
                    )
                ) {

                    return;
                }


                try {

                    await deleteDoc(
                        doc(
                            db,
                            "quests",
                            quest.id
                        )
                    );


                    await loadQuests();

                }

                catch (error) {

                    console.error(
                        "Delete failed:",
                        error
                    );

                }

            }
        );


    questList.appendChild(
        card
    );

}


// =========================================
// DIFFICULTY STARS
// =========================================

function getDifficultyStars(
    difficulty
) {

    const value =
        String(
            difficulty || "easy"
        ).toLowerCase();


    if (value === "hard") {

        return "🔥🔥🔥 HARD";

    }


    if (value === "medium") {

        return "🔥🔥 MEDIUM";

    }


    return "🔥 EASY";

}


// =========================================
// MESSAGE
// =========================================

function showMessage(
    text,
    error
) {

    if (!questMessage) {

        return;
    }


    questMessage.textContent =
        text;


    questMessage.style.color =
        error
            ? "var(--danger)"
            : "var(--success)";


    setTimeout(
        () => {

            questMessage.textContent =
                "";

        },
        3000
    );

}


// =========================================
// HTML ESCAPE
// =========================================

function escapeHTML(text) {

    return String(text)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


// =========================================
// LOGOUT
// =========================================

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );


if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async () => {

            try {

                await signOut(auth);

                window.location.href =
                    "/login";

            }

            catch (error) {

                console.error(
                    "Logout failed:",
                    error
                );

            }

        }
    );

}


// =========================================
// CELEBRATION POPUPS
// =========================================

function showRewardPopup(
    xp,
    gold
) {

    const popup = document.createElement("div");

    popup.className = "reward-popup show";
    popup.innerHTML = `
        <div class="reward-content">
            <div class="reward-icon">⚔</div>
            <h2>QUEST COMPLETE</h2>
            <div class="reward-items">
                <span>+${xp} XP</span>
                <span>+${gold} GOLD</span>
            </div>
        </div>
    `;

    document.body.appendChild(popup);
    dismissPopup(popup);

}


function showLevelUpPopup(
    level,
    xp,
    gold
) {

    const popup = document.createElement("div");

    popup.className = "levelup-popup show";
    popup.innerHTML = `
        <div>
            <div class="levelup-icon">🏆</div>
            <h1>LEVEL UP</h1>
            <p>LEVEL ${level}</p>
            <p>+${xp} XP &bull; +${gold} GOLD</p>
            <button type="button">CONTINUE</button>
        </div>
    `;

    document.body.appendChild(popup);
    popup.querySelector("button").addEventListener(
        "click",
        () => dismissPopup(popup)
    );

}


function dismissPopup(
    popup
) {

    const close = () => {
        popup.classList.remove("show");
        setTimeout(
            () => popup.remove(),
            300
        );
    };

    popup.addEventListener(
        "click",
        (event) => {
            if (event.target === popup) close();
        }
    );

    setTimeout(
        close,
        3500
    );

}