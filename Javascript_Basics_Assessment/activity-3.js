var namesList = ["Mark", "Sally", "Joe"];

for(var i = 3; i < 6; i++) {
    namesList[i] = prompt("Please give me a name");
}

var nameLen = namesList.length;
for(i = 0; i < nameLen; i++) {
    alert("namesList["+ i +"] : " + namesList[i]);
}