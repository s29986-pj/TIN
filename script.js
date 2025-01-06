const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

canvas.width = 1536;
canvas.height = 730;
const worldWidth = 14300;

const gravity = 0.25;

class Player {
    constructor() {
        this.position = { x: 100, y: 100 };
        this.velocity = { x: 0, y: 0 };
        this.width = 35;
        this.height = 35;
        this.isInAir = true;
        this.lives = 3;
        this.isCollidingWithObstacle = false;

        this.defaultColor = '#3399FF'; 
        this.currentColor = this.defaultColor;
        this.colorTimer = null;
    }

    draw() {
        c.fillStyle = this.currentColor;
        c.fillRect(this.position.x, this.position.y, this.width, this.height);
    }

    update() {
        // Update position with velocity
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;


        // Gravity
        if (this.position.y + this.height + this.velocity.y <= canvas.height) {
            this.velocity.y += gravity;
            this.isInAir = true;
        }


        // Blocking player in game world
        if (this.position.x < 0) {
            this.position.x = 0;
        }
        if (this.position.x + this.width > worldWidth) {
            this.position.x = worldWidth - this.width;
        }


        // Handle collisions with platforms (both static and moving)
        [...platforms, ...movingPlatforms].forEach(platform => {
            this.handlePlatformCollision(platform);
        });


        // Obstacle collision detection
        this.handleObstacleCollision();

               
        // Lose condition (fall below the screen or lose all lives)
        if (this.position.y > canvas.height || this.lives <= 0) resetGame();
    }

    handlePlatformCollision(platform) {
        const playerBottom = this.position.y + this.height;
        const playerTop = this.position.y;
        const playerLeft = this.position.x;
        const playerRight = this.position.x + this.width;

        const platformTop = platform.position.y;
        const platformBottom = platform.position.y + platform.height;
        const platformLeft = platform.position.x;
        const platformRight = platform.position.x + platform.width;

        // Collision from top (land on platform from above)
        if (
            playerBottom <= platformTop &&  // The player is approaching the top of the platform
            playerBottom + this.velocity.y >= platformTop && // The player just landed
            playerRight > platformLeft && 
            playerLeft < platformRight
        ) {
            this.isInAir = false;
            this.velocity.y = 0;
            this.position.y = platformTop - this.height; // Ensure the player is placed on top of the platform

            // Player moves with platform
            if (platform instanceof MovingPlatform) {
                this.position.x += platform.speed;
            }
        }

        // Side collisions
        if (
            playerBottom > platformTop && // The player is inside the vertical range of the platform
            playerTop < platformBottom
        ) {
            if (playerRight > platformLeft && playerLeft < platformLeft) {
                this.velocity.x = 0;
                this.position.x = platformLeft - this.width; // Block from left
            } else if (playerLeft < platformRight && playerRight > platformRight) {
                this.velocity.x = 0;
                this.position.x = platformRight; // Block from right
            }
        }

        // Collision from bottom (catch platform if it's directly below player)
        if (playerTop >= platformBottom && playerTop + this.velocity.y <= platformBottom && 
            playerRight > platformLeft && playerLeft < platformRight) {
            this.velocity.y = 0;
            this.position.y = platformBottom; // Gracz ląduje na platformie
            this.isInAir = false;
        }
    }

    handleObstacleCollision() {
        let currentlyColliding = false; 

        obstacles.forEach(obstacle => {
            const playerBottom = this.position.y + this.height;
            const playerTop = this.position.y;
            const playerLeft = this.position.x;
            const playerRight = this.position.x + this.width;

            const obstacleTop = obstacle.position.y;
            const obstacleBottom = obstacle.position.y + obstacle.height;
            const obstacleLeft = obstacle.position.x;
            const obstacleRight = obstacle.position.x + obstacle.width;

            if (
                playerBottom > obstacleTop &&
                playerTop < obstacleBottom &&
                playerRight > obstacleLeft &&
                playerLeft < obstacleRight
            ) {
                currentlyColliding = true;

                if (!this.isCollidingWithObstacle) {
                    this.lives--;
                    this.isCollidingWithObstacle = true;
                    
                    // Change player color
                    this.currentColor = '#FF3333';

                    if (this.colorTimer) {
                        clearTimeout(this.colorTimer);
                    }
                    this.colorTimer = setTimeout(() => {
                        this.currentColor = this.defaultColor;
                    }, 150); 
                }
            }
        });
        

        // Reset colliding flag
        this.isCollidingWithObstacle = currentlyColliding;
    }
}

class Obstacle {
    constructor({ x, y, width, height, image = images.obstacle }) {
        this.position = { x, y };
        this.width = width;
        this.height = height;
        this.image = image;
    }

    draw() {
        c.drawImage(this.image, this.position.x, this.position.y, this.width, this.height);
    }
}


class Platform {
    constructor({ x, y, width, height, image = images.platform }) {
        this.position = { x, y };
        this.width = width;
        this.height = height;
        this.image = image;
    }

    draw() {
        c.drawImage(this.image, this.position.x, this.position.y, this.width, this.height);
    }
}



class MovingPlatform extends Platform {
    constructor({ x, y, width, height, speed, range, image = images.movingPlatform }) {
        super({ x, y, width, height, image });
        this.startingX = x;
        this.speed = speed;
        this.range = range;
    }

    update() {
        this.position.x += this.speed;

        if (this.position.x > this.startingX + this.range) {
            this.speed *= -1;
        } else if (this.position.x < this.startingX - this.range) {
            this.speed *= -1;
        }
    }

    draw() {
        c.drawImage(this.image, this.position.x, this.position.y, this.width, this.height);
    }
}

function updateMovingPlatforms() {
    movingPlatforms.forEach(platform => {
        platform.update();
        platform.draw();
    });
}



class ParallaxLayer {
    constructor({ images, speed }) {
        this.images = images.map(src => createImage(src));
        this.speed = speed;
    }

    draw(cameraX) {
        const parallaxX = -(cameraX * this.speed);
    
        this.images.forEach(image => {
            const imageWidth = image.width;
            const imageHeight = image.height;

    
            let startX = parallaxX % imageWidth;
    
            // if (startX > 0) {
            //     startX -= imageWidth;
            // }
    
            for (let x = startX; x < worldWidth; x += imageWidth - 3) {
                c.drawImage(image, x, canvas.height - imageHeight, imageWidth, imageHeight);
            }
        });
    }
}



// Objects

const images = {
    platform: new Image(),
    movingPlatform: new Image(),
    obstacle: new Image(),
};

images.platform.src = 'platform.png';
images.movingPlatform.src = 'platformIce.png';
images.obstacle.src = 'obstacle.png';

const player = new Player();

const platforms = [
    // Floor
    new Platform({ x: -130, y: 635, width: 500, height: 125 }),
    new Platform({ x: 369, y: 635, width: 600, height: 125 }),
    new Platform({ x: 1068, y: 605, width: 750, height: 125 }),
    new Platform({ x: 2668, y: 605, width: 700, height: 125 }),
    new Platform({ x: 5198, y: 605, width: 700, height: 125 }),
    new Platform({ x: 6696, y: 485, width: 900, height: 245 }),
    new Platform({ x: 8495, y: 685, width: 300, height: 85 }),
    new Platform({ x: 9310, y: 605, width: 750, height: 125 }),
    new Platform({ x: 10059, y: 605, width: 550, height: 125 }),
    new Platform({ x: 10607, y: 605, width: 550, height: 125 }),
    new Platform({ x: 11155, y: 605, width: 550, height: 125 }),
    new Platform({ x: 13500, y: 605, width: 800, height: 125 }),
    new Platform({ x: 14298, y: 605, width: 800, height: 125 }),

    // Floating platforms
    new Platform({ x: 3580, y: 485, width: 200, height: 30 }),
    new Platform({ x: 4000, y: 415, width: 200, height: 30 }),
    new Platform({ x: 4360, y: 470, width: 200, height: 30 }),
    new Platform({ x: 4900, y: 655, width: 300, height: 100 }),
    new Platform({ x: 9400, y: 285, width: 200, height: 30 }),
    new Platform({ x: 10046, y: 225, width: 200, height: 30 }),
    new Platform({ x: 10646, y: 225, width: 200, height: 30 }),
    new Platform({ x: 11950, y: 500, width: 200, height: 30 }),   
];

const movingPlatforms = [
    new MovingPlatform({ x: 2100, y: 445, width: 200, height: 30, speed: 1, range: 168 }),
    new MovingPlatform({ x: 6200, y: 545, width: 200, height: 30, speed: 1, range: 220 }),
    new MovingPlatform({ x: 7895, y: 425, width: 200, height: 30, speed: 1, range: 200 }),
    new MovingPlatform({ x: 8535, y: 305, width: 200, height: 30, speed: -1, range: 200 }),
    new MovingPlatform({ x: 8845, y: 505, width: 200, height: 30, speed: 1, range: 125 }),
    new MovingPlatform({ x: 12700, y: 325, width: 200, height: 30, speed: 1.5, range: 325 })
];

const obstacles = [
    new Obstacle({ x: 2690, y: 578, width: 200, height: 30 }),
    new Obstacle({ x: 4900, y: 625, width: 300, height: 30 }),
    new Obstacle({ x: 8495, y: 657, width: 300, height: 30 }),
    new Obstacle({ x: 9952, y: 580, width: 200, height: 30 }),
    new Obstacle({ x: 10251, y: 580, width: 200, height: 30 }),
    new Obstacle({ x: 10540, y: 580, width: 200, height: 30 }),
    new Obstacle({ x: 10860, y: 580, width: 200, height: 30 }),
    new Obstacle({ x: 11058, y: 580, width: 200, height: 30 }),
];

const parallaxLayers = [
    new ParallaxLayer({ images: ['background.png'], speed: 0.32 }),
    new ParallaxLayer({ images: ['hill.png'], speed: 0.16 })
];



// Movement
const keys = {
    right: { pressed: false },
    left: { pressed: false }
};

function jump() {
    if (!player.isInAir) {
        player.velocity.y = -10;
        player.isInAir = true;
    }
}

const keyDownActions = {
    ' ': () => {
        jump();
    },
    ArrowUp: () => {
        jump();
    },
    ArrowLeft: () => {
        keys.left.pressed = true;
    },
    ArrowRight: () => {
        keys.right.pressed = true;
    }
};

const keyUpActions = {
    ArrowLeft: () => {
        keys.left.pressed = false;
    },
    ArrowRight: () => {
        keys.right.pressed = false;
    }
};

addEventListener('keydown', (event) => {
    if (keyDownActions[event.key]) {
        keyDownActions[event.key]();
    }
});

addEventListener('keyup', (event) => {
    if (keyUpActions[event.key]) {
        keyUpActions[event.key]();
    }
});

const acceleration = 0.25;
const maxSpeed = 7.25;

function handleInput() {
    if (keys.right.pressed) {
        player.velocity.x += acceleration;
        if (player.velocity.x > maxSpeed) player.velocity.x = maxSpeed;
    } else if (keys.left.pressed) {
        player.velocity.x -= acceleration;
        if (player.velocity.x < -maxSpeed) player.velocity.x = -maxSpeed;
    } else {
        // Friction
        player.velocity.x *= 0.9;
        if (Math.abs(player.velocity.x) < 0.1) player.velocity.x = 0;
    }
}
// --- END Movement ---



// Camera
let camera = { x: 0 };

function updateCamera() {
    const centerX = canvas.width / 2;

    if (player.position.x > centerX) {
        const scrollDistance = player.position.x - centerX;
        camera.x = scrollDistance;
    }
}



// Game
function resetGame() {
    player.position.x = 100;
    player.position.y = 100;
    player.velocity.x = 0;
    player.velocity.y = 0;
    player.lives = 3;
    camera.x = 0;
    keys.left.pressed = false;
    keys.right.pressed = false;
}


function render() {
    c.clearRect(0, 0, canvas.width, canvas.height);
    c.save();

    c.translate(-camera.x, 0); // Camera scroll
    
    parallaxLayers.forEach(layer => {
        layer.draw(camera.x);
    });
    platforms.forEach(platform => platform.draw());
    movingPlatforms.forEach(platform => platform.draw());
    obstacles.forEach(obstacle => obstacle.draw());
    player.draw();

    c.restore();

    //Lives
    c.fillStyle = 'black';
    c.font = '30px Arial';
    c.fillText(`Lives: ${player.lives}`, 20, 40);
}


const finishLine = 14100;

function winCondition() {
    if (player.position.x + player.width >= finishLine && !player.isInAir) {
        alert(`You win!\n\nScore: ${player.lives * 100}`);
        resetGame();
    }
}


function createImage(imageSrc) {
    const image = new Image();
    image.src = imageSrc;
    return image;
}


function gameLoop() {
    // Update player
    handleInput();
    player.update();
    winCondition();

    // Update rest
    updateMovingPlatforms();
    updateCamera();
    
    render();

    requestAnimationFrame(gameLoop);
}

gameLoop();
