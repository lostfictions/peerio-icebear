
function getFirstLetter(str) {
    if (!str || !str.length) return '';
    return String.fromCodePoint(str.codePointAt(0));
}

function getFirstLetterUpperCase(str) {
    return getFirstLetter(str).toLocaleUpperCase();
}

module.exports = { getFirstLetter, getFirstLetterUpperCase };
