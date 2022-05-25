//Adds Arcade Physics system to game config so it requires it to include physics support. Try using Matter in future to support full rotation of bodies.
var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var player;
var stars;
var bombs;
var platforms;
var cursors;

var score = 0;
var scoreText; //Set up in create function

var game = new Phaser.Game(config);

//Loads assets for game by putting calls to the Phaser Loader inside of Scene function 'preload'
function preload() {
    this.load.image('sky', 'assets/sky.png');
    this.load.image('ground', 'assets/platform.png');
    this.load.image('star', 'assets/star.png');
    this.load.image('bomb', 'assets/bomb.png');
    this.load.spritesheet('dude',
        'assets/dude.png',
        { frameWidth: 32, frameHeight: 48 }
    );
}

function create() {
    //Values are the xy coordinates of image. Why 400 and 300? It's because in Phaser 3 all Game Objects are positioned based on their center by default. The background image is 800 x 600 pixels in size, so if we were to display it centered at 0 x 0 you'd only see the bottom-right corner of it. If we display it at 400 x 300 you see the whole thing.

    //image layering starts from bottom up. BG typically is on top.
    this.add.image(400, 300, 'sky');

    //Creates new static physics group and assigns it to local variable 'platforms'
    platforms = this.physics.add.staticGroup();

    //Physics group automatically creates physics enabled children using handy helper functions like 'create'

    platforms.create(400, 568, 'ground').setScale(2).refreshBody();
    // The first line of code above adds a new ground image at 400 x 568 (remember, images are positioned based on their center) - the problem is that we need this platform to span the full width of our game, otherwise the player will just drop off the sides. To do that we scale it x2 with the function setScale(2). It's now 800 x 64 in size, which is perfect for our needs. The call to refreshBody() is required because we have scaled a static physics body, so we have to tell the physics world about the changes we made.

    platforms.create(600, 400, 'ground');
    platforms.create(50, 250, 'ground');
    platforms.create(750, 220, 'ground');

    //PLAYER SECTION
    player = this.physics.add.sprite(100, 450, 'dude');

    player.setBounce(0.2);
    player.setCollideWorldBounds(true);

    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('dude', {
            start: 0, end: 3
        }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'turn',
        frames: [{ key: 'dude', frame: 4 }],
        frameRate: 20
    });

    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('dude', {
            start: 5, end: 8
        }),
        frameRate: 10,
        repeat: -1
    });

    //Built in keyboard manager for Phaser. Populates the cursors object with four properties: up, down, left, right. Then all we need to do is poll these in our 'update' loop down below.
    cursors = this.input.keyboard.createCursorKeys();

    //setXY - this is used to set the position of the 12 children the Group creates. Each child will be placed starting at x: 12, y: 0 and with an x step of 70. This means that the first child will be positioned at 12 x 0, the second one is 70 pixels on from that at 82 x 0, the third one is at 152 x 0, and so on. The 'step' values are a really handy way of spacing out a Groups children during creation. The value of 70 is chosen because it means all 12 children will be perfectly spaced out across the screen.
    stars = this.physics.add.group({
        key: 'star',
        repeat: 11,
        setXY: { x: 12, y: 0, stepX: 70 }
    });

    //iterates all children in the Group and gives them a random Y bounce value between 0.4 and 0.8
    stars.children.iterate(function (child) {

        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));

    });

    // In order to allow the player to collide with the platforms we can create a Collider object. This object monitors two physics objects (which can include Groups) and checks for collisions or overlap between them. If that occurs it can then optionally invoke your own callback, but for the sake of just colliding with platforms we don't require that:
    this.physics.add.collider(player, platforms);
    //Adds star collision against platforms
    this.physics.add.collider(stars, platforms);
    //Checks for overlap with star and runs collectStar()
    this.physics.add.overlap(player, stars, collectStar, null, this);

    bombs = this.physics.add.group();
    this.physics.add.collider(bombs, platforms);
    this.physics.add.collider(player, bombs, hitBomb, null, this);

    //16 x 16 is the coordinate to display the text at. 'score: 0' is the default string to display and the object that follows contains a font size and fill color. By not specifying which font we'll actually use the Phaser default, which is Courier.
    scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#000' });
}

function update() {
    if (cursors.left.isDown) {
        player.setVelocityX(-160);
        player.anims.play('left', true);
    }
    else if (cursors.right.isDown) {
        player.setVelocityX(160);
        player.anims.play('right', true);
    }
    else {
        player.setVelocityX(0);
        player.anims.play('turn');
    }

    if (cursors.up.isDown && player.body.touching.down) {
        player.setVelocityY(-330);
    }
}

//This tells Phaser to check for an overlap between the player and any star in the stars Group. If found then they are passed to the 'collectStar' function:
function collectStar(player, star) {
    star.disableBody(true, true); //disables star texture/star physics

    //10 points are added for every star and the scoreText is updated to show this new total.
    score += 10;
    scoreText.setText('Score: ' + score)

    if (stars.countActive(true) === 0) {
        stars.children.iterate(function (child) {
            //re-enables stars, reset y position to zero
            child.enableBody(true, child.x, 0, true, true);
        });

        var x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);

        var bomb = bombs.create(x, 16, 'bomb');
        bomb.setBounce(1);
        bomb.setCollideWorldBounds(true);
        bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
    }
}

function hitBomb(player, bomb) {
    this.physics.pause(); //Stops physics/game
    player.setTint(0xff0000); //Colors player red
    player.anims.play('turn');
    gameOver = true;
}
