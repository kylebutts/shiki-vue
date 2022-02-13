<template>
<pre :style="{'background-color': bg_color}" class="py-2 rounded-md"><slot v-if="!highlighted" /><code v-else v-html="code_html"></code></pre>
</template>

<script setup>
import { ref, useSlots, watchEffect } from 'vue'
import { state } from './highlighter.js'

import { cleanTokens, tokensToHTML } from './comment_commands.js'

const props = defineProps({
    'lang': {
        type: String,
        default: 'javascript'
    },
    'theme': {
        type: String,
        default: 'github-dark'
    },
    line_numbers: {
        type: Boolean,
        default: true
    },
})

const slots = useSlots()

const code_html = ref("<span class='line'>Loading...</span>");
const highlighted = ref(true);
const bg_color = ref("#ffffff");
const pre_classes = ref("");

const pre = ref(null)


watchEffect(async () => {
    // runs before first async operation to enable reactivity
    const theme = ref(props.theme)
    try {
        state.highlighter.then((highlighter) => {
            highlighter.loadTheme(theme.value).then(() => { 
                highlighter.loadLanguage(props.lang).then(() => {
                    let lines = highlighter.codeToThemedTokens(
                        slots.default()[0].children, props.lang, theme.value
                    )

                    const hl_theme = highlighter.getTheme(theme.value)

                    // Process comments and add classes to lines
                    let clean = cleanTokens(lines)

                    // Convert comments to html 
                    let raw_code = tokensToHTML(clean.lines, clean.classes, clean.ids, hl_theme, props.line_numbers, pre_classes)

                    // Change pre background color
                    bg_color.value = highlighter.getTheme(theme.value).bg

                    // insert code
                    code_html.value = raw_code
                })
            })
        })
    } catch {
        highlighted.value = false
    }
})

</script>


<style>
/* full width line */
code {
    display: block;
    overflow-x: scroll; 
}
.line {
    font-family: 'JetBrains Mono', monospace;
    display: block;
    width: 100%;
    padding: 0rem 1rem;
    line-height: 1.75rem;
}

/* Line number */
.line-number {
    padding-right: 1rem;
    font-size: 1rem;
}

/* Focus */
pre.has-focus .line:not(.focus) {
    transition: filter 0.35s, opacity 0.35s;
    filter: blur(.095rem);
    opacity: .65;
}
pre:hover .line:not(.focus) {
    filter: blur(0px);
    opacity: 1;
}

/* Highlighting */
.line.hl {
}
summary:focus {
    outline: none;
}

/* Collapse */ 
details > summary::marker,
details > summary::-webkit-details-marker {
    display: none;
}
summary::-webkit-details-marker {
    display: none;
}
details .summary-caret::after {
    pointer-events: none;
}
.torchlight summary:focus {
    outline: none;
}
/* Hide the default markers, as we provide our own */
.torchlight details > summary::marker,
.torchlight details > summary::-webkit-details-marker {
    display: none;
}
.torchlight details .summary-caret::after {
    pointer-events: none;
}
/* Add spaces to keep everything aligned */
.torchlight .summary-caret-empty::after,
.torchlight details .summary-caret-middle::after,
.torchlight details .summary-caret-end::after {
    content: " ";
}
/* Show a minus sign when the block is open. */
.torchlight details[open] .summary-caret-start::after {
    content: "-";
}
/* And a plus sign when the block is closed. */
.torchlight details:not([open]) .summary-caret-start::after {
    content: "+";
}
/* Hide the [...] indicator when open. */
.torchlight details[open] .summary-hide-when-open {
    display: none;
}

/* Show the [...] indicator when closed. */
.torchlight details:not([open]) .summary-hide-when-open {
    display: initial;
}

/* Git Diff */
.line.git-add {
}
.line.git-remove {
}
</style>


