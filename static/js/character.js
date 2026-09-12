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


onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "/login";

        return;
    }


    await loadCharacter(user);

    await loadQuestCount(user);

});


// =================================
// LOAD CHARACTER
// =================================

async function loadCharacter(user) {

    try {

        const userRef =
            doc(
                db,
                "users",
                user.uid
            );


        const snapshot =
            await getDoc(userRef);


        if (!snapshot.exists()) {

            console.error(
                "Player profile missing."
            );

            return;
        }


        const player =
            snapshot.data();


        displayCharacter(player);


    } catch (error) {

        console.error(
            "Character loading failed:",
            error
        );

    }

}


// =================================
// DISPLAY CHARACTER
// =================================

function displayCharacter(player) {

    const level =
        player.level || 1;

    const xp =
        player.xp || 0;


    document.getElementById(
        "playerName"
    ).textContent =
        player.name || "Player";


    document.getElementById(
        "levelValue"
    ).textContent =
        level;


    document.getElementById(
        "xpValue"
    ).textContent =
        xp;


    const xpRequired =
        Math.floor(
            100 * Math.pow(level, 1.5)
        );


    document.getElementById(
        "xpRequired"
    ).textContent =
        xpRequired;


    const percentage =
        Math.min(
            (xp / xpRequired) * 100,
            100
        );


    document.getElementById(
        "xpProgress"
    ).style.width =
        percentage + "%";


    setAttribute(
        "intelligence",
        player.intelligence
    );


    setAttribute(
        "strength",
        player.strength
    );


    setAttribute(
        "health",
        player.health
    );


    setAttribute(
        "discipline",
        player.discipline
    );


    setAttribute(
        "technology",
        player.technology
    );


    document.getElementById(
        "goldValue"
    ).textContent =
        player.gold || 0;


    document.getElementById(
        "streakValue"
    ).textContent =
        player.streak || 0;

}


// =================================
// ATTRIBUTE
// =================================

function setAttribute(
    name,
    value
) {

    value =
        value || 1;


    const valueElement =
        document.getElementById(
            name + "Value"
        );


    const barElement =
        document.getElementById(
            name + "Bar"
        );


    if (valueElement) {

        valueElement.textContent =
            value;

    }


    if (barElement) {

        const width =
            Math.min(
                value * 5,
                100
            );


        barElement.style.width =
            width + "%";

    }

}


// =================================
// QUEST COUNT
// =================================

async function loadQuestCount(user) {

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
                    user.uid
                ),

                where(
                    "completed",
                    "==",
                    true
                )
            );


        const snapshot =
            await getDocs(q);


        document.getElementById(
            "questCount"
        ).textContent =
            snapshot.size;


    } catch (error) {

        console.error(
            "Quest count failed:",
            error
        );

    }

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