import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    collection,
    addDoc,
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
            () => {

                alert(
                    "Quest completion engine coming next! ⚔️"
                );

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