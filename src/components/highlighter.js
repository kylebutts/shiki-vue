import { reactive } from 'vue'
import { setCDN, getHighlighter } from 'shiki'

// Load shiki highlighter
setCDN('./node_modules/shiki/')
// setCDN('https://unpkg.com/shiki/')

const highlighter = getHighlighter(
    {themes: ["github-dark"], langs: ['javascript']}
) 

export const state = reactive({
    highlighter: highlighter
})
