// board
let board;
let boardWidth = 360;
let boardHeight = 576;
let context;

// doodler
let piggyWidth = 80;
let piggyHeight = 80;
let piggyX = boardWidth / 2 - piggyWidth / 2;
let piggyY = boardHeight * 7 / 8 - piggyHeight;
let piggyRightImg;
let piggyLeftImg;
let gameOverImg;

// platforms
let platformArray = [];
let platfromWidth = 100;
let platformHeight = 30;
let platformImg;

// scoring
let score = 0;
let maxScore = 0;
let gameOver = false;

// sounds
let startSound = new Audio("start.mp3");
let jumpSound = new Audio("jump.mp3");
let gameOverSound = new Audio("gameover.mp3");

startSound.volume = 1.0;
jumpSound.volume = 1.0;
gameOverSound.volume = 1.0;

let piggy = {
    img: null,
    x: piggyX,
    y: piggyY,
    width: piggyWidth,
    height: piggyHeight
};

// movement
let velocityX = 0;
let velocityY = 0;
let initialVelocityY = -6;
let gravity = 0.4;

let gameStarted = false;

window.onload = function () {
    board = document.getElementById("board");

    // Make canvas fit mobile screens
    if (window.innerWidth < boardWidth) {
        boardWidth = window.innerWidth;
        boardHeight = window.innerHeight;
    }

    board.width = boardWidth;
    board.height = boardHeight;
    context = board.getContext("2d");

    piggyRightImg = new Image();
    piggyRightImg.src = "piggy_right.png";
    piggy.img = piggyRightImg;
    piggyRightImg.onload = function () {
        context.drawImage(piggy.img, piggy.x, piggy.y, piggy.width, piggy.height);
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";
    };

    piggyLeftImg = new Image();
    piggyLeftImg.src = "piggy_left.png";

    platformImg = new Image();
    platformImg.src = "platform.png";

    gameOverImg = new Image();
    gameOverImg.src = "gameover.png";

    velocityY = initialVelocityY;

    placePlatforms();

    requestAnimationFrame(update);

    // Input events
    document.addEventListener("keydown", movePiggy);
    board.addEventListener("touchstart", handleTouch, { passive: false });
};

function update() {
    context.clearRect(0, 0, board.width, board.height);

    if (gameOver) {
        context.clearRect(0, 0, board.width, board.height);

        const imgWidth = 200;
        const imgHeight = 200;
        context.drawImage(
            gameOverImg,
            (boardWidth - imgWidth) / 2,
            (boardHeight - imgHeight) / 2 - 50,
            imgWidth,
            imgHeight
        );

        context.fillStyle = "black";
        context.font = "28px sans-serif";
        let gameOverText = "Game Over";
        let scoreText = "Score: " + score;

        let textWidth = context.measureText(gameOverText).width;
        context.fillText(gameOverText, (boardWidth - textWidth) / 2, boardHeight / 2 + 170);

        textWidth = context.measureText(scoreText).width;
        context.fillText(scoreText, (boardWidth - textWidth) / 2, boardHeight / 2 + 210);

        context.font = "16px sans-serif";
        const restartText = "Tap to restart";
        textWidth = context.measureText(restartText).width;
        context.fillText(restartText, (boardWidth - textWidth) / 2, boardHeight / 2 + 240);

        return;
    }

    requestAnimationFrame(update);

    piggy.x += velocityX;

    if (piggy.x > boardWidth) {
        piggy.x = 0;
    } else if (piggy.x + piggy.width < 0) {
        piggy.x = boardWidth;
    }

    velocityY += gravity;
    piggy.y += velocityY;

    if (piggy.y > boardHeight) {
        if (!gameOver) {
            gameOverSound.play();
        }
        gameOver = true;
    }

    context.drawImage(piggy.img, piggy.x, piggy.y, piggy.width, piggy.height);

    for (let i = 0; i < platformArray.length; i++) {
        let platform = platformArray[i];

        if (velocityY < 0 && piggy.y < boardHeight * 3 / 4) {
            platform.y -= initialVelocityY;
        }

        if (detectCollision(piggy, platform) && velocityY >= 0) {
            velocityY = initialVelocityY;
            jumpSound.play();
        }

        context.drawImage(platform.img, platform.x, platform.y, platform.width, platform.height);
    }

    while (platformArray.length > 0 && platformArray[0].y >= boardHeight) {
        platformArray.shift();
        newPlatform();
    }

    updateScore();

    context.fillStyle = "black";
    context.font = "16px sans-serif";
    context.fillText("Score: " + score, 5, 20);
}

function movePiggy(e) {
    if (!gameStarted) {
        startSound.play().catch(() => {});
        gameStarted = true;
    }

    if ((e.code === "ArrowRight" || e.code === "KeyD") && !gameOver) {
        velocityX = 4;
        piggy.img = piggyRightImg;
    } else if ((e.code === "ArrowLeft" || e.code === "KeyA") && !gameOver) {
        velocityX = -4;
        piggy.img = piggyLeftImg;
    } else if ((e.code === "Space" || e.code === "Spacebar") && gameOver) {
        restartGame();
    }
}

// Handle touch input (mobile)
function handleTouch(e) {
    e.preventDefault();

    let touchX = e.touches[0].clientX;

    if (gameOver) {
        restartGame();
        return;
    }

    if (!gameStarted) {
        startSound.play().catch(() => {});
        gameStarted = true;
    }

    if (touchX < boardWidth / 2) {
        velocityX = -4;
        piggy.img = piggyLeftImg;
    } else {
        velocityX = 4;
        piggy.img = piggyRightImg;
    }
}

function restartGame() {
    piggy = {
        img: piggyRightImg,
        x: piggyX,
        y: piggyY,
        width: piggyWidth,
        height: piggyHeight
    };

    velocityX = 0;
    velocityY = initialVelocityY;
    score = 0;
    maxScore = 0;
    gameOver = false;
    placePlatforms();

    startSound.play();

    requestAnimationFrame(update);
}

function placePlatforms() {
    platformArray = [];

    let base = {
        img: platformImg,
        x: boardWidth / 2,
        y: boardHeight - 50,
        width: platfromWidth,
        height: platformHeight
    };

    platformArray.push(base);

    for (let i = 0; i < 6; i++) {
        let randomX = Math.floor(Math.random() * (boardWidth - platfromWidth));
        let platform = {
            img: platformImg,
            x: randomX,
            y: boardHeight - 75 * i - 150,
            width: platfromWidth,
            height: platformHeight
        };
        platformArray.push(platform);
    }
}

function newPlatform() {
    let randomX = Math.floor(Math.random() * (boardWidth - platfromWidth));
    let platform = {
        img: platformImg,
        x: randomX,
        y: -platformHeight,
        width: platfromWidth,
        height: platformHeight
    };
    platformArray.push(platform);
}

function detectCollision(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

function updateScore() {
    let points = Math.floor(50 * Math.random());

    if (velocityY < 0) {
        maxScore += points;
        if (score < maxScore) {
            score = maxScore;
        }
    } else if (velocityY >= 0) {
        maxScore -= points;
    }
}