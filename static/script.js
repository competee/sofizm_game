document.addEventListener("DOMContentLoaded", () => {

    console.log("DOM ready");

    const rulesBtn = document.getElementById("rules-btn");
    const cardsBtn = document.getElementById("cards-btn");

    const rulesBlock = document.getElementById("rules");
    const rulesText = document.getElementById("rules-text");

    const cardsArea = document.getElementById("cards-area");

    const scoreSpan = document.getElementById("score");
    const scoreButtons = document.querySelectorAll("#score-area button");

    console.log({
        rulesBtn,
        cardsBtn,
        rulesBlock,
        cardsArea,
        scoreSpan,
        scoreButtons
    });

    // ----- RULES -----
    rulesBtn.addEventListener("click", async () => {
        console.log("rules clicked");

        if (!rulesBlock.hasAttribute("hidden")) {
            rulesBlock.setAttribute("hidden", "");
            return;
        }

        const res = await fetch("/rules");
        const data = await res.json();

        rulesText.textContent = data.rules;
        rulesBlock.removeAttribute("hidden");
    });

    // ----- CARDS -----
    cardsBtn.addEventListener("click", async () => {
        console.log("cards clicked");

        const res = await fetch("/cards");
        const data = await res.json();

        renderCards(data.cards, data.extra_card);
        updateScore(data.score);
    });

    function renderCards(cards, extraCard) {
    cardsArea.innerHTML = "";

    const viewer = document.getElementById("viewer");
    const viewerImg = document.getElementById("viewer-img");

    let scale = 1;
    let x = 0;
    let y = 0;
    let isDragging = false;
    let startX, startY;
    let wasDragging = false;

    function updateTransform() {
        viewerImg.style.transform =
            `translate(${x}px, ${y}px) scale(${scale})`;
    }

    function openViewer(src) {
        viewerImg.onload = () => {
            const vw = viewer.clientWidth;
            const vh = viewer.clientHeight;

            const iw = viewerImg.naturalWidth;
            const ih = viewerImg.naturalHeight;

            // scale так, щоб картинка повністю вмістилась в екран
            scale = Math.min(vw / iw, vh / ih);

            // центруємо
            x = (vw - iw * scale) / 2;
            y = (vh - ih * scale) / 2;

            updateTransform();
        };

        viewerImg.src = src;
        viewer.style.display = "flex";
    }


    function closeViewer() {
        viewer.style.display = "none";
    }

    /* ZOOM */
    viewer.addEventListener("wheel", (e) => {
        e.preventDefault();

        const delta = e.deltaY * -0.001;
        scale = Math.min(Math.max(0.5, scale + delta), 5);
        updateTransform();
    });

    /* DRAG */
    viewerImg.addEventListener("mousedown", (e) => {
        isDragging = true;
        wasDragging = false;
        startX = e.clientX - x;
        startY = e.clientY - y;
        viewerImg.style.cursor = "grabbing";
    });


    window.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        wasDragging = true;
        x = e.clientX - startX;
        y = e.clientY - startY;
        updateTransform();
    });


    window.addEventListener("mouseup", () => {
        isDragging = false;
        viewerImg.style.cursor = "grab";
    });

    /* CLICK TO CLOSE */
    viewer.addEventListener("click", (e) => {
        if (e.target === viewer) closeViewer();
    });

    function makeCard(src) {
        const img = document.createElement("img");
        img.src = src;
        img.draggable = false;
        img.addEventListener("dragstart", e => e.preventDefault());
        img.addEventListener("click", () => {
            if (!wasDragging) openViewer(src);
        });
        return img;
    }


    cards.forEach(card => {
        cardsArea.appendChild(
            makeCard(`/static/cards/${card}.jpg`)
        );
    });

    if (extraCard) {
        cardsArea.appendChild(
            makeCard(`/static/cards/${extraCard}`)
        );
    }
}



    // ----- SCORE -----
    scoreButtons.forEach(btn => {
        btn.addEventListener("click", async () => {
            console.log("score click", btn.dataset.delta);

            const res = await fetch("/score", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ delta: btn.dataset.delta })
            });

            const data = await res.json();
            updateScore(data.score);
        });
    });

    function updateScore(score) {
        scoreSpan.textContent = score;
    }

});
