class PasswordGenerator {
    
    constructor(length) {
        this.length = length;

        this.lower = "abcdefghijklmnopqrstuvwxyz";
        this.upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        this.numbers = "0123456789";
        this.special = "!@#$%^&*()_+=-{}[]<>?/|~";
    }

    getRandomChar(str) {
        return str[Math.floor(Math.random() * str.length)];
    }

    generate() {
        // Step 1: Take at least one from each group
        let passwordArray = [
            this.getRandomChar(this.lower),
            this.getRandomChar(this.upper),
            this.getRandomChar(this.special),
            this.getRandomChar(this.numbers)
        ];

        // Step 2: Create a pool of all characters
        let allChars = this.lower + this.upper + this.numbers + this.special;

        // Step 3: Fill remaining characters randomly
        while (passwordArray.length < this.length) {
            passwordArray.push(this.getRandomChar(allChars));
        }

        // Step 4: Shuffle the password array
        passwordArray = passwordArray.sort(() => Math.random() - 0.5);

        // Step 5: Join into a string
        return passwordArray.join("");

    }
}


// ------------------------------------------
// Example usage:
// ------------------------------------------

let generator = new PasswordGenerator(12);  // 12-character password
let password = generator.generate();        

console.log("Generated Password:", password);
