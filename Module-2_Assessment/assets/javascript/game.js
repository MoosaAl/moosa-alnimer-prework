//constants defined exclusively at the top
const MAX_INCORRECT = 9;
const VALID_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const WORDS = ["alley", "beach", "bridge", "bus", "canyon", "castle", "city", "concert",
    "desert", "dock", "eiffel tower", "factory", "field", "forest", "highway", "intersection",
    "lake", "library", "lighthouse", "mountains", "northern lights", "park", "path", "pier",
    "railroad tracks", "river", "road", "skate park", "space", "train station",
    "waterfall"];
const NEXT_ANIMATIONS = ["secondRotation", "nextRotation"];
const NEW_ANIMATIONS = ["resetRotation", "resetRotationTwo", "introRotation"];
const WRONG_ANIMATIONS = ["failedAttempt", "failedAttemptTwo"];

//global variables
var offsetCounter = 0;
var animationCtr = 0;
var wrongCtr = 0;
var wrongFlag = false;
var didGameStart = false;
var defaultFontSize = "17px";

//retrieved the parent page's DOM context and declared DOM variables
let parentDoc = document.currentScript.ownerDocument;
let scoreDisplay, wordDisplay, attemptsDisplay, poolDisplay, bodyInfo, gameContainer, soundBoard, anyBegin, hintImg;

//selects a word from the array
let generateWord = function() {
    var potentialWord = (Math.random() * WORDS.length | 0); // | 0 to cast to an int

    while(gameState.wordSelector == potentialWord) { // ensures that a word is not repeated consecutively
        potentialWord = (Math.random() * WORDS.length | 0);
    }

    //formatting for internal variables and space handling (since we only accept A-Z)
    gameState.wordSelector = potentialWord;
    let newWord = WORDS[gameState.wordSelector].toUpperCase();
    let wordCopy = (" " + newWord).slice(1);
    gameState.targetLetters = wordCopy.replace(" ", "").length;
    return newWord;
}

//gameState object, keeps track of game variables
let gameState = {
    wins: 0,
    levels: -1,
    correctLetters: 0,
    targetLetters: 0,
    wordSelector: 0,
    targetWord: "",
    guessedPool: "",
    attemptsRemaining: 0,

    //on correct letter guess, call screen update and check if user won level
    correctGuess: function(letter) {
        gameRenderer.updateWord(letter);
        if(this.targetLetters == this.correctLetters) {
            this.wins++;
            gameActions.nextLevel();
            audioController.increaseIntensity();
        }
    },

    //on incorrect letter guess, call screen updates and check if user ran out of guesses
    wrongGuess: function(letter) {
        this.attemptsRemaining -= 1;
        wrongFlag = true;
        gameRenderer.updateAttempts();
        if(this.attemptsRemaining <= 0) {
            gameActions.nextLevel();
            audioController.decreaseIntensity();
        }
    }
}

//gameAction object, handles majority of game's internal computation
let gameActions = {
    guessCharacter: function(input) {
        var upperInput = input.toUpperCase();
        //check if key was only 1 character (e.g. rejects F12), ensures A-Z, and not in guessed letter pool
        if( (upperInput.length == 1) && VALID_LETTERS.includes(upperInput) && (!gameState.guessedPool.includes(upperInput))) {
            if(gameState.guessedPool.length <= 0) { //initialize/add letter to guess pool
                gameState.guessedPool = upperInput;
            } else {
                gameState.guessedPool += ", " + upperInput;
            }

            if(gameState.targetWord.includes(upperInput)) {//handle if guess is correct/incorrect
                gameState.correctGuess(upperInput);
            } else {
                gameState.wrongGuess(upperInput);
            }
            
            gameRenderer.updatePool(); //calls visual renderer
        }
    },

    nextLevel: function() { //handles cleanup when game transitions to next level, regardless of win/loss
        gameState.targetWord = generateWord();
        gameState.correctLetters = 0;
        gameState.attemptsRemaining = MAX_INCORRECT;
        gameState.guessedPool = "";
        gameState.levels++;
        
        var tarLen = gameState.targetWord.length - 1;
        
        if(wordDisplay == null) { //null checking, initializing on first launch
            fetchValues();
        }
        
        for(var i = 0; i < wordDisplay.length; i++) { //computes which characters are "_", " ", or empty
            if(i <= tarLen && gameState.targetWord[i] == " ") {
                wordDisplay[i].innerText = "\xa0";
            } else {
                wordDisplay[i].innerText = i > tarLen ? "" : "_ ";
            }
             wordDisplay[i].id = i > tarLen ? i : i + gameState.targetWord[i];
             wordDisplay[i].style.fontSize = defaultFontSize; //font size would not be same as document otherwise
        }

        //render new values
        gameRenderer.updateScore();
        gameRenderer.updateWord();
        gameRenderer.updateAttempts();

        //call animations
        if(gameState.levels > 0 && !wrongFlag) {
            gameContainer.style.animation = NEXT_ANIMATIONS[animationCtr] + " 0.5s ease";
            gameContainer.style.animationPlayState = "running";
            animationCtr = (animationCtr + 1) % 2;
        } else {
            gameContainer.style.animation = NEW_ANIMATIONS[offsetCounter] + " 0.5s ease";
            gameContainer.style.animationPlayState = "running";
            offsetCounter = (offsetCounter + 1) % 2;
        }
    },

    resetGame: function() {
        gameState.wins = 0; //reset game state to blank slate (that rhymes hehe)
        gameState.levels = -1;
        this.nextLevel();
        audioController.resetIntensity();
    },

    beginGame: function() {
        if(didGameStart) { //listener sometimes won't detach
            return;
        }
        
        //after any button is pressed, start game
        didGameStart = true;
        gameActions.resetGame();
        gameContainer.style.display = "block";
        anyBegin.removeEventListener('keydown', gameActions.beginGame);
        document.addEventListener('keyup', buttonPress);
        anyBegin.style.display = "none";
        bodyInfo.animationPlayState = "running";
    }
}

//gameRenderer, handles most of text and graphics assignment
let gameRenderer = {
    updateScore : function() { // update scoreboard
        if(scoreDisplay == null || scoreDisplay == 'undefined') { //null check
            fetchValues();
        }
        scoreDisplay.innerText = "out of " + gameState.levels + " place(s), we knew " + gameState.wins + " of them";
        scoreDisplay.style.fontSize = defaultFontSize;
    },

    updateWord : function(letter) { //generate new word and select corresponding hint image
        for(var i = 0; i < gameState.targetWord.length; i++) {
            if( wordDisplay[i].id.includes(letter) ) { //if the slot for a word contains this letter, update it
                wordDisplay[i].innerText = letter;
                wordDisplay[i].style.fontSize = defaultFontSize;
                gameState.correctLetters++;
            }
        }

        hintImg.src = "assets/images/" + (" " + WORDS[gameState.wordSelector]).slice(1).replace(" ", "-") + ".jpg";
    },

    updateAttempts : function() { //update attempts display on attempts change
        attemptsDisplay.innerText = gameState.attemptsRemaining;
        attemptsDisplay.style.fontSize = defaultFontSize;
        if(wrongFlag) { //play animation if guessed wrong
            gameContainer.style.animation = WRONG_ANIMATIONS[wrongCtr] + " 0.5s ease";
            gameContainer.style.animationPlayState = "running";
            wrongCtr = (wrongCtr + 1) % 2;
            wrongFlag = false;
        }
    },

    updatePool: function() { //update guessed letter pool
        poolDisplay.innerText = gameState.guessedPool;
    }
}

//controls audio tracks and allows for synchronous parallel track playing
let audioController = {
    trackIntensity : 0,
    currentSeek : 0,

    increaseIntensity : function() {
        if(this.trackIntensity == 2) { //max value checking
            return;
        }

        //unmute next intensity track and ensure they are synchronized
        this.currentSeek = soundBoard[0].currentTime;
        this.trackIntensity += 1;
        for(var i = 1; i <= this.trackIntensity; i++) {
            soundBoard[i].currentTime = this.currentSeek;
        }
        soundBoard[this.trackIntensity].muted = false;
    },

    decreaseIntensity : function() {
        if(this.trackIntensity < 0) { //min value checking
            return;
        }

        //mute current intensity track and decrease intensity
        soundBoard[this.trackIntensity].muted = true;
        this.trackIntensity -= 1;
    },

    resetIntensity : function() { //reset to blank slate
        this.trackIntensity = 0;
        
        for(var i = 0; i < 4; i++) { //mute all but 1 track
            soundBoard[i].play();
            soundBoard[i].muted = true;
        }
        soundBoard[0].muted = false;
    }
}

let promptReset = function() { //prompt reset to make sure user didnt accidentally hit reset button
    var didConfirm = confirm("Are you sure you want to restart your game?");
    if(didConfirm) {
        gameActions.resetGame();
    }
}

let buttonPress = function(event) { //abstraction for gameActions
    gameActions.guessCharacter(event.key);
}

let fetchValues = function() { //helper function to fetch all DOM variables
    scoreDisplay = parentDoc.getElementById("currentScore");
    wordDisplay = parentDoc.getElementById("currentWordDisplay").children;
    soundBoard = parentDoc.getElementById("soundBoard").children;
    attemptsDisplay = parentDoc.getElementById("remainingAttempts");
    poolDisplay = parentDoc.getElementById("guessPoolDisplay");
    gameContainer = parentDoc.getElementById("gameContainer");
    anyBegin = parentDoc.getElementById("startPrompt");
    hintImg = parentDoc.getElementById("hintImg");
    bodyInfo = parentDoc.body.style;
}

if( !didGameStart) { //attach a listener for beginGame
    document.addEventListener('keyup', gameActions.beginGame);
}