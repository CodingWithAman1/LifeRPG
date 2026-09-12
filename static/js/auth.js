import {
    auth,
    db,
    googleProvider
} from "./firebase.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


const message =
    document.getElementById("authMessage");


// =====================================
// REGISTER
// =====================================

const registerForm =
    document.getElementById("registerForm");


if (registerForm) {

    registerForm.addEventListener("submit", async (e) => {

        e.preventDefault();


        const name =
            document.getElementById("registerName").value.trim();

        const email =
            document.getElementById("registerEmail").value.trim();

        const password =
            document.getElementById("registerPassword").value;


        try {

            message.textContent =
                "Creating your character...";


            const result =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            await updateProfile(
                result.user,
                {
                    displayName: name
                }
            );

            await ensurePlayerProfile(result.user, name);

            window.lifeRpgSounds?.play("authSuccess");

            message.textContent =
                "Character created!";


            window.location.href =
                "/dashboard";


        } catch (error) {

            message.textContent =
                getErrorMessage(error.code);

            window.lifeRpgSounds?.play("error");

        }

    });

}


// =====================================
// LOGIN
// =====================================

const loginForm =
    document.getElementById("loginForm");


if (loginForm) {

    loginForm.addEventListener("submit", async (e) => {

        e.preventDefault();


        const email =
            document.getElementById("loginEmail").value.trim();

        const password =
            document.getElementById("loginPassword").value;


        try {

            message.textContent =
                "Entering the RPG...";


            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            window.lifeRpgSounds?.play("authSuccess");

            window.location.href =
                "/dashboard";


        } catch (error) {

            message.textContent =
                getErrorMessage(error.code);

            window.lifeRpgSounds?.play("error");

        }

    });

}


// =====================================
// GOOGLE LOGIN / REGISTER
// =====================================

const googleLogin =
    document.getElementById("googleLogin");

const googleRegister =
    document.getElementById("googleRegister");


async function googleSignIn() {

    try {

        message.textContent =
            "Connecting to Google...";


        const result = await signInWithPopup(
            auth,
            googleProvider
        );

        await ensurePlayerProfile(
            result.user,
            result.user.displayName || "Player"
        );

        window.lifeRpgSounds?.play("authSuccess");

        window.location.href =
            "/dashboard";


    } catch (error) {

        console.error("Google sign-in failed:", error);

        message.textContent =
            getErrorMessage(error.code);

        window.lifeRpgSounds?.play("error");

    }

}


if (googleLogin) {

    googleLogin.addEventListener(
        "click",
        googleSignIn
    );

}


if (googleRegister) {

    googleRegister.addEventListener(
        "click",
        googleSignIn
    );

}


// =====================================
// FRIENDLY ERROR MESSAGES
// =====================================

function getErrorMessage(code) {

    switch (code) {

        case "auth/email-already-in-use":
            return "This email is already registered.";

        case "auth/invalid-email":
            return "Please enter a valid email.";

        case "auth/weak-password":
            return "Password must be at least 6 characters.";

        case "auth/invalid-credential":
            return "Incorrect email or password.";

        case "auth/popup-closed-by-user":
            return "Google login was cancelled.";

        case "auth/popup-blocked":
            return "Your browser blocked the Google popup. Allow popups for this site.";

        case "auth/cancelled-popup-request":
            return "A Google login window is already open.";

        case "auth/unauthorized-domain":
            return "Add localhost and 127.0.0.1 to Firebase Authorized domains.";

        case "auth/operation-not-allowed":
            return "Enable Google sign-in in Firebase Authentication providers.";

        case "auth/network-request-failed":
            return "Google sign-in could not reach Firebase. Check your connection.";

        default:
            return "Something went wrong. Please try again.";

    }

}

async function ensurePlayerProfile(user, name) {
    const userRef = doc(db, "users", user.uid);
    const existingProfile = await getDoc(userRef);

    if (existingProfile.exists()) {
        return;
    }

    await setDoc(
        userRef,
        {
            name,
            email: user.email || "",
            level: 1,
            xp: 0,
            gold: 0,
            streak: 0,
            intelligence: 1,
            strength: 1,
            health: 1,
            discipline: 1,
            technology: 1,
            inventory: [],
            createdAt: serverTimestamp()
        },
        { merge: true }
    );
}