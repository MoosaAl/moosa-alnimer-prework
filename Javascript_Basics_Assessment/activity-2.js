var userInput = 0;

while(typeof userInput !== "string") {
    userInput = prompt("Please type your name ");
}

var nameString = "Your name is ";

if(userInput.length > 4) {
    nameString += "greater than ";
} else if (userInput.length < 4) {
    nameString += "less than ";
} else {
    nameString += "equal to ";
}

nameString += "4 characters.";

console.log(nameString);