// TODO: 8 digit hex code?
// https://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
function lightenDarkenColor(col, amt) {
    var num = parseInt(col, 16);
    var r = (num >> 16) + amt;
    var b = ((num >> 8) & 0x00ff) + amt;
    var g = (num & 0x0000ff) + amt;
    var newColor = g | (b << 8) | (r << 16);
    return newColor.toString(16);
}

// https://awik.io/determine-color-bright-dark-using-javascript/
function lightOrDark(color) {
    // Check the format of the color, HEX or RGB?
    if (color.match(/^rgb/)) {
        // If RGB -> store the red, green, blue values in separate variables
        var [r, g, b] = color.match(
            /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/
        );
    } else {
        // If hex -> Convert it to RGB: http://gist.github.com/983661
        color = +("0x" + color.slice(1).replace(color.length < 5 && /./g, "$&$&"));
        var r = color >> 16;
        var g = (color >> 8) & 255;
        var b = color & 255;
    }

    // HSP (Highly Sensitive Poo) equation from http://alienryderflex.com/hsp.html
    var hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));

    // Using the HSP value, determine whether the color is light or dark
    return hsp > 127.5 ? "light" : "dark";
}

function parseTlComment(tl_comment) {
    // split by spaces
    let split = [...tl_comment.split(/ +/)]

    // parse commands
    let commands = split.flatMap((command) => {

        let addClass = ""
        let addId = ""

        // Extract which lines to apply to
        let whichLines = command.match(/:(start|end|-?[0-9]+|-?[0-9]+,-?[0-9]+)$/)
        if (whichLines == null) {
            whichLines = "0"
        } else {
            command = command.replace(whichLines[0], "")
            whichLines = whichLines[0].replace(":", "")
        }

        // Extract commands to apply
        let results = new Array()


        while (command.length > 0) {
            let matches = command.split(/(?=[\.#])/g)
            matches.map((match) => {
                // # => ID
                if (/^\#/.test(match) != null) {
                    results.push({
                        addClass: match.replace(/^\./, ""),
                        addId: "",
                        whichLines: whichLines
                    })
                // The rest => class
                } else {
                    results.push({
                        addClass: "",
                        addId: match.replace(/^#/, ""),
                        whichLines: whichLines
                    })
                }
                command = command.replace(match, "")
            })
        }

        return results
    })

    return commands;
}

/*
 * Takes lines produced from shiki Highlighter and
 * finds comments with [!shiki] commands and stores
 * them in classes object. Returns modified lines
 * object with isCollapsed added. Also classes which
 * is an array of classes
 */
function cleanTokens(lines) {
    let classes = Array(lines.length).fill(null);
    let ids = Array(lines.length).fill(null)
    for (let i = 0; i < lines.length; i++) {
        classes[i] = new Set();
        ids[i] = new Set();
    }
    let waiting_for_end = new Map();
    let waiting_for_end_ids = new Map();

    let isCollapsed = false;

    // Iterate over lines
    for (let i = 0; i < lines.length; i++) {
        let tokens = lines[i];

        // Iterate over tokens in line
        // check for comment
        for (let j = 0; j < tokens.length; j++) {
            let token = tokens[j];

            // Check if token is a comment
            let isComment = token.explanation
                .map((e) => {
                    return e.scopes.some((s) => {
                        return s.scopeName.match(/comment/);
                    });
                })
                .some((e) => e);

            // Parse !shiki comment and add classes
            if (isComment) {
                let tl_comment = token.content.match(/\[!shiki ?(.*?)\]/);

                if (tl_comment !== null) {
                    let commands = parseTlComment(tl_comment[1]);

                    // Remove !shiki comment
                    token.content = token.content.replace(/\s?\[!shiki ?(.*?)\]/, "");

                    // remove comment if is empty after removing !shiki comment
                    if (!token.content.match(/[\w-]+/)) {
                        token.content = ""
                        token.isEmpty = true
                    }

                    // Parse individual !shiki commands
                    for (let k = 0; k < commands.length; k++) {
                        let {
                            addClass,
                            addId,
                            whichLines
                        } = commands[k];

                        // Special shorthand for highlight, git add/subract
                        if (addClass === "+") {
                            addClass = "git-add";
                        } else if (addClass === "-") {
                            addClass = "git-remove";
                        } else if (addClass === "*") {
                            addClass = "hl";
                        } else if (addClass === "collapse") {
                            if (whichLines === "start") {
                                isCollapsed = true;
                            } else if (whichLines === "end") {
                                isCollapsed = false;
                            } else {
                                console.error("Collapse only works with :start and :end");
                            }
                        }

                        if (whichLines === "start") {
                            waiting_for_end.set(addClass, true);
                            waiting_for_end_ids.set(addId, true);
                        } else if (whichLines === "end") {
                            // special case, need to apply class for :end
                            // doesn't get covered in the for loop later
                            if(addClass.length > 0) {
                                classes[i].add(addClass);
                                ids[i].add(addId);
                                waiting_for_end.set(addClass, false);
                                waiting_for_end_ids.set(addId, false);
                            }
                        } else if (whichLines.includes(",")) {
                            let [start, end] = whichLines.split(",");

                            for (
                                let m = i + Number(start);
                                (m <= i + Number(start) + Number(end)-1) & (m < lines.length); m++
                            ) {
                                ids[m].add(addId);
                                classes[m].add(addClass);
                            }
                        } else {
                            for (
                                let m = i;
                                (m <= i + Number(whichLines)) & (m < lines.length); m++
                            ) {
                                ids[m].add(addId);
                                classes[m].add(addClass);
                            }
                        }
                    }
                }

            }

            // Add collapsed marker
            delete token.explanation;
            token.isCollapsed = isCollapsed;

            // console.log(token.content, ": ", token.isCollapsed)
            tokens[j] = token;
        }

        // apply classes from :start
        waiting_for_end.forEach((value, key) => {
            if (value) {
                classes[i].add(key);
            }
        });
        waiting_for_end_ids.forEach((value, key) => {
            if (value) {
                ids[i].add(key);
            }
        });

        lines[i] = tokens;
    }

    // filter trailing and leading blank array objects
    for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].length == 0) lines.pop();
        else break;
    }
    for (let i = 0; i <= 0; i--) {
        if (lines[i].length == 0) lines.shift();
        else break;
    }

    return {
        lines: lines,
        classes: classes,
        ids: ids
    };
}

/*
 * @param {} lines
 * @param {} classes
 * @param {} hl_theme
 * @param {boolean} line_numbers
 * @param {ref} pre_classes
 */
function tokensToHTML(lines, classes, ids, hl_theme, line_numbers, pre_classes) {
    let preClasses = new Set();
    let hl_theme_colors = Object.values(hl_theme.colors).map((color) =>
        color.replace("#", "")
    );

    let collapseFirstLine = false;
    // Prevent from using <summary> multiple times
    let collapseStarted = false;

    let raw_code = lines.map((tokens, i) => {
        let lineNum = i + 1;

        // default colors
        let {
            "editorLineNumber.foreground": lineNumColor
        } = hl_theme.colors;
        if (lineNumColor == null) {
            lineNumColor = hl_theme.fg;
            if (lineNumColor.length === 9) {
                lineNumColor = lineNumColor.slice(0, 7) + "40";
            } else if (lineNumColor.length === 7) {
                lineNumColor = lineNumColor + "40";
            } else {
                lineNumColor =
                    "#" +
                    lineNumColor.slice(1) +
                    lineNumColor.slice(1) +
                    lineNumColor.slice(2) +
                    lineNumColor.slice(2) +
                    lineNumColor.slice(3) +
                    lineNumColor.slice(3) +
                    "40";
            }
        }

        let lineBgColor = hl_theme.bg;
        let isDark = lightOrDark(lineBgColor);

        // Initialize
        let line = "";
        let inner = "";

        preClasses.add("shiki");

        // TODO: Maybe find closest green in theme:
        // https://gist.github.com/Ademking/560d541e87043bfff0eb8470d3ef4894

        // Special commands
        if (classes[i].has("git-add")) {
            preClasses.add("has-add");
            lineNum = "+";

            let {
                "diffEditor.insertedTextBackground": addBgColor,
                "gitDecoration.addedResourceForeground": addLineColor,
            } = hl_theme.colors

            let addBgColorDefault = (isDark ? "#82C61E30" : "#82C61E40")
            let addLineColorDefault = "#82C61E"

            lineBgColor = addBgColor != null ? addBgColor : addBgColorDefault
            lineNumColor = addLineColor != null ? addLineColor : addLineColorDefault

        } else if (classes[i].has("git-remove")) {
            preClasses.add("has-remove")
            lineNum = "-"

            let {
                "diffEditor.removedTextBackground": rmBgColor,
                "gitDecoration.deletedResourceForeground": rmLineColor,
            } = hl_theme.colors;

            let rmBgColorDefault = (isDark ? "#82C61E30" : "#82C61E40")
            let rmLineColorDefault = "#f07178"

            lineBgColor = rmBgColor != null ? rmBgColor : rmBgColorDefault
            lineNumColor = rmLineColor != null ? rmLineColor : rmLineColorDefault

        } else if (classes[i].has("hl")) {
            preClasses.add("has-highlight")

            // use theme's highlight color
            let {
                "editor.lineHighlightBackground": hlColor,
                "editor.wordHighlightBackground": hlColor2,
            } = hl_theme.colors;

            // darken or lighten based on background color
            let hlColorDefault =
                "#" + lightenDarkenColor(lineBgColor.slice(1, 7), isDark ? -10 : 10);

            // use theme's color or default to lighten/darkened bg
            lineBgColor = hlColor != null ? hlColor : (hlColor2 != null ? hlColor2 : hlColorDefault)

        } else if (classes[i].has("focus")) {
            preClasses.add("has-focus")

        } else if (classes[i].has("collapse")) {
            preClasses.add("has-collapse")
        }

        // Construct classes
        let classStr = [...classes[i].values()].join(" ");
        let idStr = [...ids[i].values()].join("");
        idStr = idStr.length > 0 ? ` id="${idStr}"` : "";

        // Collapse code:
        // <details><summary>
        //      stuff not collapsed
        // </summary>
        //     stuff to be collapsed
        // </details>
        if (!collapseStarted & classes[i].has("collapse")) {
            collapseFirstLine = true;
            collapseStarted = true;
            line += `<details><summary style="cursor: pointer; display:inline;">`;
        }

        // line span
        line += `<div ${idStr} class='line ${classStr}' style='background-color: ${lineBgColor}'>`;

        // Add line-number
        if (line_numbers) {
            let lineWidth = "2rem";
            if (lines.length > 100) lineWidth = "3rem"
            line += `<span class='line-number' style='color: ${lineNumColor}; user-select: none; width: 2rem; display: inline-block; text-align: right;'>${lineNum}</span>`;
        }

        // tokens => spans
        if (tokens.length > 0) {
            let summaryFinished = false;
            // go through tokens and append to inner
            for (let j = 0; j < tokens.length; j++) {
                let token = tokens[j];

                let fontStyle = "";
                if (token.fontStyle == 1) {
                    fontStyle = "font-style: italic;";
                } else if (token.fontStyle == 2) {
                    fontStyle = "font-weight: bold;";
                } else if (token.fontStyle == 4) {
                    fontStyle = "text-decoration: underline;";
                }
                let token_str = `<span style='color: ${token.color}; ${fontStyle}'>${token.content}</span>`;

                if (!token.isEmpty) {
                    inner += token_str;
                }

                // For collapseFirstLine
                // Check if next token is first to start collapse
                // Add </summary> to begin collapsing
                if (collapseFirstLine & !summaryFinished) {
                    if (j < tokens.length - 1) {
                        // If not last token
                        if (!token.isCollapsed & tokens[j + 1].isCollapsed) {
                            summaryFinished = true;
                            inner += `<span class='collapse-details' style='color: ${lineNumColor}; user-select: none'>...</span></summary>`
                        }
                    } else {
                        // If last token
                        inner += `<span class='collapse-details' style='color: ${lineNumColor}; user-select: none'>$...</span></summary>`
                        summaryFinished = true;
                    }
                }

                // If collapseStarted and not collapseFirstLine
                // Close if next token is not isCollapsed
                if (!collapseFirstLine & collapseStarted) {
                    if (j < tokens.length - 1) {
                        // If not last token
                        if (token.isCollapsed & !tokens[j + 1].isCollapsed) {
                            collapseStarted = false;
                            inner += `</details>`;
                        }
                    }
                }
            }

            // Finished first line
            collapseFirstLine = false;
        }

        line = line + inner + "</div>";

        return line;
    });

    // Add preClasses to <pre>
    pre_classes.value = [...preClasses.values()].join(" ");

    return raw_code.join("");
}

export {
    cleanTokens,
    tokensToHTML
};
