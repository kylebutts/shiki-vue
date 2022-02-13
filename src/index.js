// For exporting Shiki to dist

import Shiki from './components/Shiki.vue'

export default {
    install: (app, options) => {
        app.component('Shiki', Shiki)
    }
};

