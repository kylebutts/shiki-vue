<script setup>
import { ref, reactive } from 'vue'
import Shiki from './components/Shiki.vue'

let dark = ref(false)

function toggleDark() {
    dark.value = !dark.value
    document.body.classList.toggle('dark')
}

</script>

<template>
<div class="w-full min-h-screen py-8 dark:bg-gray-800"><main class="max-w-prose mx-auto">

<button class="mx-auto p-2 mt-16 mb-4 border-2 rounded-md border-gray-800/60 dark:bg-gray-800 dark:text-white dark:border-gray-100/60 " @click="toggleDark">
    Toggle Dark Mode
</button>

<div class="my-4 border-2 rounded-md border-gray-800/60 dark:text-white dark:border-gray-100/60 mx-auto">
<Shiki lang="r" :theme="dark ? 'dracula' : 'github-light'" class="">
<pre>
for(i in 1:10) { # [!shiki collapse:start]
    # Do stuff

    print( i %% 2 ) # [!shiki collapse:end]
} 

print("hi") # [!shiki .text-lg.italic link(https://www.github.com):1(1,5) #line1]


zoning &lt;- here("data/zoning_atlas.shp") |> # [!shiki hl:3]
    sf::read_sf() |> 
    sf::st_transform(st_crs(parcels_pt)) |> 
    sf::st_make_valid()

print(zoning) # [!shiki + -:1,1]
print(zoning)

ggplot(
        results[results$group != "Raw", ], 
        aes(x = year, y = exp_est, group = group, color = group)
    ) +
    geom_line(aes(linetype = group), size = 2) +
    geom_point(aes(shape = group), size = 5) +
    labs(
        x = "Year", y = "Urban Wage Premium", group = "Specification", 
        shape = "Specification", color = "Specification", 
        linetype = "Specification"
    ) +
    scale_y_continuous(labels = scales::percent, limits = c(-0.05, 0.375))
</pre>
</Shiki>
</div>

<div class="my-4 border-2 rounded-md border-gray-800/60 dark:text-white dark:border-gray-100/60 mx-auto">
<Shiki lang="js" :theme="dark ? 'github-dark' : 'github-light'" class="">
<pre>
console.log(obj_a) // [!shiki +:1 text-xl:2,4]
console.log(obj_b) 
console.log(obj_a, obj_b) 
const code_html = highlighter.codeToHtml( // [!shiki collapse:start]
this.$slots.default()[0].children, 
{lang: "js", theme: "github-light"}
) // [!shiki collapse:end]


</pre>
</Shiki>
</div>

<div class="my-4 border-2 rounded-md border-gray-800/60 dark:text-white dark:border-gray-100/60 mx-auto">
<Shiki lang="cpp" :theme="dark ? 'dracula' : 'nord'"  class="">
<pre>
#include &lt;iostream>

struct Shiki // [!shiki hl:start]
{
int a;
double b;
}; // [!shiki hl:end]

int main() 
{
Shiki shiki = new Shiki(1, 2.0); // [!shiki -:1]
Shiki shiki {1, 2.0}; // [!shiki +:1]

std::cout &lt;&lt; shiki.a &lt;&lt; std::endl;
}
</pre>
</Shiki>
</div>


</main></div>
</template>

<style>
</style>
