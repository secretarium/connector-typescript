const { access, F_OK } = require('fs');

const HINT_YARN = `${__dirname}/hintYarn.js`;

access(HINT_YARN, F_OK, (err) => {
    if (err) {
        process.exit(0);
    }
    require(HINT_YARN);
});