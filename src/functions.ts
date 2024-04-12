console.log(`Loading functions.js`);

declare const CustomFunctions: any;

// /**
//  * The Meaning Of Life
//  * @customfunction 
//  * @returns The Meaning Of Life
//  */
// function life(): number {
//     console.log("Answering the Meaning Of Life");
//     return 42;
// }

CustomFunctions.associate("LIFE", (function() {
    return console.log("life() => 42"), 42
}));
