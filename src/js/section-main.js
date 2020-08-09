import axios from "axios";
import Chart from "chart.js";
var palette = require("./_palette");

new Vue({
  el: "#main",

  data() {
    return {
      fundCandidates: [],
      funds: [],
      api: "https://api.etf-data.com/product/",
      error: null,
      newFund: {},
    };
  },

  computed: {
    // Compute the average fee as the weighted average
    averageFee() {
      return this.funds
        .reduce(
          (accumulator, f) => accumulator + (f.alloc / 100) * f.totalFee,
          0
        )
        .toFixed(2);
    },

    distributionType(){
        let dists = new Set(this.funds.map(f => f.distributionType))

        if (dists.size > 1)
            return "Mixed"
        
        return dists.values().next().value
    },

    // Compute sector allocations as weighter averages
    sectors() {
      let sectors = {};

      this.funds.forEach((f) =>
        f.sectors.forEach((s) => {
          // Format Stuff like Informatio_Technology --> IT
          let sector = s.sector.includes("_")
            ? s.sector.split("_")[0].charAt(0) +
              s.sector.split("_")[1].charAt(0)
            : s.sector;
          if (!sectors[sector]) sectors[sector] = 0;
          sectors[sector] += (f.alloc * s.percentage) / 100;
          return sectors;
        })
      );

      return Object.keys(sectors)
        .map((k) => new Object({ k: k, v: sectors[k] }))
        .sort((a, b) => b.v - a.v);
    },

    regions() {
      let regions = {};

      this.funds.forEach((f) =>
        f.regions.forEach((r) => {
          if (!regions[r.country]) regions[r.country] = 0;
          regions[r.country] += (f.alloc * r.percentage) / 100;
          return regions;
        })
      );

      return Object.keys(regions)
        .map((k) => new Object({ k: k, v: regions[k] }))
        .sort((a, b) => b.v - a.v);
    },
  },

  watch: {
    // Redraw sectors chart when one of the sectors changes
    sectors(s) {
      if (this.sectorsChart) this.sectorsChart.destroy();
      this.sectorsChart = this.drawChart("sectors", "Sector Allocation", s, "right");
    },
    // Redraw regions chart when one of the region changes
    regions(s) {
      if (this.regionsChart) this.regionsChart.destroy();
      this.regionsChart = this.drawChart("regions", "Geographic Allocation", s, "left");
    },
  },

  methods: {

    addFund()
    {
        this.addFund(this.newFund)
    },

    remove (index) {
        this.$delete(this.funds, index)
        window.location.hash = JSON.stringify(this.funds.map(f => new Object({isin: f.isin, alloc: f.alloc})))
    },

    extendChartJSWithTextInside() {
      Chart.pluginService.register({
        beforeDraw: function (chart) {
          if (chart.config.options.elements.center) {
            // Get ctx from string
            var ctx = chart.chart.ctx;

            // Get options from the center object in options
            var centerConfig = chart.config.options.elements.center;
            var fontStyle = centerConfig.fontStyle || "Arial";
            var txt = centerConfig.text;
            var color = centerConfig.color || "#000";
            var maxFontSize = centerConfig.maxFontSize || 75;
            var sidePadding = centerConfig.sidePadding || 20;
            var sidePaddingCalculated =
              (sidePadding / 100) * (chart.innerRadius * 2);
            // Start with a base font of 30px
            ctx.font = "30px " + fontStyle;

            // Get the width of the string and also the width of the element minus 10 to give it 5px side padding
            var stringWidth = ctx.measureText(txt).width;
            var elementWidth = chart.innerRadius * 2 - sidePaddingCalculated;

            // Find out how much the font can grow in width.
            var widthRatio = elementWidth / stringWidth;
            var newFontSize = Math.floor(30 * widthRatio);
            var elementHeight = chart.innerRadius * 2;

            // Pick a new font size so it will not be larger than the height of label.
            var fontSizeToUse = Math.min(
              newFontSize,
              elementHeight,
              maxFontSize
            );
            var minFontSize = centerConfig.minFontSize;
            var lineHeight = centerConfig.lineHeight || 25;
            var wrapText = false;

            if (minFontSize === undefined) {
              minFontSize = 20;
            }

            if (minFontSize && fontSizeToUse < minFontSize) {
              fontSizeToUse = minFontSize;
              wrapText = true;
            }

            // Set font settings to draw it correctly.
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            var centerX = (chart.chartArea.left + chart.chartArea.right) / 2;
            var centerY = (chart.chartArea.top + chart.chartArea.bottom) / 2;
            ctx.font = fontSizeToUse + "px " + fontStyle;
            ctx.fillStyle = color;

            if (!wrapText) {
              ctx.fillText(txt, centerX, centerY);
              return;
            }

            var words = txt.split(" ");
            var line = "";
            var lines = [];

            // Break words up into multiple lines if necessary
            for (var n = 0; n < words.length; n++) {
              var testLine = line + words[n] + " ";
              var metrics = ctx.measureText(testLine);
              var testWidth = metrics.width;
              if (testWidth > elementWidth && n > 0) {
                lines.push(line);
                line = words[n] + " ";
              } else {
                line = testLine;
              }
            }

            // Move the center up depending on line height and number of lines
            centerY -= (lines.length / 2) * lineHeight;

            for (var n = 0; n < lines.length; n++) {
              ctx.fillText(lines[n], centerX, centerY);
              centerY += lineHeight;
            }
            //Draw text in center
            ctx.fillText(line, centerX, centerY);
          }
        },
      });
    },

    drawChart(element, title, data, position) {
      // Standarize data to 100 
      let other = 100 - data.reduce((acc, d) => acc + d.v, 0)
      
      if (other > 1)
        data.push({k: 'OTH', v: other})
    
      // And for a doughnut chart
      return new Chart(document.getElementById(element).getContext("2d"), {
        type: "doughnut",
        data: {
          datasets: [
            {
              data: data.map((s) => s.v),
              backgroundColor: [
                "hsla(227, 52%, 25%, 1)",
                "hsla(227, 50%, 50%, 1)",
                "hsla(227, 80%, 70%, 1)",
                "hsla(200, 80%, 70%, 1)",
                "hsla(200, 50%, 50%, 1)",
                "hsla(200, 52%, 25%, 1)",
                "hsla(154, 45%, 40%, 1)",
                "hsla(154, 45%, 50%, 1)",
                "hsla(154, 55%, 57%, 1)",
                "hsla(124, 55%, 57%, 1)",
                "hsla(124, 45%, 50%, 1)",
                "hsla(124, 45%, 40%, 1)",
                "hsla(88, 55%, 57%, 1)",
                "hsla(88, 45%, 50%, 1)",
                "hsla(88, 45%, 40%, 1)",
                "hsla(60, 55%, 57%, 1)",
                "hsla(60, 45%, 50%, 1)",
                "hsla(60, 45%, 40%, 1)",
              ],
            },
          ],

          // These labels appear in the legend and in the tooltips when hovering different arcs
          labels: data.map((s) => s.k).map((s) => s.padEnd(25, " ")),
        },
        options: {
          elements: {
            center: {
              text: title,
              color: "#8498b3", // Default is #000000
              fontStyle: "Arial", // Default is Arial
              sidePadding: 20, // Default is 20 (as a percentage)
              minFontSize: 14, // Default is 20 (in px), set to false and text will not wrap.
              lineHeight: 25, // Default is 25 (in px), used for when text wraps
            },
          },

          legend: {
            position: position,
            labels: {
              boxWidth: 20,
              fontSize: 12,
              usePointStyle: true,
            },
          },
        },
      });
    },

    getFundsFromUrl() {
      let fundCandidates = window.location.hash;

      // Fresh page without any fudns
      if (!fundCandidates) return;

      // Someone linked to some funds
      this.fundCandidates = JSON.parse(
        unescape(window.location.hash.substr(1))
      );

      // For each fund candidate get, the fund details
      this.fundCandidates.forEach(this.addFund);
    },

    addFund(fundCandidate)
    {
        console.log(fundCandidate);

        axios
            .get(this.api + fundCandidate.isin)
            .then((response) => {
            let fund = response.data;
            fund.alloc = fundCandidate.alloc;
            this.funds.push(fund);
            this.error = null

            window.location.hash = JSON.stringify(this.funds.map(f => new Object({isin: f.isin, alloc: f.alloc})))
            })
            // Free requests have expired
            .catch((error) => {
            console.error(error);

            if (typeof error.response === "undefined")
                this.error = "Unspecified error occured.";
            else if (error && error.response.status == 404)
                this.error =
                "Unfortunatelly the fund provided could not be found. Is this ISIN available on an european exchange?";
            else if (error && error.response.status == 401)
                this.error =
                "Unfortunatelly your free requests have expired." +
                " Please feel free to visit again tomorrow, or subscribe to a plan.";
            });
    }
  },

  /**
   * Initialize functions when the Vue instance is mountes
   */
  mounted() {
    this.extendChartJSWithTextInside();
    this.getFundsFromUrl();
  },
});
