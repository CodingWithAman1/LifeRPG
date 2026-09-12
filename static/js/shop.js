import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    doc,
    getDoc,
    runTransaction
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


let currentUser = null;


// =================================
// AUTH
// =================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "/login";

        return;
    }

    currentUser = user;

    await loadWallet();

});


// =================================
// LOAD GOLD
// =================================

async function loadWallet() {

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


        const player =
            snapshot.data();


        updateGold(
            player.gold || 0
        );


        await markOwnedItems(
            player.inventory || []
        );


    } catch (error) {

        console.error(
            "Wallet loading failed:",
            error
        );

    }

}


// =================================
// BUY ITEM
// =================================

document.querySelectorAll(
    ".buy-btn"
).forEach((button) => {

    button.addEventListener(
        "click",
        () => buyItem(button)
    );

});


async function buyItem(button) {

    const itemId =
        button.dataset.item;

    const itemName =
        button.dataset.name;

    const price =
        parseInt(
            button.dataset.price
        );


    button.disabled = true;

    button.textContent =
        "PROCESSING...";


    try {

        const result =
            await runTransaction(
                db,
                async (transaction) => {

                    const userRef =
                        doc(
                            db,
                            "users",
                            currentUser.uid
                        );


                    const userSnap =
                        await transaction.get(
                            userRef
                        );


                    if (!userSnap.exists()) {

                        throw new Error(
                            "Player not found."
                        );

                    }


                    const player =
                        userSnap.data();


                    const gold =
                        player.gold || 0;


                    const inventory =
                        player.inventory || [];


                    // Already owned

                    if (
                        inventory.includes(
                            itemId
                        )
                    ) {

                        throw new Error(
                            "ALREADY_OWNED"
                        );

                    }


                    // Not enough money

                    if (gold < price) {

                        throw new Error(
                            "NOT_ENOUGH_GOLD"
                        );

                    }


                    const newInventory =
                        [
                            ...inventory,
                            itemId
                        ];


                    const newGold =
                        gold - price;


                    transaction.update(
                        userRef,
                        {

                            gold: newGold,

                            inventory:
                                newInventory

                        }
                    );


                    return {
                        gold: newGold
                    };

                }
            );


        updateGold(
            result.gold
        );


        button.textContent =
            "✓ OWNED";


        button.classList.add(
            "owned"
        );

        window.lifeRpgSounds?.play("purchase");

        showPurchasePopup(
            itemName,
            price
        );


    } catch (error) {

        console.error(
            "Purchase failed:",
            error
        );

        window.lifeRpgSounds?.play("error");


        button.disabled = false;


        if (
            error.message ===
            "NOT_ENOUGH_GOLD"
        ) {

            button.textContent =
                `🪙 ${price} — BUY`;

            alert(
                "Not enough Gold! Complete more quests. ⚔️"
            );

        }

        else if (
            error.message ===
            "ALREADY_OWNED"
        ) {

            button.textContent =
                "✓ OWNED";

            button.classList.add(
                "owned"
            );

        }

        else {

            button.textContent =
                `🪙 ${price} — BUY`;

            alert(
                "Purchase failed."
            );

        }

    }

}


// =================================
// UPDATE GOLD
// =================================

function updateGold(gold) {

    const element =
        document.getElementById(
            "goldValue"
        );


    if (element) {

        element.textContent =
            gold;

    }

}


// =================================
// MARK OWNED
// =================================

async function markOwnedItems(
    inventory
) {

    document.querySelectorAll(
        ".buy-btn"
    ).forEach((button) => {

        const itemId =
            button.dataset.item;


        if (
            inventory.includes(
                itemId
            )
        ) {

            button.disabled = true;

            button.textContent =
                "✓ OWNED";

            button.classList.add(
                "owned"
            );

        }

    });

}


// =================================
// PURCHASE POPUP
// =================================

function showPurchasePopup(
    name,
    price
) {

    const popup =
        document.createElement(
            "div"
        );


    popup.className =
        "purchase-popup";


    popup.innerHTML = `

        <div class="purchase-content">

            <div class="purchase-icon">
                🛒
            </div>

            <h2>
                ITEM ACQUIRED
            </h2>

            <p>
                ${name}
            </p>

            <span>
                -${price} 🪙
            </span>

        </div>

    `;


    document.body.appendChild(
        popup
    );


    setTimeout(() => {

        popup.classList.add(
            "show"
        );

    }, 30);


    setTimeout(() => {

        popup.classList.remove(
            "show"
        );

        setTimeout(
            () => popup.remove(),
            300
        );

    }, 1800);

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