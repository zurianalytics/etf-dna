module.exports = function(eleventyConfig) {

    // Add passthrough file copy of generated dir
    eleventyConfig.addPassthroughCopy({"src/images": "images"});
    eleventyConfig.addPassthroughCopy({"src/js/*external.js": "js"});
    eleventyConfig.addPassthroughCopy("CNAME");

    return {
      passthroughFileCopy: true
    }
  }