import random
from flask import Flask, render_template, jsonify, request, session

app = Flask(__name__)
app.secret_key = "dev-secret-key"  # для session (потім змінити)

# ------------------ GAME LOGIC ------------------

def weighted_card_pick():
    ranges = [
        (1, 8),
        (9, 17),
        (18, 26),
        (27, 35),
        (36, 44)
    ]

    pool = []
    weights = []

    for start, end in ranges:
        length = end - start + 1
        for i in range(length):
            card = start + i
            weight = (length - i) ** 3  # перекіс як у Telegram
            pool.append(card)
            weights.append(weight)

    return random.choices(pool, weights=weights, k=1)[0]


def get_5_weighted_cards():
    selected = set()
    while len(selected) < 5:
        selected.add(weighted_card_pick())
    return list(selected)

# ------------------ HELPERS ------------------

def init_user():
    if "score" not in session:
        session["score"] = 0

# ------------------ ROUTES ------------------

@app.route("/")
def index():
    """
    Головна сторінка гри
    HTML буде в templates/index.html
    """
    init_user()
    return render_template("index.html")


@app.route("/rules")
def rules():
    """
    Правила гри (можна показувати окремо або в модалці)
    """
    return jsonify({
        "rules": (
            "Є спорщики і відгадчики.\n"
            "Спорщики захищають тезу, використовуючи софізми з карт.\n"
            "Відгадчики відгадують.\n"
            "За правильну відповідь — +1, за помилку — -1."
        )
    })


@app.route("/cards")
def give_cards():
    """
    Аналог 'Дайте карти'
    """
    init_user()
    cards = get_5_weighted_cards()

    return jsonify({
        "cards": cards,
        "extra_card": "map.jpg",
        "score": session["score"]
    })


@app.route("/score", methods=["POST"])
def change_score():
    """
    Аналог callback +1 / -1
    """
    init_user()

    data = request.get_json()
    delta = int(data.get("delta", 0))

    session["score"] += delta

    return jsonify({
        "score": session["score"]
    })


@app.route("/reset")
def reset():
    """
    Скидання сесії (корисно для тестів)
    """
    session.clear()
    return jsonify({"status": "reset"})


# ------------------ START ------------------

import os

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000))
    )
