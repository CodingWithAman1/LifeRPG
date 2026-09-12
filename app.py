import json
import os
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"), override=True)

app = Flask(__name__)


# ==========================================
# REWARD RANGES
# ==========================================

REWARD_RANGES = {
    "easy": {
        "xp": (15, 40),
        "gold": (3, 8)
    },

    "medium": {
        "xp": (41, 80),
        "gold": (9, 20)
    },

    "hard": {
        "xp": (81, 150),
        "gold": (21, 45)
    }
}


# ==========================================
# AI QUEST PREDICTION
# ==========================================

@app.post("/api/predict-quest")
def predict_quest():

    data = request.get_json(silent=True) or {}

    title = str(
        data.get("title", "")
    ).strip()

    category = str(
        data.get(
            "category",
            "discipline"
        )
    ).strip().lower()


    if not title:

        return jsonify({
            "available": False,
            "error": "A quest title is required."
        }), 400


    # --------------------------------------
    # GET API KEY
    # --------------------------------------

    api_key = os.getenv(
        "GEMINI_API_KEY"
    )


    if not api_key or api_key.startswith("your_"):

        return jsonify({
            "available": False,
            "error":
                "GEMINI_API_KEY is missing or still a placeholder in .env"
        }), 200


    # --------------------------------------
    # PROMPT
    # --------------------------------------

    prompt = f"""
You are a fair life-RPG quest evaluator.

Evaluate the real-world effort required
for the following quest.

Return ONLY valid JSON.

Required fields:

difficulty
xp
gold
reason

difficulty must be exactly one of:

easy
medium
hard

XP ranges:

easy = 15-40
medium = 41-80
hard = 81-150

Gold ranges:

easy = 3-8
medium = 9-20
hard = 21-45

Quest:
{title}

Category:
{category}

Keep the reason short.
"""


    # --------------------------------------
    # REQUEST
    # --------------------------------------

    payload = json.dumps({

        "contents": [

            {
                "parts": [

                    {
                        "text": prompt
                    }

                ]
            }

        ],

        "generationConfig": {

            "responseMimeType":
                "application/json"

        }

    }).encode("utf-8")


    # Gemini 3.6 Flash
    endpoint = (
        "https://generativelanguage.googleapis.com/"
        "v1beta/models/"
        "gemini-3.6-flash:"
        "generateContent"
    )


    try:

        req = Request(

            endpoint,

            data=payload,

            headers={
                "Content-Type":
                    "application/json",

                "x-goog-api-key":
                    api_key
            },

            method="POST"

        )


        response = urlopen(
            req,
            timeout=20
        )


        raw_response = (
            response
            .read()
            .decode("utf-8")
        )


        result = json.loads(
            raw_response
        )


        # ----------------------------------
        # EXTRACT GEMINI TEXT
        # ----------------------------------

        text = (
            result
            ["candidates"]
            [0]
            ["content"]
            ["parts"]
            [0]
            ["text"]
        )


        prediction = json.loads(
            text
        )


        validated = validate_prediction(
            prediction
        )


        return jsonify(validated)


    except HTTPError as error:

        error_body = ""

        try:

            error_body = (
                error
                .read()
                .decode("utf-8")
            )

        except Exception:
            pass


        app.logger.error(
            "Gemini HTTP error %s: %s",
            error.code,
            error_body
        )


        return jsonify({

            "available": False,

            "error":
                f"Gemini API error {error.code}",

            "details":
                error_body[:500]

        }), 200


    except URLError as error:

        app.logger.error(
            "Gemini connection error: %s",
            error
        )


        return jsonify({

            "available": False,

            "error":
                "Could not connect to Gemini API."

        }), 200


    except Exception as error:

        app.logger.exception(
            "Gemini prediction failed"
        )


        return jsonify({

            "available": False,

            "error":
                "AI prediction failed.",

            "details":
                str(error)[:500]

        }), 200


# ==========================================
# VALIDATE AI RESPONSE
# ==========================================

def validate_prediction(prediction):

    difficulty = str(
        prediction.get(
            "difficulty",
            "medium"
        )
    ).lower().strip()


    if difficulty not in REWARD_RANGES:

        difficulty = "medium"


    xp_min, xp_max = (
        REWARD_RANGES[difficulty]["xp"]
    )

    gold_min, gold_max = (
        REWARD_RANGES[difficulty]["gold"]
    )


    try:

        xp = int(
            prediction.get(
                "xp",
                (xp_min + xp_max) // 2
            )
        )

    except (TypeError, ValueError):

        xp = (
            xp_min + xp_max
        ) // 2


    try:

        gold = int(
            prediction.get(
                "gold",
                (gold_min + gold_max) // 2
            )
        )

    except (TypeError, ValueError):

        gold = (
            gold_min + gold_max
        ) // 2


    xp = max(
        xp_min,
        min(xp_max, xp)
    )


    gold = max(
        gold_min,
        min(gold_max, gold)
    )


    reason = str(
        prediction.get(
            "reason",
            "AI estimated the effort required."
        )
    )[:140]


    return {

        "available": True,

        "difficulty":
            difficulty,

        "xp":
            xp,

        "gold":
            gold,

        "reason":
            reason

    }


# ==========================================
# PAGES
# ==========================================

@app.route("/")
def home():

    return render_template(
        "index.html"
    )


@app.route("/login")
def login():

    return render_template(
        "login.html"
    )


@app.route("/register")
def register():

    return render_template(
        "register.html"
    )


@app.route("/dashboard")
def dashboard():

    return render_template(
        "dashboard.html"
    )


@app.route("/quests")
def quests():

    return render_template(
        "quests.html"
    )


@app.route("/character")
def character():

    return render_template(
        "character.html"
    )


@app.route("/shop")
def shop():

    return render_template(
        "shop.html"
    )


@app.route("/achievements")
def achievements():

    return render_template(
        "achievements.html"
    )


# ==========================================
# RUN
# ==========================================

if __name__ == "__main__":

    app.run(
        debug=True
    )