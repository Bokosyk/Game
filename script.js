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

//Function to create multiple platform sprites based on width
function addPlatform(x, y, width) {
    for (i = 0; i < width; i++) {
        platforms.create(x(i * 64), y, 'ground');
    }
}

//Loads assets for game by putting calls to the Phaser Loader inside of Scene function 'preload'
function preload() {
    this.load.image('sky', 'assets/sky.png');
    this.load.image('ground', 'assets/platform.png');
    this.load.image('star', 'assets/star.png');
    this.load.image('bomb', 'assets/bomb.png');
    this.load.atlas('bones', 'assets/bones.png',
        'assets/bones.json'
    );
}

function create() {

    //image layering starts from bottom up. BG typically is on top.
    this.add.image(400, 300, 'sky');

    //Creates new static physics group and assigns it to local variable 'platforms'
    platforms = this.physics.add.staticGroup();

    platforms.create(400, 568, 'ground').setScale(2).refreshBody();

    platforms.create(600, 400, 'ground');
    platforms.create(50, 250, 'ground');
    platforms.create(750, 220, 'ground');

    //PLAYER SECTION
    player = this.physics.add.sprite(100, 450, 'bones', 'idle_0001');

    player.setBounce(0.2);
    player.setCollideWorldBounds(true);

    this.anims.create({
        key: 'idle',
        frames: this.anims.generateFrameNames('bones', {
            prefix: 'idle_',
            end: 1,
            zeroPad: 4
        }),
        repeat: 0
    });

    this.anims.create({
        key: 'running',
        frames: this.anims.generateFrameNames('bones', {
            prefix: 'running_',
            end: 3,
            zeroPad: 4
        }),
        frameRate: 11,
        repeat: -1
    });


    cursors = this.input.keyboard.createCursorKeys();

    stars = this.physics.add.group({
        key: 'star',
        repeat: 11,
        setXY: { x: 12, y: 0, stepX: 70 }
    });

    //iterates all children in the Group and gives them a random Y bounce value between 0.4 and 0.8
    stars.children.iterate(function (child) {

        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));

    });


    this.physics.add.collider(player, platforms);
    this.physics.add.collider(stars, platforms);
    //Checks for overlap with star and runs collectStar()
    this.physics.add.overlap(player, stars, collectStar, null, this);

    bombs = this.physics.add.group();
    this.physics.add.collider(bombs, platforms);
    this.physics.add.collider(player, bombs, hitBomb, null, this);

    scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#000' });
}

function update() {
    if (cursors.left.isDown) {
        player.setVelocityX(-180);
        player.flipX = true;
        player.anims.play('running', true);
    }
    else if (cursors.right.isDown) {
        player.setVelocityX(180);
        player.flipX = false;
        player.anims.play('running', true);
    }
    else {
        player.setVelocityX(0);
        player.anims.play('idle');
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
