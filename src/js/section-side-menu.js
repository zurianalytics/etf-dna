new Vue({

    el: '#side-menu',

    data() {
        return {
            menuItems: [],
            interaction: 
            {
                menu: false
            }
        }
    },

    methods: 
    {
        smoothScrollToLink(target, e)
        {
            e.preventDefault() 
            // Scroll
            target.scrollIntoView({ behavior: 'smooth' });
            // Close menu 
            this.interaction.menu = false;
        },

        applyIntersectStyles(entries, observer)
        {
            entries.forEach(e =>
            {
                if (e.intersectionRatio > 0)
                    document.querySelectorAll('a[href="#' + e.target.id + '"]').forEach(e => e.parentElement.classList.add("active"))
                else
                    document.querySelectorAll('a[href="#' + e.target.id + '"]').forEach(e => e.parentElement.classList.remove("active"))
            })
        },
    },

    /**
     * Create the menu from the headers in the pages
     */
    mounted()
    {

        // Create a drop down for for each menu-item
        document.querySelectorAll('[menu-item][top]').forEach(topLevel =>
        {
            new IntersectionObserver(this.applyIntersectStyles).observe(topLevel);

            let h = new Object({
                'id': topLevel.id, 
                'content': topLevel.getAttribute("menu-item"), 
                'subs': [], 
                'linkTo': topLevel});
            this.menuItems.push(h)
            
            topLevel
                .querySelectorAll('[menu-item]:not([top])')
                .forEach(subLevel =>
                {
                    new IntersectionObserver(this.applyIntersectStyles).observe(subLevel);

                    h.subs.push(new Object({
                        'id': subLevel.id, 
                        'linkTo': subLevel, 
                        'content': subLevel.getAttribute("menu-item")
                        }))
                })

        })

    }
})