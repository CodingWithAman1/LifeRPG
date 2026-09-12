import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    doc,
    getDoc,
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


let currentUser = null;


// =================================
// ACHIEVEMENT DEFINITIONS
// =================================

const achievements = [

    {
        id: "first_blood",

        icon: "🗡️",

        name: "FIRST BLOOD",

        description:
            "Complete your first quest.",

        check: (player, quests) =>
            quests >= 1
    },


    {
        id: "on_fire",

        icon: "🔥",

        name: "ON FIRE",

        description:
            "Reach a 7 quest streak.",

        check: (player, quests) =>
            (player.streak || 0) >= 7
    },


    {
        id: "code_warrior",

        icon: "💻",

        name: "CODE WARRIOR",

        description:
            "Complete 10 Technology quests.",

        check: (player, quests, techQuests) =>
            techQuests >= 10
    },


    {
        id: "level_five",

        icon: "⚡",

        name: "LEVEL FIVE",

        description:
            "Reach Level 5.",

        check: (player) =>
            (player.level || 1) >= 5
    },


    {
        id: "legend",

        icon: "👑",

        name: "LEGEND",

        description:
            "Reach Level 10.",

        check: (player) =>
            (player.level || 1) >= 10
    }

];


// =================================
// AUTH
// =================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href =
            "/login";

        return;

    }


    currentUser = user;

    await loadAchievements(user);

});


// =================================
// LOAD DATA
// =================================

async function loadAchievements(user) {

    try {

        // PLAYER

        const userRef =
            doc(
                db,
                "users",
                user.uid
            );


        const userSnap =
            await getDoc(userRef);


        if (!userSnap.exists()) {

            return;

        }


        const player =
            userSnap.data();


        // COMPLETED QUESTS

        const questQuery =
            query(
                collection(
                    db,
                    "quests"
                ),

                where(
                    "userId",
                    "==",
                    user.uid
                ),

                where(
                    "completed",
                    "==",
                    true
                )
            );


        const questSnapshot =
            await getDocs(
                questQuery
            );


        const completedQuests =
            questSnapshot.size;


        // TECHNOLOGY QUESTS

        let technologyQuests = 0;


        questSnapshot.forEach(
            (questDoc) => {

                const quest =
                    questDoc.data();


                if (
                    String(quest.category).toLowerCase() ===
                    "technology"
                ) {

                    technologyQuests++;

                }

            }
        );


        renderAchievements(
            player,
            completedQuests,
            technologyQuests
        );


    } catch (error) {

        console.error(
            "Achievement loading failed:",
            error
        );

    }

}


// =================================
// RENDER
// =================================

function renderAchievements(
    player,
    completedQuests,
    technologyQuests
) {

    const grid =
        document.getElementById(
            "achievementGrid"
        );


    grid.innerHTML = "";


    let unlocked = 0;


    achievements.forEach(
        (achievement) => {

            const isUnlocked =
                achievement.check(
                    player,
                    completedQuests,
                    technologyQuests
                );


            if (isUnlocked) {

                unlocked++;

            }


            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "achievement-card " +
                (
                    isUnlocked
                        ? "unlocked"
                        : "locked"
                );


            card.innerHTML = `

                <div class="achievement-icon">

                    ${
                        isUnlocked
                            ? achievement.icon
                            : "🔒"
                    }

                </div>


                <div class="achievement-info">

                    <h3>
                        ${achievement.name}
                    </h3>

                    <p>
                        ${achievement.description}
                    </p>


                    <span class="achievement-status">

                        ${
                            isUnlocked
                                ? "✓ UNLOCKED"
                                : "LOCKED"
                        }

                    </span>

                </div>

            `;


            grid.appendChild(card);

        }
    );


    updateProgress(
        unlocked
    );

}


// =================================
// PROGRESS
// =================================

function updateProgress(
    unlocked
) {

    const total =
        achievements.length;


    const percentage =
        (unlocked / total) * 100;


    document.getElementById(
        "achievementCount"
    ).textContent =
        `${unlocked} / ${total}`;


    document.getElementById(
        "achievementProgress"
    ).style.width =
        percentage + "%";

}


// =================================
// LOGOUT
// =================================

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );


if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async () => {

            await signOut(auth);

            window.location.href =
                "/login";

        }
    );

}